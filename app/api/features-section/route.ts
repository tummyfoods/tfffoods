import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import { FeaturesSection } from "@/models/FeaturesSection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

export async function GET() {
  try {
    await connectToDatabase();
    const features = await FeaturesSection.findOne();
    return NextResponse.json(
      features || { title: { en: "", "zh-TW": "" }, items: [] }
    );
  } catch (error) {
    console.error("Error fetching features:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();

    // Find the first document (since we only have one features section)
    const existingFeature = await FeaturesSection.findOne();

    let feature;
    if (existingFeature) {
      // Update existing document
      feature = await FeaturesSection.findByIdAndUpdate(
        existingFeature._id,
        data,
        { new: true }
      );
    } else {
      // Create new document if none exists
      feature = await FeaturesSection.create(data);
    }

    return NextResponse.json(feature);
  } catch (error) {
    console.error("Error creating feature:", error);
    return NextResponse.json(
      { error: "Failed to create feature" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();
    const { _id, ...updateData } = data;

    const feature = await FeaturesSection.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    return NextResponse.json(feature);
  } catch (error) {
    console.error("Error updating feature:", error);
    return NextResponse.json(
      { error: "Failed to update feature" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Feature ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const feature = await FeaturesSection.findByIdAndDelete(id);

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting feature:", error);
    return NextResponse.json(
      { error: "Failed to delete feature" },
      { status: 500 }
    );
  }
}
