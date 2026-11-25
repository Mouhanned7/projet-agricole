-- Messagerie, transactions et impact, prestataires et devis.
create table messages (
  id uuid primary key default gen_random_uuid(),
  land_id uuid not null references lands (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
alter table messages enable row level security;
create or replace function has_written(l uuid, from_id uuid, to_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from messages where land_id = l and sender_id = from_id and recipient_id = to_id);
$$;
create policy "messages : lecture" on messages for select using (sender_id = auth.uid() or recipient_id = auth.uid() or is_admin());
create policy "messages : envoi" on messages for insert with check (
  sender_id = auth.uid() and email_verified(auth.uid()) and (
    -- investisseur vers le propriétaire d'un terrain publié, charte acceptée
    (land_is_public(land_id)
      and exists (select 1 from lands where id = land_id and owner_id = recipient_id)
      and exists (select 1 from profiles where id = auth.uid() and charter_accepted_at is not null))
    -- réponse du propriétaire à quelqu'un qui lui a écrit
    or (owns_land(land_id) and has_written(land_id, recipient_id, auth.uid()))
  )
);
create policy "profil : correspondants" on profiles for select using (
  exists (select 1 from messages m where (m.sender_id = profiles.id and m.recipient_id = auth.uid()) or (m.recipient_id = profiles.id and m.sender_id = auth.uid()))
);
create or replace function notify_message() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, kind, title, body, link)
  values (new.recipient_id, 'message', 'Nouveau message', left(new.body, 140), '/compte/messages');
  return new;
end $$;
create trigger messages_notify after insert on messages for each row execute function notify_message();

create table deals (
  id uuid primary key default gen_random_uuid(),
  land_id uuid references lands (id) on delete set null,
  investor_name text not null,
  stage text not null default 'negotiation' check (stage in ('negotiation', 'signed', 'closed', 'cancelled')),
  amount_tnd numeric(14, 2) not null default 0,
  commission_tnd numeric(14, 2) not null default 0,
  hectares numeric(10, 2) not null default 0,
  trees_planted int not null default 0,
  jobs int not null default 0,
  women int not null default 0,
  youth int not null default 0,
  note text,
  created_at timestamptz not null default now()
);
alter table deals enable row level security;
create policy "transactions : admin" on deals for all using (is_admin()) with check (is_admin());
-- RES-10 : totaux publics des projets signés ou concrétisés, sans détail nominatif.
create or replace function impact_summary() returns table (projects bigint, hectares numeric, trees bigint, jobs bigint, women bigint, youth bigint)
language sql stable security definer set search_path = public as $$
  select count(*), coalesce(sum(d.hectares), 0), coalesce(sum(d.trees_planted), 0), coalesce(sum(d.jobs), 0), coalesce(sum(d.women), 0), coalesce(sum(d.youth), 0)
  from deals d where d.stage in ('signed', 'closed');
$$;
grant execute on function impact_summary() to anon, authenticated;

create table providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service text not null,
  governorate_id text references governorates (id),
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table providers enable row level security;
create policy "prestataires : lecture" on providers for select using (active or is_admin());
create policy "prestataires : admin" on providers for all using (is_admin()) with check (is_admin());

create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  message text not null,
  status text not null default 'new' check (status in ('new', 'sent', 'done')),
  created_at timestamptz not null default now()
);
alter table quote_requests enable row level security;
create policy "devis : les miens" on quote_requests for select using (user_id = auth.uid() or is_admin());
create policy "devis : demande" on quote_requests for insert with check (user_id = auth.uid());
create policy "devis : suivi admin" on quote_requests for update using (is_admin());
