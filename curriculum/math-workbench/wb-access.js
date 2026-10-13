/* Math Workbench — access layer (WCAG extras on top of the Access panel in index.html).
 *
 *  - MWBProfile: one place to read the student's saved language / access / scaffold
 *    choices, shared with the Reasoning Studio. Keys are unchanged: mw_lang, mw_a11y,
 *    mw_scaffold (1-4). Events: mwb:a11y, mwb:lang, mwb:scaffold.
 *  - "Name for printing" (stored as mw_handin_who, device-local) fills the printed header.
 *  - Colour-blind-safe pen and highlighter palettes; every swatch is named.
 *  - Board contents: richer spoken descriptions of each object, a keyboard outline
 *    (Alt+B) listing the board in reading order, and polite announcements when an
 *    object is selected.
 * Reaches the board only through window.MWBShell (defined in index.html). */
(function (root) {
  "use strict";
  const doc = root.document;
  if (!doc || root.MWBProfile) return;

  const WHO_KEY = "mw_handin_who";
  const SCAFFOLD_KEY = "mw_scaffold";

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(root.localStorage.getItem(key));
      return value && typeof value === "object" ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function readText(key, fallback) {
    try {
      return root.localStorage.getItem(key) || fallback;
    } catch (_) {
      return fallback;
    }
  }

  /* ------------------------------------------------------------- shared profile */
  const profile = {
    lang: () => (readText("mw_lang", "en") === "es" ? "es" : "en"),
    a11y: () => readJson("mw_a11y", {}),
    scaffold: () => {
      const level = Number(readText(SCAFFOLD_KEY, "2"));
      return level >= 1 && level <= 4 ? level : 2;
    },
    setScaffold: (level) => {
      const next = Math.max(1, Math.min(4, Math.round(Number(level)) || 2));
      try {
        root.localStorage.setItem(SCAFFOLD_KEY, String(next));
      } catch (_) {}
      root.dispatchEvent(new CustomEvent("mwb:scaffold", { detail: { level: String(next) } }));
      return next;
    },
    name: () => String(readJson(WHO_KEY, {}).name || ""),
  };
  root.MWBProfile = Object.freeze(profile);

  /* ----------------------------------------------------------- name for printing */
  function sanitizeName(value) {
    return String(value || "")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 40);
  }
  function saveName(value) {
    const name = sanitizeName(value);
    try {
      if (name) root.localStorage.setItem(WHO_KEY, JSON.stringify({ name }));
      else root.localStorage.removeItem(WHO_KEY);
    } catch (_) {}
  }
  function fillPrintHead(on) {
    const fields = doc.querySelectorAll(".workbook-print-head .print-field");
    const values = [profile.name(), new Date().toLocaleDateString(), ""];
    fields.forEach((field, index) => {
      field.querySelectorAll(".wbx-print-value").forEach((n) => {
        n.remove();
      });
      if (!on || !values[index]) return;
      const span = doc.createElement("span");
      span.className = "wbx-print-value";
      span.style.cssText =
        "display:inline;font-size:11pt;letter-spacing:0;text-transform:none;color:#14223a";
      span.textContent = values[index];
      field.appendChild(span);
    });
  }
  root.addEventListener("beforeprint", () => fillPrintHead(true));
  root.addEventListener("afterprint", () => fillPrintHead(false));

  /* The Access panel is built lazily; sync its extra rows each time it opens. */
  function syncPanel() {
    const name = doc.getElementById("a11yName");
    if (name && !name.dataset.wbxBound) {
      name.dataset.wbxBound = "1";
      name.addEventListener("input", () => saveName(name.value));
    }
    if (name) name.value = profile.name();
    const row = doc.getElementById("a11yTeacherRow");
    const box = doc.getElementById("a11yCalcOff");
    if (row && box) {
      const teacher = !!(root.MWBTeacher && root.MWBTeacher.isTeacher());
      row.hidden = !teacher;
      box.checked = !!(root.MWBTeacher && root.MWBTeacher.calcOff());
      if (!box.dataset.wbxBound) {
        box.dataset.wbxBound = "1";
        box.addEventListener("change", () => {
          if (root.MWBTeacher) root.MWBTeacher.setCalcOff(box.checked);
        });
      }
    }
  }
  root.addEventListener("mwb:a11y-open", syncPanel);

  /* ----------------------------------------------------------- ink palettes */
  // Okabe-Ito: distinguishable under every common form of colour blindness.
  const CB_PEN = ["#14223a", "#0072b2", "#e69f00", "#009e73", "#d55e00", "#cc79a7"];
  const CB_HI = ["#f0e442", "#56b4e9", "#e69f00", "#009e73", "#cc79a7", "#d9d9d9"];
  const NAMES = {
    "#14223a": "dark navy",
    "#205fa6": "blue",
    "#2c7d6b": "green",
    "#d97706": "orange",
    "#dc2626": "red",
    "#7c3aed": "purple",
    "#fde047": "yellow",
    "#86efac": "light green",
    "#fca5e0": "pink",
    "#7dd3fc": "light blue",
    "#fdba74": "light orange",
    "#c4b5fd": "lavender",
    "#0072b2": "blue",
    "#e69f00": "orange",
    "#009e73": "bluish green",
    "#d55e00": "vermilion",
    "#cc79a7": "reddish purple",
    "#f0e442": "yellow",
    "#56b4e9": "sky blue",
    "#d9d9d9": "gray",
  };
  let defaults = null;
  function applyPalettes(on) {
    const shell = root.MWBShell;
    if (!shell) return;
    if (!defaults) defaults = shell.inkPalettes();
    if (on) shell.setInkPalettes(CB_PEN, CB_HI);
    else shell.setInkPalettes(defaults.pen, defaults.hi);
  }
  function followPrefs() {
    applyPalettes(!!profile.a11y().cbsafe);
  }
  root.addEventListener("mwb:a11y", followPrefs);
  root.addEventListener("mwb:lang", () => root.setTimeout(relabel, 0));

  /* Name every colour swatch (they were all just "Pen color"). */
  function nameSwatches(flyout) {
    const hi =
      flyout.querySelector("h3") && /highlighter/i.test(flyout.querySelector("h3").textContent);
    flyout.querySelectorAll(".swatch").forEach((swatch) => {
      const hex = (swatch.style.backgroundColor || "").trim();
      const key = rgbToHex(hex);
      swatch.setAttribute(
        "aria-label",
        (hi ? "Highlighter color: " : "Pen color: ") + (NAMES[key] || "custom"),
      );
      swatch.title = NAMES[key] || "";
    });
  }
  function rgbToHex(value) {
    const match = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(value);
    if (!match) return value.toLowerCase();
    return `#${[1, 2, 3].map((i) => Number(match[i]).toString(16).padStart(2, "0")).join("")}`;
  }

  /* ------------------------------------------------------ spoken object model */
  function list(values, limit) {
    return (Array.isArray(values) ? values : [])
      .filter((v) => v !== "" && v != null)
      .slice(0, limit || 8)
      .join(", ");
  }
  const f = (template, vars) =>
    root.MWBI18n ? root.MWBI18n.f(template, vars) : template.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? vars[k] : m));
  function describe(o) {
    if (!o) return f("Object");
    const t = o.type;
    const bits = {
      tile: () => f(o.kind === "op" ? "Symbol {v}" : "Number {v}", { v: o.value || "" }).trim(),
      text: () => (o.text ? f("Text: {v}", { v: String(o.text).slice(0, 120) }) : f("Empty text box")),
      fraction: () => f("Fraction {a} over {b}", { a: o.num || f("blank"), b: o.den || f("blank") }),
      division: () => f("Long division: {a} divided by {b}", { a: o.dividend || f("blank"), b: o.divisor || f("blank") }),
      line: () => f(o.cross ? "Cross-out line" : "Separator line"),
      numline: () => f("Number line from {a} to {b}", { a: o.min, b: o.max }),
      coordgrid: () => f("Coordinate plane from {a} to {b}", { a: o.min, b: o.max }),
      angle: () => f("Angle of {a} degrees", { a: Math.round(o.deg) }),
      arraymodel: () => f("Array with {a} rows and {b} columns", { a: o.rows, b: o.cols }),
      fracbar: () => f("Fraction bar with {a} parts, {b} shaded", { a: o.parts, b: (o.shaded || []).length }),
      dblnumline: () => {
        const top = list(o.top);
        const bottom = list(o.bottom);
        return f("Double number line, {a} steps", { a: o.intervals }) +
          (top ? f(", top {v}", { v: top }) : "") + (bottom ? f(", bottom {v}", { v: bottom }) : "");
      },
      ratiotable: () => {
        const top = list(o.top);
        const bottom = list(o.bottom);
        return f("Ratio table") + (top ? f(", top row {v}", { v: top }) : "") + (bottom ? f(", bottom row {v}", { v: bottom }) : "");
      },
      tape: () => f("Tape diagram with {a} parts", { a: o.parts || f("several") }),
      chips: () => {
        const chips = Array.isArray(o.chips) ? o.chips : [];
        const pos = chips.filter((v) => v > 0).length;
        return f("Integer chips: {a} positive, {b} negative", { a: pos, b: chips.length - pos });
      },
      ineqline: () => f("Inequality on a number line at {a}", { a: o.point }),
      dotplot: () => f("Dot plot"),
      boxplot: () => f("Box plot"),
      histogram: () => f("Histogram"),
      algebra: () => f("Algebra tiles"),
      baseten: () => f("Base-ten blocks"),
      placevalue: () => f("Place-value chart"),
      formula: () => f("Reference card"),
      guide: () => f("Guided card: {a}", { a: o.title || "" }).trim(),
      shape2d: () => `${o.label || o.shape || f("Shape")}`,
      shape3d: () => `${o.label || o.shape || f("3-D figure")}`,
    };
    const fn = bits[t];
    try {
      return fn ? fn() : String(t || f("Object")).replace(/[-_]/g, " ");
    } catch (_) {
      return String(t || f("Object"));
    }
  }

  function relabel() {
    const shell = root.MWBShell;
    const overlay = doc.getElementById("overlay");
    if (!shell || !overlay) return;
    const byId = new Map(shell.objects().map((o) => [o.id, o]));
    overlay.querySelectorAll(".obj[data-id]").forEach((el) => {
      const o = byId.get(el.dataset.id);
      if (!o) return;
      const label = f("{label} — arrow keys move, Delete removes", { label: describe(o) });
      if (el.getAttribute("aria-label") !== label) el.setAttribute("aria-label", label);
    });
  }

  /* --------------------------------------------------------------- announcer */
  let live = null;
  function announce(text) {
    if (!live) {
      live = doc.createElement("p");
      live.id = "wbxAnnounce";
      live.className = "mwr-sr-only wbx-sr-only";
      live.dataset.noI18n = "1";
      live.setAttribute("role", "status");
      live.setAttribute("aria-live", "polite");
      doc.body.appendChild(live);
    }
    live.textContent = "";
    root.setTimeout(() => {
      live.textContent = text;
    }, 30);
  }

  let lastSelected = "";
  function watchSelection() {
    const overlay = doc.getElementById("overlay");
    if (!overlay) return;
    new MutationObserver(() => {
      relabel();
      const sel = overlay.querySelector(".obj.sel");
      const id = sel ? sel.dataset.id : "";
      if (id && id !== lastSelected) {
        const o = root.MWBShell.objects().find((x) => x.id === id);
        if (o) announce(f("Selected: {label}. Arrow keys move it, Delete removes it.", { label: describe(o) }));
      }
      lastSelected = id;
    }).observe(overlay, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    relabel();
  }

  /* ---------------------------------------------------------- board outline */
  let outline = null;
  function closeOutline() {
    if (!outline) return;
    outline.remove();
    outline = null;
  }
  function readingOrder(objects) {
    return objects
      .slice()
      .sort(
        (a, b) =>
          Math.round((a.y || 0) / 40) - Math.round((b.y || 0) / 40) || (a.x || 0) - (b.x || 0),
      );
  }
  function openOutline() {
    const shell = root.MWBShell;
    if (!shell) return;
    closeOutline();
    const objects = readingOrder(shell.objects());
    outline = doc.createElement("div");
    outline.className = "wbx-gate-bg";
    const card = doc.createElement("div");
    card.className = "wbx-gate wbx-outline";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "wbxOutlineTitle");
    const info = shell.pageInfo();
    card.innerHTML = `<h2 id="wbxOutlineTitle">Board contents</h2><p class="wbx-muted">Page ${info.page} of ${info.count}. Listed top to bottom, left to right. Choose one to select it.</p>`;
    const ol = doc.createElement("ol");
    ol.className = "wbx-outline-list";
    ol.dataset.noI18n = "1"; // entries are already described in the current language
    if (!objects.length) {
      const p = doc.createElement("p");
      p.textContent = "Nothing on this page yet.";
      card.appendChild(p);
    }
    objects.forEach((o) => {
      const li = doc.createElement("li");
      const b = doc.createElement("button");
      b.type = "button";
      b.className = "tbtn";
      b.textContent = describe(o);
      b.addEventListener("click", () => {
        closeOutline();
        shell.focusObject(o.id);
      });
      li.appendChild(b);
      ol.appendChild(li);
    });
    card.appendChild(ol);
    const close = doc.createElement("button");
    close.type = "button";
    close.className = "tbtn solid";
    close.textContent = "Close";
    close.addEventListener("click", closeOutline);
    card.appendChild(close);
    outline.appendChild(card);
    outline.addEventListener("click", (event) => {
      if (event.target === outline) closeOutline();
    });
    doc.body.appendChild(outline);
    (card.querySelector("ol button") || close).focus();
  }

  function onKey(event) {
    if (event.key === "Escape" && outline) {
      closeOutline();
      return;
    }
    if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "b") {
      event.preventDefault();
      openOutline();
    }
  }

  function addSkipLink() {
    const link = doc.createElement("button");
    link.type = "button";
    link.id = "wbxOutlineBtn";
    link.className = "wbx-skip";
    link.textContent = "Board contents (Alt+B)";
    link.addEventListener("click", openOutline);
    doc.body.insertBefore(link, doc.body.firstChild);
  }

  function boot() {
    followPrefs();
    watchSelection();
    addSkipLink();
    doc.addEventListener("keydown", onKey, true);
    const flyout = doc.getElementById("flyout");
    if (flyout) {
      new MutationObserver(() => {
        if (flyout.dataset.kind === "pen" || flyout.dataset.kind === "highlighter")
          nameSwatches(flyout);
      }).observe(flyout, { childList: true, subtree: true });
    }
    syncPanel();
  }
  root.MWBAccess = Object.freeze({ describe, openOutline, announce });
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
