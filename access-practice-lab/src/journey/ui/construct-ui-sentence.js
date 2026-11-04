// Language Construction UI: the sentence modules (expand, combine) and the supports shared by every module.
// The tray is a real text input (typing always works); chips from the Details shelf, the word bank and the
// source sentences are tapped in. A "What changed?" panel highlights the learner's new words, a cause arrow
// joins cause and effect, and the connector lab restructures the learner's own clauses.
import { html, icon, raw } from "../../util.js";
import * as E from "../engines/construct.js";
import {
  INTRO,
  TAG_LABEL,
  causeArrow,
  evidenceList,
  feedbackBox,
  markText,
  quote,
  tt,
  ts,
  wordTiles,
} from "./construct-ui-shared.js";

// ── supports ─────────────────────────────────────────────────────────────────
const AUTO = { A: ["frames", "bank", "shelf"], B: ["frames"], C: [] };
const HELP_LABEL = {
  frames: ["Show sentence frames", "Mostrar marcos de oraciones"],
  bank: ["Show word bank", "Mostrar banco de palabras"],
  shelf: ["Show detail ideas", "Mostrar ideas de detalles"],
};
export const framesFor = (env) => {
  const f = env.pack?.frames || {};
  return env.support === "A" ? f.A || [] : f.B?.length ? f.B : f.A || [];
};
const available = (api, id) =>
  id === "frames"
    ? framesFor(api.env).length > 0
    : id === "bank"
      ? (api.env.pack?.vocab || []).length > 0
      : E.SENTENCE_MODULES.includes(api.task.module);
/** Visible: auto-shown for this support level, or opened by the learner. Never in transfer or "on my own". */
export const shown = (api, id) =>
  api.supportsOn && ((AUTO[api.env.support] || []).includes(id) || api.rec.supports.includes(id));
export const autoShown = (api) =>
  api.supportsOn ? (AUTO[api.env.support] || []).filter((id) => available(api, id)) : [];

const chipBtn = (cls, text, v, key) =>
  html`<button type="button" class="cn-chip ${cls}" data-cn="chip" data-v="${v}" data-k="${key}">
    <span lang="en">${text}</span>
  </button>`;

function framesPanel(api) {
  const { env } = api;
  return html`<details class="cn-support cn-frames" open data-help="frames">
    <summary data-k="sup-frames">${tt(env, ["Sentence frames", "Marcos de oraciones"])}</summary>
    <ul>
      ${framesFor(env).map((f) => html`<li lang="en">${f}</li>`)}
    </ul>
  </details>`;
}
function bankPanel(api, tap) {
  const { env } = api;
  return html`<details class="cn-support cn-bank" open data-help="bank">
    <summary data-k="sup-bank">${tt(env, ["Word bank", "Banco de palabras"])}</summary>
    <ul>
      ${(env.pack.vocab || []).map(
        ([term, meaning, es], k) =>
          html`<li>
            ${tap ? chipBtn("cn-t-bank", term, term, `bank-${k}`) : html`<strong lang="en">${term}</strong>`}
            <span class="cn-bank-m" lang="en">${meaning}</span>
            <span class="cn-bank-es" lang="es">${es}</span>
          </li>`,
      )}
    </ul>
  </details>`;
}
function shelfPanel(api) {
  const { env, task } = api;
  const t = E.resolveTask(task, false);
  const groups =
    t.module === "expand"
      ? E.detailShelf(t)
      : [{ id: "link", label: "", tag: "cause", cues: E.relationShelf(t) }];
  return html`<details class="cn-support cn-shelf" open data-help="shelf">
    <summary data-k="sup-shelf">${tt(env, ["Details shelf", "Estante de detalles"])}</summary>
    ${groups.map(
      (g) =>
        html`<div
          class="cn-shelf-group cn-t-${g.tag}"
          role="group"
          aria-label="${g.label || env.I.S("Link words", "Palabras de enlace")}"
        >
          <p class="cn-shelf-label">
            ${g.label ? html`<span lang="en">${g.label}</span>` : tt(env, ["Link words", "Palabras de enlace"])}
          </p>
          <div class="cn-chips">
            ${g.cues.map((c, k) => chipBtn(`cn-t-${g.tag}`, c, c, `shelf-${g.id}-${k}`))}
          </div>
        </div>`,
    )}
  </details>`;
}

