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
import { feedbackHTML, sourceHTML, stagePickerHTML, vocabListHTML, bridgesHTML, purposeBadgeHTML } from "../studio-ui.js";
import { BASE, announce, html, raw, wordCount } from "../util.js";

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

function chooserHTML(ctx, index, entries) {
  const tasks = index.writing.filter((t) => t.band === ctx.band || !t.band);
  const recs = recommendTasks(tasks, entries, { band: ctx.band, n: 3 });
  const forms = [...new Set(tasks.map((t) => t.form))];
  const card = (t, why) =>
    html`<a class="card task-card" href="${BASE}/write/${t.id}?grades=${ctx.band}"
      ><strong>${t.title}</strong
      ><span class="fine">${FORM[t.form]} · ${t.keyUse} · ${t.contentArea} · ${t.time}</span
      >${why ? html`<span class="fine">${why}</span>` : ""}</a
    >`;
  return html`${crumbsHTML([
      ["Lab", `${BASE}/?grades=${ctx.band}`],
      ["Writing Studio", null],
    ])}
    <section class="room-hero" style="--room:#2a6f97">
      <div>
        <span class="badge">Writing Growth Studio</span>
        <h1 tabindex="-1"><svg aria-hidden="true"><use href="${BASE}/pictures/lab-icons.svg#writing"></use></svg> Writing Studio</h1>
        <p class="lead">
          Read sources, collect evidence, write, get specific feedback, and revise. Your first draft
          is kept so you can see how you grew.
        </p>
        <a class="btn" href="${BASE}/write?tab=portfolio&grades=${ctx.band}"
          >My writing portfolio</a
        >
      </div>
    </section>
    ${
      recs.length
        ? html`<section class="panel">
            <h2>Try next</h2>
            <div class="task-grid">${recs.map((r) => card(r.task, r.why))}</div>
          </section>`
        : ""
    }
    ${forms.map(
      (f) =>
        html`<section class="panel">
          <h2>${FORM[f]}</h2>
          <div class="task-grid">${tasks.filter((t) => t.form === f).map((t) => card(t))}</div>
        </section>`,
    )}
    <p class="no-print"><a class="btn" href="${BASE}/printables/studio-writing" target="_blank" rel="noopener">Print writing task cards</a></p>
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
  return html`${crumbsHTML([
      ["Lab", `${BASE}/?grades=${ctx.band}`],
      ["Writing Studio", `${BASE}/write?grades=${ctx.band}`],
      ["Portfolio", null],
    ])}
    <section class="practice-portfolio">
      <div class="row-actions no-print">
        <button type="button" class="btn btn-primary" data-print>Print my portfolio</button>
      </div>
      <h1 tabindex="-1">My writing portfolio</h1>
      <p>
        Practice work and how it changed. This is a record of practice, not a proficiency score.
        Audio is not included.
      </p>
      ${
        rows.length
          ? rows.map(({ id, w, task }) => {
              const first = w.versions[0];
              const last = w.versions.at(-1);
              const growth =
                first.id !== last.id
                  ? compareDrafts(first.text, last.text, { ...optsFor(task), stage: "supported" })
                  : null;
              return html`<article class="portfolio-entry">
                <h2>${task.title}</h2>
                <p>
                  ${FORM[task.form]} · ${task.keyUse} · ${w.versions.length}
                  version${w.versions.length === 1 ? "" : "s"}${w.stage ? ` · started ${w.stage === "independent" ? "on my own" : w.stage === "supported" ? "with a word bank" : "with frames"}` : ""}
                </p>
                <label class="no-print"
                  ><input
                    type="checkbox"
                    data-pick="${id}"
                    ${picks.has(id) ? raw("checked") : ""}
                    ${IGN}
                  />
                  Show in my best-work list</label
                >
                <h3>First draft</h3>
                <p class="portfolio-response">${first.text}</p>
                ${
                  growth
                    ? html`<h3>Latest version</h3>
                        <p class="portfolio-response">${last.text}</p>
                        <h3>What changed</h3>
                        <ul>
                          ${growth.changes.map((c) => html`<li>${c.label}: ${c.from} → ${c.to}</li>`)}${growth.gainedMoves.map((m) => html`<li>Now ${m.toLowerCase()}</li>`)}
                        </ul>`
                    : ""
                }
                ${
                  w.reflection
                    ? html`<h3>What I improved and why</h3>
                        <p class="portfolio-response">${w.reflection}</p>`
                    : ""
                }
              </article>`;
            })
          : html`<p>Your writing will appear here after you save a draft in the Writing Studio.</p>`
      }
    </section>`;
}

function sourcesHTML(task, state) {
  const sources = task.sources || [];
  const ev = state.evidence || [];
  return html`<section class="panel sources">
    <h3>Sources</h3>
    ${sources.map((src, i) =>
      src.kind === "passage" || src.kind === "text"
        ? html`<section class="source">
            <h4>${src.title}</h4>
            ${(src.text || []).map((p, pi) => html`<p>${splitSentences(p).map((s, si) => html`<button type="button" class="ev-sent ${ev.some((e) => e.text === s.text) ? "is-picked" : ""}" data-pick-evidence="${i}:${pi}:${si}" aria-pressed="${ev.some((e) => e.text === s.text)}">${s.text}</button>${" "}`)}</p>`)}<button
              type="button"
              class="ghost small"
              data-read-source="${i}"
            >
              🔊 Read aloud
            </button>
          </section>`
        : sourceHTML(src, { id: String(i) }),
    )}
    <p class="fine">Press Enter or tap a sentence to add it to your evidence notebook.</p>
    ${
      ev.length
        ? html`<div class="evidence-notebook">
            <h4>My evidence notebook</h4>
            <ul>
              ${ev.map((e, i) => html`<li>“${e.text}” <button type="button" class="ghost small" data-drop-evidence="${i}" aria-label="Remove from notebook">✕</button></li>`)}
            </ul>
          </div>`
        : ""
    }
  </section>`;
}

function stageSupportHTML(task) {
  if (S.stage === "independent")
    return html`<p class="fine">
      You chose to write on your own. Sources and your notes are available; frames, word bank and
      model are closed.
    </p>`;
  return html`<details class="writing-starters" open>
    <summary>Writing starters</summary>
    ${
      S.stage === "guided"
        ? html`<ul class="frames inline">
            ${task.stages.guided.frames.map((f) => html`<li>${f}</li>`)}
          </ul>`
        : ""
    }
    <ul class="wordbank">
      ${task.stages.supported.bank.map((w) => html`<li>${w}</li>`)}
    </ul>
    ${vocabListHTML(task.vocab)}
    ${bridgesHTML(task)}
    ${
      S.stage === "guided"
        ? html`<details data-model>
            <summary>See a model response</summary>
            <p class="fine">Opening the model is saved as extra support.</p>
            <p class="portfolio-response">${task.stages.guided.model}</p>
          </details>`
        : ""
    }
  </details>`;
}

function versionsHTML(state) {
  if (state.versions.length < 2) return "";
  const first = state.versions[0];
  const last = state.versions.at(-1);
  const d = diffWords(first.text, last.text);
  return html`<details class="draft-history" open>
    <summary>Compare my first draft and now</summary>
    <p class="diff" aria-label="Changes from first draft to now">
      ${d.map((x) => (x.op === "same" ? html`${x.text} ` : x.op === "add" ? html`<ins>${x.text}</ins> ` : html`<del>${x.text}</del> `))}
    </p>
    <p class="fine">
      <ins>Added</ins> · <del>Removed</del> · ${state.versions.length} versions saved
    </p>
  </details>`;
}

function revisionPromptsHTML(task, a) {
  const top = a.nextMoves[0];
  const focus = top ? FOCUS_OF[top.id] || (top.patternId ? "sentence" : "reasoning") : null;
  const picks = (task.revisionPrompts || []).filter((p) => p.focus === focus).slice(0, 2);
  return picks.length
    ? html`<div class="revise-prompts">
        <h4>Revise with this question</h4>
        <ul>
          ${picks.map((p) => html`<li>${p.prompt}</li>`)}
        </ul>
      </div>`
    : "";
}

async function exemplarsHTML(task) {
  const all = (await loadExemplars().catch(() => [])).filter((x) => x.taskId === task.id);
  if (!all.length) return "";
  const order = ["early", "building", "strong"];
  return html`<details class="panel">
    <summary>Compare with sample responses (practice anchors)</summary>
    <p class="fine">
      Three sample responses written for practice. They are not WIDA levels. Notice what each one
      does; then reread your own.
    </p>
    ${order
      .map((b) => all.find((x) => x.practiceBand === b))
      .filter(Boolean)
      .map(
        (x) =>
          html`<article class="card">
            <h4>${x.practiceBand[0].toUpperCase() + x.practiceBand.slice(1)}</h4>
            <p class="portfolio-response">${x.response}</p>
            <ul>
              ${x.annotations.map((a) => html`<li>“${a.quote}” — <em>${a.dimension}</em>: ${a.note}</li>`)}
            </ul>
            <p class="fine">${x.whyThisBand} <strong>Next step:</strong> ${x.nextStep}</p>
          </article>`,
      )}
  </details>`;
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
  if (!id) return { title: "Writing Studio", html: chooserHTML(ctx, index, S.ledger.entries) };
  const found = await findTask(id, q.get("from"));
  if (!found)
    return {
      title: "Not found",
      html: html`<section class="panel">
        <h1>We could not find that task.</h1>
        <a class="btn" href="${BASE}/write?grades=${ctx.band}">Writing Studio</a>
      </section>`,
    };
  const { task, mission } = found;
  S.task = task;
  S.mission = mission;
  S.fx = choiceEffects(task, mission, S.studio);
  S.state = writingState(S.studio, task.id);
  S.state.evidence ||= [];
  S.profile = buildProfile(S.ledger.entries, { band: ctx.band });
  const sug = suggestStage(S.profile, task.keyUse);
  S.stage = S.state.stage || chosen.get(task.id) || sug.stage;
  const text = S.state.draft ?? S.state.versions.at(-1)?.text ?? "";
  S.state.notes ||= "";
  const analyzed = S.state.analyzedText === text && text;
  const a = analyzed ? analyzeResponse(text, optsFor(task)) : null;
  const goalMin = task.expected.minWords;
  return {
    title: task.title,
    html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${ctx.band}`], mission ? [mission.title, `${BASE}/missions/${mission.id}?grades=${ctx.band}`] : ["Writing Studio", `${BASE}/write?grades=${ctx.band}`], [task.title, null]])}
      <article class="activity write-studio" style="--room:#2a6f97">
        <header class="act-head">
          <p class="eyebrow"><svg aria-hidden="true"><use href="${BASE}/pictures/lab-icons.svg#writing"></use></svg> ${FORM[task.form]} · ${task.keyUse} · ${task.contentArea}</p>
          <h1 tabindex="-1">${task.title}</h1>
        ${purposeBadgeHTML(S.stage)}
          <div class="directions">
            <p><strong>Situation:</strong> ${task.scenario}</p>
            <p><strong>Your task:</strong> ${task.prompt}${S.fx.promptAdd.map((x) => html` <span class="path-add">${x}</span>`)}</p>
            <button type="button" class="ghost small" data-say="${task.prompt}">
              🔊 Hear the task
            </button>
          </div>
        </header>
        ${S.state.versions.length ? html`<p class="fine stage-locked">Your help setting is <strong>${S.stage === "guided" ? "frames and words" : S.stage === "supported" ? "word bank" : "on my own"}</strong>. <button type="button" class="ghost small" data-new-attempt>Start a new attempt</button></p>` : stagePickerHTML(S.stage, sug)}
        ${sourcesHTML(task, S.state)}
        <section class="panel organizer">
          <h3>1 · Plan</h3>
          ${task.organizer.map((slot) => html`<label class="field"><span>${slot.label}</span><input type="text" data-org="${slot.id}" value="${S.state.organizer[slot.id] || ""}" ${S.stage === "independent" ? "" : html`placeholder="${S.fx.hints[slot.id] || slot.hint}"`} ${IGN} /></label>`)}
        </section>
        ${stageSupportHTML(task)}
        <section class="panel">
          <h3>2 · Write</h3>
          <label class="field"
            ><span>Your writing</span
            ><textarea
              id="wrt-draft"
              rows="${task.expected.paragraphs > 1 ? 14 : 8}"
              spellcheck="false"
              data-draft
              ${IGN}
            >
