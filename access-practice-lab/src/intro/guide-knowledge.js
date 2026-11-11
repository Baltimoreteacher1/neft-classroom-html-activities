// What Mr. Neft, the Language Page guide, knows. Two uses, one source:
//   - QUICK answers: the question buttons on the tour, the Start overview and the family page. Authored text only,
//     shown instantly with no network call.
//   - guideContext(): the facts the AI guide (/api/language-guide) is given, so a typed question is answered from
//     the same verified data and not from the model's imagination.
// Pure data and string helpers (no DOM): the Pages Function imports this file.
import { CAN, CANNOT, FACTS, LOOP, ROUTES, absUrl } from "./data.js";
import { FAQ } from "./site-guide-more.js";
import { BAND_TOUR, DOMAINS, tourActivities } from "./tour-bands.js";

export const GUIDE = { name: "Mr. Neft", role: "Your Language Page guide" };

/** The one sentence that says what the site is (footer wording). */
export const ABOUT =
  "The Language Page is classroom practice in listening, speaking, reading and writing for multilingual learners from kindergarten to grade 8.";

const faq = (id) => FAQ.find((f) => f.id === id);
const faqText = (id, lang = "en") => faq(id)?.a?.[lang] || "";

/**
 * The quick questions. Each has a stable id, the question in EN and ES, and either a fixed answer or a function of
 * the activity on screen. Answers never claim more than data.js, tour-bands.js and the Site Guide FAQ say.
 */
export const QUICK = {
  what: {
    q: ["What is this site?", "¿Qué es este sitio?"],
    a: () => [
      `${ABOUT} Students choose how much help they want, and the feedback says what to improve, never a score.`,
      "The Language Page es práctica escolar de escuchar, hablar, leer y escribir para estudiantes multilingües de kínder a 8.º grado. Cada estudiante elige cuánta ayuda quiere, y la retroalimentación dice qué mejorar, nunca da una calificación.",
    ],
  },
  account: {
    q: ["Do I need an account?", "¿Necesito una cuenta?"],
    a: () => [faqText("account"), faqText("account", "es")],
  },
  mic: {
    q: ["Do I need a microphone?", "¿Necesito un micrófono?"],
    a: () => [faqText("mic"), faqText("mic", "es")],
  },
  saved: {
    q: ["Where is work saved?", "¿Dónde se guarda el trabajo?"],
    a: () => [faqText("saved"), faqText("saved", "es")],
  },
  sound: {
    q: ["What if sound does not play?", "¿Y si no se oye el sonido?"],
    a: () => [faqText("sound"), faqText("sound", "es")],
  },
  scored: {
    q: ["Is this scored?", "¿Esto se califica?"],
    a: () => [
      "No. It is practice. The feedback names what to improve, but it never gives a score, a grade, a WIDA level or an ACCESS prediction.",
      "No. Es práctica. La retroalimentación dice qué mejorar, pero nunca da una calificación, una nota, un nivel de WIDA ni una predicción de ACCESS.",
    ],
  },
  share: {
    q: ["How do I share an activity?", "¿Cómo comparto una actividad?"],
    a: () => [faqText("share"), faqText("share", "es")],
  },
  language: {
    q: ["Can directions be in Spanish?", "¿Las instrucciones pueden estar en español?"],
    a: () => [faqText("language"), faqText("language", "es")],
  },
  time: {
    q: ["How long does the tour take?", "¿Cuánto dura el recorrido?"],
    a: () => [
      "About 20 minutes: four short activities, one for each language domain, then a plan for one class. Your place is saved on this device, so you can stop and come back.",
      "Unos 20 minutos: cuatro actividades cortas, una por cada destreza, y luego un plan para una clase. Su lugar se guarda en este dispositivo, así que pueden parar y volver.",
    ],
  },
  students: {
    q: ["What do students do here?", "¿Qué hacen aquí los estudiantes?"],
    a: (act) => (act ? [act.students, ""] : ["", ""]),
  },
  use: {
    q: ["How would I use this in class?", "¿Cómo lo usaría en clase?"],
    a: (act) => (act ? [act.use, ""] : ["", ""]),
  },
  notice: {
    q: ["What should I notice?", "¿En qué debo fijarme?"],
    a: (act) => (act ? [act.notice, ""] : ["", ""]),
  },
  families: {
    q: ["How do families practice at home?", "¿Cómo practican las familias en casa?"],
    a: () => [
      `Send families one link: ${absUrl(ROUTES.together)}. They choose their child’s grade, then Let’s Talk or Let’s Write, in English or Spanish, for 5 to 10 minutes.`,
      `Envíen a las familias un enlace: ${absUrl(ROUTES.together)}. Eligen el grado de su hijo o hija y luego «Hablemos» o «Escribamos», en inglés o en español, de 5 a 10 minutos.`,
    ],
  },
};

