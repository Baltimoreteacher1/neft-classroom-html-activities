// Question renderers: one per response type, all keyboard-operable, all returning the same small contract.
//   render(item, ctx) -> { el, get(), set(value), focus() }
// ctx: { doc, response, readOnly, toolbar, onChange(value), announce(msg), prefix }
// Nothing here scores or reveals: the session does that. Pointer-only interactions always have an equivalent
// keyboard / click-to-place path (select a token, choose a destination, place or replace, reverse, hear a confirmation).
import { h } from "./dom.js";
import { wordCount } from "./scoring.js";

const letter = (i) => String.fromCharCode(65 + i);
let uid = 0;
const nid = (p) => `${p}-${++uid}`;

// ── choice list (multiple-choice, multiple-select, listening-response) ────────────
function renderChoices(item, ctx) {
  const { doc } = ctx;
  const multi = item.type === "multiple-select";
  const name = nid("q");
  const cur = new Set(multi ? ctx.response || [] : ctx.response ? [ctx.response] : []);
  const list = h(doc, "div", { class: "acc-choices", role: multi ? "group" : "radiogroup", "aria-labelledby": `${ctx.prefix}-stem` });
  const rows = item.options.map((o, i) => {
    const id = nid("opt");
    const input = h(doc, "input", { type: multi ? "checkbox" : "radio", name, id, value: o.id, disabled: ctx.readOnly });
    input.checked = cur.has(o.id);
    const row = h(doc, "div", { class: "acc-choice", "data-option": o.id });
    const label = h(doc, "label", { for: id, class: "acc-choice-label" }, h(doc, "span", { class: "acc-choice-letter", "aria-hidden": "true", text: letter(i) }), h(doc, "span", { class: "acc-choice-text", text: o.text }));
    row.append(input, label);
    const strike = h(doc, "button", { type: "button", class: "acc-btn acc-strike", "aria-pressed": "false", "aria-label": `Cross out choice ${letter(i)}`, text: "Cross out" });
    strike.addEventListener("click", () => {
      const r = ctx.toolbar?.toggleChoice(item, o.id, letter(i));
      if (r?.allowed) sync();
    });
    row.append(strike);
    const sync = () => {
      const gone = Boolean(ctx.toolbar?.isEliminated(item.id, o.id));
      row.classList.toggle("is-eliminated", gone);
      strike.setAttribute("aria-pressed", String(gone));
      strike.textContent = gone ? "Restore" : "Cross out";
      strike.setAttribute("aria-label", `${gone ? "Restore" : "Cross out"} choice ${letter(i)}`);
      // A crossed-out choice is still a real control: only the state is conveyed, never disabled.
      label.setAttribute("data-eliminated", gone ? "true" : "false");
    };
    sync();
    input.addEventListener("change", () => {
      const value = multi ? [...list.querySelectorAll("input:checked")].map((x) => x.value) : input.value;
      ctx.onChange(value);
    });
    list.append(row);
    return { row, input, sync };
  });
  return {
    el: list,
    get: () => (multi ? [...list.querySelectorAll("input:checked")].map((x) => x.value) : (list.querySelector("input:checked")?.value ?? "")),
    focus: () => (rows.find((r) => r.input.checked) || rows[0]).input.focus(),
    refresh: () => rows.forEach((r) => r.sync()),
  };
}

// ── inline dropdown ──────────────────────────────────────────────────────────────
function renderDropdown(item, ctx) {
  const { doc } = ctx;
  const cur = ctx.response || {};
  const p = h(doc, "p", { class: "acc-cloze" });
  const selects = {};
  let last = 0;
  const t = item.dropdown.template;
  for (const m of t.matchAll(/\{(\w+)\}/g)) {
    p.append(doc.createTextNode(t.slice(last, m.index)));
    const key = m[1];
    const id = nid("blank");
    const sel = h(doc, "select", { id, class: "acc-select", "aria-label": `Blank ${key} of ${Object.keys(item.dropdown.blanks).length}`, disabled: ctx.readOnly }, h(doc, "option", { value: "", text: "Choose…" }), ...item.dropdown.blanks[key].options.map((o) => h(doc, "option", { value: o, text: o })));
    sel.value = cur[key] || "";
    sel.addEventListener("change", () => ctx.onChange(get()));
    selects[key] = sel;
    p.append(sel);
    last = m.index + m[0].length;
  }
  p.append(doc.createTextNode(t.slice(last)));
  const get = () => Object.fromEntries(Object.entries(selects).map(([k, s]) => [k, s.value]));
  return { el: p, get, focus: () => Object.values(selects)[0]?.focus() };
}

