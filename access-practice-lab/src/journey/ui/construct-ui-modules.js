// Language Construction UI: the selection modules (connector, morphology, pronoun, discourse).
// Every interaction is a tap or a button (no drag): chips for choices, a slot machine for word parts,
// referent pickers for pronouns, up/down buttons to reorder sentences.
import { html, icon, raw } from "../../util.js";
import * as E from "../engines/construct.js";
import { INTRO, chev, feedbackBox, markText, tt, typeLabel } from "./construct-ui-shared.js";
import { supportPanels } from "./construct-ui-sentence.js";

const dis = (locked) => (locked ? raw("disabled") : "");
const pickChip = (act, i, v, on, locked, text) =>
  html`<button
    type="button"
    class="cn-chip"
    data-cn="${act}"
    data-i="${i}"
    data-v="${v}"
    data-k="${act}-${i}-${v}"
    aria-pressed="${on}"
    ${dis(locked)}
  >
    <span lang="en">${text ?? v}</span>
  </button>`;
/** The checked input only explains itself while the learner's choice still matches what was checked. */
const fresh = (checked, now) => JSON.stringify(checked ?? null) === JSON.stringify(now ?? null);

function shell(api, task, locked, body, r) {
  const { env, phase } = api;
  return html` ${phase === "explore" ? html`<p class="cn-intro">${tt(env, INTRO[task.module])}</p>` : ""}
  ${supportPanels(api, ["bank"])}
  ${phase === "explore" ? "" : html`<div class="cn-module cn-m-${task.module}">${body}</div>`}
  ${r ? feedbackBox(env, r.summary, { id: "fb", extra: !r.accepted && r.nextMove ? html`<p class="cn-next"><strong>${tt(env, ["Next move", "Siguiente paso"])}:</strong> ${tt(env, r.nextMove)}</p>` : "" }) : ""}`;
}

const setup = (api) => {
  const transfer = api.phase === "transfer" || api.phase === "done";
  const task = E.resolveTask(api.task, transfer);
  const draft = transfer ? api.rec.tdraft : api.rec.draft;
  const last = transfer ? api.rec.tlast : api.rec.last;
  return {
    transfer,
    task,
    draft,
    last,
    locked: api.phase === "accepted" || api.phase === "done",
    dk: transfer ? "tdraft" : "draft",
  };
};
const gapFb = (env, fb) =>
  fb
    ? html`<p class="cn-gap-fb is-${fb.tone}" role="status">
        ${icon(fb.tone === "right" ? "check" : "bulb")} <span>${tt(env, fb.t)}</span>
      </p>`
    : "";

// ── connector ────────────────────────────────────────────────────────────────
function connectorBody(api) {
  const { env } = api;
  const { task, draft, last, locked } = setup(api);
  const body = html`<ol class="cn-gaps">
    ${task.gaps.map((g, i) => {
      const chosen = draft.answers[i];
      const fb =
        last && fresh(last.input.answers?.[i], chosen) ? last.result.items[i].feedback : null;
      return html`<li class="cn-gap">
        <p class="cn-gap-sentence" lang="en">
          ${g.before}
          <span class="cn-gap-slot ${chosen ? "is-filled" : ""}">${chosen || "     "}</span>
          ${g.after}
        </p>
        <div
          class="cn-chips"
          role="group"
          aria-label="${env.I.S(`Gap ${i + 1} choices`, `Opciones del espacio ${i + 1}`)}"
        >
          ${E.connectorOptions(task, i).map((o) => pickChip("pick", i, o, chosen === o, locked))}
        </div>
        ${gapFb(env, fb)}
      </li>`;
    })}
  </ol>`;
  return shell(api, task, locked, body, last?.result);
}

