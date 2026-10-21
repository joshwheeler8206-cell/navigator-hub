'use strict';

/* ================================================================
   U.S. AutoForce — Navigator Hub
   Benefits, locations, ride-alongs and HR follow-ups for the
   Driver Trainer / Navigator. Offline-first, same storage patterns
   as Driver Hub so the two can share data later.
   ================================================================ */

/* ------------------------------ helpers ------------------------------ */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'style') node.style.cssText = v;
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c === null || c === undefined) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(c) : c);
  }
  return node;
}

function toast(msg, ms = 2400) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function nowISO() { return new Date().toISOString(); }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
  if (!iso) return '';
  const p = String(iso).split('-');
  if (p.length !== 3) return iso;
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  if (isNaN(d)) return iso;
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}
function fmtWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function download(filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* date dropdowns (month / day / year) — the pattern used across the suite */
function dateSelects(value, onChange) {
  const parts = String(value || '').split('-');
  const y = parts[0] || '', m = parts[1] || '', d = parts[2] || '';
  const wrap = el('div', { class: 'dt-row' });
  const selM = el('select', { 'aria-label': 'Month' }, [el('option', { value: '' }, ['Month'])]);
  MONTHS.forEach((lbl, i) => selM.appendChild(el('option', { value: String(i + 1).padStart(2, '0') }, [lbl])));
  const selD = el('select', { 'aria-label': 'Day' }, [el('option', { value: '' }, ['Day'])]);
  for (let i = 1; i <= 31; i++) selD.appendChild(el('option', { value: String(i).padStart(2, '0') }, [String(i)]));
  const yNow = new Date().getFullYear();
  const selY = el('select', { 'aria-label': 'Year' }, [el('option', { value: '' }, ['Year'])]);
  for (let i = yNow - 2; i <= yNow + 5; i++) selY.appendChild(el('option', { value: String(i) }, [String(i)]));
  selM.value = m ? String(Number(m)).padStart(2, '0') : '';
  selD.value = d || '';
  selY.value = y || '';
  const fire = () => {
    const mv = selM.value, dv = selD.value, yv = selY.value;
    if (onChange) onChange(mv && dv && yv ? yv + '-' + mv + '-' + dv : '');
  };
  [selM, selD, selY].forEach((s) => s.addEventListener('change', fire));
  wrap.appendChild(selM); wrap.appendChild(selD); wrap.appendChild(selY);
  return wrap;
}

/* ------------------------------ programs ------------------------------ */

const PROGRAMS = [
  {
    id: 'uniforms', icon: '👔', short: 'Uniforms', name: 'Uniforms & Dress Code',
    blurb: 'Shirt sets and sweatshirts issued after the waiting period.',
    hint: 'e.g. "after 90 days — 5 shirt sets + 2 sweatshirts"'
  },
  {
    id: 'shoes', icon: '🥾', short: 'Safety shoes', name: 'Safety Shoe Reimbursement',
    blurb: 'Steel-toe / safety footwear required for the job.',
    hint: 'e.g. "$125 per pair, 2 pairs per year"'
  },
  {
    id: 'wellness', icon: '🏃', short: 'Wellness', name: 'Wellness Equipment',
    blurb: 'Running shoes, exercise equipment, gym membership, fitness watch.',
    hint: 'e.g. "$200 per year, receipt required"'
  },
  {
    id: 'steps', icon: '👟', short: 'Step goal', name: 'Walking / Step-Goal Program',
    blurb: 'Monthly cash reward for hitting the step goal.',
    hint: 'e.g. "$25/month at 8,000 steps/day"'
  },
  {
    id: 'rave', icon: '🏆', short: 'RAVE', name: 'RAVE Recognition',
    blurb: 'Points for great work or great ideas — redeem for store credit or gift cards.',
    hint: 'e.g. "50 points ≈ $25; anyone can nominate"'
  },
  {
    id: 'dotm', icon: '🚗', short: 'Driver of the Month', name: 'Driver of the Month',
    blurb: 'Reserved parking, RAVE points and a team lunch each month.',
    hint: 'e.g. "100 points + lunch for the team"'
  },
  {
    id: 'screen', icon: '🩺', short: 'Health screen', name: 'Annual Health Screen',
    blurb: 'Complete the yearly screening for a health insurance premium discount.',
    hint: 'e.g. "$600/year premium discount"'
  }
];

const CONTACT_ROLES = [
  { id: 'trainer', label: 'Driver Trainer / Navigator' },
  { id: 'dispatch', label: 'Dispatch Supervisor' },
  { id: 'dispatcher', label: 'Dispatcher' },
  { id: 'hr', label: 'HR Business Partner' }
];

/* ------------------------------ storage ------------------------------ */

const DB_NAME = 'usaf_navigator_db';
const DB_KEY = 'usaf_navigator_v1';
const THEME_KEY = 'nav-theme';

const canIdb = typeof indexedDB !== 'undefined';
let _db = null;
let _dbPromise = null;

function idbOpen() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function persist(data) {
  if (!canIdb) { try { localStorage.setItem(DB_KEY, JSON.stringify(data)); } catch (e) {} return Promise.resolve(); }
  return idbOpen().then((db) => new Promise((resolve) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(data, DB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  })).catch(() => {});
}

/* ------------------------------ state ------------------------------ */

const state = {
  locations: [],
  values: {},
  rides: [],
  questions: [],
  settings: { selectedLocation: '' },
  ui: { tab: 'home', openProg: {}, locView: '', locFilter: 'all', benFilter: 'all', rideFilter: '' }
};

function blankState() {
  return { locations: [], values: {}, rides: [], questions: [], settings: { selectedLocation: '' } };
}

function ensureShape(d) {
  const base = blankState();
  if (!d || typeof d !== 'object') return base;
  base.locations = Array.isArray(d.locations) ? d.locations.map(ensureLocation) : [];
  base.values = d.values && typeof d.values === 'object' ? d.values : {};
  base.rides = Array.isArray(d.rides) ? d.rides : [];
  base.questions = Array.isArray(d.questions) ? d.questions : [];
  base.settings = Object.assign(base.settings, d.settings || {});
  return base;
}

function ensureLocation(l) {
  l = l || {};
  l.id = l.id || uid();
  l.name = l.name || 'Untitled location';
  l.contacts = l.contacts || {};
  CONTACT_ROLES.forEach((r) => {
    l.contacts[r.id] = Object.assign({ name: '', phone: '', email: '' }, l.contacts[r.id] || {});
  });
  l.published = !!l.published;
  l.createdAt = l.createdAt || nowISO();
  return l;
}

function load() {
  const finish = (raw) => {
    const d = ensureShape(raw);
    state.locations = d.locations;
    state.values = d.values;
    state.rides = d.rides;
    state.questions = d.questions;
    state.settings = d.settings;
    if (!state.settings.selectedLocation && state.locations[0]) state.settings.selectedLocation = state.locations[0].id;
    render(true);
  };
  if (!canIdb) {
    try { finish(JSON.parse(localStorage.getItem(DB_KEY) || 'null')); }
    catch (e) { finish(null); }
    return;
  }
  idbOpen().then((db) => new Promise((resolve) => {
    const tx = db.transaction('kv', 'readonly');
    const rq = tx.objectStore('kv').get(DB_KEY);
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => resolve(null);
  })).then(finish).catch(() => finish(null));
}

let _saveTimer = null;
function save(immediate) {
  const payload = {
    locations: state.locations, values: state.values, rides: state.rides,
    questions: state.questions, settings: state.settings
  };
  clearTimeout(_saveTimer);
  if (immediate) return persist(payload);
  _saveTimer = setTimeout(() => persist(payload), 250);
  return Promise.resolve();
}

/* ------------------------------ selectors ------------------------------ */

function locById(id) { return state.locations.find((l) => l.id === id) || null; }
function progById(id) { return PROGRAMS.find((p) => p.id === id) || null; }
function vKey(locId, progId) { return locId + ':' + progId; }

function getVal(locId, progId) {
  const v = state.values[vKey(locId, progId)];
  return Object.assign({ amount: '', eligibility: '', claim: '', effective: '', confirmedBy: '', status: 'tbd' }, v || {});
}

function setVal(locId, progId, patch) {
  const k = vKey(locId, progId);
  const cur = state.values[k] || { amount: '', eligibility: '', claim: '', effective: '', confirmedBy: '', status: 'tbd' };
  const next = Object.assign({}, cur, patch);
  if (!next.auditId) next.auditId = 'NAV-' + todayISO().replace(/-/g, '') + '-' + uid().slice(0, 4).toUpperCase();
  next.updatedAt = nowISO();
  state.values[k] = next;
  save();
  return next;
}

function isFilled(v) { return !!(v && String(v.amount).trim()); }

function progFilled(locId, progId) {
  const v = getVal(locId, progId);
  return !!(v.amount.trim() && v.eligibility.trim() && v.claim.trim());
}

function locProgress(locId) {
  let done = 0;
  PROGRAMS.forEach((p) => { if (progFilled(locId, p.id)) done++; });
  return { done, total: PROGRAMS.length, pct: Math.round((done / PROGRAMS.length) * 100) };
}

function openQuestions(locId) {
  return state.questions.filter((q) => !q.answered && (!locId || q.locId === locId));
}

function selectedLocId() {
  let id = state.settings.selectedLocation;
  if (!locById(id)) { id = state.locations[0] ? state.locations[0].id : ''; state.settings.selectedLocation = id; }
  return id;
}

/* ------------------------------ header / theme ------------------------------ */

function applyTheme() {
  const t = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.title = t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function toggleTheme() {
  const t = (localStorage.getItem(THEME_KEY) || 'light') === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, t);
  applyTheme();
}

function updateNetBadge() {
  const b = document.getElementById('netBadge');
  if (!b) return;
  const on = navigator.onLine !== false;
  b.classList.toggle('net-off', !on);
  b.classList.toggle('net-on', on);
  const lab = b.querySelector('.net-label');
  if (lab) lab.textContent = on ? 'Online' : 'Offline';
}

/* ------------------------------ router / tabs ------------------------------ */

const TABS = ['home', 'locations', 'benefits', 'rides', 'reports'];

function go(tab) {
  if (!TABS.includes(tab)) tab = 'home';
  state.ui.tab = tab;
  state.ui.locView = '';
  state.ui.openProg = {};
  if (location.hash.slice(1) !== tab) history.replaceState(null, '', '#' + tab);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyHash() {
  const h = (location.hash || '').replace('#', '');
  const parts = h.split(':');
  if (TABS.includes(parts[0])) {
    state.ui.tab = parts[0];
    if (parts[0] === 'locations' && parts[1]) state.ui.locView = parts[1];
    return true;
  }
  return false;
}

function render(initial) {
  if (initial) applyHash();
  const view = document.getElementById('view');
  if (!view) return;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === state.ui.tab));
  view.innerHTML = '';
  switch (state.ui.tab) {
    case 'locations': view.appendChild(renderLocations()); break;
    case 'benefits': view.appendChild(renderBenefits()); break;
    case 'rides': view.appendChild(renderRides()); break;
    case 'reports': view.appendChild(renderReports()); break;
    default: view.appendChild(renderHome());
  }
}