/** The support panels for a phase: each is shown (auto or requested) or offered as a help button. */
export function supportPanels(api, ids, { tapChips = false } = {}) {
  if (!api.supportsOn) return "";
  const { env } = api;
  const panel = {
    frames: () => framesPanel(api),
    bank: () => bankPanel(api, tapChips),
    shelf: () => shelfPanel(api),
  };
  const open = ids.filter((id) => available(api, id) && shown(api, id));
  const offer = ids.filter((id) => available(api, id) && !shown(api, id));
  return html`<div class="cn-supports">
    ${open.map((id) => panel[id]())}
    ${offer.length ? html`<div class="cn-help" role="group" aria-label="${env.I.S("Help", "Ayuda")}">${offer.map((id) => html`<button type="button" class="btn ghost small" data-cn="help" data-v="${id}" data-k="help-${id}">${icon("bulb")} ${tt(env, HELP_LABEL[id])}</button>`)}</div>` : ""}
  </div>`;
}

// ── tray ─────────────────────────────────────────────────────────────────────
/** Insert a chip before the sentence's end punctuation, spaced; the first chip of an empty tray is capitalised. */
export function insertChip(text, chip) {
  const m = String(text).match(/^([\s\S]*?)(\s*[.!?]+)?\s*$/);
  const body = m[1].trimEnd();
  const end = (m[2] || "").trim();
  const add = String(chip).replace(/[.!?]+$/, "");
  if (!body) return add.charAt(0).toUpperCase() + add.slice(1);
  const lead =
    /^(?:I|[A-Z][a-z]+ [A-Z0-9])/.test(add) || /^[A-Z]{2,}/.test(add)
      ? add
      : add.charAt(0).toLowerCase() + add.slice(1);
  return `${body} ${lead}${end}`;
}

function trayHTML(api, task, draft, locked) {
  const { env } = api;
  const starting = task.module === "expand" ? task.base : "";
  return html`<div class="cn-tray-wrap">
    <label class="cn-label" for="cn-tray"
      >${tt(env, task.module === "expand" ? ["Your sentence (type, or tap chips to add)", "Tu oración (escribe o toca fichas para agregar)"] : ["Your joined sentence (type, or tap to add)", "Tu oración unida (escribe o toca para agregar)"])}</label
    >
    <div class="cn-tray">
      <textarea
        id="cn-tray"
        class="cn-input"
        rows="3"
        lang="en"
        data-k="tray"
        data-cn-text="draft"
        ${locked ? raw("readonly") : ""}
        spellcheck="true"
        autocomplete="off"
      >
${draft.text}</textarea>
      <div class="cn-tiles" aria-hidden="true">${wordTiles(draft.text, starting)}</div>
    </div>
    ${
      locked
        ? ""
        : html`<div class="cn-tools">
            <button
              type="button"
              class="btn ghost small"
              data-cn="undo"
              data-k="undo"
              ${draft.history?.length ? "" : raw("disabled")}
            >
              ${tt(env, ["Undo", "Deshacer"])}
            </button>
            <button type="button" class="btn ghost small" data-cn="reset" data-k="reset">
              ${tt(env, task.module === "expand" ? ["Start over", "Empezar de nuevo"] : ["Clear", "Borrar"])}
            </button>
          </div>`
    }
  </div>`;
}

