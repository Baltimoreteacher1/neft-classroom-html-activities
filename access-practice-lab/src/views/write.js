// Writing Growth Studio: source-based academic writing from guided to independent, with draft history,
// targeted feedback, revision, evidence collection and a portfolio. Feedback describes what is on the
// page (see lang/analyze.js); it never scores, and it is withheld from "on my own" attempts until the
// learner submits a draft. The learner's first draft is always kept so growth is visible.
import { crumbsHTML } from "../components.js";
import { loadExemplars, loadMission, loadStudioIndex, loadWritingTasks } from "../content.js";
import { recommendTasks } from "../lang/adapt.js";
import { analyzeResponse, compareDrafts } from "../lang/analyze.js";
import { appendEntry, buildProfile, loadLedger, saveLedger, suggestStage } from "../lang/ledger.js";
import { addVersion, choiceEffects, loadStudio, missionState, saveStudio, writingState } from "../lang/studio.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { diffWords, sentences as splitSentences } from "../lang/text.js";
import {
  chooserHeroHTML,
  disclosure,
  feedbackHTML,
  jumpNavHTML,
  purposeBadgeHTML,
  sourceHTML,
  stageLockedHTML,
  stagePickerHTML,
  stepperHTML,
  supportsPanelHTML,
  taskCardHTML,
  trackDisclosures,
} from "../studio-ui.js";
import { ART, BASE, announce, html, icon, raw, wordCount } from "../util.js";

const IGN = raw("data-nsr-ignore");
let S = null;
const chosen = new Map(); // task id → stage picked before the first attempt
const save = () => saveStudio(S.studio);
const FOCUS_OF = {
  "use-source": "evidence",
  "check-number": "evidence",
  develop: "reasoning",
  "link-ideas": "cohesion",
  "vary-openers": "cohesion",
  "precise-words": "precision",
  combine: "sentence",
};
const FORM = {
  cer: "Claim–evidence–reasoning",
  paragraph: "Paragraph",
  essay: "Essay",
  letter: "Letter",
  report: "Report",
  summary: "Summary",
  narrative: "Narrative",
  email: "Email",
};

async function findTask(id, from) {
  if (from?.startsWith("mission:")) {
    const mission = await loadMission(from.slice(8)).catch(() => null);
    const t = mission?.phases.flatMap((p) => p.tasks || []).find((x) => x.task?.id === id)?.task;
    if (t)
      return {
        task: {
          band: "6-8",
          sources: mission.sources
            ? Object.values(mission.sources).filter((s) => s.kind !== "audio")
            : [],
          ...t,
        },
        mission,
      };
  }
  const t = (await loadWritingTasks()).tasks.find((x) => x.id === id);
  return t ? { task: t, mission: null } : null;
}
const optsFor = (task) => ({
  keyUse: task.keyUse,
  modality: "writing",
  sourceText: (task.sources || []).flatMap((s) => [
    ...(s.text || []),
    s.table ? JSON.stringify(s.table.rows) : "",
    s.chart ? JSON.stringify(s.chart.data) : "",
  ]),
  sourceTerms: task.sourceTerms,
  wordBank: task.stages.supported.bank,
  expected: task.expected,
  stage: S.stage,
});

const FORM_META = {
  cer: ["evidence", "Make a claim, support it with evidence, and explain your reasoning."],
  paragraph: ["list", "Build one well-organized paragraph with a clear main idea."],
  essay: ["writing", "Develop your ideas across several paragraphs."],
  letter: ["mail", "Write to a real reader with a clear purpose."],
  report: ["library", "Organize facts from sources for a reader."],
  summary: ["bookmark", "Say the main ideas of a text in your own words."],
  narrative: ["star", "Tell a story with a beginning, a middle and an end."],
  email: ["mail", "Write a clear message that gets something done."],
};
const formIcon = (f) => FORM_META[f]?.[0] || "writing";

