/**
 * Play: everything a family can play for this lesson, in one place, plus Family Face-Off.
 *
 * Face-Off is pass-the-phone practice for two: a student and a grown-up take turns on tonight's
 * own questions (the sidecar's basicPractice, powerUp, transfer and spiral items, all authored and
 * checked per lesson). Two stars for a first try, one for a second; after each answer the other
 * player awards a bonus star when the explanation made sense. There is no clock and no loser screen:
 * explaining is worth as much as answering. Scores stay on this device.
 */
import { announce, bi, bilingualPicture, el, esc, has, pictureBox, sparkle, store } from "./kit.mjs";

const pairOf = (en, es) => ({ en: String(en ?? ""), es: String(es ?? en ?? "") });

/** Tonight's multiple-choice questions, normalised to {q, choices[{en,es}], correct, hint, why}. */
export function faceOffPool(notes) {
  const out = [];
  for (const b of notes.basicPractice || []) {
    if (b.type !== "multiple-choice" || !Array.isArray(b.choices) || !Number.isInteger(b.correctIndex)) continue;
    out.push({
      q: pairOf(b.stem, b.stemEs),
      choices: b.choices.map((c, i) => pairOf(c, b.choicesEs?.[i])),
      correct: b.correctIndex,
      feedback: (b.choiceFeedback || []).map((f, i) => pairOf(f, b.choiceFeedbackEs?.[i])),
      why: pairOf(b.explanation, b.explanationEs),
    });
  }
  const p = notes.corner?.powerUp;
  if (p && Array.isArray(p.choices) && Number.isInteger(p.correctIndex)) {
    out.push({
      q: pairOf(p.qEn, p.qEs),
      choices: p.choices.map((c) => pairOf(c.en, c.es)),
      correct: p.correctIndex,
      feedback: [],
      why: pairOf(p.hintEn, p.hintEs),
    });
  }
  const t = notes.v3?.transfer;
  if (t && has(t.stem) && Array.isArray(t.choices)) {
    const correct = t.choices.findIndex((c) => c.correct);
    if (correct >= 0) {
      out.push({ q: t.stem, choices: t.choices.map((c) => pairOf(c.en, c.es)), correct, feedback: [], why: t.reasoning || pairOf("", "") });
    }
  }
  for (const s of notes.v3?.spiral || []) {
    if (!has(s.q) || !Array.isArray(s.options) || !Number.isInteger(s.correctIdx)) continue;
    out.push({ q: s.q, choices: s.options.map((o) => pairOf(o, o)), correct: s.correctIdx, feedback: [], why: s.exp || pairOf("", ""), review: true });
  }
  return out.filter((x) => has(x.q) && x.choices.length >= 2 && x.correct < x.choices.length);
}

/** A fair order: alternate easy items and harder ones so neither player gets every hard question. */
function deal(pool, round) {
  const rot = (round * 3) % Math.max(pool.length, 1);
  const turned = pool.slice(rot).concat(pool.slice(0, rot));
  return turned.slice(0, Math.min(8, turned.length - (turned.length % 2)));
}

