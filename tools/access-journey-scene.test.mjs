// Living Language World (DISCOVER step): the pure scene engine, the backdrop art and the scene UI.
//
//   node --test tools/access-journey-scene.test.mjs
//
// The engine tests drive src/journey/engines/scene.js with the real m08 pack (both grade bands). The UI tests
// render src/journey/ui/scene.js in jsdom (set JSDOM_PATH to a jsdom entry when it is not resolvable from here).
import assert from "node:assert/strict";
import test from "node:test";
import pack from "../access-practice-lab/src/content/journey/m08.js";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import {
  analysis,
  canExplain,
  canSend,
  currentOutcome,
  doneCriteria,
  evaluateExplanation,
  examine,
  init,
  ledgerEntry,
  manipulations,
  NEUTRAL_OUTCOME,
  notebook,
  recordExchange,
  setControl,
} from "../access-practice-lab/src/journey/engines/scene.js";
import {
  ENVIRONMENT_IDS,
  environmentArt,
  MOODS,
} from "../access-practice-lab/src/journey/ui/environments.js";
import { mount, render } from "../access-practice-lab/src/journey/ui/scene.js";
import { appendEntry } from "../access-practice-lab/src/lang/ledger.js";
import { toHtml } from "../access-practice-lab/src/util.js";

const BANDS = ["3-5", "6-8"];
const taskOf = (band) => pack.bands[band].discover;

/** A state where the learner looked at `ids` and changed the first control. */
function played(task, ids) {
  let s = init(task);
  for (const id of ids) s = examine(s, id, task);
  const ctl = task.controls[0];
  const other = ctl.options.find((o) => o.id !== ctl.initial);
  return setControl(s, ctl.id, other.id, task);
}
const noteTexts = (task) => task.objects.map((o) => o.note);

// ── outcomes ─────────────────────────────────────────────────────────────────────────────────────
test("currentOutcome picks the most specific match, whatever the authoring order", () => {
  const task = {
    controls: [],
    outcomes: [
      { when: { sun: "full" }, mood: "warn", key: "broad", state: "broad" },
      { when: {}, mood: "warn", key: "default", state: "default" },
      { when: { sun: "full", water: "daily" }, mood: "good", key: "narrow", state: "narrow" },
    ],
  };
  assert.equal(currentOutcome(task, { controls: { sun: "full", water: "daily" } }).key, "narrow");
  assert.equal(currentOutcome(task, { controls: { sun: "full", water: "none" } }).key, "broad");
  assert.equal(currentOutcome(task, { controls: { sun: "shade", water: "none" } }).key, "default");
});

test("currentOutcome falls back to a neutral state when nothing matches", () => {
  const out = currentOutcome(
    { outcomes: [{ when: { sun: "full" }, mood: "good", key: "k", state: "s" }] },
    { controls: { sun: "shade" } },
  );
  assert.equal(out, NEUTRAL_OUTCOME);
  assert.equal(out.mood, "neutral");
  assert.match(out.state, /nothing has changed/i);
});

for (const band of BANDS) {
  test(`m08 ${band}: every combination of controls resolves to an authored outcome`, () => {
    const task = taskOf(band);
    for (const o of task.outcomes) {
      const out = currentOutcome(task, { controls: o.when });
      assert.equal(out.key, o.key);
      assert.notEqual(out, NEUTRAL_OUTCOME);
    }
    assert.notEqual(
      currentOutcome(task, init(task)),
      NEUTRAL_OUTCOME,
      "the starting scene shows a real outcome",
    );
  });
}

test("m08 3-5: moving a control changes what the scene shows", () => {
  const task = taskOf("3-5");
  const s = init(task);
  assert.equal(currentOutcome(task, s).key, "slow");
  assert.equal(currentOutcome(task, setControl(s, "sun", "full", task)).key, "thrive");
  assert.equal(currentOutcome(task, setControl(s, "water", "none", task)).key, "poor");
});

// ── examine, collect, manipulations, done criteria ───────────────────────────────────────────────
test("examine records observations in examine order, once, and ignores unknown ids", () => {
  const task = taskOf("3-5");
  let s = init(task);
  for (const id of ["chart", "bed2", "chart", "nope"]) s = examine(s, id, task);
  assert.deepEqual(s.examined, ["chart", "bed2"]);
  assert.deepEqual(
    notebook(task, s).map((n) => n.id),
    ["chart", "bed2"],
  );
  assert.equal(notebook(task, s)[0].note, task.objects.find((o) => o.id === "chart").note);
  assert.deepEqual(init(task).examined, [], "examine never mutates the earlier state");
});

