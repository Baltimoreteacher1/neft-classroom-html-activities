// Fluency Lab 4.0 illustration library: every SVG is well-formed, accessible, palette-only, self-contained,
// id-safe, small, distinct where it must be, and translated. Run: node tools/fluency-art.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { contrast, parseColor, toHsl } from "./lib/color-math.mjs";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });

const lab = new URL("../math/fluency-lab/", import.meta.url);
const art = await import(new URL("illustrations.js", lab));
const { ALL_SKILLS } = await import(new URL("problem-bank.js", lab));
const { STRAND_MOTIF, MOTIF_KEYS } = await import(new URL("art/motifs.js", lab));
const { setLang } = await import(new URL("i18n.js", lab));

const BUDGET = 8 * 1024;
const parser = new new JSDOM("").window.DOMParser();
// Palette comes from ds4.css itself, not from the art code, so a drifting colour fails here.
const ds4 = readFileSync(new URL("ds4.css", lab), "utf8");
const PALETTE = new Set(
  [...ds4.matchAll(/#[0-9a-fA-F]{3,6}\b/g)]
    .map((m) => parseColor(m[0]))
    .map((c) => `${c.r},${c.g},${c.b}`),
);
const ALLOWED_KEYWORDS = new Set(["none", "currentcolor", "transparent"]);
const failures = [];
const fail = (name, message) => failures.push(`${name}: ${message}`);
const check = (name, condition, message) => condition || fail(name, message);

const parse = (name, svg) => {
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const error = doc.querySelector("parsererror");
  if (error) {
    fail(name, `not well-formed XML: ${error.textContent.slice(0, 80)}`);
    return null;
  }
  return doc.documentElement;
};
const colourLiterals = (svg) => {
  const out = [];
  for (const m of svg.matchAll(/\b(?:fill|stroke|stop-color|flood-color|color)="([^"]*)"/g))
    out.push(m[1]);
  for (const m of svg.matchAll(/style="([^"]*)"/g))
    for (const p of m[1].matchAll(/(?:fill|stroke|color|background)\s*:\s*([^;]+)/g))
      out.push(p[1].trim());
  return out;
};
const stripColours = (svg) =>
  svg
    .replace(/#[0-9a-fA-F]{3,6}\b/g, "#")
    .replace(/id="[^"]*"/g, "")
    .replace(/#[\w-]+-(?=\w)/g, "#");

function validate(name, svg, { prefix, decorative }) {
  check(
    name,
    Buffer.byteLength(svg) <= BUDGET,
    `${Buffer.byteLength(svg)} bytes exceeds ${BUDGET}`,
  );
  const root = parse(name, svg);
  if (!root) return;
  check(name, root.localName === "svg", "root is not <svg>");
  const vb = (root.getAttribute("viewBox") || "").split(/\s+/).map(Number);
  check(
    name,
    vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0,
    "missing or bad viewBox",
  );
  check(
    name,
    Number(root.getAttribute("width")) > 0 && Number(root.getAttribute("height")) > 0,
    "missing width/height",
  );
  check(
    name,
    !root.hasAttribute("preserveAspectRatio") ||
      root.getAttribute("preserveAspectRatio") !== "none",
    "stretches",
  );
  // Accessibility: decorative = hidden and unnamed; otherwise role=img with a non-empty <title> as first child.
  const title = root.querySelector(":scope > title");
  if (decorative) {
    check(name, root.getAttribute("aria-hidden") === "true", "decorative SVG lacks aria-hidden");
    check(name, !title && !root.hasAttribute("role"), "decorative SVG still has a name or role");
  } else {
    check(name, root.getAttribute("role") === "img", "missing role=img");
    check(
      name,
      title && title.textContent.trim().length > 3 && root.firstElementChild === title,
      "missing first-child <title>",
    );
    check(name, !root.hasAttribute("aria-hidden"), "named SVG is aria-hidden");
  }
  check(
    name,
    root.getAttribute("focusable") !== "true" && !root.querySelector("a,[tabindex],button"),
    "focusable content in a picture",
  );
  // Forbidden and foreign content.
  for (const tag of [
    "image",
    "foreignObject",
    "script",
    "text",
    "tspan",
    "style",
    "link",
    "iframe",
    "use[href^=http]",
  ])
    check(name, !root.querySelector(tag), `<${tag}> is not allowed`);
  check(
    name,
    /forced-color-adjust:\s*none/.test(root.getAttribute("style") || ""),
    "no forced-colors guard",
  );
  const body = svg.replace(/<title>[\s\S]*?<\/title>/, "");
  check(name, !/[^\x00-\x7f]/.test(body), "non-ASCII character outside the <title>");
  check(
    name,
    !/\p{Extended_Pictographic}|[←-⯿\u{1f000}-\u{1faff}]/u.test(svg),
    "emoji or symbol character",
  );
  // Self-contained: the only absolute URL is the SVG namespace; every reference is a local fragment.
  const urls = svg.match(/https?:\/\/[^\s"')]+/g) || [];
  check(
    name,
    urls.every((u) => u === "http://www.w3.org/2000/svg"),
    `external URL ${urls.find((u) => u !== "http://www.w3.org/2000/svg")}`,
  );
  check(name, !/@import|data:|xlink:href|src=/.test(svg), "external or embedded resource");
  for (const el of root.querySelectorAll("[href]"))
    check(name, /^#[\w-]+$/.test(el.getAttribute("href")), `href ${el.getAttribute("href")}`);
  for (const m of svg.matchAll(/url\(([^)]*)\)/g))
    check(name, /^#[\w-]+$/.test(m[1]), `url(${m[1]}) is not local`);
  // Colours: palette only, never violet/purple/indigo/magenta (hue 255-335), no named colours.
  for (const literal of colourLiterals(svg)) {
    if (ALLOWED_KEYWORDS.has(literal.toLowerCase())) continue;
    if (/^url\(#[\w-]+\)$/.test(literal)) continue;
    const c = parseColor(literal);
    if (!c) {
      fail(name, `unknown colour "${literal}"`);
      continue;
    }
    check(name, PALETTE.has(`${c.r},${c.g},${c.b}`), `off-palette colour ${literal}`);
    const { h, s, l } = toHsl(c);
    check(
      name,
      !(s > 0.15 && l > 0.03 && l < 0.97 && h >= 255 && h <= 335),
      `forbidden hue ${literal}`,
    );
  }
  check(
    name,
    !/purple|violet|indigo|magenta|fuchsia|plum|orchid|lavender/i.test(
      svg.replace(/<title>[\s\S]*?<\/title>/, ""),
    ),
    "purple-family colour word",
  );
  // Ids: unique, prefixed, and every reference resolves.
  const ids = [...root.querySelectorAll("[id]")].map((e) => e.getAttribute("id"));
  check(name, new Set(ids).size === ids.length, "duplicate ids");
  check(
    name,
    ids.every((id) => id.startsWith(`${prefix}-`)),
    `an id lacks the ${prefix}- prefix`,
  );
  const refs = [...svg.matchAll(/url\(#([\w-]+)\)/g)]
    .map((m) => m[1])
    .concat([...root.querySelectorAll("[href]")].map((e) => e.getAttribute("href").slice(1)));
  for (const ref of refs) check(name, ids.includes(ref), `reference #${ref} does not resolve`);
  // Opaque backing so the picture reads on any page or forced-colors canvas.
  const first = [...root.children].find((e) => !["title", "defs"].includes(e.localName));
  const solid = (el) => el && el.getAttribute("fill") && el.getAttribute("fill") !== "none";
  check(
    name,
    solid(first) ||
      solid(first?.firstElementChild) ||
      solid(first?.firstElementChild?.firstElementChild),
    "no opaque backing shape",
  );
  return root;
}

// 1. Every indexed illustration, light default and decorative.
const entries = Object.entries(art.ILLUSTRATION_INDEX);
check("index", entries.length >= 150, `only ${entries.length} entries`);
const all = [];
const seenIds = new Set();
for (const [name, entry] of entries) {
  check(
    name,
    typeof entry.factory === "function" && entry.description && entry.group,
    "incomplete index entry",
  );
  const prefix = `t${all.length}`;
  const svg = entry.factory({ idPrefix: prefix });
  all.push(svg);
  const root = validate(name, svg, { prefix, decorative: false });
  validate(
    `${name} (decorative)`,
    entry.factory({ idPrefix: `d${all.length}`, decorative: true }),
    { prefix: `d${all.length}`, decorative: true },
  );
  for (const el of root?.querySelectorAll("[id]") || []) {
    check(name, !seenIds.has(el.id), `id ${el.id} repeats across illustrations`);
    seenIds.add(el.id);
  }
  check(name, entry.factory({ idPrefix: prefix }) === svg, "same input gave different output");
  check(
    name,
    new RegExp(
      `width="${Math.round(entry.factory({ size: 77, idPrefix: prefix }).match(/width="(\d+)"/)[1])}"`,
    ).test(entry.factory({ size: 77, idPrefix: prefix })) &&
      entry.factory({ size: 77, idPrefix: prefix }).includes('width="77"'),
    "size option ignored",
  );
}
// A page full of illustrations: one parse of every SVG concatenated must have globally unique ids.
const page = parser.parseFromString(
  `<root xmlns="http://www.w3.org/2000/svg">${all.join("")}</root>`,
  "image/svg+xml",
);
check("page", !page.querySelector("parsererror"), "concatenated page is not well-formed");
const pageIds = [...page.querySelectorAll("[id]")].map((e) => e.id);
check("page", new Set(pageIds).size === pageIds.length, "ids collide when many SVGs share a page");
// Omitted idPrefix must still produce fresh ids per call.
const a = art.badgeArt("streak-7", { earned: true });
const b = art.badgeArt("streak-7", { earned: true });
check("auto-prefix", a !== b || !/id="/.test(a), "default idPrefix repeats between calls");
const pa = art.pathwayArt(["new", "mastered"]);
const pb = art.pathwayArt(["new", "mastered"]);
check(
  "auto-prefix",
  [...pa.matchAll(/id="([^"]+)"/g)].every(([, id]) => !pb.includes(`id="${id}"`)),
  "default pathway ids collide",
);

// 2. Skills: every one of the 96 gets valid art, one motif per strand family, grade accent differs.
check("skills", ALL_SKILLS.length === 96, `expected 96 skills, found ${ALL_SKILLS.length}`);
const strands = [...new Set(ALL_SKILLS.map((s) => s.strand))];
for (const strand of strands)
  check("strand map", STRAND_MOTIF[strand], `strand "${strand}" has no illustration`);
for (const key of Object.values(STRAND_MOTIF))
  check("strand map", MOTIF_KEYS.includes(key), `motif ${key} is not drawn`);
const byMotif = new Map();
for (const skill of ALL_SKILLS) {
  const svg = art.skillArt(skill, { idPrefix: "sk" });
  validate(`skill ${skill.id}`, svg, { prefix: "sk", decorative: false });
  const key = STRAND_MOTIF[skill.strand];
  if (!byMotif.has(key)) byMotif.set(key, new Map());
  byMotif.get(key).set(skill.grade, svg);
}
check("skills", byMotif.size >= 20, `only ${byMotif.size} distinct motifs across the strands`);
const sampleGrade = [...byMotif.values()].map((m) => [...m.values()][0]);
check(
  "skills",
  new Set(sampleGrade.map((s) => s.replace(/<title>.*?<\/title>/, ""))).size === byMotif.size,
  "two strand families share identical art",
);
for (const [key, grades] of byMotif) {
  if (grades.size > 1)
    check(
      `skill ${key}`,
      new Set(grades.values()).size === grades.size,
      "different grades produce identical art",
    );
}
const strandsDrawn = new Set(strands.map((s) => art.strandArt(s, { idPrefix: "x" })));
check("strandArt", strandsDrawn.size >= 20, "strandArt does not separate the families");
const gradesDrawn = new Set(
  Array.from({ length: 9 }, (_, g) => art.gradeArt(g, { idPrefix: "g" })),
);
check("gradeArt", gradesDrawn.size === 9, "gradeArt: grades 0-8 are not all distinct");
check(
  "gradeArt",
  art.gradeArt(99, { idPrefix: "g" }) === art.gradeArt(8, { idPrefix: "g" }),
  "grade is not clamped",
);

// 3. Badges: >= 28 ids, each in both states, states differ and not by colour alone.
check(
  "badges",
  art.BADGE_IDS.length >= 28 && new Set(art.BADGE_IDS).size === art.BADGE_IDS.length,
  `${art.BADGE_IDS.length} badge ids`,
);
for (const group of ["strand-", "streak-", "remembered-"])
  check(
    "badges",
    art.BADGE_IDS.filter((i) => i.startsWith(group)).length >= (group === "strand-" ? 10 : 3),
    `too few ${group} badges`,
  );
for (const id of [
  "misconception-fixed",
  "review-keeper",
  "first-independent",
  "growth-spurt",
  "explain-it",
  "perseverance",
])
  check("badges", art.BADGE_IDS.includes(id), `missing badge ${id}`);
const titles = new Set();
for (const id of art.BADGE_IDS) {
  const earned = art.badgeArt(id, { earned: true, idPrefix: "b" });
  const open = art.badgeArt(id, { earned: false, idPrefix: "b" });
  validate(`${id} earned`, earned, { prefix: "b", decorative: false });
  validate(`${id} unearned`, open, { prefix: "b", decorative: false });
  check(id, earned !== open, "earned equals unearned");
  check(
    id,
    stripColours(earned) !== stripColours(open),
    "earned differs from unearned by colour alone",
  );
  check(
    id,
    /stroke-dasharray/.test(open) && !/#1fa6a2/i.test(open),
    "unearned should be dashed and colourless",
  );
  check(
    id,
    /M[\d.]+ [\d.]+L[\d.]+ [\d.]+L[\d.]+ [\d.]+/.test(earned) && earned.includes('fill="#1fa6a2"'),
    "earned lacks its check seal",
  );
  const t = (s) => s.match(/<title>(.*?)<\/title>/)[1];
  check(
    id,
    /earned/.test(t(earned)) && /not yet earned/.test(t(open)) && !/not yet/.test(t(earned)),
    "titles do not state the earned state",
  );
  check(id, !titles.has(t(earned)), "duplicate badge title");
  titles.add(t(earned));
  check(
    id,
    art
      .badgeArt(id, { earned: true, decorative: true, idPrefix: "b" })
      .includes('aria-hidden="true"'),
    "decorative badge",
  );
}
check(
  "badgeArt",
  art.badgeArt("not-a-badge", { idPrefix: "q" }).includes("<svg"),
  "unknown badge id should still render",
);
for (const id of art.BADGE_IDS)
  check(
    id,
    !/\b(point|score|speed|fast|timer|minute)/i.test(
      art.badgeArt(id, { earned: true, idPrefix: "b" }),
    ),
    "points or timer language",
  );

// 4. Pathway: four node states, distinct by shape (colours stripped), and cap.
const states = ["new", "developing", "proficient", "mastered"];
const symbols = Object.fromEntries(
  states.map((s) => [
    s,
    stripColours(
      art.pathwayArt([s], { idPrefix: "p" }).match(new RegExp(`<g id="p-${s}">(.*?)</g>`))?.[1] ||
        "",
    ),
  ]),
);
check(
  "pathway",
  new Set(Object.values(symbols)).size === 4 && states.every((s) => symbols[s].length > 20),
  "node states are not distinct by shape",
);
check(
  "pathway",
  /stroke-dasharray/.test(symbols.new) && !/stroke-dasharray/.test(symbols.mastered),
  "new node should be dashed",
);
for (const n of [0, 1, 2, 6, 12, 24, 40]) {
  const steps = Array.from({ length: n }, (_, i) => ({ state: states[i % 4] }));
  const svg = art.pathwayArt(steps, { idPrefix: "p" });
  validate(`pathway ${n}`, svg, { prefix: "p", decorative: false });
  const uses = (svg.match(/<use /g) || []).length;
  check(`pathway ${n}`, uses === Math.min(24, n || 5), `${uses} nodes drawn for ${n} steps`);
}
check(
  "pathway",
  /4 steps: 1 new, 1 developing, 1 proficient, 1 mastered/.test(
    art.pathwayArt(states, { idPrefix: "p" }),
  ),
  "title does not count states",
);

// 5. Milestones, certificate, headers, spots.
check(
  "milestone",
  new Set([1, 2, 3, 4, 5].map((n) => stripColours(art.milestoneArt(n, { idPrefix: "m" })))).size ===
    5,
  "milestone levels are not distinct by shape",
);
check(
  "certificate",
  art
    .certificateFrame({ orientation: "portrait", idPrefix: "c" })
    .includes('viewBox="0 0 600 800"'),
  "portrait certificate",
);
const cert = art.certificateFrame({ idPrefix: "c" });
check(
  "certificate",
  (cert.match(/fill="#[0-9a-f]{3,6}"/gi) || []).every((f) => /#fff/i.test(f)),
  "certificate must be ink-light (outlines and white only)",
);
check("certificate", !/<text|fill="#(?!fff)/i.test(cert), "certificate frame fills");
for (const kind of [
  "dashboard",
  "practice",
  "review",
  "challenge",
  "games",
  "writing",
  "progress",
  "teacher",
  "family",
])
  check("headers", art.ILLUSTRATION_INDEX[`header/${kind}`], `header ${kind}`);
check(
  "headers",
  new Set(
    Object.keys(art.ILLUSTRATION_INDEX)
      .filter((n) => n.startsWith("header/"))
      .map((n) => art.ILLUSTRATION_INDEX[n].factory({ idPrefix: "h" })),
  ).size === 9,
  "headers not distinct",
);
for (const [group, kinds] of Object.entries({
  empty: ["start", "no-results", "all-done", "offline"],
  family: ["home", "together", "routine", "celebrate"],
  report: ["student", "teacher", "family"],
})) {
  const fn = { empty: art.emptyStateArt, family: art.familyArt, report: art.reportHeaderArt }[
    group
  ];
  check(
    group,
    new Set(kinds.map((k) => fn(k, { idPrefix: "z" }))).size === kinds.length,
    `${group} kinds are not distinct`,
  );
}
check(
  "onboarding",
  new Set([1, 2, 3, 4].map((s) => art.onboardingArt(s, { idPrefix: "o" }))).size === 4,
  "onboarding steps not distinct",
);

// 6. Contrast: ink strokes on every panel tint reach 3:1 (graphics), grey unearned ink on its plate too.
const hex = (h) => parseColor(h);
for (const tint of ["#dff3f1", "#e3eef8", "#fff4e0", "#f7f4ec", "#efeadc", "#fff"]) {
  check("contrast", contrast(hex("#17324d"), hex(tint)) >= 7, `navy on ${tint}`);
  check("contrast", contrast(hex("#52606d"), hex(tint)) >= 4.5, `grey ink on ${tint}`);
}

// 7. Spanish: every title translates (English and Spanish titles differ), and the Spanish keeps its accents.
const titleOf = (svg) => svg.match(/<title>(.*?)<\/title>/)?.[1];
const english = Object.fromEntries(
  entries.map(([n, e]) => [n, titleOf(e.factory({ idPrefix: "l" }))]),
);
setLang("es", { persist: false });
const spanish = Object.fromEntries(
  entries.map(([n, e]) => [n, titleOf(e.factory({ idPrefix: "l" }))]),
);
for (const [n] of entries) {
  check(n, spanish[n] && spanish[n] !== english[n], `no Spanish title (${english[n]})`);
  check(n, !/\{|\}/.test(spanish[n]), "unfilled placeholder in the Spanish title");
  validate(`${n} (es)`, art.ILLUSTRATION_INDEX[n].factory({ idPrefix: "l" }), {
    prefix: "l",
    decorative: false,
  });
}
setLang("en", { persist: false });

if (failures.length) {
  console.error(failures.slice(0, 60).join("\n"));
  console.error(`fluency-art: ${failures.length} problem(s)`);
  process.exit(1);
}
console.log(
  `fluency-art: ${entries.length} illustrations (${art.BADGE_IDS.length} badges x 2 states, ${ALL_SKILLS.length} skills, ${byMotif.size} strand families) valid, accessible, palette-only, id-safe, under ${BUDGET / 1024}KB, with Spanish titles`,
);
