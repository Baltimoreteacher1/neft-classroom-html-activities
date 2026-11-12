// Guided coach: one instruction at a time, attached to a real control inside a live activity.
//
// The teacher tour (/start/tour) and the family walkthrough (/practice-together) both put a real lab activity in a
// same-origin frame (?frame=1, html.is-framed) and hand this module a list of steps. A step names its target with a
// selector or a finder that runs inside the frame, says what to do in one or two sentences, and says what counts as
// done: a click, a change, or an element appearing. The coach draws one ring around the target, keeps its card
// beside the frame (below it on phones), scrolls the page so both are visible, and moves on when the learner does
// the real thing. Next, Back and Skip always work, so no step can trap anyone.
//
// Robustness: targets are looked up again on every redraw (the lab re-renders its views), a step whose target never
// appears shows its fallback text and lets the person move on, a step with `when` that does not apply is skipped, and
// a frame that navigated away from the activity shows a "Bring the example back" action instead of a broken ring.
// The frame grows to its content height, so the page scrolls as one surface and the ring never points into a hidden
// scroll area.
import { esc, icon, toHtml } from "../util.js";

const ic = (name) => toHtml(icon(name));

const FIND_TIMEOUT = 2500;
const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const narrow = () => window.matchMedia?.("(max-width: 959px)").matches;

/** A step's target element inside `doc`, or null. `target` is a selector, a list of selectors, or a finder. */
export function findTarget(doc, target) {
  if (!doc || !target) return null;
  if (typeof target === "function") return target(doc) || null;
  for (const sel of [].concat(target)) {
    const el = doc.querySelector(sel);
    if (el && isShown(el)) return el;
  }
  return null;
}

