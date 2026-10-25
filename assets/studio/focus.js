/**
 * Practice Studio widget platform (window.StudioFocus): the behaviour that keeps hands-on widgets usable on a phone and a
 * 1366x768 Chromebook. Layout rules live in assets/studio/clarity.css (the "studio v4 platform" block); this file does the
 * parts CSS cannot:
 *
 *   Full screen   a button on every activity and lab opens a modal <dialog> with the item inside it. The item's own node
 *                 moves (listeners, the lab's shadow root and its state go with it), so nothing is re-mounted. Esc or Done
 *                 puts it back and returns focus to the button.
 *   Labels        a lab picture's text is never drawn smaller than 13px; a caption too long for the narrow picture is
 *                 wrapped into short lines instead of running off the edge.
 *   Tab stops     a read-only box is not a tab stop (a locked control or a solved answer).
 *   Floating      Save / Resume and the Math Workbench hide while they would sit on a widget control, so they never cover
 *   buttons       a slider, a Check button or a model control.
 *   Feedback      after the student presses Check, the feedback box is scrolled into view (never behind the buttons).
 *   Trail         on a phone the open section's tab is scrolled into view.
 *   Coach         the first time an activity kind mounts on a device, a skippable three-step card says what to do
 *                 (StudioAct.coach(kind, steps) registers a kind's own steps; every kind gets a default).
 *   Cell entry    a ratio table's blank cell takes the typed answer itself; the "?" box below stays as the fallback.
 *
 * Nothing here knows any mathematics and nothing here awards stars: it only moves, sizes and describes what the kinds draw.
 * Loaded with `defer` after assets/studio/chrome.js. Safe to load on a page that has no runtime (it does nothing).
 */
