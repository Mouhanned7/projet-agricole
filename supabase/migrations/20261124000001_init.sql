-- VerdOlive : schéma initial (cahier des charges v2, phase 1)
-- Le statut de classement est calculé par src/lib/domain/ranking.ts à chaque
-- enregistrement côté serveur et persisté ici (CLA-01).


-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type user_role as enum ('investor', 'owner', 'admin');
create type objective as enum ('sale', 'rent', 'partnership');
create type title_answer as enum ('yes', 'no', 'unknown');
create type yes_no as enum ('yes', 'no');
create type yes_no_unknown as enum ('yes', 'no', 'unknown');
create type ownership_kind as enum ('individual', 'joint', 'other');
create type alt_document as enum ('adoulaire', 'sale_contract', 'ownership_certificate', 'other', 'none');
create type water_availability as enum ('year_round', 'seasonal', 'uncertain');
create type data_nature as enum ('declared', 'measured', 'estimated', 'verified');
create type title_proof as enum ('none', 'declared', 'document', 'verified');
create type water_proof as enum ('none', 'declared', 'documented', 'analyzed');
create type ranking_status as enum ('priority', 'needs_check', 'low', 'incomplete');
create type land_state as enum ('exploited', 'partial', 'abandoned');
create type workflow_status as enum (
  'draft', 'submitted', 'info_requested', 'title_review', 'agri_analysis',
  'economic_review', 'validation', 'published', 'matching', 'negotiation',
  'closed', 'suspended', 'rejected'
);
create type document_kind as enum ('title', 'alt_ownership', 'joint_agreement', 'water_permit', 'water_analysis', 'soil_analysis', 'other');
create type document_status as enum ('received', 'to_review', 'accepted', 'refused');

-- ---------------------------------------------------------------------------
-- Profils (INS-01 à INS-09)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  roles user_role[] not null default '{}',
  phone text,                       -- indicatif international, sans vérification SMS (D6)
  city text,
  country text,
  locale text not null default 'fr',
  avatar_path text,
  charter_accepted_at timestamptz,  -- RES-01
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and 'admin' = any (roles));
$$;


-- Admin connecté, serveur (service_role) ou maintenance (postgres).
create or replace function is_privileged() returns boolean
language sql stable as $$
  select is_admin() or current_user in ('service_role', 'postgres', 'supabase_admin');
$$;

-- ---------------------------------------------------------------------------
-- Référentiel géographique
-- ---------------------------------------------------------------------------
create table governorates (
  id text primary key,      -- slug : 'nabeul'
  name_fr text not null,
  name_ar text not null
);

create table delegations (
  id text primary key,      -- 'nabeul-korba'
  governorate_id text not null references governorates (id),
  name_fr text not null
);
create index on delegations (governorate_id);

