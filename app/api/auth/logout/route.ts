import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const isProd = process.env.NODE_ENV === "production";
  const domain = isProd ? ".tfffoods.com" : undefined;

  const cookieOptions = {
    path: "/",
    domain: domain,
    secure: true,
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 0, // Immediately expire the cookie
  };

  // Clear all auth-related cookies with proper security settings
  response.cookies.delete("__Secure-next-auth.session-token", cookieOptions);
  response.cookies.delete("__Secure-next-auth.callback-url", cookieOptions);
  response.cookies.delete("__Host-next-auth.csrf-token", {
    ...cookieOptions,
    domain: undefined, // This cookie doesn't accept domain setting
  });

  // Also try clearing without Secure- prefix for local development
  if (!isProd) {
    response.cookies.delete("next-auth.session-token", cookieOptions);
    response.cookies.delete("next-auth.callback-url", cookieOptions);
    response.cookies.delete("next-auth.csrf-token", {
      ...cookieOptions,
      domain: undefined,
    });
  }

  return response;
}
