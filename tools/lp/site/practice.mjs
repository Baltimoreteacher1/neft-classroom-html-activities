// Practice pages: /practice/, /practice/<cluster>/, /practice/<cluster>/<domain>/, /practice/<cluster>/<domain>/<set>/.
// Every set page is complete without JavaScript (all items listed, printable); lp/assets/practice.js turns it into
// the one-task-per-screen student mode, adds audio, recording, feedback, teacher view and project view.
import { icon } from "./icons.mjs";
import { DISCLAIMER, t } from "./layout.mjs";
import { CLUSTERS, DOMAINS, ELD, esc, html, PL_LABEL, raw, words } from "./util.mjs";

const LAB_DOMAIN = {
  listening: "/wida-access/listening/",
  reading: "/wida-access/reading/",
  speaking: "/wida-access/speaking/",
  writing: "/wida-access/writing/",
};
export const setPath = (s) => `/practice/${s.cluster}/${s.domain}/${s.slug}/`;
const cluster = (slug) => CLUSTERS.find((c) => c.slug === slug);
const domain = (slug) => DOMAINS.find((d) => d.slug === slug);

export const onPageDisclaimer = () =>
  html`<p class="disclaimer on-page" data-disclaimer><span data-i18n="disclaimer">${DISCLAIMER}</span></p>`;

const chips = (s) =>
  html`<span class="chip">${cluster(s.cluster).label}</span><span class="chip teal">${domain(s.domain).label}</span><span class="chip" title="${ELD[s.eld]}">${s.eld}</span><span class="chip amber">${s.klu}</span><span class="chip">${s.minutes} min</span>`;

function setCard(s) {
  return html`<article class="card">
  <span class="card-icon">${raw(icon(domain(s.domain).icon))}</span>
  <h3><a class="card-link" href="${setPath(s)}">${s.title}</a></h3>
  <p>${s.summary}</p>
  <div class="meta">${chips(s)}</div>
</article>`;
}

export function practiceHome(data) {
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">Practice</span><h1 data-i18n="nav.practice">Practice</h1>
<p class="lede">Pick your grade, then a skill. Every set starts easy and gets harder, from proficiency levels 1–2 up to level 5. No login, and nothing you do leaves this device.</p></div>
<div class="doors">${CLUSTERS.map((c) => {
    const n = data.practice.filter((s) => s.cluster === c.slug).length;
    return html`<article class="card door"><span class="card-icon">${raw(icon("student"))}</span>
  <h2><a class="card-link" href="/practice/${c.slug}/">${c.label}</a></h2><p>${c.note}</p><p class="go">${n} practice sets →</p></article>`;
  })}</div>
<section class="section"><h2>What the four skills look like</h2>
<div class="grid">${DOMAINS.map((d) => html`<div class="card"><span class="card-icon">${raw(icon(d.icon))}</span><h3>${d.label}</h3><p>${d.verb}</p></div>`)}</div></section>
<section class="section note"><p><strong>More practice:</strong> the full <a href="/access-practice-lab/">ACCESS Practice Lab</a> has hundreds more activities, practice tests and a 12-week Road to ACCESS plan.</p></section>
${onPageDisclaimer()}
</div>`;
}

export function clusterPage(data, c) {
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">Practice</span><h1>${c.label}</h1><p class="lede">${c.note} Choose a skill.</p></div>
<div class="grid cols-2">${DOMAINS.map((d) => {
    const sets = data.practice.filter((s) => s.cluster === c.slug && s.domain === d.slug);
    return html`<article class="card"><span class="card-icon">${raw(icon(d.icon))}</span>
  <h2 class="h3"><a class="card-link" href="/practice/${c.slug}/${d.slug}/">${d.label}</a></h2><p>${d.verb}</p>
  <p class="go muted">${sets.length} sets: ${sets.map((s) => s.title).join(" · ")}</p></article>`;
  })}</div>
${onPageDisclaimer()}
</div>`;
}

