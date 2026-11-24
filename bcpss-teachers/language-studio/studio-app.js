// Language Studio Player — shell: routing, state, level switch, activity runner, celebration, ctx construction.
import { renderHome } from "./studio-home.js";
import { lessonKeep, lessonRoute, renderLessonPage } from "./studio-lessons.js";
import { objectiveFor, recapFor } from "./studio-objective.js";
import {
  LEVELS,
  LEVEL_INFO,
  activityStateKey,
  announce,
  esc,
  gradeBand,
  h,
  loadProgress,
  makeVocabIcon,
  reducedMotion,
  rng,
  saveProgress,
  shuffle,
  starSvg,
  stopSpeaking,
  storeGet,
  storeSet,
  tts,
} from "./studio-core.js";

const KINDS = new Set([
  "word_sort",
  "match",
  "cloze",
  "unscramble",
  "dictogloss",
  "info_gap",
  "error_analysis",
  "sentence_combine",
  "quiz",
  "talk_cards",
  "write_scaffold",
  "sequence",
  "clue_game",
  "read_annotate",
  "flash_retrieval",
  "listen_and_show",
  "sentence_xray",
  "speak_and_record",
  "exit_check",
  "point_and_say",
  "tpr_cards",
  "home_language_bridge",
  "cognate_detective",
  "morph_lab",
  "paragraph_builder",
  "mission_escape",
]);
const main = document.getElementById("stMain");
const levelHost = document.getElementById("stLevel");
const fx = document.getElementById("stFx");
const app = {
  detail: null,
  unit: null,
  studio: null,
  unitId: "",
  level: "l3_4",
  progress: null,
  band: "g68",
  family: false,
  allowed: () => true,
};
const FAMILY_KINDS = new Set(["match", "word_sort", "clue_game", "cloze", "unscramble", "quiz", "sequence", "talk_cards"]);
let cleanup = null;
let routeToken = 0;

// ---------- URL + navigation ----------
function currentIndex() {
  const n = Number.parseInt(new URLSearchParams(location.search).get("a") || "", 10);
  return Number.isInteger(n) && n >= 1 && n <= (app.studio?.activities.length || 0) && app.allowed(n) ? n : null;
}
function urlFor(index, keep = null) {
  const p = new URLSearchParams();
  p.set("unit", app.unitId);
  if (index) p.set("a", String(index));
  else for (const [k, v] of Object.entries(keep || {})) p.set(k, v);
  p.set("level", app.level);
  if (app.family) p.set("mode", "family");
  return `${location.pathname}?${p}`;
}
export function go(index, { replace = false } = {}) {
  const url = urlFor(index);
  if (replace) history.replaceState(null, "", url);
  else history.pushState(null, "", url);
  route();
  if (!replace) window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
}
Object.assign(app, { go, route: () => route(), hasKind: (kind) => KINDS.has(kind) });

function setLevel(level) {
  if (!LEVELS.includes(level) || level === app.level) return;
  app.level = level;
  app.progress = saveProgress(app.unitId, { level });
  history.replaceState(null, "", urlFor(currentIndex(), lessonKeep()));
  renderLevelSwitch();
  announce(`${LEVEL_INFO[level].name} level selected.`);
  route();
}
app.setLevel = setLevel;

function renderLevelSwitch() {
  levelHost.replaceChildren(
    ...LEVELS.map((level) => {
      const info = LEVEL_INFO[level];
      return h(
        "button",
        {
          type: "button",
          "aria-pressed": String(level === app.level),
          "aria-label": `${info.name} (${info.wida})`,
          title: `${info.name}: ${info.wida}`,
          onclick: () => setLevel(level),
        },
        info.name,
      );
    }),
  );
}

