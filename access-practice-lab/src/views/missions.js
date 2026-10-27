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
import { chooserHeroHTML, disclosure, sourceHTML, stageName, trackDisclosures } from "../studio-ui.js";
import { ART, BASE, announce, html, icon, raw } from "../util.js";

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
const SKILL_ICON = { Listening: "listening", Reading: "reading", Decision: "flag", Speaking: "speaking", Writing: "writing" };
const skillIcon = (skill) => icon(SKILL_ICON[skill] || "mission");
const LETTERS = "ABCDEFGH";
// Stored messages from earlier versions began with a check mark character; the icon replaces it.
const plainMsg = (m) => String(m || "").replace(/^\u2713\s*/, "");
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
    ${chooserHeroHTML({
      domain: "d-missions",
      eyebrow: `Grades ${ctx.band.replace("-", "–")} · ${list.length} missions`,
      title: "Academic Missions",
      lead: "Investigations that use all four skills. You listen, read, make a decision that changes what you learn, speak, and write — with your evidence in hand.",
      art: `${ART}/studio-mission.svg`,
      loop: ["Listen", "Read", "Decide", "Speak", "Write"],
    })}
    ${
      list.length
        ? html`<section class="task-group" aria-label="All missions"><div class="mission-grid">
            ${list.map((m) => html`<a class="card mission-card" style="--room:${m.theme}" href="${BASE}/missions/${m.id}?grades=${ctx.band}">
              <span class="mc-top"><span class="mc-emoji" aria-hidden="true">${m.icon}</span><span class="mc-role">${m.role}</span>${prog(m) ? html`<span class="mode-pill ${prog(m) === "Complete" ? "is-done" : ""}">${prog(m) === "Complete" ? icon("check") : icon("clock")} ${prog(m)}</span>` : ""}</span>
              <strong class="mc-title">${m.title}</strong>
              <span class="mc-sub">${m.subtitle}</span>
              <span class="mc-sum">${m.summary}</span>
              <span class="mc-foot"><span class="task-meta"><span class="tag">${m.contentArea}</span><span class="tag">${icon("clock")} ${m.minutes} min</span>${(m.keyUses || []).map((k) => html`<span class="tag">${k}</span>`)}</span>
              <span class="mc-skills" aria-label="Uses listening, reading, a decision, speaking and writing">${["Listening", "Reading", "Decision", "Speaking", "Writing"].map(skillIcon)}</span></span>
            </a>`)}
          </div></section>`
        : html`<section class="panel empty-state"><img src="${ART}/empty.svg" alt="" width="480" height="300" /><h2>No missions for this grade band yet</h2><p>Switch grade band from the menu to see the missions that are ready.</p></section>`
    }
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

const FB_ICON = { right: "check", hint: "retry", shown: "info" };
const feedbackBox = (kind, msg, title) =>
  msg ? html`<div class="feedback is-${kind}" role="status"><p class="fb-title">${icon(FB_ICON[kind])} ${title}</p><p>${plainMsg(msg)}</p></div>` : "";

function questionHTML(t, ms, n, total) {
  const a = ms.answers[t.id] || {};
  return html`<fieldset class="mission-q">
    <legend><span class="q-n">Question ${n} of ${total}</span>${t.tier === "stretch" ? html` <span class="mode-pill">Stretch</span>` : ""}<span class="q-text">${t.q}</span></legend>
    <div class="choices">${t.options.map((o, i) => {
      const right = a.done && o.id === t.answer;
      const miss = a.last === o.id && !a.done;
      return html`<label class="choice choice-card ${right ? "is-right" : miss ? "is-wrong" : a.pick === o.id ? "is-on" : ""}"><input type="radio" name="q-${t.id}" value="${o.id}" data-q="${t.id}" ${a.pick === o.id ? raw("checked") : ""} ${a.done ? raw("disabled") : ""} ${IGN} /><span class="choice-letter" aria-hidden="true">${LETTERS[i]}</span><span>${o.text}${right ? html` <span class="visually-hidden">(correct answer)</span>` : miss ? html` <span class="visually-hidden">(not correct)</span>` : ""}</span></label>`;
    })}</div>
    ${!a.done ? html`<button type="button" class="btn btn-primary btn-check" data-check-q="${t.id}" ${a.pick ? "" : raw("disabled")}>Check my answer</button>` : ""}
    ${a.done ? (a.last === t.answer ? feedbackBox("right", a.msg, "Correct") : feedbackBox("shown", a.msg, "Here is the answer")) : feedbackBox("hint", a.msg, "Not yet")}
  </fieldset>`;
}

