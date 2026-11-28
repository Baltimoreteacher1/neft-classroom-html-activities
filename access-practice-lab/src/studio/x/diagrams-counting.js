// Counting models for the early grades (K-2): the ten frame. A frame is two rows of five boxes, filled left to right
// and top to bottom, so a child sees "5 and 2 more" at a glance. A second group (`add`) uses a different SHAPE as well
// as a different color (squares after circles), so the two groups stay apart in grayscale and for color-blind
// children. Up to 20 counters: one frame, or two frames side by side once the first is full.

import { COLOR, both, fail, frame, intIn, langOf, result, text } from "./diagram-kit.js";

/** The most counters two frames can hold. */
export const TEN_FRAME_MAX = 20;

const TF_CELL = 56;
const TF_GAP = 28;
const TF_PAD = 20;

function tfCounter(kind, cx, cy) {
  if (kind === "count")
    return `<circle data-counter="count" cx="${cx}" cy="${cy}" r="19" fill="${COLOR.blue}" stroke="${COLOR.ink}" stroke-width="2"/>`;
  return `<rect data-counter="add" x="${cx - 17}" y="${cy - 17}" width="34" height="34" rx="4" fill="${COLOR.orange}" stroke="${COLOR.ink}" stroke-width="2"/>`;
}

/**
 * @param {{count:number, add?:number|null, lang?:string}} spec
 *   `count`: counters in the first group (circles). `add`: an optional second group (squares), drawn after the first.
 */
export function tenFrameSvg(spec = {}) {
  const lang = langOf(spec);
  const count = intIn(spec.count, "count", { min: 0, max: TEN_FRAME_MAX });
  const hasAdd = spec.add !== undefined && spec.add !== null && spec.add !== "";
  const add = hasAdd ? intIn(spec.add, "add", { min: 0, max: TEN_FRAME_MAX }) : 0;
  const total = count + add;
  if (total > TEN_FRAME_MAX)
    fail("too-many", `A ten frame model holds at most ${TEN_FRAME_MAX} counters; this one has ${total}.`);
  const frames = total > 10 ? 2 : 1;
  const frameW = 5 * TF_CELL;
  const w = TF_PAD * 2 + frames * frameW + (frames - 1) * TF_GAP;
  const h = TF_PAD + 2 * TF_CELL + 48;
  const p = "tf";
  let body = "";
  for (let f = 0; f < frames; f++) {
    const x0 = TF_PAD + f * (frameW + TF_GAP);
    body += `<rect data-frame="${f + 1}" x="${x0}" y="${TF_PAD}" width="${frameW}" height="${2 * TF_CELL}" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="3"/>`;
    for (let i = 0; i < 10; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = x0 + col * TF_CELL;
      const y = TF_PAD + row * TF_CELL;
      body += `<rect data-cell="${f * 10 + i + 1}" x="${x}" y="${y}" width="${TF_CELL}" height="${TF_CELL}" fill="none" stroke="${COLOR.ink}" stroke-width="2"/>`;
      const n = f * 10 + i;
      if (n < total)
        body += tfCounter(n < count ? "count" : "add", x + TF_CELL / 2, y + TF_CELL / 2);
    }
  }
  const words = (l) => {
    const es = l === "es";
    const unit = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const frameWord = es
      ? frames === 1
        ? "Un marco de diez"
        : "Dos marcos de diez"
      : frames === 1
        ? "A ten frame"
        : "Two ten frames";
    if (!hasAdd)
      return es
        ? `${frameWord} con ${unit(count, "círculo", "círculos")}.`
        : `${frameWord} with ${unit(count, "circle", "circles")}.`;
    return es
      ? `${frameWord} con ${unit(count, "círculo azul", "círculos azules")} y ${unit(add, "cuadrado anaranjado", "cuadrados anaranjados")}.`
      : `${frameWord} with ${unit(count, "blue circle", "blue circles")} and ${unit(add, "orange square", "orange squares")}.`;
  };
  const alt = both(words);
  body += text(w / 2, h - 16, lang === "es" ? "Cuenta los marcadores." : "Count the counters.", {
    size: 16,
    anchor: "middle",
    fill: COLOR.muted,
  });
  const rows = [[lang === "es" ? "Círculos" : "Circles", String(count)]];
  if (hasAdd) rows.push([lang === "es" ? "Cuadrados" : "Squares", String(add)]);
  return result({
    svg: frame({ p, w, h, title: alt[lang], desc: alt[lang], lang, body }),
    alt,
    caption: both((l) => (l === "es" ? "Marco de diez" : "Ten frame")),
    data: { count, add: hasAdd ? add : null, frames, total },
    table: { headers: lang === "es" ? ["Grupo", "Cuántos"] : ["Group", "How many"], rows },
  });
}