export function domainPage(data, c, d) {
  const sets = data.practice.filter((s) => s.cluster === c.slug && s.domain === d.slug);
  return html`<div class="wrap">
<div class="page-head"><span class="eyebrow">${c.label}</span><h1>${d.label}</h1><p class="lede">${d.verb} Each set has easier and harder parts, so everyone can start.</p></div>
<div class="grid cols-3">${sets.map(setCard)}</div>
<section class="section note"><p>Want more ${d.label.toLowerCase()} practice? Try the <a href="${LAB_DOMAIN[d.slug]}">${d.label} studio</a> or the <a href="/access-practice-lab/">full Practice Lab</a>.</p></section>
${onPageDisclaimer()}
</div>`;
}

/* ---------- set pages ---------- */

const LETTERS = "ABCD";
function visual(v, iconFn = icon) {
  if (!v) return "";
  if (v.type === "icons")
    return html`<div class="visual-icons" role="img" aria-label="${v.alt}">${v.icons.map((n) => raw(iconFn(n)))}</div>`;
  if (v.type === "table")
    return html`<div class="table-wrap"><table>${v.caption ? html`<caption class="visually-hidden">${v.caption}</caption>` : ""}<thead><tr>${v.headers.map((h) => html`<th scope="col">${h}</th>`)}</tr></thead><tbody>${v.rows.map((r) => html`<tr>${r.map((cell) => html`<td>${cell}</td>`)}</tr>`)}</tbody></table></div>${v.caption ? html`<p class="muted">${v.caption}</p>` : ""}`;
  return "";
}

