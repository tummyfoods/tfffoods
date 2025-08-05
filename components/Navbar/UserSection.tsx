import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FaUserPen } from "react-icons/fa6";
import { FileText } from "lucide-react";
import Image from "next/image";
import useCartStore from "@/store/cartStore";

interface UserSectionProps {
  session: Session | null;
}

const UserSection = ({ session }: UserSectionProps) => {
  const { t } = useTranslation();
  const clearCart = useCartStore((state) => state.clearCart);

  console.log("DEBUG SESSION:", session);

  const handleSignOut = async () => {
    try {
      // 1. Set logout flag FIRST before any async operations
      sessionStorage.setItem("justLoggedOut", "true");

      // 2. Clear cart as it might depend on the session
      await clearCart();

      // 3. Clear all client-side storage (except justLoggedOut flag)
      const justLoggedOut = sessionStorage.getItem("justLoggedOut");
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem("justLoggedOut", justLoggedOut || "true");

      // 4. Call our server logout endpoint to clear cookies
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0"
        }
      });

      if (!response.ok) {
        throw new Error("Server logout failed");
      }

      // 5. Call NextAuth signOut with immediate redirect
      await signOut({
        callbackUrl: "/login",
        redirect: true
      });

      // 6. Force redirect if signOut's redirect fails
      setTimeout(() => {
        window.location.replace("/login");
      }, 100);

    } catch (error) {
      console.error("Logout failed:", error);
      // On error, force clear everything (except justLoggedOut) and redirect
      const justLoggedOut = sessionStorage.getItem("justLoggedOut");
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem("justLoggedOut", justLoggedOut || "true");
      window.location.replace("/login");
    }
  };

  return (
    <div className="flex items-center gap-4">
      {session?.user ? (
        <>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {session.user.profileImage || session.user.image ? (
                <Image
                  src={session.user.profileImage || session.user.image || ""}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <AvatarFallback>
                  {session.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <Link href="/profile" className="navbar-button">
              <span className="navbar-button-text">
                {t("navigation.profile")}
              </span>
              <FaUserPen className="navbar-button-icon" />
            </Link>
            <Link href="/invoices" className="navbar-button">
              <span className="navbar-button-text">
                {t("navigation.invoices", "Invoices")}
              </span>
              <FileText className="navbar-button-icon" />
            </Link>
          </div>
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="w-24"
          >
            {t("navigation.logout")}
          </Button>
        </>
      ) : (
        <Button asChild className="w-24">
          <Link href="/login">{t("navigation.login")}</Link>
        </Button>
      )}
    </div>
  );
};

export default UserSection;
