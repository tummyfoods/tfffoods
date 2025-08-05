import mongoose from "mongoose";
import Invoice from "@/utils/models/Invoice";
import { Order } from "@/utils/models/Order";
import dbConnect from "@/utils/config/dbConnection";

async function fixInvoiceAmounts() {
  try {
    console.log("Connecting to database...");
    await dbConnect();

    console.log("Finding all invoices...");
    const invoices = await Invoice.find().populate({
      path: "orders",
      model: Order,
      select: "total",
    });
    console.log(`Found ${invoices.length} invoices to check`);

    let fixedCount = 0;
    for (const invoice of invoices) {
      // Calculate correct total from orders
      const correctTotal = invoice.orders.reduce(
        (sum: number, order: any) => sum + (order.total || 0),
        0
      );

      // If stored amount is different from calculated total
      if (invoice.amount !== correctTotal) {
        console.log(`
Invoice ${invoice.invoiceNumber}:
- Stored amount: ${invoice.amount}
- Correct amount: ${correctTotal}
- Difference: ${correctTotal - invoice.amount}
`);

        // Update the invoice amount
        invoice.amount = correctTotal;
        await invoice.save();
        fixedCount++;
      }
    }

    console.log(`
Summary:
- Total invoices checked: ${invoices.length}
- Invoices fixed: ${fixedCount}
`);
  } catch (error) {
    console.error("Error fixing invoice amounts:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the fix
fixInvoiceAmounts();
