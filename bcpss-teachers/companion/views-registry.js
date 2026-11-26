// Plan & Respond — the view modules added after the first four (map, build, check, reteach), in one table.
// Each module exports render(st, detail) and act(st, action, arg, ctx); some also export input() and load().
// group is a key of GROUPS in companion-data.js: the six teacher-facing sections the views are listed under.

import * as words from "./concept-cards.js";
import * as labs from "./labs.js";
import * as practice from "./practice.js";
import * as projects from "./projects.js";
import * as reserve from "./reserve.js";
import * as text from "./text-companion.js";
import * as transform from "./transform.js";

export const NEW_VIEWS = [
  { id: "text", group: "teach", label: "Read together", hint: "Passage, words and evidence", ...text },
  { id: "labs", group: "teach", label: "Virtual lab", hint: "Hands-on for this subject", ...labs },
  { id: "words", group: "vocab", label: "Word cards", hint: "Animated concept cards", ...words },
  { id: "practice", group: "practice", label: "Four-domain practice", hint: "Listen, speak, read, write", ...practice },
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
  { id: "transform", group: "language", label: "Transform a text", hint: "Any text into a student copy", ...transform },
  { id: "projects", group: "projects", label: "Cross-subject project", hint: "Pair two units", ...projects },
];

export const viewById = (id) => NEW_VIEWS.find((v) => v.id === id);
