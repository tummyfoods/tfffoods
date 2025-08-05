import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  FileText,
  Tag,
  Grid,
  Sliders,
  ShoppingCart,
  Newspaper,
  Truck,
  PackageCheck,
  Receipt,
  ImageIcon,
} from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";

export default function Sidebar() {
  const { t } = useTranslation();

  const adminLinks = [
    { href: "/admin", label: t("dashboard.title"), icon: LayoutDashboard },
    { href: "/admin/products", label: t("products.title"), icon: ShoppingBag },
    { href: "/admin/categories", label: t("categories.title"), icon: Grid },
    {
      href: "/admin/specifications",
      label: t("specifications.title"),
      icon: Sliders,
    },
    { href: "/admin/orders", label: t("order.title"), icon: ShoppingCart },
    { href: "/admin/invoices", label: t("invoice.title"), icon: Receipt },
    { href: "/admin/roles", label: t("users.title"), icon: Users },
    { href: "/admin/brands", label: t("brands.title"), icon: Tag },
    {
      href: "/admin/newsletter",
      label: t("newsletter.title"),
      icon: Newspaper,
    },
    { href: "/admin/logistics", label: t("logistics.title"), icon: Truck },
    { href: "/admin/blog", label: t("blog.title"), icon: FileText },
    {
      href: "/admin/guarantee-section",
      label: t("guarantee.title"),
      icon: PackageCheck,
    },
    {
      href: "/admin/settings",
      label: t("admin.settings.title"),
      icon: Settings,
    },
    {
      href: "/admin/settings/hero",
      label: t("admin-hero.title"),
      icon: ImageIcon,
    },
  ];

  // ... rest of the component code ...
}
