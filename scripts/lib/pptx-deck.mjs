/**
 * Editable PPTX notebook deck builder — models the 5.2 reference (13 notebook
 * slides), driven by lessons/<id>/config.json. Output opens fully editable in
 * Google Slides / PowerPoint. Static companion to the interactive HTML deck.
 */

// ── Theme (hex without #, PptxGenJS convention) ──
const T = {
  navy: '17324D',
  sand: 'F7F4EC',
  teal: '1FA6A2',
  tealLight: 'DFF2EE',
  amber: 'F2C15B',
  amberLight: 'FBEFD0',
  coral: 'FCE6DE',
  body: '24323F',
  white: 'FFFFFF',
  gray: '8A96A3',
  line: 'D6DBDF',
  red: 'C0392B',
  redBg: 'FDECEA',
  greenBg: 'E7F6F4',
};
const HEAD = 'Outfit';
const BODY = 'Hanken Grotesk';
const W = 10;
const H = 5.625;

// Per-unit accent so decks feel distinct but consistent.
const UNIT_ACCENTS = ['1FA6A2', '2E7D9A', 'C0654A', 'B0883B', '4F7A52', '7A5C8E', '1FA6A2', '2E7D9A', 'C0654A', 'B0883B'];
function accentForUnit(unit) {
  const n = parseInt(String(unit), 10);
  return UNIT_ACCENTS[(Number.isFinite(n) ? n - 1 : 0) % UNIT_ACCENTS.length] || T.teal;
}

// ── Low-level helpers ──
function panel(slide, pptx, x, y, w, h, fill = T.white, lineColor = T.line, radius = 0.08) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: radius,
    fill: { color: fill },
    line: lineColor ? { color: lineColor, width: 1 } : { type: 'none' },
    shadow: { type: 'outer', blur: 4, offset: 1, angle: 90, color: '1C2E42', opacity: 0.10 },
  });
}

function pill(slide, pptx, x, y, w, h, text, fill, color = T.white, size = 9) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: h / 2, fill: { color }, line: { type: 'none' } });
  slide.addText(text, { x, y, w, h, fontFace: HEAD, fontSize: size, bold: true, color, align: 'center', valign: 'middle', fill: { color }, line: { type: 'none' } });
  // overlay text color fix (fill already set above on shape; this text sets readable color)
}

function pillText(slide, x, y, w, h, text, bg, fg, size = 9) {
  slide.addText(text, {
    x, y, w, h, fontFace: HEAD, fontSize: size, bold: true, color: fg,
    align: 'center', valign: 'middle', fill: { color: bg }, line: { type: 'none' },
    rectRadius: h / 2, // ignored on text but harmless
  });
}

function header(slide, pptx, c, title) {
  slide.background = { color: T.sand };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.52, fill: { color: T.navy }, line: { type: 'none' } });
  slide.addText('NEFT TEACHER', { x: 0.3, y: 0, w: 2.4, h: 0.52, fontFace: HEAD, fontSize: 8.5, bold: true, color: 'BFE6E2', charSpacing: 1, valign: 'middle' });
  slide.addText(title, { x: 1.9, y: 0, w: 5.6, h: 0.52, fontFace: HEAD, fontSize: 15, bold: true, color: T.white, valign: 'middle' });
  pillText(slide, 8.05, 0.11, 1.0, 0.3, c.standard, c.accent, T.white, 9);
  // notebook spiral hint (left margin dots)
  for (let i = 0; i < 9; i++) {
    slide.addShape(pptx.ShapeType.ellipse, { x: 0.08, y: 0.75 + i * 0.52, w: 0.12, h: 0.12, fill: { color: 'CBD3D9' }, line: { type: 'none' } });
  }
  // footer
  slide.addText(`Reveal Math Grade 6  ·  Unit ${c.unit}  ·  Lesson ${c.lessonId}`, { x: 0.3, y: H - 0.32, w: 7, h: 0.28, fontFace: BODY, fontSize: 7.5, color: T.gray, valign: 'middle' });
  slide.addText(`${c.slideNum}`, { x: W - 0.8, y: H - 0.32, w: 0.5, h: 0.28, fontFace: HEAD, fontSize: 8, bold: true, color: T.gray, align: 'right', valign: 'middle' });
}

function sectionLabel(slide, x, y, w, text, bg, fg = T.white) {
  slide.addText(text, { x, y, w, h: 0.3, fontFace: HEAD, fontSize: 10, bold: true, color: fg, fill: { color: bg }, align: 'center', valign: 'middle' });
}

function lines(slide, x, y, w, count, gap = 0.32) {
  for (let i = 0; i < count; i++) {
    slide.addShape({ x, y: y + i * gap, w, h: 0 }, {});
  }
}
function writeLines(slide, pptx, x, y, w, count, gap = 0.3) {
  for (let i = 0; i < count; i++) {
    slide.addShape(pptx.ShapeType.line, { x, y: y + i * gap, w, h: 0, line: { color: 'C7CDD2', width: 0.75, dashType: 'dash' } });
  }
}

const esc = (s) => String(s == null ? '' : s);

