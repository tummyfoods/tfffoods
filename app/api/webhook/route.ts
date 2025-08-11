import { NextResponse } from "next/server";
import { Order } from "@/utils/models/Order";
import dbConnect from "@/utils/config/dbConnection";
import Product from "@/utils/models/Product";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    console.log("🎯 Webhook received");
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // If Stripe signature is present, verify and parse Stripe event
    let event: any = null;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (sig && webhookSecret && stripeSecret) {
      try {
        const stripe = new Stripe(stripeSecret, { apiVersion: "2024-12-18" });
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err) {
        console.error("❌ Stripe webhook signature verification failed:", err);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    } else {
      // Fallback: Try parse JSON for non-Stripe providers (e.g., Brevo)
      try {
        event = JSON.parse(body);
      } catch {
        event = null;
      }
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

    // Handle Stripe events
    if (sig && event?.type) {
      console.log("🔍 Stripe event type:", event.type);
      if (event.type === "checkout.session.completed") {
        await dbConnect();
        const session = event.data.object as {
          metadata?: Record<string, string>;
        };
        const orderId = session.metadata?.orderId;
        if (!orderId) {
          return NextResponse.json(
            { error: "No orderId in metadata" },
            { status: 400 }
          );
        }

        const order = await Order.findById(orderId);
        if (!order) {
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }

        for (const item of order.items) {
          const product = await Product.findById(item.id);
          if (product) {
            const newStock = Math.max(
              0,
              (product.stock || 0) - (item.quantity || 0)
            );
            await Product.findByIdAndUpdate(item.id, { stock: newStock });
          }
        }

        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          { paid: true, status: "processing" },
          { new: true }
        );

        console.log("✨ Order updated (Stripe):", updatedOrder?._id);
        return NextResponse.json({ received: true });
      }

      // Ignore other Stripe event types for now
      return NextResponse.json({ received: true });
    }
    // If not Stripe: treat as Brevo and no-op
    console.log("➡️ Non-Stripe event received");
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
