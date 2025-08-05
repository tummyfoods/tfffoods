import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import { forceCleanupInvalidInvoices } from "@/utils/services/invoiceService";
import dbConnect from "@/utils/config/dbConnection";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting invoice cleanup...");
    const result = await forceCleanupInvalidInvoices();
    console.log("Invoice cleanup completed");

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${result.cleanedCount} invoices deleted, ${result.updatedCount} invoices updated`,
      ...result,
    });
  } catch (error) {
    console.error("Error cleaning up invoices:", error);
    return NextResponse.json(
      { error: "Failed to clean up invoices" },
      { status: 500 }
    );
  }
}
