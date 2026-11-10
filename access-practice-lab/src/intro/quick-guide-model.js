// The Quick Guide as ONE content model. The on-screen page (/start/guide), the PDF and the Word file are all built from
// buildGuideModel(), so a title, a time, a link or a support cannot differ between them. Every fact is read from data.js.
// Pure: no DOM, so scripts/generate-intro-guide.mjs imports it in Node.
import {
  ACTIVITY_BY_ID,
  DOWNLOADS,
  ENTRANCE,
  EXPLORE_SEQUENCE,
  FEATURED_LESSON,
  PATHWAYS,
  PLANNING_PROMPTS,
  REHEARSAL_FRAME,
  ROUTES,
  absUrl,
  activitiesFor,
  shortUrl,
} from "./data.js";

/** Files the page links to. Hrefs come from data.js (DOWNLOADS); names never contain the word "teacher". */
export const GUIDE_FILES = {
  qrStart: "/access-practice-lab/guides/qr-start.svg",
  downloads: [
    { id: "guide", name: "Quick Guide (2 pages)", ...DOWNLOADS.quickGuide },
    { id: "lesson", name: "Featured Lesson backup (2 pages)", ...DOWNLOADS.lessonBackup },
    { id: "notes", name: "Presenter notes", ...DOWNLOADS.presenterNotes },
  ],
};

/** The two checkpoints that are stored on the device (checkbox ids and planning field ids). */
export const GUIDE_STORE_KEY = "guide";

export const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const link = (text, route) => ({ text, route, url: absUrl(route), short: shortUrl(route) });
/** Every web address on page 1 starts with this; the activity rows print only what follows it (route), once-stated. */
export const ADDRESS_PREFIX = shortUrl("");

const activityRow = (a) => ({
  id: a.id,
  name: a.name,
  tryNow: a.tryNow,
  classroomUse: a.classroomUse,
  link: link(a.name, a.route),
});

export function buildGuideModel() {
  const lesson = FEATURED_LESSON;
  const anchor = ACTIVITY_BY_ID[lesson.anchor];
  const stepMinutes = lesson.steps.reduce((sum, s) => sum + s.minutes, 0);
  return {
    title: "Quick Guide",
    siteName: "The Language Page",
    lang: "en-US",
    page1: {
      heading: "Your 20-Minute Exploration",
      startHere:
        "Choose speaking or writing, try one activity as a learner, then plan how you will use it. Timing is advice; tick each activity you try.",
      addressNote: `Web addresses below begin with ${ADDRESS_PREFIX}`,
      sequence: EXPLORE_SEQUENCE.map((s) => ({
        range: `${s.range} min`,
        name: s.name,
        detail: s.detail,
      })),
      pathways: PATHWAYS.map((p) => ({
        id: p.id,
        icon: p.icon,
        name: p.name,
        blurb: p.blurb,
        activities: activitiesFor(p.id).map(activityRow),
      })),
      planning: {
        heading: "Plan it",
        prompts: PLANNING_PROMPTS.map((p) => ({ id: p.id, label: p.label })),
        frameLabel: "Say it to a partner",
        frame: REHEARSAL_FRAME,
      },
      start: {
        heading: "Start here online",
        text: "One link opens the tour, the exploration, the lesson and the Site Guide:",
        link: link("The Language Page: Start Here", ENTRANCE.route),
        qrAlt: `QR code for ${ENTRANCE.short}, the teacher starting page.`,
      },
    },
    page2: {
      heading: "Featured Lesson: Speak, Write, Improve",
      topic: lesson.title.split(":")[0],
      minutes: stepMinutes,
      objective: lesson.objective,
      prompt: lesson.prompt,
      frame: lesson.frame,
      steps: lesson.steps.map((s, i) => ({
        n: i + 1,
        id: s.id,
        name: s.name,
        minutes: s.minutes,
        direction: s.teacher,
      })),
      sample: {
        firstLabel: "First response",
        first: lesson.sample.first,
        improvedLabel: "Improved response",
        improved: lesson.sample.improved,
        note: lesson.sample.explanation,
      },
      cue: lesson.cue,
      check: cap(lesson.check.replace(/^Quick check:\s*/, "")),
      followUp: cap(lesson.followUp.replace(/^Next day:\s*/, "")),
      supports: [lesson.supports.more, lesson.supports.some, lesson.supports.independent].map(
        (s) => ({
          name: s.name,
          items: s.items,
        }),
      ),
      homeLanguage: lesson.notes[0],
      fade: "Supports fade; the task stays the same.",
      fadeDetail: lesson.notes[1].replace(/^Supports fade; the task stays the same\.\s*/, ""),
      noMic: lesson.notes[2],
      links: {
        activity: {
          ...link(`${anchor.name} (the lesson picture and Step 3)`, anchor.route),
          label: "Open the activity",
        },
        lesson: { ...link("Featured Lesson page", ROUTES.lesson), label: "Open the lesson page" },
        siteGuide: link("Site Guide", ROUTES.siteGuide),
      },
    },
  };
}

/** Every URL a printed copy must carry, in a stable order (the PDF link check and the DOCX hyperlink check read this). */
export function guideUrls(model = buildGuideModel()) {
  const { page1, page2 } = model;
  return [
    page1.start.link.url,
    ...page1.pathways.flatMap((p) => p.activities.map((a) => a.link.url)),
    page2.links.activity.url,
    page2.links.lesson.url,
    page2.links.siteGuide.url,
  ];
}