// ── sentence ordering: select a line, then move it. Pointer drag is not required. ──
function renderOrdering(item, ctx) {
  const { doc } = ctx;
  const ids = ctx.response?.length === item.ordering.items.length ? [...ctx.response] : item.ordering.items.map((x) => x.id);
  const byId = Object.fromEntries(item.ordering.items.map((x) => [x.id, x]));
  const wrap = h(doc, "div", { class: "acc-order" });
  const ol = h(doc, "ol", { class: "acc-order-list", "aria-labelledby": `${ctx.prefix}-stem` });
  const status = h(doc, "p", { class: "acc-hint", role: "status", "aria-live": "polite" });
  let touched = Boolean(ctx.response?.length);
  const draw = (focusId) => {
    ol.replaceChildren(
      ...ids.map((id, i) => {
        const up = h(doc, "button", { type: "button", class: "acc-btn acc-move", "aria-label": `Move up: ${byId[id].text}`, disabled: ctx.readOnly || i === 0, text: "Up" });
        const down = h(doc, "button", { type: "button", class: "acc-btn acc-move", "aria-label": `Move down: ${byId[id].text}`, disabled: ctx.readOnly || i === ids.length - 1, text: "Down" });
        const move = (d) => {
          const j = i + d;
          [ids[i], ids[j]] = [ids[j], ids[i]];
          touched = true;
          status.textContent = `"${byId[id].text}" is now number ${j + 1} of ${ids.length}.`;
          ctx.onChange([...ids]);
          draw(id + (d < 0 ? ":up" : ":down"));
        };
        up.addEventListener("click", () => move(-1));
        down.addEventListener("click", () => move(1));
        const li = h(doc, "li", { class: "acc-order-row", "data-id": id }, h(doc, "span", { class: "acc-order-text", text: byId[id].text }), h(doc, "span", { class: "acc-order-actions" }, up, down));
        li.addEventListener("keydown", (e) => {
          if (ctx.readOnly || !e.altKey || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
          const d = e.key === "ArrowUp" ? -1 : 1;
          if (i + d < 0 || i + d >= ids.length) return;
          move(d);
          e.preventDefault();
        });
        return li;
      }),
    );
    if (focusId) {
      const [id, dir] = focusId.split(":");
      const row = ol.querySelector(`[data-id="${id}"]`);
      const btns = row?.querySelectorAll("button");
      const pick = dir === "up" ? btns?.[0] : btns?.[1];
      (pick && !pick.disabled ? pick : btns?.[dir === "up" ? 1 : 0])?.focus();
    }
  };
  draw();
  wrap.append(ol, h(doc, "p", { class: "acc-hint", text: "Use the Up and Down buttons (or Alt + Arrow keys on a line) to put the lines in order." }), status);
  return { el: wrap, get: () => (touched ? [...ids] : []), focus: () => ol.querySelector("button:not([disabled])")?.focus() };
}

// ── click-to-place engine shared by matching and drag-and-drop ────────────────────
// Select a token (click, Space or Enter), then choose a destination (click, Space or Enter). Choosing a destination
// that already holds a token swaps it back to the pool. "Undo last placement" reverses the previous move. Real
// drag and drop works too, as an additional path.
function renderPlacement(item, ctx, spec) {
  const { doc } = ctx;
  const { tokens, zones, zoneLabel } = spec;
  const placed = { ...(ctx.response || {}) };
  const history = [];
  let selected = null;
  const root = h(doc, "div", { class: "acc-place", role: "group", "aria-labelledby": `${ctx.prefix}-stem` });
  const status = h(doc, "p", { class: "acc-hint", role: "status", "aria-live": "polite" });
  const pool = h(doc, "div", { class: "acc-pool", role: "group", "aria-label": "Items to place" });
  const board = h(doc, "div", { class: "acc-zones" });
  const undo = h(doc, "button", { type: "button", class: "acc-btn", text: "Undo last placement", disabled: true });
  const tokenText = (id) => tokens.find((t) => t.id === id).text;
  const say = (m) => {
    status.textContent = m;
    ctx.announce?.(m);
  };
  const commit = () => {
    undo.disabled = ctx.readOnly || history.length === 0;
    ctx.onChange({ ...placed });
  };
  const place = (tokenId, zoneId) => {
    const prev = { ...placed };
    if (!spec.multi) for (const [t, z] of Object.entries(placed)) if (z === zoneId) delete placed[t]; // a one-to-one spot: the displaced token returns to the pool
    placed[tokenId] = zoneId;
    history.push(prev);
    selected = null;
    say(`${tokenText(tokenId)} placed in ${zoneLabel(zones.find((z) => z.id === zoneId))}.`);
    draw();
    commit();
  };
  const unplace = (tokenId) => {
    history.push({ ...placed });
    delete placed[tokenId];
    selected = null;
    say(`${tokenText(tokenId)} returned to the list.`);
    draw();
    commit();
  };
  undo.addEventListener("click", () => {
    const prev = history.pop();
    if (!prev) return;
    for (const k of Object.keys(placed)) delete placed[k];
    Object.assign(placed, prev);
    selected = null;
    say("Last placement undone.");
    draw();
    commit();
  });
  const tokenButton = (t, inZone) => {
    const b = h(doc, "button", { type: "button", class: `acc-token${selected === t.id ? " is-selected" : ""}`, draggable: ctx.readOnly ? undefined : "true", "aria-pressed": String(selected === t.id), disabled: ctx.readOnly, "data-token": t.id, text: t.text });
    if (inZone) b.setAttribute("aria-label", `${t.text}, placed. Press to return it to the list.`);
    b.addEventListener("click", () => {
      if (inZone) return unplace(t.id);
      selected = selected === t.id ? null : t.id;
      say(selected ? `${t.text} selected. Choose where to place it.` : "Selection cleared.");
      draw(t.id);
    });
    b.addEventListener("dragstart", (e) => e.dataTransfer?.setData("text/plain", t.id));
    return b;
  };
  const draw = (focusToken) => {
    const free = tokens.filter((t) => !(t.id in placed));
    pool.replaceChildren(...(free.length ? free.map((t) => tokenButton(t, false)) : [h(doc, "span", { class: "acc-hint", text: "Every item is placed." })]));
    board.replaceChildren(
      ...zones.map((z) => {
        const inside = Object.entries(placed).filter(([, zid]) => zid === z.id).map(([t]) => t);
        const here = inside[0];
        const drop = h(doc, "div", { class: `acc-zone${here ? " is-filled" : ""}` });
        const target = h(doc, "button", { type: "button", class: "acc-zone-target", disabled: ctx.readOnly, "aria-label": `${zoneLabel(z)}${inside.length ? `, holds ${inside.map(tokenText).join("; ")}` : ", empty"}${selected ? `. Place ${tokenText(selected)} here` : ""}`, "data-zone": z.id }, h(doc, "span", { class: "acc-zone-label", text: zoneLabel(z) }));
        target.addEventListener("click", () => {
          if (selected) place(selected, z.id);
          else say(inside.length ? `${inside.map(tokenText).join(" and ")} ${inside.length > 1 ? "are" : "is"} in this spot. Select an item first to add another.` : "Select an item first.");
        });
        drop.addEventListener("dragover", (e) => e.preventDefault());
        drop.addEventListener("drop", (e) => {
          e.preventDefault();
          const id = e.dataTransfer?.getData("text/plain");
          if (id && tokens.some((t) => t.id === id)) place(id, z.id);
        });
        drop.append(target);
        for (const id of inside) drop.append(tokenButton(tokens.find((t) => t.id === id), true));
        return drop;
      }),
    );
    if (focusToken) pool.querySelector(`[data-token="${focusToken}"]`)?.focus();
  };
  // Arrow keys move between the items and the places, so a keyboard user never has to Tab through every control.
  root.addEventListener("keydown", (e) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const controls = [...root.querySelectorAll(".acc-pool button, .acc-zone-target, .acc-zone .acc-token")].filter((b) => !b.disabled);
    const at = controls.indexOf(doc.activeElement);
    if (at < 0) return;
    const to = e.key === "Home" ? 0 : e.key === "End" ? controls.length - 1 : (at + (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : -1) + controls.length) % controls.length;
    controls[to].focus();
    e.preventDefault();
  });
  draw();
  root.append(pool, board, undo, status);
  return { el: root, get: () => ({ ...placed }), focus: () => pool.querySelector("button")?.focus() };
}