async function chooserHTML(ctx, index, entries) {
  const tasks = index.writing.filter((t) => t.band === ctx.band || !t.band);
  const full = new Map((await loadWritingTasks()).tasks.map((t) => [t.id, t]));
  const recs = recommendTasks(tasks, entries, { band: ctx.band, n: 3 });
  const forms = [...new Set(tasks.map((t) => t.form))];
  const card = (t, why) =>
    taskCardHTML({
      href: `${BASE}/write/${t.id}?grades=${ctx.band}`,
      title: t.title,
      ico: formIcon(t.form),
      kind: FORM[t.form],
      time: t.time,
      desc: full.get(t.id)?.scenario,
      meta: [t.keyUse, t.contentArea],
      why,
    });
  const next = recs[0];
  return html`${crumbsHTML([
      ["Lab", `${BASE}/?grades=${ctx.band}`],
      ["Writing Studio", null],
    ])}
    <div class="d-writing">
    ${chooserHeroHTML({
      domain: "d-writing",
      eyebrow: `Grades ${ctx.band.replace("-", "–")} · ${tasks.length} writing tasks`,
      title: "Writing Studio",
      lead: "Read sources, collect evidence, write, get specific feedback, and revise. Your first draft is kept so you can see how you grew.",
      art: `${ART}/domain-writing.svg`,
      loop: ["Read", "Plan", "Write", "Feedback", "Revise"],
      cta: html`<div class="hero-actions">${next ? html`<a class="btn btn-primary btn-big btn-next" href="${BASE}/write/${next.task.id}?grades=${ctx.band}"><span class="btn-kicker">Try next</span><span class="next-title">${next.task.title}</span>${icon("arrow-right")}</a>` : ""}<a class="btn" href="${BASE}/write?tab=portfolio&grades=${ctx.band}">${icon("bookmark")} My writing portfolio</a></div>`,
    })}
    ${
      tasks.length
        ? html`${jumpNavHTML(forms.map((f) => [`wrt-${f}`, FORM[f]]), "Jump to a kind of writing task")}
          ${
            recs.length
              ? html`<section class="task-group is-next" aria-labelledby="wrt-next-h">
                  <header><h2 id="wrt-next-h">${icon("sparkle")} Try next</h2><p class="fine">Picked from the evidence you have saved on this device.</p></header>
                  <div class="task-grid">${recs.map((r) => card(r.task, r.why))}</div>
                </section>`
              : ""
          }
          ${forms.map(
            (f) =>
              html`<section class="task-group" id="wrt-${f}" aria-labelledby="wrt-${f}-h">
                <header><h2 id="wrt-${f}-h">${icon(formIcon(f))} ${FORM[f]}</h2><p class="fine">${FORM_META[f]?.[1] || ""}</p></header>
                <div class="task-grid">${tasks.filter((t) => t.form === f).map((t) => card(t))}</div>
              </section>`,
          )}`
        : html`<section class="panel empty-state"><img src="${ART}/empty.svg" alt="" width="480" height="300" /><h2>No writing tasks for this grade band yet</h2><p>Switch grade band from the menu, or open the quick Writing practice room.</p><a class="btn" href="${BASE}/Writing/A?grades=${ctx.band}">Writing practice room</a></section>`
    }
    <p class="no-print"><a class="btn" href="${BASE}/printables/studio-writing" target="_blank" rel="noopener">${icon("print")} Print writing task cards</a></p>
    </div>
    <p class="disclaimer">
      Classroom writing practice. The Language Coach describes what is on the page — it does not
      judge whether ideas are correct, and it is not a WIDA score.
    </p>`;
}