/** Wrap glossary terms in the passage text with buttons (first occurrence per paragraph-set). */
function glossed(text, glossary, used) {
  let out = esc(text);
  for (const g of glossary) {
    if (used.has(g.term.toLowerCase())) continue;
    const re = new RegExp(`\\b(${g.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "i");
    if (re.test(out)) {
      out = out.replace(
        re,
        `<button type="button" class="term" data-term="${esc(g.term)}">$1</button>`,
      );
      used.add(g.term.toLowerCase());
    }
  }
  return out;
}
const sentences = (htmlText) =>
  htmlText
    .split(/(?<=[.!?])\s+(?=[A-Z"“])/)
    .map((s) => `<span class="sentence">${s}</span>`)
    .join(" ");

function itemCard(item, n, total) {
  return html`<li class="q-card" data-item="${item.id}" id="${item.id}">
  <p class="muted"><span>Question ${n} of ${total}</span> · <span class="chip">${PL_LABEL[item.pl]}</span></p>
  ${visual(item.visual)}
  <p class="q-stem">${item.stem}</p>
  <ul class="choices">${item.choices.map(
    (c, i) =>
      html`<li><button type="button" class="choice" data-choice="${i}" aria-pressed="false"><span class="letter" aria-hidden="true">${LETTERS[i]}</span>${c.icon ? raw(icon(c.icon, { cls: "pic" })) : ""}<span>${c.text}</span></button></li>`,
  )}</ul>
  <div class="feedback" aria-live="polite" hidden></div>
</li>`;
}

function answerKey(set) {
  return html`<section class="teacher-only answer-key" data-teacher hidden>
<h2>Answer key and rationale</h2>
<div class="table-wrap"><table><thead><tr><th scope="col">#</th><th scope="col">Level · ELD · KLU</th><th scope="col">Answer</th><th scope="col">Why the other choices are wrong</th></tr></thead><tbody>
${set.items.map((it, i) => {
  const right = it.choices.findIndex((c) => c.correct);
  return html`<tr><td>${i + 1}</td><td>${PL_LABEL[it.pl]}<br>${it.eld}<br>${it.klu}</td><td><strong>${LETTERS[right]}.</strong> ${it.choices[right].text}${it.compute ? html`<br><span class="muted">${it.compute.expr} = ${it.compute.answer}</span>` : ""}</td><td><ul>${it.choices.map((c, j) => (c.correct ? "" : html`<li><strong>${LETTERS[j]}.</strong> ${c.misconception}</li>`))}</ul></td></tr>`;
})}
</tbody></table></div></section>`;
}

function modeBar(kind) {
  return html`<div class="mode-bar no-print">
  <div class="seg" role="group" aria-label="View">
    <button type="button" data-mode="student" aria-pressed="true" data-i18n="practice.studentMode">Student view</button>
    <button type="button" data-mode="teacher" aria-pressed="false" data-i18n="practice.teacherMode">Teacher view</button>
  </div>
  <div class="btn-row">
    <button type="button" class="btn small secondary" data-print>${raw(icon("print"))}<span data-i18n="practice.print">Print</span></button>
    <button type="button" class="btn small secondary" data-project>${raw(icon("project"))}<span data-i18n="practice.project">Project this</span></button>
  </div>
</div>${kind === "speaking" ? html`<p class="note no-print">${raw(icon("mic"))} <span data-i18n="practice.recordingPrivate">Your recording stays on this device. It is never uploaded.</span></p>` : ""}`;
}

function printHeader(set) {
  return html`<div class="print-only print-header"><span>${set.title} · ${cluster(set.cluster).label} ${domain(set.domain).label}</span><span>Name: ______________________ Date: ________</span></div>`;
}

function readingSet(set) {
  const used = new Set();
  const g = set.passage.glossary || [];
  return html`<div class="practice-shell split">
<section class="source panel passage reading tap-hear" data-content-en aria-labelledby="passage-title">
  <h2 id="passage-title" class="h3">${set.passage.title}</h2>
  ${set.passage.paragraphs.map((p) => raw(`<p>${sentences(glossed(p, g, used))}</p>`))}
  <details class="accordion no-print"><summary><span>Word help</span></summary><div class="body"><dl class="kv">${g.map((x) => html`<dt>${x.term}</dt><dd>${x.definition} <span class="muted" lang="es" data-es-gloss>(${x.es}: ${x.esDefinition})</span></dd>`)}</dl></div></details>
</section>
<ol class="items" data-content-en aria-label="Questions">${set.items.map((it, i) => itemCard(it, i + 1, set.items.length))}</ol>
</div>`;
}

function listeningSet(set) {
  const s = set.script;
  return html`<div class="practice-shell">
<section class="panel listen-panel" data-content-en>
  <h2 class="h3">${s.title}</h2><p class="muted">${s.setting}</p>
  <div class="btn-row no-print" data-audio>
    <button type="button" class="btn" data-play>${raw(icon("play"))}<span data-i18n="practice.play">Play</span></button>
    <label class="label" for="speed-${set.id}"><span data-i18n="practice.speed">Speed</span></label>
    <select id="speed-${set.id}" data-speed><option value="0.75">Slow</option><option value="0.9" selected>Normal</option><option value="1.05">Fast</option></select>
  </div>
  <p class="muted no-print" data-no-speech hidden>This browser cannot read aloud. Read the words below, or ask a teacher to read them.</p>
  <details class="accordion transcript" data-transcript><summary><span data-i18n="practice.transcript">Show the words</span></summary><div class="body reading tap-hear">
  ${s.lines.map((l) => html`<p><strong>${l.speaker}:</strong> <span class="line">${l.text}</span></p>`)}
  </div></details>
</section>
<ol class="items" data-content-en aria-label="Questions">${set.items.map((it, i) => itemCard(it, i + 1, set.items.length))}</ol>
</div>`;
}

function speakingSet(set) {
  return html`<ol class="items tasks" data-content-en aria-label="Speaking tasks">${set.tasks.map(
    (task, i) => html`<li class="q-card task" data-task="${task.id}" id="${task.id}">
  <p class="muted"><span>Task ${i + 1} of ${set.tasks.length}</span> · <span class="chip">${PL_LABEL[task.pl]}</span> · <span class="chip">${task.klu}</span></p>
  ${visual(task.visual)}
  <p class="q-stem">${task.prompt}</p>
  ${task.support ? html`<p class="note">${task.support}</p>` : ""}
  <p class="muted">Think: ${task.thinkSeconds} seconds · Speak: about ${task.responseSeconds} seconds</p>
  <div class="recorder no-print" data-recorder data-think="${task.thinkSeconds}" data-respond="${task.responseSeconds}"></div>
  <details class="accordion"><summary><span data-i18n="practice.models">Hear sample answers</span></summary><div class="body">
  ${task.models.map((m) => html`<div class="model"><p class="lvl">Level ${m.level} sample</p><p class="reading">${m.text}</p><button type="button" class="btn small ghost no-print" data-say="${m.text}">${raw(icon("speaker"))}<span data-i18n="read.listen">Listen</span></button><p class="muted teacher-note">${m.note}</p></div>`)}
  </div></details>
  <fieldset><legend data-i18n="practice.selfCheck">Check yourself</legend>${task.checklist.map((c, j) => html`<label class="check"><input type="checkbox" data-check="${task.id}-${j}"><span>${c}</span></label>`)}</fieldset>
</li>`,
  )}</ol>`;
}

function writingSet(set) {
  return html`<ol class="items tasks" data-content-en aria-label="Writing tasks">${set.tasks.map(
    (task, i) => {
      const paras = (s) => s.split(/\n\n+/).map((p) => html`<p>${p}</p>`);
      return html`<li class="q-card task" data-task="${task.id}" id="${task.id}" data-min="${task.wordTarget[0]}" data-max="${task.wordTarget[1]}">
  <p class="muted"><span>Task ${i + 1} of ${set.tasks.length}</span> · <span class="chip">${PL_LABEL[task.pl]}</span> · <span class="chip">${task.klu}</span> · <span class="chip">${task.wordTarget[0]}–${task.wordTarget[1]} words</span></p>
  <p class="q-stem">${task.prompt}</p>
  <details class="accordion" open><summary><span data-i18n="practice.plan">Plan</span></summary><div class="body organizer" data-organizer="${task.organizer.type}">
  ${task.organizer.fields.map((f, j) => html`<div class="field"><label for="${task.id}-o${j}">${f}</label><input type="text" id="${task.id}-o${j}" data-org="${j}"><span class="print-only write-lines"></span></div>`)}
  </div></details>
  <div class="field"><p class="label" data-i18n="practice.frames">Sentence starters</p><div class="btn-row">${task.frames.map((f) => html`<button type="button" class="chip" data-frame="${f}">${f}</button>`)}</div></div>
  <div class="field"><label for="${task.id}-text" data-i18n="practice.write">Write</label><textarea id="${task.id}-text" data-text rows="9" spellcheck="true"></textarea>
  <span class="print-only write-lines"></span><span class="print-only write-lines"></span>
  <p class="word-count no-print" aria-live="polite" data-count>0 <span data-i18n="practice.words">words</span> (goal: ${task.wordTarget[0]}–${task.wordTarget[1]})</p></div>
  <fieldset><legend data-i18n="practice.selfCheck">Check yourself</legend>${task.checklist.map((c, j) => html`<label class="check"><input type="checkbox" data-check="${task.id}-${j}"><span><strong>${c.dimension}:</strong> ${c.text}</span></label>`)}</fieldset>
  <details class="accordion"><summary><span data-i18n="practice.exemplars">Sample answers</span></summary><div class="body">
  ${task.models.map((m) => html`<div class="model"><p class="lvl">Level ${m.level} sample (${words(m.text)} words)</p><div class="reading">${paras(m.text)}</div><ul class="muted">${m.annotations.map((a) => html`<li>${a}</li>`)}</ul></div>`)}
  </div></details>
</li>`;
    },
  )}</ol>`;
}

export function setPage(set, data) {
  const c = cluster(set.cluster);
  const d = domain(set.domain);
  const body = {
    reading: readingSet,
    listening: listeningSet,
    speaking: speakingSet,
    writing: writingSet,
  }[set.domain](set);
  const siblings = data.practice.filter(
    (s) => s.cluster === set.cluster && s.domain === set.domain && s.id !== set.id,
  );
  return html`<div class="wrap">
${printHeader(set)}
<div class="page-head"><span class="eyebrow">${c.label} · ${d.label}</span><h1>${set.title}</h1>
<p class="lede">${set.summary}</p><div class="btn-row">${chips(set)}</div></div>
${modeBar(set.domain)}
<div class="practice" data-practice="${set.domain}" data-set="${set.id}">
${body}
${set.items ? answerKey(set) : ""}
</div>
<section class="section no-print"><h2 data-i18n="practice.more">More practice</h2><div class="grid cols-3">${siblings.map(setCard)}</div></section>
${onPageDisclaimer()}
</div>`;
}

/** Client data for a set: everything practice.js needs, including feedback text (no hidden answers in a test sense:
 * this is practice, and the teacher view shows the same key). */
export function setClientData(set) {
  return {
    id: set.id,
    domain: set.domain,
    title: set.title,
    items: set.items?.map((it) => ({
      id: it.id,
      choices: it.choices.map((c) => ({ correct: !!c.correct, why: c.why })),
    })),
    script: set.script?.lines,
    glossary: set.passage?.glossary,
  };
}
