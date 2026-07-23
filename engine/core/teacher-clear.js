// teacher-clear.js — a teacher-only, compact "Clear answers" control. Mounted
// from BOTH lesson renderers (createApp Reveal lessons and the small-group /
// catch-up studios) so every curriculum lesson gets the same control. It only
// renders in teacher mode; a student never sees it and can never erase work.
//
// The control is a small round 🧹 icon (bottom-LEFT, above the minimap) that
// stays out of the way. Tapping it opens a compact popover so a teacher can:
//   • clear just the CURRENT page, or any set of pages (checkboxes), or
//   • clear ALL pages at once.
// Clearing pages wipes THIS device's saved answers for the chosen page(s) and
// re-renders them blank — so a teacher can project a fresh copy without last
// period's (or their own demo) responses showing — without nuking the whole
// lesson.
//
// The caller passes an API. Two shapes are accepted:
//   • a function  → treated as clearAll (used by the cover screen + studios,
//     which have no per-page model yet); the popover then offers a single
//     "Clear all answers" action.
//   • an object { phases(), currentPhase(), clearPages(indices), clearAll() }
//     → the full per-page picker (used once a Reveal lesson is entered).
//
// Teacher-mode detection is inlined (not imported from teacher-mode.js) so this
// shared module stays dependency-light: teacher-mode.js pulls in the whole
// lesson-renderer/app graph, which would drag app.js's Vite-only aliases into
// the small-group renderer's module graph and break its node-run test. The key
// `nt-teacher-mode` is the documented single source of truth (see
// teacher-mode.js / assets/curriculum-enhancements.js); this only reads it.

function isTeacherMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    // Force-student wins, mirroring teacher-mode.js.
    if (params.get("teacher") === "0" || params.get("student") === "1") return false;
    return localStorage.getItem("nt-teacher-mode") === "1";
  } catch (_) {
    return false;
  }
}

// Normalize the two accepted API shapes into one object.
function normalizeApi(api) {
  if (typeof api === "function") {
    return { hasPages: false, clearAll: api };
  }
  if (api && typeof api === "object") {
    const phases = typeof api.phases === "function" ? api.phases() : [];
    return {
      hasPages: Array.isArray(phases) && phases.length > 0 && typeof api.clearPages === "function",
      phases: Array.isArray(phases) ? phases : [],
      currentPhase: typeof api.currentPhase === "function" ? api.currentPhase() : 0,
      clearPages: api.clearPages,
      clearAll: typeof api.clearAll === "function" ? api.clearAll : () => window.location.reload(),
    };
  }
  return { hasPages: false, clearAll: () => window.location.reload() };
}

export function mountTeacherClearButton(api) {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (!isTeacherMode()) return null;
  // A richer per-page API replaces an earlier clear-all-only button (the cover
  // screen mounts one before phases exist; entering the lesson upgrades it).
  const existing = document.querySelector(".nt-teacher-clear");
  const info = normalizeApi(api);
  if (existing) {
    if (info.hasPages && existing.dataset.hasPages !== "1") existing.remove();
    else return existing;
  }

  const wrap = document.createElement("div");
  wrap.className = "nt-teacher-clear";
  wrap.dataset.hasPages = info.hasPages ? "1" : "0";

  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "nt-teacher-clear-fab";
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-label", "Clear answers (teacher only)");
  fab.title = "Clear answers on this lesson (teacher only)";
  fab.innerHTML = '<span aria-hidden="true">🧹</span>';

  const pop = document.createElement("div");
  pop.className = "nt-teacher-clear-pop";
  pop.hidden = true;

  if (info.hasPages) {
    buildPagePicker(pop, info, close);
  } else {
    buildClearAll(pop, info, close);
  }

  fab.addEventListener("click", () => (pop.hidden ? open() : close()));
  wrap.append(fab, pop);
  document.body.appendChild(wrap);

  function open() {
    pop.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey, true);
  }
  function close() {
    pop.hidden = true;
    fab.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocClick, true);
    document.removeEventListener("keydown", onKey, true);
  }
  function onDocClick(e) {
    if (!wrap.contains(e.target)) close();
  }
  function onKey(e) {
    if (e.key === "Escape") {
      close();
      fab.focus();
    }
  }

  return wrap;
}

