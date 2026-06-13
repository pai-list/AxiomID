"use client";

import { useTheme } from "@/app/context/theme-context";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-mono text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 active:scale-95 cursor-pointer z-50 ${className}`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="text-base leading-none">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
