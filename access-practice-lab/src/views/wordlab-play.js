// Word Lab activities: Morpheme Builder, Cognate Detector, Word Families, Word Detective and Frayer cards.
// Each exports { render(ctx, I, st, ui), click(e, ctx, I, st, ui) } and uses data-wl-* attributes. Dragging a tile is
// optional: every tile is a button that adds itself to the next empty slot, and every filled slot is a button that removes it.
import { COGNATE_PATTERNS, DETECTIVE, FAMILIES, FRAYER_MODELS } from "../content/wordlab-lab.js";
import {
  CLUE_TYPES,
  blendParts,
  buildTray,
  buildable,
  checkBuild,
  checkClue,
  cognateDeck,
  decodeQuestion,
  frayerStatus,
  hash,
} from "../lang/wordlab.js";
import { announce, html, icon } from "../util.js";
import { levelOf, renderAfterChange, speakBtn } from "./studio-kit.js";
import {
  FALSE_FRIENDS,
  MORPHEMES,
  bandWords,
  collectOnce,
  gloss,
  morphemeOf,
  showEs,
  wlEvidence,
  wlHref,
  wlSave,
} from "./wordlab-common.js";

const bandOnly = (items, band) => items.filter((x) => x.b === band || x.b === "both");
const tick = (ok) => (ok ? icon("check") : icon("alert"));

function feedback(ok, body) {
  return html`<div class="wl-feedback ${ok ? "is-right" : "is-try"}" role="status">
    ${tick(ok)} ${body}
  </div>`;
}

// ── Morpheme builder ──────────────────────────────────────────────────────────
const buildList = (band) => buildable(bandWords(band)).sort((a, b) => hash(a.id) - hash(b.id));
const pickTarget = (st, list) =>
  list.find((w) => !st.build.done.includes(w.id)) || list[hash(String(st.build.done.length)) % list.length];
/** The word being built stays fixed (ui.build.wid) until the learner moves on, even after it is marked done. */
function buildTarget(st, list, ui) {
  const kept = ui.build?.wid && list.find((w) => w.id === ui.build.wid);
  if (kept) return kept;
  const w = pickTarget(st, list);
  if (ui.build) ui.build.wid = w.id;
  return w;
}
const nextBuildState = (ui) =>
  (ui.build = {
    picked: [],
    checked: null,
    hint: false,
    mode: ui.build?.mode || "build",
    choice: null,
    wid: "",
  });

function blendHTML(word, I) {
  const parts = blendParts(word, MORPHEMES);
  return html`<p class="wl-blend" aria-label="${I.S("Meaning blend", "Mezcla de significados")}">
    ${parts.map((p, i) => html`${i ? html`<span class="wl-plus" aria-hidden="true">+</span>` : ""}<span class="wl-bpart"><b>${p.f}</b> <small>${p.m}${I.mode !== "en" && p.me ? html` / <span lang="es">${p.me}</span>` : ""}</small></span>`)}
    <span class="wl-plus" aria-hidden="true">=</span
    ><span class="wl-bword"><b>${word.w}</b> <small>${word.d}</small></span>
  </p>`;
}

