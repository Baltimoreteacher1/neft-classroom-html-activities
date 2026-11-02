// Printable engine (Enterprise 8). Builds practice sheets that are a pure function of (skills, level, count, seed):
// the same request prints the same sheet, so a student copy and its answer key can never drift apart, and a re-print
// next week is identical. Problems come from the lab's own generators (exact answers, no timers), the student copy
// carries no answers, hints or worked steps, and the key is a separate document. Output is ink-friendly black on
// white, set in large print on request, with room to write, and English, Spanish or both.
import { ALL_SKILLS, seededRandom } from "../problem-bank.js";
import { adaptiveProblem, skillKey } from "../tutor-engine.js";
import { misconceptionsForSkill } from "./misconception-library.js";

export const AUDIENCES = Object.freeze(["student", "key", "teacher", "family"]);
export const MAX_PROBLEMS = 40;
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );

const WORDS = {
  name: { en: "Name", es: "Nombre" },
  date: { en: "Date", es: "Fecha" },
  key: { en: "Answer key", es: "Clave de respuestas" },
  show: { en: "Show your thinking here", es: "Muestra tu razonamiento aquí" },
  mistake: {
    en: "Common slip to watch for",
    es: "Error común que hay que vigilar",
  },
  tonight: {
    en: "Try these together. Talk about how you know.",
    es: "Háganlos juntos. Hablen de cómo lo saben.",
  },
  coach: {
    en: "Ask: How do you know? What could you draw?",
    es: "Pregunta: ¿Cómo lo sabes? ¿Qué podrías dibujar?",
  },
  notTimed: {
    en: "There is no timer. Take the time you need.",
    es: "No hay cronómetro. Toma el tiempo que necesites.",
  },
  footer: {
    en: "EduWonderLab Fluency Lab",
    es: "EduWonderLab Laboratorio de fluidez",
  },
};
const pair = (key, language) =>
  language === "both"
    ? `${WORDS[key].en} / ${WORDS[key].es}`
    : WORDS[key][language === "es" ? "es" : "en"];

// Stable 32-bit hash so a (skill, slot) pair always gets its own stream.
const hash = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1)
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

const canon = (item) => `${item.question}|${item.displayAnswer}`;

// Build the problem list. Skills are interleaved so a mixed sheet alternates ideas; a repeated question is redrawn.
export function buildSheet({ skills, count = 12, level = 1, seed = 1 } = {}) {
  const chosen = (Array.isArray(skills) ? skills : [skills])
    .map((s) =>
      typeof s === "string" ? ALL_SKILLS.find((x) => skillKey(x) === s) : s,
    )
    .filter(Boolean);
  if (!chosen.length)
    throw new Error("buildSheet needs at least one known skill");
  const total = Math.max(1, Math.min(MAX_PROBLEMS, Math.floor(count)));
  const problems = [];
  const seen = new Set();
  for (let i = 0; i < total; i += 1) {
    const skill = chosen[i % chosen.length];
    let item = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const rng = seededRandom(
        hash(`${seed}:${skillKey(skill)}:${i}:${attempt}`),
      );
      const candidate = adaptiveProblem(skill, rng, level);
      if (!seen.has(canon(candidate))) {
        item = candidate;
        break;
      }
    }
    if (!item) continue; // a skill with very few distinct problems prints fewer rather than repeating
    seen.add(canon(item));
    problems.push({
      n: problems.length + 1,
      skill: skillKey(skill),
      skillTitle: skill.title,
      item,
    });
  }
  return {
    seed,
    level,
    count: problems.length,
    skills: chosen.map(skillKey),
    problems,
  };
}

const choicesHtml = (item) =>
  item.choices?.length
    ? `<ol class="pe-choices" type="A">${item.choices.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>`
    : "";

