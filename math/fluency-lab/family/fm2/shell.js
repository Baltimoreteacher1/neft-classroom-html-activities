// The game shell: one frame, one set of behaviors, ten different games inside it.
// It owns rounds, hints, attempts, feedback, progress recording, language switching, resume and the finish screen,
// so every game gets identical, tested behavior and only supplies its own mathematics and interaction.
// @fm2 FM-031 FM-032 FM-033 FM-034 FM-021 FM-026 FM-037 FM-027
import { escapeHtml, getLang, L, setLang, tx } from "./lang.js";
import { makeRng, seedFrom } from "./rng.js";

const UI = {
  back: { en: "Back", es: "Volver" },
  howTo: { en: "How to play", es: "Cómo se juega" },
  close: { en: "Got it", es: "Entendido" },
  hint: { en: "Hint", es: "Pista" },
  showMe: { en: "Show me", es: "Mostrar" },
  restartRound: { en: "Reset this puzzle", es: "Reiniciar este reto" },
  startOver: { en: "Start over", es: "Empezar de nuevo" },
  next: { en: "Next", es: "Siguiente" },
  finish: { en: "Finish", es: "Terminar" },
  round: { en: "Round {n} of {total}", es: "Ronda {n} de {total}" },
  correct: { en: "Correct!", es: "¡Correcto!" },
  notYet: { en: "Not yet. Try again.", es: "Todavía no. Inténtalo otra vez." },
  revealed: {
    en: "Here is a worked answer. Read it, then go on.",
    es: "Aquí hay una respuesta resuelta. Léela y sigue.",
  },
  greatWork: { en: "Nice work!", es: "¡Buen trabajo!" },
  summary: {
    en: "{correct} of {total} solved on your own steam or with a hint.",
    es: "{correct} de {total} resueltos con tu esfuerzo o con una pista.",
  },
  playAgain: { en: "Play again", es: "Jugar otra vez" },
  home: { en: "Back to family math", es: "Volver a matemáticas en familia" },
  stars: { en: "{n} of 3 stars", es: "{n} de 3 estrellas" },
  language: { en: "Español", es: "English" },
  hintLabel: { en: "Hint {n}", es: "Pista {n}" },
  learner: { en: "Learner", es: "Estudiante" },
  caregiver: { en: "Caregiver", es: "Familiar" },
  talk: { en: "Talk about it", es: "Conversen" },
  progressLabel: { en: "Round progress", es: "Progreso de las rondas" },
  roundSolved: { en: "Solved", es: "Resuelta" },
  roundRevealed: { en: "Shown", es: "Mostrada" },
  roundOpen: { en: "Not yet played", es: "Sin jugar" },
};
const u = (key, lang, vars) => tx(UI[key], lang, vars);

export const MAX_HINTS = 3;
export const REVEAL_AFTER = 3;

export function starCount(correct, total) {
  if (!total) return 0;
  const share = correct / total;
  return share >= 0.9 ? 3 : share >= 0.7 ? 2 : share >= 0.4 ? 1 : 0;
}

