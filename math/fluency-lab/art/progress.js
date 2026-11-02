// Skill tiles, grade steps, the learning pathway, milestone medals and the certificate frame.
import { arrowHead, at, check, circ, DASH, line, ngon, NOSTROKE, num, PAL, path, poly, rect, star, THIN } from "./core.js";
import { MOTIFS, STRAND_MOTIF } from "./motifs.js";

/** Grade band tint: K-2 teal, 3-5 blue, 6-8 amber. */
export const bandOf = (grade) => (Number(grade) <= 2 ? 0 : Number(grade) <= 5 ? 1 : 2);
const BAND_TINT = [PAL.tealSoft, PAL.blueSoft, PAL.amberSoft];
export const bandTint = (grade) => BAND_TINT[bandOf(grade)];
export const clampGrade = (grade) => Math.max(0, Math.min(8, Math.round(Number(grade)) || 0));

/** Nine rising bars, one per grade K-8, the learner's grade highlighted. */
const steps = (x0, base, current, c, barW = 4.4, gap = 2.2) =>
  Array.from({ length: 9 }, (_, i) => {
    const h = 4 + i * 1.3;
    const bx = x0 + i * (barW + gap);
    return i === current
      ? rect(bx, base - h - 2, barW, h + 2, c.amber, 1, 'stroke-width="1.2"')
      : rect(bx, base - h, barW, h, c.white, 1, NOSTROKE);
  }).join("");

export const motifKeyFor = (strand) => STRAND_MOTIF[strand] || "counting";

export function skillSpec(skill) {
  const grade = clampGrade(skill?.grade);
  const key = motifKeyFor(skill?.strand);
  return {
    vb: [120, 104],
    natural: 120,
    tint: bandTint(grade),
    motif: key,
    body: (id, c) => at(60, 44, 1.15, MOTIFS[key](c)) + steps(9, 96, grade, c),
  };
}
export function strandSpec(strand) {
  const key = motifKeyFor(strand);
  return { vb: [120, 104], natural: 120, tint: PAL.tealSoft, motif: key, body: (id, c) => at(60, 50, 1.2, MOTIFS[key](c)) };
}
export function gradeSpec(grade) {
  const g = clampGrade(grade);
  return {
    vb: [96, 96],
    natural: 96,
    tint: bandTint(g),
    body: (id, c) => {
      let out = "";
      for (let i = 0; i < 9; i += 1) {
        const h = 14 + i * 6.5;
        const x = 7 + i * 9.4;
        const extra = i < g ? NOSTROKE : i === g ? 'stroke-width="2.2"' : `${DASH} stroke-width="1.6"`;
        out += rect(x, 88 - h, 7.4, h, i < g ? c.white : i === g ? c.amber : "none", 2, extra);
      }
      const top = 88 - (14 + g * 6.5);
      const cx = 7 + g * 9.4 + 3.7;
      const dir = g >= 7 ? -1 : 1;
      return out + line(cx, top - 4, cx, top - 20) + poly([[cx, top - 20], [cx + dir * 14, top - 15], [cx, top - 10]], c.teal);
    },
  };
}

