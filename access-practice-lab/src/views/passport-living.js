// Passport · Living Language Portfolio: the learner's own saved evidence, arranged as a portfolio.
// Domain practice history (counts and dates from saved records), Language World work (earlier and
// revised writing side by side, speaking plan and self-check), and next steps with the reason that
// triggered each one. No percentages, levels, predictions or invented achievements.
import { EXHIBITIONS } from "../content/exhibition.js";
import { bandState, evaluateWriting, progress, suggestion } from "../lang/exhibition.js";
import { allRecords } from "../store.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, formatDate, html, icon } from "../util.js";
import { loadExhibition } from "./exhibition.js";

/** Saved dates are full ISO timestamps; formatDate reads the YYYY-MM-DD part. */
const day = (iso) => formatDate(String(iso || "").slice(0, 10));
const STEP = {
  listen: ["Listen", "Escuchar"],
  read: ["Read", "Leer"],
  speak: ["Speak", "Hablar"],
  write: ["Write", "Escribir"],
};

/** Per-domain history for one band: activities with a saved result, how many used help, last date. */
export function domainHistory(band) {
  const out = Object.fromEntries(
    CORE_DOMAINS.map((d) => [d, { practiced: 0, helped: 0, last: "" }]),
  );
  for (const { band: b, domain, record } of allRecords()) {
    if (b !== band || !out[domain]) continue;
    for (const [id, r] of Object.entries(record.results || {})) {
      if (!r?.date) continue;
      out[domain].practiced++;
      if (record.supportUsed?.[id]) out[domain].helped++;
      if (r.date > out[domain].last) out[domain].last = r.date;
    }
  }
  return out;
}

function historyHTML(I, band) {
  const hist = domainHistory(band);
  return html`<ul class="lp-history">
    ${CORE_DOMAINS.map((d) => {
      const h = hist[d];
      const meta = DOMAIN_META[d];
      return html`<li class="d-${d.toLowerCase()}">
        <span class="lp-history-ico" aria-hidden="true">${icon(meta.icon)}</span>
        <span class="lp-history-text">
          <strong>${I.T(meta.name, meta.es)}</strong>
          <span
            >${h.practiced ? I.T(`${h.practiced} ${h.practiced === 1 ? "activity" : "activities"} practiced · ${h.helped} with help`, `${h.practiced} ${h.practiced === 1 ? "actividad practicada" : "actividades practicadas"} · ${h.helped} con ayuda`) : I.T("Not practiced yet", "Aún sin práctica")}</span
          >
          ${h.last ? html`<span class="fine">${I.T(`Last: ${day(h.last)}`, `Última: ${day(h.last)}`)}</span>` : ""}
        </span>
      </li>`;
    })}
  </ul>`;
}

function writingHTML(I, scenario, band) {
  const spec = scenario.tasks.write;
  const sources = [...scenario.tasks.read.sentences, ...scenario.tasks.listen.script];
  const attempts = (band.tasks.write.attempts || []).filter((a) => a.drafts?.length);
  if (!attempts.length)
    return html`<p class="fine">
      ${I.T("Your Language World writing appears here after you ask for feedback on a draft.", "Tu escritura del Mundo del lenguaje aparece aquí después de pedir comentarios sobre un borrador.")}
    </p>`;
  const label = (id) => spec.feedback.find((r) => r.id === id)?.label || id;
  return attempts.map((a, n) => {
    const first = a.drafts[0];
    const last = a.drafts.at(-1);
    const shows = (d) => evaluateWriting(d.text, spec, sources).shows.map((s) => label(s.id));
    return html`<article class="lp-draft">
      <h4>
        ${a.prompt === "transfer" ? I.T("New attempt", "Nuevo intento") : I.T(`Attempt ${n + 1}`, `Intento ${n + 1}`)}
        ·
        ${a.kind === "independent" ? I.T("on my own", "por mi cuenta") : I.T("with support", "con apoyo")}
        ·
        ${I.T(`${a.drafts.length} ${a.drafts.length === 1 ? "draft" : "drafts"}`, `${a.drafts.length} ${a.drafts.length === 1 ? "borrador" : "borradores"}`)}
      </h4>
      <div class="lp-draft-pair ${a.drafts.length > 1 ? "" : "is-single"}">
        <figure>
          <figcaption>
            ${a.drafts.length > 1 ? I.T("Earlier draft", "Borrador anterior") : I.T("Draft", "Borrador")}
            · ${day(first.at)}
          </figcaption>
          <p lang="en">${first.text}</p>
          <p class="fine">${I.T("Shows:", "Muestra:")} ${shows(first).join(", ") || "—"}</p>
        </figure>
        ${
          a.drafts.length > 1
            ? html`<figure>
                <figcaption>
                  ${I.T("Revised draft", "Borrador revisado")} · ${day(last.at)}
                </figcaption>
                <p lang="en">${last.text}</p>
                <p class="fine">${I.T("Shows:", "Muestra:")} ${shows(last).join(", ") || "—"}</p>
              </figure>`
            : ""
        }
      </div>
    </article>`;
  });
}

