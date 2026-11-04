// Journey step runner and route dispatcher, driven with jsdom and inline fakes.
//
//   node --test tools/access-journey-runner.test.mjs
//
// The runner receives every collaborator through `deps`, so this file supplies an in-memory state (same contract as
// src/journey/state.js: writers mutate and return the state), a recommender, a ledger and fake engine UI modules.
// The real curriculum.js supplies STEPS and MISSIONS. Nothing here needs the engines or pages to exist.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import * as curriculum from "../access-practice-lab/src/journey/curriculum.js";
import {
  handleClick,
  mountStep,
  renderStep,
  unmountStep,
} from "../access-practice-lab/src/journey/runner.js";
import { commit } from "../access-practice-lab/src/journey/runner-env.js";
import { factsFor } from "../access-practice-lab/src/journey/runner-panels.js";
import { PART_LABEL, stepParts } from "../access-practice-lab/src/journey/runner-steps.js";
import { html, toHtml } from "../access-practice-lab/src/util.js";
import { journeyParams, resolveJourney } from "../access-practice-lab/src/views/journey.js";

const BAND = "6-8";
const STEP_IDS = curriculum.STEPS.map((s) => s.id);

// ── in-memory journey state (the state.js contract: writers return a new state and never mutate their input) ──
function fakeState() {
  let store = { v: 1, bands: {} };
  const clone = (x) => structuredClone(x);
  const bandOf = (s, band) =>
    (s.bands[band] ??= {
      support: "B",
      cursor: { mission: "m01", step: "discover" },
      missions: {},
      assigned: null,
    });
  const slot = (s, band, m, st) => {
    const mission = (bandOf(s, band).missions[m] ??= { startedAt: "t0", steps: {}, reviewed: {} });
    return (mission.steps[st] ??= {
      status: "started",
      stage: null,
      help: [],
      attempts: 0,
      revisits: 0,
      data: {},
    });
  };
  const edit = (s, band, fn) => {
    const next = clone(s);
    fn(next, bandOf(next, band));
    return next;
  };
  const read = (s, band, m, st) => s.bands[band]?.missions?.[m]?.steps?.[st];
  const api = {
    loadJourney: () => clone(store),
    saveJourney: (s) => {
      store = clone(s);
    },
    bandState: (s, band) =>
      clone(
        s.bands[band] || {
          support: "B",
          cursor: { mission: "m01", step: "discover" },
          missions: {},
          assigned: null,
        },
      ),
    getStep: (s, band, m, st) => ({
      status: "new",
      stage: null,
      help: [],
      attempts: 0,
      revisits: 0,
      data: {},
      ...clone(read(s, band, m, st) || {}),
    }),
    updateStepData: (s, band, m, st, key, patch) =>
      edit(s, band, (next) => {
        const S = slot(next, band, m, st);
        S.data[key] = { ...S.data[key], ...patch };
      }),
    noteHelp: (s, band, m, st, id) =>
      edit(s, band, (next) => {
        const S = slot(next, band, m, st);
        if (S.status === "done" && S.stage === "independent") S.revisits += 1;
        else if (!S.help.includes(id)) S.help.push(id);
      }),
    completeStep: (s, band, m, st, { independent, summary }) =>
      edit(s, band, (next, b) => {
        const S = slot(next, band, m, st);
        const keeps = S.status === "done" && S.stage === "independent";
        S.stage =
          keeps || (independent === true && S.help.length === 0) ? "independent" : "supported";
        S.status = "done";
        S.attempts += 1;
        if (summary !== undefined) S.data.result = summary;
        if (b.assigned?.mission === m && b.assigned.step === st) b.assigned = null;
      }),
    revisitStep: (s, band, m, st) =>
      edit(s, band, (next) => {
        if (read(next, band, m, st)?.status === "done") slot(next, band, m, st).revisits += 1;
      }),
    setSupport: (s, band, level) => edit(s, band, (_n, b) => void (b.support = level)),
    setCursor: (s, band, mission, step) =>
      edit(s, band, (_n, b) => void (b.cursor = { mission, step })),
    assign: (s, band, target) => edit(s, band, (_n, b) => void (b.assigned = target)),
    nextCursorAfter(_s, _band, m, st) {
      const i = STEP_IDS.indexOf(st);
      return i < STEP_IDS.length - 1
        ? { mission: m, step: STEP_IDS[i + 1] }
        : { mission: curriculum.nextMissionId(m) || m, step: "discover" };
    },
    stepStatus(s, band, m, st) {
      const S = api.getStep(s, band, m, st);
      return S.status === "done"
        ? S.stage === "independent"
          ? "done-independent"
          : "done-supported"
        : S.status;
    },
    missionStatus(s, band, m) {
      const all = STEP_IDS.map((id) => api.getStep(s, band, m, id));
      const done = all.filter((x) => x.status === "done").length;
      if (all.every((x) => x.status === "new")) return "not-started";
      if (done < 6) return "in-progress";
      return all.at(-1).stage === "independent"
        ? "independently-demonstrated"
        : "completed-with-support";
    },
  };
  return { api, peek: () => clone(store) };
}

