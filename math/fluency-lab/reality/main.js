// Math Reality: landing, world screen, save/resume. All learning logic lives in engine.js; this file only wires the
// engine to the stadium art, the linked representations, the coach card, the controls and storage.
import { h, s } from "../graphics/graphics-a-ui.js";
import { getLang, setLang, t } from "../i18n.js";
import { buildControls, updateControls } from "./controls.js";
import { renderCoach } from "./coach.js";
import {
  WORLDS,
  editable,
  evidenceOf,
  interpretIdea,
  missionFor,
  newSession,
  reduce,
  sanitizeSession,
} from "./engine.js";
import { renderRepresentations } from "./representations.js";
import { drawStadium } from "./stadium-art.js";
import { derive, setField } from "./stadium-math.js";
import { loadGrade, loadSave, writeSave } from "./storage.js";

const app = {
  save: loadSave(),
  grade: loadGrade(),
  mission: null,
  session: null,
  refs: null,
  vb: null,
  saveFailed: false,
  msg: null,
};
const root = document.getElementById("rl-app");
const reduced = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ---- persistence -------------------------------------------------------------------------------------------------
let timer = null;
function persist(now = false) {
  if (!app.session) return;
  app.save.worlds.stadium = {
    sessions: {
      ...(app.save.worlds.stadium?.sessions || {}),
      [app.session.missionId]: app.session,
    },
    active: app.session.missionId,
  };
  const write = () => {
    app.saveFailed = !writeSave(app.save);
    const note = document.getElementById("rl-save-note");
    if (note) note.hidden = !app.saveFailed;
  };
  clearTimeout(timer);
  if (now) write();
  else timer = setTimeout(write, 250);
}
addEventListener("pagehide", () => persist(true));
document.addEventListener(
  "visibilitychange",
  () => document.visibilityState === "hidden" && persist(true),
);

// ---- the world screen --------------------------------------------------------------------------------------------
function dispatch(action, { quiet = false } = {}) {
  const before = app.session;
  const after = reduce(before, action, app.mission);
  if (after === before) return;
  app.session = after;
  if (before.step !== "done" && after.step === "done") {
    app.save.completed = [
      ...app.save.completed,
      {
        missionId: after.missionId,
        at: Date.now(),
        evidence: evidenceOf(after),
        reflection: after.reflection,
      },
    ].slice(-100);
  }
  persist(after.step === "done" || before.step !== after.step);
  if (quiet) return;
  renderWorld({ focus: before.step !== after.step ? "title" : "feedback" });
}

function readouts() {
  const { mission, session } = app;
  const problem =
    session.step === "apply"
      ? mission.apply(session.apply.seed, session.apply.before ?? session.state)
      : null;
  return {
    hidden: Boolean(problem && problem.kind === "number" && session.apply.attempts === 0),
    problem,
  };
}

function stageOptions() {
  const { mission, session } = app;
  const o =
    session.step === "observe" || ["explain", "apply", "reflect", "done"].includes(session.step)
      ? session.observed
      : null;
  const base = session.base;
  const opts = { labels: null };
  if (mission.visual === "grid" || mission.visual === "scale") {
    opts.grid = true;
    opts.labels = { length: `${session.state.length} m`, width: `${session.state.width} m` };
    opts.handle = editable(session.step);
  }
  if (mission.visual === "groups") opts.arrangement = "groups";
  if (mission.visual === "ratio") opts.fill = true;
  if (mission.visual === "cost")
    opts.labels = { length: `${session.state.length} m`, width: `${session.state.width} m` };
  if (mission.visual === "scale" && base && session.step !== "create") {
    opts.ghost = base;
    const kx = session.state.length / base.length;
    const ky = session.state.width / base.width;
    if (o && Number.isInteger(kx) && kx === ky && kx >= 2 && kx <= 6) opts.tiles = { kx, ky };
  }
  return opts;
}

