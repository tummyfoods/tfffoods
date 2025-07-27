import { connectToDatabase } from "@/utils/database";
import HeroSection from "@/models/HeroSection";

async function fixHeroSection() {
  try {
    await connectToDatabase();
    console.log("Connected to database");

    // Get the section ID from the first argument
    const sectionId = "687fae9d2fb2a24149ec77a8"; // The ID from your screenshot

    // Update the section
    const updatedSection = await HeroSection.findByIdAndUpdate(
      sectionId,
      {
        $set: {
          "media.mediaType": "video",
          isActive: true,
        },
      },
      { new: true }
    );

    if (!updatedSection) {
      console.log("Section not found");
      process.exit(1);
    }

    console.log("Updated section:", updatedSection);
    console.log("Hero section fixed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing hero section:", error);
    process.exit(1);
  }
}

fixHeroSection();
