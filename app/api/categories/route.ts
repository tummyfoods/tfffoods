import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import Category from "@/utils/models/Category";

export const dynamic = "force-dynamic";

// GET all categories (public endpoint)
export async function GET() {
  try {
    await connectToDatabase();
    // Only get active categories, sorted by order
    const categories = await Category.find({ isActive: true }).sort({
      order: 1,
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
