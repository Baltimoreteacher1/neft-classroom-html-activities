// #/lens: the Language Lens. A teacher types or pastes a text, picks a grade, and sees the language it asks of students:
// vocabulary tiers, long sentences, words with several meanings, idioms, structures and (where the studio knows them) Spanish
// words. Everything is an automated estimate with the teacher's judgement first. The text never leaves the device.
import { announce, h } from "../core/dom.js";
import { analyzeLanguage } from "../core/lens.js";
import { planFromAnalysis, planToText } from "../core/lensdata.js";
import { buildHash } from "../core/router.js";
import { btn, copyWithNotice } from "./lens-ui.js";
import { bestCollection, fillCollections, renderReport } from "./lens-report.js";
import {
  MIN_WORDS,
  SAMPLE,
  ensureToolCss,
  gradeSubject,
  loadHandoff,
  privacyBanner,
  saveHandoff,
  statusLine,
  textBox,
  wordCount,
} from "./lens-tools-ui.js";
import { loadCollections } from "./vocab/source.js";

const go = (hash) => {
  window.location.hash = hash;
};

export async function render({ root, params = {}, shell }) {
  ensureToolCss();
  const prefs = shell?.prefs?.getPrefs?.() || {};
  const carried = params.from === "remix" ? loadHandoff() : null;
  const start = {
    grade: params.grade || carried?.grade || prefs.grade || "",
    subject: params.subject || carried?.subject || prefs.subject || "",
  };
  const box = textBox({
    id: "st-lens-text",
    label: "Text to look at",
    hint: "A passage, a word problem, directions or a test question. Type it or paste it.",
    value: carried?.text || "",
  });
  const picks = gradeSubject("st-lens", start);
  const status = statusLine();
  const results = h("div", { class: "st-lt-results" });
  let collectionsPromise = null;
  const collections = () =>
    (collectionsPromise ||= loadCollections(shell).then((r) => r.collections));

  const analyseBtn = btn("Look at the language", () => analyse(), { kind: "primary" });
  const form = h(
    "form",
    { class: "st-ll-card st-lt-form", novalidate: "" },
    box.el,
    picks.el,
    h(
      "div",
      { class: "st-ll-row" },
      analyseBtn,
      btn("Use an example", () => useExample()),
      btn("Clear", () => clearAll()),
    ),
    status.el,
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    analyse();
  });

  function showEmpty() {
    results.replaceChildren(
      h(
        "section",
        { class: "st-ll-card st-lt-empty", "aria-labelledby": "st-lens-empty" },
        h("h2", { id: "st-lens-empty", class: "st-ll-h2" }, "Nothing looked at yet"),
        h(
          "p",
          {},
          "Add a text above and choose Look at the language. If you want to see how it works first, choose Use an example.",
        ),
      ),
    );
  }

  function showError(retry) {
    results.replaceChildren(
      h(
        "section",
        { class: "st-ll-card st-ll-error", role: "alert" },
        h("h2", { class: "st-ll-h2" }, "The text could not be read"),
        h(
          "p",
          {},
          "Something went wrong while looking at this text. Your text is still in the box and nothing was lost.",
        ),
        btn("Try again", retry, { kind: "primary" }),
      ),
    );
  }

  function nextSteps(a, text, vals) {
    const matSlot = h(
      "div",
      { class: "st-lt-mat", "aria-live": "polite" },
      h("p", { class: "st-ll-muted" }, "Checking the studio vocabulary for a match."),
    );
    const remixQuery = { from: "lens", grade: vals.grade, subject: vals.subject };
    const fillMat = async () => {
      matSlot.replaceChildren(
        h("p", { class: "st-ll-muted" }, "Checking the studio vocabulary for a match."),
      );
      let list;
      try {
        list = await collections();
      } catch {
        list = null;
      }
      if (!list || !list.length) {
        collectionsPromise = null;
        matSlot.replaceChildren(
          h(
            "p",
            {},
            "The studio vocabulary could not be loaded, so a vocabulary mat is not available right now.",
          ),
          btn("Try again", () => fillMat(), { small: true }),
        );
        return;
      }
      const best = bestCollection(a, list, vals.grade);
      if (!best) {
        matSlot.replaceChildren(
          h(
            "p",
            {},
            "No studio vocabulary collection covers the words in this text yet, so there is nothing to build a mat from.",
          ),
          h(
            "a",
            {
              class: "st-ll-btn",
              href: buildHash("/remix", { ...remixQuery, target: "vocab-cards" }),
              onclick: () => saveHandoff({ text, ...vals }),
            },
            "Write your own vocabulary cards in Remix",
          ),
        );
        return;
      }
      const { collection: c, matched } = best;
      matSlot.replaceChildren(
        h(
          "a",
          {
            class: "st-ll-btn st-ll-btn-primary",
            href: buildHash("/create", {
              type: "vocab-mat",
              vocab: c.id,
              grade: vals.grade || c.grade,
              subject: vals.subject || c.subject,
            }),
          },
          "Create a vocabulary mat",
        ),
        h(
          "p",
          { class: "st-ll-muted" },
          `Uses the studio collection "${c.title}" (${c.entries.length} words, ${matched} of them in your text). You can choose which words to print in the Resource Studio.`,
        ),
      );
    };
    fillMat();
    const remix = h(
      "a",
      { class: "st-ll-btn st-ll-btn-primary", href: buildHash("/remix", remixQuery) },
      "Remix this text",
    );
    remix.addEventListener("click", () => saveHandoff({ text, ...vals }));
    return h(
      "section",
      { class: "st-ll-card", "aria-labelledby": "st-lens-next" },
      h("h2", { id: "st-lens-next", class: "st-ll-h2" }, "What would you like to do next?"),
      h(
        "div",
        { class: "st-lt-next" },
        h(
          "div",
          {},
          remix,
          h(
            "p",
            { class: "st-ll-muted" },
            "Make vocabulary cards, an evidence investigation, a discussion or an exit ticket from this text. Your words stay exactly as typed.",
          ),
        ),
        matSlot,
        h(
          "div",
          {},
          btn("Copy a language plan", () =>
            copyWithNotice(
              planToText(
                planFromAnalysis(a, { title: "Language plan", source: "Teacher-supplied text" }),
              ),
              "Language plan",
            ),
          ),
          h(
            "p",
            { class: "st-ll-muted" },
            "A plain-text plan you can paste into your own planning document.",
          ),
        ),
      ),
    );
  }

  function analyse() {
    const text = box.ta.value.trim();
    if (wordCount(text) < MIN_WORDS) {
      status.fail(`Add at least ${MIN_WORDS} words so there is something to look at.`);
      box.ta.focus();
      return;
    }
    const vals = picks.get();
    let a;
    try {
      a = analyzeLanguage(text, vals);
    } catch (err) {
      console.warn("[studio] lens failed", err);
      status.fail("This text could not be read.");
      showError(analyse);
      return;
    }
    const report = renderReport(a, text);
    const heading = h(
      "h2",
      { id: "st-lens-results", class: "st-ll-h2", tabindex: "-1" },
      "What this text asks of students",
    );
    results.replaceChildren(
      h(
        "div",
        { class: "st-ll-notice st-lt-honest", role: "note" },
        h("p", {}, h("strong", {}, "Automated estimate. ")),
        h(
          "p",
          {},
          "This tool matches words and sentence patterns against word lists. It can miss things and flag things that are fine for your class. Treat it as a prompt for your own judgement, not an answer.",
        ),
      ),
      heading,
      nextSteps(a, text, vals),
      report.el,
    );
    status.say(`Done. The text has ${a.stats.words} words in ${a.stats.sentences} sentences.`);
    announce("Language Lens results are ready.");
    heading.focus({ preventScroll: false });
    collections()
      .then((list) =>
        fillCollections(report.slots, list, report.el.querySelector(".st-lt-cognate-note")),
      )
      .catch(() => {
        collectionsPromise = null;
        report.el
          .querySelector(".st-lt-cognate-note")
          ?.replaceChildren(
            h(
              "p",
              { class: "st-ll-muted" },
              "The studio vocabulary could not be loaded, so Spanish words are not shown.",
            ),
          );
      });
  }

  function useExample() {
    box.ta.value = SAMPLE.text;
    box.paint();
    picks.set(SAMPLE);
    analyse();
  }

  function clearAll() {
    box.ta.value = "";
    box.paint();
    showEmpty();
    status.say("Cleared. Nothing was saved.");
    box.ta.focus();
  }

  root.replaceChildren(
    h(
      "section",
      { class: "st-ll st-lt" },
      h("h1", {}, "Language Lens"),
      h(
        "p",
        { class: "st-lt-lede" },
        "See the language a text asks of students before you teach it: which words to teach, which sentences are long, where meanings could trip students up.",
      ),
      privacyBanner(
        carried ? "This text came from Remix. Nothing was sent anywhere to bring it here." : "",
      ),
      form,
      results,
    ),
  );
  showEmpty();
  if (carried?.text) analyse();
  return () => {
    collectionsPromise = null;
  };
}
