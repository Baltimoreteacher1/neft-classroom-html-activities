#!/usr/bin/env node
/**
 * generate-sg-practice.mjs — the Practice Set that CONTINUES a small-group lesson.
 *
 *   lessons/<id>-group{1,2}/practice.html              student packet (4 pages)
 *   lessons/<id>-group{1,2}/practice-answer-key.html   teacher key + reteach routing
 *
 * WHY THIS IS NOT `worksheet.html`. The worksheet is the lesson's practice bank
 * printed four ways (Level 0 / Version A / Version B / Challenge) — it is the
 * SAME items the interactive lesson serves, on paper. This packet is the work
 * that comes AFTER the group meets: it picks up the parts of the small-group
 * session that only ever happened out loud, at the table, with the teacher
 * there — the "I do" model, the discourse question at the manipulative, the
 * turn-and-talk, the checks for understanding in Connect, the exit ticket — and
 * asks the student to do them again, in writing, alone. Every source pool it
 * reads (`launch.conceptIntro`, `warmup.questions`, `connect.check`,
 * `explore.discourse`, `turnAndTalk`, `vocabulary[].cloze`, `reflect.exitTicket`)
 * is one that `generate-worksheets.mjs` does NOT render, so a student who does
 * both sheets is not answering the same twelve questions twice.
 *
 * THE FOUR PAGES, in the order a continuation has to happen:
 *   1  Pick up where we left off — recap, the model to copy, warm restart
 *   2  Keep going              — the Connect checks in writing + back to the model
 *   3  Words and reasoning     — vocabulary in use, the mistake to watch, say more
 *   4  Show what you know      — exit check, carry-forward from the last lesson,
 *                                self-check band, one question for the group
 *
 * LEVELS. `variant` decides the support, not a separate file: Group 1 (Extra
 * Support) gets sentence frames, the word bank on every written task and a
 * "change one number" closer; Group 2 (Challenge) gets no frames, a second-reason
 * demand on every justification and an "author your own problem" closer. Labels
 * are the ones the hub already shows on those rows — never a program name.
 *
 * Source of truth: each lessons/<id>/config.json. Re-run after editing configs:
 *   npm run generate-sg-practice          (add --check for the freshness gate)
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EDITORIAL_OVERRIDES } from "./lib/editorial-print.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";
import { SG_PRACTICE_CSS } from "./lib/sg-practice-style.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/** Group 1 and Group 2 wear the labels the curriculum hub already shows. */
const LEVELS = {
  group1: { name: "Group 1", badge: "Extra Support", supported: true },
  group2: { name: "Group 2", badge: "Challenge", supported: false },
};

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const lines = (n = 2) => `<div class="sp-lines">${'<span class="sp-line"></span>'.repeat(n)}</div>`;
const work = (label = "Show your work", tall = false) =>
  `<div class="sp-work${tall ? " sp-work-tall" : ""}"><span class="sp-work-label">${esc(label)}</span></div>`;

/**
 * The first sentence or two of a `commonMistake`, which is authored as TEACHER
 * guidance and states the misconception and then its correction in one string.
 * Printing it whole on the student page hands over the answer to the very task
 * that asks them to find and fix it, so the student sees the misconception and
 * the teacher key keeps the rest.
 */
function mistakeStatement(text) {
  const src = String(text || "").trim();
  if (!src) return "";
  const sentences = src.match(/[^.!?]+[.!?]+/g) || [src];
  let out = sentences[0].trim();
  // A very short opener ("Students flip the wrong fraction.") is a label, not a
  // statement; take one more sentence unless that one starts the correction.
  if (
    out.length < 70 &&
    sentences[1] &&
    !/^\s*(for example|instead|keep|before|remember|check)\b/i.test(sentences[1])
  ) {
    out += ` ${sentences[1].trim()}`;
  }
  return out;
}

/** Trim to a clause boundary — a self-check row a student reads, not a paragraph. */
function clip(text, max) {
  const src = String(text || "").trim();
  if (src.length <= max) return src;
  const cut = src.slice(0, max);
  const at = Math.max(cut.lastIndexOf(", "), cut.lastIndexOf(" — "), cut.lastIndexOf(". "));
  return `${(at > max * 0.5 ? cut.slice(0, at) : cut.slice(0, cut.lastIndexOf(" "))).trim()}…`;
}