/** Pathway: one node per step. States differ by shape (dashed ring / half disc / hexagon+check / star) and colour. */
export const PATH_STATES = Object.freeze(["new", "developing", "proficient", "mastered"]);
export const stateOf = (step) => {
  const s = typeof step === "string" ? step : step?.state || step?.status || step?.level;
  return PATH_STATES.includes(s) ? s : "new";
};
export function pathwaySpec(steps = []) {
  const list = (Array.isArray(steps) && steps.length ? steps : ["new", "new", "new", "new", "new"]).slice(0, 24).map(stateOf);
  const n = list.length;
  const gap = n > 1 ? Math.min(92, 560 / (n - 1)) : 0;
  const k = Math.min(1.35, gap / 30) || 1.35;
  const x0 = 320 - (gap * (n - 1)) / 2;
  const pts = list.map((_, i) => [x0 + i * gap, 64 + Math.sin(i * 1.05) * 18]);
  return {
    vb: [640, 128],
    natural: 640,
    tint: PAL.paper,
    defs: (id, c) =>
      `<g id="${id("new")}">${circ(0, 0, 13, c.white, `${DASH} stroke-width="2.4"`)}</g>` +
      `<g id="${id("developing")}">${circ(0, 0, 14, c.white)}${path("M0 -14A14 14 0 0 0 0 14Z", c.teal)}${line(0, -14, 0, 14, THIN)}</g>` +
      `<g id="${id("proficient")}">${poly(ngon(0, 0, 17, 6), c.teal)}${check(0, 0, 7, `stroke="${c.white}" stroke-width="3.4"`)}</g>` +
      `<g id="${id("mastered")}">${poly(star(0, 0, 20, 12, 8), c.amber)}${circ(0, 0, 6, c.white, 'stroke-width="2"')}</g>`,
    body: (id, c) => {
      let segs = "";
      for (let i = 1; i < n; i += 1) {
        const reached = list[i] !== "new";
        const [ax, ay] = pts[i - 1];
        const [bx, by] = pts[i];
        segs += path(`M${num(ax)} ${num(ay)}L${num(bx)} ${num(by)}`, "none", reached ? `stroke-width="5"` : `${DASH} stroke-width="2.4"`);
      }
      const nodes = list.map((s, i) => `<use href="#${id(s)}" transform="translate(${num(pts[i][0])} ${num(pts[i][1])})${k !== 1 ? ` scale(${num(k)})` : ""}"/>`).join("");
      return `<g stroke="${c.line}" stroke-width="12">${path(`M${num(pts[0][0])} ${num(pts[0][1])}${pts.slice(1).map(([x, y]) => `L${num(x)} ${num(y)}`).join("")}`, "none", `stroke="${c.white}" stroke-width="14"`)}</g>${segs}${nodes}`;
    },
  };
}

/** Milestone medal: n+2 sided plate, n pips on the rim, escalating colour (teal, blue, navy, amber). */
export function milestoneSpec(level) {
  const n = Math.max(1, Math.min(5, Math.round(Number(level)) || 1));
  const fills = (c) => [c.tealSoft, c.teal, c.blue, c.navy2, c.amber][n - 1];
  return {
    vb: [96, 96],
    natural: 96,
    tint: PAL.paper,
    body: (id, c) =>
      poly([[36, 62], [24, 92], [38, 86], [46, 94], [50, 66]], c.blue) +
      poly([[60, 62], [72, 92], [58, 86], [50, 94], [46, 66]], c.teal) +
      circ(48, 40, 32, c.white) +
      circ(48, 40, 26, c.amberSoft, THIN) +
      poly(ngon(48, 42, 15, n + 2), fills(c)) +
      (n === 5 ? poly(star(48, 42, 8, 3.6, 5), c.white, 'stroke-width="1.6"') : circ(48, 42, 3.6, c.white, 'stroke-width="1.6"')) +
      Array.from({ length: n }, (_, i) => circ(48 + (i - (n - 1) / 2) * 8, 21, 2.6, c.amber)).join(""),
  };
}

export function certificateSpec({ orientation = "landscape" } = {}) {
  const wide = orientation !== "portrait";
  const [w, h] = wide ? [800, 600] : [600, 800];
  const cx = w / 2;
  const corner = (x, y, sx, sy) =>
    `<g transform="translate(${x} ${y}) scale(${sx} ${sy})">${path("M22 0A22 22 0 0 1 0 22M12 0A12 12 0 0 1 0 12", "none", 'stroke-width="1"')}${circ(26, 26, 2.4, "none", 'stroke-width="1"')}</g>`;
  return {
    vb: [w, h],
    natural: wide ? 800 : 600,
    tint: PAL.white,
    plain: true,
    body: (id, c) =>
      `<g stroke-width="1.6">${rect(16, 16, w - 32, h - 32, "none", 6, 'stroke-width="2.4"')}${rect(30, 30, w - 60, h - 60, "none", 3, 'stroke-width="1"')}` +
      corner(30, 30, 1, 1) + corner(w - 30, 30, -1, 1) + corner(30, h - 30, 1, -1) + corner(w - 30, h - 30, -1, -1) +
      circ(cx, 82, 30, "none", "") +
      circ(cx, 82, 24, "none", 'stroke-width="1"') +
      poly(star(cx, 82, 15, 6.5, 5), "none", 'stroke-width="1.4"') +
      path(`M${cx - 110} 142H${cx - 14}M${cx + 14} 142H${cx + 110}`, "none", 'stroke-width="1"') +
      poly(ngon(cx, 142, 5, 4), "none", 'stroke-width="1"') +
      path(`M${cx - 180} ${h - 90}H${cx - 40}M${cx + 40} ${h - 90}H${cx + 180}`, "none", 'stroke-width="1.2"') +
      `</g>`,
  };
}
export { arrowHead };
