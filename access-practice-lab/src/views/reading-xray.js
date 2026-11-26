// Reading X-Ray in the Reading Room: a lens toolbar above the passage and lens-aware passage text.
// Data: content/reading-room/xray.json (authored, validated by tools/lp-reading-xray.test.mjs). Logic: src/lang/reading-xray.js.
// reading-room.js calls xrayPrepare (once per render), xrayToolbarHTML, xrayParagraphText, xrayClick and xrayKey.
// Lenses are off by default and one at a time; showing a link is DOM-only (no re-render), so focus stays put.
import { loadReadingXray } from "../content.js";
import {
  KINDS,
  ROLES,
  availableLenses,
  evidenceRows,
  lensLinks,
  lensMarks,
  renderSentence,
} from "../lang/reading-xray.js";
import { splitSentences } from "../reading-room-check.js";
import { announce, esc, toHtml } from "../util.js";
import { ensureXrayStyles } from "./reading-xray-styles.js";

const LENS_NAMES = {
  pronoun: ["Pronoun lens", "Lente de pronombres"],
  connection: ["Connections lens", "Lente de conexiones"],
  evidence: ["Evidence lens", "Lente de evidencia"],
  structure: ["Structure lens", "Lente de estructura"],
};
const LENS_HOW = {
  pronoun: [
    "Words like she, it and they point back to someone or something. Tab to an underlined word and press Enter to see what it refers to. Esc closes.",
    "Palabras como she, it y they señalan a alguien o algo que ya se nombró. Usa Tab hasta una palabra subrayada y presiona Enter para ver a qué se refiere. Esc cierra.",
  ],
  connection: [
    "Signal words join two ideas: cause and effect, contrast, time order or an example. Tab to a signal word and press Enter to see the two ideas. Esc closes.",
    "Las palabras señal unen dos ideas: causa y efecto, contraste, orden en el tiempo o un ejemplo. Usa Tab hasta una palabra señal y presiona Enter para ver las dos ideas. Esc cierra.",
  ],
  evidence: [
    "After you answer a question, you can see the sentences that support the answer. Questions you have not tried stay closed.",
    "Después de responder una pregunta, puedes ver las oraciones que apoyan la respuesta. Las preguntas que no has intentado siguen cerradas.",
  ],
  structure: [
    "Each paragraph has a job in the text. The outline shows the job of every paragraph.",
    "Cada párrafo tiene una función en el texto. El esquema muestra la función de cada párrafo.",
  ],
};

let data = null; // content/reading-room/xray.json once loaded
let lens = ""; // the one lens that is on ("" = off)
let lensLesson = ""; // lens state belongs to one lesson
let view = null; // {lesson, entry, answers, I} for the current render
let active = null; // {kind, id, opener}

/** Load the lens data and bind this render's lesson. Missing data leaves the Reading Room exactly as it was. */
export async function xrayPrepare(lesson, progress, I, mode) {
  active = null;
  if (!data) data = await loadReadingXray().catch(() => ({ lessons: {} }));
  const entry = data.lessons?.[lesson.id];
  if (lensLesson !== lesson.id) {
    lens = "";
    lensLesson = lesson.id;
  }
  // The independent challenge hides supports; the lenses are supports.
  if (!entry || entry.revision !== lesson.revision || mode === "independent") {
    view = null;
    return;
  }
  if (!availableLenses(entry).includes(lens)) lens = "";
  view = { lesson, entry, answers: progress.answers || {}, I };
  ensureXrayStyles();
}

const T = (en, es) => toHtml(view.I.T(en, es));
const S = (pair) => view.I.S(pair[0], pair[1]);
const paraNo = (pid) => String(pid).replace(/^p/, "");

/** Toolbar + panel for the passage column, or "" when this lesson has no X-Ray data. */
export function xrayToolbarHTML() {
  if (!view) return "";
  const buttons = availableLenses(view.entry)
    .map(
      (key) =>
        `<button type="button" class="rx-lens" data-rx-lens="${key}" aria-pressed="${lens === key}">${T(...LENS_NAMES[key])}</button>`,
    )
    .join("");
  const panel = lens
    ? `<div class="rx-panel"><p class="rx-how">${T(...LENS_HOW[lens])}</p><p id="rxDetail" class="rx-detail" role="status" aria-live="polite"></p>${listHTML()}</div>`
    : "";
  return `<section class="rx${lens ? " is-on" : ""}" aria-labelledby="rxTitle"><div class="rx-bar"><h2 id="rxTitle" class="rx-title">${T("Reading X-Ray", "Rayos X de lectura")}</h2><p class="rx-sub">${T("Turn on one lens to see how this text is built. Lenses stay off until you choose one.", "Activa una lente para ver cómo está construido este texto. Las lentes están apagadas hasta que elijas una.")}</p><div class="rx-lenses" role="group" aria-label="${esc(view.I.S("Reading X-Ray lenses", "Lentes de rayos X de lectura"))}">${buttons}</div></div>${panel}<span id="rxHint" class="visually-hidden">${T("Press Enter to show the link.", "Presiona Enter para mostrar la conexión.")}</span></section>`;
}

