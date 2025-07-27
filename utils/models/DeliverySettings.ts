import mongoose from "mongoose";

const deliveryMethodSchema = new mongoose.Schema({
  cost: { type: Number, required: true, default: 0 },
  name: {
    en: { type: String, required: true },
    "zh-TW": { type: String, required: true },
  },
});

const deliverySettingsSchema = new mongoose.Schema(
  {
    deliveryMethods: {
      type: [deliveryMethodSchema],
      default: [], // Empty array by default
    },
    freeDeliveryThreshold: {
      type: Number,
      required: true,
      default: 100,
    },
    bankAccountDetails: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const DeliverySettings =
  mongoose.models.DeliverySettings ||
  mongoose.model("DeliverySettings", deliverySettingsSchema);

export default DeliverySettings;
