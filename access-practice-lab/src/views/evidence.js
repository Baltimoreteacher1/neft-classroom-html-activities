// Evidence-to-Language Studio: pin and tag evidence from two complementary sources (an informational passage and
// a chart), compare them in a synthesis matrix, write a short synthesis with criterion-specific feedback, and keep
// everything in a local Evidence Notebook. Also turns charts and observations into academic explanations
// (WIDA Key Language Uses: Explain & Inform). Nothing here is a score or a proficiency level.
import { crumbsHTML, renderPassageSentences } from "../components.js";
import { findActivity, loadMission } from "../content.js";
import {
  dataPickHTML,
  matrixHTML,
  notebookListHTML,
  placeButtonsHTML,
  tagBarHTML,
  tagLabels,
  tagNameFor,
} from "../evidence-ui.js";
import { i18nFor, makeI18n } from "../i18n.js";
import {
  clearNotebook,
  dataPoints,
  itemsFrom,
  loadNotebook,
  pairSourceIds,
  pairsForBand,
  passageSentences,
  pinItem,
  pinnedIndex,
  placeItem,
  removeItem,
  saveSynthesis,
  synthesisFeedback,
} from "../lang/evidence-notebook.js";
import { chartHTML, tableHTML } from "../media.js";
import { ART, BASE, announce, asList, html, icon, safeJson, storage } from "../util.js";

const EVIDENCE_KEY = "accessPracticeLab:v1:evidence_studio";

export const EVIDENCE_SETS = [
  {
    id: "renewable-energy",
    title: "Global Renewable Energy Transition (2015–2025)",
    domain: "Science & Engineering",
    type: "Data Chart",
    dataPoints: [
      { id: "dp1", label: "Solar Photovoltaic Cost", value: "Declined 82%", tag: "Economic Driver" },
      { id: "dp2", label: "Wind Capacity Installed", value: "Grew from 432 GW to 1,020 GW", tag: "Infrastructure Growth" },
      { id: "dp3", label: "Grid Battery Storage", value: "Expanded by 1,400%", tag: "Reliability & Storage" },
      { id: "dp4", label: "Fossil Fuel Share of Electricity", value: "Decreased from 67% to 48%", tag: "Systemic Transition" }
    ],
    stems: {
      observation: "Between 2015 and 2025, solar photovoltaic energy costs declined by 82%, while installed wind capacity more than doubled.",
      interpretation: "This dramatic price decline made renewable infrastructure more cost-effective than conventional fossil fuels.",
      explanation: "Consequently, utility providers invested heavily in grid-scale battery storage, enabling clean energy to replace traditional coal generation without compromising power reliability."
    }
  },
  {
    id: "water-erosion",
    title: "Vegetative Cover and Topsoil Retention",
    domain: "Earth Systems",
    type: "Field Experiment",
    dataPoints: [
      { id: "dp1", label: "Bare Soil Slope", value: "Lost 48 tons of sediment per acre/year", tag: "Erosion Risk" },
      { id: "dp2", label: "Grassland Buffer", value: "Lost 4 tons of sediment per acre/year", tag: "Moderate Protection" },
      { id: "dp3", label: "Forested Canopy with Root Network", value: "Lost under 0.5 tons per acre/year", tag: "Maximum Protection" }
    ],
    stems: {
      observation: "Data indicates that slopes lacking vegetative cover experienced 48 tons of annual sediment loss compared to less than 0.5 tons in forested areas.",
      interpretation: "Deep root systems bind soil particles together, while dense tree canopies intercept rainfall and reduce direct surface impact.",
      explanation: "As a result, retaining vegetative buffers along slopes dramatically prevents catastrophic topsoil erosion and protects riverbeds from sedimentation."
    }
  }
];

// View state for this visit (pins, drafts and the chosen pair persist; selection and feedback do not).
let picked = null; // { key: "<sourceId>|<idx or d<n>>", text, sourceId, kind, title }
let lastPinned = ""; // "" or [English, Español], so the note follows the language mode
let feedback = null; // { pairId, text, result }
let confirmClear = false;
let pendingFocus = "";
let I = makeI18n("en");

