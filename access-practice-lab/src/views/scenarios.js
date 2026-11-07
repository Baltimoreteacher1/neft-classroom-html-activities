// Real-Life Scenarios (/scenarios): branching conversation simulations with illustrated characters. The learner chooses
// what to say, hears how it lands, can try a different choice, then practices saying the lines they chose (Web Speech
// to hear a model, MediaRecorder to record, speech-to-text to see their words, or typing). Feedback is about the
// language target (politeness, clarity, question forms, requests, apologies, polite disagreement), never pronunciation.
import { recorderHTML, setComponentsI18n } from "../components.js";
import { SCENES } from "../content/scenarios.js";
import { i18nFor } from "../i18n.js";
import {
  GROUPS,
  PLACE_GROUP,
  QUALITY,
  TAGS,
  checkLine,
  choiceOf,
  currentNode,
  nodeOf,
  summarize,
  transcript,
} from "../lang/scenarios.js";
import { canRecord, isRecording } from "../recorder.js";
import { canDictate, startDictation } from "../stt.js";
import { announce, html, icon, raw } from "../util.js";
import { LEARNER_LOOKS, characterSVG, placeThumbSVG, sceneSVG } from "./scenario-art.js";
import { heroArt } from "./studio-art.js";
import {
  LEVELS,
  bandFor,
  levelOf,
  levelPickerHTML,
  loadState,
  recordEvidence,
  saveState,
  speakBtn,
  studioCrumbs,
  studioHero,
  studioHref,
} from "./studio-kit.js";

export const SC_KEY = "accessPracticeLab:v1:scenarios";
const DEFAULT = { level: "B", look: 0, cur: null, done: {} };
const state = () => loadState(SC_KEY, DEFAULT);
const forBand = (band) => SCENES.filter((s) => s.b === band || s.b === "both");
const href = (id, band) => studioHref("scenarios", id, band);
const QUALITY_ICON = { 2: "check", 1: "bulb", 0: "alert" };
const KIND_USE = { disagree: "Argue", explain: "Explain", describe: "Inform" };

let ui = { es: false, say: {}, dict: null };
let current = "";

function hubHTML(ctx, I, st) {
  const band = bandFor(ctx.band);
  const scenes = forBand(band);
  const level = levelOf(st);
  const doneCount = scenes.filter((s) => st.done[s.id]).length;
  return html`${studioCrumbs(I, band, "scenarios", I.S("Real-Life Scenarios", "Escenas de la vida real"))}
    ${studioHero({
      I,
      ico: "conversation",
      cls: "d-speaking",
      kicker: I.T(
        `Grades ${band.replace("-", "–")} · speaking and listening`,
        `Grados ${band.replace("-", "–")} · hablar y escuchar`,
      ),
      title: I.T("Real-Life Scenarios", "Escenas de la vida real"),
      lead: I.T(
        `${scenes.length} short conversations: the school office, the doctor, the bus, the store and more. Choose what to say, hear how it lands, try again, then practice saying it. No clock and no score.`,
        `${scenes.length} conversaciones cortas: la oficina de la escuela, el doctor, el autobús, la tienda y más. Elige qué decir, escucha cómo cae, inténtalo otra vez y luego practica decirlo. Sin reloj y sin puntaje.`,
      ),
      art: raw(heroArt("scenarios")),
    })}
    ${levelPickerHTML(I, level)}
    <section class="panel" aria-labelledby="sc-me-h">
      <h2 id="sc-me-h">${I.T("Choose your character", "Elige tu personaje")}</h2>
      <div
        class="scn-looks"
        role="radiogroup"
        aria-label="${I.S("Your character", "Tu personaje")}"
      >
        ${LEARNER_LOOKS.map((l, i) => html`<button type="button" class="scn-look ${i === st.look ? "is-on" : ""}" data-sc-look="${i}" role="radio" aria-checked="${String(i === st.look)}" aria-label="${I.S(`Character ${i + 1}`, `Personaje ${i + 1}`)}"><svg viewBox="-40 -100 80 130" width="54" height="86" aria-hidden="true" focusable="false">${raw(characterSVG(l, "happy", 0, 20, 1))}</svg></button>`)}
      </div>
      <p class="fine">
        ${I.T(`${doneCount} of ${scenes.length} scenes finished on this device.`, `${doneCount} de ${scenes.length} escenas terminadas en este dispositivo.`)}
      </p>
    </section>
    ${GROUPS.map(([g, en, es]) => {
      const list = scenes.filter((s) => PLACE_GROUP[s.place] === g);
      return list.length
        ? html`<section class="task-group" aria-labelledby="sc-g-${g}">
            <h2 id="sc-g-${g}">${I.T(en, es)}</h2>
            <div class="task-grid">
              ${list.map((s) => html`<a class="card task-card scn-card" href="${href(s.id, band)}">${raw(placeThumbSVG(s))}<strong class="task-title">${I.T(s.title, s.titleEs)}</strong><span class="task-desc">${I.T(s.goal, s.goalEs)}</span><span class="scn-tags">${s.focus.map((t) => html`<span class="wl-chip">${I.T(TAGS[t][0], TAGS[t][1])}</span>`)}</span>${st.done[s.id] ? html`<span class="task-time">${icon("check")} ${I.T(`Finished · ${st.done[s.id].runs} ${st.done[s.id].runs === 1 ? "time" : "times"}`, `Terminada · ${st.done[s.id].runs} ${st.done[s.id].runs === 1 ? "vez" : "veces"}`)}</span>` : ""}</a>`)}
            </div>
          </section>`
        : "";
    })}
    <p class="disclaimer">
      ${I.T("Practice on this device. The lab checks your words, never your accent. Nothing here is a WIDA or ACCESS score.", "Práctica en este dispositivo. El laboratorio revisa tus palabras, nunca tu acento. Nada aquí es un puntaje de WIDA ni de ACCESS.")}
    </p>`;
}

