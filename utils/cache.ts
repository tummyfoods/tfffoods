import { LRUCache } from "lru-cache";

// Cache TTL in milliseconds (30 seconds)
const CACHE_TTL = 30 * 1000;

// Create cache instances
export const productsCache = new LRUCache({
  max: 500, // Maximum number of items
  ttl: CACHE_TTL, // Time to live
});

export const productCache = new LRUCache({
  max: 100, // Maximum number of items
  ttl: CACHE_TTL, // Time to live
});

// Function to clear all product-related caches
export const clearAllProductCaches = (productId?: string) => {
  productsCache.clear(); // Clear the products list cache
  if (productId) {
    productCache.delete(productId); // Clear specific product cache
  } else {
    productCache.clear(); // Clear all product caches
  }
};