const dpText = (set, dp) => `${set.title}: ${dp.label} — ${dp.value}`;
const studio = () => safeJson(storage.get(EVIDENCE_KEY), {}) || {};

/** Load a synthesis pair's two sources from authored content (a Reading activity, or a mission's sources). */
async function loadPair(pair) {
  const ids = pairSourceIds(pair);
  if (pair.from.kind === "mission") {
    const m = await loadMission(pair.from.id);
    const t = m.sources[pair.from.text];
    const d = m.sources[pair.from.data];
    return {
      ids,
      textTitle: t.title,
      paragraphs: asList(t.text),
      dataTitle: d.title || d.chart?.title || d.table?.caption,
      chart: d.chart || null,
      table: d.table || null,
    };
  }
  const found = await findActivity(pair.from.id, { domain: "Reading" });
  const a = found.activity;
  return {
    ids,
    textTitle: a.passageTitle || a.title,
    paragraphs: asList(a.passage),
    dataTitle: asList(a.chart)[0]?.title || a.table?.caption || "The data",
    chart: a.chart || null,
    table: a.table || null,
  };
}

function feedbackCardHTML(result) {
  return html`<div class="feedback is-hint" role="status">
    <p class="fb-title">${icon("bulb")} ${I.T("What your synthesis shows", "Lo que muestra tu síntesis")}</p>
    <ul class="checks">
      ${result.criteria.map((c) =>
        c.met
          ? html`<li class="ok">
              ${icon("check")}
              <span><strong>${c.label}.</strong>
              ${c.spans.length ? html`${I.T("Found in your words:", "Encontrado en tus palabras:")} ${c.spans.map((s) => html`<q>${s.text}</q> `)}` : ""}</span>
            </li>`
          : html`<li>${icon("arrow-right")} <span><strong>${I.T("Not yet:", "Todavía no:")} ${c.label.toLowerCase()}.</strong> ${c.ask}</span></li>`,
      )}
    </ul>
    <p class="fine">
      ${I.T("These checks look for features in your own words: pinned evidence, source names, linking words and numbers. They do not judge meaning and they are not a score or a level. Revise, then check again.", "Estas revisiones buscan rasgos en tus propias palabras: evidencia fijada, nombres de las fuentes, palabras de enlace y números. No juzgan el significado y no son un puntaje ni un nivel. Revisa y vuelve a comprobar.")}
    </p>
  </div>`;
}

