// Pick up, then place: the keyboard and screen-reader way to do what a drag does.
//
// Every drag-and-drop activity has to be doable without dragging. The pattern
// is the same everywhere: choose an item, choose where it goes, hear what
// happened. This module is that pattern, so each activity does not invent its
// own and none of them forget to announce.
//
// Pointer users see no change. The controls added here are invisible until
// they take keyboard focus, and the page's own click and drag handling is left
// exactly as it was.
//
//  - createSelectPlace(): the whole flow, for an activity that owns its items
//    and drop zones (drag-sort).
//  - makeKeyboardOperable() / addKeyboardProxy(): for an activity that already
//    moves things on click and only needs its items and targets to be reachable
//    and named by keyboard (the vocabulary sort and fill-in activities). Use the
//    first on a plain element with no controls inside it, the second when the
//    element holds controls of its own.

import { getPreferredLang } from "./i18n.js";

const STYLE_ID = "sp-styles";

/** Spoken strings, English and Spanish. `{name}` is filled in. */
const MESSAGES = {
  pickHint: {
    en: "{item}. Press Enter to pick it up.",
    es: "{item}. Oprime Enter para recogerlo.",
  },
  pickedUp: {
    en: "{item} picked up. Choose where it goes and press Enter. Escape cancels.",
    es: "{item} recogido. Elige dónde va y oprime Enter. Escape cancela.",
  },
  putDown: {
    en: "{item} put down. Nothing moved.",
    es: "{item} devuelto. No se movió nada.",
  },
  placeHint: { en: "Put it in {zone}", es: "Ponerlo en {zone}" },
  placed: {
    en: "{item} placed in {zone}. {count} there.",
    es: "{item} puesto en {zone}. {count} ahí.",
  },
  one: { en: "1 item", es: "1 elemento" },
  many: { en: "{n} items", es: "{n} elementos" },
  proxyHint: { en: "{item}. Press Enter.", es: "{item}. Oprime Enter." },
  selected: {
    en: "{item} selected. Now choose its match.",
    es: "{item} seleccionado. Ahora elige su pareja.",
  },
  matchedPair: { en: "Matched: {a} with {b}.", es: "Pareja correcta: {a} con {b}." },
  notAMatch: {
    en: "{a} and {b} do not match. Try again.",
    es: "{a} y {b} no son pareja. Inténtalo otra vez.",
  },
  moveUp: { en: "Move {item} up", es: "Subir {item}" },
  moveDown: { en: "Move {item} down", es: "Bajar {item}" },
  movedTo: {
    en: "{item} moved to position {n} of {total}.",
    es: "{item} movido a la posición {n} de {total}.",
  },
};

/**
 * @param {keyof typeof MESSAGES} key
 * @param {Record<string, string | number>} [vars]
 */