export const build = {
  render(ctx, I, st, ui) {
    const band = ctx.band;
    const list = buildList(band);
    if (!list.length)
      return html`<p class="panel">
        ${I.T("No building words for this grade band yet.", "Aún no hay palabras para construir en este grupo de grados.")}
      </p>`;
    ui.build ||= nextBuildState(ui);
    const b = ui.build;
    const level = levelOf(st);
    const word = buildTarget(st, list, ui);
    const done = st.build.done.length;
    const modeBtns = html`<div
      class="sk-seg"
      role="group"
      aria-label="${I.S("Activity", "Actividad")}"
    >
      <button
        type="button"
        class="sk-level ${b.mode === "build" ? "is-on" : ""}"
        data-wl-bmode="build"
        aria-pressed="${String(b.mode === "build")}"
      >
        ${I.T("Build it", "Constrúyela")}
      </button>
      <button
        type="button"
        class="sk-level ${b.mode === "decode" ? "is-on" : ""}"
        data-wl-bmode="decode"
        aria-pressed="${String(b.mode === "decode")}"
      >
        ${I.T("Decode it", "Descífrala")}
      </button>
    </div>`;
    const head = html`<p class="fine">
      ${I.T(`${done} of ${list.length} words built. Nothing is timed.`, `${done} de ${list.length} palabras construidas. Nada tiene tiempo.`)}
    </p>`;
    if (b.mode === "decode") {
      const opts = decodeQuestion(word, bandWords(band));
      return html`${modeBtns}${head}
        <section class="panel wl-task" aria-labelledby="wl-b-h">
          <h2 id="wl-b-h">
            ${I.T("Which meaning do the parts make?", "¿Qué significado forman las partes?")}
          </h2>
          <p class="wl-bigword">
            ${word.p.map((f, i) => html`${i ? html`<span class="wl-plus" aria-hidden="true">+</span>` : ""}<span class="wl-tile is-static">${f}</span>`)}<span
              class="wl-plus"
              aria-hidden="true"
              >=</span
            ><b>${word.w}</b> ${speakBtn(I, word.w)}
          </p>
          ${
            level === "A" || b.hint
              ? html`<ul class="wl-parts">
                  ${word.p.map((f) => html`<li><b>${f}</b> ${morphemeOf(f).m}${gloss(I, level, morphemeOf(f).me)}</li>`)}
                </ul>`
              : html`<button type="button" class="btn small" data-wl-bhint>
                  ${icon("bulb")}
                  ${I.T("Show what the parts mean", "Mostrar qué significan las partes")}
                </button>`
          }
          <div class="wl-choices" role="group" aria-label="${I.S("Meanings", "Significados")}">
            ${opts.map((o, i) => html`<button type="button" class="wl-choice ${b.choice === i ? (o.ok ? "is-right" : "is-try") : ""}" data-wl-decode="${i}" aria-pressed="${String(b.choice === i)}">${o.text}${gloss(I, level, o.es)}</button>`)}
          </div>
          ${b.choice != null ? (opts[b.choice].ok ? html`${feedback(true, I.T("Yes. The parts blend into that meaning.", "Sí. Las partes se mezclan en ese significado."))}${blendHTML(word, I)}<button type="button" class="btn btn-primary" data-wl-bnext>${I.T("Next word", "Siguiente palabra")} ${icon("arrow-right")}</button>` : feedback(false, I.T("Not that one. Read what each part means, then blend them.", "Esa no. Lee qué significa cada parte y luego mézclalas."))) : ""}
        </section>`;
    }
    const tray = buildTray(word, MORPHEMES);
    const left = [...tray];
    for (const p of b.picked) left.splice(left.indexOf(p), 1);
    const slots = word.p.map(
      (_, i) =>
        html`<button
          type="button"
          class="wl-slot ${b.picked[i] ? "is-filled" : ""}"
          data-wl-slot="${i}"
          data-drop="slots"
          aria-label="${b.picked[i] ? I.S(`Part ${i + 1}: ${b.picked[i]}. Press to remove.`, `Parte ${i + 1}: ${b.picked[i]}. Pulsa para quitarla.`) : I.S(`Empty slot ${i + 1}`, `Espacio vacío ${i + 1}`)}"
        >
          ${b.picked[i] || i + 1}
        </button>`,
    );
    const res = b.checked;
    return html`${modeBtns}${head}
      <section class="panel wl-task" aria-labelledby="wl-b-h">
        <h2 id="wl-b-h">
          ${I.T("Build the word that means:", "Construye la palabra que significa:")}
        </h2>
        <p class="wl-prompt">${word.d} ${gloss(I, level, word.de)} <small>(${word.pos})</small></p>
        <div class="wl-slots" data-drop="slots" role="group" aria-label="${I.S("Your word", "Tu palabra")}">
          ${slots}
        </div>
        <div
          class="wl-tray"
          role="group"
          aria-label="${I.S("Word parts. Press one to add it, or drag it to a slot.", "Partes de palabras. Pulsa una para agregarla o arrástrala a un espacio.")}"
        >
          ${left.map((f) => html`<button type="button" class="wl-tile" data-wl-tile="${f}" data-drag="${f}" draggable="true"><b>${f}</b>${level === "A" || b.hint ? html`<small>${morphemeOf(f).m}</small>` : ""}</button>`)}
        </div>
        <div class="wl-actions">
          <button
            type="button"
            class="btn btn-primary"
            data-wl-check-build
            ${b.picked.length === word.p.length ? "" : "disabled"}
          >
            ${I.T("Check my word", "Revisar mi palabra")}
          </button>
          <button type="button" class="btn" data-wl-bclear ${b.picked.length ? "" : "disabled"}>
            ${I.T("Clear", "Borrar")}
          </button>
          ${level === "A" || b.hint ? "" : html`<button type="button" class="btn" data-wl-bhint>${icon("bulb")} ${I.T("Show what the parts mean", "Mostrar qué significan las partes")}</button>`}
        </div>
        ${
          res
            ? res.ok
              ? html`${feedback(true, I.T(`You built ${word.w}.`, `Construiste ${word.w}.`))}${blendHTML(word, I)}
                  <div class="wl-actions">
                    ${speakBtn(I, word.w)}<button
                      type="button"
                      class="btn btn-primary"
                      data-wl-bnext
                    >
                      ${I.T("Next word", "Siguiente palabra")} ${icon("arrow-right")}
                    </button>
                  </div>`
              : feedback(
                  false,
                  res.other
                    ? I.T(
                        `Those parts spell ${res.text}, a real word, but it means something else. Read the meaning again.`,
                        `Esas partes forman ${res.text}, una palabra real, pero significa otra cosa. Lee otra vez el significado.`,
                      )
                    : I.T(
                        `Those parts spell “${res.text}”. That is not a word we know. Try a different order or different parts.`,
                        `Esas partes forman «${res.text}». No es una palabra conocida. Prueba otro orden u otras partes.`,
                      ),
                )
            : ""
        }
      </section>`;
  },
  add(ctx, I, st, ui, form) {
    const list = buildList(ctx.band);
    const word = buildTarget(st, list, ui);
    if (!word || ui.build.picked.length >= word.p.length || ui.build.checked?.ok) return;
    ui.build.picked.push(form);
    ui.build.checked = null;
    announce(I.S(`Added ${form}.`, `Se agregó ${form}.`));
    ctx.rerender();
  },
  click(e, ctx, I, st, ui) {
    const t = e.target;
    ui.build ||= nextBuildState(ui);
    const b = ui.build;
    const list = buildList(ctx.band);
    const word = buildTarget(st, list, ui);
    const mode = t.closest("[data-wl-bmode]");
    if (mode) {
      nextBuildState(ui).mode = mode.dataset.wlBmode;
      return (ctx.rerender(), true);
    }
    const tile = t.closest("[data-wl-tile]");
    if (tile) return (build.add(ctx, I, st, ui, tile.dataset.wlTile), true);
    const slot = t.closest("[data-wl-slot]");
    if (slot) {
      const i = Number(slot.dataset.wlSlot);
      if (b.picked[i] && !b.checked?.ok) {
        b.picked.splice(i, 1);
        b.checked = null;
        ctx.rerender();
      }
      return true;
    }
    if (t.closest("[data-wl-bclear]"))
      return ((b.picked = []), (b.checked = null), ctx.rerender(), true);
    if (t.closest("[data-wl-bhint]")) {
      b.hint = true;
      if (!st.build.helped.includes(word.id)) st.build.helped.push(word.id);
      wlSave(st);
      return (ctx.rerender(), true);
    }
    if (t.closest("[data-wl-check-build]")) {
      b.checked = checkBuild(bandWords(ctx.band), b.picked, word);
      if (b.checked.ok) finishWord(ctx, st, word);
      announce(
        b.checked.ok
          ? I.S("Correct.", "Correcto.")
          : I.S("Not yet. Try again.", "Todavía no. Inténtalo otra vez."),
      );
      return (ctx.rerender(), true);
    }
    const dec = t.closest("[data-wl-decode]");
    if (dec) {
      b.choice = Number(dec.dataset.wlDecode);
      const opts = decodeQuestion(word, bandWords(ctx.band));
      if (opts[b.choice].ok) finishWord(ctx, st, word);
      return (ctx.rerender(), true);
    }
    if (t.closest("[data-wl-bnext]")) {
      const keep = b.mode;
      nextBuildState(ui).mode = keep;
      return (ctx.rerender(), true);
    }
    return false;
  },
};

