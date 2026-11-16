// Markup for the flagship Language Games: the hub, a game's chapter map, the chapter player (scene, evidence, one
// step at a time) and the completion artifact. Pure rendering from state; the view (src/views/language-games.js)
// owns storage, events, the ledger, dictation and the Book Studio handoff.
import { artSrc } from "../book/render.js";
import { BASE, html, icon, raw } from "../util.js";
import { flagArtSrc, FLAG_ART_FOR } from "./art.js";
import { docHTML } from "./docs.js";
import {
  GAMES,
  activeSteps,
  artifactOf,
  chaptersOf,
  isUnlocked,
  progressOf,
  storyLine,
} from "./engine.js";

export const ARTIFACT = {
  "escape-room": ["Escape Log", "Bitácora de escape"],
  "evidence-detective": ["Case Report", "Informe del caso"],
  "conversation-quest": ["Conversation Script", "Guion de conversación"],
  "newsroom-challenge": ["Front Page", "Primera plana"],
};
const LEVEL = {
  right: ["Yes!", "¡Sí!"],
  clue: ["Clue", "Pista"],
  rule: ["Rule", "Regla"],
  model: ["Model", "Modelo"],
  empty: ["Not yet", "Todavía no"],
};
const gameHref = (g, band, rest = "") =>
  `${BASE}/language-games/${g.id}${rest ? `/${rest}` : ""}?grades=${band}`;
export const stepKey = (chapter, step) => `${chapter.id}/${step.id}`;
const sayBtn = (I, text, label) =>
  html`<button
    type="button"
    class="btn small ghost lg-say"
    data-say="${text}"
    aria-label="${label || I.S("Hear it", "Escuchar")}"
  >
    ${icon("volume")} <span>${I.T("Hear it", "Escuchar")}</span>
  </button>`;
const pair = (I, p) => I.T(p[0], p[1] || "");

function sceneArt(art, extra = "") {
  const [bg, ch] = art;
  return html`<div class="lg-art" aria-hidden="true">
    <img class="lg-art-bg" src="${artSrc(bg)}" alt="" />
    ${ch ? html`<img class="lg-art-ch" src="${artSrc(ch)}" alt="" />` : ""}
    ${extra ? html`<img class="lg-art-badge" src="${flagArtSrc(extra)}" alt="" />` : ""}
  </div>`;
}

// ── hub ──────────────────────────────────────────────────────────────────────
export function hubHTML(I, all, band) {
  return html`<section class="lg-hub">
    <header class="lg-hub-head">
      <p class="eyebrow">${icon("sparkle")} ${I.T("Flagship games", "Juegos principales")}</p>
      <h1 tabindex="-1">${I.T("Language Games", "Juegos de lenguaje")}</h1>
      <p class="lead">
        ${I.T("Four story games where English is the key. Read real evidence, explain your thinking, talk your way through real situations, and report the news. Each chapter you finish opens the next one.", "Cuatro juegos de historias donde el inglés es la llave. Lee evidencia real, explica lo que piensas, habla en situaciones reales e informa las noticias. Cada capítulo que terminas abre el siguiente.")}
      </p>
      <p class="lg-promise">
        ${icon("check")}
        ${I.T("No timers and no points: you unlock the story, and you keep what you write.", "Sin cronómetro y sin puntos: abres la historia y te quedas con lo que escribes.")}
      </p>
    </header>
    <ul class="lg-cards">
      ${GAMES.map((g) => {
        const bs = all[g.id]?.[band] || { ch: {}, flags: {} };
        const p = progressOf(g, band, bs);
        const target = p.complete
          ? gameHref(g, band, "log")
          : p.started && p.next
            ? gameHref(g, band, p.next.id)
            : gameHref(g, band);
        return html`<li class="lg-card lg-g-${g.id}">
          ${sceneArt(g.art, FLAG_ART_FOR[g.id])}
          <div class="lg-card-body">
            <h2><a href="${gameHref(g, band)}">${I.T(...g.title)}</a></h2>
            <p>${I.T(...g.tagline)}</p>
            <p class="lg-card-meta">
              ${icon(p.complete ? "check" : "lock")}
              ${p.complete ? I.T(`All ${p.total} ${g.noun[0].toLowerCase()}s done`, `${p.total} de ${p.total} terminados`) : I.T(`${p.done} of ${p.total} ${g.noun[0].toLowerCase()}s done`, `${p.done} de ${p.total} terminados`)}
            </p>
            <a class="btn btn-primary" href="${target}">
              ${p.complete ? I.T(`Read my ${ARTIFACT[g.id][0]}`, `Leer mi ${ARTIFACT[g.id][1].toLowerCase()}`) : p.started ? I.T("Continue", "Continuar") : I.T("Start", "Empezar")}
              ${icon("arrow-right")}
            </a>
          </div>
        </li>`;
      })}
    </ul>
  </section>`;
}

