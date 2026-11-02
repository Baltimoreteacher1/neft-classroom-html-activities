// Learner-facing screens for the adaptive layer (Enterprise 8): today's recommended practice with reasons, the quick
// starting-point check, patterns the lab is noticing, and the Mistake Repair Studio. Pure logic lives in the sibling modules;
// this file only draws and wires. Every string is bilingual and nothing is timed.
import { getLang } from "../i18n.js";
import { MathVisualEngine, esc, seeded } from "./engine-core.js";
import { getModel } from "./models.js";
import { buildGraph } from "./knowledge-graph.js";
import { AdaptivePlacement } from "./adaptive-placement.js";
import {
  analyzeResponse,
  activePatterns,
  recordDiagnosis,
  markRepaired,
} from "./misconception-engine.js";
import { planPractice, ROLE_LABELS } from "./practice-selector.js";
import { RepairStudio } from "./repair-studio.js";
import { addSkillEvent, saveRepair, savePlacement } from "./e8-store.js";
import {
  STATE_LABELS,
  describeState,
  evidenceFor,
} from "./mastery-evidence.js";
import { findSkill, recordAnswer } from "../tutor-engine.js";
import { itemSignature } from "../mastery-model.js";
import { validateAnswer } from "../problem-bank.js";

const lang = () => (getLang() === "es" ? "es" : "en");
const L = (en, es) => (lang() === "es" ? es : en);
const pick = (o) => (o && typeof o === "object" ? o[lang()] : o);
const LEVEL_NAMES = [
  L("Picture first", "Primero con imágenes"),
  L("Grade level", "Nivel del grado"),
  L("Challenge", "Desafío"),
];

// ---------------------------------------------------------------- today's plan
export function mountAdaptivePanel(host, ctx) {
  const {
    grade,
    tutor,
    store,
    onOpenSkill,
    onOpenModel,
    onRecord,
    now = Date.now(),
  } = ctx;
  const state = store.load();
  const patterns = activePatterns(state.misconceptions);
  const plan = planPractice({
    tutor,
    extras: state.skills,
    patterns,
    grade,
    now,
  });
  const nodes = buildGraph().nodes;
  const renderTasks = (list) => list
    .map(
      (t) => `<li class="e8ap-task e8ap-${t.role}">
        <span class="e8ap-role">${esc(pick(ROLE_LABELS[t.role]))}</span>
        <strong>${esc(t.title)}</strong>
        <span class="e8ap-level">${esc(LEVEL_NAMES[t.level])}</span>
        <p class="e8ap-reason">${esc(pick(t.reason))}</p>
        <span class="e8ap-actions"><button type="button" class="e8ap-btn e8ap-primary" data-e8ap-open="${esc(t.key)}">${esc(L("Start", "Empezar"))}</button>${t.model && getModel(t.model) ? `<button type="button" class="e8ap-btn" data-e8ap-model="${esc(t.model)}">${esc(L("See the model", "Ver el modelo"))}</button>` : ""}</span>
      </li>`,
    )
    .join("");
  // What needs attention (a pattern to repair, a shaky foundation, a review) is shown first; the rest keep the plan's order.
  const attention = plan.items.filter((t) => ["repair", "foundation", "review"].includes(t.cause));
  const ordered = [...attention, ...plan.items.filter((t) => !attention.includes(t))];
  const items = renderTasks(ordered.slice(0, 5));
  const moreItems = ordered.length > 5 ? `<details class="e8ap-details"><summary>${esc(L("More ideas for today", "Más ideas para hoy"))}</summary><ol class="e8ap-list">${renderTasks(ordered.slice(5))}</ol></details>` : "";
  const chips = (keys) =>
    keys
      .slice(0, 6)
      .map(
        (k) =>
          `<button type="button" class="e8ap-chip" data-e8ap-open="${esc(k)}">${esc(nodes.get(k)?.title || k)}</button>`,
      )
      .join("");
  const section = (title, keys) =>
    keys.length
      ? `<div class="e8ap-group"><h4>${esc(title)}</h4><div class="e8ap-chips">${chips(keys)}</div></div>`
      : "";
  const patternHtml = patterns.length
    ? `<div class="e8ap-group"><h4>${esc(L("Patterns I am noticing", "Patrones que estoy notando"))}</h4><ul class="e8ap-patterns">${patterns
        .slice(0, 3)
        .map(
          (p) =>
            `<li><strong>${esc(pick(p.info.title))}</strong> <span class="e8ap-status">${esc(p.status === "persistent" ? L("seen on several days", "visto en varios días") : L("seen more than once", "visto más de una vez"))}</span><p>${esc(pick(p.info.idea))}</p><button type="button" class="e8ap-btn" data-e8ap-model="${esc(p.info.models[0])}">${esc(L("See it in a model", "Verlo en un modelo"))}</button></li>`,
        )
        .join("")}</ul></div>`
    : "";
  const placed = state.placement[String(grade)];
  host.innerHTML = `
    <section class="e8ap" aria-labelledby="e8ap-title">
      <h3 id="e8ap-title">${esc(L("Today's recommended practice", "Práctica recomendada de hoy"))}</h3>
      <p class="e8ap-intro">${esc(L("Chosen from your own work. Each task says why it is here.", "Elegida a partir de tu propio trabajo. Cada tarea dice por qué está aquí."))}</p>
      ${items ? `<ol class="e8ap-list">${items}</ol>${moreItems}` : `<p>${esc(L("Nothing is due today. Try a challenge or a game.", "Hoy no toca nada. Prueba un desafío o un juego."))}</p>`}
      ${section(L("Skills to review", "Destrezas para repasar"), plan.review)}
      ${section(L("Recently learned", "Aprendido recientemente"), plan.recentlyLearned)}
      ${section(L("Ready for a challenge", "Listas para un desafío"), plan.readyForChallenge)}
      ${patternHtml}
      <div class="e8ap-group"><h4>${esc(L("Find my starting point", "Encuentra mi punto de partida"))}</h4><p>${esc(placed ? L("You did this before. You can do it again any time.", "Ya lo hiciste antes. Puedes hacerlo otra vez cuando quieras.") : L("About 10 short questions. It is not a test and it does not give a grade.", "Unas 10 preguntas cortas. No es un examen y no da una nota."))}</p><button type="button" class="e8ap-btn" data-e8ap-place>${esc(L("Start the quick check", "Empezar la revisión rápida"))}</button></div>
      <div class="e8ap-stage" aria-live="polite"></div>
    </section>`;
  const stage = host.querySelector(".e8ap-stage");
  host.onclick = (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.e8apOpen) onOpenSkill(b.dataset.e8apOpen);
    else if (b.dataset.e8apModel) onOpenModel(b.dataset.e8apModel);
    else if (b.hasAttribute("data-e8ap-place"))
      runPlacement(stage, ctx, () => (ctx.onRefresh ? ctx.onRefresh() : mountAdaptivePanel(host, ctx)));
  };
}

