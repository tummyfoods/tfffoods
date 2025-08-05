"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Star } from "lucide-react";

declare module "@/types" {
  interface Product {
    originalPrice?: number;
  }
}

const SearchResults = () => {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const query = searchParams?.get ? searchParams.get("q") || "" : "";
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/products-search?q=${encodeURIComponent(
            query
          )}&language=${language}`
        );
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = await res.json();
        setResults(data.products || []);
      } catch (error) {
        console.error("Error searching products:", error);
        setError("Failed to load search results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, language]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          {t("search.noResults")} &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {results.map((item) => (
        <div
          key={item._id}
          className="bg-card rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
        >
          <Link href={`/product/${item._id}`} className="block">
            <div className="aspect-square overflow-hidden">
              <Image
                src={item.images[0] || "/placeholder-product.jpg"}
                alt={item.name}
                width={400}
                height={400}
                className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                {item.name}
              </h3>
              {item.brand && (
                <p className="text-sm text-muted-foreground">
                  {item.brand.displayNames?.[language] || item.brand.name}
                </p>
              )}
              <div className="flex items-center mt-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm text-muted-foreground">
                  {item.averageRating ? item.averageRating.toFixed(1) : "0.0"} (
                  {item.numReviews || 0} {t("common.reviews")})
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-bold text-primary">
                  ${item.price.toFixed(2)}
                </span>
                {item.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${item.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