const parseBox = (value) => (value ? value.split(" ").map(Number) : null);
function tweenCamera(svg, from, to) {
  if (!from || reduced()) return;
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / 380);
    const e = 1 - (1 - k) ** 3;
    svg.setAttribute("viewBox", from.map((v, i) => v + (to[i] - v) * e).join(" "));
    if (k < 1 && svg.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function drawStage(svg, live) {
  const from = parseBox(svg.getAttribute("viewBox"));
  drawStadium(svg, app.session.state, stageOptions());
  const to = parseBox(svg.getAttribute("viewBox"));
  if (from) svg.setAttribute("viewBox", from.join(" "));
  tweenCamera(svg, from, to);
  if (!from) svg.setAttribute("viewBox", to.join(" "));
  const d = derive(app.session.state);
  svg.setAttribute(
    "aria-label",
    t("Soccer stadium. The field is {l} m by {w} m. There are {n} seats in {s} sections.", {
      l: app.session.state.length,
      w: app.session.state.width,
      n: d.capacity,
      s: app.session.state.sections,
    }),
  );
  if (live)
    live.textContent = t("Field {l} m by {w} m, {n} seats.", {
      l: app.session.state.length,
      w: app.session.state.width,
      n: d.capacity,
    });
}

function attachDrag(svg) {
  let dragging = false;
  const toWorld = (e) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener("pointerdown", (e) => {
    if (!e.target.closest?.("[data-handle]")) return;
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener("pointermove", (e) => {
    if (!dragging || !editable(app.session.step)) return;
    const p = toWorld(e);
    const snap = (v) => Math.round((Math.abs(v) * 2) / 5) * 5;
    for (const [key, value] of [
      ["length", snap(p.x)],
      ["width", snap(p.y)],
    ]) {
      if (
        value !== app.session.state[key] &&
        !setField(app.session.state, key, value).error
      )
        dispatch({ type: "set", key, value });
    }
  });
  const end = () => {
    dragging = false;
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
}

function coachKey() {
  const { mission, session } = app;
  const { explain, apply } = session;
  return JSON.stringify([
    getLang(),
    session.step,
    session.step === "create" && mission.create.done(session.state),
    session.prediction?.id,
    explain.choice,
    explain.attempts,
    explain.correct,
    apply.seed,
    apply.attempts,
    apply.hints,
    apply.correct,
  ]);
}

function renderWorld({ focus } = {}) {
  const { mission, session } = app;
  if (!document.getElementById("rl-stage")) buildWorldShell();
  const svg = document.getElementById("rl-stage");
  const live = document.getElementById("rl-live");
  drawStage(svg, live);
  const { hidden } = readouts();
  renderRepresentations(
    document.getElementById("rl-reps"),
    mission,
    session.state,
    { observed: session.observed, hidden, base: session.base },
    t,
  );
  const controls = document.getElementById("rl-controls");
  controls.hidden = !editable(session.step);
  if (!app.refs || app.refs.mission !== mission.id) {
    app.refs = buildControls(controls, mission, t, dispatch);
    app.refs.mission = mission.id;
  }
  const { mission: _m, ...refs } = app.refs;
  updateControls(refs, session.state);
  // The coach card only changes when something it shows changes. Rebuilding it on every field edit would replace the
  // button under a student's pointer (a typed value commits on blur, just before the click on Next).
  const coach = document.getElementById("rl-coach");
  const key = coachKey();
  if (coach.dataset.key !== key) {
    coach.dataset.key = key;
    renderCoach(coach, {
      mission,
      session,
      t,
      dispatch,
      onWork: downloadWork,
      onHome: renderHome,
      onReplay: replay,
    });
  }
  if (focus === "title") document.getElementById("rl-step-title")?.focus({ preventScroll: false });
  else if (focus === "feedback") document.querySelector("[data-feedback]")?.focus();
}

function buildWorldShell() {
  root.replaceChildren(
    topBar(true),
    h(
      "div",
      { class: "rl-world" },
      h(
        "div",
        { class: "rl-stagewrap" },
        s("svg", {
          id: "rl-stage",
          class: "rl-stage",
          role: "img",
          preserveAspectRatio: "xMidYMid meet",
        }),
        h("div", { id: "rl-controls", class: "rl-controls", "aria-label": t("Controls") }),
        h("div", { id: "rl-reps", class: "rl-reps" }),
      ),
      h("aside", { id: "rl-coach", class: "fl-card rl-coach", "aria-label": t("Coach") }),
    ),
    h("p", { id: "rl-live", class: "rl-sr", "aria-live": "polite" }),
    h("p", {
      id: "rl-save-note",
      class: "rl-warn",
      role: "alert",
      hidden: true,
      text: t("This browser cannot save right now. Use Download my work before you leave."),
    }),
  );
  attachDrag(document.getElementById("rl-stage"));
}

function openWorld(worldId) {
  const mission = missionFor(worldId, app.grade);
  if (!mission) return;
  const saved = app.save.worlds[worldId]?.sessions?.[mission.id];
  app.mission = mission;
  app.refs = null;
  app.session = sanitizeSession(saved, mission) ?? newSession(mission, app.grade);
  app.session.grade = app.grade;
  history.replaceState(null, "", `?world=${worldId}&grade=${app.grade}`);
  root.replaceChildren();
  renderWorld({ focus: "title" });
}

function replay() {
  app.session = newSession(app.mission, app.grade);
  app.refs = null;
  persist(true);
  root.replaceChildren();
  renderWorld({ focus: "title" });
}

function downloadWork() {
  const list = app.save.completed.map(({ missionId, at, evidence, reflection }) => ({
    missionId,
    completedAt: new Date(at).toISOString(),
    evidence,
    reflection,
  }));
  const body = JSON.stringify(
    {
      kind: "math-reality-work",
      version: 1,
      grade: app.grade,
      note: "Contains no name or account. Reflections are the student's own words and are not scored.",
      missions: list,
    },
    null,
    2,
  );
  const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
  const a = h("a", { href: url, download: "math-reality-work.json" });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- landing -----------------------------------------------------------------------------------------------------
function topBar(inWorld) {
  const toggle = h("button", {
    type: "button",
    class: "fl-btn fl-btn--ghost rl-lang",
    lang: getLang() === "es" ? "en" : "es",
    text: getLang() === "es" ? "English" : "Español",
    on: {
      click: () => {
        setLang(getLang() === "es" ? "en" : "es");
        document.documentElement.lang = getLang();
        inWorld ? (root.replaceChildren(), renderWorld({})) : renderHome();
      },
    },
  });
  return h(
    "header",
    { class: "rl-top" },
    inWorld
      ? h("button", {
          type: "button",
          class: "rl-back",
          text: t("← My worlds"),
          on: { click: renderHome },
        })
      : h("a", { class: "rl-back", href: "../", text: t("← Math Fluency Lab") }),
    h("span", { class: "rl-grade", text: t("Grade {n}", { n: app.grade }) }),
    toggle,
  );
}

const WORLD_CARDS = {
  stadium: [
    "Soccer Stadium",
    "Build a stadium. Change the field and the seats and watch the math change.",
  ],
  pizza: ["Pizza Restaurant", "Scale recipes, split pizzas and set prices."],
  space: ["Space Mission", "Plan distances, fuel and supplies for a trip."],
};

function worldThumb(id) {
  const svg = s("svg", { viewBox: "0 0 160 100", class: "rl-thumb", "aria-hidden": "true" });
  if (id === "stadium")
    svg.append(
      s("rect", { x: 0, y: 0, width: 160, height: 100, fill: "#e9f1f6" }),
      s("rect", { x: 22, y: 8, width: 116, height: 20, rx: 4, fill: "#244a6d" }),
      s("rect", { x: 22, y: 72, width: 116, height: 20, rx: 4, fill: "#244a6d" }),
      s("rect", { x: 30, y: 30, width: 100, height: 40, fill: "#2f7d4f" }),
      s("line", { x1: 80, y1: 30, x2: 80, y2: 70, stroke: "#f4f8f4", "stroke-width": 1.5 }),
      s("circle", { cx: 80, cy: 50, r: 9, fill: "none", stroke: "#f4f8f4", "stroke-width": 1.5 }),
    );
  else if (id === "pizza")
    svg.append(
      s("rect", { width: 160, height: 100, fill: "#fff4e0" }),
      s("circle", { cx: 80, cy: 50, r: 38, fill: "#f2c15b", stroke: "#b45309", "stroke-width": 4 }),
      ...[0, 60, 120].map((a) =>
        s("line", {
          x1: 80,
          y1: 50,
          x2: 80 + 38 * Math.cos((a * Math.PI) / 180),
          y2: 50 + 38 * Math.sin((a * Math.PI) / 180),
          stroke: "#b45309",
          "stroke-width": 2,
        }),
      ),
      ...[
        [66, 40],
        [92, 58],
        [84, 34],
        [68, 64],
      ].map(([x, y]) => s("circle", { cx: x, cy: y, r: 4, fill: "#d9533a" })),
    );
  else
    svg.append(
      s("rect", { width: 160, height: 100, fill: "#17324d" }),
      ...[
        [20, 20],
        [60, 12],
        [120, 24],
        [140, 70],
        [30, 78],
        [96, 84],
      ].map(([x, y]) => s("circle", { cx: x, cy: y, r: 1.6, fill: "#fff" })),
      s("circle", { cx: 112, cy: 54, r: 22, fill: "#d9533a" }),
      s("path", { d: "M30 66 L52 50 L74 66 Z", fill: "#e3eef8" }),
      s("circle", { cx: 52, cy: 58, r: 5, fill: "#1fa6a2" }),
    );
  return svg;
}

function say(text, kind = "info", action) {
  return h(
    "div",
    { class: `rl-msg rl-msg-${kind}`, role: "status", tabindex: "-1", "data-msg": "" },
    h("p", { text }),
    action || null,
  );
}

function renderHome() {
  history.replaceState(null, "", `?grade=${app.grade}`);
  app.session = null;
  const input = h("input", {
    id: "rl-idea",
    class: "rl-idea",
    type: "text",
    maxlength: 120,
    autocomplete: "off",
    placeholder: t("I want to build a soccer stadium"),
    value: app.save.idea || null,
  });
  const form = h(
    "form",
    {
      class: "rl-ask",
      on: {
        submit: (e) => {
          e.preventDefault();
          ask(input.value);
        },
      },
    },
    h("label", {
      for: "rl-idea",
      class: "rl-ask-label",
      text: t("What do you want to create or explore today?"),
    }),
    h(
      "div",
      { class: "rl-ask-row" },
      input,
      h("button", { type: "submit", class: "fl-btn rl-go", text: t("Go") }),
    ),
  );
  const resume = app.save.worlds.stadium?.sessions?.[missionFor("stadium", app.grade)?.id];
  const cards = WORLDS.map((w) => {
    const [name, blurb] = WORLD_CARDS[w.id];
    const open = w.ready
      ? h("button", {
          type: "button",
          class: "fl-btn rl-open",
          "data-world": w.id,
          text: resume && w.id === "stadium" ? t("Continue") : t("Build"),
          on: { click: () => openWorld(w.id) },
        })
      : h("span", { class: "rl-soon", text: t("Not built yet") });
    return h(
      "article",
      { class: `fl-card rl-world-card${w.ready ? "" : " is-soon"}` },
      worldThumb(w.id),
      h("h3", { text: t(name) }),
      h("p", { text: t(blurb) }),
      open,
    );
  });
  const done = app.save.completed.filter((c) => c.missionId);
  root.replaceChildren(
    topBar(false),
    h(
      "main",
      { class: "rl-home" },
      h("p", { class: "rl-eyebrow", text: t("EduWonderLab · Math Reality") }),
      h("h1", { class: "rl-title", text: t("Build anything. Discover the math.") }),
      form,
      h("div", { id: "rl-msg-host", "aria-live": "polite" }),
      h("div", { class: "rl-worlds" }, ...cards),
      done.length
        ? h(
            "section",
            { class: "rl-mywork", "aria-labelledby": "rl-mywork-h" },
            h("h2", { id: "rl-mywork-h", text: t("My work") }),
            h("p", { text: t("{n} missions finished on this device.", { n: done.length }) }),
            h("button", {
              type: "button",
              class: "fl-btn fl-btn--ghost",
              text: t("Download my work"),
              on: { click: downloadWork },
            }),
          )
        : null,
    ),
    h("p", {
      id: "rl-save-note",
      class: "rl-warn",
      role: "alert",
      hidden: true,
      text: t("This browser cannot save right now. Use Download my work before you leave."),
    }),
  );
}

function ask(text) {
  app.save.idea = String(text || "").slice(0, 120);
  persist(true);
  const host = document.getElementById("rl-msg-host");
  const found = interpretIdea(text);
  const open = (id) =>
    h("button", {
      type: "button",
      class: "fl-btn rl-open",
      text: t("Open the Soccer Stadium"),
      on: { click: () => openWorld(id) },
    });
  if (found.match === "exact" && found.ready) return openWorld(found.worldId);
  const [name] = found.worldId ? WORLD_CARDS[found.worldId] : [""];
  host.replaceChildren(
    found.match === "exact"
      ? say(
          t("The {name} is not built yet, so I cannot simulate it. The Soccer Stadium is ready.", {
            name: t(name),
          }),
          "info",
          open("stadium"),
        )
      : found.match === "near"
        ? say(
            t(
              "I do not have that world yet. The closest one I have is the Soccer Stadium: area, perimeter, scale and ratios.",
            ),
            "info",
            open("stadium"),
          )
        : say(t("I could not match that to a world yet. Here are the worlds I have."), "info"),
  );
  host.firstChild?.focus();
}

document.documentElement.lang = getLang();
const params = new URLSearchParams(location.search);
if (params.get("world") === "stadium" && missionFor("stadium", app.grade)) openWorld("stadium");
else renderHome();
