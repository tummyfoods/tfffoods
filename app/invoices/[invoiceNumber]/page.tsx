"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ArrowLeft, Download, Printer, FileText } from "lucide-react";
import Image from "next/image";
import PrintableInvoice from "@/components/PrintableInvoice";
import printInvoice from "@/components/PrintInvoice";
import { formatAddress } from "@/utils/formatAddress";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { toast } from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { CldUploadButton, CldUploadWidgetResults } from "next-cloudinary";
import { useCloudinary } from "@/hooks/useCloudinary";
import { useUser } from "@/providers/user/UserContext";

// Register fonts
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlfBBc9.ttf",
      fontWeight: "bold",
    },
  ],
});

interface CartProduct {
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    description?: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
  };
  quantity: number;
}

interface OrderItem {
  id: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    description?: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
  };
  quantity: number;
}

interface Order {
  _id: string;
  total: number;
  totalPremium?: number;
  items: OrderItem[];
  cartProducts?: CartProduct[]; // Added for frontend compatibility
  createdAt: string;
  name?: string;
  email?: string;
  status?: string;
  deliveryCost: number;
  subtotal: number;
  deliveryMethod: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  periodInvoiceNumber?: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      en: string;
      "zh-TW": string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  orders: Order[];
  status: string;
  billingAddress?: {
    en: string;
    "zh-TW": string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  shippingAddress?: {
    en: string;
    "zh-TW": string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  invoiceType?: "one-time" | "period";
  periodStart?: string;
  periodEnd?: string;
  paymentMethod?: string;
  notes?: string;
  paymentProofUrl?: string;
  paymentReference?: string;
  paymentDate?: string;
  amount: number;
  items?: Array<{
    product: {
      _id: string;
      name: string;
      images: string[];
      price: number;
      description?: string;
      displayNames?: {
        en: string;
        "zh-TW": string;
      };
    };
    quantity: number;
    price: number;
  }>;
}

interface PDFDownloadLinkProps {
  blob: Blob | null;
  url: string | null;
  loading: boolean;
  error: Error | null;
}

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: "#bfbfbf",
    borderBottomWidth: 1,
    minHeight: 30,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontFamily: "Helvetica",
  },
  total: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#bfbfbf",
    paddingTop: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "grey",
    fontFamily: "Helvetica",
  },
  summaryRight: {
    marginLeft: "auto",
    marginTop: 10,
    textAlign: "right",
  },
});

