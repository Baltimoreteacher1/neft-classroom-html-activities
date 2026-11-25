// Routine blocks, family "listen": dictogloss, sentence ladder, Language Doctor.
// Source data: esol_pack.dictogloss, esol_pack.ladder, esol_pack.doctor.
// Dictogloss and Doctor have a student sheet (no text, no answers) and a teacher key.
import { chips, h, kv, lines, list, mc, p } from "./nodes.js";

export const LISTEN_BLOCKS = [
  {
    id: "dictogloss",
    family: "listen",
    title: "Listen and rebuild (dictogloss)",
    blurb: "Teacher reads a short text twice; students jot key words and rebuild it.",
    audience: "student",
    part: "rt-dictogloss",
    keyPart: "rt-dictokey",
    paths: ["esol_pack.dictogloss"],
    skip: ["word_count"],
    teacherOnly: ["text", "sentences", "steps", "tier_notes"],
    source: (d) => d?.esol_pack?.dictogloss,
    build(s, band, view) {
      if (view === "student")
        return [chips(s.key_words, "Key words"), lines(6, "Rebuild the text in your own words")];
      return [
        h("Steps"),
        list(s.steps, true),
        h("Text to read aloud"),
        p(s.text),
        chips(s.key_words, "Key words"),
        p(`Support for this level: ${s.tier_notes?.[band] || ""}`, true),
      ];
    },
  },
  {
    id: "ladder",
    family: "listen",
    title: "Sentence ladder",
    blurb: "Start with a short sentence and climb: add detail, place, example.",
    audience: "student",
    part: "rt-ladder",
    paths: ["esol_pack.ladder"],
    source: (d) => d?.esol_pack?.ladder,
    build(s, band) {
      const tier = s.tiers?.[band] || { rungs: [], frames: [], word_bank: [] };
      return [
        chips(s.unit_terms, "Unit words"),
        p(s.kernel),
        h("Build it up"),
        list(
          tier.rungs.map(
            (r) =>
              `${r.label}: ${r.prompt}${r.connectors?.length ? ` (${r.connectors.join(", ")})` : ""}`,
          ),
          true,
        ),
        h("Frames"),
        list(tier.frames),
        chips(tier.word_bank, "Word bank"),
      ];
    },
  },
  {
    id: "doctor",
    family: "listen",
    title: "Language Doctor",
    blurb: "Find the sentence that fixes a common transfer error.",
    audience: "student",
    part: "rt-doctor",
    keyPart: "rt-doctorkey",
    paths: ["esol_pack.doctor"],
    skip: ["id", "order", "answer_index"],
    teacherOnly: ["error_type", "rule", "why"],
    source: (d) => d?.esol_pack?.doctor,
    build(items, _band, view) {
      const key = view !== "student";
      return [
        mc(
          items.map((x) => ({
            q: x.wrong,
            options: x.options,
            ...(key ? { answer: x.answer_index, note: [`${x.error_type}: ${x.rule}`, x.why] } : {}),
          })),
        ),
      ];
    },
  },
];
