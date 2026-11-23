// Vocabulary Academy — the Word Galaxy, a unit activity. The unit's words are stars in a night sky. Each round shows two
// stars and asks "How are these words connected?": same meaning, opposites, a shared word part, the same group, or not
// connected at all. A right answer draws a glowing line between the stars (its STYLE says which connection it is, so colour
// is never the only clue) and the map grows into labelled constellations. A miss never says what the connection is: it asks
// the learner to try again and offers free clues about a word's meaning. The finish shows the whole galaxy and the stars that
// stayed on their own. Every connection comes from the unit's own data: `syn`, `ant`, `morph` parts and `family`, the
// relation groups. Early grades use same meaning, opposites and pictures only. Nothing is timed.
// Built on the shared game kit (see ./vault.js): supports, hints, keys, resume and the finish card come from it.
import { hashSeed } from "../rng.js";
import { clean } from "../games/text.js";
import { recordResult } from "../model.js";
import { fbHTML, hintButton, html, icon, mcAct, mountGame, raw } from "../games/kit.js";
import {
  BAND_RELS,
  MAP,
  MIN_ROUNDS,
  REL,
  REL_ORDER,
  bandRels,
  buildGalaxy,
  constellationsOf,
  drawnRounds,
  layoutStars,
  loneStars,
} from "./galaxy-engine.js";
import { workOf } from "./work.js";

export * from "./galaxy-engine.js";
export const TITLE = ["Word Galaxy", "Galaxia de palabras"];

// ── drawing ─────────────────────────────────────────────────────────────────────────────────────
const f1 = (n) => Math.round(n * 10) / 10;
const starPoints = (cx, cy, R, r) =>
  Array.from({ length: 10 }, (_, k) => {
    const ang = -Math.PI / 2 + (k * Math.PI) / 5;
    const rad = k % 2 ? r : R;
    return `${f1(cx + rad * Math.cos(ang))},${f1(cy + rad * Math.sin(ang))}`;
  }).join(" ");
const trunc = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const SKY_DUST = Array.from({ length: 36 }, (_, i) => {
  const h = hashSeed(`dust${i}`);
  return { x: 6 + (h % 388), y: 6 + ((h >>> 9) % 408), r: 0.6 + ((h >>> 20) % 3) * 0.35 };
});

function lineSVG(p, q, rel, fresh) {
  const cls = `va-gal-link${fresh ? " is-new" : ""}`;
  const seg = (dx, dy, extra = "") =>
    `<line class="${cls} ${extra}" data-rel="${rel}" x1="${f1(p.x + dx)}" y1="${f1(p.y + dy)}" x2="${f1(q.x + dx)}" y2="${f1(q.y + dy)}"/>`;
  if (rel !== "group") return seg(0, 0);
  const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
  const nx = ((q.y - p.y) / len) * 2.6;
  const ny = (-(q.x - p.x) / len) * 2.6;
  return seg(nx, ny) + seg(-nx, -ny);
}

function starSVG(st, p, linked) {
  const x = Math.min(Math.max(p.x, 58), MAP.w - 58);
  const shape = st.unit
    ? `<polygon class="va-gal-shape" points="${starPoints(p.x, p.y, 11, 4.8)}"/>`
    : `<circle class="va-gal-shape" cx="${f1(p.x)}" cy="${f1(p.y)}" r="6"/>`;
  return `<g class="va-gal-star" data-unit="${st.unit}" data-linked="${linked > 0}">${shape}<text class="va-gal-name" lang="en" x="${f1(x)}" y="${f1(p.y + 27)}" text-anchor="middle">${esc(st.hw)}</text></g>`;
}
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function lineSwatch(rel) {
  if (rel === "none")
    return raw(`<span class="va-gal-swatch va-gal-swatch-none" aria-hidden="true">∅</span>`);
  const y = rel === "group" ? [4.6, 9.4] : [7];
  const lines = y
    .map((v) => `<line class="va-gal-link" data-rel="${rel}" x1="3" y1="${v}" x2="41" y2="${v}"/>`)
    .join("");
  return raw(
    `<svg class="va-gal-swatch" viewBox="0 0 44 14" width="44" height="14" aria-hidden="true" focusable="false">${lines}</svg>`,
  );
}

const relLabel = (I, rel) => I.T(REL[rel].en, REL[rel].es);
const lineName = (I, rel) => I.S(REL[rel].lineEn, REL[rel].lineEs);

