// Improve step UI (Growth Mirror): first response with ONE language target, graduated help, a revise box the learner edits
// (never replaced), a before/after comparison, a "why does this help" reflection, then done.
// All resumable state lives in env.data. Contract: access-practice-lab/JOURNEY.md, "Mirror (Improve / Show)".
import { html } from "../../util.js";
import { analyzeResponse } from "../../lang/analyze.js";
import { MISSIONS } from "../curriculum.js";
import {
  HELP_KINDS,
  analysisOpts,
  evaluateRevision,
  growthRecord,
  ledgerEntry,
  ownershipCheck,
  pickTarget,
  reasonOptions,
  targetSpans,
} from "../engines/mirror.js";
import { WHY_FOLLOWUP } from "../engines/mirror-copy.js";
import { changesHTML, compareHTML } from "./mirror-view.js";

export { changesHTML, compareHTML, showSummaryHTML } from "./mirror-view.js";

const LEVEL_TITLE = {
  question: ["A question to think about", "Una pregunta para pensar"],
  frame: ["A sentence frame", "Un marco de oración"],
  model: ["A model, not your answer", "Un modelo, no tu respuesta"],
};
const LEVEL_BUTTON = {
  question: ["Show me a question to think about", "Muéstrame una pregunta para pensar"],
  frame: ["Show me a sentence frame", "Muéstrame un marco de oración"],
  model: ["Show me a model", "Muéstrame un modelo"],
};
const KEEP_AFTER = 3;

/** Everything derived from the first response and the pack; recomputed each render, never stored. */
function context(task, env) {
  const keyUse = env.mission?.klu || MISSIONS[env.missionId]?.klu || "Explain";
  const aopts = analysisOpts(task.communicate || {}, keyUse);
  const first = String(env.prior?.communicate?.text || "");
  const analysis = analyzeResponse(first, aopts);
  const target = pickTarget(analysis, keyUse, env.band, task);
  return {
    keyUse,
    aopts,
    first,
    analysis,
    target,
    model: task.improve?.models?.[target.id] || null,
  };
}

/** The first response with the target's spans (vague words, unlinked sentences) marked; a plain quote for the other targets. */
function quoteWithMarks(I, text, spans) {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const out = [];
  let at = 0;
  for (const s of sorted) {
    if (s.start < at) continue;
    out.push(
      html`${text.slice(at, s.start)}<mark class="mr-mark"
          ><span class="visually-hidden">${I.S("target: ", "meta: ")}</span
          >${text.slice(s.start, s.end)}</mark
        >`,
    );
    at = s.end;
  }
  out.push(text.slice(at));
  return out;
}

function targetCard(I, c) {
  const spans = targetSpans(c.analysis, c.target);
  return html`<section class="mr-card mr-first" aria-labelledby="mrFirstTitle">
    <h3 id="mrFirstTitle">${I.T("Your first response", "Tu primera respuesta")}</h3>
    <blockquote class="mr-quote" lang="en">${quoteWithMarks(I, c.first, spans)}</blockquote>
    <div class="mr-target">
      <p class="mr-target-tag">${I.T("One thing to grow", "Una cosa para mejorar")}</p>
      <p class="mr-target-label"><strong>${I.T(c.target.label, c.target.labelEs)}</strong></p>
      <p class="mr-target-why">
        <span
          >${I.T("Why it matters for your listener:", "Por qué le importa a quien te escucha:")}</span
        >
        ${I.TO(c.target.why)}
      </p>
      ${spans.length ? html`<p class="fine">${I.T("The marked words are a good place to start.", "Las palabras marcadas son un buen lugar para empezar.")}</p>` : ""}
    </div>
  </section>`;
}

