// Student-safe activity player. URL: play/#a=<activityId>&t=<tier>&l=<lessonId>&mode=student|projector[&tp=1][&next=<activityId>]
// No network except the module imports. No answers or teacher notes are rendered by this page.
import { encodeCode } from "../core/evidence.js";
import { h } from "../core/dom.js";
import { isMuted, setMuted, stop } from "../core/speech.js";
import { ENGINE_LOADERS, mountActivity } from "../engines/engine-core.js";
import { TIERS, TIER_IDS } from "../data/taxonomy.js";

const ID = /^[a-z0-9-]+$/;
const root = document.getElementById("stp-root");
const titleEl = document.getElementById("stp-title");
const tierHost = document.getElementById("stp-tier");
const muteBtn = document.getElementById("stp-mute");
const projBtn = document.getElementById("stp-projector");
let live = 0; // generation counter: a stale async mount never paints over a newer one

/** Parse the hash (and ?projector=1) into validated params. Anything invalid is dropped, never interpolated. */
export function parseParams(hash = location.hash, search = location.search) {
  const q = new URLSearchParams(String(hash).replace(/^#/, ""));
  const s = new URLSearchParams(search);
  const clean = (v) => (typeof v === "string" && v.length <= 80 && ID.test(v) ? v : null);
  const t = q.get("t");
  const mode =
    q.get("mode") === "projector" || s.get("projector") === "1" ? "projector" : "student";
  return {
    aid: clean(q.get("a")),
    tier: TIER_IDS.includes(t) ? t : "dev",
    lessonId: clean(q.get("l")) || undefined,
    mode,
    tierPicker: q.get("tp") === "1",
    next: clean(q.get("next")),
  };
}

function say(kind, title, body, actions = []) {
  root.textContent = "";
  const card = h(
    "section",
    { class: "stp-card", "aria-labelledby": "stp-msg" },
    h("h2", { id: "stp-msg", tabindex: "-1" }, title),
    h("p", {}, body),
    h("div", { class: "stp-actions" }, actions),
  );
  card.dataset.kind = kind;
  root.append(card);
  card.querySelector("h2").focus();
}

async function loadActivity(id) {
  const dir = String(id).startsWith("wida-") ? "wida" : "activities";
  const mod = await import(`../data/${dir}/${id}.js`);
  const a = mod.default;
  if (!a || a.id !== id) throw new Error("That activity file does not match its link.");
  if (!ENGINE_LOADERS[a.engine])
    throw new Error(`This activity needs an engine that is not available (${a.engine}).`);
  return a;
}

function paintMute() {
  muteBtn.setAttribute("aria-pressed", String(isMuted()));
  muteBtn.textContent = isMuted() ? "Sound is off" : "Sound off";
  muteBtn.setAttribute("aria-label", isMuted() ? "Turn sound on" : "Mute sound");
}
muteBtn.addEventListener("click", () => {
  setMuted(!isMuted());
  paintMute();
});
paintMute();

function setProjector(on) {
  document.documentElement.classList.toggle("st-projector", on);
  projBtn.setAttribute("aria-pressed", String(on));
  projBtn.textContent = on ? "Normal size" : "Big screen";
}
projBtn.addEventListener("click", () =>
  setProjector(!document.documentElement.classList.contains("st-projector")),
);

function buildTierPicker(ctx) {
  tierHost.hidden = false;
  tierHost.textContent = "";
  tierHost.append(
    h("span", { class: "stp-tier-label", id: "stp-tier-label" }, "Support level (teacher)"),
  );
  const group = h("div", { class: "stp-tier", role: "group", "aria-labelledby": "stp-tier-label" });
  const buttons = TIERS.map((t) => {
    const b = h(
      "button",
      { type: "button", class: "st-pill", title: t.levels, onclick: () => ctx.setTier(t.id) },
      t.short,
    );
    return [t.id, b];
  });
  const paint = () =>
    buttons.forEach(([id, b]) => b.setAttribute("aria-pressed", String(id === ctx.tier)));
  for (const [, b] of buttons) group.append(b);
  tierHost.append(group);
  ctx.onTier(paint);
  paint();
}

function finishScreen(params, activity, attempt) {
  const items = attempt.items || [];
  const firstTry = items.filter((i) => i.ok && i.tries <= 1 && !i.hints).length;
  const saved = params.mode === "student";
  const code = saved ? encodeCode({ ...attempt, t: new Date().toISOString() }) : "";
  const area = h("textarea", {
    class: "stp-code",
    readonly: true,
    "aria-label": "Your results code",
    rows: "4",
  });
  area.value = code;
  const status = h("p", { class: "stp-note", role: "status", "aria-live": "polite" });
  const copy = h(
    "button",
    {
      type: "button",
      class: "st-btn st-primary",
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(code);
          status.textContent = "Copied. Paste it where your teacher asks.";
        } catch {
          area.focus();
          area.select();
          status.textContent = "Press Control+C (or Command+C) to copy the selected code.";
        }
      },
    },
    "Copy my results code",
  );
  const again = h(
    "button",
    { type: "button", class: "st-btn", onclick: () => start() },
    "Try again",
  );
  const actions = [again];
  if (params.next) {
    actions.push(
      h(
        "a",
        {
          class: "st-btn",
          href: `#a=${params.next}&t=${params.tier}${params.lessonId ? `&l=${params.lessonId}` : ""}${params.mode === "projector" ? "&mode=projector" : ""}`,
          style: "display:inline-flex;align-items:center;text-decoration:none",
        },
        "Next activity",
      ),
    );
  }
  root.textContent = "";
  const card = h(
    "section",
    { class: "stp-card", "aria-labelledby": "stp-done" },
    h("h2", { id: "stp-done", tabindex: "-1" }, "You finished"),
    h(
      "p",
      {},
      items.length
        ? `You finished ${items.length} ${items.length === 1 ? "item" : "items"}. ${firstTry} ${firstTry === 1 ? "was" : "were"} right on the first try with no hint.`
        : "Nice work. You finished the activity.",
    ),
    saved
      ? h(
          "div",
          {},
          h("h3", {}, "Your results code"),
          h(
            "p",
            { class: "stp-note" },
            "This code has no name in it. It only shows how the activity went on this device. Give it to your teacher only if they ask for it.",
          ),
          area,
          h("div", { class: "stp-actions" }, copy),
          status,
        )
      : h(
          "p",
          { class: "stp-note" },
          "This was a practice run on the big screen, so no results were saved.",
        ),
    h("div", { class: "stp-actions" }, actions),
  );
  root.append(card);
  card.querySelector("h2").focus();
}

