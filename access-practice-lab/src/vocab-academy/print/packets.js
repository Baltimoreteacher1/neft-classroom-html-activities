// Vocabulary Academy print: the stand-alone packets (review, assessment forms, answer key, word list and cards).
import { rngFor } from "../rng.js";
import { buildMatch } from "./items.js";
import {
  bubble,
  checkBox,
  choiceList,
  clozeText,
  keyNote,
  POS_NAME,
  readToMe,
  ruled,
  sceneTile,
  sheet,
  sheetTitle,
  subTitle,
  writingBox,
} from "./kit.js";
import { boldWords, DISCLAIMER, gradeLabel, html, wordForms } from "./shared.js";

// ---- review packet ------------------------------------------------------------------------------------------------
/** Items for the review packet: earlier words (unit.review, resolved by the caller) first, then this unit's words. */
export function buildReviewItems(unit, reviewWords, itemsOfUnit) {
  const rng = (tag) => rngFor(`${unit.id}:review:${tag}`);
  const earlier = (reviewWords ?? []).filter((w) => w?.def);
  const pool = earlier.length ? earlier : unit.words;
  const match = buildMatch(pool, rng("match"), { max: 6 });
  const clozeWords = pool.filter((w) => w.cloze).slice(0, 6);
  const cloze = {
    bank: rng("bank").shuffle(clozeWords.map((w) => w.cloze.f)),
    items: clozeWords.map((w, i) => ({
      n: i + 1,
      wordId: w.id,
      s: w.cloze.s,
      key: { answer: w.cloze.f },
    })),
  };
  return {
    hasEarlier: earlier.length > 0,
    earlier,
    match,
    cloze,
    best: itemsOfUnit.best.slice(0, 6),
  };
}

export function reviewSheets(c) {
  const { unit: u, teacher, info, review: r } = c;
  const lead = r.hasEarlier
    ? `Words from earlier lessons, then words from Lesson ${u.n}.`
    : `Lesson ${u.n} is the first lesson in this grade, so every word here is from this lesson.`;
  const words = r.hasEarlier ? r.earlier : u.words;
  return [
    sheet(
      "review-cover",
      "Review packet opener",
      html`<header class="vap-cover-head">
          <p class="vap-eyebrow">${gradeLabel(u.grade)} · Lesson ${u.n} · Review Packet</p>
          <h1>${u.title}: Review</h1>
          <p class="vap-theme">${lead}</p>
        </header>
        <section class="vap-glance" aria-label="Words in this review">
          <h2>${r.hasEarlier ? "Words to remember" : "Words to review"}</h2>
          <ul class="vap-chips">
            ${words.map((w) => html`<li><strong>${w.hw}</strong><span class="vap-pos">${POS_NAME[w.pos] ?? w.pos}</span></li>`)}
          </ul>
        </section>
        <p class="vap-belongs">
          Name <span class="vap-fillin" role="img" aria-label="write your name"></span>
        </p>
        <p class="vap-fine">${DISCLAIMER.en}</p>`,
    ),
    sheet(
      "review-1",
      "Remember the meanings",
      html`${sheetTitle("Part 1", "Remember the meanings", "Match each word to its meaning. Write the letter.")}
        ${info.early ? readToMe("Read to me: say each word, then read each meaning.") : ""}
        <div class="vap-match is-defs">
          <ol class="vap-match-words" role="list">
            ${r.match.terms.map((t) => html`<li><span class="vap-n">${t.n}</span><strong>${t.hw}</strong>${teacher ? html`<span class="vap-fill">${t.key.letter}</span>` : html`<span class="vap-line is-short"></span>`}</li>`)}
          </ol>
          <ol class="vap-match-defs" role="list">
            ${r.match.defs.map((d) => html`<li>${bubble(d.letter)}<span>${d.def}</span></li>`)}
          </ol>
        </div>
        ${
          r.cloze.items.length
            ? html`<section class="vap-block" aria-label="Fill in the blank">
                ${subTitle("B", "Use the clue", "Choose a word from the bank for each sentence.")}
                <div class="vap-bank" role="group" aria-label="Word bank">
                  <strong>Word bank</strong>
                  <ul>
                    ${r.cloze.bank.map((b) => html`<li>${b}</li>`)}
                  </ul>
                </div>
                <ol class="vap-qs" role="list">
                  ${r.cloze.items.map(
                    (it) =>
                      html`<li class="vap-q">
                        <span class="vap-n">${it.n}</span>
                        <div><p>${clozeText(it.s, teacher ? it.key?.answer : "")}</p></div>
                      </li>`,
                  )}
                </ol>
              </section>`
            : ""
        }`,
    ),
    sheet(
      "review-2",
      "Words from this lesson",
      html`${sheetTitle("Part 2", `Words from Lesson ${u.n}`, "Circle the letter of the word that fits best.")}
        <ol class="vap-qs" role="list">
          ${r.best.map(
            (it) =>
              html`<li class="vap-q">
                <span class="vap-n">${it.n}</span>
                <div>
                  <p>${clozeText(it.s, teacher ? it.key?.answer : "")}</p>
                  ${choiceList(info.letters, it.choices, { rightIndex: teacher ? it.key?.index : -1, wide: true })}
                </div>
              </li>`,
          )}
        </ol>
        <section class="vap-block" aria-label="Connect the words">
          ${subTitle("C", "Connect the words", "Write one sentence that uses a word from the first page and a word from this page.")}${info.early ? ruled(2, { guide: true }) : info.band === "upper-elem" ? ruled(3) : writingBox(5)}
        </section>`,
    ),
  ];
}