/* ------------------------------ small builders ------------------------------ */

function statusBadge(locId, progId) {
  const v = getVal(locId, progId);
  if (v.status === 'confirmed') return el('span', { class: 'badge ok' }, ['CONFIRMED']);
  if (isFilled(v)) return el('span', { class: 'badge draft' }, ['NEEDS REVIEW']);
  return el('span', { class: 'badge tbd' }, ['TBD']);
}

function meterNode(pct, cls) {
  return el('div', { class: 'meter ' + (cls || '') }, [el('i', { style: 'width:' + Math.max(0, Math.min(100, pct)) + '%' })]);
}

function filterSelect(options, value, onChange, aria) {
  const sel = el('select', { 'aria-label': aria || 'Filter', style: 'padding:8px 10px;font-size:13px;font-weight:600;max-width:190px' });
  options.forEach((o) => sel.appendChild(el('option', { value: o.v }, [o.t])));
  sel.value = value;
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

function locPicker(onChange, id) {
  const sel = el('select', { class: 'big', id: id || 'locPick', 'aria-label': 'Location' });
  if (!state.locations.length) {
    sel.appendChild(el('option', { value: '' }, ['No locations yet']));
    return sel;
  }
  state.locations.forEach((l) => {
    sel.appendChild(el('option', { value: l.id }, [l.name + (l.city ? ' — ' + l.city + ', ' + (l.state || '') : '')]));
  });
  sel.value = selectedLocId();
  sel.addEventListener('change', () => {
    state.settings.selectedLocation = sel.value;
    save();
    if (onChange) onChange(sel.value);
  });
  return sel;
}

/* ------------------------------ HOME ------------------------------ */

function renderHome() {
  const frag = el('div');

  const h = el('div', { class: 'page-title' }, [
    el('div', {}, [
      el('h2', {}, ['Navigator Hub']),
      el('p', {}, ['Benefits, locations and ride-alongs — one place'])
    ])
  ]);
  frag.appendChild(h);

  const totalProgs = state.locations.length * PROGRAMS.length;
  let confirmed = 0, filled = 0;
  state.locations.forEach((l) => PROGRAMS.forEach((p) => {
    const v = getVal(l.id, p.id);
    if (isFilled(v)) filled++;
    if (v.status === 'confirmed') confirmed++;
  }));
  const pct = totalProgs ? Math.round((confirmed / totalProgs) * 100) : 0;
  const qOpen = openQuestions().length;

  const stats = el('div', { class: 'stat-grid' }, [
    el('div', { class: 'stat' }, [el('strong', {}, [String(state.locations.length)]), el('span', {}, ['Locations'])]),
    el('div', { class: 'stat ' + (pct >= 90 ? 'good' : pct > 0 ? 'warn' : '') }, [el('strong', {}, [pct + '%']), el('span', {}, ['Values confirmed'])]),
    el('div', { class: 'stat ' + (qOpen ? 'bad' : 'good') }, [el('strong', {}, [String(qOpen)]), el('span', {}, ['Open HR questions'])]),
    el('div', { class: 'stat' }, [el('strong', {}, [String(state.rides.length)]), el('span', {}, ['Ride-alongs logged'])])
  ]);
  frag.appendChild(stats);

  /* attention inbox */
  const att = el('div', { class: 'card' });
  att.appendChild(el('div', { class: 'card-head' }, [
    el('h3', { class: 'card-title' }, ['Needs attention']),
    el('span', { class: 'badge ' + (qOpen ? 'open' : 'ok') }, [qOpen ? qOpen + ' OPEN' : 'ALL CLEAR'])
  ]));

  const items = [];
  state.locations.forEach((l) => {
    const pr = locProgress(l.id);
    if (pr.done < pr.total) {
      items.push({
        tone: pr.done === 0 ? 'tbd' : 'draft',
        icon: '📋',
        title: l.name,
        badge: (pr.total - pr.done) + ' TBD',
        sub: pr.total - pr.done + ' program' + (pr.total - pr.done === 1 ? '' : 's') + ' still missing values',
        onClick: () => { state.settings.selectedLocation = l.id; go('benefits'); }
      });
    }
    if (!l.published) {
      items.push({
        tone: 'draft', icon: '🚦', title: l.name, badge: 'DRAFT',
        sub: 'Not published — drivers cannot see these values yet',
        onClick: () => { state.settings.selectedLocation = l.id; go('reports'); }
      });
    }
  });
  openQuestions().forEach((q) => {
    const l = locById(q.locId);
    items.push({
      tone: 'open', icon: '❓', title: q.text, badge: 'ASKED',
      sub: (l ? l.name : 'Unknown location') + ' · asked ' + fmtDate(String(q.createdAt || '').slice(0, 10)),
      onClick: () => go('rides')
    });
  });

  if (!items.length) {
    att.appendChild(el('div', { class: 'empty' }, [
      el('div', { class: 'big' }, ['✅']),
      el('p', {}, ['Nothing waiting on you right now.'])
    ]));
  } else {
    items.slice(0, 8).forEach((it) => att.appendChild(rowItem(it)));
  }
  frag.appendChild(att);

  /* quick actions */
  const qa = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['Quick actions']),
    el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' }, [
      el('button', { class: 'btn primary', type: 'button', onclick: () => openLocationModal(null) }, ['+ Add location']),
      el('button', { class: 'btn', type: 'button', onclick: () => { if (!state.locations.length) { toast('Add a location first'); return; } openRideModal(null); } }, ['+ Log ride-along']),
      el('button', { class: 'btn', type: 'button', onclick: () => go('benefits') }, ['Enter benefit values']),
      el('button', { class: 'btn', type: 'button', onclick: () => go('reports') }, ['Print a location sheet'])
    ])
  ]);
  frag.appendChild(qa);

  /* data card */
  const data = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['Data']),
    el('p', { class: 'card-sub' }, ['Everything stays on this device. Back up before switching phones.'])
  ]);
  const dataActions = el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' }, [
    el('button', { class: 'btn sm', type: 'button', onclick: exportBackup }, ['⬇ Export backup']),
    el('button', { class: 'btn sm', type: 'button', onclick: importBackup }, ['⬆ Import / sync']),
    el('button', { class: 'btn sm', type: 'button', onclick: exportCsv }, ['Export CSV'])
  ]);
  data.appendChild(dataActions);
  frag.appendChild(data);

  return frag;
}