// ── a game's chapter map ─────────────────────────────────────────────────────
export function gameHTML(I, game, band, bs, ui) {
  const b = game.bands[band];
  const chapters = chaptersOf(game, band);
  const p = progressOf(game, band, bs);
  const other = band === "3-5" ? "6-8" : "3-5";
  return html`<section class="lg-game lg-g-${game.id}">
    <header class="lg-scene">
      ${sceneArt(game.art, FLAG_ART_FOR[game.id])}
      <div class="lg-scene-text">
        <p class="eyebrow">
          ${I.T(`Grades ${band.replace("-", "–")}`, `Grados ${band.replace("-", "–")}`)} ·
          ${I.T(`${chapters.length} ${game.noun[0].toLowerCase()}s`, `${chapters.length} capítulos`)}
        </p>
        <h1 tabindex="-1">${I.T(...game.title)}</h1>
        <p class="lg-story">${b.premise}</p>
        ${ui.es.premise ? html`<p class="lg-story-es" lang="es">${b.premiseEs}</p>` : ""}
        <div class="row-actions">
          ${sayBtn(I, b.premise)}
          <button
            type="button"
            class="btn small ghost"
            data-lg-es="premise"
            aria-pressed="${String(!!ui.es.premise)}"
          >
            ${icon("language")} ${I.T("En español", "En español")}
          </button>
        </div>
      </div>
    </header>
    <ol class="lg-path" aria-label="${I.S(`${game.noun[0]}s`, "Capítulos")}">
      ${chapters.map((c, i) => {
        const cs = bs.ch[c.id];
        const open = isUnlocked(game, band, bs, i);
        const state = cs?.done ? "done" : !open ? "locked" : cs ? "going" : "open";
        const steps = activeSteps(c, cs?.flags || bs.flags);
        const label = {
          done: I.T(game.done[0], game.done[1]),
          locked: I.T(
            `Locked: finish ${game.noun[0]} ${i} first`,
            `Cerrado: termina el capítulo ${i} primero`,
          ),
          going: I.T(
            `In progress: step ${Math.min((cs?.at || 0) + 1, steps.length)} of ${steps.length}`,
            `En curso: paso ${Math.min((cs?.at || 0) + 1, steps.length)} de ${steps.length}`,
          ),
          open: I.T("Open: ready to start", "Abierto: listo para empezar"),
        }[state];
        const inner = html`<span class="lg-path-n" aria-hidden="true"
            >${state === "done" ? icon("check") : state === "locked" ? icon("lock") : i + 1}</span
          >
          <span class="lg-path-text"
            ><span class="lg-path-noun"
              >${I.T(`${game.noun[0]} ${i + 1}`, `${game.noun[1]} ${i + 1}`)}</span
            ><strong>${c.title}</strong><span class="lg-path-state">${label}</span></span
          >`;
        return html`<li class="lg-path-item is-${state}">
          ${open ? html`<a href="${gameHref(game, band, c.id)}">${inner}</a>` : html`<div aria-disabled="true">${inner}</div>`}
        </li>`;
      })}
    </ol>
    <div class="lg-game-foot">
      ${p.started ? html`<a class="btn" href="${gameHref(game, band, "log")}">${icon("bookmark")} ${I.T(`My ${ARTIFACT[game.id][0]}`, `Mi ${ARTIFACT[game.id][1].toLowerCase()}`)}</a>` : ""}
      <a class="btn ghost" href="${BASE}/${game.related.href}?grades=${band}"
        >${icon("arrow-right")} ${I.T(...game.related.title)}</a
      >
      <a class="btn ghost" href="${gameHref(game, other)}"
        >${I.T(`Grades ${other.replace("-", "–")} version`, `Versión de grados ${other.replace("-", "–")}`)}</a
      >
    </div>
  </section>`;
}

