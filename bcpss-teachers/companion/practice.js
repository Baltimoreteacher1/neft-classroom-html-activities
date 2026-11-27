// Plan & Respond — "Four-domain practice": listening, speaking, reading and writing tasks assembled from one unit's own
// content (its dictogloss, frames, mentor sentence, reading passage and writing prompt). Informal practice only. It is not
// an ACCESS test, copies no ACCESS item, gives no score and assigns no proficiency level.

import { blanks as printBlanks, doc, FOOT, openPrint, unitLine } from "./companion-print.js";
import { blanks, esc, vstate } from "./util.js";
import { domainIcon } from "./visuals.js";

const ID = "practice";
const DOMAINS = [
  { id: "listening", label: "Listening", hint: "Hear it twice, then rebuild it" },
  { id: "speaking", label: "Speaking", hint: "Partner talk with frames" },
  { id: "reading", label: "Reading", hint: "A short text and questions" },
  { id: "writing", label: "Writing", hint: "Answer the unit's prompt" },
];

/** The four tasks for one unit at one support level. Pure; every field comes from detail. */
export function buildPracticePack(detail, level) {
  const s = detail.studio;
  const lk = `l${level}`;
  const dict = (s.activities || []).find((a) => a.kind === "dictogloss");
  const text = dict?.payload?.text || s.mentor.text;
  return {
    listening: {
      text,
      keyWords: dict?.payload?.key_words || s.vocab.slice(0, 5).map((v) => v.term),
      frame: dict?.payload?.frame || s.frames[lk]?.[0] || "",
      support:
        dict?.support?.[lk] ||
        "Write the key words you hear, then say the text back in your own words.",
      checks: dict?.payload?.checks || [],
    },
    speaking: {
      frames: s.frames[lk] || [],
      asks: s.mentor.chunks.map((c) => c.ask),
      connectors: s.connectors,
    },
    reading: {
      title: detail.reading.title,
      text: detail.reading.texts[level],
      questions: detail.reading.questions,
    },
    writing: {
      prompt: detail.writing.prompt?.[lk] || s.exit_ticket.prompt,
      frames: s.frames[lk] || [],
      connectors: s.connectors,
      model: s.exit_ticket.model,
    },
    lookFor: detail.esol_pack?.objectives?.look_fors?.[level] || "",
  };
}

function panel(id, pack, vs) {
  if (id === "listening")
    return `<p class="cp-teacher"><b>Teacher:</b> read the text below at a natural pace, twice. Students listen the first time, jot key words the second time, then rebuild the text with a partner.</p>
      <div class="cp-say">${esc(pack.listening.text)}</div>
      <p><b>Key words:</b> ${pack.listening.keyWords.map(esc).join(", ")}</p>
      <p><b>Students:</b> ${esc(pack.listening.support)}</p>
      <p><b>Frame:</b> ${blanks(pack.listening.frame)}</p>`;
  if (id === "speaking")
    return `<p><b>Partners take turns.</b> One asks, the other answers with a frame.</p>
      <ul class="cp-plain">${pack.speaking.asks.map((a) => `<li>Ask: ${esc(a)}</li>`).join("")}</ul>
      <h5>Frames</h5><ul class="cp-plain">${pack.speaking.frames.map((f) => `<li>${blanks(f)}</li>`).join("")}</ul>
      <p class="cp-muted">Linking words: ${pack.speaking.connectors.map(esc).join(", ")}</p>`;
  if (id === "reading")
    return `<h5>${esc(pack.reading.title)}</h5><div class="cp-passage">${pack.reading.text
      .split(/\n+/)
      .map((p) => `<p class="cp-para">${esc(p)}</p>`)
      .join("")}</div>
      <ol>${pack.reading.questions.map((q) => `<li>${esc(q.q)} <span class="cp-muted">(${q.options.map(esc).join(" / ")})</span></li>`).join("")}</ol>
      <button type="button" class="cp-btn" data-cp-tab="reading">Open the reading tab</button>
      <button type="button" class="cp-btn" data-cp-view="text">Read it together</button>`;
  return `<p class="cp-prompt">${esc(pack.writing.prompt)}</p>
      <h5>Frames</h5><ul class="cp-plain">${pack.writing.frames.map((f) => `<li>${blanks(f)}</li>`).join("")}</ul>
      <p class="cp-muted">Linking words: ${pack.writing.connectors.map(esc).join(", ")}</p>
      ${vs.model ? `<p class="cp-say"><b>Model answer (teacher):</b> ${esc(pack.writing.model)}</p>` : `<button type="button" class="cp-btn" data-cp-act="${ID}:model">Show a model answer</button>`}`;
}

