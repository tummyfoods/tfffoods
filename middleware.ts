import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { logger } from "@/utils/logger";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/about",
  "/contact",
  "/blog",
  "/products",
  "/product",
  "/warranty",
  "/privacy-policy",
];

// Define public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/categories",
  "/api/products",
  "/api/blog/featured",
  "/api/products/featured",
  "/api/products/bestselling",
  "/api/products/product-of-the-month",
  "/api/gallery",
  "/api/store-settings",
  "/api/hero-sections",
];

export default withAuth(
  async function middleware(request) {
    try {
      const path = request.nextUrl.pathname;
      const isAdminRoute = path.startsWith("/admin");
      const isApiRoute = path.startsWith("/api");
      const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        path.startsWith(route)
      );
      const isPublicApiRoute = PUBLIC_API_ROUTES.some((route) =>
        path.startsWith(route)
      );
      const isAuthRoute = path.startsWith("/api/auth");

      // Log the request details
      logger.info(`Processing request: ${path}`, {
        method: request.method,
        isAdminRoute,
        isApiRoute,
        isPublicRoute,
        isPublicApiRoute,
        isAuthRoute,
      });

      // Handle auth routes with proper cache control
      if (isAuthRoute) {
        const response = NextResponse.next();
        response.headers.set(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        return response;
      }

      // Skip authentication for public routes
      if (isPublicRoute) {
        return NextResponse.next();
      }

      // Skip authentication for public API routes
      if (isPublicApiRoute) {
        return NextResponse.next();
      }

      // Handle API routes
      if (isApiRoute) {
        // Add CORS headers for API routes
        const response = NextResponse.next();
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS"
        );
        response.headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization"
        );
        return response;
      }

      // Handle admin routes
      if (isAdminRoute && !request.nextauth.token?.admin) {
        logger.warn(`Non-admin user attempted to access admin route: ${path}`);
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    } catch (error) {
      logger.error("Error in middleware", error);
      return NextResponse.next();
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow public routes without authentication
        if (PUBLIC_ROUTES.some((route) => path.startsWith(route))) {
          return true;
        }

        // Allow public API routes without authentication
        if (PUBLIC_API_ROUTES.some((route) => path.startsWith(route))) {
          return true;
        }

        // Allow auth routes without authentication
        if (path.startsWith("/api/auth")) {
          return true;
        }

        // Require token for all other protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|locales/).*)", // Exclude auth routes and static files
  ],
};
