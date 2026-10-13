/* Math Workbench — extension registry.
 *
 * index.html owns the board engine (objects, selection, history, save). The
 * newer tools live in wb-*.js files and plug in through this registry:
 *
 *   MWB.register(type, { build(o, ctx), label(o), toolOpts, model, explain })
 *   MWB.addPalette({ section, key, name, svg, go })
 *   MWB.onReady(fn)           // runs once index.html has supplied MWB.ctx
 *
 * `MWB.ctx` is supplied by index.html (see "Extension context" there) and is
 * the only way these files reach engine state. `window.MWB_MODEL_TYPES` is the
 * set of object types that count as a math representation for the Reasoning
 * Studio's evidence summary (it feature-detects `hundredgrid`, `balance`, ...).
 */
(function (root) {
  "use strict";

  const MWB = (root.MWB = root.MWB || {});
  const types = new Map();
  const palette = [];
  const ready = [];
  MWB.ctx = null;
  MWB.modelTypes = new Set();
  root.MWB_MODEL_TYPES = MWB.modelTypes;

  MWB.setContext = (ctx) => {
    MWB.ctx = ctx;
    while (ready.length) ready.shift()(ctx);
  };
  MWB.onReady = (fn) => (MWB.ctx ? fn(MWB.ctx) : ready.push(fn));

  MWB.register = (type, def) => {
    types.set(type, def);
    if (def.model) MWB.modelTypes.add(type);
  };
  MWB.has = (type) => types.has(type);
  MWB.def = (type) => types.get(type);
  MWB.addPalette = (item) => palette.push(item);
  MWB.paletteItems = (section) => palette.filter((p) => p.section === section);

  /** Spanish when the Workbench is in Español mode, English otherwise. */
  // Every Spanish string the board's own modules hand out is remembered, so the shell's
  // MWBI18n.missing() (a gate aid) can tell "already Spanish" from "English with no entry".
  MWB.esSeen = new Set();
  MWB.t = (en, es) => {
    if (root.__mwbLang === "es" && es) {
      MWB.esSeen.add(es);
      return es;
    }
    return en;
  };

  /* -------- hooks the engine calls; every one is a safe no-op by default -------- */
  const hooks = { decorateEl: [], extendMiniTools: [], afterRender: [], afterPenFlyout: [] };
  MWB.on = (name, fn) => hooks[name].push(fn);
  MWB.decorateEl = (el, o) => hooks.decorateEl.forEach((fn) => fn(el, o));
  MWB.extendMiniTools = (o, mk, wrap) => hooks.extendMiniTools.forEach((fn) => fn(o, mk, wrap));
  MWB.afterRender = () => hooks.afterRender.forEach((fn) => fn());
  MWB.afterPenFlyout = (flyout, tool) => hooks.afterPenFlyout.forEach((fn) => fn(flyout, tool));
  MWB.eraserMode = "stroke";
  MWB.pointErase = () => false;
  MWB.constrainPoint = () => {};

  /** Appends the registered palette sections to the Tools flyout. */
  MWB.renderPalette = (flyout) => {
    const sections = [];
    for (const item of palette) if (!sections.includes(item.section)) sections.push(item.section);
    for (const name of sections) {
      const label = document.createElement("p");
      label.className = "pal-sub";
      label.textContent = name;
      const grid = document.createElement("div");
      grid.className = "pal-grid n3";
      for (const item of palette.filter((p) => p.section === name)) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pal-item tall";
        b.dataset.wbxTool = item.key;
        b.innerHTML = `${item.svg}<small></small>`;
        b.querySelector("small").textContent = MWB.t(item.name, item.es);
        b.addEventListener("click", item.go);
        grid.appendChild(b);
      }
      flyout.append(label, grid);
    }
  };

  /** Called by buildObjEl for types the engine does not know natively. */
  MWB.build = (o) => {
    const d = types.get(o.type);
    if (!d) return null;
    const el = d.build(o, MWB.ctx);
    return { el, toolOpts: d.toolOpts || { resize: true } };
  };
  MWB.label = (o) => {
    const d = types.get(o.type);
    return d && d.label ? d.label(o) : null;
  };

  /* -------- tiny DOM helpers (no innerHTML with user text) -------- */
  const SVG_NS = "http://www.w3.org/2000/svg";
  function apply(node, props) {
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") node.setAttribute("class", v);
      else if (k === "text") node.textContent = v;
      else if (k === "on") for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
      else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
      else node.setAttribute(k, v === true ? "" : String(v));
    }
  }
  function add(node, kids) {
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.appendChild(
        typeof kid === "string" || typeof kid === "number"
          ? document.createTextNode(String(kid))
          : kid,
      );
    }
    return node;
  }
  MWB.h = (tag, props, ...kids) => {
    const node = document.createElement(tag);
    apply(node, props);
    return add(node, kids);
  };
  MWB.svg = (tag, props, ...kids) => {
    const node = document.createElementNS(SVG_NS, tag);
    apply(node, props);
    return add(node, kids);
  };

  /** Stop a control from starting a board-object drag / page gesture. */
  MWB.guard = (node) => {
    node.addEventListener("pointerdown", (e) => e.stopPropagation());
    node.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") e.stopPropagation();
    });
    return node;
  };

  /** A labelled number input wired like the engine's own tool inputs. */
  MWB.numField = (value, label, opts, onCommit) => {
    const o = opts || {};
    const input = MWB.h("input", {
      type: "number",
      value,
      min: o.min,
      max: o.max,
      step: o.step || 1,
      "aria-label": label,
      class: "wbx-num",
    });
    MWB.guard(input);
    const commit = () => onCommit(input);
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        commit();
        input.blur();
      }
    });
    return input;
  };

  /** A text input that accepts fractions/decimals ("1 1/2", "0.75"). */
  MWB.textField = (value, label, onCommit, width) => {
    const input = MWB.h("input", {
      type: "text",
      value,
      inputmode: "text",
      autocomplete: "off",
      spellcheck: "false",
      "aria-label": label,
      class: "wbx-txt",
      style: width ? { width: `${width}px` } : null,
    });
    MWB.guard(input);
    const commit = () => onCommit(input);
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        commit();
        input.blur();
      }
    });
    return input;
  };

  /** A 44px-target button that never starts an object drag. */
  MWB.btn = (text, label, onClick, cls) => {
    const b = MWB.h(
      "button",
      { type: "button", class: `wbx-btn${cls ? ` ${cls}` : ""}`, "aria-label": label || text },
      text,
    );
    MWB.guard(b);
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick(e);
    });
    return b;
  };

  MWB.live = (host) => {
    const p = MWB.h("p", { class: "wbx-live", role: "status", "aria-live": "polite" });
    host.appendChild(p);
    return (msg) => {
      p.textContent = msg;
    };
  };
})(window);
