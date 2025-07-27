import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import User from "@/utils/models/User";
import Invoice from "@/utils/models/Invoice";
import connectDB from "@/utils/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Fetch all users
    const users = await User.find({}).select(
      "name email isPeriodPaidUser paymentPeriod"
    );

    // Get current invoices for each user
    const usersWithInvoices = await Promise.all(
      users.map(async (user) => {
        const currentInvoice = await Invoice.findOne({
          user: user._id,
          status: { $in: ["pending", "overdue"] },
        }).sort({ periodEnd: -1 });

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          isPeriodPaidUser: user.isPeriodPaidUser,
          paymentPeriod: user.paymentPeriod,
          currentInvoice: currentInvoice
            ? {
                _id: currentInvoice._id,
                amount: currentInvoice.amount,
                status: currentInvoice.status,
                periodEnd: currentInvoice.periodEnd,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ users: usersWithInvoices });
  } catch (error) {
    console.error("Error fetching period users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
