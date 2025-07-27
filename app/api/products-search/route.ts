import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import Product from "@/utils/models/Product";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const language = searchParams.get("language") || "en";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    if (!query) {
      return NextResponse.json(
        { message: "Search query is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build search query that works for both English and Chinese
    const searchQuery = {
      $and: [
        {
          $or: [
            // Search in default name field
            { name: { $regex: query, $options: "i" } },
            // Search in English display names
            { "displayNames.en": { $regex: query, $options: "i" } },
            // Search in Chinese display names - exact match for Chinese characters
            { "displayNames.zh-TW": query },
            // Partial match for Chinese characters
            { "displayNames.zh-TW": { $regex: query } },
          ],
        },
        { draft: { $ne: true } },
      ],
    };

    // Execute search
    const [products, total] = await Promise.all([
      Product.find(searchQuery)
        .populate("brand")
        .populate("category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(searchQuery),
    ]);

    // Format products with correct language
    const formattedProducts = products.map((product: any) => ({
      ...product,
      name: product.displayNames?.[language] || product.name,
      description: product.descriptions?.[language] || product.description,
      brand: {
        ...product.brand,
        name: product.brand?.displayNames?.[language] || product.brand?.name,
      },
      category: {
        ...product.category,
        name:
          product.category?.displayNames?.[language] || product.category?.name,
      },
    }));

    return NextResponse.json({
      products: formattedProducts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error in product search:", error);
    return NextResponse.json(
      { message: "Failed to search products" },
      { status: 500 }
    );
  }
}
