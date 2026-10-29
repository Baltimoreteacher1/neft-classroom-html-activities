/**
 * The first screen of a family homework page, built from the Family Math Studio design system
 * (assets/design/family/): compact top bar, unit art band, unit eyebrow, the lesson as the one H1,
 * the lesson's own `v3.hook` as a hook card in its `v3.hook.style` shape, two route cards and one
 * Start button. Everything else a family may want (share, print, scratchpad, standard, reader
 * options, text size) lives in the "More" sheet.
 *
 * Pure functions: data in, markup out. The hero's styles are in assets/design/family/family.css
 * (the `.fm-hero`, `.fm-topbar`, `.fm-route`, `.fm-hook` patterns); there is no hero CSS in this file.
 *
 * Ids and data attributes the session-flow and experience scripts rely on are kept on purpose:
 * #hw_start_button, #hw_route_note, #hw_resume_note, [data-route-mode], [data-lang-mode],
 * [data-persona-btn], [data-hw-tonight-time], #hw_text_link, #hw_email_link, #hw_offline_btn.
 */
import { readFileSync } from "node:fs";
import { icon } from "./family-icons.mjs";
import { act } from "./homework-actions.mjs";
import { bi } from "./homework-v3-learn.mjs";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The localStorage key that holds the reader's options (theme, text size, spacing, dyslexia). */
export const READER_KEY = "fm-reader-v1";

/** v3.hook.style -> the design system's variant, the icon and the label above the story. */
export const HOOK_VARIANTS = {
  "price-tag": {
    variant: "price-tag",
    icon: "price-tag",
    en: "Price tag",
    es: "Etiqueta de precio",
  },
  recipe: { variant: "recipe", icon: "kitchen", en: "Recipe card", es: "Tarjeta de receta" },
  scoreboard: { variant: "scoreboard", icon: "scoreboard", en: "Score board", es: "Marcador" },
  map: { variant: "map-pin", icon: "map", en: "Map pin", es: "Punto en el mapa" },
  ticket: { variant: "ticket", icon: "ticket", en: "Ticket", es: "Boleto" },
  receipt: { variant: "receipt", icon: "receipt", en: "Receipt", es: "Recibo" },
};

const SCENE_DIR = new URL("../../assets/design/family/art/scenes/", import.meta.url);
const sceneCache = new Map();
/** The unit's hero scene, inline so it follows the page theme. Decorative. */
export function unitScene(unit) {
  const n = String(Math.min(10, Math.max(1, Number(unit) || 1))).padStart(2, "0");
  if (!sceneCache.has(n)) {
    // Crop from the top: the band is wide and short, and the ground, the people and the shop front sit at the bottom.
    sceneCache.set(
      n,
      readFileSync(new URL(`unit-${n}.svg`, SCENE_DIR), "utf8")
        .trim()
        .replace('preserveAspectRatio="xMidYMid slice"', 'preserveAspectRatio="xMidYMax slice"'),
    );
  }
  return sceneCache.get(n);
}

/** Inline script run in <head> so the reader's options apply before the first paint. */
export const READER_BOOT_JS = `(function(){try{var s=JSON.parse(localStorage.getItem('${READER_KEY}')||'{}'),r=document.documentElement;if(s.theme==='light'||s.theme==='dark'||s.theme==='contrast')r.setAttribute('data-theme',s.theme);if(s.text==='115'||s.text==='130'||s.text==='150')r.setAttribute('data-text-size',s.text);if(s.spacing==='more')r.setAttribute('data-spacing','more');if(s.reading==='dyslexia')r.setAttribute('data-reading','dyslexia');}catch(e){}})();`;

const LANGS = [
  { mode: "en", short: "EN", en: "English", es: "Inglés" },
  { mode: "es", short: "ES", en: "Spanish", es: "Español" },
  {
    mode: "bilingual",
    short: "EN · ES",
    en: "English and Spanish together",
    es: "Inglés y español juntos",
  },
];