// Phase keys in config (launch/explore/connect/reflect/practice) → student-facing
// titles. Falls back to a title-cased version of any unknown phase key.
const PHASE_TITLES = {
  launch: 'Launch',
  explore: 'Explore',
  connect: 'Connect',
  reflect: 'Reflect',
  practice: 'Practice',
};
function phaseTitle(phase) {
  const key = String(phase || '').trim().toLowerCase();
  if (PHASE_TITLES[key]) return PHASE_TITLES[key];
  if (!key) return 'Discussion';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

// ── Slide builders (each receives slide, pptx, content c) ──

function slideCover(slide, pptx, c) {
  slide.background = { color: T.sand };
  // left navy panel
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.1, h: H, fill: { color: T.navy }, line: { type: 'none' } });
  slide.addShape(pptx.ShapeType.ellipse, { x: 2.9, y: -0.7, w: 2.2, h: 2.2, fill: { color: c.accent, transparency: 65 }, line: { type: 'none' } });
  slide.addText('NEFT TEACHER', { x: 0.45, y: 0.4, w: 3.3, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: 'BFE6E2', charSpacing: 2 });
  slide.addText(c.themeEmoji || '📘', { x: 0.45, y: 0.85, w: 1.5, h: 0.9, fontSize: 44 });
  slide.addText(c.topic, { x: 0.45, y: 1.95, w: 3.3, h: 1.7, fontFace: HEAD, fontSize: 30, bold: true, color: T.white, valign: 'top', lineSpacingMultiple: 0.95 });
  pillText(slide, 0.45, 4.55, 1.3, 0.34, c.standard, c.accent, T.white, 10);
  slide.addText(`Unit ${c.unit}  ·  Lesson ${c.lessonId}`, { x: 1.85, y: 4.55, w: 2.1, h: 0.34, fontFace: BODY, fontSize: 10, color: 'BFE6E2', valign: 'middle' });

  // right notebook area
  panel(slide, pptx, 4.4, 0.45, 5.25, 1.55, T.white, T.line);
  slide.addText('My Math Notebook', { x: 4.65, y: 0.6, w: 4.8, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: T.navy });
  ['Name:', 'Date:', 'Period:'].forEach((lab, i) => {
    slide.addText(lab, { x: 4.65, y: 1.12 + i * 0.28, w: 0.8, h: 0.24, fontFace: BODY, fontSize: 10, bold: true, color: T.body, valign: 'middle' });
    slide.addShape(pptx.ShapeType.line, { x: 5.45, y: 1.32 + i * 0.28, w: 3.9, h: 0, line: { color: 'C7CDD2', width: 0.75 } });
  });

  panel(slide, pptx, 4.4, 2.2, 5.25, 1.25, T.tealLight, T.teal);
  slide.addText([{ text: 'I CAN…  ', options: { bold: true, color: c.accent } }, { text: '/ Yo puedo…', options: { italic: true, color: T.gray, fontSize: 9 } }], { x: 4.6, y: 2.3, w: 4.85, h: 0.3, fontFace: HEAD, fontSize: 11 });
  slide.addText(c.contentObj, { x: 4.6, y: 2.62, w: 4.85, h: 0.78, fontFace: BODY, fontSize: 11, color: T.navy, valign: 'top' });

  panel(slide, pptx, 4.4, 3.6, 5.25, 1.4, T.white, T.line);
  slide.addText([{ text: 'I WILL EXPLAIN…  ', options: { bold: true, color: c.accent } }, { text: '/ Objetivo de lenguaje', options: { italic: true, color: T.gray, fontSize: 9 } }], { x: 4.6, y: 3.7, w: 4.85, h: 0.3, fontFace: HEAD, fontSize: 11 });
  slide.addText(c.langObj, { x: 4.6, y: 4.02, w: 4.85, h: 0.92, fontFace: BODY, fontSize: 10.5, color: T.body, valign: 'top' });
}

function slideBeCurious(slide, pptx, c) {
  header(slide, pptx, c, 'Be Curious / Sé Curioso');
  // visual prompt left
  panel(slide, pptx, 0.45, 0.75, 4.55, 4.4, T.white, T.line);
  pillText(slide, 0.65, 0.92, 1.5, 0.3, 'VISUAL PROMPT', c.accent, T.white, 9);
  slide.addText(c.launchBadge, { x: 0.65, y: 1.32, w: 4.15, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: T.navy });
  slide.addText(c.launchNarrative, { x: 0.65, y: 1.65, w: 4.15, h: 1.7, fontFace: BODY, fontSize: 11.5, color: T.body, valign: 'top' });
  slide.addText('Jot your first idea:', { x: 0.65, y: 3.45, w: 4, h: 0.25, fontFace: BODY, fontSize: 9, italic: true, color: T.gray });
  writeLines(slide, pptx, 0.65, 3.9, 4.15, 3, 0.35);

  // notice / wonder right
  panel(slide, pptx, 5.15, 0.75, 4.5, 2.1, T.white, T.line);
  sectionLabel(slide, 5.15, 0.75, 4.5, '👁  I Notice…', T.teal);
  const notice = (c.noticeStems.length ? c.noticeStems : ['I notice the numbers are ___.', 'I notice ___ happens when ___.']).slice(0, 3);
  slide.addText(notice.map((s) => ({ text: `•  ${s}`, options: { breakLine: true } })), { x: 5.35, y: 1.15, w: 4.1, h: 1.6, fontFace: BODY, fontSize: 10, color: T.body, valign: 'top', lineSpacingMultiple: 1.1 });

  panel(slide, pptx, 5.15, 3.0, 4.5, 2.15, T.white, T.line);
  sectionLabel(slide, 5.15, 3.0, 4.5, '💭  I Wonder…', T.amber, T.navy);
  const wonder = (c.wonderStems.length ? c.wonderStems : ['I wonder how ___ changes when ___.', 'I wonder why ___.']).slice(0, 3);
  slide.addText(wonder.map((s) => ({ text: `•  ${s}`, options: { breakLine: true } })), { x: 5.35, y: 3.4, w: 4.1, h: 1.65, fontFace: BODY, fontSize: 10, color: T.body, valign: 'top', lineSpacingMultiple: 1.1 });
}

