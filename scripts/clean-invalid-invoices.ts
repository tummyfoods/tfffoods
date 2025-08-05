require("dotenv").config();
const mongoose = require("mongoose");
const Invoice = require("../utils/models/Invoice").default;

async function cleanupInvalidInvoices() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI!);

    console.log("Finding period invoices with 0 orders...");
    const invalidInvoices = await Invoice.find({
      invoiceType: "period",
      $or: [
        { orders: { $size: 0 } },
        { orders: { $exists: false } },
        { orders: null },
      ],
    });

    console.log(`Found ${invalidInvoices.length} invalid period invoices`);

    for (const invoice of invalidInvoices) {
      console.log(`Deleting invalid period invoice: ${invoice.invoiceNumber}`);
      await Invoice.findByIdAndDelete(invoice._id);
    }

    console.log("Cleanup completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupInvalidInvoices();
