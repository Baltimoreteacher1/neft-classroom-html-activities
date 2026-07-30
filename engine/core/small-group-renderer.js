// Shared composition layer for differentiated 15–20 minute small-group lessons.
// Lesson configs remain the content source of truth; focused modules own the
// engagement interactions, math practice, and visual system.

import { createRhythmCoach } from "./facilitation-rhythm.js";
import { createGoDeeper } from "./go-deeper.js";
// NOTE: present-mode.css is NOT imported here. tools/small-group-modes.test.mjs
// imports this module under bare Node, which cannot resolve a CSS import at
// all — the stylesheet reaches the page through Vite's shared CSS chunk, which
// every lesson entry links.
import { mountPresentWidget } from "./present-mode.js";
import { installSmallGroupAnnotation } from "./small-group-annotation.js";
import { createBuildVisualizer } from "./small-group-build-visuals.js";
import {
  createMissionSection,
  createReflectionSection,
  createTalkSection,
  createVocabularySection,
  makePulse,
  selectedTalk,
} from "./small-group-engagement.js";
import { syncSmallGroupEvidence } from "./small-group-evidence.js";
import {
  MISCONCEPTIONS,
  detectMisconception,
  recordMisconception,
  topMisconceptions,
} from "./small-group-misconceptions.js";
import {
  createAdaptiveCoach,
  createConsensusLab,
  createEvidenceCard,
  createMisconceptionCard,
  createStudioPacket,
  createTeacherEvidenceConsole,
} from "./small-group-innovation.js";
import {
  createApplyLab,
  createExploreLab,
  createModelLab,
  figureBlock,
} from "./small-group-labs.js";
import { createMathCheckLab } from "./small-group-math-check.js";
import { installSmallGroupPassport } from "./small-group-passport.js";
import {
  collectPracticeItems,
  createCheckSection,
  createPracticeSection,
} from "./small-group-practice.js";
import { masteryBand } from "./small-group-rubric.js";
import { resolveStandard } from "./small-group-standards.js";
import { createStudioStore } from "./small-group-state.js";
import {
  installStoryboardScenes,
  markScene,
  mountAuthoredArt,
  mountThemeArt,
  themeDisplayName,
} from "./small-group-storyboard.js";
import { createReachLog } from "./small-group-reach.js";
import { createRoom, createRoomChip } from "./small-group-room.js";
import { mountSmallGroupTabs } from "./small-group-tabs.js";
import { mountSmallGroupTeacherAccess } from "./small-group-teacher-access.js";
import {
  ACCENTS,
  bi,
  coreObjective,
  el,
  esc,
  injectSmallGroupStyles,
  sectionHeading,
  studentVoice,
  voiceFor,
} from "./small-group-ui.js";
import { mountTeacherClearButton } from "./teacher-clear.js";
import { isToolsMode, mountToolsMenuItem, renderToolsPage } from "./tools-mode.js";

