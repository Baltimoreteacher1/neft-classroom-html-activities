// conversation-studio steps 1-3: choose a purpose, choose the moves that fit, put them in order.
import { h } from "../../core/dom.js";
import { btn, choiceGroup } from "../e4-kit.js";
import {
  checkMoves,
  checkOrder,
  flat,
  moveBy,
  movesFeedback,
  moveSupportItem,
  speechOpts,
  startOrder,
} from "./conv-logic.js";

const heading = (text) => h("h2", { class: "st-cv-h", "data-focus": "" }, text);

/** Step 1. A single purpose is chosen automatically. */
export function purposeStep(env) {
  const { ctx, activity, st } = env;
  const list = activity.purposes;
  const loop = env.loopFor("purpose", { hints: [], model: "" });
  const fb = ctx.feedback();
  const head = heading("What is this talk for?");
  const chosen = list.find((p) => p.id === st.purposeId);
  const group = choiceGroup({
    legend: "Choose your purpose",
    options: list.map((p) => ({ text: p.label, sub: p.description })),
    onChange: () => {
      next.disabled = false;
    },
  });
  if (chosen) group.set(list.indexOf(chosen));
  const next = btn("Choose this purpose", "primary", () => {
    const p = list[group.value()];
    if (st.purposeId !== p.id) env.resetFrom("purpose");
    st.purposeId = p.id;
    loop.submit({ ok: true });
    env.settle("purpose");
    env.go("moves");
  });
  next.disabled = !chosen;
  const topic = activity.topic;
  const el = h(
    "section",
    { class: "st-cv-step", "aria-label": "Purpose" },
    head,
    h("p", { class: "st-cv-intro" }, activity.intro),
    h(
      "div",
      { class: "st-cv-topic" },
      h("h3", {}, topic.title),
      h("p", {}, topic.context),
      topic.claim ? h("p", {}, h("strong", {}, "The claim: "), topic.claim) : null,
      env.visual(topic.visual),
    ),
    group.el,
    fb.el,
    h("div", { class: "st-e4-actions" }, next),
  );
  if (list.length === 1) {
    if (st.purposeId !== list[0].id) {
      st.purposeId = list[0].id;
      loop.submit({ ok: true });
      env.settle("purpose");
    }
    queueMicrotask(() => env.go("moves", { quiet: true }));
  }
  return { el, focus: () => head.focus() };
}

