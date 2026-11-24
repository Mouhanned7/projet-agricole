import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createElement } from "react";
import { getSession } from "@/lib/auth/session";
import { getCatalogItem } from "@/lib/catalog/source";
import { getDiagnostic } from "@/lib/geoai/service";
import { LandReport } from "@/lib/report/land-report";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** §12 / scénario 17 : rapport PDF d'un terrain publié, réservé aux comptes (D8). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Introuvable", { status: 404 });
  const session = await getSession();
  if (supabaseConfigured && !session) {
    return NextResponse.redirect(new URL(`/connexion?next=/terrains/${id}`, request.url));
  }
  const land = await getCatalogItem(id);
  if (!land) return new NextResponse("Terrain introuvable ou non publié", { status: 404 });
  const diag = supabaseConfigured ? await getDiagnostic(await createClient(), id) : null;

  const doc = createElement(LandReport, { land, diag, generatedAt: new Date() }) as Parameters<typeof renderToBuffer>[0];
  const pdf = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="VerdOlive-${land.ref}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
