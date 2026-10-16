/**
 * "Play the Confused Grown-Up" — a card on the Play stop of a family homework page.
 *
 * The grown-up says ONE believable wrong answer out loud, with confidence, and the
 * student fixes it. Teaching someone else the correction is the strongest practice
 * there is, and it needs no adult math: the grown-up never has to know the answer.
 *
 * Nothing here is invented. Each round comes from a lesson's own authored item:
 *   - the wrong answer is a distractor the author tagged with a misconception
 *     (`misconceptionTags[i]`, resolved through the engine's own taxonomy),
 *   - "why that slip happens" is that distractor's own `choiceFeedback[i]`,
 *   - the "ask, don't tell" question is the tag's `watchFor`, restated for a family
 *     in data/homework-confused-grownup-tags.json (which also copies `watchFor`, so a
 *     taxonomy change that nobody revisited fails tools/homework-confused-grownup.test.mjs).
 * A lesson with no suitable tagged item gets no card.
 *
 * The student fixes the answer by choosing from the item's other options. A wrong
 * option answers back with that option's own reason; the right answer and the worked
 * explanation appear only after the student finds it.
 */
import { readFileSync } from "node:fs";
import { resolveAuthoredTag } from "@eduwonderlab/engine/core/misconceptions.js";

const TAGS = JSON.parse(
  readFileSync(new URL("../../data/homework-confused-grownup-tags.json", import.meta.url), "utf8"),
).tags;

/** Rounds shown per page: enough to replay, few enough to stay a game and not a worksheet. */
export const MAX_ROUNDS = 3;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/* A stem that points at something the card does not show cannot be said aloud. */
const NEEDS_FIGURE =
  /\b(below|above|picture|diagram|graph|table|chart|figure|shown|number line|plot|dot plot|histogram|box plot|grid|model|net|shaded|drawing|image|arrow|list)\b/i;
const MAX_STEM = 150;
const MAX_CHOICE = 48;

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.%/]+/gu, " ")
    .trim();

/** True when `feedback` states the correct answer's text as its own token run. */
export function leaksAnswer(feedback, answer) {
  const a = norm(answer);
  if (!a) return false;
  return ` ${norm(feedback)} `.includes(` ${a} `);
}

/** Every authored item a lesson offers, in a fixed order (warm-up first). */
function poolsOf(config) {
  const practice = config.practice || {};
  return [
    ...(config.warmup?.questions || []),
    ...(practice.onLevel || []),
    ...(practice.approaching || []),
    ...(practice.extending || []),
    ...(config.familyCheck ? [config.familyCheck] : []),
  ];
}

/**
 * The round an item supports, or null.
 * `claimIndex` is the first distractor that has a resolvable, family-ready tag.
 */
export function roundOf(item) {
  if (!item || !Array.isArray(item.choices) || item.choices.length < 3 || item.choices.length > 5)
    return null;
  const { choices, correctIndex } = item;
  if (!Number.isInteger(correctIndex) || !Array.isArray(item.choicesEs)) return null;
  if (!item.stem || !item.stemEs || !item.explanation || !item.explanationEs) return null;
  if (item.stem.length > MAX_STEM || NEEDS_FIGURE.test(item.stem)) return null;
  if (choices.some((c) => String(c).length > MAX_CHOICE)) return null;
  if (!Array.isArray(item.misconceptionTags)) return null;
  const answer = choices[correctIndex];
  for (let i = 0; i < choices.length; i++) {
    if (i === correctIndex) continue;
    const tag = resolveAuthoredTag(item.misconceptionTags[i]);
    if (!tag || !TAGS[tag]) continue;
    if (!item.choiceFeedback?.[i] || !item.choiceFeedbackEs?.[i]) continue;
    // Every distractor the student can still tap answers back; none may state the answer.
    const others = choices.map((_, j) => j).filter((j) => j !== i && j !== correctIndex);
    if (others.some((j) => !item.choiceFeedback?.[j] || !item.choiceFeedbackEs?.[j])) continue;
    if (others.some((j) => leaksAnswer(item.choiceFeedback[j], answer))) continue;
    if (leaksAnswer(item.choiceFeedback[i], answer)) continue;
    return {
      stem: { en: item.stem, es: item.stemEs },
      claim: { en: choices[i], es: item.choicesEs[i] ?? choices[i] },
      tag,
      ask: { en: TAGS[tag].askEn, es: TAGS[tag].askEs },
      why: { en: item.choiceFeedback[i], es: item.choiceFeedbackEs[i] },
      explanation: { en: item.explanation, es: item.explanationEs },
      options: choices
        .map((c, j) => ({
          en: c,
          es: item.choicesEs[j] ?? c,
          correct: j === correctIndex,
          fbEn: item.choiceFeedback?.[j] || "",
          fbEs: item.choiceFeedbackEs?.[j] || "",
          index: j,
        }))
        .filter((o) => o.index !== i),
    };
  }
  return null;
}

