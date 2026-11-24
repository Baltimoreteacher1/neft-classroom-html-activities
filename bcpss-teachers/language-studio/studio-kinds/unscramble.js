// unscramble ("Sentence builder"): build each sentence on a sentence strip from color-coded chunks.
// Tap, drag or use the keyboard. Wrong checks point to the first part to look at (never the order); "Show me" appears
// after two tries and lowers the stars. Levels: Starter = first chunk anchored + slots + hear the target;
// Core = slots; Stretch = no slots + an optional "Make it your own" rewrite. Styles: studio-sentence.css.
import { createKit, enableDrag, h, icon, shuffleNotSame, withFocus } from "./_kit.js";

// ---------- sentence-part roles (heuristic and cautious: unsure means no role) ----------
const LINK =
  /^(because|so|but|and|or|yet|since|while|although|though|whereas|when|whenever|after|before|until|unless|if|which|that|who|as a result|as shown|so that|even though|leading to|however|then)\b/i;
const DETAIL =
  /^(to|in|on|at|by|from|with|for|during|into|onto|under|over|near|of|than|across|through|around|inside|outside|along|between|without|according to)\b/i;
const ACTION =
  /^(is|are|was|were|am|be|been|has|have|had|can|could|will|would|should|must|may|might|does|do|did|helps|help|makes|make|shows|show|means|keeps|need|needs)\b/i;
const DET =
  /^(the|a|an|this|that|these|those|my|our|your|their|his|her|its|one|both|each|every|some|many|most)\b/i;
const VERBISH =
  /\b(is|are|was|were|am|has|have|had|can|could|will|would|should|must|may|might|does|do|did)\b|\b\w{3,}ed\b/i;

export const ROLES = {
  who: { label: "Who / what", tip: "who or what the sentence is about" },
  act: { label: "Action", tip: "what they do or are" },
  det: { label: "Detail", tip: "where, when, why or how" },
  link: { label: "Link", tip: "a word that joins ideas" },
};

/** Role of an authored chunk. `idx` is its authored position. Returns "" when unsure (neutral color). */
export function roleOf(chunk, idx) {
  const s = String(chunk).trim();
  if (LINK.test(s)) return "link";
  if (DETAIL.test(s)) return "det";
  if (ACTION.test(s) || (idx > 0 && /^\w{3,}ed\b/i.test(s))) return "act";
  if (idx === 0 && !VERBISH.test(s) && (DET.test(s) || /^[A-Z][a-z]+$/.test(s))) return "who";
  return "";
}

const BTN = {
  primary: "st-btn st-btn--primary st-btn--lg",
  ghost: "st-btn st-btn--ghost st-btn--lg",
  tool: "st-btn st-btn--ghost st-btn--sm ss-tool",
};
const btn = (kind, text, onclick, attrs = {}) =>
  h("button", { type: "button", class: BTN[kind], text, onclick, ...attrs });

const checkRow = (on, text) =>
  h("li", { class: on ? "is-on" : "" }, on ? icon("check") : h("span", { class: "ss-dot" }), text);

/** Short end of a chunk for hints: "…because I added". */
const tail = (s) => {
  const w = String(s)
    .replace(/[.?!,]+$/, "")
    .split(/\s+/);
  return w.length > 4 ? `…${w.slice(-4).join(" ")}` : w.join(" ");
};

