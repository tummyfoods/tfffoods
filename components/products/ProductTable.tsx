"use client";

import { Product } from "@/types";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Star, ShoppingCart } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useCart } from "@/providers/cart/CartContext";
import { useCartUI } from "@/components/ui/CartUIContext";
import { WishlistButton } from "@/components/ui/WishlistButton";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import axios from "axios";
import { useEffect, useState } from "react";
import { SpecificationsModal } from "../ui/SpecificationsModal";

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const ProductRow = ({ product: initialProduct }: { product: Product }) => {
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const { language, t } = useTranslation();
  const { addItem } = useCart();
  const { openCart } = useCartUI();
  const { data: session } = useSession();

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

    // If product has specifications, show modal
    if (currentProduct.category?.specifications?.length > 0) {
      setIsSpecModalOpen(true);
      return;
    }

    // If no specifications, add directly to cart
    addItem({
      ...currentProduct,
      basePrice: currentProduct.price,
      price: currentProduct.price,
    });
    openCart();
  };

  return (
    <>
      <tr
        className="border-b border-border hover:bg-accent/5"
        data-product-id={currentProduct._id}
      >
        <td className="p-4">
          <div className="relative h-16 w-16">
            <Image
              src={currentProduct.images[0]}
              alt={currentProduct.name}
              fill
              className="object-cover rounded"
            />
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <Link href={`/product/${currentProduct._id}`}>
              <span className="font-medium hover:text-primary block mb-2 sm:mb-0">
                {currentProduct.displayNames?.[language] || currentProduct.name}
              </span>
            </Link>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-medium">
                ${currentProduct.price.toFixed(2)}
              </span>
              {currentProduct.originalPrice &&
                currentProduct.originalPrice > currentProduct.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${currentProduct.originalPrice.toFixed(2)}
                  </span>
                )}
            </div>
          </div>
        </td>
        <td className="hidden sm:table-cell p-4">
          <div className="flex items-center">
            {currentProduct.averageRating &&
            currentProduct.averageRating > 0 ? (
              <>
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="ml-1">
                  {currentProduct.averageRating.toFixed(1)} (
                  {currentProduct.numReviews})
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                {t("common.noRatingsYet")}
              </span>
            )}
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              size="sm"
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className="hidden sm:inline-flex"
            >
              {currentStock === 0
                ? t("product.stock.outOfStock")
                : t("common.addToCart")}
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className="sm:hidden h-10 w-10 bg-[#535C91] hover:bg-[#424874] text-white"
              title={
                currentStock === 0
                  ? t("product.stock.outOfStock")
                  : t("common.addToCart")
              }
            >
              <ShoppingCart className="h-6 w-6" />
            </Button>
            <WishlistButton productId={currentProduct._id} variant="icon" />
            {session?.user?.admin && (
              <Link href={`/admin/editProduct/${currentProduct._id}`}>
                <Edit className="w-5 h-5 text-muted-foreground hover:text-primary" />
              </Link>
            )}
          </div>
        </td>
      </tr>
      {/* Specifications Modal */}
      <SpecificationsModal
        product={currentProduct}
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />
    </>
  );
};

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <LoadingSkeleton key={i} height="h-16" className="rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {products.map((product) => (
              <ProductRow key={product._id} product={product} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
