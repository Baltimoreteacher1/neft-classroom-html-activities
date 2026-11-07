// Mentor Text Explorer (/mentor): authors' craft. Tap the writer's moves in a short mentor text, read why each works,
// collect moves into a Writer's Toolbox, then try a move in your own sentence (/mentor/try/<move>).
// Practice checks run on this device and look for words and patterns; they cannot judge meaning.
import { setComponentsI18n } from "../components.js";
import {
  GENRES,
  MOVES,
  TEXTS,
  TRY,
  findMove,
  findText,
  movesIn,
  parseMentor,
  textsFor,
} from "../content/craft-mentor.js";
import { i18nFor } from "../i18n.js";
import { checkMove, loadCraft, recordCraft, saveCraft } from "../lang/craft.js";
import { seededShuffle } from "../lang/craft-sentence.js";
import { ART as ARTS_BASE, announce, html, icon, raw } from "../util.js";
import {
  ART,
  cardHTML,
  craftCrumbs,
  craftHref,
  heroHTML,
  levelClick,
  levelPickerHTML,
  practiceNote,
  progressBar,
} from "./craft-ui.js";

const USE = {
  story: "Narrate",
  describe: "Narrate",
  inform: "Inform",
  explain: "Explain",
  argue: "Argue",
  howto: "Explain",
  letter: "Argue",
  bio: "Inform",
};
let current = null; // { kind: "text"|"toolbox"|"try", id }
let ui = { active: null, sent: null, wrong: "", genre: "all", result: null };
let lastCtx = null;

const textState = (state, id) => ({
  found: [],
  wrong: 0,
  done: false,
  ...(state.mentor.texts[id] || {}),
});
const editText = (id, fn) => {
  const state = loadCraft();
  const s = textState(state, id);
  fn(s, state);
  state.mentor.texts[id] = s;
  saveCraft(state);
  return s;
};
const moveName = (I, id) => I.T(findMove(id).name, findMove(id).es);

