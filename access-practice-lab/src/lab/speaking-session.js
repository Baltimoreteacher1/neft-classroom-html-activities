// Speaking session: the browser glue between a game's saved flow state (speaking-flow.js), the AudioGuard that owns the
// microphone (audio-guard.js) and the markup (speaking-ui.js). One AudioGuard per record key lives in a module-level
// Map, never in saved game state, so the saved state stays JSON. A game calls:
//   bindSpeaking(root, key, handlers, changed)  from mount(): returns the cleanup mount() hands back
//   speakClick(button, key, handlers)           from click(): null when the button is not a speaking control
//   speakInput(field, handlers)                 from input(): true when the field was the typed answer
//   guardSnap(key)                              from view(): the guard's latest snapshot, for the level bar
// handlers = { get(), set(flow), env, text: { get(), set(text) }, frames?() }.
// Game mounts run after every render and their cleanup runs before the next one, so the guard outlives a cleanup and
// is only disposed (microphone released, recording stopped) when no mount claims it within GRACE_MS.
import { takesFor } from "../recorder.js";
import { playRecording } from "../speech.js";
import { AG, browserDeps, createAudioGuard } from "./audio-guard.js";
import * as F from "./speaking-flow.js";
import { planWait } from "./speaking-ui.js";

const GRACE_MS = 3000;
const FOCUS = {
  MONITORING_LEVEL: "[data-sp-rec]",
  RECORDING: "[data-sp-stop]",
  MIC_BLOCKED_FALLBACK: "#sp-fb-h",
  PLAYBACK_READY: "#sp-rv-h",
};
const entries = new Map(); // record key -> { guard, snap, h, root, changed, last, timer, drop, focus }

export const guardSnap = (key) => entries.get(key)?.snap;
export const memoryText = (key) => ({
  get: () => F.typedStore.get(key),
  set: (text) => F.typedStore.set(key, text),
});

function paintLevel(root, level) {
  const meter = root?.querySelector?.(".al-level");
  if (!meter) return;
  const pct = Math.round(Math.min(1, Math.max(0, Number(level) || 0)) * 100);
  meter.setAttribute("aria-valuenow", String(pct));
  meter.firstElementChild?.style.setProperty("--lvl", (pct / 100).toFixed(2));
}

function onGuard(key, snap) {
  const e = entries.get(key);
  if (!e) return;
  e.snap = snap;
  paintLevel(e.root, snap.level);
  if (snap.state === e.last) return; // a level tick: only the bar moves
  e.last = snap.state;
  const sp = e.h.get();
  if (sp) {
    const next = F.reduce(sp, {
      type: "GUARD",
      state: snap.state,
      reason: snap.reason,
      hasTake: Boolean(snap.take),
    });
    if (next !== sp) e.h.set(next);
  }
  e.focus = FOCUS[snap.state] || "";
  e.changed?.();
}

function entryFor(key, h) {
  let e = entries.get(key);
  if (!e) {
    e = {
      guard: null,
      snap: null,
      h,
      root: null,
      changed: null,
      last: AG.IDLE,
      timer: 0,
      drop: 0,
      focus: "",
    };
    entries.set(key, e);
  }
  e.h = h;
  return e;
}

/** The guard is created on first use: the device layer loads lazily, and nothing touches the microphone until a click asks. */
async function guardOf(key, e) {
  if (!e.guard) {
    const deps = await browserDeps();
    e.guard ||= createAudioGuard({
      deps,
      key,
      maxSeconds: e.h.maxSeconds || 90,
      onChange: (snap) => onGuard(key, snap),
    });
  }
  return e.guard;
}

function dispose(key) {
  const e = entries.get(key);
  if (!e) return;
  entries.delete(key);
  e.guard?.dispose();
}

