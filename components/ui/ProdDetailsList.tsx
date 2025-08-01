"use client";

import React, { useEffect } from "react";
import { Product } from "@/types";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useSession } from "next-auth/react";
import { mutate } from "swr";
import { MultiLangDisplay } from "@/components/MultiLangInput/MultiLangInput";

// Simple mapping for specification titles
const SPEC_TITLES: Record<string, { en: string; "zh-TW": string }> = {
  manufactury_country: {
    en: "Manufacturing Country",
    "zh-TW": "製造國",
  },
  origin: {
    en: "Country of Origin",
    "zh-TW": "原產地",
  },
  material: {
    en: "Material",
    "zh-TW": "材質",
  },
  weight: {
    en: "Weight",
    "zh-TW": "重量",
  },
  size: {
    en: "Size",
    "zh-TW": "尺寸",
  },
  color: {
    en: "Color",
    "zh-TW": "顏色",
  },
};

interface Props {
  product: Product;
  onSpecificationsChange?: (
    selectedSpecs: Record<string, string | number>
  ) => void;
}

interface SpecValue {
  en: string;
  "zh-TW": string;
}

interface SpecOptions {
  en: string[];
  "zh-TW": string[];
  prices?: number[];
}

const isSpecOptions = (options: any): options is SpecOptions => {
  return (
    options &&
    typeof options === "object" &&
    Array.isArray(options.en) &&
    Array.isArray(options["zh-TW"])
  );
};

interface Specification {
  key: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: SpecOptions;
  value: {
    en: string;
    "zh-TW": string;
  };
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions?: {
    en: string;
    "zh-TW": string;
  };
}

