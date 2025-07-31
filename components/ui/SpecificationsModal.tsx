"use client";

import { useState } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { useCart } from "@/providers/cart/CartContext";
import { useCartUI } from "@/components/ui/CartUIContext";

interface SpecificationsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function SpecificationsModal({
  product,
  isOpen,
  onClose,
}: SpecificationsModalProps) {
  const { language, t } = useTranslation();
  const { addItem } = useCart();
  const { openCart } = useCartUI();
  const [selectedSpecs, setSelectedSpecs] = useState<
    Record<string, string | number>
  >({});

  // Debug log
  console.log("Product Specifications:", {
    specs: product.specifications,
    category: product.category?.specifications,
  });

  // Calculate total price including options
  const calculateTotalPrice = () => {
    let totalPrice = product.price;
    product.category?.specifications?.forEach((spec) => {
      if (spec.type === "select" && spec.options && selectedSpecs[spec.key]) {
        const selectedValue = selectedSpecs[spec.key];
        const optionIndex = spec.options[language].indexOf(
          selectedValue as string
        );
        if (optionIndex !== -1 && spec.options.prices) {
          totalPrice += spec.options.prices[optionIndex] || 0;
        }
      }
    });
    return totalPrice;
  };

  const handleSpecChange = (specKey: string, value: string) => {
    const spec = product.category?.specifications?.find(
      (s) => s.key === specKey
    );
    if (spec?.type === "select" && spec.options) {
      const optionIndex = spec.options[language].indexOf(value);
      if (optionIndex !== -1 && spec.options.prices) {
        setSelectedSpecs((prev) => ({
          ...prev,
          [specKey]: value,
          [`${specKey}_price`]: spec.options.prices?.[optionIndex] || 0,
        }));
      }
    }
  };

  const handleAddToCart = () => {
    const totalPrice = calculateTotalPrice();
    addItem({
      ...product,
      price: totalPrice,
      basePrice: product.price,
      selectedSpecifications: selectedSpecs,
    });
    openCart();
    onClose();
  };

  const isValid = product.specifications?.every(
    (spec) => !spec.required || selectedSpecs[spec.key]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {product.displayNames?.[language] || product.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {product.category?.specifications?.map((spec) => (
            <div key={spec.key} className="space-y-2">
              <label className="text-sm font-medium">
                {spec.displayNames?.[language] || spec.key}
                {spec.required && <span className="text-red-500">*</span>}
              </label>
              {spec.type === "select" && spec.options && (
                <select
                  value={selectedSpecs[spec.key] || ""}
                  onChange={(e) => handleSpecChange(spec.key, e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">--</option>
                  {spec.options[language].map((option, index) => (
                    <option key={option} value={option}>
                      {option}
                      {spec.options?.prices?.[index] === 0
                        ? " Free"
                        : spec.options?.prices?.[index]
                        ? ` +$${spec.options.prices[index].toFixed(2)}`
                        : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
          <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">{t("cart.basePrice")}:</span>
              <span>${product.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">{t("cart.total")}:</span>
              <span className="text-lg font-bold">
                ${calculateTotalPrice().toFixed(2)}
              </span>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={!isValid}
              className="w-full"
            >
              {t("common.addToCart")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