/** Three-way language picker. The page script keeps `.active` and aria-pressed in step. */
export function renderLanguageSwitch({ initial = "en", names = true, handlers = true } = {}) {
  const buttons = LANGS.map(
    (l) =>
      `<button type="button" class="lang-toggle-btn${l.mode === initial ? " active" : ""}" data-lang-mode="${l.mode}"${handlers ? ` ${act("setLanguageMode", l.mode)}` : ""} aria-pressed="${l.mode === initial}" aria-label="${names ? `${l.en} / ${l.es}` : l.en}">${l.short}</button>`,
  ).join("");
  return `<div class="hw-hero-controls"><div class="lang-selector-card"><div class="lang-selector-buttons fm-seg" role="group" aria-label="Language / Idioma" data-aria-en="Language" data-aria-es="Idioma">${buttons}</div></div></div>`;
}

function iconButton({ id = "", label, es, svg, attrs = "", wide = false }) {
  return `<button type="button"${id ? ` id="${id}"` : ""} class="fm-btn fm-btn--icon${wide ? " fm-topbar__wide" : ""}" aria-label="${esc(label)}" data-aria-en="${esc(label)}" data-aria-es="${esc(es)}"${attrs}>${svg}</button>`;
}

/**
 * The compact top bar: wordmark/home, language, Grown-up tips, text size, read-aloud, save state, More.
 * `full: false` is the word-problems page, which has no reader sheet: language only.
 */
export function renderTopBar({ readAloud, full = true, initialLang = "en" } = {}) {
  const brand = `<a class="fm-topbar__brand" href="/" aria-label="Family Math Studio home" data-aria-en="Family Math Studio home" data-aria-es="Inicio de Estudio familiar de matemáticas"><span class="fm-topbar__mark">${icon("home")}</span><span class="fm-topbar__brand-text">${bi("Family Math", "Matemáticas en familia")}</span></a>`;
  const tools = full
    ? [
        renderLanguageSwitch(),
        iconButton({
          id: "hw_grownup_toggle",
          label: "Grown-up tips",
          es: "Consejos para adultos",
          svg: icon("grownup"),
          attrs: ' data-persona-btn="copilot" aria-pressed="false"',
        }),
        iconButton({
          label: "Text size",
          es: "Tamaño del texto",
          svg: icon("text-size"),
          attrs: " data-fm-text-cycle",
          wide: true,
        }),
        readAloud
          ? iconButton({
              label: "Read aloud",
              es: "Leer en voz alta",
              svg: icon("speaker"),
              attrs: ` data-fm-read data-en="${esc(readAloud.en)}" data-es="${esc(readAloud.es)}"`,
              wide: true,
            })
          : "",
        `<span class="fm-save fm-topbar__wide" data-state="saved" role="status" data-fm-save><span class="lang-en">Saved on this device</span><span class="lang-es" lang="es">Guardado en este dispositivo</span></span>`,
        iconButton({
          id: "hw_more_button",
          label: "More",
          es: "Más",
          svg: icon("more"),
          attrs: ' data-open-sheet="hw_more_sheet" aria-haspopup="dialog"',
        }),
      ].join("")
    : renderLanguageSwitch({ initial: initialLang, handlers: false });
  return `<nav class="fm-topbar hw-topbar" id="hw_topbar" aria-label="Page options" data-aria-en="Page options" data-aria-es="Opciones de la página">${brand}<div class="fm-topbar__tools">${tools}</div></nav>`;
}

/** The lesson's own hook as a design-system hook card. The story text is the lesson's, never invented. */
export function renderHookCard(hook) {
  const v = HOOK_VARIANTS[hook?.style];
  if (!v) throw new Error(`hero: unknown v3.hook.style "${hook?.style}"`);
  return `<div class="fm-hook hw-hook" data-variant="${v.variant}"><p class="fm-hook__kicker">${icon(v.icon, "sm")} <span>${bi(v.en, v.es)}</span></p><p class="fm-hook__text">${bi(hook.en, hook.es)}</p></div>`;
}