function hubHTML(ctx, I) {
  const state = loadCraft();
  const texts = textsFor(ctx.band).filter((t) => ui.genre === "all" || t.genre === ui.genre);
  const collected = new Set(state.mentor.toolbox.map((x) => x.move));
  const genres = [...new Set(textsFor(ctx.band).map((t) => t.genre))];
  return html`${craftCrumbs(I, "mentor", ctx.band)}
    <div class="cs-page cs-mentor">
      ${heroHTML(I, "mentor", {
        eyebrow: I.T(
          `Grades ${ctx.band.replace("-", "–")} · reading like a writer`,
          `Grados ${ctx.band.replace("-", "–")} · leer como escritor`,
        ),
        title: I.T("Mentor Text Explorer", "Explorador de textos modelo"),
        lead: I.T(
          "Read short texts the way authors do. Tap a highlighted move, see why it works, keep it in your Writer's Toolbox, and then try it in your own sentence.",
          "Lee textos cortos como lo hacen los autores. Toca un recurso resaltado, mira por qué funciona, guárdalo en tu caja de herramientas del escritor y luego pruébalo en tu propia oración.",
        ),
        art: ART.mentor(
          I.S(
            "An open book with highlighted lines, a magnifying glass and a margin note",
            "Un libro abierto con líneas resaltadas, una lupa y una nota al margen",
          ),
        ),
      })}
      ${levelPickerHTML(I, state.level, "mentor")}
      <section class="panel cs-toolbox-cta" aria-labelledby="mt-tb">
        <h2 id="mt-tb">
          ${icon("tools")} ${I.T("My Writer's Toolbox", "Mi caja de herramientas del escritor")}
        </h2>
        <p>
          ${I.T(`${collected.size} of ${MOVES.length} kinds of move collected. ${state.mentor.toolbox.length} examples in all.`, `${collected.size} de ${MOVES.length} tipos de recurso reunidos. ${state.mentor.toolbox.length} ejemplos en total.`)}
        </p>
        ${progressBar(collected.size, MOVES.length, I.S(`${collected.size} of ${MOVES.length} moves`, `${collected.size} de ${MOVES.length} recursos`))}
        <p class="row-actions">
          <a class="btn btn-primary" href="${craftHref("mentor", ctx.band, "toolbox")}"
            >${I.T("Open my toolbox and try moves", "Abrir mi caja y probar recursos")}</a
          >
        </p>
      </section>
      <section class="task-group" aria-labelledby="mt-texts">
        <header>
          <h2 id="mt-texts">
            ${icon("reading")}
            ${I.T(`${textsFor(ctx.band).length} mentor texts`, `${textsFor(ctx.band).length} textos modelo`)}
          </h2>
        </header>
        <div
          class="cs-genres"
          role="group"
          aria-label="${I.S("Filter by kind of writing", "Filtrar por tipo de escritura")}"
        >
          <button
            type="button"
            class="cat-chip"
            data-mt-genre="all"
            aria-pressed="${ui.genre === "all"}"
          >
            ${I.T("All", "Todos")}
          </button>
          ${genres.map((g) => html`<button type="button" class="cat-chip" data-mt-genre="${g}" aria-pressed="${ui.genre === g}">${I.T(GENRES.find((x) => x.id === g).name, GENRES.find((x) => x.id === g).es)}</button>`)}
        </div>
        <div class="task-grid">
          ${texts.map((t) => {
            const s = textState(state, t.id);
            const total = parseMentor(t.text, t.notes).filter((x) => x.move).length;
            const g = GENRES.find((x) => x.id === t.genre);
            return cardHTML({
              href: craftHref("mentor", ctx.band, t.id),
              title: I.T(t.title, t.titleEs),
              ico: "reading",
              kind: I.T(g.name, g.es),
              desc: I.T(
                `${total} moves to find: ${movesIn(t)
                  .map((m) => findMove(m).name.toLowerCase())
                  .join(", ")}.`,
                `${total} recursos por encontrar: ${movesIn(t)
                  .map((m) => findMove(m).es.toLowerCase())
                  .join(", ")}.`,
              ),
              done: s.done
                ? I.S("Found all", "Todos hallados")
                : s.found.length
                  ? I.S(`${s.found.length} of ${total}`, `${s.found.length} de ${total}`)
                  : "",
            });
          })}
        </div>
      </section>
      ${practiceNote(I)}
    </div>`;
}

/** The mentor text with moves as buttons (levels A and B) or sentences as buttons (level C). */
function bodyHTML(I, segs, st, level) {
  const found = new Set(st.found);
  const mark = (seg) => {
    const on = found.has(seg.i);
    return html`<mark class="cs-mv mv-${seg.move} ${on ? "is-found" : ""}"
      >${seg.t}${on ? html`<span class="cs-mvname"> (${moveName(I, seg.move)})</span>` : ""}</mark
    >`;
  };
  if (level === "C") {
    const bySent = [];
    for (const seg of segs) (bySent[seg.sent] ||= []).push(seg);
    return html`<p class="cs-text cs-text-c">
      ${bySent.map((parts, n) => html`<button type="button" class="cs-sent ${ui.sent === n ? "is-open" : ""}" data-mt-sent="${n}" aria-pressed="${ui.sent === n}">${parts.map((seg) => (seg.move && found.has(seg.i) ? mark(seg) : seg.t))}</button> `)}
    </p>`;
  }
  return html`<p class="cs-text">
    ${segs.map((seg) =>
      seg.move
        ? html`<button
            type="button"
            class="cs-mv mv-${seg.move} ${found.has(seg.i) ? "is-found" : ""} ${ui.active === seg.i ? "is-open" : ""}"
            data-mt-move="${seg.i}"
            aria-pressed="${ui.active === seg.i}"
          >
            ${seg.t}${level === "A" || found.has(seg.i) ? html`<span class="cs-mvname"> (${moveName(I, seg.move)})</span>` : ""}
          </button>`
        : seg.t,
    )}
  </p>`;
}

