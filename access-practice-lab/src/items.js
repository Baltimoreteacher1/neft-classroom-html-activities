// Answer controls for every item type, shared by practice and test mode.
//
// inputHTML(item, answer, opts) renders; reduceAnswer(item, answer, target)
// returns the next answer for an interaction (or undefined if the target is not
// an answer control). Every control carries data-nsr-ignore so the site-wide
// Save/Resume engine never captures or "restores" it — the lab keeps its own
// progress, and the engine's generic restore used to click lab controls.
import { BASE, html, raw } from "./util.js";

const IGN = raw("data-nsr-ignore");

/** Deterministic shuffle (seeded by id) that never returns the solved order. */
export function initialOrder(item) {
  const ids = (item.items || []).map((i) => i.id);
  let seed = [...String(item.id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.join() === (item.answer || []).join() && out.length > 1) out.push(out.shift());
  return out;
}

const mark = (reveal, isRight, chosen) => {
  if (!reveal || reveal === "none") return "";
  if (chosen) return isRight ? "is-right" : "is-wrong";
  return reveal === "full" && isRight ? "is-answer" : "";
};

function optionBody(o) {
  const pic = o.picture
    ? html`<img
        class="opt-picture"
        src="${BASE}/${o.picture.src}"
        alt="${o.picture.alt}"
        loading="lazy"
      />`
    : "";
  return html`${pic}${!pic && o.visual ? html`<span class="opt-visual" aria-hidden="true">${o.visual}</span>` : ""}<span
      class="opt-text"
      >${o.text}</span
    >`;
}

function choiceList(item, answer, { key, reveal, multi }) {
  const chosen = new Set(multi ? answer || [] : answer != null ? [answer] : []);
  const right = new Set(multi ? item.answers || [] : [item.answer]);
  const hasPictures = (item.options || []).some((o) => o.picture);
  return html`<div
      class="choices ${hasPictures ? "has-pictures" : ""}"
      role="${multi ? "group" : "radiogroup"}"
      aria-label="${multi ? "Choose all correct answers" : "Choose one answer"}"
    >
      ${(item.options || []).map((o, i) => {
        const on = chosen.has(o.id);
        return html`<label class="choice ${on ? "is-on" : ""} ${mark(reveal, right.has(o.id), on)}">
          <input
            type="${multi ? "checkbox" : "radio"}"
            name="ans-${key}"
            value="${o.id}"
            ${on ? raw("checked") : ""}
            ${reveal && reveal !== "none" ? raw("disabled") : ""}
            data-ans-choice
            ${IGN}
          />
          <span class="choice-letter" aria-hidden="true">${String.fromCharCode(65 + i)}</span
          >${optionBody(o)}
        </label>`;
      })}
    </div>
    ${multi ? html`<p class="hint-line">More than one answer is correct.</p>` : ""}`;
}

function sortHTML(item, answer, { reveal }) {
  const a = answer || {};
  const cats = (item.categories || []).map((c) => (typeof c === "string" ? c : c.id));
  return html`<div class="sorter">
    ${(item.items || []).map(
      (it) =>
        html`<div class="sort-row ${mark(reveal, a[it.id] === it.answer, Boolean(a[it.id]))}">
          <p class="sort-text">
            ${item.speakItems ? html`<button type="button" class="mini-say" data-say="${it.text}" aria-label="Listen">🔊</button>` : ""}${it.text}
          </p>
          <div class="sort-cats" role="radiogroup" aria-label="Group for: ${it.text}">
            ${cats.map(
              (c) =>
                html`<button
                  type="button"
                  class="cat-chip"
                  aria-pressed="${a[it.id] === c}"
                  data-ans-sort="${it.id}"
                  data-cat="${c}"
                  ${reveal && reveal !== "none" ? raw("disabled") : ""}
                  ${IGN}
                >
                  ${c}
                </button>`,
            )}
          </div>
          ${reveal === "full" && a[it.id] !== it.answer ? html`<p class="sort-fix">Belongs in: <strong>${it.answer}</strong></p>` : ""}
        </div>`,
    )}
  </div>`;
}

function orderHTML(item, answer, { reveal }) {
  const ids = answer?.length ? answer : initialOrder(item);
  const byId = new Map((item.items || []).map((i) => [i.id, i]));
  const locked = reveal && reveal !== "none";
  return html`<ol class="orderer">
      ${ids.map((id, i) => {
        const it = byId.get(id);
        if (!it) return "";
        const ok = (item.answer || [])[i] === id;
        return html`<li class="order-row ${locked ? (ok ? "is-right" : "is-wrong") : ""}">
          <span class="order-n" aria-hidden="true">${i + 1}</span>
          <span class="order-text">${it.text}</span>
          <span class="order-moves">
            <button
              type="button"
              class="move"
              data-ans-move="${id}"
              data-dir="-1"
              aria-label="Move up: ${it.text}"
              ${i === 0 || locked ? raw("disabled") : ""}
              ${IGN}
            >
              ▲
            </button>
            <button
              type="button"
              class="move"
              data-ans-move="${id}"
              data-dir="1"
              aria-label="Move down: ${it.text}"
              ${i === ids.length - 1 || locked ? raw("disabled") : ""}
              ${IGN}
            >
              ▼
            </button>
          </span>
        </li>`;
      })}
    </ol>
    <p class="hint-line">Use ▲ and ▼ to put the steps in order.</p>`;
}

function clozeHTML(item, answer, { reveal }) {
  const a = answer || {};
  let n = 0;
  return html`<p class="cloze">
    ${(item.segments || []).map((s) => {
      if (!s.blank) return s.text;
      n++;
      const b = s.blank;
      const cls = mark(reveal, a[b.id] === b.answer, Boolean(a[b.id]));
      return html`<span class="cloze-blank ${cls}"
        ><label class="visually-hidden" for="cz-${item.id}-${b.id}">Blank ${n}</label
        ><select
          id="cz-${item.id}-${b.id}"
          data-ans-cloze="${b.id}"
          ${reveal && reveal !== "none" ? raw("disabled") : ""}
          ${IGN}
        >
          <option value="">choose…</option>
          ${(b.options || []).map((o) => html`<option value="${o}" ${a[b.id] === o ? raw("selected") : ""}>${o}</option>`)}</select
        >${reveal === "full" && a[b.id] !== b.answer ? html`<span class="cloze-fix">${b.answer}</span>` : ""}</span
      >`;
    })}
  </p>`;
}

function hotTextHTML(item, answer, { reveal }) {
  const chosen = new Set(answer || []);
  const right = new Set(item.answers || []);
  return html`<div class="hottext" role="group" aria-label="Choose the sentence or sentences">
      ${(item.sentences || []).map(
        (s) =>
          html`<button
            type="button"
            class="hot ${mark(reveal, right.has(s.id), chosen.has(s.id))}"
            aria-pressed="${chosen.has(s.id)}"
            data-ans-hot="${s.id}"
            ${reveal && reveal !== "none" ? raw("disabled") : ""}
            ${IGN}
          >
            ${s.text}
          </button>`,
      )}
    </div>
    <p class="hint-line">Tap a sentence to choose it. Tap again to unchoose.</p>`;
}

export function inputHTML(item, answer, opts = {}) {
  const o = { key: item.id, reveal: "none", ...opts };
  switch (item.type) {
    case "multipleChoice":
      return choiceList(item, answer, { ...o, multi: false });
    case "multiSelect":
      return choiceList(item, answer, { ...o, multi: true });
    case "sort":
      return sortHTML(item, answer, o);
    case "order":
      return orderHTML(item, answer, o);
    case "cloze":
      return clozeHTML(item, answer, o);
    case "hotText":
      return hotTextHTML(item, answer, o);
    default:
      return "";
  }
}

/** Next answer for an interaction, or undefined if `t` is not an answer control. */
export function reduceAnswer(item, answer, t) {
  // A choice can arrive as the input itself (keyboard → change event) or as a
  // click anywhere on its card (handled directly; see choiceTarget()).
  const choice = t.matches?.("[data-ans-choice]") ? t : null;
  if (choice) {
    if (item.type === "multiSelect") {
      const set = new Set(answer || []);
      set.has(choice.value) ? set.delete(choice.value) : set.add(choice.value);
      return [...set];
    }
    return choice.value;
  }
  const sortBtn = t.closest("[data-ans-sort]");
  if (sortBtn) return { ...(answer || {}), [sortBtn.dataset.ansSort]: sortBtn.dataset.cat };
  const move = t.closest("[data-ans-move]");
  if (move) {
    const ids = answer?.length ? [...answer] : initialOrder(item);
    const i = ids.indexOf(move.dataset.ansMove);
    const j = i + Number(move.dataset.dir);
    if (i < 0 || j < 0 || j >= ids.length) return ids;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    return ids;
  }
  if (t.matches("[data-ans-cloze]")) return { ...(answer || {}), [t.dataset.ansCloze]: t.value };
  const hot = t.closest("[data-ans-hot]");
  if (hot) {
    const set = new Set(answer || []);
    const id = hot.dataset.ansHot;
    set.has(id) ? set.delete(id) : set.add(id);
    return [...set];
  }
  return undefined;
}

/**
 * The choice input for a click on its card, or null. Calls preventDefault so the
 * browser's own label activation cannot also toggle it (a checkbox would flip
 * twice). Must run synchronously inside the click event.
 */
export function choiceTarget(e) {
  const card = e.target.closest?.("label.choice");
  if (!card) return null;
  const input = card.querySelector("[data-ans-choice]");
  if (!input || input.disabled) return null;
  e.preventDefault();
  input.focus({ preventScroll: true });
  return input;
}

/** True when an order item has never been touched (its answer is implicit). */
export const needsOrderSeed = (item, answer) => item.type === "order" && !answer?.length;
export const seedAnswer = (item) => (item.type === "order" ? initialOrder(item) : undefined);
