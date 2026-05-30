// ── The Writing Revolution (TWR) — interactive lesson step ───────────────────
// Renders typed-input writing boxes for the TWR Core set, driven entirely by
// the lesson's config (via deriveTWR). Mirrors the patterns used by
// open-response.js: a card, sentence frames, a textarea, and a submit button
// that gives low-friction formative feedback (it never blocks the lesson).
//
// Responses are persisted through the optional `saveResponse`/`getResponse`
// callbacks so a student's writing survives navigation, exactly like the
// reflect / connect phases.

import { deriveTWR } from "../core/twr.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// One labelled writing row: a frame line (bilingual) + a textarea that auto-saves.
function writeRow(
  parent,
  { key, frameEn, frameEs, rows = 2, getResponse, saveResponse },
) {
  if (frameEn) {
    const frame = document.createElement("p");
    frame.className = "sentence-frame";
    frame.style.cssText = "margin:0 0 var(--sp-1); font-weight:600;";
    frame.innerHTML = esc(frameEn).replace(
      /___/g,
      '<span class="blank">&nbsp;</span>',
    );
    if (frameEs) {
      const es = document.createElement("span");
      es.style.cssText =
        "display:block; color:var(--muted); font-style:italic; font-weight:600;";
      es.textContent = frameEs;
      frame.append(es);
    }
    parent.append(frame);
  }

  const ta = document.createElement("textarea");
  ta.className = "text-input";
  ta.rows = rows;
  ta.placeholder = "Write your sentence...";
  ta.setAttribute("aria-label", frameEn || key);
  ta.style.cssText = "margin-bottom:var(--sp-3);";
  if (getResponse) ta.value = getResponse(key) || "";
  ta.addEventListener("input", () => {
    if (saveResponse) saveResponse(key, ta.value);
  });
  parent.append(ta);
  return ta;
}

function subhead(text, tag) {
  const h = document.createElement("h4");
  h.style.cssText = "margin:var(--sp-4) 0 var(--sp-2); color:var(--navy);";
  h.innerHTML = `${esc(text)}${
    tag
      ? ` <span class="badge badge-amber" style="vertical-align:middle;">${esc(tag)}</span>`
      : ""
  }`;
  return h;
}

export function renderTwrWriting(
  container,
  config,
  { getResponse, saveResponse, onSubmit } = {},
) {
  const twr = deriveTWR(config);
  const inputs = [];

  const card = document.createElement("section");
  card.className = "card card-amber";
  card.setAttribute("aria-labelledby", "twr-title");

  const head = document.createElement("div");
  head.style.cssText =
    "display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-2);";
  head.innerHTML = `
    <span style="font-size:1.6rem;" aria-hidden="true">✍️</span>
    <h3 id="twr-title" style="margin:0; color:var(--navy);">Write About the Math</h3>
    <span class="badge badge-teal" style="margin-left:auto;">The Writing Revolution</span>`;
  card.append(head);

  const lead = document.createElement("p");
  lead.style.cssText = "margin:0 0 var(--sp-3); color:var(--muted);";
  lead.textContent =
    twr.languageObjective ||
    "Build strong math sentences. Write each one, then read it out loud.";
  card.append(lead);

  // 1. Kernel sentence
  card.append(subhead("1. Kernel Sentence", "subject + verb"));
  const kModel = document.createElement("p");
  kModel.style.cssText =
    "background:var(--teal-light); border-radius:var(--radius-sm); padding:var(--sp-2) var(--sp-3); margin:0 0 var(--sp-2); font-size:0.95rem;";
  kModel.innerHTML = `<strong style="color:var(--teal);">Model:</strong> ${esc(twr.kernel.en)}`;
  card.append(kModel);
  inputs.push(
    writeRow(card, {
      key: "twr_kernel",
      frameEn: twr.kernel.promptEn,
      frameEs: twr.kernel.promptEs,
      rows: 2,
      getResponse,
      saveResponse,
    }),
  );

  // 2. Sentence expansion
  card.append(subhead("2. Sentence Expansion", "because · but · so"));
  const kInfo = document.createElement("p");
  kInfo.style.cssText = "margin:0 0 var(--sp-2); font-size:0.9rem;";
  kInfo.innerHTML = `<strong style="color:var(--teal);">Kernel:</strong> ${esc(twr.expansion.kernelEn)}`;
  card.append(kInfo);
  twr.expansion.conjunctions.forEach((c, i) => {
    inputs.push(
      writeRow(card, {
        key: `twr_expand_${c.word}`,
        frameEn: c.frameEn,
        frameEs: c.frameEs,
        rows: 1,
        getResponse,
        saveResponse,
      }),
    );
  });

  // 3. Sentence types
  card.append(subhead("3. Sentence Types", "4 ways to write a math idea"));
  twr.sentenceTypes.forEach((t) => {
    const hint = document.createElement("p");
    hint.style.cssText = "margin:var(--sp-2) 0 var(--sp-1); font-weight:700;";
    hint.innerHTML = `${esc(t.type)} <span style="font-weight:400; color:var(--muted); font-style:italic;">— ${esc(t.hintEn)}</span>`;
    card.append(hint);
    inputs.push(
      writeRow(card, {
        key: `twr_type_${t.type}`,
        frameEn: t.frameEn,
        frameEs: t.frameEs,
        rows: 1,
        getResponse,
        saveResponse,
      }),
    );
  });

  // 4. Explain your reasoning
  card.append(subhead("4. Explain Your Reasoning", "use a sentence starter"));
  if (twr.reasoningStems.length) {
    const stems = document.createElement("ul");
    stems.style.cssText = "margin:0 0 var(--sp-2); padding-left:1.1rem;";
    twr.reasoningStems.forEach((s) => {
      const li = document.createElement("li");
      li.style.cssText = "margin-bottom:var(--sp-1);";
      li.innerHTML = `<strong>${esc(s.en)}</strong>${
        s.es
          ? `<span style="display:block; color:var(--muted); font-style:italic;">${esc(s.es)}</span>`
          : ""
      }`;
      stems.append(li);
    });
    card.append(stems);
  }
  inputs.push(
    writeRow(card, {
      key: "twr_reasoning",
      frameEn: "",
      rows: 3,
      getResponse,
      saveResponse,
    }),
  );

  // Submit / feedback (formative, never blocks the lesson)
  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  card.append(feedbackSlot);

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn btn-primary mt-4";
  submitBtn.textContent = "Save My Writing";
  submitBtn.addEventListener("click", () => {
    const written = inputs.filter((ta) => ta.value.trim().length > 0).length;
    const fb = document.createElement("div");
    if (written === 0) {
      fb.className = "feedback feedback-hint visible";
      fb.setAttribute("role", "alert");
      fb.innerHTML =
        '<span class="feedback-icon">💡</span><span>Write at least one sentence to get started — use a frame above.</span>';
    } else {
      fb.className = "feedback feedback-success visible";
      fb.setAttribute("role", "status");
      fb.innerHTML = `<span class="feedback-icon">✓</span><span>Nice work! You wrote ${written} of ${inputs.length} sentences. Read them out loud to a partner.</span>`;
      if (onSubmit) onSubmit(written, inputs.length);
    }
    feedbackSlot.innerHTML = "";
    feedbackSlot.append(fb);
  });
  card.append(submitBtn);

  container.append(card);

  return {
    getValues: () => inputs.map((ta) => ta.value.trim()),
    countWritten: () =>
      inputs.filter((ta) => ta.value.trim().length > 0).length,
  };
}

export default renderTwrWriting;
