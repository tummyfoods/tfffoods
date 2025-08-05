"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  variant?: "icon" | "full";
  className?: string;
}

export function WishlistButton({
  productId,
  variant = "icon",
  className,
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const { isInWishlist, toggleWishlist, loading } = useWishlist();
  const isActive = isInWishlist(productId);

  const handleToggle = async () => {
    if (!session) {
      toast.error("Please log in to manage your wishlist");
      return;
    }
    await toggleWishlist(productId);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          "p-2 rounded-full transition-colors duration-200",
          isActive
            ? "bg-red-100 text-red-500 hover:bg-red-200"
            : "bg-gray-100 text-gray-500 hover:bg-gray-200",
          loading && "opacity-50 cursor-not-allowed",
          className
        )}
        aria-label={isActive ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={cn(
            "w-5 h-5 transition-transform duration-200",
            isActive && "fill-current scale-110"
          )}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "w-full flex items-center justify-center px-6 py-3 border rounded-md shadow-sm text-base font-medium transition-colors duration-200",
        isActive
          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100",
        loading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Heart
        className={cn("w-5 h-5 mr-2", isActive && "fill-current text-red-600")}
      />
      {isActive ? "Remove from Wishlist" : "Add to Wishlist"}
    </button>
  );
}
