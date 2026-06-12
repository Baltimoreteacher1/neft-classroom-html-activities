#!/usr/bin/env node
/**
 * build-axiom-episodes.mjs
 * ------------------------------------------------------------------
 * Generates Axiom City *episode* graphic novels by slicing the
 * already-authored, math-correct, no-lock *volume* graphic novels.
 *
 * An episode = a re-framed slice of one volume covering a subset of its
 * reader gates (one lesson cluster), wrapped with an episode cover,
 * intro page, journal and certificate. The engine, CSS, accessibility,
 * save/resume and (verbatim) gate math come straight from the volume —
 * so episodes can never drift from the canonical source.
 *
 * Locks: the canonical engine already returns null from blockedBy()
 * (locks removed 2026-06-11), so generated episodes are free-read by
 * construction — gates coach via hints + Ask VEX but never block a page.
 *
 * Usage:  node tools/build-axiom-episodes.mjs            (build all)
 *         node tools/build-axiom-episodes.mjs u7e1 u8e2  (build some)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AC = join(ROOT, "graphic-novels", "axiom-city");
const OUT = join(AC, "episodes");

/* ============================ EPISODE SPECS ============================ */
/* gates: which volume reader gates this episode carries (in order).
 * pages: volume PAGE indices to splice (scene + gate pages for those gates).
 * Volume page map is identical across all 10 volumes:
 *   p1,2=Ch1 p3=g1 | p4=Ch2 p5=g2 | p6=Ch3 p7=g3 | p8=Ch4 p9=g4
 *   p10=Ch5 p11=g5 | p12=boss setup p13=boss p14=resolution            */
