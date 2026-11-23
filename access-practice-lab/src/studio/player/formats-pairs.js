// match, sort, order and build: arrange things. Every one works with a mouse, a finger and the keyboard by
// "pick it up, then choose where it goes" or by plain buttons; nothing needs dragging.

import { clearMarks, mark } from "./marks.js";
import { icon } from "./icons.js";
import { h, plainText, repaint, rich, rt, seeded, shuffled } from "./util.js";

/** A card button: pick up / put down. */
function cardButton(key, text, picked, extra = {}) {
  return rich(
    h("button", { type: "button", class: "sp-card", "data-key": key, "aria-pressed": String(picked), ...extra }),
    text,
  );
}

export function buildMatch(q, ctx) {
  const map = {};
  let picked = "";
  const cards = ctx.options.shuffle
    ? shuffled(q.pairs, seeded(q.id), true)
    : [...q.pairs].reverse();
  const bank = h("div", { class: "sp-bank", role: "group", "aria-label": ctx.t("matchBank") });
  const rows = h("ul", { class: "sp-rows" });
  const root = h("div", { class: "sp-match" }, h("p", { class: "sp-note-small" }, ctx.t("pickThenPlace")), rows, bank);
  const textOf = (id) => q.pairs.find((p) => p.id === id)?.right ?? "";
  const placedIds = () => new Set(Object.values(map));

  function paint() {
    bank.replaceChildren();
    for (const p of cards) {
      if (placedIds().has(p.id)) continue;
      const btn = cardButton(`card:${p.id}`, p.right, picked === p.id);
      btn.addEventListener("click", () => {
        picked = picked === p.id ? "" : p.id;
        clearMarks(root);
        if (picked) ctx.announce(ctx.t("pickedUp", { item: plainText(p.right) }));
        repaint(root, paint, `card:${p.id}`);
      });
      bank.append(btn);
    }
    if (!bank.children.length) bank.append(h("p", { class: "sp-note-small" }, ctx.t("allPlaced")));
    rows.replaceChildren();
    for (const p of q.pairs) {
      const has = map[p.id];
      const slot = h("button", {
        type: "button",
        class: `sp-slot${has ? " is-filled" : ""}`,
        "data-key": `slot:${p.id}`,
        "aria-label": `${plainText(p.left)}: ${has ? plainText(textOf(has)) : ctx.t("slotEmpty")}`,
      });
      if (has) rich(slot, textOf(has));
      else slot.append(h("span", { class: "sp-slot-hint" }, picked ? ctx.t("placeHere") : ctx.t("slotEmpty")));
      slot.addEventListener("click", () => {
        clearMarks(root);
        if (picked) {
          map[p.id] = picked;
          ctx.announce(ctx.t("placed", { item: plainText(textOf(picked)), where: plainText(p.left) }));
          picked = "";
          repaint(root, paint, `slot:${p.id}`);
        } else if (has) {
          picked = has;
          delete map[p.id];
          ctx.announce(ctx.t("pickedUp", { item: plainText(textOf(has)) }));
          repaint(root, paint, `card:${has}`);
        }
      });
      rows.append(h("li", { class: "sp-row" }, rt("span", "sp-row-left", p.left), slot));
    }
  }
  paint();
  return {
    el: root,
    get: () => ({ ...map }),
    lock(on) {
      for (const b of root.querySelectorAll("button")) b.disabled = on;
    },
    focus: () => root.querySelector("button")?.focus(),
    mark(result) {
      clearMarks(root);
      const wrong = new Set(result.wrong || []);
      for (const [pid, slot] of [...rows.querySelectorAll(".sp-slot")].map((s, i) => [q.pairs[i].id, s])) {
        if (!map[pid]) continue;
        mark(slot, wrong.has(pid) ? "look" : "right", ctx);
      }
    },
  };
}

