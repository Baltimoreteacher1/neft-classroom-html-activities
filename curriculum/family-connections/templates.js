const SITE_ORIGIN = "https://eduwonderlab.com";
const REVIEW_PURPOSES = new Set([
  "missing-work",
  "learning-check-in",
  "conference",
]);

export const LANGUAGES = Object.freeze([
  { id: "plain", label: "Plain-language English" },
  { id: "english", label: "Warm professional English" },
  { id: "bilingual", label: "English + reviewed Spanish support" },
]);

export const PURPOSES = Object.freeze({
  celebration: {
    label: "Celebrate progress",
    category: "positive",
    subject: "A positive update about {student}",
    opening: "I wanted to share a positive update about {student}.",
    plainOpening: "I have good news to share about {student}.",
    action:
      "Please ask {student} to show or explain one thing that feels stronger now.",
    familyRole: "A short word of encouragement would mean a lot.",
    spanish:
      "Quería compartir una noticia positiva sobre {student}. Pregúntele qué se siente más fácil ahora. Unas palabras de ánimo significarían mucho.",
  },
  "learning-check-in": {
    label: "Learning check-in",
    category: "support",
    subject: "Working together to support {student}",
    opening:
      "I am checking in because {student} is still building confidence with this learning goal.",
    plainOpening:
      "I am writing because {student} needs more support with this skill.",
    action:
      "Please ask {student} to show one example, then reply with one question or one part that felt difficult.",
    familyRole:
      "You do not need to teach the math. Listening and sharing one question will help me plan the next step.",
    spanish:
      "Le escribo porque {student} todavía está desarrollando confianza con esta destreza. No necesita enseñar las matemáticas. Escuchar y compartir una pregunta me ayudará a planificar el próximo paso.",
  },
  "missing-work": {
    label: "Reconnect with missing work",
    category: "concern",
    subject: "A manageable next step for {student}",
    opening:
      "I would like to help {student} reconnect with an assignment that is not yet complete.",
    plainOpening:
      "{student} has work that is not finished yet. I want to make the next step clear and manageable.",
    action:
      "Please help {student} choose a short work time and complete the next required part. If the work feels confusing, send me the question instead of pushing through frustration.",
    familyRole:
      "The goal is a calm restart, not finishing everything at once.",
    spanish:
      "{student} tiene trabajo que todavía no está completo. La meta es comenzar de nuevo con calma, no terminar todo de una vez. Si algo no está claro, envíeme la pregunta.",
  },
  homework: {
    label: "Launch family homework",
    category: "support",
    subject: "Tonight's family learning connection for {student}",
    opening:
      "Tonight's short family connection gives {student} a chance to explain and practice today's learning.",
    plainOpening:
      "Here is a short activity for {student} to do with a family member or trusted adult.",
    action:
      "Please listen to one explanation and ask, “How do you know?” Correctness will be checked at school.",
    familyRole:
      "An adult, older sibling, mentor, or after-school staff member can participate.",
    spanish:
      "Aquí hay una actividad corta para hacer con un familiar o adulto de confianza. Escuche una explicación y pregunte: «¿Cómo lo sabes?». Revisaremos las respuestas en la escuela.",
  },
  conference: {
    label: "Invite a family conversation",
    category: "concern",
    subject: "A conversation to support {student}",
    opening:
      "I would value a short conversation so we can coordinate support for {student}.",
    plainOpening:
      "I would like to talk with you about ways we can help {student}.",
    action:
      "Please reply with a day or time that works for you and whether phone, video, or email is easiest.",
    familyRole:
      "Your perspective will help us choose a realistic next step together.",
    spanish:
      "Me gustaría conversar brevemente sobre cómo podemos apoyar a {student}. Responda con un día u hora conveniente y si prefiere teléfono, video o correo electrónico.",
  },
  "weekly-update": {
    label: "Send a weekly update",
    category: "positive",
    subject: "This week in math: a family update",
    opening:
      "This week, our class is building understanding through practice, discussion, and explanation.",
    plainOpening:
      "Here is what our class is learning this week.",
    action:
      "Ask {student} to name one strategy, example, or question from class.",
    familyRole:
      "You can use the linked support to review together without needing an answer key.",
    spanish:
      "Esta semana la clase está aprendiendo con práctica, conversación y explicaciones. Pregúntele a {student} por una estrategia, un ejemplo o una pregunta de la clase.",
  },
});

