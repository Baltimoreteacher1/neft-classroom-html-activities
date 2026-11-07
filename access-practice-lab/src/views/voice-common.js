// Shared pieces of the Voice Lab (/voice): progress on this device, page header, activity cards and the
// "say it" block (model student → record → length meter) that the ladders, retells and shadowing reuse.
import { crumbsHTML } from "../components.js";
import { summarizeEnvelope } from "../lang/audio.js";
import { takeSpeechSeconds } from "../lang/model-student.js";
import { lengthMeterHTML } from "../model-student-ui.js";
import { isRecording, takesFor } from "../recorder.js";
import { BASE, html, icon } from "../util.js";

export const VOICE_KEY = "accessPracticeLab:v1:voice";

/** Progress on this device: { ladder: { id: [stepIndex…] }, retell: { id: true }, sounds: { setId: wins }, shadow: { setId: [line…] }, keys: { setId: [frame…] }, read: { id: words } }. */
export function loadVoice(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage?.getItem(VOICE_KEY) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
export function saveVoice(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(VOICE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
/** Adds `value` to the list at state[kind][id] once. Returns the list. */
export function markDone(state, kind, id, value) {
  state[kind] ||= {};
  const list = Array.isArray(state[kind][id]) ? state[kind][id] : [];
  if (!list.includes(value)) list.push(value);
  state[kind][id] = list;
  return list;
}

/** The Voice Lab's activity groups, read by the hub and by the Practice page (one list, so neither drifts). */
export const VOICE_GROUPS = [
  { anchor: "voice-ladders", skill: "speaking", title: "Picture speaking ladders", titleEs: "Escaleras de expresión oral con imagen", blurb: "Words, then sentences, then tell more about one picture, with a model student first.", blurbEs: "Palabras, luego oraciones y luego di más sobre una imagen, con un estudiante modelo primero." },
  { anchor: "voice-retell", skill: "listening", title: "Listen or read, then retell", titleEs: "Escucha o lee y vuelve a contar", blurb: "Take in a short source, plan, and retell it. Optional test-day rehearsal.", blurbEs: "Escucha o lee una fuente corta, planea y vuelve a contarla. Ensayo opcional como el día de la prueba." },
  { anchor: "voice-sounds", skill: "listening", title: "Sound Bridge: minimal-pair game", titleEs: "Puente de sonidos: juego de pares mínimos", blurb: "Hear a word and step on the one you heard, like ship or chip. Cross the river; no clock.", blurbEs: "Escucha una palabra y pisa la que oíste, como ship o chip. Cruza el río; sin reloj." },
  { anchor: "voice-shadow", skill: "speaking", title: "Shadowing: hear it, say it, compare", titleEs: "Imitar en voz alta: escucha, dilo y compara", blurb: "A model line plays, you record it, and the two shapes appear side by side.", blurbEs: "Suena una frase modelo, la grabas y las dos formas aparecen una al lado de la otra." },
  { anchor: "voice-keys", skill: "writing", title: "Keyboarding warm-ups (grades 4-8)", titleEs: "Calentamiento de teclado (grados 4 a 8)", blurb: "Type academic sentence frames exactly. Accuracy only: no clock and no speed.", blurbEs: "Escribe marcos de oraciones académicas con exactitud. Solo exactitud: sin reloj ni velocidad." },
  { anchor: "voice-read", skill: "reading", title: "Oral reading: words light up as you read", titleEs: "Lectura en voz alta: las palabras se iluminan", blurb: "Read a short passage aloud. You see only the words you read: no clock, no speed.", blurbEs: "Lee en voz alta un texto corto. Solo ves las palabras que leíste: sin reloj ni velocidad." },
];

export const voiceHref = (path, band) => `${BASE}/voice${path ? `/${path}` : ""}?grades=${band}`;

export function voiceCrumbs(I, band, here = null) {
  const items = [
    [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
    [I.S("Practice", "Practicar"), `${BASE}/library?grades=${band}`],
  ];
  items.push(
    here
      ? [I.S("Voice Lab", "Laboratorio de voz"), voiceHref("", band)]
      : [I.S("Voice Lab", "Laboratorio de voz"), null],
  );
  if (here) items.push([here, null]);
  return crumbsHTML(items, { i18n: I });
}

/** One activity card in the native task-card look. */
export const voiceCardHTML = ({ href, title, ico, kind, desc, done = "" }) =>
  html`<a class="card task-card voice-card" href="${href}">
    <span class="task-top"
      ><span class="task-ico">${icon(ico)}</span
      ><span class="task-kind">${kind}</span
      >${done ? html`<span class="task-time">${icon("check")} ${done}</span>` : ""}</span
    >
    <strong class="task-title">${title}</strong>
    <span class="task-desc">${desc}</span>
  </a>`;

/** The length meter for the newest take on `key`, once a take exists and the microphone is off. */
export function latestMeterHTML(key, model, I, rate) {
  const last = takesFor(key).at(-1);
  if (!model || !last || isRecording(key)) return "";
  return lengthMeterHTML(key, model, takeSpeechSeconds(last, summarizeEnvelope), I, { rate });
}
