/**
 * integrate-reveal-slides.mjs
 * ---------------------------------------------------------------------------
 * Ingest official Reveal Math slide images for a lesson and INTERLEAVE them into
 * BOTH of that lesson's generated decks at the right point in the lesson flow:
 *
 *   1. lessons/<id>/slides.html  — inserts each Reveal slide as a real
 *      .slide-body that carries the SAME data-section as its placement (so the
 *      Reveal Notice & Wonder sits inside the Launch, Reveal problems inside
 *      Practice, etc.). Slides join the existing deck navigation (renumbered
 *      ids, rebuilt sidebar thumbnails, slideTitles, totalSlides, arrow keys).
 *   2. lessons/<id>/slides.pptx  — inserts Reveal picture slides grouped by
 *      placement near the matching point in the deck order (launch/notice-wonder
 *      right after the objectives, practice later), fully editable.
 *
 * PLACEMENT MODEL (see lessons/REVEAL-SLIDES-PIPELINE.md):
 *   Each manifest slide may carry a `placement` — either a deck section name
 *   (launch, explore, vocabulary, instruction, practice, connect, closure) or a
 *   friendly ROLE alias (notice-wonder, problem, example, exit, …) that maps to
 *   a section. A top-level `defaultPlacement` covers slides without one. With NO
 *   placement info at all, slides default to `launch` (so notice/wonder-style
 *   slides integrate into the opening). `end` keeps a slide at the very end.
 *
 * INPUT CONTRACT (see lessons/REVEAL-SLIDES-PIPELINE.md):
 *   lessons/<id>/reveal-slides/
 *     01.png, 02.png, ...           ordered slide images (.png/.jpg/.jpeg/.webp)
 *     reveal.pdf                    (optional) source PDF — informational only;
 *                                   convert to images first (see README)
 *     reveal-slides.json            (optional) manifest:
 *       { "title": "...", "source": "...", "defaultPlacement": "launch",
 *         "slides": [ { "file": "01.png", "caption": "...",
 *                       "placement": "notice-wonder" }, ... ] }
 *
 * If no reveal-slides/ folder exists for a lesson, this script is a NO-OP for
 * that lesson (reports "skipped"). It NEVER edits the base generators; it only
 * post-processes their output, and it is fully IDEMPOTENT: the base deck state
 * (totalSlides, slideTitles, thumbnails) is saved in a state comment and fully
 * restored before each re-injection, and the PPTX is rebuilt from its base
 * config each run so picture slides never stack up.
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
// Managed field written into each lesson's config.json so the client-rendered
// HTML lesson page (engine renderer) shows Reveal slides inside their section.
const CONFIG_FIELD = 'revealSlides';
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

// ── Placement model ──────────────────────────────────────────────────────────
// Canonical deck sections a Reveal slide may be interleaved into.
const SECTIONS = ['launch', 'explore', 'vocabulary', 'instruction', 'practice', 'connect', 'closure'];
// Friendly ROLE aliases → canonical section. Section names map to themselves.
const PLACEMENT_ALIASES = {
  // launch
  'notice-wonder': 'launch', noticewonder: 'launch', warmup: 'launch', 'warm-up': 'launch', hook: 'launch', launch: 'launch',
  // practice
  problem: 'practice', problems: 'practice', practice: 'practice', independent: 'practice',
  // instruction
  example: 'instruction', 'i-do': 'instruction', instruction: 'instruction', modeled: 'instruction',
  // explore
  explore: 'explore', investigate: 'explore',
  // vocabulary
  vocab: 'vocabulary', vocabulary: 'vocabulary',
  // connect
  discuss: 'connect', connect: 'connect', 'real-world': 'connect',
  // closure
  exit: 'closure', closure: 'closure', reflect: 'closure', 'wrap-up': 'closure',
  // explicit end (legacy: keep at very end of deck)
  end: 'end',
};
// Section-absent fallback order: practice → explore → launch → end.
const FALLBACK_ORDER = ['practice', 'explore', 'launch', 'end'];
const DEFAULT_PLACEMENT = 'launch';

/** Normalize a raw placement/role string to a canonical section (or 'end'). */
function resolvePlacement(raw) {
  if (raw == null || raw === '') return null;
  const key = String(raw).trim().toLowerCase();
  if (PLACEMENT_ALIASES[key]) return PLACEMENT_ALIASES[key];
  if (SECTIONS.includes(key)) return key;
  return null; // unknown → let caller apply default
}

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

  // Manifest-level default placement (falls back to launch when omitted).
  const defaultPlacement =
    (manifest && resolvePlacement(manifest.defaultPlacement)) || DEFAULT_PLACEMENT;

  let records = [];
  if (manifest && Array.isArray(manifest.slides) && manifest.slides.length) {
    records = manifest.slides
      .filter((s) => s && s.file)
      .map((s, i) => ({
        file: s.file,
        caption: s.caption || '',
        order: i + 1,
        // Per-slide placement → fall back to manifest default.
        placement: resolvePlacement(s.placement) || defaultPlacement,
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
      .map((file, i) => ({ file, caption: '', order: i + 1, placement: defaultPlacement }));
  }

  const title = (manifest && manifest.title) || 'Reveal Math Slides';
  const source = (manifest && manifest.source) || '';
  return { dir, records, title, source, defaultPlacement };
}

// ── HTML injection (interleaved) ──
//
// Strategy: the base deck slides are real .slide-body blocks emitted inline.
// We insert each Reveal slide as a real .slide-body carrying its placement's
// data-section, immediately AFTER the last base slide of that section, then
// renumber EVERY id="slide-N" sequentially and rebuild the slideTitles array,
// totalSlides, teacherNotesMap, and the thumbnail sidebar so all order-sensitive
// structures stay consistent.

const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Restore the deck to its clean, Reveal-free base. The state comment stores the
 * base JS constants AND the base sidebar inner HTML, so a re-run rebuilds from a
 * known-good base rather than trying to surgically un-splice interleaved slides.
 * Steps: drop reveal bodies (marker-wrapped), restore the saved nav + constants,
 * then renumber the remaining base slide-body ids 1..N so the deck is pristine.
 */
function stripExistingHtmlInjection(html) {
  // Match the state comment AND the trailing whitespace we inserted after it, so
  // re-runs don't accumulate blank lines before the watermark.
  const stateRe = new RegExp(reEscape(STATE_BEGIN) + '([\\s\\S]*?)' + reEscape(STATE_END) + '\\s*');
  const m = html.match(stateRe);
  if (!m) return html; // never injected → already base
  let saved;
  try {
    saved = JSON.parse(decodeURIComponent(m[1]));
  } catch {
    return html.replace(stateRe, ''); // unreadable → drop only the comment
  }
  // 1. Drop the state comment (+ trailing whitespace).
  let out = html.replace(stateRe, '');
  // 2. Remove injected reveal slide bodies (marker-wrapped) + scoped CSS.
  out = out.replace(new RegExp('\\s*' + reEscape(HTML_BEGIN) + '[\\s\\S]*?' + reEscape(HTML_END), 'g'), '');
  out = out.replace(/\s*<style data-reveal-slides="1">[\s\S]*?<\/style>/g, '');
  // 3. Restore base JS constants (function replacers → `$` in JSON is literal).
  out = out.replace(/const totalSlides = \d+;/, () => `const totalSlides = ${saved.totalSlides};`);
  out = out.replace(/const slideTitles = \[[\s\S]*?\];/, () => `const slideTitles = ${saved.slideTitlesRaw};`);
  if (saved.teacherNotesRaw != null) {
    out = out.replace(/const teacherNotesMap = \{[\s\S]*?\};/, () => `const teacherNotesMap = ${saved.teacherNotesRaw};`);
  }
  // 4. Restore the base sidebar (full nav inner HTML) verbatim. Use a function
  //    replacer so any `$` sequences inside navInner are treated literally.
  if (saved.navInner != null) {
    out = out.replace(
      /<nav class="sidebar-slides">[\s\S]*?<\/nav>/,
      () => `<nav class="sidebar-slides">${saved.navInner}</nav>`,
    );
  }
  // 5. Renumber the remaining (base) slide-body ids 1..N in document order.
  let n = 0;
  out = out.replace(/(<div class="slide-body[^"]*"\s+id=")slide-\d+(")/g, (full, pre, post) => {
    n += 1;
    return `${pre}slide-${n}${post}`;
  });
  return out;
}

/** Capture the inner HTML of the base sidebar nav (between the nav tags). */
function captureNavInner(html) {
  const m = html.match(/<nav class="sidebar-slides">([\s\S]*?)<\/nav>/);
  return m ? m[1] : null;
}

const REVEAL_CSS = `<style data-reveal-slides="1">
    /* reveal-slides: scoped styling for interleaved Reveal Math image slides */
    .slide-body.reveal-slide { align-items: center; justify-content: center; }
    .reveal-page-badge {
      background: var(--navy, #17324D); color: #fff; font-family: "Outfit", sans-serif;
      font-weight: 800; font-size: 11px; letter-spacing: 0.06em; padding: 4px 10px;
      border-radius: 99px; text-transform: uppercase;
    }
    .reveal-image-frame {
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 10px; padding: 16px 24px 28px;
      position: relative;
    }
    .reveal-image-frame .reveal-page-badge { position: absolute; top: 14px; left: 18px; z-index: 5; }
    .reveal-image {
      max-width: 100%; max-height: calc(100% - 36px); width: auto; height: auto;
      object-fit: contain; border-radius: 6px; box-shadow: 0 6px 20px rgba(28, 46, 66, 0.18);
      background: #fff;
    }
    .reveal-image-caption { font-size: 15px; color: var(--navy, #17324D); font-weight: 600; text-align: center; margin: 0; max-width: 80%; }
    .thumb-card.reveal-thumb .thumb-preview { word-break: break-word; }
  </style>`;

/** Descriptive TOC title for a Reveal slide. */
function revealTitle(rec, section) {
  if (rec.caption) return String(rec.caption).toUpperCase();
  const pretty = section.charAt(0).toUpperCase() + section.slice(1);
  return `REVEAL MATH — ${pretty}`;
}

/**
 * Group consecutive same-placement records (preserving manifest order), resolve
 * each group's target section against the deck's available sections, and return
 * ordered groups: [{ section, records: [...] }]. 'end' groups keep section 'end'.
 */
function groupRecordsByPlacement(records, availableSections) {
  const resolveTarget = (placement) => {
    if (placement === 'end') return 'end';
    if (availableSections.has(placement)) return placement;
    // Section absent → fall back: practice → explore → launch → end.
    for (const fb of FALLBACK_ORDER) {
      if (fb === 'end') return 'end';
      if (availableSections.has(fb)) return fb;
    }
    return 'end';
  };
  const groups = [];
  for (const rec of records) {
    const section = resolveTarget(rec.placement);
    const last = groups[groups.length - 1];
    if (last && last.section === section) last.records.push(rec);
    else groups.push({ section, records: [rec] });
  }
  return groups;
}

/**
 * Parse the deck's ordered slide bodies from the HTML. Returns the list of
 * { section, openIdx } in document order, plus the index of the watermark anchor.
 */
function parseBaseSlides(html) {
  const slides = [];
  const re = /<div class="slide-body[^"]*"\s+id="slide-\d+"([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const secMatch = attrs.match(/data-section="([^"]*)"/);
    slides.push({ section: secMatch ? secMatch[1] : null, openIdx: m.index });
  }
  return slides;
}

