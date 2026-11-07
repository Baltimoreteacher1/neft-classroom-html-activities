// Word Lab (/wordlab): academic vocabulary and morphology in seven activities, with a Word Garden for spaced review.
// Routes: /wordlab (hub), /wordlab/<explore|build|cognates|families|detective|frayer|garden>[/<word id>].
// Everything runs on this device. Nothing is timed and nothing is scored; evidence goes to the shared ledger as counts.
import { setComponentsI18n } from "../components.js";
import {
  MODES,
  SUBJECTS,
  STAGES,
  STAGE_COPY,
  dueWords,
  gardenInfo,
  reviewQuestion,
  reviewWord,
  searchWords,
  dropWord,
} from "../lang/wordlab.js";
import { dayNumber } from "../lang/ledger.js";
import { i18nFor } from "../i18n.js";
import { announce, html, icon, raw } from "../util.js";
import {
  renderAfterChange,
  LEVELS,
  levelOf,
  levelPickerHTML,
  modeNavHTML,
  speakBtn,
  studioCrumbs,
  studioHero,
  useDrag,
} from "./studio-kit.js";
import {
  WORDS,
  bandWords,
  collectOnce,
  gloss,
  wlEvidence,
  wlHref,
  wlSave,
  wlState,
  wordCardHTML,
} from "./wordlab-common.js";
import { build, cognates, detective, families, frayer } from "./wordlab-play.js";
import { heroArt } from "./studio-art.js";

const ACTS = {
  build: {
    ico: "construction",
    en: "Morpheme Builder",
    es: "Constructor de morfemas",
    dEn: "Snap prefixes, roots and suffixes together and watch the meaning blend.",
    dEs: "Une prefijos, raíces y sufijos y mira cómo se mezcla el significado.",
    mod: build,
  },
  cognates: {
    ico: "language",
    en: "Cognate Detector",
    es: "Detector de cognados",
    dEn: "Spot Spanish twins and watch out for false friends.",
    dEs: "Descubre las gemelas en español y cuidado con los falsos amigos.",
    mod: cognates,
  },
  families: {
    ico: "list",
    en: "Word Families",
    es: "Familias de palabras",
    dEn: "Choose the right form of a word for each sentence.",
    dEs: "Elige la forma correcta de la palabra para cada oración.",
    mod: families,
  },
  detective: {
    ico: "detective",
    en: "Word Detective",
    es: "Detective de palabras",
    dEn: "Find the clue in the passage and solve a mystery word.",
    dEs: "Encuentra la pista en el texto y resuelve una palabra misteriosa.",
    mod: detective,
  },
  frayer: {
    ico: "writing",
    en: "Frayer Cards",
    es: "Tarjetas Frayer",
    dEn: "Fill four boxes to show what you know about a word.",
    dEs: "Llena cuatro cuadros para mostrar lo que sabes de una palabra.",
    mod: frayer,
  },
  garden: {
    ico: "growth",
    en: "My Word Garden",
    es: "Mi jardín de palabras",
    dEn: "Grow the words you collect with short reviews on spaced days.",
    dEs: "Haz crecer las palabras que coleccionas con repasos cortos en días espaciados.",
  },
  explore: {
    ico: "search",
    en: "Explore Words",
    es: "Explorar palabras",
    dEn: "Browse and search words for reading, math, science and social studies.",
    dEs: "Mira y busca palabras de lectura, matemáticas, ciencias y estudios sociales.",
  },
};
const FILTER_ATTR = { subj: "data-wl-f-subj", tier: "data-wl-f-tier", cog: "data-wl-f-cog" };

let ui = {};
let current = { mode: "", id: "" };

function navItems(I, band) {
  return MODES.map((m) => [m, I.T(ACTS[m].en, ACTS[m].es), wlHref(m, band), ACTS[m].ico]);
}

