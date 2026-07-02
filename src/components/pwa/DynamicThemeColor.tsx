"use client";

import { useEffect } from "react";
import { useTheme } from "@/app/context/theme-context";

export default function DynamicThemeColor() {
  const { theme } = useTheme();

  useEffect(() => {
    const themeColor = theme === "dark" ? "#10131a" : "#ffffff";
    
    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', themeColor);
  }, [theme]);

  return null; // Purely logic component
}
