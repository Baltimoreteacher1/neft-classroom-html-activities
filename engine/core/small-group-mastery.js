import { bi, biHtml, el, esc } from "./small-group-ui.js";

/**
 * More Practice, rebuilt as a mastery ladder.
 *
 * What it replaced: More Practice was "the same set again, one card at a time."
 * A student who could already do it repeated it; a student who could not repeat
 * it repeated it too. Nothing in the section told anyone what good work looked
 * like, gave them a say in how hard they worked, or offered a route to the top
 * of the rubric.
 *
 * The shape here is the TEACH-rubric level-4 picture of a classroom — students
 * own their learning: they know the criteria, they choose their level of
 * challenge, they judge their own work against the criteria, and they justify
 * and extend rather than only answer. All four are student moves, so all four
 * are controls on this page.
 *
 * Two design rules this module will not break:
 *
 *  1. **Level 4 must be reachable from every lesson.** 64 of the 148 small-group
 *     lessons author no `extending` items at all, so a "level 4" defined as
 *     harder problems would be permanently unreachable in nearly half the
 *     fleet. Level 4 here is defined by what the student DOES — justify the
 *     method, create a new problem, generalize — which every lesson supports.
 *     Authored extending items are promoted on top when they exist.
 *
 *  2. **The level is a choice, not a label.** It can be changed at any time in
 *     either direction, it is never announced as an ability, and nothing is
 *     locked behind it. Level 2 is "with support open", not "the low group".
 */

/** Student-facing success criteria, derived from the lesson's own objectives. */
export function successCriteria(config = {}) {
  const strip = (text) =>
    String(text || "")
      .replace(/^\s*(with my small group,?|with my group,?|with support,?)\s*/i, "")
      .replace(/^\s*i can\s*/i, "")
      .replace(/^./, (first) => first.toUpperCase())
      .trim();
  const doIt = strip(config.contentObjective);
  const sayIt = strip(config.languageObjective);
  const criteria = [];
  if (doIt) criteria.push({ id: "do", label: "Do it", text: doIt });
  if (sayIt) criteria.push({ id: "say", label: "Say it", text: sayIt });
  // The third criterion is the rubric's top band made explicit, and it is the
  // same in every lesson on purpose: it is the move that turns a correct answer
  // into evidence of understanding.
  criteria.push({
    id: "prove",
    label: "Prove it",
    text: "Explain why the method works, and use it on a problem I have not seen.",
    textEs: "Explicar por qué funciona el método y usarlo en un problema nuevo.",
  });
  return criteria;
}

const LEVELS = [
  {
    id: "l2",
    number: 2,
    name: "Practice with support",
    nameEs: "Practicar con apoyo",
    blurb: "Every problem shows its word bank and step guide. Use them.",
    blurbEs: "Cada problema muestra su banco de palabras y su guía de pasos.",
    path: "stabilize",
    supports: true,
  },
  {
    id: "l3",
    number: 3,
    name: "On my own",
    nameEs: "Por mi cuenta",
    blurb: "Supports stay closed. Open a hint only if you get stuck.",
    blurbEs: "Los apoyos quedan cerrados. Abre una pista solo si te atascas.",
    path: "connect",
    supports: false,
  },
  {
    id: "l4",
    number: 4,
    name: "Prove it",
    nameEs: "Demuéstralo",
    blurb: "Solve on your own, then explain why it works and write your own problem.",
    blurbEs: "Resuelve por tu cuenta, luego explica por qué funciona y escribe tu propio problema.",
    path: "stretch",
    supports: false,
  },
];

const RATINGS = [
  ["not-yet", "Not yet"],
  ["almost", "Almost"],
  ["got-it", "Got it"],
];

/** Bound textarea that saves on input — the same contract the rest of the studio uses. */
function savedField(labelText, labelEs, key, state, store, placeholder = "") {
  const label = el("label", "block-lab", bi(labelText, labelEs));
  const area = el("textarea", "sg-ta");
  area.placeholder = placeholder;
  area.value = state[key] || "";
  area.oninput = () => {
    state[key] = area.value;
    store?.set(key, area.value.trim());
  };
  label.appendChild(area);
  return { node: label, area };
}

/**
 * The "Go for a 4" panel. Three tasks, in the order a student can actually do
 * them: justify what you just did, then generalize it, then build something new
 * with it. Sentence frames on every one, because the barrier to a 4 for an
 * emergent-bilingual student is almost never the mathematics.
 */
