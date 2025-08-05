"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/providers/language/LanguageContext";
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
import type { BodyType, LocationType } from "@/types/logistics";

export default function CreateLogisticsForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
  const [status, setStatus] = useState("Available");

  // Driver Information
  const [driverName, setDriverName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");

  // Assignment Information
  const [assignedLocation, setAssignedLocation] =
    useState<LocationType>("Hong Kong");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/logistics", {
        method: "POST",
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
          assignedDate: new Date(),
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create vehicle");
      }

      toast.success(t("admin-logistics.actions.create"));
      router.push("/admin/logistics");
    } catch (error) {
      console.error("Error creating vehicle:", error);
      toast.error(t("admin-logistics.errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
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
              placeholder={t("admin-logistics.placeholders.registrationNumber")}
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
              placeholder={t("admin-logistics.placeholders.cylinderCapacity")}
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
                  placeholder={t("admin-logistics.placeholders.bodyType")}
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
              {t("admin-logistics.assignedLocation")}
            </label>
            <Select
              value={assignedLocation}
              onValueChange={(value: LocationType) =>
                setAssignedLocation(value)
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("admin-logistics.placeholders.location")}
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
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("admin-logistics.fields.status")}
            </label>
            <Select value={status} onValueChange={(value) => setStatus(value)}>
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

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/logistics")}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? t("admin-logistics.loading")
            : t("admin-logistics.addVehicle")}
        </Button>
      </div>
    </form>
  );
}
