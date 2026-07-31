import { augmentVocabWithGlossary, surfaceMatchesEntry } from "./math-glossary.js";
import { el } from "./small-group-ui.js";
import { configureVocabImage } from "./vocab-images.js";

const FORBIDDEN_SELECTION =
  "button, input, textarea, select, dialog, .sg-annotation-tools, .sg-teacher, .sg-facilitation, .sg-evidence-card";
// NOTE: [hidden] is deliberately NOT excluded — triggers install after the
// tab rail mounts, when every non-active panel is hidden; skipping hidden
// text would strip inline vocabulary from all but the landing tab. Triggers
// created inside hidden panels/reveals stay hidden until the student opens
// them, so nothing leaks.
// Headings are excluded on purpose. The trigger is a <button aria-label="MAD:
// open definition">, and a button inside an <h2> becomes part of that heading's
// accessible name — so a screen-reader user navigating by heading heard "MAD:
// open definition Check Lab" instead of "MAD Check Lab". Headings are how a
// student using assistive tech moves through a long single-scroll studio, so
// they stay clean; the acronym still gets its underline and pop-up in the prose
// directly beneath, which a fleet audit confirmed on every lesson that uses one.
const VOCAB_EXCLUSIONS =
  "h1, h2, h3, h4, button, input, textarea, select, option, label, summary, script, style, dialog, .sg-annotation-tools, .sg-vcard, .sg-match, .sg-cloze, .sg-langbar, .sg-welcome, .sg-teacher, .sg-facilitation, .sg-evidence-card";

function elementFor(node) {
  return node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
}

function rangeIsStudentText(range, app) {
  if (!range || range.collapsed || !range.toString().trim()) return false;
  const start = elementFor(range.startContainer);
  const end = elementFor(range.endContainer);
  const common = elementFor(range.commonAncestorContainer);
  if (!start || !end || !common || !app.contains(start) || !app.contains(end)) return false;
  if (start.closest(FORBIDDEN_SELECTION) || end.closest(FORBIDDEN_SELECTION)) return false;
  return Boolean(common.closest("section.sg-sec, .sg-mission, .sg-hero"));
}

function unwrap(node) {
  const parent = node?.parentNode;
  if (!parent) return;
  while (node.firstChild) parent.insertBefore(node.firstChild, node);
  node.remove();
  parent.normalize();
}

function createAnnotationTools(app) {
  // Collapsed by default so the actual lesson — not the toolbar — is the
  // first thing under the tab rail; the selection listener attaches lazily.
  const tools = el("aside", "sg-annotation-tools");
  tools.setAttribute("role", "region");
  tools.setAttribute("aria-label", "Study mark-up tools");
  const shell = el("details", "sg-annotation-shell");
  const summary = el(
    "summary",
    "sg-annotation-summary",
    '<span class="sg-annotation-summary-icon" aria-hidden="true">🖍️</span>' +
      '<span class="sg-annotation-summary-label">Mark up this page</span>',
  );
  summary.dataset.testid = "study-markup-toggle";
  shell.appendChild(summary);
  tools.appendChild(shell);
  const inner = el("div", "sg-annotation-inner");
  shell.appendChild(inner);
  inner.innerHTML = `
    <div class="sg-annotation-copy">
      <strong>Make the lesson yours</strong>
      <span>Select words in the lesson, then highlight or bold them.</span>
    </div>
  `;

  const actions = el("div", "sg-annotation-actions");
  const highlight = el(
    "button",
    "sg-annotation-btn highlight",
    '<span aria-hidden="true">🖍️</span> Highlight',
  );
  highlight.type = "button";
  highlight.setAttribute("aria-label", "Highlight selected words");
  const bold = el("button", "sg-annotation-btn bold", '<b aria-hidden="true">B</b> Bold');
  bold.type = "button";
  bold.setAttribute("aria-label", "Bold selected words");
  const undo = el("button", "sg-annotation-btn quiet", "↶ Undo");
  undo.type = "button";
  undo.disabled = true;
  undo.setAttribute("aria-label", "Undo last mark-up");
  const clear = el("button", "sg-annotation-btn quiet", "Clear");
  clear.type = "button";
  clear.setAttribute("aria-label", "Clear all mark-up");
  const status = el("span", "sg-annotation-status", "Select a useful phrase to begin.");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  actions.append(highlight, bold, undo, clear);
  inner.append(actions, status);

  let savedRange = null;
  const history = [];
  const rememberSelection = () => {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (rangeIsStudentText(range, app)) {
      savedRange = range.cloneRange();
      status.textContent = `Ready to mark “${range.toString().trim().slice(0, 48)}${range.toString().trim().length > 48 ? "…" : ""}”`;
    }
  };
  let listening = false;
  shell.addEventListener("toggle", () => {
    if (!shell.open || listening) return;
    listening = true;
    document.addEventListener("selectionchange", rememberSelection);
  });

  const applyMark = (tag, className, verb) => {
    if (!rangeIsStudentText(savedRange, app)) {
      status.textContent = "Select words inside one lesson section, then try again.";
      return;
    }
    const wrapper = document.createElement(tag);
    wrapper.className = className;
    wrapper.appendChild(savedRange.extractContents());
    savedRange.insertNode(wrapper);
    history.push(wrapper);
    undo.disabled = false;
    status.textContent = `${verb} “${wrapper.textContent.trim().slice(0, 48)}”`;
    savedRange = null;
    window.getSelection()?.removeAllRanges();
  };

  highlight.addEventListener("pointerdown", (event) => event.preventDefault());
  bold.addEventListener("pointerdown", (event) => event.preventDefault());
  highlight.addEventListener("click", () =>
    applyMark("mark", "sg-student-highlight", "Highlighted"),
  );
  bold.addEventListener("click", () => applyMark("strong", "sg-student-bold", "Bolded"));
  undo.addEventListener("click", () => {
    const latest = history.pop();
    if (latest?.isConnected) unwrap(latest);
    undo.disabled = history.length === 0;
    status.textContent = latest ? "Last mark-up removed." : "Nothing to undo yet.";
  });
  clear.addEventListener("click", () => {
    app.querySelectorAll(".sg-student-highlight, .sg-student-bold").forEach(unwrap);
    history.length = 0;
    undo.disabled = true;
    status.textContent = "All mark-up cleared. You can start fresh.";
  });
  return tools;
}