// ── pronoun ──────────────────────────────────────────────────────────────────
function pronounText(task) {
  return task.text.map((s) => {
    const spans = [];
    task.pronouns.forEach((p, n) => {
      if (p.sentence !== s.id) return;
      const re = new RegExp(
        `(?<![\\p{L}\\p{N}])${p.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`,
        "u",
      );
      const m = re.exec(s.text);
      if (m && !spans.some((x) => m.index < x.end && m.index + m[0].length > x.start))
        spans.push({ start: m.index, end: m.index + m[0].length, n: n + 1 });
    });
    return html`<p class="cn-sentence" lang="en" data-sentence="${s.id}">
      ${markText(
        s.text,
        spans,
        () => "cn-pron",
        (x) => x.n,
      )}
    </p>`;
  });
}
function pronounBody(api) {
  const { env } = api;
  const { task, draft, last, locked } = setup(api);
  const body = html`<div class="cn-text">${pronounText(task)}</div>
    <ol class="cn-picks">
      ${task.pronouns.map((p, i) => {
        const chosen = draft.answers[i];
        const fb =
          last && fresh(last.input.answers?.[i], chosen) ? last.result.items[i].feedback : null;
        return html`<li class="cn-pick">
          <p class="cn-pick-q">
            <mark class="cn-pron"
              ><span class="cn-tag">${i + 1}</span><span lang="en">${p.phrase}</span></mark
            >
            ${tt(env, ["points back to…", "se refiere a…"])}
          </p>
          <div
            class="cn-chips"
            role="group"
            aria-label="${env.I.S(`What “${p.phrase}” points back to`, `A qué se refiere “${p.phrase}”`)}"
          >
            ${E.pronounOptions(task, i).map((o) => pickChip("pick", i, o, chosen === o, locked))}
          </div>
          ${gapFb(env, fb)}
        </li>`;
      })}
    </ol>`;
  return shell(api, task, locked, body, last?.result);
}

// ── morphology ───────────────────────────────────────────────────────────────
const cleanPart = (t) =>
  String(t || "")
    .toLowerCase()
    .replace(/[-\s]/g, "");
function wordCard(api, task, draft, last, wi, locked) {
  const { env } = api;
  const word = task.words[wi];
  const w = draft.words[wi];
  const placed = E.PART_TYPES.flatMap((type) => w.slots[type])
    .filter(Boolean)
    .map(cleanPart);
  const pool = E.morphChips(task, wi).filter((t) => !placed.includes(cleanPart(t)));
  const sel = draft.sel;
  const q = E.meaningQuestion(task, wi);
  const res = last && fresh(last.input.words?.[wi], w) ? last.result.items[wi] : null;
  return html`<article class="cn-word" data-w="${wi}">
    <h4 class="cn-word-h">
      <span class="cn-word-t" lang="en">${word.word}</span>
      <span class="cn-word-n"
        >${tt(env, [`Word ${wi + 1} of ${task.words.length}`, `Palabra ${wi + 1} de ${task.words.length}`])}</span
      >
    </h4>
    ${word.ask ? html`<p class="cn-ask" lang="en">${word.ask}</p>` : ""}
    <div
      class="cn-reels"
      role="group"
      aria-label="${env.I.S("Word-part slots", "Espacios de partes de la palabra")}"
    >
      ${E.PART_TYPES.flatMap((type) =>
        w.slots[type].map(
          (t, n) =>
            html`<div class="cn-reel cn-reel-${type}">
              <span class="cn-reel-l">${tt(env, E.typeName(type))}</span>
              <button
                type="button"
                class="cn-slot ${t ? "is-filled" : ""}"
                data-cn="slot"
                data-w="${wi}"
                data-type="${type}"
                data-n="${n}"
                data-k="slot-${wi}-${type}-${n}"
                aria-label="${typeLabel(env, type, t)}"
                ${dis(locked)}
              >
                ${t ? html`<span lang="en">${t}</span>` : html`<span class="cn-slot-empty" aria-hidden="true">?</span>`}
              </button>
            </div>`,
        ),
      )}
    </div>
    ${locked ? "" : html`<p class="cn-hint">${tt(env, ["Tap a chip, then tap a slot. Tap a filled slot to take the chip back. Leave a slot empty if the word has no such part.", "Toca una ficha y luego un espacio. Toca un espacio lleno para devolver la ficha. Deja vacío un espacio si la palabra no tiene esa parte."])}</p>`}
    <div
      class="cn-chips cn-pool"
      role="group"
      aria-label="${env.I.S("Word-part chips", "Fichas de partes de la palabra")}"
    >
      ${pool.map((t) => html`<button type="button" class="cn-chip cn-t-part" data-cn="mchip" data-w="${wi}" data-v="${t}" data-k="mchip-${wi}-${t}" aria-pressed="${Boolean(sel && sel.w === wi && sel.t === t)}" ${dis(locked)}><span lang="en">${t}</span></button>`)}
    </div>
    <div
      class="cn-meaning"
      role="group"
      aria-label="${env.I.S("What does it mean?", "¿Qué significa?")}"
    >
      <p class="cn-q">
        ${tt(env, [`What does the ${E.typeName(q.part.type)[0]} “${q.part.t}” mean?`, `¿Qué significa el ${E.typeName(q.part.type)[1]} “${q.part.t}”?`])}
      </p>
      <div class="cn-chips">
        ${q.options.map((o) => html`<button type="button" class="cn-chip" data-cn="mean" data-w="${wi}" data-v="${o}" data-k="mean-${wi}-${o}" aria-pressed="${w.meaning === o}" ${dis(locked)}><span lang="en">${o}</span></button>`)}
      </div>
    </div>
    ${
      res
        ? html`<ul class="cn-parts-fb">
            ${res.per.map((x) => html`<li class="is-${x.state === "right" ? "right" : "hint"}">${icon(x.state === "right" ? "check" : "bulb")} ${tt(env, x.feedback)}</li>`)}${res.answered && !res.meaningOk ? html`<li class="is-hint">${icon("bulb")} ${tt(env, ["Think about the meaning of that part again.", "Piensa otra vez en el significado de esa parte."])}</li>` : ""}
          </ul>`
        : ""
    }
  </article>`;
}
function morphologyBody(api) {
  const { task, draft, last, locked } = setup(api);
  const body = task.words.map((_, wi) => wordCard(api, task, draft, last, wi, locked));
  return shell(api, task, locked, body, last?.result);
}

