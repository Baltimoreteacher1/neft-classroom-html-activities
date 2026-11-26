// Shared episode view for additional Language City episodes (Sunrise Clinic,
// Neighborhood Newsroom) built on the exact Community Market episode pattern:
// A/B/C support picker, 6-step pip bar, illustrated clickable spots + signs,
// dialogue audio + transcript toggle, reading check, evidence/care checklist,
// speaking rehearsal, writing message, localStorage save, and ledger evidence.
import { crumbsHTML, recorderHTML } from "../components.js";
import { buildingOf } from "../content/city.js";
import { CLINIC_EPISODE } from "../content/city-clinic-episode.js";
import { NEWSROOM_EPISODE } from "../content/city-newsroom-episode.js";
import { CONNECTORS, DOMAIN_NAME, LEVELS, LEVEL_INFO, STEPS } from "../content/city-market-episode.js";
import { connectorsUsed, levelFor, wordCount } from "../lang/city-market.js";
import { isRecording } from "../recorder.js";
import { speakDialogue } from "../speech.js";
import { BASE, announce, html, icon, raw, safeJson, storage } from "../util.js";
import { cityHref } from "./city-mission.js";
import { bandFor, recordEvidence, speakBtn } from "./studio-kit.js";

export const MORE_EPISODES = [CLINIC_EPISODE, NEWSROOM_EPISODE];
export const findMoreEpisode = (place, id) =>
  MORE_EPISODES.find((ep) => ep.place === place && ep.id === id) || null;
export const moreEpisodesAt = (place) => MORE_EPISODES.filter((ep) => ep.place === place);
export const moreEpisodeHref = (ep, band) => cityHref(`${ep.place}/${ep.id}`, band);

const P = (I, pair) => I.T(pair.en, pair.es);
const PS = (I, pair) => I.S(pair.en, pair.es);

const DEFAULT_ST = {
  level: "",
  step: 0,
  reached: 0,
  seen: [],
  answers: {},
  picked: [],
  said: false,
  message: "",
  saved: false,
  done: false,
  runs: 0,
  indep: 0,
  supp: 0,
};

export function loadMoreEpisode(ep) {
  const r = safeJson(storage.get(ep.storageKey), null);
  const s = { ...structuredClone(DEFAULT_ST), ...(r && typeof r === "object" ? r : {}) };
  s.level = LEVELS.includes(s.level) ? s.level : "";
  s.step = Math.min(STEPS.length - 1, Math.max(0, Math.trunc(Number(s.step)) || 0));
  s.reached = Math.min(STEPS.length - 1, Math.max(s.step, Math.trunc(Number(s.reached)) || 0));
  s.seen = Array.isArray(s.seen) ? [...new Set(s.seen.filter((id) => ep.spots.some((x) => x.id === id)))] : [];
  s.picked = Array.isArray(s.picked) ? [...new Set(s.picked.filter((id) => ep.task.items.some((x) => x.id === id)))] : [];
  s.answers = s.answers && typeof s.answers === "object" ? s.answers : {};
  s.message = typeof s.message === "string" ? s.message.slice(0, 2000) : "";
  return s;
}
const saveMoreEpisode = (ep, st) => storage.set(ep.storageKey, JSON.stringify(st));

export function checkPacket(ep, picked) {
  const req = ep.task.items.filter((i) => i.required).map((i) => i.id);
  const bad = picked.filter((id) => !req.includes(id));
  const missing = req.filter((id) => !picked.includes(id));
  return { ok: bad.length === 0 && missing.length === 0, bad, missing };
}

export function moreStepDone(ep, st, stepId, level) {
  if (stepId === "look") return st.seen.length >= (ep.spotsNeeded[level] || 4);
  if (stepId === "listen") return Boolean(st.answers[`listen:${level}`]?.ok);
  if (stepId === "compare") return Boolean(st.answers[`compare:${level}`]?.ok);
  if (stepId === "shop") return checkPacket(ep, st.picked).ok;
  if (stepId === "speak") return Boolean(st.said);
  if (stepId === "write") return Boolean(st.saved && wordCount(st.message) >= (ep.write[level]?.minWords || 4));
  return false;
}

