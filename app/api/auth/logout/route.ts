import { NextResponse } from "next/server";

export async function POST() {
  const isProd = process.env.NODE_ENV === "production";
  const domain = isProd ? ".tfffoods.com" : undefined;

  // Debug logging
  console.log("LOGOUT DEBUG - Environment:", {
    isProd,
    domain,
  });

  const cookieOptions = {
    path: "/",
    domain: domain,
    secure: true,
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 0,
  };

  // Additional options for root domain cookies
  const rootCookieOptions = {
    ...cookieOptions,
    domain: isProd ? "tfffoods.com" : undefined,
  };

  const response = new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

  // Clear all possible variations of auth cookies
  const cookieNames = [
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.callback-url",
    "__Host-next-auth.csrf-token",
    "next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
    "__Secure-next-auth.pkce.code_verifier",
    "next-auth.pkce.code_verifier",
  ];

  // Get all cookies from request
  const cookieHeader = headers().get("cookie") || "";
  const existingCookies = cookieHeader.split("; ").reduce((acc, cookie) => {
    const [name, value] = cookie.split("=");
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

  // Find and clear ALL session-related cookies
  Object.keys(existingCookies).forEach((name) => {
    if (name.includes("next-auth") || cookieNames.includes(name)) {
      // Clear with all possible domain combinations
      response.cookies.set(name, "LOGGED_OUT", {
        ...cookieOptions,
        maxAge: 0,
        expires: new Date(0)
      });

      response.cookies.set(name, "LOGGED_OUT", {
        ...rootCookieOptions,
        maxAge: 0,
        expires: new Date(0)
      });

      response.cookies.set(name, "LOGGED_OUT", {
        ...cookieOptions,
        domain: undefined,
        maxAge: 0,
        expires: new Date(0)
      });

      // Also try root path
      response.cookies.set(name, "LOGGED_OUT", {
        ...cookieOptions,
        path: "/",
        maxAge: 0,
        expires: new Date(0)
      });
    }
  });

  return response;
}