function finishWord(ctx, st, word) {
  if (!st.build.done.includes(word.id)) st.build.done.push(word.id);
  collectOnce(st, word.id);
  const n = st.build.done.length;
  if (n % 5 === 0) {
    const helped = st.build.done.slice(-5).filter((id) => st.build.helped.includes(id)).length;
    wlEvidence(
      st,
      ctx,
      `build-${n / 5}`,
      { n: 5, helped },
      helped ? { hint: true } : {},
      "Explain",
    );
  }
  wlSave(st);
}

// ── Cognate detector ──────────────────────────────────────────────────────────
const deckFor = (band) =>
  cognateDeck(
    bandWords(band),
    FALSE_FRIENDS.filter((f) => !f.b || f.b === band || f.b === "both"),
  );

export const cognates = {
  render(ctx, I, st, ui) {
    const level = levelOf(st);
    const deck = deckFor(ctx.band);
    const todo = deck.filter((c) => st.cog.done[c.id] == null);
    const card = (ui.cogId && deck.find((c) => c.id === ui.cogId)) || todo[0];
    if (card) ui.cogId = card.id;
    const answered = deck.length - todo.length;
    const patterns = html`<details class="wl-details">
      <summary>
        ${icon("language")}
        ${I.T("Spanish and English word-ending patterns", "Patrones de terminaciones entre español e inglés")}
      </summary>
      <ul class="wl-patterns">
        ${COGNATE_PATTERNS.map((p) => html`<li><b>${p.en}</b> ${icon("arrow-right")} <b lang="es">${p.es}</b> <span>${p.ex.map(([a, b]) => `${a} / ${b}`).join(" · ")}</span><small>${I.T(p.tip, p.tipEs)}</small></li>`)}
      </ul>
    </details>`;
    const shelf = html`<details class="wl-details">
      <summary>
        ${icon("alert")} ${I.T("False-friend warning shelf", "Estante de falsos amigos")}
      </summary>
      <ul class="wl-friends">
        ${FALSE_FRIENDS.map(
          (f) =>
            html`<li>
              <b>${f.en}</b> ${I.T("is not", "no es")} <b lang="es">${f.es}</b
              ><small
                >${f.en}: ${f.enMean}. <span lang="es">${f.es}</span>: ${f.esMean}.
                ${I.T(`Say “${f.say}”.`, `Di «${f.say}».`)}</small
              >
            </li>`,
        )}
      </ul>
    </details>`;
    if (!card)
      return html`${patterns}${shelf}
        <section class="panel">
          <h2>${I.T("You sorted every card.", "Clasificaste todas las tarjetas.")}</h2>
          <p>
            ${I.T("Your first tries are saved on this device.", "Tus primeros intentos se guardan en este dispositivo.")}
          </p>
          <button type="button" class="btn" data-wl-cog-reset>
            ${I.T("Start the deck again", "Empezar el mazo otra vez")}
          </button>
        </section>`;
    const sel = ui.cogSel;
    const revealed = sel != null || st.cog.done[card.id] != null;
    const right = card.kind;
    const choices = [
      ["twin", I.T("Twin: same meaning", "Gemela: mismo significado")],
      ["catch", I.T("Look-alike with a catch", "Parecida, con trampa")],
      ["none", I.T("No look-alike", "Sin parecida")],
    ];
    return html`${patterns}${shelf}
      <section class="panel wl-task" aria-labelledby="wl-c-h">
        <p class="fine">
          ${I.T(`${answered} of ${deck.length} sorted.`, `${answered} de ${deck.length} clasificadas.`)}
        </p>
        <h2 id="wl-c-h">
          ${I.T("Does this English word have a Spanish look-alike?", "¿Esta palabra en inglés tiene una parecida en español?")}
        </h2>
        <p class="wl-bigword"><b>${card.en}</b> ${speakBtn(I, card.en)}</p>
        <p class="wl-ex">${card.ex}</p>
        ${level === "A" && !revealed ? html`<p class="fine">${I.T("Hint: think of the Spanish word you would say for it.", "Pista: piensa en la palabra que dirías en español.")}</p>` : ""}
        <div class="wl-choices" role="group" aria-label="${I.S("Choose one", "Elige una")}">
          ${choices.map(([k, label]) => html`<button type="button" class="wl-choice ${revealed && k === right ? "is-right" : revealed && sel === k ? "is-try" : ""}" data-wl-cog="${k}" aria-pressed="${String(sel === k)}" ${revealed ? "disabled" : ""}>${label}</button>`)}
        </div>
        ${
          revealed
            ? html`${feedback(sel === right || st.cog.done[card.id] === 1, card.kind === "twin" ? I.T(`Twin. ${card.en} and ${card.es} mean the same thing.`, `Gemela. ${card.en} y ${card.es} significan lo mismo.`) : card.kind === "catch" ? I.T("A look-alike with a catch. Be careful.", "Parecida, con trampa. Ten cuidado.") : I.T(`No look-alike. In Spanish you say “${card.es}”.`, `Sin parecida. En español se dice «${card.es}».`))}
                ${card.kind !== "none" ? html`<p class="wl-twin is-${card.kind}"><b>${card.en}</b> ${icon("arrow-right")} <b lang="es">${card.es}</b> <button type="button" class="btn small sk-say" data-say-es="${card.es}" aria-label="${I.S("Hear the Spanish", "Escuchar el español")}">${icon("volume")}</button></p>` : ""}
                ${card.note ? html`<p class="wl-warn" role="note">${icon("alert")} ${I.T(card.note, card.noteEs)}</p>` : ""}
                <button type="button" class="btn btn-primary" data-wl-cog-next>
                  ${I.T("Next card", "Siguiente tarjeta")} ${icon("arrow-right")}
                </button>`
            : ""
        }
      </section>`;
  },
  click(e, ctx, I, st, ui) {
    const t = e.target;
    const deck = deckFor(ctx.band);
    const todo = deck.filter((c) => st.cog.done[c.id] == null);
    const card = (ui.cogId && deck.find((c) => c.id === ui.cogId)) || todo[0];
    const pick = t.closest("[data-wl-cog]");
    if (pick && card) {
      ui.cogSel = pick.dataset.wlCog;
      st.cog.done[card.id] = ui.cogSel === card.kind ? 1 : 0;
      const n = Object.keys(st.cog.done).length;
      if (n % 10 === 0) {
        const last = Object.values(st.cog.done).slice(-10);
        wlEvidence(
          st,
          ctx,
          `cognates-${n / 10}`,
          { n: 10, right: last.filter(Boolean).length },
          {},
          "Inform",
        );
      }
      wlSave(st);
      return (ctx.rerender(), true);
    }
    if (t.closest("[data-wl-cog-next]")) {
      ui.cogSel = null;
      ui.cogId = null;
      return (ctx.rerender(), true);
    }
    if (t.closest("[data-wl-cog-reset]")) {
      st.cog.done = {};
      ui.cogSel = null;
      wlSave(st);
      return (ctx.rerender(), true);
    }
    return false;
  },
};

