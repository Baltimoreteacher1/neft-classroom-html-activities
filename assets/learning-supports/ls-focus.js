// "One problem at a time": show a single problem and a small Back / Next bar,
// and keep the rest out of sight until the student is ready.
//
// A group is the set of problems that sit side by side under the same parent.
// Nothing about a problem changes: it is hidden with a class, never removed, so
// answers, hints, save and resume, and grading all keep working exactly as they
// do with every problem showing. Printing always shows them all.

import { announce, bi, one } from "./ls-ui.js";

const PROBLEM = ".problem-card, .problem-section, [data-ls-problem]";
const HIDDEN = "ls-focus-hidden";
const SETTLE_MS = 150;

/**
 * @typedef {object} Group
 * @property {Element} parent
 * @property {Element[]} items
 * @property {number} index
 * @property {HTMLElement} bar
 * @property {HTMLElement} count
 * @property {HTMLButtonElement} back
 * @property {HTMLButtonElement} next
 */

/** @param {Element} el */
function isOwn(el) {
  return el.closest("[data-ls-ui]") !== null;
}

/**
 * Is this problem drawn, as far as the problem itself goes? A problem we hid
 * ourselves counts as drawn: it is only hidden because one-at-a-time is on.
 * @param {Element} el
 */
function isDrawn(el) {
  if (el.classList.contains(HIDDEN)) return true;
  return el.ownerDocument.defaultView?.getComputedStyle(el).display !== "none";
}

/**
 * @param {Document} doc
 * @returns {Map<Element, Element[]>} problems grouped by parent. Only groups of
 *   two or more are returned, and a group the page already pages itself (all
 *   but one problem hidden by the page's own pager) is left to that pager.
 */
export function findGroups(doc) {
  /** @type {Map<Element, Element[]>} */
  const byParent = new Map();
  for (const el of doc.querySelectorAll(PROBLEM)) {
    if (isOwn(el) || !el.parentElement) continue;
    // A problem inside another problem is part of it, not a sibling to page through.
    if (el.parentElement.closest(PROBLEM)) continue;
    const list = byParent.get(el.parentElement) ?? [];
    list.push(el);
    byParent.set(el.parentElement, list);
  }
  for (const [parent, list] of byParent) {
    if (list.length < 2 || list.filter(isDrawn).length < 2) byParent.delete(parent);
  }
  return byParent;
}

/** @param {{ get: () => import("./ls-prefs.js").Prefs, subscribe: (fn: (p: import("./ls-prefs.js").Prefs) => void) => () => void }} prefs */
export function installFocus(prefs) {
  /** @type {Map<Element, Group>} */
  const groups = new Map();
  /** @type {MutationObserver | null} */
  let observer = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  /** @param {Group} g @param {number} to @param {boolean} [moveFocus] */
  function show(g, to, moveFocus = false) {
    g.index = Math.max(0, Math.min(g.items.length - 1, to));
    g.items.forEach((el, i) => el.classList.toggle(HIDDEN, i !== g.index));
    g.count.replaceChildren(bi("focusBar", { n: g.index + 1, total: g.items.length }));
    g.back.disabled = g.index === 0;
    g.next.disabled = g.index === g.items.length - 1;
    if (moveFocus) {
      const current = /** @type {HTMLElement} */ (g.items[g.index]);
      if (!current.hasAttribute("tabindex")) current.tabIndex = -1;
      current.focus({ preventScroll: true });
      current.scrollIntoView({ block: "start", behavior: prefs.get().calm ? "auto" : "smooth" });
      announce("focusShowing", { n: g.index + 1, total: g.items.length });
    }
  }

  /** @param {Element} parent @param {Element[]} items */
  function build(parent, items) {
    const bar = document.createElement("div");
    bar.className = "ls-focus-bar";
    bar.setAttribute("data-ls-ui", "");
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", one("focusNav"));

    const back = document.createElement("button");
    back.type = "button";
    back.className = "ls-btn";
    back.append("← ", bi("focusBack"));
    const next = document.createElement("button");
    next.type = "button";
    next.className = "ls-btn ls-btn-primary";
    next.append(bi("focusNext"), " →");
    const count = document.createElement("span");
    count.className = "ls-focus-count";

    bar.append(back, count, next);
    items[0].before(bar);
    /** @type {Group} */
    const g = { parent, items, index: 0, bar, count, back, next };
    back.addEventListener("click", () => show(g, g.index - 1, true));
    next.addEventListener("click", () => show(g, g.index + 1, true));
    return g;
  }

  function scan() {
    const found = findGroups(document);
    for (const [parent, g] of groups) {
      if (!found.has(parent)) {
        g.items.forEach((el) => el.classList.remove(HIDDEN));
        g.bar.remove();
        groups.delete(parent);
      }
    }
    for (const [parent, items] of found) {
      const known = groups.get(parent);
      if (
        known &&
        known.items.length === items.length &&
        known.items.every((el, i) => el === items[i])
      ) {
        continue;
      }
      // Keep the student's place when problems are added after the first scan.
      const keep = known?.items[known.index];
      known?.bar.remove();
      const g = build(parent, items);
      groups.set(parent, g);
      const at = keep ? items.indexOf(keep) : -1;
      show(g, at >= 0 ? at : 0);
    }
  }

  function scheduleScan() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(scan, SETTLE_MS);
  }

  /** A hidden problem that something sends focus into (a link, resume) is shown. */
  function revealFocused(/** @type {FocusEvent} */ e) {
    const target = e.target;
    if (!(target instanceof Element)) return;
    for (const g of groups.values()) {
      const i = g.items.findIndex((el) => el.contains(target));
      if (i >= 0 && i !== g.index) show(g, i);
    }
  }

  function enable() {
    document.documentElement.classList.add("ls-focus");
    scan();
    observer = new MutationObserver((records) => {
      const ours = records.every(
        (r) =>
          [...r.addedNodes, ...r.removedNodes].every((n) => n instanceof Element && isOwn(n)) &&
          r.type === "childList",
      );
      if (!ours) scheduleScan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("focusin", revealFocused);
  }

  function disable() {
    document.documentElement.classList.remove("ls-focus");
    observer?.disconnect();
    observer = null;
    if (timer) clearTimeout(timer);
    document.removeEventListener("focusin", revealFocused);
    for (const g of groups.values()) {
      g.items.forEach((el) => el.classList.remove(HIDDEN));
      g.bar.remove();
    }
    groups.clear();
  }

  let on = false;
  /** @param {boolean} want */
  const sync = (want) => {
    if (want === on) return;
    on = want;
    if (want) enable();
    else disable();
  };
  sync(prefs.get().focus);
  prefs.subscribe((p) => sync(p.focus));
}