// ── discourse ────────────────────────────────────────────────────────────────
function discourseBody(api) {
  const { env } = api;
  const { task, draft, last, locked } = setup(api);
  const unit = Object.fromEntries(task.units.map((u) => [u.id, u]));
  const res =
    last &&
    fresh(
      { o: last.input.order, c: last.input.connectors },
      { o: draft.order, c: draft.connectors },
    )
      ? last.result
      : null;
  const wrongPlace = res && !res.order.ok ? res.order.firstWrong : null;
  const connAt = (id) =>
    (task.connectors || []).map((c, ci) => ({ c, ci })).filter((x) => x.c.before === id);
  const body = html`<ol
    class="cn-order"
    aria-label="${env.I.S("Sentences to order", "Oraciones para ordenar")}"
  >
    ${draft.order.map(
      (id, pos) =>
        html`<li class="cn-unit ${wrongPlace === pos + 1 ? "is-check" : ""}">
          ${connAt(id).map(
            ({ c, ci }) =>
              html`<div
                class="cn-conn"
                role="group"
                aria-label="${env.I.S(`Link word before sentence ${pos + 1}`, `Palabra de enlace antes de la oración ${pos + 1}`)}"
              >
                <span class="cn-conn-l">${tt(env, ["Link word", "Palabra de enlace"])}</span>
                <div class="cn-chips">
                  ${E.discourseOptions(task, ci).map((o) => pickChip("dconn", ci, o, draft.connectors[ci] === o, locked))}
                </div>
                ${res && draft.connectors[ci] != null && !res.connectors[ci].ok ? html`<p class="cn-gap-fb is-hint">${icon("bulb")} ${tt(env, ["Read the two sentences together. How is the second related to the first?", "Lee las dos oraciones juntas. ¿Cómo se relaciona la segunda con la primera?"])}</p>` : ""}
              </div>`,
          )}
          <div class="cn-unit-row">
            <span class="cn-unit-n" aria-hidden="true">${pos + 1}</span>
            <p class="cn-unit-t" lang="en">${unit[id].text}</p>
            <span class="cn-move">
              <button
                type="button"
                class="cn-btn-ico"
                data-cn="move"
                data-pos="${pos}"
                data-dir="-1"
                data-k="move-${pos}-up"
                aria-label="${env.I.S(`Move up: place ${pos + 1}`, `Subir: lugar ${pos + 1}`)}"
                ${pos === 0 || locked ? raw("disabled") : ""}
              >
                ${chev("up")}
              </button>
              <button
                type="button"
                class="cn-btn-ico"
                data-cn="move"
                data-pos="${pos}"
                data-dir="1"
                data-k="move-${pos}-down"
                aria-label="${env.I.S(`Move down: place ${pos + 1}`, `Bajar: lugar ${pos + 1}`)}"
                ${pos === draft.order.length - 1 || locked ? raw("disabled") : ""}
              >
                ${chev("down")}
              </button>
            </span>
          </div>
          ${wrongPlace === pos + 1 ? html`<p class="cn-gap-fb is-hint">${icon("bulb")} ${tt(env, ["Look again at this place.", "Mira otra vez este lugar."])}</p>` : ""}
        </li>`,
    )}
  </ol>`;
  return shell(api, task, locked, body, last?.result);
}