function synthesisHTML(pair, src, nb, pairs) {
  const textItems = itemsFrom(nb, src.ids.text);
  const dataItems = itemsFrom(nb, src.ids.data);
  const all = [...textItems, ...dataItems];
  const sentences = passageSentences(src.paragraphs).map((x) => x.text);
  const points = dataPoints(src.chart, src.table);
  const pickedIdx = picked?.sourceId === src.ids.text ? Number(picked.key.split("|").pop()) : -1;
  const draft = nb.synth[pair.id] || "";
  return html`<article class="panel evidence-panel" aria-labelledby="synHeading">
    <header>
      <p class="eyebrow">${I.T("Multi-source synthesis · two sources, one topic", "Síntesis de varias fuentes · dos fuentes, un tema")}</p>
      <h2 id="synHeading">${I.T("Synthesis matrix:", "Matriz de síntesis:")} ${src.textTitle}</h2>
      ${
        pairs.length > 1
          ? html`<div class="speed" role="group" aria-label="${I.S("Choose a source pair", "Elige un par de fuentes")}">
              ${pairs.map(
                (p, i) =>
                  html`<button
                    type="button"
                    class="speed-btn"
                    data-syn-pair="${i}"
                    aria-pressed="${String(p.id === pair.id)}"
                  >
                    ${I.T(`Pair ${i + 1}`, `Par ${i + 1}`)}
                  </button>`,
              )}
            </div>`
          : ""
      }
      <p class="ev-question"><strong>${I.T("Question", "Pregunta")}</strong>${pair.question}</p>
      <ol class="ev-steps">
        <li>
          <strong>${I.T("Pin", "Fija")}</strong>
          ${I.T("Select sentences in the text and data points in the chart. Tag each one as a Claim, Evidence, or an Example.", "Elige oraciones del texto y datos de la gráfica. Marca cada uno como Afirmación, Evidencia o Ejemplo.")}
        </li>
        <li>
          <strong>${I.T("Compare", "Compara")}</strong>
          ${I.T("Place each pin in the matrix: where do the sources agree, and what does each one add?", "Coloca cada elemento fijado en la matriz: ¿en qué coinciden las fuentes y qué añade cada una?")}
        </li>
        <li><strong>${I.T("Write", "Escribe")}</strong> ${I.T("Write a short synthesis that uses your pins and names both sources.", "Escribe una síntesis breve que use lo que fijaste y nombre las dos fuentes.")}</li>
      </ol>
    </header>
    ${tagBarHTML(picked && (picked.sourceId === src.ids.text || picked.sourceId === src.ids.data) ? picked : null, { i18n: I })}
    ${lastPinned ? html`<p class="saved-note">${icon("pin")} ${I.T(lastPinned[0], lastPinned[1])}</p>` : ""}
    <div class="evidence-grid">
      <section class="card ev-source" aria-labelledby="synText">
        <p class="eyebrow">${icon("reading")} ${I.T("Source 1 · Text", "Fuente 1 · Texto")}</p>
        <h3 id="synText">${src.textTitle}</h3>
        <div class="passage">
          ${renderPassageSentences(src.paragraphs, { tagMode: true, pickKey: src.ids.text, picked: pickedIdx, pinned: pinnedIndex(nb, src.ids.text, sentences) })}
        </div>
      </section>
      <section class="card ev-source" aria-labelledby="synData">
        <p class="eyebrow">${icon("growth")} ${I.T("Source 2 · Data", "Fuente 2 · Datos")}</p>
        <h3 id="synData">${src.dataTitle}</h3>
        ${asList(src.chart).map((c, i) => chartHTML(c, i))}${src.table ? tableHTML(src.table) : ""}
        <h4>${I.T("Pin a data point", "Fija un dato")}</h4>
        <ul class="chips ev-points" role="list">
          ${points.map((t, i) =>
            dataPickHTML(`${src.ids.data}|d${i}`, t, {
              picked: picked?.key === `${src.ids.data}|d${i}`,
              tag: dataItems.find((x) => x.text === t)?.tag,
              i18n: I,
            }),
          )}
        </ul>
      </section>
    </div>
    <section aria-labelledby="synPins">
      <h3 id="synPins">${I.T("My pins for these sources", "Lo que fijé de estas fuentes")}</h3>
      ${
        all.length
          ? html`<ul class="nb-items">
              ${all.map(
                (x) =>
                  html`<li class="card">
                    <p>
                      <span class="badge">${tagNameFor(x.tag, I)}</span> “${x.text}”
                      <span class="fine">(${x.source.id === src.ids.text ? I.T("text", "texto") : I.T("data", "datos")})</span>
                    </p>
                    ${placeButtonsHTML(x, { i18n: I })}
                  </li>`,
              )}
            </ul>`
          : html`<p class="fine">${I.T("No pins yet. Select a sentence or data point above.", "Todavía no has fijado nada. Elige una oración o un dato arriba.")}</p>`
      }
      ${matrixHTML(all, { textTitle: src.textTitle, dataTitle: src.dataTitle, i18n: I })}
    </section>
    <section aria-labelledby="synWrite">
      <h3 id="synWrite">${I.T("Write your synthesis", "Escribe tu síntesis")}</h3>
      <label class="field">
        <span>${I.T("In 2–4 sentences, answer the question using evidence from both sources.", "En 2 a 4 oraciones, responde la pregunta con evidencia de las dos fuentes.")}</span>
        <textarea rows="5" data-syn-text="${pair.id}" spellcheck="false" data-nsr-ignore>
${draft}</textarea>
      </label>
      <p class="fine">
        ${I.T("Your synthesis and pins stay in this browser. They are never sent anywhere or added to a progress code.", "Tu síntesis y lo que fijaste se quedan en este navegador. Nunca se envían a ningún lugar ni se agregan a un código de progreso.")}
      </p>
      <div class="row-actions"><button type="button" class="btn btn-primary btn-domain" data-syn-check="${pair.id}">
        ${I.T("Check my synthesis", "Revisar mi síntesis")}
      </button></div>
      ${feedback?.pairId === pair.id && feedback.text === draft ? feedbackCardHTML(feedback.result) : ""}
    </section>
  </article>`;
}

