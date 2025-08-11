import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = {
      hasPublishableKey: Boolean(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      ),
      hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
      hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      currency: process.env.STRIPE_CURRENCY || "usd",
      appBaseUrl:
        process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || null,
    };
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
