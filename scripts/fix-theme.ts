import { connectToDatabase } from "../utils/database";
import StoreSettings from "../utils/models/StoreSettings";

async function fixThemeSettings() {
  try {
    await connectToDatabase();

    // Update the store settings to ensure theme settings are properly initialized
    const settings = await StoreSettings.findOneAndUpdate(
      {},
      {
        $set: {
          "themeSettings.light": {
            background: "#ffffff",
            card: "#ffffff",
            navbar: "#ffffff",
            text: "#000000",
            mutedText: "#666666",
            border: "#e5e7eb",
            footer: "#f9fafb",
            cardBorder: "#e5e7eb",
            cardItemBorder: "#e5e7eb",
            backgroundOpacity: 100,
            cardOpacity: 100,
            navbarOpacity: 100,
          },
          "themeSettings.dark": {
            background: "#1a1a1a",
            card: "#1e1e1e",
            navbar: "#1e1e1e",
            text: "#ffffff",
            mutedText: "#a1a1a1",
            border: "#374151",
            footer: "#111827",
            cardBorder: "#374151",
            cardItemBorder: "#374151",
            backgroundOpacity: 100,
            cardOpacity: 100,
            navbarOpacity: 100,
          },
        },
      },
      { upsert: true, new: true }
    );

    console.log("Theme settings fixed:", settings);
    process.exit(0);
  } catch (error) {
    console.error("Error fixing theme settings:", error);
    process.exit(1);
  }
}

fixThemeSettings();
