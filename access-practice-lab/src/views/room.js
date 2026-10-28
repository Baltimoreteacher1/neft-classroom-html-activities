// A skill room (one domain, one level): a big "Next activity" button, the
// level's skill strands as a folded list, and a tier picker. Replaces the old
// wall of 28 cards.
import { crumbsHTML, ringHTML, tierPickerHTML } from "../components.js";
import { bandDomains, loadDomain, ordered } from "../content.js";
import { activityStatus } from "../practice-plan.js";
import { loadRecord } from "../store.js";
import { i18nFor } from "../i18n.js";
import { ART, BASE, DOMAIN_META, TIERS, bandLabel, html, icon } from "../util.js";
import { tierFor } from "./home.js";

const TYPE_LABEL = {
  multipleChoice: "Choose",
  multiSelect: "Choose all",
  sort: "Sort",
  order: "Put in order",
  cloze: "Fill in",
  hotText: "Find evidence",
  constructed: "Your answer",
  worksheet: "Printable",
};

const TYPE_LABEL_ES = {
  multipleChoice: "Elige",
  multiSelect: "Elige todas",
  sort: "Clasifica",
  order: "Ordena",
  cloze: "Completa",
  hotText: "Busca evidencia",
  constructed: "Tu respuesta",
  worksheet: "Para imprimir",
};
/** Spanish room names; the English names live in DOMAIN_META. */
export const ROOM_ES = {
  Listening: "Práctica de escuchar",
  Reading: "Práctica de leer",
  Speaking: "Práctica de hablar",
  Writing: "Práctica de escribir",
  "Model-Test": "Preguntas de prueba modelo",
};
const bandEs = (band) => `Grados ${band.replace("-", "–")}`;

export function activityHref(domain, level, id) {
  if (domain === "Model-Test") {
    const [cluster, band, lv] = level.split("-");
    return `${BASE}/Model-Test/${cluster}-${band}/${lv}/${id}`;
  }
  return `${BASE}/${domain}/${level}/${id}`;
}
export function roomHref(domain, level) {
  if (domain === "Model-Test") {
    const [cluster, band, lv] = level.split("-");
    return `${BASE}/Model-Test/${cluster}-${band}/${lv}`;
  }
  return `${BASE}/${domain}/${level}`;
}

