// Helpers for tools/studio-customize-adapters.test.mjs: the injected fetch (real files, real BCPSS seed backend), the
// source fingerprint, answer helpers that do not use the adapters, and the independent expectations they are held to.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stableStringify } from "../access-practice-lab/src/studio/adapters/util.js";
import { marksOf } from "../access-practice-lab/src/studio/core/check.js";
import { BCPSS_UNITS, UNIT_CONNECTIONS } from "../data/bcpss-curriculum-seed.mjs";
import { getUnitDetail, listUnits } from "../functions/_lib/bcpss/db.js";
import { EXPECTED_A, listedA } from "./create-adapters-a-expected.mjs";
import { EXPECTED_C, LISTED_C } from "./create-adapters-c-expected.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT = join(ROOT, "access-practice-lab/content");
export const NOW = 1_800_000_000_000;
export const FIXED_ID = "sa1b2c3d4e5";
export const SAFE_PATH = /^\/(?!\/)[A-Za-z0-9_\-./%]+$/;

// ---- the injected fetch: the real files on disk and the real BCPSS seed backend ----
export const deepFreeze = (v) => {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) deepFreeze(x);
  }
  return v;
};
export const cache = new Map();
export const fetchJson = async (url) => {
  if (!cache.has(url)) cache.set(url, deepFreeze(await load(url)));
  return cache.get(url);
};
export const load = async (url) => {
  if (url.startsWith("/api/bcpss/units?")) {
    const q = new URLSearchParams(url.split("?")[1]);
    return { units: (await listUnits({}, q.get("grade"), q.get("subject"))).units };
  }
  if (url.startsWith("/api/bcpss/units/")) {
    const { detail } = await getUnitDetail({}, decodeURIComponent(url.split("/").pop()));
    if (!detail) throw new Error("404");
    return detail;
  }
  const file = join(ROOT, url);
  if (!file.startsWith(ROOT) || !existsSync(file)) throw new Error(`404 ${url}`);
  return JSON.parse(readFileSync(file, "utf8"));
};
export const deps = { fetchJson, newId: () => FIXED_ID, now: NOW };
export const read = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

// ---- source immutability: hash everything an adapter reads, before and after ----
export const filesUnder = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });
export const sourceFingerprint = () => {
  const h = createHash("sha256");
  for (const f of [
    ...filesUnder(join(CONTENT, "bank")),
    ...filesUnder(join(CONTENT, "vocab-academy")),
    join(CONTENT, "reading-room/lessons.json"),
    ...["ladder", "missions", "puzzles", "packs", "quest", "reading-path"].flatMap((d) =>
      filesUnder(join(CONTENT, d)),
    ),
  ].sort())
    h.update(f).update(readFileSync(f));
  h.update(stableStringify([BCPSS_UNITS, UNIT_CONNECTIONS]));
  return h.digest("hex");
};
export const BEFORE = sourceFingerprint();

// ---- answer helpers (independent of the adapters) ----
export const keyResponse = (q) =>
  ({
    choice: () => q.answer,
    multi: () => q.answers,
    match: () => Object.fromEntries(q.pairs.map((p) => [p.id, p.id])),
    sort: () => Object.fromEntries(q.items.map((i) => [i.id, i.category])),
    order: () => q.items.map((i) => i.id),
    blank: () => marksOf(q.text).map((m) => m.answers[0]),
  })[q.format]();
export const wrongResponse = (q) =>
  ({
    choice: () => q.options.find((o) => o.id !== q.answer).id,
    multi: () => [q.options.find((o) => !q.answers.includes(o.id)).id],
    match: () =>
      Object.fromEntries(q.pairs.map((p, i) => [p.id, q.pairs[(i + 1) % q.pairs.length].id])),
    sort: () =>
      Object.fromEntries(
        q.items.map((i) => [i.id, q.categories.find((c) => c.id !== i.category).id]),
      ),
    order: () => q.items.map((i) => i.id).reverse(),
    blank: () => marksOf(q.text).map(() => "zzzz"),
  })[q.format]();
