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
      console.log("LOGOUT DEBUG ==================");
      console.log("Starting logout process");

      // 1. Set logout flag FIRST before any async operations
      sessionStorage.setItem("justLoggedOut", "true");
      console.log("Set justLoggedOut flag:", sessionStorage.getItem("justLoggedOut"));

      // 2. Clear cart as it might depend on the session
      await clearCart();
      console.log("Cart cleared");

      // 3. Call server logout endpoint to clear cookies
      console.log("Calling server logout endpoint...");
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
      console.log("Server logout successful");

      // 4. Call NextAuth signOut
      console.log("Calling NextAuth signOut...");
      await signOut({
        callbackUrl: "/login",
        redirect: true
      });

      // 5. If we get here (signOut didn't redirect), force redirect
      window.location.replace("/login");

    } catch (error) {
      console.error("LOGOUT ERROR ==================");
      console.error("Logout failed:", error);
      
      // Even on error, try to sign out and redirect
      try {
        await signOut({
          callbackUrl: "/login",
          redirect: true
        });
      } catch {
        window.location.replace("/login");
      }
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
