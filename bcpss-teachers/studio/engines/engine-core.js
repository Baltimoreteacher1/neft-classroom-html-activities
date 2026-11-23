// Shared engine kernel: the Attempt -> Evidence -> Feedback -> Revision -> New attempt loop, support tiers,
// accessible feedback, progress save/resume, and the evidence record. Every engine mounts through this.
//
// An engine module is:  export default { id, mount(ctx) }
// ctx = createContext({ root, activity, tier, mode, lessonId })   (see below)
import { announce, esc, h } from "../core/dom.js";
import { recordAttempt } from "../core/evidence.js";
import { read, remove, write } from "../core/store.js";
import { isMuted, setMuted, speak } from "../core/speech.js";
import { TIER_IDS, TIERS } from "../data/taxonomy.js";

export const MODES = ["student", "projector", "preview"];

/** Resolve the support object for one item at one tier. Missing tiers fall back to the nearest richer one. */
export function supportFor(item, tier) {
  const s = item?.supports || {};
  if (s[tier]) return s[tier];
  const i = TIER_IDS.indexOf(tier);
  for (let k = i; k >= 0; k--) if (s[TIER_IDS[k]]) return s[TIER_IDS[k]];
  for (let k = i + 1; k < TIER_IDS.length; k++) if (s[TIER_IDS[k]]) return s[TIER_IDS[k]];
  return {};
}

/**
 * One item's feedback loop. Pure state machine; engines render around it.
 *   const loop = createItemLoop(item);
 *   const r = loop.submit({ ok, pick, tag })   // pick/tag match item.misconceptions
 *   r = { ok, kind:"right"|"retry"|"model"|"transfer", text, hintIndex, tries, transfer? }
 */
export function createItemLoop(item, { maxTries = 3 } = {}) {
  const st = { tries: 0, hints: 0, ok: false, tags: [], transferShown: false };
  const hints = item.hints || [];
  const miss = (sub) =>
    (item.misconceptions || []).find((m) => (m.pick != null && m.pick === sub.pick) || (m.match && m.match === sub.tag));
  return {
    state: st,
    nextHint() {
      if (!hints.length) return null;
      const text = hints[Math.min(st.hints, hints.length - 1)];
      st.hints += 1;
      return text;
    },
    submit(sub) {
      st.tries += 1;
      if (sub.ok) {
        st.ok = true;
        return { ok: true, kind: "right", text: item.right || item.explain || "That works.", tries: st.tries };
      }
      const m = miss(sub);
      if (m?.tag) st.tags.push(m.tag);
      else if (sub.tag) st.tags.push(sub.tag);
      if (st.tries >= maxTries + 1 && item.transfer && !st.transferShown) {
        st.transferShown = true;
        return { ok: false, kind: "transfer", text: m?.hint || "Let's try a related one.", transfer: item.transfer, tries: st.tries };
      }
      if (st.tries >= maxTries) {
        return { ok: false, kind: "model", text: m?.model || m?.hint || item.model || "Here is a model to look at.", hintIndex: st.hints, tries: st.tries };
      }
      return {
        ok: false,
        kind: "retry",
        text: m?.hint || hints[Math.min(st.hints, hints.length - 1)] || "Look again at the model, then try once more.",
        tries: st.tries,
      };
    },
    record: () => ({ id: item.id, tries: st.tries, hints: st.hints, ok: st.ok, tags: [...new Set(st.tags)] }),
  };
}

/** Feedback element with correct live-region semantics. kind: right | retry | model | transfer | hint */
export function feedbackBox() {
  const box = h("div", { class: "st-feedback", role: "status", "aria-live": "polite", hidden: true });
  return {
    el: box,
    show(kind, text) {
      box.hidden = false;
      box.dataset.kind = kind;
      box.textContent = "";
      const label = { right: "Correct", retry: "Try again", model: "Look at the model", transfer: "Try a related one", hint: "Hint" }[kind] || "";
      box.append(h("strong", {}, label ? `${label}. ` : ""), document.createTextNode(text));
    },
    hide() {
      box.hidden = true;
      box.textContent = "";
    },
  };
}

/** The support panel for one item: frames, word bank, visual, oral rehearsal. Tier-aware, never changes the task. */
export function supportPanel(item, tier, { onSpeak = true } = {}) {
  const s = supportFor(item, tier);
  const parts = [];
  if (s.directions) parts.push(h("p", { class: "st-support-directions" }, s.directions));
  if (s.oral) parts.push(h("p", { class: "st-support-oral" }, h("strong", {}, "Say it first: "), s.oral));
  if (s.frames?.length)
    parts.push(
      h("ul", { class: "st-frames", "aria-label": "Sentence frames" }, s.frames.map((f) => h("li", {}, f))),
    );
  if (s.wordBank?.length)
    parts.push(
      h(
        "ul",
        { class: "st-wordbank", "aria-label": "Word bank" },
        s.wordBank.map((w) =>
          h("li", {}, onSpeak ? h("button", { type: "button", class: "st-chip", onclick: () => speak(w) }, w) : w),
        ),
      ),
    );
  if (s.hint) parts.push(h("p", { class: "st-support-hint" }, s.hint));
  const el = h("div", { class: "st-support", "data-tier": tier }, parts);
  el.hidden = parts.length === 0;
  return { el, support: s };
}