const VOL = (n) => `axiom-city-vol-${String(n).padStart(2, "0")}-`;
const SPECS = [
  /* ---- UNIT 1 · The Pattern Engine (review bridge + volume intro) ---- */
  { slug:"u1e1", unit:1, ep:1, num:101, vol:1, gates:["g1","g2"], pages:[1,2,3,4,5],
    title:"Benchmark &amp; <em>Brass</em>", file:"axiom-city-u1-e1-benchmark-and-brass.html",
    lessons:"Review: Fractions &amp; Decimals", topic:"REVIEW · FRACTIONS &amp; DECIMALS",
    eplabel:"E1 · Benchmark &amp; Brass", epcovers:"½-benchmark fractions &middot; add/subtract decimals" },
  { slug:"u1e2", unit:1, ep:2, num:102, vol:1, gates:["g3","g4","g5","boss"], pages:[6,7,8,9,10,11,12,13,14],
    title:"Sequences &amp; <em>Cubes</em>", file:"axiom-city-u1-e2-sequences-and-cubes.html",
    lessons:"Patterns &amp; Volume (intro)", topic:"PATTERNS &amp; VOLUME",
    eplabel:"E2 · Sequences &amp; Cubes", epcovers:"numerical patterns &middot; two-rule sequences &middot; V = l&times;w&times;h" },

  /* ---- UNIT 7 · Below Zero (6.NS.C.5–8, 6.G.A.3) ---- */
  { slug:"u7e1", unit:7, ep:1, num:701, vol:7, gates:["g1","g2"], pages:[1,2,3,4,5],
    title:"Lights <em>Out</em>", file:"axiom-city-u7-e1-lights-out.html",
    lessons:"Lessons 7-1 &amp; 7-2", topic:"INTEGERS &middot; ORDERING",
    eplabel:"E1 · Lights Out", epcovers:"integers &amp; opposites &middot; ordering rationals &middot; 6.NS.C.5–7" },
  { slug:"u7e2", unit:7, ep:2, num:702, vol:7, gates:["g3"], pages:[6,7],
    title:"Signal in the <em>Snow</em>", file:"axiom-city-u7-e2-signal-in-the-snow.html",
    lessons:"Lesson 7-3", topic:"ABSOLUTE VALUE",
    eplabel:"E2 · Signal in the Snow", epcovers:"absolute value as distance &middot; 6.NS.C.7" },
  { slug:"u7e3", unit:7, ep:3, num:703, vol:7, gates:["g4","g5","boss"], pages:[8,9,10,11,12,13,14],
    title:"The Grid <em>Map</em>", file:"axiom-city-u7-e3-the-grid-map.html",
    lessons:"Lessons 7-4, 7-5 &amp; 7-6", topic:"COORDINATE PLANE",
    eplabel:"E3 · The Grid Map", epcovers:"four quadrants &middot; distance &middot; polygons &middot; 6.NS.C.6/8 · 6.G.A.3" },

  /* ---- UNIT 8 · The Balance Vault (6.EE.B.5–8) ---- */
  { slug:"u8e1", unit:8, ep:1, num:801, vol:8, gates:["g1","g2"], pages:[1,2,3,4,5],
    title:"The <em>Antechamber</em>", file:"axiom-city-u8-e1-the-antechamber.html",
    lessons:"Lessons 8-1 &amp; 8-2", topic:"SOLUTIONS &middot; ONE-STEP + / −",
    eplabel:"E1 · The Antechamber", epcovers:"solutions by substitution &middot; one-step + and − &middot; 6.EE.B.5/7" },
  { slug:"u8e2", unit:8, ep:2, num:802, vol:8, gates:["g3"], pages:[6,7],
    title:"The Gear <em>Locks</em>", file:"axiom-city-u8-e2-the-gear-locks.html",
    lessons:"Lesson 8-3", topic:"ONE-STEP × / ÷",
    eplabel:"E2 · The Gear Locks", epcovers:"one-step × and ÷ equations &middot; 6.EE.B.6/7" },
  { slug:"u8e3", unit:8, ep:3, num:803, vol:8, gates:["g4","g5","boss"], pages:[8,9,10,11,12,13,14],
    title:"The Fog <em>Gallery</em>", file:"axiom-city-u8-e3-the-fog-gallery.html",
    lessons:"Lessons 8-4, 8-5 &amp; 8-6", topic:"INEQUALITIES",
    eplabel:"E3 · The Fog Gallery", epcovers:"write &amp; graph inequalities &middot; solution sets &middot; 6.EE.B.8" },

  /* ---- UNIT 9 · Cause & Effect (6.EE.C.9) ---- */
  { slug:"u9e1", unit:9, ep:1, num:901, vol:9, gates:["g1","g2"], pages:[1,2,3,4,5],
    title:"Lines That <em>Talk</em>", file:"axiom-city-u9-e1-lines-that-talk.html",
    lessons:"Lessons 9-1 &amp; 9-2", topic:"VARIABLES &middot; GRAPHS",
    eplabel:"E1 · Lines That Talk", epcovers:"independent &amp; dependent variables &middot; reading graphs &middot; 6.EE.C.9" },
  { slug:"u9e2", unit:9, ep:2, num:902, vol:9, gates:["g3","g4","g5","boss"], pages:[6,7,8,9,10,11,12,13,14],
    title:"The Rule in the <em>Table</em>", file:"axiom-city-u9-e2-the-rule-in-the-table.html",
    lessons:"Lessons 9-3, 9-4 &amp; 9-5", topic:"TABLES → EQUATIONS",
    eplabel:"E2 · The Rule in the Table", epcovers:"tables to equations &middot; coordinate pairs &middot; apply &middot; 6.EE.C.9" },

  /* ---- UNIT 10 · Boundless (capstone remix) ---- */
  { slug:"u10e1", unit:10, ep:1, num:1001, vol:10, gates:["g1","g2","g3"], pages:[1,2,3,4,5,6,7],
    title:"Festival to Night <em>Market</em>", file:"axiom-city-u10-e1-festival-to-night-market.html",
    lessons:"Capstone Remix · Part 1", topic:"STATS &middot; RATIOS &middot; PERCENT",
    eplabel:"E1 · Festival to Night Market", epcovers:"statistics, ratios &amp; percent remix &middot; Units 2–4" },
  { slug:"u10e2", unit:10, ep:2, num:1002, vol:10, gates:["g4","g5","boss"], pages:[8,9,10,11,12,13,14],
    title:"Brightside to <em>Boundless</em>", file:"axiom-city-u10-e2-brightside-to-boundless.html",
    lessons:"Capstone Remix · Part 2", topic:"GEOMETRY &middot; EXPRESSIONS &middot; FINALE",
    eplabel:"E2 · Brightside to Boundless", epcovers:"area, volume, expressions &amp; distance remix &middot; Units 5–7 + finale" },
];

