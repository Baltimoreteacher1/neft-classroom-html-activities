// Class view for the Teachers hub: paste several students' Save/Resume codes and see which language patterns
// recur across the class and how much practice each domain has had.
//
// Privacy: a Save/Resume code carries the whole lab backup, including the student's first name. This module reads
// ONLY the `tlp_lab_v2` record out of a code (events hold no name and no text) and drops everything else
// immediately. Nothing is stored or sent anywhere; the result lives in memory until the teacher closes the page.
//
// Honesty: a pattern count says what to reteach, never a grade. Domain coverage is practice, not a score.
import { html } from "../util.js";
import { DOMAINS, DOMAIN_NAME_ES } from "./meta.js";
import { LAB_KEY, migrateState, readiness } from "./store.js";
import { ERROR_TAGS, remediationGame } from "./tags.js";
import { labRoutes } from "./query.js";

export const CODE_PREFIX = "ACCESS1.";
export const MAX_CODES = 60;

/** One code -> the lab state inside it, or { error } when the code cannot be read. Never throws. */
export function readCode(code, decode = defaultDecode) {
  const text = String(code ?? "").trim();
  if (!text.startsWith(CODE_PREFIX)) return { error: "not-a-code" };
  let backup;
  try {
    backup = JSON.parse(decode(text.slice(CODE_PREFIX.length)));
  } catch {
    return { error: "unreadable" };
  }
  const raw = backup?.data?.[LAB_KEY];
  if (typeof raw !== "string") return { state: migrateState(null), empty: true };
  try {
    return { state: migrateState(JSON.parse(raw)) };
  } catch {
    return { error: "unreadable" };
  }
}
const defaultDecode = (b64) => decodeURIComponent(escape(atob(b64)));

/** Split pasted text into codes: one per line, or separated by whitespace. */
export const splitCodes = (text) =>
  String(text ?? "")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_CODES);

/**
 * Aggregate pasted codes. `top` ranks patterns by how many DIFFERENT students showed them (a pattern in six
 * students beats one student who repeated it twenty times), then by total count.
 */
export function classPatterns(text, { band = "", decode } = {}) {
  const codes = splitCodes(text);
  const states = [];
  let unreadable = 0;
  let noPractice = 0;
  for (const code of codes) {
    const r = readCode(code, decode);
    if (r.error) unreadable += 1;
    else {
      if (r.empty || !r.state.events.length) noPractice += 1;
      states.push(r.state);
    }
  }
  const tally = new Map();
  for (const s of states) {
    const mine = new Map();
    for (const e of s.events) {
      if (!e.languageErrorTag || (band && e.gradeBand !== band)) continue;
      mine.set(e.languageErrorTag, (mine.get(e.languageErrorTag) || 0) + 1);
    }
    for (const [tag, n] of mine) {
      const t = tally.get(tag) || { tag, students: 0, count: 0 };
      t.students += 1;
      t.count += n;
      tally.set(tag, t);
    }
  }
  const top = [...tally.values()]
    .sort((a, b) => b.students - a.students || b.count - a.count)
    .slice(0, 2);
  const coverage = Object.fromEntries(DOMAINS.map((d) => [d, 0]));
  const practiced = states.filter((s) => s.events.length);
  for (const s of practiced) {
    const r = readiness(s, { band });
    for (const d of DOMAINS) coverage[d] += r[d] / practiced.length;
  }
  return { entered: codes.length, students: states.length, unreadable, noPractice, top, coverage };
}

const PCT = (v) => `${Math.round(v * 100)}%`;

/** The class panel: a paste box, and below it the result once there is one. `result` comes from classPatterns. */
export function classPanelHTML(text = "", result = null, { band = "" } = {}) {
  return html`<section class="panel lp-class" aria-labelledby="lpClassTitle">
    <h2 id="lpClassTitle">Class patterns <span lang="es">· Patrones de la clase</span></h2>
    <p class="fine">
      Paste students' Save/Resume codes, one per line. Only the language-practice record is read;
      names and everything else in a code are ignored, and nothing leaves this page.
      <span lang="es"
        >Pega los códigos de Guardar/Reanudar de los estudiantes, uno por línea. Solo se lee el
        registro de práctica de lenguaje; nada sale de esta página.</span
      >
    </p>
    <label class="visually-hidden" for="cpCodes">Student codes</label>
    <textarea
      id="cpCodes"
      class="lp-class-box"
      rows="4"
      spellcheck="false"
      autocomplete="off"
      placeholder="ACCESS1.…"
    >
${text}</textarea>
    <div class="lp-class-actions">
      <button type="button" class="btn small btn-primary" data-cp-run>Show class patterns</button>
      <button type="button" class="btn small" data-cp-clear>Clear</button>
    </div>
    ${result ? classResultHTML(result, band) : ""}
  </section>`;
}

function classResultHTML(r, band) {
  const status = html`<p class="lp-class-status" role="status">
    ${r.students} ${r.students === 1 ? "code" : "codes"}
    read${r.noPractice ? `, ${r.noPractice} with no practice yet` : ""}${r.unreadable ? `, ${r.unreadable} could not be read` : ""}.
  </p>`;
  if (!r.students) return html`${status}`;
  return html`${status}
    ${
      r.top.length
        ? html`<ol class="lp-pattern-list">
            ${r.top.map(({ tag, students, count }) => {
              const t = ERROR_TAGS[tag];
              return html`<li data-tag="${tag}">
                <strong>${t.en}</strong> <span lang="es">· ${t.es}</span>
                <span class="fine"
                  >(${students} ${students === 1 ? "student" : "students"}, ${count}
                  ${count === 1 ? "time" : "times"})</span
                >
                <p>${t.hintEn}</p>
                <p lang="es">${t.hintEs}</p>
                <a class="btn small" href="${labRoutes.game(remediationGame(tag), { band })}"
                  >Practice this <span lang="es">· Practicar esto</span></a
                >
              </li>`;
            })}
          </ol>`
        : html`<p class="lp-empty">No language patterns recorded in these codes.</p>`
    }
    <p class="fine">
      Average practice coverage:
      ${DOMAINS.map((d) => html`${d} ${PCT(r.coverage[d])}<span lang="es"> (${DOMAIN_NAME_ES[d]})</span>; `)}
      practice, not a score.
    </p>`;
}
