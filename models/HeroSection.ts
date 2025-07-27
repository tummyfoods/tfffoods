import mongoose from "mongoose";

const multiLangSchema = {
  en: {
    type: String,
    required: true,
  },
  "zh-TW": {
    type: String,
    required: true,
  },
};

const heroSectionSchema = new mongoose.Schema(
  {
    title: multiLangSchema,
    description: multiLangSchema,
    creditText: {
      en: {
        type: String,
        default: "",
      },
      "zh-TW": {
        type: String,
        default: "",
      },
    },
    media: {
      type: {
        videoUrl: {
          type: String,
          default: "",
        },
        posterUrl: {
          type: String,
          default: "/images/placeholder-hero.jpg",
        },
        mediaType: {
          type: String,
          enum: ["video", "image"],
          default: "image",
        },
      },
      required: true,
      _id: false,
    },
    buttons: {
      primary: {
        text: multiLangSchema,
        link: {
          type: String,
          required: true,
        },
      },
      secondary: {
        text: multiLangSchema,
        link: {
          type: String,
          required: true,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const HeroSection =
  mongoose.models.HeroSection ||
  mongoose.model("HeroSection", heroSectionSchema);

export default HeroSection;
