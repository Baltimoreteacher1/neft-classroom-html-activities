// Language Error Detective: diagnose a specific language pattern in the learner's own work, learn it in a
// short micro-lesson, REVISE the sentence, try fresh sentences without help, then write a new piece where
// the pattern is needed (transfer). Feedback is specific to the pattern; "right/wrong" is never the whole message.
import { crumbsHTML } from "../components.js";
import { loadPatterns } from "../content.js";
import { checkRevision, detect } from "../lang/errors.js";
import { appendEntry, buildProfile, loadLedger, saveLedger } from "../lang/ledger.js";
import { analyzeResponse } from "../lang/analyze.js";
import { detectiveState, loadStudio, saveStudio } from "../lang/studio.js";
import { chooserHeroHTML, highlightHTML, jumpNavHTML, stepperHTML } from "../studio-ui.js";
import { ART, BASE, announce, html, icon, raw, wordCount } from "../util.js";

const IGN = raw("data-nsr-ignore");
let D = null;
const CATEGORY = {
  syntax: "Sentence structure",
  discourse: "Connecting ideas",
  conventions: "Conventions",
  "word-choice": "Word choice",
  morphology: "Word parts",
};
const FRESH = 3; // fresh sentences after the guided revision

/** Examples of each pattern in the learner's own writing and transcripts: [{id, text, sentence}] */
function ownExamples(studio) {
  const texts = [];
  for (const [task, w] of Object.entries(studio.writing))
    for (const v of w.versions.slice(-2)) texts.push({ task, text: v.text });
  for (const [task, s] of Object.entries(studio.speaking))
    for (const t of s.takes.slice(-2)) if (t.transcript) texts.push({ task, text: t.transcript });
  const found = {};
  for (const { text } of texts)
    for (const f of detect(text))
      if (f.confidence === "high")
        (found[f.id] ||= []).push({
          sentence: f.sentence.text,
          span: { start: f.start - f.sentence.start, end: f.end - f.sentence.start },
          text: f.text,
        });
  return found;
}

function hubHTML(ctx, data) {
  const own = D.own;
  const profile = buildProfile(D.ledger.entries, { band: ctx.band });
  const mine = Object.keys(own)
    .map((id) => ({ id, n: own[id].length }))
    .sort((a, b) => b.n - a.n);
  const pats = Object.entries(data.patterns);
  const cats = [...new Set(pats.map(([, p]) => p.category))];
  const state = (id) => D.studio.detective[id];
  const status = (id) =>
    state(id)?.transfer?.some((t) => t.ok && t.independent)
      ? html`<span class="mode-pill is-done">${icon("check")} Used on my own</span>`
      : state(id)?.seen
        ? html`<span class="mode-pill">${icon("clock")} In progress</span>`
        : "";
  const card = (id, p, extra) =>
    html`<a class="card task-card case-card" href="${BASE}/detective/${id}?grades=${ctx.band}">
      <span class="task-top"><span class="task-ico">${icon("detective")}</span><span class="task-kind">${CATEGORY[p.category] || p.category}</span>${status(id)}</span>
      <strong class="task-title">${p.name}</strong>
      <span class="case-ex"><del>${p.lesson.wrong}</del><span class="case-arrow" aria-hidden="true">${icon("arrow-right")}</span><ins>${p.lesson.right}</ins></span>
      ${extra ? html`<span class="task-why">${icon("search")}<span>${extra}</span></span>` : ""}
    </a>`;
  return html`${crumbsHTML([
      ["Lab", `${BASE}/?grades=${ctx.band}`],
      ["Language Error Detective", null],
    ])}
    <div class="d-detective">
    ${chooserHeroHTML({
      domain: "d-detective",
      eyebrow: `${pats.length} case files · Grades ${ctx.band.replace("-", "–")}`,
      title: "Language Error Detective",
      lead: "Find a pattern in your own writing, learn the rule, fix your sentence, try new ones, then use it in new writing.",
      art: `${ART}/studio-detective.svg`,
      loop: ["Notice", "Learn", "Fix", "Try new ones", "Use it"],
    })}
    <section class="task-group is-next" aria-labelledby="det-own-h">
      <header><h2 id="det-own-h">${icon("search")} Cases from your own work</h2><p class="fine">Patterns found in the writing and speaking saved on this device.</p></header>
      ${
        mine.length
          ? html`<div class="task-grid">${mine.slice(0, 4).map((m) => card(m.id, data.patterns[m.id], `Found ${m.n} time${m.n === 1 ? "" : "s"} in your recent writing or speaking`))}</div>`
          : html`<p class="case-empty">${icon("info")}<span>No pattern errors found in your saved work yet. Write or speak in the studios, then come back — or pick any case file below.</span></p>`
      }
      ${profile.detective ? html`<p class="fine">${profile.detective} detective attempts saved on this device.</p>` : ""}
    </section>
    ${jumpNavHTML(cats.map((c) => [`det-${c}`, CATEGORY[c] || c]), "Jump to a kind of pattern")}
    ${cats.map(
      (c) =>
        html`<section class="task-group" id="det-${c}" aria-labelledby="det-${c}-h">
          <header><h2 id="det-${c}-h">${CATEGORY[c] || c[0].toUpperCase() + c.slice(1)}</h2></header>
          <div class="task-grid">${pats.filter(([, p]) => p.category === c).map(([id, p]) => card(id, p))}</div>
        </section>`,
    )}</div>`;
}