function sourceChips(api, task) {
  const { env } = api;
  if (task.module !== "combine") return html`<p class="cn-base" lang="en">${task.base}</p>`;
  return html`<div
    class="cn-pair"
    role="group"
    aria-label="${env.I.S("The two sentences to join", "Las dos oraciones para unir")}"
  >
    ${task.pair.map((s, k) => html`<button type="button" class="cn-chip cn-t-source" data-cn="chip" data-v="${s}" data-k="pair-${k}"><span class="cn-chip-n" aria-hidden="true">${k + 1}</span><span lang="en">${s}</span></button>`)}
  </div>`;
}

// ── feedback and "What changed?" ─────────────────────────────────────────────
function checklist(api, r) {
  const { env } = api;
  const row = (met, label, ev, key) =>
    html`<li class="${met ? "is-met" : "is-open"}" data-k="${key}">
      <span class="cn-mark" aria-hidden="true">${met ? icon("check") : ""}</span
      ><span class="cn-need"
        ><span class="cn-need-l" lang="en">${label}</span>
        <span class="visually-hidden"
          >${tt(env, met ? ["done", "listo"] : ["not yet", "todavía no"])}</span
        >${ev}</span
      >
    </li>`;
  if (r.module === "expand")
    return html`<ul class="cn-needs">
      ${row(r.baseKept.met, r.baseKept.met ? "Keeps the base idea" : "Keep the base idea", evidenceList(r.baseKept.evidence.slice(0, 2)), "need-base")}${r.needs.map((n) => row(n.met, n.label, n.met ? evidenceList(n.evidence) : "", `need-${n.id}`))}
    </ul>`;
  const rel = r.connector;
  const keep = r.kept.map((k) => k.span);
  return html`<ul class="cn-needs">
    ${row(Boolean(rel) && !r.sideBySide && Boolean(r.relationship?.complete || rel?.job !== "cause"), "Joined with a connector", rel ? evidenceList([rel.span]) : "", "need-link")}
    ${row(r.keepMissing.length === 0 && Boolean(r.text), "Keeps both ideas", evidenceList(keep), "need-keep")}
    ${r.relationship && rel?.job === "cause" ? row(!r.reversed, "Reason and result in the right roles", "", "need-direction") : ""}
  </ul>`;
}

function whatChanged(api, task, r, text) {
  const { env } = api;
  const label = (s) => tt(env, TAG_LABEL[s.tag]);
  const after =
    r.module === "expand"
      ? markText(text, r.added, (s) => `cn-new cn-t-${s.tag}`, label)
      : r.connector
        ? markText(
            text,
            [r.connector.span],
            () => "cn-new cn-t-cause",
            () => tt(env, ["link", "enlace"]),
          )
        : html`${text}`;
  const before =
    r.module === "expand"
      ? html`<span lang="en">${task.base}</span>`
      : task.pair.map((s) => html`<span lang="en">${s}</span> `);
  return html`<section class="cn-changed" aria-labelledby="cn-changed-h">
    <h4 id="cn-changed-h">${tt(env, ["What changed?", "¿Qué cambió?"])}</h4>
    <p class="cn-line">
      <span class="cn-line-k">${tt(env, ["Before", "Antes"])}</span>
      <span class="cn-before">${before}</span>
    </p>
    <p class="cn-line">
      <span class="cn-line-k">${tt(env, ["After", "Después"])}</span>
      <span class="cn-after" lang="en">${after}</span>
    </p>
    ${
      r.module === "expand" && r.added.length
        ? html`<ul class="cn-legend">
            ${r.added.map((a) => html`<li><mark class="cn-new cn-t-${a.tag}">${a.text}</mark> <span>${tt(env, TAG_LABEL[a.tag])}</span></li>`)}
          </ul>`
        : ""
    }
    ${r.module === "combine" && r.structure ? html`<p class="cn-structure"><strong>${tt(env, ["Structure", "Estructura"])}:</strong> ${tt(env, r.structure.label)}${r.structure.shape ? html` <span class="cn-shape">(${r.structure.shape.type})</span>` : ""}</p>` : ""}
    ${r.relationship?.complete && (r.module === "expand" || r.connector?.job === "cause") ? causeArrow(env, r.relationship) : ""}
  </section>`;
}

