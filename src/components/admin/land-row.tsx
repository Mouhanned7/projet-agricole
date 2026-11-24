import Link from "next/link";
import { StatusBadge, TitlePill, WaterPill } from "@/components/ui/proof-pills";
import type { AdminLand } from "@/lib/admin/queries";
import { GOVERNORATES } from "@/lib/data/tunisia";
import type { RankingStatus, TitleProof, WaterProof } from "@/lib/domain/types";
import { OBJECTIVE_LABEL, WORKFLOW_LABEL } from "@/lib/lands/labels";
import { formatHa } from "@/lib/utils";

export function AdminLandRow({ l }: { l: AdminLand }) {
  const gov = GOVERNORATES.find((g) => g.id === l.governorate_id)?.fr;
  return (
    <li>
      <Link href={`/admin/terrains/${l.id}`} className="flex flex-col gap-2 p-4 hover:bg-cream-100 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
            {l.ref}
            <span className="rounded-full bg-cream-200 px-2 py-0.5 font-medium text-ink-600">{WORKFLOW_LABEL[l.status as keyof typeof WORKFLOW_LABEL]}</span>
            <StatusBadge status={l.ranking_status as RankingStatus} className="bg-cream-100" />
          </p>
          <p className="mt-1 truncate font-semibold text-ink-900">{l.title ?? "Sans nom"}</p>
          <p className="text-sm text-ink-600">
            {[l.objective && OBJECTIVE_LABEL[l.objective as keyof typeof OBJECTIVE_LABEL], gov, l.area_ha && formatHa(Number(l.area_ha))].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TitlePill proof={l.title_proof as TitleProof} />
          <WaterPill proof={l.water_proof as WaterProof} />
        </div>
        <p className="text-xs text-ink-400 sm:w-28 sm:text-right">
          {l.submitted_at ? `Soumis le ${new Date(l.submitted_at).toLocaleDateString("fr-FR")}` : ""}
          <br />
          {l.score_completeness} % complet
        </p>
      </Link>
    </li>
  );
}