const fakeRecommend = {
  recommendNext(state, band) {
    const b = state.bands[band];
    for (const m of curriculum.MISSION_IDS) {
      for (const id of STEP_IDS) {
        if (b?.missions?.[m]?.steps?.[id]?.status !== "done")
          return {
            kind: id === "discover" && !b?.missions?.[m] ? "start" : "continue",
            mission: m,
            step: id,
            reason: [`Next is ${id}.`, `Sigue ${id}.`],
            alternatives: [],
          };
      }
    }
    return {
      kind: "journey-complete",
      mission: null,
      step: null,
      reason: ["You finished the journey.", "Terminaste el viaje."],
      alternatives: [],
    };
  },
};

const pack = {
  vocab: [["cause", "the reason something happens", "causa: la razón por la que algo sucede"]],
  discover: { kind: "scene" },
  understand: { listen: { kind: "listen" }, read: { kind: "read" } },
  build: [{ kind: "build", module: "expand" }],
  communicate: { kind: "converse" },
  improve: { models: {} },
  show: { kind: "compose" },
};

function makeHarness({
  band = BAND,
  mission = "m08",
  state = fakeState(),
  pk = pack,
  failUI = "",
} = {}) {
  const dom = new JSDOM('<!doctype html><div id="app"></div>');
  const root = dom.window.document.getElementById("app");
  const log = { renders: [], mounts: [], announce: [], rerenders: 0, ledger: [] };
  const ui = {};
  for (const name of ["scene", "listen", "xray", "construct", "converse", "compose", "mirror"]) {
    ui[name] = {
      render(task, env) {
        log.renders.push({ name, task, env });
        const out = `<div data-fake="${name}"><button type="button" data-fake-done>Finish ${name}</button></div>`;
        return name === "xray"
          ? out
          : html`<div data-fake="${name}"><button type="button" data-fake-done>Finish ${name}</button></div>`;
      },
      mount(host, env) {
        log.mounts.push(name);
        host
          .querySelector("[data-fake-done]")
          .addEventListener("click", () => env.done({ words: 21, supportsUsed: [], from: name }));
      },
    };
  }
  ui.mirror.showSummaryHTML = (_I, record) =>
    record ? html`<p data-fake-summary>${record.steps.join(",")}</p>` : "";
  ui.growth = {
    recordFor: (_band, _id, mission) => ({ steps: Object.keys(mission?.steps || {}) }),
  };
  const deps = {
    state: state.api,
    curriculum: {
      ...curriculum,
      loadMission: async (id) => ({ id, bands: { "3-5": pk, "6-8": pk } }),
    },
    recommend: fakeRecommend,
    ledger: {
      loadLedger: () => ({ entries: [] }),
      appendEntry: (_l, e) => log.ledger.push(e),
      saveLedger() {},
    },
    loadUI: async (name) => {
      if (name === failUI) throw new Error("chunk failed");
      return ui[name];
    },
    announce: (m) => log.announce.push(m),
  };
  const h = {
    root,
    log,
    deps,
    state,
    params: { mission, step: "discover", assigned: false },
    pending: Promise.resolve(),
    out: null,
  };
  const ctx = {
    band,
    prefs: { lang: "en" },
    route: { view: "journey" },
    navigate() {},
    rerender() {
      log.rerenders += 1;
      h.pending = h.show();
      return h.pending;
    },
  };
  h.ctx = ctx;
  h.show = async (params = h.params) => {
    h.params = params;
    h.out = await renderStep(ctx, deps, params);
    root.innerHTML = toHtml(h.out.html);
    mountStep(root, ctx);
    return h.out;
  };
  h.go = (step, extra = {}) => h.show({ mission, step, assigned: false, ...extra });
  h.idle = () => h.pending;
  h.q = (sel) => root.querySelector(sel);
  h.qa = (sel) => [...root.querySelectorAll(sel)];
  h.click = async (sel) => {
    const el = root.querySelector(sel);
    assert.ok(el, `missing ${sel}`);
    if (!handleClick({ target: el })) el.click();
    await h.idle();
  };
  // A student finishes an engine part and, where the runner holds the engine on screen, presses "Finish this step".
  h.finishPart = async () => {
    await h.click("[data-fake-done]");
    if (root.querySelector("[data-jr-continue]")) await h.click("[data-jr-continue]");
  };
  h.finishPartHeld = async () => {
    await h.click("[data-fake-done]");
  };
  h.engines = () => log.renders.map((r) => r.name);
  h.text = () => root.textContent.replace(/\s+/g, " ");
  h.step = (id) => state.api.getStep(state.peek(), band, mission, id);
  return h;
}

