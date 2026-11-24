// The rules that tie a Language Studio activity to a lesson (tools/lib/bcpss-activity-lessons.mjs), on fixtures.
import assert from "node:assert/strict";
import test from "node:test";
import { linkUnit, mentionedTerms, revealFor, stem } from "./lib/bcpss-activity-lessons.mjs";

const v = (term, new_or_review = "new", tier = 3) => ({ term, new_or_review, tier });
const lesson = (n, title, vocab, arc = []) => ({
  id: `u-l0${n}`,
  sequence: n,
  title,
  content_objective: title,
  vocab,
  arc: arc.map((activity) => ({ activity })),
});
const act = (kind, title, text) => ({ kind, title, mission: text, payload: { text } });

const lessons = [
  lesson(1, "Meet net", [v("net"), v("face")]),
  lesson(2, "Say surface area", [v("surface area"), v("polygon"), v("net", "review")]),
  lesson(3, "Show what you know", [v("volume")], [act("talk_cards", "Prove it", "talk")]),
];

test("stem folds inflection so faces matches face", () => {
  assert.equal(stem("faces"), stem("face"));
  assert.equal(stem("decomposes"), stem("decompose"));
});

test("an activity that mentions a lesson's new word links to that lesson, by terms", () => {
  const { activities } = linkUnit({
    studio: { activities: [act("match", "Match", "Match net and face to their meanings.")] },
    lessons,
  });
  assert.equal(activities[0].lessons[0].id, "u-l01");
  assert.equal(activities[0].lessons[0].how, "terms");
  assert.deepEqual(activities[0].lessons[0].terms, ["net", "face"]);
});

test("a lesson that already runs the exact activity wins and is marked uses", () => {
  const { activities } = linkUnit({
    studio: { activities: [act("talk_cards", "Prove it", "talk about volume")] },
    lessons,
  });
  assert.equal(activities[0].lessons[0].id, "u-l03");
  assert.equal(activities[0].lessons[0].how, "uses");
});

test("a second lesson is listed only when it fits nearly as well", () => {
  const near = linkUnit({
    studio: { activities: [act("cloze", "Fill", "net and surface area and polygon and volume")] },
    lessons,
  });
  assert.ok(near.activities[0].lessons.length >= 2);
  const far = linkUnit({
    studio: { activities: [act("cloze", "Fill", "volume volume volume")] },
    lessons,
  });
  assert.equal(far.activities[0].lessons[0].id, "u-l03");
});

test("a lesson no activity picked is offered one only when there is a real signal", () => {
  const { activities, lessons: rows } = linkUnit({
    studio: {
      activities: [act("match", "Match", "net and face"), act("cloze", "Fill", "surface area")],
    },
    lessons,
  });
  assert.ok(rows[0].activities.length >= 1 && rows[1].activities.length >= 1);
  assert.equal(
    rows[2].activities.length,
    0,
    "volume is mentioned nowhere, so lesson 3 gets no filler link",
  );
  for (const row of rows)
    for (const a of row.activities)
      assert.ok(
        activities[a.n - 1].lessons.some((l) => l.id === row.id),
        "reverse link has a forward link",
      );
});

test("links are listed best fit first", () => {
  const { activities } = linkUnit({
    studio: { activities: [act("cloze", "Fill", "net net face surface area")] },
    lessons,
  });
  assert.equal(activities[0].lessons[0].id, "u-l01");
});

test("mentionedTerms counts multi-word terms once per occurrence", () => {
  const m = mentionedTerms(
    { kind: "x", title: "t", mission: "Surface area and surface areas.", payload: {} },
    ["surface area", "volume"],
  );
  assert.equal(m.get("surface area"), 2);
  assert.equal(m.has("volume"), false);
});

test("revealFor stays inside the Reveal unit that matches the whole BCPSS unit", () => {
  const reveal = [
    { id: "5-5", unit: 5, title: "Volume", terms: ["Volume", "Cubic units", "Net"] },
    { id: "5-7", unit: 5, title: "Surface area", terms: ["Surface area", "Net"] },
    { id: "2-1", unit: 2, title: "Statistics", terms: ["Order", "Survey"] },
  ];
  const out = revealFor({
    lessons: [
      lesson(1, "a", [v("volume"), v("cubic unit")]),
      lesson(2, "b", [v("order", "new", 2)]),
    ],
    reveal,
  });
  assert.deepEqual(
    out[0].reveal.map((r) => r.id),
    ["5-5"],
  );
  assert.ok(out[0].reveal[0].terms.length >= 1);
});

test("revealFor needs a domain term or two shared words", () => {
  const reveal = [{ id: "2-1", unit: 2, title: "Statistics", terms: ["Order"] }];
  const out = revealFor({ lessons: [lesson(1, "a", [v("order", "new", 2)])], reveal });
  assert.deepEqual(out[0].reveal, []);
});
