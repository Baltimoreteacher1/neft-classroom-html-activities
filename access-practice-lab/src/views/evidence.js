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
} from "../evidence-ui.js";
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
  tagLabel,
} from "../lang/evidence-notebook.js";
import { chartHTML, tableHTML } from "../media.js";
import { BASE, announce, asList, html, safeJson, storage } from "../util.js";

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
let lastPinned = "";
let feedback = null; // { pairId, text, result }
let confirmClear = false;
let pendingFocus = "";

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
    <p class="fb-title">What your synthesis shows</p>
    <ul class="checks">
      ${result.criteria.map((c) =>
        c.met
          ? html`<li class="ok">
              ✓
              <strong>${c.label}.</strong>
              ${c.spans.length ? html`Found in your words: ${c.spans.map((s) => html`<q>${s.text}</q> `)}` : ""}
            </li>`
          : html`<li>→ <strong>Not yet: ${c.label.toLowerCase()}.</strong> ${c.ask}</li>`,
      )}
    </ul>
    <p class="fine">
      These checks look for features in your own words: pinned evidence, source names, linking words
      and numbers. They do not judge meaning and they are not a score or a level. Revise, then check
      again.
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
      <span class="eyebrow">Multi-source synthesis · two sources, one topic</span>
      <h2 id="synHeading">Synthesis matrix: ${src.textTitle}</h2>
      ${
        pairs.length > 1
          ? html`<div class="speed" role="group" aria-label="Choose a source pair">
              ${pairs.map(
                (p, i) =>
                  html`<button
                    type="button"
                    class="speed-btn"
                    data-syn-pair="${i}"
                    aria-pressed="${String(p.id === pair.id)}"
                  >
                    Pair ${i + 1}
                  </button>`,
              )}
            </div>`
          : ""
      }
      <p><strong>Question:</strong> ${pair.question}</p>
      <ol class="fine">
        <li>
          Select sentences in the text and data points in the chart. Tag each one as a Claim,
          Evidence, or an Example.
        </li>
        <li>
          Place each pin in the matrix: where do the sources agree, and what does each one add?
        </li>
        <li>Write a short synthesis that uses your pins and names both sources.</li>
      </ol>
    </header>
    ${tagBarHTML(picked && (picked.sourceId === src.ids.text || picked.sourceId === src.ids.data) ? picked : null)}
    ${lastPinned ? html`<p class="saved-note">${lastPinned}</p>` : ""}
    <div class="evidence-grid">
      <section class="card" aria-labelledby="synText">
        <span class="eyebrow">Source 1 · Text</span>
        <h3 id="synText">${src.textTitle}</h3>
        <div class="passage">
          ${renderPassageSentences(src.paragraphs, { tagMode: true, pickKey: src.ids.text, picked: pickedIdx, pinned: pinnedIndex(nb, src.ids.text, sentences) })}
        </div>
      </section>
      <section class="card" aria-labelledby="synData">
        <span class="eyebrow">Source 2 · Data</span>
        <h3 id="synData">${src.dataTitle}</h3>
        ${asList(src.chart).map((c, i) => chartHTML(c, i))}${src.table ? tableHTML(src.table) : ""}
        <h4>Pin a data point</h4>
        <ul class="chips" role="list">
          ${points.map((t, i) =>
            dataPickHTML(`${src.ids.data}|d${i}`, t, {
              picked: picked?.key === `${src.ids.data}|d${i}`,
              tag: dataItems.find((x) => x.text === t)?.tag,
            }),
          )}
        </ul>
      </section>
    </div>
    <section aria-labelledby="synPins">
      <h3 id="synPins">My pins for these sources</h3>
      ${
        all.length
          ? html`<ul class="nb-items">
              ${all.map(
                (x) =>
                  html`<li class="card">
                    <p>
                      <span class="badge">${tagLabel(x.tag)}</span> “${x.text}”
                      <span class="fine">(${x.source.id === src.ids.text ? "text" : "data"})</span>
                    </p>
                    ${placeButtonsHTML(x)}
                  </li>`,
              )}
            </ul>`
          : html`<p class="fine">No pins yet. Select a sentence or data point above.</p>`
      }
      ${matrixHTML(all, { textTitle: src.textTitle, dataTitle: src.dataTitle })}
    </section>
    <section aria-labelledby="synWrite">
      <h3 id="synWrite">Write your synthesis</h3>
      <label class="field">
        <span>In 2–4 sentences, answer the question using evidence from both sources.</span>
        <textarea rows="5" data-syn-text="${pair.id}" spellcheck="false" data-nsr-ignore>
