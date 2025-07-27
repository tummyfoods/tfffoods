import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import Invoice from "@/utils/models/Invoice";
import User from "@/utils/models/User";
import Order from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import { connectToDatabase } from "@/utils/database";
import { Document, Types } from "mongoose";

interface ProductDocument {
  _id: Types.ObjectId;
  name: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  images: string[];
  price: number;
  description?: string;
}

interface OrderItem {
  id: ProductDocument;
  quantity: number;
}

interface OrderDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  total: number;
  status: string;
  createdAt: Date;
  items: OrderItem[];
  deliveryCost: number;
}

interface UserDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: {
    en: string;
    "zh-TW": string;
  };
}

interface InvoiceDocument {
  _id: Types.ObjectId;
  user: UserDocument;
  orders: OrderDocument[];
  items: Array<{
    product: ProductDocument;
    quantity: number;
    price: number;
  }>;
  [key: string]: any; // for other fields
}

export async function GET(
  request: Request,
  props: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      console.error("Unauthorized access attempt:", {
        user: session?.user?.email,
        invoiceNumber: props.params.then((p) => p.invoiceNumber),
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    const { invoiceNumber } = await props.params;

    console.log("Fetching invoice with number:", invoiceNumber);

    // Find invoice with populated data
    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate({
        path: "user",
        model: User,
        select: "name email phone address",
      })
      .populate({
        path: "orders",
        model: Order,
        select: "name email phone total status createdAt items deliveryCost",
        populate: {
          path: "items.id",
          model: Product,
          select: "name displayNames images price description",
        },
      })
      .populate({
        path: "items.product",
        model: Product,
        select: "name displayNames images price description",
      })
      .lean<InvoiceDocument>();

    if (!invoice) {
      console.error("Invoice not found:", { invoiceNumber });
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Transform ObjectIds to strings
    const transformedInvoice = {
      ...invoice,
      _id: invoice._id.toString(),
      user: invoice.user
        ? {
            ...invoice.user,
            _id: invoice.user._id.toString(),
          }
        : null,
      orders:
        invoice.orders?.map((order) => ({
          ...order,
          _id: order._id.toString(),
          items: order.items?.map((item) => ({
            ...item,
            id: item.id
              ? {
                  ...item.id,
                  _id: item.id._id.toString(),
                }
              : null,
          })),
        })) || [],
      items: invoice.items?.map((item) => ({
        ...item,
        product: item.product
          ? {
              ...item.product,
              _id: item.product._id.toString(),
            }
          : null,
      })),
    };

    console.log("Successfully fetched invoice:", {
      invoiceNumber,
      userId: transformedInvoice.user?._id,
      orderCount: transformedInvoice.orders?.length,
    });

    return NextResponse.json({
      success: true,
      invoice: transformedInvoice,
    });
  } catch (error: any) {
    console.error("Error fetching admin invoice:", {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      params: props.params.then((p) => p.invoiceNumber),
    });
    return NextResponse.json(
      {
        error: "Failed to fetch invoice",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { invoiceNumber } = await props.params;
    const { status } = await request.json();

    if (!["pending", "paid", "overdue"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findOne({ invoiceNumber });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    invoice.status = status;
    if (status === "paid") {
      invoice.paymentDate = new Date();
    }

    await invoice.save();

    return NextResponse.json({
      success: true,
      message: "Invoice status updated successfully",
      invoice: {
        ...invoice.toObject(),
        _id: invoice._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 }
    );
  }
}
