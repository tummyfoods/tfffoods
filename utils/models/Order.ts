import mongoose from "mongoose";
import { Address } from "@/types";

interface OrderItem {
  id: string;
  quantity: number;
}

interface OrderDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: number;
  shippingAddress: Address;
  items: OrderItem[];
  deliveryMethod: number;
  deliveryCost: number;
  subtotal: number;
  total: number;
  paymentMethod: "online" | "offline" | "periodInvoice";
  orderType: "onetime-order" | "period-order";
  periodInvoiceNumber?: string;
  orderNumber: string;
  status:
    | "pending"
    | "pending_payment_verification"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentProof?: string;
  paymentReference?: string;
  paymentDate?: string;
  invoiceNumber?: string;
  orderReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new mongoose.Schema<OrderDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
      validate: {
        validator: function (v: number) {
          return /^\d{8,}$/.test(v.toString()); // Validate minimum 8 digits
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    shippingAddress: {
      en: {
        type: String,
        required: true,
      },
      "zh-TW": {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    items: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    deliveryMethod: {
      type: Number,
      required: true,
    },
    deliveryCost: {
      type: Number,
      required: true,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["online", "offline", "periodInvoice"],
      required: true,
    },
    orderType: {
      type: String,
      enum: ["onetime-order", "period-order"],
      required: true,
      default: "onetime-order",
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    periodInvoiceNumber: {
      type: String,
      required: function (this: OrderDocument) {
        return this.orderType === "period-order";
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "pending_payment_verification",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    paymentProof: {
      type: String,
    },
    paymentReference: {
      type: String,
    },
    paymentDate: {
      type: String,
    },
    invoiceNumber: {
      type: String,
    },
    orderReference: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate order number
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const count = await mongoose.models.Order.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      },
    });
    const sequence = (count + 1).toString().padStart(4, "0");

    if (this.orderType === "period-order") {
      this.orderNumber = `PORD-${year}${month}-${sequence}`;
    } else {
      this.orderNumber = `ORD-${year}${month}-${sequence}`;
    }
  }
  next();
});

export const Order =
  mongoose.models.Order || mongoose.model<OrderDocument>("Order", orderSchema);
export default Order;