/** The constellation's name as one plain string for the SVG label. */
function nameOf(c, I) {
  if (c.label) return `✦ ${trunc(c.label, 26)}`;
  if (c.rels.length === 1) return `✦ ${trunc(I.S(REL[c.rels[0]].en, REL[c.rels[0]].es), 26)}`;
  return `✦ ${trunc(I.S(`Constellation ${c.n}`, `Constelación ${c.n}`), 26)}`;
}

/** The star map as SVG markup, and the same facts as text (the accessible alternative). */
function mapSVG(s, env) {
  const I = env.I;
  const pos = layoutStars(s);
  const done = s.rounds.map((r, i) => ({ r, i })).filter(({ r }) => r.mc.done);
  const edges = done.filter(({ r }) => r.rel !== "none");
  const degree = new Map();
  for (const { r } of edges) for (const k of [r.a, r.b]) degree.set(k, (degree.get(k) || 0) + 1);
  const cons = constellationsOf(s).filter((c) => c.keys.length >= 2);
  const dust = SKY_DUST.map(
    (d) => `<circle class="va-gal-dust" cx="${d.x}" cy="${d.y}" r="${d.r}"/>`,
  ).join("");
  const links = edges.map(({ r, i }) => lineSVG(pos[r.a], pos[r.b], r.rel, i === s.fresh)).join("");
  const stars = Object.values(s.stars)
    .filter((st) => pos[st.key])
    .map((st) => starSVG(st, pos[st.key], degree.get(st.key) || 0))
    .join("");
  const names = cons
    .map((c) => {
      const ps = c.keys.map((k) => pos[k]);
      const x = Math.min(Math.max(ps.reduce((a, p) => a + p.x, 0) / ps.length, 90), MAP.w - 90);
      const y = Math.max(Math.min(...ps.map((p) => p.y)) - 20, 16);
      return `<text class="va-gal-cname" ${c.label ? 'lang="en" ' : ""}x="${f1(x)}" y="${f1(y)}" text-anchor="middle">${esc(nameOf(c, I))}</text>`;
    })
    .join("");
  const summary = I.S(
    `Star map with ${Object.keys(pos).length} stars and ${edges.length} connections. The text list of connections follows the map.`,
    `Mapa de estrellas con ${Object.keys(pos).length} estrellas y ${edges.length} conexiones. La lista de conexiones en texto sigue al mapa.`,
  );
  return raw(
    `<svg class="va-gal-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" role="img" aria-label="${esc(summary)}" focusable="false"><rect class="va-gal-sky" width="${MAP.w}" height="${MAP.h}" rx="14"/><g aria-hidden="true">${dust}</g><g class="va-gal-links">${links}</g>${stars}${names}</svg>`,
  );
}

function connectionList(s, env) {
  const I = env.I;
  const rows = s.rounds.filter((r) => r.mc.done);
  if (!rows.length)
    return html`<p class="vag-fine">
      ${I.T("No connections yet. Answer a pair to draw the first line.", "Todavía no hay conexiones. Responde una pareja para trazar la primera línea.")}
    </p>`;
  const name = (k) => html`<strong lang="en">${s.stars[k]?.hw || k}</strong>`;
  return html`<ul class="va-gal-conns">
    ${rows.map((r) =>
      r.rel === "none"
        ? html`<li>
            ${name(r.a)} · ${name(r.b)} —
            ${I.T("not connected (no line)", "no están conectadas (sin línea)")}
          </li>`
        : html`<li>
            ${name(r.a)} — ${name(r.b)} — ${relLabel(I, r.rel)} (${lineName(I, r.rel)})
          </li>`,
    )}
  </ul>`;
}

function legendHTML(s, env) {
  const I = env.I;
  const rels = [...bandRels(env.pool.band)].sort(
    (p, q) => REL_ORDER.indexOf(p) - REL_ORDER.indexOf(q),
  );
  return html`<ul class="va-gal-legend" aria-label="${I.S("Line styles", "Estilos de línea")}">
    ${rels.map((r) => html`<li>${lineSwatch(r)} <span>${relLabel(I, r)}: ${lineName(I, r)}</span></li>`)}
    <li>
      <span class="va-gal-key va-gal-key-star" aria-hidden="true">★</span>
      <span>${I.T("a word from this unit", "una palabra de la unidad")}</span>
    </li>
    <li>
      <span class="va-gal-key va-gal-key-dot" aria-hidden="true">●</span>
      <span>${I.T("a partner word", "una palabra compañera")}</span>
    </li>
  </ul>`;
}

