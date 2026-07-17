// Shared composition layer for differentiated 15–20 minute small-group lessons.
// Lesson configs remain the content source of truth; focused modules own the
// engagement interactions, math practice, and visual system.

import { installSmallGroupAnnotation } from "./small-group-annotation.js";
import {
  createMissionSection,
  createReflectionSection,
  createTalkSection,
  createVocabularySection,
  makePulse,
  selectedTalk,
} from "./small-group-engagement.js";
import {
  createAdaptiveCoach,
  createConsensusLab,
  createEvidenceCard,
  createProveItLab,
  createTeacherEvidenceConsole,
} from "./small-group-innovation.js";
import { createApplyLab, createExploreLab, createModelLab } from "./small-group-labs.js";
import { installSmallGroupPassport } from "./small-group-passport.js";
import {
  collectPracticeItems,
  createCheckSection,
  createPracticeSection,
} from "./small-group-practice.js";
import { createStudioStore } from "./small-group-state.js";
import { mountSmallGroupTabs } from "./small-group-tabs.js";
import { mountSmallGroupTeacherAccess } from "./small-group-teacher-access.js";
import {
  ACCENTS,
  el,
  esc,
  injectSmallGroupStyles,
  sectionHeading,
  studentVoice,
} from "./small-group-ui.js";

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

function conceptSection(config, onDone) {
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
  const listenFor = (group.listenFor || []).map((item) => `<li>${esc(item)}</li>`).join("");
  wrapper.innerHTML = `<details>
    <summary>👩‍🏫 Teacher studio guide · ${esc(group.label || accent.name)}</summary>
    <div class="sg-tbody">
      ${group.who ? `<p><b>Pull:</b> ${esc(group.who)}</p>` : ""}
      <p><b>15–20 minute rhythm:</b> 2 min launch · 4 min build · 3 min talk · 7 min practice · 2 min check.</p>
      ${moves ? `<p><b>High-leverage moves:</b></p><ul>${moves}</ul>` : ""}
      ${frames ? `<p><b>Reusable frames:</b></p><div class="sg-frames">${frames}</div>` : ""}
      ${talk?.listenFor ? `<p><b>Listen for during team talk:</b> ${esc(talk.listenFor)}</p>` : ""}
      ${listenFor ? `<p><b>Listen-for checkpoints:</b></p><ul>${listenFor}</ul>` : ""}
    </div>
  </details>`;
  return wrapper;
}

