import mongoose, { Document } from "mongoose";

interface Specification {
  label: string;
  key: string;
  type: "text" | "number" | "select";
  options?: {
    en: string[];
    "zh-TW": string[];
  };
  required: boolean;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
}

export interface CategoryDocument extends Document {
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
  specifications?: Specification[];
  products: mongoose.Types.ObjectId[];
  order: number;
  isActive: boolean;
}

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      lowercase: true,
    },
    displayNames: {
      en: {
        type: String,
        required: [true, "English display name is required"],
      },
      "zh-TW": {
        type: String,
        required: [true, "Chinese display name is required"],
      },
    },
    descriptions: {
      en: {
        type: String,
        default: "",
      },
      "zh-TW": {
        type: String,
        default: "",
      },
    },
    specifications: [
      {
        label: { type: String, required: true },
        key: { type: String, required: true },
        type: {
          type: String,
          enum: ["text", "number", "select"],
          required: true,
        },
        options: {
          en: {
            type: [String],
            default: undefined,
            validate: {
              validator: function (this: any, options: string[] | undefined) {
                return (
                  this.type !== "select" ||
                  (Array.isArray(options) && options.length > 0)
                );
              },
              message:
                "English options are required for select-type specifications",
            },
          },
          "zh-TW": {
            type: [String],
            default: undefined,
            validate: {
              validator: function (this: any, options: string[] | undefined) {
                return (
                  this.type !== "select" ||
                  (Array.isArray(options) && options.length > 0)
                );
              },
              message:
                "Chinese options are required for select-type specifications",
            },
          },
          prices: {
            type: [Number],
            default: undefined,
            validate: {
              validator: function (this: any, prices: number[] | undefined) {
                if (this.type !== "select") return true;
                return !prices || prices.every((price) => price >= 0);
              },
              message: "Option prices must be non-negative numbers",
            },
          },
        },
        required: { type: Boolean, default: false },
        displayNames: {
          en: { type: String, required: true },
          "zh-TW": { type: String, required: true },
        },
        descriptions: {
          en: { type: String, default: "" },
          "zh-TW": { type: String, default: "" },
        },
      },
    ],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Add indexes - define uniqueness only here, not in the schema fields
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1 });

// Pre-save middleware to generate slug and name
categorySchema.pre("save", function (next) {
  // If displayNames.en is modified, update name and slug
  if (this.isModified("displayNames.en")) {
    this.name = this.displayNames.en.toLowerCase().replace(/\s+/g, "-");
    this.slug = this.name;
  }

  // Ensure order is a number
  if (this.isModified("order")) {
    this.order = parseInt(String(this.order)) || 0;
  }

  next();
});

// Remove any existing models to prevent the old schema from persisting
if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

const Category = mongoose.model<CategoryDocument>("Category", categorySchema);

export default Category;