/** Drive one step to its completion panel. */
async function finishStep(h, step, { own = false } = {}) {
  await h.go(step);
  if (own && !h.q("[data-jr-own][aria-checked=true]") && step !== "show")
    await h.click("[data-jr-own]");
  for (let i = 0; i < 4 && h.q("[data-journey-engine]"); i++) await h.finishPart();
}

test("journeyParams and resolveJourney map every route", () => {
  const p = (path, search = "") =>
    resolveJourney(journeyParams(`/access-practice-lab${path}`, search), curriculum);
  assert.equal(p("/journey").kind, "home");
  assert.equal(p("/journey/").kind, "home");
  assert.equal(p("/journey/map").kind, "map");
  assert.equal(p("/journey/guide").kind, "guide");
  assert.equal(p("/journey/growth").kind, "growth");
  assert.deepEqual(p("/journey/m08"), { kind: "overview", mission: "m08" });
  assert.deepEqual(p("/journey/8"), { kind: "overview", mission: "m08" });
  assert.deepEqual(p("/journey/m08/communicate", "?grades=6-8"), {
    kind: "step",
    mission: "m08",
    step: "communicate",
    assigned: false,
  });
  assert.equal(p("/journey/m08/show", "?assigned=1").assigned, true);
  assert.equal(p("/journey/m08/nonsense").kind, "overview");
  assert.equal(p("/journey/m99").kind, "notfound");
});

