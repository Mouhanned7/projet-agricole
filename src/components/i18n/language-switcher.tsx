"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bascule français / arabe, mémorisée dans un cookie d'un an. */
export function LanguageSwitcher({ locale, className }: { locale: "fr" | "ar"; className?: string }) {
  const next = locale === "ar" ? "fr" : "ar";
  return (
    <button
      type="button"
      translate="no"
      lang={next}
      onClick={() => {
        document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
        window.location.reload();
      }}
      className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-forest-900 ring-1 ring-forest-900/15 hover:bg-forest-900/5", className)}
      aria-label={next === "ar" ? "عرض الموقع بالعربية" : "Afficher le site en français"}
    >
      <Languages className="size-4" aria-hidden />
      {next === "ar" ? "العربية" : "Français"}
    </button>
  );
}
