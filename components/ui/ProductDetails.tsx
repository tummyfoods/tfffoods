"use client";

import React, { useEffect } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import { mutate } from "swr";
import { useTranslation } from "@/providers/language/LanguageContext";

interface ProdDetailsPriceProps {
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    stock: number;
  };
  averageRating: number;
  allReviews?: { rating: number }[];
  isInWishlist: boolean;
  handleAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  toggleWishlist: (e: React.MouseEvent<HTMLButtonElement>) => void;
  session?: any;
}

const ProdDetailsPrice = ({
  product,
  averageRating,
  allReviews,
  isInWishlist,
  handleAddToCart,
  toggleWishlist,
  session,
}: ProdDetailsPriceProps) => {
  const { language } = useTranslation();

  // Listen for product updates - client side only
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleProductUpdate = (event: CustomEvent) => {
      if (event.detail.productId === product._id) {
        // Revalidate all product-related data
        Promise.all([
          mutate(`/api/product/${product._id}`),
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
  }, [product._id]);

  return (
    <div className="md:w-1/2 px-4 sm:px-8 pb-8 sm:pt-20">
      <div className="relative overflow-hidden bg-card rounded-t-xl shadow-lg p-4 sm:p-8 mb-8 hover:shadow-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -left-4 w-40 h-40 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-40 h-40 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 transform-gpu">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground antialiased">
            <span className="bg-clip-text text-foreground">{product.name}</span>
          </h1>

          <div className="flex items-center flex-wrap mb-6">
            <p className="text-xl sm:text-2xl font-semibold text-primary mr-2 sm:mr-4 antialiased">
              ${product.price.toFixed(2)}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <p className="text-lg sm:text-xl text-muted-foreground line-through mr-2 sm:mr-4 antialiased">
                  ${product.originalPrice.toFixed(2)}
                </p>
                <span className="px-2 py-1 text-xs sm:text-sm font-semibold bg-primary/20 text-primary rounded-full antialiased">
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )}
                  % OFF
                </span>
              </>
            )}
            {session?.user?.admin && (
              <div className="ml-4 text-sm text-muted-foreground">
                <span className="font-semibold">Stock:</span> {product.stock}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-md hover:bg-primary/90 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 flex items-center justify-center"
              disabled={product.stock === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5 animate-bounce" />
              <span className="font-semibold">
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </span>
            </button>
            <button
              onClick={toggleWishlist}
              className={`
                p-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50
                ${
                  isInWishlist
                    ? "bg-destructive text-destructive-foreground focus:ring-destructive"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 focus:ring-muted"
                }
              `}
            >
              <Heart
                className={`h-6 w-6 transform transition-transform duration-800 ${
                  isInWishlist
                    ? "fill-current animate-pulse"
                    : "hover:scale-110"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProdDetailsPrice, (prevProps, nextProps) => {
  return (
    prevProps.product._id === nextProps.product._id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.originalPrice === nextProps.product.originalPrice &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.isInWishlist === nextProps.isInWishlist &&
    prevProps.averageRating === nextProps.averageRating &&
    (prevProps.allReviews?.length || 0) === (nextProps.allReviews?.length || 0)
  );
});
