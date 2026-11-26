// Plan & Respond — "Transform a resource": paste any text (a passage, a page of a textbook, a news paragraph) and get it
// back as a student reading copy: numbered sentences, the unit's words marked and defined, an optional cloze, and a reading
// load report. Rule-based and on this device. It never rewrites or simplifies the meaning of the text, and nothing is sent.

import { doc, FOOT, openPrint, unitLine } from "./companion-print.js";
import { esc, markTerms, paragraphs, shuffle, termIndex, termsIn, vstate } from "./util.js";
import { NAME_HINT } from "./work-check.js";

const ID = "transform";
const MAX_CHARS = 6000;
const OPTIONS = [
  ["chunk", "Numbered sentences", "One sentence at a time, with a thinking prompt"],
  ["words", "Unit words and meanings", "Mark the unit's words and list what they mean"],
  ["cloze", "Fill-in-the-blank copy", "Blank the unit words and give a word bank"],
  ["load", "Reading load", "Sentence length and long words to preview"],
];

const wordCount = (s) => (String(s).match(/[\p{L}\p{N}'’-]+/gu) || []).length;

/** Everything the screen and the print copy show. Pure. */
export function transformText(raw, detail) {
  const text = String(raw || "")
    .trim()
    .slice(0, MAX_CHARS);
  const vocab = detail.studio.vocab;
  const paras = paragraphs(text);
  const sents = paras.flat();
  const found = termsIn(text, vocab).map((v) => ({ term: v.term, def: v.def, es: v.es || "" }));
  const index = termIndex(vocab);
  const lens = sents.map(wordCount);
  const words = text.match(/[\p{L}'’-]+/gu) || [];
  const hard = [
    ...new Set(words.map((w) => w.toLowerCase()).filter((w) => w.length >= 10 && !index.has(w))),
  ].slice(0, 8);
  const seen = new Set();
  const bank = [];
  const cloze = paras
    .map((p) =>
      p
        .map((s) =>
          markTerms(s, vocab, (m, v) => {
            if (seen.has(v.term) || seen.size >= 8) return m;
            seen.add(v.term);
            bank.push(m.replace(/&amp;/g, "&"));
            return `<span class="cp-blank">${bank.length}</span>`;
          }),
        )
        .join(" "),
    )
    .join("\n");
  return {
    empty: !sents.length,
    paras,
    sentences: sents,
    found,
    cloze: { html: cloze, bank: shuffle(bank, `${detail.unit.id}:cloze`) },
    load: {
      sentences: sents.length,
      words: lens.reduce((a, b) => a + b, 0),
      average: sents.length
        ? Math.round((lens.reduce((a, b) => a + b, 0) / sents.length) * 10) / 10
        : 0,
      long: lens.map((n, i) => (n > 20 ? i + 1 : 0)).filter(Boolean),
      hard,
    },
    privacy: NAME_HINT.test(text),
    trimmed: String(raw || "").trim().length > MAX_CHARS,
  };
}

function resultHtml(r, vs, detail) {
  if (r.empty) return `<p class="cp-note" role="status">Paste some text first.</p>`;
  const vocab = detail.studio.vocab;
  const on = (k) => vs.opts[k];
  let n = 0;
  return `<div class="cp-result" aria-live="polite">
    ${r.privacy ? `<p class="cp-note cp-note--warn" role="alert">This text may contain a name. Remove names before you print it for students.</p>` : ""}
    ${r.trimmed ? `<p class="cp-note">Only the first ${MAX_CHARS} characters were used.</p>` : ""}
    ${on("chunk") ? `<div class="cp-card"><h4>Numbered sentences</h4><ol class="cp-plain cp-chunks">${r.sentences.map((s) => `<li value="${++n}">${markTerms(s, vocab, (m) => `<span class="cp-term">${m}</span>`)}</li>`).join("")}</ol></div>` : ""}
    ${on("words") ? `<div class="cp-card"><h4>Unit words found in this text</h4>${r.found.length ? `<ul class="cp-words">${r.found.map((w) => `<li><b>${esc(w.term)}</b>${w.es ? ` <i>${esc(w.es)}</i>` : ""}<span>${esc(w.def)}</span></li>`).join("")}</ul>` : `<p class="cp-muted">None of this unit's words appear in the text.</p>`}</div>` : ""}
    ${
      on("cloze")
        ? `<div class="cp-card"><h4>Fill-in-the-blank copy</h4>${
            r.cloze.bank.length
              ? `<p class="cp-chips">${r.cloze.bank.map((w) => `<span>${esc(w)}</span>`).join("")}</p><div class="cp-passage">${r.cloze.html
                  .split("\n")
                  .map((p) => `<p class="cp-para">${p}</p>`)
                  .join("")}</div>`
              : `<p class="cp-muted">No unit words to blank in this text.</p>`
          }</div>`
        : ""
    }
    ${on("load") ? `<div class="cp-card cp-card--maybe"><h4>Reading load</h4><p class="cp-muted">Counts from the text. You decide what needs support.</p><ul class="cp-plain"><li>${r.load.sentences} sentences, ${r.load.words} words, about ${r.load.average} words per sentence.</li>${r.load.long.length ? `<li>Longer sentences (over 20 words): number ${r.load.long.join(", ")}. You could read these aloud or split them in the margin.</li>` : ""}${r.load.hard.length ? `<li>Long words to preview: ${r.load.hard.map(esc).join(", ")}.</li>` : ""}</ul></div>` : ""}
    <button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:print">Print the student copy</button>
  </div>`;
}

export function render(st, detail) {
  const vs = vstate(st, ID, {
    text: "",
    opts: { chunk: true, words: true, cloze: false, load: true },
    result: null,
  });
  return `
    <div class="cp-transform">
      <div class="cp-card">
        <h4>Paste a text</h4>
        <p class="cp-muted">Use a passage with no student names. It is read on this device only. This tool marks and arranges the text. It does not rewrite it.</p>
        <label class="cp-label" for="cpTx">Text</label>
        <textarea id="cpTx" class="cp-textarea" rows="8" data-cp-in="${ID}:text" autocomplete="off" spellcheck="false">${esc(vs.text)}</textarea>
        <fieldset class="cp-field"><legend>What do you want back?</legend><div class="cp-chiprow">${OPTIONS.map(([k, label, hint]) => `<button type="button" class="cp-chip" data-cp-act="${ID}:opt" data-cp-arg="${k}" aria-pressed="${vs.opts[k]}">${esc(label)}<small>${esc(hint)}</small></button>`).join("")}</div></fieldset>
        <div class="cp-actions"><button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:run">Transform</button><button type="button" class="cp-btn" data-cp-act="${ID}:clear">Clear</button></div>
      </div>
      ${vs.result ? resultHtml(vs.result, vs, detail) : ""}
    </div>`;
}

export function act(st, action, arg, ctx) {
  const vs = vstate(st, ID, {});
  if (action === "opt") {
    vs.opts[arg] = !vs.opts[arg];
    return true;
  }
  if (action === "run") {
    vs.result = transformText(vs.text, ctx.detail);
    return true;
  }
  if (action === "clear") {
    vs.text = "";
    vs.result = null;
    return true;
  }
  if (action === "print" && vs.result && !vs.result.empty) {
    openPrint(
      transformDoc(ctx.detail, vs.result, vs.opts),
      `reading-copy-${ctx.detail.unit.id}.html`,
    );
  }
  return false;
}

export function input(st, field, value) {
  if (field === "text") vstate(st, ID, {}).text = value;
  return false;
}

/** Student copy of the pasted text, laid out for support. No analysis notes. */
export function transformDoc(detail, r, opts) {
  const unit = detail.unit;
  const vocab = detail.studio.vocab;
  let n = 0;
  const chunks = r.paras
    .map(
      (p) =>
        `<p>${p.map((s) => `<sup>${++n}</sup> ${markTerms(s, vocab, (m) => `<b>${m}</b>`)}`).join(" ")}</p>`,
    )
    .join("");
  const body = `
    <div class="head"><div><h1>Reading copy</h1><div class="meta">${unitLine(unit)}</div></div><div class="name">Name <span></span></div></div>
    ${opts.chunk || !opts.cloze ? chunks : ""}
    ${opts.words && r.found.length ? `<h2>Unit words</h2><div class="words">${r.found.map((w) => `<div class="word"><b>${esc(w.term)}</b>${w.es ? ` <span class="es">(${esc(w.es)})</span>` : ""}<div>${esc(w.def)}</div></div>`).join("")}</div>` : ""}
    ${
      opts.cloze && r.cloze.bank.length
        ? `<h2 style="break-before:page">Fill in the blanks</h2><p class="chips">${r.cloze.bank.map((w) => `<span>${esc(w)}</span>`).join("")}</p>${r.cloze.html
            .split("\n")
            .map((p) => `<p>${p}</p>`)
            .join("")}`
        : ""
    }`;
  return doc(`Reading copy - ${unit.unit_title}`, body, FOOT);
}
