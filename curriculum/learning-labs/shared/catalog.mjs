// Catalog enhancements: progress on each card, "this week in class", unit folding,
// search and filters that live in the URL. The page works without JavaScript.
const STORE = 'eduwonderlab:learning-lab:v1:';
const cards = [...document.querySelectorAll('.lab-card[data-lab]')];
const units = [...document.querySelectorAll('.catalog-unit')];
const navLinks = [...document.querySelectorAll('.unit-nav a')];
const form = document.querySelector('[data-finder]');
const requested = new URLSearchParams(location.search).get('unit') || /^#unit-(\d+)$/.exec(location.hash)?.[1];
const labForLesson = new Map(cards.flatMap((card) => card.dataset.lessons.split(' ').map((id) => [id, card])));

// ---- Progress (summaries are written by app.mjs on every save) ----
function readProgress(id) {
  let state = null;
  try { state = JSON.parse(localStorage.getItem(STORE + id) || 'null'); } catch { return null; }
  if (!state || state.version !== 1) return null;
  if (state.summary && Number.isFinite(state.summary.total)) return state.summary;
  // Saved before summaries existed: any written work counts as started.
  const touched = Object.values(state.notes || {}).some(Boolean) || Object.keys(state.practice || {}).length || state.created;
  return touched ? { done: 0, total: 6, started: true, savedAt: 0 } : null;
}
const statusOf = (p) => (!p ? 'new' : p.total && p.done >= p.total ? 'done' : p.started || p.done ? 'started' : 'new');
const ctaText = { new: 'Start lab', started: 'Keep going', done: 'Review lab' };
const progress = new Map();
for (const card of cards) {
  const p = readProgress(card.dataset.lab), status = statusOf(p);
  progress.set(card, { ...p, status });
  card.dataset.status = status;
  card.querySelector('.card-cta').textContent = ctaText[status];
  const label = card.querySelector('[data-progress]');
  if (status === 'done') label.textContent = 'Finished ✓';
  else if (status === 'started') {
    label.textContent = p.done ? `${p.done} of ${p.total} parts done` : 'Started';
    const meter = document.createElement('span');
    meter.className = 'card-meter'; meter.setAttribute('aria-hidden', 'true');
    meter.innerHTML = `<span style="width:${Math.round((100 * (p.done || 0)) / (p.total || 6))}%"></span>`;
    label.after(meter);
  }
}
for (const unit of units) {
  const inUnit = cards.filter((c) => c.dataset.unit === unit.dataset.unit);
  const finished = inUnit.filter((c) => c.dataset.status === 'done').length;
  const started = inUnit.filter((c) => c.dataset.status === 'started').length;
  const parts = [finished && `${finished} finished`, started && `${started} in progress`].filter(Boolean);
  unit.querySelector('[data-unit-progress]').textContent = parts.join(' · ');
}

// ---- This week in class, from the published pacing plan ----
const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function classWeek() {
  const days = Array.isArray(window.__NT_PACING_DAYS) ? window.__NT_PACING_DAYS : [];
  if (!days.length) return null;
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const shift = { 0: 1, 6: 2 }[today.getDay()] ?? 1 - today.getDay(); // weekends look at the coming week
  const monday = addDays(today, shift), friday = addDays(monday, 4);
  const labsIn = (rows) => [...new Set(rows.map(([, id]) => labForLesson.get(String(id).replace(/-(catchup|flagship)$/, ''))).filter(Boolean))];
  const inRange = (from, to) => days.filter(([date, id]) => id && date >= isoLocal(from) && date <= isoLocal(to));
  const week = labsIn(inRange(monday, friday));
  if (week.length) return { title: 'This week in class', labs: week };
  const ahead = inRange(addDays(friday, 1), addDays(friday, 21));
  if (ahead.length) return { title: 'Coming up in class', labs: labsIn([ahead[0]]) };
  const behind = inRange(addDays(monday, -21), addDays(monday, -1));
  if (behind.length) return { title: 'Recently in class', labs: labsIn([behind.at(-1)]) };
  return null;
}
const week = classWeek();
const weekCards = new Set(week?.labs || []);
for (const card of weekCards) {
  const badge = document.createElement('span');
  badge.className = 'card-badge'; badge.textContent = week.title;
  card.querySelector('.card-top').append(badge);
}
const keepGoing = cards
  .filter((c) => progress.get(c).status === 'started')
  .sort((a, b) => (progress.get(b).savedAt || 0) - (progress.get(a).savedAt || 0))
  .slice(0, 2);

