// Adventure Worlds (/adventures, /adventures/<world>, /adventures/<world>/<mission>?scene=<n|done>): seven story worlds
// where each mission chains input (read, listen), thinking (clues, choice, order) and production (respond), one scene
// per screen. Schema: ADVENTURE-SCHEMA.md; engine src/adventures/engine.js; checks src/adventures/checks.js; scene
// screens src/views/adventures-scenes.js; worlds src/adventures/worlds/. Progress is one key
// (accessPracticeLab:v1:adventures) and survives reloads; every respond check is a ledger entry (src "adventure",
// independent unless a help was opened, first then revision). No timers, no scores.
import * as A from "../adventures/engine.js";
import * as K from "../adventures/checks.js";
import { WORLD_IDS } from "../adventures/validate.js";
import { WORLDS, worldById } from "../adventures/worlds/index.js";
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, announce, html, icon, raw, storage } from "../util.js";
import { artSrc, sceneHTML, stageHTML } from "./adventures-scenes.js";

const load = () => A.loadProgress((k) => storage.get(k));
const save = (p) => A.saveProgress(p, (k, v) => storage.set(k, v));
const ROOT = `${BASE}/adventures`;
const urlOf = (band, world, mission, scene) =>
  `${ROOT}${world ? `/${world}` : ""}${mission ? `/${mission}` : ""}?grades=${band}${scene != null ? `&scene=${scene}` : ""}`;
const themeStyle = (w) =>
  `--adv-accent:${w.theme.accent};--adv-soft:${w.theme.soft};--adv-ink:${w.theme.ink}`;
const pick = (I, o) => I.T(o.en, o.es);
// Worlds still being written show as quiet cards on the hub until they are added to WORLDS.
const SOON = {
  "city-of-conversations": ["City of Conversations", "Ciudad de las conversaciones", "🏙️"],
  "newsroom-studio": ["Newsroom Studio", "Estudio de noticias", "📰"],
  "community-design-lab": ["Community Design Lab", "Laboratorio de diseño comunitario", "🛠️"],
  storyverse: ["Storyverse", "Universo de cuentos", "📚"],
};
let dictation = null;

function record(ctx, world, mission, index, r, entry, scene, supports) {
  const ledger = loadLedger();
  const a = entry.answers[index];
  appendEntry(ledger, {
    src: "adventure",
    task: `${world.id}:${mission.id}:${index}`,
    band: A.bandOf(ctx.band),
    domain: scene.mode === "say" ? "Speaking" : "Writing",
    use: mission.keyUse,
    stage: entry.supported ? "supported" : "independent",
    kind: (a.checks || 0) > 1 ? "revision" : "first",
    supports,
    m: {
      ok: r.ok ? 1 : 0,
      words: r.words,
      clues: r.usedClues.length,
      world: world.id,
      mission: mission.id,
    },
  });
  saveLedger(ledger);
}

