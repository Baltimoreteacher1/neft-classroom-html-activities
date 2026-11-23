// early-sort modes: syllable-clap, sequence-story and oral-describe.
import { h, shuffle } from "../core/dom.js";
import {
  bigButton,
  calm,
  grownUpBox,
  helpButton,
  loopItem,
  pictureCard,
  warm,
} from "./early-sort-kit.js";
import { speakBtn, visualEl } from "./st1-ui.js";

const sayAll = async (ctx, parts, rate = 0.7) => {
  for (const p of parts) await ctx.speak(p, { rate });
};

export const syllableClap = {
  session(env, round) {
    const { ctx } = env;
    return {
      count: round.items.length,
      present(i, done) {
        const item = round.items[i];
        const n = item.syllables.length;
        const spec = loopItem(item, {
          hints: item.hints || [
            "Listen again. Tap once for each part.",
            "Say it slowly. Tap for each part you hear.",
            "Let's clap it together.",
          ],
        });
        const loop = ctx.loop(spec);
        const fb = calm(ctx);
        let beats = 0;
        let settled = false;
        const row = h("div", { class: "st-es-beats", role: "img", "aria-label": "No taps yet" });
        const pad = h(
          "button",
          { type: "button", class: "st-es-pad", onclick: () => tap() },
          h("span", {}, "Tap the beat"),
        );
        const finish = bigButton("That's all", () => check());
        const reset = bigButton("Start over", () => clear(), { primary: false });
        const paintBeats = () => {
          row.textContent = "";
          for (let k = 0; k < beats; k++)
            row.append(h("span", { class: "st-es-beat st-pop" }, String(k + 1)));
          row.setAttribute(
            "aria-label",
            beats ? `${beats} ${beats === 1 ? "tap" : "taps"}` : "No taps yet",
          );
        };
        function tap() {
          if (settled) return;
          beats += 1;
          paintBeats();
          ctx.announce(`Beat ${beats}`);
        }
        function clear() {
          if (settled) return;
          beats = 0;
          paintBeats();
          fb.hide();
        }
        function reveal(chunks) {
          row.textContent = "";
          row.setAttribute("aria-label", `${chunks.length} parts: ${chunks.join(", ")}`);
          for (const c of chunks) row.append(h("span", { class: "st-es-chunk st-pop" }, c));
        }
        async function check() {
          if (settled) return;
          if (!beats) return fb.show("hint", "Tap the big button once for each part you hear.");
          const r = loop.submit({ ok: beats === n, pick: String(beats) });
          if (r.ok) {
            settled = true;
            pad.disabled = finish.disabled = reset.disabled = true;
            reveal(item.syllables);
            fb.show("right", `${warm(i)} ${item.word} has ${n} ${n === 1 ? "part" : "parts"}.`, {
              say: false,
            });
            await sayAll(ctx, item.syllables);
            await ctx.speak(`${warm(i)} ${item.word} has ${n} ${n === 1 ? "part" : "parts"}.`);
            return done(loop);
          }
          beats = 0;
          if (r.kind === "model") {
            fb.show("model", "Let's clap it together. Listen to each part.", { say: false });
            reveal(item.syllables);
            await sayAll(ctx, item.syllables);
            await ctx.speak(item.word, { rate: 0.8 });
            // The revealed parts stay on screen as the model; the next tap or "Start over" replaces them.
            return;
          }
          fb.show("retry", "Let's listen again. Tap once for each part.", { say: false });
          paintBeats();
          await ctx.speak(item.word, { rate: 0.6 });
        }
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
          h("div", { class: "st-es-itemcard" }, pictureCard(ctx, item)),
          pad,
          row,
          h("div", { class: "st-row st-es-actions" }, finish, reset),
          fb.el,
          h(
            "div",
            { class: "st-row" },
            helpButton(ctx, () => loop, fb),
          ),
        );
        ctx.speak(`${round.say || round.prompt} ${item.say || item.word}`);
      },
    };
  },
};