export function bindSpeaking(root, key, h, changed) {
  const e = entryFor(key, h);
  clearTimeout(e.drop);
  e.drop = 0;
  e.root = root;
  e.changed = changed || e.changed;
  // Parts that only lived in memory (a take, typed text, a live recording) may be gone after a reload.
  const sp = h.get();
  if (!sp) return null;
  const fixed = F.recover(sp, {
    recording: e.guard?.state === AG.RECORDING,
    hasTake: takesFor(key).length > 0,
    hasText: Boolean(h.text.get()),
  });
  if (fixed !== sp) {
    h.set(fixed);
    queueMicrotask(() => e.changed?.());
  }
  clearTimeout(e.timer);
  const now = Date.now();
  if (h.get().phase === F.PHASE.PLAN) {
    h.set(F.reduce(h.get(), { type: "STAMP", now }));
    const left = F.planRemainingMs(h.get(), now, planWait(h.env));
    if (left > 0)
      e.timer = setTimeout(() => {
        root.querySelector("[data-sp-ready]")?.removeAttribute("disabled");
        const hint = root.querySelector("[data-sp-plan-hint]");
        if (hint)
          hint.textContent = h.env.I.S(
            "Press the button when you are ready. There is no rush.",
            "Pulsa el botón cuando estés listo. No hay prisa.",
          );
      }, left);
  }
  if (e.snap) paintLevel(root, e.snap.level);
  if (e.focus) {
    root.querySelector(e.focus)?.focus({ preventScroll: false });
    e.focus = "";
  }
  return () => {
    clearTimeout(e.timer);
    if (e.root === root) e.root = null;
    e.drop = setTimeout(() => {
      if (!e.root) dispose(key);
    }, GRACE_MS);
  };
}

const SP_ATTRS = [
  "data-sp-ready", "data-sp-mic", "data-sp-rec", "data-sp-stop", "data-sp-retry", "data-sp-nomic",
  "data-sp-typed-done", "data-sp-play", "data-sp-retake", "data-sp-finish",
];
const EVENT_FOCUS = {
  READY: "#sp-rd-h",
  NOREC: "#sp-fb-h",
  TYPED: "#sp-rv-h",
  PLAYED: "#sp-ck-h",
  RETAKE: "#sp-rd-h, #sp-fb-h",
};

/** Returns null for a button this module does not own, else { changed, done }. Device work runs after the click. */
export function speakClick(b, key, h) {
  const has = (name) => b.hasAttribute?.(name);
  const d = b.dataset || {};
  if (!SP_ATTRS.some(has) && d.spChip === undefined && d.spSelf === undefined) return null;
  const e = entryFor(key, h);
  const sp = h.get();
  if (!sp) return null;
  const go = (ev) => {
    const cur = h.get();
    const next = F.reduce(cur, ev);
    if (next === cur) return false;
    h.set(next);
    e.focus = EVENT_FOCUS[ev.type] || "";
    return true;
  };
  const out = (changed) => ({ changed, done: h.get().phase === F.PHASE.DONE });
  const withGuard = (fn) => {
    guardOf(key, e).then(fn).catch(() => {});
  };
  if (has("data-sp-ready")) return out(go({ type: "READY", now: Date.now(), minMs: planWait(h.env) }));
  for (const [attr, act] of [["data-sp-mic", "request"], ["data-sp-rec", "record"], ["data-sp-stop", "stop"]])
    if (has(attr)) {
      withGuard((g) => g[act]());
      return out(false);
    }
  if (has("data-sp-retry")) {
    const changed = go({ type: "RETRY" });
    withGuard((g) => g.retry());
    return out(changed);
  }
  if (has("data-sp-nomic")) {
    const changed = go({ type: "NOREC" });
    e.guard?.reset(); // releases a monitoring microphone
    return out(changed);
  }
  if (d.spChip !== undefined) {
    const chip = F.chipsFor(h.frames?.() || [], h.env.sup?.frames || "none")[Number(d.spChip)];
    if (!chip || !sp.blocked) return out(false);
    h.text.set(F.addChip(h.text.get(), chip));
    return out(true);
  }
  if (has("data-sp-typed-done")) return out(go({ type: "TYPED", words: F.countWords(h.text.get()) }));
  if (has("data-sp-play")) {
    if (!sp.typed && typeof window !== "undefined") {
      const take = takesFor(key).at(-1);
      if (take) playRecording(take.url);
    }
    return out(go({ type: "PLAYED" }));
  }
  if (has("data-sp-retake")) {
    const changed = go({ type: "RETAKE" });
    if (!sp.typed) withGuard((g) => g.retake());
    return out(changed);
  }
  if (d.spSelf !== undefined) {
    const [id, v] = String(d.spSelf).split(":");
    return out(go({ type: "ANSWER", id, v: v === "yes" }));
  }
  if (has("data-sp-finish")) return out(go({ type: "FINISH" }));
  return null;
}

/** The typed answer: kept in memory (or the game's own field), the done button follows the word count, no re-render. */
export function speakInput(el, h) {
  if (!el.matches?.("[data-sp-typed]")) return false;
  const text = String(el.value || "").slice(0, 400);
  h.text.set(text);
  const done = el.closest?.(".sp-fallback")?.querySelector?.("[data-sp-typed-done]");
  if (done) done.disabled = F.countWords(text) < F.TYPED_MIN_WORDS;
  return true;
}
