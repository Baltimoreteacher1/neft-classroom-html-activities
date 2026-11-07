// Skill mini-lessons for the lesson frame: matching an activity to a skill family, and drawing the worked
// model and its diagram. Content lives in content/lesson-learn.json (one file, every family, EN + ES).
// Everything here is pure: markup in, markup out. The model text is English practice content (lang="en").
import { esc, html, icon, raw } from "./util.js";

const rxCache = new WeakMap();
const rxOf = (family) => {
  if (!family.match) return null;
  if (!rxCache.has(family)) rxCache.set(family, new RegExp(family.match, "i"));
  return rxCache.get(family);
};

/** The first family whose pattern matches the skill tag (and domain, when it names some); else the domain fallback. */
export function familyFor(data, domain, skill = "") {
  if (!data) return null;
  const text = String(skill || "");
  const hit = (data.families || []).find(
    (f) => (!f.domains || f.domains.includes(domain)) && rxOf(f)?.test(text),
  );
  return hit || data.fallbacks?.[domain] || null;
}

/** Plain-string pick of an { en, es } pair for the learner's language (bilingual shows English in strings). */
export const pickText = (I, pair) => (pair ? (I.spanish ? pair.es || pair.en : pair.en) : "");

// ── diagrams ──────────────────────────────────────────────────────────────────
const W = 320;
const wrap = (text, max) => {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    if (line && `${line} ${word}`.length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
};
const LH = 19;
const textLines = (lines, x, y, cls = "lf-dg-text", anchor = "start") =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${lines.map((l, i) => `<tspan x="${x}" dy="${i ? LH : 0}">${esc(l)}</tspan>`).join("")}</text>`;
const arrow = (x, y1, y2) =>
  `<path class="lf-dg-arrow" d="M${x} ${y1}V${y2 - 6}"/><path class="lf-dg-head" d="M${x - 6} ${y2 - 8}L${x} ${y2}L${x + 6} ${y2 - 8}Z"/>`;

function flowSVG(nodes) {
  let y = 6;
  let body = "";
  nodes.forEach((label, i) => {
    const lines = wrap(label, 25);
    const h = lines.length * LH + 18;
    const last = i === nodes.length - 1;
    body += `<rect class="lf-dg-node${last ? " is-goal" : ""}" x="14" y="${y}" width="292" height="${h}" rx="10"/>`;
    body += `<circle class="lf-dg-badge" cx="38" cy="${y + h / 2}" r="12"/><text class="lf-dg-num" x="38" y="${y + h / 2 + 5}" text-anchor="middle">${i + 1}</text>`;
    body += textLines(lines, 60, y + 23);
    y += h;
    if (!last) {
      body += arrow(38, y + 2, y + 24);
      y += 26;
    }
  });
  return { h: y + 8, body };
}

function hubSVG(top, nodes) {
  const topLines = wrap(top, 30);
  const topH = topLines.length * LH + 18;
  let body = `<rect class="lf-dg-node is-key" x="14" y="6" width="292" height="${topH}" rx="10"/>${textLines(topLines, 160, 6 + 23, "lf-dg-text is-center", "middle")}`;
  let y = 6 + topH + 22;
  const spineTop = 6 + topH;
  let lastMid = y;
  nodes.forEach((label, i) => {
    const lines = wrap(label, 24);
    const h = lines.length * LH + 16;
    body += `<path class="lf-dg-arrow" d="M32 ${y + h / 2}H56"/><rect class="lf-dg-node" x="56" y="${y}" width="250" height="${h}" rx="10"/>${textLines(lines, 70, y + 22)}`;
    lastMid = y + h / 2;
    y += h + 12;
  });
  body = `<path class="lf-dg-arrow" d="M32 ${spineTop}V${lastMid}"/>${body}`;
  return { h: y + 2, body };
}

function vennSVG(left, right, both) {
  const circle = (cx, cls) => `<circle class="lf-dg-circle ${cls}" cx="${cx}" cy="116" r="92"/>`;
  const block = (label, x, cls, max) => {
    const lines = wrap(label, max);
    return textLines(
      lines,
      x,
      116 - ((lines.length - 1) * LH) / 2 + 5,
      `lf-dg-text is-small ${cls}`,
      "middle",
    );
  };
  return {
    h: 232,
    body: `${circle(112, "is-a")}${circle(208, "is-b")}${block(left, 70, "", 11)}${block(right, 250, "", 11)}${block(both, 160, "is-both", 9)}`,
  };
}

function ladderSVG(nodes) {
  let y = 6;
  let body = "";
  nodes.forEach((label, i) => {
    const width = 170 + Math.round((i * 120) / Math.max(1, nodes.length - 1));
    const lines = wrap(label, Math.floor((width - 28) / 8.2));
    const h = lines.length * LH + 18;
    const last = i === nodes.length - 1;
    body += `<rect class="lf-dg-node${last ? " is-goal" : ""}" x="14" y="${y}" width="${width}" height="${h}" rx="10"/>${textLines(lines, 28, y + 23)}`;
    y += h + 12;
  });
  return { h: y, body };
}

/** The diagram as one inline <svg> string; it is described by <title> and <desc>, and drawn with tokens in CSS. */
export function diagramSVG(I, diagram, uid = "dg") {
  if (!diagram) return "";
  const t = (p) => pickText(I, p);
  const nodes = (diagram.nodes || []).map(t);
  const drawn =
    diagram.kind === "hub"
      ? hubSVG(t(diagram.top), nodes)
      : diagram.kind === "venn"
        ? vennSVG(t(diagram.left), t(diagram.right), t(diagram.both))
        : diagram.kind === "ladder"
          ? ladderSVG(nodes)
          : flowSVG(nodes);
  const summary =
    diagram.kind === "venn"
      ? [t(diagram.left), t(diagram.right), t(diagram.both)]
      : diagram.kind === "hub"
        ? [t(diagram.top), ...nodes]
        : nodes;
  return `<svg class="lf-dg" viewBox="0 0 ${W} ${drawn.h}" role="img" aria-labelledby="${uid}-t ${uid}-d" focusable="false"><title id="${uid}-t">${esc(t(diagram.title))}</title><desc id="${uid}-d">${esc(summary.join(". "))}</desc>${drawn.body}</svg>`;
}

// ── worked model ──────────────────────────────────────────────────────────────
const tagIndex = (model) => Object.fromEntries((model.tags || []).map((tag, i) => [tag.id, i]));

function marked(I, model, seg, tags) {
  if (!seg.tag) return html`${seg.t}`;
  const tag = (model.tags || [])[tags[seg.tag]];
  return html`<span class="lf-mark" data-tone="${(tags[seg.tag] % 4) + 1}"
    ><span class="lf-mark-text">${seg.t}</span
    ><span class="lf-mark-label">${I.T(tag.en, tag.es)}</span></span
  >`;
}

/** The annotated example: English text with each part labeled in words (never by color alone). */
export function modelHTML(I, model) {
  if (!model) return "";
  const tags = tagIndex(model);
  const segments = model.lines || [];
  const body =
    model.layout === "inline"
      ? html`<p class="lf-model-text" lang="en">
          ${segments.map((s) => marked(I, model, s, tags))}
        </p>`
      : html`<ul class="lf-model-lines" lang="en" role="list">
          ${segments.map((s) => html`<li>${marked(I, model, s, tags)}</li>`)}
        </ul>`;
  return html`<div class="lf-model">
    ${body}
    ${model.result ? html`<p class="lf-model-result">${I.T(model.result.en, model.result.es)}</p>` : ""}
    ${model.think ? html`<p class="lf-model-think"><strong>${I.T("Why it works:", "Por qué funciona:")}</strong> ${I.T(model.think.en, model.think.es)}</p>` : ""}
  </div>`;
}

/**
 * The Learn step: a short mini-lesson (goal, three moves, one annotated model with a diagram, one slip to avoid).
 * `open` shows the body; collapsed it is a heading and a toggle. The body stays in the markup so a printed
 * lesson sheet carries it (the print stylesheet reveals it).
 */
export function learnPanelHTML(I, family, { open = false, first = false } = {}) {
  if (!family) return "";
  const t = (p) => I.T(p.en, p.es);
  const uid = `lf-dg-${family.id}`;
  return html`<section
    class="lf-learn ${open ? "is-open" : ""}"
    id="lf-learn"
    aria-labelledby="lf-learn-title"
    data-lf-learn="${family.id}"
  >
    <div class="lf-learn-head">
      <div>
        <p class="lf-eyebrow">
          ${icon("bulb")}
          ${I.T("Skill lesson · about 2 minutes", "Lección de destreza · unos 2 minutos")}
        </p>
        <h2 id="lf-learn-title">${t(family.title)}</h2>
        <p class="lf-can">
          <strong>${I.T("I can", "Puedo")}</strong>
          ${I.T(family.can.en.replace(/^I can /, ""), family.can.es.replace(/^Puedo /, ""))}
        </p>
      </div>
      <button
        type="button"
        class="btn small lf-learn-toggle"
        data-frame-learn-toggle
        aria-expanded="${String(open)}"
        aria-controls="lf-learn-body"
      >
        ${open ? I.T("Close skill lesson", "Cerrar la lección") : I.T("Open skill lesson", "Abrir la lección")}
      </button>
    </div>
    <div class="lf-learn-body" id="lf-learn-body" ${open ? "" : raw("hidden")}>
      <div class="lf-learn-grid">
        <div>
          <h3>${I.T("Three moves", "Tres pasos")}</h3>
          <ol class="lf-moves">
            ${family.steps.map((s) => html`<li>${t(s)}</li>`)}
          </ol>
          <p class="lf-slip">
            ${icon("alert")}
            <span><strong>${I.T("Watch out:", "Cuidado:")}</strong> ${t(family.slip)}</span>
          </p>
        </div>
        <div class="lf-learn-model">
          <h3>${I.T("Worked model", "Modelo resuelto")}</h3>
          ${modelHTML(I, family.model)}
          <figure class="lf-figure">
            ${raw(diagramSVG(I, family.diagram, uid))}
            <figcaption>${I.T(family.diagram.title.en, family.diagram.title.es)}</figcaption>
          </figure>
        </div>
      </div>
      <div class="lf-learn-foot">
        <p class="fine">
          ${I.T("This model uses its own example. The activity below uses different words.", "Este modelo usa su propio ejemplo. La actividad de abajo usa otras palabras.")}
        </p>
        <button type="button" class="btn btn-primary" data-frame-ready>
          ${first ? I.T("Got it, let me try", "Entendido, voy a intentarlo") : I.T("Back to my activity", "Volver a mi actividad")}
          ${icon("arrow-right")}
        </button>
      </div>
    </div>
  </section>`;
}
