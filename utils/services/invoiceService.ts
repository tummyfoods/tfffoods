import Invoice from "../models/Invoice";
import mongoose from "mongoose";
import { Order } from "../models/Order";

// Define the clients map at module level
const invoiceClients = new Map<string, WritableStreamDefaultWriter>();

export async function broadcastInvoiceUpdate() {
  try {
    // Get latest invoices
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    // Broadcast to all connected clients
    if (invoiceClients.size > 0) {
      const encoder = new TextEncoder();
      const data = `data: ${JSON.stringify({ invoices })}\n\n`;

      for (const writer of invoiceClients.values()) {
        try {
          await writer.write(encoder.encode(data));
        } catch (error) {
          console.error("Error writing to client:", error);
          // Client probably disconnected, will be cleaned up on their end
        }
      }
    }
  } catch (error) {
    console.error("Error broadcasting invoice update:", error);
  }
}

// Export functions to manage clients
export function addInvoiceClient(
  id: string,
  writer: WritableStreamDefaultWriter
) {
  invoiceClients.set(id, writer);
}

export function removeInvoiceClient(id: string) {
  invoiceClients.delete(id);
}

export async function cleanupEmptyPeriodInvoices() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Finding period invoices with 0 orders...");
    const invalidInvoices = await Invoice.find({
      invoiceType: "period",
      $or: [
        { orders: { $exists: false } },
        { orders: null },
        { orders: [] },
        { orders: { $size: 0 } },
      ],
    }).session(session);

    console.log(
      `Found ${invalidInvoices.length} invalid period invoices to clean up`
    );

    for (const invoice of invalidInvoices) {
      console.log(`Deleting invalid period invoice: ${invoice.invoiceNumber}`);
      await Invoice.findByIdAndDelete(invoice._id).session(session);
    }

    await session.commitTransaction();
    console.log("Cleanup completed successfully");

    // Broadcast the update to all connected clients
    await broadcastInvoiceUpdate();
  } catch (error) {
    await session.abortTransaction();
    console.error("Error during cleanup:", error);
    throw error;
  } finally {
    session.endSession();
  }
}

// Add this function to be called when an order is deleted
export async function removeOrderFromInvoices(orderId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(`Finding invoices containing order ${orderId}...`);

    // Get the order details first
    const order = await Order.findById(orderId);
    if (!order) {
      console.log(
        `Order ${orderId} not found, proceeding with invoice cleanup...`
      );
    }

    // Find all invoices containing this order
    const invoices = await Invoice.find({ orders: orderId }).session(session);
    console.log(`Found ${invoices.length} invoices containing the order`);

    for (const invoice of invoices) {
      console.log(`Processing invoice ${invoice.invoiceNumber}...`);

      // Remove the order from the invoice's orders array
      invoice.orders = invoice.orders.filter(
        (id: mongoose.Types.ObjectId) => id.toString() !== orderId
      );

      // Remove the items from this order from the invoice's items array
      if (order) {
        interface OrderItem {
          id: mongoose.Types.ObjectId;
          quantity: number;
        }

        const orderItemIds = order.items.map((item: OrderItem) =>
          item.id.toString()
        );

        // Subtract the order's amount from the invoice total
        invoice.amount -= order.total;

        // Remove the items that belong to this order
        invoice.items = invoice.items.filter(
          (item: any) => !orderItemIds.includes(item.product.toString())
        );
      }

      // If it's a period invoice and now has no orders, delete it
      if (invoice.invoiceType === "period" && invoice.orders.length === 0) {
        console.log(`Deleting empty period invoice ${invoice.invoiceNumber}`);
        await Invoice.findByIdAndDelete(invoice._id).session(session);
      } else {
        // Otherwise just save the updated invoice
        console.log(
          `Updating invoice ${invoice.invoiceNumber} with ${invoice.orders.length} remaining orders`
        );
        await invoice.save({ session });
      }
    }

    await session.commitTransaction();

    // Broadcast the update to all connected clients
    await broadcastInvoiceUpdate();
    console.log("Invoice cleanup completed successfully");
  } catch (error) {
    await session.abortTransaction();
    console.error("Error removing order from invoices:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      orderId,
    });
    throw error;
  } finally {
    session.endSession();
  }
}

export async function forceCleanupInvalidInvoices() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Starting invoice cleanup...");

    // Find all invoices
    const allInvoices = await Invoice.find().session(session);
    console.log(`Found ${allInvoices.length} total invoices`);

    let cleanedCount = 0;
    let updatedCount = 0;

    for (const invoice of allInvoices) {
      // Check if all orders in this invoice actually exist
      const orderIds = invoice.orders || [];
      const existingOrders = await Order.find({
        _id: { $in: orderIds },
      }).session(session);

      const existingOrderIds = existingOrders.map((o) => o._id.toString());
      const invalidOrderIds = orderIds.filter(
        (id: mongoose.Types.ObjectId) =>
          !existingOrderIds.includes(id.toString())
      );

      // Delete if it's a period invoice with no valid orders OR a one-time invoice with no orders
      if (existingOrderIds.length === 0) {
        console.log(
          `Deleting empty ${invoice.invoiceType} invoice ${invoice.invoiceNumber}`
        );
        await Invoice.findByIdAndDelete(invoice._id).session(session);
        cleanedCount++;
        continue;
      }

      // For invoices with some invalid orders, just remove the invalid ones
      if (invalidOrderIds.length > 0) {
        console.log(
          `Updating invoice ${invoice.invoiceNumber} to remove ${invalidOrderIds.length} invalid orders`
        );
        invoice.orders = existingOrderIds;

        // Recalculate total amount and items
        let totalAmount = 0;
        const validItems = [];

        for (const order of existingOrders) {
          totalAmount += order.total;
          validItems.push(...order.cartProducts);
        }

        // Update invoice with correct data
        invoice.amount = totalAmount;
        invoice.items = validItems;
        await invoice.save({ session });
        updatedCount++;
      }
    }

    await session.commitTransaction();
    console.log(
      `Cleanup completed: ${cleanedCount} deleted, ${updatedCount} updated`
    );

    // Broadcast the update
    await broadcastInvoiceUpdate();

    return {
      success: true,
      cleanedCount,
      updatedCount,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error during cleanup:", error);
    throw error;
  } finally {
    session.endSession();
  }
}
