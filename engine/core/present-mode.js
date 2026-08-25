// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// One job: put the lesson on the board. Pressing Present turns the current
// lesson into a projector view (section rail, big type, arrow/keyboard nav) and
// asks the browser for real fullscreen, so whatever the teacher's machine is
// projecting — smartboard, TV, second display — shows the lesson and nothing
// else. Esc or the same button exits.
//
// This module is the ONLY Presenter implementation. A second copy used to live
// in assets/learning-supports/learning-supports.js; because that script is a
// plain `defer` tag it mounted first and won the `#nt-present-widget` id race
// on every interactive lesson, so `mountPresentWidget()` here bailed out and
// Present Mode was unreachable on those pages. It was removed — do not re-add.
//
// There is deliberately no getDisplayMedia "screen share". Capturing the
// teacher's own screen and replaying it in an overlay on that same screen is a
// mirror pointed at itself, and it never transmitted anything to student
// devices. The projector already shows the screen; fullscreen is the fix.

import {
  clearVeils,
  injectStyles as injectSmallGroupPresentStyles,
  isSmallGroupStudio,
  smallGroupBeats,
} from "./small-group-present.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

const MINIMIZED_KEY = "nt-present-widget-minimized";

export function isTeacherModeActive() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("student") === "1" || params.get("teacher") === "0") return false;
    return (
      localStorage.getItem("nt-teacher-mode") === "1" ||
      document.body.classList.contains("teacher-mode") ||
      document.body.classList.contains("sg-is-teacher")
    );
  } catch {
    return false;
  }
}

// Fullscreen is best-effort: it needs a user gesture and some kiosk/managed
// browsers refuse it outright. Present Mode must still work without it, so
// every failure here is swallowed — the projector view is the real payload.
async function enterFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req || document.fullscreenElement) return;
  try {
    await req.call(el, { navigationUI: "hide" });
  } catch (_) {
    /* denied or unsupported — presentation view still applies */
  }
}

function exitFullscreen() {
  if (!document.fullscreenElement) return;
  try {
    (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
  } catch (_) {
    /* already exiting */
  }
}

function showPresentNotice(msg) {
  const existing = document.getElementById("nt-present-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "nt-present-toast";
  toast.className = "nt-present-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Set by initPresentMode so the widget (which may mount first) can drive it.
let presentToggle = () => document.dispatchEvent(new CustomEvent("nt:present-deck-toggle"));

export function mountPresentWidget({ container } = {}) {
  if (document.getElementById("nt-present-widget")) return;
  if (!isTeacherModeActive()) return;

  // initPresentMode() ends by calling this function, so a caller that reaches
  // us first (small-group-renderer) re-enters through that tail call. The inner
  // pass builds the widget, so re-check the guard here or we append a second,
  // identical bar on top of the first.
  initPresentMode({});
  if (document.getElementById("nt-present-widget")) return;

  let minimized = false;
  try {
    minimized = localStorage.getItem(MINIMIZED_KEY) === "1";
  } catch (_) {}

  const widget = document.createElement("div");
  widget.id = "nt-present-widget";
  widget.className = `nt-present-widget ${minimized ? "is-minimized" : ""}`;

  function renderWidgetContent() {
    const on = document.body.classList.contains("nt-present");
    if (minimized) {
      widget.innerHTML = `
        <button type="button" class="nt-present-btn-mini" title="Expand Presenter Controls (Alt+Shift+P)" aria-label="Expand Presenter Controls">
          <span>📽️ Present</span>
          <span class="nt-present-expand-icon">⤢</span>
        </button>`;
      widget.querySelector(".nt-present-btn-mini").onclick = () => setMinimized(false);
      return;
    }

    widget.innerHTML = `
      <div class="nt-present-bar">
        <span class="nt-present-label">👩‍🏫 Presenter</span>
        <button type="button" class="nt-present-act-btn ${on ? "is-presenting" : ""}"
                title="${on ? "Leave Present Mode (Esc)" : "Show this lesson full screen on the board"}">
          <span data-pm-toggle-label>${on ? "⏹ Exit Present" : "📽️ Present"}</span>
        </button>
        <button type="button" class="nt-present-min-btn" title="Minimize Bar" aria-label="Minimize Present Bar">
          <span>🗕</span>
        </button>
      </div>`;

    widget.querySelector(".nt-present-act-btn").onclick = () => presentToggle();
    widget.querySelector(".nt-present-min-btn").onclick = () => setMinimized(true);
  }

  function setMinimized(val) {
    minimized = val;
    try {
      localStorage.setItem(MINIMIZED_KEY, val ? "1" : "0");
    } catch (_) {}
    widget.classList.toggle("is-minimized", val);
    renderWidgetContent();
  }

  renderWidgetContent();
  (container || document.body).appendChild(widget);

  // Keep the button label in step with Present Mode however it was entered
  // (Tools ▸ Present, ?present=1, Esc, the browser's own fullscreen exit).
  document.addEventListener("nt:present-state", renderWidgetContent);

  // Keyboard shortcut Alt+Shift+P toggles minimize/expand
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && e.code === "KeyP" && isTeacherModeActive()) {
      e.preventDefault();
      setMinimized(!minimized);
    }
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "nt-teacher-mode") {
      widget.style.display = isTeacherModeActive() ? "" : "none";
    }
  });
}

