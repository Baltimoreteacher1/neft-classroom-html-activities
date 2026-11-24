// Language Studio Player — Word Wall (flip cards), Mentor Sentence and sentence frames for the studio home.
import { h, tts } from "./studio-core.js";
import { icon } from "./studio-icons.js";

const TONE_NAMES = {
  concept: "Big idea",
  connector: "Connector",
  evidence: "Proof",
  precision: "Exact words",
};

function speakBtn(text, label, rate) {
  const btn = h(
    "button",
    { type: "button", class: "sh-speak", "aria-label": label, title: label },
    icon("speaker", 20),
  );
  btn.addEventListener("click", async () => {
    btn.classList.add("is-live");
    await tts(text, { rate });
    btn.classList.remove("is-live");
  });
  return btn;
}

function wordCard(v, band) {
  const flip = (to) => {
    card.classList.toggle("is-flipped", to);
    front.inert = to;
    back.inert = !to;
    (to ? backFlip : frontFlip).focus({ preventScroll: true });
  };
  const frontFlip = h(
    "button",
    { type: "button", class: "st-btn st-btn--sm sh-wc__flip", onclick: () => flip(true) },
    icon("flip", 18),
    "Meaning",
  );
  const backFlip = h(
    "button",
    { type: "button", class: "st-btn st-btn--sm sh-wc__flip", onclick: () => flip(false) },
    icon("flip", 18),
    "Back to word",
  );
  const front = h(
    "div",
    { class: "sh-wc__face sh-wc__front" },
    v.icon
      ? h("span", { class: "sh-wc__icon", "aria-hidden": "true" }, v.icon)
      : h("span", { class: "sh-wc__tier" }, v.tier === 3 ? "Unit word" : "Power word"),
    h("h3", { class: "sh-wc__term" }, v.term),
    h("p", { class: "sh-wc__pos" }, v.pos),
    v.cue ? h("p", { class: "sh-wc__cue" }, h("span", null, "Picture it"), v.cue) : null,
    h("div", { class: "sh-wc__row" }, speakBtn(v.term, `Hear the word ${v.term}`, 0.8), frontFlip),
  );
  const back = h(
    "div",
    { class: "sh-wc__face sh-wc__back" },
    h("p", { class: "sh-wc__def" }, h("b", null, v.term), " — ", v.def),
    h("p", { class: "sh-wc__line" }, h("span", null, "Example"), v.example),
    h("p", { class: "sh-wc__line sh-wc__line--no" }, h("span", null, "Not this"), v.nonexample),
    v.es
      ? h(
          "p",
          { class: "sh-wc__es" },
          h("span", null, "Español"),
          h("b", null, v.es),
          v.es_note ? ` — ${v.es_note}` : "",
        )
      : null,
    v.family?.length
      ? h(
          "p",
          { class: "sh-wc__fam" },
          v.family.map((w) => h("span", { class: "st-tag" }, w)),
        )
      : null,
    h(
      "div",
      { class: "sh-wc__row" },
      speakBtn(v.example, "Hear the example sentence", 0.9),
      backFlip,
    ),
  );
  back.inert = true;
  const card = h(
    "article",
    { class: "sh-wc", "data-band": band, "aria-label": `Word card: ${v.term}` },
    h("div", { class: "sh-wc__inner" }, front, back),
  );
  return card;
}

export function wordWall(studio, band) {
  return h(
    "section",
    { class: "sh-section", id: "words", "aria-labelledby": "shWordsH" },
    h(
      "div",
      { class: "sh-sechead" },
      h("p", { class: "sh-eyebrow" }, "Step 1"),
      h("h2", { id: "shWordsH" }, "Word wall"),
      h("p", { class: "sh-sub" }, "Tap a card to hear the word. Flip it to see what it means."),
    ),
    h(
      "div",
      { class: "sh-wall" },
      studio.vocab.map((v) => wordCard(v, band)),
    ),
  );
}

function frameLine(text) {
  const parts = String(text).split(/(\[[^\]]+\])/);
  return h(
    "li",
    { class: "sh-frame" },
    parts.map((p) => (p.startsWith("[") ? h("span", { class: "sh-blank" }, p.slice(1, -1)) : p)),
  );
}

export function mentorSection(studio, level, levelName) {
  const m = studio.mentor;
  const panel = h(
    "div",
    { class: "sh-mentor__panel", "aria-live": "polite" },
    h("p", { class: "sh-mentor__hint" }, "Tap a colored part of the sentence to see what it does."),
  );
  const chunks = m.chunks.map((c) => {
    const btn = h(
      "button",
      { type: "button", class: "sh-chunk", "data-tone": c.tone, "aria-pressed": "false" },
      c.text,
    );
    btn.addEventListener("click", () => {
      for (const b of chunks) b.setAttribute("aria-pressed", String(b === btn));
      panel.dataset.tone = c.tone;
      panel.replaceChildren(
        h(
          "p",
          { class: "sh-mentor__role" },
          h("span", { class: "sh-swatch", "data-tone": c.tone }),
          `${c.role} · ${TONE_NAMES[c.tone] || c.tone}`,
        ),
        h("p", { class: "sh-mentor__ask" }, c.ask),
      );
    });
    return btn;
  });
  const legend = [...new Set(m.chunks.map((c) => c.tone))].map((t) =>
    h("li", null, h("span", { class: "sh-swatch", "data-tone": t }), TONE_NAMES[t] || t),
  );
  const gist = h(
    "p",
    { class: "sh-mentor__gist", hidden: true },
    h("b", null, "In other words: "),
    m.gist,
  );
  const gistBtn = h(
    "button",
    { type: "button", class: "st-btn st-btn--sm", "aria-expanded": "false" },
    "What does it mean?",
  );
  gistBtn.addEventListener("click", () => {
    gist.hidden = !gist.hidden;
    gistBtn.setAttribute("aria-expanded", String(!gist.hidden));
  });
  const frames = (studio.frames?.[level] || []).map(frameLine);
  return h(
    "section",
    { class: "sh-section", id: "sentence", "aria-labelledby": "shMentorH" },
    h(
      "div",
      { class: "sh-sechead" },
      h("p", { class: "sh-eyebrow" }, "Step 2"),
      h("h2", { id: "shMentorH" }, "Mentor sentence"),
      h(
        "p",
        { class: "sh-sub" },
        "A strong sentence to learn from. Take it apart, then build your own.",
      ),
    ),
    h(
      "div",
      { class: "sh-mentor st-card" },
      h(
        "p",
        { class: "sh-mentor__text", lang: "en" },
        chunks.flatMap((c, i) => [c, i < chunks.length - 1 ? " " : ""]),
      ),
      h(
        "div",
        { class: "sh-mentor__tools" },
        speakBtn(m.text, "Read the mentor sentence aloud", 0.85),
        gistBtn,
        h("ul", { class: "sh-legend", "aria-label": "Colors" }, legend),
      ),
      gist,
      panel,
    ),
    h(
      "div",
      { class: "sh-frames st-card st-card--flat" },
      h("h3", null, `${levelName} sentence frames`),
      h("ul", { class: "sh-frames__list" }, frames),
      h(
        "p",
        { class: "sh-connectors" },
        h("span", null, "Connector words"),
        studio.connectors.map((w) => h("span", { class: "sh-conn" }, w)),
      ),
    ),
  );
}