const phaseOf = () =>
  D.step === 0
    ? "diagnose"
    : D.step === 1
      ? "lesson"
      : D.step === 2
        ? "revise"
        : D.step <= 2 + FRESH
          ? "fresh"
          : "transfer";
const STEP_OF = { diagnose: 0, lesson: 1, revise: 2, fresh: 3, transfer: 4 };

function ruleHTML(p, phase) {
  const lesson = p.lesson;
  return html`<section class="panel micro-lesson">
    <h3>${icon("bulb")} The rule</h3>
    <p class="rule-text">${lesson.rule}</p>
    <div class="rule-pair"><p class="is-wrong"><span class="pair-label">Not quite</span><del>${lesson.wrong}</del></p><p class="is-right"><span class="pair-label">Fluent</span><ins>${lesson.right}</ins></p></div>
    <p class="fine">${lesson.why}</p>
    ${lesson.l1 ? html`<p class="l1-note">${icon("language")}<span>${lesson.l1}</span></p>` : ""}
    <p class="move-ask self-check">${icon("check")}<span>Self-check: ${lesson.check}</span></p>
    ${phase === "lesson" ? html`<button type="button" class="btn btn-primary" data-next>Fix a sentence${icon("arrow-right")}</button>` : ""}
  </section>`;
}

function caseHTML(ctx, p, id) {
  const lesson = p.lesson;
  const own = D.own[id]?.[0];
  const items = D.items;
  const phase = phaseOf();
  const idx = D.step - 3;
  const cur = phase === "revise" ? items[0] : phase === "fresh" ? items[1 + idx] : null;
  const showLesson = phase === "lesson" || phase === "revise";
  const at = STEP_OF[phase];
  const steps = ["Notice", "Learn", "Fix", "Try new ones", "Use it"].map((label, i) => ({ label, done: i < at }));
  return html`${crumbsHTML([
      ["Lab", `${BASE}/?grades=${ctx.band}`],
      ["Language Error Detective", `${BASE}/detective?grades=${ctx.band}`],
      [p.name, null],
    ])}
    <article class="activity studio-view detective d-detective">
      <header class="act-head">
        <div class="act-bar"><p class="act-context">${icon("detective")} Case file · ${CATEGORY[p.category] || p.category}</p></div>
        <h1 tabindex="-1">${p.name}</h1>
        <p class="fine case-sub">Five short steps: notice the pattern, learn the rule, fix a sentence, try new ones, then use it in your own writing.</p>
      </header>
      ${stepperHTML(steps, { label: "Steps", current: at })}
      ${
        phase === "diagnose"
          ? html`<section class="panel notice-panel">
              <h3>${icon("search")} Notice</h3>
              ${
                own
                  ? html`<p>This pattern showed up in your own work:</p>
                      <p class="evidence-text specimen">${highlightHTML(own.sentence, [own.span], "hl hl-error")}</p>`
                  : html`<p>An example of this pattern:</p>
                      <p class="evidence-text specimen"><del>${lesson.wrong}</del></p>`
              }
              <p class="move-ask">Read it aloud. Where does it sound different from how a fluent writer would say it?</p>
              <button type="button" class="btn btn-primary" data-next>Show me the rule${icon("arrow-right")}</button>
            </section>`
          : ""
      }
      <div class="${showLesson && cur ? "det-split" : ""}">
      ${showLesson ? ruleHTML(p, phase) : ""}
      ${
        cur
          ? html`<section class="panel fix-panel">
              <h3>${phase === "revise" ? html`${icon("writing")} Fix this sentence` : html`${icon("writing")} Fresh sentence ${idx + 1} of ${FRESH} — no rule on screen`}</h3>
              ${
                phase === "fresh"
                  ? html`<p class="fine">Opening the rule again counts as help. <button type="button" class="ghost small" data-peek>Show the rule</button></p>
                      ${D.peek ? html`<p class="rule-text">${lesson.rule}</p>` : ""}`
                  : ""
              }
              <p class="fine">${cur.prompt}</p>
              <label class="field paper"><span class="paper-head">Your corrected sentence</span><textarea id="det-answer" rows="3" data-answer ${IGN}>
${D.answer ?? cur.broken}</textarea></label>
              <div class="row-actions">
                <button type="button" class="btn btn-primary" data-check-fix>${icon("check")} Check my fix</button>
                <button type="button" class="ghost" data-hint>${icon("bulb")} Hint</button>
              </div>
              ${
                D.result
                  ? html`<div class="feedback ${D.result.ok ? "is-right" : "is-hint"}" role="status">
                      <p class="fb-title">${icon(D.result.ok ? "check" : D.result.hint ? "bulb" : "retry")} ${D.result.ok ? "Fixed" : D.result.hint ? "Hint" : "Not yet"}</p>
                      <p>${D.result.msg}</p>
                      ${D.result.ok ? html`<button type="button" class="btn btn-primary" data-next>Next${icon("arrow-right")}</button>` : ""}
                    </div>`
                  : ""
              }
            </section>`
          : ""
      }
      </div>
      ${phase === "transfer" ? transferHTML(p) : ""}
    </article>`;
}

