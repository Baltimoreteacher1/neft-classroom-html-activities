// living-scene.js — a concept that UNFOLDS, scene by scene, while the objects
// on the stage keep their identity.
//
// The interactive-visual REGISTRY mounts one tool per host; this module is the
// layer above it for the moments a single tool cannot carry: a situation that
// becomes a picture, a picture the student predicts about, a model the student
// rebuilds, and the symbols that model turns into. A "play" (engine/components/
// living/<name>.js) supplies the scenes; this kernel supplies everything every
// play needs and none should re-implement:
//
//   • one persistent SVG stage — scenes MOVE the same elements instead of
//     clearing the canvas, so a sticker in scene 1 is the same sticker in the
//     area model of scene 4 (object continuity is the explanation);
//   • attribute tweening with a reduced-motion snap — no student has to watch
//     an animation to get the information, and the final state is always drawn;
//   • a polite live region that speaks every narration line, so the film is
//     fully readable with a screen reader and with motion off;
//   • gates — a scene may hold Next until the student has predicted, chosen or
//     manipulated; a wrong pick gets a focused cue and a retry, never the answer
//     on the first miss;
//   • per-scene save/resume in localStorage (wrapped: blocked storage just
//     means the film starts at the beginning);
//   • English and Spanish via the site's saved preference.
//
// It holds no lesson numbers. Every quantity on the stage comes from the play's
// own config, and plays validate that config up front and refuse to draw
// rather than draw something mathematically wrong.

import { getPreferredLang } from "./i18n.js";

const SVGNS = "http://www.w3.org/2000/svg";
const STYLE_ID = "living-scene-styles";
const STORE_PREFIX = "nt-living:v1:";

