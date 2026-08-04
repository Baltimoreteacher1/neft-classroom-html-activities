/**
 * Vocabulary linkification for generated slide decks.
 *
 * Historically the `.vocab-word` glossary links in `lessons/<id>/slides.html`
 * were added by a separate one-shot pass (`scripts/decorate_objectives_vocab.py`),
 * NOT by the deck generator. That meant regenerating a deck silently STRIPPED
 * working functionality, so the decks could never be refreshed from their
 * `config.json`. This module moves that behaviour into the generator.
 *
 * It also fixes the defect that `scripts/fix_vocab_attributes.py` exists to
 * clean up after: the old regex pass wrapped terms that appeared INSIDE HTML
 * attributes (`width="400"` became `<span ...>width</span>="400"`). This
 * linkifier is a real tokenizer — it only ever rewrites text nodes.
 *
 * Emitted markup is byte-identical to what the decks already ship:
 *   <span class="vocab-word" data-vocab="KEY" style="border-bottom:2px dotted
 *   #0284C7; color:#0284C7; font-weight:800; cursor:pointer;"
 *   onclick="openVocabModal('KEY')">TEXT</span>
 */

/**
 * Terms the glossary modal can render with a REAL definition.
 * Source of truth: the `VOCAB_DB` object in `assets/formula-popup.js`.
 * `openVocabModal` has a fallback branch that invents a generic definition for
 * unknown terms, but a generic definition is worse than no link, so this list
 * is deliberately restricted to keys `VOCAB_DB` actually defines.
 *
 * Kept as an explicit list (rather than parsed out of the browser bundle at
 * build time) so the generator has no runtime dependency on an asset file's
 * formatting; `vocab-linkify.test.mjs` asserts the two stay in sync.
 */
export const VOCAB_TERMS = [
  "add",
  "area",
  "base",
  "bases",
  "divide",
  "equation",
  "exponent",
  "expression",
  "factor",
  "fraction",
  "half",
  "height",
  "length",
  "multiple",
  "multiply",
  "parallel",
  "parallel lines",
  "parallelogram",
  "percent",
  "perimeter",
  "polygon",
  "rectangle",
  "ratio",
  "subtract",
  "trapezoid",
  "triangle",
  "unit rate",
  "variable",
  "volume",
  "width",
];

/** Elements whose text content must never be linkified. */
const SKIP_ELEMENTS = new Set([
  "script",
  "style",
  "textarea",
  "button",
  "option",
  "select",
  "label",
  "svg",
  "title",
  "head",
  "code",
  "pre",
]);

/** Opening tag of an element that starts a fresh "first occurrence" scope. */
const BLOCK_RE = /^<div\b[^>]*class="[^"]*\bslide-body\b/i;

const VOCAB_SPAN_RE = /^<span\b[^>]*class="vocab-word"/i;

function link(key, text) {
  return (
    `<span class="vocab-word" data-vocab="${key}" style="border-bottom:2px dotted #0284C7; ` +
    `color:#0284C7; font-weight:800; cursor:pointer;" onclick="openVocabModal('${key}')">${text}</span>`
  );
}

/** Reads one tag starting at `i` (html[i] === '<'); returns its end index (exclusive). */
function tagEnd(html, i) {
  if (html.startsWith("<!--", i)) {
    const close = html.indexOf("-->", i);
    return close === -1 ? html.length : close + 3;
  }
  let j = i + 1;
  let quote = null;
  while (j < html.length) {
    const c = html[j];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      return j + 1;
    }
    j++;
  }
  return html.length;
}

function tagName(html, i) {
  const m = /^<\/?([a-zA-Z][a-zA-Z0-9-]*)/.exec(html.slice(i, i + 24));
  return m ? m[1].toLowerCase() : null;
}

/**
 * Linkifies the text nodes of `html`.
 *
 * @param {string} html
 * @param {object} [opts]
 * @param {string[]} [opts.terms] term whitelist (defaults to VOCAB_TERMS)
 * @param {number} [opts.maxPerBlock] cap on links added per slide block
 * @returns {string}
 */