// ── hub ──────────────────────────────────────────────────────────────────────
function worldCard(I, w, band, progress) {
  const sum = A.worldSummary(w, band, progress);
  const started =
    sum.done > 0 || A.peekEntry(progress, w.id, A.bandOf(band), w.missions[0].id)?.mode;
  return html`<li>
    <a class="adv-card" href="${urlOf(band, w.id)}" style="${themeStyle(w)}">
      ${stageHTML([w.theme.bg, ...w.theme.hero], { size: "is-card" })}
      <span class="adv-card-body">
        <strong class="adv-card-title">${pick(I, w.title)}</strong>
        <span>${pick(I, w.tagline)}</span>
        <span class="adv-card-meta">
          <span class="bar" aria-hidden="true"
            ><i style="width:${Math.round((100 * sum.done) / sum.total)}%"></i
          ></span>
          ${I.T(`${sum.done} of ${sum.total} missions`, `${sum.done} de ${sum.total} misiones`)}
        </span>
        <span class="adv-card-cta"
          >${sum.done === sum.total ? I.T("Visit again", "Volver a visitar") : started ? I.T("Continue", "Continuar") : I.T("Enter the world", "Entrar al mundo")}
          ${icon("arrow-right")}</span
        >
      </span>
    </a>
  </li>`;
}
function hubHTML(I, band, progress) {
  return html`<section class="adv-hub">
    <header class="adv-hub-head">
      <p class="eyebrow">
        ${icon("worlds")}
        ${I.T("Read, listen, think, speak and write your way through a story", "Lee, escucha, piensa, habla y escribe a lo largo de una historia")}
      </p>
      <h1 tabindex="-1">${I.T("Adventure Worlds", "Mundos de aventura")}</h1>
      <p class="lead">
        ${I.T("Each world is a story you play in missions. Collect clues, make decisions and use English to solve real problems. Your work is saved on this device.", "Cada mundo es una historia que juegas en misiones. Reúne pistas, toma decisiones y usa el inglés para resolver problemas reales. Tu trabajo se guarda en este dispositivo.")}
      </p>
    </header>
    <ul class="adv-cards">
      ${WORLD_IDS.map((id) => {
        const w = worldById(id);
        if (w) return worldCard(I, w, band, progress);
        const [en, es, emoji] = SOON[id];
        return html`<li>
          <div class="adv-card is-soon">
            <span class="adv-soon-art" aria-hidden="true">${emoji}</span>
            <span class="adv-card-body"
              ><strong class="adv-card-title">${I.T(en, es)}</strong
              ><span
                >${I.T("This world is being built. Check back soon.", "Este mundo se está construyendo. Vuelve pronto.")}</span
              ></span
            >
          </div>
        </li>`;
      })}
      <li class="adv-sim-door">
        <a class="adv-card" href="${BASE}/simulations?grades=${band}">
          <span class="adv-soon-art" aria-hidden="true">🏙️</span>
          <span class="adv-card-body"
            ><strong class="adv-card-title">${I.T("Simulations", "Simulaciones")}</strong
            ><span
              >${I.T("The City That Stopped Talking: walk the city, question people, weigh the evidence and decide.", "La ciudad que dejó de hablar: recorre la ciudad, pregunta a la gente, pesa la evidencia y decide.")}</span
            ><span class="adv-card-cta"
              >${I.T("Open the simulation", "Abrir la simulación")} ${icon("arrow-right")}</span
            ></span
          >
        </a>
      </li>
    </ul>
  </section>`;
}