function createVocabularyDialog() {
  const dialog = document.createElement("dialog");
  dialog.className = "sg-vocab-dialog";
  dialog.setAttribute("aria-labelledby", "sg-vocab-dialog-title");
  dialog.innerHTML = `
    <div class="sg-vocab-dialog-top">
      <span class="sg-vocab-dialog-kicker">Math word spotlight</span>
      <button class="sg-vocab-close" type="button" aria-label="Close definition">×</button>
    </div>
    <h2 id="sg-vocab-dialog-title"></h2>
    <div class="sg-vocab-dialog-grid">
      <img alt="" width="320" height="220" />
      <div>
        <div class="sg-vocab-language" lang="en">
          <div class="sg-vocab-simple">English</div>
          <p class="sg-vocab-definition sg-vocab-definition-en"></p>
        </div>
        <div class="sg-vocab-language" lang="es">
          <div class="sg-vocab-simple">Español · <span class="sg-vocab-term-es"></span></div>
          <p class="sg-vocab-definition sg-vocab-definition-es"></p>
        </div>
        <div class="sg-vocab-example-wrap">
          <strong>Picture it</strong>
          <p class="sg-vocab-example"></p>
        </div>
      </div>
    </div>
  `;
  const close = dialog.querySelector(".sg-vocab-close");
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.body.appendChild(dialog);
  return dialog;
}

function openVocabulary(dialog, word, trigger) {
  const definition = word.definition || word.visual || "A useful word for today's math thinking.";
  // Acronyms say what they stand for, then give the full term's definition.
  dialog.querySelector("h2").textContent = word.expandsTo
    ? `${word.term} — ${word.expandsTo}`
    : word.term;
  dialog.querySelector(".sg-vocab-definition-en").textContent = definition;
  // English + Spanish only; hide the Spanish block when a word has no
  // translation instead of rendering an empty (or "undefined") line.
  const spanishBlock = dialog.querySelector('.sg-vocab-language[lang="es"]');
  const hasSpanish = Boolean(word.definitionEs || word.termEs);
  spanishBlock.hidden = !hasSpanish;
  dialog.querySelector(".sg-vocab-definition-es").textContent = word.definitionEs || "";
  dialog.querySelector(".sg-vocab-term-es").textContent = word.termEs || "";
  const example = dialog.querySelector(".sg-vocab-example");
  example.textContent =
    word.visual || `Look for ${(word.expandsTo || word.term).toLowerCase()} in the lesson model.`;
  configureVocabImage(dialog.querySelector("img"), word, { eager: true });
  dialog.addEventListener("close", () => trigger.focus(), { once: true });
  dialog.showModal();
  dialog.querySelector(".sg-vocab-close").focus();
}