test("every step runs its engine UIs in the specified order", async () => {
  const expected = {
    discover: ["scene"],
    understand: ["listen", "xray"],
    build: ["construct"],
    communicate: ["converse"],
    improve: ["mirror"],
    show: ["compose"],
  };
  for (const step of STEP_IDS) {
    const h = makeHarness();
    await h.go(step);
    for (let i = 0; i < 4 && h.q("[data-journey-engine]"); i++) await h.finishPart();
    // A held engine is drawn once more while the learner reads its feedback, so compare engines in order, not draw counts.
    const once = (list) => list.filter((n, i) => n !== list[i - 1]);
    assert.deepEqual(once(h.engines()), expected[step], step);
    assert.deepEqual(once(h.log.mounts), expected[step], `${step} mounts`);
    assert.equal(
      h.q("[data-jr-panel=complete]") !== null,
      true,
      `${step} ends on the complete panel`,
    );
    assert.equal(h.step(step).status, "done");
  }
});

test("an engine that finishes on the last answer stays on screen until the learner presses Finish this step", async () => {
  // scene, xray and construct call env.done() with the last accepted answer; without a hold the page jumped to the
  // completion panel and the partner's reply / traced evidence / built sentence was never read.
  for (const [step, last] of [
    ["discover", "scene"],
    ["understand", "xray"],
    ["build", "construct"],
  ]) {
    const h = makeHarness();
    await h.go(step);
    for (let i = 0; i < 3 && h.q("[data-journey-engine]") && !h.q("[data-jr-continue]"); i++)
      await h.finishPartHeld();
    assert.ok(h.q("[data-jr-continue]"), `${step}: a Finish this step button follows ${last}`);
    assert.equal(
      h.q(`[data-engine="${last === "xray" ? "read" : last === "construct" ? "build" : last}"]`) !==
        null,
      true,
      `${step}: the engine is still on screen`,
    );
    assert.equal(h.q("[data-jr-panel=complete]"), null, `${step}: not complete yet`);
    assert.notEqual(
      h.step(step).status,
      "done",
      `${step}: not recorded done before the learner continues`,
    );
    await h.click("[data-jr-continue]");
    assert.ok(h.q("[data-jr-panel=complete]"), `${step}: complete panel after Finish`);
    assert.equal(h.step(step).status, "done");
    assert.ok(h.q("[data-jr-next]"), `${step}: a forward action is offered`);
  }
  // converse, compose and mirror keep their own finish control, so the runner adds none.
  for (const step of ["communicate", "improve", "show"]) {
    const h = makeHarness();
    await h.go(step);
    await h.finishPartHeld();
    assert.equal(h.q("[data-jr-continue]"), null, `${step}: no second finish button`);
    assert.ok(h.q("[data-jr-panel=complete]"), `${step}: completes at once`);
  }
});

test("the improve fact names the target the way the learner met it, never a move id", () => {
  const I = { T: (en, es) => `${en}|${es}` };
  const facts = factsFor(I, "improve", { target: "orient" }, "compose")
    .map((f) => toHtml(f))
    .join(" ");
  assert.match(facts, /Set the scene.*Presenta la escena/);
  assert.doesNotMatch(facts, /“orient”/);
  const unknown = factsFor(I, "improve", { target: "some-new-move" }, "compose")
    .map((f) => toHtml(f))
    .join(" ");
  assert.match(unknown, /some new move/, "an unlisted id still reads as plain words");
});

test("repeating a held step holds again", async () => {
  const h = makeHarness();
  await h.go("discover");
  await h.finishPart();
  assert.equal(h.step("discover").status, "done");
  await h.click("[data-jr-repeat]");
  await h.finishPartHeld();
  assert.ok(h.q("[data-jr-continue]"), "the repeat holds too");
});

test("communicate chooses converse or compose from the task kind, and each part gets its own task", () => {
  assert.equal(stepParts("communicate", { communicate: { kind: "compose" } })[0].ui, "compose");
  assert.equal(stepParts("communicate", { communicate: { kind: "converse" } })[0].ui, "converse");
  const parts = stepParts("understand", pack);
  assert.deepEqual(
    parts.map((x) => [x.key, x.ui, x.task.kind]),
    [
      ["listen", "listen", "listen"],
      ["read", "xray", "read"],
    ],
  );
  assert.equal(stepParts("build", pack)[0].task, pack.build);
  assert.equal(
    stepParts("improve", pack)[0].task,
    pack,
    "the Growth Mirror is handed the whole pack",
  );
  for (const part of parts) assert.ok(PART_LABEL[part.key]);
});