export const sequenceStory = {
  session(env, round) {
    const { ctx } = env;
    const sorted = [...round.cards].sort((a, b) => a.order - b.order);
    const shown = shuffle(round.cards, `${ctx.aid}.${round.id}`);
    return {
      count: sorted.length - 1,
      present(i, done) {
        const placed = sorted.slice(0, i);
        const remaining = shown.filter((c) => !placed.includes(c));
        const target = sorted[i];
        const spec = loopItem({ id: `${round.id}.step${i + 1}`, hints: round.hints });
        const loop = ctx.loop(spec);
        const fb = calm(ctx);
        let settled = false;
        const slots = h("ol", { class: "st-es-slots", "aria-label": "Story in order" });
        sorted.forEach((c, k) => {
          const filled = k < i;
          slots.append(
            h(
              "li",
              {
                class: `st-es-slot ${k === i ? "st-es-slot-now" : ""}`.trim(),
                "data-filled": String(filled),
              },
              filled
                ? visualEl(c.visual, "st-es-mini")
                : h("span", { class: "st-es-slotno" }, String(k + 1)),
            ),
          );
        });
        const list = h("div", { class: "st-es-choices", "data-count": String(remaining.length) });
        for (const c of remaining) {
          list.append(
            h(
              "div",
              { class: "st-es-choice" },
              h(
                "button",
                {
                  type: "button",
                  class: "st-es-choicebtn",
                  "data-card": c.id,
                  "aria-label": c.say,
                  onclick: () => pick(c),
                },
                visualEl(c.visual, "st-es-pic"),
                h("span", { class: "st-es-word" }, c.say),
              ),
              speakBtn(ctx, c.say, {
                label: `Listen: ${c.say}`,
                iconOnly: true,
                cls: "st-es-listen",
              }),
            ),
          );
        }
        const ask = `What happens ${i === 0 ? "first" : "next"}?`;
        env.host.append(
          h(
            "p",
            { class: "st-es-prompt" },
            round.title ? `${round.title}. ` : "",
            ask,
            " ",
            speakBtn(ctx, ask, {
              label: "Listen to the question",
              iconOnly: true,
              cls: "st-es-listen",
            }),
          ),
          slots,
          list,
          fb.el,
          h(
            "div",
            { class: "st-row" },
            helpButton(ctx, () => loop, fb),
          ),
        );
        ctx.speak(`${round.title ? `${round.title}. ` : ""}${ask}`);

        async function pick(c) {
          if (settled) return;
          const r = loop.submit({ ok: c === target, pick: c.id });
          if (!r.ok) {
            if (r.kind === "model")
              list.querySelector(`[data-card="${target.id}"]`)?.classList.add("st-pulse");
            fb.show(
              r.kind === "model" ? "model" : "retry",
              r.kind === "model"
                ? r.text
                : r.tries > 1
                  ? "Listen again, then try another card."
                  : "Try another spot.",
            );
            return;
          }
          settled = true;
          for (const b of list.querySelectorAll("button")) b.disabled = true;
          const last = i === sorted.length - 2;
          fb.show("right", `${warm(i)} ${c.say}`, { say: false });
          await ctx.speak(c.say);
          if (last) {
            const rest = sorted[sorted.length - 1];
            slots.lastElementChild.dataset.filled = "true";
            slots.lastElementChild.replaceChildren(visualEl(rest.visual, "st-es-mini"));
            fb.show(
              "right",
              `That is the whole story. Tell it to a friend: ${sorted.map((x) => x.say).join(" ")}`,
              { say: false },
            );
            await sayAll(
              ctx,
              sorted.map((x) => x.say),
              0.9,
            );
          }
          done(loop);
        }
      },
    };
  },
};

export const oralDescribe = {
  session(env, round) {
    const { ctx } = env;
    return {
      count: round.items.length,
      present(i, done) {
        const item = round.items[i];
        const loop = ctx.loop(loopItem(item));
        const fb = calm(ctx);
        const support = h("div", { class: "st-es-support" });
        const paintSupport = () => {
          support.textContent = "";
          support.append(ctx.supportPanel({ supports: item.frames || round.supports }).el);
        };
        ctx.onTier(paintSupport);
        const said = bigButton("I said it", () => {
          said.disabled = true;
          loop.submit({ ok: true });
          fb.show("right", `${warm(i)} Thank you for telling us about it.`);
          cleanup();
          done(loop);
        });
        const rec = recorder(ctx, item, fb);
        const cleanup = () => rec?.stop();
        env.host.append(
          h(
            "p",
            { class: "st-es-prompt" },
            item.say,
            " ",
            speakBtn(ctx, item.say, {
              label: "Listen to the directions",
              iconOnly: true,
              cls: "st-es-listen",
            }),
          ),
          h("div", { class: "st-es-itemcard" }, pictureCard(ctx, item, { listenText: item.say })),
          support,
          rec ? rec.el : null,
          h("div", { class: "st-row st-es-actions" }, said),
          fb.el,
          grownUpBox(item.grownUp, round.grownUp),
        );
        paintSupport();
        ctx.speak(item.say);
      },
    };
  },
};

/** Optional local recording. Starts only after an explicit tap; the audio never leaves the device. */
function recorder(ctx, item, fb) {
  const can =
    typeof navigator !== "undefined" &&
    navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";
  if (!can || item.record === false) return null;
  let mr = null;
  let stream = null;
  let url = null;
  const audio = h("audio", { controls: true, hidden: true, "aria-label": "Your recording" });
  const btn = h(
    "button",
    { type: "button", class: "st-btn st-es-big-btn", "aria-pressed": "false" },
    "Record my voice",
  );
  const drop = h(
    "button",
    { type: "button", class: "st-btn", hidden: true, onclick: () => clearUrl() },
    "Delete my recording",
  );
  const clearUrl = () => {
    if (url) URL.revokeObjectURL(url);
    url = null;
    audio.removeAttribute("src");
    audio.hidden = drop.hidden = true;
  };
  const stop = () => {
    if (mr && mr.state !== "inactive") mr.stop();
    for (const t of stream?.getTracks?.() || []) t.stop();
    mr = null;
  };
  btn.addEventListener("click", async () => {
    if (mr) {
      stop();
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = "Record again";
      return;
    }
    try {
      clearUrl();
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        url = URL.createObjectURL(new Blob(chunks, { type: mr?.mimeType || "audio/webm" }));
        audio.src = url;
        audio.hidden = drop.hidden = false;
      };
      mr.start();
      btn.setAttribute("aria-pressed", "true");
      btn.textContent = "Stop recording";
    } catch {
      mr = null;
      fb.show("hint", "Recording is not available here. You can still say it out loud.");
    }
  });
  const el = h(
    "div",
    { class: "st-es-record" },
    btn,
    audio,
    drop,
    h(
      "p",
      { class: "st-es-note" },
      "Recording is optional. It stays on this device and is never sent anywhere.",
    ),
  );
  return { el, stop: () => (stop(), clearUrl()) };
}
