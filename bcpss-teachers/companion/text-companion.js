// Plan & Respond — "Read together": the unit's own reading passage (or its writing model text) one sentence at a time,
// with the unit's words marked, a read-aloud, and comprehension questions that can show the evidence in the text.
// Everything comes from detail.reading / detail.writing.source. Nothing is saved or sent.

import { doc, FOOT, openPrint, unitLine } from "./companion-print.js";
import { sentenceStrip } from "./visuals.js";
import { canSpeak, esc, LEVEL_KEY, markTerms, paragraphs, speak, termsIn, vstate } from "./util.js";

const ID = "text";

/** The passage a teacher is reading: the leveled reading text, or the unit's writing model text. */
export function readingSource(detail, level, which = "reading") {
  const model = detail?.writing?.source;
  if (which === "model" && model?.text)
    return { id: "model", title: model.title, text: model.text };
  const r = detail?.reading;
  return r?.texts?.[level] ? { id: "reading", title: r.title, text: r.texts[level] } : null;
}

/** Index of the sentence that contains the evidence quote, or -1 when the quote is not a literal run of the text. */
export function evidenceIndex(sents, evidence) {
  return evidence ? sents.findIndex((s) => s.includes(evidence)) : -1;
}

/** A reading prompt chosen from what the sentence itself contains. Not a judgement of the sentence. */
export function stopPrompt(sentence, vocab) {
  if (termsIn(sentence, vocab).length)
    return "Stop and think: which word here is a unit word? Say what it means.";
  if (/\d/.test(sentence))
    return "Stop and think: which numbers matter here? What do they tell us?";
  return "Stop and think: say this sentence in your own words.";
}

const termHtml = (t, vocab) => markTerms(t, vocab, (m) => `<span class="cp-term">${m}</span>`);

function sentenceHtml(s, vocab, evidence) {
  const k = evidence ? s.indexOf(evidence) : -1;
  if (k < 0) return termHtml(s, vocab);
  return `${termHtml(s.slice(0, k), vocab)}<mark class="cp-ev">${termHtml(evidence, vocab)}</mark>${termHtml(s.slice(k + evidence.length), vocab)}`;
}

function questionsHtml(detail, level, vs) {
  const lk = level;
  return detail.reading.questions
    .map((q, qi) => {
      const picked = vs.answers[qi];
      const right = picked === q.answer;
      const options = q.options
        .map(
          (o, oi) =>
            `<button type="button" class="cp-chip" data-cp-act="${ID}:ans" data-cp-arg="${qi}:${oi}" aria-pressed="${picked === oi}">${esc(o)}</button>`,
        )
        .join("");
      const status =
        picked === undefined
          ? ""
          : `<p class="cp-note" role="status">${right ? "Yes. That matches the text." : "Not yet. Look back at the text and try another."}</p>`;
      const ev = q.evidence?.[lk];
      const evBtn =
        picked !== undefined && ev
          ? `<button type="button" class="cp-btn" data-cp-act="${ID}:ev" data-cp-arg="${qi}" aria-pressed="${vs.ev === qi}">${vs.ev === qi ? "Hide the evidence" : "Show the evidence in the text"}</button>`
          : "";
      const quote = vs.ev === qi && ev ? `<p class="cp-say">The text says: “${esc(ev)}”</p>` : "";
      return `<fieldset class="cp-field"><legend>${qi + 1}. ${esc(q.q)}</legend><div class="cp-chiprow">${options}</div>${status}${evBtn}${quote}</fieldset>`;
    })
    .join("");
}

