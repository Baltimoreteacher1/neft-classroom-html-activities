// Language Studio print: routine blocks (parts rt-*). One part = one block, built from the same neutral nodes the Studio
// tab renders (shared/bcpss-routines), so a printed or Word page says exactly what the screen says.
// Student sheets carry no level label and no answers; teacher pages and keys name the level. One continuous section:
// no page breaks and tight spacing.

import { DRAFT_FOOTER, DRAFT_NOTICE } from "../../../shared/bcpss-provenance.js";
import { buildBlock, routineParts } from "../../../shared/bcpss-routines/index.js";
import { B, b, i, LEVEL_LABEL, newDoc, section, t } from "./studio-doc.js";

const FAMILY_TONE = { talk: "Speaking", listen: "Listening", check: "Vocabulary" };

function cardRowHeight(cardList) {
  const lines = Math.max(...cardList.map((c) => c.lines.length));
  return Math.min(3.6, 0.55 + 0.3 * lines);
}

function toBlocks(node, tone) {
  switch (node.t) {
    case "h":
      return [B.heading(node.text, 3, { tone })];
    case "p":
      return [B.para([node.em ? i(node.text) : t(node.text)], node.em ? { size: "sm" } : {})];
    case "list":
      return node.ordered
        ? node.items.map((x, k) => B.para([b(`${k + 1}. `), t(x)]))
        : [B.checklist(node.items, { style: "dot", tone })];
    case "kv":
      return [
        B.table(
          node.rows.map(([k, v]) => [{ t: k, bold: true }, v]),
          { widths: [26, 74], compact: true, tone },
        ),
      ];
    case "chips":
      return [B.chips(node.items, { label: node.label || undefined, cut: false, tone })];
    case "cards":
      return [
        B.cardGrid(
          node.cards.map((c) => ({
            tone,
            blocks: [
              B.para([b(c.title)], { size: "sm" }),
              ...c.lines.map((l) => B.para([t(l)], { size: "sm" })),
            ],
          })),
          {
            cols: Math.min(2, node.cards.length),
            rowH: cardRowHeight(node.cards),
            cut: node.cut,
          },
        ),
      ];
    case "table":
      return [B.table(node.rows, { headers: node.headers, compact: true, tone })];
    case "mc":
      return node.items.flatMap((it, k) => [
        B.para([b(`${k + 1}. `), t(it.q)]),
        B.checklist(it.options, {
          style: "bubble",
          tone,
          ...(it.answer != null ? { mark: it.answer } : {}),
        }),
        ...(it.note || []).map((n) => B.para([i(n)], { size: "sm" })),
      ]);
    case "lines":
      return [B.lines(node.n, node.label ? { label: node.label } : {})];
    default:
      throw new Error(`studio-doc-routines: unknown node type "${node.t}"`);
  }
}

export function buildRoutinePart(detail, opts) {
  const entry = routineParts().get(opts.part);
  if (!entry) throw new Error(`unknown routine part "${opts.part}"`);
  const { block, view } = entry;
  const band = opts.level.replace(/^l/, "");
  const tone = FAMILY_TONE[block.family] || "Reading";
  const nodes = buildBlock(block, detail, band, view);
  const keyed = view === "teacher" && block.audience === "student";
  const subtitle = [
    detail.unit.unit_title,
    view === "teacher" ? LEVEL_LABEL[opts.level] || "" : "",
    keyed ? "Teacher key" : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const blocks = [
    B.heading(block.title, 1, { tone }),
    B.para([i(subtitle)], { size: "sm" }),
    ...nodes.flatMap((n) => toBlocks(n, tone)),
  ];
  const sections = [section(blocks, { tone, pageBreakBefore: false })];
  const doc = newDoc(detail, opts, sections, { dense: true, titleSuffix: ` · ${block.title}` });
  doc.partLabel = block.title;
  // Routine blocks built from esol_pack are generated, never reviewed: they always carry the draft notice.
  if (block.paths.every((p) => p.startsWith("esol_pack"))) {
    doc.notice = DRAFT_NOTICE;
    doc.footerLabel = DRAFT_FOOTER;
  }
  return doc;
}
