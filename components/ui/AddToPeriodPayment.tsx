"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/providers/user/UserContext";

interface DeliverySettings {
  deliveryTypes: {
    local: { cost: number; name: string };
    express: { cost: number; name: string };
    overseas: { cost: number; name: string };
  };
  freeDeliveryThreshold: number;
}

interface AddToPeriodPaymentProps {
  items: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  onSuccess?: () => void;
}

export function AddToPeriodPayment({
  items,
  onSuccess,
}: AddToPeriodPaymentProps) {
  const { t } = useTranslation();
  const { userData, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState("0");
  const [deliverySettings, setDeliverySettings] = useState<any>(null);

  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const response = await fetch("/api/delivery");
        const data = await response.json();
        setDeliverySettings(data);
      } catch (error) {
        console.error("Failed to fetch delivery settings:", error);
      }
    };

    fetchDeliverySettings();
  }, []);

  const handleSubmit = async () => {
    if (!userData) {
      toast.error(t("common.unauthorized"));
      return;
    }

    if (!userData.address) {
      toast.error(t("checkout.addressRequired"));
      return;
    }

    setLoading(true);
    try {
      // Calculate values for THIS specific order
      const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Calculate delivery cost for THIS order only
      const deliveryCost = deliverySettings
        ? subtotal >= (deliverySettings.freeDeliveryThreshold || 0)
          ? 0
          : deliverySettings.deliveryTypes[
              selectedDeliveryType as keyof typeof deliverySettings.deliveryTypes
            ].cost
        : 0;

      // Total for this specific order
      const total = subtotal + deliveryCost;

      // Get address from user profile
      const addressFields = {
        billingAddress: {
          en: userData.address.en || "",
          "zh-TW": userData.address["zh-TW"] || "",
          coordinates: userData.address.coordinates || null,
        },
        shippingAddress: {
          en: userData.address.en || "",
          "zh-TW": userData.address["zh-TW"] || "",
          coordinates: userData.address.coordinates || null,
        },
        streetAddress: userData.address.en || "",
      };

      console.log("Sending to API:", {
        items,
        subtotal,
        deliveryCost,
        total,
        deliveryType: selectedDeliveryType,
        ...addressFields,
      });

      const response = await axios.post("/api/period-payment/add", {
        items,
        subtotal,
        deliveryCost,
        total,
        deliveryType: selectedDeliveryType,
        ...addressFields,
      });

      if (response.data.success) {
        toast.success(t("periodPayment.success"));
        setOpen(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error adding to period payment:", error);
      toast.error(t("periodPayment.error"));
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("periodPayment.addToPeriod")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("periodPayment.title")}</DialogTitle>
          <DialogDescription>
            {t("periodPayment.addToPeriod")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Delivery Options */}
          {deliverySettings && (
            <div className="space-y-2">
              <Label>{t("admin.deliverySettings")}</Label>
              <select
                value={selectedDeliveryType}
                onChange={(e) => setSelectedDeliveryType(e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {Object.entries(deliverySettings.deliveryTypes).map(
                  ([key, value]) => (
                    <option key={key} value={key}>
                      {value.name} - ${value.cost.toFixed(2)}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2">
            <Label>{t("periodPayment.items")}</Label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>Item {index + 1}</span>
                  <span>
                    {item.quantity} x ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>{t("checkout.subtotal")}</span>
              <span>
                $
                {items
                  .reduce((sum, item) => sum + item.price * item.quantity, 0)
                  .toFixed(2)}
              </span>
            </div>
            {deliverySettings && (
              <div className="flex justify-between items-center">
                <span>{t("checkout.delivery")}</span>
                <span>
                  $
                  {(items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  ) >= (deliverySettings.freeDeliveryThreshold || 0)
                    ? 0
                    : deliverySettings.deliveryTypes[
                        selectedDeliveryType as keyof typeof deliverySettings.deliveryTypes
                      ].cost
                  ).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold">
              <span>{t("checkout.total")}</span>
              <span>
                $
                {(
                  items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  ) +
                  (deliverySettings
                    ? items.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      ) >= (deliverySettings.freeDeliveryThreshold || 0)
                      ? 0
                      : deliverySettings.deliveryTypes[
                          selectedDeliveryType as keyof typeof deliverySettings.deliveryTypes
                        ].cost
                    : 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? t("common.loading") : t("periodPayment.addToPeriod")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
