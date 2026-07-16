// Shared composition layer for differentiated 15–20 minute small-group lessons.
// Lesson configs remain the content source of truth; focused modules own the
// engagement interactions, math practice, and visual system.
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
import { createCheckSection, createPracticeSection } from "./small-group-practice.js";
import { ACCENTS, el, esc, injectSmallGroupStyles } from "./small-group-ui.js";

function teacherMode() {
  try {
    return localStorage.getItem("nt-teacher-mode") === "1";
  } catch {
    return false;
  }
}

function sectionHeading(number, eyebrow, title) {
  return el(
    "div",
    "sg-h",
    `<span class="n">${number}</span><div><div class="sg-eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2></div>`,
  );
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
    document.getElementById("sg-vocab")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

function progressRail() {
  const phases = [
    ["sg-launch", "1", "Launch"],
    ["sg-build", "2", "Build"],
    ["sg-vocab", "3", "Words"],
    ["sg-talk", "4", "Talk"],
    ["sg-practice", "5", "Practice"],
    ["sg-check", "6", "Show it"],
    ["sg-reflect", "7", "Reflect"],
  ];
  const rail = el("nav", "sg-rail");
  rail.setAttribute("aria-label", "Small-group lesson progress");
  const controls = {};
  phases.forEach(([id, number, label]) => {
    const button = el(
      "button",
      "sg-step",
      `<span class="dot">${number}</span><span class="lbl">${label}</span>`,
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
  const state = {
    before: null,
    after: null,
    attempts: 0,
    incorrectAttempts: 0,
    hints: 0,
    solved: 0,
  };
  const progress = progressRail();
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

  app.appendChild(hero(config, accent));
  if (isTeacher) {
    app.appendChild(createTeacherEvidenceConsole(config, state));
    const panel = teacherPanel(config, accent, talkData);
    if (panel) app.appendChild(panel);
  }
  app.appendChild(progress.rail);

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
  const reflection = createReflectionSection(config, state, () => {
    progress.mark("sg-reflect");
    completion.hidden = false;
    completion.innerHTML = `<h2>Studio complete 🎉</h2><p>You finished the mission and named your growth. That is what mathematicians do.</p>`;
    evidence.reveal();
  });
  const revealReflection = () => {
    progress.mark("sg-check");
    reflection.reveal();
  };

  app.appendChild(createMissionSection(config, variant, state, () => progress.mark("sg-launch")));
  app.appendChild(
    conceptSection(config, () => progress.mark("sg-build"), createProofPathLab(variant, state)),
  );

  const vocabulary = createVocabularySection(config, () => progress.mark("sg-vocab"));
  if (vocabulary) app.appendChild(vocabulary);
  else progress.mark("sg-vocab");

  const talk = createTalkSection(config, variant, () => progress.mark("sg-talk"));
  if (talk) {
    talk.appendChild(createConsensusLab(config, variant, state));
    app.appendChild(talk);
  } else progress.mark("sg-talk");

  const check = createCheckSection(config, revealReflection, tally, events);
  const practice = createPracticeSection(
    config,
    () => {
      progress.mark("sg-practice");
      if (!check) reflection.reveal();
    },
    tally,
    events,
  );
  app.append(
    practice,
    createAdaptiveCoach(variant, state),
    createChallengeLab(config, variant, state),
  );
  if (check) app.appendChild(check);
  else progress.mark("sg-check");
  app.append(reflection.section, completion, evidence.section, footer(config, isTeacher));
  tally.update();
}

export default bootSmallGroup;