function transferHTML(p) {
  const t = D.transfer;
  return html`<section class="panel fix-panel">
    <h3>${icon("writing")} Use it in new writing</h3>
    <p class="fine">${t.context}</p>
    <p class="transfer-prompt">${t.prompt}</p>
    <label class="field paper"><span class="paper-head">Your writing</span><textarea id="det-transfer" rows="5" data-transfer ${IGN}>${D.answer ?? ""}</textarea></label>
    <p class="fine">At least ${t.minWords} words. We check for "${p.name}" only — nothing else.</p>
    <button type="button" class="btn btn-primary" data-check-transfer>${icon("check")} Check my writing</button>
    ${
      D.result
        ? html`<div class="feedback ${D.result.ok ? "is-right" : "is-hint"}" role="status">
            <p class="fb-title">${icon(D.result.ok ? "check" : "retry")} ${D.result.ok ? "You used it correctly in new writing" : "Not yet"}</p>
            <p>${D.result.msg}</p>
          </div>`
        : ""
    }
    ${
      D.result?.ok
        ? html`<p class="saved-note">${icon("check")} Case closed. Your teacher will see this transfer.</p>
            <a class="btn" href="${BASE}/detective?grades=${D.band}">Back to case files</a>`
        : ""
    }
  </section>`;
}

function log(kind, ok, extra = {}) {
  const st = D.helped ? "supported" : "independent";
  appendEntry(D.ledger, {
    src: "detective",
    task: `det-${D.id}`,
    band: D.band,
    domain: "Writing",
    use: "",
    stage: st,
    kind,
    supports: D.peek || D.hintsUsed ? { hint: true } : {},
    m: { pattern: D.id, ok, ...extra },
  });
  saveLedger(D.ledger);
}

export async function render(ctx) {
  const data = await loadPatterns();
  const id = ctx.route.id;
  const studio = loadStudio();
  const keep = D && D.id === id ? D : null;
  D = keep || {
    band: ctx.band,
    step: 0,
    answer: null,
    result: null,
    hintsUsed: 0,
    peek: false,
    helped: false,
  };
  Object.assign(D, { studio, ledger: loadLedger(), band: ctx.band, own: ownExamples(studio), id });
  if (!id) return { title: "Language Error Detective", html: hubHTML(ctx, data) };
  const p = data.patterns[id];
  if (!p)
    return {
      title: "Not found",
      html: html`<section class="panel">
        <h1>That case file does not exist.</h1>
        <a class="btn" href="${BASE}/detective?grades=${ctx.band}">Case files</a>
      </section>`,
    };
  if (!keep) {
    const st = detectiveState(studio, id);
    // least-practised items first, so a second visit brings new sentences instead of memorised ones
    const times = (id) => (st.seenItems || {})[id] || 0;
    const ordered = [...p.practice].sort((a, b) => times(a.id) - times(b.id) || p.practice.indexOf(a) - p.practice.indexOf(b));
    D.items = ordered.slice(0, 1 + FRESH);
    st.seenItems = { ...(st.seenItems || {}) };
    for (const it of D.items) st.seenItems[it.id] = times(it.id) + 1;
    D.transfer = p.transfer[(st.transfer?.length || 0) % p.transfer.length];
    st.seen = (st.seen || 0) + 1;
    saveStudio(studio);
  }
  D.pattern = p;
  return { title: p.name, html: caseHTML(ctx, p, id) };
}

