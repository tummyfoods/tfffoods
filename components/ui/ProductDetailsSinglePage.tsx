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

interface Props {
  product: Product;
  averageRating: number;
  allReviews: Review[];
  handleAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  setAllReviews: (reviews: Review[]) => void;
  setAverageRating: (avg: number) => void;
}

const ProductDetailsSinglePage = ({
  product,
  averageRating,
  allReviews,
  handleAddToCart,
  setAllReviews,
  setAverageRating,
}: Props) => {
  const { settings } = useStore();
  const { language } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="container-custom">
      <section className="py-8 md:py-4 bg-background">
        <div className="app-global-container mx-auto px-4 lg:px-8 max-w-screen-2xl w-full">
          <div className="flex flex-col md:flex-row bg-card rounded-t-xl overflow-hidden">
            <ProductImageGallery product={product} />
            <div className="flex flex-col md:flex-row flex-1 -mt-4 md:mt-0">
              <ProdDetailsPrice
                product={product}
                handleAddToCart={handleAddToCart}
                className="order-1 md:order-2 -mt-2 md:mt-0"
              />
              <div className="sm:w-full md:w-1/2 p-2 md:p-6 order-2 md:order-1">
                <ProdDetailsList product={product} />
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