test("setControl counts distinct changes; the same value again is not a change", () => {
  const task = taskOf("3-5");
  let s = init(task);
  assert.equal(manipulations(s), 0);
  s = setControl(s, "sun", "shade", task);
  assert.equal(manipulations(s), 0, "the initial value is not a change");
  s = setControl(s, "sun", "full", task);
  s = setControl(s, "sun", "full", task);
  assert.equal(manipulations(s), 1);
  s = setControl(s, "sun", "shade", task);
  s = setControl(s, "sun", "full", task);
  s = setControl(s, "water", "none", task);
  assert.equal(manipulations(s), 3, "distinct control=option pairs");
  assert.equal(
    setControl(s, "sun", "bogus", task),
    s,
    "unknown options are ignored when the task is given",
  );
});

for (const band of BANDS) {
  test(`m08 ${band}: canExplain needs the collect count AND one manipulation; doneCriteria follows`, () => {
    const task = taskOf(band);
    const ids = task.objects.map((o) => o.id);
    let s = init(task);
    assert.equal(canExplain(task, s), false);
    for (const id of ids.slice(0, task.collect)) s = examine(s, id, task);
    assert.equal(canExplain(task, s), false, "observations alone are not enough");
    let c = doneCriteria(task, s);
    assert.equal(c.collect, true);
    assert.equal(c.manipulated, false);
    s = played(task, ids.slice(0, task.collect));
    assert.equal(canExplain(task, s), true);
    assert.equal(canExplain(task, played(task, ids.slice(0, task.collect - 1))), false);
    c = doneCriteria(task, s);
    assert.deepEqual([c.explained, c.replied, c.done], [false, false, false]);
    const text = "I think the sun matters because Bed 2 gets only two hours of sun.";
    s = recordExchange(s, text, evaluateExplanation(task, text, s));
    c = doneCriteria(task, s);
    assert.equal(c.explained && c.replied && c.done, true);
  });
}

// ── explanation: the partner answers from what the learner wrote ─────────────────────────────────
const sunState = (task) => played(task, ["bed2", "chart", "can"]);

test("no cause named -> the partner asks for a cause", () => {
  const task = taskOf("3-5");
  const r = evaluateExplanation(
    task,
    "The plants look bad and they are small and yellow today.",
    sunState(task),
  );
  assert.equal(r.reply.tag, "no-cause");
  assert.equal(r.reply.text, task.partner.noCause);
  assert.equal(r.reply.speaker, task.partner.name);
  assert.deepEqual(r.variablesNamed, []);
});

test("weird or unrelated text still gets a reply (never blocks)", () => {
  const task = taskOf("3-5");
  for (const text of ["banana elephant trampoline", "asdf qwer zxcv", "idk", ""]) {
    const r = evaluateExplanation(task, text, sunState(task));
    assert.equal(r.reply.tag, "no-cause", text);
    assert.ok(r.reply.text.length > 0);
  }
});

test("sun with evidence: seven hours / 7 hours both count and are quoted back in the learner's own words", () => {
  const task = taskOf("3-5");
  for (const text of [
    "The sun is the cause because Bed 2 gets only two hours of sun and Bed 1 gets seven hours.",
    "I think the shade made them small. The sun chart says Bed 1 gets 7 hours of sun and Bed 2 gets 2 hours.",
  ]) {
    const r = evaluateExplanation(task, text, sunState(task));
    assert.equal(r.reply.tag, "ack", text);
    assert.deepEqual(r.variablesNamed, ["sun"]);
    const ev = r.evidence[0];
    assert.equal(ev.variable, "sun");
    assert.ok(ev.sufficient && ev.quotes.length >= 1);
    for (const q of ev.quotes)
      assert.equal(text.slice(q.start, q.end), q.text, "quotes are spans of the learner's text");
    assert.ok(r.reply.text.includes(`“${ev.quotes[0].text}”`), "the reply quotes the learner");
    assert.ok(r.reply.text.includes("Sun chart"), "names what they used, by label");
    assert.ok(r.reply.text.endsWith(task.partner.thanks), "followed by the closing line");
    assert.ok(r.examinedUseful.includes("chart"));
  }
});