export function tierPicker(current, onChange, { label = "Support" } = {}) {
  const wrap = h("div", { class: "st-tierpick", role: "group", "aria-label": `${label} level` });
  for (const t of TIERS) {
    wrap.append(
      h(
        "button",
        { type: "button", class: "st-pill", "aria-pressed": String(t.id === current), onclick: () => onChange(t.id), title: t.levels },
        t.short,
      ),
    );
  }
  return wrap;
}

/**
 * createContext: everything an engine needs. Engines never touch storage or evidence directly.
 */
export function createContext({ root, activity, tier = "dev", mode = "student", lessonId, onDone } = {}) {
  if (!root || !activity?.id) throw new Error("createContext needs root and an activity with an id");
  const aid = activity.id;
  const items = new Map(); // id -> recorded item
  let reflection = "";
  let currentTier = tier;
  const progressKey = `progress.${aid}`;
  const listeners = new Set();

  const ctx = {
    root,
    activity,
    aid,
    mode,
    lessonId: lessonId || activity.lessonId,
    get tier() {
      return currentTier;
    },
    setTier(t) {
      if (!TIER_IDS.includes(t)) return;
      currentTier = t;
      for (const fn of listeners) fn(t);
    },
    onTier(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    supportFor: (item) => supportFor(item, currentTier),
    loop: (item, opts) => createItemLoop(item, opts),
    feedback: feedbackBox,
    supportPanel: (item) => supportPanel(item, currentTier),
    tierPicker: (label) => tierPicker(currentTier, (t) => ctx.setTier(t), { label }),
    speak,
    isMuted,
    setMuted,
    announce,
    esc,
    /** Record one finished item (call once per item when it settles or the learner moves on). */
    settle(loop) {
      const r = loop.record();
      items.set(r.id, r);
      return r;
    },
    /** Save/resume a small JSON state for this activity on this device. */
    save: (state) => write(progressKey, { t: Date.now(), tier: currentTier, state }),
    resume: () => read(progressKey, null),
    clearProgress: () => remove(progressKey),
    /** Finish: records anonymous evidence and returns the attempt (with share code available via core/evidence.js). */
    finish(text) {
      reflection = text || reflection;
      const attempt = {
        aid,
        eng: activity.engine,
        lesson: ctx.lessonId,
        tier: currentTier,
        items: [...items.values()],
        reflection,
      };
      if (mode === "student") recordAttempt(attempt);
      remove(progressKey);
      onDone?.(attempt);
      return attempt;
    },
    items,
  };
  return ctx;
}

/** Standard end-of-activity reflection block with tiered frames. Returns {el, value()} */
export function reflectionBlock(ctx, reflection = activityReflection(ctx)) {
  const supports = reflection.frames || {};
  const frames = supports[ctx.tier] || [];
  const ta = h("textarea", { class: "st-textarea", rows: "3", "aria-label": reflection.prompt, maxlength: "600" });
  const el = h(
    "section",
    { class: "st-reflect" },
    h("h3", {}, "Reflect"),
    h("p", {}, reflection.prompt),
    frames.length ? h("ul", { class: "st-frames" }, [].concat(frames).map((f) => h("li", {}, f))) : null,
    ta,
  );
  return { el, value: () => ta.value.trim() };
}
const activityReflection = (ctx) => ctx.activity.reflection || { prompt: "What did you learn? What would you try next?", frames: {} };

/** Engine registry loader used by the player and the teacher preview. Lazy: only the needed engine is fetched. */
export const ENGINE_LOADERS = {
  "visual-match": () => import("./visual-match.js"),
  "language-detective": () => import("./language-detective.js"),
  "concept-builder": () => import("./concept-builder.js"),
  "conversation-studio": () => import("./conversation-studio.js"),
  "escape-challenge": () => import("./escape-challenge.js"),
  "vocab-quest": () => import("./vocab-quest.js"),
  "argument-builder": () => import("./argument-builder.js"),
  "wida-studio": () => import("./wida-studio.js"),
  "early-sort": () => import("./early-sort.js"),
};

export async function mountActivity(opts) {
  const load = ENGINE_LOADERS[opts.activity.engine];
  if (!load) throw new Error(`Unknown engine "${opts.activity.engine}"`);
  const mod = await load();
  const ctx = createContext(opts);
  await mod.default.mount(ctx);
  return ctx;
}

/** Load an engine's own stylesheet once (relative to the engines folder). */
export function loadCss(name) {
  const href = new URL(`./${name}`, import.meta.url).href;
  if (document.querySelector(`link[data-st-css="${name}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  l.dataset.stCss = name;
  document.head.append(l);
}
