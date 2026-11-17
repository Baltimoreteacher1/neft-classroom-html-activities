// Toolkit: plain-language resources around the scores. A grid of cards; each opens one tool: what the levels mean
// (English/Spanish), words to know, talking with families (English/Spanish), a student conference sheet, the
// practice library by domain and grade band, the testing year at a glance, official WIDA links and templates.
// Every tool prints cleanly on its own.
import { activitiesFor } from "./practice.js";
import { h, table } from "./dom.js";
import { TEMPLATE } from "./import.js";
import { levelName } from "./interpret.js";
import { recordsOf } from "./records.js";
import { DOMAINS, SOURCES } from "./rules.js";
import { renderGoalForm } from "./view-goals.js";
import { studentPicker, subnav } from "./view-common.js";

const LEVELS = [
  {
    n: 1,
    en: [
      "Entering",
      "Uses pictures, gestures and single words; understands with lots of visual support.",
    ],
    es: ["Entrada", "Usa imágenes, gestos y palabras sueltas; entiende con mucho apoyo visual."],
  },
  {
    n: 2,
    en: ["Emerging", "Uses short phrases and simple sentences about familiar topics."],
    es: ["Emergente", "Usa frases cortas y oraciones simples sobre temas conocidos."],
  },
  {
    n: 3,
    en: ["Developing", "Describes, sequences and gives reasons in connected sentences."],
    es: ["En desarrollo", "Describe, ordena y da razones con oraciones conectadas."],
  },
  {
    n: 4,
    en: ["Expanding", "Explains and uses evidence with more detail and academic words."],
    es: ["En expansión", "Explica y usa evidencia con más detalle y palabras académicas."],
  },
  {
    n: 5,
    en: ["Bridging", "Uses academic English close to grade-level peers in most tasks."],
    es: [
      "Puente",
      "Usa inglés académico cercano al de sus compañeros en la mayoría de las tareas.",
    ],
  },
  {
    n: 6,
    en: ["Reaching", "Uses English across content areas like grade-level peers."],
    es: ["Alcance", "Usa el inglés en todas las materias como sus compañeros de grado."],
  },
];

const GLOSSARY = [
  ["Domain", "One of the four language skills: Listening, Speaking, Reading, Writing."],
  [
    "Proficiency level",
    "A number from 1.0 to 6.0 that describes where language is right now. The decimal shows how far into the level.",
  ],
  [
    "Scale score",
    "The test's own score number. It is what WIDA turns into a level. Compare scale scores only on the same scale.",
  ],
  [
    "Composite",
    "A combined score: Oral Language, Literacy, Comprehension or Overall. Each weights domains differently.",
  ],
  [
    "Overall",
    "One summary of all four domains, weighted toward Reading and Writing. Read it with the domains, never instead of them.",
  ],
  [
    "Measurement error",
    "Every test score has some wobble. Small differences between two scores may be just that.",
  ],
  ["ACCESS", "WIDA's yearly English language test."],
  [
    "MODEL",
    "WIDA's shorter test that schools can give during the year, for example at enrollment.",
  ],
  [
    "Scale reset (2025-26)",
    "WIDA revised ACCESS in 2025-26 and started a new score scale. Older and newer scale scores are not compared.",
  ],
  [
    "Cut scores (2026)",
    "WIDA set new level boundaries in 2026. A level from before and after is not the same thing.",
  ],
  ["Concordance", "WIDA's table that estimates an ACCESS level from a MODEL Online score."],
  [
    "Forecast range",
    "A range where a next score is likely to fall, shown only when a model passed testing on students it had not seen.",
  ],
  ["Goal math", "The change per year needed to reach a goal. Arithmetic, not a prediction."],
];