// ---------- activity ctx ----------
function makeCtx(index, activity, root, onDone) {
  const vocabIcon = makeVocabIcon(app.studio.vocab);
  const key = activityStateKey(app.unitId, index);
  return {
    unit: app.unit,
    studio: app.studio,
    activity,
    payload: activity.payload,
    level: app.level,
    rng,
    shuffle,
    tts,
    esc,
    announce,
    vocabIcon,
    done: onDone,
    saveState: (obj) => storeSet(key, obj),
    loadState: () => storeGet(key),
    root,
  };
}

function confetti() {
  if (reducedMotion() || app.family) return;
  const colors = [
    "--st-listening",
    "--st-reading",
    "--st-speaking",
    "--st-writing",
    "--st-vocab",
    "--st-star",
  ];
  fx.replaceChildren();
  for (let i = 0; i < 44; i++) {
    const piece = h("span", { class: "st-confetti" });
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = `var(${colors[i % colors.length]})`;
    piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 240}px`);
    piece.style.setProperty("--r", `${360 + Math.random() * 540}deg`);
    piece.style.setProperty("--t", `${1.8 + Math.random() * 1.4}s`);
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    fx.append(piece);
  }
  window.setTimeout(() => fx.replaceChildren(), 3600);
}

const STAR_WORDS = {
  3: "Brilliant — nearly all first try!",
  2: "Strong work — you kept going and got it.",
  1: "You finished it. Try again later for more stars!",
};
function celebrate(index, result, winHost) {
  const stars = Math.max(1, Math.min(3, Math.round(result?.stars || 1)));
  const prev = app.progress.stars[index] || 0;
  app.progress = saveProgress(app.unitId, {
    stars: { ...app.progress.stars, [index]: Math.max(prev, stars) },
    last: index,
  });
  const acts = app.studio.activities;
  const nextIdx =
    acts.findIndex((_, i) => i + 1 > index && app.allowed(i + 1) && !app.progress.stars[i + 1]) + 1 ||
    acts.findIndex((_, i) => i + 1 > index && app.allowed(i + 1)) + 1;
  const heading = h(
    "h2",
    { tabindex: "-1" },
    stars === 3 ? "Awesome!" : stars === 2 ? "Nice work!" : "Done!",
  );
  const recap = recapFor(acts[index - 1].kind, app.level);
  const actions = h(
    "div",
    { class: "st-win__actions" },
    nextIdx
      ? h(
          "button",
          {
            type: "button",
            class: "st-btn st-btn--primary st-btn--lg",
            onclick: () => go(nextIdx),
          },
          `Next: ${acts[nextIdx - 1].title} →`,
        )
      : h(
          "button",
          { type: "button", class: "st-btn st-btn--primary st-btn--lg", onclick: () => go(null) },
          "Back to the studio",
        ),
    h("button", { type: "button", class: "st-btn", onclick: () => go(index) }, "Play again"),
    nextIdx
      ? h(
          "button",
          { type: "button", class: "st-btn st-btn--ghost", onclick: () => go(null) },
          "All activities",
        )
      : null,
  );
  winHost.replaceChildren(
    h(
      "section",
      { class: "st-win", "aria-label": "Activity complete" },
      h(
        "div",
        { class: "st-stars", role: "img", "aria-label": `${stars} of 3 stars` },
        [1, 2, 3].map((n) => starSvg(n <= stars)),
      ),
      heading,
      h("p", { class: "st-win__detail" }, result?.detail || STAR_WORDS[stars]),
      h(
        "div",
        { class: "st-win__recap" },
        h("p", { class: "st-win__recap-label" }, "What you can say now"),
        h("p", null, recap),
      ),
      actions,
    ),
  );
  announce(`Activity complete. ${stars} of 3 stars.`);
  confetti();
  winHost.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  heading.focus({ preventScroll: true });
}

/** Starter-band word help: every unit word with its picture cue, Spanish word and kid definition. */
function wordHelp() {
  const vocab = app.studio?.vocab || [];
  if (app.level !== "l1_2" || !vocab.length) return null;
  return h(
    "details",
    { class: "st-wordhelp" },
    h("summary", null, "Word help: pictures and Spanish"),
    h(
      "ul",
      { class: "st-wordhelp__list" },
      ...vocab.map((v) =>
        h(
          "li",
          { class: "st-wordhelp__item" },
          v.icon ? h("span", { class: "st-wordhelp__icon", "aria-hidden": "true" }, v.icon) : null,
          h("b", null, v.term),
          v.es ? h("span", { class: "st-wordhelp__es" }, ` ${v.es}`) : null,
          h("span", { class: "st-wordhelp__def" }, v.def),
        ),
      ),
    ),
  );
}

function placeholder(root, activity, err) {
  root.replaceChildren(
    h(
      "div",
      { class: "st-card st-stage--placeholder" },
      h("h2", null, "This activity is getting its finishing touches"),
      h(
        "p",
        { class: "st-run__mission" },
        err
          ? "Something went wrong loading it. Try again, or move on to the next one."
          : "Check back soon — it will be ready shortly.",
      ),
      h(
        "p",
        null,
        h(
          "button",
          { type: "button", class: "st-btn", onclick: () => go(null) },
          "Back to all activities",
        ),
      ),
    ),
  );
}

async function showActivity(index) {
  const activity = app.studio.activities[index - 1];
  const shown = app.studio.activities.map((_, i) => i + 1).filter((i) => app.allowed(i));
  const total = shown.length;
  const position = shown.indexOf(index) + 1;
  const domain = activity.domain;
  const earned = app.progress.stars[index] || 0;
  const support = activity.support?.[app.level];
  const goal = objectiveFor(activity.kind, app.level);
  const winHost = h("div", { "aria-live": "polite" });
  const stage = h("section", { class: "st-stage", "aria-label": activity.title });
  const head = h(
    "header",
    { class: "st-run__head" },
    h(
      "div",
      { class: "st-run__bar" },
      h(
        "button",
        { type: "button", class: "st-btn st-btn--ghost st-btn--sm", onclick: () => go(null) },
        "← All activities",
      ),
      h("span", { class: "st-tag", "data-domain": domain }, domain),
      h("span", { class: "st-tag" }, `${activity.minutes} min`),
      h("span", { class: "st-tag" }, activity.grouping),
      h(
        "span",
        { class: "st-run__count" },
        `Activity ${position} of ${total}${earned ? ` · ${earned} ★` : ""}`,
      ),
    ),
    h(
      "div",
      {
        class: "st-ribbon",
        role: "progressbar",
        "aria-label": `Activity ${position} of ${total} in this studio`,
        "aria-valuemin": "1",
        "aria-valuemax": String(total),
        "aria-valuenow": String(position),
      },
      h("span", {
        class: "st-ribbon__bar",
        style: `--st-p:${String(total ? position / total : 0)}`,
      }),
    ),
    h("h1", { id: "stRunTitle" }, activity.title),
    h(
      "p",
      { class: "st-run__goal" },
      h("span", { class: "st-run__goal-tag" }, "Language goal"),
      h("b", { class: "st-run__goal-fn" }, goal.fn),
      h("span", { class: "st-run__goal-can" }, goal.can),
    ),
    h("p", { class: "st-run__mission" }, activity.mission),
    support
      ? h(
          "p",
          { class: "st-run__support" },
          h("b", null, `${LEVEL_INFO[app.level].name} tip:`),
          h("span", null, support),
        )
      : null,
    wordHelp(),
    activity.tip && !app.family
      ? h(
          "details",
          { class: "st-tip" },
          h("summary", null, "Teacher tip"),
          h("p", null, activity.tip),
        )
      : null,
  );
  main.replaceChildren(
    h("div", { class: "st-run st-view", "data-domain": domain }, head, winHost, stage),
  );

  const root = h("div", { class: "st-kind", "data-kind": activity.kind });
  stage.append(root);
  let finished = false;
  const ctx = makeCtx(index, activity, root, (result) => {
    if (finished) return;
    finished = true;
    celebrate(index, result, winHost);
  });
  const token = routeToken;
  if (!KINDS.has(activity.kind)) return placeholder(root, activity, null);
  try {
    const mod = await import(`./studio-kinds/${activity.kind}.js`);
    if (token !== routeToken) return;
    const result = mod.default(root, ctx);
    cleanup = typeof result === "function" ? result : null;
  } catch (err) {
    console.warn(`[studio] ${activity.kind} unavailable:`, err);
    if (token === routeToken) placeholder(root, activity, err);
  }
}

// ---------- routing ----------
function route() {
  routeToken++;
  stopSpeaking();
  try {
    cleanup?.();
  } catch (err) {
    console.warn("[studio] cleanup failed", err);
  }
  cleanup = null;
  fx.replaceChildren();
  const index = currentIndex();
  if (index) {
    showActivity(index);
    document.title = `${app.studio.activities[index - 1].title} — ${app.unit.unit_title} · Language Studio`;
  } else if (lessonRoute() && !app.family) {
    cleanup = renderLessonPage(main, app);
  } else {
    renderHome(main, app);
    document.title = `${app.unit.unit_title} — Language Studio`;
  }
}

function fail(title, text, retry) {
  main.replaceChildren(
    h(
      "div",
      { class: "st-fail st-card" },
      h("h1", null, title),
      h("p", { class: "st-run__mission" }, text),
      h(
        "p",
        { style: "margin-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap" },
        retry
          ? h(
              "button",
              { type: "button", class: "st-btn st-btn--primary", onclick: retry },
              "Try again",
            )
          : null,
        h("a", { class: "st-btn", href: "/bcpss-teachers/" }, "Back to BCPSS Teachers"),
      ),
    ),
  );
}

async function boot() {
  const params = new URLSearchParams(location.search);
  app.unitId = (params.get("unit") || "").replace(/[^a-z0-9_-]/gi, "");
  if (!app.unitId)
    return fail(
      "Pick a unit to begin",
      "Open the Language Studio from a unit page in BCPSS Teachers.",
      null,
    );
  let detail;
  try {
    const res = await fetch(`/api/bcpss/units/${encodeURIComponent(app.unitId)}`, {
      headers: { accept: "application/json" },
    });
    if (res.status === 404)
      return fail(
        "We could not find that unit",
        "Check the link, or choose a unit from BCPSS Teachers.",
        null,
      );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    detail = await res.json();
  } catch (err) {
    console.warn("[studio] load failed", err);
    return fail("The studio did not load", "Check your connection and try again.", () =>
      location.reload(),
    );
  }
  if (!detail?.studio?.activities?.length)
    return fail(
      "This studio is not ready yet",
      "The activities for this unit are still being written.",
      null,
    );
  app.family = params.get("mode") === "family";
  app.allowed = (i) => !app.family || FAMILY_KINDS.has(detail.studio.activities[i - 1]?.kind);
  if (app.family) {
    document.documentElement.dataset.mode = "family";
    const back = document.getElementById("stBack");
    back.href = `/family/bcpss/?unit=${encodeURIComponent(app.unitId)}`;
    back.setAttribute("aria-label", "Back to family guide");
    back.querySelector("span").textContent = "Back to family guide";
  }
  Object.assign(app, {
    detail,
    unit: detail.unit,
    studio: detail.studio,
    band: gradeBand(detail.unit.grade),
  });
  document.documentElement.dataset.band = app.band;
  app.progress = loadProgress(app.unitId);
  const wanted = params.get("level");
  app.level = LEVELS.includes(wanted)
    ? wanted
    : LEVELS.includes(app.progress.level)
      ? app.progress.level
      : app.band === "k2"
        ? "l1_2"
        : "l3_4";
  renderLevelSwitch();
  route();
  window.addEventListener("popstate", route);
}

boot();