/** Experience badge (arcade, detective, unlock): a designed badge with an icon and a tooltip, not a chip. */
export function renderExperienceBadge(experience) {
  if (!experience?.titleEn) return "";
  const kind = /arcade/i.test(experience.titleEn)
    ? "game"
    : /detective/i.test(experience.titleEn)
      ? "eye"
      : /unlock/i.test(experience.titleEn)
        ? "unlock"
        : "star";
  const titleEs = experience.titleEs || experience.titleEn;
  const descEn = experience.descriptionEn || "";
  const descEs = experience.descriptionEs || descEn;
  return `<div class="hw-experience-banner fm-cluster">
          <span class="fm-xp-badge"><span class="fm-xp-badge__disc" aria-hidden="true">${icon(kind, "sm")}</span><span class="hw-experience-title">${bi(experience.titleEn, titleEs)}</span></span>
          <span class="fm-tooltip" data-align="end"><button type="button" class="fm-btn fm-btn--icon fm-btn--quiet" aria-label="About this activity" data-aria-en="About this activity" data-aria-es="Sobre esta actividad" aria-describedby="hw_xp_tip" data-fm-tip>${icon("question")}</button><span class="fm-tooltip__bubble hw-experience-description" role="tooltip" id="hw_xp_tip">${bi(descEn, descEs)}</span></span>
        </div>`;
}

function readerSheetControls() {
  const seg = (name, options) =>
    options
      .map(
        ([value, label]) =>
          `<label class="fm-seg__opt"><input type="radio" name="${name}" value="${value}" data-fm-pref="${name.replace("fm-", "")}"><span>${label}</span></label>`,
      )
      .join("");
  const sw = (pref, en, es) =>
    `<button type="button" class="fm-switch" role="switch" aria-checked="false" data-fm-switch="${pref}"><span class="fm-switch__track" aria-hidden="true"></span><span class="fm-switch__label">${bi(en, es)}</span><span class="fm-switch__state" aria-hidden="true"><span class="lang-en">Off</span><span class="lang-es" lang="es">No</span></span></button>`;
  return `
    <fieldset class="fm-field"><legend class="fm-label">${bi("Text size", "Tamaño del texto")}</legend><div class="fm-seg">${seg(
      "fm-text",
      [
        ["100", "100%"],
        ["115", "115%"],
        ["130", "130%"],
        ["150", "150%"],
      ],
    )}</div></fieldset>
    <fieldset class="fm-field"><legend class="fm-label">${bi("Colors", "Colores")}</legend><div class="fm-seg">${seg(
      "fm-theme",
      [
        ["auto", bi("Device", "Equipo")],
        ["light", bi("Light", "Claro")],
        ["dark", bi("Dark", "Oscuro")],
        ["contrast", bi("High contrast", "Alto contraste")],
      ],
    )}</div></fieldset>
    ${sw("spacing", "More space between letters and lines", "Más espacio entre letras y líneas")}
    ${sw("reading", "Easier-to-read letters", "Letras más fáciles de leer")}`;
}

