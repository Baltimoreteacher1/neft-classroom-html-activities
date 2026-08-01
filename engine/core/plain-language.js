// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// The bottleneck in a grade-6 word problem is frequently the English, not the
// mathematics. A multilingual learner who can divide fractions perfectly well
// can still be stopped by "determine the remaining quantity". The lesson already
// offers a per-item "Explain it in simpler words" chip, but it had nothing to say
// — no lesson authors a `simpler` field, so it fell through to generic advice —
// and it only ever applied to one problem at a time.
//
// This turns it into a lesson-wide toggle, and gives it something real to do.
//
// THREE RULES, and the third is the one that makes this safe to ship:
//
//   1. Numbers and math notation are NEVER touched. Not reordered, not
//      reformatted, not rounded.
//   2. Words the lesson is TEACHING are never paraphrased. If "equivalent" is in
//      today's vocabulary list, the plain version still says "equivalent" —
//      simplifying the target vocabulary would quietly delete the lesson.
//   3. Every rewrite is VERIFIED before it is shown. The numeric and symbolic
//      tokens of the output must match the input exactly, in order. If they do
//      not, the rewrite is discarded and the original text is shown unchanged.
//      A simplifier that silently alters a quantity is far worse than no
//      simplifier, and a regex over natural language will eventually try.

const STORAGE_KEY = "nt-plain-language";

// Hand-checked pairs. Every entry is a general-English word, NOT a mathematical
// term: nothing here changes what a sentence claims about number. Words that ARE
// mathematics — equivalent, quantity, ratio, difference, product, estimate,
// factor, expression, per — are deliberately absent.
const PHRASE_MAP = [
  [/\bin order to\b/gi, "to"],
  [/\bprior to\b/gi, "before"],
  [/\bis equal to\b/gi, "is the same as"],
  [/\bconsists of\b/gi, "has"],
  [/\bare given\b/gi, "have"],
  [/\bin the event that\b/gi, "if"],
  [/\bat this point in time\b/gi, "now"],
  [/\ba total of\b/gi, ""],
  // Test-register phrasings. "Which of the following" is the single most common
  // piece of assessment English in the fleet and carries no information at all.
  [/\bwhich of the following\b/gi, "which one"],
  [/\beach of the\b/gi, "each"],
  [/\bthe following\b/gi, "this"],
  [/\bsuch that\b/gi, "so that"],
  [/\bstate the\b/gi, "say the"],
  [/\bas well as\b/gi, "and"],
];

const WORD_MAP = [
  [/\bdetermine\b/gi, "find"],
  [/\bcalculate\b/gi, "find"],
  [/\bcompute\b/gi, "work out"],
  [/\bidentify\b/gi, "find"],
  [/\bobtain\b/gi, "get"],
  [/\bpurchase[sd]?\b/gi, "buy"],
  [/\butilize[sd]?\b/gi, "use"],
  [/\bdemonstrate[sd]?\b/gi, "show"],
  [/\bindicate[sd]?\b/gi, "show"],
  [/\brepresents?\b/gi, "stands for"],
  [/\bapproximately\b/gi, "about"],
  [/\bsufficient\b/gi, "enough"],
  [/\bremaining\b/gi, "left"],
  [/\badditional\b/gi, "more"],
  [/\binitial\b/gi, "first"],
  [/\bsubsequent\b/gi, "next"],
  [/\bpreviously\b/gi, "before"],
  [/\bcurrently\b/gi, "now"],
  [/\bassist(?:s|ed)?\b/gi, "help"],
  [/\brequire[sd]?\b/gi, "need"],
  [/\bobserve[sd]?\b/gi, "see"],
  [/\bconstruct(?:s|ed)?\b/gi, "build"],
  [/\bmodify\b/gi, "change"],
  [/\bexamine[sd]?\b/gi, "look at"],
  [/\bevaluate\b/gi, "find the value of"],
  [/\bcomplete\b/gi, "finish"],
  [/\bdimensions\b/gi, "side lengths"],
  [/\bverify\b/gi, "check"],
  [/\bjustify\b/gi, "explain why"],
  [/\bprovide[sd]?\b/gi, "give"],
  [/\bproduce[sd]?\b/gi, "make"],
  [/\bcontains?\b/gi, "has"],
  [/\bselect[sd]?\b/gi, "pick"],
  [/\bportion\b/gi, "part"],
  [/\bseveral\b/gi, "some"],
  [/\bvarious\b/gi, "different"],
  [/\btypically\b/gi, "usually"],
  [/\bbeginning\b/gi, "start"],
  [/\bconvert[sd]?\b/gi, "change"],
];

/**
 * Every token that carries mathematical meaning, in order.
 * This is the fingerprint a rewrite must preserve exactly.
 */
export function mathTokens(text) {
  return String(text ?? "").match(/-?\d+(?:[.,]\d+)*(?:\/\d+)?|[%$]|[+\-×÷*/=<>≤≥≈]|\^\d+/g) || [];
}

/**
 * Rewrite `text` at a lower reading level.
 *
 * @param {string} text
 * @param {string[]} [protectedTerms] words the lesson is teaching — never changed
 * @returns {{ text: string, changed: boolean }}
 */