function rowItem(it) {
  return el('button', {
    class: 'row-item', type: 'button', style: 'width:100%;background:none;border-left:0;border-right:0;border-bottom:0;cursor:pointer;text-align:left;font-family:inherit;color:inherit',
    onclick: it.onClick || function () {}
  }, [
    el('span', { class: 'thumb' }, [it.icon || '•']),
    el('span', { class: 'grow' }, [
      el('span', { class: 't', style: 'display:block' }, [it.title]),
      el('span', { class: 's', style: 'display:block' }, [it.sub])
    ]),
    it.badge ? el('span', { class: 'badge ' + (it.tone || '') }, [it.badge]) : null
  ].filter(Boolean));
}

/* ------------------------------ LOCATIONS ------------------------------ */

function renderLocations() {
  const frag = el('div');
  frag.appendChild(el('div', { class: 'page-title' }, [
    el('div', {}, [el('h2', {}, ['Locations']), el('p', {}, ['Every terminal you cover, its values and its people'])]),
    el('button', { class: 'btn primary sm', type: 'button', onclick: () => openLocationModal(null) }, ['+ Add'])
  ]));

  if (!state.locations.length) {
    frag.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'empty' }, [
        el('div', { class: 'big' }, ['📍']),
        el('p', {}, ['No locations yet. Add your first terminal to start collecting benefit values.']),
        el('button', { class: 'btn primary', type: 'button', onclick: () => openLocationModal(null) }, ['+ Add location'])
      ])
    ]));
    return frag;
  }

  if (state.ui.locView) {
    const l = locById(state.ui.locView);
    if (l) { frag.appendChild(locationDetail(l)); return frag; }
  }

  const filt = el('div', { class: 'card', style: 'display:flex;align-items:center;gap:10px;padding:10px 12px' }, [
    el('span', { style: 'font-size:11.5px;font-weight:700;color:var(--muted)' }, ['SHOW']),
    filterSelect([
      { v: 'all', t: 'All locations' },
      { v: 'incomplete', t: 'Missing values' },
      { v: 'draft', t: 'Not published' },
      { v: 'published', t: 'Published' }
    ], state.ui.locFilter, (v) => { state.ui.locFilter = v; render(); }, 'Filter locations')
  ]);
  frag.appendChild(filt);

  const locGrid = el('div', { class: 'card-grid' });
  state.locations.filter((l) => {
    const pr = locProgress(l.id);
    if (state.ui.locFilter === 'incomplete') return pr.done < pr.total;
    if (state.ui.locFilter === 'draft') return !l.published;
    if (state.ui.locFilter === 'published') return l.published;
    return true;
  }).forEach((l) => {
    const pr = locProgress(l.id);
    const oq = openQuestions(l.id).length;
    const card = el('div', { class: 'card', style: 'cursor:pointer' });
    card.addEventListener('click', () => { state.ui.locView = l.id; render(); });

    card.appendChild(el('div', { class: 'card-head' }, [
      el('div', { style: 'display:flex;align-items:center;gap:10px;min-width:0' }, [
        el('span', { class: 'thumb' }, ['📍']),
        el('div', { style: 'min-width:0' }, [
          el('h3', { class: 'card-title', style: 'display:block' }, [l.name]),
          el('p', { class: 'card-sub' }, [(l.city ? l.city + ', ' : '') + (l.state || '') + (l.driverCount ? ' · ' + l.driverCount + ' drivers' : '')])
        ])
      ]),
      el('div', { style: 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end' }, [
        oq ? el('span', { class: 'badge open' }, [oq + ' OPEN']) : null,
        el('span', { class: 'badge ' + (l.published ? 'pub' : 'draft') }, [l.published ? 'PUBLISHED' : 'DRAFT'])
      ].filter(Boolean))
    ]));

    card.appendChild(el('div', { style: 'display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted);font-weight:600' }, [
      el('span', {}, [pr.done + ' of ' + pr.total + ' programs complete']),
      el('span', {}, [pr.pct + '%'])
    ]));
    card.appendChild(meterNode(pr.pct, pr.pct === 100 ? 'good' : pr.pct >= 50 ? 'mid' : ''));
    locGrid.appendChild(card);
  });
  frag.appendChild(locGrid);

  return frag;
}

