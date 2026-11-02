// Pure detectors for validate:family-visual. Each takes plain data (what the page reported) and
// returns a list of problems, so every detector can be proven against a known-bad fixture before the
// real pages are judged. A gate that cannot fail reports a clean site; the self-tests exist for that.

/** "rgb(1, 2, 3)", "rgba(1, 2, 3, .5)" or "color(srgb 0.1 0.2 0.3 / 0.5)" -> [r, g, b, a] on 0-255, or null. */
export function parseColor(text) {
  const s = String(text ?? "").trim();
  let m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const [r, g, b, a = "1"] = m[1].split(/[\s,/]+/).filter(Boolean);
    return [
      Number(r),
      Number(g),
      Number(b),
      a.endsWith("%") ? Number.parseFloat(a) / 100 : Number(a),
    ];
  }
  m = /^color\(srgb\s+([^)]+)\)$/.exec(s);
  if (m) {
    const [r, g, b, , a = "1"] = m[1].split(/\s+/);
    return [Number(r) * 255, Number(g) * 255, Number(b) * 255, Number(a)];
  }
  return null;
}

const lin = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

/** WCAG contrast ratio of two opaque colors. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Lay a translucent color over an opaque one. */
export function over([r, g, b, a], [br, bg, bb]) {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
}

/**
 * Text contrast of one sample: { label, fg, bgs: [nearest ... farthest background-color], image, size, weight }.
 * A background image or gradient on the way up cannot be judged; the caller counts those, never guesses.
 */
export function judgeContrast(sample) {
  if (sample.image) return { skipped: true };
  const stack = sample.bgs.map(parseColor).filter(Boolean);
  let bg = [255, 255, 255, 1];
  for (const layer of [...stack].reverse()) bg = over(layer, bg);
  const fg = over(parseColor(sample.fg) ?? [0, 0, 0, 1], bg);
  const ratio = contrast(fg, bg);
  const large = sample.size >= 24 || (sample.size >= 18.66 && sample.weight >= 700);
  return { ratio, need: large ? 3 : 4.5, skipped: false };
}

export function contrastProblems(samples) {
  const bad = [];
  let judged = 0;
  for (const s of samples) {
    const j = judgeContrast(s);
    if (j.skipped) continue;
    judged++;
    if (j.ratio < j.need) bad.push(`${s.label}: ${j.ratio.toFixed(2)}:1 (needs ${j.need}:1)`);
  }
  return { bad, judged };
}

/** Rects { name, x, y, w, h }: every pair that overlaps by more than 2px in both directions. */
export function overlapProblems(rects) {
  const bad = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (dx > 2 && dy > 2)
        bad.push(`${a.name} overlaps ${b.name} by ${Math.round(dx)}x${Math.round(dy)}px`);
    }
  }
  return bad;
}

/** Heading samples { label, family } whose computed font-family reaches a serif fallback first or at all. */
export function serifHeadingProblems(samples) {
  return samples
    .filter((s) => /\b(Fraunces|Georgia|Times|serif)\b/i.test(s.family.replace(/sans-serif/gi, "")))
    .map((s) => `${s.label} uses ${s.family}`);
}

/** Interactive samples { label, w, h } under the 44px target. */
export function targetProblems(samples, min = 44) {
  return samples
    .filter((s) => s.w < min - 0.5 || s.h < min - 0.5)
    .map((s) => `${s.label} is ${Math.round(s.w)}x${Math.round(s.h)}px`);
}

/** Fonts the page must have loaded by the time it is judged. */
export function fontProblems(loaded, required = ["Baloo 2", "Nunito"]) {
  return required.filter((f) => !loaded.includes(f)).map((f) => `font "${f}" did not load`);
}

// ── self-tests: every detector must fire on a known-bad fixture and stay quiet on a good one ──
export function selfTest() {
  const fail = [];
  const expect = (name, ok) => ok || fail.push(name);
  expect("black on white is 21:1", Math.abs(contrast([0, 0, 0], [255, 255, 255]) - 21) < 0.01);
  expect("parses rgb", parseColor("rgb(10, 20, 30)")?.[2] === 30);
  expect("parses rgba", parseColor("rgba(10, 20, 30, 0.5)")?.[3] === 0.5);
  expect("parses color(srgb)", Math.round(parseColor("color(srgb 1 0 0 / 0.5)")[0]) === 255);
  const weak = contrastProblems([
    { label: "grey", fg: "rgb(150,150,150)", bgs: ["rgb(255,255,255)"], size: 16, weight: 400 },
  ]);
  expect("flags 2.9:1 text", weak.bad.length === 1 && weak.judged === 1);
  const fine = contrastProblems([
    { label: "navy", fg: "rgb(23,50,77)", bgs: ["rgb(255,255,255)"], size: 16, weight: 400 },
  ]);
  expect("passes navy on white", fine.bad.length === 0 && fine.judged === 1);
  const large = contrastProblems([
    { label: "big", fg: "rgb(130,130,130)", bgs: ["rgb(255,255,255)"], size: 28, weight: 700 },
  ]);
  expect("large text needs only 3:1", large.bad.length === 0);
  const alpha = contrastProblems([
    {
      label: "tint",
      fg: "rgb(23,50,77)",
      bgs: ["rgba(255,255,255,.1)", "rgb(23,50,77)"],
      size: 16,
      weight: 400,
    },
  ]);
  expect("composites translucent backgrounds", alpha.bad.length === 1);
  const image = contrastProblems([
    { label: "img", fg: "rgb(255,255,255)", bgs: [], image: true, size: 16, weight: 400 },
  ]);
  expect(
    "an image background is counted as unjudged, not passed",
    image.judged === 0 && image.bad.length === 0,
  );
  expect(
    "flags overlapping fixed bars",
    overlapProblems([
      { name: "a", x: 0, y: 0, w: 100, h: 50 },
      { name: "b", x: 50, y: 20, w: 100, h: 50 },
    ]).length === 1,
  );
  expect(
    "touching bars do not overlap",
    overlapProblems([
      { name: "a", x: 0, y: 0, w: 100, h: 50 },
      { name: "b", x: 100, y: 0, w: 100, h: 50 },
    ]).length === 0,
  );
  expect(
    "flags a Fraunces heading",
    serifHeadingProblems([{ label: "h1", family: '"Fraunces", Georgia, serif' }]).length === 1,
  );
  expect(
    "flags a bare serif fallback",
    serifHeadingProblems([{ label: "h1", family: "Times New Roman" }]).length === 1,
  );
  expect(
    "accepts Baloo 2 with a sans fallback",
    serifHeadingProblems([
      { label: "h1", family: '"Baloo 2", "Baloo 2 Fallback", system-ui, sans-serif' },
    ]).length === 0,
  );
  expect("flags a 30px target", targetProblems([{ label: "b", w: 30, h: 30 }]).length === 1);
  expect("accepts 44px", targetProblems([{ label: "b", w: 44, h: 44 }]).length === 0);
  expect("flags a font that did not load", fontProblems(["Nunito"]).length === 1);
  return fail;
}