function slideVocabulary(slide, pptx, c) {
  header(slide, pptx, c, 'Vocabulary / Vocabulario');
  const rows = [[
    { text: 'Term / Término', options: { bold: true, color: T.white, fill: { color: T.navy }, fontFace: HEAD, fontSize: 10, valign: 'middle' } },
    { text: 'Meaning / Significado', options: { bold: true, color: T.white, fill: { color: T.navy }, fontFace: HEAD, fontSize: 10, valign: 'middle' } },
    { text: 'Example / Ejemplo', options: { bold: true, color: T.white, fill: { color: T.navy }, fontFace: HEAD, fontSize: 10, valign: 'middle' } },
  ]];
  c.vocab.slice(0, 5).forEach((v, i) => {
    const bg = i % 2 ? 'F4F1E8' : T.white;
    rows.push([
      { text: [{ text: esc(v.term), options: { bold: true, color: T.navy } }, ...(v.termEs ? [{ text: `\n${esc(v.termEs)}`, options: { italic: true, color: T.gray, fontSize: 8.5 } }] : [])], options: { fill: { color: bg }, valign: 'middle', fontSize: 9.5, fontFace: BODY } },
      { text: [{ text: esc(v.definition), options: { color: T.body } }, ...(v.definitionEs ? [{ text: `\n${esc(v.definitionEs)}`, options: { italic: true, color: T.gray, fontSize: 8.5 } }] : [])], options: { fill: { color: bg }, valign: 'middle', fontSize: 9, fontFace: BODY } },
      { text: esc(v.visual || (v.examples && v.examples[0] && v.examples[0].text) || ''), options: { fill: { color: bg }, valign: 'middle', color: T.body, italic: true, fontSize: 9, fontFace: BODY } },
    ]);
  });
  slide.addTable(rows, { x: 0.45, y: 0.75, w: 9.2, colW: [2.3, 4.5, 2.4], border: { type: 'solid', color: T.line, pt: 0.75 }, rowH: 0.5, valign: 'middle', autoPage: false });

  // example / non-example strip
  const exTerm = c.vocab.find((v) => Array.isArray(v.examples) && v.examples.length);
  if (exTerm) {
    const y = 0.75 + Math.min(c.vocab.length, 5) * 0.5 + 0.62;
    slide.addText(`${esc(exTerm.term)} — example vs. non-example:`, { x: 0.45, y: y - 0.02, w: 9.2, h: 0.26, fontFace: HEAD, fontSize: 9.5, bold: true, color: T.navy });
    exTerm.examples.slice(0, 4).forEach((ex, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.45 + col * 4.65, yy = y + 0.3 + row * 0.55;
      const yes = ex.isExample;
      panel(slide, pptx, x, yy, 4.5, 0.5, yes ? T.greenBg : T.redBg, yes ? T.teal : 'E2A39B', 0.05);
      slide.addText([{ text: `${yes ? '✓' : '✗'} `, options: { bold: true, color: yes ? T.teal : T.red } }, { text: `${esc(ex.text)}  `, options: { bold: true, color: T.navy } }, { text: esc(ex.why), options: { color: T.body, fontSize: 8 } }], { x: x + 0.12, y: yy, w: 4.26, h: 0.5, fontFace: BODY, fontSize: 9, valign: 'middle' });
    });
  }
}

function workSteps(slide, pptx, x, y, w, steps, accent) {
  steps.slice(0, 6).forEach((s, i) => {
    const yy = y + i * 0.52;
    slide.addShape(pptx.ShapeType.ellipse, { x, y: yy + 0.06, w: 0.3, h: 0.3, fill: { color: accent }, line: { type: 'none' } });
    slide.addText(`${i + 1}`, { x, y: yy + 0.06, w: 0.3, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: T.white, align: 'center', valign: 'middle' });
    slide.addText(esc(s), { x: x + 0.42, y: yy, w: w - 0.42, h: 0.46, fontFace: BODY, fontSize: 10.5, color: T.body, valign: 'middle' });
  });
}