export const MODULE_BODIES = {
  connector: connectorBody,
  pronoun: pronounBody,
  morphology: morphologyBody,
  discourse: discourseBody,
};

// ── actions ──────────────────────────────────────────────────────────────────
/** Handle a selection-module action; returns { state, focus } or null. */
export function moduleHandle(api, act, el) {
  const { state, i, phase } = api;
  if (phase === "accepted" || phase === "done") return null;
  const transfer = phase === "transfer";
  const dk = transfer ? "tdraft" : "draft";
  const draft = api.rec[dk];
  const patch = (p, focus) => ({
    state: E.setRecord(state, i, { [dk]: { ...draft, ...p } }),
    focus,
  });
  const n = (x) => Number(x);
  const d = el.dataset;
  switch (act) {
    case "pick": {
      const answers = [...draft.answers];
      answers[n(d.i)] = answers[n(d.i)] === d.v ? null : d.v;
      return patch({ answers }, d.k);
    }
    case "dconn": {
      const connectors = [...draft.connectors];
      connectors[n(d.i)] = connectors[n(d.i)] === d.v ? null : d.v;
      return patch({ connectors }, d.k);
    }
    case "move": {
      const pos = n(d.pos);
      const to = pos + n(d.dir);
      if (to < 0 || to >= draft.order.length) return null;
      const order = [...draft.order];
      [order[pos], order[to]] = [order[to], order[pos]];
      const dir = n(d.dir);
      const atEdge = dir < 0 ? to === 0 : to === order.length - 1;
      return patch({ order }, `move-${to}-${atEdge ? (dir < 0 ? "down" : "up") : dir < 0 ? "up" : "down"}`);
    }
    case "mchip": {
      const same = draft.sel && draft.sel.w === n(d.w) && draft.sel.t === d.v;
      return patch({ sel: same ? null : { w: n(d.w), t: d.v } }, d.k);
    }
    case "slot": {
      const words = draft.words.map((w) => ({
        ...w,
        slots: Object.fromEntries(Object.entries(w.slots).map(([k, v]) => [k, [...v]])),
      }));
      const w = words[n(d.w)];
      const cur = w.slots[d.type][n(d.n)];
      if (draft.sel && draft.sel.w === n(d.w)) {
        w.slots[d.type][n(d.n)] = draft.sel.t;
        return patch({ words, sel: null }, d.k);
      }
      if (!cur) return null;
      w.slots[d.type][n(d.n)] = null;
      return patch({ words }, d.k);
    }
    case "mean": {
      const words = draft.words.map((w, k) =>
        k === n(d.w) ? { ...w, meaning: w.meaning === d.v ? null : d.v } : w,
      );
      return patch({ words }, d.k);
    }
    default:
      return null;
  }
}
