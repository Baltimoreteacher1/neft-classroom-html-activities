// Three authored, cross-skill episodes with a recurring original guide. Answers and feedback are
// deterministic; speech is optional browser playback, and no student recording is collected.
import { award, getEngagement, saveEngagement } from "../engagement.js";
import { BASE, announce, html, icon } from "../util.js";

const EPISODES = [
  {
    id: "rainy-route", title: "The Rainy Route", goal: "Explain a cause and choose a safe route",
    scene: "Nia, the Neighborhood Note-taker, is preparing a short update for the school community. An afternoon rainstorm changes the dismissal plan.",
    listen35: "Rain begins at 2:30. Bus riders wait in the gym. Walkers stay with their teacher in the main hall until the rain slows.",
    listen68: "The weather notice predicts rain at 2:30. Bus riders should wait in the gym. Walkers should remain with their teacher in the main hall until the rain slows.",
    read35: "The gym door opens to the bus loop. The main hall is inside the school. A teacher will walk with students who are walking home.",
    read68: "The map shows that the gym connects to the bus loop. The main hall remains indoors, and staff will supervise walkers there until conditions improve.",
    question: "Which update best matches both the announcement and the map?",
    choices: ["Bus riders wait in the gym; walkers stay in the main hall with a teacher.", "Everyone waits outside by the bus loop.", "Walkers go to the gym and bus riders wait in the main hall."], answer: 0,
    feedback: "The announcement assigns different places to two groups. The map confirms both places are indoors.",
    transfer: "A later message says the rain has stopped, but buses are delayed. Which group’s plan changes, and what stays the same?",
    frame35: "The walkers stay ___ because ___. Bus riders wait ___.",
    frame68: "Because ___, the walkers should ___. Meanwhile, bus riders ___. The map supports this because ___.",
    criteria: ["I named the group or idea clearly.", "I used a detail from the source.", "I explained how the detail supports my idea."],
  },
  {
    id: "garden-helpers", title: "The Garden Helpers", goal: "Support a claim with evidence",
    scene: "Nia is helping the school garden team decide where to place seedlings and how to explain the choice.",
    listen35: "Plant the new seedlings before the sun is high. Water the shaded beans every other day. Do not water the dry tray; the class is measuring it.",
    listen68: "The garden team should water the new seedlings early. Shaded beans need water every other day. Leave the dry tray untouched because the class is measuring how dry it becomes.",
    read35: "The sunny bed gets light in the morning. The bean bed is shaded. A label says: ‘Dry tray—measurement in progress.’",
    read68: "The garden map labels one bed as sunny in the morning and another as shaded. The dry tray is part of a class investigation, so changing it would affect the measurement.",
    question: "What should the team do first?",
    choices: ["Water the seedlings early, follow the bean schedule, and leave the measured tray alone.", "Water every tray at midday.", "Move the dry tray and water it now."], answer: 0,
    feedback: "The directions give a schedule and a clear exception. Leaving the tray alone protects the class measurement.",
    transfer: "A new team wants to water a plant during a measurement. What should they check before changing the plan?",
    frame35: "I think the team should ___ because the direction says ___.",
    frame68: "The team should ___ because ___. This matters to the measurement because ___.",
    criteria: ["I stated a clear claim.", "I included a source detail.", "I connected the detail to my claim."],
  },
  {
    id: "library-cart", title: "The Library Cart", goal: "Retell events in order",
    scene: "Nia is writing a note about a library cart that needs to reach the reading circle before students arrive.",
    listen35: "First, put the picture books on the bottom shelf. Next, check the wheel by the handle. Then roll the cart slowly to the reading circle. Ask for help if the wheel sticks.",
    listen68: "Place the picture books on the lower shelf first. Check the wheel near the handle before moving. Roll the cart slowly to the reading circle, and ask for help if the wheel sticks.",
    read35: "The library map shows the reading circle beside the wide doorway. The cart has one wheel near its handle. Picture books are kept on the lower shelf.",
    read68: "The floor plan marks a wide doorway beside the reading circle. The cart’s handle-side wheel was repaired last week, but staff ask students to check it before rolling the cart.",
    question: "What is the safest order for moving the cart?",
    choices: ["Load books low, check the wheel, then roll slowly and ask for help if needed.", "Roll quickly first, then put books on the top shelf.", "Skip the wheel check because it was repaired."], answer: 0,
    feedback: "The speaker’s sequence starts with loading, includes a wheel check, and ends with slow movement and a safety step.",
    transfer: "The cart starts to wobble near the doorway. What should happen next, and why?",
    frame35: "First ___. Next ___. Then ___.",
    frame68: "After ___, the helper should ___. If ___, then ___. This order helps because ___.",
    criteria: ["I put the events in a clear order.", "I included a detail from a source.", "I explained one reason or safety step."],
  },
];