// ── the chapter player ───────────────────────────────────────────────────────
function trackHTML(I, game, chapter, steps, cs) {
  if (game.id === "escape-room") {
    const locks = [...new Set(steps.map((s) => s.lock))];
    return html`<ol class="lg-locks" aria-label="${I.S("Locks", "Candados")}">
      ${locks.map((n) => {
        const open = steps.filter((s) => s.lock === n).every((s) => cs.steps[s.id]?.ok);
        const here = !open && steps[cs.at]?.lock === n;
        return html`<li
          class="${open ? "is-open" : ""} ${here ? "is-here" : ""}"
          ${here ? raw('aria-current="step"') : ""}
        >
          <img
            src="${flagArtSrc(open ? "lock-open" : "lock-shut")}"
            alt=""
            width="40"
            height="40"
          />
          <span
            >${I.T(`Lock ${n}`, `Candado ${n}`)}<small
              >${open ? I.T("open", "abierto") : here ? I.T("working", "en curso") : I.T("shut", "cerrado")}</small
            ></span
          >
        </li>`;
      })}
    </ol>`;
  }
  const kind = (s) =>
    s.type === "choose"
      ? ["Decide", "Decide"]
      : s.type === "sort"
        ? ["Sort", "Ordena"]
        : s.say
          ? ["Say it", "Dilo"]
          : ["Write", "Escribe"];
  return html`<ol class="lg-track" aria-label="${I.S("Steps", "Pasos")}">
    ${steps.map((s, i) => {
      const ok = cs.steps[s.id]?.ok;
      return html`<li
        class="${ok ? "is-done" : ""} ${i === cs.at ? "is-here" : ""}"
        ${i === cs.at ? raw('aria-current="step"') : ""}
      >
        <span class="lg-track-n" aria-hidden="true">${ok ? icon("check") : i + 1}</span
        >${I.T(...kind(s))}${ok ? html`<span class="visually-hidden"> (${I.S("done", "hecho")})</span>` : ""}
      </li>`;
    })}
  </ol>`;
}

function answerOf(step, ss) {
  if (step.type === "choose") return step.options.find((o) => o.id === ss.picked)?.text || "";
  if (step.type === "sort") return "";
  return ss.text || "";
}

function npcHTML(I, npc) {
  return html`<div class="lg-npc">
    <img src="${artSrc(npc.art)}" alt="" width="64" height="96" />
    <div class="lg-bubble">
      <p><b>${npc.who}:</b> ${npc.line}</p>
      ${sayBtn(I, `${npc.who} says: ${npc.line}`, I.S(`Hear ${npc.who}`, `Escuchar a ${npc.who}`))}
    </div>
  </div>`;
}

function feedbackHTML(I, step, ss) {
  const r = ss.last;
  if (!r) return "";
  const cls = r.ok ? "is-right" : r.level === "model" ? "is-shown" : "is-hint";
  return html`<div class="feedback lg-fb ${cls}" role="status">
    <p class="fb-title">
      ${icon(r.ok ? "check" : "bulb")}
      <span class="lg-level"
        >${I.T(...LEVEL[r.ok && r.level !== "model" ? "right" : r.level])}</span
      >
      ${pair(I, r.msg)}
    </p>
    ${r.msg[0] ? sayBtn(I, r.msg[0]) : ""}
    ${step.type === "write" && !r.ok && (r.level === "rule" || r.level === "model") ? html`<p class="lg-frame"><b>${I.T("Frame", "Marco")}:</b> ${step.frame}</p>` : ""}
    ${
      step.type === "write" && !r.ok && r.level === "model"
        ? html`<div class="lg-model">
            <p><b>${I.T("One strong answer", "Una respuesta fuerte")}:</b> ${step.model}</p>
            ${sayBtn(I, step.model)}
          </div>`
        : ""
    }
  </div>`;
}