// ── world map ────────────────────────────────────────────────────────────────
const STATE_LABEL = {
  done: ["Done", "Hecha"],
  available: ["Ready", "Lista"],
  locked: ["Locked", "Bloqueada"],
  going: ["In progress", "En curso"],
};
function missionNode(I, w, m, i, state, band, entry) {
  const st = state === "available" && entry?.mode ? "going" : state;
  const body = html`<span class="adv-node-n" aria-hidden="true"
      >${state === "done" ? "✓" : state === "locked" ? "🔒" : i + 1}</span
    >
    <span class="adv-node-body">
      <span class="adv-node-kicker"
        >${m.final ? I.T("Final demonstration", "Demostración final") : I.T(`Mission ${i + 1}`, `Misión ${i + 1}`)}
        · ${I.T(STATE_LABEL[st][0], STATE_LABEL[st][1])}</span
      >
      <strong>${pick(I, m.title)}</strong>
      <span>${pick(I, m.goal)}</span>
      <span class="adv-node-tags">
        <span class="chip">${m.keyUse}</span>
        ${m.domains.map((d) => html`<span class="chip">${d}</span>`)}
        ${m.book ? html`<span class="chip">${icon("library")} ${I.T("Book", "Libro")}</span>` : ""}
      </span>
      ${state === "locked" ? html`<span class="fine">${m.final ? I.T("Opens when every other mission is done.", "Se abre cuando terminas todas las demás misiones.") : I.T("Opens when the mission before it is done.", "Se abre cuando terminas la misión anterior.")}</span>` : ""}
    </span>`;
  return html`<li class="adv-node is-${st} ${m.final ? "is-final" : ""}">
    ${state === "locked" ? html`<div class="adv-node-card" aria-disabled="true">${body}</div>` : html`<a class="adv-node-card" href="${urlOf(band, w.id, m.id)}">${body}</a>`}
  </li>`;
}
function logHTML(I, w, band, progress) {
  const log = A.missionLog(w, band, progress);
  return html`<section class="adv-log panel" aria-labelledby="advLogH">
    <h2 id="advLogH">${icon("bookmark")} ${I.T("My mission log", "Mi bitácora de misiones")}</h2>
    ${
      log.length
        ? html`<ol class="adv-log-list">
            ${log.map(
              ({ mission, entry }) =>
                html`<li class="adv-log-item">
                  <p class="adv-log-head">
                    <strong>${pick(I, mission.title)}</strong>
                    <span class="fine"
                      >${String(entry.artifact.at).slice(0, 10)} ·
                      ${entry.artifact.supported ? I.T("with help", "con ayuda") : I.T("on my own", "por mi cuenta")}</span
                    >
                  </p>
                  <blockquote lang="en">${entry.artifact.text}</blockquote>
                  ${entry.artifact.clues.length ? html`<p class="fine">${I.T("Evidence I used:", "Evidencia que usé:")} <span lang="en">${entry.artifact.clues.join(" · ")}</span></p>` : ""}
                  ${mission.book ? html`<button type="button" class="btn small" data-adv-book="${mission.id}">${icon("library")} ${I.T("Write this up in Book Studio", "Escribir esto en el Estudio de libros")}</button>` : ""}
                </li>`,
            )}
          </ol>`
        : html`<p class="fine">
            ${I.T("Finish a mission and the work you wrote or said appears here.", "Termina una misión y aquí aparece lo que escribiste o dijiste.")}
          </p>`
    }
  </section>`;
}
function mapHTML(I, w, band, progress) {
  const sum = A.worldSummary(w, band, progress);
  return html`<article class="adv-world" style="${themeStyle(w)}" aria-labelledby="advWorldH">
    <header class="adv-world-head">
      ${stageHTML(
        [w.theme.bg, ...w.theme.hero, w.guide.art].filter((k, i, all) => all.indexOf(k) === i),
        { size: "is-hero" },
      )}
      <div class="adv-world-copy">
        <p class="eyebrow">${I.T("Adventure world", "Mundo de aventura")}</p>
        <h1 id="advWorldH" tabindex="-1">${pick(I, w.title)}</h1>
        <p class="lead">${pick(I, w.intro)}</p>
        <p class="adv-world-progress">
          <span class="bar" aria-hidden="true"
            ><i style="width:${Math.round((100 * sum.done) / sum.total)}%"></i
          ></span>
          <span
            >${I.T(`${sum.done} of ${sum.total} missions done`, `${sum.done} de ${sum.total} misiones hechas`)}</span
          >
        </p>
        ${sum.next ? html`<a class="btn btn-primary btn-big" href="${urlOf(band, w.id, sum.next.id)}">${icon("play")} ${I.T("Play", "Jugar")}: ${pick(I, sum.next.title)}</a>` : ""}
      </div>
    </header>
    <section aria-labelledby="advPathH">
      <h2 id="advPathH">${I.T("Mission path", "Camino de misiones")}</h2>
      <ol class="adv-path">
        ${w.missions.map((m, i) => missionNode(I, w, m, i, sum.states[i], band, A.peekEntry(progress, w.id, A.bandOf(band), m.id)))}
      </ol>
    </section>
    ${logHTML(I, w, band, progress)}
  </article>`;
}