const stateFor = (ctx, id) => getEngagement(ctx.prefs).stories[id] || { step: 0, choice: null, correct: false, transfer: false, mode: "write", draft: "", transferDraft: "", checks: [] };
const update = (ctx, id, patch) => {
  const e = getEngagement(ctx.prefs);
  const old = stateFor(ctx, id);
  saveEngagement(ctx, { stories: { ...e.stories, [id]: { ...old, ...patch } } });
};

export function render(ctx) {
  const episode = EPISODES.find((item) => item.id === ctx.route.id) || EPISODES[0];
  const state = stateFor(ctx, episode.id);
  const band35 = ctx.band === "3-5";
  const listen = band35 ? episode.listen35 : episode.listen68;
  const read = band35 ? episode.read35 : episode.read68;
  const frame = band35 ? episode.frame35 : episode.frame68;
  const complete = state.step >= 4;
  return { title: episode.title, html: html`<nav class="crumbs" aria-label="Breadcrumb"><a href="${BASE}/?grades=${ctx.band}">Practice</a> / <a href="${BASE}/worlds?grades=${ctx.band}">Language Worlds</a> / ${episode.title}</nav>
    <section class="story-hero panel"><p class="eyebrow">Language Worlds · A Neighborhood Notes episode</p><h1 tabindex="-1">${episode.title}</h1><p class="lead">${episode.goal}</p><p><strong>Nia, the Neighborhood Note-taker:</strong> ${episode.scene}</p><p class="fine">Grades ${ctx.band.replace("-", "–")} · Listen, read, decide, then speak or write. No timer.</p></section>
    <ol class="story-steps" aria-label="Episode progress">${["Listen", "Read", "Decide", "Explain"].map((name, i) => html`<li class="${state.step > i ? "is-done" : state.step === i ? "is-current" : ""}"><span>${i + 1}</span>${name}</li>`)}</ol>
    <div class="story-grid">
      <section class="panel story-task"><h2>1 · Listen</h2><p>Nia asks you to listen for the change and the reason.</p><button type="button" class="btn btn-primary" data-say="${listen}">${icon("volume")} Play the message</button><details><summary>Read the complete transcript</summary><p>${listen}</p></details><p class="fine">Accessible alternative: read the transcript, or ask someone to read it aloud.</p><button type="button" class="btn" data-story-heard>Continue after listening or reading</button></section>
      <section class="panel story-task"><h2>2 · Read</h2><p>${read}</p><button type="button" class="ghost small" data-say="${read}">${icon("volume")} Read this source aloud</button><button type="button" class="btn" data-story-read>Continue after reading</button></section>
      <section class="panel story-task"><h2>3 · Decide</h2><fieldset><legend>${episode.question}</legend>${episode.choices.map((choice, i) => html`<label class="story-choice"><input type="radio" name="story-choice" value="${i}" ${Number(state.choice) === i ? "checked" : ""} data-story-choice /> <span>${choice}</span></label>`)}</fieldset><button type="button" class="btn btn-primary" data-story-check>Check my idea</button>${state.correct ? html`<div class="feedback is-right" role="status"><strong>${icon("check")} The sources support this choice.</strong><p>${episode.feedback}</p><h3>Try the strategy on a new situation</h3><p>${episode.transfer}</p>${state.transfer ? html`<p class="fine">You made a transfer attempt. This is practice evidence, not a proficiency score.</p>` : html`<label class="field"><span>Write or say your idea, then note a reason</span><textarea rows="3" data-story-transfer-draft>${state.transferDraft}</textarea></label><button type="button" class="btn" data-story-transfer>Save this transfer attempt</button>`}</div>` : state.choice !== null ? html`<p class="feedback is-hint" role="status">Look for the detail that answers the question. Replay the message or reread the source, then try again.</p>` : ""}</section>
      <section class="panel story-task"><h2>4 · Explain to Nia</h2><p>Choose speaking or writing. Use the sentence frame if it helps. You may practice aloud without recording.</p><fieldset class="story-mode"><legend>How do you want to respond?</legend><label><input type="radio" name="story-mode" value="speak" ${state.mode === "speak" ? "checked" : ""} data-story-mode /> Speak aloud</label><label><input type="radio" name="story-mode" value="write" ${state.mode === "write" ? "checked" : ""} data-story-mode /> Write a response</label></fieldset><p class="story-frame">${frame}</p><label class="field"><span>${state.mode === "speak" ? "Optional notes for your spoken response" : "Your short response"}</span><textarea rows="4" data-story-draft>${state.draft}</textarea></label><fieldset><legend>Choose what you improved or included</legend>${episode.criteria.map((criterion, i) => html`<label class="story-check"><input type="checkbox" value="${i}" data-story-criteria ${state.checks.includes(i) ? "checked" : ""} /> ${criterion}</label>`)}</fieldset><button type="button" class="btn btn-primary" data-story-finish ${!state.correct || !state.transfer ? "disabled" : ""}>Finish this episode</button>${complete ? html`<p class="goal-done" role="status">Episode finished. Nia saved your choice and self-check on this device.</p>` : ""}</section>
    </div>
    ${complete ? html`<section class="session-finish panel"><h2>Nice work, Neighborhood Note-taker!</h2><p>You listened, read, made a decision, and checked your own language against the success criteria.</p><p class="reward-chip">+4 Passport XP for finishing this story episode</p><p class="fine">Your self-check helps you reflect. A recording, word count, or check mark does not prove language proficiency.</p><a class="btn btn-primary" href="${BASE}/worlds?grades=${ctx.band}">Choose another world episode${icon("arrow-right")}</a></section>` : ""}
    <nav class="story-next" aria-label="More episodes">${EPISODES.map((item) => html`<a class="btn" href="${BASE}/stories/${item.id}?grades=${ctx.band}">${item.title}</a>`)}</nav>` };
}