function listHTML() {
  const { lesson, entry, answers } = view;
  if (lens === "pronoun" || lens === "connection") {
    const items = lensLinks(lesson, entry, lens)
      .map((x) => {
        const tag =
          lens === "connection" ? `<span class="rx-kind">${T(...KINDS[x.kind].label)}</span> ` : "";
        return `<li><button type="button" class="rx-item" data-rx-go="${esc(x.id)}">${tag}${T(...x.line)} <span class="rx-where">${T(`Paragraph ${paraNo((x.at || x.signal).pid)}`, `Párrafo ${paraNo((x.at || x.signal).pid)}`)}</span></button></li>`;
      })
      .join("");
    return `<h3 class="rx-all-title">${T("All links in this text", "Todas las conexiones de este texto")}</h3><ol class="rx-list">${items}</ol>`;
  }
  if (lens === "evidence") {
    const rows = evidenceRows(lesson, entry, answers)
      .map((r, i) =>
        r.open
          ? `<li><button type="button" class="rx-item" data-rx-ev-q="${esc(r.id)}" aria-expanded="false"><b>${T(`Question ${i + 1}`, `Pregunta ${i + 1}`)}</b> ${esc(r.prompt)}</button></li>`
          : `<li class="rx-locked"><b>${T(`Question ${i + 1}`, `Pregunta ${i + 1}`)}</b> ${esc(r.prompt)} <span class="rx-where">${T("Answer this question first. Its evidence opens after a supported answer or the explanation.", "Primero responde esta pregunta. Su evidencia se abre después de una respuesta con apoyo o de la explicación.")}</span></li>`,
      )
      .join("");
    return `<ol class="rx-list">${rows}</ol>`;
  }
  const outline = entry.structure
    .map(
      (row) =>
        `<li><button type="button" class="rx-item" data-rx-para="${esc(row.p)}"><b>${T(`Paragraph ${paraNo(row.p)}`, `Párrafo ${paraNo(row.p)}`)} · ${T(...ROLES[row.role])}</b> ${T(row.gist.en, row.gist.es)}</button></li>`,
    )
    .join("");
  return `<ol class="rx-list rx-outline" aria-label="${esc(view.I.S("Outline of the text", "Esquema del texto"))}">${outline}</ol>`;
}

/** Passage paragraph text for the active lens, or null when no lens is on (the caller renders its own text). */
export function xrayParagraphText(p, chosen) {
  if (!view || !lens) return null;
  const { lesson, entry, answers } = view;
  const marks = lens === "structure" ? new Map() : lensMarks(lesson, entry, lens, answers);
  const text = splitSentences(p.text)
    .map((sentence, si) => {
      const key = `${p.id}:${si}`;
      const inner = renderSentence(sentence, marks.get(key) || [], "rxHint");
      return chosen.has(key)
        ? `<mark class="rr-evidence-mark">${inner}</mark>`
        : `<span>${inner}</span>`;
    })
    .join(" ");
  if (lens !== "structure") return text;
  const row = entry.structure.find((x) => x.p === p.id);
  return row
    ? `<span class="rx-role" id="rx-role-${esc(p.id)}" tabindex="-1">${T(...ROLES[row.role])}</span> ${text}`
    : text;
}

// ---------- showing one link (DOM only) ----------

const passage = () => document.querySelector(".rr-passage");
const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const byIds = (attr, id) => [...document.querySelectorAll(`[${attr}~="${CSS.escape(id)}"]`)];

function clear() {
  for (const el of document.querySelectorAll(".rx-anchor.is-on, .rx-span.is-on, .rx-item.is-on")) {
    el.classList.remove("is-on");
    el.removeAttribute("data-rx-tag");
    if (el.hasAttribute("aria-expanded")) el.setAttribute("aria-expanded", "false");
  }
  document.querySelector(".rx-arrow")?.remove();
  const detail = document.getElementById("rxDetail");
  if (detail) detail.textContent = "";
  active = null;
}

function reveal(el) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top < 0 || r.bottom > window.innerHeight)
    el.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
}

function drawArrow(fromEl, toEl) {
  const host = passage();
  if (!host || !fromEl || !toEl) return;
  const hb = host.getBoundingClientRect();
  const a = fromEl.getClientRects()[0] || fromEl.getBoundingClientRect();
  const b = toEl.getClientRects()[0] || toEl.getBoundingClientRect();
  const ax = a.left + a.width / 2 - hb.left;
  const ay = a.top - hb.top;
  const bx = b.left + Math.min(b.width, 160) / 2 - hb.left;
  const by = b.top - hb.top;
  const top = Math.max(2, Math.min(ay, by) - 22);
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "rx-arrow");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", String(host.scrollWidth));
  svg.setAttribute("height", String(host.scrollHeight));
  svg.innerHTML = `<defs><marker id="rxHead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z"/></marker></defs><path d="M${ax},${ay} Q${(ax + bx) / 2},${top} ${bx},${by - 2}" marker-end="url(#rxHead)"/>`;
  host.append(svg);
}

