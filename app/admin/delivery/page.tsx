"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslation } from "@/providers/language/LanguageContext";
import { translationLoader } from "@/utils/translationLoader";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, PackageCheck, Plus, Trash2 } from "lucide-react";
import { MultiLangInput } from "@/components/MultiLangInput";
import { Button } from "@/components/ui/button";

interface DeliveryMethod {
  cost: number;
  name: {
    en: string;
    "zh-TW": string;
  };
}

interface DeliverySettings {
  deliveryMethods: DeliveryMethod[];
  freeDeliveryThreshold: number;
  bankAccountDetails: string;
}

// Keep a reference to the data outside component to persist between language changes
let persistedSettings: DeliverySettings | null = null;

export default function DeliverySettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t, language } = useTranslation();

  const [settings, setSettings] = useState<DeliverySettings>(
    () =>
      persistedSettings || {
        deliveryMethods: [
          {
            cost: 0,
            name: {
              en: "Delivery Method 1",
              "zh-TW": "配送方式 1",
            },
          },
        ],
        freeDeliveryThreshold: 0,
        bankAccountDetails: "",
      }
  );
  const [isLoading, setIsLoading] = useState(!persistedSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [dataFetched, setDataFetched] = useState(!!persistedSettings);

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("admin-deliverySettings.title"),
      href: "/admin/delivery",
      icon: PackageCheck,
    },
  ];

  // Force reload translations when component mounts
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        await Promise.all([
          translationLoader.loadTranslationModule(
            language,
            "admin-deliverySettings"
          ),
          translationLoader.loadTranslationModule(language, "common"),
          translationLoader.loadTranslationModule(language, "navigation"),
        ]);
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
    };
    loadTranslations();
  }, [language]);

  useEffect(() => {
    if (!session?.user?.admin) {
      router.push("/admin");
      return;
    }

    // Only fetch if we don't have persisted data
    if (!dataFetched) {
      const fetchSettings = async () => {
        try {
          const response = await fetch("/api/delivery");
          const data = await response.json();

          // Convert old format to new format if necessary
          const deliveryMethods =
            data.deliveryMethods ||
            Object.entries(data.deliveryTypes || {}).map(
              ([key, value]: [string, any], index) => ({
                cost: value.cost || 0,
                name: value.name || {
                  en: `Delivery Method ${index + 1}`,
                  "zh-TW": `配送方式 ${index + 1}`,
                },
              })
            );

          const newSettings = {
            deliveryMethods:
              deliveryMethods.length > 0
                ? deliveryMethods
                : [
                    {
                      cost: 0,
                      name: {
                        en: "Delivery Method 1",
                        "zh-TW": "配送方式 1",
                      },
                    },
                  ],
            freeDeliveryThreshold: data.freeDeliveryThreshold || 0,
            bankAccountDetails:
              data.bankAccountDetails ||
              t("admin-deliverySettings.bankAccount.placeholder"),
          };

          setSettings(newSettings);
          persistedSettings = newSettings;
          setDataFetched(true);
        } catch (error) {
          console.error("Failed to fetch delivery settings:", error);
          toast.error(t("admin-deliverySettings.messages.error"));
        } finally {
          setIsLoading(false);
        }
      };

      fetchSettings();
    }
  }, [session, router, t, dataFetched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Update persisted settings after successful save
      persistedSettings = settings;
      toast.success(t("admin-deliverySettings.messages.success"));
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(t("admin-deliverySettings.messages.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const addDeliveryMethod = () => {
    const newMethodNumber = settings.deliveryMethods.length + 1;
    const newSettings = {
      ...settings,
      deliveryMethods: [
        ...settings.deliveryMethods,
        {
          cost: 0,
          name: {
            en: `Delivery Method ${newMethodNumber}`,
            "zh-TW": `配送方式 ${newMethodNumber}`,
          },
        },
      ],
    };
    setSettings(newSettings);
    persistedSettings = newSettings;
  };

  const removeDeliveryMethod = (index: number) => {
    if (settings.deliveryMethods.length <= 1) {
      toast.error(t("admin-deliverySettings.messages.minimumRequired"));
      return;
    }

    const newMethods = settings.deliveryMethods.filter((_, i) => i !== index);
    // Rename remaining methods to maintain sequential numbering
    const renamedMethods = newMethods.map((method, i) => ({
      ...method,
      name: {
        en: method.name?.en?.includes("Delivery Method")
          ? `Delivery Method ${i + 1}`
          : method.name?.en || `Delivery Method ${i + 1}`,
        "zh-TW": method.name?.["zh-TW"]?.includes("配送方式")
          ? `配送方式 ${i + 1}`
          : method.name?.["zh-TW"] || `配送方式 ${i + 1}`,
      },
    }));

    const newSettings = {
      ...settings,
      deliveryMethods: renamedMethods,
    };
    setSettings(newSettings);
    persistedSettings = newSettings;
  };

  // Update persisted settings whenever settings change
  useEffect(() => {
    persistedSettings = settings;
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#535C91]"></div>
      </div>
    );
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
                {t("admin-deliverySettings.title")}
              </h1>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">
                  {t("admin-deliverySettings.deliveryTypes.title")}
                </h2>
                <Button
                  type="button"
                  onClick={addDeliveryMethod}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t("admin-deliverySettings.actions.addMethod")}
                </Button>
              </div>
              {settings.deliveryMethods.map((method, index) => (
                <div
                  key={index}
                  className="space-y-2 p-4 border rounded-lg relative"
                >
                  <div className="absolute top-2 right-2">
                    <Button
                      type="button"
                      onClick={() => removeDeliveryMethod(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-base font-medium">
                    {t("admin-deliverySettings.deliveryTypes.method", {
                      number: index + 1,
                    })}
                  </h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-deliverySettings.deliveryTypes.name")}
                    </label>
                    <MultiLangInput
                      value={method.name}
                      onChange={(newValue) => {
                        const newMethods = [...settings.deliveryMethods];
                        newMethods[index] = {
                          ...method,
                          name: newValue,
                        };
                        setSettings({
                          ...settings,
                          deliveryMethods: newMethods,
                        });
                      }}
                      placeholder={{
                        en: `Enter delivery method name in English`,
                        "zh-TW": `輸入配送方式名稱`,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin-deliverySettings.deliveryTypes.cost")}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      min="0"
                      value={method.cost}
                      onFocus={(e) => {
                        e.target.select();
                      }}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
                          const newMethods = [...settings.deliveryMethods];
                          newMethods[index] = {
                            ...method,
                            cost: parseFloat(newValue) || 0,
                          };
                          setSettings({
                            ...settings,
                            deliveryMethods: newMethods,
                          });
                        }
                      }}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2">
                {t("admin-deliverySettings.freeDelivery.title")}
              </h2>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin-deliverySettings.freeDelivery.label")}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  min="0"
                  value={settings.freeDeliveryThreshold}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setSettings({
                        ...settings,
                        freeDeliveryThreshold: parseFloat(value) || 0,
                      });
                    }
                  }}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-2">
                {t("admin-deliverySettings.bankAccount.title")}
              </h2>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("admin-deliverySettings.bankAccount.label")}
                </label>
                <textarea
                  value={settings.bankAccountDetails}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankAccountDetails: e.target.value,
                    })
                  }
                  placeholder={t(
                    "admin-deliverySettings.bankAccount.placeholder"
                  )}
                  className="w-full p-2 border rounded text-sm h-32"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#535C91] hover:bg-[#424874] text-white py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50"
            >
              {isSaving
                ? t("admin-deliverySettings.actions.saving")
                : t("admin-deliverySettings.actions.save")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
