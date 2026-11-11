// The Featured Lesson backup as ONE content model per grade choice, for the printed PDF and Word file. Page 1 is for
// students and carries no teacher guidance; page 2 is for the teacher. Read from lesson-bands.js (which keeps Grades
// 6–8 on FEATURED_LESSON and USE_LESSON in data.js) and ENTRANCE only.
// Pure: no DOM, so scripts/generate-intro-guide.mjs imports it in Node.
import { ENTRANCE, absUrl, shortUrl } from "./data.js";
import { lessonFor } from "./lesson-bands.js";
import { DEFAULT_PICK } from "./quick-guide-files.js";
import { cap } from "./quick-guide-model.js";

export function buildBackupModel(pick = DEFAULT_PICK) {
  const lesson = lessonFor(pick);
  const use = lesson.use;
  return {
    title: `${lesson.title} (backup copy, ${lesson.grade})`,
    pick: lesson.pick,
    grade: lesson.grade,
    lang: "en-US",
    student: {
      heading: lesson.topic,
      subheading: `${lesson.label}: ${lesson.title.split(": ")[1]}`,
      picture: lesson.picture,
      promptLabel: "Your task",
      prompt: lesson.prompt,
      frameLabel: "Sentence frame",
      frame: lesson.frame,
      directionsLabel: "What to do",
      directions: use.studentDirections,
      materialsLabel: "You need",
      materials: use.materials,
      time: use.time,
      writing: use.writing,
      link: {
        text: "Online activity",
        url: absUrl(use.studentRoute),
        short: shortUrl(use.studentRoute),
      },
    },
    teacher: {
      grade: lesson.grade,
      heading: `Teacher page: ${lesson.topic} (${lesson.grade})`,
      intro: `Use this page if the live activity will not load. Hand out page 1 and teach the same ${lesson.minutes} minutes.`,
      objectiveLabel: "Objective",
      objective: lesson.objective,
      steps: lesson.steps.map((s, i) => ({
        n: i + 1,
        name: s.name,
        minutes: s.minutes,
        direction: s.teacher,
      })),
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
      supports: [lesson.supports.more, lesson.supports.some, lesson.supports.independent].map(
        (s) => ({
          name: s.name,
          items: s.items,
        }),
      ),
      notes: lesson.notes,
      entrance: { text: "All activities and handouts", url: ENTRANCE.url, short: ENTRANCE.short },
    },
  };
}