function portfolioHTML(ctx, tasks) {
  const rows = Object.entries(S.studio.writing)
    .filter(([, w]) => w.versions.length)
    .map(([id, w]) => ({ id, w, task: tasks.find((t) => t.id === id) }))
    .filter((r) => r.task);
  const picks = new Set(S.studio.portfolio.picks.map((p) => p.id));
  const startedWith = (w) => (w.stage === "independent" ? "on my own" : w.stage === "supported" ? "with a word bank" : "with frames");
  return html`${crumbsHTML([
      ["Lab", `${BASE}/?grades=${ctx.band}`],
      ["Writing Studio", `${BASE}/write?grades=${ctx.band}`],
      ["Portfolio", null],
    ])}
    <section class="practice-portfolio studio-view d-writing">
      <header class="portfolio-head">
        <div>
          <p class="eyebrow">${icon("bookmark")} Writing Studio</p>
          <h1 tabindex="-1">My writing portfolio</h1>
          <p class="lead">Practice work and how it changed. This is a record of practice, not a proficiency score. Audio is not included.</p>
        </div>
        <div class="row-actions no-print"><button type="button" class="btn btn-primary" data-print>${icon("print")} Print my portfolio</button><a class="btn" href="${BASE}/write?grades=${ctx.band}">${icon("writing")} Write something new</a></div>
      </header>
      ${
        rows.length
          ? rows.map(({ id, w, task }) => {
              const first = w.versions[0];
              const last = w.versions.at(-1);
              const growth = first.id !== last.id ? compareDrafts(first.text, last.text, { ...optsFor(task), stage: "supported" }) : null;
              return html`<article class="portfolio-entry card">
                <header class="entry-head">
                  <div><h2>${task.title}</h2>
                    <p class="entry-meta"><span class="tag">${FORM[task.form]}</span><span class="tag">${task.keyUse}</span><span class="tag">${w.versions.length} version${w.versions.length === 1 ? "" : "s"}</span>${w.stage ? html`<span class="tag">Started ${startedWith(w)}</span>` : ""}</p></div>
                  <label class="pick-toggle no-print"><input type="checkbox" data-pick="${id}" ${picks.has(id) ? raw("checked") : ""} ${IGN} /> Show in my best-work list</label>
                </header>
                <div class="entry-drafts ${growth ? "has-two" : ""}">
                  <section><h3>First draft</h3><p class="portfolio-response">${first.text}</p></section>
                  ${growth ? html`<section><h3>Latest version</h3><p class="portfolio-response">${last.text}</p></section>` : ""}
                </div>
                ${growth && (growth.changes.length || growth.gainedMoves.length) ? html`<section class="entry-changes"><h3>${icon("growth")} What changed</h3><ul>${growth.changes.map((c) => html`<li>${c.label}: ${c.from} → ${c.to}</li>`)}${growth.gainedMoves.map((m) => html`<li>Now ${m.toLowerCase()}</li>`)}</ul></section>` : ""}
                ${w.reflection ? html`<section class="entry-reflection"><h3>What I improved and why</h3><p class="portfolio-response">${w.reflection}</p></section>` : ""}
              </article>`;
            })
          : html`<section class="panel empty-state"><img src="${ART}/empty.svg" alt="" width="480" height="300" /><h2>Nothing in your portfolio yet</h2><p>Your writing will appear here after you save a draft in the Writing Studio.</p><a class="btn btn-primary" href="${BASE}/write?grades=${ctx.band}">Choose a writing task</a></section>`
      }
    </section>`;
}

function sourcesHTML(task, state) {
  const sources = task.sources || [];
  const ev = state.evidence || [];
  return html`<section class="panel sources" id="wrt-sources" aria-label="Sources">
    <div class="panel-head"><h3>${icon("reading")} Sources</h3><a class="ghost small jump" href="#wrt-write">Jump to my writing ${icon("arrow-right")}</a></div>
    ${sources.map((src, i) =>
      src.kind === "passage" || src.kind === "text"
        ? html`<section class="source">
            <h4 class="source-title">${icon("reading")} ${src.title}</h4>
            <div class="source-text">${(src.text || []).map((p, pi) => html`<p>${splitSentences(p).map((s, si) => html`<button type="button" class="ev-sent ${ev.some((e) => e.text === s.text) ? "is-picked" : ""}" data-pick-evidence="${i}:${pi}:${si}" aria-pressed="${ev.some((e) => e.text === s.text)}">${s.text}</button>${" "}`)}</p>`)}</div>
            <button type="button" class="ghost small" data-read-source="${i}">${icon("volume")} Read aloud</button>
          </section>`
        : sourceHTML(src, { id: String(i) }),
    )}
    <p class="fine tip">${icon("pin")}<span>Press Enter or tap a sentence to add it to your evidence notebook.</span></p>
    ${
      ev.length
        ? html`<div class="evidence-notebook"><h4>${icon("evidence")} My evidence notebook</h4>
            <ul>${ev.map((e, i) => html`<li><span>“${e.text}”</span><button type="button" class="ghost small" data-drop-evidence="${i}" aria-label="Remove from notebook">${icon("x")}</button></li>`)}</ul></div>`
        : ""
    }
  </section>`;
}