test("env: band, support, data, prior, independence and the update/help/done/ledger seams", async () => {
  const h = makeHarness();
  await finishStep(h, "discover");
  await h.go("communicate");
  const env = h.log.renders.at(-1).env;
  assert.equal(env.band, BAND);
  assert.equal(env.support, "B");
  assert.equal(env.independent, false);
  assert.equal(env.missionId, "m08");
  assert.equal(env.mission.klu, curriculum.MISSIONS.m08.klu);
  assert.equal(env.pack, pack);
  assert.deepEqual(env.prior.discover, { words: 21, supportsUsed: [], from: "scene" });
  assert.equal(env.prior.communicate, undefined);
  const before = h.log.rerenders;
  env.update({ draft: "Because the plants" }, { silent: true });
  assert.equal(h.log.rerenders, before, "quiet update does not redraw");
  env.update({ turns: 1 });
  await h.idle();
  assert.equal(h.log.rerenders, before + 1);
  const data = h.step("communicate").data.converse;
  assert.deepEqual(
    { draft: data.draft, turns: data.turns },
    { draft: "Because the plants", turns: 1 },
  );
  assert.equal(
    h.log.renders.at(-1).env.data.draft,
    "Because the plants",
    "the next render sees the saved data",
  );
  env.ledger({ kind: "first", m: { words: 5 } });
  assert.deepEqual(
    {
      src: h.log.ledger[0].src,
      task: h.log.ledger[0].task,
      band: h.log.ledger[0].band,
      use: h.log.ledger[0].use,
      domain: h.log.ledger[0].domain,
    },
    { src: "mission", task: "m08.communicate", band: BAND, use: "Explain", domain: "Speaking" },
  );
  assert.equal(h.log.ledger[0].stage, "supported");
  env.help("frame");
  assert.deepEqual(h.step("communicate").help, ["frame"]);
});

test("a supported finish is recorded supported; On my own finishes independent; show is always independent", async () => {
  const a = makeHarness();
  await finishStep(a, "build");
  assert.equal(a.step("build").stage, "supported");
  assert.match(a.text(), /Done with support/);

  const b = makeHarness();
  await finishStep(b, "build", { own: true });
  assert.equal(b.step("build").stage, "independent");
  assert.match(b.text(), /Done on my own/);

  const c = makeHarness();
  await c.go("show");
  assert.equal(c.log.renders.at(-1).env.independent, true);
  assert.equal(c.q("[data-jr-support]"), null, "no support selector on show");
  assert.equal(c.q("[data-jr-own]"), null);
  await c.finishPart();
  assert.equal(c.step("show").stage, "independent");
  assert.deepEqual(c.step("show").data.result, { words: 21, supportsUsed: [], from: "compose" });
  assert.match(c.q("[data-jr-panel=complete]").textContent, /Done on my own/);
  assert.equal(c.q("[data-fake-summary]") !== null, true, "show summary comes from the mirror UI");
});

test("On my own sets env.independent, stays on, and opening help makes the finish supported", async () => {
  const h = makeHarness();
  await h.go("build");
  assert.equal(h.log.renders.at(-1).env.independent, false);
  await h.click("[data-jr-own]");
  assert.equal(h.log.renders.at(-1).env.independent, true);
  assert.equal(h.q("[data-jr-own]").getAttribute("aria-checked"), "true");
  await h.click("[data-jr-own]");
  assert.equal(h.q("[data-jr-own]").getAttribute("aria-checked"), "true", "stays on");
  await h.click("[data-jr-help-toggle]");
  assert.equal(h.q("#jrHelp") !== null, true);
  assert.match(h.q("#jrHelp").textContent, /causa: la razón/);
  assert.deepEqual(h.step("build").help, ["vocab"]);
  await h.finishPart();
  assert.equal(h.step("build").stage, "supported");
});

