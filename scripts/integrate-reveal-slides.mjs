/**
 * integrate-reveal-slides.mjs
 * ---------------------------------------------------------------------------
 * Ingest official Reveal Math slide images for a lesson and inject them into
 * BOTH of that lesson's generated decks:
 *
 *   1. lessons/<id>/slides.html  — adds a labeled "Reveal Math Slides" block of
 *      responsive, lazy-loaded, keyboard-navigable <img> slides that join the
 *      existing deck navigation (sidebar thumbnails + arrow keys + present mode).
 *   2. lessons/<id>/slides.pptx  — appends one full-bleed picture slide per
 *      Reveal image, each labeled, fully editable in PowerPoint / Google Slides.
 *
 * INPUT CONTRACT (see lessons/REVEAL-SLIDES-PIPELINE.md):
 *   lessons/<id>/reveal-slides/
 *     01.png, 02.png, ...           ordered slide images (.png/.jpg/.jpeg/.webp)
 *     reveal.pdf                    (optional) source PDF — informational only;
 *                                   convert to images first (see README)
 *     reveal-slides.json            (optional) manifest:
 *       { "title": "...", "source": "...",
 *         "slides": [ { "file": "01.png", "caption": "..." }, ... ] }
 *
 * If no reveal-slides/ folder exists for a lesson, this script is a NO-OP for
 * that lesson (reports "skipped"). It NEVER edits the base generators; it only
 * post-processes their output, and it is fully IDEMPOTENT: the HTML injection
 * lives between marker comments and is stripped + rebuilt on every run, and the
 * PPTX is rebuilt from its base config each run so picture slides never stack up.
 *
 * Usage:
 *   node scripts/integrate-reveal-slides.mjs                 # all lessons
 *   node scripts/integrate-reveal-slides.mjs --lesson 3-1-flagship
 *   node scripts/integrate-reveal-slides.mjs --dry-run       # report only
 *   node scripts/integrate-reveal-slides.mjs --lesson 3-1-flagship --dry-run
 *
 * npm:  npm run generate-reveal-slides -- --lesson <id>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pptxgen from 'pptxgenjs';
import { buildPptxDeck } from './lib/pptx-deck.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const lessonsDir = path.join(root, 'lessons');

const REVEAL_DIRNAME = 'reveal-slides';
const MANIFEST_NAME = 'reveal-slides.json';
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

// HTML idempotency markers.
const HTML_BEGIN = '<!-- reveal-slides:begin -->';
const HTML_END = '<!-- reveal-slides:end -->';
// Sidebar (thumbnail) markers — kept distinct so each region is replaced cleanly.
const THUMB_BEGIN = '<!-- reveal-slides-thumbs:begin -->';
const THUMB_END = '<!-- reveal-slides-thumbs:end -->';
// Marker storing the deck's ORIGINAL totalSlides/slideTitles so re-runs restore
// the base before re-injecting (so the patched constants never compound).
const STATE_BEGIN = '<!-- reveal-slides-state:begin ';
const STATE_END = ' reveal-slides-state:end -->';

// ── small utils ──
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function listLessons() {
  return fs
    .readdirSync(lessonsDir)
    .filter((d) => /^(\d+)-(\d+)(-flagship)?$/.test(d))
    .filter((d) => fs.existsSync(path.join(lessonsDir, d, 'config.json')));
}

/**
 * Resolve the ordered list of Reveal slide image records for a lesson.
 * Returns null when no reveal-slides/ folder exists (signals NO-OP / skip).
 * Returns [] (with a warning) when the folder exists but has no usable images.
 */