export const GLOBAL_RESOURCES = Object.freeze([
  {
    id: "family-mode",
    kind: "family-support",
    label: "Curriculum Family Mode",
    description:
      "Choose “I am a family member” for lesson help, vocabulary, review, and family-ready directions.",
    url: "/curriculum/#top1-start-here",
    tags: "family help lesson vocabulary review",
  },
  {
    id: "ai-parent-guide",
    kind: "ai-support",
    label: "AI Learning Hub · Parent Guide",
    description:
      "Responsible ways families can use AI as a step-by-step tutor without asking it to do the work.",
    url: "/curriculum/ai-hub/#parents",
    tags: "ai parent tutor responsible support",
  },
  {
    id: "math-workbench",
    kind: "learning-tool",
    label: "Math Workbench",
    description:
      "A shared scratch space with drawing, number tiles, models, shapes, and formulas.",
    url: "/curriculum/math-workbench/",
    tags: "math model draw visual formula practice",
  },
  {
    id: "student-mailbox",
    kind: "student-voice",
    label: "Student Digital Mailbox",
    description:
      "A safe route for students to share questions, confusion, ideas, and class feedback.",
    url: "/curriculum/student-digital-mailbox/",
    tags: "student question feedback help voice",
  },
  {
    id: "curriculum-hub",
    kind: "curriculum",
    label: "Grade 6 Curriculum Hub",
    description:
      "Every lesson, notes packet, practice resource, and family homework link organized by unit.",
    url: "/curriculum/",
    tags: "curriculum lesson notes homework unit",
  },
]);

export const ENGAGEMENT_ROUTINES = Object.freeze([
  {
    id: "relay",
    title: "Home-to-Class Relay",
    time: "5–8 minutes",
    familyRole: "Contributor",
    directions:
      "The student asks for one estimate, example, story, or question connected to the lesson.",
    classroomReturn:
      "The student brings the contribution back as an ingredient in the next class discussion.",
    schoolAlternative:
      "A classmate, trusted staff member, or teacher provides the contribution at school.",
    messagePurpose: "homework",
  },
  {
    id: "interview",
    title: "Family Interview",
    time: "5 minutes",
    familyRole: "Expert",
    directions:
      "The student asks where the family member uses numbers, comparison, measurement, data, or patterns in real life.",
    classroomReturn:
      "The student returns with one quote or paraphrased example to connect to the lesson.",
    schoolAlternative:
      "Interview an adult at school or use a teacher-provided community example.",
    messagePurpose: "homework",
  },
  {
    id: "explain-back",
    title: "Explain-It-Back",
    time: "4 minutes",
    familyRole: "Listener",
    directions:
      "The student explains one strategy. The listener responds with “clear,” “almost,” or “one question.”",
    classroomReturn:
      "The student brings back the listener's one question; correctness is checked in class.",
    schoolAlternative:
      "Explain to a partner, record a private rehearsal, or use the student-help page.",
    messagePurpose: "learning-check-in",
  },
  {
    id: "math-hunt",
    title: "Real-Life Math Hunt",
    time: "5–10 minutes",
    familyRole: "Co-investigator",
    directions:
      "Find one safe household or community example of the current skill and describe it with words or a sketch.",
    classroomReturn:
      "The description becomes an example the class can sort, model, or discuss.",
    schoolAlternative:
      "Use a classroom object, school map, menu, schedule, or teacher-provided image.",
    messagePurpose: "homework",
  },
  {
    id: "confidence",
    title: "Confidence Check",
    time: "3 minutes",
    familyRole: "Coach",
    directions:
      "Student and family choose: ready, almost, or need a new explanation. Then choose one support to try next.",
    classroomReturn:
      "The student privately shares the chosen support with the teacher.",
    schoolAlternative:
      "Complete the same check with the teacher during arrival or independent work.",
    messagePurpose: "learning-check-in",
  },
  {
    id: "celebration",
    title: "Celebration Snapshot",
    time: "3 minutes",
    familyRole: "Encourager",
    directions:
      "The student names one improvement. The family member adds one encouraging sentence or question.",
    classroomReturn:
      "The student sets one next goal without publicly sharing private family comments.",
    schoolAlternative:
      "Write the celebration to a future self or share it privately with a trusted adult at school.",
    messagePurpose: "celebration",
  },
]);

export function absoluteEduWonderUrl(path) {
  const url = new URL(String(path || "/"), SITE_ORIGIN);
  return url.origin === SITE_ORIGIN ? url.href : SITE_ORIGIN;
}

export function messageRequiresReview(purpose) {
  return REVIEW_PURPOSES.has(purpose);
}

export function buildOutlookUrl({ subject = "", body = "" }) {
  const url = new URL("https://outlook.office.com/mail/deeplink/compose");
  url.searchParams.set("subject", subject);
  url.searchParams.set("body", body);
  return url.href;
}

