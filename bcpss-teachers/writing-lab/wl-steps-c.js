// Writing Lab steps 7-10: Plan (Single-Paragraph Outline), Draft, Revise & Publish, Multi-Paragraph Plan.
import { copyText } from "../language-studio/studio-core.js";
import {
  byLevel,
  feedback,
  get,
  h,
  isStarter,
  isStretch,
  lessonTag,
  markDone,
  save,
  sentenceCount,
  seed,
  shuffleSeeded,
  speakBtn,
  textBox,
  tts,
  wl,
  wordBank,
  wordCount,
} from "./wl-core.js";

const STARTER_LABEL = {
  question: "Ask a question",
  appositive: "Use an appositive",
  subordinate: "Start with a clue word",
  statement: "Make a strong statement",
  exclamation: "Show excitement",
  command: "Give a command",
};
const MIN_DETAILS = { l1_2: 2, l3_4: 3, l5_6: 3 };

// ---------- 7. Plan: Single-Paragraph Outline ----------
export function stepPlan(root) {
  const p = wl.w.spo;
  root.append(
    h(
      "div",
      { class: "wl-prompt" },
      h("span", { class: "wl-prompt__k" }, "Your task"),
      h("p", null, byLevel(wl.w.prompt)),
      speakBtn(byLevel(wl.w.prompt), "Hear it"),
    ),
  );
  const spo = h("div", { class: "wl-spo" });

  // Topic sentence
  const tsBox = textBox({
    section: "spo",
    field: "ts",
    label: "T.S. Topic sentence",
    hint: `Frame: ${byLevel(p.topic)}`,
    rows: 2,
  });
  const starters = h(
    "details",
    { class: "wl-starters" },
    h("summary", null, "Try a topic-sentence starter"),
    h(
      "ul",
      null,
      ...p.starters.map((s) =>
        h("li", null, h("span", { class: "wl-tag" }, STARTER_LABEL[s.type]), " ", s.text),
      ),
    ),
  );
  spo.append(h("section", { class: "wl-spo__row wl-spo__row--ts" }, tsBox, starters));

  // Details
  const fb = feedback();
  const picked = new Set(get("spo").picked || []);
  const detailList = h("ol", { class: "wl-spo__details" });
  const renderPicked = () => {
    detailList.replaceChildren(...[...picked].map((t) => h("li", null, t)));
    const n = picked.size + (get("spo").own || "").split("\n").filter((x) => x.trim()).length;
    fb.set(
      n >= MIN_DETAILS[wl.level]
        ? `${n} details ready. That is enough to write a strong paragraph.`
        : `Choose at least ${MIN_DETAILS[wl.level]} details that support your topic sentence.`,
      n >= MIN_DETAILS[wl.level] ? "ok" : "hint",
    );
  };
  const bank = shuffleSeeded(
    [
      ...p.details.map((d) => ({ t: d.note, ok: true, lesson: d.lesson })),
      ...p.distractors.map((t) => ({ t, ok: false })),
    ],
    seed("spo"),
  );
  const bankEl = h("div", { class: "wl-notebank", role: "group", "aria-label": "Note bank" });
  for (const n of bank) {
    const b = h(
      "button",
      { type: "button", class: "wl-note", "aria-pressed": String(picked.has(n.t)) },
      h("span", { class: "wl-note__dash" }, "–"),
      n.t,
    );
    b.addEventListener("click", () => {
      if (!n.ok) {
        b.classList.add("is-off");
        b.disabled = true;
        fb.set(`"${n.t}" is true, but it does not support this topic. Leave it out.`, "no");
        return;
      }
      picked.has(n.t) ? picked.delete(n.t) : picked.add(n.t);
      b.setAttribute("aria-pressed", String(picked.has(n.t)));
      save("spo", { picked: [...picked] });
      renderPicked();
    });
    bankEl.append(b);
  }
  spo.append(
    h(
      "section",
      { class: "wl-spo__row" },
      h("h4", { class: "wl-field__label" }, "Details: key words only"),
      h(
        "p",
        { class: "wl-field__hint" },
        isStretch()
          ? "Write your own notes. Use the bank for ideas; skip notes that do not support your topic."
          : "Tap the notes that support your topic sentence. One or two do not belong.",
      ),
      bankEl,
      detailList,
      isStarter()
        ? null
        : textBox({
            section: "spo",
            field: "own",
            label: "Add your own notes (one per line)",
            rows: 3,
            onInput: renderPicked,
          }),
      fb,
    ),
  );
  spo.append(
    h(
      "section",
      { class: "wl-spo__row wl-spo__row--cs" },
      textBox({
        section: "spo",
        field: "cs",
        label: "C.S. Concluding sentence",
        hint: `Frame: ${byLevel(p.conclusion)}`,
        rows: 2,
      }),
    ),
  );
  root.append(spo);
  renderPicked();
  markDone("plan");
}