export function render(st, detail) {
  const vs = vstate(st, ID, { src: "reading", i: -1, word: null, answers: {}, ev: null });
  const src = readingSource(detail, st.level, vs.src) || readingSource(detail, st.level);
  if (!src) return `<p class="cp-note">This unit has no reading passage yet.</p>`;
  const vocab = detail.studio.vocab;
  const paras = paragraphs(src.text);
  const flat = paras.flat();
  const q = vs.ev != null ? detail.reading.questions[vs.ev] : null;
  const evidence = q?.evidence?.[st.level] || null;
  const evAt = evidenceIndex(flat, evidence);
  let n = 0;
  const body = paras
    .map(
      (p) =>
        `<p class="cp-para">${p
          .map((s) => {
            const i = n++;
            const cls = `cp-sent${vs.i === i ? " cp-sent--now" : vs.i >= 0 ? " cp-sent--dim" : ""}`;
            return `<span class="${cls}">${sentenceHtml(s, vocab, i === evAt ? evidence : null)}</span>`;
          })
          .join(" ")}</p>`,
    )
    .join("");
  const found = termsIn(src.text, vocab);
  const word = found.find((v) => v.term === vs.word);
  const hasModel = Boolean(detail.writing?.source?.text);
  const focus = vs.i >= 0 ? flat[vs.i] : "";
  return `
    <div class="cp-text">
      ${
        hasModel
          ? `<fieldset class="cp-field"><legend>Which text?</legend><div class="cp-chiprow">${[
              ["reading", `Reading passage: ${detail.reading.title}`],
              ["model", `Model text: ${detail.writing.source.title}`],
            ]
              .map(
                ([id, label]) =>
                  `<button type="button" class="cp-chip" data-cp-act="${ID}:src" data-cp-arg="${id}" aria-pressed="${src.id === id}">${esc(label)}</button>`,
              )
              .join("")}</div></fieldset>`
          : ""
      }
      <div class="cp-card">
        <div class="cp-set-head"><h4>${esc(src.title)}</h4><span class="cp-muted">${vs.i >= 0 ? `Sentence ${vs.i + 1} of ${flat.length}` : `${flat.length} sentences`}</span></div>
        <div class="cp-actions" role="group" aria-label="Read one sentence at a time">
          <button type="button" class="cp-btn" data-cp-act="${ID}:prev" ${vs.i <= 0 ? "disabled" : ""}>Back</button>
          <button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:next">${vs.i < 0 ? "Read one sentence at a time" : vs.i >= flat.length - 1 ? "Start again" : "Next sentence"}</button>
          <button type="button" class="cp-btn" data-cp-act="${ID}:all" ${vs.i < 0 ? "disabled" : ""}>Show all</button>
          ${canSpeak() ? `<button type="button" class="cp-btn" data-cp-act="${ID}:read">Read aloud${vs.i >= 0 ? " this sentence" : ""}</button>` : ""}
        </div>
        ${sentenceStrip(flat.length, vs.i, evAt)}
        <div class="cp-passage" data-cp-passage>${body}</div>
        ${focus ? `<p class="cp-note" role="status">${esc(stopPrompt(focus, vocab))}</p>` : ""}
        <p class="cp-muted">Underlined words are this unit's words. Pick one below for its meaning.</p>
        <div class="cp-chiprow cp-chiprow--tight">${found.map((v) => `<button type="button" class="cp-chip" data-cp-act="${ID}:word" data-cp-arg="${esc(v.term)}" aria-pressed="${vs.word === v.term}">${esc(v.term)}</button>`).join("") || `<span class="cp-muted">No unit words appear in this text.</span>`}</div>
        ${word ? `<div class="cp-say"><b>${esc(word.term)}</b>${word.es ? ` <i>${esc(word.es)}</i>` : ""}: ${esc(word.def)}<br><span class="cp-muted">Example: ${esc(word.example)}</span></div>` : ""}
      </div>
      ${
        src.id === "reading"
          ? `<div class="cp-card"><h4>Questions about the text</h4><p class="cp-muted">Answers are checked on this device. Nothing is saved or scored.</p>${questionsHtml(detail, st.level, vs)}<button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:print">Print reading sheet</button></div>`
          : `<div class="cp-card"><p class="cp-muted">This is the unit's model text for writing. Use it to look at how the writer links ideas, then open the Writing Lab to write.</p><button type="button" class="cp-btn" data-cp-tab="create">Open the Writing tools</button></div>`
      }
    </div>`;
}

export function act(st, action, arg, ctx) {
  const vs = vstate(st, ID, {});
  const detail = ctx.detail;
  const src = readingSource(detail, st.level, vs.src) || readingSource(detail, st.level);
  const flat = src ? paragraphs(src.text).flat() : [];
  if (action === "src") {
    vs.src = arg;
    vs.i = -1;
    vs.ev = null;
    return true;
  }
  if (action === "next") {
    vs.i = vs.i < 0 || vs.i >= flat.length - 1 ? 0 : vs.i + 1;
    return true;
  }
  if (action === "prev") {
    vs.i = Math.max(0, vs.i - 1);
    return true;
  }
  if (action === "all") {
    vs.i = -1;
    return true;
  }
  if (action === "read") {
    speak(vs.i >= 0 ? flat[vs.i] : flat.join(" "));
    return false;
  }
  if (action === "word") {
    vs.word = vs.word === arg ? null : arg;
    return true;
  }
  if (action === "ans") {
    const [qi, oi] = arg.split(":").map(Number);
    vs.answers[qi] = oi;
    return true;
  }
  if (action === "ev") {
    const qi = Number(arg);
    vs.ev = vs.ev === qi ? null : qi;
    return true;
  }
  if (action === "print") {
    openPrint(readingDoc(detail, st.level), `reading-${detail.unit.id}.html`);
    return false;
  }
  return false;
}

/** Student reading sheet (passage, numbered sentences, questions) with a separate teacher key. */
export function readingDoc(detail, level) {
  const unit = detail.unit;
  const src = readingSource(detail, level);
  const vocab = detail.studio.vocab;
  let n = 0;
  const text = paragraphs(src.text)
    .map(
      (p) =>
        `<p>${p.map((s) => `<sup>${++n}</sup> ${markTerms(s, vocab, (m) => `<b>${m}</b>`)}`).join(" ")}</p>`,
    )
    .join("");
  const words = termsIn(src.text, vocab);
  const qs = detail.reading.questions
    .map(
      (q, i) =>
        `<div class="step"><p><b>${i + 1}. ${esc(q.q)}</b></p>${q.options.map((o) => `<p>☐ ${esc(o)}</p>`).join("")}<p class="small">Show where in the text: sentence number <span class="b">&nbsp;</span></p></div>`,
    )
    .join("");
  const key = detail.reading.questions
    .map((q, i) => {
      const ev = q.evidence?.[level];
      return `<li>${i + 1}. <b>${esc(q.options[q.answer])}</b>${ev ? ` <span class="small">Evidence: “${esc(ev)}”</span>` : ""}</li>`;
    })
    .join("");
  const body = `
    <div class="head"><div><h1>${esc(src.title)}</h1><div class="meta">${unitLine(unit)}</div></div><div class="name">Name <span></span></div></div>
    ${text}
    ${words.length ? `<h2>Unit words in this text</h2><div class="words">${words.map((w) => `<div class="word"><b>${esc(w.term)}</b>${w.es ? ` <span class="es">(${esc(w.es)})</span>` : ""}<div>${esc(w.def)}</div></div>`).join("")}</div>` : ""}
    <h2>Questions</h2>${qs}
    <h2 style="break-before:page">Teacher key</h2><ol class="frames" style="list-style:none;padding:0">${key}</ol>
    <p class="small">Text level: ${esc(LEVEL_KEY[level] || level)} support. Same questions at every level.</p>`;
  return doc(`Reading sheet - ${unit.unit_title}`, body, FOOT);
}
