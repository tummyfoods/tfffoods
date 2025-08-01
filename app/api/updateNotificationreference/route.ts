/* eslint-disable @typescript-eslint/no-explicit-any */
import connect from "@/utils/config/dbConnection";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import User from "@/utils/models/User";

export async function POST(req: Request) {
  await connect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ canReview: false }, { status: 200 });
  }

  const body = await req.json();
  const { orderUpdates, promotions } = body;

  try {
    const user = await User.findOneAndUpdate(
      {
        email: session.user.email,
      },
      {
        $set: {
          "notificationPreferences.orderUpdates": orderUpdates,
          "notificationPreferences.promotions": promotions,
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }
    return NextResponse.json({
      message: "preferences updated",
      preferences: user.notificationPreferences,
    });
  } catch (error: any) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "internal server error at the update preferences route",
      },
      { status: 500 }
    );
  }
}
