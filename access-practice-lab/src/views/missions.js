// Adaptive Mission Engine: connected Listening → Reading → Decision → Speaking → Writing investigations.
// Missions are content (content/missions/*.json). The engine adapts from the evidence ledger, not from a
// level: stretch questions appear only after independent success, supports are recorded as supports, and
// choices change what the learner learns. The evidence board carries facts into the speaking and writing phases.
import { crumbsHTML } from "../components.js";
import { loadMission, loadStudioIndex } from "../content.js";
import { missionSupport, showStretch } from "../lang/adapt.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { loadStudio, missionState, saveStudio } from "../lang/studio.js";
import { compareDrafts } from "../lang/analyze.js";
import { diffWords } from "../lang/text.js";
import { speak, speakDialogue, stop as stopSpeech } from "../speech.js";
import { sourceHTML } from "../studio-ui.js";
import { BASE, announce, html, raw } from "../util.js";

const IGN = raw("data-nsr-ignore");
const COACH = {
  unsupported: "That idea is not stated in the source. Find the sentence that supports an answer.",
  opposite: "That is the opposite of what the source says. Reread for the direction of the change.",
  "true-not-asked":
    "That might be true, but it does not answer this question. Check the question word again.",
  overgeneralized: "That goes further than the source. Watch for words like all, always, never.",
  "detail-trap": "That detail is in the source, but it is not what the question asks about.",
  partial: "That is only part of the answer. What else does the source say?",
};
let M = null;
const save = () => saveStudio(M.studio);

function hubHTML(ctx, index, studio) {
  const list = index.missions.filter((m) => m.band === ctx.band || m.band === "Both" || !m.band);
  const prog = (m) => {
    const s = studio.missions[m.id];
    return s ? (s.done ? "Complete" : s.started ? "In progress" : "") : "";
  };
  return html`${crumbsHTML([
      ["Lab", `${BASE}/?grades=${ctx.band}`],
      ["Academic Missions", null],
    ])}
    <section class="room-hero">
      <div>
        <span class="badge">Academic Missions</span>
        <h1 tabindex="-1">🚀 Academic Missions</h1>
        <p class="lead">
          Investigations that use all four skills. You listen, read, make a decision that changes
          what you learn, speak, and write — with your evidence in hand.
        </p>
      </div>
    </section>
    <section class="panel">
      <div class="task-grid">
        ${list.map((m) => html`<a class="card task-card" style="--room:${m.theme}" href="${BASE}/missions/${m.id}?grades=${ctx.band}"><strong>${m.icon} ${m.title}</strong><span class="fine">${m.subtitle} · ${m.contentArea} · ${m.minutes} min</span><span class="fine">${m.summary}</span>${prog(m) ? html`<span class="badge">${prog(m)}</span>` : ""}</a>`)}
      </div>
    </section>
    <p class="disclaimer">
      Missions are classroom practice, not WIDA assessment simulations. What you do alone and what
      you do with help are recorded separately.
    </p>`;
}

const phaseTasks = (phase) =>
  (phase.tasks || []).filter((t) => t.kind !== "speak" && t.kind !== "write");
const isDone = (ms, phase) =>
  phase.skill === "Decision"
    ? Boolean(ms.decisions[phase.id])
    : (phase.tasks || []).every((t) => taskDone(ms, t));
function taskDone(ms, t) {
  if (t.kind === "question") return ms.answers[t.id]?.done || false;
  if (t.kind === "evidence") return Boolean(ms.answers[t.id]?.done);
  return Boolean(ms.tasks[t.task?.id || t.taskRef]?.done);
}

function visibleTasks(phase, ledger) {
  return (phase.tasks || []).filter(
    (t) => t.tier !== "stretch" || showStretch(ledger.entries, t.skill),
  );
}

function questionHTML(t, ms) {
  const a = ms.answers[t.id] || {};
  return html`<fieldset class="mission-q">
    <legend>${t.q}${t.tier === "stretch" ? html` <span class="badge">Stretch</span>` : ""}</legend>
    ${t.options.map((o) => html`<label class="choice-card ${a.done && o.id === t.answer ? "is-right" : a.last === o.id && !a.done ? "is-miss" : ""}"><input type="radio" name="q-${t.id}" value="${o.id}" data-q="${t.id}" ${a.pick === o.id ? raw("checked") : ""} ${a.done ? raw("disabled") : ""} ${IGN} /><span>${o.text}${a.done && o.id === t.answer ? html` <span class="visually-hidden">(correct answer)</span>` : a.last === o.id && !a.done ? html` <span class="visually-hidden">(not correct)</span>` : ""}</span></label>`)}
    ${!a.done ? html`<button type="button" class="btn btn-primary" data-check-q="${t.id}" ${a.pick ? "" : raw("disabled")}>Check</button>` : ""}
    ${a.msg ? html`<p class="feedback ${a.done ? "is-right" : "is-hint"}" role="status">${a.msg}</p>` : ""}
  </fieldset>`;
}

