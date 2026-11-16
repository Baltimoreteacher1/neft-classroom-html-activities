// The Data Chase — the town and its cases. No DOM.
//
// You are a reporter at the Meridian Ledger. Each level is one street with
// sources on it (people, sensors, a tip jar) and desks where a story is
// built. Sources only appear once a case asks a question that data can
// answer. Every claim you publish is checked by the fact-checker against the
// data you collected.
//
// Case kinds (worked at a desk):
//   question   pick the statistical question; only it opens a data trail
//   histogram  choose a bin width; name the interval with the most values
//   headline   choose a measure of center (mean or median) and its value
//   mean       find the mean of a set (fair share)
//   boxplot    build a box plot (five numbers) for one data set
//   compare    which set is more consistent? (IQR, not range)

import { makeBody } from "../../runtime/physics.js";

export const FLOOR = 520;
const S = (x, v, who, y = FLOOR) => ({ x, v, who, y });
const ledge = (x, y, w) => ({ x, y, w, h: 16, kind: "ledge", oneWay: 1 });

export const LEVELS = [
  {
    id: "the-tip",
    lessons: ["2-1", "2-2"],
    lesson: "2-1",
    len: 2400,
    ledges: [ledge(900, 430, 180), ledge(1500, 430, 160)],
    sources: [
      S(380, 12, "student"),
      S(520, 22, "student"),
      S(660, 18, "student"),
      S(980, 30, "student", 430),
      S(1160, 15, "student"),
      S(1300, 25, "student"),
      S(1560, 21, "student", 430),
      S(1720, 28, "student"),
      S(1860, 20, "student"),
      S(2000, 34, "student"),
    ],
    lonely: S(380, 17, "okafor"),
    desks: [
      { x: 180, kind: "question" },
      { x: 2200, kind: "histogram", widths: [2, 5, 10] },
    ],
  },
  {
    id: "the-outlier",
    lessons: ["2-3", "2-8", "2-10"],
    lesson: "2-10",
    len: 2400,
    ledges: [ledge(1620, 420, 200)],
    sources: [
      S(360, 18, "worker"),
      S(500, 14, "worker"),
      S(640, 20, "worker"),
      S(800, 17, "worker"),
      S(960, 19, "worker"),
      S(1120, 21, "worker"),
      S(1280, 16, "worker"),
      S(1440, 18, "worker"),
      S(1700, 95, "driver", 420),
    ],
    tips: [4, 6, 7, 7, 8, 10],
    desks: [
      { x: 180, kind: "start" },
      { x: 1980, kind: "headline" },
      { x: 2200, kind: "mean" },
    ],
  },
  {
    id: "two-districts",
    lessons: ["2-4", "2-5"],
    lesson: "2-4",
    len: 2800,
    ledges: [ledge(700, 430, 160), ledge(1700, 430, 160)],
    sources: [
      S(300, 10, "north"),
      S(420, 12, "north"),
      S(540, 13, "north"),
      S(760, 15, "north", 430),
      S(900, 16, "north"),
      S(1020, 18, "north"),
      S(1140, 19, "north"),
      S(1260, 21, "north"),
      S(1380, 24, "north"),
      S(1500, 8, "south"),
      S(1620, 14, "south"),
      S(1760, 15, "south", 430),
      S(1900, 15, "south"),
      S(2020, 16, "south"),
      S(2140, 16, "south"),
      S(2260, 17, "south"),
      S(2380, 18, "south"),
      S(2500, 30, "south"),
    ],
    desks: [
      { x: 180, kind: "start" },
      { x: 2580, kind: "boxplot", set: "north" },
      { x: 2720, kind: "boxplot", set: "south" },
      { x: 2860, kind: "compare" },
    ],
  },
];

export const QUESTIONS = [
  { id: "okafor", statistical: false },
  { id: "class", statistical: true },
  { id: "bus", statistical: false },
];

export function createWorld(index, seed) {
  const L = LEVELS[index];
  const solids = [
    { x: 0, y: FLOOR, w: L.len + 200, h: 200, kind: "floor" },
    ...L.ledges.map((l) => ({ ...l })),
  ];
  return {
    rng: seed >>> 0 || 1,
    tick: 0,
    level: index,
    w: L.len + 200,
    h: 620,
    p: makeBody(80, FLOOR - 40),
    solids,
    // In level 1 no sources exist until a statistical question is chosen.
    sources: index === 0 ? [] : L.sources.map((s, i) => ({ ...s, id: i, got: 0, phase: i * 37 })),
    notebook: [],
    question: null,
    desks: L.desks.map((d, i) => ({
      ...JSON.parse(JSON.stringify(d)),
      id: i,
      done: d.kind === "start" ? 1 : 0,
      answer: null,
    })),
    tips: L.tips ? L.tips.slice() : null,
    // Level 1: the trail a statistical question opens, and the one source a non-statistical one finds.
    trail: index === 0 ? L.sources.map((s, i) => ({ ...s, id: i, got: 0, phase: i * 37 })) : null,
    lonely: L.lonely ? { ...L.lonely, id: 99, got: 0, phase: 0 } : null,
    done: 0,
  };
}

/** The data set a desk works on. */
export function dataFor(w, desk) {
  if (desk.kind === "mean") return w.tips;
  if (desk.set) return w.notebook.filter((n) => n.who === desk.set).map((n) => n.v);
  return w.notebook.map((n) => n.v);
}
