import InvoiceCounter from "@/utils/models/InvoiceCounter";

class InvoiceNumberService {
  /**
   * Generate order reference number
   * Format: ORD-{YEAR}{MONTH}-{SEQUENTIAL_NUMBER}
   * Example: ORD-202412-0001
   */
  async generateOrderReference(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const counter = await InvoiceCounter.findOneAndUpdate(
      {
        year,
        month,
        periodType: "order",
        periodNumber: 1,
      },
      {
        $inc: { sequence: 1 },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const sequenceStr = counter.sequence.toString().padStart(4, "0");
    const monthStr = month.toString().padStart(2, "0");

    return `ORD-${year}${monthStr}-${sequenceStr}`;
  }

  /**
   * Generate one-time invoice number
   * Format: INV-{YEAR}{MONTH}-{SEQUENTIAL_NUMBER}
   * Example: INV-202412-0001
   */
  async generateOneTimeInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const counter = await InvoiceCounter.findOneAndUpdate(
      {
        year,
        month,
        periodType: "one-time",
        periodNumber: 1,
      },
      {
        $inc: { sequence: 1 },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const sequenceStr = counter.sequence.toString().padStart(4, "0");
    const monthStr = month.toString().padStart(2, "0");

    return `INV-${year}${monthStr}-${sequenceStr}`;
  }

  /**
   * Generate period invoice number
   * Format: PER-{YEAR}{MONTH}-{PERIOD_TYPE}-{PERIOD_NUMBER}-{SEQUENTIAL_NUMBER}
   * Example: PER-202412-W-01-001 (Weekly Period 1, Invoice 1)
   */
  async generatePeriodInvoiceNumber(
    periodType: "weekly" | "monthly",
    periodNumber: number
  ): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const counter = await InvoiceCounter.findOneAndUpdate(
      {
        year,
        month,
        periodType: periodType === "weekly" ? "weekly" : "monthly",
        periodNumber,
      },
      {
        $inc: { sequence: 1 },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const sequenceStr = counter.sequence.toString().padStart(3, "0");
    const monthStr = month.toString().padStart(2, "0");
    const periodNumberStr = periodNumber.toString().padStart(2, "0");
    const periodTypeChar = periodType === "weekly" ? "W" : "M";

    return `PER-${year}${monthStr}-${periodTypeChar}-${periodNumberStr}-${sequenceStr}`;
  }

  /**
   * Get next sequence number for a specific period
   */
  async getNextSequence(
    year: number,
    month: number,
    periodType: string,
    periodNumber: number = 1
  ): Promise<number> {
    const counter = await InvoiceCounter.findOne({
      year,
      month,
      periodType,
      periodNumber,
    });

    return counter ? counter.sequence + 1 : 1;
  }

  /**
   * Get current period number for a user
   */
  async getCurrentPeriodNumber(
    periodType: "weekly" | "monthly",
    startDate: Date
  ): Promise<number> {
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;

    if (periodType === "weekly") {
      // Calculate week number within the month
      const firstDayOfMonth = new Date(year, month - 1, 1);
      const daysDiff = Math.floor(
        (startDate.getTime() - firstDayOfMonth.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return Math.floor(daysDiff / 7) + 1;
    } else {
      // For monthly, it's always 1 per month
      return 1;
    }
  }
}

const invoiceNumberService = new InvoiceNumberService();
export default invoiceNumberService;
