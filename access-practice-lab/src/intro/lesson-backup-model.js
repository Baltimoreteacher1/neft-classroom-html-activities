// The Featured Lesson backup as ONE content model for the printed PDF and Word file. Page 1 is for students and carries
// no teacher guidance; page 2 is for the teacher. Read from data.js (FEATURED_LESSON, USE_LESSON, ENTRANCE) only.
// Pure: no DOM, so scripts/generate-intro-guide.mjs imports it in Node.
import { ENTRANCE, FEATURED_LESSON, USE_LESSON, absUrl, shortUrl } from "./data.js";
import { cap } from "./quick-guide-model.js";

export function buildBackupModel() {
  const lesson = FEATURED_LESSON;
  return {
    title: `${lesson.title} (backup copy)`,
    lang: "en-US",
    student: {
      heading: lesson.title.split(":")[0],
      subheading: `${lesson.label}: Speak, Write, Improve`,
      picture: lesson.picture,
      promptLabel: "Your task",
      prompt: lesson.prompt,
      frameLabel: "Sentence frame",
      frame: lesson.frame,
      directionsLabel: "What to do",
      directions: USE_LESSON.studentDirections,
      materialsLabel: "You need",
      materials: USE_LESSON.materials,
      time: USE_LESSON.time,
      writing: [
        { id: "first", label: "My first response", lines: 4 },
        { id: "revised", label: "My improved response", lines: 6 },
      ],
      link: { text: "Online activity", url: absUrl(USE_LESSON.studentRoute), short: shortUrl(USE_LESSON.studentRoute) },
    },
    teacher: {
      heading: "Teacher page: Safer Hallways",
      intro: `Use this page if the live activity will not load. Hand out page 1 and teach the same ${lesson.minutes} minutes.`,
      objectiveLabel: "Objective",
      objective: lesson.objective,
      steps: lesson.steps.map((s, i) => ({ n: i + 1, name: s.name, minutes: s.minutes, direction: s.teacher })),
      sample: {
        firstLabel: "Example first response",
        first: lesson.sample.first,
        improvedLabel: "Example improved response",
        improved: lesson.sample.improved,
        note: lesson.sample.explanation,
      },
      cue: lesson.cue,
      check: cap(lesson.check.replace(/^Quick check:\s*/, "")),
      followUp: cap(lesson.followUp.replace(/^Next day:\s*/, "")),
      supports: [lesson.supports.more, lesson.supports.some, lesson.supports.independent].map((s) => ({
        name: s.name,
        items: s.items,
      })),
      notes: lesson.notes,
      entrance: { text: "All activities and handouts", url: ENTRANCE.url, short: ENTRANCE.short },
    },
  };
}
