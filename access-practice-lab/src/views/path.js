// My Language Path (/path): the student home for the language engines. My next mission, my Language DNA
// (four domains, practice evidence kept apart from any official result), my growth constellation (a node
// graph with a list alternative), my recommended next goal, and where I left off. Everything is read from
// this device. No practice-derived level, score or percentage appears here: the engines' decision rules
// carry percentages for teachers, so this page shows evidence counts and plain state words instead.
import { crumbsHTML } from "../components.js";
import { STATE_WORDS, constellationOutline } from "../lang/constellation.js";
import { OFFICIAL_DOMAINS } from "../lang/official-scores.js";
import { TOOLS } from "../content/scaffold-items.js";
import { i18nFor } from "../i18n.js";
import { BASE, DOMAIN_META, esc, formatDate, html, icon, raw } from "../util.js";
import { entryHref, entryTitle, readPath, scaffoldHref } from "./path-data.js";

import {
  CRITERIA,
  DOMAIN_ES,
  GOALS,
  LAYERS,
  NODE_ES,
  NODE_TOOL,
  STAGE,
  STATE_ES,
  STATE_FILL,
  SUPPORT_ES,
  USE_ES,
  criterionT,
} from "./path-copy.js";

const P = { domain: null, node: null };

const domT = (I, d) => I.T(d, DOMAIN_ES[d]);
const stateT = (I, s) => I.T(STATE_WORDS[s], STATE_ES[s]);
const nodeName = (I, n) => I.T(n.name, NODE_ES[n.id]);
const supportT = (I, cond, you) => I.T(you, SUPPORT_ES[cond]);
const stageT = (I, st) => I.T(...(STAGE[st] || STAGE.supported));

function taskHref(kind, band) {
  if (TOOLS[kind]) return scaffoldHref(kind, band);
  if (kind === "checkpoint") return `${BASE}/diagnostic?grades=${band}`;
  return `${BASE}/write?grades=${band}`;
}
function nodeHref(id, band) {
  return NODE_TOOL[id] ? scaffoldHref(NODE_TOOL[id], band) : `${BASE}/reading-room?grades=${band}`;
}

/** A small ring that fills a quarter per state step. It shows a state word visually; it is not a score. */
function stateGlyph(state) {
  const f = STATE_FILL[state] ?? 0;
  const r = 9;
  const c = 2 * Math.PI * r;
  return raw(
    `<svg class="pa-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="${r}" class="pa-glyph-track"/><circle cx="12" cy="12" r="${r}" class="pa-glyph-fill" stroke-dasharray="${(c * f).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 12 12)"/></svg>`,
  );
}

function missionHTML(I, d, band) {
  const m = d.mission;
  const t = d.missionTask;
  const label = t ? I.T(...t.name) : domT(I, m.domain);
  return html`<section
    class="panel pa-mission d-${m.domain.toLowerCase()}"
    aria-labelledby="paMissionTitle"
  >
    <p class="eyebrow">${icon("mission")} ${I.T("My next mission", "Mi próxima misión")}</p>
    <h2 id="paMissionTitle">
      ${label}${t?.topic ? html` · <span lang="en">${t.topic}</span>` : ""}
    </h2>
    <dl class="pa-facts">
      <div>
        <dt>${I.T("Skill", "Destreza")}</dt>
        <dd>
          ${icon(DOMAIN_META[m.domain]?.icon || "star")} ${domT(I, m.domain)} ·
          ${I.T(m.keyLanguageUse, USE_ES[m.keyLanguageUse])}
        </dd>
      </div>
      <div>
        <dt>${I.T("My help", "Mi ayuda")}</dt>
        <dd>
          ${supportT(I, m.support.condition, d.dna.domains.find((x) => x.domain === m.domain)?.support.you || m.support.name)}
        </dd>
      </div>
      <div>
        <dt>${I.T("I will know I did it when", "Sabré que lo logré cuando")}</dt>
        <dd>${criterionT(I, d.readiness.recommendations.find((r) => r.competency === m.competency)?.state)}</dd>
      </div>
    </dl>
    ${m.opensWithRetrieval ? html`<p class="pa-retrieval">${icon("retry")} ${I.T(`Start with a quick review: ${d.due.length} thing${d.due.length === 1 ? " you practiced is" : "s you practiced are"} ready for another look.`, `Empieza con un repaso rápido: ${d.due.length} ${d.due.length === 1 ? "cosa que practicaste está lista" : "cosas que practicaste están listas"} para otra mirada.`)} <a href="${BASE}/growth?grades=${band}">${I.T("Open my review", "Abrir mi repaso")}</a></p>` : ""}
    <a
      class="btn btn-primary btn-big pa-go"
      data-mission-go
      href="${t ? t.href : `${BASE}/${m.domain}?grades=${band}`}"
      >${I.T("Start my mission", "Empezar mi misión")} ${icon("arrow-right")}</a
    >
    <details class="pa-why">
      <summary>${I.T("Why this mission?", "¿Por qué esta misión?")}</summary>
      <p>
        ${I.T("The lab chooses the domain with the least practice evidence so far, and avoids sending you to the same domain twice in a row. Pieces of work in each domain:", "El laboratorio elige el área con menos evidencia de práctica hasta ahora y evita enviarte dos veces seguidas a la misma área. Trabajos en cada área:")}
      </p>
      <ul>
        ${m.decision.considered.map((c) => html`<li>${domT(I, c.domain)}: ${c.evidence}</li>`)}
      </ul>
    </details>
  </section>`;
}

