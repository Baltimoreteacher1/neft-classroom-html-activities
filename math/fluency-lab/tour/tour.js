// Math Fluency Lab onboarding tour: entry module.
// Nothing here starts on its own. A tour opens only from a visitor's own action: the offer card, the "Show me how"
// button, the "?" launcher, a help bubble, or an explicit ?tour=student|family in the URL.
// Deep link from other pages:  /math/fluency-lab/?tour=family   (or ?tour=student)
import { getLang } from "../i18n.js";
import { createLauncher } from "./tour-launcher.js";
import { createPopover } from "./tour-popover.js";
import {
  AUDIENCES,
  createStore,
  isPartial,
  partialAudience,
  requestedTour,
  shouldOffer,
  stateExists,
} from "./tour-state.js";
import { BUBBLES, STEPS } from "./tour-steps.js";

// Read the launch URL now: the lab rewrites it (?grade=N) as soon as its own script runs.
const LAUNCH = { search: location.search, hash: location.hash };

const storage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const counts = { student: STEPS.student.length, family: STEPS.family.length };
const store = createStore(storage);
const lastIndex = (audience) => counts[audience] - 1;

const workspace = () => document.querySelector("#workspace-view");
const inPractice = () => {
  const view = workspace();
  return Boolean(view && !view.hidden);
};
const storageKeys = () => {
  try {
    return Object.keys(window.localStorage);
  } catch {
    return [];
  }
};

let active = null; // { audience, index, opener } while a tour is open
let bubble = null; // the help bubble that is open, if any

const popover = createPopover({ getLang, fallbackFocus: () => launcher.button });
const launcher = createLauncher({
  getLang,
  partialInfo() {
    const audience = partialAudience(store.get(), counts);
    return audience
      ? { audience, index: store.get().steps[audience].index, total: counts[audience] }
      : null;
  },
  actions: {
    student: (opener) => openTour("student", { opener }),
    family: (opener) => openTour("family", { opener }),
    resume: (opener) => resumeTour({ opener }),
    restart: (opener) => restartTour(store.get().audience || "student", { opener }),
  },
});

function present() {
  if (active) {
    const { audience, index, opener } = active;
    popover.show({
      step: STEPS[audience][index],
      anchor: STEPS[audience][index].anchor,
      mode: "tour",
      index,
      total: counts[audience],
      returnFocus: opener,
      handlers: { onNext: next, onPrev: previous, onSkip: skip, onClose: pause },
    });
  } else if (bubble) {
    popover.show({
      step: bubble.entry,
      anchor: bubble.entry.anchor,
      mode: "bubble",
      returnFocus: bubble.opener,
      handlers: { onNext: closeBubble, onClose: closeBubble },
    });
  }
}

function openTour(audience, { index = 0, opener } = {}) {
  if (!AUDIENCES.includes(audience) || inPractice()) return false;
  bubble = null;
  launcher.hideOffer();
  launcher.closeMenu();
  const target = Math.min(Math.max(0, index), lastIndex(audience));
  active = {
    audience,
    index: target,
    opener: opener || popover.current()?.returnFocus || launcher.button,
  };
  store.update((state) => {
    state.offerDismissed = true;
    state.audience = audience;
    state.steps[audience] = { index: target, done: false };
  });
  // The steps point at the library view; bring it up first when the visitor is in another area.
  const library = document.querySelector("#library-view");
  if (library?.hidden) document.querySelector('#hub-tabs [data-view="library"]')?.click();
  present();
  launcher.render();
  return true;
}

function resumeTour({ opener } = {}) {
  const audience = partialAudience(store.get(), counts);
  return audience
    ? openTour(audience, { index: store.get().steps[audience].index, opener })
    : false;
}

function restartTour(audience = "student", { opener } = {}) {
  store.reset(audience);
  return openTour(audience, { index: 0, opener });
}

function move(delta) {
  if (!active) return;
  active.index = Math.min(Math.max(0, active.index + delta), lastIndex(active.audience));
  store.setStep(active.audience, active.index);
  present();
}
const previous = () => move(-1);
function next() {
  if (!active) return;
  if (active.index >= lastIndex(active.audience)) {
    store.finish(active.audience, lastIndex(active.audience));
    endTour();
  } else move(1);
}
function skip() {
  if (active) store.reset(active.audience);
  endTour();
}
// Close (x or Esc) keeps the saved step so "Resume tour" continues from here.
const pause = () => endTour();

function endTour({ restoreFocus = true } = {}) {
  active = null;
  popover.close({ restoreFocus });
  launcher.render();
}

function openBubble(entry, opener) {
  if (inPractice()) return;
  active = null;
  bubble = { entry, opener };
  present();
}
function closeBubble() {
  bubble = null;
  popover.close();
}

function closeAll({ restoreFocus = true } = {}) {
  active = null;
  bubble = null;
  popover.close({ restoreFocus });
  launcher.render();
}

// Entering a practice session pauses everything: the saved step stays, the tour just closes.
function syncPractice() {
  const practice = inPractice();
  launcher.setPractice(practice);
  // The offer sits above the intro, so it follows the library view: gone in Games, My progress and so on.
  launcher.setOfferVisible(!document.querySelector("#library-view")?.hidden);
  if (practice) launcher.hideOffer();
  if (practice && popover.isOpen()) closeAll({ restoreFocus: false });
}

function init() {
  launcher.mountBubbles((entry, node) => openBubble(entry, node));
  document
    .querySelector("#tour-open")
    ?.addEventListener("click", (event) => launcher.openMenu(event.currentTarget));
  const view = workspace();
  const watch = new MutationObserver(syncPractice);
  if (view) watch.observe(view, { attributes: true, attributeFilter: ["hidden"] });
  const library = document.querySelector("#library-view");
  if (library) watch.observe(library, { attributes: true, attributeFilter: ["hidden"] });
  watch.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  new MutationObserver(() => {
    launcher.render();
    if (popover.isOpen()) present();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  syncPractice();

  const requested = requestedTour(LAUNCH.search);
  if (requested) {
    openTour(requested, { opener: launcher.button });
    return;
  }
  const offerIt = shouldOffer({
    stateSaved: stateExists(storage),
    state: store.get(),
    storageKeys: storageKeys(),
    search: LAUNCH.search,
    hash: LAUNCH.hash,
    workspaceVisible: inPractice(),
    tourOpen: Boolean(active),
  });
  if (!offerIt) return;
  launcher.showOffer(document.querySelector("#main"), {
    student: (node) => openTour("student", { opener: node }),
    family: (node) => openTour("family", { opener: node }),
    dismiss: () => {
      store.dismissOffer();
      launcher.hideOffer();
      launcher.button.focus();
    },
  });
}

if (document.readyState === "loading" || document.readyState === "interactive") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else init();

export { openTour, resumeTour, restartTour, closeAll as closeTour, openBubble };
export const openHelpBubble = (id) => {
  const entry = BUBBLES.find((candidate) => candidate.id === id);
  const node = document.querySelector(`[data-bubble="${id}"]`);
  if (entry && node) openBubble(entry, node);
};
export const tourState = () => store.get();
export const hasPartialTour = (audience) => isPartial(store.get(), audience, counts[audience]);
window.fluencyTour = {
  openTour,
  resumeTour,
  restartTour,
  closeTour: closeAll,
  openHelpBubble,
  tourState,
};
