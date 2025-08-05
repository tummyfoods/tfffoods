import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    // Get all cookies
    const cookies = Object.fromEntries(
      Object.entries(
        // @ts-ignore - headers exists on Request
        Object.fromEntries(new Headers(headers()).entries())
      ).filter(([key]) => key.toLowerCase().includes("cookie"))
    );

    // Return detailed debug info
    return NextResponse.json({
      session: {
        exists: !!session,
        user: session?.user || null,
        expires: session?.expires || null,
      },
      cookies,
      headers: {
        // @ts-ignore - headers exists on Request
        all: Object.fromEntries(new Headers(headers()).entries()),
      },
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error("Session test error:", error);
    return NextResponse.json({ error: "Failed to get session info" }, { status: 500 });
  }
}