const CSS = `
@page{margin:14mm}
.pe,.pe *{box-sizing:border-box}
.pe{font:12pt/1.45 "Atkinson Hyperlegible","Helvetica Neue",Arial,sans-serif;color:#000;background:#fff;max-width:190mm;margin:0 auto;padding:6mm}
.pe.large{font-size:16pt}
.pe h1{font-size:1.5em;margin:0 0 .3em}
.pe-meta{display:flex;gap:2em;margin:.6em 0 1em}
.pe-meta span{flex:1;border-bottom:1.5px solid #000;min-height:1.6em}
.pe-note{font-size:.9em;margin:0 0 1em}
.pe-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.1em 2em}
.pe.large .pe-list{grid-template-columns:1fr}
.pe-item{break-inside:avoid;border:1.5px solid #000;border-radius:6px;padding:.6em .8em;min-height:6.2em}
.pe-q{font-weight:700;margin:0 0 .3em}
.pe-n{display:inline-block;min-width:1.8em}
.pe-line{border-bottom:1px solid #000;height:1.6em;margin-top:.4em}
.pe-work{color:#000;font-size:.8em;margin-top:.3em}
.pe-choices{margin:.2em 0 0 1.6em;padding:0}
.pe-key td,.pe-key th{border:1px solid #000;padding:.25em .5em;text-align:left;vertical-align:top}
.pe-key table{border-collapse:collapse;width:100%}
.pe-foot{margin-top:1.2em;font-size:.8em;border-top:1px solid #000;padding-top:.4em}
`;

function header(title, language, { name = true } = {}) {
  return `<h1>${esc(title)}</h1>${name ? `<div class="pe-meta"><span>${esc(pair("name", language))}:</span><span>${esc(pair("date", language))}:</span></div>` : ""}`;
}

// audience: student (no answers) | key (answers + steps) | teacher (key + common slips) | family (talk prompts, no timer).
export function renderSheet(
  sheet,
  {
    audience = "student",
    language = "en",
    large = false,
    title = "Fluency practice",
    fragment = false,
  } = {},
) {
  if (!AUDIENCES.includes(audience))
    throw new Error(`Unknown audience: ${audience}`);
  const body =
    audience === "key" || audience === "teacher"
      ? keyBody(sheet, audience, language, title)
      : studentBody(sheet, audience, language, title);
  const article = `<main class="pe${large ? " large" : ""}">${body}<p class="pe-foot">${esc(pair("footer", language))} · ${esc(sheet.skills.length)} skill(s) · seed ${esc(sheet.seed)}</p></main>`;
  // A fragment is for the app's own print sheet (innerHTML); the full document is for saving or opening on its own.
  if (fragment) return `<style>${CSS}</style>${article}`;
  return `<!doctype html><html lang="${language === "es" ? "es" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}${audience === "key" ? ` – ${esc(pair("key", language))}` : ""}</title><style>${CSS}</style></head><body>${article}</body></html>`;
}

function studentBody(sheet, audience, language, title) {
  const note =
    audience === "family"
      ? `${pair("tonight", language)} ${pair("coach", language)}`
      : pair("notTimed", language);
  const items = sheet.problems
    .map(
      (p) =>
        `<li class="pe-item"><p class="pe-q"><span class="pe-n">${p.n}.</span>${esc(p.item.question)}</p>${choicesHtml(p.item)}<div class="pe-line" aria-hidden="true"></div><div class="pe-work">${esc(pair("show", language))}</div></li>`,
    )
    .join("");
  return `${header(title, language)}<p class="pe-note">${esc(note)}</p><ol class="pe-list">${items}</ol>`;
}

function keyBody(sheet, audience, language, title) {
  const rows = sheet.problems
    .map(
      (p) =>
        `<tr><td>${p.n}</td><td>${esc(p.item.question)}</td><td><b>${esc(p.item.displayAnswer)}${p.item.unit ? ` ${esc(p.item.unit)}` : ""}</b></td><td>${esc((p.item.steps || []).join(" "))}</td></tr>`,
    )
    .join("");
  const lang = language === "es" ? "es" : "en";
  const slips =
    audience === "teacher"
      ? `<h2>${esc(pair("mistake", language))}</h2><ul>${[...new Set(sheet.skills)]
          .flatMap((key) =>
            misconceptionsForSkill(key)
              .slice(0, 2)
              .map((m) => `<li>${esc(m.title[lang])}: ${esc(m.does[lang])}</li>`),
          )
          .join("")}</ul>`
      : "";
  return `${header(`${title} – ${pair("key", language)}`, language, { name: false })}<div class="pe-key"><table><thead><tr><th>#</th><th>Problem</th><th>Answer</th><th>Steps</th></tr></thead><tbody>${rows}</tbody></table></div>${slips}`;
}

// A sheet and its key as one request, so callers cannot print a key for a different seed.
export function buildPacket(options) {
  const sheet = buildSheet(options);
  const opts = {
    language: options.language || "en",
    large: Boolean(options.large),
    title: options.title || "Fluency practice",
  };
  return {
    sheet,
    student: renderSheet(sheet, { ...opts, audience: "student" }),
    key: renderSheet(sheet, { ...opts, audience: "key" }),
  };
}