const FAMILY = {
  en: {
    title: "Talking with families about English test results",
    open: [
      "Start with a strength: “In listening, your child can already…”",
      "Explain the test simply: “Every year your child takes an English test in listening, speaking, reading and writing.”",
      "Say what the number means: “Level 3 means your child can describe and give reasons in short connected sentences.”",
      "Share one next step and one way to help at home.",
    ],
    questions: [
      [
        "Is my child behind?",
        "Learning a new language takes years. The levels show progress, not a grade.",
      ],
      [
        "Should we speak only English at home?",
        "No. A strong home language helps English grow. Talk, read and tell stories in the language you know best.",
      ],
      [
        "When does my child leave the English program?",
        "Your state sets the rules. The school will tell you when your child meets them.",
      ],
    ],
    home: [
      "Talk every day about school, in any language.",
      "Ask your child to explain how to do something, step by step.",
      "Read together, or retell a story or video.",
      "Practice on The Language Page together (free, no account).",
    ],
  },
  es: {
    title: "Cómo hablar con las familias sobre los resultados de inglés",
    open: [
      "Empiecen con una fortaleza: “Al escuchar, su hijo o hija ya puede…”",
      "Expliquen la prueba con sencillez: “Cada año su hijo o hija toma una prueba de inglés para escuchar, hablar, leer y escribir.”",
      "Digan qué significa el número: “El nivel 3 significa que puede describir y dar razones con oraciones cortas conectadas.”",
      "Compartan un siguiente paso y una forma de ayudar en casa.",
    ],
    questions: [
      [
        "¿Mi hijo o hija está atrasado?",
        "Aprender un idioma nuevo toma años. Los niveles muestran progreso, no una calificación.",
      ],
      [
        "¿Debemos hablar solo inglés en casa?",
        "No. Un idioma de casa fuerte ayuda a crecer en inglés. Hablen, lean y cuenten historias en el idioma que mejor conocen.",
      ],
      [
        "¿Cuándo sale mi hijo o hija del programa de inglés?",
        "Su estado define las reglas. La escuela les avisará cuando su hijo o hija las cumpla.",
      ],
    ],
    home: [
      "Conversen todos los días sobre la escuela, en cualquier idioma.",
      "Pidan a su hijo o hija que explique cómo hacer algo, paso a paso.",
      "Lean juntos, o vuelvan a contar un cuento o un video.",
      "Practiquen juntos en The Language Page (gratis, sin cuenta).",
    ],
  },
};

const YEAR = [
  [
    "Start of year",
    "Enter last spring's ACCESS results. Look at each student's profile and set one goal together.",
  ],
  [
    "New students",
    "Use MODEL (or your state's screener) at enrollment. Enter the results here as MODEL Online or Paper.",
  ],
  [
    "Every 6-8 weeks",
    "Check Practice activity and Growth. Adjust temporary groups; they are never permanent.",
  ],
  [
    "Testing window",
    "ACCESS is given once a year; most states test in winter. Check your state's dates.",
  ],
  [
    "Score reports",
    "Enter the new results when reports arrive. The studio keeps different score versions apart for you.",
  ],
  ["Family conferences", "Print the family summary or the student view. Lead with strengths."],
];

const OFFICIAL = [
  ["ACCESS scores and reports", SOURCES.scores],
  ["What to know: WIDA assessments in 2025-2026", SOURCES.reset],
  ["WIDA ACCESS in 2025-26 (the revision)", SOURCES.revising],
  ["ACCESS standard setting 2026", SOURCES.standardSetting],
  ["MODEL and ACCESS concordance table", SOURCES.concordance],
  ["Using MODEL for instructional planning", SOURCES.concordanceUse],
];

const TOOLS = [
  [
    "goals",
    "Goal-setting form",
    "Pick a grade, skill and goal from drop-downs. Print, save as PDF or Word, for one student or the whole class.",
  ],
  ["levels", "What the levels mean", "Six levels in plain words, English and Spanish."],
  ["words", "Words to know", "Scale score, composite, cut scores and more, in one line each."],
  [
    "families",
    "Talking with families",
    "Opening lines, common questions and home ideas, English and Spanish.",
  ],
  ["conference", "Student conference sheet", "A one-page sheet: strengths, goal and plan."],
  [
    "library",
    "Practice library",
    "Every matching Language Page activity by domain and grade band.",
  ],
  ["year", "The testing year", "What to do when, from fall to score reports."],
  ["official", "Official WIDA links", "The sources the studio's rules come from."],
  ["templates", "Templates", "CSV import template and a blank score sheet."],
];

const printBtn = () =>
  h(
    "button",
    { type: "button", class: "btn small no-print", on: { click: () => window.print() } },
    "Print",
  );

