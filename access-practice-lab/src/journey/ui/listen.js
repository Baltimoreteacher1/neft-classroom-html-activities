// Active Listening Laboratory — UI for the `listen` engine (first half of the UNDERSTAND step).
// Logic lives in ../engines/listen.js; this file only translates between the DOM and that logic.
// Resumable state is env.data.listen; the task is env.task or env.pack.understand.listen. Never auto-plays.
import { canSpeak, speak, stop as stopSpeech } from "../../speech.js";
import { esc, html, icon, raw, toHtml } from "../../util.js";
import * as E from "../engines/listen.js";

export const taskOf = (env) => env.task ?? env.pack?.understand?.listen ?? null;
const PARTS = ["1", "2"];
let pendingFocus = null;
let playRun = 0; // bumps whenever audio is stopped or replaced, so a superseded run never reports failure // selector to focus after the next paint (a rerender must not lose the learner's place)

function fresh(task) {
  return { phase: "play", part: 1, state: E.init(task), parts: {}, helps: { 1: [], 2: [] }, heard: {}, xray: false, visuals: false, read: false, audioFailed: false, rate: null };
}

/** Saved data when it still matches this task, else a fresh part 1. Throws a descriptive Error for an invalid task. */
export function load(task, env) {
  const saved = env.data?.listen;
  const base = fresh(task);
  if (!saved?.state?.placed || !["play", "bridge", "done"].includes(saved.phase)) return base;
  if (!PARTS.includes(String(saved.part)) || (saved.part === 2 && !E.hasFinal(task))) return base;
  const t = E.resolveTask(task, { final: saved.part === 2 });
  const same = (a, b) => a.length === b.length && a.every((k) => b.includes(k));
  if (!same(Object.keys(saved.state.placed), t.items.map((i) => i.id))) return base;
  return { ...base, ...saved, helps: { ...base.helps, ...saved.helps } };
}

const labelOf = (t, id) => t.items.find((i) => i.id === id)?.label ?? id;
const targetLabel = (t, id) => t.targets.find((x) => x.id === id)?.label ?? id;
const supportOffer = (env, indep) => (indep ? "none" : env.support === "A" ? "up" : env.support === "C" ? "none" : "ask");
const audioOk = (d) => canSpeak() && !d.audioFailed;

const MODE_LEAD = {
  arrange: ["Listen to everything first. Then put the cards in the order you hear.", "Escucha todo primero. Luego pon las tarjetas en el orden que oyes."],
  follow: ["Listen and follow along at the lab bench. Put the steps in the order you hear them.", "Escucha y sigue el trabajo en la mesa del laboratorio. Pon los pasos en el orden que los oyes."],
  place: ["Listen for where each thing goes on the map. Then place each card on the map.", "Escucha dónde va cada cosa en el mapa. Luego coloca cada tarjeta en el mapa."],
  sort: ["Listen for the details about each group. Then sort each card where it belongs.", "Escucha los detalles de cada grupo. Luego clasifica cada tarjeta donde corresponde."],
};

const markHTML = (text, marks) =>
  E.segments(text, marks)
    .map((r) => {
      if (r.kind === "speakers") return `<span class="jl-badge">${esc(r.note)}</span> `;
      if (!r.kind) return esc(r.text);
      const note = r.kind === "referents" && r.note ? ` <span class="jl-note">(${esc(r.note)})</span>` : "";
      return `<mark class="jl-mark jl-k-${r.kind}" data-kind="${r.kind}">${esc(r.text)}</mark>${note}`;
    })
    .join("");
const signalHTML = (text, signal) =>
  E.highlightSignal(text, signal)
    .map((r) => (r.signal ? `<mark class="jl-signal">${esc(r.text)}</mark>` : esc(r.text)))
    .join("");

function head(env, t, d, indep, task) {
  const T = env.I.T;
  const two = E.hasFinal(task);
  const part = d.part === 2 ? T("Final check: on your own", "Revisión final: tú solo") : indep ? T("On your own", "Tú solo") : T("With support", "Con apoyo");
  return html`<header class="jl-head">
    <p class="eyebrow"><span>${T("Active Listening Lab", "Laboratorio de escucha activa")}</span>${two ? html` <span class="jl-part">${T(`Part ${d.part} of 2`, `Parte ${d.part} de 2`)} · ${part}</span>` : html` <span class="jl-part">${part}</span>`}</p>
    <h2 id="jl-title" tabindex="-1" lang="en">${t.title}</h2>
    <p class="jl-lead">${T(...MODE_LEAD[t.mode])}</p>
  </header>`;
}