const bubble = (I, who, node, level, side) =>
  html`<div class="scn-bubble is-${side}" role="group" aria-label="${who}">
    <p class="scn-name">${who}</p>
    <p class="scn-say">${node.say}</p>
    ${ui.es || level === "A" ? html`<p class="scn-say-es" lang="es">${node.sayEs}</p>` : ""}
    <div class="wl-actions">
      ${speakBtn(I, node.say)}${level === "A" ? "" : html`<button type="button" class="btn small" data-sc-es aria-pressed="${String(ui.es)}">${icon("language")} ${ui.es ? I.T("Hide Spanish", "Ocultar español") : I.T("Spanish help", "Ayuda en español")}</button>`}
    </div>
  </div>`;

function playHTML(ctx, I, st, scene) {
  const band = bandFor(ctx.band);
  const level = levelOf(st);
  const cur =
    st.cur && st.cur.id === scene.id ? st.cur : { id: scene.id, path: [], ack: true, retries: 0 };
  const nodeId = currentNode(scene, cur.path, cur.ack !== false);
  const node = nodeOf(scene, nodeId);
  const looks = LEARNER_LOOKS[st.look] || LEARNER_LOOKS[0];
  const speaker = node.who === "npc2" && scene.npc2 ? scene.npc2 : scene.npc;
  const title = I.T(scene.title, scene.titleEs);
  const art = raw(
    sceneSVG(scene, {
      mood: node.mood || "neutral",
      who: node.who || "npc",
      learner: looks,
      label: I.S(
        `${scene.title}: ${speaker.name} the ${speaker.role}`,
        `${scene.titleEs}: ${speaker.name}, ${speaker.roleEs}`,
      ),
    }),
  );
  const head = html`${studioCrumbs(I, band, "scenarios", I.S("Real-Life Scenarios", "Escenas de la vida real"), I.S(scene.title, scene.titleEs))}
    <article class="scn-play d-speaking">
      <header class="act-head">
        <h1 tabindex="-1">${title}</h1>
        <p class="lead"><b>${I.T("Your goal:", "Tu meta:")}</b> ${I.T(scene.goal, scene.goalEs)}</p>
        <p class="scn-tags">
          ${scene.focus.map((t) => html`<span class="wl-chip">${I.T(TAGS[t][0], TAGS[t][1])}</span>`)}
        </p>
      </header>
      <div class="scn-stage">${art}</div>
    </article>`;
  if (node.end) return html`${head}${summaryHTML(ctx, I, st, scene, cur, node)}</article>`;
  const pending = cur.ack === false && cur.path.length;
  const chosen = pending ? choiceOf(nodeOf(scene, cur.path.at(-1).n), cur.path.at(-1).c) : null;
  const shown = pending ? nodeOf(scene, cur.path.at(-1).n) : node;
  const turnNo = cur.path.length + (pending ? 0 : 1);
  return html`${head}
    ${bubble(I, `${speaker.name} · ${I.T(speaker.role, speaker.roleEs)}`, shown, level, "npc")}
    <section class="panel scn-choices" aria-labelledby="sc-ch-h"><h2 id="sc-ch-h">${I.T(`Your turn ${turnNo}: what do you say?`, `Tu turno ${turnNo}: ¿qué dices?`)}</h2>
      <div class="wl-choices" role="group" aria-label="${I.S("Choose what to say", "Elige qué decir")}">
        ${shown.choices.map((c) => html`<button type="button" class="wl-choice scn-choice ${chosen ? (c.id === chosen.id ? `is-picked q${c.q}` : "is-dim") : ""}" data-sc-choose="${c.id}" ${chosen ? "disabled" : ""} aria-pressed="${String(chosen?.id === c.id)}"><span>“${c.say}”</span>${ui.es || level === "A" ? html`<small lang="es">${c.sayEs}</small>` : ""}${level === "A" && !chosen ? html`<small class="wl-chip">${I.T(TAGS[c.tag][0], TAGS[c.tag][1])}</small>` : ""}</button>`)}
      </div>
      ${
        chosen
          ? html`<div class="wl-feedback ${chosen.q === 2 ? "is-right" : "is-try"}" role="status">
                <p>
                  <b
                    >${icon(QUALITY_ICON[chosen.q])}
                    ${I.T(QUALITY[chosen.q][0], QUALITY[chosen.q][1])}</b
                  >
                  <span class="wl-chip">${I.T(TAGS[chosen.tag][0], TAGS[chosen.tag][1])}</span>
                </p>
                <p>${I.T(chosen.why, chosen.whyEs)}</p>
              </div>
              <div class="wl-actions">
                <button type="button" class="btn btn-primary" data-sc-continue>
                  ${I.T("Continue", "Continuar")} ${icon("arrow-right")}
                </button>
                ${chosen.q < 2 ? html`<button type="button" class="btn" data-sc-undo>${icon("retry")} ${I.T("Try a different choice", "Probar otra opción")}</button>` : ""}
              </div>`
          : ""
      }
    </section>${levelPickerHTML(I, level, "data-sk-level", true)}</article>`;
}

