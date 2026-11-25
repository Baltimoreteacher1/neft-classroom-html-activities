// Mixed-band class packets (Prompt 3 section 7.2): document models for the three class-packet parts.
//   student  one paper per variant. The SAME layout for every band: same sections, row counts and writing lines.
//            No level, band, program, name or initial anywhere on it; only an opaque variant code in the footer.
//   key      the answer key for every variant (teacher file).
//   cover    the one-page teacher cover sheet that decodes the variant codes (a separate file, never in the stack).
// What goes on a page is decided in shared/packets/content.js; this file only lays it out with the shared Studio block
// model (studio-doc.js), so the HTML and Word renderers (packet-render.js) draw it exactly like every other Studio part.
// No section sets a page break: every document is one flowing section.

import { coverSpec, keySpec, paperSpec } from "../../../shared/packets/content.js";
import { B, b, frameRuns, i, newDoc, section, t } from "./studio-doc.js";

const gaps = (text) => frameRuns(String(text).replace(/___/g, "[…]"));

function wordRow(w) {
  return [
    { runs: [b(w.term)] },
    w.def,
    {
      blocks: [B.para([b(`${w.practice.prefix} `), ...gaps(w.practice.text)]), B.lines(1)],
    },
  ];
}

function wrapDoc(unit, blocks, extra) {
  const doc = newDoc({ unit }, { level: null }, [section(blocks, { pageBreakBefore: false })], {
    titleSuffix: extra.titleSuffix || "",
    bodyClass: extra.bodyClass || "",
  });
  doc.partLabel = extra.partLabel;
  doc.packet = { kind: extra.kind, code: extra.code || null };
  return doc;
}

/** The uniform student paper for one band, footed with its opaque variant code. */
export function buildStudentPaper(unit, studio, band, code) {
  const s = paperSpec(unit, studio, band);
  const blocks = [
    B.heading(s.title, 1),
    B.para([i(s.subtitle)], { size: "sm" }),
    B.lines(1, { label: "Name" }),
    B.callout("neutral", [B.para(gaps(s.goal))], { label: "My goal", icon: "speech", plain: true }),
    B.heading("Words", 2, { icon: "abc", tone: "neutral" }),
    B.table(s.words.map(wordRow), {
      headers: ["Word", "What it means", "Use it"],
      widths: [17, 33, 50],
      compact: true,
      tone: "neutral",
    }),
    B.heading("Sentences", 2, { icon: "pencil", tone: "Listening" }),
    ...s.frames.flatMap((f) => [B.para(frameRuns(f)), B.lines(1)]),
    B.heading("Exit ticket", 2, { icon: "speech", tone: "neutral" }),
    B.para([b(s.exit.prompt)]),
    B.callout("Listening", [B.para([b(`${s.exit.help.lead} `), ...gaps(s.exit.help.text)])], {
      label: "Help box",
      icon: "bulb",
    }),
    B.lines(s.exit.lines),
  ];
  return wrapDoc(unit, blocks, {
    kind: "student",
    code,
    partLabel: "Language practice",
  });
}

/** Answer key for all three variants, with the exit-ticket model and rubric. Teacher file. */
export function buildKey(unit, studio, codes) {
  const k = keySpec(unit, studio, codes);
  const blocks = [
    B.heading(`Answer key · ${k.title}`, 1),
    B.para([i(`${k.subtitle}. ${k.disclaimer}`)], { size: "sm" }),
    ...k.variants.flatMap((v) => [
      B.heading(`Paper ${v.code} · ${v.label}`, 2, { icon: "abc", tone: "neutral" }),
      B.table(
        v.words.map((w) => [{ runs: [b(w.term)] }, w.response]),
        {
          headers: ["Word", "Expected response"],
          widths: [20, 80],
          compact: true,
          tone: "neutral",
        },
      ),
      B.para([b("Sentence frames on this paper: ")], { size: "sm" }),
      ...v.frames.map((f) => B.para(frameRuns(f), { size: "sm" })),
    ]),
    B.heading("Exit ticket", 2, { icon: "speech", tone: "Listening" }),
    B.para([b(k.exit.prompt)]),
    B.callout("Listening", [B.para([t(k.exit.model)])], { label: "Model answer", icon: "pencil" }),
    B.table([k.exit.rubric.map((r) => r.text)], {
      headers: k.exit.rubric.map((r) => r.label),
      widths: [34, 33, 33],
      compact: true,
      tone: "Listening",
    }),
  ];
  return wrapDoc(unit, blocks, {
    kind: "key",
    titleSuffix: " · Answer key",
    partLabel: "Answer key",
    bodyClass: "fam",
  });
}

/** One-page teacher cover sheet: the grouping legend. Never printed with the student stack. */
export function buildCover(unit, counts, codes) {
  const c = coverSpec(unit, counts, codes);
  const blocks = [
    B.heading(`Teacher cover sheet · ${c.title}`, 1),
    B.para([i(c.subtitle)], { size: "sm" }),
    B.callout(
      "Speaking",
      [
        B.para([
          b("Keep this sheet apart from the student papers. "),
          t("The codes below are the only way to tell the papers apart."),
        ]),
      ],
      { plain: true },
    ),
    B.table(
      c.rows.map((r) => [
        { t: r.code, bold: true, align: "center" },
        r.label,
        { t: String(r.students), align: "center" },
        { t: r.students ? String(r.students) : "none", align: "center" },
        { blocks: r.supports.map((s) => B.para([t(s)], { size: "sm" })) },
      ]),
      {
        headers: ["Code", "Group", "Students", "Copies to print", "What is on the paper"],
        widths: [9, 15, 11, 13, 52],
        compact: true,
        tone: "neutral",
      },
    ),
    B.para([b(`Total: ${c.total} students.`)]),
    B.heading("How to use it", 2, { icon: "bulb", tone: "Listening" }),
    B.checklist(c.steps, { style: "bubble", letters: false, tone: "Listening" }),
    B.footerNote(c.disclaimer),
  ];
  return wrapDoc(unit, blocks, {
    kind: "cover",
    titleSuffix: " · Teacher cover sheet",
    partLabel: "Teacher cover sheet",
    bodyClass: "fam",
  });
}
