// The printed Activity Guide as ONE content model: activity-guide-data.js (how each activity is used, with the real
// button names) merged with data.js (name, where, time, link, built-in help, teaching moves, limits). The PDF and the
// Word file are both built from buildActivityGuideModel(), so they cannot differ. Pure: no DOM.
import { ACTIVITY_GUIDE } from "./activity-guide-data.js";
import { ACTIVITY_BY_ID, ENTRANCE, FACTS, absUrl, shortUrl } from "./data.js";

/** Pathway or area label shown beside the icon (never colour or icon alone). */
const KIND = {
  speaking: { icon: "speaking", label: "Speaking" },
  writing: { icon: "writing", label: "Writing" },
  reading: { icon: "reading", label: "Reading" },
  vocabulary: { icon: "words", label: "Vocabulary" },
};

/** The order Joel asked for: the four curated activities, then the two Explore Later resources. */
export const GUIDE_ORDER = ["hallway", "board", "upgrade", "paragraph", "seasons", "morphemes"];

function card(g) {
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
    group: curated ? "Curated activity" : "Explore later",
    where: a.where,
    does: a.does,
    why: g.why,
    time: a.time,
    link: { url: absUrl(a.route), short: shortUrl(a.route), route: a.route },
    open: g.open,
    steps: g.steps,
    feedback: g.feedback,
    builtIn: curated ? a.builtIn : [a.supports],
    moves: curated ? a.moves : [],
    limits: curated ? a.limits : "",
    teach: g.teach,
    stuck: g.stuck.map(([problem, fix]) => ({ problem, fix })),
  };
}

export function buildActivityGuideModel() {
  const byId = Object.fromEntries(ACTIVITY_GUIDE.map((g) => [g.id, g]));
  return {
    title: "The Language Page Activity Guide",
    lang: "en-US",
    howTo: {
      heading: "How to use these activities",
      lead: "Each page that follows is one activity: what it is, how students use it, what feedback they get, and how to teach it.",
      points: [
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
      ],
      start: { text: "All activities and handouts", url: ENTRANCE.url, short: ENTRANCE.short },
      qrAlt: `QR code for ${ENTRANCE.short}, the teacher starting page.`,
    },
    cards: GUIDE_ORDER.map((id) => card(byId[id])),
  };
}
