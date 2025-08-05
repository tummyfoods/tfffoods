"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import ProductDetailsSinglePage from "@/components/ui/ProductDetailsSinglePage";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import type { Review } from "@/types";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ProductPage() {
  const params = useParams();
  const { id } = params;
  const { t, language } = useTranslation();
  const [averageRating, setAverageRating] = useState(0);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  const { data: productData, error: productError } = useSWR(
    `/api/product/${id}?language=${language}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: reviewsData } = useSWR(
    id ? `/api/review?productId=${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (reviewsData?.reviews) {
      setAllReviews(reviewsData.reviews);
      const avg =
        reviewsData.reviews.length > 0
          ? reviewsData.reviews.reduce(
              (acc: number, r: Review) => acc + r.rating,
              0
            ) / reviewsData.reviews.length
          : 0;
      setAverageRating(avg);
    }
  }, [reviewsData]);

  const isLoading = !productData && !productError;
  const isError = productError;

  if (isError) {
    console.error("Error loading product:", productError);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          {t("product.loadError")}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <LoadingSkeleton height="h-8" width="w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <LoadingSkeleton height="h-[400px]" />
          <div className="space-y-4">
            <LoadingSkeleton height="h-8" width="w-3/4" />
            <LoadingSkeleton height="h-6" width="w-1/2" />
            <LoadingSkeleton height="h-24" />
            <LoadingSkeleton height="h-12" />
          </div>
        </div>
      </div>
    );
  }

  const product = productData?.product;
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          {t("product.notFound")}
        </div>
      </div>
    );
  }

  const categoryName =
    product.category?.displayNames?.[language] || product.category?.name || "";

  const breadcrumbItems = [
    {
      label: t("navigation.products"),
      href: "/products",
    },
    {
      label: categoryName,
      href: `/categories/${product.category?.slug || product.category?._id}`,
    },
    {
      label: product.displayNames?.[language] || product.name,
      href: `/product/${id}`,
      current: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <ProductDetailsSinglePage
        product={product}
        averageRating={averageRating}
        allReviews={allReviews}
        setAllReviews={setAllReviews}
        setAverageRating={setAverageRating}
      />
    </div>
  );
}
