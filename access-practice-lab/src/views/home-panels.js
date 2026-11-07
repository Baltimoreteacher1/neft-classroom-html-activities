// Lab home panels: the four studio portals, the plan options and the helpers they share with home.js and room.js.
import { STATUS_REASON } from "../practice-plan.js";
import { practiceSummary } from "../practice-report.js";
import { estimateMinutes } from "../learning.js";
import { loadRecord } from "../store.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, TIERS, html, icon } from "../util.js";

// Spanish for the plan's fixed status reasons, keyed like STATUS_REASON. Reasons composed from the
// learner's own evidence (review items, task recommendations) come from the engine and stay English.
const STATUS_REASON_ES = {
  draft: "Continúa tu trabajo guardado y revisa esta versión.",
  retry: "Vuelve a esta actividad y aplica los comentarios.",
  new: "Desarrolla tu lenguaje con una actividad nueva.",
  done: "Practica otra vez una actividad terminada.",
  revisit: "Antes usaste ayuda o un reintento. Prueba una respuesta nueva por tu cuenta.",
};
const BLURB_ES = {
  Listening: "Sigue instrucciones, capta los detalles clave y comprende lo que escuchas.",
  Reading: "Lee textos cortos, busca evidencia y explica la idea principal.",
  Speaking: "Planea lo que vas a decir, grábalo y escúchalo.",
  Writing: "Crea oraciones y párrafos con las palabras y estructuras que elijas.",
};
const PRACTICE_STATUS_ES = {
  "Needs Review": "Necesita repaso",
  "Strong Practice": "Práctica sólida",
  "Practice Complete": "Práctica completa",
  "In Progress": "En progreso",
  "Not Started": "Sin empezar",
};
export const domT = (I, d) => (DOMAIN_META[d] ? I.T(DOMAIN_META[d].name, DOMAIN_META[d].es) : d);
export const domS = (I, d) => (DOMAIN_META[d] ? I.S(DOMAIN_META[d].name, DOMAIN_META[d].es) : d);
export const reasonT = (I, reason) => {
  const key = Object.keys(STATUS_REASON).find((k) => STATUS_REASON[k] === reason);
  return key ? I.T(reason, STATUS_REASON_ES[key]) : reason;
};

export function tierFor(ctx, domain, levels) {
  const t = ctx.prefs.tiers?.[domain];
  return levels?.[t] ? t : levels?.A ? "A" : Object.keys(levels || {})[0];
}

export function nextActivity(band, domain, level, rows) {
  const done = new Set(loadRecord(band, domain, level).complete);
  const next = rows.find((r) => !done.has(r[0]));
  return { done: rows.filter((r) => done.has(r[0])).length, total: rows.length, next };
}

/** The four studio portals: one composition per domain, the same facts on each. */
const PORTALS = {
  Listening: {
    studio: ["The Sound Studio", "El estudio del sonido"],
    art: () =>
      html`<svg class="ll-wave" viewBox="0 0 240 64" aria-hidden="true" focusable="false">
        ${[10, 18, 30, 44, 26, 52, 38, 22, 46, 58, 34, 20, 40, 28, 14, 36, 48, 24, 12, 30, 18, 8].map((h, i) => html`<rect x="${4 + i * 10.6}" y="${32 - h / 2}" width="5" height="${h}" rx="2.5" />`)}
      </svg>`,
  },
  Reading: {
    studio: ["The Reading Atelier", "El taller de lectura"],
    art: () =>
      html`<div class="ll-folio" aria-hidden="true">
        <span class="ll-folio-title"></span><span></span><span class="is-mark"></span><span></span
        ><span class="is-short"></span>
      </div>`,
  },
  Speaking: {
    studio: ["The Expression Studio", "El estudio de expresión"],
    art: () =>
      html`<div class="ll-rings" aria-hidden="true">
        <span></span><span></span><span></span>${icon("speaking")}<em lang="en">I noticed that…</em>
      </div>`,
  },
  Writing: {
    studio: ["The Composition Studio", "El estudio de composición"],
    art: () =>
      html`<div class="ll-manuscript" aria-hidden="true">
        <span></span><span class="is-struck"></span><span class="is-insert"></span><span></span
        ><span class="is-caret"></span>
      </div>`,
  },
};