// ---- assessment forms ---------------------------------------------------------------------------------------------
const PART_TITLE = {
  part1: [
    "Part 1",
    "Choose the word that fits",
    "Circle the letter of the word that best completes the sentence.",
  ],
  part2: [
    "Part 2",
    "Is the word used correctly?",
    "Circle one. If a word is used incorrectly, the sentence does not make sense.",
  ],
  part3: ["Part 3", "What does it mean?", "Circle the letter of the best answer."],
  part4: [
    "Part 4",
    "Write your answer",
    "Answer in your own words. Use the words named in the prompt.",
  ],
};

function formSheet(c, f) {
  const { unit: u, info, teacher } = c;
  const form = f;
  const forms = u.words.flatMap(wordForms);
  const yes = info.early ? "Makes sense" : "Correct";
  const no = info.early ? "Does not make sense" : "Incorrect";
  const names = (ids) => ids.map((id) => u.words.find((w) => w.id === id)?.hw).filter(Boolean);
  return sheet(
    `assess-${form.form}`,
    `Form ${form.form}`,
    html`<header class="vap-assess-head">
        <p class="vap-eyebrow">
          ${gradeLabel(u.grade)} · Lesson ${u.n} · Vocabulary Check · Form ${form.form}
        </p>
        <h2>${u.title}: Vocabulary Check <span class="vap-formtag">Form ${form.form}</span></h2>
        <p class="vap-name-big">
          Name <span class="vap-fillin" role="img" aria-label="write your name"></span> Date
          <span class="vap-fillin is-short" role="img" aria-label="write the date"></span>
        </p>
        <p class="vap-lead">
          ${info.early ? "A grown-up reads each question aloud. Listen, then circle your answer." : "Read each question carefully. Circle one answer for each, then write in Part 4."}
          There are ${form.total} questions.
        </p>
      </header>
      <section class="vap-block" aria-label="Part 1">
        ${subTitle(...(PART_TITLE.part1.slice(1).length ? ["1", PART_TITLE.part1[1], PART_TITLE.part1[2]] : []))}
        <ol class="vap-qs" role="list">
          ${form.parts.part1.map(
            (it) =>
              html`<li class="vap-q">
                <span class="vap-n">${it.q}</span>
                <div>
                  <p>${clozeText(it.s)}</p>
                  ${choiceList(info.letters, it.choices, { wide: true })}
                </div>
              </li>`,
          )}
        </ol>
      </section>
      <section class="vap-block" aria-label="Part 2">
        ${subTitle("2", PART_TITLE.part2[1], PART_TITLE.part2[2])}
        <ol class="vap-qs" role="list">
          ${form.parts.part2.map(
            (it) =>
              html`<li class="vap-q">
                <span class="vap-n">${it.q}</span>
                <div>
                  <p><b class="vap-wordtag">${it.hw}:</b> ${boldWords(it.s, forms)}</p>
                  <span class="vap-verdict" role="group" aria-label="Choose one"
                    >${bubble("✓")}<span>${yes}</span> ${bubble("✗")}<span>${no}</span></span
                  >
                </div>
              </li>`,
          )}
        </ol>
      </section>
      <section class="vap-block" aria-label="Part 3">
        ${subTitle("3", PART_TITLE.part3[1], PART_TITLE.part3[2])}
        <ol class="vap-qs" role="list">
          ${form.parts.part3.map(
            (it) =>
              html`<li class="vap-q">
                <span class="vap-n">${it.q}</span>
                <div>
                  <p>
                    ${it.mode === "word-to-meaning" ? html`What does <b class="vap-wordtag">${it.prompt}</b> mean?` : html`Which word means “${it.prompt}”?`}
                  </p>
                  ${choiceList(info.letters, it.choices, { wide: true })}
                </div>
              </li>`,
          )}
        </ol>
      </section>
      ${
        form.parts.part4
          ? html`<section class="vap-block" aria-label="Part 4">
              ${subTitle("4", PART_TITLE.part4[1], PART_TITLE.part4[2])}
              <div class="vap-q">
                <span class="vap-n">${form.parts.part4.q}</span>
                <div>
                  <p>${form.parts.part4.prompt}</p>
                  ${form.parts.part4.wordIds?.length ? html`<p class="vap-starter"><b>Use:</b> ${names(form.parts.part4.wordIds).join(" and ")}</p>` : ""}${info.early ? ruled(3, { guide: true }) : info.band === "upper-elem" ? ruled(5) : writingBox(7)}
                </div>
              </div>
            </section>`
          : ""
      }
      ${teacher ? "" : html`<p class="vap-fine">Score: <span class="vap-fillin is-short" role="img" aria-label="score"></span> out of ${form.total}</p>`}`,
  );
}

