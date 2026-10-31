// The persistent help launcher, its menu, the "?" help bubbles and the first-visit offer card.
// All text is re-rendered from the tour copy table whenever the language changes.
import { BUBBLES, EXPEDITION_HREF, ui } from "./tour-steps.js";

const MENU_GAP = 8;
const MARGIN = 12;

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

export function createLauncher({ getLang, actions, partialInfo }) {
  const lang = () => (getLang() === "es" ? "es" : "en");
  const root = el("div", "tour-ui tour-launcher");
  const button = el("button", "tour-help-btn", {
    type: "button",
    "aria-haspopup": "true",
    "aria-expanded": "false",
    "aria-controls": "tour-menu",
  });
  button.innerHTML = '<span aria-hidden="true">?</span>';
  const menu = el("div", "tour-menu", { id: "tour-menu", role: "group" });
  menu.hidden = true;
  root.append(menu, button);
  let trigger = button;
  let offer = null;
  let frame = 0;

  const item = (act, className = "") => {
    const node = el("button", `tour-menu-item ${className}`.trim(), {
      type: "button",
      "data-act": act,
    });
    return node;
  };
  const student = item("student");
  const family = item("family");
  const resume = item("resume");
  const restart = item("restart");
  const expedition = el("a", "tour-menu-item", { href: EXPEDITION_HREF });
  menu.append(student, family, resume, restart, expedition);

  function positionMenu() {
    if (menu.hidden) return;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const rect = trigger.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const left = Math.min(Math.max(MARGIN, rect.left), vw - width - MARGIN);
    const preferAbove = trigger === button || rect.bottom + MENU_GAP + height > vh - MARGIN;
    const top = preferAbove ? rect.top - MENU_GAP - height : rect.bottom + MENU_GAP;
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(Math.max(MARGIN, top))}px`;
  }
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(positionMenu);
  };

  function render() {
    const language = lang();
    button.setAttribute("aria-label", ui(language, "helpLauncher"));
    menu.setAttribute("aria-label", ui(language, "menuLabel"));
    student.textContent = ui(language, "showStudent");
    family.textContent = ui(language, "showFamily");
    expedition.textContent = ui(language, "openExpedition");
    const partial = partialInfo();
    resume.hidden = !partial;
    if (partial) {
      const audience = ui(language, partial.audience === "family" ? "family" : "student");
      resume.innerHTML = `${ui(language, "resume")}<small>${audience} · ${ui(language, "stepOf", { n: partial.index + 1, total: partial.total })}</small>`;
    }
    restart.textContent = ui(language, "restart");
    for (const bubble of document.querySelectorAll(".tour-bubble-btn")) {
      const topic = BUBBLES.find((entry) => entry.id === bubble.dataset.bubble)?.[language].title;
      bubble.setAttribute("aria-label", ui(language, "bubbleLabel", { topic }));
    }
    if (offer) renderOffer();
  }

  function closeMenu({ restoreFocus = false } = {}) {
    if (menu.hidden) return;
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onOutside, true);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("scroll", schedule, true);
    if (restoreFocus) trigger.focus?.();
  }
  function onOutside(event) {
    if (!menu.contains(event.target) && event.target !== trigger) closeMenu();
  }
  function openMenu(from = button) {
    trigger = from;
    render();
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
    positionMenu();
    document.addEventListener("pointerdown", onOutside, true);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    menu.querySelector(".tour-menu-item:not([hidden])")?.focus();
  }

  button.addEventListener("click", () =>
    menu.hidden ? openMenu(button) : closeMenu({ restoreFocus: true }),
  );
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeMenu({ restoreFocus: true });
    }
  });
  menu.addEventListener("focusout", (event) => {
    if (
      event.relatedTarget &&
      !menu.contains(event.relatedTarget) &&
      event.relatedTarget !== trigger
    )
      closeMenu();
  });
  menu.addEventListener("click", (event) => {
    const act = event.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    const from = trigger;
    closeMenu();
    actions[act]?.(from);
  });

  function mountBubbles(onBubble) {
    for (const bubble of BUBBLES) {
      const host = document.querySelector(bubble.host);
      if (!host || host.querySelector(`[data-bubble="${bubble.id}"]`)) continue;
      const node = el("button", "tour-ui tour-bubble-btn", {
        type: "button",
        "aria-haspopup": "dialog",
        "data-bubble": bubble.id,
      });
      node.innerHTML = '<span aria-hidden="true">?</span>';
      node.addEventListener("click", () => onBubble(bubble, node));
      host.append(node);
    }
    render();
  }

  function renderOffer() {
    const language = lang();
    offer.setAttribute("aria-label", ui(language, "offerLabel"));
    offer.querySelector(".tour-offer-title").textContent = ui(language, "offerTitle");
    offer.querySelector(".tour-offer-body").textContent = ui(language, "offerBody");
    offer.querySelector('[data-act="student"]').textContent = ui(language, "offerStudent");
    offer.querySelector('[data-act="family"]').textContent = ui(language, "offerFamily");
    offer.querySelector('[data-act="dismiss"]').textContent = ui(language, "offerNo");
  }
  function showOffer(host, handlers) {
    if (offer || !host) return;
    offer = el("section", "tour-ui tour-offer", { "aria-labelledby": "tour-offer-title" });
    offer.innerHTML = `
      <div class="tour-offer-copy">
        <h2 class="tour-offer-title" id="tour-offer-title"></h2>
        <p class="tour-offer-body"></p>
      </div>
      <div class="tour-offer-actions">
        <button type="button" class="tour-btn tour-next" data-act="student"></button>
        <button type="button" class="tour-btn tour-prev" data-act="family"></button>
        <button type="button" class="tour-btn tour-quiet" data-act="dismiss"></button>
      </div>`;
    offer.addEventListener("click", (event) => {
      const act = event.target.closest("[data-act]")?.dataset.act;
      if (act) handlers[act]?.(event.target.closest("[data-act]"));
    });
    host.prepend(offer);
    renderOffer();
  }
  const setOfferVisible = (visible) => {
    if (offer) offer.hidden = !visible;
  };
  function hideOffer() {
    offer?.remove();
    offer = null;
  }

  // Inside a practice session nothing from the tour may show or take focus.
  function setPractice(on) {
    root.hidden = on;
    root.inert = on;
    for (const bubble of document.querySelectorAll(".tour-bubble-btn")) {
      bubble.hidden = on;
      bubble.inert = on;
    }
    if (on) closeMenu();
  }

  // Right after the page header, so keyboard users reach it without tabbing through the whole page.
  const header = document.querySelector(".site-header");
  if (header) header.after(root);
  else document.body.append(root);
  return {
    render,
    openMenu,
    closeMenu,
    mountBubbles,
    showOffer,
    hideOffer,
    setOfferVisible,
    setPractice,
    button,
    hasOffer: () => Boolean(offer),
  };
}
