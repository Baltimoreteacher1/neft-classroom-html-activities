// Language Studio print: bilingual FAMILY GUIDE (part "family"), English / Español side by side, 2 pages.
// Source: detail.family (validateFamily in db/seeds/bcpss/v2/schema.mjs) merged with detail.studio.vocab by index.

import { B, b, frameRuns, gradeLabel, i, newDoc, section, subjectTone, t } from "./studio-doc.js";

const EN = "Reading";
const ES = "Speaking";
const blanks = (s) => frameRuns(String(s).replace(/___/g, "[…]"));

// Two columns: English (left) and Español (right).
const bi = (en, es) => B.columns([en, es], { widths: [49, 49], rule: true });

const biHeading = (en, es, icon, tone) => B.heading(`${en}  ·  ${es}`, 2, { icon, tone });

const bullets = (items) => [B.checklist(items, { style: "dot", tone: "Game" })];

function steps(list) {
  return list.map((s, k) => B.para([b(`${k + 1}. `), t(s)], { size: "fam" }));
}

function wordTable(detail) {
  const { vocab } = detail.studio;
  const fam = detail.family.vocab;
  const tones = ["Listening", "Speaking", "Reading", "Writing", "Vocabulary", "Game"];
  const rows = vocab.map((v, k) => [
    {
      runs: [...(v.icon ? [t(`${v.icon} `)] : []), b(v.term), t("  /  "), b(v.es || v.term)],
      tone: tones[k % 6],
    },
    { runs: [t(v.def), t("  "), { t: v.example, i: true, small: true }] },
    { runs: [t(fam[k].def_es), t("  "), { t: fam[k].example_es, i: true, small: true }] },
  ]);
  return B.table(rows, {
    headers: ["Word · Palabra", "What it means", "Qué significa"],
    widths: [20, 40, 40],
    compact: true,
    tone: EN,
  });
}

function tryCard(a, k) {
  const tone = ["Vocabulary", "Writing", "Game", "Listening"][k % 4];
  return B.callout(
    tone,
    [
      B.checklist(
        [
          [
            b(a.title.en),
            t("  ·  "),
            b(a.title.es),
            { t: `   ${a.minutes} min`, i: true, small: true },
          ],
        ],
        { tone },
      ),
      bi(
        [
          B.para([
            { t: "You need: ", b: true, small: true },
            { t: a.materials.en, small: true },
          ]),
          ...steps(a.steps.en),
        ],
        [
          B.para([
            { t: "Necesitan: ", b: true, small: true },
            { t: a.materials.es, small: true },
          ]),
          ...steps(a.steps.es),
        ],
      ),
    ],
    { plain: true },
  );
}

function goalsBlock(f) {
  if (!f.goals) return [];
  const list = (items) => B.checklist(items, { tone: "Vocabulary" });
  return [
    biHeading("What your child can do", "Lo que su hijo/a podrá hacer", "star", "Vocabulary"),
    bi([list(f.goals.en)], [list(f.goals.es)]),
  ];
}

function pageLearn(detail) {
  const { unit } = detail;
  const f = detail.family;
  return section([
    B.hero({
      compact: true,
      tone: subjectTone(unit.subject),
      kicker: `Family Guide · Guía para la familia  |  ${gradeLabel(unit)} ${unit.subject}`,
      title: unit.unit_title,
      subtitle: "",
    }),
    biHeading("What your child is learning", "Lo que su hijo/a está aprendiendo", "book", EN),
    bi([B.callout(EN, [B.para([t(f.summary.en)])])], [B.callout(ES, [B.para([t(f.summary.es)])])]),
    ...goalsBlock(f),
    biHeading("Word cards", "Tarjetas de palabras", "abc", "Vocabulary"),
    wordTable(detail),
  ]);
}

function pageTalk(detail) {
  const f = detail.family;
  return section([
    biHeading("Talk about it", "Hablen del tema", "speech", "Listening"),
    B.table(
      f.talk.map((x, k) => [{ t: String(k + 1), bold: true, align: "center" }, x.en, x.es]),
      {
        headers: ["#", "Ask in any language", "Pregunten en cualquier idioma"],
        widths: [5, 47, 48],
        compact: true,
        tone: "Listening",
      },
    ),
    biHeading("Say it!", "¡Díganlo!", "speech", ES),
    B.table(
      f.say_it.map((x) => [{ runs: blanks(x.en) }, { runs: blanks(x.es) }]),
      {
        headers: ["Try this sentence", "Pruebe esta oración"],
        widths: [50, 50],
        compact: true,
        tone: ES,
      },
    ),
    biHeading("How you can help", "Cómo pueden ayudar", "bulb", "Game"),
    bi(bullets(f.help.en), bullets(f.help.es)),
    bi(
      [
        B.callout("Vocabulary", [B.para([b("Use your home language. "), t(f.home_language.en)])], {
          icon: "people",
        }),
        B.callout("Writing", [B.para([b("What progress looks like. "), t(f.celebrate.en)])], {
          icon: "star",
        }),
      ],
      [
        B.callout("Vocabulary", [B.para([b("Usen su idioma en casa. "), t(f.home_language.es)])], {
          icon: "people",
        }),
        B.callout("Writing", [B.para([b("Cómo se ve el progreso. "), t(f.celebrate.es)])], {
          icon: "star",
        }),
      ],
    ),
  ]);
}

function pageTry(detail) {
  const f = detail.family;
  const strip = detail.studio.vocab.map((v) => `${v.term} · ${v.es || v.term}`);
  return section([
    biHeading("Try it at home", "Pruébenlo en casa", "pencil", "Writing"),
    ...f.try_at_home.map(tryCard),
    B.chips(strip, {
      label: "Cut out and keep · Recorten y guarden",
      cut: true,
      tone: "Vocabulary",
    }),
  ]);
}

export function buildFamily(detail, opts) {
  if (!detail?.family) throw new Error("family content not authored for this unit");
  const sections = [pageLearn(detail), pageTalk(detail), pageTry(detail)];
  sections[0].pageBreakBefore = false;
  return newDoc(detail, opts, sections, { bodyClass: "fam", titleSuffix: " · Family Guide" });
}
