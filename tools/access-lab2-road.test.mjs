// ACCESS Practice Lab 2.0: Road to ACCESS 2.0 plan. Negative controls: a shaming regenerated plan, an over-long day,
// a plan without the disclaimer or the milestone weeks, pins that cannot apply.
import assert from "node:assert/strict";
import { test } from "node:test";
import { allStrings, DOMAINS, STUDENT_LABEL_RE } from "../shared/access-lab2/constants.js";
import { DEMO_ITEMS } from "../shared/access-lab2/demo-items.js";
import {
  DISCLAIMER,
  DISCLAIMER_ES,
  disclaimerOk,
  findMissingDisclaimers,
} from "../shared/access-lab2/disclaimer.js";
import { buildProfile } from "../shared/access-lab2/profile.js";
import { READINESS_IDS } from "../shared/access-lab2/readiness.js";
import {
  addPin,
  familyPrintData,
  generateRoad,
  MAX_DAY_MINUTES,
  MIN_DAY_MINUTES,
  removePin,
  shamingPhrases,
  validateRoad,
} from "../shared/access-lab2/road.js";
import { MILESTONES, REFRESH_NOTE, THEMES, TIPS } from "../shared/access-lab2/road-strings.js";
import { scoreItem } from "../shared/access-lab2/scoring.js";
import { BANNED_EN, BANNED_ES, findBanned } from "../shared/access-lab2/wording.js";
import { bestAnswer, clone, worstAnswer } from "./access-lab2-helpers.mjs";

/** A profile where Listening is the weakest domain and the others are strong. */
function profileFor(weak = "Listening", alias = "Star 9") {
  const rows = DEMO_ITEMS.filter((i) => i.gradeBand === "3-5").map((i) =>
    scoreItem(i, i.domain === weak ? worstAnswer(i) : bestAnswer(i)),
  );
  return buildProfile({ alias, gradeBand: "3-5", rows, source: "test" });
}
const PROFILE = profileFor();
const START = "2026-10-05"; // a Monday
const road = (extra = {}) => generateRoad({ profile: PROFILE, startDate: START, ...extra });
const allDays = (plan) => plan.weeks.flatMap((w) => w.days);

test("a plan has 12 weeks of 10-20 minute sessions with built-in retrieval and passes its own validator", () => {
  const plan = road();
  assert.equal(plan.weeks.length, 12);
  assert.deepEqual(validateRoad(plan), []);
  for (const d of allDays(plan))
    assert.ok(
      d.minutes >= MIN_DAY_MINUTES && d.minutes <= MAX_DAY_MINUTES,
      `${d.date} ${d.minutes}`,
    );
  for (const w of plan.weeks.filter((x) => x.type === "build"))
    for (const d of w.days)
      assert.ok(
        d.slots.some((s) => s.type === "retrieval"),
        `week ${w.n} ${d.date}`,
      );
  assert.equal(plan.untimed, true);
  assert.equal(plan.status, "new");
  assert.deepEqual(
    plan.weeks.map((w) => w.type),
    THEMES.map((t) => t.type),
  );
});

test("week 6 has the mini test, week 11 the final practice set over all four domains, week 12 test readiness", () => {
  const plan = road();
  const slots = (n, type) =>
    plan.weeks[n - 1].days.flatMap((d) => d.slots.filter((s) => s.type === type));
  const mini = slots(6, "mini-test");
  assert.equal(mini.length, 1);
  assert.equal(mini[0].activity.build.length, "mini");
  const finals = slots(11, "final-set");
  assert.deepEqual(
    [...new Set(finals.flatMap((s) => s.activity.build.domains))].sort(),
    [...DOMAINS].sort(),
  );
  assert.ok(finals.every((s) => s.activity.build.length === "standard"));
  assert.deepEqual(
    [...new Set(slots(12, "readiness").map((s) => s.activity.id))].sort(),
    [...READINESS_IDS].sort(),
  );
});

test("the weakest domain gets the most focus; focus follows the profile", () => {
  const count = (profile) => {
    const c = Object.fromEntries(DOMAINS.map((d) => [d, 0]));
    for (const w of generateRoad({ profile, startDate: START }).weeks)
      for (const d of w.focusDomains) c[d] += 1;
    return c;
  };
  const listening = count(profileFor("Listening"));
  const writing = count(profileFor("Writing"));
  assert.equal(Math.max(...Object.values(listening)), listening.Listening);
  assert.equal(Math.max(...Object.values(writing)), writing.Writing);
  assert.ok(listening.Listening > listening.Reading && listening.Listening > listening.Writing);
});

