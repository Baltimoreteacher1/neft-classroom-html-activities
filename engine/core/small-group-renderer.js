// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.

import { createLessonCourseNav } from "./curriculum-nav.js";
import { createRhythmCoach } from "./facilitation-rhythm.js";
import { observeContentImageZoom } from "./image-zoom.js";
import { enableKeyboardScrolling } from "./keyboard-scroll.js";
import {
  detectMisconception,
  MISCONCEPTIONS,
  recordMisconception,
  resolveAuthoredTag,
  topMisconceptions,
} from "./misconceptions.js";
// NOTE: present-mode.css is NOT imported here. tools/small-group-modes.test.mjs
// imports this module under bare Node, which cannot resolve a CSS import at
// all — the stylesheet reaches the page through Vite's shared CSS chunk, which
// every lesson entry links.
import { mountPresentWidget } from "./present-mode.js";
import { simplifyStudioHeader } from "./reading-flow.js";
import { ensureCanvasBridge } from "./scorm-bridge.js";
import { installSmallGroupAnnotation } from "./small-group-annotation.js";
import { buildSection } from "./small-group-build-section.js";
import { createVocabularySection, selectedTalk } from "./small-group-engagement.js";
import { syncSmallGroupEvidence, trackSmallGroupStep } from "./small-group-evidence.js";
import { createMisconceptionCard, createTeacherEvidenceConsole } from "./small-group-innovation.js";
import { createApplyLab } from "./small-group-labs.js";
import { installSmallGroupPassport } from "./small-group-passport.js";
import {
  createChallengeCard,
  createExitCheckSection,
  createOnMyOwnSection,
  createTogetherSection,
} from "./small-group-practice-path.js";
import { createReachLog } from "./small-group-reach.js";
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
import { mountToolDrawer } from "./tool-drawer.js";
import { isToolsMode, mountToolsMenuItem, renderToolsPage } from "./tools-mode.js";

