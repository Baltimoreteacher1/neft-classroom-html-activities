// Routine blocks on screen: neutral nodes (shared/bcpss-routines/nodes.js) to markup. Pure string building, no DOM,
// so the render-equals-data gates can run it in Node and the Studio tab can run it in the browser.

export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const letter = (n) => String.fromCharCode(65 + n);

const NODE = {
  h: (n) => `<h5 class="rt-h">${esc(n.text)}</h5>`,
  p: (n) => `<p class="rt-p${n.em ? " rt-em" : ""}">${esc(n.text)}</p>`,
  list: (n) => {
    const tag = n.ordered ? "ol" : "ul";
    return `<${tag} class="rt-list">${n.items.map((i) => `<li>${esc(i)}</li>`).join("")}</${tag}>`;
  },
  kv: (n) =>
    `<dl class="rt-kv">${n.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`,
  chips: (n) =>
    `<p class="rt-chips">${n.label ? `<span class="rt-chips-label">${esc(n.label)}</span>` : ""}${n.items.map((i) => `<b>${esc(i)}</b>`).join("")}</p>`,
  cards: (n) =>
    `<div class="rt-cards${n.cut ? " rt-cards--cut" : ""}">${n.cards
      .map(
        (c) =>
          `<article class="rt-card"><h5>${esc(c.title)}</h5>${c.lines.map((l) => `<p>${esc(l)}</p>`).join("")}</article>`,
      )
      .join("")}</div>`,
  table: (n) =>
    `<div class="rt-table-wrap"><table class="rt-table"><thead><tr>${n.headers.map((x) => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead><tbody>${n.rows
      .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></div>`,
  mc: (n) =>
    `<ol class="rt-mc">${n.items
      .map((it) => {
        const opts = it.options
          .map((o, k) => {
            const right = it.answer === k;
            return `<li class="rt-opt${right ? " rt-opt--right" : ""}"><span aria-hidden="true">${letter(k)}.</span> ${esc(o)}${right ? '<span class="rt-sr"> (correct answer)</span>' : ""}</li>`;
          })
          .join("");
        const notes = (it.note || []).map((x) => `<p class="rt-p rt-em">${esc(x)}</p>`).join("");
        return `<li><p class="rt-q">${esc(it.q)}</p><ul class="rt-opts">${opts}</ul>${notes}</li>`;
      })
      .join("")}</ol>`,
  lines: (n) =>
    `<div class="rt-lines">${n.label ? `<p class="rt-p">${esc(n.label)}</p>` : ""}${Array.from({ length: n.n }, () => '<div class="rt-line"></div>').join("")}</div>`,
};

export function nodesHtml(nodes) {
  return nodes
    .map((n) => {
      const fn = NODE[n.t];
      if (!fn) throw new Error(`routines: unknown node type "${n.t}"`);
      return fn(n);
    })
    .join("");
}
