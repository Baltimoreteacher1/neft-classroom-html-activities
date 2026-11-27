// An animation in Word. Word has no motion and a Pages Function cannot rasterize an SVG, so the frames become what a
// teacher can edit: the title, the explanation, a real NUMBERED LIST of what each frame says, the figures' data as a
// real table where there is one, and the alt text. The drawn frames are in the printable version (print/blocks.js).

import { animationPaper } from "../../../access-practice-lab/src/studio/print/paper-model.js";
import { boxed, gap, label, para, TEXT_W, table } from "./docx-kit.js";

const GREY = { fill: "F5F6F7", type: "clear", color: "auto" };

/** @param {{t: (key: string) => string, lang: string, anim?: number}} c  the export context (docx.js makeContext) */
export function animationParagraphs(c, b) {
  const a = animationPaper(b, c.lang);
  if (!a.ok) return [boxed(`[${c.t("animationMissing")}]`, { shading: GREY }), gap()];
  c.anim = (c.anim ?? 100) + 1; // a new instance restarts the numbering at 1 for each animation
  const bi = (en, es) => (es ? `${en} / ${es}` : en);
  const out = [
    label(bi(a.title, a.titleEs)),
    boxed(`${c.t("animationInWord")}: ${a.alt}`, { shading: GREY }),
  ];
  if (a.explanation) out.push(para(bi(a.explanation, a.explanationEs), { keepNext: true }));
  for (const f of a.frames)
    out.push(
      para(bi(f.caption, f.captionEs), {
        numbering: { reference: "frames", level: 0, instance: c.anim },
        keepLines: true,
        spacing: { before: 40, after: 80 },
      }),
    );
  if (a.table) {
    const cols = Math.max(a.table.headers.length, 1);
    const w = Math.floor(TEXT_W / cols);
    out.push(
      gap(60),
      table([a.table.headers, ...a.table.rows], {
        widths: Array.from({ length: cols }, () => w),
        header: true,
      }),
    );
  }
  out.push(gap());
  return out;
}