/** Both assessment forms. Student contexts carry key-stripped forms (render.js), so a form sheet cannot print an answer. */
export function assessmentSheets(c) {
  return [formSheet(c, c.forms.A), formSheet(c, c.forms.B)];
}

// ---- answer key ---------------------------------------------------------------------------------------------------
const letterOf = (info, i) => info.letters[i] ?? String(i + 1);

function keyTable(c, form) {
  const { unit: u, info } = c;
  const hw = (id) => u.words.find((w) => w.id === id)?.hw ?? "";
  const rows = [];
  for (const it of form.parts.part1)
    rows.push([
      it.q,
      "Fill in",
      hw(it.wordId),
      `${letterOf(info, it.key.index)}. ${it.key.answer}`,
      it.key.why,
    ]);
  for (const it of form.parts.part2)
    rows.push([
      it.q,
      "Correct use?",
      hw(it.wordId),
      it.key.wrong ? "✗ Incorrect" : "✓ Correct",
      it.key.why,
    ]);
  for (const it of form.parts.part3)
    rows.push([
      it.q,
      "Meaning",
      hw(it.wordId),
      `${letterOf(info, it.key.index)}. ${it.key.answer}`,
      it.key.why,
    ]);
  return html`<table class="vap-table is-key">
    <caption>
      Form ${form.form} answers (${form.total} questions)
    </caption>
    <thead>
      <tr>
        <th scope="col">No.</th>
        <th scope="col">Skill</th>
        <th scope="col">Word</th>
        <th scope="col">Answer</th>
        <th scope="col">Why</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(
        (r) =>
          html`<tr>
            <th scope="row">${r[0]}</th>
            <td>${r[1]}</td>
            <td>${r[2]}</td>
            <td><b>${r[3]}</b></td>
            <td>${r[4]}</td>
          </tr>`,
      )}
    </tbody>
  </table>`;
}

