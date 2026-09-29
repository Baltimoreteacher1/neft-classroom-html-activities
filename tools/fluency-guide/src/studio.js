/* Practice Studio: all worksheet and interactive content uses the same lesson bank. */
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
      .replace(/<[^>]+>/g, "");
  const lessons = DATA.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unitNumber: u.number })));
  const byId = Object.fromEntries(lessons.map((l) => [l.id, l]));
  const modes = {
    worksheet: "Worksheets",
    practice: "Interactive practice",
    activity: "Partner activity",
    spine: "Core-skill drills",
  };
  const levels = {
    foundation: "Build foundations · 4 tasks",
    core: "Connect & apply · 8 tasks",
    stretch: "Extend & explain · 4 tasks",
  };
  const session = new Map();
  let lessonId = lessons[0].id,
    mode = "worksheet",
    level = "core",
    spineRank = 1;
  let student =
    document.documentElement.dataset.student === "true" ||
    new URLSearchParams(location.search).get("student") === "1";
  const host = () => document.getElementById("view-studio");
  const button = (action, label, extra = "") =>
    `<button type="button" class="btn" data-studio="${action}" ${extra}>${label}</button>`;
  function problems(l) {
    const base = l.practice.map((p, i) => ({
      ...p,
      label: `Foundation ${i + 1}`,
      skillText: l.skills[i].text,
    }));
    const checks = [{ prompt: l.quick_check, answer: l.solution }, ...l.variants].map((p, i) => ({
      ...p,
      answer: plain(p.answer),
      explanation: "Compare each part of your work with the worked solution.",
      label: `Check ${"ABC"[i]}`,
      mode: "review",
    }));
    const extension = {
      ...l.extension,
      answer: plain(l.extension.answer),
      explanation: "Explain why your method works and include units when needed.",
      label: "Transfer",
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
          prompt: `Write a new problem that uses this skill: ${l.skills[0].text}. Solve it and explain how someone could check the result.`,
          answer:
            "Answers vary. The problem must use the named skill, have enough information, and include a correct solution with a check.",
          explanation: "Have a partner solve your problem independently and compare methods.",
          mode: "review",
        },
      ];
    return [...base, ...checks, extension];
  }
  function route() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (byId[p.get("lesson")]) lessonId = p.get("lesson");
    if (modes[p.get("mode")]) mode = p.get("mode");
    if (levels[p.get("level")]) level = p.get("level");
    if (DATA.spine.some((s) => s.rank === Number(p.get("drill"))))
      spineRank = Number(p.get("drill"));
    if (student) mode = "practice";
  }
  function hash() {
    const p = new URLSearchParams({ view: "studio", lesson: lessonId, mode, level });
    if (mode === "spine") p.set("drill", spineRank);
    return "#" + p;
  }
  function update() {
    history.replaceState(null, "", hash());
    render();
  }
  function workGrid(kind = "lines") {
    if (kind === "coordinates")
      return '<div class="work-grid" aria-label="Blank grid for a sketch; label axes and choose a scale"></div>';
    return '<div class="work-lines" aria-label="Space to show work"></div>';
  }
  function worksheet(l, key = false) {
    const items = problems(l);
    const chunks = [];
    for (let i = 0; i < items.length; i += 4) chunks.push(items.slice(i, i + 4));
    return chunks
      .map(
        (chunk, page) => `<section class="sheet ${key ? "key-sheet" : ""}">
      <div class="sheet-meta">EDUWONDERLAB · GRADE 6 FLUENCY <span>${key ? "TEACHER KEY" : "STUDENT WORK"} · ${page + 1}/${chunks.length}</span></div>
      <h2>${e(l.id)} · ${e(l.title)}</h2><p class="sheet-sub">${e(levels[level])} · Prepares for ${e(l.standard.code)}</p>
      ${key ? "<p>Use the explanation to discuss strategies. Accept mathematically equivalent answers.</p>" : '<p class="name-line">Name: __________________________ &nbsp; Date: ______________</p><p>Show your thinking. Label units. Use a sketch, words, or equations. Take the time you need.</p>'}
      ${
        level === "foundation" && page === 0
          ? `<aside class="support-box"><strong>Talk it through</strong><p>${e(l.frame)}</p><p>${e(
              l.vocabulary
                .map((v) => v.term + ": " + v.def)
                .slice(0, 2)
                .join(" · "),
            )}</p></aside>`
          : ""
      }
      <div class="task-grid">${chunk.map((p, i) => `<article class="paper-task"><div class="task-label">${page * 4 + i + 1}. ${e(p.label)}</div><p>${e(p.prompt)}</p>${key ? `<div class="key-answer"><strong>${e(p.answer)}</strong><p>${e(p.explanation)}</p>${p.skillText ? `<small>Skill: ${e(p.skillText)}</small>` : ""}</div>` : workGrid(/plot|graph|coordinate/i.test(p.prompt) ? "coordinates" : "lines")}</article>`).join("")}</div>
      ${!key ? '<p class="reflection">One strategy I used: _________________________________________________<br>My next step: □ Explain it to someone &nbsp; □ Try another example &nbsp; □ Ask for help</p>' : ""}
      <footer>Original supplemental practice · Lesson numbering follows this guide’s district sequence · ${key ? "Keep separate from student packets." : "Discuss your reasoning; this is practice, not a speed test."}</footer>
    </section>`,
      )
      .join("");
  }
  function activity(l, key = false) {
    return `<section class="sheet activity-sheet"><div class="sheet-meta">EDUWONDERLAB · PARTNER LAB <span>${key ? "TEACHER FACILITATION" : "STUDENT ACTIVITY"}</span></div><h2>${e(l.id)} · Notice, repair, explain</h2><p class="sheet-sub">${e(l.title)} · 12–15 minutes · Partners · Paper and pencil</p>
    <div class="activity-steps"><div><b>1 · Solve · 3 min</b><p>Both partners solve the launch problem independently.</p></div><div><b>2 · Investigate · 6 min</b><p>A reads the first response. B explains what needs checking. Repair it together. Switch roles for the second response.</p></div><div><b>3 · Transfer · 4 min</b><p>Try the new problem independently. Compare strategies and explain any difference.</p></div></div>
    <div class="support-box"><b>Launch problem</b><p>${e(l.quick_check)}</p>${key ? `<p class="key-answer">${e(plain(l.solution))}</p>` : ""}</div>
    <div class="task-grid">${l.errors
      .slice(0, 2)
      .map(
        (err, i) =>
          `<article class="paper-task"><b>Response ${i + 1} to investigate</b><blockquote>${e(err.shows)}</blockquote><p>What might this student be thinking? Use the launch problem to check the response. Write a correction or add the missing reasoning.</p>${key ? `<div class="key-answer"><p>${e(err.means)}</p><p>Coaching move: ${e(err.do)}</p></div>` : workGrid()}</article>`,
      )
      .join("")}</div>
    <p class="sentence-frame"><b>Explain:</b> “The step I would change is ___ because ___. I checked by ___.”</p>
    <div class="transfer-box"><b>Independent transfer</b><p>${e(l.variants[0].prompt)}</p>${key ? `<p class="key-answer">${e(plain(l.variants[0].answer))}</p>` : workGrid()}</div>
    ${key ? "<p><b>Observe:</b> Ask each partner to justify a step. A correct number without an explanation is a prompt for discussion, not evidence of secure understanding. Use check C next class to revisit the skill.</p>" : "<p>Partner check: □ We both explained a step. □ We checked the corrected work. □ We tried transfer independently.</p>"}
    </section>`;
  }
  function drillSheet(s, key = false) {
    return `<section class="sheet"><div class="sheet-meta">EDUWONDERLAB · FLUENCY SPINE <span>${key ? "TEACHER KEY" : "STUDENT DRILL"}</span></div><h2>${e(s.skill)}</h2><p class="sheet-sub">Six practice tasks · Accuracy and explanation before speed</p><p>${e(plain(s.routine).replace(/60-Second Fact Ladder:/g, "Fact Ladder:"))}</p>${!key ? '<p class="name-line">Name: __________________________ Date: ______________</p>' : ""}<div class="task-grid">${s.drill.items.map((p, i) => `<article class="paper-task"><b>${i + 1}.</b> ${e(p.q)}${key ? `<p class="key-answer">${e(p.a)}</p>` : workGrid()}</article>`).join("")}</div><p><b>Reflect:</b> Which two tasks used a related strategy? Explain the connection.</p><footer>Core skill ${s.rank} · Used by ${s.count} lessons</footer></section>`;
  }
  function value(raw) {
    const rawValue = String(raw).trim().replace(/−/g, "-");
    if (rawValue.includes(",") && !/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(rawValue)) return NaN;
    const s = rawValue.replace(/,/g, "");
    if (!s) return NaN;
    if (/^[+-]?\d+\s+\d+\/\d+$/.test(s)) {
      const [whole, frac] = s.split(/\s+/);
      return (whole.startsWith("-") ? -1 : 1) * (Math.abs(Number(whole)) + value(frac));
    }
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%$/.test(s)) return Number(s.slice(0, -1)) / 100;
    if (/^[+-]?\d+\/[+-]?\d+$/.test(s)) {
      const [a, b] = s.split("/").map(Number);
      return b === 0 ? NaN : a / b;
    }
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s) ? Number(s) : NaN;
  }
  function practice(l) {
    const items = problems(l);
    const id = `${l.id}-${level}`;
    if (!session.has(id))
      session.set(
        id,
        items.map(() => ({ text: "", revealed: false, checked: false, done: false, message: "" })),
      );
    const answers = session.get(id);
    return `<div class="practice-intro"><h2>Try it. Check it. Explain it.</h2><p>Work at your own pace. Numeric answers can be checked; written answers use a worked solution for comparison. Responses stay in this tab and clear when you reload.</p><p id="practice-progress" role="status">${answers.filter((a) => a.done).length} of ${items.length} tasks checked or reviewed</p></div><div class="practice-list">${items
      .map((p, i) => {
        const a = answers[i];
        return `<form class="practice-task" data-item="${i}" action="#" method="get"><div class="task-label">${i + 1} · ${e(p.label)}</div><h3 id="prompt-${i}">${e(p.prompt)}</h3>
      ${p.skillText ? `<details class="practice-hint"><summary>Skill reminder</summary><p>${e(p.skillText)}</p><p>Use a sketch or related fact. ${e(l.frame)}</p></details>` : ""}
      <label for="response-${i}">${p.mode === "number" ? "Your answer (number, decimal, fraction, or percent)" : "Your answer and reasoning"}</label>
      <textarea id="response-${i}" name="response" rows="2" maxlength="1500" aria-describedby="feedback-${i}">${e(a.text)}</textarea>
      <div class="studio-actions"><button class="btn btn-primary" type="submit">${p.mode === "number" ? "Check answer" : "Compare with solution"}</button>${button("solution", "Show worked solution", `data-item="${i}" aria-expanded="${a.revealed}" aria-controls="solution-${i}"`)}</div>
      <p id="feedback-${i}" class="practice-feedback" role="status">${e(a.message)}</p>
      <div class="worked-solution" id="solution-${i}" ${a.revealed ? "" : "hidden"}><b>Worked solution</b><p>${e(p.answer)}</p><p>${e(p.explanation)}</p>${button("reviewed", "I compared my work", `data-item="${i}"`)}</div></form>`;
      })
      .join(
        "",
      )}</div><div class="studio-actions">${button("retry", "Start this set again")}${button("print", "Print blank practice sheet")}</div>`;
  }
  function content(l) {
    if (mode === "practice") return practice(l);
    if (mode === "activity")
      return `<div class="studio-actions">${button("print", "Print student activity")}${button("key", "Open teacher facilitation")}</div><div class="paper-preview">${activity(l)}</div>`;
    if (mode === "spine")
      return `<div class="studio-actions"><label for="studio-drill">Core skill</label><select id="studio-drill">${DATA.spine.map((s) => `<option value="${s.rank}" ${s.rank === spineRank ? "selected" : ""}>${s.rank}. ${e(s.skill)}</option>`).join("")}</select>${button("print", "Print drill")}${button("key", "Open drill key")}${button("all-drills", "Print all 12 drills")}${button("all-drill-keys", "Print all drill keys")}</div><div class="paper-preview">${drillSheet(DATA.spine.find((s) => s.rank === spineRank))}</div>`;
    return `<div class="studio-actions">${button("print", "Print student worksheet")}${button("key", "Open answer key")}${button("unit-pack", "Print this unit’s worksheets")}${button("unit-keys", "Print this unit’s keys")}</div><p class="studio-help">Print opens your browser’s print dialog; choose Save as PDF to download. Answer keys open separately. A full unit uses the selected level for every lesson.</p><div class="paper-preview">${worksheet(l)}</div>`;
  }
  function render() {
    const l = byId[lessonId];
    document.body.classList.toggle("student-mode", student);
    host().innerHTML = `<div class="studio-heading"><div><span class="eyebrow">54 lessons · 216 new foundation tasks · 12 core skills</span><h2 class="section-title">${student ? "Fluency practice" : "Practice Studio"}</h2><p class="section-sub">${student ? "Build the skills for your next lesson." : "Choose a lesson. Print a ready-to-use packet, launch practice, or run a partner activity."}</p></div>${!student ? `<div class="studio-actions"><a class="btn" href="${e(DATA.pdfPath || "output/pdf/index.html")}">Download unit PDFs</a><a class="btn" href="https://eduwonderlab.com/curriculum/">Curriculum Hub ↗</a></div>` : ""}</div>
    <div class="studio-controls"><div><label for="studio-lesson">Lesson · district sequence</label><select id="studio-lesson">${DATA.units.map((u) => `<optgroup label="Unit ${u.number} · ${e(u.title)}">${u.lessons.map((x) => `<option value="${x.id}" ${x.id === lessonId ? "selected" : ""}>${x.id} · ${e(x.title)}</option>`).join("")}</optgroup>`).join("")}</select></div><div><label for="studio-level">Practice set</label><select id="studio-level">${Object.entries(
      levels,
    )
      .map(([k, v]) => `<option value="${k}" ${k === level ? "selected" : ""}>${v}</option>`)
      .join("")}</select></div></div>
    ${
      !student
        ? `<div class="studio-modes" role="group" aria-label="Resource type">${Object.entries(modes)
            .map(([k, v]) => button("mode", v, `data-mode="${k}" aria-pressed="${mode === k}"`))
            .join("")}</div>`
        : ""
    }
    <div class="studio-context"><b>${e(l.id)} · ${e(l.title)}</b><span>Prepares for ${e(l.standard.code)} · Prerequisite skills span earlier grades.</span>${!student ? `<div class="studio-actions">${button("copy", "Copy this resource link")}${button("student", "Copy student practice link")}${button("preview-student", "Preview student view")}${button("guide", "Teaching notes")}</div>` : ""}</div>
    <div id="studio-content">${content(l)}</div><p id="studio-status" role="status" class="studio-status"></p>
    <dialog id="studio-key" aria-label="Teacher answer key"><div class="studio-actions">${button("print-key", "Print this key")}${button("close-key", "Close key")}</div><div id="studio-key-body"></div></dialog>`;
  }
  function printMarkup(markup) {
    const target = document.getElementById("studio-print");
    target.innerHTML = markup;
    document.body.classList.add("print-studio");
    window.print();
    // Keep markup until afterprint; browsers finish asynchronously.
  }
  function currentSheet(key = false) {
    const l = byId[lessonId];
    return mode === "activity"
      ? activity(l, key)
      : mode === "spine"
        ? drillSheet(
            DATA.spine.find((s) => s.rank === spineRank),
            key,
          )
        : worksheet(l, key);
  }
  function feedback(i, message, revealed, done) {
    const a = session.get(`${lessonId}-${level}`)[i];
    a.message = message;
    a.revealed = revealed;
    a.done = done;
    const form = host().querySelector(`form[data-item="${i}"]`);
    form.querySelector(".practice-feedback").textContent = message;
    form.querySelector(".worked-solution").hidden = !revealed;
    form.querySelector('[data-studio="solution"]').setAttribute("aria-expanded", String(revealed));
    document.getElementById("practice-progress").textContent =
      `${session.get(`${lessonId}-${level}`).filter((x) => x.done).length} of ${problems(byId[lessonId]).length} tasks checked or reviewed`;
  }
  async function copyLink(isStudent) {
    const status = document.getElementById("studio-status");
    if (location.protocol === "file:") {
      status.textContent =
        "This copy is on your computer. Share index.html itself, or use the hosted link after the integration is published. Preview student view works locally.";
      return;
    }
    const url = new URL(
      isStudent && DATA.studentPath ? DATA.studentPath : location.href,
      location.href,
    );
    url.search = "";
    url.hash = hash();
    if (isStudent) {
      url.searchParams.set("student", "1");
      const p = new URLSearchParams(url.hash.slice(1));
      p.set("mode", "practice");
      url.hash = p.toString();
    }
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = "Link copied. Student responses are not included.";
    } catch {
      status.replaceChildren();
      const label = document.createElement("label");
      label.textContent = "Copy this link:";
      const input = document.createElement("input");
      input.value = url.href;
      input.readOnly = true;
      label.append(input);
      status.append(label);
      input.select();
    }
  }
  document.addEventListener("click", (event) => {
    const b = event.target.closest("[data-studio]");
    if (!b) return;
    const act = b.dataset.studio;
    const l = byId[lessonId];
    if (act === "mode") {
      mode = b.dataset.mode;
      update();
      host().querySelector(`[data-mode="${mode}"]`).focus();
    } else if (act === "print") printMarkup(currentSheet());
    else if (act === "unit-pack")
      printMarkup(
        lessons
          .filter((x) => x.unitNumber === l.unitNumber)
          .map((x) => worksheet(x))
          .join(""),
      );
    else if (act === "unit-keys")
      printMarkup(
        lessons
          .filter((x) => x.unitNumber === l.unitNumber)
          .map((x) => worksheet(x, true))
          .join(""),
      );
    else if (act === "all-drill-keys")
      printMarkup(DATA.spine.map((s) => drillSheet(s, true)).join(""));
    else if (act === "all-drills") printMarkup(DATA.spine.map((s) => drillSheet(s)).join(""));
    else if (act === "key") {
      document.getElementById("studio-key-body").innerHTML = currentSheet(true);
      document.getElementById("studio-key").showModal();
    } else if (act === "close-key") document.getElementById("studio-key").close();
    else if (act === "print-key") {
      const markup = currentSheet(true);
      document.getElementById("studio-key").close();
      printMarkup(markup);
    } else if (act === "copy" || act === "student") copyLink(act === "student");
    else if (act === "preview-student") {
      const url = new URL(DATA.studentPath || location.href, location.href);
      url.searchParams.set("student", "1");
      url.hash = hash();
      window.open(url.href, "_blank", "noopener");
    } else if (act === "guide") location.hash = `view=lessons&lesson=${lessonId}`;
    else if (act === "retry") {
      session.delete(`${lessonId}-${level}`);
      render();
      document.getElementById("response-0").focus();
    } else if (act === "solution") {
      const i = Number(b.dataset.item),
        a = session.get(`${lessonId}-${level}`)[i];
      feedback(
        i,
        "Compare each step, then explain one correction or strategy.",
        !a.revealed,
        a.done,
      );
    } else if (act === "reviewed") {
      const i = Number(b.dataset.item);
      feedback(i, "Reviewed. Explain the strategy in your own words before moving on.", true, true);
    }
  });
  document.addEventListener("change", (event) => {
    const id = event.target.id;
    if (id === "studio-lesson") {
      lessonId = event.target.value;
      update();
      document.getElementById(id).focus();
    } else if (id === "studio-level") {
      level = event.target.value;
      update();
      document.getElementById(id).focus();
    } else if (id === "studio-drill") {
      spineRank = Number(event.target.value);
      update();
      document.getElementById(id).focus();
    }
  });
  document.addEventListener("input", (event) => {
    const form = event.target.closest(".practice-task");
    if (!form) return;
    const i = Number(form.dataset.item),
      a = session.get(`${lessonId}-${level}`)[i];
    a.text = event.target.value;
    if (a.checked || a.done) {
      a.checked = false;
      feedback(i, "Answer changed. Check or review it again.", false, false);
    }
  });
  document.addEventListener("submit", (event) => {
    const form = event.target.closest(".practice-task");
    if (!form) return;
    event.preventDefault();
    const i = Number(form.dataset.item),
      p = problems(byId[lessonId])[i],
      a = session.get(`${lessonId}-${level}`)[i];
    a.text = form.querySelector("textarea").value;
    a.checked = true;
    if (!a.text.trim()) {
      feedback(i, "Try an answer first, or open the worked solution for help.", false, false);
      form.querySelector("textarea").focus();
      return;
    }
    if (p.mode === "number") {
      const actual = value(a.text),
        expected = value(p.answer);
      if (!Number.isFinite(actual)) {
        feedback(
          i,
          "Enter only a number, decimal, fraction (such as 3/4), or percent (such as 75%). Put units and explanations on your paper.",
          false,
          false,
        );
        return;
      }
      const correct = Math.abs(actual - expected) < 1e-9;
      feedback(
        i,
        correct
          ? "Correct. Explain how you know."
          : "Not yet. Recheck the operation and place value. You can try again or open the worked solution.",
        correct,
        correct,
      );
    } else
      feedback(
        i,
        "Compare your reasoning with this solution. Equivalent wording and methods are welcome; this response is not automatically graded.",
        true,
        false,
      );
  });
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("print-studio");
    document.getElementById("studio-print").innerHTML = "";
  });
  return {
    print() {
      printMarkup(currentSheet());
    },
    render() {
      route();
      render();
    },
    hash,
    open(id) {
      if (byId[id]) lessonId = id;
      mode = "worksheet";
      history.replaceState(null, "", hash());
    },
    isStudent: () => student,
    parseNumber: value,
  };
})();