function slideGuidedPractice(slide, pptx, c) {
  header(slide, pptx, c, 'Guided Practice / Práctica Guiada');
  panel(slide, pptx, 0.45, 0.75, 6.0, 4.4, T.white, T.line);
  pillText(slide, 0.65, 0.92, 1.9, 0.3, '👩‍🏫 WE DO TOGETHER', c.accent, T.white, 9);
  slide.addText(c.conceptHeading, { x: 0.65, y: 1.3, w: 5.6, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: T.navy });
  const gp = (c.weDoLines.length ? c.weDoLines : c.iDoLines);
  if (gp.length) {
    workSteps(slide, pptx, 0.7, 1.7, 5.7, gp, c.accent);
  } else {
    slide.addText(c.conceptText, { x: 0.65, y: 1.7, w: 5.6, h: 2.0, fontFace: BODY, fontSize: 11, color: T.body, valign: 'top' });
  }
  slide.addText('Your turn — show your work:', { x: 0.65, y: 4.25, w: 5.6, h: 0.25, fontFace: BODY, fontSize: 9, italic: true, color: T.gray });
  writeLines(slide, pptx, 0.7, 4.7, 5.6, 1, 0.3);

  panel(slide, pptx, 6.6, 0.75, 3.05, 4.4, T.tealLight, T.teal);
  sectionLabel(slide, 6.6, 0.75, 3.05, '💬 Talk It Over', T.teal);
  slide.addText(esc(c.talk1 || 'Explain each step to your partner using today\'s vocabulary.'), { x: 6.8, y: 1.2, w: 2.7, h: 1.6, fontFace: BODY, fontSize: 10, color: T.navy, valign: 'top' });
  if (c.keyIdea) {
    panel(slide, pptx, 6.75, 3.0, 2.75, 2.0, T.white, T.line);
    slide.addText('🔑 Key Idea', { x: 6.9, y: 3.1, w: 2.5, h: 0.25, fontFace: HEAD, fontSize: 9.5, bold: true, color: c.accent });
    slide.addText(esc(c.keyIdea), { x: 6.9, y: 3.4, w: 2.5, h: 1.5, fontFace: BODY, fontSize: 9.5, color: T.body, valign: 'top' });
  }
}

// Each card is a SINGLE shape-with-text object (fill+line on the text box itself),
// so it drags as one piece in Google Slides — the box stays with its number.
function chips(slide, pptx, x, y, w, items, perRow = 2, chipH = 0.42, bg = T.sand) {
  items.forEach((it, i) => {
    const col = i % perRow, row = Math.floor(i / perRow);
    const cw = (w - (perRow - 1) * 0.15) / perRow;
    const cx = x + col * (cw + 0.15), cy = y + row * (chipH + 0.12);
    slide.addText(esc(it), {
      x: cx, y: cy, w: cw, h: chipH,
      shape: pptx.ShapeType.roundRect, rectRadius: 0.05,
      fill: { color: bg }, line: { color: T.line, width: 1 },
      fontFace: BODY, fontSize: 9, bold: true, color: T.navy, align: 'center', valign: 'middle',
    });
  });
  return y + Math.ceil(items.length / perRow) * (chipH + 0.12);
}

function slideSortItOut(slide, pptx, c) {
  header(slide, pptx, c, 'Sort It Out / Clasifícalo');
  panel(slide, pptx, 0.45, 0.75, 6.0, 4.4, T.white, T.line);
  slide.addText(esc(c.sortInstructions), { x: 0.65, y: 0.9, w: 5.6, h: 0.4, fontFace: HEAD, fontSize: 10.5, bold: true, color: T.navy });
  slide.addText('Card Bank — cut or sort these cards:', { x: 0.65, y: 1.35, w: 5.6, h: 0.24, fontFace: BODY, fontSize: 8.5, italic: true, color: T.gray });
  const items = c.sortItems.length ? c.sortItems.map((it) => it.text) : ['Card 1', 'Card 2', 'Card 3', 'Card 4'];
  const after = chips(slide, pptx, 0.65, 1.62, 5.65, items.slice(0, 6), 3, 0.42, T.amberLight);
  // buckets
  const cats = c.sortCats.length ? c.sortCats : [{ label: 'Group A' }, { label: 'Group B' }];
  const bw = (5.65 - (cats.length - 1) * 0.15) / cats.length;
  cats.slice(0, 3).forEach((cat, i) => {
    const bx = 0.65 + i * (bw + 0.15);
    panel(slide, pptx, bx, after + 0.1, bw, 4.95 - (after + 0.1), T.white, c.accent, 0.05);
    slide.addText(esc(cat.label || cat), { x: bx, y: after + 0.1, w: bw, h: 0.32, fontFace: HEAD, fontSize: 9.5, bold: true, color: T.white, fill: { color: c.accent }, align: 'center', valign: 'middle' });
  });

  panel(slide, pptx, 6.6, 0.75, 3.05, 4.4, T.tealLight, T.teal);
  sectionLabel(slide, 6.6, 0.75, 3.05, '💬 Talk It Over', T.teal);
  slide.addText(esc(c.talk2 || 'Which cards were tricky to place? Explain how you decided.'), { x: 6.8, y: 1.2, w: 2.7, h: 1.5, fontFace: BODY, fontSize: 10, color: T.navy, valign: 'top' });
  writeLines(slide, pptx, 6.8, 3.0, 2.65, 5, 0.36);
}