export function onInput(e, ctx) {
  if (e.target.matches("[data-story-draft]")) update(ctx, ctx.route.id, { draft: e.target.value.slice(0, 2500) });
  if (e.target.matches("[data-story-transfer-draft]")) update(ctx, ctx.route.id, { transferDraft: e.target.value.slice(0, 1500) });
}
export function onChange(e, ctx) {
  const state = stateFor(ctx, ctx.route.id);
  if (e.target.matches("[data-story-choice]")) update(ctx, ctx.route.id, { choice: Number(e.target.value) });
  if (e.target.matches("[data-story-mode]")) update(ctx, ctx.route.id, { mode: e.target.value });
  if (e.target.matches("[data-story-criteria]")) {
    const checks = new Set(state.checks);
    e.target.checked ? checks.add(Number(e.target.value)) : checks.delete(Number(e.target.value));
    update(ctx, ctx.route.id, { checks: [...checks] });
  }
}
export function onClick(e, ctx) {
  const episode = EPISODES.find((item) => item.id === ctx.route.id) || EPISODES[0];
  const state = stateFor(ctx, episode.id);
  if (e.target.closest("[data-story-heard]")) { update(ctx, episode.id, { step: Math.max(state.step, 1) }); ctx.rerender(); return true; }
  if (e.target.closest("[data-story-read]")) { update(ctx, episode.id, { step: Math.max(state.step, 2) }); ctx.rerender(); return true; }
  if (e.target.closest("[data-story-check]")) {
    if (Number(state.choice) === episode.answer) {
      update(ctx, episode.id, { correct: true, step: Math.max(state.step, 3) });
      award(ctx, `evidence:${ctx.band}:${episode.id}`, 2, "Evidence Finder");
    } else update(ctx, episode.id, { correct: false });
    ctx.rerender(); return true;
  }
  if (e.target.closest("[data-story-transfer]")) {
    if (state.transferDraft.trim().length < 8) { announce("Add one short idea and a reason before saving your transfer attempt."); return true; }
    update(ctx, episode.id, { transfer: true });
    award(ctx, `transfer:${ctx.band}:${episode.id}`, 2, "Strategy on a new task");
    ctx.rerender(); return true;
  }
  if (e.target.closest("[data-story-finish]")) {
    if (!state.correct || !state.transfer) return true;
    update(ctx, episode.id, { step: 4 });
    award(ctx, `story:${ctx.band}:${episode.id}`, 4, "Story episode complete");
    ctx.rerender(); return true;
  }
  return false;
}
