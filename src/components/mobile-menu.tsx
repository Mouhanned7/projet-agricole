"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Menu des petits écrans : fonctionne sans JavaScript et se referme après navigation. */
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [path]);
  return (
    <details ref={ref} className="group relative xl:hidden">
      {children}
    </details>
  );
}