/**
 * Up to MAX_ROUNDS rounds for a lesson, preferring items the page does not
 * already ask (`seenStems`), without ever reusing one item or one stem twice.
 */
export function confusedRoundsFor(config, seenStems = new Set()) {
  const exit = norm(config.reflect?.exitTicket?.stem);
  const seen = new Set([...seenStems].map(norm));
  const fresh = [];
  const reused = [];
  const used = new Set();
  for (const item of poolsOf(config)) {
    const stem = norm(item?.stem);
    if (!stem || used.has(stem) || stem === exit) continue;
    const round = roundOf(item);
    if (!round) continue;
    used.add(stem);
    (seen.has(stem) ? reused : fresh).push(round);
  }
  return [...fresh, ...reused].slice(0, MAX_ROUNDS);
}

const bi = (en, es) =>
  es && es !== en
    ? `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`
    : esc(en);

const quoted = (r) => ({
  en: `I'm pretty sure the answer is ${r.claim.en}.`,
  es: `Estoy casi seguro de que la respuesta es ${r.claim.es}.`,
});

const STEPS = [
  {
    en: "Say it with a straight face, then ask: “Does that sound right?”",
    es: "Dilo con toda seguridad y pregunta: «¿Les suena bien?»",
  },
  {
    en: "Do not fix it. Ask the one question below and wait.",
    es: "No lo corrijan. Hagan la pregunta de abajo y esperen.",
  },
  {
    en: "Let your student teach you the right answer. Say it back in their words.",
    es: "Dejen que su estudiante les enseñe la respuesta correcta. Repítanla con sus palabras.",
  },
];

function renderRound(r, i, total) {
  const q = quoted(r);
  const options = r.options
    .map(
      (o) =>
        `<button type="button" class="cga-choice" data-cga-correct="${o.correct ? "1" : "0"}" data-fb-en="${esc(o.fbEn)}" data-fb-es="${esc(o.fbEs)}">${bi(o.en, o.es)}</button>`,
    )
    .join("");
  return `
        <div class="cga-round" data-cga-round="${i}"${i ? " hidden" : ""}>
          <p class="cga-count">${bi(`Round ${i + 1} of ${total}`, `Ronda ${i + 1} de ${total}`)}</p>
          <p class="cga-problem"><strong>${bi("The problem:", "El problema:")}</strong> ${bi(r.stem.en, r.stem.es)}</p>
          <div class="cga-claim">
            <p class="cga-claim-label" data-no-vocab>${bi("🎭 Grown-up says (out loud, with confidence):", "🎭 El adulto dice (en voz alta, con seguridad):")}</p>
            <p class="cga-claim-text">${bi(`“${q.en}”`, `“${q.es}”`)}</p>
            <button type="button" class="btn-read-aloud hw-listen cga-listen" data-speak-en="${esc(`${r.stem.en} ${q.en}`)}" data-speak-es="${esc(`${r.stem.es} ${q.es}`)}" aria-label="Listen to the grown-up's line" data-aria-en="Listen to the grown-up's line" data-aria-es="Escuchar lo que dice el adulto">🔊 <span class="lang-en">Listen</span><span class="lang-es" lang="es">Escuchar</span></button>
          </div>
          <p class="cga-task"><strong>${bi("Your job: fix the answer. Which one is right?", "Tu trabajo: corregir la respuesta. ¿Cuál es la correcta?")}</strong></p>
          <div class="cga-choices" role="group" aria-label="Fix the answer" data-aria-en="Fix the answer" data-aria-es="Corrige la respuesta">${options}</div>
          <p class="cga-feedback" role="status" aria-live="polite"></p>
          <div class="cga-win" hidden>
            <p class="cga-win-line">🎉 ${bi("You fixed it!", "¡Lo corregiste!")} ${bi(r.explanation.en, r.explanation.es)}</p>
            <p class="cga-why"><strong>${bi("Why this slip is easy to make:", "Por qué es fácil cometer este error:")}</strong> ${bi(r.why.en, r.why.es)}</p>
            <p class="cga-ask"><strong>${bi("Question to ask next time:", "Pregunta para la próxima vez:")}</strong> ${bi(r.ask.en, r.ask.es)}</p>
            ${
              i + 1 < total
                ? `<button type="button" class="btn btn-primary btn-sm cga-next">${bi("Next round ➔", "Siguiente ronda ➔")}</button>`
                : `<button type="button" class="btn btn-secondary btn-sm cga-restart">🔄 ${bi("Play again", "Jugar otra vez")}</button>`
            }
          </div>
        </div>`;
}

