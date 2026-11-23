// Vocabulary Academy print: workbook sheets 5-10 (relationships, word parts, reading, writing, application, review).
import {
  bubble,
  checkBox,
  choiceList,
  drawBox,
  glyphTile,
  keyNote,
  readToMe,
  ruled,
  sceneTile,
  sheet,
  sheetTitle,
  subTitle,
  writingBox,
} from "./kit.js";
import { boldWords, html, wordForms } from "./shared.js";

const wordsMentioned = (c, text) =>
  c.unit.words.filter((w) => wordForms(w).some((f) => new RegExp(`\\b${f}\\b`, "i").test(text)));

/** Teaching notes (from teacher.notes) for the unit words a prompt mentions. Teacher contexts only. */
const notes = (c, hit) => {
  const text = hit.map((w) => c.unit.teacher?.notes?.[w.id]).filter(Boolean).join(" ");
  return text ? keyNote("Teaching note", text) : "";
};

// ---- 4. word relationships ----------------------------------------------------------------------------------------
function sortBlock(c) {
  const { items, teacher } = c;
  if (!items.sort.groups.length) return "";
  return html`<section class="vap-block" aria-label="Sort the words">
    ${subTitle("A", "Sort the words", "Write each word from the box in the group where it belongs.")}
    <div class="vap-bank" role="group" aria-label="Words to sort">
      <strong>Words</strong>
      <ul>
        ${items.sort.pool.map((p) => html`<li>${p}</li>`)}
      </ul>
    </div>
    <div class="vap-bins" data-count="${items.sort.groups.length}">
      ${items.sort.groups.map(
        (g) =>
          html`<section class="vap-bin" aria-label="${g.label}">
            <h4>${g.label}</h4>
            ${teacher ? html`<p class="vap-fill-list">${g.key.words.join(", ")}</p>` : ruled(Math.max(3, Math.min(5, items.sort.pool.length >> 1)), { label: "Write the words here" })}
          </section>`,
      )}
    </div>
  </section>`;
}

function ladderBlock(c) {
  const { items, teacher } = c;
  if (!items.ladders.length) return "";
  return html`${items.ladders.map(
    (l, i) => html`<section class="vap-block" aria-label="Shades of meaning">
      ${subTitle(i ? "" : "B", "Shades of meaning", `Put the words in order from least to most: \u201c${l.label}\u201d. Write one word on each step.`)}
      <div class="vap-bank" role="group" aria-label="Words to order"><strong>Words</strong><ul>${l.words.map((p) => html`<li>${p}</li>`)}</ul></div>
      <ol class="vap-ladder" role="list" aria-label="Steps, first (least) to last (most)">${l.words.map(
        (_, k) => html`<li style="--step:${k}"><span class="vap-stepno" aria-hidden="true">${k + 1}</span>${teacher ? html`<span class="vap-fill">${l.key.order[k]}</span>` : html`<span class="vap-line"></span>`}</li>`,
      )}</ol>
    </section>`,
  )}`;
}