function noteHTML(I, text, seg, ctx, state) {
  const mv = findMove(seg.move);
  const have = state.mentor.toolbox.some((x) => x.textId === text.id && x.i === seg.i);
  return html`<div
    class="cs-note-card mv-${seg.move}"
    role="region"
    aria-label="${I.S("Margin note", "Nota al margen")}"
  >
    <p class="cs-note-move">
      ${icon(mv.icon)} <strong>${moveName(I, seg.move)}</strong> <span lang="en">“${seg.t}”</span>
    </p>
    <p>${I.TO({ en: seg.note[0], es: seg.note[1] })}</p>
    <p class="fine">${I.T(mv.how, mv.howEs)}</p>
    <button
      type="button"
      class="btn ${have ? "" : "btn-primary"}"
      data-mt-collect="${seg.i}"
      ${have ? raw("disabled") : ""}
    >
      ${icon(have ? "check" : "bookmark")}
      ${have ? I.T("In my toolbox", "En mi caja") : I.T("Collect this move", "Guardar este recurso")}
    </button>
  </div>`;
}

function quizHTML(I, text, seg, sentMode) {
  const ids = sentMode
    ? MOVES.map((m) => m.id)
    : seededShuffle(
        [
          seg.move,
          ...seededShuffle(
            MOVES.map((m) => m.id).filter((m) => m !== seg.move),
            `${text.id}:${seg.i}`,
          ).slice(0, 2),
        ],
        `${text.id}:${seg.i}:q`,
      );
  return html`<div
    class="cs-quiz"
    role="group"
    aria-label="${I.S("Which move is it?", "¿Qué recurso es?")}"
  >
    <p>
      <strong
        >${sentMode ? I.T("Which move do you see in this sentence?", "¿Qué recurso ves en esta oración?") : I.T("Which move is this phrase?", "¿Qué recurso es esta frase?")}</strong
      >
    </p>
    <div class="cs-genres">
      ${ids.map((id) => html`<button type="button" class="cat-chip mv-${id}" data-mt-answer="${id}">${moveName(I, id)}</button>`)}
    </div>
    ${ui.wrong ? html`<p class="cs-next" role="status">${icon("arrow-right")} ${I.T("Not that one. Look at what the words do for the reader, then try again.", "Esa no. Fíjate en lo que hacen las palabras por el lector y vuelve a intentar.")}</p>` : ""}
  </div>`;
}

