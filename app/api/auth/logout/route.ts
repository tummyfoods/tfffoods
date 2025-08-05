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

  // Instead of deleting cookies, set them to invalid values to force session termination
  cookieNames.forEach((name) => {
    const invalidValue = "LOGGED_OUT_" + Date.now();
    
    // Set invalid values with all possible combinations
    response.cookies.set(name, invalidValue, {
      ...cookieOptions,
      maxAge: 0,
      expires: new Date(0)
    });

    response.cookies.set(name, invalidValue, {
      ...rootCookieOptions,
      maxAge: 0,
      expires: new Date(0)
    });

    // Also set without domain for __Host- cookies
    if (name.startsWith("__Host-")) {
      response.cookies.set(name, invalidValue, {
        ...cookieOptions,
        domain: undefined,
        maxAge: 0,
        expires: new Date(0)
      });
    }
  });

  return response;
}
