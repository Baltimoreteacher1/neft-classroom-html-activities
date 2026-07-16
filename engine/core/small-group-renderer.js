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
import { ACCENTS, el, esc, injectSmallGroupStyles, sectionHeading } from "./small-group-ui.js";

function teacherMode() {
  try {
    return localStorage.getItem("nt-teacher-mode") === "1";
  } catch {
    return false;
  }
}

function conceptSection(config, onDone, proofPath) {
  const concept = config.launch?.conceptIntro || {};
  const section = el("section", "sg-sec");
  section.id = "sg-build";
  section.appendChild(sectionHeading(2, "Model · try · release", "Build the idea together"));
  if (concept.keyIdea)
    section.appendChild(
      el("div", "keyidea", `<span class="lab">Anchor idea</span>${esc(concept.keyIdea)}`),
    );
  if (concept.intro) section.appendChild(el("p", null, esc(concept.intro)));

  const stages = [
    [concept.iDo, "👀 Watch the model", true],
    [concept.weDo, "🤝 Solve one together", false],
    [concept.youDo, "🧠 Take the lead", false],
  ];
  stages.forEach(([stage, fallback, open]) => {
    if (!stage || !(stage.lines || []).length) return;
    const details = el("details", "card");
    details.open = open;
    const summary = el("summary", "block-lab", esc(stage.title || fallback));
    const list = el("ol", "steps");
    stage.lines.forEach((line) => list.appendChild(el("li", null, esc(line))));
    details.append(summary, list);
    section.appendChild(details);
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
    copy.appendChild(el("p", "sg-obj", `🎯 ${esc(config.contentObjective)}`));
  if (config.languageObjective)
    copy.appendChild(el("p", "sg-langobj", `🗣️ ${esc(config.languageObjective)}`));
  const chips = el("div", "sg-chips");
  chips.appendChild(el("span", "sg-chip", `⏱ ${esc(config.timeEstimate || "15–20 min")}`));
  if (config.standard) chips.appendChild(el("span", "sg-chip", esc(config.standard)));
  chips.appendChild(el("span", "sg-chip", "Private · saved on this device"));
  copy.appendChild(chips);
  grid.append(copy, el("div", "sg-hero-mark", accent.emoji));
  container.appendChild(grid);
  return container;
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
  return { rail, mark: (id) => controls[id]?.classList.add("done"), controls };
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
