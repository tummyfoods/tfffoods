import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import { Order } from "@/utils/models/Order";
import User from "@/utils/models/User";
import DeliverySettings from "@/utils/models/DeliverySettings";
import Invoice from "@/utils/models/Invoice";
import invoiceNumberService from "@/utils/services/invoiceNumberService";
import { sendEmail } from "@/lib/emailService";
import { generateOrderConfirmationEmail } from "@/lib/emailTemplates";
import type { Document } from "mongoose";

interface SavedOrder extends Document {
  periodInvoiceNumber?: string;
}

interface OrderData {
  _id: string;
  orderType?: string;
  periodInvoiceNumber?: string;
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get request data
    const data = await req.json();
    console.log("Received checkout data:", {
      ...data,
      deliveryMethod: {
        value: data.deliveryMethod,
        type: typeof data.deliveryMethod,
      },
    });

    const {
      name,
      email,
      phone,
      shippingAddress,
      cartItems,
      deliveryMethod,
      paymentMethod,
      paymentProofUrl,
      paymentReference,
      paymentDate,
    } = data;

    // Validate required fields
    const missingFields = {
      name: !name,
      email: !email,
      phone: !phone,
      shippingAddress: !shippingAddress,
      cartItems: !cartItems,
      deliveryMethod: deliveryMethod === undefined,
      paymentMethod: !paymentMethod,
    };

    if (Object.values(missingFields).some(Boolean)) {
      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: missingFields,
        },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (!shippingAddress.en || !shippingAddress["zh-TW"]) {
      console.error("Invalid shipping address:", {
        address: shippingAddress,
        missing: {
          en: !shippingAddress.en,
          "zh-TW": !shippingAddress["zh-TW"],
        },
      });
      return NextResponse.json(
        {
          error: "Invalid shipping address",
          details: {
            missing: {
              en: !shippingAddress.en,
              "zh-TW": !shippingAddress["zh-TW"],
            },
          },
        },
        { status: 400 }
      );
    }

