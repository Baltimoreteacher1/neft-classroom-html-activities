/* Forecast Engine — Forecast: one student, one standard, fully explained,
 * plus a test of how trustworthy the method is on this class. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { M, esc, fmt, store } = NFE;
  NFE.views = NFE.views || {};

  const METHOD_NAMES = {
    smart: "Smart pick",
    average: "Average of all scores",
    recent: "Recent work counts more",
    trend: "Trend line",
  };
  let gridMode = "chance";

  /** The cell to show first: whoever is least likely to reach the target. */
  function defaultSelection() {
    const cells = NFE.grid()
      .rows.flatMap((r) =>
        r.cells.map((c) => ({ id: r.student.id, code: c.standard.code, f: c.f })),
      )
      .filter((c) => c.f.n);
    const worst = cells.sort((a, b) => a.f.prob - b.f.prob)[0];
    return worst
      ? { student: worst.id, standard: worst.code }
      : { student: store.state.students[0]?.id, standard: store.state.standards[0]?.code };
  }
  function selection() {
    const s = store.state;
    const sel = NFE.sel || {};
    const ok =
      s.students.some((x) => x.id === sel.student) &&
      s.standards.some((x) => x.code === sel.standard);
    if (!ok) NFE.sel = defaultSelection();
    return NFE.sel;
  }

  function controls() {
    const s = store.state.settings;
    const bt = NFE.backtest();
    return `
      ${NFE.slider({ path: "settings.target", label: "Target score", min: 40, max: 95, value: s.target, unit: "%", help: "The score you call ready. Chances and colours are measured against it." })}
      ${NFE.slider({ path: "settings.horizon", label: "Look ahead", min: 0, max: 84, step: 7, value: s.horizon, unit: " days", help: "How far past the latest score to forecast. 7 days is about the next weekly check." })}
      ${NFE.segmented({
        path: "settings.method",
        label: "How to forecast",
        value: s.method,
        options: [
          ["smart", "Smart pick"],
          ["average", "Average"],
          ["recent", "Recent counts more"],
          ["trend", "Trend line"],
        ],
        help: `<strong>Smart pick</strong> tests every method on your own class and uses the closest one${bt.cases ? ` (right now: ${esc(METHOD_NAMES[bt.best])})` : ""}.`,
      })}
      ${NFE.slider({ path: "settings.halfLife", label: "How fast old scores fade", min: 7, max: 90, step: 1, value: s.halfLife, unit: " days", help: "Used by “recent counts more”. A score loses half its weight after this many days." })}
      ${NFE.segmented({
        path: "settings.level",
        label: "How sure the range should be",
        value: s.level,
        options: [
          [0.8, "80%"],
          [0.9, "90%"],
          [0.95, "95%"],
        ],
        help: "A higher level gives a wider range that is wrong less often.",
      })}
      ${NFE.segmented({
        path: "settings.borrow",
        label: "Lean on the class when scores are few",
        value: s.borrow,
        options: [
          [0, "Off"],
          [0.5, "A little"],
          [1, "More"],
        ],
        help: "With one or two scores, nudge the forecast toward the class so one bad day does not decide.",
      })}`;
  }

  function sentence(f, st, sd, series) {
    const s = store.state.settings;
    const trend =
      f.trend === "up"
        ? `, and scores are rising about ${f.slope} points a week`
        : f.trend === "down"
          ? `, and scores are falling about ${Math.abs(f.slope)} points a week`
          : "";
    const avg = Math.round(series.reduce((a, r) => a + r.pct, 0) / series.length);
    return `${esc(st.name)} has averaged <strong>${avg}%</strong> on ${esc(sd.code)} over ${fmt.plural(f.n, "score")}${trend}. For the check ${s.horizon === 0 ? "next" : `${s.horizon} days out`}, we expect about <strong>${Math.round(f.proj)}%</strong>, most likely between ${Math.round(f.lo)}% and ${Math.round(f.hi)}%. That gives a <strong>${fmt.chance(f.prob)} chance</strong> of reaching ${s.target}%.`;
  }

  function resultPanel(f, st, sd, series) {
    const s = store.state.settings;
    const used =
      f.method === "recent"
        ? `Recent work counts more (half-life ${s.halfLife} days)`
        : METHOD_NAMES[f.method];
    return `<h2>Forecast</h2>
      <div class="big">${Math.round(f.proj)}<small>%</small></div>
      <p class="range">Most likely <strong>${Math.round(f.lo)}–${Math.round(f.hi)}%</strong> <span class="muted">(${Math.round(s.level * 100)}% range)</span></p>
      <div class="chips">${NFE.statusBadge(f)}${NFE.trendChip(f)}${NFE.badge("info", `${f.conf} confidence`)}</div>
      <div class="meter" role="img" aria-label="${fmt.chance(f.prob)} chance of reaching ${s.target} percent"><div class="meter-fill ${f.status}" style="width:${Math.round(f.prob * 100)}%"></div></div>
      <p class="meter-label"><strong>${fmt.chance(f.prob)}</strong> chance of reaching ${s.target}%</p>
      <p class="muted small-note">Method: ${esc(used)}${s.method === "smart" ? " (picked for you)" : ""}.</p>
      <div class="btn-row"><button class="btn small" type="button" data-go="reports" data-sel='${esc(JSON.stringify({ student: st.id }))}'>${NFE.icon("print", 16)}Student one-pager</button></div>`;
  }

  function backtestCard() {
    const bt = NFE.backtest();
    const level = Math.round(store.state.settings.level * 100);
    if (!bt.cases)
      return `<p class="muted">To test the forecasts, at least one student needs 3 or more scores on a standard. Add more scores and this card will check itself.</p>`;
    const rows = [...bt.ranked, "last"]
      .map((k) => {
        const m = bt.methods[k];
        const label = k === "last" ? "Just repeat the last score" : METHOD_NAMES[k];
        return `<tr class="${k === bt.best ? "best" : ""}"><th scope="row">${esc(label)}${k === bt.best ? ` ${NFE.badge("on", "Closest")}` : ""}</th><td>${fmt.num(m.mae, 1)} points</td><td>${m.coverage === undefined ? "–" : fmt.pct(m.coverage * 100)}</td></tr>`;
      })
      .join("");
    const best = bt.methods[bt.best];
    const better = bt.methods.last.mae - best.mae;
    return `${NFE.say(`We hid each student's newest score (<strong>${bt.cases}</strong> tests) and asked every method to guess it. <strong>${esc(METHOD_NAMES[bt.best])}</strong> missed by ${fmt.num(best.mae, 1)} points on average${better > 0.05 ? `, ${fmt.num(better, 1)} points closer than just repeating the last score` : ", about the same as repeating the last score"}. Our ${level}% ranges caught the real score <strong>${fmt.pct(best.coverage * 100)}</strong> of the time${Math.abs(best.coverage - store.state.settings.level) <= 0.1 ? ", right where they should be." : best.coverage < store.state.settings.level ? ", a little low, so treat ranges as slightly optimistic." : ", a little high, so the ranges are on the cautious side."}`)}
      <div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Method</th><th scope="col">Typical miss</th><th scope="col">Range caught the score</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${bt.enough ? "" : `<p class="muted">Only ${bt.cases} tests so far. Treat this comparison as a rough guide until more scores come in.</p>`}
      ${NFE.how("A forecast is only useful if it would have been right before. So we pretend we do not know each student's latest score, forecast it from the earlier ones, and compare. A smaller “typical miss” is better. “Range caught the score” checks the honesty of the ranges: a 90% range should catch about 90% of real scores.", "Switch the method above and watch how the Smart pick changes the colours on the Overview.", "Small classes give noisy tests. One unusual student can swing the comparison.")}`;
  }

  function classGrid() {
    const s = store.state;
    const g = NFE.grid();
    const head = s.standards
      .map((sd) => `<th scope="col" title="${esc(sd.desc)}">${esc(sd.code)}</th>`)
      .join("");
    const body = g.rows
      .map(
        (r) =>
          `<tr><th scope="row">${esc(r.student.name)}</th>${r.cells
            .map((c) =>
              c.f.n
                ? `<td><button type="button" class="cell ${c.f.status}" data-student="${esc(r.student.id)}" data-code="${esc(c.standard.code)}">${gridMode === "chance" ? fmt.chance(c.f.prob) : `${Math.round(c.f.proj)}%`}<small>${gridMode === "chance" ? `${Math.round(c.f.proj)}%` : `${Math.round(c.f.lo)}–${Math.round(c.f.hi)}`}</small></button></td>`
                : '<td><span class="cell none">–</span></td>',
            )
            .join("")}</tr>`,
      )
      .join("");
    return `<div class="table-wrap"><table class="heat"><caption class="sr">Class forecast grid</caption><thead><tr><th scope="col">Student</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function dataTable(series) {
    return `<details class="how"><summary>${NFE.icon("data", 16)}Show the numbers behind the chart</summary><div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Date</th><th scope="col">Assessment</th><th scope="col">Score</th></tr></thead><tbody>${series.map((r) => `<tr><td>${esc(r.date)}</td><td>${esc(r.assessment)}</td><td>${Math.round(r.pct)}%</td></tr>`).join("")}</tbody></table></div></details>`;
  }

  NFE.views.forecast = {
    mount(root) {
      const s = store.state;
      if (!s.evidence.length) {
        root.innerHTML = NFE.empty(
          "No scores yet",
          "Add or import a few scores and the forecast appears here.",
          '<button class="btn primary" data-go="data">Add scores</button>',
        );
        return;
      }
      const sel = selection();
      const idx = s.students.findIndex((x) => x.id === sel.student);
      root.innerHTML = `
        <section class="card picker" aria-label="Choose a student and standard">
          <button class="btn icon-btn" type="button" data-step="-1" aria-label="Previous student">${NFE.icon("up", 18).replace("<svg", '<svg style="transform:rotate(-90deg)"')}</button>
          ${NFE.select({ id: "fc-student", label: "Student", value: sel.student, options: s.students.map((x) => [x.id, x.name]) })}
          <button class="btn icon-btn" type="button" data-step="1" aria-label="Next student">${NFE.icon("up", 18).replace("<svg", '<svg style="transform:rotate(90deg)"')}</button>
          ${NFE.select({ id: "fc-standard", label: "Standard", value: sel.standard, options: s.standards.map((x) => [x.code, `${x.code} · ${x.desc}`]) })}
          <span class="muted pos">${idx + 1} of ${s.students.length}</span>
        </section>
        <div class="fc-layout">
          <section class="card" aria-labelledby="fc-title"><div id="fc-top"></div><div id="fc-chart"></div><div id="fc-table"></div></section>
          <aside class="card result" id="fc-result" aria-live="polite"></aside>
        </div>
        <section class="card" aria-labelledby="h-ctl"><h2 id="h-ctl">Adjust the forecast</h2><div class="ctl-grid" id="fc-controls">${controls()}</div>
          ${NFE.how("Every control changes the forecast right away, so you can see how much an assumption matters. If a small change flips a student from green to red, the evidence is thin and professional judgment matters more than the number.", "Slide the target up and down to see which students sit close to the line. Move the fade slider to see how much a student's last score drives the forecast.")}
        </section>
        <section class="card" aria-labelledby="h-steps"><h2 id="h-steps">How we got this number</h2><ol class="steps" id="fc-steps"></ol></section>
        <section class="card" aria-labelledby="h-bt"><h2 id="h-bt">Can you trust these forecasts?</h2><div id="fc-bt"></div></section>
        <section class="card" aria-labelledby="h-grid"><div class="card-head"><h2 id="h-grid">Whole class</h2><div class="seg-mini" role="group" aria-label="Grid shows"><button class="chip" data-grid="chance" type="button">Chance of target</button><button class="chip" data-grid="proj" type="button">Forecast score</button></div></div><div id="fc-grid"></div></section>`;
      NFE.charts.wireTips(root);
      NFE.views.forecast.update(root);
    },
    update(root) {
      if (!NFE.$("#fc-chart", root)) return;
      const s = store.state;
      const sel = selection();
      const st = store.student(sel.student);
      const sd = s.standards.find((x) => x.code === sel.standard);
      const f = NFE.cell(sel.student, sel.standard);
      const series = NFE.series(sel.student, sel.standard);
      NFE.$("#fc-top", root).innerHTML =
        `<h2 id="fc-title">${esc(st.name)} <span class="muted">· ${esc(sd.code)}</span></h2><p class="muted">${esc(sd.desc)}</p>`;
      NFE.$$(".chip[data-grid]", root).forEach((b) => {
        b.classList.toggle("on", b.dataset.grid === gridMode);
        b.setAttribute("aria-pressed", String(b.dataset.grid === gridMode));
      });
      NFE.$("#fc-grid", root).innerHTML = classGrid();
      NFE.$("#fc-bt", root).innerHTML = backtestCard();
      if (!f.n) {
        NFE.$("#fc-chart", root).innerHTML = NFE.empty(
          "No scores for this pair",
          `${st.name} has no scores on ${sd.code} yet.`,
          '<button class="btn" data-go="data">Add a score</button>',
        );
        NFE.$("#fc-result", root).innerHTML = "";
        NFE.$("#fc-steps", root).innerHTML = "";
        NFE.$("#fc-table", root).innerHTML = "";
        return;
      }
      const dated = series.every((r) => Number.isFinite(r.day));
      const cone = NFE.cone(series, sd.code);
      NFE.$("#fc-chart", root).innerHTML =
        `${NFE.say(sentence(f, st, sd, series))}<p class="legend-row"><span class="key key-score"></span>Scores <span class="key key-cone"></span>${Math.round(s.settings.level * 100)}% forecast range <span class="key key-target"></span>Target ${s.settings.target}%</p>${NFE.charts.scoreChart({ rows: series, cone, f, target: s.settings.target, dated, level: s.settings.level })}`;
      NFE.$("#fc-table", root).innerHTML = dataTable(series);
      NFE.$("#fc-result", root).innerHTML = resultPanel(f, st, sd, series);
      NFE.$("#fc-steps", root).innerHTML = f.steps.map((t) => `<li>${esc(t)}</li>`).join("");
      NFE.$$("[data-set='settings.halfLife']", root).forEach((el) => {
        el.closest(".ctl").classList.toggle(
          "dim",
          s.settings.method === "average" || s.settings.method === "trend",
        );
      });
    },
    wire(root) {
      NFE.bind(
        root,
        () => store.state,
        () => {
          store.touch();
          NFE.views.forecast.update(root);
        },
      );
      const go = (patch) => {
        NFE.sel = { ...selection(), ...patch };
        NFE.views.forecast.mount(root);
      };
      root.addEventListener("change", (e) => {
        if (e.target.id === "fc-student") go({ student: e.target.value });
        if (e.target.id === "fc-standard") go({ standard: e.target.value });
      });
      root.addEventListener("click", (e) => {
        const step = e.target.closest("[data-step]");
        if (step) {
          const list = store.state.students;
          const i = list.findIndex((x) => x.id === selection().student);
          go({ student: list[(i + Number(step.dataset.step) + list.length) % list.length].id });
        }
        const cell = e.target.closest(".cell[data-student]");
        if (cell) {
          go({ student: cell.dataset.student, standard: cell.dataset.code });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        const g = e.target.closest("[data-grid]");
        if (g) {
          gridMode = g.dataset.grid;
          NFE.views.forecast.update(root);
        }
      });
    },
  };
  NFE.METHOD_NAMES = METHOD_NAMES;
  void M;
})();