function buildPagePicker(pop, info, close) {
  const title = document.createElement("p");
  title.className = "nt-teacher-clear-title";
  title.textContent = "Clear answers";
  const sub = document.createElement("p");
  sub.className = "nt-teacher-clear-sub";
  sub.textContent = "This device only. Pick the page(s) to reset.";

  const list = document.createElement("div");
  list.className = "nt-teacher-clear-list";
  info.phases.forEach((ph) => {
    const label = document.createElement("label");
    label.className = "nt-teacher-clear-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = String(ph.index);
    if (ph.index === info.currentPhase) cb.checked = true;
    const txt = document.createElement("span");
    txt.innerHTML = `<span aria-hidden="true">${ph.icon || ""}</span> ${escapeHtml(ph.name || `Page ${ph.index + 1}`)}`;
    label.append(cb, txt);
    list.appendChild(label);
  });

  const actions = document.createElement("div");
  actions.className = "nt-teacher-clear-actions";

  const clearSel = document.createElement("button");
  clearSel.type = "button";
  clearSel.className = "nt-teacher-clear-do";
  clearSel.textContent = "Clear selected pages";
  clearSel.addEventListener("click", () => {
    const indices = [...list.querySelectorAll("input:checked")].map((c) => Number(c.value));
    if (!indices.length) {
      sub.textContent = "Check at least one page first.";
      return;
    }
    const names = info.phases
      .filter((p) => indices.includes(p.index))
      .map((p) => p.name)
      .join(", ");
    if (!window.confirm(`Clear answers on: ${names}? This only affects this device.`)) return;
    try {
      info.clearPages(indices);
    } catch (_) {
      window.location.reload();
    }
    close();
  });

  const clearAll = document.createElement("button");
  clearAll.type = "button";
  clearAll.className = "nt-teacher-clear-do nt-teacher-clear-all";
  clearAll.textContent = "Clear all pages";
  clearAll.addEventListener("click", () => {
    if (
      !window.confirm(
        "Clear ALL answers on this lesson and reload it fresh? This only affects this device.",
      )
    )
      return;
    try {
      info.clearAll();
    } catch (_) {
      window.location.reload();
    }
    close();
  });

  const snapLink = document.createElement("a");
  snapLink.href = "/teacher-tools/live-snapshot/";
  snapLink.target = "_blank";
  snapLink.rel = "noopener";
  snapLink.className = "nt-teacher-clear-sub";
  snapLink.style.cssText = "display:block; margin-top:10px; font-weight:800; color:#0f6d78; text-decoration:none;";
  snapLink.textContent = "📊 Open Live Class Snapshot & Small Groups ↗";

  actions.append(clearSel, clearAll);
  pop.append(title, sub, list, actions, snapLink);
}

function buildClearAll(pop, info, close) {
  const title = document.createElement("p");
  title.className = "nt-teacher-clear-title";
  title.textContent = "Clear answers";
  const sub = document.createElement("p");
  sub.className = "nt-teacher-clear-sub";
  sub.textContent = "Reset this lesson to blank on this device?";

  const actions = document.createElement("div");
  actions.className = "nt-teacher-clear-actions";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nt-teacher-clear-do nt-teacher-clear-all";
  btn.textContent = "Clear all answers";
  btn.addEventListener("click", () => {
    if (
      !window.confirm(
        "Clear the answers on this lesson and reload it fresh? This only affects this device.",
      )
    )
      return;
    try {
      info.clearAll();
    } catch (_) {
      window.location.reload();
    }
    close();
  });
  actions.appendChild(btn);
  pop.append(title, sub, actions);
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}