${draft}</textarea>
      </label>
      <p class="fine">
        Your synthesis and pins stay in this browser. They are never sent anywhere or added to a
        progress code.
      </p>
      <button type="button" class="btn btn-primary" data-syn-check="${pair.id}">
        Check my synthesis
      </button>
      ${feedback?.pairId === pair.id && feedback.text === draft ? feedbackCardHTML(feedback.result) : ""}
    </section>
  </article>`;
}

function notebookHTML(nb) {
  return html`<article class="panel" id="notebook" aria-labelledby="nbHeading">
    <h2 id="nbHeading">📓 My Evidence Notebook</h2>
    <p class="fine">
      Pins from Reading activities and this studio. Saved only in this browser; clearing site data
      removes them.
    </p>
    ${notebookListHTML(nb.items, { empty: "Nothing pinned yet. In a Reading activity, turn on “Pin evidence”, or pin sentences above." })}
    ${
      nb.items.length
        ? confirmClear
          ? html`<div class="row-actions" role="group" aria-label="Confirm clearing the notebook">
              <button type="button" class="ghost danger" data-nb-clear-confirm>
                Yes, remove every pin</button
              ><button type="button" class="ghost" data-nb-clear-cancel>Keep my pins</button>
            </div>`
          : html`<button type="button" class="ghost danger" data-nb-clear>
              Clear my notebook
            </button>`
        : ""
    }
  </article>`;
}

export async function render(ctx) {
  const saved = studio();
  const evSet = EVIDENCE_SETS[saved.setIdx || 0] || EVIDENCE_SETS[0];
  const nb = loadNotebook(storage);
  const setPins = new Set(itemsFrom(nb, `ev:${evSet.id}`).map((x) => x.text));
  const pairs = pairsForBand(ctx.band);
  const pair = pairs[(saved.pair?.[ctx.band] || 0) % (pairs.length || 1)];
  const src = pair ? await loadPair(pair).catch(() => null) : null;

  const breadcrumbs = [
    ["Lab", `${BASE}/?grades=${ctx.band}`],
    ["Evidence-to-Language Studio", null],
  ];

  return {
    title: "Evidence-to-Language Studio",
    html: html`${crumbsHTML(breadcrumbs)}
      <section class="room-hero" style="--room:#2b9348">
        <div>
          <span class="badge" style="background:#1e6b34; color:white"
            >Data-to-Language Scaffold</span
          >
          <h1 tabindex="-1">📊 Evidence-to-Language Studio</h1>
          <p class="lead">
            Pin evidence from a text and a chart, compare the two sources, and write an
            evidence-based synthesis.
          </p>
        </div>
      </section>

      ${src ? synthesisHTML(pair, src, nb, pairs) : pair ? html`<p class="panel" role="status">The sources for this synthesis could not load. Check your connection and try again.</p>` : ""}
      ${notebookHTML(nb)}

      <article class="panel evidence-panel" aria-labelledby="evSetHeading">
        <header>
          <span class="eyebrow">${evSet.domain} · ${evSet.type}</span>
          <h2 id="evSetHeading">${evSet.title}</h2>
          <p>Select data points below to pin them as evidence in your Evidence Notebook.</p>
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
              <p class="data-val">📈 ${dp.value}</p>
              <span class="fine">${isPicked ? "✓ Pinned as evidence" : "+ Pin as evidence"}</span>
            </button>`;
          })}
        </div>

        <section class="notebook-section card">
          <h3>📓 Academic Explanation Construction</h3>
          <p class="fine">
            Follow the 3-step scientific discourse model: Observation → Interpretation → Causal
            Explanation.
          </p>

          <div class="step-card">
            <span class="eyebrow">Step 1: Observation (What do the numbers show?)</span>
            <p class="model-stem">${evSet.stems.observation}</p>
            <button type="button" class="btn ghost small" data-say="${evSet.stems.observation}">
              🔊 Hear Observation Aloud
            </button>
          </div>

          <div class="step-card">
            <span class="eyebrow">Step 2: Interpretation (Why does this matter?)</span>
            <p class="model-stem">${evSet.stems.interpretation}</p>
            <button type="button" class="btn ghost small" data-say="${evSet.stems.interpretation}">
              🔊 Hear Interpretation Aloud
            </button>
          </div>

          <div class="step-card">
            <span class="eyebrow"
              >Step 3: Causal Explanation (What is the overall consequence?)</span
            >
            <p class="model-stem">${evSet.stems.explanation}</p>
            <button type="button" class="btn ghost small" data-say="${evSet.stems.explanation}">
              🔊 Hear Explanation Aloud
            </button>
          </div>

          <div class="row-actions">
            <button type="button" class="btn btn-secondary" data-evidence-next>
              Next Evidence Investigation →
            </button>
          </div>
        </section>
      </article>`,
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
        announce("Selected. Choose Claim, Evidence, or Example.");
      }
      ctx.rerender();
    });
    return false;
  }
  if (t.closest("[data-nb-unpick]")) {
    picked = null;
    announce("Selection cleared.");
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
    const label = tagLabel(tagBtn.dataset.nbTag);
    lastPinned =
      status === "full"
        ? "Your notebook is full. Remove a pin below first."
        : status === "unchanged"
          ? `Already pinned as ${label}.`
          : `📌 Pinned as ${label}${storage.isVolatile ? " (this tab only: this device could not save)" : ""}.`;
    announce(lastPinned);
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
        ? `Placed in the matrix: ${place.textContent.trim()}.`
        : "Taken out of the matrix.",
    );
    return true;
  }
  const remove = t.closest("[data-nb-remove]");
  if (remove) {
    const { item } = removeItem(storage, remove.dataset.nbRemove);
    announce(item ? `Removed: ${item.text.slice(0, 60)}` : "Already removed.");
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
    announce("Evidence Notebook cleared.");
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
    announce("Source pair changed.");
    return true;
  }
  const check = t.closest("[data-syn-check]");
  if (check) {
    const pairId = check.dataset.synCheck;
    const pair = pairsForBand(ctx.band).find((p) => p.id === pairId);
    const nb = loadNotebook(storage);
    const text = nb.synth[pairId] || "";
    if (!pair || !text.trim()) {
      announce("Write your synthesis first, then check it.");
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
      announce("Synthesis checked. Read the feedback below your writing.");
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
        ? "Removed from your Evidence Notebook."
        : "Pinned as evidence in your Evidence Notebook.",
    );
    return true;
  }

  const nextBtn = t.closest("[data-evidence-next]");
  if (nextBtn) {
    const saved = studio();
    saved.setIdx = ((saved.setIdx || 0) + 1) % EVIDENCE_SETS.length;
    storage.set(EVIDENCE_KEY, JSON.stringify(saved));
    announce("Next evidence set loaded.");
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