function slideErrorAnalysis(slide, pptx, c) {
  header(slide, pptx, c, 'Error Analysis / Análisis de Errores');
  panel(slide, pptx, 0.45, 0.75, 6.0, 4.4, T.white, T.line);
  pillText(slide, 0.65, 0.92, 1.7, 0.3, '⚠ FIND THE ERROR', T.red, T.white, 9);
  slide.addText(esc(c.error.title), { x: 2.5, y: 0.92, w: 3.7, h: 0.3, fontFace: HEAD, fontSize: 11, bold: true, color: T.navy, valign: 'middle' });
  slide.addText('A classmate turned in the work below. One step has a mistake — find it, name it, fix it.', { x: 0.65, y: 1.3, w: 5.6, h: 0.4, fontFace: BODY, fontSize: 9.5, color: T.body });
  // student work box
  panel(slide, pptx, 0.65, 1.78, 5.65, 0.3 + c.error.steps.length * 0.42 + 0.1, 'F4F1E8', T.line, 0.05);
  slide.addText("Student's work (contains an error):", { x: 0.78, y: 1.85, w: 5.4, h: 0.24, fontFace: BODY, fontSize: 8, italic: true, color: T.gray });
  // Steps render neutrally — students find the error themselves (no pre-reveal).
  c.error.steps.slice(0, 6).forEach((s, i) => {
    const yy = 2.12 + i * 0.42;
    slide.addText([{ text: `${i + 1}. `, options: { bold: true, color: T.navy } }, { text: `${esc(s.label)}:  `, options: { bold: true, color: T.navy } }, { text: esc(s.work), options: { fontFace: 'Courier New', bold: true, color: T.body } }], { x: 0.85, y: yy, w: 5.35, h: 0.38, fontFace: BODY, fontSize: 9.5, valign: 'middle' });
  });
  const fy = 1.78 + 0.3 + c.error.steps.length * 0.42 + 0.25;
  slide.addText('Which step has the error? Circle it above.', { x: 0.65, y: fy, w: 5.6, h: 0.25, fontFace: BODY, fontSize: 9, bold: true, color: T.navy });

  panel(slide, pptx, 6.6, 0.75, 3.05, 4.4, T.coral, 'E2A39B');
  sectionLabel(slide, 6.6, 0.75, 3.05, '🛠 Explain & Fix', T.red);
  slide.addText([{ text: 'The mistake was ', options: {} }, { text: '___', options: { bold: true } }, { text: ' because ', options: {} }, { text: '___', options: { bold: true } }, { text: '.', options: {} }], { x: 6.8, y: 1.2, w: 2.7, h: 0.55, fontFace: BODY, fontSize: 10, color: T.navy, valign: 'top' });
  writeLines(slide, pptx, 6.8, 1.95, 2.65, 3, 0.32);
  slide.addText('Fix it — rewrite the step correctly:', { x: 6.8, y: 3.05, w: 2.7, h: 0.3, fontFace: BODY, fontSize: 9, bold: true, color: T.navy });
  writeLines(slide, pptx, 6.8, 3.55, 2.65, 4, 0.32);
  // correct work in speaker notes (teacher key)
  if (c.error.correctWork) slide.addNotes(`Answer key — ${c.error.correctWork}`);
}

function slideTwoColumn(slide, pptx, c) {
  header(slide, pptx, c, 'Two-Column Notes / Notas');
  panel(slide, pptx, 0.45, 0.75, 4.55, 4.4, T.white, T.line);
  slide.addText('Steps / Pasos', { x: 0.45, y: 0.75, w: 4.55, h: 0.32, fontFace: HEAD, fontSize: 10, bold: true, color: T.white, fill: { color: T.navy }, align: 'center', valign: 'middle' });
  const steps = c.iDoLines.length ? c.iDoLines : (c.weDoLines.length ? c.weDoLines : [c.keyIdea || c.conceptText]);
  workSteps(slide, pptx, 0.65, 1.3, 4.2, steps, c.accent);

  panel(slide, pptx, 5.15, 0.75, 4.5, 4.4, T.tealLight, T.teal);
  slide.addText('My Example / Mi Ejemplo', { x: 5.15, y: 0.75, w: 4.5, h: 0.32, fontFace: HEAD, fontSize: 10, bold: true, color: T.white, fill: { color: T.teal }, align: 'center', valign: 'middle' });
  slide.addText('Work one problem here, matching each step on the left:', { x: 5.35, y: 1.25, w: 4.1, h: 0.4, fontFace: BODY, fontSize: 9.5, italic: true, color: T.gray });
  writeLines(slide, pptx, 5.35, 1.95, 4.1, 8, 0.36);
}

function slideChoiceBoard(slide, pptx, c) {
  header(slide, pptx, c, 'Choice Board / Tablero de Opciones');
  slide.addText('Choose ONE to show what you know:', { x: 0.45, y: 0.7, w: 9.2, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: T.navy });
  const t1 = c.vocab[0]?.term || "today's key word";
  const t2 = c.vocab[1]?.term || t1;
  const opts = [
    { icon: '✏️', title: 'Draw & Label', desc: `Sketch a model for today's problem. Label it using ${t1}${t2 !== t1 ? ` and ${t2}` : ''}.`, bg: T.tealLight },
    { icon: '💬', title: 'Explain It', desc: c.keyIdea ? `In 2–3 sentences, explain "${c.keyIdea}" in your own words.` : "Explain today's key idea in your own words.", bg: T.amberLight },
    { icon: '🧮', title: 'Solve It', desc: 'Work one practice problem and show every step clearly.', bg: T.coral },
    { icon: '🎯', title: 'Create a Problem', desc: `Write your own problem that uses ${t1}, then solve it and make an answer key.`, bg: 'EAF2F1' },
  ];
  opts.forEach((o, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.45 + col * 4.7, y = 1.15 + row * 1.95;
    panel(slide, pptx, x, y, 4.5, 1.8, o.bg, T.line);
    slide.addText(o.icon, { x: x + 0.15, y: y + 0.12, w: 0.7, h: 0.6, fontSize: 26, valign: 'middle' });
    slide.addText(o.title, { x: x + 0.9, y: y + 0.15, w: 3.4, h: 0.4, fontFace: HEAD, fontSize: 13, bold: true, color: T.navy, valign: 'middle' });
    slide.addText(o.desc, { x: x + 0.2, y: y + 0.72, w: 4.1, h: 0.95, fontFace: BODY, fontSize: 10, color: T.body, valign: 'top' });
  });
}