const ui = { spot: "", es: null, transcript: false, model: false, wrong: [], fb: null, taskFb: false, saveFb: false };
export const resetMoreUi = () =>
  Object.assign(ui, { spot: "", es: null, transcript: false, model: false, wrong: [], fb: null, taskFb: false, saveFb: false });
const view = (level) => ({ ...ui, es: ui.es ?? level === "A" });
const tgt = (v, pair) =>
  html`${pair.en}${v.es && pair.es !== pair.en ? html`<small class="mk-es" lang="es">${pair.es}</small>` : ""}`;

function sceneSVG(ep, label) {
  const accent = ep.id === "sunrise-clinic" ? "#1FA6A2" : "#17324D";
  const warm = "#F2C15B";
  return `<svg class="mk-svg" viewBox="0 0 800 320" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="320" fill="#F7F4EC"/>
    <rect x="0" y="240" width="800" height="80" fill="#E6DEC8"/>
    <rect x="44" y="42" width="210" height="170" rx="12" fill="#FFFFFF" stroke="${accent}" stroke-width="3"/>
    <rect x="295" y="42" width="210" height="170" rx="12" fill="#FFFFFF" stroke="${accent}" stroke-width="3"/>
    <rect x="546" y="42" width="210" height="170" rx="12" fill="#FFFFFF" stroke="${accent}" stroke-width="3"/>
    <rect x="44" y="42" width="210" height="32" rx="10" fill="${accent}"/>
    <rect x="295" y="42" width="210" height="32" rx="10" fill="${warm}"/>
    <rect x="546" y="42" width="210" height="32" rx="10" fill="${accent}"/>
  </svg>`;
}

const MORE_LEVEL_EXPECT = {
  A: {
    en: "Word bank, short sentence starters, and Spanish help open.",
    es: "Banco de palabras, inicios de oración cortos y ayuda en español abiertos.",
  },
  B: {
    en: "Sentence frames open. Compare details and explain your choices.",
    es: "Marcos de oración abiertos. Compara detalles y explica tus decisiones.",
  },
  C: {
    en: "On your own: support your ideas in connected sentences with because, but, and so.",
    es: "Por tu cuenta: respalda tus ideas con oraciones conectadas usando because, but y so.",
  },
};

