// Runs a planned family session: activities in order inside the shared shell, a calm step between them, one completion
// screen, and exactly one store.recordSession. The session record (page-kit.js) survives a reload, so a family can
// close the tab mid-session and continue at the right activity and round. No clocks on screen: minutes are measured
// quietly and shown only at the end. @fm2 FM-003 FM-004 FM-005 FM-026 FM-027 FM-034 FM-030
import {
  KIT,
  keepUrl,
  loadAvailable,
  playUrl,
  homeUrl,
  progressUrl,
  readSession,
  starsHtml,
  suggestLevel,
  switchLanguage,
  t,
  writeSession,
} from "./page-kit.js";
import { escapeHtml as esc, getLang, L } from "./lang.js";
import { recommend, reasonText } from "./recommend.js";
import { seedFrom } from "./rng.js";
import { encodePlan, planSession } from "./session.js";
import { startActivity, starCount } from "./shell.js";

const c = (en, es) => ({ en, es });
const U = {
  step: c("Activity {n} of {total}", "Actividad {n} de {total}"),
  next: c("Next: {game} — {skill}", "Siguiente: {game} — {skill}"),
  go: c("Go", "Vamos"),
  left: c("About {n} min left in this session.", "Quedan unos {n} min en esta sesión."),
  last: c(
    "Last activity: {correct} of {total} solved.",
    "Última actividad: {correct} de {total} resueltos.",
  ),
  stop: c("Stop for now", "Parar por ahora"),
  stopNote: c(
    "Your place is saved on this device.",
    "Tu lugar queda guardado en este dispositivo.",
  ),
  duoTitle: c("Playing together", "Jugar juntos"),
  duoRoles: c(
    "Learner and Caregiver take turns. The learner solves round 1, the caregiver solves round 2, and so on. The other person asks the coaching question.",
    "Estudiante y Familiar se turnan. El estudiante resuelve la ronda 1, el familiar la ronda 2, y así sigue. La otra persona hace la pregunta de apoyo.",
  ),
  done: c("Session complete!", "¡Sesión completa!"),
  doneLead: c("Here is what you did together.", "Esto es lo que hicieron."),
  solved: c("Solved", "Resueltos"),
  ofTotal: c("{correct} of {total}", "{correct} de {total}"),
  minutes: c("Minutes", "Minutos"),
  skills: c("Skills practiced", "Destrezas practicadas"),
  savedLocal: c("This session’s results are saved on this device. These practice counts do not show mastery.", "Los resultados de esta sesión se guardan en este dispositivo. Estas cantidades de práctica no indican dominio."),
  notSaved: c("This browser could not save the result. You can still finish, but it may not be remembered after you close this page.", "Este navegador no pudo guardar el resultado. Pueden terminar, pero quizá no se recuerde al cerrar esta página."),
  tryNext: c("What to try next", "Qué probar después"),
  tryIt: c("Try it", "Probar"),
  reflect: c("Family reflection", "Reflexión en familia"),
  again: c("Practice again", "Practicar otra vez"),
  home: c("Back to family math", "Volver a matemáticas en familia"),
  progress: c("My progress", "Mi progreso"),
  perActivity: c("{correct} of {rounds} solved", "{correct} de {rounds} resueltos"),
  list: c("Activities in this session", "Actividades de esta sesión"),
};

const MAX_OVERRUN = 1.2;
const asSeed = (value) => Math.abs(Math.round(value)) % 4294967295;

