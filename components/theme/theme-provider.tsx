"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);
  const [themeSettings, setThemeSettings] = React.useState({
    light: {
      background: "#ffffff",
      card: "#ffffff",
      navbar: "#ffffff",
      text: "#000000",
      mutedText: "#666666",
      border: "#e5e7eb",
      footer: "#f9fafb",
      cardBorder: "#e5e7eb",
      cardItemBorder: "#e5e7eb",
      backgroundOpacity: 100,
      cardOpacity: 100,
      navbarOpacity: 100,
    },
    dark: {
      background: "#1a1a1a",
      card: "#1e1e1e",
      navbar: "#1e1e1e",
      text: "#ffffff",
      mutedText: "#a1a1a1",
      border: "#374151",
      footer: "#111827",
      cardBorder: "#374151",
      cardItemBorder: "#374151",
      backgroundOpacity: 100,
      cardOpacity: 100,
      navbarOpacity: 100,
    },
  });

  // Load theme settings from API
  React.useEffect(() => {
    async function loadThemeSettings() {
      try {
        const response = await fetch("/api/theme-settings");
        const data = await response.json();
        if (data.themeSettings) {
          setThemeSettings(data.themeSettings);
        }
      } catch (error) {
        console.error("Failed to load theme settings:", error);
      }
    }
    loadThemeSettings();
  }, []);

  // Convert hex to HSL values
  const hexToHSL = React.useCallback((hex: string) => {
    // Remove the # if present
    hex = hex.replace("#", "");

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Find min and max values
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    // Convert to HSL values
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    const lPercent = Math.round(l * 100);

    return { h, s, l: lPercent };
  }, []);

  // Apply theme colors
  const applyThemeColors = React.useCallback(
    (theme: string | undefined) => {
      const isDark = theme === "dark";
      const colors = isDark ? themeSettings.dark : themeSettings.light;

      // Apply background color
      const bgHSL = hexToHSL(colors.background);
      document.documentElement.style.setProperty(
        "--background",
        `${bgHSL.h} ${bgHSL.s}% ${bgHSL.l}%`
      );
      document.documentElement.style.setProperty(
        "--background-opacity",
        String(colors.backgroundOpacity / 100)
      );

      // Set background color directly for compatibility
      document.body.style.backgroundColor = `hsla(${bgHSL.h}, ${bgHSL.s}%, ${
        bgHSL.l
      }%, ${colors.backgroundOpacity / 100})`;

      // Apply card colors
      const cardHSL = hexToHSL(colors.card);
      document.documentElement.style.setProperty(
        "--card",
        `${cardHSL.h} ${cardHSL.s}% ${cardHSL.l}%`
      );
      document.documentElement.style.setProperty(
        "--card-opacity",
        String(colors.cardOpacity / 100)
      );

      // Apply navbar colors
      const navbarHSL = hexToHSL(colors.navbar);
      const navbarElements = document.getElementsByClassName("navbar");
      for (let i = 0; i < navbarElements.length; i++) {
        const navbar = navbarElements[i] as HTMLElement;
        navbar.style.backgroundColor = `hsla(${navbarHSL.h}, ${navbarHSL.s}%, ${
          navbarHSL.l
        }%, ${colors.navbarOpacity / 100})`;
      }
      document.documentElement.style.setProperty(
        "--navbar-opacity",
        String(colors.navbarOpacity / 100)
      );

      // Apply text colors
      const textHSL = hexToHSL(colors.text);
      document.documentElement.style.setProperty(
        "--foreground",
        `${textHSL.h} ${textHSL.s}% ${textHSL.l}%`
      );

      // Apply muted text colors
      const mutedTextHSL = hexToHSL(colors.mutedText);
      document.documentElement.style.setProperty(
        "--muted-foreground",
        `${mutedTextHSL.h} ${mutedTextHSL.s}% ${mutedTextHSL.l}%`
      );

      // Apply border colors
      const borderHSL = hexToHSL(colors.border);
      document.documentElement.style.setProperty(
        "--border",
        `${borderHSL.h} ${borderHSL.s}% ${borderHSL.l}%`
      );

      // Apply card border colors
      const cardBorderHSL = hexToHSL(colors.cardBorder);
      document.documentElement.style.setProperty(
        "--card-border",
        `${cardBorderHSL.h} ${cardBorderHSL.s}% ${cardBorderHSL.l}%`
      );

      // Apply card item border colors
      const cardItemBorderHSL = hexToHSL(colors.cardItemBorder);
      document.documentElement.style.setProperty(
        "--card-item-border",
        `${cardItemBorderHSL.h} ${cardItemBorderHSL.s}% ${cardItemBorderHSL.l}%`
      );

      // Apply footer colors
      const footerHSL = hexToHSL(colors.footer);
      document.documentElement.style.setProperty(
        "--footer-background",
        `${footerHSL.h} ${footerHSL.s}% ${footerHSL.l}%`
      );

      // Set footer color directly for compatibility
      const footerElements = document.getElementsByTagName("footer");
      for (let i = 0; i < footerElements.length; i++) {
        const footer = footerElements[i] as HTMLElement;
        footer.style.backgroundColor = `hsl(${footerHSL.h}, ${footerHSL.s}%, ${footerHSL.l}%)`;
      }
    },
    [hexToHSL, themeSettings]
  );

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
      if (e.key === "themeColors") {
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