function faceOff(host, notes, pictureFor) {
  const pool = faceOffPool(notes);
  if (pool.length < 4) {
    host.innerHTML = `<p>${bi("Face-Off needs a few more questions for this lesson. Try the games instead.", "Este duelo necesita más preguntas para esta lección. Prueben los juegos.")}</p>`;
    return;
  }
  const saved = store("faceoff");
  const state = saved.read({ names: ["", ""], round: 0, best: 0 });
  let players = [];
  let qs = [];
  let at = 0;
  let tries = 0;
  const stars = [0, 0];

  const nameOf = (i) => esc(players[i]);

  function setup() {
    host.innerHTML = "";
    const form = el("form", "fs-fo-setup");
    form.innerHTML =
      `<p class="fs-ch-lead">${bi("Two players take turns on tonight's questions. No clock. Explaining earns stars too.", "Dos jugadores se turnan con las preguntas de hoy. Sin reloj. Explicar también gana estrellas.")}</p>` +
      `<label class="fs-field"><span>${bi("Player 1 (student)", "Jugador 1 (estudiante)")}</span><input name="p1" maxlength="20" autocomplete="off" value="${esc(state.names[0])}"></label>` +
      `<label class="fs-field"><span>${bi("Player 2 (grown-up)", "Jugador 2 (adulto)")}</span><input name="p2" maxlength="20" autocomplete="off" value="${esc(state.names[1])}"></label>` +
      `<ul class="fs-rules"><li>⭐⭐ ${bi("right on the first try", "correcto al primer intento")}</li><li>⭐ ${bi("right on the second try", "correcto al segundo intento")}</li><li>💬 ${bi("+1 when the other player says your reason made sense", "+1 cuando el otro jugador dice que tu razón tuvo sentido")}</li></ul>` +
      `<button class="fs-btn fs-btn-primary" type="submit">🆚 ${bi("Start the Face-Off", "Empezar el duelo")}</button>`;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const p1 = String(fd.get("p1") || "").trim();
      const p2 = String(fd.get("p2") || "").trim();
      state.names = [p1, p2];
      saved.write(state);
      players = [p1 || (document.body.classList.contains("lang-mode-es") ? "Estudiante" : "Student"), p2 || (document.body.classList.contains("lang-mode-es") ? "Adulto" : "Grown-up")];
      qs = deal(pool, state.round || 0);
      at = 0;
      stars[0] = 0;
      stars[1] = 0;
      turn();
    });
    host.appendChild(form);
  }

  function board() {
    return `<div class="fs-fo-board" aria-label="Score"><span class="${at % 2 === 0 ? "is-turn" : ""}">${nameOf(0)} <b>${stars[0]}⭐</b></span><span class="${at % 2 === 1 ? "is-turn" : ""}">${nameOf(1)} <b>${stars[1]}⭐</b></span></div>`;
  }

  function turn() {
    if (at >= qs.length) return finish();
    const q = qs[at];
    const me = at % 2;
    tries = 0;
    host.innerHTML = "";
    host.insertAdjacentHTML(
      "beforeend",
      `${board()}<p class="fs-fo-turn">${bi(`${players[me]}'s turn`, `Turno de ${players[me]}`)} · ${bi(`Question ${at + 1} of ${qs.length}`, `Pregunta ${at + 1} de ${qs.length}`)}${q.review ? ` · <span class="fs-tag">${bi("review", "repaso")}</span>` : ""}</p>`,
    );
    const card = el("div", "fs-fo-card", `<p class="fs-fo-q">${bi(q.q.en, q.q.es)}</p>`);
    const pic = pictureFor ? bilingualPicture(pictureFor, q.q.en) : null;
    if (pic?.svg) card.appendChild(pictureBox(pic));
    const fb = el("p", "fs-fo-fb");
    fb.setAttribute("role", "status");
    const choices = el("div", "fs-fo-choices");
    q.choices.forEach((c, i) => {
      const b = el("button", "fs-choice", bi(c.en, c.es));
      b.type = "button";
      b.addEventListener("click", () => answer(i, b, choices, fb, card));
      choices.appendChild(b);
    });
    card.append(choices, fb);
    host.appendChild(card);
    card.querySelector(".fs-choice")?.focus({ preventScroll: true });
  }

  function answer(i, btn, choices, fb, card) {
    const q = qs[at];
    const me = at % 2;
    tries++;
    if (i === q.correct) {
      const earned = tries === 1 ? 2 : 1;
      stars[me] += earned;
      btn.classList.add("is-right");
      for (const b of choices.querySelectorAll("button")) b.disabled = true;
      fb.innerHTML = `✅ ${bi(`Yes! +${earned} ⭐`, `¡Sí! +${earned} ⭐`)}${has(q.why) ? ` ${bi(q.why.en, q.why.es)}` : ""}`;
      sparkle(card);
      return explain(card);
    }
    btn.classList.add("is-wrong");
    btn.disabled = true;
    const said = q.feedback[i];
    if (tries >= 2) {
      for (const b of choices.querySelectorAll("button")) b.disabled = true;
      choices.children[q.correct]?.classList.add("is-right");
      fb.innerHTML = `💡 ${bi("Here is how it works:", "Así funciona:")} ${has(q.why) ? bi(q.why.en, q.why.es) : ""}`;
      return explain(card, true);
    }
    fb.innerHTML = `🤔 ${has(said) ? bi(said.en, said.es) : bi("Not yet. Look again and try one more time.", "Todavía no. Miren otra vez e intenten una vez más.")}`;
  }

  function explain(card, missed) {
    const me = at % 2;
    const other = 1 - me;
    const box = el(
      "div",
      "fs-fo-explain",
      `<p>💬 ${missed ? bi(`${players[me]}, say the fix in your own words to ${players[other]}.`, `${players[me]}, explícale el arreglo con tus palabras a ${players[other]}.`) : bi(`${players[me]}, tell ${players[other]} WHY it is right.`, `${players[me]}, dile a ${players[other]} POR QUÉ es correcto.`)}</p>`,
    );
    const yes = el("button", "fs-btn", `👍 ${bi(`${players[other]}: that made sense (+1 ⭐)`, `${players[other]}: eso tuvo sentido (+1 ⭐)`)}`);
    yes.type = "button";
    const next = el("button", "fs-btn fs-btn-soft", `${bi("Next turn", "Siguiente turno")} →`);
    next.type = "button";
    yes.addEventListener("click", () => {
      stars[me] += 1;
      yes.disabled = true;
      announce(host.closest("dialog"), "Bonus star!", "¡Estrella extra!");
      next.focus();
    });
    next.addEventListener("click", () => {
      at++;
      turn();
    });
    box.append(yes, next);
    card.appendChild(box);
  }

  function finish() {
    state.round = (state.round || 0) + 1;
    state.best = Math.max(state.best || 0, stars[0] + stars[1]);
    saved.write(state);
    const total = stars[0] + stars[1];
    host.innerHTML =
      `${board()}<div class="fs-fo-end"><p class="fs-fo-trophy" aria-hidden="true">🏆</p>` +
      `<p class="fs-big-idea">${bi(`Team total: ${total} stars`, `Total del equipo: ${total} estrellas`)}</p>` +
      `<p>${bi(`${players[0]} ${stars[0]} ⭐ · ${players[1]} ${stars[1]} ⭐. Every star you earned by explaining counts the most.`, `${players[0]} ${stars[0]} ⭐ · ${players[1]} ${stars[1]} ⭐. Cada estrella ganada al explicar es la que más cuenta.`)}</p>` +
      `<p class="fs-muted">${bi(`Your best team total on this device: ${state.best}`, `Su mejor total en este dispositivo: ${state.best}`)}</p></div>`;
    const again = el("button", "fs-btn fs-btn-primary", `🔁 ${bi("Rematch with other questions", "Revancha con otras preguntas")}`);
    again.type = "button";
    again.addEventListener("click", setup);
    host.appendChild(again);
    sparkle(host);
  }

  setup();
}