/** The "More" sheet: reader options, share and print, scratchpad, offline sheet and the standard. */
export function renderMoreSheet({ standard, hasReader = true } = {}) {
  const share = `
    <div class="hw-hero-share-bar fm-stack fm-stack--sm">
      <button type="button" class="fm-btn fm-btn--block hw-share-btn" ${act("toggleScratchpad")}>${icon("pencil")}<span class="lang-en">Scratchpad</span><span class="lang-es" lang="es">Pizarra</span></button>
      <button type="button" class="fm-btn fm-btn--block hw-share-btn" ${act("copyHomeworkLink")}>${icon("share")}<span class="lang-en">Copy link</span><span class="lang-es" lang="es">Copiar enlace</span></button>
      <a class="fm-btn fm-btn--block hw-share-btn" id="hw_text_link" href="#" target="_blank" rel="noopener">${icon("share")}<span class="lang-en">Text</span><span class="lang-es" lang="es">Mensaje</span></a>
      <a class="fm-btn fm-btn--block hw-share-btn" id="hw_email_link" href="#" target="_blank" rel="noopener">${icon("share")}<span class="lang-en">Email</span><span class="lang-es" lang="es">Correo</span></a>
      <button type="button" class="fm-btn fm-btn--block hw-share-btn" ${act("printProblemsOnly")}>${icon("print")}<span class="lang-en">Print problems</span><span class="lang-es" lang="es">Imprimir preguntas</span></button>
      <button type="button" class="fm-btn fm-btn--block hw-share-btn" ${act("printRefrigeratorSheet")}>${icon("print")}<span class="lang-en">Print this plan’s problems</span><span class="lang-es" lang="es">Imprimir los problemas de este plan</span></button>
      <button type="button" class="fm-btn fm-btn--block hw-share-btn" ${act("printAnswerSheet")}>${icon("print")}<span class="lang-en">Print answer sheet</span><span class="lang-es" lang="es">Imprimir respuestas</span></button>
      <button type="button" class="fm-btn fm-btn--block hw-share-btn" id="hw_offline_btn" ${act("preparePaperPractice")}>${icon("book")}<span class="lang-en">Prepare paper practice</span><span class="lang-es" lang="es">Preparar práctica en papel</span></button>
    </div>`;
  const std = standard
    ? `<details class="hw-standard-details fm-card--inset"><summary class="hw-standard-summary"><span class="lang-en">Standard:</span><span class="lang-es" lang="es">Estándar:</span> <code>${esc(standard)}</code></summary><p class="hw-standard-desc"><span class="lang-en">This lesson builds proficiency in Grade 6 mathematical standard ${esc(standard)}.</span><span class="lang-es" lang="es">Esta lección desarrolla destrezas en el estándar matemático de 6.º grado ${esc(standard)}.</span></p></details>`
    : "";
  return `<dialog class="fm-sheet hw-tools-menu" id="hw_more_sheet" aria-labelledby="hw_more_title">
      <span class="fm-sheet__grab" aria-hidden="true"></span>
      <div class="fm-sheet__head"><h2 id="hw_more_title" class="fm-card__title">${bi("More", "Más")}</h2><button type="button" class="fm-btn fm-btn--icon" data-close aria-label="Close" data-aria-en="Close" data-aria-es="Cerrar">${icon("close")}</button></div>
      <div class="fm-sheet__body">${hasReader ? readerSheetControls() : ""}${share}${std}
        <p class="fm-save" data-state="saved" role="status" data-fm-save><span class="lang-en">Saved on this device</span><span class="lang-es" lang="es">Guardado en este dispositivo</span></p>
      </div>
    </dialog>`;
}

/** Where the weekly sheet lives; hero script and card both point here. */
export const WEEKLY_SHEET_BASE = "/curriculum/family-connections/weekly-sheet/";

/**
 * "Weekly practice sheet": the online sheet and this week's printable PDF, first row under the hero.
 * Both links work with no script (the PDF one falls back to the online sheet); HERO_JS points the PDF
 * at the current week and both at the reader's language.
 */
export function renderWeeklySheetCard() {
  const link = (kind, svg, en, es) =>
    `<a class="fm-btn" href="${WEEKLY_SHEET_BASE}" data-ws-link="${kind}">${svg}<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span></a>`;
  return `<div class="hw-weekly-sheet fm-cluster fm-no-print" role="group" aria-labelledby="hw_ws_title" data-ws-card><strong id="hw_ws_title">${bi("Weekly practice sheet", "Hoja semanal de práctica")}</strong>${link("online", icon("pencil", "sm"), "Fill it in online", "Llenarla en línea")}${link("pdf", icon("print", "sm"), "Print a copy (PDF)", "Imprimir una copia (PDF)")}</div>`;
}

/**
 * The hero. `routes` is the route-chooser markup (two route cards, Start, notes); omit it for a page
 * with no routes. `extras` are quieter rows under the hero: session banner, big idea, tonight chips.
 */
