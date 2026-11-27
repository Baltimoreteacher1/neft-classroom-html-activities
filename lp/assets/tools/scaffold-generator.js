// Scaffold Generator: rules, not AI. Paste a task or text, pick a band; get readability numbers, simpler directions,
// chunked text with stop-and-check questions, a pre-teach glossary, visual-support ideas, an organizer and frames.
import { $, copyText, escapeHtml, loadDraft, readJson, saveDraft } from "../lib.js";
import { buildFrames, splitTerms } from "./frames-engine.js";

const banks = readJson("banks");
const form = $("[data-sg-form]");
const out = $("[data-sg-out]");

/* Plain-word swaps for directions. Original list. */
const SWAPS = [
  ["utilizing", "using"], ["utilize", "use"], ["determine", "find"], ["identify", "find"], ["locate", "find"],
  ["approximately", "about"], ["demonstrate", "show"], ["indicate", "show"], ["illustrate", "show"], ["obtain", "get"],
  ["require", "need"], ["sufficient", "enough"], ["commence", "start"], ["assist", "help"], ["construct", "make"],
  ["provide", "give"], ["examine", "look at"], ["compose", "write"], ["respond", "answer"], ["select", "choose"],
  ["record your", "write your"], ["record", "write down"], ["complete sentences", "full sentences"], ["subsequently", "then"],
  ["prior to", "before"], ["in order to", "to"], ["additional", "more"], ["numerous", "many"], ["regarding", "about"],
  ["individual", "single"], ["purchase", "buy"], ["evaluate", "judge"], ["analyze", "study"], ["summarize", "tell the main points of"],
];
/* Academic words a teacher may want to pre-teach, with a student-friendly meaning and Spanish. Original wording. */
const GLOSSARY = {
  analyze: ["look closely at the parts of something", "analizar"], cause: ["the reason something happens", "causa"],
  claim: ["what you say is true and will try to prove", "afirmación"], compare: ["tell how things are alike", "comparar"],
  condensation: ["when a gas cools and becomes a liquid", "condensación"], condense: ["change from a gas to a liquid", "condensar"],
  conclude: ["decide something after thinking about the facts", "concluir"], contrast: ["tell how things are different", "contrastar"],
  cycle: ["events that happen again and again in the same order", "ciclo"], data: ["facts and numbers you collect", "datos"],
  describe: ["tell what something is like", "describir"], detail: ["a small fact that tells more", "detalle"],
  determine: ["find out or decide", "determinar"], effect: ["what happens because of a cause", "efecto"],
  evaporate: ["change from a liquid to a gas", "evaporar"], evaporation: ["when a liquid changes into a gas", "evaporación"],
  evidence: ["facts that show something is true", "evidencia"], explain: ["tell how or why", "explicar"],
  identify: ["find and name", "identificar"], infer: ["figure out something the text does not say", "inferir"],
  justify: ["give reasons that show you are right", "justificar"], "main idea": ["what a text is mostly about", "idea principal"],
  observe: ["watch carefully", "observar"], paragraph: ["a group of sentences about one idea", "párrafo"],
  passage: ["a short piece of writing", "pasaje"], pattern: ["something that repeats in a regular way", "patrón"],
  precipitation: ["water that falls from clouds as rain or snow", "precipitación"], predict: ["say what you think will happen", "predecir"],
  process: ["steps that happen in order", "proceso"], ratio: ["a comparison of two quantities", "razón"],
  relate: ["show how things are connected", "relacionar"], sequence: ["the order things happen in", "secuencia"],
  summarize: ["tell the most important parts in a few words", "resumir"], support: ["help show that something is true", "apoyar"],
  vapor: ["water as a gas in the air", "vapor"], "water cycle": ["how water moves between land, ocean and sky", "ciclo del agua"],
  atmosphere: ["the air around the Earth", "atmósfera"], continuously: ["without stopping", "continuamente"],
  equation: ["a math sentence with an equal sign", "ecuación"], estimate: ["a careful guess", "estimación"],
  region: ["an area with things in common", "región"], government: ["the group that makes rules for a place", "gobierno"],
};

/* ---------- readability ---------- */
function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}
const sentencesOf = (text) =>
  text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map((s) => s.trim())
    .filter(Boolean);
