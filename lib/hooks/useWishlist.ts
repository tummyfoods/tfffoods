import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

interface MultiLangString {
  en: string;
  "zh-TW": string;
}

interface WishlistItem {
  _id: string;
  name: string;
  displayNames: MultiLangString;
  images: string[];
  price: number;
}

export function useWishlist() {
  const { data: session } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchWishlist();
    } else {
      setWishlist([]);
      setLoading(false);
    }
  }, [session]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/wishlist");
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch wishlist");
      }
      setWishlist(response.data.wishlist);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch wishlist");
      toast.error("Failed to fetch wishlist");
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!session) {
      toast.error("Please log in to manage your wishlist");
      return;
    }

    try {
      const response = await axios.post("/api/wishlist", { productId });
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update wishlist");
      }

      // Update local state based on server response
      setWishlist(response.data.wishlist);

      // Show success message
      toast.success(
        response.data.action === "removed"
          ? "Removed from wishlist"
          : "Added to wishlist"
      );
    } catch (err) {
      console.error("Error updating wishlist:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update wishlist"
      );
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item._id === productId);
  };

  return {
    wishlist,
    loading,
    error,
    toggleWishlist,
    isInWishlist,
    refreshWishlist: fetchWishlist,
  };
}
