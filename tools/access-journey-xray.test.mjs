// Reading X-Ray Vision (Journey `read` engine): pure rules over the real m08 content, then a jsdom click-through.
//
//   node --test tools/access-journey-xray.test.mjs
//
// jsdom is optional here: without it the DOM tests are skipped and the pure-engine tests still run.
import assert from "node:assert/strict";
import test from "node:test";
import m08 from "../access-practice-lab/src/content/journey/m08.js";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import * as X from "../access-practice-lab/src/journey/engines/xray.js";
import * as UI from "../access-practice-lab/src/journey/ui/xray.js";

const jsdom = await import("jsdom").then(
  (m) => m,
  () => null,
);
const BANDS = ["3-5", "6-8"];
const taskOf = (band) => m08.bands[band].understand.read;
const flat = (m) => (Array.isArray(m) ? m.join(" ") : String(m));
const withSel = (task, ids, stage = "main") => {
  let st = X.init(task, stage);
  const v = X.stageView(task, stage);
  st = X.chooseClaim(task, st, v.claim).state;
  for (const id of ids) st = X.toggleEvidence(st, id);
  return st;
};
const textOf = (task, id, stage = "main") =>
  X.stageView(task, stage).passage.find((s) => s.id === id).text;

// A model explanation per band: a reasoning word plus details that only the chosen evidence contains.
const GOOD = {
  "3-5": "Bed 2 gets only two hours of sun, so the bean plants stay small because they need light.",
  "6-8":
    "Water pooled for 45 minutes after the trucks crossed, so the roots cannot get oxygen because the soil is packed.",
};
const GOOD_TRANSFER = {
  "3-5":
    "The soil is dry and cracked every afternoon, so the tomatoes wilt because the pots need water.",
  "6-8":
    "Oxygen readings fell from 8 to 2, so the fish had less to breathe because the algae used it up.",
};