function locationDetail(l) {
  const frag = el('div');
  frag.appendChild(el('div', { class: 'page-title' }, [
    el('button', { class: 'btn sm', type: 'button', onclick: () => { state.ui.locView = ''; render(); } }, ['← All locations']),
    el('div', { style: 'flex:1' }),
    el('button', { class: 'btn sm', type: 'button', onclick: () => openLocationModal(l) }, ['✎ Edit'])
  ]));

  const pr = locProgress(l.id);
  const head = el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [
      el('div', {}, [
        el('h3', { class: 'card-title' }, [l.name]),
        el('p', { class: 'card-sub' }, [(l.city ? l.city + ', ' : '') + (l.state || '')])
      ]),
      el('span', { class: 'badge ' + (l.published ? 'pub' : 'draft') }, [l.published ? 'PUBLISHED' : 'DRAFT'])
    ]),
    el('div', { style: 'display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted);font-weight:600' }, [
      el('span', {}, [pr.done + ' of ' + pr.total + ' programs complete']),
      el('span', {}, [pr.pct + '%'])
    ]),
    meterNode(pr.pct, pr.pct === 100 ? 'good' : 'mid')
  ]);
  frag.appendChild(head);

  const meta = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['Profile'])
  ]);
  const metaRows = [
    ['Benefit year', l.benefitYear || '—'],
    ['Plan year starts', l.planStart ? fmtDate(l.planStart) : '—'],
    ['Drivers covered', l.driverCount || '—'],
    ['Carriers', l.carriers || '—'],
    ['Union / contract', l.union || '—']
  ];
  metaRows.forEach(([k, v]) => {
    meta.appendChild(el('div', { style: 'display:flex;gap:10px;padding:7px 0;border-top:1px solid var(--line);font-size:13px' }, [
      el('span', { style: 'color:var(--muted);font-weight:700;width:44%' }, [k]),
      el('span', {}, [v])
    ]));
  });
  frag.appendChild(meta);

  const contacts = el('div', { class: 'card' }, [el('h3', { class: 'card-title' }, ['Who drivers call'])]);
  CONTACT_ROLES.forEach((role) => {
    const c = (l.contacts && l.contacts[role.id]) || {};
    contacts.appendChild(el('div', { style: 'padding:8px 0;border-top:1px solid var(--line)' }, [
      el('div', { style: 'font-size:10.5px;font-weight:800;color:var(--accent);letter-spacing:.3px' }, [role.label.toUpperCase()]),
      el('div', { style: 'font-size:13.5px;font-weight:700;margin-top:2px' }, [c.name || '—']),
      el('div', { style: 'font-size:12px;color:var(--muted)' }, [[c.phone, c.email].filter(Boolean).join(' · ') || ''])
    ]));
  });
  frag.appendChild(contacts);

  const actions = el('div', { class: 'card' }, [
    el('h3', { class: 'card-title' }, ['Actions']),
    el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px' }, [
      el('button', {
        class: 'btn primary', type: 'button',
        onclick: () => { state.settings.selectedLocation = l.id; save(); go('benefits'); }
      }, ['Enter values']),
      el('button', {
        class: 'btn', type: 'button',
        onclick: () => { state.settings.selectedLocation = l.id; save(); go('reports'); }
      }, ['Preview sheet']),
      el('button', {
        class: 'btn ' + (l.published ? 'danger' : 'gold'), type: 'button',
        onclick: () => {
          const pr2 = locProgress(l.id);
          if (!l.published && pr2.done < pr2.total) {
            if (!confirm('Only ' + pr2.done + ' of ' + pr2.total + ' programs are filled in.\n\nPublish anyway? The sheet will print a PENDING banner for the missing values.')) return;
          }
          l.published = !l.published;
          l.updatedAt = nowISO();
          save(true);
          toast(l.published ? 'Published — drivers can see these values' : 'Unpublished (draft)');
          render();
        }
      }, [l.published ? 'Unpublish' : 'Publish'])
    ]),
    el('button', {
      class: 'btn danger sm', type: 'button', style: 'margin-top:12px',
      onclick: () => {
        if (!confirm('Delete ' + l.name + '?\n\nThis removes its benefit values and ride-alongs. It cannot be undone.')) return;
        state.locations = state.locations.filter((x) => x.id !== l.id);
        Object.keys(state.values).forEach((k) => { if (k.startsWith(l.id + ':')) delete state.values[k]; });
        state.rides = state.rides.filter((r) => r.locId !== l.id);
        state.questions = state.questions.filter((q) => q.locId !== l.id);
        if (state.settings.selectedLocation === l.id) state.settings.selectedLocation = state.locations[0] ? state.locations[0].id : '';
        save(true);
        state.ui.locView = '';
        toast('Location deleted');
        render();
      }
    }, ['Delete location'])
  ]);
  frag.appendChild(actions);

  return frag;
}

/* ------------------------------ BENEFITS ------------------------------ */