function supportsHTML(task) {
  if (S.stage === "independent")
    return html`<p class="own-note">${icon("user")}<span>You chose to write on your own. Sources and your notes are available; frames, word bank and model are closed.</span></p>`;
  return supportsPanelHTML(task, S.stage, {
    title: "Writing starters",
    modelBody: { summary: "See a model response", body: html`<p class="portfolio-response">${task.stages.guided.model}</p>` },
  });
}

function versionsHTML(state) {
  if (state.versions.length < 2) return "";
  const first = state.versions[0];
  const last = state.versions.at(-1);
  const d = diffWords(first.text, last.text);
  return disclosure(
    "wrt-history",
    html`${icon("replay")} Compare my first draft and now`,
    html`<p class="diff" aria-label="Changes from first draft to now">${d.map((x) => (x.op === "same" ? html`${x.text} ` : x.op === "add" ? html`<ins>${x.text}</ins> ` : html`<del>${x.text}</del> `))}</p>
      <p class="fine"><ins>Added</ins> · <del>Removed</del> · ${state.versions.length} versions saved</p>`,
    { open: true, cls: "draft-history" },
  );
}

function revisionPromptsHTML(task, a) {
  const top = a.nextMoves[0];
  const focus = top ? FOCUS_OF[top.id] || (top.patternId ? "sentence" : "reasoning") : null;
  const picks = (task.revisionPrompts || []).filter((p) => p.focus === focus).slice(0, 2);
  return picks.length
    ? html`<div class="revise-prompts"><h4>${icon("retry")} Revise with this question</h4><ul>${picks.map((p) => html`<li>${p.prompt}</li>`)}</ul></div>`
    : "";
}

async function exemplarsHTML(task) {
  const all = (await loadExemplars().catch(() => [])).filter((x) => x.taskId === task.id);
  if (!all.length) return "";
  const order = ["early", "building", "strong"];
  return disclosure(
    "wrt-exemplars",
    html`${icon("library")} Compare with sample responses (practice anchors)`,
    html`<p class="fine">Three sample responses written for practice. They are not WIDA levels. Notice what each one does; then reread your own.</p>
      <div class="exemplar-grid">${order
        .map((b) => all.find((x) => x.practiceBand === b))
        .filter(Boolean)
        .map(
          (x) => html`<article class="card"><h4><span class="mode-pill">${x.practiceBand[0].toUpperCase() + x.practiceBand.slice(1)}</span></h4>
            <p class="portfolio-response">${x.response}</p>
            <ul>${x.annotations.map((a) => html`<li>“${a.quote}” — <em>${a.dimension}</em>: ${a.note}</li>`)}</ul>
            <p class="fine">${x.whyThisBand} <strong>Next step:</strong> ${x.nextStep}</p></article>`,
        )}</div>`,
    { cls: "panel" },
  );
}

function stepsFor(state, text, analyzed) {
  return [
    { label: "Read", done: (state.evidence || []).length > 0 },
    { label: "Plan", done: Object.values(state.organizer).some(Boolean) },
    { label: "Write", done: wordCount(text) >= 4 },
    { label: "Feedback", done: Boolean(analyzed) },
    { label: "Finish", done: Boolean(state.finishedAt) },
  ];
}