function sayHTML(ctx, I, st, scene, turns) {
  return html`<section class="panel scn-say-it" aria-labelledby="sc-say-h">
    <h2 id="sc-say-h">${icon("speaking")} ${I.T("Say it", "Dilo")}</h2>
    <p>
      ${I.T("Practice the lines you chose. Hear the model, then say it out loud and record it, or speak and see your words, or type it. The check looks at your words only, never your accent or speed.", "Practica las frases que elegiste. Escucha el modelo, luego dilo en voz alta y grábalo, o habla y mira tus palabras, o escríbelo. La revisión mira solo tus palabras, nunca tu acento ni tu velocidad.")}
    </p>
    <ol class="scn-say-list">
      ${turns.map((t, i) => {
        const key = `scn:${scene.id}:${i}`;
        const s = ui.say[i] || {};
        const res = s.res;
        return html`<li class="scn-say-item">
          <p class="scn-line">“${t.ch.say}”</p>
          <div class="wl-actions">
            ${speakBtn(I, t.ch.say)}${canDictate() ? html`<button type="button" class="btn small" data-sc-dict="${i}" aria-pressed="${String(ui.dict?.i === i)}">${icon("record")} ${ui.dict?.i === i ? I.T("Stop and show my words", "Detener y mostrar mis palabras") : I.T("Speak and see my words", "Hablar y ver mis palabras")}</button>` : ""}
          </div>
          ${canRecord() ? recorderHTML(key, { recording: isRecording(key), i18n: I }) : html`<p class="fine">${I.T("This browser cannot record. Say the line aloud to a partner, then type it below.", "Este navegador no puede grabar. Di la frase en voz alta a un compañero y luego escríbela abajo.")}</p>`}
          <label class="wl-q"
            ><span>${I.T("Type or check your words", "Escribe o revisa tus palabras")}</span
            ><textarea rows="2" data-sc-text="${i}">${s.text || ""}</textarea>
          </label>
          <button type="button" class="btn small" data-sc-check="${i}">
            ${I.T("Check my words", "Revisar mis palabras")}
          </button>
          ${res ? (res.empty ? html`<p class="fine" role="status">${I.T("Type or say something first.", "Primero escribe o di algo.")}</p>` : html`<div class="wl-feedback ${res.ok ? "is-right" : "is-try"}" role="status">${icon(res.ok ? "check" : "bulb")} ${res.ok ? I.T(`Your words show: ${TAGS[t.ch.tag][0].toLowerCase()}.`, `Tus palabras muestran: ${TAGS[t.ch.tag][1].toLowerCase()}.`) : I.T(`Not yet: ${TAGS[t.ch.tag][0].toLowerCase()}. ${res.hint}`, `Todavía no: ${TAGS[t.ch.tag][1].toLowerCase()}. ${TAGS[t.ch.tag][2]}`)}</div>`) : ""}
        </li>`;
      })}
    </ol>
  </section>`;
}

