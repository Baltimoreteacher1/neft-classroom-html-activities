// Every mission pack against the real engines: the engines' own validators and a smoke run of each pure layer.
// The pack schema (curriculum.js validateMission) and the engines were built in parallel; this keeps them in step.
import assert from "node:assert/strict";
import test from "node:test";
import { BANDS, loadMission, MISSION_IDS } from "../access-practice-lab/src/journey/curriculum.js";
import * as compose from "../access-practice-lab/src/journey/engines/compose.js";
import * as construct from "../access-practice-lab/src/journey/engines/construct.js";
import * as converse from "../access-practice-lab/src/journey/engines/converse.js";
import * as listen from "../access-practice-lab/src/journey/engines/listen.js";
import * as scene from "../access-practice-lab/src/journey/engines/scene.js";
import * as xray from "../access-practice-lab/src/journey/engines/xray.js";
import { CONNECTORS } from "../access-practice-lab/src/lang/lexicon.js";

const packs = await Promise.all(MISSION_IDS.map(async (id) => [id, await loadMission(id)]));
const each = (fn) => {
  for (const [id, pack] of packs)
    for (const band of BANDS) fn(`${id}.${band}`, pack.bands[band], id, band);
};

test("listen tasks (main and final) pass the listening engine's validator", () => {
  each((at, b) => {
    listen.validateTask(listen.resolveTask(b.understand.listen, false));
    if (listen.hasFinal(b.understand.listen))
      listen.validateTask(listen.resolveTask(b.understand.listen, true));
    assert.ok(listen.hasFinal(b.understand.listen), `${at}: listening needs a final`);
  });
});

test("build modules and their transfers pass the construction engine's validator", () => {
  each((_at, b) => {
    construct.validateTasks(b.build);
    for (const t of b.build) construct.init(t, {});
    for (const t of b.build) construct.init(t, { transfer: true });
  });
});

test("scene tasks initialise and every control combination resolves to an outcome", () => {
  each((at, b) => {
    const t = b.discover;
    let s = scene.init(t);
    for (const c of t.controls) for (const o of c.options) s = scene.setControl(s, c.id, o.id, t);
    assert.ok(scene.currentOutcome(t, s).state, `${at}: outcome`);
    const combos = t.controls.reduce(
      (acc, c) => acc.flatMap((a) => c.options.map((o) => ({ ...a, [c.id]: o.id }))),
      [{}],
    );
    for (const combo of combos) {
      let st = scene.init(t);
      for (const [cid, oid] of Object.entries(combo)) st = scene.setControl(st, cid, oid, t);
      const out = scene.currentOutcome(t, st);
      assert.notEqual(
        out,
        scene.NEUTRAL_OUTCOME,
        `${at}: control combination ${JSON.stringify(combo)} has no authored outcome`,
      );
    }
  });
});

test("reading tasks initialise and every layer annotation resolves in main and transfer", () => {
  each((at, b) => {
    const r = b.understand.read;
    xray.init(r, "main");
    xray.init(r, "transfer");
    for (const layer of xray.LAYERS)
      assert.ok(Array.isArray(xray.layerAnnotations(r, layer, "main")), `${at}: ${layer}`);
  });
});

test("communicate and show tasks run through the conversation and writing engines", () => {
  each((at, b, id) => {
    for (const key of ["communicate", "show"]) {
      const t = b[key];
      const keyUse =
        {
          m01: "Narrate",
          m02: "Narrate",
          m03: "Narrate",
          m04: "Inform",
          m05: "Inform",
          m06: "Inform",
          m07: "Explain",
          m08: "Explain",
          m09: "Explain",
        }[id] || "Argue";
      if (t.kind === "converse") {
        const s = converse.reply(
          t,
          converse.init(t),
          t.topicTerms.slice(0, 6).join(" ") + " because it matters",
          { keyUse, band: at.split(".")[1], independent: key === "show" },
        );
        assert.ok(s.partnerLine, `${at}.${key}: partner replies`);
      } else {
        const a = compose.analyze(t, t.topicTerms.join(" ") + " because", { keyUse });
        assert.ok(a.overlays && a.moves, `${at}.${key}: compose analyses`);
        assert.ok(compose.readerQuestion(t, a, {}), `${at}.${key}: a reader question exists`);
      }
    }
  });
});

test("each build module accepts its own authored answer key (main and transfer)", () => {
  const key = (t) => {
    if (t.module === "connector") return { answers: t.gaps.map((g) => g.ok[0]) };
    if (t.module === "pronoun") return { answers: t.pronouns.map((p) => p.ok) };
    if (t.module === "discourse")
      return { order: t.order, connectors: (t.connectors || []).map((c) => c.word) };
    if (t.module === "morphology")
      return {
        words: t.words.map((w, wi) => ({
          slots: Object.fromEntries(
            ["prefix", "root", "suffix"].map((type) => [
              type,
              w.parts.filter((p) => p.type === type).map((p) => p.t),
            ]),
          ),
          meaning: construct.meaningQuestion(t, wi).answer,
        })),
      };
    return null;
  };
  each((at, b) => {
    b.build.forEach((task, i) => {
      for (const transfer of [false, true]) {
        const resolved = construct.resolveTask(task, transfer);
        const input = key(resolved);
        if (!input) continue;
        const r = construct.evaluate(task, input, { transfer });
        assert.ok(
          r.accepted ?? r.ok,
          `${at}.build[${i}]${transfer ? ".transfer" : ""} (${task.module}) rejects its own answer key: ${JSON.stringify(r).slice(0, 300)}`,
        );
      }
    });
  });
});

test("every expand and combine task can be satisfied by a sentence built from its own requirements", () => {
  const cause = "because";
  each((at, b) => {
    b.build.forEach((task, i) => {
      for (const transfer of [false, true]) {
        const t = construct.resolveTask(task, transfer);
        let text;
        if (task.module === "expand") {
          const adds = t.needs.flatMap((n) =>
            n.test?.terms ? [n.test.terms.find((w) => /^[a-z]+$/i.test(w)) || n.test.terms[0]] : [],
          );
          const jobs = t.needs.flatMap((n) => (n.test?.connectorJob ? [n.test.connectorJob] : []));
          const base = t.base.replace(/\.$/, "");
          const lead = jobs
            .map((j) =>
              j === "cause"
                ? `${cause} the garden had enough sun and water`
                : `${CONNECTORS[j][0]} the bell rang`,
            )
            .join(" and ");
          text = `${base} with ${adds.join(" and ")} ${lead}.`
            .replace(/\s+/g, " ")
            .replace("with  ", "");
        } else if (task.module === "combine") {
          const [a, c] = t.pair.map((s) => s.replace(/\.$/, "").toLowerCase());
          const joiner =
            { cause: "so", contrast: "but", sequence: "and then", addition: "and also" }[
              t.relation
            ] || "so";
          const [first, second] = [a, c];
          text = `${first[0].toUpperCase()}${first.slice(1)}, ${joiner} ${second}.`;
        } else continue;
        const r = construct.evaluate(task, text, { transfer });
        assert.ok(
          r.accepted ?? r.ok,
          `${at}.build[${i}]${transfer ? ".transfer" : ""} (${task.module}) could not be satisfied by: "${text}" -> ${JSON.stringify(r.needs || r.summary || r).slice(0, 260)}`,
        );
      }
    });
  });
});
