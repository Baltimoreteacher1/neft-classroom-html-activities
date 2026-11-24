// Vocabulary Quest — three gates per trail: meaning, sentence, and context.
// The mechanic is the lab's "map match", but the trail now asks learners to use a
// word three different ways instead of recognising one definition.
import { esc, glyph, shuffle } from "../core/dom.js";
import { sound } from "../core/audio.js";
import { fx } from "../core/fx.js";
import { t, L } from "../core/i18n.js";

const DATA = {
  "3-5": [
    {
      word: "habitat",
      pos: L("noun", "sustantivo"),
      gate: "meaning",
      prompt: L("Which meaning fits this word?", "¿Qué significado corresponde a esta palabra?"),
      options: [
        "the place where a plant or animal lives",
        "a kind of weather",
        "a group of animals that sing",
        "the food a plant makes",
      ],
      answer: "the place where a plant or animal lives",
      gloss: "el hábitat — el lugar donde vive un ser vivo",
      why: "A habitat is a home for living things. A rainforest is a habitat for a toucan.",
    },
    {
      word: "observe",
      pos: L("verb", "verbo"),
      gate: "sentence",
      prompt: L("Which word completes the sentence?", "¿Qué palabra completa la oración?"),
      sentence: "We ___ the ants on the sidewalk every morning.",
      options: ["observe", "observes", "observed", "observing"],
      answer: "observe",
      gloss: "observar — mirar con atención",
      why: "With <b>we</b>, use the base verb: we <i>observe</i>. Add -s only for he, she or it.",
    },
    {
      word: "protect",
      pos: L("verb", "verbo"),
      gate: "sentence",
      prompt: L("Which word completes the sentence?", "¿Qué palabra completa la oración?"),
      sentence: "A hard shell can ___ a turtle from danger.",
      options: ["protect", "protects", "protected", "protecting"],
      answer: "protect",
      gloss: "proteger — mantener a salvo",
      why: "After <b>can</b>, use the base verb: can <i>protect</i>.",
    },
    {
      word: "survive",
      pos: L("verb", "verbo"),
      gate: "meaning",
      prompt: L("Which meaning fits this word?", "¿Qué significado corresponde a esta palabra?"),
      options: ["to stay alive", "to move to a new place", "to build a nest", "to sleep all winter"],
      answer: "to stay alive",
      gloss: "sobrevivir — seguir vivo",
      why: "To survive is to keep living, even when conditions are hard.",
    },
    {
      word: "migrate",
      pos: L("verb", "verbo"),
      gate: "sentence",
      prompt: L("Which word completes the sentence?", "¿Qué palabra completa la oración?"),
      sentence: "Some birds ___ south when the weather turns cold.",
      options: ["migrate", "migrates", "migrated", "migrating"],
      answer: "migrate",
      gloss: "migrar — viajar de una región a otra",
      why: "The subject <b>birds</b> is plural, so use <i>migrate</i>.",
    },
    {
      word: "predator",
      pos: L("noun", "sustantivo"),
      gate: "meaning",
      prompt: L("Which meaning fits this word?", "¿Qué significado corresponde a esta palabra?"),
      options: [
        "an animal that hunts other animals",
        "an animal that eats only plants",
        "a place where animals hide",
        "a young animal",
      ],
      answer: "an animal that hunts other animals",
      gloss: "el depredador — animal que caza a otros",
      why: "A predator hunts. The animal it hunts is its prey.",
    },
  ],
  "6-8": [
    {
      word: "adapt",
      pos: L("verb", "verbo"),
      gate: "meaning",
      prompt: L("Which meaning fits this word?", "¿Qué significado corresponde a esta palabra?"),
      options: [
        "to change in order to fit a new situation",
        "to copy another animal exactly",
        "to move without stopping",
        "to grow larger each year",
      ],
      answer: "to change in order to fit a new situation",
      gloss: "adaptarse — cambiar para encajar",
      why: "An adaptation is a change that helps a living thing survive in its environment.",
    },
    {
      word: "ecosystem",
      pos: L("noun", "sustantivo"),
      gate: "sentence",
      prompt: L("Which word completes the sentence?", "¿Qué palabra completa la oración?"),
      sentence: "A pond, the plants around it and every animal in it form an ___.",
      options: ["ecosystem", "evidence", "climate", "habitat"],
      answer: "ecosystem",
      gloss: "el ecosistema — seres vivos y su ambiente",
      why: "An ecosystem includes the living things <i>and</i> the nonliving parts they depend on.",
    },
    {
      word: "evidence",
      pos: L("noun", "sustantivo"),
      gate: "meaning",
      prompt: L("Which meaning fits this word?", "¿Qué significado corresponde a esta palabra?"),
      options: [
        "facts or details that support a claim",
        "a guess about what will happen",
        "a question with no answer",
        "a short summary of a story",
      ],
      answer: "facts or details that support a claim",
      gloss: "la evidencia — datos que apoyan una idea",
      why: "Evidence is what you point to when someone asks, “How do you know?”",
    },
    {
      word: "consequence",
      pos: L("noun", "sustantivo"),
      gate: "sentence",
      prompt: L("Which word completes the sentence?", "¿Qué palabra completa la oración?"),
      sentence: "One ___ of cutting the trees was more flooding downstream.",
      options: ["consequence", "consequent", "consequently", "consequences"],
      answer: "consequence",
      gloss: "la consecuencia — el resultado de una acción",
      why: "The phrase <b>one ___ of</b> needs a singular noun: one <i>consequence</i>.",
    },
    {
      word: "significant",
      pos: L("adjective", "adjetivo"),
      gate: "meaning",
      prompt: L("Which meaning fits this word?", "¿Qué significado corresponde a esta palabra?"),
      options: [
        "large or important enough to notice",
        "very small and hidden",
        "easy to forget",
        "exactly the same",
      ],
      answer: "large or important enough to notice",
      gloss: "significativo — importante o notable",
      why: "In science writing, a significant change is one large enough to matter.",
    },
    {
      word: "interpret",
      pos: L("verb", "verbo"),
      gate: "sentence",
      prompt: L("Which word completes the sentence?", "¿Qué palabra completa la oración?"),
      sentence: "Readers ___ a graph differently when the labels are missing.",
      options: ["interpret", "interprets", "interpreted", "interpreting"],
      answer: "interpret",
      gloss: "interpretar — explicar el significado",
      why: "The subject <b>Readers</b> is plural, so the present-tense verb is <i>interpret</i>.",
    },
  ],
};

