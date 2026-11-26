// nexus/render.mjs — packet blocks to a print-ready HTML document (the PDF path:
// the browser's own Print → Save as PDF), and the self-contained offline HTML
// mission. Both are strings; nothing here touches the live DOM. Pure.

import { overlay } from "./language.mjs";
import { consequences, questions, story, transferQuestion } from "./resource.mjs";
import { curriculumLine } from "./packet.mjs";

export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const PRINT_CSS = `@page{size:letter;margin:0.6in}body{font:12pt/1.45 Calibri,Arial,sans-serif;color:#142033;margin:0}h1{font-size:20pt;color:#16324f;margin:0 0 4pt}h2{font-size:14pt;color:#1f5f5b;margin:14pt 0 4pt;break-after:avoid}.meta{font-style:italic;font-size:10.5pt;color:#3d4b5c;margin:2pt 0}.q{margin:10pt 0 2pt;break-inside:avoid}.ans{margin:0 0 6pt 18pt}.key{margin:0 0 2pt 18pt;font-style:italic}.frame{margin:4pt 0 4pt 18pt;padding-left:8pt;border-left:3pt solid #2f7f7b}.line{border-bottom:1px solid #8796a5;height:22pt}table{border-collapse:collapse;width:100%}td{border:1px solid #8796a5;padding:4pt 6pt;vertical-align:top}td:first-child{font-weight:700;width:32%}.bar{position:sticky;top:0;background:#fbf7ef;border-bottom:1px solid #ccd8e4;padding:10px 16px;font:14px Calibri,Arial,sans-serif}.bar button{font:inherit;font-weight:700;padding:8px 14px;border-radius:999px;border:0;background:#16324f;color:#fff;cursor:pointer;min-height:44px}main{max-width:7.3in;margin:16px auto;padding:0 16px}@media print{.bar{display:none}main{margin:0;padding:0;max-width:none}}`;