function dnaSvg(I, dna, sel) {
  const fill = { none: 0.16, limited: 0.5, enough: 0.88 };
  const petals = OFFICIAL_DOMAINS.map((dom, i) => {
    const rec = dna.domains.find((x) => x.domain === dom);
    return `<ellipse class="pa-petal d-${dom.toLowerCase()}${dom === sel ? " is-selected" : ""}" data-dna-petal="${dom}" cx="120" cy="64" rx="38" ry="54" fill-opacity="${fill[rec.instructional.sufficiency]}" transform="rotate(${i * 90} 120 120)"/>`;
  }).join("");
  const label = OFFICIAL_DOMAINS.map((dom) => {
    const n = dna.domains.find((x) => x.domain === dom).instructional.responseCount;
    return I.S(
      `${dom}: ${n} piece${n === 1 ? "" : "s"} of work`,
      `${DOMAIN_ES[dom]}: ${n} ${n === 1 ? "trabajo" : "trabajos"}`,
    );
  }).join("; ");
  return raw(
    `<svg class="pa-dna-svg" viewBox="0 0 240 240" role="img" aria-label="${esc(label)}">${petals}<circle cx="120" cy="120" r="26" class="pa-dna-core"/></svg>`,
  );
}

function dnaHTML(I, d, band) {
  const sel = P.domain && OFFICIAL_DOMAINS.includes(P.domain) ? P.domain : d.mission.domain;
  const rec = d.dna.domains.find((x) => x.domain === sel);
  const ins = rec.instructional;
  const n = ins.responseCount;
  return html`<section class="panel pa-dna" aria-labelledby="paDnaTitle">
    <p class="eyebrow">${icon("language")} ${I.T("My Language DNA", "Mi ADN del lenguaje")}</p>
    <h2 id="paDnaTitle">
      ${I.T("Four ways I use language", "Cuatro maneras en que uso el lenguaje")}
    </h2>
    <p class="fine">
      ${I.T("Each petal fills in as you save more work in that domain. It counts your practice; it is not a level or a score.", "Cada pétalo se llena a medida que guardas más trabajo en esa área. Cuenta tu práctica; no es un nivel ni un puntaje.")}
    </p>
    <div class="pa-dna-grid">
      ${dnaSvg(I, d.dna, sel)}
      <div
        class="pa-dna-buttons"
        role="group"
        aria-label="${I.S("Choose a domain", "Elige un área")}"
      >
        ${OFFICIAL_DOMAINS.map((dom) => html`<button type="button" class="pa-dna-btn d-${dom.toLowerCase()}" id="pa-dna-${dom}" data-dna-domain="${dom}" aria-pressed="${dom === sel ? "true" : "false"}">${icon(DOMAIN_META[dom]?.icon || "star")}<span>${domT(I, dom)}</span></button>`)}
      </div>
    </div>
    <div class="pa-dna-detail d-${sel.toLowerCase()}" aria-live="polite">
      <h3>${domT(I, sel)}</h3>
      <p>
        ${n ? I.T(`${n} piece${n === 1 ? "" : "s"} of work saved, ${ins.independentResponseCount} on my own.`, `${n} ${n === 1 ? "trabajo guardado" : "trabajos guardados"}, ${ins.independentResponseCount} por mi cuenta.`) : I.T("No work saved here yet.", "Todavía no hay trabajo guardado aquí.")}
        ${ins.sufficiency !== "enough" ? I.T("Not enough evidence yet to say what is strong.", "Todavía no hay suficiente evidencia para decir qué es fuerte.") : ""}
      </p>
      <p>
        <strong>${I.T("My help right now:", "Mi ayuda ahora:")}</strong>
        ${supportT(I, rec.support.condition, rec.support.you)}
      </p>
      ${rec.official ? html`<p class="pa-official">${I.T(`Your teacher entered your ACCESS result: ${sel} ${rec.official.level}`, `Tu maestro o maestra anotó tu resultado de ACCESS: ${DOMAIN_ES[sel]} ${rec.official.level}`)}</p>` : ""}
      <h4>${I.T("My goals", "Mis metas")}</h4>
      <ul class="pa-goals">
        ${GOALS[sel].map(([en, es]) => html`<li>${I.T(en, es)}</li>`)}
      </ul>
      ${
        ins.strengths.length
          ? html`<h4>${I.T("Shown on my own", "Lo mostré por mi cuenta")}</h4>
              <ul lang="en">
                ${ins.strengths.map((x) => html`<li>${x.name}</li>`)}
              </ul>`
          : ""
      }
      ${
        ins.priorities.length
          ? html`<h4>${I.T("Next to practice", "Lo próximo para practicar")}</h4>
              <ul lang="en">
                ${ins.priorities.map((x) => html`<li>${x.name}</li>`)}
              </ul>`
          : ""
      }
    </div>
    ${d.dna.hasOfficial ? "" : html`<p class="fine pa-note">${icon("info")} ${I.T("Your teacher can add your official ACCESS results in the Teacher Hub. This page never works out a level or a score from practice.", "Tu maestro o maestra puede agregar tus resultados oficiales de ACCESS en el Centro docente. Esta página nunca calcula un nivel ni un puntaje a partir de la práctica.")}</p>`}
  </section>`;
}

