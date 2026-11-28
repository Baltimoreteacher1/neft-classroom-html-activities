// Writing Lab steps 7-10: Plan (Single-Paragraph Outline), Draft, Revise & Publish, Multi-Paragraph Plan.
import { copyText } from "../language-studio/studio-core.js";
import {
  analyze,
  calm,
  coachPanel,
  outlineNotes,
  publishedPiece,
  revisionCompare,
  vocabTerms,
  xrayToggle,
} from "./wl-coach-ui.js";
import { workDownloads } from "./wl-export.js";
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
  teacher: "From your teacher",
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
/** Focus mode: hides the app chrome so only the outline and the paragraph remain. Esc leaves it. */
function focusToggle() {
  const btn = h(
    "button",
    { type: "button", class: "st-btn st-btn--ghost st-btn--sm", "aria-pressed": "false" },
    "Focus mode",
  );
  const set = (on) => {
    document.body.classList.toggle("wl-focus", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "Leave focus mode" : "Focus mode";
    if (on) {
      const box = document.querySelector(".wl-input--draft");
      box?.scrollIntoView({ block: "center" });
      box?.focus({ preventScroll: true });
    }
  };
  btn.addEventListener("click", () => set(!document.body.classList.contains("wl-focus")));
  focusExit = () => set(false);
  set(false);
  return btn;
}
let focusExit = () => document.body.classList.remove("wl-focus");
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("wl-focus")) focusExit();
});

/** "Saved on this device" status that follows the debounced save in wl-core. */
function savedNote() {
  const el = h("span", { class: "wl-saved", "aria-hidden": "true" }, "Saved on this device");
  let t = 0;
  el.ping = () => {
    el.textContent = "Saving…";
    window.clearTimeout(t);
    t = window.setTimeout(() => {
      el.textContent = "Saved on this device";
    }, 600);
  };
  return el;
}

export function stepDraft(root) {
  const s = get("spo");
  const notes = outlineNotes();
  const outline = h(
    "aside",
    { class: "wl-outline", "aria-label": "My outline" },
    h("h4", null, "My outline"),
    h("p", null, h("b", null, "T.S. "), s.ts || byLevel(wl.w.spo.topic)),
    h("ul", null, ...notes.map((d) => h("li", null, d))),
    h("p", null, h("b", null, "C.S. "), s.cs || byLevel(wl.w.spo.conclusion)),
  );
  const vocab = vocabTerms();
  const saved = savedNote();
  let coach = null;
  const refresh = calm((t) => coach?.update(t));
  const field = textBox({
    section: "draft",
    field: "text",
    label: "My paragraph",
    hint: "Turn each note into a full sentence. Use transition words to connect your ideas.",
    rows: isStarter() ? 6 : 12,
    onInput: (t) => {
      saved.ping();
      refresh(t);
    },
  });
  const box = field.querySelector("textarea");
  box.classList.add("wl-input--draft");
  coach = coachPanel(box);
  const xr = xrayToggle(box);
  const minWords = analyze("").stats.minWords;
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
        h(
          "details",
          { class: "wl-starters wl-starters--draft" },
          h("summary", null, `Sentence starters (${starterChips().length}) · tap one to add it`),
          wordBank(starterChips(), "Sentence starters"),
        ),
        wordBank(wl.w.transitions, "Transitions"),
        vocab.length
          ? wordBank(
              [
                ...(wl.studio?.vocab || []).map((v) => ({
                  text: v.term,
                  es: v.es && v.es !== v.term ? v.es : "",
                })),
                ...(wl.w.extra_words || []),
              ],
              "Unit words",
            )
          : null,
        field,
        coach.el,
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
          xr.btn,
          focusToggle(),
          saved,
        ),
        xr.panel,
        h(
          "div",
          { class: "wl-model" },
          h("div", { class: "wl-model__bar" }, modelBtn, modelMsg),
          modelBody,
        ),
        workDownloads(reviseDone),
      ),
    ),
  );
  coach.update(get("draft").text || "");
  markDone("draft");
}


// Sentence starters students can drop into the draft: the level's frames (blanks stay in [brackets] to replace)
// and the topic-sentence starters (a teacher's custom starters included).
function starterChips() {
  const frames = [byLevel(wl.w.spo.topic), byLevel(wl.w.spo.conclusion)].filter(Boolean);
  const starters = (wl.w.spo.starters || []).map((x) => x.text);
  return [...new Set([...frames, ...starters])];
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
const reviseChecks = () => [...wl.w.revise, ...TWR_CHECKS.slice(0, isStarter() ? 3 : 6)];
/** Text of the revise checks the student has ticked (for the downloaded file). */
export const reviseDone = () => reviseChecks().filter((_, i) => get("revise")[`c${i}`]);
export function stepRevise(root) {
  const checks = reviseChecks();
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
  const draftNow = String(get("draft").text || "");
  if (!get("snap").first && draftNow.trim()) save("snap", { first: draftNow });
  const fb = feedback();
  const piece = h("div", { class: "wl-pub__wrap" }, publishedPiece());
  let coach = null;
  let rev = null;
  const refresh = calm((t) => {
    coach?.update(t);
    rev?.update();
    piece.replaceChildren(publishedPiece());
  });
  const final = textBox({
    section: "draft",
    field: "text",
    label: "Make your changes here",
    rows: isStarter() ? 6 : 10,
    onInput: (t) => refresh(t),
  });
  const box = final.querySelector("textarea");
  coach = coachPanel(box, { compact: true });
  rev = revisionCompare(() => box.value);
  const xr = xrayToggle(box);
  const name = textBox({
    section: "pub",
    field: "name",
    label: "My name",
    rows: 1,
    onInput: () => refresh(box.value),
  });
  root.append(
    h("h3", { class: "wl-sub" }, "Revise: check each box when it is true"),
    list,
    final,
    h("div", { class: "wl-draft__tools" }, xr.btn),
    xr.panel,
    coach.el,
    rev.el,
    h("h3", { class: "wl-sub" }, "Rate my writing"),
    rubric,
    h("h3", { class: "wl-sub" }, "Publish"),
    name,
    h("p", { class: "wl-field__hint" }, "This is how your finished piece looks. It updates as you revise."),
    piece,
    h(
      "div",
      { class: "wl-publish" },
      h(
        "button",
        { type: "button", class: "st-btn st-btn--primary", onclick: () => printFinal() },
        "Print my published piece",
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
    workDownloads(reviseDone, { published: true }),
    h("h3", { class: "wl-sub" }, "Download my work"),
    h("p", { class: "wl-field__hint" }, "Your paragraph, plan and practice as a file you can print, edit or turn in."),
    workDownloads(reviseDone),
    fb,
  );
  coach.update(box.value);
  rev.update();
  markDone("revise");
}

function printFinal() {
  const sheet = document.getElementById("wlPrint");
  if (!sheet) return;
  sheet.replaceChildren(publishedPiece({ print: true }));
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