// ── mission runner ───────────────────────────────────────────────────────────
function startHTML(I, w, m, band) {
  return html`<section class="adv-start" aria-labelledby="advStartH">
    ${stageHTML([w.theme.bg, w.guide.art], { size: "is-wide" })}
    <div class="adv-start-copy">
      <h2 id="advStartH">${I.T("Your mission", "Tu misión")}</h2>
      <p class="lead">${pick(I, m.goal)}</p>
      <p class="adv-node-tags">
        <span class="chip">${m.keyUse}</span
        >${m.domains.map((d) => html`<span class="chip">${d}</span>`)}
      </p>
      <h3>${I.T("How do you want to work?", "¿Cómo quieres trabajar?")}</h3>
      <div class="adv-mode">
        <button type="button" class="adv-mode-btn" data-adv-mode="own">
          <strong>${icon("flag")} ${I.T("On my own", "Por mi cuenta")}</strong>
          <span
            >${I.T("No frames or word bank at the start. You can still ask for help, and the mission will say you used it.", "Sin marcos ni banco de palabras al inicio. Puedes pedir ayuda y la misión dirá que la usaste.")}</span
          >
        </button>
        <button type="button" class="adv-mode-btn" data-adv-mode="help">
          <strong>${icon("bulb")} ${I.T("With help", "Con ayuda")}</strong>
          <span
            >${I.T("Sentence frames and a word bank are open from the start.", "Los marcos de oración y el banco de palabras están abiertos desde el inicio.")}</span
          >
        </button>
      </div>
    </div>
  </section>`;
}
function doneHTML(I, w, m, band, entry, progress) {
  const art = entry.artifact;
  const sum = A.worldSummary(w, band, progress);
  return html`<section class="adv-done" aria-labelledby="advDoneH">
    <div class="adv-done-head">
      <span class="adv-done-icon" aria-hidden="true">${m.final ? "🏆" : "🎉"}</span>
      <div>
        <h2 id="advDoneH">
          ${m.final ? I.T("World complete: you presented your solution!", "¡Mundo completo: presentaste tu solución!") : I.T("Mission complete!", "¡Misión completa!")}
        </h2>
        <p>
          ${I.T("Here is what you made. It is saved in your mission log and your portfolio.", "Esto es lo que hiciste. Está guardado en tu bitácora de misiones y en tu portafolio.")}
        </p>
      </div>
    </div>
    <article class="adv-artifact">
      <p class="eyebrow">
        ${pick(I, m.title)} ·
        ${art.supported ? I.T("with help", "con ayuda") : I.T("on my own", "por mi cuenta")}
      </p>
      ${art.texts.map((t) => html`<p class="adv-artifact-text" lang="en">${t}</p>`)}
      ${
        art.clues.length
          ? html`<h3>${I.T("Evidence I collected", "Evidencia que reuní")}</h3>
              <ul class="adv-artifact-clues" lang="en">
                ${art.clues.map((c) => html`<li>${c}</li>`)}
              </ul>`
          : ""
      }
    </article>
    <div class="row-actions adv-done-actions">
      ${m.book ? html`<button type="button" class="btn btn-primary" data-adv-book="${m.id}">${icon("library")} ${I.T("Write this up in Book Studio", "Escribir esto en el Estudio de libros")}</button>` : ""}
      ${sum.next ? html`<a class="btn ${m.book ? "" : "btn-primary"}" href="${urlOf(band, w.id, sum.next.id)}">${I.T("Next mission", "Siguiente misión")}: ${pick(I, sum.next.title)} ${icon("arrow-right")}</a>` : ""}
      <a class="btn" href="${urlOf(band, w.id)}"
        >${icon("worlds")} ${I.T("World map", "Mapa del mundo")}</a
      >
      <button type="button" class="btn ghost" data-adv-replay>
        ${icon("replay")} ${I.T("Play this mission again", "Jugar esta misión otra vez")}
      </button>
    </div>
  </section>`;
}
function runnerHTML(I, w, m, band, entry, scenes, view, progress) {
  const i = entry.scene;
  const total = scenes.length;
  const pos = view === "done" ? total : view === "start" ? 0 : i + 1;
  const ready = view === "scene" && A.sceneReady(scenes[i], entry.answers[i]);
  const last = view === "scene" && A.nextIndex(scenes, i, entry.answers[i]) === "done";
  return html`<article class="adv-run" style="${themeStyle(w)}" aria-labelledby="advMissionH">
    <header class="adv-run-head">
      <p class="eyebrow">
        ${pick(I, w.title)} ·
        ${m.final ? I.T("Final demonstration", "Demostración final") : I.T(`Mission ${w.missions.indexOf(m) + 1}`, `Misión ${w.missions.indexOf(m) + 1}`)}
      </p>
      <h1 id="advMissionH" tabindex="-1">${pick(I, m.title)}</h1>
      <div class="adv-progress">
        <span class="bar" aria-hidden="true"
          ><i style="width:${Math.round((100 * pos) / total)}%"></i
        ></span>
        <span
          >${view === "done" ? I.T("Complete", "Completa") : view === "start" ? I.T(`${total} scenes`, `${total} escenas`) : I.T(`Scene ${pos} of ${total}`, `Escena ${pos} de ${total}`)}</span
        >
        ${entry.mode ? html`<span class="chip">${entry.supported ? I.T("With help", "Con ayuda") : I.T("On my own", "Por mi cuenta")}</span>` : ""}
      </div>
    </header>
    ${view === "start" ? startHTML(I, w, m, band) : view === "done" ? doneHTML(I, w, m, band, entry, progress) : sceneHTML(I, scenes[i], i, entry.answers[i] || {}, entry, w)}
    ${
      view === "scene"
        ? html`<nav
            class="adv-nav"
            aria-label="${I.S("Scene navigation", "Navegación de escenas")}"
          >
            ${entry.trail.length ? html`<button type="button" class="btn" data-adv-back>${icon("arrow-left")} ${I.T("Back", "Atrás")}</button>` : html`<span></span>`}
            <span class="adv-nav-note fine"
              >${ready ? "" : I.T("Finish this scene to go on.", "Termina esta escena para seguir.")}</span
            >
            <button
              type="button"
              class="btn btn-primary"
              data-adv-next
              ${ready ? "" : raw("disabled")}
            >
              ${last ? I.T("Finish mission", "Terminar misión") : I.T("Next", "Siguiente")}
              ${icon(last ? "flag" : "arrow-right")}
            </button>
          </nav>`
        : ""
    }
  </article>`;
}