function teacherPanel(config, accent, talk) {
  const group = config.smallGroup;
  if (!group || !(group.teacherMoves || group.moves || group.who || talk?.listenFor)) return null;
  const wrapper = el("aside", "sg-teacher");
  /*
   * ASK / LOOK FOR / IF STUCK / EXTEND, rendered as a labelled block rather
   * than a bullet list. Small-group teaching is fast: a teacher glancing at the
   * screen with 4-6 students waiting needs to find the next move by its LABEL,
   * not read a paragraph. The labels are the scan targets, so they carry the
   * weight and the prose stays one line each.
   *
   * `moves` (the old prose list) is gone from the data — 756 of its 840 lines
   * repeated across 50+ lessons — but is still read here so a stale cached
   * facilitation payload degrades to the old rendering instead of a blank panel.
   */
  const tm = group.teacherMoves || null;
  const MOVE_LABELS = [
    ["ask", "Ask"],
    ["lookFor", "Look for"],
    ["ifStuck", "If stuck"],
    ["extend", "Extend"],
  ];
  const teacherMovesHtml = tm
    ? `<dl class="sg-moves">${MOVE_LABELS.filter(([k]) => tm[k])
        .map(
          ([k, label]) =>
            `<div class="sg-move sg-move--${k}"><dt>${esc(label)}</dt><dd>${esc(tm[k])}</dd></div>`,
        )
        .join("")}</dl>`
    : "";
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
      ${teacherMovesHtml}
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

/**
 * The headline a STUDENT sees, which is not the same string as the lesson's
 * catalog identity.
 *
 * `config.title` is "5.3 Small Group · Group 1". That string is load-bearing
 * elsewhere — the playlist builder, the Canvas library, the registry, the launch
 * manifests and the search index all carry it — so it is not the thing to
 * rewrite. But on the page itself it sat directly under a badge reading
 * "SMALL GROUP · FOUNDATIONS", so the same lesson announced itself two
 * different ways in adjacent lines, and the louder one was an ability label.
 *
 * Students do not need to know they are in "Group 1". The badge already names
 * the work; this makes the headline agree with it and drops the group number.
 * Only the rendered text changes — no id, url, config field or manifest moves.
 */
function studentTitle(config, badge) {
  const raw = String(config.title || "").trim();
  if (!raw) return "Small-Group Math Studio";
  // Name the mathematics. The purpose ("Foundations", "Challenge") is already
  // in the badge directly above, so the headline carries the lesson topic.
  if (config.topic) {
    const number = raw.match(/^\d+\.\d+/)?.[0];
    return number ? `${number} · ${config.topic}` : String(config.topic);
  }
  // Take the purpose word straight from the badge so the two can never drift.
  const purpose = String(badge || "")
    .split("·")
    .pop()
    .trim();
  const renamed = raw.replace(/\s*·\s*Group\s*[12]\s*$/i, "");
  return purpose && renamed !== raw ? `${renamed} · ${purpose}` : raw;
}

function hero(config, accent, voice) {
  const container = el("div", "sg-hero");
  markScene(container, "hero");
  const grid = el("div", "sg-hero-grid");
  const copy = el("div", "sg-hero-copy");
  copy.classList.add("sg-scene-enter");
  const badge = config.launch?.badge || `Small Group · ${accent.name}`;
  copy.appendChild(el("div", null, `<span class="sg-kicker">${esc(badge)}</span>`));
  copy.appendChild(el("h1", null, esc(studentTitle(config, badge))));
  let more = copy.querySelector(".sg-obj-more");
  if (config.contentObjective) {
    // One crisp kid-facing line up top; full content + language objectives fold
    // into a collapsible detail so the hero stays readable for Level 1 students.
    copy.appendChild(el("p", "sg-obj", `Today: ${esc(coreObjective(config.contentObjective))}`));
    more = el("details", "sg-obj-more");
    more.appendChild(el("summary", null, "Full objectives"));
    more.appendChild(el("p", "sg-obj-full", esc(studentVoice(config.contentObjective))));
    if (config.languageObjective)
      more.appendChild(el("p", "sg-langobj", esc(studentVoice(config.languageObjective))));
    copy.appendChild(more);
  }
  // Leveled coaching register — the one line that tells each group how this
  // studio will feel (supportive build / mathematician's press / fresh start).
  copy.appendChild(el("p", "sg-tagline", bi(voice.tagline, voice.taglineEs)));
  const chips = el("div", "sg-chips");
  const focusByVariant = {
    catchup: "Focus: Concrete Visual Models & Foundations",
    group1: "Focus: Step-by-Step Problem Solving & Scaffolding",
    group2: "Focus: Direct Practice & Fluency Building",
    challenge: "Focus: Multi-Step Real-World Application",
  };
  const variantKey =
    config.variant || (config.smallGroup ? `group${config.smallGroup.group}` : "catchup");
  const focusLabel = focusByVariant[variantKey] || "Focus: Targeted Small-Group Practice";
  chips.appendChild(el("span", "sg-chip sg-chip-focus", esc(focusLabel)));
  chips.appendChild(el("span", "sg-chip", esc(config.timeEstimate || "15–20 min")));
  if (config.standard) chips.appendChild(el("span", "sg-chip", esc(config.standard)));
  chips.appendChild(el("span", "sg-chip", "Private · saved on this device"));
  copy.appendChild(chips);
  const sceneName = themeDisplayName(config.theme);
  if (sceneName) {
    const sceneChip = el("div", "sg-hero-scene-chip", `Scene · ${esc(sceneName)}`);
    if (more) {
      more.appendChild(sceneChip);
    } else {
      copy.appendChild(sceneChip);
    }
  }
  const mathMove = mathMoveOfTheDay(config);
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
  // The math move is a GRID ITEM, not an absolutely-positioned overlay.
  // It used to be `position:absolute` inside `copy` with a hand-tuned
  // `top:154px`, which worked until the storyboard wave gave `.sg-scene-enter`
  // an entrance animation: a transformed ancestor becomes the containing block
  // for absolute descendants, so `right:0` started resolving against the 648px
  // text column instead of the 974px hero — and the card landed on top of the
  // objective, covering the one line every student is supposed to read. Placed
  // in the reserved second column it cannot overlap anything at any width.
  grid.append(copy, mark);
  if (mathMove) grid.appendChild(mathMove);
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
  // A lesson that opted its hands-on lab out (`explore.lab: false`) must not
  // advertise that lab's move — the chip would name a table nobody can reach.
  const exploreType = config.explore?.lab === false ? null : config.explore?.type;
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

function mountStationTimer() {
  if (typeof document === "undefined") return;
  if (document.querySelector(".sg-station-timer")) return;

  const timerWrap = document.createElement("div");
  timerWrap.className = "sg-station-timer";
  timerWrap.setAttribute("role", "timer");
  timerWrap.setAttribute("aria-label", "Station rotation countdown timer");

  let remainingSec = 15 * 60;
  let timerInterval = null;

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  timerWrap.innerHTML = `
    <span class="sg-timer-icon" aria-hidden="true">⏱️</span>
    <span class="sg-timer-time">${fmt(remainingSec)}</span>
    <button type="button" class="sg-timer-toggle" title="Start station timer">▶</button>
    <button type="button" class="sg-timer-reset" title="Reset to 15 min">↺</button>
  `;

  const timeEl = timerWrap.querySelector(".sg-timer-time");
  const toggleBtn = timerWrap.querySelector(".sg-timer-toggle");
  const resetBtn = timerWrap.querySelector(".sg-timer-reset");

  const tick = () => {
    if (remainingSec > 0) {
      remainingSec--;
      timeEl.textContent = fmt(remainingSec);
      if (remainingSec === 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        toggleBtn.textContent = "▶";
        timerWrap.classList.add("sg-timer-alarm");
        if (window.AudioSynth && typeof window.AudioSynth.tada === "function") {
          window.AudioSynth.tada();
        }
      }
    }
  };

  toggleBtn.addEventListener("click", () => {
    timerWrap.classList.remove("sg-timer-alarm");
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      toggleBtn.textContent = "▶";
      toggleBtn.title = "Resume station timer";
    } else {
      if (remainingSec === 0) remainingSec = 15 * 60;
      timerInterval = setInterval(tick, 1000);
      toggleBtn.textContent = "⏸";
      toggleBtn.title = "Pause station timer";
    }
  });

  resetBtn.addEventListener("click", () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      toggleBtn.textContent = "▶";
    }
    remainingSec = 15 * 60;
    timeEl.textContent = fmt(remainingSec);
    timerWrap.classList.remove("sg-timer-alarm");
  });

  document.body.appendChild(timerWrap);
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
  // lesson in-place without reloading or navigating away.
  window.__ntClearLessonAnswers = () => {
    try {
      store.clear();
    } catch (_) {
      /* storage blocked */
    }
    try {
      document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach((input) => {
        if (input.type === "checkbox" || input.type === "radio") input.checked = false;
        else input.value = "";
      });
      document
        .querySelectorAll(".is-selected, .is-correct, .is-incorrect, .correct, .wrong, .selected")
        .forEach((el) => {
          if (!el.classList.contains("sg-tab-btn") && !el.classList.contains("tab-btn")) {
            el.classList.remove(
              "is-selected",
              "is-correct",
              "is-incorrect",
              "correct",
              "wrong",
              "selected",
            );
          }
        });
      document.querySelectorAll(".fb, .feedback, [role='status']").forEach((el) => {
        el.textContent = "";
        el.style.display = "none";
      });
    } catch (_) {}
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
    // Best consecutive-correct run, persisted for the teacher console.
    bestStreak: Number(store.get("bestStreak")) || 0,
    // Named misconceptions seen on this device, as {id: count}. Counts only —
    // the typed response that produced them is never stored or transmitted.
    misconceptions: store.get("misconceptions") || {},
  };
  // Reach instrumentation: which tabs students actually arrive at, and how long
  // the studio takes to put a problem in front of them. See small-group-reach.js
  // for why arrivals — not completions — are the number that matters here.
  const reach = createReachLog(store);

  const events = {
    onAttempt({ correct, item, response, choiceIndex = null }) {
      state.attempts++;
      reach.markFirstProblem();
      let namedThisAttempt = null;
      if (!correct && item) {
        // A wrong answer is the richest signal in the room; until now it was
        // rendered as a red outline and discarded. Name it when — and only
        // when — the arithmetic identifies exactly one mechanism.
        //
        // Authored distractor tags come first. The studio used to consult only
        // the predictor, which can name an error solely from a stem it can parse
        // as arithmetic — so on a prose word problem an author who had already
        // named the distractor was ignored, and the miss recorded nothing.
        const authored =
          (Array.isArray(item.misconceptionTags) &&
            choiceIndex != null &&
            item.misconceptionTags[choiceIndex]) ||
          item.misconceptionTag ||
          null;
        const named =
          resolveAuthoredTag(authored) || detectMisconception(item, response, choiceIndex);
        if (named) {
          state.misconceptions = recordMisconception(store, named) || state.misconceptions;
          state.lastMisconception = named;
          namedThisAttempt = named;
        }
      }
      // Close the loop back to the core lesson.
      //
      // The studio produces the most carefully diagnosed evidence in the product
      // and, until now, kept every bit of it inside its own device store. Four
      // surfaces read window.NTSignal — the review arcade picks its items from
      // it, the practice arcade its tier, the curriculum hub its suggestions, and
      // (since the diagnosis-routing change) the core lesson's Practice targets
      // the error a student keeps repeating. The studio wrote to none of them, so
      // a student could have their misconception precisely named in small group
      // on Tuesday and meet Wednesday's core lesson as a stranger.
      //
      // Recorded under the BASE lesson id, not the variant, because "2-11-group1"
      // and "2-11" are the same mathematics and the core lesson asks about the
      // latter. Device-local, no PII (a standard code and a tag slug), and fully
      // guarded — a missing signal store is a silent no-op.
      try {
        window.NTSignal?.record?.({
          standard: config.standard || "",
          correct: Boolean(correct),
          misconceptionTag: namedThisAttempt || undefined,
          lesson: String(config.lessonId || "").replace(/-(?:group[12]|catchup)$/, ""),
        });
      } catch {
        /* signals must never break a studio */
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
      tabs?.setProgress(
        this.solved + phaseProgress.done.size,
        this.total + phaseProgress.keys.size,
      );
    },
  };

  // Session evidence → proficiency band (approaching/meeting/exceeding),
  // computed on demand so the teacher console and telemetry read the same
  // current answer.
  const getBand = () =>
    masteryBand({
      solved: tally.solved,
      total: tally.total,
      attempts: state.attempts,
      incorrectAttempts: state.incorrectAttempts,
      hints: state.hints,
    });

  // Studio complete: the student pressed Finish after the exit check.
  let completeSent = false;
  const onComplete = () => {
    phaseDone("sg-tab-check", "checkDone")();
    completion.hidden = false;
    completion.innerHTML = `<h2>Studio complete 🎉</h2><p>${esc(voice.completeBody)}</p>`;
    if (completeSent) return;
    completeSent = true;
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
      band: getBand().id,
      // Independent-evidence band: first-attempt score across the two exit
      // check problems, so the dashboard sees a mastery decision rather than
      // a single tap.
      checkBand: store.get("checkBand") || "",
      checkBandScore: store.get("checkBandScore") ?? null,
      standards: config.standard ? [config.standard] : [],
      // Named misconceptions as {id: count} — counts only, never the typed
      // response.
      misconceptions: state.misconceptions || {},
      ...reach.summary(),
    });
  };

  // One path, six steps, every problem authored for THIS lesson
  // (data/small-group-practice, docs/specs/small-group-practice-v1.md):
  // Key Words → Learn It → Practice Together → On My Own → Check → Apply.
  // The 2026-10-06 audit found the old three-part shell (each part with its own
  // sub-step strip) showed two "Step 1"s at once and stacked a readiness pulse,
  // strategy pickers, a level ladder, a consensus protocol, a coach and two
  // data labs around practice that had drifted to other lessons' mathematics.
  const practiceCtx = (tabId, storeKey) => ({
    store,
    events,
    tally,
    standard: config.standard || "",
    onDone: phaseDone(tabId, storeKey),
  });
  const vocab = createVocabularySection(
    config,
    variant,
    phaseDone("sg-tab-words", "vocabDone"),
    store,
  );
  const build = buildSection(config, phaseDone("sg-tab-learn", "buildDone"), { store });
  const together = createTogetherSection(config, practiceCtx("sg-tab-together", "togetherDone"));
  const own = createOnMyOwnSection(config, practiceCtx("sg-tab-own", "ownDone"));
  const check = createExitCheckSection(config, state, {
    ...practiceCtx("sg-tab-check", null),
    onComplete,
  });
  const apply = createApplyLab(config, variant, {
    number: 6,
    store,
    events,
    onDone: phaseDone("sg-tab-apply", "applyDone"),
  });
  const challenge = createChallengeCard(config, {
    store,
    events,
    tally,
    standard: config.standard || "",
  });

  // Register the phase checks that exist in THIS lesson, and restore ones
  // finished last session, so the meter's denominator is honest. Practice
  // problems are tallied one by one, not as phases.
  const trackedPhases = [
    [vocab, "vocabDone"],
    [build, "buildDone"],
    [apply, "applyDone"],
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
    {
      id: "sg-tab-words",
      label: "Key Words",
      sub: "Words for today",
      panel: makePanel("sg-tab-words", [vocab]),
    },
    {
      id: "sg-tab-learn",
      label: "Learn It",
      sub: "See how it works",
      panel: makePanel("sg-tab-learn", [build]),
    },
    {
      id: "sg-tab-together",
      label: "Practice Together",
      sub: "Solve with your group",
      panel: makePanel("sg-tab-together", [together]),
    },
    {
      id: "sg-tab-own",
      label: "On My Own",
      sub: "Solve by yourself",
      panel: makePanel("sg-tab-own", [own]),
    },
    {
      id: "sg-tab-check",
      label: "Check",
      sub: "Show what you know",
      panel: makePanel("sg-tab-check", [check, completion]),
    },
    {
      id: "sg-tab-apply",
      // Not every lesson has a Reveal word problem; then the step is the Challenge.
      label: apply ? "Apply" : "Challenge",
      sub: apply ? "Use it in a real problem" : "One harder problem",
      panel: makePanel("sg-tab-apply", [apply, challenge]),
    },
  ];

  const heroNode = hero(config, accent, voice);
  const courseNav = createLessonCourseNav(config);
  if (courseNav) app.appendChild(courseNav);
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
          `<b>${esc(entry.code)}${entry.shortLabel ? ` · ${esc(entry.shortLabel)}` : ""}:</b> ${esc(entry.fullText)}`,
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
    onReach: (id) => {
      reach.mark(id);
      trackSmallGroupStep(config, {
        tab: id,
        index: activeTabSteps.findIndex((step) => step.id === id),
        count: activeTabSteps.length,
      });
    },
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

  // Point-of-use interactive tools. Purely additive: it appends a chip row to the
  // panels whose lesson sections authored a manipulative (plus one in the hero),
  // and each chip opens the tool in a modal dialog. It never touches lesson
  // content, the store, or the progress meter — see engine/core/tool-drawer.js.
  // Mounted here, after numbering, so its rows can never be mistaken for a
  // numbered lesson section.
  mountToolDrawer(config, { panels: activeTabSteps, hero: heroNode });
  simplifyStudioHeader(heroNode);

  // The always-visible "Hide buttons" pill (Focus Mode) — same affordance as
  // the whole-group lessons.
  import("./focus-mode.js").then((m) => m.mountUniversalFocusButton());

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
    vocabDone: "sg-tab-words",
    buildDone: "sg-tab-learn",
    togetherDone: "sg-tab-together",
    ownDone: "sg-tab-own",
    checkDone: "sg-tab-check",
    applyDone: "sg-tab-apply",
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
      // The rotation timer is the teacher's tool; students never see a clock.
      mountStationTimer();
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
      // The facilitation plan shipped for every studio but nothing ever linked
      // it, so in practice it did not exist. It opens in its own tab on purpose:
      // this is the sheet the teacher prints and holds, and presenting blacks
      // out every teacher-only panel on the shared screen — the coaching has to
      // live somewhere the group cannot read.
      const plan = el("a", "btn ghost", "🧭 Small-group plan (print)");
      plan.href = `/teacher-small-group/${encodeURIComponent(config.lessonId)}/plan`;
      plan.target = "_blank";
      plan.rel = "noopener nofollow";
      foot.prepend(back);
      foot.append(plan, worksheet, scorm);
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
// navigable window. "/lessons/6-13-group1/" + "1-1-group2" → "/lessons/6-13-group2/".
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