function hubHTML(ctx, I, st) {
  const band = ctx.band;
  const words = bandWords(band);
  const due = dueWords(st).length;
  const planted = Object.keys(st.garden).length;
  const day = words[(dayNumber(Date.now()) || 0) % words.length];
  const level = levelOf(st);
  return html`${studioCrumbs(I, band, "wordlab", I.S("Word Lab", "Laboratorio de palabras"))}
    ${studioHero({
      I,
      ico: "words",
      cls: "d-reading",
      kicker: I.T(
        `Grades ${band.replace("-", "–")} · academic words`,
        `Grados ${band.replace("-", "–")} · palabras académicas`,
      ),
      title: I.T("Word Lab", "Laboratorio de palabras"),
      lead: I.T(
        `${words.length} words for reading, math, science and social studies. Build words from parts, find Spanish twins, catch false friends, and grow the words you collect. Nothing is timed and nothing is a score.`,
        `${words.length} palabras para lectura, matemáticas, ciencias y estudios sociales. Construye palabras con partes, encuentra gemelas en español, atrapa falsos amigos y haz crecer las palabras que coleccionas. Nada tiene tiempo y nada es un puntaje.`,
      ),
      art: raw(heroArt("wordlab")),
    })}
    ${levelPickerHTML(I, level)}
    <section class="panel wl-today" aria-labelledby="wl-today-h">
      <h2 id="wl-today-h">${icon("sparkle")} ${I.T("Word of the day", "Palabra del día")}</h2>
      ${wordCardHTML(day, I, level, st, band)}
    </section>
    <section class="panel wl-garden-peek" aria-labelledby="wl-gp-h">
      <h2 id="wl-gp-h">${icon("growth")} ${I.T("My Word Garden", "Mi jardín de palabras")}</h2>
      <p>
        ${planted ? I.T(`${planted} ${planted === 1 ? "word is" : "words are"} growing. ${due} ${due === 1 ? "is" : "are"} ready to water today.`, `${planted} ${planted === 1 ? "palabra está creciendo" : "palabras están creciendo"}. ${due} ${due === 1 ? "está lista" : "están listas"} para regar hoy.`) : I.T("Plant a word from any card and it will wait here for you.", "Planta una palabra de cualquier tarjeta y te esperará aquí.")}
      </p>
      <a class="btn btn-primary" href="${wlHref("garden", band)}"
        >${I.T("Visit my garden", "Visitar mi jardín")} ${icon("arrow-right")}</a
      >
    </section>
    <section class="task-group" aria-labelledby="wl-acts-h">
      <h2 id="wl-acts-h">${I.T("Choose an activity", "Elige una actividad")}</h2>
      <div class="task-grid">
        ${MODES.map(
          (m) =>
            html`<a class="card task-card" href="${wlHref(m, band)}"
              ><span class="task-top"><span class="task-ico">${icon(ACTS[m].ico)}</span></span
              ><strong class="task-title">${I.T(ACTS[m].en, ACTS[m].es)}</strong
              ><span class="task-desc">${I.T(ACTS[m].dEn, ACTS[m].dEs)}</span></a
            >`,
        )}
      </div>
    </section>
    <p class="disclaimer">
      ${I.T("Practice on this device. Words, meanings and examples are original to this site. This is not a WIDA or ACCESS score.", "Práctica en este dispositivo. Las palabras, los significados y los ejemplos son originales de este sitio. Esto no es un puntaje de WIDA ni de ACCESS.")}
    </p>`;
}