export function moreEpisodePage(ctx, I, ep) {
  const band = bandFor(ctx.band);
  const st = loadMoreEpisode(ep);
  const level = levelFor(st, ctx.prefs);
  const v = view(level);
  const building = buildingOf(ep.place);
  const step = STEPS[st.step];
  const done = moreStepDone(ep, st, step.id, level);
  const last = st.step === STEPS.length - 1;
  const spot = ep.spots.find((s) => s.id === ui.spot) || null;
  const words = ep.spots.filter((s) => st.seen.includes(s.id)).map((s) => s.word);

  return html`${crumbsHTML(
      [
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language City", "Ciudad del lenguaje"), cityHref("", band)],
        [PS(I, building.name), cityHref(building.id, band)],
        [PS(I, ep.title), null],
      ],
      { i18n: I },
    )}
    <article class="mk-episode" data-more-ep="${ep.id}">
      <header class="act-head">
        <p class="eyebrow">${P(I, ep.eyebrow)}</p>
        <h1 tabindex="-1">${P(I, ep.title)}</h1>
        <p class="lead">${P(I, ep.blurb)}</p>
      </header>
      <fieldset class="mk-levels" role="radiogroup" aria-label="${I.S("Support level for this visit", "Nivel de apoyo para esta visita")}">
        <legend>${I.T("Support level for this visit", "Nivel de apoyo para esta visita")}</legend>
        <div class="mk-level-row">
          ${LEVELS.map(
            (l) => html`<button type="button" class="mk-level ${l === level ? "is-on" : ""}" data-me-level="${l}" role="radio" aria-checked="${String(l === level)}"><strong>${l}</strong> <span>${P(I, LEVEL_INFO[l].label)}</span></button>`,
          )}
        </div>
        <p class="fine">${P(I, MORE_LEVEL_EXPECT[level])}</p>
      </fieldset>
      <ol class="city-pips mk-pips" aria-label="${I.S("Visit steps", "Pasos de la visita")}">
        ${STEPS.map((s, i) => {
          const d = moreStepDone(ep, st, s.id, level);
          const here = i === st.step && !st.done;
          const open = i <= st.reached;
          const title = s.id === "shop" ? ep.task.title : s.title;
          const lbl = html`<span class="city-pip-n" aria-hidden="true">${d ? icon("check") : i + 1}</span><span>${P(I, title)} <small>${P(I, DOMAIN_NAME[s.domain])}</small></span>`;
          return html`<li class="${d ? "is-done" : ""} ${here ? "is-here" : ""}">
            ${open ? html`<button type="button" class="mk-pip" data-me-go="${i}" ${here ? raw('aria-current="step"') : ""}>${lbl}</button>` : html`<span class="mk-pip is-locked">${lbl}</span>`}
          </li>`;
        })}
      </ol>
      <section class="mk-scene" aria-labelledby="me-scene-h">
        <h2 id="me-scene-h" class="visually-hidden">${P(I, ep.title)}</h2>
        <div class="mk-stage" data-stall="all">
          <div class="mk-pan">
            ${raw(sceneSVG(ep, PS(I, ep.title)))}
            ${ep.spots.map((s) => {
              const seen = st.seen.includes(s.id);
              return html`<button type="button" class="mk-spot ${seen ? "is-seen" : ""} ${ui.spot === s.id ? "is-open" : ""}" data-me-spot="${s.id}" style="left:${s.at[0]}%;top:${s.at[1]}%" aria-label="${PS(I, s.label)}">
                <span class="mk-spot-dot" aria-hidden="true">${seen ? icon("check") : ""}</span>
                <span class="mk-spot-label" aria-hidden="true">${P(I, s.label)}</span>
              </button>`;
            })}
          </div>
        </div>
      </section>
      <div class="mk-inspector" aria-live="polite">
        ${
          spot
            ? html`<section class="mk-inspect">
                <h3>${P(I, spot.label)}</h3>
                <figure class="city-doc is-sign mk-sign">
                  <figcaption>${tgt(v, spot.sign.head)}</figcaption>
                  <ul>${spot.sign.lines.map((l) => html`<li>${tgt(v, l)}</li>`)}</ul>
                </figure>
                <div class="mk-word">
                  <p><b class="mk-word-en">${spot.word.en}</b> ${level !== "C" || v.es ? html`<span class="mk-word-es" lang="es">${spot.word.es}</span>` : ""} <span class="mk-word-def">${tgt(v, spot.word.def)}</span></p>
                  ${speakBtn(I, spot.word.en)}
                </div>
              </section>`
            : html`<p class="fine mk-inspect-empty">${I.T("Choose a spot above to read the sign and collect its word.", "Elige un punto arriba para leer el letrero y guardar su palabra.")}</p>`
        }
      </div>
      <div class="mk-layout">
        ${
          st.done
            ? html`<section class="panel city-summary mk-summary" aria-labelledby="me-sum-h">
                <h2 id="me-sum-h" tabindex="-1">${icon("check")} ${P(I, ep.title)} · ${I.T("Finished", "Terminado")}</h2>
                <p>${I.T(`You practiced all four domains (${ep.use}) at support level ${level}. Practice on this device — never a score or WIDA level.`, `Practicaste los cuatro dominios (${ep.use}) con el nivel de apoyo ${level}. Es práctica en este dispositivo, nunca un puntaje ni un nivel WIDA.`)}</p>
                <div class="wl-actions">
                  <button type="button" class="btn btn-primary" data-me-replay>${icon("retry")} ${I.T("Visit again", "Visitar otra vez")}</button>
                  <a class="btn" href="${cityHref(ep.place, band)}">${P(I, building.name)}</a>
                  <a class="btn" href="${cityHref("progress", band)}">${I.T("My city progress", "Mi progreso en la ciudad")}</a>
                </div>
              </section>`
            : html`<section class="panel mk-step" aria-labelledby="me-step-h">
                <p class="eyebrow">${I.T(`Step ${st.step + 1} of ${STEPS.length}`, `Paso ${st.step + 1} de ${STEPS.length}`)} · ${P(I, DOMAIN_NAME[step.domain])}</p>
                <h2 id="me-step-h" tabindex="-1">${P(I, step.id === "shop" ? ep.task.title : step.title)}</h2>
                <div class="wl-actions mk-helpbar">
                  <button type="button" class="btn small" data-me-es aria-pressed="${String(v.es)}">${icon("language")} ${v.es ? I.T("Hide Spanish help", "Ocultar la ayuda en español") : I.T("Spanish help", "Ayuda en español")}</button>
                </div>
                ${stepBodyHTML(I, ep, st, v, level, step.id)}
                ${done ? html`<div class="wl-actions mk-next"><button type="button" class="btn btn-primary" data-me-next>${last ? I.T("Finish the visit", "Terminar la visita") : I.T("Next step", "Siguiente paso")} ${icon("arrow-right")}</button></div>` : ""}
              </section>`
        }
        <aside class="mk-basket" aria-labelledby="me-basket-h">
          <h2 id="me-basket-h">${I.T("My word basket", "Mi canasta de palabras")}</h2>
          <p class="fine">${I.T(`${words.length} of ${ep.spots.length} words collected`, `${words.length} de ${ep.spots.length} palabras reunidas`)}</p>
          ${words.length ? html`<ul class="mk-basket-list">${words.map((w) => html`<li><b>${w.en}</b> ${level !== "C" ? html`<span lang="es">${w.es}</span>` : ""}</li>`)}</ul>` : ""}
        </aside>
      </div>
      <p class="disclaimer">${I.T("Practice on this device. Supports are a classroom choice, not a proficiency level. Nothing here is an official WIDA or ACCESS item, score or level.", "Práctica en este dispositivo. Los apoyos son una decisión de la clase, no un nivel de dominio. Nada aquí es una pregunta, un puntaje ni un nivel oficial de WIDA o ACCESS.")}</p>
    </article>`;
}

