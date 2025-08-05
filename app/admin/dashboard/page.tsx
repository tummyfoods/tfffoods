"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Package,
  Users,
  Settings,
  Newspaper,
  Truck,
  Image as ImageIcon,
  Grid,
  Mail,
  Shield,
  Sliders,
  ClipboardList,
  Tag,
  Receipt,
  Palette,
} from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
    }
  }, [status, session, router]);

  // Match exactly with sidebar items
  const adminLinks = [
    {
      title: t("admin.products.title"),
      href: "/admin/products",
      icon: Package,
      description: t("admin.products.description"),
    },
    {
      title: t("admin.categories.title"),
      href: "/admin/categories",
      icon: Grid,
      description: t("admin.categories.description"),
    },
    {
      title: t("admin.specifications.title"),
      href: "/admin/specifications",
      icon: Sliders,
      description: t("admin.specifications.description"),
    },
    {
      title: t("admin-orders.title"),
      href: "/admin/orders",
      icon: ClipboardList,
      description: t("admin-orders.description"),
    },
    {
      title: t("invoice.title"),
      href: "/admin/invoices",
      icon: Receipt,
      description: t("invoice.description"),
    },
    {
      title: t("admin.users.title"),
      href: "/admin/roles",
      icon: Users,
      description: t("admin.users.description"),
    },
    {
      title: t("admin.brands.title"),
      href: "/admin/brands",
      icon: Tag,
      description: t("admin.brands.description"),
    },
    {
      title: t("admin.newsletter.title"),
      href: "/admin/newsletter",
      icon: Mail,
      description: t("admin.newsletter.description"),
    },
    {
      title: t("admin.logistics.title"),
      href: "/admin/logistics",
      icon: Truck,
      description: t("admin.logistics.description"),
    },
    {
      title: t("admin.blog.title"),
      href: "/admin/blog/posts",
      icon: FileText,
      description: t("admin.blog.description"),
    },
    {
      title: t("admin.guarantee.title"),
      href: "/admin/GuaranteeSection",
      icon: Shield,
      description: t("admin.guarantee.description"),
    },
    {
      title: t("admin.features.title"),
      href: "/admin/featuresSection",
      icon: Shield,
      description: t("admin.features.description"),
    },
    {
      title: t("admin.settings.title"),
      href: "/admin/settings",
      icon: Settings,
      description: t("admin-settings.sections.store.description"),
    },
    {
      title: t("admin-settings.sections.theme.title"),
      href: "/admin/settings/theme",
      icon: Palette,
      description: t("admin-settings.sections.theme.description"),
    },
    {
      title: t("admin-hero.title"),
      href: "/admin/settings/hero",
      icon: ImageIcon,
      description: t("admin-hero.description"),
    },
    {
      title: t("admin-deliverySettings.title"),
      href: "/admin/delivery",
      icon: Truck,
      description: t("admin-deliverySettings.description"),
    },
    {
      title: t("admin.privacy.title"),
      href: "/admin/privacy-policy",
      icon: FileText,
      description: t("admin-privacy.description"),
    },
    {
      title: t("admin.periodUsers.title"),
      href: "/admin/period-users",
      icon: Users,
      description: t("admin.periodUsers.description"),
    },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center app-background">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="app-global-container py-8">
        <div className="mb-6">
          <Breadcrumb
            items={[
              {
                label: t("admin.dashboard.title"),
                href: "/admin/dashboard",
                icon: LayoutDashboard,
                current: true,
              },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminLinks.map((link) => (
            <Card key={link.href} className="hover:shadow-lg transition-shadow">
              <Link href={link.href}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold flex items-center gap-3">
                    <link.icon className="w-5 h-5" />
                    {link.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