function helpCard(I, c, d) {
  const levels = c.target.levels || [];
  const opened = d.helps || {};
  const shown = levels.filter((l) => opened[l.kind]);
  const next = levels.find((l) => !opened[l.kind]);
  return html`<section class="mr-card mr-help" aria-labelledby="mrHelpTitle">
    <h3 id="mrHelpTitle">
      ${I.T("Need a hand? Help is optional.", "¿Necesitas ayuda? Es opcional.")}
    </h3>
    <p class="fine">
      ${I.T("Each step gives a little more. Opening help is saved as supported practice.", "Cada paso da un poco más. Abrir ayuda se guarda como práctica con apoyo.")}
    </p>
    <ol class="mr-levels">
      ${shown.map(
        (l) =>
          html`<li class="mr-level is-${l.kind}" tabindex="-1" data-mirror-focus="level-${l.kind}">
            <p class="mr-level-title"><strong>${I.T(...LEVEL_TITLE[l.kind])}</strong></p>
            ${l.kind === "question" ? html`<p>${I.T(l.text, l.textEs)}</p>` : html`<p class="mr-help-text" lang="en">${l.text}</p>`}
            ${l.kind === "model" ? html`<p class="fine">${I.T("Use it to see how the language works, then say it in your own words. Copying it will not show what you can do.", "Úsalo para ver cómo funciona el lenguaje y luego dilo con tus propias palabras. Copiarlo no muestra lo que puedes hacer.")}</p>` : ""}
          </li>`,
      )}
    </ol>
    ${next ? html`<button type="button" class="btn btn-secondary" data-mirror-help="${next.kind}">${I.T(...LEVEL_BUTTON[next.kind])}</button>` : html`<p class="fine">${I.T("That is all the help for this target.", "Esa es toda la ayuda para esta meta.")}</p>`}
  </section>`;
}

const noticeHTML = (I, n) =>
  n
    ? html`<p class="mr-notice" role="status" data-mirror-focus="notice" tabindex="-1">
        ${I.T(n.en, n.es)}
      </p>`
    : html`<p class="mr-notice" role="status"></p>`;

function reviseCard(I, c, d) {
  const stuck = (d.unchanged || 0) >= KEEP_AFTER && !d.after;
  return html`<section class="mr-card mr-revise" aria-labelledby="mrReviseTitle">
    <h3 id="mrReviseTitle">${I.T("Revise it", "Revísala")}</h3>
    <label class="mr-label" for="mrRevise"
      >${I.T("Change your response in your own words. Your first response is here to start from.", "Cambia tu respuesta con tus propias palabras. Tu primera respuesta está aquí para empezar.")}</label
    >
    <textarea
      id="mrRevise"
      class="mr-textarea"
      rows="7"
      lang="en"
      spellcheck="true"
      data-mirror-focus="revise"
    >
${d.draft ?? c.first}</textarea>
    ${noticeHTML(I, d.notice)}
    <div class="mr-actions">
      <button type="button" class="btn btn-primary" data-mirror-compare>
        ${d.after ? I.T("Compare again", "Comparar de nuevo") : I.T("Compare my revision", "Comparar mi revisión")}
      </button>
      <button type="button" class="btn ghost" data-mirror-reset>
        ${I.T("Back to my first response", "Volver a mi primera respuesta")}
      </button>
      ${stuck ? html`<button type="button" class="btn ghost" data-mirror-keep>${I.T("Keep my response as it is and go on", "Dejar mi respuesta como está y seguir")}</button>` : ""}
    </div>
  </section>`;
}

function compareCard(I, c, d) {
  const ev = evaluateRevision(c.first, d.after, {
    target: c.target,
    keyUse: c.keyUse,
    analysis: c.aopts,
  });
  const t = c.target;
  const line = ev.targetFixed
    ? I.T(
        `Your target is in your revision now: ${t.label}.`,
        `Tu meta ya está en tu revisión: ${t.labelEs}.`,
      )
    : I.T(
        `I do not find "${t.label}" in your revision yet. Look at the help again, or keep it and tell why it helps.`,
        `Todavía no encuentro "${t.labelEs}" en tu revisión. Mira la ayuda otra vez, o déjala y cuenta por qué ayuda.`,
      );
  return html`<section class="mr-card mr-comparison" aria-labelledby="mrCompareTitle">
    <h3 id="mrCompareTitle" tabindex="-1" data-mirror-focus="compare">
      ${I.T("Before and after", "Antes y después")}
    </h3>
    ${compareHTML(I, c.first, d.after, ev)}
    ${d.kept ? "" : html`<p class="mr-targetresult ${ev.targetFixed ? "is-found" : "is-open"}">${line}</p>`}
    ${ev.lost.length ? html`<p class="mr-check">${I.T(`One thing to check: "${ev.lost[0].label}" was in your first response and I cannot find it now.`, "Algo para revisar: algo que estaba en tu primera respuesta ya no aparece.")}</p>` : ""}
    <h4>${I.T("What changed", "Qué cambió")}</h4>
    ${ev.observable.length ? changesHTML(I, ev.observable) : html`<p>${d.kept ? I.T("Nothing changed: you kept your response.", "No cambió nada: dejaste tu respuesta.") : I.T("Your words changed. The checker does not see a new language move yet, and that is fine.", "Tus palabras cambiaron. El revisor todavía no ve un paso de lenguaje nuevo, y está bien.")}</p>`}
  </section>`;
}

