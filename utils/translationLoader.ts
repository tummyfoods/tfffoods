import { Language } from "@/types/language";

interface TranslationModule {
  path: string;
  loaded: boolean;
  data: Record<string, any>;
}

class TranslationLoader {
  private cache: Map<string, TranslationModule> = new Map();
  private commonModulesLoaded: Set<string> = new Set();
  private isServer: boolean;

  constructor() {
    this.cache = new Map();
    this.isServer = typeof window === "undefined";
  }

  private getCacheKey(language: string, module: string): string {
    return `${language}:${module}`;
  }

  async loadTranslationModule(
    language: Language,
    module: string
  ): Promise<Record<string, any>> {
    const cacheKey = this.getCacheKey(language, module);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cachedModule = this.cache.get(cacheKey);
      if (cachedModule && cachedModule.loaded) {
        return cachedModule.data;
      }
    }

    try {
      // Load from /locales/ - this is the CORRECT path
      const response = await fetch(`/locales/${language}/${module}.json`);
      if (!response.ok) {
        console.error(`Failed to load ${module} translations for ${language}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const translationData = await response.json();

      // Update cache
      this.cache.set(cacheKey, {
        path: `${language}/${module}`,
        loaded: true,
        data: translationData,
      });

      return translationData;
    } catch (error) {
      console.error(
        `Failed to load translation module ${module} for language ${language}:`,
        error
      );

      // Return empty object as fallback
      return {};
    }
  }

  async preloadCommonModules(language: Language): Promise<void> {
    if (this.commonModulesLoaded.has(language)) {
      return;
    }

    // Load all needed modules for checkout
    const commonModules = ["common", "navigation", "checkout-page"];

    try {
      await Promise.all(
        commonModules.map((module) =>
          this.loadTranslationModule(language, module)
        )
      );
      this.commonModulesLoaded.add(language);
    } catch (error) {
      console.error(
        `Failed to preload common modules for language ${language}:`,
        error
      );
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.commonModulesLoaded.clear();
  }
}

// Export singleton instance
export const translationLoader = new TranslationLoader();