function resolveRevealSlides(id) {
  const dir = path.join(lessonsDir, id, REVEAL_DIRNAME);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;

  let manifest = null;
  const manifestPath = path.join(dir, MANIFEST_NAME);
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      console.warn(`  ! ${id}: ${MANIFEST_NAME} is invalid JSON — falling back to directory order (${e.message})`);
    }
  }

  let records = [];
  if (manifest && Array.isArray(manifest.slides) && manifest.slides.length) {
    records = manifest.slides
      .filter((s) => s && s.file)
      .map((s, i) => ({
        file: s.file,
        caption: s.caption || '',
        order: i + 1,
      }))
      .filter((s) => {
        const exists = fs.existsSync(path.join(dir, s.file));
        if (!exists) console.warn(`  ! ${id}: manifest lists missing file "${s.file}" — skipping`);
        return exists && IMAGE_EXT.test(s.file);
      });
  } else {
    // Directory order: natural sort by filename (01, 02, ... 10).
    records = fs
      .readdirSync(dir)
      .filter((f) => IMAGE_EXT.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((file, i) => ({ file, caption: '', order: i + 1 }));
  }

  const title = (manifest && manifest.title) || 'Reveal Math Slides';
  const source = (manifest && manifest.source) || '';
  return { dir, records, title, source };
}

// ── HTML injection ──