function whyCard(I, c, task, d) {
  const options = reasonOptions(task.improve?.whys, c.target, c.first.slice(0, 12));
  const chosen = options.find((o) => o.id === d.why);
  return html`<fieldset class="mr-card mr-why">
    <legend>
      <h3 id="mrWhyTitle" tabindex="-1" data-mirror-focus="why">
        ${I.T("Why does this help your listener?", "¿Por qué esto ayuda a quien te escucha?")}
      </h3>
    </legend>
    <p class="fine">
      ${I.T("Pick the reason that fits best. Every answer is saved as your own thinking.", "Elige la razón que mejor encaje. Toda respuesta se guarda como tu propio pensamiento.")}
    </p>
    ${options.map((o) => html`<label class="mr-option"><input type="radio" name="mirror-why" value="${o.id}" ${o.id === d.why ? "checked" : ""} /><span lang="en">${o.text}</span></label>`)}
    ${chosen && !chosen.matches ? html`<p class="mr-notice" role="status">${I.T(WHY_FOLLOWUP.en, WHY_FOLLOWUP.es)}</p>` : ""}
  </fieldset>`;
}

export function render(task, env) {
  const I = env.I;
  const d = env.data || {};
  if (!String(env.prior?.communicate?.text || "").trim())
    return html`<section class="mr">
      <p class="mr-notice" role="status">
        ${I.T("Finish the Communicate step first. Your first response shows up here.", "Termina primero el paso Comunica. Tu primera respuesta aparecerá aquí.")}
      </p>
    </section>`;
  const c = context(task, env);
  const ready = Boolean(d.after) && (Boolean(d.why) || Boolean(d.kept));
  return html`<section class="mr" data-mirror aria-labelledby="mrTitle">
    <header class="mr-head">
      <h2 id="mrTitle" tabindex="-1">
        ${I.T("Improve: grow one thing", "Mejora: haz crecer una cosa")}
      </h2>
      <p class="lead">
        ${I.T("Look at your own words, pick one thing to grow, and revise. You write the new version; nobody writes it for you.", "Mira tus propias palabras, elige una cosa para mejorar y revísalas. Tú escribes la versión nueva; nadie la escribe por ti.")}
      </p>
    </header>
    ${targetCard(I, c)} ${env.independent ? "" : helpCard(I, c, d)} ${reviseCard(I, c, d)}
    ${d.after ? compareCard(I, c, d) : ""} ${d.after && !d.kept ? whyCard(I, c, task, d) : ""}
    <div class="mr-done">
      <button
        type="button"
        class="btn btn-primary btn-big"
        data-mirror-done
        aria-disabled="${ready ? "false" : "true"}"
      >
        ${I.T("Finish Improve", "Terminar Mejora")}
      </button>
      ${ready ? "" : html`<p class="fine">${I.T("Compare your revision and pick a reason to finish.", "Compara tu revisión y elige una razón para terminar.")}</p>`}
    </div>
  </section>`;
}

const val = (root) => root.querySelector("#mrRevise")?.value ?? "";
const opened = (d) => HELP_KINDS.filter((k) => d.helps?.[k]);