function chooseHTML(I, step, ss, ui, key) {
  const picked = ss.ok ? ss.picked : (ui.pick[key] ?? ss.picked);
  return html`<fieldset class="lg-options" ${ss.ok ? raw("disabled") : ""}>
      <legend class="visually-hidden">${step.prompt}</legend>
      ${step.options.map(
        (o) =>
          html`<label class="lg-opt ${ss.ok && o.id === ss.picked ? "is-chosen" : ""}">
            <input
              type="radio"
              name="lg-${key}"
              value="${o.id}"
              data-lg-pick="${key}"
              data-nsr-ignore
              ${o.id === picked ? raw("checked") : ""}
            />
            <span>${o.text}</span
            >${ss.ok && o.id === ss.picked ? html`<span class="lg-tag">${icon("check")} ${I.T("My answer", "Mi respuesta")}</span>` : ""}
          </label>`,
      )}
    </fieldset>
    <div class="row-actions">${sayBtn(I, step.options.map((o, i) => `Choice ${i + 1}: ${o.text}`).join(". "), I.S("Hear the choices", "Escuchar las opciones"))}</div>`;
}

function sortHTML(I, step, ss, ui, key) {
  const cur = { ...(ss.answers || {}), ...(ui.sort[key] || {}) };
  const wrong = new Set(!ss.ok ? ss.last?.wrong || [] : []);
  return html`<ol class="lg-sort">
      ${step.items.map((it) => {
        const a = cur[it.id] || {};
        const isWrong = wrong.has(it.id);
        return html`<li class="lg-sort-item ${isWrong ? "is-wrong" : ""}">
          <p>${it.text}</p>
          <div class="lg-sort-pick">
            <label
              ><span>${I.T("Goes in", "Va en")}</span>
              <select
                data-lg-sort="${key}"
                data-item="${it.id}"
                data-part="cat"
                data-nsr-ignore
                ${ss.ok ? raw("disabled") : ""}
              >
                <option value="">${I.T("Choose…", "Elige…")}</option>
                ${step.cats.map((c) => html`<option value="${c.id}" ${a.cat === c.id ? raw("selected") : ""}>${I.S(...c.label)}</option>`)}
              </select></label
            >
            ${
              step.reasons
                ? html`<label
                    ><span>${I.T("Because", "Porque")}</span>
                    <select
                      data-lg-sort="${key}"
                      data-item="${it.id}"
                      data-part="reason"
                      data-nsr-ignore
                      ${ss.ok ? raw("disabled") : ""}
                    >
                      <option value="">${I.T("Choose a reason…", "Elige una razón…")}</option>
                      ${step.reasons.map((r) => html`<option value="${r.id}" ${a.reason === r.id ? raw("selected") : ""}>${r.text}</option>`)}
                    </select></label
                  >`
                : ""
            }
          </div>
          ${isWrong ? html`<p class="lg-item-clue">${icon("bulb")} <b>${I.T("Look again", "Mira otra vez")}:</b> ${ss.tries >= 2 ? pair(I, step.rule) : pair(I, it.clue)}</p>` : ""}
          ${ss.ok && ss.shown && (ss.last?.wrong || []).includes(it.id) ? html`<p class="lg-item-clue">${icon("info")} ${pair(I, it.clue)}</p>` : ""}
        </li>`;
      })}
    </ol>
    <div class="row-actions">${sayBtn(I, step.items.map((it, i) => `${i + 1}. ${it.text}`).join(" "), I.S("Hear the items", "Escuchar los elementos"))}</div>`;
}