for (const band of BANDS) {
  const task = taskOf(band);
  const c = task.challenge;
  const otherClaim = task.claimOptions.find((id) => id !== c.claim);

  test(`${band}: claim choice accepts only the challenge claim; another claim gets a gentle redirect`, () => {
    const s0 = X.init(task);
    assert.equal(s0.claim, null);
    const notClaim = X.chooseClaim(task, s0, c.valid[0]);
    assert.equal(notClaim.kind, "not-claim");
    assert.equal(notClaim.state.claim, null);
    const redirect = X.chooseClaim(task, s0, otherClaim);
    assert.equal(redirect.kind, "redirect");
    assert.equal(redirect.state.claim, null);
    assert.match(flat(redirect.message), /Investigate a different claim instead\?/);
    const ok = X.chooseClaim(task, s0, c.claim);
    assert.equal(ok.kind, "chosen");
    assert.equal(ok.state.claim, c.claim);
    // the claim is never evidence for itself
    assert.deepEqual(X.toggleEvidence(ok.state, c.claim).selected, []);
  });

  test(`${band}: selections classify as sufficient / partial / insufficient / weak-only / irrelevant-only`, () => {
    const ev = (ids) => X.evaluateSelection(task, withSel(task, ids));
    assert.equal(ev([]).status, "none");
    const suff = ev(c.valid.slice(0, c.minValid));
    assert.equal(suff.status, "sufficient");
    assert.equal(suff.missingCount, 0);
    const partial = ev(c.valid.slice(0, c.minValid - 1).concat(c.weak[0]));
    assert.equal(partial.status, "partial");
    const some = ev(c.valid.slice(0, 1));
    assert.equal(some.status, c.minValid > 1 ? "partial" : "sufficient");
    assert.equal(some.missingCount, Math.max(0, c.minValid - 1));
    const weakOnly = ev([c.weak[0]]);
    assert.equal(weakOnly.status, "insufficient");
    assert.deepEqual(weakOnly.weak, [c.weak[0]]);
    assert.deepEqual(weakOnly.valid, []);
    const irrOnly = ev([otherClaim]);
    assert.equal(irrOnly.status, "insufficient");
    assert.deepEqual(irrOnly.irrelevant, [otherClaim]);
    assert.deepEqual(irrOnly.weak, []);
    // enough valid sentences plus a weak one is not ready to connect: the extra must be removed first
    const extra = ev(c.valid.slice(0, c.minValid).concat(c.weak[0]));
    assert.equal(extra.status, "partial");
    assert.equal(extra.missingCount, 0);
    assert.deepEqual(extra.weak, [c.weak[0]]);
    // the three kinds produce three different messages
    assert.equal(
      new Set([flat(weakOnly.message), flat(irrOnly.message), flat(suff.message)]).size,
      3,
    );
    // a weak sentence is explained in general terms
    assert.match(flat(weakOnly.message), /same topic|mismo tema/);
    assert.ok(weakOnly.items[0].note.every((n) => n.length > 10));
  });

  test(`${band}: missingCount is a number and no feedback ever contains an unselected valid sentence`, () => {
    const ids = task.passage.map((s) => s.id).filter((id) => id !== c.claim);
    for (let mask = 0; mask < 2 ** ids.length; mask++) {
      const picked = ids.filter((_, i) => mask & (1 << i));
      const r = X.evaluateSelection(task, withSel(task, picked));
      assert.equal(typeof r.missingCount, "number");
      const text = flat(r.message);
      for (const id of c.valid.filter((x) => !picked.includes(x))) {
        const full = textOf(task, id);
        const lead = full.split(/\s+/).slice(0, 5).join(" ");
        assert.ok(!text.includes(full), `message leaks ${id}`);
        assert.ok(!text.includes(lead), `message leaks the start of ${id}`);
        assert.ok(!new RegExp(`\\b${id}\\b`).test(text), `message names ${id}`);
      }
      for (const id of picked) {
        const quoted = r.items.find((i) => i.id === id);
        assert.ok(text.includes(quoted.snippet), "message quotes the learner's selection");
      }
    }
  });

  test(`${band}: checkEvidence counts attempts and remembers off-target tries; buildLink needs sufficient evidence`, () => {
    let st = withSel(task, [c.weak[0], c.valid[0]]);
    const r = X.checkEvidence(task, st);
    assert.equal(r.state.attempts, 1);
    assert.deepEqual(r.state.misses.weak, [c.weak[0]]);
    assert.equal(X.buildLink(task, r.state, 1), r.state, "no link from an insufficient selection");
    st = withSel(task, c.valid.slice(0, c.minValid));
    const linked = X.buildLink(task, st, 123);
    assert.deepEqual(linked.link.evidence.sort(), c.valid.slice(0, c.minValid).sort());
    assert.equal(linked.link.claim, c.claim);
    assert.equal(linked.link.at, 123);
    assert.equal(
      X.toggleEvidence(linked, c.valid[c.valid.length - 1]),
      linked,
      "linked evidence is locked",
    );
    assert.deepEqual(X.stageSummary({ ...linked, attempts: 2 }), {
      valid: c.minValid,
      weak: 0,
      irrelevant: 0,
      attempts: 2,
    });
  });

  test(`${band}: explanation feedback for empty, off-topic, reasoning-without-content, content-without-reasoning, short, good`, () => {
    const st = X.buildLink(task, withSel(task, c.valid.slice(0, c.minValid)), 1);
    const ev = (t) => X.evaluateExplanation(task, t, "main", st);
    assert.equal(ev("").status, "empty");
    assert.equal(ev("   ").ok, false);
    const off = ev("My favorite thing is lunch and I like the playground a lot of the time.");
    assert.equal(off.status, "off-topic");
    assert.ok(flat(off.message).includes("My favorite thing is lunch"), "quotes the learner");
    assert.ok(off.next, "one next move");
    const reasonOnly = ev("It is true because it is true and I know it is true.");
    assert.equal(reasonOnly.status, "no-detail");
    assert.ok(flat(reasonOnly.message).includes("“because”"));
    const contentOnly = ev(GOOD[band].replace(/\bso\b|\bbecause\b/g, "and"));
    assert.equal(contentOnly.status, "no-reason");
    assert.ok(contentOnly.matched.length > 0);
    assert.ok(flat(contentOnly.message).includes(`“${contentOnly.matched[0]}”`));
    assert.equal(ev("The claim is true because it is so.").ok, false);
    assert.equal(ev("hours because").status === "good", false);
    assert.equal(ev("Fill ___ in the blank ___ here").status, "blank");
    const good = ev(GOOD[band]);
    assert.equal(good.ok, true);
    assert.equal(good.status, "good");
    assert.equal(good.next, null);
    assert.ok(good.usedReasoning && good.matched.length >= 1);
    // the frame's structure counts as reasoning
    const frameUse = X.evaluateExplanation(
      task,
      `${c.explainFrame.split("___")[0]} ${GOOD[band].split(",")[0].toLowerCase()} in the evidence.`,
      "main",
      st,
    );
    assert.equal(frameUse.usedFrame, true);
    // a good explanation typed against evidence the learner did NOT link is judged on the linked evidence
    const submit = X.submitExplanation(task, st, GOOD[band]);
    assert.equal(submit.state.explained, true);
    const bad = X.submitExplanation(task, st, "nope");
    assert.equal(bad.state.explained, false);
    assert.equal(
      X.submitExplanation(task, { ...bad.state, explainTries: 2 }, "nope again", { keep: true })
        .state.explained,
      true,
    );
    assert.equal(
      X.submitExplanation(task, bad.state, "nope", { keep: true }).state.explained,
      false,
      "keep needs two tries first",
    );
  });

  test(`${band}: pronoun reference tracing`, () => {
    assert.ok(task.refs.length >= 1);
    task.refs.forEach((ref, idx) => {
      const opts = X.referenceOptions(task, idx);
      assert.ok(opts.includes(ref.means), "true referent is an option");
      assert.equal(
        new Set(opts.map((o) => o.toLowerCase())).size,
        opts.length,
        "options are distinct",
      );
      assert.ok(opts.length >= 3 && opts.length <= 4, `${ref.phrase}: ${opts.length} options`);
      assert.ok(!opts.some((o) => o.toLowerCase() === ref.phrase.toLowerCase()));
      assert.deepEqual(X.referenceOptions(task, idx), opts, "deterministic");
      const st = X.chooseClaim(task, X.init(task), c.claim).state;
      const wrong = X.traceReference(
        task,
        st,
        idx,
        opts.find((o) => o !== ref.means),
      );
      assert.equal(wrong.ok, false);
      assert.equal(wrong.state.refsTraced[idx].ok, false);
      assert.ok(
        !flat(wrong.message).includes(`“${ref.means}”`),
        "a wrong pick does not reveal the answer",
      );
      const right = X.traceReference(task, wrong.state, idx, ref.means);
      assert.equal(right.ok, true);
      assert.equal(right.state.refsTraced[idx].tries, 2);
      assert.equal(right.state.refsTraced[idx].ok, true);
    });
  });

  test(`${band}: every layer annotation resolves to the right character offsets`, () => {
    for (const layer of X.LAYERS) {
      const anns = X.layerAnnotations(task, layer);
      assert.equal(
        anns.length,
        (task.layers[layer] || []).length,
        `${layer}: all annotations resolve`,
      );
      anns.forEach((a, i) => {
        const authored = task.layers[layer][i];
        const sent = textOf(task, a.s);
        assert.equal(sent.slice(a.start, a.end).toLowerCase(), authored.phrase.toLowerCase());
        assert.equal(a.text, sent.slice(a.start, a.end));
        assert.equal(a.label, authored.label);
        assert.equal(a.def, authored.def || null);
      });
    }
    for (const r of X.referenceRanges(task))
      assert.equal(textOf(task, r.s).slice(r.start, r.end), r.text);
  });

  test(`${band}: transfer runs the same engine independently over a fresh state`, () => {
    const tr = c.transfer;
    const main = X.buildLink(task, withSel(task, c.valid.slice(0, c.minValid)), 1);
    const st = X.init(task, "transfer");
    assert.equal(st.stage, "transfer");
    assert.deepEqual(st.selected, []);
    assert.equal(st.link, null);
    assert.notDeepEqual(st.selected, main.selected);
    assert.equal(st.claim, tr.claim, "a transfer passage with one claim starts with it chosen");
    const v = X.stageView(task, "transfer");
    assert.deepEqual(v.refs, []);
    assert.deepEqual(v.layers, {});
    for (const layer of X.LAYERS) assert.deepEqual(X.layerAnnotations(task, layer, "transfer"), []);
    assert.equal(
      X.chooseClaim(task, st, "s1").kind,
      "not-claim",
      "main ids are not transfer claims",
    );
    let t = st;
    for (const id of tr.weak) t = X.toggleEvidence(t, id);
    assert.equal(X.evaluateSelection(task, t).status, "insufficient");
    t = withSel(task, tr.valid.slice(0, tr.minValid), "transfer");
    assert.equal(X.evaluateSelection(task, t).status, "sufficient");
    const linked = X.buildLink(task, t, 5);
    assert.deepEqual(
      linked.link.evidence.slice().sort(),
      tr.valid.slice(0, tr.minValid).slice().sort(),
    );
    assert.equal(X.evaluateExplanation(task, GOOD_TRANSFER[band], "transfer", linked).ok, true);
    const entry = X.ledgerEntry({
      missionId: "m08",
      band,
      klu: "Explain",
      stageKey: "transfer",
      state: linked,
      supportsUsed: ["frame", "xray"],
    });
    assert.equal(entry.kind, "transfer");
    assert.equal(
      entry.stage,
      "independent",
      "supports opened earlier never leak into the transfer",
    );
    assert.deepEqual(entry.supports, {});
    const first = X.ledgerEntry({
      missionId: "m08",
      band,
      klu: "Explain",
      stageKey: "main",
      state: main,
      supportsUsed: ["frame", "xray", "hint"],
    });
    assert.equal(first.kind, "first");
    assert.equal(first.stage, "supported");
    assert.deepEqual(first.supports, { frames: true, coach: true, hint: true });
    assert.deepEqual(
      [first.src, first.task, first.domain, first.use],
      ["mission", "m08.understand", "Reading", "Explain"],
    );
    const crit = X.doneCriteria({
      main: { ...main, explained: true },
      transfer: { ...linked, explained: true },
    });
    assert.equal(crit.complete, true);
    assert.equal(X.doneCriteria({ main: { ...main, explained: true } }).complete, false);
  });
}

