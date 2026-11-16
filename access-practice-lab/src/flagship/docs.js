// Evidence documents for the flagship Language Games: a note, a schedule, a map, a diagram, a chart, an interview, a
// witness statement, a record (log, receipt, poster) and a photo. Each renders as a real-looking document with its
// own "Hear it" button (read-aloud of everything it says). Maps and charts also carry a text version so nothing is
// carried by a picture or a colour alone.
import { artSrc } from "../book/render.js";
import { html, icon, raw } from "../util.js";
import { docText } from "./engine.js";

const KIND = {
  note: ["Note", "Nota", "text"],
  schedule: ["Schedule", "Horario", "calendar"],
  map: ["Map", "Mapa", "pin"],
  diagram: ["Diagram", "Diagrama", "grid"],
  chart: ["Chart", "Gráfica", "growth"],
  interview: ["Interview", "Entrevista", "speaking"],
  witness: ["Eyewitness", "Testigo", "user"],
  record: ["Record", "Registro", "list"],
  photo: ["Photo", "Foto", "search"],
};
const escSvg = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function mapSVG(doc) {
  const W = 400;
  const H = 280;
  const px = (p) => [30 + (p.x / 8) * (W - 60), 30 + (p.y / 5) * (H - 70)];
  const lines = (doc.paths || [])
    .map(([a, b]) => {
      const [x1, y1] = px(doc.places[a]);
      const [x2, y2] = px(doc.places[b]);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#7a5b3a" stroke-width="6" stroke-linecap="round"/>`;
    })
    .join("");
  const dots = doc.places
    .map((p) => {
      const [x, y] = px(p);
      return `<g><circle cx="${x}" cy="${y}" r="11" fill="#fffaf0" stroke="#1b1f3b" stroke-width="2.5"/><rect x="${x - (p.name.length * 4.6 + 8)}" y="${y + 15}" width="${p.name.length * 9.2 + 16}" height="22" rx="11" fill="#fffaf0" stroke="#1b1f3b" stroke-width="1.5"/><text x="${x}" y="${y + 31}" text-anchor="middle" font-size="14" font-weight="700" fill="#111a3b">${escSvg(p.name)}</text></g>`;
    })
    .join("");
  return raw(
    `<svg class="lg-map" viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="14" fill="#f3ead8" stroke="#c9b892" stroke-width="2"/>${lines}${dots}</svg>`,
  );
}

function chartHTML(doc) {
  const max = Math.max(...doc.bars.map((b) => b.value), 1);
  return html`<table class="lg-chart">
    <caption class="visually-hidden">
      ${doc.title}
    </caption>
    <thead class="visually-hidden">
      <tr>
        <th scope="col">Item</th>
        <th scope="col">${doc.unit || "Value"}</th>
      </tr>
    </thead>
    <tbody>
      ${doc.bars.map(
        (b) =>
          html`<tr>
            <th scope="row">${b.label}</th>
            <td>
              <span class="lg-bar" style="--w:${Math.round((b.value / max) * 100)}%"
                ><b>${b.value}${doc.unit ? `${/^[%°]/.test(doc.unit) ? "" : " "}${doc.unit}` : ""}</b><i aria-hidden="true"></i></span
              >
            </td>
          </tr>`,
      )}
    </tbody>
  </table>`;
}

function bodyHTML(doc) {
  switch (doc.kind) {
    case "note":
      return html`<div class="lg-note-paper">
        ${doc.lines.map((l) => html`<p>${l}</p>`)}
        ${doc.from ? html`<p class="lg-sign">— ${doc.from}</p>` : ""}
      </div>`;
    case "schedule":
      return html`<div class="lg-table-wrap">
        <table class="lg-table">
          <thead>
            <tr>
              ${doc.cols.map((c) => html`<th scope="col">${c}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${doc.rows.map(
              (r) =>
                html`<tr>
                  ${r.map((c, i) => (i === 0 ? html`<th scope="row">${c}</th>` : html`<td>${c}</td>`))}
                </tr>`,
            )}
          </tbody>
        </table>
      </div>`;
    case "map":
      return html`${mapSVG(doc)}
        <ul class="lg-map-key">
          <li>
            <b>Connected:</b>
            ${(doc.paths || []).map(([a, b], i) => html`${i ? "; " : ""}${doc.places[a].name} – ${doc.places[b].name}`)}
          </li>
          ${(doc.notes || []).map((n) => html`<li>${n}</li>`)}
        </ul>`;
    case "diagram":
      return html`<div class="lg-diagram">
        ${doc.art ? html`<img src="${artSrc(doc.art)}" alt="" width="96" height="96" />` : ""}
        <dl>
          ${doc.parts.map(
            (p) =>
              html`<div>
                <dt>${p.label}</dt>
                <dd>${p.text}</dd>
              </div>`,
          )}
        </dl>
      </div>`;
    case "chart":
      return html`${chartHTML(doc)}${doc.source ? html`<p class="lg-source">Source: ${doc.source}</p>` : ""}`;
    case "interview":
      return html`<dl class="lg-qa">
        ${doc.qa.map(
          (x) =>
            html`<div>
              <dt>Q: ${x.q}</dt>
              <dd><b>${doc.who}:</b> ${x.a}</dd>
            </div>`,
        )}
      </dl>`;
    case "witness":
      return html`<blockquote class="lg-quote">
        <p>“${doc.said}”</p>
        <footer>— ${doc.who}${doc.role ? html`, <span>${doc.role}</span>` : ""}</footer>
      </blockquote>`;
    case "record":
      return html`<dl class="lg-record">
        ${doc.rows.map(
          ([k, v]) =>
            html`<div>
              <dt>${k}</dt>
              <dd>${v}</dd>
            </div>`,
        )}
      </dl>`;
    case "photo":
      return html`<figure class="lg-photo">
        <img src="${artSrc(doc.art)}" alt="${doc.caption}" width="160" height="160" />
        <figcaption>${doc.caption}</figcaption>
      </figure>`;
    default:
      return "";
  }
}

/** One document card. `focus` marks it as a document the current step points to. */
export function docHTML(I, doc, focus = false) {
  const k = KIND[doc.kind] || KIND.note;
  return html`<section
    class="lg-doc lg-doc-${doc.kind} ${focus ? "is-focus" : ""}"
    aria-labelledby="lgDoc-${doc.id}"
  >
    <header>
      <p class="lg-doc-kind">
        ${icon(k[2])}
        ${I.T(k[0], k[1])}${focus ? html` · <span class="lg-look">${I.T("Look here", "Mira aquí")}</span>` : ""}
      </p>
      <h3 id="lgDoc-${doc.id}">${doc.title}</h3>
      <button
        type="button"
        class="btn small ghost lg-say"
        data-say="${docText(doc)}"
        aria-label="${I.S(`Hear it: ${doc.title}`, `Escuchar: ${doc.title}`)}"
      >
        ${icon("volume")} <span>${I.T("Hear it", "Escuchar")}</span>
      </button>
    </header>
    ${bodyHTML(doc)}
  </section>`;
}