function stripExistingHtmlInjection(html) {
  // Restore original totalSlides/slideTitles if a prior run saved them.
  const stateRe = new RegExp(
    STATE_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '([\\s\\S]*?)' +
      STATE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  const stateMatch = html.match(stateRe);
  if (stateMatch) {
    try {
      const saved = JSON.parse(stateMatch[1]);
      html = html.replace(/const totalSlides = \d+;/, `const totalSlides = ${saved.totalSlides};`);
      html = html.replace(/const slideTitles = \[[\s\S]*?\];/, `const slideTitles = ${JSON.stringify(saved.slideTitles)};`);
    } catch {
      /* if state is unreadable, leave constants as-is and rebuild base deck */
    }
    html = html.replace(stateRe, '');
  }

  // Remove the slide-body block and the thumbnail block (including markers).
  const between = (begin, end) =>
    new RegExp(
      begin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*',
      'g',
    );
  html = html.replace(between(HTML_BEGIN, HTML_END), '');
  html = html.replace(between(THUMB_BEGIN, THUMB_END), '');
  return html;
}

function buildRevealSlideBodies(records, dir, sectionTitle, source, startNum) {
  // A labeled section divider slide, then one image slide per Reveal page.
  const slides = [];

  // Section intro slide.
  slides.push(`
        <section class="slide-body reveal-slide reveal-slide-intro" id="slide-${startNum}" data-teacher-notes="${esc(`Official Reveal Math slides for this lesson (${records.length} ${records.length === 1 ? 'slide' : 'slides'}).`)}">
          <div class="reveal-intro-card">
            <span class="reveal-section-badge">📘 REVEAL MATH</span>
            <h2 class="reveal-section-title">${esc(sectionTitle)}</h2>
            <p class="reveal-section-sub">Official Reveal Math slides — ${records.length} ${records.length === 1 ? 'page' : 'pages'}. Use ← → to move through them.</p>
            ${source ? `<p class="reveal-section-source">Source: ${esc(source)}</p>` : ''}
          </div>
        </section>`);

  records.forEach((rec, i) => {
    const num = startNum + 1 + i;
    const rel = `${REVEAL_DIRNAME}/${rec.file}`;
    const pageLabel = `Reveal slide ${i + 1} of ${records.length}`;
    const alt = rec.caption ? `${pageLabel} — ${rec.caption}` : pageLabel;
    slides.push(`
        <section class="slide-body reveal-slide reveal-slide-image" id="slide-${num}" data-teacher-notes="${esc(rec.caption || pageLabel)}">
          <div class="reveal-image-frame">
            <span class="reveal-page-badge">📘 Reveal ${i + 1}/${records.length}</span>
            <img class="reveal-image" src="${esc(rel)}" alt="${esc(alt)}" loading="lazy" decoding="async" />
            ${rec.caption ? `<p class="reveal-image-caption">${esc(rec.caption)}</p>` : ''}
          </div>
        </section>`);
  });

  return slides.join('\n');
}

function buildRevealThumbnails(records, startNum) {
  const cards = [];
  cards.push(`
      <div class="thumb-card reveal-thumb" data-slide="${startNum}" onclick="goToSlide(${startNum})">
        <span class="thumb-label">Slide ${startNum}</span>
        <div class="thumb-preview">📘 Reveal</div>
      </div>`);
  records.forEach((rec, i) => {
    const num = startNum + 1 + i;
    cards.push(`
      <div class="thumb-card reveal-thumb" data-slide="${num}" onclick="goToSlide(${num})">
        <span class="thumb-label">Slide ${num}</span>
        <div class="thumb-preview">📘 R${i + 1}</div>
      </div>`);
  });
  return cards.join('\n');
}

const REVEAL_CSS = `
    /* reveal-slides: injected styling for official Reveal Math image slides */
    .slide-body.reveal-slide { align-items: center; justify-content: center; }
    .reveal-intro-card {
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center; gap: 12px;
      padding: 40px;
    }
    .reveal-section-badge, .reveal-page-badge {
      background: var(--navy, #17324D); color: #fff; font-family: "Outfit", sans-serif;
      font-weight: 800; font-size: 13px; letter-spacing: 0.06em; padding: 6px 14px;
      border-radius: 99px; text-transform: uppercase;
    }
    .reveal-section-title { font-family: "Outfit", sans-serif; font-size: 34px; font-weight: 800; color: var(--navy, #17324D); margin: 6px 0; }
    .reveal-section-sub { font-size: 18px; color: var(--body-text, #24323F); max-width: 640px; margin: 0; }
    .reveal-section-source { font-size: 13px; color: var(--gray, #8A96A3); font-style: italic; margin: 0; }
    .reveal-image-frame {
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 10px; padding: 16px 24px 28px;
      position: relative;
    }
    .reveal-image-frame .reveal-page-badge { position: absolute; top: 14px; left: 18px; font-size: 11px; padding: 4px 10px; z-index: 5; }
    .reveal-image {
      max-width: 100%; max-height: calc(100% - 36px); width: auto; height: auto;
      object-fit: contain; border-radius: 6px; box-shadow: 0 6px 20px rgba(28, 46, 66, 0.18);
      background: #fff;
    }
    .reveal-image-caption { font-size: 15px; color: var(--navy, #17324D); font-weight: 600; text-align: center; margin: 0; max-width: 80%; }
    .thumb-preview { word-break: break-word; }
`;

function injectIntoHtml(html, reveal, id) {
  // 1. Always start from a clean base (strip any prior injection + restore consts).
  let out = stripExistingHtmlInjection(html);

  const records = reveal.records;
  if (!records.length) return out; // folder present but empty → leave base deck clean

  // 2. Determine current (base) slide count + titles from the live deck JS.
  const totalMatch = out.match(/const totalSlides = (\d+);/);
  const titlesMatch = out.match(/const slideTitles = (\[[\s\S]*?\]);/);
  if (!totalMatch || !titlesMatch) {
    console.warn(`  ! ${id}: could not locate totalSlides/slideTitles in slides.html — skipping HTML injection`);
    return out;
  }
  const baseTotal = parseInt(totalMatch[1], 10);
  let baseTitles;
  try {
    baseTitles = JSON.parse(titlesMatch[1]);
  } catch {
    console.warn(`  ! ${id}: could not parse slideTitles — skipping HTML injection`);
    return out;
  }

  const startNum = baseTotal + 1; // section intro slide number
  const newCount = records.length + 1; // +1 for the section intro slide
  const newTotal = baseTotal + newCount;

  // 3. Build new titles (section + per-page).
  const newTitles = baseTitles.slice();
  newTitles.push('REVEAL MATH');
  records.forEach((_, i) => newTitles.push(`REVEAL ${i + 1}`));

  // 4. Inject CSS once (idempotent: stripExisting removes the prior block; CSS is
  //    inside the HTML markers' adjacent state, so we add it with the bodies).
  const bodies = buildRevealSlideBodies(records, reveal.dir, reveal.title, reveal.source, startNum);
  const thumbs = buildRevealThumbnails(records, startNum);

  const stateComment = `${STATE_BEGIN}${JSON.stringify({ totalSlides: baseTotal, slideTitles: baseTitles })}${STATE_END}`;

  // 5. Patch the JS constants.
  out = out.replace(/const totalSlides = \d+;/, `const totalSlides = ${newTotal};`);
  out = out.replace(/const slideTitles = \[[\s\S]*?\];/, `const slideTitles = ${JSON.stringify(newTitles)};`);

  // 6. Inject thumbnails just before the sidebar closes.
  out = out.replace(
    /(\n\s*)<\/nav>/,
    `$1${THUMB_BEGIN}\n${thumbs}\n      ${THUMB_END}$1</nav>`,
  );

  // 7. Inject slide bodies + scoped CSS + state comment just before the watermark.
  const block = `${HTML_BEGIN}\n        <style>${REVEAL_CSS}        </style>\n${bodies}\n        ${stateComment}\n        ${HTML_END}\n`;
  out = out.replace(/(\n\s*)<div class="slide-watermark">/, `\n        ${block}$1<div class="slide-watermark">`);

  return out;
}

// ── PPTX injection ──

const PT = {
  navy: '17324D',
  sand: 'F7F4EC',
  white: 'FFFFFF',
  gray: '8A96A3',
};
const W = 10;
const H = 5.625;

function imageDataUri(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  const mime = MIME[ext] || 'image/png';
  const b64 = fs.readFileSync(absPath).toString('base64');
  return `data:${mime};base64,${b64}`;
}

/** Build base deck content the same way generate-pptx.mjs does (kept in sync via shared lib). */
function extractPptxContent(id, data) {
  // Mirror of generate-pptx.mjs extractContent — re-implemented minimally here so
  // re-running rebuilds the base deck before appending Reveal picture slides.
  const ci = data.launch?.conceptIntro || {};
  const pools = [
    ...(data.practice?.extending || []),
    ...(data.practice?.onLevel || []),
    ...(data.practice?.approaching || []),
    ...(data.practice?.optional || []),
  ];
  const err = pools.find((p) => p.type === 'error-analysis') || {};
  const exit = data.reflect?.exitTicket || {};
  const discussions = (data.turnAndTalk || [])
    .filter((t) => t && t.question)
    .map((t) => ({
      phase: t.phase || '',
      question: t.question,
      wordBank: Array.isArray(t.wordBank) ? t.wordBank : [],
      sentenceStems: Array.isArray(t.sentenceStems) ? t.sentenceStems : [],
    }));
  const talks = discussions.map((t) => t.question);
  const explore = data.explore || {};
  const sortCats = (explore.categories || []).map((c) =>
    typeof c === 'string' ? { label: c } : { label: c.label || String(c) },
  );
  const sortItems = (explore.items || explore.cards || []).map((it) => ({ text: it.text || String(it) }));
  const indep = (() => {
    const p2 = [
      ...(data.practice?.onLevel || []),
      ...(data.practice?.approaching || []),
      ...(data.practice?.optional || []),
      ...(data.practice?.extending || []),
    ];
    const stems = p2.filter((p) => p.type !== 'error-analysis' && (p.stem || p.prompt)).map((p) => p.stem || p.prompt);
    return [...new Set(stems)].slice(0, 3);
  })();

  return {
    lessonId: id,
    unit: data.unit || 1,
    standard: data.standard || '6th Grade',
    topic: data.title || 'Math Lesson',
    themeEmoji: data.themeEmoji || '📘',
    contentObj: data.contentObjective || 'Understand the key math idea in this lesson.',
    langObj: data.languageObjective || "Explain my thinking using today's math vocabulary.",
    launchBadge: data.launch?.badge || 'Scenario',
    launchNarrative: data.launch?.narrative || 'Look closely at the prompt and record what you observe.',
    noticeStems: data.launch?.noticePrompts || [],
    wonderStems: data.launch?.wonderPrompts || [],
    conceptHeading: ci.heading || "Today's Big Idea",
    conceptText: ci.intro || 'Review the core concept of this lesson.',
    keyIdea: ci.keyIdea || '',
    iDoLines: ci.iDo?.lines || [],
    weDoLines: ci.weDo?.lines || [],
    vocab: data.vocabulary || [],
    sortInstructions: explore.instructions || explore.label || 'Sort each card into the correct group.',
    sortItems,
    sortCats,
    error: {
      title: err.title || 'Find the Mistake',
      steps: err.workedExample || [],
      errorStep: err.errorStep || 0,
      correctWork: err.correctWork || '',
    },
    practice: indep,
    discussions,
    talk1: talks[0] || '',
    talk2: talks[1] || '',
    talk3: talks[2] || '',
    exit: {
      tier1: exit.stem || 'Solve the problem and choose the correct answer.',
      choices: exit.choices || [],
      tier2: data.reflect?.exitTicketOpen || data.reflect?.openPrompt || 'Explain how you know your answer is correct. Use at least one vocabulary word.',
    },
  };
}

async function rebuildPptxWithReveal(id, data, reveal) {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'NEFT_169', width: W, height: H });
  pptx.layout = 'NEFT_169';
  pptx.author = 'Neft Teacher';
  pptx.company = 'Neft Teacher';
  pptx.title = `Lesson ${id}: ${data.title || 'Math Lesson'}`;
  pptx.subject = data.standard || '';

  // 1. Base notebook deck (identical to generate-pptx.mjs).
  buildPptxDeck(pptx, extractPptxContent(id, data));

  // 2. Section divider slide.
  const divider = pptx.addSlide();
  divider.background = { color: PT.navy };
  divider.addText('📘 REVEAL MATH', { x: 0, y: 2.0, w: W, h: 0.5, fontFace: 'Outfit', fontSize: 16, bold: true, color: 'BFE6E2', align: 'center', charSpacing: 2 });
  divider.addText(reveal.title, { x: 0.5, y: 2.5, w: W - 1, h: 0.9, fontFace: 'Outfit', fontSize: 30, bold: true, color: PT.white, align: 'center', valign: 'middle' });
  divider.addText(`Official Reveal Math slides · ${reveal.records.length} ${reveal.records.length === 1 ? 'page' : 'pages'}`, { x: 0.5, y: 3.4, w: W - 1, h: 0.4, fontFace: 'Hanken Grotesk', fontSize: 13, color: 'BFE6E2', align: 'center' });
  if (reveal.source) divider.addText(`Source: ${reveal.source}`, { x: 0.5, y: 3.85, w: W - 1, h: 0.35, fontFace: 'Hanken Grotesk', fontSize: 10, italic: true, color: PT.gray, align: 'center' });

  // 3. One full-bleed picture slide per Reveal image.
  reveal.records.forEach((rec, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: PT.sand };
    const abs = path.join(reveal.dir, rec.file);
    const dataUri = imageDataUri(abs);
    // Full-bleed within the 16:9 stage, leaving a thin label strip at top.
    slide.addText(`Reveal ${i + 1} / ${reveal.records.length}`, { x: 0.2, y: 0.08, w: 3, h: 0.3, fontFace: 'Outfit', fontSize: 10, bold: true, color: PT.navy, valign: 'middle' });
    slide.addImage({ data: dataUri, x: 0.25, y: 0.45, w: W - 0.5, h: H - 0.9, sizing: { type: 'contain', w: W - 0.5, h: H - 0.9 } });
    if (rec.caption) {
      slide.addText(rec.caption, { x: 0.5, y: H - 0.4, w: W - 1, h: 0.32, fontFace: 'Hanken Grotesk', fontSize: 10, color: PT.navy, align: 'center', valign: 'middle' });
      slide.addNotes(rec.caption);
    }
  });

  const outPath = path.join(lessonsDir, id, 'slides.pptx');
  await pptx.writeFile({ fileName: outPath });
  return outPath;
}

