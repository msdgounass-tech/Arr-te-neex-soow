// Couche d'accès aux données. Même interface pour Supabase (production) et le mode démo.
import { CONFIG } from './config.js';

export const IS_DEMO = !(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

let apiPromise;
export function getApi() {
  if (!apiPromise) apiPromise = IS_DEMO ? import('./demo.js').then((m) => m.createDemoApi()) : createSupabaseApi();
  return apiPromise;
}

const SELECT_ORDER = '*, items:ns_order_items(*), history:ns_order_history(status, changed_at)';

async function createSupabaseApi() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm');
  const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ns-auth' },
  });
  const ok = ({ data, error }) => { if (error) throw error; return data; };
  const sortFormats = (p) => ({ ...p, formats: (p.formats || []).sort((a, b) => a.position - b.position) });

  return {
    demo: false,

    // ---------------- Public ----------------
    async getCatalog() {
      const [settings, products, closedDates, closedSlots] = await Promise.all([
        sb.from('ns_settings').select('*').eq('id', 1).single().then(ok),
        sb.from('ns_products').select('*, formats:ns_formats(*)').order('position').then(ok),
        sb.from('ns_closed_dates').select('*').then(ok),
        sb.from('ns_closed_slots').select('*').then(ok),
      ]);
      return { settings, products: products.map(sortFormats), closedDates, closedSlots };
    },
    getSlotLoad: (from, to) => sb.rpc('ns_slot_load', { p_from: from, p_to: to }).then(ok),
    placeOrder: (o) => sb.rpc('ns_place_order', {
      p_name: o.name, p_phone: o.phone, p_note: o.note, p_day: o.day, p_slot: o.slot,
      p_items: o.items, p_payment: o.payment || 'retrait',
    }).then(ok),
    trackOrder: (token) => sb.rpc('ns_track_order', { p_token: token }).then(ok),
    cancelOrder: (token) => sb.rpc('ns_cancel_order', { p_token: token }).then(ok),

    // ---------------- Authentification ----------------
    async session() { const { data } = await sb.auth.getSession(); return data.session; },
    async signIn(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
    async signOut() { await sb.auth.signOut(); },
    async isAdmin() { return ok(await sb.rpc('ns_is_admin')) === true; },
    async resetPassword(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] })); },
    async changePassword(password) { ok(await sb.auth.updateUser({ password })); },
    onAuth(cb) { sb.auth.onAuthStateChange((evt, s) => cb(evt, s)); },
    async userEmail() { const { data } = await sb.auth.getUser(); return data.user?.email || ''; },

    // ---------------- Administration ----------------
    async adminCatalog() {
      // l'admin voit aussi les produits et formats désactivés (RLS ns_admin_all)
      return this.getCatalog();
    },
    async listOrders({ from, to } = {}) {
      let q = sb.from('ns_orders').select(SELECT_ORDER).order('pickup_day').order('pickup_slot').order('created_at');
      if (from) q = q.gte('pickup_day', from);
      if (to) q = q.lte('pickup_day', to);
      return ok(await q.limit(2000));
    },
    async listOrdersCreatedSince(iso) {
      return ok(await sb.from('ns_orders').select(SELECT_ORDER).gte('created_at', iso).order('created_at', { ascending: false }).limit(5000));
    },
    async getOrder(id) { return ok(await sb.from('ns_orders').select(SELECT_ORDER).eq('id', id).single()); },
    async updateOrder(id, patch) {
      return ok(await sb.from('ns_orders').update(patch).eq('id', id).select(SELECT_ORDER).single());
    },
    async saveProduct(p) {
      const row = { name: p.name, description: p.description, category: p.category, emoji: p.emoji, image_url: p.image_url || null, popular: p.popular, active: p.active, position: p.position };
      const saved = p.id
        ? ok(await sb.from('ns_products').update(row).eq('id', p.id).select().single())
        : ok(await sb.from('ns_products').insert(row).select().single());
      const keep = p.formats.filter((f) => f.id).map((f) => f.id);
      let del = sb.from('ns_formats').delete().eq('product_id', saved.id);
      if (keep.length) del = del.not('id', 'in', `(${keep.join(',')})`);
      ok(await del);
      const rows = p.formats.map((f, i) => ({ ...(f.id ? { id: f.id } : {}), product_id: saved.id, name: f.name, price: f.price, stock: f.stock ?? null, active: f.active, position: i }));
      if (rows.length) ok(await sb.from('ns_formats').upsert(rows));
      return saved.id;
    },
    async deleteProduct(id) { ok(await sb.from('ns_products').delete().eq('id', id)); },
    async reorderProducts(ids) {
      await Promise.all(ids.map((id, i) => sb.from('ns_products').update({ position: i + 1 }).eq('id', id).then(ok)));
    },
    async patchProduct(id, patch) { ok(await sb.from('ns_products').update(patch).eq('id', id)); },
    async uploadImage(blob) {
      const path = `p/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      ok(await sb.storage.from('ns-products').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' }));
      return sb.storage.from('ns-products').getPublicUrl(path).data.publicUrl;
    },
    async saveSettings(patch) { return ok(await sb.from('ns_settings').update(patch).eq('id', 1).select().single()); },
    async setClosedDate(day, closed, reason = '') {
      if (closed) ok(await sb.from('ns_closed_dates').upsert({ day, reason }));
      else ok(await sb.from('ns_closed_dates').delete().eq('day', day));
    },
    async setClosedSlot(day, slot, closed) {
      if (closed) ok(await sb.from('ns_closed_slots').upsert({ day, slot }));
      else ok(await sb.from('ns_closed_slots').delete().eq('day', day).eq('slot', slot));
    },
    subscribeOrders(cb) {
      const ch = sb.channel('ns-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ns_orders' }, (p) => cb(p.eventType, p.new, p.old))
        .subscribe((status) => cb('status', status));
      return () => sb.removeChannel(ch);
    },
  };
}