const CSS = `
.lsx{--lsx-paper:var(--fm-surface,#fbf8f1);--lsx-card:var(--fm-raised,#ffffff);--lsx-ink:var(--fm-text,#12355b);--lsx-muted:var(--fm-text-muted,#4c5d70);--lsx-rule:var(--fm-border,#d9d2c3);--lsx-rule-strong:var(--fm-border-strong,#8796a5);
  --lsx-x:var(--fm-m-part,#1fa6a2);--lsx-x-edge:var(--fm-primary,#0b6e6b);--lsx-on-x:var(--fm-raised,#ffffff);--lsx-u:var(--fm-m-unknown-edge,#e9a23b);--lsx-u-edge:var(--fm-m-unknown,#8a5a00);
  --lsx-hi:var(--fm-accent-ink,#0b6e6b);--lsx-lo:var(--fm-m-unknown,#8a5a00);--lsx-ok-bg:var(--fm-success-tint,#eef7f6);--lsx-ok-edge:var(--fm-success-ink,#0b6e6b);--lsx-cue-bg:var(--fm-warn-tint,#fbf3e4);--lsx-miss:var(--fm-error-ink,#b4413c);
  --lsx-primary:var(--fm-primary,#12355b);--lsx-on-primary:var(--fm-on-primary,#ffffff);--lsx-focus:var(--fm-focus,#c27c0e);--lsx-r:var(--fm-radius-md,12px);--lsx-r-sm:var(--fm-radius-sm,8px);
  --lsx-fs-sm:var(--fm-fs-sm,.875rem);--lsx-fs-md:var(--fm-fs-md,1rem);--lsx-fs-lg:var(--fm-fs-lg,1.15rem);--lsx-fs-xl:var(--fm-fs-xl,1.4rem);--lsx-body:var(--fm-font-text,var(--font-body,"Hanken Grotesk",system-ui,sans-serif));--lsx-display:var(--fm-font-display,var(--font-display,"Outfit",system-ui,sans-serif));
  background:var(--lsx-paper);color:var(--lsx-ink);border:1px solid var(--lsx-rule);border-radius:var(--lsx-r);padding:clamp(12px,2.4vw,22px);display:grid;gap:12px;font-family:var(--lsx-body);font-size:var(--lsx-fs-md);max-width:100%;overflow:hidden;container-type:inline-size}
.lsx-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 14px}
.lsx-kicker{margin:0;font-weight:700;font-size:var(--lsx-fs-sm);line-height:1.2;letter-spacing:.06em;text-transform:uppercase;color:var(--lsx-hi)}
.lsx-title{margin:2px 0 0;font-family:var(--lsx-display);font-weight:800;font-size:var(--lsx-fs-xl);line-height:1.2;color:var(--lsx-ink)}
.lsx-steps{display:flex;gap:6px;list-style:none;margin:0;padding:0;flex-wrap:wrap}
.lsx-steps li{display:flex}
.lsx-dot{min-width:44px;min-height:44px;border-radius:999px;border:2px solid var(--lsx-rule);background:var(--lsx-card);color:var(--lsx-muted);font-family:var(--lsx-body);font-weight:700;font-size:var(--lsx-fs-sm);padding:0 10px;cursor:pointer}
.lsx-dot[aria-current="step"]{border-color:var(--lsx-ink);color:var(--lsx-ink)}
.lsx-dot.done{border-color:var(--lsx-ok-edge);color:var(--lsx-ok-edge)}
.lsx-dot:disabled{cursor:not-allowed;opacity:.55}
.lsx-stage{width:100%;max-width:640px;margin:0 auto;height:auto;display:block;background:var(--lsx-card);border:1px solid var(--lsx-rule);border-radius:var(--lsx-r-sm);touch-action:manipulation}
.lsx-stage text{font-family:var(--lsx-body)}
.lsx-expr{font-family:var(--lsx-display);font-weight:700;font-size:var(--lsx-fs-xl);line-height:1.3;text-align:center;margin:0;min-height:1.4em}
.lsx-expr .lsx-hi{color:var(--lsx-hi);text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:4px}
.lsx-expr .lsx-lo{color:var(--lsx-lo);text-decoration:underline dotted;text-decoration-thickness:3px;text-underline-offset:4px}
.lsx-say{margin:0;font-size:var(--lsx-fs-md);line-height:1.55;max-width:68ch}
.lsx-panel{display:grid;gap:10px}
.lsx-q{margin:0;font-weight:700;font-size:var(--lsx-fs-md)}
.lsx-choices{display:flex;flex-wrap:wrap;gap:8px}
.lsx-btn{min-height:44px;padding:8px 16px;border-radius:var(--lsx-r-sm);border:2px solid var(--lsx-ink);background:var(--lsx-card);color:var(--lsx-ink);font-family:var(--lsx-body);font-weight:700;font-size:var(--lsx-fs-md);line-height:1.2;cursor:pointer}
.lsx-btn:hover{background:var(--lsx-paper)}
.lsx-btn.primary{background:var(--lsx-primary);border-color:var(--lsx-primary);color:var(--lsx-on-primary)}
.lsx-btn[aria-pressed="true"]{background:var(--lsx-ok-edge);border-color:var(--lsx-ok-edge);color:var(--lsx-on-primary)}
.lsx-btn.miss{border-color:var(--lsx-miss);color:var(--lsx-miss);border-style:dashed}
.lsx-btn:disabled{opacity:.5;cursor:not-allowed}
.lsx :focus-visible{outline:3px solid var(--lsx-focus);outline-offset:2px}
.lsx-fb{margin:0;padding:10px 12px;border-radius:var(--lsx-r-sm);border-left:5px solid var(--lsx-ok-edge);background:var(--lsx-ok-bg);color:var(--lsx-ink);line-height:1.5}
.lsx-fb.cue{border-left-color:var(--lsx-lo);background:var(--lsx-cue-bg)}
.lsx-fb:empty{display:none}
.lsx-fb b{font-weight:800}
.lsx-range{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.lsx-range label{font-weight:700}
.lsx-range input[type=range]{flex:1 1 220px;min-height:44px;accent-color:var(--lsx-hi)}
.lsx-range output{font-family:var(--lsx-display);font-weight:800;font-size:var(--lsx-fs-lg);min-width:3ch}
.lsx-frame{margin:0;padding:10px 12px;border:1px dashed var(--lsx-rule-strong);border-radius:var(--lsx-r-sm);background:var(--lsx-card)}
.lsx-frame label{display:block;font-weight:700;margin-bottom:6px}
.lsx-frame textarea{width:100%;min-height:72px;font-family:var(--lsx-body);font-size:var(--lsx-fs-md);line-height:1.45;padding:8px;border:1px solid var(--lsx-rule-strong);border-radius:var(--lsx-r-sm);box-sizing:border-box;background:var(--lsx-card);color:var(--lsx-ink)}
.lsx-nav{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;border-top:1px solid var(--lsx-rule);padding-top:10px}
.lsx-ask{margin:0;padding:10px 12px;border-radius:var(--lsx-r-sm);border-left:4px solid var(--lsx-hi);background:var(--lsx-cue-bg);color:var(--lsx-ink);font-size:var(--lsx-fs-sm);line-height:1.5}
.lsx-ask:empty{display:none}
.lsx-ask strong{font-weight:800;color:var(--lsx-hi)}
.lsx-count{display:none;margin:0;font-weight:700;font-size:var(--lsx-fs-sm);color:var(--lsx-muted)}
@container (max-width: 520px){.lsx-steps{display:none}.lsx-count{display:block}}
.lsx.is-narrow .lsx-stage{min-height:240px}
.lsx.is-narrow .lsx-stage text{font-size:1.18em}
.lsx-print{display:none}
@media print{.lsx-nav,.lsx-steps,.lsx-panel,.lsx-stage{display:none}.lsx-print{display:block}}
`;

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * The reader's language. Family homework pages switch language with
 * `lang-mode-*` classes on <body> (engine/components/lab-strings-es.js);
 * Practice studios and lesson pages stamp `<html lang>`; otherwise the saved
 * preference.
 */
