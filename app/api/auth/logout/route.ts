import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST() {
  const isProd = process.env.NODE_ENV === "production";
  const domain = isProd ? ".tfffoods.com" : undefined;

  // Debug logging
  const headersList = headers();
  console.log("LOGOUT DEBUG - Environment:", {
    isProd,
    domain,
    cookies: headersList.get("cookie"),
  });

  const cookieOptions = {
    path: "/",
    domain: domain,
    secure: true,
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 0,
    expires: new Date(0),
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

  // Clear all auth-related cookies with consistent domain
  cookieNames.forEach((name) => {
    // First delete the cookie
    response.cookies.delete(name, cookieOptions);

    // Then set an expired cookie to ensure it's cleared
    response.cookies.set(name, "", {
      ...cookieOptions,
      value: "",
      maxAge: 0,
      expires: new Date(0),
    });

    // Also try without domain for __Host- prefixed cookies
    if (name.startsWith("__Host-")) {
      response.cookies.delete(name, {
        ...cookieOptions,
        domain: undefined,
      });
      response.cookies.set(name, "", {
        ...cookieOptions,
        domain: undefined,
        value: "",
        maxAge: 0,
        expires: new Date(0),
      });
    }
  });

  return response;
}