/** The card, or "" when the lesson has no suitable round. */
export function renderConfusedGrownUp(rounds) {
  if (!rounds.length) return "";
  const steps = STEPS.map(
    (s, k) =>
      `<li><span class="cga-step-num" aria-hidden="true">${k + 1}</span><span>${bi(s.en, s.es)}${k === 1 ? ` <em class="cga-step-ask">${bi(rounds[0].ask.en, rounds[0].ask.es)}</em>` : ""}</span></li>`,
  ).join("");
  return `
      <div class="fam-game-card cga-card" id="hw_cga" aria-labelledby="hw_cga_title">
        <div class="fam-game-card-head">
          <h3 class="fam-game-h3" id="hw_cga_title">🎭 <span class="lang-en">Play the Confused Grown-Up</span><span class="lang-es" lang="es">Juega al adulto confundido</span></h3>
        </div>
        <p class="fam-game-sub bilingual-block">
          <span class="lang-en">Grown-up: you will say one wrong answer, on purpose. Student: you are the math coach. Fix it, and explain why. Nothing is timed, and nobody has to know the answer first.</span>
          <span class="lang-es" lang="es">Adulto: van a decir una respuesta equivocada, a propósito. Estudiante: tú eres el entrenador de matemáticas. Corrígela y explica por qué. Nada tiene cronómetro y nadie necesita saber la respuesta primero.</span>
        </p>
        <ol class="cga-script" data-no-vocab aria-label="Ask, don't tell" data-aria-en="Ask, don't tell" data-aria-es="Preguntar, no decir">${steps}</ol>${rounds.map((r, i) => renderRound(r, i, rounds.length)).join("")}
      </div>`;
}

export const CONFUSED_GROWNUP_CSS = `
.cga-card { border: 2px solid var(--st-amber, #b45309); background: #fffaf0; }
.cga-script { list-style: none; margin: 8px 0 12px; padding: 0; display: grid; gap: 8px; }
.cga-script li { display: flex; gap: 10px; align-items: flex-start; font-size: 16px; line-height: 1.45; }
.cga-step-num { flex: 0 0 auto; width: 28px; height: 28px; border-radius: 50%; background: var(--st-navy, #17324d); color: #fff; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; }
.cga-step-ask { display: block; margin-top: 4px; font-style: normal; font-weight: 700; color: var(--teal-ink, #0c6f6b); }
.cga-round { margin-top: 12px; padding: 14px; border-radius: 14px; background: #fff; border: 1.5px solid #e6d3a8; }
.cga-count { margin: 0 0 6px; font-size: 13px; font-weight: 800; letter-spacing: .03em; text-transform: uppercase; color: #92400e; }
.cga-problem { margin: 0 0 10px; font-size: 18px; line-height: 1.45; }
.cga-claim { margin: 0 0 12px; padding: 10px 12px; border-left: 5px solid #d97706; background: #fef3c7; border-radius: 8px; }
.cga-claim-label { margin: 0; font-size: 13px; font-weight: 700; color: #7c2d12; }
.cga-claim-text { margin: 4px 0 8px; font-size: 20px; font-weight: 800; line-height: 1.4; color: #1e293b; }
.cga-task { margin: 0 0 8px; font-size: 17px; }
.cga-choices { display: flex; flex-wrap: wrap; gap: 10px; }
.cga-choice { min-height: 48px; min-width: 64px; padding: 10px 18px; font: inherit; font-size: 18px; font-weight: 700; border-radius: 12px; border: 2px solid #94a3b8; background: #fff; color: #1e293b; cursor: pointer; }
.cga-choice:hover:not(:disabled) { border-color: var(--st-teal, #0f766e); background: #f0fdfa; }
.cga-choice:focus-visible { outline: 3px solid var(--teal-ink, #0c6f6b); outline-offset: 2px; }
.cga-choice.is-wrong { border-color: #b64e2f; background: #fef0ec; }
.cga-choice.is-right { border-color: #0f7c4a; background: #e6f7ef; }
.cga-feedback { min-height: 1.4em; margin: 10px 0 0; font-size: 16px; line-height: 1.5; color: #7c2d12; }
.cga-win { margin-top: 10px; padding: 12px; border-radius: 10px; background: #e6f7ef; border: 1.5px solid #86d3ae; }
.cga-win p { margin: 0 0 8px; font-size: 16px; line-height: 1.5; }
.cga-win .btn { min-height: 44px; }
@media (max-width: 480px) { .cga-choice { flex: 1 1 100%; } }
@media print { .cga-card { display: none; } }
`;