export function sceneLang() {
  if (typeof document !== "undefined") {
    const cls = document.body?.classList;
    if (cls?.contains("lang-mode-es") || cls?.contains("show-es")) return "es";
    if (cls?.contains("lang-mode-en") || cls?.contains("lang-mode-bilingual")) return "en";
    // Practice studios and lesson pages stamp <html lang> from their own toggle
    // or the saved preference.
    const htmlLang = document.documentElement?.lang || "";
    if (htmlLang) return htmlLang.startsWith("es") ? "es" : "en";
  }
  return getPreferredLang();
}

/** Pick the reader's language from an `{en, es}` pair (or a plain string). */
export function L(pair, lang = sceneLang()) {
  if (pair == null) return "";
  if (typeof pair === "string") return pair;
  return lang === "es" && String(pair.es || "").trim() ? pair.es : String(pair.en ?? "");
}

export function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Create an SVG element with attributes. */
export function svgEl(tag, attrs = {}, parent = null) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "text") el.textContent = String(v);
    else el.setAttribute(k, String(v));
  }
  if (parent) parent.appendChild(el);
  return el;
}

const NUMERIC_ATTRS = new Set([
  "x",
  "y",
  "width",
  "height",
  "cx",
  "cy",
  "r",
  "rx",
  "opacity",
  "x1",
  "y1",
  "x2",
  "y2",
  "stroke-width",
  "fill-opacity",
]);

/**
 * Tween numeric SVG attributes of many elements at once. `moves` is an array of
 * `[element, {attr: target}]`. Resolves when finished. With reduced motion (or
 * `ms <= 0`) the targets are applied immediately — the end state is the
 * information, the motion is only the explanation of how it got there.
 * Non-numeric attributes (fill, text) are set at the end.
 */
