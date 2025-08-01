"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { fetchOrder } from "./api";
import { formatDate, formatPrice } from "./utils";
import { Button } from "@/components/ui/button";
import { CldUploadButton } from "next-cloudinary";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  ArrowLeft,
  ShoppingBag,
  Upload,
  Download,
  Printer,
} from "lucide-react";
import { format } from "date-fns";

type OrderDetailsParams = {
  orderId: string;
};

const OrderDetails = () => {
  const { t, language } = useTranslation();
  const params = useParams<OrderDetailsParams>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const loadOrder = async () => {
      try {
        if (!params?.orderId) {
          toast.error(t("order.errors.load"));
          return;
        }
        const orderData = await fetchOrder(params.orderId);
        console.log("Order data in frontend:", {
          orderType: orderData.orderType,
          paymentMethod: orderData.paymentMethod,
          periodInvoiceNumber: orderData.periodInvoiceNumber,
          orderReference: orderData.orderReference,
          fullData: orderData,
        });
        setOrder(orderData);
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error(t("order.errors.load"));
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, [params?.orderId, t]);

  const handlePaymentProofUpload = async (result: any) => {
    if (!result?.info?.secure_url) {
      toast.error(t("order.errors.upload"));
      return;
    }

    if (!params?.orderId) {
      toast.error(t("order.errors.update"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.put(`/api/orders/${params.orderId}`, {
        paymentProofUrl: result.info.secure_url,
      });
      if (response.data.success) {
        setOrder(response.data.order);
        toast.success(t("order.success.proofUpdated"));
      }
    } catch (error) {
      console.error("Error updating payment proof:", error);
      toast.error(t("order.errors.update"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = (orderId: string) => {
    const url = new URL(`/api/orders/${orderId}/print`, window.location.origin);
    window.open(url.toString(), "_blank");
  };

  const handleDownload = (orderId: string) => {
    const url = new URL(
      `/api/orders/${orderId}/download`,
      window.location.origin
    );
    window.open(url.toString(), "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {t("order.errors.notFound")}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("order.errors.checkId")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("order.common.back")}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handlePrint(order._id)}>
              <Printer className="h-4 w-4 mr-2" />
              {t("orders.details.actions.print")}
            </Button>
            <Button variant="outline" onClick={() => handleDownload(order._id)}>
              <Download className="h-4 w-4 mr-2" />
              {t("orders.details.actions.download")}
            </Button>
          </div>
        </div>

        {/* Order Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-2">
              {order.orderType === "period-order" &&
                order.periodInvoiceNumber && (
                  <div>
                    <div className="inline-block px-3 py-1 rounded-lg text-base font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-1">
                      {t("order.common.periodInvoice", {
                        number: order.periodInvoiceNumber,
                      })}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("order.common.periodDates", {
                        start: format(
                          new Date(order.periodStart),
                          "yyyy/MM/dd"
                        ),
                        end: format(new Date(order.periodEnd), "yyyy/MM/dd"),
                      })}
                    </p>
                  </div>
                )}
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t("order.common.orderReference", {
                    ref: order.orderReference,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium
                ${
                  order.status === "pending"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : ""
                }
                ${
                  order.status === "pending_payment_verification"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : ""
                }
                ${
                  order.status === "processing"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : ""
                }
                ${
                  order.status === "shipped"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : ""
                }
                ${
                  order.status === "delivered"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : ""
                }
                ${
                  order.status === "cancelled"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : ""
                }
              `}
              >
                {t(`order.status.${order.status}`)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                {t("order.placedOn")}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                {t("order.details.status.lastUpdated")}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(order.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-xs font-medium mb-3 text-gray-900 dark:text-gray-100">
            {t("order.details.customerInfo.title")}
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 w-20">
                {t("order.details.customerInfo.name")}:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {order.name}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 w-20">
                {t("order.details.customerInfo.email")}:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {order.email}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 w-20">
                {t("order.details.customerInfo.phone")}:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {order.phone || t("order.common.noPhone")}
              </span>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-xs font-medium mb-3 text-gray-900 dark:text-gray-100">
            {t("order.details.address.title")}
          </h2>

          {/* Shipping Address */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-2">
              {t("order.details.address.shipping")}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-xs">
              {order.shippingAddress?.[language] || order.shippingAddress?.en}
            </div>
          </div>

          {/* Delivery Method */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-2">
              {t("order.common.method")}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-xs">
              {order.deliveryMethodName?.[language] ||
                order.deliveryMethodName?.en ||
                t("common.notSpecified")}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-xs font-medium mb-3 text-gray-900 dark:text-gray-100">
            {t("order.details.items.title")}
          </h2>
          <div className="space-y-3">
            {order.items.map((item: any, index: number) => (
              <div
                key={item.id?._id || index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12">
                    <Image
                      src={item.id?.images?.[0] || "/placeholder.png"}
                      alt={item.id?.displayNames?.[language] || item.id?.name}
                      fill
                      className="object-cover rounded-lg"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {item.id?.displayNames?.[language] || item.id?.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("order-details.orderSummary.items.quantity")}:{" "}
                      {item.quantity}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("order-details.orderSummary.items.price")}: $
                      {item.id?.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    ${(item.quantity * (item.id?.price || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-4 border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{t("order-details.orderSummary.subtotal")}</span>
                <span>${(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{t("order-details.orderSummary.delivery")}</span>
                <span>${(order.deliveryCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-gray-900 dark:text-gray-100">
                <span>{t("order-details.orderSummary.total")}</span>
                <span>${(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-xs font-medium mb-3 text-gray-900 dark:text-gray-100">
            {t("order.common.information")}
          </h2>

          {/* Payment Reference */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-2">
              {t("order.details.payment.reference")}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-xs">
              {order.paymentReference || t("common.notSpecified")}
            </div>
          </div>

          {/* Payment Proof */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-2">
              {t("order.details.payment.proof")}
            </h3>
            {order.paymentProof ? (
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                <Image
                  src={order.paymentProof}
                  alt="Payment Proof"
                  width={160}
                  height={80}
                  className="w-auto h-auto rounded-lg"
                />
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-xs text-gray-500">
                {t("common.notSpecified")}
              </div>
            )}
          </div>

          {/* Upload Button */}
          {order.status === "pending" && (
            <div className="space-y-3">
              <CldUploadButton
                onSuccess={handlePaymentProofUpload}
                uploadPreset="payment-proofs"
                className={`w-full bg-primary hover:bg-primary/90 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  if (isSubmitting) {
                    e.preventDefault();
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {t("order.details.payment.uploading")}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t("order.details.payment.uploadProof")}
                  </>
                )}
              </CldUploadButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