// ---------------------------------------------------------------- the quick starting-point check
function runPlacement(stage, ctx, done) {
  const { grade, tutor, store, onRecord } = ctx;
  const place = new AdaptivePlacement({ grade, seed: (Date.now() % 9973) + 1 });
  const show = () => {
    const q = place.next();
    if (!q || place.done) return finish();
    stage.innerHTML = `<div class="e8ap-q"><p class="e8ap-count">${esc(L(`Question ${place.history.length + 1}`, `Pregunta ${place.history.length + 1}`))}</p><p class="e8ap-prompt">${esc(q.problem.question)}</p><label class="e8ap-label" for="e8ap-ans">${esc(L("Your answer", "Tu respuesta"))}</label><div class="e8ap-row"><input id="e8ap-ans" class="e8ap-input" autocomplete="off" inputmode="text"><button type="button" class="e8ap-btn e8ap-primary" data-go>${esc(L("Next", "Siguiente"))}</button><button type="button" class="e8ap-btn" data-unsure>${esc(L("I am not sure", "No estoy seguro"))}</button></div></div>`;
    const input = stage.querySelector("#e8ap-ans");
    input.focus();
    const submit = (unsure) => {
      const value = input.value;
      if (!unsure && !value.trim()) return input.focus();
      const skill = findSkill(q.key);
      if (unsure) place.answer({ unsure: true });
      else {
        const correct = validateAnswer(value, q.problem);
        const analysis = correct
          ? { category: "correct" }
          : analyzeResponse({
              skill,
              question: q.problem.question,
              answers: q.problem.answers,
              response: value,
            });
        // The check counts as an independent first try; a miss with a clear signature is kept as evidence.
        recordAnswer(tutor, skill, {
          correct,
          independent: true,
          level: q.level,
          sig: itemSignature(q.problem.question),
        });
        if (!correct)
          store.update((s) =>
            recordDiagnosis(s.misconceptions, analysis, {
              sig: itemSignature(q.problem.question),
              skillKey: q.key,
            }),
          );
        place.answer({ correct, analysis });
      }
      show();
    };
    stage.querySelector("[data-go]").onclick = () => submit(false);
    stage.querySelector("[data-unsure]").onclick = () => submit(true);
    input.onkeydown = (e) => e.key === "Enter" && submit(false);
  };
  const finish = () => {
    const result = place.result();
    store.update((s) => savePlacement(s, grade, result));
    onRecord?.();
    const nodes = buildGraph().nodes;
    const path = result.path
      .map(
        (k) =>
          `<li><button type="button" class="e8ap-chip" data-e8ap-open="${esc(k)}">${esc(nodes.get(k)?.title || k)}</button></li>`,
      )
      .join("");
    stage.innerHTML = `<div class="e8ap-result"><h4>${esc(L("Your starting point", "Tu punto de partida"))}</h4><p>${esc(pick(result.explanation))}</p>${path ? `<ol class="e8ap-pathlist">${path}</ol>` : ""}<p class="e8ap-count">${esc(result.confidence === "moderate" ? L("This is a fairly good guide.", "Es una guía bastante buena.") : L("This is a rough guide. More practice will sharpen it.", "Es una guía aproximada. Más práctica la afinará."))}</p><button type="button" class="e8ap-btn" data-e8ap-done>${esc(L("Back to today's practice", "Volver a la práctica de hoy"))}</button></div>`;
    stage.querySelector("[data-e8ap-done]").onclick = done;
    stage
      .querySelectorAll("[data-e8ap-open]")
      .forEach((b) => (b.onclick = () => ctx.onOpenSkill(b.dataset.e8apOpen)));
  };
  show();
}

