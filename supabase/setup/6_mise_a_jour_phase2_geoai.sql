-- VerdOlive : à exécuter UNE fois si votre base a été installée avant la phase 2 (diagnostic GeoAI).
-- Phase 2 : diagnostic GeoAI (§11), validé par l'administration avant publication (D12).

create table land_diagnostics (
  land_id uuid primary key references lands (id) on delete cascade,
  data jsonb not null,
  agri_score smallint check (agri_score between 0 and 100),
  status text not null default 'auto' check (status in ('auto', 'validated')),
  generated_at timestamptz not null default now(),
  validated_by uuid references profiles (id),
  validated_at timestamptz,
  validation_notes text
);
alter table land_diagnostics enable row level security;

-- Le porteur et l'admin voient le diagnostic ; le public seulement une fois validé.
create policy "diagnostic : lecture" on land_diagnostics for select using (
  owns_land(land_id) or is_admin() or (status = 'validated' and land_is_public(land_id))
);
create policy "diagnostic : administration" on land_diagnostics for all using (is_admin()) with check (is_admin());