function mapBlock(s, env, { final = false } = {}) {
  const I = env.I;
  const edges = drawnRounds(s).length;
  const cons = constellationsOf(s);
  return html`<section class="va-gal-mapbox" aria-label="${I.S("Your galaxy", "Tu galaxia")}">
    <h3 class="va-gal-h">${I.T("Your galaxy", "Tu galaxia")}</h3>
    <figure class="va-gal-fig">
      ${mapSVG(s, env)}
      <figcaption class="va-gal-cap">
        ${I.T(`${edges} connections, ${cons.length} constellations so far.`, `${edges} conexiones, ${cons.length} constelaciones hasta ahora.`)}
      </figcaption>
    </figure>
    ${legendHTML(s, env)}
    ${
      final
        ? html`<h4 class="va-gal-h2">${I.T("Every connection", "Todas las conexiones")}</h4>
            ${connectionList(s, env)}`
        : html`<details class="va-gal-alt" ${s.altOpen ? "open" : ""}>
            <summary data-gal-alt data-fk="alt">
              ${I.T("Connections so far, as a list", "Conexiones hasta ahora, en lista")}
            </summary>
            ${connectionList(s, env)}
          </details>`
    }
  </section>`;
}

// ── the question ────────────────────────────────────────────────────────────────────────────────
function starCard(s, key, env) {
  const st = s.stars[key];
  const word = st?.unit ? env.pool.byId.get(st.id) : null;
  const pic =
    word?.visual && env.sup.picture
      ? html`<div class="va-gal-pic">${env.pic(word, "lg")}</div>`
      : "";
  return html`<div class="va-gal-card" data-unit="${Boolean(st?.unit)}">
    ${pic}
    <p class="va-gal-word">
      <span class="va-gal-mark" aria-hidden="true">${raw(st?.unit ? "★" : "●")}</span>
      <strong lang="en">${st?.hw}</strong>
    </p>
    ${env.speakBtn(st?.hw, "")}${word ? env.gloss(word) : ""}
  </div>`;
}

function choiceButtons(r, env) {
  const { q, mc } = r;
  const I = env.I;
  return html`<div
    class="vag-choices va-gal-choices"
    role="group"
    aria-label="${I.S("Connections", "Conexiones")}"
  >
    ${q.rels.map((rel, i) => {
      if (mc.hidden.includes(i)) return "";
      const wrong = mc.wrong.includes(i);
      const right = mc.done && i === q.answer;
      const state = right ? "ok" : wrong ? "no" : "";
      const sr = right
        ? I.S("Correct choice. ", "Opción correcta. ")
        : wrong
          ? I.S("Not this one. ", "Esta no. ")
          : "";
      return html`<button
        type="button"
        class="vag-choice"
        data-pick="${i}"
        data-n="${i + 1}"
        data-fk="pick-${i}"
        data-state="${state}"
        aria-disabled="${wrong || mc.done ? "true" : "false"}"
      >
        <span class="vag-n" aria-hidden="true">${i + 1}</span
        ><span class="vag-ct"><span class="vag-sr">${sr}</span>${relLabel(I, rel)}</span
        >${lineSwatch(rel)}${right ? icon("check") : wrong ? icon("x") : ""}
      </button>`;
    })}
  </div>`;
}

function hintLine(h, env) {
  const I = env.I;
  const w = env.pool.byId.get(h.id);
  if (!w) return "";
  if (h.k === "ex" && w.ex)
    return html`${I.T("Here is a sentence with", "Una oración con")}
      <strong lang="en">${w.hw}</strong>: <span lang="en">${clean(w.ex)}</span>`;
  return html`${I.T("Think about the meaning of", "Piensa en el significado de")}
    <strong lang="en">${w.hw}</strong>:
    <span lang="en">${clean(w.def)}</span>`;
}