export function mount(root, env) {
  root.__mirrorOff?.();
  const offs = [];
  const on = (target, type, fn) => {
    target.addEventListener(type, fn);
    offs.push(() => target.removeEventListener(type, fn));
  };
  root.__mirrorOff = () => offs.forEach((off) => off());
  const I = env.I;
  const task = env.pack;
  root.__mirrorDone = false;
  const cur = () => env.data || {};
  const focus = cur().focus && root.querySelector(`[data-mirror-focus="${cur().focus}"]`);
  if (focus) focus.focus();
  if (!String(env.prior?.communicate?.text || "").trim() || !task) return;
  const c = context(task, env);

  const compare = () => {
    const d = cur();
    const text = val(root);
    const ev = evaluateRevision(c.first, text, {
      target: c.target,
      keyUse: c.keyUse,
      analysis: c.aopts,
    });
    if (!ev.changed) {
      env.announce?.(I.S(ev.noChange.message.en, ev.noChange.message.es));
      return env.update({
        draft: text,
        notice: ev.noChange.message,
        unchanged: (d.unchanged || 0) + 1,
        focus: "notice",
      });
    }
    const own = ownershipCheck(c.first, text, c.model, d.ownershipPrompted);
    if (!own.accepted) {
      env.announce?.(I.S(own.prompt.en, own.prompt.es));
      return env.update({
        draft: text,
        notice: own.prompt,
        ownershipPrompted: true,
        focus: "notice",
      });
    }
    env.announce?.(I.S("Comparison ready.", "La comparación está lista."));
    env.update({ draft: text, after: text, kept: false, notice: null, focus: "compare" });
  };
  const finish = () => {
    const d = cur();
    if (root.__mirrorDone || !d.after || !(d.why || d.kept)) return;
    root.__mirrorDone = true;
    const kept = Boolean(d.kept);
    const ev = kept
      ? null
      : evaluateRevision(c.first, d.after, {
          target: c.target,
          keyUse: c.keyUse,
          analysis: c.aopts,
        });
    const helps = opened(d);
    const reason = reasonOptions(task.improve?.whys, c.target, c.first.slice(0, 12)).find(
      (o) => o.id === d.why,
    );
    const result = {
      target: c.target.id,
      before: c.first,
      after: d.after,
      why: d.why || null,
      supportsUsed: helps,
      kept,
      targetFixed: Boolean(ev?.targetFixed),
      observable: ev?.observable || [],
      reflection: reason ? { id: reason.id, matches: reason.matches } : null,
    };
    result.growth = growthRecord(
      env.missionId,
      env.band,
      { communicate: env.prior.communicate, improve: result },
      null,
      { keyUse: c.keyUse, communicateTask: task.communicate, showTask: task.show },
    );
    if (!kept)
      env.ledger?.(
        ledgerEntry("revision", {
          missionId: env.missionId,
          band: env.band,
          text: d.after,
          helps,
          mode: env.prior.communicate.mode,
          keyUse: c.keyUse,
          task: task.communicate,
        }),
      );
    env.done(result);
  };

  on(root, "click", (e) => {
    const d = cur();
    const hit = (sel) => e.target.closest?.(sel);
    const helpBtn = hit("[data-mirror-help]");
    if (helpBtn) {
      const kind = helpBtn.dataset.mirrorHelp;
      env.help?.(kind);
      return env.update({ helps: { ...d.helps, [kind]: true }, draft: val(root), focus: `level-${kind}` });
    }
    if (hit("[data-mirror-compare]")) return compare();
    if (hit("[data-mirror-reset]")) {
      const box = root.querySelector("#mrRevise");
      if (box) box.value = c.first;
      return box?.focus();
    }
    if (hit("[data-mirror-keep]")) return env.update({ draft: c.first, after: c.first, kept: true, notice: null, focus: "compare" });
    if (hit("[data-mirror-done]")) return finish();
  });
  on(root, "change", (e) => e.target.name === "mirror-why" && env.update({ why: e.target.value, draft: val(root) || cur().draft, focus: "why" }));
  // Typing never re-renders, so the draft is saved at actions and when the page is hidden.
  on(document, "visibilitychange", () => document.visibilityState === "hidden" && root.querySelector("#mrRevise") && val(root) !== (cur().draft ?? c.first) && env.update({ draft: val(root) }));
}
