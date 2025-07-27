import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import { Order } from "@/utils/models/Order";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Await the params before using them
    const { orderId } = await context.params;

    // Find the order with all necessary fields
    const order = await Order.findById(orderId)
      .populate({
        path: "cartProducts.product",
        select: "name displayNames images price description descriptions",
      })
      .select("+deliveryCost +deliveryType +subtotal") // Explicitly select these fields
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Calculate subtotal if not present
    if (!order.subtotal) {
      order.subtotal = order.cartProducts.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    // Ensure delivery cost is present
    if (typeof order.deliveryCost !== "number") {
      order.deliveryCost = order.total - order.subtotal;
    }

    // Format shipping address if exists but not formatted
    if (order.shippingAddress && !order.shippingAddress.formattedAddress) {
      order.shippingAddress.formattedAddress = {
        en: `${
          order.shippingAddress.roomFlat
            ? `Room ${order.shippingAddress.roomFlat}, `
            : ""
        }${
          order.shippingAddress.floor
            ? `${order.shippingAddress.floor}/F, `
            : ""
        }${
          order.shippingAddress.blockNumber
            ? `Block ${order.shippingAddress.blockNumber}, `
            : ""
        }${
          order.shippingAddress.buildingName?.en
            ? `${order.shippingAddress.buildingName.en}, `
            : ""
        }${
          order.shippingAddress.streetNumber
            ? `${order.shippingAddress.streetNumber} `
            : ""
        }${order.shippingAddress.streetName?.en || ""}, ${
          order.shippingAddress.district?.en || ""
        }, ${order.shippingAddress.location?.en || ""}`,
        "zh-TW": `${order.shippingAddress.location?.["zh-TW"] || ""}${
          order.shippingAddress.district?.["zh-TW"] || ""
        }${order.shippingAddress.streetName?.["zh-TW"] || ""}${
          order.shippingAddress.streetNumber
            ? order.shippingAddress.streetNumber
            : ""
        }號${
          order.shippingAddress.buildingName?.["zh-TW"]
            ? order.shippingAddress.buildingName["zh-TW"]
            : ""
        }${
          order.shippingAddress.blockNumber
            ? order.shippingAddress.blockNumber + "座"
            : ""
        }${
          order.shippingAddress.floor ? order.shippingAddress.floor + "樓" : ""
        }${
          order.shippingAddress.roomFlat
            ? order.shippingAddress.roomFlat + "室"
            : ""
        }`,
      };
    } else if (!order.shippingAddress && order.streetAddress) {
      // Handle legacy address format
      order.shippingAddress = {
        formattedAddress: {
          en: `${order.streetAddress}${order.city ? `, ${order.city}` : ""}${
            order.postalCode ? ` ${order.postalCode}` : ""
          }${order.country ? `, ${order.country}` : ""}`,
          "zh-TW": `${order.country || ""}${order.city || ""}${
            order.streetAddress || ""
          }`,
        },
      };
    }

    // Format billing address if exists but not formatted
    if (order.billingAddress && !order.billingAddress.formattedAddress) {
      order.billingAddress.formattedAddress = {
        en: `${
          order.billingAddress.roomFlat
            ? `Room ${order.billingAddress.roomFlat}, `
            : ""
        }${
          order.billingAddress.floor ? `${order.billingAddress.floor}/F, ` : ""
        }${
          order.billingAddress.blockNumber
            ? `Block ${order.billingAddress.blockNumber}, `
            : ""
        }${
          order.billingAddress.buildingName?.en
            ? `${order.billingAddress.buildingName.en}, `
            : ""
        }${
          order.billingAddress.streetNumber
            ? `${order.billingAddress.streetNumber} `
            : ""
        }${order.billingAddress.streetName?.en || ""}, ${
          order.billingAddress.district?.en || ""
        }, ${order.billingAddress.location?.en || ""}`,
        "zh-TW": `${order.billingAddress.location?.["zh-TW"] || ""}${
          order.billingAddress.district?.["zh-TW"] || ""
        }${order.billingAddress.streetName?.["zh-TW"] || ""}${
          order.billingAddress.streetNumber
            ? order.billingAddress.streetNumber
            : ""
        }號${
          order.billingAddress.buildingName?.["zh-TW"]
            ? order.billingAddress.buildingName["zh-TW"]
            : ""
        }${
          order.billingAddress.blockNumber
            ? order.billingAddress.blockNumber + "座"
            : ""
        }${
          order.billingAddress.floor ? order.billingAddress.floor + "樓" : ""
        }${
          order.billingAddress.roomFlat
            ? order.billingAddress.roomFlat + "室"
            : ""
        }`,
      };
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
