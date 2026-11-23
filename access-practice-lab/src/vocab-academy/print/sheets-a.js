// Vocabulary Academy print: workbook sheets 1-4 (unit opener, word list, worked example, contextual exercises).
// Every sheet takes the shared context `c` = { unit, items, teacher, info, supports }. Student contexts carry a
// student-safe unit and key-less items, so the `c.teacher` branches below have nothing to print outside teacher mode.
import {
  bubble,
  checkBox,
  choiceList,
  clozeText,
  keyNote,
  POS_NAME,
  readToMe,
  sceneTile,
  sheet,
  sheetTitle,
  subTitle,
} from "./kit.js";
import { boldWords, DISCLAIMER, gradeLabel, html, wordForms } from "./shared.js";
import { ruled } from "./kit.js";

const formsOf = (c) => c.unit.words.flatMap(wordForms);

// ---- 1. unit opener -----------------------------------------------------------------------------------------------
export function cover(c) {
  const { unit: u, info, teacher } = c;
  const words = u.words;
  return sheet(
    "cover",
    "Lesson opener",
    html`<header class="vap-cover-head">
        <p class="vap-eyebrow">
          ${gradeLabel(u.grade)} · Lesson ${u.n}${teacher ? " · Teacher Edition" : ""}
        </p>
        <h1>${u.title}</h1>
        <p class="vap-theme"><strong>Theme:</strong> ${u.theme}</p>
      </header>
      ${info.early ? html`<div class="vap-mosaic">${words.slice(0, 6).map((w) => sceneTile(w, { size: "xl" }))}</div>` : ""}
      <section class="vap-objectives" aria-label="I can">
        <h2>I can…</h2>
        ${info.early ? readToMe("A grown-up can read these aloud.") : ""}
        <ul class="vap-checklist">
          ${u.objectives.map((o) => html`<li>${checkBox()}<span>${o}</span></li>`)}
        </ul>
      </section>
      <section class="vap-glance" aria-label="Words at a glance">
        <h2>Words in this lesson</h2>
        <ul class="vap-chips">
          ${words.map((w) => html`<li><strong>${w.hw}</strong><span class="vap-pos">${POS_NAME[w.pos] ?? w.pos}</span></li>`)}
        </ul>
      </section>
      ${teacher ? "" : html`<p class="vap-belongs">This workbook belongs to <span class="vap-fillin" role="img" aria-label="write your name"></span></p>`}
      <p class="vap-fine">${DISCLAIMER.en}</p>`,
  );
}

// ---- 2. word list -------------------------------------------------------------------------------------------------
function wordCard(c, w) {
  const { info, supports, teacher, unit } = c;
  const forms = wordForms(w);
  const note = teacher ? unit.teacher?.notes?.[w.id] : "";
  const es =
    supports.glossaryEs && w.es?.gloss
      ? html`<p class="vap-es" lang="es"><span class="vap-chip">Español</span> ${w.es.gloss}</p>`
      : "";
  const sense = (w.senses ?? [])
    .filter((x) => x.def)
    .map(
      (x) =>
        html`<p class="vap-sense"><span class="vap-chip">Also</span> <b>${POS_NAME[x.pos] ?? x.pos}:</b> ${x.def}${x.example ? html` <i>${boldWords(x.example, forms)}</i>` : ""}</p>`,
    );
  const similar = w.syn?.length ? html`<span><b>Similar:</b> ${w.syn.join(", ")}</span>` : "";
  const opposite = w.ant?.length ? html`<span><b>Opposite:</b> ${w.ant.join(", ")}</span>` : "";
  return html`<article class="vap-card" aria-label="${w.hw}">
    <header class="vap-card-head">
      <h3>${w.hw}</h3>
      <p class="vap-card-meta">
        <span class="vap-pos">${POS_NAME[w.pos] ?? w.pos}</span>
        <span class="vap-pron">${w.pron}</span>
      </p>
    </header>
    <div class="vap-card-main">
      <div class="vap-card-text">
        <p class="vap-def">${w.def}</p>
        <p class="vap-ex">${boldWords(w.ex, forms)}</p>
        ${sense}
        ${info.early ? "" : html`<p class="vap-rel">${similar}${similar && opposite ? " · " : ""}${opposite}</p>`}
        ${es}
      </div>
      ${supports.picture ? sceneTile(w, { showAlt: info.early, size: info.early ? "lg" : "md" }) : ""}
    </div>
    ${note ? keyNote("Teaching note", note) : ""}
  </article>`;
}

