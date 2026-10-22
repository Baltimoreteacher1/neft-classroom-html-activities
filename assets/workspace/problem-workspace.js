/**
 * Problem Workspace: one drawing pad and one notes box under a practice problem, with optional
 * guidance a student or family can open when they do not know how to start.
 *
 * One file serves every surface. The server-side generators (family homework, family and student
 * word problems) load it in Node to write the markup, and inline it for the page; the Practice
 * Studios and the Unit 4 studios load it as a script and call NTWorkspace.html() themselves.
 *
 * Guidance never carries an answer. The five steps are the same on every problem; the one tip
 * line is authored per problem or per kind of problem by the host. A step's starter sentence is
 * added to the notes in one tap, or all five at once.
 *
 * The pad stores strokes (not pixels) in localStorage per page and problem, so a reload keeps the
 * work, undo is exact and a resize never blurs the ink. Nothing a student draws or types leaves
 * the device. The toolbar and the guide are built on the first open of a lean server-written shell
 * (`data-fw-lazy`), so a page with twenty problems does not carry twenty copies of them.
 */
(function (host) {
  "use strict";

  /** @param {any} s */
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /**
   * Two languages in the host's own markup. "pair": the family pages' language-mode spans.
   * "studio": English with a Spanish span the studio's Español switch shows.
   * @param {string} dialect
   * @param {string} en
   * @param {string} es
   */
  const bi = (dialect, en, es) =>
    dialect === "studio"
      ? `${en}<span class="es-text" lang="es"> ${es}</span>`
      : `<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;
  /**
   * @param {string} dialect
   * @param {{en: string, es: string}} pair
   */
  const biPair = (dialect, pair) => bi(dialect, esc(pair.en), esc(pair.es));

  /** The five steps of the guide: a question, and a sentence starter to add to the notes. */
  const GUIDE_STEPS = [
    {
      name: { en: "Know", es: "Datos" },
      ask: {
        en: "What do I know? Underline the numbers and the words that matter.",
        es: "¿Qué sé? Subraya los números y las palabras importantes.",
      },
      starter: { en: "I know ___.", es: "Sé que ___." },
    },
    {
      name: { en: "Find", es: "Pregunta" },
      ask: {
        en: "What is the question asking me to find?",
        es: "¿Qué me pide encontrar la pregunta?",
      },
      starter: { en: "I need to find ___.", es: "Necesito hallar ___." },
    },
    {
      name: { en: "Plan", es: "Plan" },
      ask: {
        en: "Which picture or operation fits? Say your plan out loud first.",
        es: "¿Qué dibujo u operación sirve? Di tu plan en voz alta primero.",
      },
      starter: { en: "My plan is to ___.", es: "Mi plan es ___." },
    },
    {
      name: { en: "Solve", es: "Resolver" },
      ask: {
        en: "Do one step at a time. Write each step so someone could follow it.",
        es: "Haz un paso a la vez. Escribe cada paso para que otra persona lo siga.",
      },
      starter: { en: "Step 1: ___", es: "Paso 1: ___" },
    },
    {
      name: { en: "Check", es: "Comprobar" },
      ask: {
        en: "Does my answer make sense? Try it another way.",
        es: "¿Tiene sentido mi respuesta? Pruébala de otra manera.",
      },
      starter: { en: "I checked by ___.", es: "Comprobé usando ___." },
    },
  ];

  const PENS = [
    { color: "#12355b", en: "Navy pen", es: "Lápiz azul marino" },
    { color: "#0f8a86", en: "Teal pen", es: "Lápiz verde azulado" },
    { color: "#b45309", en: "Amber pen", es: "Lápiz ámbar" },
    { color: "#c2410c", en: "Coral pen", es: "Lápiz coral" },
  ];

  const BACKDROPS = [
    { key: "blank", en: "Blank", es: "En blanco" },
    { key: "grid", en: "Grid", es: "Cuadrícula" },
    { key: "dots", en: "Dots", es: "Puntos" },
  ];

  /** Reveal unit → the blank stamp that unit's mathematics lives on (drawn in problem-workspace.css). */
  const STAMPS = {
    3: { key: "doubleline", en: "Double number line", es: "Recta numérica doble" },
    4: { key: "percent", en: "100 grid", es: "Cuadrícula de 100" },
    7: { key: "plane", en: "Coordinate plane", es: "Plano de coordenadas" },
  };

  /** @param {any} unit */
  const stampForUnit = (unit) => /** @type {any} */ (STAMPS)[Number(unit)] || null;

  /**
   * @param {string} d dialect
   * @param {boolean} hasModel
   * @param {any} stamp
   */
  function toolsHtml(d, hasModel, stamp) {
    const options = [
      ...(hasModel ? [{ key: "model", en: "Model", es: "Modelo" }] : []),
      ...BACKDROPS,
      ...(stamp ? [{ key: "stamp", en: stamp.en, es: stamp.es }] : []),
    ];
    /** @param {string} act @param {string} icon @param {string} en @param {string} es @param {string} [extra] */
    const tool = (act, icon, en, es, extra = "") =>
      `<button type="button" class="fw-btn" data-fw-act="${act}" ${extra}>${icon} ${bi(d, en, es)}</button>`;
    return `<div class="fw-tools" role="toolbar" aria-label="Drawing tools / Herramientas de dibujo">
          <span class="fw-pens" role="group" aria-label="Pen color / Color del lápiz">${PENS.map(
            (pen, i) =>
              `<button type="button" class="fw-btn fw-pen${i === 0 ? " is-on" : ""}" data-fw-pen="${pen.color}" aria-pressed="${i === 0}" style="--pen:${pen.color}" aria-label="${esc(pen.en)} / ${esc(pen.es)}"><span class="fw-dot" aria-hidden="true"></span></button>`,
          ).join("")}</span>
          ${tool("eraser", "🧽", "Eraser", "Borrador", 'aria-pressed="false"')}
          ${tool("undo", "↩️", "Undo", "Deshacer")}
          ${tool("clear", "🗑️", "Clear", "Borrar")}
          ${tool("big", "⤢", "Bigger", "Más grande", 'aria-pressed="false"')}
          <label class="fw-backdrop"><span class="fw-backdrop-label">${bi(d, "Page", "Página")}</span>
            <select class="fw-select" data-fw-backdrop aria-label="Page style / Estilo de página">${options
              .map((o) => `<option value="${o.key}">${esc(o.en)} · ${esc(o.es)}</option>`)
              .join("")}</select></label>
        </div>`;
  }

  /**
   * @param {string} d dialect
   * @param {{en: string, es: string} | null} tip
   */
  function guideHtml(d, tip) {
    const steps = GUIDE_STEPS.map(
      (step, i) => `<li class="fw-step">
        <div><strong>${i + 1}. ${biPair(d, step.name)}</strong> ${biPair(d, step.ask)}</div>
        <button type="button" class="fw-btn fw-add" data-fw-add data-en="${esc(step.starter.en)}" data-es="${esc(step.starter.es)}">＋ ${bi(d, "Add to my notes:", "Agregar a mis notas:")} <em>${esc(step.starter.en)}</em></button>
      </li>`,
    ).join("");
    return `<details class="fw-guide">
      <summary>💡 ${bi(d, "Need a start? Guide me (optional)", "¿Necesitas ayuda para empezar? Guíame (opcional)")}</summary>
      <div class="fw-guide-body">
        ${tip ? `<p class="fw-tip"><strong>${bi(d, "Try this:", "Prueba esto:")}</strong> ${biPair(d, tip)}</p>` : ""}
        <ol class="fw-steps">${steps}</ol>
        <button type="button" class="fw-btn fw-frame" data-fw-frame>📋 ${bi(d, "Put all five steps in my notes", "Poner los cinco pasos en mis notas")}</button>
      </div>
    </details>`;
  }

  /**
   * The workspace markup.
   *   key        unique on the page; names the saved work
   *   notesId    id and name of the notes textarea
   *   notesAttr  extra attributes for the textarea (a host's own save hook)
   *   caption    {en, es} shown over the pad
   *   tip        {en, es} the one problem-specific line in the guide, or null
   *   model      an SVG drawn under the pad (the problem's own picture), or ""
   *   stamp      {key, en, es} the unit's blank stamp (stampForUnit), or null
   *   padHtml    replaces the drawing pad (the tap-to-graph widgets keep their own surface)
   *   open       start open (a short page with few problems), otherwise closed to keep the page short
   *   dialect    "pair" (family pages, the default) or "studio"
   *   lazy       write only the shell; the toolbar and guide are built on first open
   *   hostClass  extra class on the outer element (the homework page's own workspace styling)
   * @param {any} o
   */
  function html(o) {
    const d = o.dialect || "pair";
    const hasModel = Boolean(o.model);
    const stamp = o.stamp || null;
    const tip = o.tip || null;
    const pad = o.padHtml
      ? o.padHtml
      : `${o.lazy ? "" : toolsHtml(d, hasModel, stamp)}
        <div class="hw-visual-frame fw-stage" data-fw-bg="${hasModel ? "model" : "grid"}"${stamp ? ` data-fw-stamp="${stamp.key}"` : ""}>
          ${hasModel ? `<div class="fw-model">${o.model}</div>` : ""}
          <canvas class="fw-canvas" role="img" aria-label="Drawing area. Draw with a finger, stylus or mouse. The notes box works with a keyboard. / Área de dibujo. Dibuja con el dedo, un lápiz óptico o el ratón. La caja de notas funciona con teclado."></canvas>
        </div>`;
    const lazy = Boolean(o.lazy);
    const data = lazy
      ? ` data-fw-lazy data-fw-dialect="${d}" data-fw-model="${hasModel ? 1 : 0}"${stamp ? ` data-fw-stamp-key="${stamp.key}" data-fw-stamp-en="${esc(stamp.en)}" data-fw-stamp-es="${esc(stamp.es)}"` : ""}${tip ? ` data-fw-tip-en="${esc(tip.en)}" data-fw-tip-es="${esc(tip.es)}"` : ""}`
      : "";
    return `
      <details class="${o.hostClass ? `${o.hostClass} ` : ""}fw" data-fw="${esc(o.key)}"${data}${o.open ? " open" : ""}>
        <summary><span class="fw-title">${bi(d, "✏️ Workspace: draw, type, or get a guided start", "✏️ Espacio de trabajo: dibuja, escribe o empieza con guía")}</span> <span class="fw-saved" hidden>${bi(d, "● saved", "● guardado")}</span></summary>
      <div class="hw-workspace fw-body">
        <div class="hw-visual fw-draw">
          <div class="hw-visual-caption">${biPair(d, o.caption)}</div>
          ${pad}
        </div>
        <div class="hw-work">
          <label class="hw-work-label" for="${esc(o.notesId)}">${bi(d, "📝 Show your work", "📝 Muestra tu trabajo")}</label>
          <textarea id="${esc(o.notesId)}" name="${esc(o.notesId)}" class="custom-textarea hw-work-input fw-notes" rows="5" placeholder="Step 1...  Step 2...  Step 3..."${o.notesAttr ? ` ${o.notesAttr}` : ""}></textarea>
        </div>
      </div>
      ${lazy ? "" : guideHtml(d, tip)}
      </details>`;
  }

  host.NTWorkspace = { GUIDE_STEPS, STAMPS, stampForUnit, html };

  if (typeof document === "undefined") return;

  /* ---- behavior, in the browser only ------------------------------------------------------------ */
  const MAX_SAVED = 90000;
  /** @type {WeakMap<any, any>} */
  const pads = new WeakMap();

  /** @param {string} key */
  const prefix = (key) => `fw:${location.pathname}:${key}`;
  /** @param {string} key */
  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(prefix(key)) || "null");
    } catch (_e) {
      return null;
    }
  }
  /** @param {string} key @param {any} value */
  function write(key, value) {
    try {
      localStorage.setItem(prefix(key), JSON.stringify(value));
    } catch (_e) {}
  }
  const esLang = () =>
    document.body.classList.contains("lang-mode-es") || document.body.classList.contains("show-es");

  /** @returns {any} */
  const q = (/** @type {any} */ el, /** @type {string} */ sel) => el.querySelector(sel);
  /** @returns {any[]} */
  const qa = (/** @type {any} */ el, /** @type {string} */ sel) => [...el.querySelectorAll(sel)];

  /** @param {any} root */
  function showSaved(root) {
    const pad = pads.get(root);
    const notes = q(root, ".fw-notes");
    const has = (pad && pad.strokes.length) || (notes && notes.value.trim());
    const tag = q(root, ".fw-saved");
    if (tag) tag.hidden = !has;
  }

  /** @param {any} pad */
  function fit(pad) {
    const r = pad.stage.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(r.width * ratio);
    const h = Math.round(r.height * ratio);
    if (w !== pad.canvas.width || h !== pad.canvas.height) {
      pad.canvas.width = w;
      pad.canvas.height = h;
    }
    redraw(pad);
  }

  /** @param {any} pad @param {any} stroke */
  function paint(pad, stroke) {
    const c = pad.ctx;
    const w = pad.canvas.width;
    const h = pad.canvas.height;
    const p = stroke.p;
    if (!p.length) return;
    const unit = w / Math.max(pad.stage.getBoundingClientRect().width, 1);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalCompositeOperation = stroke.c === "e" ? "destination-out" : "source-over";
    c.strokeStyle = stroke.c === "e" ? "#000" : stroke.c;
    c.lineWidth = (stroke.c === "e" ? 18 : 3.5) * unit;
    c.beginPath();
    c.moveTo((p[0] / 1000) * w, (p[1] / 1000) * h);
    if (p.length === 2) c.lineTo((p[0] / 1000) * w + 0.1, (p[1] / 1000) * h);
    for (let i = 2; i < p.length; i += 2) c.lineTo((p[i] / 1000) * w, (p[i + 1] / 1000) * h);
    c.stroke();
  }

  /** @param {any} pad */
  function redraw(pad) {
    pad.ctx.clearRect(0, 0, pad.canvas.width, pad.canvas.height);
    for (const s of pad.strokes) paint(pad, s);
  }

  /** @param {any} pad @param {any} e */
  function point(pad, e) {
    const r = pad.canvas.getBoundingClientRect();
    const x = Math.min(1000, Math.max(0, Math.round(((e.clientX - r.left) / r.width) * 1000)));
    const y = Math.min(1000, Math.max(0, Math.round(((e.clientY - r.top) / r.height) * 1000)));
    return [x, y];
  }

  /** @param {any} pad */
  function store(pad) {
    const data = { s: pad.strokes, b: pad.stage.dataset.fwBg };
    if (JSON.stringify(data).length <= MAX_SAVED) write(pad.root.dataset.fw, data);
    showSaved(pad.root);
  }

  /** @param {any} pad @param {any} e */
  function down(pad, e) {
    e.preventDefault();
    fit(pad);
    try {
      pad.canvas.setPointerCapture(e.pointerId);
    } catch (_err) {}
    pad.current = { c: pad.eraser ? "e" : pad.color, p: point(pad, e) };
    pad.strokes.push(pad.current);
    pad.cleared = null;
    paint(pad, pad.current);
  }

  /** @param {any} pad @param {any} e */
  function move(pad, e) {
    if (!pad.current) return;
    e.preventDefault();
    const pt = point(pad, e);
    const p = pad.current.p;
    if (pt[0] === p[p.length - 2] && pt[1] === p[p.length - 1]) return;
    p.push(pt[0], pt[1]);
    redraw(pad);
  }

  /** @param {any} pad */
  function up(pad) {
    if (!pad.current) return;
    pad.current = null;
    store(pad);
  }

  /** @param {any} pad @param {string} value @param {boolean} [quiet] */
  function setBackdrop(pad, value, quiet) {
    const select = q(pad.root, "[data-fw-backdrop]");
    if (!select || !q(select, `option[value="${value}"]`)) return;
    pad.stage.dataset.fwBg = value;
    select.value = value;
    if (!quiet) store(pad);
  }

  /** @param {any} btn @param {boolean} on */
  const press = (btn, on) => btn.setAttribute("aria-pressed", on ? "true" : "false");

  /** @param {any} root */
  function makePad(root) {
    const stage = q(root, ".fw-stage");
    const canvas = stage && q(stage, ".fw-canvas");
    if (!canvas) return null;
    const saved = read(root.dataset.fw) || {};
    const pad = {
      root,
      stage,
      canvas,
      ctx: canvas.getContext("2d"),
      strokes: Array.isArray(saved.s) ? saved.s : [],
      cleared: null,
      color: "#12355b",
      eraser: false,
      current: null,
    };
    const select = q(root, "[data-fw-backdrop]");
    if (select) select.value = saved.b || stage.dataset.fwBg;
    if (saved.b) setBackdrop(pad, saved.b, true);
    pads.set(root, pad);
    canvas.addEventListener("pointerdown", (/** @type {any} */ e) => down(pad, e));
    canvas.addEventListener("pointermove", (/** @type {any} */ e) => move(pad, e));
    canvas.addEventListener("pointerup", () => up(pad));
    canvas.addEventListener("pointercancel", () => up(pad));
    canvas.addEventListener("lostpointercapture", () => up(pad));
    if (window.ResizeObserver) new ResizeObserver(() => fit(pad)).observe(stage);
    fit(pad);
    return pad;
  }

  /** Build the toolbar and the guide a lean shell left out. @param {any} root */
  function hydrate(root) {
    if (!root.hasAttribute("data-fw-lazy")) return;
    root.removeAttribute("data-fw-lazy");
    const d = root.dataset.fwDialect || "pair";
    const stamp = root.dataset.fwStampKey
      ? { key: root.dataset.fwStampKey, en: root.dataset.fwStampEn, es: root.dataset.fwStampEs }
      : null;
    const tip = root.dataset.fwTipEn
      ? { en: root.dataset.fwTipEn, es: root.dataset.fwTipEs || root.dataset.fwTipEn }
      : null;
    const probe = document.createElement("div");
    probe.innerHTML = html({
      key: "x",
      notesId: "x",
      caption: { en: "", es: "" },
      model: root.dataset.fwModel === "1" ? "x" : "",
      stamp,
      tip,
      dialect: d,
    });
    const tools = q(probe, ".fw-tools");
    const stage = q(root, ".fw-stage");
    if (tools && stage) stage.parentNode.insertBefore(tools, stage);
    const guide = q(probe, ".fw-guide");
    if (guide) root.appendChild(guide);
  }

  /** @param {any} root */
  function wake(root) {
    if (pads.has(root) || root.dataset.fwReady) return;
    root.dataset.fwReady = "1";
    hydrate(root);
    makePad(root);
    showSaved(root);
  }

  /** @param {any} pad @param {any} btn */
  function act(pad, btn) {
    const name = btn.dataset.fwAct;
    if (name === "eraser") {
      pad.eraser = !pad.eraser;
      press(btn, pad.eraser);
      for (const p of qa(pad.root, ".fw-pen")) {
        const on = !pad.eraser && p.dataset.fwPen === pad.color;
        p.classList.toggle("is-on", on);
        press(p, on);
      }
    }
    if (name === "undo") {
      if (pad.strokes.length) pad.strokes.pop();
      else if (pad.cleared) {
        pad.strokes = pad.cleared;
        pad.cleared = null;
      }
      redraw(pad);
      store(pad);
    }
    if (name === "clear" && pad.strokes.length) {
      pad.cleared = pad.strokes;
      pad.strokes = [];
      redraw(pad);
      store(pad);
    }
    if (name === "big") press(btn, pad.stage.classList.toggle("is-big"));
  }

  /** @param {any} root @param {string} text */
  function addToNotes(root, text) {
    const box = q(root, ".fw-notes");
    if (!box) return;
    box.value = box.value ? `${box.value.replace(/\s*$/, "")}\n${text}` : text;
    box.focus();
    box.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /** @param {any} el */
  const starter = (el) => (esLang() && el.dataset.es ? el.dataset.es : el.dataset.en);

  document.addEventListener(
    "toggle",
    (/** @type {any} */ e) => {
      if (e.target.matches?.("details.fw") && e.target.open) wake(e.target);
    },
    true,
  );

  document.addEventListener("click", (/** @type {any} */ e) => {
    const btn = e.target.closest?.(".fw .fw-btn");
    if (!btn) return;
    const root = btn.closest(".fw");
    const pad = pads.get(root);
    if (btn.dataset.fwPen && pad) {
      pad.color = btn.dataset.fwPen;
      pad.eraser = false;
      for (const p of qa(root, ".fw-pen")) {
        p.classList.toggle("is-on", p === btn);
        press(p, p === btn);
      }
      const er = q(root, '[data-fw-act="eraser"]');
      if (er) press(er, false);
    } else if (btn.dataset.fwAct && pad) act(pad, btn);
    else if (btn.hasAttribute("data-fw-add")) addToNotes(root, starter(btn));
    else if (btn.hasAttribute("data-fw-frame"))
      addToNotes(
        root,
        qa(root, "[data-fw-add]")
          .map((b, i) => `${i + 1}. ${starter(b)}`)
          .join("\n"),
      );
  });

  document.addEventListener("change", (/** @type {any} */ e) => {
    const select = e.target.closest?.("[data-fw-backdrop]");
    if (!select) return;
    const pad = pads.get(select.closest(".fw"));
    if (pad) setBackdrop(pad, select.value);
  });

  document.addEventListener("input", (/** @type {any} */ e) => {
    const box = e.target.closest?.(".fw-notes[data-fw-persist]");
    if (!box) return;
    const root = box.closest(".fw");
    write(`${root.dataset.fw}:notes`, box.value);
    showSaved(root);
  });

  /** Wake every workspace under `scope`: open ones, and any with saved work (which opens them). @param {any} [scope] */
  function mount(scope) {
    for (const root of qa(scope || document, "details.fw")) {
      const box = q(root, ".fw-notes");
      if (box?.hasAttribute("data-fw-persist")) {
        const text = read(`${root.dataset.fw}:notes`);
        if (typeof text === "string" && !box.value) box.value = text;
      }
      const saved = read(root.dataset.fw);
      const drawn = saved && Array.isArray(saved.s) && saved.s.length;
      if (drawn || box?.value.trim()) root.open = true;
      if (root.open || drawn) wake(root);
    }
  }
  /**
   * Remove saved work: one problem's (a re-rolled problem is a new problem), or every workspace on this page
   * (a studio's "start over"). Open pads are left as they are on screen until the host re-renders them.
   * @param {string} [key]
   */
  function forget(key) {
    try {
      if (key) {
        localStorage.removeItem(prefix(key));
        localStorage.removeItem(prefix(`${key}:notes`));
        return;
      }
      for (const name of Object.keys(localStorage))
        if (name.startsWith(prefix(""))) localStorage.removeItem(name);
    } catch (_e) {}
  }
  host.NTWorkspace.forget = forget;
  host.NTWorkspace.mount = mount;
  host.NTWorkspace.wake = wake;

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => mount());
  else mount();
  window.addEventListener("beforeprint", () => {
    for (const root of qa(document, "details.fw")) wake(root);
  });
})(typeof window !== "undefined" ? /** @type {any} */ (window) : /** @type {any} */ (globalThis));
