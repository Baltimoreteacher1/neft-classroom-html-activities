import { canSpeak, getAvailableVoices, spanishVoiceStatus, speak, stop } from "../src/speech.js";

const params = new URLSearchParams(location.search);
const views = {
  listening: { kind: "Listening", heading: ["Listening passages", "Pasajes para escuchar"] },
  speaking: { kind: "Speaking model", heading: ["Speaking models", "Modelos para hablar"] },
  family: { kind: "Family directions", heading: ["Family directions", "Instrucciones para familias"] },
};
const viewName = Object.hasOwn(views, params.get("view")) ? params.get("view") : "listening";
const view = views[viewName];
const family = viewName === "family";
const spanish = family && params.get("lang") === "es";
const text = (en, es) => (spanish ? es : en);
const get = (id) => document.getElementById(id);
const grade = get("grades");
const status = get("status");
const grid = get("clips");
let activeButton;

function element(tag, value) {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  return node;
}

function stopDeviceVoice() {
  if (!activeButton) return;
  activeButton.textContent = text("Play device voice", "Escuchar la voz del dispositivo");
  activeButton.setAttribute("aria-pressed", "false");
  activeButton = null;
  stop();
}

function useDeviceVoice(clip, button) {
  const wasPlaying = activeButton === button;
  stopDeviceVoice();
  if (wasPlaying) return;
  grid.querySelectorAll("audio").forEach((audio) => audio.pause());
  status.textContent = "";
  if (!canSpeak() || (spanish && spanishVoiceStatus(getAvailableVoices()) === "none")) {
    status.textContent = text("Audio is unavailable on this device. Open the transcript to read along.", "El audio no está disponible en este dispositivo. Abre la transcripción para leer.");
    return;
  }
  activeButton = button;
  button.setAttribute("aria-pressed", "true");
  button.textContent = text("Stop", "Detener");
  speak(clip.transcript, { lang: clip.language }).then((completed) => {
    if (activeButton !== button) return;
    stopDeviceVoice();
    if (!completed) status.textContent = text("Audio could not play. The transcript is available.", "No se pudo reproducir el audio. Puedes leer la transcripción.");
  });
}

function deviceButton(clip) {
  const button = element("button", text("Play device voice", "Escuchar la voz del dispositivo"));
  button.type = "button";
  button.setAttribute("aria-label", text(`Device voice for ${clip.title}`, `Voz del dispositivo para ${clip.title}`));
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => useDeviceVoice(clip, button));
  return button;
}

function player(clip, recorded) {
  if (!recorded.has(clip.id)) return deviceButton(clip);
  const audio = element("audio");
  audio.controls = true;
  audio.preload = "none";
  audio.setAttribute("aria-label", clip.title);
  audio.src = `./audio/${clip.id}.mp3`;
  audio.addEventListener("play", () => {
    stopDeviceVoice();
    grid.querySelectorAll("audio").forEach((other) => {
      if (other !== audio) other.pause();
    });
  });
  audio.addEventListener("error", () => audio.replaceWith(deviceButton(clip)), { once: true });
  return audio;
}

function details(label, value) {
  const group = element("details");
  group.append(element("summary", label), element("p", value));
  return group;
}

function card(clip, recorded) {
  const article = element("article");
  article.lang = clip.language;
  article.append(element("h3", clip.title));
  if (clip.language_use) {
    const kind = element("p", clip.language_use);
    kind.className = "kind";
    article.append(kind);
  }
  article.append(player(clip, recorded));
  if (clip.task) article.append(element("p", clip.task));
  article.append(details(text("Transcript", "Transcripción"), clip.transcript));
  if (clip.followup) article.append(details("Try it again", clip.followup));
  return article;
}

function localize() {
  document.documentElement.lang = text("en", "es");
  const title = text("Audio practice", "Práctica con audio");
  document.title = `${title} · The Language Page`;
  get("title").textContent = title;
  get("intro").textContent = family
    ? text("Short directions for optional practice at home.", "Instrucciones breves para practicar en casa, si quieren.")
    : "Listen, open the transcript if you need it, and try the activity.";
  get("activity-title").textContent = text(...view.heading);
  get("grade-control").hidden = family;
  get("languages").hidden = !family;
  if (family) {
    get("back").href = `/access-practice-lab/family-tour/?lang=${text("en", "es")}`;
    get("back").textContent = text("← Family Tour", "← Recorrido familiar");
  }
  grade.value = /^(g)?6[-–]8$/.test(params.get("grades") || "") ? "6–8" : "3–5";
  get("practice-types").setAttribute("aria-label", text("Practice type", "Tipo de práctica"));
  const band = grade.value.replace("–", "-");
  const labels = { listening: "Escuchar", speaking: "Modelos para hablar", family: "Instrucciones para familias" };
  for (const link of get("practice-types").querySelectorAll("a")) {
    const kind = link.dataset.view;
    link.href = `?view=${kind}&grades=${band}${spanish && kind === "family" ? "&lang=es" : ""}`;
    if (kind === viewName) link.setAttribute("aria-current", "page");
    if (spanish) link.textContent = labels[kind];
  }
  get("languages").querySelector(`[lang="${text("en", "es")}"]`).setAttribute("aria-current", "page");
}

async function readJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}.`);
  return response.json();
}

async function start() {
  localize();
  status.textContent = text("Loading activities…", "Cargando actividades…");
  try {
    const [clips, media] = await Promise.all([readJSON("./clips.json"), readJSON("./audio-files.json").catch(() => [])]);
    const recorded = new Set(media);
    function render() {
      stopDeviceVoice();
      status.textContent = "";
      grid.replaceChildren(...clips
        .filter((clip) => clip.kind === view.kind && (family ? clip.language === text("en-US", "es-US") : clip.band === grade.value))
        .map((clip) => card(clip, recorded)));
    }
    grade.addEventListener("change", () => {
      params.set("grades", grade.value.replace("–", "-"));
      history.replaceState(null, "", `?${params}`);
      localize();
      render();
    });
    window.addEventListener("pagehide", stopDeviceVoice);
    render();
  } catch {
    status.textContent = text("The activities didn’t load. Try refreshing the page.", "No se pudieron cargar las actividades. Intenta actualizar la página.");
  }
}

start();
