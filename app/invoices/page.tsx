"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { FileText, Search, Filter, Download, Printer } from "lucide-react";
import { useUser } from "@/providers/user/UserContext";
import { toast } from "react-hot-toast";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceType: "one-time" | "period";
  periodInvoiceNumber?: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  orders: any[];
  items: any[];
  billingAddress?: {
    streetName: { en: string; "zh-TW": string };
    district: { en: string; "zh-TW": string };
    location: { en: string; "zh-TW": string };
  };
  shippingAddress?: {
    streetName: { en: string; "zh-TW": string };
    district: { en: string; "zh-TW": string };
    location: { en: string; "zh-TW": string };
  };
}

const formatDate = (
  date: string | Date | null | undefined,
  formatStr: string
): string => {
  if (!date) return "";
  try {
    return format(new Date(date), formatStr);
  } catch (error) {
    console.error("Invalid date:", date);
    return "";
  }
};

export default function InvoicesPage() {
  const { t, language } = useTranslation();
  const { data: session, status } = useSession();
  const { userData, loading: userLoading } = useUser();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/invoices");
    }
  }, [status, router]);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (filterType && filterType !== "all") params.append("type", filterType);
      if (filterStatus && filterStatus !== "all")
        params.append("status", filterStatus);

      const response = await axios.get(`/api/invoices/user?${params}`);
      const { invoices: newInvoices, pagination } = response.data;

      if (page === 1) {
        setInvoices(newInvoices);
      } else {
        setInvoices((prev) => [...prev, ...newInvoices]);
      }

      setHasMore(page < pagination.pages);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterStatus, t]);

  useEffect(() => {
    if (userData && !userLoading) {
      fetchInvoices();
    }
  }, [userData, userLoading, fetchInvoices]);

  const handleInvoiceClick = (invoiceNumber: string) => {
    router.push(`/invoices/${invoiceNumber}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      (invoice.invoiceNumber &&
        invoice.invoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (invoice.periodInvoiceNumber &&
        invoice.periodInvoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

  if (loading || userLoading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("invoice.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("invoice.subtitle")}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t("invoice.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("invoice.filters.type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("invoice.list.allTypes")}</SelectItem>
            <SelectItem value="one-time">
              {t("invoice.type.oneTime")}
            </SelectItem>
            <SelectItem value="period">
              {t("invoice.type.periodInvoice")}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("invoice.filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("invoice.list.allStatuses")}</SelectItem>
            <SelectItem value="pending">
              {t("invoice.status.pending")}
            </SelectItem>
            <SelectItem value="paid">{t("invoice.status.paid")}</SelectItem>
            <SelectItem value="overdue">
              {t("invoice.status.overdue")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      <div className="grid gap-4">
        {filteredInvoices.map((invoice) => (
          <Card
            key={invoice._id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleInvoiceClick(invoice.invoiceNumber)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {invoice.invoiceNumber}
                  </CardTitle>
                  {invoice.periodInvoiceNumber && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("invoice.type.periodInvoice")}:{" "}
                      {invoice.periodInvoiceNumber}
                    </p>
                  )}
                </div>
                <Badge className={getStatusColor(invoice.status)}>
                  {t(`invoice.status.${invoice.status}`)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">
                    {t("invoice.labels.amount")}:
                  </span>
                  <span className="ml-2">${invoice.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="font-medium">
                    {t("invoice.labels.type")}:
                  </span>
                  <span className="ml-2">
                    {invoice.invoiceType === "one-time"
                      ? t("invoice.type.oneTime")
                      : t("invoice.type.periodInvoice")}
                  </span>
                </div>
                <div>
                  <span className="font-medium">
                    {t("invoice.labels.created")}:
                  </span>
                  <span className="ml-2">
                    {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
              {invoice.invoiceType === "period" && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{t("invoice.labels.period")}: </span>
                  {formatDate(invoice.periodStart, "MMM dd")} -{" "}
                  {formatDate(invoice.periodEnd, "MMM dd, yyyy")}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-8 text-center">
          <Button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={loading}
            variant="outline"
          >
            {loading ? t("common.loading") : t("invoice.list.loadMore")}
          </Button>
        </div>
      )}

      {!loading && filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {t("invoice.list.empty")}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("invoice.list.noInvoicesDescription")}
          </p>
        </div>
      )}
    </div>
  );
}