function summaryHTML(ctx, I, st, scene, cur, end) {
  const band = bandFor(ctx.band);
  const { turns } = transcript(scene, cur.path);
  const sum = summarize(scene, cur.path);
  const better = turns.filter((t) => t.ch.q < 2 && t.strong);
  return html`<section class="panel scn-summary" aria-labelledby="sc-sum-h">
      ${bubble(I, `${scene.npc.name}`, end, levelOf(st), "npc")}
      <h2 id="sc-sum-h">
        ${icon("check")} ${I.T("Conversation finished", "Conversación terminada")}
      </h2>
      <p>${I.T(end.wrap, end.wrapEs)}</p>
      <h3>${I.T("The language you used", "El lenguaje que usaste")}</h3>
      <ul class="scn-used">
        ${Object.entries(sum.tags).map(([tag, k]) => html`<li class="${k.strong ? "is-right" : "is-try"}">${icon(k.strong ? "check" : "bulb")} <b>${I.T(TAGS[tag][0], TAGS[tag][1])}</b>: ${k.strong ? I.T("clear and polite", "claro y cortés") : I.T("understood; see a stronger line below", "se entendió; mira una frase más fuerte abajo")}</li>`)}
      </ul>
      <h3>${I.T("What was said", "Lo que se dijo")}</h3>
      <ol class="scn-transcript">
        ${turns.map((t) => html`<li><span class="scn-who">${scene.npc.name}:</span> ${t.npcSaid}<br /><span class="scn-who">${I.T("You", "Tú")}:</span> “${t.ch.say}” <small>${I.T(QUALITY[t.ch.q][0], QUALITY[t.ch.q][1])}</small></li>`)}
      </ol>
      ${
        better.length
          ? html`<h3>${I.T("Next time you could say", "La próxima vez podrías decir")}</h3>
              <ul class="scn-better">
                ${better.map((t) => html`<li>“${t.ch.say}” ${icon("arrow-right")} <b>“${t.strong.say}”</b><small>${I.T(t.strong.why, t.strong.whyEs)}</small></li>`)}
              </ul>`
          : html`<p>
              ${I.T("Every line you chose was clear and polite.", "Todas las frases que elegiste fueron claras y corteses.")}
            </p>`
      }
      <div class="wl-actions no-print">
        <button type="button" class="btn btn-primary" data-sc-replay>
          ${icon("retry")} ${I.T("Replay with different choices", "Repetir con otras opciones")}</button
        ><a class="btn" href="${href("", band)}">${I.T("All scenes", "Todas las escenas")}</a
        ><button type="button" class="btn" data-print>
          ${icon("print")} ${I.T("Print the summary", "Imprimir el resumen")}
        </button>
      </div>
    </section>
    <div class="no-print">${sayHTML(ctx, I, st, scene, turns)}</div>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  const id = ctx.route.id || "";
  if (current !== id) ui = { es: false, say: {}, dict: null };
  current = id;
  const st = state();
  const scene = id
    ? forBand(bandFor(ctx.band)).find((s) => s.id === id) || SCENES.find((s) => s.id === id)
    : null;
  if (!id || !scene)
    return {
      title: I.S("Real-Life Scenarios", "Escenas de la vida real"),
      html: hubHTML(ctx, I, st),
    };
  return {
    title: `${I.S(scene.title, scene.titleEs)} · ${I.S("Real-Life Scenarios", "Escenas de la vida real")}`,
    html: playHTML(ctx, I, st, scene),
  };
}

function finish(ctx, st, scene) {
  const cur = st.cur;
  const sum = summarize(scene, cur.path);
  const rec = (st.done[scene.id] ||= { runs: 0 });
  const first = rec.runs === 0;
  rec.runs += 1;
  rec.strong = sum.strong;
  rec.turns = sum.turns;
  cur.fin = true;
  const main = scene.focus[0];
  recordEvidence({
    src: "scenario",
    task: scene.id,
    band: bandFor(ctx.band),
    domain: "Speaking",
    use: KIND_USE[main] || "Inform",
    level: levelOf(st),
    opened: ui.es ? { l1: true } : {},
    kind: first ? "first" : "retry",
    m: {
      turns: sum.turns,
      strong: sum.strong,
      ok: sum.ok,
      weak: sum.weak,
      targets: sum.targetsShown,
      retries: cur.retries || 0,
    },
  });
}

export function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const st = state();
  const t = e.target;
  const lvl = t.closest("[data-sk-level]");
  if (lvl && LEVELS.includes(lvl.dataset.skLevel)) {
    st.level = lvl.dataset.skLevel;
    saveState(SC_KEY, st);
    return (ctx.rerender(), true);
  }
  const look = t.closest("[data-sc-look]");
  if (look) {
    st.look = Number(look.dataset.scLook);
    saveState(SC_KEY, st);
    return (ctx.rerender(), true);
  }
  const scene = SCENES.find((s) => s.id === current);
  if (!scene) return false;
  if (t.closest("[data-sc-es]")) return ((ui.es = !ui.es), ctx.rerender(), true);
  const cur =
    st.cur && st.cur.id === scene.id
      ? st.cur
      : (st.cur = { id: scene.id, path: [], ack: true, retries: 0 });
  const choose = t.closest("[data-sc-choose]");
  if (choose && cur.ack !== false) {
    const nodeId = currentNode(scene, cur.path, true);
    cur.path.push({ n: nodeId, c: choose.dataset.scChoose });
    cur.ack = false;
    saveState(SC_KEY, st);
    const c = choiceOf(nodeOf(scene, nodeId), choose.dataset.scChoose);
    announce(I.S(QUALITY[c.q][0], QUALITY[c.q][1]));
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-sc-continue]")) {
    cur.ack = true;
    if (nodeOf(scene, currentNode(scene, cur.path, true))?.end && !cur.fin) finish(ctx, st, scene);
    saveState(SC_KEY, st);
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-sc-undo]")) {
    cur.path.pop();
    cur.ack = true;
    cur.retries = (cur.retries || 0) + 1;
    saveState(SC_KEY, st);
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-sc-replay]")) {
    st.cur = { id: scene.id, path: [], ack: true, retries: 0 };
    ui.say = {};
    saveState(SC_KEY, st);
    return (ctx.rerender(), true);
  }
  const chk = t.closest("[data-sc-check]");
  if (chk) {
    const i = Number(chk.dataset.scCheck);
    const turn = transcript(scene, cur.path).turns[i];
    ui.say[i] = { ...(ui.say[i] || {}), res: checkLine(turn.ch.tag, ui.say[i]?.text || "") };
    return (ctx.rerender(), true);
  }
  const dict = t.closest("[data-sc-dict]");
  if (dict) return (dictate(ctx, Number(dict.dataset.scDict)), true);
  return false;
}

async function dictate(ctx, i) {
  if (ui.dict) {
    const { i: was, session } = ui.dict;
    ui.dict = null;
    const text = await session.stop();
    ui.say[was] = { ...(ui.say[was] || {}), text: text || ui.say[was]?.text || "" };
    return ctx.rerender();
  }
  const session = await startDictation({
    lang: "en-US",
    onText: ({ text }) => {
      const box = document.querySelector(`[data-sc-text="${i}"]`);
      if (box) box.value = text;
    },
    onError: () => (ui.dict = null),
  });
  if (session) {
    ui.dict = { i, session };
    ctx.rerender();
  }
}

export function onInput(e) {
  const box = e.target.closest?.("[data-sc-text]");
  if (box)
    ui.say[Number(box.dataset.scText)] = {
      ...(ui.say[Number(box.dataset.scText)] || {}),
      text: box.value,
      res: null,
    };
}
export function onChange(e) {
  onInput(e);
}
export function unmount() {
  ui.dict?.session?.stop();
  ui = { es: false, say: {}, dict: null };
}