/* Plain JS in a template literal: no backslashes, so nothing is dropped. */
export const CONFUSED_GROWNUP_JS = `
/* Play the Confused Grown-Up. The rounds are server-rendered; this only answers taps. */
function cgaText(el, en, es) {
  var wantEs = document.body.classList.contains('lang-mode-es');
  return wantEs && es ? es : en;
}
function cgaSay(round, en, es) {
  var out = round.querySelector('.cga-feedback');
  if (!out) return;
  if (typeof setBiText === 'function') setBiText(out, en, es || en);
  else out.textContent = en;
}
function cgaChoose(btn) {
  var round = btn.closest('.cga-round');
  if (!round || round.classList.contains('is-solved')) return;
  if (btn.getAttribute('data-cga-correct') === '1') {
    btn.classList.add('is-right');
    round.classList.add('is-solved');
    round.querySelectorAll('.cga-choice').forEach(function (b) { b.disabled = true; });
    cgaSay(round, '', '');
    var win = round.querySelector('.cga-win');
    if (win) win.hidden = false;
    if (typeof playCorrectSound === 'function') playCorrectSound();
    return;
  }
  btn.classList.add('is-wrong');
  btn.setAttribute('aria-disabled', 'true');
  var fbEn = btn.getAttribute('data-fb-en') || '';
  var fbEs = btn.getAttribute('data-fb-es') || fbEn;
  cgaSay(round, 'Not yet. ' + fbEn + ' Try another one.', 'Todavía no. ' + fbEs + ' Prueba con otra.');
}
function cgaShow(index) {
  var rounds = document.querySelectorAll('#hw_cga .cga-round');
  rounds.forEach(function (r, i) { r.hidden = i !== index; });
  var target = rounds[index];
  if (target) {
    target.querySelectorAll('.cga-choice').forEach(function (b) {
      b.disabled = false;
      b.removeAttribute('aria-disabled');
      b.classList.remove('is-wrong', 'is-right');
    });
    target.classList.remove('is-solved');
    var win = target.querySelector('.cga-win');
    if (win) win.hidden = true;
    cgaSay(target, '', '');
    var first = target.querySelector('.cga-choice');
    if (first) first.focus();
  }
}
document.addEventListener('click', function (e) {
  var t = e.target.closest ? e.target.closest('#hw_cga button') : null;
  if (!t) return;
  if (t.classList.contains('cga-choice')) {
    if (t.disabled) return;
    cgaChoose(t);
  } else if (t.classList.contains('cga-next')) {
    var rounds = Array.prototype.slice.call(document.querySelectorAll('#hw_cga .cga-round'));
    var here = rounds.indexOf(t.closest('.cga-round'));
    cgaShow(Math.min(here + 1, rounds.length - 1));
  } else if (t.classList.contains('cga-restart')) {
    cgaShow(0);
  }
});
`;
