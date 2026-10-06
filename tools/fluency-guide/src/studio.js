/* Grade 6 Fluency Studio. Self-contained; no network or external dependencies. */
window.FluencyStudio = (() => {
  "use strict";
  const DATA = window.FluencyData;
  const e = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const plain = (s) =>
    String(s ?? "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/?(?:b|strong|em|i|span|sup|sub)\b[^>]*>/gi, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  const lessons = DATA.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unitNumber: u.number })));
  const byId = Object.assign(
    Object.create(null),
    Object.fromEntries(lessons.map((l) => [l.id, l])),
  );
  const levels = Object.assign(Object.create(null), {
    workshop: "Lesson workshop · 8 tasks",
    foundation: "Build foundations · 4 tasks",
    core: "Connect & apply · 8 tasks",
    stretch: "Extend & explain · 4 tasks",
  });
  const modes = Object.assign(Object.create(null), {
    practice: "Focused practice",
    labs: "Math investigations",
    worksheet: "Worksheets",
    activity: "Partner activity",
    spine: "Core-skill drills",
  });
  const storageKey = "fluency.v4.practice";
  let lessonId = lessons[0].id,
    level = "foundation",
    mode = "practice",
    spineRank = 1;
  let isStudent =
    document.documentElement.dataset.student === "true" ||
    document.body.classList.contains("mode-student");
  if (isStudent) level = "workshop";
  const session = new Map();
  const storageLimit = 3500000;
  let storageAvailable = true,
    storageHeld = false,
    saveTimer = null,
    sketchCleanup = null;
  let storageMessage = "";
  const saveStatusText = () =>
    storageAvailable
      ? "Work saved in this browser tab."
      : storageMessage || "Saving is unavailable. Keep this page open or download your work.";
  const host = () => document.getElementById("view-studio");
  const button = (action, label, extra = "") =>
    `<button type="button" class="btn" data-studio="${action}" ${extra}>${label}</button>`;
  const currentKey = () => `${lessonId}-${level}`;
  function blankAnswer() {
    return {
      text: "",
      reasoning: "",
      ratioCells: {},
      ratioVersion: 0,
      reflection: "",
      attempts: 0,
      hints: 0,
      exposed: false,
      revealed: false,
      status: "unstarted",
      message: "",
      tone: "",
      confidence: "",
      strokes: [],
      scratchOpen: false,
    };
  }
  function restore() {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      if (raw.length > storageLimit) {
        storageHeld = true;
        storageAvailable = false;
        storageMessage =
          "The previous saved session is too large to restore. It has been kept unchanged. Download new work before leaving this page.";
        return;
      }
      const saved = JSON.parse(raw);
      if (saved.version !== 4 || !saved.sets || typeof saved.sets !== "object") return;
      for (const [key, set] of Object.entries(saved.sets).slice(0, 216)) {
        const parts = key.split("-"),
          tier = parts.pop(),
          id = parts.join("-");
        if (
          !byId[id] ||
          !levels[tier] ||
          !set ||
          typeof set !== "object" ||
          !Array.isArray(set.answers)
        )
          continue;
        const answers = set.answers.slice(0, 8).map((x) => {
          const a = blankAnswer();
          if (!x || typeof x !== "object") return a;
          for (const field of ["text", "reasoning", "reflection", "message"])
            a[field] = typeof x[field] === "string" ? x[field].slice(0, 1500) : "";
          if (x.ratioCells && typeof x.ratioCells === "object")
            for (const [cell, value] of Object.entries(x.ratioCells).slice(0, 24))
              if (/^\d-\d-\d$/.test(cell) && typeof value === "string")
                a.ratioCells[cell] = value.slice(0, 120);
          a.ratioVersion = x.ratioVersion === 1 ? 1 : 0;
          a.attempts = Number.isInteger(x.attempts) ? Math.max(0, Math.min(x.attempts, 10000)) : 0;
          a.hints = [0, 1, 2].includes(x.hints) ? x.hints : 0;
          for (const field of ["exposed", "revealed", "scratchOpen"]) a[field] = x[field] === true;
          a.status = ["unstarted", "draft", "retry", "checked", "supported", "reviewed"].includes(
            x.status,
          )
            ? x.status
            : "draft";
          a.tone = ["success", "retry", "review"].includes(x.tone) ? x.tone : "";
          a.confidence = ["ready", "practice", "help"].includes(x.confidence) ? x.confidence : "";
          if (Array.isArray(x.strokes))
            a.strokes = x.strokes
              .slice(-40)
              .filter((st) => st && ["pen", "eraser"].includes(st.tool) && Array.isArray(st.points))
              .map((st) => ({
                tool: st.tool,
                points: st.points
                  .slice(0, 200)
                  .filter(
                    (pt) =>
                      Array.isArray(pt) &&
                      pt.length === 2 &&
                      pt.every((n) => Number.isFinite(n) && n >= 0 && n <= 1),
                  ),
              }));
          return a;
        });
        session.set(key, {
          active: Number.isInteger(set.active)
            ? Math.max(0, Math.min(set.active, answers.length - 1))
            : 0,
          answers,
        });
      }
      if (byId[saved.lesson]) lessonId = saved.lesson;
      if (levels[saved.level]) level = saved.level;
      if (modes[saved.mode]) mode = saved.mode;
    } catch (_) {
      storageAvailable = false;
    }
  }
  function save() {
    clearTimeout(saveTimer);
    try {
      const serialized = JSON.stringify({
        version: 4,
        lesson: lessonId,
        level,
        mode,
        sets: Object.fromEntries(session),
      });
      if (storageHeld) {
        storageAvailable = false;
      } else if (serialized.length > storageLimit) {
        storageAvailable = false;
        storageMessage =
          "This tab has too much work to save more. Recent changes are not saved. Download this set before reloading or leaving.";
      } else {
        sessionStorage.setItem(storageKey, serialized);
        storageAvailable = true;
        storageMessage = "";
      }
    } catch (_) {
      storageAvailable = false;
    }
    const status = document.getElementById("fl-save-status");
    if (status) status.textContent = saveStatusText();
  }
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 200);
  }
  function problems(l) {
    if (level === "workshop") return l.workshop.tasks;
    const base = (l.practice || []).map((p, i) => ({
      ...p,
      label: `Foundation ${i + 1}`,
      skillText: l.skills[i]?.text || "",
    }));
    const checks = [{ prompt: l.quick_check, answer: l.solution }, ...(l.variants || [])].map(
      (p, i) => ({
        ...p,
        answer: plain(p.answer),
        explanation: "Check every part of the prompt and explain why your method works.",
        label: `Quick check ${"ABC"[i]}`,
        mode: "review",
      }),
    );
    const extension = {
      ...l.extension,
      answer: plain(l.extension?.answer),
      explanation: "Check the result against the situation and explain your reasoning.",
      label: "Transfer & extend",
      mode: "review",
    };
    if (level === "foundation") return base;
    if (level === "stretch")
      return [
        checks[1],
        checks[2],
        extension,
        {
          label: "Create & defend",
          prompt: `Write a problem that uses this skill: ${l.skills[0].text}. Include enough information to solve it. Solve your problem and check it in two different ways.`,
          answer:
            "Answers vary. A complete response includes a solvable problem, a correct solution, and two valid checks.",
          explanation:
            "Ask a partner to solve your problem without extra information. Compare your checks.",
          mode: "review",
        },
      ];
    return [...base, ...checks, extension];
  }
  function currentSet() {
    const count = problems(byId[lessonId]).length;
    let set = session.get(currentKey());
    if (!set || set.answers.length !== count) {
      set = { active: 0, answers: Array.from({ length: count }, blankAnswer) };
      session.set(currentKey(), set);
    }
    problems(byId[lessonId]).forEach((p, i) => {
      const a = set.answers[i];
      if (
        p.ratioTables &&
        a.ratioVersion !== 1 &&
        ["checked", "supported", "reviewed"].includes(a.status)
      ) {
        a.status = "draft";
        a.message =
          "Your previous answer is saved. Build the ratio table to complete this updated task.";
        a.tone = "";
      }
    });
    set.active = Math.max(0, Math.min(set.active, count - 1));
    return set;
  }
  function route() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (byId[p.get("lesson")]) lessonId = p.get("lesson");
    if (levels[p.get("level")]) level = p.get("level");
    const routedMode = p.get("activity") || p.get("mode");
    if (modes[routedMode]) mode = routedMode;
    if (p.has("lab")) selectLab(p.get("lab"));
    if (isStudent && !["practice", "labs"].includes(mode)) mode = "practice";
    if ((DATA.spine || []).some((s) => s.rank === Number(p.get("drill"))))
      spineRank = Number(p.get("drill"));
  }
  function hash() {
    const p = new URLSearchParams({
      view: "studio",
      lesson: lessonId,
      level,
      mode: isStudent ? "student" : mode,
    });
    if (isStudent) p.set("activity", mode);
    if (mode === "labs") p.set("lab", labsSnapshot().active);
    if (mode === "spine") p.set("drill", String(spineRank));
    return "#" + p.toString();
  }
  function update(focusId) {
    history.replaceState(null, "", hash());
    save();
    render();
    if (focusId) document.getElementById(focusId)?.focus();
  }

  function workGrid(kind = "lines") {
    if (kind === "coordinates") {
      return '<div class="work-grid" aria-label="Coordinate grid for graphing and sketches"></div>';
    }
    return '<div class="work-lines" aria-label="Ruled lines for handwritten work"></div>';
  }

  function ratioTablesMarkup(p, a = {}, display = "edit") {
    if (!p.ratioTables) return "";
    return `<section class="fl-ratio-work"><h3>${display === "key" ? "Completed ratio tables" : "Build and use a ratio table"}</h3>${p.tableDirections ? `<p>${e(p.tableDirections)}</p>` : ""}${p.ratioTables
      .map(
        (t, ti) =>
          `<table><caption>${e(t.title)}</caption><thead><tr>${t.headers.map((h) => `<th scope="col">${e(h)}</th>`).join("")}</tr></thead><tbody>${t.rows
            .map(
              (row, ri) =>
                `<tr>${row
                  .map((value, ci) => {
                    const cell = `${ti}-${ri}-${ci}`,
                      given = ri < (t.givenRows || 0);
                    const shown =
                      display === "key" || given ? String(value) : a.ratioCells?.[cell] || "";
                    return `<td>${display === "edit" && !given ? `<input type="text" inputmode="decimal" id="fl-ratio-${cell}" data-ratio-cell="${cell}" value="${e(shown)}" maxlength="120" aria-label="${e(t.title)}, row ${ri + 1}, ${e(t.headers[ci])}" aria-describedby="fl-ratio-help fl-feedback">` : e(shown) || "&nbsp;"}</td>`;
                  })
                  .join("")}</tr>`,
            )
            .join("")}</tbody></table>`,
      )
      .join(
        "",
      )}${display === "edit" ? '<p id="fl-ratio-help">Enter a number, decimal, or fraction in every blank cell. Use the same multiplier or divisor for both quantities in a row. Your table saves with your work.</p>' : ""}</section>`;
  }
  function checkRatioTables(p, a) {
    for (const [ti, t] of (p.ratioTables || []).entries())
      for (const [ri, row] of t.rows.entries()) {
        if (ri < (t.givenRows || 0)) continue;
        for (const [ci, value] of row.entries()) {
          const cell = `${ti}-${ri}-${ci}`,
            entered = a.ratioCells?.[cell] || "";
          if (!entered.trim() || !close(parseMath(entered), value)) {
            a.message = `${t.title}, row ${ri + 1}: ${!entered.trim() ? "enter" : "recheck"} ${t.headers[ci]}. Use the requested first-column value and scale BOTH quantities by the same factor.`;
            a.tone = "retry";
            a.status = "retry";
            return `fl-ratio-${cell}`;
          }
        }
      }
    if (p.ratioTables) a.ratioVersion = 1;
    return "";
  }
  function workshopMarkup(l) {
    const w = l.workshop;
    if (!w) return "";
    return `<section class="fl-workshop-intro"><div class="fl-workshop-goal"><h2>Lesson ${e(l.id)}: ${e(l.title)}</h2><p>${e(w.goal)}</p></div><ol class="fl-learning-sequence" aria-label="Learning sequence"><li>See an example</li><li>Try with guidance</li><li>Practice independently</li><li>Repair & apply</li></ol><details class="fl-model-lesson" ${level === "workshop" ? "open" : ""}><summary>Learn with a visual model and worked example</summary><div class="fl-model-lesson-grid">${w.ratioTables ? ratioTablesMarkup(w, {}, "key") : window.FluencyModels.render(w.model, "Worked-example model · different from your practice tasks")}<div class="fl-example-lesson"><h3>A worked example</h3><p>${e(w.example.prompt)}</p><ol>${w.example.steps.map((step) => `<li>${e(step)}</li>`).join("")}</ol><p class="fl-worked-result"><strong>Result:</strong> ${e(w.example.answer)}</p><aside><strong>Watch for this mistake</strong><p>${e(w.misconception.claim)}</p><p>${e(w.misconception.repair)}</p></aside></div></div><div class="fl-model-lesson-footer"><p>Try the first two tasks with the steps. Then try four new problems, repair an error, and apply the idea.</p>${button("begin", "Start practicing")}</div></details>${level !== "workshop" ? button("workshop", "Open the complete lesson workshop") : ""}</section>`;
  }
  function workshopSheet(l, key = false) {
    const w = l.workshop,
      items = w.tasks;
    const header = (page, total) =>
      `<div class="sheet-meta"><span>EDUWONDERLAB · GRADE 6 LESSON WORKSHOP</span><span>${key ? "SEPARATE WORKED KEY" : "STUDENT PRACTICE"} · ${page}/${total}</span></div><h2>Lesson ${e(l.id)}: ${e(l.title)}</h2><p>${e(w.goal)}</p>`;
    const pages = [
      `<section class="sheet fl-workshop-sheet fl-teaching-sheet">${header(1, 9)}<h3>Learn with a model</h3>${w.ratioTables ? ratioTablesMarkup(w, {}, "key") : window.FluencyModels.render(w.model, "Model for the worked example")}<h3>Worked example: ${e(w.example.prompt)}</h3><ol>${w.example.steps.map((step) => `<li>${e(step)}</li>`).join("")}</ol><p><strong>Result:</strong> ${e(w.example.answer)}</p><div class="support-box"><strong>Useful words</strong><p>${l.vocabulary.map((v) => `${e(v.term)}: ${e(v.def)}`).join("<br>")}</p><strong>Explain:</strong><p>${e(l.frame)}</p></div><footer>This example is solved for learning. The following pages contain new practice.</footer></section>`,
    ];
    for (let i = 0; i < items.length; i++) {
      pages.push(
        `<section class="sheet fl-workshop-sheet">${header(i + 2, 9)}${!key ? "<p>Show your work with words, equations, or a model. Put units in your explanation.</p>" : ""}<div class="fl-print-tasks">${items
          .slice(i, i + 1)
          .map(
            (p, j) =>
              `<article class="paper-task"><h3>${i + j + 1}. ${e(p.label)}</h3><p>${e(p.prompt)}</p>${p.options ? `<p>${p.options.map((o) => `□ ${e(o)}`).join(" &nbsp; ")}</p>` : ""}${p.ratioTables ? ratioTablesMarkup(p, {}, key ? "key" : "print") : i < 6 ? window.FluencyModels.render(p.model, "Model for this problem") : ""}${key ? `<div class="key-answer"><strong>${e(p.answer)}</strong><p>${e(p.explanation)}</p></div>` : `${p.guidance?.length ? `<ol class="fl-print-guidance">${p.guidance.map((step) => `<li>${e(step)}</li>`).join("")}</ol>` : ""}${p.ratioTables ? '<div class="fl-ratio-explain">Explain the scale factor and use a table row to justify your answer.<br><br><br></div>' : workGrid()}`}</article>`,
          )
          .join(
            "",
          )}</div><footer>${key ? "Keep this worked key separate from student practice." : "Explain a key step: I used ___ because ___. I checked by ___."}</footer></section>`,
      );
    }
    return pages.join("");
  }
  function worksheet(l, key = false) {
    const items = problems(l);
    if (level === "workshop") return workshopSheet(l, key);
    const chunks = [];
    for (let i = 0; i < items.length; i += 4) chunks.push(items.slice(i, i + 4));

    return chunks
      .map(
        (chunk, page) => `
      <section class="sheet ${key ? "key-sheet" : ""}">
        <div class="sheet-meta">
          <span>REVEAL MATH GRADE 6 · FLUENCY &amp; PRACTICE STUDIO</span>
          <span>${key ? "TEACHER WORKED KEY" : "STUDENT WORK"} · PAGE ${page + 1}/${chunks.length}</span>
        </div>
        <h2>Lesson ${e(l.id)}: ${e(l.title)}</h2>
        <p class="sheet-sub">${e(levels[level])} · Prepares for Standard ${e(l.standard ? l.standard.code : "6.NS")}</p>
        ${
          key
            ? "<p><strong>Facilitation note:</strong> Accept equivalent values unless the question requests a specific representation, scale, or simplest form. Discuss units and reasoning.</p>"
            : '<p class="name-line">Name: _________________________________________ Date: _________________ Period: _______</p><p>Show complete thinking. Label units. Use an equation, sketch, or model. Accuracy before speed.</p>'
        }
        ${
          level === "foundation" && page === 0
            ? `
          <aside class="support-box">
            <strong>Talk it through · Language &amp; Concept Bridge</strong>
            <p>${e(l.frame || "")}</p>
            <p>${e(
              (l.vocabulary || [])
                .map((v) => v.term + ": " + v.def)
                .slice(0, 2)
                .join(" · "),
            )}</p>
          </aside>`
            : ""
        }
        <div class="task-grid">
          ${chunk
            .map(
              (p, i) => `
            <article class="paper-task">
              <div class="task-label">Task ${page * 4 + i + 1} · ${e(p.label)}</div>
              <p>${e(p.prompt)}</p>
              ${
                key
                  ? `
                <div class="key-answer">
                  <strong>Answer: ${e(p.answer)}</strong>
                  <p>${e(p.explanation)}</p>
                  ${p.skillText ? `<small>Prerequisite skill: ${e(p.skillText)}</small>` : ""}
                </div>`
                  : workGrid(/plot|graph|coordinate/i.test(p.prompt) ? "coordinates" : "lines")
              }
            </article>`,
            )
            .join("")}
        </div>
        ${
          !key
            ? `
          <p class="reflection">
            One strategy or model I used: ____________________________________________________________________<br>
            My next step: &nbsp; □ Explain my steps &nbsp; □ Try another problem &nbsp; □ Review with a partner
          </p>`
            : ""
        }
        <footer>
          Reveal Math Grade 6 Supplemental Fluency · Unit ${e(l.unitNumber)} · ${key ? "Confidential Teacher Key — For classroom assessment & reteach" : "Show all scratchwork; take time to verify each answer."}
        </footer>
      </section>`,
      )
      .join("");
  }

  function activity(l, key = false) {
    return `
      <section class="sheet activity-sheet">
        <div class="sheet-meta">
          <span>REVEAL MATH GRADE 6 · PARTNER INVESTIGATION LAB</span>
          <span>${key ? "TEACHER FACILITATION KEY" : "STUDENT PARTNER ACTIVITY"}</span>
        </div>
        <h2>Lesson ${e(l.id)}: Notice, Repair, and Explain</h2>
        <p class="sheet-sub">${e(l.title)} · 12–15 Minutes · Collaborative Partner Routine</p>
        <div class="activity-steps">
          <div>
            <b>1 · Solve · 3 min</b>
            <p>Both partners solve the launch problem independently on paper.</p>
          </div>
          <div>
            <b>2 · Investigate · 6 min</b>
            <p>Partner A reads response 1. Partner B explains what to check. Work together to repair it. Switch roles for response 2.</p>
          </div>
          <div>
            <b>3 · Transfer · 4 min</b>
            <p>Solve the independent transfer problem. Compare strategies and verify reasoning.</p>
          </div>
        </div>
        <div class="support-box">
          <b>Launch Problem</b>
          <p>${e(l.quick_check)}</p>
          ${key ? `<p class="key-answer">Worked Solution: ${e(plain(l.solution))}</p>` : ""}
        </div>
        <div class="task-grid">
          ${(l.errors || [])
            .slice(0, 2)
            .map(
              (err, i) => `
            <article class="paper-task">
              <b>Student Response ${i + 1} to Investigate</b>
              <blockquote>“${e(err.shows)}”</blockquote>
              <p>What error or misconception might this student have had? Write the corrected step and explain the correct reasoning.</p>
              ${
                key
                  ? `
                <div class="key-answer">
                  <p><strong>Misconception:</strong> ${e(err.means)}</p>
                  <p><strong>Coaching move:</strong> ${e(err.do)}</p>
                </div>`
                  : workGrid()
              }
            </article>`,
            )
            .join("")}
        </div>
        <p class="sentence-frame"><b>Discussion Frame:</b> “The step that needs checking is ___ because ___. I verified it by ___.”</p>
        <div class="transfer-box">
          <b>Independent Transfer Check</b>
          <p>${e(l.variants && l.variants[0] ? l.variants[0].prompt : l.quick_check)}</p>
          ${key ? `<p class="key-answer">Answer: ${e(plain(l.variants && l.variants[0] ? l.variants[0].answer : l.solution))}</p>` : workGrid()}
        </div>
        ${
          key
            ? "<p><strong>Observation Tip:</strong> Ask partners to justify their calculations using vocabulary terms. A correct answer without an explanation does not demonstrate mastery.</p>"
            : "<p>Partner Checklist: &nbsp; □ We both explained our reasoning. &nbsp; □ We corrected both errors. &nbsp; □ We tried transfer independently.</p>"
        }
      </section>`;
  }

  function drillSheet(s, key = false) {
    return `
      <section class="sheet">
        <div class="sheet-meta">
          <span>REVEAL MATH GRADE 6 · FLUENCY SPINE</span>
          <span>${key ? "TEACHER KEY" : "STUDENT DRILL"}</span>
        </div>
        <h2>Core Skill #${e(s.rank)}: ${e(s.skill)}</h2>
        <p class="sheet-sub">Six Rapid Practice Tasks · Accuracy, Strategy, and Explanation</p>
        <p>${e(plain(s.routine).replace(/60-Second Fact Ladder:/g, "Fact Routine:"))}</p>
        ${!key ? '<p class="name-line">Name: _________________________________________ Date: _________________</p>' : ""}
        <div class="task-grid">
          ${s.drill.items
            .map(
              (p, i) => `
            <article class="paper-task">
              <b>Task ${i + 1}.</b> ${e(p.q)}
              ${key ? `<p class="key-answer">Answer: <strong>${e(p.a)}</strong></p>` : workGrid()}
            </article>`,
            )
            .join("")}
        </div>
        <p><strong>Connection Reflection:</strong> Which two tasks above used related mathematical relationships? Explain the pattern you noticed.</p>
        <footer>Fluency Spine Skill #${e(s.rank)} · Utilized in ${e(s.count)} Grade 6 lessons</footer>
      </section>`;
  }

  /* -------------------------------------------------------- advanced math parser */

  // Strict value parsing. No eval, executable expressions, arbitrary unit suffixes,
  // or punctuation stripping: mathematical signs and operators retain their meaning.
  function parseMath(raw) {
    if (raw == null) return NaN;
    let s = String(raw).trim().replace(/[−–—]/g, "-");
    if (!s || s.length > 120) return NaN;
    const units =
      /\s+(?:miles?|meters?|metres?|centimeters?|centimetres?|kilometers?|kilometres?|feet|foot|inches|inch|yards?|hours?|hrs?|minutes?|seconds?|dollars?|cm|mm|km|m|ft|in|yd|mi)(?:[²³]|\^[23])?$/i;
    s = s.replace(units, "").trim();
    if (s.startsWith("$")) s = s.slice(1).trim();
    if (s.includes(",")) {
      if (!/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(s)) return NaN;
      s = s.replace(/,/g, "");
    }
    let m;
    if ((m = s.match(/^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/))) {
      const den = Number(m[4]);
      return den > 0 && Number(m[3]) < den
        ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) + Number(m[3]) / den)
        : NaN;
    }
    if ((m = s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/)))
      return Number(m[2]) ? Number(m[1]) / Number(m[2]) : NaN;
    if (
      (m = s.match(
        /^([+]?(?:\d+(?:\.\d+)?|\.\d+))\s*(?::|\s+to\s+)\s*([+]?(?:\d+(?:\.\d+)?|\.\d+))$/i,
      ))
    )
      return Number(m[2]) ? Number(m[1]) / Number(m[2]) : NaN;
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*%$/.test(s))
      return Number(s.replace("%", "").trim()) / 100;
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) {
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  }
  const close = (a, b) =>
    Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  const normalize = (s) =>
    String(s).trim().toLowerCase().replace(/[−–—]/g, "-").replace(/\s+/g, " ");
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  function sequence(raw) {
    const original = String(raw).trim();
    if (original.startsWith("(") !== original.endsWith(")")) return null;
    const s = original.replace(/^\(/, "").replace(/\)$/, "");
    const values = s.split(/\s*,\s*/).map(parseMath);
    return values.length > 1 && values.every(Number.isFinite) ? values : null;
  }
  function answerKind(p) {
    if (p.mode === "choice") return "choice";
    if (p.mode === "number") return "number";
    if (/^\([^()]+,[^()]+\)$/.test(p.answer)) return "coordinate";
    if (/^[\d.]+\s*:\s*[\d.]+$/.test(p.answer)) return "ratio";
    if (sequence(p.answer))
      return /list every positive factor|which of .*divide|list the three different face areas/i.test(
        p.prompt,
      )
        ? "set"
        : "sequence";
    if (/^[<>≤≥=]$/.test(p.answer)) return "symbol";
    if (/^\d+[–-]\d+$/.test(p.answer)) return "interval";
    // Explanations, algebra and answers with units need a human comparison.
    return "review";
  }
  function checkAnswerMatch(raw, expected, modeOrProblem = "number") {
    const p =
      typeof modeOrProblem === "object"
        ? modeOrProblem
        : { mode: modeOrProblem, answer: expected, prompt: "" };
    const kind = answerKind(p);
    const s = String(raw ?? "").trim(),
      target = String(expected ?? "").trim();
    if (!s)
      return { match: false, message: "Enter an answer first. You can use a hint to get started." };
    if (kind === "review")
      return {
        match: false,
        review: true,
        message:
          "This task asks for reasoning. Compare your work with the example, then explain what you checked.",
      };
    if (kind === "choice") {
      const match = s.toLowerCase() === target.toLowerCase();
      return {
        match,
        message: match
          ? "Correct. Now explain the evidence for your choice."
          : "Not yet. Revisit the definition and the model, then try again.",
      };
    }
    if (/[a-z°²³$]/i.test(s.replace(/\bto\b/gi, "")))
      return {
        match: false,
        invalid: true,
        message:
          "Enter only the requested values or symbols. Put units and explanations in the reasoning box.",
      };
    let match = false;
    if (kind === "number") {
      if (/[a-z°²³]/i.test(s))
        return {
          match: false,
          invalid: true,
          message:
            "Enter just the number in this answer box. Use the reasoning box to explain the units.",
        };
      const n = parseMath(s),
        value = parseMath(target);
      if (!Number.isFinite(n))
        return {
          match: false,
          invalid: true,
          message:
            "Use one number, decimal, fraction, mixed number, or percent. Put your explanation in the reasoning box.",
        };
      match = close(n, value);
      if (match) {
        if (/as a percent/i.test(p.prompt) && !s.includes("%"))
          return {
            match: false,
            form: true,
            message:
              "Your value is equivalent. This question asks for a percent; write it with the % symbol.",
          };
        if (
          /as a decimal|write the decimal/i.test(p.prompt) &&
          !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)
        )
          return {
            match: false,
            form: true,
            message:
              "Your value is equivalent. Now write it in decimal form, as the question asks.",
          };
        if (
          /as (?:an improper|a) fraction|write the shaded fraction|simplify \d+\/\d+/i.test(
            p.prompt,
          )
        ) {
          const f = s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
          if (!f)
            return {
              match: false,
              form: true,
              message: "Your value is equivalent. Write it as a fraction using /.",
            };
          if (/simplify/i.test(p.prompt) && gcd(Math.abs(Number(f[1])), Number(f[2])) !== 1)
            return {
              match: false,
              form: true,
              message:
                "The fraction has the right value. Divide numerator and denominator by their greatest common factor to finish simplifying.",
            };
        }
      }
    } else if (["sequence", "coordinate", "set"].includes(kind)) {
      let a = sequence(s),
        b = sequence(target);
      if (!a)
        return {
          match: false,
          invalid: true,
          message: "Separate the numbers with commas. For a point, write (x, y).",
        };
      if (kind === "set") {
        a = [...a].sort((x, y) => x - y);
        b = [...b].sort((x, y) => x - y);
      }
      match = a.length === b.length && a.every((x, i) => close(x, b[i]));
    } else if (kind === "ratio") {
      const parts = (x) => x.split(/\s*:\s*|\s+to\s+/i).map(parseMath);
      const a = parts(s),
        b = parts(target);
      match = a.length === 2 && b.length === 2 && a.every((x, i) => close(x, b[i]));
    } else if (kind === "interval") {
      match = normalize(s).replace(/\s*to\s*|\s*-\s*/g, "-") === normalize(target);
    } else if (kind === "symbol") {
      match = s.replace(">=", "≥").replace("<=", "≤") === target;
    }
    return {
      match,
      message: match
        ? "Correct. Your answer meets this task’s target."
        : "Not yet. Recheck the quantities and the form requested. Try a hint, then revise your answer.",
    };
  }
  function findMisconception(studentText, p) {
    const actual = parseMath(studentText),
      expected = parseMath(p.answer);
    if (Number.isFinite(actual) && Number.isFinite(expected) && !close(actual, expected)) {
      if (expected !== 0 && close(actual, -expected))
        return {
          means: "Check the sign.",
          do: "Read the direction or position in the question again. Is the value above or below zero?",
        };
      if (expected !== 0 && (close(actual, expected * 10) || close(actual, expected / 10)))
        return {
          means: "Check the size of the value.",
          do: "Estimate first. Your result differs from the target by a factor of ten; revisit place value and units.",
        };
    }
    return null;
  }
  function hintsFor(p) {
    if (Array.isArray(p.hints) && p.hints.length === 2) return p.hints;
    const q = p.prompt.toLowerCase();
    // Specific tasks precede broader topic words. Word boundaries keep, for
    // example, "means", "operation", and "tickets" out of mean/ratio/tick rules.
    const rules = [
      [
        /\bindependent\b/,
        "Identify the input that is chosen or measured first.",
        "Ask which quantity changes in response to that input. Name the chosen input, not the resulting output.",
      ],
      [
        /\bsymmetric\b|\bskewed\b/,
        "Compare the frequencies at equal distances from the center.",
        "A symmetric distribution has matching left and right sides. A longer tail on one side suggests skew. Check the whole pattern.",
      ],
      [
        /find mean, median, range, iqr, and mad/,
        "Make an ordered copy and keep the original values for your calculations.",
        "Mean: total ÷ count. Median: middle value(s). Range: maximum − minimum. IQR: Q3 − Q1. MAD: mean of the distances from the mean.",
      ],
      [
        /which changes more: mean or median/,
        "Calculate both measures before and after the replacement.",
        "The mean uses every value in its total. The median uses the middle position(s) after ordering. Compare how much each result changes.",
      ],
      [
        /least to greatest|^order /,
        "Compare values and arrange them from least to greatest.",
        "Keep repeated values. For decimals, align place values; for negative numbers, farther left on a number line means less. Check each neighboring pair.",
      ],
      [
        /equal lower and upper halves/,
        "Count the entries in the ordered list before splitting it.",
        "For this even-sized list, place half the entries in each half. Keep every entry exactly once; do not average or remove the two middle entries.",
      ],
      [
        /\bq1\b|\bq3\b|\bquartiles?\b/,
        "Use the ordered data and the stated rule for forming the two halves.",
        "Q1 is the median of the lower half and Q3 is the median of the upper half. Average the two middle values when a half has an even count.",
      ],
      [
        /\bmedian\b/,
        "Put the values in order, keeping every repeated value.",
        "Cross off one entry from each end. If one middle entry remains, use it; if two remain, average those two values.",
      ],
      [
        /minimum and maximum/,
        "Find the least value and the greatest value in the list.",
        "Label them separately: minimum is least; maximum is greatest. Check every entry before deciding.",
      ],
      [
        /\brange\b/,
        "Identify the smallest and largest values in each set.",
        "Subtract minimum from maximum. To compare ranges, compute both differences and compare their sizes.",
      ],
      [
        /\boutlier\b/,
        "Look for a cluster of values and a value far from that cluster.",
        "Compare the gaps between values. Explain why the unusual value is much farther away than the others; do not identify it by size alone.",
      ],
      [
        /total frequency/,
        "Frequency tells you how many entries are in a group.",
        "Add every group frequency once. The sum is the total number of entries.",
      ],
      [
        /interval contains|sort .* into intervals|\bhistogram\b/,
        "Read the interval endpoints before placing any values.",
        "For these whole-number bins, include both stated endpoints. Place each entry in exactly one bin, count repeats, and check that the frequencies add to the data count.",
      ],
      [
        /halfway/,
        "Find the distance between the two endpoints.",
        "Move half that distance from the lower endpoint. You can also add the endpoints and divide by 2; check that both distances are equal.",
      ],
      [
        /equal jumps|equal parts|tick intervals|labeled steps|third tick/,
        "Distinguish the size of one interval from the number of intervals.",
        "For equal partitions, divide the total span by the interval count. For a labeled scale, find one interval’s size, then multiply by the number of steps; left of zero is negative.",
      ],
      [
        /how many values|how many factors .* appear/,
        "Count entries, not their total value or the signs between them.",
        "Mark each listed value or repeated factor once. Repeated entries still count separately.",
      ],
      [
        /\bmean\b|\baverage\b/,
        "A mean redistributes the total equally among all entries.",
        "Add all values, including repeats, and divide by the entry count. Check that the mean lies between the minimum and maximum.",
      ],
      [
        /add the distances|total distance is traveled/,
        "Each part contributes a nonnegative length to the trip or total.",
        "Add the stated lengths. Do not subtract just because the travel changes direction: total distance counts every part traveled.",
      ],
      [
        /\bopposite\b(?! face)/,
        "Opposite numbers are equally far from zero on different sides.",
        "Keep the distance from zero and reverse the sign. Zero is its own opposite.",
      ],
      [
        /\babsolute\b|\bdistance\b(?! with its unit)/,
        "Distance counts the length between positions and cannot be negative.",
        "Subtract the two positions and take the absolute value. On a coordinate plane, use the changing coordinate when the other coordinate stays the same.",
      ],
      [
        /steps? (?:right|left)|move backward|below zero/,
        "Start at the stated position on a number line.",
        "Each rightward unit step adds 1; each leftward or backward unit step subtracts 1. Values below zero carry a negative sign.",
      ],
      [
        /consecutive integers/,
        "Locate the decimal on a number line between neighboring whole-number positions.",
        "Find an integer immediately below it and one immediately above it. For negative decimals, farther left means a smaller value.",
      ],
      [
        /which is greater: .*% of/,
        "Each percentage applies to its own whole.",
        "Find each part using whole × (percent ÷ 100), then compare the resulting amounts. A larger percent alone does not guarantee a larger amount.",
      ],
      [
        /which is greater|fill the blank with <|farther right/,
        "Compare the values in a common form or place them on a number line.",
        "Align decimal places, convert fractions if useful, and remember that farther right means greater. Use the comparison symbol in the direction the question requests.",
      ],
      [
        /\boperation\b.*undoes/,
        "Identify the operation being applied to the unknown quantity.",
        "Addition and subtraction undo each other. Multiplication and division by the same nonzero number undo each other. Keep the number unchanged.",
      ],
      [
        /\bgreater than or equal\b|\bsymbol\b|\binequality\b|\bcircle\b|\bsatisfy\b|graph of x [<>≤≥]/,
        "Decide whether the boundary value is included in the solution set.",
        "Use ≤ or ≥ for an included boundary (closed circle), and < or > for an excluded boundary (open circle). Greater values lie right; lesser values lie left. Test a value.",
      ],
      [
        /\bquadrant\b|\bcoordinate\b|\bcoordinates\b|\bordered pair\b|\borigin\b|\bplot\b/,
        "An ordered pair is (x, y): horizontal position first, vertical second.",
        "Read the scale. From the origin, positive x moves right and negative x left; positive y moves up and negative y down. Check both signs.",
      ],
      [
        /as an improper fraction/,
        "Each whole contains one denominator’s worth of equal parts.",
        "Multiply the whole number by the denominator, add the numerator, and keep the denominator. Check by converting back to a mixed number.",
      ],
      [
        /\breciprocal\b/,
        "A nonzero number and its reciprocal multiply to 1.",
        "Write a whole number over 1 if needed, then exchange numerator and denominator. Multiply the two fractions to check.",
      ],
      [
        /simplify \d+\//,
        "Divide numerator and denominator by the same nonzero common factor.",
        "Use the greatest common factor or repeat with smaller common factors until only 1 remains common. Keep the value unchanged.",
      ],
      [
        /as a decimal/,
        q.includes("%") ? "Percent means per hundred." : "A fraction bar means division.",
        q.includes("%")
          ? "Divide the percent number by 100 and write a decimal. Check its size against 0%, 50%, and 100%."
          : "Divide numerator by denominator, or form an equivalent fraction with denominator 10, 100, or 1,000. Write the result as a decimal.",
      ],
      [
        /as a percent/,
        "A percent tells how many parts there are per hundred.",
        "Write the fraction as a decimal, then multiply that value by 100 and attach %. Use a benchmark such as one half = 50% to check.",
      ],
      [
        /as a fraction|shaded fraction/,
        "Identify the number of selected equal parts and the total number of equal parts.",
        "Write selected parts over total parts. Hundredths use denominator 100. Check that the fraction describes the whole named in the prompt.",
      ],
      [
        /10-by-10/,
        "Use the number of squares in each row and the number of shaded rows.",
        "Multiply squares per row by complete shaded rows. Check against the 100 squares in the entire grid.",
      ],
      [
        /\bpart and the whole\b/,
        "The whole includes everyone or everything in the group being compared.",
        "The part is the selected subgroup. Label both numbers and check that the part is contained within the whole.",
      ],
      [
        /%|\bpercent\b/,
        "Identify the part, the whole, and the percent rate.",
        "Use part = whole × (percent ÷ 100). For 10%, divide by 10; for 1%, divide by 100; for 25%, divide by 4. If estimating, use the compatible whole stated in the question.",
      ],
      [
        /\bround\b/,
        "Locate the place the question asks you to round to.",
        "Look one place to the right: 5 or more increases the rounding digit; 4 or less leaves it unchanged. Keep all places through the rounding place.",
      ],
      [
        /fill in the numerator|scale.*(?:pair|ratio)|\bratio\b/,
        "Keep the order of the two quantities and find the scale factor.",
        "Multiply both ratio terms, or both fraction parts, by the same factor. Check the requested starting or ending value as well as equivalence.",
      ],
      [
        /write an expression.*(?:cost|notebooks)/,
        "Choose a variable for the item count and identify the cost of one item.",
        "Multiply the unit price by the variable. An expression represents the cost for any allowed count; it does not require choosing one count.",
      ],
      [
        /\bunit rate\b|\bper pen\b|\bnotebooks?\b.*\bcost\b|\bcost\b.*\bnotebook\b|\bbags?\b|\btickets\b|\bper hour\b/,
        "Identify what one item or one unit of time represents.",
        "Divide to find a one-unit rate when needed; multiply that rate by the quantity for a total. Track the units and check which quantity the question requests.",
      ],
      [
        /\bconvert\b|\binches\b|\bkilometers\b|\bkilometres\b|\bfeet\b/,
        "Write the given conversion fact as an equality.",
        "Decide whether you are counting smaller or larger units. Multiply or divide by the conversion factor, and check that the size and requested unit agree.",
      ],
      [
        /\bperimeter\b/,
        "Perimeter is the total distance around the boundary.",
        "Add every side length once. For a rectangle, opposite sides match, so double the sum of length and width.",
      ],
      [
        /height part|which number is the height|which height finds/,
        "Find the height perpendicular to the chosen base.",
        "For a triangular face, use the altitude within that face. A pyramid’s vertical height measures a different distance.",
      ],
      [
        /total side length/,
        "The whole length is made from its two parts.",
        "Subtract the known part from the total. Add both parts again to check that they recover the total.",
      ],
      [
        /\bvolume\b|\bprism measures\b/,
        "A rectangular prism is built from equal layers.",
        "Multiply base area by height, or multiply the three perpendicular dimensions. Volume measures cubic units.",
      ],
      [
        /face pairs/,
        "Opposite faces of a rectangular prism are congruent.",
        "Match each rectangular face to its opposite. Each listed dimension pair describes two faces; count the requested pair only.",
      ],
      [
        /how many faces|faces, edges, and vertices/,
        "Picture the solid and distinguish faces, edges, and vertices.",
        "Faces are flat surfaces, edges join faces, and vertices are corners. Count each once, including hidden parts and the base.",
      ],
      [
        /face pairs|matching opposite face|different face areas|add the face areas/,
        "Pair each face with its congruent opposite face in a rectangular prism.",
        "Use the three dimension pairs to find face areas. Each area occurs twice; include just one of each if the question requests the three different areas.",
      ],
      [
        /\barea\b|\btriangle\b|\btiles\b/,
        "Choose the appropriate area formula and the perpendicular dimensions.",
        "Rectangles and parallelograms use base × height; triangles use half that product. Add nonoverlapping parts, subtract a removed section, or multiply equal areas by their count.",
      ],
      [
        /first .*positive multiples|least common multiple/,
        "Multiples come from multiplying by successive positive whole numbers.",
        "List the positive multiples in order. For a least common multiple, stop at the first value shared by both lists.",
      ],
      [
        /factor .*using the greatest common factor/,
        "Find the greatest common factor of the numerical coefficients.",
        "Write that factor outside parentheses and divide each original term by it inside. Expand your result to check every term.",
      ],
      [
        /\bfactor\b|\bfactors\b|divide .*evenly/,
        "A positive factor divides a number with no remainder.",
        "List factor pairs systematically. For a greatest common factor, compare the lists and choose the largest shared value.",
      ],
      [
        /write an expression|write an equation/,
        "Translate the quantities and their relationship before calculating.",
        "Use a variable for the unknown. Products multiply; more than adds; less than subtracts from the starting quantity. An equation also needs an equals sign joining equal quantities.",
      ],
      [
        /does .*make|check x =|fit every pair|compare .* at x|for y =|using y =|the rule is y|for c =|evaluate.*when/,
        "Substitute the stated input for the variable in the rule.",
        "Calculate in order of operations. Check each requested input or both sides of the equation; one matching input alone does not prove that two rules always agree.",
      ],
      [
        /using distribution/,
        "The outside factor multiplies every term inside the parentheses.",
        "Write the two products and then combine them. Check by evaluating the parentheses first as a second method.",
      ],
      [
        /simplify .*\b[0-9]*[a-z]\b/,
        "Identify terms with exactly the same variable part.",
        "Add or subtract their coefficients. Keep constants separate from variable terms; check with a chosen value of the variable.",
      ],
      [
        /\bequation\b|\bsolve\b|\bmissing\b/,
        "Keep the two sides of an equation equal.",
        "Use an inverse operation on both sides. Substitute your result into the original equation to check that both sides agree.",
      ],
      [
        /same step continues|continue the pattern/,
        "Find what changes from one entry to the next.",
        "Apply the same change to the next entry. For pairs, track the change in each position separately and check it against all shown steps.",
      ],
      [
        /as a division expression/,
        "A fraction bar represents division.",
        "Write numerator ÷ denominator, then calculate the quotient. Check it by multiplying the quotient by the denominator.",
      ],
      [
        /²|³/,
        "An exponent tells how many equal factors to multiply.",
        "Write the repeated factors and find their product. In a larger expression, handle grouping first, then exponents, multiplication/division, and addition/subtraction.",
      ],
      [
        /\bevaluate\b|\bexpression\b|\d\s*\(|compute \(\d/,
        "Identify all the operations before calculating.",
        "Evaluate grouping symbols, then exponents, then multiplication/division left to right, then addition/subtraction left to right. A fraction bar groups its numerator and denominator.",
      ],
      [
        /\bhalf of\b/,
        "One half means one of two equal shares.",
        "Divide the whole by 2. Double your answer to check the original quantity.",
      ],
      [
        /\d+\/\d+ of/,
        "The denominator tells how many equal shares make the whole.",
        "Divide the whole by the denominator, then multiply one share by the numerator. Estimate to check whether the part should be smaller or larger than the whole.",
      ],
      [
        /÷/,
        "Think of division as finding a missing factor.",
        "Use quotient × divisor = dividend to check. With fraction division, multiply by the reciprocal of the divisor only.",
      ],
      [
        /(?:\d+\/\d+).*×|×.*(?:\d+\/\d+)/,
        "Write each factor as a fraction; convert any mixed number first.",
        "Multiply numerators and multiply denominators, then simplify. A whole number can be written over 1. Estimate to check the size of the product.",
      ],
      [
        /×|\bproduct\b|\bmultiply\b/,
        "Break one factor into friendly parts.",
        "Multiply each part, combine the partial products, and estimate to check the size of the result.",
      ],
      [
        /−\s*\(-/,
        "Subtracting a negative reverses the direction of subtraction.",
        "Rewrite subtracting a negative as adding its positive opposite. Use a number line or the inverse addition check to confirm the result.",
      ],
      [
        /−|\bsubtract\b/,
        "Think about the difference between the quantities.",
        "Line up place values. If you regroup, rename the same amount. Check by adding the difference back.",
      ],
      [
        /\badd\b|\+|\bsum\b|in all|yes responses/,
        "Keep track of every quantity you need to combine.",
        "Group friendly numbers and align place values. Check that no value has been skipped or counted twice.",
      ],
      [
        /compute y\/x/,
        "The expression y/x means y divided by x.",
        "Substitute both given values in the correct order. Divide, then multiply the quotient by x to check that you recover y.",
      ],
    ];
    const rule = rules.find(([rx]) => rx.test(q));
    return rule
      ? rule.slice(1)
      : [
          p.skillText
            ? `Use this skill: ${p.skillText}.`
            : "Identify the quantities and the exact question being asked.",
          "Represent the relationship with a sketch, table, or equation. Use the given quantities, then check whether your result answers the question.",
        ];
  }

  // Six self-contained investigations. This file is concatenated inside FluencyStudio.
  const flBank = [
    {
      id: "statistics",
      name: "Data & variability",
      eyebrow: "STATISTICS",
      title: "What does a typical value hide?",
      intro:
        "A mean balances a total. A median locates the middle. MAD measures the average distance from the mean.",
      challenges: [
        {
          model: { values: [2, 4, 4, 6] },
          prompt: "The data are 2, 4, 4, 6. What is the mean?",
          answer: 4,
          display: "4",
          hint: "Imagine moving two units from 6 to 2. What equal share would every value have?",
          why: "The sum is 16 and there are 4 values: 16 ÷ 4 = 4. Every repeat is a separate observation.",
        },
        {
          model: { values: [1, 2, 2, 5, 10] },
          prompt: "The data are 1, 2, 2, 5, 10. What is the median?",
          answer: 2,
          display: "2",
          hint: "The values are already ordered. Keep both 2s and find the third value.",
          why: "With 5 observations, the median is the third value: 2. The large value 10 affects the mean much more than the median.",
        },
        {
          model: { values: [2, 2, 6, 6] },
          prompt: "The data are 2, 2, 6, 6. What is the mean absolute deviation (MAD)?",
          answer: 2,
          display: "2",
          hint: "First find the mean. Find each value’s distance from that mean, then average those four distances.",
          why: "The mean is 4. The distances from 4 are 2, 2, 2, 2, so MAD = (2 + 2 + 2 + 2) ÷ 4 = 2.",
        },
      ],
    },
    {
      id: "ratios",
      name: "Equivalent ratios",
      eyebrow: "RATIOS & RATES",
      title: "Keep both quantities in step.",
      intro:
        "A table and a double number line show the same relationship. Corresponding quantities must use the same scale factor.",
      challenges: [
        {
          model: { a: 2, b: 3, k: 1 },
          prompt:
            "A paint mix uses 2 cups of yellow for every 3 cups of blue. How many cups of blue go with 8 cups of yellow?",
          answer: 12,
          display: "12 cups of blue",
          hint: "Compare 8 with 2. Multiply the blue quantity by that same factor.",
          why: "8 ÷ 2 = 4. Scale both parts by 4: 2 : 3 becomes 8 : 12. Adding 6 to both parts would change the mixture.",
        },
        {
          model: { a: 3, b: 5, k: 1 },
          prompt:
            "A paint mix uses 3 cups of yellow for every 5 cups of blue. How many cups of blue go with 12 cups of yellow?",
          answer: 20,
          display: "20 cups of blue",
          hint: "The yellow quantity is four times the starting amount. Keep the same multiplier for blue.",
          why: "12 ÷ 3 = 4, so the blue amount is 5 × 4 = 20 cups. The rate is 5/3 cup of blue per cup of yellow.",
        },
        {
          model: { a: 4, b: 10, k: 1 },
          prompt:
            "A paint mix uses 4 cups of yellow for every 10 cups of blue. How many cups of blue go with 6 cups of yellow?",
          answer: 15,
          display: "15 cups of blue",
          hint: "The scale factor need not be a whole number. Find 6 ÷ 4, or find the blue amount for 1 cup of yellow.",
          why: "6 ÷ 4 = 1.5. Scale both quantities by 1.5: 4 × 1.5 = 6 and 10 × 1.5 = 15. Equivalently, 2.5 cups of blue per cup of yellow × 6 = 15.",
        },
      ],
    },
    {
      id: "fractions",
      name: "Fractions beyond one",
      eyebrow: "FRACTION SENSE",
      title: "Keep the whole the same size.",
      intro:
        "Each outlined bar is one whole. The denominator names equal parts of that whole; the numerator counts shaded parts across all bars.",
      challenges: [
        {
          model: { n: 7, d: 4 },
          prompt:
            "The model shows 7/4. How much more is needed to reach 2 wholes? Give an exact value.",
          answer: 1 / 4,
          display: "1/4",
          hint: "Two wholes contain eight fourths. Compare that with seven fourths.",
          why: "2 = 8/4, and 8/4 − 7/4 = 1/4. A denominator counts equal parts in one whole, even when several wholes are shown.",
        },
        {
          model: { n: 10, d: 3 },
          prompt:
            "The model shows 10/3. How much more is needed to reach 4 wholes? Give an exact fraction.",
          answer: 2 / 3,
          display: "2/3",
          fraction: [2, 3],
          hint: "Rename 4 wholes as thirds before subtracting.",
          why: "4 = 12/3. The gap is 12/3 − 10/3 = 2/3. A rounded decimal is only an approximation, so keep the exact fraction.",
        },
        {
          model: { n: 5, d: 6 },
          prompt:
            "Start with 5/6. Double the shaded amount. What is the resulting value? Give an exact fraction.",
          answer: 5 / 3,
          display: "10/6 or 5/3",
          fraction: [5, 3],
          hint: "Doubling counts twice as many sixths. Keep each part the same size.",
          why: "2 × 5/6 = 10/6 = 5/3. There is 1 whole and 4 sixths, equivalent to 1 whole and 2 thirds. Doubling both numerator and denominator would preserve the original value instead.",
        },
      ],
    },
    {
      id: "geometry",
      name: "Base & height",
      eyebrow: "AREA",
      title: "Height meets the base at a right angle.",
      intro:
        "Compare a triangle and a rectangle with the same base and perpendicular height. A sloping side is usually not the height.",
      challenges: [
        {
          model: { shape: "triangle", base: 6, height: 4, offset: 2 },
          prompt:
            "A triangle has base 6 cm and perpendicular height 4 cm. What is its area in square centimeters?",
          answer: 12,
          display: "12 cm²",
          hint: "First find the area of the rectangle with this base and height. A triangle uses half that product.",
          why: "Area = ½ × 6 × 4 = 12 cm². The height is the perpendicular distance to the line containing the base.",
        },
        {
          model: { shape: "rectangle", base: 8, height: 3, offset: 2 },
          prompt:
            "A rectangle has base 8 cm and perpendicular height 3 cm. What is its area in square centimeters?",
          answer: 24,
          display: "24 cm²",
          hint: "A rectangle has one row of base-length units for each unit of height.",
          why: "Area = 8 × 3 = 24 cm². Do not halve this product: the shape is a rectangle.",
        },
        {
          model: { shape: "triangle", base: 10, height: 6, offset: 13 },
          prompt:
            "The triangle’s apex is beyond the end of its 10 cm base. Its perpendicular height is 6 cm. What is its area in square centimeters?",
          answer: 30,
          display: "30 cm²",
          hint: "The height may land on an extension of the base. Does shifting the apex change the base or perpendicular height?",
          why: "Area = ½ × 10 × 6 = 30 cm². A height outside the triangle still measures perpendicular distance to the line containing the base. Moving the apex horizontally keeps that area unchanged.",
        },
      ],
    },
    {
      id: "coordinates",
      name: "Points & reflections",
      eyebrow: "COORDINATE PLANE",
      title: "Which coordinate changes?",
      intro:
        "Plot a point in any quadrant, then reflect it. A reflection preserves distance to the reflecting axis.",
      challenges: [
        {
          model: { x: -3, y: 2, reflection: "x" },
          prompt: "Reflect P = (−3, 2) across the x-axis. What are the coordinates of the image?",
          answer: [-3, -2],
          display: "(−3, −2)",
          hint: "Across the x-axis, the horizontal position stays fixed. The point moves the same distance below the axis.",
          why: "Reflection across the x-axis keeps x and changes the sign of y: (−3, 2) → (−3, −2). Both points are 2 units from the x-axis.",
        },
        {
          model: { x: 4, y: -1, reflection: "y" },
          prompt: "Reflect P = (4, −1) across the y-axis. What are the coordinates of the image?",
          answer: [-4, -1],
          display: "(−4, −1)",
          hint: "Across the y-axis, the vertical position stays fixed. Change the horizontal direction.",
          why: "Reflection across the y-axis changes the sign of x and keeps y: (4, −1) → (−4, −1). Both points are 4 units from the y-axis.",
        },
        {
          model: { x: -2, y: -4, reflection: "both" },
          prompt:
            "Reflect P = (−2, −4) across the x-axis, then across the y-axis. What are the final coordinates?",
          answer: [2, 4],
          display: "(2, 4)",
          hint: "Do the two reflections in order. Each reflection changes exactly one coordinate’s sign.",
          why: "First, (−2, −4) → (−2, 4). Then, (−2, 4) → (2, 4). Reflecting across both coordinate axes changes both signs.",
        },
      ],
    },
    {
      id: "equations",
      name: "Balance & inverse",
      eyebrow: "EQUATIONS",
      title: "Make a change on both sides.",
      intro:
        "An equation states that two quantities are equal. Applying the same operation to both sides keeps the equality true.",
      challenges: [
        {
          model: { type: "add", a: 7, b: 19 },
          prompt: "Solve x + 7 = 19. What value of x makes the equation true?",
          answer: 12,
          display: "x = 12",
          hint: "What operation undoes adding 7? Apply that operation to both sides.",
          why: "Subtract 7 from both sides: x + 7 − 7 = 19 − 7, so x = 12. Check: 12 + 7 = 19.",
        },
        {
          model: { type: "multiply", a: 4, b: 18 },
          prompt: "Solve 4x = 18. What value of x makes the equation true?",
          answer: 4.5,
          display: "x = 9/2 = 4.5",
          hint: "Four equal groups of x total 18. Divide both sides by 4.",
          why: "4x ÷ 4 = 18 ÷ 4, so x = 18/4 = 9/2 = 4.5. Check: 4 × 4.5 = 18. A solution does not have to be a whole number.",
        },
        {
          model: { type: "add", a: 2.5, b: 7.5 },
          prompt: "Solve x + 2.5 = 7.5. What value of x makes the equation true?",
          answer: 5,
          display: "x = 5",
          hint: "Subtract the same decimal from both sides. Keep decimal place values aligned.",
          why: "Subtract 2.5 from both sides: x = 7.5 − 2.5 = 5. Check: 5 + 2.5 = 7.5.",
        },
      ],
    },
  ];
  const flStorageKey = "fluency.v4.labs";
  const flCopy = (value) => JSON.parse(JSON.stringify(value));
  // Quantity labels belong in the form labels/reasoning, never in parsed values.
  // Keep arithmetic signs and fractional notation; never strip an incorrect unit.
  const flValuesOnly = (raw) => !/[a-z$]/i.test(String(raw));
  const flValue = (raw) => (flValuesOnly(raw) ? parseMath(raw) : NaN);
  const flAttempt = () => ({
    answer: "",
    reason: "",
    hint: false,
    reveal: false,
    supported: false,
    checked: false,
    feedback: "",
  });
  const flState = {
    active: "statistics",
    items: Object.fromEntries(
      flBank.map((lab) => [
        lab.id,
        {
          index: 0,
          model: flCopy(lab.challenges[0].model),
          measured: false,
          attempts: lab.challenges.map(flAttempt),
        },
      ]),
    ),
  };
  let flStorageNotice = "";
  function flValidate(id, m) {
    const between = (v, min, max) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
    const integer = (v, min, max) => between(v, min, max) && Number.isInteger(v);
    if (!m || typeof m !== "object") return "Enter values for this model.";
    if (
      id === "statistics" &&
      (!Array.isArray(m.values) ||
        m.values.length < 3 ||
        m.values.length > 12 ||
        !m.values.every((v) => integer(v, 0, 12)))
    )
      return "Use 3–12 whole-number observations from 0 to 12, separated by commas. Repeated values are welcome.";
    if (
      id === "ratios" &&
      (!between(m.a, 0.25, 12) || !between(m.b, 0.25, 12) || !between(m.k, 0.25, 6))
    )
      return "Both starting amounts must be 0.25–12 cups. The scale factor must be 0.25–6. Fractions and decimals are accepted.";
    if (id === "fractions" && (!integer(m.d, 1, 12) || !integer(m.n, 0, 4 * m.d)))
      return "Use a whole-number denominator from 1 to 12 and a whole-number numerator from 0 to four times the denominator. The model holds at most 4 wholes.";
    if (
      id === "geometry" &&
      (!["triangle", "rectangle"].includes(m.shape) ||
        !between(m.base, 1, 12) ||
        !between(m.height, 1, 10) ||
        !between(m.offset, -5, 17))
    )
      return "Choose a shape. Base must be 1–12 cm, height 1–10 cm, and apex horizontal position −5–17 cm.";
    if (
      id === "coordinates" &&
      (!integer(m.x, -5, 5) || !integer(m.y, -5, 5) || !["x", "y", "both"].includes(m.reflection))
    )
      return "Use whole-number coordinates from −5 to 5 and choose a reflection.";
    if (
      id === "equations" &&
      (!["add", "multiply"].includes(m.type) ||
        !between(m.a, m.type === "multiply" ? 0.25 : 0, 20) ||
        !between(m.b, 0, 40))
    )
      return "Choose an equation type. The added amount must be 0–20 (or multiplier 0.25–20), and the right side 0–40.";
    return "";
  }
  try {
    const raw = sessionStorage.getItem(flStorageKey);
    if (raw && raw.length < 90000) {
      const saved = JSON.parse(raw);
      if (flBank.some((l) => l.id === saved.active)) flState.active = saved.active;
      flBank.forEach((lab) => {
        const old = saved.items && saved.items[lab.id],
          current = flState.items[lab.id];
        if (
          !old ||
          !Number.isInteger(old.index) ||
          old.index < 0 ||
          old.index >= lab.challenges.length
        )
          return;
        current.index = old.index;
        current.model = flCopy(lab.challenges[old.index].model);
        if (!flValidate(lab.id, old.model)) current.model = old.model;
        current.measured = old.measured === true;
        if (Array.isArray(old.attempts))
          current.attempts = current.attempts.map((a, i) => {
            const source = old.attempts[i];
            if (!source || typeof source !== "object") return a;
            ["answer", "reason", "feedback"].forEach((k) => {
              if (typeof source[k] === "string")
                a[k] = source[k].slice(0, k === "reason" ? 4000 : 500);
            });
            ["hint", "reveal", "supported", "checked"].forEach((k) => (a[k] = source[k] === true));
            if (a.hint || a.reveal) a.supported = true;
            return a;
          });
      });
    }
  } catch (_) {
    flStorageNotice =
      "This tab cannot restore saved investigation work. You can still use every activity.";
  }
  function flSave() {
    try {
      sessionStorage.setItem(flStorageKey, JSON.stringify(flState));
    } catch (_) {
      flStorageNotice =
        "This tab cannot save investigation work. Keep a separate copy of any reasoning you need.";
    }
    const note = document.querySelector("#fli-storage-note");
    if (note) note.textContent = flStorageNotice;
  }
  const flCurrent = () => {
    const lab = flBank.find((l) => l.id === flState.active),
      state = flState.items[lab.id];
    return {
      lab,
      state,
      challenge: lab.challenges[state.index],
      attempt: state.attempts[state.index],
    };
  };
  const flGcd = (a, b) => (b ? flGcd(b, a % b) : Math.abs(a));
  function flNumber(n, places = 4) {
    if (Number.isInteger(n)) return String(n);
    const rounded = Number(n.toFixed(places));
    return (Math.abs(rounded - n) < 1e-10 ? "" : "≈ ") + String(rounded);
  }
  function flFraction(n, d) {
    const factor = flGcd(n, d),
      a = n / factor,
      b = d / factor;
    return b === 1 ? String(a) : a + "/" + b;
  }
  function flExactFraction(raw, target) {
    const parts = raw.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    if (!parts || BigInt(parts[2]) === 0n) return false;
    return BigInt(parts[1]) * BigInt(target[1]) === BigInt(target[0]) * BigInt(parts[2]);
  }
  const flField = (id, label, value, note = "") =>
    `<label class="fli-field" for="fli-${id}"><span>${label}</span><input id="fli-${id}" name="${id}" value="${e(value)}" inputmode="decimal" autocomplete="off" maxlength="120"${note ? ` aria-describedby="fli-${id}-note"` : ""}>${note ? `<small id="fli-${id}-note">${note}</small>` : ""}</label>`;
  const flSelect = (id, label, value, options) =>
    `<label class="fli-field" for="fli-${id}"><span>${label}</span><select id="fli-${id}" name="${id}">${options.map(([key, text]) => `<option value="${key}"${key === value ? " selected" : ""}>${text}</option>`).join("")}</select></label>`;
  const flSvg = (content, label, description, box = "0 0 600 270", extras = "") =>
    `<svg class="fli-svg" viewBox="${box}" role="img" aria-labelledby="fli-svg-title fli-svg-desc" ${extras}><title id="fli-svg-title">${e(label)}</title><desc id="fli-svg-desc">${e(description)}</desc>${content}</svg>`;
  function flStatsModel(m, measured) {
    const values = [...m.values].sort((a, b) => a - b),
      count = values.length,
      sum = values.reduce((a, b) => a + b, 0),
      mean = sum / count;
    const median =
      count % 2 ? values[(count - 1) / 2] : (values[count / 2 - 1] + values[count / 2]) / 2;
    const distances = values.map((v) => Math.abs(v - mean)),
      mad = distances.reduce((a, b) => a + b, 0) / count;
    const counts = Array.from({ length: 13 }, (_, i) => values.filter((v) => v === i).length),
      max = Math.max(...counts),
      spacing = Math.min(25, 145 / max);
    let marks = '<line class="fli-axis" x1="42" y1="205" x2="558" y2="205"/>';
    counts.forEach((n, i) => {
      const x = 48 + i * 42;
      marks += `<line class="fli-tick" x1="${x}" y1="205" x2="${x}" y2="211"/><text class="fli-svg-text" x="${x}" y="231" text-anchor="middle">${i}</text>`;
      for (let j = 0; j < n; j++)
        marks += `<circle class="fli-dot" cx="${x}" cy="${190 - j * spacing}" r="${Math.min(8, spacing / 2 - 1)}"/>`;
    });
    if (measured)
      marks += `<line class="fli-reference" x1="${48 + mean * 42}" y1="30" x2="${48 + mean * 42}" y2="205"/><text class="fli-svg-text" x="${48 + mean * 42}" y="22" text-anchor="middle">mean ${flNumber(mean)}</text>`;
    marks +=
      '<text class="fli-svg-text" x="300" y="260" text-anchor="middle">Value · each dot represents one observation</text>';
    return {
      controls: flField(
        "values",
        "Observations",
        m.values.join(", "),
        "3–12 whole numbers; each from 0 to 12.",
      ),
      visual: flSvg(
        marks,
        "Dot plot",
        `Data in order: ${values.join(", ")}. ${counts
          .map((n, i) => (n ? `${n} observation${n === 1 ? "" : "s"} at ${i}` : ""))
          .filter(Boolean)
          .join("; ")}.`,
      ),
      text: `${count} observations · ordered data: ${values.join(", ")}.`,
      measures: `<div class="fli-metrics"><div><span>Mean</span><strong>${flNumber(mean)}</strong></div><div><span>Median</span><strong>${flNumber(median)}</strong></div><div><span>MAD</span><strong>${flNumber(mad)}</strong></div></div><p>Total ${sum} ÷ count ${count} gives the mean. Distances from the mean: ${distances.map((v) => flNumber(v)).join(", ")}. Average those distances to find MAD.</p>`,
      extension:
        "Change one value to 12. Predict which changes more: the mean or the median. Explain using the positions of the dots.",
    };
  }
  function flRatioModel(m) {
    const selected = [m.a * m.k, m.b * m.k],
      maxK = Math.max(4, m.k),
      left = 125,
      width = 420;
    let marks = "";
    [0, 1].forEach((row) => {
      const y = 76 + row * 94;
      marks += `<text class="fli-svg-text" x="20" y="${y + 5}">${row ? "Blue" : "Yellow"} (cups)</text><line class="fli-axis" x1="${left}" y1="${y}" x2="${left + width}" y2="${y}"/>`;
      for (let k = 0; k <= 4; k++) {
        const x = left + (width * k) / maxK;
        marks += `<line class="fli-tick" x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}"/><text class="fli-svg-text" x="${x}" y="${y + 28}" text-anchor="middle">${flNumber((row ? m.b : m.a) * k)}</text>`;
      }
    });
    const sx = left + (width * m.k) / maxK;
    marks += `<line class="fli-reference" x1="${sx}" y1="56" x2="${sx}" y2="185"/><circle class="fli-dot" cx="${sx}" cy="76" r="7"/><circle class="fli-dot" cx="${sx}" cy="170" r="7"/><text class="fli-svg-text" x="300" y="236" text-anchor="middle">Same horizontal position = corresponding quantities</text>`;
    return {
      controls:
        flField("a", "Yellow: starting cups", m.a, "0.25–12 cups") +
        flField("b", "Blue: starting cups", m.b, "0.25–12 cups") +
        flField("k", "Scale factor", m.k, "0.25–6; applied to both amounts"),
      visual: flSvg(
        marks,
        "Proportional double number line",
        `The two lines use different unit scales. At multipliers 0, 1, 2, 3, 4, yellow amounts are ${[0, 1, 2, 3, 4].map((k) => flNumber(k * m.a)).join(", ")} and blue amounts are ${[0, 1, 2, 3, 4].map((k) => flNumber(k * m.b)).join(", ")}. The marked multiplier is ${m.k}.`,
      ),
      text: `Starting mixture: ${flNumber(m.a)} cups yellow for ${flNumber(m.b)} cups blue. Both lines share scale factor ${flNumber(m.k)}.`,
      measures: `<div class="fli-table-wrap"><table class="fli-table"><caption>Corresponding paint amounts</caption><thead><tr><th scope="col">Multiplier</th><th scope="col">Yellow cups</th><th scope="col">Blue cups</th></tr></thead><tbody>${[0, 1, 2, 3, 4].map((k) => `<tr><th scope="row">× ${k}</th><td>${flNumber(m.a * k)}</td><td>${flNumber(m.b * k)}</td></tr>`).join("")}<tr class="fli-selected-row"><th scope="row">Selected: × ${flNumber(m.k)}</th><td>${flNumber(selected[0])}</td><td>${flNumber(selected[1])}</td></tr></tbody></table></div><p>For 1 cup of yellow: ${flNumber(m.b / m.a)} cups of blue. Each pair preserves blue ÷ yellow ${flNumber(m.b / m.a).startsWith("≈") ? "" : "= "}${flNumber(m.b / m.a)}.</p>`,
      extension:
        "Try a scale factor between 0 and 1. Why can both amounts shrink while the mixture stays the same?",
    };
  }
  function flFractionModel(m) {
    const width = 440,
      start = 100;
    let marks =
      '<defs><pattern id="fli-shading" patternUnits="userSpaceOnUse" width="7" height="7"><path d="M0 7L7 0" class="fli-hatch"/></pattern></defs>';
    for (let whole = 0; whole < 4; whole++) {
      const y = 25 + whole * 55,
        shaded = Math.max(0, Math.min(m.d, m.n - whole * m.d));
      marks += `<text class="fli-svg-text" x="16" y="${y + 23}">Whole ${whole + 1}</text>`;
      for (let part = 0; part < m.d; part++) {
        const x = start + (part * width) / m.d;
        marks += `<rect class="${part < shaded ? "fli-part-shaded" : "fli-part-empty"}" x="${x}" y="${y}" width="${width / m.d}" height="34"/>`;
        if (part < shaded)
          marks += `<rect x="${x}" y="${y}" width="${width / m.d}" height="34" fill="url(#fli-shading)"/>`;
      }
      marks += `<rect class="fli-whole-outline" x="${start}" y="${y}" width="${width}" height="34"/>`;
    }
    const whole = Math.floor(m.n / m.d),
      remainder = m.n % m.d;
    let d = m.d / flGcd(m.n, m.d);
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    const decimal = (d === 1 ? "= " : "≈ ") + String(Number((m.n / m.d).toFixed(6)));
    return {
      controls:
        flField("n", "Numerator: shaded parts", m.n, "Whole number; 0 to 4 × denominator") +
        flField("d", "Denominator: parts per whole", m.d, "Whole number; 1–12"),
      visual: flSvg(
        marks,
        "Four equal fraction bars",
        `${m.n} parts are shaded. Each whole has ${m.d} equal parts. This is ${whole} complete wholes and ${remainder} remaining parts of size 1/${m.d}. Hatched colored parts are shaded; empty parts are unshaded.`,
      ),
      text: `${m.n} shaded parts; each part is 1/${m.d} of one whole. Every outlined bar has the same size.`,
      extras: `<div class="fli-inline-actions"><button type="button" data-fli-action="part-less"${m.n === 0 ? " disabled" : ""}>− One part</button><button type="button" data-fli-action="part-more"${m.n === 4 * m.d ? " disabled" : ""}>+ One part</button></div>`,
      measures: `<div class="fli-equivalence"><strong>${m.n}/${m.d} = ${flFraction(m.n, m.d)}</strong><span>${whole} whole${whole === 1 ? "" : "s"} + ${remainder}/${m.d}</span><span>Decimal ${decimal}</span></div><p>${d === 1 ? "The decimal terminates, so the equals sign is exact." : "This decimal repeats. The ≈ sign marks the rounded decimal; the fraction remains exact."} Shading more parts changes the numerator. Repartitioning a whole changes the size of each part.</p>`,
      extension:
        "Represent the same amount with a different denominator. Which numbers must change together? Explain why the size of the whole must stay fixed.",
    };
  }
  function flGeometryModel(m) {
    const low = Math.min(0, m.shape === "triangle" ? m.offset : 0) - 1,
      high = Math.max(m.base, m.shape === "triangle" ? m.offset : m.base) + 1;
    const scale = Math.min(460 / (high - low), 170 / m.height),
      x = (n) => 70 + (n - low) * scale,
      bottom = 212,
      top = bottom - m.height * scale;
    const apex = x(m.offset),
      foot = m.shape === "triangle" ? apex : x(m.base),
      baseStart = x(0),
      baseEnd = x(m.base);
    let marks = `<line class="fli-extension" x1="${x(low)}" y1="${bottom}" x2="${x(high)}" y2="${bottom}"/>`;
    if (m.shape === "triangle")
      marks += `<polygon class="fli-shape" points="${baseStart},${bottom} ${baseEnd},${bottom} ${apex},${top}"/>`;
    else
      marks += `<rect class="fli-shape" x="${baseStart}" y="${top}" width="${m.base * scale}" height="${m.height * scale}"/>`;
    const heightLabelOnLeft = foot > 410;
    marks += `<line class="fli-reference" x1="${foot}" y1="${top}" x2="${foot}" y2="${bottom}"/><path class="fli-right-angle" d="M${foot} ${bottom - 10}h10v10"/><text class="fli-svg-text" x="${foot + (heightLabelOnLeft ? -15 : 15)}" y="${(top + bottom) / 2}" text-anchor="${heightLabelOnLeft ? "end" : "start"}">h = ${flNumber(m.height)} cm</text><text class="fli-svg-text" x="${(baseStart + baseEnd) / 2}" y="244" text-anchor="middle">base = ${flNumber(m.base)} cm</text>`;
    const area = m.base * m.height * (m.shape === "triangle" ? 0.5 : 1);
    return {
      controls:
        flSelect("shape", "Shape", m.shape, [
          ["triangle", "Triangle"],
          ["rectangle", "Rectangle"],
        ]) +
        flField("base", "Base (cm)", m.base, "1–12 cm") +
        flField("height", "Perpendicular height (cm)", m.height, "1–10 cm") +
        (m.shape === "triangle"
          ? flField(
              "offset",
              "Apex horizontal position (cm)",
              m.offset,
              "−5–17 cm, measured from base’s left end",
            )
          : `<input type="hidden" name="offset" value="${m.offset}">`),
      visual: flSvg(
        marks,
        `${m.shape === "triangle" ? "Triangle" : "Rectangle"} base and perpendicular height`,
        `${m.shape} with base ${m.base} cm and perpendicular height ${m.height} cm. ${m.shape === "triangle" ? `The apex is ${m.offset} cm horizontally from the left end of the base. ${m.offset < 0 || m.offset > m.base ? "The perpendicular height is outside the triangle and meets an extension of the base." : "The perpendicular height meets the base."}` : ""} The square corner marks a 90-degree angle.`,
      ),
      text: `The dashed segment is perpendicular to the base line. ${m.shape === "triangle" && (m.offset < 0 || m.offset > m.base) ? "Its foot is outside the triangle." : "The small square marks a right angle."}`,
      measures: `<div class="fli-equivalence"><strong>Area = ${m.shape === "triangle" ? "½ × " : ""}${flNumber(m.base)} × ${flNumber(m.height)} = ${flNumber(area)} cm²</strong><span>Same base and height: rectangle ${flNumber(m.base * m.height)} cm²; triangle ${flNumber((m.base * m.height) / 2)} cm².</span></div><p>Any triangle with this base and perpendicular height has the same area, even if its apex moves sideways. Two congruent copies form a parallelogram with area base × height.</p>`,
      extension:
        "Keep base and height fixed. Move the triangle’s apex to −3, then to 15. Predict whether the area changes and justify your prediction.",
    };
  }
  function flCoordinateModel(m, measured) {
    const x = (n) => 300 + n * 34,
      y = (n) => 214 - n * 34;
    const qx = m.reflection === "y" || m.reflection === "both" ? -m.x : m.x,
      qy = m.reflection === "x" || m.reflection === "both" ? -m.y : m.y;
    let marks = "";
    for (let n = -5; n <= 5; n++) {
      marks += `<line class="${n === 0 ? "fli-axis" : "fli-grid"}" x1="130" y1="${y(n)}" x2="470" y2="${y(n)}"/><line class="${n === 0 ? "fli-axis" : "fli-grid"}" x1="${x(n)}" y1="44" x2="${x(n)}" y2="384"/>`;
      if (n !== 0)
        marks += `<text class="fli-svg-text fli-axis-number" x="${x(n)}" y="232" text-anchor="middle">${n}</text><text class="fli-svg-text fli-axis-number" x="285" y="${y(n) + 5}" text-anchor="end">${n}</text>`;
    }
    marks +=
      '<text class="fli-svg-text" x="482" y="219">x</text><text class="fli-svg-text" x="295" y="28">y</text><text class="fli-svg-text" x="288" y="234" text-anchor="end">0</text>';
    if (measured)
      marks += `<line class="fli-reference" x1="${x(m.x)}" y1="${y(m.y)}" x2="${x(qx)}" y2="${y(qy)}"/><circle class="fli-reflected" cx="${x(qx)}" cy="${y(qy)}" r="11"/><text class="fli-svg-text" x="${x(qx) + 16}" y="${y(qy) + 18}">Q</text>`;
    marks += `<circle class="fli-dot" cx="${x(m.x)}" cy="${y(m.y)}" r="7"/><text class="fli-svg-text" x="${x(m.x) + 13}" y="${y(m.y) - 11}">P</text>`;
    return {
      controls:
        flField("x", "Point P: x-coordinate", m.x, "Whole number; −5 to 5") +
        flField("y", "Point P: y-coordinate", m.y, "Whole number; −5 to 5") +
        flSelect("reflection", "Reflect across", m.reflection, [
          ["x", "The x-axis"],
          ["y", "The y-axis"],
          ["both", "The x-axis, then the y-axis"],
        ]),
      visual: flSvg(
        marks,
        "Interactive coordinate plane",
        `Each grid step is 1 unit. P is (${m.x}, ${m.y}). ${measured ? `The reflected point Q is (${qx}, ${qy}).` : "The reflection is not shown yet."} Use the coordinate inputs to plot any point. With the graph focused, arrow keys move P one unit and Home returns P to the origin.`,
        "100 5 405 405",
        'tabindex="0" data-fli-action="plot" aria-describedby="fli-coordinate-help"',
      ),
      text: `P = (${m.x}, ${m.y}). Each grid interval represents 1 unit.`,
      extras:
        '<p id="fli-coordinate-help" class="fli-caption">Click a grid intersection, use the coordinate inputs, or focus the graph and press arrow keys to move P. Home returns P to (0, 0).</p>',
      measureLabel: "Show reflected point",
      measures: `<div class="fli-equivalence"><strong>P (${m.x}, ${m.y}) → Q (${qx}, ${qy})</strong><span>${m.reflection === "x" ? "Across the x-axis: (x, y) → (x, −y)." : m.reflection === "y" ? "Across the y-axis: (x, y) → (−x, y)." : "Across both axes in order: (x, y) → (x, −y) → (−x, −y)."}</span></div><p>${m.reflection === "both" ? "Each step preserves distance from the axis used in that step." : "A point on the reflecting axis stays where it is. Otherwise, original and image lie on opposite sides at equal perpendicular distances from the axis."}</p>`,
      extension:
        "Place P on the reflecting axis. Predict its image. Then try the origin and explain why neither coordinate changes.",
    };
  }
  function flEquationModel(m, measured) {
    const solution = m.type === "add" ? m.b - m.a : m.b / m.a,
      expression = m.type === "add" ? `x + ${m.a}` : `${m.a}x`;
    const left =
      m.type === "add"
        ? `<rect class="fli-unknown" x="90" y="70" width="66" height="60" rx="8"/><text class="fli-token-text" x="123" y="108" text-anchor="middle">x</text><text class="fli-svg-text" x="178" y="107" text-anchor="middle">+</text><rect class="fli-amount" x="198" y="70" width="66" height="60" rx="8"/><text class="fli-svg-text" x="231" y="108" text-anchor="middle">${m.a}</text>`
        : `<rect class="fli-unknown" x="100" y="70" width="160" height="60" rx="8"/><text class="fli-token-text" x="180" y="107" text-anchor="middle">${m.a} × x</text>`;
    const graphic = `${measured ? `<text class="fli-svg-text" x="300" y="35" text-anchor="middle">Start: ${expression} = ${m.b}</text><rect class="fli-unknown" x="140" y="70" width="80" height="60" rx="8"/><text class="fli-token-text" x="180" y="108" text-anchor="middle">x</text>` : left}<text class="fli-equals" x="300" y="107" text-anchor="middle">${measured && flNumber(solution).startsWith("≈") ? "≈" : "="}</text><rect class="fli-amount" x="380" y="70" width="110" height="60" rx="8"/><text class="fli-svg-text" x="435" y="108" text-anchor="middle">${measured ? flNumber(solution).replace(/^≈ /, "") : flNumber(m.b)}</text><path class="fli-balance" d="M65 150H535M300 150L275 190H325ZM275 190H325"/>${measured ? `<text class="fli-svg-text" x="300" y="230" text-anchor="middle">${m.type === "add" ? `Subtract ${m.a}` : `Divide by ${m.a}`} on both sides</text>` : ""}`;
    // Balance beam is a representation of equality, not a scale drawing of weight.
    const inverse =
      m.type === "add" ? `Subtract ${m.a} from both sides` : `Divide both sides by ${m.a}`;
    const rounded = flNumber(solution),
      isApprox = rounded.startsWith("≈ "),
      numeral = rounded.replace(/^≈ /, "");
    return {
      controls:
        flSelect("type", "Equation type", m.type, [
          ["add", "x + a = b"],
          ["multiply", "ax = b"],
        ]) +
        flField(
          "a",
          m.type === "add" ? "Added amount a" : "Multiplier a",
          m.a,
          m.type === "add" ? "0–20" : "0.25–20; never zero",
        ) +
        flField("b", "Right-side value b", m.b, "0–40"),
      visual: flSvg(
        graphic,
        "Equation balance",
        `${expression} = ${m.b}. ${measured ? `${inverse}, giving x ${isApprox ? "approximately" : "equals"} ${numeral}.` : "Both sides represent equal quantities. x is an unknown number."} The diagram is symbolic, not a measurement of physical weight.`,
      ),
      text: `${expression} = ${m.b}. The beam represents equality. Boxes label quantities; their widths do not measure their values.`,
      measureLabel: inverse,
      measures: `<div class="fli-equivalence"><strong>${inverse}.</strong><span>${m.type === "add" ? `x + ${m.a} − ${m.a} = ${m.b} − ${m.a}` : `(${m.a}x) ÷ ${m.a} = ${m.b} ÷ ${m.a}`}</span><strong>x = ${m.type === "add" ? `${m.b} − ${m.a}` : `${m.b} ÷ ${m.a}`} ${isApprox ? "≈" : "="} ${numeral}</strong></div><p>Check by substitution: ${m.type === "add" ? `${numeral} + ${m.a}` : `${m.a} × (${numeral})`} ${isApprox ? "≈" : "="} ${m.b}. ${isApprox ? "The displayed decimal is rounded; keep the division or subtraction expression for the exact value. " : ""}${m.type === "multiply" ? "Division is valid because the multiplier is not zero." : "Subtracting the same amount from both sides preserves equality."}</p>`,
      extension:
        "Create a new equation whose solution is 3. Explain how you chose both values, then substitute 3 to verify the equality.",
    };
  }
  const flModelBuilders = {
    statistics: flStatsModel,
    ratios: flRatioModel,
    fractions: flFractionModel,
    geometry: flGeometryModel,
    coordinates: flCoordinateModel,
    equations: flEquationModel,
  };
  function flPanelMarkup() {
    const { lab, state, challenge, attempt } = flCurrent(),
      model = flModelBuilders[lab.id](state.model, state.measured);
    const changed = JSON.stringify(state.model) !== JSON.stringify(challenge.model);
    return `<header class="fli-lab-header"><p class="fli-eyebrow">${lab.eyebrow}</p><h3 id="fli-lab-title" tabindex="-1">${lab.title}</h3><p>${lab.intro}</p></header>
      <div class="fli-workspace"><section class="fli-model-region" aria-labelledby="fli-model-title"><div class="fli-section-heading"><h4 id="fli-model-title" tabindex="-1">Explore the model</h4><span class="fli-small-tag">${state.measured ? "Measurements visible" : "Predict first"}</span></div><button class="fli-mobile-jump" type="button" data-fli-action="question-jump">↑ Back to the question</button>
      <div class="fli-visual">${model.visual}</div><p class="fli-model-text">${model.text}</p>${model.extras || ""}
      <form id="fli-model-form" novalidate><div class="fli-control-grid">${model.controls}</div><div class="fli-form-footer"><button type="submit" class="fli-primary">Update model</button><button type="button" data-fli-action="restore">Restore challenge model</button></div><p id="fli-model-error" class="fli-error" role="alert"></p></form>
      ${changed ? '<p class="fli-model-changed">You changed the exploration model. The challenge still uses the quantities in its question. Restore the challenge model to reconnect them.</p>' : ""}
      <button type="button" class="fli-measure-button" data-fli-action="measure" aria-expanded="${state.measured}">${state.measured ? "Hide measurements" : model.measureLabel || "Inspect measurements"}</button>
      ${state.measured ? `<div class="fli-measures">${model.measures}</div>` : ""}<div class="fli-extension"><strong>Take it further</strong><p>${model.extension}</p></div></section>
      <section class="fli-challenge-region" aria-labelledby="fli-challenge-title"><div class="fli-section-heading"><h4 id="fli-challenge-title" tabindex="-1">Challenge ${state.index + 1} of ${lab.challenges.length}</h4><span class="fli-small-tag">${attempt.checked ? (attempt.supported ? "Checked with support" : "Checked independently") : "Make a prediction"}</span></div><p class="fli-prompt">${challenge.prompt}</p><button class="fli-mobile-jump" type="button" data-fli-action="model-jump">↓ Go to the model</button>
      <form id="fli-answer-form" novalidate><label class="fli-field" for="fli-answer"><span>Your answer</span><input id="fli-answer" name="answer" value="${e(attempt.answer)}" autocomplete="off" maxlength="120" aria-describedby="fli-answer-help"><small id="fli-answer-help">${Array.isArray(challenge.answer) ? "Enter an ordered pair, such as (−2, 3)." : challenge.fraction ? "Use an exact fraction, such as 5/3." : "Enter one value. Fractions, mixed numbers, and decimals are accepted."}</small></label><label class="fli-field" for="fli-reason"><span>Your reasoning or prediction</span><textarea id="fli-reason" name="reason" rows="5" maxlength="4000" placeholder="Explain what changes, what stays the same, and why.">${e(attempt.reason)}</textarea><small>Saved in this tab when storage is available. This reasoning needs your own or a teacher’s review.</small></label><button class="fli-primary" type="submit">Check answer</button></form>
      <p id="fli-feedback" class="fli-feedback${attempt.checked ? " fli-feedback-correct" : ""}" role="status" aria-live="polite">${e(attempt.feedback)}</p><div class="fli-inline-actions"><button type="button" data-fli-action="hint" aria-expanded="${attempt.hint}">Thinking hint</button><button type="button" data-fli-action="explain" aria-expanded="${attempt.reveal}">Read worked example</button></div>
      ${attempt.hint ? `<aside class="fli-hint"><strong>A way in</strong><p>${challenge.hint}</p></aside>` : ""}${attempt.reveal ? `<aside class="fli-explanation"><strong>Worked example: ${challenge.display}</strong><p>${challenge.why}</p><p class="fli-caption">Reading an example supports learning. It does not count as an independent answer.</p></aside>` : ""}
      <div class="fli-challenge-footer"><button type="button" class="fli-next" data-fli-action="next">${state.index === lab.challenges.length - 1 ? "Return to challenge 1" : "Next challenge"} <span aria-hidden="true">→</span></button><p>Hints, worked examples, and measurements make this a supported attempt. Answer checks verify the value, not the reasoning.</p></div></section></div>`;
  }
  function labsMarkup() {
    return `<section id="fluency-labs" class="fli-studio" aria-labelledby="fli-studio-title"><header class="fli-studio-header"><p class="fli-eyebrow">VISUAL INVESTIGATIONS</p><h2 id="fli-studio-title">Predict. Change one thing. Explain.</h2><p>Six mathematics workshops. Try a challenge, test an idea in the model, and use evidence to explain your thinking.</p></header><nav class="fli-nav" aria-label="Choose an investigation">${flBank.map((lab, i) => `<button type="button" data-fli-lab="${lab.id}" aria-pressed="${flState.active === lab.id}"><span class="fli-nav-number" aria-hidden="true">0${i + 1}</span>${lab.name}</button>`).join("")}</nav><p id="fli-storage-note" class="fli-storage-note" role="status">${e(flStorageNotice)}</p><div id="fli-panel">${flPanelMarkup()}</div></section>`;
  }
  function labsSnapshot() {
    return flCopy(flState);
  }
  function selectLab(id) {
    if (!flBank.some((lab) => lab.id === id)) return false;
    flState.active = id;
    return true;
  }
  function resetLabs() {
    flState.active = "statistics";
    flBank.forEach((lab) => {
      flState.items[lab.id] = {
        index: 0,
        model: flCopy(lab.challenges[0].model),
        measured: false,
        attempts: lab.challenges.map(flAttempt),
      };
    });
    flSave();
    if (document.getElementById("fluency-labs")) flRender("fli-lab-title");
  }
  function flRender(focusTarget) {
    const root = document.getElementById("fluency-labs");
    if (!root) return;
    const focused = document.activeElement,
      focusId = focusTarget || (root.contains(focused) ? focused.id : "");
    root
      .querySelectorAll("[data-fli-lab]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", String(button.dataset.fliLab === flState.active)),
      );
    root.querySelector("#fli-panel").innerHTML = flPanelMarkup();
    if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
    flSave();
  }
  function flModelError(message) {
    const element = document.getElementById("fli-model-error");
    if (element) element.textContent = message;
  }
  function flReadModel(form, id) {
    const data = new FormData(form),
      get = (k) => flValue(data.get(k));
    if (id === "statistics")
      return {
        values: String(data.get("values"))
          .split(",")
          .map((value) => (/^\s*\d+\s*$/.test(value) ? Number(value) : NaN)),
      };
    if (id === "ratios") return { a: get("a"), b: get("b"), k: get("k") };
    if (id === "fractions") return { n: get("n"), d: get("d") };
    if (id === "geometry")
      return {
        shape: data.get("shape"),
        base: get("base"),
        height: get("height"),
        offset: get("offset"),
      };
    if (id === "coordinates")
      return { x: get("x"), y: get("y"), reflection: data.get("reflection") };
    return { type: data.get("type"), a: get("a"), b: get("b") };
  }
  function flCheck() {
    const { challenge, attempt } = flCurrent(),
      answer = attempt.answer.trim();
    attempt.checked = false;
    if (!answer)
      attempt.feedback =
        "Enter your prediction first. A hint is available if you need a starting point.";
    else {
      const values =
        Array.isArray(challenge.answer) && flValuesOnly(answer) ? sequence(answer) : null;
      const valid = Array.isArray(challenge.answer)
        ? values && values.length === 2
        : Number.isFinite(flValue(answer));
      const match =
        valid &&
        (Array.isArray(challenge.answer)
          ? values.every((v, i) => close(v, challenge.answer[i]))
          : close(flValue(answer), challenge.answer));
      if (!valid)
        attempt.feedback = Array.isArray(challenge.answer)
          ? "Enter values only: exactly two numbers separated by a comma, such as (−2, 3). Put units and explanations in the reasoning box."
          : "Enter a value only: one number, decimal, fraction, or mixed number. Put units and explanations in the reasoning box.";
      else if (challenge.fraction && match && !/^[+-]?\d+\s*\/\s*\d+$/.test(answer))
        attempt.feedback =
          "The value matches. Now write it as an exact fraction, as this challenge requests.";
      else if (
        challenge.fraction &&
        /^[+-]?\d+\s*\/\s*\d+$/.test(answer) &&
        !flExactFraction(answer, challenge.fraction)
      )
        attempt.feedback =
          "That fraction is not exactly equivalent. Compare the fractions by cross-multiplying, then revise.";
      else if (match) {
        attempt.checked = true;
        attempt.feedback = attempt.supported
          ? "Your value is correct with support. Explain the mathematics in your reasoning, then try a new challenge."
          : "Your value is correct. Explain why it works; the reasoning is for you or your teacher to review.";
      } else
        attempt.feedback =
          challenge.fraction && Math.abs(flValue(answer) - challenge.answer) < 0.001
            ? "That decimal is close, but this challenge needs an exact fraction. Keep the fraction’s denominator."
            : "Not yet. Recheck the quantities in the challenge, then use the model or a hint to revise your answer.";
    }
    flRender("fli-answer");
  }
  function initLabs() {
    const root = document.getElementById("fluency-labs");
    if (!root || root.dataset.flBound) return;
    root.dataset.flBound = "true";
    root.addEventListener("input", (event) => {
      const { attempt } = flCurrent();
      if (event.target.id === "fli-answer") {
        attempt.answer = event.target.value.slice(0, 120);
        attempt.checked = false;
        attempt.feedback = "";
        const feedback = root.querySelector("#fli-feedback"),
          badge = root.querySelector(".fli-challenge-region .fli-small-tag");
        if (feedback) {
          feedback.textContent = "";
          feedback.classList.remove("fli-feedback-correct");
        }
        if (badge) badge.textContent = "Make a prediction";
        flSave();
      }
      if (event.target.id === "fli-reason") {
        attempt.reason = event.target.value.slice(0, 4000);
        flSave();
      }
    });
    root.addEventListener("submit", (event) => {
      event.preventDefault();
      if (event.target.id === "fli-answer-form") return flCheck();
      if (event.target.id !== "fli-model-form") return;
      const { lab, state } = flCurrent(),
        model = flReadModel(event.target, lab.id),
        error = flValidate(lab.id, model);
      if (error) {
        flModelError(error);
        return;
      }
      state.model = model;
      flRender("fli-model-title");
    });
    root.addEventListener("click", (event) => {
      const labButton = event.target.closest("[data-fli-lab]");
      if (labButton) {
        selectLab(labButton.dataset.fliLab);
        const params = new URLSearchParams(location.hash.slice(1));
        params.set("lab", flState.active);
        try {
          history.replaceState(null, "", "#" + params.toString());
        } catch (_) {
          /* Models still work if history is unavailable. */
        }
        flRender("fli-lab-title");
        return;
      }
      const control = event.target.closest("[data-fli-action]");
      if (!control || control.disabled) return;
      const action = control.dataset.fliAction,
        { lab, state, challenge, attempt } = flCurrent();
      if (action === "model-jump" || action === "question-jump") {
        const target = document.getElementById(
          action === "model-jump" ? "fli-model-title" : "fli-challenge-title",
        );
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ block: "start" });
        return;
      }
      if (action === "hint") {
        attempt.hint = !attempt.hint;
        attempt.supported = true;
      } else if (action === "explain") {
        attempt.reveal = !attempt.reveal;
        attempt.supported = true;
      } else if (action === "measure") {
        state.measured = !state.measured;
        if (state.measured) attempt.supported = true;
      } else if (action === "restore") {
        state.model = flCopy(challenge.model);
        state.measured = false;
      } else if (action === "next") {
        state.index = (state.index + 1) % lab.challenges.length;
        state.model = flCopy(lab.challenges[state.index].model);
        state.measured = false;
        flRender("fli-challenge-title");
        return;
      } else if (action === "part-more" || action === "part-less") {
        const n = state.model.n + (action === "part-more" ? 1 : -1);
        if (n < 0 || n > 4 * state.model.d) return;
        state.model.n = n;
      } else if (action === "plot") {
        if (lab.id !== "coordinates") return;
        const matrix = control.getScreenCTM();
        if (!matrix) return;
        const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        const x = Math.round((point.x - 300) / 34),
          y = Math.round((214 - point.y) / 34);
        if (x < -5 || x > 5 || y < -5 || y > 5) {
          flModelError("Choose a grid intersection from −5 to 5 on each axis.");
          return;
        }
        state.model.x = x;
        state.model.y = y;
      } else return;
      const focusAction = action === "plot" ? "plot" : action;
      flRender();
      root.querySelector(`[data-fli-action="${focusAction}"]`)?.focus({ preventScroll: true });
    });
    root.addEventListener("keydown", (event) => {
      if (event.target.dataset.fliAction !== "plot") return;
      const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      if (!moves[event.key] && event.key !== "Home") return;
      event.preventDefault();
      const { state } = flCurrent(),
        next =
          event.key === "Home"
            ? { ...state.model, x: 0, y: 0 }
            : {
                ...state.model,
                x: state.model.x + moves[event.key][0],
                y: state.model.y + moves[event.key][1],
              };
      if (flValidate("coordinates", next)) {
        flModelError("The point is at the grid boundary. Coordinates must stay between −5 and 5.");
        return;
      }
      state.model = next;
      flRender();
      root.querySelector('[data-fli-action="plot"]')?.focus({ preventScroll: true });
    });
  }

  const statusLabel = {
    unstarted: "Not started",
    draft: "In progress",
    retry: "Revisit",
    checked: "Checked",
    supported: "Checked with support",
    reviewed: "Self-reviewed",
  };
  function progressMarkup(set) {
    const checked = set.answers.filter((a) => a.status === "checked").length;
    const supported = set.answers.filter((a) => a.status === "supported").length;
    const reviewed = set.answers.filter((a) => a.status === "reviewed").length;
    const complete = checked + supported + reviewed;
    return `<div class="fl-progress"><div><strong>${complete} of ${set.answers.length} tasks finished</strong><span>${checked} checked independently · ${supported} with support · ${reviewed} self-reviewed</span></div><progress value="${complete}" max="${set.answers.length}" aria-label="Tasks finished">${complete}/${set.answers.length}</progress></div>`;
  }
  function practice(l) {
    const set = currentSet(),
      items = problems(l);
    return `${workshopMarkup(l)}<div id="fl-progress-area">${progressMarkup(set)}</div>
      <div class="fl-workspace">
        <nav class="fl-task-rail" aria-label="Tasks in this practice set"><h2>Your practice path</h2><ol>${items.map((p, i) => `<li><button type="button" data-studio="task" data-task="${i}" ${i === set.active ? 'aria-current="step"' : ""}><span class="fl-task-number">${i + 1}</span><span><b>${e(p.label)}</b><small>${e(statusLabel[set.answers[i].status])}</small></span></button></li>`).join("")}</ol><p>Take your time. A useful explanation matters more than speed.</p>${button("summary", "Review this set")}</nav>
        <div class="fl-task-area" id="fl-task-area">${taskMarkup(l, set.active)}</div>
      </div>
      <details class="fl-guide"><summary>How this practice works</summary><p><strong>Checked</strong> means the entered answer meets the target. <strong>With support</strong> means you used a hint or viewed the example first. <strong>Self-reviewed</strong> means you compared your reasoning and recorded a reflection. These are practice records, not a grade or a claim of mastery.</p><p>To see what you can do independently, try a different quick-check form later. Keep names and personal information out of your notes.</p></details>
      <div class="fl-session-bar"><span id="fl-save-status">${e(saveStatusText())}</span><div>${button("download", "Download my work")}${button("reset", "Clear this set")}</div></div>`;
  }
  function taskMarkup(l, i) {
    const set = currentSet(),
      p = problems(l)[i],
      a = set.answers[i],
      kind = answerKind(p);
    const needsReview = kind === "review",
      hints = hintsFor(p);
    const answerLabel =
      kind === "coordinate"
        ? "Your ordered pair"
        : kind === "sequence" || kind === "set"
          ? "Your numbers, separated by commas"
          : kind === "ratio"
            ? "Your ratio, in the requested scale"
            : needsReview
              ? "Your answer and explanation"
              : "Your answer";
    return `<article class="fl-task" aria-labelledby="fl-prompt">
      <div class="fl-task-meta"><span>Task ${i + 1} of ${set.answers.length}</span><span class="fl-status fl-status-${a.status}">${e(statusLabel[a.status])}</span></div>
      <h2 id="fl-prompt" tabindex="-1">${e(p.prompt)}</h2>
      ${p.skillText ? `<p class="fl-skill">Practicing: ${e(p.skillText)}</p>` : ""}
      ${p.model ? `<div class="fl-task-model">${i < 2 ? window.FluencyModels.render(p.model, p.modelCaption) : `<details><summary>Open a visual model</summary>${window.FluencyModels.render(p.model, p.modelCaption)}</details>`}</div>` : ""}
      ${p.guidance?.length ? `<aside class="fl-guided-steps"><h3>Work through these steps</h3><ol>${p.guidance.map((step) => `<li>${e(step)}</li>`).join("")}</ol></aside>` : ""}
      <form id="fl-answer-form" data-item="${i}" novalidate>
        ${ratioTablesMarkup(p, a)}
        ${kind !== "choice" ? `<label for="fl-response">${answerLabel}</label>` : ""}
        <p class="fl-field-help" id="fl-answer-help">${needsReview ? "Use words, numbers, an equation, or a description of your model. You will compare your reasoning with a worked example." : kind === "choice" ? "Choose one response, then explain why it fits the question." : kind === "number" ? "Enter just the value. Fractions use /, mixed numbers use a space, and percents use %. Follow any form requested in the question." : "Keep signs and order. Put extra explanation in the reasoning box below."}</p>
        ${kind === "choice" ? `<fieldset class="fl-choice-group" aria-describedby="fl-answer-help fl-feedback"><legend>Choose your answer</legend>${p.options.map((option, j) => `<label for="${j === 0 ? "fl-response" : "fl-choice-" + j}"><input type="radio" id="${j === 0 ? "fl-response" : "fl-choice-" + j}" name="response" value="${e(option)}" ${a.text === option ? "checked" : ""}>${e(option)}</label>`).join("")}</fieldset>` : `<textarea id="fl-response" name="response" rows="${needsReview ? 3 : 2}" maxlength="1500" aria-describedby="fl-answer-help fl-feedback" ${a.tone === "retry" ? 'aria-invalid="true"' : ""}>${e(a.text)}</textarea>`}
        <div ${kind === "choice" ? "hidden" : ""} class="fl-math-keys" role="group" aria-label="Insert a math symbol">${[
          ["/", "Fraction slash"],
          ["−", "Minus"],
          ["×", "Multiply"],
          ["÷", "Divide"],
          ["%", "Percent"],
          ["²", "Squared"],
          ["<", "Less than"],
          [">", "Greater than"],
          ["≤", "Less than or equal to"],
          ["≥", "Greater than or equal to"],
        ]
          .map(
            ([s, label]) =>
              `<button type="button" data-studio="symbol" data-symbol="${e(s)}" aria-label="${label}">${e(s)}</button>`,
          )
          .join("")}</div>
        ${!needsReview ? `<label for="fl-reasoning">Explain or check your thinking <span class="fl-optional">(optional)</span></label><textarea id="fl-reasoning" rows="2" maxlength="1500" placeholder="An estimate, an equation, a model, or a check…">${e(a.reasoning)}</textarea>` : ""}
        <div class="fl-actions"><button class="btn btn-primary" type="submit">${needsReview ? "Compare my reasoning" : "Check my answer"}</button>${button("hint", a.hints === 0 ? "Get a strategy hint" : a.hints === 1 ? "Get a setup hint" : "Both hints open", `id="fl-hint-button" ${a.hints >= 2 ? "disabled" : ""}`)}${button("scratch", a.scratchOpen ? "Close sketchpad" : "Open sketchpad", `aria-expanded="${a.scratchOpen}" aria-controls="fl-sketch"`)}</div>
      </form>
      <div id="fl-feedback" class="fl-feedback ${e(a.tone)}" role="status" aria-live="polite" aria-atomic="true" tabindex="-1">${e(a.message)}</div>
      ${a.hints ? `<aside class="fl-hints" aria-label="Hints"><h3>Start here</h3><p>${e(hints[0])}</p>${a.hints > 1 ? `<h3>Set it up</h3><p>${e(hints[1])}</p>` : ""}</aside>` : ""}
      <div id="fl-sketch" class="fl-sketch" ${a.scratchOpen ? "" : "hidden"}><div class="fl-sketch-tools" role="group" aria-label="Sketch tools">${button("pen", "Pen", 'aria-pressed="true"')}${button("eraser", "Eraser", 'aria-pressed="false"')}${button("undo", "Undo stroke")}${button("clear-sketch", "Clear drawing")}</div><canvas id="fl-canvas" aria-label="Optional drawing area. You may type the same work in the answer or reasoning box."></canvas><p>Sketch with a mouse, touch, or pen. Typing your work above is an equivalent option. Drawings stay with this task.</p></div>
      <div class="fl-example-control">${button("example", a.revealed ? "Hide worked example" : "Show worked example", `aria-expanded="${a.revealed}" aria-controls="fl-example"`)}</div>
      <section id="fl-example" class="fl-example" ${a.revealed ? "" : "hidden"} aria-label="Worked example"><h3>Compare the reasoning</h3>${ratioTablesMarkup(p, {}, "key")}<p class="fl-example-answer">${e(p.answer)}</p>${p.steps ? `<ol class="fl-solution-steps">${p.steps.map((step) => `<li>${e(step)}</li>`).join("")}</ol>` : `<p>${e(p.explanation)}</p>`}<label for="fl-reflection">What matches, or what would you change?</label><textarea id="fl-reflection" maxlength="1500" rows="3" placeholder="I checked… / I changed… because…">${e(a.reflection)}</textarea><p class="fl-field-help">Check the calculation or claim, the explanation, and any units. Different valid methods are welcome. A teacher or partner can help you review.</p>${button("reviewed", "Record my self-review")}</section>
      ${p.frame ? `<p class="fl-language-frame"><strong>Explain your thinking:</strong> ${e(p.frame)}</p>` : ""}
      <fieldset class="fl-confidence"><legend>What do you need next?</legend>${[
        ["ready", "I can explain it"],
        ["practice", "Another example"],
        ["help", "Help with this"],
      ]
        .map(
          ([value, label]) =>
            `<label><input type="radio" name="confidence" value="${value}" ${a.confidence === value ? "checked" : ""}>${label}</label>`,
        )
        .join("")}</fieldset>
      <div class="fl-task-footer">${button("previous", "Previous task", i === 0 ? "disabled" : "")}<span>${i + 1} / ${set.answers.length}</span>${i === set.answers.length - 1 ? button("summary", "Review this set") : button("next", "Next task")}</div>
    </article>`;
  }
  function renderTask(focusId) {
    if (sketchCleanup) {
      sketchCleanup();
      sketchCleanup = null;
    }
    const l = byId[lessonId],
      set = currentSet();
    const area = document.getElementById("fl-task-area");
    if (area) area.innerHTML = taskMarkup(l, set.active);
    const progress = document.getElementById("fl-progress-area");
    if (progress) progress.innerHTML = progressMarkup(set);
    host()
      .querySelectorAll('[data-studio="task"]')
      .forEach((b, i) => {
        if (i === set.active) b.setAttribute("aria-current", "step");
        else b.removeAttribute("aria-current");
        b.querySelector("small").textContent = statusLabel[set.answers[i].status];
      });
    if (set.answers[set.active].scratchOpen) initScratchpad();
    if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
    save();
  }
  function showSummary() {
    const set = currentSet(),
      items = problems(byId[lessonId]);
    if (sketchCleanup) {
      sketchCleanup();
      sketchCleanup = null;
    }
    document.getElementById("fl-task-area").innerHTML =
      `<section class="fl-task fl-summary"><h2 id="fl-summary-title" tabindex="-1">Pause. Look at your thinking.</h2><p>Use this record to choose a useful next step. A checked answer is one piece of evidence; explaining and applying the idea matter too.</p>${progressMarkup(set)}<ul>${items.map((p, i) => `<li><button type="button" data-studio="task" data-task="${i}"><span>${i + 1}. ${e(p.label)}</span><b>${e(statusLabel[set.answers[i].status])}</b></button></li>`).join("")}</ul><div class="fl-next-step"><h3>A next step for you</h3><p>${set.answers.some((a) => ["retry", "draft", "unstarted"].includes(a.status)) ? "Revisit an unfinished task. Use a model or ask a partner to talk through the first step." : set.answers.some((a) => a.status === "supported" || a.status === "reviewed") ? "Try a different problem without the example open. Explain the key step to a partner." : "Choose a connect-and-apply task, then explain why your method works."}</p></div><div class="fl-actions">${button("download", "Download my work")}${button("continue-tier", level === "workshop" ? "Try foundations" : level === "foundation" ? "Try connect & apply" : level === "core" ? "Try extend & explain" : "Return to foundations")}${button("mode", "Explore a math investigation", 'data-mode="labs"')}</div></section>`;
    document.getElementById("fl-summary-title").focus({ preventScroll: true });
  }
  function render() {
    if (!host()) return;
    if (sketchCleanup) {
      sketchCleanup();
      sketchCleanup = null;
    }
    const l = byId[lessonId];
    const studentModes = ["practice", "labs"];
    const title = isStudent ? "Make sense of the math." : "Practice with a purpose.";
    host().innerHTML = `<div class="fl-studio">
      <header class="fl-studio-header"><div><p class="fl-edition">Grade 6 ${isStudent ? "student studio" : "teaching studio"}</p><h1>${title}</h1><p>Try a strategy. Check the result. Explain why it works.</p></div><div class="fl-header-actions">${mode === "practice" ? '<button type="button" class="btn btn-primary fl-begin" data-studio="begin">Go to my task</button>' : ""}${button("print", "Print practice sheet")}${!isStudent ? button("student", "Copy student link") : ""}</div></header>
      <div class="fl-selectors"><div><label for="studio-lesson">Choose a lesson</label><select id="studio-lesson">${DATA.units.map((u) => `<optgroup label="Unit ${u.number}: ${e(u.title)}">${u.lessons.map((x) => `<option value="${x.id}" ${lessonId === x.id ? "selected" : ""}>${x.id} · ${e(x.title)}</option>`).join("")}</optgroup>`).join("")}</select></div><div><label for="studio-level">Choose your practice set</label><select id="studio-level">${Object.entries(
        levels,
      )
        .map(
          ([key, label]) =>
            `<option value="${key}" ${level === key ? "selected" : ""}>${label}</option>`,
        )
        .join("")}</select></div></div>
      <nav class="fl-mode-nav" aria-label="Studio activities">${Object.entries(modes)
        .filter(([key]) => !isStudent || studentModes.includes(key))
        .filter(([key]) => key !== "spine" || DATA.spine?.length)
        .map(([key, label]) =>
          button(
            "mode",
            label,
            `data-mode="${key}" aria-pressed="${mode === key}" id="fl-mode-${key}"`,
          ),
        )
        .join("")}</nav>
      <details class="fl-lesson-brief"><summary><span><b>Lesson ${e(l.id)}</b> ${e(l.title)}</span><span>Learning notes</span></summary><div class="fl-brief-grid"><div><h2>What this prepares you for</h2><p>${e(l.standard?.code || "")} · ${e(l.standard?.text || l.subtopics || "")}</p><h3>Put the idea into words</h3><p>${e(l.frame || "I used ___ because ___. I checked it by ___.")}</p></div><div><h3>Useful vocabulary</h3><dl>${(l.vocabulary || []).map((v) => `<dt>${e(v.term)}</dt><dd>${e(v.def)}</dd>`).join("")}</dl></div></div></details>
      <div id="studio-content">${mode === "practice" ? practice(l) : mode === "labs" ? labsMarkup() : paperContent(l)}</div>
      <p id="studio-status" class="studio-status" role="status"></p>
      <dialog id="studio-key" aria-label="Teacher answer key"><div class="studio-actions">${button("print-key", "Print this key")}${button("close-key", "Close key")}</div><div id="studio-key-body"></div></dialog>
      <dialog id="fl-reset-dialog" aria-labelledby="fl-reset-title"><h2 id="fl-reset-title">Clear this practice set?</h2><p>This clears answers, reflections, and drawings for lesson ${e(lessonId)}, ${e(levels[level])}. Other sets stay saved in this tab.</p><div class="fl-actions">${button("cancel-reset", "Keep my work")}${button("confirm-reset", "Clear this set")}</div></dialog>
    </div>`;
    if (mode === "labs") initLabs();
    if (mode === "practice" && currentSet().answers[currentSet().active].scratchOpen)
      initScratchpad();
    save();
  }
  function paperContent(l) {
    if (mode === "spine")
      return `<div class="studio-actions"><label for="studio-drill">Core skill</label><select id="studio-drill">${DATA.spine.map((s) => `<option value="${s.rank}" ${s.rank === spineRank ? "selected" : ""}>${s.rank}. ${e(s.skill)}</option>`).join("")}</select>${button("print-drill", "Print drill")}${button("key", "Open worked key")}</div><div class="paper-preview">${drillSheet(DATA.spine.find((s) => s.rank === spineRank) || DATA.spine[0])}</div>`;
    return `<div class="studio-actions">${button("print", mode === "activity" ? "Print partner activity" : "Print worksheet")}${button("key", "Open worked key")}</div><div class="paper-preview">${mode === "activity" ? activity(l) : worksheet(l)}</div>`;
  }
  function printMarkup(markup) {
    const target = document.getElementById("studio-print");
    if (!target) return;
    target.innerHTML = markup;
    document.body.classList.add("print-studio");
    window.print();
  }
  function currentSheet(key = false) {
    const l = byId[lessonId];
    if (mode === "activity") return activity(l, key);
    if (mode === "spine" && DATA.spine?.length)
      return drillSheet(DATA.spine.find((s) => s.rank === spineRank) || DATA.spine[0], key);
    return worksheet(l, key);
  }
  // Normalized vector strokes survive task changes, resizing and refresh.
  function initScratchpad() {
    const canvas = document.getElementById("fl-canvas");
    if (!canvas) return;
    const a = currentSet().answers[currentSet().active],
      ctx = canvas.getContext("2d");
    if (!ctx) return;
    let tool = "pen",
      current = null,
      pointer = null,
      width = 1,
      height = 240;
    function draw() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2),
        rect = canvas.getBoundingClientRect();
      width = rect.width || 600;
      height = rect.height || 240;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of [...a.strokes, ...(current ? [current] : [])]) {
        if (!stroke.points.length) continue;
        ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = "#075e60";
        ctx.fillStyle = "#075e60";
        ctx.lineWidth = stroke.tool === "eraser" ? 22 : 3;
        ctx.beginPath();
        stroke.points.forEach((p, i) =>
          i ? ctx.lineTo(p[0] * width, p[1] * height) : ctx.moveTo(p[0] * width, p[1] * height),
        );
        if (stroke.points.length === 1) {
          const p = stroke.points[0];
          ctx.arc(p[0] * width, p[1] * height, stroke.tool === "eraser" ? 11 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.stroke();
      }
    }
    const coords = (event) => {
      const r = canvas.getBoundingClientRect();
      return [
        Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)),
        Math.max(0, Math.min(1, (event.clientY - r.top) / r.height)),
      ];
    };
    canvas.onpointerdown = (event) => {
      if (event.button !== 0 || pointer !== null) return;
      event.preventDefault();
      pointer = event.pointerId;
      canvas.setPointerCapture(pointer);
      current = { tool, points: [coords(event)] };
      draw();
    };
    canvas.onpointermove = (event) => {
      if (event.pointerId !== pointer || !current) return;
      if (current.points.length >= 200)
        current.points = current.points.filter((_, i) => i % 2 === 0);
      current.points.push(coords(event));
      draw();
    };
    const finish = () => {
      if (current) {
        if (a.strokes.length >= 40) a.strokes.shift();
        a.strokes.push(current);
        current = null;
        saveSoon();
      }
      pointer = null;
      draw();
    };
    canvas.onpointerup = finish;
    canvas.onpointercancel = finish;
    canvas.onlostpointercapture = () => {
      if (current) finish();
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    const tools = canvas.closest(".fl-sketch").querySelector(".fl-sketch-tools");
    tools.onclick = (event) => {
      const action = event.target.closest("[data-studio]")?.dataset.studio;
      if (action === "pen" || action === "eraser") {
        tool = action;
        tools
          .querySelectorAll("[aria-pressed]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.studio === tool)));
      }
      if (action === "undo") {
        a.strokes.pop();
        draw();
        saveSoon();
      }
      if (action === "clear-sketch") {
        a.strokes = [];
        draw();
        saveSoon();
      }
    };
    sketchCleanup = () => {
      if (current) finish();
      observer.disconnect();
    };
  }

  function downloadWork() {
    const l = byId[lessonId],
      set = currentSet(),
      items = problems(l);
    const sketch = (a) =>
      a.strokes.length
        ? `<svg viewBox="0 0 700 240" role="img" aria-label="Saved sketch" style="background:white;border:1px solid #abc;width:100%;max-height:240px">${a.strokes.map((st) => (st.points.length === 1 ? `<circle cx="${(st.points[0][0] * 700).toFixed(1)}" cy="${(st.points[0][1] * 240).toFixed(1)}" r="${st.tool === "eraser" ? 11 : 1.5}" fill="${st.tool === "eraser" ? "white" : "#075e60"}"/>` : `<polyline points="${st.points.map((pt) => `${(pt[0] * 700).toFixed(1)},${(pt[1] * 240).toFixed(1)}`).join(" ")}" fill="none" stroke="${st.tool === "eraser" ? "white" : "#075e60"}" stroke-width="${st.tool === "eraser" ? 22 : 3}" stroke-linecap="round" stroke-linejoin="round"/>`)).join("")}</svg>`
        : "";
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Grade 6 practice · ${e(lessonId)}</title><style>body{font:17px/1.6 system-ui,sans-serif;max-width:800px;margin:32px auto;padding:0 24px;color:#152c40}h1{font:32px Georgia,serif}article{border-top:1px solid #bbc;padding:20px 0;break-inside:avoid}p{white-space:pre-wrap}small{color:#46596b}table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #789;padding:10px;text-align:left}caption{text-align:left;font-weight:bold}@media print{body{margin:0}article{break-inside:avoid}}</style><h1>My Grade 6 practice</h1><p>Lesson ${e(l.id)}: ${e(l.title)}<br>${e(levels[level])}</p><p><small>This is a practice record. Checked answers, supported answers, and self-reviews are different kinds of evidence; this record is not a grade.</small></p>${items
      .map((p, i) => {
        const a = set.answers[i];
        return `<article><h2>${i + 1}. ${e(p.label)}</h2><p>${e(p.prompt)}</p><p><b>Status:</b> ${e(statusLabel[a.status])}</p>${ratioTablesMarkup(p, a, "saved")}<p><b>My response:</b> ${e(a.text || "Not entered")}</p>${a.reasoning ? `<p><b>My reasoning:</b> ${e(a.reasoning)}</p>` : ""}${a.reflection ? `<p><b>My reflection:</b> ${e(a.reflection)}</p>` : ""}${sketch(a)}</article>`;
      })
      .join("")}</html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Grade-6-My-Practice-${lessonId}-${level}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const status = document.getElementById("studio-status");
    if (status)
      status.textContent = "Your practice record was downloaded, including any saved sketches.";
  }
  async function copyLink(forStudent) {
    const url = new URL(
      forStudent ? DATA.studentPath || "student.html" : location.href,
      location.href,
    );
    url.search = "";
    const p = new URLSearchParams({
      view: "studio",
      lesson: lessonId,
      level,
      mode: forStudent ? "student" : mode,
    });
    if (forStudent) p.set("activity", ["practice", "labs"].includes(mode) ? mode : "practice");
    if (mode === "labs") p.set("lab", labsSnapshot().active);
    url.hash = p.toString();
    const status = document.getElementById("studio-status");
    try {
      await navigator.clipboard.writeText(url.href);
      if (status)
        status.textContent = forStudent ? "Student practice link copied." : "Resource link copied.";
    } catch (_) {
      if (status) {
        status.innerHTML = `<label for="fl-copy-link">Copy this link</label><input id="fl-copy-link" readonly value="${e(url.href)}">`;
        const input = document.getElementById("fl-copy-link");
        input.focus();
        input.select();
      }
    }
  }
  document.addEventListener("click", (event) => {
    if (event.target.closest("#studentWorkbenchToggleBtn")) {
      mode = "labs";
      update("fl-mode-labs");
      return;
    }
    const b = event.target.closest("[data-studio]");
    if (!b || !host()?.contains(b)) return;
    const act = b.dataset.studio;
    if (act === "begin") {
      document.getElementById("fl-prompt")?.focus();
      document.getElementById("fl-prompt")?.scrollIntoView({ block: "start" });
      return;
    }
    if (act === "workshop") {
      level = "workshop";
      mode = "practice";
      update("fl-prompt");
      return;
    }
    if (act === "mode") {
      if (modes[b.dataset.mode]) mode = b.dataset.mode;
      update(`fl-mode-${mode}`);
      return;
    }
    if (act === "student" || act === "copy") {
      copyLink(act === "student");
      return;
    }
    if (act === "print") {
      printMarkup(currentSheet(false));
      return;
    }
    if (act === "key") {
      if (isStudent) return;
      document.getElementById("studio-key-body").innerHTML = currentSheet(true);
      document.getElementById("studio-key").showModal();
      return;
    }
    if (act === "close-key") {
      document.getElementById("studio-key").close();
      host().querySelector('[data-studio="key"]')?.focus();
      return;
    }
    if (act === "print-key") {
      document.getElementById("studio-key").close();
      printMarkup(currentSheet(true));
      return;
    }
    if (act === "print-drill") {
      printMarkup(drillSheet(DATA.spine.find((s) => s.rank === spineRank) || DATA.spine[0], false));
      return;
    }
    const set = currentSet(),
      a = set.answers[set.active];
    if (act === "task" || act === "next" || act === "previous") {
      set.active = act === "task" ? Number(b.dataset.task) : set.active + (act === "next" ? 1 : -1);
      set.active = Math.max(0, Math.min(set.active, set.answers.length - 1));
      renderTask("fl-prompt");
      document.getElementById("fl-prompt").scrollIntoView({ block: "nearest" });
      return;
    }
    if (act === "summary") {
      showSummary();
      return;
    }
    if (act === "continue-tier") {
      level =
        level === "workshop"
          ? "foundation"
          : level === "foundation"
            ? "core"
            : level === "core"
              ? "stretch"
              : "foundation";
      update("fl-prompt");
      return;
    }
    if (act === "download") {
      downloadWork();
      return;
    }
    if (act === "reset") {
      document.getElementById("fl-reset-dialog").showModal();
      return;
    }
    if (act === "cancel-reset") {
      document.getElementById("fl-reset-dialog").close();
      return;
    }
    if (act === "confirm-reset") {
      session.delete(currentKey());
      render();
      document.getElementById("fl-prompt")?.focus();
      return;
    }
    if (act === "hint") {
      a.hints = Math.min(2, a.hints + 1);
      if (a.status === "unstarted") a.status = "draft";
      a.message = "Use the hint to choose a next step, then try the task.";
      a.tone = "review";
      renderTask(a.hints < 2 ? "fl-hint-button" : "fl-feedback");
      return;
    }
    if (act === "example") {
      a.revealed = !a.revealed;
      if (a.revealed) {
        a.exposed = true;
        a.message =
          "Viewing an example does not finish a task. Compare it with your attempt and record what you checked.";
        a.tone = "review";
      }
      renderTask(a.revealed ? "fl-reflection" : "fl-response");
      return;
    }
    if (act === "reviewed") {
      const invalid = checkRatioTables(problems(byId[lessonId])[currentSet().active], a);
      if (invalid) {
        renderTask(invalid);
        return;
      }
      if (!a.text.trim() || a.reflection.trim().length < 12) {
        a.message =
          "Enter your own attempt and a reflection that says what you checked or changed.";
        a.tone = "retry";
        renderTask(!a.text.trim() ? "fl-response" : "fl-reflection");
        return;
      }
      a.status = "reviewed";
      a.message =
        "Self-review recorded. Ask a partner or teacher to discuss your reasoning; it has not been automatically graded.";
      a.tone = "review";
      renderTask("fl-feedback");
      return;
    }
    if (act === "scratch") {
      a.scratchOpen = !a.scratchOpen;
      renderTask("fl-response");
      return;
    }
    if (act === "symbol") {
      const input = document.getElementById("fl-response");
      const start = input.selectionStart ?? input.value.length,
        end = input.selectionEnd ?? start,
        symbol = b.dataset.symbol;
      if (input.value.length - (end - start) + symbol.length > 1500) return;
      input.setRangeText(symbol, start, end, "end");
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  document.addEventListener("input", (event) => {
    if (mode !== "practice" || event.target.closest("#fluency-labs")) return;
    const fields = {
        "fl-response": "text",
        "fl-reasoning": "reasoning",
        "fl-reflection": "reflection",
      },
      field =
        event.target.name === "response" && event.target.type === "radio"
          ? "text"
          : event.target.dataset.ratioCell
            ? "ratioCells"
            : fields[event.target.id];
    if (!field) return;
    const a = currentSet().answers[currentSet().active];
    if (field === "ratioCells") {
      a.ratioCells[event.target.dataset.ratioCell] = event.target.value.slice(0, 120);
      a.ratioVersion = 0;
    } else a[field] = event.target.value.slice(0, 1500);
    if (
      field === "text" ||
      field === "ratioCells" ||
      (field === "reflection" && a.status === "reviewed")
    ) {
      a.status = a.text.trim() ? "draft" : "unstarted";
      a.message = "";
      a.tone = "";
      document.getElementById("fl-response")?.removeAttribute("aria-invalid");
      const fb = document.getElementById("fl-feedback");
      if (fb) {
        fb.textContent = "";
        fb.className = "fl-feedback";
      }
      const progress = document.getElementById("fl-progress-area");
      if (progress) progress.innerHTML = progressMarkup(currentSet());
      const badge = host().querySelector(".fl-task-meta .fl-status");
      if (badge) {
        badge.textContent = statusLabel[a.status];
        badge.className = `fl-status fl-status-${a.status}`;
      }
      const current = host().querySelector('[aria-current="step"] small');
      if (current) current.textContent = statusLabel[a.status];
    }
    const status = document.getElementById("fl-save-status");
    if (status) status.textContent = "Saving work in this tab…";
    saveSoon();
  });
  document.addEventListener("change", (event) => {
    const t = event.target;
    if (t.id === "studio-lesson" && byId[t.value]) {
      lessonId = t.value;
      update("studio-lesson");
    } else if (t.id === "studio-level" && levels[t.value]) {
      level = t.value;
      update("studio-level");
    } else if (t.id === "studio-drill") {
      spineRank = Number(t.value);
      update("studio-drill");
    } else if (mode === "practice" && t.name === "confidence" && host()?.contains(t)) {
      currentSet().answers[currentSet().active].confidence = t.value;
      save();
    }
  });
  document.addEventListener("submit", (event) => {
    if (
      mode !== "practice" ||
      event.target.closest("#fluency-labs") ||
      event.target.id !== "fl-answer-form"
    )
      return;
    event.preventDefault();
    const set = currentSet(),
      i = set.active,
      a = set.answers[i],
      p = problems(byId[lessonId])[i];
    if (!a.text.trim()) {
      a.message = "Enter your answer or an initial idea first. A hint can help you start.";
      a.tone = "retry";
      renderTask("fl-response");
      return;
    }
    const invalid = checkRatioTables(p, a);
    if (invalid) {
      renderTask(invalid);
      return;
    }
    const result = checkAnswerMatch(a.text, p.answer, p);
    a.attempts++;
    if (result.review) {
      a.exposed = true;
      a.revealed = true;
      a.message = result.message;
      a.tone = "review";
      a.status = "draft";
      renderTask("fl-reflection");
      return;
    }
    a.message = result.message;
    if (result.match) {
      a.status =
        a.status === "checked"
          ? "checked"
          : a.hints > 0 || a.exposed || p.guidance?.length
            ? "supported"
            : "checked";
      a.tone = "success";
    } else {
      a.status = "retry";
      a.tone = "retry";
      if (!result.form && !result.invalid) {
        const cue = findMisconception(a.text, p);
        if (cue) a.message += " " + cue.do;
      }
    }
    renderTask("fl-feedback");
  });
  window.addEventListener("pagehide", save);
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("print-studio");
    const target = document.getElementById("studio-print");
    if (target) target.innerHTML = "";
  });

  // Projector-compatible renderers use the same constraints as the student models.
  function fractionInfo(num, den) {
    const n = Number(num),
      d = Number(den);
    if (
      String(num).trim() === "" ||
      String(den).trim() === "" ||
      !Number.isInteger(n) ||
      !Number.isInteger(d) ||
      d < 1 ||
      d > 16 ||
      n < 0 ||
      n > 4 * d
    )
      return null;
    const value = n / d,
      decimal = Number(value.toFixed(4)),
      percent = Number((value * 100).toFixed(2));
    return {
      n,
      d,
      value,
      decimal,
      percent,
      decimalApprox: !close(decimal, value),
      percentApprox: !close(percent, value * 100),
    };
  }
  function renderFractionStrip(container, num, den) {
    if (!container) return;
    const f = fractionInfo(num, den);
    if (!f) {
      container.innerHTML =
        '<p role="status">Use a whole-number denominator from 1 to 16 and a numerator from 0 to four times the denominator.</p>';
      return;
    }
    container.innerHTML = `<p><strong>${f.n}/${f.d}</strong> ${f.decimalApprox ? "≈" : "="} ${f.decimal} ${f.percentApprox ? "≈" : "="} ${f.percent}%</p>${Array.from({ length: Math.max(1, Math.ceil(f.n / f.d)) }, (_, w) => `<div class="fl-fraction-strip" role="img" aria-label="Whole ${w + 1}: ${Math.max(0, Math.min(f.d, f.n - w * f.d))} of ${f.d} parts shaded">${Array.from({ length: f.d }, (_, i) => `<span class="${w * f.d + i < f.n ? "filled" : ""}">${f.d <= 8 ? "1/" + f.d : ""}</span>`).join("")}</div>`).join("")}`;
  }
  function renderRatioTable(container, a, b) {
    if (!container) return;
    const x = Number(a),
      y = Number(b);
    if (
      String(a).trim() === "" ||
      String(b).trim() === "" ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x <= 0 ||
      y < 0 ||
      x > 10000 ||
      y > 10000
    ) {
      container.innerHTML =
        '<p role="status">Enter quantity A greater than 0 and quantity B at least 0; each must be no more than 10,000.</p>';
      return;
    }
    const fmt = (n) => Number(n.toFixed(4));
    const rate = y / x;
    container.innerHTML = `<div class="fl-table-scroll"><table class="ratio-table-display"><caption>Equivalent ratios: scale both quantities by the same factor</caption><thead><tr><th scope="col">Factor</th>${[0, 1, 2, 3, 4, 5].map((n) => `<th scope="col">×${n}</th>`).join("")}</tr></thead><tbody><tr><th scope="row">A</th>${[0, 1, 2, 3, 4, 5].map((n) => `<td>${fmt(n * x)}</td>`).join("")}</tr><tr><th scope="row">B</th>${[0, 1, 2, 3, 4, 5].map((n) => `<td>${fmt(n * y)}</td>`).join("")}</tr></tbody></table></div><p>B per 1 A: ${close(fmt(rate), rate) ? "" : "approximately "}${fmt(rate)}.</p>`;
  }
  function renderCoordinatePlaneSVG(container, ptX = null, ptY = null) {
    if (!container) return;
    const hasPoint = ptX !== null && ptY !== null,
      x = Number(ptX),
      y = Number(ptY);
    if (
      hasPoint &&
      (String(ptX).trim() === "" ||
        String(ptY).trim() === "" ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        Math.abs(x) > 8 ||
        Math.abs(y) > 8)
    ) {
      container.innerHTML = '<p role="status">Enter x and y between −8 and 8.</p>';
      return;
    }
    let grid = "";
    for (let i = -8; i <= 8; i++) {
      const pos = 180 + i * 18;
      grid += `<path d="M${pos} 36V324 M36 ${pos}H324" stroke="${i === 0 ? "#152c40" : "#c5d4da"}" stroke-width="${i === 0 ? 2 : 1}"/>`;
      if (i && i % 2 === 0)
        grid += `<text x="${pos}" y="197" text-anchor="middle">${i}</text><text x="166" y="${180 - i * 18 + 4}" text-anchor="end">${i}</text>`;
    }
    container.innerHTML = `<svg viewBox="0 0 360 360" style="max-width:100%;width:360px;background:white;font:12px system-ui;fill:#152c40" role="img" aria-label="Coordinate plane from negative 8 to 8${hasPoint ? `, point at (${x}, ${y})` : ""}">${grid}<text x="337" y="184">x</text><text x="176" y="22">y</text>${hasPoint ? `<circle cx="${180 + x * 18}" cy="${180 - y * 18}" r="6" fill="#075e60"/><text x="180" y="346" text-anchor="middle">(${x}, ${y})</text>` : ""}</svg>`;
  }
  restore();
  route();
  return {
    render() {
      route();
      render();
    },
    hash,
    open(id) {
      if (byId[id]) lessonId = id;
      mode = "practice";
      history.replaceState(null, "", hash());
    },
    setStudentMode(value) {
      isStudent = Boolean(value);
      route();
      if (isStudent && !["practice", "labs"].includes(mode)) mode = "practice";
      update();
    },
    isStudent: () => isStudent,
    print() {
      printMarkup(currentSheet(false));
    },
    printKey() {
      if (!isStudent) printMarkup(currentSheet(true));
    },
    printWorksheet(id, key = false, tier = null) {
      const previous = level;
      if (tier && levels[tier]) level = tier;
      const markup = worksheet(byId[id] || byId[lessonId], key);
      level = previous;
      printMarkup(markup);
    },
    printUnitPack(unitNum, key = false) {
      printMarkup(
        lessons
          .filter((l) => l.unitNumber === Number(unitNum))
          .map((l) => worksheet(l, key))
          .join(""),
      );
    },
    printDrill(rank, key = false) {
      const drill = DATA.spine.find((s) => s.rank === Number(rank)) || DATA.spine[0];
      if (drill) printMarkup(drillSheet(drill, key));
    },
    printAllDrills(key = false) {
      printMarkup(DATA.spine.map((s) => drillSheet(s, key)).join(""));
    },
    printActivity(id, key = false) {
      printMarkup(activity(byId[id] || byId[lessonId], key));
    },
    parseNumber: parseMath,
    checkAnswerMatch,
    findMisconception,
    renderFractionStrip,
    renderRatioTable,
    renderCoordinatePlaneSVG,
    initStudentWorkbench() {
      if (mode === "labs") initLabs();
    },
    audit() {
      return {
        lessons: lessons.length,
        workshopTasks: lessons.reduce((n, l) => n + l.workshop.tasks.length, 0),
        foundationTasks: lessons.reduce((n, l) => n + l.practice.length, 0),
        automatic: lessons.flatMap((l) => l.practice).filter((p) => answerKind(p) !== "review")
          .length,
        version: 4,
      };
    },
  };
})();