/**
 * Lazy-load the device-local signal store and stamp the lesson meta global that
 * deep engine components read. Best-effort by construction: every failure path
 * leaves window.NTSignal absent, which every consumer already tolerates.
 */
function loadLearningSignals(config) {
  try {
    // Under the BASE lesson id — "2-11-group1" and "2-11" are the same
    // mathematics, and the core lesson asks about the latter.
    const base = String(config.lessonId || "").replace(/-(?:group[12]|catchup)$/, "");
    window.__ntLessonMeta = { standard: config.standard || "", lesson: base };
    if (!window.NTSignal && !document.querySelector('script[src^="/assets/nt-signal.js"]')) {
      const sig = document.createElement("script");
      sig.src = "/assets/nt-signal.js";
      sig.defer = true;
      document.head.append(sig);
    }
  } catch {
    /* signals must never break a studio */
  }
}

export function bootSmallGroup(config) {
  // Same shared Canvas/SCORM resume relay as the whole-group lessons. No-op
  // unless ?lms=scorm. Small-group variants are packageable too, so they must
  // not be the one family that silently loses resume.
  ensureCanvasBridge(config);
  // Device-local learning signals (assets/nt-signal.js → window.NTSignal).
  //
  // The full-lesson entry (core/app.js) has lazy-loaded this for a while; the
  // studio never did, so window.NTSignal was simply absent on every /lessons/
  // <id>-group1/ page. That is not a missing feature so much as a broken one:
  // the studio is where the most carefully diagnosed evidence in the product is
  // produced, and it was the one surface structurally unable to contribute to
  // the store that the arcades, the hub and (now) the core lesson all read.
  //
  // Loaded the same way and for the same reason: no HTML change to the lesson
  // shells, and every consumer guards on window.NTSignal, so a failed load stays
  // a silent no-op rather than a broken studio.
  loadLearningSignals(config);

  // Arrow / Page keys scroll the studio panels, not just the mouse wheel.
  enableKeyboardScrolling();
  // The studio had no click-to-enlarge at all: every attachImageZoom call lived
  // in the full-lesson renderer, so a small-group scene or diagram did nothing
  // when a student tapped it.
  observeContentImageZoom(document.body);
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