export async function render(ctx) {
  const index = await loadStudioIndex();
  S = { ...(S || {}), band: ctx.band, studio: loadStudio(), ledger: loadLedger() };
  const q = new URLSearchParams(location.search);
  const id = ctx.route.id;
  if (!id && q.get("tab") === "portfolio")
    return {
      title: "Writing portfolio",
      html: portfolioHTML(ctx, (await loadWritingTasks()).tasks),
    };
  if (!id) return { title: "Writing Studio", html: await chooserHTML(ctx, index, S.ledger.entries) };
  const found = await findTask(id, q.get("from"));
  if (!found)
    return {
      title: "Not found",
      html: html`<section class="panel empty-state"><img src="${ART}/empty.svg" alt="" width="480" height="300" /><h1 tabindex="-1">We could not find that task.</h1><a class="btn" href="${BASE}/write?grades=${ctx.band}">Writing Studio</a></section>`,
    };
  const { task, mission } = found;
  S.task = task;
  S.mission = mission;
  S.fx = choiceEffects(task, mission, S.studio);
  S.state = writingState(S.studio, task.id);
  S.state.evidence ||= [];
  S.profile = buildProfile(S.ledger.entries, { band: ctx.band });
  const requestedStage = q.get("suggestedStage");
  const missionStage =
    mission &&
    q.get("from")?.startsWith("mission:") &&
    ["guided", "supported", "independent"].includes(requestedStage)
      ? requestedStage
      : "";
  const baseSuggestion = suggestStage(S.profile, task.keyUse);
  const sug = missionStage
    ? {
        stage: missionStage,
        reason:
          "Your mission suggested this starting support from your earlier practice. You can choose a different setting.",
      }
    : baseSuggestion;
  S.stage = S.state.stage || chosen.get(task.id) || sug.stage;
  const text = S.state.draft ?? S.state.versions.at(-1)?.text ?? "";
  S.state.notes ||= "";
  const analyzed = S.state.analyzedText === text && text;
  const a = analyzed ? analyzeResponse(text, optsFor(task)) : null;
  const goalMin = task.expected.minWords;
  return {
    title: task.title,
    html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${ctx.band}`], mission ? [mission.title, `${BASE}/missions/${mission.id}?grades=${ctx.band}`] : ["Writing Studio", `${BASE}/write?grades=${ctx.band}`], [task.title, null]])}
      <article class="activity studio-view write-studio d-writing">
        <header class="act-head">
          <div class="act-bar">
            <p class="act-context">${icon("writing")} Writing Studio · ${FORM[task.form]} · ${task.keyUse}</p>
            <p class="act-step">${icon("clock")} ${task.time} · ${task.contentArea}</p>
          </div>
          <h1 tabindex="-1">${task.title}</h1>
          ${purposeBadgeHTML(S.stage)}
          <div class="task-brief">
            <div><span class="brief-label">${icon("info")} Situation</span><p>${task.scenario}</p></div>
            <div class="brief-task"><span class="brief-label">${icon("flag")} Your task</span><p>${task.prompt}${S.fx.promptAdd.map((x) => html` <span class="path-add">${x}</span>`)}</p>
              <button type="button" class="ghost small" data-say="${task.prompt}">${icon("volume")} Hear the task</button></div>
          </div>
        </header>
        ${stepperHTML(stepsFor(S.state, text, analyzed), { label: "Writing steps" })}
        ${S.state.versions.length ? stageLockedHTML(S.stage) : stagePickerHTML(S.stage, sug)}
        <div class="studio-cols is-write">
          <div class="studio-col">${sourcesHTML(task, S.state)}
            <section class="panel organizer" id="wrt-plan">
              <h3><span class="step-badge">2</span> Plan</h3>
              <div class="slot-grid">
                ${task.organizer.map((slot, i) => html`<label class="field slot"><span><b class="slot-n">${i + 1}</b>${slot.label}</span><textarea rows="2" data-org="${slot.id}" ${S.stage === "independent" ? "" : html`placeholder="${S.fx.hints[slot.id] || slot.hint}"`} ${IGN}>${S.state.organizer[slot.id] || ""}</textarea></label>`)}
              </div>
            </section>
          </div>
          <div class="studio-col">

            <section class="panel editor-panel" id="wrt-write">
              <h3><span class="step-badge">3</span> Write</h3>
              <label class="field paper"><span class="paper-head">Your writing <span class="fine">Saved on this device as you type</span></span><textarea id="wrt-draft" rows="${task.expected.paragraphs > 1 ? 16 : 11}" spellcheck="false" data-draft ${IGN}>
${text}</textarea></label>
              <p class="meter"><span class="meter-bar"><span style="width:${Math.min(100, Math.round((wordCount(text) / goalMin) * 100))}%"></span></span><span data-meter>${wordCount(text)} words · usually about ${goalMin}–${task.expected.maxWords}</span></p>
              <div class="row-actions">
                <button type="button" class="btn btn-primary" data-feedback ${wordCount(text) < 4 ? raw("disabled") : ""}>${icon("sparkle")} Get feedback</button>
                <button type="button" class="ghost" data-read-draft>${icon("volume")} Read my writing to me</button>
              </div>
            </section>
            ${supportsHTML(task)}
          </div>
        </div>
        ${
          a
            ? html`<section class="panel" id="wrt-feedback">
                  <h3><span class="step-badge">4</span> What your writing shows</h3>
                  ${feedbackHTML(a, text, { patternHref: (pid) => `${BASE}/detective/${pid}?grades=${ctx.band}` })}${revisionPromptsHTML(task, a)}${S.fx.revise.length ? html`<div class="revise-prompts"><h4>${icon("mission")} From your mission choice</h4><ul>${S.fx.revise.map((q) => html`<li>${q}</li>`)}</ul></div>` : ""}${versionsHTML(S.state)}
                  <p class="fine revise-line">${icon("retry")}<span>Now revise: change your draft, then press <strong>Get feedback</strong> again to see what changed.</span><button type="button" class="btn small" data-revise>Back to my draft</button></p>
                </section>
                <section class="panel" id="wrt-finish">
                  <h3><span class="step-badge">5</span> Finish</h3>
                  <label class="field"><span>What did you improve, and why?</span><textarea rows="3" data-reflection ${IGN}>${S.state.reflection}</textarea></label>
                  <div class="row-actions"><button type="button" class="btn btn-primary" data-finish ${wordCount(S.state.reflection) >= 5 ? "" : raw("disabled")}>${icon("bookmark")} Save to my portfolio</button></div>
                  ${S.state.finishedAt ? html`<p class="saved-note">${icon("check")} <span>Saved to your portfolio. <a href="${BASE}/write?tab=portfolio&grades=${ctx.band}">See my portfolio</a></span></p>` : ""}
                </section>
                ${S.state.finishedAt ? await exemplarsHTML(task) : ""}`
            : ""
        }
      </article>
      ${mission ? html`<p><a class="btn" href="${BASE}/missions/${mission.id}?grades=${ctx.band}">${icon("arrow-left")} Back to the mission</a></p>` : ""}`,
  };
}