/** Step 2. Choose the moves that fit; the missing move is never named. */
export function movesStep(env) {
  const { ctx, activity, st } = env;
  const purpose = env.purpose();
  const plan = purpose.plan;
  const pool = purpose.moveIds.map((id) => env.moveById(id));
  const loop = env.loopFor("moves", { hints: plan.hints, model: plan.model });
  const fb = ctx.feedback();
  const picked = new Set(st.picked || []);
  const head = heading("Choose the moves that fit");
  const status = h("p", { class: "st-cv-count", role: "status", "aria-live": "polite" });
  const check = btn("Check my moves", "primary", onCheck);
  const hintBtn = btn("Hint", "", onHint);
  const cards = pool.map((m) => {
    const panel = ctx.supportPanel(moveSupportItem(m));
    const pick = btn(
      picked.has(m.id) ? "Picked" : "Pick this move",
      "st-cv-pick",
      () => toggle(m.id, pick),
      {
        "aria-pressed": String(picked.has(m.id)),
        "aria-label": `${m.label}: ${m.function}`,
      },
    );
    const card = h(
      "li",
      { class: "st-cv-move", "data-picked": String(picked.has(m.id)) },
      h("h3", {}, m.label),
      h("p", {}, m.function),
      panel.el,
      h(
        "div",
        { class: "st-e4-actions" },
        pick,
        btn("Hear an example", "st-btn-quiet", () => ctx.speak(m.example, speechOpts(activity, m)), {
          "aria-label": `Hear an example of ${m.label}`,
        }),
      ),
    );
    card.dataset.id = m.id;
    return card;
  });
  const paintCount = () => {
    status.textContent = `${picked.size} ${picked.size === 1 ? "move" : "moves"} picked.`;
  };
  function toggle(id, button) {
    if (picked.has(id)) picked.delete(id);
    else picked.add(id);
    const on = picked.has(id);
    button.setAttribute("aria-pressed", String(on));
    button.textContent = on ? "Picked" : "Pick this move";
    button.closest("li").dataset.picked = String(on);
    st.picked = [...picked];
    fb.hide();
    paintCount();
    env.save();
  }
  function onCheck() {
    const res = checkMoves([...picked], plan.expected);
    const r = loop.submit({ ok: res.ok, tag: res.extra.length ? "extra-move" : "missing-move" });
    env.settle("moves");
    if (res.ok) {
      fb.show(
        "right",
        "These are the moves that fit this purpose. Next you will put them in an order.",
      );
      ctx.announce("Moves correct.");
      st.movesDone = true;
      env.save();
      check.hidden = true;
      hintBtn.hidden = true;
      el.querySelector(".st-cv-after").hidden = false;
      el.querySelector(".st-cv-after button").focus();
      return;
    }
    const lead = movesFeedback(res, activity.moves);
    fb.show(
      r.kind === "model" ? "model" : "retry",
      r.kind === "model" ? `${lead} ${r.text}` : lead,
    );
    ctx.announce(lead);
    env.save();
  }
  function onHint() {
    const t = loop.nextHint();
    if (t) {
      fb.show("hint", t);
      ctx.announce(t);
    }
    env.settle("moves");
    env.save();
  }
  paintCount();
  const next = btn("Go to Order", "primary", () => {
    st.order = null;
    env.go("order");
  });
  const el = h(
    "section",
    { class: "st-cv-step", "aria-label": "Moves" },
    head,
    h("p", { class: "st-prompt" }, plan.prompt),
    h("ul", { class: "st-cv-moves" }, cards),
    status,
    fb.el,
    h(
      "div",
      { class: "st-e4-actions" },
      check,
      hintBtn,
      activity.purposes.length > 1 ? btn("Back", "st-btn-quiet", () => env.go("purpose")) : null,
    ),
    h("div", { class: "st-cv-after st-e4-actions", hidden: !st.movesDone }, next),
  );
  if (st.movesDone) {
    check.hidden = true;
    hintBtn.hidden = true;
  }
  return { el, focus: () => head.focus() };
}

