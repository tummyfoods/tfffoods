"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Crown, Edit, Star } from "lucide-react";
import type { Product } from "@/types";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useCart } from "@/providers/cart/CartContext";
import { useCartUI } from "@/components/ui/CartUIContext";
import { StarRating } from "@/components/ui/StarRating";
import useSWR from "swr";
import axios from "axios";
import { useEffect } from "react";

interface ProductCardProps {
  product: Product;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ProductCard({
  product: initialProduct,
}: ProductCardProps) {
  const { data: session } = useSession();
  const { language, t } = useTranslation();
  const { addItem } = useCart();
  const { openCart } = useCartUI();

  // Use SWR to keep product data fresh
  const { data, mutate } = useSWR(
    `/api/product/${initialProduct._id}?language=${language}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  // Listen for product deletion events
  useEffect(() => {
    const handleProductDelete = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.productId === initialProduct._id) {
        // Force the data to be null and don't revalidate
        mutate(null, false);
      }
    };

    window.addEventListener("product:deleted", handleProductDelete);

    return () => {
      window.removeEventListener("product:deleted", handleProductDelete);
    };
  }, [initialProduct._id, mutate]);

  // If product is deleted or not found, don't render
  if (!data?.product) {
    return null;
  }

  // Use current data only
  const currentProduct = data.product;
  const currentStock = currentProduct.stock;

  const handleAddToCart = () => {
    if (currentStock === 0) return;
    addItem(currentProduct);
    openCart();
  };

  const handleFeatureToggle = async () => {
    // Optimistically update the UI
    const newFeaturedStatus = !currentProduct.featured;
    mutate(
      {
        ...data,
        product: {
          ...currentProduct,
          featured: newFeaturedStatus,
        },
      },
      false
    );

    // Notify other components
    const event = new CustomEvent("product:toggleFeature", {
      detail: currentProduct._id,
    });
    window.dispatchEvent(event);
  };

  // Ensure featured status is a boolean
  const isFeatured = Boolean(currentProduct.featured);

  return (
    <div
      className="bg-card rounded-lg shadow-md overflow-hidden relative border border-border"
      data-product-id={currentProduct._id}
    >
      {session?.user?.admin && (
        <>
          <Link
            href={`/admin/editProduct/${currentProduct._id}`}
            className="right-iconAssignTop"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit className="w-5 h-5 text-foreground" />
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFeatureToggle();
            }}
            className="left-iconAssignTop"
            title={
              isFeatured
                ? t("product.toggleFeatured.remove")
                : t("product.toggleFeatured.add")
            }
          >
            <Crown
              className={`crown-icon w-5 h-5 ${
                isFeatured ? "crown-featured" : "crown-unfeatured"
              }`}
            />
          </button>
        </>
      )}
      <Link href={`/product/${currentProduct._id}`}>
        <div className="relative h-[30vh] sm:h-64 w-full">
          <Image
            src={currentProduct.images[0] || "/placeholder-product.jpg"}
            alt={currentProduct.name}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-4">
        <Link href={`/product/${currentProduct._id}`}>
          <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 ">
            {currentProduct.displayNames?.[language] || currentProduct.name}
          </h3>
        </Link>
        <div className="flex items-center">
          <div className="flex items-center space-x-1">
            {currentProduct.averageRating &&
            currentProduct.averageRating > 0 ? (
              <div className="flex items-center">
                <StarRating rating={currentProduct.averageRating} />
                <span className="ml-1 text-xs sm:text-sm text-muted-foreground">
                  {currentProduct.averageRating.toFixed(1)}
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm text-muted-foreground">
                {t("common.noRatingsYet")} ({currentProduct.numReviews || 0})
              </span>
            )}
          </div>
          <span className="ml-2 text-xs sm:text-sm text-muted-foreground">
            ({currentProduct.numReviews || 0})
          </span>
        </div>
        <div className="flex items-center">
          <p className="text-base sm:text-lg font-bold text-foreground">
            ${currentProduct.price.toFixed(2)}
          </p>
          {currentProduct.originalPrice &&
            currentProduct.originalPrice > currentProduct.price && (
              <p className="ml-2 text-xs sm:text-sm text-muted-foreground line-through">
                ${currentProduct.originalPrice.toFixed(2)}
              </p>
            )}
        </div>
        <div className="flex justify-between items-center pt-4 mt-4 sm:pt-2 ">
          <button
            onClick={handleAddToCart}
            disabled={currentStock === 0}
            className={`add-to-cart-button text-sm sm:text-base right-iconAssignBottom ${
              currentStock === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {currentStock === 0
              ? t("product.stock.outOfStock")
              : t("common.addToCart")}
          </button>
          <WishlistButton
            productId={currentProduct._id}
            variant="icon"
            className="left-iconAssignBottom"
          />
        </div>
      </div>
    </div>
  );
}
