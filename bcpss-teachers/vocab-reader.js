// Vocabulary Reading tab: a leveled passage per unit that uses every unit term in context, with
// tap-a-word cards, read-aloud with word highlighting, echo reading, Spanish glosses, a cloze mode,
// prove-it comprehension questions, a repeated-reading fluency tracker and a retell check.
// Everything runs in the browser; progress is saved on this device only.

import { termRegex } from "./bcpss-term-match.js";
import { countWords, createReader, esc, renderPassage, sentenceWith } from "./vocab-reader-text.js";

const TIER_LABEL = { "1_2": "Levels 1–2", "3_4": "Levels 3–4", "5_6": "Levels 5–6" };
const TIERS = Object.keys(TIER_LABEL);
const instances = new WeakMap();

function makeStore(unitId) {
  const key = `bcpss_reading_v1:${unitId}`;
  return {
    get() {
      try {
        return JSON.parse(localStorage.getItem(key) || "{}") || {};
      } catch {
        return {};
      }
    },
    set(v) {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* storage unavailable */
      }
    },
  };
}

const bank = (vocab) => [...vocab.map((v) => v.term)].sort((a, b) => a.localeCompare(b));

function shell(ctx) {
  const { reading, unit } = ctx;
  return `
  <div class="vr-root">
    <header class="vr-head">
      <p class="ep-kicker">Vocabulary Reading · ${esc(reading.genre)}</p>
      <h2>${esc(reading.title)}</h2>
      <p class="vr-lead">Read about <strong>${esc(unit.unit_title)}</strong> and meet every unit word in context. Tap a highlighted word for its card.</p>
      <div class="vr-bar" role="group" aria-label="Reading level">
        ${TIERS.map((t) => `<button type="button" class="vr-pill" data-vr="level" data-tier="${t}" aria-pressed="${t === ctx.tier}">${TIER_LABEL[t]}</button>`).join("")}
      </div>
      <div class="vr-bar" role="group" aria-label="Reading tools">
        <button type="button" class="vr-pill" data-vr="mode" data-mode="read" aria-pressed="true">Read</button>
        <button type="button" class="vr-pill" data-vr="mode" data-mode="cloze" aria-pressed="false">Fill the blanks</button>
        <label class="vr-check"><input type="checkbox" data-vr="gloss" /> Spanish glosses</label>
        <label class="vr-check"><input type="checkbox" data-vr="vocab" checked /> Highlight words</label>
      </div>
      <div class="vr-bar vr-noprint" data-vr-audio>
        <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-vr="play">▶ Read to me</button>
        <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-vr="play-slow">▶ Slower</button>
        <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-vr="echo">🗣 Echo reading</button>
        <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-vr="stop">■ Stop</button>
        <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-vr="print">Print</button>
      </div>
    </header>
    <article class="vr-page"><div class="vr-text" data-vr-text aria-live="off"></div></article>
    <aside class="vr-card" data-vr-card aria-live="polite"><p class="vr-hint">Tap a highlighted word to open its word card.</p></aside>
    <div class="vr-cloze-bar vr-noprint" data-vr-clozebar hidden>
      <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-vr="cloze-check">Check blanks</button>
      <span class="vr-score" data-vr-clozescore aria-live="polite"></span>
    </div>
    <section class="vr-section"><h3>Fluency tracker</h3><p class="vr-hint">Read the passage three times. Each time your speed should grow. Press Start, read aloud, then press Stop.</p>
      <div class="vr-bar vr-noprint"><button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-vr="timer" data-running="false">⏱ Start timed read</button></div>
      <div data-vr-fluency></div></section>
    <section class="vr-section"><h3>Prove it</h3><div data-vr-questions></div></section>
    <section class="vr-section"><h3>Retell with the unit words</h3>
      <p class="vr-hint">Retell the reading in your own words. Frame: <em>${esc(ctx.frame)}</em></p>
      <textarea class="ep-textarea" rows="4" data-vr-retell aria-label="Retell"></textarea>
      <div class="vr-bar vr-noprint"><button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-vr="retell-check">Check my vocabulary</button></div>
      <div data-vr-retell-result aria-live="polite"></div></section>
  </div>`;
}