/** Why the connection is right, said only after a right answer. */
function whyHTML(r, env, s) {
  const I = env.I;
  const A = html`<strong lang="en">${s.stars[r.a]?.hw}</strong>`;
  const B = html`<strong lang="en">${s.stars[r.b]?.hw}</strong>`;
  const tail =
    r.rel === "none"
      ? I.T("The two stars stay apart. No line.", "Las dos estrellas quedan separadas. Sin línea.")
      : I.T("A glowing line joins the two stars.", "Una línea brillante une las dos estrellas.");
  const lead = {
    syn: () =>
      html`${A} ${I.T("and", "y")} ${B}
      ${I.T("mean almost the same thing.", "significan casi lo mismo.")}`,
    ant: () => html`${A} ${I.T("and", "y")} ${B} ${I.T("are opposites.", "son opuestos.")}`,
    morph: () =>
      r.q.part
        ? html`${A} ${I.T("and", "y")} ${B} ${I.T("share the word part", "comparten la parte")}
            <strong lang="en">${r.q.part}</strong>.`
        : html`${A} ${I.T("and", "y")} ${B}
          ${I.T("are in the same word family.", "son de la misma familia de palabras.")}`,
    group: () =>
      html`${A} ${I.T("and", "y")} ${B} ${I.T("belong together:", "van juntas:")}
        <span lang="en">${r.q.group}</span>.`,
    none: () =>
      html`${A} ${I.T("and", "y")} ${B}
      ${I.T("are not connected in this unit.", "no están conectadas en esta unidad.")}`,
  }[r.rel]();
  return html`${lead} ${tail}`;
}

function feedback(r, env, s) {
  const I = env.I;
  const { mc } = r;
  if (mc.done) return fbHTML("ok", whyHTML(r, env, s), I);
  const parts = [];
  if (mc.wrong.length)
    parts.push(
      fbHTML(
        "retry",
        I.T(
          "Not that connection. Try again. You can retry as often as you like.",
          "Esa no es la conexión. Inténtalo otra vez. Puedes intentar las veces que quieras.",
        ),
        I,
      ),
    );
  r.q.hints.slice(0, Math.min(2, mc.hints)).forEach((h, k) => {
    parts.push(
      fbHTML(
        "hint",
        html`${hintLine(h, env)}${k === 1 && mc.hidden.length ? html` ${I.T("Some choices were taken away.", "Se quitaron algunas opciones.")}` : ""}`,
        I,
      ),
    );
  });
  return html`${parts}`;
}

function view(s, env) {
  const I = env.I;
  const r = s.rounds[s.i];
  const last = s.i === s.rounds.length - 1;
  return html`<div class="va-gal">
    <div class="vag-qcard va-gal-q" data-type="galaxy">
      <p class="vag-qtype">
        <strong>${I.T("Pair", "Pareja")} ${s.i + 1} ${I.T("of", "de")} ${s.rounds.length}</strong>
      </p>
      <div class="vag-stem">
        <p class="vag-q">
          ${I.T("How are these words connected?", "¿Cómo se relacionan estas palabras?")}
        </p>
      </div>
      <div
        class="va-gal-pair"
        role="group"
        aria-label="${I.S("The two stars", "Las dos estrellas")}"
      >
        ${starCard(s, r.a, env)}<span class="va-gal-between" aria-hidden="true">${raw("✦")}</span
        >${starCard(s, r.b, env)}
      </div>
      ${choiceButtons(r, env)}
      <div class="vag-actions">
        ${hintButton(r.mc, env)}
        ${r.mc.done ? html`<button type="button" class="btn btn-primary" data-gal-next data-fk="next" data-autofocus>${last ? I.T("See my galaxy", "Ver mi galaxia") : I.T("Next pair", "Siguiente pareja")}${icon("arrow-right")}</button>` : ""}
      </div>
      ${feedback(r, env, s)}
    </div>
    ${mapBlock(s, env)}
  </div>`;
}