const PLAY_CARDS = [
  { act: "faceoff", icon: "🆚", en: "Family Face-Off", es: "Duelo familiar", blurbEn: "Two players, tonight's questions, stars for explaining.", blurbEs: "Dos jugadores, las preguntas de hoy, estrellas por explicar." },
  { act: "games", icon: "🎮", en: "Lesson games", es: "Juegos de la lección", blurbEn: "Quick games built for tonight's math.", blurbEs: "Juegos rápidos con la matemática de hoy." },
  { act: "mission", icon: "🌎", en: "Family Math Mission", es: "Misión familiar", blurbEn: "Find tonight's math in your own home.", blurbEs: "Encuentren la matemática de hoy en su casa." },
  { act: "challenge", icon: "⭐", en: "Challenge round", es: "Ronda de reto", blurbEn: "Deeper problems for a student who is ready.", blurbEs: "Problemas más profundos para quien está listo." },
  { act: "photo", icon: "📸", en: "Victory photo", es: "Foto de victoria", blurbEn: "Snap your work and make a win card.", blurbEs: "Tomen una foto de su trabajo y hagan una tarjeta." },
];

/** The Play screen: one card per way to play; Face-Off opens in place, the rest open the page's own stops. */
export function buildPlay(notes, ctx) {
  const wrap = el("section", "fs-chapter fs-play");
  wrap.setAttribute("aria-labelledby", "fs_play_h");
  wrap.innerHTML = `<h3 class="fs-ch-title" id="fs_play_h"><span class="fs-ch-icon" aria-hidden="true">🎲</span> ${bi("Play together", "Jueguen juntos")}</h3>`;
  const grid = el("div", "fs-play-grid");
  const stage = el("div", "fs-fo");
  stage.hidden = true;
  const run = {
    faceoff: () => {
      grid.hidden = true;
      stage.hidden = false;
      ctx.loadPicture().then((pictureFor) => faceOff(stage, notes, pictureFor));
    },
    games: () => ctx.leaveTo(() => window.openOptionalStop?.("play")),
    mission: () => ctx.leaveTo(() => window.openOptionalStop?.("apply")),
    challenge: () => ctx.leaveTo(() => window.hwStartChallengeRound?.()),
    photo: () => ctx.leaveTo(() => window.openOptionalStop?.("photobooth")),
  };
  for (const c of PLAY_CARDS) {
    if (c.act === "challenge" && typeof window.hwStartChallengeRound !== "function") continue;
    const b = el(
      "button",
      "fs-play-card",
      `<span class="fs-play-icon" aria-hidden="true">${c.icon}</span><span class="fs-play-name">${bi(c.en, c.es)}</span><span class="fs-play-blurb">${bi(c.blurbEn, c.blurbEs)}</span>`,
    );
    b.type = "button";
    b.addEventListener("click", run[c.act]);
    grid.appendChild(b);
  }
  wrap.append(grid, stage);
  return [wrap];
}
