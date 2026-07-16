import { el } from "./small-group-ui.js";
import { configureVocabImage } from "./vocab-images.js";

const FORBIDDEN_SELECTION =
  "button, input, textarea, select, dialog, .sg-annotation-tools, .sg-teacher, .sg-facilitation, .sg-evidence-card";
const VOCAB_EXCLUSIONS =
  "button, input, textarea, select, option, label, summary, script, style, dialog, [hidden], .sg-annotation-tools, .sg-vcard, .sg-match, .sg-cloze, .sg-langbar, .sg-welcome, .sg-teacher, .sg-facilitation, .sg-evidence-card";

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
  const tools = el("aside", "sg-annotation-tools");
  tools.setAttribute("role", "region");
  tools.setAttribute("aria-label", "Study mark-up tools");
  tools.innerHTML = `
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
  tools.append(actions, status);

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
  document.addEventListener("selectionchange", rememberSelection);

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
  dialog.querySelector("h2").textContent = word.term;
  dialog.querySelector(".sg-vocab-definition-en").textContent = definition;
  // English + Spanish only; hide the Spanish block when a word has no
  // translation instead of rendering an empty (or "undefined") line.
  const spanishBlock = dialog.querySelector('.sg-vocab-language[lang="es"]');
  const hasSpanish = Boolean(word.definitionEs || word.termEs);
  spanishBlock.hidden = !hasSpanish;
  dialog.querySelector(".sg-vocab-definition-es").textContent = word.definitionEs || "";
  dialog.querySelector(".sg-vocab-term-es").textContent = word.termEs || "";
  const example = dialog.querySelector(".sg-vocab-example");
  example.textContent = word.visual || `Look for ${word.term.toLowerCase()} in the lesson model.`;
  const image = dialog.querySelector("img");
  configureVocabImage(image, word, { eager: true });
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
  return terms.length
    ? new RegExp(`(^|[^A-Za-z0-9])(${terms.join("|")})(?=$|[^A-Za-z0-9])`, "gi")
    : null;
}

function addVocabularyTriggers(app, words, dialog) {
  const pattern = vocabularyPattern(words);
  if (!pattern) return;
  const byTerm = new Map(words.map((word) => [word.term.toLocaleLowerCase(), word]));
  const counts = new Map();
  const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT, {
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
      const word = byTerm.get(termText.toLocaleLowerCase());
      const countKey = `${sectionId}:${word?.term}`;
      const count = counts.get(countKey) || 0;
      const termStart = match.index + match[1].length;
      if (!word || count >= 2) continue;
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
  const progress = app.querySelector(".sg-tabs, .sg-rail");
  const tools = createAnnotationTools(app);
  if (progress) progress.after(tools);
  else app.prepend(tools);
  const dialog = createVocabularyDialog();
  addVocabularyTriggers(app, (config.vocabulary || []).slice(0, 4), dialog);
}
