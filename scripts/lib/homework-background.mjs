/**
 * Background knowledge on the family homework page: a quiet button under "Explore more" opens a sheet with the one
 * or two essential skills tonight's lesson stands on (data/family-background/<lesson>.json, checked by
 * tools/lib/family-background.mjs). Each skill shows why it matters tonight, short steps, a worked example and one
 * quick check with feedback for every choice.
 *
 * The content for every lesson lives in ONE content-hashed bundle in assets/homework/, fetched the first time the
 * sheet opens, so a page's first view does not grow (data/family-performance-budget.json) and the deploy gains
 * one file, not seventy (Pages' 20,000-file limit).
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { checkBackground, baseLessonOf } from "../../tools/lib/family-background.mjs";

const DIR = new URL("../../data/family-background/", import.meta.url);
let cache = null;

/** Every background file, validated: { "6-10": {...} }. A bad file stops the generator. */
export function backgroundData() {
  if (cache) return cache;
  cache = {};
  if (!existsSync(DIR)) return cache;
  const errors = [];
  for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
    const id = file.replace(/\.json$/, "");
    const data = JSON.parse(readFileSync(new URL(file, DIR), "utf8"));
    errors.push(...checkBackground(data, id));
    cache[id] = { skills: data.skills };
  }
  if (errors.length) throw new Error(`family background content:\n  ${errors.join("\n  ")}`);
  return cache;
}

/** The shared bundle: { name, content }. */
export function backgroundBundle() {
  const json = JSON.stringify(backgroundData());
  const name = `homework-background-${createHash("sha256").update(json).digest("hex").slice(0, 10)}.bundle.js`;
  return { name, content: `window.__HW_BACKGROUND__ = ${json};\n` };
}

export const hasBackground = (pageId) => Boolean(backgroundData()[baseLessonOf(pageId)]);