// ---------- 8. Draft ----------
const TWR_MOVES = [
  { k: "bbs", label: "Because / but / so", test: (t) => /\b(because|but|so)\b/i.test(t) },
  {
    k: "sub",
    label: "Clue-word start",
    test: (t) =>
      /(^|[.!?]\s+)(when|although|before|after|since|if|while|unless|even though|once|until|whenever|as)\b[^.!?]*,/i.test(
        t,
      ),
  },
  {
    k: "appos",
    label: "Appositive",
    test: (t) => /\b[A-Za-z][^,.!?]{1,40},\s(a|an|the|my|our|one)\b[^,.!?]{2,60},/.test(t),
  },
];
export function stepDraft(root) {
  const s = get("spo");
  const outline = h(
    "aside",
    { class: "wl-outline", "aria-label": "My outline" },
    h("h4", null, "My outline"),
    h("p", null, h("b", null, "T.S. "), s.ts || byLevel(wl.w.spo.topic)),
    h(
      "ul",
      null,
      ...[
        ...(s.picked || []),
        ...String(s.own || "")
          .split("\n")
          .filter((x) => x.trim()),
      ].map((d) => h("li", null, d)),
    ),
    h("p", null, h("b", null, "C.S. "), s.cs || byLevel(wl.w.spo.conclusion)),
  );
  const meter = h("div", { class: "wl-meter", "aria-live": "polite" });
  const moves = h("ul", { class: "wl-moves", "aria-label": "Writing moves I used" });
  const vocab = (wl.studio?.vocab || []).map((v) => v.term);
  const update = (t) => {
    const words = wordCount(t);
    const usedVocab = vocab.filter((v) =>
      new RegExp(
        `\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, Math.max(3, v.length - 1))}`,
        "i",
      ).test(t),
    );
    meter.replaceChildren(
      h("span", null, h("b", null, words), " words"),
      h("span", null, h("b", null, sentenceCount(t)), " sentences"),
      h("span", null, h("b", null, usedVocab.length), " unit words"),
    );
    moves.replaceChildren(
      ...TWR_MOVES.map((m) =>
        h(
          "li",
          { class: m.test(t) ? "is-on" : "" },
          h("span", { class: "wl-tick", "aria-hidden": "true" }, m.test(t) ? "✓" : ""),
          m.label,
          h("span", { class: "st-sr" }, m.test(t) ? " used" : " not yet"),
        ),
      ),
    );
  };
  const box = textBox({
    section: "draft",
    field: "text",
    label: "My paragraph",
    hint: "Turn each note into a full sentence. Use transition words to connect your ideas.",
    rows: isStarter() ? 6 : 12,
    onInput: update,
  });
  const minWords = { l1_2: 10, l3_4: 35, l5_6: 60 }[wl.level];
  const modelBody = h(
    "div",
    { class: "wl-model__body", hidden: true },
    h("p", { class: "wl-model__text" }, byLevel(wl.w.model)),
    speakBtn(byLevel(wl.w.model), "Hear it"),
  );
  const modelMsg = h("span", { class: "wl-model__note" });
  const modelBtn = h(
    "button",
    { type: "button", class: "st-btn st-btn--sm", "aria-expanded": "false" },
    "Compare with a model paragraph",
  );
  modelBtn.addEventListener("click", () => {
    if (wordCount(get("draft").text) < minWords) {
      modelMsg.textContent = `Write at least ${minWords} words first. You have ${wordCount(get("draft").text)}.`;
      return;
    }
    modelMsg.textContent = "";
    modelBody.hidden = !modelBody.hidden;
    modelBtn.setAttribute("aria-expanded", String(!modelBody.hidden));
  });
  root.append(
    h(
      "div",
      { class: "wl-draft" },
      outline,
      h(
        "div",
        { class: "wl-draft__main" },
        wordBank(wl.w.transitions, "Transitions"),
        vocab.length ? wordBank(vocab, "Unit words") : null,
        box,
        meter,
        moves,
        h(
          "div",
          { class: "wl-draft__tools" },
          h(
            "button",
            {
              type: "button",
              class: "st-btn st-btn--ghost st-btn--sm",
              onclick: () => tts(get("draft").text || ""),
            },
            "Read my paragraph aloud",
          ),
        ),
        h(
          "div",
          { class: "wl-model" },
          h("div", { class: "wl-model__bar" }, modelBtn, modelMsg),
          modelBody,
        ),
      ),
    ),
  );
  update(get("draft").text || "");
  markDone("draft");
}

