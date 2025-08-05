import mongoose from "mongoose";

const multiLangSchema = {
  en: {
    type: String,
    default: "",
  },
  "zh-TW": {
    type: String,
    default: "",
  },
};

const privacyPolicySchema = {
  title: multiLangSchema,
  subtitle: multiLangSchema,
  sections: [
    {
      title: multiLangSchema,
      content: multiLangSchema,
      _id: false,
    },
  ],
  contactInfo: {
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: multiLangSchema,
  },
  lastUpdated: { type: Date, default: Date.now },
};

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: multiLangSchema,
    slogan: multiLangSchema,
    copyright: {
      en: {
        type: String,
        default: "© {{year}} {{storeName}}",
      },
      "zh-TW": {
        type: String,
        default: "© {{year}} {{storeName}}",
      },
    },
    logo: {
      type: String,
      default: "",
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
        default: "",
      },
      phone: {
        type: String,
        required: true,
        default: "",
      },
    },
    businessHours: {
      weekdays: multiLangSchema,
      weekends: multiLangSchema,
    },
    socialMedia: {
      facebook: {
        type: String,
        default: "",
      },
      instagram: {
        type: String,
        default: "",
      },
      twitter: {
        type: String,
        default: "",
      },
    },
    shippingInfo: {
      standardDays: {
        type: String,
        default: "",
      },
      expressDays: {
        type: String,
        default: "",
      },
      internationalShipping: {
        type: Boolean,
        default: false,
      },
      show: {
        type: Boolean,
        default: true,
      },
      title: multiLangSchema,
      standardShipping: multiLangSchema,
      expressShipping: multiLangSchema,
    },
    returnPolicy: {
      daysToReturn: {
        type: Number,
        default: 30,
      },
      conditions: multiLangSchema,
      show: {
        type: Boolean,
        default: true,
      },
      title: multiLangSchema,
    },
    newsletterSettings: {
      title: multiLangSchema,
      subtitle: multiLangSchema,
      bannerImage: {
        type: String,
        default: "",
      },
      discountPercentage: {
        type: Number,
        default: 0,
      },
      buttonText: multiLangSchema,
      disclaimer: multiLangSchema,
    },
    aboutPage: {
      title: multiLangSchema,
      subtitle: multiLangSchema,
      bannerImage: {
        type: String,
        default: "",
      },
      story: {
        title: multiLangSchema,
        content: multiLangSchema,
        image: {
          type: String,
          default: "",
        },
      },
      values: {
        title: multiLangSchema,
        items: [
          {
            title: multiLangSchema,
            description: multiLangSchema,
            icon: {
              type: String,
            },
          },
        ],
      },
      team: {
        title: multiLangSchema,
        members: [
          {
            name: multiLangSchema,
            role: multiLangSchema,
            image: {
              type: String,
            },
            description: multiLangSchema,
          },
        ],
      },
    },
    contactPage: {
      title: multiLangSchema,
      subtitle: multiLangSchema,
      bannerImage: {
        type: String,
        default: "",
      },
      contactInfo: {
        title: multiLangSchema,
        officeLocations: [
          {
            name: multiLangSchema,
            address: multiLangSchema,
            phone: {
              type: String,
              default: "",
            },
            email: {
              type: String,
              default: "",
            },
            hours: multiLangSchema,
            coordinates: {
              lat: {
                type: Number,
                default: 0,
              },
              lng: {
                type: Number,
                default: 0,
              },
            },
          },
        ],
      },
      supportChannels: {
        title: multiLangSchema,
        image: {
          type: String,
          default: "",
        },
        channels: [
          {
            title: multiLangSchema,
            description: multiLangSchema,
            icon: {
              type: String,
            },
          },
        ],
      },
      faq: {
        title: multiLangSchema,
        questions: [
          {
            question: multiLangSchema,
            answer: multiLangSchema,
          },
        ],
      },
    },
    privacyPolicy: privacyPolicySchema,
  },
  {
    timestamps: true,
  }
);

const StoreSettings =
  mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", storeSettingsSchema);

export default StoreSettings;
