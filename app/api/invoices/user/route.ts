import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import Invoice from "@/utils/models/Invoice";
import User from "@/utils/models/User";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    console.log("Starting user invoices fetch...");
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("No session found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log("Session user:", session.user);

    console.log("Connecting to database...");
    await connectToDatabase();
    console.log("Database connected successfully");

    // First find the user by email
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      console.log("User not found for email:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log("Found user:", user);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { user: new mongoose.Types.ObjectId(user._id) };
    if (type && type !== "all") query.invoiceType = type;
    if (status && status !== "all") query.status = status;

    console.log("Query:", JSON.stringify(query));
    console.log("Searching for invoices...");

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("Found invoices:", invoices.length);
    if (invoices.length > 0) {
      console.log("Sample invoice:", invoices[0]);
    }

    const totalInvoices = await Invoice.countDocuments(query);
    console.log("Total invoices:", totalInvoices);

    // Convert ObjectIds to strings and simplify the response
    const formattedInvoices = invoices.map((invoice) => ({
      _id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      periodInvoiceNumber: invoice.periodInvoiceNumber,
      amount: invoice.amount,
      status: invoice.status,
      createdAt: invoice.createdAt,
      orders: invoice.orders
        ? invoice.orders.map((orderId) => orderId.toString())
        : [],
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      pagination: {
        page,
        limit,
        total: totalInvoices,
        pages: Math.ceil(totalInvoices / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user invoices:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