// ---------------------------------------------------------------- per-skill evidence table (text alternative to the graphic)
export function evidenceTableHtml(tutor, store, grade, now = Date.now()) {
  const s = store.load();
  const rows = [...buildGraph().nodes.values()]
    .filter((n) => n.grade === Number(grade))
    .map((n) => {
      const ev = evidenceFor(tutor.records[n.key], s.skills[n.key] || {}, now);
      const pct = (i) => (i ? `${Math.round(i.value * 100)}%` : "—");
      return `<tr><th scope="row">${esc(n.title)}</th><td>${esc(pick(STATE_LABELS[ev.state]))}</td><td>${pct(ev.indicators.independentAccuracy)}${ev.independent ? ` (${ev.independent})` : ""}</td><td>${pct(ev.indicators.scaffoldedAccuracy)}</td><td>${pct(ev.indicators.retention)}</td><td>${pct(ev.indicators.transfer)}</td><td>${esc(pick(ev.next))}</td></tr>`;
    })
    .join("");
  return `<details class="e8ap-details"><summary>${esc(L("How I am doing on each skill", "Cómo voy en cada destreza"))}</summary><div class="e8ap-scroll"><table class="e8ap-table"><thead><tr><th scope="col">${esc(L("Skill", "Destreza"))}</th><th scope="col">${esc(L("Where I am", "Dónde voy"))}</th><th scope="col">${esc(L("On my own", "Yo solo"))}</th><th scope="col">${esc(L("With help", "Con ayuda"))}</th><th scope="col">${esc(L("Remembering", "Recordar"))}</th><th scope="col">${esc(L("New situations", "Situaciones nuevas"))}</th><th scope="col">${esc(L("Next step", "Siguiente paso"))}</th></tr></thead><tbody>${rows}</tbody></table></div><p class="e8ap-count">${esc(L("These are learning signals for practice, not a grade. Speed is never used.", "Son señales de aprendizaje para practicar, no una nota. Nunca se usa la velocidad."))}</p></details>`;
}

