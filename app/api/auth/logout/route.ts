import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear all auth-related cookies
  response.cookies.delete("__Secure-next-auth.session-token");
  response.cookies.delete("__Secure-next-auth.callback-url");
  response.cookies.delete("__Host-next-auth.csrf-token");

  // Also clear them for the root domain
  response.cookies.delete("__Secure-next-auth.session-token", {
    domain: ".tfffoods.com",
    path: "/",
  });
  response.cookies.delete("__Secure-next-auth.callback-url", {
    domain: ".tfffoods.com",
    path: "/",
  });
  response.cookies.delete("__Host-next-auth.csrf-token", {
    domain: ".tfffoods.com",
    path: "/",
  });

  return response;
}