/* ============================ HELPERS ============================ */
function sectionSplit(file) {
  const bodyAt = file.indexOf("<body>");
  const head = file.slice(0, bodyAt);
  const cover0 = file.indexOf("<!-- ============ COVER");
  const hud0 = file.indexOf("<!-- ============ HUD");
  const book0 = file.indexOf("<!-- ============ BOOK");
  const modal0 = file.indexOf("<!-- ============ MODALS");
  const firstScript = file.indexOf("<script>", modal0);
  const defs = file.slice(bodyAt + "<body>".length, cover0);
  const cover = file.slice(cover0, hud0);
  const hud = file.slice(hud0, book0);
  const book = file.slice(book0, modal0);
  const modals = file.slice(modal0, firstScript);
  // engine script = the <script> containing the engine header
  const engIdx = file.indexOf("AXIOM CITY ENGINE v1.0");
  const engOpen = file.lastIndexOf("<script>", engIdx);
  const engClose = file.indexOf("</script>", engIdx) + "</script>".length;
  const engine = file.slice(engOpen, engClose);
  for (const [k, v] of Object.entries({ head, defs, cover, hud, book, modals, engine }))
    if (!v || !v.trim()) throw new Error("section missing: " + k);
  return { head, defs, cover, hud, book, modals, engine };
}

function evalContent(file) {
  const cs = file.indexOf("===== CONTENT START");
  const codeStart = file.indexOf("*/", cs) + 2;
  const ce = file.indexOf("===== CONTENT END");
  const codeEnd = file.lastIndexOf("/*", ce);
  const code = file.slice(codeStart, codeEnd);
  const fn = new Function(code + "\n;return {VOLUME,BADGES,PAGES,GATES,TEACHER};");
  // also capture the scene-helper block (between BADGES and PAGES) for re-use
  const badges0 = file.indexOf("const BADGES", codeStart);
  const badgesEnd = file.indexOf("];", badges0) + 2;
  const pages0 = file.indexOf("const PAGES", badgesEnd);
  const helpers = file.slice(badgesEnd, pages0).trim();
  return { data: fn(), helpers };
}

const J = (v) => JSON.stringify(v);
const guard = (s) => s.replace(/<\/script>/gi, "<\\/script>");

function serializeGate(id, g) {
  let s = `"${id}":{`;
  s += `title:${J(g.title)}, icon:${J(g.icon)}, prompt:${J(g.prompt)},`;
  if (g.hints) s += `hints:${J(g.hints)},`;
  if (g.worked) s += `worked:${J(g.worked)},`;
  s += g.render.toString();
  s += `}`;
  return s;
}

function serializePage(p) {
  return `{ ch:${J(p.ch)}, ${p.gate ? `gate:${J(p.gate)}, ` : ""}html:${J(p.html)} }`;
}

const GATE_LABEL = { g1: "Gate 1", g2: "Gate 2", g3: "Gate 3", g4: "Gate 4", g5: "Gate 5", boss: "Boss" };

function buildIntroPage(spec, vmeta) {
  const lineup = ["#sym-maya", "#sym-theo", "#sym-zara", "#sym-dev"]
    .map((s, i) => `<g transform="translate(${20 + i * 92},6) scale(.74)"><use href="${s}"/></g>`).join("");
  return {
    ch: `Unit ${spec.unit} · Episode ${spec.ep}`,
    html: `
  <div style="text-align:center;margin-top:8px"><div class="kicker">EduWonderLab Presents</div>
  <h2 class="splashtitle" style="margin:8px 0">${spec.title.toUpperCase().replace("<EM>", "<em>").replace("</EM>", "</em>")}</h2>
  <div class="caption" style="display:inline-block">${spec.lessons} &mdash; part of the <b>${vmeta.title}</b> arc. ${spec.epcovers}. Read straight through: each reader gate coaches you with hints and a worked example, but never blocks the page.</div></div>
  <div class="panel">${`<svg class="scene" viewBox="0 0 400 120" role="img" preserveAspectRatio="xMidYMid meet"><rect width="400" height="120" fill="#141031"/><g transform="translate(330,2) scale(.6)"><use href="#sym-vex"/></g>${lineup}</svg>`}
    <div class="balloon vex" style="top:6px;left:10px;max-width:64%"><span class="who">VEX</span>Episode ${spec.ep}. Same crew, same city — one focused stretch of the case. Turn the page when you're ready.</div>
  </div>`,
  };
}

