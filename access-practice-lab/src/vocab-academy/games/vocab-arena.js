// Vocabulary Arena — a quick, fair review mix. Question types rotate (meaning, context, synonyms,
// opposites, word parts, pictures, spot-the-misuse) over this unit's words and a few earlier-unit review
// words. Score comes from correctness and variety only: speed is never an input. An elapsed counter is
// available but OFF by default; Pause stops it and hides the question.
import { ARENA_POINTS, arenaScore, buildMix, newMc, QTYPES, QTYPE_IDS } from "./questions.js";
import {
  choicesHTML,
  hintButton,
  html,
  icon,
  mcAct,
  mcFeedback,
  mountGame,
  stemHTML,
} from "./kit.js";

export const TITLE = ["Vocabulary Arena", "Arena de vocabulario"];
const COUNT = { early: 8, "upper-elem": 10, middle: 12, high: 12 };

/** Pure engine: the questions for a run. Same pool + seed gives the same run. */
export function buildArena(pool, rng, { count } = {}) {
  const targets = pool.words;
  const reviewCap = Math.min(pool.review.length, Math.max(1, Math.ceil(targets.length * 0.3)));
  const words = [...targets, ...pool.review.slice(0, reviewCap)];
  return buildMix(pool, rng, { words, count: count || COUNT[pool.band] || 10, idPrefix: "arena" });
}
export { arenaScore };

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const spec = {
  id: "vocab-arena",
  title: TITLE,
  howTo: [
    [
      "Read the question. Each one is a different kind: meaning, context, opposites, word parts, or pictures.",
      "Lee la pregunta. Cada una es de un tipo distinto.",
    ],
    [
      "Choose an answer. If it is not right, try another. You can retry and use hints as often as you like.",
      "Elige una respuesta. Si no es correcta, prueba otra.",
    ],
    [
      "Points come from right answers and from trying different kinds of questions. Going fast gives no points.",
      "Los puntos vienen de acertar y de probar distintos tipos de preguntas. Ir rápido no da puntos.",
    ],
    [
      "Use Pause any time. The elapsed time display is optional and off.",
      "Usa Pausa cuando quieras. El tiempo transcurrido es opcional y está apagado.",
    ],
  ],
  keys: [
    ["1 to 4", ["choose that answer", "elige esa respuesta"]],
    ["Enter", ["go to the next question", "pasa a la siguiente pregunta"]],
    ["P", ["pause or resume", "pausa o continúa"]],
  ],

  build(env) {
    const qs = buildArena(env.pool, env.rng);
    return { qs, i: 0, mc: newMc(), log: [], paused: false, showElapsed: false, elapsed: 0 };
  },
  isDone: (s) => s.i >= s.qs.length,
  progress: (s) => ({ done: Math.min(s.i, s.qs.length), total: s.qs.length }),

  view(s, env) {
    const I = env.I;
    const score = arenaScore(s.log);
    const q = s.qs[s.i];
    const met = new Set(s.log.filter((e) => e.ok).map((e) => e.type));
    const types = [...new Set(s.qs.map((x) => x.type))];
    const review = q && env.pool.review.some((w) => w.id === q.wordId);
    const hud = html`<div class="vag-hud">
      <p class="vag-score" aria-label="${I.S("Points", "Puntos")}">
        <strong>${score.points}</strong> ${I.T("points", "puntos")}
      </p>
      <p class="vag-variety">
        ${types.map((t) => html`<span class="vag-chip" data-met="${met.has(t)}">${met.has(t) ? icon("check") : icon("star")}${I.T(...QTYPES[t].label)}</span>`)}
      </p>
      <p class="vag-hud-btns">
        <button
          type="button"
          class="btn small"
          data-elapsed
          aria-pressed="${s.showElapsed}"
          data-fk="elapsed"
        >
          ${I.T("Show elapsed time", "Mostrar tiempo transcurrido")}
        </button>
        <button type="button" class="btn small" data-pause data-fk="pause">
          ${icon(s.paused ? "play" : "pause")}${s.paused ? I.T("Resume", "Continuar") : I.T("Pause", "Pausa")}
        </button>
      </p>
      ${s.showElapsed ? html`<p class="vag-elapsed-wrap">${I.T("Elapsed", "Transcurrido")}: <span class="vag-elapsed" data-elapsed-out>${mmss(s.elapsed)}</span></p>` : ""}
    </div>`;
    if (s.paused)
      return html`${hud}
        <div class="vag-paused" role="note">
          <p>
            ${icon("pause")}
            ${I.T("Paused. Your place is saved.", "En pausa. Tu lugar está guardado.")}
          </p>
        </div>`;
    return html`${hud}
      <div class="vag-qcard" data-type="${q.type}">
        <p class="vag-qtype">
          ${I.T(...QTYPES[q.type].label)}${review ? html` <span class="vag-badge">${icon("replay")}${I.T("Review word", "Palabra de repaso")}</span>` : ""}
        </p>
        ${stemHTML(q, env)}${choicesHTML(q, s.mc, env)}
        <div class="vag-actions">
          ${hintButton(s.mc, env)}${s.mc.done ? html`<button type="button" class="btn btn-primary" data-next data-fk="next" data-autofocus>${I.T("Next question", "Siguiente pregunta")}${icon("arrow-right")}</button>` : ""}
        </div>
        ${mcFeedback(q, s.mc, env)}
      </div>`;
  },

  click(el, s, env) {
    if (el.closest("[data-elapsed]")) {
      s.showElapsed = !s.showElapsed;
      return true;
    }
    if (el.closest("[data-pause]")) {
      s.paused = !s.paused;
      env.say(s.paused ? env.I.S("Paused.", "En pausa.") : env.I.S("Resumed.", "Continuamos."));
      return true;
    }
    if (s.paused) return false;
    const q = s.qs[s.i];
    if (el.closest("[data-next]")) {
      if (!s.mc.done) return false;
      s.i += 1;
      s.mc = newMc();
      return true;
    }
    const changed = mcAct(el, q, s.mc, env, { kind: q.type });
    if (changed && s.mc.done)
      s.log.push({ type: q.type, ok: true, firstTry: s.mc.firstTry, wordId: q.wordId });
    return changed;
  },
  key(ev, s) {
    if (ev.key === "p" || ev.key === "P") {
      if (/^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return false;
      s.paused = !s.paused;
      return true;
    }
    if (ev.key === "Enter" && s.mc.done && !s.paused && !ev.target.closest("button")) {
      s.i += 1;
      s.mc = newMc();
      return true;
    }
    return false;
  },
  after(body, s, env) {
    // Elapsed counter: counts up only while shown and not paused; it is display-only and never read by the score.
    env.cur = s;
    if (!env.tick) {
      env.tick = setInterval(() => {
        const c = env.cur;
        if (!c || c.paused || !c.showElapsed) return;
        c.elapsed += 1;
        const out = document.querySelector(".vag-elapsed[data-elapsed-out]");
        if (out) out.textContent = mmss(c.elapsed);
      }, 1000);
    }
  },
  destroy(env) {
    clearInterval(env.tick);
  },
  extra(s) {
    const score = arenaScore(s.log);
    return { score: score.points, scoreBase: score.base, varietyTypes: score.kinds };
  },
  finishExtra(s, env) {
    const sc = arenaScore(s.log);
    return html`<p class="vag-score-line">
      <strong>${sc.points}</strong> ${env.I.T("points", "puntos")}: ${sc.base}
      ${env.I.T("for right answers", "por respuestas correctas")} + ${sc.kinds} ×
      ${ARENA_POINTS.variety} ${env.I.T("for variety", "por variedad")}.
    </p>`;
  },
};

export default {
  id: "vocab-arena",
  title: TITLE[0],
  titleEs: TITLE[1],
  blurb:
    "A quick mix of question types over this lesson and earlier words. Points reward right answers and variety, never speed.",
  blurbEs:
    "Una mezcla rápida de preguntas. Los puntos premian aciertos y variedad, nunca la rapidez.",
  purpose: "Keep older words fresh while new ones settle in.",
  minGrade: "K",
  maxGrade: "12",
  dims: ["rec", "mean", "ctx", "morph"],
  mount: (root, opts) => mountGame(root, opts, spec),
  engine: { build: buildArena, score: arenaScore, types: QTYPE_IDS },
};