export function buildSort(q, ctx) {
  const where = {};
  let picked = "";
  const items = ctx.options.shuffle ? shuffled(q.items, seeded(q.id)) : q.items;
  const bank = h("div", { class: "sp-bank", role: "group", "aria-label": ctx.t("sortBank") });
  const buckets = h("div", { class: "sp-buckets" });
  const root = h("div", { class: "sp-sort" }, h("p", { class: "sp-note-small" }, ctx.t("pickThenPlace")), bank, buckets);
  const textOf = (id) => q.items.find((i) => i.id === id)?.text ?? "";

  function paint() {
    bank.replaceChildren();
    for (const it of items) {
      if (where[it.id]) continue;
      const btn = cardButton(`item:${it.id}`, it.text, picked === it.id);
      btn.addEventListener("click", () => {
        picked = picked === it.id ? "" : it.id;
        clearMarks(root);
        if (picked) ctx.announce(ctx.t("pickedUp", { item: plainText(it.text) }));
        repaint(root, paint, `item:${it.id}`);
      });
      bank.append(btn);
    }
    if (!bank.children.length) bank.append(h("p", { class: "sp-note-small" }, ctx.t("allPlaced")));
    buckets.replaceChildren();
    for (const c of q.categories) {
      const drop = h(
        "button",
        {
          type: "button",
          class: "sp-drop",
          "data-key": `cat:${c.id}`,
          "aria-label": picked
            ? ctx.t("putIn", { item: plainText(textOf(picked)), where: plainText(c.label) })
            : ctx.t("pickFirst", { where: plainText(c.label) }),
        },
        picked ? ctx.t("placeHere") : ctx.t("pickFirstShort"),
      );
      drop.addEventListener("click", () => {
        if (!picked) {
          ctx.announce(ctx.t("pickFirstShort"));
          return;
        }
        clearMarks(root);
        where[picked] = c.id;
        ctx.announce(ctx.t("placed", { item: plainText(textOf(picked)), where: plainText(c.label) }));
        picked = "";
        repaint(root, paint, `cat:${c.id}`);
      });
      const list = h("ul", { class: "sp-chips" });
      for (const it of q.items.filter((i) => where[i.id] === c.id)) {
        const chip = cardButton(`item:${it.id}`, it.text, false, { class: "sp-card sp-chip", "aria-label": ctx.t("takeBack", { item: plainText(it.text) }) });
        chip.dataset.item = it.id;
        chip.addEventListener("click", () => {
          clearMarks(root);
          delete where[it.id];
          picked = it.id;
          ctx.announce(ctx.t("pickedUp", { item: plainText(it.text) }));
          repaint(root, paint, `item:${it.id}`);
        });
        list.append(h("li", null, chip));
      }
      buckets.append(h("section", { class: "sp-bucket", "aria-label": plainText(c.label) }, rt("h4", "sp-bucket-title", c.label), drop, list));
    }
  }
  paint();
  return {
    el: root,
    get: () => ({ ...where }),
    lock(on) {
      for (const b of root.querySelectorAll("button")) b.disabled = on;
    },
    focus: () => root.querySelector("button")?.focus(),
    mark(result) {
      clearMarks(root);
      const wrong = new Set(result.wrong || []);
      for (const chip of root.querySelectorAll(".sp-chip")) {
        mark(chip, wrong.has(chip.dataset.item) ? "look" : "right", ctx, chip.parentElement);
      }
    },
  };
}