test("changing the support level never loses work", async () => {
  const h = makeHarness();
  await h.go("communicate");
  h.log.renders.at(-1).env.update({ draft: "My draft", turns: 2 });
  await h.idle();
  const before = h.step("communicate").data;
  for (const level of ["A", "C", "B"]) {
    await h.click(`[data-jr-support="${level}"]`);
    assert.equal(h.log.renders.at(-1).env.support, level);
    assert.equal(h.q(`[data-jr-support="${level}"]`).getAttribute("aria-pressed"), "true");
    assert.deepEqual(h.step("communicate").data, before);
    assert.equal(h.step("communicate").status, "started");
  }
  assert.equal(h.state.peek().bands[BAND].support, "B");
  assert.equal(h.engines().length >= 4, true);
});

test("jumping ahead is allowed and shows a gentle note linking to the earlier step", async () => {
  const h = makeHarness();
  await h.go("communicate");
  const note = h.q(".jr-note");
  assert.ok(note, "note shown");
  assert.match(note.textContent, /This builds on Step 1: Discover/);
  assert.match(note.querySelector("a").getAttribute("href"), /\/journey\/m08\/discover/);
  assert.equal(h.q("[data-journey-engine]") !== null, true, "engine still runs");
  await finishStep(h, "discover");
  await h.go("understand");
  assert.equal(h.q(".jr-note"), null);
  await h.go("build");
  assert.match(
    h.q(".jr-note").textContent,
    /Step 2: Understand/,
    "names the first earlier step not done",
  );
});

test("rail links only reached steps, marks the current one, and says the status in words", async () => {
  const h = makeHarness();
  await finishStep(h, "discover");
  await h.go("understand");
  const rail = h.qa(".jr-rail-step");
  assert.equal(rail.length, 6);
  const linked = rail.map((li) => li.querySelector("a") !== null);
  assert.deepEqual(linked, [true, true, false, false, false, false]);
  assert.equal(h.q("[aria-current=step]").dataset.jrRail, "understand");
  assert.match(rail[0].textContent, /Done with support/);
  assert.match(rail[1].textContent, /In progress|Not started/);
  assert.match(rail[3].textContent, /Not started/);
  assert.equal(rail[0].querySelectorAll("svg").length >= 2, true, "icon and status icon");
  assert.match(h.q(".jr-title-step").textContent, /Step 2 of 6: Understand/);
  assert.match(h.q(".jr-goal").textContent, /My goal/);
  assert.match(h.q(".jr-meta").textContent, /About 12 minutes/);
});

test("the complete panel always has a primary forward link, at most two alternatives, and Repeat", async () => {
  const h = makeHarness();
  await finishStep(h, "discover");
  const next = h.q("[data-jr-next]");
  assert.match(next.getAttribute("href"), /\/journey\/m01\/discover|\/journey\/m08\/understand/);
  assert.ok(h.qa(".jr-alts a").length <= 2);
  assert.ok(h.q("[data-jr-repeat]"));
  assert.match(h.q(".jr-facts").textContent, /You looked into the situation/);
  assert.match(h.q(".jr-reason").textContent, /Next is/);
  assert.equal(h.log.announce.at(-1), "Step complete.");
});

