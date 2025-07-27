import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import Product from "@/utils/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import mongoose from "mongoose";
import { clearAllProductCaches } from "@/utils/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  let retries = 3;

  while (retries > 0) {
    try {
      await connectToDatabase();

      // Wait for connection to be ready with timeout
      const isConnected = await waitForConnection();
      if (!isConnected) {
        throw new Error("Database connection timeout");
      }

      const featuredProduct = await Product.find({ featured: true });
      return NextResponse.json(featuredProduct);
    } catch (error) {
      console.error(
        `Failed to fetch featured product (retries left: ${retries - 1}):`,
        error
      );

      if (retries <= 1) {
        return NextResponse.json(
          { error: "Failed to fetch featured product" },
          { status: 500 }
        );
      }

      // Wait longer between retries
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries--;
    }
  }

  return NextResponse.json(
    { error: "Failed to establish database connection" },
    { status: 500 }
  );
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  let retries = 3;

  while (retries > 0) {
    try {
      // Check if user is authenticated and is admin
      const session = await getServerSession(authOptions);
      if (!session?.user?.admin) {
        return NextResponse.json(
          { error: "Unauthorized: Admin access required" },
          { status: 401 }
        );
      }

      await connectToDatabase();

      // Wait for connection to be ready with timeout
      const isConnected = await waitForConnection();
      if (!isConnected) {
        throw new Error("Database connection timeout");
      }

      // Await the params before destructuring
      const { productId } = await params;

      // First, get the current product to check its featured state
      const currentProduct = await Product.findById(productId);
      console.log("[Featured Toggle] Current product state:", {
        id: productId,
        featured: currentProduct?.featured,
        name: currentProduct?.name,
      });

      if (!currentProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Simply toggle the featured status without affecting other products
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { featured: !currentProduct.featured },
        { new: true }
      );

      console.log("[Featured Toggle] Updated product state:", {
        id: productId,
        featured: updatedProduct?.featured,
        name: updatedProduct?.name,
      });

      // Get count of featured products for logging
      const featuredCount = await Product.countDocuments({ featured: true });
      console.log("[Featured Toggle] Total featured products:", featuredCount);

      // Clear all product-related caches
      clearAllProductCaches();

      return NextResponse.json(updatedProduct);
    } catch (error) {
      console.error(
        `[Featured Toggle] Failed to update featured status (retries left: ${
          retries - 1
        }):`,
        error
      );

      if (retries <= 1) {
        return NextResponse.json(
          { error: "Failed to update featured status" },
          { status: 500 }
        );
      }

      // Wait longer between retries
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries--;
    }
  }

  return NextResponse.json(
    { error: "Failed to establish database connection" },
    { status: 500 }
  );
}