function evidenceHTML(t, ms) {
  const a = ms.answers[t.id] || {};
  const picked = new Set(a.picks || []);
  return html`<fieldset class="mission-q">
    <legend><span class="q-n">Collect evidence</span><span class="q-text">${t.q}</span></legend>
    <p class="fine">Choose every statement that supports the idea. Statements you choose correctly go on your evidence board.</p>
    <div class="choices">${t.pool.map((e) => html`<label class="choice choice-card is-check ${a.done && e.supports ? "is-right" : picked.has(e.id) ? "is-on" : ""}"><input type="checkbox" value="${e.id}" data-ev="${t.id}" ${picked.has(e.id) ? raw("checked") : ""} ${a.done ? raw("disabled") : ""} ${IGN} /><span class="choice-letter" aria-hidden="true">${icon("check")}</span><span>${e.text}</span></label>`)}</div>
    ${!a.done ? html`<button type="button" class="btn btn-primary btn-check" data-check-ev="${t.id}" ${picked.size ? "" : raw("disabled")}>Check my evidence</button>` : ""}
    ${feedbackBox(a.done ? "right" : "hint", a.msg, a.done ? "On your evidence board" : "Not yet")}
  </fieldset>`;
}

function studioTaskHTML(t, ms, mission, band, suggestedStage = "") {
  const task = t.task;
  const done = taskDone(ms, t);
  const route = t.kind === "speak" ? "speak" : "write";
  const stageParam = ["guided", "supported", "independent"].includes(suggestedStage)
    ? `&suggestedStage=${suggestedStage}`
    : "";
  return html`<div class="studio-task card">
    <span class="st-ico">${icon(route === "speak" ? "speaking" : "writing")}</span>
    <div class="st-body">
      <p class="eyebrow">${t.kind === "speak" ? "Speaking Studio task" : "Writing Studio task"}${done ? html` <span class="mode-pill is-done">${icon("check")} Done</span>` : ""}</p>
      <h3>${task.title}</h3>
      <p>${task.scenario}</p>
      <p class="st-prompt">${task.prompt}</p>
      <a class="btn ${done ? "" : "btn-primary"}" href="${BASE}/${route}/${task.id}?from=mission:${mission.id}&grades=${band}${stageParam}">${done ? "Open again" : t.kind === "speak" ? "Start speaking" : "Start writing"}${icon("arrow-right")}</a>
    </div>
  </div>`;
}