test("a different valid cause (water) gets the WATER probe, not the sun probe", () => {
  const task = taskOf("3-5");
  const r = evaluateExplanation(
    task,
    "I think the plants in Bed 2 are yellow because they did not get enough water.",
    sunState(task),
  );
  const water = task.variables.find((v) => v.id === "water");
  const sun = task.variables.find((v) => v.id === "sun");
  assert.equal(r.reply.tag, "probe");
  assert.deepEqual(r.variablesNamed, ["water"]);
  assert.equal(r.reply.text, water.probe);
  assert.notEqual(r.reply.text, sun.probe);
});

test("water with evidence from the watering log is acknowledged for water", () => {
  const task = taskOf("3-5");
  const r = evaluateExplanation(
    task,
    "Maybe it is the water, but the watering log says both beds get 2 cups every morning.",
    sunState(task),
  );
  assert.equal(r.reply.tag, "ack");
  assert.deepEqual(r.variablesNamed, ["water"]);
  assert.match(r.reply.text, /idea about water/);
  assert.match(r.reply.text, /Watering log/);
});

test("soil gets the soil probe; a cause with no evidence gets the evidence question for THAT cause", () => {
  const task = taskOf("3-5");
  const soil = evaluateExplanation(task, "It could be the soil in Bed 2.", sunState(task));
  assert.equal(soil.reply.tag, "probe");
  assert.equal(soil.reply.text, task.variables.find((v) => v.id === "soil").probe);
  const sun = evaluateExplanation(task, "I think it is the sun.", sunState(task));
  assert.equal(sun.reply.tag, "probe");
  assert.equal(sun.reply.text, task.variables.find((v) => v.id === "sun").probe);
});

test("inflections match: shaded, shade, shading all name sunlight", () => {
  const task = taskOf("3-5");
  for (const text of [
    "The shaded plants are small.",
    "Bed 2 is in the shade.",
    "The tree is shading the bed.",
  ]) {
    assert.deepEqual(evaluateExplanation(task, text, sunState(task)).variablesNamed, ["sun"], text);
  }
});

test("a cause with no supporting observation examined -> asks, as a question, to look at something by label", () => {
  for (const band of BANDS) {
    const task = taskOf(band);
    const s = played(task, ["packet"]);
    const text =
      band === "3-5"
        ? "I think the sun is the reason."
        : "I think the shadow from the gym is the reason.";
    const r = evaluateExplanation(task, text, s);
    assert.equal(r.reply.tag, "unexamined", band);
    assert.ok(r.reply.text.includes("?"), "it is a question");
    const label = band === "3-5" ? "Sun chart" : "Shadow map";
    assert.ok(r.reply.text.includes(label), `names the ${label} by label`);
    for (const note of noteTexts(task)) assert.ok(!r.reply.text.includes(note));
    assert.ok(!/\d/.test(r.reply.text), "never states what an observation says");
  }
});

test("the partner never repeats a note and never states the answer", () => {
  const texts = [
    "I think the sun matters.",
    "The sun is the cause because Bed 2 gets only two hours of sun.",
    "Maybe water.",
    "The soil is the cause.",
    "The gym wing shadow and the compacted soil both lowered the yield, 4 of 8 hours of sun and 45 minutes to drain.",
    "nothing",
  ];
  for (const band of BANDS) {
    const task = taskOf(band);
    const s = played(
      task,
      task.objects.map((o) => o.id),
    );
    for (const text of texts) {
      const r = evaluateExplanation(task, text, s);
      for (const note of noteTexts(task))
        assert.ok(!r.reply.text.includes(note), `${band}: reply repeats a note`);
      if (r.reply.tag !== "ack")
        assert.ok(!/\d/.test(r.reply.text), `${band}: ${r.reply.tag} reply states a number`);
    }
  }
});

test("independent flag: no hint is offered; the partner's question is unchanged", () => {
  const task = taskOf("3-5");
  const text = "I think it is the sun.";
  const own = evaluateExplanation(task, text, sunState(task), { independent: true });
  const helped = evaluateExplanation(task, text, sunState(task), { independent: false });
  assert.equal(own.hint, null);
  assert.equal(helped.hint.text, task.variables.find((v) => v.id === "sun").good);
  assert.equal(own.reply.text, helped.reply.text);
});