function paint(ctx) {
  const text = ctx.reading.texts[ctx.tier];
  const box = ctx.root.querySelector("[data-vr-text]");
  box.innerHTML = renderPassage(text, ctx.vocab, {
    mode: ctx.mode,
    gloss: ctx.gloss,
    highlightVocab: ctx.hl,
    evidence: ctx.evidence,
    bank: bank(ctx.vocab),
    answers: ctx.answers,
    checked: ctx.checked,
  });
  ctx.root.querySelector("[data-vr-clozebar]").hidden = ctx.mode !== "cloze";
  for (const b of ctx.root.querySelectorAll('[data-vr="level"]'))
    b.setAttribute("aria-pressed", String(b.dataset.tier === ctx.tier));
  for (const b of ctx.root.querySelectorAll('[data-vr="mode"]'))
    b.setAttribute("aria-pressed", String(b.dataset.mode === ctx.mode));
  ctx.root.querySelector("[data-vr-card]").innerHTML =
    `<p class="vr-hint">${ctx.mode === "cloze" ? "Choose the word that fits each blank. Use the sentence around it as a clue." : "Tap a highlighted word to open its word card."}</p>`;
  paintFluency(ctx);
}

function paintFluency(ctx) {
  const reads = ctx.store.get().fluency?.[ctx.tier] || [];
  const best = Math.max(10, ...reads);
  const el = ctx.root.querySelector("[data-vr-fluency]");
  if (!reads.length) {
    el.innerHTML = `<p class="vr-hint">No reads yet at ${TIER_LABEL[ctx.tier]}.</p>`;
    return;
  }
  const bars = reads
    .slice(-3)
    .map(
      (w, i) =>
        `<div class="vr-bar-row"><span>Read ${i + 1}</span><div class="vr-meter"><i style="width:${Math.round((w / best) * 100)}%"></i></div><strong>${w} wpm</strong></div>`,
    )
    .join("");
  const grew =
    reads.length >= 2 && reads.at(-1) > reads.at(-2)
      ? `<p class="ep-ok">Faster than last time. Keep going!</p>`
      : "";
  el.innerHTML = bars + grew;
}

function paintQuestions(ctx) {
  const box = ctx.root.querySelector("[data-vr-questions]");
  box.innerHTML = ctx.reading.questions
    .map(
      (q, i) => `<fieldset class="ep-q" data-vr-q="${i}"><legend>${i + 1}. ${esc(q.q)}</legend>
      ${q.options.map((o, j) => `<label class="ep-opt"><input type="radio" name="vr-q-${i}" value="${j}" /> <span>${esc(o)}</span></label>`).join("")}
      <div class="vr-bar vr-noprint"><button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-vr="q-check" data-i="${i}">Check</button></div>
      <div class="ep-result" data-vr-qresult="${i}" aria-live="polite"></div></fieldset>`,
    )
    .join("");
}

function wordCard(ctx, term) {
  const v = ctx.vocab.find((x) => x.term === term);
  if (!v) return;
  const known = ctx.store.get().known?.[term];
  const sentence = sentenceWith(ctx.reading.texts[ctx.tier], term);
  ctx.root.querySelector("[data-vr-card]").innerHTML = `
    <h4>${esc(v.term)}${v.cognate ? ` <span class="ep-arrow">↔</span> <span lang="es">${esc(v.cognate)}</span>` : ""}</h4>
    <p>${esc(v.def)}</p>
    ${sentence ? `<p class="vr-hint">In the reading: “${esc(sentence)}”</p>` : ""}
    <div class="vr-bar vr-noprint">
      <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-vr="say" data-text="${esc(v.term)}" data-lang="en-US">🔊 English</button>
      ${v.cognate ? `<button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-vr="say" data-text="${esc(v.cognate.split("/")[0])}" data-lang="es-US">🔊 Español</button>` : ""}
      <button type="button" class="vr-pill" data-vr="known" data-term="${esc(term)}" data-v="1" aria-pressed="${known === 1}">I know it</button>
      <button type="button" class="vr-pill" data-vr="known" data-term="${esc(term)}" data-v="0" aria-pressed="${known === 0}">Still learning</button>
    </div>`;
}