function writeHTML(I, step, ss, ui, key, can) {
  const value = ui.drafts[key] ?? ss.text ?? "";
  const listening = ui.dict?.key === key;
  return html`<label class="field lg-write">
      <span
        >${step.say ? I.T("What I say (speak or type)", "Lo que digo (habla o escribe)") : I.T("My answer", "Mi respuesta")}</span
      >
      <textarea
        rows="${step.check?.max && step.check.max <= 14 ? 2 : 4}"
        data-lg-text="${key}"
        data-nsr-ignore
        ${ss.ok ? raw("readonly") : ""}
      >
${value}</textarea>
    </label>
    ${step.say && can.dictate && !ss.ok ? html`<button type="button" class="btn lg-mic" data-lg-dict="${key}" aria-pressed="${String(listening)}">${icon(listening ? "stop" : "record")} ${listening ? I.T("Stop and keep my words", "Detener y guardar mis palabras") : I.T("Speak it", "Decirlo en voz alta")}</button>` : ""}
    ${step.say && !can.dictate ? html`<p class="fine">${I.T("This browser cannot turn speech into words. Say it out loud, then type what you said.", "Este navegador no puede convertir la voz en palabras. Dilo en voz alta y luego escribe lo que dijiste.")}</p>` : ""}`;
}

export function stepHTML(I, game, chapter, step, ss, ui, can) {
  const key = stepKey(chapter, step);
  const docsFirst = step.docs || [];
  const eyebrow =
    game.id === "escape-room"
      ? I.T(
          `Lock ${step.lock} · ${step.type === "write" ? "Explain your thinking" : "Read the evidence"}`,
          `Candado ${step.lock} · ${step.type === "write" ? "Explica lo que piensas" : "Lee la evidencia"}`,
        )
      : step.type === "sort"
        ? I.T("Sort", "Ordena")
        : step.type === "choose"
          ? I.T("Decide", "Decide")
          : step.say
            ? I.T("Say it", "Dilo")
            : I.T("Write", "Escribe");
  return html`<section class="lg-step panel" aria-labelledby="lgStepH" data-step="${step.id}">
    ${step.npc ? npcHTML(I, step.npc) : ""}
    <p class="eyebrow">${eyebrow}</p>
    <h2 id="lgStepH" tabindex="-1">${step.prompt}</h2>
    <div class="row-actions">
      ${sayBtn(I, step.prompt, I.S("Hear the question", "Escuchar la pregunta"))}
      ${docsFirst.length ? html`<a class="btn small ghost lg-to-docs" href="#lgEvidence">${icon("search")} ${I.T("Go to the evidence", "Ir a la evidencia")}</a>` : ""}
    </div>
    ${step.type === "choose" ? chooseHTML(I, step, ss, ui, key) : step.type === "sort" ? sortHTML(I, step, ss, ui, key) : writeHTML(I, step, ss, ui, key, can)}
    ${feedbackHTML(I, step, ss)}
    ${
      ss.help
        ? html`<div class="lg-help" lang="es">
            <p><b>Ayuda en español:</b> ${step.help}</p>
            <button
              type="button"
              class="btn small ghost"
              data-say-es="${step.help}"
              aria-label="Escuchar la ayuda"
            >
              ${icon("volume")} <span>Escuchar</span>
            </button>
          </div>`
        : ""
    }
    <div class="row-actions lg-actions">
      ${
        ss.ok
          ? html`<button type="button" class="btn btn-primary" data-lg-next="${key}">
              ${I.T("Next", "Siguiente")} ${icon("arrow-right")}
            </button>`
          : html`<button type="button" class="btn btn-primary" data-lg-check="${key}">
                ${icon("check")}
                ${step.type === "write" ? I.T("Check my words", "Revisar mis palabras") : I.T("Check", "Revisar")}
              </button>
              ${ss.help ? "" : html`<button type="button" class="btn ghost" data-lg-help="${key}" lang="es">${icon("language")} Ayuda en español</button>`}`
      }
    </div>
    ${!ss.ok && !ss.help ? html`<p class="fine lg-help-note">${I.T("Spanish help explains the task, not the answer. Using it marks this step as supported.", "La ayuda en español explica la tarea, no la respuesta. Usarla marca este paso como apoyado.")}</p>` : ""}
  </section>`;
}