function lockStage() {
  if (S.state.stage) return;
  S.state.stage = S.stage;
  S.state.used = { frames: S.stage === "guided", bank: S.stage !== "independent" };
}

function feedback(ctx) {
  const text = S.state.draft ?? S.state.versions.at(-1)?.text ?? "";
  if (S.state.analyzedText === text && text) {
    announce("Nothing has changed since your last feedback. Revise your writing, then ask again.");
    return;
  }
  lockStage();
  S.state.attemptId ||= `a${Date.now().toString(36)}`;
  const first = !S.ledger.entries.some(
    (x) => x.task === S.task.id && x.src === "writing" && x.kind === "first" && x.attempt === S.state.attemptId,
  );
  addVersion(S.state, text, first ? "draft" : "revision");
  S.state.analyzedText = text;
  S.state.finishedAt = "";
  const a = analyzeResponse(text, optsFor(S.task));
  const supports = {
    frames: S.state.used.frames,
    bank: S.state.used.bank,
    model: Boolean(S.state.used.model),
    coach: !first,
  };
  appendEntry(S.ledger, {
    src: "writing",
    task: S.task.id,
    band: S.band,
    domain: "Writing",
    use: S.task.keyUse,
    stage: S.stage,
    kind: first ? "first" : "revision",
    attempt: S.state.attemptId,
    supports,
    m: a.ledger,
  });
  saveLedger(S.ledger);
  save();
  announce("Feedback ready. Read your next moves, then revise.");
  ctx.rerender();
}