function renderBenefits() {
  const frag = el('div');
  frag.appendChild(el('div', { class: 'page-title' }, [
    el('div', {}, [el('h2', {}, ['Benefit values']), el('p', {}, ['The numbers behind each program, per location'])])
  ]));

  if (!state.locations.length) {
    frag.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'empty' }, [
        el('div', { class: 'big' }, ['📍']),
        el('p', {}, ['Add a location first, then enter its benefit values.']),
        el('button', { class: 'btn primary', type: 'button', onclick: () => openLocationModal(null) }, ['+ Add location'])
      ])
    ]));
    return frag;
  }

  const locId = selectedLocId();

  /* location picker + copy */
  const pickCard = el('div', { class: 'card' });
  pickCard.appendChild(el('label', { class: 'field-label', style: 'display:block;margin-bottom:6px' }, ['LOCATION']));
  pickCard.appendChild(locPicker((id) => { state.ui.openProg = {}; render(); }));

  const others = state.locations.filter((l) => l.id !== locId);
  if (others.length) {
    const copyRow = el('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap' }, [
      el('span', { style: 'font-size:11.5px;color:var(--muted);font-weight:600' }, ['Copy values from']),
      (() => {
        const s = el('select', { style: 'flex:1;min-width:150px;padding:8px 10px;font-size:13px' }, [el('option', { value: '' }, ['Choose a location…'])]);
        others.forEach((o) => s.appendChild(el('option', { value: o.id }, [o.name])));
        s.addEventListener('change', () => {
          if (!s.value) return;
          const src = locById(s.value);
          if (!src) return;
          if (!confirm('Copy all values from ' + src.name + ' into this location?\n\nExisting values here will be overwritten and marked NEEDS REVIEW.')) { s.value = ''; return; }
          let n = 0;
          PROGRAMS.forEach((p) => {
            const sv = getVal(src.id, p.id);
            if (!isFilled(sv)) return;
            setVal(locId, p.id, { amount: sv.amount, eligibility: sv.eligibility, claim: sv.claim, effective: sv.effective, status: 'draft', confirmedBy: '' });
            n++;
          });
          save(true);
          toast(n ? 'Copied ' + n + ' programs — review and confirm' : 'Nothing filled in on ' + src.name);
          s.value = '';
          render();
        });
        return s;
      })()
    ]);
    pickCard.appendChild(copyRow);
  }
  frag.appendChild(pickCard);

  const loc = locById(locId);
  const pr = locProgress(locId);

  const sumCard = el('div', { class: 'card', style: 'display:flex;align-items:center;gap:14px' }, [
    el('div', { style: 'flex:1' }, [
      el('div', { style: 'display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:var(--muted)' }, [
        el('span', {}, [pr.done + ' of ' + pr.total + ' complete']),
        el('span', {}, [pr.pct + '%'])
      ]),
      meterNode(pr.pct, pr.pct === 100 ? 'good' : pr.pct >= 50 ? 'mid' : '')
    ]),
    el('span', { class: 'badge ' + (loc && loc.published ? 'pub' : 'draft') }, [loc && loc.published ? 'PUBLISHED' : 'DRAFT'])
  ]);
  frag.appendChild(sumCard);

  const bfilt = el('div', { class: 'card', style: 'display:flex;align-items:center;gap:10px;padding:10px 12px' }, [
    el('span', { style: 'font-size:11.5px;font-weight:700;color:var(--muted)' }, ['SHOW']),
    filterSelect([
      { v: 'all', t: 'All programs' },
      { v: 'tbd', t: 'Still TBD' },
      { v: 'draft', t: 'Needs review' },
      { v: 'confirmed', t: 'Confirmed' }
    ], state.ui.benFilter, (v) => { state.ui.benFilter = v; state.ui.openProg = {}; render(); }, 'Filter programs')
  ]);
  frag.appendChild(bfilt);

  const progGrid = el('div', { class: 'prog-grid' });
  PROGRAMS.filter((p) => {
    const v = getVal(locId, p.id);
    if (state.ui.benFilter === 'tbd') return v.status !== 'confirmed' && !isFilled(v);
    if (state.ui.benFilter === 'draft') return v.status !== 'confirmed' && isFilled(v);
    if (state.ui.benFilter === 'confirmed') return v.status === 'confirmed';
    return true;
  }).forEach((p) => {
    progGrid.appendChild(progCard(locId, p));
  });
  frag.appendChild(progGrid);

  return frag;
}

function progCard(locId, p) {
  const v = getVal(locId, p.id);
  const open = !!state.ui.openProg[p.id];
  const card = el('div', { class: 'prog' + (open ? ' open' : '') });

  const head = el('button', { type: 'button' }, [
    el('span', { class: 'thumb' }, [p.icon]),
    el('span', { class: 'pname' }, [
      el('span', { style: 'display:block' }, [p.name]),
      el('span', { class: 'pval', style: 'display:block' }, [isFilled(v) ? v.amount + (v.eligibility ? ' · ' + v.eligibility : '') : 'Not entered yet'])
    ]),
    statusBadge(locId, p.id),
    el('span', { class: 'chev' }, [open ? '▾' : '▸'])
  ]);
  head.addEventListener('click', () => {
    state.ui.openProg[p.id] = !open;
    render();
  });
  card.appendChild(head);

  const body = el('div', { class: 'body' });

  const amount = el('input', { type: 'text', value: v.amount, placeholder: p.hint });
  const elig = el('input', { type: 'text', value: v.eligibility, placeholder: 'e.g. after 90 days · full-time · DOT drivers' });
  const claim = el('input', { type: 'text', value: v.claim, placeholder: 'e.g. receipt to dispatch, paid next paycheck' });
  const conf = el('input', { type: 'text', value: v.confirmedBy, placeholder: 'Name of whoever confirmed this' });

  const effWrap = el('div');
  const effSel = dateSelects(v.effective, (iso) => {
    setVal(locId, p.id, { effective: iso, status: 'draft' });
    toast('Effective date saved');
  });
  effWrap.appendChild(effSel);

  const commit = () => {
    setVal(locId, p.id, {
      amount: amount.value.trim(),
      eligibility: elig.value.trim(),
      claim: claim.value.trim(),
      status: v.status === 'confirmed' ? 'draft' : v.status
    });
    const headVal = card.querySelector('.pval');
    if (headVal) {
      const nv = getVal(locId, p.id);
      headVal.textContent = isFilled(nv) ? nv.amount + (nv.eligibility ? ' · ' + nv.eligibility : '') : 'Not entered yet';
    }
    const badgeOld = card.querySelector('.badge');
    if (badgeOld) badgeOld.replaceWith(statusBadge(locId, p.id));
  };

  [amount, elig, claim].forEach((inp) => inp.addEventListener('change', commit));

  body.appendChild(el('div', { class: 'field' }, [
    el('label', {}, ['Amount & unit *']), amount
  ]));
  body.appendChild(el('div', { class: 'field' }, [
    el('label', {}, ['Who is eligible *']), elig
  ]));
  body.appendChild(el('div', { class: 'field' }, [
    el('label', {}, ['How they claim / enroll *']), claim
  ]));
  body.appendChild(el('div', { class: 'grid2' }, [
    el('div', { class: 'field' }, [el('label', {}, ['Effective date']), effWrap]),
    el('div', { class: 'field' }, [el('label', {}, ['Confirmed by']), conf])
  ]));

  const actions = el('div', { class: 'actions' });
  actions.appendChild(el('button', {
    class: 'btn ' + (v.status === 'confirmed' ? '' : 'primary'), type: 'button',
    onclick: () => {
      commit();
      const cur = getVal(locId, p.id);
      if (!cur.amount.trim() || !cur.eligibility.trim() || !cur.claim.trim()) {
        toast('Fill amount, eligibility and how-to-claim first');
        return;
      }
      const who = conf.value.trim() || 'Navigator';
      setVal(locId, p.id, { status: 'confirmed', confirmedBy: who, confirmedAt: nowISO() });
      save(true);
      toast('Confirmed — ' + who);
      render();
    }
  }, [v.status === 'confirmed' ? '✓ Confirmed' : '✓ Mark confirmed']));

  actions.appendChild(el('button', {
    class: 'btn sm', type: 'button',
    onclick: () => {
      if (!confirm('Clear the values for ' + p.name + ' at this location?')) return;
      delete state.values[vKey(locId, p.id)];
      save(true);
      render();
    }
  }, ['Clear']));

  if (v.updatedAt) {
    actions.appendChild(el('span', { style: 'font-size:10.5px;color:var(--muted);align-self:center' }, ['Updated ' + fmtWhen(v.updatedAt)]));
  }
  body.appendChild(actions);

  if (v.status === 'confirmed' && v.confirmedBy) {
    body.appendChild(el('p', { style: 'font-size:11px;color:var(--green);margin:8px 0 0' }, ['Confirmed by ' + v.confirmedBy + (v.confirmedAt ? ' on ' + fmtDate(String(v.confirmedAt).slice(0, 10)) : '')]));
  }

  card.appendChild(body);
  return card;
}

/* ------------------------------ RIDES ------------------------------ */