(() => {
  const W = /** @type {any} */ (window);
  if (W.StudioFocus) return;
  const MIN_LABEL_PX = 13;
  /**
   * Added to the learning labs' own stylesheet inside each model's shadow root (kinds-lab.js sheet()). The picture sits at the top
   * of its column instead of floating in the middle of a tall one, the control the student may change comes before the locked
   * ones, its labels get a light outline so a label crossing a bar stays
   * readable, and a draggable picture keeps its pointer for itself.
   */
  W.StudioLabCss = `.model-workspace{grid-template-columns:minmax(0,1fr) minmax(190px,230px)}
.model-picture{place-items:start center;min-height:0}
.model-picture text{paint-order:stroke;stroke:#f6fbfd;stroke-width:3px;stroke-linejoin:round}
.model-picture.direct svg{touch-action:none}
.model-controls>*{order:3}
.model-controls>.direct-hint{order:0;grid-column:1/-1;margin:0;font-size:.85rem}
.model-controls>.model-locked{order:1;grid-column:1/-1;margin:0;font-size:.85rem}
.model-controls>label:has(input:not([readonly])){order:2}
.model-controls>label:has(input[readonly]){order:4}
.model-controls>[data-reset]{order:9}
@media(max-width:900px){.model-workspace{grid-template-columns:1fr}}
@media(max-width:600px){.model-picture{padding:0}.model-controls{padding:10px;gap:10px}}`;
  const WIDGETS = ".act-host, .lab-model, .lab-mission";
  const $$ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) => [
    ...root.querySelectorAll(sel),
  ];
  const isEs = () => document.body.classList.contains("show-es");
  const bi = (/** @type {string} */ en, /** @type {string} */ es) =>
    `<span class="t-en">${en}</span><span class="t-es" lang="es">${es}</span>`;
  const calm = () =>
    document.documentElement.dataset.comfortCalm === "on" ||
    !!matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  /** Run fn at most once per frame. */
  const frame = (/** @type {() => void} */ fn) => {
    let queued = false;
    return () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        fn();
      });
    };
  };

  /** An SVG number attribute (attributes, not the animated-length DOM, so this also runs in the node tests). */
  const num = (/** @type {Element} */ el, /** @type {string} */ name) =>
    Number(el.getAttribute(name) || 0);
  const viewBoxOf = (/** @type {Element} */ svg) => {
    const [x = 0, y = 0, width = 0, height = 0] = (svg.getAttribute("viewBox") || "")
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    return { x, y, width, height };
  };

  /**
   * Split a label into lines that each fit `room` picture units, given the units one character takes. Pure: the same words in the
   * same order, never a word cut in the middle. A label that is one word comes back as one line.
   */
  const wrapLabel = (
    /** @type {string} */ text,
    /** @type {number} */ per,
    /** @type {number} */ room,
  ) => {
    /** @type {string[]} */
    const lines = [];
    let line = "";
    for (const word of String(text).trim().split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && next.length * per > room) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };

  /* ---- 1. lab pictures: labels at least 13px, long captions wrapped ------------------------------------------------ */
  const SVG_NS = "http://www.w3.org/2000/svg";

  /** Put a picture's text back the way the model drew it (before a new fit at another width). */
  function unfit(/** @type {SVGSVGElement} */ svg) {
    for (const t of /** @type {SVGTextElement[]} */ ($$("text[data-fit-text]", svg))) {
      t.textContent = t.dataset.fitText || "";
      t.removeAttribute("data-fit-text");
      t.style.removeProperty("font-size");
    }
  }

  /**
   * Make every <text> in a model picture at least MIN_LABEL_PX on screen. The picture is scaled by width, so a 600-unit
   * picture on a 300px phone draws an 18px label at 9px: the label is enlarged in picture units. A label that would then
   * run past the picture's edge is wrapped into balanced lines (a caption near the bottom grows upward).
   * @param {SVGSVGElement} svg
   */
  function fitLabels(svg) {
    const vb = viewBoxOf(svg);
    const w = svg.getBoundingClientRect().width;
    if (!vb || !vb.width || !w) return;
    const scale = w / vb.width;
    unfit(svg);
    if (scale >= 1) return;
    for (const t of /** @type {SVGTextElement[]} */ ($$("text", svg))) {
      const size = Number.parseFloat(getComputedStyle(t).fontSize) || 16;
      if (size * scale >= MIN_LABEL_PX - 0.01) continue;
      const bigger = MIN_LABEL_PX / scale;
      const text = t.textContent || "";
      const before = t.getComputedTextLength?.() || 0;
      t.style.fontSize = `${bigger}px`;
      t.dataset.fitText = text;
      const x = Number(t.getAttribute("x") || 0);
      const y = Number(t.getAttribute("y") || 0);
      const anchor = t.getAttribute("text-anchor") || "start";
      // distances are measured from the picture's own left edge (a picture's viewBox need not start at 0)
      const gapL = x - vb.x;
      const room =
        anchor === "middle"
          ? 2 * Math.min(gapL, vb.width - gapL)
          : anchor === "end"
            ? gapL
            : vb.width - gapL;
      const width = before * (bigger / size);
      if (!before || width <= room * 0.98 || !/\s/.test(text.trim())) continue;
      const lines = wrapLabel(text, width / text.length, room * 0.96);
      const gap = bigger * 1.18;
      const first = y - vb.y > vb.height * 0.65 ? y - (lines.length - 1) * gap : y;
      t.textContent = "";
      lines.forEach((ln, i) => {
        const span = document.createElementNS(SVG_NS, "tspan");
        span.setAttribute("x", String(x));
        span.setAttribute("y", String(first + i * gap));
        span.textContent = ln;
        t.append(span);
      });
    }
  }

  /** Dead tab stops: a read-only box cannot be edited, so it is skipped by Tab (a pointer can still select it). */
  function deadStops(/** @type {ParentNode} */ root) {
    for (const el of /** @type {HTMLInputElement[]} */ (
      $$("input[readonly]:not([tabindex])", root)
    )) {
      el.setAttribute("tabindex", "-1");
      el.dataset.v4Dead = "1";
    }
    for (const el of /** @type {HTMLInputElement[]} */ (
      $$("input[data-v4-dead]:not([readonly])", root)
    )) {
      el.removeAttribute("tabindex");
      delete el.dataset.v4Dead;
    }
  }

  /** @param {ShadowRoot | HTMLElement} stage a lab's shadow stage */
  function wireStage(stage) {
    const h = /** @type {any} */ (stage);
    if (h._v4) return;
    h._v4 = true;
    let busy = false;
    const run = (/** @type {boolean} */ refit) => {
      busy = true;
      try {
        for (const svg of /** @type {SVGSVGElement[]} */ ($$(".model-picture svg", stage)))
          if (refit || !svg.dataset.fitted) {
            fitLabels(svg);
            svg.dataset.fitted = "1";
          }
        deadStops(stage);
      } finally {
        mo.takeRecords();
        busy = false;
      }
    };
    const soon = frame(() => run(false));
    const mo = new MutationObserver(() => {
      if (!busy) soon();
    });
    mo.observe(stage, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["readonly"],
    });
    const again = frame(() => run(true));
    if (typeof ResizeObserver === "function") {
      let lastW = 0;
      new ResizeObserver((entries) => {
        const nw = Math.round(entries[0].contentRect.width);
        if (nw !== lastW) {
          lastW = nw;
          again();
        }
      }).observe(/** @type {Element} */ (stage instanceof ShadowRoot ? stage.host : stage));
    }
    run(true);
  }

  // The studio's lab host announces its shadow stage (kinds-lab.js shadowStage); mission stages too.
  document.addEventListener("studio:stage", (e) => {
    const stage = /** @type {any} */ (e).detail?.stage;
    if (stage) wireStage(stage);
  });

  /* ---- 2. floating buttons: never on top of a widget control --------------------------------------------------------- */
  const overlaps = (/** @type {DOMRect} */ a, /** @type {DOMRect} */ b) =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const updateFab = frame(() => {
    const fab = document.getElementById("nsr-root");
    if (!fab) return;
    const box = fab.getBoundingClientRect();
    let hit = false;
    for (const host of $$(WIDGETS)) {
      const hb = host.getBoundingClientRect();
      if (!hb.width || hb.bottom < 0 || hb.top > innerHeight || !overlaps(box, hb)) continue;
      const root = /** @type {ParentNode} */ (/** @type {any} */ (host).shadowRoot || host);
      for (const el of $$("button, input, select, textarea, [role=slider], svg, canvas", root)) {
        if (overlaps(box, el.getBoundingClientRect())) {
          hit = true;
          break;
        }
      }
      if (hit) break;
    }
    if (!hit)
      for (const bar of $$(".lab-goalbar, .act-host .check-bar")) {
        const br = bar.getBoundingClientRect();
        if (br.height && getComputedStyle(bar).position === "sticky" && overlaps(box, br))
          hit = true;
      }
    document.body.classList.toggle("studio-fab-hidden", hit);
  });

  /* ---- 3. feedback after Check is brought into view --------------------------------------------------------------------- */
  let lastInput = 0;
  for (const ev of ["pointerdown", "keydown", "click"])
    document.addEventListener(ev, () => (lastInput = Date.now()), true);
  function showFeedback(/** @type {Element} */ box) {
    if (!box.classList.contains("show") || Date.now() - lastInput > 1500) return;
    const r = box.getBoundingClientRect();
    if (!r.height) return;
    // the bottom reserve is the sticky check bar (if any) plus the floating buttons' margin
    const bar = document.querySelector(".lab-goalbar");
    const reserve =
      (bar && getComputedStyle(bar).position === "sticky"
        ? bar.getBoundingClientRect().height
        : 0) + 12;
    if (r.top >= 8 && r.bottom <= innerHeight - reserve) return;
    box.scrollIntoView({ block: "nearest", behavior: calm() ? "auto" : "smooth" });
  }

  /* ---- 4. Full screen -------------------------------------------------------------------------------------------------------- */
  /** @type {{dialog: HTMLDialogElement, body: HTMLElement, hole: HTMLElement, opener: HTMLElement | null} | null} */
  let sheet = null;

  function closeSheet() {
    if (!sheet) return;
    const { dialog } = sheet;
    if (dialog.open) dialog.close();
    else onClosed();
  }
  function onClosed() {
    if (!sheet) return;
    const { dialog, body, hole, opener } = sheet;
    sheet = null;
    document.body.classList.remove("focus-open");
    // the item may have been replaced while the sheet was open (Next problem): then there is nowhere to put it back
    if (hole.isConnected) {
      hole.before(body);
      hole.remove();
    }
    dialog.remove();
    const back = opener && opener.isConnected ? opener : document.querySelector(".focus-open-btn");
    /** @type {HTMLElement | null} */ (back)?.focus?.();
    updateFab();
  }
  function openSheet(/** @type {HTMLElement} */ body, /** @type {HTMLElement | null} */ opener) {
    if (sheet || typeof HTMLDialogElement === "undefined") return;
    const dialog = document.createElement("dialog");
    dialog.className = "focus-sheet";
    dialog.setAttribute("aria-labelledby", "focus-title");
    dialog.innerHTML = `<div class="focus-bar"><h2 class="focus-title" id="focus-title">${bi("Full screen", "Pantalla completa")}</h2><button type="button" class="btn btn-go btn-sm" data-focus-done>${bi("Done", "Listo")}</button></div><div class="focus-body"></div>`;
    const hole = document.createElement("p");
    hole.className = "focus-hole";
    hole.setAttribute("role", "status");
    hole.innerHTML = bi(
      "This activity is open in full screen.",
      "Esta actividad está abierta en pantalla completa.",
    );
    body.before(hole);
    /** @type {HTMLElement} */ (dialog.querySelector(".focus-body")).append(body);
    document.body.append(dialog);
    sheet = { dialog, body, hole, opener };
    dialog.addEventListener("close", onClosed);
    dialog.querySelector("[data-focus-done]")?.addEventListener("click", closeSheet);
    // pressing Next inside the sheet re-draws the problem: close the sheet with it
    dialog.addEventListener("click", () =>
      setTimeout(() => {
        if (sheet && !sheet.hole.isConnected) closeSheet();
      }, 0),
    );
    document.body.classList.add("focus-open");
    dialog.showModal();
    /** @type {HTMLElement | null} */ (
      body.querySelector("button:not([disabled]), input:not([readonly]), [tabindex='0']")
    )?.focus({ preventScroll: true });
  }

  /** The row that holds an activity's Check button stays on screen (CSS: .act-host .check-bar). Every act draws it as a small flex row. */
  function checkBar(/** @type {HTMLElement} */ host) {
    if (host.querySelector(".check-bar")) return;
    const btn = $$("button", host).find((b) =>
      /^(check|comprobar|revisar)/i.test((b.textContent || "").trim()),
    );
    const bar = btn?.parentElement;
    if (!bar || bar === host || bar.children.length > 5) return;
    // a short row (buttons, a note, the act's own feedback line), never a layout container
    if (bar.getBoundingClientRect().height > 150) return;
    bar.classList.add("check-bar");
  }

  /** Add the Full screen button to every item that holds a widget. */
  function decorate() {
    for (const body of /** @type {HTMLElement[]} */ ($$(".stage-card .item-body"))) {
      if (!body.querySelector(WIDGETS)) continue;
      const tools = body.parentElement?.querySelector(".item-tools");
      if (!tools || tools.querySelector(".focus-open-btn")) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tool-btn focus-open-btn focus-open";
      btn.setAttribute("aria-haspopup", "dialog");
      btn.innerHTML = `<span aria-hidden="true">⛶</span> ${bi("Full screen", "Pantalla completa")}`;
      btn.addEventListener("click", () => openSheet(body, btn));
      tools.prepend(btn);
    }
    deadStops(document);
    for (const bar of /** @type {HTMLElement[]} */ ($$(".lab-goalbar:not([data-bar-watch])"))) {
      bar.dataset.barWatch = "1";
      if (typeof ResizeObserver !== "function") continue;
      new ResizeObserver(() => {
        const h = Math.round(bar.getBoundingClientRect().height);
        if (h) bar.parentElement?.style.setProperty("--lab-bar-h", `${h}px`);
      }).observe(bar);
    }
    for (const host of /** @type {HTMLElement[]} */ ($$(".lab-model, .lab-mission")))
      if (host.shadowRoot) wireStage(host.shadowRoot);
    for (const host of /** @type {HTMLElement[]} */ ($$(".act-host[data-act]"))) {
      checkBar(host);
      coachFor(host);
    }
    cellEntry();
  }

  /* ---- 5. first-touch coach ---------------------------------------------------------------------------------------------------- */
  const DEFAULT_STEPS = [
    {
      icon: "👀",
      en: "Look at the picture and read the task.",
      es: "Mira la imagen y lee la tarea.",
    },
    {
      icon: "👆",
      en: "Change one thing at a time and watch what changes.",
      es: "Cambia una cosa a la vez y mira qué cambia.",
    },
    {
      icon: "✅",
      en: "Press Check when you think it is right.",
      es: "Toca Revisar cuando creas que está bien.",
    },
  ];
  const coachDone = (/** @type {string} */ kind) => {
    try {
      return !!W.EWLComfort?.get?.("coached")?.[kind];
    } catch (_e) {
      return true;
    }
  };
  const coachMark = (/** @type {string} */ kind) => {
    const all = { ...(W.EWLComfort?.get?.("coached") || {}), [kind]: 1 };
    W.EWLComfort?.set?.("coached", all);
  };
  const LAB_STEPS = [
    {
      icon: "🔮",
      en: "Predict first: will the result go up or down?",
      es: "Predice primero: ¿el resultado sube o baja?",
    },
    {
      icon: "👆",
      en: "Change one control and watch the picture.",
      es: "Cambia un control y mira la imagen.",
    },
    {
      icon: "✅",
      en: "Press Check my model when you reach the goal.",
      es: "Toca Revisar mi modelo cuando llegues a la meta.",
    },
  ];
  function coachFor(/** @type {HTMLElement} */ host, /** @type {string} */ kindName = "") {
    const kind = kindName || host.dataset.act || "";
    if (!kind || host.dataset.coach || !W.EWLComfort?.get || coachDone(kind)) return;
    if (/** @type {HTMLElement} */ (host.closest(".item-body"))?.querySelector(".feedback-box.ok"))
      return;
    host.dataset.coach = "1";
    const steps = (
      W.StudioAct?.coachSteps?.(kind) || (kind === "lab" ? LAB_STEPS : DEFAULT_STEPS)
    ).slice(0, 3);
    let i = 0;
    const card = document.createElement("div");
    card.className = "coach";
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", isEs() ? "Primera vez: tres pasos" : "First time: three steps");
    const draw = () => {
      const s = steps[i];
      const last = i === steps.length - 1;
      card.innerHTML = `<p><span aria-hidden="true">${s.icon}</span> ${bi(s.en, s.es)}</p>
        <div class="coach-row"><span class="coach-count">${bi(`Step ${i + 1} of ${steps.length}`, `Paso ${i + 1} de ${steps.length}`)}</span>
        <button type="button" class="btn btn-sm btn-go" data-coach-next>${last ? bi("Got it", "Entendido") : bi("Next", "Siguiente")}</button>
        <button type="button" class="btn btn-sm" data-coach-skip>${bi("Skip", "Omitir")}</button></div>`;
    };
    const finish = () => {
      coachMark(kind);
      card.remove();
      /** @type {HTMLElement | null} */ (
        host.querySelector("button, input, [tabindex='0']")
      )?.focus({ preventScroll: true });
    };
    card.addEventListener("click", (e) => {
      const t = /** @type {HTMLElement} */ (e.target);
      if (t.closest("[data-coach-skip]")) finish();
      else if (t.closest("[data-coach-next]")) {
        if (i >= steps.length - 1) finish();
        else {
          i++;
          draw();
          /** @type {HTMLElement | null} */ (card.querySelector("[data-coach-next]"))?.focus();
        }
      }
    });
    draw();
    host.before(card);
  }

  /* ---- 6. a ratio table's blank cell takes the answer itself ----------------------------------------------------------------- */
  /**
   * Optional scale arrows on a ratio table: a button shows a small "x [ ]" box on the right edge between each pair of rows. The student
   * types the factor they see; nothing is filled in, nothing is graded, and the box is only a place to think (the table never changes).
   */
  function scaleArrows(/** @type {HTMLElement} */ wrap, /** @type {SVGSVGElement} */ svg) {
    if (wrap.dataset.arrows) return;
    const rules = $$("line", svg).filter((l) => {
      const a = /** @type {SVGLineElement} */ (l);
      return num(a, "y1") === num(a, "y2") && num(a, "x1") !== num(a, "x2");
    });
    if (!rules.length) return;
    wrap.dataset.arrows = "1";
    wrap.style.position = "relative";
    const vb = viewBoxOf(svg);
    const right = Math.max(...rules.map((l) => num(l, "x2")));
    const tools = document.createElement("div");
    tools.className = "viz-tools";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn btn-sm";
    toggle.setAttribute("aria-pressed", "false");
    const label = () =>
      (toggle.innerHTML =
        toggle.getAttribute("aria-pressed") === "true"
          ? bi("Hide scale arrows", "Ocultar flechas de escala")
          : bi("Show scale arrows", "Mostrar flechas de escala"));
    label();
    tools.append(toggle);
    wrap.after(tools);
    /** @type {HTMLElement[]} */
    const pills = rules.map((_l, i) => {
      const pill = document.createElement("label");
      pill.className = "scale-pill";
      pill.hidden = true;
      pill.innerHTML = `<span aria-hidden="true">×</span><input type="text" inputmode="decimal" autocomplete="off" aria-label="${isEs() ? `Factor de escala, de la fila ${i + 1} a la fila ${i + 2}` : `Scale factor, row ${i + 1} to row ${i + 2}`}">`;
      wrap.append(pill);
      return pill;
    });
    const place = () => {
      const sb = svg.getBoundingClientRect();
      const hb = wrap.getBoundingClientRect();
      rules.forEach((l, i) => {
        const y = num(l, "y1");
        pills[i].style.left = `${sb.left - hb.left + (sb.width * right) / vb.width}px`;
        pills[i].style.top = `${sb.top - hb.top + (sb.height * y) / vb.height}px`;
      });
    };
    toggle.addEventListener("click", () => {
      const on = toggle.getAttribute("aria-pressed") !== "true";
      toggle.setAttribute("aria-pressed", String(on));
      label();
      for (const p of pills) p.hidden = !on;
      if (on) {
        place();
        /** @type {HTMLElement | null} */ (pills[0].querySelector("input"))?.focus();
      }
    });
    if (typeof ResizeObserver === "function") new ResizeObserver(place).observe(wrap);
  }

  /** The viz table draws its blank cell as a rounded box (rect.v-sq). Put a real input on it; it mirrors the "?" box. */
  function cellEntry() {
    for (const body of /** @type {HTMLElement[]} */ ($$(".item-body"))) {
      const wrap = /** @type {HTMLElement | null} */ (
        body.querySelector('.viz-host[data-viz="table"]')
      );
      const main = /** @type {HTMLInputElement | null} */ (body.querySelector("input.num-input"));
      const svg = wrap?.querySelector("svg");
      if (!wrap || !svg) continue;
      scaleArrows(wrap, svg);
      if (!main || wrap.dataset.cell) continue;
      const blanks = $$("rect.v-sq", svg);
      if (blanks.length !== 1 || main.readOnly) continue;
      wrap.dataset.cell = "1";
      wrap.style.position = "relative";
      const vb = viewBoxOf(svg);
      const r = {
        x: num(blanks[0], "x"),
        y: num(blanks[0], "y"),
        w: num(blanks[0], "width"),
        h: num(blanks[0], "height"),
      };
      const pct = (/** @type {number} */ v, /** @type {number} */ total) => `${(100 * v) / total}%`;
      const cell = document.createElement("input");
      cell.type = "text";
      cell.inputMode = "decimal";
      cell.autocomplete = "off";
      cell.className = "num-input viz-cell";
      cell.setAttribute(
        "aria-label",
        isEs() ? "Escribe la respuesta en la casilla vacía" : "Type the answer in the empty box",
      );
      cell.value = main.value;
      cell.style.cssText = `position:absolute;left:${pct(r.x, vb.width)};top:${pct(r.y, vb.height)};width:${pct(r.w, vb.width)};height:${pct(r.h, vb.height)};min-height:0;padding:0 4px;text-align:center;box-sizing:border-box`;
      // the SVG sits at its own aspect ratio inside the host; line the input up with it
      const place = () => {
        const sb = svg.getBoundingClientRect();
        const hb = wrap.getBoundingClientRect();
        cell.style.left = `${sb.left - hb.left + (sb.width * r.x) / vb.width}px`;
        cell.style.top = `${sb.top - hb.top + (sb.height * r.y) / vb.height}px`;
        cell.style.width = `${(sb.width * r.w) / vb.width}px`;
        cell.style.height = `${(sb.height * r.h) / vb.height}px`;
        cell.style.fontSize = `${Math.max(14, (sb.height * 18) / vb.height)}px`;
      };
      wrap.append(cell);
      place();
      if (typeof ResizeObserver === "function") new ResizeObserver(place).observe(wrap);
      cell.addEventListener("input", () => {
        main.value = cell.value;
        main.dispatchEvent(new Event("input", { bubbles: true }));
      });
      main.addEventListener("input", () => {
        if (cell.value !== main.value) cell.value = main.value;
      });
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          main.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });
    }
  }

  /* ---- boot ---------------------------------------------------------------------------------------------------------------------- */
  function boot() {
    const main = document.querySelector(".main-container");
    if (!main) return;
    const soon = frame(() => {
      decorate();
      updateFab();
    });
    new MutationObserver((records) => {
      for (const rec of records) {
        const t = rec.target instanceof Element ? rec.target : rec.target.parentElement;
        const box = t?.closest?.(".item-fb");
        if (box) showFeedback(box);
      }
      soon();
    }).observe(main, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "readonly"],
    });
    addEventListener("scroll", updateFab, { passive: true });
    addEventListener("resize", () => {
      updateFab();
      scrollTrail();
    });
    // the open section's tab stays in view on a phone
    const trail = document.querySelector(".tab-list");
    trail?.addEventListener("click", () => setTimeout(scrollTrail, 0));
    trail?.addEventListener("keyup", () => setTimeout(scrollTrail, 0));
    W.StudioBus?.on?.("section", () => setTimeout(scrollTrail, 0));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sheet && !sheet.dialog.open) closeSheet();
    });
    soon();
    scrollTrail();
  }
  function scrollTrail() {
    const list = /** @type {HTMLElement | null} */ (document.querySelector(".tab-list"));
    const on = /** @type {HTMLElement | null} */ (list?.querySelector('[aria-selected="true"]'));
    if (!list || !on || list.scrollWidth <= list.clientWidth + 1) return;
    list.scrollTo({
      left: on.offsetLeft - (list.clientWidth - on.offsetWidth) / 2,
      behavior: "auto",
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  W.StudioFocus = {
    open: openSheet,
    close: closeSheet,
    fitLabels,
    wrapLabel,
    decorate,
    MIN_LABEL_PX,
    isOpen: () => !!sheet,
  };
})();
