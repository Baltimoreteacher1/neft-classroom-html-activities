// Phonics Path lesson player: Learn -> Build -> Decode -> Sort -> Spell -> Read -> Write -> Apply.
// It keeps foundational decoding evidence separate from language proficiency and official scores.
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, html, icon, safeJson, storage } from "../util.js";
import { READING_LESSONS, lessonById, phasesFor } from "./sequence.js";

const KEY = "accessPracticeLab:v1:sor";
const ALL_PHASES = [
  "model",
  "build",
  "read",
  "sort",
  "spell",
  "text",
  "dictation",
  "transfer",
  "complete",
];
const LABELS = {
  model: "Learn",
  build: "Build",
  read: "Decode",
  sort: "Sort",
  spell: "Spell",
  text: "Read",
  dictation: "Write",
  transfer: "Apply",
  complete: "Done",
};
const text = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const clean = (raw) => ({
  phase: ALL_PHASES.includes(raw?.phase) ? raw.phase : "model",
  placed: Array.isArray(raw?.placed)
    ? raw.placed.filter((x) => typeof x === "string").slice(0, 12)
    : [],
  sorted: Object.fromEntries(
    Object.entries(raw?.sorted && typeof raw.sorted === "object" ? raw.sorted : {})
      .filter(([w, b]) => /^[a-z]{1,20}$/.test(w) && (b === "a" || b === "b"))
      .slice(0, 10),
  ),
  choice: text(raw?.choice, 50),
  spelling: text(raw?.spelling, 50),
  explanation: text(raw?.explanation, 500),
  dictation: text(raw?.dictation, 120),
  transfer: text(raw?.transfer, 50),
  feedback: text(raw?.feedback, 250),
  attempts: Number.isInteger(raw?.attempts) ? Math.max(0, Math.min(raw.attempts, 99)) : 0,
  misses: Number.isInteger(raw?.misses) ? Math.max(0, Math.min(raw.misses, 99)) : 0,
  help: Boolean(raw?.help),
  doneAt: typeof raw?.doneAt === "string" ? raw.doneAt : "",
  updatedAt:
    typeof raw?.updatedAt === "string" && Number.isFinite(Date.parse(raw.updatedAt))
      ? raw.updatedAt
      : "",
});
export const loadReadingState = () => safeJson(storage.get(KEY), {}) || {};
const save = (all) => storage.set(KEY, JSON.stringify(all));
export const stateFor = (all, id) => clean(all[id]);
const update = (id, patch) => {
  const all = loadReadingState();
  all[id] = { ...stateFor(all, id), ...patch, updatedAt: new Date().toISOString() };
  save(all);
  return all[id];
};
const recordEvidence = (lesson, band, kind, stage, m) => {
  const ledger = loadLedger();
  appendEntry(ledger, {
    src: "phonics",
    task: lesson.id,
    band,
    domain: "Reading",
    use: "Foundational reading",
    kind,
    stage,
    supports: { hint: stage !== "independent" },
    m,
    confidence: null,
  });
  saveLedger(ledger);
};

export const lessonHref = (id, band) => `${BASE}/science-of-reading/lesson/${id}?grades=${band}`;
const pathHref = (band) => `${BASE}/science-of-reading/path?grades=${band}`;
const shown = (unit) => unit.replace("_", "…");
const unitHTML = (item) =>
  html`<div class="sor2-boxes" aria-label="${item.units.length} sound or word-part boxes">
    ${item.units.map((unit, i) => html`<span class="sor2-box"><b>${shown(unit)}</b><small>${item.sounds[i]}</small></span>`)}
  </div>`;
const blankBoxes = (item) =>
  html`<div class="sor2-boxes">
    ${item.sounds.map((sound) => html`<span class="sor2-box"><small>${sound}</small></span>`)}
  </div>`;
const hearButton = (say, label) =>
  html`<button type="button" class="btn sor2-hear" data-sor-say="${say}">
    ${icon("volume")} ${label}
  </button>`;
