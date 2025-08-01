"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "axios";
import { useTranslation } from "@/providers/language/LanguageContext";
import { cn } from "@/lib/utils";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface CategoriesMenuProps {
  className?: string;
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
}

export default function CategoriesMenu({
  className,
  selectedCategory,
  onCategorySelect,
}: CategoriesMenuProps) {
  const { language } = useTranslation();
  const { data, error } = useSWR(
    `/api/categories?language=${language}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const isLoading = !data && !error;

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[...Array(5)].map((_, i) => (
          <LoadingSkeleton key={i} height="h-8" className="rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <nav className={cn("space-y-1", className)}>
      {data?.categories?.map((category: any) => {
        const isSelected = selectedCategory === category._id;
        return (
          <Link
            key={category._id}
            href={`/categories/${category.slug}`}
            onClick={() => onCategorySelect?.(category._id)}
            className={cn(
              "card-item block px-4 py-2 text-sm transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {category.displayNames?.[language] || category.name}
          </Link>
        );
      })}
    </nav>
  );
}
