// Boutique Arrêt nekh soow — application monopage (routage par ancre, compatible bouton Retour).
import { CONFIG } from './config.js';
import { getApi, IS_DEMO } from './api.js';
import {
  $, $$, esc, money, store, toast, errMsg, dakarNow, addDays, relDay, fmtDay, fmtSlot, fmtPhone, fmtDateTime,
  openDays, slotStates, normalizePhone, waLink, ST, STATUSES, icsFor, download, debounce,
} from './util.js';

const CART_KEY = 'ns-cart';
const ME_KEY = 'ns-me';
const MY_KEY = 'ns-my-orders';

const S = {
  api: null,
  cat: null,            // { settings, products, closedDates, closedSlots }
  load: [],             // occupation des créneaux
  sel: {},              // choix en cours sur chaque fiche : { [productId]: { fid, qty } }
  filter: 'TOUT',
  co: { day: null, slot: null, payment: 'retrait', mode: 'retrait', zone: null, address: '', busy: false },
  user: null,
  timers: [],
};
let cart = store.get(CART_KEY, []);

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------
const settings = () => S.cat.settings;
const products = () => S.cat.products.filter((p) => p.active && p.formats.some((f) => f.active));
function findFormat(fid) {
  for (const p of S.cat.products) { const f = p.formats.find((x) => x.id === fid && x.active); if (f && p.active) return { p, f }; }
  return null;
}
const cartLines = () => cart.map((l) => ({ ...l, ...findFormat(l.fid) })).filter((l) => l.p);
const cartCount = () => cartLines().reduce((a, l) => a + l.qty, 0);
const cartTotal = () => cartLines().reduce((a, l) => a + l.f.price * l.qty, 0);
const saveCart = () => { store.set(CART_KEY, cart); renderCartBadge(true); };
const baseUrl = () => (CONFIG.SITE_URL || location.origin + location.pathname).replace(/#.*$/, '');
const trackUrl = (token) => `${baseUrl()}#/suivi/${token}`;

async function refreshLoad() {
  const t = dakarNow().day;
  try { S.load = await S.api.getSlotLoad(t, addDays(t, 31)); } catch { /* garde la dernière valeur connue */ }
}

function nextSlot() {
  for (const day of openDays(settings(), S.cat.closedDates)) {
    const s = slotStates(day, settings(), S.cat.closedSlots, S.load).find((x) => x.state === 'ok' || x.state === 'few');
    if (s) return { day, slot: s.slot };
  }
  return null;
}

/** Vérifie le panier contre le catalogue réel (produit retiré, format supprimé, stock). */
function sanitizeCart() {
  const before = cart.length;
  cart = cart.filter((l) => findFormat(l.fid)).map((l) => {
    const { f } = findFormat(l.fid);
    const max = f.stock == null ? 99 : f.stock;
    return { ...l, qty: Math.min(Math.max(1, l.qty), max) };
  }).filter((l) => l.qty > 0);
  if (cart.length !== before) toast('Un article de votre panier n’est plus disponible et a été retiré.', 'info', 4500);
  saveCart();
}

// ---------------------------------------------------------------------------
// Composants
// ---------------------------------------------------------------------------
const icon = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
const media = (p, cls = '') => (p.image_url
  ? `<img class="${cls}" src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="600" height="450">`
  : `<div class="emoji ${cls}" role="img" aria-label="${esc(p.name)}">${esc(p.emoji || '🍽️')}</div>`);

function productCard(p) {
  const fs = p.formats.filter((f) => f.active);
  const sel = S.sel[p.id] || (S.sel[p.id] = { fid: (fs.find((f) => f.stock !== 0) || fs[0]).id, qty: 1 });
  if (!fs.some((f) => f.id === sel.fid)) sel.fid = fs[0].id;
  const f = fs.find((x) => x.id === sel.fid);
  const out = f.stock === 0; const allOut = fs.every((x) => x.stock === 0);
  const max = f.stock == null ? 99 : f.stock;
  const low = f.stock != null && f.stock > 0 && f.stock <= 5;
  return `<article class="product reveal ${allOut ? 'unavailable' : ''}" data-pid="${p.id}" style="transition-delay:${(S.cardIdx = ((S.cardIdx || 0) + 1) % 3) * 90}ms">
    <div class="media">${media(p)}
      ${allOut ? '<span class="tag">Épuisé</span>' : p.popular ? '<span class="tag gold">★ Populaire</span>' : ''}
    </div>
    <div class="body">
      <div><h3>${esc(p.name)}</h3><p class="desc">${esc(p.description)}</p></div>
      <div class="formats" role="group" aria-label="Format">
        ${fs.map((x) => `<button type="button" data-action="fmt" data-pid="${p.id}" data-fid="${x.id}" aria-pressed="${x.id === sel.fid}" ${x.stock === 0 ? 'disabled' : ''}>
          <b>${esc(x.name)}</b><span>${money(x.price)}</span></button>`).join('')}
      </div>
      ${low ? `<small class="hint">Plus que ${f.stock} disponible${f.stock > 1 ? 's' : ''}</small>` : ''}
      <div class="buy">
        <div class="qty-row">
          <div class="stepper" role="group" aria-label="Quantité">
            <button type="button" data-action="qty" data-pid="${p.id}" data-d="-1" aria-label="Retirer un" ${sel.qty <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
            <output aria-live="polite">${sel.qty}</output>
            <button type="button" data-action="qty" data-pid="${p.id}" data-d="1" aria-label="Ajouter un" ${sel.qty >= max ? 'disabled' : ''}>${icon('plus')}</button>
          </div>
          <span class="line-total">${money(f.price * sel.qty)}</span>
        </div>
        <button class="btn" type="button" data-action="add" data-pid="${p.id}" ${out ? 'disabled' : ''}>${out ? 'Épuisé' : 'Ajouter à ma commande'}</button>
      </div>
    </div>
  </article>`;
}
const skeletonGrid = (n = 3) => `<div class="products">${Array.from({ length: n }, () => '<div class="skeleton skel-product"></div>').join('')}</div>`;

function heroChip() {
  const s = settings();
  if (!s.accepting_orders) return '<span class="hero-chip closed"><span class="dot"></span>Commandes en ligne suspendues</span>';
  const n = nextSlot();
  if (!n) return '<span class="hero-chip closed"><span class="dot"></span>Aucun créneau libre pour le moment</span>';
  return `<span class="hero-chip"><span class="dot"></span>Prochain retrait : ${relDay(n.day).toLowerCase()} à ${fmtSlot(n.slot)}</span>`;
}
function statusEyebrow() {
  const s = settings();
  if (!s.accepting_orders) return '<span class="eyebrow closed"><span class="dot"></span>Commandes en ligne suspendues</span>';
  const n = nextSlot();
  if (!n) return '<span class="eyebrow closed"><span class="dot"></span>Aucun créneau libre pour le moment</span>';
  return `<span class="eyebrow"><span class="dot"></span>Ouvert aux commandes · prochain retrait ${n.day === dakarNow().day ? 'à' : relDay(n.day).toLowerCase() + ' à'} ${fmtSlot(n.slot)}</span>`;
}

// ---------------------------------------------------------------------------
// Vues
// ---------------------------------------------------------------------------
function viewHome() {
  const s = settings(); const pop = products().filter((p) => p.popular).slice(0, 6);
  const imgs = products().filter((p) => p.image_url);
  return `<div class="view">
  <section><div class="wrap">
    <div class="hero-card">
      <img class="logo-hero" src="assets/img/logo-hero.webp" alt="Arrêt nekh soow" width="130" height="130" fetchpriority="high">
      <h1 class="split">${esc(s.shop_name).split(' ').map((w, i) => `<span style="animation-delay:${0.25 + i * 0.12}s">${w}</span>`).join(' ')}</h1>
      <p>${esc(s.tagline)}</p>
      ${heroChip()}
      <a class="btn btn-gold" href="#/menu">COMMANDER MAINTENANT</a>
    </div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="sec-head"><div><h2>Nos produits populaires</h2><p>Préparés le jour même, servis bien frais.</p></div><a class="link-arrow" href="#/menu">Toute la carte ${icon('arrow')}</a></div>
    <div class="products">${pop.map(productCard).join('') || '<p class="empty">La carte arrive bientôt.</p>'}</div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="sec-head"><h2>Comment ça marche ?</h2></div>
    <ol class="steps">
      <li class="reveal"><h3>Choisissez vos produits</h3><p>Soow, thiakry, ngallakh… en petit ou en grand format.</p></li>
      <li class="reveal"><h3>Réservez votre heure</h3><p>Aujourd’hui ou les jours suivants, selon les créneaux disponibles.</p></li>
      <li class="reveal"><h3>Récupérez sans attendre</h3><p>Votre commande est prête à votre arrivée. Vous payez sur place.</p></li>
    </ol>
    <p style="margin-top:16px"><a class="btn btn-block btn-lg" href="#/menu">COMMANDER MAINTENANT</a></p>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="story reveal">
      ${imgs[2] ? `<img src="${esc(imgs[2].image_url)}" alt="" loading="lazy">` : '<div></div>'}
      <div class="txt"><span class="eyebrow" style="justify-self:start">Notre histoire</span><h2>Des recettes de famille, préparées avec soin.</h2><p>${esc(s.story)}</p><p class="sig">— L’équipe ${esc(s.shop_name)}</p></div>
    </div>
  </div></section>

  <section class="section"><div class="wrap">${infoCards()}</div></section>
  </div>`;
}

function infoCards() {
  const s = settings();
  return `<div class="infos">
    <a class="info reveal" href="${esc(s.maps_url)}" target="_blank" rel="noopener">${icon('pin')}<div><b>Adresse</b><span>${esc(s.address)}</span></div></a>
    <div class="info reveal">${icon('clock')}<div><b>Horaires de retrait</b><span>${esc(s.opening_hours)}</span></div></div>
    <a class="info reveal" href="tel:+221${esc(s.phone)}">${icon('phone')}<div><b>Téléphone</b><span>${esc(fmtPhone(s.phone))}</span></div></a>
  </div>`;
}

function viewMenu() {
  const list = products();
  const cats = ['TOUT', ...new Set(list.map((p) => p.category))];
  if (!cats.includes(S.filter)) S.filter = 'TOUT';
  const shown = list.filter((p) => S.filter === 'TOUT' || p.category === S.filter);
  const label = (c) => (c === 'TOUT' ? 'Tout' : c.charAt(0) + c.slice(1).toLowerCase());
  return `<div class="view"><div class="wrap">
    <div class="page-head"><h1 class="page-title">La carte</h1><p>Choisissez le format et la quantité, puis ajoutez au panier.</p></div>
    <div class="filters"><div class="chips" role="group" aria-label="Catégories">
      ${cats.map((c) => `<button class="chip" type="button" data-action="filter" data-cat="${esc(c)}" aria-pressed="${S.filter === c}">${esc(label(c))}<span class="count">${c === 'TOUT' ? list.length : list.filter((p) => p.category === c).length}</span></button>`).join('')}
    </div></div>
    <div class="products">${shown.map(productCard).join('') || '<div class="empty"><div class="big">🍽️</div><h3>Aucun produit</h3></div>'}</div>
  </div></div>`;
}

const zones = () => (S.cat.zones || []).filter((z) => z.active);
const deliveryOn = () => settings().delivery_enabled && zones().length > 0;
const coFee = () => (S.co.mode === 'livraison' ? (zones().find((z) => z.id === S.co.zone)?.fee || 0) : 0);
const waveUrl = (amount) => { const l = settings().wave_link; if (!l) return ''; return `${l}${l.includes('?') ? '&' : '?'}amount=${Math.round(amount)}`; };

function viewCheckout() {
  const lines = cartLines(); const s = settings();
  if (!lines.length) {
    return `<div class="view"><div class="wrap"><div class="empty" style="padding-top:60px"><div class="big">🛍️</div><h3>Votre panier est vide</h3><p>Ajoutez quelques douceurs avant de commander.</p><p style="margin-top:18px"><a class="btn" href="#/menu">Voir les produits</a></p></div></div></div>`;
  }
  if (!s.accepting_orders) {
    return `<div class="view"><div class="wrap"><div class="empty" style="padding-top:60px"><div class="big">⏸️</div><h3>Commandes en ligne suspendues</h3><p>${esc(s.announcement || 'Revenez un peu plus tard ou contactez-nous sur WhatsApp.')}</p><p style="margin-top:18px"><a class="btn btn-wa" href="${waLink(s.whatsapp)}" target="_blank" rel="noopener">${icon('wa')} Nous écrire</a></p></div></div></div>`;
  }
  if (!deliveryOn()) S.co.mode = 'retrait';
  const me = S.user || store.get(ME_KEY, {});
  const z = zones();
  if (S.co.mode === 'livraison' && !z.find((x) => x.id === S.co.zone)) S.co.zone = z[0]?.id || null;
  const minFee = z.length ? Math.min(...z.map((x) => x.fee)) : 0;
  return `<div class="view"><div class="wrap">
    <div class="page-head"><a class="back" href="#/menu">${icon('back')} Continuer mes achats</a><h1 class="page-title">Finaliser la commande</h1></div>
    ${S.user ? '' : `<a class="login-hint" href="#/compte">👤 <span><b>Vous avez un compte ?</b> Connectez-vous pour remplir vos informations automatiquement (facultatif).</span></a>`}
    <form class="checkout" id="co-form" novalidate>
      <div>
        <section class="co-step" aria-labelledby="h-mode"><h2 id="h-mode"><span class="n">1</span>Retrait ou livraison ?</h2>
          <div class="mode-opts">
            <label class="mode-opt"><input type="radio" name="mode" value="retrait" ${S.co.mode !== 'livraison' ? 'checked' : ''}><span class="mi">🏪</span><b>Retrait sur place</b><small>Gratuit · ${esc(s.address)}</small></label>
            <label class="mode-opt ${deliveryOn() ? '' : 'off'}"><input type="radio" name="mode" value="livraison" ${S.co.mode === 'livraison' ? 'checked' : ''} ${deliveryOn() ? '' : 'disabled'}><span class="mi">🛵</span><b>Livraison à domicile</b><small>${deliveryOn() ? `À partir de ${money(minFee)}` : 'Indisponible pour le moment'}</small></label>
          </div>
          <div id="delivery-box" class="delivery-box" ${S.co.mode === 'livraison' ? '' : 'hidden'}>
            <label class="field"><span>Zone de livraison</span><select name="zone">${z.map((x) => `<option value="${x.id}" ${x.id === S.co.zone ? 'selected' : ''}>${esc(x.name)} — ${x.fee ? money(x.fee) : 'gratuit'}</option>`).join('')}</select></label>
            <label class="field" id="f-addr"><span>Adresse de livraison</span><textarea name="address" rows="2" maxlength="300" placeholder="Quartier, rue, repère (ex : Cité Lamy, villa 12, près de la pharmacie)">${esc(S.co.address || '')}</textarea><em class="err" hidden></em></label>
            <p class="hint">🛵 ${esc(s.delivery_info)}</p>
          </div>
        </section>
        <section class="co-step" aria-labelledby="h-slot"><h2 id="h-slot"><span class="n" id="n1">2</span><span id="slot-title">${S.co.mode === 'livraison' ? 'Quand souhaitez-vous être livré(e) ?' : 'Quand passez-vous la récupérer ?'}</span></h2><div id="slot-picker"></div></section>
        <section class="co-step" aria-labelledby="h-me"><h2 id="h-me"><span class="n">3</span>Vos coordonnées</h2>
          <label class="field" id="f-name"><span>Nom et prénom</span><input name="name" autocomplete="name" required maxlength="80" value="${esc(me.name || '')}" placeholder="Ex : Awa Diop"><em class="err" hidden></em></label>
          <div class="field" id="f-phone"><span id="lbl-phone">Numéro WhatsApp / téléphone</span>
            <div class="input-group"><span>+221</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel-national" required aria-labelledby="lbl-phone" placeholder="77 123 45 67" value="${esc(fmtPhone(me.phone || ''))}"></div>
            <small>Nous vous prévenons sur ce numéro quand votre commande est prête.</small><em class="err" hidden></em></div>
          <label class="field"><span>Note pour la cuisine <small>(facultatif)</small></span><textarea name="note" maxlength="500" placeholder="Ex : bien frais, sans raisins secs…"></textarea></label>
          ${S.user ? '' : `<label class="check"><input type="checkbox" name="remember" ${me.name ? 'checked' : ''}> Se souvenir de mes coordonnées sur cet appareil</label>`}
        </section>
        <section class="co-step" aria-labelledby="h-pay"><h2 id="h-pay"><span class="n">4</span>Paiement</h2>
          <div class="pay-opts" id="pay-opts"></div>
        </section>
      </div>
      <aside class="summary"><div class="card">
        <h2>Récapitulatif</h2>
        ${lines.map((l) => `<div class="sum-line"><span>${l.qty} × ${esc(l.p.name)} <small>(${esc(l.f.name)})</small></span><b>${money(l.f.price * l.qty)}</b></div>`).join('')}
        <div id="sum-pick"></div>
        <div class="totals" id="sum-totals"></div>
        <button class="btn btn-block btn-lg btn-gold" type="submit" id="co-submit">Confirmer ma commande</button>
        <p class="legal">En confirmant, vous acceptez d’être contacté(e) au sujet de cette commande. <a href="#/confidentialite">Confidentialité</a></p>
      </div></aside>
    </form>
  </div></div>`;
}

function renderPayOpts() {
  const box = $('#pay-opts'); if (!box) return; const s = settings(); const liv = S.co.mode === 'livraison';
  const opts = [['retrait', liv ? 'À la livraison' : 'Au retrait', liv ? 'Espèces, Wave ou Orange Money à la réception' : 'Espèces, Wave ou Orange Money sur place']];
  if (s.wave_link) opts.push(['wave', 'Wave · payer maintenant', 'Un bouton de paiement Wave s’affiche après la commande, avec le montant déjà rempli']);
  opts.push(['orange_money', 'Orange Money', `Envoyez le montant au ${fmtPhone(s.phone)} et présentez la confirmation`]);
  if (!opts.some(([k]) => k === S.co.payment)) S.co.payment = 'retrait';
  box.innerHTML = opts.map(([k, t, d]) => `<label class="pay-opt ${k === 'wave' ? 'wave' : ''}"><input type="radio" name="payment" value="${k}" ${S.co.payment === k ? 'checked' : ''}><div><b>${k === 'wave' ? '<span class="wave-logo">Wave</span> ' : ''}${t.replace(/^Wave · /, '')}</b><small>${esc(d)}</small></div></label>`).join('');
}
function renderTotals() {
  const el = $('#sum-totals'); if (!el) return; const sub = cartTotal(); const fee = coFee();
  el.innerHTML = `<div class="row"><span>Sous-total</span><span>${money(sub)}</span></div>
    ${S.co.mode === 'livraison' ? `<div class="row"><span>Livraison</span><span>${fee ? money(fee) : 'Gratuite'}</span></div>` : ''}
    <div class="row grand"><span>Total</span><span class="count-up">${money(sub + fee)}</span></div>`;
}

function renderSlotPicker() {
  const box = $('#slot-picker'); if (!box) return;
  const s = settings(); const days = openDays(s, S.cat.closedDates);
  const daysInfo = days.map((d) => { const st = slotStates(d, s, S.cat.closedSlots, S.load); return { d, free: st.filter((x) => x.state === 'ok' || x.state === 'few').length }; });
  if (!daysInfo.some((x) => x.free)) {
    box.innerHTML = `<div class="empty"><div class="big">📅</div><h3>Aucun créneau disponible</h3><p>Tous nos créneaux sont complets. Écrivez-nous sur WhatsApp, on trouvera une solution.</p></div>`;
    updatePick(); return;
  }
  if (!S.co.day || !daysInfo.find((x) => x.d === S.co.day && x.free)) { S.co.day = daysInfo.find((x) => x.free).d; S.co.slot = null; }
  const states = slotStates(S.co.day, s, S.cat.closedSlots, S.load);
  if (S.co.slot && !states.find((x) => x.slot === S.co.slot && (x.state === 'ok' || x.state === 'few'))) {
    toast('Le créneau choisi n’est plus disponible, merci d’en choisir un autre.', 'error'); S.co.slot = null;
  }
  const lab = { past: 'Passé', closed: 'Fermé', full: 'Complet' };
  box.innerHTML = `<div class="days" role="group" aria-label="Jour">
    ${daysInfo.map(({ d, free }) => `<button type="button" class="day ${free ? '' : 'full'}" data-action="day" data-day="${d}" aria-pressed="${d === S.co.day}" ${free ? '' : 'disabled'}>
      <b>${relDay(d).split(' ')[0]}</b><span>${fmtDay(d, { day: 'numeric', month: 'short' })}${free ? '' : ' · complet'}</span></button>`).join('')}
  </div>
  <div class="slots" role="group" aria-label="Heure">
    ${states.map((x, i) => {
      const ok = x.state === 'ok' || x.state === 'few';
      return `<button type="button" class="slot ${x.state}" style="animation-delay:${i * 35}ms" data-action="slot" data-slot="${x.slot}" aria-pressed="${x.slot === S.co.slot}" ${ok ? '' : 'disabled'}>
        <b>${fmtSlot(x.slot)}</b><span>${ok ? (x.state === 'few' ? `Plus que ${x.left}` : 'Disponible') : lab[x.state]}</span></button>`;
    }).join('')}
  </div>`;
  updatePick();
}
function updatePick() {
  const el = $('#sum-pick'); if (!el) return; const liv = S.co.mode === 'livraison';
  const zone = zones().find((z) => z.id === S.co.zone);
  el.innerHTML = S.co.slot
    ? `<div class="sum-pick">${icon('cal')}<div>${liv ? 'Livraison' : 'Retrait'} <b>${relDay(S.co.day).toLowerCase()}</b> à <b>${fmtSlot(S.co.slot)}</b><br><small>${liv ? esc(zone?.name || '') : esc(settings().address)}</small></div></div>`
    : `<div class="sum-pick" style="background:var(--amber-s)">${icon('clock')}<div>Choisissez une heure de ${liv ? 'livraison' : 'retrait'}</div></div>`;
  $('#n1')?.classList.toggle('done', !!S.co.slot);
  if ($('#n1')) $('#n1').innerHTML = S.co.slot ? icon('check') : '2';
  renderTotals();
}
function setMode(mode) {
  S.co.mode = mode; const liv = mode === 'livraison';
  const box = $('#delivery-box'); if (box) box.hidden = !liv;
  if (liv && !S.co.zone) S.co.zone = zones()[0]?.id || null;
  const t = $('#slot-title'); if (t) t.textContent = liv ? 'Quand souhaitez-vous être livré(e) ?' : 'Quand passez-vous la récupérer ?';
  renderPayOpts(); updatePick();
}

function setFieldError(id, msg) {
  const f = $(id); if (!f) return;
  f.classList.toggle('invalid', !!msg); const e = $('.err', f); e.hidden = !msg; e.textContent = msg || '';
}

async function submitOrder(form) {
  if (S.co.busy) return;
  const fd = new FormData(form);
  const name = String(fd.get('name') || '').trim(); const phone = normalizePhone(fd.get('phone'));
  const liv = S.co.mode === 'livraison'; const address = String(fd.get('address') || '').trim();
  let bad = false;
  setFieldError('#f-name', name.length < 2 ? 'Indiquez votre nom' : ''); if (name.length < 2) bad = true;
  setFieldError('#f-phone', phone ? '' : 'Numéro invalide : 9 chiffres commençant par 70, 75, 76, 77, 78 ou 33'); if (!phone) bad = true;
  if (liv) { setFieldError('#f-addr', address.length < 5 ? 'Indiquez votre adresse (quartier, rue, repère)' : ''); if (address.length < 5) bad = true; }
  if (!S.co.slot) { toast(`Choisissez une heure de ${liv ? 'livraison' : 'retrait'}`, 'error'); $('#slot-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  if (bad) { $('.invalid input, .invalid textarea')?.focus(); return; }
  if (!S.user) { if (fd.get('remember')) store.set(ME_KEY, { name, phone }); else store.del(ME_KEY); }
  const btn = $('#co-submit'); btn.classList.add('is-loading'); S.co.busy = true;
  try {
    const res = await S.api.placeOrder({
      name, phone, note: String(fd.get('note') || ''), day: S.co.day, slot: S.co.slot,
      items: cartLines().map((l) => ({ format_id: l.fid, qty: l.qty })), payment: String(fd.get('payment') || 'retrait'),
      fulfillment: S.co.mode, zone: liv ? S.co.zone : null, address: liv ? address : '',
    });
    const my = store.get(MY_KEY, []);
    my.unshift({ token: res.token, number: res.number, day: S.co.day, slot: S.co.slot, total: res.total, at: new Date().toISOString() });
    store.set(MY_KEY, my.slice(0, 20));
    if (S.user && (!S.user.phone || !S.user.name)) S.api.updateProfile({ name: S.user.name || name, phone: S.user.phone || phone }).catch(() => {});
    cart = []; saveCart(); S.co.slot = null; S.co.address = '';
    location.hash = `#/suivi/${res.token}?new=1`;
  } catch (e) {
    const m = errMsg(e); toast(m, 'error', 5000);
    if (/créneau|complet/i.test(m)) { await refreshLoad(); renderSlotPicker(); }
    if (/disponible|stock/i.test(m)) { S.cat = await S.api.getCatalog(); sanitizeCart(); render(); }
  } finally { btn?.classList.remove('is-loading'); S.co.busy = false; }
}

// ---------- Suivi ----------
async function viewTrack(token, isNew) {
  const view = $('#view');
  view.innerHTML = '<div class="wrap"><div class="spinner" role="status" aria-label="Chargement"></div></div>';
  let o;
  try { o = await S.api.trackOrder(token); } catch (e) { o = null; toast(errMsg(e), 'error'); }
  if (!o) {
    view.innerHTML = `<div class="view"><div class="wrap"><div class="empty" style="padding-top:60px"><div class="big">🔎</div><h3>Commande introuvable</h3><p>Le lien est peut-être incomplet. Contactez-nous sur WhatsApp avec votre numéro de commande.</p><p style="margin-top:18px"><a class="btn" href="#/mes-commandes">Mes commandes</a></p></div></div></div>`;
    return;
  }
  const s = settings(); const st = ST[o.status];
  const flow = STATUSES.filter((x) => x.k !== 'annulee');
  const idx = flow.findIndex((x) => x.k === o.status);
  const at = (k) => o.history.filter((h) => h.status === k).pop()?.at;
  const cancelled = o.status === 'annulee';
  const title = cancelled ? 'Commande annulée' : isNew ? 'Merci, commande envoyée !' : o.status === 'prete' ? 'Votre commande est prête !' : o.status === 'recuperee' ? 'Bonne dégustation !' : 'Suivi de commande';
  const liv = o.fulfillment === 'livraison'; const modeLbl = liv ? 'Livraison' : 'Retrait';
  const waText = `Bonjour ${s.shop_name} 👋\nVoici ma commande ${o.number} :\n${o.items.map((i) => `• ${i.qty} × ${i.product_name} (${i.format_name}) – ${money(i.unit_price * i.qty)}`).join('\n')}${liv ? `\nLivraison (${o.delivery_zone}) : ${money(o.delivery_fee)}\nAdresse : ${o.delivery_address}` : ''}\nTotal : ${money(o.total)}\n${modeLbl} : ${relDay(o.pickup_day).toLowerCase()} (${fmtDay(o.pickup_day)}) à ${fmtSlot(o.pickup_slot)}\nNom : ${o.customer_name}${o.payment_method === 'wave' ? '\nPaiement : Wave' : ''}\nSuivi : ${trackUrl(o.tracking_token)}`;
  const payWave = o.payment_method === 'wave' && !o.paid && !cancelled && waveUrl(o.total);
  view.innerHTML = `<div class="view"><div class="wrap" style="padding-top:24px">
    <div class="track">
      <div>
        <div class="success-hero ${cancelled ? 'cancel' : ''}">
          <div class="tick">${cancelled ? icon('x') : icon('check')}</div>
          <h1>${title}</h1>
          <p>${cancelled ? 'Cette commande ne sera pas préparée.' : `${modeLbl} <b>${relDay(o.pickup_day).toLowerCase()}</b>, ${fmtDay(o.pickup_day)} à <b>${fmtSlot(o.pickup_slot)}</b>`}</p>
          ${liv && !cancelled ? `<p class="hint" style="margin-top:6px">🛵 ${esc(o.delivery_zone)} · ${esc(o.delivery_address)}</p>` : ''}
          <span class="order-num">${esc(o.number)}</span>
          ${!['recuperee', 'annulee'].includes(o.status) ? '<p style="margin-top:12px"><span class="live">Mise à jour en direct</span></p>' : ''}
        </div>
        ${payWave ? `<div class="card wave-card"><div class="wave-top"><span class="wave-logo big">Wave</span><div><b>Payez maintenant ${money(o.total)}</b><small>Le montant est déjà rempli. Après le paiement, envoyez-nous la capture sur WhatsApp.</small></div></div>
          <a class="btn btn-wave btn-block btn-lg" href="${esc(payWave)}" target="_blank" rel="noopener">Payer ${money(o.total)} avec Wave</a>
          <a class="btn btn-light btn-block" style="margin-top:8px" href="${waLink(s.whatsapp, `Bonjour, je viens de payer la commande ${o.number} (${money(o.total)}) avec Wave. Voici la capture :`)}" target="_blank" rel="noopener">${icon('wa')} J’ai payé : envoyer la capture</a></div>` : ''}
        ${cancelled ? '' : `<div class="card"><h2 style="font-size:18px;margin-bottom:16px">Où en est ma commande ?</h2><ol class="timeline">
          ${flow.map((x, i) => `<li class="${i < idx ? 'done' : i === idx ? (x.k === 'recuperee' ? 'done' : 'current') : ''}"><span class="dot">${i < idx || (i === idx && x.k === 'recuperee') ? icon('check') : i + 1}</span>
            <div><b>${x.k === 'nouvelle' ? 'Commande reçue' : liv && x.k === 'prete' ? 'Prête · en route' : liv && x.k === 'recuperee' ? 'Livrée' : x.label}</b><small>${at(x.k) ? fmtDateTime(at(x.k)) : i === idx + 1 ? 'Étape suivante' : ''}</small></div></li>`).join('')}
        </ol></div>`}
      </div>
      <aside>
        <div class="card" style="margin-bottom:14px">
          <h2 style="font-size:18px;margin-bottom:8px">Détail</h2>
          ${o.items.map((i) => `<div class="sum-line"><span>${i.qty} × ${esc(i.product_name)} <small>(${esc(i.format_name)})</small></span><b>${money(i.unit_price * i.qty)}</b></div>`).join('')}
          ${liv ? `<div class="sum-line"><span>Livraison <small>(${esc(o.delivery_zone)})</small></span><b>${o.delivery_fee ? money(o.delivery_fee) : 'Gratuite'}</b></div>` : ''}
          <div class="totals" style="margin-top:8px"><div class="row grand"><span>Total</span><span>${money(o.total)}</span></div><div class="row"><span>Paiement</span><span>${o.paid ? '✅ Payé' : { wave: 'Wave', orange_money: 'Orange Money' }[o.payment_method] || (liv ? 'À la livraison' : 'Au retrait')}</span></div></div>
          ${o.note ? `<p class="hint">Note : ${esc(o.note)}</p>` : ''}
        </div>
        <div class="actions no-print">
          ${cancelled ? '' : `<a class="btn btn-wa btn-block" href="${waLink(s.whatsapp, waText)}" target="_blank" rel="noopener">${icon('wa')} ${isNew ? 'Envoyer aussi sur WhatsApp' : 'Nous écrire sur WhatsApp'}</a>`}
          <div class="actions-row">
            ${cancelled ? '' : `<button class="btn btn-light" type="button" data-action="ics">${icon('cal')} Calendrier</button>`}
            <button class="btn btn-light" type="button" data-action="print">${icon('print')} Reçu</button>
          </div>
          ${liv ? '' : `<a class="btn btn-light" href="${esc(s.maps_url)}" target="_blank" rel="noopener">${icon('pin')} Itinéraire</a>`}
          ${o.status === 'nouvelle' ? '<button class="btn btn-ghost" type="button" data-action="cancel-order">Annuler la commande</button>' : ''}
        </div>
      </aside>
    </div>
    <div class="receipt">
      <img src="assets/img/logo.webp" alt="">
      <h2>${esc(s.shop_name)}</h2><p class="c">${esc(s.address)} · ${esc(fmtPhone(s.phone))}</p>
      <p style="margin-top:12px"><b>Commande ${esc(o.number)}</b><br>Passée le ${fmtDateTime(o.created_at)}<br>Client : ${esc(o.customer_name)}<br>${modeLbl} : ${fmtDay(o.pickup_day)} à ${fmtSlot(o.pickup_slot)}${liv ? `<br>Adresse : ${esc(o.delivery_address)} (${esc(o.delivery_zone)})` : ''}</p>
      <table><thead><tr><th>Article</th><th>Qté</th><th>Montant</th></tr></thead><tbody>
        ${o.items.map((i) => `<tr><td>${esc(i.product_name)} (${esc(i.format_name)})</td><td>${i.qty}</td><td>${money(i.unit_price * i.qty)}</td></tr>`).join('')}
      ${liv ? `<tr><td>Livraison</td><td></td><td>${money(o.delivery_fee)}</td></tr>` : ''}</tbody></table>
      <p class="tot">Total : ${money(o.total)}</p><p class="c" style="margin-top:14px">Statut : ${st.label} · Merci et à bientôt !</p>
    </div>
  </div></div>`;
  S.current = o;
  if (isNew && !cancelled) confetti();
  if (!['recuperee', 'annulee'].includes(o.status)) {
    S.timers.push(setInterval(async () => {
      try { const n = await S.api.trackOrder(token); if (n && n.status !== S.current.status) { toast(`Votre commande est maintenant : ${ST[n.status].label}`, 'success'); viewTrack(token, false); } } catch { /* réseau */ }
    }, 20000));
  }
}

function viewMyOrders() {
  const my = store.get(MY_KEY, []); const s = settings();
  return `<div class="view"><div class="wrap">
    <div class="page-head"><h1 class="page-title">Suivre ma commande</h1><p>Les commandes passées depuis cet appareil.${S.user ? '' : ' <a href="#/compte">Connectez-vous</a> pour les retrouver sur tous vos appareils.'}</p></div>
    ${my.length ? `<div class="my-orders">${my.map((o) => orderRow(o)).join('')}</div>`
      : '<div class="empty"><div class="big">🧾</div><h3>Aucune commande sur cet appareil</h3><p>Vos commandes apparaîtront ici automatiquement.</p></div>'}
    <div class="card" style="margin-top:20px"><b>Vous avez commandé depuis un autre téléphone ?</b><p class="hint" style="margin:4px 0 12px">Ouvrez le lien de suivi reçu après la commande${S.user ? ', ou consultez <a href="#/compte">Mon compte</a>' : ''}, ou écrivez-nous avec votre numéro de commande.</p>
      <a class="btn btn-wa btn-sm" href="${waLink(s.whatsapp, 'Bonjour, je voudrais suivre ma commande n° ')}" target="_blank" rel="noopener">${icon('wa')} Nous écrire</a></div>
  </div></div>`;
}

// ---------- Compte client (facultatif) ----------
async function viewAccount() {
  const view = $('#view');
  if (!S.user) {
    const tab = S.authTab || 'login';
    view.innerHTML = `<div class="view"><div class="wrap account">
      <div class="page-head"><h1 class="page-title">Mon compte</h1><p>Facultatif : vous pouvez commander sans compte. Avec un compte, vos informations sont remplies automatiquement et vous retrouvez vos commandes sur tous vos appareils.</p></div>
      <div class="card auth-card">
        <div class="seg-tabs" role="tablist">
          <button type="button" role="tab" data-action="auth-tab" data-t="login" aria-selected="${tab === 'login'}">Se connecter</button>
          <button type="button" role="tab" data-action="auth-tab" data-t="signup" aria-selected="${tab === 'signup'}">Créer un compte</button>
          <span class="seg-ink ${tab}"></span>
        </div>
        ${tab === 'login' ? `<form id="login-form" class="auth-form" novalidate>
          <label class="field"><span>E-mail</span><input name="email" type="email" autocomplete="email" required></label>
          <label class="field"><span>Mot de passe</span><input name="password" type="password" autocomplete="current-password" required></label>
          <button class="btn btn-block btn-lg" type="submit">Se connecter</button>
        </form>` : `<form id="signup-form" class="auth-form" novalidate>
          <label class="field"><span>Nom et prénom</span><input name="name" autocomplete="name" required maxlength="80"></label>
          <div class="field"><span>Téléphone</span><div class="input-group"><span>+221</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="77 123 45 67" aria-label="Téléphone"></div></div>
          <label class="field"><span>E-mail</span><input name="email" type="email" autocomplete="email" required></label>
          <label class="field"><span>Mot de passe <small>(6 caractères minimum)</small></span><input name="password" type="password" autocomplete="new-password" minlength="6" required></label>
          <button class="btn btn-block btn-lg btn-gold" type="submit">Créer mon compte</button>
          <p class="hint" style="text-align:center;margin-top:10px">✓ Aucun e-mail de vérification : votre compte est actif immédiatement.</p>
        </form>`}
      </div>
      <p style="text-align:center;margin-top:16px"><a class="btn btn-light" href="#/menu">Commander sans compte</a></p>
    </div></div>`;
    return;
  }
  view.innerHTML = `<div class="view"><div class="wrap account">
    <div class="page-head"><h1 class="page-title">Bonjour ${esc(firstName(S.user.name) || '👋')}</h1><p>${esc(S.user.email)}</p></div>
    <div class="grid-2">
      <div class="card"><h2 style="font-size:19px;margin-bottom:12px">Mes informations</h2>
        <form id="profile-form" novalidate>
          <label class="field"><span>Nom et prénom</span><input name="name" value="${esc(S.user.name)}" maxlength="80"></label>
          <div class="field"><span>Téléphone</span><div class="input-group"><span>+221</span><input name="phone" type="tel" inputmode="tel" value="${esc(fmtPhone(S.user.phone))}" aria-label="Téléphone"></div></div>
          <button class="btn" type="submit">Enregistrer</button>
          <button class="btn btn-light" type="button" data-action="logout" style="margin-left:6px">Se déconnecter</button>
        </form></div>
      <div class="card"><h2 style="font-size:19px;margin-bottom:12px">Mes commandes</h2><div id="acc-orders"><div class="spinner"></div></div></div>
    </div>
  </div></div>`;
  try {
    const list = await S.api.myOrders();
    $('#acc-orders').innerHTML = list.length ? `<div class="my-orders">${list.map((o) => orderRow(o)).join('')}</div>`
      : '<div class="empty" style="padding:20px"><div class="big">🧾</div><p>Pas encore de commande avec ce compte.</p><p style="margin-top:12px"><a class="btn btn-sm" href="#/menu">Commander</a></p></div>';
  } catch (e) { $('#acc-orders').innerHTML = `<p class="hint">${esc(errMsg(e))}</p>`; }
}
const firstName = (n) => String(n || '').trim().split(/\s+/)[0];
const orderRow = (o) => `<a class="my-order" href="#/suivi/${esc(o.tracking_token || o.token)}"><div><b>${esc(o.number)}</b>
  <small>${o.fulfillment === 'livraison' ? '🛵 Livraison' : '🏪 Retrait'} ${relDay(o.pickup_day || o.day).toLowerCase()} à ${fmtSlot(o.pickup_slot || o.slot)} · ${money(o.total)}</small></div>
  ${o.status ? `<span class="badge st-${o.status}">${ST[o.status].label}</span>` : icon('arrow')}</a>`;

async function authSubmit(form) {
  const fd = new FormData(form); const b = $('button[type=submit]', form); b.classList.add('is-loading');
  try {
    const email = String(fd.get('email') || '').trim(); const password = String(fd.get('password') || '');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('NS_EMAIL: Adresse e-mail invalide');
    if (form.id === 'signup-form') {
      const name = String(fd.get('name') || '').trim(); const raw = String(fd.get('phone') || '').trim(); const phone = raw ? normalizePhone(raw) : '';
      if (name.length < 2) throw new Error('NS_NOM: Indiquez votre nom');
      if (raw && !phone) throw new Error('NS_TEL: Numéro de téléphone sénégalais invalide');
      if (password.length < 6) throw new Error('NS_MDP: Mot de passe : 6 caractères minimum');
      await S.api.signUp({ email, password, name, phone: phone || '' });
      toast('Compte créé, bienvenue ! 🎉', 'success');
    } else {
      await S.api.customerSignIn(email, password); toast('Vous êtes connecté(e)', 'success');
    }
    S.user = await S.api.customer(); renderAccountTab();
    if (cart.length) location.hash = '#/commande'; else render();
  } catch (e) { toast(/already registered|already exists/i.test(e?.message) ? 'Un compte existe déjà avec cet e-mail : connectez-vous.' : errMsg(e), 'error', 4500); }
  finally { b.classList.remove('is-loading'); }
}
function renderAccountTab() { $$('[data-nav="compte"] .tab-lbl').forEach((el) => { el.textContent = S.user ? firstName(S.user.name) || 'Compte' : 'Compte'; }); }

// ---------- Effets ----------
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const ctx = c.getContext('2d'); const W = (c.width = innerWidth), H = (c.height = innerHeight);
  const colors = ['#D9951F', '#2F6FD6', '#1B3F8B', '#D2492E', '#1f8a5b', '#F4C66A'];
  const parts = Array.from({ length: 140 }, () => ({ x: W / 2, y: H * 0.35, vx: (Math.random() - 0.5) * 14, vy: Math.random() * -14 - 4, s: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[Math.floor(Math.random() * colors.length)] }));
  let t = 0;
  (function tick() {
    ctx.clearRect(0, 0, W, H); t++;
    parts.forEach((p) => { p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
    if (t < 160) requestAnimationFrame(tick); else c.remove();
  }());
}
function flyToCart(fromEl) {
  if (!fromEl || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = [...$$('[data-action="open-cart"]')].find((b) => b.offsetParent !== null); if (!target) return;
  const a = fromEl.getBoundingClientRect(); const b = target.getBoundingClientRect();
  const ghost = fromEl.cloneNode(true); ghost.className = 'fly-ghost';
  Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2); const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  ghost.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.45)`, opacity: .9, offset: .55 }, { transform: `translate(${dx}px, ${dy}px) scale(.08)`, opacity: .3 }],
    { duration: 750, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { ghost.remove(); target.classList.remove('shake'); void target.offsetWidth; target.classList.add('shake'); };
}
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.btn, .tabbar a, .tabbar button'); if (!b) return;
  const r = b.getBoundingClientRect(); const d = document.createElement('span'); d.className = 'ripple';
  const size = Math.max(r.width, r.height) * 2; Object.assign(d.style, { width: `${size}px`, height: `${size}px`, left: `${e.clientX - r.left - size / 2}px`, top: `${e.clientY - r.top - size / 2}px` });
  b.appendChild(d); setTimeout(() => d.remove(), 650);
});

function viewContact() {
  const s = settings();
  return `<div class="view"><div class="wrap">
    <div class="page-head"><h1 class="page-title">Contact &amp; accès</h1><p>Une question, une grosse commande pour un événement ? Écrivez-nous.</p></div>
    ${infoCards()}
    <div class="hero-cta"><a class="btn btn-wa btn-lg" href="${waLink(s.whatsapp, 'Bonjour Arrêt nekh soow, ')}" target="_blank" rel="noopener">${icon('wa')} Écrire sur WhatsApp</a>
    <a class="btn btn-light btn-lg" href="tel:+221${esc(s.phone)}">${icon('phone')} Appeler</a>
    <a class="btn btn-light btn-lg" href="${esc(s.maps_url)}" target="_blank" rel="noopener">${icon('pin')} Itinéraire</a></div>
  </div></div>`;
}

function viewPrivacy() {
  const s = settings();
  return `<div class="view"><div class="wrap prose">
    <div class="page-head"><h1 class="page-title">Confidentialité</h1></div>
    <h2>Données collectées</h2><p>Pour préparer votre commande, nous enregistrons votre nom, votre numéro de téléphone, votre éventuelle note et le contenu de la commande.</p>
    <h2>Utilisation</h2><p>Ces informations servent uniquement à préparer votre commande et à vous contacter à son sujet (par exemple pour vous prévenir qu’elle est prête). Elles ne sont ni vendues ni cédées.</p>
    <h2>Sur votre appareil</h2><p>Votre panier, la liste de vos commandes et, si vous l’avez demandé, vos coordonnées sont conservés dans votre navigateur pour vous faire gagner du temps. Vous pouvez les effacer à tout moment.</p>
    <p><button class="btn btn-ghost btn-sm" type="button" data-action="forget">Effacer mes données sur cet appareil</button></p>
    <h2>Vos droits</h2><p>Conformément à la loi sénégalaise n° 2008-12 sur la protection des données personnelles, vous pouvez demander l’accès, la rectification ou la suppression de vos données en nous écrivant au ${esc(fmtPhone(s.phone))}.</p>
  </div></div>`;
}

// ---------------------------------------------------------------------------
// Panier (tiroir)
// ---------------------------------------------------------------------------
function renderCartBadge(bump) {
  const n = cartCount();
  $$('.cart-count').forEach((b) => { b.hidden = !n; b.textContent = n; if (bump && n) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } });
}
function renderCart() {
  const lines = cartLines();
  $('#cart-body').innerHTML = lines.length ? lines.map((l) => {
    const max = l.f.stock == null ? 99 : l.f.stock;
    return `<div class="cart-line">
      ${l.p.image_url ? `<img class="thumb" src="${esc(l.p.image_url)}" alt="" loading="lazy">` : `<div class="thumb">${esc(l.p.emoji)}</div>`}
      <div><b>${esc(l.p.name)}</b><small>${esc(l.f.name)} · ${money(l.f.price)}</small><br><button type="button" class="line-del" data-action="cart-del" data-fid="${l.fid}">Retirer</button></div>
      <div class="r"><b>${money(l.f.price * l.qty)}</b>
        <div class="stepper"><button type="button" data-action="cart-qty" data-fid="${l.fid}" data-d="-1" aria-label="Retirer un ${esc(l.p.name)}">${icon(l.qty <= 1 ? 'trash' : 'minus')}</button><output>${l.qty}</output><button type="button" data-action="cart-qty" data-fid="${l.fid}" data-d="1" aria-label="Ajouter un ${esc(l.p.name)}" ${l.qty >= max ? 'disabled' : ''}>${icon('plus')}</button></div></div>
    </div>`;
  }).join('') : '<div class="empty"><div class="big">🛍️</div><h3>Votre panier est vide</h3><p>Découvrez nos spécialités maison.</p></div>';
  $('#cart-foot').innerHTML = lines.length
    ? `<div class="totals"><div class="row grand"><span>Total</span><span>${money(cartTotal())}</span></div><div class="row"><small>Paiement au retrait · aucun frais</small></div></div>
       <a class="btn btn-block btn-lg btn-gold" href="#/commande" data-action="close-cart">Choisir mon heure de retrait ${icon('arrow')}</a>`
    : '<a class="btn btn-block" href="#/menu" data-action="close-cart">Voir la carte</a>';
}
let lastFocus = null;
function openCart() {
  renderCart(); lastFocus = document.activeElement;
  const d = $('#cart'), o = $('#cart-overlay');
  d.hidden = false; o.hidden = false; d.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => { d.classList.add('open'); o.classList.add('open'); $('.icon-btn', d).focus(); });
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  const d = $('#cart'), o = $('#cart-overlay'); if (d.hidden) return;
  d.classList.remove('open'); o.classList.remove('open'); d.setAttribute('aria-hidden', 'true');
  setTimeout(() => { d.hidden = true; o.hidden = true; }, 300);
  document.body.style.overflow = ''; lastFocus?.focus?.();
}

// ---------------------------------------------------------------------------
// Routage et rendu
// ---------------------------------------------------------------------------
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, query] = h.split('?');
  const [a, b] = path.split('/');
  return { name: a || 'home', arg: b, query: new URLSearchParams(query || '') };
}
let observer;
function reveal() {
  observer ??= 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); } }), { rootMargin: '0px 0px -30px' }) : null;
  $$('.reveal:not(.in)').forEach((el) => (observer ? observer.observe(el) : el.classList.add('in')));
}
function setNav(name) {
  const key = { home: 'home', menu: 'menu', 'mes-commandes': 'suivi', suivi: 'suivi', contact: 'contact', compte: 'compte' }[name];
  $$('[data-nav]').forEach((a) => { const on = a.dataset.nav === key; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}
const TITLES = { home: '', menu: 'La carte', commande: 'Commande', suivi: 'Suivi de commande', 'mes-commandes': 'Suivre ma commande', contact: 'Contact', confidentialite: 'Confidentialité', compte: 'Mon compte' };

function render(scroll = false) {
  S.timers.forEach(clearInterval); S.timers = [];
  const r = route(); setNav(r.name);
  document.title = TITLES[r.name] ? `${TITLES[r.name]} · Arrêt nekh soow` : 'Arrêt nekh soow · Soow, Thiakry, Ngallakh à Thiès – commande en ligne';
  const view = $('#view');
  if (r.name === 'suivi' && r.arg) viewTrack(r.arg, r.query.get('new') === '1');
  else if (r.name === 'compte') viewAccount();
  else {
    const fn = { home: viewHome, menu: viewMenu, commande: viewCheckout, 'mes-commandes': viewMyOrders, contact: viewContact, confidentialite: viewPrivacy }[r.name] || viewHome;
    view.innerHTML = fn();
    if (r.name === 'commande') {
      renderPayOpts(); renderSlotPicker();
      S.timers.push(setInterval(async () => { await refreshLoad(); renderSlotPicker(); }, 30000));
    }
  }
  reveal();
  if (scroll) { window.scrollTo({ top: 0 }); view.focus({ preventScroll: true }); }
}
const rerenderCards = () => { const r = route().name; if (r === 'home' || r === 'menu') { const y = scrollY; $('#view').innerHTML = (r === 'home' ? viewHome : viewMenu)(); $$('.reveal').forEach((e) => e.classList.add('in')); scrollTo(0, y); } };
function updateCard(pid) {
  const el = $(`.product[data-pid="${pid}"]`); const p = S.cat.products.find((x) => x.id === pid);
  if (!el || !p) return rerenderCards();
  const tmp = document.createElement('div'); tmp.innerHTML = productCard(p);
  const n = tmp.firstElementChild; n.classList.add('in'); el.replaceWith(n);
}

// ---------------------------------------------------------------------------
// Événements
// ---------------------------------------------------------------------------
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-action]'); if (!t) return;
  const a = t.dataset.action; const d = t.dataset;
  switch (a) {
    case 'open-cart': openCart(); break;
    case 'close-cart': closeCart(); break;
    case 'filter': S.filter = d.cat; rerenderCards(); break;
    case 'fmt': S.sel[d.pid].fid = d.fid; S.sel[d.pid].qty = 1; updateCard(d.pid); break;
    case 'qty': { const s = S.sel[d.pid]; s.qty = Math.max(1, Math.min(99, s.qty + Number(d.d))); updateCard(d.pid); break; }
    case 'add': {
      const s = S.sel[d.pid]; const { p, f } = findFormat(s.fid) || {}; if (!p) return;
      const line = cart.find((l) => l.fid === s.fid); const max = f.stock == null ? 99 : f.stock;
      const qty = Math.min(max, (line?.qty || 0) + s.qty);
      if (line) line.qty = qty; else cart.push({ fid: s.fid, qty });
      flyToCart(t.closest('.product')?.querySelector('.media img, .media .emoji'));
      saveCart(); s.qty = 1; updateCard(d.pid);
      toast(`${p.name} (${f.name}) ajouté au panier`, 'success', 2200);
      break;
    }
    case 'cart-qty': {
      const l = cart.find((x) => x.fid === d.fid); if (!l) return;
      const ff = findFormat(d.fid)?.f; const max = ff?.stock == null ? 99 : ff.stock;
      l.qty += Number(d.d); if (l.qty <= 0) cart = cart.filter((x) => x !== l); else l.qty = Math.min(l.qty, max);
      saveCart(); renderCart(); if (route().name === 'commande') render(); break;
    }
    case 'cart-del': cart = cart.filter((x) => x.fid !== d.fid); saveCart(); renderCart(); if (route().name === 'commande') render(); break;
    case 'day': S.co.day = d.day; S.co.slot = null; renderSlotPicker(); break;
    case 'slot': S.co.slot = d.slot; renderSlotPicker(); break;
    case 'print': window.print(); break;
    case 'ics': if (S.current) download(`commande-${S.current.number}.ics`, icsFor(S.current, settings()), 'text/calendar'); break;
    case 'cancel-order': {
      if (!S.current || !confirm('Annuler cette commande ?')) return;
      try { await S.api.cancelOrder(S.current.tracking_token); toast('Commande annulée', 'success'); viewTrack(S.current.tracking_token, false); } catch (err) { toast(errMsg(err), 'error'); }
      break;
    }
    case 'forget': [CART_KEY, ME_KEY, MY_KEY].forEach(store.del); cart = []; renderCartBadge(); toast('Données effacées de cet appareil', 'success'); break;
    case 'reload': location.reload(); break;
    case 'auth-tab': S.authTab = d.t; viewAccount(); break;
    case 'logout': await S.api.customerSignOut(); S.user = null; renderAccountTab(); toast('Vous êtes déconnecté(e)', 'info'); render(); break;
    default:
  }
});
document.addEventListener('submit', async (e) => {
  const f = e.target;
  if (f.id === 'co-form') { e.preventDefault(); submitOrder(f); }
  if (f.id === 'login-form' || f.id === 'signup-form') { e.preventDefault(); authSubmit(f); }
  if (f.id === 'profile-form') {
    e.preventDefault(); const fd = new FormData(f); const raw = String(fd.get('phone') || '').trim(); const phone = raw ? normalizePhone(raw) : '';
    if (raw && !phone) return toast('Numéro de téléphone invalide', 'error');
    try { await S.api.updateProfile({ name: String(fd.get('name') || '').trim(), phone }); S.user = await S.api.customer(); renderAccountTab(); toast('Informations enregistrées', 'success'); } catch (err) { toast(errMsg(err), 'error'); }
  }
});
document.addEventListener('input', debounce((e) => {
  if (e.target.name === 'phone') setFieldError('#f-phone', '');
  if (e.target.name === 'name') setFieldError('#f-name', '');
  if (e.target.name === 'address') { S.co.address = e.target.value; setFieldError('#f-addr', ''); }
}, 50));
document.addEventListener('change', (e) => {
  if (e.target.name === 'payment') S.co.payment = e.target.value;
  if (e.target.name === 'mode') setMode(e.target.value);
  if (e.target.name === 'zone') { S.co.zone = e.target.value; updatePick(); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
window.addEventListener('hashchange', () => { closeCart(); render(true); });
window.addEventListener('scroll', () => $('#top').classList.toggle('scrolled', scrollY > 8), { passive: true });
window.addEventListener('storage', (e) => { if (e.key === CART_KEY) { cart = store.get(CART_KEY, []); renderCartBadge(); } });

// ---------------------------------------------------------------------------
// Démarrage
// ---------------------------------------------------------------------------
async function boot() {
  $('#year').textContent = new Date().getFullYear();
  if (IS_DEMO) $('#demo').hidden = false;
  document.body.classList.add('shop');
  if (['home', 'menu', ''].includes(route().name)) $('#view').innerHTML = `<div class="wrap" style="padding-top:30px">${skeletonGrid(3)}</div>`;
  try {
    S.api = await getApi();
    [S.cat, , S.user] = await Promise.all([S.api.getCatalog(), refreshLoad(), S.api.customer().catch(() => null)]);
    S.api.onAuth?.(async () => { S.user = await S.api.customer().catch(() => null); renderAccountTab(); });
  } catch (e) {
    $('#view').innerHTML = `<div class="wrap"><div class="empty" style="padding-top:60px"><div class="big">📡</div><h3>Impossible de charger la boutique</h3><p>${esc(errMsg(e))}</p><p style="margin-top:16px"><button class="btn" type="button" data-action="reload">Réessayer</button></p></div></div>`;
    return;
  }
  const s = settings();
  const ann = $('#announce');
  if (!s.accepting_orders) { ann.hidden = false; ann.classList.add('closed'); ann.textContent = s.announcement || 'Les commandes en ligne sont momentanément suspendues.'; }
  else if (s.announcement) { ann.hidden = false; ann.textContent = s.announcement; }
  $('#foot-addr').textContent = `${s.address} · ${fmtPhone(s.phone)}`;
  $('#wa-float').href = waLink(s.whatsapp, `Bonjour ${s.shop_name} 👋 `);
  sanitizeCart(); renderCartBadge(); renderAccountTab(); render();
  // Rafraîchit le catalogue quand l'onglet redevient visible (prix / stock à jour)
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    try { S.cat = await S.api.getCatalog(); await refreshLoad(); sanitizeCart(); if (route().name !== 'suivi') render(); } catch { /* ignore */ }
  });
}
boot();