export async function runSession({
  root,
  plan,
  planCode,
  games,
  store,
  coach,
  profile,
  resume = false,
  seed = null,
  onExit,
  onPageLanguage = () => {},
}) {
  const byId = new Map(games.map((game) => [game.id, game]));
  const total = plan.activities.length;
  let lang = getLang();
  let activity = null;
  let view = "play";
  let recorded = false;
  const everything = loadAvailable();

  let session = resume ? readSession(profile) : null;
  const continuing = Boolean(session && session.plan === planCode);
  if (!continuing) {
    session = {
      v: 1,
      plan: planCode,
      sid: String(Date.now()),
      step: 0,
      seed: seed ?? asSeed(Date.now()),
      startedAt: Date.now(),
      activeMs: 0,
      minutes: 0,
      summaries: [],
      finished: false,
      recorded: false,
    };
  }

  let mark = document.hidden ? null : Date.now();
  const bank = () => {
    if (mark === null) return;
    session.activeMs += Date.now() - mark;
    mark = Date.now();
  };
  const save = () => {
    bank();
    writeSession(profile, session);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      save();
      mark = null;
    } else mark = Date.now();
  });
  window.addEventListener("pagehide", save);

  const stepSeed = (step) =>
    seedFrom(session.seed, step, plan.activities[step].gameId, plan.activities[step].skillId);
  const resumeRecord = (step) => {
    const a = plan.activities[step];
    return {
      gameId: a.gameId,
      skillId: a.skillId,
      grade: plan.grade,
      level: a.level,
      seed: stepSeed(step),
      rounds: a.rounds,
      index: 0,
      mode: plan.mode,
      results: [],
      plan: planCode,
      step,
    };
  };
  const names = (step) => {
    const a = plan.activities[step];
    const game = byId.get(a.gameId);
    return { a, game, skill: game.skills.find((s) => s.id === a.skillId) };
  };

  // ---- one activity inside the shell -------------------------------------------------------------------------------
  function play(step) {
    view = "play";
    const { a, game } = names(step);
    const saved = store.state.resume;
    const inside =
      continuing &&
      saved &&
      saved.plan === planCode &&
      saved.step === step &&
      saved.gameId === a.gameId &&
      saved.skillId === a.skillId;
    // Each game ships its own stylesheet; a planned session must load it just as a single activity does.
    if (!document.querySelector(`link[data-fm2-game="${game.id}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = game.cssHref;
      link.dataset.fm2Game = game.id;
      document.head.append(link);
    }
    activity = startActivity({
      root,
      game,
      store,
      coach,
      grade: plan.grade,
      skillId: a.skillId,
      level: inside ? saved.level : a.level,
      rounds: inside ? saved.rounds : a.rounds,
      seed: inside ? saved.seed : stepSeed(step),
      index: inside ? saved.index : 0,
      results: inside ? saved.results : [],
      mode: plan.mode,
      lang,
      plan: planCode,
      step,
      showSummary: false,
      onLanguage: (next) => {
        lang = next;
        onPageLanguage(next);
      },
      onFinish: (done) => finished(step, done),
      onExit: () => {
        save();
        onExit();
      },
    });
    save();
  }

  function finished(step, done) {
    if (session.step > step) return;
    activity?.destroy();
    activity = null;
    const a = plan.activities[step];
    session.summaries[step] = {
      gameId: a.gameId,
      skillId: a.skillId,
      level: a.level,
      role: a.role,
      rounds: done.rounds,
      correct: done.correct,
      hints: done.hints,
      stars: starCount(done.correct, done.rounds),
    };
    session.step = step + 1;
    save();
    if (session.step < total) between(session.step);
    else complete();
  }

  // ---- the step between activities ---------------------------------------------------------------------------------
  function between(step) {
    view = `between:${step}`;
    store.saveResume(resumeRecord(step));
    const { a, game, skill } = names(step);
    const previous = session.summaries[step - 1];
    const minutes = Math.max(
      1,
      Math.ceil(plan.activities.slice(step).reduce((sum, x) => sum + x.estSec, 0) / 60),
    );
    const other = lang === "en" ? "es" : "en";
    const together = plan.mode === "together";
    root.innerHTML = `<section class="fm2-card sr-card" data-testid="session-between" data-step="${step}" aria-labelledby="sr-title">
      <p class="fm2-eyebrow">${esc(t(U.step, lang, { n: step + 1, total }))}</p>
      <h1 id="sr-title" tabindex="-1" data-testid="session-next">${esc(t(U.next, lang, { game: L(game.title, lang), skill: L(skill.title, lang) }))}</h1>
      <div class="sr-next"><span class="pk-ico" aria-hidden="true">${game.icon}</span><span class="pk-chip pk-chip-${a.role}">${esc(t(KIT.roles[a.role], lang))}</span><span class="pk-chip">${esc(t(KIT.levels, lang, { n: a.level }))}</span></div>
      ${previous ? `<p class="sr-note">${esc(t(U.last, lang, { correct: previous.correct, total: previous.rounds }))} ${starsHtml(previous.stars, lang)}</p>` : ""}
      <p class="sr-note" data-testid="session-left">${esc(t(U.left, lang, { n: minutes }))}</p>
      ${together ? `<div class="sr-block" data-testid="session-together"><h2>${esc(t(U.duoTitle, lang))}</h2><p>${esc(t(U.duoRoles, lang))}</p><p>${esc(L(game.together, lang))}</p></div>` : ""}
      <div class="sr-actions">
        <button type="button" class="fm2-btn fm2-btn-primary" data-act="go" data-testid="session-go">${esc(t(U.go, lang))}</button>
        <button type="button" class="fm2-btn fm2-btn-quiet" data-act="lang" lang="${other}" data-testid="session-lang">${other === "es" ? "Español" : "English"}</button>
        <button type="button" class="fm2-btn fm2-btn-quiet" data-act="stop" data-testid="session-stop">${esc(t(U.stop, lang))}</button>
      </div>
      <p class="sr-note">${esc(t(U.stopNote, lang))}</p></section>`;
    root.querySelector("h1").focus({ preventScroll: true });
  }

  // ---- completion --------------------------------------------------------------------------------------------------
  async function complete() {
    view = "done";
    if (!recorded && !session.recorded) {
      recorded = true;
      const wall = session.activeMs / 60000;
      session.minutes = Math.max(1, Math.round(Math.min(wall, (plan.estSec * MAX_OVERRUN) / 60)));
      session.finished = true;
      session.recorded = true;
      save();
      const done = session.summaries.filter(Boolean);
      store.recordSession({
        grade: plan.grade,
        minutes: session.minutes,
        correct: done.reduce((n, s) => n + s.correct, 0),
        total: done.reduce((n, s) => n + s.rounds, 0),
        games: [...new Set(done.map((s) => s.gameId))],
        mode: plan.mode,
      });
    }
    store.clearResume();
    const { games: all } = await everything;
    const next =
      recommend({ state: store.state, grade: plan.grade, games: all, limit: 1 })[0] || null;
    const again = planSession({
      grade: plan.grade,
      minutes: plan.minutes,
      mode: plan.mode,
      state: store.state,
      games: all,
      seed: asSeed(Date.now()),
    });
    const code = again.activities.length ? encodePlan(again) : null;
    drawComplete({ next, code, all, saved: store.persistenceAvailable });
  }

  function drawComplete(extra) {
    const { next, code, all, saved } = extra;
    const done = session.summaries.filter(Boolean);
    const correct = done.reduce((n, s) => n + s.correct, 0);
    const rounds = done.reduce((n, s) => n + s.rounds, 0);
    const other = lang === "en" ? "es" : "en";
    const rows = done.map((s) => {
      const game = byId.get(s.gameId);
      const skill = game.skills.find((x) => x.id === s.skillId);
      return `<li data-testid="session-activity" data-game="${s.gameId}" data-stars="${s.stars}"><span class="pk-ico" aria-hidden="true">${game.icon}</span><span><strong>${esc(L(skill.title, lang))}</strong><small>${esc(L(game.title, lang))} · ${esc(t(KIT.roles[s.role], lang))}</small></span><span class="sr-score">${starsHtml(s.stars, lang)}<br><small>${esc(t(U.perActivity, lang, { correct: s.correct, rounds: s.rounds }))}</small></span></li>`;
    });
    const skills = [
      ...new Map(
        done.map((s) => [
          `${s.gameId}:${s.skillId}`,
          byId.get(s.gameId).skills.find((x) => x.id === s.skillId),
        ]),
      ).values(),
    ];
    let nextBlock = "";
    if (next) {
      const game = all.find((g) => g.id === next.gameId);
      const skill = game?.skills.find((s) => s.id === next.skillId);
      if (skill) {
        const href = playUrl({
          game: game.id,
          skill: skill.id,
          level: suggestLevel(store, game.id, skill, plan.grade),
          grade: plan.grade,
          profile,
          lang,
          mode: plan.mode,
        });
        nextBlock = `<div class="sr-block" data-testid="session-recommendation"><h2>${esc(t(U.tryNext, lang))}</h2><p><strong>${esc(L(skill.title, lang))}</strong> · ${esc(L(game.title, lang))}</p><p>${esc(reasonText(next, lang))}</p><a class="fm2-btn" href="${href}" data-testid="session-try">${esc(t(U.tryIt, lang))}</a></div>`;
      }
    }
    const reflection = plan.reflection
      ? `<div class="sr-block sr-reflect" data-testid="session-reflection"><h2>${esc(t(U.reflect, lang))}</h2><p>${esc(L(plan.reflection, lang))}</p></div>`
      : "";
    const againLink = code
      ? `<a class="fm2-btn fm2-btn-primary" href="${playUrl({ plan: code, grade: plan.grade, profile, lang, mode: plan.mode })}" data-testid="session-again">${esc(t(U.again, lang))}</a>`
      : "";
    root.innerHTML = `<div class="sr-done" data-testid="session-complete">
      <section class="fm2-card sr-card" aria-labelledby="sr-title"><p class="fm2-eyebrow">${esc(t(KIT.family, lang))}</p>
      <h1 id="sr-title" tabindex="-1">${esc(t(U.done, lang))}</h1><p class="sr-note">${esc(t(U.doneLead, lang))}</p>
      <div class="sr-stats"><div class="sr-stat"><b data-testid="session-correct">${esc(t(U.ofTotal, lang, { correct, total: rounds }))}</b><span>${esc(t(U.solved, lang))}</span></div>
      <div class="sr-stat"><b data-testid="session-minutes">${session.minutes}</b><span>${esc(t(U.minutes, lang))}</span></div>
      <div class="sr-stat"><b data-testid="session-skill-count">${skills.length}</b><span>${esc(t(U.skills, lang))}</span></div></div>
      <ul class="sr-acts" data-testid="session-skills" aria-label="${esc(t(U.list, lang))}">${rows.join("")}</ul>
      <p class="sr-note" data-testid="session-save-status">${esc(t(saved ? U.savedLocal : U.notSaved, lang))}</p>
      ${nextBlock}${reflection}
      <div class="sr-actions">${againLink}<a class="fm2-btn" href="${homeUrl({ grade: plan.grade, profile, lang })}" data-testid="session-home">${esc(t(U.home, lang))}</a>
      <a class="fm2-btn" href="${progressUrl({ grade: plan.grade, profile, lang })}" data-testid="session-progress">${esc(t(U.progress, lang))}</a>
      <button type="button" class="fm2-btn fm2-btn-quiet" data-act="lang" lang="${other}" data-testid="session-lang">${other === "es" ? "Español" : "English"}</button></div></section></div>`;
    root.querySelector("h1").focus({ preventScroll: true });
  }

  // ---- events on the screens this file draws (the shell wires its own) ---------------------------------------------
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-act]");
    if (!button) return;
    if (button.dataset.act === "go") play(session.step);
    else if (button.dataset.act === "stop") {
      save();
      onExit();
    } else if (button.dataset.act === "lang") {
      lang = switchLanguage(lang);
      if (view === "done") complete();
      else between(session.step);
    }
  });

  keepUrl({ resume: 1 });
  if (session.finished && session.recorded) complete();
  else if (session.step >= total) complete();
  else if (
    session.step > 0 &&
    !(
      continuing &&
      store.state.resume?.plan === planCode &&
      store.state.resume?.step === session.step
    )
  )
    between(session.step);
  else play(session.step);
}
