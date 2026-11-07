// The class assignment builder's data: which lab activities a teacher can assign for a grade band, and the one link
// shape an assignment uses. K, 1 and 2-3 (audio-first) are first-class here: each row carries its band, so the
// builder, the saved assignment and the student's "Assigned practice" list all name the same grade band.
import { BAND_INFO, bandLabel, bandLabelEs, codeBand } from "../bands.js";
import { unitAssignmentRows } from "../lang/units.js";
import { BASE } from "../util.js";

export const ASSIGN_DOMAINS = ["Reading", "Writing", "Speaking", "Listening"];
/** The builder's extra choice: a lesson or project of a thematic unit (src/lang/units.js), assigned by its link. */
export const UNITS_ASSIGN = "Units";

/** Assignable unit stops of a band, shaped like activity rows (id, title, path) so the builder treats them alike. */
export const assignableUnitStops = (units, band) => unitAssignmentRows(units || [], codeBand(band)).map((r) => ({ ...r, band: codeBand(band), unit: true }));
/** Same rule the class server applies to an assignment id (shared/class-platform/contract.js SKILL_RE). */
export const ID_OK = /^[a-z0-9][a-z0-9:_-]{0,39}$/;

/** App-relative activity link. Grades 6-8 keep the older link; every other band names itself with ?grades=. */
export const assignmentPath = (band, domain, level, id) =>
  `${BASE}/${domain}/${level}/${id}${codeBand(band) === "6-8" ? "" : `?grades=${codeBand(band)}`}`;

/** Activities of one band and skill that can be assigned (worksheets are paper-only and cannot be done in the lab). */
export function assignableActivities(index, band, domain) {
  const b = codeBand(band);
  const levels = index?.bands?.[b]?.domains?.[domain]?.levels || {};
  return Object.entries(levels).flatMap(([level, L]) =>
    (L.activities || [])
      .filter((r) => ID_OK.test(r[0]) && r[2] !== "worksheet")
      .map((r) => ({
        id: r[0],
        title: r[1],
        type: r[2],
        level,
        band: b,
        audioFirst: Boolean(BAND_INFO[b]?.audioFirst),
        path: assignmentPath(b, domain, level, r[0]),
      })),
  );
}

/** "Grades 2–3 · Level A · Find the Seed · audio-first", in the reader's language (`S` picks EN or ES). */
export const assignmentLabel = (S, row) =>
  row.unit ? `${S(bandLabel(row.band), bandLabelEs(row.band))} · ${row.title}` : `${S(bandLabel(row.band), bandLabelEs(row.band))} · ${S("Level", "Nivel")} ${row.level} · ${row.title}${row.audioFirst ? ` · ${S("audio-first", "con audio primero")}` : ""}`;

/** The saved assignment as the class server stores it: id, title, app-relative path, due date. */
export const toAssignment = (row) => ({ id: row.id, title: row.title, path: row.path, due: null });

/** Grade-band name of a saved assignment, read from its link (older links without ?grades= are 6-8). */
export const assignmentBand = (path) => codeBand(/[?&]grades=([\w-]+)/.exec(String(path || ""))?.[1], "6-8");

/** "Grades 2–3" for a saved assignment's grade band, in the reader's language. */
export const assignmentBandText = (S, path) => {
  const band = assignmentBand(path);
  return S(bandLabel(band), bandLabelEs(band));
};