function slideIndependentPractice(slide, pptx, c) {
  header(slide, pptx, c, 'Independent Practice / Práctica Independiente');
  panel(slide, pptx, 0.45, 0.75, 6.0, 4.4, T.white, T.line);
  pillText(slide, 0.65, 0.92, 1.6, 0.3, '✍️ ON YOUR OWN', c.accent, T.white, 9);
  c.practice.slice(0, 3).forEach((p, i) => {
    const yy = 1.35 + i * 1.05;
    slide.addText([{ text: `${i + 1}.  `, options: { bold: true, color: c.accent } }, { text: esc(p), options: { color: T.navy } }], { x: 0.65, y: yy, w: 5.65, h: 0.5, fontFace: BODY, fontSize: 10.5, valign: 'top' });
    writeLines(slide, pptx, 0.85, yy + 0.6, 5.45, 1, 0.3);
  });

  panel(slide, pptx, 6.6, 0.75, 3.05, 4.4, T.tealLight, T.teal);
  sectionLabel(slide, 6.6, 0.75, 3.05, '💬 Talk It Over', T.teal);
  slide.addText(esc(c.talk3 || c.talk1 || 'Compare answers with a partner. Where did you agree or disagree, and why?'), { x: 6.8, y: 1.2, w: 2.7, h: 1.7, fontFace: BODY, fontSize: 10, color: T.navy, valign: 'top' });
  writeLines(slide, pptx, 6.8, 3.1, 2.65, 5, 0.36);
}

function slideThinkWrite(slide, pptx, c) {
  header(slide, pptx, c, 'Think–Write–Respond / Piensa y Escribe');
  slide.addText("Use evidence from today's lesson to complete each frame.", { x: 0.45, y: 0.66, w: 9.2, h: 0.3, fontFace: BODY, fontSize: 10, italic: true, color: T.gray });
  const t1 = c.vocab[0]?.term || "today's key word";
  const frames = [
    { t: 'Explain the Rule', p: c.keyIdea ? `Today's key idea is "${c.keyIdea}" — and it works because ___.` : 'The most important rule from today is ___, and it works because ___.' },
    { t: 'Because / But / So', p: `Because ${t1} means ___, but a tricky part is ___, so I have to ___.` },
    { t: c.error.steps.length ? 'Catch the Mistake' : 'Justify Your Method', p: c.error.steps.length ? `A common mistake with ${t1} is ___. It happens because ___, and the fix is ___.` : 'I can justify my method by showing ___, which proves my answer makes sense.' },
  ];
  frames.forEach((f, i) => {
    const y = 1.05 + i * 1.4;
    panel(slide, pptx, 0.45, y, 9.2, 1.25, T.white, T.line);
    slide.addText([{ text: `Frame ${i + 1} — `, options: { color: T.gray } }, { text: f.t, options: { bold: true, color: c.accent } }], { x: 0.65, y: y + 0.1, w: 8.8, h: 0.3, fontFace: HEAD, fontSize: 11 });
    slide.addText(f.p, { x: 0.65, y: y + 0.42, w: 8.8, h: 0.4, fontFace: BODY, fontSize: 10.5, color: T.navy, valign: 'top' });
    writeLines(slide, pptx, 0.65, y + 1.02, 8.8, 1, 0.3);
  });
}

function slideExitTicket(slide, pptx, c) {
  header(slide, pptx, c, 'Exit Ticket / Boleto de Salida');
  panel(slide, pptx, 0.45, 0.75, 4.55, 4.4, T.tealLight, T.teal);
  sectionLabel(slide, 0.45, 0.75, 4.55, 'Reflection / Reflexión', T.teal);
  slide.addText('Today I learned that ___ because ___.', { x: 0.65, y: 1.2, w: 4.15, h: 0.4, fontFace: BODY, fontSize: 11, color: T.navy });
  writeLines(slide, pptx, 0.65, 1.95, 4.15, 3, 0.34);
  slide.addText('One thing I am still not sure about is ___.', { x: 0.65, y: 3.1, w: 4.15, h: 0.4, fontFace: BODY, fontSize: 11, color: T.navy });
  writeLines(slide, pptx, 0.65, 3.85, 4.15, 3, 0.34);

  panel(slide, pptx, 5.15, 0.75, 4.5, 4.4, T.white, T.line);
  sectionLabel(slide, 5.15, 0.75, 4.5, 'Quick Exit Ticket', T.navy);
  slide.addText([{ text: 'Tier 1 — ', options: { bold: true, color: c.accent } }, { text: esc(c.exit.tier1), options: { color: T.navy } }], { x: 5.35, y: 1.2, w: 4.1, h: 0.7, fontFace: BODY, fontSize: 10.5, valign: 'top' });
  (c.exit.choices.length ? c.exit.choices : ['A. ___', 'B. ___', 'C. ___']).slice(0, 4).forEach((ch, i) => {
    slide.addText(`${String.fromCharCode(65 + i)}.  ${esc(ch).replace(/^[A-D]\.\s*/, '')}`, { x: 5.5, y: 1.95 + i * 0.34, w: 3.9, h: 0.3, fontFace: BODY, fontSize: 10, color: T.body, valign: 'middle' });
  });
  const ty = 1.95 + Math.min(c.exit.choices.length || 3, 4) * 0.34 + 0.15;
  slide.addText([{ text: 'Tier 2 — ', options: { bold: true, color: c.accent } }, { text: esc(c.exit.tier2), options: { color: T.navy } }], { x: 5.35, y: ty, w: 4.1, h: 0.55, fontFace: BODY, fontSize: 10.5, valign: 'top' });
  writeLines(slide, pptx, 5.35, ty + 0.7, 4.1, 3, 0.32);
}