// One Build stage rendered as an interactive player instead of a static list.
// "ido" and "wedo" reveal one step at a time; "wedo" also converts a trailing
// authored parenthetical ("(You might say 3 × 4.)") into a think-first reveal
// chip; "youdo" becomes a tap-to-check launch list.
function stageCard(stage, fallbackTitle, kind, onStageDone, visualMode = null) {
  const lines = stage?.lines || [];
  if (!lines.length) return null;
  // One visualizer per stage so factor-tree steps accumulate into a single
  // growing tree (each step redraws the whole tree, newest branch highlighted).
  const visualFor = visualMode ? createBuildVisualizer() : null;
  // Level 2 gets the same verified models, but only AFTER committing to its own
  // thinking — a picture handed over up front is a giveaway, a picture used to
  // check your own reasoning is not. Support tiers see it open.
  const presentVisual = (visual) => {
    if (!visual || visualMode !== "gated") return visual;
    const shell = el("div", "sg-visual-gate");
    const toggle = el("button", "sg-reveal", "🧩 Check my model");
    toggle.type = "button";
    visual.hidden = true;
    toggle.onclick = () => {
      visual.hidden = false;
      toggle.remove();
    };
    shell.append(toggle, visual);
    return shell;
  };
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
      const visual = presentVisual(visualFor ? visualFor(line) : null);
      if (visual) {
        const wrap = el("div", "sg-checkstep-wrap");
        wrap.append(item, visual);
        list.appendChild(wrap);
      } else {
        list.appendChild(item);
      }
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
    if (visualFor) {
      // For "think first, then reveal" wedo lines, the parenthetical answer
      // holds the math — model the full authored line so the picture matches.
      const visual = presentVisual(visualFor(reveal ? `${reveal[1]} ${reveal[2]}` : line));
      if (visual) body.appendChild(visual);
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

function conceptSection(config, onDone, voice, variant) {
  const concept = config.launch?.conceptIntro || {};
  const section = el("section", "sg-sec");
  section.id = "sg-build";
  // Scene mark only — do not put sg-scene-enter on locked stages (animation
  // fill would fight `.locked { opacity }`). Section-level enter is safe.
  markScene(section, "build");
  section.appendChild(sectionHeading(2, "See it · try it · own it", "Build the idea"));
  // Problem-first: the worked-example stages come first so the problem itself is
  // the very first thing students see — the intro framing and the anchor idea
  // (which states the concept outright) are both deferred until after the work.

  // Stages unlock in order so the studio walks itself: worked example first,
  // then the guided try, then the launch checklist.
  const stages = [
    [concept.iDo, "👀 See it worked out", "ido"],
    [concept.weDo, "🤝 Try it with the guide", "wedo"],
    [concept.youDo, "🧠 Take the lead", "youdo"],
  ];
  // Support studios (group1) AND catch-up studios get a canonical visual model
  // beside each worked step, open by default — catch-up students missed the
  // original lesson and need the concrete model most. Level 2 gets the same
  // verified models but gated behind "Check my model", so the picture confirms
  // their reasoning instead of replacing it.
  const visualMode =
    variant === "group1" || variant === "catchup" ? "open" : variant === "group2" ? "gated" : null;
  const cards = [];
  stages.forEach(([stage, fallback, kind]) => {
    const card = stageCard(
      stage,
      fallback,
      kind,
      () => {
        const position = cards.indexOf(card);
        cards[position + 1]?.classList.remove("locked");
      },
      visualMode,
    );
    if (!card) return;
    if (cards.length) card.classList.add("locked");
    cards.push(card);
    section.appendChild(card);
  });

  // After the work: brief framing, then name the idea.
  if (concept.intro) section.appendChild(el("p", "sg-build-intro", esc(concept.intro)));
  if (concept.keyIdea)
    section.appendChild(
      el("div", "keyidea", `<span class="lab">💡 The big idea</span>${esc(concept.keyIdea)}`),
    );

  const row = el("div", "row");
  const ready = el("button", "btn", voice.buildCta);
  ready.type = "button";
  ready.onclick = () => {
    ready.disabled = true;
    ready.textContent = voice.buildDone;
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
  // Facilitation note for this variant's capstone — how to run the
  // Team Consensus Protocol (group 1) or topic-specific Math Check (group 2)
  // so the on-page activity is used as intended, not just clicked through.
  const isGroup2 = (config.variant || `group${group.group}`) === "group2";
  const capstoneNote = isGroup2
    ? "<b>Math Check:</b> students solve one challenge, run the check named for this lesson, and explain what the result means. Look for correct units, labels, and use of the lesson strategy."
    : "<b>Team consensus protocol:</b> post the problem, then have each voice privately pick the single best way to prove it before revealing the tally. Disagreement is the discussion fuel — ask “why that proof for this problem?” and let the group defend or revise.";
  // Publisher-style margin decisions: the in-the-moment moves a printed teacher
  // edition prints beside the lesson. Variant-aware so the "finish early" branch
  // sends each group somewhere real (Challenge bridge / Math Check / stretch).
  const finishEarly = isGroup2
    ? "point them at a second solution method — “solve it again, faster or cleaner” — or the Math Check’s connect step."
    : "offer the on-page Challenge bridge (it appears after a streak) or the adaptive coach’s Stretch move.";
  const pacingNotes = [
    [
      "If students struggle",
      "drop to the Guided set and open the step guide + tap-to-try bank; re-walk one worked step in Build the idea before releasing them again.",
    ],
    [
      "If you’re short on time",
      "protect the exit ticket. Cut More Practice, keep Build → one guided problem → the check; the rail renumbers itself, so skipping a section never breaks the flow.",
    ],
    ["If they finish early", finishEarly],
  ];
  const pacingHtml = pacingNotes
    .map(([label, body]) => `<li><b>${esc(label)}:</b> ${esc(body)}</li>`)
    .join("");
  wrapper.innerHTML = `<details>
    <summary>👩‍🏫 Teacher studio guide · ${esc(group.label || accent.name)}</summary>
    <div class="sg-tbody">
      ${group.who ? `<p><b>Pull:</b> ${esc(group.who)}</p>` : ""}
      <p><b>15–20 minute rhythm:</b> 2 min launch · 4 min build · 3 min talk · 7 min practice · 2 min check.</p>
      ${moves ? `<p><b>High-leverage moves:</b></p><ul>${moves}</ul>` : ""}
      ${frames ? `<p><b>Reusable frames:</b></p><div class="sg-frames">${frames}</div>` : ""}
      ${talk?.listenFor ? `<p><b>Listen for during team talk:</b> ${esc(talk.listenFor)}</p>` : ""}
      ${listenFor ? `<p><b>Listen-for checkpoints:</b></p><ul>${listenFor}</ul>` : ""}
      <p><b>Pacing decisions:</b></p><ul class="sg-pacing">${pacingHtml}</ul>
      <p class="sg-teacher-capstone">${capstoneNote}</p>
    </div>
  </details>`;
  return wrapper;
}

function hero(config, accent, voice) {
  const container = el("div", "sg-hero");
  markScene(container, "hero");
  const grid = el("div", "sg-hero-grid");
  const copy = el("div");
  copy.classList.add("sg-scene-enter");
  const badge = config.launch?.badge || `Small Group · ${accent.name}`;
  copy.appendChild(el("div", null, `<span class="sg-kicker">${accent.emoji} ${esc(badge)}</span>`));
  copy.appendChild(el("h1", null, esc(config.title || "Small-Group Math Studio")));
  if (config.contentObjective) {
    // One crisp kid-facing line up top; full content + language objectives fold
    // into a collapsible detail so the hero stays readable for Level 1 students.
    copy.appendChild(el("p", "sg-obj", `🎯 Today: ${esc(coreObjective(config.contentObjective))}`));
    const more = el("details", "sg-obj-more");
    more.appendChild(el("summary", null, "Full objectives"));
    more.appendChild(el("p", "sg-obj-full", `🎯 ${esc(studentVoice(config.contentObjective))}`));
    if (config.languageObjective)
      more.appendChild(el("p", "sg-langobj", `🗣️ ${esc(studentVoice(config.languageObjective))}`));
    copy.appendChild(more);
  }
  // Leveled coaching register — the one line that tells each group how this
  // studio will feel (supportive build / mathematician's press / fresh start).
  copy.appendChild(el("p", "sg-tagline", bi(voice.tagline, voice.taglineEs)));
  const chips = el("div", "sg-chips");
  chips.appendChild(el("span", "sg-chip", `⏱ ${esc(config.timeEstimate || "15–20 min")}`));
  if (config.standard) chips.appendChild(el("span", "sg-chip", esc(config.standard)));
  chips.appendChild(el("span", "sg-chip", "Private · saved on this device"));
  copy.appendChild(chips);
  const sceneName = themeDisplayName(config.theme);
  if (sceneName) {
    copy.appendChild(el("div", "sg-hero-scene-chip", `Scene · ${esc(sceneName)}`));
  }
  const mathMove = mathMoveOfTheDay(config);
  if (mathMove) copy.appendChild(mathMove);
  const mark = el("div", "sg-hero-mark sg-scene-enter");
  // Code-drawn theme SVG / emoji is the fallback; if the lesson carries authored
  // hero art, that wins and this runs only if the asset fails to load.
  const heroFallback = () => {
    if (config.theme && mountThemeArt(mark, config.theme, "", config.heroFigure)) {
      mark.classList.add("has-theme");
    } else {
      mark.textContent = accent.emoji;
    }
  };
  const heroArt = config.heroImage || config.sceneArt;
  if (heroArt && mountAuthoredArt(mark, heroArt, heroFallback)) {
    mark.classList.add("has-art");
  } else {
    heroFallback();
  }
  grid.append(copy, mark);
  container.appendChild(grid);
  return container;
}

// Guided one-tap challenge: launches the lesson's primary manipulative with a
// short, ESOL-friendly prompt. Additive — never gates progress.
const MATH_MOVE_COPY = {
  "drag-sort": {
    label: "Sort it",
    challenge: "Put each piece in the right place — then say why aloud.",
  },
  "fill-table": {
    label: "Fill the table",
    challenge: "Complete one row, check the pattern, then explain it.",
  },
  "number-line": {
    label: "Place it",
    challenge: "Snap the point to the right tick — then say what the jump means.",
  },
  "coordinate-grid": {
    label: "Plot it",
    challenge: "Plot one point carefully. Name the ordered pair out loud.",
  },
  "balance-scale": {
    label: "Balance it",
    challenge: "Keep both sides equal. Say the move that preserves balance.",
  },
  "bar-model": {
    label: "Build the bar",
    challenge: "Build the model to match the story. Point to the unknown.",
  },
  "factor-tree": {
    label: "Split it",
    challenge: "Split until every leaf is prime. Glow means you’re done.",
  },
  "factor-tree-lab": {
    label: "Split it",
    challenge: "Split until every leaf is prime. Glow means you’re done.",
  },
  "tape-diagram": {
    label: "Show the tape",
    challenge: "Adjust the tape so the parts match the problem.",
  },
};

function mathMoveOfTheDay(config) {
  const exploreType = config.explore?.type;
  const diagramKind = config.connect?.diagram?.kind || config.explore?.diagram?.kind || "";
  const key =
    (exploreType && MATH_MOVE_COPY[exploreType] && exploreType) ||
    (MATH_MOVE_COPY[diagramKind] && diagramKind) ||
    (diagramKind.includes("factor") ? "factor-tree" : null) ||
    (diagramKind.includes("number-line") ? "number-line" : null) ||
    (diagramKind.includes("tape") || diagramKind.includes("bar") ? "bar-model" : null);
  const copy = key && MATH_MOVE_COPY[key];
  if (!copy) return null;
  const chip = el("button", "sg-math-move", "");
  chip.type = "button";
  chip.innerHTML = `<span class="sg-math-move-kicker">Math move of the day</span><span class="sg-math-move-label">${esc(copy.label)}</span><span class="sg-math-move-hint">${esc(copy.challenge)}</span>`;
  chip.setAttribute("aria-label", `Math move of the day: ${copy.label}. ${copy.challenge}`);
  chip.onclick = () => {
    // Prefer Explore Lab; fall back to Model Lab / Learn tab.
    const exploreTab = document.getElementById("sg-tab-sg-tab-learn");
    exploreTab?.click();
    const target =
      document.getElementById("sg-explore") ||
      document.getElementById("sg-model") ||
      document.getElementById("sg-guided-practice");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    target?.classList.add("sg-math-move-pulse");
    window.setTimeout(() => target?.classList.remove("sg-math-move-pulse"), 1200);
    const note = target?.querySelector(".sg-math-move-challenge");
    if (!note && target) {
      const banner = el("div", "sg-math-move-challenge", esc(copy.challenge));
      banner.setAttribute("role", "status");
      target.prepend(banner);
      window.setTimeout(() => banner.remove(), 8000);
    }
  };
  return chip;
}

function footer() {
  const foot = el("div", "sg-foot");
  const print = el("button", "btn ghost", "🖨 Print / save as PDF");
  print.type = "button";
  print.onclick = () => window.print();
  foot.appendChild(print);
  return foot;
}

function renderStudio(config) {
  const variant =
    config.variant || (config.smallGroup ? `group${config.smallGroup.group}` : "catchup");
  const accent = ACCENTS[variant] || ACCENTS.catchup;
  const voice = voiceFor(variant);
  injectSmallGroupStyles(accent);
  // Studio Journey breadcrumb for the curriculum hub's "pick up where you
  // left off" chip. Local-only, no PII (lesson id + title + path).
  try {
    localStorage.setItem(
      "nt-journey-last",
      JSON.stringify({
        id: config.lessonId,
        title: config.title || "",
        path: window.location.pathname,
        t: Date.now(),
      }),
    );
  } catch (_error) {
    /* private mode — breadcrumb is optional */
  }
  document.title = `${config.title || "Small-Group Math Studio"} — Neft Teacher`;

  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = "";
  app.setAttribute("role", "main");
  const talkData = selectedTalk(config, variant);
  const store = createStudioStore(config.lessonId);

  // Teacher-only "Clear answers": wipe this device's studio state for this
  // lesson + the Save/Resume pointer, then reload it blank. Same control the
  // Reveal lessons expose, so a teacher can project a fresh studio. Renders the
  // floating button only in teacher mode; students never see it.
  window.__ntClearLessonAnswers = () => {
    try {
      store.clear();
    } catch (_) {
      /* storage blocked — reload still clears in-memory state */
    }
    try {
      window.NeftSaveResume?.reset?.();
    } catch (_) {
      /* save/resume not present on this page */
    }
    window.location.reload();
  };
  mountTeacherClearButton(window.__ntClearLessonAnswers);
  mountPresentWidget();
  const state = {
    before: null,
    after: null,
    attempts: 0,
    incorrectAttempts: 0,
    hints: 0,
    solved: 0,
    // Cross-session studio evidence — rehydrated so the Evidence Card and the
    // consensus/coach labs survive a reload instead of resetting to "—".
    mathCheckDone: Boolean(store.get("mathCheckDone")),
    consensusVotes: store.get("consensusVotes") || [],
    revision: store.get("revision") || null,
    revisionReason: store.get("revisionReason") || "",
    adaptivePath: store.get("adaptivePath") || null,
    // Best consecutive-correct run, persisted so the Evidence Card can show
    // it across sessions (session streak itself always restarts at zero).
    bestStreak: Number(store.get("bestStreak")) || 0,
    // Named misconceptions seen on this device, as {id: count}. Counts only —
    // the typed response that produced them is never stored or transmitted.
    misconceptions: store.get("misconceptions") || {},
    // Last revealed table distribution, so "convince a skeptic" can name a real
    // peer's position instead of inventing an objection.
    roomConsensus: store.get("roomConsensus") || null,
  };
  // Reach instrumentation: which tabs students actually arrive at, and how long
  // the studio takes to put a problem in front of them. See small-group-reach.js
  // for why arrivals — not completions — are the number that matters here.
  const reach = createReachLog(store);

  // The shared table. Strictly additive: with no room, no backend, or no network
  // the studio behaves exactly as it always has. See small-group-room.js.
  const room = createRoom(config.lessonId || "lesson");

  const events = {
    onAttempt({ correct, item, response, choiceIndex = null }) {
      state.attempts++;
      reach.markFirstProblem();
      if (!correct && item) {
        // A wrong answer is the richest signal in the room; until now it was
        // rendered as a red outline and discarded. Name it when — and only
        // when — the arithmetic identifies exactly one mechanism.
        const named = detectMisconception(item, response, choiceIndex);
        if (named) {
          state.misconceptions = recordMisconception(store, named) || state.misconceptions;
          state.lastMisconception = named;
        }
      }
      if (correct) {
        state.streak = (state.streak || 0) + 1;
        if (state.streak > (state.bestStreak || 0)) {
          state.bestStreak = state.streak;
          store.set("bestStreak", state.bestStreak);
        }
      } else {
        state.incorrectAttempts++;
        // Streaks reset silently — momentum is celebrated, never mourned.
        state.streak = 0;
      }
      // Live momentum chip in the sticky rail (tabs mount after restore, so
      // the optional chain keeps restored solves from crashing the studio).
      tabs?.setStreak?.(state.streak || 0);
    },
    onHint() {
      state.hints++;
    },
    onSolved() {
      state.solved++;
    },
    streak: () => state.streak || 0,
    // Human-readable name for the misconception the deterministic detector last
    // identified, handed to the reasoning reader so its coaching points at the
    // error this student actually made rather than one the model invents.
    misconception: () => MISCONCEPTIONS[state.lastMisconception]?.label || "",
  };

  // Restored interactions can finish before the tabs mount, so buffer marks.
  const pendingMarks = new Set();
  let tabs = null;
  const mark = (id) => {
    pendingMarks.add(id);
    tabs?.markDone(id);
  };
  // Phase completions (vocab, build, labs, talk, mission, apply, reflection)
  // feed the momentum meter alongside practice checks, so finishing early
  // sections moves the bar instead of leaving it stuck near zero.
  const phaseProgress = { keys: new Set(), done: new Set() };
  const phaseDone = (tabId, storeKey) => () => {
    if (storeKey) {
      store.set(storeKey, true);
      if (phaseProgress.keys.has(storeKey) && !phaseProgress.done.has(storeKey)) {
        phaseProgress.done.add(storeKey);
        tally.update();
      }
    }
    mark(tabId);
  };

  const completion = el("div", "sg-done");
  completion.hidden = true;
  const tally = {
    total: 0,
    solved: 0,
    update() {
      completion.innerHTML = `<b>${this.solved} of ${this.total}</b> practice checks complete. Keep using hints, revisions, and group questions.`;
      tabs?.setProgress(
        this.solved + phaseProgress.done.size,
        this.total + phaseProgress.keys.size,
      );
    },
  };

  // Session evidence → proficiency band (approaching/meeting/exceeding),
  // computed on demand so the Evidence Card, console, and telemetry all read
  // the same current answer.
  const getBand = () =>
    masteryBand({
      solved: tally.solved,
      total: tally.total,
      attempts: state.attempts,
      incorrectAttempts: state.incorrectAttempts,
      hints: state.hints,
    });
  const evidence = createEvidenceCard(config, state, getBand);
  const packet = createStudioPacket(config, state, store);
  const reflection = createReflectionSection(
    config,
    state,
    () => {
      phaseDone("sg-tab-practice", "reflectDone")();
      completion.hidden = false;
      completion.innerHTML = `<h2>Studio complete 🎉</h2><p>${esc(voice.completeBody)}</p>`;
      completion.appendChild(packet.button());
      evidence.reveal();
      // Section-scoped, name-free evidence for the teacher mastery dashboard.
      // Sent once, only on genuine completion, only if a class identity exists.
      syncSmallGroupEvidence(config, {
        kind: "complete",
        variant,
        phasesDone: phaseProgress.done.size,
        phasesTotal: phaseProgress.keys.size,
        practiceSolved: tally.solved,
        practiceTotal: tally.total,
        confidenceBefore: state.before,
        confidenceAfter: state.after,
        attempts: state.attempts,
        incorrectAttempts: state.incorrectAttempts,
        hints: state.hints,
        bestStreak: state.bestStreak,
        adaptivePath: state.adaptivePath,
        band: getBand().id,
        explained: Boolean(store.get("checkExplained")),
        // Independent-evidence band: first-attempt score across the exit ticket
        // and its transfer item, so the dashboard sees a mastery decision rather
        // than a single multiple-choice tap.
        checkBand: store.get("checkBand") || "",
        checkBandScore: store.get("checkBandScore") ?? null,
        // Every rendered item carries its standard, so evidence rolls up per
        // standard and not only per lesson.
        standards: [...new Set(allPractice.map((item) => item._standard).filter(Boolean))],
        // Named misconceptions as {id: count} — counts only, never the typed
        // response. This is the signal a next-move recommendation runs on.
        misconceptions: state.misconceptions || {},
        // Which tabs were ever reached, and seconds to the first problem. Without
        // this a feature wave cannot tell whether it added value or just surface.
        ...reach.summary(),
      });
    },
    store,
  );
  const revealReflection = () => {
    mark("sg-tab-practice");
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
  const build = conceptSection(config, phaseDone("sg-tab-learn", "buildDone"), voice, variant);
  // Group 2 checks its challenge with the specific mathematical process for
  // this lesson. Group 1 keeps its supportive partner talk in Practice.
  const mathCheck =
    variant === "group2"
      ? createMathCheckLab(config, state, phaseDone("sg-tab-prove", "mathCheckDone"), store)
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
  if (talk) talk.appendChild(createConsensusLab(config, variant, state, store, room));
  // Mid-rotation checkpoint: when the guided set lands, send one name-free
  // section-scoped ping so the teacher's class view moves DURING the rotation,
  // not only after completion. Same privacy gate as the completion sync.
  let guidedCheckpointSent = false;
  const guidedPhaseDone = phaseDone("sg-tab-guided", "guidedDone");
  const guidedDoneWithCheckpoint = () => {
    guidedPhaseDone();
    if (guidedCheckpointSent) return;
    guidedCheckpointSent = true;
    syncSmallGroupEvidence(config, {
      kind: "checkpoint",
      variant,
      practiceSolved: tally.solved,
      practiceTotal: tally.total,
      attempts: state.attempts,
      incorrectAttempts: state.incorrectAttempts,
      hints: state.hints,
      confidenceBefore: state.before,
      band: getBand().id,
      // Mid-rotation checkpoints carry misconceptions too: a teacher needs the
      // named error while the group is still at the table, not at completion.
      misconceptions: state.misconceptions || {},
      ...reach.summary(),
    });
  };
  const guided = createPracticeSection(config, guidedDoneWithCheckpoint, tally, events, store, {
    items: guidedItems,
    id: "sg-guided-practice",
    title: "Let’s solve together",
    eyebrow: "Guided practice",
    directions: voice.guidedDir,
    directionsEs: voice.guidedDirEs,
    scaffold: "all",
    showMistake: true,
    mode: "guided",
  });
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
      directions: voice.soloDir,
      directionsEs: voice.soloDirEs,
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
      directions: voice.moreDir,
      directionsEs: voice.moreDirEs,
      scaffold: variant === "group2" ? "none" : "default",
      showMistake: false,
      includeOptional: true,
      indexOffset: guidedCount + independentItems.length,
      mode: "more",
      // Restore last session's coach path so More Practice reorders on boot
      // the same way a live "Find our next move" choice would.
      adaptivePath: state.adaptivePath || store.get("adaptivePath") || "connect",
    },
  );
  const apply = createApplyLab(config, variant, {
    store,
    events,
    onDone: phaseDone("sg-tab-more", "applyDone"),
  });

  // Go Deeper stretch parity: group1/catch-up get the optional advanced path
  // (group2 already has the topic-specific Math Check lab). Deliberately NOT registered in
  // trackedPhases — it's an invitation, never part of the progress denominator.
  const goDeeper =
    variant === "group2" ? null : createGoDeeper({ config, lessonId: config.lessonId, variant, peers: state.roomConsensus });

  // Register the phase checks that exist in THIS lesson (labs are optional),
  // and restore ones finished last session, so the meter's denominator is
  // honest and prior work still counts. Practice-driven phase marks
  // (guided/practice/more/check) stay out — their items are already tallied.
  const trackedPhases = [
    [vocab, "vocabDone"],
    [build, "buildDone"],
    [explore, "exploreDone"],
    [model, "modelDone"],
    [talk, "talkDone"],
    [mission, "launchDone"],
    [apply, "applyDone"],
    [reflection.section, "reflectDone"],
  ];
  for (const [section, storeKey] of trackedPhases) {
    if (!section) continue;
    phaseProgress.keys.add(storeKey);
    if (store.get(storeKey)) phaseProgress.done.add(storeKey);
  }

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
      panel: makePanel("sg-tab-guided", [guided, createAdaptiveCoach(variant, state, store)]),
    },
    {
      // Practice and Check are one continuous "do the work, then show you've
      // got it" step — merged into a single tab so a 15–20 min small group
      // moves through fewer, clearer stops. The completion celebration lives
      // here so it appears in the tab the student is actually on when they
      // finish the reflection.
      id: "sg-tab-practice",
      label: "Practice & Check",
      // practiceLab: the same optional practice.diagram slot the full lesson
      // honors (step-solver, box-plot-builder, equation-balance-lab, …),
      // mounted first so students can rehearse the skill with the tool before
      // the graded items.
      panel: makePanel("sg-tab-practice", [
        ...(config.practice?.diagram
          ? (Array.isArray(config.practice.diagram)
              ? config.practice.diagram
              : [config.practice.diagram]
            ).map((d) => figureBlock(d))
          : []),
        practice,
        talk,
        check,
        reflection.section,
        evidence.section,
        packet.section,
        completion,
      ]),
    },
    {
      id: "sg-tab-more",
      label: "More Practice",
      panel: makePanel("sg-tab-more", [morePractice, mission, apply, goDeeper]),
    },
    // Group 2 only — keep the stable id for saved-tab compatibility.
    {
      id: "sg-tab-prove",
      label: "Math Check",
      panel: makePanel("sg-tab-prove", [mathCheck]),
    },
  ];

  const heroNode = hero(config, accent, voice);
  // The table chip sits in the hero on purpose: a group that discovers the room
  // halfway through has already answered everything alone, and the reveal only
  // teaches anything if nobody has spoken yet.
  heroNode.appendChild(
    createRoomChip(room, {
      onJoined: () => {
        // Re-render the talk section's consensus lab against the new membership.
        window.location.reload();
      },
    }),
  );
  app.appendChild(heroNode);
  // Publisher-grade standards display: resolve the bare code to its full MCCRS
  // wording (best-effort) and fold it into the hero's objectives detail, so
  // students and families see what the badge means. Code-only display stays if
  // the registry can't load.
  if (config.standard) {
    resolveStandard(config.standard).then((entry) => {
      if (!entry) return;
      const more = heroNode.querySelector(".sg-obj-more");
      more?.appendChild(
        el(
          "p",
          "sg-standard-line",
          `📐 <b>${esc(entry.code)}${entry.shortLabel ? ` · ${esc(entry.shortLabel)}` : ""}:</b> ${esc(entry.fullText)}`,
        ),
      );
      const chip = [...heroNode.querySelectorAll(".sg-chip")].find(
        (node) => node.textContent.trim() === config.standard,
      );
      if (chip) chip.title = entry.fullText;
    });
  }
  if (store.isReturning()) {
    const welcome = el("div", "sg-welcome");
    welcome.appendChild(el("span", null, esc(voice.welcome)));
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
  tabs = mountSmallGroupTabs(app, activeTabSteps, {
    store,
    voice,
    onReach: (id) => reach.mark(id),
  });
  pendingMarks.forEach((id) => tabs.markDone(id));
  tally.update();
  // Chalkie storyboard skin: one-shot scene enters (presentation only).
  installStoryboardScenes(app);

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
    checkSolved: "sg-tab-practice",
    reflectDone: "sg-tab-practice",
    moreDone: "sg-tab-more",
    applyDone: "sg-tab-more",
    mathCheckDone: "sg-tab-prove",
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
      const evidenceConsole = createTeacherEvidenceConsole(teacherConfig, state, getBand);
      const misconceptions = createMisconceptionCard(config);
      const rhythm = createRhythmCoach(facilitation);
      if (rhythm) heroNode.after(rhythm);
      const panel = teacherPanel(teacherConfig, accent, talkData);
      if (panel) heroNode.after(panel);
      if (misconceptions) heroNode.after(misconceptions);
      if (evidenceConsole) heroNode.after(evidenceConsole);
      // Teacher edition extras: full standard wording inside the studio guide.
      if (panel && config.standard) {
        resolveStandard(config.standard).then((entry) => {
          if (!entry) return;
          panel
            .querySelector(".sg-tbody")
            ?.prepend(
              el(
                "p",
                "sg-standard-line",
                `<b>Standard ${esc(entry.code)}:</b> ${esc(entry.fullText)}`,
              ),
            );
        });
      }
      const back = el("a", "btn ghost", "← Curriculum");
      back.href = "/curriculum/";
      const scorm = el("a", "btn ghost", "⬇ Canvas package");
      scorm.href = `/api/scorm?activity=${encodeURIComponent(config.lessonId)}&title=${encodeURIComponent(config.title || "")}`;
      scorm.rel = "nofollow";
      // The per-lesson printable (Level 0 + parallel forms A/B + labeled answer
      // keys) ships with every studio but was never linked. Teacher-mode only —
      // the file bundles the answer-key pages.
      const worksheet = el("a", "btn ghost", "📄 Worksheet + keys (A/B)");
      worksheet.href = "worksheet.html";
      worksheet.rel = "nofollow";
      foot.prepend(back);
      foot.append(worksheet, scorm);
    },
  });

  tally.update();
  installSmallGroupAnnotation(app, config);
  // Bridge studio XP/streaks/completion into the site-wide Student Passport.
  // Installed last, after restore-time marks, so prior work is baselined and
  // never retro-awarded. Fully self-guarded: a missing passport layer no-ops.
  installSmallGroupPassport({ lessonId: config.lessonId, store, events });
}