export function linkifyVocab(html, opts = {}) {
  const terms = (opts.terms || VOCAB_TERMS)
    .map((t) => t.toLowerCase())
    .sort((a, b) => b.length - a.length);
  const maxPerBlock = opts.maxPerBlock ?? Infinity;
  // Default scope is the whole deck: a term is linked at its FIRST occurrence
  // and never again. That keeps a deck at roughly 10-18 links (the sparse
  // density the hand-decorated decks had) instead of a sea of blue.
  const resetPerBlock = opts.resetPerBlock ?? false;
  // One matcher for all terms; longest-first alternation wins the overlap.
  const matcher = new RegExp(
    `(?<![\\w-])(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\w-])`,
    "gi",
  );

  /**
   * Links a later pass would otherwise be blind to: an existing `.vocab-word`
   * further down the block must count against the block's budget BEFORE the
   * text ahead of it is rewritten, or a second pass adds another one to a
   * slide that already had one.
   */
  function existingInBlock(from) {
    const nextBlock = html.slice(from).search(/<div\b[^>]*class="[^"]*\bslide-body\b/i);
    const region = nextBlock === -1 ? html.slice(from) : html.slice(from, from + nextBlock);
    return (region.match(/class="vocab-word"/g) || []).length;
  }

  let out = "";
  let i = 0;
  /** @type {Set<string>} */
  let used = new Set();
  let added = existingInBlock(0);

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      out += linkText(html.slice(i));
      break;
    }
    if (lt > i) out += linkText(html.slice(i, lt));

    const end = tagEnd(html, lt);
    const tag = html.slice(lt, end);
    const name = tagName(html, lt);

    if (resetPerBlock && BLOCK_RE.test(tag)) {
      // New slide: reset the "first occurrence" scope.
      used = new Set();
      added = existingInBlock(end);
    }

    if (name && !tag.startsWith("</") && SKIP_ELEMENTS.has(name) && !tag.endsWith("/>")) {
      // Copy through to the matching close tag, honouring nesting.
      let depth = 1;
      let j = end;
      let chunkEnd = html.length;
      while (j < html.length) {
        const nlt = html.indexOf("<", j);
        if (nlt === -1) break;
        const ne = tagEnd(html, nlt);
        const nn = tagName(html, nlt);
        if (nn === name) {
          if (html[nlt + 1] === "/") {
            depth--;
            if (depth === 0) {
              chunkEnd = ne;
              break;
            }
          } else if (!html.slice(nlt, ne).endsWith("/>")) {
            depth++;
          }
        }
        j = ne;
      }
      out += html.slice(lt, chunkEnd);
      i = chunkEnd;
      continue;
    }

    if (VOCAB_SPAN_RE.test(tag)) {
      // Never nest a link inside an existing one: copy the whole span through.
      const close = html.indexOf("</span>", end);
      const stop = close === -1 ? end : close + 7;
      out += html.slice(lt, stop);
      i = stop;
      continue;
    }

    out += tag;
    i = end;
  }

  return out;

  function linkText(text) {
    if (!text || added >= maxPerBlock || !/[A-Za-z]/.test(text)) return text;
    return text.replace(matcher, (match) => {
      if (added >= maxPerBlock) return match;
      const key = match.toLowerCase();
      if (used.has(key)) return match;
      used.add(key);
      added++;
      return link(key, match);
    });
  }
}

/**
 * The deck policy, in two passes:
 *
 *  1. Deck scope — link the FIRST occurrence of every term in the whole deck.
 *     This is what guarantees glossary coverage: a term a lesson actually uses
 *     is always reachable at least once.
 *  2. Slide scope, one link per slide — fills in the slides pass 1 left bare,
 *     so a student reading slide 14 still has a word to tap. A slide that
 *     already carries a link from pass 1 is left alone.
 *
 * The result is ~20-35 links per deck with at most ONE blue word per slide —
 * never the saturated "sea of blue" a naive replace-all produces.
 *
 * @param {string} html
 * @returns {string}
 */
export function linkifyDeck(html) {
  const pass1 = linkifyVocab(html, { resetPerBlock: false });
  return linkifyVocab(pass1, { resetPerBlock: true, maxPerBlock: 1 });
}

export default linkifyVocab;
