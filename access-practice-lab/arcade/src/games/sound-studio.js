// Sound & Word Studio — hear a word, rebuild it syllable by syllable on the
// mixer tracks, then find the strong beat. Three decode-and-read layers instead
// of a single "which word is this" guess.
import { esc, glyph, shuffle } from "../core/dom.js";
import { sound, speak } from "../core/audio.js";
import { fx } from "../core/fx.js";
import { L } from "../core/i18n.js";

const WORDS = {
  "3-5": [
    {
      word: "butterfly",
      syllables: ["but", "ter", "fly"],
      stress: 0,
      gloss: "mariposa",
      why: "Say it slowly: <b>BUT</b> · ter · fly. The strong beat is the first syllable.",
    },
    {
      word: "elephant",
      syllables: ["el", "e", "phant"],
      stress: 0,
      gloss: "elefante",
      why: "Three syllables, with the beat at the start: <b>EL</b> · e · phant.",
    },
    {
      word: "important",
      syllables: ["im", "por", "tant"],
      stress: 1,
      gloss: "importante",
      why: "The middle syllable carries the beat: im · <b>POR</b> · tant.",
    },
    {
      word: "remember",
      syllables: ["re", "mem", "ber"],
      stress: 1,
      gloss: "recordar",
      why: "Say it twice: re · <b>MEM</b> · ber. The strong beat is the middle.",
    },
    {
      word: "umbrella",
      syllables: ["um", "brel", "la"],
      stress: 1,
      gloss: "paraguas",
      why: "The beat lands in the middle: um · <b>BREL</b> · la.",
    },
  ],
  "6-8": [
    {
      word: "ecosystem",
      syllables: ["e", "co", "sys", "tem"],
      stress: 0,
      gloss: "ecosistema",
      why: "Four syllables, strongest first: <b>E</b> · co · sys · tem.",
    },
    {
      word: "investigate",
      syllables: ["in", "ves", "ti", "gate"],
      stress: 1,
      gloss: "investigar",
      why: "The beat is second: in · <b>VES</b> · ti · gate.",
    },
    {
      word: "community",
      syllables: ["com", "mu", "ni", "ty"],
      stress: 1,
      gloss: "comunidad",
      why: "Listen for the middle rise: com · <b>MU</b> · ni · ty.",
    },
    {
      word: "scientific",
      syllables: ["sci", "en", "tif", "ic"],
      stress: 2,
      gloss: "científico",
      why: "The beat is third: sci · en · <b>TIF</b> · ic.",
    },
    {
      word: "communicate",
      syllables: ["com", "mu", "ni", "cate"],
      stress: 1,
      gloss: "comunicar",
      why: "The strong beat is second: com · <b>MU</b> · ni · cate.",
    },
  ],
};

