import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tnd = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** « 850 000 TND » (espaces insécables remplacés par des espaces fines). */
export function formatTnd(value: number): string {
  return `${tnd.format(value).replace(/ | /g, " ")} TND`;
}

export function formatHa(value: number): string {
  return `${tnd.format(value).replace(/ | /g, " ")} ha`;
}