function injectIntoHtml(html, reveal, id) {
  // 1. Always start from a clean base (strip any prior injection + restore base).
  let out = stripExistingHtmlInjection(html);

  const records = reveal.records;
  if (!records.length) return out; // folder present but empty → leave base deck clean

  // 2. Read base constants.
  const totalMatch = out.match(/const totalSlides = (\d+);/);
  const titlesMatch = out.match(/const slideTitles = (\[[\s\S]*?\]);/);
  const notesMatch = out.match(/const teacherNotesMap = (\{[\s\S]*?\});/);
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

  // 3. Parse base slide bodies (document order) + available sections.
  const baseSlides = parseBaseSlides(out);
  if (baseSlides.length !== baseTotal) {
    console.warn(
      `  ! ${id}: parsed ${baseSlides.length} slide bodies but totalSlides=${baseTotal} — skipping HTML injection`,
    );
    return out;
  }
  const availableSections = new Set(baseSlides.map((s) => s.section).filter(Boolean));

  // 4. Group records by placement and resolve to concrete sections.
  const groups = groupRecordsByPlacement(records, availableSections);

  // 5. For each group, find the insertion slot = the base slide index AFTER which
  //    to insert (the LAST base slide of that section; 'end' → after the last
  //    slide overall). Build a map: baseSlideIndex → [groups to insert after it].
  //    -1 means "before all base slides" (not used; falls through to end).
  const lastIndexOfSection = (section) => {
    let idx = -1;
    baseSlides.forEach((s, i) => {
      if (s.section === section) idx = i;
    });
    return idx;
  };
  const insertAfter = new Map(); // baseIndex (0-based) → array of groups
  const endGroups = [];
  for (const g of groups) {
    if (g.section === 'end') {
      endGroups.push(g);
      continue;
    }
    const slot = lastIndexOfSection(g.section);
    if (slot === -1) {
      endGroups.push(g); // section genuinely missing → tack to end
    } else {
      if (!insertAfter.has(slot)) insertAfter.set(slot, []);
      insertAfter.get(slot).push(g);
    }
  }

  // Capture the pristine base sidebar so re-runs can restore it verbatim.
  const baseNavInner = captureNavInner(out);

  // 6. Single-pass rebuild: splice reveal slide bodies into the base HTML at the
  //    resolved section anchors, renumber every id, and rebuild the
  //    slideTitles / totalSlides / teacherNotesMap / thumbnail structures.
  return interleaveRebuild(out, baseSlides, baseTitles, notesMatch, insertAfter, endGroups, reveal, id, baseNavInner);
}

