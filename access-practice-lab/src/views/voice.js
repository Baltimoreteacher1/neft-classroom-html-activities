// Voice Lab (/voice): speaking and listening workouts that copy the ACCESS speaking routine and build clear speech.
// Routes: /voice (hub), /voice/<kind>/<id>. Each activity lives in its own module; this file routes and lists them.
// Everything runs on this device; recordings stay in the tab unless a rehearsal saves one for the teacher.
import { setComponentsI18n } from "../components.js";
import { KEY_FRAMES, LADDERS, READ_ALOUD, RETELLS, SHADOW_SETS, SOUND_SETS, forBand } from "../content/voice-lab.js";
import { i18nFor } from "../i18n.js";
import { stop as stopSpeech } from "../speech.js";
import { trackDisclosures } from "../studio-ui.js";
import { ART, BASE, html, icon } from "../util.js";
import { VOICE_GROUPS, loadVoice, voiceCardHTML, voiceCrumbs, voiceHref } from "./voice-common.js";
import { ladderClick, ladderHTML } from "./voice-ladder.js";
import { keysClick, keysHTML, keysInput, keysKey } from "./voice-keys.js";
import { readClick, readHTML, readUnmount } from "./voice-read.js";
import { shadowClick, shadowHTML } from "./voice-shadow.js";
import { soundsClick, soundsHTML } from "./voice-sounds.js";
import { onRetellRecorded, retellChange, retellClick, retellHTML, retellInput, retellMount, retellUnmount } from "./voice-retell.js";

/** Kinds of Voice Lab activity: route segment → [render, click, mount?, unmount?]. */
const KINDS = {
  ladder: { render: ladderHTML, click: ladderClick },
  sounds: { render: soundsHTML, click: soundsClick },
  shadow: { render: shadowHTML, click: shadowClick },
  read: { render: readHTML, click: readClick, unmount: readUnmount },
  keys: { render: keysHTML, click: keysClick, input: keysInput, key: keysKey },
  retell: { render: retellHTML, click: retellClick, input: retellInput, change: retellChange, mount: retellMount, unmount: retellUnmount, recorded: onRetellRecorded },
};

/** One hub section, titled from VOICE_GROUPS (the list the Practice page also reads). */
function groupSection(I, anchor, cards) {
  const g = VOICE_GROUPS.find((x) => x.anchor === anchor);
  if (!g || !cards.length) return "";
  const id = anchor;
  const ico = g.skill;
  const title = I.T(g.title, g.titleEs);
  const lead = I.T(g.blurb, g.blurbEs);
  return html`<section class="task-group" id="${id}" aria-labelledby="${id}-h">
    <header>
      <h2 id="${id}-h">${icon(ico)} ${title}</h2>
      <p class="fine">${lead}</p>
    </header>
    <div class="task-grid">${cards}</div>
  </section>`;
}

