// Game shell (Enterprise 8): draws a GameSession in the Game Room. Every challenge can be answered with a mouse, a
// keyboard or a finger: choices and builds are plain buttons (click-to-select and click-to-place instead of dragging), numbers
// are typed. Feedback is always text and colour together, sound is optional, motion respects the learner's setting, and
// completion never depends on speed or precision. Progress is saved after every round so a game can be resumed.
import { getLang } from "../i18n.js";
import { chime } from "../sounds.js";
import { MathVisualEngine, esc } from "./engine-core.js";
import { GameSession, getFamily } from "./games.js";
import { Workspace } from "./model-lab.js";

const lang = () => (getLang() === "es" ? "es" : "en");
const L = (en, es) => (lang() === "es" ? es : en);
const pick = (o) => (o && typeof o === "object" ? o[lang()] : o);
const reduceMotion = () =>
  Boolean(
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  ) || document.body?.dataset.reducedMotion === "true";

export const gameIdFor = (familyId) => `e8${familyId.toLowerCase()}`;

// Runs one game. `persist` = { load(familyId, grade), save(familyId, grade, snapshot), clear(familyId, grade) }.
export function playFamily(
  familyId,
  container,
  { grade, finish, onEvidence = () => {}, persist = null, calm = false },
) {
  const family = getFamily(familyId);
  const prefs = { sound: true, reducedMotion: reduceMotion() || calm };
  let session = null;
  let workspace = null;
  let toolWorkspace = null;
  let reported = 0;
  let draft = { ans: "", free: "" };

  const saved = persist?.load(familyId, grade);
  if (saved) {
    container.innerHTML = `<section class="e8gm" aria-labelledby="e8gm-title"><h3 id="e8gm-title">${esc(pick(family.title))}</h3><p>${esc(L("You have a game in progress.", "Tienes un juego en curso."))}</p><div class="e8gm-row"><button type="button" class="e8ap-btn e8ap-primary" data-e8gm-resume>${esc(L("Continue my game", "Continuar mi juego"))}</button><button type="button" class="e8ap-btn" data-e8gm-new>${esc(L("Start a new game", "Empezar un juego nuevo"))}</button></div></section>`;
    container.querySelector("[data-e8gm-resume]").onclick = () => {
      try {
        session = GameSession.restore(saved);
        session.options = { ...session.options, ...prefs };
        session.status = "playing";
        session.load();
        draw();
      } catch {
        begin();
      }
    };
    container.querySelector("[data-e8gm-new]").onclick = begin;
  } else begin();

  function begin() {
    persist?.clear(familyId, grade);
    session = new GameSession({
      family: familyId,
      grade,
      seed: (Date.now() % 100003) + 1,
      rounds: 8,
      options: prefs,
    });
    session.start();
    draw();
  }

  const save = () => persist?.save(familyId, grade, session.snapshot());

  function report() {
    const list = session.evidence;
    while (reported < list.length) {
      const e = list[reported];
      reported += 1;
      if (e.skill)
        onEvidence({
          skillKey: e.skill,
          correct: e.correct,
          independent: e.independent,
          level: e.level,
          sig: e.sig,
          grade,
          worldId: familyId,
        });
    }
  }

  function draw(message = null) {
    if (session.status === "complete") return done();
    const c = session.challenge;
    const total = session.rounds;
    const paused = session.status === "paused";
    const head = `<header class="e8gm-bar"><button type="button" class="tr-link" data-gm-menu>← ${esc(L("Back to games", "Volver a los juegos"))}</button><b>${esc(pick(family.title))}</b><span class="e8gm-count">${esc(L(`Round ${Math.min(session.round + 1, total)} of ${total}`, `Ronda ${Math.min(session.round + 1, total)} de ${total}`))}</span><button type="button" class="e8ap-btn" data-e8gm-pause>${esc(paused ? L("Resume", "Continuar") : L("Pause", "Pausa"))}</button></header>`;
    if (paused) {
      container.innerHTML = `<section class="e8gm">${head}<div class="e8gm-paused" role="status"><p>${esc(L("Paused. Take your time.", "En pausa. Tómate tu tiempo."))}</p></div></section>`;
      wire();
      return;
    }
    const tag =
      c.kind === "reason"
        ? L("Explain your thinking", "Explica tu razonamiento")
        : c.followUp
          ? L("A new one on the same idea", "Uno nuevo de la misma idea")
          : L("Challenge", "Desafío");
    let body = "";
    if (c.kind === "numeric")
      body = `<label class="e8ap-label" for="e8gm-ans">${esc(L("Your answer", "Tu respuesta"))}</label><div class="e8ap-row"><input id="e8gm-ans" class="e8ap-input" autocomplete="off" inputmode="text" ${session.settled ? "disabled" : ""}><button type="button" class="e8ap-btn e8ap-primary" data-e8gm-check ${session.settled ? "disabled" : ""}>${esc(L("Check", "Comprobar"))}</button></div>`;
    else if (c.kind === "choice" || (c.kind === "reason" && !c.free))
      body = `<div class="e8ap-col" role="group" aria-label="${esc(L("Choose one", "Elige una"))}">${c.options.map((o, i) => `<button type="button" class="e8ap-btn" data-e8gm-choice="${i}" ${session.settled ? "disabled" : ""}>${esc(pick(o.text))}</button>`).join("")}</div>`;
    else if (c.kind === "reason")
      body = `${session.scaffold > 0 && c.frames?.length ? `<details class="e8gm-frames"><summary>${esc(L("Sentence frames", "Marcos de oraciones"))}</summary>${c.frames.map((f, i) => `<button type="button" class="e8ap-btn" data-e8gm-frame="${i}">${esc(pick(f))}</button>`).join("")}</details>` : ""}<label class="e8ap-label" for="e8gm-free">${esc(L("Your explanation", "Tu explicación"))}</label><textarea id="e8gm-free" rows="3" class="e8ap-input"></textarea><button type="button" class="e8ap-btn e8ap-primary" data-e8gm-free ${session.settled ? "disabled" : ""}>${esc(L("Save my explanation", "Guardar mi explicación"))}</button>`;
    else if (c.kind === "build")
      body = `<div class="e8gm-model"></div><div class="e8ap-row"><button type="button" class="e8ap-btn e8ap-primary" data-e8gm-build ${session.settled ? "disabled" : ""}>${esc(L("Check my build", "Revisar mi construcción"))}</button></div>`;
    const tool = c.tool
      ? `<div class="e8gm-tool"><p class="e8ap-count">${esc(L("A tool to explore (it does not give the answer):", "Una herramienta para explorar (no da la respuesta):"))}</p><div class="e8gm-toolhost"></div></div>`
      : "";
    const hint = !session.settled
      ? `<div class="e8ap-row"><button type="button" class="e8ap-btn" data-e8gm-hint>${esc(L("Give me a hint", "Dame una pista"))}${session.hintsUsed ? ` (${session.hintsUsed}/3)` : ""}</button></div>`
      : "";
    const next = session.settled
      ? `<div class="e8gm-settled ${session.settled.status}"><button type="button" class="e8ap-btn e8ap-primary" data-e8gm-next>${esc(L("Next", "Siguiente"))}</button></div>`
      : "";
    container.innerHTML = `<section class="e8gm" aria-labelledby="e8gm-prompt">${head}<p class="e8ap-count">${esc(tag)}</p><p id="e8gm-prompt" class="e8ap-prompt" tabindex="-1">${esc(pick(c.prompt))}</p>${body}${tool}${hint}<p class="e8ap-why e8gm-feedback" role="status" aria-live="polite">${esc(message ? pick(message) : "")}</p>${next}</section>`;
    if (c.kind === "build") {
      workspace = new Workspace(container.querySelector(".e8gm-model"));
      workspace.show(session.engine);
      workspace.onEvent = () => {};
    }
    if (c.tool && session.tool) {
      toolWorkspace = new Workspace(container.querySelector(".e8gm-toolhost"));
      toolWorkspace.show(session.tool);
    }
    const ansBox = container.querySelector("#e8gm-ans");
    const freeBox = container.querySelector("#e8gm-free");
    if (ansBox) ansBox.value = draft.ans;
    if (freeBox) freeBox.value = draft.free;
    ansBox?.addEventListener("input", () => {
      draft.ans = ansBox.value;
    });
    freeBox?.addEventListener("input", () => {
      draft.free = freeBox.value;
    });
    wire();
    (ansBox || container.querySelector("#e8gm-prompt"))?.focus({ preventScroll: true });
  }

  function settle(result) {
    report();
    save();
    const good = result.status === "correct";
    if (prefs.sound) chime(good ? "correct" : "incorrect");
    const detail = good
      ? {
          en: result.independent
            ? "Right, on your own!"
            : "Right! You got there with some help.",
          es: result.independent
            ? "¡Correcto, tú solo!"
            : "¡Correcto! Lo lograste con algo de ayuda.",
        }
      : {
          en: `Not this time. ${result.explanation?.en || ""}`,
          es: `Esta vez no. ${result.explanation?.es || ""}`,
        };
    draw(detail);
    container
      .querySelector(".e8gm-settled")
      ?.setAttribute("data-state", good ? "right" : "retry");
    container.querySelector("[data-e8gm-next]")?.focus({ preventScroll: true });
  }

  function wire() {
    container
      .querySelector("[data-e8gm-pause]")
      ?.addEventListener("click", () => {
        session.status === "paused" ? session.resume() : session.pause();
        save();
        draw();
      });
    container
      .querySelector("[data-e8gm-hint]")
      ?.addEventListener("click", () => {
        const h = session.hint();
        if (!h) return;
        draw(h.text);
        if (h.repr) {
          const model = new MathVisualEngine(h.repr.model, h.repr.params);
          const holder = document.createElement("div");
          holder.className = "e8gm-repr";
          holder.innerHTML = `<p class="e8ap-count">${esc(L("Here is a picture of the idea:", "Aquí hay una imagen de la idea:"))}</p>${model.render()}`;
          container.querySelector(".e8gm-feedback").after(holder);
        }
      });
    container
      .querySelector("[data-e8gm-next]")
      ?.addEventListener("click", () => {
        draft = { ans: "", free: "" };
        session.next();
        save();
        draw();
      });
    const submit = (value) => {
      const r = session.submit(value);
      if (r.status === "invalid") return draw(r.feedback);
      if (r.status === "incorrect") {
        if (prefs.sound) chime("incorrect");
        return draw(r.feedback);
      }
      if (r.status === "correct" || r.status === "missed") settle(r);
    };
    container
      .querySelector("[data-e8gm-check]")
      ?.addEventListener("click", () =>
        submit(container.querySelector("#e8gm-ans").value),
      );
    container
      .querySelector("#e8gm-ans")
      ?.addEventListener(
        "keydown",
        (e) => e.key === "Enter" && submit(e.target.value),
      );
    container
      .querySelectorAll("[data-e8gm-choice]")
      .forEach((b) =>
        b.addEventListener("click", () => submit(Number(b.dataset.e8gmChoice))),
      );
    container
      .querySelector("[data-e8gm-build]")
      ?.addEventListener("click", () => submit(null));
    container
      .querySelector("[data-e8gm-free]")
      ?.addEventListener("click", () =>
        submit(container.querySelector("#e8gm-free").value),
      );
    container.querySelectorAll("[data-e8gm-frame]").forEach((b) =>
      b.addEventListener("click", () => {
        const a = container.querySelector("#e8gm-free");
        a.value = `${a.value}${a.value ? " " : ""}${pick(session.challenge.frames[Number(b.dataset.e8gmFrame)])}`;
        a.focus();
      }),
    );
  }

  function done() {
    const r = session.results();
    persist?.clear(familyId, grade);
    report();
    finish({
      game: gameIdFor(familyId),
      stars: r.stars,
      missed: [],
      line: pick(r.summary),
    });
  }

  return () => {
    save();
    container.innerHTML = "";
  };
}