function decisionHTML(phase, ms) {
  const d = phase.decision;
  const chosen = ms.decisions[phase.id];
  return html`<fieldset class="mission-q is-decision">
    <legend><span class="q-n">Your decision</span><span class="q-text">${d.q}</span></legend>
    <div class="choices">${d.options.map((o, i) => html`<label class="choice choice-card ${chosen === o.id ? "is-right" : ""}"><input type="radio" name="d-${phase.id}" value="${o.id}" data-decision="${phase.id}" ${chosen === o.id ? raw("checked") : ""} ${chosen ? raw("disabled") : ""} ${IGN} /><span class="choice-letter" aria-hidden="true">${LETTERS[i]}</span><span>${o.text}</span></label>`)}</div>
    ${chosen ? html`<div class="feedback is-shown" role="status"><p class="fb-title">${icon("flag")} What happens</p><p>${d.options.find((o) => o.id === chosen).consequence}</p></div>` : html`<p class="fine">You can only choose once. The choice changes what you read, say and write next.</p>`}
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
        <h3>${icon("pin")} Evidence board</h3>
        <ul>
          ${ms.board.map((b) => html`<li><span class="board-label">${b.label}</span>${b.text}</li>`)}
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
    <header class="case-head">
      <span class="case-stamp">${icon("check")} Mission complete</span>
      <h2>Case file: ${mission.title}</h2>
      <p class="lead">${mission.debrief?.connections || ""}</p>
    </header>
    <div class="case-grid">
      <section>
        <h3>${icon("flag")} The path you chose</h3>
        <ol class="path-list">
          ${mission.phases
            .filter((p) => p.skill === "Decision")
            .map((p) => {
              const o = p.decision.options.find((x) => x.id === ms.decisions[p.id]);
              return html`<li><span class="fine">${p.decision.q}</span><strong>${o?.text || ""}</strong><span class="fine">${o?.consequence || ""}</span></li>`;
            })}
        </ol>
      </section>
      ${
        ms.board.length
          ? html`<section><h3>${icon("pin")} Evidence you gathered</h3>
              <ul class="board-chips">${ms.board.map((b) => html`<li><span class="board-label">${b.label}</span>${b.text}</li>`)}</ul></section>`
          : ""
      }
    </div>
    ${
      grew
        ? html`<section class="case-growth"><h3>${icon("growth")} How your writing changed</h3>
            <p class="fine">Your first draft and your final version of “${writing.task.title}”.</p>
            <p class="diff">${diffWords(firstDraft.text, finalDraft.text).map((x) => (x.op === "same" ? html`${x.text} ` : x.op === "add" ? html`<ins>${x.text}</ins> ` : html`<del>${x.text}</del> `))}</p>
            ${delta.changes.length || delta.gainedMoves.length ? html`<ul>${delta.changes.map((c) => html`<li>${c.label}: ${c.from} → ${c.to}</li>`)}${delta.gainedMoves.map((m) => html`<li>Now: ${m.toLowerCase()}</li>`)}</ul>` : ""}</section>`
        : w
          ? html`<section class="case-growth"><h3>Your writing</h3><p class="portfolio-response">${finalDraft?.text || ""}</p></section>`
          : ""
    }
    <section><h3>${icon("conversation")} Talk about it</h3>
      <ul>${(mission.debrief?.teacherQuestions || []).map((q) => html`<li>${q}</li>`)}</ul></section>
    <details class="fine">
      <summary>Questions</summary>
      <p>${first} of ${qs.length} questions were right on the first try. This is practice information, not a score.</p>
    </details>
    <div class="row-actions no-print">
      <button type="button" class="btn" data-print>${icon("print")} Print my case file</button>
      <a class="btn btn-primary" href="${BASE}/missions?grades=${band}">More missions${icon("arrow-right")}</a>
      <a class="btn" href="${BASE}/growth?grades=${band}">${icon("growth")} My language growth</a>
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
      html: html`<section class="panel empty-state"><img src="${ART}/empty.svg" alt="" width="480" height="300" /><h1 tabindex="-1">We could not find that mission.</h1><a class="btn" href="${BASE}/missions?grades=${ctx.band}">All missions</a></section>`,
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
  const qTasks = phase ? visibleTasks(phase, ledger).filter((t) => t.kind === "question") : [];
  return {
    title: mission.title,
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/?grades=${ctx.band}`],
        ["Academic Missions", `${BASE}/missions?grades=${ctx.band}`],
        [mission.title, null],
      ])}
      <div class="studio-view mission-studio" style="--room:${mission.theme}">
      <section class="mission-hero ${!phase || current > 0 ? "is-compact" : ""}">
        <span class="mh-emoji" aria-hidden="true">${mission.icon}</span>
        <div class="mh-copy">
          <p class="eyebrow">${mission.role} · ${mission.contentArea} · ${mission.minutes} min</p>
          <h1 tabindex="-1">${mission.title}</h1>
          ${
            !phase || current > 0
              ? disclosure("mission-brief", html`${icon("info")} Mission briefing`, html`<p>${mission.briefing.scene}</p><p class="mh-goal">${icon("flag")}<span><strong>Your goal:</strong> ${mission.briefing.goal}</span></p>`, { cls: "mh-brief" })
              : html`<p class="lead">${mission.briefing.scene}</p>
          <p class="mh-goal">${icon("flag")}<span><strong>Your goal:</strong> ${mission.briefing.goal}</span></p>`
          }
        </div>
      </section>
      <nav class="mission-steps" aria-label="Mission phases">
        <ol>
          ${phases.map((p, i) => html`<li class="${i === current ? "is-current" : isDone(ms, p) ? "is-done" : ""}"><a ${i === current ? raw('aria-current="step"') : ""} href="${BASE}/missions/${mission.id}?phase=${p.id}&grades=${ctx.band}"><span class="step-n">${isDone(ms, p) && i !== current ? icon("check") : skillIcon(p.skill)}</span><span class="step-l">${p.skill}${isDone(ms, p) && i !== current ? html`<span class="visually-hidden"> (done)</span>` : ""}</span></a></li>`)}
        </ol>
      </nav>
      ${
        phase
          ? html`<div class="mission-layout ${ms.board.length ? "has-board" : ""}">
              <article class="activity mission-phase">
                <header class="act-head">
                  <p class="eyebrow">${skillIcon(phase.skill)} Phase ${current + 1} of ${phases.length} · ${phase.skill}</p>
                  <h2 tabindex="-1">${phase.title}</h2>
                  <p class="phase-instr">${phase.instructions}</p>
                  ${sug ? html`<p class="fine sug">${icon("info")}<span>Suggested help for this phase: <strong>${stageName(sug.stage)}</strong> — ${sug.reason}</span></p>` : ""}
                </header>
                <div class="mission-sources">
                  ${sourcesFor(mission, ms, phase).map(
                    ({ id: sid, src }) =>
                      html`<div class="source-wrap">${sourceHTML(src, { id: sid })}${src.kind === "passage" && phase.skill === "Reading" ? html`<button type="button" class="ghost small" data-read-source="${sid}">${icon("volume")} Read aloud <span class="fine">(saved as support)</span></button>` : ""}${
                        src.kind === "audio" && M.support.transcript
                          ? html`<div class="transcript"><h4>Transcript</h4>${src.turns.map((t) => html`<p><strong>${t.speaker}:</strong> ${t.text}</p>`)}</div>`
                          : ""
                      }${src.kind === "audio" && !M.support.transcript ? html`<button type="button" class="ghost small" data-transcript="${sid}">Can't listen? Show the transcript <span class="fine">(saved as support)</span></button>` : ""}</div>`,
                  )}
                </div>
                ${phase.skill === "Decision" ? decisionHTML(phase, ms) : html`${visibleTasks(phase, ledger).map((t) => (t.kind === "question" ? questionHTML(t, ms, qTasks.indexOf(t) + 1, qTasks.length) : t.kind === "evidence" ? evidenceHTML(t, ms) : studioTaskHTML({ ...t, task: t.task || { id: t.taskRef, title: "Speaking or writing task", scenario: "", prompt: "" } }, ms, mission, ctx.band, sug?.stage)))}`}
                ${isDone(ms, phase) && current < phases.length - 1 ? html`<a class="btn btn-primary btn-big next-phase" href="${BASE}/missions/${mission.id}?phase=${phases[current + 1].id}&grades=${ctx.band}">Next phase: ${phases[current + 1].skill}${icon("arrow-right")}</a>` : ""}
              </article>
              ${boardHTML(ms)}
            </div>`
          : debriefHTML(mission, ms, ledger, ctx.band, studio)
      }
      </div>`,
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
      a.msg = task.explain;
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
      a.msg = "Those statements support the idea. They are on your evidence board.";
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

export function mount(root) {
  trackDisclosures(root);
}

export function unmount() {
  stopSpeech();
}