export default function mount(root, ctx) {
  const kit = createKit(root, ctx, "unscramble");
  root.classList.add("ss");
  const items = ctx.payload.items;
  const level = ctx.level || "l3_4";
  const anchored = level === "l1_2";
  const slotted = level !== "l5_6";
  const dots = kit.dots(items.length, "Sentences");
  const fb = kit.feedback(
    anchored
      ? "The first chunk is in place. Tap the next chunk to add it to the strip."
      : "Tap the chunks in order to build the sentence. You can also drag them.",
  );
  const stage = h("div", { class: "ss-stage" });
  const JOINERS = new Set(["because", "so", "and", "but", "since", "when", "if", "after", "before", "while", "although", "then"]);
  // Built from this sentence's own chunks; it says how to find the order, never what the order is.
  const hints = kit.hints(() => {
    const chunks = parts();
    const joiner = chunks
      .map((c) => String(c).trim().split(/\s+/)[0].toLowerCase())
      .find((w) => JOINERS.has(w));
    return [
      `Read all ${chunks.length} chunks out loud, in any order. Which ideas belong together?`,
      joiner
        ? `The chunk that starts with “${joiner}” joins onto the idea before it, so it cannot come first.`
        : "A sentence starts with a capital letter. Look for the chunk that could begin it.",
      "Build it in the strip, then read it aloud. If it sounds wrong, tap a chunk to take it out and try another spot.",
    ];
  });

  let cur = 0;
  let results = []; // per item: "first" | "retry" | "shown"
  let mine = []; // Stretch rewrites
  let answer = [];
  let pool = [];
  let history = [];
  let tries = 0;
  let solved = false;
  let check = -1; // position flagged after a wrong check
  let ticks = 0; // positions 0..ticks-1 confirmed right (after the 2nd try)
  let own = false; // Make-it-your-own panel open
  let focusKey = null;

  const parts = () => items[cur].parts;
  const save = () =>
    ctx.saveState({ v: 2, n: items.length, cur, results, mine, answer, pool, tries, solved });

  function begin(fresh = true) {
    if (fresh) {
      const all = parts().map((_, i) => i);
      const mixed = shuffleNotSame(ctx, all, `${kit.seed}:${cur}`);
      answer = anchored ? [0] : [];
      pool = anchored ? mixed.filter((p) => p !== 0) : mixed;
      tries = 0;
      solved = false;
      hints.reset();
    }
    history = [];
    check = -1;
    ticks = 0;
    own = false;
    items.forEach((_, i) =>
      dots.set(i, i < cur ? (results[i] === "shown" ? "miss" : "ok") : i === cur ? "now" : ""),
    );
    dots.label(`Sentence ${cur + 1} of ${items.length}`);
    fb.set("");
    render();
  }

  const mutate = (fn) => {
    history.push({ answer: [...answer], pool: [...pool] });
    if (history.length > 40) history.shift();
    fn();
    check = -1;
    fb.set("");
    save();
    render();
  };
  const minPos = anchored ? 1 : 0;
  const addAt = (p, pos) =>
    mutate(() => {
      pool = pool.filter((x) => x !== p);
      const at = pos === undefined ? answer.length : Math.max(minPos, pos);
      answer.splice(at, 0, p);
      focusKey = pool.length ? `p${pool[0]}` : "check";
    });
  const takeOut = (p) =>
    mutate(() => {
      answer = answer.filter((x) => x !== p);
      pool.push(p);
      focusKey = `p${p}`;
    });
  const move = (from, to) =>
    mutate(() => {
      const [v] = answer.splice(from, 1);
      answer.splice(Math.max(minPos, to), 0, v);
      focusKey = `s${v}`;
    });
  const undo = () => {
    const last = history.pop();
    if (!last) return;
    answer = last.answer;
    pool = last.pool;
    check = -1;
    save();
    render();
    ctx.announce("Undone.");
  };
  const startOver = () =>
    mutate(() => {
      const keep = anchored ? [0] : [];
      pool = [...pool, ...answer.filter((p) => !keep.includes(p))];
      answer = keep;
      focusKey = pool.length ? `p${pool[0]}` : null;
    });

  function doCheck() {
    const ps = parts();
    const wrong = answer.findIndex((p, i) => ps[p] !== ps[i]);
    if (wrong < 0) return win(false);
    tries++;
    check = wrong;
    ticks = tries >= 2 ? wrong : 0;
    save();
    render();
    kit.fx(stage.querySelector(".ss-strip"), "sg-shake");
    const where =
      wrong === 0
        ? "Check how your sentence starts. Which chunk names who or what the sentence is about? It begins with a capital letter."
        : `Your sentence is right up to "${tail(ps[answer[wrong - 1]])}". Check the part after it.`;
    fb.set(
      tries >= 2 ? `${where} You can also tap "Show me".` : `${where} Read it out loud.`,
      "no",
    );
  }

  function win(viaShow) {
    const ps = parts();
    answer = ps.map((_, i) => i);
    pool = [];
    solved = true;
    results[cur] = viaShow ? "shown" : tries === 0 ? "first" : "retry";
    check = -1;
    focusKey = "next";
    save();
    render();
    const strip = stage.querySelector(".ss-strip");
    kit.fx(strip, "ss-win");
    fb.set(
      viaShow
        ? "Here is the sentence. Listen, then read it with me."
        : tries === 0
          ? "First try! Listen to your sentence."
          : "You fixed it! Listen to your sentence.",
      viaShow ? "hint" : "ok",
    );
    kit.reading(strip, ps.join(" "), 0.9);
  }

  // ---------- rendering ----------
  function chipEl(p, key, cls, label, lead = []) {
    const text = parts()[p];
    const role = roleOf(text, p);
    const name = role ? ` (${ROLES[role].label})` : "";
    return h(
      "button",
      {
        type: "button",
        class: `ss-chip${role ? ` ss-chip--${role}` : ""}${cls}`,
        "data-key": key,
        "aria-label": `${text}${name}. ${label}`,
      },
      role ? h("span", { class: "ss-role", "aria-hidden": "true", text: ROLES[role].label }) : null,
      h("span", { class: "ss-chip__text" }, ...lead, text),
    );
  }

  function placedChip(p, pos) {
    const start = anchored && pos === 0;
    const locked = solved || start;
    const ok = solved || start || pos < ticks;
    const flagged = pos === check;
    const label = `Slot ${pos + 1}.${flagged ? " Check this part." : ""}${locked ? "" : " Press to take it out. Arrow keys move it."}`;
    const lead = [
      ok ? icon("check") : null,
      start && !solved ? h("span", { class: "ss-eyebrow", text: "Start" }) : null,
    ];
    const chip = chipEl(
      p,
      `s${p}`,
      `${ok ? " is-right" : ""}${flagged ? " is-check" : ""}`,
      label,
      lead,
    );
    chip.dataset.pos = String(pos);
    if (locked) chip.setAttribute("aria-disabled", "true");
    if (locked) return chip;
    chip.addEventListener("click", () => takeOut(p));
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Delete" || e.key === "Backspace") return takeOut(p);
      const to = e.key === "ArrowLeft" ? pos - 1 : e.key === "ArrowRight" ? pos + 1 : -1;
      if (to < minPos || to >= answer.length) return;
      e.preventDefault();
      move(pos, to);
      ctx.announce(`Moved to slot ${to + 1}.`);
    });
    return chip;
  }

  function poolChip(p) {
    const chip = chipEl(p, `p${p}`, "", "Press to add it to the strip.");
    chip.addEventListener("click", () => addAt(p));
    return { chip, wrap: h("div", { class: "ss-tile" }, chip, kit.speakBtn(parts()[p])) };
  }

  function strip() {
    const ps = parts();
    const el = h("div", {
      class: `ss-strip${solved ? " is-solved" : ""}`,
      role: "group",
      "aria-label": `Sentence strip, ${answer.length} of ${ps.length} chunks placed`,
    });
    const first = answer.length ? ps[answer[0]] : "";
    const last = answer.length === ps.length ? ps[answer[answer.length - 1]] : "";
    const capOn = /^[A-Z0-9]/.test(first);
    const endOn = /[.?!]$/.test(last);
    const cue = (on, text, label) =>
      h("span", {
        class: `ss-cue${on ? " is-on" : ""}`,
        title: label,
        "aria-label": `${label}${on ? ": yes" : ""}`,
        role: "img",
        text,
      });
    const chips = answer.map((p, pos) => placedChip(p, pos));
    const slots = slotted
      ? Array.from({ length: ps.length - answer.length }, (_, k) =>
          h("span", {
            class: `ss-slot${k === 0 ? " is-next" : ""}`,
            "aria-hidden": "true",
            text: String(answer.length + k + 1),
          }),
        )
      : [];
    const row = h("div", { class: "ss-strip__row" }, ...chips, ...slots);
    if (!answer.length && !slotted)
      row.append(h("span", { class: "ss-strip__empty", text: "Build your sentence here." }));
    el.append(
      cue(capOn, "Aa", "Starts with a capital letter"),
      row,
      cue(endOn, ". ? !", "Ends with an end mark"),
    );
    return { el, chips, row };
  }

  function legend() {
    const ps = parts();
    const present = [...new Set(ps.map((c, i) => roleOf(c, i)).filter(Boolean))];
    if (!present.length) return null;
    return h(
      "ul",
      { class: "ss-legend", "aria-label": "Chunk colors" },
      present.map((r) =>
        h(
          "li",
          { class: `ss-legend__item ss-chip--${r}` },
          h("b", { text: ROLES[r].label }),
          ` = ${ROLES[r].tip}`,
        ),
      ),
    );
  }

  function tools() {
    const bar = h("div", { class: "ss-tools" });
    if (solved) return bar;
    const hear = anchored ? kit.speakBtn(parts().join(" "), "Hear the sentence") : null;
    if (hear) bar.append(hear);
    hear?.classList.add("ss-tool");
    hear?.append(h("span", { text: "Hear it" }));
    bar.append(
      btn("tool", "Undo", undo, { "data-key": "undo", disabled: !history.length }),
      btn("tool", "Start over", startOver, {
        "data-key": "reset",
        disabled: answer.length <= minPos,
      }),
    );
    return bar;
  }

  function actions() {
    const row = h("div", { class: "ss-actions" });
    if (!solved) {
      if (tries >= 2) row.append(btn("ghost", "Show me", () => win(true), { "data-key": "show" }));
      row.append(
        btn("primary", "Check my sentence", doCheck, {
          "data-key": "check",
          disabled: pool.length > 0,
        }),
      );
      return row;
    }
    const last = cur + 1 >= items.length;
    const openOwn = () => {
      own = true;
      focusKey = "own-area";
      render();
    };
    const next = () => {
      if (last) return summary();
      cur++;
      save();
      begin();
    };
    const ownLabel = mine[cur] ? "Edit my version" : "Make it your own";
    row.append(
      kit.speakBtn(parts().join(" "), "Listen to the sentence") || "",
      level === "l5_6" && !own ? btn("ghost", ownLabel, openOwn, { "data-key": "own" }) : "",
      btn("primary", last ? "See my sentences" : "Next sentence", next, { "data-key": "next" }),
    );
    return row;
  }

  function ownPanel() {
    const base = parts().join(" ");
    const area = h("textarea", {
      class: "ss-area",
      rows: "2",
      "data-key": "own-area",
      "aria-label": "Your own version of the sentence",
      placeholder: "Add a detail or change a part. Keep it one sentence.",
    });
    area.value = mine[cur] || "";
    const checks = h("ul", { class: "ss-checks", "aria-live": "polite" });
    const paint = () => {
      const v = area.value.trim();
      const rows = [
        [/^[A-Z0-9"]/.test(v), "Starts with a capital letter"],
        [/[.?!]["”]?$/.test(v), "Ends with . ? or !"],
        [v.length > 0 && !/[.?!]\s+[A-Z]/.test(v), "Is one sentence"],
        [v.length > 0 && v.toLowerCase() !== base.toLowerCase(), "Changes or adds something"],
      ];
      checks.replaceChildren(...rows.map(([on, text]) => checkRow(on, text)));
    };
    area.addEventListener("input", paint);
    paint();
    const keep = btn("primary", "Save my version", () => {
      mine[cur] = area.value.trim();
      own = false;
      save();
      focusKey = "next";
      render();
      fb.set(mine[cur] ? "Saved. Strong writers try more than one way." : "", "ok");
    });
    return h(
      "section",
      { class: "ss-own", "aria-label": "Make it your own" },
      h("p", { class: "ss-eyebrow", text: "Make it your own (optional)" }),
      h("p", {
        class: "ss-own__lead",
        text: "Add when, where, why or how, or change who the sentence is about.",
      }),
      area,
      checks,
      h("div", { class: "ss-actions" }, keep),
    );
  }

  function render() {
    withFocus(root, () => {
      const s = strip();
      const poolEl = h("div", { class: "ss-pool", role: "group", "aria-label": "Chunks to place" });
      for (const p of pool) {
        const { chip, wrap } = poolChip(p);
        enableDrag(chip, {
          targets: () => [...s.chips, s.el],
          onDrop: (t) => (t === s.el ? addAt(p) : addAt(p, Number(t.dataset.pos))),
        });
        poolEl.append(wrap);
      }
      s.chips.forEach((chip, pos) => {
        if (chip.getAttribute("aria-disabled") === "true") return;
        const p = answer[pos];
        enableDrag(chip, {
          targets: () => [...s.chips.filter((c) => c !== chip), poolEl],
          onDrop: (t) => (t === poolEl ? takeOut(p) : move(pos, Number(t.dataset.pos))),
        });
      });
      stage.replaceChildren(
        ...[
          h(
            "div",
            { class: "ss-head" },
            h("p", { class: "ss-eyebrow", text: `Sentence ${cur + 1} of ${items.length}` }),
            tools(),
          ),
          s.el,
          solved || !pool.length ? null : h("p", { class: "ss-eyebrow", text: "Chunks" }),
          solved || !pool.length ? null : poolEl,
          solved ? null : legend(),
          own ? ownPanel() : null,
          solved && mine[cur] && !own
            ? h("p", { class: "ss-cmp" }, h("b", { text: "My version: " }), mine[cur])
            : null,
          actions(),
        ].filter(Boolean),
      );
    });
    if (focusKey) {
      stage.querySelector(`[data-key="${focusKey}"]`)?.focus({ preventScroll: true });
      focusKey = null;
    }
  }

  function summary() {
    ctx.saveState(null);
    items.forEach((_, i) => dots.set(i, results[i] === "shown" ? "miss" : "ok"));
    dots.label("All sentences built");
    const first = results.filter((r) => r === "first").length;
    const used = results.filter((r) => r === "shown").length;
    const stars = used ? 1 : first >= Math.ceil(items.length * 0.75) ? 3 : 2;
    const label = { first: "First try", retry: "Fixed it", shown: "Shown" };
    stage.replaceChildren(
      h(
        "section",
        { class: "ss-summary", "aria-label": "Your sentences" },
        h("h2", { class: "ss-summary__title", text: "Your sentences" }),
        h(
          "ol",
          { class: "ss-summary__list" },
          items.map((it, i) =>
            h(
              "li",
              null,
              h("span", { class: `ss-badge ss-badge--${results[i]}`, text: label[results[i]] }),
              h("span", { class: "ss-summary__text", text: it.parts.join(" ") }),
              kit.speakBtn(it.parts.join(" ")),
              mine[i]
                ? h("span", { class: "ss-summary__mine", text: `My version: ${mine[i]}` })
                : null,
            ),
          ),
        ),
      ),
    );
    fb.set(`${first} of ${items.length} sentences on the first try.`, "ok");
    ctx.done({ stars, detail: `${first} of ${items.length} sentences on the first try` });
  }

  root.append(h("div", { class: "sg-topbar" }, dots.el), hints, stage);
  kit.dock(fb.el);

  const saved = ctx.loadState?.();
  if (saved?.v === 2 && saved.n === items.length && saved.cur < items.length) {
    ({ cur, results, mine, answer, pool, tries, solved } = saved);
    results = results || [];
    mine = mine || [];
    begin(false);
  } else begin();
  return () => kit.destroy();
}