export async function render(ctx) {
  const { domain } = ctx.route;
  const band = ctx.band;
  const I = i18nFor(ctx);
  const { T, S } = I;
  const domains = await bandDomains(band);
  if (!domains[domain])
    return {
      title: S(domain, DOMAIN_META[domain]?.es),
      html: html`<section class="panel">
        <h1 tabindex="-1">${T(domain, DOMAIN_META[domain]?.es)}</h1>
        <p>${T(`This skill is not available for ${bandLabel(band)} yet.`, `Esta destreza aún no está disponible para ${bandEs(band).toLowerCase()}.`)}</p>
        <p><a class="btn" href="${BASE}/">${T("Back to the lab", "Volver al laboratorio")}</a></p>
      </section>`,
    };
  const levels = domains[domain].levels;
  let level = ctx.route.level;
  if (!levels[level]) level = tierFor(ctx, domain, levels);
  else if (domain !== "Model-Test" && ctx.prefs.tiers?.[domain] !== level)
    ctx.setPrefs({ tiers: { ...ctx.prefs.tiers, [domain]: level } });
  const data = await loadDomain(band, domain);
  const L = data.levels[level];
  const record = loadRecord(band, domain, level);
  const done = new Set(record.complete);
  const list = ordered(L);
  const next = list.find((a) => !done.has(a.id)) || list[0];
  const meta = DOMAIN_META[domain];
  const tier = TIERS[level];
  const doneCount = list.filter((a) => done.has(a.id)).length;
  const byId = new Map(list.map((a) => [a.id, a]));
  const cats = (L.categories || []).length
    ? L.categories
    : [{ id: "all", title: "All activities", es: "Todas las actividades", activityIds: list.map((a) => a.id) }];
  const listed = new Set(cats.flatMap((c) => c.activityIds));
  const extra = list.filter((a) => !listed.has(a.id));
  if (extra.length)
    cats.push({ id: "more", title: "More practice", es: "Más práctica", activityIds: extra.map((a) => a.id) });

  const packetBase = `${band === "3-5" ? "g3-5-" : ""}${domain}-${level}`.replace(/\s+/g, "");

  const row = (a) => {
    const savedStatus = activityStatus(record, a.id);
    const status = savedStatus === "done" ? "done" : savedStatus === "new" ? "new" : "tried";
    return html`<li class="act-row is-${status}">
      <a href="${activityHref(domain, level, a.id)}">
        <span class="act-status" aria-hidden="true">${status === "done" ? icon("check") : status === "tried" ? icon("pin") : ""}</span>
        <span class="act-title">${a.title}</span>
        <span class="act-meta">${TYPE_LABEL[a.type] ? T(TYPE_LABEL[a.type], TYPE_LABEL_ES[a.type]) : ""} · ${a.time || ""}</span>
        <span class="visually-hidden"
          >${status === "done" ? T("(done)", "(hecha)") : status === "tried" ? T("(started)", "(empezada)") : ""}</span
        >
      </a>
    </li>`;
  };

  return {
    title: S(`${meta.room} · ${tier?.name || level}`, `${ROOM_ES[domain] || meta.room} · ${tier?.es || level}`),
    html: html`${crumbsHTML([
        [S("Lab", "Laboratorio"), `${BASE}/`],
        [S(meta.room, ROOM_ES[domain]), null],
      ])}
      <section class="room-hero d-${domain.toLowerCase()}">
        <div class="room-hero-copy">
          <p class="eyebrow">${T(`${bandLabel(band)}${tier ? ` · ${tier.name} support` : ""}`, `${bandEs(band)}${tier ? ` · apoyo: ${tier.es}` : ""}`)}</p>
          <h1 tabindex="-1">${T(meta.room, ROOM_ES[domain])}</h1>
          <p class="lead">${L.info?.headline || L.studentGoal || data.description}</p>
          ${domain !== "Model-Test" ? tierPickerHTML(domain, level, (k) => roomHref(domain, k)) : ""}
          <a class="btn btn-primary btn-big btn-next" href="${activityHref(domain, level, next.id)}">
            <span class="btn-kicker">${doneCount ? T("Keep going", "Sigue adelante") : T("Start here", "Empieza aquí")}</span><span class="next-title">${next.title}</span>${icon("arrow-right")}
          </a>
        </div>
        <div class="room-hero-art">
          <img src="${ART}/domain-${domain === "Model-Test" ? "reading" : domain.toLowerCase()}.svg" width="480" height="360" alt="" decoding="async" />
          <div class="room-hero-progress">
            ${ringHTML(doneCount, list.length, { size: 64, label: S(`${doneCount} of ${list.length} done`, `${doneCount} de ${list.length} hechas`) })}
            <p><strong>${T(`${doneCount} of ${list.length}`, `${doneCount} de ${list.length}`)}</strong><span>${T("activities done at this level", "actividades hechas en este nivel")}</span></p>
          </div>
        </div>
      </section>
      <div class="room-layout">
      <div class="room-main">
      <section class="strands" aria-label="${S("All activities", "Todas las actividades")}">
        ${cats.map((c) => {
          const acts = c.activityIds.map((id) => byId.get(id)).filter(Boolean);
          const n = acts.filter((a) => done.has(a.id)).length;
          return html`<details class="strand" ${cats.length <= 2 ? "open" : ""}>
            <summary>
              <span class="strand-title">${c.es ? T(c.title, c.es) : c.title}</span
              ><span class="strand-count">${n}/${acts.length}</span>
            </summary>
            ${c.desc ? html`<p class="strand-desc">${c.desc}</p>` : ""}
            <ol class="act-list">
              ${acts.map(row)}
            </ol>
          </details>`;
        })}
      </section>
      </div>
      <aside class="room-aside" aria-label="${S("Goals and printables", "Metas e impresiones")}">
        ${
          L.info?.canDo?.length
            ? html`<section class="aside-card">
                <h2>${icon("flag")} ${T("“I can…” goals", "Metas “Yo puedo…”")}</h2>
                <ul>
                  ${L.info.canDo.map((c) => html`<li>${c}</li>`)}
                </ul>
              </section>`
            : ""
        }
        <section class="aside-card">
          <h2>${icon("library")} ${T("Build a practice set", "Crea un conjunto de práctica")}</h2>
          <p class="fine">${T("Search every activity and choose your own set.", "Busca entre todas las actividades y elige tu propio conjunto.")}</p>
          <a class="btn" href="${BASE}/library?grades=${band}&domain=${domain}&level=${level}">${T("Search activities", "Buscar actividades")}${icon("arrow-right")}</a>
        </section>
        <section class="aside-card packet-downloads" aria-labelledby="packetHeading">
          <h2 id="packetHeading">${icon("print")} ${T("Take this practice to paper", "Lleva esta práctica al papel")}</h2>
          <p class="fine">${T(`Illustrated activities, clear directions, and room to respond. Student edition · ${bandLabel(band)}.`, `Actividades ilustradas, instrucciones claras y espacio para responder. Edición para estudiantes · ${bandEs(band)}.`)}</p>
          <div class="row-actions"><a class="btn" href="${BASE}/printables/${packetBase}.html">${T("Preview & print", "Vista previa e imprimir")}</a><a class="btn" href="${BASE}/printables/${packetBase}.docx" download>${T("Download Word packet", "Descargar paquete en Word")}</a></div>
        </section>
      </aside>
      </div>`,
  };
}