export function buildOrder(q, ctx) {
  let order = shuffled(q.items, seeded(q.id), true).map((i) => i.id);
  const byId = new Map(q.items.map((i) => [i.id, i]));
  const list = h("ol", { class: "sp-order" });
  const root = h("div", { class: "sp-orderwrap" }, h("p", { class: "sp-note-small" }, ctx.t("orderHelp")), list);

  const move = (id, delta) => {
    const at = order.indexOf(id);
    const to = at + delta;
    if (to < 0 || to >= order.length) return;
    clearMarks(root);
    [order[at], order[to]] = [order[to], order[at]];
    ctx.announce(ctx.t("movedTo", { item: plainText(byId.get(id).text), n: to + 1, total: order.length }));
    repaint(root, paint, `grip:${id}`);
  };

  function paint() {
    list.replaceChildren();
    order.forEach((id, i) => {
      const it = byId.get(id);
      const grip = rich(
        h("button", { type: "button", class: "sp-grip", "data-key": `grip:${id}`, "aria-label": `${plainText(it.text)}. ${ctx.t("position", { n: i + 1, total: order.length })}` }),
        it.text,
      );
      grip.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          move(id, e.key === "ArrowUp" ? -1 : 1);
        }
      });
      const up = h("button", { type: "button", class: "sp-move", "data-key": `up:${id}`, "aria-label": ctx.t("moveUp", { item: plainText(it.text) }) }, icon("up"));
      const down = h("button", { type: "button", class: "sp-move", "data-key": `down:${id}`, "aria-label": ctx.t("moveDown", { item: plainText(it.text) }) }, icon("down"));
      up.disabled = i === 0;
      down.disabled = i === order.length - 1;
      up.addEventListener("click", () => move(id, -1));
      down.addEventListener("click", () => move(id, 1));
      list.append(h("li", { class: "sp-order-item", "data-id": id }, h("span", { class: "sp-order-n", "aria-hidden": "true" }, String(i + 1)), grip, h("span", { class: "sp-move-pair" }, up, down)));
    });
  }
  paint();
  return {
    el: root,
    get: () => [...order],
    lock(on) {
      if (!on) paint();
      else for (const b of root.querySelectorAll("button")) b.disabled = true;
    },
    focus: () => root.querySelector(".sp-grip")?.focus(),
    mark(result) {
      clearMarks(root);
      const wrong = new Set(result.wrong || []);
      for (const li of root.querySelectorAll(".sp-order-item"))
        mark(li, wrong.has(li.dataset.id) ? "look" : "right", ctx);
    },
  };
}

export function buildSentence(q, ctx) {
  const tiles = q.words.map((w, i) => ({ key: `w${i}`, word: w }));
  const bankOrder = shuffled(tiles, seeded(q.id), true);
  let seq = [];
  const bank = h("div", { class: "sp-bank", role: "group", "aria-label": ctx.t("wordBank") });
  const line = h("div", { class: "sp-sentence", role: "group", "aria-label": ctx.t("yourSentence") });
  const clear = h("button", { type: "button", class: "sp-btn sp-btn-quiet" }, icon("undo", 16), ctx.L("startOver"));
  const root = h("div", { class: "sp-build" }, line, bank, clear);

  function paint() {
    bank.replaceChildren();
    line.replaceChildren();
    for (const t of bankOrder) {
      if (seq.includes(t.key)) continue;
      const b = h("button", { type: "button", class: "sp-card sp-tile", "data-key": `bank:${t.key}` }, t.word);
      b.addEventListener("click", () => {
        clearMarks(root);
        seq.push(t.key);
        ctx.announce(ctx.t("added", { item: t.word }));
        paint();
        (bank.querySelector("button") || clear).focus();
      });
      bank.append(b);
    }
    if (!seq.length) line.append(h("span", { class: "sp-slot-hint" }, ctx.t("buildEmpty")));
    for (const key of seq) {
      const t = tiles.find((x) => x.key === key);
      const b = h("button", { type: "button", class: "sp-card sp-tile is-in", "data-key": `in:${key}`, "aria-label": ctx.t("takeBack", { item: t.word }) }, t.word);
      b.addEventListener("click", () => {
        clearMarks(root);
        seq = seq.filter((k) => k !== key);
        ctx.announce(ctx.t("removed", { item: t.word }));
        repaint(root, paint, `bank:${key}`);
      });
      line.append(b);
    }
  }
  clear.addEventListener("click", () => {
    seq = [];
    clearMarks(root);
    repaint(root, paint);
  });
  paint();
  return {
    el: root,
    get: () => seq.map((k) => tiles.find((x) => x.key === k).word),
    lock(on) {
      for (const b of root.querySelectorAll("button")) b.disabled = on;
    },
    focus: () => (bank.querySelector("button") || clear).focus(),
    mark(result) {
      clearMarks(root);
      if (seq.length) mark(line, result.status === "correct" ? "right" : "look", ctx);
    },
  };
}
