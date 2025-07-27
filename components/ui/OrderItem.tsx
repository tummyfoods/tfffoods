import React from "react";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types";
import { useTranslation } from "@/providers/language/LanguageContext";
import Link from "next/link";
import { formatDate } from "@/app/orders/[orderId]/utils";

const OrderItem = ({ order }: { order: Order }) => {
  const { t, language } = useTranslation();

  // Function to safely format the total
  const formatTotal = (total: number | string) => {
    if (typeof total === "number") {
      return total.toFixed(2);
    } else if (typeof total === "string" && !isNaN(parseFloat(total))) {
      return parseFloat(total).toFixed(2);
    }
    return "N/A";
  };

  // Get the first item's name for display
  const getFirstItemName = () => {
    if (!order.items || order.items.length === 0) return null;
    const firstItem = order.items[0];
    return (
      firstItem.id?.displayNames?.[language] ||
      firstItem.id?.name ||
      t("order.common.productNotAvailable")
    );
  };

  // Calculate total items
  const totalItems =
    order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return (
    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl transition-all duration-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 animate-fadeIn">
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">
              {order.orderReference || "N/A"}
            </p>
            {order.orderType === "period-order" &&
              order.periodInvoiceNumber && (
                <p className="text-sm text-primary font-medium">
                  {t("order.common.periodInvoice", {
                    number: order.periodInvoiceNumber,
                  })}
                </p>
              )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium
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
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("order.common.placedOn")} {formatDate(order.createdAt)}
          </p>
          {getFirstItemName() && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {getFirstItemName()}
              {order.items.length > 1 && (
                <span className="text-gray-500">
                  {" "}
                  {t("order.common.andOtherItems", {
                    count: order.items.length - 1,
                  })}
                </span>
              )}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("order.common.totalItems")}: {totalItems}
          </p>
          <p className="text-sm font-medium text-[#535C91] dark:text-[#6B74A9]">
            {t("order.common.total")} ${formatTotal(order.total)}
          </p>
        </div>
      </div>
      <div className="ml-4">
        <Link href={`/orders/${order._id}`}>
          <Button variant="outline" size="sm">
            {t("order.common.viewDetails")}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderItem;
