"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

export type Language = "en" | "ar";

import en from "@/i18n/en.json";
import ar from "@/i18n/ar.json";

export const translations = {
  en,
  ar,
};


type TranslationsKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationsKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Provides language selection, persistence, and a translation helper to descendant components.
 *
 * Persists the chosen language to localStorage under `aix_language` and updates
 * `document.documentElement.dir` and `document.documentElement.lang` after initial mount.
 *
 * @param children - React nodes that will receive the language context
 * @returns A React context provider that supplies `{ language, setLanguage, t }` to its descendants
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("aix_language") as Language;
    return saved === "en" || saved === "ar" ? saved : "en";
  });
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("aix_language", lang);
  }, []);

  const t = useCallback((key: string): string => {
    const dict = translations[language] || translations.en;
    return (dict as Record<string, string>)[key] || key;
  }, [language]);

  const value = React.useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Access the language context value for the current React tree.
 *
 * @returns The context object with `language`, `setLanguage`, and `t` (translation) helpers.
 * @throws Error if called outside a `LanguageProvider` (message: "useLanguage must be used within a LanguageProvider").
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