function evidenceHTML(t, ms) {
  const a = ms.answers[t.id] || {};
  const picked = new Set(a.picks || []);
  return html`<fieldset class="mission-q">
    <legend>${t.q}</legend>
    <p class="fine">
      Choose every statement that supports the idea. Statements you choose correctly go on your
      evidence board.
    </p>
    ${t.pool.map((e) => html`<label class="choice-card"><input type="checkbox" value="${e.id}" data-ev="${t.id}" ${picked.has(e.id) ? raw("checked") : ""} ${a.done ? raw("disabled") : ""} ${IGN} /><span>${e.text}</span></label>`)}
    ${!a.done ? html`<button type="button" class="btn btn-primary" data-check-ev="${t.id}" ${picked.size ? "" : raw("disabled")}>Check my evidence</button>` : ""}
    ${a.msg ? html`<p class="feedback ${a.done ? "is-right" : "is-hint"}" role="status">${a.msg}</p>` : ""}
  </fieldset>`;
}

function studioTaskHTML(t, ms, mission, band) {
  const task = t.task;
  const done = taskDone(ms, t);
  const route = t.kind === "speak" ? "speak" : "write";
  return html`<div class="card studio-task">
    <h4>${t.kind === "speak" ? "🎤" : "✍️"} ${task.title}</h4>
    <p>${task.scenario}</p>
    <p><strong>${task.prompt}</strong></p>
    <a
      class="btn ${done ? "" : "btn-primary"}"
      href="${BASE}/${route}/${task.id}?from=mission:${mission.id}&grades=${band}"
      >${done ? "Open again" : t.kind === "speak" ? "Start speaking" : "Start writing"}</a
    >${done ? html` <span class="badge">✓ Done</span>` : ""}
  </div>`;
}

function decisionHTML(phase, ms) {
  const d = phase.decision;
  const chosen = ms.decisions[phase.id];
  return html`<fieldset class="mission-q">
    <legend>${d.q}</legend>
    ${d.options.map((o) => html`<label class="choice-card ${chosen === o.id ? "is-right" : ""}"><input type="radio" name="d-${phase.id}" value="${o.id}" data-decision="${phase.id}" ${chosen === o.id ? raw("checked") : ""} ${chosen ? raw("disabled") : ""} ${IGN} /><span>${o.text}</span></label>`)}
    ${chosen ? html`<p class="feedback is-right" role="status"><strong>What happens:</strong> ${d.options.find((o) => o.id === chosen).consequence}</p>` : ""}
  </fieldset>`;
}

function sourcesFor(mission, ms, phase) {
  const ids = new Set([
    ...(phase.uses || []),
    ...(phase.skill === "Speaking" || phase.skill === "Writing" ? ms.unlocked : []),
  ]);
  return [...ids]
    .filter((id) => mission.sources[id])
    .map((id) => ({ id, src: mission.sources[id] }));
}

function boardHTML(ms) {
  return ms.board.length
    ? html`<aside class="panel evidence-board" aria-label="Evidence board">
        <h3>📌 Evidence board</h3>
        <ul>
          ${ms.board.map((b) => html`<li><strong>${b.label}:</strong> ${b.text}</li>`)}
        </ul>
      </aside>`
    : "";
}