${text}</textarea>
          </label>
          <p class="meter">
            <span class="meter-bar"
              ><span
                style="width:${Math.min(100, Math.round((wordCount(text) / goalMin) * 100))}%"
              ></span
            ></span>
            <span data-meter
              >${wordCount(text)} words · usually about ${goalMin}–${task.expected.maxWords}</span
            >
          </p>
          <div class="row-actions">
            <button
              type="button"
              class="btn btn-primary"
              data-feedback
              ${wordCount(text) < 4 ? raw("disabled") : ""}
            >
              Get feedback</button
            ><button type="button" class="ghost" data-read-draft>🔊 Read my writing to me</button>
          </div>
        </section>
        ${
          a
            ? html`<section class="panel">
                  <h3>3 · What your writing shows</h3>
                  ${feedbackHTML(a, text, { patternHref: (pid) => `${BASE}/detective/${pid}?grades=${ctx.band}` })}${revisionPromptsHTML(task, a)}${S.fx.revise.length ? html`<div class="revise-prompts"><h4>From your mission choice</h4><ul>${S.fx.revise.map((q) => html`<li>${q}</li>`)}</ul></div>` : ""}${versionsHTML(S.state)}
                  <p class="fine">
                    Now revise: change your draft, then press <strong>Get feedback</strong> again to
                    see what changed.
                  </p>
                </section>
                <section class="panel">
                  <h3>4 · Finish</h3>
                  <label class="field"
                    ><span>What did you improve, and why?</span
                    ><textarea rows="3" data-reflection ${IGN}>${S.state.reflection}</textarea>
                  </label>
                  <button
                    type="button"
                    class="btn btn-primary"
                    data-finish
                    ${wordCount(S.state.reflection) >= 5 ? "" : raw("disabled")}
                  >
                    Save to my portfolio
                  </button>
                  ${S.state.finishedAt ? html`<p class="saved-note">✓ Saved to your portfolio. <a href="${BASE}/write?tab=portfolio&grades=${ctx.band}">See my portfolio</a></p>` : ""}
                </section>
                ${S.state.finishedAt ? await exemplarsHTML(task) : ""}`
            : ""
        }
      </article>
      ${mission ? html`<p><a class="btn" href="${BASE}/missions/${mission.id}?grades=${ctx.band}">← Back to the mission</a></p>` : ""}`,
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
