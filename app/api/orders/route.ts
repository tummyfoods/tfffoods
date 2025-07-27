import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { createRouteHandler } from "@/utils/routeHandler";
import { connectToDatabase } from "@/utils/database";
import "@/utils/models"; // Ensure models are registered

export const dynamic = "force-dynamic";

const handleOrders = createRouteHandler({ requireAuth: true });

export async function GET(req: Request) {
  return handleOrders(async () => {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Authentication required");
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const email = searchParams.get("email");

    // Validate email parameter
    if (!email) {
      throw new Error("Email parameter is required");
    }

    // Verify the email matches the authenticated user
    if (email !== session.user.email) {
      throw new Error("Unauthorized access");
    }

    const skip = (page - 1) * limit;

    try {
      // Find orders where either email matches or user ID matches
      const orders = await Order.find({
        $or: [{ email: email }, { user: session.user._id }],
      })
        .populate({
          path: "items.id",
          model: Product,
          select: "_id name displayNames images price",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalOrders = await Order.countDocuments({
        $or: [{ email: email }, { user: session.user._id }],
      });
      const hasMore = totalOrders > skip + orders.length;

      return {
        orders,
        hasMore,
        totalOrders,
      };
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw new Error("Failed to fetch orders");
    }
  });
}

export async function PUT(req: Request) {
  return handleOrders(async () => {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Authentication required");
    }

    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    try {
      // Find the order and verify ownership
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      if (order.email !== session.user.email) {
        throw new Error("Unauthorized access");
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status: "delivered" },
        { new: true }
      ).populate({
        path: "items.id",
        model: Product,
        select: "_id name displayNames images price",
      });

      return {
        success: true,
        message: "Order status updated to delivered",
        order: updatedOrder,
      };
    } catch (error) {
      console.error("Error updating order:", error);
      throw new Error("Failed to update order");
    }
  });
}
