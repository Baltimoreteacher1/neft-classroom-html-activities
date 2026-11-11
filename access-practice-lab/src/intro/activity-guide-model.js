// The Activity Guide as ONE content model per grade choice: the /start/activities page, the printed PDF and the Word
// file are all built from buildActivityGuideModel(pick), so they cannot differ.
//   Grades 6–8: the curated activities (activity-guide-data.js + data.js) plus that grade's Listening and Reading.
//   Every other grade: its four activities from tour-bands.js, explained in activity-guide-bands.js.
// Pure: no DOM.
import { BAND_GUIDE_BY_ID } from "./activity-guide-bands.js";
import { ACTIVITY_GUIDE } from "./activity-guide-data.js";
import { ACTIVITY_BY_ID, ENTRANCE, FACTS, absUrl, shortUrl } from "./data.js";
import { DEFAULT_PICK, gradeName, isPick } from "./quick-guide-files.js";
import { DOMAINS, tourActivity, tourRoute } from "./tour-bands.js";

/** Pathway or area label shown beside the icon (never colour or icon alone). */
const KIND = {
  speaking: { icon: "speaking", label: "Speaking" },
  writing: { icon: "writing", label: "Writing" },
  reading: { icon: "reading", label: "Reading" },
  vocabulary: { icon: "words", label: "Vocabulary" },
};

/** The curated order Joel asked for: the four curated activities, then the two Explore Later resources. */
export const GUIDE_ORDER = ["hallway", "board", "upgrade", "paragraph", "seasons", "morphemes"];

/** Card ids for a grade choice, in domain order. Grades 6–8 slots its Listening and Reading in before each pair. */
export function guideOrder(pick) {
  if (pick !== DEFAULT_PICK) return DOMAINS.map((d) => tourActivity(pick, d.id).id);
  const listening = tourActivity(pick, "listening").id;
  const reading = tourActivity(pick, "reading").id;
  return [listening, "hallway", "board", reading, "upgrade", "paragraph", "seasons", "morphemes"];
}

const link = (route) => ({ url: absUrl(route), short: shortUrl(route), route });

function curatedCard(g) {
  const a = ACTIVITY_BY_ID[g.id];
  if (!a) throw new Error(`activity-guide: ${g.id} is not in data.js`);
  const kind = KIND[a.pathway || a.area];
  if (!kind) throw new Error(`activity-guide: ${g.id} has no pathway or area`);
  const curated = Boolean(a.pathway);
  return {
    id: g.id,
    name: a.name,
    kind: kind.label,
    icon: kind.icon,
    cls: `pw-${a.pathway || a.area}`,
    group: curated ? "Curated activity" : "Explore later",
    where: a.where,
    does: a.does,
    why: g.why,
    time: a.time,
    link: link(a.route),
    open: g.open,
    steps: g.steps,
    feedback: g.feedback,
    builtIn: curated ? a.builtIn : [a.supports],
    moves: curated ? a.moves : [],
    limits: curated ? a.limits : "",
    teach: g.teach,
    stuck: g.stuck.map(([problem, fix]) => ({ problem, fix })),
    preview: a.preview || null,
  };
}

function bandCard(pick, a) {
  const g = BAND_GUIDE_BY_ID[a.id];
  if (!g) throw new Error(`activity-guide: no guide entry for ${a.id} (${pick})`);
  return {
    id: a.id,
    name: a.title,
    kind: a.domain.name,
    icon: a.domain.icon,
    cls: a.domain.cls,
    group: `Activity for ${gradeName(pick)}`,
    where: `${a.domain.studio} · ${a.level}`,
    does: a.students,
    why: g.why,
    time: `${a.minutes} min`,
    link: link(tourRoute(a)),
    open: g.open,
    steps: g.steps,
    feedback: g.feedback,
    builtIn: g.builtIn,
    moves: g.moves,
    limits: g.limits,
    teach: g.teach,
    stuck: g.stuck.map(([problem, fix]) => ({ problem, fix })),
    preview: null,
  };
}

const EARLY = new Set(["K", "1", "2-3"]);

function howToPoints(pick) {
  if (EARLY.has(pick))
    return [
      ["Open the link", `${FACTS.account} Share the link; it opens at the right grade.`],
      [
        "Listen first",
        "Directions are spoken and answers are pictures. “Hear it again” replays any direction, and replay never removes a choice.",
      ],
      [
        "Feedback is not a score",
        "Pages say “Not yet” or “Yes!” and invite another try. Nothing on these pages is an ACCESS score or a WIDA level.",
      ],
      ["Recording is optional", FACTS.microphone],
      [
        "Writing is on paper",
        "Young writers print the page, write with a pencil and show a grown-up.",
      ],
    ];
  return [
    [
      "Open the link",
      `${FACTS.account} Share the link, or let students find the activity from the More menu.`,
    ],
    [
      "Choose help",
      "Most activities ask first how much help a student wants, such as frames and words, a word bank, or on my own. Some also offer more help along the way.",
    ],
    [
      "Feedback is not a score",
      "The checks look for words and patterns, not meaning. Nothing on these pages is an ACCESS score or a WIDA level.",
    ],
    ["Recording is optional", FACTS.microphone],
    ["Work saves on the device", FACTS.saving],
  ];
}

export function buildActivityGuideModel(pick = DEFAULT_PICK) {
  const id = isPick(pick) ? pick : DEFAULT_PICK;
  const curated = Object.fromEntries(ACTIVITY_GUIDE.map((g) => [g.id, g]));
  const grade = gradeName(id);
  const cards = guideOrder(id).map((cardId) =>
    curated[cardId]
      ? curatedCard(curated[cardId])
      : bandCard(
          id,
          tourActivity(id, DOMAINS.find((d) => tourActivity(id, d.id)?.id === cardId).id),
        ),
  );
  return {
    title: `The Language Page Activity Guide: ${grade}`,
    pick: id,
    grade,
    lang: "en-US",
    howTo: {
      heading: "How to use these activities",
      lead: `Each page that follows is one activity for ${grade}: what it is, how students use it, what feedback they get, and how to teach it.`,
      points: howToPoints(id),
      start: { text: "All activities and handouts", url: ENTRANCE.url, short: ENTRANCE.short },
      qrAlt: `QR code for ${ENTRANCE.short}, the teacher starting page.`,
    },
    cards,
  };
}