function debriefHTML(mission, ms, ledger, band, studio) {
  const mine = ledger.entries.filter(
    (e) => e.src === "mission" && e.task.startsWith(`${mission.id}:`),
  );
  const qs = mine.flatMap((e) => e.m.questions || []);
  const first = qs.filter((q) => q.ok).length;
  const tasks = mission.phases.flatMap((p) => p.tasks || []).filter((t) => t.task);
  const writing = tasks.find((t) => t.kind === "write");
  const w = writing ? studio.writing[writing.task.id] : null;
  const firstDraft = w?.versions?.[0];
  const finalDraft = w?.versions?.at(-1);
  const grew = firstDraft && finalDraft && firstDraft.id !== finalDraft.id;
  const delta = grew
    ? compareDrafts(firstDraft.text, finalDraft.text, {
        keyUse: writing.task.keyUse,
        sourceTerms: writing.task.sourceTerms,
        stage: "supported",
      })
    : null;
  return html`<section class="panel case-file">
    <h2>Case file: ${mission.title}</h2>
    <p>${mission.debrief?.connections || ""}</p>
    <h3>The path you chose</h3>
    <ul>
      ${mission.phases
        .filter((p) => p.skill === "Decision")
        .map((p) => {
          const o = p.decision.options.find((x) => x.id === ms.decisions[p.id]);
          return html`<li>
            ${p.decision.q} <strong>${o?.text || ""}</strong><br /><span class="fine"
              >${o?.consequence || ""}</span
            >
          </li>`;
        })}
    </ul>
    ${
      ms.board.length
        ? html`<h3>Evidence you gathered</h3>
            <ul>
              ${ms.board.map((b) => html`<li><strong>${b.label}:</strong> ${b.text}</li>`)}
            </ul>`
        : ""
    }
    ${
      grew
        ? html`<h3>How your writing changed</h3>
            <p class="fine">Your first draft and your final version of “${writing.task.title}”.</p>
            <p class="diff">
              ${diffWords(firstDraft.text, finalDraft.text).map((x) => (x.op === "same" ? html`${x.text} ` : x.op === "add" ? html`<ins>${x.text}</ins> ` : html`<del>${x.text}</del> `))}
            </p>
            ${
              delta.changes.length || delta.gainedMoves.length
                ? html`<ul>
                    ${delta.changes.map((c) => html`<li>${c.label}: ${c.from} → ${c.to}</li>`)}${delta.gainedMoves.map((m) => html`<li>Now: ${m.toLowerCase()}</li>`)}
                  </ul>`
                : ""
            }`
        : w
          ? html`<h3>Your writing</h3>
              <p class="portfolio-response">${finalDraft?.text || ""}</p>`
          : ""
    }
    <h3>Talk about it</h3>
    <ul>
      ${(mission.debrief?.teacherQuestions || []).map((q) => html`<li>${q}</li>`)}
    </ul>
    <details class="fine">
      <summary>Questions</summary>
      <p>
        ${first} of ${qs.length} questions were right on the first try. This is practice
        information, not a score.
      </p>
    </details>
    <div class="row-actions no-print">
      <button type="button" class="btn" data-print>Print my case file</button>
      <a class="btn btn-primary" href="${BASE}/missions?grades=${band}">More missions</a>
      <a class="btn" href="${BASE}/growth?grades=${band}">My language growth</a>
    </div>
  </section>`;
}

