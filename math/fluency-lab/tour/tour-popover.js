// The tour engine: a non-modal spotlight plus a popover dialog anchored to a real element.
// It owns only presentation, focus and positioning. The controller decides what to show.
import { demoHtml } from "./tour-demos.js";
import { ui } from "./tour-steps.js";

const MARGIN = 12;
const GAP = 14;
const SPOT_PAD = 6;
const MAX_WIDTH = 380;
const WIDE = 720;

const escapeText = (value) =>
  String(value).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const isShown = (el) => {
  if (!el || !el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== "hidden";
};
const clamp = (value, low, high) => Math.min(Math.max(value, low), Math.max(low, high));
const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function build() {
  const spot = document.createElement("div");
  spot.className = "tour-spot";
  spot.hidden = true;
  spot.setAttribute("aria-hidden", "true");
  const pop = document.createElement("div");
  pop.className = "tour-pop";
  pop.hidden = true;
  pop.tabIndex = -1;
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-labelledby", "tour-title");
  pop.setAttribute("aria-describedby", "tour-desc");
  pop.innerHTML = `
    <div class="tour-head">
      <p class="tour-step" data-ref="label"></p>
      <button type="button" class="tour-btn tour-skip" data-act="skip"></button>
      <button type="button" class="tour-btn tour-x" data-act="close">
        <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" focusable="false"><path d="M2 2l10 10M12 2L2 12"/></svg>
      </button>
    </div>
    <div class="tour-progress" role="progressbar" aria-valuemin="1"><span class="tour-progress-fill"></span></div>
    <div class="tour-scroll">
      <h2 class="tour-title" id="tour-title"></h2>
      <div class="tour-demo-slot"></div>
      <div class="tour-desc" id="tour-desc"></div>
      <div class="tour-link-slot"></div>
    </div>
    <div class="tour-foot">
      <button type="button" class="tour-btn tour-prev" data-act="prev"></button>
      <button type="button" class="tour-btn tour-next" data-act="next"></button>
    </div>
    <p class="tour-sr" role="status" aria-live="polite"></p>`;
  return { spot, pop };
}

export function createPopover({ getLang, fallbackFocus }) {
  const { spot, pop } = build();
  const ref = (name) => pop.querySelector(`[data-ref="${name}"]`);
  const $ = (selector) => pop.querySelector(selector);
  let current = null;
  let opener = null;
  let lastTitle = "";
  let demoPaused = false;
  let frame = 0;
  let scrolled = false;

  const lang = () => (getLang() === "es" ? "es" : "en");

  function resolveAnchor() {
    const el = current?.anchor ? document.querySelector(current.anchor) : null;
    return isShown(el) ? el : null;
  }

  function dockPlacement(rect, ph, vh) {
    const bottom = vh - ph - MARGIN;
    const overlap = (top) => Math.max(0, Math.min(top + ph, rect.bottom) - Math.max(top, rect.top));
    return overlap(MARGIN) < overlap(bottom) ? MARGIN : bottom;
  }

  function place() {
    if (!current) return;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const width = Math.min(MAX_WIDTH, vw - MARGIN * 2);
    pop.style.width = `${width}px`;
    const anchor = resolveAnchor();
    if (anchor && !scrolled) {
      scrolled = true;
      anchor.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    }
    let cap = Math.min(vh - MARGIN * 2, Math.max(340, vh * 0.72));
    if (anchor && vw < WIDE) {
      // Narrow screen: leave room above or below the popover for the anchor it points at.
      cap = Math.max(300, Math.min(cap, vh - anchor.getBoundingClientRect().height - MARGIN * 4));
    }
    pop.style.maxHeight = `${Math.round(cap)}px`;
    const ph = pop.offsetHeight;
    if (!anchor) {
      spot.hidden = true;
      pop.dataset.placement = "center";
      pop.style.left = `${Math.round((vw - width) / 2)}px`;
      pop.style.top = `${Math.round(Math.max(MARGIN, (vh - ph) / 2))}px`;
      return;
    }
    let rect = anchor.getBoundingClientRect();
    const fitsBelow = rect.bottom + GAP + ph <= vh - MARGIN;
    const fitsAbove = rect.top - GAP - ph >= MARGIN;
    const fitsSide = vw >= WIDE && (rect.right + GAP + width <= vw - MARGIN || rect.left - GAP - width >= MARGIN);
    if (!fitsBelow && !fitsAbove && !fitsSide && rect.height < vh - ph - MARGIN * 3) {
      // Tight screen: park the popover at the bottom and slide the anchor into the free space above it.
      const free = vh - ph - MARGIN * 2;
      const wanted = MARGIN + (free - rect.height) / 2;
      window.scrollBy({ top: rect.top - wanted, behavior: "instant" });
      rect = anchor.getBoundingClientRect();
    }
    const spotRect = {
      left: rect.left - SPOT_PAD,
      top: rect.top - SPOT_PAD,
      width: rect.width + SPOT_PAD * 2,
      height: rect.height + SPOT_PAD * 2,
    };
    Object.assign(spot.style, {
      left: `${spotRect.left}px`,
      top: `${spotRect.top}px`,
      width: `${spotRect.width}px`,
      height: `${spotRect.height}px`,
    });
    spot.hidden = false;
    const centerX = clamp(rect.left + rect.width / 2 - width / 2, MARGIN, vw - width - MARGIN);
    const centerY = clamp(rect.top + rect.height / 2 - ph / 2, MARGIN, vh - ph - MARGIN);
    const below = rect.bottom + GAP + ph <= vh - MARGIN;
    const above = rect.top - GAP - ph >= MARGIN;
    const right = vw >= WIDE && rect.right + GAP + width <= vw - MARGIN;
    const left = vw >= WIDE && rect.left - GAP - width >= MARGIN;
    let side = "dock";
    let x = centerX;
    let y = dockPlacement(rect, ph, vh);
    if (below) [side, y] = ["below", rect.bottom + GAP];
    else if (above) [side, y] = ["above", rect.top - GAP - ph];
    else if (right) [side, x, y] = ["right", rect.right + GAP, centerY];
    else if (left) [side, x, y] = ["left", rect.left - GAP - width, centerY];
    pop.dataset.placement = side;
    pop.style.left = `${Math.round(x)}px`;
    pop.style.top = `${Math.round(y)}px`;
  }

  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(place);
  };

  function paint() {
    const language = lang();
    const { step, mode, index = 0, total = 1 } = current;
    const tour = mode === "tour";
    const last = index === total - 1;
    pop.dataset.mode = mode;
    ref("label").textContent = tour ? ui(language, "stepOf", { n: index + 1, total }) : "";
    ref("label").hidden = !tour;
    $(".tour-progress").hidden = !tour;
    if (tour) {
      const bar = $(".tour-progress");
      bar.setAttribute("aria-valuemax", String(total));
      bar.setAttribute("aria-valuenow", String(index + 1));
      bar.setAttribute("aria-valuetext", ui(language, "stepOf", { n: index + 1, total }));
      bar.setAttribute("aria-label", ui(language, "progressLabel"));
      $(".tour-progress-fill").style.width = `${((index + 1) / total) * 100}%`;
    }
    $(".tour-skip").textContent = ui(language, "skip");
    $(".tour-skip").hidden = !tour || last;
    $(".tour-x").setAttribute("aria-label", ui(language, tour ? "close" : "closeBubble"));
    const prev = $(".tour-prev");
    prev.textContent = ui(language, "previous");
    prev.hidden = !tour || index === 0;
    $(".tour-next").textContent = ui(language, !tour ? "gotIt" : last ? "done" : "next");
    const copy = step[language] || step.en;
    $(".tour-title").textContent = copy.title;
    $(".tour-desc").innerHTML = copy.body.map((line) => `<p>${escapeText(line)}</p>`).join("");
    $(".tour-link-slot").innerHTML = step.link
      ? `<a class="tour-link" href="${escapeText(step.link.href)}">${escapeText(step.link[language] || step.link.en)}</a>`
      : "";
    $(".tour-demo-slot").innerHTML = step.demo ? demoHtml(step.demo, language) : "";
    if (demoPaused) applyPause($(".tour-demo"), true);
    if (copy.title !== lastTitle) {
      $(".tour-sr").textContent = tour
        ? ui(language, "announce", { n: index + 1, total, title: copy.title })
        : "";
      lastTitle = copy.title;
    }
    $(".tour-scroll").scrollTop = 0;
  }

  function applyPause(figure, paused) {
    const toggle = figure?.querySelector(".tour-demo-toggle");
    if (!toggle) return;
    figure.classList.toggle("is-paused", paused);
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.textContent = paused ? toggle.dataset.play : toggle.dataset.pause;
  }

  function show(next) {
    const wasOpen = !pop.hidden;
    const stepChanged = !current || current.step !== next.step;
    current = next;
    if (!wasOpen) {
      opener = next.returnFocus || document.activeElement;
      document.body.append(spot, pop);
      pop.hidden = false;
      lastTitle = "";
      document.addEventListener("keydown", onKey, true);
      window.addEventListener("resize", schedule);
      window.addEventListener("scroll", schedule, true);
      window.visualViewport?.addEventListener("resize", schedule);
    }
    if (stepChanged) scrolled = false;
    const hadFocus = pop.contains(document.activeElement);
    paint();
    place();
    spot.classList.remove("is-pulsing");
    if (!reduceMotion()) {
      void spot.offsetWidth;
      spot.classList.add("is-pulsing");
    }
    if (!wasOpen) pop.focus({ preventScroll: true });
    else if (hadFocus) {
      const active = document.activeElement;
      const lost = !pop.contains(active) || active.closest("[hidden]");
      if (lost)
        ($(".tour-next").offsetParent ? $(".tour-next") : pop).focus({ preventScroll: true });
    }
  }

  function close({ restoreFocus = true } = {}) {
    if (pop.hidden) return;
    pop.hidden = true;
    spot.hidden = true;
    pop.remove();
    spot.remove();
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("scroll", schedule, true);
    window.visualViewport?.removeEventListener("resize", schedule);
    cancelAnimationFrame(frame);
    current = null;
    const target = opener?.isConnected && isShown(opener) ? opener : fallbackFocus?.();
    opener = null;
    if (restoreFocus) target?.focus?.();
  }

  function onKey(event) {
    if (!current) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      current.handlers.onClose?.("escape");
      return;
    }
    const inside = pop.contains(event.target);
    if (!inside || current.mode !== "tour") return;
    if (event.key === "ArrowRight") current.handlers.onNext?.();
    else if (event.key === "ArrowLeft") current.handlers.onPrev?.();
    else return;
    event.preventDefault();
  }

  pop.addEventListener("click", (event) => {
    const toggle = event.target.closest(".tour-demo-toggle");
    if (toggle) {
      demoPaused = toggle.getAttribute("aria-pressed") !== "true";
      applyPause(toggle.closest(".tour-demo"), demoPaused);
      return;
    }
    const button = event.target.closest("[data-act]");
    if (!button || !current) return;
    const { handlers, mode } = current;
    const act = button.dataset.act;
    if (act === "next") handlers.onNext?.();
    else if (act === "prev") handlers.onPrev?.();
    else if (act === "skip") handlers.onSkip?.();
    else if (act === "close") handlers.onClose?.(mode === "tour" ? "button" : "bubble");
  });

  return {
    show,
    close,
    isOpen: () => !pop.hidden,
    reposition: place,
    element: pop,
    current: () => current,
  };
}