/** The portfolio section placed at the top of the Passport. */
export function livingPortfolioHTML(I, band) {
  const scenario = EXHIBITIONS[band] || EXHIBITIONS["6-8"];
  const state = bandState(loadExhibition(), scenario.band);
  const p = progress(scenario, state);
  const tip = suggestion(scenario, state);
  const speak = state.tasks.speak;
  const checks = Object.values(speak.checks || {}).filter(Boolean).length;
  return html`<section class="lp" aria-labelledby="lpTitle">
    <div class="lp-head">
      <p class="eyebrow">${I.T("Living Language Portfolio", "Portafolio de lenguaje vivo")}</p>
      <h2 id="lpTitle">${I.T("Evidence from my own work", "Evidencia de mi propio trabajo")}</h2>
      <p class="fine">
        ${I.T("Everything here comes from work saved on this device: counts, dates and your own words. Nothing here is a score, a level or a prediction.", "Todo aquí viene del trabajo guardado en este dispositivo: conteos, fechas y tus propias palabras. Nada aquí es un puntaje, un nivel ni una predicción.")}
      </p>
    </div>
    <div class="lp-grid">
      <section class="lp-card" aria-labelledby="lpHistTitle">
        <h3 id="lpHistTitle">
          ${I.T("Practice history by skill", "Historial de práctica por destreza")}
        </h3>
        ${historyHTML(I, band)}
      </section>
      <section
        class="lp-card lp-world"
        id="exhibitionWork"
        aria-labelledby="lpWorldTitle"
        tabindex="-1"
      >
        <h3 id="lpWorldTitle">
          ${I.T("Language World", "Mundo del lenguaje")} · <span lang="en">${scenario.title}</span>
        </h3>
        <ol class="lp-steps">
          ${p.steps.map(({ step, status }) => html`<li class="is-${status}"><span>${I.T(...STEP[step])}</span><span class="fine">${status === "done" ? I.T("done", "hecho") : status === "started" ? I.T("in progress", "en progreso") : I.T("not started", "sin empezar")}</span></li>`)}
        </ol>
        ${speak.said || checks ? html`<p class="fine">${I.T(`Speaking: said aloud${speak.recorded ? ` (${speak.recorded} recorded, not saved)` : ""} · ${checks} of 4 self-checks${speak.revised ? " · chose an improvement" : ""}.`, `Hablar: lo dijiste en voz alta${speak.recorded ? ` (${speak.recorded} grabado, no guardado)` : ""} · ${checks} de 4 autoevaluaciones${speak.revised ? " · elegiste una mejora" : ""}.`)}</p>` : ""}
        ${writingHTML(I, scenario, state)}
      </section>
    </div>
    <div class="lp-next">
      <h3>${icon("flag")} ${I.T("Suggested next", "Siguiente sugerido")}</h3>
      ${tip ? html`<p><a href="${BASE}/exhibition/${tip.step}?grades=${band}">${I.T(`Language World · ${STEP[tip.step][0]}`, `Mundo del lenguaje · ${STEP[tip.step][1]}`)}</a> — ${tip.reason === "transfer" ? I.T("you revised with support; a new attempt on your own shows what you can do now.", "revisaste con apoyo; un nuevo intento por tu cuenta muestra lo que puedes hacer ahora.") : I.T(`it is the first of the four steps you have not finished (${p.done} of 4 done).`, `es el primero de los cuatro pasos que no has terminado (${p.done} de 4 hechos).`)}</p>` : html`<p>${I.T("You finished all four Language World steps, including a new attempt on your own.", "Terminaste los cuatro pasos del Mundo del lenguaje, incluido un nuevo intento por tu cuenta.")}</p>`}
      <p class="fine">
        <a href="${BASE}/portfolio?grades=${band}">${I.T("Open my portfolio and showcase", "Abrir mi portafolio y muestra")}</a>
        ·
        <a href="${BASE}/collection?grades=${band}">${I.T("My collection book", "Mi libro de colección")}</a>
      </p>
      <p class="fine">
        <a href="#backupTitle"
          >${I.T("Back up or move your work", "Respaldar o mover tu trabajo")}</a
        >
        ·
        ${I.T("Your Language World work is included in the export code. Recordings are never included.", "Tu trabajo del Mundo del lenguaje se incluye en el código de exportación. Las grabaciones nunca se incluyen.")}
      </p>
    </div>
  </section>`;
}


/**
 * "My Journey evidence": Before/After cards and the supported-versus-independent tally from the Learning Journey.
 * Empty (no markup at all) until the learner has started a mission, so the Passport is unchanged for everyone else.
 * The Journey modules load on demand and any failure leaves the Passport as it was.
 */
export async function journeyEvidenceHTML(I, band, ledger) {
  try {
    const { loadJourney } = await import("../journey/state.js");
    const state = loadJourney();
    const missions = state?.bands?.[band]?.missions || {};
    if (!Object.values(missions).some((m) => Object.keys(m?.steps || {}).length)) return "";
    const { growthSectionHTML } = await import("../journey/ui/growth.js");
    return html`<section class="lp lp-journey" id="journeyEvidence" aria-labelledby="lpJourneyTitle">
      <div class="lp-head">
        <p class="eyebrow">${I.T("Learning Journey", "Viaje de aprendizaje")}</p>
        <h2 id="lpJourneyTitle">${I.T("My Journey evidence", "Evidencia de mi viaje")}</h2>
      </div>
      ${growthSectionHTML(I, state, ledger, band)}
    </section>`;
  } catch {
    return "";
  }
}