test("no panel is a dead end", async () => {
  const forward = (h, label) =>
    assert.ok(h.qa('a[href*="/journey"]').length >= 1, `${label}: forward link`);
  for (const step of STEP_IDS) {
    const run = makeHarness();
    await run.go(step);
    forward(run, `${step} run`);
    for (let i = 0; i < 4 && run.q("[data-journey-engine]"); i++) await run.finishPart();
    forward(run, `${step} complete`);
    assert.ok(run.q("[data-jr-next]"), `${step} complete has a primary button`);
    assert.ok(run.q("[data-jr-leave]") || run.q('a[href*="/journey/map"]'));
  }
  const unknown = makeHarness({ mission: "m08" });
  await unknown.show({ mission: "m77", step: "discover", assigned: false });
  forward(unknown, "unknown mission");
  await unknown.show({ mission: "m08", step: "bogus", assigned: false });
  forward(unknown, "unknown step");
  const noPack = makeHarness({ pk: {} });
  await noPack.go("build");
  forward(noPack, "empty pack");
  const broken = makeHarness({ failUI: "scene" });
  await broken.go("discover");
  forward(broken, "engine failed to load");
  assert.match(broken.text(), /could not load/);
  const finished = makeHarness();
  for (const step of STEP_IDS) await finishStep(finished, step);
  assert.match(
    finished.q("[data-jr-next]").getAttribute("href"),
    /\/journey\/m01\/discover/,
    "recommender target is used",
  );
  const everything = makeHarness();
  for (const mission of curriculum.MISSION_IDS)
    for (const step of STEP_IDS) {
      await everything.go(step, { mission });
      for (let i = 0; i < 4 && everything.q("[data-journey-engine]"); i++)
        await everything.finishPart();
    }
  assert.match(
    everything.q("[data-jr-next]").getAttribute("href"),
    /\/journey\/map/,
    "journey complete still points somewhere",
  );
  assert.match(everything.q(".jr-reason").textContent, /finished the journey/);
});

test("a finished mission shows the mission-complete block with the right wording", async () => {
  const own = makeHarness();
  for (const step of STEP_IDS) await finishStep(own, step);
  assert.equal(own.state.peek().bands[BAND].missions.m08.steps.show.stage, "independent");
  assert.match(own.text(), /Mission complete: Shown on my own/);
  assert.match(own.q(".jr-mission-done").textContent, /saved separately/);

  const helped = makeHarness();
  for (const step of STEP_IDS.slice(0, 5)) await finishStep(helped, step);
  await helped.go("show");
  await helped.click("[data-jr-help-toggle]");
  await helped.finishPart();
  assert.match(helped.text(), /Mission complete: Completed with support/);
  assert.match(helped.q(".jr-mission-done").textContent, /repeat Show on your own/);
});

test("revisit: a done step shows the Repeat offer and does not re-run; Repeat starts fresh and keeps the first try", async () => {
  const h = makeHarness();
  await finishStep(h, "build", { own: true });
  const first = h.step("build");
  assert.equal(first.stage, "independent");
  const engines = h.engines().length;
  await h.go("build");
  assert.equal(h.engines().length, engines, "engine not re-run");
  assert.match(h.text(), /You finished this step\. Try it again\?/);
  await h.click("[data-jr-repeat]");
  const again = h.step("build");
  assert.equal(again.revisits, 1);
  assert.equal(again.status, "done");
  assert.equal(h.engines().length, engines + 1, "engine runs again");
  assert.deepEqual(h.log.renders.at(-1).env.data, {}, "fresh data for the new run");
  assert.equal(again.data.build.result.from, "construct", "first run is kept");
  await h.finishPart();
  const after = h.step("build");
  assert.equal(after.status, "done");
  assert.equal(after.stage, "independent", "a repeat never downgrades the first finish");
  assert.equal(after.attempts, 2, "state.js counts a repeat completion as another attempt");
  assert.equal(after.data.result.from, "construct", "the step result is refreshed by the repeat");
  assert.equal(after.data["build@1"].result.from, "construct");
  assert.ok(h.q("[data-jr-panel=complete]"));
});

test("a repeat done on my own after a supported finish is recorded by state.js, which owns the stage rule", async () => {
  const h = makeHarness();
  await finishStep(h, "build");
  assert.equal(h.step("build").stage, "supported");
  await h.click("[data-jr-repeat]");
  await h.click("[data-jr-own]");
  await h.finishPart();
  assert.equal(h.step("build").stage, "independent");
  assert.equal(h.step("build").attempts, 2);
});