// ── Word families ─────────────────────────────────────────────────────────────
export const families = {
  render(ctx, I, st, ui) {
    const level = levelOf(st);
    const list = bandOnly(FAMILIES, ctx.band);
    const solved = (f) => (st.fam.done[f.id] || []).length;
    const fam =
      list.find((f) => f.id === ui.famId) ||
      list.find((f) => solved(f) < f.items.length) ||
      list[0];
    if (!fam)
      return html`<p class="panel">
        ${I.T("No families for this band.", "No hay familias para este grupo.")}
      </p>`;
    const got = st.fam.done[fam.id] || [];
    const tries = ui.famTry || {};
    return html`<nav class="sk-modes" aria-label="${I.S("Word families", "Familias de palabras")}">
        ${list.map((f) => html`<button type="button" class="sk-mode ${f.id === fam.id ? "is-on" : ""}" data-wl-fam="${f.id}" aria-pressed="${String(f.id === fam.id)}">${f.base} <small>${solved(f)}/${f.items.length}</small></button>`)}
      </nav>
      <section class="panel wl-task" aria-labelledby="wl-f-h">
        <h2 id="wl-f-h">${I.T(`The ${fam.base} family`, `La familia de ${fam.base}`)}</h2>
        <ul class="wl-forms">
          ${fam.forms.map((f) => html`<li><b>${f.w}</b>${level !== "C" ? html` <small>${f.pos}</small>` : ""} ${gloss(I, level, f.es)} ${speakBtn(I, f.w)}</li>`)}
        </ul>
        <p>
          ${I.T("Choose the form that fits each blank.", "Elige la forma que encaja en cada espacio.")}
        </p>
        <ol class="wl-fam-items">
          ${fam.items.map((it, i) => {
            const done = got.includes(i);
            const tried = tries[i];
            return html`<li class="wl-fam-item ${done ? "is-done" : ""}">
              <p>
                ${it.s.replace("___", "_____")} ${gloss(I, level, it.se.replace("___", "_____"))}
              </p>
              <div
                class="wl-choices"
                role="group"
                aria-label="${I.S(`Sentence ${i + 1}`, `Oración ${i + 1}`)}"
              >
                ${fam.forms.map((f) => html`<button type="button" class="wl-choice ${done && f.w === it.a ? "is-right" : tried === f.w && f.w !== it.a ? "is-try" : ""}" data-wl-famans="${i}|${f.w}" ${done ? "disabled" : ""}>${f.w}</button>`)}
              </div>
              ${tried && !done ? feedback(false, I.T(`${tried} is a ${fam.forms.find((f) => f.w === tried)?.pos}. Check which kind of word the blank needs.`, `${tried} es ${fam.forms.find((f) => f.w === tried)?.pos}. Revisa qué clase de palabra necesita el espacio.`)) : ""}
              ${done ? feedback(true, html`<b>${it.a}</b>`) : ""}
            </li>`;
          })}
        </ol>
        ${got.length === fam.items.length ? feedback(true, I.T("Family complete.", "Familia completa.")) : ""}
      </section>`;
  },
  click(e, ctx, I, st, ui) {
    const t = e.target;
    const list = bandOnly(FAMILIES, ctx.band);
    const sel = t.closest("[data-wl-fam]");
    if (sel) return ((ui.famId = sel.dataset.wlFam), (ui.famTry = {}), ctx.rerender(), true);
    const ans = t.closest("[data-wl-famans]");
    if (!ans) return false;
    const fam =
      list.find((f) => f.id === ui.famId) ||
      list.find((f) => (st.fam.done[f.id] || []).length < f.items.length) ||
      list[0];
    const [i, w] = ans.dataset.wlFamans.split("|");
    const item = fam.items[Number(i)];
    ui.famTry = { ...(ui.famTry || {}), [i]: w };
    if (w === item.a) {
      const got = (st.fam.done[fam.id] ||= []);
      if (!got.includes(Number(i))) got.push(Number(i));
      if (got.length === fam.items.length) {
        const total = Object.values(st.fam.done).filter((g) => g.length >= 3).length;
        wlEvidence(
          st,
          ctx,
          `family-${fam.id}`,
          { items: fam.items.length, families: total },
          {},
          "Explain",
        );
      }
      wlSave(st);
    }
    return (ctx.rerender(), true);
  },
};