function createLevelFourPanel(_config, state, store, onProgress) {
  const panel = el("section", "sg-m4");
  panel.setAttribute("aria-label", "Go for a 4");
  panel.appendChild(
    el(
      "div",
      "sg-h",
      `<span class="n">4</span><div><div class="sg-eyebrow">${esc("Top of the rubric")}</div><h2>Go for a 4</h2></div>`,
    ),
  );
  panel.appendChild(
    el(
      "p",
      "sg-directions",
      biHtml(
        "A right answer shows you can do it. These three show you understand it. Anyone can do them, from any level above.",
        "Una respuesta correcta muestra que puedes hacerlo. Estas tres muestran que lo entiendes. Cualquiera puede hacerlas, desde cualquier nivel.",
      ),
    ),
  );

  const tasks = [
    {
      key: "m4Justify",
      label: "1. Justify — why does your method work?",
      labelEs: "1. Justifica: ¿por qué funciona tu método?",
      frames: [
        "My method works because ___.",
        "This step is allowed because ___.",
        "It would NOT work if ___.",
      ],
      placeholder: "Not what you did — why it is allowed to work.",
    },
    {
      key: "m4Generalize",
      label: "2. Generalize — what would change if one number changed?",
      labelEs: "2. Generaliza: ¿qué cambiaría si un número cambiara?",
      frames: [
        "If ___ became ___, then ___ would change because ___.",
        "The part that always stays the same is ___.",
      ],
      placeholder: "Pick one number in the problem. Change it. Say what follows.",
    },
    {
      key: "m4Create",
      label: "3. Create — write a NEW problem like this one, and solve it.",
      labelEs: "3. Crea: escribe un problema NUEVO como este y resuélvelo.",
      frames: ["My problem: ___", "My answer: ___", "You have to ___ first, because ___."],
      placeholder: "Write the problem, then your worked answer underneath it.",
    },
  ];

  const areas = [];
  for (const task of tasks) {
    const card = el("div", "sg-m4-task");
    const field = savedField(task.label, task.labelEs, task.key, state, store, task.placeholder);
    card.appendChild(field.node);
    card.appendChild(
      el(
        "div",
        "sg-frames",
        task.frames.map((frame) => `<span class="sg-frame">${esc(frame)}</span>`).join(""),
      ),
    );
    field.area.addEventListener("input", onProgress);
    areas.push(field.area);
    panel.appendChild(card);
  }

  const status = el("div", "sg-m4-status");
  status.setAttribute("aria-live", "polite");
  panel.appendChild(status);
  const refresh = () => {
    // 25 characters is a deliberately low bar: it distinguishes "wrote a
    // sentence" from "typed a letter to make the box turn green", and nothing
    // more. Judging the quality of the reasoning is the teacher's job, and this
    // panel prints straight onto the evidence card so they can.
    const done = areas.filter((area) => area.value.trim().length >= 25).length;
    status.textContent =
      done >= 3
        ? "✓ All three are written. Show them to your teacher — that is your 4."
        : `${done} of 3 written. Finish all three to show a 4.`;
    status.classList.toggle("is-complete", done >= 3);
    return done;
  };
  refresh();
  for (const area of areas) area.addEventListener("input", refresh);
  return { node: panel, refresh };
}

/**
 * Self-assessment against the criteria. This is the piece that makes the rest
 * of the section a rubric rather than a worksheet: the student judges their own
 * work against the stated criteria and names the evidence for the judgement.
 */
function createSelfCheck(criteria, state, store, onProgress) {
  const box = el("fieldset", "sg-selfcheck");
  box.appendChild(el("legend", "sg-innovation-title", "Check yourself against the criteria"));
  box.appendChild(
    el(
      "p",
      "sg-innovation-lede",
      bi(
        "Be honest — this is for you, not for a grade. “Not yet” tells your teacher exactly where to help.",
        "Sé honesto: esto es para ti, no para una nota. “Todavía no” le dice a tu maestro dónde ayudarte.",
      ),
    ),
  );
  state.selfCheck = state.selfCheck || {};
  const rows = [];
  for (const criterion of criteria) {
    const row = el("div", "sg-selfcheck-row");
    row.appendChild(
      el(
        "div",
        "sg-selfcheck-text",
        `<b>${esc(criterion.label)}</b><span>${esc(criterion.text)}</span>`,
      ),
    );
    const choices = el("div", "sg-selfcheck-choices");
    for (const [value, copy] of RATINGS) {
      const label = el("label", "sg-radio sg-selfcheck-radio");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `sg-selfcheck-${criterion.id}`;
      input.value = value;
      input.checked = state.selfCheck[criterion.id] === value;
      input.onchange = () => {
        state.selfCheck = { ...state.selfCheck, [criterion.id]: value };
        store?.set("selfCheck", state.selfCheck);
        onProgress?.();
      };
      label.append(input, document.createTextNode(copy));
      choices.appendChild(label);
    }
    row.appendChild(choices);
    rows.push(row);
    box.appendChild(row);
  }
  const evidence = savedField(
    "My evidence: which problem shows it?",
    "Mi evidencia: ¿qué problema lo muestra?",
    "selfCheckEvidence",
    state,
    store,
    "Problem 3 — my factor tree shows every prime factor.",
  );
  evidence.area.addEventListener("input", onProgress);
  box.appendChild(evidence.node);
  return { node: box, rows };
}

/**
 * @param {object} args
 * @param {any} args.config          lesson config
 * @param {any} args.state           renderer state bag (persisted by the store)
 * @param {any} args.store           Save/Resume store
 * @param {HTMLElement|null} args.practiceSection  the More Practice section, if this lesson has one
 * @returns {HTMLElement} the ladder, meant to sit ABOVE the practice items
 */