function slideGoalTracker(slide, pptx, c) {
  header(slide, pptx, c, 'Goal Tracker / Seguimiento de Metas');
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.45, y: 0.72, w: 9.2, h: 0.55, rectRadius: 0.08, fill: { color: T.navy }, line: { type: 'none' } });
  slide.addText([{ text: 'My Goal:  ', options: { bold: true, color: T.amber } }, { text: esc(c.contentObj), options: { color: T.white } }], { x: 0.7, y: 0.72, w: 8.7, h: 0.55, fontFace: BODY, fontSize: 11, valign: 'middle' });
  const levels = [
    { n: 1, l: 'Not Yet', d: 'I need more help. This does not make sense to me yet.', bg: T.coral },
    { n: 2, l: 'Getting There', d: 'I understand the idea but I make mistakes when I work.', bg: T.amberLight },
    { n: 3, l: 'Got It!', d: 'I can solve problems on my own and explain my thinking.', bg: T.tealLight },
    { n: 4, l: 'Can Teach It', d: 'I can clearly teach this strategy to a classmate.', bg: 'EAF2F1' },
  ];
  const bw = (9.2 - 3 * 0.2) / 4;
  levels.forEach((lv, i) => {
    const x = 0.45 + i * (bw + 0.2);
    panel(slide, pptx, x, 1.5, bw, 2.6, lv.bg, T.line);
    slide.addShape(pptx.ShapeType.ellipse, { x: x + bw / 2 - 0.28, y: 1.65, w: 0.56, h: 0.56, fill: { color: c.accent }, line: { type: 'none' } });
    slide.addText(`${lv.n}`, { x: x + bw / 2 - 0.28, y: 1.65, w: 0.56, h: 0.56, fontFace: HEAD, fontSize: 20, bold: true, color: T.white, align: 'center', valign: 'middle' });
    slide.addText(lv.l, { x: x + 0.05, y: 2.35, w: bw - 0.1, h: 0.35, fontFace: HEAD, fontSize: 11.5, bold: true, color: T.navy, align: 'center' });
    slide.addText(lv.d, { x: x + 0.12, y: 2.75, w: bw - 0.24, h: 1.15, fontFace: BODY, fontSize: 9, color: T.body, align: 'center', valign: 'top' });
    slide.addText('○ circle me', { x: x + 0.05, y: 3.85, w: bw - 0.1, h: 0.2, fontFace: BODY, fontSize: 8, italic: true, color: T.gray, align: 'center' });
  });
  panel(slide, pptx, 0.45, 4.35, 9.2, 0.75, T.white, T.line);
  slide.addText([{ text: 'My next step:  ', options: { bold: true, color: c.accent } }, { text: 'To move up one level, I will ___.', options: { color: T.body } }], { x: 0.7, y: 4.35, w: 8.7, h: 0.75, fontFace: BODY, fontSize: 10.5, valign: 'middle' });
}

// Learning objectives — large, print-friendly, light background. Mirrors the
// HTML deck's Content + Language Objective ("I can…") statements.
function slideObjectives(slide, pptx, c) {
  header(slide, pptx, c, 'Learning Objectives / Objetivos');
  slide.addText("Today's goals — what I will know and be able to say:", {
    x: 0.45, y: 0.66, w: 9.2, h: 0.3, fontFace: BODY, fontSize: 11, italic: true, color: T.gray,
  });

  // Content Objective
  panel(slide, pptx, 0.45, 1.1, 9.2, 1.75, T.tealLight, T.teal);
  pillText(slide, 0.65, 1.28, 2.1, 0.34, 'CONTENT OBJECTIVE', c.accent, T.white, 10);
  slide.addText([
    { text: 'I can…  ', options: { bold: true, color: c.accent } },
    { text: 'Yo puedo…', options: { italic: true, color: T.gray, fontSize: 11 } },
  ], { x: 2.9, y: 1.28, w: 6.6, h: 0.34, fontFace: HEAD, fontSize: 13, valign: 'middle' });
  slide.addText(esc(c.contentObj), {
    x: 0.7, y: 1.72, w: 8.7, h: 1.0, fontFace: BODY, fontSize: 18, color: T.navy, valign: 'top', lineSpacingMultiple: 1.05,
  });

  // Language Objective
  panel(slide, pptx, 0.45, 3.05, 9.2, 1.75, T.amberLight, T.amber);
  pillText(slide, 0.65, 3.23, 2.1, 0.34, 'LANGUAGE OBJECTIVE', c.accent, T.white, 10);
  slide.addText([
    { text: 'I can explain…  ', options: { bold: true, color: c.accent } },
    { text: 'Puedo explicar…', options: { italic: true, color: T.gray, fontSize: 11 } },
  ], { x: 2.9, y: 3.23, w: 6.6, h: 0.34, fontFace: HEAD, fontSize: 13, valign: 'middle' });
  slide.addText(esc(c.langObj), {
    x: 0.7, y: 3.67, w: 8.7, h: 1.0, fontFace: BODY, fontSize: 17, color: T.navy, valign: 'top', lineSpacingMultiple: 1.05,
  });
}

