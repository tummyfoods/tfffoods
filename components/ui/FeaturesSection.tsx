"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import * as LucideIcons from "lucide-react";

interface FeatureItem {
  icon: string;
  title: {
    en: string;
    "zh-TW": string;
  };
  description: {
    en: string;
    "zh-TW": string;
  };
}

const getIcon = (iconName: string | undefined) => {
  if (!iconName) return null;
  const Icon = (LucideIcons as any)[iconName];
  return Icon ? <Icon className="w-12 h-12 text-primary" /> : null;
};

const FeaturesSection = () => {
  const { t, language } = useTranslation();
  const [items, setItems] = useState<FeatureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState<{ en: string; "zh-TW": string }>({
    en: "",
    "zh-TW": "",
  });

  const fetchFeaturesSection = useCallback(async () => {
    try {
      const response = await fetch("/api/features-section", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch features section");
      const data = await response.json();
      if (data.items) {
        setItems(data.items);
      }
      if (data.title) {
        setTitle(data.title);
      }
    } catch (error) {
      console.error("Error fetching features section:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFeaturesSection();
  }, [fetchFeaturesSection]);

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 xl:gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg p-6 h-64"
          />
        ))}
      </div>
    );
  }

  return (
    <section
      className="py-16 mt-8 rounded-lg overflow-hidden relative transition-all duration-300"
      style={{ backgroundColor: "hsla(var(--card), var(--card-opacity, 1))" }}
    >
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 text-slate-800 dark:text-white transition-colors">
          {title[language] || title.en || t("common.whyChooseUs")}
        </h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 xl:gap-8">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center text-center rounded-lg transform transition-all duration-500 hover:scale-105 sm:p-4 md:p-6 md:min-w-[220px] xl:min-w-[340px]"
              style={{
                backgroundColor: "hsla(var(--card), var(--card-opacity, 0.8))",
              }}
            >
              <div className="mb-4 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-full transition-colors p-4">
                {getIcon(item.icon)}
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100 transition-colors break-words overflow-hidden text-ellipsis line-clamp-2 sm:text-lg md:text-xl xl:text-xl">
                {item.title[language] || item.title.en}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors break-words overflow-hidden text-ellipsis line-clamp-3 sm:text-sm md:text-base xl:text-lg">
                {item.description[language] || item.description.en}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