const GATES = {
  meaning: L("Gate 1 · Meaning", "Puerta 1 · Significado"),
  sentence: L("Gate 2 · Sentence", "Puerta 2 · Oración"),
  context: L("Gate 3 · Context", "Puerta 3 · Contexto"),
};

export default {
  id: "vocab-quest",
  skill: "Reading",
  missedLabels: { vocabulary: "Word meaning in context" },

  rounds(band) {
    const items = DATA[band] || DATA["3-5"];
    return items.map((item, index) => ({
      ...item,
      id: `vq-${band}-${index}`,
      index,
      total: items.length,
      options: shuffle(item.options),
      prompt: item.prompt,
    }));
  },

  render(stage, round, shell) {
    const trail = Array.from({ length: round.total }, (_, i) => {
      const cls = i < round.index ? "is-done" : i === round.index ? "is-now" : "";
      return `<span class="q-node ${cls}"><i></i></span>`;
    }).join('<span class="q-link" aria-hidden="true"></span>');

    stage.innerHTML = `
      <div class="quest">
        <div class="quest-trail" aria-hidden="true">${trail}</div>

        <div class="quest-card">
          <div class="quest-top">
            <p class="prompt-kicker">${GATES[round.gate]}</p>
            <h2 class="quest-word" data-focus tabindex="-1">${esc(round.word)}</h2>
            <p class="quest-pos">${esc(round.pos)}</p>
          </div>

          <p class="quest-prompt">${esc(round.prompt)}</p>
          ${
            round.sentence
              ? `<p class="quest-sentence">${esc(round.sentence).replace("___", "<span>________</span>")}</p>`
              : ""
          }

          <div class="quest-options">
            ${round.options
              .map(
                (option, i) => `
              <button class="quest-option" type="button" data-choice data-ok="${option === round.answer}" data-key="${
                  i + 1
                }">
                <span class="key" aria-hidden="true">${String.fromCharCode(65 + i)}</span>
                <span class="qc-text">${esc(option)}</span>
              </button>`
              )
              .join("")}
          </div>

          <div class="gloss-row">
            <button class="link-btn" type="button" data-gloss>${L(
              "Ver en español",
              "Ver en español"
            )}</button>
                        <button class="link-btn" type="button" data-speak="${esc(round.word)}">${glyph.speaker}${L(
              "Hear the word",
              "Escuchar la palabra"
            )}</button>
          </div>
          <p class="gloss" data-gloss-text hidden>${esc(round.gloss)}</p>
        </div>
      </div>`;

    stage.querySelector("[data-gloss]")?.addEventListener("click", (event) => {
      const box = stage.querySelector("[data-gloss-text]");
      box.hidden = !box.hidden;
      event.currentTarget.setAttribute("aria-expanded", String(!box.hidden));
      sound.click();
    });

    stage.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (shell.locked) return;
        const correct = btn.dataset.ok === "true";
        stage.querySelectorAll("[data-choice]").forEach((b) => (b.disabled = true));
        btn.classList.add(correct ? "is-correct" : "is-wrong");
        if (!correct) {
          stage
            .querySelectorAll("[data-choice]")
            .forEach((b) => b.dataset.ok === "true" && b.classList.add("is-correct"));
        }
        shell.answer(correct, {
          tag: "vocabulary",
          title: correct
            ? L(`“${round.word}” is yours`, `“${round.word}” es tuyo`)
            : L(`The answer is “${round.answer}”`, `La respuesta es “${round.answer}”`),
          body: correct
            ? `${esc(round.word)} — ${esc(round.answer)}`
            : `${esc(round.word)} — ${esc(round.answer)}`,
          why: round.why,
        });
      });
    });
  },
};
