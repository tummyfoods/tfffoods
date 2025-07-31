"use client";
import React, { useState, useEffect } from "react";
import ProductImageGallery from "./ProductImageGallery";
import GuaranteeSection from "./GuaranteeSection";
import ReviewSection from "./ReviewSection";
import FeaturesSection from "./FeaturesSection";
import ProdDetailsList from "./ProdDetailsList";
import ProdDetailsPrice from "./ProdDetailsPrice";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useStore } from "@/providers/store/StoreContext";
import { useTranslation } from "@/providers/language/LanguageContext";
import { MultiLangDisplay } from "@/components/MultiLangInput/MultiLangInput";
import type { Product, Review } from "@/types";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { useCart } from "@/providers/cart/CartContext";
import { useCartUI } from "@/components/ui/CartUIContext";

interface Props {
  product: Product;
  averageRating: number;
  allReviews: Review[];
  setAllReviews: (reviews: Review[]) => void;
  setAverageRating: (avg: number) => void;
}

interface SpecOptions {
  en: string[];
  "zh-TW": string[];
}

const ProductDetailsSinglePage = ({
  product,
  averageRating,
  allReviews,
  setAllReviews,
  setAverageRating,
}: Props) => {
  const { settings } = useStore();
  const { language, t } = useTranslation();
  const { addItem } = useCart();
  const { openCart } = useCartUI();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Initialize selectedSpecs with default values from product
  const [selectedSpecs, setSelectedSpecs] = useState<
    Record<string, string | number>
  >(() => {
    const initialSpecs: Record<string, string | number> = {};
    product.specifications?.forEach((spec) => {
      if (spec.value?.[language]) {
        // Use current language
        initialSpecs[spec.key] = spec.value[language];
      }
    });
    return initialSpecs;
  });

  // Update selectedSpecs when product changes
  useEffect(() => {
    const initialSpecs: Record<string, string | number> = {};
    product.specifications?.forEach((spec) => {
      if (spec.value?.[language]) {
        // Use current language
        initialSpecs[spec.key] = spec.value[language];
      }
    });
    setSelectedSpecs(initialSpecs);
  }, [product, language]); // Add language as dependency

  // Listen for product updates - client side only
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleProductUpdate = (event: CustomEvent) => {
      if (event.detail.productId === product._id) {
        // Revalidate all product-related data
        Promise.all([
          mutate(`/api/product/${product._id}?language=${language}`),
          mutate(`/api/review?productId=${product._id}`),
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

  useEffect(() => {
    console.log(
      "🔄 ProductDetailsSinglePage - selectedSpecs updated:",
      selectedSpecs
    );
  }, [selectedSpecs]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Handle add to cart with specifications
  const handleAddToCartWithSpecs = (
    e: React.MouseEvent<HTMLButtonElement>,
    specs?: Record<string, string>
  ) => {
    e.preventDefault();

    // Use passed specs or fallback to state
    const specsToUse = specs || selectedSpecs;
    console.log("ProductDetailsSinglePage - Using specs for cart:", specsToUse);

    // Check if all required specifications are selected
    const hasAllRequiredSpecs =
      product.specifications?.every(
        (spec) => !spec.required || specsToUse[spec.key]
      ) ?? true;

    console.log("ProductDetailsSinglePage - Validation:", {
      specs: specsToUse,
      productSpecs: product.specifications,
      hasAllRequired: hasAllRequiredSpecs,
    });

    if (!hasAllRequiredSpecs) {
      toast.error(t("product.specifications.selectRequired"));
      return;
    }

    // Get the display values for specifications with translations
    const specDisplayValues: Record<string, { en: string; "zh-TW": string }> =
      {};

    console.log("All specifications:", product.specifications);
    console.log("Selected specs:", specsToUse);

    product.specifications?.forEach((spec) => {
      const selectedValue = specsToUse[spec.key];

      console.log("Processing spec:", {
        key: spec.key,
        type: spec.type,
        selectedValue,
        options: spec.options,
      });

      if (selectedValue) {
        if (spec.type === "select" && spec.options) {
          // Handle select-type specifications
          const langOptions = spec.options as unknown as SpecOptions;
          const enOptions = langOptions.en || [];
          const zhOptions = langOptions["zh-TW"] || [];

          console.log("Language options:", {
            en: enOptions,
            "zh-TW": zhOptions,
            selectedValue,
          });

          // Find the index in the current language's options
          const currentLangOptions = langOptions[language] || [];
          const selectedIndex = currentLangOptions.indexOf(selectedValue);

          if (selectedIndex !== -1) {
            // Store both language values
            specDisplayValues[spec.key] = {
              en: enOptions[selectedIndex],
              "zh-TW": zhOptions[selectedIndex],
            };
          }
        } else {
          // Handle text and number type specifications
          specDisplayValues[spec.key] = {
            en: selectedValue,
            "zh-TW": selectedValue,
          };
        }
      }
    });

    console.log("Final spec values:", specDisplayValues);

    // Calculate total price including options
    let totalPrice = product.price;
    Object.entries(specsToUse).forEach(([key, value]) => {
      if (key.endsWith("_price")) {
        totalPrice += Number(value) || 0;
      }
    });

    console.log("Adding to cart with prices:", {
      basePrice: product.price,
      totalPrice,
      selectedSpecs: specsToUse,
    });

    // Create cart item with specifications
    const cartItem = {
      _id: product._id,
      name: product.name,
      displayNames: product.displayNames,
      images: product.images,
      price: totalPrice, // Use total price including options
      basePrice: product.price, // Store original price
      brand: product.brand || "No Brand",
      category: product.category,
      material: product.material || "Not Specified",
      condition: product.condition || "Not Specified",
      quantity: 1,
      selectedSpecifications: {
        ...specDisplayValues,
        ...Object.entries(specsToUse)
          .filter(([key]) => key.endsWith("_price"))
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      },
    };

    addItem(cartItem);
    mutate(`/api/product/${product._id}?language=${language}&skipCache=true`);
    openCart();
  };

  return (
    <div className="container-custom">
      <section className="py-8 md:py-4 bg-background">
        <div className="app-global-container mx-auto px-4 lg:px-8 max-w-screen-2xl w-full">
          <div className="flex flex-col md:flex-row bg-card rounded-t-xl overflow-hidden">
            <ProductImageGallery product={product} />
            <div className="flex flex-col flex-1">
              <div className="sm:w-full p-4 md:p-6">
                <ProdDetailsList
                  product={product}
                  onSpecificationsChange={setSelectedSpecs}
                />
                <div className="mt-4">
                  <ProdDetailsPrice
                    product={{
                      ...product,
                      price: (() => {
                        let totalPrice = product.price;
                        product.specifications?.forEach((spec) => {
                          if (
                            spec.type === "select" &&
                            spec.options &&
                            selectedSpecs[spec.key]
                          ) {
                            const selectedValue = selectedSpecs[spec.key];
                            const optionIndex =
                              spec.options[language].indexOf(selectedValue);
                            if (optionIndex !== -1 && spec.options.prices) {
                              totalPrice +=
                                spec.options.prices[optionIndex] || 0;
                            }
                          }
                        });
                        return totalPrice;
                      })(),
                    }}
                    selectedSpecs={selectedSpecs}
                    handleAddToCart={handleAddToCartWithSpecs}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ReviewSection
              productId={product._id.toString()}
              averageRating={averageRating}
              allReviews={allReviews}
              setAllReviews={setAllReviews}
              setAverageRating={setAverageRating}
            />
          </div>
          <GuaranteeSection />
          <div className="container mx-auto px-4">
            <div className="pt-8">
              <h2 className="text-3xl md:text-2xl font-bold text-center mb-12 text-foreground">
                <MultiLangDisplay
                  value={settings.contactPage.faq.title}
                  currentLang={language}
                />
              </h2>
              <div className="container mx-auto px-4">
                {settings.contactPage.faq.questions.map((faq, index) => (
                  <div key={index} className="mb-2">
                    <button
                      className="flex justify-between items-center w-full p-2 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                      onClick={() => toggleFaq(index)}
                    >
                      <h3 className="text-lg font-semibold text-left text-foreground">
                        <MultiLangDisplay
                          value={faq.question}
                          currentLang={language}
                        />
                      </h3>
                      {openFaqIndex === index ? (
                        <ChevronUp className="w-6 h-4 text-primary" />
                      ) : (
                        <ChevronDown className="w-6 h-4 text-primary" />
                      )}
                    </button>
                    {openFaqIndex === index && (
                      <div className="bg-card mt-2 p-2 rounded-lg shadow-md">
                        <p className="text-muted-foreground">
                          <MultiLangDisplay
                            value={faq.answer}
                            currentLang={language}
                          />
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="container mx-auto px-4">
            <FeaturesSection />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailsSinglePage;