function hero(config, accent) {
  const container = el("div", "sg-hero");
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

function footer() {
  const foot = el("div", "sg-foot");
  const print = el("button", "btn ghost", "🖨 Print / save as PDF");
  print.type = "button";
  print.onclick = () => window.print();
  foot.appendChild(print);
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
  app.setAttribute("role", "main");
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
      if (correct) state.streak = (state.streak || 0) + 1;
      else {
        state.incorrectAttempts++;
        // Streaks reset silently — momentum is celebrated, never mourned.
        state.streak = 0;
      }
    },
    onHint() {
      state.hints++;
    },
    onSolved() {
      state.solved++;
    },
    streak: () => state.streak || 0,
  };

  // Restored interactions can finish before the tabs mount, so buffer marks.
  const pendingMarks = new Set();
  let tabs = null;
  const mark = (id) => {
    pendingMarks.add(id);
    tabs?.markDone(id);
  };
  const phaseDone = (tabId, storeKey) => () => {
    if (storeKey) store.set(storeKey, true);
    mark(tabId);
  };

  const completion = el("div", "sg-done");
  completion.hidden = true;
  const tally = {
    total: 0,
    solved: 0,
    update() {
      completion.innerHTML = `<b>${this.solved} of ${this.total}</b> practice checks complete. Keep using hints, revisions, and group questions.`;
      tabs?.setProgress(this.solved, this.total);
    },
  };

  const evidence = createEvidenceCard(config, state);
  const reflection = createReflectionSection(
    config,
    state,
    () => {
      store.set("reflectDone", true);
      mark("sg-tab-check");
      completion.hidden = false;
      completion.innerHTML = `<h2>Studio complete 🎉</h2><p>You finished the mission and named your growth. That is what mathematicians do.</p>`;
      evidence.reveal();
    },
    store,
  );
  const revealReflection = () => {
    mark("sg-tab-check");
    reflection.reveal();
  };

  const allPractice = collectPracticeItems(config);
  const preferredGuided =
    Number(config.smallGroupPractice?.guidedCount) || (variant === "group2" ? 3 : 4);
  const guidedCount =
    allPractice.length <= 2
      ? Math.min(1, allPractice.length)
      : Math.min(preferredGuided, allPractice.length - 2);
  const remaining = allPractice.slice(guidedCount);
  const independentCount = Math.ceil(remaining.length / 2);
  const guidedItems = allPractice.slice(0, guidedCount);
  const independentItems = remaining.slice(0, independentCount);
  const moreItems = remaining.slice(independentCount);

  const check = createCheckSection(config, revealReflection, tally, events, store);
  // Mission is the capstone — it renders after practice and supports.
  const mission = createMissionSection(config, variant, phaseDone("sg-tab-more", "launchDone"));
  const pulseCard = el("div", "card sg-pulse-card");
  pulseCard.appendChild(el("p", "block-lab", "Private readiness pulse — how ready do you feel?"));
  pulseCard.appendChild(
    makePulse(
      state,
      "before",
      (value) => store.set("pulseBefore", value),
      store.get("pulseBefore"),
    ),
  );
  const build = conceptSection(config, phaseDone("sg-tab-learn", "buildDone"));
  // Group 2's challenge/justify work now lives in the guided "Prove It" tab,
  // which also absorbs the "Defend it to a skeptic" talk. Group 1 keeps its
  // supportive partner talk in Practice.
  const proveIt =
    variant === "group2"
      ? createProveItLab(config, variant, state, phaseDone("sg-tab-prove", "proveDone"))
      : null;
  const explore = createExploreLab(config, variant, {
    store,
    events,
    onDone: phaseDone("sg-tab-learn", "exploreDone"),
  });
  const model = createModelLab(config, variant, {
    store,
    events,
    onDone: phaseDone("sg-tab-learn", "modelDone"),
  });
  const vocab = createVocabularySection(config, phaseDone("sg-tab-vocab", "vocabDone"), store);
  // Partner talk lives inside the Practice tab so discussion is part of
  // practicing, not a detour.
  const talk =
    variant === "group2"
      ? null
      : createTalkSection(config, variant, phaseDone("sg-tab-practice", "talkDone"));
  if (talk) talk.appendChild(createConsensusLab(config, variant, state));
  const guided = createPracticeSection(
    config,
    phaseDone("sg-tab-guided", "guidedDone"),
    tally,
    events,
    store,
    {
      items: guidedItems,
      id: "sg-guided-practice",
      title: "Let’s solve together",
      eyebrow: "Guided practice",
      directions:
        "Work one problem at a time. Use the step guide and hints whenever you need them.",
      directionsEs:
        "Trabaja un problema a la vez. Usa la guía de pasos y las pistas cuando las necesites.",
      scaffold: "all",
      showMistake: true,
      mode: "guided",
    },
  );
  const practice = createPracticeSection(
    config,
    phaseDone("sg-tab-practice", "practiceDone"),
    tally,
    events,
    store,
    {
      items: independentItems,
      id: "sg-independent-practice",
      title: "Try it on your own",
      eyebrow: "Independent practice",
      directions: "Solve each problem, check your answer, and revise when needed.",
      directionsEs: "Resuelve cada problema, comprueba tu respuesta y corrige si hace falta.",
      scaffold: variant === "group2" ? "none" : "default",
      showMistake: false,
      indexOffset: guidedCount,
      mode: "practice",
    },
  );
  const morePractice = createPracticeSection(
    config,
    phaseDone("sg-tab-more", "moreDone"),
    tally,
    events,
    store,
    {
      items: moreItems,
      id: "sg-more-practice",
      title: "More practice",
      eyebrow: "Build fluency",
      directions: "Keep going until the steps feel familiar. Explain one answer out loud.",
      directionsEs:
        "Sigue practicando hasta que los pasos se sientan naturales. Explica una respuesta en voz alta.",
      scaffold: variant === "group2" ? "none" : "default",
      showMistake: false,
      includeOptional: true,
      indexOffset: guidedCount + independentItems.length,
      mode: "more",
    },
  );
  const apply = createApplyLab(config, variant, {
    store,
    events,
    onDone: phaseDone("sg-tab-more", "applyDone"),
  });

  const makePanel = (id, children) => {
    const panel = el("div", "sg-panel");
    panel.id = id;
    for (const child of children) if (child) panel.appendChild(child);
    return panel;
  };
  const tabSteps = [
    { id: "sg-tab-vocab", label: "Vocabulary", panel: makePanel("sg-tab-vocab", [vocab]) },
    {
      id: "sg-tab-learn",
      label: "Learn It",
      panel: makePanel("sg-tab-learn", [pulseCard, build, explore, model]),
    },
    {
      id: "sg-tab-guided",
      label: "Guided",
      panel: makePanel("sg-tab-guided", [guided, createAdaptiveCoach(variant, state)]),
    },
    {
      id: "sg-tab-practice",
      label: "Practice",
      panel: makePanel("sg-tab-practice", [practice, talk]),
    },
    {
      id: "sg-tab-check",
      label: "Check",
      // The completion celebration lives here so it appears in the tab the
      // student is actually on when they finish the reflection.
      panel: makePanel("sg-tab-check", [check, reflection.section, evidence.section, completion]),
    },
    {
      id: "sg-tab-more",
      label: "More Practice",
      panel: makePanel("sg-tab-more", [morePractice, mission, apply]),
    },
    // Group 2 only — panel is empty (and auto-filtered) for other variants.
    {
      id: "sg-tab-prove",
      label: "Prove It",
      panel: makePanel("sg-tab-prove", [proveIt]),
    },
  ];

  const heroNode = hero(config, accent);
  app.appendChild(heroNode);
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

  const activeTabSteps = tabSteps.filter((step) => step.panel.childElementCount > 0);
  for (const step of activeTabSteps) app.appendChild(step.panel);
  const foot = footer();
  app.appendChild(foot);
  tabs = mountSmallGroupTabs(app, activeTabSteps, { store });
  pendingMarks.forEach((id) => tabs.markDone(id));
  tally.update();

  // Number sections per tab: a lone section carries the tab number, multiple
  // sections get dotted sub-numbers ("2.1", "2.2") instead of duplicates.
  activeTabSteps.forEach((step, index) => {
    const badges = [...step.panel.querySelectorAll(".sg-h .n")];
    badges.forEach((number, position) => {
      number.textContent = badges.length > 1 ? `${index + 1}.${position + 1}` : String(index + 1);
    });
  });

  // Print must show everything: open collapsed tools/steps for the duration
  // of the print, then restore the on-screen state.
  const openedForPrint = new Set();
  window.addEventListener("beforeprint", () => {
    for (const details of app.querySelectorAll("details:not([open])")) {
      details.open = true;
      openedForPrint.add(details);
    }
  });
  window.addEventListener("afterprint", () => {
    for (const details of openedForPrint) details.open = false;
    openedForPrint.clear();
  });
  const RESTORE_MARKS = {
    vocabDone: "sg-tab-vocab",
    launchDone: "sg-tab-more",
    buildDone: "sg-tab-learn",
    exploreDone: "sg-tab-learn",
    modelDone: "sg-tab-learn",
    talkDone: "sg-tab-practice",
    guidedDone: "sg-tab-guided",
    practiceDone: "sg-tab-practice",
    checkSolved: "sg-tab-check",
    reflectDone: "sg-tab-check",
    moreDone: "sg-tab-more",
    applyDone: "sg-tab-more",
    proveDone: "sg-tab-prove",
  };
  for (const [storeKey, tabId] of Object.entries(RESTORE_MARKS))
    if (store.get(storeKey)) mark(tabId);

  let teacherToolsAdded = false;
  void mountSmallGroupTeacherAccess({
    app,
    lessonId: config.lessonId,
    renderTeacher(facilitation) {
      if (teacherToolsAdded) return;
      teacherToolsAdded = true;
      const teacherConfig = { ...config, smallGroup: facilitation };
      const evidenceConsole = createTeacherEvidenceConsole(teacherConfig, state);
      const panel = teacherPanel(teacherConfig, accent, talkData);
      if (panel) heroNode.after(panel);
      if (evidenceConsole) heroNode.after(evidenceConsole);
      const back = el("a", "btn ghost", "← Curriculum");
      back.href = "/curriculum/";
      const scorm = el("a", "btn ghost", "⬇ Canvas package");
      scorm.href = `/api/scorm?activity=${encodeURIComponent(config.lessonId)}&title=${encodeURIComponent(config.title || "")}`;
      scorm.rel = "nofollow";
      foot.prepend(back);
      foot.appendChild(scorm);
    },
  });

  tally.update();
  installSmallGroupAnnotation(app, config);
  // Bridge studio XP/streaks/completion into the site-wide Student Passport.
  // Installed last, after restore-time marks, so prior work is baselined and
  // never retro-awarded. Fully self-guarded: a missing passport layer no-ops.
  installSmallGroupPassport({ lessonId: config.lessonId, store, events });
}

export default bootSmallGroup;
