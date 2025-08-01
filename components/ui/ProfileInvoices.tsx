"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card } from "@/components/ui/card";
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
import { Search, FileText } from "lucide-react";
import { toast } from "react-hot-toast";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceType: "one-time" | "period";
  periodInvoiceNumber?: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  createdAt: string;
  orders: string[];
}

export default function ProfileInvoices() {
  const { t } = useTranslation();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const response = await axios.get(`/api/invoices/user?${params}`);
      if (response.data.invoices) {
        setInvoices(response.data.invoices);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, t]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleInvoiceClick = useCallback(
    (invoiceNumber: string) => {
      router.push(`/invoices/${invoiceNumber}`);
    },
    [router]
  );

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  }, []);

  const filteredInvoices = React.useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.invoiceNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (invoice.periodInvoiceNumber &&
            invoice.periodInvoiceNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      ),
    [invoices, searchTerm]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        {t("common.loading")}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          {t("invoice.noInvoices")}
        </h3>
        <p className="text-gray-500">{t("invoice.noInvoicesDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
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

      <div className="grid gap-4">
        {filteredInvoices.map((invoice) => (
          <Card
            key={invoice._id}
            className="cursor-pointer hover:shadow-md transition-shadow p-4"
            style={{
              backgroundColor: "hsla(var(--card), var(--card-opacity, 1))",
            }}
            onClick={() => handleInvoiceClick(invoice.invoiceNumber)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {invoice.invoiceNumber}
                </h3>
                {invoice.periodInvoiceNumber && (
                  <p className="text-sm text-gray-500">
                    {invoice.periodInvoiceNumber}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {format(new Date(invoice.createdAt), "PPP")}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <Badge className={getStatusColor(invoice.status)}>
                  {t(`invoice.status.${invoice.status}`)}
                </Badge>
                <p className="mt-2 font-semibold">
                  ${invoice.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
