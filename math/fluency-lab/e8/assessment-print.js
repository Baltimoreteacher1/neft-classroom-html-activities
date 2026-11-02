// Printable assessments from the authored bank (Phase 6E). The student copy shows only what a student may see (no hints,
// no answers, no rubric samples); the key is a separate document with answers, scoring and the rubric. Interactive-only
// item types (model) are left off the paper copy and listed in the blueprint so a teacher knows what was not printed.
import { side } from "./item-engine.js";

const esc = (v) =>
  String(v ?? "").replace(
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
export const NOT_PRINTABLE = new Set(["model"]);
const pick = (o, language) =>
  o && typeof o === "object"
    ? language === "es"
      ? o.es
      : o.en
    : String(o ?? "");
const both = (o, language) =>
  language === "both"
    ? `${o.en}<br><i>${esc(o.es)}</i>`
    : esc(pick(o, language === "es" ? "es" : "en"));
const lang = (language) => (language === "both" ? "en" : language);

function gridSvg(g) {
  const w = 220;
  const h = 220;
  const sx = (x) => 20 + ((x - g.xmin) / (g.xmax - g.xmin)) * (w - 40);
  const sy = (y) => h - 20 - ((y - g.ymin) / (g.ymax - g.ymin)) * (h - 40);
  const lines = [];
  for (let x = g.xmin; x <= g.xmax; x += 1)
    lines.push(
      `<line x1="${sx(x)}" y1="${sy(g.ymin)}" x2="${sx(x)}" y2="${sy(g.ymax)}" stroke="#000" stroke-width="${x === 0 ? 1.6 : 0.4}"/>`,
    );
  for (let y = g.ymin; y <= g.ymax; y += 1)
    lines.push(
      `<line x1="${sx(g.xmin)}" y1="${sy(y)}" x2="${sx(g.xmax)}" y2="${sy(y)}" stroke="#000" stroke-width="${y === 0 ? 1.6 : 0.4}"/>`,
    );
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="Coordinate grid from ${g.xmin} to ${g.xmax}">${lines.join("")}</svg>`;
}
function lineSvg(l) {
  const min = Number(eval1(l.min));
  const max = Number(eval1(l.max));
  const step = Number(eval1(l.step));
  const ticks = [];
  for (let v = min; v <= max + 1e-9; v += step) ticks.push(v);
  const x = (v) => 20 + ((v - min) / (max - min)) * 360;
  return `<svg viewBox="0 0 400 50" width="360" role="img" aria-label="Number line from ${esc(l.min)} to ${esc(l.max)}"><line x1="20" y1="25" x2="380" y2="25" stroke="#000" stroke-width="2"/>${ticks.map((v) => `<line x1="${x(v)}" y1="18" x2="${x(v)}" y2="32" stroke="#000"/>`).join("")}<text x="20" y="46" font-size="11" text-anchor="middle">${esc(l.min)}</text><text x="380" y="46" font-size="11" text-anchor="middle">${esc(l.max)}</text></svg>`;
}
const eval1 = (t) => {
  const m = /^(-?\d+)\/(\d+)$/.exec(String(t));
  return m ? Number(m[1]) / Number(m[2]) : Number(t);
};

function body(it, n, language) {
  const stem = `<p class="ap-q"><b>${n}.</b> ${both(it.stem, language)}</p>`;
  const lines = (k) =>
    Array.from({ length: k }, () => '<div class="ap-line"></div>').join("");
  switch (it.type) {
    case "mc":
    case "multi":
      return `${stem}${it.type === "multi" ? `<p class="ap-note">${language === "es" ? "Elige todas las que apliquen." : "Choose all that apply."}</p>` : ""}<ol class="ap-choices" type="A">${it.choices.map((c) => `<li>${typeof c.text === "object" ? both(c.text, language) : esc(c.text)}</li>`).join("")}</ol>`;
    case "match": {
      const rights = [...it.pairs]
        .map((p) => p.right)
        .sort((a, b) => side(a).localeCompare(side(b)));
      return `${stem}<div class="ap-match"><ul>${it.pairs.map((p) => `<li>${both(p.left, language)}</li>`).join("")}</ul><ul>${rights.map((r, i) => `<li>${String.fromCharCode(97 + i)}. ${both(r, language)}</li>`).join("")}</ul></div>`;
    }
    case "sort": {
      const all = it.bins
        .flatMap((b) => b.items)
        .sort((a, b) => side(a).localeCompare(side(b)));
      return `${stem}<p class="ap-cards">${all.map((x) => `<span class="ap-card">${both(x, language)}</span>`).join(" ")}</p><div class="ap-bins">${it.bins.map((b) => `<div class="ap-bin"><b>${both(b.name, language)}</b></div>`).join("")}</div>`;
    }
    case "numberline":
      return `${stem}${lineSvg(it.line)}<div class="ap-line"></div>`;
    case "graph":
      return `${stem}${gridSvg(it.grid)}`;
    case "error":
      return `${stem}<ol class="ap-steps">${it.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol><div class="ap-line"></div>`;
    case "constructed":
    case "explain":
    case "application":
      return `${stem}${lines(it.type === "application" ? 3 : 4)}`;
    default:
      return `${stem}<div class="ap-line"></div>`;
  }
}

function keyLine(it, n, language) {
  const l = lang(language);
  const a = it.answer || {};
  let ans = "";
  if (it.type === "mc" || it.type === "multi")
    ans = [].concat(a.correct).join(", ");
  else if (it.type === "match")
    ans = it.pairs.map((p) => `${side(p.left)} → ${side(p.right)}`).join("; ");
  else if (it.type === "sort")
    ans = it.bins
      .map(
        (b) => `${pick(b.name, l)}: ${b.items.map((x) => side(x)).join(", ")}`,
      )
      .join(" | ");
  else if (it.type === "graph")
    ans = a.points.map((p) => `(${p.join(", ")})`).join(" ");
  else if (it.type === "error") ans = `Step ${a.errorStep}`;
  else if (it.type === "numberline") ans = a.point;
  else if (it.rubric && !a.value)
    ans = it.rubric.criteria
      .map((c) => `${pick(c, l)} (${c.points})`)
      .join("; ");
  else ans = `${a.value ?? ""}${a.unit ? ` ${a.unit}` : ""}`;
  const rub =
    it.rubric && a.value
      ? `<br><small>${it.rubric.criteria.map((c) => esc(pick(c, l))).join("; ")}</small>`
      : "";
  return `<tr><td>${n}</td><td>${esc(it.id)}</td><td>${esc(it.standard)}</td><td>DOK ${it.dok}</td><td><b>${esc(ans)}</b>${rub}</td><td>${it.scoring?.points ?? 1}</td></tr>`;
}

const CSS = `@page{margin:14mm}.ap,.ap *{box-sizing:border-box}.ap{font:12pt/1.45 "Atkinson Hyperlegible","Helvetica Neue",Arial,sans-serif;color:#000;background:#fff;max-width:190mm;margin:0 auto;padding:6mm}.ap h1{font-size:1.4em;margin:0 0 .3em}.ap-meta{display:flex;gap:2em;margin:.6em 0 1em}.ap-meta span{flex:1;border-bottom:1.5px solid #000;min-height:1.6em}.ap-item{break-inside:avoid;margin:0 0 1.2em}.ap-q{margin:0 0 .3em}.ap-note{font-size:.85em;margin:.1em 0}.ap-choices{margin:.2em 0 0 1.6em;padding:0}.ap-line{border-bottom:1px solid #000;height:1.7em}.ap-match{display:grid;grid-template-columns:1fr 1fr;gap:1em}.ap-match ul{list-style:none;margin:0;padding:0}.ap-match li{padding:.2em 0}.ap-card{display:inline-block;border:1px solid #000;border-radius:4px;padding:.1em .5em;margin:.1em}.ap-bins{display:flex;gap:.8em;margin-top:.5em}.ap-bin{flex:1;border:1.5px solid #000;min-height:5em;padding:.3em}.ap-steps{margin:.2em 0 .4em 1.6em;padding:0}.ap table{border-collapse:collapse;width:100%}.ap td,.ap th{border:1px solid #000;padding:.25em .4em;text-align:left;vertical-align:top;font-size:.9em}.ap-foot{margin-top:1em;font-size:.8em;border-top:1px solid #000;padding-top:.4em}`;

export function renderAssessment(
  assessment,
  {
    audience = "student",
    language = "en",
    title = "Math check",
    fragment = true,
  } = {},
) {
  const printable = assessment.items.filter((i) => !NOT_PRINTABLE.has(i.type));
  const skipped = assessment.items.length - printable.length;
  const l = lang(language);
  let main;
  if (audience === "key") {
    main = `<h1>${esc(title)} – ${l === "es" ? "Clave" : "Answer key"}</h1><table><thead><tr><th>#</th><th>Item</th><th>Standard</th><th>DOK</th><th>${l === "es" ? "Respuesta" : "Answer"}</th><th>${l === "es" ? "Puntos" : "Points"}</th></tr></thead><tbody>${printable.map((it, i) => keyLine(it, i + 1, language)).join("")}</tbody></table><p class="ap-foot">${esc(JSON.stringify(assessment.blueprint.dok))} · seed ${esc(assessment.seed)}${skipped ? ` · ${skipped} interactive item(s) not printed` : ""}</p>`;
  } else {
    main = `<h1>${esc(title)}</h1><div class="ap-meta"><span>${l === "es" ? "Nombre" : "Name"}:</span><span>${l === "es" ? "Fecha" : "Date"}:</span></div><p class="ap-note">${l === "es" ? "No hay cronómetro. Muestra tu razonamiento." : "There is no timer. Show your thinking."}</p>${printable.map((it, i) => `<div class="ap-item">${body(it, i + 1, language)}</div>`).join("")}<p class="ap-foot">EduWonderLab Fluency Lab · seed ${esc(assessment.seed)}</p>`;
  }
  const article = `<main class="ap">${main}</main>`;
  if (fragment) return `<style>${CSS}</style>${article}`;
  return `<!doctype html><html lang="${l === "es" ? "es" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body>${article}</body></html>`;
}