export function startActivity(options) {
  const {
    root,
    game,
    store,
    grade,
    skillId,
    level = 1,
    rounds = 5,
    mode = "solo",
    coach = null,
    showSummary = true,
    onFinish = () => {},
    onExit = () => {},
  } = options;
  let { seed = seedFrom(Date.now(), game.id, skillId), index = 0 } = options;
  const results = [...(options.results || [])];
  let lang = options.lang || getLang();
  let live = null;
  let round = null;
  let mounted = null;
  let tools = { attempts: 0, hints: 0, solved: false, revealed: false, started: 0 };
  let destroyed = false;
  const skill = game.skills.find((s) => s.id === skillId);
  if (!skill) throw new RangeError(`Unknown skill ${skillId} for ${game.id}`);

  root.innerHTML = `
    <section class="fm2-shell" data-fm2-shell data-game="${game.id}">
      <header class="fm2-shell-head">
        <button type="button" class="fm2-btn fm2-btn-quiet" data-fm2-exit></button>
        <div class="fm2-shell-title"><span class="fm2-shell-icon" aria-hidden="true">${game.icon}</span><div><h1 data-fm2-title></h1><p data-fm2-skill></p></div></div>
        <div class="fm2-shell-actions"><button type="button" class="fm2-btn fm2-btn-quiet" data-fm2-howto></button><button type="button" class="fm2-btn fm2-btn-quiet" data-fm2-lang></button></div>
      </header>
      <div class="fm2-progress-row"><ol class="fm2-dots" data-fm2-dots></ol><p class="fm2-round-label" data-fm2-round></p></div>
      <div class="fm2-turn" data-fm2-turn hidden></div>
      <div class="fm2-play">
        <h2 class="fm2-prompt" data-fm2-prompt tabindex="-1"></h2>
        <div class="fm2-stage" data-fm2-stage></div>
        <div class="fm2-hintbox" data-fm2-hintbox hidden></div>
        <div class="fm2-feedback" data-fm2-feedback role="status" aria-live="polite"></div>
        <div class="fm2-explain" data-fm2-explain hidden></div>
      </div>
      <div class="fm2-toolbar">
        <button type="button" class="fm2-btn" data-fm2-hint></button>
        <button type="button" class="fm2-btn" data-fm2-showme hidden></button>
        <button type="button" class="fm2-btn fm2-btn-quiet" data-fm2-reset></button>
        <button type="button" class="fm2-btn fm2-btn-quiet" data-fm2-restart></button>
        <button type="button" class="fm2-btn fm2-btn-primary" data-fm2-next hidden></button>
      </div>
      <dialog class="fm2-dialog" data-fm2-dialog aria-labelledby="fm2-howto-title"><h2 id="fm2-howto-title" data-fm2-howto-title></h2><ol data-fm2-howto-steps></ol><p data-fm2-together></p><button type="button" class="fm2-btn fm2-btn-primary" data-fm2-dialog-close></button></dialog>
      <div class="fm2-sr" data-fm2-announce role="status" aria-live="polite"></div>
    </section>
    <section class="fm2-finish" data-fm2-finish hidden></section>`;

  const $ = (name) => root.querySelector(`[data-fm2-${name}]`);
  const el = Object.fromEntries(
    [
      "exit",
      "title",
      "skill",
      "howto",
      "lang",
      "dots",
      "round",
      "turn",
      "prompt",
      "stage",
      "hintbox",
      "feedback",
      "explain",
      "hint",
      "showme",
      "reset",
      "restart",
      "next",
      "dialog",
      "howto-title",
      "howto-steps",
      "together",
      "dialog-close",
      "announce",
      "finish",
      "shell",
    ].map((n) => [n, $(n)]),
  );

  const announce = (text) => {
    el.announce.textContent = "";
    setTimeout(() => {
      el.announce.textContent = text;
    }, 30);
  };

  function labels() {
    el.exit.textContent = `← ${u("back", lang)}`;
    el.title.textContent = L(game.title, lang);
    el.skill.textContent = L(skill.title, lang);
    el.howto.textContent = u("howTo", lang);
    el.lang.textContent = u("language", lang);
    el.lang.lang = lang === "en" ? "es" : "en";
    el.hint.textContent = hintLabel();
    el.showme.textContent = u("showMe", lang);
    el.reset.textContent = u("restartRound", lang);
    el.restart.textContent = u("startOver", lang);
    el.next.textContent = index + 1 >= rounds ? u("finish", lang) : u("next", lang);
    el["howto-title"].textContent = `${L(game.title, lang)}: ${u("howTo", lang)}`;
    el["howto-steps"].innerHTML = game.howTo[lang]
      .map((step) => `<li>${escapeHtml(step)}</li>`)
      .join("");
    el.together.textContent = mode === "together" ? L(game.together, lang) : "";
    el["dialog-close"].textContent = u("close", lang);
    el.round.textContent = u("round", lang, { n: index + 1, total: rounds });
    drawDots();
    drawTurn();
  }

  const hintLabel = () =>
    tools.hints >= MAX_HINTS
      ? u("hintLabel", lang, { n: MAX_HINTS })
      : tools.hints === 0
        ? u("hint", lang)
        : u("hintLabel", lang, { n: tools.hints + 1 });

  function drawDots() {
    el.dots.setAttribute("aria-label", u("progressLabel", lang));
    el.dots.innerHTML = Array.from({ length: rounds }, (_, i) => {
      const done = results[i];
      const state = i === index ? "current" : done ? (done.revealed ? "shown" : "done") : "open";
      const text = done
        ? done.revealed
          ? u("roundRevealed", lang)
          : u("roundSolved", lang)
        : i === index
          ? u("round", lang, { n: i + 1, total: rounds })
          : u("roundOpen", lang);
      return `<li class="fm2-dot fm2-dot-${state}" ${i === index ? 'aria-current="step"' : ""}><span class="fm2-sr">${escapeHtml(text)}</span><span aria-hidden="true">${done ? (done.revealed ? "•" : "✓") : i + 1}</span></li>`;
    }).join("");
  }

  function drawTurn() {
    const turn =
      mode === "together" && coach ? coach.turn({ index, game, skill, grade, lang }) : null;
    el.turn.hidden = !turn;
    if (turn)
      el.turn.innerHTML = `<strong class="fm2-role fm2-role-${turn.role}">${escapeHtml(u(turn.role, lang))}</strong><span>${escapeHtml(L(turn.prompt, lang))}</span>`;
  }

  // Feedback is stored as copy so a language switch can render it again in the new language.
  let feedbackNow = null;
  const lockListeners = [];
  const feedbackText = () => (feedbackNow ? `${feedbackNow.lead ? u(feedbackNow.lead, lang) : ""} ${feedbackNow.copy ? L(feedbackNow.copy, lang) : ""}`.trim() : "");
  function showFeedback(kind, lead, copy) {
    feedbackNow = kind ? { kind, lead, copy } : null;
    setFeedback(kind, feedbackText());
  }

  function setFeedback(kind, text) {
    el.feedback.className = `fm2-feedback fm2-feedback-${kind}`;
    el.feedback.innerHTML = text
      ? `<span class="fm2-feedback-icon" aria-hidden="true">${kind === "good" ? "✓" : kind === "info" ? "i" : "!"}</span><span>${escapeHtml(text)}</span>`
      : "";
  }

  function showHint(tier) {
    const text = L(game.hint(round, tier, null), lang);
    el.hintbox.hidden = false;
    el.hintbox.innerHTML = `<strong>${escapeHtml(u("hintLabel", lang, { n: Math.min(tier, 2) + 1 }))}</strong> <span>${escapeHtml(text)}</span>`;
    el.hintbox.dataset.tier = String(tier);
    announce(text);
  }

  function finishRound(revealed) {
    tools.solved = !revealed;
    tools.revealed = revealed;
    for (const callback of lockListeners.splice(0)) callback({ solved: !revealed, revealed });
    store.recordRound({
      gameId: game.id,
      skillId,
      level,
      correct: !revealed,
      hints: Math.min(tools.hints, MAX_HINTS),
    });
    el.hint.hidden = true;
    el.showme.hidden = true;
    el.next.hidden = false;
    el.next.textContent = index + 1 >= rounds ? u("finish", lang) : u("next", lang);
    el.next.focus();
    if (mode === "together" && coach) {
      const prompt = coach.explain({ game, skill, grade, lang, round });
      el.explain.hidden = false;
      el.explain.innerHTML = `<strong>${escapeHtml(u("talk", lang))}</strong> <span>${escapeHtml(L(prompt, lang))}</span>`;
    }
  }

  function submit(response) {
    if (tools.solved || tools.revealed)
      return { correct: tools.solved, locked: true, attempts: tools.attempts };
    const result = game.check(round, response);
    // A game may report a miss that is just exploration (a memory flip) with `neutral: true`: it gets feedback
    // but does not count toward the Show me threshold.
    if (!(result.neutral && !result.correct)) tools.attempts += 1;
    if (result.correct) {
      showFeedback("good", "correct", result.feedback);
      announce(u("correct", lang));
      finishRound(false);
    } else {
      showFeedback("try", "notYet", result.feedback);
      announce(L(result.feedback, lang) || u("notYet", lang));
      if (tools.attempts >= REVEAL_AFTER || tools.hints >= MAX_HINTS) el.showme.hidden = false;
    }
    return { ...result, attempts: tools.attempts };
  }

  function mountRound() {
    mounted?.destroy?.();
    el.stage.innerHTML = "";
    el.prompt.textContent = L(round.prompt, lang);
    const context = {
      round,
      lang,
      mode,
      grade,
      level,
      index,
      total: rounds,
      skill,
      submit,
      announce,
      locked: () => tools.solved || tools.revealed,
      // Called once when the round ends by a correct answer OR by Show me, so a game can freeze its controls.
      onLock: (callback) => lockListeners.push(callback),
    };
    lockListeners.length = 0;
    mounted = game.mount(el.stage, context) || null;
  }

  function begin(at) {
    index = at;
    round = game.makeRound(
      skillId,
      level,
      makeRng(seedFrom(seed, game.id, skillId, level, index)),
      grade,
    );
    tools = { attempts: 0, hints: 0, solved: false, revealed: false, started: Date.now() };
    el.hintbox.hidden = true;
    el.explain.hidden = true;
    el.hint.hidden = false;
    el.hint.disabled = false;
    el.showme.hidden = true;
    el.next.hidden = true;
    showFeedback("", "", null);
    labels();
    mountRound();
    el.prompt.focus({ preventScroll: true });
    window.__fm2 = {
      game,
      round,
      grade,
      level,
      skillId,
      index,
      results,
      solve: () => game.solve(round),
      submit,
      next: () => el.next.click(),
      get tools() {
        return tools;
      },
    };
    store.saveResume({
      gameId: game.id,
      skillId,
      grade,
      level,
      seed,
      rounds,
      index,
      mode,
      results,
      plan: options.plan || "",
      step: options.step || 0,
    });
  }

  function summary() {
    const correct = results.filter((r) => r.correct).length;
    const hints = results.reduce((n, r) => n + r.hints, 0);
    const stars = starCount(correct, results.length);
    return {
      gameId: game.id,
      skillId,
      grade,
      level,
      rounds: results.length,
      correct,
      hints,
      stars,
      results: [...results],
      mode,
    };
  }

  function finish() {
    const done = summary();
    store.completeActivity({ gameId: game.id, correct: done.correct, total: done.rounds });
    store.clearResume();
    mounted?.destroy?.();
    if (!showSummary) {
      onFinish(done);
      return;
    }
    el.shell.hidden = true;
    el.finish.hidden = false;
    const draw = () => {
      el.finish.innerHTML = `<div class="fm2-finish-card"><p class="fm2-eyebrow">${escapeHtml(L(game.title, lang))}</p><h1 tabindex="-1">${escapeHtml(u("greatWork", lang))}</h1>
        <p class="fm2-stars" role="img" aria-label="${escapeHtml(u("stars", lang, { n: done.stars }))}">${"★".repeat(done.stars)}${"☆".repeat(3 - done.stars)}</p>
        <p>${escapeHtml(u("summary", lang, { correct: done.correct, total: done.rounds }))}</p>
        <div class="fm2-finish-actions"><button type="button" class="fm2-btn fm2-btn-primary" data-fm2-again>${escapeHtml(u("playAgain", lang))}</button><button type="button" class="fm2-btn" data-fm2-home>${escapeHtml(u("home", lang))}</button></div></div>`;
      el.finish.querySelector("h1").focus({ preventScroll: true });
    };
    draw();
    el.finish.querySelector("[data-fm2-again]")?.addEventListener("click", () => restartAll());
    el.finish.addEventListener("click", (event) => {
      if (event.target.closest("[data-fm2-home]")) onExit();
    });
    onFinish(done);
  }

  function restartAll() {
    seed = seedFrom(seed, "again", Date.now());
    results.length = 0;
    el.finish.hidden = true;
    el.shell.hidden = false;
    begin(0);
  }

  function advance() {
    results[index] = {
      correct: tools.solved,
      hints: Math.min(tools.hints, MAX_HINTS),
      attempts: tools.attempts,
      revealed: tools.revealed,
    };
    if (index + 1 >= rounds) finish();
    else begin(index + 1);
  }

  el.exit.addEventListener("click", () => onExit());
  el.howto.addEventListener("click", () =>
    typeof el.dialog.showModal === "function"
      ? el.dialog.showModal()
      : el.dialog.setAttribute("open", ""),
  );
  el["dialog-close"].addEventListener("click", () =>
    typeof el.dialog.close === "function" ? el.dialog.close() : el.dialog.removeAttribute("open"),
  );
  el.lang.addEventListener("click", () => {
    lang = lang === "en" ? "es" : "en";
    setLang(lang);
    labels();
    el.prompt.textContent = L(round.prompt, lang);
    if (!el.hintbox.hidden) {
      if (el.hintbox.dataset.tier === "3") el.hintbox.innerHTML = `<span>${escapeHtml(L(game.hint(round, 3, null), lang))}</span>`;
      else showHint(Number(el.hintbox.dataset.tier));
    }
    setFeedback(feedbackNow?.kind || "", feedbackText());
    if (!el.explain.hidden && coach) el.explain.innerHTML = `<strong>${escapeHtml(u("talk", lang))}</strong> <span>${escapeHtml(L(coach.explain({ game, skill, grade, lang, round }), lang))}</span>`;
    if (mounted?.setLang) mounted.setLang(lang);
    else if (!tools.solved && !tools.revealed) mountRound();
    options.onLanguage?.(lang);
  });
  el.hint.addEventListener("click", () => {
    if (tools.solved || tools.revealed) return;
    const tier = Math.min(tools.hints, MAX_HINTS - 1);
    tools.hints = Math.min(MAX_HINTS, tools.hints + 1);
    showHint(tier);
    el.hint.textContent = hintLabel();
    if (tools.hints >= MAX_HINTS) {
      el.hint.disabled = true;
      el.showme.hidden = false;
    }
  });
  el.showme.addEventListener("click", () => {
    if (tools.solved || tools.revealed) return;
    const text = L(game.hint(round, 3, null), lang);
    el.hintbox.hidden = false;
    el.hintbox.dataset.tier = "3";
    el.hintbox.innerHTML = `<span>${escapeHtml(text)}</span>`;
    showFeedback("info", "revealed", null);
    announce(text);
    finishRound(true);
  });
  el.reset.addEventListener("click", () => {
    if (!tools.solved && !tools.revealed) mountRound();
  });
  el.restart.addEventListener("click", () => restartAll());
  el.next.addEventListener("click", advance);

  // Publish the action bar's height so the floating Save/Resume pill sits above it instead of on the controls.
  let barWatch = null;
  const toolbar = root.querySelector(".fm2-toolbar");
  // The pill must clear the bar's real position in the viewport, which changes as the page scrolls.
  const publishBar = () => {
    const rect = toolbar.getBoundingClientRect();
    const clearance = Math.max(0, Math.round(window.innerHeight - rect.top));
    document.documentElement.style.setProperty("--fm-toolbar-h", `${clearance}px`);
  };
  window.addEventListener("scroll", publishBar, { passive: true });
  window.addEventListener("resize", publishBar);
  if (typeof ResizeObserver === "function") {
    barWatch = new ResizeObserver(publishBar);
    barWatch.observe(toolbar);
  }
  publishBar();

  begin(Math.min(index, rounds - 1));
  return {
    destroy() {
      if (!destroyed) {
        destroyed = true;
        barWatch?.disconnect();
        window.removeEventListener("scroll", publishBar);
        window.removeEventListener("resize", publishBar);
        document.documentElement.style.removeProperty("--fm-toolbar-h");
        mounted?.destroy?.();
        root.innerHTML = "";
        if (window.__fm2?.game === game) delete window.__fm2;
      }
    },
    get state() {
      return { index, results: [...results], tools: { ...tools }, seed };
    },
  };
}