-- ---------------------------------------------------------------------------
-- Terrains
-- ---------------------------------------------------------------------------
create table lands (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default ('VO-' || upper(substr(md5(random()::text), 1, 6))),
  owner_id uuid not null references profiles (id) on delete cascade,
  status workflow_status not null default 'draft',
  wizard_step smallint not null default 1 check (wizard_step between 1 and 7), -- TER-05
  objective objective,
  title text,                                 -- ex. « Oliveraie – Cap Bon »
  description text,
  governorate_id text references governorates (id),
  delegation_id text references delegations (id),
  lat double precision check (lat between 30 and 38),
  lng double precision check (lng between 7 and 12),
  area_ha numeric(10, 2) check (area_ha > 0),
  exploitable_area_ha numeric(10, 2) check (exploitable_area_ha >= 0),
  state land_state,
  trees jsonb not null default '[]',          -- [{species, count, age}]
  buildings text,
  crops text,
  soil jsonb not null default '{}',           -- {ph:{value,nature,date}, ...} règle 8
  practices text[] not null default '{}',     -- RES-05 (phase 2)
  -- classement persisté (CLA-01, CLA-02)
  ranking_status ranking_status not null default 'incomplete',
  ranking_reason text not null default '',
  title_proof title_proof not null default 'none',
  water_proof water_proof not null default 'none',
  has_flow boolean not null default false,
  score_legal smallint not null default 0,
  score_water smallint not null default 0,
  score_completeness smallint not null default 0,
  score_agri smallint,                        -- GeoAI, phase 2
  -- dates
  submitted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lands_catalog_idx on lands (status, ranking_status, published_at desc);
create index lands_owner_idx on lands (owner_id);
create index lands_geo_idx on lands (governorate_id, delegation_id);

-- §3.2 A : titre foncier. Table séparée car privée (§13.1).
create table land_titles (
  land_id uuid primary key references lands (id) on delete cascade,
  answer title_answer,
  number text,
  number_normalized text,                     -- pour la détection de doublons (TER-07)
  registry text,
  owner_names text,
  ownership ownership_kind,
  joint_owners_agree boolean,                 -- RES-02
  alt_document alt_document,
  registration_in_progress yes_no_unknown,
  number_public boolean not null default false, -- autorisation du propriétaire (§13.1)
  verified_by uuid references profiles (id),
  verified_at timestamptz,
  verification_notes text,
  history jsonb not null default '[]',        -- réponses masquées conservées (§3.2 C)
  updated_at timestamptz not null default now()
);
create index land_titles_dup_idx on land_titles (number_normalized, registry);

-- §3.2 B : eau.
create table land_water (
  land_id uuid primary key references lands (id) on delete cascade,
  answer yes_no,
  sources text[] not null default '{}',
  availability water_availability,
  flow_value numeric(10, 2),
  flow_unit text check (flow_unit in ('l_s', 'm3_h')),
  flow_nature data_nature,
  flow_method text,
  depth_m numeric(8, 1),
  permit text,
  salinity_g_l numeric(6, 2),
  salinity_nature data_nature,
  equipment text,
  shared yes_no_unknown,                      -- RES-03
  shared_details text,
  nearby_source yes_no_unknown,
  nearby_type text,
  nearby_distance_km numeric(6, 2),
  rainfed boolean,
  verified_by uuid references profiles (id),
  verified_at timestamptz,
  history jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  constraint flow_has_unit check (flow_value is null or (flow_unit is not null and flow_nature is not null))
);

-- §3.4 : conditions selon l'objectif.
create table land_offers (
  land_id uuid primary key references lands (id) on delete cascade,
  price_tnd numeric(14, 2),                   -- vente
  negotiable yes_no_unknown,
  partial_sale boolean,
  included text[] not null default '{}',
  rent_tnd numeric(14, 2),                    -- location
  rent_period text,
  min_duration_years numeric(4, 1),
  partnership_type text,                      -- 'mgharsa' | 'other'
  owner_contribution text[] not null default '{}',
  investor_contribution text[] not null default '{}',
  owner_share_pct numeric(5, 2) check (owner_share_pct between 0 and 100),
  verdolive_fee_note text,                    -- RES-06 : frais affichés avant engagement
  details jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table land_photos (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references lands (id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

-- §4 : pièces justificatives (privées par défaut).
create table land_documents (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references lands (id) on delete cascade,
  kind document_kind not null,
  storage_path text not null,
  status document_status not null default 'received',
  uploaded_by uuid not null references profiles (id),
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

-- §10 : historique des statuts (date, auteur).
create table land_status_history (
  id bigint generated always as identity primary key,
  land_id uuid not null references lands (id) on delete cascade,
  from_status workflow_status,
  to_status workflow_status not null,
  actor_id uuid references profiles (id),
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Interactions investisseur
-- ---------------------------------------------------------------------------
create table favorites (
  user_id uuid not null references profiles (id) on delete cascade,
  land_id uuid not null references lands (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, land_id)
);

create table visit_requests (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references lands (id) on delete cascade,
  investor_id uuid not null references profiles (id) on delete cascade,
  message text,
  preferred_dates text,
  status text not null default 'new' check (status in ('new', 'seen', 'scheduled', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);

-- RES-09 : signalements.
create table reports (
  id uuid primary key default gen_random_uuid(),
  land_id uuid references lands (id) on delete set null,
  reporter_id uuid references profiles (id) on delete set null,
  reporter_email text,
  category text not null check (category in ('wrong_info', 'land_conflict', 'water_conflict', 'abuse', 'other')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'rejected')),
  admin_response text,
  handled_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Administration
-- ---------------------------------------------------------------------------
create table admin_alerts (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('duplicate_title', 'inconsistent', 'stale_draft', 'report')),
  land_id uuid references lands (id) on delete cascade,
  payload jsonb not null default '{}',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles (id),
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- CLA-04 et décision D4 : réglages modifiables par l'admin.
create table settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now()
);
insert into settings (key, value) values
  ('catalog.show_low_by_default', 'false'),
  ('ranking.sort_order', '["status", "title_proof", "water_proof", "agri_score", "completeness", "published_at"]'),
  ('drafts.reminder_days', '14'),
  ('drafts.admin_alert_days', '30');

-- ---------------------------------------------------------------------------
-- Déclencheurs
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on profiles for each row execute function touch_updated_at();
create trigger lands_touch before update on lands for each row execute function touch_updated_at();
create trigger titles_touch before update on land_titles for each row execute function touch_updated_at();
create trigger water_touch before update on land_water for each row execute function touch_updated_at();
create trigger offers_touch before update on land_offers for each row execute function touch_updated_at();

-- CLA-05 : seuls les admins posent les preuves « vérifié / documenté / analysé »
-- et changent le statut au-delà de « submitted ».
-- security invoker : current_user doit rester le rôle réel de l'appelant
create or replace function guard_land_admin_fields() returns trigger
language plpgsql set search_path = public as $$
begin
  -- service_role : serveur Next.js qui recalcule le classement (CLA-01)
  if is_privileged() then return new; end if;
  if (new.ranking_status, new.ranking_reason, new.has_flow, new.score_legal, new.score_water,
      new.score_completeness, new.score_agri)
     is distinct from
     (old.ranking_status, old.ranking_reason, old.has_flow, old.score_legal, old.score_water,
      old.score_completeness, old.score_agri) then
    raise exception 'Le classement est calculé par la plateforme';
  end if;
  if new.title_proof = 'verified' and old.title_proof is distinct from 'verified' then
    raise exception 'Seule l''administration peut marquer un titre comme vérifié';
  end if;
  if new.water_proof in ('documented', 'analyzed') and old.water_proof is distinct from new.water_proof then
    raise exception 'Seule l''administration peut valider les preuves d''eau';
  end if;
  if new.status is distinct from old.status
     and not (old.status in ('draft', 'info_requested') and new.status = 'submitted') then
    raise exception 'Changement de statut réservé à l''administration';
  end if;
  if new.published_at is distinct from old.published_at then
    raise exception 'Publication réservée à l''administration';
  end if;
  return new;
end $$;
create trigger lands_guard before update on lands for each row execute function guard_land_admin_fields();

-- security invoker : current_user doit rester le rôle réel de l'appelant
create or replace function guard_title_verification() returns trigger
language plpgsql set search_path = public as $$
begin
  if not is_privileged() and (new.verified_by is distinct from old.verified_by or new.verified_at is distinct from old.verified_at) then
    raise exception 'Vérification du titre réservée à l''administration';
  end if;
  new.number_normalized := nullif(regexp_replace(regexp_replace(upper(trim(coalesce(new.number, ''))), '[\s./\-]+', '', 'g'), '^0+(?=\d)', ''), '');
  return new;
end $$;
create trigger titles_guard before insert or update on land_titles for each row execute function guard_title_verification();

-- TER-07 : alerte en cas de numéro de titre déjà utilisé sur un autre terrain.
create or replace function alert_duplicate_title() returns trigger
language plpgsql security definer set search_path = public as $$
declare dup uuid;
begin
  if new.number_normalized is null then return new; end if;
  if tg_op = 'UPDATE' and new.number_normalized is not distinct from old.number_normalized
     and new.registry is not distinct from old.registry then
    return new;
  end if;
  select t.land_id into dup from land_titles t
   where t.number_normalized = new.number_normalized
     and coalesce(lower(t.registry), '') = coalesce(lower(new.registry), '')
     and t.land_id <> new.land_id
   limit 1;
  if dup is not null then
    insert into admin_alerts (kind, land_id, payload)
    values ('duplicate_title', new.land_id, jsonb_build_object('other_land_id', dup, 'number', new.number));
  end if;
  return new;
end $$;
create trigger titles_dup after insert or update on land_titles for each row execute function alert_duplicate_title();

-- §10 : chaque changement de statut est journalisé.
create or replace function log_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into land_status_history (land_id, from_status, to_status, actor_id)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger lands_status_log after update on lands for each row execute function log_status_change();

-- ---------------------------------------------------------------------------
-- Sécurité (RLS) : §13.1
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table governorates enable row level security;
alter table delegations enable row level security;
alter table lands enable row level security;
alter table land_titles enable row level security;
alter table land_water enable row level security;
alter table land_offers enable row level security;
alter table land_photos enable row level security;
alter table land_documents enable row level security;
alter table land_status_history enable row level security;
alter table favorites enable row level security;
alter table visit_requests enable row level security;
alter table reports enable row level security;
alter table admin_alerts enable row level security;
alter table audit_log enable row level security;
alter table settings enable row level security;

create or replace function owns_land(l uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from lands where id = l and owner_id = auth.uid());
$$;

create or replace function land_is_public(l uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from lands where id = l and status in ('published', 'matching', 'negotiation'));
$$;

-- profils
create policy "profil : lecture soi-même ou admin" on profiles for select using (id = auth.uid() or is_admin());
create policy "profil : création soi-même" on profiles for insert with check (id = auth.uid() and not ('admin' = any (roles)));
create policy "profil : modification soi-même" on profiles for update using (id = auth.uid() or is_admin());

-- référentiel public
create policy "gouvernorats publics" on governorates for select using (true);
create policy "délégations publiques" on delegations for select using (true);

-- terrains : publics une fois publiés (D2), sinon propriétaire et admin
create policy "terrain : lecture" on lands for select
  using (status in ('published', 'matching', 'negotiation') or owner_id = auth.uid() or is_admin());
create policy "terrain : création par un porteur" on lands for insert
  with check (owner_id = auth.uid() and status = 'draft' and published_at is null and title_proof <> 'verified');
create policy "terrain : modification" on lands for update using (owner_id = auth.uid() or is_admin());
create policy "terrain : suppression brouillon" on lands for delete using ((owner_id = auth.uid() and status = 'draft') or is_admin());

-- titre : jamais public (le badge est porté par lands.title_proof)
create policy "titre : propriétaire ou admin" on land_titles for all
  using (owns_land(land_id) or is_admin()) with check (owns_land(land_id) or is_admin());

-- eau, offre, photos : publiques si le terrain est publié
create policy "eau : lecture" on land_water for select using (land_is_public(land_id) or owns_land(land_id) or is_admin());
create policy "eau : écriture" on land_water for all using (owns_land(land_id) or is_admin()) with check (owns_land(land_id) or is_admin());
create policy "offre : lecture" on land_offers for select using (land_is_public(land_id) or owns_land(land_id) or is_admin());
create policy "offre : écriture" on land_offers for all using (owns_land(land_id) or is_admin()) with check (owns_land(land_id) or is_admin());
create policy "photos : lecture" on land_photos for select using (land_is_public(land_id) or owns_land(land_id) or is_admin());
create policy "photos : écriture" on land_photos for all using (owns_land(land_id) or is_admin()) with check (owns_land(land_id) or is_admin());

-- documents : privés (scénario 18)
create policy "documents : propriétaire ou admin" on land_documents for select using (owns_land(land_id) or is_admin());
create policy "documents : dépôt par le propriétaire" on land_documents for insert
  with check (owns_land(land_id) and uploaded_by = auth.uid() and status = 'received');
create policy "documents : revue admin" on land_documents for update using (is_admin());

create policy "historique : propriétaire ou admin" on land_status_history for select using (owns_land(land_id) or is_admin());

create policy "favoris : les miens" on favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- RES-01 : la charte doit être acceptée avant une demande de visite
create policy "visite : lecture" on visit_requests for select using (investor_id = auth.uid() or owns_land(land_id) or is_admin());
create policy "visite : création" on visit_requests for insert with check (
  investor_id = auth.uid()
  and land_is_public(land_id)
  and exists (select 1 from profiles where id = auth.uid() and charter_accepted_at is not null)
);
create policy "visite : suivi" on visit_requests for update using (owns_land(land_id) or is_admin());

-- RES-09 : tout le monde peut signaler, seuls l'auteur et l'admin lisent
create policy "signalement : création" on reports for insert with check (reporter_id is null or reporter_id = auth.uid());
create policy "signalement : lecture" on reports for select using (reporter_id = auth.uid() or is_admin());
create policy "signalement : traitement" on reports for update using (is_admin());

create policy "alertes : admin" on admin_alerts for all using (is_admin());
create policy "journal : admin" on audit_log for select using (is_admin());
create policy "réglages : lecture" on settings for select using (true);
create policy "réglages : admin" on settings for update using (is_admin());

-- ---------------------------------------------------------------------------
-- Vue publique du catalogue (D2) : aucune donnée foncière sensible.
-- ---------------------------------------------------------------------------
create view catalog_lands as
select
  l.id, l.ref, l.objective, l.title, l.governorate_id, l.delegation_id,
  g.name_fr as governorate_name, d.name_fr as delegation_name,
  round(l.lat::numeric, 2) as lat_approx, round(l.lng::numeric, 2) as lng_approx,
  l.area_ha, l.state, l.crops,
  l.ranking_status, l.ranking_reason, l.title_proof, l.water_proof, l.has_flow,
  l.score_legal, l.score_water, l.score_completeness, l.score_agri,
  l.published_at,
  t.answer as title_answer,
  w.answer as water_answer, w.sources as water_sources, w.availability as water_availability,
  w.flow_value, w.flow_unit,
  o.price_tnd, o.rent_tnd, o.rent_period, o.partnership_type, o.owner_share_pct,
  (select p.storage_path from land_photos p where p.land_id = l.id order by p.position limit 1) as cover_path
from lands l
left join governorates g on g.id = l.governorate_id
left join delegations d on d.id = l.delegation_id
left join land_titles t on t.land_id = l.id
left join land_water w on w.land_id = l.id
left join land_offers o on o.land_id = l.id
where l.status in ('published', 'matching', 'negotiation');

grant select on catalog_lands to anon, authenticated;