export function render(st, detail) {
  const vs = vstate(st, ID, { d: "listening", model: false });
  const pack = buildPracticePack(detail, st.level);
  return `
    <div class="cp-practice">
      <p class="cp-note">Informal practice in all four language domains, built from this unit's own content. It is not an ACCESS test and it gives no scores or levels.</p>
      <fieldset class="cp-field"><legend>Choose a domain</legend><div class="cp-chiprow">${DOMAINS.map((d) => `<button type="button" class="cp-chip" data-cp-act="${ID}:domain" data-cp-arg="${d.id}" aria-pressed="${d.id === vs.d}"><span aria-hidden="true">${domainIcon(d.label)}</span> ${d.label}<small>${esc(d.hint)}</small></button>`).join("")}</div></fieldset>
      <div class="cp-card">${panel(vs.d, pack, vs)}</div>
      ${pack.lookFor ? `<p class="cp-muted cp-teacher"><b>Look for (teacher):</b> ${esc(pack.lookFor)}</p>` : ""}
      <div class="cp-actions"><button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:print" data-cp-arg="student">Print the student set (4 tasks)</button><button type="button" class="cp-btn" data-cp-act="${ID}:print" data-cp-arg="teacher">Print the teacher key</button></div>
    </div>`;
}

export function act(st, action, arg, ctx) {
  const vs = vstate(st, ID, {});
  if (action === "domain") {
    vs.d = arg;
    return true;
  }
  if (action === "model") {
    vs.model = true;
    return true;
  }
  if (action === "print") {
    const d = ctx.detail;
    openPrint(practiceDoc(d, st.level, arg === "teacher"), `practice-${arg}-${d.unit.id}.html`);
    return false;
  }
  return false;
}

const lines = (n) => `<div class="lines">${"<div></div>".repeat(n)}</div>`;

/** Student set: one page per domain. Teacher key: the text to read aloud, answers and evidence, a model answer. */
export function practiceDoc(detail, level, teacher = false) {
  const unit = detail.unit;
  const p = buildPracticePack(detail, level);
  const head = (t) =>
    `<div class="head"><div><h1>${t}</h1><div class="meta">${unitLine(unit)}</div></div>${teacher ? `<div class="name">Teacher copy</div>` : `<div class="name">Name <span></span></div>`}</div>`;
  if (teacher) {
    const body = `${head("Four-domain practice: teacher key")}
      <h2>Listening: read twice</h2><div class="say">${esc(p.listening.text)}</div>
      <p class="small">Key words: ${p.listening.keyWords.map(esc).join(", ")}. A good rebuild includes: ${p.listening.checks.map(esc).join("; ") || "the key words and the main idea"}.</p>
      <h2>Speaking: partner questions</h2><ul>${p.speaking.asks.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
      <h2>Reading: answers</h2><ol>${p.reading.questions.map((q) => `<li>${esc(q.q)} <b>${esc(q.options[q.answer])}</b>${q.evidence?.[level] ? ` <span class="small">Evidence: “${esc(q.evidence[level])}”</span>` : ""}</li>`).join("")}</ol>
      <h2>Writing: model answer</h2><div class="say">${esc(p.writing.model)}</div>
      ${p.lookFor ? `<p class="small"><b>Look for:</b> ${esc(p.lookFor)}</p>` : ""}
      <p class="small">Informal practice. Not an ACCESS test. No scores or levels.</p>`;
    return doc(`Practice key - ${unit.unit_title}`, body, FOOT);
  }
  const page = (title, inner, brk = true) =>
    `<section ${brk ? 'style="break-before:page"' : ""}>${head(title)}${inner}</section>`;
  const body = [
    page(
      "Listening",
      `<p class="q">Listen twice. Write the key words you hear.</p><p class="chips">${p.listening.keyWords.map((w) => `<span>${esc(w)}</span>`).join("")}</p>${lines(5)}<h2>Now say or write it again</h2><p>${printBlanks(p.listening.frame)}</p>${lines(3)}`,
      false,
    ),
    page(
      "Speaking",
      `<p class="q">Talk with a partner. Take turns.</p><h2>Frames</h2><ol class="frames">${p.speaking.frames.map((f) => `<li>${printBlanks(f)}</li>`).join("")}</ol><h2>Linking words</h2><p class="chips">${p.speaking.connectors.map((c) => `<span>${esc(c)}</span>`).join("")}</p>`,
    ),
    page(
      "Reading",
      `<h2>${esc(p.reading.title)}</h2>${p.reading.text
        .split(/\n+/)
        .map((t) => `<p>${esc(t)}</p>`)
        .join(
          "",
        )}${p.reading.questions.map((q, i) => `<div class="step"><p><b>${i + 1}. ${esc(q.q)}</b></p>${q.options.map((o) => `<p>☐ ${esc(o)}</p>`).join("")}</div>`).join("")}`,
    ),
    page(
      "Writing",
      `<p class="q">${esc(p.writing.prompt)}</p><h2>Frames</h2><ol class="frames">${p.writing.frames.map((f) => `<li>${printBlanks(f)}</li>`).join("")}</ol>${lines(6)}`,
    ),
  ].join("");
  return doc(
    `Four-domain practice - ${unit.unit_title}`,
    `${body}<p class="small">Informal practice from this unit. Not an ACCESS test. No scores or levels.</p>`,
    FOOT,
  );
}