const renderMatching = (item, ctx) => {
  // Matching: tokens are the left items; destinations are the right items, each takes one.
  const m = item.matching;
  const tokens = m.left;
  const zones = m.right;
  return renderPlacement(item, ctx, { tokens, zones, zoneLabel: (z) => z.text });
};
// Category sorting: a group holds several items.
const renderDragDrop = (item, ctx) => renderPlacement(item, ctx, { tokens: item.dragDrop.tokens, zones: item.dragDrop.zones, zoneLabel: (z) => z.label, multi: true });

// ── constructed response ─────────────────────────────────────────────────────────
function renderConstructed(item, ctx) {
  const { doc } = ctx;
  const c = item.constructed;
  const id = nid("write");
  const ta = h(doc, "textarea", { id, class: "acc-textarea", rows: "8", "aria-labelledby": `${ctx.prefix}-stem`, "aria-describedby": `${id}-count`, readonly: ctx.readOnly, spellcheck: c.spellcheck === false ? "false" : "true", lang: "en" });
  ta.value = ctx.response || "";
  const count = h(doc, "p", { id: `${id}-count`, class: "acc-hint", "aria-live": "off" });
  const paint = () => {
    const n = wordCount(ta.value);
    const need = c.minWords;
    count.textContent = `${n} ${n === 1 ? "word" : "words"}${n < need ? ` · aim for at least ${need}` : ""}${c.maxWords ? ` · up to ${c.maxWords}` : ""}`;
  };
  ta.addEventListener("input", () => {
    paint();
    ctx.onChange(ta.value);
  });
  paint();
  return { el: h(doc, "div", { class: "acc-write" }, ta, count), get: () => ta.value, focus: () => ta.focus() };
}

