import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createModel } from "../assets/family-mission/models/index.mjs";
import { ANSWER_MATCH_JS } from "../scripts/homework-answer-match.mjs";
import { renderExplainStudio } from "../scripts/lib/homework-explain-studio.mjs";
import { renderFamilyQuest } from "../scripts/lib/homework-family-quest.mjs";
import { renderLearningReplayShell } from "../scripts/lib/homework-learning-replay.mjs";
import { renderMathMysterySection } from "../scripts/lib/homework-mystery-engine.mjs";
import { lessonPath } from "./lib/curriculum-source.mjs";

test("linear-pricing model computes 12t + 50 accurately and supports comparison & undo", () => {
  const m = createModel("linear-pricing", {
    rate: 12,
    fixed: 50,
    varName: "t",
    initial: 3,
    compareRate: 15,
    compareFixed: 20,
  });
  assert.equal(m.getState().total, 86);
  assert.equal(m.getState().expr, "12t + 50");
  m.setState({ t: 4 });
  assert.equal(m.getState().total, 98);
  assert.equal(m.getState().totalB, 80);
  m.undo();
  assert.equal(m.getState().t, 3);
  assert.equal(m.getState().total, 86);
  assert.equal(m.validate({ targetT: 3, targetTotal: 86 }).ok, true);
  assert.equal(m.validate({ targetT: 4, targetTotal: 98 }).ok, false);
});

test("NTAnswerMatch validates equivalent algebraic expressions and rejects misconceptions", () => {
  const ctx = {
    window: {},
    document: { readyState: "loading", addEventListener: () => {}, getElementById: () => null },
  };
  const studioPlus = readFileSync("assets/homework/studio-plus.mjs", "utf8");
  vm.runInNewContext(`${studioPlus}\n${ANSWER_MATCH_JS}\nwindow.__match = NTAnswerMatch;`, ctx);
  const M = ctx.window.__match;
  assert.equal(M.isRight("12t + 50", "12t + 50"), true);
  assert.equal(M.isRight("50 + 12t", "12t + 50"), true);
  assert.equal(M.isRight("12*t + 50", "12t + 50"), true);
  assert.equal(M.isRight("12(t) + 50", "12t + 50"), true);
  assert.equal(M.isRight("62t", "12t + 50"), false);
  assert.equal(M.isRight("12 + 50t", "12t + 50"), false);
  assert.equal(M.isRight("0.5", "1/2"), true);
});

test("Signature modules render bilingual mount points and hydrated studio-plus runtime", () => {
  const cfg65 = JSON.parse(readFileSync(lessonPath("6-5", "config.json"), "utf8"));
  cfg65.familyNotes = JSON.parse(readFileSync("data/family-homework-notes/6-5.json", "utf8"));

  const fq = renderFamilyQuest(cfg65, null);
  assert.match(fq, /id="hw_family_quest"/);
  assert.match(fq, /data-fq-prompt-en=/);

  const mm = renderMathMysterySection(cfg65, "6-5");
  assert.match(mm, /The Missing Concert Budget/);
  assert.match(mm, /62t/);

  const ex = renderExplainStudio(cfg65, "6-5");
  assert.match(ex, /id="hw_explain_studio"/);
  assert.match(ex, /data-ex-lesson="6-5"/);

  const lr = renderLearningReplayShell(cfg65, "6-5");
  assert.match(lr, /id="hw_learning_replay"/);

  const runtime = readFileSync("assets/homework/studio-plus.mjs", "utf8");
  assert.match(runtime, /Student Solo/);
  assert.match(runtime, /Write & Frames/);
  assert.match(runtime, /Learning Replay/);
});