export function renderHero({
  unit,
  unitTitle,
  title,
  pageLabel,
  hook,
  routes = "",
  extras = "",
  topBar,
  sheet = "",
}) {
  const art = `<div class="fm-hero__art" aria-hidden="true">${unitScene(unit)}</div>`;
  const eyebrow = `<p class="fm-eyebrow hw-hero-kicker"><span class="fm-motif fm-motif--sm" aria-hidden="true"></span><span class="fm-eyebrow__text"><span class="lang-en">Unit ${esc(unit)}${unitTitle.en ? ` · ${esc(unitTitle.en)}` : ""}</span><span class="lang-es" lang="es">Unidad ${esc(unit)}${unitTitle.es ? ` · ${esc(unitTitle.es)}` : ""}</span></span></p>`;
  const h1 = `<h1 class="fm-hero__title hw-hero-lesson-title"><span class="lang-en">${esc(title.en)}</span><span class="lang-es" lang="es">${esc(title.es)}</span></h1>`;
  const meta = `<p class="fm-hero__meta hw-hero-lesson-meta"><span class="lang-en">${esc(pageLabel.en)}</span><span class="lang-es" lang="es">${esc(pageLabel.es)}</span></p>`;
  return `<header class="hw-hero fm-page" aria-label="Family Math Studio welcome" data-aria-en="Family Math Studio welcome" data-aria-es="Bienvenida a Estudio familiar de matemáticas">
    ${topBar}
    <section class="fm-hero" aria-labelledby="hw_hero_title">
      ${art}
      <div class="fm-hero__copy">${eyebrow}${h1.replace("<h1 ", '<h1 id="hw_hero_title" ')}${meta}${hook ? renderHookCard(hook) : ""}</div>
      ${routes}
    </section>
    <div class="fm-hero__more">${renderWeeklySheetCard()}${extras}</div>
    ${sheet}
  </header>`;
}

