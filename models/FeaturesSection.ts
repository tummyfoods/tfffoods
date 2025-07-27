import mongoose from "mongoose";

interface MultiLangString {
  en: string;
  "zh-TW": string;
}

interface FeatureItem {
  icon: string;
  title: MultiLangString;
  description: MultiLangString;
  order: number;
}

interface FeaturesSectionDocument extends mongoose.Document {
  title: MultiLangString;
  items: FeatureItem[];
  createdAt: Date;
  updatedAt: Date;
}

const featuresSectionSchema = new mongoose.Schema<FeaturesSectionDocument>(
  {
    title: {
      en: {
        type: String,
        required: true,
      },
      "zh-TW": {
        type: String,
        required: true,
      },
    },
    items: [
      {
        icon: {
          type: String,
          required: true,
        },
        title: {
          en: {
            type: String,
            required: true,
          },
          "zh-TW": {
            type: String,
            required: true,
          },
        },
        description: {
          en: {
            type: String,
            required: true,
          },
          "zh-TW": {
            type: String,
            required: true,
          },
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const FeaturesSection =
  mongoose.models.FeaturesSection ||
  mongoose.model<FeaturesSectionDocument>(
    "FeaturesSection",
    featuresSectionSchema
  );