export const GRADED = new Set(["choice", "multi", "match", "sort", "order", "blank"]);
export const questions = (a) => a.blocks.filter((b) => b.type === "question");
export const isSubset = (raw, norm, path = "") => {
  if (Array.isArray(raw)) {
    assert.ok(
      Array.isArray(norm) && norm.length === raw.length,
      `${path}: length ${norm?.length} vs ${raw.length}`,
    );
    raw.forEach((r, i) => isSubset(r, norm[i], `${path}[${i}]`));
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) isSubset(v, norm?.[k], `${path}.${k}`);
  } else assert.equal(norm, raw, `${path} was changed by normalization (clipped or cleaned)`);
};
export const bilingual = (v, what) => {
  assert.ok(v && typeof v.en === "string" && v.en.trim(), `${what}: English missing`);
  assert.ok(typeof v.es === "string" && v.es.trim(), `${what}: Spanish missing`);
  assert.notEqual(v.es, v.en, `${what}: Spanish is a copy of the English`);
};

// ---- per-family: the expected number of questions, computed from the raw source ----
export const GAP = /_{3,}/;
export const EXPECTED = {
  ...EXPECTED_A,
  "access-bank": async (ref) =>
    (await fetchJson(`/access-practice-lab/content/bank/${ref}.json`)).items.length,
  "vocab-academy": async (ref) => {
    const m = /^g(K|[1-8])-u(\d{2})$/.exec(ref);
    const u = await fetchJson(`/access-practice-lab/content/vocab-academy/g${m[1]}/u${m[2]}.json`);
    const words = u.words.filter((w) => w.hw && w.def);
    assert.ok(
      words.every((w) => GAP.test(w.cloze?.s || "") && w.cloze?.f),
      `${ref}: a word has no usable cloze`,
    );
    return (
      Math.ceil(words.length / 6) +
      words.length +
      (u.passage?.qs?.length || 0) +
      (u.passage?.write?.prompt ? 1 : 0) +
      (u.check?.constructed?.length || 0)
    );
  },
  "reading-room": async (ref) => {
    const l = (
      await fetchJson("/access-practice-lab/content/reading-room/lessons.json")
    ).lessons.find((x) => x.id === ref);
    const tp = (l.transferPrompt || "").trim();
    return l.activities.length + (tp && !l.activities.some((a) => a.prompt.trim() === tp) ? 1 : 0);
  },
  "bcpss-unit": async (ref) => {
    const d = await fetchJson(`/api/bcpss/units/${ref}`);
    const c = d.connections[0];
    const vocab = c.tier2_tier3_vocab.filter(
      (v) => v.term && (v.student_friendly_def || v.kid_def),
    );
    return (
      Math.ceil(vocab.length / 6) +
      c.interactive_cloze_items.length +
      d.reading.questions.length +
      (c.language_exit_ticket_json?.prompt ? 1 : 0)
    );
  },
  ...EXPECTED_C,
};
// Families added for the Create route sweep (tools/create-adapters-b.test.mjs has their faithfulness checks).
const LAB = "/access-practice-lab/content";
const sets = (n) => Math.ceil(n / 6);
Object.assign(EXPECTED, {
  "reading-ladder": async (ref) =>
    (await fetchJson(`${LAB}/ladder/passages.json`)).passages.find((p) => p.id === ref).questions
      .length,
  missions: async (ref) => {
    const m = await fetchJson(`${LAB}/missions/${ref}.json`);
    const tasks = m.phases.flatMap((p) => p.tasks || []);
    return (
      sets(m.vocab.filter((v) => v.term && v.def).length) +
      tasks.filter((x) => ["question", "evidence", "speak", "write"].includes(x.kind)).length
    );
  },
  "puzzle-den": async () => 1,
  "mentor-texts": async (ref) => {
    const m = await import("../access-practice-lab/src/content/craft-mentor.js");
    const text = m.findText(ref);
    const moves = new Set([...text.text.matchAll(/\{(\w+):/g)].map((x) => x[1]));
    return 1 + [...moves].reduce((n, mv) => n + (m.TRY[mv]?.[text.band]?.length || 0), 0);
  },
  "newsroom-prompts": async (ref) => {
    const { NEWS_PROMPTS } = await import("../access-practice-lab/src/content/newsroom.js");
    return NEWS_PROMPTS.find((p) => p.id === ref).ask.length + 1;
  },
  "reading-path": async () => 1,
  "newcomer-packs": async (ref) => {
    if (ref === "speaking-listening-cards")
      return (await fetchJson(`${LAB}/packs/${ref}.json`)).cards.length;
    if (ref === "new-arrival-school")
      return sets((await fetchJson(`${LAB}/packs/${ref}.json`)).phrases.length);
    const pack = await fetchJson(`${LAB}/packs/survival-vocabulary.json`);
    return sets(pack.topics.find((x) => `survival-${x.id}` === ref).words.length);
  },
  "quest-missions": async (ref) => {
    const m = await fetchJson(`${LAB}/quest/missions/${ref}.json`);
    const kinds = ["check", "sort", "timeline", "write", "speak"];
    const items = m.stages.flatMap((st) => st.items).filter((it) => kinds.includes(it.kind));
    return sets((m.vocab || []).filter((v) => v.term && v.def).length) + items.length;
  },
});
export const LISTED = {
  "access-bank": 40,
  "vocab-academy": 157,
  "reading-room": 183,
  "bcpss-unit": 162,
  "reading-ladder": 18,
  missions: 9,
  "puzzle-den": 61,
  "mentor-texts": 32,
  "newsroom-prompts": 48,
  "reading-path": 15,
  "newcomer-packs": 14,
  "quest-missions": 10,
  ...LISTED_C,
  ...(await listedA()),
};

// ---- independent key text for bank items: the draft's key must say what the bank's key says ----
export function bankKey(item) {
  const text = (list, id) => list.find((o) => o.id === id)?.text;
  switch (item.type) {
    case "multiple-choice":
    case "listening-response":
      return text(item.options, item.answer);
    case "multiple-select":
      return item.answer.map((id) => text(item.options, id)).sort();
    case "ordering":
      return item.ordering.answer.map((id) => text(item.ordering.items, id));
    case "matching":
      return Object.fromEntries(
        item.matching.left.map((l) => [
          l.text,
          text(item.matching.right, item.matching.answer[l.id]),
        ]),
      );
    case "drag-drop":
      return Object.fromEntries(
        item.dragDrop.tokens.map((tk) => [
          tk.text,
          item.dragDrop.zones.find((z) => z.id === item.dragDrop.answer[tk.id]).label,
        ]),
      );
    case "dropdown":
      return Object.keys(item.dropdown.blanks)
        .sort((a, b) => a - b)
        .map((n) => item.dropdown.blanks[n].answer);
    default:
      return null;
  }
}
export function draftKey(q) {
  const text = (list, id) => list.find((o) => o.id === id)?.text;
  switch (q.format) {
    case "choice":
      return text(q.options, q.answer);
    case "multi":
      return q.answers.map((id) => text(q.options, id)).sort();
    case "order":
      return q.items.map((i) => i.text);
    case "match":
      return Object.fromEntries(q.pairs.map((p) => [p.left, p.right]));
    case "sort":
      return Object.fromEntries(
        q.items.map((i) => [i.text, q.categories.find((c) => c.id === i.category).label]),
      );
    case "blank":
      return marksOf(q.text).map((m) => m.answers[0]);
    default:
      return null;
  }
}

// Every vocabulary word appears in exactly one match set, paired with its own meaning.
export function assertMatchCoversVocab(made, at) {
  const vocab = made.activity.blocks.find((b) => b.type === "vocab").items;
  const pairs = questions(made.activity)
    .filter((q) => q.format === "match")
    .flatMap((q) => q.pairs);
  assert.deepEqual(
    pairs.map((p) => [p.left, p.right]).sort(),
    vocab.map((v) => [v.term, v.def]).sort(),
    `${at}: match sets do not cover the vocabulary`,
  );
  for (const q of questions(made.activity).filter((x) => x.format === "match"))
    assert.ok(q.pairs.length >= 2 && q.pairs.length <= 6, `${at}: match set size`);
}