/** Hero behavior: the More sheet, reader options, text-size button, read-aloud, tooltip and save state. */
export const HERO_JS = `
(function () {
  var KEY = '${READER_KEY}';
  var root = document.documentElement;
  var TEXT = ['100', '115', '130', '150'];
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(next) { try { localStorage.setItem(KEY, JSON.stringify(next)); return true; } catch (e) { return false; } }
  function current() {
    var s = load();
    return {
      theme: s.theme === 'light' || s.theme === 'dark' || s.theme === 'contrast' ? s.theme : 'auto',
      text: TEXT.indexOf(s.text) > -1 ? s.text : '100',
      spacing: s.spacing === 'more' ? 'more' : 'default',
      reading: s.reading === 'dyslexia' ? 'dyslexia' : 'default'
    };
  }
  function attr(name, on, value) { if (on) root.setAttribute(name, value); else root.removeAttribute(name); }
  function apply(o) {
    attr('data-theme', o.theme !== 'auto', o.theme);
    attr('data-text-size', o.text !== '100', o.text);
    attr('data-spacing', o.spacing === 'more', 'more');
    attr('data-reading', o.reading === 'dyslexia', 'dyslexia');
    document.querySelectorAll('input[data-fm-pref]').forEach(function (i) { i.checked = o[i.getAttribute('data-fm-pref')] === i.value; });
    document.querySelectorAll('[data-fm-switch]').forEach(function (b) {
      var on = (b.getAttribute('data-fm-switch') === 'spacing' ? o.spacing === 'more' : o.reading === 'dyslexia');
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      var state = b.querySelector('.fm-switch__state');
      if (state) state.innerHTML = on ? '<span class="lang-en">On</span><span class="lang-es" lang="es">Sí</span>' : '<span class="lang-en">Off</span><span class="lang-es" lang="es">No</span>';
    });
    var cycle = document.querySelector('[data-fm-text-cycle]');
    if (cycle) cycle.setAttribute('title', o.text + '%');
  }
  function setState(ok) {
    document.querySelectorAll('[data-fm-save]').forEach(function (el) {
      el.setAttribute('data-state', ok ? 'saved' : 'offline');
      el.innerHTML = ok
        ? '<span class="lang-en">Saved on this device</span><span class="lang-es" lang="es">Guardado en este dispositivo</span>'
        : '<span class="lang-en">Not saved: this browser blocks storage</span><span class="lang-es" lang="es">Sin guardar: este navegador bloquea el almacenamiento</span>';
    });
  }
  function change(patch) { var o = current(); Object.keys(patch).forEach(function (k) { o[k] = patch[k]; }); setState(save(o)); apply(o); }
  document.addEventListener('click', function (e) {
    var open = e.target.closest('[data-open-sheet]');
    if (open) {
      var d = document.getElementById(open.getAttribute('data-open-sheet'));
      if (d && typeof d.showModal === 'function' && !d.open) d.showModal();
      return;
    }
    var dlg = e.target.closest('dialog.fm-sheet');
    if (dlg && (e.target === dlg || e.target.closest('[data-close]'))) { dlg.close(); return; }
    var cycle = e.target.closest('[data-fm-text-cycle]');
    if (cycle) { var o = current(); change({ text: TEXT[(TEXT.indexOf(o.text) + 1) % TEXT.length] }); return; }
    var sw = e.target.closest('[data-fm-switch]');
    if (sw) {
      var k = sw.getAttribute('data-fm-switch'); var cur = current();
      change(k === 'spacing' ? { spacing: cur.spacing === 'more' ? 'default' : 'more' } : { reading: cur.reading === 'dyslexia' ? 'default' : 'dyslexia' });
      return;
    }
    var read = e.target.closest('[data-fm-read]');
    if (read && typeof window.speakHomeworkText === 'function') { window.speakHomeworkText(read.getAttribute('data-en'), read.getAttribute('data-es')); return; }
    var tip = e.target.closest('[data-fm-tip]');
    if (tip) { var host = tip.closest('.fm-tooltip'); host.setAttribute('data-open', host.getAttribute('data-open') === 'true' ? 'false' : 'true'); return; }
    document.querySelectorAll('.fm-tooltip[data-open="true"]').forEach(function (t) { t.setAttribute('data-open', 'false'); });
  });
  document.addEventListener('change', function (e) {
    var i = e.target.closest && e.target.closest('input[data-fm-pref]');
    if (!i) return;
    var patch = {}; patch[i.getAttribute('data-fm-pref')] = i.value; change(patch);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.fm-tooltip[data-open="true"]').forEach(function (t) { t.setAttribute('data-open', 'false'); });
  });
  (function weeklySheet() {
    var card = document.querySelector('[data-ws-card]');
    if (!card) return;
    var BASE = '${WEEKLY_SHEET_BASE}';
    var start = '';
    function lang() { try { return localStorage.getItem('hw_lang_mode') === 'es' ? 'es' : 'en'; } catch (e) { return 'en'; } }
    function point(a) {
      var es = lang() === 'es';
      if (a.getAttribute('data-ws-link') === 'pdf' && start) {
        a.href = BASE + 'downloads/week-' + start + (es ? '-es' : '') + '.pdf';
        a.setAttribute('download', '');
      } else {
        a.href = BASE + '?lang=' + (es ? 'es' : 'en');
        a.removeAttribute('download');
      }
    }
    function pointAll() { card.querySelectorAll('[data-ws-link]').forEach(point); }
    card.addEventListener('click', function (e) { var a = e.target.closest('[data-ws-link]'); if (a) point(a); });
    pointAll();
    if (typeof fetch !== 'function') return;
    fetch(BASE + 'weeks.json').then(function (r) { return r.json(); }).then(function (data) {
      return import(BASE + 'week-pick.js').then(function (m) { start = m.weekFor(data.weeks, m.todayIso()).start; pointAll(); });
    }).catch(function () {});
  })();
  apply(current());
  var probe = false;
  try { localStorage.setItem(KEY + '-probe', '1'); localStorage.removeItem(KEY + '-probe'); probe = true; } catch (e) {}
  setState(probe);
})();
`;
