// Shared composition layer for differentiated 15–20 minute small-group lessons.
// Lesson configs remain the content source of truth; focused modules own the
// engagement interactions, math practice, and visual system.

import { installSmallGroupAnnotation } from "./small-group-annotation.js";
import {
  createMissionSection,
  createReflectionSection,
  createTalkSection,
  createVocabularySection,
  selectedTalk,
} from "./small-group-engagement.js";
import {
  createAdaptiveCoach,
  createChallengeLab,
  createConsensusLab,
  createEvidenceCard,
  createProofPathLab,
  createTeacherEvidenceConsole,
} from "./small-group-innovation.js";
import { createApplyLab, createExploreLab, createModelLab } from "./small-group-labs.js";
import { createCheckSection, createPracticeSection } from "./small-group-practice.js";
import { createStudioStore } from "./small-group-state.js";
import {
  ACCENTS,
  el,
  esc,
  injectSmallGroupStyles,
  sectionHeading,
  studentVoice,
} from "./small-group-ui.js";

function teacherMode() {
  try {
    return localStorage.getItem("nt-teacher-mode") === "1";
  } catch {
    return false;
  }
}

// One Build stage rendered as an interactive player instead of a static list.
// "ido" and "wedo" reveal one step at a time; "wedo" also converts a trailing
// authored parenthetical ("(You might say 3 × 4.)") into a think-first reveal
// chip; "youdo" becomes a tap-to-check launch list.
function stageCard(stage, fallbackTitle, kind, onStageDone) {
  const lines = stage?.lines || [];
  if (!lines.length) return null;
  const card = el("div", "card sg-stage");
  card.appendChild(el("p", "block-lab", esc(stage.title || fallbackTitle)));
  const list = el("div", "sg-stage-steps");
  const row = el("div", "row");
  card.append(list, row);
  let complete = false;
  const finish = () => {
    if (complete) return;
    complete = true;
    card.classList.add("done");
    onStageDone();
  };

  if (kind === "youdo") {
    let checked = 0;
    lines.forEach((line) => {
      const item = el(
        "button",
        "sg-checkstep",
        `<span class="tick">•</span><span>${esc(line)}</span>`,
      );
      item.type = "button";
      item.setAttribute("aria-pressed", "false");
      item.onclick = () => {
        if (item.classList.contains("on")) return;
        item.classList.add("on");
        item.setAttribute("aria-pressed", "true");
        item.querySelector(".tick").textContent = "✓";
        if (++checked >= lines.length) finish();
      };
      list.appendChild(item);
    });
    return card;
  }

  const renderLine = (line, number) => {
    const step = el("div", "sg-buildstep");
    step.appendChild(el("span", "sn", String(number)));
    const body = el("div", "sg-buildstep-body");
    const reveal = kind === "wedo" ? String(line).match(/^(.*?)\s*\(([^()]{2,})\)\s*$/) : null;
    if (reveal) {
      body.appendChild(el("span", null, esc(reveal[1])));
      const chip = el("button", "sg-reveal", "💭 Think first, then reveal");
      chip.type = "button";
      const answer = el("span", "sg-reveal-answer", esc(reveal[2]));
      answer.hidden = true;
      chip.onclick = () => {
        answer.hidden = false;
        chip.remove();
      };
      body.append(chip, answer);
    } else {
      body.appendChild(el("span", null, esc(line)));
    }
    step.appendChild(body);
    return step;
  };

  let index = 0;
  const advanceCopy = kind === "ido" ? "Next step →" : "Got it — next →";
  const doneCopy = kind === "ido" ? "✓ I followed every step" : "✓ I worked it through";
  const next = el("button", "btn", "Show step 1 →");
  next.type = "button";
  next.onclick = () => {
    const step = renderLine(lines[index], index + 1);
    [...list.children].forEach((previous) => previous.classList.remove("now"));
    step.classList.add("now");
    list.appendChild(step);
    index++;
    if (index >= lines.length) {
      next.disabled = true;
      next.textContent = doneCopy;
      finish();
    } else {
      next.textContent = advanceCopy;
    }
  };
  row.appendChild(next);
  return card;
}