// ── Word detective ────────────────────────────────────────────────────────────
export const detective = {
  render(ctx, I, st, ui) {
    const level = levelOf(st);
    const list = bandOnly(DETECTIVE, ctx.band);
    const c =
      list.find((x) => x.id === ui.detId) || list.find((x) => !(st.det.done[x.id]?.m >= 0)) || list[0];
    if (!c)
      return html`<p class="panel">
        ${I.T("No cases for this band.", "No hay casos para este grupo.")}
      </p>`;
    ui.detId = c.id;
    const d = (ui.det =
      ui.det && ui.det.id === c.id ? ui.det : { id: c.id, picked: [], clue: null, ans: null });
    const [tEn, tEs, tHow] = CLUE_TYPES[c.type];
    const solved = list.filter((x) => st.det.done[x.id]?.m >= 0).length;
    const clueOk = d.clue?.ok;
    return html`<section class="panel wl-task" aria-labelledby="wl-d-h">
      <p class="fine">
        ${I.T(`Case ${list.indexOf(c) + 1} of ${list.length}. ${solved} solved.`, `Caso ${list.indexOf(c) + 1} de ${list.length}. ${solved} resueltos.`)}
      </p>
      <h2 id="wl-d-h">
        ${I.T("Find the clue, then solve the word.", "Encuentra la pista y resuelve la palabra.")}
      </h2>
      <p class="wl-bigword">
        ${I.T("Mystery word:", "Palabra misteriosa:")} <b>${c.word}</b> ${speakBtn(I, c.word)}
      </p>
      ${level === "A" ? html`<p class="fine">${icon("bulb")} ${I.T(`Look for a ${tEn.toLowerCase()}: ${tHow}`, `Busca una ${tEs.toLowerCase()}: la lectura te dirá el significado.`)}</p>` : ""}
      <p class="fine" id="wl-d-help">
        ${I.T("Press the parts of the passage that hold the clue. Press again to take one back.", "Pulsa las partes del texto que tienen la pista. Púlsala otra vez para quitarla.")}
      </p>
      <div class="wl-chunks" role="group" aria-describedby="wl-d-help">
        ${c.chunks.map((ch, i) => html`<button type="button" class="wl-chunk ${d.picked.includes(i) ? "is-picked" : ""} ${d.clue ? (c.clue.includes(i) ? "is-clue" : "") : ""}" data-wl-chunk="${i}" aria-pressed="${String(d.picked.includes(i))}" ${d.clue?.ok ? "disabled" : ""}>${ch}</button>`)}
      </div>
      ${
        !d.clue?.ok
          ? html`<div class="wl-actions">
              <button
                type="button"
                class="btn btn-primary"
                data-wl-clue-check
                ${d.picked.length ? "" : "disabled"}
              >
                ${I.T("Check my clue", "Revisar mi pista")}
              </button>
            </div>`
          : ""
      }
      ${d.clue && !clueOk ? feedback(false, d.clue.extra.length && !d.clue.hit.length ? I.T("Those parts do not tell you what the word means. Look again for words that explain it.", "Esas partes no dicen qué significa la palabra. Busca otra vez palabras que la expliquen.") : I.T("You found part of it. Check for more, or for a part you do not need.", "Encontraste una parte. Busca más o quita una parte que no hace falta.")) : ""}
      ${
        clueOk
          ? html`${feedback(true, html`${I.T(tEn, tEs)}: ${I.T(tHow, "El texto da la información para entender la palabra.")}`)}
              <h3>${I.T(`What does ${c.word} mean?`, `¿Qué significa ${c.word}?`)}</h3>
              <div class="wl-choices" role="group">
                ${c.opts.map((o, i) => html`<button type="button" class="wl-choice ${d.ans === i ? (i === c.ans ? "is-right" : "is-try") : ""}" data-wl-detans="${i}" aria-pressed="${String(d.ans === i)}">${o}${gloss(I, level, c.optsEs[i])}</button>`)}
              </div>
              ${d.ans != null ? (d.ans === c.ans ? html`${feedback(true, I.T(c.why, c.whyEs))}<button type="button" class="btn btn-primary" data-wl-detnext>${I.T("Next case", "Siguiente caso")} ${icon("arrow-right")}</button>` : feedback(false, I.T("Not that meaning. Reread the clue you marked.", "Ese no es el significado. Vuelve a leer la pista que marcaste."))) : ""}`
          : ""
      }
    </section>`;
  },
  click(e, ctx, I, st, ui) {
    const t = e.target;
    const list = bandOnly(DETECTIVE, ctx.band);
    const c =
      list.find((x) => x.id === ui.detId) || list.find((x) => !(st.det.done[x.id]?.m >= 0)) || list[0];
    const d = ui.det;
    if (!c || !d) return false;
    const chunk = t.closest("[data-wl-chunk]");
    if (chunk && !d.clue?.ok) {
      const i = Number(chunk.dataset.wlChunk);
      d.picked = d.picked.includes(i) ? d.picked.filter((x) => x !== i) : [...d.picked, i].sort();
      d.clue = null;
      return (ctx.rerender(), true);
    }
    if (t.closest("[data-wl-clue-check]")) {
      d.clue = checkClue(c, d.picked);
      st.det.done[c.id] ||= { c: d.clue.ok ? 1 : 0, m: -1 };
      wlSave(st);
      return (ctx.rerender(), true);
    }
    const ans = t.closest("[data-wl-detans]");
    if (ans) {
      d.ans = Number(ans.dataset.wlDetans);
      const rec = (st.det.done[c.id] ||= { c: 1, m: -1 });
      if (rec.m === -1) rec.m = d.ans === c.ans ? 1 : 0;
      if (d.ans === c.ans) {
        const all = Object.values(st.det.done).filter((r) => r.m >= 0);
        if (all.length % 4 === 0)
          wlEvidence(
            st,
            ctx,
            `detective-${all.length / 4}`,
            {
              cases: 4,
              clueFirst: all.slice(-4).filter((r) => r.c).length,
              meaningFirst: all.slice(-4).filter((r) => r.m === 1).length,
            },
            {},
            "Explain",
          );
      }
      wlSave(st);
      return (ctx.rerender(), true);
    }
    if (t.closest("[data-wl-detnext]")) {
      ui.detId = list[(list.indexOf(c) + 1) % list.length].id;
      ui.det = null;
      return (ctx.rerender(), true);
    }
    return false;
  },
};