function player(env, t, d) {
  const T = env.I.T;
  if (!audioOk(d))
    return html`<div class="jl-player is-unavailable" role="note">
      <p><strong>${T("The spoken audio cannot play in this browser.", "El audio no se puede reproducir en este navegador.")}</strong> ${T("You can read the sentences instead, or ask your teacher to read them to you.", "Puedes leer las oraciones, o pedirle a tu docente que te las lea.")}</p>
      ${d.read ? html`<p class="jl-fine">${T("The sentences are showing. This counts as supported practice.", "Las oraciones están a la vista. Esto cuenta como práctica con apoyo.")}</p>` : html`<button type="button" class="btn" data-act="read-instead">${icon("reading")} ${T("Read it instead", "Léelo en su lugar")}</button>`}
    </div>`;
  const slow = (d.rate ?? env.prefs?.rate ?? 0.9) <= 0.78;
  return html`<div class="jl-player" role="group" aria-label="${env.I.S("Listen", "Escuchar")}">
    <button type="button" class="btn btn-primary jl-playall" data-act="play-all">${icon("play")} ${T("Play all", "Reproducir todo")}</button>
    <button type="button" class="btn ghost" data-act="stop">${icon("stop")} ${T("Stop", "Detener")}</button>
    <span class="jl-speed" role="group" aria-label="${env.I.S("Audio speed", "Velocidad del audio")}">
      <button type="button" class="chip" data-act="rate" data-rate="0.75" aria-pressed="${String(slow)}">${T("Slower", "Más lento")}</button>
      <button type="button" class="chip" data-act="rate" data-rate="0.9" aria-pressed="${String(!slow)}">${T("Normal", "Normal")}</button>
    </span>
    <p class="jl-status" role="status" data-jl-status>${T("Press Listen on a sentence, or Play all. Nothing plays by itself.", "Presiona Escuchar en una oración, o Reproducir todo. Nada suena solo.")}</p>
  </div>`;
}

function helps(env, t, d, offer, layers) {
  const T = env.I.T;
  if (offer === "none" || (!audioOk(d) && !d.read)) return "";
  const hasVisuals = Object.keys(t.visuals || {}).length > 0;
  const buttons = html`${layers.length ? html`<button type="button" class="chip" data-act="xray" aria-pressed="${String(d.xray)}">${icon("search")} ${T("Listening X-Ray", "Rayos X de escucha")}</button>` : ""}
    ${hasVisuals ? html`<button type="button" class="chip" data-act="visuals" aria-pressed="${String(d.visuals)}">${icon("sparkle")} ${T("Picture clues", "Pistas con imágenes")}</button>` : ""}`;
  if (!layers.length && !hasVisuals) return "";
  const legend = d.xray ? html`<ul class="jl-legend" aria-label="${env.I.S("X-Ray key", "Clave de los rayos X")}">${layers.map((l) => html`<li><span class="jl-key jl-k-${l.id}" aria-hidden="true">Aa</span> ${T(...l.label)}</li>`)}</ul>` : "";
  if (offer === "up") return html`<div class="jl-helps" role="group" aria-label="${env.I.S("Listening helps", "Ayudas para escuchar")}">${buttons}${legend}</div>`;
  return html`<details class="jl-helps" ${d.xray || d.visuals ? "open" : ""}><summary>${T("Need help?", "¿Necesitas ayuda?")}</summary><div class="jl-helps-body">${buttons}${legend}</div></details>`;
}

