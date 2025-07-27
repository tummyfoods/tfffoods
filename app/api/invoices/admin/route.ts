import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import Invoice from "@/utils/models/Invoice";
import User from "@/utils/models/User";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import connectDB from "@/utils/mongodb";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    logger.info("Connecting to database...");
    await connectDB();
    logger.info("Connected to database");

    // Build query based on filters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const query: any = {};

    if (type && type !== "all") query.invoiceType = type;
    if (status && status !== "all") query.status = status;

    logger.info("Fetching admin invoices with query:", {
      type,
      status,
      query,
    });

    // Fetch latest invoices
    const invoices = await Invoice.find(query)
      .populate({
        path: "user",
        model: User,
        select: "name email",
      })
      .populate({
        path: "orders",
        model: Order,
        select: "name email total status createdAt items deliveryCost",
        populate: {
          path: "items.id",
          model: Product,
          select: "name displayNames",
        },
      })
      .sort({ createdAt: -1 });

    logger.info("Found invoices:", {
      count: invoices.length,
      sampleIds: invoices.slice(0, 3).map((inv) => inv._id),
    });

    // Convert to plain objects and handle ObjectIds
    const formattedInvoices = invoices.map((invoice) => {
      try {
        const plainInvoice = invoice.toObject();
        return {
          ...plainInvoice,
          _id: plainInvoice._id.toString(),
          user: plainInvoice.user
            ? {
                ...plainInvoice.user,
                _id: plainInvoice.user._id.toString(),
              }
            : null,
          orders: plainInvoice.orders
            ? plainInvoice.orders.map((order) => {
                try {
                  return {
                    ...order,
                    _id: order._id.toString(),
                    // Map items to cartProducts format for frontend compatibility
                    cartProducts: (order.items || []).map((item: any) => {
                      try {
                        return {
                          product: item.id
                            ? {
                                ...item.id,
                                _id: item.id._id.toString(),
                              }
                            : null,
                          quantity: item.quantity,
                        };
                      } catch (itemError) {
                        logger.error("Error formatting item:", {
                          error: itemError,
                          item,
                          orderId: order._id,
                          invoiceId: invoice._id,
                        });
                        return {
                          product: null,
                          quantity: item.quantity || 0,
                        };
                      }
                    }),
                  };
                } catch (orderError) {
                  logger.error("Error formatting order:", {
                    error: orderError,
                    order,
                    invoiceId: invoice._id,
                  });
                  return {
                    _id: order._id.toString(),
                    cartProducts: [],
                  };
                }
              })
            : [],
        };
      } catch (invoiceError) {
        logger.error("Error formatting invoice:", {
          error: invoiceError,
          invoice: invoice._id,
        });
        return {
          _id: invoice._id.toString(),
          orders: [],
        };
      }
    });

    logger.info("Successfully formatted invoices");

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices,
    });
  } catch (error) {
    logger.error("Error fetching admin invoices:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