export function onInput(e) {
  if (!D) return;
  if (e.target.matches("[data-answer], [data-transfer]")) D.answer = e.target.value;
}

function currentItem() {
  return D.step === 2 ? D.items[0] : D.items[1 + (D.step - 3)];
}

export function onClick(e, ctx) {
  if (!D?.pattern) return false;
  const t = e.target;
  const next = () => {
    D.step++;
    D.answer = null;
    D.result = null;
    D.hintsUsed = 0;
    D.peek = false;
    D.misses = 0;
    D.itemHelped = false;
    ctx.rerender();
  };
  if (t.closest("[data-next]")) {
    next();
    return true;
  }
  if (t.closest("[data-peek]")) {
    D.peek = true;
    D.helped = true;
    D.itemHelped = true;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-hint]")) {
    const item = currentItem();
    D.hintsUsed++;
    D.helped = true;
    D.itemHelped = true;
    const first = detect(item.broken).find((f) => f.id === D.id);
    D.result = {
      ok: false,
      hint: true,
      msg:
        D.hintsUsed === 1
          ? `Self-check: ${D.pattern.lesson.check}`
          : D.hintsUsed === 2 && first
            ? `Look at these words: “${first.text}”.`
            : `The rule: ${D.pattern.lesson.rule}`,
    };
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-check-fix]")) {
    const item = currentItem();
    const answer = D.answer ?? item.broken;
    const r = checkRevision(item.broken, answer, D.id);
    let msg;
    if (!r.changed) msg = "Your sentence has not changed. Which words need to change?";
    else if (!r.fixed)
      msg =
        (D.misses || 0) === 0
          ? "That pattern is still in your sentence. Read it aloud once, slowly, and listen for the spot."
          : `That pattern is still in your sentence: “${r.remaining[0].text}”. ${D.pattern.lesson.check}`;
    else if (r.introduced.length)
      msg = `You fixed it, but a new pattern appeared: ${r.introduced[0].name} (“${r.introduced[0].text}”). Reread and adjust.`;
    else if (!r.sameMessage)
      msg =
        "The pattern is gone, but your sentence no longer says the same thing. Keep the meaning and change only what the rule needs.";
    const ok = !msg;
    D.result = { ok, msg: ok ? "The pattern is fixed and your meaning is the same." : msg };
    if (!ok) D.misses = (D.misses || 0) + 1;
    const clean = ok && !D.itemHelped && (D.misses || 0) === 0; // fixed on the first check, with no hint or rule
    if (ok) {
      const st = detectiveState(D.studio, D.id);
      st.done = [...new Set([...(st.done || []), item.id])];
      if (clean) st.fixedFirst++;
      else st.helped++;
      saveStudio(D.studio);
    }
    if (!clean && ok) D.helped = true; // needing help on this pattern means the transfer is not credited as independent
    log("retry", ok, { item: item.id, hints: D.hintsUsed, misses: D.misses || 0 });
    announce(ok ? "Fixed." : "Not yet. Read the feedback below.");
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-check-transfer]")) {
    const text = D.answer || "";
    const a = analyzeResponse(text, {
      keyUse: "Explain",
      stage: "independent",
      modality: "writing",
    });
    const has = detect(text).filter((f) => f.id === D.id);
    let msg;
    let ok = false;
    if (wordCount(text) < D.transfer.minWords)
      msg = `Write at least ${D.transfer.minWords} words so the pattern has room to appear (you have ${wordCount(text)}).`;
    else if (has.length)
      msg = `“${has[0].text}” still shows the pattern. ${D.pattern.lesson.check}`;
    else {
      ok = true;
      msg = `No “${D.pattern.name}” errors found in your ${a.words} words.`;
    }
    D.result = { ok, msg };
    const st = detectiveState(D.studio, D.id);
    (st.transfer ||= []).push({
      id: `x${Date.now().toString(36)}`,
      t: new Date().toISOString(),
      text,
      ok,
      prompt: D.transfer.id,
      independent: !D.helped,
    });
    saveStudio(D.studio);
    log("transfer", ok, { words: a.words, prompt: D.transfer.id });
    announce(ok ? "Case closed." : "Not yet.");
    ctx.rerender();
    return true;
  }
  return false;
}

export function unmount() {
  D = null;
}