function nodeDetailHTML(I, node, rec, band) {
  if (!node) return "";
  return html`<div class="pa-node-detail" aria-live="polite">
    <h3>${nodeName(I, node)}</h3>
    <p>
      <strong>${stateT(I, node.state)}</strong> ·
      ${I.T(`${node.evidenceCount} piece${node.evidenceCount === 1 ? "" : "s"} of evidence, ${node.independentCount} on my own`, `${node.evidenceCount} ${node.evidenceCount === 1 ? "evidencia" : "evidencias"}, ${node.independentCount} por mi cuenta`)}
    </p>
    ${
      node.recent.length
        ? html`<h4>${I.T("Recent attempts", "Intentos recientes")}</h4>
            <ul>
              ${node.recent.map((r) => html`<li><span lang="en">${r.skill}</span> · ${stageT(I, r.stage === "independent" ? "independent" : "supported")} · ${formatDate(r.at)}</li>`)}
            </ul>`
        : html`<p class="fine">${I.T("No attempts yet.", "Todavía no hay intentos.")}</p>`
    }
    ${node.stretchUnlocked ? "" : html`<p class="fine">${I.T("Harder tasks open after:", "Las tareas más difíciles se abren después de:")} <span lang="en">${node.blockedBy.join(", ")}</span></p>`}
    <a class="btn" href="${rec ? taskHref(rec.task.kind, band) : nodeHref(node.id, band)}"
      >${I.T("Next task for this", "Próxima tarea para esto")} ${icon("arrow-right")}</a
    >
  </div>`;
}