const spec = {
  id: "word-galaxy",
  title: TITLE,
  persist: true,
  howTo: [
    [
      "Each round shows two stars. They are two words from this unit.",
      "Cada ronda muestra dos estrellas. Son dos palabras de esta unidad.",
    ],
    [
      "Decide how the words are connected: same meaning, opposites, a shared word part, the same group, or not connected.",
      "Decide cómo se relacionan las palabras: mismo significado, opuestos, una parte compartida, el mismo grupo o sin conexión.",
    ],
    [
      "A right answer draws a glowing line. Each kind of connection has its own line style.",
      "Una respuesta correcta traza una línea brillante. Cada tipo de conexión tiene su propio estilo de línea.",
    ],
    [
      "If it is not right, pick again. Hints are free. At the end you see your whole galaxy.",
      "Si no es correcta, elige otra. Las pistas son gratis. Al final ves toda tu galaxia.",
    ],
  ],
  keys: [
    ["1 to 4", ["choose that connection", "elegir esa conexión"]],
    ["Enter", ["go to the next pair", "ir a la siguiente pareja"]],
  ],
  build: (env) => buildGalaxy(env.pool, env.rng),
  valid: (s) =>
    Array.isArray(s?.rounds) &&
    s.rounds.length >= MIN_ROUNDS &&
    s.stars &&
    typeof s.stars === "object",
  unplayable: (s) => !s.rounds.length,
  isDone: (s) => Boolean(s.claimed),
  progress: (s) => ({ done: s.rounds.filter((r) => r.mc.done).length, total: s.rounds.length }),
  view,
  click(el, s, env, ev) {
    if (el.closest("[data-gal-alt]")) {
      ev?.preventDefault?.();
      s.altOpen = !s.altOpen;
      return true;
    }
    const r = s.rounds[s.i];
    if (el.closest("[data-gal-next]")) {
      if (!r.mc.done) return false;
      s.fresh = -1;
      if (s.i >= s.rounds.length - 1) s.claimed = true;
      else s.i += 1;
      env.say(env.I.S("Next pair.", "Siguiente pareja."));
      return true;
    }
    const was = r.mc.done;
    const changed = mcAct(el, r.q, r.mc, env, { kind: r.rel });
    if (changed && !was && r.mc.done) {
      s.fresh = s.i;
      env.say(
        r.rel === "none"
          ? env.I.S(
              "Right. These two stars stay apart.",
              "Correcto. Estas dos estrellas quedan separadas.",
            )
          : env.I.S(
              "Right. A glowing line joins the two stars.",
              "Correcto. Una línea brillante une las dos estrellas.",
            ),
      );
    }
    return changed;
  },
  extra: (s) => ({
    stars: Object.keys(layoutStars(s)).length,
    links: drawnRounds(s).length,
    constellations: constellationsOf(s).length,
    alone: loneStars(s).map((st) => st.hw),
  }),
  finishExtra(s, env) {
    const I = env.I;
    const lone = loneStars(s);
    return html`<section
      class="va-gal-final"
      aria-label="${I.S("Your finished galaxy", "Tu galaxia terminada")}"
    >
      ${mapBlock(s, env, { final: true })}
      <section class="va-gal-lone">
        <h4 class="va-gal-h2">
          ${I.T("Stars that stayed on their own", "Estrellas que quedaron solas")}
        </h4>
        ${
          lone.length
            ? html`<p class="vag-fine">
                  ${I.T("These words had no connection in this sky. Look at them again.", "Estas palabras no tuvieron conexión en este cielo. Vuelve a mirarlas.")}
                </p>
                <ul class="va-gal-lone-list">
                  ${lone.map((st) => {
                    const w = env.pool.byId.get(st.id);
                    return html`<li>
                      <strong lang="en">${st.hw}</strong
                      >${w ? html`: <span lang="en">${clean(w.def)}</span>` : ""}${w ? env.gloss(w) : ""}
                    </li>`;
                  })}
                </ul>`
            : html`<p class="vag-fine">
                ${I.T("Every star in this sky is connected.", "Todas las estrellas de este cielo están conectadas.")}
              </p>`
        }
      </section>
    </section>`;
  },
};

/** Mount the galaxy into a host element. opts is the games' option bag ({ unit, grade, ctx, onResult, onDone, persist, restore }). */
export const mountGalaxy = (root, opts) => mountGame(root, opts, spec);
export const galaxySpec = spec;

/** The unit page's entry point (see ./extras.js): results through the model, the run kept in unitWork[gid].galaxy. */
export function start(host, ctx, va, { gid, merged, g }) {
  const galaxy = (workOf(va.progress, gid).galaxy ||= {});
  return mountGalaxy(host, {
    unit: merged,
    grade: g,
    ctx: { ...ctx, supports: va.supports("reading") },
    now: Date.now(),
    onResult: (ev) => {
      recordResult(va.progress, {
        wordId: ev.wordId,
        dim: ev.dim,
        ok: ev.ok,
        sup: ev.sup,
        type: ev.type,
        now: new Date(),
        unit: gid,
        grade: g,
      });
      va.save();
    },
    onDone: (sum) => {
      galaxy.done = true;
      galaxy.at = new Date().toISOString();
      galaxy.judged = sum.judged;
      galaxy.correct = sum.correct;
      galaxy.links = sum.links;
      galaxy.stars = sum.stars;
      va.save();
    },
    persist: (key, state) => {
      if (state) galaxy.resume = { key, at: Date.now(), state };
      else delete galaxy.resume;
      va.save();
    },
    restore: (key) => (galaxy.resume?.key === key ? galaxy.resume.state : null),
  });
}