function exploreHTML(ctx, I, st) {
  const f = ui.filter || {};
  const all = searchWords(bandWords(ctx.band), f);
  const lim = ui.limit || 18;
  const level = levelOf(st);
  const sel = (key, val, opts) =>
    html`<select ${raw(FILTER_ATTR[key])} aria-label="${opts.label}">
      ${opts.items.map(([v, l]) => html`<option value="${v}" ${String(f[key] || "") === v ? "selected" : ""}>${l}</option>`)}
    </select>`;
  return html`<div class="wl-filters" role="search" aria-label="${I.S("Find words", "Buscar palabras")}">
      <label class="wl-q"
        ><span>${I.T("Search", "Buscar")}</span
        ><input
          type="search"
          data-wl-q
          value="${f.q || ""}"
          placeholder="${I.S("a word or a meaning", "una palabra o un significado")}"
      /></label>
      ${sel("subj", f.subj, { label: I.S("Subject", "Materia"), items: [["", I.S("All subjects", "Todas las materias")], ...Object.entries(SUBJECTS).map(([k, v]) => [k, I.S(v[0], v[1])])] })}
      ${sel("tier", f.tier, {
        label: I.S("Kind of word", "Tipo de palabra"),
        items: [
          ["", I.S("All words", "Todas las palabras")],
          ["2", I.S("Everywhere words", "Palabras de todas partes")],
          ["3", I.S("Subject words", "Palabras de la materia")],
        ],
      })}
      ${sel("cog", f.cog, {
        label: I.S("Spanish link", "Vínculo con el español"),
        items: [
          ["", I.S("Any Spanish link", "Cualquier vínculo")],
          ["cog", I.S("Spanish twins", "Gemelas en español")],
          ["part", I.S("Partial twins", "Gemelas parciales")],
          ["false", I.S("False friends", "Falsos amigos")],
          ["none", I.S("No look-alike", "Sin parecida")],
        ],
      })}
      <button type="button" class="btn" data-wl-clear>${I.T("Clear", "Borrar")}</button>
    </div>
    <p class="fine" role="status">${I.T(`${all.length} words`, `${all.length} palabras`)}</p>
    <div class="wl-grid">
      ${all.slice(0, lim).map((w) => wordCardHTML(w, I, level, st, ctx.band))}
    </div>
    ${all.length > lim ? html`<p><button type="button" class="btn" data-wl-more>${I.T("Show more words", "Mostrar más palabras")}</button></p>` : ""}`;
}

// ── Word Garden ───────────────────────────────────────────────────────────────
function plantSVG(i) {
  const stem = i >= 1 ? `<path class="pl-stem" d="M40 72 V${[72, 56, 42, 34, 30, 40][i]}" />` : "";
  const leaves = [
    [],
    [
      [40, 60, -1],
      [40, 60, 1],
    ],
    [
      [40, 62, -1],
      [40, 62, 1],
      [40, 50, -1],
      [40, 50, 1],
    ],
    [
      [40, 62, -1],
      [40, 62, 1],
      [40, 50, -1],
      [40, 50, 1],
    ],
    [
      [40, 62, -1],
      [40, 62, 1],
      [40, 50, -1],
      [40, 50, 1],
    ],
    [],
  ][i]
    .map(
      ([x, y, s]) =>
        `<ellipse class="pl-leaf" cx="${x + s * 9}" cy="${y}" rx="9" ry="4.5" transform="rotate(${s * -25} ${x + s * 9} ${y})" />`,
    )
    .join("");
  const top =
    i === 0
      ? `<ellipse class="pl-seed" cx="40" cy="70" rx="5" ry="3.5" />`
      : i === 3
        ? `<ellipse class="pl-bud" cx="40" cy="28" rx="6" ry="9" />`
        : i === 4
          ? [0, 60, 120, 180, 240, 300]
              .map(
                (a) =>
                  `<ellipse class="pl-petal" cx="40" cy="20" rx="5.5" ry="9" transform="rotate(${a} 40 30)" />`,
              )
              .join("") + `<circle class="pl-core" cx="40" cy="30" r="5" />`
          : i === 5
            ? `<rect class="pl-trunk" x="36" y="40" width="8" height="32" rx="2" /><circle class="pl-canopy" cx="40" cy="30" r="18" /><circle class="pl-canopy" cx="26" cy="40" r="12" /><circle class="pl-canopy" cx="54" cy="40" r="12" />`
            : "";
  return `<svg viewBox="0 0 80 90" width="80" height="90" aria-hidden="true" focusable="false"><ellipse class="pl-soil" cx="40" cy="78" rx="30" ry="9" />${i === 5 ? "" : stem}${leaves}${top}</svg>`;
}