export function keySheets(c) {
  const forms = c.forms;
  const { unit: u } = c;
  const total = (f) => f.total - (f.parts.part4 ? 1 : 0) + (f.parts.part4?.key.look?.length ?? 0);
  return Object.values(forms).map((form, i) =>
    sheet(
      `key-${form.form}`,
      `Answer key, Form ${form.form}`,
      html`${
          i === 0
            ? html`<header class="vap-cover-head is-compact">
                <p class="vap-eyebrow">
                  ${gradeLabel(u.grade)} · Lesson ${u.n} · Assessment Answer Key
                </p>
                <h1>${u.title}: Answer Key</h1>
                <p class="vap-theme">
                  Teacher use only. Forms A and B test the same words with the same three question
                  types in the same order, using different sentences.
                </p>
              </header>`
            : ""
        }
        <h2 class="vap-keyhead">Form ${form.form}</h2>
        ${keyTable(c, form)}
        ${
          form.parts.part4
            ? html`<section class="vap-block" aria-label="Part 4 scoring">
                <h3>Question ${form.parts.part4.q}: written response</h3>
                <p><em>${form.parts.part4.prompt}</em></p>
                <p><b>Look for</b> (suggested scoring: 1 point for each):</p>
                <ul class="vap-checklist">
                  ${form.parts.part4.key.look.map((l) => html`<li>${checkBox()}<span>${l}</span></li>`)}
                </ul>
                ${keyNote("Sample strong response", form.parts.part4.key.model || "No sample response is written for this prompt.")}
              </section>`
            : ""
        }
        <p class="vap-fine">
          <b>Suggested total for Form ${form.form}:</b> ${total(form)} points (1 point for each of
          questions 1–${form.total - (form.parts.part4 ? 1 : 0)}, plus the look-fors above). Adjust
          to your own scoring policy.
        </p>`,
    ),
  );
}

// ---- word list and cards ------------------------------------------------------------------------------------------
export function wordsSheets(c) {
  const { unit: u, supports, info } = c;
  const es = supports.glossaryEs;
  const table = html`<table class="vap-table is-words">
    <caption>
      ${u.title}: word list
    </caption>
    <thead>
      <tr>
        <th scope="col">Word</th>
        <th scope="col">Meaning</th>
        <th scope="col">Example</th>
        ${es ? html`<th scope="col">Español</th>` : ""}
      </tr>
    </thead>
    <tbody>
      ${u.words.map(
        (w) =>
          html`<tr>
            <th scope="row">
              <strong>${w.hw}</strong><small>${POS_NAME[w.pos] ?? w.pos} · ${w.pron}</small>
            </th>
            <td>${w.def}</td>
            <td>${boldWords(w.ex, wordForms(w))}</td>
            ${es ? html`<td lang="es">${w.es?.gloss ?? ""}</td>` : ""}
          </tr>`,
      )}
    </tbody>
  </table>`;
  const cards = html`<div class="vap-foldcards">
    ${u.words.map(
      (w) =>
        html`<article class="vap-foldcard" aria-label="${w.hw}">
          <div class="vap-fc-front">
            <h3>${w.hw}</h3>
            <p class="vap-pron">${w.pron}</p>
            ${supports.picture ? sceneTile(w, { size: info.early ? "lg" : "md" }) : ""}
          </div>
          <div class="vap-fc-back">
            <p class="vap-pos">${POS_NAME[w.pos] ?? w.pos}</p>
            <p class="vap-def">${w.def}</p>
            <p class="vap-ex">${boldWords(w.ex, wordForms(w))}</p>
            ${es && w.es?.gloss ? html`<p class="vap-es" lang="es">${w.es.gloss}</p>` : ""}
          </div>
        </article>`,
    )}
  </div>`;
  return [
    sheet(
      "words-list",
      "Word list",
      html`${sheetTitle("Word list", `${u.title}`, `${gradeLabel(u.grade)} · Lesson ${u.n} · Theme: ${u.theme}`)}${table}`,
    ),
    sheet(
      "words-cards",
      "Word cards",
      html`${sheetTitle("Word cards", "Cut out and fold the cards", "Cut along the dotted lines. Fold each card on the middle line so the word is on one side and the meaning is on the other. Use them to quiz a partner.")}${cards}`,
    ),
  ];
}