// ---------------------------------------------------------------- Mistake Repair Studio
export function mountRepairStudio(host, ctx) {
  const { tutor, store, onRecord, grade } = ctx;
  const open = tutor.mistakes
    .filter(
      (m) =>
        !m.resolvedAt &&
        m.original &&
        findSkill(m.key) &&
        findSkill(m.key).grade === Number(grade),
    )
    .slice(0, 6);
  host.innerHTML = `<section class="e8ap e8rs" aria-labelledby="e8rs-title"><h3 id="e8rs-title">${esc(L("Repair studio", "Estudio de reparación"))}</h3><p class="e8ap-intro">${esc(L("Pick a mistake. You will look at it, see why it happens in a model, fix the idea, and then solve a new problem on your own.", "Elige un error. Lo mirarás, verás por qué pasa en un modelo, corregirás la idea y luego resolverás un problema nuevo tú solo."))}</p>${open.length ? `<ul class="e8rs-list">${open.map((m, i) => `<li><span class="e8rs-q">${esc(m.question)}</span> <span class="e8ap-count">${esc(L("You wrote", "Escribiste"))}: ${esc(m.submitted)}</span> <button type="button" class="e8ap-btn" data-e8rs="${i}">${esc(L("Repair this", "Repararlo"))}</button></li>`).join("")}</ul>` : `<p>${esc(L("No open mistakes for this grade. Nice work!", "No hay errores abiertos en este grado. ¡Buen trabajo!"))}</p>`}<div class="e8ap-stage" aria-live="polite"></div></section>`;
  const stage = host.querySelector(".e8ap-stage");
  host.onclick = (event) => {
    const b = event.target.closest("[data-e8rs]");
    if (!b) return;
    const m = open[Number(b.dataset.e8rs)];
    const skill = findSkill(m.key);
    const analysis = analyzeResponse({
      skill,
      question: m.question,
      answers: m.original.answers,
      response: m.submitted,
    });
    runRepair(
      stage,
      new RepairStudio({
        original: {
          skill,
          question: m.question,
          response: m.submitted,
          answers: m.original.answers,
        },
        diagnosis: analysis,
        seed: (Date.now() % 9973) + 1,
      }),
      {
        tutor,
        store,
        onRecord,
        entry: m,
        redo: () => mountRepairStudio(host, ctx),
      },
    );
  };
}

