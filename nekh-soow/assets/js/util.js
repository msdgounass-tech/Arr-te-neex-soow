// Utilitaires partagés boutique / back-office.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
export const pad = (n) => String(n).padStart(2, '0');

// ---------- Dates (fuseau Africa/Dakar = UTC+0, sans heure d'été) ----------
export const TZ = 'Africa/Dakar';
export function dakarNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
export const toDate = (k) => new Date(`${k}T12:00:00Z`);
export function addDays(k, n) { const d = toDate(k); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export const weekday = (k) => toDate(k).getUTCDay();
export const fmtDay = (k, opts = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  toDate(k).toLocaleDateString('fr-FR', { ...opts, timeZone: 'UTC' });
export function relDay(k) {
  const t = dakarNow().day;
  if (k === t) return "Aujourd'hui";
  if (k === addDays(t, 1)) return 'Demain';
  if (k === addDays(t, -1)) return 'Hier';
  const s = fmtDay(k); return s.charAt(0).toUpperCase() + s.slice(1);
}
export const fmtSlot = (s) => s.replace(':', 'h');
export const slotMinutes = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export const fmtDateTime = (iso) => new Date(iso).toLocaleString('fr-FR', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
export function timeAgo(iso) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return fmtDateTime(iso);
}

// ---------- Créneaux horaires ----------
export const SLOT_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export function normalizeSlot(v) {
  const m = String(v).trim().replace(/\s+/g, '').replace(/h/i, ':').replace(/:$/, '').match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return null;
  const s = `${pad(m[1])}:${m[2] || '00'}`;
  return SLOT_RE.test(s) ? s : null;
}
export const sortSlots = (arr) => [...new Set(arr)].sort((a, b) => slotMinutes(a) - slotMinutes(b));

/** Jours ouverts à la commande, à partir des réglages. */
export function openDays(settings, closedDates) {
  const t = dakarNow().day; const out = [];
  const closed = new Set(closedDates.map((d) => d.day));
  for (let i = 0; i < settings.days_ahead; i++) {
    const k = addDays(t, i);
    if (settings.closed_weekdays.includes(weekday(k)) || closed.has(k)) continue;
    out.push(k);
  }
  return out;
}

/** État de chaque créneau d'un jour : {slot, left, state: 'ok'|'few'|'full'|'past'|'closed'} */
export function slotStates(day, settings, closedSlots, load) {
  const now = dakarNow();
  const closed = new Set(closedSlots.filter((c) => c.day === day).map((c) => c.slot));
  return sortSlots(settings.slot_times).map((slot) => {
    const booked = load.find((l) => l.day === day && l.slot === slot)?.booked || 0;
    const left = Math.max(0, settings.slot_capacity - booked);
    let state = left === 0 ? 'full' : left <= Math.max(1, Math.ceil(settings.slot_capacity / 4)) ? 'few' : 'ok';
    if (day === now.day && slotMinutes(slot) < now.minutes + settings.lead_minutes) state = 'past';
    if (closed.has(slot)) state = 'closed';
    return { slot, left, booked, state };
  });
}

// ---------- Téléphone (Sénégal) ----------
export function normalizePhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('00221')) d = d.slice(5);
  if (d.length === 12 && d.startsWith('221')) d = d.slice(3);
  return /^(7[05678]|3[03])\d{7}$/.test(d) ? d : null;
}
export const fmtPhone = (d) => String(d || '').replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4');
export const waLink = (num, text) => `https://wa.me/${String(num).replace(/\D/g, '').replace(/^(?!221)(\d{9})$/, '221$1')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

// ---------- Statuts ----------
export const STATUSES = [
  { k: 'nouvelle', label: 'Nouvelle', short: 'Reçue', icon: '🆕', next: 'confirmee', action: 'Confirmer' },
  { k: 'confirmee', label: 'Confirmée', short: 'Confirmée', icon: '✅', next: 'preparation', action: 'Lancer la préparation' },
  { k: 'preparation', label: 'En préparation', short: 'En préparation', icon: '👩🏾‍🍳', next: 'prete', action: 'Marquer prête' },
  { k: 'prete', label: 'Prête', short: 'Prête', icon: '🛍️', next: 'recuperee', action: 'Marquer récupérée' },
  { k: 'recuperee', label: 'Récupérée', short: 'Récupérée', icon: '🎉', next: null },
  { k: 'annulee', label: 'Annulée', short: 'Annulée', icon: '✖️', next: null },
];
export const ST = Object.fromEntries(STATUSES.map((s) => [s.k, s]));

// ---------- Divers ----------
export function debounce(fn, ms = 250) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
export const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

/** Message d'erreur lisible à partir d'une erreur Supabase « NS_CODE: message ». */
export function errMsg(e) {
  const m = String(e?.message || e || 'Erreur inattendue');
  const x = m.match(/NS_[A-Z]+:\s*(.*)$/s);
  if (x) return x[1].trim();
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Connexion impossible. Vérifiez votre connexion internet et réessayez.';
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.';
  return m;
}

/** Redimensionne une image (côté navigateur) et la renvoie en WebP. */
export function resizeImage(file, max = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Ce fichier n’est pas une image'));
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width: w, height: h } = img; const r = Math.min(1, max / Math.max(w, h)); w = Math.round(w * r); h = Math.round(h * r);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('Conversion impossible'))), 'image/webp', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}

/** Fichier .ics pour ajouter le retrait au calendrier. */
export function icsFor(order, shop) {
  const [h, m] = order.pickup_slot.split(':');
  const d = order.pickup_day.replace(/-/g, '');
  const start = `${d}T${h}${m}00Z`;
  const endMin = Number(h) * 60 + Number(m) + 30;
  const end = `${d}T${pad(Math.floor(endMin / 60) % 24)}${pad(endMin % 60)}00Z`;
  const lines = order.items.map((i) => `${i.qty} × ${i.product_name} (${i.format_name})`).join('\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Arret nekh soow//FR', 'BEGIN:VEVENT',
    `UID:${order.number}@nekhsoow`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:Retrait commande ${order.number} – ${shop.shop_name}`,
    `LOCATION:${shop.address}`, `DESCRIPTION:${lines}\\nTotal : ${money(order.total)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Retrait de votre commande', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
export function download(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/** Toast accessible. */
export function toast(text, kind = 'info', ms = 3200) {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`; el.textContent = text; el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
}
