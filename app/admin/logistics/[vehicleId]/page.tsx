"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type {
  LogisticsVehicle,
  VehicleStatus,
  MaintenanceRecord,
} from "@/types/logistics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { useTranslation } from "@/providers/language/LanguageContext";
import { use } from "react";

interface Props {
  params: Promise<{
    vehicleId: string;
  }>;
}

export default function VehicleDetailsPage({ params }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [vehicle, setVehicle] = useState<LogisticsVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempStatus, setTempStatus] = useState<VehicleStatus | "">("");
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    orderId: string;
    status: string;
  } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState<{
    date: string;
    description: string;
    cost: string;
    nextMaintenanceDate: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    cost: "",
    nextMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });
  const resolvedParams = use(params);

  const breadcrumbItems = [
    {
      label: t("navigation.admin"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.logistics"),
      href: "/admin/logistics",
      icon: Truck,
    },
    {
      label: t("admin-logistics.vehicleDetails"),
      href: `/admin/logistics/${resolvedParams.vehicleId}`,
      icon: Truck,
    },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await fetch(
          `/api/logistics/${resolvedParams.vehicleId}`,
          {
            cache: "no-store",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch vehicle");
        const data = await response.json();
        setVehicle(data);
      } catch (error) {
        console.error("Error fetching vehicle:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [resolvedParams.vehicleId]);

  // Show loading for initial load or when checking auth
  if (
    status === "loading" ||
    (status === "authenticated" && !session?.user?.admin)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center app-background transition-colors duration-200">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">
            {t("admin-logistics.loadingAuth")}
          </span>
        </div>
      </div>
    );
  }

  // Return null if not authenticated or not admin (will redirect in useEffect)
  if (status === "authenticated" && !session?.user?.admin) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "In Transit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "Delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "Failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setSelectedStatus({ orderId, status: newStatus });
    setConfirmDialogOpen(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!selectedStatus) return;

    try {
      const response = await fetch("/api/logistics/assign", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId: resolvedParams.vehicleId,
          orderId: selectedStatus.orderId,
          status: selectedStatus.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const updatedVehicle = await response.json();
      setVehicle(updatedVehicle);
      toast.success("Delivery status updated successfully");
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update delivery status");
    }
  };

  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <div className="bg-card rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
                  {t("admin-logistics.vehicleDetails")}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("admin-logistics.viewInfo")}
                </p>
              </div>
              <Button
                onClick={() =>
                  router.push(
                    `/admin/logistics/${resolvedParams.vehicleId}/edit`
                  )
                }
                className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
              >
                {t("admin-logistics.updateButton")}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91]"></div>
              <span>{t("admin-logistics.loadingVehicle")}</span>
            </div>
          </div>
        ) : vehicle ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin-logistics.vehicleInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("admin-logistics.fields.registrationNumber")}
                  </p>
                  <p className="font-medium">{vehicle.registrationNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("admin-logistics.fields.owner")}
                  </p>
                  <p className="font-medium">{vehicle.owner}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("admin-logistics.fields.make")} &{" "}
                    {t("admin-logistics.fields.model")}
                  </p>
                  <p className="font-medium">
                    {vehicle.make} {vehicle.model} ({vehicle.makeYear})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("admin-logistics.fields.status")}
                  </p>
                  <Badge className={getStatusColor(vehicle.status)}>
                    {t(
                      `admin-logistics.statusTypes.${vehicle.status
                        .toLowerCase()
                        .replace(" ", "")}`
                    )}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("admin-logistics.fields.assignedLocation")}
                  </p>
                  <p className="font-medium">
                    {t(`admin-logistics.locations.newTerritories`)}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t("admin-logistics.updateStatus")}
                  </p>
                  <div className="flex items-center gap-4">
                    <Select
                      value={tempStatus || vehicle.status}
                      onValueChange={(value) =>
                        setTempStatus(value as VehicleStatus | "")
                      }
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={t("search.placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">
                          {t("admin-logistics.statusTypes.available")}
                        </SelectItem>
                        <SelectItem value="On Delivery">
                          {t("admin-logistics.statusTypes.onDelivery")}
                        </SelectItem>
                        <SelectItem value="Maintenance">
                          {t("admin-logistics.statusTypes.maintenance")}
                        </SelectItem>
                        <SelectItem value="Out of Service">
                          {t("admin-logistics.statusTypes.outOfService")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={async () => {
                        if (!tempStatus || tempStatus === vehicle.status)
                          return;
                        setUpdating(true);
                        try {
                          const response = await fetch(
                            `/api/logistics/${resolvedParams.vehicleId}`,
                            {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ status: tempStatus }),
                            }
                          );

                          if (!response.ok)
                            throw new Error("Failed to update status");
                          const updatedVehicle = await response.json();
                          setVehicle(updatedVehicle);
                          setTempStatus("");
                          toast.success(t("logistics.admin.actions.edit"));
                        } catch (error) {
                          console.error("Error updating status:", error);
                          toast.error(t("logistics.admin.error"));
                        } finally {
                          setUpdating(false);
                        }
                      }}
                      disabled={
                        !tempStatus || tempStatus === vehicle.status || updating
                      }
                      className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                    >
                      {updating ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                          <span>{t("common.saving")}</span>
                        </div>
                      ) : (
                        t("admin-logistics.updateStatus")
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin-logistics.driverInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("admin-logistics.fields.driverName")}
                  </p>
                  <p className="font-medium">{vehicle.driver.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("admin-logistics.fields.contactNo")}
                  </p>
                  <p className="font-medium">{vehicle.driver.contactNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("admin-logistics.fields.licenseNo")}
                  </p>
                  <p className="font-medium">{vehicle.driver.licenseNo}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {t("admin-logistics.maintenanceRecords.title")}
                </CardTitle>
                <Button
                  onClick={() => setMaintenanceDialogOpen(true)}
                  className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                >
                  {t("common.create")}
                </Button>
              </CardHeader>
              <CardContent>
                {vehicle.maintenanceRecords &&
                vehicle.maintenanceRecords.length > 0 ? (
                  <div className="space-y-4">
                    {vehicle.maintenanceRecords.map((record, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {new Date(record.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {record.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {t("common.price")}: ${record.cost}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("admin-logistics.nextMaintenance")}:{" "}
                              {new Date(
                                record.nextMaintenanceDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {t("admin-logistics.maintenanceRecords.none")}
                  </p>
                )}
              </CardContent>
            </Card>

            {vehicle.assignedOrders && vehicle.assignedOrders.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {t("admin-logistics.assignedOrders.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vehicle.assignedOrders.map((order) => (
                      <div
                        key={order.orderId.toString()}
                        className="bg-card/50 rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {t("admin-orders.details.orderNumber", {
                                id: order.orderId.toString().slice(-6),
                              })}
                            </p>
                            {order.scheduledDeliveryDate && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t("admin-logistics.deliveryDate")}:{" "}
                                {format(
                                  new Date(order.scheduledDeliveryDate),
                                  "PPP"
                                )}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) =>
                                handleStatusChange(
                                  order.orderId.toString(),
                                  newStatus
                                )
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue
                                  placeholder={t(
                                    "admin-logistics.updateStatus"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">
                                  {t("admin-logistics.statusTypes.pending")}
                                </SelectItem>
                                <SelectItem value="In Transit">
                                  {t("admin-logistics.statusTypes.inTransit")}
                                </SelectItem>
                                <SelectItem value="Delivered">
                                  {t("admin-logistics.statusTypes.delivered")}
                                </SelectItem>
                                <SelectItem value="Failed">
                                  {t("admin-logistics.statusTypes.failed")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge className={getStatusColor(order.status)}>
                              {t(
                                `admin-logistics.statusTypes.${order.status
                                  .toLowerCase()
                                  .replace(" ", "")}`
                              )}
                            </Badge>
                          </div>
                        </div>
                        {order.deliveryNotes && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {t("admin-logistics.notes")}: {order.deliveryNotes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              {t("admin-logistics.vehicleNotFound")}
            </p>
            <Button
              onClick={() => router.push("/admin/logistics")}
              className="mt-4"
            >
              {t("common.back")}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("admin-logistics.confirmStatusUpdate")}
            </DialogTitle>
            <DialogDescription>
              {t("admin-logistics.confirmStatusUpdateDesc")}{" "}
              <span className="font-semibold">{selectedStatus?.status}</span>?
              {selectedStatus?.status === "Delivered" && (
                <p className="mt-2 text-yellow-600 dark:text-yellow-400">
                  {t("admin-logistics.deliveredNote")}
                </p>
              )}
              {selectedStatus?.status === "Failed" && (
                <p className="mt-2 text-red-600 dark:text-red-400">
                  {t("admin-logistics.failedNote")}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleConfirmStatusUpdate}
              variant={
                selectedStatus?.status === "Failed" ? "destructive" : "default"
              }
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("admin-logistics.maintenanceRecords.create.title")}
            </DialogTitle>
            <DialogDescription>
              {t("admin-logistics.maintenanceRecords.create.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                {t("admin-logistics.maintenanceRecords.create.date")}
              </Label>
              <Input
                id="date"
                type="date"
                value={maintenanceForm.date}
                onChange={(e) =>
                  setMaintenanceForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                {t("admin-logistics.maintenanceRecords.create.description")}
              </Label>
              <Textarea
                id="description"
                value={maintenanceForm.description}
                onChange={(e) =>
                  setMaintenanceForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">
                {t("admin-logistics.maintenanceRecords.create.cost")}
              </Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={maintenanceForm.cost}
                onChange={(e) =>
                  setMaintenanceForm((prev) => ({
                    ...prev,
                    cost: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextMaintenanceDate">
                {t("admin-logistics.maintenanceRecords.create.nextDate")}
              </Label>
              <Input
                id="nextMaintenanceDate"
                type="date"
                value={maintenanceForm.nextMaintenanceDate}
                onChange={(e) =>
                  setMaintenanceForm((prev) => ({
                    ...prev,
                    nextMaintenanceDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMaintenanceDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch(
                    `/api/logistics/${resolvedParams.vehicleId}/maintenance`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(maintenanceForm),
                    }
                  );

                  if (!response.ok)
                    throw new Error("Failed to create maintenance record");

                  const updatedVehicle = await response.json();
                  setVehicle(updatedVehicle);
                  setMaintenanceDialogOpen(false);
                  toast.success(
                    t("admin-logistics.maintenanceRecords.create.success")
                  );

                  // Reset form
                  setMaintenanceForm({
                    date: new Date().toISOString().split("T")[0],
                    description: "",
                    cost: "",
                    nextMaintenanceDate: new Date(
                      Date.now() + 90 * 24 * 60 * 60 * 1000
                    )
                      .toISOString()
                      .split("T")[0],
                  });
                } catch (error) {
                  console.error("Error creating maintenance record:", error);
                  toast.error(
                    t("admin-logistics.maintenanceRecords.create.error")
                  );
                }
              }}
            >
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