    // Validate cart items
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      console.error("Invalid cart items:", {
        items: cartItems,
        isArray: Array.isArray(cartItems),
        length: cartItems?.length,
      });
      return NextResponse.json(
        {
          error: "Invalid cart items",
          details: {
            isArray: Array.isArray(cartItems),
            length: cartItems?.length,
          },
        },
        { status: 400 }
      );
    }

    // Get delivery settings
    const deliverySettings = await DeliverySettings.findOne();
    if (!deliverySettings) {
      return NextResponse.json(
        { error: "Delivery settings not found" },
        { status: 404 }
      );
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      return sum + (item.price || 0) * (item.quantity || 0);
    }, 0);

    // Get delivery cost
    const deliveryMethodIndex = Number(deliveryMethod);
    console.log("Delivery method conversion:", {
      original: deliveryMethod,
      converted: deliveryMethodIndex,
      type: typeof deliveryMethodIndex,
      isNaN: isNaN(deliveryMethodIndex),
    });

    if (
      isNaN(deliveryMethodIndex) ||
      deliveryMethodIndex < 0 ||
      deliveryMethodIndex >= deliverySettings.deliveryMethods.length
    ) {
      console.error("Invalid delivery method:", {
        deliveryMethod,
        deliveryMethodIndex,
        type: typeof deliveryMethod,
        methodsLength: deliverySettings.deliveryMethods.length,
        value: deliveryMethod,
        deliverySettings,
        validation: {
          isNaN: isNaN(deliveryMethodIndex),
          isNegative: deliveryMethodIndex < 0,
          isOutOfBounds:
            deliveryMethodIndex >= deliverySettings.deliveryMethods.length,
        },
      });
      return NextResponse.json(
        {
          error: "Invalid delivery method",
          details: {
            deliveryMethod,
            deliveryMethodIndex,
            type: typeof deliveryMethod,
            methodsLength: deliverySettings.deliveryMethods.length,
            validation: {
              isNaN: isNaN(deliveryMethodIndex),
              isNegative: deliveryMethodIndex < 0,
              isOutOfBounds:
                deliveryMethodIndex >= deliverySettings.deliveryMethods.length,
            },
          },
        },
        { status: 400 }
      );
    }

    const selectedMethod =
      deliverySettings.deliveryMethods[deliveryMethodIndex];
    console.log("Selected delivery method:", {
      index: deliveryMethodIndex,
      method: selectedMethod,
    });

    const deliveryCost = selectedMethod.cost;

    // Apply free delivery if subtotal exceeds threshold
    const finalDeliveryCost =
      subtotal >= deliverySettings.freeDeliveryThreshold ? 0 : deliveryCost;

    // Calculate total
    const total = subtotal + finalDeliveryCost;

    // Generate order reference
    const orderReference = await invoiceNumberService.generateOrderReference();

    // Handle period payment
    if (paymentMethod === "periodInvoice") {
      if (!user.isPeriodPaidUser || !user.paymentPeriod) {
        return NextResponse.json(
          { error: "User is not a period-paid user" },
          { status: 400 }
        );
      }

      // Calculate period dates
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setHours(0, 0, 0, 0);
      const periodEnd = new Date(now);
      periodEnd.setHours(23, 59, 59, 999);

      if (user.paymentPeriod === "weekly") {
        periodEnd.setDate(periodEnd.getDate() + 6);
      } else if (user.paymentPeriod === "monthly") {
        const existingInvoice = await Invoice.findOne({
          user: user._id,
          invoiceType: "period",
          status: "pending",
        }).sort({ periodEnd: -1 });

        if (existingInvoice) {
          periodStart.setTime(existingInvoice.periodStart.getTime());
          periodEnd.setTime(existingInvoice.periodEnd.getTime());
        } else {
          periodStart.setDate(1);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          periodEnd.setDate(0);
        }
      }

      // Find or create period invoice
      let invoice = await Invoice.findOne({
        user: user._id,
        invoiceType: "period",
        periodStart: { $lte: now },
        periodEnd: { $gte: now },
        status: "pending",
      });

      if (!invoice) {
        const periodNumber = await invoiceNumberService.getCurrentPeriodNumber(
          user.paymentPeriod,
          periodStart
        );
        const periodInvoiceNumber =
          await invoiceNumberService.generatePeriodInvoiceNumber(
            user.paymentPeriod,
            periodNumber
          );

        invoice = await Invoice.create({
          user: user._id,
          name: name || user.name || user.email,
          email: email || user.email,
          phone,
          invoiceNumber: periodInvoiceNumber,
          invoiceType: "period",
          periodStart,
          periodEnd,
          amount: 0,
          items: [],
          status: "pending",
          orders: [],
          shippingAddress,
          billingAddress: shippingAddress,
        });
      }

      // Create period order
      console.log("Creating period order with:", {
        orderType: "period-order",
        paymentMethod: "periodInvoice",
        periodInvoiceNumber: invoice.invoiceNumber,
      });

      if (!invoice.invoiceNumber) {
        console.error("Missing invoice number for period order!");
        return NextResponse.json(
          { error: "Failed to generate period invoice number" },
          { status: 500 }
        );
      }

      const order = await Order.create({
        orderReference,
        user: user._id,
        name: name || user.name || user.email,
        email: email || user.email,
        phone,
        shippingAddress,
        items: cartItems.map((item: any) => ({
          id: item.id || item._id,
          quantity: item.quantity,
        })),
        deliveryMethod: deliveryMethodIndex,
        deliveryCost: finalDeliveryCost,
        subtotal,
        total,
        status: "pending",
        paid: false,
        orderType: "period-order",
        paymentMethod: "periodInvoice",
        periodInvoiceNumber: invoice.invoiceNumber,
      });

      console.log("Created period order:", {
        id: order._id,
        orderType: order.orderType,
        paymentMethod: order.paymentMethod,
        periodInvoiceNumber: order.periodInvoiceNumber,
        orderReference: order.orderReference,
      });

      // Verify the order was created with periodInvoiceNumber
      const savedOrder = (await Order.findById(order._id).lean()) as OrderData;
      if (
        savedOrder &&
        savedOrder.orderType === "period-order" &&
        !savedOrder.periodInvoiceNumber
      ) {
        console.error("Period order created without invoice number!");
        await Order.findByIdAndUpdate(order._id, {
          periodInvoiceNumber: invoice.invoiceNumber,
        });
      }

      // Update invoice
      invoice.orders.push(order._id);
      invoice.items.push(
        ...cartItems.map((item: any) => ({
          product: item.id || item._id,
          quantity: item.quantity,
          price: item.price,
        }))
      );
      invoice.amount = (invoice.amount || 0) + total;
      await invoice.save();

      // Update user's payment history
      const existingPaymentHistory = user.paymentHistory?.find(
        (ph: { periodStart: Date; periodEnd: Date }) =>
          ph.periodStart.getTime() === periodStart.getTime() &&
          ph.periodEnd.getTime() === periodEnd.getTime()
      );

      if (!existingPaymentHistory) {
        if (!user.paymentHistory) user.paymentHistory = [];
        user.paymentHistory.push({
          periodStart,
          periodEnd,
          amount: invoice.amount,
          status: "pending",
          invoice: invoice._id,
        });
        await user.save();
      }

      return NextResponse.json({
        success: true,
        orderId: order._id,
      });
    }

    // Handle regular order (existing code)
    const order = new Order({
      user: user._id,
      name,
      email,
      phone,
      shippingAddress,
      items: cartItems.map((item: any) => ({
        id: item.id || item._id,
        quantity: item.quantity,
      })),
      deliveryMethod: deliveryMethodIndex,
      deliveryCost: finalDeliveryCost,
      subtotal,
      total,
      paymentMethod,
      orderType: "onetime-order",
      status:
        paymentMethod === "offline"
          ? "pending_payment_verification"
          : "pending",
      ...(paymentMethod === "offline" && {
        paymentProof: paymentProofUrl,
        paymentReference,
        paymentDate,
      }),
      orderReference,
    });

    await order.save();

    // Create invoice if needed
    if (paymentMethod === "offline" || paymentMethod === "online") {
      const invoiceNumber =
        await invoiceNumberService.generateOneTimeInvoiceNumber();

      const invoice = new Invoice({
        user: user._id,
        name,
        email,
        phone,
        invoiceNumber,
        invoiceType: "one-time",
        orders: [order._id],
        amount: total,
        status: "pending",
        shippingAddress,
        billingAddress: shippingAddress,
        items: cartItems.map((item: any) => ({
          product: item.id || item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryMethod: deliveryMethodIndex,
        deliveryCost: finalDeliveryCost,
        subtotal,
        total,
        periodStart: new Date(),
        periodEnd: new Date(),
        paymentMethod:
          paymentMethod === "offline" ? "offline_payment" : "credit_card",
        ...(paymentMethod === "offline" && {
          paymentProofUrl,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        }),
      });

      await invoice.save();

      order.invoiceNumber = invoice.invoiceNumber;
      await order.save();
    }

    // Send order confirmation email
    try {
      const populatedOrder = await Order.findById(order._id).populate(
        "items.id"
      );
      if (populatedOrder) {
        const { subject, text, html } = generateOrderConfirmationEmail(
          populatedOrder,
          user.language || "en"
        );
        await sendEmail({
          to: email,
          subject,
          text,
          html,
        });
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
      // Don't fail the order if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: order._id,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