test("the calendar is honored: session days and breaks", () => {
  const breaks = ["2026-11-26", "2026-11-27", "2026-12-24"];
  const plan = road({ daysOfWeek: [1, 3, 5], breaks });
  for (const d of allDays(plan)) {
    assert.ok([1, 3, 5].includes(new Date(`${d.date}T00:00:00Z`).getUTCDay()), d.date);
    assert.ok(!breaks.includes(d.date));
  }
  assert.deepEqual(validateRoad(plan), []);
  const thin = road({ daysOfWeek: [1, 2] });
  assert.ok(
    thin.warnings.some((w) => /three or more session days/.test(w)),
    "tells the teacher to add days",
  );
  assert.deepEqual(shamingPhrases(thin), []);
  assert.deepEqual(road({ daysOfWeek: [1, 2, 3] }).warnings, []);
});

test("generation is deterministic", () => {
  assert.deepEqual(road(), road());
});

test("on track: no refresh, no note", () => {
  const dates = allDays(road())
    .filter((d) => d.date < "2026-11-02")
    .map((d) => d.date);
  const plan = road({ today: "2026-11-02", completed: dates });
  assert.equal(plan.status, "on-track");
  assert.equal(plan.note, null);
  assert.ok(
    allDays(plan)
      .filter((d) => d.date < "2026-11-02")
      .every((d) => d.state === "done"),
  );
});

test("falling behind regenerates the plan in kind words and revisits earlier work", () => {
  const plan = road({ today: "2026-11-02", completed: ["2026-10-05", "2026-10-06"] });
  assert.equal(plan.status, "refreshed");
  assert.deepEqual(plan.note, REFRESH_NOTE);
  assert.deepEqual(validateRoad(plan), []);
  assert.deepEqual(shamingPhrases(plan), []);
  const revisit = allDays(plan).flatMap((d) => d.slots.filter((s) => s.type === "revisit"));
  assert.ok(revisit.length > 0);
  assert.ok(revisit.every((s) => /^Revisit: /.test(s.activity.title)));
  assert.ok(allDays(plan).filter((d) => d.date < "2026-11-02" && d.state === "open").length > 0);
  assert.ok(allDays(plan).every((d) => d.minutes <= MAX_DAY_MINUTES));
  assert.ok(
    !allDays(plan).some((d) => d.date < "2026-11-02" && d.slots.some((s) => s.type === "revisit")),
    "only future days get revisits",
  );
});

test("a mini test left open in the past moves to the next session day, once", () => {
  const plan = road({ today: "2026-11-16", completed: ["2026-10-05"] });
  assert.equal(plan.status, "refreshed");
  const minis = allDays(plan).filter((d) => d.slots.some((s) => s.type === "mini-test"));
  assert.equal(minis.length, 1, "exactly one session carries the test");
  assert.ok(minis[0].date >= "2026-11-16", "and it is today or later");
  const moved = allDays(plan).filter((d) => d.slots.some((s) => s.type === "moved"));
  assert.equal(moved.length, 1);
  assert.equal(
    moved[0].date,
    "2026-11-13",
    "the original day is kept in the history, marked moved",
  );
  assert.deepEqual(validateRoad(plan), [], "validator allows the relocated test");
});

test("after the last week the plan reports complete", () => {
  assert.equal(road({ today: "2027-02-01", completed: [] }).status, "complete");
});