function script(env, t, d, offer, layers) {
  const T = env.I.T;
  const audio = audioOk(d);
  const caps = d.read || (d.xray && offer !== "none");
  if (!audio && !d.read) return "";
  const marks = (id) => (d.xray && offer !== "none" ? layers.flatMap((l) => l.marks[id] || []) : []);
  const n = t.script.length;
  return html`${helps(env, t, d, offer, layers)}
  <ol class="jl-script" aria-label="${env.I.S("The sentences", "Las oraciones")}">${t.script.map(
    (u, i) => html`<li data-u="${u.id}">
      ${audio ? html`<button type="button" class="btn jl-listen" data-act="play" data-u="${u.id}" aria-label="${env.I.S(`Listen to sentence ${i + 1} of ${n}`, `Escuchar la oración ${i + 1} de ${n}`)}">${icon("play")} <span>${T(`Listen ${i + 1}`, `Escuchar ${i + 1}`)}</span></button>` : html`<span class="jl-num">${i + 1}</span>`}
      ${caps ? html`<p class="jl-caption" lang="en">${marks(u.id).length ? raw(markHTML(u.text, marks(u.id))) : u.text}</p>` : ""}
      ${d.visuals && offer !== "none" && t.visuals?.[u.id] ? html`<p class="jl-visual" lang="en">${icon("sparkle")} <strong>${T("Picture clue:", "Pista con imagen:")}</strong> ${t.visuals[u.id]}</p>` : ""}
    </li>`,
  )}</ol>`;
}

const checked = (st, id) => id in st.attempts && st.attempts[id] === st.placed[id] && st.placed[id] !== null;

function chip(env, ok) {
  const T = env.I.T;
  return ok
    ? html`<span class="jl-chip is-ok" data-result="ok">${icon("check")} <span>${T("Correct", "Correcto")}</span></span>`
    : html`<span class="jl-chip is-wrong" data-result="wrong">${icon("x")} <span>${T("Not yet", "Todavía no")}</span></span>`;
}

function itemBtn(env, t, st, id, live, withChip, okOf) {
  const it = t.items.find((x) => x.id === id);
  const sel = st.selected === id;
  return html`<button type="button" class="jl-item${sel ? " is-selected" : ""}${st.placed[id] ? " is-placed" : ""}" data-act="item" data-item="${id}" aria-pressed="${String(sel)}" ${live ? "" : "disabled"}>
    <span class="jl-glyph" aria-hidden="true">${it.glyph || ""}</span><span class="jl-item-text" lang="en">${it.label}</span></button>${withChip && checked(st, id) ? chip(env, okOf[id]) : ""}`;
}

function cell(env, t, st, tg, live, okOf) {
  const here = E.itemsIn(st, tg.id);
  const sorted = t.mode === "sort";
  const T = env.I.T;
  const hint = t.mode === "place" ? E.compassHint(tg.label) : null;
  const contents = here.length ? here.map((id) => labelOf(t, id)).join(", ") : null;
  const act = st.selected ? `Press to place ${labelOf(t, st.selected)} here.` : here.length && !sorted ? "Press to pick this card up." : "";
  const aria = `${tg.label}, ${contents ? `holds ${contents}` : "empty"}. ${act}`.trim();
  const body = sorted
    ? html`<span class="jl-target-name" lang="en">${tg.label}</span><span class="jl-count">${T(`${here.length} card${here.length === 1 ? "" : "s"}`, `${here.length} tarjeta${here.length === 1 ? "" : "s"}`)}</span>`
    : html`<span class="jl-target-name" lang="en">${hint ? html`<b class="jl-compass" aria-hidden="true">${hint}</b> ` : ""}${tg.label}</span>
      ${here.length ? html`<span class="jl-placed"><span class="jl-glyph" aria-hidden="true">${t.items.find((x) => x.id === here[0]).glyph || ""}</span><span lang="en">${labelOf(t, here[0])}</span></span>${checked(st, here[0]) ? chip(env, okOf[here[0]]) : ""}` : html`<span class="jl-empty">${T("empty", "vacío")}</span>`}`;
  return html`<div class="jl-cell${here.length ? " has-items" : ""}" data-cell="${tg.id}">
    <button type="button" class="jl-target" data-act="target" data-target="${tg.id}" aria-label="${aria}" ${live ? "" : "disabled"}>${body}</button>
    ${sorted ? html`<ul class="jl-bin-items">${here.map((id) => html`<li>${itemBtn(env, t, st, id, live, true, okOf)}</li>`)}</ul>` : ""}
  </div>`;
}

