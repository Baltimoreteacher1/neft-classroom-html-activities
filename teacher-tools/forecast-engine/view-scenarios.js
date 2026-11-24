/* Forecast Engine — Scenarios: "what if I do this?" answered by simulation,
 * with the teacher time it would cost. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { esc, fmt, store } = NFE;
  NFE.views = NFE.views || {};

  const PRESETS = [
    ["None", 0],
    ["Small", 3],
    ["Typical", 6],
    ["Large", 10],
  ];
  let last = null;
  let timer = 0;
  let runId = 0;

  const params = (over = {}) => {
    const s = store.state;
    return {
      standard: s.scn.standard,
      target: s.settings.target,
      weeks: s.scn.weeks,
      gain: s.scn.gain,
      scope: s.scn.scope,
      participation: s.scn.participation / 100,
      goal: s.scn.goal,
      seed: s.scn.seed,
      sims: 2000,
      cap: s.settings.groupCap,
      minutesPerSession: s.settings.minutes,
      sessionsPerWeek: s.settings.sessions,
      ...over,
    };
  };
  const hours = (m) => (m >= 120 ? `${fmt.num(m / 60, 1)} hours` : `${Math.round(m)} min`);
  const unit = () => (store.state.scn.standard === "all" ? "student-standard pair" : "student");

  function controls() {
    const s = store.state;
    return `
      <div class="ctl-group"><h3>The situation</h3>
        ${NFE.select({ id: "scn-standard", label: "Standard", set: "scn.standard", value: s.scn.standard, options: [["all", "All standards together"], ...s.standards.map((x) => [x.code, `${x.code} · ${x.desc}`])] })}
        ${NFE.slider({ path: "scn.weeks", label: "Weeks until the next big check", min: 1, max: 12, value: s.scn.weeks, unit: " weeks" })}
        ${NFE.slider({ path: "settings.target", label: "Target score", min: 40, max: 95, value: s.settings.target, unit: "%" })}
      </div>
      <div class="ctl-group"><h3>The plan</h3>
        <div class="ctl"><span class="ctl-name">Boost from support, in score points</span>
          <div class="presets" role="group" aria-label="Boost presets">${PRESETS.map(([n, v]) => `<button type="button" class="chip" data-preset="${v}">${n}${v ? ` +${v}` : ""}</button>`).join("")}</div>
          <label class="ctl-inline"><output data-out="scn.gain" data-unit=" points">${s.scn.gain} points</output><input type="range" aria-label="Boost in score points" data-set="scn.gain" min="0" max="25" step="1" value="${s.scn.gain}"></label>
          <span class="ctl-help">How many points better a supported student's next score is. These are not promises: pick a boost you honestly expect.</span></div>
        ${NFE.segmented({
          path: "scn.scope",
          label: "Who gets the support",
          value: s.scn.scope,
          options: [
            ["below", "Below target"],
            ["near", "Close to target"],
            ["all", "Everyone"],
          ],
          help: "“Close” means within 15 points under the target.",
        })}
        ${NFE.slider({ path: "scn.participation", label: "Share who really get it", min: 40, max: 100, step: 5, value: s.scn.participation, unit: "%", help: "Absences and missed sessions mean some students are not reached." })}
        ${NFE.slider({ path: "scn.goal", label: "My goal for the class", min: 40, max: 100, step: 5, value: s.scn.goal, unit: "%", help: "Share of the class at or above target you would call a win." })}
      </div>
      <div class="ctl-group"><h3>Your time</h3>
        ${NFE.slider({ path: "settings.groupCap", label: "Group size", min: 2, max: 10, value: s.settings.groupCap, unit: " students" })}
        ${NFE.slider({ path: "settings.minutes", label: "Minutes per session", min: 5, max: 60, step: 5, value: s.settings.minutes, unit: " min" })}
        ${NFE.slider({ path: "settings.sessions", label: "Sessions per week", min: 1, max: 5, value: s.settings.sessions, unit: " a week" })}
      </div>
      <div class="btn-row"><button class="btn" type="button" data-act="reroll">${NFE.icon("dice", 16)}Roll the dice again</button><span class="muted small-note">Run #${s.scn.seed}</span></div>`;
  }

  function tile(label, value, note, kind = "") {
    return `<article class="kpi ${kind}"><h3>${label}</h3><div class="kpi-val">${value}</div><p>${note}</p></article>`;
  }

  function results(r, half, strong) {
    const s = store.state;
    const u = unit();
    const many = (n) =>
      u === "student" ? (n === 1 ? "student" : "students") : n === 1 ? "pair" : "pairs";
    const t = s.settings.target;
    const w = s.scn.weeks;
    const tiles = [
      tile(
        "Class at target",
        `${Math.round(r.scen.mean)}<small>%</small>`,
        `${Math.round(r.base.mean)}% without a plan. Likely ${Math.round(r.scen.p10)}–${Math.round(r.scen.p90)}% with it.`,
        "on",
      ),
      tile(
        "Extra at target",
        `+${fmt.num(r.extra.mean, 1)}`,
        `${many(2)} that cross ${t}% because of the plan. Likely ${fmt.num(Math.max(0, r.extra.lo), 1)}–${fmt.num(r.extra.hi, 1)}.`,
      ),
      tile(
        `Chance of ${s.scn.goal}%`,
        `${fmt.chance(r.goalProb)}`,
        `Up from ${fmt.chance(r.baseGoalProb)} without a plan.`,
        "info",
      ),
      tile(
        "Your time",
        hours(r.minutes),
        Number.isFinite(r.minutesPerExtra)
          ? `About ${hours(r.minutesPerExtra)} for each extra ${u} at target.`
          : "No extra students expected at this setting.",
      ),
    ].join("");
    const who = r.students
      .filter((x) => x.targeted && x.p1 - x.p0 > 0.01)
      .slice(0, 8)
      .map(
        (x) =>
          `<tr><th scope="row">${esc(store.studentName(x.student.id))}${s.scn.standard === "all" ? ` <span class="muted">${esc(x.code)}</span>` : ""}</th><td>${fmt.chance(x.p0)}</td><td><div class="gain-bar" aria-hidden="true"><i style="width:${Math.round(x.p0 * 100)}%"></i><b style="width:${Math.round((x.p1 - x.p0) * 100)}%"></b></div></td><td><strong>${fmt.chance(x.p1)}</strong></td></tr>`,
      )
      .join("");
    const stress = [
      ["Works half as well", half],
      ["Works as planned", r],
      ["Works 1.5× as well", strong],
    ]
      .map(
        ([n, x]) =>
          `<tr><th scope="row">${n}</th><td>+${fmt.num(x.extra.mean, 1)}</td><td>${fmt.chance(x.goalProb)}</td></tr>`,
      )
      .join("");
    return `
      ${NFE.say(
        s.scn.gain === 0
          ? `Without extra support, the class is expected to land at about <strong>${Math.round(r.base.mean)}%</strong> at target in ${w} weeks (likely ${Math.round(r.base.p10)}–${Math.round(r.base.p90)}%). Pick a boost above to see what support could change.`
          : `Without a plan, about <strong>${Math.round(r.base.mean)}%</strong> of ${u === "student" ? "students" : "student-standard pairs"} reach ${t}% in ${w} weeks. Giving <strong>+${s.scn.gain} points</strong> to ${r.targeted} ${many(r.targeted)} lifts that to about <strong>${Math.round(r.scen.mean)}%</strong>, roughly <strong>${fmt.num(r.extra.mean, 1)} more ${many(2)}</strong>. The chance of reaching your ${s.scn.goal}% goal goes from ${fmt.chance(r.baseGoalProb)} to <strong>${fmt.chance(r.goalProb)}</strong>, for ${hours(r.minutes)} of your time.`,
      )}
      <section class="kpis compact" aria-label="Plan results">${tiles}</section>
      <section class="card" aria-labelledby="h-dist"><h2 id="h-dist">What the ${r.sims.toLocaleString()} trials looked like</h2>
        <p class="legend-row"><span class="key key-base"></span>Without a plan <span class="key key-scen"></span>With the plan <span class="key key-target"></span>Goal</p>
        ${NFE.charts.simHist({ base: r.base, scen: r.scen, goal: s.scn.goal, label: `How often the class reaches each percent at target, with and without the plan. Without: ${Math.round(r.base.mean)} percent on average. With: ${Math.round(r.scen.mean)} percent.` })}
        ${NFE.how(`We replayed the next ${w} weeks ${r.sims.toLocaleString()} times. Each time, every student's next score is drawn from their own forecast range, so strong students usually stay strong and uncertain ones swing. Then the plan adds its boost to the students who would get support. Both worlds use the very same dice rolls, so any difference you see comes from the plan, not luck.`, "Drag the boost to zero: the two sets of bars should match exactly. Raise it and watch the plan's bars slide right.", "The boost is your assumption. The stress test below shows what happens if you are too optimistic.")}
      </section>
      <div class="grid g32">
        <section class="card" aria-labelledby="h-who"><h2 id="h-who">Who gains the most</h2>${who ? `<div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Student</th><th scope="col">Before</th><th scope="col"><span class="sr">Change</span></th><th scope="col">After</th></tr></thead><tbody>${who}</tbody></table></div><p class="muted small-note">Chance of reaching ${t}%, before and after support.</p>` : '<p class="muted">Nobody is lifted at these settings. Raise the boost or widen who gets support.</p>'}</section>
        <section class="card" aria-labelledby="h-stress"><h2 id="h-stress">Stress test</h2>
          <div class="table-wrap"><table class="plain"><thead><tr><th scope="col">If the support…</th><th scope="col">Extra ${many(2)}</th><th scope="col">Chance of goal</th></tr></thead><tbody>${stress}</tbody></table></div>
          <p class="muted small-note">Support rarely works exactly as hoped. If the plan still looks worthwhile at half strength, it is a safe bet.</p></section>
      </div>
      <div class="btn-row"><button class="btn primary" type="button" data-act="save-plan">${NFE.icon("plus", 16)}Save this plan to compare</button></div>`;
  }

  function saved() {
    const list = store.state.scenarios;
    if (!list.length)
      return `<p class="muted">Save a plan, change the settings, save another, and they line up here so you can pick the best value for your time.</p>`;
    const valued = list.filter((p) => Number.isFinite(p.summary.per));
    const best = valued.length
      ? valued.reduce((a, b) => (a.summary.per < b.summary.per ? a : b)).id
      : null;
    const rows = list
      .map(
        (p) =>
          `<tr class="${p.id === best ? "best" : ""}"><th scope="row">${esc(p.name)}${p.id === best ? ` ${NFE.badge("on", "Best value")}` : ""}<br><span class="muted small-note">+${p.params.gain} pts · ${esc({ below: "below target", near: "close to target", all: "everyone" }[p.params.scope])} · ${p.params.weeks} wks · ${esc(p.params.standard === "all" ? "all standards" : p.params.standard)} · target ${p.params.target}%</span></th><td>${Math.round(p.summary.scen)}%</td><td>+${fmt.num(p.summary.extra, 1)}</td><td>${fmt.chance(p.summary.goalProb)}</td><td>${hours(p.summary.minutes)}</td><td>${Number.isFinite(p.summary.per) ? hours(p.summary.per) : "–"}</td><td><button class="btn small" type="button" data-del-plan="${esc(p.id)}" aria-label="Delete ${esc(p.name)}">${NFE.icon("trash", 14)}</button></td></tr>`,
      )
      .join("");
    return `<div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Plan</th><th scope="col">Class at target</th><th scope="col">Extra</th><th scope="col">Chance of goal</th><th scope="col">Your time</th><th scope="col">Time per extra</th><th scope="col"><span class="sr">Delete</span></th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted small-note">Best value is the least teacher time for each extra student at target. Saved numbers are a snapshot: reopen a plan's settings to run it on today's data.</p>`;
  }

  function run(root) {
    const id = ++runId;
    const out = NFE.$("#scn-out", root);
    if (!out) return;
    out.setAttribute("aria-busy", "true");
    const p = params();
    NFE.simulate([
      p,
      params({ gain: p.gain * 0.5, sims: 800 }),
      params({ gain: p.gain * 1.5, sims: 800 }),
    ]).then(([main, half, strong]) => {
      if (id !== runId) return;
      out.removeAttribute("aria-busy");
      if (!main.cells) {
        out.innerHTML = NFE.empty(
          "No scores for this standard",
          "Pick another standard or add scores first.",
        );
        last = null;
        return;
      }
      last = main;
      out.innerHTML = results(main, half, strong);
      NFE.charts.wireTips(out);
    });
  }

  NFE.views.scenarios = {
    mount(root) {
      const s = store.state;
      if (!s.evidence.length) {
        root.innerHTML = NFE.empty(
          "No scores yet",
          "Scenarios need a few scores to forecast from.",
          '<button class="btn primary" data-go="data">Add scores</button>',
        );
        return;
      }
      if (s.scn.standard !== "all" && !s.standards.some((x) => x.code === s.scn.standard))
        s.scn.standard = "all";
      root.innerHTML = `
        <div class="scn-layout">
          <aside class="card scn-controls" aria-label="Plan settings">${controls()}</aside>
          <div class="scn-main"><div id="scn-out" aria-live="polite"><p class="muted">Running the numbers…</p></div>
            <section class="card" aria-labelledby="h-saved"><h2 id="h-saved">Compare saved plans</h2><div id="scn-saved">${saved()}</div></section>
            <section class="card" aria-labelledby="h-how"><h2 id="h-how">How this works</h2><ol class="steps"><li>We forecast each student's next score and how uncertain it is, using the same forecast as the Forecast tab.</li><li>We roll the dice thousands of times: each student's score is drawn from their own range.</li><li>In the “with a plan” world, students who get support add your boost. How well support works also varies from trial to trial.</li><li>We count how many students reach the target in each trial and show you the spread, not just the average.</li></ol></section>
          </div>
        </div>`;
      run(root);
    },
    update(root) {
      clearTimeout(timer);
      timer = setTimeout(() => run(root), 220);
    },
    wire(root) {
      NFE.bind(
        root,
        () => store.state,
        () => {
          store.touch();
          NFE.views.scenarios.update(root);
        },
      );
      root.addEventListener("click", (e) => {
        const preset = e.target.closest("[data-preset]");
        if (preset) {
          store.state.scn.gain = Number(preset.dataset.preset);
          const input = NFE.$("[data-set='scn.gain']", root);
          input.value = String(store.state.scn.gain);
          NFE.$("[data-out='scn.gain']", root).textContent = `${store.state.scn.gain} points`;
          store.touch();
          NFE.views.scenarios.update(root);
        }
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (act === "reroll") {
          store.state.scn.seed = 1 + Math.floor(Math.random() * 99999);
          NFE.views.scenarios.mount(root);
          store.touch();
        }
        if (act === "save-plan" && last) {
          if (store.state.scenarios.length >= 4)
            return NFE.toast("You can keep four plans. Delete one to save another.");
          const p = params();
          const name = `Plan ${"ABCD"[store.state.scenarios.length]}`;
          store.state.scenarios.push({
            id: `p${Date.now()}`,
            name,
            params: {
              standard: p.standard,
              weeks: p.weeks,
              gain: p.gain,
              scope: p.scope,
              target: p.target,
            },
            summary: {
              scen: last.scen.mean,
              extra: last.extra.mean,
              goalProb: last.goalProb,
              minutes: last.minutes,
              per: last.minutesPerExtra,
            },
          });
          store.touch();
          NFE.$("#scn-saved", root).innerHTML = saved();
          NFE.toast(`${name} saved.`);
        }
        const del = e.target.closest("[data-del-plan]");
        if (del) {
          store.state.scenarios = store.state.scenarios.filter((x) => x.id !== del.dataset.delPlan);
          store.touch();
          NFE.$("#scn-saved", root).innerHTML = saved();
        }
      });
    },
  };
})();