function constellationHTML(I, d, band) {
  const nodes = d.constellation.nodes;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const sel = byId[P.node] || null;
  const outline = constellationOutline(d.constellation);
  const btn = (n) =>
    html`<button
      type="button"
      class="pa-node is-${n.state}"
      id="pa-node-${n.id}"
      data-node="${n.id}"
      aria-pressed="${sel?.id === n.id ? "true" : "false"}"
      aria-label="${I.S(`${n.name}: ${STATE_WORDS[n.state]}`, `${NODE_ES[n.id]}: ${STATE_ES[n.state]}`)}"
    >
      ${stateGlyph(n.state)}<span>${nodeName(I, n)}</span>
    </button>`;
  return html`<section class="panel pa-constellation" aria-labelledby="paConTitle">
    <p class="eyebrow">
      ${icon("sparkle")} ${I.T("My Growth Constellation", "Mi constelación de crecimiento")}
    </p>
    <h2 id="paConTitle">
      ${I.T("How my language skills connect", "Cómo se conectan mis destrezas de lenguaje")}
    </h2>
    <p class="fine">
      ${I.T("A star fills in only from work you saved: some evidence, building, shown with support, shown on my own. Lines show which skills help the next ones.", "Una estrella se llena solo con el trabajo que guardaste: algo de evidencia, en construcción, con apoyo, por mi cuenta. Las líneas muestran qué destrezas ayudan a las siguientes.")}
    </p>
    <div
      class="pa-graph"
      data-pa-graph
      data-edges="${d.constellation.edges.map((x) => `${x.from}>${x.to}`).join(",")}"
    >
      <svg class="pa-edges" aria-hidden="true" focusable="false"></svg>
      ${LAYERS.map((layer) => html`<div class="pa-layer">${layer.map((id) => btn(byId[id]))}</div>`)}
    </div>
    ${nodeDetailHTML(
      I,
      sel,
      d.readiness.recommendations.find((r) => r.competency === sel?.id),
      band,
    )}
    <details class="pa-outline">
      <summary>
        ${I.T("Read the constellation as a list", "Leer la constelación como lista")}
      </summary>
      <ul>
        ${outline.map((o) => html`<li><button type="button" class="pa-outline-btn" data-node-list="${o.id}" aria-pressed="${sel?.id === o.id ? "true" : "false"}">${nodeName(I, byId[o.id])}: ${stateT(I, o.state)}${byId[o.id].evidenceCount ? I.T(`, ${byId[o.id].evidenceCount} pieces of evidence`, `, ${byId[o.id].evidenceCount} evidencias`) : ""}</button></li>`)}
      </ul>
    </details>
  </section>`;
}

function goalHTML(I, d, band) {
  const recs = d.readiness.recommendations;
  return html`<section class="panel pa-goal" aria-labelledby="paGoalTitle">
    <p class="eyebrow">${icon("flag")} ${I.T("My current goal", "Mi meta actual")}</p>
    <h2 id="paGoalTitle">${I.T("Recommended next", "Lo recomendado ahora")}</h2>
    ${
      recs.length
        ? html`<ol class="pa-recs">
            ${recs.map(
              (r) =>
                html`<li>
                  <h3>${I.T(r.name, NODE_ES[r.competency])}</h3>
                  <p lang="en">${r.interpretation}</p>
                  <p>
                    <strong
                      >${I.T("I will know I did it when:", "Sabré que lo logré cuando:")}</strong
                    >
                    ${criterionT(I, r.state)}
                  </p>
                  <a class="btn" href="${taskHref(r.task.kind, band)}"
                    >${TOOLS[r.task.kind] ? I.T(...TOOLS[r.task.kind].name) : I.T("Try the next task", "Intentar la próxima tarea")}
                    ${icon("arrow-right")}</a
                  >
                </li>`,
            )}
          </ol>`
        : html`<p class="pa-empty">
            ${I.T("Not enough evidence yet. Finish your mission and your next goal will appear here.", "Todavía no hay suficiente evidencia. Termina tu misión y aquí aparecerá tu próxima meta.")}
          </p>`
    }
    ${d.readiness.insufficient.length ? html`<p class="fine">${I.T(`${d.readiness.insufficient.length} of ${d.readiness.competencies} skills have no evidence yet, so nothing is guessed about them.`, `${d.readiness.insufficient.length} de ${d.readiness.competencies} destrezas todavía no tienen evidencia, así que no se adivina nada sobre ellas.`)}</p>` : ""}
  </section>`;
}

