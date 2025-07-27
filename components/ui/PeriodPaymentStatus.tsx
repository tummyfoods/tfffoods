"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useUser } from "@/providers/user/UserContext";

interface PeriodPaymentStatusProps {
  onAddToPeriod?: () => void;
}

export function PeriodPaymentStatus({
  onAddToPeriod,
}: PeriodPaymentStatusProps) {
  const { t } = useTranslation();
  const { userData, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [periodData, setPeriodData] = useState<{
    isPeriodPaidUser: boolean;
    paymentPeriod: string | null;
    currentInvoice: any;
  } | null>(null);

  useEffect(() => {
    const fetchPeriodStatus = async () => {
      if (!userData) return;

      try {
        const response = await axios.get("/api/period-payment/status");
        setPeriodData(response.data);
      } catch (error) {
        console.error("Error fetching period status:", error);
        toast.error(t("periodPayment.error"));
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchPeriodStatus();
    }
  }, [userData, userLoading, t]);

  if (loading || userLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("periodPayment.title")}</CardTitle>
          <CardDescription>{t("common.loading")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!periodData?.isPeriodPaidUser) {
    return null;
  }

  const { paymentPeriod, currentInvoice } = periodData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("periodPayment.title")}</CardTitle>
        <CardDescription>
          {t("periodPayment.currentPeriod")}:{" "}
          {t(`periodPayment.${paymentPeriod}`)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentInvoice ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>{t("periodPayment.periodEnd")}:</span>
              <span>{format(new Date(currentInvoice.periodEnd), "PPP")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t("periodPayment.amount")}:</span>
              <span>${currentInvoice.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t("periodPayment.status.title")}:</span>
              <Badge
                variant={
                  currentInvoice.status === "paid"
                    ? "success"
                    : currentInvoice.status === "overdue"
                    ? "destructive"
                    : "default"
                }
              >
                {t(`periodPayment.status.${currentInvoice.status}`)}
              </Badge>
            </div>
            {onAddToPeriod && (
              <Button onClick={onAddToPeriod} className="w-full mt-4">
                {t("periodPayment.addToPeriod")}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              {t("periodPayment.noPeriod")}
            </p>
            {onAddToPeriod && (
              <Button onClick={onAddToPeriod} className="w-full">
                {t("periodPayment.addToPeriod")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