/**
 * Single-pass rebuild: splice reveal slide bodies + thumbs into the base HTML at
 * resolved section anchors, renumber all ids, and rebuild slideTitles /
 * totalSlides / teacherNotesMap / thumbnails. Returns the new HTML string.
 */
function interleaveRebuild(out, baseSlides, baseTitles, notesMatch, insertAfter, endGroups, reveal, id, baseNavInner) {
  // Parse base teacher notes map (keyed by original 1-based slide number).
  let baseNotes = {};
  if (notesMatch) {
    try {
      baseNotes = JSON.parse(notesMatch[1]);
    } catch {
      baseNotes = {};
    }
  }

  // ── Build the new slide-body region by stitching segments of `out` between
  //    base slide opening tags, injecting reveal fragments after the right ones.
  // We locate each base slide's opening-tag index, plus the next boundary.
  const watermarkIdx = out.search(/<div class="slide-watermark">/);
  const boundaries = baseSlides.map((s) => s.openIdx).concat([watermarkIdx >= 0 ? watermarkIdx : out.length]);

  const newTitles = [];
  const newNotes = {};
  let runningNum = 0;
  let globalReveal = 0;

  let html = out.slice(0, boundaries[0]); // everything before slide-1

  for (let i = 0; i < baseSlides.length; i++) {
    const segStart = boundaries[i];
    const segEnd = boundaries[i + 1];
    let segment = out.slice(segStart, segEnd);

    // Split the base segment into [body] + [trailing whitespace] so any reveal
    // slide is inserted AFTER the slide body but BEFORE that whitespace,
    // keeping insertion + strip perfectly symmetric (idempotent).
    const wsMatch = segment.match(/\s*$/);
    const trailing = wsMatch ? wsMatch[0] : '';
    let body = trailing ? segment.slice(0, segment.length - trailing.length) : segment;

    // Renumber this base slide's id in the body.
    runningNum += 1;
    const thisNum = runningNum;
    body = body.replace(/id="slide-\d+"/, `id="slide-${thisNum}"`);
    html += body;

    // Title + note carry over (remap note key by new number).
    newTitles.push(baseTitles[i] != null ? baseTitles[i] : '');
    const origKey = String(i + 1);
    if (baseNotes[origKey] != null) newNotes[String(thisNum)] = baseNotes[origKey];

    // Insert any reveal groups slotted after this base slide.
    const slotted = insertAfter.get(i) || [];
    for (const g of slotted) {
      for (let r = 0; r < g.records.length; r++) {
        runningNum += 1;
        globalReveal += 1;
        const rec = g.records[r];
        const num = runningNum;
        html += '\n        ' + revealSlideBodyNumbered(rec, g.section, globalReveal - 1, num);
        newTitles.push(revealTitle(rec, g.section));
        newNotes[String(num)] = rec.caption || `Official Reveal Math slide for the ${g.section} part of this lesson.`;
      }
    }
    // Re-attach the base segment's trailing whitespace last.
    html += trailing;
  }

  // Append any end-placed groups just before the watermark.
  let tail = out.slice(boundaries[boundaries.length - 1]);
  for (const g of endGroups) {
    let frag = '';
    for (let r = 0; r < g.records.length; r++) {
      runningNum += 1;
      globalReveal += 1;
      const rec = g.records[r];
      const num = runningNum;
      frag += '\n        ' + revealSlideBodyNumbered(rec, g.section === 'end' ? 'closure' : g.section, globalReveal - 1, num);
      newTitles.push(revealTitle(rec, g.section === 'end' ? 'closure' : g.section));
      newNotes[String(num)] = rec.caption || 'Official Reveal Math slide (end of lesson).';
    }
    html += frag;
  }
  html += tail;

  const newTotal = runningNum;

  // ── Inject scoped CSS once (before the first slide-body, inside the canvas).
  html = html.replace(/<article class="slide-canvas"[^>]*>/, (tag) => `${tag}\n        ${REVEAL_CSS}`);

  // ── Rebuild the thumbnail sidebar entirely (base thumbs renumbered + reveal
  //    thumbs spliced at the right ordinal positions).
  html = rebuildThumbnails(html, baseSlides, insertAfter, endGroups);

  // ── Patch JS constants. Use function replacers so any `$` in JSON (e.g. a
  //    caption with a literal dollar sign) is never treated as a backreference.
  const titlesJson = JSON.stringify(newTitles);
  const notesJson = JSON.stringify(newNotes);
  html = html.replace(/const totalSlides = \d+;/, () => `const totalSlides = ${newTotal};`);
  html = html.replace(/const slideTitles = \[[\s\S]*?\];/, () => `const slideTitles = ${titlesJson};`);
  if (notesMatch) {
    html = html.replace(/const teacherNotesMap = \{[\s\S]*?\};/, () => `const teacherNotesMap = ${notesJson};`);
  }

  // ── Write the state comment storing the BASE values for clean re-runs.
  const state = {
    totalSlides: baseSlides.length,
    slideTitlesRaw: JSON.stringify(baseTitles),
    teacherNotesRaw: notesMatch ? notesMatch[1] : null,
    navInner: baseNavInner,
  };
  const stateComment = `${STATE_BEGIN}${encodeURIComponent(JSON.stringify(state))}${STATE_END}`;
  html = html.replace(/<div class="slide-watermark">/, (tag) => `${stateComment}\n        ${tag}`);

  return html;
}

