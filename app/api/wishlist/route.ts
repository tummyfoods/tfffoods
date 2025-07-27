import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import User from "@/utils/models/User";
import Product from "@/utils/models/Product";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Connecting to database...");
    await connectToDatabase();

    console.log("Finding user:", session.user.email);
    const user = await User.findOne({ email: session.user.email }).populate({
      path: "wishlist",
      model: Product,
      select: "_id name displayNames images price",
    });

    if (!user) {
      console.log("User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(
      "Found user with wishlist:",
      user.wishlist?.length || 0,
      "items"
    );
    return NextResponse.json({
      success: true,
      wishlist: user.wishlist || [],
    });
  } catch (error) {
    console.error("Error in GET /api/wishlist:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch wishlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    console.log("Connecting to database...");
    await connectToDatabase();

    // Verify product exists
    console.log("Verifying product exists:", productId);
    const product = await Product.findById(productId);
    if (!product) {
      console.log("Product not found:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log("Finding user:", session.user.email);
    let user = await User.findOne({ email: session.user.email });

    if (!user) {
      console.log("User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize wishlist if it doesn't exist
    if (!user.wishlist) {
      user.wishlist = [];
    }

    // Toggle product in wishlist
    const index = user.wishlist.indexOf(productId);
    const action = index > -1 ? "removed" : "added";

    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    console.log(`${action} product ${productId} from wishlist`);
    await user.save();

    // Fetch updated wishlist with populated data
    user = await User.findOne({ email: session.user.email }).populate({
      path: "wishlist",
      model: Product,
      select: "_id name displayNames images price",
    });

    return NextResponse.json({
      success: true,
      action,
      wishlist: user.wishlist || [],
    });
  } catch (error) {
    console.error("Error in POST /api/wishlist:", error);
    return NextResponse.json(
      {
        error: "Failed to update wishlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove from wishlist
    user.wishlist = user.wishlist.filter((id: string) => id !== productId);
    await user.save();

    return NextResponse.json({
      success: true,
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Error deleting from wishlist:", error);
    return NextResponse.json(
      { error: "Failed to delete from wishlist" },
      { status: 500 }
    );
  }
}
