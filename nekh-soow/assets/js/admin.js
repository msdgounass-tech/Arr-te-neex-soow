// Back-office Arrêt nekh soow.
import { getApi, IS_DEMO } from './api.js';
import { CONFIG } from './config.js';
import {
  $, $$, esc, money, store, toast, errMsg, dakarNow, addDays, relDay, fmtDay, fmtSlot, fmtPhone, fmtDateTime, fmtTime,
  timeAgo, weekday, openDays, slotStates, sortSlots, normalizeSlot, normalizePhone, waLink, ST, STATUSES, download, debounce, resizeImage,
} from './util.js';

const A = {
  api: null, cat: null, orders: [], email: '',
  f: { range: 'today', date: '', status: 'actives', q: '' },
  prodDay: null, sound: store.get('ns-adm-sound', true), unsub: null, newIds: new Set(), seen: new Set(),
};
const ACTIVE = ['nouvelle', 'confirmee', 'preparation', 'prete'];
const icon = (id) => `<svg aria-hidden="true"><use href="#a-${id}"/></svg>`;
const today = () => dakarNow().day;
const S = () => A.cat.settings;
const PROMO_SQL_URL = 'https://claude.ai/artifact/GMTEYMGd4udG26pXVqVX5p';
const waveLink = (amount) => { const l = S().wave_link; return l ? `${l}${l.includes('?') ? '&' : '?'}amount=${Math.round(amount)}` : ''; };

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------
async function loadAll() {
  const from = addDays(today(), -60);
  const [cat, orders] = await Promise.all([A.api.adminCatalog(), A.api.listOrders({ from })]);
  A.cat = cat; A.orders = orders;
  orders.forEach((o) => A.seen.add(o.id));
  $('#accepting').checked = S().accepting_orders; updateAcceptLbl();
}
const upsertOrder = (o) => {
  const i = A.orders.findIndex((x) => x.id === o.id);
  if (i >= 0) A.orders[i] = o; else A.orders.push(o);
};
const valid = (o) => o.status !== 'annulee';
const byPick = (a, b) => (a.pickup_day + a.pickup_slot + a.created_at).localeCompare(b.pickup_day + b.pickup_slot + b.created_at);
const firstName = (n) => String(n).trim().split(/\s+/)[0];

// ---------------------------------------------------------------------------
// Notifications : son, notification système, titre de l'onglet
// ---------------------------------------------------------------------------
let audioCtx;
function chime() {
  if (!A.sound) return;
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime;
    [[880, 0], [1318.5, .16], [1760, .32]].forEach(([f, d]) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(.25, t0 + d + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + d + .5);
      o.start(t0 + d); o.stop(t0 + d + .55);
    });
  } catch { /* son indisponible */ }
}
function updateBadges() {
  const n = A.orders.filter((o) => o.status === 'nouvelle').length;
  $$('.nav-badge').forEach((b) => { b.hidden = !n; b.textContent = n; });
  document.title = `${n ? `(${n}) ` : ''}Back-office · Arrêt nekh soow`;
}
function soundBtn() { $('#sound-btn').innerHTML = icon(A.sound ? 'bell' : 'bell-off'); $('#sound-btn').setAttribute('aria-pressed', A.sound); }
async function onNewOrder(o) {
  if (A.seen.has(o.id)) return; A.seen.add(o.id); A.newIds.add(o.id);
  chime();
  toast(`Nouvelle commande ${o.number} · ${firstName(o.customer_name)} · ${money(o.total)}`, 'success', 6000);
  if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    try { new Notification('Nouvelle commande', { body: `${o.customer_name} · ${money(o.total)} · retrait ${relDay(o.pickup_day).toLowerCase()} ${fmtSlot(o.pickup_slot)}`, icon: 'assets/img/icon-192.png', tag: o.id }); } catch { /* ignore */ }
  }
}
function subscribe() {
  A.unsub?.();
  A.unsub = A.api.subscribeOrders(async (type, row) => {
    if (type === 'status') { const on = row === 'SUBSCRIBED'; $('#live').classList.toggle('on', on); $('#live').textContent = on ? 'En direct' : 'Reconnexion…'; return; }
    if (!row?.id) return;
    try {
      const o = row.items ? row : await A.api.getOrder(row.id);
      if (!o) return;
      const isNew = type === 'INSERT' && !A.seen.has(o.id);
      upsertOrder(o);
      if (isNew) await onNewOrder(o);
      updateBadges(); refreshView();
    } catch { /* ignore */ }
  });
}
const refreshView = debounce(() => { if (!$('#modal').hidden) return; render(false); }, 300);

// ---------------------------------------------------------------------------
// Fenêtres modales
// ---------------------------------------------------------------------------
let lastFocus;
function openModal({ title, body, foot = '', wide = false }) {
  const m = $('#modal'); lastFocus = document.activeElement;
  m.innerHTML = `<div class="drawer-head"><h2 id="modal-title">${title}</h2><button class="icon-btn" type="button" data-action="close-modal" aria-label="Fermer">${icon('x')}</button></div>
    <div class="drawer-body">${body}</div>${foot ? `<div class="drawer-foot">${foot}</div>` : ''}`;
  m.style.width = wide ? 'min(760px, calc(100% - 24px))' : '';
  m.hidden = false; $('#ov').hidden = false;
  requestAnimationFrame(() => { m.classList.add('open'); $('#ov').classList.add('open'); ($('input, textarea, select', m) || $('.icon-btn', m)).focus(); });
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  const m = $('#modal'); if (m.hidden) return;
  if (A.askResolve) { const r = A.askResolve; A.askResolve = null; r(false); }
  m.classList.remove('open'); $('#ov').classList.remove('open');
  setTimeout(() => { m.hidden = true; $('#ov').hidden = true; m.innerHTML = ''; }, 250);
  document.body.style.overflow = ''; lastFocus?.focus?.(); A.modalOrder = null; render(false);
}
function ask(message, { ok = 'Confirmer', danger = false } = {}) {
  return new Promise((resolve) => {
    openModal({ title: 'Confirmation', body: `<p>${message}</p>`, foot: `<button class="btn btn-ghost" type="button" data-ask="0">Annuler</button><button class="btn ${danger ? 'btn-red' : ''}" type="button" data-ask="1">${ok}</button>` });
    A.askResolve = resolve;
    const h = (e) => { const b = e.target.closest('[data-ask]'); if (!b) return; $('#modal').removeEventListener('click', h); A.askResolve = null; closeModal(); resolve(b.dataset.ask === '1'); };
    $('#modal').addEventListener('click', h);
  });
}

