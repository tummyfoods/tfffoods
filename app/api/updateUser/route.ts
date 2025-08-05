import connect from "@/utils/config/dbConnection";
import { NextResponse } from "next/server";
import User from "@/utils/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";

export async function PUT(req: Request) {
  try {
    await connect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { email, name, newEmail, phone, address } = await req.json();
    console.log("updateUser - Received data:", {
      email,
      name,
      newEmail,
      phone,
      address,
    });

    // Validate phone number if provided
    if (phone && !/^\d{8,}$/.test(phone)) {
      return NextResponse.json(
        { message: "Invalid phone number format. Must be at least 8 digits." },
        { status: 400 }
      );
    }

    // Update user using findOneAndUpdate for atomic operation
    const updateData = {
      name,
      email: newEmail,
      phone: phone || "", // Ensure empty string if no phone provided
      address: {
        en: address?.en || "",
        "zh-TW": address?.["zh-TW"] || "",
        coordinates: {
          lat: address?.coordinates?.lat ?? null,
          lng: address?.coordinates?.lng ?? null,
        },
      },
    };

    console.log("updateUser - Update data:", updateData);

    const user = await User.findOneAndUpdate({ email }, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("updateUser - Updated user:", user.toObject());

    return NextResponse.json({
      message: "User updated successfully",
      user: user.toObject(),
    });
  } catch (error: any) {
    console.error("Error updating user:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      validationErrors: error.errors,
    });

    // Handle validation errors specifically
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: Object.keys(error.errors).reduce((acc: any, key: string) => {
            acc[key] = error.errors[key].message;
            return acc;
          }, {}),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500 }
    );
  }
}
