// Grade bands: the one list of which grade bands the lab ships, how their content is stored and how each one is
// shown. Read by the app (router, store, band switch, audio-first mode), by the content tools
// (tools/lib/access-lab-content.mjs builds content/index.json from it) and by the homepage band picker, which reads
// the `gradeBands` list this module puts in content/index.json.
//
// Two names exist on purpose:
//   - a CONTENT band is the folder and storage key the activities live under (content/g<band>/, progress keys).
//     "3-5" stays the content band for upper elementary so every saved record and shared ?grades=3-5 link keeps
//     working.
//   - a PICKER band is what a person chooses: K, 1, 2-3, 4-5, 6-8. "4-5" opens the "3-5" content (grade 3 now has
//     its own 2-3 band, whose content is written for grades 2 and 3).
// Pure data and functions, no DOM: Node tools import it.
import { FOCUS_BAND, GRADE_FOCUS, gradeFocusCounts } from "./grade-focus.js";

/** Content bands in display order (youngest first). */
export const CONTENT_BANDS = ["K", "1", "2-3", "3-5", "6-8"];

/** Bands built for children who may not read yet: the audio-first player is their default. */
export const EARLY_BANDS = ["K", "1", "2-3"];

export const BAND_INFO = {
  K: {
    picker: "K",
    idPrefix: "gk-",
    label: "Kindergarten",
    labelEs: "Kínder",
    short: "K",
    grades: ["K"],
    audioFirst: true,
    // Kindergarten is an adult-read story, not a computer test: the hub opens Story Time first.
    hostedByAdult: true,
  },
  1: {
    picker: "1",
    idPrefix: "g1-",
    label: "Grade 1",
    labelEs: "1.º grado",
    short: "1",
    grades: ["1"],
    audioFirst: true,
    hostedByAdult: false,
  },
  "2-3": {
    picker: "2-3",
    idPrefix: "g23-",
    label: "Grades 2–3",
    labelEs: "Grados 2–3",
    short: "2–3",
    grades: ["2", "3"],
    audioFirst: true,
    hostedByAdult: false,
  },
  "3-5": {
    picker: "4-5",
    idPrefix: "g35-",
    label: "Grades 3–5",
    labelEs: "Grados 3–5",
    short: "3–5",
    grades: ["3", "4", "5"],
    audioFirst: false,
    hostedByAdult: false,
  },
  "6-8": {
    picker: "6-8",
    idPrefix: "",
    label: "Grades 6–8",
    labelEs: "Grados 6–8",
    short: "6–8",
    grades: ["6", "7", "8"],
    audioFirst: false,
    hostedByAdult: false,
  },
};

/** Picker id -> content band. Every content band is also accepted as itself. */
const PICKER_TO_CONTENT = {
  K: "K",
  1: "1",
  "2-3": "2-3",
  "4-5": "3-5",
  "3-5": "3-5",
  "6-8": "6-8",
  k: "K",
};

/** A ?grades= value (picker or content id) as a content band, or "" when it names no band. */
export const normalizeBand = (value) => PICKER_TO_CONTENT[String(value ?? "").trim()] || "";

/** A band written in a share code, check-in or assignment: any picker or content id, else `fallback`. */
export const codeBand = (value, fallback = "6-8") => normalizeBand(value) || fallback;

export const isEarlyBand = (band) => EARLY_BANDS.includes(band);

/** Content band of an activity id, from its prefix. 6-8 ids carry no prefix. */
export function bandOfId(id) {
  const s = String(id);
  for (const band of CONTENT_BANDS) {
    const prefix = BAND_INFO[band].idPrefix;
    if (prefix && s.startsWith(prefix)) return band;
  }
  // Older grades 3–5 ids were written "g35…" without the dash in a few shared links.
  return s.startsWith("g35") ? "3-5" : "6-8";
}

/** Every content band as [value, label] for a grade-band <select>; `es` picks the Spanish label. */
export const bandOptions = (es = false) =>
  CONTENT_BANDS.map((b) => [b, es ? BAND_INFO[b].labelEs : BAND_INFO[b].label]);

export const bandLabel = (band) =>
  BAND_INFO[band]?.label || `Grades ${String(band).replace("-", "–")}`;
export const bandLabelEs = (band) =>
  BAND_INFO[band]?.labelEs || `Grados ${String(band).replace("-", "–")}`;

/**
 * Is the audio-first player on for this band? The learner's (or adult's) choice wins; otherwise the band's
 * default. Stored as prefs.audioFirst = { <band>: true|false }.
 */
export function audioFirstOn(prefs, band) {
  const choice = prefs?.audioFirst?.[band];
  if (typeof choice === "boolean") return choice;
  return Boolean(BAND_INFO[band]?.audioFirst);
}

/**
 * The homepage picker list written into content/index.json (`gradeBands`). `focusTags` is one entry per 6-8
 * activity (its `grades` list or undefined); it makes the 6-8 entry carry `gradeFocus`, the Grade 6 / 7 / 8
 * choices the picker shows under the band with how many activities each one lists.
 */
export function gradeBandsIndex(contentBandsWithContent, focusTags = []) {
  return CONTENT_BANDS.filter((b) => contentBandsWithContent.includes(b)).map((band) => {
    const info = BAND_INFO[band];
    return {
      id: info.picker,
      contentBand: band,
      label: info.label === "Grades 3–5" ? "Grades 4–5" : info.label,
      labelEs: info.labelEs === "Grados 3–5" ? "Grados 4–5" : info.labelEs,
      grades: band === "3-5" ? ["4", "5"] : info.grades,
      audioFirst: info.audioFirst,
      entry: isEarlyBand(band)
        ? `/access-practice-lab/early?grades=${info.picker}`
        : `/access-practice-lab/?grades=${info.picker}`,
      ...(band === FOCUS_BAND && focusTags.length ? { gradeFocus: focusIndex(focusTags) } : {}),
    };
  });
}

function focusIndex(focusTags) {
  const counts = gradeFocusCounts(focusTags);
  return GRADE_FOCUS.map((f) => ({
    id: f.id,
    label: f.label[0],
    labelEs: f.label[1],
    count: counts[f.id || "all"],
  }));
}
