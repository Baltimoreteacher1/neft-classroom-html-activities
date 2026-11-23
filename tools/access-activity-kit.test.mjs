/**
 * Guards the shared activity kit (access-practice-lab/src/activity-kit.js + the "activity kit" block of ds.css):
 *   - every zone, feedback status and interaction state the kit names has a style rule
 *   - the directions card, feedback panel, hint ladder and progress markup carry the roles, labels and structure a
 *     screen reader needs, and refuse feedback that does not teach (no reason) or unknown zones/statuses/states
 *   - the colour pairs the kit paints (status text on its tint, room ink on the directions tint) hold WCAG AA 4.5:1
 *   - text and focus tokens added for activity surfaces are defined once and sized for the 44px target floor
 * The browser behaviour (axe, 44px targets, hint reveal, state hiding) is tools/access-activity-kit-e2e.mjs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
const css = readFileSync(join(LAB, "ds.css"), "utf8");
const kit = await import(join(LAB, "src/activity-kit.js"));
const { makeI18n } = await import(join(LAB, "src/i18n.js"));
const { toHtml, raw } = await import(join(LAB, "src/util.js"));
const I = makeI18n("en");
const IBI = makeI18n("bi");
// The formatter may wrap tags across lines; compare on single-spaced markup.
const str = (v) => toHtml(v).replace(/\s+/g, " ").replace(/\s+>/g, ">").replace(/> </g, "><");

const rootBlock = css.slice(css.indexOf(":root {"), css.indexOf(".d-listening"));
// A token is a hex value or an alias (`--right: var(--status-success-text)`) that resolves to one.
const tok = (name, seen = new Set()) => {
  if (seen.has(name)) return undefined;
  seen.add(name);
  const m = rootBlock.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6}|var\\((--[a-z0-9-]+)\\))`));
  return m?.[2] ? tok(m[2], seen) : m?.[1];
};
const lum = (hex) => {
  const c = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("every zone, status and state has a rule in ds.css", () => {
  for (const z of kit.ZONES) assert.ok(css.includes(`.ak-zone-${z}`), `missing .ak-zone-${z}`);
  for (const s of kit.FEEDBACK_STATUSES)
    assert.ok(css.includes(`.ak-feedback.is-${s}`), `missing .ak-feedback.is-${s}`);
  for (const s of kit.ACTIVITY_STATES)
    assert.ok(css.includes(`[data-act-state="${s}"] [data-ak-in]`), `missing state rule ${s}`);
  assert.deepEqual(
    [...kit.ACTIVITY_STATES],
    ["start", "active", "response", "feedback", "retry", "next", "complete"],
  );
});

test("kit colour pairs meet WCAG AA 4.5:1", () => {
  const pairs = [
    ["--right", "--right-soft"],
    ["--hint", "--hint-soft"],
    ["--wrong", "--wrong-soft"],
    ["--brand-deep", "--brand-soft"],
    ["--ink", "--right-soft"],
    ["--ink", "--hint-soft"],
    ["--ink", "--wrong-soft"],
    ["--ink-2", "--surface-2"],
    ["--listening-ink", "--listening-soft"],
    ["--reading-ink", "--reading-soft"],
    ["--speaking-ink", "--speaking-soft"],
    ["--writing-ink", "--writing-soft"],
  ];
  for (const [fg, bg] of pairs) {
    const [a, b] = [tok(fg), tok(bg)];
    assert.ok(a && b, `${fg} / ${bg} must be hex tokens`);
    assert.ok(ratio(a, b) >= 4.5, `${fg} on ${bg} is ${ratio(a, b).toFixed(2)}:1`);
  }
  assert.ok(ratio(tok("--focus"), "#ffffff") >= 3, "focus ring must hold 3:1 on white");
});

test("activity tokens are defined once and the target floor is 44px", () => {
  for (const t of [
    "--fs-small",
    "--fs-body",
    "--fs-prompt",
    "--lh-body",
    "--measure-reading",
    "--target-min",
    "--focus-ring",
  ])
    assert.equal((css.match(new RegExp(`^\\s*${t}:`, "gm")) || []).length, 1, `${t} defined once`);
  assert.match(css, /--target-min:\s*2\.75rem/);
  assert.match(css, /--fs-body:\s*1rem/); // the editorial theme sets body text at 16px
  // a custom property that reads --room at :root would freeze the brand colour for every domain
  assert.ok(
    !/--zone-[a-z]+:\s*var\(--room/.test(rootBlock),
    "zone tokens must not read --room at :root",
  );
});

test("directions card names the four questions and folds the example", () => {
  const out = str(
    kit.directionsCardHTML(I, {
      learning: "I can find the main idea.",
      doThis: "Read the text and choose what it is mostly about.",
      how: ["Read once.", "Tap one answer.", "Press Check."],
      success: "Your answer names the big idea, not one detail.",
      example: { body: "Kites fly because air pushes them." },
    }),
  );
  for (const w of ["You are learning", "Your job", "How", "You did it when", "See an example"])
    assert.ok(out.includes(w), `missing "${w}"`);
  assert.match(
    out,
    /<section class="ak-directions[^"]*" data-zone="instructions" aria-labelledby="(ak-dir-\d+)"/,
  );
  assert.match(out, /<details class="ak-example">/);
  assert.match(out, /<ol class="ak-dir-steps">/);
  assert.match(out, /aria-label="Hear the directions aloud"/);
  const bare = str(kit.directionsCardHTML(I, { doThis: "Say it." }));
  assert.ok(
    !bare.includes("You are learning") && !bare.includes("ak-example"),
    "empty rows are omitted",
  );
});

test("directions escape learner-facing text and keep Spanish in its own lang span", () => {
  const out = str(kit.directionsCardHTML(I, { doThis: "Say <b>hi</b>" }));
  assert.ok(!out.includes("<b>hi</b>") && out.includes("&lt;b&gt;"));
  assert.match(str(kit.directionsCardHTML(IBI, { doThis: "Say it." })), /lang="es"/);
});

test("feedback must teach: a reason is required and statuses are closed", () => {
  assert.throws(() => kit.feedbackPanelHTML(I, { status: "right" }), /reason/);
  assert.throws(
    () => kit.feedbackPanelHTML(I, { status: "wrong", why: "x" }),
    /unknown feedback status/,
  );
  const out = str(
    kit.feedbackPanelHTML(I, {
      status: "partly",
      why: "You found the detail but not the big idea.",
      evidence: "the first sentence",
      next: "Ask: what is the whole text about?",
      live: true,
    }),
  );
  assert.match(out, /class="ak-feedback is-partly/);
  assert.match(out, /role="status"/);
  assert.ok(out.includes("Partly right") && out.includes("Look at") && out.includes("Next step"));
  assert.ok(
    !str(kit.feedbackPanelHTML(I, { status: "right", why: "Yes: it names the topic." })).includes(
      'role="status"',
    ),
  );
  for (const s of kit.FEEDBACK_STATUSES)
    assert.ok(str(kit.feedbackPanelHTML(I, { status: s, why: "Because." })).includes(`is-${s}`));
});

test("hint ladder: hidden rungs, counted, reopens after a re-render", () => {
  const fresh = str(
    kit.hintLadderHTML(I, ["Look at the title.", "The answer is a place.", "It is the library."]),
  );
  assert.equal((fresh.match(/class="ak-hint"/g) || []).length, 3);
  assert.equal((fresh.match(/ hidden>/g) || []).length, 3);
  assert.match(fresh, /data-hint-total="3" data-hints-used="0"/);
  assert.match(fresh, /Need a hint\? \(1 of 3\)/);
  const two = str(kit.hintLadderHTML(I, ["a", "b", "c"], { used: 2 }));
  assert.equal((two.match(/ hidden>/g) || []).length, 1);
  assert.match(two, /Another hint \(3 of 3\)/);
  assert.match(str(kit.hintLadderHTML(I, ["a"], { used: 5 })), /disabled/);
  assert.equal(str(kit.hintLadderHTML(I, [])), "");
});

test("zones, states and progress validate their inputs", () => {
  assert.throws(() => kit.zoneHTML(I, "banner", "x"), /unknown zone/);
  const z = str(kit.zoneHTML(I, "stimulus", raw("<p>Text</p>"), { id: "z1" }));
  assert.match(
    z,
    /<section class="ak-zone ak-zone-stimulus[^"]*" data-zone="stimulus" aria-labelledby="z1">/,
  );
  assert.match(z, /<h3 id="z1" class="ak-zone-label ">\s?Read, listen or look\s?<\/h3>/);
  assert.match(str(kit.zoneHTML(I, "response", "", { hideLabel: true })), /visually-hidden/);
  const el = { dataset: {}, dispatchEvent() {} };
  globalThis.CustomEvent ??= class {
    constructor(t, o) {
      this.type = t;
      this.detail = o?.detail;
    }
  };
  assert.equal(kit.setActivityState(el, "feedback"), "feedback");
  assert.equal(el.dataset.actState, "feedback");
  assert.throws(() => kit.setActivityState(el, "done"), /unknown state/);
  const p = str(kit.activityProgressHTML(I, 9, 4));
  assert.match(p, /aria-valuenow="4" aria-valuetext="Question 4 of 4"/);
  assert.ok(p.includes("width:100%"));
});
