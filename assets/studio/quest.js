/**
 * Skill Quest (window.StudioQuest): an adaptive run through the lesson's own skills, opened from the header.
 * The model (quest-model.js) decides the next question and the level; this file draws it. Questions are fresh
 * generated problems mounted with the studio's own item kinds, so hints, Spanish, read-aloud and feedback all work
 * exactly as they do in the five sections. Nothing is timed and nothing here is a grade.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const M = W.StudioQuestModel;
  if (!M || !RT.api || !W.StudioGen) return;
  const { esc, es } = RT.util;
  const api = RT.api;
  const $ = (/** @type {string} */ sel, /** @type {ParentNode} */ root = document) =>
    /** @type {any} */ (root.querySelector(sel));

  /** The lesson's skills: each distinct generator its sections use, most-used first, at most three. */
  function skillsOf() {
    /** @type {Map<string, {g: string, label: string, n: number}>} */
    const seen = new Map();
    for (const sec of api.sections)
      for (const spec of sec.items)
        if (spec.k === "gen" && W.StudioGen.has(spec.g)) {
          const e = seen.get(spec.g) || {
            g: spec.g,
            label: spec.lab || W.StudioGen.registry[spec.g].title,
            n: 0,
          };
          e.n++;
          seen.set(spec.g, e);
        }
    return [...seen.values()].sort((a, b) => b.n - a.n).slice(0, 3);
  }

  const CSS = `
.quest-top{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:0 0 12px}
.quest-ladders{list-style:none;margin:0;padding:0;display:grid;gap:8px;flex:1 1 280px}
.quest-ladder{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:center}
.quest-ladder b{font-size:.95rem}
.quest-steps{display:flex;gap:4px}
.quest-steps i{width:28px;height:12px;border-radius:999px;background:var(--border,#d5dce5)}
.quest-steps i.on{background:var(--brand,#2c4a68)}
.quest-steps i.now{background:var(--sun,#f0bd4f);box-shadow:0 0 0 2px var(--brand,#2c4a68)}
.quest-ladder.done b::after{content:" ✓";color:var(--ok,#0a7d4b)}
.quest-note{margin:0 0 10px;font-weight:700;min-height:1.5em}
.quest-stage{min-height:140px}
.quest-stars{font-size:2.2rem;letter-spacing:.2em;margin:.2em 0}
.quest-sum{list-style:none;margin:10px 0;padding:0;display:grid;gap:6px}
#quest-btn{min-height:44px}
`;
  function css() {
    if ($("#quest-css")) return;
    const s = document.createElement("style");
    s.id = "quest-css";
    s.textContent = CSS;
    document.head.append(s);
  }

  function dialog() {
    $("#studio-quest")?.remove();
    const d = document.createElement("dialog");
    d.className = "u4-dialog";
    d.id = "studio-quest";
    d.setAttribute("aria-labelledby", "studio-quest-title");
    d.innerHTML = `<div class="u4-dialog-head"><h2 id="studio-quest-title">🎯 Skill Quest${es("Misión de habilidades")}</h2><button type="button" class="u4-close">Close</button></div><div class="u4-dialog-body"></div>`;
    document.body.append(d);
    $(".u4-close", d)?.addEventListener("click", () => d.close());
    d.addEventListener("close", () => d.remove());
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    return { dlg: d, body: /** @type {HTMLElement} */ ($(".u4-dialog-body", d)) };
  }

  const ladder = (/** @type {any} */ q) =>
    `<ul class="quest-ladders">${q.skills
      .map(
        (/** @type {any} */ s) =>
          `<li class="quest-ladder${s.mastered ? " done" : ""}"><b>${esc(s.label)}</b><span class="quest-steps" aria-label="Level ${s.level} of 4">${[
            1, 2, 3, 4,
          ]
            .map(
              (n) =>
                `<i class="${n < s.level || s.mastered ? "on" : n === s.level ? "now" : ""}"></i>`,
            )
            .join("")}</span></li>`,
      )
      .join("")}</ul>`;

  function run(/** @type {HTMLElement} */ body, /** @type {HTMLDialogElement} */ dlg) {
    const skills = skillsOf();
    const q = M.start(skills, { scaffold: !!W.EWLChrome?.pathway?.scaffold });
    let n = 0;
    const bus = W.StudioBus;
    /** @type {Record<string, boolean>} */
    const missed = {};
    const onAnswer = (/** @type {any} */ e) => {
      if (!e.ok && typeof e.itemId === "string" && e.itemId.startsWith("quest_"))
        missed[e.itemId] = true;
    };
    bus?.on("answer", onAnswer);

    const finish = () => {
      const s = M.summary(q);
      const st = api.state;
      st.quest = { runs: (st.quest?.runs || 0) + 1, best: Math.max(st.quest?.best || 0, s.stars) };
      api.save();
      bus?.emit("quest", {
        lesson: api.data.lesson,
        mode: api.data.mode,
        stars: s.stars,
        mastered: s.mastered,
      });
      const msg =
        s.stars === 3
          ? "You mastered every skill in this quest, mostly without help."
          : s.stars === 2
            ? "You mastered every skill. Next time, try to solve more on the first try."
            : s.stars === 1
              ? "You are on your way. Work the skills below that are not mastered yet, then try again."
              : "This quest was a lot. Open the hints in the practice sections, then come back for another run.";
      body.innerHTML = `<h3>Quest complete</h3><p class="quest-stars" aria-label="${s.stars} of 3 stars">${"★".repeat(s.stars)}${"☆".repeat(3 - s.stars)}</p>
        <p>${esc(msg)}</p>
        <ul class="quest-sum">${s.skills.map((/** @type {any} */ k) => `<li><strong>${esc(k.label)}</strong>: reached level ${k.level} of 4${k.mastered ? " · mastered ✓" : ""}</li>`).join("")}</ul>
        <p class="item-sub">${s.clean} of ${s.asked} questions solved on the first try, with no hints.</p>
        <p><button type="button" class="btn btn-go" data-again>Run another quest</button> <button type="button" class="btn btn-sm" data-close>Back to practice</button></p>`;
      $("[data-again]", body)?.addEventListener("click", () => run(body, dlg));
      $("[data-close]", body)?.addEventListener("click", () => dlg.close());
    };

    const next = () => {
      if (M.finished(q)) return finish();
      const { skill, level } = M.pick(q);
      const spec = q.skills[skill];
      n++;
      const id = `quest_${n}`;
      const seed = 5000 + Math.floor(Math.random() * 80000);
      /** @type {any} */
      let it;
      try {
        it = W.StudioGen.make(spec.g, level, seed);
      } catch (_e) {
        q.skills[skill].mastered = true; // a skill that cannot be built is never held against the student
        return next();
      }
      it.id = id;
      it.seed = seed;
      it.skill = spec.label;
      body.innerHTML = `<div class="quest-top">${ladder(q)}</div><p class="quest-note" role="status"></p><p class="item-sub">${esc(spec.label)} · level ${level} of 4 · question ${n}</p><div class="quest-stage stage-card"></div>`;
      api.mountItem({
        tab: 1,
        it,
        host: $(".quest-stage", body),
        redeem: true,
        onSolved: () => {
          const clean = !missed[id] && !(api.state.hints[id] > 0);
          const before = q.skills[skill].level;
          M.record(q, skill, { clean });
          const after = q.skills[skill];
          const note = $(".quest-note", body);
          if (note)
            note.textContent = after.mastered
              ? "Skill mastered! ✓"
              : after.level > before
                ? "Level up! The next one is harder."
                : after.level < before
                  ? "Let us go back a step and build it up again."
                  : clean
                    ? "Clean answer: a step closer."
                    : "Solved. Next time, try without help.";
          const b = document.createElement("button");
          b.type = "button";
          b.className = "btn btn-go btn-sm";
          b.textContent = M.finished(q) ? "See my results →" : "Next question →";
          b.addEventListener("click", next);
          $(".item-fb", body)?.append(b);
          b.focus();
        },
      });
    };
    next();
  }

  function init() {
    const skills = skillsOf();
    const actions = $(".header-actions");
    if (!skills.length || !actions || $("#quest-btn")) return;
    css();
    const b = document.createElement("button");
    b.type = "button";
    b.id = "quest-btn";
    b.className = "top-btn";
    b.innerHTML = "🎯 Skill Quest";
    b.addEventListener("click", () => {
      const { dlg, body } = dialog();
      body.innerHTML = `<p>Answer fresh questions on this lesson's skills. The quest gets harder when you are ready and steps back when you need it. No timer, no grade.</p>
        <ul class="quest-sum">${skills.map((s) => `<li><strong>${esc(s.label)}</strong></li>`).join("")}</ul>
        <p><button type="button" class="btn btn-go" data-start>Start the quest</button></p>`;
      $("[data-start]", body)?.addEventListener("click", () => run(body, dlg));
    });
    actions.insertBefore(b, $("#think-btn") || $("#toggle-es-btn") || null);
  }
  W.StudioQuest = { init, skillsOf };
  init();
})();