function notebookHTML(nb) {
  return html`<article class="panel" id="notebook" aria-labelledby="nbHeading">
    <h2 id="nbHeading">${icon("bookmark")} ${I.T("My Evidence Notebook", "Mi cuaderno de evidencias")}</h2>
    <p class="fine">
      ${I.T("Pins from Reading activities and this studio. Saved only in this browser; clearing site data removes them.", "Lo que fijaste en actividades de Lectura y en este estudio. Se guarda solo en este navegador; si borras los datos del sitio, desaparece.")}
    </p>
    ${notebookListHTML(nb.items, { empty: I.T("Nothing pinned yet. In a Reading activity, turn on “Pin evidence”, or pin sentences above.", "Todavía no has fijado nada. En una actividad de Lectura, activa «Fijar evidencia» o fija oraciones arriba."), i18n: I })}
    ${
      nb.items.length
        ? confirmClear
          ? html`<div class="row-actions" role="group" aria-label="${I.S("Confirm clearing the notebook", "Confirma que quieres borrar el cuaderno")}">
              <button type="button" class="ghost danger" data-nb-clear-confirm>
                ${I.T("Yes, remove every pin", "Sí, quitar todo lo fijado")}</button
              ><button type="button" class="ghost" data-nb-clear-cancel>${I.T("Keep my pins", "Conservar lo fijado")}</button>
            </div>`
          : html`<button type="button" class="ghost danger" data-nb-clear>
              ${I.T("Clear my notebook", "Borrar mi cuaderno")}
            </button>`
        : ""
    }
  </article>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  const saved = studio();
  const evSet = EVIDENCE_SETS[saved.setIdx || 0] || EVIDENCE_SETS[0];
  const nb = loadNotebook(storage);
  const setPins = new Set(itemsFrom(nb, `ev:${evSet.id}`).map((x) => x.text));
  const pairs = pairsForBand(ctx.band);
  const pair = pairs[(saved.pair?.[ctx.band] || 0) % (pairs.length || 1)];
  const src = pair ? await loadPair(pair).catch(() => null) : null;

  const breadcrumbs = [
    [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
    [I.S("Evidence-to-Language Studio", "Estudio de evidencia a lenguaje"), null],
  ];

  return {
    title: I.S("Evidence-to-Language Studio", "Estudio de evidencia a lenguaje"),
    html: html`${crumbsHTML(breadcrumbs)}
      <div class="ev d-reading">
      <section class="lx-hero">
        <div>
          <p class="eyebrow">${icon("evidence")} ${I.T("Data-to-Language Scaffold", "Apoyo de datos a lenguaje")}</p>
          <h1 tabindex="-1">${I.T("Evidence-to-Language Studio", "Estudio de evidencia a lenguaje")}</h1>
          <p class="lead">
            ${I.T("Pin evidence from a text and a chart, compare the two sources, and write an evidence-based synthesis.", "Fija evidencia de un texto y de una gráfica, compara las dos fuentes y escribe una síntesis basada en evidencia.")}
          </p>
        </div>
        <div class="lx-hero-art"><img src="${ART}/domain-reading.svg" alt="" width="480" height="360" /></div>
      </section>

      ${src ? synthesisHTML(pair, src, nb, pairs) : pair ? html`<p class="panel" role="status">${I.T("The sources for this synthesis could not load. Check your connection and try again.", "No se pudieron cargar las fuentes de esta síntesis. Revisa tu conexión e inténtalo de nuevo.")}</p>` : ""}
      ${notebookHTML(nb)}

      <article class="panel evidence-panel" aria-labelledby="evSetHeading">
        <header>
          <p class="eyebrow">${evSet.domain} · ${evSet.type}</p>
          <h2 id="evSetHeading">${evSet.title}</h2>
          <p>${I.T("Select data points below to pin them as evidence in your Evidence Notebook.", "Elige los datos de abajo para fijarlos como evidencia en tu cuaderno de evidencias.")}</p>
        </header>

        <div class="evidence-grid">
          ${evSet.dataPoints.map((dp) => {
            const isPicked = setPins.has(dpText(evSet, dp));
            return html`<button
              type="button"
              class="card evidence-card ${isPicked ? "is-selected" : ""}"
              data-evidence-toggle="${dp.id}"
              aria-pressed="${String(isPicked)}"
            >
              <span class="badge">${dp.tag}</span>
              <h3>${dp.label}</h3>
              <p class="data-val">${dp.value}</p>
              <span class="ev-pin-state">${icon(isPicked ? "check" : "pin")} ${isPicked ? I.T("Pinned as evidence", "Fijado como evidencia") : I.T("Pin as evidence", "Fijar como evidencia")}</span>
            </button>`;
          })}
        </div>

        <section class="notebook-section card">
          <h3>${icon("writing")} ${I.T("Academic Explanation Construction", "Construcción de explicaciones académicas")}</h3>
          <p class="fine">
            ${I.T("Follow the 3-step scientific discourse model: Observation → Interpretation → Causal Explanation.", "Sigue el modelo de discurso científico en 3 pasos: Observación → Interpretación → Explicación causal.")}
          </p>

          <div class="step-card">
            <p class="eyebrow"><span class="ev-num">1</span> ${I.T("Observation: what do the numbers show?", "Observación: ¿qué muestran los números?")}</p>
            <p class="model-stem">${evSet.stems.observation}</p>
            <button type="button" class="btn ghost small" data-say="${evSet.stems.observation}">
              ${icon("volume")} ${I.T("Hear observation aloud", "Escuchar la observación en voz alta")}
            </button>
          </div>

          <div class="step-card">
            <p class="eyebrow"><span class="ev-num">2</span> ${I.T("Interpretation: why does this matter?", "Interpretación: ¿por qué importa esto?")}</p>
            <p class="model-stem">${evSet.stems.interpretation}</p>
            <button type="button" class="btn ghost small" data-say="${evSet.stems.interpretation}">
              ${icon("volume")} ${I.T("Hear interpretation aloud", "Escuchar la interpretación en voz alta")}
            </button>
          </div>

          <div class="step-card">
            <p class="eyebrow"><span class="ev-num">3</span> ${I.T("Causal explanation: what is the overall consequence?", "Explicación causal: ¿cuál es la consecuencia general?")}</p>
            <p class="model-stem">${evSet.stems.explanation}</p>
            <button type="button" class="btn ghost small" data-say="${evSet.stems.explanation}">
              ${icon("volume")} ${I.T("Hear explanation aloud", "Escuchar la explicación en voz alta")}
            </button>
          </div>

          <div class="row-actions">
            <button type="button" class="btn btn-secondary" data-evidence-next>
              ${I.T("Next evidence investigation", "Siguiente investigación de evidencia")} ${icon("arrow-right")}
            </button>
          </div>
        </section>
      </article>
      </div>`,
  };
}

/** Text of a pick key ("<sourceId>|<index>" or "<sourceId>|d<n>") from the page's own source data. */
async function resolvePick(key, ctx) {
  const cut = key.lastIndexOf("|");
  const sourceId = key.slice(0, cut);
  const part = key.slice(cut + 1);
  const pair = pairsForBand(ctx.band).find((p) => sourceId.startsWith(`${p.id}:`));
  if (!pair) return null;
  const src = await loadPair(pair).catch(() => null);
  if (!src) return null;
  const isData = part.startsWith("d");
  const text = isData
    ? dataPoints(src.chart, src.table)[Number(part.slice(1))]
    : passageSentences(src.paragraphs)[Number(part)]?.text;
  if (!text) return null;
  return {
    key,
    text,
    sourceId,
    kind: isData ? "data" : "passage",
    title: isData ? src.dataTitle : src.textTitle,
  };
}

export function onEvidenceEvent(t, ctx) {
  const L = i18nFor(ctx);
  const pick = t.closest("[data-nb-pick]");
  if (pick) {
    const key = pick.dataset.nbPick;
    if (picked?.key === key) {
      picked = null;
      ctx.rerender();
      return false;
    }
    // Sources come from cached content, so this resolves on the next tick; re-render once it does.
    resolvePick(key, ctx).then((p) => {
      picked = p;
      lastPinned = "";
      if (p) {
        pendingFocus = "[data-nb-tag]";
        announce(L.S("Selected. Choose Claim, Evidence, or Example.", "Elegido. Elige Afirmación, Evidencia o Ejemplo."));
      }
      ctx.rerender();
    });
    return false;
  }
  if (t.closest("[data-nb-unpick]")) {
    picked = null;
    announce(L.S("Selection cleared.", "Selección borrada."));
    return true;
  }
  const tagBtn = t.closest("[data-nb-tag]");
  if (tagBtn && picked) {
    const pair = pairsForBand(ctx.band).find((p) => picked.sourceId.startsWith(`${p.id}:`));
    const { status } = pinItem(storage, {
      tag: tagBtn.dataset.nbTag,
      text: picked.text,
      source: { id: picked.sourceId, kind: picked.kind, title: picked.title },
      pair: pair?.id,
    });
    const label = tagLabels(tagBtn.dataset.nbTag);
    const volatile = storage.isVolatile;
    lastPinned =
      status === "full"
        ? ["Your notebook is full. Remove a pin below first.", "Tu cuaderno está lleno. Primero quita algo de lo fijado abajo."]
        : status === "unchanged"
          ? [`Already pinned as ${label.en}.`, `Ya estaba fijado como ${label.es}.`]
          : [
              `Pinned as ${label.en}${volatile ? " (this tab only: this device could not save)" : ""}.`,
              `Fijado como ${label.es}${volatile ? " (solo en esta pestaña: este dispositivo no pudo guardar)" : ""}.`,
            ];
    announce(L.S(lastPinned[0], lastPinned[1]));
    pendingFocus = `[data-nb-pick="${CSS.escape(picked.key)}"]`;
    picked = null;
    return true;
  }
  const place = t.closest("[data-nb-place]");
  if (place) {
    const [id, cell] = place.dataset.nbPlace.split(":");
    const { item } = placeItem(storage, id, cell);
    announce(
      item?.cell
        ? L.S(`Placed in the matrix: ${place.textContent.trim()}.`, `Colocado en la matriz: ${place.textContent.trim()}.`)
        : L.S("Taken out of the matrix.", "Quitado de la matriz."),
    );
    return true;
  }
  const remove = t.closest("[data-nb-remove]");
  if (remove) {
    const { item } = removeItem(storage, remove.dataset.nbRemove);
    announce(item ? L.S(`Removed: ${item.text.slice(0, 60)}`, `Quitado: ${item.text.slice(0, 60)}`) : L.S("Already removed.", "Ya estaba quitado."));
    pendingFocus = "#nbHeading";
    return true;
  }
  if (t.closest("[data-nb-clear]")) {
    confirmClear = true;
    pendingFocus = "[data-nb-clear-cancel]";
    return true;
  }
  if (t.closest("[data-nb-clear-cancel]")) {
    confirmClear = false;
    pendingFocus = "#nbHeading";
    return true;
  }
  if (t.closest("[data-nb-clear-confirm]")) {
    clearNotebook(storage);
    confirmClear = false;
    feedback = null;
    lastPinned = "";
    announce(L.S("Evidence Notebook cleared.", "Cuaderno de evidencias borrado."));
    pendingFocus = "#nbHeading";
    return true;
  }
  const pairBtn = t.closest("[data-syn-pair]");
  if (pairBtn) {
    const saved = studio();
    saved.pair = { ...(saved.pair || {}), [ctx.band]: Number(pairBtn.dataset.synPair) };
    storage.set(EVIDENCE_KEY, JSON.stringify(saved));
    picked = null;
    lastPinned = "";
    announce(L.S("Source pair changed.", "Se cambió el par de fuentes."));
    return true;
  }
  const check = t.closest("[data-syn-check]");
  if (check) {
    const pairId = check.dataset.synCheck;
    const pair = pairsForBand(ctx.band).find((p) => p.id === pairId);
    const nb = loadNotebook(storage);
    const text = nb.synth[pairId] || "";
    if (!pair || !text.trim()) {
      announce(L.S("Write your synthesis first, then check it.", "Primero escribe tu síntesis y luego revísala."));
      return false;
    }
    loadPair(pair).then((src) => {
      const sourceText = [...src.paragraphs, ...dataPoints(src.chart, src.table)];
      const result = synthesisFeedback(text, {
        pins: itemsFrom(nb, [src.ids.text, src.ids.data]),
        textId: src.ids.text,
        dataId: src.ids.data,
        sourceText,
      });
      feedback = { pairId, text, result };
      pendingFocus = ".feedback";
      announce(L.S("Synthesis checked. Read the feedback below your writing.", "Síntesis revisada. Lee los comentarios debajo de tu texto."));
      ctx.rerender();
    });
    return false;
  }

  const toggle = t.closest("[data-evidence-toggle]");
  if (toggle) {
    const saved = studio();
    const evSet = EVIDENCE_SETS[saved.setIdx || 0] || EVIDENCE_SETS[0];
    const dp = evSet.dataPoints.find((d) => d.id === toggle.dataset.evidenceToggle);
    if (!dp) return false;
    const text = dpText(evSet, dp);
    const existing = itemsFrom(loadNotebook(storage), `ev:${evSet.id}`).find(
      (x) => x.text === text,
    );
    if (existing) removeItem(storage, existing.id);
    else
      pinItem(storage, {
        tag: "evidence",
        text,
        source: { id: `ev:${evSet.id}`, kind: "data", title: evSet.title },
      });
    announce(
      existing
        ? L.S("Removed from your Evidence Notebook.", "Quitado de tu cuaderno de evidencias.")
        : L.S("Pinned as evidence in your Evidence Notebook.", "Fijado como evidencia en tu cuaderno de evidencias."),
    );
    return true;
  }

  const nextBtn = t.closest("[data-evidence-next]");
  if (nextBtn) {
    const saved = studio();
    saved.setIdx = ((saved.setIdx || 0) + 1) % EVIDENCE_SETS.length;
    storage.set(EVIDENCE_KEY, JSON.stringify(saved));
    announce(L.S("Next evidence set loaded.", "Se cargó el siguiente conjunto de evidencias."));
    return true;
  }

  return false;
}

export function onInput(e) {
  const box = e.target;
  if (!box.matches?.("[data-syn-text]")) return;
  saveSynthesis(storage, box.dataset.synText, box.value);
  if (feedback && feedback.text !== box.value) {
    const card = box.closest("section")?.querySelector(".feedback");
    if (card) card.hidden = true;
  }
}

export function mount(root) {
  if (!pendingFocus) return;
  const sel = pendingFocus;
  pendingFocus = "";
  // After the shell restores focus, move it to where the action continues.
  setTimeout(() => {
    const el = root.querySelector(sel);
    if (!el) return;
    if (!el.matches("button, input, textarea, a[href]")) el.tabIndex = -1;
    el.focus();
  }, 0);
}

export function unmount() {
  picked = null;
  lastPinned = "";
  feedback = null;
  confirmClear = false;
  pendingFocus = "";
}