// Base lesson id shared by a lesson's variants: "1-1-group2" → "1-1".
function baseLessonId(id) {
  return String(id).replace(/-(?:group[12]|catchup)$/, "");
}

// Rewrite a variant URL path to a sibling variant's path, preserving the
// trailing slash. Exported so the redirect can be unit-tested without a
// navigable window. "/lessons/1-1-group1/" + "1-1-group2" → "/lessons/1-1-group2/".
export function variantPath(pathname, currentId, targetId) {
  const suffix = targetId.slice(baseLessonId(currentId).length + 1); // "group2" | "catchup"
  return String(pathname).replace(/-(?:group[12]|catchup)(\/|$)/, `-${suffix}$1`);
}

// Resolve which variant THIS student is assigned for the current base lesson,
// using the learning-supports roster. Cache-first (instant, no network), then a
// short best-effort fetch. Returns a full variant id (e.g. "1-1-group2") or null
// when there is no identity / no assignment / anything goes wrong — every
// failure path falls through to the teacher's default link, never blocks.
export async function resolveAssignedVariant(config) {
  const base = baseLessonId(config.lessonId);
  const pick = (lessons) => {
    if (!Array.isArray(lessons)) return null;
    // Most-specific first: a catch-up or challenge assignment wins over the
    // default the link points at.
    for (const suffix of ["catchup", "group2", "group1"]) {
      const id = `${base}-${suffix}`;
      if (lessons.includes(id)) return id;
    }
    return null;
  };
  let me;
  try {
    me = JSON.parse(window.localStorage.getItem("ewl-supports:v2:me") || "null");
  } catch {
    me = null;
  }
  if (!me || me.skipped || !me.section || !me.initials) return null;
  // 1) Instant cache the supports layer already keeps for this device.
  try {
    const cached = JSON.parse(
      window.localStorage.getItem(`ewl-supports:v2:assigned:${me.section}:${me.initials}`) ||
        "null",
    );
    const hit = pick(cached?.lessons);
    if (hit) return hit;
  } catch {
    /* fall through to network */
  }
  // 2) Fresh read, bounded so a slow network never stalls the studio.
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1500);
    const res = await fetch(
      `/api/supports/for?section=${encodeURIComponent(me.section)}&initials=${encodeURIComponent(me.initials)}`,
      { signal: controller.signal },
    );
    window.clearTimeout(timer);
    const data = await res.json();
    return pick(data?.lessons);
  } catch {
    return null;
  }
}

