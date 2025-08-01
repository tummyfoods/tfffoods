"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Trash2, ShoppingCart, Minus, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useCart } from "@/providers/cart/CartContext";
import type { CartStore, CartItem } from "@/types";

interface DeliveryMethod {
  cost: number;
  name: {
    en: string;
    "zh-TW": string;
  };
}

interface DeliverySettings {
  deliveryMethods: DeliveryMethod[];
  freeDeliveryThreshold: number;
}

interface CartProps {
  onClose: () => void;
  isMobile?: boolean;
}

const Cart = ({ onClose, isMobile = false }: CartProps) => {
  const { t, language } = useTranslation();
  const [deliverySettings, setDeliverySettings] =
    useState<DeliverySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use cart context
  const {
    items,
    removeItem,
    clearCart,
    updateQuantity,
    selectedDeliveryType,
    setSelectedDeliveryType,
  } = useCart();

  // Debug log for items and their specifications
  useEffect(() => {
    items.forEach((item) => {
      if (item.selectedSpecifications) {
        console.log("🛒 Cart Item Specs:", {
          itemId: item._id,
          specs: item.selectedSpecifications,
        });
      }
    });
  }, [items]);

  // Calculate subtotal and total items
  const { subtotal, totalItems } = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + item.price * (item.quantity || 1),
        totalItems: acc.totalItems + (item.quantity || 1),
      }),
      { subtotal: 0, totalItems: 0 }
    );
  }, [items]);

  // Fetch delivery settings
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/delivery");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched delivery settings:", data);

        // Convert old format to new format if necessary
        const settings: DeliverySettings = {
          deliveryMethods: data.deliveryMethods || [],
          freeDeliveryThreshold: data.freeDeliveryThreshold || 0,
        };

        setDeliverySettings(settings);

        // If there's no delivery type selected yet and we have methods, set the default
        if (selectedDeliveryType === 0 && settings.deliveryMethods.length > 0) {
          setSelectedDeliveryType(0);
        }
      } catch (error) {
        console.error("Failed to fetch delivery settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliverySettings();
  }, [selectedDeliveryType, setSelectedDeliveryType]);

  // Calculate delivery cost
  const deliveryCost = useMemo(() => {
    if (!deliverySettings?.deliveryMethods) return 0;

    if (subtotal >= (deliverySettings?.freeDeliveryThreshold || 0)) return 0;

    const methodIndex = selectedDeliveryType;
    if (
      typeof methodIndex !== "number" ||
      methodIndex < 0 ||
      methodIndex >= (deliverySettings?.deliveryMethods?.length || 0)
    ) {
      return 0;
    }

    return deliverySettings.deliveryMethods[methodIndex]?.cost || 0;
  }, [deliverySettings, selectedDeliveryType, subtotal]);

  const total = subtotal + deliveryCost;

  // Memoize handlers
  const handleRemove = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement>,
      id: string,
      specs?: Record<string, any>
    ) => {
      event.preventDefault();
      event.stopPropagation();
      removeItem(id, specs);
    },
    [removeItem]
  );

  const handleQuantityChange = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement>,
      id: string,
      newQuantity: number
    ) => {
      event.preventDefault();
      event.stopPropagation();
      if (newQuantity < 1) {
        const item = items.find((i) => i._id === id);
        removeItem(id, item?.selectedSpecifications);
      } else {
        updateQuantity(id, newQuantity);
      }
    },
    [removeItem, updateQuantity, items]
  );

  const handleCheckout = useCallback(() => {
    window.location.href = "/checkout";
  }, []);

  useEffect(() => {
    if (isMobile) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isMobile]);

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="cart-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
      />

      {/* Cart Panel */}
      <motion.div
        key="cart-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 20 }}
        className={`fixed top-0 right-0 h-full bg-white/15 dark:bg-gray-800/15 backdrop-blur-lg shadow-lg z-50 w-[85%] max-w-[400px]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 h-full flex flex-col max-h-screen">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t("cart.title")}
            </h2>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearCart();
                  }}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!items.length ? (
            <motion.div
              key="empty-cart"
              className="flex-1 flex flex-col items-center justify-center"
            >
              <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                {t("cart.empty")}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => {
                    // Create a stable key from the specifications
                    const specsKey = item.selectedSpecifications
                      ? Object.entries(item.selectedSpecifications)
                          .map(([key, value]) => {
                            const specValue =
                              typeof value === "object" && value !== null
                                ? `${
                                    (value as { en: string; "zh-TW": string })
                                      .en
                                  }-${
                                    (value as { en: string; "zh-TW": string })[
                                      "zh-TW"
                                    ]
                                  }`
                                : value;
                            return `${key}:${specValue}`;
                          })
                          .join(";")
                      : "";
                    const itemKey = `${item._id}-${specsKey}`;

                    return (
                      <motion.div
                        key={itemKey}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center p-3 border border-gray-200/30 dark:border-gray-700/30 rounded-lg bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm"
                      >
                        <Image
                          src={item.images[0]}
                          width={60}
                          height={60}
                          className="rounded-md object-cover mr-3"
                          alt={item.name}
                          unoptimized
                        />
                        <div className="flex-grow">
                          {/* Product Name */}
                          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 pr-2">
                            {item.displayNames?.[language] || item.name}
                          </h3>

                          <div className="flex flex-col space-y-1">
                            {/* Category */}
                            {item.category && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-normal">
                                  {t("product.category.label")}:{" "}
                                </span>
                                {item.category.displayNames?.[language] ||
                                  item.category.name}
                              </p>
                            )}

                            {/* Brand */}
                            {item.brand && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-normal">
                                  {t("product.brand.label")}:{" "}
                                </span>
                                {typeof item.brand === "string"
                                  ? item.brand
                                  : item.brand?.displayNames?.[language] ||
                                    item.brand?.name}
                              </p>
                            )}

                            {/* Specifications */}
                            {Object.entries(item.selectedSpecifications || {})
                              .length > 0 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {Object.entries(
                                  item.selectedSpecifications || {}
                                ).map(([key, value]) => {
                                  // Get the translated name for the specification
                                  const displayName =
                                    t(`cart.specifications.${key}`) ||
                                    key
                                      .split("_")
                                      .map(
                                        (word) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1)
                                      )
                                      .join(" ");

                                  // Get the correct language value
                                  const displayValue =
                                    typeof value === "object" && value !== null
                                      ? (
                                          value as {
                                            en: string;
                                            "zh-TW": string;
                                          }
                                        )[language] ||
                                        (
                                          value as {
                                            en: string;
                                            "zh-TW": string;
                                          }
                                        ).en
                                      : value;

                                  return (
                                    <div
                                      key={key}
                                      className="flex items-center gap-1"
                                    >
                                      <span className="font-normal">
                                        {displayName}:
                                      </span>
                                      <span className="text-primary">
                                        {displayValue}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Quantity and Price Controls */}
                          <div className="flex items-center mt-2">
                            <button
                              onClick={(e) =>
                                handleQuantityChange(
                                  e,
                                  item._id,
                                  (item.quantity || 1) - 1
                                )
                              }
                              className="text-gray-500 hover:text-gray-600 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="mx-2 min-w-[20px] text-center">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={(e) =>
                                handleQuantityChange(
                                  e,
                                  item._id,
                                  (item.quantity || 1) + 1
                                )
                              }
                              className="text-gray-500 hover:text-gray-600 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <div className="ml-auto text-right">
                              <div className="text-xs text-gray-500">
                                {t("cart.basePrice")}: $
                                {item.basePrice?.toFixed(2)}
                              </div>
                              {Object.entries(item.selectedSpecifications || {})
                                .filter(([key]) => key.endsWith("_price"))
                                .map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="text-xs text-gray-500"
                                  >
                                    {t(`cart.specifications.${key}`)}:
                                    {Number(value) === 0
                                      ? t("common.free")
                                      : `$${Number(value).toFixed(2)}`}
                                  </div>
                                ))}
                              <span className="font-semibold mt-1 block">
                                $
                                {(item.price * (item.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={(e) =>
                                handleRemove(
                                  e,
                                  item._id,
                                  item.selectedSpecifications
                                )
                              }
                              className="ml-2 text-red-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Delivery Type Selector */}
              {!isLoading &&
                deliverySettings &&
                deliverySettings.deliveryMethods &&
                deliverySettings.deliveryMethods.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("cart.deliverySettings")}
                    </label>
                    <select
                      value={selectedDeliveryType}
                      onChange={(e) =>
                        setSelectedDeliveryType(Number(e.target.value))
                      }
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                      {(deliverySettings?.deliveryMethods || []).map(
                        (method, index) => (
                          <option key={index} value={index}>
                            {`${
                              method.name?.[language] ||
                              method.name?.en ||
                              `Delivery Method ${index + 1}`
                            } - ${
                              subtotal >=
                              (deliverySettings?.freeDeliveryThreshold || 0)
                                ? t("cart.delivery.free")
                                : `$${method.cost?.toFixed(2) || "0.00"}`
                            }`}
                          </option>
                        )
                      )}
                    </select>
                    <div className="mt-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              subtotal >=
                              (deliverySettings?.freeDeliveryThreshold || 0)
                                ? "bg-green-500 dark:bg-green-400"
                                : "bg-[#535C91] dark:bg-[#6B74A9]"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (subtotal /
                                  (deliverySettings?.freeDeliveryThreshold ||
                                    0)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs whitespace-nowrap">
                          ${subtotal.toFixed(2)} / $
                          {(
                            deliverySettings?.freeDeliveryThreshold || 0
                          ).toFixed(2)}
                        </span>
                      </div>
                      {subtotal >=
                      (deliverySettings?.freeDeliveryThreshold || 0) ? (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {t("cart.delivery.freeDeliveryReached")}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {t("cart.delivery.spendMore", {
                            amount: (
                              (deliverySettings?.freeDeliveryThreshold || 0) -
                              subtotal
                            ).toFixed(2),
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {/* Cart Summary */}
              <div className="border-t border-gray-200/30 dark:border-gray-700/30 pt-4 mt-auto">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("cart.summary.items")} ({totalItems})
                  </span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {t("cart.summary.shipping")}
                  </span>
                  <span className="font-semibold">
                    {subtotal >= (deliverySettings?.freeDeliveryThreshold || 0)
                      ? t("cart.delivery.free")
                      : `$${deliveryCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">
                    {t("cart.summary.total")}
                  </span>
                  <span className="font-bold text-lg">${total.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#535C91] hover:bg-[#424874] text-white py-2 px-4 rounded transition-colors"
                >
                  {t("cart.summary.checkout")}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Cart;
