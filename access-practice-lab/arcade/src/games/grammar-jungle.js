// Grammar Jungle — the lab's tag-and-fix grammar game, rebuilt as a canopy vine
// run: find the word that breaks a rule, then repair it. Two-step thinking means
// learners have to locate the error before they can guess a fix.
import { esc, glyph, shuffle } from "../core/dom.js";
import { sound, speak } from "../core/audio.js";
import { fx } from "../core/fx.js";
import { t, L } from "../core/i18n.js";

const DATA = {
  "3-5": [
    {
      words: ["The", "monkeys", "swings", "from", "tree", "to", "tree."],
      broken: 2,
      options: ["swing", "swinging", "swinged"],
      answer: "swing",
      rule: "Subject–verb agreement",
      tag: "subject-verb agreement",
      why: "“Monkeys” is plural, so the verb stays <b>swing</b>. One monkey <i>swings</i>; two monkeys <i>swing</i>.",
    },
    {
      words: ["I", "seen", "a", "bright", "parrot", "in", "the", "canopy."],
      broken: 1,
      options: ["saw", "seen", "seeing"],
      answer: "saw",
      rule: "Past-tense verbs",
      tag: "verb tense",
      why: "Use <b>saw</b> for one finished action in the past. “Seen” needs a helper, as in <i>I have seen</i>.",
    },
    {
      words: ["She", "don't", "like", "the", "rain."],
      broken: 1,
      options: ["doesn't", "don't", "didn't"],
      answer: "doesn't",
      rule: "Subject–verb agreement",
      tag: "subject-verb agreement",
      why: "With <b>he</b>, <b>she</b> and <b>it</b>, use <b>doesn't</b>. “She doesn't like the rain.”",
    },
    {
      words: ["The", "leaves", "is", "falling", "on", "the", "path."],
      broken: 2,
      options: ["are", "is", "was"],
      answer: "are",
      rule: "Subject–verb agreement",
      tag: "subject-verb agreement",
      why: "“Leaves” is plural, so use <b>are</b>: the leaves <i>are</i> falling.",
    },
    {
      words: ["We", "was", "walking", "on", "the", "bridge."],
      broken: 1,
      options: ["were", "was", "be"],
      answer: "were",
      rule: "Subject–verb agreement",
      tag: "subject-verb agreement",
      why: "“We” is plural, so use <b>were</b>: we <i>were</i> walking.",
    },
    {
      words: ["He", "run", "fast", "through", "the", "jungle."],
      broken: 1,
      options: ["runs", "run", "running"],
      answer: "runs",
      rule: "Subject–verb agreement",
      tag: "subject-verb agreement",
      why: "With <b>he</b>, <b>she</b> or <b>it</b>, the verb adds <b>-s</b>: he <i>runs</i>.",
    },
  ],
  "6-8": [
    {
      words: ["The", "researchers", "was", "observing", "the", "birds."],
      broken: 2,
      options: ["were", "was", "is"],
      answer: "were",
      rule: "Subject–verb agreement",
      tag: "subject-verb agreement",
      why: "The subject is plural (<b>researchers</b>), so the verb is <b>were</b>.",
    },
    {
      words: ["Neither", "the", "guide", "nor", "the", "students", "was", "ready."],
      broken: 6,
      options: ["were", "was", "is"],
      answer: "were",
      rule: "Neither … nor agreement",
      tag: "subject-verb agreement",
      why: "With <b>neither … nor</b>, the verb agrees with the nearer subject. <b>Students</b> is plural, so use <b>were</b>.",
    },
    {
      words: ["The", "data", "suggests", "that", "the", "habitat", "is", "shrinking,", "and", "it", "effects", "many", "species."],
      broken: 10,
      options: ["affects", "effects", "effected"],
      answer: "affects",
      rule: "Affect / effect",
      tag: "word choice",
      why: "<b>Affect</b> is the verb: one thing <i>affects</i> another. <b>Effect</b> is usually the noun: the <i>effect</i> was small.",
    },
    {
      words: ["The", "team", "collected", "data,", "and", "then", "they", "analyzed", "it", "careful."],
      broken: 9,
      options: ["carefully", "careful", "carefulness"],
      answer: "carefully",
      rule: "Adverbs",
      tag: "adverbs",
      why: "The word describes <i>how</i> they analyzed, so it must be an adverb: <b>carefully</b>.",
    },
    {
      words: ["Each", "of", "the", "birds", "have", "a", "distinct", "call."],
      broken: 4,
      options: ["has", "have", "having"],
      answer: "has",
      rule: "Singular subjects",
      tag: "subject-verb agreement",
      why: "The subject is <b>Each</b>, which is singular, so use <b>has</b>.",
    },
    {
      words: ["Its", "important", "to", "protect", "the", "canopy."],
      broken: 0,
      options: ["It's", "Its", "Its'"],
      answer: "It's",
      rule: "Contractions",
      tag: "contractions",
      why: "<b>It's</b> means <i>it is</i>. <b>Its</b> shows possession, as in <i>its leaves</i>.",
    },
  ],
};

const MISSED = {
  "subject-verb agreement": "Subject–verb agreement",
  "verb tense": "Past-tense verbs",
  "word choice": "Affect / effect",
  adverbs: "Adverbs that describe verbs",
  contractions: "Its / it’s",
};

