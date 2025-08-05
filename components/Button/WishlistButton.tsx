"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
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
