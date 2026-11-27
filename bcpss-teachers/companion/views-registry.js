// Plan & Respond — the view modules added after the first four (map, build, check, reteach), in one table.
// Each module exports render(st, detail) and act(st, action, arg, ctx); some also export input() and load().
// group is a key of GROUPS in companion-data.js: the six teacher-facing sections the views are listed under.

import * as words from "./concept-cards.js";
import * as day from "./day-plan.js";
import { corners, match, routine } from "./engage.js";
import { tally, week } from "./teach-week.js";
import * as guess from "./guess-game.js";
import * as labs from "./labs.js";
import * as practice from "./practice.js";
import * as projects from "./projects.js";
import * as reserve from "./reserve.js";
import * as text from "./text-companion.js";
import * as transform from "./transform.js";

export const NEW_VIEWS = [
  { id: "day", group: "teach", label: "Today's lesson", hint: "A full class period, ready to run", ...day },
  { group: "teach", label: "This week", hint: "Five-day language plan", ...week },
  { group: "teach", label: "Talk routine", hint: "A class talk routine, one step at a time", ...routine },
  { id: "text", group: "teach", label: "Read together", hint: "Passage, words and evidence", ...text },
  { id: "labs", group: "teach", label: "Hands-on lab", hint: "Try the idea on screen", ...labs },
  { id: "words", group: "vocab", label: "Word cards", hint: "Meaning, examples and Spanish for each word", ...words },
  { id: "guess", group: "vocab", label: "Guess my word", hint: "Whole-class clue game", ...guess },
  { group: "vocab", label: "Word match", hint: "Memory game: words and meanings", ...match },
  { group: "practice", label: "Four corners", hint: "Students pick a side and explain", ...corners },
  { id: "practice", group: "practice", label: "Listen, speak, read, write", hint: "Practice all four skills", ...practice },
  {
    id: "stations",
    group: "practice",
    label: "Station rotation",
    hint: "Prototype: rotation chart",
    render: reserve.renderStations,
    act: reserve.actStations,
  },
  {
    id: "quick",
    group: "practice",
    label: "Spiral warm-up",
    hint: "Prototype: five review questions",
    render: reserve.renderQuick,
    act: reserve.actQuick,
  },
  { group: "assess", label: "Sort exit tickets", hint: "Count them, see what to do next", ...tally },
  { id: "transform", group: "language", label: "Prepare any text", hint: "Paste a text, get a student copy", ...transform },
  { id: "projects", group: "projects", label: "Cross-subject project", hint: "Pair this unit with another subject", ...projects },
];

export const viewById = (id) => NEW_VIEWS.find((v) => v.id === id);