export function onInput(e) {
  if (!S?.task) return;
  const t = e.target;
  if (t.matches("[data-draft]")) {
    S.state.draft = t.value;
    const n = wordCount(t.value);
    const meter = document.querySelector("[data-meter]");
    if (meter)
      meter.textContent = `${n} words · usually about ${S.task.expected.minWords}–${S.task.expected.maxWords}`;
    const bar = document.querySelector(".meter-bar > span");
    if (bar)
      bar.style.width = `${Math.min(100, Math.round((n / S.task.expected.minWords) * 100))}%`;
    const b = document.querySelector("[data-feedback]");
    if (b) b.disabled = n < 4;
    save();
  } else if (t.matches("[data-org]")) {
    S.state.organizer[t.dataset.org] = t.value;
    save();
  } else if (t.matches("[data-reflection]")) {
    S.state.reflection = t.value;
    const b = document.querySelector("[data-finish]");
    if (b) b.disabled = wordCount(t.value) < 5;
    save();
  }
}

export function onChange(e, ctx) {
  if (!S?.task) return;
  const t = e.target;
  if (t.matches("[data-stage]")) {
    chosen.set(S.task.id, t.value);
    S.stage = t.value;
    ctx.rerender();
  } else if (t.matches("[data-pick]")) {
    const picks = S.studio.portfolio.picks;
    const i = picks.findIndex((p) => p.id === t.dataset.pick);
    if (t.checked && i < 0) picks.push({ id: t.dataset.pick, t: new Date().toISOString() });
    if (!t.checked && i >= 0) picks.splice(i, 1);
    save();
  }
}

export function onClick(e, ctx) {
  if (!S) return false;
  const t = e.target;
  if (t.closest("[data-print]")) {
    window.print();
    return true;
  }
  if (!S.task) return false;
  if (t.closest("[data-feedback]")) {
    feedback(ctx);
    return true;
  }
  const pickEv = t.closest("[data-pick-evidence]");
  if (pickEv) {
    const [si, pi, sj] = pickEv.dataset.pickEvidence.split(":").map(Number);
    const sent = splitSentences(S.task.sources[si].text[pi])[sj];
    const i = S.state.evidence.findIndex((x) => x.text === sent.text);
    if (i >= 0) S.state.evidence.splice(i, 1);
    else S.state.evidence.push({ src: S.task.sources[si].title, text: sent.text });
    announce(i >= 0 ? "Removed from your evidence notebook." : "Added to your evidence notebook.");
    save();
    ctx.rerender();
    return true;
  }
  const drop = t.closest("[data-drop-evidence]");
  if (drop) {
    S.state.evidence.splice(Number(drop.dataset.dropEvidence), 1);
    save();
    ctx.rerender();
    return true;
  }
  const read = t.closest("[data-read-source]");
  if (read) {
    speak(S.task.sources[Number(read.dataset.readSource)].text, { rate: ctx.prefs.rate });
    return true;
  }
  if (t.closest("[data-revise]")) {
    const d = document.querySelector("[data-draft]");
    d?.scrollIntoView({ block: "center" });
    d?.focus();
    return true;
  }
  if (t.closest("[data-read-draft]")) {
    speak(S.state.draft || S.state.versions.at(-1)?.text || "Write something first.", {
      rate: ctx.prefs.rate,
    });
    return true;
  }
  if (t.closest("[data-finish]")) {
    addVersion(S.state, S.state.draft ?? "", "final");
    S.state.finishedAt = new Date().toISOString();
    if (S.mission) {
      const ms = missionState(S.studio, S.mission.id);
      ms.tasks[S.task.id] = { done: true, t: S.state.finishedAt };
    }
    save();
    announce("Saved to your portfolio.");
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-new-attempt]")) {
    Object.assign(S.state, {
      stage: "",
      organizer: {},
      draft: "",
      analyzedText: "",
      attemptId: "",
      reflection: "",
      finishedAt: "",
      used: {},
    });
    S.state.versions = S.state.versions.length ? [{ ...S.state.versions[0] }] : [];
    S.state.versions = [];
    save();
    ctx.rerender();
    return true;
  }
  return false;
}

export function mount(root) {
  trackDisclosures(root);
  for (const d of root.querySelectorAll("details[data-model]"))
    d.addEventListener("toggle", () => {
      if (d.open && S?.state) {
        S.state.used.model = true;
        save();
      }
    });
}
export function unmount() {
  stopSpeech();
}