function board(env, t, st, d, live) {
  const T = env.I.T;
  const okOf = Object.fromEntries(E.check(t, { ...st, final: false }).results.map((r) => [r.item, r.ok]));
  const tray = t.items.filter((i) => st.placed[i.id] === null);
  const cells = t.targets.map((tg) => cell(env, t, st, tg, live, okOf));
  const surface =
    t.mode === "place"
      ? html`<div class="jl-grid" role="group" aria-label="${env.I.S("Map. North is at the top.", "Mapa. El norte está arriba.")}" style="--cols:${t.grid.cols}"><span class="jl-north" aria-hidden="true">N ↑</span>${cells}</div>`
      : t.mode === "sort"
        ? html`<div class="jl-bins" role="group" aria-label="${env.I.S("Groups", "Grupos")}">${cells}</div>`
        : html`<ol class="jl-slots" aria-label="${env.I.S(t.mode === "follow" ? "Steps at the lab bench" : "Order", t.mode === "follow" ? "Pasos en la mesa del laboratorio" : "Orden")}">${cells.map((c) => html`<li>${c}</li>`)}</ol>`;
  return html`<div class="jl-board${t.mode === "follow" ? " jl-bench" : ""}">
    <div class="jl-tray"><h3>${T(t.mode === "follow" ? "Lab equipment" : "Cards", t.mode === "follow" ? "Equipo del laboratorio" : "Tarjetas")}</h3>
      <ul class="jl-pool" aria-label="${env.I.S("Cards to place", "Tarjetas por colocar")}">${tray.length ? tray.map((i) => html`<li>${itemBtn(env, t, st, i.id, live, false, okOf)}</li>`) : html`<li class="jl-fine">${T("All the cards are placed.", "Todas las tarjetas están colocadas.")}</li>`}</ul></div>
    <div class="jl-surface">${surface}</div>
  </div>`;
}

function repair(env, task, t, st, d, indep, canPlay) {
  const T = env.I.T;
  const okOf = Object.fromEntries(E.check(t, { ...st, final: false }).results.map((r) => [r.item, r.ok]));
  const wrong = t.items.filter((i) => checked(st, i.id) && okOf[i.id] === false);
  if (!wrong.length) return "";
  return html`<section class="jl-repair" aria-label="${env.I.S("Fix it", "Corrígelo")}">${wrong.map((i) => {
    const fb = E.feedbackFor(task, st, i.id, { independent: indep });
    const sentence = fb.level >= 2 && fb.text ? html`<p class="jl-caption" lang="en">${raw(signalHTML(fb.text, fb.signal))}</p>` : "";
    const visual = fb.visual ? html`<p class="jl-visual" lang="en">${icon("sparkle")} <strong>${T("Picture clue:", "Pista con imagen:")}</strong> ${fb.visual}</p>` : "";
    const msg =
      fb.kind === "independent" ? T("Not yet. Listen again, then try another place.", "Todavía no. Escucha otra vez y prueba en otro lugar.")
      : fb.level === 1 ? T("Not yet. Listen to the sentence that talks about this card.", "Todavía no. Escucha la oración que habla de esta tarjeta.")
      : fb.level === 2 ? T("Still not right. Here is the sentence. The signal word is marked.", "Todavía no es correcto. Esta es la oración. La palabra clave está marcada.")
      : T("Keep trying. A picture clue is added.", "Sigue intentando. Se agrega una pista con imagen.");
    return html`<article class="jl-fix" data-fix="${i.id}" data-level="${fb.level}" tabindex="-1">
      <h4><span class="jl-glyph" aria-hidden="true">${i.glyph || ""}</span> <span lang="en">${i.label}</span></h4>
      <p>${msg}</p>${sentence}${visual}
      <div class="jl-fix-actions">
        ${canPlay ? (fb.kind === "independent" ? html`<button type="button" class="btn" data-act="play-all">${icon("replay")} ${T("Listen again", "Escuchar otra vez")}</button>` : fb.utterance ? html`<button type="button" class="btn" data-act="play" data-u="${fb.utterance}">${icon("replay")} ${T("Listen to that sentence", "Escuchar esa oración")}</button>` : "") : ""}
        <button type="button" class="btn ghost" data-act="try-another" data-item="${i.id}">${T("Try another place", "Probar otro lugar")}</button>
      </div></article>`;
  })}</section>`;
}