/** A complete print document. `autoprint` opens the print dialog once fonts settle. */
export function printHtml(blocks, { lang = "en", title = "Mission" } = {}) {
  const body = blocks
    .map((b) => {
      switch (b.t) {
        case "h1":
          return `<h1>${esc(b.text)}</h1>`;
        case "h2":
          return `<h2>${esc(b.text)}</h2>`;
        case "meta":
          return b.text ? `<p class="meta">${esc(b.text)}</p>` : "";
        case "p":
          return `<p>${esc(b.text)}</p>`;
        case "q":
          return `<p class="q"><b>${b.n}.</b> ${esc(b.text)}</p><p class="ans">____________________ ${esc(b.unit || "")}</p>`;
        case "key":
          return `<p class="key">${esc(b.text)}</p>`;
        case "frame":
          return `<p class="frame">${esc(b.text)}</p>`;
        case "lines":
          return Array.from({ length: b.n }, () => '<div class="line"></div>').join("");
        case "words":
          return `<table>${b.rows.map(([a, d]) => `<tr><td>${esc(a)}</td><td>${esc(d)}</td></tr>`).join("")}</table>`;
        default:
          return "";
      }
    })
    .join("\n");
  const label = lang === "es" ? "Imprimir o guardar como PDF" : "Print or save as PDF";
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${PRINT_CSS}</style></head><body><div class="bar"><button type="button" onclick="print()">${label}</button></div><main>${body}</main></body></html>`;
}

/** The data an offline mission needs, in the reader's language. Teacher notes never ship. */
export function offlinePayload(r, lang = "en") {
  const T = (p) => (lang === "es" && p?.es ? p.es : p?.en || "");
  const q = (x) => ({ id: x.id, stem: T(x.stem), unit: T(x.unit), hint: T(x.hint), answer: x.answer, miscon: x.miscon.map((m) => ({ answer: m.answer, why: T(m.why) })) });
  const ov = overlay(r);
  return {
    lang,
    title: T(r.title),
    objective: T(r.objective),
    aligned: curriculumLine(r, lang),
    story: T(story(r)),
    numbers: consequences(r).map((c) => [T(c.label), String(c.value)]),
    questions: questions(r).map(q),
    transfer: q(transferQuestion(r, "offline")),
    vocab: ov ? r.vocab.map((v) => [T(v.term), T(v.def)]) : [],
    frames: ov ? [...ov.kernels, ...(ov.bbs || [])].map(T) : [],
  };
}

// The runtime is a plain function serialized into the file, so it runs with no network, no modules
// and no site code. It is deliberately small: questions with checking, hints, misconception cues,
// a transfer problem, a written explanation with frames, and save/resume in this browser.
function offlineRuntime(D) {
  const $ = (s) => document.querySelector(s);
  const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const KEY = "nt-nexus-offline:v1:" + D.title;
  let st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { st = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) {} };
  const es = D.lang === "es";
  const W = es ? { check: "Comprobar", hint: "Pista", right: "¡Correcto!", again: "Aún no. Revisa e inténtalo otra vez.", write: "Escribe tu explicación", saved: "Guardado en este dispositivo." } : { check: "Check", hint: "Hint", right: "Correct!", again: "Not yet. Look again and try once more.", write: "Write your explanation", saved: "Saved on this device." };
  const parse = (t) => { const s = String(t).replace(/(\d),(?=\d{3}(?!\d))/g, "$1").replace(/[$,\s]+/g, " ").replace(/−/g, "-").trim(); const f = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/); if (f) return Number(f[2]) ? f[1] / f[2] : null; const n = s.match(/^-?\d*\.?\d+/); return n ? Number(n[0]) : null; };
  const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b)) || (Math.abs(a - b) < 0.0051 && !Number.isInteger(b));
  const card = (q, n) => `<section class="card" data-q="${q.id}"><p class="stem"><b>${n}.</b> ${e(q.stem)}</p><label class="sr" for="in-${q.id}">${e(q.stem)}</label><input id="in-${q.id}" inputmode="decimal" autocomplete="off" value="${e((st[q.id] || {}).text || "")}"> <span>${e(q.unit)}</span><div class="row"><button type="button" data-check="${q.id}">${W.check}</button><button type="button" class="ghost" data-hint="${q.id}">${W.hint}</button></div><p class="fb" role="status"></p></section>`;
  const all = D.questions.concat([D.transfer]);
  $("#app").innerHTML = `<h1>${e(D.title)}</h1>${D.aligned ? `<p class="meta">${e(D.aligned)}</p>` : ""}<p>${e(D.objective)}</p><section class="card"><p>${e(D.story)}</p>${D.numbers.length ? `<table>${D.numbers.map((r) => `<tr><td>${e(r[0])}</td><td>${e(r[1])}</td></tr>`).join("")}</table>` : ""}</section>${D.vocab.length ? `<section class="card"><table>${D.vocab.map((r) => `<tr><td><b>${e(r[0])}</b></td><td>${e(r[1])}</td></tr>`).join("")}</table></section>` : ""}${D.questions.map((q, i) => card(q, i + 1)).join("")}${card(D.transfer, D.questions.length + 1)}<section class="card"><label for="why"><b>${W.write}</b></label>${D.frames.map((f) => `<p class="frame">${e(f)}</p>`).join("")}<textarea id="why" rows="5">${e(st.why || "")}</textarea><p class="meta" id="sv"></p></section>`;
  const fb = (id, html, ok) => { const el = document.querySelector(`[data-q="${id}"] .fb`); el.innerHTML = html; el.className = "fb " + (ok ? "ok" : "cue"); };
  document.addEventListener("click", (ev) => {
    const c = ev.target.closest("[data-check]"); const h = ev.target.closest("[data-hint]");
    if (c) { const q = all.find((x) => x.id === c.dataset.check); const t = $("#in-" + q.id).value; const n = parse(t); const m = n == null ? null : q.miscon.find((x) => near(n, x.answer)); const ok = n != null && near(n, q.answer); st[q.id] = { text: t, ok, tries: ((st[q.id] || {}).tries || 0) + 1 }; save(); fb(q.id, ok ? W.right : e(m ? m.why : W.again), ok); }
    if (h) { const q = all.find((x) => x.id === h.dataset.hint); fb(q.id, e(q.hint), false); }
  });
  $("#why").addEventListener("input", (ev) => { st.why = ev.target.value; save(); $("#sv").textContent = W.saved; });
}

const OFFLINE_CSS = `body{font:17px/1.5 system-ui,Arial,sans-serif;color:#142033;background:#fbf7ef;margin:0}main{max-width:720px;margin:auto;padding:16px}h1{color:#16324f;margin:8px 0}.meta{color:#4c5d70;font-size:15px}.card{background:#fff;border:1px solid #ccd8e4;border-radius:12px;padding:14px;margin:12px 0}input{font:inherit;min-height:44px;width:9em;padding:4px 8px;border:2px solid #546173;border-radius:8px}textarea{font:inherit;width:100%;box-sizing:border-box;border:2px solid #546173;border-radius:8px;padding:8px}button{font:inherit;font-weight:700;min-height:44px;padding:6px 16px;border-radius:999px;border:2px solid #16324f;background:#16324f;color:#fff;margin:8px 8px 0 0;cursor:pointer}button.ghost{background:#fff;color:#16324f}:focus-visible{outline:3px solid #c27c0e;outline-offset:2px}.fb:empty{display:none}.fb{padding:8px 10px;border-radius:8px}.ok{background:#eef7f6;border-left:5px solid #0b6e6b}.cue{background:#fbf3e4;border-left:5px solid #8a5a00}.frame{border-left:4px solid #2f7f7b;padding-left:8px;margin:6px 0}table{border-collapse:collapse;width:100%}td{border:1px solid #ccd8e4;padding:6px}.sr{position:absolute;left:-9999px}`;

/** A single-file offline mission. */
export function offlineHtml(r, lang = "en") {
  const D = offlinePayload(r, lang);
  const json = JSON.stringify(D).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(D.title)}</title><style>${OFFLINE_CSS}</style></head><body><main id="app"></main><script>(${offlineRuntime.toString()})(${json});</script></body></html>`;
}