function gardenHTML(ctx, I, st) {
  const words = bandWords(ctx.band);
  const ids = Object.keys(st.garden)
    .map((id) => WORDS.find((w) => w.id === id))
    .filter(Boolean);
  const due = dueWords(st);
  const rev = ui.rev;
  const word = rev ? WORDS.find((w) => w.id === rev.id) : null;
  let review = "";
  if (word) {
    const q = reviewQuestion(word, WORDS);
    const level = levelOf(st);
    const prompt =
      q.kind === "meaning"
        ? I.T(`What does “${word.w}” mean?`, `¿Qué significa «${word.w}»?`)
        : q.kind === "spanish"
          ? I.T(
              `Which Spanish word matches “${word.w}”?`,
              `¿Qué palabra en español corresponde a «${word.w}»?`,
            )
          : I.T("Which word fits the blank?", "¿Qué palabra encaja en el espacio?");
    review = html`<section class="panel wl-task" aria-labelledby="wl-rev-h">
      <h2 id="wl-rev-h">${prompt}</h2>
      ${q.kind === "sentence" ? html`<p class="wl-ex">${q.prompt}</p>` : html`<p class="wl-bigword"><b>${word.w}</b> ${speakBtn(I, word.w)}</p>`}
      ${rev.hint ? html`<p class="wl-hint">${icon("bulb")} ${I.T(`It starts with “${word.w[0]}”. Spanish help: `, `Empieza con «${word.w[0]}». Ayuda en español: `)}<span lang="es">${word.e}</span></p>` : rev.choice == null ? html`<button type="button" class="btn small" data-wl-rhint>${icon("bulb")} ${I.T("Help me remember", "Ayúdame a recordar")}</button>` : ""}
      <div class="wl-choices" role="group">
        ${q.opts.map((o, i) => html`<button type="button" class="wl-choice ${rev.choice != null && o.ok ? "is-right" : rev.choice === i ? "is-try" : ""}" data-wl-ranswer="${i}" ${rev.choice != null ? "disabled" : ""}>${o.text}${gloss(I, level, o.es)}</button>`)}
      </div>
      ${
        rev.choice != null
          ? html`<div
                class="wl-feedback ${q.opts[rev.choice].ok ? "is-right" : "is-try"}"
                role="status"
              >
                ${icon(q.opts[rev.choice].ok ? "check" : "alert")}
                ${q.opts[rev.choice].ok ? (rev.hint ? I.T("Right. With help, the word is watered but it does not grow yet.", "Correcto. Con ayuda, la palabra se riega pero todavía no crece.") : I.T("Right, on your own. Your word grows.", "Correcto, por tu cuenta. Tu palabra crece.")) : I.T(`Not this time. “${word.w}”: ${word.d}`, `Esta vez no. «${word.w}»: ${word.de}`)}
              </div>
              <div class="wl-actions">
                <button type="button" class="btn btn-primary" data-wl-rnext>
                  ${due.length > 1 || !q.opts[rev.choice].ok ? I.T("Next", "Siguiente") : I.T("Back to my garden", "Volver a mi jardín")}
                  ${icon("arrow-right")}
                </button>
              </div>`
          : ""
      }
    </section>`;
  }
  return html`${review}
    <section class="panel" aria-labelledby="wl-g-h">
      <h2 id="wl-g-h">${I.T("My Word Garden", "Mi jardín de palabras")}</h2>
      <p>
        ${ids.length ? I.T(`Words grow when you remember them on your own, on days that are spaced out: tomorrow, then after 3, 7 and 14 days. Help is fine, but a word grows only after a review without help. ${due.length} ${due.length === 1 ? "word is" : "words are"} ready.`, `Las palabras crecen cuando las recuerdas por tu cuenta, en días espaciados: mañana y luego a los 3, 7 y 14 días. La ayuda está bien, pero una palabra crece solo después de un repaso sin ayuda. ${due.length} ${due.length === 1 ? "palabra está lista" : "palabras están listas"}.`) : I.T("Your garden is empty. Plant words from Explore Words, the Builder, or any word card.", "Tu jardín está vacío. Planta palabras desde Explorar palabras, el Constructor o cualquier tarjeta.")}
      </p>
      ${due.length && !rev ? html`<button type="button" class="btn btn-primary" data-wl-rstart>${icon("growth")} ${I.T(`Water ${due.length} ${due.length === 1 ? "word" : "words"}`, `Regar ${due.length} ${due.length === 1 ? "palabra" : "palabras"}`)}</button>` : ""}
      <ul class="wl-plots">
        ${ids.map((w) => {
          const info = gardenInfo(st.garden[w.id]);
          const [sEn, sEs, nEn] = STAGE_COPY[info.stage];
          return html`<li class="wl-plot is-${info.stage}">
            <span class="wl-plant">${raw(plantSVG(info.index))}</span><b>${w.w}</b
            ><span class="wl-stage">${I.T(sEn, sEs)}</span
            ><small
              >${info.retired ? I.T(nEn, "Lo mostraste por tu cuenta cuatro veces.") : info.due ? I.T("Ready to water", "Lista para regar") : I.T(`Waits ${info.wait} ${info.wait === 1 ? "day" : "days"}`, `Espera ${info.wait} ${info.wait === 1 ? "día" : "días"}`)}</small
            >
            <span class="wl-plot-actions"
              ><a class="btn small" href="${wlHref(`frayer/${w.id}`, ctx.band)}"
                >${I.T("Frayer", "Frayer")}</a
              ><button
                type="button"
                class="btn small"
                data-wl-uproot="${w.id}"
                aria-label="${I.S(`Remove ${w.w} from my garden`, `Quitar ${w.w} de mi jardín`)}"
              >
                ${icon("x")}
              </button></span
            >
          </li>`;
        })}
      </ul>
      <ol class="wl-legend" aria-label="${I.S("Growth stages", "Etapas de crecimiento")}">
        ${STAGES.map((s, i) => html`<li><span class="wl-plant sm">${raw(plantSVG(i))}</span>${I.T(STAGE_COPY[s][0], STAGE_COPY[s][1])}</li>`)}
      </ol>
    </section>
    `;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  const mode = ctx.route.id || "";
  const id = ctx.route.sub || "";
  if (current.mode !== mode) ui = {};
  current = { mode, id };
  const st = wlState();
  const title = I.S("Word Lab", "Laboratorio de palabras");
  if (!mode) return { title, html: hubHTML(ctx, I, st) };
  const act = ACTS[mode];
  if (!act) return { title, html: hubHTML(ctx, I, st) };
  const band = ctx.band;
  let body;
  if (mode === "explore") body = exploreHTML(ctx, I, st);
  else if (mode === "garden") body = gardenHTML(ctx, I, st);
  else body = act.mod.render(ctx, I, st, ui, id);
  return {
    title: `${I.S(act.en, act.es)} · ${title}`,
    html: html`${studioCrumbs(I, band, "wordlab", title, I.S(act.en, act.es))}
      <div class="wl-studio d-reading">
        <header class="wl-head">
          <h1 tabindex="-1">${icon(act.ico)} ${I.T(act.en, act.es)}</h1>
          <p class="lead">${I.T(act.dEn, act.dEs)}</p>
        </header>
        ${modeNavHTML(I, navItems(I, band), mode, I.S("Word Lab activities", "Actividades del Laboratorio de palabras"))}
        ${levelPickerHTML(I, levelOf(st), "data-sk-level", true)} ${body}
      </div>`,
  };
}