test("nestRanges nests contained ranges and drops partial overlaps by priority", () => {
  const forest = X.nestRanges([
    { start: 0, end: 10, priority: 1, id: "outer" },
    { start: 2, end: 4, priority: 2, id: "inner" },
    { start: 8, end: 14, priority: 0, id: "clash" },
    { start: 20, end: 24, priority: 1, id: "solo" },
  ]);
  assert.deepEqual(
    forest.map((n) => n.range.id),
    ["outer", "solo"],
  );
  assert.deepEqual(
    forest[0].children.map((n) => n.range.id),
    ["inner"],
  );
});

// ---------- DOM ----------

function harness({ band, support = "A", independent = false }) {
  const dom = new jsdom.JSDOM('<main id="root"></main>');
  const { document } = dom.window;
  const root = document.getElementById("root");
  const task = taskOf(band);
  const calls = { help: [], done: [], ledger: [], announce: [] };
  const env = {
    I: makeI18n("en"),
    band,
    support,
    independent,
    missionId: "m08",
    step: "understand",
    mission: { klu: "Explain" },
    pack: m08.bands[band],
    data: {},
    calls,
    update(patch) {
      env.data = { ...env.data, ...JSON.parse(JSON.stringify(patch)) };
      draw();
    },
    help: (id) => calls.help.push(id),
    done: (r) => calls.done.push(r),
    ledger: (e) => calls.ledger.push(e),
    announce: (m) => calls.announce.push(m),
  };
  function draw() {
    root.innerHTML = String(UI.render(task, env));
    UI.mount(root, env);
  }
  draw();
  const q = (sel) => root.querySelector(sel);
  const qa = (sel) => [...root.querySelectorAll(sel)];
  const click = (sel) => {
    const el = typeof sel === "string" ? q(sel) : sel;
    assert.ok(el, `missing ${sel}`);
    el.click();
  };
  const chip = (id) => `.xr-chip[data-sid="${id}"]`;
  const type = (text) => {
    q(".xr-explain-input").value = text;
  };
  return { dom, root, env, calls, q, qa, click, chip, type, draw, task };
}