const ProdDetailsList = ({ product, onSpecificationsChange }: Props) => {
  const { language, t } = useTranslation();
  const { data: session } = useSession();
  const hasInitialized = React.useRef(false);

  // Use localStorage to persist selections
  const [selectedSpecs, setSelectedSpecs] = React.useState<
    Record<string, string | number>
  >(() => {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem(`specs-${product._id}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Handle specification selection change
  const handleSpecChange = (
    specKey: string,
    value: string,
    spec: Specification
  ) => {
    console.log("🔍 ProdDetailsList - User Selected Spec:", {
      specKey,
      value,
      currentSpecs: selectedSpecs,
    });

    // Find the option index and its corresponding price
    let optionPrice = 0;
    if (spec.type === "select" && spec.options) {
      console.log("Checking option price:", {
        spec,
        value,
        options: spec.options,
        prices: spec.options.prices,
        language,
      });
      const optionIndex = spec.options[language].indexOf(value);
      console.log("Found option index:", optionIndex);
      if (optionIndex !== -1 && spec.options.prices) {
        optionPrice = spec.options.prices[optionIndex] || 0;
        console.log("Setting option price:", optionPrice);
      }
    }

    const newSpecs = {
      ...selectedSpecs,
      [specKey]: value,
      [`${specKey}_price`]: optionPrice,
    };

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(`specs-${product._id}`, JSON.stringify(newSpecs));
    }

    setSelectedSpecs(newSpecs);
    onSpecificationsChange?.(newSpecs);
  };

  // Clear specs when product changes
  React.useEffect(() => {
    setSelectedSpecs({});
    if (typeof window !== "undefined") {
      localStorage.removeItem(`specs-${product._id}`);
    }
  }, [product._id]);

  // Initialize selectedSpecs from product specifications
  React.useEffect(() => {
    if (hasInitialized.current) return;

    console.log("🔍 ProdDetailsList - Initializing specs from product:", {
      productSpecs: product.specifications,
      categorySpecs: product.category?.specifications,
    });

    const initialSpecs: Record<string, string> = {};

    if (Object.keys(selectedSpecs).length === 0) {
      console.log("📦 ProdDetailsList - Setting empty initial specs");
      setSelectedSpecs(initialSpecs);
      onSpecificationsChange?.(initialSpecs);
    } else {
      console.log(
        "📦 ProdDetailsList - Keeping existing specs:",
        selectedSpecs
      );
    }

    hasInitialized.current = true;
  }, [
    product.specifications,
    onSpecificationsChange,
    product.category?.specifications,
    selectedSpecs,
  ]);

  // Listen for product updates - client side only
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleProductUpdate = (event: CustomEvent) => {
      if (event.detail.productId === product._id) {
        Promise.all([
          mutate(
            `/api/product/${product._id}?language=${language}`,
            undefined,
            { revalidate: true }
          ),
          mutate(`/api/products/manage/${product._id}`, undefined, {
            revalidate: true,
          }),
        ]);
      }
    };

    window.addEventListener(
      "product:updated",
      handleProductUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "product:updated",
        handleProductUpdate as EventListener
      );
    };
  }, [product._id, language]);

  // Convert specifications to array format if it's an object
  const specifications = React.useMemo(() => {
    // Get category specifications
    const categorySpecs = product.category?.specifications || [];

    // Get product specifications
    const productSpecs = product.specifications || [];

    // Merge category specs with product specs, using product values if available
    return categorySpecs.map((categorySpec) => {
      const productSpec = productSpecs.find(
        (ps) => ps.key === categorySpec.key
      );
      return {
        ...categorySpec,
        value: productSpec?.value || { en: "", "zh-TW": "" },
        options: categorySpec.options as SpecOptions | undefined,
      } as Specification;
    });
  }, [product.category?.specifications, product.specifications]);

  // Get the display value for a specification based on the current language
  const getSpecDisplayValue = (spec: any, value: string) => {
    console.log("ProdDetailsList - getSpecDisplayValue:", {
      spec,
      value,
      language,
    });

    if (!spec.options) return value;

    // Find the index of the English value
    const index = spec.options.en.findIndex((opt: string) => opt === value);
    console.log("ProdDetailsList - Found option index:", index);

    if (index === -1) return value;

    // Return the corresponding value in the current language
    const displayValue =
      language === "en" ? value : spec.options["zh-TW"][index] || value;
    console.log("ProdDetailsList - Returning display value:", displayValue);
    return displayValue;
  };

  // Render options
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-foreground">
        <MultiLangDisplay value={product.displayNames} currentLang={language} />
      </h1>
      <div className="space-y-4">
        {/* First Line */}
        <div className="grid grid-cols-2 gap-4">
          {/*Category*/}
          {product.category && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                {t("product.category.label")}
              </h4>
              <p className="text-foreground">
                {product.category.displayNames?.[language] ||
                  product.category.name}
              </p>
            </div>
          )}

          {/* Brand */}
          {product.brand && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                {t("product.brand.label")}
              </h4>
              <p className="text-foreground">
                {product.brand.displayNames?.[language] || product.brand.name}
              </p>
            </div>
          )}
        </div>

        {/* Stock - Only visible to admin */}
        {session?.user?.admin && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">
              {t("product.stock.label")}
            </h4>
            <p className="text-foreground">
              {product.stock} {t("product.stock.inStock")}
            </p>
          </div>
        )}

        {/* Second Line */}
        <div className="grid grid-cols-2 gap-4">
          {/* Featured Status */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">
              {t("product.featured")}
            </h4>
            <p className="text-foreground">
              {product.featured ? t("common.yes") : t("common.no")}
            </p>
          </div>

          {/* Listed Date */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">
              {t("product.listedDate")}
            </h4>
            <p className="text-foreground">
              {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {specifications.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold mb-2">
            {t("product.details.specifications")}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {specifications.map((spec) => (
              <div key={spec.key} className="pb-2">
                <h5 className="text-sm font-semibold text-muted-foreground mb-1">
                  {spec.displayNames?.[language] ||
                    spec.key
                      .split("_")
                      .map(
                        (word: string) =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  {spec.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </h5>
                {spec.type === "select" && spec.options ? (
                  <div className="grid grid-cols-1 gap-2">
                    {(() => {
                      console.log("Rendering spec options:", {
                        key: spec.key,
                        type: spec.type,
                        options: spec.options,
                      });

                      // Get language-specific options
                      const defaultOptions: SpecOptions = {
                        en: [],
                        "zh-TW": [],
                        prices: [],
                      };
                      const langOptions = spec.options || defaultOptions;
                      const options = (langOptions[
                        language as keyof typeof langOptions
                      ] || []) as string[];

                      console.log("Language options:", {
                        language,
                        options,
                        isArray: Array.isArray(options),
                      });

                      return options.map((option: string) => {
                        const isSelected =
                          selectedSpecs[spec.key]?.toString() === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              handleSpecChange(spec.key, option, spec)
                            }
                            className={`card-item flex items-center justify-between px-4 py-2 rounded-md hover:bg-accent ${
                              isSelected ? "bg-accent" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border ${
                                  isSelected
                                    ? "bg-primary border-primary"
                                    : "border-[color:var(--card-item-border-color)]"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 bg-white rounded-full m-auto mt-1" />
                                )}
                              </div>
                              <span>{option}</span>
                            </div>
                            {(() => {
                              const optionIndex = options.indexOf(option);
                              const price = spec.options?.prices?.[optionIndex];
                              return price !== undefined ? (
                                <span className="text-sm text-muted-foreground">
                                  {price === 0
                                    ? t("common.free")
                                    : `+$${price.toFixed(2)}`}
                                </span>
                              ) : null;
                            })()}
                          </button>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <p className="text-foreground">
                    {spec.value?.[language] || Object.values(spec.value)[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-1">
          {t("product.details.description")}
        </h4>
        <p className="text-foreground whitespace-pre-wrap">
          {product.descriptions?.[language] || // First try descriptions object
            product.description || // Then fallback to plain description
            t("common.noDescription")}
        </p>
      </div>
    </div>
  );
};

// Export with memo to prevent unnecessary re-renders
export default React.memo(ProdDetailsList, (prevProps, nextProps) => {
  return (
    prevProps.product._id === nextProps.product._id &&
    JSON.stringify(prevProps.product.specifications) ===
      JSON.stringify(nextProps.product.specifications)
  );
});