export function wordList(c) {
  const { unit: u, info } = c;
  return sheet(
    "words",
    "Meet the words",
    html`${sheetTitle("Part 1", "Meet the words", info.early ? "Say each word. Listen to what it means. Look at the picture." : "Say each word. Read what it means. Notice how it is used.")}
      ${info.early ? readToMe("Read to me: say the word, then read what it means.") : ""}
      <div class="vap-cards">${u.words.map((w) => wordCard(c, w))}</div>`,
  );
}

// ---- 3. worked example --------------------------------------------------------------------------------------------
export function worked(c) {
  const { unit: u, items, teacher, info, supports } = c;
  const w = c.unit.words.find((x) => x.id === items.modeledId);
  const forms = wordForms(w);
  const seg = w.morph?.segs?.length
    ? html`<p class="vap-equation" aria-label="word parts">
          ${w.morph.segs.map((s, i) => html`${i ? html`<span class="vap-op" aria-hidden="true">+</span>` : ""}<span class="vap-term"><b>${s.s}</b><small>${s.m}</small></span>`)}<span
            class="vap-op"
            aria-hidden="true"
            >=</span
          ><span class="vap-term is-result"><b>${w.hw}</b></span>
        </p>
        ${w.morph.note ? html`<p class="vap-note">${w.morph.note}</p>` : ""}`
    : "";
  const steps = [
    [
      "Say it",
      html`<p>
        <strong class="vap-big">${w.hw}</strong> <span class="vap-pron">${w.pron}</span>
        <span class="vap-pos">${POS_NAME[w.pos] ?? w.pos}</span>
      </p>`,
    ],
    ["Know what it means", html`<p class="vap-def">${w.def}</p>`],
    [
      "See it",
      html`<div class="vap-see">
        ${supports.picture ? sceneTile(w, { showAlt: true, size: "lg" }) : ""}
        <p class="vap-ex">${boldWords(w.ex, forms)}</p>
      </div>`,
    ],
    [
      "Use it in a new place",
      html`<p class="vap-ex">${boldWords(w.ex2, forms)}</p>
        ${
          info.early
            ? ""
            : html`<ul class="vap-uses">
                ${Object.entries(w.apps ?? {}).map(([k, v]) => html`<li><b>${k[0].toUpperCase() + k.slice(1)}:</b> ${v}</li>`)}
              </ul>`
        }`,
    ],
    w.nonExample ? ["What it is not", html`<p>${boldWords(w.nonExample, forms)}</p>`] : null,
    w.morph?.segs?.length ? ["Look inside the word", seg] : null,
    w.syn?.length || w.ant?.length || w.family?.length
      ? [
          "Word neighbors",
          html`<ul class="vap-uses">
            ${w.syn?.length ? html`<li><b>Similar:</b> ${w.syn.join(", ")}</li>` : ""}${w.ant?.length ? html`<li><b>Opposite:</b> ${w.ant.join(", ")}</li>` : ""}${w.family?.length ? html`<li><b>Word family:</b> ${w.family.map((f) => f.w).join(", ")}</li>` : ""}
          </ul>`,
        ]
      : null,
    w.frame
      ? [
          "Make it yours",
          html`<p class="vap-frame">${w.frame}</p>
            ${ruled(info.early ? 1 : 2, { guide: info.early })}`,
        ]
      : null,
  ].filter(Boolean);
  return sheet(
    "worked",
    "Watch one word, all the way through",
    html`${sheetTitle("Part 2", `Watch one word: ${w.hw}`, "Follow each step. You will do the same with other words next.")}
      ${info.early ? readToMe("Read to me: one step at a time.") : ""}
      <ol class="vap-steps" role="list">
        ${steps.map(
          ([title, body], i) =>
            html`<li>
              <span class="vap-stepno" aria-hidden="true">${i + 1}</span>
              <div>
                <h3>${title}</h3>
                ${body}
              </div>
            </li>`,
        )}
      </ol>
      ${teacher && u.teacher?.model ? keyNote("Say aloud (modeling script)", u.teacher.model) : ""}`,
  );
}

