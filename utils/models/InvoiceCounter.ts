import mongoose from "mongoose";

const invoiceCounterSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    periodType: {
      type: String,
      enum: ["one-time", "weekly", "monthly"],
      required: true,
    },
    periodNumber: {
      type: Number,
      default: 1,
    },
    sequence: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
invoiceCounterSchema.index({
  year: 1,
  month: 1,
  periodType: 1,
  periodNumber: 1,
});

const InvoiceCounter =
  mongoose.models.InvoiceCounter ||
  mongoose.model("InvoiceCounter", invoiceCounterSchema);

export default InvoiceCounter;
