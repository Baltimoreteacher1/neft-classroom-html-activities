// Language Studio Player — shared helpers for the self-checking game kinds (agent G).
// Not a kind itself: match.js, word_sort.js, cloze.js ... import from here. Imports only the shell's studio-core.js.
import { h, reducedMotion, ttsAvailable } from "../studio-core.js";

export { h };

const ICONS = {
  speaker:
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  up: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="m5 12 5-5 5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  grip: '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><g fill="currentColor"><circle cx="7" cy="5" r="1.6"/><circle cx="13" cy="5" r="1.6"/><circle cx="7" cy="10" r="1.6"/><circle cx="13" cy="10" r="1.6"/><circle cx="7" cy="15" r="1.6"/><circle cx="13" cy="15" r="1.6"/></g></svg>',
  check:
    '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="m4 10.5 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cross:
    '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};

/** Inline SVG icon (constant markup only, never student text). */
export function icon(name) {
  const span = h("span", { class: "sg-ico", "aria-hidden": "true" });
  span.innerHTML = ICONS[name] || "";
  return span;
}

/** Stars: 3 = mostly first try, 2 = some retries, 1 = finished with support. */
export function starsOf(misses, total) {
  const r = total > 0 ? misses / total : 0;
  return r <= 0.2 ? 3 : r <= 0.55 ? 2 : 1;
}

export const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

/** Shuffle that never returns the authored order (for ordering games). */
export function shuffleNotSame(ctx, array, seed) {
  let out = ctx.shuffle(array, seed);
  let n = 0;
  while (array.length > 1 && out.every((v, i) => v === array[i]) && n < 5)
    out = ctx.shuffle(array, `${seed}#${++n}`);
  if (array.length > 1 && out.every((v, i) => v === array[i])) out = [...array.slice(1), array[0]];
  return out;
}

/** Keep keyboard focus on the same logical control across a re-render (nodes carry data-key). */
export function withFocus(root, fn) {
  const active = document.activeElement;
  const key = active && root.contains(active) ? active.closest("[data-key]")?.dataset.key : null;
  fn();
  if (key) root.querySelector(`[data-key="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
}

/** Per-mount helpers: timers, feedback line, meter, progress dots, speak button, finish. */
export function createKit(root, ctx, kind) {
  const timers = new Set();
  const cleanups = [];
  root.classList.add("sg", `sg--${kind}`);
  const reduced = reducedMotion();
  const vocab = ctx.studio?.vocab || [];

  const kit = {
    reduced,
    seed: `${kind}:${ctx.activity?.title || ""}`,
    hintAfter: { l1_2: 1, l3_4: 2, l5_6: 3 }[ctx.level] ?? 2,
    later(fn, ms) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    },
    onCleanup(fn) {
      cleanups.push(fn);
    },
    /** Put the feedback line right under the top bar so it stays in view (sticky). */
    dock(el) {
      root.querySelector(".sg-topbar")?.after(el);
    },
    destroy() {
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
      for (const fn of cleanups.splice(0)) fn();
    },
    /** Find the vocab entry for a displayed word (tolerant of case and plurals). */
    vocabFor(text) {
      const t = String(text).trim().toLowerCase();
      return (
        vocab.find((v) => v.term.toLowerCase() === t) ||
        vocab.find(
          (v) =>
            t.length > 3 &&
            (t.startsWith(v.term.toLowerCase()) || v.term.toLowerCase().startsWith(t)),
        )
      );
    },
    /** Play a one-shot CSS animation class (skipped under reduced motion). */
    fx(el, cls) {
      if (!el || reduced) return;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      kit.later(() => el.classList.remove(cls), 700);
    },
    /** Feedback line: shows the idle hint until something happens. tone: "ok" | "no" | "hint". Announced to screen readers. */
    feedback(idleText = "") {
      const el = h("p", { class: "st-feedback sg-feedback" });
      const api = {
        el,
        idleText,
        set(msg, tone = "hint") {
          if (!msg) {
            el.className = `st-feedback sg-feedback sg-feedback--idle${api.idleText ? "" : " is-none"}`;
            el.textContent = api.idleText;
            return;
          }
          el.className = `st-feedback sg-feedback${tone === "ok" ? " st-feedback--ok" : tone === "no" ? " st-feedback--no" : ""}`;
          el.textContent = msg;
          ctx.announce(msg);
        },
        idle(text) {
          api.idleText = text;
          if (el.classList.contains("sg-feedback--idle")) api.set("");
        },
      };
      api.set("");
      return api;
    },
    /**
     * Three-step hint ladder: a nudge, then a way to think it through, then a worked example.
     * Student-controlled, announced, and never the answer itself. `steps` may be a function so a kind
     * can build hints from the item the student is on right now.
     */
    hints(steps) {
      const list = h("ol", { class: "sg-hints__list" });
      const btn = h("button", {
        type: "button",
        class: "st-btn st-btn--ghost st-btn--sm sg-hints__btn",
        "data-key": "hint",
      });
      let shown = 0;
      const paint = () => {
        btn.textContent =
          shown === 0
            ? "Need a hint?"
            : shown >= steps().length
              ? "That is every hint"
              : "One more hint";
        btn.disabled = shown > 0 && shown >= steps().length;
        btn.setAttribute("aria-expanded", String(shown > 0));
      };
      btn.addEventListener("click", () => {
        const all = steps();
        if (shown >= all.length) return;
        const text = all[shown];
        shown++;
        list.append(h("li", { class: "sg-hints__item" }, h("b", { text: `Hint ${shown}. ` }), text));
        ctx.announce(`Hint ${shown} of ${all.length}. ${text}`);
        paint();
      });
      paint();
      return h("div", { class: "sg-hints" }, btn, list);
    },
    /** "n of total" meter with a bar. */
    meter(total, label) {
      const bar = h("span", { class: "sg-meter__bar" });
      const text = h("span", { class: "sg-meter__text" });
      const el = h(
        "div",
        {
          class: "sg-meter",
          role: "progressbar",
          "aria-label": label,
          "aria-valuemin": "0",
          "aria-valuemax": String(total),
        },
        h("span", { class: "sg-meter__track", "aria-hidden": "true" }, bar),
        text,
      );
      return {
        el,
        set(n) {
          el.setAttribute("aria-valuenow", String(n));
          el.style.setProperty("--sg-p", String(total ? n / total : 0));
          text.textContent = `${n} of ${total}`;
        },
      };
    },
    /** Row of progress dots; states: "" | "now" | "ok" | "miss". */
    dots(total, label) {
      const items = Array.from({ length: total }, () => h("span", { class: "sg-dot" }));
      const el = h("div", { class: "sg-dots", role: "img", "aria-label": label }, ...items);
      return {
        el,
        set(i, state) {
          if (items[i]) items[i].className = `sg-dot${state ? ` is-${state}` : ""}`;
        },
        label(text) {
          el.setAttribute("aria-label", text);
        },
        resize(n) {
          el.replaceChildren();
          items.length = 0;
          for (let i = 0; i < n; i++) {
            const d = h("span", { class: "sg-dot" });
            items.push(d);
            el.append(d);
          }
        },
      };
    },
    /** Small "listen" button; null when speech is unavailable. */
    speakBtn(text, label) {
      if (!ttsAvailable()) return null;
      const btn = h(
        "button",
        {
          type: "button",
          class: "st-btn st-btn--ghost st-btn--sm sg-speak",
          "aria-label": label || `Listen: ${text}`,
        },
        icon("speaker"),
      );
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        btn.classList.add("is-speaking");
        Promise.resolve(ctx.tts(text))
          .catch(() => {})
          .finally(() => btn.classList.remove("is-speaking"));
      });
      return btn;
    },
    /** Read text aloud while a node is highlighted. */
    reading(el, text, rate) {
      el.classList.add("is-reading");
      return Promise.resolve(ctx.tts(text, rate ? { rate } : undefined))
        .catch(() => {})
        .finally(() => el.classList.remove("is-reading"));
    },
    finish(misses, total, detail) {
      ctx.done({ stars: starsOf(misses, total), detail });
    },
  };
  return kit;
}

/** Chip-then-slot placement (also slot-then-chip), shared by cloze and sequence. Caller re-renders in `changed`. */
export function createPicker({ place, remove, changed }) {
  const p = {
    sel: null,
    active: null,
    chip(id) {
      if (p.active != null) {
        const slot = p.active;
        p.active = null;
        place(id, slot);
      } else p.sel = p.sel === id ? null : id;
      changed();
    },
    slot(id, filled) {
      if (p.sel != null) {
        const chip = p.sel;
        p.sel = null;
        p.active = null;
        place(chip, id);
      } else if (filled) {
        remove(id);
        p.active = id;
      } else p.active = p.active === id ? null : id;
      changed();
    },
    drop(chipId, slotId) {
      p.sel = null;
      p.active = null;
      place(chipId, slotId);
      changed();
    },
  };
  return p;
}

/**
 * Pointer-based drag for a chip (mouse, pen and touch). A plain click/tap/keypress still fires `click`
 * natively, so every drag also has a tap/keyboard path. `targets()` returns the current drop elements.
 */
export function enableDrag(el, { targets, onDrop, canDrag = () => true }) {
  let st = null;
  const ghostOf = () => {
    const r = el.getBoundingClientRect();
    const g = el.cloneNode(true);
    g.removeAttribute("id");
    g.classList.add("sg-ghost");
    g.setAttribute("aria-hidden", "true");
    g.style.width = `${r.width}px`;
    document.body.append(g);
    return g;
  };
  const hit = (x, y) => {
    let best = null;
    let area = Infinity;
    for (const t of targets()) {
      const r = t.getBoundingClientRect();
      if (
        x >= r.left - 4 &&
        x <= r.right + 4 &&
        y >= r.top - 4 &&
        y <= r.bottom + 4 &&
        r.width * r.height < area
      ) {
        best = t;
        area = r.width * r.height;
      }
    }
    return best;
  };
  const end = (drop, e) => {
    if (!st) return;
    const s = st;
    st = null;
    document.removeEventListener("keydown", onKey, true);
    if (s.ghost) {
      s.ghost.remove();
      el.classList.remove("is-dragging");
      s.over?.classList.remove("is-over");
      try {
        el.releasePointerCapture(s.id);
      } catch {}
      const stop = (ev) => {
        ev.stopImmediatePropagation();
        ev.preventDefault();
      };
      el.addEventListener("click", stop, { capture: true, once: true });
      window.setTimeout(() => el.removeEventListener("click", stop, true), 60);
      if (drop && e) {
        const target = hit(e.clientX, e.clientY);
        if (target) onDrop(target);
      }
    }
  };
  const onKey = (e) => {
    if (e.key === "Escape") end(false);
  };
  el.addEventListener("pointerdown", (e) => {
    if ((e.pointerType === "mouse" && e.button !== 0) || !canDrag()) return;
    st = { id: e.pointerId, x: e.clientX, y: e.clientY, ghost: null, over: null };
  });
  el.addEventListener("pointermove", (e) => {
    if (!st || e.pointerId !== st.id) return;
    if (!st.ghost) {
      if (Math.hypot(e.clientX - st.x, e.clientY - st.y) < 8) return;
      st.ghost = ghostOf();
      el.classList.add("is-dragging");
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      document.addEventListener("keydown", onKey, true);
    }
    st.ghost.style.left = `${e.clientX}px`;
    st.ghost.style.top = `${e.clientY}px`;
    const over = hit(e.clientX, e.clientY);
    if (over !== st.over) {
      st.over?.classList.remove("is-over");
      over?.classList.add("is-over");
      st.over = over;
    }
    e.preventDefault();
  });
  el.addEventListener("pointerup", (e) => end(true, e));
  el.addEventListener("pointercancel", () => end(false));
}
