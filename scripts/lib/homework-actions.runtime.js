/*
 * Delegated actions for the family homework page.
 *
 * Markup names what a control does with data attributes and never carries code:
 *   data-act="fn"            click  -> window.fn(...args)
 *   data-act-input="fn"      input  (also change, keydown, dragstart, dragend, dragover, drop)
 *   data-act="a b c"         call a, then b, then c; only `a` receives the arguments
 *   data-args='["x", 3]'     arguments; "$el" is the element, "$ev" the event, "$value" the
 *                            element's value, and a literal string that starts with "$" is
 *                            written "$$..." (see scripts/lib/homework-actions.mjs)
 *   data-prevent             preventDefault() on that event, like `return false` did
 *   data-stop                stopPropagation(), like `event.stopPropagation()` did
 *
 * One listener per event type replaces ~400 inline handlers on every page. Like inline
 * handlers, an action fires on the element and then on each ancestor that has one, until a
 * handler stops propagation.
 */
(() => {
  const EVENTS = [
    "click",
    "change",
    "input",
    "keydown",
    "dragstart",
    "dragend",
    "dragover",
    "drop",
  ];

  /** Small named behaviours that used to be inline statements. Signature: (el, ev, ...args). */
  const BUILTIN = {
    hwNoop: () => {},
    // A vocabulary flashcard: the face that is turned away leaves the tab order and the tree.
    hwFlipCard: (el) => {
      const card = el.closest(".vocab-card");
      if (!card) return;
      const flipped = card.classList.toggle("flipped");
      card.querySelector(".vocab-card-front")?.toggleAttribute("inert", flipped);
      card.querySelector(".vocab-card-back")?.toggleAttribute("inert", !flipped);
      card.querySelector(".flip-prompt")?.setAttribute("aria-expanded", String(flipped));
    },
    hwToggleClass: (el, _ev, name) => el.classList.toggle(name),
    hwPrint: () => window.print(),
    // Enter or Space on a focusable non-button activates it like a click.
    hwActivateOnKey: (el, ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        el.click();
      }
    },
    hwOpenDetails: (_el, _ev, id) => {
      const node = document.getElementById(id);
      if (node) node.open = true;
    },
    hwOpenMorePractice: (_el, _ev, tab) => {
      window.switchHomeworkTab(tab);
      document.querySelector(".more-practice")?.setAttribute("open", "");
    },
    hwCloseVocabPopup: () => window.__closeHwVocabPopup?.(),
    hwInsertSentenceStarter: (el, _ev, idx) =>
      window.insertSentenceStarter(
        idx,
        window.pickLangText(el.dataset.starterEn, el.dataset.starterEs),
      ),
    hwInsertWord: (el, _ev, idx) =>
      window.insertWord(idx, window.pickLangText(el.dataset.wordEn, el.dataset.wordEs)),
    hwSpeakProblem: (_el, _ev, idx) => {
      const stem = (lang) =>
        document.querySelector(`#problem_${idx} .problem-stem .lang-${lang}`)?.textContent || "";
      window.speakHomeworkText(stem("en"), stem("es"));
    },
  };

  const resolve = (arg, el, ev) => {
    if (typeof arg !== "string" || arg[0] !== "$") return arg;
    if (arg === "$el") return el;
    if (arg === "$ev") return ev;
    if (arg === "$value") return el.value;
    return arg.slice(1);
  };

  const attrFor = (type, base) => (type === "click" ? base : `${base}-${type}`);

  function run(el, type, ev) {
    const names = el.getAttribute(attrFor(type, "data-act")).split(/\s+/).filter(Boolean);
    let raw = [];
    try {
      raw = JSON.parse(el.getAttribute(attrFor(type, "data-args")) || "[]");
    } catch (error) {
      console.error("homework action: unreadable data-args", error);
    }
    const args = raw.map((arg) => resolve(arg, el, ev));
    names.forEach((name, i) => {
      const own = BUILTIN[name];
      const fn = own || window[name];
      if (typeof fn !== "function") {
        console.error(`homework action: no function named ${name}`);
        return;
      }
      if (own) own(el, ev, ...(i === 0 ? args : []));
      else fn.apply(window, i === 0 ? args : []);
    });
    if (el.hasAttribute(attrFor(type, "data-prevent"))) ev.preventDefault();
    if (el.hasAttribute(attrFor(type, "data-stop"))) ev.stopPropagation();
  }

  for (const type of EVENTS) {
    document.addEventListener(type, (ev) => {
      const attr = attrFor(type, "data-act");
      for (let el = ev.target; el?.nodeType === 1; el = el.parentElement) {
        if (!el.hasAttribute(attr)) continue;
        run(el, type, ev);
        if (ev.cancelBubble) break;
      }
    });
  }
})();