export function portalHTML(I, ctx, band, d, levels) {
  const meta = DOMAIN_META[d];
  const tier = tierFor(ctx, d, levels);
  const { done, total, next } = nextActivity(band, d, tier, levels[tier].activities);
  const record = loadRecord(band, d, tier);
  const { status } = practiceSummary(record.results, done, total);
  const statusClass = status.toLowerCase().replace(/\s+/g, "-");
  const roomHref = `${BASE}/${d}/${tier}?grades=${band}`;
  const href = next ? `${BASE}/${d}/${tier}/${next[0]}?grades=${band}` : roomHref;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const portal = PORTALS[d];
  return html`<article class="room-tile ll-portal d-${d.toLowerCase()}">
    <div class="ll-portal-art">${portal.art()}</div>
    <div class="room-body">
      <p class="ll-portal-studio">${I.T(...portal.studio)}</p>
      <h3 class="room-name">
        <a class="room-link" href="${roomHref}">${I.T(meta.name, meta.es)}</a>
      </h3>
      <p class="room-blurb">${I.T(meta.blurb, BLURB_ES[d])}</p>
      <div class="ll-portal-meta">
        <span class="practice-status is-${statusClass}"
          >${I.T(status, PRACTICE_STATUS_ES[status])}</span
        >
        <span class="fine"
          >${I.T(`${TIERS[tier]?.name || tier} support`, `Apoyo ${TIERS[tier]?.es || tier}`)}</span
        >
      </div>
      <div class="room-progress">
        <div
          class="bar"
          role="img"
          aria-label="${I.S(`${meta.name}: ${done} of ${total} activities done`, `${meta.es}: ${done} de ${total} actividades hechas`)}"
        >
          <i style="width:${pct}%"></i>
        </div>
        <p class="fine">${I.T(`${done} of ${total} done`, `${done} de ${total} hechas`)}</p>
      </div>
      ${
        next
          ? html`<a class="btn btn-room" href="${href}"
                >${done ? I.T(`Continue ${meta.name.toLowerCase()}`, `Seguir con ${meta.es.toLowerCase()}`) : I.T(`Start ${meta.name.toLowerCase()}`, `Empezar a ${meta.es.toLowerCase()}`)}${icon("arrow-right")}</a
              >
              <p class="room-next fine">${I.T("Next:", "Siguiente:")} ${next[1]}</p>`
          : html`<a class="btn btn-room" href="${roomHref}"
              >${I.T("Level complete — choose another", "Nivel completo: elige otro")}${icon("arrow-right")}</a
            >`
      }
    </div>
  </article>`;
}

export function planOptionsHTML(I, { plan, focus, level, count, option, band, shippedLevels = ["A", "B", "C"] }) {
  return html`<details id="planOptions" class="session-options">
    <summary>
      ${I.T("Change my plan or see all activities", "Cambiar mi plan o ver todas las actividades")}
    </summary>
    <div class="session-controls">
      <label class="field"
        ><span>${I.T("Skill focus", "Habilidad principal")}</span
        ><select id="planFocus" data-plan="focus" data-nsr-ignore>
          ${option("balanced", I.S("Any skill · unfinished work first", "Cualquier habilidad · primero lo que falta"), focus)}
          ${CORE_DOMAINS.map((d) => option(d, domS(I, d), focus))}
        </select></label
      >
      <label class="field"
        ><span>${I.T("Support choice", "Apoyo elegido")}</span
        ><select id="planLevel" data-plan="level" data-nsr-ignore>
          ${option("preferred", I.S("My chosen room supports", "Los apoyos que elegí en cada sala"), level)}
          ${shippedLevels.includes("A") ? option("A", I.S("Starting · words and short sentences", "Comenzando · palabras y oraciones cortas"), level) : ""}
          ${shippedLevels.includes("B") ? option("B", I.S("Growing · connected ideas", "Creciendo · ideas conectadas"), level) : ""}
          ${shippedLevels.includes("C") ? option("C", I.S("Expanding · details and explanations", "Ampliando · detalles y explicaciones"), level) : ""}
        </select></label
      >
      <label class="field"
        ><span>${I.T("Session length", "Duración de la sesión")}</span
        ><select id="planCount" data-plan="count" data-nsr-ignore>
          ${[2, 4, 6].map((n) => option(String(n), I.S(`${n} activities`, `${n} actividades`), String(count)))}
        </select></label
      >
    </div>
    <p class="fine">
      ${I.T("Starting: name and describe with words or short sentences. Growing: connect ideas. Expanding: explain with details. These choices change tasks and scaffolds; they are not WIDA scores. Change support any time.", "Comenzando: nombra y describe con palabras u oraciones cortas. Creciendo: conecta ideas. Ampliando: explica con detalles. Estas opciones cambian las tareas y los apoyos; no son puntajes de WIDA. Puedes cambiar el apoyo cuando quieras.")}
    </p>
    <p class="fine">
      ${I.T("This browser’s saved practice puts unfinished work first, then retries, then new activities. On a shared device, check that the saved work is yours.", "La práctica guardada en este navegador pone primero lo que no has terminado, luego los reintentos y después las actividades nuevas. En un dispositivo compartido, verifica que el trabajo guardado sea tuyo.")}
    </p>
    <ol class="session-list">
      ${plan.map(
        (r) =>
          html`<li>
            <span class="session-domain"
              >${domT(I, r.domain)} · ${I.T(TIERS[r.level].name, TIERS[r.level].es)}</span
            >
            <a href="${BASE}/${r.domain}/${r.level}/${r.id}?grades=${band}">${r.title}</a>
            <span class="fine"
              >${reasonT(I, r.reason)} ·
              ${I.T(`about ${estimateMinutes([r])} minutes`, `unos ${estimateMinutes([r])} minutos`)}</span
            >
          </li>`,
      )}
    </ol>
  </details>`;
}