// ---------- 9. Revise & publish ----------
const TWR_CHECKS = [
  "My topic sentence tells what the paragraph is about.",
  "Each detail supports the topic sentence.",
  "I used transition words to connect ideas.",
  "I used at least one because, but, or so sentence.",
  "My concluding sentence sums up my idea in new words.",
  "Every sentence starts with a capital letter and ends with an end mark.",
];
const RUBRIC = [
  {
    k: "ideas",
    label: "Ideas",
    rows: [
      "I wrote my main idea.",
      "I explained my idea with details from the unit.",
      "I explained my idea with strong, exact details and unit words.",
    ],
  },
  {
    k: "sentences",
    label: "Sentences",
    rows: [
      "I wrote complete sentences.",
      "I used because, but, or so and transitions.",
      "I used an appositive or a clue-word start, and my sentences flow.",
    ],
  },
  {
    k: "words",
    label: "Words",
    rows: [
      "I used some unit words.",
      "I used unit words correctly.",
      "I used precise unit words to make my meaning clear.",
    ],
  },
];
export function stepRevise(root) {
  const checks = [...wl.w.revise, ...TWR_CHECKS.slice(0, isStarter() ? 3 : 6)];
  const r = get("revise");
  const list = h(
    "ul",
    { class: "wl-checks" },
    ...checks.map((c, i) => {
      const id = `wl-chk${i}`;
      const box = h("input", { type: "checkbox", id, checked: r[`c${i}`] ? true : null });
      box.addEventListener("change", () => save("revise", { [`c${i}`]: box.checked }));
      return h("li", null, box, h("label", { for: id }, c));
    }),
  );
  const rubric = h(
    "div",
    { class: "wl-rubric", role: "group", "aria-label": "Rate my writing" },
    ...RUBRIC.map((row) =>
      h(
        "fieldset",
        { class: "wl-rubric__row" },
        h("legend", null, row.label),
        ...row.rows.map((txt, n) => {
          const id = `wl-r-${row.k}-${n}`;
          const input = h("input", {
            type: "radio",
            name: `wl-r-${row.k}`,
            id,
            value: String(n + 1),
            checked: r[row.k] === n + 1 ? true : null,
          });
          input.addEventListener("change", () => save("revise", { [row.k]: n + 1 }));
          return h(
            "label",
            { for: id, class: "wl-rubric__cell" },
            input,
            h("span", { class: "wl-rubric__lvl" }, ["Starting", "Getting there", "Got it"][n]),
            h("span", null, txt),
          );
        }),
      ),
    ),
  );
  const final = textBox({
    section: "draft",
    field: "text",
    label: "Make your changes here",
    rows: isStarter() ? 6 : 10,
  });
  const fb = feedback();
  const name = textBox({ section: "pub", field: "name", label: "My name", rows: 1 });
  root.append(
    h("h3", { class: "wl-sub" }, "Revise: check each box when it is true"),
    list,
    final,
    h("h3", { class: "wl-sub" }, "Rate my writing"),
    rubric,
    h("h3", { class: "wl-sub" }, "Publish"),
    name,
    h(
      "div",
      { class: "wl-publish" },
      h(
        "button",
        { type: "button", class: "st-btn st-btn--primary", onclick: () => printFinal() },
        "Print my paragraph",
      ),
      h(
        "button",
        {
          type: "button",
          class: "st-btn",
          onclick: async () =>
            fb.set(
              (await copyText(get("draft").text || ""))
                ? "Copied. Paste it into Canvas or a document."
                : "Copy did not work here. Select the text and copy it.",
              "ok",
            ),
        },
        "Copy my paragraph",
      ),
    ),
    fb,
  );
  markDone("revise");
}

function printFinal() {
  const sheet = document.getElementById("wlPrint");
  if (!sheet) return;
  sheet.replaceChildren(
    h("h1", null, wl.w.title),
    h(
      "p",
      { class: "wl-print__meta" },
      `${get("pub").name || "Name: ________________"} · ${wl.unit.unit_title}`,
    ),
    h("p", { class: "wl-print__prompt" }, byLevel(wl.w.prompt)),
    ...String(get("draft").text || "")
      .split(/\n+/)
      .map((p) => h("p", { class: "wl-print__body" }, p)),
  );
  window.print();
}

// ---------- 10. Go further: multi-paragraph plan (grades 5-8) ----------
export function stepMPO(root) {
  const m = wl.w.mpo;
  root.append(
    h(
      "p",
      { class: "wl-rule" },
      "Turn your paragraph into a short essay. The thesis is your big idea; each body paragraph gets its own topic and notes.",
    ),
    h(
      "div",
      { class: "wl-mpo__sample" },
      h("h4", null, "Sample plan"),
      h("p", null, h("b", null, "Thesis: "), m.thesis),
      h(
        "ol",
        null,
        ...m.paragraphs.map((p) =>
          h(
            "li",
            null,
            h("b", null, p.topic),
            h("ul", null, ...p.notes.map((n) => h("li", null, n))),
          ),
        ),
      ),
      h("p", null, h("b", null, "Conclusion: "), m.conclusion),
    ),
    textBox({ section: "mpo", field: "thesis", label: "My thesis statement", rows: 2 }),
    ...m.paragraphs.map((_, i) =>
      textBox({
        section: "mpo",
        field: `p${i}`,
        label: `Body paragraph ${i + 1}: topic + key-word notes`,
        rows: 3,
      }),
    ),
    textBox({ section: "mpo", field: "conclusion", label: "My conclusion idea", rows: 2 }),
  );
  markDone("mpo");
}
export const lessonTagFor = lessonTag;
