// Optional, short instructional check-in. This recommends a practice starting point;
// it does not estimate a WIDA level or determine proficiency.
import { crumbsHTML } from "../components.js";
import { BASE, html, safeJson, storage } from "../util.js";

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

export async function render(ctx) {
  const domain = ["Listening", "Reading", "Speaking", "Writing"].includes(ctx.route.domain) ? ctx.route.domain : "";
  const saved = load();
  const session = saved[`${ctx.band}:${domain}`] || { step: 0, answers: [], started: false };
  const q = items[domain]?.[session.step];
  const d = domain || "";
  const start = `<section class="panel diagnostic-panel"><p class="eyebrow">Optional · about 4 minutes · private to this browser</p><h1 tabindex="-1">Find a useful place to begin</h1><p>Try a few short tasks. Your responses suggest practice ideas only; this is not a WIDA test and does not assign a proficiency level. You can skip this and open any activity.</p><div class="row-actions">${["Listening", "Reading", "Speaking", "Writing"].map((x) => `<a class="btn" href="${BASE}/diagnostic/${x}?grades=${ctx.band}">${x}</a>`).join("")}</div></section>`;
  if (!d) return { title: "Optional check-in", html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${ctx.band}`], ["Optional check-in", null]])}${start}` };
  const intro = `<section class="room-hero"><div><p class="eyebrow">${ctx.band.replace("-", "–")} · optional instructional check-in</p><h1 tabindex="-1">${d} check-in</h1><p class="lead">A few original tasks can help suggest a practice starting point. This is not an official assessment or proficiency score.</p></div></section>`;
  if (!["Listening", "Reading", "Speaking", "Writing"].includes(d)) return { title: "Check-in", html: start };
  if (d === "Speaking" || d === "Writing") {
    const done = session.completed;
    const prompt = d === "Speaking" ? "Explain one way a school garden could help students learn about science. Include a reason or example." : "Write a short explanation of one way a school garden could help students learn about science. Include a reason or example.";
    return { title: `${d} check-in`, html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${ctx.band}`], ["Check-in", `${BASE}/diagnostic?grades=${ctx.band}`], [d, null]])}${intro}<section class="panel"><h2>${done ? "Your check-in is saved" : "Try this prompt"}</h2><p>${prompt}</p>${done ? html`<p role="status">Your reflection status is saved on this device. The check-in does not retain your spoken or written response. Open a studio task to save work, practice, revise, and ask a teacher to review your response if you want feedback on meaning and organization.</p>` : d === "Speaking" ? html`<p>Plan your idea, then record if you choose. Recordings are temporary.</p><button class="btn" type="button" data-rec-start="diagnostic-speaking">Record response</button><div class="rec-meter" aria-hidden="true"></div><span class="rec-time" aria-live="polite"></span><button class="btn" type="button" data-rec-stop>Stop recording</button><p class="fine" data-rec-error="diagnostic-speaking" hidden></p><p>After you finish, reflect: Did you answer the prompt? Did you explain why? What would you add on another try?</p><button class="btn btn-primary" data-diagnostic-complete="${d}">Save my reflection</button>` : html`<label for="diagnosticDraft">Draft your response</label><textarea id="diagnosticDraft" rows="7" data-diagnostic-draft placeholder="Write your explanation here. This check-in does not save your draft. Use Writing Studio to save writing and compare revisions."></textarea><p>Check: Did you answer the prompt? Did you give a reason or example?</p><button class="btn btn-primary" data-diagnostic-complete="${d}">Save my reflection</button>`}</section><section class="panel"><h2>Choose your next practice</h2><p>Use the studio to plan, practice, revise, and make a new independent attempt.</p><a class="btn" href="${BASE}/${activityId[d]}?grades=${ctx.band}">Open ${d} Studio</a></section>` };
  }
  const progress = session.answers.length;
  const awaitingContinue = Boolean(session.feedback);
  const result = progress >= 3 && !awaitingContinue;
  const targetSkill = result ? items[d][session.answers.findIndex((a) => !a.correct) >= 0 ? session.answers.findIndex((a) => !a.correct) : 0].skill : "";
  const targetIdx = focusLinks[d].indexOf(targetSkill);
  const suggestion = result ? (targetIdx >= 0 ? targetSkill : focusLinks[d][0]) : "";
  const answerHtml = awaitingContinue ? html`<section class="panel" aria-live="polite"><h2>${session.feedback.correct ? "That matches the information." : "Here is a strategy to try."}</h2><p>${session.feedback.correct ? session.feedback.evidence : session.feedback.hint}</p><button class="btn btn-primary" data-diagnostic-next="${d}">Continue</button></section>` : q && !result ? html`<section class="panel diagnostic-question"><p class="eyebrow">Task ${progress + 1} of 3</p><h2>${q.prompt}</h2>${d === "Listening" ? html`<button class="btn" type="button" data-say="${q.audio}">▶ Play audio</button><p class="fine">A built-in computer voice reads this original script. Press Play when ready; replay is available in this learning check-in.</p>` : html`<p class="reading-stimulus">${q.passage}</p>`}<fieldset><legend>${q.question}</legend>${q.choices.map((choice, i) => html`<label class="diagnostic-choice"><input type="radio" name="diagnosticAnswer" value="${i}"> ${choice}</label>`)}</fieldset>${session.error ? html`<p class="feedback is-wrong" role="alert">${session.error}</p>` : ""}<button class="btn btn-primary" data-diagnostic-answer="${d}" data-diagnostic-step="${session.step}">Check answer</button></section>` : "";
  const doneHtml = result ? html`<section class="panel"><p class="eyebrow">Suggested starting point · not a level or score</p><h2>Try practice for ${suggestion.replaceAll("-", " ")}</h2><p>Your choices suggest that this skill could be useful to practice. One short check-in cannot explain why an answer was challenging, so treat this as a starting idea.</p><p>${items[d][session.answers.findIndex((a) => !a.correct) >= 0 ? session.answers.findIndex((a) => !a.correct) : 0].hint}</p><div class="row-actions"><a class="btn btn-primary" href="${BASE}/${d}?grades=${ctx.band}">Open ${d} practice</a><a class="btn" href="${BASE}/diagnostic?grades=${ctx.band}">Check another domain</a></div><button class="btn" data-diagnostic-restart="${d}">Try these tasks again</button></section>` : "";
  return { title: `${d} check-in`, html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${ctx.band}`], ["Check-in", `${BASE}/diagnostic?grades=${ctx.band}`], [d, null]])}${intro}${answerHtml}${doneHtml}` };
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

