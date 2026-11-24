-- Sprint 1 : inscription simplifiée (INS-01 à INS-10, décisions D1, D6, D7)
--
-- Réglage Supabase attendu : « Confirm email » désactivé, pour que
-- l'utilisateur puisse commencer tout de suite (INS-05). La vérification de
-- l'adresse est suivie ici, dans profiles.email_verified_at, et posée par le
-- serveur quand l'utilisateur clique sur le lien reçu par e-mail.

alter table profiles add column email_verified_at timestamptz;

-- Création automatique du profil à l'inscription. Seuls les rôles
-- « investor » et « owner » peuvent venir des métadonnées du client.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
  name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '');
begin
  insert into profiles (id, full_name, roles, email_verified_at)
  values (
    new.id,
    coalesce(name, split_part(coalesce(new.email, ''), '@', 1), 'Utilisateur'),
    case when requested in ('investor', 'owner') then array[requested::user_role] else '{}'::user_role[] end,
    -- Google vérifie déjà l'adresse (INS-04)
    case when new.raw_app_meta_data ->> 'provider' = 'google' then now() end
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Un utilisateur ne peut ni se déclarer vérifié, ni se donner le rôle admin.
-- Il peut ajouter l'autre profil (INS-09).
create or replace function guard_profile() returns trigger
language plpgsql set search_path = public as $$
begin
  if is_privileged() then return new; end if;
  if new.email_verified_at is distinct from old.email_verified_at then
    raise exception 'La vérification de l''e-mail est faite par la plateforme';
  end if;
  if 'admin' = any (new.roles) and not ('admin' = any (old.roles)) then
    raise exception 'Rôle réservé à l''administration';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles for each row execute function guard_profile();

create or replace function email_verified(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = uid and email_verified_at is not null);
$$;

-- D7 : e-mail confirmé exigé avant la première soumission d'un terrain…
create or replace function require_verified_to_submit() returns trigger
language plpgsql set search_path = public as $$
begin
  if is_privileged() then return new; end if;
  if new.status = 'submitted' and old.status is distinct from 'submitted' and not email_verified(new.owner_id) then
    raise exception 'Confirmez votre adresse e-mail avant de soumettre votre terrain';
  end if;
  return new;
end $$;
create trigger lands_require_verified before update on lands for each row execute function require_verified_to_submit();

-- … et avant la première demande de visite (en plus de la charte, RES-01).
drop policy "visite : création" on visit_requests;
create policy "visite : création" on visit_requests for insert with check (
  investor_id = auth.uid()
  and land_is_public(land_id)
  and email_verified(auth.uid())
  and exists (select 1 from profiles where id = auth.uid() and charter_accepted_at is not null)
);