const wordsOf = (text) => text.match(/[A-Za-z][A-Za-z'-]*/g) || [];
export function readability(text) {
  const s = sentencesOf(text);
  const w = wordsOf(text);
  if (!s.length || !w.length) return { words: 0, sentences: 0, wps: 0, grade: 0 };
  const syl = w.reduce((n, x) => n + syllables(x), 0);
  const grade = 0.39 * (w.length / s.length) + 11.8 * (syl / w.length) - 15.59;
  return { words: w.length, sentences: s.length, wps: Math.round((w.length / s.length) * 10) / 10, grade: Math.max(0, Math.round(grade * 10) / 10) };
}

/* ---------- transforms ---------- */
const isDirections = (p) => /^\s*(directions?|instructions?|task)\s*:/i.test(p) || /\b(read|write|explain|answer|identify|determine|record|draw|underline|circle|list)\b/i.test(p.split(/[.!?]/)[0]);
function simplify(sentence) {
  let s = sentence;
  for (const [hard, easy] of SWAPS) s = s.replace(new RegExp(`\\b${hard}\\b`, "gi"), (m) => (m[0] === m[0].toUpperCase() ? easy[0].toUpperCase() + easy.slice(1) : easy));
  return s;
}
function directionSteps(text) {
  const body = text.replace(/^\s*(directions?|instructions?|task)\s*:\s*/i, "");
  const steps = [];
  for (const s of sentencesOf(body)) {
    for (const part of s.split(/;\s*|,\s*(?:and\s+)?then\s*,?\s*|\s+and then\s+|^then,?\s*/i)) {
      const clean = simplify(part.replace(/^(then|next|and)\s*,?\s*/i, "").trim());
      if (clean.length > 2) steps.push(clean[0].toUpperCase() + clean.slice(1).replace(/[.]?$/, "."));
    }
  }
  return steps;
}
function chunk(text, bandKey) {
  const s = sentencesOf(text);
  const size = bandKey === "L1-2" ? 1 : bandKey === "L3-4" ? 2 : 3;
  const chunks = [];
  for (let i = 0; i < s.length; i += size) chunks.push(s.slice(i, i + size).join(" "));
  return chunks;
}
function detectKlu(text) {
  const t = text.toLowerCase();
  if (/\b(should|opinion|argue|claim|agree|best|better|convince)\b/.test(t)) return "Argue";
  if (/\b(why|because|cause|effect|explain|how does|related|reason)\b/.test(t)) return "Explain";
  if (/\b(story|happened|first|then|finally|narrat|retell)\b/.test(t)) return "Narrate";
  return "Inform";
}
function detectArea(text) {
  const t = text.toLowerCase();
  if (/\b(equation|ratio|fraction|graph|sum|product|percent|area|data|number)\b/.test(t)) return "math";
  if (/\b(water|cycle|energy|plant|animal|evaporat|condens|experiment|force|matter|cell)\b/.test(t)) return "science";
  if (/\b(map|government|community|history|region|citizen|war|culture|trade)\b/.test(t)) return "social-studies";
  if (/\b(character|story|author|poem|theme|narrator|chapter)\b/.test(t)) return "ela";
  return "general";
}
function visuals(text) {
  const t = text.toLowerCase();
  const ideas = [];
  if (/\b(cycle|process|steps?|first|then|sequence)\b/.test(t)) ideas.push("A numbered picture sequence or a cycle diagram with arrows.");
  if (/\d/.test(t) || /\b(compare|more|less|percent|data)\b/.test(t)) ideas.push("A small table or bar model that shows the numbers.");
  if (/\b(compare|different|alike|similar|contrast)\b/.test(t)) ideas.push("A T-chart or Venn diagram.");
  if (/\b(map|region|place|located|north|south)\b/.test(t)) ideas.push("A labeled map with a key.");
  if (/\b(cause|effect|because|leads? to|result)\b/.test(t)) ideas.push("A cause-and-effect chain with icons.");
  ideas.push("Pictures or real objects for the pre-teach words.");
  return [...new Set(ideas)].slice(0, 4);
}
const ORGANIZERS = {
  Narrate: ["First", "Next", "Then", "Last"],
  Inform: ["Topic", "Fact 1", "Fact 2", "Fact 3", "Key word"],
  Explain: ["What happens", "Why (cause)", "What it leads to (effect)", "Evidence from the text"],
  Argue: ["My claim", "Reason 1 + evidence", "Reason 2 + evidence", "The other side", "My response"],
};

function render() {
  const fd = new FormData(form);
  const text = String(fd.get("text") || "").trim();
  const bandKey = fd.get("band");
  const extra = splitTerms(fd.get("terms"));
  saveDraft("scaffold-generator", { text, band: bandKey, terms: fd.get("terms") }, { quiet: true });
  if (!text) {
    out.innerHTML = '<div class="empty"><p>Paste a task or text to scaffold.</p></div>';
    return;
  }
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const dirParas = paragraphs.filter(isDirections);
  const textParas = paragraphs.filter((p) => !dirParas.includes(p));
  const before = readability(text);
  const steps = dirParas.flatMap(directionSteps);
  const after = readability(steps.join(" ") || simplify(text));
  const klu = detectKlu(text);
  const area = detectArea(text);
  const lower = text.toLowerCase();
  const glossTerms = [...new Set([...extra.map((x) => x.toLowerCase()), ...Object.keys(GLOSSARY).filter((k) => new RegExp(`\\b${k}`, "i").test(lower))])].slice(0, 10);
  const frames = buildFrames({ area, topic: extra[0] || "the text", terms: extra.join(", "), klu, bands: [bandKey] }, banks).frames[bandKey];
  const chunks = textParas.length ? textParas.flatMap((p) => chunk(p, bandKey)) : [];
  out.innerHTML = `
  <div class="panel stack" id="sg-result">
    <div class="print-only print-header"><span>Scaffolded task</span><span>Name: ________________</span></div>
    <h2 class="h4">Readability (Flesch-Kincaid)</h2>
    <div class="table-wrap"><table><thead><tr><th scope="col"></th><th scope="col">Words</th><th scope="col">Sentences</th><th scope="col">Words per sentence</th><th scope="col">Grade level</th></tr></thead><tbody>
      <tr><td>Original</td><td>${before.words}</td><td>${before.sentences}</td><td>${before.wps}</td><td>${before.grade}</td></tr>
      <tr><td>Simpler directions</td><td>${after.words}</td><td>${after.sentences}</td><td>${after.wps}</td><td>${after.grade}</td></tr>
    </tbody></table></div>
    <p class="muted">Grade levels from formulas are rough guides. Academic words always raise the number; pre-teach them instead of removing them.</p>
    ${steps.length ? `<h2 class="h4">Simpler directions</h2><ol class="reading">${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>` : ""}
    ${glossTerms.length ? `<h2 class="h4">Words to pre-teach</h2><div class="table-wrap"><table><thead><tr><th scope="col">Word</th><th scope="col">Meaning</th><th scope="col">Spanish</th></tr></thead><tbody>${glossTerms.map((t) => `<tr><td><strong>${escapeHtml(t)}</strong></td><td>${GLOSSARY[t] ? escapeHtml(GLOSSARY[t][0]) : '<span class="muted">Write a student-friendly meaning</span>'}</td><td lang="es">${GLOSSARY[t] ? escapeHtml(GLOSSARY[t][1]) : ""}</td></tr>`).join("")}</tbody></table></div>` : ""}
    ${chunks.length ? `<h2 class="h4">Chunked text</h2>${chunks.map((c, i) => `<div class="band section"><p class="label">Part ${i + 1}</p><p class="reading">${escapeHtml(c)}</p><p class="muted">Stop and check: What is this part mostly about? Tell a partner in one sentence.</p></div>`).join("")}` : ""}
    <h2 class="h4">Visual supports to add</h2><ul>${visuals(text).map((v) => `<li>${v}</li>`).join("")}</ul>
    <h2 class="h4">Graphic organizer (${klu})</h2>
    <div class="grid cols-2">${ORGANIZERS[klu].map((c) => `<div class="band"><p class="label">${c}</p><span class="write-lines print-only"></span><p class="muted no-print">…</p></div>`).join("")}</div>
    <h2 class="h4">Sentence frames (${escapeHtml(banks.bands[bandKey].label)})</h2><ul class="reading">${frames.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
    <p class="muted">Detected: Key Language Use <strong>${klu}</strong>, content area <strong>${escapeHtml((banks.areas[area] || banks.areas.general).label)}</strong>. Change the text or the band to update.</p>
  </div>
  <div class="btn-row no-print section"><button type="button" class="btn" data-print>Print</button><button type="button" class="btn secondary" data-sg-copy>Copy</button></div>`;
  $("[data-sg-copy]", out).addEventListener("click", () => copyText($("#sg-result", out).innerText));
}
const draft = loadDraft("scaffold-generator");
if (draft?.text) {
  form.elements.text.value = draft.text;
  form.elements.band.value = draft.band || "L3-4";
  form.elements.terms.value = draft.terms || "";
}
form.addEventListener("input", render);
render();
