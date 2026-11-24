/* Forecast Engine — Overview: the class at a glance and the next moves. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { S, M, esc, fmt, store } = NFE;
  NFE.views = NFE.views || {};

  const STATUS_ICON = { on: "check", watch: "alert", support: "cross", none: "dot" };
  let sortBy = "risk";

  /** Facts about the class that several cards share. */
  function facts() {
    const s = store.state;
    const grid = NFE.grid();
    const cells = grid.rows
      .flatMap((r) => r.cells.map((c) => ({ student: r.student, standard: c.standard, f: c.f })))
      .filter((c) => c.f.n);
    const studentMeans = s.students
      .map((st) => {
        const ys = s.standards.flatMap((sd) => NFE.series(st.id, sd.code).map((x) => x.pct));
        return ys.length ? S.mean(ys) : null;
      })
      .filter((v) => v !== null);
    const avg = S.meanCI(studentMeans, s.settings.level);
    const on = cells.filter((c) => c.f.status === "on").length;
    const supportStudents = new Set(
      cells.filter((c) => c.f.status === "support").map((c) => c.student.id),
    );
    return {
      grid,
      cells,
      avg,
      on,
      supportStudents,
      groups: M.supportGroups(grid, s.settings.target),
    };
  }

  function headline(f) {
    const s = store.state;
    if (!f.cells.length) return "";
    const need = f.supportStudents.size;
    const total = s.students.length;
    const pct = Math.round((100 * f.on) / f.cells.length);
    return `<strong>${fmt.plural(need, "student")}</strong> of ${total} ${need === 1 ? "needs" : "need"} support on at least one standard, and <strong>${pct}%</strong> of all student-standard pairs are on track for ${s.settings.target}%. The class average is <strong>${fmt.pct(f.avg.mean)}</strong>${f.avg.n > 1 ? ` (likely ${Math.round(f.avg.lo)}–${Math.round(f.avg.hi)}%)` : ""}.`;
  }

  function kpis(f) {
    const cov = NFE.coverage();
    const bt = NFE.backtest();
    const best = bt.methods[bt.best];
    const tile = (label, value, note, kind = "") =>
      `<article class="kpi ${kind}"><h3>${label}</h3><div class="kpi-val">${value}</div><p>${note}</p></article>`;
    return [
      tile(
        "Class average",
        fmt.pct(f.avg.mean),
        f.avg.n > 1
          ? `Likely ${Math.round(f.avg.lo)}–${Math.round(f.avg.hi)}% (${Math.round(store.state.settings.level * 100)}% range)`
          : "Add more students for a range",
      ),
      tile(
        "On track",
        `${f.on}<small>/${f.cells.length}</small>`,
        `Student-standard pairs with a good chance of ${store.state.settings.target}%`,
        "on",
      ),
      tile(
        "Need support",
        f.supportStudents.size,
        "Students with at least one pair below a 40% chance",
        f.supportStudents.size ? "support" : "on",
      ),
      tile(
        "Forecast trust",
        bt.cases ? fmt.pct(best.coverage * 100) : "–",
        bt.cases
          ? `Our ${Math.round(store.state.settings.level * 100)}% ranges caught ${fmt.pct(best.coverage * 100)} of real next scores (${bt.cases} tested). Records with 3+ scores: ${cov.pct}%.`
          : "Needs 3+ scores per student to test itself",
        "info",
      ),
    ].join("");
  }

  function heatmap(f) {
    const s = store.state;
    const rows = f.grid.rows.slice();
    const risk = (r) =>
      r.cells.filter((c) => c.f.status === "support").length * 1000 -
      Math.min(...r.cells.filter((c) => c.f.n).map((c) => c.f.proj), 100);
    if (sortBy === "risk") rows.sort((a, b) => risk(b) - risk(a));
    else rows.sort((a, b) => a.student.name.localeCompare(b.student.name));
    const head = s.standards
      .map((sd) => `<th scope="col" title="${esc(sd.desc)}">${esc(sd.code)}</th>`)
      .join("");
    const body = rows
      .map(
        (r) =>
          `<tr><th scope="row">${esc(r.student.name)}</th>${r.cells
            .map((c) =>
              c.f.n
                ? `<td><button type="button" class="cell ${c.f.status}" data-student="${esc(r.student.id)}" data-code="${esc(c.standard.code)}" aria-label="${esc(`${r.student.name}, ${c.standard.code}: ${c.f.statusLabel}, forecast ${Math.round(c.f.proj)} percent, ${Math.round(c.f.prob * 100)} percent chance of ${s.settings.target}`)}">${NFE.icon(STATUS_ICON[c.f.status], 14)}<span>${Math.round(c.f.proj)}%</span></button></td>`
                : '<td><span class="cell none">No data</span></td>',
            )
            .join("")}</tr>`,
      )
      .join("");
    return `<div class="table-wrap"><table class="heat"><caption class="sr">Forecast by student and standard. Press a cell to open it.</caption><thead><tr><th scope="col">Student</th>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p class="legend-row">${NFE.badge("on", "On track")} ${NFE.badge("watch", "Watch")} ${NFE.badge("support", "Needs support")} <span class="muted">Each cell shows the forecast for the next check. Status is the chance of reaching ${s.settings.target}%.</span></p>`;
  }

  function moves(f) {
    const s = store.state;
    const out = [];
    const g = f.groups[0];
    if (g)
      out.push({
        icon: "groups",
        title: `Reteach ${g.standard.code} with ${fmt.plural(g.kids.length, "student")}`,
        body: `${g.standard.desc}. Their forecasts average ${Math.round(S.mean(g.kids.map((k) => k.f.proj)))}%.`,
        action: ["Plan small groups", "groups", {}],
      });
    const slipping = f.cells.filter((c) => c.f.trend === "down" && c.f.n >= 3);
    if (slipping.length) {
      const c = slipping.sort((a, b) => a.f.slope - b.f.slope)[0];
      out.push({
        icon: "down",
        title: `${fmt.plural(new Set(slipping.map((x) => x.student.id)).size, "student")} slipping`,
        body: `${c.student.name} is losing about ${Math.abs(c.f.slope)} points a week on ${c.standard.code}.`,
        action: [
          "Open the forecast",
          "forecast",
          { student: c.student.id, standard: c.standard.code },
        ],
      });
    }
    const out2 = NFE.outliers();
    if (out2.length)
      out.push({
        icon: "alert",
        title: `${fmt.plural(out2.length, "score")} look unusual`,
        body: "They sit far from the student's own pattern. A typo is possible.",
        action: ["Check them", "analysis", { tab: "checks" }],
      });
    const cov = NFE.coverage();
    if (cov.pct < 70)
      out.push({
        icon: "data",
        title: "Some records are thin",
        body: `Only ${cov.pct}% of student-standard pairs have 3 or more scores, so some forecasts are rough.`,
        action: ["Add scores", "data", { tab: "add" }],
      });
    const stars = s.students.filter(
      (st) =>
        f.grid.rows
          .find((r) => r.student.id === st.id)
          .cells.filter((c) => c.f.n)
          .every((c) => c.f.prob >= 0.9) &&
        f.grid.rows.find((r) => r.student.id === st.id).cells.some((c) => c.f.n),
    );
    if (stars.length)
      out.push({
        icon: "up",
        title: `${fmt.plural(stars.length, "student")} ready for a stretch`,
        body: `${stars
          .slice(0, 3)
          .map((x) => x.name)
          .join(", ")}${stars.length > 3 ? " and more" : ""} look strong everywhere.`,
        action: null,
      });
    return out.slice(0, 4);
  }

  NFE.views.overview = {
    mount(root) {
      const s = store.state;
      if (!s.evidence.length) {
        root.innerHTML = NFE.empty(
          "Start with your class",
          "Add a few scores and this page will show who is on track, who needs support and what to do next.",
          `<div class="btn-row"><button class="btn primary" data-go="data">Add scores</button><button class="btn" data-act="sample">Try the sample class</button></div>`,
        );
        return;
      }
      const f = facts();
      root.innerHTML = `
        ${s.sample ? `<div class="banner" role="status"><div><strong>You are looking at a sample class.</strong> Everything below is practice data. Importing or adding your own scores replaces it.</div><button class="btn small" data-act="fresh">Start with my class</button></div>` : ""}
        ${NFE.say(headline(f))}
        <section class="kpis" aria-label="Class summary">${kpis(f)}</section>
        <section class="card" aria-labelledby="h-heat">
          <div class="card-head"><h2 id="h-heat">Who needs what</h2><div class="seg-mini" role="group" aria-label="Sort students"><button class="chip ${sortBy === "risk" ? "on" : ""}" data-sort="risk" type="button" aria-pressed="${sortBy === "risk"}">Most support first</button><button class="chip ${sortBy === "name" ? "on" : ""}" data-sort="name" type="button" aria-pressed="${sortBy === "name"}">A–Z</button></div></div>
          ${heatmap(f)}
          ${NFE.how("Each cell is one student on one standard. We look at their scores so far, work out where the next score is likely to land, and measure how likely it is to reach your target. Green means a good chance, amber means it could go either way, red means it is unlikely without help.", "Press any cell to see the chart and the steps behind it.", "These are planning estimates, not labels. A short record or a bad day can move a forecast.")}
        </section>
        <div class="grid g2">
          <section class="card" aria-labelledby="h-moves"><h2 id="h-moves">Your next moves</h2>${
            moves(f)
              .map(
                (m) =>
                  `<div class="move">${NFE.icon(m.icon, 20)}<div><h3>${esc(m.title)}</h3><p>${esc(m.body)}</p>${m.action ? `<button class="btn small" type="button" data-go="${m.action[1]}" data-sel='${esc(JSON.stringify(m.action[2]))}'>${esc(m.action[0])}</button>` : ""}</div></div>`,
              )
              .join("") || '<p class="muted">Nothing urgent. Keep collecting scores.</p>'
          }</section>
          <section class="card" aria-labelledby="h-std"><h2 id="h-std">Standards at a glance</h2>
            ${NFE.charts.ciBars({ rows: NFE.summaries().map((x) => ({ label: x.standard.code, mean: x.mean, lo: x.lo, hi: x.hi, n: x.n })), target: s.settings.target, width: 470, label: `Average score on each standard with its likely range. The target is ${s.settings.target} percent.` })}
            ${NFE.how("Each bar is the class average on a standard. The whisker shows where the true average probably sits, since a class is only a sample of what students know. A short whisker means we can trust the average more.", "Look for bars whose whisker sits clearly left of the target line: those standards are weak for the whole class, not just a few students.")}
          </section>
        </div>`;
      NFE.charts.wireTips(root);
    },
    update() {},
    wire(root) {
      root.addEventListener("click", (e) => {
        const cell = e.target.closest(".cell[data-student]");
        if (cell)
          return NFE.go("forecast", { student: cell.dataset.student, standard: cell.dataset.code });
        const sort = e.target.closest("[data-sort]");
        if (sort) {
          sortBy = sort.dataset.sort;
          NFE.views.overview.mount(root);
        }
      });
    },
  };
})();
