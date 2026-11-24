/* Forecast Engine — shared interface helpers.
 * Everything a view needs to draw consistent controls, badges, dialogs and
 * explanations. Loaded first; creates the window.NFE namespace. */
(() => {
  "use strict";
  const NFE = (window.NFE = window.NFE || {});
  NFE.S = window.NFEStats;
  NFE.M = window.NFEModel;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
  NFE.$ = $;
  NFE.$$ = $$;
  NFE.esc = esc;

  /* ── Number formatting ──────────────────────────────────────────────── */
  const num = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : "–");
  NFE.fmt = {
    num,
    pct: (v, d = 0) => (Number.isFinite(v) ? `${num(v, d)}%` : "–"),
    chance: (p) => (p < 0.01 ? "<1%" : p > 0.99 ? ">99%" : `${Math.round(p * 100)}%`),
    signed: (v, d = 1) =>
      Number.isFinite(v) ? `${v > 0 ? "+" : v < 0 ? "−" : ""}${num(Math.abs(v), d)}` : "–",
    date: (iso) => {
      const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
      return Number.isNaN(d.getTime())
        ? String(iso)
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    },
    plural: (n, one, many) => `${n} ${n === 1 ? one : many || `${one}s`}`,
  };

  /* ── Icons (24px grid, stroke only, drawn to inherit colour) ────────── */
  const PATHS = {
    overview: "M4 13h6V4H4zm10 7h6V4h-6zM4 20h6v-3H4z",
    data: "M5 7c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zm0 0v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3",
    forecast: "M3 17l5-6 4 3 8-9M16 5h4v4",
    scenarios: "M6 4v16M6 8c4-3 8 3 12 0v8c-4 3-8-3-12 0",
    analysis: "M4 20V10m5 10V4m5 16v-7m5 7V8",
    groups:
      "M9 11a3 3 0 100-6 3 3 0 000 6zm7 1a2.5 2.5 0 100-5M3 20c0-3 2.7-5 6-5s6 2 6 5m2-4c2.5 0 5 1.3 5 4",
    reports: "M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6",
    settings:
      "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3l1.6-1-1.8-3.1-1.9.6a7 7 0 00-1.8-1L15 5h-3.6l-.5 2.5a7 7 0 00-1.8 1l-1.9-.6L5 11l1.6 1a7 7 0 000 2l-1.6 1 1.8 3.1 1.9-.6a7 7 0 001.8 1l.5 2.5H15l.5-2.5a7 7 0 001.8-1l1.9.6 1.8-3.1-1.6-1a7 7 0 000-2z",
    check: "M5 12.5l4.5 4.5L19 7.5",
    alert: "M12 4l9 16H3zM12 10v4m0 3v.01",
    cross: "M6 6l12 12M18 6L6 18",
    dot: "M12 8a4 4 0 100 8 4 4 0 000-8z",
    up: "M12 19V6m-6 6l6-6 6 6",
    down: "M12 5v13m-6-6l6 6 6-6",
    flat: "M5 12h14m-5-5l5 5-5 5",
    print: "M7 9V3h10v6M7 17H4v-6h16v6h-3M7 14h10v7H7z",
    download: "M12 4v11m-5-5l5 5 5-5M5 20h14",
    copy: "M9 9h10v11H9zM5 15V4h10",
    help: "M9.5 9a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.5M12 17v.01M12 3a9 9 0 100 18 9 9 0 000-18z",
    sun: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
    moon: "M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z",
    plus: "M12 5v14M5 12h14",
    trash: "M5 7h14M10 7V4h4v3m-8 0l1 13h8l1-13",
    undo: "M9 7L4 12l5 5M4 12h10a5 5 0 010 10",
    upload: "M12 16V5m-5 5l5-5 5 5M5 20h14",
    play: "M8 5l11 7-11 7z",
    dice: "M5 5h14v14H5zM9 9v.01M15 15v.01M12 12v.01M9 15v.01M15 9v.01",
  };
  NFE.icon = (name, size = 18) =>
    `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${PATHS[name] || PATHS.dot}"/></svg>`;

  /* ── Badges: colour is never the only signal (icon + word) ──────────── */
  const KIND_ICON = {
    on: "check",
    ok: "check",
    watch: "alert",
    warn: "alert",
    support: "cross",
    bad: "cross",
    info: "dot",
    none: "dot",
    neutral: "dot",
  };
  NFE.badge = (kind, text) =>
    `<span class="badge ${kind}">${NFE.icon(KIND_ICON[kind] || "dot", 14)}${esc(text)}</span>`;
  NFE.statusBadge = (f) => NFE.badge(f.status, f.statusLabel);
  const TREND = {
    up: ["up", "Improving", "up"],
    down: ["down", "Slipping", "down"],
    flat: ["flat", "Steady", "flat"],
    unclear: ["flat", "Too few scores", "flat"],
  };
  NFE.trendChip = (f) => {
    const [ic, label, cls] = TREND[f.trend] || TREND.unclear;
    return `<span class="trend ${cls}">${NFE.icon(ic, 14)}${label}</span>`;
  };

  /* ── Explanations ───────────────────────────────────────────────────── */
  /** A collapsed "what is this" box. Plain words first, then what to try. */
  NFE.how = (what, tryIt, watch) =>
    `<details class="how"><summary>${NFE.icon("help", 16)}How this works</summary><div class="how-body"><p>${what}</p>${
      tryIt ? `<p><strong>Try this:</strong> ${tryIt}</p>` : ""
    }${watch ? `<p><strong>Keep in mind:</strong> ${watch}</p>` : ""}</div></details>`;
  NFE.say = (html) => `<p class="say">${html}</p>`;
  NFE.empty = (title, body, action) =>
    `<div class="empty"><h3>${esc(title)}</h3><p>${esc(body)}</p>${action || ""}</div>`;

  /* ── Controls ───────────────────────────────────────────────────────── */
  /** Labelled slider bound to a state path through data-set. */
  NFE.slider = ({ path, label, min, max, step = 1, value, unit = "", help = "", fmt }) =>
    `<label class="ctl"><span class="ctl-top"><span class="ctl-name">${esc(label)}</span><output data-out="${path}" data-unit="${esc(unit)}">${esc(fmt ? fmt(value) : `${value}${unit}`)}</output></span><input type="range" data-set="${path}" min="${min}" max="${max}" step="${step}" value="${value}">${
      help ? `<span class="ctl-help">${help}</span>` : ""
    }</label>`;
  NFE.segmented = ({ path, label, options, value, help = "" }) =>
    `<fieldset class="ctl seg"><legend class="ctl-name">${esc(label)}</legend><div class="seg-row" role="radiogroup">${options
      .map(
        ([v, text]) =>
          `<label class="seg-opt"><input type="radio" name="seg-${path}" data-set="${path}"${typeof v === "number" ? ' data-num="1"' : ""} value="${esc(v)}"${String(v) === String(value) ? " checked" : ""}><span>${esc(text)}</span></label>`,
      )
      .join("")}</div>${help ? `<span class="ctl-help">${help}</span>` : ""}</fieldset>`;
  NFE.select = ({ id, label, options, value, set }) =>
    `<label class="field"><span class="ctl-name">${esc(label)}</span><select id="${id}"${set ? ` data-set="${set}"` : ""}>${options
      .map(
        ([v, t]) =>
          `<option value="${esc(v)}"${String(v) === String(value) ? " selected" : ""}>${esc(t)}</option>`,
      )
      .join("")}</select></label>`;

  const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  const setPath = (obj, path, v) => {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
    target[last] = v;
  };
  NFE.getPath = getPath;
  /**
   * Wire every [data-set] control under root to the state: the label updates
   * while dragging and `onChange(path)` runs once per animation frame.
   */
  NFE.bind = (root, state, onChange) => {
    let frame = 0;
    root.addEventListener("input", (e) => {
      const el = e.target.closest("[data-set]");
      if (!el || (el.type === "radio" && !el.checked)) return;
      const path = el.dataset.set;
      const numeric = el.type === "range" || el.type === "number" || el.dataset.num === "1";
      setPath(state(), path, numeric ? Number(el.value) : el.value);
      const out = root.querySelector(`[data-out="${path}"]`);
      if (out) out.textContent = `${el.value}${out.dataset.unit || ""}`;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => onChange(path));
    });
  };

  /* ── Dialogs and toasts (never a native alert) ──────────────────────── */
  function dialogBase(html) {
    const dlg = document.createElement("dialog");
    dlg.className = "dlg";
    dlg.innerHTML = html;
    document.body.appendChild(dlg);
    dlg.addEventListener("close", () => dlg.remove());
    dlg.showModal();
    return dlg;
  }
  NFE.confirm = (message, { ok = "Continue", danger = false, title = "Please confirm" } = {}) =>
    new Promise((resolve) => {
      const dlg = dialogBase(
        `<form method="dialog"><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="dlg-actions"><button class="btn" value="no">Cancel</button><button class="btn ${danger ? "danger" : "primary"}" value="yes" autofocus>${esc(ok)}</button></div></form>`,
      );
      dlg.addEventListener("close", () => resolve(dlg.returnValue === "yes"));
    });
  NFE.notice = (title, html) =>
    new Promise((resolve) => {
      const dlg = dialogBase(
        `<form method="dialog"><h2>${esc(title)}</h2><div class="dlg-body">${html}</div><div class="dlg-actions"><button class="btn primary" autofocus>Got it</button></div></form>`,
      );
      dlg.addEventListener("close", resolve);
    });
  let toastTimer = 0;
  NFE.toast = (message, { action, onAction } = {}) => {
    const host = $("#toast");
    if (!host) return;
    host.innerHTML = `<span>${esc(message)}</span>${action ? `<button class="btn small" type="button">${esc(action)}</button>` : ""}`;
    host.classList.add("show");
    const btn = host.querySelector("button");
    if (btn)
      btn.onclick = () => {
        host.classList.remove("show");
        if (onAction) onAction();
      };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => host.classList.remove("show"), action ? 9000 : 3500);
  };

  /* ── Download / clipboard ───────────────────────────────────────────── */
  NFE.download = (name, text, type) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  NFE.copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand("copy");
      t.remove();
      return ok;
    }
  };
  NFE.csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
})();
