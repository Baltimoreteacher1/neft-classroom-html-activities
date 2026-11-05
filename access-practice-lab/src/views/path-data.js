// One read of this device's evidence for the student path (/path) and the scaffold tools (/scaffold/*):
// skill graph → Language DNA → constellation → readiness → next mission. Official ACCESS results live only
// in the teacher's browser, keyed by the teacher's roster (access-teacher/evidence.js), so the student device
// has none to read: the DNA here is practice evidence only, and the page says a teacher can add results.
import { dueForReview } from "../lang/adapt.js";
import { buildConstellation } from "../lang/constellation.js";
import { buildLanguageDna } from "../lang/dna.js";
import { loadLedger } from "../lang/ledger.js";
import { chooseNextMission } from "../lang/mission.js";
import { buildReadiness } from "../lang/readiness.js";
import { buildSkillGraph } from "../lang/skill-graph.js";
import { ALL_ITEMS, TOOLS } from "../content/scaffold-items.js";
import { allRecords } from "../store.js";
import { BASE } from "../util.js";

/** Practice places outside the scaffold tools, one per domain, so a mission always has somewhere to go. */
const ROOMS = Object.freeze([
  {
    id: "listening-room",
    domain: "Listening",
    use: "Inform",
    path: "Listening",
    name: ["Listening practice", "Práctica de comprensión auditiva"],
  },
  {
    id: "reading-room",
    domain: "Reading",
    use: "Explain",
    path: "reading-room",
    name: ["Reading Room", "Sala de lectura"],
  },
  {
    id: "speaking-studio",
    domain: "Speaking",
    use: "Explain",
    path: "speak",
    name: ["Speaking Studio", "Estudio de expresión oral"],
  },
]);

export const scaffoldHref = (tool, band, item = "") =>
  `${BASE}/scaffold/${tool}?grades=${band}${item ? `&item=${encodeURIComponent(item)}` : ""}`;

/** Tasks a mission can point at for this band: every scaffold item plus the three practice rooms. */
export function pathTasks(band) {
  return [
    ...ALL_ITEMS.filter((i) => i.band === band).map((i) => ({
      id: i.id,
      domain: TOOLS[i.tool].domain,
      use: i.use,
      href: scaffoldHref(i.tool, band, i.id),
      name: TOOLS[i.tool].name,
      topic: i.topic,
    })),
    ...ROOMS.map((r) => ({ ...r, href: `${BASE}/${r.path}?grades=${band}` })),
  ];
}

/** Where a ledger entry can be picked up again. Unknown sources fall back to the domain's room. */
export function entryHref(entry, band) {
  const q = `?grades=${band}`;
  const id = encodeURIComponent(entry.task || "");
  if (entry.src === "scaffold") {
    const item = ALL_ITEMS.find((i) => i.id === entry.task);
    if (item) return scaffoldHref(item.tool, band, item.id);
  }
  if (entry.src === "writing" && id) return `${BASE}/write/${id}${q}`;
  if (entry.src === "speaking" && id) return `${BASE}/speak/${id}${q}`;
  if (entry.src === "mission" && id) return `${BASE}/missions/${id}${q}`;
  if (entry.src === "detective" && id) return `${BASE}/detective/${id}${q}`;
  if (["Listening", "Reading", "Speaking", "Writing"].includes(entry.domain))
    return `${BASE}/${entry.domain}${q}`;
  return `${BASE}/library${q}`;
}

/** A readable name for a ledger entry's task. */
export function entryTitle(entry) {
  const item = ALL_ITEMS.find((i) => i.id === entry.task);
  if (item) return { tool: TOOLS[item.tool].name, topic: item.topic };
  return { tool: null, topic: entry.task || entry.src };
}

/** Everything /path and the scaffold tools read, for one grade band, from this device only. */
export function readPath(band, { now = Date.now() } = {}) {
  const ledger = loadLedger();
  const entries = ledger.entries.filter((e) => e.band === band);
  const records = Object.fromEntries(
    allRecords()
      .filter((r) => r.band === band && ["Listening", "Reading"].includes(r.domain))
      .map((r) => [
        `${r.band === "3-5" ? "g3-5:" : ""}${r.domain}:${r.level}`,
        { domain: r.domain, results: r.record.results },
      ]),
  );
  const graph = buildSkillGraph(entries, records);
  const dna = buildLanguageDna({ official: [], graph, now });
  const constellation = buildConstellation(entries, records, { graph });
  const readiness = buildReadiness(constellation);
  const due = dueForReview(entries, now, { records, n: 5 });
  const last = entries.at(-1) || null;
  const tasks = pathTasks(band);
  const mission = chooseNextMission({
    dna,
    readiness,
    tasks,
    due: due.length,
    lastDomain: last?.domain || null,
  });
  const missionTask = tasks.find((x) => x.id === mission.taskId) || null;
  return { ledger, entries, graph, dna, constellation, readiness, due, last, mission, missionTask };
}

/** The support condition the DNA sets for a domain right now. */
export const conditionFor = (dna, domain) =>
  dna.domains.find((d) => d.domain === domain)?.support || null;