// ── Frayer cards ──────────────────────────────────────────────────────────────
const BOXES = [
  [
    "def",
    "Definition in my own words",
    "Definición con mis propias palabras",
    "It means…",
    "Significa…",
  ],
  ["chars", "Characteristics", "Características", "It always… / It can…", "Siempre… / Puede…"],
  ["ex", "Examples", "Ejemplos", "For example…", "Por ejemplo…"],
  ["non", "Non-examples", "No ejemplos", "It is not…", "No es…"],
];
export const frayer = {
  render(ctx, I, st, ui, wordId) {
    const level = levelOf(st);
    const words = bandWords(ctx.band);
    const w = words.find((x) => x.id === wordId) || null;
    if (!w) {
      const mine = Object.keys(st.garden)
        .map((id) => words.find((x) => x.id === id))
        .filter(Boolean);
      const sugg = (mine.length ? mine : words.filter((x) => x.t === 3)).slice(0, 12);
      return html`<section class="panel">
        <h2>
          ${I.T("Pick a word for your Frayer card", "Elige una palabra para tu tarjeta Frayer")}
        </h2>
        <p>
          ${I.T("A Frayer card shows what you know about a word in four boxes. Pick a word from your garden, or choose one in Explore.", "Una tarjeta Frayer muestra lo que sabes de una palabra en cuatro cuadros. Elige una palabra de tu jardín o escoge una en Explorar.")}
        </p>
        <div class="wl-chips">
          ${sugg.map((x) => html`<a class="wl-chip-link" href="${wlHref(`frayer/${x.id}`, ctx.band)}">${x.w}${st.frayer[x.id] && frayerStatus(st.frayer[x.id], x).done ? html` ${icon("check")}` : ""}</a>`)}
        </div>
        <a class="btn" href="${wlHref("explore", ctx.band)}"
          >${I.T("Find more words", "Buscar más palabras")}</a
        >
      </section>`;
    }
    const rec = st.frayer[w.id] || {};
    const status = frayerStatus(rec, w);
    const model =
      FRAYER_MODELS.find((m) => m.w !== w.w && (m.b === ctx.band || m.b === "both")) ||
      FRAYER_MODELS[0];
    const showModel = level === "A" || ui.frayModel;
    return html`<section class="panel wl-frayer" aria-labelledby="wl-fr-h">
      <h2 id="wl-fr-h">
        ${I.T("Frayer card:", "Tarjeta Frayer:")} <b>${w.w}</b> ${speakBtn(I, w.w)}
      </h2>
      <p class="wl-def fine">
        ${I.T("Say it in your own words. Do not use the word itself in your definition.", "Dilo con tus palabras. No uses la palabra misma en tu definición.")}
      </p>
      <div class="wl-frayer-grid">
        ${BOXES.map(
          ([k, en, es, phEn, phEs]) =>
            html`<div class="wl-fbox ${status.parts[k] ? "is-ok" : ""}">
              <label for="wl-f-${k}">${I.T(en, es)}</label>
              <textarea
                id="wl-f-${k}"
                data-wl-frayer="${k}"
                rows="3"
                placeholder="${level === "C" ? "" : I.S(phEn, phEs)}"
                aria-describedby="wl-fr-h"
              >
${rec[k] || ""}</textarea>
            </div>`,
        )}
        <div class="wl-fcenter" aria-hidden="true"><b>${w.w}</b></div>
      </div>
      ${status.usesWord ? feedback(false, I.T(`Try your definition without the word “${w.w}”.`, `Intenta tu definición sin la palabra «${w.w}».`)) : ""}
      ${status.done ? feedback(true, I.T("Your Frayer card is complete. It is saved on this device.", "Tu tarjeta Frayer está completa. Está guardada en este dispositivo.")) : ""}
      <div class="wl-actions no-print">
        ${showModel ? "" : html`<button type="button" class="btn" data-wl-frmodel>${icon("bulb")} ${I.T("See a model card", "Ver una tarjeta modelo")}</button>`}
        <button
          type="button"
          class="btn"
          data-wl-collect="${w.id}"
          aria-pressed="${String(Boolean(st.garden[w.id]))}"
        >
          ${icon("bookmark")}
          ${st.garden[w.id] ? I.T("In my garden", "En mi jardín") : I.T("Plant in my garden", "Plantar en mi jardín")}
        </button>
        <button type="button" class="btn" data-print>
          ${icon("print")} ${I.T("Print my card", "Imprimir mi tarjeta")}
        </button>
      </div>
      ${
        showModel
          ? html`<aside class="wl-model no-print">
              <h3>
                ${I.T(`Model card for another word: ${model.w}`, `Tarjeta modelo de otra palabra: ${model.w}`)}
              </h3>
              <p><b>${I.T("Definition", "Definición")}:</b> ${I.T(model.def, model.defEs)}</p>
              <p><b>${I.T("Characteristics", "Características")}:</b> ${model.chars.join("; ")}</p>
              <p><b>${I.T("Examples", "Ejemplos")}:</b> ${model.ex.join("; ")}</p>
              <p><b>${I.T("Non-examples", "No ejemplos")}:</b> ${model.non.join("; ")}</p>
            </aside>`
          : ""
      }
    </section>`;
  },
  click(e, ctx, I, st, ui) {
    if (e.target.closest("[data-wl-frmodel]")) {
      ui.frayModel = true;
      return (ctx.rerender(), true);
    }
    return false;
  },
  /** Saves text as it is typed, without redrawing (so the caret stays put). */
  input(e, ctx, st, wordId) {
    const box = e.target.closest?.("[data-wl-frayer]");
    if (!box || !wordId) return false;
    (st.frayer[wordId] ||= {})[box.dataset.wlFrayer] = box.value.slice(0, 600);
    wlSave(st);
    return true;
  },
  /** On leaving a box: redraw the check marks and record the card once it is complete. */
  change(e, ctx, st, wordId) {
    if (!this.input(e, ctx, st, wordId)) return false;
    const w = bandWords(ctx.band).find((x) => x.id === wordId);
    if (w && frayerStatus(st.frayer[wordId], w).done) {
      collectOnce(st, wordId);
      const done = Object.entries(st.frayer).filter(
        ([id, r]) =>
          frayerStatus(
            r,
            bandWords(ctx.band).find((x) => x.id === id),
          ).done,
      ).length;
      wlEvidence(st, ctx, `frayer-${wordId}`, { cards: done }, {}, "Explain");
      wlSave(st);
    }
    renderAfterChange(ctx);
    return true;
  },
};
export { showEs };