function vocabularyPattern(words) {
  const terms = words
    .map((word) => String(word.term || "").trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // Trailing `(?:es|s)?` lets a plural underline the WHOLE word/phrase
  // ("equivalent ratios", "scale factors") instead of leaving the plural
  // form unmatched — parity with the main lesson underliner.
  return terms.length
    ? new RegExp(`(^|[^A-Za-z0-9])((?:${terms.join("|")})(?:es|s)?)(?=$|[^A-Za-z0-9])`, "gi")
    : null;
}

function addVocabularyTriggers(app, words, dialog) {
  const pattern = vocabularyPattern(words);
  if (!pattern) return null;
  const byTerm = new Map(words.map((word) => [word.term.toLocaleLowerCase(), word]));
  const counts = new Map();
  const annotate = (root) => annotateWithin(root, { pattern, byTerm, counts, dialog });
  annotate(app);
  return annotate;
}

function annotateWithin(root, { pattern, byTerm, counts, dialog }) {
  if (!root || !root.isConnected) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!node.textContent?.trim() || !parent || parent.closest(VOCAB_EXCLUSIONS)) {
        return NodeFilter.FILTER_REJECT;
      }
      pattern.lastIndex = 0;
      return pattern.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const textNodes = [];
  let node = walker.nextNode();
  while (node) {
    textNodes.push(node);
    node = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent;
    // Cap triggers per term PER SECTION (not per page) so late sections —
    // the Explore/Model/Apply labs — still get their vocabulary underlined
    // instead of the whole budget being spent in Launch/Build.
    const sectionId =
      textNode.parentElement?.closest("section.sg-sec, .sg-hero, .sg-mission")?.id || "page";
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let changed = false;
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const termText = match[2];
      const key = termText.toLocaleLowerCase();
      // Match plural forms back to their singular glossary entry.
      const word =
        byTerm.get(key) || byTerm.get(key.replace(/es$/, "")) || byTerm.get(key.replace(/s$/, ""));
      const countKey = `${sectionId}:${word?.term}`;
      const count = counts.get(countKey) || 0;
      const termStart = match.index + match[1].length;
      if (!word || count >= 2) continue;
      // Acronym entries (LCM, GCF, MAD…) only match their exact uppercase form.
      if (!surfaceMatchesEntry(termText, word)) continue;
      fragment.append(text.slice(cursor, termStart));
      const trigger = el("button", "sg-vocab-inline", termText);
      trigger.type = "button";
      trigger.setAttribute("aria-label", `${word.term}: open definition`);
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.addEventListener("click", () => openVocabulary(dialog, word, trigger));
      fragment.appendChild(trigger);
      cursor = termStart + termText.length;
      counts.set(countKey, count + 1);
      changed = true;
    }
    if (!changed) return;
    fragment.append(text.slice(cursor));
    textNode.replaceWith(fragment);
  });
}

export function installSmallGroupAnnotation(app, config) {
  const tools = createAnnotationTools(app);
  // Docked to the right edge (position: fixed) so mark-up stays reachable at
  // any scroll depth. Mounted on <body>, not inside `app`, so the motion
  // layer's animated (transformed) ancestors can't break fixed positioning.
  document.body.appendChild(tools);
  const dialog = createVocabularyDialog();
  // Lesson vocabulary plus the shared math glossary, so a math word opens its
  // definition+image popup wherever it appears (not just the first 8 authored
  // terms). The 2-per-section cap in addVocabularyTriggers keeps it readable.
  const annotate = addVocabularyTriggers(app, augmentVocabWithGlossary(config.vocabulary), dialog);
  if (annotate) watchForLateContent(app, annotate);
}

// The pass above walks the DOM once, at mount. Everything a student reveals
// afterwards — the hint ladder above all, but also step feedback, unlocked
// stages and lab content — was therefore structurally invisible to it: a fleet
// probe found ZERO vocabulary triggers across 60 hint blocks. Hints are where a
// stuck student most needs a definition, so the pass has to follow the DOM.
//
// Re-entrancy is the whole difficulty: annotating replaces a text node with a
// fragment containing a <button>, which is itself a mutation. `busy` plus
// draining the observer's own records after each batch keeps that from looping.
// (Trigger buttons could not be re-annotated anyway — `button` is in
// VOCAB_EXCLUSIONS — but the records would still queue up on every reveal.)
function watchForLateContent(app, annotate) {
  if (typeof MutationObserver === "undefined") return;
  let busy = false;
  let queued = [];
  const flush = () => {
    const roots = queued;
    queued = [];
    if (!roots.length) return;
    busy = true;
    try {
      for (const root of roots) annotate(root);
    } finally {
      observer.takeRecords();
      busy = false;
    }
  };
  const observer = new MutationObserver((records) => {
    if (busy) return;
    for (const record of records) {
      for (const added of record.addedNodes) {
        // Element nodes are walked directly; a bare text node is handed to its
        // parent so the walker still applies VOCAB_EXCLUSIONS to it.
        const root = added.nodeType === Node.ELEMENT_NODE ? added : added.parentElement;
        if (root && !queued.includes(root)) queued.push(root);
      }
    }
    if (queued.length) flush();
  });
  observer.observe(app, { childList: true, subtree: true });
}