// ── per-lesson driver ──

async function processLesson(id, { dryRun }) {
  const reveal = resolveRevealSlides(id);
  if (reveal === null) {
    return { id, status: 'skipped', reason: 'no reveal-slides/ folder' };
  }
  if (!reveal.records.length) {
    return { id, status: 'skipped', reason: 'reveal-slides/ folder has no usable images' };
  }

  const htmlPath = path.join(lessonsDir, id, 'slides.html');
  const pptxPath = path.join(lessonsDir, id, 'slides.pptx');
  const configPath = path.join(lessonsDir, id, 'config.json');

  const changes = [];
  if (!fs.existsSync(htmlPath)) {
    changes.push('slides.html MISSING — run `node scripts/generate-slides.mjs ' + id + '` first');
  } else {
    changes.push(`slides.html ← +${reveal.records.length + 1} Reveal slides`);
  }
  if (!fs.existsSync(configPath)) {
    changes.push('config.json MISSING — cannot rebuild slides.pptx');
  } else {
    changes.push(`slides.pptx ← +${reveal.records.length + 1} Reveal picture slides`);
  }

  if (dryRun) {
    return { id, status: 'would-change', reveal, changes };
  }

  // HTML
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const next = injectIntoHtml(html, reveal, id);
    if (next !== html) fs.writeFileSync(htmlPath, next, 'utf8');
  }

  // PPTX
  if (fs.existsSync(configPath)) {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    await rebuildPptxWithReveal(id, data, reveal);
  }

  return { id, status: 'integrated', reveal, changes, pptxPath };
}

