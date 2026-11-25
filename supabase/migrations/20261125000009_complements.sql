-- Réouverture par le porteur, filtre « vérification en cours », pondérations.
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
  (select coalesce(array_agg(p.storage_path order by p.position), '{}') from land_photos p where p.land_id = l.id) as photo_paths,
  l.soil,
  (l.title_proof <> 'verified' and exists (select 1 from land_documents rd where rd.land_id = l.id and rd.kind = 'title' and rd.status in ('received', 'to_review'))) as title_review
from lands l
left join governorates g on g.id = l.governorate_id
left join delegations d on d.id = l.delegation_id
left join land_titles t on t.land_id = l.id
left join land_water w on w.land_id = l.id
left join land_offers o on o.land_id = l.id
where l.status in ('published', 'matching', 'negotiation');

grant select on catalog_lands to anon, authenticated;

-- Le porteur rouvre son terrain publié pour le modifier : il est retiré du catalogue,
-- les preuves vérifiées sont remises à « déclaré » et l'administration le revalide.
create or replace function reopen_land(p_land uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from lands where id = p_land and owner_id = auth.uid() and status in ('published', 'matching')) then
    raise exception 'Réouverture impossible';
  end if;
  update land_titles set verified_by = null, verified_at = null where land_id = p_land;
  update land_water set verified_by = null, verified_at = null where land_id = p_land;
  update lands set status = 'info_requested', score_agri = null,
    title_proof = case when title_proof = 'verified' then 'declared'::title_proof else title_proof end,
    water_proof = case when water_proof in ('documented', 'analyzed') then 'declared'::water_proof else water_proof end
  where id = p_land;
end $$;
grant execute on function reopen_land(uuid) to authenticated;