/** Rotating justification asks, so three checks in a row do not read identically. */
const JUSTIFY = [
  { supported: "Why is that the answer?", challenge: "Why is that the answer?" },
  { supported: "How do you know?", challenge: "How do you know? Give a second reason as well." },
  {
    supported: "Explain your thinking.",
    challenge:
      "Explain your thinking. What would have to change for a different choice to be right?",
  },
];

/* ---------- corpus ------------------------------------------------------- */

/** Every small-group config, keyed by folder id, in book order. */
function loadTracks() {
  const rows = [];
  for (const dir of readdirSync(LESSONS, { withFileTypes: true })) {
    const m = dir.isDirectory() && dir.name.match(/^(\d+-\d+)-(group[12])$/);
    if (!m) continue;
    const file = join(LESSONS, dir.name, "config.json");
    if (!existsSync(file)) continue;
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    rows.push({ id: dir.name, base: m[1], variant: m[2], cfg });
  }
  rows.sort(
    (a, b) =>
      (a.cfg.unit ?? 0) - (b.cfg.unit ?? 0) ||
      (a.cfg.lesson ?? 0) - (b.cfg.lesson ?? 0) ||
      a.variant.localeCompare(b.variant),
  );
  const tracks = { group1: [], group2: [] };
  for (const row of rows) tracks[row.variant].push(row);
  return { rows, tracks };
}

/** The base lesson's own title ("Math is Mine"), for a headline a student reads. */
function baseTitle(base) {
  const file = join(LESSONS, base, "config.json");
  if (!existsSync(file)) return "";
  try {
    return JSON.parse(readFileSync(file, "utf8")).title || "";
  } catch {
    return "";
  }
}

/* ---------- item renderers ----------------------------------------------- */

/**
 * One multiple-choice task. `answerIndex` is read from whichever field the
 * source pool uses — `connect.check` says `answer`, warmup and the exit ticket
 * say `correctIndex`, and a pool that disagreed with itself would silently mark
 * option A correct on every item.
 */
function mcTask(n, item, opts) {
  const { key, tag = "", justify = "", frame = "", watch = "", justifyRows = 2 } = opts;
  const answerIndex = typeof item.answer === "number" ? item.answer : item.correctIndex;
  const choices = (item.choices || [])
    .map((c, i) => {
      const right = key && i === answerIndex;
      // A dozen authored choices carry their own "B) " prefix from whatever they
      // were pasted out of. This sheet draws the letter bubble itself, so
      // printing both gives a student option A reading "B) How many hours…".
      const text = String(c ?? "").replace(/^\s*[A-H][).]\s+/, "");
      return `<li class="sp-opt${right ? " ws-correct" : ""}"><span class="sp-bub">${LETTERS[i]}</span>${esc(text)}</li>`;
    })
    .join("");
  const tagHtml = tag ? `<span class="sp-tag">${esc(tag)}</span>` : "";
  let tail = "";
  if (justify) {
    tail += `<p class="sp-stem" style="margin-top:8px;font-weight:600;">${esc(justify)}</p>`;
    tail += frame ? `<p class="sp-frame">${esc(frame)}</p>` : "";
    tail += key ? "" : lines(justifyRows);
  }
  if (key) {
    if (item.explanation) tail += `<p class="ws-keynote">${esc(item.explanation)}</p>`;
    if (watch) tail += `<p class="sp-watch"><b>Watch for:</b> ${esc(watch)}</p>`;
  }
  return task(n, `${tagHtml}${esc(item.stem)}`, `<ol class="sp-opts">${choices}</ol>${tail}`);
}

/** One written task: a prompt, an optional frame, then ruled lines or the key. */
function writtenTask(n, prompt, opts) {
  const { key, tag = "", frame = "", answer = "", rows = 3, box = false } = opts;
  const tagHtml = tag ? `<span class="sp-tag">${esc(tag)}</span>` : "";
  const frameHtml = frame ? `<p class="sp-frame">${esc(frame)}</p>` : "";
  const space = key
    ? `<p class="ws-keynote">${esc(answer || "Answers vary — look for correct reasoning stated in the student's own words.")}</p>`
    : box
      ? work()
      : lines(rows);
  return task(n, `${tagHtml}${esc(prompt)}`, `${frameHtml}${space}`);
}

