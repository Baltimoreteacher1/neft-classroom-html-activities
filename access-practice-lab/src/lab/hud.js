// The minimal HUD every game frame shares.
//   Left   game title, grade band, WIDA domain badges (L / R / S / W)
//   Right  scaffold tier, language chrome (EN | ES | EN+ES), audio / mic status, reset
// Bilingual rule: ES and EN+ES translate the chrome (labels, directions, status) and never the English
// being practiced. The Math Workbench link appears only when the task is tagged LoMA.
import { html, icon, raw } from "../util.js";
import { LANG_LABELS, LANG_MODES } from "../i18n.js";
import {
  DOMAINS,
  DOMAIN_CODE,
  DOMAIN_NAME_ES,
  MATH_AREA,
  TIERS,
  gameMeta,
  tierOfSupport,
} from "./meta.js";
import { SLOW_FACTOR, slowAllowed } from "./listening.js";

export const MATH_WORKBENCH_HREF = "/curriculum/math-workbench/";
const TIER_ORDER = ["independent", "guided", "hands-on"];

const domainBadges = (I, meta) =>
  html`<ul
    class="lh-domains"
    aria-label="${I.S("WIDA language domains", "Dominios de lenguaje de WIDA")}"
  >
    ${DOMAINS.map((d) => {
      const on = meta.domains.includes(d);
      const name = I.S(d, DOMAIN_NAME_ES[d]);
      return html`<li class="lh-domain${on ? " is-on" : ""}" data-domain="${d}" title="${name}">
        <span aria-hidden="true">${DOMAIN_CODE[d]}</span
        ><span class="visually-hidden"
          >${name}${on ? "" : ` (${I.S("not used in this game", "no se usa en este juego")})`}</span
        >
      </li>`;
    })}
  </ul>`;

const tierSwitch = (I, support) => {
  const current = tierOfSupport(support);
  return html`<div
    class="lh-tiers"
    role="group"
    aria-label="${I.S("Scaffold tier", "Nivel de apoyo")}"
  >
    ${TIER_ORDER.map((id) => html`<button type="button" class="lh-tier" data-g-support="${TIERS[id].support}" aria-pressed="${String(id === current)}">${I.T(TIERS[id].en, TIERS[id].es)}</button>`)}
  </div>`;
};

const langSwitch = (I) =>
  html`<div class="lh-lang" role="group" aria-label="Language / Idioma">
    ${LANG_MODES.map((m) => html`<button type="button" class="lh-lang-btn" data-lang-mode="${m}" aria-pressed="${String(m === I.mode)}" ${m === "es" ? raw(' lang="es"') : ""} aria-label="${LANG_LABELS[m].name}"><span aria-hidden="true">${LANG_LABELS[m].short}</span></button>`)}
  </div>`;

/** Status key + label for the audio / mic pill. `speaking` games care about the microphone, the rest about hearing. */
export function micStatus(I, { speaking = false, canSpeak = true, canRecord = true, state = "" } = {}) {
  if (speaking) {
    if (!canRecord) return { key: "fallback", label: I.S("No microphone: you can type instead", "Sin micrófono: puedes escribir") };
    if (state === "MIC_BLOCKED_FALLBACK") return { key: "fallback", label: I.S("Microphone blocked: you can type instead", "Micrófono bloqueado: puedes escribir") };
    if (state === "RECORDING") return { key: "live", label: I.S("Recording", "Grabando") };
    if (state === "MONITORING_LEVEL" || state === "REQUESTING_MIC") return { key: "live", label: I.S("Microphone on", "Micrófono activado") };
    return { key: "ok", label: I.S("Microphone ready to check", "Micrófono listo para revisar") };
  }
  if (!canSpeak) return { key: "fallback", label: I.S("No audio voice on this device: read the text", "Sin voz en este dispositivo: lee el texto") };
  return { key: "ok", label: I.S("Audio ready", "Audio listo") };
}

export function micPill(I, opts = {}) {
  const { key, label } = micStatus(I, opts);
  return html`<span class="lh-mic" role="status" data-mic="${key}">${icon(opts.speaking ? "speaking" : "listening")}<span class="lh-mic-t">${label}</span></span>`;
}

export function hudHTML({
  I,
  g,
  band,
  session,
  canSpeak = true,
  canRecord = true,
  contentArea = "",
}) {
  const meta = gameMeta(g.id) || { domains: [...DOMAINS], contentArea: "LoELA" };
  const area = contentArea || meta.contentArea;
  const tier = tierOfSupport(session.support);
  const listening = g.skill === "Listening";
  const speaking = g.skill === "Speaking" || meta.domains.includes("Speaking");
  const slow = Boolean(session.lab?.slow);
  return html`<div class="lh" data-tier="${tier}" data-content-area="${area}">
    <div class="lh-left">
      <p class="lh-title"><strong>${I.T(g.title[0], g.title[1])}</strong></p>
      <span class="lh-band"
        >${I.T(`Grades ${band.replace("-", "–")}`, `Grados ${band.replace("-", "–")}`)}</span
      >
      ${domainBadges(I, meta)}
    </div>
    <div class="lh-right">
      ${tierSwitch(I, session.support)} ${langSwitch(I)}
      ${micPill(I, { speaking, canSpeak, canRecord })}
      ${listening && slowAllowed(tier) ? html`<button type="button" class="lh-slow" data-lab-slow aria-pressed="${String(slow)}">${I.T(`Slow ${SLOW_FACTOR}×`, `Lento ${SLOW_FACTOR}×`)}</button>` : ""}
      ${area === MATH_AREA ? html`<a class="lh-math" href="${MATH_WORKBENCH_HREF}" target="_blank" rel="noopener">${icon("tools")}${I.T("Math Workbench", "Taller de matemáticas")}</a>` : ""}
      <details class="lh-reset">
        <summary>${I.T("Reset", "Reiniciar")}</summary>
        <button type="button" class="btn small" data-g-again="${session.support}">
          ${I.T("Yes, start this game over", "Sí, empezar este juego de nuevo")}
        </button>
      </details>
    </div>
  </div>`;
}

/** Update the mic pill in place when an AudioGuard changes state (the `lab:audio-state` event from audio-guard.js). */
export function updateMicPill(root, I, state) {
  const pill = root.querySelector(".lh-mic");
  if (!pill) return;
  const { key, label } = micStatus(I, { speaking: true, state });
  pill.dataset.mic = key;
  const text = pill.querySelector(".lh-mic-t");
  if (text) text.textContent = label;
}