function show(kind, id, opener) {
  if (!view) return;
  const same = active && active.kind === kind && active.id === id;
  clear();
  if (same) return;
  const detail = document.getElementById("rxDetail");
  let line = "";
  let target = null;
  if (kind === "pronoun") {
    const link = lensLinks(view.lesson, view.entry, "pronoun").find((x) => x.id === id);
    const btn = document.querySelector(`[data-rx-pron~="${CSS.escape(id)}"]`);
    const refs = byIds("data-rx-ref", id);
    if (!link || !btn) return;
    btn.classList.add("is-on");
    btn.setAttribute("aria-expanded", "true");
    for (const r of refs) {
      r.classList.add("is-on");
      r.dataset.rxTag = view.I.S(`“${link.at.phrase}” means`, `“${link.at.phrase}” significa`);
    }
    line = S(link.line);
    target = refs[0];
    drawArrow(btn, refs[0]);
  } else if (kind === "connection") {
    const c = lensLinks(view.lesson, view.entry, "connection").find((x) => x.id === id);
    const btn = document.querySelector(`[data-rx-sig~="${CSS.escape(id)}"]`);
    if (!c || !btn) return;
    const k = KINDS[c.kind];
    btn.classList.add("is-on");
    btn.setAttribute("aria-expanded", "true");
    const from = byIds("data-rx-from", id);
    const to = byIds("data-rx-to", id);
    for (const el of from) (el.classList.add("is-on"), (el.dataset.rxTag = S(k.from)));
    for (const el of to) (el.classList.add("is-on"), (el.dataset.rxTag = S(k.to)));
    line = S(c.line);
    target = from[0];
    if (k.arrow) drawArrow(from[0], to[0]);
  } else if (kind === "evidence") {
    const row = evidenceRows(view.lesson, view.entry, view.answers).find(
      (r) => r.id === id && r.open,
    );
    if (!row) return;
    const marks = byIds("data-rx-ev", id);
    for (const el of marks)
      (el.classList.add("is-on"), (el.dataset.rxTag = view.I.S("Evidence", "Evidencia")));
    opener?.classList.add("is-on");
    opener?.setAttribute("aria-expanded", "true");
    line = view.I.S(
      `Evidence: ${row.sentences.map((s) => `“${s.text}” (paragraph ${paraNo(s.pid)})`).join(" ")}`,
      `Evidencia: ${row.sentences.map((s) => `“${s.text}” (párrafo ${paraNo(s.pid)})`).join(" ")}`,
    );
    target = marks[0];
  }
  active = { kind, id, opener };
  if (detail) detail.textContent = line;
  reveal(target);
}

/** Click handling for the lens toolbar and passage. Returns true when the click was an X-Ray control. */
export function xrayClick(e, ctx) {
  const b = e.target.closest?.(
    "[data-rx-lens],[data-rx-pron],[data-rx-sig],[data-rx-go],[data-rx-ev-q],[data-rx-para]",
  );
  if (!b || !view) return false;
  if (b.dataset.rxLens) {
    const next = lens === b.dataset.rxLens ? "" : b.dataset.rxLens;
    lens = next;
    ctx.rerender();
    announce(
      next
        ? view.I.S(`${LENS_NAMES[next][0]} on.`, `${LENS_NAMES[next][1]} activada.`)
        : view.I.S("Lens off.", "Lente apagada."),
      { toast: false },
    );
    return true;
  }
  if (b.dataset.rxPron) return (show("pronoun", b.dataset.rxPron.split(" ")[0], b), true);
  if (b.dataset.rxSig) return (show("connection", b.dataset.rxSig.split(" ")[0], b), true);
  if (b.dataset.rxGo) {
    const id = b.dataset.rxGo;
    const anchor = document.querySelector(
      `[data-rx-pron~="${CSS.escape(id)}"],[data-rx-sig~="${CSS.escape(id)}"]`,
    );
    if (!anchor) return true;
    anchor.focus({ preventScroll: true });
    show(lens, id, anchor);
    return true;
  }
  if (b.dataset.rxEvQ) return (show("evidence", b.dataset.rxEvQ, b), true);
  if (b.dataset.rxPara) {
    const badge = document.getElementById(`rx-role-${b.dataset.rxPara}`);
    badge?.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
    badge?.focus({ preventScroll: true });
    return true;
  }
  return false;
}

/** Esc closes the open link and returns focus to the word (or list item) that opened it. */
export function xrayKey(e) {
  if (e.key !== "Escape" || !active) return false;
  const opener = active.opener;
  clear();
  if (opener?.isConnected) opener.focus();
  e.preventDefault();
  return true;
}

if (typeof window !== "undefined")
  window.addEventListener("resize", () => {
    if (!active || !document.querySelector(".rx-arrow")) return;
    const { kind, id, opener } = active;
    clear();
    show(kind, id, opener);
  });