function runRepair(stage, studio, { tutor, store, onRecord, entry, redo }) {
  const paint = () => {
    const step = studio.step;
    const dots = `<p class="e8ap-count" aria-label="${esc(L("Step", "Paso"))}">${esc(L("Step", "Paso"))} ${Math.min(studio.index + 1, 6)} / 6</p>`;
    if (step === "review") {
      const v = studio.reviewView();
      stage.innerHTML = `${dots}<h4>${esc(L("Look at your work", "Mira tu trabajo"))}</h4><p class="e8ap-prompt">${esc(v.question)}</p><p>${esc(L("You wrote", "Escribiste"))}: <strong>${esc(v.response)}</strong></p><button type="button" class="e8ap-btn e8ap-primary" data-next>${esc(L("What happened?", "¿Qué pasó?"))}</button>`;
      stage.querySelector("[data-next]").onclick = () => {
        studio.index = 1;
        paint();
      };
    } else if (step === "identify") {
      stage.innerHTML = `${dots}<h4>${esc(L("What do you think happened?", "¿Qué crees que pasó?"))}</h4><div class="e8ap-col">${studio
        .identifyOptions()
        .map(
          (o) =>
            `<button type="button" class="e8ap-btn" data-id="${esc(o.id)}">${esc(pick(o.text))}</button>`,
        )
        .join("")}</div>`;
      stage.querySelectorAll("[data-id]").forEach(
        (b) =>
          (b.onclick = () => {
            studio.identify(b.dataset.id);
            paint();
          }),
      );
    } else if (step === "counterexample") {
      const c = studio.counterexample();
      const model = c.model && getModel(c.model);
      stage.innerHTML = `${dots}<h4>${esc(L("See why", "Mira por qué"))}</h4><p>${esc(pick(c.statement))}</p><div class="e8rs-model"></div><button type="button" class="e8ap-btn e8ap-primary" data-next>${esc(L("I see why", "Ya veo por qué"))}</button>`;
      if (model) {
        const engine = new MathVisualEngine(
          c.model,
          model.generate(seeded(7), studio.original.skill.grade),
        );
        stage.querySelector(".e8rs-model").innerHTML =
          `${engine.render()}<p class="e8ap-count">${esc(pick(engine.derive().verbal))}</p>`;
      }
      stage.querySelector("[data-next]").onclick = () => {
        studio.confirmCounterexample();
        paint();
      };
    } else if (step === "strategy") {
      stage.innerHTML = `${dots}<h4>${esc(L("Which idea fixes it?", "¿Qué idea lo corrige?"))}</h4><div class="e8ap-col">${studio
        .strategyOptions()
        .map(
          (o) =>
            `<button type="button" class="e8ap-btn" data-s="${esc(o.id)}">${esc(pick(o.text))}</button>`,
        )
        .join("")}</div><p class="e8ap-why" role="status"></p>`;
      stage.querySelectorAll("[data-s]").forEach(
        (b) =>
          (b.onclick = () => {
            const r = studio.chooseStrategy(b.dataset.s);
            if (r.ok) paint();
            else
              stage.querySelector(".e8ap-why").textContent = pick(r.feedback);
          }),
      );
    } else if (step === "explain") {
      stage.innerHTML = `${dots}<h4>${esc(L("Say what you will do differently", "Di qué harás distinto"))}</h4><label class="e8ap-label" for="e8rs-x">${esc(L("Your explanation", "Tu explicación"))}</label><textarea id="e8rs-x" rows="3" class="e8ap-input"></textarea><button type="button" class="e8ap-btn e8ap-primary" data-next>${esc(L("Save", "Guardar"))}</button><p class="e8ap-why" role="status"></p>`;
      stage.querySelector("[data-next]").onclick = () => {
        const r = studio.explain(stage.querySelector("#e8rs-x").value);
        if (r.ok) paint();
        else stage.querySelector(".e8ap-why").textContent = pick(r.feedback);
      };
    } else if (step === "fresh") {
      stage.innerHTML = `${dots}<h4>${esc(L("Now try a new one on your own", "Ahora prueba uno nuevo tú solo"))}</h4><p class="e8ap-prompt">${esc(studio.fresh.question)}</p><label class="e8ap-label" for="e8rs-f">${esc(L("Your answer", "Tu respuesta"))}</label><div class="e8ap-row"><input id="e8rs-f" class="e8ap-input" autocomplete="off"><button type="button" class="e8ap-btn e8ap-primary" data-go>${esc(L("Check", "Comprobar"))}</button><button type="button" class="e8ap-btn" data-hint>${esc(L("Hint", "Pista"))}</button></div><p class="e8ap-why" role="status"></p>`;
      const why = stage.querySelector(".e8ap-why");
      stage.querySelector("[data-hint]").onclick = () => {
        why.textContent = pick(studio.freshHint());
      };
      stage.querySelector("[data-go]").onclick = () => {
        const r = studio.answerFresh(stage.querySelector("#e8rs-f").value);
        if (r.ok || r.revisit || studio.step === "done") paint();
        else paint();
      };
    } else {
      const ev = studio.evidence();
      const skill = studio.original.skill;
      for (const rec of ev.records)
        recordAnswer(tutor, skill, {
          correct: rec.correct,
          independent: rec.independent,
          level: rec.level,
          sig: rec.sig,
        });
      store.update((s) => {
        if (ev.markRepaired) markRepaired(s.misconceptions, ev.misconception);
        if (ev.independent) addSkillEvent(s, ev.skill, "transfer");
        addSkillEvent(s, ev.skill, "explained");
        saveRepair(s, {
          id: `${Date.now()}`,
          skill: ev.skill,
          at: Date.now(),
          freshCorrect: ev.resolved,
          independent: ev.independent,
          attempts: ev.attempts,
          resolved: ev.resolved,
        });
      });
      entry.e8Repair = ev.resolved ? "repaired" : "revisit";
      onRecord?.();
      stage.innerHTML = `<div class="e8ap-result"><h4>${esc(ev.resolved ? L("Repaired!", "¡Reparado!") : L("Let's come back to this tomorrow.", "Volvamos a esto mañana."))}</h4><p>${esc(ev.independent ? L("You solved the new problem on your own. That counts as independent work.", "Resolviste el problema nuevo tú solo. Cuenta como trabajo independiente.") : ev.resolved ? L("You fixed it with some help. Try another one later to show it on your own.", "Lo corregiste con algo de ayuda. Prueba otro más tarde para mostrarlo tú solo.") : L("It is okay. This idea takes time.", "Está bien. Esta idea lleva tiempo."))}</p><button type="button" class="e8ap-btn" data-again>${esc(L("Back to my mistakes", "Volver a mis errores"))}</button></div>`;
      stage.querySelector("[data-again]").onclick = redo;
    }
  };
  paint();
}
