"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  // Handle theme color application
  // Convert hex to HSL values
  const hexToHSL = (hex: string) => {
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
  };

  const applyThemeColors = React.useCallback((theme: string | undefined) => {
    // Get colors from localStorage with fallbacks
    const lightBg = localStorage.getItem("lightModeBackground") || "#ffffff";
    const darkBg = localStorage.getItem("darkModeBackground") || "#1a1a1a";
    const lightCard = localStorage.getItem("lightModeCard") || "#ffffff";
    const darkCard = localStorage.getItem("darkModeCard") || "#1e1e1e";
    const lightNavbar = localStorage.getItem("lightModeNavbar") || "#ffffff";
    const darkNavbar = localStorage.getItem("darkModeNavbar") || "#1e1e1e";
    const lightText = localStorage.getItem("lightModeText") || "#000000";
    const darkText = localStorage.getItem("darkModeText") || "#ffffff";
    const lightMutedText =
      localStorage.getItem("lightModeMutedText") || "#666666";
    const darkMutedText =
      localStorage.getItem("darkModeMutedText") || "#a1a1a1";
    const lightBorder = localStorage.getItem("lightModeBorder") || "#e5e7eb";
    const darkBorder = localStorage.getItem("darkModeBorder") || "#374151";
    const lightFooterColor =
      localStorage.getItem("lightModeFooter") || "#f9fafb";
    const darkFooterColor = localStorage.getItem("darkModeFooter") || "#111827";
    const lightCardItemBorder =
      localStorage.getItem("lightModeCardItemBorder") || "#e5e7eb";
    const darkCardItemBorder =
      localStorage.getItem("darkModeCardItemBorder") || "#374151";
    const lightCardBorder =
      localStorage.getItem("lightModeCardBorder") || "#e5e7eb";
    const darkCardBorder =
      localStorage.getItem("darkModeCardBorder") || "#374151";

    // Apply colors based on theme
    const isDark = theme === "dark";

    // Get opacity values
    const lightBgOpacity =
      Number(localStorage.getItem("lightModeBgOpacity")) || 100;
    const darkBgOpacity =
      Number(localStorage.getItem("darkModeBgOpacity")) || 100;
    const lightCardOpacity =
      Number(localStorage.getItem("lightModeCardOpacity")) || 100;
    const darkCardOpacity =
      Number(localStorage.getItem("darkModeCardOpacity")) || 100;
    const lightNavbarOpacity =
      Number(localStorage.getItem("lightModeNavbarOpacity")) || 100;
    const darkNavbarOpacity =
      Number(localStorage.getItem("darkModeNavbarOpacity")) || 100;

    // Apply background color with transparency
    const bgHSL = hexToHSL(isDark ? darkBg : lightBg);
    const bgOpacity = isDark ? darkBgOpacity : lightBgOpacity;
    document.documentElement.style.setProperty(
      "--background",
      `${bgHSL.h} ${bgHSL.s}% ${bgHSL.l}%`
    );
    document.documentElement.style.setProperty(
      "--background-opacity",
      String(bgOpacity / 100)
    );

    // Also set the background color directly for compatibility
    document.body.style.backgroundColor = `hsla(${bgHSL.h}, ${bgHSL.s}%, ${
      bgHSL.l
    }%, ${bgOpacity / 100})`;

    // Apply card colors with transparency
    const cardHSL = hexToHSL(isDark ? darkCard : lightCard);
    document.documentElement.style.setProperty(
      "--card",
      `${cardHSL.h} ${cardHSL.s}% ${cardHSL.l}%`
    );
    document.documentElement.style.setProperty(
      "--card-opacity",
      String((isDark ? darkCardOpacity : lightCardOpacity) / 100)
    );

    // Apply navbar colors with transparency
    const navbarColor = isDark ? darkNavbar : lightNavbar;
    const navbarOpacity =
      (isDark ? darkNavbarOpacity : lightNavbarOpacity) / 100;

    // Set navbar color directly
    const navbarElements = document.getElementsByClassName("navbar");
    for (let i = 0; i < navbarElements.length; i++) {
      const navbar = navbarElements[i] as HTMLElement;
      navbar.style.backgroundColor = `${navbarColor}${
        navbarOpacity < 1 ? navbarOpacity * 100 : ""
      }`;
    }
    document.documentElement.style.setProperty(
      "--navbar-opacity",
      String(navbarOpacity)
    );

    // Apply text colors
    const textHSL = hexToHSL(isDark ? darkText : lightText);
    document.documentElement.style.setProperty(
      "--foreground",
      `${textHSL.h} ${textHSL.s}% ${textHSL.l}%`
    );

    // Apply muted text colors
    const mutedTextHSL = hexToHSL(isDark ? darkMutedText : lightMutedText);
    document.documentElement.style.setProperty(
      "--muted-foreground",
      `${mutedTextHSL.h} ${mutedTextHSL.s}% ${mutedTextHSL.l}%`
    );

    // Apply border colors
    const borderHSL = hexToHSL(isDark ? darkBorder : lightBorder);
    document.documentElement.style.setProperty(
      "--border",
      `${borderHSL.h} ${borderHSL.s}% ${borderHSL.l}%`
    );
    // Apply card border colors
    const cardBorderHSL = hexToHSL(isDark ? darkCardBorder : lightCardBorder);
    document.documentElement.style.setProperty(
      "--card-border",
      `${cardBorderHSL.h} ${cardBorderHSL.s}% ${cardBorderHSL.l}%`
    );

    // Apply card item border colors
    const cardItemBorderHSL = hexToHSL(
      isDark ? darkCardItemBorder : lightCardItemBorder
    );
    document.documentElement.style.setProperty(
      "--card-item-border",
      `${cardItemBorderHSL.h} ${cardItemBorderHSL.s}% ${cardItemBorderHSL.l}%`
    );
    document.documentElement.style.setProperty(
      "--card-item-border-color",
      isDark ? darkCardItemBorder : lightCardItemBorder
    );

    // Apply footer colors
    const footerHSL = hexToHSL(isDark ? darkFooterColor : lightFooterColor);
    document.documentElement.style.setProperty(
      "--footer-background",
      `${footerHSL.h} ${footerHSL.s}% ${footerHSL.l}%`
    );

    // Also set the footer color directly for compatibility
    const footerElements = document.getElementsByTagName("footer");
    for (let i = 0; i < footerElements.length; i++) {
      const footer = footerElements[i] as HTMLElement;
      footer.style.backgroundColor = `hsl(${footerHSL.h}, ${footerHSL.s}%, ${footerHSL.l}%)`;
    }
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