function renderRides() {
  const frag = el('div');
  frag.appendChild(el('div', { class: 'page-title' }, [
    el('div', {}, [el('h2', {}, ['Ride-alongs']), el('p', {}, ['What you briefed, where, and what still needs an answer'])]),
    el('button', {
      class: 'btn primary sm', type: 'button',
      onclick: () => { if (!state.locations.length) { toast('Add a location first'); return; } openRideModal(null); }
    }, ['+ Log ride'])
  ]));

  if (state.locations.length) {
    frag.appendChild(el('div', { class: 'card', style: 'display:flex;align-items:center;gap:10px;padding:10px 12px' }, [
      el('span', { style: 'font-size:11.5px;font-weight:700;color:var(--muted)' }, ['SHOW']),
      filterSelect([{ v: '', t: 'All locations' }].concat(state.locations.map((l) => ({ v: l.id, t: l.name }))),
        state.ui.rideFilter, (v) => { state.ui.rideFilter = v; render(); }, 'Filter ride-alongs')
    ]));
  }

  const qOpen = openQuestions(state.ui.rideFilter || undefined);
  if (qOpen.length) {
    const qc = el('div', { class: 'card' });
    qc.appendChild(el('div', { class: 'card-head' }, [
      el('h3', { class: 'card-title' }, ['Open questions for HR']),
      el('span', { class: 'badge open' }, [qOpen.length + ' OPEN'])
    ]));
    qOpen.forEach((q) => {
      const l = locById(q.locId);
      qc.appendChild(el('div', { class: 'row-item' }, [
        el('span', { class: 'thumb' }, ['❓']),
        el('span', { class: 'grow' }, [
          el('span', { class: 't', style: 'display:block' }, [q.text]),
          el('span', { class: 's', style: 'display:block' }, [(l ? l.name : 'Unknown') + ' · ' + fmtDate(String(q.createdAt || '').slice(0, 10))])
        ]),
        el('button', {
          class: 'btn sm', type: 'button',
          onclick: () => {
            q.answered = true; q.answeredAt = nowISO();
            save(true); toast('Marked answered'); render();
          }
        }, ['Answered'])
      ]));
    });
    frag.appendChild(qc);
  }

  if (!state.rides.length) {
    frag.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'empty' }, [
        el('div', { class: 'big' }, ['🚛']),
        el('p', {}, ['No ride-alongs logged yet. Log one to track which programs each location has been briefed on.']),
        el('button', {
          class: 'btn primary', type: 'button',
          onclick: () => { if (!state.locations.length) { toast('Add a location first'); return; } openRideModal(null); }
        }, ['+ Log ride-along'])
      ])
    ]));
    return frag;
  }

  const sorted = state.rides.slice()
    .filter((r) => !state.ui.rideFilter || r.locId === state.ui.rideFilter)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  sorted.forEach((r) => {
    const l = locById(r.locId);
    const covered = (r.covered || []).length;
    const open = (r.questions || []).filter((q) => !q.answered).length;
    const card = el('div', { class: 'card' });

    card.appendChild(el('div', { class: 'card-head' }, [
      el('div', { style: 'display:flex;align-items:center;gap:10px;min-width:0' }, [
        el('span', { class: 'thumb' }, ['🚛']),
        el('div', { style: 'min-width:0' }, [
          el('h3', { class: 'card-title', style: 'display:block' }, [l ? l.name : 'Unknown location']),
          el('p', { class: 'card-sub' }, [fmtDate(r.date) + (r.drivers ? ' · ' + r.drivers : '')])
        ])
      ]),
      el('div', { style: 'display:flex;gap:6px' }, [
        open ? el('span', { class: 'badge open' }, [open + ' OPEN']) : null,
        el('span', { class: 'badge ' + (covered === PROGRAMS.length ? 'ok' : 'draft') }, [covered + '/' + PROGRAMS.length + ' COVERED'])
      ].filter(Boolean))
    ]));

    const chips = el('div', { style: 'display:flex;flex-wrap:wrap;gap:5px;margin-top:2px' });
    PROGRAMS.forEach((p) => {
      const on = (r.covered || []).includes(p.id);
      chips.appendChild(el('span', {
        class: 'badge ' + (on ? 'ok' : ''),
        title: p.name
      }, [p.icon + ' ' + (p.short || p.name)]));
    });
    card.appendChild(chips);

    if (r.notes) card.appendChild(el('p', { style: 'font-size:12.5px;color:var(--muted);margin:10px 0 0;line-height:1.4' }, [r.notes]));

    (r.questions || []).forEach((q) => {
      if (q.answered) return;
      card.appendChild(el('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:8px;background:var(--amber-soft);border-radius:9px;padding:8px 10px' }, [
        el('span', { style: 'font-size:13px' }, ['❓']),
        el('span', { style: 'flex:1;font-size:12.5px;color:#7c2d12' }, [q.text]),
        el('button', {
          class: 'btn sm', type: 'button',
          onclick: () => { q.answered = true; q.answeredAt = nowISO(); save(true); render(); }
        }, ['Answered'])
      ]));
    });

    card.appendChild(el('div', { style: 'display:flex;gap:8px;margin-top:10px' }, [
      el('button', { class: 'btn sm', type: 'button', onclick: () => openRideModal(r) }, ['✎ Edit']),
      el('button', {
        class: 'btn sm danger', type: 'button',
        onclick: () => {
          if (!confirm('Delete this ride-along?')) return;
          state.rides = state.rides.filter((x) => x.id !== r.id);
          state.questions = state.questions.filter((q) => q.rideId !== r.id);
          save(true); toast('Deleted'); render();
        }
      }, ['Delete'])
    ]));

    frag.appendChild(card);
  });

  return frag;
}

/* ------------------------------ REPORTS ------------------------------ */

function renderReports() {
  const frag = el('div');
  frag.appendChild(el('div', { class: 'page-title' }, [
    el('div', {}, [el('h2', {}, ['Location sheet']), el('p', {}, ['Print or save the benefits page for one terminal'])])
  ]));

  if (!state.locations.length) {
    frag.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'empty' }, [
        el('div', { class: 'big' }, ['🖨️']),
        el('p', {}, ['Add a location and enter its values to generate a sheet.'])
      ])
    ]));
    return frag;
  }

  const locId = selectedLocId();
  const pick = el('div', { class: 'card no-print' });
  pick.appendChild(el('label', { class: 'field-label', style: 'display:block;margin-bottom:6px' }, ['LOCATION']));
  pick.appendChild(locPicker(() => render()));
  pick.appendChild(el('div', { style: 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap' }, [
    el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, ['🖨️ Print / Save PDF']),
    el('button', { class: 'btn', type: 'button', onclick: () => copySummary(locId) }, ['Copy summary text'])
  ]));
  frag.appendChild(pick);

  const shell = el('div', { class: 'report-shell' });
  shell.appendChild(buildSheet(locId));
  frag.appendChild(shell);
  return frag;
}