// ── render ───────────────────────────────────────────────────────────────────
function resolve(ctx) {
  const w = worldById(ctx.route.worldId);
  const m = w?.missions.find((x) => x.id === ctx.route.missionId) || null;
  return { w, m, band: A.bandOf(ctx.band) };
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const { w, m, band } = resolve(ctx);
  const progress = load();
  const crumbs = [[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`]];
  const hubCrumb = [I.S("Adventure Worlds", "Mundos de aventura"), urlOf(band)];
  if (!w)
    return {
      title: I.S("Adventure Worlds", "Mundos de aventura"),
      html: html`${crumbsHTML([...crumbs, [hubCrumb[0], null]])}${hubHTML(I, band, progress)}`,
    };
  const wTitle = I.S(w.title.en, w.title.es);
  if (!m)
    return {
      title: wTitle,
      html: html`${crumbsHTML([...crumbs, hubCrumb, [wTitle, null]])}${mapHTML(I, w, band, progress)}`,
    };
  const mTitle = I.S(m.title.en, m.title.es);
  const head = crumbsHTML([...crumbs, hubCrumb, [wTitle, urlOf(band, w.id)], [mTitle, null]]);
  const status = A.missionStatus(w, band, progress, m.id);
  if (status === "locked")
    return {
      title: mTitle,
      html: html`${head}
        <section class="panel adv-locked" style="${themeStyle(w)}">
          <h1 tabindex="-1">${icon("lock")} ${mTitle}</h1>
          <p>
            ${m.final ? I.T("The final demonstration opens when every other mission in this world is done.", "La demostración final se abre cuando terminas todas las demás misiones de este mundo.") : I.T("This mission opens when you finish the one before it.", "Esta misión se abre cuando terminas la anterior.")}
          </p>
          <a class="btn btn-primary" href="${urlOf(band, w.id)}"
            >${icon("worlds")} ${I.T("Back to the world map", "Volver al mapa del mundo")}</a
          >
        </section>`,
    };
  const entry = A.missionEntry(progress, w.id, band, m.id);
  const scenes = A.scenesOf(m, band);
  const param = ctx.route.scene;
  let view = "scene";
  if (entry.done && !entry.playing && param !== "" && !/^\d+$/.test(param)) view = "done";
  else if (entry.done && !entry.playing) view = "done";
  else if (!entry.mode) view = "start";
  else if (/^\d+$/.test(param)) A.goTo(entry, Number(param));
  entry.scene = Math.min(Math.max(0, entry.scene), scenes.length - 1);
  save(progress);
  return {
    title: mTitle,
    html: html`${head}${runnerHTML(I, w, m, band, entry, scenes, view, progress)}`,
  };
}

export function mount(root, ctx) {
  // Keep the address bar on the scene actually shown (a stale ?scene= from history is corrected in place).
  const { w, m, band } = resolve(ctx);
  if (!w || !m) return;
  const e = A.peekEntry(load(), w.id, band, m.id);
  if (!e?.mode || e.done) return;
  const want = urlOf(band, w.id, m.id, e.scene);
  if (location.pathname + location.search !== want) history.replaceState({}, "", want);
}

export function unmount() {
  dictation?.stop?.();
  dictation = null;
  stopSpeech();
}

// ── events ───────────────────────────────────────────────────────────────────
function withEntry(ctx, fn) {
  const { w, m, band } = resolve(ctx);
  if (!w || !m) return false;
  const progress = load();
  const entry = A.missionEntry(progress, w.id, band, m.id);
  const scenes = A.scenesOf(m, band);
  const out = fn({
    w,
    m,
    band,
    progress,
    entry,
    scenes,
    i: entry.scene,
    a: (entry.answers[entry.scene] ||= {}),
  });
  return out;
}

export function onInput(e, ctx) {
  const t = e.target;
  if (!t.matches?.("[data-adv-text]")) return;
  withEntry(ctx, ({ progress, entry }) => {
    (entry.answers[Number(t.dataset.advText)] ||= {}).text = t.value.slice(0, 4000);
    save(progress);
    const count = t.closest(".adv-respond")?.querySelector(".row-actions .fine");
    if (count)
      count.textContent = i18nFor(ctx).S(
        `Words: ${K.countWords(t.value)}`,
        `Palabras: ${K.countWords(t.value)}`,
      );
  });
}

async function toBook(ctx, w, m, band, entry, button) {
  button.disabled = true;
  const I = i18nFor(ctx);
  try {
    const { openInBookStudio } = await import("../book/handoff.js");
    await openInBookStudio(
      A.bookSpec(w, m, band, entry, { lang: I.spanish ? "es" : "en" }),
      (url) => ctx.navigate(url),
    );
  } catch {
    button.disabled = false;
    announce(
      I.S(
        "Book Studio could not open. Try again.",
        "No se pudo abrir el Estudio de libros. Inténtalo otra vez.",
      ),
    );
  }
}

async function dictate(ctx, i) {
  const I = i18nFor(ctx);
  if (dictation) {
    await dictation.stop?.();
    dictation = null;
    withEntry(ctx, ({ progress, entry }) => {
      (entry.answers[i] ||= {}).listening = false;
      save(progress);
    });
    ctx.rerender();
    return;
  }
  const { startDictation } = await import("../stt.js");
  const base = document.querySelector(`[data-adv-text="${i}"]`)?.value || "";
  dictation = await startDictation({
    onText: ({ text }) => {
      const box = document.querySelector(`[data-adv-text="${i}"]`);
      if (box) {
        box.value = `${base}${base && text ? " " : ""}${text}`;
        box.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },
    onEnd: () => {
      dictation = null;
      withEntry(ctx, ({ progress, entry }) => {
        (entry.answers[i] ||= {}).listening = false;
        save(progress);
      });
      ctx.rerender();
    },
    onError: () =>
      announce(
        I.S(
          "Speech could not be heard. You can type instead.",
          "No se pudo escuchar. Puedes escribir.",
        ),
      ),
  }).catch(() => null);
  if (!dictation) {
    announce(
      I.S(
        "This browser cannot turn speech into words. Say it out loud, then type what you said.",
        "Este navegador no puede convertir la voz en palabras. Dilo en voz alta y luego escribe lo que dijiste.",
      ),
    );
    return;
  }
  withEntry(ctx, ({ progress, entry }) => {
    (entry.answers[i] ||= {}).listening = true;
    save(progress);
  });
  ctx.rerender();
}

export function onClick(e, ctx) {
  const t = e.target.closest?.("button, summary");
  if (!t) return false;
  const I = i18nFor(ctx);
  const ds = t.dataset;
  if (ds.advBook) {
    // From the completion screen or the world map's mission log: the finished mission becomes a book.
    const { w, band } = resolve(ctx);
    const target = w?.missions.find((x) => x.id === ds.advBook);
    const te = target && A.peekEntry(load(), w.id, band, target.id);
    if (te?.done) toBook(ctx, w, target, band, te, t);
    return true;
  }
  const handled = withEntry(ctx, ({ w, m, band, progress, entry, scenes, i, a }) => {
    const done = () => (save(progress), ctx.rerender(), true);
    const s = scenes[i];
    if (ds.advMode) {
      entry.mode = ds.advMode;
      entry.supported = ds.advMode === "help";
      entry.scene = 0;
      entry.trail = [];
      save(progress);
      ctx.navigate(urlOf(band, w.id, m.id, 0));
      return true;
    }
    if (t.hasAttribute("data-adv-replay")) {
      A.restart(entry);
      entry.playing = true;
      save(progress);
      ctx.navigate(urlOf(band, w.id, m.id));
      return true;
    }
    if (t.hasAttribute("data-adv-next")) {
      if (s?.kind === "respond" && !a.ok) entry.supported = true; // continuing after the model was shown
      const n = A.advance(entry, scenes);
      if (n === "done") {
        A.completeMission(w, m, band, entry);
        entry.playing = false;
        save(progress);
        ctx.navigate(urlOf(band, w.id, m.id, "done"));
        return true;
      }
      save(progress);
      ctx.navigate(urlOf(band, w.id, m.id, n));
      return true;
    }
    if (t.hasAttribute("data-adv-back")) {
      const n = A.back(entry);
      save(progress);
      ctx.navigate(urlOf(band, w.id, m.id, n));
      return true;
    }
    if (ds.advEs != null) {
      a.es = true;
      entry.supported = true;
      return done();
    }
    if (ds.advSpeak != null) {
      if (s.kind === "read") {
        a.aloud = true;
        entry.supported = true;
        save(progress);
      }
      speak(s.kind === "read" ? s.text.en : s.text.en, { lang: "en-US" });
      if (s.kind === "read") ctx.rerender();
      return true;
    }
    if (ds.advPlay != null) {
      a.plays = (a.plays || 0) + 1;
      save(progress);
      ctx.rerender();
      speak(s.script.en, { lang: "en-US" });
      return true;
    }
    if (t.hasAttribute("data-adv-stop")) {
      stopSpeech();
      return true;
    }
    if (ds.advTranscript != null) {
      e.preventDefault();
      a.transcript = !a.transcript;
      if (a.transcript) entry.supported = true;
      return done();
    }
    if (ds.advGloss) {
      a.gloss = ds.advGloss;
      return done();
    }
    if (ds.advClue) {
      const r = K.checkClue(s, ds.advClue);
      if (!r) return true;
      a.last = ds.advClue;
      if (r.ok) a.picked = [...new Set([...(a.picked || []), ds.advClue])];
      else a.aside = [...new Set([...(a.aside || []), ds.advClue])];
      const st = K.boardStatus(s, a.picked || []);
      a.ok = st.done;
      return done();
    }
    if (ds.advUnclue) {
      a.picked = (a.picked || []).filter((x) => x !== ds.advUnclue);
      a.last = null;
      a.ok = K.boardStatus(s, a.picked).done;
      return done();
    }
    if (ds.advOption != null) {
      const k = Number(ds.advOption);
      const r = K.checkChoice(s, k, (a.wrong || []).length);
      if (!r) return true;
      a.feedback = r.feedback;
      if (r.ok) {
        a.ok = true;
        a.chosen = k;
        a.next = r.next;
        a.reveal = null;
      } else {
        a.wrong = [...(a.wrong || []), k];
        if (r.reveal != null) a.reveal = r.reveal;
      }
      return done();
    }
    if (ds.advMove != null) {
      const seq = a.order || K.shuffledOrder(s.items.length, `${i}:${s.items[0].en}`);
      const pos = Number(ds.advMove);
      const to = pos + Number(ds.dir);
      if (to < 0 || to >= seq.length) return true;
      const next = [...seq];
      [next[pos], next[to]] = [next[to], next[pos]];
      a.order = next;
      save(progress);
      ctx.rerender();
      requestAnimationFrame(() =>
        (
          document.querySelector(`[data-adv-move="${to}"][data-dir="${ds.dir}"]:not([disabled])`) ||
          document.querySelector(`[data-adv-move="${to}"]:not([disabled])`)
        )?.focus(),
      );
      return true;
    }
    if (t.hasAttribute("data-adv-check-order")) {
      const seq = a.order || K.shuffledOrder(s.items.length, `${i}:${s.items[0].en}`);
      a.order = seq;
      const r = K.checkOrder(s.items, seq, a.tries || 0);
      a.tries = (a.tries || 0) + 1;
      a.result = r;
      a.ok = r.ok;
      return done();
    }
    if (ds.advHelp != null) {
      a.help = true;
      entry.supported = true;
      return done();
    }
    if (ds.advModel != null) {
      e.preventDefault();
      a.modelOpen = !a.modelOpen;
      return done();
    }
    if (ds.advDictate != null) {
      dictate(ctx, Number(ds.advDictate));
      return true;
    }
    if (ds.advCheckRespond != null) {
      const text = document.querySelector(`[data-adv-text="${i}"]`)?.value ?? a.text ?? "";
      a.text = text.slice(0, 4000);
      const r = A.runRespond(w, m, band, progress, entry, i, a.text);
      if (r.words === 0) {
        a.result = r;
        return done();
      }
      a.checks = (a.checks || 0) + 1;
      a.result = r;
      a.ok = a.ok || r.ok;
      if (a.modelOpen) entry.supported = true;
      record(ctx, w, m, i, r, entry, s, {
        frames: entry.mode === "help" || !!a.help,
        bank: entry.mode === "help" || !!a.help,
        model: !!a.modelOpen,
        l1: Object.values(entry.answers).some((x) => x?.es),
      });
      return done();
    }
    return false;
  });
  return handled === true;
}