export function chapterHTML(I, game, band, chapter, index, cs, ui, can) {
  const chapters = chaptersOf(game, band);
  const steps = activeSteps(chapter, cs.flags);
  const step = steps[cs.at];
  const focus = new Set(step?.docs || []);
  const docs = [...chapter.docs].sort((a, b) => Number(focus.has(b.id)) - Number(focus.has(a.id)));
  const recap = steps.slice(0, cs.at).filter((s) => cs.steps[s.id]?.ok);
  const next = chapters[index + 1];
  const intro = storyLine(chapter, "intro", cs.flags);
  return html`<article class="lg-play lg-g-${game.id}" aria-labelledby="lgTitle">
    <header class="lg-scene">
      ${sceneArt(chapter.art, game.id === "escape-room" ? (cs.done ? "door-open" : "door") : "")}
      <div class="lg-scene-text">
        <p class="eyebrow">
          ${I.T(`${game.noun[0]} ${index + 1} of ${chapters.length}`, `${game.noun[1]} ${index + 1} de ${chapters.length}`)}
        </p>
        <h1 id="lgTitle" tabindex="-1">${chapter.title}</h1>
        <p class="lg-story">${intro}</p>
        ${ui.es[chapter.id] ? html`<p class="lg-story-es" lang="es">${chapter.introEs}</p>` : ""}
        <div class="row-actions">
          ${sayBtn(I, intro)}
          <button
            type="button"
            class="btn small ghost"
            data-lg-es="${chapter.id}"
            aria-pressed="${String(!!ui.es[chapter.id])}"
          >
            ${icon("language")} En español
          </button>
        </div>
      </div>
    </header>
    ${trackHTML(I, game, chapter, steps, cs)}
    <div class="lg-grid">
      <aside class="lg-evidence" id="lgEvidence" aria-labelledby="lgEvH" tabindex="-1">
        <h2 id="lgEvH">${icon("evidence")} ${I.T("Evidence", "Evidencia")}</h2>
        ${docs.map((d) => docHTML(I, d, focus.has(d.id)))}
      </aside>
      <div class="lg-stage">
        ${
          recap.length
            ? html`<details class="lg-recap">
                <summary>
                  ${I.T(`My work in this ${game.noun[0].toLowerCase()} (${recap.length})`, `Mi trabajo en este capítulo (${recap.length})`)}
                </summary>
                <ol>
                  ${recap.map((s) => html`<li><span class="fine">${s.prompt}</span>${answerOf(s, cs.steps[s.id]) ? html`<p>${answerOf(s, cs.steps[s.id])}</p>` : html`<p>${I.T("Sorted.", "Ordenado.")}</p>`}</li>`)}
                </ol>
              </details>`
            : ""
        }
        ${
          step
            ? stepHTML(I, game, chapter, step, cs.steps[step.id] || { tries: 0 }, ui, can)
            : html`<section class="lg-step lg-done panel" aria-labelledby="lgDoneH">
                <img
                  src="${flagArtSrc(game.id === "escape-room" ? "lock-open" : FLAG_ART_FOR[game.id])}"
                  alt=""
                  width="120"
                  height="120"
                />
                <p class="eyebrow">${icon("check")} ${I.T(...game.done)}</p>
                <h2 id="lgDoneH" tabindex="-1">${chapter.title}</h2>
                <p class="lg-story">${storyLine(chapter, "outro", cs.flags)}</p>
                ${sayBtn(I, storyLine(chapter, "outro", cs.flags))}
                <div class="row-actions">
                  ${next ? html`<a class="btn btn-primary" href="${gameHref(game, band, next.id)}">${I.T(`Next: ${next.title}`, `Siguiente: ${next.title}`)} ${icon("arrow-right")}</a>` : html`<a class="btn btn-primary" href="${gameHref(game, band, "log")}">${icon("bookmark")} ${I.T(`Read my ${ARTIFACT[game.id][0]}`, `Leer mi ${ARTIFACT[game.id][1].toLowerCase()}`)}</a>`}
                  <a class="btn" href="${gameHref(game, band)}"
                    >${I.T("Back to the map", "Volver al mapa")}</a
                  >
                </div>
              </section>`
        }
      </div>
    </div>
  </article>`;
}