function textHTML(ctx, I, text) {
  const state = loadCraft();
  const level = state.level;
  const st = textState(state, text.id);
  const segs = parseMentor(text.text, text.notes);
  const markers = segs.filter((s) => s.move);
  const g = GENRES.find((x) => x.id === text.genre);
  let panel = "";
  if (level === "C") {
    if (ui.sent != null) {
      const here = markers.filter((m) => m.sent === ui.sent);
      const open = here.filter((m) => !st.found.includes(m.i));
      panel = html`${here.filter((m) => st.found.includes(m.i)).map((m) => noteHTML(I, text, m, ctx, state))}${open.length ? quizHTML(I, text, open[0], true) : here.length ? "" : html`<p class="fine">${I.T("No move was marked in this sentence. Try another one.", "No se marcó ningún recurso en esta oración. Prueba con otra.")}</p>`}`;
    } else
      panel = html`<p class="fine">
        ${I.T("Tap a sentence where you think the author uses a move.", "Toca una oración donde creas que el autor usa un recurso.")}
      </p>`;
  } else if (ui.active != null) {
    const seg = markers.find((m) => m.i === ui.active);
    panel =
      level === "B" && !st.found.includes(seg.i)
        ? quizHTML(I, text, seg, false)
        : noteHTML(I, text, seg, ctx, state);
  } else
    panel = html`<p class="fine">
      ${level === "A" ? I.T("Tap any highlighted phrase to read why it works.", "Toca una frase resaltada para leer por qué funciona.") : I.T("Tap a highlighted phrase, name the move, and the margin note opens.", "Toca una frase resaltada, nombra el recurso y se abre la nota al margen.")}
    </p>`;
  const all = st.found.length >= markers.length;
  return html`${craftCrumbs(I, "mentor", ctx.band, I.S(text.title, text.titleEs))}
    <article class="cs-page cs-mentor activity d-reading">
      <header class="act-head">
        <p class="act-context">
          ${icon("reading")} ${I.T(g.name, g.es)} · ${I.T("Mentor text", "Texto modelo")}
        </p>
        <h1 tabindex="-1">${I.T(text.title, text.titleEs)}</h1>
        <p class="fine">
          ${I.T(`${st.found.length} of ${markers.length} moves found.`, `${st.found.length} de ${markers.length} recursos hallados.`)}
          ${progressBar(st.found.length, markers.length, I.S("Moves found", "Recursos hallados"))}
        </p>
      </header>
      ${levelPickerHTML(I, level, "mentor")}
      <div class="cs-read">
        <section
          class="panel cs-paper"
          aria-label="${I.S("Mentor text", "Texto modelo")}"
          lang="en"
        >
          ${bodyHTML(I, segs, st, level)}
          <p class="no-print">
            <button type="button" class="ghost small" data-say="${text.plain}">
              ${icon("volume")} ${I.T("Hear the text", "Escuchar el texto")}
            </button>
          </p>
        </section>
        <aside class="panel cs-margin" aria-live="polite">${panel}</aside>
      </div>
      ${
        all
          ? html`<section class="panel cs-win" role="status">
              <h2>${I.T("You found every move.", "Encontraste todos los recursos.")}</h2>
              <p>
                ${I.T("Now try these moves in your own sentences.", "Ahora prueba estos recursos en tus propias oraciones.")}
              </p>
              <p class="row-actions">
                <a class="btn btn-primary" href="${craftHref("mentor", ctx.band, "toolbox")}"
                  >${I.T("Open my toolbox", "Abrir mi caja")}</a
                >
              </p>
            </section>`
          : ""
      }
      ${practiceNote(I)}
    </article>`;
}

function toolboxHTML(ctx, I) {
  const state = loadCraft();
  const box = state.mentor.toolbox;
  return html`${craftCrumbs(I, "mentor", ctx.band, I.S("Writer's Toolbox", "Caja del escritor"))}
    <article class="cs-page cs-mentor">
      <header class="act-head">
        <h1 tabindex="-1">
          ${icon("tools")} ${I.T("My Writer's Toolbox", "Mi caja de herramientas del escritor")}
        </h1>
        <p class="lead">
          ${I.T("Every move you collect is here with the author's words. Try a move in your own sentence, or print this page.", "Cada recurso que guardas está aquí con las palabras del autor. Prueba un recurso en tu propia oración o imprime esta página.")}
        </p>
      </header>
      <div class="cs-moves">
        ${MOVES.map((m) => {
          const mine = box.filter((x) => x.move === m.id);
          const done = TRY[m.id][ctx.band].filter((t) => state.mentor.tries[t.id]?.ok).length;
          return html`<section class="panel cs-move mv-${m.id}" aria-labelledby="mv-${m.id}">
            <h2 id="mv-${m.id}">${icon(m.icon)} ${I.T(m.name, m.es)}</h2>
            <p>${I.T(m.how, m.howEs)}</p>
            ${
              mine.length
                ? html`<ul class="cs-collected">
                    ${mine.map(
                      (x) =>
                        html`<li>
                          <span lang="en">“${x.text}”</span>
                          <small
                            >${I.T("from", "de")}
                            <span lang="en">${findText(x.textId)?.title || ""}</span></small
                          >
                        </li>`,
                    )}
                  </ul>`
                : html`<p class="fine">
                    ${I.T("Nothing collected yet. Find this move in a mentor text.", "Aún no hay nada guardado. Encuentra este recurso en un texto modelo.")}
                  </p>`
            }
            <p class="row-actions no-print">
              <a class="btn" href="${craftHref("mentor", ctx.band, `try/${m.id}`)}"
                >${I.T("Try this move", "Probar este recurso")}</a
              >
              <span class="fine"
                >${I.T(`${done} of 2 tries done`, `${done} de 2 intentos hechos`)}</span
              >
            </p>
          </section>`;
        })}
      </div>
      <p class="row-actions no-print">
        <button type="button" class="btn" data-print>
          ${icon("print")} ${I.T("Print my toolbox", "Imprimir mi caja")}
        </button>
      </p>
      ${practiceNote(I)}
    </article>`;
}

