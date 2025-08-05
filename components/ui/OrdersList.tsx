"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import OrderItem from "./OrderItem";
import toast from "react-hot-toast";
import type { Order, OrdersResponse } from "@/types";
import { useRouter } from "next/navigation";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useUser } from "@/providers/user/UserContext";

// Add this component before the OrdersList component
const OrdersSkeleton = () => {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-6 animate-pulse"
        >
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface OrdersListProps {
  initialOrders?: Order[];
}

const OrdersList = ({ initialOrders = [] }: OrdersListProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { userData, loading: userLoading } = useUser();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reset orders when session changes
  useEffect(() => {
    setOrders([]);
    setPage(1);
    setHasMore(false);
    setError(null);
  }, [session?.user?.email]);

  const observer = useRef<IntersectionObserver>();

  const lastOrderElementRef = useCallback(
    (node: Element | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchOrders = useCallback(async () => {
    if (!userData?.email) {
      console.log("No user email found");
      setLoading(false);
      return;
    }

    try {
      const isFirstPage = page === 1;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const res = await axios.get<OrdersResponse>(
        `/api/orders?page=${page}&limit=10&email=${encodeURIComponent(
          userData.email
        )}`
      );

      if (res.data.orders) {
        if (isFirstPage) {
          setOrders(res.data.orders);
        } else {
          setOrders((prevOrders) => [...prevOrders, ...res.data.orders]);
        }
        setHasMore(res.data.hasMore);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(t("order.status.failedToFetch"));
      toast.error(t("order.status.failedToFetch"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, userData?.email, t]);

  useEffect(() => {
    if (userData?.email) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [page, userData?.email, fetchOrders]);

  if (!session || userLoading) {
    return <OrdersSkeleton />;
  }

  if (loading && page === 1) {
    return <OrdersSkeleton />;
  }

  return (
    <Card className="w-full bg-white dark:bg-gray-900 shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="bg-[#535C91] dark:bg-[#6B74A9] p-6">
        <h2 className="text-3xl font-bold text-white">
          {t("order.common.yourOrders")}
        </h2>
      </CardHeader>
      <CardContent className="p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {error ? (
          <div className="text-center text-red-500 dark:text-red-400 bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-sm">
            <p>{error}</p>
            <button
              onClick={() => {
                setError(null);
                setPage(1);
                fetchOrders();
              }}
              className="mt-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {t("common.tryAgain")}
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/50 dark:bg-gray-800/50 p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {t("order.common.noOrders")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div
                key={order._id}
                ref={index === orders.length - 1 ? lastOrderElementRef : null}
                className="bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <OrderItem order={order} />
              </div>
            ))}
            {loadingMore && (
              <div className="flex flex-col justify-center items-center h-32 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#535C91] dark:border-[#6B74A9] mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  {t("order.status.loading")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersList;