function task(n, stemHtml, bodyHtml) {
  return `<li class="sp-task"><span class="sp-num">${n}</span><div class="sp-body"><p class="sp-stem">${stemHtml}</p>${bodyHtml}</div></li>`;
}

/* ---------- page furniture ----------------------------------------------- */

function pageHead(ctx, { kicker, sub, nameLine = false, key = false }) {
  const meta = nameLine
    ? `<div class="sp-meta"><span>Name: <span class="sp-fill"></span></span><span>Date: <span class="sp-fill sp-fill-sm"></span></span><span>Group: <span class="sp-fill sp-fill-sm" style="width:70px"></span></span></div>`
    : "";
  const level = key
    ? `${ctx.level.name} · ${ctx.level.badge} — Answer Key`
    : `${ctx.level.name} · ${ctx.level.badge}`;
  return `<header class="sp-head">
    <div class="sp-eyebrow">
      <span class="sp-std">${esc(ctx.cfg.standard || "")}</span>
      <span class="sp-level">${esc(level)}</span>
    </div>
    <p class="sp-kicker">${esc(kicker)}</p>
    <h1 class="sp-title">${esc(ctx.headline)}</h1>
    <p class="sp-sub">${esc(sub)}</p>
    ${meta}
  </header>`;
}

// "Part", not "Page": a part that runs long prints on two sheets, and a footer
// promising "Page 3 of 4" on the sixth sheet is the kind of small lie that makes
// a packet feel homemade.
function pageFoot(ctx, n, total) {
  return `<footer class="sp-foot"><span>${esc(ctx.cfg.title || ctx.id)} · Practice Set</span><span>Part ${n} of ${total}</span></footer>`;
}

function wordBank(vocab) {
  const words = (vocab || []).slice(0, 8).filter((v) => v.term);
  if (!words.length) return "";
  const chips = words
    .map((v) => {
      const es = v.termEs || v.spanish || "";
      const esHtml = es ? ` <span class="sp-word-es">(${esc(es)})</span>` : "";
      return `<span class="sp-word">${esc(v.term)}${esHtml}</span>`;
    })
    .join("");
  return `<section class="sp-bank"><h2 class="sp-bank-h">Word bank · Banco de palabras</h2><div class="sp-bankwords">${chips}</div></section>`;
}

function sectionH(text, note = "") {
  const noteHtml = note ? `<p class="sp-sec-note">${esc(note)}</p>` : "";
  return `<h2 class="sp-sec-h">${esc(text)}</h2>${noteHtml}`;
}

/* ---------- page 1 — pick up where we left off ---------------------------- */