// ---- 4. contextual exercises --------------------------------------------------------------------------------------
function clozeBlock(c) {
  const { items, teacher, info } = c;
  const { cloze } = items;
  if (!cloze.items.length) return "";
  return html`<section class="vap-block" aria-label="Fill in the blank">
    ${subTitle("A", "Fill in the blank", "Choose a word from the word bank. Use the clue in the sentence.")}
    <div class="vap-bank" role="group" aria-label="Word bank">
      <strong>Word bank</strong>
      <ul>
        ${cloze.bank.map((b) => html`<li>${b}</li>`)}
      </ul>
    </div>
    ${cloze.example ? html`<p class="vap-qexample"><span class="vap-chip">Example</span> ${clozeText(cloze.example.s, cloze.example.answer)}</p>` : ""}
    <ol class="vap-qs" role="list">
      ${cloze.items.map(
        (it) =>
          html`<li class="vap-q">
            <span class="vap-n">${it.n}</span>
            <div>
              ${info.early ? readToMe("Read this sentence to me.") : ""}
              <p>${clozeText(it.s, teacher ? it.key?.answer : "")}</p>
            </div>
          </li>`,
      )}
    </ol>
  </section>`;
}

function bestBlock(c) {
  const { items, teacher, info } = c;
  if (!items.best.length) return "";
  return html`<section class="vap-block" aria-label="Choose the best word">
    ${subTitle("B", "Choose the best word", "Circle the letter of the word that fits the sentence best.")}
    <ol class="vap-qs" role="list">
      ${items.best.map(
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
  </section>`;
}

function detectBlock(c) {
  const { items, teacher, info } = c;
  const d = items.detect;
  if (!d.items.length) return "";
  const yes = info.early ? "Makes sense" : "Used correctly";
  const no = info.early ? "Does not make sense" : "Used incorrectly";
  const forms = formsOf(c);
  // `solved` fills the right verdict: always on the worked example, and on every item in the teacher edition.
  const marks = (wrong, solved = teacher) =>
    html`<span class="vap-verdict" role="group" aria-label="Verdict"
      >${bubble("✓", solved && !wrong)}<span class="${solved && !wrong ? "is-right" : ""}"
        >${yes}</span
      >
      ${bubble("✗", solved && wrong)}<span class="${solved && wrong ? "is-right" : ""}"
        >${no}</span
      ></span
    >`;
  return html`<section class="vap-block" aria-label="Is the word used correctly?">
    ${subTitle("C", "Is the word used correctly?", `Read each sentence. Circle one: ${yes} or ${no}.${info.early ? "" : " If it is wrong, say why on the line."}`)}
    ${d.example ? html`<p class="vap-qexample"><span class="vap-chip">Example</span> <b>${d.example.hw}:</b> ${boldWords(d.example.s, forms)} ${marks(true, true)} <span class="vap-why"><b>Check:</b> ${d.example.hw} means \u201c${d.example.def.replace(/\.$/, "")}.\u201d Does the sentence match?</span></p>` : ""}
    <ol class="vap-qs" role="list">
      ${d.items.map(
        (it) =>
          html`<li class="vap-q">
            <span class="vap-n">${it.n}</span>
            <div>
              ${info.early ? readToMe("Read this sentence to me.") : ""}
              <p><b class="vap-wordtag">${it.hw}:</b> ${boldWords(it.s, formsOf(c))}</p>
              ${marks(!!it.key?.wrong)}${info.early ? "" : ruled(1, { label: "Say why" })}${teacher ? keyNote(it.key.wrong ? "Incorrect" : "Correct", it.key.why) : ""}
            </div>
          </li>`,
      )}
    </ol>
  </section>`;
}

export function exercises(c) {
  const { info, teacher } = c;
  return sheet(
    "exercises",
    "Words in context",
    html`${sheetTitle("Part 3", "Words in context", info.early ? "A grown-up reads each sentence. You listen, think, and choose." : "Use the clues in each sentence to decide which word fits and which does not.")}
    ${clozeBlock(c)}${bestBlock(c)}${detectBlock(c)}
    ${teacher ? keyNote("Check", html`The worked example (${c.unit.words.find((x) => x.id === c.items.modeledId).hw}) is solved on the sheet; students complete the numbered items.`) : ""}`,
  );
}

