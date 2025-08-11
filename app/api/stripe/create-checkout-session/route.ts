import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import connectToDatabase from "@/utils/config/dbConnection";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    await connectToDatabase();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentMethod !== "online") {
      return NextResponse.json(
        { error: "Order is not marked for online payment" },
        { status: 400 }
      );
    }

    // Build line items from products
    const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();

    const products = await Product.find({
      _id: { $in: order.items.map((i: any) => i.id) },
    });
    const productIdToProduct: Record<string, any> = {};
    for (const p of products) {
      productIdToProduct[p._id.toString()] = p;
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item: any) => {
        const prod = productIdToProduct[item.id.toString()];
        const unitAmount = Math.round((prod?.price || 0) * 100);
        return {
          quantity: item.quantity,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: prod?.name?.en || prod?.name || "Product",
            },
          },
        };
      });

    // Add delivery as a separate line item if needed
    if (order.deliveryCost && order.deliveryCost > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(order.deliveryCost * 100),
          product_data: { name: "Delivery" },
        },
      });
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" });

    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    if (!appBaseUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL or NEXTAUTH_URL" },
        { status: 500 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${appBaseUrl}/checkout/success?orderId=${order._id}`,
      cancel_url: `${appBaseUrl}/checkout?canceled=1&orderId=${order._id}`,
      metadata: {
        orderId: order._id.toString(),
        userEmail: order.email,
      },
    });

    return NextResponse.json({ id: checkoutSession.id });
  } catch (error) {
    console.error("Create checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
