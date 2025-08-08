import { NextResponse } from "next/server";
import { Order } from "@/utils/models/Order";
import dbConnect from "@/utils/config/dbConnection";
import Product from "@/utils/models/Product";

export async function POST(req: Request) {
  try {
    console.log("🎯 Webhook received");
    const bodyText = await req.text();
    console.log("📝 Raw webhook body:", bodyText);

    // Try to detect Brevo webhook (transactional events)
    // Brevo typically sends JSON with 'event' field like delivered, opened, bounce, spam
    let event: any;
    try {
      event = JSON.parse(bodyText);
    } catch {
      event = null;
    }

    // Handle Brevo transactional webhook minimally (no-op storage)
    if (event) {
      if (Array.isArray(event)) {
        for (const e of event) {
          console.log("📨 Brevo webhook (array):", {
            event: e.event,
            messageId: e.messageId,
            email: e.email,
            reason: e.reason,
            date: e.date,
          });
        }
        return NextResponse.json({ received: true });
      }

      if (event.event || event.messageId) {
        console.log("📨 Brevo webhook:", {
          event: event.event,
          messageId: event.messageId,
          email: event.email,
          reason: event.reason,
          date: event.date,
        });
        return NextResponse.json({ received: true });
      }
    }

    // Fallback: existing Stripe-like webhook payload
    const eventStripeLike = event;
    console.log("🔍 Event type:", eventStripeLike?.type);

    // Only handle successful checkouts
    if (eventStripeLike?.type === "checkout.session.completed") {
      // Connect to DB only for Stripe-like checkout events
      await dbConnect();
      console.log("✅ Processing checkout.session.completed event");
      const session = eventStripeLike.data.object;
      const orderId = session.metadata?.orderId;
      console.log("📦 Order ID from metadata:", orderId);

      if (!orderId) {
        console.error("❌ No order ID found in session metadata");
        return NextResponse.json(
          { error: "No order ID in metadata" },
          { status: 400 }
        );
      }

      // Find the order and get its products
      const order = await Order.findById(orderId);
      if (!order) {
        console.error("❌ Order not found");
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Update stock for each product in the order
      for (const item of order.cartProducts) {
        const product = await Product.findById(item.product);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await Product.findByIdAndUpdate(item.product, { stock: newStock });
          console.log(
            `📦 Updated stock for product ${product.name}: ${product.stock} -> ${newStock}`
          );
        }
      }

      // Update the order status
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          paid: true,
          status: "processing",
        },
        { new: true }
      );

      console.log("🔄 Updated order:", updatedOrder);

      if (!updatedOrder) {
        console.error("❌ Failed to update order");
        return NextResponse.json(
          { error: "Failed to update order" },
          { status: 400 }
        );
      }

      console.log("✨ Order successfully updated");
      return NextResponse.json({ success: true });
    }

    console.log("➡️ Event type not handled:", event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  // Brevo "Test" button sometimes performs a GET. Return fast 200.
  return NextResponse.json({ ok: true, service: "webhook" });
}