// ── the completion artifact ──────────────────────────────────────────────────
export function artifactHTML(I, game, band, bs) {
  const parts = artifactOf(game, band, bs);
  const p = progressOf(game, band, bs);
  const name = ARTIFACT[game.id];
  return html`<article class="lg-artifact lg-g-${game.id}" aria-labelledby="lgArtH">
    <header class="lg-artifact-head">
      <img src="${flagArtSrc(FLAG_ART_FOR[game.id])}" alt="" width="88" height="88" />
      <div>
        <p class="eyebrow">
          ${I.T(...game.title)} ·
          ${I.T(`Grades ${band.replace("-", "–")}`, `Grados ${band.replace("-", "–")}`)}
        </p>
        <h1 id="lgArtH" tabindex="-1">${I.T(`My ${name[0]}`, `Mi ${name[1].toLowerCase()}`)}</h1>
        <p>
          ${p.complete ? I.T(`All ${p.total} chapters finished. Everything here is in my own words.`, `Terminé los ${p.total} capítulos. Todo aquí está en mis propias palabras.`) : I.T(`${p.done} of ${p.total} chapters finished so far.`, `${p.done} de ${p.total} capítulos terminados hasta ahora.`)}
        </p>
      </div>
    </header>
    ${
      parts.length
        ? parts.map(
            (c) =>
              html`<section class="lg-art-part">
                <h2>
                  ${c.chapter.title}${c.done ? html` <span class="lg-tag">${icon("check")} ${I.T(...game.done)}</span>` : ""}
                </h2>
                ${
                  c.entries.length
                    ? html`<dl>
                        ${c.entries.map(
                          (e) =>
                            html`<div>
                              <dt>${e.label}</dt>
                              <dd>${e.text} ${sayBtn(I, e.text)}</dd>
                            </div>`,
                        )}
                      </dl>`
                    : html`<p class="fine">
                        ${I.T("Nothing written here yet.", "Todavía no hay nada escrito aquí.")}
                      </p>`
                }
                ${c.outro ? html`<p class="lg-story">${c.outro}</p>` : ""}
              </section>`,
          )
        : html`<p class="empty-state">
            ${I.T("Start the first chapter and your work will appear here.", "Empieza el primer capítulo y tu trabajo aparecerá aquí.")}
          </p>`
    }
    <div class="row-actions lg-art-actions">
      ${parts.some((c) => c.entries.length) ? html`<button type="button" class="btn btn-primary" data-lg-book>${icon("library")} ${I.T("Make it a book in Book Studio", "Convertirlo en libro en Book Studio")}</button>` : ""}
      <button type="button" class="btn" data-lg-print>
        ${icon("print")} ${I.T("Print", "Imprimir")}
      </button>
      <a class="btn ghost" href="${gameHref(game, band)}"
        >${I.T("Back to the map", "Volver al mapa")}</a
      >
    </div>
  </article>`;
}

/** Book Studio pages from the artifact: one page per chapter (the newsroom headline becomes the page heading). */
export function bookPages(game, band, bs) {
  return artifactOf(game, band, bs)
    .filter((c) => c.entries.length)
    .map((c) => {
      const headline = c.entries.find((e) => /headline/i.test(e.label));
      const rest = c.entries.filter((e) => e !== headline);
      return {
        heading: headline ? headline.text : c.chapter.title,
        text: rest
          .map((e) => (game.id === "newsroom-challenge" ? e.text : `${e.label}: ${e.text}`))
          .join("\n\n"),
        art: c.chapter.art[1] || c.chapter.art[0],
        artAlt: c.chapter.title,
      };
    });
}
