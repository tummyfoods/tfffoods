import mongoose from "mongoose";
import Product from "../utils/models/Product";
import dbConnect from "../utils/config/dbConnection";

async function migrateProducts() {
  try {
    // Connect to database
    await dbConnect();
    console.log("Connected to database");

    // Get all products
    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} products to migrate`);

    // Update each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // Generate slug from English name or fallback to name
      const slug = (product.displayNames?.en || product.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      // Set order based on index
      const order = i + 1;

      // Update product
      await Product.findByIdAndUpdate(product._id, {
        $set: {
          slug,
          order,
        },
      });

      console.log(
        `Migrated product ${i + 1}/${products.length}: ${product.name}`
      );
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateProducts();