function buildSheet(locId) {
  const l = locById(locId) || { name: '', contacts: {} };
  const pr = locProgress(locId);
  const sheet = el('div', { class: 'sheet' });

  sheet.appendChild(el('div', { class: 'sheet-head' }, [
    el('img', { src: 'icons/logo-tile.png', alt: 'U.S. AutoForce' }),
    el('div', {}, [
      el('h3', {}, ['Driver Benefits — ' + l.name]),
      el('p', {}, [(l.city ? l.city + ', ' : '') + (l.state || '') + (l.benefitYear ? ' · Benefit year ' + l.benefitYear : '')])
    ])
  ]));

  if (pr.done < pr.total) {
    sheet.appendChild(el('div', { class: 'pending' }, ['PENDING — ' + (pr.total - pr.done) + ' of ' + pr.total + ' programs still awaiting confirmed values']));
  } else {
    sheet.appendChild(el('div', { class: 'done' }, ['COMPLETE — all ' + pr.total + ' programs confirmed']));
  }

  const table = el('table');
  table.appendChild(el('thead', {}, [
    el('tr', {}, [
      el('th', { style: 'width:26%' }, ['PROGRAM']),
      el('th', { style: 'width:24%' }, ['AMOUNT']),
      el('th', { style: 'width:24%' }, ['WHO IS ELIGIBLE']),
      el('th', { style: 'width:26%' }, ['HOW TO CLAIM'])
    ])
  ]));
  const tbody = el('tbody');
  PROGRAMS.forEach((p) => {
    const v = getVal(locId, p.id);
    tbody.appendChild(el('tr', {}, [
      el('td', { class: 'k' }, [p.name]),
      el('td', {}, [v.amount || el('span', { class: 'blankline' }, ['_______________'])]),
      el('td', {}, [v.eligibility || el('span', { class: 'blankline' }, ['_______________'])]),
      el('td', {}, [v.claim || el('span', { class: 'blankline' }, ['_______________'])])
    ]));
  });
  table.appendChild(tbody);
  sheet.appendChild(table);

  const cWrap = el('div', { class: 'contacts' });
  CONTACT_ROLES.forEach((role) => {
    const c = (l.contacts && l.contacts[role.id]) || {};
    cWrap.appendChild(el('div', {}, [
      el('b', {}, [c.name || '—']),
      el('span', { style: 'color:#2563eb;font-weight:700;font-size:8.5px' }, [role.label]),
      el('div', {}, [[c.phone, c.email].filter(Boolean).join(' · ')])
    ]));
  });
  sheet.appendChild(cWrap);

  sheet.appendChild(el('div', { class: 'foot' }, [
    el('span', {}, ['Summary of benefits — not the plan document. Values confirmed by HR.']),
    el('span', {}, ['Generated ' + fmtDate(todayISO())])
  ]));

  return sheet;
}

function copySummary(locId) {
  const l = locById(locId);
  const lines = ['DRIVER BENEFITS — ' + l.name, ''];
  PROGRAMS.forEach((p) => {
    const v = getVal(locId, p.id);
    lines.push(p.name + ': ' + (v.amount || 'TBD'));
    if (v.eligibility) lines.push('  Eligible: ' + v.eligibility);
    if (v.claim) lines.push('  How: ' + v.claim);
  });
  const text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('Summary copied'), () => toast('Copy failed'));
  } else {
    toast('Clipboard not available');
  }
}

/* ------------------------------ modals ------------------------------ */