test("teacher pins survive regeneration and an applied pin replaces the generated activity", () => {
  const swap = {
    id: "teacher.choice-board",
    title: "Teacher's choice: partner talk about a photo",
    minutes: 8,
    domain: "Speaking",
  };
  const pins = addPin([], { week: 8, dayIndex: 1, slot: 0, activity: swap });
  const first = road({ pins });
  const slot = first.weeks[7].days[1].slots[0];
  assert.equal(slot.activity.id, "teacher.choice-board");
  assert.equal(slot.pinned, true);
  assert.deepEqual(first.unappliedPins, []);
  const again = road({ pins: first.pins, today: "2026-11-02", completed: [] });
  assert.equal(again.status, "refreshed");
  assert.equal(again.weeks[7].days[1].slots[0].activity.id, "teacher.choice-board");
  assert.equal(again.weeks[7].days[1].slots[0].pinned, true);
  assert.deepEqual(again.pins, pins);
  assert.deepEqual(validateRoad(again), []);
  const replaced = addPin(pins, {
    week: 8,
    dayIndex: 1,
    slot: 0,
    activity: { ...swap, id: "teacher.other" },
  });
  assert.equal(replaced.length, 1);
  assert.deepEqual(removePin(replaced, { week: 8, dayIndex: 1, slot: 0 }), []);
});

test("negative control: pins that cannot apply are reported, never silently dropped, and never break a day", () => {
  const act = { id: "teacher.x", title: "Teacher's choice", minutes: 8 };
  const pins = [
    { week: 6, dayIndex: 4, slot: 0, activity: act }, // the mini test slot is protected
    { week: 3, dayIndex: 9, slot: 0, activity: act }, // no such session
    { week: 3, dayIndex: 0, slot: 7, activity: act }, // no such slot
    { week: 3, dayIndex: 1, slot: 0, activity: { ...act, minutes: 20 } }, // would push the day past 20 minutes
  ];
  const plan = road({ pins });
  assert.deepEqual(
    plan.unappliedPins.map((p) => p.reason),
    [
      "practice-test slot",
      "no session that day",
      "no such slot",
      "session would be longer than 20 minutes",
    ],
  );
  assert.deepEqual(plan.pins, pins);
  assert.deepEqual(validateRoad(plan), []);
  assert.equal(plan.weeks[5].days[4].slots[0].type, "mini-test");
  assert.throws(() => addPin([], { week: 13, dayIndex: 0, slot: 0, activity: act }), /1 to 12/);
  assert.throws(() => addPin([], { week: 1, dayIndex: -1, slot: 0, activity: act }), /integer/);
  assert.throws(
    () =>
      addPin([], { week: 1, dayIndex: 0, slot: 0, activity: { id: "x", title: "y", minutes: 90 } }),
    /minutes 3 to 20/,
  );
});

test("negative control: the wording guard flags shaming plans and every banned phrase", () => {
  const shaming = clone(road({ today: "2026-11-02", completed: [] }));
  shaming.note = {
    en: "You are behind. You missed 3 days, so you have to catch up.",
    es: "Estás atrasado.",
  };
  assert.ok(shamingPhrases(shaming).length >= 3);
  assert.ok(validateRoad(shaming).some((e) => /shaming or rushing wording/.test(e)));
  const buried = clone(road());
  buried.weeks[2].days[0].slots[2].activity.title = "Reflect: you failed to finish this last week";
  assert.ok(validateRoad(buried).some((e) => /failed/.test(e)));
  const samples = [
    "You are behind",
    "That is late",
    "You missed it",
    "You failed",
    "overdue work",
    "Don't be lazy",
    "slacking off",
    "catch up now",
    "catching-up",
    "You should have finished",
    "You didn't finish",
    "You haven't done it",
    "not enough practice",
    "poor effort",
    "bad score",
    "Only two days done",
    "a deadline",
    "a penalty",
  ];
  for (const t of samples) assert.ok(findBanned(t).length > 0, `not flagged: ${t}`);
  for (const t of [
    "Vas atrasado",
    "Llegaste tarde",
    "Faltaste a dos días",
    "Fallaste",
    "Perdiste tiempo",
    "Debiste terminar",
    "quedaste rezagado",
    "habrá castigo",
  ])
    assert.ok(findBanned(t).length > 0, `not flagged: ${t}`);
  assert.ok(BANNED_EN.length >= 10 && BANNED_ES.length >= 5);
});

test("the shipped wording is clean: themes, tips, milestones, refresh note and every plan string", () => {
  for (const t of [...THEMES, ...TIPS, ...Object.values(MILESTONES), REFRESH_NOTE])
    for (const text of allStrings(t)) assert.deepEqual(findBanned(text), [], text);
  for (const text of allStrings(road({ today: "2026-11-02", completed: [] }).weeks))
    assert.deepEqual(findBanned(text), [], text);
});