/** The answer to a quick question in a language ("en" | "es"), English when no Spanish exists. */
export function quickAnswer(id, act, lang = "en") {
  const entry = QUICK[id];
  if (!entry) return "";
  const [en, es] = entry.a(act);
  return lang === "es" && es ? es : en;
}

const line = (s) => `- ${s}`;

/**
 * Plain-text facts for the AI guide: what the site is, the rules it keeps, the four domains, the activity for each
 * domain at the chosen grade (and the activity titles at the others), and the Site Guide's help answers.
 * `pick` is a GRADE_PICKS id; `page` names where the question was asked.
 */
export function guideContext({ pick = "6-8", page = "tour", step = "" } = {}) {
  const parts = [];
  parts.push(`ABOUT: ${ABOUT}`);
  parts.push(
    `PAGE: The person is on the ${page} page${step ? `, at the "${step}" step` : ""}. Grade choice: ${pick}.`,
  );
  parts.push(["HOW EVERY ACTIVITY WORKS:", ...LOOP.map(([h, t]) => line(`${h}: ${t}`))].join("\n"));
  parts.push(["WHAT THE FEEDBACK CAN DO:", ...CAN.map(line)].join("\n"));
  parts.push(["WHAT IT CANNOT DO:", ...CANNOT.map(line)].join("\n"));
  parts.push(["FACTS:", ...Object.values(FACTS).map(line)].join("\n"));
  parts.push(
    ["DOMAINS:", ...DOMAINS.map((d) => line(`${d.name} (${d.studio}): ${d.purpose}`))].join("\n"),
  );
  const band = BAND_TOUR[pick];
  if (band) {
    const acts = tourActivities(pick).map((a) =>
      [
        `${a.domain.name}: "${a.title}" (${a.level}, about ${a.minutes} min). Link: ${absUrl(a.route.split("?")[0])}`,
        `  Students: ${a.students}`,
        `  Try it: ${a.steps.join(" ")}`,
        `  Notice: ${a.notice}`,
        `  Classroom use: ${a.use}`,
      ].join("\n"),
    );
    parts.push(
      [`ACTIVITIES FOR ${pick}:`, band.adult ? `  ${band.adult}` : "", ...acts]
        .filter(Boolean)
        .join("\n"),
    );
  }
  const others = Object.keys(BAND_TOUR)
    .filter((p) => p !== pick)
    .map((p) =>
      line(
        `${p}: ${tourActivities(p)
          .map((a) => `${a.domain.name} "${a.title}"`)
          .join(", ")}`,
      ),
    );
  parts.push(["OTHER GRADES:", ...others].join("\n"));
  parts.push(["HELP ANSWERS:", ...FAQ.map((f) => line(`${f.q.en} ${f.a.en}`))].join("\n"));
  parts.push(
    [
      "TEACHER PAGES:",
      line(`Start here: ${absUrl(ROUTES.start)}`),
      line(`Guided Tour: ${absUrl(ROUTES.tour)}`),
      line(`Activity Guide: ${absUrl(ROUTES.activities)}`),
      line(`Quick Guide (printable): ${absUrl(ROUTES.guide)}`),
      line(`Site Guide (every part of the site, with search): ${absUrl(ROUTES.siteGuide)}`),
      line(`Family page, English and Spanish: ${absUrl(ROUTES.together)}`),
    ].join("\n"),
  );
  return parts.join("\n\n");
}

/** The instructions the AI guide follows. Kept here so the rules are read and tested with the facts they govern. */
export const GUIDE_RULES = [
  `You are ${GUIDE.name}, the friendly guide of The Language Page. You help teachers and families understand the site and use it with students.`,
  "Answer only from the FACTS below. If the facts do not answer the question, say you are not sure and suggest the Site Guide. Never invent a feature, a button, a page, a number or a research claim.",
  "Never say the site gives scores, grades, WIDA levels, ACCESS predictions or proficiency results. It does not.",
  "Do not ask for, repeat or store a student's name or personal details. If someone shares them, do not use them.",
  "Keep answers short: at most 90 words, plain language, warm and direct, no lists longer than four items, no markdown headings.",
  "When a link helps, give the full https link exactly as written in the facts.",
  "Reply in Spanish when the question is in Spanish or the language is es, using ustedes for families. Otherwise reply in English.",
].join("\n");