function hubHTML(ctx, I) {
  const band = ctx.band;
  const v = loadVoice();
  const stepsDone = (id) => (v.ladder?.[id] || []).length;
  const ladders = forBand(LADDERS, band).map((l) =>
    voiceCardHTML({
      href: voiceHref(`ladder/${l.id}`, band),
      title: I.T(l.title, l.titleEs),
      ico: "speaking",
      kind: I.T("Picture ladder", "Escalera con imagen"),
      desc: I.T(
        "Words → sentences → tell more, with a model student first.",
        "Palabras → oraciones → di más, con un estudiante modelo primero.",
      ),
      done: stepsDone(l.id)
        ? I.S(`${stepsDone(l.id)} of 3 steps`, `${stepsDone(l.id)} de 3 pasos`)
        : "",
    }),
  );
  const retells = forBand(RETELLS, band).map((r) =>
    voiceCardHTML({
      href: voiceHref(`retell/${r.id}`, band),
      title: I.T(r.title, r.titleEs),
      ico: r.mode === "listen" ? "listening" : "reading",
      kind:
        r.mode === "listen"
          ? I.T("Listen, then retell", "Escucha y vuelve a contar")
          : I.T("Read, then retell", "Lee y vuelve a contar"),
      desc: I.T(
        "Take in a short source, plan, then say it in your own words.",
        "Escucha o lee una fuente corta, planea y dilo con tus propias palabras.",
      ),
      done: v.retell?.[r.id] ? I.S("Done", "Hecho") : "",
    }),
  );
  const sounds = SOUND_SETS.map((s) =>
    voiceCardHTML({
      href: voiceHref(`sounds/${s.id}`, band),
      title: I.T(s.title, s.titleEs),
      ico: "listening",
      kind: I.T("Sound Bridge game", "Juego Puente de sonidos"),
      desc: s.pairs.slice(0, 3).map((p) => `${p[0]} / ${p[2]}`).join(" · "),
      done: v.sounds?.[s.id] ? I.S(`${v.sounds[s.id]} crossed`, `${v.sounds[s.id]} cruzados`) : "",
    }),
  );
  const shadows = forBand(SHADOW_SETS, band).map((s) =>
    voiceCardHTML({
      href: voiceHref(`shadow/${s.id}`, band),
      title: I.T(s.title, s.titleEs),
      ico: "speaking",
      kind: I.T("Shadowing", "Imitar en voz alta"),
      desc: I.T(`${s.lines.length} short lines to hear, say and compare.`, `${s.lines.length} frases cortas para escuchar, decir y comparar.`),
      done: (v.shadow?.[s.id] || []).length ? I.S(`${v.shadow[s.id].length} of ${s.lines.length}`, `${v.shadow[s.id].length} de ${s.lines.length}`) : "",
    }),
  );
  const keys = KEY_FRAMES.map((s) =>
    voiceCardHTML({
      href: voiceHref(`keys/${s.id}`, band),
      title: I.T(s.title, s.titleEs),
      ico: "writing",
      kind: I.T("Keyboarding", "Teclado"),
      desc: I.T(`${s.frames.length} frames to type exactly.`, `${s.frames.length} marcos para escribir con exactitud.`),
      done: (v.keys?.[s.id] || []).length ? I.S(`${v.keys[s.id].length} of ${s.frames.length}`, `${v.keys[s.id].length} de ${s.frames.length}`) : "",
    }),
  );
  const reads = forBand(READ_ALOUD, band).map((s) =>
    voiceCardHTML({
      href: voiceHref(`read/${s.id}`, band),
      title: I.T(s.title, s.titleEs),
      ico: "reading",
      kind: I.T("Oral reading", "Lectura en voz alta"),
      desc: I.T("Read aloud and watch the words light up.", "Lee en voz alta y mira cómo se iluminan las palabras."),
      done: v.read?.[s.id] ? I.S(`${v.read[s.id].words} words read`, `${v.read[s.id].words} palabras leídas`) : "",
    }),
  );
  return html`${voiceCrumbs(I, band)}
    <div class="d-speaking voice-hub">
      <section class="room-hero studio-hero d-speaking">
        <div class="room-hero-copy">
          <p class="eyebrow">
            ${I.T(`Grades ${band.replace("-", "–")} · speaking and listening`, `Grados ${band.replace("-", "–")} · hablar y escuchar`)}
          </p>
          <h1 tabindex="-1">${I.T("Voice Lab", "Laboratorio de voz")}</h1>
          <p class="lead">
            ${I.T("Short workouts for your speaking voice and your listening ear. Hear a model, say it yourself, and compare. Nothing is timed, and nothing here is a score.", "Ejercicios cortos para tu voz y tu oído. Escucha un modelo, dilo tú y compara. Nada tiene tiempo límite y nada aquí es un puntaje.")}
          </p>
        </div>
        <div class="room-hero-art">
          <img src="${ART}/domain-speaking.svg" width="480" height="360" alt="" decoding="async" />
        </div>
      </section>
      ${groupSection(I, "voice-ladders", ladders)}
      ${groupSection(I, "voice-retell", retells)}
      ${groupSection(I, "voice-sounds", sounds)}
      ${groupSection(I, "voice-shadow", shadows)}
      ${groupSection(I, "voice-read", reads)}
      ${groupSection(I, "voice-keys", keys)}
      <p class="no-print">
        <a class="btn" href="${BASE}/speak?grades=${band}"
          >${icon("speaking")} ${I.T("Speaking Studio", "Estudio de expresión oral")}</a
        >
      </p>
      <p class="disclaimer">
        ${I.T("Practice on this device. Recordings stay in this tab unless you save a rehearsal for your teacher. This is not a WIDA or ACCESS score.", "Práctica en este dispositivo. Las grabaciones se quedan en esta pestaña, a menos que guardes un ensayo para tu docente. Esto no es un puntaje de WIDA ni de ACCESS.")}
      </p>
    </div>`;
}

let current = null; // { kind, id }

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  const kind = ctx.route.id || "";
  const id = ctx.route.sub || "";
  current = { kind, id };
  if (!kind) return { title: I.S("Voice Lab", "Laboratorio de voz"), html: hubHTML(ctx, I) };
  const out = KINDS[kind]?.render(ctx, I, id);
  if (out) return out;
  return {
    title: I.S("Not found", "No se encontró"),
    html: html`${voiceCrumbs(I, ctx.band, I.S("Not found", "No se encontró"))}
      <section class="panel empty-state">
        <img src="${ART}/empty.svg" alt="" width="480" height="300" />
        <h1 tabindex="-1">
          ${I.T("We could not find that activity.", "No pudimos encontrar esa actividad.")}
        </h1>
        <a class="btn" href="${voiceHref("", ctx.band)}"
          >${I.T("Voice Lab", "Laboratorio de voz")}</a
        >
      </section>`,
  };
}

export function onClick(e, ctx) {
  const k = current && KINDS[current.kind];
  return k ? k.click(e, ctx, i18nFor(ctx), current.id) === true : false;
}
export function onInput(e, ctx) {
  const k = current && KINDS[current.kind];
  k?.input?.(e, ctx, i18nFor(ctx), current.id);
}
export function onChange(e, ctx) {
  const k = current && KINDS[current.kind];
  k?.change?.(e, ctx, i18nFor(ctx), current.id);
}
export function onKey(e, ctx) {
  const k = current && KINDS[current.kind];
  k?.key?.(e, ctx, i18nFor(ctx), current.id);
}
export function onRecorded(key) {
  const k = current && KINDS[current.kind];
  if (key.startsWith(`voice:${current?.kind}:`)) k?.recorded?.(current.id, key);
}
export function mount(root, ctx) {
  trackDisclosures(root);
  const k = current && KINDS[current.kind];
  k?.mount?.(root, ctx, i18nFor(ctx), current.id);
}
export function unmount() {
  const k = current && KINDS[current.kind];
  k?.unmount?.();
  stopSpeech();
}
