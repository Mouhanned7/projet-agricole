import "server-only";
import { cookies } from "next/headers";

export async function getLocale(): Promise<"fr" | "ar"> {
  return (await cookies()).get("lang")?.value === "ar" ? "ar" : "fr";
}