export async function render(ctx) {
  const index = await loadStudioIndex();
  const studio = loadStudio();
  const id = ctx.route.id || ctx.route.missionId;
  if (!id) return { title: "Academic Missions", html: hubHTML(ctx, index, studio) };
  const mission = await loadMission(id).catch(() => null);
  if (!mission)
    return {
      title: "Not found",
      html: html`<section class="panel">
        <h1>We could not find that mission.</h1>
        <a class="btn" href="${BASE}/missions?grades=${ctx.band}">All missions</a>
      </section>`,
    };
  const ledger = loadLedger();
  const ms = missionState(studio, mission.id);
  M = {
    ...(M || {}),
    band: ctx.band,
    studio,
    ledger,
    mission,
    ms,
    support: M?.mission?.id === mission.id ? M.support : {},
  };
  if (!ms.started) {
    ms.started = new Date().toISOString();
    ms.phaseStart = {};
    save();
  }
  const phases = mission.phases;
  const requested = new URLSearchParams(location.search).get("phase");
  const firstOpen = phases.findIndex((p) => !isDone(ms, p));
  const current = requested
    ? Math.max(
        0,
        phases.findIndex((p) => p.id === requested),
      )
    : firstOpen < 0
      ? phases.length
      : firstOpen;
  if (firstOpen < 0 && !ms.done) {
    ms.done = true;
    save();
  }
  const phase = phases[current];
  const sug =
    phase && ["Speaking", "Writing"].includes(phase.skill)
      ? missionSupport(ledger.entries, mission.keyUses[0])
      : null;
  M.phase = phase;
  return {
    title: mission.title,
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/?grades=${ctx.band}`],
        ["Academic Missions", `${BASE}/missions?grades=${ctx.band}`],
        [mission.title, null],
      ])}
      <section class="room-hero mission-hero" style="--room:${mission.theme}">
        <div>
          <span class="badge" style="background:${mission.theme};color:#fff">${mission.role}</span>
          <h1 tabindex="-1">${mission.icon} ${mission.title}</h1>
          <p class="lead">${mission.briefing.scene}</p>
          <p><strong>Your goal:</strong> ${mission.briefing.goal}</p>
        </div>
      </section>
      <nav class="mission-steps" aria-label="Mission phases">
        <ol>
          ${phases.map((p, i) => html`<li class="${i === current ? "is-current" : isDone(ms, p) ? "is-done" : ""}"><a ${i === current ? raw('aria-current="step"') : ""} href="${BASE}/missions/${mission.id}?phase=${p.id}&grades=${ctx.band}">${isDone(ms, p) ? "✓ " : ""}${p.skill}</a></li>`)}
        </ol>
      </nav>
      ${
        phase
          ? html`<article class="activity mission-phase" style="--room:${mission.theme}">
                <header class="act-head">
                  <p class="eyebrow">Phase ${current + 1} of ${phases.length} · ${phase.skill}</p>
                  <h2 tabindex="-1">${phase.title}</h2>
                  <p>${phase.instructions}</p>
                </header>
                <div class="mission-sources">
                  ${sourcesFor(mission, ms, phase).map(
                    ({ id: sid, src }) =>
                      html`${sourceHTML(src, { id: sid })}${src.kind === "passage" && phase.skill === "Reading" ? html`<button type="button" class="ghost small" data-read-source="${sid}">🔊 Read aloud <span class="fine">(saved as support)</span></button>` : ""}${
                        src.kind === "audio" && M.support.transcript
                          ? html`<div class="transcript">
                              <h4>Transcript</h4>
                              ${src.turns.map((t) => html`<p><strong>${t.speaker}:</strong> ${t.text}</p>`)}
                            </div>`
                          : ""
                      }${src.kind === "audio" && !M.support.transcript ? html`<button type="button" class="ghost small" data-transcript="${sid}">Can't listen? Show the transcript <span class="fine">(saved as support)</span></button>` : ""}`,
                  )}
                </div>
                ${sug ? html`<p class="fine">Suggested help for this phase: <strong>${sug.stage === "guided" ? "frames and words" : sug.stage === "independent" ? "no help, on my own" : "word bank"}</strong> — ${sug.reason}</p>` : ""}
                ${phase.skill === "Decision" ? decisionHTML(phase, ms) : html`${visibleTasks(phase, ledger).map((t) => (t.kind === "question" ? questionHTML(t, ms) : t.kind === "evidence" ? evidenceHTML(t, ms) : studioTaskHTML({ ...t, task: t.task || { id: t.taskRef, title: "Speaking or writing task", scenario: "", prompt: "" } }, ms, mission, ctx.band)))}`}
                ${isDone(ms, phase) && current < phases.length - 1 ? html`<a class="btn btn-primary" href="${BASE}/missions/${mission.id}?phase=${phases[current + 1].id}&grades=${ctx.band}">Next phase →</a>` : ""}
              </article>
              ${boardHTML(ms)}`
          : debriefHTML(mission, ms, ledger, ctx.band, studio)
      }`,
  };
}

function finishPhaseEntry() {
  const { mission, phase, ms, ledger } = M;
  const qs = (phase.tasks || [])
    .filter((t) => t.kind === "question")
    .map((t) => ({
      skill: t.skill,
      ok: Boolean(ms.answers[t.id]?.firstTry),
      distractor: ms.answers[t.id]?.firstWrong || null,
      tier: t.tier || "core",
    }));
  if (!qs.length) return;
  const supports = {
    transcript: Boolean(M.support.transcript),
    audio: Boolean(M.support.audio),
    retry: qs.some(
      (q, i) => ms.answers[phase.tasks.filter((t) => t.kind === "question")[i].id].tries > 1,
    ),
  };
  appendEntry(ledger, {
    src: "mission",
    task: `${mission.id}:${phase.id}`,
    band: M.band,
    domain: phase.skill,
    use: mission.keyUses[0],
    stage: Object.values(supports).some(Boolean) ? "supported" : "independent",
    kind: "first",
    supports,
    m: { questions: qs },
  });
  saveLedger(ledger);
}

