export type Language = "en" | "zh-TW";
export interface TranslationModule {
  [key: string]: string | TranslationModule;
}

