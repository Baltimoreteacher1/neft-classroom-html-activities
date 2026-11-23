// Interactive routines for the ESOL Power Pack tab: dictogloss, Language Doctor, Sentence Ladder,
// spiral retrieval, Language Passport and home-language glossary. Everything is client-side;
// student writing never leaves the browser (progress is saved to this device only).

const TIER_LABEL = { "1_2": "Levels 1–2", "3_4": "Levels 3–4", "5_6": "Levels 5–6" };
const TIER_TERMS = { "1_2": 1, "3_4": 2, "5_6": 3 };
const DOMAINS = ["Listening", "Speaking", "Reading", "Writing"];
const LEVELS = [
  { v: 1, label: "Not yet" },
  { v: 2, label: "Almost" },
  { v: 3, label: "Got it" },
];

export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const words = (text) =>
  String(text || "")
    .toLowerCase()
    .match(/[a-z0-9']+/g) || [];
const wordCount = (text) => words(text).length;

// ── Speech ────────────────────────────────────────────────────────────────────

export function speak(text, { lang = "en-US", rate = 0.95, onEnd } = {}) {
  if (!("speechSynthesis" in window)) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeech() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

export function speakSequence(sentences, rate, pauseMs) {
  stopSpeech();
  const next = (i) => {
    if (i >= sentences.length) return;
    speak(sentences[i], { rate, onEnd: () => setTimeout(() => next(i + 1), pauseMs) });
  };
  return "speechSynthesis" in window ? (next(0), true) : false;
}

// ── Dictogloss ────────────────────────────────────────────────────────────────

export function renderDictogloss(ctx) {
  const d = ctx.pack.dictogloss;
  const canSpeak = "speechSynthesis" in window;
  return `
    <ol class="ep-steps">${d.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
    <p class="ep-note"><strong>${esc(TIER_LABEL[ctx.wida])}:</strong> ${esc(d.tier_notes[ctx.wida])}</p>
    <div class="ep-row ep-noprint">
      <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-ep-action="dict-play" data-mode="normal" ${canSpeak ? "" : "disabled"}>▶ Listen (normal speed)</button>
      <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-ep-action="dict-play" data-mode="slow" ${canSpeak ? "" : "disabled"}>▶ Slower</button>
      <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-ep-action="dict-play" data-mode="chunks" ${canSpeak ? "" : "disabled"}>▶ Sentence by sentence</button>
      <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-ep-action="dict-stop">■ Stop</button>
    </div>
    ${canSpeak ? "" : `<p class="ep-note">This browser cannot read aloud. Teacher: read the text below twice at normal speed.</p>`}
    <div class="ep-keywords" aria-label="Key words">${d.key_words.map((w) => `<span class="ep-chip">${esc(w)}</span>`).join("")}</div>
    <label class="ep-label" for="ep-dict-input">Rebuild the text in your own words (keep the meaning and the key words)</label>
    <textarea id="ep-dict-input" class="ep-textarea" rows="5" data-ep-dict-input placeholder="Write what you heard…"></textarea>
    <div class="ep-row ep-noprint">
      <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-ep-action="dict-compare">Compare with the original</button>
    </div>
    <div class="ep-result" data-ep-dict-result aria-live="polite"></div>
    <details class="ep-details ep-noprint"><summary>Teacher: read-aloud text (${d.word_count} words)</summary><p class="ep-readtext">${esc(d.text)}</p></details>`;
}

export function dictCompare(ctx, root) {
  const d = ctx.pack.dictogloss;
  const student = root.querySelector("[data-ep-dict-input]")?.value || "";
  const out = root.querySelector("[data-ep-dict-result]");
  if (!out) return;
  if (wordCount(student) < 3) {
    out.innerHTML = `<p class="ep-warn">Write at least a few words first, then compare.</p>`;
    return;
  }
  const studentSet = new Set(words(student));
  const content = [...new Set(words(d.text).filter((w) => w.length > 3))];
  const found = content.filter((w) => studentSet.has(w));
  const pct = Math.round((found.length / content.length) * 100);
  const keysUsed = d.key_words.filter((k) => student.toLowerCase().includes(k.toLowerCase()));
  const marked = d.text
    .split(/(\s+)/)
    .map((tok) => {
      const w = (tok.toLowerCase().match(/[a-z0-9']+/) || [""])[0];
      if (!w || w.length <= 3) return esc(tok);
      return `<mark class="${studentSet.has(w) ? "ep-hit" : "ep-miss"}">${esc(tok)}</mark>`;
    })
    .join("");
  out.innerHTML = `
    <p><strong>${pct}%</strong> of the important words are in your version. Key words used: <strong>${keysUsed.length}/${d.key_words.length}</strong>.</p>
    <p class="ep-readtext">${marked}</p>
    <p class="ep-note"><mark class="ep-hit">Green</mark> = you captured it. <mark class="ep-miss">Amber</mark> = revise and add it, or find a synonym that keeps the meaning. Different words are fine if the meaning is the same.</p>`;
}

// ── Language Doctor ───────────────────────────────────────────────────────────

export function renderDoctor(ctx) {
  const items = ctx.pack.doctor
    .map(
      (it, i) => `
    <fieldset class="ep-q" data-ep-doc="${i}">
      <legend><span class="ep-bad">${esc(it.wrong)}</span></legend>
      <p class="ep-note">Which is the best fix?</p>
      ${it.options
        .map(
          (o, j) =>
            `<label class="ep-opt"><input type="radio" name="ep-doc-${i}" value="${j}" /> <span>${esc(o)}</span></label>`,
        )
        .join("")}
      <div class="ep-row ep-noprint"><button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-ep-action="doc-check" data-i="${i}">Check</button></div>
      <div class="ep-result" data-ep-doc-result="${i}" aria-live="polite"></div>
    </fieldset>`,
    )
    .join("");
  return `<p class="ep-note">These sentences contain errors that are common for Spanish speakers learning English. Diagnose each one, choose the fix, and say the rule to a partner.</p>${items}<p class="ep-score" data-ep-doc-score aria-live="polite"></p>`;
}

export function doctorCheck(ctx, root, i) {
  const it = ctx.pack.doctor[i];
  const picked = root.querySelector(`input[name="ep-doc-${i}"]:checked`);
  const out = root.querySelector(`[data-ep-doc-result="${i}"]`);
  if (!it || !out) return;
  if (!picked) {
    out.innerHTML = `<p class="ep-warn">Choose an answer first.</p>`;
    return;
  }
  const ok = Number(picked.value) === it.answer_index;
  ctx.state.doctor[i] = ok;
  out.innerHTML = ok
    ? `<p class="ep-ok">✓ Correct. <strong>Rule:</strong> ${esc(it.rule)}</p><p class="ep-note">${esc(it.why)}</p>`
    : `<p class="ep-warn">Not yet. <strong>Hint:</strong> ${esc(it.rule)}</p>`;
  const done = Object.values(ctx.state.doctor).filter(Boolean).length;
  root.querySelector("[data-ep-doc-score]").textContent =
    `${done} of ${ctx.pack.doctor.length} fixed`;
}

// ── Sentence Ladder ───────────────────────────────────────────────────────────

export function renderLadder(ctx) {
  const lad = ctx.pack.ladder;
  const tier = lad.tiers[ctx.wida];
  const rungs = tier.rungs
    .map(
      (r, i) => `
    <div class="ep-rung" data-ep-rung="${i}">
      <h4>Rung ${i + 1} · ${esc(r.label)}</h4>
      <p class="ep-note">${esc(r.prompt)} Try: ${r.connectors
        .slice(0, 4)
        .map((c) => `<span class="ep-chip">${esc(c)}</span>`)
        .join(" ")}</p>
      <textarea class="ep-textarea" rows="2" aria-label="Rung ${i + 1} sentence" data-ep-rung-input="${i}"></textarea>
      <div class="ep-row ep-noprint"><button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-ep-action="ladder-check" data-i="${i}">Check rung ${i + 1}</button></div>
      <div class="ep-result" data-ep-rung-result="${i}" aria-live="polite"></div>
    </div>`,
    )
    .join("");
  return `
    <p class="ep-note">Start with the kernel sentence and climb. Each rung must be <strong>longer</strong> and use a <strong>new connector</strong>. ${esc(TIER_LABEL[ctx.wida])}: ${tier.rungs.length} rungs, use at least ${Math.min(TIER_TERMS[ctx.wida], lad.unit_terms.length)} unit term${TIER_TERMS[ctx.wida] > 1 ? "s" : ""}.</p>
    <p class="ep-kernel"><span class="ep-chip">Kernel</span> ${esc(lad.kernel)}</p>
    ${tier.frames.length ? `<details class="ep-details"><summary>Sentence frames for ${esc(TIER_LABEL[ctx.wida])}</summary><ul>${tier.frames.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></details>` : ""}
    <div class="ep-keywords">${lad.unit_terms.map((w) => `<span class="ep-chip">${esc(w)}</span>`).join("")}</div>
    ${rungs}
    <div class="ep-result" data-ep-ladder-summary aria-live="polite"></div>
    <div class="ep-row ep-noprint"><button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-ep-action="ladder-copy">Copy my top rung</button></div>`;
}

export function ladderCheck(ctx, root, i) {
  const lad = ctx.pack.ladder;
  const tier = lad.tiers[ctx.wida];
  const rung = tier.rungs[i];
  const input = (n) => root.querySelector(`[data-ep-rung-input="${n}"]`)?.value || "";
  const out = root.querySelector(`[data-ep-rung-result="${i}"]`);
  if (!rung || !out) return;
  const text = input(i);
  const prev = i === 0 ? lad.kernel : input(i - 1);
  const lower = text.toLowerCase();
  const grew = wordCount(text) >= wordCount(prev) + 2;
  const conn = rung.connectors.find((c) => new RegExp(`\\b${c}\\b`).test(lower));
  const notes = [
    grew
      ? `<span class="ep-ok">✓ Longer (${wordCount(text)} words)</span>`
      : `<span class="ep-warn">Add at least 2 more words than the last rung (${wordCount(prev)} → ${wordCount(text)}).</span>`,
    conn
      ? `<span class="ep-ok">✓ Connector: “${esc(conn)}”</span>`
      : `<span class="ep-warn">Try a connector: ${rung.connectors.slice(0, 3).map(esc).join(", ")}.</span>`,
  ];
  out.innerHTML = `<p>${notes.join(" · ")}</p>`;
  const last = tier.rungs.length - 1;
  if (i === last || text.trim()) {
    const top = input(last) || text;
    const used = lad.unit_terms.filter((t) => top.toLowerCase().includes(t.toLowerCase()));
    const need = Math.min(TIER_TERMS[ctx.wida], lad.unit_terms.length);
    root.querySelector("[data-ep-ladder-summary]").innerHTML =
      `<p>Unit terms in your top rung: <strong>${used.length}/${need} needed</strong>${used.length ? ` (${used.map(esc).join(", ")})` : ""}.</p>`;
  }
}

export function ladderTopText(root, rungCount) {
  for (let i = rungCount - 1; i >= 0; i -= 1) {
    const v = root.querySelector(`[data-ep-rung-input="${i}"]`)?.value?.trim();
    if (v) return v;
  }
  return "";
}

// ── Spiral retrieval ──────────────────────────────────────────────────────────

export function renderRetrieval(ctx) {
  const items = ctx.pack.retrieval
    .map(
      (r, i) => `
    <fieldset class="ep-q" data-ep-ret="${i}">
      <legend>${esc(r.prompt)}${r.spiral ? ` <span class="ep-chip ep-chip-spiral">Spiral: ${esc(r.from)}</span>` : ""}</legend>
      ${r.options.map((o, j) => `<label class="ep-opt"><input type="radio" name="ep-ret-${i}" value="${j}" /> <span>${esc(o)}</span></label>`).join("")}
    </fieldset>`,
    )
    .join("");
  return `<p class="ep-note">Which word matches each meaning? Spiral words come back from earlier units so they stay in long-term memory.</p>${items}
    <div class="ep-row ep-noprint"><button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-ep-action="ret-check">Check all</button></div>
    <div class="ep-result" data-ep-ret-result aria-live="polite"></div>`;
}

export function retrievalCheck(ctx, root) {
  let right = 0;
  const lines = ctx.pack.retrieval.map((r, i) => {
    const picked = root.querySelector(`input[name="ep-ret-${i}"]:checked`);
    const ok = picked && Number(picked.value) === r.answer_index;
    if (ok) right += 1;
    return `<li class="${ok ? "ep-ok" : "ep-warn"}">${ok ? "✓" : "✗"} ${esc(r.answer)}${ok ? "" : ` — review: “${esc(r.prompt)}”`}</li>`;
  });
  root.querySelector("[data-ep-ret-result]").innerHTML =
    `<p><strong>${right} of ${ctx.pack.retrieval.length}</strong> correct.</p><ul>${lines.join("")}</ul>`;
}

// ── Passport ──────────────────────────────────────────────────────────────────

export function renderPassport(ctx) {
  const stmts = ctx.pack.passport[ctx.wida];
  const saved = ctx.store.get().passport || {};
  const rows = DOMAINS.map((d) => {
    const cur = saved[`${ctx.wida}:${d}`] || 0;
    return `<div class="ep-pp-row">
      <div><strong>${d}</strong><p>${esc(stmts[d])}</p></div>
      <div class="ep-pp-btns" role="group" aria-label="${d} confidence">
        ${LEVELS.map((l) => `<button type="button" class="ep-pp-btn" data-ep-action="pp-set" data-domain="${d}" data-v="${l.v}" aria-pressed="${cur === l.v}">${l.label}</button>`).join("")}
      </div></div>`;
  }).join("");
  const got = DOMAINS.filter((d) => saved[`${ctx.wida}:${d}`] === 3).length;
  const goal = saved[`goal:${ctx.wida}`] || "";
  return `<p class="ep-note">${esc(TIER_LABEL[ctx.wida])} I-can statements. Students rate themselves honestly; the goal is growth, not a grade. Saved on this device only.</p>${rows}
    <p class="ep-score">${got} of 4 domains marked “Got it”.</p>
    <label class="ep-label" for="ep-goal">My language goal for next week</label>
    <select id="ep-goal" class="ep-select" data-ep-goal>
      <option value="">Choose a goal…</option>
      ${DOMAINS.map((d) => `<option value="${d}" ${goal === d ? "selected" : ""}>Strengthen my ${d.toLowerCase()}</option>`).join("")}
    </select>`;
}

// ── Home-language glossary ────────────────────────────────────────────────────

export function renderGlossary(ctx) {
  const saved = ctx.store.get().glossary || {};
  const rows = ctx.pack.cognates
    .map((c, i) => {
      const g = saved[c.term] || {};
      return `<tr>
        <th scope="row">${esc(c.term)}<span class="ep-sub">${esc(c.def)}</span></th>
        <td><input class="ep-input" data-ep-gloss="home" data-term="${esc(c.term)}" aria-label="Word in my language for ${esc(c.term)}" value="${esc(g.home || "")}" /></td>
        <td><input class="ep-input" data-ep-gloss="note" data-term="${esc(c.term)}" aria-label="Sketch note or example for ${esc(c.term)}" value="${esc(g.note || "")}" placeholder="draw or write an example" /></td>
      </tr>`;
    })
    .join("");
  const lang = saved.__lang || "";
  return `<p class="ep-note">Translanguaging: use every language you know to build meaning, then show it in English. Start in your home language, then rehearse the English sentence.</p>
    <label class="ep-label" for="ep-lang">My language</label>
    <input id="ep-lang" class="ep-input ep-input-sm" data-ep-gloss="lang" value="${esc(lang)}" placeholder="Spanish, Arabic, Haitian Creole, Mam…" />
    <div class="ep-table-wrap"><table class="ep-table"><thead><tr><th>English word</th><th>In my language</th><th>My note</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="ep-row ep-noprint"><button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-ep-action="gloss-copy">Copy my glossary</button></div>`;
}

export function glossaryText(ctx) {
  const g = ctx.store.get().glossary || {};
  const header = `English\t${g.__lang || "My language"}\tNote`;
  return [
    header,
    ...ctx.pack.cognates.map(
      (c) => `${c.term}\t${g[c.term]?.home || ""}\t${g[c.term]?.note || ""}`,
    ),
  ].join("\n");
}

export function saveGlossaryField(ctx, el) {
  const cur = ctx.store.get();
  const glossary = { ...(cur.glossary || {}) };
  const field = el.dataset.epGloss;
  if (field === "lang") glossary.__lang = el.value;
  else glossary[el.dataset.term] = { ...(glossary[el.dataset.term] || {}), [field]: el.value };
  ctx.store.set({ ...cur, glossary });
}

export function setPassport(ctx, domain, value) {
  const cur = ctx.store.get();
  ctx.store.set({
    ...cur,
    passport: { ...(cur.passport || {}), [`${ctx.wida}:${domain}`]: Number(value) },
  });
}

export function setGoal(ctx, value) {
  const cur = ctx.store.get();
  ctx.store.set({ ...cur, passport: { ...(cur.passport || {}), [`goal:${ctx.wida}`]: value } });
}
