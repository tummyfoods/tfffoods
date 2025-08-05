"use client";

import React from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import useCartStore from "@/store/cartStore";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function Wishlist() {
  const { t, language } = useTranslation();
  const { wishlist, loading, error, toggleWishlist } = useWishlist();
  const addToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = (item: any) => {
    addToCart({
      _id: item._id,
      name: item.name,
      displayNames: item.displayNames,
      price: item.price,
      images: item.images,
      quantity: 1,
    });
    toast.success(t("cart.addedToCart"));
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    await toggleWishlist(productId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            {t("wishlist.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            {t("wishlist.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          {t("wishlist.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {!wishlist || wishlist.length === 0 ? (
          <div className="bg-white/50 dark:bg-gray-800/50 p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {t("wishlist.empty")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.product")}</TableHead>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead className="text-right">
                    {t("common.price")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wishlist.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Link
                        href={`/product/${item._id}`}
                        className="flex items-center"
                      >
                        <div className="relative w-16 h-16">
                          <Image
                            src={item.images[0] || "/placeholder.png"}
                            alt={item.displayNames?.[language] || item.name}
                            fill
                            className="object-cover rounded-md"
                            sizes="64px"
                          />
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/product/${item._id}`}>
                        <span className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {item.displayNames?.[language] || item.name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleAddToCart(item)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleRemoveFromWishlist(item._id)}
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