export function toPlainLanguage(text, protectedTerms = []) {
  const original = String(text ?? "");
  if (!original.trim()) return { text: original, changed: false };

  const guard = new Set(
    (protectedTerms || [])
      .flatMap((t) =>
        String(t || "")
          .toLowerCase()
          .split(/\s+/),
      )
      .filter(Boolean),
  );

  let out = original;
  for (const [pattern, replacement] of [...PHRASE_MAP, ...WORD_MAP]) {
    out = out.replace(pattern, (match) => {
      // Rule 2: never paraphrase today's vocabulary.
      if (guard.has(match.toLowerCase())) return match;
      // Preserve sentence-initial capitalisation.
      if (!replacement) return "";
      const isCapitalised = /^[A-Z]/.test(match);
      return isCapitalised
        ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
        : replacement;
    });
  }

  // Long compound sentences become two short ones at safe joints only.
  out = out.replace(/;\s+/g, ". ");
  // Tidy whatever the deletions left behind, without touching math spacing.
  out = out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.?!])/g, "$1")
    .trim();

  // Rule 3: verify, or discard.
  const before = mathTokens(original);
  const after = mathTokens(out);
  if (before.length !== after.length || before.some((tok, i) => tok !== after[i])) {
    return { text: original, changed: false };
  }

  return { text: out, changed: out !== original };
}

// ── Per-device preference ──────────────────────────────────────────────────

export function isPlainLanguageOn() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPlainLanguage(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    return true;
  } catch {
    return false;
  }
}

const PLAIN_SELECTOR = '[data-annotate="word-problem"], .problem-stem, .sp-stem-text';

// Original text, per rewritten text NODE, so the switch is reversible in place.
// A WeakMap rather than a data-attribute because the value is per-node, and its
// lifetime should be exactly the node's — a phase re-render re-applies from the
// freshly rendered original anyway.
const originalText = new WeakMap();

/**
 * Switch every problem stem inside `root` between its original and plain wording.
 *
 * Rewrites TEXT NODES, not `textContent`. Stems are not plain strings: they carry
 * screen-reader-only spans ("Problem 2 of 3."), and the vocabulary layer wraps
 * math terms in tappable glossary spans. Replacing textContent would silently
 * delete both — the accessibility affordance and the glossary — while looking
 * completely correct on screen.
 *
 * The whitespace dance below is not cosmetic. Once the glossary layer has run,
 * "What is the prime factorization of 30?" is three nodes — "What is the ",
 * the wrapped term, and " of 30?" — and the boundary spaces live at the END of
 * one node and the START of the next. toPlainLanguage() trims (correctly, for a
 * whole stem), so rewriting each node naively produced
 * "What is theprime factorizationof 30?" on screen. The padding is captured and
 * re-attached per node.
 *
 * @returns {number} how many elements now show plain wording
 */
export function applyPlainLanguage(root, on, protectedTerms = []) {
  if (!root?.querySelectorAll) return 0;
  let count = 0;

  for (const el of root.querySelectorAll(PLAIN_SELECTOR)) {
    // Screen-reader-only prefixes are navigation, not the problem. Leave them.
    const nodes = [];
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 3) {
          if (child.parentElement?.classList?.contains("sr-only")) continue;
          if (child.nodeValue?.trim()) nodes.push(child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      }
    };
    walk(el);
    if (!nodes.length) continue;

    if (on) {
      if (el.dataset.plainOn === "1") {
        count += 1;
        continue;
      }
      let touched = false;
      for (const node of nodes) {
        const source = node.nodeValue;
        const lead = source.match(/^\s*/)[0];
        const tail = source.match(/\s*$/)[0];
        const { text, changed } = toPlainLanguage(source, protectedTerms);
        if (!changed) continue;
        originalText.set(node, source);
        node.nodeValue = lead + text + tail;
        touched = true;
      }
      if (!touched) continue;
      el.dataset.plainOn = "1";
      count += 1;
    } else if (el.dataset.plainOn === "1") {
      for (const node of nodes) {
        if (originalText.has(node)) {
          node.nodeValue = originalText.get(node);
          originalText.delete(node);
        }
      }
      delete el.dataset.plainOn;
    }
  }
  return count;
}

/**
 * Mount the student-facing toggle. Unlike delayed feedback, this IS a student
 * choice: reading level is an access need, and a student is the best judge of
 * whether they can read the sentence.
 */
export function mountPlainLanguageToggle(host, { root, vocabulary = [], onChange } = {}) {
  if (!host) return null;
  const terms = (vocabulary || []).map((v) => v?.term).filter(Boolean);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-secondary btn-sm plain-language-toggle";
  btn.setAttribute("aria-pressed", isPlainLanguageOn() ? "true" : "false");

  const paint = () => {
    const on = isPlainLanguageOn();
    btn.textContent = on ? "🔤 Plain words: on" : "🔤 Plain words";
    btn.title = on
      ? "Showing simpler wording. The numbers and the maths are unchanged."
      : "Show the same problems with simpler wording. The numbers do not change.";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  };

  btn.addEventListener("click", () => {
    const next = !isPlainLanguageOn();
    setPlainLanguage(next);
    paint();
    applyPlainLanguage(root || document, next, terms);
    onChange?.(next);
  });

  paint();
  host.append(btn);

  // Apply the stored preference on mount, so it survives navigation.
  if (isPlainLanguageOn()) applyPlainLanguage(root || document, true, terms);

  return btn;
}

export default toPlainLanguage;
