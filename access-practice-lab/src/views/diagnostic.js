// Optional, short instructional check-in. This recommends a practice starting point;
// it does not estimate a WIDA level or determine proficiency.
import { crumbsHTML } from "../components.js";
import { ART, BASE, DOMAIN_META, html, icon, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:diagnostic";
const items = {
  Listening: [
    { skill: "sequence", prompt: "Listen for the schedule change.", audio: "The science lab begins at 9:20. First, students collect a notebook. Then they put on goggles. Today, the class will visit the library after the experiment instead of before it.", question: "What changed in today's plan?", choices: ["The class visits the library after the experiment.", "Students no longer collect a notebook.", "The science lab starts at 9:20 tomorrow."], answer: 0, hint: "Listen for the word that signals a change, then compare what happened before and after." },
    { skill: "main-idea", prompt: "Listen for the central message.", audio: "Our school garden helps students study how living things depend on one another. Bees move pollen between flowers, and the plants provide food and shelter for small insects.", question: "What is the main idea?", choices: ["A garden can help students observe relationships among living things.", "Bees are the only animals found in a garden.", "Students should plant flowers in every classroom."], answer: 0, hint: "Separate the broad message from one detail about bees." },
    { skill: "cause-effect", prompt: "Listen for a cause and its result.", audio: "The creek became cloudy after heavy rain. Water flowing over bare soil carried small soil particles into the creek, so the water looked brown.", question: "Why did the creek look brown?", choices: ["Rainwater carried soil into the creek.", "The creek became deeper during the summer.", "Plants added flowers to the water."], answer: 0, hint: "Connect the action after 'because/so' to the result." },
  ],
  Reading: [
    { skill: "evidence", passage: "The class moved its seedlings from the shaded shelf to a sunny window. After one week, the seedlings near the window had taller stems. The class kept the amount of water the same.", question: "Which detail best supports the idea that light affected growth?", choices: ["The seedlings near the sunny window had taller stems.", "The class met in a room with a window.", "The class watered the plants."], answer: 0, hint: "Choose the observation that compares plant growth where light changed." },
    { skill: "main-idea", passage: "A neighborhood library added a tool shelf where people can borrow items such as wrenches and garden shears. The shelf helps residents complete small projects without buying tools they may use only once.", question: "What is the main idea?", choices: ["A library tool shelf lets neighbors borrow useful equipment.", "Garden shears are difficult to use.", "Every resident owns a wrench."], answer: 0, hint: "Look for the idea that both details explain." },
    { skill: "vocabulary-context", passage: "The path is permeable: rain passes through its small spaces and reaches the soil below instead of running across the surface.", question: "What does 'permeable' mean here?", choices: ["Allows water to pass through", "Keeps all water on top", "Changes water into soil"], answer: 0, hint: "Use the explanation after the colon as a context clue." },
  ],
};

const focusLinks = {
  Listening: ["sequence", "main-idea", "cause-effect"],
  Reading: ["evidence", "main-idea", "vocabulary-context"],
};
const activityId = { Listening: "listen", Reading: "read", Speaking: "speak", Writing: "write" };

function load() { return safeJson(storage.get(KEY), {}) || {}; }

const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const crumbs = (band, domain) =>
  crumbsHTML(
    domain
      ? [["Lab", `${BASE}/?grades=${band}`], ["Check-in", `${BASE}/diagnostic?grades=${band}`], [domain, null]]
      : [["Lab", `${BASE}/?grades=${band}`], ["Optional check-in", null]],
  );
const shell = (domain, band, body) =>
  html`${crumbs(band, domain)}<div class="dg d-${(domain || "listening").toLowerCase()}">${body}</div>`;
const head = (domain, band) => html`<header class="dg-head"><p class="lx-pill">${icon(DOMAIN_META[domain].icon)} ${domain} · Grades ${band.replace("-", "–")} · optional instructional check-in</p><h1 tabindex="-1">${domain} check-in</h1><p class="lead">A few original tasks can help suggest a practice starting point. This is not an official assessment or proficiency score.</p></header>`;
const dots = (done, total) => html`<ol class="dg-dots" aria-hidden="true">${Array.from({ length: total }, (_, n) => html`<li class="${n < done ? "is-done" : ""} ${n === done ? "is-here" : ""}"></li>`)}</ol>`;

function startHTML(band) {
  return html`<section class="dg-intro">
    <p class="eyebrow">Optional · about 4 minutes · private to this browser</p>
    <h1 tabindex="-1">Find a useful place to begin</h1>
    <p class="lead">Try a few short tasks. Your responses suggest practice ideas only; this is not a WIDA test and does not assign a proficiency level. You can skip this and open any activity.</p>
    <ul class="dg-domains">${DOMAINS.map((x) => html`<li><a class="dg-domain d-${x.toLowerCase()}" href="${BASE}/diagnostic/${x}?grades=${band}"><span class="dg-domain-icon">${icon(DOMAIN_META[x].icon)}</span><strong>${x}</strong><span>${items[x] ? "3 short tasks" : "1 reflection prompt"}</span><span class="dg-go">Start ${icon("arrow-right")}</span></a></li>`)}</ul>
    <p class="dg-skip">Not now? <a href="${BASE}/?grades=${band}">Go straight to practice</a>.</p>
  </section>`;
}

function reflectionHTML(d, band, session) {
  const done = session.completed;
  const prompt = d === "Speaking" ? "Explain one way a school garden could help students learn about science. Include a reason or example." : "Write a short explanation of one way a school garden could help students learn about science. Include a reason or example.";
  const body = done
    ? html`<p role="status" class="dg-saved">${icon("check")} Your reflection status is saved on this device. The check-in does not retain your spoken or written response. Open a studio task to save work, practice, revise, and ask a teacher to review your response if you want feedback on meaning and organization.</p>`
    : d === "Speaking"
      ? html`<p>Plan your idea, then record if you choose. Recordings are temporary.</p><div class="dg-rec"><button class="btn" type="button" data-rec-start="diagnostic-speaking">${icon("record")} Record response</button><div class="rec-meter" aria-hidden="true"></div><span class="rec-time" aria-live="polite"></span><button class="btn" type="button" data-rec-stop>${icon("stop")} Stop recording</button></div><p class="fine" data-rec-error="diagnostic-speaking" hidden></p><p class="dg-reflect"><strong>Then reflect:</strong> Did you answer the prompt? Did you explain why? What would you add on another try?</p><button class="btn btn-primary btn-domain" data-diagnostic-complete="${d}">Save my reflection</button>`
      : html`<label for="diagnosticDraft">Draft your response</label><textarea id="diagnosticDraft" rows="7" data-diagnostic-draft placeholder="Write your explanation here. This check-in does not save your draft. Use Writing Studio to save writing and compare revisions."></textarea><p class="dg-reflect"><strong>Check:</strong> Did you answer the prompt? Did you give a reason or example?</p><button class="btn btn-primary btn-domain" data-diagnostic-complete="${d}">Save my reflection</button>`;
  return shell(d, band, html`${head(d, band)}
    <section class="panel dg-card"><h2>${done ? "Your check-in is saved" : "Try this prompt"}</h2><p class="dg-prompt">${prompt}</p>${body}</section>
    <section class="panel dg-card"><h2>Choose your next practice</h2><p>Use the studio to plan, practice, revise, and make a new independent attempt.</p><a class="btn" href="${BASE}/${activityId[d]}?grades=${band}">Open ${d} Studio ${icon("arrow-right")}</a></section>`);
}

export async function render(ctx) {
  const domain = DOMAINS.includes(ctx.route.domain) ? ctx.route.domain : "";
  const band = ctx.band;
  if (!domain) return { title: "Optional check-in", html: shell("", band, startHTML(band)) };
  const saved = load();
  const session = saved[`${band}:${domain}`] || { step: 0, answers: [], started: false };
  if (domain === "Speaking" || domain === "Writing") return { title: `${domain} check-in`, html: reflectionHTML(domain, band, session) };

  const d = domain;
  const q = items[d][session.step];
  const progress = session.answers.length;
  const awaitingContinue = Boolean(session.feedback);
  const result = progress >= 3 && !awaitingContinue;
  const firstMiss = session.answers.findIndex((a) => !a.correct);
  const targetItem = items[d][firstMiss >= 0 ? firstMiss : 0];
  const targetSkill = result ? targetItem.skill : "";
  const suggestion = result ? (focusLinks[d].includes(targetSkill) ? targetSkill : focusLinks[d][0]) : "";
  const answerHtml = awaitingContinue
    ? html`<section class="panel dg-card dg-feedback" aria-live="polite"><p class="eyebrow">Task ${progress} of 3</p><div class="feedback ${session.feedback.correct ? "is-right" : "is-hint"}"><h2 class="fb-title">${icon(session.feedback.correct ? "check" : "bulb")} ${session.feedback.correct ? "That matches the information." : "Here is a strategy to try."}</h2><p>${session.feedback.correct ? session.feedback.evidence : session.feedback.hint}</p></div><button class="btn btn-primary btn-domain" data-diagnostic-next="${d}">Continue ${icon("arrow-right")}</button></section>`
    : q && !result
      ? html`<section class="panel dg-card diagnostic-question"><div class="dg-step"><p class="eyebrow">Task ${progress + 1} of 3</p>${dots(progress, 3)}</div><h2>${q.prompt}</h2>${d === "Listening" ? html`<button class="btn btn-domain btn-primary" type="button" data-say="${q.audio}">${icon("play")} Play audio</button><p class="fine">A built-in computer voice reads this original script. Press Play when ready; replay is available in this learning check-in.</p>` : html`<p class="reading-stimulus">${q.passage}</p>`}<fieldset class="dg-choices"><legend>${q.question}</legend>${q.choices.map((choice, i) => html`<label class="diagnostic-choice"><input type="radio" name="diagnosticAnswer" value="${i}"><span>${choice}</span></label>`)}</fieldset>${session.error ? html`<p class="feedback is-hint" role="alert">${icon("bulb")} ${session.error}</p>` : ""}<button class="btn btn-primary btn-domain" data-diagnostic-answer="${d}" data-diagnostic-step="${session.step}">Check answer</button></section>`
      : "";
  const doneHtml = result
    ? html`<section class="panel dg-card dg-result"><img src="${ART}/complete.svg" alt="" width="480" height="360" /><div><p class="eyebrow">Suggested starting point · not a level or score</p><h2>Try practice for ${suggestion.replaceAll("-", " ")}</h2><p>Your choices suggest that this skill could be useful to practice. One short check-in cannot explain why an answer was challenging, so treat this as a starting idea.</p><p>${targetItem.hint}</p><div class="row-actions"><a class="btn btn-primary btn-domain" href="${BASE}/${d}?grades=${band}">Open ${d} practice ${icon("arrow-right")}</a><a class="btn" href="${BASE}/diagnostic?grades=${band}">Check another domain</a><button class="btn" data-diagnostic-restart="${d}">Try these tasks again</button></div></div></section>`
    : "";
  return { title: `${d} check-in`, html: shell(d, band, html`${head(d, band)}${answerHtml}${doneHtml}`) };
}

export function onClick(e, ctx) {
  const button = e.target.closest("[data-diagnostic-answer], [data-diagnostic-complete], [data-diagnostic-restart], [data-diagnostic-next]");
  if (!button) return false;
  const domain = button.dataset.diagnosticAnswer || button.dataset.diagnosticComplete || button.dataset.diagnosticRestart || button.dataset.diagnosticNext;
  const saved = load();
  const key = `${ctx.band}:${domain}`;
  if (button.hasAttribute("data-diagnostic-restart")) saved[key] = { step: 0, answers: [], started: true };
  else if (button.hasAttribute("data-diagnostic-complete")) saved[key] = { step: 0, answers: [], completed: true, mode: domain === "Speaking" ? "reflection-recording-optional" : "reflection-writing" };
  else if (button.hasAttribute("data-diagnostic-next")) { const record = saved[key]; if (record) delete record.feedback; }
  else {
    const checked = document.querySelector('input[name="diagnosticAnswer"]:checked');
    if (!checked) { const record = saved[key] || { step: 0, answers: [], started: true }; record.error = "Choose one response before checking."; saved[key] = record; storage.set(KEY, JSON.stringify(saved)); ctx.rerender(); return true; }
    const step = Number(button.dataset.diagnosticStep);
    const item = items[domain][step];
    const record = saved[key] || { step: 0, answers: [], started: true };
    delete record.error;
    const correct = Number(checked.value) === item.answer;
    record.answers.push({ skill: item.skill, correct, condition: "independent", at: new Date().toISOString() });
    record.step = step + 1;
    record.feedback = { correct, evidence: `The source says: “${item.audio || item.passage}” The best choice is “${item.choices[item.answer]}.”`, hint: item.hint };
    saved[key] = record;
  }
  storage.set(KEY, JSON.stringify(saved));
  ctx.rerender();
  return true;
}