function buildJournalPage(spec, vmeta, rows) {
  const items = rows.map(r => `<div class="jrow"><b>${r[0]}</b><span>${r[1]}</span></div>`).join("");
  return {
    ch: "End Matter · Ada Vex's Journal",
    html: `
  <h2 class="splashtitle" style="font-size:1.4rem">ADA VEX'S <em>JOURNAL</em></h2>
  <div class="journal"><h4>${spec.lessons} &mdash; what this stretch of the case taught us</h4>
    ${items}
  </div>
  <div class="caption">The full story — <b>${vmeta.title}</b> — is glowing at the city gate. — A.V.</div>`,
  };
}

function buildCertPage(spec, vmeta) {
  return {
    ch: "End Matter · Certificate",
    html: `
  <div id="certificate">
    <div class="kicker">Axiom City · EduWonderLab</div>
    <h3>READER CERTIFICATE</h3>
    <p style="font:600 .9rem Georgia,serif">This certifies that</p>
    <input id="certName" maxlength="40" placeholder="write your name" aria-label="Your name for the certificate">
    <p style="font:600 .9rem Georgia,serif">completed <b>Unit ${spec.unit} · Episode ${spec.ep}: ${spec.title.replace(/<\/?em>/g, "")}</b> in the ${vmeta.title} arc, and proved mastery over ${spec.epcovers.replace(/&middot;/g, "·")}.</p>
    <div class="certbadges" id="certBadges"></div>
    <button class="gatecheck" id="printCert" style="align-self:center">PRINT CERTIFICATE</button>
  </div>
  <div class="caption" style="text-align:center">Next up: the full anchor volume — ${vmeta.title}.</div>`,
  };
}

function buildContent(spec, data, helpers) {
  const { VOLUME, BADGES, PAGES, GATES, TEACHER } = data;
  const gateSet = new Set(spec.gates);
  // VOLUME (episode override)
  const epVol = {
    num: spec.num, slug: spec.slug,
    title: spec.title.replace(/<\/?em>/g, ""),
    unit: `Unit ${spec.unit} · Episode ${spec.ep} · ${spec.lessons.replace(/&amp;/g, "&")}`,
    accent: VOLUME.accent,
    nextTeaser: `THE FULL STORY — ${VOLUME.title.toUpperCase()}`,
  };
  // BADGES subset
  const epBadges = BADGES.filter(b => gateSet.has(b.id));
  // PAGES: intro + sliced volume pages + journal + cert
  const sliced = spec.pages.map(i => PAGES[i]).filter(Boolean);
  const labels = spec.gates.map(g => GATE_LABEL[g]);
  const stdRows = TEACHER.standards.filter(r => labels.some(l => r[2].includes(l)) || /All gates|Hint ladders|All gates:/i.test(r[2]));
  const journalRows = stdRows.map(r => [r[0], r[1]]);
  const introP = buildIntroPage(spec, VOLUME);
  const journalP = buildJournalPage(spec, VOLUME, journalRows);
  const certP = buildCertPage(spec, VOLUME);
  const epPages = [introP, ...sliced, journalP, certP];
  // GATES subset
  const gateEntries = spec.gates.map(id => serializeGate(id, GATES[id])).join(",\n");
  // TEACHER subset
  const epStandards = stdRows;
  const epAnswers = TEACHER.answers.filter(r => labels.some(l => r[0].includes(l)));
  const teacher = {
    suggested: `Use as the Episode ${spec.ep} slice of ${VOLUME.title} — a focused 1-day read covering ${spec.lessons.replace(/&amp;/g, "&")}. Whole-class on projector, pairs, or independent. Progress saves on the device. For the full arc, open the anchor volume ${VOLUME.title}.`,
    standards: epStandards,
    answers: epAnswers,
  };

  return guard(`
/* ===== CONTENT START (episode — generated from ${VOL(spec.vol)} by tools/build-axiom-episodes.mjs) ===== */
const VOLUME = ${JSON.stringify(epVol, null, 2).replace(/"(\w+)":/g, "$1:")};

const BADGES = ${JSON.stringify(epBadges)};

/* scene helpers (verbatim from source volume) */
${helpers}

function mkfeed(el,msg,ok){el.textContent=msg;el.className="gatefeedback "+(ok?"good":"bad");}

const PAGES = [
${epPages.map(serializePage).join(",\n")}
];

const GATES = {
${gateEntries}
};

const TEACHER = ${JSON.stringify(teacher, null, 2).replace(/"(\w+)":/g, "$1:")};
/* ===== CONTENT END ===== */
`);
}