/** Step 3. Arrange the chosen moves. Keyboard: Enter picks up, arrows move, Enter drops. Touch and mouse: Up / Down buttons. */
export function orderStep(env) {
  const { ctx, st } = env;
  const purpose = env.purpose();
  const plan = purpose.plan;
  const ids = flat(plan.expected);
  const loop = env.loopFor("order", { hints: plan.hints, model: plan.model });
  if (!st.order || st.order.length !== ids.length)
    st.order = startOrder(ids, plan.expected, `${env.aid}:${purpose.id}`);
  let held = null;
  const fb = ctx.feedback();
  const head = heading("Put the moves in order");
  const list = h("ol", { class: "st-cv-order", "aria-label": "Your plan, first move at the top" });
  const live = h("p", { class: "st-sr-only", role: "status", "aria-live": "polite" });
  const lockedNow = () => !!st.orderDone;

  function say(t) {
    live.textContent = "";
    setTimeout(() => (live.textContent = t), 20);
  }
  function move(i, d) {
    const next = moveBy(st.order, i, d);
    if (next.join() === st.order.join()) return say(d < 0 ? "Already first." : "Already last.");
    st.order = next;
    draw(i + d, true);
    say(`${env.moveById(st.order[i + d]).label}, position ${i + d + 1} of ${st.order.length}.`);
    env.save();
  }
  function draw(focusIndex, keepHeld) {
    list.replaceChildren(
      ...st.order.map((id, i) => {
        const m = env.moveById(id);
        const grab = h(
          "button",
          {
            type: "button",
            class: "st-btn st-cv-grab",
            "aria-pressed": String(held === id),
            "aria-label": `${m.label}, position ${i + 1} of ${st.order.length}. Press Enter to pick up, then the arrow keys to move, then Enter to drop.`,
            disabled: lockedNow(),
            onkeydown: (e) => {
              if (held !== id) return;
              if (e.key === "ArrowUp" || e.key === "ArrowLeft") (e.preventDefault(), move(i, -1));
              else if (e.key === "ArrowDown" || e.key === "ArrowRight")
                (e.preventDefault(), move(i, 1));
              else if (e.key === "Escape") ((held = null), draw(i, true), say("Dropped."));
            },
            onclick: () => {
              held = held === id ? null : id;
              draw(i, true);
              say(
                held
                  ? `${m.label} picked up. Use the arrow keys to move it.`
                  : `${m.label} dropped at position ${i + 1}.`,
              );
            },
          },
          h("span", { class: "st-cv-pos" }, `${i + 1}.`),
          " ",
          m.label,
        );
        return h(
          "li",
          { class: "st-cv-order-item", "data-held": String(held === id) },
          grab,
          h("span", { class: "st-cv-fn" }, m.function),
          h(
            "span",
            { class: "st-cv-arrows" },
            btn("Up", "", () => move(i, -1), {
              "aria-label": `Move ${m.label} up`,
              disabled: lockedNow() || i === 0,
            }),
            btn("Down", "", () => move(i, 1), {
              "aria-label": `Move ${m.label} down`,
              disabled: lockedNow() || i === st.order.length - 1,
            }),
          ),
        );
      }),
    );
    if (keepHeld && focusIndex != null)
      list.children[focusIndex]?.querySelector(".st-cv-grab")?.focus();
  }
  const check = btn("Check my order", "primary", () => {
    const res = checkOrder(st.order, plan.expected);
    const r = loop.submit({ ok: res.ok, tag: "order-wrong" });
    env.settle("order");
    if (res.ok) {
      st.orderDone = true;
      fb.show("right", "That order works.");
      ctx.announce("Order correct.");
      draw();
      showWhy();
      check.hidden = true;
      hint.hidden = true;
      done.hidden = false;
      done.querySelector("button").focus();
    } else {
      const lead = `${res.placed} of ${res.total} moves are in a good place. Keep moving the others.`;
      fb.show(
        r.kind === "model" ? "model" : "retry",
        r.kind === "model"
          ? `${lead} ${r.text}`
          : `${lead} ${plan.hints[Math.min(r.tries - 1, plan.hints.length - 1)]}`,
      );
      ctx.announce(lead);
    }
    env.save();
  });
  const hint = btn("Hint", "", () => {
    const t = loop.nextHint();
    if (t) {
      fb.show("hint", t);
      ctx.announce(t);
    }
    env.settle("order");
    env.save();
  });
  const done = h(
    "div",
    { class: "st-e4-actions", hidden: true },
    btn("Go to Rehearse", "primary", () => env.go("rehearse")),
  );
  const whyHost = h("div", { class: "st-cv-why" });
  function showWhy() {
    const why = plan.why;
    if (!why?.length) return;
    whyHost.replaceChildren(
      h("h3", {}, "Why this order works"),
      h(
        "ol",
        {},
        why.map((w) => h("li", {}, w)),
      ),
    );
  }
  draw();
  const el = h(
    "section",
    { class: "st-cv-step", "aria-label": "Order" },
    head,
    h("p", { class: "st-prompt" }, "Arrange your moves from first to last."),
    h(
      "p",
      { class: "st-note" },
      "Keyboard: press Enter on a move to pick it up, use the arrow keys, and press Enter to drop it. On a touch screen use the Up and Down buttons.",
    ),
    list,
    live,
    fb.el,
    h(
      "div",
      { class: "st-e4-actions" },
      check,
      hint,
      btn("Back", "st-btn-quiet", () => env.go("moves")),
    ),
    whyHost,
    done,
  );
  if (st.orderDone) {
    check.hidden = true;
    hint.hidden = true;
    done.hidden = false;
    showWhy();
  }
  return { el, focus: () => head.focus() };
}