test("negative control: the plan validator flags a 45-minute day, a missing disclaimer, no mini test, no retrieval", () => {
  const long = clone(road());
  long.weeks[0].days[0].slots[0].minutes = 40;
  long.weeks[0].days[0].minutes = 45;
  assert.ok(validateRoad(long).some((e) => /45 minutes/.test(e)));
  const short = clone(road());
  short.weeks[0].days[0].minutes = 4;
  assert.ok(validateRoad(short).some((e) => /4 minutes/.test(e)));
  const noDisc = clone(road());
  delete noDisc.disclaimer;
  assert.ok(validateRoad(noDisc).some((e) => /disclaimer/.test(e)));
  const noMini = clone(road());
  noMini.weeks[5].days.at(-1).slots = noMini.weeks[5].days
    .at(-1)
    .slots.filter((s) => s.type !== "mini-test");
  noMini.weeks[5].days.at(-1).minutes = 5;
  assert.ok(validateRoad(noMini).some((e) => /mini practice test/.test(e)));
  const noRetrieval = clone(road());
  noRetrieval.weeks[1].days[0].slots = noRetrieval.weeks[1].days[0].slots.filter(
    (s) => s.type !== "retrieval",
  );
  noRetrieval.weeks[1].days[0].minutes = 10;
  assert.ok(validateRoad(noRetrieval).some((e) => /retrieval/.test(e)));
  const noReady = clone(road());
  noReady.weeks[11].days[0].slots = noReady.weeks[11].days[0].slots.filter(
    (s) => s.type !== "readiness",
  );
  assert.ok(validateRoad(noReady).some((e) => /readiness skill/.test(e)));
  const noFinal = clone(road());
  for (const d of noFinal.weeks[10].days) d.slots = d.slots.filter((s) => s.type !== "final-set");
  assert.ok(validateRoad(noFinal).some((e) => /four domains/.test(e)));
  assert.deepEqual(validateRoad({ kind: "nope" }), ["not a road plan"]);
});

test("input errors fail fast: only a skill profile and a real date are accepted", () => {
  assert.throws(() => generateRoad({ profile: { kind: "x" }, startDate: START }), /skill profile/);
  assert.throws(() => generateRoad({ profile: PROFILE, startDate: "10/05/2026" }), /YYYY-MM-DD/);
  assert.throws(
    () => generateRoad({ profile: { ...PROFILE, alias: "Maria Lopez" }, startDate: START }),
    /alias/,
  );
});

test("family print data is bilingual, Spanish is a marked draft, and nothing shows a band or label", () => {
  const data = familyPrintData(road());
  assert.equal(data.weeks.length, 12);
  assert.equal(data.translation.es.status, "draft translation");
  assert.match(data.translation.es.label, /borrador/);
  assert.ok(disclaimerOk(data.disclaimer));
  assert.equal(data.disclaimer.en, DISCLAIMER);
  assert.equal(data.disclaimer.es, DISCLAIMER_ES);
  assert.match(data.disclaimer.es, /borrador/);
  for (const w of data.weeks) {
    assert.ok(w.theme.en && w.theme.es && w.tip.en && w.tip.es, `week ${w.n} has EN and ES`);
    assert.ok(w.dates && w.minutesPerDay.min >= 10 && w.minutesPerDay.max <= 20);
  }
  assert.equal(data.weeks[5].milestone.en, MILESTONES["mini-test"].en);
  const text = allStrings({ t: data.title, i: data.intro, w: data.weeks });
  for (const t of text) {
    assert.ok(!STUDENT_LABEL_RE.test(t), `label word in family text: ${t}`);
    assert.deepEqual(findBanned(t), [], t);
  }
  assert.ok(!JSON.stringify(data).includes("Star"), "family print carries no alias");
  assert.deepEqual(findMissingDisclaimers(data), []);
});

test("family print notes a week with no session days instead of inventing one", () => {
  const plan = road({
    breaks: allDays(road())
      .filter((d) => d.date >= "2026-10-12" && d.date <= "2026-10-16")
      .map((d) => d.date),
  });
  const data = familyPrintData(plan);
  assert.equal(data.weeks[1].dates, null);
  assert.equal(data.weeks[1].minutesPerDay, null);
  assert.throws(() => familyPrintData({ kind: "x" }), /road plan/);
});