/** Render one reveal slide body with an explicit final slide number. */
function revealSlideBodyNumbered(rec, section, globalIndex, num) {
  const rel = `${REVEAL_DIRNAME}/${rec.file}`;
  const pageLabel = `Reveal slide ${globalIndex + 1}`;
  const alt = rec.caption ? `${pageLabel} — ${rec.caption}` : pageLabel;
  const notes = rec.caption || `Official Reveal Math slide for the ${section} part of this lesson.`;
  return `${HTML_BEGIN}
        <div class="slide-body reveal-slide reveal-slide-image" id="slide-${num}" data-section="${esc(section)}" data-slide-type="reveal" data-teacher-notes="${esc(notes)}">
          <div class="reveal-image-frame">
            <span class="reveal-page-badge">📘 Reveal Math</span>
            <img class="reveal-image" src="${esc(rel)}" alt="${esc(alt)}" loading="lazy" decoding="async" />
            ${rec.caption ? `<p class="reveal-image-caption">${esc(rec.caption)}</p>` : ''}
          </div>
        </div>
        ${HTML_END}`;
}

/**
 * Rebuild the entire <nav class="sidebar-slides"> thumbnail list so thumbs match
 * the new slide order + numbering. Base thumbs are renumbered in order, with
 * reveal thumbs spliced after the base thumb at each slot index.
 */