export default {
  id: "sound-studio",
  skill: "Listening",
  missedLabels: { "syllable stress": "Word stress and syllables" },

  rounds(band) {
    return (WORDS[band] || WORDS["3-5"]).map((item, index) => ({
      ...item,
      id: `ss-${band}-${index}`,
      index,
      prompt: L("Build the word you hear, then find its strong beat.", "Forma la palabra que oyes y halla su golpe fuerte."),
    }));
  },

  render(stage, round, shell) {
    let order = [];
    let attempts = 0;
    let arranged = false;
    let judged = false;
    const bank = shuffle(round.syllables.map((syllable, i) => ({ syllable, i })));
    const total = round.syllables.length;

    stage.innerHTML = `
      <div class="studio">
        <div class="studio-head">
          <div>
            <p class="prompt-kicker">${L("Round", "Ronda")} ${round.index + 1} · ${L(
              "syllables",
              "sílabas"
            )}</p>
            <h2 class="prompt-title" data-focus tabindex="-1">${L(
              "Build the word you hear.",
              "Forma la palabra que oyes."
            )}</h2>
          </div>
          <button class="btn btn-listen" type="button" data-speak="${esc(round.word)}">${glyph.speaker}${L(
            "Hear it",
            "Escuchar"
          )}</button>
        </div>

        <div class="mixer" data-mixer aria-label="${L("Syllable tracks", "Pistas de sílabas")}">
          ${Array.from({ length: total }, (_, i) => `<div class="track" data-track="${i}"></div>`).join("")}
        </div>

        <div class="bank" data-bank>
          ${bank
            .map(
              (chip) => `
            <button class="syl-chip" type="button" data-chip="${chip.i}" data-key="${chip.i + 1}">
              ${esc(chip.syllable)}
            </button>`
            )
            .join("")}
        </div>

        <div class="studio-tools">
          <button class="link-btn" type="button" data-undo>↶ ${L("Undo", "Deshacer")}</button>
          <button class="link-btn" type="button" data-clear>${L("Clear", "Borrar")}</button>
          <button class="btn btn-primary" type="button" data-check disabled>${L(
            "Check the word",
            "Revisar la palabra"
          )}</button>
        </div>

        <div class="stress" data-stress hidden>
          <p class="stress-q">${L("Which syllable is the strong beat?", "¿Qué sílaba tiene el golpe fuerte?")}</p>
          <div class="stress-row" data-stress-row>
            ${round.syllables
              .map(
                (syllable, i) => `
              <button class="stress-btn" type="button" data-stress="${i}" data-key="${i + 1}">
                ${esc(syllable)}
              </button>`
              )
              .join("")}
          </div>
        </div>

        <p class="studio-note" data-note role="status"></p>
      </div>`;

    const mixer = stage.querySelector("[data-mixer]");
    const bankEl = stage.querySelector("[data-bank]");
    const check = stage.querySelector("[data-check]");
    const note = stage.querySelector("[data-note]");
    const stress = stage.querySelector("[data-stress]");

    const paint = () => {
      [...mixer.querySelectorAll("[data-track]")].forEach((track, i) => {
        const chipIndex = order[i];
        if (chipIndex == null) {
          track.innerHTML = `<span class="track-empty">${i + 1}</span>`;
          track.classList.remove("is-filled");
        } else {
          track.innerHTML = `<span class="track-syl">${esc(
            round.syllables[chipIndex]
          )}</span><span class="track-wave" aria-hidden="true"></span>`;
          track.classList.add("is-filled");
        }
      });
      bankEl.querySelectorAll("[data-chip]").forEach((chip) => {
        const used = order.includes(Number(chip.dataset.chip));
        chip.disabled = used || arranged;
        chip.classList.toggle("is-used", used);
      });
      check.disabled = order.length < total || arranged;
    };

    bankEl.querySelectorAll("[data-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        if (arranged || order.length >= total) return;
        const index = Number(chip.dataset.chip);
        order.push(index);
        sound.click();
        speak(round.syllables[index], { rate: 0.8 });
        paint();
        if (order.length === total) check.focus({ preventScroll: true });
      });
    });

    mixer.addEventListener("click", (event) => {
      if (arranged) return;
      const track = event.target.closest("[data-track]");
      if (!track) return;
      const i = Number(track.dataset.track);
      if (i >= order.length) return;
      order.splice(i, 1);
      sound.click();
      paint();
    });

    stage.querySelector("[data-undo]")?.addEventListener("click", () => {
      if (arranged) return;
      order.pop();
      sound.click();
      paint();
    });

    stage.querySelector("[data-clear]")?.addEventListener("click", () => {
      if (arranged) return;
      order = [];
      sound.click();
      paint();
    });

    const offerStress = () => {
      arranged = true;
      stress.hidden = false;
      paint();
      note.textContent = L(
        "Now tap the syllable that sounds strongest.",
        "Ahora toca la sílaba que suena más fuerte."
      );
      speak(round.word, { rate: 0.8 });
      fx.burst(window.innerWidth / 2, mixer.getBoundingClientRect().top + 40, {
        count: 16,
        colors: ["#075568", "#0f766e", "#e2b14a"],
      });
      window.setTimeout(
        () => stress.querySelector("[data-stress]")?.focus({ preventScroll: true }),
        400
      );
    };

    check.addEventListener("click", () => {
      if (arranged || order.length < total) return;
      const correct = order.every((value, i) => value === i);
      if (correct) {
        sound.correct(2);
        offerStress();
        return;
      }
      attempts += 1;
      sound.wrong();
      fx.shake(mixer);
      if (attempts >= 2) {
        order = Array.from({ length: total }, (_, i) => i);
        note.textContent = L(
          "Here it is in order. Now find the strong beat.",
          "Así va en orden. Ahora busca el golpe fuerte."
        );
        offerStress();
      } else {
        note.textContent = L(
          "Listen once more, then try a different order.",
          "Escucha otra vez y prueba otro orden."
        );
        speak(round.word, { rate: 0.8 });
      }
    });

    stress.querySelectorAll("[data-stress]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (judged) return;
        judged = true;
        const chosen = Number(btn.dataset.stress);
        const correct = chosen === round.stress;
        stress.querySelectorAll("[data-stress]").forEach((b) => {
          b.disabled = true;
          if (Number(b.dataset.stress) === round.stress) b.classList.add("is-correct");
        });
        if (!correct) btn.classList.add("is-wrong");

        const display = round.syllables
          .map((syllable, i) =>
            i === round.stress ? `<b>${esc(syllable)}</b>` : esc(syllable)
          )
          .join(" · ");

        shell.answer(correct, {
          firstTry: attempts === 0,
          points: attempts === 0 ? 100 : 70,
          tag: "syllable stress",
          title: correct
            ? L("You found the beat", "Encontraste el golpe")
            : L(`The beat is “${round.syllables[round.stress]}”`, `El golpe está en “${round.syllables[round.stress]}”`),
          body: `${esc(round.word)} · ${display} · <i>${esc(round.gloss)}</i>`,
          why: round.why,
        });
      });
    });

    paint();
  },
};
