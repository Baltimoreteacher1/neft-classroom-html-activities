// Shared progress markup (My Progress, Road, Teacher Hub, Families): accessible bars, honest family copy,
// ES mode translating chrome only. Pure Node: no browser.
import assert from "node:assert/strict";
import test from "node:test";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import { ALL_GAME_META } from "../access-practice-lab/src/lab/meta.js";
import {
  familySnapshotCopy,
  familySnapshotHTML,
  readinessPanelHTML,
  snapshotFacts,
  topPatternsCardHTML,
} from "../access-practice-lab/src/lab/progress-ui.js";
import { emptyState, readiness, topErrorTags } from "../access-practice-lab/src/lab/store.js";
import { ERROR_TAGS, TAG_IDS } from "../access-practice-lab/src/lab/tags.js";
import { toHtml } from "../access-practice-lab/src/util.js";

const T0 = "2026-11-22T10:00:00.000Z";
const BAND = "6-8";
const gameFor = (domain) =>
  ALL_GAME_META.filter((g) => g.domains.includes(domain)).map((g) => g.id);
const ev = (gameId, i, extra = {}) => ({
  kind: "mission",
  gameId,
  gradeBand: BAND,
  widaDomain: "Writing",
  widaContentArea: "LoELA",
  scaffoldTier: "guided",
  languageErrorTag: null,
  ok: true,
  timestamp: `2026-11-22T10:${String(i).padStart(2, "0")}:00.000Z`,
  ...extra,
});
const populated = () => {
  const s = emptyState(T0);
  // Four Writing games (Writing most, Reading 3 of 4 through shared games), no Listening or Speaking,
  // and a repeated top pattern.
  const writing = ["sentence-factory", "spelling-expedition", "mystery-word", "grammar-jungle"];
  s.events = [
    ...writing.map((g, i) => ev(g, i)),
    ev(writing[0], 11, { kind: "round", languageErrorTag: "MISSING_SUBJECT" }),
    ev(writing[0], 12, { kind: "round", languageErrorTag: "MISSING_SUBJECT" }),
    ev(writing[0], 13, { kind: "round", languageErrorTag: "ADJECTIVE_ORDER" }),
  ];
  return s;
};
const modes = ["en", "es", "bi"].map((m) => [m, makeI18n(m, m === "es" ? "es" : "en")]);
const bars = (out) => [...out.matchAll(/role="progressbar"[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

test("bars, empty state: four valid progressbars at 0 and an empty-state line", () => {
  for (const [mode, I] of modes) {
    const out = toHtml(readinessPanelHTML(I, emptyState(T0), { band: BAND }));
    const found = bars(out);
    assert.equal(found.length, 4, mode);
    for (const b of found) {
      assert.equal(attr(b, "aria-valuemin"), "0");
      assert.equal(attr(b, "aria-valuemax"), "100");
      assert.equal(attr(b, "aria-valuenow"), "0");
      assert.ok(attr(b, "aria-label").length > 0);
    }
    assert.match(out, /role="status"/, `${mode} empty state`);
  }
});

test("bars, populated state: aria values match readiness() and the label says practice coverage", () => {
  const state = populated();
  const ready = readiness(state, { band: BAND });
  const I = makeI18n("en", "en");
  const out = toHtml(readinessPanelHTML(I, state, { band: BAND }));
  const found = bars(out);
  assert.equal(found.length, 4);
  const now = found.map((b) => Number(attr(b, "aria-valuenow")));
  now.forEach((n) => assert.ok(Number.isInteger(n) && n >= 0 && n <= 100));
  assert.deepEqual(
    now,
    ["Listening", "Reading", "Speaking", "Writing"].map((d) => Math.round(ready[d] * 100)),
  );
  assert.ok(now.some((n) => n > 0));
  for (const b of found) assert.match(attr(b, "aria-label"), /practice coverage/);
  assert.match(out, /does not predict an ACCESS result/);
  assert.doesNotMatch(out, /role="status"/);
  assert.match(out, /style="width:\d+%"/);
});

test("bars: compact variant keeps unique ids so two panels can share a page", () => {
  const I = makeI18n("en", "en");
  const a = toHtml(readinessPanelHTML(I, emptyState(T0), { idp: "a", compact: true }));
  const b = toHtml(readinessPanelHTML(I, emptyState(T0), { idp: "b" }));
  assert.match(a, /is-compact/);
  assert.doesNotMatch(b, /is-compact/);
  const ids = [...(a + b).matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
});

const BANNED =
  /\b(scores?|levels?|points?|percent|rank(ed|ing)?|better than|worse than|behind|ahead|predict\w*|pass(ed)?|fail(ed)?|ACCESS)\b|%|puntaj\w*|puntuaci\w*|nivel(es)?|porcentaje|calific\w*|aprob\w*|reprob\w*/i;

test("family snapshot copy: counts and plain words only, no score/level/comparison claims", () => {
  const states = [emptyState(T0), populated()];
  for (const tagId of TAG_IDS) {
    const s = populated();
    s.events.push(ev(gameFor("Writing")[0], 20, { kind: "round", languageErrorTag: tagId }));
    states.push(s);
  }
  for (const state of states) {
    const lines = familySnapshotCopy(snapshotFacts(state, { band: BAND }));
    assert.ok(lines.length >= 1);
    for (const l of lines) {
      for (const text of [l.en, l.es]) {
        assert.doesNotMatch(text, BANNED, `${l.key}: ${text}`);
        // the only digits allowed are the mission count on the "missions" line
        if (l.key !== "missions") assert.doesNotMatch(text, /\d/, `${l.key}: ${text}`);
        else assert.match(text, /^\d+ /);
      }
    }
  }
});

test("family snapshot: names the skill with most and least practice and the single top pattern", () => {
  const state = populated();
  const facts = snapshotFacts(state, { band: BAND });
  assert.equal(facts.missions, 4);
  assert.deepEqual(facts.least, ["Listening", "Speaking"]);
  assert.deepEqual(facts.most, ["Writing"]);
  assert.equal(facts.pattern, topErrorTags(state, 1, { band: BAND })[0].tag);
  assert.equal(facts.pattern, "MISSING_SUBJECT");
  const by = Object.fromEntries(familySnapshotCopy(facts).map((l) => [l.key, l]));
  assert.match(by.most.en, /writing/);
  assert.match(by.least.en, /A good one to try next/);
  assert.match(by.most.es, /escribir/);
  assert.match(by.pattern.en, /missing subject/i);
  assert.equal(familySnapshotCopy(facts).filter((l) => l.key === "pattern").length, 1);
});

test("family snapshot: a balanced record claims no most or least; one mission is singular", () => {
  const state = emptyState(T0);
  state.events = [ev(gameFor("Writing")[0], 1)];
  const facts = snapshotFacts(state, { band: BAND });
  const copy = familySnapshotCopy(facts);
  assert.match(copy[0].en, /^1 practice mission finished\.$/);
  assert.match(copy[0].es, /^1 misión de práctica terminada\.$/);
  const flat = snapshotFacts({ ...emptyState(T0), events: [] }, { band: BAND });
  assert.deepEqual([flat.most, flat.least], [[], []]);
});

test("family snapshot html: EN, ES and bilingual, with a practice link for the top pattern", () => {
  const state = populated();
  const [en, es, bi] = modes.map(([, I]) => toHtml(familySnapshotHTML(I, state, { band: BAND })));
  assert.match(en, /Progress snapshot/);
  assert.doesNotMatch(en, /Resumen del progreso/);
  assert.match(es, /Resumen del progreso/);
  assert.doesNotMatch(es, /Progress snapshot|A good one to try next|practice missions? finished/);
  assert.match(bi, /Progress snapshot/);
  assert.match(bi, /Resumen del progreso/);
  assert.match(bi, /lang="es"/);
  for (const out of [en, es, bi]) {
    assert.match(out, /href="\/access-practice-lab\/games\/sentence-factory\?band=6-8/);
    const text = out.replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(
      text.replace(/\d+ (practice )?missions?|\d+ misi\w+/gi, ""),
      /%|\bscore\b|\blevel\b|puntaje|\bnivel\b/i,
    );
  }
});

test("ES mode translates chrome only: English practice examples in hints stay English", () => {
  const state = populated();
  const I = makeI18n("es", "es");
  const out = toHtml(familySnapshotHTML(I, state, { band: BAND }));
  // the hint's English sample sentences are the practice text and are kept verbatim
  assert.match(out, /“It is raining\.”/);
  // Spanish chrome around them
  assert.match(out, /Falta el sujeto|falta el sujeto/);
  assert.doesNotMatch(out, /Every English sentence needs a subject/);
  const panel = toHtml(readinessPanelHTML(I, state, { band: BAND }));
  assert.match(panel, /Cobertura de práctica/);
  assert.doesNotMatch(panel, /practice coverage|Language Lab readiness/);
  assert.match(panel, /Escuchar/);
});

test("teacher card: top two patterns, deep links, hints in both languages, honest empty state", () => {
  const state = populated();
  const top = topErrorTags(state, 2, { band: BAND });
  assert.equal(top.length, 2);
  const out = toHtml(topPatternsCardHTML(state, { band: BAND }));
  assert.equal((out.match(/data-tag="/g) || []).length, 2);
  top.forEach(({ tag }, i) => {
    assert.ok(out.indexOf(`data-tag="${tag}"`) >= 0);
    assert.ok(out.includes(ERROR_TAGS[tag].en));
    assert.ok(out.includes(ERROR_TAGS[tag].es));
    assert.ok(out.includes(`/access-practice-lab/games/${ERROR_TAGS[tag].game}?band=${BAND}`));
    if (i === 0)
      assert.ok(out.indexOf(ERROR_TAGS[tag].en) < out.indexOf(ERROR_TAGS[top[1].tag].en));
  });
  assert.match(out, /Practice this/);
  assert.match(out, /no student names/);
  const empty = toHtml(topPatternsCardHTML(emptyState(T0), { band: BAND }));
  assert.match(empty, /No language patterns recorded on this device yet/);
  assert.doesNotMatch(empty, /data-tag=/);
});