function rebuildThumbnails(html, baseSlides, insertAfter, endGroups) {
  const navRe = /<nav class="sidebar-slides">([\s\S]*?)<\/nav>/;
  const navMatch = html.match(navRe);
  if (!navMatch) return html;
  const inner = navMatch[1];
  // Extract base thumb cards in order (preserve their preview content/emoji).
  const cardRe = /<div class="thumb-card[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g;
  const baseCards = inner.match(cardRe) || [];

  const cards = [];
  let num = 0;
  let revealCount = 0;

  // Renumber a base card: drop 'active', set data-slide/onclick/label to slideNum.
  const renumberBase = (rawCard, slideNum) =>
    rawCard
      .replace(/class="thumb-card active"/, 'class="thumb-card"')
      .replace(/data-slide="\d+"/, `data-slide="${slideNum}"`)
      .replace(/onclick="goToSlide\(\d+\)"/, `onclick="goToSlide(${slideNum})"`)
      .replace(/<span class="thumb-label">[^<]*<\/span>/, `<span class="thumb-label">Slide ${slideNum}</span>`);

  const revealCard = (slideNum, label) =>
    `<div class="thumb-card reveal-thumb" data-slide="${slideNum}" onclick="goToSlide(${slideNum})">
        <span class="thumb-label">Slide ${slideNum}</span>
        <div class="thumb-preview">${label}</div>
      </div>`;

  const emitGroup = (g) => {
    for (let r = 0; r < g.records.length; r++) {
      num += 1;
      revealCount += 1;
      cards.push(revealCard(num, `📘 R${revealCount}`));
    }
  };

  for (let i = 0; i < baseSlides.length; i++) {
    num += 1;
    const baseCard =
      baseCards[i] ||
      `<div class="thumb-card" data-slide="${num}" onclick="goToSlide(${num})">\n        <span class="thumb-label">Slide ${num}</span>\n        <div class="thumb-preview">Slide</div>\n      </div>`;
    cards.push(renumberBase(baseCard, num));
    (insertAfter.get(i) || []).forEach(emitGroup);
  }
  endGroups.forEach(emitGroup);

  const newInner = '\n\n      ' + cards.join('\n\n      ') + '\n\n    ';
  return html.replace(navRe, () => `<nav class="sidebar-slides">${newInner}</nav>`);
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

// Map a resolved placement section to a PPTX interleave point.
//   launch / instruction / explore / vocabulary  → right after the objectives
//   practice / connect / closure                 → right after independent practice
//   end                                          → very end of the deck
function pptxHookForSection(section) {
  if (section === 'end') return 'end';
  if (['launch', 'instruction', 'explore', 'vocabulary'].includes(section)) return 'afterObjectives';
  return 'afterPractice'; // practice, connect, closure
}

/** Add one full-bleed, editable Reveal picture slide to the deck. */
function addRevealPictureSlide(pptx, reveal, rec, globalIndex, total) {
  const slide = pptx.addSlide();
  slide.background = { color: PT.sand };
  const abs = path.join(reveal.dir, rec.file);
  const dataUri = imageDataUri(abs);
  slide.addText(`📘 Reveal ${globalIndex + 1} / ${total}`, { x: 0.2, y: 0.08, w: 3, h: 0.3, fontFace: 'Outfit', fontSize: 10, bold: true, color: PT.navy, valign: 'middle' });
  slide.addImage({ data: dataUri, x: 0.25, y: 0.45, w: W - 0.5, h: H - 0.9, sizing: { type: 'contain', w: W - 0.5, h: H - 0.9 } });
  if (rec.caption) {
    slide.addText(rec.caption, { x: 0.5, y: H - 0.4, w: W - 1, h: 0.32, fontFace: 'Hanken Grotesk', fontSize: 10, color: PT.navy, align: 'center', valign: 'middle' });
    slide.addNotes(rec.caption);
  }
}

async function rebuildPptxWithReveal(id, data, reveal) {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'NEFT_169', width: W, height: H });
  pptx.layout = 'NEFT_169';
  pptx.author = 'Neft Teacher';
  pptx.company = 'Neft Teacher';
  pptx.title = `Lesson ${id}: ${data.title || 'Math Lesson'}`;
  pptx.subject = data.standard || '';

  // Resolve each record's placement to a section, then to a PPTX hook point so
  // Reveal picture slides land NEAR their lesson phase rather than all at the end.
  // (pptxgenjs builds in a fixed order, so we use named boundaries in
  // buildPptxDeck — afterObjectives / afterPractice / end — to interleave.)
  const sectionFor = (placement) => (placement === 'end' ? 'end' : placement);
  const buckets = { afterObjectives: [], afterPractice: [], end: [] };
  reveal.records.forEach((rec, i) => {
    const hook = pptxHookForSection(sectionFor(rec.placement));
    buckets[hook].push({ rec, globalIndex: i });
  });

  const total = reveal.records.length;
  const emitBucket = (name) => (pptxInstance) => {
    for (const { rec, globalIndex } of buckets[name]) {
      addRevealPictureSlide(pptxInstance, reveal, rec, globalIndex, total);
    }
  };

  // Base notebook deck + interleaved Reveal picture slides at the hook points.
  buildPptxDeck(pptx, extractPptxContent(id, data), {
    afterObjectives: emitBucket('afterObjectives'),
    afterPractice: emitBucket('afterPractice'),
    end: emitBucket('end'),
  });

  const outPath = path.join(lessonsDir, id, 'slides.pptx');
  await pptx.writeFile({ fileName: outPath });
  return outPath;
}