// One discussion (Turn & Talk) slide per turnAndTalk entry, titled with its
// phase and showing the question plus any sentence starters / word bank.
function slideDiscussion(slide, pptx, c) {
  const d = c.discussion || {};
  const label = phaseTitle(d.phase);
  header(slide, pptx, c, `Turn & Talk · ${label} / Comenta`);

  // Prompt panel (left/main)
  panel(slide, pptx, 0.45, 0.75, 6.1, 4.4, T.white, T.line);
  pillText(slide, 0.65, 0.95, 2.4, 0.34, `💬 ${esc(label).toUpperCase()} DISCUSSION`, c.accent, T.white, 9.5);
  slide.addText('Talk with your partner. Use full sentences and math words.', {
    x: 0.65, y: 1.4, w: 5.7, h: 0.3, fontFace: BODY, fontSize: 9.5, italic: true, color: T.gray,
  });
  slide.addText(esc(d.question), {
    x: 0.65, y: 1.78, w: 5.7, h: 2.0, fontFace: BODY, fontSize: 14, color: T.navy, valign: 'top', lineSpacingMultiple: 1.08,
  });
  slide.addText('Jot your partner talk here:', {
    x: 0.65, y: 4.05, w: 5.7, h: 0.25, fontFace: BODY, fontSize: 9, italic: true, color: T.gray,
  });
  writeLines(slide, pptx, 0.65, 4.5, 5.7, 2, 0.32);

  // Supports panel (right): sentence starters + word bank
  panel(slide, pptx, 6.65, 0.75, 2.95, 4.4, T.tealLight, T.teal);
  let sy = 0.75;
  const stems = (d.sentenceStems || []).slice(0, 4);
  if (stems.length) {
    sectionLabel(slide, 6.65, sy, 2.95, '✏️ Sentence starters', T.teal);
    sy += 0.4;
    slide.addText(stems.map((s) => ({ text: `•  ${esc(s)}`, options: { breakLine: true } })), {
      x: 6.85, y: sy, w: 2.6, h: 1.6, fontFace: BODY, fontSize: 10, color: T.navy, valign: 'top', lineSpacingMultiple: 1.1,
    });
    sy += 1.7;
  } else {
    // Generic frames so every discussion slide gives a starting point.
    sectionLabel(slide, 6.65, sy, 2.95, '✏️ Sentence starters', T.teal);
    sy += 0.4;
    slide.addText([
      { text: '•  I think ___ because ___.', options: { breakLine: true } },
      { text: '•  I agree/disagree because ___.', options: { breakLine: true } },
      { text: '•  My evidence is ___.', options: { breakLine: true } },
    ], { x: 6.85, y: sy, w: 2.6, h: 1.4, fontFace: BODY, fontSize: 10, color: T.navy, valign: 'top', lineSpacingMultiple: 1.1 });
    sy += 1.5;
  }

  const bank = (d.wordBank || []).slice(0, 8);
  if (bank.length) {
    sectionLabel(slide, 6.65, sy, 2.95, '📚 Word bank', T.amber, T.navy);
    chips(slide, pptx, 6.85, sy + 0.4, 2.6, bank, 2, 0.36, T.white);
  }
}

const BUILDERS = [
  slideCover, slideObjectives, slideBeCurious, slideVocabulary, slideGuidedPractice, slideSortItOut,
  slideErrorAnalysis, slideTwoColumn, slideChoiceBoard, slideIndependentPractice,
  slideThinkWrite, slideExitTicket, slideGoalTracker,
];

/**
 * Build all slides for one lesson into the given pptx instance.
 *
 * Optional `hooks` lets a caller interleave extra slides at named boundaries so
 * post-processors (e.g. integrate-reveal-slides) can place picture slides inside
 * the lesson flow rather than only at the very end. Each hook is a function
 * `(pptx) => void` that may add its own slides:
 *   - hooks.afterObjectives — runs right after the cover + objectives slides
 *   - hooks.afterPractice   — runs right after the independent-practice slide
 *   - hooks.end             — runs after the final slide
 */
export function buildPptxDeck(pptx, content, hooks = {}) {
  const c = { ...content, accent: accentForUnit(content.unit) };
  let slideNum = 0;
  const emit = (build) => {
    const slide = pptx.addSlide();
    slideNum += 1;
    c.slideNum = slideNum;
    build(slide, pptx, c);
  };
  const runHook = (name) => {
    if (typeof hooks[name] === 'function') hooks[name](pptx);
  };

  // Core template: cover + objectives, then the notebook activity slides.
  emit(slideCover);
  emit(slideObjectives);
  runHook('afterObjectives');

  // One discussion (Turn & Talk) slide per phase prompt from the config.
  (c.discussions || []).forEach((d) => {
    c.discussion = d;
    emit(slideDiscussion);
  });
  c.discussion = null;

  // Remaining notebook activity slides (cover + objectives already emitted).
  BUILDERS.slice(2).forEach((build) => {
    emit(build);
    if (build === slideIndependentPractice) runHook('afterPractice');
  });

  runHook('end');
}