export function onClick(e, ctx) {
  if (!M?.phase) return false;
  const t = e.target;
  const { ms, phase, mission } = M;
  const q = t.closest("[data-check-q]");
  if (q) {
    const task = phase.tasks.find((x) => x.id === q.dataset.checkQ);
    const a = (ms.answers[task.id] ||= {});
    a.tries = (a.tries || 0) + 1;
    const ok = a.pick === task.answer;
    a.last = a.pick;
    if (a.tries === 1) {
      a.firstTry = ok;
      if (!ok) a.firstWrong = task.options.find((o) => o.id === a.pick)?.distractor || null;
    }
    if (ok) {
      a.done = true;
      a.msg = `✓ ${task.explain}`;
    } else if (a.tries >= 2) {
      a.done = true;
      a.msg = `The answer is “${task.options.find((o) => o.id === task.answer).text}”. ${task.explain}`;
    } else
      a.msg =
        COACH[task.options.find((o) => o.id === a.pick)?.distractor] ||
        "Not yet. Reread the source and try again.";
    if (
      a.done &&
      phase.tasks.filter((x) => x.kind === "question").every((x) => ms.answers[x.id]?.done) &&
      !ms.phaseLogged?.[phase.id]
    ) {
      (ms.phaseLogged ||= {})[phase.id] = true;
      finishPhaseEntry();
    }
    save();
    ctx.rerender();
    return true;
  }
  const ev = t.closest("[data-check-ev]");
  if (ev) {
    const task = phase.tasks.find((x) => x.id === ev.dataset.checkEv);
    const a = (ms.answers[task.id] ||= {});
    const want = new Set(task.pool.filter((x) => x.supports).map((x) => x.id));
    const got = new Set(a.picks || []);
    const wrong = [...got].filter((id) => !want.has(id));
    const missed = [...want].filter((id) => !got.has(id));
    a.tries = (a.tries || 0) + 1;
    if (!wrong.length && !missed.length) {
      a.done = true;
      a.msg = `✓ Those statements support the idea. They are on your evidence board.`;
      for (const id of want) {
        const e = task.pool.find((x) => x.id === id);
        if (!ms.board.some((b) => b.id === `${task.id}:${id}`))
          ms.board.push({ id: `${task.id}:${id}`, label: task.boardLabel, text: e.text });
      }
    } else
      a.msg =
        `${wrong.length ? `${wrong.length} statement${wrong.length === 1 ? " does" : "s do"} not support the idea — check that each one answers the question.` : ""} ${missed.length ? `You missed ${missed.length} supporting statement${missed.length === 1 ? "" : "s"}.` : ""}`.trim();
    save();
    ctx.rerender();
    return true;
  }
  const rs = t.closest("[data-read-source]");
  if (rs) {
    M.support.audio = true;
    speak(mission.sources[rs.dataset.readSource].text, { rate: ctx.prefs.rate });
    return true;
  }
  const tr = t.closest("[data-transcript]");
  if (tr) {
    M.support.transcript = true;
    ctx.rerender();
    return true;
  }
  const pl = t.closest("[data-play-source]");
  if (pl) {
    const src = mission.sources[pl.dataset.playSource];
    speakDialogue(
      src.turns.map((u) => `${u.speaker}: ${u.text}`),
      { rate: ctx.prefs.rate },
    );
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  if (!M?.phase) return;
  const t = e.target;
  const { ms, phase } = M;
  if (t.matches("[data-q]")) {
    (ms.answers[t.dataset.q] ||= {}).pick = t.value;
    save();
    ctx.rerender();
  } else if (t.matches("[data-ev]")) {
    const a = (ms.answers[t.dataset.ev] ||= {});
    const set = new Set(a.picks || []);
    t.checked ? set.add(t.value) : set.delete(t.value);
    a.picks = [...set];
    save();
    ctx.rerender();
  } else if (t.matches("[data-decision]")) {
    const opt = phase.decision.options.find((o) => o.id === t.value);
    ms.decisions[phase.id] = opt.id;
    for (const u of opt.unlocks || []) if (!ms.unlocked.includes(u)) ms.unlocked.push(u);
    for (const b of opt.board || []) if (!ms.board.some((x) => x.id === b.id)) ms.board.push(b);
    if (opt.flag && !ms.flags.includes(opt.flag)) ms.flags.push(opt.flag);
    save();
    announce("Decision made. See what changed.");
    ctx.rerender();
  }
}

export function unmount() {
  stopSpeech();
}