function choicesBlock(I, v, stepId, q, ans) {
  const solved = ans?.ok;
  return html`<p class="city-ask">${tgt(v, q.ask)}</p>
    <div class="wl-choices city-opts" role="group">
      ${q.opts.map((o, i) => {
        const right = solved && o.id === ans.pick;
        const wrong = ui.wrong.includes(`${stepId}:${o.id}`);
        return html`<button type="button" class="wl-choice city-opt ${right ? "is-right" : ""} ${wrong ? "is-wrong" : ""}" data-me-pick="${stepId}:${o.id}" aria-disabled="${String(Boolean(solved || wrong))}">
          <span class="city-letter" aria-hidden="true">${String.fromCharCode(65 + i)}</span>
          <span>${tgt(v, o)}</span>
        </button>`;
      })}
    </div>
    ${ui.fb?.step === stepId ? html`<p class="city-fb" role="status">${tgt(v, q.opts.find((o) => o.id === ui.fb.pick).why)}</p>` : ""}`;
}

function stepBodyHTML(I, ep, st, v, level, stepId) {
  if (stepId === "look") {
    const need = ep.spotsNeeded[level] || 4;
    return html`<p>${I.T(`Inspect at least ${need} spots in the scene above (${st.seen.length} of ${need} inspected).`, `Revisa al menos ${need} puntos en la escena de arriba (${st.seen.length} de ${need} revisados).`)}</p>`;
  }
  if (stepId === "listen") {
    return html`<div class="wl-actions">
        <button type="button" class="btn btn-primary" data-me-play>${icon("volume")} ${I.T("Listen to the conversation", "Escuchar la conversación")}</button>
        <button type="button" class="btn" data-me-transcript aria-pressed="${String(ui.transcript)}">${ui.transcript ? I.T("Hide transcript", "Ocultar transcripción") : I.T("Show transcript", "Mostrar transcripción")}</button>
      </div>
      ${ui.transcript ? html`<ol class="mk-dialogue">${ep.dialogue.map((l, i) => html`<li data-me-line="${i}"><b>${ep.people[l.who].name}:</b> ${tgt(v, l)}</li>`)}</ol>` : ""}
      ${choicesBlock(I, v, "listen", ep.listenQ[level], st.answers[`listen:${level}`])}`;
  }
  if (stepId === "compare") {
    return choicesBlock(I, v, "compare", ep.readQ[level], st.answers[`compare:${level}`]);
  }
  if (stepId === "shop") {
    const chk = checkPacket(ep, st.picked);
    return html`<p>${P(I, ep.task.prompt)}</p>
      <div class="mk-cart-list">
        ${ep.task.items.map((it) => {
          const on = st.picked.includes(it.id);
          return html`<button type="button" class="btn mk-item ${on ? "is-on" : ""}" data-me-item="${it.id}" aria-pressed="${String(on)}">${on ? icon("check") : ""} ${tgt(v, it.label)}</button>`;
        })}
      </div>
      <div class="wl-actions"><button type="button" class="btn" data-me-check>${I.T("Check my choices", "Revisar mis opciones")}</button></div>
      ${ui.taskFb ? html`<p class="city-fb" role="status">${chk.ok ? I.T("Yes! Every item you picked is accurate and supported.", "¡Sí! Cada elemento que elegiste es preciso y tiene respaldo.") : I.T(`Not yet: ${chk.bad.length ? "remove any unsupported claim or unsafe step. " : ""}${chk.missing.length ? "You still need one or more verified items." : ""}`, `Todavía no: ${chk.bad.length ? "quita cualquier paso inseguro o afirmación sin respaldo. " : ""}${chk.missing.length ? "Aún te falta uno o más elementos verificados." : ""}`)}</p>` : ""}`;
  }
  if (stepId === "speak") {
    const sp = ep.speak[level];
    return html`<p>${P(I, sp.task)}</p>
      <ul class="mk-starters">${sp.starters.map((s) => html`<li>${tgt(v, s)}</li>`)}</ul>
      ${recorderHTML(`city-${ep.id}-speak`, { i18n: I, recording: isRecording() })}
      <div class="wl-actions">
        <button type="button" class="btn" data-me-model aria-pressed="${String(ui.model)}">${ui.model ? I.T("Hide model", "Ocultar modelo") : I.T("Hear/see a model", "Ver un modelo")}</button>
        <button type="button" class="btn ${st.said ? "is-on" : ""}" data-me-said aria-pressed="${String(st.said)}">${st.said ? icon("check") : ""} ${I.T("I said it aloud", "Lo dije en voz alta")}</button>
      </div>
      ${ui.model ? html`<p class="city-fb">${tgt(v, sp.model)}</p>` : ""}`;
  }
  const wr = ep.write[level];
  const wc = wordCount(st.message);
  const conns = connectorsUsed(st.message);
  return html`<p>${P(I, wr.task)}</p>
    <ul class="mk-starters">${wr.frames.map((f) => html`<li>${tgt(v, f)}</li>`)}</ul>
    <textarea class="mk-textarea" rows="4" data-me-text aria-label="${I.S("Your writing", "Tu escrito")}">${st.message}</textarea>
    <p class="fine" data-me-selfcheck>${I.T(`${wc} words (aim for at least ${wr.minWords})${level === "C" ? ` · connectors used: ${conns.length ? conns.join(", ") : "none yet"} (${CONNECTORS.join(", ")})` : ""}`, `${wc} palabras (apunta a al menos ${wr.minWords})${level === "C" ? ` · conectores usados: ${conns.length ? conns.join(", ") : "ninguno aún"} (${CONNECTORS.join(", ")})` : ""}`)}</p>
    <div class="wl-actions"><button type="button" class="btn" data-me-save>${I.T("Save on this device", "Guardar en este dispositivo")}</button></div>
    ${ui.saveFb ? html`<p class="city-fb" role="status">${st.saved ? I.T("Saved on this device.", "Guardado en este dispositivo.") : I.T("Write a few words first.", "Primero escribe algunas palabras.")}</p>` : ""}`;
}

