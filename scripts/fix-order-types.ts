import { connectToDatabase } from "@/utils/database";
import { Order } from "@/utils/models/Order";
import Invoice from "@/utils/models/Invoice";

async function fixOrderTypes() {
  try {
    await connectToDatabase();
    console.log("Connected to database");

    // Find all orders
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders to check`);

    let updatedCount = 0;
    let periodCount = 0;
    let onetimeCount = 0;

    for (const order of orders) {
      let needsUpdate = false;
      const updates: any = {};

      // Set orderType based on paymentMethod if not set
      if (!order.orderType) {
        needsUpdate = true;
        if (order.paymentMethod === "periodInvoice") {
          updates.orderType = "period-order";
          periodCount++;
        } else {
          updates.orderType = "onetime-order";
          onetimeCount++;
        }
      }

      // For period orders, ensure periodInvoiceNumber is set
      if (
        order.paymentMethod === "periodInvoice" &&
        !order.periodInvoiceNumber
      ) {
        // Find the invoice that contains this order
        const invoice = await Invoice.findOne({ orders: order._id });
        if (invoice) {
          needsUpdate = true;
          updates.periodInvoiceNumber = invoice.invoiceNumber;
        }
      }

      if (needsUpdate) {
        await Order.findByIdAndUpdate(order._id, updates);
        updatedCount++;
        console.log(`Updated order ${order._id}:`, updates);
      }
    }

    console.log("\nUpdate Summary:");
    console.log(`Total orders processed: ${orders.length}`);
    console.log(`Orders updated: ${updatedCount}`);
    console.log(`Period orders found/fixed: ${periodCount}`);
    console.log(`One-time orders found/fixed: ${onetimeCount}`);
  } catch (error) {
    console.error("Error fixing order types:", error);
  } finally {
    process.exit(0);
  }
}

fixOrderTypes();
