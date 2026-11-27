// Server renderer for the Practice / Family / Assignments pages.
//
// Routes (all rendered by Pages Functions, so they add ZERO files to dist/):
//   /lessons/<id>/practice                student homework practice
//   /lessons/<id>/family-guide            bilingual family guide
//   /lessons/<id>/assignment              printable assignment (no answers anywhere in the page)
//   /lessons/<id>/assignment-answer-key   answer key (teacher gate: path contains "answer-key")
//   /practice-hub/                        teacher view: every lesson, links, copy, QR
//   /practice-hub/family/unit-<n>         family hub per unit (+ /letter, printable)
//   /practice-hub/qr/<id>/<kind>.svg      QR code for a student-facing page
// Data comes from the generated bundle (scripts/pfa/build-pfa-bundle.mjs <- data/practice,
// data/family, data/assignments.json).

import { qrSvg } from "../../../shared/qr/qr-code.mjs";
import {
  BUILD,
  CLIENT_JS,
  CLIENT_LITE,
  CSS,
  FAMILY,
  MAP,
  PRACTICE,
} from "./generated/bundle.generated.js";
import { generate, lineTask, tableTask } from "./generators.js";
import { guide, icon, scene, sceneFor, unitArt } from "./illustrations.js";
import { renderVisual } from "./math-visuals.js";
import { bi, biMath, genBody, genCheck, h, lineBody, mathText, tableBody } from "./problem-view.js";
import { t, UI } from "./strings.js";

const ORIGIN = "https://eduwonderlab.com";
const TAXONOMY_LABELS = MAP.taxonomyLabels || {};

function seededShuffle(arr, seedStr) {
  let s = 0;
  for (const ch of seedStr) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const a = arr.map((x, i) => [x, i]);
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  // never leave a match column in its original order (that would give the answer away)
  if (a.every(([, i], k) => i === k) && a.length > 1) a.push(a.shift());
  return a;
}

const TYPE_ICON = {
  mc: "mc",
  numeric: "numeric",
  select: "select",
  match: "match",
  error: "error",
  explain: "explain",
  gen: "numeric",
  fixit: "error",
  table: "table",
  line: "visual",
};
const TYPE_LABEL = {
  mc: { en: "Multiple choice", es: "Opción múltiple" },
  numeric: { en: "Type the number", es: "Escribe el número" },
  select: { en: "Select all", es: "Selecciona todas" },
  match: { en: "Match", es: "Une" },
  error: { en: "Find the mistake", es: "Encuentra el error" },
  explain: { en: "Explain", es: "Explica" },
  gen: { en: "Solve", es: "Resuelve" },
  fixit: { en: "Fix the mistake", es: "Corrige el error" },
  table: { en: "Complete the table", es: "Completa la tabla" },
  line: { en: "Place it on the number line", es: "Ubícalo en la recta numérica" },
};

