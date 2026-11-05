// Synthetic pages with one known defect each. They prove every family-mission rule FIRES (and that a
// clean page does not trip any of them), so a detector that quietly stops matching fails loudly.
// Used by tools/validate-family-mission-content.mjs (before it sweeps) and its .test.mjs.
import { answerChecks } from "./family-mission-answers.mjs";
import {
  bilingualChecks,
  countChecks,
  linkChecks,
  objectiveChecks,
  titleSourceChecks,
} from "./family-mission-checks.mjs";
import { contaminationHits, lessonStems } from "./family-mission-lexicon.mjs";
import { parsePage } from "./family-mission-page.mjs";
import { contaminationChecks } from "./family-mission-run.mjs";

export const ROUTE_CFG = {
  quick: { tabs: ["connect", "explore", "check", "talk", "apply", "done"], problemLimit: 3 },
  full: { tabs: ["connect", "explore", "check", "talk", "apply", "done"], problemLimit: 0 },
};

const bi = (en, es) =>
  `<span class="lang-en">${en}</span><span class="lang-es" lang="es">${es}</span>`;
const attr = (s) => s.replace(/"/g, "&quot;").replace(/'/g, "&#039;");

function problem(
  i,
  {
    topic = "percent",
    noEnglishNotes = false,
    stem = ["What is 200% of 15?", "¿Cuánto es el 200% de 15?"],
    choices = ["30", "15", "7.5", "200"],
    correct = 0,
    feedback,
  } = {},
) {
  const wrong = (feedback ?? choices.map((_, k) => (k === correct ? "" : "Check the whole."))).map(
    (t) => attr(t),
  );
  const wrongEs = wrong.map((t) => (t ? "Revisa el total." : "Correcto."));
  return `<section class="practice-tier practice-tier-basic"><section class="problem-section card" id="problem_${i}" data-problem-type="multiple-choice" data-topic="${topic}">
    <p class="problem-stem">${bi(stem[0], stem[1])}</p>
    <div class="mc-options" data-correct="${correct}" data-explanation="${attr("200% is 2 wholes: 2 x 15 = 30.")}" data-explanation-es="${attr("200% son 2 enteros: 2 x 15 = 30.")}" data-choice-feedback='${noEnglishNotes ? "[]" : JSON.stringify(wrong)}' data-choice-feedback-es='${JSON.stringify(wrongEs)}'>
      ${choices.map((c, k) => `<label class="mc-option-label"><input type="radio" value="${k}"><span class="choice-text">${c}</span></label>`).join("")}
    </div></section></section>`;
}

/** A page that satisfies every rule, with per-test overrides. */
export function fixtureHtml(o = {}) {
  const n = o.problems ?? 6;
  const probs = o.problemHtml ?? Array.from({ length: n }, (_, i) => problem(i)).join("");
  return `<html><body><h1>${bi("Understand Percent", "Comprender el porcentaje")}</h1>
  <section class="hw-mission-start">${bi(`Six short steps. Look, play with the math, solve ${o.claim ?? 3}, talk and finish.`, "Seis pasos cortos")}</section>
  ${(o.goals ?? [3, 3]).map((g) => `<span data-hw-goal-count>${g}</span>`).join("")}
  <span data-hw-goal-avail>${o.avail ?? n}</span>
  ${o.noExample ? "" : '<p id="hw_example_label"></p>'}
  <div class="hw-dinner-visual-body">${o.dinner ?? bi("Percent means out of 100.", "Porcentaje significa de cada 100.")}</div>
  ${probs}
  ${(o.links ?? ["/lessons/4-1/homework.html"]).map((h) => `<a href="${h}">x</a>`).join("")}
  ${o.extra ?? ""}
  <p>Standard: ${o.standardShown ?? "6.AT.4"}</p></body></html>`;
}

const page = (o) => parsePage("4-1", fixtureHtml(o));
export const CTX = {
  id: "4-1",
  baseId: "4-1",
  session: 1,
  family: "percent",
  stems: lessonStems(["Percents Greater Than 100%", "Understand Percent", "percent", "whole"]),
  exempt: [],
  config: {
    title: "Understand Percent",
    standard: "6.AT.4",
    contentObjective: "I can explain a percent.",
  },
  sidecar: {
    learningTonight: { en: "Tonight", es: "Esta noche" },
    sessionTitle: "Percents Greater Than 100%",
  },
};
const rules = (fs) => new Set(fs.map((f) => f.rule));

/** [rule, description, () => findings]. Every row must report `rule`; the control row must report nothing. */
export const SELF_TESTS = [
  [
    "clean",
    "a page that satisfies every rule reports nothing",
    () => [
      ...countChecks(page(), ROUTE_CFG),
      ...bilingualChecks(page()),
      ...answerChecks(page()).findings,
      ...objectiveChecks(page(), { ...CTX }),
      ...linkChecks(page()),
      ...contaminationChecks(page(), CTX),
    ],
  ],
  [
    "CONTAMINATION",
    "a percent page with a recipe-scaling visual",
    () =>
      contaminationChecks(
        page({
          dinner: bi(
            "Scaling a ratio is like making a double batch of a recipe: multiply both parts by the same number.",
            "Escalar una razón es como hacer el doble de una receta.",
          ),
        }),
        CTX,
      ),
  ],
  [
    "CONTAMINATION",
    "a lesson-4 sentence about statistics with no percent wording",
    () =>
      contaminationChecks(
        page({
          dinner: bi(
            "Put the data in order and find the median of the data set.",
            "Ordenen los datos y hallen la mediana.",
          ),
        }),
        CTX,
      ),
  ],
  [
    "CONTAMINATION",
    "unit-rate wording on a percent page",
    () =>
      contaminationChecks(
        page({
          dinner: bi(
            "Find the unit rate by dividing the cost by the number of bags.",
            "Hallen la tasa unitaria.",
          ),
        }),
        CTX,
      ),
  ],
  [
    "COUNT_QUICK_CLAIM",
    "the mission says solve 2 but shows 3",
    () => countChecks(page({ claim: 2 }), ROUTE_CFG),
  ],
  [
    "COUNT_STATIC_GOAL",
    "first paint shows goal 4 on the mission route (3)",
    () => countChecks(page({ goals: [4, 4] }), ROUTE_CFG),
  ],
  [
    "COUNT_AVAILABLE",
    "page says 12 available but renders 6",
    () => countChecks(page({ avail: 12 }), ROUTE_CFG),
  ],
  [
    "COUNT_QUICK_EXAMPLE",
    "no worked example behind 'one example'",
    () => countChecks(page({ noExample: true }), ROUTE_CFG),
  ],
  [
    "COUNT_TOO_FEW",
    "fewer core problems than the goal",
    () => countChecks(page({ problems: 2, avail: 2, claim: 2, goals: [2, 2] }), ROUTE_CFG),
  ],
  [
    "BILINGUAL",
    "Spanish is the English copied over",
    () =>
      bilingualChecks(
        page({ extra: bi("Name the whole of the problem", "Name the whole of the problem") }),
      ),
  ],
  [
    "BILINGUAL",
    "Spanish carries English function words",
    () =>
      bilingualChecks(page({ extra: bi("Name the whole.", "Nombra the whole and your total.") })),
  ],
  [
    "BILINGUAL",
    "English choice notes missing while Spanish has them",
    () => bilingualChecks(page({ problemHtml: problem(0, { noEnglishNotes: true }) })),
  ],
  [
    "BILINGUAL_UNPAIRED",
    "an English span with no Spanish sibling",
    () => bilingualChecks(page({ extra: '<p><span class="lang-en">Only English here</span></p>' })),
  ],
  [
    "ANSWER_KEY",
    "the key says 15 for 200% of 15",
    () => answerChecks(page({ problemHtml: problem(0, { correct: 1 }) })).findings,
  ],
  [
    "ANSWER_KEY",
    "unit-rate stem keyed to the wrong quotient",
    () =>
      answerChecks(
        page({
          problemHtml: problem(0, {
            stem: ["A snack costs $12 for 4 bags. What is the unit rate in dollars per bag?", "x"],
            choices: ["$8", "$3", "$48", "$16"],
            correct: 0,
          }),
        }),
      ).findings,
  ],
  [
    "ANSWER_DUPLICATE",
    "two choices state the same number",
    () =>
      answerChecks(
        page({
          problemHtml: problem(0, {
            stem: ["Write 1/2 as a decimal.", "x"],
            choices: ["0.5", "1/2", "5", "0.05"],
            correct: 0,
          }),
        }),
      ).findings,
  ],
  [
    "OBJ_TITLE",
    "config title differs from the Reveal table of contents",
    () =>
      objectiveChecks(page(), {
        ...CTX,
        config: { ...CTX.config, title: "Understand Percentages" },
      }),
  ],
  [
    "OBJ_STANDARD_FORMAT",
    "malformed standard code",
    () => objectiveChecks(page(), { ...CTX, config: { ...CTX.config, standard: "six-AT-4" } }),
  ],
  [
    "OBJ_STANDARD_SHOWN",
    "page shows a different standard than the config",
    () => objectiveChecks(page({ standardShown: "6.AT.5" }), { ...CTX }),
  ],
  [
    "OBJ_SESSION_TEXT",
    "no Spanish session objective",
    () =>
      objectiveChecks(page(), {
        ...CTX,
        sidecar: { ...CTX.sidecar, learningTonight: { en: "Tonight", es: "" } },
      }),
  ],
  [
    "OBJ_SESSION_TITLE",
    "Session 2 without a session title",
    () =>
      objectiveChecks(page(), {
        ...CTX,
        session: 2,
        sidecar: { learningTonight: { en: "a", es: "b" } },
      }),
  ],
  [
    "LINK_BROKEN",
    "an internal link to a file that is not in the repo",
    () => linkChecks(page({ links: ["/lessons/9-9-nope/homework.html"] })),
  ],
  [
    "LINK_EXTERNAL_UNLISTED",
    "an external link not in homework-external-resources.json",
    () => linkChecks(page({ links: ["https://example.invalid/video"] })),
  ],
  [
    "BILINGUAL_TITLE_SOURCE",
    "a page id with no Spanish title in family-homework-titles-es.json",
    () => titleSourceChecks(page(), { ...CTX, title: "Understand Percent" }, {}),
  ],
  [
    "BILINGUAL_TITLE_SOURCE",
    "a Spanish title that is the English copied over",
    () =>
      titleSourceChecks(
        page(),
        { ...CTX, title: "Understand Percent" },
        { "4-1": "Understand Percent" },
      ),
  ],
  [
    "LINK_SELF_BROKEN",
    "an own-site absolute URL that is not a repo file",
    () => linkChecks(page({ links: ["https://eduwonderlab.com/lessons/9-9-nope/homework.html"] })),
  ],
  [
    "COUNT_DUPLICATE_ID",
    "two problems share an id",
    () =>
      countChecks(
        page({ problemHtml: Array.from({ length: 6 }, () => problem(0)).join("") }),
        ROUTE_CFG,
      ),
  ],
  [
    "OBJ_PAGE_TITLE",
    "the page heading is not the lesson's title",
    () =>
      objectiveChecks(page(), {
        ...CTX,
        session: 2,
        sidecar: { ...CTX.sidecar, sessionTitle: "Something Else" },
      }),
  ],
  [
    "TOPIC_MISMATCH",
    "a percent lesson rendered with the ratio topic",
    () => contaminationChecks(page({ problemHtml: problem(0, { topic: "ratios" }) }), CTX),
  ],
];

/** Direct lexicon controls: what must NOT be flagged. */
export const LEXICON_CONTROLS = [
  [
    "a percent hint that uses 'equivalent ratio out of 100'",
    () =>
      contaminationHits(
        "Scale 7 out of 10 to an equivalent ratio out of 100.",
        "percent",
        CTX.stems,
      ),
  ],
  [
    "a percent-table sentence with a percent figure",
    () =>
      contaminationHits(
        "In a ratio table, multiply both terms by 10 to scale from 10% to 100%: 5 × 10 = 50.",
        "percent",
        CTX.stems,
      ),
  ],
  [
    "a spiral-review sentence the page shows on purpose",
    () =>
      contaminationHits("What is the median of 5, 1, 9, 3, 7?", "percent", CTX.stems, [
        "What is the median of 5, 1, 9, 3, 7?",
      ]),
  ],
  [
    "a tolerated pairing (fraction wording in a percent lesson)",
    () =>
      contaminationHits("Write the numerator over the denominator first.", "percent", CTX.stems),
  ],
];

/** Runs every self-test; throws a message naming the first rule that did not behave. */
export function runSelfTests() {
  for (const [rule, name, run] of SELF_TESTS) {
    const got = rules(run());
    if (rule === "clean") {
      if (got.size) throw new Error(`self-test "${name}" reported ${[...got].join(", ")}`);
    } else if (!got.has(rule)) {
      throw new Error(
        `self-test "${name}" did not report ${rule}; got ${[...got].join(", ") || "nothing"}`,
      );
    }
  }
  for (const [name, run] of LEXICON_CONTROLS) {
    const hits = run();
    if (hits.length) throw new Error(`lexicon control "${name}" was flagged: ${hits[0].quote}`);
  }
}