let pmInitialized = false;

export function initPresentMode({ app, phaseConfigs, state } = {}) {
  if (pmInitialized && !app && !phaseConfigs) return;
  pmInitialized = true;

  let active = false;
  let current = 0;
  let rail = null;
  let nav = null;

  function getParts() {
    // 1. Small-group lessons drive their sections from a real tablist. Match
    //    `[role=tab]` only — the old `[id^='sg-tab-']` selector also caught the
    //    six `.sg-tabpanel` elements (ids `sg-tab-vocab`, `sg-tab-learn`, …),
    //    which doubled the rail and pasted whole panels in as slide titles.
    //
    //    One stop per tab is not a lesson a teacher can lead: "Learn It" holds
    //    the diagnostic, the pulse card, the scene and two labs, so that stop
    //    was a whole scrolling page. small-group-present.js splits each tab into
    //    the beats a teacher actually paces — one word, one step, one problem —
    //    and falls back to the per-tab list if a studio renders no beats.
    const sgTabs = [...document.querySelectorAll('.sg-tabs [role="tab"]')];
    if (sgTabs.length > 0) {
      const beats = smallGroupBeats(document);
      if (beats.length) return beats;
      return sgTabs.map((btn, i) => {
        const label = (btn.querySelector(".lbl") || btn).textContent.trim().replace(/\s+/g, " ");
        return {
          title: `${i + 1} · ${label || `Part ${i + 1}`}`,
          activate: () => btn.click(),
        };
      });
    }

    // 2. Check for Phase Configs. Each Act renders as an in-page step strip
    //    (renderActSteps), so "one stop per Act" would project a stop whose
    //    other steps are hidden panels the audience can never see. The MOUNTED
    //    phase therefore contributes one stop per step (activating a stop
    //    clicks its chip); the phases not yet in the DOM contribute one stop
    //    each, and navigating to one rebuilds the rail so its steps appear.
    if (phaseConfigs && phaseConfigs.length > 0) {
      const parts = [];
      const mountedPhase = state?.get?.().currentPhase;
      const goToPhase = (i) => {
        if (app?.navigateTo) app.navigateTo(i);
        document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: i } }));
        // The new phase brings its own step strip; let it mount, then rebuild
        // the rail so the arrows walk its steps instead of skipping them.
        setTimeout(() => {
          renderRailContent();
          if (nav) {
            const fresh = getParts();
            nav.querySelector(".pm-count").textContent = `${current + 1} / ${fresh.length}`;
          }
        }, 350);
      };
      phaseConfigs.forEach((p, i) => {
        const base = `${i + 1} · ${p?.name || `Part ${i + 1}`}`;
        const chips = i === mountedPhase ? [...document.querySelectorAll(".act-step-chip")] : [];
        if (chips.length) {
          chips.forEach((chip) => {
            const label = chip.textContent
              .trim()
              .replace(/\s+/g, " ")
              .replace(/^\d+\s*/, "");
            parts.push({ title: `${base} — ${label}`, activate: () => chip.click() });
          });
        } else {
          parts.push({ title: base, activate: () => goToPhase(i) });
        }
      });
      return parts;
    }

    // 3. Fallback: check DOM for .phase elements
    const phases = document.querySelectorAll(".phase-container .phase, #app .phase");
    if (phases.length > 0) {
      return [...phases].map((ph, i) => {
        const h = ph.querySelector("h2, h3, .phase-title, .card-title");
        const title = h ? h.textContent.trim() : `Part ${i + 1}`;
        return {
          title: `${i + 1} · ${title}`,
          activate: () => {
            if (app?.navigateTo) app.navigateTo(i);
            document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: i } }));
          },
        };
      });
    }

    // 4. Default: single full-lesson presentation view
    return [
      {
        title: "1 · Lesson Presentation",
        activate: () => {},
      },
    ];
  }

  function show(n) {
    if (!active) return;
    const parts = getParts();
    if (!parts.length) return;
    current = Math.max(0, Math.min(parts.length - 1, n));

    parts[current].activate();

    if (rail) {
      rail.querySelectorAll(".pm-rail-phase").forEach((b, i) => {
        b.classList.toggle("pm-sel", i === current);
        b.setAttribute("aria-selected", i === current ? "true" : "false");
      });
    }

    if (nav) {
      nav.querySelector(".pm-count").textContent = `${current + 1} / ${parts.length}`;
      nav.querySelector("[data-pm-prev]").disabled = current === 0;
      nav.querySelector("[data-pm-next]").disabled = current === parts.length - 1;
    }

    // A full lesson's phase IS the page, so the top is the right place to land.
    // A studio's beat is one card inside a long panel: scrolling to the top
    // would show the hero card instead of the thing the teacher just selected,
    // so the beat scrolls itself into view (small-group-present.js focus()).
    if (!isSmallGroupStudio()) window.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderRailContent() {
    if (!rail) return;
    const parts = getParts();
    const phaseListHtml = parts
      .map(
        (p, i) =>
          `<button type="button" class="pm-rail-phase ${i === current ? "pm-sel" : ""}" data-pm-goto="${i}">${esc(p.title)}</button>`,
      )
      .join("");

    rail.innerHTML = `
      <div class="pm-rail-head">Presenting</div>
      <div class="pm-rail-phases">${phaseListHtml}</div>
      <button type="button" class="pm-exit" data-pm-exit>✕ Exit (Esc)</button>`;

    rail
      .querySelectorAll("[data-pm-goto]")
      .forEach((b) => b.addEventListener("click", () => show(+b.dataset.pmGoto)));
    rail.querySelector("[data-pm-exit]").addEventListener("click", () => setActive(false));
  }

  function buildChrome() {
    if (document.querySelector(".pm-rail")) return;

    rail = document.createElement("aside");
    rail.className = "pm-rail";
    rail.setAttribute("aria-label", "Presentation sections");
    document.body.append(rail);

    nav = document.createElement("div");
    nav.className = "pm-nav";
    nav.innerHTML = `
      <button type="button" class="pm-arrow" data-pm-prev aria-label="Previous section">←</button>
      <span class="pm-count" aria-live="polite"></span>
      <button type="button" class="pm-arrow" data-pm-next aria-label="Next section">→</button>`;
    nav.querySelector("[data-pm-prev]").addEventListener("click", () => show(current - 1));
    nav.querySelector("[data-pm-next]").addEventListener("click", () => show(current + 1));
    document.body.append(nav);
  }

  function setActive(on) {
    if (on === active) return;
    active = on;
    document.body.classList.toggle("nt-present", on);
    if (on) {
      // A studio carries its own presenting styles (present-mode.css is not in
      // the small-group bundle). Injected on entry rather than at mount so a
      // studio nobody presents never pays for them.
      if (isSmallGroupStudio()) injectSmallGroupPresentStyles();
      if (!rail) buildChrome();
      renderRailContent();
      // A studio has no phase state; its beats always start at the beginning.
      const phaseIdx = isSmallGroupStudio() ? 0 : (state?.get?.()?.currentPhase ?? 0);
      show(phaseIdx);
      enterFullscreen();
    } else {
      // Hand the studio back exactly as it was found. The veil class is inert
      // outside `body.nt-present`, so this is belt-and-braces — but leaving
      // stray state on a page a student may later open is not worth the risk.
      clearVeils();
      exitFullscreen();
      if (rail) {
        rail.remove();
        rail = null;
      }
      if (nav) {
        nav.remove();
        nav = null;
      }
    }
    document
      .querySelectorAll("[data-pm-toggle-label]")
      .forEach((el) => (el.textContent = on ? "⏹ Exit Present" : "📽️ Present"));
    document.dispatchEvent(new CustomEvent("nt:present-state", { detail: { active: on } }));
  }

  presentToggle = () => setActive(!active);

  // Leaving fullscreen via F11 / the browser's own Esc must also drop the
  // projector view, or the teacher is left in a half-presenting state.
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && active) setActive(false);
  });

  if (app?.renderPhase) {
    const origRenderPhase = app.renderPhase.bind(app);
    app.renderPhase = (index, renderFn) => {
      origRenderPhase(index, renderFn);
      if (active) renderRailContent();
    };
  }

  document.addEventListener("keydown", (e) => {
    if (!active || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (document.documentElement.classList.contains("nt-extra-fullpage-open")) return;
    if (e.key === "ArrowRight" || e.key === "Space") show(current + 1);
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "Escape") setActive(false);
  });

  document.addEventListener("nt:present-deck-toggle", () => {
    setActive(!active);
  });

  // Present lives on the page itself (the present widget below) — it used to
  // ALSO sit in the Tools menu, which is not where a teacher reaches for it
  // mid-class.
  if (new URLSearchParams(window.location.search).get("present") === "1") {
    const tick = setInterval(() => {
      if (document.querySelector(".phase") || document.querySelector(".sg-tabs")) {
        clearInterval(tick);
        setActive(true);
      }
    }, 400);
    setTimeout(() => clearInterval(tick), 60000);
  }

  mountPresentWidget();
}

export { showPresentNotice };
export default initPresentMode;