export default {
  id: "grammar-jungle",
  skill: "Writing",
  missedLabels: MISSED,

  rounds(band) {
    return (DATA[band] || DATA["3-5"]).map((item, index) => ({
      ...item,
      id: `gj-${band}-${index}`,
      index,
      prompt: L(
        "Tap the word that breaks a rule, then fix it.",
        "Toca la palabra que rompe una regla y luego corrígela."
      ),
    }));
  },

  render(stage, round, shell) {
    let tagTries = 0;
    let resolved = false;

    const sentence = round.words.map((w) => esc(w)).join(" ");

    stage.innerHTML = `
      <div class="jungle">
        <div class="prompt">
          <p class="prompt-kicker">${L("Vine run", "Carrera en la liana")} · ${round.rule}</p>
          <h2 class="prompt-title" data-focus tabindex="-1">${L(
            "Tap the word that breaks a rule.",
            "Toca la palabra que rompe una regla."
          )}</h2>
          <p class="prompt-sub">${L(
            "One word in this sentence has the wrong form.",
            "Una palabra de esta oración tiene la forma incorrecta."
          )}</p>
        </div>

        <div class="jungle-sentence" data-sentence role="group" aria-label="${L(
          "Sentence",
          "Oración"
        )}">
          ${round.words
            .map(
              (word, i) =>
                `<button class="sword" type="button" data-word="${i}">${esc(word)}</button>`
            )
            .join(" ")}
        </div>

        <div class="fix-panel" data-fix hidden>
          <p class="fix-label">${L("Now choose the fix.", "Ahora elige la corrección.")}</p>
          <div class="option-row" data-options>
            ${shuffle(round.options)
              .map(
                (option, i) => `
              <button class="option-chip" type="button" data-choice data-value="${esc(
                option
              )}" data-key="${i + 1}">
                <span class="key" aria-hidden="true">${i + 1}</span>
                <span>${esc(option)}</span>
              </button>`
              )
              .join("")}
          </div>
        </div>

        <div class="helper-row">
          <button class="link-btn" type="button" data-speak="${esc(sentence)}">
            ${glyph.speaker}${L("Listen to the sentence", "Escuchar la oración")}
          </button>
          <span class="helper-note" data-note></span>
        </div>
      </div>`;

    const sentenceEl = stage.querySelector("[data-sentence]");
    const fixPanel = stage.querySelector("[data-fix]");
    const note = stage.querySelector("[data-note]");
    const words = [...stage.querySelectorAll("[data-word]")];

    const revealFix = (firstTry) => {
      fixPanel.hidden = false;
      words.forEach((b) => (b.disabled = true));
      fixPanel.scrollIntoView({ block: "nearest", behavior: "smooth" });
      const first = fixPanel.querySelector("[data-choice]");
      window.setTimeout(() => first?.focus({ preventScroll: true }), 120);
      if (!firstTry) note.textContent = L("Here it is. Now pick the fix.", "Aquí está. Ahora elige la corrección.");
    };

    words.forEach((btn, i) => {
      btn.addEventListener("click", () => {
        if (resolved || btn.disabled) return;
        if (i === round.broken) {
          btn.classList.add("is-broken");
          sound.hint();
          fx.burst(window.innerWidth / 2, btn.getBoundingClientRect().top + 20, {
            count: 10,
            power: 3,
            colors: ["#c2562f", "#e2b14a"],
          });
          announceWord(round.words);
          revealFix(tagTries === 0);
          return;
        }

        tagTries += 1;
        btn.classList.add("is-wrong");
        sound.wrong();
        fx.shake(sentenceEl);
        window.setTimeout(() => btn.classList.remove("is-wrong"), 700);
        note.textContent =
          tagTries >= 2
            ? L("Read it aloud — which word sounds off?", "Léela en voz alta: ¿qué palabra suena mal?")
            : L("Not that one. Try another word.", "Esa no. Prueba otra palabra.");
        if (tagTries >= 2) {
          const target = words[round.broken];
          target.classList.add("is-hint");
          revealFix(false);
        }
      });
    });

    const announceWord = () => {
      sound.click();
      speak(round.words.join(" "), { rate: 0.9 });
    };

    fixPanel.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (resolved) return;
        resolved = true;
        const correct = btn.dataset.value === round.answer;
        fixPanel.querySelectorAll("[data-choice]").forEach((b) => (b.disabled = true));
        btn.classList.add(correct ? "is-correct" : "is-wrong");
        const answerBtn = [...fixPanel.querySelectorAll("[data-choice]")].find(
          (b) => b.dataset.value === round.answer
        );
        answerBtn?.classList.add("is-correct");

        const fixed = round.words.map((w, i) => (i === round.broken ? round.answer : w)).join(" ");
        shell.answer(correct, {
          firstTry: tagTries === 0,
          tag: round.tag,
          title: correct
            ? L("Rule restored", "Regla restaurada")
            : L(`The fix is “${round.answer}”`, `La corrección es “${round.answer}”`),
          body: `<b>${esc(fixed)}</b>`,
          why: round.why,
        });
      });
    });
  },
};
