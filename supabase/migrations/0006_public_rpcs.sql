-- ════════════════════════════════════════════════════════════════
--  GOUNASS LUXURY — Fonctions sécurisées appelables avec la clé publique
--  Permettent au site de fonctionner sans la clé service_role pour les
--  parcours essentiels (commande, suivi, paiement par lien, livraison).
--  Toutes recalculent ou vérifient côté base : aucune donnée de confiance
--  ne vient du navigateur.
-- ════════════════════════════════════════════════════════════════

-- ── Création de commande : l'identité vient de la session, jamais du client ──
create or replace function public.place_order_public(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return public.place_order(
    (p - 'user_id') || jsonb_build_object('user_id', coalesce(auth.uid()::text, ''))
  );
end $$;
revoke all on function public.place_order_public(jsonb) from public;
grant execute on function public.place_order_public(jsonb) to anon, authenticated, service_role;

-- ── Lecture d'une commande via son numéro + jeton secret ────────
create or replace function public.get_order_public(p_number text, p_token uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  o public.orders;
  pay public.payments;
begin
  select * into o from public.orders where order_number = p_number and access_token = p_token;
  if not found then
    return null;
  end if;
  select * into pay from public.payments where order_id = o.id order by created_at desc limit 1;
  return to_jsonb(o)
    || jsonb_build_object(
      'order_items', coalesce((select jsonb_agg(to_jsonb(i) order by i.product_name) from public.order_items i where i.order_id = o.id), '[]'::jsonb),
      'order_status_history', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'status', h.status, 'note', h.note, 'created_at', h.created_at) order by h.created_at)
                                          from public.order_status_history h where h.order_id = o.id), '[]'::jsonb),
      'deliveries', (select jsonb_build_object('status', d.status, 'carrier', d.carrier, 'tracking_number', d.tracking_number,
                                               'shipped_at', d.shipped_at, 'delivered_at', d.delivered_at)
                       from public.deliveries d where d.order_id = o.id),
      'payment', case when pay.id is null then null else jsonb_build_object(
                    'id', pay.id, 'status', pay.status, 'checkout_url', pay.checkout_url,
                    'mode', pay.raw ->> 'mode', 'qr_code', pay.raw -> 'checkout' ->> 'qrCode') end
    );
end $$;
revoke all on function public.get_order_public(text, uuid) from public;
grant execute on function public.get_order_public(text, uuid) to anon, authenticated, service_role;

-- ── Suivi : numéro de commande + téléphone → jeton d'accès ──────
create or replace function public.find_order_access(p_number text, p_phone text) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  o public.orders;
  digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
begin
  if length(digits) < 7 then
    return null;
  end if;
  select * into o from public.orders where order_number = upper(trim(p_number));
  if not found then
    return null;
  end if;
  if regexp_replace(coalesce(o.phone, ''), '\D', '', 'g') like '%' || digits
     or regexp_replace(coalesce(o.whatsapp, ''), '\D', '', 'g') like '%' || digits then
    return o.access_token;
  end if;
  return null;
end $$;
revoke all on function public.find_order_access(text, text) from public;
grant execute on function public.find_order_access(text, text) to anon, authenticated, service_role;

-- ── Paiement par lien marchand : le lien vient des paramètres de la boutique ──
create or replace function public.start_link_payment(p_number text, p_token uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  pay public.payments;
  link text;
begin
  select * into o from public.orders where order_number = p_number and access_token = p_token;
  if not found then
    raise exception 'COMMANDE_INTROUVABLE';
  end if;
  if o.status = 'annulee' or o.payment_status = 'reussi' or o.delivery_fee_pending or o.payment_method not in ('wave', 'orange_money') then
    raise exception 'PAIEMENT_IMPOSSIBLE';
  end if;
  select value ->> (case o.payment_method when 'wave' then 'wave_link' else 'orange_money_link' end)
    into link from public.settings where key = 'payments';
  if coalesce(link, '') !~ '^https://\S+$' then
    raise exception 'LIEN_NON_CONFIGURE';
  end if;
  link := link || case when position('?' in link) > 0 then '&' else '?' end || 'amount=' || o.total;

  select * into pay from public.payments where order_id = o.id order by created_at desc limit 1 for update;
  update public.payments
     set raw = coalesce(raw, '{}'::jsonb) || jsonb_build_object('mode', 'lien'),
         checkout_url = link,
         amount = o.total
   where id = pay.id and status <> 'reussi';
  return link;
end $$;
revoke all on function public.start_link_payment(text, uuid) from public;
grant execute on function public.start_link_payment(text, uuid) to anon, authenticated, service_role;