function checkQuestion(ctx, i) {
  const q = ctx.reading.questions[i];
  const out = ctx.root.querySelector(`[data-vr-qresult="${i}"]`);
  const picked = ctx.root.querySelector(`input[name="vr-q-${i}"]:checked`);
  if (!picked) {
    out.innerHTML = `<p class="ep-warn">Choose an answer first.</p>`;
    return;
  }
  const ok = Number(picked.value) === q.answer;
  ctx.evidence = q.evidence[ctx.tier];
  out.innerHTML = ok
    ? `<p class="ep-ok">✓ Correct. The proof is highlighted in the reading.</p>`
    : `<p class="ep-warn">Not yet. Look at the highlighted part of the reading and try again.</p>`;
  paint(ctx);
  ctx.root.querySelector("[data-vr-text]").scrollIntoView({ behavior: "smooth", block: "center" });
}

function checkCloze(ctx) {
  const blanks = [...ctx.root.querySelectorAll("[data-vr-blank]")];
  ctx.answers = Object.fromEntries(blanks.map((b) => [b.dataset.vrBlank, b.value]));
  ctx.checked = true;
  const right = blanks.filter(
    (b) => b.value.toLowerCase() === b.dataset.answer.toLowerCase(),
  ).length;
  paint(ctx);
  ctx.root.querySelector("[data-vr-clozescore]").textContent =
    `${right} of ${blanks.length} correct`;
}

function checkRetell(ctx) {
  const text = ctx.root.querySelector("[data-vr-retell]").value;
  const out = ctx.root.querySelector("[data-vr-retell-result]");
  if (countWords(text) < 5) {
    out.innerHTML = `<p class="ep-warn">Write at least a sentence first.</p>`;
    return;
  }
  const used = ctx.vocab.filter((v) => termRegex(v.term, "i").test(text));
  const missing = ctx.vocab.filter((v) => !used.includes(v));
  out.innerHTML = `<p><strong>${used.length} of ${ctx.vocab.length}</strong> unit words used${used.length ? `: ${used.map((v) => esc(v.term)).join(", ")}` : ""}.</p>${missing.length ? `<p class="ep-note">Try to add: ${missing.map((v) => esc(v.term)).join(", ")}.</p>` : `<p class="ep-ok">You used every unit word!</p>`}`;
}

function toggleTimer(ctx, btn) {
  if (btn.dataset.running === "false") {
    ctx.startedAt = Date.now();
    btn.dataset.running = "true";
    btn.textContent = "■ Stop and save";
    return;
  }
  const minutes = (Date.now() - ctx.startedAt) / 60000;
  btn.dataset.running = "false";
  btn.textContent = "⏱ Start timed read";
  if (minutes < 0.05) return;
  const wpm = Math.round(countWords(ctx.reading.texts[ctx.tier]) / minutes);
  const cur = ctx.store.get();
  const fluency = { ...(cur.fluency || {}) };
  fluency[ctx.tier] = [...(fluency[ctx.tier] || []), wpm].slice(-9);
  ctx.store.set({ ...cur, fluency });
  paintFluency(ctx);
}

function printReading(ctx) {
  const w = window.open("", "_blank", "noopener");
  if (!w) return;
  const text = ctx.reading.texts[ctx.tier];
  const paras = text
    .split(/\n\n/)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");
  const qs = ctx.reading.questions
    .map(
      (q, i) =>
        `<li>${esc(q.q)}<ul>${q.options.map((o) => `<li>☐ ${esc(o)}</li>`).join("")}</ul></li>`,
    )
    .join("");
  const words = ctx.vocab
    .map(
      (v) =>
        `<li><strong>${esc(v.term)}</strong>${v.cognate ? ` (${esc(v.cognate)})` : ""}: ${esc(v.def)}</li>`,
    )
    .join("");
  w.document.write(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(ctx.reading.title)}</title><style>body{font:16pt/1.6 Georgia,serif;max-width:7.2in;margin:.5in auto;color:#161614}h1{font-size:22pt}h2{font-size:14pt;margin-top:1.2em}ul,ol{font-size:12pt}.meta{font:10pt sans-serif;color:#575650}</style></head><body><p class="meta">${esc(ctx.unit.unit_title)} · ${TIER_LABEL[ctx.tier]} · Name: ____________________</p><h1>${esc(ctx.reading.title)}</h1>${paras}<h2>Unit words</h2><ul>${words}</ul><h2>Questions</h2><ol>${qs}</ol></body></html>`,
  );
  w.document.close();
  w.addEventListener("load", () => w.print());
}

