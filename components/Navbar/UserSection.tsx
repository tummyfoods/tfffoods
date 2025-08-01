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
      // First clear the cart and wait for it to complete
      await clearCart();

      // Then sign out with redirect
      await signOut({
        redirect: true,
        callbackUrl: "/",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      // If error occurs, force a hard redirect to ensure logout
      window.location.href = "/";
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
