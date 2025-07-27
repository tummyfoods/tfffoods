import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import DeliverySettings from "@/utils/models/DeliverySettings";
import { createRouteHandler } from "@/utils/routeHandler";
import "@/utils/models"; // Ensure models are registered

const handleDelivery = createRouteHandler();

export async function GET() {
  return handleDelivery(async () => {
    let settings = await DeliverySettings.findOne();

    if (!settings) {
      // Create default settings with empty delivery methods
      settings = await DeliverySettings.create({
        deliveryMethods: [],
        freeDeliveryThreshold: 100,
        bankAccountDetails: "",
      });
    }

    // Handle migration from old format if needed
    if (!settings.deliveryMethods && settings.deliveryTypes) {
      const oldTypes = settings.deliveryTypes;
      settings.deliveryMethods = Object.entries(oldTypes).map(
        ([key, value]: [string, any], index) => ({
          cost: value.cost || 0,
          name: {
            en: value.name || `Delivery Method ${index + 1}`,
            "zh-TW": `配送方式 ${index + 1}`,
          },
        })
      );
      delete settings.deliveryTypes;
      await settings.save();
    }

    return settings;
  });
}

export async function POST(request: Request) {
  return handleDelivery(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      throw new Error("Unauthorized");
    }

    const data = await request.json();

    // Validate delivery methods if present
    if (data.deliveryMethods) {
      data.deliveryMethods = data.deliveryMethods.map((method: any) => ({
        cost: method.cost || 0,
        name: {
          en: method.name?.en || "",
          "zh-TW": method.name?.["zh-TW"] || "",
        },
      }));
    }

    let settings = await DeliverySettings.findOne();
    if (settings) {
      Object.assign(settings, data);
      await settings.save();
    } else {
      settings = await DeliverySettings.create({
        ...data,
        deliveryMethods: data.deliveryMethods || [],
      });
    }

    return settings;
  });
}