export function createMasteryLadder({
  config = {},
  state = {},
  store = null,
  practiceSection = null,
}) {
  const wrap = el("section", "sg-mastery");
  wrap.setAttribute("aria-label", "Mastery ladder");
  const criteria = successCriteria(config);

  wrap.appendChild(
    el(
      "div",
      "sg-h",
      `<span class="n">★</span><div><div class="sg-eyebrow">${esc("You are in charge of this part")}</div><h2>How far do you want to take it?</h2></div>`,
    ),
  );

  // ── Success criteria ─────────────────────────────────────────────────────
  const criteriaCard = el("div", "sg-criteria");
  criteriaCard.appendChild(el("div", "sg-eyebrow", "You have got it when you can…"));
  const list = el("ul", "sg-criteria-list");
  for (const criterion of criteria) {
    list.appendChild(el("li", null, `<b>${esc(criterion.label)}:</b> ${esc(criterion.text)}`));
  }
  criteriaCard.appendChild(list);
  wrap.appendChild(criteriaCard);

  // ── Level chooser ────────────────────────────────────────────────────────
  const chooser = el("div", "sg-level-row");
  chooser.setAttribute("role", "group");
  chooser.setAttribute("aria-label", "Choose your level");
  const note = el("div", "sg-level-note");
  note.setAttribute("aria-live", "polite");
  const buttons = new Map();

  const applyLevel = (level, persist) => {
    buttons.forEach((button, id) => button.setAttribute("aria-pressed", String(id === level.id)));
    note.innerHTML = biHtml(level.blurb, level.blurbEs);
    state.masteryLevel = level.id;
    if (persist) {
      store?.set("masteryLevel", level.id);
      // Reuse the existing adaptive machinery rather than a second ordering
      // system: 'stretch' promotes authored extending items, 'stabilize' opens
      // supports on every unsolved card, 'connect' is the neutral order.
      //
      // Only on a real pick. Firing this during the boot-time restore would
      // reorder and re-paginate More Practice underneath a student who has not
      // touched anything yet — and the renderer already restores last
      // session's `adaptivePath` into the section directly.
      document.dispatchEvent(new CustomEvent("sg:adaptive-path", { detail: level.path }));
    }
    if (level.supports && practiceSection) {
      // Braced deliberately. As a bare (unbraced) loop body this line was the
      // one file in the repo the formatter could not settle on: it hoisted the
      // JSDoc cast up onto the `for`, which orphaned the parens around `card`,
      // and then wanted to strip those parens on the next pass. A block gives
      // the comment somewhere to live, so the cast stays attached to `card` --
      // which it must, since `sgApplySupport` is a property this file hangs on
      // the element and Element does not declare it.
      for (const card of practiceSection.querySelectorAll(":scope > .prob:not(.sg-done-all)")) {
        /** @type {any} */ (card).sgApplySupport?.();
      }
    }
    wrap.dataset.level = level.id;
    fourPanel?.node.classList.toggle("is-target", level.id === "l4");
  };

  for (const level of LEVELS) {
    const button = el(
      "button",
      "sg-level-button",
      `<span class="sg-level-num" aria-hidden="true">${level.number}</span>` +
        `<span class="sg-level-name">${esc(level.name)}</span>`,
    );
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `Level ${level.number} — ${level.name}. ${level.blurb}`);
    button.onclick = () => applyLevel(level, true);
    buttons.set(level.id, button);
    chooser.appendChild(button);
  }
  wrap.append(chooser, note);
  wrap.appendChild(
    el(
      "p",
      "sg-level-switch",
      bi(
        "Change your level any time — going up or coming back down. Nothing is locked.",
        "Cambia tu nivel cuando quieras, hacia arriba o hacia abajo. Nada está bloqueado.",
      ),
    ),
  );

  // ── Level 4 tasks + self-check ───────────────────────────────────────────
  const selfCheck = createSelfCheck(criteria, state, store, () => refreshSummary());
  const fourPanel = createLevelFourPanel(config, state, store, () => refreshSummary());

  const summary = el("div", "sg-mastery-summary");
  summary.setAttribute("aria-live", "polite");
  const refreshSummary = () => {
    const written = fourPanel.refresh();
    const ratings = Object.values(state.selfCheck || {});
    const gotIt = ratings.filter((value) => value === "got-it").length;
    const rated = ratings.length;
    const parts = [
      `${rated} of ${criteria.length} criteria checked`,
      `${gotIt} at “Got it”`,
      `${written} of 3 level-4 tasks written`,
    ];
    summary.textContent = `Where you are right now — ${parts.join(" · ")}.`;
    summary.classList.toggle("is-complete", rated >= criteria.length && written >= 3 && gotIt >= 1);
  };

  wrap.append(fourPanel.node, selfCheck.node, summary);

  // Restore last session's level, or open on "On my own" — the neutral default,
  // because opening on level 2 tells every student the page expects them to
  // need support and opening on level 4 hides the supports from the students
  // who need them.
  const saved = LEVELS.find(
    (level) => level.id === (state.masteryLevel || store?.get("masteryLevel")),
  );
  applyLevel(saved || LEVELS[1], false);
  refreshSummary();
  return wrap;
}
