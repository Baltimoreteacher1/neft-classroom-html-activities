// visual-match: one board = one batch of cards plus a word bank. Select-then-place, drag, and keyboard all land in place().
import { h } from "../core/dom.js";
import { buildBatch, cardContent, itemFor, judgePlacement, stripModelLead } from "./visual-match-model.js";
import { makeDraggable } from "./st1-drag.js";
import { speakBtn, transferCard, visualEl } from "./st1-ui.js";


/**
 * opts: { activity, round, pairIds, batchNo, settled:Set<pairId>, es, nextLabel, onNext, onProgress }
 * Returns { el, setEs(bool), refresh(), isComplete() }.
 */
export function createBoard(ctx, opts) {
  const { activity, round, pairIds, batchNo } = opts;
  const batch = buildBatch(activity, round, pairIds, batchNo, ctx.tier);
  // activity.speechLang (for example "es-US") is the language the cards are written in; the Spanish toggle always reads es-US.
  const LANG = (es) => (es ? "es-US" : activity.speechLang || "en-US");
  const pairs = new Map(activity.pairs.map((p) => [p.id, p]));
  const loops = new Map();
  const placed = new Map(); // slot key -> chip key
  const state = { es: !!opts.es, pending: null, last: null, model: null, busy: false, done: false };
  for (const id of opts.settled || []) placed.set(`p:${id}`, `c:${id}`);

  const fb = ctx.feedback();
  const slotsEl = h("div", { class: "st-vm-slots", "data-mode": round.mode });
  const bankEl = h("div", { class: "st-vm-bank", role: "group", "aria-label": "Word bank" });
  const transferHost = h("div", { class: "st-vm-transfer" });
  const nextHost = h("div", { class: "st-row" });
  const hintBtn = h(
    "button",
    { type: "button", class: "st-btn", onclick: () => giveHint() },
    "Give me a hint",
  );
  const hearBtn = h(
    "button",
    { type: "button", class: "st-btn", onclick: () => hearSelected() },
    "Hear the selected word",
  );
  const tools = h("div", { class: "st-row st-vm-tools" }, hintBtn, hearBtn);
  const el = h(
    "div",
    { class: "st-vm-board" },
    slotsEl,
    h("h4", { class: "st-vm-bank-title" }, "Word bank"),
    bankEl,
    tools,
    fb.el,
    transferHost,
    nextHost,
  );

  const loopFor = (id) => {
    if (!loops.has(id)) loops.set(id, ctx.loop(itemFor(activity, round, pairs.get(id), batch)));
    return loops.get(id);
  };
  const chipByKey = (k) => batch.chips.find((c) => c.key === k);
  const slotByKey = (k) => batch.slots.find((s) => s.key === k);
  const placedChipKeys = () => new Set(placed.values());
  const unsolvedPairSlots = () =>
    batch.slots.filter((s) => s.kind === "pair" && !placed.has(s.key));

  function chipLabel(c) {
    if (c.kind === "distractor")
      return { text: activity.distractors.find((d) => d.id === c.distractorId).term };
    const p = pairs.get(c.pairId);
    if (state.es && p.es?.term) return { text: p.es.term, small: p.term };
    return { text: p.term };
  }
  const chipSpeech = (c) => {
    const l = chipLabel(c);
    return {
      text: l.text,
      lang: LANG(state.es && c.kind === "term" && !!pairs.get(c.pairId).es?.term),
    };
  };

  function slotContent(s) {
    if (s.kind === "decoy") {
      const d = activity.distractors.find((x) => x.id === s.decoyId);
      return d.visual
        ? { visual: d.visual, label: d.visual.alt }
        : { text: d.definition || d.example, label: d.definition || d.example };
    }
    return cardContent(pairs.get(s.pairId), round.mode, state.es);
  }

  function renderSlots() {
    slotsEl.textContent = "";
    for (const s of batch.slots) {
      const content = slotContent(s);
      const chipKey = placed.get(s.key);
      const matched = chipKey ? chipLabel(chipByKey(chipKey)) : null;
      const target = h(
        "button",
        {
          type: "button",
          class:
            `st-vm-target ${state.pending?.key === s.key ? "st-selected" : ""} ${s.pairId && state.model === s.pairId ? "st-pulse" : ""}`.trim(),
          "aria-label": matched
            ? `${content.label}. Matched with ${matched.text}.`
            : `${content.label}. Empty card. ${state.pending?.type === "chip" ? "Press to place the selected word here." : "Select a word, then press here."}`,
          "aria-disabled": chipKey ? "true" : "false",
          onclick: () => onSlot(s.key),
        },
        content.visual
          ? visualEl(content.visual, "st-vm-visual")
          : h(
              "span",
              {
                class: "st-vm-text",
                lang: state.es && pairs.get(s.pairId)?.es?.definition ? "es" : undefined,
              },
              content.text,
            ),
        h(
          "span",
          { class: "st-vm-slot-fill" },
          matched
            ? h("span", { class: "st-vm-matched" }, "Matched: ", h("strong", {}, matched.text))
            : h("span", { class: "st-vm-empty" }, "Place a word here"),
        ),
      );
      const card = h(
        "div",
        {
          class: "st-vm-card",
          "data-drop": s.key,
          "data-state": chipKey ? "matched" : s.kind === "decoy" ? "decoy" : "open",
        },
        target,
      );
      if (content.text)
        card.append(
          speakBtn(ctx, content.text.replace(/_____/g, "blank"), {
            label: "Hear this card",
            iconOnly: true,
            cls: "st-vm-hear",
            lang: LANG(state.es),
          }),
        );
      slotsEl.append(card);
    }
  }

  function renderBank() {
    bankEl.textContent = "";
    const used = placedChipKeys();
    for (const c of batch.chips) {
      if (used.has(c.key)) continue;
      const l = chipLabel(c);
      const pair = c.kind === "term" ? pairs.get(c.pairId) : null;
      const miniVisual = ctx.tier === "ee" && round.mode !== "term-visual" && pair?.visual;
      const b = h(
        "button",
        {
          type: "button",
          class:
            `st-chip st-vm-chip ${state.pending?.key === c.key ? "st-selected" : ""} ${c.kind === "term" && c.pairId === state.model ? "st-pulse" : ""}`.trim(),
          "data-chip": c.key,
          "aria-pressed": String(state.pending?.key === c.key),
          lang: state.es && pair?.es?.term ? "es" : undefined,
          onclick: () => onChip(c.key),
        },
        miniVisual ? visualEl(pair.visual, "st-vm-mini") : null,
        h("span", {}, l.text),
        l.small ? h("small", { lang: "en", class: "st-vm-sub" }, l.small) : null,
      );
      makeDraggable(b, {
        onDrop: (t) => place(c.key, t.dataset.drop),
        onPick: () => {},
        canDrag: () => !state.busy && !state.done,
      });
      bankEl.append(b);
    }
    bankEl.toggleAttribute("hidden", state.done);
  }

  function paint() {
    renderSlots();
    renderBank();
    el.classList.toggle("st-vm-done", state.done);
  }

  function onChip(key) {
    if (state.busy || state.done) return;
    if (state.pending?.type === "slot") return place(key, state.pending.key);
    state.pending = state.pending?.key === key ? null : { type: "chip", key };
    if (state.pending) {
      const sp = chipSpeech(chipByKey(key));
      ctx.speak(sp.text, { lang: sp.lang });
      ctx.announce(`${sp.text} selected. Now choose a card.`);
    }
    paint();
    bankEl.querySelector(`[data-chip="${key}"]`)?.focus();
  }

  function onSlot(key) {
    if (state.busy || state.done || placed.has(key)) return;
    if (state.pending?.type === "chip") return place(state.pending.key, key);
    state.pending = state.pending?.key === key ? null : { type: "slot", key };
    if (state.pending) fb.show("hint", "Card chosen. Now choose a word from the bank.");
    paint();
    slotsEl.querySelector(`[data-drop="${key}"] .st-vm-target`)?.focus();
  }

  function place(chipKey, slotKey) {
    if (
      state.busy ||
      state.done ||
      placed.has(slotKey) ||
      !chipByKey(chipKey) ||
      !slotByKey(slotKey)
    )
      return;
    state.pending = null;
    const j = judgePlacement(batch, chipKey, slotKey);
    if (!j) return;
    if (!j.sub) {
      const d = activity.distractors.find((x) => x.id === j.decoyId);
      fb.show("retry", d.hint);
      return paint();
    }
    const loop = loopFor(j.loopPairId);
    state.last = j.loopPairId;
    const r = loop.submit(j.sub);
    if (r.ok) return settle(loop, j.loopPairId, chipKey, slotKey, r);
    state.model = null;
    if (r.kind === "model") {
      state.model = j.loopPairId;
      fb.show("model", stripModelLead(r.text));
    } else if (r.kind === "transfer") {
      fb.show("transfer", r.text);
      state.busy = true;
      transferHost.append(
        transferCard(ctx, r.transfer, () => {
          transferHost.textContent = "";
          state.busy = false;
          for (const n of el.querySelectorAll(".st-vm-slots, .st-vm-bank, .st-vm-tools")) n.inert = false;
          paint();
        }),
      );
      el.querySelectorAll(".st-vm-slots, .st-vm-bank, .st-vm-tools").forEach(
        (n) => (n.inert = true),
      );
      transferHost.querySelector("button")?.focus();
    } else fb.show("retry", r.text);
    ctx.announce(r.text);
    paint();
  }

  function settle(loop, pairId, chipKey, slotKey, r) {
    placed.set(slotKey, chipKey);
    ctx.settle(loop);
    state.model = null;
    const sp = chipSpeech(chipByKey(chipKey));
    ctx.speak(sp.text, { lang: sp.lang });
    fb.show("right", `${sp.text} matches. ${r.text}`);
    ctx.announce(`${sp.text} matches.`);
    opts.onProgress?.(pairId);
    const left = unsolvedPairSlots().length;
    if (!left) {
      state.done = true;
      nextHost.append(
        h(
          "button",
          { type: "button", class: "st-btn st-primary", onclick: () => opts.onNext?.() },
          opts.nextLabel || "Next",
        ),
      );
    }
    paint();
    if (!left) nextHost.querySelector("button").focus();
  }

  function giveHint() {
    if (state.done || state.busy) return;
    const slot =
      (state.pending?.type === "slot" &&
        slotByKey(state.pending.key)?.kind === "pair" &&
        slotByKey(state.pending.key)) ||
      (state.last && !placed.has(`p:${state.last}`) && slotByKey(`p:${state.last}`)) ||
      unsolvedPairSlots()[0];
    if (!slot) return;
    const text =
      loopFor(slot.pairId).nextHint() || "Look at the card again and say the words you know.";
    const c = slotContent(slot);
    const about = (c.label || "").replace(/_____/g, "blank");
    fb.show("hint", `About "${about.length > 60 ? `${about.slice(0, 57)}...` : about}": ${text}`);
    ctx.announce(text);
    state.last = slot.pairId;
  }

  function hearSelected() {
    const key = state.pending?.type === "chip" ? state.pending.key : null;
    if (!key) return fb.show("hint", "Select a word first, then press this button to hear it.");
    const sp = chipSpeech(chipByKey(key));
    ctx.speak(sp.text, { lang: sp.lang });
  }

  paint();
  return {
    el,
    setEs(v) {
      state.es = !!v;
      paint();
    },
    refresh: paint,
    isComplete: () => state.done,
    pairIds,
  };
}