function handle(ctx, e) {
  const el = e.target.closest("[data-vr],[data-vr-term]");
  if (!el || !ctx.root.contains(el)) return;
  if (!ctx.touched) {
    ctx.touched = true;
    ctx.onTelemetry?.("esol_routine");
  }
  if (el.dataset.vrTerm) return wordCard(ctx, el.dataset.vrTerm);
  const text = ctx.reading.texts[ctx.tier];
  const a = el.dataset.vr;
  if (a === "level") {
    ctx.reader.stop();
    ctx.tier = el.dataset.tier;
    ctx.evidence = "";
    ctx.answers = {};
    ctx.checked = false;
    paint(ctx);
  } else if (a === "mode") {
    ctx.reader.stop();
    ctx.mode = el.dataset.mode;
    ctx.answers = {};
    ctx.checked = false;
    ctx.evidence = "";
    paint(ctx);
    ctx.root.querySelector("[data-vr-clozescore]").textContent = "";
  } else if (a === "play") ctx.reader.playAll(text, 0.95);
  else if (a === "play-slow") ctx.reader.playAll(text, 0.7);
  else if (a === "echo") ctx.reader.echo(text, 0.9);
  else if (a === "stop") ctx.reader.stop();
  else if (a === "say") ctx.reader.speakWord(el.dataset.text, el.dataset.lang);
  else if (a === "known") {
    const cur = ctx.store.get();
    ctx.store.set({
      ...cur,
      known: { ...(cur.known || {}), [el.dataset.term]: Number(el.dataset.v) },
    });
    wordCard(ctx, el.dataset.term);
  } else if (a === "q-check") checkQuestion(ctx, Number(el.dataset.i));
  else if (a === "cloze-check") checkCloze(ctx);
  else if (a === "retell-check") checkRetell(ctx);
  else if (a === "timer") toggleTimer(ctx, el);
  else if (a === "print") printReading(ctx);
}

function handleChange(ctx, e) {
  const el = e.target;
  if (el.dataset?.vr === "gloss") ctx.gloss = el.checked;
  else if (el.dataset?.vr === "vocab") ctx.hl = el.checked;
  else return;
  paint(ctx);
}

export function renderVocabReader(
  container,
  { unit, reading, vocab, frame, wida = "3_4", onTelemetry } = {},
) {
  if (!container) return;
  const prev = instances.get(container);
  if (prev) {
    prev.ctx.reader.stop();
    container.removeEventListener("click", prev.click);
    container.removeEventListener("change", prev.change);
  }
  if (!unit) {
    container.innerHTML = `<div class="bh-empty">Select a BCPSS unit to open its vocabulary reading.</div>`;
    return;
  }
  if (!reading) {
    container.innerHTML = `<div class="bh-empty">The vocabulary reading for this unit is coming soon. Try the ESOL Power Pack tab for a full week of vocabulary routines.</div>`;
    return;
  }
  const ctx = {
    root: container,
    unit,
    reading,
    vocab,
    frame: frame || "In this reading, ___ shows that ___ because ___.",
    tier: reading.texts[wida] ? wida : "3_4",
    mode: "read",
    gloss: false,
    hl: true,
    evidence: "",
    answers: {},
    checked: false,
    onTelemetry,
    store: makeStore(unit.id),
  };
  container.innerHTML = shell(ctx);
  ctx.reader = createReader(container);
  if (!ctx.reader.supported)
    for (const b of container.querySelectorAll("[data-vr-audio] button"))
      if (b.dataset.vr !== "print") b.disabled = true;
  paint(ctx);
  paintQuestions(ctx);
  const click = (e) => handle(ctx, e);
  const change = (e) => handleChange(ctx, e);
  container.addEventListener("click", click);
  container.addEventListener("change", change);
  instances.set(container, { ctx, click, change });
}