test("needsMore follows respond.minWords and never changes the reply", () => {
  const task = taskOf("3-5");
  const short = evaluateExplanation(task, "It is the sun.", sunState(task));
  const long = evaluateExplanation(
    task,
    "It is the sun because Bed 2 gets only two hours of sun each day and Bed 1 gets seven.",
    sunState(task),
  );
  assert.equal(short.needsMore, true);
  assert.equal(long.needsMore, false);
  assert.equal(canSend("ok"), false);
  assert.equal(canSend("It is the sun."), true);
});

test("6-8: any of four valid causes is recognised, each with its own probe or acknowledgement", () => {
  const task = taskOf("6-8");
  const s = played(task, ["chart", "shadow", "probe", "log", "thermo"]);
  const byText = {
    soil: "The soil is compacted and the trucks drove on it.",
    temp: "Maybe the weather was hotter this summer.",
    water: "Perhaps the irrigation was the problem.",
  };
  for (const [id, text] of Object.entries(byText)) {
    const r = evaluateExplanation(task, text, s);
    assert.deepEqual(r.variablesNamed, [id], text);
    assert.equal(r.reply.text, task.variables.find((v) => v.id === id).probe);
  }
  const strong = evaluateExplanation(
    task,
    "The soil probe shows water pools for 45 minutes where healthy beds drain in 5 minutes after the trucks drove on them.",
    s,
  );
  assert.equal(strong.reply.tag, "ack");
  assert.match(strong.reply.text, /45 minutes/);
  assert.match(strong.reply.text, /Soil probe/);
  const shadow = evaluateExplanation(
    task,
    "The new gym wing blocks the afternoon sun, so the beds lose 4 of their 8 hours.",
    s,
  );
  assert.equal(shadow.reply.tag, "ack");
  assert.deepEqual(shadow.variablesNamed, ["sun"]);
});

test("a learner who names two causes is answered about the one they backed with evidence", () => {
  const task = taskOf("3-5");
  const r = evaluateExplanation(
    task,
    "It could be water or the sun, but Bed 2 gets only 2 hours of sun while Bed 1 gets 7 hours.",
    sunState(task),
  );
  assert.equal(r.reply.tag, "ack");
  assert.deepEqual(r.variablesNamed.sort(), ["sun", "water"]);
  assert.match(r.reply.text, /sunlight/);
});

// ── ledger ───────────────────────────────────────────────────────────────────────────────────────
test("ledgerEntry: mission discover entry, independent only when no help was opened", () => {
  const task = taskOf("3-5");
  const text = "The sun is the cause because Bed 2 gets only two hours of sun.";
  const base = {
    task,
    text,
    missionId: "m08",
    band: "3-5",
    keyUse: "Explain",
    state: sunState(task),
  };
  const own = ledgerEntry({ ...base });
  assert.equal(own.src, "mission");
  assert.equal(own.task, "m08.discover");
  assert.equal(own.kind, "first");
  assert.equal(own.stage, "independent");
  assert.deepEqual(own.supports, {});
  const helped = ledgerEntry({ ...base, help: ["frames", "vocab"] });
  assert.equal(helped.stage, "supported");
  assert.deepEqual(Object.keys(helped.supports).sort(), ["bank", "frames", "l1"]);
  const hinted = ledgerEntry({ ...base, help: ["hint"], kind: "revision" });
  assert.equal(hinted.stage, "supported");
  assert.equal(hinted.kind, "revision");
  assert.equal(hinted.supports.hint, true);
  const ledger = { entries: [] };
  const entry = appendEntry(ledger, own);
  assert.equal(entry.stage, "independent");
  assert.ok(entry.m.words > 5);
  assert.equal(
    analysis(task, text, "Explain", "3-5", "supported", sunState(task)).ledger.words,
    entry.m.words,
  );
});

// ── backdrops ────────────────────────────────────────────────────────────────────────────────────
function hueOf(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (!d) return { h: 0, s: 0 };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s };
}
const meanSat = (svg) => {
  const hexes = [...svg.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => hueOf(m[0]).s);
  return hexes.reduce((a, b) => a + b, 0) / hexes.length;
};

