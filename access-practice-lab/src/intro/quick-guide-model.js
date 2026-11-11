// The Quick Guide as ONE content model per grade choice. The on-screen page (/start/guide), the PDF and the Word file
// are all built from buildGuideModel(pick), so a title, a time, a link or a support cannot differ between them. Page 1
// lists the grade's four activities (explore-bands.js); page 2 is the grade's Featured Lesson (lesson-bands.js).
// Pure: no DOM, so scripts/generate-intro-guide.mjs imports it in Node.
import {
  DOWNLOADS,
  ENTRANCE,
  PLANNING_PROMPTS,
  REHEARSAL_FRAME,
  ROUTES,
  SITE,
  absUrl,
  shortUrl,
} from "./data.js";
import { EXPLORE_STEPS, exploreActivities } from "./explore-bands.js";
import { lessonFor } from "./lesson-bands.js";
import { DEFAULT_PICK, gradeName, isPick, printFiles } from "./quick-guide-files.js";

const fileList = (files) => [
  { id: "guide", name: "Quick Guide (2 pages)", ...files.quickGuide },
  { id: "lesson", name: "Featured Lesson backup (2 pages)", ...files.lessonBackup },
  { id: "activities", name: "Activity Guide", ...files.activityGuide },
  { id: "directory", name: "Site Directory (appendix)", ...files.directory },
];

/** Files the page links to, per grade choice. Hrefs come from quick-guide-files.js; names never contain "teacher". */
export const GUIDE_FILES = {
  qrStart: "/access-practice-lab/guides/qr-start.svg",
  downloads: fileList(printFiles(DEFAULT_PICK)),
};
export const guideFiles = (pick) => ({ ...GUIDE_FILES, downloads: fileList(printFiles(pick)) });

/** An on-screen link that keeps the grade choice in the address, whatever this device remembered. */
export const gradesRoute = (route, pick) =>
  `${route}${route.includes("?") ? "&" : "?"}grades=${encodeURIComponent(pick)}`;

/** A printed teacher page route that opens at a grade choice (Grades 6–8 keeps the plain route). */
export const pickRoute = (route, pick) =>
  pick === DEFAULT_PICK ? route : `${route}?grades=${encodeURIComponent(pick)}`;

/** The two checkpoints that are stored on the device (checkbox ids and planning field ids). */
export const GUIDE_STORE_KEY = "guide";

export const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const link = (text, route) => ({ text, route, url: absUrl(route), short: shortUrl(route) });
/** Every web address on page 1 starts with this; the activity rows print only what follows it (route), once-stated. */
export const ADDRESS_PREFIX = shortUrl("");

/** The printed address leaves out ?grades= (the activity itself opens without it); the link keeps it. */
const shownRoute = (route) => route.replace(/([?&])grades=[^&]*&?/, "$1").replace(/[?&]$/, "");

const activityRow = (a) => ({
  id: a.id,
  name: a.name,
  tryNow: a.tryNow,
  classroomUse: a.classroomUse,
  link: { ...link(a.name, a.route), shown: shownRoute(a.route) },
});

export function buildGuideModel(pick = DEFAULT_PICK) {
  const id = isPick(pick) ? pick : DEFAULT_PICK;
  const lesson = lessonFor(id);
  const files = printFiles(id);
  const grade = gradeName(id);
  const stepMinutes = lesson.steps.reduce((sum, s) => sum + s.minutes, 0);
  return {
    title: `Quick Guide: ${grade}`,
    siteName: "The Language Page",
    pick: id,
    grade,
    lang: "en-US",
    page1: {
      heading: `Your 20-Minute Exploration, ${grade}`,
      startHere:
        "Choose one domain, try its activity as a learner, then plan how you will use it. Timing is advice; tick each activity you try.",
      addressNote: `Web addresses below begin with ${ADDRESS_PREFIX}`,
      sequence: EXPLORE_STEPS.map((s) => ({
        range: `${s.range} min`,
        name: s.name,
        detail: s.detail,
      })),
      pathways: exploreActivities(id).map((a) => ({
        id: a.domain.id,
        icon: a.domain.icon,
        name: a.domain.name,
        blurb: a.domain.purpose,
        activities: [activityRow(a)],
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
        more: {
          text: "How to use each activity, and every activity on the site:",
          links: [
            link("Activity Guide", files.activityGuide.pdf.replace(SITE.base, "")),
            link("Site Directory", DOWNLOADS.directory.pdf.replace(SITE.base, "")),
          ],
        },
      },
    },
    page2: {
      heading: `Featured Lesson: ${lesson.title.split(": ")[1]}`,
      topic: lesson.topic,
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
          ...link(`${lesson.anchor.name} (the lesson picture)`, lesson.anchor.route),
          label: "Open the activity",
        },
        lesson: {
          ...link("Featured Lesson page", pickRoute(ROUTES.lesson, id)),
          label: "Open the lesson page",
        },
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
    ...page1.start.more.links.map((l) => l.url),
    ...page1.pathways.flatMap((p) => p.activities.map((a) => a.link.url)),
    page2.links.activity.url,
    page2.links.lesson.url,
    page2.links.siteGuide.url,
  ];
}
