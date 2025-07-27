import mongoose from "mongoose";
import { Order } from "@/utils/models/Order";
import dbConnect from "@/utils/config/dbConnection";

interface CartProduct {
  product: string;
  quantity: number;
  price: number;
}

async function fixOrderAmounts() {
  try {
    console.log("Connecting to database...");
    await dbConnect();

    console.log("Finding all orders...");
    const orders = await Order.find({
      $or: [
        { subtotal: { $exists: false } },
        { subtotal: null },
        { deliveryCost: { $exists: false } },
        { deliveryCost: null },
      ],
    });
    console.log(`Found ${orders.length} orders to fix`);

    let fixedCount = 0;
    for (const order of orders) {
      // Calculate subtotal from cart products
      const subtotal = order.cartProducts.reduce(
        (sum: number, item: CartProduct) => sum + item.price * item.quantity,
        0
      );

      // Calculate delivery cost (total - subtotal)
      const deliveryCost = order.total - subtotal;

      console.log(`
Order ${order._id}:
- Calculated subtotal: ${subtotal}
- Calculated delivery cost: ${deliveryCost}
- Stored total: ${order.total}
`);

      // Update the order
      order.subtotal = subtotal;
      order.deliveryCost = deliveryCost;
      await order.save();
      fixedCount++;
    }

    console.log(`
Summary:
- Total orders checked: ${orders.length}
- Orders fixed: ${fixedCount}
`);
  } catch (error) {
    console.error("Error fixing order amounts:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the fix
fixOrderAmounts();