test("assigned=1 assigns that step and nothing else; finishing it clears the assignment", async () => {
  const h = makeHarness();
  await finishStep(h, "discover");
  await h.go("improve", { assigned: true });
  const b = h.state.peek().bands[BAND];
  assert.deepEqual(b.assigned, { mission: "m08", step: "improve" });
  assert.equal(b.missions.m08.steps.discover.status, "done");
  assert.equal(h.q("[data-journey-engine]") !== null, true, "opens the step directly");
  await h.finishPart();
  assert.equal(h.state.peek().bands[BAND].assigned, null);
  assert.equal(h.state.peek().bands[BAND].missions.m08.steps.discover.status, "done");
  const none = makeHarness();
  await none.go("build");
  assert.equal(none.state.peek().bands[BAND].assigned, null, "no assigned flag, no assignment");
});

test("the cursor follows the learner and moves forward on completion", async () => {
  const h = makeHarness();
  await h.go("build");
  assert.deepEqual(h.state.peek().bands[BAND].cursor, { mission: "m08", step: "build" });
  await h.finishPart();
  assert.deepEqual(h.state.peek().bands[BAND].cursor, { mission: "m08", step: "communicate" });
  await h.go("discover");
  await h.finishPart();
  await h.go("discover");
  assert.deepEqual(
    h.state.peek().bands[BAND].cursor.step,
    "understand",
    "revisiting a done step leaves the cursor alone",
  );
});

test("a reload resumes mid-step: finished parts stay finished", async () => {
  const h = makeHarness();
  await h.go("understand");
  await h.finishPart();
  assert.deepEqual(h.engines(), ["listen", "xray"]);
  await h.go("understand");
  assert.equal(h.engines().at(-1), "xray", "resumes at the read part");
  assert.match(h.q(".jr-part").textContent, /Part 2 of 2/);
});

test("spanish and bilingual chrome render in the language mode", async () => {
  const h = makeHarness();
  h.ctx.prefs.lang = "es";
  await h.go("build");
  assert.match(h.q(".jr-title-step").textContent, /Paso 3 de 6: Construye/);
  assert.match(h.text(), /Guardar y salir/);
  assert.match(h.text(), /Por mi cuenta/);
  h.ctx.prefs.lang = "bi";
  await h.go("build");
  assert.match(h.q(".jr-title-step").textContent, /Step 3 of 6: Build/);
  assert.match(h.q(".jr-title-step").textContent, /Paso 3 de 6/);
});

test("commit applies each writer in order, saves once, and ignores a writer that does not return a state", () => {
  const state = fakeState();
  let saves = 0;
  const deps = { state: { ...state.api, saveJourney: (s) => (saves++, state.api.saveJourney(s)) } };
  const out = commit(
    deps,
    (s) => state.api.setSupport(s, BAND, "A"),
    (s) => state.api.getStep(s, BAND, "m01", "discover"),
    () => undefined,
    (s) => state.api.setCursor(s, BAND, "m02", "build"),
  );
  assert.equal(saves, 1);
  assert.equal(out.bands[BAND].support, "A");
  assert.deepEqual(state.peek().bands[BAND], out.bands[BAND]);
  assert.deepEqual(state.peek().bands[BAND].cursor, { mission: "m02", step: "build" });
});

test("unmount calls the engine's own unmount and clears pending mounts", async () => {
  const h = makeHarness();
  let unmounted = 0;
  const original = h.deps.loadUI;
  h.deps.loadUI = async (name) => ({ ...(await original(name)), unmount: () => unmounted++ });
  await h.go("discover");
  unmountStep();
  assert.equal(unmounted, 1);
  unmountStep();
  assert.equal(unmounted, 1);
});
