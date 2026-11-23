// One implementation of the Language Lab progress markup, shared by My Progress, the 12-week Road, the
// Teacher Hub and the Families progress page. Everything reads the same LabStateStore record, so a mission
// finished in Games & Worlds moves every surface at once.
//
// Honesty rules (PLATFORM.md): a bar is PRACTICE COVERAGE (how many different games a learner has finished
// in a skill, out of the first few asked), never a score, a level or a predicted ACCESS result. ES / EN+ES
// translate chrome, hints and summaries only; the English practice text is never translated here.
//
// Pure functions: state and `I` (src/i18n.js) come in, html comes out. No DOM, no storage, no clock.
import { BASE, html } from "../util.js";
import { DOMAINS, DOMAIN_NAME_ES, normalizeLabBand } from "./meta.js";
import { labRoutes } from "./query.js";
import { missionCount, readiness, topErrorTags } from "./store.js";
import { ERROR_TAGS, remediationGame } from "./tags.js";

const pct = (v) => Math.max(0, Math.min(100, Math.round((Number(v) || 0) * 100)));
const labBand = (band) => normalizeLabBand(band);
const domainEs = (d) => DOMAIN_NAME_ES[d] || d;
const gamesHref = (band) => `${BASE}/explore/play${band ? `?grades=${band}` : ""}`;

// ── readiness bars ──────────────────────────────────────────────────────────────────────────────
/** One accessible bar: role="progressbar" with a 0..100 value, a text label that says "practice coverage". */
function barHTML(I, domain, value, id) {
  const n = pct(value);
  const label = I.S(
    `${domain} practice coverage`,
    `Cobertura de práctica: ${domainEs(domain).toLowerCase()}`,
  );
  const text = I.S(`${n}% practice coverage`, `${n}% de cobertura de práctica`);
  return html`<li class="lp-row d-${domain.toLowerCase()}">
    <span class="lp-label" id="${id}">${I.T(domain, domainEs(domain))}</span>
    <div
      class="lp-bar"
      role="progressbar"
      aria-labelledby="${id}"
      aria-label="${label}"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow="${n}"
      aria-valuetext="${text}"
    >
      <i style="width:${n}%"></i>
    </div>
    <span class="lp-pct">${n}%</span>
  </li>`;
}

/**
 * The "Language Lab readiness" panel: four domain bars and a plain note. `state` is a LabStateStore record,
 * `band` the lab band ("3-5" | "6-8"; anything else means every band). `compact` is the small Road variant.
 * `idp` keeps element ids unique when two panels share a page.
 */
export function readinessPanelHTML(I, state, { band = "", compact = false, idp = "lp" } = {}) {
  const b = labBand(band);
  const ready = readiness(state, { band: b });
  const total = DOMAINS.reduce((s, d) => s + ready[d], 0);
  const titleId = `${idp}Title`;
  return html`<section
    class="panel lp-panel ${compact ? "is-compact" : ""}"
    aria-labelledby="${titleId}"
  >
    <h2 id="${titleId}">
      ${I.T("Language Lab readiness", "Preparación en el Laboratorio de lenguaje")}
    </h2>
    <p class="fine lp-note">
      ${I.T(
        "Practice coverage: how many different Games & Worlds missions you have finished in each skill. It is not a score and it does not predict an ACCESS result.",
        "Cobertura de práctica: cuántas misiones distintas de Juegos y mundos has terminado en cada destreza. No es una puntuación ni predice un resultado de ACCESS.",
      )}
    </p>
    <ul class="lp-bars">
      ${DOMAINS.map((d) => barHTML(I, d, ready[d], `${idp}-${d}`))}
    </ul>
    ${
      total === 0
        ? html`<p class="lp-empty" role="status">
            ${I.T("No missions finished yet. Finish one in Games & Worlds and a bar starts to fill.", "Aún no hay misiones terminadas. Termina una en Juegos y mundos y una barra empezará a llenarse.")}
            <a href="${gamesHref(b)}">${I.T("Open Games & Worlds", "Abrir Juegos y mundos")}</a>
          </p>`
        : ""
    }
  </section>`;
}

// ── family snapshot ─────────────────────────────────────────────────────────────────────────────
const LOWER_EN = {
  Listening: "listening",
  Reading: "reading",
  Speaking: "speaking",
  Writing: "writing",
};
const listEn = (xs) =>
  xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
const listEs = (xs) =>
  xs.length < 3 ? xs.join(" y ") : `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}`;

/** Plain facts from the store. Nothing here is a score: counts, and which skill has more or less practice. */
export function snapshotFacts(state, { band = "" } = {}) {
  const b = labBand(band);
  const ready = readiness(state, { band: b });
  const values = DOMAINS.map((d) => ready[d]);
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  const missions = missionCount(state, { band: b });
  const spread = hi > lo;
  return {
    missions,
    most: missions && hi > 0 && spread ? DOMAINS.filter((d) => ready[d] === hi) : [],
    least: missions && spread ? DOMAINS.filter((d) => ready[d] === lo) : [],
    pattern: topErrorTags(state, 1, { band: b })[0]?.tag || "",
  };
}

