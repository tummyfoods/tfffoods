"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  // Handle theme color application
  const applyThemeColors = React.useCallback((theme: string | undefined) => {
    const lightBg = localStorage.getItem("lightModeBackground") || "#ffffff";
    const darkBg = localStorage.getItem("darkModeBackground") || "#1a1a1a";
    document.body.style.backgroundColor = theme === "dark" ? darkBg : lightBg;
  }, []);

  // Apply colors on mount and theme change
  React.useEffect(() => {
    setMounted(true);

    // Create a MutationObserver to watch for theme class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isDark = document.documentElement.classList.contains("dark");
          applyThemeColors(isDark ? "dark" : "light");
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Initial application
    const isDark = document.documentElement.classList.contains("dark");
    applyThemeColors(isDark ? "dark" : "light");

    return () => observer.disconnect();
  }, [applyThemeColors]);

  // Handle storage changes (when colors are updated in theme settings)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lightModeBackground" || e.key === "darkModeBackground") {
        const isDark = document.documentElement.classList.contains("dark");
        applyThemeColors(isDark ? "dark" : "light");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [applyThemeColors]);

  if (!mounted) {
    return null;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