export function tween(moves, ms = 600, { signal } = {}) {
  const list = moves.filter(([el]) => el);
  const finish = () => {
    for (const [el, attrs] of list) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "text") el.textContent = String(v);
        else el.setAttribute(k, String(v));
      }
    }
  };
  if (ms <= 0 || prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
    finish();
    return Promise.resolve();
  }
  const tracks = [];
  for (const [el, attrs] of list) {
    for (const [k, v] of Object.entries(attrs)) {
      if (!NUMERIC_ATTRS.has(k)) continue;
      const from = Number.parseFloat(el.getAttribute(k));
      const to = Number(v);
      if (Number.isFinite(from) && Number.isFinite(to) && from !== to)
        tracks.push({ el, k, from, to });
    }
  }
  return new Promise((resolve) => {
    const t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const step = (now) => {
      if (signal?.aborted || !list[0]?.[0]?.isConnected) {
        finish();
        resolve();
        return;
      }
      const t = Math.min(1, Math.max(0, (now - t0) / ms));
      const e = ease(t);
      for (const tr of tracks) tr.el.setAttribute(tr.k, String(tr.from + (tr.to - tr.from) * e));
      if (t < 1) requestAnimationFrame(step);
      else {
        finish();
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

function readStore(key) {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage blocked: the film simply restarts next visit */
  }
}

/** Deterministic 32-bit hash for seeded transfer variants (no Math.random). */
export function seededStep(seedStr, step, count) {
  if (!count || count <= 1) return 0;
  let h = 2166136261;
  const s = `${seedStr}:${step}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % count;
}

/**
 * Compute a taller viewBox crop for narrow containers (<520px) when a play does
 * not supply an explicit `narrowViewBox`. Keeps the stage centred with extra
 * vertical breathing room so enlarged labels never clip.
 */
function narrowViewBoxFor(play) {
  if (play.narrowViewBox) return play.narrowViewBox;
  const parts = String(play.viewBox || "0 0 640 360")
    .trim()
    .split(/\s+/)
    .map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return play.viewBox;
  const [x, y, w, h] = parts;
  const extra = Math.round(h * 0.16);
  return `${x} ${y - Math.round(extra / 2)} ${w} ${h + extra}`;
}

/**
 * Mount a play.
 *
 *   mountLivingScene(host, play, { storeKey, openAt, surface }) -> { destroy, go, openAt }
 *
 * play = {
 *   kicker, title: {en,es},
 *   viewBox: "0 0 W H", narrowViewBox?: "0 0 W H2", ariaLabel: {en,es},
 *   setup(ctx)             — draw the persistent cast once
 *   printSummary: {en,es}  — static text for print / no-motion readers
 *   askChild?: Record<string, {en,es}> — optional per-scene family prompts
 *   scenes: [{ id, label:{en,es}, askChild?:{en,es}, enter(ctx, saved) -> void|Promise, gate?: true }]
 * }
 *
 * ctx (handed to setup and every scene):
 *   svg, lang, L(pair), narrow, onNarrow(fn), say(pair), expr(html), panel (HTMLElement,
 *   cleared per scene), feedback(pair|html, kind), unlock(), state (per-scene saved object),
 *   save(), tween, svgEl, choices(opts), range(opts), frame(opts), button(opts),
 *   newNumbersButton(opts)
 */
export function mountLivingScene(host, play, { storeKey = "", openAt = null, surface = "" } = {}) {
  ensureStyles();
  const lang = sceneLang();
  const tr = (p) => L(p, lang);
  const saved = (storeKey && readStore(storeKey)) || { scene: 0, done: [], scenes: {} };
  if (!Array.isArray(saved.done)) saved.done = [];
  if (!saved.scenes || typeof saved.scenes !== "object") saved.scenes = {};

  const root = document.createElement("section");
  root.className = "lsx";
  root.setAttribute(
    "aria-roledescription",
    lang === "es" ? "escena interactiva" : "interactive scene",
  );
  root.innerHTML = `
    <div class="lsx-head">
      <div>
        <p class="lsx-kicker">${escHtml(tr(play.kicker))}</p>
        <h3 class="lsx-title">${escHtml(tr(play.title))}</h3>
      </div>
      <p class="lsx-count" aria-hidden="true"></p>
      <ol class="lsx-steps" aria-label="${lang === "es" ? "Escenas" : "Scenes"}"></ol>
    </div>
    <svg class="lsx-stage" viewBox="${escHtml(play.viewBox)}" role="img" aria-label="${escHtml(tr(play.ariaLabel))}"></svg>
    <p class="lsx-expr" aria-live="polite"></p>
    <p class="lsx-say" aria-live="polite"></p>
    <p class="lsx-ask" aria-live="polite"></p>
    <div class="lsx-panel"></div>
    <p class="lsx-fb" role="status"></p>
    <div class="lsx-nav">
      <button type="button" class="lsx-btn" data-lsx="back">${lang === "es" ? "← Atrás" : "← Back"}</button>
      <button type="button" class="lsx-btn primary" data-lsx="next">${lang === "es" ? "Siguiente →" : "Next →"}</button>
    </div>
    <div class="lsx-print">${escHtml(tr(play.printSummary))}</div>`;
  host.appendChild(root);

  const svg = /** @type {SVGSVGElement} */ (root.querySelector(".lsx-stage"));
  const exprEl = /** @type {HTMLElement} */ (root.querySelector(".lsx-expr"));
  const sayEl = /** @type {HTMLElement} */ (root.querySelector(".lsx-say"));
  const askEl = /** @type {HTMLElement} */ (root.querySelector(".lsx-ask"));
  const panel = /** @type {HTMLElement} */ (root.querySelector(".lsx-panel"));
  const fbEl = /** @type {HTMLElement} */ (root.querySelector(".lsx-fb"));
  const steps = /** @type {HTMLElement} */ (root.querySelector(".lsx-steps"));
  const countEl = /** @type {HTMLElement} */ (root.querySelector(".lsx-count"));
  const backBtn = /** @type {HTMLButtonElement} */ (root.querySelector('[data-lsx="back"]'));
  const nextBtn = /** @type {HTMLButtonElement} */ (root.querySelector('[data-lsx="next"]'));

  let current = -1;
  let unlocked = true;
  let abort = new AbortController();
  const persist = () => storeKey && writeStore(storeKey, saved);
  const narrowVB = narrowViewBoxFor(play);
  const measureNarrow = () => {
    const w =
      root.clientWidth ||
      host.clientWidth ||
      (typeof window !== "undefined" ? window.innerWidth : 800);
    return w > 0 && w < 520;
  };
  let isNarrow = measureNarrow();
  const narrowListeners = new Set();
  const syncNarrow = () => {
    const next = measureNarrow();
    root.classList.toggle("is-narrow", next);
    svg.setAttribute("viewBox", next ? narrowVB : play.viewBox);
    if (next !== isNarrow) {
      isNarrow = next;
      for (const fn of narrowListeners) {
        try {
          fn(isNarrow);
        } catch {}
      }
    }
  };
  syncNarrow();
  let ro = null;
  if (typeof ResizeObserver === "function") {
    ro = new ResizeObserver(syncNarrow);
    ro.observe(root);
  }
  const onWinResize = () => syncNarrow();
  if (typeof window !== "undefined") window.addEventListener("resize", onWinResize);

  const ctx = {
    svg,
    lang,
    L: tr,
    surface,
    get narrow() {
      return isNarrow;
    },
    onNarrow(fn) {
      if (typeof fn === "function") narrowListeners.add(fn);
      return () => narrowListeners.delete(fn);
    },
    tween: (moves, ms) => tween(moves, ms, { signal: abort.signal }),
    svgEl,
    panel,
    say: (pair) => {
      sayEl.textContent = tr(pair);
    },
    expr: (html) => {
      exprEl.innerHTML = html;
    },
    feedback: (content, kind = "") => {
      fbEl.className = `lsx-fb${kind ? ` ${kind}` : ""}`;
      fbEl.innerHTML = typeof content === "string" ? content : escHtml(tr(content));
    },
    unlock: () => {
      unlocked = true;
      const id = play.scenes[current]?.id;
      if (id && !saved.done.includes(id)) saved.done.push(id);
      persist();
      paintNav();
    },
    get state() {
      const id = play.scenes[current]?.id;
      if (!id) return {};
      saved.scenes[id] = saved.scenes[id] || {};
      return saved.scenes[id];
    },
    save: persist,
    button({ label, primary = false, onClick }) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `lsx-btn${primary ? " primary" : ""}`;
      b.textContent = tr(label);
      b.addEventListener("click", onClick);
      return b;
    },
    /** Seeded "New numbers" control for transfer scenes. */
    newNumbersButton({ onNext, label } = {}) {
      return ctx.button({
        label: label || { en: "New numbers", es: "Números nuevos" },
        onClick: () => {
          const st = ctx.state;
          st.variant = (Number(st.variant) || 0) + 1;
          st.solved = false;
          persist();
          onNext?.(st.variant);
        },
      });
    },
    /**
     * A prediction / choice gate. options: [{label, correct, cue:{en,es}}].
     * A wrong pick shows ITS cue (a question or a pointer at the picture, never
     * the answer) and stays selectable for a retry. onCorrect runs once.
     */
    choices({ question, options, onCorrect, onMiss, restore }) {
      const wrap = document.createElement("div");
      wrap.className = "lsx-panel";
      const q = document.createElement("p");
      q.className = "lsx-q";
      q.id = `lsx-q-${Math.random().toString(36).slice(2, 8)}`;
      q.textContent = tr(question);
      const row = document.createElement("div");
      row.className = "lsx-choices";
      row.setAttribute("role", "group");
      row.setAttribute("aria-labelledby", q.id);
      let solved = false;
      options.forEach((opt, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "lsx-btn";
        b.setAttribute("aria-pressed", "false");
        b.innerHTML = opt.html || escHtml(tr(opt.label));
        b.addEventListener("click", () => {
          if (solved) return;
          if (opt.correct) {
            solved = true;
            row.querySelectorAll("button").forEach((x) => {
              x.disabled = x !== b;
            });
            b.setAttribute("aria-pressed", "true");
            onCorrect?.(i);
          } else {
            b.classList.add("miss");
            b.setAttribute("aria-pressed", "false");
            onMiss?.(i, opt);
          }
        });
        row.appendChild(b);
      });
      wrap.append(q, row);
      if (restore != null && options[restore]?.correct) {
        const b = row.children[restore];
        solved = true;
        row.querySelectorAll("button").forEach((x) => {
          x.disabled = x !== b;
        });
        b?.setAttribute("aria-pressed", "true");
      }
      return wrap;
    },
    range({ label, min, max, value, onInput }) {
      const wrap = document.createElement("div");
      wrap.className = "lsx-range";
      const id = `lsx-r-${Math.random().toString(36).slice(2, 8)}`;
      wrap.innerHTML = `<label for="${id}">${escHtml(tr(label))}</label><input id="${id}" type="range" min="${min}" max="${max}" step="1" value="${value}"><output for="${id}">${value}</output>`;
      const input = /** @type {HTMLInputElement} */ (wrap.querySelector("input"));
      const out = /** @type {HTMLOutputElement} */ (wrap.querySelector("output"));
      input.addEventListener("input", () => {
        out.textContent = input.value;
        onInput(Number(input.value));
      });
      return wrap;
    },
    /** An ungraded explain box with a sentence frame; text is saved with the scene. */
    frame({ label, frame, key = "explain" }) {
      const wrap = document.createElement("div");
      wrap.className = "lsx-frame";
      const id = `lsx-f-${Math.random().toString(36).slice(2, 8)}`;
      const st = ctx.state;
      wrap.innerHTML = `<label for="${id}">${escHtml(tr(label))}</label><textarea id="${id}" placeholder="${escHtml(tr(frame))}"></textarea>`;
      const ta = /** @type {HTMLTextAreaElement} */ (wrap.querySelector("textarea"));
      ta.value = typeof st[key] === "string" ? st[key] : "";
      ta.addEventListener("input", () => {
        st[key] = ta.value.slice(0, 1000);
        persist();
      });
      return wrap;
    },
  };

  function paintSteps() {
    steps.innerHTML = "";
    play.scenes.forEach((sc, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = `lsx-dot${saved.done.includes(sc.id) ? " done" : ""}`;
      b.textContent = String(i + 1);
      b.setAttribute("aria-label", `${i + 1}. ${tr(sc.label)}`);
      if (i === current) b.setAttribute("aria-current", "step");
      // A scene is reachable when every scene before it has been passed — the
      // dots let a returning student jump, never skip a prediction.
      const reachable =
        i <= current || play.scenes.slice(0, i).every((s) => saved.done.includes(s.id));
      b.disabled = !reachable;
      b.addEventListener("click", () => go(i));
      li.appendChild(b);
      steps.appendChild(li);
    });
  }

  function paintNav() {
    backBtn.disabled = current <= 0;
    const last = current >= play.scenes.length - 1;
    nextBtn.disabled = !unlocked || last;
    nextBtn.hidden = last;
    countEl.textContent =
      lang === "es"
        ? `Escena ${current + 1} de ${play.scenes.length}: ${tr(play.scenes[current]?.label)}`
        : `Scene ${current + 1} of ${play.scenes.length}: ${tr(play.scenes[current]?.label)}`;
    paintSteps();
  }

  async function go(i) {
    if (i < 0 || i >= play.scenes.length) return;
    abort.abort();
    abort = new AbortController();
    current = i;
    saved.scene = i;
    persist();
    const sc = play.scenes[i];
    panel.innerHTML = "";
    ctx.feedback("");
    const askPair = surface === "family" ? sc.askChild || play.askChild?.[sc.id] || null : null;
    if (askPair) {
      const prefix = lang === "es" ? "Pregúntale a tu hijo/a: " : "Ask your child: ";
      askEl.innerHTML = `<strong>${escHtml(prefix)}</strong>${escHtml(tr(askPair))}`;
    } else {
      askEl.innerHTML = "";
    }
    unlocked = !sc.gate || saved.done.includes(sc.id);
    paintNav();
    if (!sc.gate && !saved.done.includes(sc.id)) {
      saved.done.push(sc.id);
      persist();
    }
    await sc.enter(ctx, saved.scenes[sc.id] || {});
    paintNav();
  }

  function resolveSceneIndex(target) {
    if (typeof target === "number" && Number.isInteger(target)) {
      return target >= 0 && target < play.scenes.length ? target : -1;
    }
    if (typeof target === "string" && target.trim()) {
      return play.scenes.findIndex((s) => s.id === target.trim());
    }
    return -1;
  }

  async function jumpTo(target) {
    const idx = resolveSceneIndex(target);
    if (idx < 0) return false;
    abort.abort();
    abort = new AbortController();
    for (let i = 0; i < idx; i++) {
      current = i;
      const scId = play.scenes[i].id;
      if (scId && !saved.done.includes(scId)) saved.done.push(scId);
      await play.scenes[i].enter(
        { ...ctx, tween: (m) => tween(m, 0), restoring: true },
        saved.scenes[scId] || {},
      );
    }
    await go(idx);
    return true;
  }

  backBtn.addEventListener("click", () => go(current - 1));
  nextBtn.addEventListener("click", () => {
    go(current + 1);
    root.querySelector(".lsx-title")?.scrollIntoView?.({ block: "nearest" });
  });

  play.setup(ctx);
  const requested = openAt != null ? resolveSceneIndex(openAt) : -1;
  const start =
    requested >= 0
      ? requested
      : Math.min(Math.max(0, Number(saved.scene) || 0), play.scenes.length - 1);
  // Resuming (or opening at a specific scene) replays every earlier scene's end
  // state instantly so the stage is in the exact state the target scene expects.
  (async () => {
    for (let i = 0; i < start; i++) {
      current = i;
      await play.scenes[i].enter(
        { ...ctx, tween: (m) => tween(m, 0), restoring: true },
        saved.scenes[play.scenes[i].id] || {},
      );
    }
    go(start);
  })();

  return {
    go,
    openAt: jumpTo,
    destroy() {
      abort.abort();
      ro?.disconnect?.();
      if (typeof window !== "undefined") window.removeEventListener("resize", onWinResize);
      narrowListeners.clear();
      root.remove();
    },
  };
}
