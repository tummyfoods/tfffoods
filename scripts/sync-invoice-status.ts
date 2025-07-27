import { Order } from "../utils/models/Order";
import Invoice from "../utils/models/Invoice";
import connectDB from "../utils/mongodb";
import mongoose from "mongoose";

async function syncInvoiceStatuses() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // Find all paid orders
    const paidOrders = await Order.find({
      $or: [{ paid: true }, { status: "processing" }, { status: "delivered" }],
    });

    console.log(`Found ${paidOrders.length} paid orders to process`);
    let updatedCount = 0;

    // Group orders by invoice number
    const invoiceGroups = new Map();
    for (const order of paidOrders) {
      const invoiceNumber = order.invoiceNumber;
      if (invoiceNumber) {
        if (!invoiceGroups.has(invoiceNumber)) {
          invoiceGroups.set(invoiceNumber, []);
        }
        invoiceGroups.get(invoiceNumber).push(order);
      }
    }

    // Process each invoice group
    for (const [invoiceNumber, orders] of invoiceGroups) {
      const invoice = await Invoice.findOne({ invoiceNumber });
      if (invoice && invoice.status !== "paid") {
        // For period invoices, check if all orders in the period are paid
        if (invoice.invoiceType === "period") {
          const allInvoiceOrders = await Order.find({ invoiceNumber });
          const allPaid = allInvoiceOrders.every(
            (o) =>
              o.paid || o.status === "processing" || o.status === "delivered"
          );

          if (allPaid) {
            await Invoice.findOneAndUpdate(
              { invoiceNumber },
              {
                status: "paid",
                paymentDate: new Date(
                  Math.max(...orders.map((o) => o.updatedAt.getTime()))
                ),
              }
            );
            updatedCount++;
            console.log(
              `Updated period invoice ${invoiceNumber} to paid status (all orders paid)`
            );
          }
        } else {
          // For one-time invoices, update immediately
          await Invoice.findOneAndUpdate(
            { invoiceNumber },
            {
              status: "paid",
              paymentDate: orders[0].updatedAt,
            }
          );
          updatedCount++;
          console.log(`Updated invoice ${invoiceNumber} to paid status`);
        }
      }
    }

    console.log(`\nSync completed: Updated ${updatedCount} invoices`);
    process.exit(0);
  } catch (error) {
    console.error("Error syncing invoice statuses:", error);
    process.exit(1);
  }
}

syncInvoiceStatuses();