function openModal(title, sub, content, actions) {
  closeModal();
  const back = el('div', { class: 'modal-back', id: 'modalBack' });
  const m = el('div', { class: 'modal' }, [
    el('h3', {}, [title]),
    sub ? el('p', { class: 'msub' }, [sub]) : null,
    content,
    el('div', { class: 'mactions' }, actions)
  ].filter(Boolean));
  back.appendChild(m);
  back.addEventListener('click', (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
  return m;
}

function closeModal() {
  const b = document.getElementById('modalBack');
  if (b) b.remove();
}

function openLocationModal(existing) {
  const l = existing || { name: '', city: '', state: '', driverCount: '', benefitYear: '', planStart: '', carriers: '', union: '', contacts: {} };
  const name = el('input', { type: 'text', value: l.name, placeholder: 'e.g. Fruitland' });
  const city = el('input', { type: 'text', value: l.city || '', placeholder: 'Fruitland' });
  const st = el('input', { type: 'text', value: l.state || '', placeholder: 'IA' });
  const count = el('input', { type: 'number', value: l.driverCount || '', placeholder: '24' });
  const year = el('input', { type: 'text', value: l.benefitYear || '', placeholder: '2027' });
  const carriers = el('input', { type: 'text', value: l.carriers || '', placeholder: 'Medical / dental / vision' });
  const union = el('input', { type: 'text', value: l.union || '', placeholder: 'None — or contract name' });

  const content = el('div');
  content.appendChild(field('Location name *', name));
  content.appendChild(el('div', { class: 'grid2' }, [field('City', city), field('State', st)]));
  content.appendChild(el('div', { class: 'grid2' }, [
    field('Drivers covered', count), field('Benefit year', year)
  ]));
  content.appendChild(field('Carriers', carriers));
  content.appendChild(field('Union / contract', union));

  content.appendChild(el('div', { style: 'margin:14px 0 6px;font-size:12px;font-weight:800;color:var(--ink)' }, ['Who drivers call']));
  const contactInputs = {};
  CONTACT_ROLES.forEach((role) => {
    const c = (l.contacts && l.contacts[role.id]) || {};
    const n = el('input', { type: 'text', value: c.name || '', placeholder: 'Name' });
    const ph = el('input', { type: 'text', value: c.phone || '', placeholder: 'Phone' });
    const em = el('input', { type: 'text', value: c.email || '', placeholder: 'Email' });
    contactInputs[role.id] = { n, ph, em };
    content.appendChild(el('div', { style: 'border-top:1px solid var(--line);padding-top:9px;margin-top:9px' }, [
      el('div', { style: 'font-size:10.5px;font-weight:800;color:var(--accent);letter-spacing:.3px;margin-bottom:6px' }, [role.label.toUpperCase()]),
      n,
      el('div', { class: 'grid2', style: 'margin-top:6px' }, [ph, em])
    ]));
  });

  const saveBtn = el('button', {
    class: 'btn primary', type: 'button',
    onclick: () => {
      if (!name.value.trim()) { toast('Location name is required'); name.focus(); return; }
      const target = existing || { id: uid(), createdAt: nowISO() };
      target.name = name.value.trim();
      target.city = city.value.trim();
      target.state = st.value.trim().toUpperCase();
      target.driverCount = count.value.trim();
      target.benefitYear = year.value.trim();
      target.carriers = carriers.value.trim();
      target.union = union.value.trim();
      target.contacts = {};
      CONTACT_ROLES.forEach((role) => {
        const c = contactInputs[role.id];
        target.contacts[role.id] = { name: c.n.value.trim(), phone: c.ph.value.trim(), email: c.em.value.trim() };
      });
      target.updatedAt = nowISO();
      if (!target.auditId) target.auditId = 'LOC-' + todayISO().replace(/-/g, '') + '-' + uid().slice(0, 4).toUpperCase();
      if (existing) {
        const i = state.locations.findIndex((x) => x.id === target.id);
        if (i >= 0) state.locations[i] = target;
      } else {
        state.locations.push(target);
        if (!state.settings.selectedLocation) state.settings.selectedLocation = target.id;
      }
      save(true);
      closeModal();
      toast(existing ? 'Location updated' : 'Location added');
      render();
    }
  }, [existing ? 'Save changes' : 'Add location']);

  openModal(existing ? 'Edit location' : 'Add location', 'Values and contacts can be filled in after', content, [
    el('button', { class: 'btn', type: 'button', onclick: closeModal }, ['Cancel']),
    saveBtn
  ]);
  setTimeout(() => name.focus(), 80);
}

function field(label, input) {
  return el('div', { class: 'field' }, [el('label', {}, [label]), input]);
}

function openRideModal(existing) {
  const r = existing || { id: '', locId: selectedLocId(), date: todayISO(), drivers: '', covered: [], notes: '', questions: [] };
  const locSel = el('select');
  state.locations.forEach((l) => locSel.appendChild(el('option', { value: l.id }, [l.name])));
  locSel.value = r.locId || (state.locations[0] && state.locations[0].id) || '';

  const dateInp = el('input', { type: 'date', value: r.date || todayISO() });
  const drivers = el('input', { type: 'text', value: r.drivers || '', placeholder: 'e.g. Kyle Osei + 2 riders' });

  const boxes = {};
  const chipWrap = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' });
  PROGRAMS.forEach((p) => {
    const on = (r.covered || []).includes(p.id);
    const b = el('button', {
      type: 'button',
      class: 'btn sm' + (on ? ' gold' : ''),
      style: 'border-radius:999px',
      onclick: () => {
        boxes[p.id] = !boxes[p.id];
        b.classList.toggle('gold', boxes[p.id]);
      }
    }, [p.icon + ' ' + p.name]);
    boxes[p.id] = on;
    chipWrap.appendChild(b);
  });

  const notes = el('textarea', { placeholder: 'What came up? Anything that needs follow-up?' });
  notes.value = r.notes || '';
  const qs = el('textarea', { placeholder: 'One question per line — each becomes an open item for HR' });
  qs.value = (r.questions || []).filter((q) => !q.answered).map((q) => q.text).join('\n');

  const content = el('div');
  content.appendChild(field('Location', locSel));
  content.appendChild(el('div', { class: 'grid2' }, [field('Date', dateInp), field('Drivers present', drivers)]));
  content.appendChild(el('div', { class: 'field' }, [el('label', {}, ['Programs covered']), chipWrap]));
  content.appendChild(field('Notes', notes));
  content.appendChild(field('Questions for HR', qs));

  const saveBtn = el('button', {
    class: 'btn primary', type: 'button',
    onclick: () => {
      const target = existing || { id: uid(), createdAt: nowISO(), questions: [] };
      const covered = PROGRAMS.filter((p) => boxes[p.id]).map((p) => p.id);
      target.locId = locSel.value;
      target.date = dateInp.value || todayISO();
      target.drivers = drivers.value.trim();
      target.covered = covered;
      target.notes = notes.value.trim();
      target.updatedAt = nowISO();
      if (!target.auditId) target.auditId = 'RIDE-' + todayISO().replace(/-/g, '') + '-' + uid().slice(0, 4).toUpperCase();

      const kept = (existing ? existing.questions : []).filter((q) => q.answered);
      const lines = qs.value.split('\n').map((s) => s.trim()).filter(Boolean);
      const fresh = lines.map((text) => ({ id: uid(), text, answered: false, createdAt: nowISO(), locId: target.locId, rideId: target.id }));
      target.questions = kept.concat(fresh);

      if (existing) {
        const i = state.rides.findIndex((x) => x.id === target.id);
        if (i >= 0) state.rides[i] = target;
        state.questions = state.questions.filter((q) => q.rideId !== target.id).concat(target.questions);
      } else {
        state.rides.push(target);
        state.questions = state.questions.concat(target.questions);
      }
      save(true);
      closeModal();
      toast('Ride-along saved');
      render();
    }
  }, [existing ? 'Save changes' : 'Save ride-along']);

  openModal(existing ? 'Edit ride-along' : 'Log ride-along', 'Track what you briefed and what still needs an answer', content, [
    el('button', { class: 'btn', type: 'button', onclick: closeModal }, ['Cancel']),
    saveBtn
  ]);
}

/* ------------------------------ backup ------------------------------ */

function exportBackup() {
  const payload = {
    app: 'navigator-hub', version: 1, exportedAt: nowISO(),
    locations: state.locations, values: state.values, rides: state.rides,
    questions: state.questions, settings: state.settings
  };
  download('navigator-hub-backup-' + todayISO() + '.json', JSON.stringify(payload, null, 2));
  toast('Backup downloaded');
}

function importBackup() {
  const inp = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let d;
      try { d = JSON.parse(String(rd.result)); } catch (e) { toast('That file is not valid JSON'); return; }
      if (!d || !Array.isArray(d.locations)) { toast('No locations found in that file'); return; }
      const ok = confirm('SYNC this file onto this device?\n\nAdds new locations and updates matching ones. Nothing already here is removed.');
      if (!ok) return;
      let add = 0, upd = 0;
      const byId = {};
      state.locations.forEach((l) => { byId[l.id] = l; });
      d.locations.forEach((raw) => {
        const l = ensureLocation(raw);
        if (byId[l.id]) { upd++; const i = state.locations.findIndex((x) => x.id === l.id); state.locations[i] = l; }
        else { add++; state.locations.push(l); }
      });
      Object.assign(state.values, d.values || {});
      const rids = new Set(state.rides.map((r) => r.id));
      (d.rides || []).forEach((r) => { if (!rids.has(r.id)) { state.rides.push(r); add++; } });
      const qids = new Set(state.questions.map((q) => q.id));
      (d.questions || []).forEach((q) => { if (!qids.has(q.id)) state.questions.push(q); });
      save(true);
      toast('Synced: +' + add + ' new, ' + upd + ' updated');
      render();
    };
    rd.readAsText(f);
  });
  document.body.appendChild(inp);
  inp.click();
  setTimeout(() => inp.remove(), 60000);
}

function exportCsv() {
  const rows = [['Location', 'Program', 'Amount', 'Eligibility', 'How to claim', 'Effective', 'Status', 'Confirmed by']];
  state.locations.forEach((l) => {
    PROGRAMS.forEach((p) => {
      const v = getVal(l.id, p.id);
      rows.push([l.name, p.name, v.amount, v.eligibility, v.claim, v.effective, v.status, v.confirmedBy]);
    });
  });
  const csv = rows.map((r) => r.map((v) => {
    const s = String(v == null ? '' : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n');
  download('navigator-hub-values-' + todayISO() + '.csv', csv, 'text/csv');
  toast('CSV downloaded');
}

/* ------------------------------ boot ------------------------------ */

function boot() {
  applyTheme();
  updateNetBadge();
  window.addEventListener('online', updateNetBadge);
  window.addEventListener('offline', updateNetBadge);
  window.addEventListener('hashchange', () => { if (applyHash()) render(); });

  const tt = document.getElementById('themeToggle');
  if (tt) tt.addEventListener('click', toggleTheme);

  document.querySelectorAll('.tab').forEach((b) => {
    b.addEventListener('click', () => go(b.dataset.view));
  });

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem(THEME_KEY)) {
    localStorage.setItem(THEME_KEY, 'dark');
    applyTheme();
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      void 0.catch(() => {});
    });
  }

  load();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
