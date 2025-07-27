import mongoose from "mongoose";

// Define the maintenance record schema
const maintenanceRecordSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    nextMaintenanceDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Define the vehicle schema
const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true, // Using index here instead of schema.index()
    },
    model: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "in-delivery", "maintenance", "out-of-service"],
      default: "available",
      index: true, // Using index here instead of schema.index()
    },
    maintenanceRecords: [maintenanceRecordSchema],
    currentDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastMaintenance: {
      type: Date,
    },
    nextScheduledMaintenance: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Vehicle =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;