function pageOne(ctx, counter, key) {
  const { cfg, level } = ctx;
  const intro = cfg.launch?.conceptIntro || {};
  const iDo = intro.iDo || {};
  const modelLines = (iDo.lines || []).filter(Boolean);
  const steps = modelLines
    .map(
      (l, i) => `<li${i === modelLines.length - 1 ? ' class="sp-model-last"' : ""}>${esc(l)}</li>`,
    )
    .join("");
  const model = steps
    ? `<section class="sp-model"><h2 class="sp-model-h">Model to copy — ${esc(iDo.title || "what we walked through together")}</h2><ol class="sp-model-steps">${steps}</ol></section>`
    : "";

  // The "we do" is the half of the model the group only got partway through
  // before the session ended. It is reprinted whole — the student finishes the
  // thinking they started at the table rather than meeting a cold prompt.
  const weDo = intro.weDo || {};
  const weDoLines = (weDo.lines || []).filter(Boolean).filter((l) => !/sentence frame/i.test(l));
  const weDoHtml = weDoLines.length
    ? `<div class="sp-westart"><b>${esc(weDo.title || "We started this together")}:</b> ${esc(weDoLines.join(" "))}</div>`
    : "";
  const items = [];
  items.push(
    task(
      counter(),
      `<span class="sp-tag">Same steps</span>Finish what the group started. Use the model above, step for step.`,
      `${weDoHtml}${
        level.supported
          ? `<p class="sp-frame">My first step is ___ , because the problem asks for ___ .</p>`
          : ""
      }${
        key
          ? `<p class="ws-keynote">Look for the model's steps carried through on the student's own numbers, in the model's order — not the answer alone.</p>`
          : work("Show your work", true)
      }`,
    ),
  );

  const warm = (cfg.warmup?.questions || []).filter((q) => (q.choices || []).length);
  for (const q of warm.slice(0, 3)) {
    items.push(
      mcTask(counter(), q, {
        key,
        tag: "Warm restart",
        justify: level.supported ? "" : "How do you know?",
        watch: q.explanation ? "" : cfg.practice?.commonMistake || "",
      }),
    );
  }

  const recap = `<section class="sp-recap">
    <h2 class="sp-recap-h">Where we left off</h2>
    <p><b>Our goal:</b> ${esc(cfg.contentObjective || "")}</p>
    ${intro.keyIdea ? `<p><b>The big idea:</b> ${esc(intro.keyIdea)}</p>` : ""}
  </section>`;

  return `<section class="sp-page">
  ${pageHead(ctx, { kicker: "Practice Set · Part 1", sub: "Pick up where we left off", nameLine: true, key })}
  ${recap}
  ${model}
  ${sectionH("Start here", "You did these with your group. Now do them on your own — the model above is yours to copy.")}
  <ol class="sp-tasks">${items.join("")}</ol>
  ${pageFoot(ctx, 1, 4)}
  </section>`;
}

/* ---------- page 2 — keep going ------------------------------------------ */

function pageTwo(ctx, counter, key) {
  const { cfg, level } = ctx;
  const items = [];
  const checks = (cfg.connect?.check || []).filter((c) => (c.choices || []).length);
  checks.slice(0, 3).forEach((c, i) => {
    const ask = JUSTIFY[i % JUSTIFY.length];
    items.push(
      mcTask(counter(), c, {
        key,
        tag: "Think it through",
        justify: level.supported ? ask.supported : ask.challenge,
        justifyRows: level.supported ? 2 : 3,
        frame: level.supported ? "I chose ___ because ___ ." : "",
      }),
    );
  });

  const discourse = cfg.explore?.discourse || cfg.connect?.discourse || {};
  const talk = (cfg.turnAndTalk || []).find((t) => t.question) || {};
  const backPrompt = discourse.prompt || talk.question || "";
  if (backPrompt) {
    const frame =
      discourse.sentenceFrame || (talk.stems || []).map((s) => s.en).find(Boolean) || "";
    items.push(
      writtenTask(counter(), backPrompt, {
        key,
        tag: "Back to the model",
        rows: 4,
        frame: level.supported ? frame : "",
        answer: (discourse.keywords || talk.keywords || []).length
          ? `Look for: ${(discourse.keywords || talk.keywords).join(", ")}.`
          : talk.kernel || "",
      }),
    );
  }

  const cards = (cfg.explore?.cards || []).filter((c) => c.text);
  let sort = "";
  if (cards.length >= 4) {
    const cats = cfg.explore?.categories || [];
    const rows = cards
      .slice(0, 8)
      .map(
        (c) =>
          `<li><span class="sp-blank">${key ? esc(LETTERS[c.correct ?? 0]) : ""}</span>${esc(c.text)}</li>`,
      )
      .join("");
    const legend = cats
      .map((c, i) => `<span class="sp-word"><b>${LETTERS[i]}</b> — ${esc(c)}</span>`)
      .join("");
    sort = `${sectionH("Sort it again — on paper this time", "Write the letter of the group each one belongs in.")}
    <div class="sp-bankwords" style="margin-bottom:8px;">${legend}</div>
    <ul class="sp-sort">${rows}</ul>`;
  }

  return `<section class="sp-page">
  ${pageHead(ctx, { kicker: "Practice Set · Part 2", sub: "Keep going", key })}
  ${sectionH("You answered these out loud. Now write them.", "Answer, then say how you know — the reason is the part that counts.")}
  <ol class="sp-tasks">${items.join("")}</ol>
  ${sort}
  ${pageFoot(ctx, 2, 4)}
  </section>`;
}

/* ---------- page 3 — words and reasoning --------------------------------- */

function pageThree(ctx, counter, key) {
  const { cfg, level } = ctx;
  const vocab = (cfg.vocabulary || []).filter((v) => v.term);
  const clozes = vocab.filter((v) => v.cloze).slice(0, 4);
  const clozeHtml = clozes.length
    ? `<ul class="sp-cloze">${clozes
        .map(
          (v) =>
            `<li>${esc(v.cloze)}${key ? ` <span class="ws-correct">→ ${esc(v.term)}</span>` : ""}</li>`,
        )
        .join("")}</ul>`
    : "";

  const items = [];
  const mistake = cfg.practice?.commonMistake || "";
  const shown = key ? mistake : mistakeStatement(mistake);
  if (shown) {
    items.push(
      task(
        counter(),
        `<span class="sp-tag">Find the mistake</span>Another student made this exact mistake in this lesson. Explain why it is wrong, then write what they should have done.`,
        `<div class="sp-mistake"><b>The mistake:</b> ${esc(shown)}</div>${
          key
            ? `<p class="ws-keynote">The full note above is the teacher's — the student sheet shows only the misconception, not the correction. A correct answer names the step that went wrong, states the rule it broke, and shows the fixed work.</p><p class="sp-watch"><b>Watch for:</b> a student who repeats the mistake back without naming why it is wrong.</p>`
            : lines(3)
        }`,
      ),
    );
  }

  const talks = (cfg.turnAndTalk || []).filter((t) => t.question);
  const say = talks[talks.length > 1 ? 1 : 0];
  if (say) {
    items.push(
      writtenTask(counter(), say.question, {
        key,
        tag: "Say more",
        rows: 4,
        frame: level.supported ? (say.stems || []).map((s) => s.en).find(Boolean) || "" : "",
        answer: say.kernel || "",
      }),
    );
  }

  const context = cfg.noticeAndWonder?.context || "";
  items.push(
    writtenTask(
      counter(),
      level.supported
        ? "Go back to Part 1 and pick one problem you already solved. Change one number in it, then solve your new version. Show every step."
        : `Write your own problem about this situation, then solve it and show the answer.${context ? ` The situation: ${context}` : ""}`,
      {
        key,
        tag: level.supported ? "Change one number" : "Write your own",
        box: true,
        frame: level.supported ? "If ___ changed to ___ , then ___ ." : "",
        answer: level.supported
          ? "Answers vary. Look for exactly one number changed and the model's steps carried through correctly on the new numbers."
          : "Answers vary. Look for a problem that actually requires this lesson's move, plus a worked solution that matches the problem as the student wrote it.",
      },
    ),
  );

  return `<section class="sp-page">
  ${pageHead(ctx, { kicker: "Practice Set · Part 3", sub: "Words and reasoning", key })}
  ${wordBank(vocab)}
  ${clozeHtml ? `${sectionH("Use the words", "Fill each blank with a word from the bank.")}${clozeHtml}` : ""}
  ${sectionH("Explain the thinking")}
  <ol class="sp-tasks">${items.join("")}</ol>
  ${pageFoot(ctx, 3, 4)}
  </section>`;
}

/* ---------- page 4 — show what you know ---------------------------------- */

function pageFour(ctx, counter, key) {
  const { cfg, level, previous } = ctx;
  const items = [];
  const exit = cfg.reflect?.exitTicket;
  if (exit && (exit.choices || []).length) {
    items.push(
      mcTask(counter(), exit, {
        key,
        tag: "Show what you know",
        justify: "Explain your choice.",
        frame: level.supported ? "I know it is ___ because ___ ." : "",
      }),
    );
  }

  for (const carry of carryForward(ctx)) {
    items.push(
      mcTask(counter(), carry.item, {
        key,
        tag: carry.tag,
        justify: level.supported ? "" : "How do you know?",
      }),
    );
  }

  const statements = [
    // "With my small group, I can …" is true of the session, not of the student
    // sitting alone with this packet — the claim they are rating is their own.
    (cfg.contentObjective || "I can do this lesson's math on my own.").replace(
      /^With my small group,\s*/i,
      "",
    ),
    `I can explain why it works: ${clip(cfg.launch?.conceptIntro?.keyIdea || "the big idea of this lesson", 110)}`,
    cfg.languageObjective || "I can use this lesson's words when I explain my thinking.",
  ].map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  const rows = statements
    .map(
      (s) =>
        `<tr><td>${esc(s)}</td><td><span class="sp-box"></span></td><td><span class="sp-box"></span></td><td><span class="sp-box"></span></td></tr>`,
    )
    .join("");
  const selfCheck = `<div class="sp-check"><table>
    <thead><tr><th>I can…</th><th>Not yet</th><th>Getting there</th><th>Got it</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;

  const ask = `<div class="sp-ask">
    <p class="sp-ask-h">One question I want to ask my group next time</p>
    ${lines(2)}
  </div>`;

  const reteach = key ? reteachTable(ctx) : "";
  const carryNote = previous
    ? `These two come from ${previous.label}. If they are shaky, that is the lesson to revisit — not this one.`
    : "";

  return `<section class="sp-page">
  ${pageHead(ctx, { kicker: "Practice Set · Part 4", sub: "Show what you know", key })}
  ${sectionH("Last check", carryNote)}
  <ol class="sp-tasks">${items.join("")}</ol>
  ${sectionH("Be honest — this tells your teacher what to do next")}
  ${selfCheck}
  ${ask}
  ${reteach}
  ${pageFoot(ctx, 4, 4)}
  </section>`;
}

/**
 * Two retrieval items from the PREVIOUS lesson in the same track — the exit
 * ticket that closed it and its last Connect check. When this is the first
 * lesson of a track there is no previous lesson to carry, so the leftover
 * prerequisite warm-ups (which spiral from an earlier grade) stand in.
 */
function carryForward(ctx) {
  const out = [];
  if (ctx.previous) {
    const prev = ctx.previous.cfg;
    const tag = `From ${ctx.previous.label}`;
    const exit = prev.reflect?.exitTicket;
    if (exit && (exit.choices || []).length) out.push({ tag, item: exit });
    const checks = (prev.connect?.check || []).filter((c) => (c.choices || []).length);
    if (checks.length) out.push({ tag, item: checks[checks.length - 1] });
  }
  // First lesson of a track: there is no previous lesson to carry, so the
  // retrieval comes from what this lesson itself did not spend — the warm-ups
  // past the three on Part 1, then the Connect checks past the three on Part 2.
  const spares = [
    {
      tag: `From ${ctx.cfg.warmup?.spiralFrom || "earlier work"}`,
      pool: (ctx.cfg.warmup?.questions || []).filter((q) => (q.choices || []).length).slice(3),
    },
    {
      tag: "One more from this lesson",
      pool: (ctx.cfg.connect?.check || []).filter((c) => (c.choices || []).length).slice(3),
    },
  ];
  for (const { tag, pool } of spares) {
    for (const item of pool) {
      if (out.length >= 2) break;
      out.push({ tag, item });
    }
  }
  return out.slice(0, 2);
}

/** Teacher-only closing table: what a miss in each part means, and the next move. */
function reteachTable(ctx) {
  const { cfg, id } = ctx;
  const rows = [
    [
      "Part 1 — the model",
      `Re-teach the "I do" at the table: ${cfg.launch?.conceptIntro?.iDo?.title || "the worked model"}. Do not move on to Part 2 until they can narrate the steps.`,
    ],
    [
      "Part 1 — warm restart",
      `The prerequisite is not in place (${cfg.warmup?.spiralFrom || "earlier work"}). Pull the warm-up back into the next group session before new content.`,
    ],
    [
      "Part 2 — the checks",
      `They can compute but cannot justify. Re-run the discourse prompt at the manipulative and require the sentence frame out loud before writing.`,
    ],
    [
      "Part 3 — words / the mistake",
      cfg.practice?.commonMistake
        ? `This is the lesson's known misconception: ${cfg.practice.commonMistake} Re-teach it as a contrast pair — the wrong work beside the right work.`
        : "Re-teach the vocabulary in use, not in isolation: give the word back inside the problem it names.",
    ],
    [
      "Part 4 — carry forward",
      ctx.previous
        ? `The gap is in ${ctx.previous.label}, not here. Reopen /lessons/${ctx.previous.id}/ with this group.`
        : "The gap is in the prerequisite grade-level skill. Route to the catch-up station rather than repeating this lesson.",
    ],
  ];
  return `<section style="margin-top:20px;">
  ${sectionH("If they missed it — what to do next")}
  <table class="sp-reteach"><thead><tr><th>Where they missed</th><th>Your next move</th></tr></thead>
  <tbody>${rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody></table>
  <p class="sp-sec-note">Small-group lesson: /lessons/${esc(id)}/ &nbsp;·&nbsp; Practice bank: /lessons/${esc(id)}/worksheet.html</p>
  </section>`;
}

/* ---------- document ----------------------------------------------------- */

function buildDocument(ctx, { key }) {
  let n = 0;
  const counter = () => ++n;
  const pages = [
    pageOne(ctx, counter, key),
    pageTwo(ctx, counter, key),
    pageThree(ctx, counter, key),
    pageFour(ctx, counter, key),
  ].join("\n");
  const suffix = key ? "Practice Set — Answer Key" : "Practice Set";
  return `<!DOCTYPE html>
<html lang="en" data-ewl-supports-lesson="${esc(ctx.cfg.lessonId || ctx.id)}" data-support-audience="${key ? "teacher" : "student"}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(ctx.cfg.title || ctx.id)} — ${suffix}</title>
<link href="/assets/fonts/worksheet-pages.css" rel="stylesheet" />
<style>
${SG_PRACTICE_CSS}
${EDITORIAL_OVERRIDES}
</style>
</head>
<body>
<main data-support-slot="practice">
${pages}
</main>
<!-- Same effective support configuration as the interactive lesson; see
     shared/supports/print-supports.js. Inert until supports are configured. -->
<script src="/shared/supports/print-supports.js" defer></script>
</body>
</html>`;
}

/* ---------- main ---------------------------------------------------------- */

function main() {
  const CHECK = process.argv.includes("--check");
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const { rows, tracks } = loadTracks();
  const stale = [];
  let written = 0;
  let skipped = 0;

  for (const row of rows) {
    if (only.length && !only.includes(row.id)) continue;
    const track = tracks[row.variant];
    const at = track.indexOf(row);
    const prev = at > 0 ? track[at - 1] : null;
    const ctx = {
      id: row.id,
      cfg: row.cfg,
      level: LEVELS[row.variant],
      headline: baseTitle(row.base) || row.cfg.title || row.id,
      previous: prev
        ? { id: prev.id, cfg: prev.cfg, label: `Lesson ${prev.cfg.unit}.${prev.cfg.lesson}` }
        : null,
    };
    // A packet with no model and no checks would be four pages of ruled lines.
    if (
      !(row.cfg.launch?.conceptIntro?.iDo?.lines || []).length &&
      !(row.cfg.connect?.check || []).length
    ) {
      skipped++;
      continue;
    }
    const studentFile = join(LESSONS, row.id, "practice.html");
    const keyFile = join(LESSONS, row.id, "practice-answer-key.html");
    const studentHtml = buildDocument(ctx, { key: false });
    const keyHtml = buildDocument(ctx, { key: true });
    if (CHECK) {
      if (!isGeneratedFresh(studentFile, studentHtml))
        stale.push(`lessons/${row.id}/practice.html`);
      if (!isGeneratedFresh(keyFile, keyHtml))
        stale.push(`lessons/${row.id}/practice-answer-key.html`);
      continue;
    }
    // writeGenerated, not writeFileSync — the Save/Resume, mobile-access and
    // enterprise-head injectors splice sentinel blocks into this page after it
    // is generated, and a plain overwrite deletes every one of them silently.
    writeGenerated(studentFile, studentHtml);
    writeGenerated(keyFile, keyHtml);
    written++;
  }

  if (CHECK) {
    if (stale.length) {
      console.error(
        `${stale.length} small-group practice page(s) are STALE — the committed HTML no longer matches its config.json:\n  ${stale
          .slice(0, 15)
          .join("\n  ")}\n\nFix: node scripts/generate-sg-practice.mjs`,
      );
      process.exit(1);
    }
    console.log(`Small-group practice sets up to date (${rows.length} small-group lessons).`);
    return;
  }
  console.log(`Small-group practice sets generated: ${written}  (skipped ${skipped})`);
}

main();