// ── connector lab (expand, after the sentence is accepted) ───────────────────
function markClauses(preview, rel) {
  const find = (clause) => {
    const m = new RegExp(clause.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").exec(preview);
    return m ? { start: m.index, end: m.index + m[0].length } : null;
  };
  const c = find(rel.cause.text);
  const e = find(rel.effect.text);
  const spans = [c && { ...c, k: "cause" }, e && { ...e, k: "effect" }].filter(Boolean);
  return markText(
    preview,
    spans,
    (s) => `cn-clause cn-clause-${s.k}`,
    (s) => s.k,
  );
}

function connectorLab(api, task, text) {
  const { env, rec } = api;
  const cmp = E.compareConnectors(task, text);
  if (!cmp.relationship?.complete || !(task.altConnectors || []).length) return "";
  const swap = rec.draft.swap || {};
  const alt = (task.altConnectors || []).find((a) => a.word === swap.word);
  const preview = alt ? E.swapPreview(text, alt.word) : null;
  const meaning = swap.compared ? E.meaningChange(task, text, swap.compared) : null;
  return html`<section class="cn-swap" aria-labelledby="cn-swap-h">
    <h4 id="cn-swap-h">${tt(env, ["Connector lab", "Laboratorio de conectores"])}</h4>
    <p>${tt(env, cmp.prompt)}</p>
    <div
      class="cn-chips"
      role="group"
      aria-label="${env.I.S("Try a connector", "Prueba un conector")}"
    >
      ${(task.altConnectors || []).map((a) => html`<button type="button" class="cn-chip cn-t-cause" data-cn="swap" data-v="${a.word}" data-k="swap-${a.word}" aria-pressed="${swap.word === a.word}"><span lang="en">${a.word}</span></button>`)}
    </div>
    ${
      alt
        ? html`<div class="cn-swap-out" aria-live="polite">
            ${preview ? html`<p class="cn-after cn-reveal" lang="en">${markClauses(preview, cmp.relationship)}</p>` : html`<p class="cn-muted">${tt(env, ["This connector needs a different sentence shape. Read the note, then try it in your own words below.", "Este conector necesita otra forma de oración. Lee la nota y pruébalo con tus palabras abajo."])}</p>`}
            <p class="cn-note cn-reveal" lang="en">${alt.note}</p>
          </div>`
        : ""
    }
    <div class="cn-own">
      <label class="cn-label" for="cn-own"
        >${tt(env, ["Write the same idea with a different connector", "Escribe la misma idea con un conector distinto"])}</label
      >
      <textarea id="cn-own" class="cn-input" rows="2" lang="en" data-k="own" data-cn-text="swap">
${swap.own || ""}</textarea>
      <button type="button" class="btn btn-secondary small" data-cn="compare" data-k="compare">
        ${tt(env, ["Compare the two", "Comparar las dos"])}
      </button>
    </div>
    ${meaning ? html`<div class="cn-compare cn-reveal" aria-live="polite">${meaning.messages.map((m) => html`<p>${tt(env, m)}</p>`)}</div>` : ""}
  </section>`;
}

// ── body ─────────────────────────────────────────────────────────────────────
export function sentenceBody(api) {
  const { env, task: base, rec, phase } = api;
  const transfer = phase === "transfer" || phase === "done";
  const task = E.resolveTask(base, transfer);
  const draft = transfer ? rec.tdraft : rec.draft;
  const last = transfer ? rec.tlast : rec.last;
  const locked = phase === "accepted" || phase === "done";
  const r = last?.result;
  const text = last?.input?.text ?? draft.text;
  const helpIds =
    base.module === "expand" ? ["frames", "bank", "shelf"] : ["frames", "bank", "shelf"];
  return html` ${
      phase === "explore"
        ? html`<p class="cn-intro">${tt(env, INTRO[base.module])}</p>
            ${
              base.module === "expand"
                ? html`<ul class="cn-goals">
                    ${base.needs.map((n) => html`<li lang="en">${n.label}</li>`)}
                  </ul>`
                : ""
            }`
        : ""
    }
    <div class="cn-source">
      <p class="cn-label">
        ${tt(env, base.module === "expand" ? (transfer ? ["Expand this new sentence", "Amplía esta oración nueva"] : ["Start from this sentence", "Empieza con esta oración"]) : transfer ? ["Join these new sentences", "Une estas oraciones nuevas"] : ["Join these sentences", "Une estas oraciones"])}
      </p>
      ${sourceChips(api, task)}
    </div>
    ${phase === "explore" ? "" : trayHTML(api, task, draft, locked)}
    ${supportPanels(api, helpIds, { tapChips: phase !== "explore" && !locked })}
    ${
      r
        ? html`<div class="cn-result">
            ${feedbackBox(env, r.summary, { id: "fb", extra: html`${checklist(api, r)}${!r.accepted && r.nextMove ? html`<p class="cn-next"><strong>${tt(env, ["Next move", "Siguiente paso"])}:</strong> ${tt(env, r.nextMove)}</p>` : ""}` })}
            ${r.text.trim() ? whatChanged(api, task, r, r.text) : ""}
            ${phase === "accepted" && base.module === "expand" ? connectorLab(api, task, r.text) : ""}
          </div>`
        : ""
    }`;
}

// ── actions ──────────────────────────────────────────────────────────────────
const domText = (root, key) => root.querySelector(`[data-k="${key}"]`)?.value;

/** Handle a sentence-module action; returns { state, focus } or null. */
export function sentenceHandle(api, act, el, root) {
  const { state, i, rec, phase, env } = api;
  const transfer = phase === "transfer" || phase === "done";
  const dk = transfer ? "tdraft" : "draft";
  const draft = rec[dk];
  const patch = (p, focus) => ({
    state: E.setRecord(state, i, { [dk]: { ...draft, ...p } }),
    focus,
  });
  const typed = domText(root, "tray") ?? draft.text;
  const task = E.resolveTask(api.task, transfer);
  switch (act) {
    case "chip": {
      // shelf and bank chips are supports; the source sentences of a combine task are the task itself
      if (!api.supportsOn && !String(el.dataset.k).startsWith("pair-")) return null;
      const text = insertChip(typed, el.dataset.v);
      return patch({ text, history: [...(draft.history || []), typed].slice(-20) }, "tray");
    }
    case "undo": {
      const h = [...(draft.history || [])];
      const text = h.pop();
      return text == null ? null : patch({ text, history: h }, "tray");
    }
    case "reset":
      return patch(
        {
          text: task.module === "expand" ? task.base : "",
          history: [...(draft.history || []), typed].slice(-20),
        },
        "tray",
      );
    case "swap":
      return patch({ swap: { ...(draft.swap || {}), word: el.dataset.v } }, `swap-${el.dataset.v}`);
    case "compare": {
      const own = domText(root, "own") ?? "";
      return patch({ swap: { ...(draft.swap || {}), own, compared: own } }, "compare");
    }
    default:
      return null;
  }
}

/** The text a typing event persists: the draft key it belongs to and the patch. */
export function textPatch(api, el) {
  const transfer = api.phase === "transfer" || api.phase === "done";
  const dk = transfer ? "tdraft" : "draft";
  const draft = api.rec[dk];
  const p =
    el.dataset.cnText === "swap"
      ? { swap: { ...(draft.swap || {}), own: el.value } }
      : { text: el.value };
  return {
    state: E.setRecord(api.state, api.i, { [dk]: { ...draft, ...p } }),
    focus: el.dataset.k,
  };
}
