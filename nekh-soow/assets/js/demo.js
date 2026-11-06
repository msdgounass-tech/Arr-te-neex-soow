// Mode démonstration : reproduit fidèlement les règles de la base Supabase
// (validation, capacité des créneaux, stock, garde-fous) dans le navigateur.
// Les données restent sur cet appareil. Identifiants back-office : demo / demo
import { addDays, dakarNow, normalizePhone, slotMinutes, store, uid, weekday } from './util.js';

const KEY = 'ns-demo-v1';
const AUTH = 'ns-demo-auth';
const fail = (code, msg) => { throw new Error(`NS_${code}: ${msg}`); };
const clone = (x) => JSON.parse(JSON.stringify(x));

function seed() {
  const P = (name, description, category, emoji, image_url, popular, formats) => ({
    id: uid(), name, description, category, emoji, image_url, popular, active: true, position: 0,
    formats: formats.map(([n, price], i) => ({ id: uid(), name: n, price, stock: null, active: true, position: i })),
  });
  const products = [
    P('Soow Piir', 'Lait caillé de vache sucré, recette traditionnelle, servi bien frais.', 'SOOW', '🥛', 'assets/img/soow-piir.webp', true, [['Petit pot', 500], ['Grand pot', 2000]]),
    P('Thiakry ak Soow', 'Perles de mil nappées de lait caillé sucré et onctueux.', 'THIAKRY', '🍚', 'assets/img/thiakry-ak-soow.webp', true, [['Petit pot', 1000], ['Grand pot', 2000]]),
    P('Thiakry', 'Semoule de mil travaillée à la main, crème légère et raisins secs.', 'THIAKRY', '🍚', 'assets/img/thiakry.webp', true, [['Petit pot', 1000], ['Grand pot', 2000]]),
    P('Ngallakh', 'Bouillie de mil au pain de singe (bouye) et à la pâte d’arachide.', 'NGALLAKH', '🥜', 'assets/img/ngallakh.webp', false, [['Gobelet', 700], ['Grand pot', 2000]]),
    P('Lakh Soow', 'Bouillie de mil sucrée accompagnée de lait caillé.', 'LAKH', '🌾', 'assets/img/lakh-soow.webp', false, [['Gobelet', 500], ['Grand pot', 1500]]),
    P('Yaourt maison', 'Yaourt nature onctueux, fabriqué sur place chaque matin.', 'YAOURT', '🥛', null, true, [['Petit pot', 750], ['Grand pot', 1500]]),
  ].map((p, i) => ({ ...p, position: i + 1 }));

  const settings = {
    id: 1, shop_name: 'Arrêt nekh soow',
    tagline: 'Vos spécialités sénégalaises, prêtes à l’heure que vous choisissez.',
    story: 'Arrêt nekh soow vous propose les saveurs traditionnelles du Sénégal, préparées chaque jour avec soin à Thiès Mbour 3.',
    phone: '705704121', whatsapp: '221705704121', address: 'Thiès Mbour 3, Sénégal',
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Mbour+3+Thi%C3%A8s+S%C3%A9n%C3%A9gal',
    opening_hours: 'Tous les jours · 10h – 22h', announcement: '', accepting_orders: true,
    slot_times: ['10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '20:00', '21:00'],
    slot_capacity: 5, lead_minutes: 30, days_ahead: 4, closed_weekdays: [], updated_at: new Date().toISOString(),
  };

  // Historique fictif sur 21 jours pour que le tableau de bord soit parlant.
  const names = ['Awa Diop', 'Moussa Ndiaye', 'Fatou Sarr', 'Ibrahima Fall', 'Mariama Ba', 'Cheikh Sy', 'Aminata Faye', 'Ousmane Gueye', 'Khady Ndour', 'Mamadou Sow', 'Ndeye Kane', 'Abdou Diallo', 'Seynabou Mbaye', 'Pape Cissé'];
  const notes = ['', '', '', 'Bien frais svp', 'Sans raisins secs si possible', '', 'Je passe en voiture', ''];
  let r = 7; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const today = dakarNow().day; const orders = []; let seq = 1001;
  for (let d = -20; d <= 1; d++) {
    const day = addDays(today, d);
    const n = d === 1 ? 4 : d === 0 ? 9 : 3 + Math.floor(rnd() * 7) + (weekday(day) === 0 ? 4 : 0);
    for (let k = 0; k < n; k++) {
      const slot = pick(settings.slot_times);
      const lines = []; const nl = 1 + Math.floor(rnd() * 3);
      for (let j = 0; j < nl; j++) {
        const p = pick(products); const f = pick(p.formats);
        if (lines.find((l) => l.format_id === f.id)) continue;
        lines.push({ id: uid(), product_id: p.id, format_id: f.id, product_name: p.name, format_name: f.name, unit_price: f.price, qty: 1 + Math.floor(rnd() * 3) });
      }
      let status = 'recuperee';
      if (d < 0) status = rnd() < 0.08 ? 'annulee' : 'recuperee';
      else if (d === 0) status = slotMinutes(slot) < dakarNow().minutes ? (rnd() < 0.85 ? 'recuperee' : 'prete') : pick(['nouvelle', 'confirmee', 'preparation', 'prete', 'confirmee']);
      else status = pick(['nouvelle', 'confirmee']);
      const created = new Date(`${addDays(day, d > 0 ? -1 : 0)}T${String(8 + Math.floor(rnd() * 3)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}:00Z`);
      const name = pick(names);
      orders.push({
        id: uid(), number: `NS-${addDays(day, d > 0 ? -1 : 0).slice(2).replace(/-/g, '')}-${seq++}`, tracking_token: uid(),
        customer_name: name, phone: `7${pick(['0', '6', '7', '8'])}${String(Math.floor(rnd() * 1e7)).padStart(7, '0')}`,
        note: pick(notes), pickup_day: day, pickup_slot: slot, status,
        total: lines.reduce((a, l) => a + l.unit_price * l.qty, 0), items_count: lines.reduce((a, l) => a + l.qty, 0),
        paid: status === 'recuperee', payment_method: pick(['retrait', 'retrait', 'wave', 'orange_money']), admin_note: '',
        created_at: created.toISOString(), updated_at: created.toISOString(), items: lines,
        history: [{ status: 'nouvelle', changed_at: created.toISOString() }, ...(status !== 'nouvelle' ? [{ status, changed_at: created.toISOString() }] : [])],
      });
    }
  }
  return { settings, products, closedDates: [], closedSlots: [], orders, seq };
}

export function createDemoApi() {
  let db = store.get(KEY);
  if (!db || !db.settings) { db = seed(); store.set(KEY, db); }
  const listeners = new Set();
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('ns-demo') : null;
  const save = (evt) => {
    if (!store.set(KEY, db)) fail('STOCKAGE', 'Espace de stockage du navigateur plein');
    if (evt) { bc?.postMessage(evt); listeners.forEach((cb) => cb(evt.type, evt.order)); }
  };
  const reload = () => { db = store.get(KEY) || db; };
  bc?.addEventListener('message', (e) => { reload(); listeners.forEach((cb) => cb(e.data.type, e.data.order)); });
  const delay = (v) => new Promise((res) => setTimeout(() => res(clone(v)), 120));
  const needAdmin = () => { if (!store.get(AUTH)) fail('AUTH', 'Session expirée, reconnectez-vous'); };
  const load = () => db.orders.filter((o) => o.status !== 'annulee').reduce((acc, o) => {
    const k = `${o.pickup_day} ${o.pickup_slot}`; acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});

  return {
    demo: true,
    async getCatalog() {
      reload();
      const products = db.products.filter((p) => p.active).map((p) => ({ ...p, formats: p.formats.filter((f) => f.active) }));
      return delay({ settings: db.settings, products, closedDates: db.closedDates, closedSlots: db.closedSlots });
    },
    async getSlotLoad(from, to) {
      reload();
      return delay(Object.entries(load()).map(([k, booked]) => { const [day, slot] = k.split(' '); return { day, slot, booked }; })
        .filter((l) => l.day >= from && l.day <= to));
    },
    async placeOrder(o) {
      reload();
      const s = db.settings; const now = dakarNow();
      if (!s.accepting_orders) fail('FERME', 'Les commandes sont momentanément suspendues');
      const name = String(o.name || '').trim();
      if (name.length < 2 || name.length > 80) fail('NOM', 'Indiquez votre nom');
      const phone = normalizePhone(o.phone); if (!phone) fail('TEL', 'Numéro de téléphone sénégalais invalide');
      if (o.day < now.day || o.day >= addDays(now.day, s.days_ahead)) fail('JOUR', 'Ce jour n’est pas ouvert à la commande');
      if (s.closed_weekdays.includes(weekday(o.day)) || db.closedDates.some((c) => c.day === o.day)) fail('JOUR', 'Nous sommes fermés ce jour-là');
      if (!s.slot_times.includes(o.slot) || db.closedSlots.some((c) => c.day === o.day && c.slot === o.slot)) fail('CRENEAU', 'Ce créneau n’est pas disponible');
      if (o.day === now.day && slotMinutes(o.slot) < now.minutes + s.lead_minutes) fail('CRENEAU', 'Ce créneau est trop proche, choisissez-en un plus tard');
      if ((load()[`${o.day} ${o.slot}`] || 0) >= s.slot_capacity) fail('COMPLET', 'Ce créneau vient d’être complet, choisissez-en un autre');
      const recent = db.orders.filter((x) => x.phone === phone && x.status !== 'annulee' && Date.now() - new Date(x.created_at) < 36e5).length;
      if (recent >= 4) fail('LIMITE', 'Trop de commandes récentes avec ce numéro, contactez-nous sur WhatsApp');
      if (!o.items?.length) fail('PANIER', 'Votre panier est vide');
      const items = o.items.map((it) => {
        const p = db.products.find((x) => x.active && x.formats.some((f) => f.id === it.format_id && f.active));
        if (!p) fail('PRODUIT', 'Un produit de votre panier n’est plus disponible');
        const f = p.formats.find((x) => x.id === it.format_id);
        if (!(it.qty >= 1 && it.qty <= 99)) fail('QTE', 'Quantité invalide');
        if (f.stock != null && f.stock < it.qty) fail('STOCK', `Stock insuffisant pour ${p.name} (${f.name}) : il en reste ${f.stock}`);
        return { p, f, qty: it.qty };
      });
      items.forEach(({ f, qty }) => { if (f.stock != null) f.stock -= qty; });
      const created = new Date().toISOString();
      const order = {
        id: uid(), number: `NS-${now.day.slice(2).replace(/-/g, '')}-${db.seq++}`, tracking_token: uid(),
        customer_name: name, phone, note: String(o.note || '').trim().slice(0, 500), pickup_day: o.day, pickup_slot: o.slot,
        status: 'nouvelle', total: items.reduce((a, i) => a + i.f.price * i.qty, 0), items_count: items.reduce((a, i) => a + i.qty, 0),
        paid: false, payment_method: o.payment || 'retrait', admin_note: '', created_at: created, updated_at: created,
        items: items.map(({ p, f, qty }) => ({ id: uid(), product_id: p.id, format_id: f.id, product_name: p.name, format_name: f.name, unit_price: f.price, qty })),
        history: [{ status: 'nouvelle', changed_at: created }],
      };
      db.orders.push(order); save({ type: 'INSERT', order });
      return delay({ number: order.number, token: order.tracking_token, total: order.total });
    },
    async trackOrder(token) {
      reload(); const o = db.orders.find((x) => x.tracking_token === token); if (!o) return delay(null);
      return delay({ ...o, history: o.history.map((h) => ({ status: h.status, at: h.changed_at })) });
    },
    async cancelOrder(token) {
      reload(); const o = db.orders.find((x) => x.tracking_token === token && x.status === 'nouvelle');
      if (!o) fail('ANNUL', 'Cette commande ne peut plus être annulée en ligne, contactez-nous');
      this._setStatus(o, 'annulee'); save({ type: 'UPDATE', order: o }); return delay(true);
    },
    _setStatus(o, status) {
      if (['annulee', 'recuperee'].includes(o.status) && status !== o.status) fail('CLOS', 'Cette commande est clôturée');
      if (status === o.status) return;
      if (status === 'annulee') o.items.forEach((i) => { const f = db.products.flatMap((p) => p.formats).find((x) => x.id === i.format_id); if (f && f.stock != null) f.stock += i.qty; });
      o.status = status; o.updated_at = new Date().toISOString(); o.history.push({ status, changed_at: o.updated_at });
    },

    // ---------- Authentification (démo) ----------
    async session() { return store.get(AUTH); },
    async signIn(email, password) {
      if (String(email).trim().toLowerCase() !== 'demo' || password !== 'demo') fail('AUTH', 'Identifiants incorrects (démo : demo / demo)');
      store.set(AUTH, { user: { email: 'demo' }, at: Date.now() });
    },
    async signOut() { store.del(AUTH); },
    async isAdmin() { return !!store.get(AUTH); },
    async resetPassword() { fail('DEMO', 'Indisponible en mode démonstration'); },
    async changePassword() { fail('DEMO', 'Indisponible en mode démonstration'); },
    onAuth() {},
    async userEmail() { return 'demo'; },

    // ---------- Administration ----------
    async adminCatalog() { needAdmin(); reload(); return delay({ settings: db.settings, products: [...db.products].sort((a, b) => a.position - b.position), closedDates: db.closedDates, closedSlots: db.closedSlots }); },
    async listOrders({ from, to } = {}) {
      needAdmin(); reload();
      return delay(db.orders.filter((o) => (!from || o.pickup_day >= from) && (!to || o.pickup_day <= to))
        .sort((a, b) => (a.pickup_day + a.pickup_slot + a.created_at).localeCompare(b.pickup_day + b.pickup_slot + b.created_at)));
    },
    async listOrdersCreatedSince(iso) { needAdmin(); reload(); return delay(db.orders.filter((o) => o.created_at >= iso)); },
    async getOrder(id) { needAdmin(); reload(); return delay(db.orders.find((o) => o.id === id)); },
    async updateOrder(id, patch) {
      needAdmin(); reload(); const o = db.orders.find((x) => x.id === id); if (!o) fail('INTROUVABLE', 'Commande introuvable');
      if (patch.status) this._setStatus(o, patch.status);
      ['paid', 'admin_note', 'payment_method'].forEach((k) => { if (k in patch) o[k] = patch[k]; });
      o.updated_at = new Date().toISOString(); save({ type: 'UPDATE', order: o }); return delay(o);
    },
    async saveProduct(p) {
      needAdmin(); reload();
      const row = { ...clone(p), formats: p.formats.map((f, i) => ({ id: f.id || uid(), name: f.name, price: f.price, stock: f.stock ?? null, active: f.active, position: i })) };
      if (p.id) { const i = db.products.findIndex((x) => x.id === p.id); db.products[i] = { ...db.products[i], ...row }; }
      else { row.id = uid(); row.position = Math.max(0, ...db.products.map((x) => x.position)) + 1; db.products.push(row); }
      save(); return row.id;
    },
    async deleteProduct(id) { needAdmin(); reload(); db.products = db.products.filter((p) => p.id !== id); save(); },
    async reorderProducts(ids) { needAdmin(); reload(); ids.forEach((id, i) => { const p = db.products.find((x) => x.id === id); if (p) p.position = i + 1; }); save(); },
    async patchProduct(id, patch) { needAdmin(); reload(); Object.assign(db.products.find((p) => p.id === id), patch); save(); },
    async uploadImage(blob) {
      needAdmin();
      return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
    },
    async saveSettings(patch) { needAdmin(); reload(); Object.assign(db.settings, patch, { updated_at: new Date().toISOString() }); save(); return delay(db.settings); },
    async setClosedDate(day, closed, reason = '') {
      needAdmin(); reload(); db.closedDates = db.closedDates.filter((d) => d.day !== day);
      if (closed) db.closedDates.push({ day, reason }); save();
    },
    async setClosedSlot(day, slot, closed) {
      needAdmin(); reload(); db.closedSlots = db.closedSlots.filter((d) => !(d.day === day && d.slot === slot));
      if (closed) db.closedSlots.push({ day, slot }); save();
    },
    subscribeOrders(cb) { listeners.add(cb); setTimeout(() => cb('status', 'SUBSCRIBED'), 50); return () => listeners.delete(cb); },
    resetDemo() { store.del(KEY); db = seed(); store.set(KEY, db); },
  };
}
