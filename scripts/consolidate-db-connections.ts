import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { glob } from "glob";

async function updateImports() {
  // Find all TypeScript files
  const files = await glob("**/*.{ts,tsx}", {
    ignore: ["node_modules/**", "dist/**", ".next/**"],
  });

  for (const file of files) {
    try {
      const content = await readFile(file, "utf8");

      // Skip if file doesn't import mongodb
      if (!content.includes("mongodb")) continue;

      // Replace imports
      let newContent = content
        .replace(
          /import\s+(?:connect(?:DB|db)|{\s*connect(?:DB|db)\s*})\s+from\s+['"]@\/utils\/mongodb['"];?/g,
          `import { connectToDatabase } from "@/utils/database";`
        )
        .replace(
          /import\s+(?:connect(?:DB|db)|{\s*connect(?:DB|db)\s*})\s+from\s+['"]\.\.?\/\.\.?\/utils\/mongodb['"];?/g,
          `import { connectToDatabase } from "../utils/database";`
        )
        // Replace function calls
        .replace(/await\s+connect(?:DB|db)\(\)/g, "await connectToDatabase()")
        .replace(/connect(?:DB|db)\(\)/g, "connectToDatabase()");

      if (newContent !== content) {
        await writeFile(file, newContent, "utf8");
        console.log(`Updated ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
}

updateImports().catch(console.error);