// ---------------------------------------------------------------------------
// Statistiques communes (tableau de bord, historique, rapport du jour)
// ---------------------------------------------------------------------------
const PAY_LBL = { retrait: 'Au retrait / livraison', especes: 'Espèces', wave: 'Wave', orange_money: 'Orange Money' };
function dayStats(list) {
  const ok = list.filter(valid);
  const ca = ok.reduce((a, o) => a + o.total, 0);
  const paid = ok.filter((o) => o.paid).reduce((a, o) => a + o.total, 0);
  return {
    n: ok.length, ca, paid, due: ca - paid, cancelled: list.length - ok.length,
    items: ok.reduce((a, o) => a + o.items_count, 0), deliveries: ok.filter((o) => o.fulfillment === 'livraison').length,
    fees: ok.reduce((a, o) => a + (o.delivery_fee || 0), 0), avg: ok.length ? Math.round(ca / ok.length) : 0,
    clients: new Set(ok.map((o) => o.phone)).size,
  };
}
const byDay = (list) => list.reduce((m, o) => { (m[o.pickup_day] ||= []).push(o); return m; }, {});
const countUp = (v, fmt = 'n') => `<span data-count="${Math.round(v)}" data-fmt="${fmt}">${fmt === 'm' ? money(0) : 0}</span>`;
function animateCounts(root = document) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-count]', root).forEach((el) => {
    const to = Number(el.dataset.count); const fmt = el.dataset.fmt; const f = (v) => (fmt === 'm' ? money(v) : Math.round(v).toLocaleString('fr-FR'));
    if (reduce || !to) { el.textContent = f(to); return; }
    const t0 = performance.now(); const dur = 900;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = f(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
const delta = (a, b, suffix) => {
  if (!b) return '<div class="delta muted">—</div>';
  const p = Math.round(((a - b) / b) * 100);
  return `<div class="delta ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)} % ${suffix}</div>`;
};
function barChart(days, vals, { clickable = true, H = 200 } = {}) {
  const t = today(); const max = Math.max(1, ...vals); const W = 700; const bw = W / days.length;
  const every = Math.ceil(days.length / 10);
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 24}" role="img" aria-label="Chiffre d'affaires par jour">
    ${[0.25, 0.5, 0.75, 1].map((r) => `<line class="grid-l" x1="0" x2="${W}" y1="${H - r * (H - 20)}" y2="${H - r * (H - 20)}"/>`).join('')}
    <text x="0" y="12" class="axis">${money(max)}</text>
    ${vals.map((v, i) => { const h = Math.max(v ? 3 : 1, (v / max) * (H - 20)); return `<g class="bar-g ${clickable ? 'clk' : ''}" ${clickable ? `data-action="open-day" data-d="${days[i]}" tabindex="0" role="button" aria-label="${fmtDay(days[i])} : ${money(v)}"` : ''}>
      <rect class="bar-hit" x="${i * bw}" y="0" width="${bw}" height="${H}" fill="transparent"/>
      <rect class="bar-r ${days[i] === t ? 'today' : ''}" style="animation-delay:${i * 25}ms" x="${i * bw + bw * 0.14}" y="${H - h}" width="${bw * 0.72}" height="${h}" rx="${Math.min(5, bw * 0.2)}"><title>${fmtDay(days[i])} : ${money(v)}</title></rect></g>`; }).join('')}
    ${days.map((k, i) => (i % every === (days.length - 1) % every ? `<text x="${i * bw + bw / 2}" y="${H + 18}" text-anchor="middle">${fmtDay(k, { day: 'numeric', month: 'short' })}</text>` : '')).join('')}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Tableau de bord
// ---------------------------------------------------------------------------
function pageDashboard() {
  const t = today(); const P = A.period || 14;
  const inRange = (o, a, b) => o.pickup_day >= a && o.pickup_day <= b;
  const from = addDays(t, -(P - 1)); const pFrom = addDays(from, -P); const pTo = addDays(from, -1);
  const cur = A.orders.filter((o) => inRange(o, from, t)); const prev = A.orders.filter((o) => inRange(o, pFrom, pTo));
  const sc = dayStats(cur); const sp = dayStats(prev);
  const tod = dayStats(A.orders.filter((o) => o.pickup_day === t)); const yes = dayStats(A.orders.filter((o) => o.pickup_day === addDays(t, -1)));
  const news = A.orders.filter((o) => o.status === 'nouvelle').sort(byPick);
  const toPrep = A.orders.filter((o) => o.pickup_day >= t && ['nouvelle', 'confirmee', 'preparation'].includes(o.status));
  const days = Array.from({ length: P }, (_, i) => addDays(from, i)); const bd = byDay(cur);
  const vals = days.map((k) => dayStats(bd[k] || []).ca);
  const top = {}; cur.filter(valid).forEach((o) => o.items.forEach((i) => { const r = (top[i.product_name] ||= { q: 0, ca: 0 }); r.q += i.qty; r.ca += i.qty * i.unit_price; }));
  const topArr = Object.entries(top).sort((a, b) => b[1].ca - a[1].ca).slice(0, 6); const topMax = topArr[0]?.[1].ca || 1;
  const pays = {}; cur.filter(valid).forEach((o) => { pays[o.payment_method] = (pays[o.payment_method] || 0) + o.total; });
  const stToday = STATUSES.map((s) => ({ ...s, n: A.orders.filter((o) => o.pickup_day === t && o.status === s.k).length })).filter((s) => s.n);
  const colors = { nouvelle: '#2f6fd6', confirmee: '#1b3f8b', preparation: '#d9951f', prete: '#1f8a5b', recuperee: '#9aa1b5', annulee: '#c23a2e' };
  const tot = stToday.reduce((a, s) => a + s.n, 0); let acc = 0;
  const donut = tot ? `<svg viewBox="0 0 42 42" width="140" height="140" aria-hidden="true" class="donut">${stToday.map((s) => { const v = (s.n / tot) * 100; const el = `<circle r="15.915" cx="21" cy="21" fill="none" stroke="${colors[s.k]}" stroke-width="6" stroke-dasharray="${v} ${100 - v}" stroke-dashoffset="${25 - acc}"/>`; acc += v; return el; }).join('')}
    <text x="21" y="23.5" text-anchor="middle" font-size="8" font-weight="800" fill="#0e1b3d">${tot}</text></svg>` : '';
  const upcoming = A.orders.filter((o) => o.pickup_day >= t && ACTIVE.includes(o.status)).sort(byPick).slice(0, 7);
  const best = days.reduce((b, k, i) => (vals[i] > (b.v || 0) ? { k, v: vals[i] } : b), {});
  return `
  ${news.length ? `<a class="panel mb alert-new" href="#/commandes" data-action="filter-new">
     <span class="bell-ring">${icon('bell')}</span><div style="flex:1"><b>${news.length} nouvelle${news.length > 1 ? 's' : ''} commande${news.length > 1 ? 's' : ''} à confirmer</b><div class="muted" style="font-size:14px">La plus ancienne : ${esc(news[0].customer_name)}, ${news[0].fulfillment === 'livraison' ? 'livraison' : 'retrait'} ${relDay(news[0].pickup_day).toLowerCase()} à ${fmtSlot(news[0].pickup_slot)}</div></div>${icon('arrow')}</a>` : ''}
  <div class="panel mb today-strip stagger">
    <div><span class="lbl">Aujourd’hui</span><b>${countUp(tod.ca, 'm')}</b>${delta(tod.ca, yes.ca, 'vs hier')}</div>
    <div><span class="lbl">Commandes</span><b>${countUp(tod.n)}</b>${delta(tod.n, yes.n, 'vs hier')}</div>
    <div><span class="lbl">À préparer</span><b>${countUp(toPrep.length)}</b><div class="delta muted">aujourd’hui et à venir</div></div>
    <div><span class="lbl">Reste à encaisser</span><b>${countUp(tod.due, 'm')}</b><div class="delta muted">sur les commandes du jour</div></div>
    <button class="btn btn-sm btn-light" type="button" data-action="open-day" data-d="${t}">Voir le détail du jour ${icon('arrow')}</button>
  </div>
  <div class="toolbar"><h2 style="font-size:18px" class="grow">Période</h2>
    <div class="seg" role="group" aria-label="Période">${[[7, '7 jours'], [14, '14 jours'], [30, '30 jours'], [60, '60 jours']].map(([k, l]) => `<button type="button" data-action="period" data-p="${k}" aria-pressed="${P === k}">${l}</button>`).join('')}</div></div>
  <div class="grid g4 mb stagger">
    <div class="panel kpi"><div class="ic g">${icon('cash')}</div><div class="lbl">Chiffre d’affaires</div><div class="val">${countUp(sc.ca, 'm')}</div>${delta(sc.ca, sp.ca, `vs ${P} j préc.`)}</div>
    <div class="panel kpi"><div class="ic">${icon('box')}</div><div class="lbl">Commandes</div><div class="val">${countUp(sc.n)}</div>${delta(sc.n, sp.n, `vs ${P} j préc.`)}</div>
    <div class="panel kpi"><div class="ic r">${icon('cart')}</div><div class="lbl">Panier moyen</div><div class="val">${countUp(sc.avg, 'm')}</div>${delta(sc.avg, sp.avg, `vs ${P} j préc.`)}</div>
    <div class="panel kpi"><div class="ic o">${icon('users')}</div><div class="lbl">Clients différents</div><div class="val">${countUp(sc.clients)}</div><div class="delta muted">${sc.deliveries} livraison${sc.deliveries > 1 ? 's' : ''} · ${money(sc.fees)} de frais</div></div>
  </div>
  ${visitsPanel()}
  <div class="grid g-main mb">
    <div class="panel"><div class="panel-head"><div><h2>Chiffre d’affaires par jour</h2><p>Touchez une barre pour vérifier les ventes de la journée${best.k ? ` · meilleur jour : ${fmtDay(best.k, { weekday: 'short', day: 'numeric', month: 'short' })} (${money(best.v)})` : ''}</p></div><a class="link" href="#/historique">Historique ${icon('arrow')}</a></div>${barChart(days, vals)}
      <div class="money-split"><div><span class="dot g"></span>Encaissé <b>${money(sc.paid)}</b></div><div><span class="dot o"></span>À encaisser <b>${money(sc.due)}</b></div><div><span class="dot r"></span>Annulées <b>${sc.cancelled}</b></div></div>
      <div class="meter big"><i style="width:${sc.ca ? (sc.paid / sc.ca) * 100 : 0}%"></i></div></div>
    <div class="panel"><div class="panel-head"><h2>Prochains retraits & livraisons</h2><a class="link" href="#/commandes">Tout voir</a></div>
      <div class="upcoming stagger">${upcoming.map((o) => `<a class="up-row" href="#/commandes" data-action="open-order" data-id="${o.id}"><span class="t">${fmtSlot(o.pickup_slot)}</span><div><b>${o.fulfillment === 'livraison' ? icon('scooter') : ''}${esc(o.customer_name)}</b><small>${o.pickup_day === t ? '' : relDay(o.pickup_day) + ' · '}${o.items.map((i) => `${i.qty}× ${esc(i.product_name)}`).join(', ')}</small></div><span class="badge st-${o.status}">${ST[o.status].label}</span></a>`).join('') || `<div class="empty"><div class="big">${icon('cup')}</div><p>Aucun retrait prévu.</p></div>`}</div>
    </div>
  </div>
  <div class="grid g3">
    <div class="panel"><div class="panel-head"><h2>Meilleures ventes</h2><p>${P} jours</p></div>
      <div class="ranks">${topArr.map(([n, r], i) => `<div class="rank"><div class="top"><span>${i + 1}. ${esc(n)}</span><b>${money(r.ca)}</b></div><div class="meter"><i style="width:${(r.ca / topMax) * 100}%;animation-delay:${i * 80}ms"></i></div><small class="muted">${r.q} vendus</small></div>`).join('') || '<p class="muted">Pas encore de ventes.</p>'}</div></div>
    <div class="panel"><div class="panel-head"><h2>Moyens de paiement</h2><p>${P} jours</p></div>
      <div class="ranks">${Object.entries(pays).sort((a, b) => b[1] - a[1]).map(([k, v], i) => `<div class="rank"><div class="top"><span>${PAY_LBL[k] || k}</span><b>${money(v)}</b></div><div class="meter pay"><i style="width:${sc.ca ? (v / sc.ca) * 100 : 0}%;animation-delay:${i * 80}ms"></i></div></div>`).join('') || '<p class="muted">—</p>'}</div></div>
    <div class="panel"><div class="panel-head"><h2>Aujourd’hui par statut</h2></div>
      ${tot ? `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">${donut}<div class="donut-legend" style="flex:1;min-width:140px">${stToday.map((s) => `<div><i style="background:${colors[s.k]}"></i>${s.label}<b>${s.n}</b></div>`).join('')}</div></div>` : '<p class="muted">Aucune commande aujourd’hui pour l’instant.</p>'}</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Historique : vérification des journées passées
// ---------------------------------------------------------------------------
async function ensureHistory(from) {
  if (A.histFrom && A.histFrom <= from) return;
  const extra = await A.api.listOrders({ from, to: addDays(today(), -61) });
  extra.forEach((o) => { if (!A.orders.find((x) => x.id === o.id)) A.orders.push(o); });
  A.histFrom = from;
}
function histRange() {
  const t = today(); const r = A.hr || '30';
  if (r === 'custom') return [A.hFrom || addDays(t, -30), A.hTo || t];
  return [addDays(t, -(Number(r) - 1)), t];
}
function pageHistory() {
  const [from, to] = histRange();
  if (from < addDays(today(), -60) && !(A.histFrom && A.histFrom <= from)) {
    ensureHistory(from).then(() => render(false)).catch((e) => toast(errMsg(e), 'error'));
    return '<div class="spinner"></div>';
  }
  const list = A.orders.filter((o) => o.pickup_day >= from && o.pickup_day <= to); const bd = byDay(list);
  const days = []; for (let d = to; d >= from; d = addDays(d, -1)) days.push(d);
  const rows = days.map((d) => ({ d, ...dayStats(bd[d] || []) })); const T = dayStats(list);
  const maxCa = Math.max(1, ...rows.map((r) => r.ca));
  return `<div class="toolbar">
      <div class="seg" role="group" aria-label="Période">${[['7', '7 jours'], ['30', '30 jours'], ['90', '90 jours'], ['365', '1 an'], ['custom', 'Dates…']].map(([k, l]) => `<button type="button" data-action="hist-range" data-r="${k}" aria-pressed="${(A.hr || '30') === k}">${l}</button>`).join('')}</div>
      ${(A.hr || '30') === 'custom' ? `<label class="muted">Du <input type="date" data-action="h-from" value="${from}"></label><label class="muted">au <input type="date" data-action="h-to" value="${to}"></label>` : ''}
      <span class="grow"></span>
      <button class="btn btn-sm btn-light" type="button" data-action="hist-csv">${icon('dl')} Export CSV</button>
      <button class="btn btn-sm btn-light" type="button" data-action="print">${icon('print')} Imprimer</button>
    </div>
    <div class="print-only"><h2>Historique des ventes · ${fmtDay(from)} → ${fmtDay(to)}</h2></div>
    <div class="grid g4 mb stagger">
      <div class="panel kpi"><div class="lbl">Chiffre d’affaires</div><div class="val">${countUp(T.ca, 'm')}</div><div class="delta muted">${T.n} commandes · ${T.items} articles</div></div>
      <div class="panel kpi"><div class="lbl">Encaissé</div><div class="val" style="color:var(--green)">${countUp(T.paid, 'm')}</div><div class="delta muted">${T.ca ? Math.round((T.paid / T.ca) * 100) : 0} % du CA</div></div>
      <div class="panel kpi"><div class="lbl">Reste à encaisser</div><div class="val" style="color:${T.due ? '#9a5b00' : 'inherit'}">${countUp(T.due, 'm')}</div><div class="delta muted">commandes non marquées payées</div></div>
      <div class="panel kpi"><div class="lbl">Moyenne par jour</div><div class="val">${countUp(rows.length ? T.ca / rows.length : 0, 'm')}</div><div class="delta muted">${T.cancelled} annulée${T.cancelled > 1 ? 's' : ''} · ${T.deliveries} livraisons</div></div>
    </div>
    <div class="panel"><div class="panel-head"><div><h2>Journée par journée</h2><p>Touchez une journée pour vérifier chaque vente</p></div></div>
      <div class="table-wrap"><table class="t days"><thead><tr><th>Jour</th><th class="n">Commandes</th><th class="n">Articles</th><th>Chiffre d’affaires</th><th class="n">Encaissé</th><th class="n">À encaisser</th><th class="n">Annulées</th><th></th></tr></thead>
      <tbody>${rows.map((r, i) => `<tr class="${r.n ? 'clk' : 'empty-day'}" ${r.n || r.cancelled ? `data-action="open-day" data-d="${r.d}" tabindex="0"` : ''} style="animation-delay:${Math.min(i, 20) * 20}ms">
        <td><b>${relDay(r.d)}</b><br><small class="muted">${fmtDay(r.d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</small></td>
        <td class="n">${r.n || '<span class="muted">0</span>'}</td><td class="n">${r.items || ''}</td>
        <td><div class="cell-bar"><span>${r.ca ? money(r.ca) : '<span class="muted">—</span>'}</span><i style="width:${(r.ca / maxCa) * 100}%"></i></div></td>
        <td class="n" style="color:var(--green)">${r.paid ? money(r.paid) : ''}</td><td class="n" style="color:#9a5b00">${r.due ? money(r.due) : ''}</td>
        <td class="n">${r.cancelled || ''}</td><td>${r.n || r.cancelled ? icon('arrow') : ''}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td class="n">${T.n}</td><td class="n">${T.items}</td><td>${money(T.ca)}</td><td class="n">${money(T.paid)}</td><td class="n">${money(T.due)}</td><td class="n">${T.cancelled}</td><td></td></tr></tfoot></table></div></div>`;
}
function histCsv() {
  const [from, to] = histRange(); const bd = byDay(A.orders.filter((o) => o.pickup_day >= from && o.pickup_day <= to));
  const rows = [['Jour', 'Commandes', 'Articles', 'Chiffre d’affaires (FCFA)', 'Encaissé', 'À encaisser', 'Annulées', 'Livraisons', 'Frais de livraison']];
  for (let d = to; d >= from; d = addDays(d, -1)) { const s = dayStats(bd[d] || []); rows.push([d, s.n, s.items, s.ca, s.paid, s.due, s.cancelled, s.deliveries, s.fees]); }
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  download(`ventes-${from}-au-${to}.csv`, csv, 'text/csv;charset=utf-8'); toast('Historique exporté', 'success');
}

// Rapport détaillé d'une journée : chaque vente est vérifiable
function openDay(d) {
  const list = A.orders.filter((o) => o.pickup_day === d).sort(byPick); const s = dayStats(list);
  const prods = {}; list.filter(valid).forEach((o) => o.items.forEach((i) => { const k = `${i.product_name} (${i.format_name})`; const r = (prods[k] ||= { q: 0, ca: 0 }); r.q += i.qty; r.ca += i.qty * i.unit_price; }));
  const pays = {}; list.filter(valid).forEach((o) => { const k = o.paid ? (PAY_LBL[o.payment_method] || o.payment_method) : 'Non encaissé'; pays[k] = (pays[k] || 0) + o.total; });
  A.modalDay = d;
  openModal({
    title: `${relDay(d)} · ${fmtDay(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`, wide: true,
    body: `<div class="grid g4 mb day-kpis">
        <div class="mini"><span>Chiffre d’affaires</span><b>${countUp(s.ca, 'm')}</b></div>
        <div class="mini"><span>Commandes</span><b>${countUp(s.n)}</b></div>
        <div class="mini"><span>Encaissé</span><b style="color:var(--green)">${countUp(s.paid, 'm')}</b></div>
        <div class="mini"><span>À encaisser</span><b style="color:#9a5b00">${countUp(s.due, 'm')}</b></div></div>
      <p class="muted mb" style="font-size:13.5px">${s.items} articles · panier moyen ${money(s.avg)} · ${s.deliveries} livraison(s) (${money(s.fees)} de frais) · ${s.cancelled} annulée(s), non comptée(s)</p>
      <div class="grid g2 mb">
        <div><h3 class="h3">Par produit</h3><table class="t"><tbody>${Object.entries(prods).sort((a, b) => b[1].ca - a[1].ca).map(([k, r]) => `<tr><td>${esc(k)}</td><td class="n">${r.q}</td><td class="n">${money(r.ca)}</td></tr>`).join('') || '<tr><td class="muted">—</td></tr>'}</tbody></table></div>
        <div><h3 class="h3">Par encaissement</h3><table class="t"><tbody>${Object.entries(pays).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${money(v)}</td></tr>`).join('') || '<tr><td class="muted">—</td></tr>'}</tbody></table></div>
      </div>
      <h3 class="h3">Toutes les ventes de la journée</h3>
      <div class="table-wrap"><table class="t"><thead><tr><th>Heure</th><th>N°</th><th>Client</th><th>Articles</th><th class="n">Total</th><th>Paiement</th><th>Statut</th></tr></thead><tbody>
        ${list.map((o) => `<tr class="clk ${o.status === 'annulee' ? 'cancel' : ''}" data-action="open-order" data-id="${o.id}"><td><b>${fmtSlot(o.pickup_slot)}</b>${o.fulfillment === 'livraison' ? `<br><span class="mini-ic">${icon('scooter')}</span>` : ''}</td><td><small>${esc(o.number)}</small></td><td>${esc(o.customer_name)}<br><small class="muted">${esc(fmtPhone(o.phone))}</small></td>
          <td><small>${o.items.map((i) => `${i.qty}× ${esc(i.product_name)}`).join(', ')}</small></td><td class="n"><b>${money(o.total)}</b></td>
          <td>${o.paid ? `<span class="paid">${icon('check')} ${PAY_LBL[o.payment_method] || ''}</span>` : '<span class="muted">À encaisser</span>'}${o.payment_ref ? `<br><small>Réf. ${esc(o.payment_ref)}</small>` : ''}</td><td><span class="badge st-${o.status}">${ST[o.status].label}</span></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Aucune commande ce jour-là.</td></tr>'}
      </tbody><tfoot><tr><td colspan="4">Total (hors annulées)</td><td class="n">${money(s.ca)}</td><td colspan="2"></td></tr></tfoot></table></div>`,
    foot: `<button class="btn btn-light btn-sm" type="button" data-action="day-csv" data-d="${d}">${icon('dl')} CSV du jour</button><button class="btn btn-sm" type="button" data-action="close-modal">Fermer</button>`,
  });
  animateCounts($('#modal'));
}
function dayCsv(d) {
  const list = A.orders.filter((o) => o.pickup_day === d).sort(byPick);
  const rows = [['Numéro', 'Heure', 'Mode', 'Client', 'Téléphone', 'Articles', 'Total', 'Statut', 'Payé', 'Paiement', 'Référence']];
  list.forEach((o) => rows.push([o.number, o.pickup_slot, o.fulfillment, o.customer_name, fmtPhone(o.phone), o.items.map((i) => `${i.qty} x ${i.product_name} (${i.format_name})`).join(' | '), o.total, ST[o.status].label, o.paid ? 'oui' : 'non', o.payment_method, o.payment_ref || '']));
  download(`ventes-${d}.csv`, '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
}

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------
function filteredOrders() {
  const t = today(); const f = A.f; const q = f.q.trim().toLowerCase();
  return A.orders.filter((o) => {
    if (f.range === 'today' && o.pickup_day !== t) return false;
    if (f.range === 'tomorrow' && o.pickup_day !== addDays(t, 1)) return false;
    if (f.range === 'week' && (o.pickup_day < t || o.pickup_day > addDays(t, 6))) return false;
    if (f.range === 'upcoming' && o.pickup_day < t) return false;
    if (f.range === 'past' && o.pickup_day >= t) return false;
    if (f.range === 'date' && o.pickup_day !== f.date) return false;
    if (q && ![o.number, o.customer_name, o.phone, fmtPhone(o.phone)].join(' ').toLowerCase().includes(q)) return false;
    return true;
  });
}
function statusFilter(list) {
  const f = A.f.status;
  if (f === 'actives') return list.filter((o) => ACTIVE.includes(o.status));
  if (f === 'toutes') return list;
  return list.filter((o) => o.status === f);
}
function waMessage(o) {
  const s = S(); const fn = firstName(o.customer_name); const when = `${relDay(o.pickup_day).toLowerCase()} à ${fmtSlot(o.pickup_slot)}`;
  const m = {
    nouvelle: `Bonjour ${fn}, nous avons bien reçu votre commande ${o.number} (${money(o.total)}). Retrait ${when}. Merci !`,
    confirmee: o.fulfillment === 'livraison' ? `Bonjour ${fn}, votre commande ${o.number} est confirmée. Livraison ${when} à ${o.delivery_address}.${o.payment_method === 'wave' && !o.paid ? ` Paiement Wave : ${waveLink(o.total)}` : ''}` : `Bonjour ${fn}, votre commande ${o.number} est confirmée. Retrait ${when} à ${s.address}.${o.payment_method === 'wave' && !o.paid ? ` Paiement Wave : ${waveLink(o.total)}` : ''} À tout à l’heure !`,
    preparation: `Bonjour ${fn}, votre commande ${o.number} est en cours de préparation. Elle sera prête pour ${fmtSlot(o.pickup_slot)}.`,
    prete: o.fulfillment === 'livraison' ? `Bonne nouvelle ${fn} ! Votre commande ${o.number} est en route vers ${o.delivery_address}. Le livreur vous appelle à l’arrivée. Total : ${money(o.total)}${o.paid ? ' (déjà payé)' : ''}.` : `Bonne nouvelle ${fn} ! Votre commande ${o.number} est prête. Vous pouvez passer la récupérer (${s.address}). Total à régler : ${money(o.total)}. Merci !`,
    recuperee: `Merci ${fn} pour votre commande ! Bonne dégustation et à très bientôt chez ${s.shop_name}.`,
    annulee: `Bonjour ${fn}, votre commande ${o.number} a été annulée. N’hésitez pas à nous écrire pour toute question.`,
  };
  return m[o.status];
}
function orderCard(o) {
  const st = ST[o.status]; const nx = st.next && ST[st.next];
  return `<article class="order s-${o.status} ${A.newIds.has(o.id) ? 'flash' : ''}" data-id="${o.id}">
    <div class="hd"><div><div class="num">${esc(o.number)} · ${timeAgo(o.created_at)}</div><div class="who">${esc(o.customer_name)}</div>
      <a class="tel" href="tel:+221${esc(o.phone)}">${icon('phone')}${esc(fmtPhone(o.phone))}</a></div>
      <span class="badge st-${o.status}">${icon(st.icon)} ${st.label}</span></div>
    <ul>${o.items.map((i) => `<li><span><b>${i.qty}×</b> ${esc(i.product_name)} <span class="muted">(${esc(i.format_name)})</span></span><span>${money(i.unit_price * i.qty)}</span></li>`).join('')}${o.discount ? `<li class="promo-line"><span>Code ${esc(o.promo_code)}</span><span>-${money(o.discount)}</span></li>` : ''}${o.delivery_fee ? `<li class="muted"><span>Livraison</span><span>${money(o.delivery_fee)}</span></li>` : ''}</ul>
    ${o.fulfillment === 'livraison' ? `<a class="deliv" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.delivery_address + ', Thiès, Sénégal')}" target="_blank" rel="noopener">${icon('scooter')}<span><b>Livraison · ${esc(o.delivery_zone)}</b><br>${esc(o.delivery_address)}</span></a>` : ''}
    ${o.note ? `<div class="note">${icon('note')}<span>${esc(o.note)}</span></div>` : ''}
    ${o.admin_note ? `<div class="note" style="background:#eef3ff;color:var(--navy)">${icon('lock')}<span>${esc(o.admin_note)}</span></div>` : ''}
    <div class="ft"><div><div class="total">${money(o.total)}</div><div class="meta">${o.paid ? `<span class="paid">${icon('check')} Payé</span>` : 'À encaisser'} · ${{ retrait: 'au retrait', wave: 'Wave', orange_money: 'Orange Money', especes: 'espèces' }[o.payment_method] || ''}</div></div>
      <div class="acts">
        <a class="btn btn-xs btn-wa" href="${waLink(o.phone, waMessage(o))}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(o.customer_name)}">${icon('wa')}${o.status === 'prete' ? 'Prévenir' : ''}</a>
        <button class="btn btn-xs btn-light" type="button" data-action="open-order" data-id="${o.id}">Détail</button>
        ${nx ? `<button class="btn btn-xs ${st.next === 'prete' ? 'btn-green' : ''}" type="button" data-action="next-status" data-id="${o.id}">${st.action}</button>` : ''}
      </div></div>
  </article>`;
}
function pageOrders() {
  const base = filteredOrders(); const list = statusFilter(base).sort(byPick);
  const counts = { actives: base.filter((o) => ACTIVE.includes(o.status)).length, toutes: base.length };
  STATUSES.forEach((s) => { counts[s.k] = base.filter((o) => o.status === s.k).length; });
  const ranges = [['today', 'Aujourd’hui'], ['tomorrow', 'Demain'], ['week', '7 jours'], ['upcoming', 'À venir'], ['past', 'Historique']];
  const groups = {}; list.forEach((o) => { const k = `${o.pickup_day} ${o.pickup_slot}`; (groups[k] ||= []).push(o); });
  const cap = S().slot_capacity;
  const showDay = !['today', 'tomorrow', 'date'].includes(A.f.range);
  const total = list.filter(valid).reduce((a, o) => a + o.total, 0);
  return `<div class="toolbar">
      <div class="seg" role="group" aria-label="Période">${ranges.map(([k, l]) => `<button type="button" data-action="range" data-r="${k}" aria-pressed="${A.f.range === k}">${l}</button>`).join('')}</div>
      <input type="date" aria-label="Choisir une date" value="${A.f.range === 'date' ? A.f.date : ''}" data-action="date">
      <label class="search grow">${icon('search')}<input class="input" type="search" placeholder="Rechercher : nom, téléphone, n°" value="${esc(A.f.q)}" data-action="search" aria-label="Rechercher une commande"></label>
      <button class="btn btn-sm btn-light" type="button" data-action="export">${icon('dl')} Export CSV</button>
      <button class="btn btn-sm btn-light" type="button" data-action="print">${icon('print')} Imprimer</button>
    </div>
    <div class="chips scroll mb" role="group" aria-label="Statut">
      ${[['actives', 'En cours'], ...STATUSES.map((s) => [s.k, s.label]), ['toutes', 'Toutes']].map(([k, l]) => `<button class="chip" type="button" data-action="status-filter" data-s="${k}" aria-pressed="${A.f.status === k}">${l}<span class="count">${counts[k]}</span></button>`).join('')}
    </div>
    <p class="muted mb" style="font-size:14px">${list.length} commande${list.length > 1 ? 's' : ''} · ${money(total)}</p>
    ${Object.keys(groups).length ? Object.entries(groups).map(([k, arr]) => {
      const [d, s] = k.split(' '); const booked = A.orders.filter((o) => o.pickup_day === d && o.pickup_slot === s && valid(o)).length;
      return `<section class="slot-group"><h3><span class="time">${fmtSlot(s)}</span>${showDay ? `<span>${relDay(d)}</span>` : ''}<span class="cap">${booked}/${cap} places</span></h3><div class="orders">${arr.map(orderCard).join('')}</div></section>`;
    }).join('') : `<div class="panel empty"><div class="big">${icon('inbox')}</div><h3>Aucune commande</h3><p>Rien ne correspond à ces filtres.</p></div>`}`;
}

function orderDetail(o) {
  const st = ST[o.status]; const closed = ['recuperee', 'annulee'].includes(o.status);
  const flow = STATUSES.filter((s) => s.k !== 'annulee');
  return {
    title: `Commande ${esc(o.number)}`,
    body: `<div class="st-flow" role="group" aria-label="Statut">${flow.map((s) => `<button type="button" data-action="set-status" data-id="${o.id}" data-s="${s.k}" aria-pressed="${o.status === s.k}" ${closed && o.status !== s.k ? 'disabled' : ''}>${icon(s.icon)} ${s.label}</button>`).join('')}</div>
      <dl class="kv">
        <dt>Client</dt><dd>${esc(o.customer_name)}</dd>
        <dt>Téléphone</dt><dd><a href="tel:+221${esc(o.phone)}">${esc(fmtPhone(o.phone))}</a> · <a href="${waLink(o.phone, waMessage(o))}" target="_blank" rel="noopener">WhatsApp</a></dd>
        <dt>${o.fulfillment === 'livraison' ? 'Livraison' : 'Retrait'}</dt><dd>${relDay(o.pickup_day)} · ${fmtDay(o.pickup_day)} à ${fmtSlot(o.pickup_slot)}</dd>
        ${o.fulfillment === 'livraison' ? `<dt>Adresse</dt><dd>${esc(o.delivery_address)} <span class="muted">(${esc(o.delivery_zone)}, ${money(o.delivery_fee)})</span> · <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.delivery_address + ', Thiès, Sénégal')}" target="_blank" rel="noopener">Carte</a></dd>` : ''}
        <dt>Passée</dt><dd>${fmtDateTime(o.created_at)}</dd>
        <dt>Statut</dt><dd><span class="badge st-${o.status}">${icon(st.icon)} ${st.label}</span></dd>
      </dl>
      <div class="table-wrap mb"><table class="t"><thead><tr><th>Article</th><th class="n">Qté</th><th class="n">P.U.</th><th class="n">Total</th></tr></thead><tbody>
        ${o.items.map((i) => `<tr><td>${esc(i.product_name)} <span class="muted">(${esc(i.format_name)})</span></td><td class="n">${i.qty}</td><td class="n">${money(i.unit_price)}</td><td class="n">${money(i.unit_price * i.qty)}</td></tr>`).join('')}
      ${o.discount ? `<tr class="promo-line"><td>Code promo ${esc(o.promo_code)}</td><td class="n"></td><td class="n"></td><td class="n">-${money(o.discount)}</td></tr>` : ''}
      ${o.delivery_fee ? `<tr><td>Livraison (${esc(o.delivery_zone)})</td><td class="n"></td><td class="n"></td><td class="n">${money(o.delivery_fee)}</td></tr>` : ''}</tbody><tfoot><tr><td colspan="3">Total</td><td class="n">${money(o.total)}</td></tr></tfoot></table></div>
      ${o.note ? `<div class="note mb" style="background:var(--amber-s);padding:10px 12px;border-radius:10px">Note du client : ${esc(o.note)}</div>` : ''}
      <div class="grid g2 mb">
        <label class="field" style="margin:0"><span>Moyen de paiement</span><select data-action="pay-method" data-id="${o.id}">${[['retrait', 'Au retrait'], ['especes', 'Espèces'], ['wave', 'Wave'], ['orange_money', 'Orange Money']].map(([k, l]) => `<option value="${k}" ${o.payment_method === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <div class="field" style="margin:0;align-content:end"><label class="switch"><input type="checkbox" data-action="paid" data-id="${o.id}" ${o.paid ? 'checked' : ''}> Paiement encaissé</label></div>
      </div>
      <label class="field"><span>Référence de paiement <small>(n° de transaction Wave / Orange Money)</small></span><input id="pay-ref" maxlength="100" value="${esc(o.payment_ref || '')}" placeholder="Ex : T_ABC123…"></label>
      <label class="field"><span>Note interne <small>(invisible pour le client)</small></span><textarea id="admin-note" maxlength="1000">${esc(o.admin_note || '')}</textarea></label>
      <button class="btn btn-sm btn-light mb" type="button" data-action="save-note" data-id="${o.id}">Enregistrer</button>
      <h3 style="font-size:15px;margin:6px 0 8px">Historique</h3>
      <ul class="hist">${(o.history || []).slice().sort((a, b) => (a.changed_at || '').localeCompare(b.changed_at || '')).map((h) => `<li><span class="badge st-${h.status}">${ST[h.status].label}</span><small>${fmtDateTime(h.changed_at)}</small></li>`).join('')}</ul>
      <div id="ticket" class="print-only"><h2>${esc(S().shop_name)}</h2><p><b>${esc(o.number)}</b> · ${fmtSlot(o.pickup_slot)} ${fmtDay(o.pickup_day)}</p><p>${esc(o.customer_name)} · ${esc(fmtPhone(o.phone))}</p><ul>${o.items.map((i) => `<li>${i.qty} × ${esc(i.product_name)} (${esc(i.format_name)})</li>`).join('')}</ul>${o.note ? `<p>Note : ${esc(o.note)}</p>` : ''}<p><b>Total : ${money(o.total)}</b> ${o.paid ? '(payé)' : ''}</p></div>`,
    foot: `${closed ? '' : `<button class="btn btn-ghost btn-sm" type="button" data-action="cancel" data-id="${o.id}" style="margin-right:auto;color:var(--red)">Annuler la commande</button>`}
      <button class="btn btn-light btn-sm" type="button" data-action="print-ticket">${icon('print')} Ticket</button>
      <a class="btn btn-wa btn-sm" href="${waLink(o.phone, waMessage(o))}" target="_blank" rel="noopener">${icon('wa')} WhatsApp</a>`,
    wide: true,
  };
}
function openOrder(id) { const o = A.orders.find((x) => x.id === id); if (!o) return; A.modalOrder = id; A.newIds.delete(id); openModal(orderDetail(o)); }
function refreshOrderModal() {
  if (!A.modalOrder || $('#modal').hidden) return;
  const o = A.orders.find((x) => x.id === A.modalOrder); const d = orderDetail(o);
  $('#modal-title').innerHTML = d.title; $('#modal .drawer-body').innerHTML = d.body; $('#modal .drawer-foot').innerHTML = d.foot;
}
async function patchOrder(id, patch, msg) {
  try {
    const o = await A.api.updateOrder(id, patch); upsertOrder(o); updateBadges();
    if (msg) toast(msg, 'success', 2200);
    if (A.modalOrder) refreshOrderModal(); else render(false);
    return o;
  } catch (e) { toast(errMsg(e), 'error'); return null; }
}
function exportCsv() {
  const list = statusFilter(filteredOrders()).sort(byPick);
  const rows = [['Numéro', 'Passée le', 'Jour de retrait', 'Heure', 'Client', 'Téléphone', 'Articles', 'Total (FCFA)', 'Statut', 'Payé', 'Paiement', 'Note client', 'Note interne']];
  list.forEach((o) => rows.push([o.number, fmtDateTime(o.created_at), o.pickup_day, o.pickup_slot, o.customer_name, fmtPhone(o.phone),
    o.items.map((i) => `${i.qty} x ${i.product_name} (${i.format_name})`).join(' | '), o.total, ST[o.status].label, o.paid ? 'oui' : 'non', o.payment_method, o.note, o.admin_note]));
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
  download(`commandes-${today()}.csv`, csv, 'text/csv;charset=utf-8'); toast(`${list.length} commandes exportées`, 'success');
}

// ---------------------------------------------------------------------------
// Production (ce qu'il faut préparer)
// ---------------------------------------------------------------------------
function pageProduction() {
  const t = today(); const d = A.prodDay || t;
  const list = A.orders.filter((o) => o.pickup_day === d && valid(o));
  const todo = list.filter((o) => o.status !== 'recuperee');
  const slots = sortSlots([...new Set(list.map((o) => o.pickup_slot))]);
  const rows = {};
  list.forEach((o) => o.items.forEach((i) => {
    const k = `${i.product_name}|${i.format_name}`;
    rows[k] ||= { p: i.product_name, f: i.format_name, total: 0, left: 0, by: {} };
    rows[k].total += i.qty; rows[k].by[o.pickup_slot] = (rows[k].by[o.pickup_slot] || 0) + i.qty;
    if (o.status !== 'recuperee') rows[k].left += i.qty;
  }));
  const arr = Object.values(rows).sort((a, b) => a.p.localeCompare(b.p) || a.f.localeCompare(b.f));
  const units = arr.reduce((a, r) => a + r.total, 0);
  return `<div class="toolbar">
      <div class="seg" role="group" aria-label="Jour">${[[t, 'Aujourd’hui'], [addDays(t, 1), 'Demain'], [addDays(t, 2), relDay(addDays(t, 2))]].map(([k, l]) => `<button type="button" data-action="prod-day" data-d="${k}" aria-pressed="${d === k}">${l}</button>`).join('')}</div>
      <input type="date" value="${d}" data-action="prod-date" aria-label="Choisir une date">
      <span class="grow"></span>
      <button class="btn btn-sm" type="button" data-action="print">${icon('print')} Imprimer la fiche</button>
    </div>
    <div class="print-only"><h2>Fiche de production · ${fmtDay(d)}</h2></div>
    <div class="grid g3 mb">
      <div class="panel kpi"><div class="lbl">Commandes</div><div class="val">${list.length}</div></div>
      <div class="panel kpi"><div class="lbl">Articles à préparer</div><div class="val">${arr.reduce((a, r) => a + r.left, 0)}</div><div class="delta muted">sur ${units} au total</div></div>
      <div class="panel kpi"><div class="lbl">Restant à retirer</div><div class="val">${todo.length}</div></div>
    </div>
    ${arr.length ? `<div class="panel mb"><div class="panel-head"><div><h2>À préparer · ${relDay(d)}</h2><p>Quantités par produit et par créneau de retrait</p></div></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Produit</th><th>Format</th>${slots.map((s) => `<th class="n">${fmtSlot(s)}</th>`).join('')}<th class="n">Total</th><th class="n">Reste</th></tr></thead>
      <tbody>${arr.map((r) => `<tr><td><b>${esc(r.p)}</b></td><td>${esc(r.f)}</td>${slots.map((s) => `<td class="n">${r.by[s] || '<span class="muted">·</span>'}</td>`).join('')}<td class="n"><span class="prod-big" style="font-size:18px">${r.total}</span></td><td class="n">${r.left}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="2">Total</td>${slots.map((s) => `<td class="n">${arr.reduce((a, r) => a + (r.by[s] || 0), 0)}</td>`).join('')}<td class="n">${units}</td><td class="n">${arr.reduce((a, r) => a + r.left, 0)}</td></tr></tfoot></table></div></div>
      <div class="panel"><div class="panel-head"><h2>Ordre de retrait</h2></div><div class="table-wrap"><table class="t"><thead><tr><th>Heure</th><th>Client</th><th>Articles</th><th class="n">Total</th><th>Statut</th></tr></thead><tbody>
        ${list.sort(byPick).map((o) => `<tr><td><b>${fmtSlot(o.pickup_slot)}</b></td><td>${esc(o.customer_name)}<br><small class="muted">${esc(fmtPhone(o.phone))}</small></td><td>${o.items.map((i) => `${i.qty}× ${esc(i.product_name)} (${esc(i.format_name)})`).join('<br>')}${o.note ? `<br><small>Note : ${esc(o.note)}</small>` : ''}</td><td class="n">${money(o.total)}</td><td><span class="badge st-${o.status}">${ST[o.status].label}</span></td></tr>`).join('')}
      </tbody></table></div></div>`
    : `<div class="panel empty"><div class="big">${icon('basket')}</div><h3>Rien à préparer</h3><p>Aucune commande pour ce jour.</p></div>`}`;
}

// ---------------------------------------------------------------------------
// Produits
// ---------------------------------------------------------------------------
function pageProducts() {
  const ps = [...A.cat.products].sort((a, b) => a.position - b.position);
  const sold = {}; A.orders.filter((o) => valid(o) && o.pickup_day > addDays(today(), -30)).forEach((o) => o.items.forEach((i) => { sold[i.product_id] = (sold[i.product_id] || 0) + i.qty; }));
  return `<div class="toolbar"><p class="muted grow">${ps.length} produits · ${ps.filter((p) => p.active).length} en ligne. Glissez l’ordre avec les flèches.</p>
      <button class="btn" type="button" data-action="new-product">${icon('plus')} Nouveau produit</button></div>
    <div class="plist">${ps.map((p, i) => `<div class="prow ${p.active ? '' : 'off'}">
      <div class="order-btns"><button type="button" data-action="move" data-id="${p.id}" data-d="-1" aria-label="Monter" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button><button type="button" data-action="move" data-id="${p.id}" data-d="1" aria-label="Descendre" ${i === ps.length - 1 ? 'disabled' : ''}>${icon('down')}</button></div>
      ${p.image_url ? `<img class="thumb" src="${esc(p.image_url)}" alt="" loading="lazy">` : `<div class="thumb">${icon('bowl')}</div>`}
      <div><h3>${esc(p.name)} ${p.popular ? `<span class="badge" style="background:var(--gold-s);color:#8a5a00">${icon('star')} Populaire</span>` : ''}</h3>
        <div class="fm">${esc(p.category)} · ${p.formats.map((f) => `${esc(f.name)} ${money(f.price)}${f.stock != null ? ` <b style="color:${f.stock === 0 ? 'var(--red)' : f.stock <= 5 ? '#9a5b00' : 'inherit'}">(${f.stock === 0 ? 'épuisé' : `stock ${f.stock}`})</b>` : ''}${f.active ? '' : ' (masqué)'}`).join(' · ')}</div>
        <div class="fm">${sold[p.id] || 0} vendus sur 30 jours</div></div>
      <div class="ctl"><label class="switch"><input type="checkbox" data-action="toggle-prod" data-k="active" data-id="${p.id}" ${p.active ? 'checked' : ''}>En ligne</label>
        <label class="switch"><input type="checkbox" data-action="toggle-prod" data-k="popular" data-id="${p.id}" ${p.popular ? 'checked' : ''}>Populaire</label>
        <button class="btn btn-sm btn-light" type="button" data-action="edit-product" data-id="${p.id}">${icon('edit')} Modifier</button></div>
    </div>`).join('') || `<div class="panel empty"><div class="big">${icon('basket')}</div><h3>Aucun produit</h3></div>`}</div>`;
}
let draft = null;
function productForm(p) {
  draft = JSON.parse(JSON.stringify(p || { name: '', description: '', category: '', emoji: '', image_url: null, popular: false, active: true, formats: [{ name: 'Petit pot', price: 1000, stock: null, active: true }] }));
  const cats = [...new Set(A.cat.products.map((x) => x.category))];
  openModal({
    title: p ? `Modifier « ${esc(p.name)} »` : 'Nouveau produit', wide: true,
    body: `<form id="pform" novalidate>
      <div class="img-drop"><div class="prev" id="pimg">${draft.image_url ? `<img src="${esc(draft.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:16px">` : icon('bowl')}</div>
        <div><div class="btns"><label class="btn btn-sm btn-light">${icon('img')} ${draft.image_url ? 'Changer la photo' : 'Ajouter une photo'}<input type="file" accept="image/*" data-action="pick-img" hidden></label>
          ${draft.image_url ? '<button class="btn btn-sm btn-ghost" type="button" data-action="rm-img">Retirer</button>' : ''}</div>
          <small class="hint">Format carré conseillé. L’image est automatiquement optimisée.</small></div></div>
      <div class="grid g2"><label class="field"><span>Nom</span><input name="name" required maxlength="80" value="${esc(draft.name)}"></label>
        <label class="field"><span>Catégorie</span><input name="category" list="cats" maxlength="40" value="${esc(draft.category)}" placeholder="Ex : THIAKRY"><datalist id="cats">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label></div>
      <label class="field"><span>Description</span><textarea name="description" maxlength="400" rows="2">${esc(draft.description)}</textarea></label>
      <div class="grid g2"><div></div>
        <div class="field" style="align-content:center;gap:10px"><label class="switch"><input type="checkbox" name="active" ${draft.active ? 'checked' : ''}> En ligne</label><label class="switch"><input type="checkbox" name="popular" ${draft.popular ? 'checked' : ''}> Mis en avant (populaire)</label></div></div>
      <div class="label" style="margin:6px 0 8px">Formats et prix</div>
      <div class="fmt-row fmt-head"><span>Format</span><span>Prix (FCFA)</span><span>Prix barré</span><span>Stock</span><span>Actif</span><span></span></div>
      <div class="fmt-rows" id="fmts"></div>
      <button class="btn btn-sm btn-ghost" type="button" data-action="add-fmt">${icon('plus')} Ajouter un format</button>
      <p class="hint" style="margin-top:8px">Prix barré : l’ancien prix, affiché barré avec un badge de réduction (laisser vide si pas de promo). Stock vide = illimité. Le stock diminue à chaque commande et est restitué si elle est annulée.</p>
    </form>`,
    foot: `${p ? `<button class="btn btn-ghost btn-sm" type="button" data-action="del-product" data-id="${p.id}" style="margin-right:auto;color:var(--red)">${icon('trash')} Supprimer</button>` : ''}
      <button class="btn btn-ghost" type="button" data-action="close-modal">Annuler</button><button class="btn" type="button" data-action="save-product" id="save-p">Enregistrer</button>`,
  });
  renderFormats();
}
function renderFormats() {
  $('#fmts').innerHTML = draft.formats.map((f, i) => `<div class="fmt-row" data-i="${i}">
    <input class="input" aria-label="Nom du format" data-f="name" value="${esc(f.name)}" maxlength="40" placeholder="Petit pot">
    <input class="input" aria-label="Prix" data-f="price" type="number" min="0" step="50" inputmode="numeric" value="${f.price}">
    <input class="input" aria-label="Prix barré (avant réduction)" data-f="compare" type="number" min="0" step="50" inputmode="numeric" value="${f.compare_price ?? ''}" placeholder="—" ${promosReady() ? '' : 'disabled title="Activez d’abord les promotions"'}>
    <input class="input" aria-label="Stock" data-f="stock" type="number" min="0" inputmode="numeric" value="${f.stock ?? ''}" placeholder="∞">
    <label class="switch" title="Actif"><input type="checkbox" data-f="active" ${f.active ? 'checked' : ''}><span class="sr-only">Actif</span></label>
    <button class="icon-btn" type="button" data-action="rm-fmt" data-i="${i}" aria-label="Supprimer ce format" ${draft.formats.length <= 1 ? 'disabled' : ''}>${icon('trash')}</button></div>`).join('');
}
function readFormats() {
  $$('#fmts .fmt-row').forEach((row) => {
    const f = draft.formats[row.dataset.i];
    f.name = $('[data-f=name]', row).value.trim(); f.price = Math.round(Number($('[data-f=price]', row).value) || 0);
    const st = $('[data-f=stock]', row).value; f.stock = st === '' ? null : Math.max(0, Math.round(Number(st)));
    f.active = $('[data-f=active]', row).checked;
    if (promosReady()) { const c = $('[data-f=compare]', row).value; f.compare_price = c === '' ? null : Math.max(0, Math.round(Number(c))); }
  });
}
async function saveProduct() {
  readFormats(); const fm = $('#pform');
  draft.name = fm.name.value.trim(); draft.category = (fm.category.value.trim() || draft.name).toUpperCase().slice(0, 40);
  draft.description = fm.description.value.trim(); draft.emoji = draft.emoji || '';
  draft.active = fm.active.checked; draft.popular = fm.popular.checked;
  if (!draft.name) return toast('Indiquez le nom du produit', 'error');
  draft.formats = draft.formats.filter((f) => f.name);
  if (!draft.formats.length) { draft.formats.push({ name: '', price: 0, stock: null, active: true }); renderFormats(); return toast('Ajoutez au moins un format', 'error'); }
  if (draft.formats.some((f) => f.price <= 0)) return toast('Chaque format doit avoir un prix', 'error');
  if (!draft.id) draft.position = Math.max(0, ...A.cat.products.map((x) => x.position)) + 1;
  const b = $('#save-p'); b.classList.add('is-loading');
  try { await A.api.saveProduct(draft); A.cat = await A.api.adminCatalog(); toast('Produit enregistré', 'success'); closeModal(); }
  catch (e) { toast(errMsg(e), 'error'); } finally { b?.classList.remove('is-loading'); }
}

// ---------------------------------------------------------------------------
// Promotions : codes promo et prix barrés
// ---------------------------------------------------------------------------
const promosReady = () => S().promos_enabled !== undefined;
const promoLabel = (p) => (p.kind === 'percent' ? `-${p.value} %` : `-${money(p.value)}`);
async function loadPromos() {
  if (!promosReady()) { A.promos = []; return; }
  try { A.promos = await A.api.listPromos(); } catch (e) { A.promos = []; toast(errMsg(e), 'error'); }
}
function pagePromos() {
  if (!promosReady()) {
    return `<div class="panel install-box"><div class="empty"><div class="big">${icon('percent')}</div></div>
      <h2 style="font-size:20px;margin-bottom:6px">Activez les promotions</h2>
      <p class="muted" style="max-width:520px;margin:0 auto 16px">Une petite mise à jour de la base de données est nécessaire, une seule fois. Copiez le script, collez-le dans l’éditeur SQL de Supabase (projet gounass-luxury), puis cliquez sur Run.</p>
      <p style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn" href="${esc(PROMO_SQL_URL)}" target="_blank" rel="noopener">${icon('ext')} Copier le script</a>
      <a class="btn btn-light" href="https://supabase.com/dashboard" target="_blank" rel="noopener">Ouvrir Supabase</a>
      <button class="btn btn-ghost" type="button" data-action="reload-app">J’ai terminé, recharger</button></p></div>`;
  }
  if (!A.promos) { loadPromos().then(() => render(false)); return '<div class="spinner"></div>'; }
  const stats = {}; A.orders.filter(valid).forEach((o) => { if (o.promo_code) { const r = (stats[o.promo_code] ||= { n: 0, disc: 0, ca: 0 }); r.n++; r.disc += o.discount || 0; r.ca += o.total; } });
  const t = today(); const strike = A.cat.products.filter((p) => p.formats.some((f) => f.compare_price > f.price));
  const totDisc = Object.values(stats).reduce((a, r) => a + r.disc, 0); const totCa = Object.values(stats).reduce((a, r) => a + r.ca, 0);
  return `<div class="grid g3 mb stagger">
      <div class="panel kpi"><div class="ic o">${icon('ticket')}</div><div class="lbl">Codes actifs</div><div class="val">${countUp(A.promos.filter((p) => p.active).length)}</div><div class="delta muted">sur ${A.promos.length} code${A.promos.length > 1 ? 's' : ''}</div></div>
      <div class="panel kpi"><div class="ic g">${icon('cash')}</div><div class="lbl">Ventes avec un code · 60 j</div><div class="val">${countUp(totCa, 'm')}</div><div class="delta muted">${Object.values(stats).reduce((a, r) => a + r.n, 0)} commandes</div></div>
      <div class="panel kpi"><div class="ic r">${icon('percent')}</div><div class="lbl">Remises accordées · 60 j</div><div class="val">${countUp(totDisc, 'm')}</div><div class="delta muted">offertes à vos clients</div></div>
    </div>
    <div class="toolbar"><h2 class="grow" style="font-size:18px">Codes promo</h2>
      <label class="switch"><input type="checkbox" data-action="promos-on" ${S().promos_enabled ? 'checked' : ''}>Codes promo activés</label>
      <button class="btn" type="button" data-action="new-promo">${icon('plus')} Nouveau code</button></div>
    <div class="promo-list mb">${A.promos.map((p) => {
      const st = stats[p.code] || { n: 0, disc: 0 }; const expired = p.ends_on && p.ends_on < t; const soon = p.starts_on && p.starts_on > t;
      const full = p.max_uses != null && p.used_count >= p.max_uses;
      const state = !p.active ? 'Désactivé' : expired ? 'Expiré' : soon ? `Dès le ${fmtDay(p.starts_on, { day: 'numeric', month: 'short' })}` : full ? 'Épuisé' : 'Actif';
      return `<div class="promo-card ${p.active && !expired && !full ? '' : 'off'}">
        <div class="promo-val">${promoLabel(p)}</div>
        <div><div class="promo-code">${esc(p.code)} <span class="badge ${state === 'Actif' ? 'st-prete' : 'st-recuperee'}">${state}</span></div>
          <div class="promo-meta">${p.description ? `<span>${esc(p.description)}</span>` : ''}${p.min_order ? `<span>Dès ${money(p.min_order)}</span>` : '<span>Sans minimum</span>'}${p.ends_on ? `<span>Jusqu’au ${fmtDay(p.ends_on, { day: 'numeric', month: 'short', year: 'numeric' })}</span>` : ''}<span>${p.used_count}${p.max_uses ? ` / ${p.max_uses}` : ''} utilisation${p.used_count > 1 ? 's' : ''}</span>${st.disc ? `<span>${money(st.disc)} offerts</span>` : ''}</div>
          ${p.max_uses ? `<div class="use-meter"><i style="width:${Math.min(100, (p.used_count / p.max_uses) * 100)}%"></i></div>` : ''}</div>
        <div class="ctl"><label class="switch"><input type="checkbox" data-action="toggle-promo" data-id="${p.id}" ${p.active ? 'checked' : ''}>Actif</label>
          <button class="btn btn-sm btn-light" type="button" data-action="copy-promo" data-code="${esc(p.code)}">Partager</button>
          <button class="btn btn-sm btn-light" type="button" data-action="edit-promo" data-id="${p.id}">${icon('edit')} Modifier</button></div></div>`;
    }).join('') || `<div class="panel empty"><div class="big">${icon('ticket')}</div><h3>Aucun code promo</h3><p>Créez votre premier code, par exemple BIENVENUE10 pour -10 %.</p></div>`}</div>
    <div class="panel"><div class="panel-head"><div><h2>Prix barrés sur les produits</h2><p>Affichez une réduction directement sur la carte : prix d’origine barré et badge « -20 % ».</p></div><a class="btn btn-sm btn-light" href="#/produits">${icon('tag')} Gérer les produits</a></div>
      ${strike.length ? `<div class="ranks">${strike.map((p) => `<div class="rank"><div class="top"><span>${esc(p.name)}</span><b>${p.formats.filter((f) => f.compare_price > f.price).map((f) => `${esc(f.name)} : <s class="muted">${money(f.compare_price)}</s> ${money(f.price)}`).join(' · ')}</b></div></div>`).join('')}</div>`
        : '<p class="muted">Aucun produit en promotion. Dans Produits → Modifier, remplissez la colonne « Prix barré » d’un format (ex : prix barré 2 500, prix 2 000).</p>'}</div>`;
}
function promoForm(p) {
  const d = p || { code: '', kind: 'percent', value: 10, min_order: 0, max_uses: null, starts_on: '', ends_on: '', active: true, description: '' };
  A.promoDraft = d.id || null;
  openModal({
    title: p ? `Modifier le code ${esc(p.code)}` : 'Nouveau code promo',
    body: `<form id="promo-form" novalidate>
      <label class="field"><span>Code</span><input name="code" required maxlength="20" value="${esc(d.code)}" placeholder="BIENVENUE10" style="text-transform:uppercase;font-weight:800;letter-spacing:.05em" autocapitalize="characters"><small>Lettres et chiffres, sans espace (3 à 20 caractères).</small></label>
      <div class="field"><span>Type de réduction</span><div class="kind-seg">
        <label><input type="radio" name="kind" value="percent" ${d.kind === 'percent' ? 'checked' : ''}>${icon('percent')} Pourcentage</label>
        <label><input type="radio" name="kind" value="amount" ${d.kind === 'amount' ? 'checked' : ''}>${icon('cash')} Montant fixe</label></div></div>
      <div class="grid g2"><label class="field"><span>Valeur <small id="val-unit">(${d.kind === 'percent' ? '%' : 'FCFA'})</small></span><input name="value" type="number" min="1" inputmode="numeric" value="${d.value}" required></label>
        <label class="field"><span>Commande minimum (FCFA)</span><input name="min_order" type="number" min="0" step="100" inputmode="numeric" value="${d.min_order || 0}"></label></div>
      <div class="grid g2"><label class="field"><span>Valable à partir du <small>(facultatif)</small></span><input name="starts_on" type="date" value="${d.starts_on || ''}"></label>
        <label class="field"><span>Jusqu’au <small>(facultatif)</small></span><input name="ends_on" type="date" value="${d.ends_on || ''}"></label></div>
      <div class="grid g2"><label class="field"><span>Utilisations maximum <small>(vide = illimité)</small></span><input name="max_uses" type="number" min="1" inputmode="numeric" value="${d.max_uses ?? ''}" placeholder="Illimité"></label>
        <div class="field" style="align-content:end"><label class="switch"><input type="checkbox" name="active" ${d.active ? 'checked' : ''}> Code actif</label></div></div>
      <label class="field"><span>Description interne <small>(facultatif)</small></span><input name="description" maxlength="200" value="${esc(d.description || '')}" placeholder="Ex : Offre Tabaski, clients fidèles…"></label>
    </form>`,
    foot: `${p ? `<button class="btn btn-ghost btn-sm" type="button" data-action="del-promo" data-id="${p.id}" style="margin-right:auto;color:var(--red)">${icon('trash')} Supprimer</button>` : ''}
      <button class="btn btn-ghost" type="button" data-action="close-modal">Annuler</button><button class="btn" type="button" data-action="save-promo" id="save-promo">Enregistrer</button>`,
  });
}
async function savePromo() {
  const f = $('#promo-form'); const fd = new FormData(f);
  const code = String(fd.get('code') || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return toast('Code invalide : 3 à 20 lettres ou chiffres, sans espace', 'error');
  const kind = fd.get('kind') === 'amount' ? 'amount' : 'percent'; const value = Math.round(Number(fd.get('value')) || 0);
  if (value <= 0 || (kind === 'percent' && value > 100)) return toast(kind === 'percent' ? 'Pourcentage entre 1 et 100' : 'Montant supérieur à 0', 'error');
  const mu = String(fd.get('max_uses') || '').trim();
  const row = { id: A.promoDraft || undefined, code, kind, value, min_order: Math.max(0, Math.round(Number(fd.get('min_order')) || 0)), max_uses: mu ? Math.max(1, Math.round(Number(mu))) : null,
    starts_on: fd.get('starts_on') || null, ends_on: fd.get('ends_on') || null, active: fd.get('active') === 'on', description: String(fd.get('description') || '').trim() };
  if (row.starts_on && row.ends_on && row.ends_on < row.starts_on) return toast('La date de fin est avant la date de début', 'error');
  const b = $('#save-promo'); b.classList.add('is-loading');
  try { await A.api.savePromo(row); await loadPromos(); toast(`Code ${code} enregistré`, 'success'); closeModal(); }
  catch (e) { toast(/duplicate|unique|existe/i.test(e?.message) ? 'Ce code existe déjà' : errMsg(e), 'error'); } finally { b?.classList.remove('is-loading'); }
}

// ---------------------------------------------------------------------------
// Visites et fidélité (mise à jour v4)
// ---------------------------------------------------------------------------
const v4Ready = () => S().loyalty_enabled !== undefined;
const V4_SQL_URL = 'https://supabase.com/dashboard/project/ejutptsipygbnobkrowt/explorer/notebook/e481ce69-e9aa-4b14-92a0-e783248be7b3';
const v4Install = (what) => `<div class="panel install-box"><div class="empty"><div class="big">${icon('gift')}</div></div><h2 style="font-size:19px;margin-bottom:6px">Activez ${what}</h2>
  <p class="muted" style="max-width:520px;margin:0 auto 14px">Une mise à jour de la base est nécessaire, une seule fois : ouvrez le script dans Supabase et cliquez sur Run.</p>
  <p style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn" href="${esc(V4_SQL_URL)}" target="_blank" rel="noopener">${icon('ext')} Ouvrir le script</a><button class="btn btn-ghost" type="button" data-action="reload-app">J’ai terminé, recharger</button></p></div>`;
function visitsPanel() {
  if (!v4Ready()) return '';
  if (!A.visits) { A.visits = []; A.api.listVisits(addDays(today(), -29)).then((v) => { A.visits = v; if (routeName() === 'tableau') render(false); }).catch(() => {}); }
  const t = today(); const days = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const uniq = (from) => new Set(A.visits.filter((v) => v.day >= from).map((v) => v.visitor)).size;
  const logged = (from) => new Set(A.visits.filter((v) => v.day >= from && v.user_id).map((v) => v.user_id)).size;
  const per = days.map((d) => A.visits.filter((v) => v.day === d).length); const max = Math.max(1, ...per);
  return `<div class="panel mb"><div class="panel-head"><div><h2>Visiteurs du site</h2><p>Visiteurs uniques par jour · comptes clients connectés</p></div></div>
    <div class="grid g4 mb" style="gap:10px">
      <div class="mini-stat"><span>Aujourd’hui</span><b>${countUp(uniq(t))}</b></div>
      <div class="mini-stat"><span>7 jours</span><b>${countUp(uniq(addDays(t, -6)))}</b></div>
      <div class="mini-stat"><span>30 jours</span><b>${countUp(uniq(addDays(t, -29)))}</b></div>
      <div class="mini-stat"><span>Clients connectés · 30 j</span><b>${countUp(logged(addDays(t, -29)))}</b></div></div>
    <div class="spark">${per.map((n, i) => `<i style="height:${Math.max(3, (n / max) * 100)}%;animation-delay:${i * 30}ms" title="${fmtDay(days[i], { day: 'numeric', month: 'short' })} : ${n} visiteurs"></i>`).join('')}</div></div>`;
}
function pageLoyalty() {
  if (!v4Ready()) return v4Install('la fidélité');
  if (!A.rewards) { Promise.all([A.api.listRewards(), A.api.listRedemptions()]).then(([r, h]) => { A.rewards = r; A.redemptions = h; render(false); }).catch((e) => toast(errMsg(e), 'error')); return '<div class="spinner"></div>'; }
  const s = S(); const l = A.loyal;
  return `<div class="grid g2 mb">
    <div class="panel"><div class="panel-head"><h2>Programme fidélité</h2></div>
      <label class="switch mb"><input type="checkbox" data-action="loyal-on" ${s.loyalty_enabled ? 'checked' : ''}> Programme activé</label>
      <label class="field"><span>1 point gagné par tranche de (FCFA)</span><input type="number" min="10" step="10" value="${s.loyalty_rate}" data-action="loyal-rate"><small>Les points sont gagnés quand la commande est marquée « Récupérée ».</small></label></div>
    <div class="panel"><div class="panel-head"><h2>Rechercher un client</h2></div>
      <form id="loyal-search" class="toolbar" style="margin:0"><div class="input-group grow"><span>+221</span><input name="phone" type="tel" inputmode="tel" placeholder="77 123 45 67" value="${esc(l ? fmtPhone(l.phone) : '')}" aria-label="Téléphone"></div><button class="btn btn-sm" type="submit">${icon('search')} Voir</button></form>
      ${l ? `<div class="loyal-client"><div class="pts">${l.points}<small>points</small></div><div><b>${esc(fmtPhone(l.phone))}</b><div class="muted" style="font-size:13.5px">${l.orders} commande(s) récupérée(s) · ${l.earned} gagnés · ${l.spent} utilisés</div></div></div>
        ${l.rewards.map((r) => `<div class="reward-row"><span>${esc(r.name)} <small class="muted">${r.cost} pts</small></span><button class="btn btn-xs ${l.points >= r.cost ? 'btn-green' : 'btn-light'}" type="button" data-action="redeem" data-id="${r.id}" ${l.points >= r.cost ? '' : 'disabled'}>Remettre</button></div>`).join('')}` : ''}</div></div>
  <div class="grid g2">
    <div class="panel"><div class="panel-head"><h2>Cadeaux</h2><button class="btn btn-sm" type="button" data-action="add-reward">${icon('plus')} Ajouter</button></div>
      <div class="zones">${A.rewards.map((r) => `<div class="zone-row" data-reward="${r.id}"><input class="input" data-action="reward" data-f="name" value="${esc(r.name)}" maxlength="80" aria-label="Cadeau">
        <div class="input-group"><input data-action="reward" data-f="cost" type="number" min="1" value="${r.cost}" aria-label="Points"><span>pts</span></div>
        <label class="switch"><input type="checkbox" data-action="reward" data-f="active" ${r.active ? 'checked' : ''}>Actif</label>
        <button class="icon-btn" type="button" data-action="del-reward" data-id="${r.id}" aria-label="Supprimer">${icon('trash')}</button></div>`).join('') || '<p class="muted">Aucun cadeau.</p>'}</div></div>
    <div class="panel"><div class="panel-head"><h2>Derniers cadeaux remis</h2></div>
      ${A.redemptions.length ? `<div class="table-wrap"><table class="t"><tbody>${A.redemptions.slice(0, 15).map((h) => `<tr><td>${esc(fmtPhone(h.phone))}</td><td>${esc(h.reward_name)}</td><td class="n">-${h.cost}</td><td class="n muted">${fmtDateTime(h.created_at)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aucun pour le moment.</p>'}</div></div>`;
}
function hoursPanel() {
  if (S().auto_hours === undefined) return '';
  const s = S(); const WD = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return `<div class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Horaires automatiques</h2><p>La boutique se ferme et s’ouvre toute seule selon ces horaires (heure de Dakar).</p></div>
      <label class="switch"><input type="checkbox" data-action="auto-hours" ${s.auto_hours ? 'checked' : ''}>Activé</label></div>
    <form id="hours-form" class="hours">${[1, 2, 3, 4, 5, 6, 0].map((d) => { const h = s.hours?.[d] ?? s.hours?.[String(d)]; return `<div class="hours-row"><label class="switch"><input type="checkbox" name="on${d}" ${h ? 'checked' : ''}><span>${WD[d]}</span></label>
      <input class="input" type="time" name="o${d}" value="${h?.[0] || '10:00'}" aria-label="Ouverture ${WD[d]}"><span class="muted">à</span><input class="input" type="time" name="c${d}" value="${h?.[1] || '22:00'}" aria-label="Fermeture ${WD[d]}"></div>`; }).join('')}
      <button class="btn btn-sm" type="submit">Enregistrer les horaires</button></form></div>`;
}
async function lookupLoyal(phone) {
  try { const l = await A.api.loyalty(phone); if (!l.ok) return toast(l.message, 'error'); A.loyal = l; render(false); } catch (e) { toast(errMsg(e), 'error'); }
}

// ---------------------------------------------------------------------------
// Clients et menu « Plus »
// ---------------------------------------------------------------------------
function pageClients() {
  const q = (A.cq || '').trim().toLowerCase(); const rate = S().loyalty_rate || 100; const t = today();
  const m = {};
  A.orders.forEach((o) => {
    const c = (m[o.phone] ||= { phone: o.phone, name: o.customer_name, n: 0, spent: 0, last: '', pts: 0, account: false });
    if (o.created_at > c.last) { c.last = o.created_at; c.name = o.customer_name; }
    if (o.user_id) c.account = true;
    if (valid(o)) { c.n++; c.spent += o.total; }
    if (o.status === 'recuperee') c.pts += Math.floor(o.total / rate);
  });
  const all = Object.values(m).sort((a, b) => b.spent - a.spent);
  const list = all.filter((c) => !q || [c.name, c.phone, fmtPhone(c.phone)].join(' ').toLowerCase().includes(q));
  const acc = all.filter((c) => c.account).length;
  if (!A.visits && v4Ready()) visitsPanel();
  const logged = new Set((A.visits || []).filter((v) => v.user_id && v.day >= addDays(t, -29)).map((v) => v.user_id)).size;
  return `<div class="grid g4 mb stagger">
      <div class="panel kpi"><div class="ic">${icon('users')}</div><div class="lbl">Clients · 60 j</div><div class="val">${countUp(all.length)}</div></div>
      <div class="panel kpi"><div class="ic g">${icon('check')}</div><div class="lbl">Avec un compte</div><div class="val">${countUp(acc)}</div><div class="delta muted">${all.length ? Math.round((acc / all.length) * 100) : 0} % des clients</div></div>
      <div class="panel kpi"><div class="ic o">${icon('bell')}</div><div class="lbl">Comptes connectés · 30 j</div><div class="val">${countUp(logged)}</div></div>
      <div class="panel kpi"><div class="ic r">${icon('cash')}</div><div class="lbl">Dépense moyenne</div><div class="val">${countUp(all.length ? all.reduce((a, c) => a + c.spent, 0) / all.length : 0, 'm')}</div></div></div>
    <div class="toolbar"><label class="search grow">${icon('search')}<input class="input" type="search" placeholder="Rechercher : nom ou téléphone" value="${esc(A.cq || '')}" data-action="client-search" aria-label="Rechercher un client"></label></div>
    <div class="panel"><div class="table-wrap"><table class="t"><thead><tr><th>Client</th><th class="n">Commandes</th><th class="n">Total dépensé</th><th class="n">Points</th><th>Dernière commande</th><th></th></tr></thead><tbody>
      ${list.slice(0, 200).map((c) => `<tr><td><b>${esc(c.name)}</b>${c.account ? ' <span class="badge st-prete">Compte</span>' : ''}<br><small class="muted">${esc(fmtPhone(c.phone))}</small></td><td class="n">${c.n}</td><td class="n">${money(c.spent)}</td><td class="n">${c.pts}</td><td><small>${fmtDateTime(c.last)}</small></td>
        <td><a class="btn btn-xs btn-wa" href="${waLink(c.phone, `Bonjour ${firstName(c.name)}, `)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('wa')}</a></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Aucun client.</td></tr>'}
    </tbody></table></div></div>`;
}
function moreMenu() {
  const items = [['production', 'Production', 'chef'], ['promos', 'Promotions', 'percent'], ['fidelite', 'Fidélité', 'gift'], ['clients', 'Clients', 'users'], ['creneaux', 'Créneaux', 'clock'], ['reglages', 'Réglages et horaires', 'gear']];
  openModal({ title: 'Menu', body: `<div class="more-grid">${items.map(([k, l, i]) => `<a class="more-item" href="#/${k}">${icon(i)}<span>${l}</span></a>`).join('')}
      <a class="more-item shop" href="./">${icon('store')}<span>Retour à la boutique</span></a>
      <button class="more-item" type="button" data-action="logout">${icon('out')}<span>Déconnexion</span></button></div>` });
}

// ---------------------------------------------------------------------------
// Créneaux
// ---------------------------------------------------------------------------
function pageSlots() {
  const s = S(); const t = today(); const WD = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const closedD = new Map(A.cat.closedDates.map((d) => [d.day, d.reason]));
  const load = []; A.orders.filter(valid).forEach((o) => { const l = load.find((x) => x.day === o.pickup_day && x.slot === o.pickup_slot); if (l) l.booked++; else load.push({ day: o.pickup_day, slot: o.pickup_slot, booked: 1 }); });
  const days = Array.from({ length: 14 }, (_, i) => addDays(t, i));
  return `<div class="grid g2 mb">
    <div class="panel"><div class="panel-head"><div><h2>Heures de retrait proposées</h2><p>Appliquées à tous les jours ouverts</p></div></div>
      <div class="chips slot-chips mb">${sortSlots(s.slot_times).map((x) => `<span class="chip">${fmtSlot(x)}<button type="button" data-action="rm-slot" data-s="${x}" aria-label="Retirer ${fmtSlot(x)}">${icon('x')}</button></span>`).join('')}</div>
      <form class="toolbar" id="add-slot" style="margin:0"><input class="input" type="time" name="t" step="900" required style="max-width:150px" aria-label="Nouvelle heure"><button class="btn btn-sm" type="submit">${icon('plus')} Ajouter</button></form></div>
    <div class="panel"><div class="panel-head"><h2>Règles de réservation</h2></div>
      <form id="rules" class="grid g3" style="gap:12px">
        <label class="field" style="margin:0"><span>Commandes max. par créneau</span><input type="number" name="slot_capacity" min="1" max="500" value="${s.slot_capacity}"></label>
        <label class="field" style="margin:0"><span>Délai minimum (min)</span><input type="number" name="lead_minutes" min="0" max="1440" step="5" value="${s.lead_minutes}"></label>
        <label class="field" style="margin:0"><span>Jours réservables</span><input type="number" name="days_ahead" min="1" max="30" value="${s.days_ahead}"></label>
      </form>
      <div class="label" style="margin:16px 0 8px">Fermeture chaque semaine</div>
      <div class="wd" role="group" aria-label="Jours de fermeture hebdomadaire">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button type="button" data-action="weekday" data-d="${d}" aria-pressed="${s.closed_weekdays.includes(d)}">${WD[d]}</button>`).join('')}</div>
      <small class="hint">Touchez un jour pour le fermer toutes les semaines.</small></div>
  </div>
  <div class="panel"><div class="panel-head"><div><h2>Calendrier des 14 prochains jours</h2><p>Touchez un créneau pour l’ouvrir ou le fermer. La jauge indique le remplissage.</p></div></div>
    <div class="cal">${days.map((d) => {
      const weekly = s.closed_weekdays.includes(weekday(d)); const closed = weekly || closedD.has(d);
      const st = slotStates(d, s, A.cat.closedSlots, load);
      const n = load.filter((l) => l.day === d).reduce((a, l) => a + l.booked, 0);
      return `<div class="cal-day ${closed ? 'closed' : ''}"><div class="hd"><b>${relDay(d)} <span class="muted" style="font-weight:600">· ${fmtDay(d, { day: 'numeric', month: 'short' })}</span></b>
        <span class="muted" style="font-size:13px">${n} commande${n > 1 ? 's' : ''}</span>
        ${weekly ? '<span class="badge st-annulee">Fermé (hebdomadaire)</span>' : `<label class="switch"><input type="checkbox" data-action="day-open" data-d="${d}" ${closed ? '' : 'checked'}>${closed ? `Fermé${closedD.get(d) ? ` · ${esc(closedD.get(d))}` : ''}` : 'Ouvert'}</label>`}</div>
        ${closed ? '' : `<div class="cal-slots">${st.map((x) => { const pct = Math.min(100, (x.booked / s.slot_capacity) * 100); const off = x.state === 'closed';
          return `<button type="button" class="cal-slot ${off ? 'off' : pct >= 100 ? 'full' : pct >= 60 ? 'mid' : ''}" data-action="toggle-slot" data-d="${d}" data-s="${x.slot}" ${x.state === 'past' && !off ? 'disabled' : ''} aria-label="${fmtSlot(x.slot)} ${off ? 'fermé' : 'ouvert'}"><b>${fmtSlot(x.slot)}</b><small>${off ? 'Fermé' : x.state === 'past' ? `Passé · ${x.booked}` : `${x.booked}/${s.slot_capacity}`}</small><div class="m"><i style="width:${off ? 0 : pct}%"></i></div></button>`; }).join('')}</div>`}
      </div>`;
    }).join('')}</div></div>`;
}

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------
function pageSettings() {
  const s = S();
  const f = (name, label, opts = {}) => `<label class="field"><span>${label}</span>${opts.area ? `<textarea name="${name}" rows="${opts.rows || 3}" maxlength="${opts.max || 600}">${esc(s[name])}</textarea>` : `<input name="${name}" value="${esc(s[name])}" maxlength="${opts.max || 200}" ${opts.attrs || ''}>`}${opts.hint ? `<small>${opts.hint}</small>` : ''}</label>`;
  return `<form id="settings" class="grid g2" novalidate>
    <div class="panel"><div class="panel-head"><h2>Boutique</h2></div>
      ${f('shop_name', 'Nom de la boutique', { max: 60 })}
      ${f('tagline', 'Accroche (page d’accueil)', { area: true, rows: 2, max: 200 })}
      ${f('story', 'Notre histoire', { area: true, rows: 4 })}
      ${f('opening_hours', 'Horaires affichés', { max: 120, hint: 'Ex : Tous les jours · 10h – 22h' })}</div>
    <div>
      <div class="panel mb"><div class="panel-head"><h2>Contact</h2></div>
        ${f('phone', 'Téléphone affiché', { attrs: 'inputmode="tel"', hint: '9 chiffres, ex : 70 570 41 21' })}
        ${f('whatsapp', 'Numéro WhatsApp qui reçoit les messages', { attrs: 'inputmode="tel"', hint: 'Avec l’indicatif, ex : 221705704121' })}
        ${f('address', 'Adresse', { max: 160 })}
        ${f('maps_url', 'Lien Google Maps', { max: 500, attrs: 'type="url"' })}</div>
      <div class="panel"><div class="panel-head"><h2>Annonce</h2></div>
        ${f('announcement', 'Bandeau affiché en haut du site', { area: true, rows: 2, max: 200, hint: 'Ex : Fermé exceptionnellement samedi. Laissez vide pour ne rien afficher.' })}
        <label class="switch"><input type="checkbox" name="accepting_orders" ${s.accepting_orders ? 'checked' : ''}> Accepter les commandes en ligne</label></div>
    </div>
    <div class="panel"><div class="panel-head"><h2>Paiement en ligne</h2></div>
      ${f('wave_link', 'Lien de paiement Wave', { max: 300, attrs: 'type="url" placeholder="https://pay.wave.com/m/…"', hint: 'Le montant de la commande est ajouté automatiquement au lien.' })}
      ${f('orange_money_link', 'Lien Orange Money (facultatif)', { max: 300, attrs: 'type="url"' })}</div>
    <div class="panel"><div class="panel-head"><h2>Livraison à domicile</h2></div>
      <label class="switch mb"><input type="checkbox" name="delivery_enabled" ${s.delivery_enabled ? 'checked' : ''}> Proposer la livraison à domicile</label>
      ${f('delivery_info', 'Message affiché au client', { area: true, rows: 2, max: 300 })}
      <label class="field"><span>Commande minimum pour la livraison (FCFA)</span><input name="delivery_min_order" type="number" min="0" step="100" value="${s.delivery_min_order || 0}"></label></div>
    <div style="grid-column:1/-1;display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-lg" type="submit">Enregistrer les réglages</button></div>
  </form>
  <div class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Zones et frais de livraison</h2><p>Les modifications sont enregistrées dès que vous quittez un champ.</p></div><button class="btn btn-sm" type="button" data-action="add-zone">${icon('plus')} Ajouter une zone</button></div>
    <div class="zones">${(A.cat.zones || []).map((z) => `<div class="zone-row" data-zone="${z.id}">
      <input class="input" data-action="zone" data-f="zname" value="${esc(z.name)}" maxlength="60" aria-label="Nom de la zone">
      <div class="input-group"><input data-action="zone" data-f="zfee" type="number" min="0" step="100" value="${z.fee}" aria-label="Frais"><span>FCFA</span></div>
      <label class="switch"><input type="checkbox" data-action="zone" data-f="zactive" ${z.active ? 'checked' : ''}>Active</label>
      <button class="icon-btn" type="button" data-action="del-zone" data-id="${z.id}" aria-label="Supprimer">${icon('trash')}</button></div>`).join('') || '<p class="muted">Aucune zone : ajoutez-en une pour proposer la livraison.</p>'}</div></div>
  ${hoursPanel()}
  <div class="grid g2" style="margin-top:16px">
    <div class="panel"><div class="panel-head"><h2>Mon compte</h2></div><p class="muted mb">Connecté en tant que <b>${esc(A.email)}</b></p>
      ${A.api.demo ? '<p class="hint">Changement de mot de passe indisponible en mode démonstration.</p>' : `<form id="pwd" class="toolbar" style="margin:0"><input class="input grow" type="password" name="p" minlength="8" autocomplete="new-password" placeholder="Nouveau mot de passe (8 caractères min.)" aria-label="Nouveau mot de passe" required><button class="btn btn-sm" type="submit">Changer</button></form>`}</div>
    <div class="panel"><div class="panel-head"><h2>Partager la boutique</h2></div>
      <p class="muted mb">Lien à envoyer à vos clients ou à mettre dans votre statut WhatsApp :</p>
      <div class="toolbar" style="margin:0"><input class="input grow" readonly value="${esc(shopUrl())}" aria-label="Lien de la boutique" id="shop-url"><button class="btn btn-sm btn-light" type="button" data-action="copy-url">Copier</button>
      <a class="btn btn-sm btn-wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`Commandez vos Soow, Thiakry, Ngallakh chez ${s.shop_name} et récupérez-les sans attendre : ${shopUrl()}`)}">${icon('wa')} Partager</a></div>
      ${A.api.demo ? '<button class="btn btn-sm btn-ghost" style="margin-top:14px" type="button" data-action="reset-demo">Réinitialiser les données de démonstration</button>' : ''}</div>
  </div>`;
}
const shopUrl = () => (CONFIG.SITE_URL || new URL('./', location.href).href).replace(/#.*$/, '');

async function saveSettings(form) {
  const fd = new FormData(form); const patch = {};
  ['shop_name', 'tagline', 'story', 'opening_hours', 'address', 'maps_url', 'announcement', 'wave_link', 'orange_money_link', 'delivery_info'].forEach((k) => { patch[k] = String(fd.get(k) || '').trim(); });
  for (const k of ['wave_link', 'orange_money_link']) if (patch[k] && !/^https:\/\/\S+$/.test(patch[k])) return toast('Les liens de paiement doivent commencer par https://', 'error');
  patch.delivery_enabled = fd.get('delivery_enabled') === 'on'; patch.delivery_min_order = Math.max(0, Math.round(Number(fd.get('delivery_min_order')) || 0));
  const phone = normalizePhone(fd.get('phone')); if (!phone) return toast('Téléphone invalide', 'error'); patch.phone = phone;
  const wa = String(fd.get('whatsapp') || '').replace(/\D/g, ''); if (wa.length < 9) return toast('Numéro WhatsApp invalide', 'error');
  patch.whatsapp = wa.length === 9 ? `221${wa}` : wa;
  if (!patch.shop_name) return toast('Le nom de la boutique est obligatoire', 'error');
  if (patch.maps_url && !/^https:\/\//.test(patch.maps_url)) return toast('Le lien Google Maps doit commencer par https://', 'error');
  patch.accepting_orders = fd.get('accepting_orders') === 'on';
  await saveSettingsPatch(patch, 'Réglages enregistrés');
}
async function saveSettingsPatch(patch, msg) {
  try { A.cat.settings = await A.api.saveSettings(patch); $('#accepting').checked = S().accepting_orders; updateAcceptLbl(); if (msg) toast(msg, 'success', 2000); render(false); }
  catch (e) { toast(errMsg(e), 'error'); }
}
function updateAcceptLbl() { $('#accepting-lbl').textContent = $('#accepting').checked ? 'Boutique ouverte' : 'Commandes suspendues'; }

// ---------------------------------------------------------------------------
// Routage
// ---------------------------------------------------------------------------
const PAGES = {
  tableau: ['Tableau de bord', pageDashboard], commandes: ['Commandes', pageOrders], historique: ['Historique des ventes', pageHistory], production: ['Production', pageProduction],
  produits: ['Produits', pageProducts], promos: ['Promotions', pagePromos], fidelite: ['Fidélité', pageLoyalty], clients: ['Clients', pageClients], creneaux: ['Créneaux', pageSlots], reglages: ['Réglages', pageSettings],
};
const routeName = () => { const r = location.hash.replace(/^#\/?/, '').split('/')[0]; return PAGES[r] ? r : 'tableau'; };
function render(scroll = true) {
  if (!A.cat) return;
  const r = routeName(); const [title, fn] = PAGES[r];
  $('#page-title').textContent = title;
  const inMore = ['production', 'promos', 'fidelite', 'clients', 'creneaux', 'reglages'].includes(r);
  $$('[data-nav]').forEach((a) => { const on = a.dataset.nav === r || (inMore && a.dataset.nav === 'plus'); a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const ae = document.activeElement; const keep = ae?.dataset?.action === 'search' ? ae.selectionStart : null;
  $('#page').innerHTML = fn();
  if (scroll || A.lastRoute !== r) { $('#page').classList.remove('page-in'); void $('#page').offsetWidth; $('#page').classList.add('page-in'); }
  A.lastRoute = r; animateCounts($('#page'));
  if (keep != null) { const i = $('[data-action=search]'); i?.focus(); i?.setSelectionRange(keep, keep); }
  if (scroll) { scrollTo(0, 0); }
}

// ---------------------------------------------------------------------------
// Événements
// ---------------------------------------------------------------------------
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-action]'); if (!t) return;
  const d = t.dataset; const a = d.action;
  if (['range', 'status-filter', 'next-status', 'open-order', 'set-status', 'move', 'rm-slot', 'weekday', 'toggle-slot', 'prod-day', 'new-product', 'edit-product', 'add-fmt', 'rm-fmt', 'save-product', 'del-product', 'save-note', 'cancel', 'export', 'print', 'print-ticket', 'logout', 'toggle-sound', 'reset-demo', 'forgot', 'close-modal', 'copy-url', 'rm-img', 'filter-new'].includes(a)) {
    if (t.tagName === 'A' && !['filter-new'].includes(a) && a !== 'open-order') e.preventDefault();
  }
  switch (a) {
    case 'close-modal': closeModal(); break;
    case 'range': A.f.range = d.r; render(false); break;
    case 'status-filter': A.f.status = d.s; render(false); break;
    case 'filter-new': A.f.range = 'upcoming'; A.f.status = 'nouvelle'; break;
    case 'open-order': e.preventDefault(); openOrder(d.id); break;
    case 'next-status': {
      const o = A.orders.find((x) => x.id === d.id); const nx = ST[o.status].next; if (!nx) return;
      t.classList.add('is-loading'); A.newIds.delete(o.id);
      const u = await patchOrder(o.id, { status: nx }, `${o.number} · ${ST[nx].label}`);
      if (u && nx === 'prete') toast(`Pensez à prévenir ${firstName(o.customer_name)} sur WhatsApp`, 'info', 4000);
      break;
    }
    case 'set-status': {
      const o = A.orders.find((x) => x.id === d.id); if (o.status === d.s) return;
      if (d.s === 'recuperee' && !(await ask('Marquer cette commande comme récupérée ? Elle sera clôturée.', { ok: 'Oui, récupérée' }))) { openOrder(o.id); return; }
      if (A.modalOrder !== o.id) openOrder(o.id);
      await patchOrder(o.id, { status: d.s, ...(d.s === 'recuperee' ? { paid: true } : {}) }, `Statut : ${ST[d.s].label}`);
      break;
    }
    case 'cancel': {
      const o = A.orders.find((x) => x.id === d.id);
      if (!(await ask(`Annuler la commande <b>${esc(o.number)}</b> de ${esc(o.customer_name)} ? Le créneau et le stock seront libérés. Cette action est définitive.`, { ok: 'Annuler la commande', danger: true }))) { openOrder(o.id); return; }
      await patchOrder(o.id, { status: 'annulee' }, 'Commande annulée');
      break;
    }
    case 'save-note': await patchOrder(d.id, { admin_note: $('#admin-note').value.trim(), payment_ref: $('#pay-ref').value.trim() }, 'Enregistré'); break;
    case 'period': A.period = Number(d.p); render(false); break;
    case 'new-promo': promoForm(null); break;
    case 'more-menu': moreMenu(); break;
    case 'add-reward': await A.api.saveReward({ name: 'Nouveau cadeau', cost: 100, active: true }); A.rewards = await A.api.listRewards(); render(false); break;
    case 'del-reward': if (await ask('Supprimer ce cadeau ?', { ok: 'Supprimer', danger: true })) { await A.api.deleteReward(d.id); A.rewards = await A.api.listRewards(); } render(false); break;
    case 'redeem': {
      const r = A.loyal.rewards.find((x) => x.id === d.id);
      if (!(await ask(`Remettre « ${esc(r.name)} » au ${esc(fmtPhone(A.loyal.phone))} ? ${r.cost} points seront déduits.`, { ok: 'Remettre le cadeau' }))) return render(false);
      try { A.loyal = await A.api.redeem(A.loyal.phone, r.id); A.redemptions = await A.api.listRedemptions(); toast('Cadeau remis, points déduits', 'success'); } catch (err) { toast(errMsg(err), 'error'); }
      render(false); break;
    }
    case 'edit-promo': promoForm(A.promos.find((x) => x.id === d.id)); break;
    case 'save-promo': savePromo(); break;
    case 'reload-app': location.reload(); break;
    case 'copy-promo': {
      const txt = `Profitez du code ${d.code} sur ${S().shop_name} : ${shopUrl()}`;
      try { await navigator.clipboard.writeText(txt); toast('Message copié, collez-le sur WhatsApp', 'success'); } catch { window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank', 'noopener'); }
      break;
    }
    case 'del-promo': {
      const p = A.promos.find((x) => x.id === d.id);
      if (!(await ask(`Supprimer le code <b>${esc(p.code)}</b> ? Les commandes déjà passées gardent leur remise.`, { ok: 'Supprimer', danger: true }))) { promoForm(p); return; }
      try { await A.api.deletePromo(p.id); await loadPromos(); toast('Code supprimé', 'success'); render(false); } catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    case 'open-day': e.preventDefault(); openDay(d.d); break;
    case 'hist-range': A.hr = d.r; render(false); break;
    case 'hist-csv': histCsv(); break;
    case 'day-csv': dayCsv(d.d); break;
    case 'add-zone': await A.api.saveZone({ name: 'Nouvelle zone', fee: 1000, active: true, position: (A.cat.zones || []).length + 1 }); A.cat = await A.api.adminCatalog(); render(false); break;
    case 'del-zone': if (await ask('Supprimer cette zone de livraison ?', { ok: 'Supprimer', danger: true })) { await A.api.deleteZone(d.id); A.cat = await A.api.adminCatalog(); toast('Zone supprimée', 'success'); render(false); } break;
    case 'export': exportCsv(); break;
    case 'print': window.print(); break;
    case 'print-ticket': document.body.classList.add('print-ticket'); window.print(); setTimeout(() => document.body.classList.remove('print-ticket'), 500); break;
    case 'prod-day': A.prodDay = d.d; render(false); break;
    case 'move': {
      const ps = [...A.cat.products].sort((x, y) => x.position - y.position); const i = ps.findIndex((p) => p.id === d.id); const j = i + Number(d.d);
      if (j < 0 || j >= ps.length) return; [ps[i], ps[j]] = [ps[j], ps[i]]; ps.forEach((p, k) => { p.position = k + 1; }); render(false);
      try { await A.api.reorderProducts(ps.map((p) => p.id)); } catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    case 'new-product': productForm(null); break;
    case 'edit-product': productForm(A.cat.products.find((p) => p.id === d.id)); break;
    case 'add-fmt': readFormats(); draft.formats.push({ name: '', price: 0, stock: null, active: true }); renderFormats(); $$('#fmts [data-f=name]').pop().focus(); break;
    case 'rm-fmt': readFormats(); draft.formats.splice(Number(d.i), 1); renderFormats(); break;
    case 'rm-img': draft.image_url = null; $('#pimg').innerHTML = icon('bowl'); t.remove(); break;
    case 'save-product': saveProduct(); break;
    case 'del-product': {
      const p = A.cat.products.find((x) => x.id === d.id);
      if (!(await ask(`Supprimer définitivement « ${esc(p.name)} » ? Les commandes passées restent intactes. Pour le retirer temporairement, désactivez plutôt « En ligne ».`, { ok: 'Supprimer', danger: true }))) { productForm(p); return; }
      try { await A.api.deleteProduct(p.id); A.cat = await A.api.adminCatalog(); toast('Produit supprimé', 'success'); render(false); } catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    case 'rm-slot': {
      if (S().slot_times.length <= 1) return toast('Gardez au moins un créneau', 'error');
      await saveSettingsPatch({ slot_times: S().slot_times.filter((x) => x !== d.s) }, `Créneau ${fmtSlot(d.s)} retiré`); break;
    }
    case 'weekday': {
      const n = Number(d.d); const w = S().closed_weekdays.includes(n) ? S().closed_weekdays.filter((x) => x !== n) : [...S().closed_weekdays, n];
      if (w.length >= 7) return toast('Au moins un jour doit rester ouvert', 'error');
      await saveSettingsPatch({ closed_weekdays: w }, 'Jours de fermeture mis à jour'); break;
    }
    case 'toggle-slot': {
      const off = A.cat.closedSlots.some((c) => c.day === d.d && c.slot === d.s);
      try { await A.api.setClosedSlot(d.d, d.s, !off); A.cat = await A.api.adminCatalog(); render(false); toast(`${relDay(d.d)} ${fmtSlot(d.s)} : ${off ? 'ouvert' : 'fermé'}`, 'success', 1800); } catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    case 'logout': await A.api.signOut(); A.unsub?.(); location.reload(); break;
    case 'toggle-sound':
      A.sound = !A.sound; store.set('ns-adm-sound', A.sound); soundBtn();
      if (A.sound) { chime(); if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); }
      toast(A.sound ? 'Son des nouvelles commandes activé' : 'Son désactivé', 'info', 1800); break;
    case 'reset-demo':
      if (!(await ask('Réinitialiser toutes les données de démonstration ?', { ok: 'Réinitialiser', danger: true }))) return;
      (await getApi()).resetDemo?.(); location.reload(); break;
    case 'copy-url': try { await navigator.clipboard.writeText($('#shop-url').value); toast('Lien copié', 'success', 1600); } catch { $('#shop-url').select(); } break;
    case 'forgot': {
      const email = $('#login-form').email.value.trim(); if (!email) { $('#login-err').hidden = false; $('#login-err').textContent = 'Saisissez votre e-mail puis cliquez à nouveau.'; return; }
      try { await A.api.resetPassword(email); toast('Un e-mail de réinitialisation vous a été envoyé', 'success', 5000); } catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    default:
  }
});
document.addEventListener('change', async (e) => {
  const t = e.target; const d = t.dataset;
  if (t.id === 'accepting') {
    const v = t.checked;
    if (!v && !(await ask('Suspendre les commandes en ligne ? Les clients verront un message et ne pourront plus commander jusqu’à la réouverture.', { ok: 'Suspendre', danger: true }))) { t.checked = true; return; }
    await saveSettingsPatch({ accepting_orders: v }, v ? 'Boutique ouverte aux commandes' : 'Commandes suspendues'); return;
  }
  switch (d.action) {
    case 'date': if (t.value) { A.f.range = 'date'; A.f.date = t.value; render(false); } break;
    case 'prod-date': if (t.value) { A.prodDay = t.value; render(false); } break;
    case 'h-from': if (t.value) { A.hFrom = t.value; render(false); } break;
    case 'toggle-promo': {
      const p = A.promos.find((x) => x.id === d.id);
      try { await A.api.savePromo({ ...p, active: t.checked }); p.active = t.checked; toast(`Code ${p.code} ${t.checked ? 'activé' : 'désactivé'}`, 'success', 1800); render(false); } catch (err) { toast(errMsg(err), 'error'); t.checked = !t.checked; }
      break;
    }
    case 'loyal-on': await saveSettingsPatch({ loyalty_enabled: t.checked }, t.checked ? 'Fidélité activée' : 'Fidélité désactivée'); break;
    case 'loyal-rate': await saveSettingsPatch({ loyalty_rate: Math.max(10, Math.round(Number(t.value) || 100)) }, 'Taux de points enregistré'); break;
    case 'auto-hours': await saveSettingsPatch({ auto_hours: t.checked }, t.checked ? 'Horaires automatiques activés' : 'Horaires automatiques désactivés'); break;
    case 'reward': {
      const row = t.closest('[data-reward]'); const r = A.rewards.find((x) => x.id === row.dataset.reward);
      const v = { ...r, name: $('[data-f=name]', row).value.trim() || r.name, cost: Math.max(1, Math.round(Number($('[data-f=cost]', row).value) || r.cost)), active: $('[data-f=active]', row).checked };
      try { await A.api.saveReward(v); Object.assign(r, v); toast('Cadeau enregistré', 'success', 1500); } catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    case 'promos-on': await saveSettingsPatch({ promos_enabled: t.checked }, t.checked ? 'Codes promo activés' : 'Codes promo désactivés'); break;
    case 'h-to': if (t.value) { A.hTo = t.value; render(false); } break;
    case 'zone': {
      const row = t.closest('[data-zone]'); const z = (A.cat.zones || []).find((x) => x.id === row.dataset.zone);
      const name = $('[data-f=zname]', row).value.trim(); const fee = Math.max(0, Math.round(Number($('[data-f=zfee]', row).value) || 0));
      if (!name) return toast('Nom de zone obligatoire', 'error');
      try { await A.api.saveZone({ ...z, name, fee, active: $('[data-f=zactive]', row).checked }); A.cat = await A.api.adminCatalog(); toast('Zone enregistrée', 'success', 1600); } catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    case 'paid': await patchOrder(d.id, { paid: t.checked }, t.checked ? 'Paiement encaissé' : 'Paiement non encaissé'); break;
    case 'pay-method': await patchOrder(d.id, { payment_method: t.value }, 'Moyen de paiement mis à jour'); break;
    case 'toggle-prod': {
      const p = A.cat.products.find((x) => x.id === d.id); p[d.k] = t.checked;
      try { await A.api.patchProduct(p.id, { [d.k]: t.checked }); toast(`${p.name} : ${d.k === 'active' ? (t.checked ? 'en ligne' : 'masqué') : (t.checked ? 'mis en avant' : 'retiré des favoris')}`, 'success', 1800); render(false); }
      catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    case 'day-open': {
      if (!t.checked) {
        const n = A.orders.filter((o) => o.pickup_day === d.d && ACTIVE.includes(o.status)).length;
        if (n && !(await ask(`${n} commande(s) sont déjà prévues ce jour-là. Elles ne seront pas annulées automatiquement : pensez à prévenir les clients. Fermer quand même ?`, { ok: 'Fermer ce jour' }))) { t.checked = true; return; }
      }
      try { await A.api.setClosedDate(d.d, !t.checked, ''); A.cat = await A.api.adminCatalog(); render(false); } catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    case 'pick-img': {
      const file = t.files?.[0]; if (!file) return;
      const prev = $('#pimg'); prev.innerHTML = '<div class="spinner" style="margin:0"></div>';
      try { const blob = await resizeImage(file, 900); draft.image_url = await A.api.uploadImage(blob); prev.innerHTML = `<img src="${esc(draft.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:16px">`; }
      catch (err) { toast(errMsg(err), 'error'); prev.innerHTML = icon('bowl'); }
      break;
    }
    default:
  }
  if (t.closest('#rules')) {
    const fd = new FormData($('#rules'));
    const patch = { slot_capacity: Math.max(1, Math.min(500, Number(fd.get('slot_capacity')) || 1)), lead_minutes: Math.max(0, Math.min(1440, Number(fd.get('lead_minutes')) || 0)), days_ahead: Math.max(1, Math.min(30, Number(fd.get('days_ahead')) || 1)) };
    await saveSettingsPatch(patch, 'Règles enregistrées');
  }
});
document.addEventListener('change', (e) => { if (e.target.name === 'kind' && $('#val-unit')) $('#val-unit').textContent = e.target.value === 'percent' ? '(%)' : '(FCFA)'; });
document.addEventListener('input', debounce((e) => {
  if (e.target.dataset.action === 'search') { A.f.q = e.target.value; render(false); }
  if (e.target.dataset.action === 'client-search') { A.cq = e.target.value; render(false); const i = $('[data-action=client-search]'); i?.focus(); i?.setSelectionRange(i.value.length, i.value.length); }
}, 250));
document.addEventListener('submit', async (e) => {
  const f = e.target; e.preventDefault();
  if (f.id === 'login-form') return login(f);
  if (f.id === 'settings') return saveSettings(f);
  if (f.id === 'loyal-search') { const ph = normalizePhone(new FormData(f).get('phone')); if (!ph) return toast('Numéro invalide', 'error'); return lookupLoyal(ph); }
  if (f.id === 'hours-form') {
    const fd = new FormData(f); const hours = {};
    for (const d of [0, 1, 2, 3, 4, 5, 6]) { const o = fd.get(`o${d}`), c = fd.get(`c${d}`); if (!fd.get(`on${d}`)) { hours[d] = null; continue; } if (!o || !c || o >= c) return toast('Pour chaque jour ouvert, l’heure de fermeture doit être après l’ouverture', 'error'); hours[d] = [o, c]; }
    return saveSettingsPatch({ hours }, 'Horaires enregistrés');
  }
  if (f.id === 'add-slot') {
    const s = normalizeSlot(f.t.value); if (!s) return toast('Heure invalide', 'error');
    if (S().slot_times.includes(s)) return toast('Ce créneau existe déjà', 'error');
    return saveSettingsPatch({ slot_times: sortSlots([...S().slot_times, s]) }, `Créneau ${fmtSlot(s)} ajouté`);
  }
  if (f.id === 'pwd') {
    try { await A.api.changePassword(f.p.value); f.reset(); toast('Mot de passe modifié', 'success'); } catch (err) { toast(errMsg(err), 'error'); }
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modal').hidden) { const c = $('#modal [data-ask="0"]'); if (c) c.click(); else closeModal(); }
  if (e.key === 'Tab' && !$('#modal').hidden) { // garde le focus dans la fenêtre
    const els = $$('#modal button:not([disabled]), #modal a[href], #modal input, #modal select, #modal textarea'); if (!els.length) return;
    const [first, last] = [els[0], els[els.length - 1]];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
window.addEventListener('hashchange', () => { if (!$('#modal').hidden) closeModal(); render(true); });

// ---------------------------------------------------------------------------
// Connexion et démarrage
// ---------------------------------------------------------------------------
async function login(form) {
  const err = $('#login-err'); err.hidden = true; const b = $('button[type=submit]', form); b.classList.add('is-loading');
  try {
    await A.api.signIn(form.email.value.trim(), form.password.value);
    if (!(await A.api.isAdmin())) { await A.api.signOut(); throw new Error('NS_AUTH: Ce compte n’a pas accès au back-office.'); }
    await start();
  } catch (e) { err.hidden = false; err.textContent = errMsg(e); } finally { b.classList.remove('is-loading'); }
}
async function start() {
  $('#login').hidden = true; $('#app').hidden = false; $('#page').innerHTML = '<div class="spinner"></div>';
  A.email = await A.api.userEmail();
  await loadAll(); updateBadges(); soundBtn(); subscribe(); render(true);
  // Filet de sécurité : resynchronisation complète toutes les 2 minutes et au retour sur l'onglet
  setInterval(resync, 120000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resync(); });
  setInterval(() => { if (routeName() === 'commandes' && $('#modal').hidden) render(false); }, 60000); // rafraîchit les « il y a x min »
}
async function resync() {
  try {
    const before = new Set(A.orders.map((o) => o.id));
    await loadAll();
    A.orders.filter((o) => !before.has(o.id)).forEach((o) => { A.seen.delete(o.id); onNewOrder(o); });
    updateBadges(); if ($('#modal').hidden) render(false);
  } catch { /* hors ligne */ }
}
async function boot() {
  if (IS_DEMO) { $('#demo').hidden = false; $('#demo-hint').hidden = false; }
  try { A.api = await getApi(); } catch (e) { document.body.innerHTML = `<div class="empty"><h3>Chargement impossible</h3><p>${esc(errMsg(e))}</p></div>`; return; }
  if (A.api.offline) {
    $('#login').hidden = false;
    $('#login-form').innerHTML = `<img src="assets/img/logo.webp" alt="" width="84" height="84"><h1>Installation à terminer</h1>
      <p class="hint" style="margin:8px 0 14px">La base de données de la boutique n’est pas encore installée dans Supabase. En attendant, les clients commandent par WhatsApp.</p>
      <ol style="text-align:left;font-size:14.5px;line-height:1.6;margin:0 0 16px;padding-left:20px"><li>Ouvrez l’éditeur SQL du projet <b>gounass-luxury</b></li><li>Collez le fichier <code>nekh-soow/supabase/installer.sql</code></li><li>Cliquez sur <b>Run</b>, puis rechargez cette page</li></ol>
      <a class="btn btn-block" href="https://supabase.com/dashboard/project/ejutptsipygbnobkrowt/sql/new" target="_blank" rel="noopener">Ouvrir l’éditeur SQL</a>
      <a class="link" href="./">← Retour à la boutique</a>`;
    return;
  }
  const ses = await A.api.session();
  if (ses && (await A.api.isAdmin().catch(() => false))) await start();
  else { $('#login').hidden = false; $('#login-form').email.focus(); }
  A.api.onAuth((evt) => { if (evt === 'SIGNED_OUT') location.reload(); });
}
boot();
