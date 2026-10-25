/**
 * Practice Studio language layer, part 2: the Language control and the display modes (window.StudioLanguage).
 *
 *   Language        one control in the header Menu. Presets Plain / Support / Full and three ways to see Español:
 *                     English with tap-for-Español, Español primero, English only (plus the old stacked view, "English and Español").
 *                   The student's own choice, kept on this device in the comfort record (ewl_comfort_v1.language), never tied to a
 *                   pathway or a label. The old Español button still works: it moves between English only and the stacked view.
 *   Quiet mode      the story shrinks to the lesson's one-line purpose, feedback uses a neutral voice, and the five sections
 *                   carry the same plain names in every lesson. The world's art and palette stay.
 *   What is this asking?   one sentence per line, numbers tinted, the question line marked, and a card
 *                   "I need to find ___. I know ___." the student fills in. On by default for stems over 40 words, a button on every problem.
 *
 * The frame ladder, tiles and partner talk are in language-write.js; word chips, cognates, pictures and the evidence card in
 * language-words.js. The pure logic is language-core.js. Nothing here knows any mathematics or is timed, graded or recorded
 * as a label; every Spanish line has its English twin. Contract: docs/audits/studio-v4/brief-x-language.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  if (W.StudioLanguage) return;
  const Core = W.StudioLangCore;
  if (!Core) return;
  const RT = (W.StudioRT = W.StudioRT || {});

  const COMFORT_KEY = "ewl_comfort_v1";
  const LANG_KEY = "ewl_lang_v1";
  const esc = (/** @type {any} */ s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c,
    );
  const U = () =>
    RT.util || {
      esc,
      es: (/** @type {any} */ t) => (t ? `<span class="es-text" lang="es">${esc(t)}</span>` : ""),
      tx: esc,
      txEs: (/** @type {any} */ t) => (t ? `<span class="es-text" lang="es">${esc(t)}</span>` : ""),
    };
  /** An English label with its Spanish twin; the page language decides which one shows. */
  const bi = (/** @type {string} */ en, /** @type {string} */ sp) =>
    `<span class="t-en">${esc(en)}</span><span class="t-es" lang="es">${esc(sp)}</span>`;
  /** English with its Spanish below, always both (the Language dialog must be readable by a student who cannot read English yet). */
  const both = (/** @type {string} */ en, /** @type {string} */ sp) =>
    `<span lang="en">${esc(en)}</span> <span class="lang-es-inline" lang="es">${esc(sp)}</span>`;

  /* ---- settings (device-local, inside the comfort record) -------------------------------------------------------- */
  /** @type {Record<string, {mode: string, frame: number, chips: boolean, chunk: string}>} */
  const PRESETS = {
    plain: { mode: "en", frame: 4, chips: false, chunk: "auto" },
    support: { mode: "tap", frame: 2, chips: true, chunk: "auto" },
    full: { mode: "both", frame: 1, chips: true, chunk: "always" },
  };
  const MODES = ["en", "tap", "both", "esfirst"];
  const DEFAULTS = { preset: "support", ...PRESETS.support, quiet: false };

  /** @param {string} key @returns {any} */
  function readJson(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      return v && typeof v === "object" ? v : null;
    } catch (_e) {
      return null;
    }
  }
  /** @param {string} key @param {any} value */
  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_e) {
      /* the choice still applies for this visit */
    }
  }
  /** Keep only values this build understands, so a damaged or hand-edited record never breaks the page. */
  function clean(/** @type {any} */ raw) {
    const r = raw && typeof raw === "object" ? raw : {};
    const preset = PRESETS[r.preset] || r.preset === "custom" ? r.preset : DEFAULTS.preset;
    const base = PRESETS[preset] || PRESETS[DEFAULTS.preset];
    return {
      preset,
      mode: MODES.includes(r.mode) ? r.mode : base.mode,
      frame: Number.isInteger(r.frame) && r.frame >= 1 && r.frame <= 6 ? r.frame : base.frame,
      chips: typeof r.chips === "boolean" ? r.chips : base.chips,
      chunk: ["auto", "always", "off"].includes(r.chunk) ? r.chunk : base.chunk,
      quiet: r.quiet === true,
    };
  }
  const stored = readJson(COMFORT_KEY)?.language;
  const fresh = !stored;
  /** @type {ReturnType<typeof clean>} */
  let s = clean(stored);
  // a teacher's ?lang=es link opens Spanish for this visit without changing the saved choice
  const linked = /[?&]lang=es\b/.test(location.search);
  if (linked) s = { ...s, mode: s.mode === "esfirst" ? "esfirst" : "both" };

  function persist() {
    if (linked) return;
    const rec = readJson(COMFORT_KEY) || {};
    rec.language = s;
    writeJson(COMFORT_KEY, rec);
  }

  /* ---- device-local counts and written-task evidence --------------------------------------------------------------- */
  const MAX_ENTRIES = 60;
  function readStore() {
    const d = readJson(LANG_KEY);
    return d && d.v === 1 ? d : { v: 1, uses: {}, entries: [], seen: [], items: {}, tone: {} };
  }
  /** Count one use of a support ("tap", "starters", "tiles", "partner", "chunk", "esfirst", "chip"). Never shown as a deficit. */
  function note(/** @type {string} */ kind) {
    const d = readStore();
    d.uses[kind] = (d.uses[kind] || 0) + 1;
    writeJson(LANG_KEY, d);
  }
  function addEntry(
    /** @type {{lesson: string, id: string, moves: Record<string, boolean>, used: string[]}} */ e,
  ) {
    const d = readStore();
    d.entries = [
      ...d.entries.filter((x) => !(x.lesson === e.lesson && x.id === e.id)),
      { ...e, t: Date.now() },
    ].slice(-MAX_ENTRIES);
    writeJson(LANG_KEY, d);
  }
  /** A small per-item record (the "I need to find" slots, built sentences, the partner tick). */
  function item(/** @type {string} */ key, /** @type {any} */ patch) {
    const d = readStore();
    if (patch) {
      d.items[key] = { ...(d.items[key] || {}), ...patch };
      const keys = Object.keys(d.items);
      if (keys.length > 400) for (const k of keys.slice(0, keys.length - 400)) delete d.items[k];
      writeJson(LANG_KEY, d);
    }
    return d.items[key] || {};
  }
  function seenAmber(/** @type {string} */ en) {
    if (!en) return readStore().seen || [];
    const d = readStore();
    if (!d.seen.includes(en)) d.seen.push(en);
    writeJson(LANG_KEY, d);
    return d.seen;
  }

  /* ---- the page: classes, Español sync, quiet mode ----------------------------------------------------------------- */
  const api = () => RT.api;
  const wantEs = () => s.mode === "both" || s.mode === "esfirst";
  let syncing = false;

  function applyClasses() {
    const b = document.body;
    if (!b) return;
    b.classList.toggle("lang-tap", s.mode === "tap");
    b.classList.toggle("lang-esfirst", s.mode === "esfirst");
    b.classList.toggle("lang-quiet", s.quiet);
    b.classList.toggle("lang-chips", s.chips);
    b.dataset.langMode = s.mode;
    b.dataset.langFrame = String(s.frame);
  }
  /** Make the runtime's showEs agree with the chosen mode by pressing its own Español button (it re-renders every section). */
  function syncEs() {
    const a = api();
    if (!a || a.state.showEs === wantEs()) return;
    const btn = document.getElementById("toggle-es-btn");
    syncing = true;
    if (btn) btn.click();
    else {
      a.state.showEs = wantEs();
      document.body.classList.toggle("show-es", a.state.showEs);
    }
    syncing = false;
  }
  const FIXED = {
    practice: [
      ["Warm-up", "Calentamiento"],
      ["Guided practice", "Práctica guiada"],
      ["Grade-level practice", "Práctica del grado"],
      ["New numbers", "Números nuevos"],
      ["Show what you know", "Demuestra lo que sabes"],
    ],
    challenge: [
      ["Harder levels", "Niveles más difíciles"],
      ["Multi-step missions", "Misiones de varios pasos"],
      ["Hands-on lab", "Laboratorio práctico"],
      ["Find the flaw", "Encuentra el error"],
      ["Show everything", "Muestra todo"],
    ],
  };
  const QUIET_VOICE = {
    ok: ["Correct."],
    okEs: ["Correcto."],
    retry: ["Not yet. Check the hint."],
    retryEs: ["Todavía no. Mira la pista."],
  };
  /** @type {any} */
  let storyVoice = null;
  function applyQuiet() {
    const a = api();
    if (a?.data?.world) {
      if (storyVoice === null) storyVoice = a.data.world.voice || {};
      a.data.world.voice = s.quiet ? QUIET_VOICE : storyVoice;
    }
    const fixed = /** @type {any} */ (FIXED)[
      a?.data?.mode === "challenge" ? "challenge" : "practice"
    ];
    document.querySelectorAll(".tab-btn").forEach((btn, i) => {
      const name = btn.querySelector(".tab-name");
      const desc = btn.querySelector(".tab-desc");
      if (!name || !fixed[i]) return;
      const el = /** @type {HTMLElement} */ (name);
      if (el.dataset.world === undefined) el.dataset.world = el.innerHTML;
      el.innerHTML = s.quiet ? bi(fixed[i][0], fixed[i][1]) : el.dataset.world;
      if (desc) {
        const d = /** @type {HTMLElement} */ (desc);
        if (d.dataset.world === undefined) d.dataset.world = d.innerHTML;
        const count = /\((\d+)\)\s*$/.exec(d.textContent || "")?.[1];
        d.innerHTML = s.quiet ? (count ? `(${count})` : "") : d.dataset.world;
      }
    });
  }
  function apply() {
    applyClasses();
    syncEs();
    applyQuiet();
    refreshAll();
    document
      .getElementById("language-btn")
      ?.setAttribute("aria-label", `Language: ${label()}. Press to change.`);
    try {
      W.StudioBus?.emit("language", { ...s });
    } catch (_e) {
      /* a listener's failure never stops the page */
    }
  }
  const label = () =>
    `${s.preset === "custom" ? "Custom" : s.preset[0].toUpperCase() + s.preset.slice(1)}, ${
      {
        en: "English only",
        tap: "English, tap for Español",
        both: "English and Español",
        esfirst: "Español primero",
      }[s.mode]
    }`;
  /** Change settings from the dialog or a script. A preset sets every value it owns; any other change makes the set "custom". */
  function set(/** @type {Partial<typeof s>} */ patch) {
    const next = { ...s, ...patch };
    if (patch.preset && PRESETS[patch.preset])
      Object.assign(next, PRESETS[patch.preset], { preset: patch.preset });
    else if (
      !patch.preset &&
      ("mode" in patch || "frame" in patch || "chips" in patch || "chunk" in patch)
    ) {
      const p = PRESETS[next.preset];
      next.preset =
        p &&
        p.mode === next.mode &&
        p.frame === next.frame &&
        p.chips === next.chips &&
        p.chunk === next.chunk
          ? next.preset
          : "custom";
    }
    if (patch.mode === "esfirst") note("esfirst");
    s = clean(next);
    persist();
    apply();
  }

  /* ---- one-sentence-per-line view and the "I need to find" card ------------------------------------------------------ */
  const itemKey = (/** @type {any} */ it) => `${api()?.data?.lesson}:${api()?.data?.mode}:${it.id}`;
  /** @type {Map<string, boolean>} */
  const chunkChoice = new Map();
  const stemOf = (/** @type {any} */ it) => ({
    en: it.q ?? it.p ?? "",
    es: it.qEs ?? it.pEs ?? "",
  });
  function chunkActive(/** @type {any} */ it) {
    const k = itemKey(it);
    if (chunkChoice.has(k)) return !!chunkChoice.get(k);
    if (s.chunk === "off") return false;
    if (s.chunk === "always") return true;
    return false;
  }
  /** Wrap numbers (with their units) in a tint. Words, signs and operations are never marked, and stacked fractions are left whole. */
  function tintIn(/** @type {Element} */ root) {
    const walker = document.createTreeWalker(root, 4);
    /** @type {Text[]} */
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = /** @type {Text} */ (n);
      if (!t.parentElement?.closest(".frac, .sr-only, .lang-qmark") && /\d/.test(t.data))
        nodes.push(t);
    }
    for (const t of nodes) {
      const segs = Core.tint(t.data);
      if (!segs.some((x) => x.n)) continue;
      const frag = document.createDocumentFragment();
      for (const x of segs) {
        if (!x.n) frag.append(x.t);
        else {
          const sp = document.createElement("span");
          sp.className = "lang-num";
          sp.textContent = x.t;
          frag.append(sp);
        }
      }
      t.replaceWith(frag);
    }
  }
  function chunkHtml(/** @type {any} */ it) {
    const { en, es } = stemOf(it);
    const { lines, esAll } = Core.chunk(en, es);
    const u = U();
    const rows = lines
      .map(
        (l, i) =>
          `<span class="lang-line${l.ask ? " lang-ask" : ""}"><span class="lang-en">${l.ask ? `<span class="lang-qmark" aria-hidden="true">? </span>` : ""}${u.tx(l.en)}</span>${l.es ? `<button type="button" class="lang-es-tap" aria-expanded="false" aria-label="Español, línea ${i + 1}">ES</button>${u.txEs(l.es)}` : ""}</span>`,
      )
      .join("");
    return `<span class="lang-chunks">${rows}</span>${esAll ? u.txEs(esAll) : ""}`;
  }
  function needHtml(/** @type {any} */ it) {
    const rec = item(itemKey(it));
    const u = U();
    const field = (/** @type {string} */ k, /** @type {string} */ en, /** @type {string} */ sp) =>
      `<label class="lang-need-row"><span class="lang-need-lead">${esc(en)}${u.es(sp)}</span><input type="text" class="lang-need-input" data-need="${k}" autocomplete="off" spellcheck="false" value="${esc(rec[k] || "")}"></label>`;
    return `<div class="lang-need" role="group" aria-label="What is this asking?">
      <p class="lang-need-title"><strong>What is this asking?${u.es("¿Qué se pregunta?")}</strong></p>
      ${field("find", "I need to find", "Necesito hallar")}${field("know", "I know", "Ya sé")}
      <p class="item-sub lang-note">Write in English, Spanish, or both. Nobody grades this.${u.es("Escribe en inglés, en español o en ambos. Nadie califica esto.")}</p></div>`;
  }
  /** Turn the one-sentence-per-line view on or off for one problem. */
  function setChunk(
    /** @type {any} */ it,
    /** @type {HTMLElement} */ host,
    /** @type {boolean} */ on,
  ) {
    const q = /** @type {HTMLElement|null} */ (host.querySelector(".item-q"));
    if (!q) return;
    const had = q.dataset.langChunked === "1";
    if (on && !had) {
      q.dataset.langOrig = q.innerHTML;
      q.innerHTML = chunkHtml(it);
      tintIn(q);
      q.dataset.langChunked = "1";
      q.insertAdjacentHTML("afterend", needHtml(it));
      note("chunk");
    } else if (!on && had) {
      q.innerHTML = q.dataset.langOrig || q.innerHTML;
      delete q.dataset.langChunked;
      host.querySelector(".lang-need")?.remove();
    }
    const b = host.closest(".stage-card")?.querySelector("[data-lang-chunk]");
    b?.setAttribute("aria-pressed", String(on));
    reorder(host);
  }

  /* ---- tap-for-Español and Español primero ---------------------------------------------------------------------------- */
  const TAP_BLOCKS = ".item-q, .fb-guide";
  /** A tap button before the Spanish twin of a stem or a feedback line; the stage-level button opens all of a problem's Español. */
  function addTaps(/** @type {ParentNode} */ root) {
    for (const blk of /** @type {HTMLElement[]} */ ([...root.querySelectorAll(TAP_BLOCKS)])) {
      if (blk.dataset.langTap === "1" || blk.dataset.langChunked === "1") continue;
      const es = [...blk.children].find((c) => c.classList.contains("es-text"));
      if (!es) continue;
      blk.dataset.langTap = "1";
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lang-es-tap";
      b.setAttribute("aria-expanded", "false");
      b.setAttribute("aria-label", "Español");
      b.textContent = "ES";
      es.before(b);
    }
  }
  /** Español primero: the Spanish twin of a stem, hint or feedback line moves before its English. */
  const ESF_BLOCKS = ".item-q, .item-sub, .fb-guide, .hint-list li";
  function reorder(/** @type {ParentNode} */ root) {
    if (s.mode !== "esfirst") return;
    for (const blk of /** @type {HTMLElement[]} */ ([...root.querySelectorAll(ESF_BLOCKS)])) {
      if (blk.dataset.langEsf === "1") continue;
      const es = [...blk.children].filter((c) => c.classList.contains("es-text"));
      if (!es.length || blk.querySelector(".lang-chunks")) continue;
      blk.dataset.langEsf = "1";
      for (const e of es.reverse()) blk.prepend(e);
    }
  }
  /** Put the blocks back in English-first order when the mode leaves Español primero. */
  function restoreOrder() {
    for (const blk of /** @type {HTMLElement[]} */ ([
      ...document.querySelectorAll("[data-lang-esf]"),
    ])) {
      const es = [...blk.children].filter((c) => c.classList.contains("es-text"));
      for (const e of es) blk.append(e);
      delete blk.dataset.langEsf;
    }
  }

  document.addEventListener("click", (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const tap = /** @type {HTMLElement|null} */ (t?.closest(".lang-es-tap"));
    if (tap) {
      const sib = /** @type {HTMLElement|null} */ (tap.nextElementSibling);
      const target = sib?.classList.contains("es-text") ? sib : null;
      if (!target) return;
      const open = !target.classList.contains("lang-open");
      target.classList.toggle("lang-open", open);
      tap.setAttribute("aria-expanded", String(open));
      if (open) note("tap");
      return;
    }
    const all = /** @type {HTMLElement|null} */ (t?.closest("[data-lang-all]"));
    if (all) {
      const scope = all.closest(".stage-card, .glossary, .studio-context, .topic-strip");
      const open = !scope?.classList.contains("lang-open-all");
      scope?.classList.toggle("lang-open-all", open);
      all.setAttribute("aria-pressed", String(open));
      if (open) note("tap");
      return;
    }
    const ch = /** @type {HTMLElement|null} */ (t?.closest("[data-lang-chunk]"));
    if (ch) {
      const stage = ch.closest(".stage-card");
      const host = /** @type {HTMLElement|null} */ (stage?.querySelector(".item-body"));
      const it = current.get(stage);
      if (!host || !it) return;
      const on = host.querySelector(".item-q")?.getAttribute("data-lang-chunked") !== "1";
      chunkChoice.set(itemKey(it), on);
      setChunk(it, host, on);
    }
  });
  document.addEventListener("input", (e) => {
    const inp =
      e.target instanceof HTMLInputElement && e.target.matches("[data-need]") ? e.target : null;
    if (!inp) return;
    const stage = inp.closest(".stage-card");
    const it = current.get(stage);
    if (it)
      item(itemKey(it), { [/** @type {string} */ (inp.dataset.need)]: inp.value.slice(0, 160) });
  });

  /* ---- decorating a problem ------------------------------------------------------------------------------------------- */
  /** @type {Map<any, any>} the item shown in each stage */
  const current = new Map();
  /** @type {HTMLElement[]} */
  const watched = [];
  /** Called by the runtime after it mounts a problem (and by tests). */
  function decorate(
    /** @type {number} */ tab,
    /** @type {any} */ it,
    /** @type {HTMLElement} */ host,
    /** @type {HTMLElement} */ stage,
  ) {
    if (!host || !stage || !it) return;
    current.set(stage, it);
    if (!watched.includes(stage)) {
      watched.push(stage);
      new MutationObserver(() => {
        addTaps(stage);
        reorder(stage);
        W.StudioLangWrite?.afterMutation?.(stage);
      }).observe(stage, { childList: true, subtree: true });
    }
    const tools = stage.querySelector(".item-tools");
    if (tools && !tools.querySelector("[data-lang-all]")) {
      tools.insertAdjacentHTML(
        "afterbegin",
        `<button type="button" class="tool-btn lang-tool lang-tool-es" data-lang-all aria-pressed="false">🌐 ${bi("Show Español", "Mostrar español")}</button>`,
      );
    }
    if (tools && host.querySelector(".item-q") && !tools.querySelector("[data-lang-chunk]")) {
      tools.insertAdjacentHTML(
        "beforeend",
        `<button type="button" class="tool-btn lang-tool" data-lang-chunk aria-pressed="false">📋 ${bi("What is this asking?", "¿Qué se pregunta?")}</button>`,
      );
    }
    if (host.querySelector(".item-q") && chunkActive(it)) setChunk(it, host, true);
    addTaps(stage);
    reorder(stage);
    W.StudioLangWords?.decorate(tab, it, host, stage);
    W.StudioLangWrite?.decorate(tab, it, host, stage);
  }
  function refreshAll() {
    restoreOrder();
    for (const [stage, it] of current) {
      const host = /** @type {HTMLElement|null} */ (stage?.querySelector(".item-body"));
      if (!host || !it) continue;
      const q = host.querySelector(".item-q");
      if (q && chunkActive(it) !== (q.getAttribute("data-lang-chunked") === "1"))
        setChunk(it, host, chunkActive(it));
      reorder(stage);
    }
    W.StudioLangWords?.refresh?.();
    W.StudioLangWrite?.refresh?.();
  }

  /* ---- the Language button and dialog ------------------------------------------------------------------------------ */
  function radios(
    /** @type {string} */ name,
    /** @type {[string, string, string, string?][]} */ opts,
    /** @type {string} */ cur,
  ) {
    return `<div class="comfort-choices lang-choices" role="radiogroup">${opts
      .map(
        ([v, en, sp, hint]) =>
          `<label><input type="radio" name="lang-${name}" value="${v}"${v === String(cur) ? " checked" : ""}><span>${both(en, sp)}${hint ? ` <small class="lang-hint">${esc(hint)}</small>` : ""}</span></label>`,
      )
      .join("")}</div>`;
  }
  function evidenceHtml() {
    const sum = Core.summarize(readStore().entries);
    if (!sum) return "";
    const m = sum.moves;
    const u = sum.used;
    const usedBits = [
      u.starters && `${both("starters shown", "comienzos a la vista")}: ${u.starters}`,
      u.tiles && `${both("sentence tiles", "fichas de oración")}: ${u.tiles}`,
      u.esfirst && `${both("Español primero", "Español primero")}: ${u.esfirst}`,
      u.partner && `${both("partner talk", "conversación con compañero")}: ${u.partner}`,
    ].filter(Boolean);
    return `<section class="lang-evidence" aria-label="My language practice"><h3>${both("My language practice", "Mi práctica del lenguaje")}</h3>
      <p class="lang-note">${both(`This stays on this device. It counts what your ${sum.n} explanations already do. It is not a grade.`, `Esto se queda en este aparato. Cuenta lo que ya hacen tus ${sum.n} explicaciones. No es una calificación.`)}</p>
      <ul><li>${both("A math word", "Una palabra de matemáticas")}: ${m.term} / ${sum.n}</li><li>${both("A reason", "Una razón")}: ${m.reason} / ${sum.n}</li><li>${both("A sequence word", "Una palabra de orden")}: ${m.sequence} / ${sum.n}</li><li>${both("A way to check", "Una forma de comprobar")}: ${m.check} / ${sum.n}</li></ul>
      ${usedBits.length ? `<p class="lang-note">${both("Supports you chose:", "Apoyos que elegiste:")} ${usedBits.join(" · ")}</p>` : ""}</section>`;
  }
  function openDialog() {
    document.getElementById("language-dialog")?.remove();
    const d = document.createElement("dialog");
    d.id = "language-dialog";
    d.className = "comfort-dialog lang-dialog";
    d.setAttribute("aria-labelledby", "language-title");
    const levels = Core.LEVELS.map((l) => [String(l.id), `${l.id}. ${l.en}`, l.es]);
    d.innerHTML = `<div class="comfort-head"><h2 id="language-title">${both("Language", "Idioma")}</h2><div class="comfort-actions"><button type="button" data-close>${both("Done", "Listo")}</button></div></div>
      <div class="comfort-body">
        <fieldset><legend>${both("How much help?", "¿Cuánta ayuda?")}</legend>${radios(
          "preset",
          [
            ["plain", "Plain", "Sencillo", "English only, short starters"],
            ["support", "Support", "Apoyo", "tap for Español, whole sentence frames"],
            ["full", "Full", "Completo", "English and Español, tiles and pictures"],
            ["custom", "My own mix", "Mi propia mezcla"],
          ],
          s.preset,
        )}</fieldset>
        <fieldset><legend>${both("How should I see Español?", "¿Cómo quiero ver el español?")}</legend>${radios(
          "mode",
          [
            ["en", "English only", "Solo inglés"],
            ["tap", "English, tap for Español", "Inglés; toco para ver español"],
            ["both", "English and Español", "Inglés y español"],
            ["esfirst", "Español primero", "Español primero"],
          ],
          s.mode,
        )}</fieldset>
        <fieldset><legend>${both("Writing help", "Ayuda para escribir")}</legend>${radios(
          "frame",
          levels.map(([v, en, sp]) => [v, en, sp]),
          String(s.frame),
        )}
        <p class="lang-note">${both("Starters can always be shown again on a problem.", "Siempre puedes volver a ver los comienzos en un problema.")}</p></fieldset>
        <fieldset><legend>${both("What is this asking?", "¿Qué se pregunta?")}</legend>${radios(
          "chunk",
          [
            ["auto", "On for long problems", "Para problemas largos"],
            ["always", "On for every problem", "Para todos los problemas"],
            ["off", "Only when I press the button", "Solo cuando toco el botón"],
          ],
          s.chunk,
        )}</fieldset>
        <div class="comfort-toggles">
          <label class="comfort-toggle"><input type="checkbox" data-chips${s.chips ? " checked" : ""}><span>${both("Show the words in each problem", "Mostrar las palabras de cada problema")}</span></label>
          <label class="comfort-toggle"><input type="checkbox" data-quiet${s.quiet ? " checked" : ""}><span>${both("Quiet mode: short story, plain section names, calm feedback", "Modo tranquilo: historia corta, nombres sencillos, comentarios calmados")}</span></label>
        </div>
        ${evidenceHtml()}
      </div>`;
    document.body.append(d);
    d.addEventListener("change", (e) => {
      const t = /** @type {HTMLInputElement} */ (e.target);
      if (t.name === "lang-preset")
        set(t.value === "custom" ? { preset: "custom" } : { preset: t.value });
      else if (t.name === "lang-mode") set({ mode: t.value });
      else if (t.name === "lang-frame") set({ frame: Number(t.value) });
      else if (t.name === "lang-chunk") set({ chunk: t.value });
      else if (t.matches("[data-chips]")) set({ chips: t.checked });
      else if (t.matches("[data-quiet]")) set({ quiet: t.checked });
      for (const r of /** @type {NodeListOf<HTMLInputElement>} */ (
        d.querySelectorAll("input[type=radio]")
      )) {
        const v = { preset: s.preset, mode: s.mode, frame: String(s.frame), chunk: s.chunk }[
          r.name.replace("lang-", "")
        ];
        r.checked = r.value === v;
      }
    });
    d.querySelector("[data-close]")?.addEventListener("click", () => d.close());
    d.addEventListener("close", () => {
      d.remove();
      document.getElementById("language-btn")?.focus();
    });
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
  }
  function mountButton() {
    const actions = document.querySelector(".header-actions");
    if (!actions || document.getElementById("language-btn")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.id = "language-btn";
    b.className = "top-btn";
    b.setAttribute("aria-haspopup", "dialog");
    b.innerHTML = `<span aria-hidden="true">🌐</span> ${bi("Language", "Idioma")}`;
    b.addEventListener("click", openDialog);
    actions.append(b);
  }

  /* ---- boot ------------------------------------------------------------------------------------------------------------ */
  // The old Español button moves between English only and the stacked view, and the page follows the new mode.
  function watchLegacyToggle() {
    new MutationObserver(() => {
      if (syncing) return;
      const on = document.body.classList.contains("show-es");
      if (on === wantEs()) return;
      s = clean({ ...s, mode: on ? "both" : "en", preset: "custom" });
      persist();
      applyClasses();
      applyQuiet();
      refreshAll();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
  function boot() {
    applyClasses();
    mountButton();
    watchLegacyToggle();
    const settle = () => {
      const a = api();
      // first visit on this device: a studio the student already switched to Español keeps showing it
      if (fresh && a?.state.showEs && !linked) {
        s = clean({ ...s, mode: "both", preset: "custom" });
        persist();
        applyClasses();
      }
      syncEs();
      applyQuiet();
    };
    if (document.readyState === "complete") settle();
    else addEventListener("load", settle);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  W.StudioLanguage = {
    settings: () => ({ ...s }),
    set,
    decorate,
    note,
    addEntry,
    item,
    seenAmber,
    itemKey,
    current: (/** @type {any} */ stage) => current.get(stage),
    open: openDialog,
    PRESETS,
    DEFAULTS,
    FIXED,
    QUIET_VOICE,
    tintIn,
    esc,
    bi,
    both,
  };
})();