test("environmentArt: all eight environments, every mood and band, no purple/violet/magenta", () => {
  assert.equal(ENVIRONMENT_IDS.length, 8);
  for (const id of ENVIRONMENT_IDS) {
    for (const band of BANDS) {
      for (const mood of MOODS) {
        const svg = toHtml(environmentArt(id, mood, band));
        assert.match(svg, /^<svg [^>]*viewBox="0 0 800 480"/);
        assert.match(svg, /role="img"/);
        assert.match(svg, /aria-hidden="true"/);
        assert.ok(!/NaN|undefined/.test(svg), `${id}/${mood}/${band}`);
        for (const [hex] of svg.matchAll(/#[0-9a-f]{6}\b/gi)) {
          const { h, s } = hueOf(hex);
          assert.ok(
            s <= 0.15 || h < 255 || h > 335,
            `${id}/${mood}/${band}: ${hex} is in the forbidden hue range`,
          );
        }
      }
    }
    const good = toHtml(environmentArt(id, "good", "3-5"));
    assert.notEqual(
      good,
      toHtml(environmentArt(id, "bad", "3-5")),
      `${id}: mood changes the picture`,
    );
    assert.ok(
      meanSat(toHtml(environmentArt(id, "neutral", "6-8"))) <
        meanSat(toHtml(environmentArt(id, "neutral", "3-5"))),
      `${id}: 6-8 is calmer`,
    );
  }
  assert.throws(() => environmentArt("moon"), /Unknown environment/);
});

// ── jsdom: the scene UI ──────────────────────────────────────────────────────────────────────────
let JSDOM = null;
try {
  ({ JSDOM } = await import(process.env.JSDOM_PATH || "jsdom"));
} catch {
  console.warn("jsdom not resolvable: scene UI tests skipped (set JSDOM_PATH)");
}
const ui = JSDOM ? test : test.skip;

/** A shell stand-in: holds env.data, repaints on update (like the real shell) and records every call. */
function shell({ band = "3-5", support = "A", independent = false, data = {} } = {}) {
  const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>');
  const root = dom.window.document.getElementById("root");
  const log = { help: [], done: [], ledger: [], announce: [] };
  const task = taskOf(band);
  const env = {
    I: makeI18n("en"),
    band,
    support,
    independent,
    missionId: "m08",
    step: "discover",
    mission: { klu: "Explain", environment: "garden" },
    pack: pack.bands[band],
    data,
    update(patch) {
      env.data = { ...env.data, ...patch };
      paint();
    },
    help: (id) => log.help.push(id),
    done: (r) => log.done.push(r),
    ledger: (e) => log.ledger.push(e),
    announce: (m) => log.announce.push(m),
    navigate() {},
  };
  const paint = () => {
    root.innerHTML = toHtml(render(task, env));
    mount(root, env);
  };
  paint();
  return { dom, root, env, log, task, paint };
}
const $$ = (root, sel) => [...root.querySelectorAll(sel)];
/** Type like a learner: set the value and fire the input event the counter and Send button listen to. */
function type(root, selector, text) {
  const field = root.querySelector(selector);
  field.value = text;
  field.dispatchEvent(new root.ownerDocument.defaultView.Event("input", { bubbles: true }));
}
// The shell rebuilds the markup on every update, so elements are looked up again for each action.
const unlock = (s) => {
  for (let i = 0; i < s.task.collect; i++) $$(s.root, "button.sc-hot")[i].click();
  $$(s.root, `input[data-sc-control="${s.task.controls[0].id}"]`)
    .find((i) => !i.checked)
    .click();
};

for (const band of BANDS) {
  ui(
    `ui ${band}: hotspots are real buttons with "examine" names, controls are radio groups, the art is inline`,
    () => {
      const { root, task } = shell({ band });
      const hot = $$(root, "button.sc-hot");
      assert.equal(hot.length, task.objects.length);
      for (const b of hot) {
        assert.equal(b.tagName, "BUTTON");
        assert.match(b.getAttribute("aria-label"), /examine/i);
        assert.match(b.style.left, /%$/);
        assert.ok(b.querySelector(".sc-hot-label").textContent.trim().length > 0, "visible label");
        assert.ok(b.querySelector(".sc-hot-glyph").textContent.trim().length > 0, "glyph");
      }
      assert.ok(root.querySelector(".sc-stage svg.ea-garden"));
      const groups = $$(root, "fieldset.sc-ctrl");
      assert.equal(groups.length, task.controls.length);
      task.controls.forEach((ctl, i) => {
        const radios = $$(groups[i], 'input[type="radio"]');
        assert.equal(radios.length, ctl.options.length);
        assert.equal(new Set(radios.map((r) => r.name)).size, 1, "one name per group");
        assert.equal(radios.filter((r) => r.checked).length, 1);
        assert.ok(groups[i].querySelector("legend"));
      });
      assert.ok(root.querySelector(".sc-state[role='status']"));
      assert.ok(
        root.querySelector(".sc-locked"),
        "explanation is locked until the learner has looked and tried",
      );
    },
  );
}

ui(
  "ui: examining fills the notebook in order, a control change updates the state card and the art",
  () => {
    const s = shell();
    const outcome = () => s.root.querySelector(".sc-state").dataset.mood;
    assert.equal(outcome(), "warn");
    s.root.querySelector("button.sc-hot[data-sc-examine='bed2']").click();
    s.root.querySelector("button.sc-hot[data-sc-examine='bed1']").click();
    const notes = $$(s.root, ".sc-note strong").map((n) => n.textContent);
    assert.deepEqual(notes, ["Bed 2 plants", "Bed 1 plants"], "examine order");
    assert.equal(s.log.announce.length, 2);
    // A note that already opens with its label is spoken once, not "Bed 1 plants. Bed 1 plants: ...".
    for (const say of s.log.announce)
      assert.doesNotMatch(say, /^([^.:]+)\. \1\b/, `no stuttered label: ${say}`);
    $$(s.root, 'input[data-sc-control="sun"]')
      .find((i) => i.value === "full")
      .click();
    assert.equal(outcome(), "good");
    assert.equal(s.root.querySelector(".sc-stage").dataset.mood, "good");
    assert.equal(s.root.querySelector(".sc-stage").dataset.pulse, "1");
    assert.match(s.root.querySelector(".sc-state-text").textContent, /tall and dark green/);
    assert.equal(s.env.data.scene.changes.length, 1);
    assert.ok(s.root.querySelector(".sc-locked"), "still one look short");
  },
);

ui("ui: support modes A / B / C and on-my-own render the right helps", () => {
  const frames = pack.bands["3-5"].frames;
  const a = shell({ support: "A" });
  unlock(a);
  assert.equal($$(a.root, ".sc-frame").length, frames.A.length);
  assert.equal($$(a.root, ".sc-word").length, pack.bands["3-5"].vocab.length);
  const b = shell({ support: "B" });
  unlock(b);
  assert.equal($$(b.root, ".sc-frame").length, frames.B.length);
  assert.equal($$(b.root, ".sc-word").length, 0);
  const c = shell({ support: "C" });
  unlock(c);
  assert.equal($$(c.root, ".sc-frame, .sc-word, [data-sc-help]").length, 0);
  const own = shell({ support: "A", independent: true });
  unlock(own);
  assert.equal(
    $$(own.root, ".sc-frame, .sc-word, [data-sc-help], details").length,
    0,
    "independent renders no frames, vocabulary or hints",
  );
  assert.ok(own.root.querySelector(".sc-own"));
  assert.ok(own.root.querySelector("textarea[data-sc-draft]"));
});

ui(
  "ui: opening frames or vocabulary records help; a vocabulary chip shows the Spanish gloss",
  () => {
    const s = shell({ support: "A" });
    unlock(s);
    s.root.querySelector('summary[data-sc-help="frames"]').click();
    assert.deepEqual(s.log.help, ["frames"]);
    s.root.querySelector('summary[data-sc-help="vocab"]').click();
    assert.deepEqual(s.log.help, ["frames", "vocab"]);
    assert.deepEqual(s.env.data.helps, ["frames", "vocab"]);
    const chip = s.root.querySelector(".sc-word");
    chip.click();
    assert.match(s.root.querySelector("[data-sc-gloss] [lang='es']").textContent, /luz del sol/i);
    const field = s.root.querySelector("[data-sc-draft]");
    s.root.querySelector(".sc-frame").click();
    assert.match(field.value, /___/, "a frame is inserted into the explanation");
  },
);

ui(
  "ui: persistence round trip through a fake env resumes controls, notebook, helps and draft",
  () => {
    const first = shell();
    unlock(first);
    first.root.querySelector('summary[data-sc-help="frames"]').click();
    const field = first.root.querySelector("[data-sc-draft]");
    field.value = "The shade is the reason";
    field.dispatchEvent(new first.dom.window.Event("input", { bubbles: true }));
    assert.equal(
      first.root.querySelector("[data-sc-send]").disabled,
      false,
      "enabled after a few words",
    );
    first.root.querySelector("button.sc-hot[data-sc-examine='can']").click(); // any action persists the draft
    const saved = JSON.parse(JSON.stringify(first.env.data));
    assert.equal(saved.draft, "The shade is the reason");

    const second = shell({ data: saved });
    assert.deepEqual(
      $$(second.root, ".sc-note strong").map((n) => n.textContent),
      $$(first.root, ".sc-note strong").map((n) => n.textContent),
    );
    assert.equal(second.root.querySelector('input[data-sc-control="sun"]:checked').value, "full");
    assert.equal(second.root.querySelector("[data-sc-draft]").value, "The shade is the reason");
    assert.ok(second.root.querySelector('details.sc-help[open] summary[data-sc-help="frames"]'));
    assert.equal(second.root.querySelector(".sc-locked"), null, "the explanation stays unlocked");
  },
);

ui(
  "ui: send -> one ledger entry and done() once; a probe offers an optional second answer that is recorded",
  () => {
    const s = shell({ support: "B" });
    unlock(s);
    type(s.root, "[data-sc-draft]", "I think it is the sun because the plants need it.");
    s.root.querySelector("[data-sc-send]").click();
    assert.equal(s.log.done.length, 1);
    assert.equal(s.log.done[0].mode, "write");
    assert.deepEqual(s.log.done[0].variables, ["sun"]);
    assert.equal(s.log.ledger.length, 1);
    assert.equal(s.log.ledger[0].task, "m08.discover");
    assert.equal(s.log.ledger[0].stage, "independent", "no help was opened");
    const reply = s.root.querySelector("[data-sc-reply]");
    assert.equal(reply.dataset.tag, "probe");
    assert.match(reply.textContent, /What numbers or notes show/);
    assert.equal(
      s.root.querySelector("[data-sc-draft]"),
      null,
      "the first box is replaced by what was sent",
    );
    type(s.root, "[data-sc-draft2]", "The chart says Bed 2 gets 2 hours of sun.");
    s.root.querySelector("[data-sc-send2]").click();
    assert.equal(s.log.ledger.length, 2);
    assert.equal(s.log.ledger[1].kind, "revision");
    assert.equal(s.log.done.length, 1, "the step completes after one answered exchange");
    assert.match(
      s.root.querySelector(".sc-wrote:last-of-type, .sc-wrote + .sc-wrote").textContent,
      /2 hours of sun/,
    );
  },
);

ui(
  "ui: help opened before sending marks the ledger entry supported; a strong answer needs no second box",
  () => {
    const s = shell({ support: "A" });
    unlock(s);
    s.root.querySelector('summary[data-sc-help="frames"]').click();
    type(
      s.root,
      "[data-sc-draft]",
      "The sun is the cause because Bed 2 gets only two hours of sun and Bed 1 gets seven hours.",
    );
    s.root.querySelector("[data-sc-send]").click();
    assert.equal(s.log.ledger[0].stage, "supported");
    assert.equal(s.log.ledger[0].supports.frames, true);
    assert.deepEqual(s.log.done[0].supportsUsed, ["frames"]);
    assert.equal(s.root.querySelector("[data-sc-reply]").dataset.tag, "ack");
    assert.equal(s.root.querySelector("[data-sc-draft2]"), null);
  },
);

ui(
  "ui: a reload after sending shows the answered exchange and does not offer to send again",
  () => {
    const s = shell();
    unlock(s);
    type(s.root, "[data-sc-draft]", "I think it is the sun because the plants need it.");
    s.root.querySelector("[data-sc-send]").click();
    const again = shell({ data: JSON.parse(JSON.stringify(s.env.data)) });
    assert.ok(again.root.querySelector("[data-sc-reply]"));
    assert.equal(again.root.querySelector("[data-sc-send]"), null);
    assert.equal(again.log.done.length, 0, "rendering never re-reports completion");
  },
);