/**
 * The snapshot sentences as bilingual plain strings: [{ key, en, es }]. Kept apart from the markup so a test
 * can read the exact words families get. No score, level, percentage or comparison appears in any line.
 */
export function familySnapshotCopy(facts) {
  if (!facts.missions) {
    return [
      {
        key: "empty",
        en: "No practice missions finished yet. Try one together in Games & Worlds.",
        es: "Todavía no hay misiones de práctica terminadas. Prueben una juntos en Juegos y mundos.",
      },
    ];
  }
  const lines = [
    {
      key: "missions",
      en: `${facts.missions} practice ${facts.missions === 1 ? "mission" : "missions"} finished.`,
      es: `${facts.missions} ${facts.missions === 1 ? "misión de práctica terminada" : "misiones de práctica terminadas"}.`,
    },
  ];
  if (facts.most.length) {
    lines.push({
      key: "most",
      en: `Most practice so far: ${listEn(facts.most.map((d) => LOWER_EN[d]))}.`,
      es: `Lo que más han practicado: ${listEs(facts.most.map((d) => domainEs(d).toLowerCase()))}.`,
    });
  }
  if (facts.least.length) {
    lines.push({
      key: "least",
      en: `A good one to try next: ${listEn(facts.least.map((d) => LOWER_EN[d]))}.`,
      es: `Un buen paso siguiente: ${listEs(facts.least.map((d) => domainEs(d).toLowerCase()))}.`,
    });
  }
  const tag = ERROR_TAGS[facts.pattern];
  if (tag) {
    lines.push({
      key: "pattern",
      en: `One English pattern to practice together: ${tag.en.toLowerCase()}. ${tag.hintEn}`,
      es: `Un patrón del inglés para practicar juntos: ${tag.es.toLowerCase()}. ${tag.hintEs}`,
    });
  }
  return lines;
}

export const FAMILY_SNAPSHOT_NOTE = Object.freeze({
  en: "This only counts practice done on this device. It does not grade your child and it does not compare them with anyone.",
  es: "Solo cuenta la práctica hecha en este dispositivo. No mide a su hijo ni lo compara con nadie.",
});

/** The "Progress snapshot" for families: a short list of plain sentences, the single pattern with a practice link. */
export function familySnapshotHTML(I, state, { band = "", idp = "fs" } = {}) {
  const b = labBand(band);
  const facts = snapshotFacts(state, { band: b });
  const lines = familySnapshotCopy(facts);
  const titleId = `${idp}Title`;
  return html`<section class="panel lp-snapshot" aria-labelledby="${titleId}">
    <h2 id="${titleId}">${I.T("Progress snapshot", "Resumen del progreso")}</h2>
    <ul class="lp-snap-lines">
      ${lines.map((l) => html`<li data-snap="${l.key}">${I.T(l.en, l.es)}</li>`)}
    </ul>
    ${
      facts.pattern
        ? html`<p class="no-print">
            <a
              class="btn small"
              href="${labRoutes.game(remediationGame(facts.pattern), { band: b, lang: I.mode })}"
              >${I.T("Practice this together", "Practiquen esto juntos")}</a
            >
          </p>`
        : ""
    }
    <p class="fine">${I.T(FAMILY_SNAPSHOT_NOTE.en, FAMILY_SNAPSHOT_NOTE.es)}</p>
  </section>`;
}

// ── teacher card ────────────────────────────────────────────────────────────────────────────────
/**
 * Teacher Hub card: the two most frequent language patterns in this device's Lab record, each with a plain
 * EN and ES name and hint and a direct "Practice this" link to the matching game. The record holds no names,
 * so neither does the card. The hub is an English page: Spanish is marked with lang="es" inline.
 */
export function topPatternsCardHTML(state, { band = "" } = {}) {
  const b = labBand(band);
  const top = topErrorTags(state, 2, { band: b });
  return html`<section class="panel lp-patterns" aria-labelledby="lpPatternsTitle">
    <h2 id="lpPatternsTitle">
      Top 2 language patterns <span lang="es">· Dos patrones principales</span>
    </h2>
    ${
      top.length
        ? html`<ol class="lp-pattern-list">
            ${top.map(({ tag, count }) => {
              const t = ERROR_TAGS[tag];
              return html`<li data-tag="${tag}">
                <strong>${t.en}</strong> <span lang="es">· ${t.es}</span>
                <span class="fine"
                  >(${count} ${count === 1 ? "time" : "times"} in practice on this device)</span
                >
                <p>${t.hintEn}</p>
                <p lang="es">${t.hintEs}</p>
                <a class="btn small" href="${labRoutes.game(remediationGame(tag), { band: b })}"
                  >Practice this <span lang="es">· Practicar esto</span></a
                >
              </li>`;
            })}
          </ol>`
        : html`<p class="lp-empty" role="status">
            No language patterns recorded on this device yet. They appear after students use the
            sentence games in Games &amp; Worlds.
          </p>`
    }
    <p class="fine">
      Patterns are tallied from Language Lab practice on this device only. They hint at what to
      reteach; they are not grades and carry no student names.
    </p>
  </section>`;
}