export function onMoreEpisodeClick(e, ctx, I, ep) {
  const t = e.target;
  const st = loadMoreEpisode(ep);
  const level = levelFor(st, ctx.prefs);
  const commit = () => (saveMoreEpisode(ep, st), ctx.rerender(), true);
  const lv = t.closest("[data-me-level]");
  if (lv) {
    st.level = lv.dataset.meLevel;
    ui.fb = null;
    ui.wrong = [];
    return commit();
  }
  const sp = t.closest("[data-me-spot]");
  if (sp) {
    ui.spot = sp.dataset.meSpot;
    if (!st.seen.includes(ui.spot)) st.seen.push(ui.spot);
    return commit();
  }
  const go = t.closest("[data-me-go]");
  if (go) {
    st.step = Math.min(st.reached, Number(go.dataset.meGo));
    st.done = false;
    return commit();
  }
  if (t.closest("[data-me-es]")) return ((ui.es = !view(level).es), ctx.rerender(), true);
  if (t.closest("[data-me-transcript]")) return ((ui.transcript = !ui.transcript), ctx.rerender(), true);
  if (t.closest("[data-me-model]")) return ((ui.model = !ui.model), ctx.rerender(), true);
  if (t.closest("[data-me-play]")) {
    const lines = ep.dialogue.map((l) => `${ep.people[l.who].name}: ${l.en}`);
    speakDialogue(lines, { rate: ctx.prefs?.rate || 0.9 });
    return true;
  }
  const pick = t.closest("[data-me-pick]");
  if (pick) {
    const [step, id] = pick.dataset.mePick.split(":");
    const q = (step === "listen" ? ep.listenQ : ep.readQ)[level];
    const ok = id === q.answer;
    st.answers[`${step}:${level}`] = { pick: id, ok };
    if (!ok && !ui.wrong.includes(pick.dataset.mePick)) ui.wrong.push(pick.dataset.mePick);
    ui.fb = { step, pick: id };
    announce(ok ? I.S("That works.", "Eso funciona.") : I.S("Not yet. Try another answer.", "Todavía no. Prueba otra respuesta."));
    return commit();
  }
  const item = t.closest("[data-me-item]");
  if (item) {
    const id = item.dataset.meItem;
    st.picked = st.picked.includes(id) ? st.picked.filter((x) => x !== id) : [...st.picked, id];
    ui.taskFb = false;
    return commit();
  }
  if (t.closest("[data-me-check]")) return ((ui.taskFb = true), ctx.rerender(), true);
  if (t.closest("[data-me-said]")) return ((st.said = !st.said), commit());
  if (t.closest("[data-me-save]")) {
    const box = document.querySelector("[data-me-text]");
    if (box) st.message = box.value.slice(0, 2000);
    st.saved = st.message.trim().length > 0;
    ui.saveFb = true;
    return commit();
  }
  if (t.closest("[data-me-next]") && moreStepDone(ep, st, STEPS[st.step].id, level)) {
    Object.assign(ui, { fb: null, wrong: [], taskFb: false, saveFb: false, model: false });
    if (st.step < STEPS.length - 1) {
      st.step += 1;
      st.reached = Math.max(st.reached, st.step);
    } else {
      st.done = true;
      st.runs += 1;
      const indep = level === "C" && !view(level).es && !ui.transcript && !ui.model;
      if (indep) st.indep = (st.indep || 0) + 1;
      else st.supp = (st.supp || 0) + 1;
      recordEvidence({
        src: "city",
        task: `episode:${ep.id}`,
        band: bandFor(ctx.band),
        domain: "Writing",
        use: ep.use,
        level: indep ? "C" : level,
        opened: indep ? {} : { frames: true },
        kind: st.runs > 1 ? "retry" : "first",
        m: { spots: st.seen.length, words: wordCount(st.message), steps: STEPS.length },
      });
    }
    return commit();
  }
  if (t.closest("[data-me-replay]")) {
    resetMoreUi();
    saveMoreEpisode(ep, { ...structuredClone(DEFAULT_ST), level: st.level, runs: st.runs, indep: st.indep || 0, supp: st.supp || 0 });
    return (ctx.rerender(), true);
  }
  return false;
}

export function onMoreEpisodeInput(e, ep) {
  const box = e.target.closest?.("[data-me-text]");
  if (!box) return false;
  const st = loadMoreEpisode(ep);
  st.message = box.value.slice(0, 2000);
  st.saved = false;
  saveMoreEpisode(ep, st);
  return true;
}