export function bootSmallGroup(config) {
  const params = new URLSearchParams(window.location.search);

  // ?mode=tools deep-link: render the standalone Interactive Tools page instead
  // of the studio, so small-group and catch-up lessons support it just like the
  // full renderer. Returns before any studio UI is built (no double render).
  if (isToolsMode()) {
    renderToolsPage(config, document.getElementById("app"));
    return;
  }

  // Add the "Interactive Tools" item to the studio's utility menu when this
  // lesson has registered tools (self-guards to a no-op otherwise). Mounts via a
  // MutationObserver, so it works regardless of which render branch runs below.
  mountToolsMenuItem(config);

  // ?group=1|2 deep-link: one shared link lands each student on a fixed variant.
  const requestedGroup = params.get("group");
  if (
    /^[12]$/.test(requestedGroup || "") &&
    /-group[12]$/.test(String(config.lessonId)) &&
    !String(config.lessonId).endsWith(`-group${requestedGroup}`)
  ) {
    window.location.replace(
      window.location.pathname.replace(/-group[12](\/|$)/, `-group${requestedGroup}$1`) +
        window.location.search +
        window.location.hash,
    );
    return;
  }

  // ?route=auto: one assigned Canvas link sends each student to THEIR variant
  // based on the supports roster. Resolves per-student, then renders the
  // (possibly redirected) studio. Falls through to this page for anyone
  // without a specific assignment.
  if (params.get("route") === "auto" && /-(?:group[12]|catchup)$/.test(String(config.lessonId))) {
    resolveAssignedVariant(config)
      .then((target) => {
        if (target && target !== config.lessonId) {
          // drop ?route=auto so the target renders directly (no re-resolve loop)
          window.location.replace(
            variantPath(window.location.pathname, config.lessonId, target) + window.location.hash,
          );
          return;
        }
        renderStudio(config);
      })
      .catch(() => renderStudio(config));
    return;
  }

  renderStudio(config);
}

export default bootSmallGroup;
