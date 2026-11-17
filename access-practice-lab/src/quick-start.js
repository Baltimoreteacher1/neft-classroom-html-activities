// "Jump in": one tap from a hub page into a short practice set. Four skill tiles (Listen, Read, Speak, Write) and
// one mixed set, each a five-activity playlist for the learner's grade band and support choice, unfinished work
// first. The support choice is the same `practicePlan.level` preference the home page's plan uses, so the two never
// disagree. Sized by age: grades K–3 get big picture tiles with one-word labels and a Hear button on each; grades
// 3–8 get a short line saying what the set practices.
import { isEarlyBand } from "./bands.js";
import { bandRows } from "./content.js";
import { activeGradeFocus, inGradeFocus } from "./grade-focus.js";
import { loadRecord } from "./store.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, TIERS, esc, html, icon, raw } from "./util.js";

const RANGE_ES = { A: "Más apoyo", B: "Algo de apoyo", C: "Más independencia" };

export const SET_SIZE = 5;
const minutes = (rows) => rows.reduce((n, r) => n + (Number(r.minutes) || 5), 0);
// Printable worksheets are teacher-led paper work, not a tap-and-go practice item.
const ON_SCREEN = (row) => row.type !== "worksheet";

const SKILL_COPY = {
  Listening: {
    early: ["Listen", "Escucha"],
    line: ["Hear it, then answer.", "Escucha y responde."],
  },
  Reading: {
    early: ["Read", "Lee"],
    line: ["Read a short text, then answer.", "Lee un texto corto y responde."],
  },
  Speaking: {
    early: ["Talk", "Habla"],
    line: ["Plan, record and listen back.", "Planea, graba y escúchate."],
  },
  Writing: {
    early: ["Write", "Escribe"],
    line: ["Build sentences with word help.", "Escribe oraciones con ayuda."],
  },
};

/** The support choice a set uses: the saved plan level when this band ships it, else the band's natural start. */
export function jumpLevel(prefs, band, levels) {
  const saved = prefs?.practicePlan?.level;
  if (levels.includes(saved)) return saved;
  if (isEarlyBand(band) || !levels.includes("B")) return levels[0] || "A";
  return "B";
}

/**
 * Pick a set: unfinished activities first, in content order, then finished ones to practise again. Pure: `rows` are
 * index rows (content.js bandRows) and `isDone(row)` says whether the learner finished one.
 */
export function pickSet(rows, isDone, { domain = "", n = SET_SIZE } = {}) {
  const pool = rows.filter((r) => ON_SCREEN(r) && (!domain || r.domain === domain));
  const fresh = pool.filter((r) => !isDone(r));
  const again = pool.filter((r) => isDone(r));
  if (domain) return [...fresh, ...again].slice(0, n);
  // Mixed: take turns across the four skills so one set touches every domain.
  const lanes = CORE_DOMAINS.map((d) => [
    ...fresh.filter((r) => r.domain === d),
    ...again.filter((r) => r.domain === d),
  ]);
  const out = [];
  for (let i = 0; out.length < n && lanes.some((l) => l.length > i); i++)
    for (const lane of lanes) if (lane[i] && out.length < n) out.push(lane[i]);
  return out;
}

/** A set link: a plain playlist URL (works without script, in a new tab) plus what src/main.js needs to start it
 * as a practice session. */
export const jumpSetAttrs = (band, rows, title) =>
  raw(`href="${esc(setHref(band, rows, title))}" data-jump-set="${esc(rows.map((r) => r.id).join(","))}" data-jump-minutes="${minutes(rows)}" data-jump-title="${esc(title)}"`);

export const setHref = (band, rows, title) =>
  `${BASE}/play?${new URLSearchParams({ ids: rows.map((r) => r.id).join(","), grades: band, t: title })}`;

/**
 * The practice pool behind every Jump in set: the band's four-skill rows in the grade focus, the support levels it
 * ships, the chosen level (`level` when the band ships it, else the saved plan level), the rows at that level and
 * whether the learner finished one. `ctx` supplies band and prefs.
 */
export async function practicePool(ctx, { level: want = "" } = {}) {
  const band = ctx.band;
  const all = await bandRows(band).catch(() => []);
  const focus = activeGradeFocus(ctx.prefs, band);
  const rows = all.filter((r) => CORE_DOMAINS.includes(r.domain) && inGradeFocus(r.grades, focus));
  const levels = ["A", "B", "C"].filter((l) => rows.some((r) => r.level === l));
  const level = levels.includes(want) ? want : jumpLevel(ctx.prefs, band, levels);
  const atLevel = rows.filter((r) => r.level === level);
  const done = new Map();
  const isDone = (r) => {
    if (!done.has(r.domain))
      done.set(r.domain, new Set(loadRecord(band, r.domain, level).complete));
    return done.get(r.domain).has(r.id);
  };
  return { band, rows, levels, level, atLevel, isDone };
}