// PDF Document Component
const InvoicePDF: React.FC<{ invoice: Invoice; language: string }> = ({
  invoice,
  language,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Invoice {invoice.invoiceNumber}</Text>
            <Text>Date: {format(new Date(invoice.createdAt), "PPP")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Customer Information
          </Text>
          <Text>Name: {invoice.user.name}</Text>
          <Text>Email: {invoice.user.email}</Text>
          {invoice.user.phone && <Text>Phone: {invoice.user.phone}</Text>}
        </View>

        {invoice.invoiceType === "period" &&
          invoice.periodStart &&
          invoice.periodEnd && (
            <View style={styles.section}>
              <Text>
                Period Start: {format(new Date(invoice.periodStart), "PPP")}
              </Text>
              <Text>
                Period End: {format(new Date(invoice.periodEnd), "PPP")}
              </Text>
            </View>
          )}

        <View style={styles.section}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
            Billing Address:
          </Text>
          <Text>
            {invoice.billingAddress
              ? invoice.billingAddress[language] || "Not Specified"
              : "Not Specified"}
          </Text>
          <Text style={{ fontWeight: "bold", marginTop: 10, marginBottom: 5 }}>
            Shipping Address:
          </Text>
          <Text>
            {invoice.shippingAddress
              ? invoice.shippingAddress[language] || "Not Specified"
              : "Not Specified"}
          </Text>
        </View>

        {/* Order Summary */}
        {invoice.orders.map((order: Order) => (
          <View key={order._id} style={styles.section}>
            <Text style={{ fontFamily: "Helvetica", marginBottom: 10 }}>
              #{order._id.slice(-12).toUpperCase()}
            </Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Item</Text>
                <Text style={styles.tableCell}>Quantity</Text>
                <Text style={styles.tableCell}>Price</Text>
                <Text style={styles.tableCell}>Total</Text>
              </View>
              {(order.cartProducts || []).map(
                (item: CartProduct, index: number) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.tableCell}>
                      {item.product.displayNames?.[language] ||
                        item.product.name}
                    </Text>
                    <Text style={styles.tableCell}>{item.quantity}</Text>
                    <Text style={styles.tableCell}>
                      ${item.product.price.toFixed(2)}
                    </Text>
                    <Text style={styles.tableCell}>
                      ${(item.quantity * item.product.price).toFixed(2)}
                    </Text>
                  </View>
                )
              )}
            </View>
            <View style={styles.summaryRight}>
              <Text>Subtotal: ${(order.subtotal || 0).toFixed(2)}</Text>
              <Text>Delivery: ${(order.deliveryCost || 0).toFixed(2)}</Text>
              <Text style={{ fontWeight: "bold" }}>
                Total: ${(order.total || 0).toFixed(2)}
              </Text>
              {(order.totalPremium ?? 0) > 0 && (
                <Text style={{ fontWeight: "bold", color: "#CA8A04" }}>
                  Total Premium: ${(order.totalPremium ?? 0).toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        ))}

        {/* Grand Total - Only for period invoices */}
        {invoice.invoiceType === "period" && (
          <View style={[styles.section, styles.total]}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              Grand Total: ${invoice.amount.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Payment Information
          </Text>
          <Text>
            Payment Method:{" "}
            {invoice.paymentMethod
              ? invoice.paymentMethod.replace("_", " ")
              : "Not Specified"}
          </Text>
          {invoice.paymentProofUrl && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold" }}>Payment Proof:</Text>
              <View style={{ marginTop: 5 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={invoice.paymentProofUrl}
                  alt="Payment Proof"
                  style={{ maxWidth: "100%", height: "auto", borderRadius: 5 }}
                />
              </View>
            </View>
          )}
          {invoice.notes && <Text>Notes: {invoice.notes}</Text>}
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Addresses
          </Text>
          <Text style={{ fontWeight: "bold" }}>Billing Address:</Text>
          <Text>
            {invoice.billingAddress
              ? invoice.billingAddress[language] || "Not Specified"
              : "Not Specified"}
          </Text>
          <Text style={{ fontWeight: "bold", marginTop: 10 }}>
            Shipping Address:
          </Text>
          <Text>
            {invoice.shippingAddress
              ? invoice.shippingAddress[language] || "Not Specified"
              : "Not Specified"}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Chinese Power Fresh Fruits Limited</Text>
          <Text>Fresh! Fresh! Fresh!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default function InvoiceDetailPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { userData, loading: userLoading } = useUser();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const { cloudName, uploadPreset } = useCloudinary();
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = useParams() as { invoiceNumber: string };
  const invoiceNumber = params.invoiceNumber;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/invoices");
    }
  }, [status, router]);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/${invoiceNumber}`);
      setInvoice(response.data.invoice);
    } catch (error: any) {
      console.error("Error fetching invoice:", {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      if (error.response?.data?.error) {
        toast.error(
          t(`invoice.errors.${error.response.data.error}`) ||
            error.response.data.error
        );
      } else {
        toast.error(t("invoice.error.fetch"));
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceNumber, t]);

  useEffect(() => {
    if (userData && !userLoading) {
      fetchInvoice();
    }
  }, [userData, userLoading, fetchInvoice]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatInvoiceAddress = (address: any) => {
    if (!address) {
      // Use user's address if no specific address is provided
      return invoice?.user?.address?.[language] || "N/A";
    }
    return address[language] || invoice?.user?.address?.[language] || "N/A";
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(
        "<html><head><title>Print Invoice</title></head><body>"
      );
      printWindow.document.write(
        document.querySelector("#printable-invoice")?.innerHTML || ""
      );
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (!invoice) return;
    return (
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} language={language} />}
        fileName={`invoice-${invoice.invoiceNumber}.pdf`}
      >
        {({ blob, url, loading, error }) =>
          loading ? "Loading document..." : "Download PDF"
        }
      </PDFDownloadLink>
    );
  };

  const handlePaymentProofUpload = (result: CldUploadWidgetResults) => {
    if (!result.info) {
      toast.error(t("invoices.uploadError"));
      return;
    }

    if (typeof result.info === "object" && "secure_url" in result.info) {
      const uploadedUrl = result.info.secure_url as string;
      setPaymentProofUrl(uploadedUrl);

      // Update invoice with payment proof
      if (invoice) {
        axios
          .patch(`/api/invoices/${invoice.invoiceNumber}`, {
            paymentProofUrl: uploadedUrl,
            paymentDate: new Date().toISOString(),
          })
          .then((response) => {
            if (response.data.success) {
              setInvoice(response.data.invoice);
              toast.success(t("invoices.paymentProofUploaded"));
            }
          })
          .catch((error) => {
            console.error("Error updating invoice with payment proof:", error);
            toast.error(t("invoices.uploadError"));
          });
      }
    } else {
      console.error("Invalid upload result:", result);
      toast.error(t("invoices.uploadError"));
    }
  };

  const handleSubmit = async () => {
    if (!invoice || isSubmitting) return;
    if (!paymentProofUrl) {
      toast.error(t("invoices.uploadProofFirst"));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.patch(
        `/api/invoices/${invoice.invoiceNumber}`,
        {
          paymentProofUrl,
          paymentDate: new Date().toISOString(),
        }
      );

      if (response.data.success) {
        setInvoice(response.data.invoice);
        toast.success(t("invoices.paymentProofUploaded"));
      }
    } catch (error) {
      console.error("Error updating invoice with payment proof:", error);
      toast.error(t("invoices.uploadError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || userLoading) {
    return <div>{t("common.loading")}</div>;
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t("invoices.notFound")}</div>
      </div>
    );
  }

  return (
    <>
      {/* Regular invoice view */}
      <div className={isPrinting ? "hidden" : ""}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/invoices")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("order-details.navigation.back")}
            </Button>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-bold mb-2">
                  {t("order-details.page.title", {
                    number: invoice?.invoiceNumber,
                  })}
                </h1>
                {invoice?.periodInvoiceNumber && (
                  <p className="text-lg text-gray-600">
                    {t("invoices.periodInvoice")}: {invoice.periodInvoiceNumber}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  {t("order-details.navigation.print")}
                </Button>
                {invoice && (
                  <PDFDownloadLink
                    document={
                      <InvoicePDF invoice={invoice} language={language} />
                    }
                    fileName={`invoice-${invoice.invoiceNumber}.pdf`}
                  >
                    {({ blob, url, loading, error }: PDFDownloadLinkProps) => (
                      <Button variant="outline" disabled={loading}>
                        <Download className="mr-2 h-4 w-4" />
                        {loading
                          ? t("common.loading")
                          : t("order-details.navigation.download")}
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Invoice Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Invoice Info */}
              <Card className="border-2 dark:border-white/20 border-gray-300">
                <CardHeader>
                  <CardTitle>
                    {t("order-details.sections.invoiceDetails")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 border-b-2 dark:border-white/20 border-gray-300 pb-3">
                      <span className="font-medium text-muted-foreground">
                        {t("order-details.customerInfo.title")}:
                      </span>
                      <div className="mt-2 space-y-1">
                        <p className="text-foreground">
                          <span className="text-muted-foreground">
                            {t("order-details.customerInfo.name")}:{" "}
                          </span>
                          {invoice.user.name}
                        </p>
                        <p className="text-foreground">
                          <span className="text-muted-foreground">
                            {t("order-details.customerInfo.email")}:{" "}
                          </span>
                          {invoice.user.email}
                        </p>
                        {invoice.user.phone && (
                          <p className="text-foreground">
                            <span className="text-muted-foreground">
                              {t("order-details.customerInfo.phone")}:{" "}
                            </span>
                            {invoice.user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                      <span className="font-medium text-muted-foreground">
                        {t("order-details.orderInfo.invoiceNumber")}:
                      </span>
                      <p className="text-foreground">{invoice.invoiceNumber}</p>
                    </div>
                    {invoice.orders &&
                      invoice.orders[0] &&
                      invoice.invoiceType !== "period" && (
                        <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                          <span className="font-medium text-muted-foreground">
                            {t("order-details.orderInfo.orderNumber")}:
                          </span>
                          <p className="text-foreground font-mono">
                            #{invoice.orders[0]._id.slice(-12).toUpperCase()}
                          </p>
                        </div>
                      )}
                    <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                      <span className="font-medium text-muted-foreground">
                        {t("order-details.orderInfo.status")}:
                      </span>
                      <Badge
                        className={`ml-2 ${getStatusColor(invoice.status)}`}
                      >
                        {t(`order-details.status.${invoice.status}`)}
                      </Badge>
                    </div>
                    <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                      <span className="font-medium text-muted-foreground">
                        {t("order-details.orderInfo.type")}:
                      </span>
                      <p className="text-foreground">
                        {t(`order-details.orderInfo.${invoice.invoiceType}`)}
                      </p>
                    </div>
                    <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                      <span className="font-medium text-muted-foreground">
                        {t("order-details.orderInfo.created")}:
                      </span>
                      <p className="text-foreground">
                        {format(new Date(invoice.createdAt), "PPP")}
                      </p>
                    </div>
                    {invoice.invoiceType === "period" &&
                      invoice.periodStart &&
                      invoice.periodEnd && (
                        <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                          <span className="font-medium text-muted-foreground">
                            {t("invoices.periodDates")}:
                          </span>
                          <div className="mt-2 space-y-1">
                            <p className="text-foreground">
                              <span className="text-muted-foreground">
                                {t("invoices.periodStart")}:{" "}
                              </span>
                              {format(new Date(invoice.periodStart), "PPP")}
                            </p>
                            <p className="text-foreground">
                              <span className="text-muted-foreground">
                                {t("invoices.periodEnd")}:{" "}
                              </span>
                              {format(new Date(invoice.periodEnd), "PPP")}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>

              {/* Orders Summary - For both one-time and period invoices */}
              <Card className="border-2 dark:border-white/20 border-gray-300">
                <CardHeader>
                  <CardTitle>
                    {t("order-details.sections.orderSummary")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoice.orders.map((order) => (
                      <div key={order._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xl font-mono text-yellow-600 dark:text-yellow-400 mt-1">
                              #{order._id.slice(-12).toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-4">
                          {order.cartProducts.map((item: CartProduct) => (
                            <div
                              key={`${item.product._id}-${item.quantity}`}
                              className="flex justify-between items-center"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 relative">
                                  <Image
                                    src={item.product.images[0]}
                                    alt={
                                      item.product.displayNames?.[language] ||
                                      item.product.name
                                    }
                                    fill
                                    className="object-cover rounded-md"
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-gray-200">
                                    {item.product.displayNames?.[language] ||
                                      item.product.name}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t("order-details.orderSummary.quantity")}:{" "}
                                    {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                $
                                {(item.product.price * item.quantity).toFixed(
                                  2
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                        {/* Order Summary */}
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>
                              {t("order-details.orderSummary.subtotal")}:
                            </span>
                            <span>${(order.subtotal || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>
                              {t("order-details.orderSummary.delivery")}:
                            </span>
                            <span>${(order.deliveryCost || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>
                              {t("order-details.orderSummary.total")}:
                            </span>
                            <span>${(order.total || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Only show grand totals for period invoices */}
                    {invoice.invoiceType === "period" && (
                      <div className="mt-6 pt-6 border-t-2 dark:border-white/20 border-gray-300">
                        <div className="space-y-2">
                          <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>{t("invoices.subtotal")}:</span>
                            <span>
                              $
                              {invoice.orders
                                .reduce(
                                  (sum, order) => sum + (order.subtotal || 0),
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>{t("invoices.totalDelivery")}:</span>
                            <span>
                              $
                              {invoice.orders
                                .reduce(
                                  (sum, order) =>
                                    sum + (order.deliveryCost || 0),
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>{t("checkout.total")}:</span>
                            <span>
                              $
                              {invoice.orders
                                .reduce(
                                  (sum, order) => sum + (order.total || 0),
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Info */}
              <Card className="border-2 dark:border-white/20 border-gray-300">
                <CardHeader>
                  <CardTitle>
                    {t("order-details.sections.paymentInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                    <span className="font-medium text-muted-foreground">
                      {t("order-details.payment.method")}:
                    </span>
                    <p className="text-foreground capitalize">
                      {invoice.paymentMethod
                        ? t(`order-details.payment.${invoice.paymentMethod}`)
                        : t("invoices.notSpecified")}
                    </p>
                  </div>
                  {invoice.paymentReference && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {t("invoices.paymentReference")}:
                      </span>
                      <span>{invoice.paymentReference}</span>
                    </div>
                  )}
                  {invoice.paymentDate && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {t("order-details.payment.date")}:
                      </span>
                      <span>
                        {format(new Date(invoice.paymentDate), "PPP")}
                      </span>
                    </div>
                  )}
                  {invoice.paymentProofUrl ? (
                    <div className="mt-4">
                      <span className="font-medium block mb-2">
                        {t("order-details.payment.proof")}:
                      </span>
                      <div className="relative w-full max-w-md mx-auto">
                        <Image
                          src={invoice.paymentProofUrl}
                          alt="Payment Proof"
                          width={800}
                          height={600}
                          className="w-full rounded-lg shadow-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    invoice.status === "pending" && (
                      <div className="mt-4">
                        <Label>{t("invoices.paymentProof")}</Label>
                        <div className="flex flex-col gap-4">
                          <CldUploadButton
                            uploadPreset={uploadPreset}
                            onSuccess={handlePaymentProofUpload}
                            options={{
                              cloudName,
                              maxFiles: 1,
                              sources: ["local", "url", "camera"],
                              clientAllowedFormats: [
                                "jpg",
                                "jpeg",
                                "png",
                                "webp",
                                "pdf",
                              ],
                              maxFileSize: 10 * 1024 * 1024,
                              multiple: false,
                              folder: "payment-proofs",
                            }}
                            className="bg-[#535C91] hover:bg-[#424874] text-white py-2 px-6 rounded-lg mb-2 text-center cursor-pointer"
                          >
                            {paymentProofUrl || invoice.paymentProofUrl
                              ? t("invoices.reuploadProof")
                              : t("invoices.uploadProof")}
                          </CldUploadButton>

                          {(paymentProofUrl || invoice.paymentProofUrl) && (
                            <div className="mt-2">
                              <Image
                                src={
                                  paymentProofUrl ||
                                  invoice.paymentProofUrl ||
                                  ""
                                }
                                alt={t("invoices.paymentProof")}
                                width={320}
                                height={160}
                                className="max-h-40 rounded shadow"
                                unoptimized
                              />
                              <div className="text-xs text-gray-500 mt-1 break-all">
                                {paymentProofUrl || invoice.paymentProofUrl}
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !paymentProofUrl}
                            className="w-full bg-[#535C91] hover:bg-[#424874] text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {t("invoices.submitting")}
                              </>
                            ) : (
                              t("invoices.submitPaymentProof")
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              {/* Addresses */}
              <Card className="border-2 dark:border-white/20 border-gray-300">
                <CardHeader>
                  <CardTitle>{t("order-details.sections.addresses")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                    <span className="font-medium text-muted-foreground">
                      {t("order-details.addresses.billing")}:
                    </span>
                    <p className="text-sm text-foreground mt-1">
                      {formatInvoiceAddress(invoice.billingAddress)}
                    </p>
                  </div>
                  <Separator className="my-4 dark:bg-white/20 bg-gray-300 h-0.5" />
                  <div className="border-b-2 dark:border-white/20 border-gray-300 pb-3">
                    <span className="font-medium text-muted-foreground">
                      {t("order-details.addresses.shipping")}:
                    </span>
                    <p className="text-sm text-foreground mt-1">
                      {formatInvoiceAddress(invoice.shippingAddress)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Printable version */}
      {isPrinting && (
        <div className="printable-invoice">
          <PrintableInvoice
            invoice={invoice}
            formatInvoiceAddress={formatInvoiceAddress}
          />
        </div>
      )}

      {/* Hidden printable version */}
      <div id="printable-invoice" style={{ display: "none" }}>
        <PrintableInvoice
          invoice={invoice}
          formatInvoiceAddress={formatInvoiceAddress}
        />
      </div>
    </>
  );
}
