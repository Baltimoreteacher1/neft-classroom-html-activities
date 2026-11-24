/* Forecast Engine — Reports: printable class report, student one-pagers, exports. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { S, M, esc, fmt, store, csvCell } = NFE;
  NFE.views = NFE.views || {};

  const R = { kind: "class", student: "", tags: false };
  const METHOD = {
    smart: "Smart pick (best of the three on this class)",
    average: "Average of all scores",
    recent: "Recent work counts more",
    trend: "Trend line",
  };

  function settingsLine() {
    const s = store.state.settings;
    const g = NFE.grid();
    const used =
      s.method === "smart"
        ? `${METHOD.smart}, today using ${NFE.METHOD_NAMES[g.opt.smartMethod || "recent"].toLowerCase()}`
        : METHOD[s.method];
    return `Target ${s.target}% · ${Math.round(s.level * 100)}% ranges · ${s.horizon === 0 ? "next check" : `${s.horizon} days ahead`} · ${used}`;
  }

  function classReport() {
    const s = store.state;
    const g = NFE.grid();
    const cov = NFE.coverage();
    const bt = NFE.backtest();
    const groups = M.supportGroups(g, s.settings.target);
    const sums = NFE.summaries();
    const std = sums
      .map(
        (x) =>
          `<tr><th scope="row">${esc(x.standard.code)}<br><span class="muted small-note">${esc(x.standard.desc)}</span></th><td>${x.n}</td><td>${x.n ? `${Math.round(x.mean)}%${x.n > 1 ? ` <span class="muted">(${Math.round(x.lo)}–${Math.round(x.hi)})</span>` : ""}` : "–"}</td><td>${x.n ? `${Math.round(x.atTarget.p * 100)}%` : "–"}</td></tr>`,
      )
      .join("");
    const grid = g.rows
      .map(
        (r) =>
          `<tr><th scope="row">${esc(r.student.name)}</th>${r.cells.map((c) => `<td>${c.f.n ? `${Math.round(c.f.proj)}% <span class="muted small-note">${esc(c.f.statusLabel)}</span>` : "–"}</td>`).join("")}</tr>`,
      )
      .join("");
    const gl = groups.length
      ? groups
          .map(
            (x) =>
              `<li><strong>${esc(x.standard.code)}</strong> (${esc(x.standard.desc)}): ${esc(x.kids.map((k) => `${k.student.name} ${Math.round(k.f.proj)}%`).join(", "))}</li>`,
          )
          .join("")
      : "<li>No student is forecast below the target.</li>";
    const issues = NFE.importers.validate(s).length;
    return `<article class="sheet" id="report-sheet">
      <header><h2>Forecast report · ${esc(s.class.name)}</h2><p class="muted">${esc(s.class.grade)} · Generated ${esc(new Date().toLocaleDateString())} · ${s.students.length} students · ${s.evidence.length} scores</p><p class="muted small-note">${esc(settingsLine())}</p></header>
      ${s.sample ? '<p class="banner-line">Sample class: these numbers are practice data.</p>' : ""}
      <h3>Standards</h3><div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Standard</th><th scope="col">Students</th><th scope="col">Average (likely range)</th><th scope="col">At target</th></tr></thead><tbody>${std}</tbody></table></div>
      <h3>Forecast for the next check</h3><div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Student</th>${s.standards.map((x) => `<th scope="col">${esc(x.code)}</th>`).join("")}</tr></thead><tbody>${grid}</tbody></table></div>
      <h3>Support groups</h3><ul class="plainlist">${gl}</ul>
      <h3>How much to trust this</h3><p>${cov.pct}% of student-standard pairs have 3 or more scores. ${bt.cases ? `When we hid each student's newest score, the forecast missed by ${fmt.num(bt.methods[bt.best].mae, 1)} points on average and the stated range caught the real score ${fmt.pct(bt.methods[bt.best].coverage * 100)} of the time.` : "There are not yet enough scores to test the forecast."} ${issues ? `${fmt.plural(issues, "data issue")} should be reviewed.` : "No data issues found."}</p>
      <h3>How to read this</h3><p class="muted">A forecast is the score a student is likely to earn at the next check, with a range for how far it could reasonably move. Status compares the chance of reaching the target: <em>On track</em> 75% or more, <em>Watch</em> 40–75%, <em>Needs support</em> under 40%. Forecasts estimate needs, not labels. Use professional judgment. Data stays in this browser.</p>
    </article>`;
  }

  function studentSheet(st) {
    const s = store.state;
    const rows = s.standards
      .map((sd) => ({ sd, f: NFE.cell(st.id, sd.code), series: NFE.series(st.id, sd.code) }))
      .filter((r) => r.f && r.f.n);
    const strong = rows.filter((r) => r.f.status === "on");
    const next = rows.filter((r) => r.f.status !== "on").sort((a, b) => a.f.prob - b.f.prob);
    const tag = R.tags && st.tags ? ` · ${esc(st.tags)}` : "";
    return `<article class="sheet student-sheet">
      <header><h2>${esc(st.name)}</h2><p class="muted">${esc(s.class.name)}${tag} · ${esc(new Date().toLocaleDateString())}</p></header>
      <div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Standard</th><th scope="col">Scores so far</th><th scope="col">Next check</th><th scope="col">Chance of ${s.settings.target}%</th></tr></thead><tbody>${rows
        .map(
          (r) =>
            `<tr><th scope="row">${esc(r.sd.code)}<br><span class="muted small-note">${esc(r.sd.desc)}</span></th><td>${NFE.charts.spark(
              r.series.map((x) => x.pct),
              s.settings.target,
            )}<span class="muted small-note">${r.series.map((x) => Math.round(x.pct)).join(", ")}</span></td><td>${Math.round(r.f.proj)}% <span class="muted small-note">(${Math.round(r.f.lo)}–${Math.round(r.f.hi)})</span></td><td>${NFE.statusBadge(r.f)} ${fmt.chance(r.f.prob)}</td></tr>`,
        )
        .join("")}</tbody></table></div>
      <h3>Going well</h3><p>${strong.length ? strong.map((r) => `${esc(r.sd.code)} (${esc(r.sd.desc)})`).join(", ") : "Keep building. Strengths will show as scores come in."}</p>
      <h3>Next steps</h3><ul class="plainlist">${next.length ? next.map((r) => `<li><strong>${esc(r.sd.code)}</strong> ${esc(r.sd.desc)}: ${r.f.trend === "down" ? "scores are slipping, so revisit the core idea with a worked example" : r.f.trend === "up" ? "improving, so keep practice going and check again soon" : "work with a visual model and a short exit check"}.</li>`).join("") : "<li>On track everywhere. Offer a stretch task.</li>"}</ul>
      <p class="muted small-note">Forecasts are planning estimates based on ${s.evidence.filter((e) => e.student === st.id).length} scores. They describe likely next results, not a student's ability.</p>
    </article>`;
  }

  function body() {
    const s = store.state;
    if (R.kind === "class") return classReport();
    if (R.kind === "all") return s.students.map(studentSheet).join("");
    const st = store.student(R.student) || s.students[0];
    return studentSheet(st);
  }

  function exportForecastCsv() {
    const g = NFE.grid();
    const head = "student,standard,scores,forecast,low,high,chance_of_target,status";
    const lines = g.rows.flatMap((r) =>
      r.cells
        .filter((c) => c.f.n)
        .map((c) =>
          [
            r.student.name,
            c.standard.code,
            c.f.n,
            c.f.proj,
            c.f.lo,
            c.f.hi,
            Math.round(c.f.prob * 100),
            c.f.statusLabel,
          ]
            .map(csvCell)
            .join(","),
        ),
    );
    NFE.download("forecast-grid.csv", `${head}\n${lines.join("\n")}`, "text/csv");
  }

  NFE.views.reports = {
    mount(root) {
      const s = store.state;
      if (!s.evidence.length) {
        root.innerHTML = NFE.empty(
          "No scores yet",
          "Reports need scores to summarise.",
          '<button class="btn primary" data-go="data">Add scores</button>',
        );
        return;
      }
      const arrival = NFE.takeArrive();
      if (arrival?.student && s.students.some((x) => x.id === arrival.student)) {
        R.kind = "student";
        R.student = arrival.student;
      }
      if (!R.student) R.student = s.students[0].id;
      root.innerHTML = `<section class="card noprint"><div class="ctl-grid">
          ${NFE.segmented({
            path: "r.kind",
            label: "Report",
            value: R.kind,
            options: [
              ["class", "Class report"],
              ["student", "One student"],
              ["all", "Every student"],
            ],
          })}
          ${R.kind === "student" ? NFE.select({ id: "r-student", label: "Student", value: R.student, options: s.students.map((x) => [x.id, x.name]) }) : ""}
          <label class="check"><input type="checkbox" id="r-tags"${R.tags ? " checked" : ""}> Include support tags (off by default)</label></div>
        <div class="btn-row"><button class="btn primary" type="button" data-act="print-report">${NFE.icon("print", 16)}Print or save as PDF</button><button class="btn" type="button" data-act="csv-evidence">${NFE.icon("download", 16)}Scores (CSV)</button><button class="btn" type="button" data-act="csv-forecast">${NFE.icon("download", 16)}Forecasts (CSV)</button><button class="btn" type="button" data-act="json-backup">${NFE.icon("download", 16)}Full backup (JSON)</button></div>
        <p class="muted small-note">Reports and exports contain student data. Print or save them somewhere safe.</p></section>
        <div id="report-body" class="sheets">${body()}</div>`;
    },
    update() {},
    wire(root) {
      root.addEventListener("input", (e) => {
        if (e.target.dataset.set === "r.kind") {
          R.kind = e.target.value;
          NFE.views.reports.mount(root);
        }
        if (e.target.id === "r-tags") {
          R.tags = e.target.checked;
          NFE.$("#report-body", root).innerHTML = body();
        }
      });
      root.addEventListener("change", (e) => {
        if (e.target.id === "r-student") {
          R.student = e.target.value;
          NFE.$("#report-body", root).innerHTML = body();
        }
      });
      root.addEventListener("click", (e) => {
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (act === "print-report") {
          document.body.dataset.print = "report";
          window.print();
        }
        if (act === "csv-forecast") exportForecastCsv();
        if (act === "csv-evidence") {
          const tag = (id) => store.student(id)?.tags || "";
          const head = `studentId,standard,score,maxScore,percent,date,assessment${R.tags ? ",tags" : ""}`;
          const lines = store.state.evidence.map((r) =>
            [
              r.student,
              r.standard,
              r.score,
              r.max,
              r.pct,
              r.date,
              r.assessment,
              ...(R.tags ? [tag(r.student)] : []),
            ]
              .map(csvCell)
              .join(","),
          );
          NFE.download("forecast-evidence.csv", `${head}\n${lines.join("\n")}`, "text/csv");
        }
        if (act === "json-backup") {
          const snap = JSON.parse(JSON.stringify(store.state));
          if (!R.tags) snap.students.forEach((x) => delete x.tags);
          NFE.download("forecast-backup.json", JSON.stringify(snap, null, 2), "application/json");
        }
      });
      window.addEventListener("afterprint", () => {
        delete document.body.dataset.print;
      });
    },
  };
  void S;
})();