/** True when an element takes up space (hidden attribute, display:none and closed details all fail). */
export function isShown(el) {
  if (!el?.isConnected) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/** Does `event` complete `done`? `done` is { click | change | input: selector } (pure, so a test can drive it). */
export function completes(done, event) {
  if (!done || !event?.target?.closest) return false;
  const sel = done[event.type];
  return Boolean(sel && event.target.closest(sel));
}


/**
 * Start a coach.
 *   stage   element that holds the frame, the ring and the card slot ([data-coach-slot])
 *   frame   the activity iframe
 *   steps   [{ id, target, title, body, why?, done?, appear?, fallback?, when?, primary? }]
 *           `body` and `title` may be functions of the target element. `appear` advances when its selector shows up.
 *   copy    button and status words in the page language: { next, back, skip, finish, tryMyself, showMe, stepOf,
 *           missing, away, awayTitle, bringBack, why, done, doIt, goTo } plus optional { hear, lang } for read-aloud
 *           and { guide: { name, role, avatar } }, the guide who speaks the card (Mr. Neft on the tour pages)
 *   onFinish()  the last step's primary button
 *   onStep(i)   remember the place
 *   isHome(win) true while the frame still shows the activity
 */
export function createCoach({ stage, frame, steps, copy, onFinish, onStep, isHome, start = 0 }) {
  const slot = stage.querySelector("[data-coach-slot]");
  const ring = document.createElement("div");
  ring.className = "gc-ring";
  ring.setAttribute("aria-hidden", "true");
  ring.hidden = true;
  stage.append(ring);
  const live = document.createElement("p");
  live.className = "visually-hidden";
  live.setAttribute("aria-live", "polite");
  stage.append(live);

  const list = steps;
  let index = start;
  let open = true;
  let shownAt = 0;
  let raf = 0;
  let doc = null;
  let away = false;
  let pending = false;
  const seen = new Set();
  let detach = () => {};

  const step = () => list[index];
  const frameDoc = () => {
    try {
      return frame.contentDocument;
    } catch {
      return null; // never cross-origin in practice; the coach then only shows its cards
    }
  };

  function sizeFrame() {
    const d = frameDoc();
    // The body's own height, not the document's scrollHeight: scrollHeight never drops below the frame's height, so
    // measuring it only ever grows the frame (it ran away to the cap on the live site).
    const body = d?.body;
    if (!body) return;
    const h = Math.min(8000, Math.ceil(body.getBoundingClientRect().height + 24));
    if (Math.abs(frame.offsetHeight - h) > 4) frame.style.height = `${h}px`;
  }

  function targetEl() {
    const s = step();
    return s && !away ? findTarget(frameDoc(), s.target) : null;
  }

  /** Put the ring on the target, in the stage's coordinates (it scrolls with the page). */
  function place() {
    raf = 0;
    sizeFrame();
    const el = open ? targetEl() : null;
    if (!el) {
      ring.hidden = true;
      placeCard(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const pad = 6;
    ring.hidden = false;
    ring.style.left = `${f.left - s.left + r.left - pad}px`;
    ring.style.top = `${f.top - s.top + r.top - pad}px`;
    ring.style.width = `${r.width + pad * 2}px`;
    ring.style.height = `${r.height + pad * 2}px`;
    placeCard(f.top - s.top + r.top);
  }

  /** Wide screens: the card sits in the column beside the frame, level with the target. Phones: docked below. */
  function placeCard(y) {
    const card = slot.querySelector(".gc-card");
    if (!card) return;
    if (narrow() || y == null) {
      card.style.removeProperty("--gc-top");
      return;
    }
    const max = Math.max(0, stage.offsetHeight - card.offsetHeight);
    card.style.setProperty("--gc-top", `${Math.min(max, Math.max(0, y - 24))}px`);
  }

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(place);
  };

  /** Bring the target (and, on phones, the space above the docked card) into view. */
  function reveal() {
    const el = targetEl();
    const behavior = reduceMotion() ? "auto" : "smooth";
    if (!el) {
      if (!narrow()) return;
      slot.querySelector(".gc-card")?.scrollIntoView({ block: "nearest", behavior });
      return;
    }
    const r = el.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const top = f.top + r.top;
    const header = stickyTop() + 12;
    const dock = narrow() ? (slot.querySelector(".gc-card")?.offsetHeight || 0) + 16 : 0;
    const room = window.innerHeight - dock;
    const fits = top >= header && top + Math.min(r.height, room / 2) <= room;
    if (fits) return;
    const want = window.scrollY + top - Math.max(header, (room - r.height) / 3);
    window.scrollTo({ top: Math.max(0, want), behavior });
  }

  /** Bottom edge of the lab's sticky top bar (it is taller on narrow screens), so nothing scrolls under it. */
  function stickyTop() {
    const bar = document.querySelector(".lab-top");
    const b = bar ? bar.getBoundingClientRect().bottom : 0;
    return Math.max(0, Math.min(b, window.innerHeight / 3));
  }

  function text(v, el) {
    return typeof v === "function" ? v(el) : v;
  }

  function cardHTML() {
    const s = step();
    if (!s) return "";
    const el = targetEl();
    const missing = !away && s.target && !el && Date.now() - shownAt > FIND_TIMEOUT;
    const last = index === list.length - 1;
    const waiting = Boolean((s.done || s.appear) && !missing && !away);
    const title = away ? copy.awayTitle : text(s.title, el);
    const body = away ? copy.away : missing ? s.fallback || copy.missing : text(s.body, el);
    // Count the steps this person sees: the ones already shown plus the ones that apply from here, so a step the
    // activity does not have never makes the count jump.
    const d = frameDoc();
    const shown = list.map((st, i) => (i <= index ? seen.has(i) : !st.when || st.when(d)));
    const total = shown.filter(Boolean).length;
    const at = shown.slice(0, index + 1).filter(Boolean).length;
    const dots = shown
      .map((on, i) => (on ? `<span class="${i < index ? "is-done" : i === index ? "is-now" : ""}"></span>` : ""))
      .join("");
    const goTo =
      waiting && el
        ? `<button type="button" class="btn ghost small gc-go" data-gc="go">${esc(copy.goTo)}</button>`
        : "";
    const primary = away
      ? `<button type="button" class="btn btn-primary small" data-gc="home">${ic("retry")}${esc(copy.bringBack)}</button>`
      : last
        ? `<button type="button" class="btn btn-primary small" data-gc="finish">${esc(s.primary || copy.finish)}${ic("arrow-right")}</button>`
        : waiting
          ? `<button type="button" class="btn ghost small" data-gc="next">${esc(copy.skip)}</button>`
          : `<button type="button" class="btn btn-primary small" data-gc="next">${esc(copy.next)}${ic("arrow-right")}</button>`;
    const why =
      s.why && !away
        ? `<details class="gc-why"><summary>${esc(copy.why)}</summary><p>${esc(s.why)}</p></details>`
        : "";
    return `<section class="gc-card${waiting ? " is-waiting" : ""}" role="region" aria-labelledby="gcTitle">
      ${copy.guide ? `<p class="gc-who"><span class="gc-avatar">${copy.guide.avatar}</span><span><strong>${esc(copy.guide.name)}</strong><span>${esc(copy.guide.role)}</span></span></p>` : ""}
      <header class="gc-head">
        <p class="gc-count">${esc(copy.stepOf(at, total))}</p>
        <span class="gc-dots" aria-hidden="true">${dots}</span>
        <button type="button" class="gc-x" data-gc="close">${ic("close")}<span>${esc(copy.tryMyself)}</span></button>
      </header>
      <h2 class="gc-title" id="gcTitle" tabindex="-1">${esc(title)}</h2>
      <p class="gc-body">${esc(body)}</p>
      ${waiting ? `<p class="gc-wait">${ic("sparkle")}<span>${esc(copy.doIt)}</span></p>${goTo}` : ""}
      ${why}
      <footer class="gc-foot">
        ${index > 0 ? `<button type="button" class="btn ghost small" data-gc="back">${ic("arrow-left")}${esc(copy.back)}</button>` : "<span></span>"}
      ${copy.hear && "speechSynthesis" in window ? `<button type="button" class="btn ghost small gc-hear" data-gc="hear">${ic("volume")}${esc(copy.hear)}</button>` : ""}
        ${primary}
      </footer>
    </section>`;
  }

  function pillHTML() {
    return `<button type="button" class="gc-pill" data-gc="open">${ic("help")}${esc(copy.showMe)}</button>`;
  }

  function draw({ focus = false } = {}) {
    slot.innerHTML = open ? cardHTML() : pillHTML();
    slot.classList.toggle("is-open", open);
    schedule();
    if (focus)
      (open ? slot.querySelector(".gc-title") : slot.querySelector(".gc-pill"))?.focus({
        preventScroll: true,
      });
  }

  function go(i, { focus = true, announce = false, dir = 1 } = {}) {
    // Steps whose `when` does not apply right now are passed over in the direction of travel. Indexes always refer
    // to the full list, so a control that disappears (the skill lesson closing) never shifts the steps after it.
    const d = frameDoc();
    const ok = (j) => !list[j].when || list[j].when(d);
    let j = Math.max(0, Math.min(list.length - 1, i));
    while (j >= 0 && j < list.length && !ok(j)) j += dir;
    if (j < 0 || j >= list.length) j = Math.max(0, Math.min(list.length - 1, i));
    index = j;
    seen.add(j);
    pending = false;
    shownAt = Date.now();
    onStep?.(index);
    draw({ focus });
    reveal();
    if (announce) live.textContent = `${copy.done} ${text(step()?.title, targetEl())}`;
    // A target that is still rendering gets a second look; a missing one shows its fallback after the timeout.
    const shown = step();
    setTimeout(() => open && step() === shown && draw(), FIND_TIMEOUT + 50);
  }

  /** The learner did the step's real action inside the activity. */
  function advance() {
    if (pending) return;
    pending = true;
    const card = slot.querySelector(".gc-card");
    card?.classList.add("is-complete");
    setTimeout(() => go(index + 1, { focus: false, announce: true }), reduceMotion() ? 0 : 450);
  }

  function onFrameEvent(e) {
    const s = step();
    if (!open || away || !s?.done) return;
    if (completes(s.done, e)) advance();
  }

  function watchAppear() {
    const s = step();
    if (!open || away || !s?.appear) return;
    if (findTarget(frameDoc(), s.appear)) advance();
  }

  function checkHome() {
    const home = isHome ? isHome(frame.contentWindow) : true;
    if (home === !away) return;
    away = !home;
    draw();
  }

  /** Listen inside the frame. Runs on every frame load (first load, "Bring it back", in-frame navigation). */
  function attach() {
    detach();
    doc = frameDoc();
    if (!doc) return;
    const win = frame.contentWindow;
    const handler = (e) => onFrameEvent(e);
    const mo = new MutationObserver(() => {
      checkHome();
      watchAppear();
      schedule();
    });
    mo.observe(doc.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["hidden", "class", "open"],
    });
    const ro = new ResizeObserver(schedule);
    ro.observe(doc.documentElement);
    for (const t of ["click", "change", "input"]) doc.addEventListener(t, handler, true);
    win.addEventListener("popstate", checkHome);
    detach = () => {
      mo.disconnect();
      ro.disconnect();
      for (const t of ["click", "change", "input"]) doc?.removeEventListener(t, handler, true);
      win?.removeEventListener("popstate", checkHome);
    };
    checkHome();
    go(index, { focus: false });
  }

  function onSlotClick(e) {
    const btn = e.target.closest("[data-gc]");
    if (!btn) return;
    const act = btn.dataset.gc;
    if (act === "next") go(index + 1);
    else if (act === "back") go(index - 1, { dir: -1 });
    else if (act === "finish") onFinish?.();
    else if (act === "hear") hear();
    else if (act === "go") goToTarget();
    else if (act === "close") {
      open = false;
      draw({ focus: true });
    } else if (act === "open") {
      open = true;
      draw({ focus: true });
      reveal();
    } else if (act === "home") {
      away = false;
      frame.src = frame.dataset.src;
    }
  }

  /** Keyboard path: put focus on the highlighted control inside the activity (made focusable if it is not). */
  function goToTarget() {
    const el = targetEl();
    if (!el) return;
    const control = el.matches("button, a[href], input, select, textarea, summary")
      ? el
      : el.querySelector("button, a[href], input, select, textarea, summary") || el;
    if (!control.matches("button, a[href], input, select, textarea, summary")) control.tabIndex = -1;
    frame.focus();
    control.focus();
  }

  /** Read the card aloud in the page's language (the device's own voice; nothing is sent anywhere). */
  function hear() {
    const card = slot.querySelector(".gc-card");
    if (!card || !("speechSynthesis" in window)) return;
    const say = [card.querySelector(".gc-title")?.textContent, card.querySelector(".gc-body")?.textContent]
      .filter(Boolean)
      .join(". ");
    const u = new SpeechSynthesisUtterance(say);
    u.lang = copy.lang || "en-US";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function onKey(e) {
    if (e.key === "Escape" && open && slot.contains(document.activeElement)) {
      open = false;
      draw({ focus: true });
    }
  }

  slot.addEventListener("click", onSlotClick);
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", schedule);
  window.addEventListener("scroll", schedule, { passive: true });
  frame.addEventListener("load", attach);
  if (frameDoc()?.readyState === "complete" && frame.contentWindow?.location.href !== "about:blank")
    attach();
  else draw();

  return {
    destroy() {
      detach();
      if ("speechSynthesis" in window) speechSynthesis.cancel();
      cancelAnimationFrame(raf);
      slot.removeEventListener("click", onSlotClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      frame.removeEventListener("load", attach);
      ring.remove();
      live.remove();
    },
    get index() {
      return index;
    },
  };
}

/** The activity frame: same origin, frame mode on, microphone allowed for speaking practice. */
export function activityFrame(src, title) {
  const frame = document.createElement("iframe");
  frame.className = "gc-frame";
  frame.src = src;
  frame.dataset.src = src;
  frame.title = title;
  frame.allow = "microphone; autoplay";
  frame.setAttribute("scrolling", "no");
  return frame;
}