const domTest = (name, fn) =>
  test(name, { skip: jsdom ? false : "jsdom is not installed here" }, fn);

domTest(
  "DOM: full supported run on 3-5 (claim, evidence, why-not, link, layers, pronoun trace, explanation, new passage)",
  () => {
    const h = harness({ band: "3-5", support: "A" });
    const { q, qa, click, chip, calls } = h;
    const c = h.task.challenge;
    assert.equal(qa(".xr-chip").length, h.task.passage.length);
    assert.equal(qa(".xr-steps li").length, 5);
    assert.equal(q(".xr-step.is-current").textContent.includes("Pick the claim"), true);
    assert.ok(
      q('.xr-layers[role="group"]') && qa(".xr-seg").length === 4,
      "layers are offered in support A",
    );
    // claim step
    assert.equal(q(chip("s1")).getAttribute("aria-pressed"), "false");
    click(chip("s7"));
    assert.match(q(".xr-feedback-slot").textContent, /different claim/);
    assert.equal(q(".xr-claimcard"), null);
    click(chip("s1"));
    assert.equal(q(chip("s1")).getAttribute("aria-pressed"), "true");
    assert.ok(q('.xr-sent[data-sid="s1"]').classList.contains("is-claim"));
    // evidence: aria-pressed toggles on chip and on tapping the sentence text
    click(chip("s4"));
    assert.equal(q(chip("s4")).getAttribute("aria-pressed"), "true");
    click(chip("s4"));
    assert.equal(q(chip("s4")).getAttribute("aria-pressed"), "false");
    q('.xr-sent[data-sid="s4"] .xr-text').click();
    assert.equal(
      q(chip("s4")).getAttribute("aria-pressed"),
      "true",
      "tapping the sentence also selects it",
    );
    click(chip("s2"));
    click(chip("s7"));
    click('[data-xr="check"]');
    const weakRow = q('.xr-sent[data-sid="s4"]');
    assert.ok(weakRow.classList.contains("is-weak"));
    assert.match(weakRow.querySelector(".xr-mark").textContent, /On topic, but not support/);
    assert.ok(weakRow.querySelector(".xr-mark svg"), "mark has an icon, not color alone");
    assert.match(weakRow.querySelector(".xr-why").textContent, /Why not:/);
    assert.match(q('.xr-sent[data-sid="s7"] .xr-mark').textContent, /Not about this claim/);
    assert.match(q('.xr-sent[data-sid="s2"] .xr-mark').textContent, /Supports the claim/);
    assert.equal(q('[data-xr="connect"]'), null, "not ready to connect with off-target picks");
    click(chip("s4"));
    click(chip("s7"));
    click(chip("s3"));
    click('[data-xr="check"]');
    assert.ok(q('[data-xr="connect"]'));
    click('[data-xr="connect"]');
    assert.ok(q(".xr-board.is-fresh"), "link drawn");
    assert.equal(qa(".xr-branch").length, c.valid.filter((id) => ["s2", "s3"].includes(id)).length);
    assert.equal(qa(".xr-evcard .xr-tag").length, 2);
    assert.equal(q(chip("s2")).getAttribute("aria-disabled"), "true");
    // layers (help on first use) and tap-to-see notes
    click('[data-layer="word"]');
    assert.deepEqual(calls.help, ["xray"]);
    assert.equal(q('[data-layer="word"]').getAttribute("aria-pressed"), "true");
    assert.ok(qa(".xr-hl-word").length >= 1);
    click('.xr-notebtn[data-ann="word:0"]');
    assert.match(q(".xr-note").textContent, /light from the sun/);
    click('[data-layer="word"]');
    assert.equal(qa(".xr-hl").length, 0);
    click('[data-layer="meaning"]');
    assert.deepEqual(calls.help, ["xray"], "help is recorded once");
    // pronoun trace
    click('.xr-ref[data-ref="0"]');
    assert.ok(q(".xr-trace"));
    const opts = qa(".xr-opt");
    const means = h.task.refs[0].means;
    click(opts.find((o) => o.dataset.guess !== means));
    assert.match(q(".xr-trace-fb").textContent, /does not fit/);
    click(qa(".xr-opt").find((o) => o.dataset.guess === means));
    assert.ok(q(".xr-back"), "an arrow back to the referent is drawn");
    // explanation: frame is a help, bad then good
    click('[data-xr="frame"]');
    assert.deepEqual(calls.help, ["xray", "frame"]);
    assert.match(q(".xr-frame").textContent, /This evidence shows/);
    h.type("The garden is nice.");
    click('[data-xr="explain"]');
    assert.equal(calls.ledger.length, 0);
    assert.ok(q(".xr-feedback .xr-next"), "one next move");
    assert.equal(q('[data-xr="keep"]'), null);
    h.type(
      "Bed 2 gets only two hours of sun, so the bean plants stay small because they need light.",
    );
    click('[data-xr="explain"]');
    assert.equal(calls.ledger.length, 1);
    assert.equal(calls.ledger[0].kind, "first");
    assert.deepEqual(calls.ledger[0].supports, { coach: true, frames: true });
    assert.equal(calls.done.length, 0);
    // reload mid-run resumes from the persisted data
    const again = harness({ band: "3-5", support: "A" });
    again.env.data = JSON.parse(JSON.stringify(h.env.data));
    again.draw();
    assert.ok(again.q(".xr-board"));
    assert.ok(again.q('[data-xr="next"]'));
    // transfer: independent, no layers / frame / hints / refs
    click('[data-xr="next"]');
    assert.equal(q(".xr-layers"), null, "no layers on the transfer passage");
    assert.equal(q('[data-xr="hint"]'), null);
    assert.equal(qa(".xr-ref").length, 0);
    assert.equal(qa(".xr-chip").length, c.transfer.passage.length);
    assert.ok(q('.xr-sent[data-sid="t1"]').classList.contains("is-claim"));
    c.transfer.weak
      .slice(0, 1)
      .concat(c.transfer.valid.slice(0, c.transfer.minValid))
      .forEach((id) => click(chip(id)));
    click('[data-xr="check"]');
    click(chip(c.transfer.weak[0]));
    click('[data-xr="check"]');
    click('[data-xr="connect"]');
    assert.equal(
      q('[data-xr="frame"]'),
      null,
      "no frame on the transfer passage even in support A",
    );
    h.type(
      "The soil is dry and cracked every afternoon, so the tomatoes wilt because the pots need water.",
    );
    click('[data-xr="explain"]');
    assert.equal(calls.done.length, 1);
    assert.deepEqual(Object.keys(calls.done[0]).sort(), [
      "explanation",
      "main",
      "supportsUsed",
      "transfer",
      "transferExplanation",
    ]);
    assert.equal(calls.done[0].main.valid, 2);
    assert.equal(calls.done[0].main.weak, 1);
    assert.equal(calls.done[0].main.irrelevant, 1);
    assert.equal(calls.done[0].transfer.weak, 1);
    assert.deepEqual(calls.done[0].supportsUsed, ["xray", "frame"]);
    assert.equal(calls.ledger.length, 2);
    assert.equal(calls.ledger[1].kind, "transfer");
    assert.equal(calls.ledger[1].stage, "independent");
    assert.ok(q(".xr-done"));
    assert.equal(calls.help.length, 2, "transfer opened no help");
  },
);

