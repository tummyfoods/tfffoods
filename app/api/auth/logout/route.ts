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

  cookieNames.forEach((name) => {
    // Try all domain variations to ensure complete cleanup
    response.cookies.delete(name, cookieOptions);
    response.cookies.delete(name, rootCookieOptions);

    // Try without domain (especially for __Host- prefixed cookies)
    response.cookies.delete(name, {
      ...cookieOptions,
      domain: undefined,
    });

    // Try with root path and different domain combinations
    response.cookies.delete(name, {
      ...cookieOptions,
      path: "/",
    });
    response.cookies.delete(name, {
      ...rootCookieOptions,
      path: "/",
    });
    response.cookies.delete(name, {
      ...cookieOptions,
      domain: undefined,
      path: "/",
    });
  });

  return response;
}