function levelsTool(ws) {
  const lang = ws.sub.levelsLang || "en";
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "div",
      { class: "pi-row no-print" },
      subnav(
        ws,
        "levelsLang",
        [
          ["en", "English"],
          ["es", "Español"],
        ],
        lang,
      ),
      printBtn(),
    ),
    h(
      "article",
      { class: "pi-report", id: "piReport", lang },
      h(
        "h2",
        {},
        lang === "es" ? "Qué significan los niveles de inglés" : "What the English levels mean",
      ),
      h(
        "ol",
        { class: "pi-levels" },
        LEVELS.map((l) =>
          h(
            "li",
            { class: `pi-level-row is-l${l.n}` },
            h("span", { class: "pi-level-n" }, String(l.n)),
            h("div", {}, h("strong", {}, l[lang][0]), h("p", {}, l[lang][1])),
          ),
        ),
      ),
      h(
        "p",
        { class: "fine" },
        lang === "es"
          ? "Las descripciones son un resumen sencillo. Las escuelas usan los informes oficiales de WIDA."
          : "Plain-language summaries. Schools use WIDA's official score reports.",
      ),
    ),
  );
}

function familiesTool(ws) {
  const lang = ws.sub.familiesLang || "en";
  const T = FAMILY[lang];
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "div",
      { class: "pi-row no-print" },
      subnav(
        ws,
        "familiesLang",
        [
          ["en", "English"],
          ["es", "Español"],
        ],
        lang,
      ),
      printBtn(),
    ),
    h(
      "article",
      { class: "pi-report", id: "piReport", lang },
      h("h2", {}, T.title),
      h("h3", {}, lang === "es" ? "Para empezar" : "Opening the conversation"),
      h(
        "ol",
        {},
        T.open.map((x) => h("li", {}, x)),
      ),
      h("h3", {}, lang === "es" ? "Preguntas frecuentes" : "Questions families ask"),
      h(
        "dl",
        { class: "pi-faq" },
        T.questions.flatMap(([q, a]) => [h("dt", {}, q), h("dd", {}, a)]),
      ),
      h("h3", {}, lang === "es" ? "Ideas para la casa" : "Ideas for home"),
      h(
        "ul",
        {},
        T.home.map((x) => h("li", {}, x)),
      ),
      lang === "es"
        ? h(
            "p",
            { class: "fine no-print" },
            "Borrador en español; no revisado por un hablante nativo.",
          )
        : null,
    ),
  );
}

function conferenceTool(ws) {
  const st = ws.student();
  const rec = st ? recordsOf(st).at(-1) : null;
  const line = (label, value = "") =>
    h("div", { class: "pi-sheet-line" }, h("strong", {}, label), h("span", {}, value || " "));
  return h(
    "div",
    { class: "pi-stack" },
    ws.students.length ? studentPicker(ws) : null,
    h("div", { class: "pi-row no-print" }, printBtn()),
    h(
      "article",
      { class: "pi-report pi-sheet", id: "piReport" },
      h("h2", {}, `Student conference: ${st?.name || "________________"}`),
      rec
        ? h(
            "p",
            { class: "fine" },
            `Latest result: ${rec.assessmentType.replace("_", " ")} ${rec.academicYear}`,
          )
        : null,
      h(
        "table",
        { class: "pi-table" },
        h(
          "thead",
          {},
          h(
            "tr",
            {},
            ["Domain", "Level", "What I can do", "I will practice"].map((x) =>
              h("th", { scope: "col" }, x),
            ),
          ),
        ),
        h(
          "tbody",
          {},
          DOMAINS.map((d) =>
            h(
              "tr",
              {},
              h("th", { scope: "row" }, d),
              h(
                "td",
                {},
                rec?.domains[d].level != null
                  ? `${rec.domains[d].level.toFixed(1)} ${levelName(rec.domains[d].level)}`
                  : "",
              ),
              h("td", {}, ""),
              h("td", {}, ""),
            ),
          ),
        ),
      ),
      line("One thing I am proud of:"),
      line("My goal:", (ws.state.goals[st?.id] || []).at(-1)?.student || ""),
      line("How I will practice:"),
      line("How my teacher will help:"),
      line("How my family can help:"),
      line("We will check again on:"),
    ),
  );
}