/* cover/hud/title text rewrites */
function rewriteCover(cover, spec, vmeta) {
  let c = cover;
  c = c.replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${spec.title.replace(/&amp;/g, "&").replace(" ", "<br>")}</h1>`);
  c = c.replace(/<span class="vol">[\s\S]*?<\/span>/, `<span class="vol">UNIT ${spec.unit} · EP ${spec.ep} · ${spec.topic}</span>`);
  c = c.replace(/<div id="coverBottom">[\s\S]*?<\/div>/, `<div id="coverBottom"><span>AN INTERACTIVE<br>GRAPHIC NOVEL EPISODE</span><span>GRADE 6 · UNIT ${spec.unit}<br>EDUWONDERLAB</span></div>`);
  c = c.replace(/aria-label="Cover of[\s\S]*?">/, `aria-label="Cover of Axiom City Unit ${spec.unit}, Episode ${spec.ep}: ${spec.title.replace(/<\/?em>/g, "")}, part of the ${vmeta.title} arc.">`);
  return c;
}
function rewriteHud(hud, spec) {
  return hud.replace(/<div class="brand">AXIOM CITY<small>[\s\S]*?<\/small><\/div>/,
    `<div class="brand">AXIOM CITY<small>U${spec.unit} · E${spec.ep} · ${spec.title.replace(/<\/?em>/g, "").toUpperCase()}</small></div>`);
}
function rewriteModals(modals, spec) {
  return modals.replace(/<h2 id="tmTitle">[\s\S]*?<\/h2>/, `<h2 id="tmTitle">Teacher Guide — U${spec.unit} · E${spec.ep}</h2>`);
}
function rewriteHead(head, spec, vmeta) {
  let h = head;
  // episodes are fully self-contained like the units 2–6 episodes: drop the
  // volume's injected shared save/resume stylesheet (the Axiom engine has its
  // own per-device storage; no orphan asset reference).
  h = h.replace(/\s*<!-- nsr-injected:begin[\s\S]*?nsr-injected:end -->/g, "");
  const plain = spec.title.replace(/<\/?em>/g, "").replace(/&amp;/g, "&");
  h = h.replace(/<title>[\s\S]*?<\/title>/,
    `<title>Axiom City U${spec.unit}·E${spec.ep} — ${plain} | Interactive Graphic Novel Episode | ${spec.topic.replace(/&middot;/g, "·")}</title>`);
  h = h.replace(/<meta name="description" content="[\s\S]*?">/,
    `<meta name="description" content="Interactive Grade 6 math graphic novel episode (${spec.lessons.replace(/&amp;/g, "&")}) from the Axiom City ${vmeta.title} arc. Free-read, gates coach but never block. EduWonderLab.">`);
  return h;
}

/* ============================ MAIN ============================ */
const { readdirSync } = await import("node:fs");
function volFileFor(n) {
  const prefix = VOL(n);
  const f = readdirSync(AC).find(x => x.startsWith(prefix) && x.endsWith(".html"));
  if (!f) throw new Error("no volume file for unit " + n);
  return join(AC, f);
}

const only = process.argv.slice(2);
const targets = only.length ? SPECS.filter(s => only.includes(s.slug)) : SPECS;
let built = 0;
const cache = {};
for (const spec of targets) {
  const vpath = volFileFor(spec.vol);
  const file = (cache[vpath] ||= readFileSync(vpath, "utf8"));
  const sec = sectionSplit(file);
  const { data, helpers } = evalContent(file);
  const content = buildContent(spec, data, helpers);
  const html =
    rewriteHead(sec.head, spec, data.VOLUME) +
    "<body>" +
    sec.defs +
    rewriteCover(sec.cover, spec, data.VOLUME) +
    rewriteHud(sec.hud, spec) +
    sec.book +
    rewriteModals(sec.modals, spec) +
    "<script>" + content + "</script>\n" +
    sec.engine +
    "\n</body>\n</html>\n";
  const outPath = join(OUT, spec.file);
  writeFileSync(outPath, html);
  built++;
  console.log(`✓ ${spec.file}  (vol ${spec.vol}, gates ${spec.gates.join(",")}, ${html.length} bytes)`);
}
console.log(`\nBuilt ${built} episode(s).`);