// ── config.revealSlides (HTML lesson page) ──────────────────────────────────
// Derive the canonical per-slide entries the engine renderer reads. Placement is
// already resolved on each record, so deck and lesson page stay in lock-step.
function buildRevealConfig(id, records) {
  return records.map((rec, i) => ({
    src: `/lessons/${id}/${REVEAL_DIRNAME}/${rec.file}`,
    caption: rec.caption || '',
    placement: rec.placement || 'launch',
    page: Number.isFinite(rec.order) ? rec.order : i + 1,
  }));
}

function configsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Idempotently sync the managed `config.revealSlides` field. When `entries` is
 * null/empty the field is REMOVED if present (clean revert); otherwise it is
 * set/replaced in place, preserving all other keys + order and the repo's
 * formatting (2-space JSON + single trailing newline).
 * Returns: 'config-missing' | 'noop' | 'added' | 'updated' | 'removed'
 * (suffixed ' (dry)' when dryRun).
 */
function syncRevealConfig(configPath, entries, { dryRun }) {
  if (!fs.existsSync(configPath)) return 'config-missing';
  const raw = fs.readFileSync(configPath, 'utf8');
  const data = JSON.parse(raw);
  const had = Object.prototype.hasOwnProperty.call(data, CONFIG_FIELD);
  const want = Array.isArray(entries) && entries.length ? entries : null;

  let action;
  if (!want) {
    if (!had) return 'noop';
    action = 'removed';
    delete data[CONFIG_FIELD];
  } else if (!had) {
    action = 'added';
    data[CONFIG_FIELD] = want;
  } else if (!configsEqual(data[CONFIG_FIELD], want)) {
    action = 'updated';
    data[CONFIG_FIELD] = want;
  } else {
    return 'noop';
  }

  const next = JSON.stringify(data, null, 2) + '\n';
  if (next === raw) return 'noop';
  if (!dryRun) fs.writeFileSync(configPath, next, 'utf8');
  return dryRun ? `${action} (dry)` : action;
}