// ── CLI ──

function parseArgs(argv) {
  const opts = { dryRun: false, lesson: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--lesson') opts.lesson = argv[++i];
    else if (a.startsWith('--lesson=')) opts.lesson = a.split('=')[1];
    else if (!a.startsWith('--')) opts.lesson = a; // positional lesson id
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const lessons = opts.lesson ? [opts.lesson] : listLessons();

  if (opts.lesson && !fs.existsSync(path.join(lessonsDir, opts.lesson, 'config.json'))) {
    console.error(`Lesson "${opts.lesson}" not found (no lessons/${opts.lesson}/config.json).`);
    process.exit(1);
  }

  console.log(
    `Integrate Reveal Math slides${opts.dryRun ? ' (DRY RUN — no writes)' : ''} · ${lessons.length} lesson(s)`,
  );

  let integrated = 0;
  let skipped = 0;
  let wouldChange = 0;

  for (const id of lessons) {
    try {
      const res = await processLesson(id, opts);
      if (res.status === 'skipped') {
        skipped++;
        // Keep skip output quiet for full-repo runs unless a single lesson was targeted.
        if (opts.lesson) console.log(`  - ${id}: skipped (${res.reason})`);
      } else if (res.status === 'would-change') {
        wouldChange++;
        console.log(`  ~ ${id}: WOULD CHANGE`);
        res.changes.forEach((c) => console.log(`      • ${c}`));
      } else {
        integrated++;
        console.log(`  ✓ ${id}: integrated ${res.reveal.records.length} Reveal slide(s)`);
        res.changes.forEach((c) => console.log(`      • ${c}`));
      }
    } catch (e) {
      console.error(`  ✗ ${id}: ${e.message}`);
    }
  }

  console.log(
    `Done. integrated=${integrated} wouldChange=${wouldChange} skipped=${skipped} (of ${lessons.length}).`,
  );
}

main();
