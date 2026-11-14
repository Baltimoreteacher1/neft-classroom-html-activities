// One student-made scene, played the Real-Life Scenarios way: the scenario art (place + character), what the other
// person says, the replies to choose from, and the same feedback wording (QUALITY) the scenario player uses. Every
// student string goes in as text (el() never parses HTML); the art escapes its label itself.
import { QUALITY } from "../lang/scenarios.js";
import { canSpeak, speak } from "../speech.js";
import { LEARNER_LOOKS, sceneSVG } from "../views/scenario-art.js";
import { el } from "./dom.js";
import { PLACE_NAMES, artScene, replyChoices } from "./scene-model.js";

/** An <audio> that fetches its bytes on first play (the class routes need headers an audio src cannot send). */
export function lazyAudio(label, load) {
  const audio = el("audio", { controls: true, preload: "none", "aria-label": label });
  audio.addEventListener(
    "play",
    async () => {
      if (audio.src) return;
      const blob = await load();
      if (blob) {
        audio.src = URL.createObjectURL(blob);
        audio.play().catch(() => {});
      }
    },
    { once: true },
  );
  return audio;
}

/** The player card. `picked` is the chosen reply or null; the callbacks redraw. */
export function scenePlayerCard({ S, item, picked, rate, loadAudio, onPick, onRetry, onBack }) {
  const sc = item.scene;
  const art = artScene(sc);
  const stage = el("div", { class: "scn-stage" });
  stage.innerHTML = sceneSVG(art, {
    mood: picked?.q === 0 ? "concerned" : picked ? "happy" : "neutral",
    learner: LEARNER_LOOKS[0],
    label: `${sc.title}: ${art.npc.name}`,
  });
  const who = `${art.npc.name} · ${S(art.npc.role, art.npc.roleEs || art.npc.role)}`;
  const listen = canSpeak()
    ? el("div", { class: "wl-actions" }, el("button", { type: "button", class: "btn small", onclick: () => speak(sc.lines.join(" "), { rate }) }, S("Listen", "Escuchar")))
    : null;
  const choice = (c) => {
    const state = picked ? (picked.id === c.id ? `is-picked q${c.q}` : "is-dim") : "";
    return el("button", { type: "button", class: `wl-choice scn-choice ${state}`, disabled: !!picked, "aria-pressed": String(picked?.id === c.id), onclick: () => onPick(c) }, el("span", { lang: "en" }, `“${c.say}”`));
  };
  const card = el(
    "section",
    { class: "cls-card scn-play d-speaking", "aria-labelledby": "scPlayH" },
    el("h2", { id: "scPlayH", tabindex: "-1" }, sc.title),
    el("p", { class: "fine" }, `${S("Written by", "Escrita por")} ${item.alias} · ${S(...PLACE_NAMES[sc.place])}`),
    stage,
    el("p", { class: "lead" }, el("b", {}, `${S("The situation:", "La situación:")} `), sc.situation),
    el("div", { class: "scn-bubble is-npc", role: "group", "aria-label": who }, el("p", { class: "scn-name" }, who), sc.lines.map((line) => el("p", { class: "scn-say", lang: "en" }, line)), listen),
    item.hasAudio ? el("p", {}, `${S("A line in the writer's own voice", "Una frase con la voz de quien la escribió")}: `, lazyAudio(S(`${item.alias}'s voice`, `La voz de ${item.alias}`), loadAudio)) : null,
    el("h3", {}, S("What do you say?", "¿Qué dices?")),
    el("div", { class: "wl-choices", role: "group", "aria-label": S("Choose what to say", "Elige qué decir") }, replyChoices(sc, item.sceneId).map(choice)),
  );
  if (!picked) {
    card.append(el("button", { type: "button", class: "btn ghost", onclick: onBack }, S("Back", "Volver")));
    return card;
  }
  card.append(
    el("div", { class: `wl-feedback ${picked.q === 2 ? "is-right" : "is-try"}`, role: "status" }, el("p", {}, el("b", {}, S(...QUALITY[picked.q]))), picked.why ? el("p", { lang: "en" }, picked.why) : null),
    el(
      "div",
      { class: "wl-actions" },
      picked.q < 2 ? el("button", { type: "button", class: "btn", onclick: onRetry }, S("Try a different choice", "Probar otra opción")) : null,
      el("button", { type: "button", class: "btn", onclick: onBack }, S("All class scenes", "Todas las escenas de la clase")),
    ),
  );
  return card;
}
