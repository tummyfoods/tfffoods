"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Truck } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import type { BodyType, LocationType, VehicleStatus } from "@/types/logistics";
import { useTranslation } from "@/providers/language/LanguageContext";
import { use } from "react";

interface Props {
  params: Promise<{
    vehicleId: string;
  }>;
}

export default function EditVehiclePage({ params }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const resolvedParams = use(params);

  // Vehicle Information
  const [registrationNo, setRegistrationNo] = useState("");
  const [owner, setOwner] = useState("");
  const [makeYear, setMakeYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [weight, setWeight] = useState("");
  const [cylinderCapacity, setCylinderCapacity] = useState("");
  const [bodyType, setBodyType] = useState<BodyType>("Van");
  const [vehicleStatus, setVehicleStatus] = useState("Available");

  // Driver Information
  const [driverName, setDriverName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");

  // Assignment Information
  const [assignedLocation, setAssignedLocation] =
    useState<LocationType>("Hong Kong");

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
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
    {
      label: t("admin-logistics.editVehicle"),
      href: `/admin/logistics/${resolvedParams.vehicleId}/edit`,
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
          `/api/logistics/${resolvedParams.vehicleId}`
        );
        if (!response.ok) throw new Error("Failed to fetch vehicle");
        const data = await response.json();

        // Vehicle Information
        setRegistrationNo(data.registrationNo);
        setOwner(data.owner);
        setMakeYear(data.makeYear.toString());
        setMake(data.make);
        setModel(data.model);
        setChassisNo(data.chassisNo);
        setWeight(data.weight.toString());
        setCylinderCapacity(data.cylinderCapacity.toString());
        setBodyType(data.bodyType);
        setVehicleStatus(data.status);

        // Driver Information
        setDriverName(data.driver.name);
        setLicenseNo(data.driver.licenseNo);
        setContactNo(data.driver.contactNo);
        setEmail(data.driver.email);

        // Assignment Information
        setAssignedLocation(data.assignedLocation);
      } catch (error) {
        console.error("Error fetching vehicle:", error);
        toast.error(t("admin-logistics.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [resolvedParams.vehicleId, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        `/api/logistics/${resolvedParams.vehicleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registrationNo,
            owner,
            makeYear: parseInt(makeYear),
            make,
            model,
            chassisNo,
            weight: parseFloat(weight),
            cylinderCapacity: parseInt(cylinderCapacity),
            bodyType,
            driver: {
              name: driverName,
              licenseNo,
              contactNo,
              ...(email && { email }),
            },
            assignedLocation,
            status: vehicleStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update vehicle");
      }

      toast.success(t("admin-logistics.actions.edit"));
      router.push(`/admin/logistics/${resolvedParams.vehicleId}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast.error(t("admin-logistics.errors.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  // Show loading for initial load or when checking auth
  if (
    status === "loading" ||
    (status === "authenticated" && !session?.user?.admin)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center app-background transition-colors duration-200">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("admin-logistics.loading")}</span>
        </div>
      </div>
    );
  }

  // Return null if not authenticated or not admin (will redirect in useEffect)
  if (status === "authenticated" && !session?.user?.admin) {
    return null;
  }

  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <div className="bg-card rounded-lg shadow-sm p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
              {t("admin-logistics.editVehicle")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("admin-logistics.createPage.description")}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91]"></div>
              <span>{t("admin-logistics.loadingVehicle")}</span>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Vehicle Information Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t("admin-logistics.vehicleDetails")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.registrationNumber")}
                    </label>
                    <Input
                      required
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      placeholder={t(
                        "admin-logistics.placeholders.registrationNumber"
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.owner")}
                    </label>
                    <Input
                      required
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.owner")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.makeYear")}
                    </label>
                    <Input
                      required
                      type="number"
                      value={makeYear}
                      onChange={(e) => setMakeYear(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.makeYear")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.make")}
                    </label>
                    <Input
                      required
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.make")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.model")}
                    </label>
                    <Input
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.model")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.chassisNo")}
                    </label>
                    <Input
                      required
                      value={chassisNo}
                      onChange={(e) => setChassisNo(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.chassisNo")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.weight")}
                    </label>
                    <Input
                      required
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.weight")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.cylinderCapacity")}
                    </label>
                    <Input
                      required
                      type="number"
                      value={cylinderCapacity}
                      onChange={(e) => setCylinderCapacity(e.target.value)}
                      placeholder={t(
                        "admin-logistics.placeholders.cylinderCapacity"
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.bodyType")}
                    </label>
                    <Select
                      value={bodyType}
                      onValueChange={(value: BodyType) => setBodyType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "admin-logistics.placeholders.bodyType"
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Van">
                          {t("admin-logistics.bodyTypes.van")}
                        </SelectItem>
                        <SelectItem value="Truck">
                          {t("admin-logistics.bodyTypes.truck")}
                        </SelectItem>
                        <SelectItem value="Lorry">
                          {t("admin-logistics.bodyTypes.lorry")}
                        </SelectItem>
                        <SelectItem value="Motorcycle">
                          {t("admin-logistics.bodyTypes.motorcycle")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.status")}
                    </label>
                    <Select
                      value={vehicleStatus}
                      onValueChange={(value: VehicleStatus) =>
                        setVehicleStatus(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("admin-logistics.placeholders.status")}
                        />
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
                  </div>
                </div>
              </div>

              {/* Driver Information Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t("admin-logistics.driverInfo")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.driverName")}
                    </label>
                    <Input
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.driverName")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.licenseNo")}
                    </label>
                    <Input
                      required
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.licenseNo")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.contactNo")}
                    </label>
                    <Input
                      required
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.contactNo")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.email")}
                      <span className="text-sm text-gray-500 ml-1">
                        ({t("common.optional")})
                      </span>
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("admin-logistics.placeholders.email")}
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Information Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t("admin-logistics.assignmentInfo")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-logistics.fields.assignedLocation")}
                    </label>
                    <Select
                      value={assignedLocation}
                      onValueChange={(value: LocationType) =>
                        setAssignedLocation(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "admin-logistics.placeholders.location"
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hong Kong">
                          {t("admin-logistics.locations.hongKong")}
                        </SelectItem>
                        <SelectItem value="Kowloon">
                          {t("admin-logistics.locations.kowloon")}
                        </SelectItem>
                        <SelectItem value="New Territories">
                          {t("admin-logistics.locations.newTerritories")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(`/admin/logistics/${resolvedParams.vehicleId}`)
                  }
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? t("common.saving") : t("common.saveChanges")}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