function libraryTool(ws) {
  const band = ws.sub.libBand || "6-8";
  const bands = ["K", "1", "2-3", "3-5", "6-8"];
  return h(
    "div",
    { class: "pi-stack" },
    subnav(
      ws,
      "libBand",
      bands.map((b) => [b, b === "K" ? "K" : `Grades ${b}`]),
      band,
    ),
    h(
      "div",
      { class: "pi-practice-cols" },
      [...DOMAINS, "Vocabulary"].map((d) => {
        const all = [...activitiesFor(d, 2, band, 6), ...activitiesFor(d, 4, band, 6)].filter(
          (a, i, arr) => arr.findIndex((x) => x.id === a.id) === i,
        );
        return h(
          "section",
          { class: "pi-practice-col pi-card", "data-library": d },
          h("h4", {}, d === "Vocabulary" ? "Words" : d),
          h(
            "ul",
            {},
            all.map((a) =>
              h(
                "li",
                {},
                h("a", { href: a.href }, a.title),
                h("span", { class: "fine" }, ` ${a.why}`),
              ),
            ),
          ),
        );
      }),
    ),
  );
}

const blankSheet = () =>
  h(
    "article",
    { class: "pi-report", id: "piReport" },
    h("h2", {}, "Score entry sheet"),
    h(
      "p",
      { class: "fine" },
      "Copy scores from each report, then type them in with Import scores.",
    ),
    h(
      "table",
      { class: "pi-table" },
      h(
        "thead",
        {},
        h(
          "tr",
          {},
          ["Student", "Test & year", ...DOMAINS, "Overall"].map((x) =>
            h("th", { scope: "col" }, x),
          ),
        ),
      ),
      h(
        "tbody",
        {},
        Array.from({ length: 12 }, () =>
          h(
            "tr",
            {},
            Array.from({ length: 7 }, () => h("td", {}, " ")),
          ),
        ),
      ),
    ),
  );

const TOOL_VIEWS = {
  goals: renderGoalForm,
  levels: levelsTool,
  words: () => table("Words to know", ["Word", "What it means"], GLOSSARY),
  families: familiesTool,
  conference: conferenceTool,
  library: libraryTool,
  year: () =>
    h(
      "ol",
      { class: "pi-timeline" },
      YEAR.map(([when, what]) => h("li", {}, h("strong", {}, when), h("p", {}, what))),
    ),
  official: () =>
    h(
      "ul",
      { class: "pi-links" },
      OFFICIAL.map(([t, u]) =>
        h("li", {}, h("a", { href: u, rel: "noopener", target: "_blank" }, t)),
      ),
    ),
  templates: () =>
    h(
      "div",
      { class: "pi-stack" },
      h(
        "p",
        {},
        h(
          "a",
          {
            class: "btn",
            href: `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`,
            download: "wida-score-template.csv",
          },
          "Download the CSV template",
        ),
        " ",
        printBtn(),
      ),
      blankSheet(),
    ),
};

export function renderToolkit(ws) {
  const open = ws.sub.toolkit || null;
  if (open && TOOL_VIEWS[open]) {
    const t = TOOLS.find((x) => x[0] === open);
    return h(
      "div",
      { class: "pi-stack" },
      h(
        "p",
        { class: "no-print" },
        h(
          "button",
          {
            type: "button",
            class: "linkish",
            "data-toolkit-back": "",
            on: { click: () => ((ws.sub.toolkit = null), ws.rerender()) },
          },
          "← All tools",
        ),
      ),
      h("h2", {}, t[1]),
      TOOL_VIEWS[open](ws),
    );
  }
  return h(
    "div",
    { class: "pi-stack" },
    h("h2", {}, "Toolkit"),
    h(
      "p",
      { class: "lead" },
      "Resources for reading scores with students, families and colleagues.",
    ),
    h(
      "div",
      { class: "pi-toolgrid" },
      TOOLS.map(([id, name, text]) =>
        h(
          "button",
          {
            type: "button",
            class: "pi-tool",
            "data-tool": id,
            on: { click: () => ((ws.sub.toolkit = id), ws.rerender()) },
          },
          h("strong", {}, name),
          h("span", {}, text),
        ),
      ),
    ),
  );
}