async function start() {
  const gen = ++live;
  stop();
  const params = parseParams();
  tierHost.hidden = true;
  setProjector(
    params.mode === "projector" || document.documentElement.classList.contains("st-projector"),
  );
  if (!params.aid) {
    titleEl.textContent = "Activity not found";
    return say("error", "This link is missing an activity", "Ask your teacher for the link again.");
  }
  titleEl.textContent = "Opening your activity";
  root.textContent = "";
  root.append(h("p", { class: "stp-loading", role: "status" }, "Loading..."));
  let activity;
  try {
    activity = await loadActivity(params.aid);
  } catch (err) {
    if (gen !== live) return;
    titleEl.textContent = "Activity not found";
    const msg = /Failed to fetch|Cannot find|error loading|Importing a module/i.test(
      String(err?.message),
    )
      ? "That activity could not be opened. Check the link, then try again."
      : String(err?.message || "That activity could not be opened.");
    return say("error", "We could not open that activity", msg, [
      h(
        "button",
        { type: "button", class: "st-btn st-primary", onclick: () => start() },
        "Try again",
      ),
    ]);
  }
  if (gen !== live) return;
  titleEl.textContent = activity.title;
  document.title = `${activity.title} - BCPSS Teacher Studio`;
  root.textContent = "";
  try {
    const ctx = await mountActivity({
      root,
      activity,
      tier: params.tier,
      mode: params.mode,
      lessonId: params.lessonId,
      onDone: (attempt) => {
        if (gen === live) finishScreen(params, activity, attempt);
      },
    });
    if (params.tierPicker && gen === live) buildTierPicker(ctx);
    window.__studioCtx = ctx;
  } catch (err) {
    if (gen !== live) return;
    say(
      "error",
      "Something went wrong",
      "The activity did not start. Try again, or ask your teacher for help.",
      [
        h(
          "button",
          { type: "button", class: "st-btn st-primary", onclick: () => start() },
          "Try again",
        ),
      ],
    );
    console.error(err);
  }
}

window.addEventListener("hashchange", start);
start();