function tryHTML(ctx, I, move) {
  const state = loadCraft();
  const level = state.level;
  const tasks = TRY[move.id][ctx.band];
  const idx = Math.min(ui.tryIndex?.[move.id] || 0, tasks.length - 1);
  const task = tasks[idx];
  const saved = state.mentor.tries[task.id] || {};
  const res = ui.result && ui.result.id === task.id ? ui.result.res : null;
  const examples = state.mentor.toolbox.filter((x) => x.move === move.id).slice(-2);
  return html`${craftCrumbs(I, "mentor", ctx.band, I.S(`Try: ${move.name}`, `Probar: ${move.es}`))}
    <article class="cs-page cs-mentor">
      <header class="act-head">
        <p class="act-context">
          ${icon(move.icon)} ${I.T("Try a writer's move", "Prueba un recurso del escritor")}
        </p>
        <h1 tabindex="-1">${I.T(move.name, move.es)}</h1>
        <p class="lead">${I.T(move.how, move.howEs)}</p>
      </header>
      ${levelPickerHTML(I, level, "mentor")}
      <section class="panel" aria-labelledby="mt-try">
        <h2 id="mt-try">
          ${I.T(`Try ${idx + 1} of ${tasks.length}`, `Intento ${idx + 1} de ${tasks.length}`)}:
          ${I.T(move.goal, move.goalEs)}
        </h2>
        ${level !== "C" && examples.length ? html`<p class="fine">${I.T("From your toolbox:", "De tu caja de herramientas:")} ${examples.map((x) => html`<q lang="en">${x.text}</q> `)}</p>` : ""}
        <p class="cs-prompt" lang="en">${task.prompt}</p>
        <label class="cs-field"
          ><span>${I.S("My sentence", "Mi oración")}</span
          ><textarea data-mt-field rows="3" lang="en" spellcheck="false" autocomplete="off">
${saved.text || ""}</textarea>
        </label>
        <p class="row-actions no-print">
          <button type="button" class="btn btn-primary" data-mt-check="${task.id}">
            ${icon("check")} ${I.T("Check my sentence", "Revisar mi oración")}
          </button>
          ${level !== "C" ? html`<button type="button" class="ghost" data-mt-model="${task.id}">${icon("bulb")} ${I.T("Show a model", "Mostrar un modelo")}</button>` : ""}
        </p>
        <div role="status" aria-live="polite" class="cs-feedback">
          ${res ? html`<p class="${res.ok ? "cs-win" : "cs-next"}">${icon(res.ok ? "check" : "arrow-right")} ${I.TO(res.ok ? res.got : res.tip)}</p>` : ""}
          ${ui.model === task.id ? html`<p class="cs-model" lang="en"><strong>${I.T("A model", "Un modelo")}:</strong> ${task.model}</p>` : ""}
        </div>
        <p class="fine">
          ${I.T("This check looks for words and patterns on your device. It cannot tell whether your sentence is good, so read it aloud or share it with a partner.", "Esta revisión busca palabras y patrones en tu dispositivo. No puede saber si tu oración es buena, así que léela en voz alta o compártela con un compañero.")}
        </p>
        <p class="row-actions no-print">
          ${idx > 0 ? html`<button type="button" class="ghost" data-mt-try-nav="${idx - 1}">${icon("arrow-left")} ${I.T("Previous", "Anterior")}</button>` : ""}
          ${idx < tasks.length - 1 ? html`<button type="button" class="ghost" data-mt-try-nav="${idx + 1}">${I.T("Next try", "Siguiente intento")} ${icon("arrow-right")}</button>` : html`<a class="btn" href="${craftHref("mentor", ctx.band, "toolbox")}">${I.T("Back to my toolbox", "Volver a mi caja")}</a>`}
        </p>
      </section>
      ${practiceNote(I)}
    </article>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  lastCtx = ctx;
  const id = ctx.route.id || "";
  const key = current ? `${current.kind}:${current.id}` : "";
  const text = id && id !== "toolbox" && id !== "try" ? findText(id) : null;
  const move = id === "try" ? findMove(ctx.route.sub) : null;
  current = text
    ? { kind: "text", id }
    : id === "toolbox"
      ? { kind: "toolbox", id }
      : move
        ? { kind: "try", id: move.id }
        : null;
  if (`${current?.kind}:${current?.id}` !== key)
    ui = { ...ui, active: null, sent: null, wrong: "", result: null, model: "" };
  if (!id)
    return {
      title: I.S("Mentor Text Explorer", "Explorador de textos modelo"),
      html: hubHTML(ctx, I),
    };
  if (id === "toolbox")
    return { title: I.S("Writer's Toolbox", "Caja del escritor"), html: toolboxHTML(ctx, I) };
  if (move)
    return { title: I.S(`Try: ${move.name}`, `Probar: ${move.es}`), html: tryHTML(ctx, I, move) };
  if (text && text.band === ctx.band)
    return { title: I.S(text.title, text.titleEs), html: textHTML(ctx, I, text) };
  return {
    title: I.S("Not found", "No se encontró"),
    html: html`${craftCrumbs(I, "mentor", ctx.band, I.S("Not found", "No se encontró"))}
      <section class="panel empty-state">
        <img src="${ARTS_BASE}/empty.svg" alt="" width="480" height="300" />
        <h1 tabindex="-1">
          ${I.T("We could not find that mentor text for this grade band.", "No encontramos ese texto modelo para esta banda de grados.")}
        </h1>
        <a class="btn" href="${craftHref("mentor", ctx.band)}"
          >${I.T("Mentor Text Explorer", "Explorador de textos modelo")}</a
        >
      </section>`,
  };
}

function markFound(ctx, text, seg, wasWrong) {
  const markers = parseMentor(text.text, text.notes).filter((m) => m.move);
  const level = loadCraft().level;
  const s = editText(text.id, (x) => {
    if (!x.found.includes(seg.i)) x.found.push(seg.i);
    if (wasWrong) x.wrong += 1;
  });
  if (s.found.length >= markers.length && !s.done) {
    recordCraft({
      src: "craft",
      task: `${text.id}/find`,
      band: ctx.band,
      domain: "Reading",
      use: USE[text.genre],
      level,
      m: { tool: "mentor", stepId: "find", ok: 1, found: markers.length, wrong: s.wrong },
    });
    editText(text.id, (x) => {
      x.done = true;
    });
  }
}

export function onClick(e, ctx) {
  if (levelClick(e, ctx)) return true;
  const hit = (sel) => e.target.closest?.(sel);
  let b;
  if ((b = hit("[data-mt-genre]"))) {
    ui.genre = b.dataset.mtGenre;
    ctx.rerender();
    return true;
  }
  if (!current) return false;
  const I = i18nFor(ctx);
  if (current.kind === "text") {
    const text = findText(current.id);
    const markers = parseMentor(text.text, text.notes).filter((m) => m.move);
    if ((b = hit("[data-mt-move]"))) {
      ui.active = Number(b.dataset.mtMove);
      ui.wrong = "";
      const level = loadCraft().level;
      if (level === "A")
        markFound(
          ctx,
          text,
          markers.find((m) => m.i === ui.active),
          false,
        );
      ctx.rerender();
      return true;
    }
    if ((b = hit("[data-mt-sent]"))) {
      ui.sent = Number(b.dataset.mtSent);
      ui.wrong = "";
      ctx.rerender();
      return true;
    }
    if ((b = hit("[data-mt-answer]"))) {
      const level = loadCraft().level;
      const st = textState(loadCraft(), text.id);
      const pool =
        level === "C"
          ? markers.filter((m) => m.sent === ui.sent && !st.found.includes(m.i))
          : markers.filter((m) => m.i === ui.active);
      const seg = pool.find((m) => m.move === b.dataset.mtAnswer);
      if (seg) {
        ui.wrong = "";
        markFound(ctx, text, seg, false);
        if (level !== "C") ui.active = seg.i;
        announce(
          I.S("Correct. The margin note is open.", "Correcto. La nota al margen está abierta."),
        );
      } else {
        ui.wrong = b.dataset.mtAnswer;
        editText(text.id, (x) => {
          x.wrong += 1;
        });
      }
      ctx.rerender();
      return true;
    }
    if ((b = hit("[data-mt-collect]"))) {
      const seg = markers.find((m) => m.i === Number(b.dataset.mtCollect));
      const state = loadCraft();
      if (!state.mentor.toolbox.some((x) => x.textId === text.id && x.i === seg.i))
        state.mentor.toolbox.push({ move: seg.move, text: seg.t, textId: text.id, i: seg.i });
      saveCraft(state);
      announce(
        I.S("Saved to your Writer's Toolbox.", "Guardado en tu caja de herramientas del escritor."),
      );
      ctx.rerender();
      return true;
    }
  }
  if (current.kind === "try") {
    const move = findMove(current.id);
    const tasks = TRY[move.id][ctx.band];
    if ((b = hit("[data-mt-try-nav]"))) {
      ui.tryIndex = { ...(ui.tryIndex || {}), [move.id]: Number(b.dataset.mtTryNav) };
      ui.result = null;
      ui.model = "";
      ctx.rerender();
      return true;
    }
    if ((b = hit("[data-mt-model]"))) {
      ui.model = b.dataset.mtModel;
      const state = loadCraft();
      state.mentor.tries[ui.model] = { ...(state.mentor.tries[ui.model] || {}), model: true };
      saveCraft(state);
      ctx.rerender();
      return true;
    }
    if ((b = hit("[data-mt-check]"))) {
      const task = tasks.find((t) => t.id === b.dataset.mtCheck);
      const state = loadCraft();
      const prev = state.mentor.tries[task.id] || {};
      const text = (document.querySelector("[data-mt-field]")?.value ?? prev.text ?? "").trim();
      const res = checkMove(move.id, text, task);
      state.mentor.tries[task.id] = {
        ...prev,
        text,
        ok: Boolean(prev.ok || res.ok),
        checks: (prev.checks || 0) + 1,
      };
      saveCraft(state);
      ui.result = { id: task.id, res };
      if (text)
        recordCraft({
          src: "craft",
          task: task.id,
          band: ctx.band,
          domain: "Writing",
          use: "Inform",
          level: state.level,
          supportUsed: Boolean(prev.model),
          kind: prev.checks ? "revision" : "first",
          m: { tool: "mentor", stepId: "try", move: move.id, ok: res.ok ? 1 : 0 },
        });
      ctx.rerender();
      return true;
    }
  }
  return false;
}

export function onInput(e) {
  if (!current || current.kind !== "try" || !e.target?.matches?.("[data-mt-field]")) return;
  const task = TRY[current.id][lastCtx?.band]?.[Math.min(ui.tryIndex?.[current.id] || 0, 1)];
  if (!task) return;
  const state = loadCraft();
  state.mentor.tries[task.id] = { ...(state.mentor.tries[task.id] || {}), text: e.target.value };
  saveCraft(state);
}

export function unmount() {
  current = null;
}