domTest("DOM: on my own (6-8, independent) shows no layers, frame or hint", () => {
  const h = harness({ band: "6-8", support: "C", independent: true });
  const { q, qa, click, chip } = h;
  const c = h.task.challenge;
  assert.equal(q(".xr-layers"), null);
  assert.equal(q(".xr-layerbar"), null);
  click(chip(c.claim));
  assert.equal(q('[data-xr="hint"]'), null);
  c.valid.slice(0, c.minValid).forEach((id) => click(chip(id)));
  click('[data-xr="check"]');
  click('[data-xr="connect"]');
  assert.equal(qa(".xr-branch").length, c.minValid);
  assert.equal(q('[data-xr="frame"]'), null);
  assert.equal(q(".xr-frame"), null);
  h.type(
    "Water pooled for 45 minutes after the trucks crossed, so the roots cannot get oxygen because the soil is packed.",
  );
  click('[data-xr="explain"]');
  assert.ok(q('[data-xr="next"]'));
  assert.deepEqual(h.calls.help, []);
  assert.deepEqual(h.calls.ledger[0].supports, {});
  assert.equal(h.calls.ledger[0].stage, "independent");
});

domTest("DOM: support C offers layers but no frame or hint; B offers frame and hint", () => {
  const c = harness({ band: "6-8", support: "C" });
  assert.ok(c.q(".xr-layers"));
  c.click(c.chip("s1"));
  assert.equal(c.q('[data-xr="hint"]'), null);
  const b = harness({ band: "6-8", support: "B" });
  b.click(b.chip("s1"));
  b.click('[data-xr="hint"]');
  assert.deepEqual(b.calls.help, ["hint"]);
  assert.match(b.q(".xr-feedback-slot").textContent, /\?|Evidence|sentence/);
  assert.ok(!/s[2-5]\b/.test(b.q(".xr-feedback-slot").textContent));
});

domTest(
  "DOM: render returns html that is both interpolable and a string, and keeps passage text lang=en",
  () => {
    const h = harness({ band: "6-8" });
    const out = UI.render(h.task, h.env);
    assert.equal(typeof String(out), "string");
    assert.ok(String(out).includes("xr-passage"));
    assert.ok(h.qa(".xr-text").every((p) => p.getAttribute("lang") === "en"));
    assert.ok(
      h.qa(".xr-chip").every((b) => b.hasAttribute("aria-pressed") && b.getAttribute("aria-label")),
    );
  },
);