function continueHTML(I, d, band) {
  const e = d.last;
  return html`<section class="panel pa-continue" aria-labelledby="paContTitle">
    <p class="eyebrow">
      ${icon("bookmark")} ${I.T("Continue where I left off", "Seguir donde me quedé")}
    </p>
    ${
      e
        ? (() => {
            const title = entryTitle(e);
            return html`<h2 id="paContTitle">
                ${title.tool ? I.T(...title.tool) : domT(I, e.domain || "Writing")}${title.topic ? html` · <span lang="en">${title.topic}</span>` : ""}
              </h2>
              <p class="fine">${formatDate(e.t)} · ${stageT(I, e.stage)}</p>
              <a class="btn" data-continue href="${entryHref(e, band)}"
                >${I.T("Pick it up again", "Retomarlo")} ${icon("arrow-right")}</a
              >`;
          })()
        : html`<h2 id="paContTitle">${I.T("Nothing saved yet", "Todavía no hay nada guardado")}</h2>
            <p class="fine">
              ${I.T("Your work is saved on this device as you go.", "Tu trabajo se guarda en este dispositivo mientras avanzas.")}
            </p>`
    }
  </section>`;
}

function toolsHTML(I, band) {
  return html`<section class="pa-tools" aria-labelledby="paToolsTitle">
    <h2 id="paToolsTitle">${I.T("Language builders", "Constructores de lenguaje")}</h2>
    <div class="pa-tool-grid">
      ${Object.entries(TOOLS).map(
        ([id, t]) =>
          html`<a class="pa-tool" href="${scaffoldHref(id, band)}"
            >${icon(t.icon)}<span
              ><strong>${I.T(...t.name)}</strong><span class="fine">${I.T(...t.blurb)}</span></span
            ></a
          >`,
      )}
    </div>
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const d = readPath(band);
  return {
    title: I.S("My Language Path", "Mi camino del lenguaje"),
    html: html`${crumbsHTML(
        [
          [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
          [I.S("My Language Path", "Mi camino del lenguaje"), null],
        ],
        { i18n: I },
      )}
      <header class="pa-head">
        <p class="eyebrow">
          ${icon("road")}
          ${I.T(`Grades ${band.replace("-", "–")} · saved on this device`, `Grados ${band.replace("-", "–")} · guardado en este dispositivo`)}
        </p>
        <h1 tabindex="-1">${I.T("My Language Path", "Mi camino del lenguaje")}</h1>
        <p class="lead">
          ${I.T("What to do next, how your language is growing, and where you left off. It comes from your own saved work.", "Qué hacer después, cómo crece tu lenguaje y dónde te quedaste. Sale de tu propio trabajo guardado.")}
        </p>
      </header>
      <div class="pa-top">${missionHTML(I, d, band)}${continueHTML(I, d, band)}</div>
      ${dnaHTML(I, d, band)} ${constellationHTML(I, d, band)} ${goalHTML(I, d, band)}
      ${toolsHTML(I, band)}
      <p class="fine pa-disclaimer">
        ${I.T("Practice evidence on this device only. It is not a WIDA or ACCESS score, level or prediction.", "Evidencia de práctica solo en este dispositivo. No es un puntaje, nivel ni predicción de WIDA o ACCESS.")}
      </p>`,
  };
}

let resizeObs = null;
function drawEdges(root) {
  const graph = root.querySelector("[data-pa-graph]");
  const svg = graph?.querySelector(".pa-edges");
  if (!graph || !svg) return;
  const box = graph.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${Math.max(1, box.width)} ${Math.max(1, box.height)}`);
  const center = (id) => {
    const r = graph.querySelector(`[data-node="${id}"] .pa-glyph`)?.getBoundingClientRect();
    return r ? [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top] : null;
  };
  svg.innerHTML = graph.dataset.edges
    .split(",")
    .filter(Boolean)
    .map((pair) => {
      const [a, b] = pair.split(">").map(center);
      return a && b
        ? `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`
        : "";
    })
    .join("");
}

export function mount(root) {
  drawEdges(root);
  resizeObs?.disconnect();
  const graph = root.querySelector("[data-pa-graph]");
  if (graph && "ResizeObserver" in window) {
    resizeObs = new ResizeObserver(() => drawEdges(root));
    resizeObs.observe(graph);
  }
}

export function unmount() {
  resizeObs?.disconnect();
  resizeObs = null;
}

export function onClick(e, ctx) {
  const dom = e.target.closest("[data-dna-domain], [data-dna-petal]");
  if (dom) {
    P.domain = dom.dataset.dnaDomain || dom.dataset.dnaPetal;
    ctx.rerender();
    return true;
  }
  const node = e.target.closest("[data-node], [data-node-list]");
  if (node) {
    const id = node.dataset.node || node.dataset.nodeList;
    P.node = P.node === id ? null : id;
    ctx.rerender();
    return true;
  }
  return false;
}

