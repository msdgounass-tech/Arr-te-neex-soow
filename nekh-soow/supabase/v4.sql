-- Arrêt nekh soow — Mise à jour v4 : fidélité, visites, horaires automatiques. Relançable sans risque.

alter table public.ns_settings add column if not exists auto_hours boolean not null default false;
alter table public.ns_settings add column if not exists hours jsonb not null default
  '{"0":["10:00","22:00"],"1":["10:00","22:00"],"2":["10:00","22:00"],"3":["10:00","22:00"],"4":["10:00","22:00"],"5":["10:00","22:00"],"6":["10:00","22:00"]}';
alter table public.ns_settings add column if not exists loyalty_enabled boolean not null default true;
alter table public.ns_settings add column if not exists loyalty_rate int not null default 100;

create table if not exists public.ns_rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  cost int not null check (cost > 0),
  active boolean not null default true,
  position int not null default 0
);
insert into public.ns_rewards(name, cost, position)
select * from (values ('Petit pot de Soow Piir offert', 50, 1), ('Grand pot au choix offert', 150, 2)) v
where not exists (select 1 from public.ns_rewards);

create table if not exists public.ns_redemptions (
  id uuid primary key default gen_random_uuid(),
  phone text not null check (phone ~ '^[0-9]{9}$'),
  reward_name text not null,
  cost int not null check (cost > 0),
  created_at timestamptz not null default now(),
  created_by uuid
);
create index if not exists ns_redemptions_phone_idx on public.ns_redemptions(phone);

create table if not exists public.ns_visits (
  day date not null,
  visitor uuid not null,
  user_id uuid,
  hits int not null default 1,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  primary key (day, visitor)
);

-- Ouverture selon les horaires automatiques (heure de Dakar)
create or replace function public.ns_open_state() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s public.ns_settings%rowtype; v_now timestamp := now() at time zone 'Africa/Dakar'; h jsonb; t text := to_char(v_now, 'HH24:MI');
begin
  select * into s from public.ns_settings where id = 1;
  if not s.auto_hours then return jsonb_build_object('open', true); end if;
  h := s.hours -> extract(dow from v_now)::int::text;
  if h is null or jsonb_typeof(h) <> 'array' then return jsonb_build_object('open', false); end if;
  return jsonb_build_object('open', t >= (h->>0) and t < (h->>1), 'opens', h->>0, 'closes', h->>1);
end $$;

create or replace function public.ns_orders_hours_check() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not (public.ns_open_state()->>'open')::boolean then
    raise exception 'NS_FERME: La boutique est fermée en ce moment, revenez pendant nos horaires d''ouverture';
  end if;
  return new;
end $$;
drop trigger if exists ns_orders_hours_check on public.ns_orders;
create trigger ns_orders_hours_check before insert on public.ns_orders for each row execute function public.ns_orders_hours_check();

-- Fidélité : points gagnés sur les commandes récupérées (1 point par tranche de loyalty_rate FCFA)
create or replace function public.ns_loyalty(p_phone text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_phone text := public.ns_normalize_phone(p_phone); v_rate int; v_earned int; v_spent int; v_orders int;
begin
  if v_phone is null then return jsonb_build_object('ok', false, 'message', 'Numéro de téléphone invalide'); end if;
  select greatest(loyalty_rate, 1) into v_rate from public.ns_settings where id = 1;
  select coalesce(sum(floor(total / v_rate::numeric)), 0)::int, count(*) into v_earned, v_orders
    from public.ns_orders where phone = v_phone and status = 'recuperee';
  select coalesce(sum(cost), 0)::int into v_spent from public.ns_redemptions where phone = v_phone;
  return jsonb_build_object('ok', true, 'phone', v_phone, 'earned', v_earned, 'spent', v_spent, 'points', v_earned - v_spent,
    'orders', v_orders, 'rate', v_rate,
    'rewards', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'cost', cost) order by cost) from public.ns_rewards where active), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('reward', reward_name, 'cost', cost, 'at', created_at) order by created_at desc) from public.ns_redemptions where phone = v_phone), '[]'::jsonb));
end $$;

-- Remise d'un cadeau (back-office uniquement)
create or replace function public.ns_redeem(p_phone text, p_reward uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_phone text := public.ns_normalize_phone(p_phone); r public.ns_rewards%rowtype; v_pts int;
begin
  if not public.ns_is_admin() then raise exception 'NS_AUTH: Réservé au back-office'; end if;
  select * into r from public.ns_rewards where id = p_reward and active;
  if not found then raise exception 'NS_CADEAU: Cadeau introuvable'; end if;
  perform pg_advisory_xact_lock(hashtext('ns_loyalty:' || v_phone));
  v_pts := (public.ns_loyalty(v_phone)->>'points')::int;
  if v_pts < r.cost then raise exception 'NS_POINTS: Points insuffisants (% sur %)', v_pts, r.cost; end if;
  insert into public.ns_redemptions(phone, reward_name, cost, created_by) values (v_phone, r.name, r.cost, auth.uid());
  return public.ns_loyalty(v_phone);
end $$;

-- Visites (un enregistrement par visiteur et par jour)
create or replace function public.ns_track_visit(p_visitor uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.ns_visits(day, visitor, user_id) values ((now() at time zone 'Africa/Dakar')::date, p_visitor, auth.uid())
  on conflict (day, visitor) do update set hits = least(public.ns_visits.hits + 1, 10000), last_at = now(),
    user_id = coalesce(excluded.user_id, public.ns_visits.user_id);
$$;

revoke all on function public.ns_orders_hours_check() from public, anon, authenticated;
grant execute on function public.ns_open_state() to anon, authenticated;
grant execute on function public.ns_loyalty(text) to anon, authenticated;
grant execute on function public.ns_redeem(text, uuid) to authenticated;
grant execute on function public.ns_track_visit(uuid) to anon, authenticated;

alter table public.ns_rewards enable row level security;
alter table public.ns_redemptions enable row level security;
alter table public.ns_visits enable row level security;
grant select on public.ns_rewards to anon;
grant select, insert, update, delete on public.ns_rewards, public.ns_redemptions, public.ns_visits to authenticated;
revoke insert, update, delete on public.ns_rewards, public.ns_redemptions, public.ns_visits from anon;
revoke select on public.ns_redemptions, public.ns_visits from anon;
do $$ declare t text; begin
  foreach t in array array['ns_rewards','ns_redemptions','ns_visits'] loop
    execute format('drop policy if exists ns_admin_all on public.%I', t);
    execute format('create policy ns_admin_all on public.%I for all to authenticated using (public.ns_is_admin()) with check (public.ns_is_admin())', t);
  end loop;
end $$;
drop policy if exists ns_public_read on public.ns_rewards;
create policy ns_public_read on public.ns_rewards for select to anon, authenticated using (active);

select 'v4 installée' as etat;
