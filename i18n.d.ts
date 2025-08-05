import type { Messages } from "next-intl";

// Import your default locale messages
import messages from "./public/locales/en.json";

declare module "next-intl" {
  interface AppConfig {
    // Define supported locales
    Locale: "en" | "zh-TW";
    // Define messages type based on your default locale
    Messages: typeof messages;
  }
}
