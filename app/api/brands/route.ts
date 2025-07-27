import { NextResponse } from "next/server";
import Brand from "@/utils/models/Brand";
import { connectToDatabase } from "@/utils/database";

export async function GET() {
  try {
    await connectToDatabase();
    const brands = await Brand.find({ isActive: true }).sort({ order: 1 });
    return NextResponse.json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
