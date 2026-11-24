// Writing Lab coach — the views on top of wl-coach.js: live coach panel, paragraph X-ray, first-draft compare,
// and the published-piece layout (screen + print). Reads the outline/vocab from wl; never blocks the student.
import { analyzeParagraph, diffWords, MOVES, segments, transitionList } from "./wl-coach.js";
import { LEVEL_INFO, byLevel, get, h, speakBtn, wl } from "./wl-core.js";

const ROLE = { topic: "T.S.", detail: "Detail", conclusion: "C.S." };
const ROLE_NAME = {
  topic: "Topic sentence",
  detail: "Detail sentence",
  conclusion: "Concluding sentence",
};
const KIND = {
  transition: "Transition",
  conj: "Because / but / so",
  sub: "Clue word",
  vocab: "Unit word",
};
const ISSUE = {
  capital: "Needs a capital letter",
  end: "Needs an end mark",
  long: "Very long sentence",
};
const GENRE = { explain: "Explain", argue: "Argue", inform: "Inform", narrate: "Narrate" };

export const outlineNotes = () => {
  const s = get("spo");
  return [
    ...(s.picked || []),
    ...String(s.own || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean),
  ];
};
/** Unit words plus any words a teacher added in "Customize for my class". */
export const vocabTerms = () =>
  [...new Set([...(wl.studio?.vocab || []).map((v) => v.term), ...(wl.w.extra_words || [])])].filter(Boolean);
export const analyze = (text) =>
  analyzeParagraph(text, {
    level: wl.level,
    vocab: vocabTerms(),
    transitions: wl.w.transitions || [],
    notes: outlineNotes(),
  });

/** Debounced callback (keeps the coach calm while a student types). */
export function calm(fn, ms = 180) {
  let t = 0;
  return (...args) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

function check(on) {
  return h("span", { class: "wl-tick", "aria-hidden": "true" }, on ? "✓" : "");
}

/**
 * Live coach: counts, moves, outline check and the one next move.
 * box: the paragraph <textarea>. Returns { el, update(text) }.
 */
export function coachPanel(box, { compact = false } = {}) {
  const stats = h("div", { class: "wl-coach__stats" });
  const bar = h("span", { class: "wl-coach__fill" });
  const goal = h("div", { class: "wl-coach__goal", "aria-hidden": "true" }, bar);
  const moves = h("ul", { class: "wl-moves", "aria-label": "Writing moves I used" });
  const outline = h("ul", { class: "wl-coach__notes" });
  const outlineWrap = h(
    "div",
    { class: "wl-coach__block" },
    h("h4", { class: "wl-coach__h" }, "Outline check"),
    outline,
  );
  const nextMsg = h("p", { class: "wl-coach__msg" });
  const nextAct = h("div", { class: "wl-coach__act" });
  const next = h(
    "div",
    { class: "wl-coach__next", role: "status", "aria-live": "polite" },
    h("h4", { class: "wl-coach__h" }, "Next move"),
    nextMsg,
    nextAct,
  );
  let lastKey = "";
  const update = (text) => {
    const a = analyze(text);
    const pct = Math.min(100, Math.round((a.stats.words / a.stats.minWords) * 100));
    bar.style.width = `${pct}%`;
    goal.dataset.done = String(pct >= 100);
    stats.replaceChildren(
      h("span", null, h("b", null, a.stats.words), " words"),
      h("span", null, h("b", null, a.stats.sentences), " sentences"),
      h("span", null, h("b", null, a.stats.vocab.length), " unit words"),
      h(
        "span",
        { class: "wl-coach__aim" },
        pct >= 100 ? "Length goal reached" : `Goal: about ${a.stats.minWords} words`,
      ),
    );
    moves.replaceChildren(
      ...MOVES.filter((m) => wl.level !== "l1_2" || m.k === "transition" || m.k === "bbs").map(
        (m) =>
          h(
            "li",
            { class: a.moves[m.k] ? "is-on" : "" },
            check(a.moves[m.k]),
            m.label,
            h("span", { class: "st-sr" }, a.moves[m.k] ? " used" : " not yet"),
          ),
      ),
    );
    outlineWrap.hidden = !a.coverage.length;
    outline.replaceChildren(
      ...a.coverage.map((c) =>
        h(
          "li",
          { class: c.covered ? "is-on" : "" },
          check(c.covered),
          c.note,
          h("span", { class: "st-sr" }, c.covered ? " in my paragraph" : " not yet"),
        ),
      ),
    );
    const n = a.nudges[0];
    const key = n ? `${n.k}:${n.n || ""}:${n.note || ""}` : "done";
    if (key === lastKey) return;
    lastKey = key;
    nextMsg.textContent = n
      ? n.msg
      : "Every move is here. Read it aloud, then go to Revise & Publish to polish it.";
    next.dataset.tone = n ? "hint" : "ok";
    nextAct.replaceChildren(...actionsFor(n, box));
  };
  const el = h(
    "section",
    { class: `wl-coach${compact ? " wl-coach--compact" : ""}`, "aria-label": "Writing coach" },
    h("div", { class: "wl-coach__top" }, stats, goal),
    moves,
    next,
    compact ? null : outlineWrap,
  );
  return { el, update };
}

function actionsFor(n, box) {
  if (!n || !box) return [];
  const ts = get("spo").ts || "";
  if (n.k === "start" && ts.trim())
    return [
      h(
        "button",
        {
          type: "button",
          class: "st-btn st-btn--sm",
          onclick: () => {
            box.value = `${ts.trim()}${/[.!?]$/.test(ts.trim()) ? "" : "."} `;
            box.focus();
            box.dispatchEvent(new Event("input", { bubbles: true }));
          },
        },
        "Start with my topic sentence",
      ),
    ];
  if (n.n) {
    const sentence = analyze(box.value).sentences[n.n - 1]?.text || "";
    return [speakBtn(sentence, `Hear sentence ${n.n}`)].filter(Boolean);
  }
  return [];
}

/** Paragraph X-ray: each sentence with its job, its moves highlighted and any fix it needs. */
export function xray(text) {
  const a = analyze(text);
  const transitions = transitionList(wl.w.transitions || []);
  const vocab = vocabTerms();
  if (!a.sentences.length)
    return h("p", { class: "wl-field__hint" }, "Write a few sentences, then X-ray your paragraph.");
  return h(
    "div",
    { class: "wl-xray" },
    h(
      "ul",
      { class: "wl-xray__legend", "aria-label": "Highlight key" },
      ...Object.entries(KIND).map(([k, label]) =>
        h("li", null, h("mark", { class: `wl-x wl-x--${k}` }, label)),
      ),
    ),
    h(
      "ol",
      { class: "wl-xray__list" },
      ...a.sentences.map((s) =>
        h(
          "li",
          { class: `wl-xray__s wl-xray__s--${s.role}` },
          h("span", { class: "wl-xray__role", title: ROLE_NAME[s.role] }, ROLE[s.role]),
          h(
            "p",
            { class: "wl-xray__text" },
            ...segments(s.text, { transitions, vocab }).map((g) =>
              g.kind
                ? h("mark", { class: `wl-x wl-x--${g.kind}`, title: KIND[g.kind] }, g.text)
                : g.text,
            ),
          ),
          s.issues.length
            ? h("p", { class: "wl-xray__issues" }, s.issues.map((i) => ISSUE[i]).join(" · "))
            : null,
        ),
      ),
    ),
  );
}

/** Toggle + panel that X-rays the given box, refreshing while open. */
export function xrayToggle(box) {
  const panel = h("div", { class: "wl-xray__panel", hidden: true });
  const btn = h(
    "button",
    { type: "button", class: "st-btn st-btn--ghost st-btn--sm", "aria-expanded": "false" },
    "X-ray my paragraph",
  );
  const paint = () => panel.replaceChildren(xray(box.value));
  btn.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    btn.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) paint();
  });
  box.addEventListener(
    "input",
    calm(() => {
      if (!panel.hidden) paint();
    }, 300),
  );
  return { btn, panel };
}

