// read_annotate: tappable words, a palette of marks, check against target phrases (no spoilers), then questions.
import { announce, h, starsFor } from "../studio-core.js";
import { icon } from "../studio-icons.js";

const clean = (w) => w.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
const MAX_MARKS = 4;

/** Word-index ranges [start, end) where `phrase` occurs in `words`. */
function findRanges(words, phrase) {
  const want = phrase.split(/\s+/).map(clean).filter(Boolean);
  const ranges = [];
  for (let i = 0; i + want.length <= words.length; i++) {
    if (want.every((w, k) => clean(words[i + k]) === w)) ranges.push([i, i + want.length]);
  }
  return ranges;
}

export default function mount(root, ctx) {
  const p = ctx.payload;
  const words = p.text.split(/\s+/).filter(Boolean);
  const marks = p.marks.slice(0, MAX_MARKS);
  // per mark: one entry per target phrase, each with every place that phrase occurs in the text
  const targets = marks.map((m) => m.targets.map((t) => findRanges(words, t)).filter((r) => r.length));
  const saved = ctx.loadState() || {};
  const applied = words.map((_, i) => new Set(saved.applied?.[i] || []));
  let active = 0;
  let checks = 0;
  let drag = null;

  const wordEls = words.map((w, i) =>
    h(
      "button",
      { type: "button", class: "ra-w", tabindex: i === 0 ? "0" : "-1", "data-i": String(i) },
      w,
    ),
  );
  const paint = (i) => {
    const el = wordEls[i];
    el.className = `ra-w${[...applied[i]].map((m) => ` m${m}`).join("")}`;
    el.setAttribute(
      "aria-label",
      applied[i].size
        ? `${words[i]}, marked ${[...applied[i]].map((m) => marks[m].label).join(" and ")}`
        : words[i],
    );
  };
  const save = () => ctx.saveState({ applied: applied.map((s) => [...s]) });
  const toggle = (i, force) => {
    const has = applied[i].has(active);
    const on = force ?? !has;
    if (on) applied[i].add(active);
    else applied[i].delete(active);
    paint(i);
  };

  const text = h(
    "div",
    { class: "ra-text", role: "group", "aria-label": "Passage. Tap words to mark them." },
    wordEls.flatMap((e, i) => [e, i < wordEls.length - 1 ? " " : ""]),
  );
  words.forEach((_, i) => paint(i));
  let focusIdx = 0;
  const focusWord = (i) => {
    const n = Math.max(0, Math.min(words.length - 1, i));
    wordEls[focusIdx].tabIndex = -1;
    focusIdx = n;
    wordEls[n].tabIndex = 0;
    wordEls[n].focus();
  };
  text.addEventListener("click", (e) => {
    const b = e.target.closest(".ra-w");
    if (!b || drag?.moved) return;
    focusIdx = Number(b.dataset.i);
    toggle(focusIdx);
    save();
  });
  text.addEventListener("keydown", (e) => {
    const move = { ArrowRight: 1, ArrowDown: 6, ArrowLeft: -1, ArrowUp: -6 }[e.key];
    if (move) {
      e.preventDefault();
      focusWord(focusIdx + move);
    }
  });
  text.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".ra-w");
    if (!b || e.pointerType !== "mouse") return;
    const i = Number(b.dataset.i);
    drag = { on: !applied[i].has(active), moved: false, start: i };
  });
  text.addEventListener("pointerover", (e) => {
    const b = e.target.closest(".ra-w");
    if (!drag || !b || e.buttons !== 1) return;
    const i = Number(b.dataset.i);
    if (i !== drag.start || drag.moved) {
      if (!drag.moved) toggle(drag.start, drag.on);
      drag.moved = true;
      toggle(i, drag.on);
    }
  });
  const onUp = () => {
    if (drag?.moved) save();
    window.setTimeout(() => {
      drag = null;
    }, 0);
  };
  window.addEventListener("pointerup", onUp);

  const palette = marks.map((m, i) => {
    const b = h(
      "button",
      { type: "button", class: `ra-mark m${i}`, "aria-pressed": String(i === 0) },
      h("span", { class: `ra-mark__swatch m${i}`, "aria-hidden": "true" }, "Ab"),
      h("span", { class: "ra-mark__text" }, h("b", null, m.label), h("span", null, m.instruction)),
    );
    b.addEventListener("click", () => {
      active = i;
      palette.forEach((x, k) => x.setAttribute("aria-pressed", String(k === i)));
      announce(`${m.label} selected. ${m.instruction}`);
    });
    return b;
  });

  const result = h("div", { class: "ra-result", role: "status" });
  const qHost = h("section", { class: "ow-step ra-q", hidden: true, "aria-label": "Questions" });
  const checkBtn = h(
    "button",
    { type: "button", class: "st-btn st-btn--primary st-btn--lg" },
    icon("check", 20),
    "Check my marks",
  );
  const clearBtn = h(
    "button",
    { type: "button", class: "st-btn st-btn--ghost" },
    "Clear all marks",
  );
  clearBtn.addEventListener("click", () => {
    applied.forEach((s) => s.clear());
    words.forEach((_, i) => paint(i));
    save();
    result.replaceChildren();
  });
  let allFound = false;
  checkBtn.addEventListener("click", () => {
    checks += 1;
    const lines = marks.map((m, k) => {
      const span = ([a, b]) => Array.from({ length: b - a }, (_, j) => a + j);
      const inTarget = new Set(targets[k].flatMap((ranges) => ranges.flatMap(span)));
      const found = targets[k].filter((ranges) =>
        ranges.some((r) => span(r).filter((i) => applied[i].has(k)).length >= Math.ceil(r[1] - r[0]) * 0.8),
      ).length;
      const extras = words.reduce(
        (n, _, i) => n + (applied[i].has(k) && !inTarget.has(i) ? 1 : 0),
        0,
      );
      return { m, found, total: targets[k].length, extras };
    });
    allFound = lines.every((l) => l.found === l.total && l.extras === 0);
    result.replaceChildren(
      ...lines.map((l) => {
        const ok = l.found === l.total && l.extras === 0;
        return h(
          "p",
          { class: `st-feedback ${ok ? "st-feedback--ok" : ""}` },
          h(
            "span",
            null,
            h("b", null, l.m.label, ": "),
            `found ${l.found} of ${l.total}`,
            l.extras
              ? `, plus ${l.extras} word${l.extras > 1 ? "s" : ""} that ${l.extras > 1 ? "do" : "does"} not belong`
              : "",
            ok ? "" : ". Read again and try once more.",
          ),
        );
      }),
    );
    announce(allFound ? "All marks found." : "Some marks need another look.");
    if (qHost.hidden) {
      qHost.hidden = false;
      startQuestions();
    }
  });

  // questions
  let qi = 0;
  let mistakes = 0;
  function startQuestions() {
    const q = p.questions[qi];
    const fb = h("p", { class: "st-feedback", hidden: true, role: "status" });
    const next = h(
      "button",
      { type: "button", class: "st-btn st-btn--primary", hidden: true },
      qi + 1 < p.questions.length ? "Next question" : "Finish",
    );
    const opts = ctx
      .shuffle(
        q.options.map((t, i) => ({ t, ok: i === q.answer })),
        `${ctx.activity.title}-q${qi}`,
      )
      .map((o) => {
        const b = h("button", { type: "button", class: "ra-opt" }, o.t);
        b.addEventListener("click", () => {
          if (o.ok) {
            b.classList.add("is-ok");
            fb.className = "st-feedback st-feedback--ok";
            fb.textContent = q.why;
            fb.hidden = false;
            for (const x of qHost.querySelectorAll(".ra-opt")) x.disabled = true;
            next.hidden = false;
            next.focus();
          } else {
            mistakes += 1;
            b.classList.add("is-no");
            b.disabled = true;
            fb.className = "st-feedback st-feedback--no";
            fb.textContent = "Not quite. Look back at the passage and try another answer.";
            fb.hidden = false;
          }
          announce(fb.textContent);
        });
        return b;
      });
    next.addEventListener("click", () => {
      qi += 1;
      if (qi < p.questions.length) return startQuestions();
      const stars = mistakes === 0 && checks <= 2 ? 3 : mistakes <= 2 && checks <= 4 ? 2 : 1;
      ctx.done({
        stars: stars || starsFor(mistakes, p.questions.length),
        detail: allFound
          ? "You found every target and answered the questions."
          : "You read closely and answered the questions.",
      });
    });
    qHost.replaceChildren(
      h(
        "header",
        { class: "ow-step__head" },
        h("span", { class: "ow-step__num", "aria-hidden": "true" }, String(qi + 1)),
        h("h2", null, `Question ${qi + 1} of ${p.questions.length}`),
      ),
      h(
        "div",
        { class: "ow-step__body" },
        h("p", { class: "ra-q__text" }, q.q),
        h("div", { class: "ra-opts" }, opts),
        fb,
        next,
      ),
    );
  }

  root.append(
    h(
      "div",
      { class: "ra" },
      h("div", { class: "ra-palette", role: "group", "aria-label": "Mark colors" }, palette),
      h("div", { class: "ra-page st-card" }, text),
      h("div", { class: "ow-bar" }, clearBtn, checkBtn),
      result,
      qHost,
    ),
  );
  return () => window.removeEventListener("pointerup", onUp);
}