export function getLessonResources(lesson = {}) {
  const id = validLessonId(lesson.id) ? lesson.id : "";
  if (!id) return [];
  const resources = lesson.resources || {};
  const result = [
    {
      kind: "family-homework",
      label: "Family Homework",
      url: resourcePath(resources.homework, `/lessons/${id}/homework.html`),
    },
  ];
  const optional = [
    ["familyPage", "family-support", "Family Support Page"],
    ["lesson", "interactive-lesson", "Interactive Lesson"],
    ["guidedNotes", "guided-notes", "Guided Notes"],
    ["studentHelp", "student-help", "Student Help"],
  ];
  optional.forEach(([key, kind, label]) => {
    if (resources[key]?.exists && resources[key]?.path) {
      result.push({ kind, label, url: resources[key].path });
    }
  });
  return uniqueByUrl(result);
}

export function normalizeLessons(manifest) {
  const lessons = Array.isArray(manifest?.lessons) ? manifest.lessons : [];
  const standardIds = new Set(
    lessons.filter((lesson) => !lesson.flagship).map((lesson) => lesson.id),
  );
  return lessons
    .filter((lesson) => {
      if (!validLessonId(lesson.id)) return false;
      if (!lesson.flagship) return true;
      return !standardIds.has(lesson.id.replace(/-flagship$/, ""));
    })
    .map((lesson) => ({
      ...lesson,
      label: `Lesson ${lesson.id.replace("-flagship", "")} · ${lesson.title}`,
      familyResources: getLessonResources(lesson),
    }))
    .sort(
      (a, b) =>
        Number(a.unit) - Number(b.unit) ||
        Number(a.lesson) - Number(b.lesson) ||
        a.id.localeCompare(b.id),
    );
}

export function composeMessage(input = {}) {
  const purposeId = PURPOSES[input.purpose] ? input.purpose : "celebration";
  const template = PURPOSES[purposeId];
  const student = clean(input.student, 40) || "your student";
  const classLabel = clean(input.classLabel, 40);
  const lessonLabel = clean(input.lessonLabel, 100);
  const dueDate = clean(input.dueDate, 40);
  const context = clean(input.context, 500);
  const language = LANGUAGES.some((item) => item.id === input.language)
    ? input.language
    : "plain";
  const subject = fill(template.subject, student);
  const lines = [
    fill(language === "plain" ? template.plainOpening : template.opening, student),
  ];

  if (classLabel || lessonLabel) {
    lines.push(
      `Learning focus: ${[classLabel, lessonLabel].filter(Boolean).join(" · ")}.`,
    );
  }
  if (context) lines.push(`What I am seeing: ${context}`);
  if (dueDate) lines.push(`Suggested next check-in: ${dueDate}.`);
  lines.push(fill(template.action, student), fill(template.familyRole, student));

  const resource = normalizeResource(input.resource);
  if (resource) {
    lines.push(
      `Helpful resource: ${resource.label}\n${absoluteEduWonderUrl(resource.url)}`,
    );
  }
  if (language === "bilingual") {
    lines.push(
      `Español (mensaje base revisado):\n${fill(template.spanish, student)}`,
    );
    if (context) {
      lines.push(
        "Nota para el maestro: revise o traduzca el detalle personalizado antes de enviar.",
      );
    }
  }
  lines.push("Thank you for partnering with me,\nMr. Neft");

  return {
    subject,
    body: lines.filter(Boolean).join("\n\n"),
    requiresReview: messageRequiresReview(purposeId),
    category: template.category,
  };
}

export function sanitizePlannerItem(item = {}) {
  const nextDate = /^\d{4}-\d{2}-\d{2}$/.test(String(item.nextDate || ""))
    ? String(item.nextDate)
    : "";
  return {
    id: clean(item.id, 80) || `plan-${Date.now()}`,
    student: clean(item.student, 40),
    purpose: PURPOSES[item.purpose] ? item.purpose : "celebration",
    nextDate,
    note: clean(item.note, 240),
    completed: Boolean(item.completed),
  };
}

function fill(text, student) {
  return String(text || "").replaceAll("{student}", student);
}

function clean(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validLessonId(id) {
  return /^\d{1,2}-\d{1,2}(?:-flagship)?$/.test(String(id || ""));
}

function resourcePath(resource, fallback) {
  return resource?.exists && resource?.path ? resource.path : fallback;
}

function normalizeResource(resource) {
  if (!resource?.label || !resource?.url) return null;
  return {
    label: clean(resource.label, 80),
    url: absoluteEduWonderUrl(resource.url),
  };
}

function uniqueByUrl(resources) {
  const seen = new Set();
  return resources.filter((resource) => {
    if (seen.has(resource.url)) return false;
    seen.add(resource.url);
    return true;
  });
}