function tile(card) {
  const p = progress.get(card);
  const status = p.status === 'done' ? 'Finished ✓' : p.status === 'started' ? (p.done ? `${p.done} of ${p.total} parts done` : 'Started') : 'Not started';
  const a = document.createElement('a');
  a.className = 'spotlight-card'; a.href = card.querySelector('.card-link').href;
  a.style.setProperty('--accent', card.style.getPropertyValue('--accent'));
  a.innerHTML = `<span class="spotlight-icon" aria-hidden="true"></span><span class="spotlight-text"><strong></strong><span class="spotlight-lessons"></span><span class="spotlight-status"></span></span>`;
  a.querySelector('.spotlight-icon').textContent = card.querySelector('.lab-card-icon').textContent;
  a.querySelector('strong').textContent = card.querySelector('.card-link').textContent;
  a.querySelector('.spotlight-lessons').textContent = card.querySelector('.lesson-label').textContent;
  a.querySelector('.spotlight-status').textContent = status;
  return a;
}
const spotlight = document.getElementById('labs-spotlight');
const groups = [['Keep going', keepGoing], [week?.title, [...weekCards].filter((c) => !keepGoing.includes(c))]].filter(([title, list]) => title && list.length);
if (spotlight && groups.length) {
  const host = spotlight.querySelector('.spotlight-groups');
  for (const [title, list] of groups) {
    const group = document.createElement('div');
    group.className = 'spotlight-group';
    group.innerHTML = '<h3></h3><div class="spotlight-list"></div>';
    group.querySelector('h3').textContent = title;
    list.forEach((card) => group.querySelector('.spotlight-list').append(tile(card)));
    host.append(group);
  }
  spotlight.hidden = false;
}

// ---- Unit folding: open the units that matter now; everything stays one click away ----
const focusUnits = new Set([...weekCards, ...keepGoing].map((c) => c.dataset.unit));
function defaultFolding() {
  if (!focusUnits.size) return units.forEach((u) => { u.open = true; });
  for (const unit of units) unit.open = focusUnits.has(unit.dataset.unit);
}
function openUnit(number, scroll) {
  const unit = document.getElementById(`unit-${number}`);
  if (!unit) return;
  unit.open = true;
  if (scroll) requestAnimationFrame(() => unit.scrollIntoView({ block: 'start' }));
}
defaultFolding();
const tools = document.querySelector('[data-unit-tools]');
if (tools) {
  tools.hidden = false;
  tools.addEventListener('click', (event) => {
    const mode = event.target.closest('[data-units]')?.dataset.units;
    if (mode) units.forEach((u) => { if (!u.hidden) u.open = mode === 'open'; });
  });
}
navLinks.forEach((link) => link.addEventListener('click', () => openUnit(link.hash.replace('#unit-', ''), false)));
window.addEventListener('hashchange', () => { const m = /^#unit-(\d+)$/.exec(location.hash); if (m) openUnit(m[1], false); });

// ---- Search and filters, mirrored in the URL so a link can open straight to a result ----
if (form) {
  form.hidden = false;
  const input = form.elements.q, model = form.elements.model, status = form.elements.status;
  const message = form.querySelector('.finder-status');
  const params = new URLSearchParams(location.search);
  input.value = params.get('q') || '';
  if ([...model.options].some((o) => o.value === params.get('model'))) model.value = params.get('model');
  if ([...status.options].some((o) => o.value === params.get('status'))) status.value = params.get('status');
  const apply = () => {
    const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const active = terms.length > 0 || model.value || status.value;
    let shown = 0;
    for (const card of cards) {
      const hit = terms.every((t) => card.dataset.search.includes(t)) && (!model.value || card.dataset.model === model.value) && (!status.value || card.dataset.status === status.value);
      card.hidden = !hit; if (hit) shown++;
    }
    for (const unit of units) {
      const any = [...unit.querySelectorAll('.lab-card')].some((c) => !c.hidden);
      unit.hidden = !any;
      if (active && any) unit.open = true;
    }
    navLinks.forEach((link) => { link.parentElement.hidden = document.getElementById(link.hash.slice(1))?.hidden; });
    if (!active) defaultFolding();
    message.textContent = !active ? '' : shown ? `${shown} of ${cards.length} labs match.` : 'No labs match. Try a lesson number such as 4.2, a topic such as ratio, or clear the filters.';
    const next = new URLSearchParams();
    if (input.value.trim()) next.set('q', input.value.trim());
    if (model.value) next.set('model', model.value);
    if (status.value) next.set('status', status.value);
    const query = next.toString();
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  };
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  form.addEventListener('reset', () => setTimeout(apply));
  if (input.value || model.value || status.value) apply();
}
if (requested) openUnit(requested, true);
