// early-sort modes: picture-sort and sound-match.
import { h, shuffle } from "../core/dom.js";
import {
  bigButton,
  calm,
  grownUpBox,
  helpButton,
  loopItem,
  pictureCard,
  retryText,
  warm,
} from "./early-sort-kit.js";
import { makeDraggable } from "./st1-drag.js";
import { speakBtn, transferCard, visualEl } from "./st1-ui.js";

/** Tier the items so the third and fourth home only appear once the child is ready: 2 choices first, up to 4 later. */
export function orderItems(round, seed) {
  const idx = new Map(round.categories.map((c, i) => [c.id, i]));
  const tier = (it) => Math.max(1, idx.get(it.category));
  const out = [];
  for (const t of [1, 2, 3])
    out.push(
      ...shuffle(
        round.items.filter((it) => tier(it) === t),
        `${seed}.${t}`,
      ),
    );
  return out;
}
export const unlockedFor = (order, i, round) => {
  const idx = new Map(round.categories.map((c, k) => [c.id, k]));
  let top = 1;
  for (let k = 0; k <= i; k++) top = Math.max(top, idx.get(order[k].category));
  return Math.min(round.categories.length, top + 1);
};

export const pictureSort = {
  session(env, round) {
    const { ctx } = env;
    const order = orderItems(round, `${ctx.aid}.${round.id}`);
    return {
      count: order.length,
      present(i, done) {
        const item = order[i];
        const spec = loopItem(item);
        const loop = ctx.loop(spec);
        const fb = calm(ctx);
        const open = unlockedFor(order, i, round);
        const bins = h("div", { class: "st-es-bins", "data-count": String(open) });
        const card = h("div", { class: "st-es-itemcard" }, pictureCard(ctx, item));
        let settled = false;
        for (const cat of round.categories.slice(0, open)) {
          const bin = h(
            "button",
            {
              type: "button",
              class: "st-es-bin",
              "data-drop": cat.id,
              "aria-label": `Put the ${item.word} in ${cat.label}`,
              onclick: () => place(cat.id),
            },
            visualEl(cat.visual, "st-es-binpic"),
            h("span", { class: "st-es-binlabel" }, cat.label),
          );
          bins.append(
            h(
              "div",
              { class: "st-es-binwrap" },
              bin,
              speakBtn(ctx, cat.say || cat.label, {
                label: `Listen: ${cat.label}`,
                iconOnly: true,
                cls: "st-es-listen",
              }),
            ),
          );
        }
        makeDraggable(card, { onDrop: (t) => place(t.dataset.drop), canDrag: () => !settled });
        env.host.append(
          h(
            "p",
            { class: "st-es-prompt" },
            round.prompt,
            " ",
            speakBtn(ctx, round.say || round.prompt, {
              label: "Listen to the directions",
              iconOnly: true,
              cls: "st-es-listen",
            }),
          ),
          card,
          bins,
          fb.el,
          h(
            "div",
            { class: "st-row" },
            helpButton(ctx, () => loop, fb),
          ),
        );
        ctx.speak(`${round.say || round.prompt} ${item.say || item.word}`);

        function place(catId) {
          if (settled) return;
          const cat = round.categories.find((c) => c.id === catId);
          const r = loop.submit({ ok: catId === item.category, pick: catId });
          if (r.ok) {
            settled = true;
            card.classList.add("st-pop");
            bins.querySelector(`[data-drop="${catId}"]`)?.classList.add("st-placed");
            for (const b of bins.querySelectorAll("button")) b.disabled = true;
            fb.show("right", `${warm(i)} You put the ${item.word} with ${cat.label}.`);
            return done(loop);
          }
          if (r.kind === "transfer") {
            fb.show("transfer", r.text);
            const t = transferCard(ctx, r.transfer, () => t.remove());
            fb.el.after(t);
            return;
          }
          if (r.kind === "model")
            bins.querySelector(`[data-drop="${item.category}"]`)?.classList.add("st-pulse");
          fb.show(r.kind === "model" ? "model" : "retry", retryText(r, spec, catId));
        }
      },
    };
  },
};

export const soundMatch = {
  session(env, round) {
    const { ctx } = env;
    const kind = round.kind === "rhyme" ? "rhymes with" : "starts like";
    return {
      count: round.trials.length,
      present(i, done) {
        const t = round.trials[i];
        const spec = loopItem(t, {
          // Trial-level misconceptions win; choice tags fill in for choices the trial does not mention.
          misconceptions: [
            ...(t.misconceptions || []),
            ...t.choices
              .filter((c) => c.tag && !(t.misconceptions || []).some((m) => m.pick === c.id))
              .map((c) => ({ pick: c.id, tag: c.tag, hint: c.hint })),
          ],
        });
        const loop = ctx.loop(spec);
        const fb = calm(ctx);
        const list = h("div", { class: "st-es-choices", "data-count": String(t.choices.length) });
        const cueSay = t.say || round.say || `${round.prompt} ${t.cue.word}`;
        for (const c of t.choices) {
          const btn = h(
            "button",
            {
              type: "button",
              class: "st-es-choicebtn",
              "data-choice": c.id,
              "aria-label": c.word,
              onclick: () => pick(c),
            },
            visualEl(c.visual, "st-es-pic"),
            h("span", { class: "st-es-word" }, c.word),
          );
          list.append(
            h(
              "div",
              { class: "st-es-choice" },
              btn,
              speakBtn(ctx, c.word, {
                label: `Listen: ${c.word}`,
                iconOnly: true,
                cls: "st-es-listen",
              }),
            ),
          );
        }
        env.host.append(
          h(
            "p",
            { class: "st-es-prompt" },
            round.prompt,
            " ",
            speakBtn(ctx, cueSay, {
              label: "Listen to the directions",
              iconOnly: true,
              cls: "st-es-listen",
            }),
          ),
          h("div", { class: "st-es-itemcard st-es-cue" }, pictureCard(ctx, t.cue)),
          list,
          fb.el,
          h(
            "div",
            { class: "st-row" },
            helpButton(ctx, () => loop, fb),
          ),
        );
        ctx.speak(cueSay);
        let settled = false;
        function pick(c) {
          if (settled) return;
          const r = loop.submit({ ok: c.id === t.answer, pick: c.id });
          if (r.ok) {
            settled = true;
            list.querySelector(`[data-choice="${c.id}"]`)?.classList.add("st-placed", "st-pop");
            for (const b of list.querySelectorAll("button.st-es-choicebtn")) b.disabled = true;
            fb.show("right", `${warm(i)} ${c.word} ${kind} ${t.cue.word}.`);
            return done(loop);
          }
          if (r.kind === "transfer") {
            fb.show("transfer", r.text);
            const card = transferCard(ctx, r.transfer, () => card.remove());
            fb.el.after(card);
            return;
          }
          if (r.kind === "model")
            list.querySelector(`[data-choice="${t.answer}"]`)?.classList.add("st-pulse");
          fb.show(r.kind === "model" ? "model" : "retry", retryText(r, spec, c.id));
        }
      },
    };
  },
};