function analogyBlock(c) {
  const { items, teacher, info } = c;
  if (!items.analogies.length) return "";
  return html`<section class="vap-block" aria-label="Analogies">
    ${subTitle("C", "Word pairs (analogies)", "Think how the first two words are connected. Circle the pair connected the same way.")}
    <ol class="vap-qs" role="list">
      ${items.analogies.map(
        (a, i) =>
          html`<li class="vap-q">
            <span class="vap-n">${i + 1}</span>
            <div>
              <p class="vap-stem"><b>${a.stem}</b></p>
              ${choiceList(info.letters, a.choices, { rightIndex: teacher ? a.key?.index : -1, wide: true })}${teacher ? keyNote("Relationship", html`${a.relation}${a.source === "unit" ? "" : html` (built from the unit's synonym and antonym data)`}`) : ""}
            </div>
          </li>`,
      )}
    </ol>
  </section>`;
}

function pictureBlock(c) {
  const { items, teacher } = c;
  const pm = items.pictureMatch;
  if (!pm.words.length) return "";
  return html`<section class="vap-block" aria-label="Match the word to the picture">
    ${subTitle("B", "Match each word to its picture", "Write the picture letter next to the word.")}
    ${readToMe("Read to me: say each word, then find its picture.")}
    <div class="vap-match">
      <ol class="vap-match-words" role="list">
        ${pm.words.map((w) => html`<li><span class="vap-n">${w.n}</span><strong>${w.hw}</strong>${teacher ? html`<span class="vap-fill">${w.key.letter}</span>` : html`<span class="vap-line is-short"></span>`}</li>`)}
      </ol>
      <ul class="vap-match-tiles" role="list">
        ${pm.tiles.map((t) => html`<li>${glyphTile(t.glyphs, t.alt, t.letter)}</li>`)}
      </ul>
    </div>
  </section>`;
}

export function relations(c) {
  const { info } = c;
  return sheet(
    "relations",
    "Word relationships",
    html`${sheetTitle("Part 4", "How words connect", info.early ? "Words belong in groups. Find the groups." : "Words connect in groups, in steps, and in pairs.")}
    ${sortBlock(c)}${info.early ? pictureBlock(c) : ladderBlock(c)}${info.early ? ladderBlock(c) : analogyBlock(c)}`,
  );
}

// ---- 5. word parts ------------------------------------------------------------------------------------------------
export function morphology(c) {
  const { unit: u, items, teacher, info } = c;
  const study = u.study;
  const parts = study?.parts ?? [];
  const reference = parts.length
    ? html`<table class="vap-table">
        <caption>
          ${study.focus && study.focus !== "none" ? `Word parts: ${study.focus}` : "Word parts"}
        </caption>
        <thead>
          <tr>
            <th scope="col">Word part</th>
            <th scope="col">What it means</th>
            <th scope="col">Words that use it</th>
          </tr>
        </thead>
        <tbody>
          ${parts.map(
            (p) =>
              html`<tr>
                <th scope="row">${p.p}</th>
                <td>${p.m}</td>
                <td>${(p.ex ?? []).join(", ")}</td>
              </tr>`,
          )}
        </tbody>
      </table>`
    : "";
  const letters = parts.length ? ["B", "C"] : ["A", "B"];
  const grid = items.morph.length
    ? html`<section class="vap-block" aria-label="Build the word">
        ${subTitle(letters[0], "Build the word", "Put the base word and the word part together. Watch for spelling changes. Write the new word.")}
        <table class="vap-table is-grid">
          <caption>
            Build-a-word grid
          </caption>
          <thead>
            <tr>
              <th scope="col">Base word</th>
              <th scope="col">Word part</th>
              <th scope="col">The new word</th>
            </tr>
          </thead>
          <tbody>
            ${items.morph.map(
              (r) =>
                html`<tr>
                  <td><b>${r.base}</b><small>${r.baseMeaning}</small></td>
                  <td><b>${r.part}</b><small>${r.partMeaning}</small></td>
                  <td class="vap-cell-write">
                    ${teacher ? html`<span class="vap-fill">${r.key.word}</span>${r.note ? html`<small>${r.note}</small>` : ""}` : ""}
                  </td>
                </tr>`,
            )}
          </tbody>
        </table>
      </section>`
    : html`<section class="vap-block" aria-label="Word families">
        ${subTitle(letters[0], "Word families", "These words are related. Circle the part of each family word that is the same.")}
        <table class="vap-table">
          <caption>
            Word families
          </caption>
          <thead>
            <tr>
              <th scope="col">Lesson word</th>
              <th scope="col">Family words</th>
            </tr>
          </thead>
          <tbody>
            ${u.words
              .filter((w) => w.family?.length)
              .map(
                (w) =>
                  html`<tr>
                    <th scope="row">${w.hw}</th>
                    <td>${w.family.map((f) => f.w).join(", ")}</td>
                  </tr>`,
              )}
          </tbody>
        </table>
      </section>`;
  return sheet(
    "morphology",
    "Word parts",
    html`${sheetTitle("Part 5", "Look inside words", info.early ? "Many words have parts. Parts help us read and understand." : "Word parts are clues. Use them to work out new words.")}
      ${parts.length ? html`<section class="vap-block" aria-label="Word parts reference">${subTitle("A", "Learn the parts")}${reference}</section>` : ""}
      ${grid}
      ${study?.task ? html`<section class="vap-block" aria-label="Word parts task">${subTitle(letters[1], "Try it", study.task)}${info.early ? html`${readToMe("Tell a grown-up your answer first.")}${ruled(2, { guide: true })}` : ruled(5)}</section>` : ""}`,
  );
}

// ---- 6. reading ---------------------------------------------------------------------------------------------------
const GENRE = {
  narrative: "Story",
  informational: "Informational text",
  dialogue: "Dialogue",
  argument: "Argument",
  science: "Science text",
  history: "History text",
  biography: "Biography",
  description: "Description",
  poem: "Poem",
};
const SKILL = {
  "word-meaning": "Word meaning",
  context: "Context clues",
  inference: "Inference",
  evidence: "Evidence",
  "main-idea": "Main idea",
};

export function reading(c) {
  const { unit: u, teacher, info } = c;
  const p = u.passage;
  if (!p) return "";
  const inPassage = (p.words ?? []).map((id) => u.words.find((w) => w.id === id)).filter(Boolean);
  const forms = inPassage.flatMap(wordForms);
  return sheet(
    "reading",
    "Reading passage",
    html`${sheetTitle("Part 6", "Read and think", p.listenOnly ? "A grown-up or teacher reads this aloud. Follow along and listen for the words in bold." : "Read the passage. The lesson words are in bold.")}
      ${p.listenOnly ? readToMe("Read to me") : ""}
      <article class="vap-passage" data-numbering="${info.numbering}" aria-label="${p.title}">
        <header>
          <p class="vap-genre">${GENRE[p.genre] ?? p.genre}${p.listenOnly ? " · Listen" : ""}</p>
          <h3>${p.title}</h3>
        </header>
        <div class="vap-passage-text">
          ${p.paras.map((para, i) => html`<p data-para="${i + 1}">${info.numbering === "paragraph" ? html`<span class="vap-pn" aria-label="Paragraph ${i + 1}">${i + 1}</span>` : ""}<span class="vap-ptext">${boldWords(para, forms)}</span></p>`)}
        </div>
      </article>
      <section class="vap-block" aria-label="Questions about the passage">
        ${subTitle("", "Think about the passage", p.listenOnly ? "Listen to each question. Circle your answer." : "Circle the letter of the best answer.")}
        <ol class="vap-qs" role="list">
          ${(p.qs ?? []).map(
            (q, i) =>
              html`<li class="vap-q">
                <span class="vap-n">${i + 1}</span>
                <div>
                  ${info.early ? "" : html`<p class="vap-skill">${SKILL[q.skill] ?? q.skill}</p>`}
                  <p>${q.q}</p>
                  ${choiceList(info.letters, q.choices, { rightIndex: teacher ? q.a : -1, wide: true })}${teacher && q.why ? keyNote("Why", q.why) : ""}
                </div>
              </li>`,
          )}
        </ol>
      </section>`,
  );
}

// ---- 7. sentence writing ------------------------------------------------------------------------------------------
function responseArea(c, { sentence = true } = {}) {
  const { info } = c;
  if (info.early)
    return html`<div class="vap-respond">
      ${drawBox()}${ruled(info.writeLines, { guide: true })}
    </div>`;
  if (info.band === "upper-elem") return ruled(sentence ? 3 : info.writeLines + 2);
  return sentence ? ruled(2) : writingBox(8);
}

export function writing(c) {
  const { unit: u, teacher, supports, info } = c;
  const sentences = u.produce?.sentences ?? [];
  const combine = u.produce?.combine ?? [];
  return sheet(
    "writing",
    "Sentence writing",
    html`${sheetTitle("Part 7", "Write with the words", info.early ? "Say your idea first. Then draw and write." : "Write original sentences. Make each one show what the word means.")}
    ${
      (supports.frames && u.wida?.frames?.length) || (supports.rehearsal && u.wida?.oral) || (supports.wordBank && u.wida?.bank?.length)
        ? html`<aside class="vap-support" aria-label="Writing supports">
            ${supports.rehearsal && u.wida?.oral ? html`<p><b>Say it first:</b> ${u.wida.oral}</p>` : ""}
            ${supports.frames && u.wida?.frames?.length ? html`<p><b>Sentence starters</b></p><ul>${u.wida.frames.map((f) => html`<li>${f}</li>`)}</ul>` : ""}
            ${supports.wordBank && u.wida?.bank?.length ? html`<p class="vap-bankline"><b>Word bank:</b> ${u.wida.bank.join(" · ")}</p>` : ""}
          </aside>`
        : ""
    }
    ${
      sentences.length
        ? html`<section class="vap-block" aria-label="Write sentences">
            ${subTitle("A", "Write a sentence", info.early ? "Tell a grown-up your sentence first." : "")}
            <ol class="vap-qs" role="list">
              ${sentences.map((s, i) => {
                const hit = wordsMentioned(c, s);
                return html`<li class="vap-q">
                  <span class="vap-n">${i + 1}</span>
                  <div>
                    <p>${s}</p>
                    ${
                      supports.frames && hit.some((w) => w.frame)
                        ? html`<p class="vap-starter">
                            <b>Starter:</b> ${hit
                              .filter((w) => w.frame)
                              .map((w) => w.frame)
                              .join("  ·  ")}
                          </p>`
                        : ""
                    }
                    ${responseArea(c)}
                    ${teacher ? notes(c, hit) : ""}
                  </div>
                </li>`;
              })}
            </ol>
          </section>`
        : ""
    }
    ${
      combine.length
        ? html`<section class="vap-block" aria-label="Combine sentences">
            ${subTitle("B", "Combine the sentences", "Join the short sentences into one clear sentence. Use a lesson word.")}
            <ol class="vap-qs" role="list">
              ${combine.map(
                (cb, i) =>
                  html`<li class="vap-q">
                    <span class="vap-n">${i + 1}</span>
                    <div>
                      <ul class="vap-given">
                        ${cb.given.map((g) => html`<li>${g}</li>`)}
                      </ul>
                      ${ruled(info.early ? 2 : 3)}${teacher && cb.model ? keyNote("Suggested response", cb.model) : ""}
                    </div>
                  </li>`,
              )}
            </ol>
          </section>`
        : ""
    }`,
  );
}

// ---- 8. extended application --------------------------------------------------------------------------------------
export function extended(c) {
  const { unit: u, teacher, supports, info } = c;
  const w = u.passage?.write;
  const argue = u.produce?.argue;
  const discuss = u.produce?.discuss ?? [];
  const planner = (labels) =>
    html`<div class="vap-planner" role="group" aria-label="Planner">
      ${labels.map((l) => html`<div class="vap-plan-box"><strong>${l}</strong></div>`)}
    </div>`;
  const constructed = teacher ? (u.check?.constructed ?? []) : [];
  return sheet(
    "extended",
    "Apply what you learned",
    html`${sheetTitle("Part 8", "Use the words in your own writing", info.early ? "Talk, draw, and write about the words." : "Plan, then write. Use at least three lesson words.")}
    ${w ? html`<section class="vap-block" aria-label="Write about the passage">${subTitle("A", "Write", w.prompt)}${supports.frames || info.early ? html`<p class="vap-starter"><b>Starter:</b> ${w.frame}</p>` : ""}${responseArea(c, { sentence: false })}</section>` : ""}
    ${argue && !info.early ? html`<section class="vap-block" aria-label="Take a side">${subTitle("B", "Take a side", argue.prompt)}${planner(["My claim", "Reason 1", "Reason 2", "Lesson words I will use"])}${supports.frames ? html`<p class="vap-starter"><b>Starter:</b> ${argue.frame}</p>` : ""}${info.band === "upper-elem" ? ruled(5) : writingBox(9)}</section>` : ""}
    ${
      discuss.length
        ? html`<section class="vap-block" aria-label="Talk it over">
            ${subTitle(argue && !info.early ? "C" : "B", "Talk it over", "Discuss with a partner. Use lesson words as you talk.")}${info.early ? readToMe("Read to me: talk with a partner.") : ""}
            <ul class="vap-checklist is-talk">
              ${discuss.map((d) => html`<li>${checkBox()}<span>${d}</span></li>`)}
            </ul>
          </section>`
        : ""
    }
    ${teacher ? html`${argue ? keyNote("Scoring suggestion", "Look for a clear claim, two reasons that rely on the lesson words, and one place where a lesson word shows the writer thinking carefully (not just using the word).") : ""}${constructed.map((k) => keyNote(`Suggested response (${k.id})`, html`<em>${k.prompt}</em> Look for: ${k.look.join("; ")}. <b>Model:</b> ${k.model}`))}` : ""}`,
  );
}

// ---- 9. review, 10. show what you know ---------------------------------------------------------------------------
export function review(c) {
  const { items, teacher, info } = c;
  const m = items.match;
  return sheet(
    "review",
    "Review",
    html`${sheetTitle("Part 9", "Look back at the words", "Match each word to its meaning. Then rate how ready you feel.")}
      <section class="vap-block" aria-label="Match words and meanings">
        ${subTitle("A", "Match", "Write the letter of the meaning next to each word.")}
        ${info.early ? readToMe("Read to me: say each word, then read each meaning.") : ""}
        <div class="vap-match is-defs">
          <ol class="vap-match-words" role="list">
            ${m.terms.map((t) => html`<li><span class="vap-n">${t.n}</span><strong>${t.hw}</strong>${teacher ? html`<span class="vap-fill">${t.key.letter}</span>` : html`<span class="vap-line is-short"></span>`}</li>`)}
          </ol>
          <ol class="vap-match-defs" role="list">
            ${m.defs.map((d) => html`<li>${bubble(d.letter)}<span>${d.def}</span></li>`)}
          </ol>
        </div>
      </section>
      <section class="vap-block" aria-label="How ready do I feel">
        ${subTitle("B", "How ready do I feel?", "Put a check in one box for each word. This is for you, not for a grade.")}
        <table class="vap-table is-rate">
          <caption>
            Self-check
          </caption>
          <thead>
            <tr>
              <th scope="col">Word</th>
              <th scope="col">Not yet</th>
              <th scope="col">Getting there</th>
              <th scope="col">Got it</th>
            </tr>
          </thead>
          <tbody>
            ${c.unit.words.map(
              (w) =>
                html`<tr>
                  <th scope="row">${w.hw}</th>
                  <td>${checkBox()}</td>
                  <td>${checkBox()}</td>
                  <td>${checkBox()}</td>
                </tr>`,
            )}
          </tbody>
        </table>
      </section>`,
  );
}

export function show(c) {
  const { unit: u, teacher, info } = c;
  const prompt = u.produce?.explain;
  if (!prompt) return "";
  const hit = wordsMentioned(c, prompt);
  return sheet(
    "show",
    "Show what you know",
    html`${sheetTitle("Part 10", "Show what you know", "Answer in your own words. Check your work before you stop.")}
      ${info.early ? readToMe("Read to me. Tell a grown-up your answer first.") : ""}
      <section class="vap-block" aria-label="Short response">
        <p class="vap-prompt">${prompt}</p>
        ${info.early ? html`${drawBox()}${ruled(3, { guide: true })}` : info.band === "upper-elem" ? ruled(6) : writingBox(10)}
      </section>
      <section class="vap-block" aria-label="Check my work">
        <h3>Check my work</h3>
        <ul class="vap-checklist">
          ${["I used at least one word from this lesson.", "I gave an example or a reason.", "I read my answer again."].map((t) => html`<li>${checkBox()}<span>${t}</span></li>`)}
        </ul>
      </section>
      ${teacher ? notes(c, hit) : ""}`,
  );
}

export { sceneTile };