function shell({
  title,
  description,
  lang = "en",
  body,
  data = null,
  page,
  canonical,
  noindex = false,
}) {
  const pre = `(function(){var d=document.documentElement;try{var l=JSON.parse(localStorage.getItem("ewl_pfa_lang"));var q=new URLSearchParams(location.search).get("lang");l=q==="es"||q==="en"?q:l;if(l==="es"||l==="en")d.lang=l;var s=JSON.parse(localStorage.getItem("ewl_pfa_size"));if(s===1)d.classList.add("text-lg");if(s===2)d.classList.add("text-xl");if(JSON.parse(localStorage.getItem("ewl_pfa_motion")))d.classList.add("reduce-motion")}catch(e){}d.classList.add("js");d.classList.remove("no-js")})();`;
  return `<!doctype html>
<html lang="${lang}" class="no-js" data-page="${page}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(title)}</title>
<meta name="description" content="${h(description)}">
${noindex ? '<meta name="robots" content="noindex">' : ""}
<link rel="canonical" href="${ORIGIN}${canonical}">
<meta name="theme-color" content="#17324D">
<link rel="icon" href="data:,">
<meta name="pfa-build" content="${BUILD}">
<link rel="preload" href="/assets/fonts/atkinson-hyperlegible-0aa3443e.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
<script>${pre}</script>
</head>
<body>
<a class="skip" href="#main">${bi("skip")}</a>
${body}
<div id="pfa-live" class="sr" aria-live="polite" aria-atomic="true"></div>
${data ? `<script type="application/json" id="pfa-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>` : ""}
<script type="module">${page === "pfa-homework" ? CLIENT_JS : CLIENT_LITE}</script>
</body>
</html>`;
}

function topBar(homeHref = "/curriculum/units/") {
  return `<header class="bar"><div class="bar-in"><a class="brand" href="${homeHref}" aria-label="EduWonderLab">${icon("home")} <span>EduWonderLab</span></a>
<div class="seg" role="group" aria-label="${UI.language.en} / ${UI.language.es}"><button class="tool" type="button" data-set-lang="en" lang="en" aria-pressed="true">English</button><button class="tool" type="button" data-set-lang="es" lang="es" aria-pressed="false">Español</button></div>
<button class="tool" type="button" data-act="text-size" aria-pressed="false">${icon("text")}<span class="sr">${bi("textSize")}</span></button>
<button class="tool" type="button" data-act="motion" aria-pressed="false">${icon("motion")}<span class="lbl-wide">${bi("reduceMotion")}</span></button>
<button class="tool" type="button" data-act="print">${icon("print")}<span class="sr">${bi("print")}</span></button>
</div></header>`;
}

function player(ref, id, { narrateLabel = "listen" } = {}) {
  if (!ref?.steps?.length) return "";
  const vis = ref.visual
    ? `<div class="player-figure">${renderVisual({ ...ref.visual, alt: ref.vizAlt?.en || ref.visual.alt })}</div>`
    : "";
  const steps = `<ol class="steps">${ref.steps.map((s) => `<li>${biMath(s)}</li>`).join("")}</ol>`;
  return `<div class="player" id="${id}">${vis}${steps}
<div class="row player-controls no-print" role="group" aria-label="${UI.refresher.en}">
<button class="btn amber" type="button" data-player="again">${icon("replay")}<span>${bi("showAgain")}</span></button>
<button class="btn quiet" type="button" data-player="prev" aria-label="${UI.prevStep.en}">${icon("prev")}<span class="sr">${bi("prevStep")}</span></button>
<button class="btn primary" type="button" data-player="play" aria-pressed="false">${icon("play")}<span class="lbl">${bi("play")}</span></button>
<button class="btn quiet" type="button" data-player="next" aria-label="${UI.nextStep.en}">${icon("next")}<span class="sr">${bi("nextStep")}</span></button>
<button class="btn quiet" type="button" data-player="narrate" aria-pressed="false">${icon("audio")}<span>${bi(narrateLabel)}</span></button>
<span class="player-status" aria-hidden="true"></span>
</div></div>`;
}

// ---------------------------------------------------------------------------------------------
// Homework
function problemCard(p, n, lessonId) {
  const pid = p.id;
  const top = `<div class="p-top"><span class="p-num" aria-hidden="true">${n}</span>${icon(TYPE_ICON[p.type] || "numeric")}<span>${bi(TYPE_LABEL[p.type])}</span></div>`;
  let body = "";
  let check = {
    n,
    hints: p.hints || null,
    solution: p.solution || null,
    misconception: p.misconception,
  };
  const art = (txt) => {
    const sc = sceneFor(txt);
    return sc ? `<div class="p-art" aria-hidden="true">${scene(sc)}</div>` : "";
  };
  if (p.type === "mc") {
    body = `${art(p.prompt.en)}<p class="p-prompt" id="${pid}-q">${biMath(p.prompt)}</p><fieldset class="choices" aria-describedby="${pid}-fb"><legend class="sr">${bi("yourAnswer")}</legend>${p.choices.map((c, i) => `<label class="choice"><input type="radio" name="${pid}-c" value="${i}"> <span>${biMath(c.text)}</span></label>`).join("")}</fieldset>`;
    check = {
      ...check,
      kind: "mc",
      correct: p.choices.findIndex((c) => c.correct),
      why: p.choices.map((c) => c.why),
    };
  } else if (p.type === "numeric") {
    body = `${art(p.prompt.en)}<p class="p-prompt" id="${pid}-q">${biMath(p.prompt)}</p><div class="answer-row"><label class="sr" for="${pid}-in">${bi("yourAnswer")}</label><input type="text" id="${pid}-in" inputmode="decimal" autocomplete="off" aria-describedby="${pid}-q ${pid}-fb"></div>`;
    check = {
      ...check,
      kind: "entry",
      answer: p.answer,
      answerType: "number",
      known: p.known.map((k) => ({ value: k.value, why: k.why, tag: k.tag })),
    };
  } else if (p.type === "select") {
    body = `<p class="p-prompt" id="${pid}-q">${biMath(p.prompt)}</p><fieldset class="choices" aria-describedby="${pid}-fb"><legend class="sr">${bi("selectAll")}</legend>${p.options.map((o) => `<label class="choice"><input type="checkbox"> <span>${biMath(o.text)}</span></label>`).join("")}</fieldset>`;
    check = { ...check, kind: "select", correct: p.options.map((o) => o.correct) };
  } else if (p.type === "match") {
    const rights = seededShuffle(p.pairs, pid);
    body = `<p class="p-prompt" id="${pid}-q">${biMath(p.prompt)}</p><p class="tier-note">${bi("matchHow")}</p><div class="match-grid" role="group" aria-labelledby="${pid}-q"><div>${p.pairs.map((pr, i) => `<button type="button" class="chip" data-side="l" data-i="${i}" aria-pressed="false">${biMath(pr.left)}<span class="pair-tag" aria-hidden="true"></span></button>`).join("")}</div><div>${rights.map(([pr, i]) => `<button type="button" class="chip" data-side="r" data-i="${i}">${biMath(pr.right)}<span class="pair-tag" aria-hidden="true"></span></button>`).join("")}</div></div>`;
    check = { ...check, kind: "match", pairs: p.pairs.map((_, i) => i) };
  } else if (p.type === "error") {
    body = `<p class="p-prompt" id="${pid}-q">${biMath(p.prompt)}</p><ol class="work-steps">${p.steps.map((s) => `<li><strong>${bi(s.label)}:</strong> ${biMath(s.work)}</li>`).join("")}</ol><fieldset class="choices" aria-describedby="${pid}-fb"><legend>${bi("whichStep")}</legend>${p.steps.map((s, i) => `<label class="choice"><input type="radio" name="${pid}-c" value="${i}"> <span>${bi({ en: `Step ${i + 1}: ${s.label.en}`, es: `Paso ${i + 1}: ${s.label.es}` })}</span></label>`).join("")}</fieldset>`;
    check = { ...check, kind: "error", correct: p.errorStep, fix: p.fix, why: null };
  } else if (p.type === "explain") {
    body = `<p class="p-prompt" id="${pid}-q">${biMath(p.prompt)}</p><p class="frame"><span class="sr">${bi("frameLabel")}: </span>${bi(p.frame)}</p><label for="${pid}-t">${bi("writeHere")}</label><textarea id="${pid}-t" aria-describedby="${pid}-q ${pid}-fb"></textarea>`;
    check = { ...check, kind: "explain", model: p.model };
  } else if (p.type === "table") {
    const tk = tableTask(p.gen, p.seed);
    body = tableBody(tk, pid);
    check = {
      ...check,
      kind: "table",
      answerType: "number",
      blanks: tk.blanks.map((b) => b.answer),
      solution: tk.steps,
      hints: p.hints || lessonHints(lessonId),
    };
  } else if (p.type === "line") {
    const tk = lineTask(p.gen, p.seed);
    body = lineBody(tk, pid);
    check = {
      ...check,
      kind: "line",
      answerType: "number",
      accept: tk.accept,
      known: (tk.distractors || []).map((d) => ({ value: d.value, why: d.why, tag: d.tag })),
      solution: tk.steps,
      hints: p.hints || lessonHints(lessonId),
    };
  } else if (p.type === "gen" || p.type === "fixit") {
    const g = generate(p.gen, p.seed);
    const sc = !g.visual ? art(g.stem.en) : "";
    body = sc + genBody(g, pid, { fixit: p.type === "fixit" });
    check = {
      ...check,
      ...genCheck(g, p.type === "fixit"),
      hints: p.hints || lessonHints(lessonId),
      solution: g.steps,
    };
  }
  const checkLabel = p.type === "explain" ? "checkThinking" : "check";
  const html = `<article class="problem" id="p-${pid}" data-pid="${pid}" data-type="${p.type}" aria-labelledby="${pid}-h">
<h3 class="sr" id="${pid}-h">${bi("problem")} ${n}</h3>${top}${body}
<div class="print-lines" aria-hidden="true"><div class="answer-line"></div></div>
<div class="actions no-print"><button class="btn primary" type="button" data-act="check">${icon("check")}<span>${bi(checkLabel)}</span></button><button class="btn quiet" type="button" data-act="hint">${icon("hint")}<span>${bi("hint")}</span></button><button class="btn quiet" type="button" data-act="say">${icon("audio")}<span>${bi("readAloud")}</span></button><button class="btn quiet" type="button" data-act="similar">${icon("retry")}<span>${bi("similar")}</span></button></div>
<div class="feedback" id="${pid}-fb"></div><div class="hint-slot"></div></article>`;
  return { html, check };
}

function lessonHints(lessonId) {
  const d = PRACTICE[lessonId];
  const withHints = d?.problems.find((p) => p.hints);
  return (
    withHints?.hints || {
      conceptual: {
        en: "What is the question asking for? Find the numbers that matter.",
        es: "¿Qué pide la pregunta? Busca los números importantes.",
      },
      procedural: {
        en: "Write the first step as a number sentence, then do it.",
        es: "Escribe el primer paso como una operación y luego resuélvelo.",
      },
    }
  );
}

function hero(d, kindKey, extraMeta = "") {
  const lessonLabel = {
    en: `Unit ${d.unit} · Lesson ${d.lessonId}`,
    es: `Unidad ${d.unit} · Lección ${d.lessonId}`,
  };
  return `<section class="hero" aria-labelledby="title"><div><p class="eyebrow">${bi(lessonLabel)} · ${h(d.standard)}${d.ccss ? ` (${h(d.ccss)})` : ""} · ${bi(kindKey)}</p>
<h1 id="title">${bi({ en: d.title.en, es: d.title.es || d.title.en })}</h1>
${extraMeta}</div><div>${unitArt(d.unit)}</div></section>`;
}

export function renderHomework(id) {
  const d = PRACTICE[id];
  if (!d) return null;
  const cards = [];
  const checks = {};
  let n = 0;
  const tiers = [1, 2, 3].map((tier) => {
    const items = d.problems.filter((p) => p.tier === tier);
    const html = items
      .map((p) => {
        n += 1;
        const c = problemCard(p, n, id);
        checks[p.id] = c.check;
        return c.html;
      })
      .join("");
    const badge = { 1: "warm", 2: "build", 3: "stretch" }[tier];
    return `<section class="tier tier-${tier}" aria-labelledby="tier-${tier}"><div class="tier-head"><h2 id="tier-${tier}" class="tier-badge">${icon(badge)}${bi(`tier${tier}`)}</h2><p class="tier-note">${bi(`tier${tier}Note`)}</p></div>${html}</section>`;
  });
  cards.push(...tiers);
  const goal = `<p class="goal"${d.objective.translation ? ` data-translation="${d.objective.translation}"` : ""}>${bi({ en: d.objective.en, es: d.objective.es || d.objective.en })}</p>`;
  const meta = `<ul class="meta"><li>${bi("minutes", "span", { n: d.minutes })}</li><li>${bi("problemsCount", "span", { n })}</li><li>${bi("savedHere")}</li><li class="streak" hidden></li></ul>
<div class="progress"><div class="progress-track" role="progressbar" aria-label="${UI.progress.en.replace(/\{.*$/, "").trim() || "Progress"}" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="0"><div class="progress-fill"></div></div><div class="progress-label" aria-hidden="true"></div></div>`;
  const vocab = d.vocab.length
    ? `<section class="section print-hide" aria-labelledby="vocab-h"><h2 id="vocab-h">${icon("book")}${bi("vocab")}</h2><div class="vocab">${d.vocab
        .map(
          (v, i) =>
            `<div class="word" id="w-${i}"><h3><span>${bi(v.term)}</span><button class="btn quiet" type="button" data-say="#w-${i}" aria-label="${h(`${UI.listen.en}: ${v.term.en}`)}">${icon("audio")}<span class="sr">${bi("listen")}</span></button></h3><p>${bi(v.def)}</p></div>`,
        )
        .join("")}</div></section>`
    : "";
  const reflect = `<section class="section reflect-section" aria-labelledby="reflect-h"><h2 id="reflect-h">${icon("pencil")}${bi("reflect")}</h2>
<fieldset class="rating"><legend>${bi("confidence")}</legend>${[1, 2, 3, 4].map((k) => `<label><input type="radio" name="conf" value="${k}"> ${bi(`conf${k}`)}</label>`).join("")}</fieldset>
<p class="frame">${bi(d.reflect.frame)}</p><label for="reflect-text">${bi("writeReflection")}</label><textarea id="reflect-text"></textarea></section>`;
  const finish = `<div class="row no-print" style="margin-top:24px"><button class="btn amber" type="button" data-act="finish">${icon("star")}<span>${bi("finish")}</span></button><a class="btn quiet" href="/lessons/${id}/family-guide">${icon("family")}<span>${bi("familyGuide")}</span></a><a class="btn quiet" href="/lessons/${id}/">${icon("book")}<span>${bi("lessonLink")}</span></a><button class="btn quiet" type="button" data-act="reset">${icon("retry")}<span>${bi("startOver")}</span></button></div>
<section class="section finish" id="finish" hidden aria-labelledby="finish-h">${guide("cheer")}<h2 id="finish-h" tabindex="-1" style="justify-content:center">${bi("finishTitle")}</h2>
<p class="score"><span class="score-num">0</span> / <span class="score-total">${n}</span></p><p>${bi("firstTry")}</p>
<h3>${bi("revisit")}</h3><ul class="revisit"></ul>
<div class="teacher-card"><h3>${icon("star")} ${bi("showTeacher")}</h3><dl><dt>${bi("lesson")}</dt><dd>${h(id)} · ${bi(d.title.es ? d.title : { en: d.title.en, es: d.title.en })}</dd><dt>${bi("date")}</dt><dd class="tc-date"></dd><dt>${bi("score")}</dt><dd class="tc-score"></dd><dt>${bi("confidenceShort")}</dt><dd class="tc-conf"></dd><dt>${bi("revisit")}</dt><dd class="tc-revisit"></dd></dl><p class="tier-note">${bi("showTeacherNote")}</p></div></section>
<dialog id="reset-dialog"><p>${bi("confirmStart")}</p><div class="row"><button class="btn primary" type="button" data-act="reset-yes">${bi("yes")}</button><button class="btn quiet" type="button" data-act="reset-no">${bi("no")}</button></div></dialog>`;
  const body = `${topBar()}<main id="main">${hero(d, "homework", goal + meta)}
<noscript><p class="section">${bi("noJs")}</p></noscript>
<section class="section print-hide" aria-labelledby="ref-h"><h2 id="ref-h">${icon("play")}${bi("refresher")}</h2><p class="tier-note">${bi("refresherNote")}</p><h3>${bi(d.refresher.title)}</h3>${player(d.refresher, "refresher")}</section>
${cards.join("")}${vocab}${reflect}${finish}</main>
<footer class="foot"><p>${bi("savedHere")} · ${h(d.standard)}</p></footer>`;
  return shell({
    title: `${id} ${d.title.en} · Homework practice · EduWonderLab`,
    description: `Homework practice for Lesson ${id}, ${d.title.en}: worked example, ${n} problems with hints, English and Spanish.`,
    body,
    page: "pfa-homework",
    canonical: `/lessons/${id}/practice`,
    data: {
      lessonId: id,
      similar: d.similar,
      problems: checks,
      lessonHints: lessonHints(id),
      guideThink: `<span class="hint-guide">${guide("think")}</span>`,
    },
  });
}

// ---------------------------------------------------------------------------------------------
// Family guide
export function renderFamily(id) {
  const f = FAMILY[id];
  const d = PRACTICE[id];
  if (!f || !d) return null;
  const doDont =
    f.doThis && f.notThat
      ? `<div class="do-dont"><div class="do"><h3>${icon("check")} ${bi("famDo")}</h3><p>${biMath(f.doThis)}</p>${f.doWhy ? `<p>${biMath(f.doWhy)}</p>` : ""}</div><div class="dont"><h3>${bi("famDont")}</h3><p>${biMath(f.notThat)}</p></div></div>`
      : "";
  const words = f.words.length
    ? `<div class="vocab">${f.words.map((w, i) => `<div class="word" id="fw-${i}"><h3><span>${bi(w.term)}</span><button class="btn quiet" type="button" data-say="#fw-${i}" aria-label="${h(`${UI.listen.en}: ${w.term.en}`)}">${icon("audio")}<span class="sr">${bi("listen")}</span></button></h3><p>${bi(w.def)}</p></div>`).join("")}</div>`
    : "";
  const tryIt = f.tryIt
    .map(
      (q, i) =>
        `<div class="aitem"><p><strong>${i + 1}.</strong> ${biMath(q.prompt)}</p><details class="reveal"><summary>${icon("hint")} ${bi("famShow")}</summary><div class="reveal-body"><p><strong>${biMath(q.answer)}</strong></p><p>${biMath(q.why)}</p></div></details></div>`,
    )
    .join("");
  const body = `${topBar()}<main id="main">
<section class="hero family-hero" aria-labelledby="title"><div><p class="eyebrow">${bi({ en: `Unit ${f.unit} · Lesson ${id}`, es: `Unidad ${f.unit} · Lección ${id}` })} · ${bi("forFamilies")}</p><h1 id="title">${bi({ en: f.title.en, es: f.title.es || f.title.en })}</h1><p class="goal">${bi("famOptional")}</p></div><div>${scene("home", null)}</div></section>
<section class="section" aria-labelledby="learn-h"><h2 id="learn-h">${icon("book")}${bi("famLearning")}</h2><p>${biMath(f.learning)}</p><h3>${bi("famWhy")}</h3><p>${biMath(f.whyItMatters)}</p></section>
<section class="section" aria-labelledby="how-h"><h2 id="how-h">${icon("play")}${bi("famHow")}</h2>${player(d.refresher, "family-example")}${doDont}</section>
<section class="section" aria-labelledby="words-h"><h2 id="words-h">${icon("lang")}${bi("famWords")}</h2>${words}</section>
<section class="section" aria-labelledby="try-h"><h2 id="try-h">${icon("family")}${bi("famTry")}</h2>${tryIt}<p class="print-only fam-answers"><strong>${bi({ en: "Answers for the grown-up:", es: "Respuestas para el adulto:" })}</strong> ${f.tryIt.map((q, i) => `${i + 1}) ${biMath(q.answer)}`).join(" · ")}</p></section>
<section class="section" aria-labelledby="talk-h"><h2 id="talk-h">${icon("explain")}${bi("famTalk")}</h2><p class="tier-note">${bi("famTalkNote")}</p><ul class="talk">${f.conversation.map((c) => `<li>${icon("explain")}<span>${biMath(c)}</span></li>`).join("")}</ul></section>
<section class="section" aria-labelledby="stuck-h"><h2 id="stuck-h">${icon("hint")}${bi("famStuck")}</h2><ol>${f.stuck.map((s) => `<li>${biMath(s)}</li>`).join("")}</ol>
<div class="row no-print"><a class="btn primary" href="/lessons/${id}/practice">${icon("pencil")}<span>${bi("famPractice")}</span></a><button class="btn quiet" type="button" data-act="print">${icon("print")}<span>${bi("famPrint")}</span></button><a class="btn quiet" href="/practice-hub/family/unit-${f.unit}">${icon("family")}<span>${bi("familyHub")}</span></a></div></section>
</main><footer class="foot"><p>${bi("famOptional")} · ${h(f.standard)}</p></footer>`;
  return shell({
    title: `${id} ${f.title.en} · Family guide · EduWonderLab`,
    description: `Family guide for Lesson ${id}, ${f.title.en}, in English and Spanish: what your child is learning, an example, words to know, and problems to try together.`,
    body,
    page: "pfa-family",
    canonical: `/lessons/${id}/family-guide`,
    data: { lessonId: id, similar: d.similar, problems: {} },
  });
}

// ---------------------------------------------------------------------------------------------
// Assignment and key
function assignmentItems(d) {
  const out = d.assignment
    .map((p) => {
      if (p.type === "table") {
        const tk = tableTask(p.gen, p.seed);
        const ans = tk.blanks.map((b) => b.answer).join(", ");
        return {
          p,
          block: tableBody(tk, p.id, { print: true }),
          keyBlock: tableBody(tk, p.id, { key: true }),
          answer: { en: ans, es: ans },
          steps: tk.steps,
          tag: p.misconception,
        };
      }
      if (p.type === "line") {
        const tk = lineTask(p.gen, p.seed);
        return {
          p,
          block: lineBody(tk, p.id, { print: true }),
          answer: { en: tk.answerText, es: tk.answerTextEs || tk.answerText },
          steps: tk.steps,
          tag: p.misconception,
        };
      }
      if (p.type === "gen") {
        const g = generate(p.gen, p.seed);
        return {
          p,
          prompt: g.stem,
          visual: g.visual,
          choices: g.kind === "mc" ? g.choices.map((c) => ({ en: c, es: c })) : null,
          unit: g.unit || null,
          answer: g.unit
            ? { en: `${g.answer} ${g.unit.en}`, es: `${g.answer} ${g.unit.es}` }
            : { en: g.answer, es: g.answer },
          steps: g.steps,
          tag: p.misconception,
        };
      }
      if (p.type === "mc")
        return {
          p,
          prompt: p.prompt,
          choices: p.choices.map((c) => c.text),
          answer: (() => {
            const k = p.choices.findIndex((c) => c.correct);
            return {
              en: `${String.fromCharCode(65 + k)}. ${p.choices[k].text.en}`,
              es: `${String.fromCharCode(65 + k)}. ${p.choices[k].text.es}`,
            };
          })(),
          steps: p.solution,
          tag: p.misconception,
        };
      if (p.type === "numeric")
        return {
          p,
          prompt: p.prompt,
          answer: { en: p.answer, es: p.answer },
          steps: p.solution,
          tag: p.misconception,
        };
      if (p.type === "select")
        return {
          p,
          prompt: p.prompt,
          options: p.options.map((o) => o.text),
          answer: {
            en: p.options
              .filter((o) => o.correct)
              .map((o) => o.text.en)
              .join("; "),
            es: p.options
              .filter((o) => o.correct)
              .map((o) => o.text.es)
              .join("; "),
          },
          steps: p.solution,
          tag: p.misconception,
        };
      if (p.type === "match")
        return {
          p,
          prompt: p.prompt,
          pairs: p.pairs,
          answer: {
            en: p.pairs.map((x) => `${x.left.en} → ${x.right.en}`).join("; "),
            es: p.pairs.map((x) => `${x.left.es} → ${x.right.es}`).join("; "),
          },
          steps: p.solution,
          tag: p.misconception,
        };
      if (p.type === "error")
        return {
          p,
          prompt: p.prompt,
          work: p.steps,
          answer: {
            en: `Step ${p.errorStep + 1}. ${p.fix.en}`,
            es: `Paso ${p.errorStep + 1}. ${p.fix.es}`,
          },
          steps: p.solution,
          tag: p.misconception,
        };
      return null;
    })
    .filter(Boolean);
  const anchor = out.find((x) => x.p.type === "gen") || out.find((x) => !x.block) || out[0];
  const k = out.indexOf(anchor) + 1;
  out.push({
    p: { type: "explain", misconception: anchor.tag },
    prompt: {
      en: `Explain how you solved problem ${k}. Use the frame: "I know ___ because ___."`,
      es: `Explica cómo resolviste el problema ${k}. Usa el marco: "Sé que ___ porque ___."`,
    },
    explain: true,
    answer: {
      en: "Answers vary. A strong answer names the steps below and checks the result.",
      es: "Las respuestas varían. Una respuesta completa nombra los pasos de abajo y comprueba el resultado.",
    },
    steps: anchor.steps,
    tag: anchor.tag,
  });
  return out;
}

function assignmentHeader(d, key) {
  return `<section class="hero" aria-labelledby="title"><div><p class="eyebrow">${bi({ en: `Unit ${d.unit} · Lesson ${d.lessonId}`, es: `Unidad ${d.unit} · Lección ${d.lessonId}` })} · ${bi("standard")} ${h(d.standard)}${d.ccss ? ` (${h(d.ccss)})` : ""} ${key ? `<span class="teacher-only">${bi("keyTitle")}</span>` : ""}</p>
<h1 id="title">${bi({ en: d.title.en, es: d.title.es || d.title.en })}</h1><p class="goal"${d.objective.translation ? ` data-translation="${d.objective.translation}"` : ""}>${bi({ en: d.objective.en, es: d.objective.es || d.objective.en })}</p>
<ul class="meta"><li>${bi("minutes", "span", { n: 20 })}</li><li>${bi("assignment")}</li></ul></div><div>${unitArt(d.unit)}</div></section>`;
}

function renderAssignmentPage(id, key) {
  const d = PRACTICE[id];
  if (!d) return null;
  const items = assignmentItems(d);
  const list = items
    .map((it, i) => {
      const choices = it.choices
        ? `<ol type="A">${it.choices.map((c) => `<li>${biMath(c)}</li>`).join("")}</ol>`
        : "";
      const options = it.options
        ? `<ul>${it.options.map((o) => `<li>☐ ${biMath(o)}</li>`).join("")}</ul>`
        : "";
      const pairs = it.pairs
        ? `<div class="match-grid" style="grid-template-columns:1fr 1fr"><ol>${it.pairs.map((x) => `<li>${biMath(x.left)}</li>`).join("")}</ol><ol type="A">${seededShuffle(
            it.pairs,
            `${id}-${i}`,
          )
            .map(([x]) => `<li>${biMath(x.right)}</li>`)
            .join("")}</ol></div>`
        : "";
      const work = it.work
        ? `<ol class="work-steps">${it.work.map((s) => `<li><strong>${bi(s.label)}:</strong> ${biMath(s.work)}</li>`).join("")}</ol>`
        : "";
      const vis = it.visual ? `<div class="p-visual">${renderVisual(it.visual)}</div>` : "";
      const keyBox = key
        ? `<div class="key-answer"><strong>${bi("asAnswer")}:</strong> ${biMath(it.answer)}${it.steps ? `<ol class="lang-en" lang="en">${(it.steps.en || []).map((s) => `<li>${mathText(s)}</li>`).join("")}</ol><ol class="lang-es" lang="es">${(it.steps.es || []).map((s) => `<li>${mathText(s)}</li>`).join("")}</ol>` : ""}${it.tag && TAXONOMY_LABELS[it.tag] ? `<p><strong>${bi("keyMisconception")}:</strong> ${bi(TAXONOMY_LABELS[it.tag])}</p>` : ""}</div>`
        : it.block
          ? ""
          : `<p class="tier-note">${bi("asWork")}</p><div class="workspace"></div><p>${bi("asAnswer")}: </p><div class="answer-line"></div>`;
      const frame =
        it.explain && !key ? `<div class="answer-line"></div><div class="answer-line"></div>` : "";
      return `<div class="aitem" id="a${i + 1}"><h2 style="font-size:1.05rem"><span class="p-num" aria-hidden="true">${i + 1}</span><span class="sr">${bi("problem")} ${i + 1}</span></h2>${it.block ? (key && it.keyBlock ? it.keyBlock : it.block) : `<p>${biMath(it.prompt)}</p>`}${vis}${choices}${options}${pairs}${work}${frame}${keyBox}</div>`;
    })
    .join("");
  const directions = key
    ? `<p class="tier-note">${bi("keyNote")}</p>`
    : `<h2>${bi("asDirections")}</h2><ol class="directions">${["asD1", "asD2", "asD3", "asD4"].map((k) => `<li>${bi(k)}</li>`).join("")}</ol><p>${bi("asName")}: ______________________</p>`;
  const body = `${topBar(key ? "/practice-hub/" : "/curriculum/units/")}<main id="main">${assignmentHeader(d, key)}<section class="section">${directions}</section><section class="section aitems" aria-label="${UI.assignment.en}">${list}</section>
<div class="row no-print" style="margin-top:24px"><button class="btn primary" type="button" data-act="print">${icon("print")}<span>${bi("print")}</span></button>${key ? `<a class="btn quiet" href="/lessons/${id}/assignment">${bi("assignment")}</a>` : `<a class="btn quiet" href="/lessons/${id}/practice">${bi("homework")}</a>`}</div></main>`;
  return shell({
    title: `${id} ${d.title.en} · ${key ? "Assignment answer key" : "Assignment"} · EduWonderLab`,
    description: key
      ? `Answer key for the Lesson ${id} assignment, with full solutions.`
      : `Printable assignment for Lesson ${id}, ${d.title.en}, in English and Spanish.`,
    body,
    page: key ? "pfa-answer-key" : "pfa-assignment",
    canonical: `/lessons/${id}/${key ? "assignment-answer-key" : "assignment"}`,
    noindex: key,
    data: { lessonId: id, problems: {} },
  });
}
export const renderAssignment = (id) => renderAssignmentPage(id, false);
export const renderAnswerKey = (id) => renderAssignmentPage(id, true);

// ---------------------------------------------------------------------------------------------
// Hubs
function unitTitle(u) {
  return typeof u.title === "object" ? u.title : { en: String(u.title), es: String(u.title) };
}

export function renderHub() {
  const units = MAP.units
    .map((u) => {
      const rows = u.lessons
        .map((lid) => {
          const L = MAP.lessons.find((x) => x.id === lid);
          const links = [
            ["homework", L.urls.homework, "pencil", true],
            ["familyGuide", L.urls.family, "family", true],
            ["assignment", L.urls.assignment, "mc", true],
            ["answerKey", L.urls.answerKey, "key", false],
          ];
          const kindOf = {
            homework: "practice",
            familyGuide: "family-guide",
            assignment: "assignment",
          };
          return `<tr><td><strong>${h(lid)}</strong></td><td>${h(L.title)}<br><span class="tier-note">${h(L.standard)}</span></td><td><div class="hub-links">${links
            .map(
              ([k, url, , student]) =>
                `<a class="btn quiet" href="${url}"><span>${bi(k)}</span></a>${student ? `<button class="btn quiet" type="button" data-act="copy" data-url="${url}" aria-label="${h(`${UI.copyLink.en}: ${UI[k].en} ${lid}`)}">${icon("copy")}<span class="lbl sr">${bi("copyLink")}</span></button><details class="qr-pop"><summary class="btn quiet" aria-label="${h(`QR: ${UI[k].en} ${lid}`)}">${icon("qr")}</summary><div class="qr-card"><img src="/practice-hub/qr/${lid}/${kindOf[k]}.svg" width="176" height="176" loading="lazy" alt="${h(`QR code for ${UI[k].en}, lesson ${lid}`)}"></div></details>` : `<span class="teacher-only">${bi("keyTitle")}</span>`}`,
            )
            .join("")}</div></td></tr>`;
        })
        .join("");
      return `<section class="section hub-unit" aria-labelledby="u${u.number}"><h2 id="u${u.number}">${bi("unit")} ${u.number}: ${bi(unitTitle(u))}</h2><p><a class="btn quiet" href="${u.familyHub}">${icon("family")}<span>${bi("familyHub")}</span></a></p><table class="hub-table"><thead><tr><th scope="col">${bi("lesson")}</th><th scope="col">${bi("standard")}</th><th scope="col">${bi("homework")} · ${bi("familyGuide")} · ${bi("assignment")} · ${bi("answerKey")}</th></tr></thead><tbody>${rows}</tbody></table></section>`;
    })
    .join("");
  const body = `${topBar("/curriculum/")}<main id="main"><section class="hero" aria-labelledby="title"><div><p class="eyebrow">${bi({ en: "For teachers", es: "Para docentes" })}</p><h1 id="title">${bi("hubTitle")}</h1><p>${bi("hubIntro")}</p><p><a class="btn amber" href="/practice-hub/family/">${icon("family")}<span>${bi({ en: "Family pages by unit", es: "Páginas para familias por unidad" })}</span></a></p></div><div>${guide("happy")}</div></section>${units}</main>`;
  return shell({
    title: "Practice, family and assignments · EduWonderLab",
    description:
      "Every core lesson's homework practice, family guide, assignment and answer key, with copy-link and QR codes.",
    body,
    page: "pfa-hub",
    canonical: "/practice-hub/",
    data: { lessonId: "hub", problems: {} },
  });
}

export function renderFamilyHub(n, letter = false) {
  const u = MAP.units.find((x) => x.number === n);
  if (!u) return null;
  const ut = unitTitle(u);
  const items = u.lessons.map((lid) => ({ lid, f: FAMILY[lid] })).filter((x) => x.f);
  if (letter) {
    const body = `${topBar(`/practice-hub/family/unit-${n}`)}<main id="main"><section class="section"><p class="eyebrow">${bi("unit")} ${n}</p><h1 id="title">${bi(ut)}</h1><p>${bi("famLetterGreeting")}</p><p>${bi({ en: UI.famLetterBody.en.replace("{title}", ut.en), es: UI.famLetterBody.es.replace("{title}", ut.es) })}</p>
<ol>${items.map(({ lid, f }) => `<li><strong>${h(lid)} ${bi({ en: f.title.en, es: f.title.es || f.title.en })}:</strong> ${biMath(f.bigIdea)}</li>`).join("")}</ol>
<p>${bi("famOptional")}</p><p>${bi("famLetterClose")}</p><p class="tier-note">${ORIGIN.replace("https://", "")}/practice-hub/family/unit-${n}</p>
<div class="row no-print"><button class="btn primary" type="button" data-act="print">${icon("print")}<span>${bi("print")}</span></button></div></section></main>`;
    return shell({
      title: `Unit ${n} at a glance · Family letter · EduWonderLab`,
      description: `A printable family letter for Unit ${n}, English and Spanish.`,
      body,
      page: "pfa-family-letter",
      canonical: `/practice-hub/family/unit-${n}/letter`,
      data: { lessonId: `u${n}`, problems: {} },
    });
  }
  const cards = items
    .map(
      ({ lid, f }) =>
        `<article class="section"><p class="eyebrow">${bi({ en: `Lesson ${lid}`, es: `Lección ${lid}` })}</p><h2>${bi({ en: f.title.en, es: f.title.es || f.title.en })}</h2><p>${biMath(f.learning)}</p><div class="row"><a class="btn primary" href="/lessons/${lid}/family-guide">${icon("family")}<span>${bi("familyGuide")}</span></a><a class="btn quiet" href="/lessons/${lid}/practice">${icon("pencil")}<span>${bi("homework")}</span></a></div></article>`,
    )
    .join("");
  const body = `${topBar("/curriculum/units/")}<main id="main"><section class="hero" aria-labelledby="title"><div><p class="eyebrow">${bi("forFamilies")}</p><h1 id="title">${bi("famHubTitle", "span", { n })}</h1><p class="goal">${bi(ut)}</p></div><div>${unitArt(n)}</div></section>
<section class="section" aria-labelledby="howto"><h2 id="howto">${icon("hint")}${bi("famHubHow")}</h2><p>${bi("famHubHowBody")}</p><p><a class="btn amber" href="/practice-hub/family/unit-${n}/letter">${icon("print")}<span>${bi("famLetter")}</span></a></p></section>${cards}</main>`;
  return shell({
    title: `Unit ${n} family practice · EduWonderLab`,
    description: `Family pages for every lesson in Unit ${n}, English and Spanish, plus a printable unit letter.`,
    body,
    page: "pfa-family-hub",
    canonical: `/practice-hub/family/unit-${n}`,
    data: { lessonId: `u${n}`, problems: {} },
  });
}

export function renderFamilyIndex() {
  const cards = MAP.units
    .map(
      (u) =>
        `<article class="section"><p class="eyebrow">${bi("unit")} ${u.number}</p><h2>${bi(unitTitle(u))}</h2><div class="row"><a class="btn primary" href="${u.familyHub}">${icon("family")}<span>${bi("famHubTitle", "span", { n: u.number })}</span></a><a class="btn quiet" href="${u.familyHub}/letter">${icon("print")}<span>${bi("famLetter")}</span></a></div></article>`,
    )
    .join("");
  const body = `${topBar("/curriculum/")}<main id="main"><section class="hero" aria-labelledby="title"><div><p class="eyebrow">${bi("forFamilies")}</p><h1 id="title">${bi({ en: "Family practice at home", es: "Práctica en familia en casa" })}</h1><p class="goal">${bi("famOptional")}</p><p>${bi("famHubHowBody")}</p></div><div>${scene("home")}</div></section>${cards}</main>`;
  return shell({
    title: "Family practice at home · EduWonderLab",
    description: "Bilingual family pages for every Grade 6 math unit, with printable unit letters.",
    body,
    page: "pfa-family-index",
    canonical: "/practice-hub/family/",
    data: { lessonId: "families", problems: {} },
  });
}

export function renderQr(id, kind) {
  if (!PRACTICE[id] || !["practice", "family-guide", "assignment"].includes(kind)) return null;
  return qrSvg(`${ORIGIN}/lessons/${id}/${kind}`, { px: 176 });
}

// ---------------------------------------------------------------------------------------------
// Router. Returns a Response, or null when the path is not a PFA page.
const LESSON_ROUTE =
  /^\/lessons\/(\d{1,2}-\d{1,2})\/(practice|family-guide|assignment|assignment-answer-key)\/?$/;
export function routePfa(pathname) {
  let m = pathname.match(LESSON_ROUTE);
  if (m) {
    const [, id, kind] = m;
    const html = {
      practice: renderHomework,
      "family-guide": renderFamily,
      assignment: renderAssignment,
      "assignment-answer-key": renderAnswerKey,
    }[kind](id);
    return html ? { status: 200, type: "text/html; charset=utf-8", body: html } : null;
  }
  if (/^\/practice-hub\/?$/.test(pathname))
    return { status: 200, type: "text/html; charset=utf-8", body: renderHub() };
  if (/^\/practice-hub\/family\/?$/.test(pathname))
    return { status: 200, type: "text/html; charset=utf-8", body: renderFamilyIndex() };
  m = pathname.match(/^\/practice-hub\/family\/unit-(\d{1,2})(\/letter)?\/?$/);
  if (m) {
    const html = renderFamilyHub(Number(m[1]), !!m[2]);
    return html ? { status: 200, type: "text/html; charset=utf-8", body: html } : null;
  }
  m = pathname.match(
    /^\/practice-hub\/qr\/(\d{1,2}-\d{1,2})\/(practice|family-guide|assignment)\.svg$/,
  );
  if (m) {
    const svg = renderQr(m[1], m[2]);
    return svg ? { status: 200, type: "image/svg+xml", body: svg } : null;
  }
  return null;
}

export function pfaResponse(pathname) {
  const r = routePfa(pathname);
  if (!r) return null;
  return new Response(r.body, {
    status: r.status,
    headers: {
      "content-type": r.type,
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
      "x-pfa-build": BUILD,
    },
  });
}

export { t };
