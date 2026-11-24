-- Sprints 4 et 5 : catalogue complet, notifications, administration.

-- ---------------------------------------------------------------------------
-- Vue publique du catalogue : toutes les données affichables d'un terrain
-- publié, sans numéro de titre ni nom des propriétaires (§13.1).
-- ---------------------------------------------------------------------------
drop view if exists catalog_lands;
create view catalog_lands as
select
  l.id, l.ref, l.status, l.objective, l.title, l.description,
  l.governorate_id, l.delegation_id,
  g.name_fr as governorate_name, d.name_fr as delegation_name,
  round(l.lat::numeric, 2) as lat_approx, round(l.lng::numeric, 2) as lng_approx,
  l.area_ha, l.exploitable_area_ha, l.state, l.crops, l.trees, l.buildings, l.practices,
  l.ranking_status, l.ranking_reason, l.title_proof, l.water_proof, l.has_flow,
  l.score_legal, l.score_water, l.score_completeness, l.score_agri,
  l.published_at, l.updated_at,
  t.answer as title_answer, t.ownership, t.joint_owners_agree, t.alt_document,
  t.registration_in_progress, t.verified_at as title_verified_at, t.verification_notes as title_notes,
  w.answer as water_answer, w.sources as water_sources, w.availability as water_availability,
  w.flow_value, w.flow_unit, w.flow_nature, w.depth_m, w.salinity_g_l, w.salinity_nature,
  w.equipment as water_equipment, w.shared as water_shared, w.shared_details as water_shared_details,
  w.nearby_source, w.nearby_distance_km, w.rainfed, w.verified_at as water_verified_at,
  o.price_tnd, o.negotiable, o.partial_sale, o.included, o.rent_tnd, o.rent_period, o.min_duration_years,
  o.partnership_type, o.owner_contribution, o.investor_contribution, o.owner_share_pct,
  o.verdolive_fee_note, o.details as offer_details,
  (select count(*) from land_documents dd where dd.land_id = l.id and dd.status <> 'refused')::int as documents_count,
  (select coalesce(array_agg(p.storage_path order by p.position), '{}') from land_photos p where p.land_id = l.id) as photo_paths
from lands l
left join governorates g on g.id = l.governorate_id
left join delegations d on d.id = l.delegation_id
left join land_titles t on t.land_id = l.id
left join land_water w on w.land_id = l.id
left join land_offers o on o.land_id = l.id
where l.status in ('published', 'matching', 'negotiation');

grant select on catalog_lands to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Notifications (§8, §10 : chaque changement de statut notifie le porteur)
-- ---------------------------------------------------------------------------
create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);
alter table notifications enable row level security;
create policy "notifications : les miennes" on notifications for select using (user_id = auth.uid());
create policy "notifications : marquer lue" on notifications for update using (user_id = auth.uid());

create or replace function status_label(s workflow_status) returns text language sql immutable as $$
  select case s
    when 'draft' then 'Brouillon' when 'submitted' then 'Soumis'
    when 'info_requested' then 'Informations à compléter' when 'title_review' then 'Vérification foncière'
    when 'agri_analysis' then 'Analyse agricole' when 'economic_review' then 'Diagnostic économique'
    when 'validation' then 'Validation' when 'published' then 'Publié'
    when 'matching' then 'Mise en relation' when 'negotiation' then 'Négociation'
    when 'closed' then 'Clôturé' when 'suspended' then 'Suspendu' when 'rejected' then 'Refusé'
  end;
$$;

-- Note facultative jointe au changement de statut (ex. « Ajoutez la photo du titre »),
-- transmise par admin_set_status() dans la même transaction.
create or replace function log_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into land_status_history (land_id, from_status, to_status, actor_id, note)
    values (new.id, old.status, new.status, auth.uid(), nullif(current_setting('verdolive.status_note', true), ''));
  end if;
  return new;
end $$;

create or replace function notify_land_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status <> 'submitted' then
    insert into notifications (user_id, kind, title, body, link)
    values (
      new.owner_id, 'land_status',
      coalesce(new.title, new.ref) || ' : ' || status_label(new.status),
      nullif(current_setting('verdolive.status_note', true), ''),
      '/espace-porteur/terrains/' || new.id
    );
  end if;
  return new;
end $$;
create trigger lands_notify_status after update on lands for each row execute function notify_land_status();

create or replace function notify_visit_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare l record;
begin
  select id, owner_id, coalesce(title, ref) as name into l from lands where id = new.land_id;
  insert into notifications (user_id, kind, title, body, link)
  values (l.owner_id, 'visit_request', 'Nouvelle demande de visite : ' || l.name, new.message, '/espace-porteur/visites');
  return new;
end $$;
create trigger visits_notify after insert on visit_requests for each row execute function notify_visit_request();

-- RES-09 : chaque signalement apparaît dans la file de l'administration.
create or replace function alert_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into admin_alerts (kind, land_id, payload)
  values ('report', new.land_id, jsonb_build_object('report_id', new.id, 'category', new.category));
  return new;
end $$;
create trigger reports_alert after insert on reports for each row execute function alert_report();

-- §9 / §10 : changement de statut par l'administration, avec note, journalisé.
create or replace function admin_set_status(p_land uuid, p_status workflow_status, p_note text default null)
returns void language plpgsql set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administration'; end if;
  perform set_config('verdolive.status_note', coalesce(p_note, ''), true);
  update lands set
    status = p_status,
    published_at = case when p_status = 'published' then coalesce(published_at, now()) else published_at end
  where id = p_land;
  insert into audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'set_status', 'land', p_land::text, jsonb_build_object('status', p_status, 'note', p_note));
end $$;
grant execute on function admin_set_status(uuid, workflow_status, text) to authenticated;

-- Le porteur voit le nom et le téléphone des investisseurs qui lui ont demandé une visite.
create policy "profil : demandeurs de visite" on profiles for select using (
  exists (
    select 1 from visit_requests v join lands l on l.id = v.land_id
     where v.investor_id = profiles.id and l.owner_id = auth.uid()
  )
);

-- Annulation d'une demande par l'investisseur.
create policy "visite : annulation" on visit_requests for update using (investor_id = auth.uid());

-- Réglages d'affichage et d'ordre de tri (CLA-04).
insert into settings (key, value) values
  ('ranking.sort_order', '["status", "title_proof", "water_proof", "agri_score", "completeness", "published_at"]')
on conflict (key) do nothing;
create policy "réglages : création admin" on settings for insert with check (is_admin());
create policy "journal : écriture admin" on audit_log for insert with check (is_admin() and actor_id = auth.uid());