// ── per-lesson driver ──

async function processLesson(id, { dryRun }) {
  const reveal = resolveRevealSlides(id);
  const configPath = path.join(lessonsDir, id, 'config.json');

  // No reveal-slides/ folder (or no usable images): decks stay untouched, but
  // config.revealSlides must be REMOVED if a prior run set it, so the lesson
  // page reverts cleanly.
  if (reveal === null || !reveal.records.length) {
    const reason = reveal === null ? 'no reveal-slides/ folder' : 'reveal-slides/ folder has no usable images';
    const cfg = syncRevealConfig(configPath, null, { dryRun });
    if (cfg === 'removed' || cfg === 'removed (dry)') {
      return { id, status: dryRun ? 'would-change' : 'config-cleared', reason, changes: [`config.json ← removed config.${CONFIG_FIELD}`] };
    }
    return { id, status: 'skipped', reason };
  }

  const htmlPath = path.join(lessonsDir, id, 'slides.html');
  const pptxPath = path.join(lessonsDir, id, 'slides.pptx');

  const n = reveal.records.length;
  const revealConfig = buildRevealConfig(id, reveal.records);
  const changes = [];
  if (!fs.existsSync(htmlPath)) {
    changes.push('slides.html MISSING — run `node scripts/generate-slides.mjs ' + id + '` first');
  } else {
    changes.push(`slides.html ← +${n} Reveal slide${n === 1 ? '' : 's'} interleaved by placement`);
  }
  if (!fs.existsSync(configPath)) {
    changes.push('config.json MISSING — cannot rebuild slides.pptx or set config.' + CONFIG_FIELD);
  } else {
    changes.push(`slides.pptx ← +${n} Reveal picture slide${n === 1 ? '' : 's'} interleaved by placement`);
    const cfgAction = syncRevealConfig(configPath, revealConfig, { dryRun });
    changes.push(
      cfgAction === 'noop'
        ? `config.${CONFIG_FIELD} ← already up to date (${revealConfig.length})`
        : `config.${CONFIG_FIELD} ← ${cfgAction} (${revealConfig.length} slide${revealConfig.length === 1 ? '' : 's'} → HTML lesson)`,
    );
  }

  if (dryRun) {
    return { id, status: 'would-change', reveal, changes };
  }

  // HTML deck (interleaved)
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const next = injectIntoHtml(html, reveal, id);
    if (next !== html) fs.writeFileSync(htmlPath, next, 'utf8');
  }

  // PPTX deck (interleaved). config.revealSlides already written above.
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
  let cleared = 0;

  for (const id of lessons) {
    try {
      const res = await processLesson(id, opts);
      if (res.status === 'skipped') {
        skipped++;
        // Keep skip output quiet for full-repo runs unless a single lesson was targeted.
        if (opts.lesson) console.log(`  - ${id}: skipped (${res.reason})`);
      } else if (res.status === 'config-cleared') {
        cleared++;
        console.log(`  ✓ ${id}: cleared (${res.reason})`);
        res.changes.forEach((c) => console.log(`      • ${c}`));
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
    `Done. integrated=${integrated} cleared=${cleared} wouldChange=${wouldChange} skipped=${skipped} (of ${lessons.length}).`,
  );
}

main();