/** The Jump in panel. `ctx` supplies band and prefs; returns "" when the band has no activities. */
export async function jumpInHTML(ctx, I, { heading = true } = {}) {
  const { band, rows, levels, level, atLevel, isDone } = await practicePool(ctx);
  if (!rows.length) return "";
  const early = isEarlyBand(band);
  const tierName = (l) => I.T(TIERS[l].name, TIERS[l].es);
  const mixed = pickSet(atLevel, isDone);
  const tiles = CORE_DOMAINS.map((d) => ({
    d,
    set: pickSet(atLevel, isDone, { domain: d }),
  })).filter((t) => t.set.length);
  const left = (d) => atLevel.filter((r) => ON_SCREEN(r) && r.domain === d && !isDone(r)).length;
  return html`<section class="jump-in ${early ? "is-early" : ""}" aria-labelledby="jumpInTitle">
    ${
      heading
        ? html`<div class="jump-head">
            <h2 id="jumpInTitle">
              ${early ? I.T("Let's practice!", "¡A practicar!") : I.T("Jump in: 5 quick activities", "Empieza ya: 5 actividades rápidas")}
            </h2>
            ${early ? "" : html`<p>${I.T("Pick a skill. Your set starts with work you have not done yet.", "Elige una destreza. Tu grupo empieza con lo que todavía no has hecho.")}</p>`}
          </div>`
        : html`<h2 id="jumpInTitle" class="visually-hidden">${I.T("Jump in", "Empieza ya")}</h2>`
    }
    ${
      levels.length > 1
        ? html`<div
            class="jump-levels"
            role="group"
            aria-label="${I.S("How much help?", "¿Cuánta ayuda?")}"
          >
            <span class="jump-levels-label">${I.T("How much help?", "¿Cuánta ayuda?")}</span>
            ${levels.map(
              (l) =>
                html`<button
                  type="button"
                  class="jump-level"
                  data-jump-level="${l}"
                  aria-pressed="${String(l === level)}"
                >
                  ${tierName(l)}<span>${I.T(TIERS[l].range, RANGE_ES[l])}</span>
                </button>`,
            )}
          </div>`
        : ""
    }
    <ul class="jump-tiles" role="list">
      ${
        mixed.length
          ? html`<li class="jump-tile jump-mixed">
              <a
                ${jumpSetAttrs(band, mixed, I.S("Quick practice · all four skills", "Práctica rápida · las cuatro destrezas"))}
              >
                <span class="jump-icon" aria-hidden="true">${icon("sparkle")}</span>
                <strong
                  >${early ? I.T("Play a mix", "Mezcla") : I.T("Mixed set", "Grupo mixto")}</strong
                >
                ${early ? "" : html`<span class="jump-line">${I.T(`${mixed.length} activities, every skill · about ${minutes(mixed)} min`, `${mixed.length} actividades, todas las destrezas · unos ${minutes(mixed)} min`)}</span>`}
                <span class="jump-go">${I.T("Start", "Empezar")} ${icon("arrow-right")}</span>
              </a>
            </li>`
          : ""
      }
      ${tiles.map(({ d, set }) => {
        const m = DOMAIN_META[d];
        const c = SKILL_COPY[d];
        const label = early ? I.T(...c.early) : I.T(m.name, m.es);
        return html`<li class="jump-tile d-${d.toLowerCase()}">
          <a
            ${jumpSetAttrs(band, set, I.S(`Quick practice · ${m.name}`, `Práctica rápida · ${m.es}`))}
          >
            <span class="jump-icon" aria-hidden="true">${icon(m.icon)}</span>
            <strong>${label}</strong>
            ${early ? "" : html`<span class="jump-line">${I.T(...c.line)}</span>`}
            <span class="jump-meta"
              >${left(d) ? I.T(`${left(d)} new`, `${left(d)} nuevas`) : I.T("Practice again", "Practicar otra vez")}</span
            >
          </a>
          ${early ? html`<button type="button" class="jump-hear" data-say="${c.early[0]}" aria-label="${I.S(`Hear: ${c.early[0]}`, `Escuchar: ${c.early[0]}`)}">${icon("volume")}</button>` : ""}
        </li>`;
      })}
    </ul>
    ${early ? "" : html`<p class="jump-more"><a href="${BASE}/library?grades=${band}">${I.T("Choose exact activities instead", "Elegir actividades exactas")} ${icon("arrow-right")}</a></p>`}
  </section>`;
}