/** First draft vs now: counts plus a word-level view of what changed. */
export function revisionCompare(getNow) {
  const first = get("snap").first || "";
  const summary = h("p", { class: "wl-rev__sum" });
  const body = h("div", { class: "wl-rev__diff", hidden: true });
  const btn = h(
    "button",
    { type: "button", class: "st-btn st-btn--sm", "aria-expanded": "false" },
    "Show my changes",
  );
  const paint = () => {
    const d = diffWords(first, getNow());
    summary.textContent =
      d.added || d.removed
        ? `Since your first draft you added ${d.added} ${d.added === 1 ? "word" : "words"} and cut ${d.removed}. Revising is what strong writers do.`
        : "No changes yet. Use the checklist, then improve a sentence or two.";
    body.replaceChildren(
      h(
        "p",
        { class: "wl-rev__text" },
        ...d.ops.flatMap((o) => [
          o.op === "same" ? o.text : h(o.op === "add" ? "ins" : "del", null, o.text),
          " ",
        ]),
      ),
    );
  };
  btn.addEventListener("click", () => {
    body.hidden = !body.hidden;
    btn.setAttribute("aria-expanded", String(!body.hidden));
    btn.textContent = body.hidden ? "Show my changes" : "Hide my changes";
    paint();
  });
  const el = h(
    "section",
    { class: "wl-rev", "aria-label": "My revisions" },
    h("h4", { class: "wl-coach__h" }, "My revisions"),
    summary,
    btn,
    body,
  );
  return { el: first ? el : null, update: first ? paint : () => {} };
}

/** The finished piece, typeset like a published page. Used on screen and in print. */
export function publishedPiece({ print = false } = {}) {
  const text = String(get("draft").text || "").trim();
  const a = analyze(text);
  const name = String(get("pub").name || "").trim();
  const paras = text ? text.split(/\n+/).filter((p) => p.trim()) : [];
  const used = MOVES.filter((m) => a.moves[m.k]).map((m) => m.label);
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return h(
    "article",
    { class: `wl-pub${print ? " wl-pub--print" : ""}` },
    h(
      "p",
      { class: "wl-pub__kicker" },
      `${GENRE[wl.w.genre] || "Writing"} · ${wl.unit.subject} · Grade ${wl.unit.grade}`,
    ),
    h("h2", { class: "wl-pub__title" }, wl.w.title),
    h(
      "p",
      { class: "wl-pub__byline" },
      name ? `by ${name}` : print ? "by ________________" : "Add your name to sign your work",
      h("span", null, ` · ${date}`),
    ),
    h("hr", { class: "wl-pub__rule" }),
    paras.length
      ? h("div", { class: "wl-pub__body" }, ...paras.map((p) => h("p", null, p)))
      : h("p", { class: "wl-pub__empty" }, "Your paragraph will appear here."),
    h(
      "footer",
      { class: "wl-pub__foot" },
      h("span", null, wl.unit.unit_title),
      used.length ? h("span", null, `Writing moves: ${used.join(" · ")}`) : null,
      h("span", null, `${a.stats.words} words · ${LEVEL_INFO[wl.level]?.name || ""} level`),
    ),
    print ? h("p", { class: "wl-pub__prompt" }, `Task: ${byLevel(wl.w.prompt)}`) : null,
  );
}