function conceptSection(config, onDone, proofPath) {
  const concept = config.launch?.conceptIntro || {};
  const section = el("section", "sg-sec");
  section.id = "sg-build";
  section.appendChild(sectionHeading(2, "See it · try it · own it", "Build the idea"));
  if (concept.keyIdea)
    section.appendChild(
      el("div", "keyidea", `<span class="lab">Anchor idea</span>${esc(concept.keyIdea)}`),
    );
  if (concept.intro) section.appendChild(el("p", null, esc(concept.intro)));

  // Stages unlock in order so the studio walks itself: worked example first,
  // then the guided try, then the launch checklist.
  const stages = [
    [concept.iDo, "👀 See it worked out", "ido"],
    [concept.weDo, "🤝 Try it with the guide", "wedo"],
    [concept.youDo, "🧠 Take the lead", "youdo"],
  ];
  const cards = [];
  stages.forEach(([stage, fallback, kind]) => {
    const card = stageCard(stage, fallback, kind, () => {
      const position = cards.indexOf(card);
      cards[position + 1]?.classList.remove("locked");
    });
    if (!card) return;
    if (cards.length) card.classList.add("locked");
    cards.push(card);
    section.appendChild(card);
  });
  section.appendChild(proofPath);

  const row = el("div", "row");
  const ready = el("button", "btn", "I can explain the next step →");
  ready.type = "button";
  ready.onclick = () => {
    ready.disabled = true;
    ready.textContent = "Build phase complete ✓";
    onDone();
    (document.getElementById("sg-explore") || document.getElementById("sg-vocab"))?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  row.appendChild(ready);
  section.appendChild(row);
  return section;
}

function teacherPanel(config, accent, talk) {
  const group = config.smallGroup;
  if (!group || !(group.moves || group.who || talk?.listenFor)) return null;
  const wrapper = el("aside", "sg-teacher");
  const moves = (group.moves || []).map((move) => `<li>${esc(move)}</li>`).join("");
  const frames = (group.frames || [])
    .map((frame) => `<span class="sg-frame">${esc(frame)}</span>`)
    .join("");
  wrapper.innerHTML = `<details>
    <summary>👩‍🏫 Teacher studio guide · ${esc(group.label || accent.name)}</summary>
    <div class="sg-tbody">
      ${group.who ? `<p><b>Pull:</b> ${esc(group.who)}</p>` : ""}
      <p><b>15–20 minute rhythm:</b> 2 min launch · 4 min build · 3 min talk · 7 min practice · 2 min check.</p>
      ${moves ? `<p><b>High-leverage moves:</b></p><ul>${moves}</ul>` : ""}
      ${frames ? `<p><b>Reusable frames:</b></p><div class="sg-frames">${frames}</div>` : ""}
      ${talk?.listenFor ? `<p><b>Listen for during team talk:</b> ${esc(talk.listenFor)}</p>` : ""}
    </div>
  </details>`;
  return wrapper;
}

function hero(config, accent) {
  const container = el("header", "sg-hero");
  const grid = el("div", "sg-hero-grid");
  const copy = el("div");
  const badge = config.launch?.badge || `Small Group · ${accent.name}`;
  copy.appendChild(el("div", null, `<span class="sg-kicker">${accent.emoji} ${esc(badge)}</span>`));
  copy.appendChild(el("h1", null, esc(config.title || "Small-Group Math Studio")));
  if (config.contentObjective)
    copy.appendChild(el("p", "sg-obj", `🎯 ${esc(studentVoice(config.contentObjective))}`));
  if (config.languageObjective)
    copy.appendChild(el("p", "sg-langobj", `🗣️ ${esc(studentVoice(config.languageObjective))}`));
  const chips = el("div", "sg-chips");
  chips.appendChild(el("span", "sg-chip", `⏱ ${esc(config.timeEstimate || "15–20 min")}`));
  if (config.standard) chips.appendChild(el("span", "sg-chip", esc(config.standard)));
  chips.appendChild(el("span", "sg-chip", "Private · saved on this device"));
  copy.appendChild(chips);
  grid.append(copy, el("div", "sg-hero-mark", accent.emoji));
  container.appendChild(grid);
  return container;
}

// What each step is for, in student language, with a realistic minute
// estimate — the scope-and-sequence layer of the learning map and rail.
const STEP_GUIDE = {
  "sg-launch": ["Meet today's mission and rate how ready you feel.", 2],
  "sg-build": ["See the math worked out, then try it one step at a time.", 4],
  "sg-explore": ["Get hands-on with a live math model.", 3],
  "sg-vocab": ["Unlock the math words — English + Español.", 2],
  "sg-talk": ["Say your thinking out loud — solo or with a partner.", 2],
  "sg-practice": ["Solve problems with hints on standby.", 5],
  "sg-model": ["Connect the idea to a picture you can explain.", 2],
  "sg-apply": ["Use the math in a real situation.", 3],
  "sg-check": ["Show what you know — this one is all you.", 2],
  "sg-reflect": ["Check off your goals and name your growth.", 1],
};

// Learning map — the up-front "what am I learning, and what's my path?"
// panel. Everything is derived from the config + the sections this lesson
// actually mounted, so catch-ups and both groups stay accurate automatically.
function learningMap(config, phases) {
  const map = el("section", "sg-map");
  map.setAttribute("aria-label", "Today's goal and learning path");
  map.appendChild(el("div", "sg-eyebrow", "Today at a glance"));
  if (config.contentObjective)
    map.appendChild(el("p", "sg-map-goal", `🎯 ${esc(studentVoice(config.contentObjective))}`));
  if (config.languageObjective)
    map.appendChild(el("p", "sg-map-lang", `🗣️ ${esc(studentVoice(config.languageObjective))}`));
  const keyIdea = config.launch?.conceptIntro?.keyIdea;
  if (keyIdea) map.appendChild(el("div", "sg-map-key", `<b>Key idea:</b> ${esc(keyIdea)}`));
  const path = el("ol", "sg-path");
  let total = 0;
  phases.forEach(([id, label], index) => {
    const [why, minutes] = STEP_GUIDE[id] || ["", 2];
    total += minutes;
    path.appendChild(
      el(
        "li",
        null,
        `<span class="pn">${index + 1}</span><b>${esc(label)}</b><span class="why">${esc(why)}</span><span class="min">~${minutes} min</span>`,
      ),
    );
  });
  map.appendChild(el("p", "block-lab", `Your path today · about ${total} minutes`));
  map.appendChild(path);
  return map;
}

// The rail is data-driven: it lists exactly the sections this lesson actually
// mounted (labs are config-dependent), numbered in visual order.
function progressRail(phases) {
  const rail = el("nav", "sg-rail");
  rail.setAttribute("aria-label", "Small-group lesson progress");
  const controls = {};
  phases.forEach(([id, label], index) => {
    const button = el(
      "button",
      "sg-step",
      `<span class="dot">${index + 1}</span><span class="lbl">${esc(label)}</span>`,
    );
    button.type = "button";
    button.onclick = () =>
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    controls[id] = button;
    rail.appendChild(button);
  });
  const meter = el(
    "div",
    "sg-meter",
    `<div class="sg-meter-track"><div class="sg-meter-fill"></div></div><span class="sg-meter-lab">0 of ${phases.length} steps done</span>`,
  );
  rail.appendChild(meter);
  const done = new Set();
  const mark = (id) => {
    if (!controls[id] || done.has(id)) return;
    controls[id].classList.add("done");
    done.add(id);
    meter.querySelector(".sg-meter-fill").style.width =
      `${Math.round((done.size / phases.length) * 100)}%`;
    meter.querySelector(".sg-meter-lab").textContent =
      done.size >= phases.length
        ? "All steps complete 🎉"
        : `${done.size} of ${phases.length} steps done`;
  };
  return { rail, mark, controls };
}

function footer(config, isTeacher) {
  const foot = el("footer", "sg-foot");
  const print = el("button", "btn ghost", "🖨 Print / save as PDF");
  print.type = "button";
  print.onclick = () => window.print();
  foot.appendChild(print);
  if (isTeacher) {
    const back = el("a", "btn ghost", "← Curriculum");
    back.href = "/curriculum/";
    const scorm = el("a", "btn ghost", "⬇ Canvas package");
    scorm.href = `/api/scorm?activity=${encodeURIComponent(config.lessonId)}&title=${encodeURIComponent(config.title || "")}`;
    scorm.rel = "nofollow";
    foot.prepend(back);
    foot.appendChild(scorm);
  }
  return foot;
}

export function bootSmallGroup(config) {
  const variant =
    config.variant || (config.smallGroup ? `group${config.smallGroup.group}` : "catchup");
  const accent = ACCENTS[variant] || ACCENTS.catchup;
  injectSmallGroupStyles(accent);
  document.title = `${config.title || "Small-Group Math Studio"} — Neft Teacher`;

  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = "";
  const isTeacher = teacherMode();
  const talkData = selectedTalk(config, variant);
  const store = createStudioStore(config.lessonId);
  const state = {
    before: null,
    after: null,
    attempts: 0,
    incorrectAttempts: 0,
    hints: 0,
    solved: 0,
  };
  const events = {
    onAttempt({ correct }) {
      state.attempts++;
      if (!correct) state.incorrectAttempts++;
    },
    onHint() {
      state.hints++;
    },
    onSolved() {
      state.solved++;
    },
  };

  // Rail marks can fire while sections are still being composed (restores,
  // fallbacks) — buffer them until the data-driven rail exists, then replay.
  const pendingMarks = new Set();
  let rail = null;
  const mark = (id) => {
    pendingMarks.add(id);
    rail?.mark(id);
  };
  const phaseDone = (railId, storeKey) => () => {
    if (storeKey) store.set(storeKey, true);
    mark(railId);
  };

  const completion = el("div", "sg-done");
  completion.hidden = true;
  const tally = {
    total: 0,
    solved: 0,
    update() {
      completion.innerHTML = `<b>${this.solved} of ${this.total}</b> practice checks complete. Keep using hints, revisions, and group questions.`;
    },
  };

  const evidence = createEvidenceCard(config, state);
  const reflection = createReflectionSection(
    config,
    state,
    () => {
      store.set("reflectDone", true);
      mark("sg-reflect");
      completion.hidden = false;
      completion.innerHTML = `<h2>Studio complete 🎉</h2><p>You finished the mission and named your growth. That is what mathematicians do.</p>`;
      evidence.reveal();
    },
    store,
  );
  const revealReflection = () => {
    mark("sg-check");
    reflection.reveal();
  };

  // ── Compose the studio: [id, rail label, section element (or null to skip)] ──
  const check = createCheckSection(config, revealReflection, tally, events, store);
  const sections = [
    [
      "sg-launch",
      "Launch",
      createMissionSection(config, variant, state, phaseDone("sg-launch", "launchDone"), store),
    ],
    [
      "sg-build",
      "Build",
      conceptSection(
        config,
        phaseDone("sg-build", "buildDone"),
        createProofPathLab(variant, state),
      ),
    ],
    [
      "sg-explore",
      "Lab",
      createExploreLab(config, variant, {
        store,
        events,
        onDone: phaseDone("sg-explore"),
      }),
    ],
    [
      "sg-vocab",
      "Words",
      createVocabularySection(config, phaseDone("sg-vocab", "vocabDone"), store),
    ],
    [
      "sg-talk",
      "Talk",
      (() => {
        const talk = createTalkSection(config, variant, phaseDone("sg-talk", "talkDone"));
        if (talk) talk.appendChild(createConsensusLab(config, variant, state));
        return talk;
      })(),
    ],
    [
      "sg-practice",
      "Practice",
      createPracticeSection(
        config,
        () => {
          phaseDone("sg-practice", "practiceDone")();
          if (!check) reflection.reveal();
        },
        tally,
        events,
        store,
      ),
    ],
    [
      "sg-model",
      "Model",
      createModelLab(config, variant, { store, events, onDone: phaseDone("sg-model") }),
    ],
    [
      "sg-apply",
      "Apply",
      createApplyLab(config, variant, { store, events, onDone: phaseDone("sg-apply") }),
    ],
    ["sg-check", "Show it", check],
    ["sg-reflect", "Reflect", reflection.section],
  ];
  const present = sections.filter(([, , section]) => section);

  app.appendChild(hero(config, accent));
  if (isTeacher) {
    app.appendChild(createTeacherEvidenceConsole(config, state));
    const panel = teacherPanel(config, accent, talkData);
    if (panel) app.appendChild(panel);
  }
  if (store.isReturning()) {
    const welcome = el("div", "sg-welcome");
    welcome.appendChild(
      el("span", null, "👋 Welcome back — your studio progress is saved on this device."),
    );
    const fresh = el("button", "btn ghost", "Start fresh");
    fresh.type = "button";
    fresh.onclick = () => {
      store.clear();
      window.location.reload();
    };
    welcome.appendChild(fresh);
    app.appendChild(welcome);
  }

  app.appendChild(
    learningMap(
      config,
      present.map(([id, label]) => [id, label]),
    ),
  );
  rail = progressRail(present.map(([id, label]) => [id, label]));
  app.appendChild(rail.rail);
  present.forEach(([id, , section]) => {
    app.appendChild(section);
    // The adaptive coach and design lab live right where they act: after practice.
    if (id === "sg-practice")
      app.append(createAdaptiveCoach(variant, state), createChallengeLab(config, variant, state));
  });
  app.append(completion, evidence.section, footer(config, isTeacher));

  // Renumber the visible section headings to match their actual order, and
  // mark phases the lesson doesn't have so the rail never looks stuck.
  present.forEach(([, , section], index) => {
    const number = section.querySelector(".sg-h .n");
    if (number) number.textContent = String(index + 1);
  });
  const RESTORE_MARKS = {
    launchDone: "sg-launch",
    buildDone: "sg-build",
    exploreDone: "sg-explore",
    vocabDone: "sg-vocab",
    talkDone: "sg-talk",
    practiceDone: "sg-practice",
    modelDone: "sg-model",
    applyDone: "sg-apply",
    checkSolved: "sg-check",
    reflectDone: "sg-reflect",
  };
  for (const [storeKey, railId] of Object.entries(RESTORE_MARKS))
    if (store.get(storeKey)) mark(railId);
  pendingMarks.forEach((id) => rail.mark(id));

  tally.update();
  installSmallGroupAnnotation(app, config);
}

export default bootSmallGroup;