const bi = (en, es) => `<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;

/** The runtime, with the content bundle's hashed path baked in. */
export const backgroundRuntime = () =>
  HOMEWORK_BACKGROUND_TEMPLATE.replace("__BG_BUNDLE__", `/assets/homework/${backgroundBundle().name}`).replace(
    "__BG_LESSONS__",
    JSON.stringify(Object.keys(backgroundData())),
  );

const HOMEWORK_BACKGROUND_TEMPLATE = String.raw`
/* Background knowledge sheet (scripts/lib/homework-background.mjs). */
(function () {
  var BUNDLE = '__BG_BUNDLE__';
  var LESSONS = __BG_LESSONS__;
  var LESSON = String(window.LESSON_ID || '').replace(/-part\d+$/, '');
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bi(t) { return '<span class="lang-en">' + esc(t.en) + '</span><span class="lang-es" lang="es">' + esc(t.es) + '</span>'; }
  function render(body, skills) {
    body.innerHTML = '';
    body.append(el('p', 'hw-explore-lead', bi({ en: "Tonight's lesson builds on these skills. Read one together, then try its quick check.", es: 'La lección de hoy se basa en estas destrezas. Lean una juntos y luego prueben la pregunta rápida.' })));
    skills.forEach(function (s, i) {
      var card = el('section', 'fm-card hw-bg-skill');
      var hid = 'hw_bg_skill_' + i;
      card.setAttribute('aria-labelledby', hid);
      var h = el('h3', 'hw-bg-name', '<span class="hw-bg-num" aria-hidden="true">' + (i + 1) + '</span>' + bi(s.name));
      h.id = hid;
      card.append(h, el('p', 'hw-bg-why', bi(s.why)));
      var ol = el('ol', 'hw-bg-steps');
      s.steps.forEach(function (st) { ol.append(el('li', '', bi(st))); });
      card.append(ol);
      card.append(el('p', 'hw-bg-example', '<strong>' + bi({ en: 'Example', es: 'Ejemplo' }) + '</strong> ' + bi(s.example)));
      if (s.model) {
        var fig = el('figure', 'hw-bg-figure');
        card.append(fig);
        drawModel(fig, s.model);
      }
      var c = s.check;
      var check = el('div', 'hw-bg-check');
      check.append(el('p', 'hw-bg-q', '<strong>' + bi({ en: 'Quick check', es: 'Pregunta rápida' }) + '</strong> ' + bi(c.q)));
      var row = el('div', 'hw-bg-options');
      row.setAttribute('role', 'group');
      row.setAttribute('aria-labelledby', hid);
      var fb = el('p', 'hw-bg-feedback');
      fb.setAttribute('role', 'status');
      fb.setAttribute('aria-live', 'polite');
      c.options.forEach(function (opt, j) {
        var b = el('button', 'fm-btn hw-bg-option');
        b.type = 'button';
        b.textContent = opt;
        b.addEventListener('click', function () {
          row.querySelectorAll('.hw-bg-option').forEach(function (o) { o.removeAttribute('data-picked'); o.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('data-picked', j === c.correctIdx ? 'right' : 'wrong');
          b.setAttribute('aria-pressed', 'true');
          fb.setAttribute('data-result', j === c.correctIdx ? 'right' : 'wrong');
          fb.innerHTML = bi(c.feedback[j]);
        });
        row.append(b);
      });
      check.append(row, fb);
      card.append(check);
      body.append(card);
    });
    if (typeof window.__hwTypesetFractions === 'function') window.__hwTypesetFractions(body);
  }
  // Pictures are drawn on the device by the family model library (the same one the Learn stop uses), loaded
  // the first time a skill with a model is shown.
  var modelsLib = null;
  function drawModel(fig, model) {
    modelsLib = modelsLib || import('/assets/design/family/art/math-models.mjs');
    modelsLib.then(function (m) {
      fig.innerHTML = '<span class="lang-en">' + m.renderModel(model, { lang: 'en' }) + '</span><span class="lang-es" lang="es">' + m.renderModel(model, { lang: 'es' }) + '</span>';
      if (typeof window.__hwTypesetFractions === 'function') window.__hwTypesetFractions(fig);
    }).catch(function () { fig.remove(); });
  }
  function load(body) {
    if (body.getAttribute('data-bg-ready')) return;
    body.setAttribute('data-bg-ready', '1');
    var id = body.getAttribute('data-bg-lesson');
    var done = function () {
      var data = window.__HW_BACKGROUND__ && window.__HW_BACKGROUND__[id];
      if (data) render(body, data.skills);
      else body.innerHTML = '<p>' + bi({ en: 'This could not load. Check the connection and try again.', es: 'No se pudo cargar. Revisa la conexión e inténtalo otra vez.' }) + '</p>';
      if (!data) body.removeAttribute('data-bg-ready');
    };
    if (window.__HW_BACKGROUND__) return done();
    var s = document.createElement('script');
    s.src = body.getAttribute('data-bg-src');
    s.onload = done;
    s.onerror = done;
    document.head.append(s);
  }
  // Styles ride with this script (not the render-blocking sheets): tokens only, in the design system's layer.
  var CSS = '@layer patterns{' +
    '.hw-bg-body{display:grid;gap:var(--fm-space-4)}' +
    '.hw-bg-skill{display:grid;gap:var(--fm-space-3);padding:var(--fm-space-4);border:1px solid var(--fm-border);border-radius:var(--fm-radius-md);background:var(--fm-raised)}' +
    '.hw-bg-name{display:flex;align-items:center;gap:var(--fm-space-2);margin:0;font-size:var(--fm-fs-lg);color:var(--fm-text)}' +
    '.hw-bg-num{display:inline-grid;place-items:center;flex:none;inline-size:2rem;block-size:2rem;border-radius:50%;background:var(--fm-primary);color:var(--fm-on-primary);font-size:var(--fm-fs-md)}' +
    '.hw-bg-why,.hw-bg-example,.hw-bg-q,.hw-bg-feedback{margin:0}' +
    '.hw-bg-why{color:var(--fm-text-muted)}' +
    '.hw-bg-figure{margin:0;display:grid;justify-items:center}.hw-bg-figure svg{max-inline-size:100%;block-size:auto}' +
    '.hw-bg-steps{margin:0;padding-inline-start:1.4em;list-style:decimal;display:grid;gap:var(--fm-space-1)}' +
    '.hw-bg-example{padding:var(--fm-space-3);border-radius:var(--fm-radius-sm);background:var(--fm-info-tint);color:var(--fm-text)}' +
    '.hw-bg-check{display:grid;gap:var(--fm-space-2);padding-block-start:var(--fm-space-2);border-block-start:1px solid var(--fm-border)}' +
    '.hw-bg-options{display:flex;flex-wrap:wrap;gap:var(--fm-space-2)}' +
    '.hw-bg-options>.hw-bg-option{flex:1 1 0;min-inline-size:4.5rem}' +
    '.hw-bg-option[data-picked=right]{background:var(--fm-success-tint);border-color:var(--fm-success-ink);color:var(--fm-success-ink)}' +
    '.hw-bg-option[data-picked=wrong]{background:var(--fm-error-tint);border-color:var(--fm-error-ink);color:var(--fm-error-ink)}' +
    '.hw-bg-feedback[data-result=right]{color:var(--fm-success-ink)}.hw-bg-feedback[data-result=wrong]{color:var(--fm-error-ink)}' +
    '}';
  function addStyle() {
    if (document.getElementById('hw-bg-style')) return;
    var st = document.createElement('style');
    st.id = 'hw-bg-style';
    st.textContent = CSS;
    document.head.append(st);
  }
  // The button sits under "Explore more" in the hero. It is added here, not in the page, because the heaviest
  // page's first view is exactly at its budget (data/family-performance-budget.json); it lands below Start.
  function addButton() {
    if (LESSONS.indexOf(LESSON) < 0 || document.getElementById('hw_background_button')) return;
    var anchor = document.getElementById('hw_explore_more_button');
    if (!anchor) return;
    var b = el('button', 'fm-btn fm-btn--block', bi({ en: 'Background knowledge', es: 'Conocimientos previos' }));
    b.type = 'button';
    b.id = 'hw_background_button';
    b.setAttribute('data-open-sheet', 'hw_background_sheet');
    b.setAttribute('aria-haspopup', 'dialog');
    anchor.after(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
  else addButton();
  // Built on the first tap, in the capture phase, so it exists before the page's sheet opener looks for it.
  function sheet(btn) {
    var d = document.getElementById('hw_background_sheet');
    if (d) return d;
    d = el('dialog', 'fm-sheet hw-background-sheet');
    d.id = 'hw_background_sheet';
    d.setAttribute('aria-labelledby', 'hw_background_title');
    d.append(el('span', 'fm-sheet__grab'));
    d.firstChild.setAttribute('aria-hidden', 'true');
    var head = el('div', 'fm-sheet__head');
    var h = el('h2', 'fm-card__title', bi({ en: 'Background knowledge', es: 'Conocimientos previos' }));
    h.id = 'hw_background_title';
    var close = document.querySelector('#hw_explore_sheet [data-close]');
    close = close ? close.cloneNode(true) : el('button', 'fm-btn fm-btn--icon', '×');
    close.type = 'button';
    close.setAttribute('data-close', '');
    if (!close.getAttribute('aria-label')) close.setAttribute('aria-label', 'Close');
    head.append(h, close);
    var bodyWrap = el('div', 'fm-sheet__body');
    var body = el('div', 'hw-bg-body');
    body.setAttribute('data-bg-body', '');
    body.setAttribute('data-bg-lesson', LESSON);
    body.setAttribute('data-bg-src', BUNDLE);
    bodyWrap.append(body);
    d.append(head, bodyWrap);
    document.body.append(d);
    return d;
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-open-sheet="hw_background_sheet"]');
    if (!btn) return;
    addStyle();
    var d = sheet(btn);
    load(d.querySelector('[data-bg-body]'));
  }, true);
})();
`;