export function say(key, vars = {}) {
  const lang = getPreferredLang() === "es" ? "es" : "en";
  return MESSAGES[key][lang].replace(/\{(\w+)\}/g, (_m, k) => String(vars[k] ?? ""));
}

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .sp-live { position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
    .sp-host { position:relative; }
    /* Over the item, invisible, and ignored by the mouse: only a keyboard reaches it. */
    .sp-pick { position:absolute; inset:0; width:100%; height:100%; margin:0; padding:0; border:0; background:transparent; opacity:0; pointer-events:none; }
    .sp-focus, .sp-operable:focus-visible { outline:3px solid var(--teal, #0f766e); outline-offset:2px; }
    /* Hidden until it has focus, then an ordinary visible button. */
    .sp-place { position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
    .sp-place:focus-visible { position:static; flex:1 0 100%; width:auto; height:auto; margin:0 0 6px; padding:10px 14px; overflow:visible; clip:auto; white-space:normal;
      border:2px solid var(--teal, #0f766e); border-radius:10px; background:#fff; color:var(--navy, #14365b); font:inherit; font-weight:700; cursor:pointer; }
  `;
  (document.head || document.documentElement).append(style);
}

/**
 * The polite announcement region inside `host`, made on first use.
 * @param {Element} host
 * @returns {(text: string) => void}
 */
export function liveAnnouncer(host) {
  injectStyles();
  let region = /** @type {HTMLElement | null} */ (host.querySelector("[data-sp-live]"));
  if (!region) {
    region = document.createElement("div");
    region.className = "sp-live";
    region.dataset.spLive = "";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    host.append(region);
  }
  const target = region;
  return (text) => {
    target.textContent = "";
    // A beat later so repeating the same message is still announced.
    setTimeout(() => {
      target.textContent = text;
    }, 30);
  };
}

/**
 * Make a plain element that already reacts to a click work from the keyboard:
 * focusable, named, and Enter or Space does what a click does. Only for an
 * element with no controls inside it (an interactive control may not contain
 * another); use addKeyboardProxy for the rest.
 * @param {HTMLElement} el
 * @param {string} name what a screen reader should call it
 */
export function makeKeyboardOperable(el, name) {
  injectStyles();
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", say("proxyHint", { item: name }));
  el.classList.add("sp-operable");
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      el.click();
    }
  });
}

/**
 * Make an element that already reacts to a click reachable and named by keyboard.
 * An invisible button inside it forwards Enter / Space as the click the element
 * already handles. Nothing else about the element changes.
 * @param {HTMLElement} el
 * @param {string} name what a screen reader should call it
 * @returns {HTMLButtonElement}
 */
export function addKeyboardProxy(el, name) {
  injectStyles();
  el.classList.add("sp-host");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "sp-pick";
  btn.setAttribute("aria-label", say("proxyHint", { item: name }));
  btn.addEventListener("focus", () => el.classList.add("sp-focus"));
  btn.addEventListener("blur", () => el.classList.remove("sp-focus"));
  el.prepend(btn);
  return btn;
}

/**
 * @typedef {object} SelectPlaceOptions
 * @property {Element} host the activity's container; the announcements live here
 * @property {(item: HTMLElement, zone: HTMLElement) => void} place move the item (the activity's own move, with its own effects)
 * @property {(item: HTMLElement, picked: boolean) => void} [mark] show or hide the "picked up" look
 * @property {(zone: HTMLElement) => number} [countIn] how many items a zone holds now
 */

/**
 * One pick-up-then-place flow shared by a set of items and drop zones.
 * @param {SelectPlaceOptions} opts
 */
export function createSelectPlace({ host, place, mark, countIn }) {
  injectStyles();
  const announce = liveAnnouncer(host);
  /** @type {Map<HTMLElement, { btn: HTMLButtonElement, name: string }>} */
  const items = new Map();
  /** @type {Map<HTMLElement, { btn: HTMLButtonElement, name: string }>} */
  const zones = new Map();
  /** @type {HTMLElement | null} */
  let picked = null;

  /** @param {HTMLElement} item */
  const homeZone = (item) => [...zones.keys()].find((z) => z.contains(item)) ?? null;

  function refresh() {
    for (const [item, { btn }] of items) btn.setAttribute("aria-pressed", String(item === picked));
    const home = picked ? homeZone(picked) : null;
    for (const [zone, { btn }] of zones) btn.disabled = !picked || zone === home;
  }

  /** @param {boolean} [speak] @param {boolean} [byKeyboard] */
  function cancel(speak = true, byKeyboard = true) {
    if (!picked) return;
    const item = picked;
    picked = null;
    mark?.(item, false);
    refresh();
    if (byKeyboard) items.get(item)?.btn.focus();
    if (speak) announce(say("putDown", { item: items.get(item)?.name ?? "" }));
  }

  /**
   * @param {HTMLElement} item
   * @param {boolean} [byKeyboard] a mouse or touch pick keeps focus where it is
   */
  function toggle(item, byKeyboard = false) {
    if (picked === item) {
      cancel(true, byKeyboard);
      return;
    }
    if (picked) mark?.(picked, false);
    picked = item;
    mark?.(item, true);
    refresh();
    announce(say("pickedUp", { item: items.get(item)?.name ?? "" }));
    if (!byKeyboard) return;
    // Take the keyboard straight to the first place it can go.
    const first = [...zones.values()].find(({ btn }) => !btn.disabled);
    first?.btn.focus();
  }

  /**
   * @param {HTMLElement} zone
   * @param {boolean} [byKeyboard]
   */
  function placeInto(zone, byKeyboard = false) {
    if (!picked) return;
    const item = picked;
    if (zone === homeZone(item)) {
      cancel(false, byKeyboard);
      return;
    }
    picked = null;
    mark?.(item, false);
    place(item, zone);
    refresh();
    const n = countIn?.(zone) ?? 0;
    const count = n === 1 ? say("one") : say("many", { n });
    announce(
      say("placed", {
        item: items.get(item)?.name ?? "",
        zone: zones.get(zone)?.name ?? "",
        count,
      }),
    );
    if (byKeyboard) items.get(item)?.btn.focus();
  }

  /** @param {KeyboardEvent} e */
  function arrowAmongPlaces(e) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    const open = [...zones.values()].map((z) => z.btn).filter((b) => !b.disabled);
    const at = open.indexOf(/** @type {HTMLButtonElement} */ (e.currentTarget));
    if (at < 0 || open.length < 2) return;
    e.preventDefault();
    open[(at + step + open.length) % open.length].focus();
  }

  return {
    get picked() {
      return picked;
    },
    toggle,
    placeInto,
    cancel,
    /**
     * @param {HTMLElement} item
     * @param {string} name what a screen reader should call it
     */
    registerItem(item, name) {
      item.classList.add("sp-host");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sp-pick";
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", say("pickHint", { item: name }));
      btn.addEventListener("click", (e) => {
        // The item's own click handler is the pointer path; this one is the keyboard's.
        e.stopPropagation();
        toggle(item, true);
      });
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && picked) {
          e.preventDefault();
          cancel(true, true);
        }
      });
      btn.addEventListener("focus", () => item.classList.add("sp-focus"));
      btn.addEventListener("blur", () => item.classList.remove("sp-focus"));
      item.prepend(btn);
      items.set(item, { btn, name });
    },
    /**
     * @param {HTMLElement} zone
     * @param {string} name what a screen reader should call it
     */
    registerZone(zone, name) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sp-place";
      btn.disabled = true;
      btn.setAttribute("aria-label", say("placeHint", { zone: name }));
      btn.textContent = say("placeHint", { zone: name });
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        placeInto(zone, true);
      });
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          cancel(true, true);
        } else {
          arrowAmongPlaces(e);
        }
      });
      zone.prepend(btn);
      zones.set(zone, { btn, name });
    },
  };
}
