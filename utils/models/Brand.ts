import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
  },
  displayNames: {
    en: { type: String, default: "" },
    "zh-TW": { type: String, default: "" },
  },
  descriptions: {
    en: { type: String, default: "" },
    "zh-TW": { type: String, default: "" },
  },
  isActive: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  products: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref: "Product",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date },
});

// Add indexes - define uniqueness only here, not in the schema fields
brandSchema.index({ slug: 1 }, { unique: true });
brandSchema.index({ name: 1 }, { unique: true });
brandSchema.index({ order: 1 });
brandSchema.index({ isActive: 1 });

// Pre-save middleware to generate slug from name
brandSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  next();
});

export interface IBrand extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  isActive: boolean;
  order: number;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const Brand =
  mongoose.models.Brand || mongoose.model<IBrand>("Brand", brandSchema);

export default Brand;
