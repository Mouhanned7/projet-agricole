import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <path d="M16 29C16 18 10 10 3 7c1 9 5 17 13 22Z" fill="var(--olive-500)" />
      <path d="M16 29C16 18 22 10 29 7c-1 9-5 17-13 22Z" fill="var(--gold-500)" />
      <path d="M16 29V12" stroke="var(--forest-950)" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

export function Logo({ light = false, tagline = false }: { light?: boolean; tagline?: boolean }) {
  return (
    <span className="inline-flex flex-col leading-none">
      <span className={cn("inline-flex items-center gap-2 font-serif text-2xl font-semibold", light ? "text-cream-50" : "text-forest-900")}>
        <LogoMark />
        VerdOlive
      </span>
      {tagline && (
        <span className={cn("mt-1 pl-9 text-[11px] tracking-wide", light ? "text-gold-400" : "text-olive-600")}>
          Investir · Cultiver · Préserver
        </span>
      )}
    </span>
  );
}