const stableOrder = (words) => [...words].sort((x, y) => hash(x) - hash(y));
const hash = (w) => [...w].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const stars = (misses) => (misses <= 1 ? 3 : misses <= 4 ? 2 : 1);
const collapse = (s) => s.trim().replace(/\s+/g, " ");
const plain = (s) =>
  collapse(s)
    .toLowerCase()
    .replace(/[^a-z' ]/g, "");

function cardsHTML(lesson) {
  return html`<ul class="sor2-cards" aria-label="Sounds and patterns in this lesson">
    ${lesson.cards.map((c) => html`<li class="sor2-card"><span class="sor2-pic" aria-hidden="true">${c.pic}</span><b class="sor2-g">${shown(c.g)}</b><span class="sor2-sound">${c.sound}</span><span class="sor2-key">${c.key}</span><button type="button" class="sor2-mini" data-sor-say="${c.key}" aria-label="Hear ${c.key}">${icon("volume")}</button></li>`)}
  </ul>`;
}

function sortHTML(lesson, s) {
  const { a, b } = lesson.sort;
  const pile = stableOrder([...a.words, ...b.words]).filter((w) => !s.sorted[w]);
  const bucket = (key, side) =>
    html`<section class="sor2-bucket" aria-label="${side.label} pile">
      <h3>${side.label}</h3>
      <p class="fine">${side.rule}</p>
      <ul>
        ${side.words.filter((w) => s.sorted[w] === key).map((w) => html`<li>${w}</li>`)}
      </ul>
    </section>`;
  return html`<section class="sor2-stage">
    <h2>Sort the words</h2>
    <p>Read each word. Tap the pile where it belongs. Listen for the pattern.</p>
    <div class="sor2-buckets">${bucket("a", a)}${bucket("b", b)}</div>
    ${
      pile.length
        ? html`<ul class="sor2-pile" aria-label="Words to sort">
            ${pile.map((w) => html`<li><b>${w}</b><button type="button" class="sor2-mini" data-sor-say="${w}" aria-label="Hear ${w}">${icon("volume")}</button><button type="button" class="btn" data-sor-sort="${w}:a">${a.label}</button><button type="button" class="btn" data-sor-sort="${w}:b">${b.label}</button></li>`)}
          </ul>`
        : html`<p class="sor2-win">Every word is in the right pile.</p>
            <button class="btn btn-primary" data-sor-next="spell">
              Spell a word ${icon("arrow-right")}
            </button>`
    }
  </section>`;
}

function completeHTML(lesson, s, band) {
  const after = lesson.next ? lessonById(lesson.next) : null;
  const unitDone = READING_LESSONS.filter((l) => l.unitId === lesson.unitId).every(
    (l) => stateFor(loadReadingState(), l.id).doneAt,
  );
  const n = stars(s.misses);
  return html`<section class="sor2-stage sor2-complete">
    <h2>Lesson complete</h2>
    <p class="sor2-stars" role="img" aria-label="${n} of 3 practice stars">
      ${[1, 2, 3].map((i) => html`<span class="${i <= n ? "is-on" : ""}" aria-hidden="true"></span>`)}
    </p>
    <p>
      You built, decoded, ${lesson.sort ? "sorted, " : ""}spelled, read,
      ${lesson.dictation ? "wrote, " : ""}and applied this pattern to a new word. Your practice
      record is saved on this device.
    </p>
    <p class="fine">
      Practice stars show how smoothly this lesson went. They are not a reading level or a score.
    </p>
    ${unitDone ? html`<p class="sor2-win"><strong>Unit complete:</strong> ${lesson.unit}.</p>` : ""}
    <div class="sor2-actions">
      ${after ? html`<a class="btn btn-primary" href="${lessonHref(after.id, band)}">Next: ${after.title} ${icon("arrow-right")}</a>` : html`<a class="btn btn-primary" href="${pathHref(band)}">Back to the Phonics Path</a>`}
      <button class="btn" data-sor-restart>Practice this lesson again</button>
      ${after ? html`<a class="btn" href="${pathHref(band)}">Phonics Path</a>` : ""}
    </div>
  </section>`;
}

export function readingLessonHTML(ctx, id) {
  const lesson = lessonById(id);
  if (!lesson) return null;
  const band = ctx.band;
  const s = stateFor(loadReadingState(), id);
  const phases = phasesFor(lesson);
  const at = Math.max(0, phases.indexOf(s.phase));
  const phase = phases[at];
  const next = phases[at + 1];
  return {
    title: `${lesson.title} · Phonics Path`,
    html: html`<main class="sor2-shell" data-sor-lesson="${id}">
      <a href="${pathHref(band)}">${icon("arrow-left")} Phonics Path</a>
      <p class="eyebrow">
        ${lesson.levelTitle} · ${lesson.unit} · Lesson ${lesson.n} of ${READING_LESSONS.length}
      </p>
      <h1>${lesson.title}</h1>
      <p class="lead">${lesson.objective}</p>
      <ol class="sor2-progress" aria-label="Lesson progress">
        ${phases.slice(0, -1).map((p, i) => html`<li class="${i === at ? "is-current" : ""} ${i < at ? "is-done" : ""}" ${i === at ? "aria-current=step" : ""}>${LABELS[p]}</li>`)}
      </ol>
      ${
        phase === "model"
          ? html`<section class="sor2-stage">
              <h2>Review and learn</h2>
              <p>What you may already know: ${lesson.prerequisites.join("; ")}.</p>
              ${cardsHTML(lesson)}
              <p class="sor2-model">${lesson.model}</p>
              ${unitHTML(lesson.example)}
              <p>
                <strong>${lesson.example.word}</strong> means ${lesson.example.meaning}.
                ${hearButton(lesson.example.word, "Hear the word")}
              </p>
              ${lesson.trick?.length ? html`<p class="sor2-trick"><strong>Heart words:</strong> ${lesson.trick.map((w) => html`<button type="button" class="sor2-chip" data-sor-say="${w}" aria-label="Hear ${w}">${w} ${icon("volume")}</button>`)}<span class="fine"> These words do not follow the pattern yet. Learn them by heart.</span></p>` : ""}
              <p class="fine">
                The boxes show the sound units for this lesson. Use the speaker buttons to hear
                whole words.
              </p>
              <button class="btn btn-primary" data-sor-next="${next}">
                Build a word ${icon("arrow-right")}
              </button>
            </section>`
          : ""
      }
      ${
        phase === "build"
          ? html`<section class="sor2-stage">
              <h2>Build with sound boxes</h2>
              <p>
                Build the word that means <strong>${lesson.build.meaning}</strong>. Put one grapheme
                in each box. A pattern such as <b>${shown(lesson.cards[0].g)}</b> goes in one box.
                ${hearButton(lesson.build.word, "Hear the word")}
              </p>
              <div class="sor2-boxes">
                ${lesson.build.units.map((_, i) => html`<span class="sor2-box">${s.placed[i]?.split(":")[1] ? shown(s.placed[i].split(":")[1]) : "?"}</span>`)}
              </div>
              <div class="sor2-tiles" role="group" aria-label="Grapheme tiles">
                ${lesson.build.tiles.map((tile, i) => html`<button type="button" data-sor-tile="${tile}" data-sor-tile-index="${i}" ${s.placed.includes(`${i}:${tile}`) ? "disabled" : ""}>${shown(tile)}</button>`)}
              </div>
              <div class="sor2-actions">
                <button class="btn" data-sor-undo>Remove last tile</button
                ><button class="btn btn-primary" data-sor-check="build">Check my word</button>
              </div>
            </section>`
          : ""
      }
      ${
        phase === "read"
          ? html`<section class="sor2-stage">
              <h2>Decode a new word</h2>
              <p>
                Read each sound unit, then blend. Choose the word that means
                <strong>${lesson.read.meaning}</strong>.
              </p>
              ${blankBoxes(lesson.read)}
              <div class="sor2-tiles" role="group" aria-label="Choose a word">
                ${lesson.read.choices.map((word) => html`<button type="button" data-sor-choice="${word}" aria-pressed="${s.choice === word}">${word}</button>`)}
              </div>
              <button class="btn btn-primary" data-sor-check="read">Check my reading</button>
            </section>`
          : ""
      }
      ${phase === "sort" ? sortHTML(lesson, s) : ""}
      ${
        phase === "spell"
          ? html`<section class="sor2-stage">
              <h2>Spell from meaning and sounds</h2>
              <p>
                Spell the word that means <strong>${lesson.spell.meaning}</strong>. Tap each sound
                box, then write the full spelling. ${hearButton(lesson.spell.word, "Hear the word")}
              </p>
              ${blankBoxes(lesson.spell)}
              <label
                >Write the word
                <input
                  data-sor-input="spelling"
                  value="${s.spelling}"
                  autocomplete="off"
                  autocapitalize="none"
                  spellcheck="false" /></label
              ><button class="btn btn-primary" data-sor-check="spell">Check spelling</button>
            </section>`
          : ""
      }
      ${
        phase === "text"
          ? html`<section class="sor2-stage">
              <h2>Read connected text</h2>
              <p>Read the passage yourself first. Then answer in a sentence. You may reread it.</p>
              <p class="sor2-passage">${lesson.passage}</p>
              ${lesson.exceptions.length ? html`<p class="fine">Teacher note: preview these words as needed: ${lesson.exceptions.join(", ")}.</p>` : ""}
              <label
                >${lesson.question}<textarea data-sor-input="explanation" rows="3">
${s.explanation}</textarea>
              </label>
              <button class="btn btn-primary" data-sor-check="text">Review my explanation</button>
            </section>`
          : ""
      }
      ${
        phase === "dictation"
          ? html`<section class="sor2-stage">
              <h2>Write the sentence</h2>
              <p>
                Listen, say it again in your head, then write it. Start with a capital letter and
                finish with an end mark.
                ${hearButton(lesson.dictation.sentence, "Hear the sentence")}
              </p>
              <label
                >Your sentence
                <input
                  data-sor-input="dictation"
                  value="${s.dictation}"
                  autocomplete="off"
                  autocapitalize="sentences"
                  spellcheck="false" /></label
              ><button class="btn btn-primary" data-sor-check="dictation">Check my sentence</button>
            </section>`
          : ""
      }
      ${
        phase === "transfer"
          ? html`<section class="sor2-stage">
              <h2>Try a new word independently</h2>
              <p>
                Spell the word that means <strong>${lesson.transfer.meaning}</strong>. This word has
                not appeared in the guided practice.
              </p>
              ${blankBoxes(lesson.transfer)}
              <label
                >New word
                <input
                  data-sor-input="transfer"
                  value="${s.transfer}"
                  autocomplete="off"
                  autocapitalize="none"
                  spellcheck="false" /></label
              ><button class="btn btn-primary" data-sor-check="transfer">
                Check independent word
              </button>
            </section>`
          : ""
      }
      ${phase === "complete" ? completeHTML(lesson, s, band) : ""}
      ${s.feedback ? html`<p class="sor2-feedback" role="status">${s.feedback}</p>` : ""}
      <p class="disclaimer">
        This activity records observed practice, not a reading level or official assessment score. A
        teacher should review connected-text responses.
      </p>
    </main>`,
  };
}

const FIELDS = {
  spelling: "spelling",
  explanation: "explanation",
  dictation: "dictation",
  transfer: "transfer",
};
const MISS = {
  build: (l) =>
    `Look at the model: one sound unit belongs in each box. Check the ${l.build.units.length} sounds and change a tile.`,
  read: () =>
    "Blend the sound units from left to right. Compare each choice with the meaning clue, then try again.",
  text: () =>
    "Write a complete sentence that answers the question. Then reread the passage and revise.",
  dictation: (l, value) =>
    plain(value) === plain(l.dictation.sentence)
      ? "Your words are right. Check the capital letter at the start and the end mark."
      : "Listen again. Say the sentence slowly and write one word at a time. Check each spelling.",
  default: () =>
    "Compare each sound box with your spelling. Change the part that does not match, then try again.",
};
const GOOD = {
  text: "You wrote an explanation. A teacher can review whether it uses the passage accurately. Keep going.",
  transfer:
    "The new spelling matches the taught pattern. Review any earlier errors, then choose your next lesson.",
  default: "That matches the sounds and meaning. Move to the next task.",
};

function answerFor(phase, lesson, s) {
  if (phase === "build")
    return [s.placed.map((p) => p.split(":")[1]).join(""), lesson.build.units.join("")];
  if (phase === "read") return [s.choice, lesson.read.word];
  if (phase === "spell") return [s.spelling.trim().toLowerCase(), lesson.spell.word];
  if (phase === "transfer") return [s.transfer.trim().toLowerCase(), lesson.transfer.word];
  if (phase === "dictation") return [collapse(s.dictation), lesson.dictation.sentence];
  return [s.explanation.trim(), null];
}

export function mountReadingLesson(root, ctx) {
  const host = root.querySelector("[data-sor-lesson]");
  if (!host) return;
  const lesson = lessonById(host.dataset.sorLesson);
  const id = lesson.id;
  const phases = phasesFor(lesson);
  const say = (words) => speak(words, { rate: ctx.prefs?.rate || 0.8 });
  host.addEventListener("input", (event) => {
    const field = FIELDS[event.target?.dataset?.sorInput];
    if (field) update(id, { [field]: event.target.value });
  });
  host.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.sorSay) return void say(button.dataset.sorSay);
    stopSpeech();
    const s = stateFor(loadReadingState(), id);
    if (button.dataset.sorNext)
      update(id, { phase: button.dataset.sorNext, attempts: 0, feedback: "" });
    else if (button.dataset.sorTile) {
      if (s.placed.length < lesson.build.units.length)
        update(id, {
          placed: [...s.placed, `${button.dataset.sorTileIndex}:${button.dataset.sorTile}`],
          feedback: "",
        });
    } else if (button.hasAttribute("data-sor-undo"))
      update(id, { placed: s.placed.slice(0, -1), feedback: "" });
    else if (button.dataset.sorChoice)
      update(id, { choice: button.dataset.sorChoice, feedback: "" });
    else if (button.hasAttribute("data-sor-restart"))
      update(id, {
        phase: "model",
        placed: [],
        sorted: {},
        choice: "",
        spelling: "",
        explanation: "",
        dictation: "",
        transfer: "",
        attempts: 0,
        misses: 0,
        feedback: "",
      });
    else if (button.dataset.sorSort) {
      const [word, bucket] = button.dataset.sorSort.split(":");
      if (lesson.sort[bucket]?.words.includes(word)) {
        const sorted = { ...s.sorted, [word]: bucket };
        const done = [...lesson.sort.a.words, ...lesson.sort.b.words].every((w) => sorted[w]);
        if (done)
          recordEvidence(lesson, ctx.band, s.attempts ? "retry" : "first", "guided", {
            skill: "sort",
            correct: true,
            attempts: s.attempts + 1,
          });
        update(id, {
          sorted,
          feedback: done ? "" : `Yes. ${word} goes with ${lesson.sort[bucket].label}.`,
        });
        say(word);
      } else
        update(id, {
          attempts: s.attempts + 1,
          misses: s.misses + 1,
          feedback: `Not that pile. Say ${word} slowly and listen for the pattern, then try the other pile.`,
        });
    } else if (button.dataset.sorCheck) {
      const phase = button.dataset.sorCheck;
      const [value, expected] = answerFor(phase, lesson, s);
      const correct = phase === "text" ? value.split(/\s+/).length >= 4 : value === expected;
      const attempts = s.attempts + 1;
      const kind = phase === "transfer" ? "transfer" : attempts > 1 ? "retry" : "first";
      if (phase !== "text")
        recordEvidence(lesson, ctx.band, kind, phase === "transfer" ? "independent" : "guided", {
          skill: phase,
          correct,
          attempts,
        });
      if (!correct)
        update(id, {
          attempts,
          misses: s.misses + 1,
          feedback: (MISS[phase] || MISS.default)(lesson, value),
        });
      else {
        if (phase === "text")
          recordEvidence(lesson, ctx.band, "first", "guided", {
            skill: "comprehension-response",
            words: value.split(/\s+/).length,
            teacherReview: true,
          });
        if (expected && phase !== "dictation") say(expected);
        update(id, {
          phase: phases[phases.indexOf(phase) + 1],
          attempts: 0,
          feedback: GOOD[phase] || GOOD.default,
          ...(phase === "transfer" ? { doneAt: new Date().toISOString() } : {}),
        });
      }
    } else return;
    ctx.rerender();
  });
}