// Until the audio engine registers the recorder, a speaking item says so plainly instead of pretending to record.
function renderSpeakingUnavailable(item, ctx) {
  const el = h(ctx.doc, "p", { class: "acc-state is-warn", role: "status", text: "Recording is not available in this view yet." });
  return { el, get: () => ctx.response, focus() {} };
}

export const RENDERERS = {
  "speaking-response": renderSpeakingUnavailable,
  "multiple-choice": renderChoices,
  "multiple-select": renderChoices,
  "listening-response": renderChoices,
  dropdown: renderDropdown,
  ordering: renderOrdering,
  matching: renderMatching,
  "drag-drop": renderDragDrop,
  "constructed-response": renderConstructed,
};

/** Speaking responses mount the audio engine's speaking component (Phase 3); this registers it. */
export function registerRenderer(type, fn) {
  RENDERERS[type] = fn;
}

export function renderQuestion(item, ctx) {
  const fn = RENDERERS[item.type];
  if (!fn) throw new Error(`no renderer registered for ${item.type}`);
  return fn(item, ctx);
}

export const instruction = (item) =>
  ({
    "multiple-choice": "Choose one answer.",
    "multiple-select": "Choose all the correct answers.",
    "listening-response": "Choose one answer.",
    dropdown: "Choose the best word or phrase for each blank.",
    ordering: "Put the lines in order.",
    matching: "Match each item. Select an item, then select its match.",
    "drag-drop": "Place each item in the right group. Select an item, then select where it goes.",
    "constructed-response": "Write your response.",
    "speaking-response": "Plan, then record your response.",
  })[item.type];
