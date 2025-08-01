import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { glob } from "glob";

async function updateBackgrounds() {
  try {
    // Find all TypeScript and TSX files in the app directory
    const files = await glob("app/**/*.{ts,tsx}");

    for (const file of files) {
      let content = readFileSync(file, "utf8");

      // Replace background color classes with app-background
      content = content.replace(
        /className="([^"]*?)bg-(?:gray|white|black)-(?:\d+|background)(?:\/\d+)?([^"]*?)"/g,
        'className="$1app-background$2"'
      );

      // Replace min-h-screen with background colors
      content = content.replace(
        /className="([^"]*?)min-h-screen\s+bg-(?:gray|white|black)-(?:\d+|background)(?:\/\d+)?([^"]*?)"/g,
        'className="$1min-h-screen app-background$2"'
      );

      writeFileSync(file, content, "utf8");
    }

    console.log("Background colors updated successfully!");
  } catch (error) {
    console.error("Error updating background colors:", error);
  }
}

updateBackgrounds();