export function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const st = wlState();
  const t = e.target;
  const lvl = t.closest("[data-sk-level]");
  if (lvl && LEVELS.includes(lvl.dataset.skLevel)) {
    st.level = lvl.dataset.skLevel;
    wlSave(st);
    announce(I.S(`Support ${st.level}.`, `Apoyo ${st.level}.`));
    return (ctx.rerender(), true);
  }
  const col = t.closest("[data-wl-collect]");
  if (col) {
    const wid = col.dataset.wlCollect;
    if (st.garden[wid]) dropWord(st, wid);
    else collectOnce(st, wid);
    wlSave(st);
    announce(
      st.garden[wid]
        ? I.S("Planted in your garden.", "Plantada en tu jardín.")
        : I.S("Removed from your garden.", "Quitada de tu jardín."),
    );
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-wl-more]"))
    return ((ui.limit = (ui.limit || 18) + 18), ctx.rerender(), true);
  if (t.closest("[data-wl-clear]"))
    return ((ui.filter = {}), (ui.limit = 18), ctx.rerender(), true);
  if (current.mode === "garden") return gardenClick(e, ctx, I, st);
  const act = ACTS[current.mode];
  return act?.mod ? act.mod.click(e, ctx, I, st, ui) === true : false;
}

function gardenClick(e, ctx, I, st) {
  const t = e.target;
  const start = t.closest("[data-wl-rstart]");
  if (start)
    return ((ui.rev = { id: dueWords(st)[0], hint: false, choice: null }), ctx.rerender(), true);
  const un = t.closest("[data-wl-uproot]");
  if (un) return (dropWord(st, un.dataset.wlUproot), wlSave(st), ctx.rerender(), true);
  if (t.closest("[data-wl-rhint]") && ui.rev) return ((ui.rev.hint = true), ctx.rerender(), true);
  const ans = t.closest("[data-wl-ranswer]");
  if (ans && ui.rev && ui.rev.choice == null) {
    const word = WORDS.find((w) => w.id === ui.rev.id);
    const q = reviewQuestion(word, WORDS);
    const i = Number(ans.dataset.wlRanswer);
    ui.rev.choice = i;
    const ok = q.opts[i].ok;
    reviewWord(st, word.id, { ok, independent: ok && !ui.rev.hint });
    st.revs = (st.revs || 0) + 1;
    if (st.revs % 5 === 0)
      wlEvidence(
        st,
        ctx,
        `garden-${st.revs / 5}`,
        { reviews: 5, planted: Object.keys(st.garden).length },
        ui.rev.hint ? { hint: true } : {},
        "Inform",
      );
    wlSave(st);
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-wl-rnext]")) {
    const next = dueWords(st).filter((id) => id !== ui.rev?.id)[0];
    ui.rev = next ? { id: next, hint: false, choice: null } : null;
    return (ctx.rerender(), true);
  }
  return false;
}

export function onChange(e, ctx) {
  const t = e.target;
  const st = wlState();
  if (current.mode === "explore") {
    ui.filter ||= {};
    if (t.matches?.("[data-wl-q]")) ui.filter.q = t.value;
    else if (t.matches?.("[data-wl-f-subj]")) ui.filter.subj = t.value;
    else if (t.matches?.("[data-wl-f-tier]")) ui.filter.tier = t.value;
    else if (t.matches?.("[data-wl-f-cog]")) ui.filter.cog = t.value;
    else return;
    ui.limit = 18;
    renderAfterChange(ctx);
    return;
  }
  if (current.mode === "frayer") frayer.change(e, ctx, st, current.id);
}
export function onInput(e, ctx) {
  if (current.mode === "frayer") frayer.input(e, ctx, wlState(), current.id);
}
export function mount(root, ctx) {
  useDrag(root, {
    drop(zone, e, el) {
      if (current.mode === "build") build.add(ctx, i18nFor(ctx), wlState(), ui, el.dataset.drag);
    },
  });
}
export function unmount() {
  ui = {};
}