function view(task, env, d) {
  const T = env.I.T;
  const final = d.part === 2;
  const t = E.resolveTask(task, { final });
  const st = d.state;
  const indep = final || Boolean(env.independent);
  const offer = supportOffer(env, indep);
  const live = d.phase === "play";
  const layers = indep ? [] : E.xrayLayers(task);
  const placed = t.expect.length - E.unplaced(task, st).length;
  const body = html`${player(env, t, d)}${script(env, t, d, offer, layers)}${board(env, t, st, d, live)}${live ? repair(env, task, t, st, d, indep, audioOk(d)) : ""}`;
  return html`<section class="jl d-listening jl-${t.mode}" data-jl data-mode="${t.mode}" data-part="${d.part}" data-phase="${d.phase}" aria-labelledby="jl-title">
    ${head(env, t, d, indep, task)}
    ${d.phase === "bridge" ? html`<div class="jl-bridge"><h3>${T("Part 1 is done.", "La parte 1 está lista.")}</h3><p>${T("Now try a new listening on your own. There is no X-Ray, no picture clues and no sentences on the screen. You can listen as many times as you want.", "Ahora prueba una escucha nueva tú solo. No hay rayos X, ni pistas con imágenes, ni oraciones en la pantalla. Puedes escuchar las veces que quieras.")}</p><button type="button" class="btn btn-primary" data-act="start-final">${icon("arrow-right")} ${T("Start the final check", "Empezar la revisión final")}</button></div>` : body}
    ${d.phase === "done" ? html`<div class="jl-done" role="note"><strong>${icon("check")} ${T("Every card is in the right place.", "Todas las tarjetas están en el lugar correcto.")}</strong></div>` : ""}
    ${live ? html`<div class="jl-actions"><button type="button" class="btn btn-primary" data-act="check">${icon("check")} ${T("Check my work", "Revisar mi trabajo")}</button><span class="jl-fine">${T(`${placed} of ${t.expect.length} cards placed`, `${placed} de ${t.expect.length} tarjetas colocadas`)}</span></div>` : ""}
    <div class="visually-hidden" role="status" aria-live="polite" data-jl-live></div>
  </section>`;
}

/** Part 1 uses `task`; part 2 (the final check) uses `task.final` with no supports. */
export function render(task, env) {
  try {
    return view(task, env, load(task, env));
  } catch (err) {
    console.error(err);
    return html`<section class="jl" data-jl role="alert"><p>${env.I.T("This listening task could not load.", "No se pudo cargar esta tarea de escucha.")}</p></section>`;
  }
}

const ARROWS = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };

export function mount(root, env) {
  root.__jlOff?.();
  const task = taskOf(env);
  if (!task) return;
  let d;
  try {
    d = load(task, env);
  } catch {
    return;
  }
  const q = (sel) => root.querySelector(sel);
  const cur = () => E.resolveTask(task, { final: d.part === 2 });
  const indep = () => d.part === 2 || Boolean(env.independent);
  const say = (msg) => {
    if (env.announce) env.announce(msg);
    else if (q("[data-jl-live]")) q("[data-jl-live]").textContent = msg;
  };
  const status = (msg) => {
    if (q("[data-jl-status]")) q("[data-jl-status]").textContent = msg;
  };
  const focusPending = () => {
    if (pendingFocus) q(pendingFocus)?.focus();
    pendingFocus = null;
  };
  const paint = () => {
    const host = q("[data-jl]");
    if (!host) return;
    const tpl = document.createElement("template");
    tpl.innerHTML = toHtml(view(task, env, d));
    host.replaceWith(tpl.content);
    focusPending();
  };
  const commit = (next, focus) => {
    d = next;
    pendingFocus = focus || null;
    const marker = q("[data-jl]");
    env.update?.({ listen: d });
    if (q("[data-jl]") === marker) paint();
    else focusPending();
  };
  const addHelp = (data, id) => {
    const list = data.helps[data.part];
    if (list.includes(id)) return data;
    env.help?.(id);
    return { ...data, helps: { ...data.helps, [data.part]: [...list, id] } };
  };

  const speakIds = async (ids) => {
    const t = cur();
    const lines = ids.map((id) => t.script.find((s) => s.id === id)).filter(Boolean);
    if (!lines.length) return;
    const run = ++playRun;
    let state = d.state;
    for (const l of lines) {
      if (d.heard[l.id]) state = E.noteReplay(state, l.id);
    }
    d = { ...d, state, heard: { ...d.heard, ...Object.fromEntries(lines.map((l) => [l.id, true])) } };
    const rate = d.rate ?? env.prefs?.rate ?? 0.9;
    const mark = (id) => root.querySelectorAll("[data-u]").forEach((li) => (id && li.dataset.u === id ? li.setAttribute("aria-current", "true") : li.removeAttribute("aria-current")));
    const ok = await speak(lines.map((l) => l.text), {
      rate,
      onSegment: (i) => {
        status(env.I.S(`Playing sentence ${t.script.findIndex((s) => s.id === lines[i].id) + 1} of ${t.script.length}.`, `Reproduciendo la oración ${t.script.findIndex((s) => s.id === lines[i].id) + 1} de ${t.script.length}.`));
        mark(lines[i].id);
      },
    });
    if (run !== playRun) return;
    mark(null);
    if (ok) status(env.I.S("Finished. Press Listen to hear any sentence again.", "Terminó. Presiona Escuchar para oír otra vez cualquier oración."));
    else {
      status(env.I.S("The audio could not play.", "No se pudo reproducir el audio."));
      commit({ ...d, audioFailed: true });
    }
  };

  const onCheck = () => {
    const r = E.submit(task, d.state);
    if (!r.ready) return say(env.I.S(`Place every card first. ${r.missing.length} left.`, `Coloca todas las tarjetas primero. Faltan ${r.missing.length}.`));
    let next = { ...d, state: r.state };
    const wrong = r.result.results.filter((x) => !x.ok);
    if (!indep()) {
      for (const w of wrong) {
        const fb = E.feedbackFor(task, r.state, w.item);
        if (fb?.level >= 2) next = addHelp(next, "signal");
        if (fb?.level >= 3 && fb.visual) next = addHelp(next, "visual");
      }
    }
    if (!wrong.length) return finishPart(next);
    say(env.I.S(`Not every card is in the right place yet. ${wrong.length} to fix.`, `Todavía no todas las tarjetas están en su lugar. Faltan ${wrong.length} por corregir.`));
    commit(next, `[data-fix="${wrong[0].item}"]`);
  };

  const finishPart = (next) => {
    const part = next.part;
    const stats = E.doneCriteria(task, next.state);
    const helpsUsed = next.helps[part];
    env.ledger?.(E.ledgerEntry({ missionId: env.missionId, band: env.band, klu: env.mission?.klu, part, correct: stats.correct, total: stats.total, tries: stats.tries, replays: stats.replays, helps: helpsUsed, independent: Boolean(env.independent) }));
    const parts = { ...next.parts, [part]: { correct: stats.correct, total: stats.total, tries: stats.tries, replays: stats.replays, helps: helpsUsed } };
    if (part === 1 && E.hasFinal(task)) {
      say(env.I.S("Part 1 complete. A final check on your own is next.", "Parte 1 completa. Sigue una revisión final tú solo."));
      return commit({ ...next, parts, phase: "bridge" }, "[data-act='start-final']");
    }
    const all = Object.values(parts);
    const result = {
      correct: stats.correct,
      total: stats.total,
      tries: all.reduce((a, p) => a + p.tries, 0),
      supportsUsed: [...new Set(all.flatMap((p) => p.helps))],
      finalIndependent: part === 2 && helpsUsed.length === 0,
    };
    say(env.I.S("Every card is in the right place.", "Todas las tarjetas están en el lugar correcto."));
    commit({ ...next, parts, phase: "done" });
    env.done?.(result);
  };

  const onItem = (id) => {
    const t = cur();
    if (d.state.placed[id] !== null) {
      say(env.I.S(`${labelOf(t, id)} picked up. Choose a place.`, `Tarjeta recogida: ${labelOf(t, id)}. Elige un lugar.`));
      return commit({ ...d, state: E.pickUp(d.state, id) }, `[data-item="${id}"]`);
    }
    const next = E.select(d.state, id);
    say(next.selected ? env.I.S(`${labelOf(t, id)} selected. Choose where it goes.`, `Tarjeta elegida: ${labelOf(t, id)}. Elige dónde va.`) : env.I.S("Selection cleared.", "Selección cancelada."));
    commit({ ...d, state: next }, `[data-item="${id}"]`);
  };

  const onTarget = (tid) => {
    const t = cur();
    const st = d.state;
    if (st.selected) {
      const out = st.mode === "sort" ? [] : E.itemsIn(st, tid).filter((x) => x !== st.selected);
      say(env.I.S(`${labelOf(t, st.selected)} placed in ${targetLabel(t, tid)}.${out.length ? ` ${labelOf(t, out[0])} went back to the cards.` : ""}`, `${labelOf(t, st.selected)} colocada en ${targetLabel(t, tid)}.${out.length ? ` ${labelOf(t, out[0])} volvió a las tarjetas.` : ""}`));
      return commit({ ...d, state: E.place(st, st.selected, tid) }, `[data-target="${tid}"]`);
    }
    const here = E.itemsIn(st, tid);
    if (here.length && st.mode !== "sort") return onItem(here[0]);
    say(env.I.S("Choose a card first, then choose where it goes.", "Primero elige una tarjeta y luego elige dónde va."));
  };

  const click = (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || !root.contains(el) || el.disabled) return;
    const act = el.dataset.act;
    if (act === "item") return onItem(el.dataset.item);
    if (act === "target") return onTarget(el.dataset.target);
    if (act === "play") return void speakIds([el.dataset.u]);
    if (act === "play-all") return void speakIds(cur().script.map((s) => s.id));
    if (act === "stop") {
      playRun++;
      stopSpeech();
      return status(env.I.S("Stopped.", "Detenido."));
    }
    if (act === "rate") return commit({ ...d, rate: Number(el.dataset.rate) }, `[data-rate="${el.dataset.rate}"]`);
    if (act === "check") return onCheck();
    if (act === "try-another") {
      say(env.I.S("Picked up. Choose another place.", "Tarjeta recogida. Elige otro lugar."));
      return commit({ ...d, state: E.pickUp(d.state, el.dataset.item) }, `[data-item="${el.dataset.item}"]`);
    }
    if (act === "xray") return commit(addHelp({ ...d, xray: !d.xray }, "xray"), "[data-act='xray']");
    if (act === "visuals") return commit(addHelp({ ...d, visuals: !d.visuals }, "visual"), "[data-act='visuals']");
    if (act === "read-instead") {
      say(env.I.S("The sentences are showing now.", "Ahora se ven las oraciones."));
      return commit(addHelp({ ...d, read: true }, "transcript"), "#jl-title");
    }
    if (act === "start-final") {
      playRun++;
      stopSpeech();
      return commit({ ...d, part: 2, phase: "play", state: E.init(task, { final: true }), xray: false, visuals: false, read: false, audioFailed: false, heard: {} }, "#jl-title");
    }
  };

  const key = (e) => {
    if (!(e.key in ARROWS) || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target.closest?.(".jl-target, .jl-tray .jl-item");
    if (!el || !root.contains(el)) return;
    const list = [...root.querySelectorAll(el.matches(".jl-target") ? ".jl-target" : ".jl-tray .jl-item")];
    const grid = el.closest(".jl-grid");
    const cols = grid ? Number(grid.style.getPropertyValue("--cols")) || 1 : 1;
    const step = grid && el.matches(".jl-target") && (e.key === "ArrowUp" || e.key === "ArrowDown") ? ARROWS[e.key] * cols : ARROWS[e.key];
    const next = list[list.indexOf(el) + step];
    if (!next) return;
    e.preventDefault();
    next.focus();
  };

  root.addEventListener("click", click);
  root.addEventListener("keydown", key);
  root.__jlOff = () => {
    root.removeEventListener("click", click);
    root.removeEventListener("keydown", key);
  };
  focusPending();
}
