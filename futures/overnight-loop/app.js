/* The Overnight Loop — recommendation engine + UI.
 * Reads window.OvernightData (synthetic). No network calls, no PII. */
(function () {
  const { STRANDS, MISCONCEPTIONS, STUDENTS } = window.OvernightData;
  const sevName = { 3: "Priority", 2: "Needs support", 1: "Emerging" };

  // ---- analysis ----
  function topMissesFor(student) {
    return Object.entries(student.scores)
      .filter(([, sev]) => sev >= 1)
      .sort((a, b) => b[1] - a[1])
      .map(([id, sev]) => ({ id, sev, ...MISCONCEPTIONS[id] }));
  }
  function classHotspots() {
    const agg = {};
    for (const s of STUDENTS)
      for (const [id, sev] of Object.entries(s.scores)) {
        agg[id] = agg[id] || {
          id,
          total: 0,
          needSupport: 0,
          ...MISCONCEPTIONS[id],
        };
        agg[id].total += sev;
        if (sev >= 2) agg[id].needSupport++;
      }
    return Object.values(agg).sort((a, b) => b.total - a.total);
  }
  // Small groups: cluster students by their #1 priority misconception.
  function suggestGroups() {
    const groups = {};
    for (const s of STUDENTS) {
      const top = topMissesFor(s)[0];
      if (!top || top.sev < 2) continue;
      (groups[top.id] = groups[top.id] || []).push(s.id);
    }
    return Object.entries(groups)
      .map(([id, members]) => ({ id, members, ...MISCONCEPTIONS[id] }))
      .filter((g) => g.members.length >= 2)
      .sort((a, b) => b.members.length - a.members.length);
  }

  // ---- rendering ----
  const el = (h) => {
    const t = document.createElement("template");
    t.innerHTML = h.trim();
    return t.content.firstChild;
  };
  const esc = (s) =>
    String(s).replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
    );

  function bundleHTML(m) {
    return `
      <div class="bundle"><span class="kind">Graphic-novel page</span>
        <p><strong>${esc(m.novel.title)}</strong> — ${esc(m.novel.page)}</p></div>
      <div class="bundle"><span class="kind">60-second mini-game</span>
        <p><strong>${esc(m.game.title)}</strong> — ${esc(m.game.desc)}</p></div>
      <div class="bundle"><span class="kind">Targeted practice — ${esc(m.practice.focus)}</span>
        <ul>${m.practice.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`;
  }

  function renderBriefing() {
    const hot = classHotspots();
    const groups = suggestGroups();
    const flagged = STUDENTS.filter((s) =>
      Object.values(s.scores).some((v) => v >= 2),
    ).length;
    const max = hot[0] ? hot[0].total : 1;
    const view = el(`<div class="grid"></div>`);

    const summary = el(
      `<div class="card"><h2>Morning Briefing — ${esc(window.OvernightData?.generated || "")}</h2></div>`,
    );
    summary.insertAdjacentHTML(
      "beforeend",
      `<p class="muted">${STUDENTS.length} students analyzed · <strong>${flagged}</strong> need targeted support today across <strong>${hot.length}</strong> misconception areas.</p>`,
    );
    const hotCard = el(`<div class="card"><h2>Class hot-spots</h2></div>`);
    hot.slice(0, 6).forEach((h) =>
      hotCard.insertAdjacentHTML(
        "beforeend",
        `
        <div class="hotbar">
          <span class="label">${esc(STRANDS[h.strand].code)} · ${esc(h.label)}</span>
        </div>
        <div class="hotbar">
          <div class="meter"><span style="width:${Math.round((h.total / max) * 100)}%"></span></div>
          <span class="count">${h.needSupport} need support</span>
        </div>`,
      ),
    );

    const groupCard = el(
      `<div class="card group-card"><h2>Suggested small groups (tomorrow)</h2></div>`,
    );
    if (!groups.length)
      groupCard.insertAdjacentHTML(
        "beforeend",
        `<p class="muted">No clusters of 2+ — handle individually.</p>`,
      );
    groups.forEach((g) =>
      groupCard.insertAdjacentHTML(
        "beforeend",
        `
        <h3>${esc(g.label)} <span class="muted">(${g.members.length})</span></h3>
        <p class="muted">${g.members.join(", ")}</p>
        ${bundleHTML(g)}`,
      ),
    );

    view.append(summary, hotCard, groupCard);
    return view;
  }

  function renderStudents() {
    const wrap = el(
      `<div class="card"><h2>Per-student recommendations</h2><p class="muted">Tap a student to see their auto-built remediation bundle.</p></div>`,
    );
    STUDENTS.forEach((s) => {
      const top = topMissesFor(s)[0];
      const row = el(`<div class="student-row">
        <span class="nm">${esc(s.id)}</span>
        <span>${top ? `<span class="pill sev-${top.sev}">${sevName[top.sev]}</span> ${esc(top.label)}` : `<span class="muted">On track ✓</span>`}</span>
      </div>`);
      row.addEventListener("click", () => openStudent(s));
      wrap.appendChild(row);
    });
    return wrap;
  }

  function openStudent(s) {
    const misses = topMissesFor(s);
    const dlg = document.getElementById("dlg");
    document.getElementById("dlg-title").textContent =
      s.id + " — tonight's auto-built plan";
    const body = document.getElementById("dlg-body");
    body.innerHTML = misses.length
      ? misses
          .map(
            (
              m,
            ) => `<div class="card"><h3><span class="pill sev-${m.sev}">${sevName[m.sev]}</span> ${esc(m.label)}</h3>
          <p class="muted">${esc(m.detail)}</p>${bundleHTML(m)}</div>`,
          )
          .join("")
      : `<p>On track — enrichment only. Offer a Level 2 stretch task.</p>`;
    dlg.showModal();
  }

  function mount(name) {
    const root = document.getElementById("view");
    root.innerHTML = "";
    document
      .querySelectorAll(".tabs button")
      .forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === name));
    root.appendChild(name === "students" ? renderStudents() : renderBriefing());
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll(".tabs button")
      .forEach((b) => b.addEventListener("click", () => mount(b.dataset.tab)));
    document
      .getElementById("print")
      .addEventListener("click", () => window.print());
    document
      .getElementById("dlg-close")
      .addEventListener("click", () => document.getElementById("dlg").close());
    mount("briefing");
  });
})();
