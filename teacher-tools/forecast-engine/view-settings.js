/* Forecast Engine — Settings: profiles, backup, self-test, privacy and help. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { S, M, esc, store } = NFE;
  NFE.views = NFE.views || {};

  const GLOSSARY = [
    ["Forecast", "Where a student's next score is likely to land, based on the scores so far."],
    [
      "Range",
      "How far the next score could reasonably move. A 90% range should catch the real score about 9 times in 10.",
    ],
    ["Chance of target", "How likely the next score is to reach the target you set."],
    [
      "Trend",
      "How fast scores are going up or down each week. Only called a trend when the pattern is clear enough to trust.",
    ],
    [
      "Average, middle score",
      "The average adds everything up. The middle score (median) is the one in the centre. They differ when a few scores are very high or low.",
    ],
    ["Typical swing", "How far scores usually bounce away from the average (standard deviation)."],
    [
      "Likely range of an average",
      "A class is only a sample of what students know. This range shows where the true average probably sits (a confidence interval).",
    ],
    [
      "Effect",
      "How big a gap is, in a unit that does not depend on the test (Hedges' g). Under 0.2 is negligible, 0.5 medium, 0.8 large.",
    ],
    [
      "Could be chance",
      "The gap is small enough that a different group of similar students could easily show the opposite.",
    ],
    [
      "Correlation (r)",
      "How closely two sets of scores move together, from −1 to +1. It does not show that one causes the other.",
    ],
    [
      "Backtest",
      "Hiding each student's newest score and checking how well each method guesses it.",
    ],
    [
      "Simulation",
      "Replaying the next few weeks thousands of times with realistic ups and downs, then counting the outcomes.",
    ],
  ];
  const glossaryHtml = () =>
    `<dl class="glossary">${GLOSSARY.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl>`;
  NFE.showHelp = () =>
    NFE.notice(
      "Plain-language guide",
      `<p>Everything here describes likely outcomes, not certainties. Forecasts help you plan, they never label a student.</p>${glossaryHtml()}`,
    );

  function selfTest() {
    const near = (a, b, t) => Math.abs(a - b) <= t;
    const rows = [60, 70, 80].map((y, i) => ({
      id: `t${i}`,
      student: "T",
      standard: "X",
      pct: y,
      date: `2026-01-${String(1 + i * 7).padStart(2, "0")}`,
      assessment: "t",
    }));
    const f = M.forecastSeries(M.indexEvidence(rows).get("T", "X"), { method: "average", borrow: 0 });
    const tiny = { students: [{ id: "T", name: "T", tags: "" }], standards: [{ code: "X", desc: "" }], evidence: rows };
    const job = { standard: "X", target: 70, weeks: 2, gain: 0, scope: "all", participation: 1, goal: 80, seed: 1, sims: 200, cap: 5, minutesPerSession: 15, sessionsPerWeek: 1 };
    return [
      ["Normal quantile (97.5%) is 1.96", near(S.normPpf(0.975), 1.95996, 1e-4)],
      ["t critical value (95%, 5 df) is 2.571", near(S.tPpf(0.975, 5), 2.5706, 1e-3)],
      ["A 60, 70, 80 student forecasts 70%", f.proj === 70 && f.lo < 70 && f.hi > 70],
      ["Empty record is handled safely", M.forecastSeries([], {}).n === 0],
      ["Same seed gives the same simulation", M.simulate(tiny, job).base.mean === M.simulate(tiny, job).base.mean],
      ["Saved data loads back", Boolean(store.state && store.state.settings && Array.isArray(store.state.evidence))],
    ];
  }

  NFE.views.settings = {
    mount(root) {
      const s = store.state;
      const profiles = store.profiles();
      root.innerHTML = `
        <div class="grid g2">
          <section class="card"><h2>Forecast defaults</h2><p class="muted">Target, method, range and the other forecast settings live on the Forecast tab. This puts them all back.</p><button class="btn" type="button" data-act="reset-settings">Reset forecast settings</button></section>
          <section class="card"><h2>Help</h2><p class="muted">What every term means, in plain words.</p><button class="btn" type="button" data-act="help">${NFE.icon("help", 16)}Open the plain-language guide</button></section>
        </div>
        <section class="card"><h2>Saved classes</h2><p class="muted">Keep each class as its own profile in this browser. Loading a profile replaces what is on screen, so save first.</p>
          <form id="profile-form" class="inline-form"><label class="field"><span class="ctl-name">Profile name</span><input id="profile-name" value="${esc(s.profile)}" required></label><button class="btn primary" type="submit">Save profile</button></form>
          ${profiles.length ? `<ul class="plainlist profiles">${profiles.map((p) => `<li><strong>${esc(p)}</strong><span><button class="btn small" type="button" data-load-profile="${esc(p)}">Load</button> <button class="btn small" type="button" data-del-profile="${esc(p)}" aria-label="Delete profile ${esc(p)}">${NFE.icon("trash", 14)}</button></span></li>`).join("")}</ul>` : '<p class="muted">No saved profiles yet.</p>'}</section>
        <section class="card"><h2>Backup and data</h2>
          <div class="btn-row"><button class="btn" type="button" data-act="sample">Load the sample class</button><label class="btn" tabindex="0">${NFE.icon("upload", 16)}Restore a backup<input id="restore" type="file" accept=".json,application/json" hidden></label><button class="btn danger" type="button" data-act="clear">Clear all data</button><button class="btn" type="button" data-act="selftest">Run a self-test</button></div>
          <div id="selftest" role="status" aria-live="polite"></div></section>
        <section class="card privacy"><h2>Privacy</h2><p>Everything stays in this browser, unencrypted, and anyone using this device profile could see it. Nothing is sent anywhere. Prefer student IDs or first names with an initial. On a shared device, clear the data when you finish.</p><button class="btn danger" type="button" data-act="clear">Clear all data now</button></section>
        <details class="how"><summary>${NFE.icon("help", 16)}Diagnostics for troubleshooting</summary><div class="how-body"><pre class="diag">${esc(JSON.stringify({ students: s.students.length, standards: s.standards.length, evidence: s.evidence.length, settings: s.settings, saved: s.updatedAt, worker: typeof Worker !== "undefined" }, null, 2))}</pre></div></details>`;
    },
    update() {},
    wire(root) {
      root.addEventListener("submit", (e) => {
        if (e.target.id !== "profile-form") return;
        e.preventDefault();
        const name = NFE.$("#profile-name", root).value.trim();
        if (!name) return;
        const go = () => {
          store.saveProfile(name);
          NFE.toast(`Saved as “${name}”.`);
        };
        if (store.profiles().includes(name))
          NFE.confirm(
            `A profile named “${name}” already exists. Replace it with what is on screen?`,
            { ok: "Replace" },
          ).then((ok) => ok && go());
        else go();
      });
      root.addEventListener("click", (e) => {
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (act === "help") NFE.showHelp();
        if (act === "reset-settings") {
          store.resetSettings();
          NFE.toast("Forecast settings reset.");
        }
        if (act === "selftest") {
          NFE.$("#selftest", root).innerHTML = selfTest()
            .map(
              ([n, ok]) => `<p>${NFE.badge(ok ? "ok" : "bad", ok ? "Pass" : "Fail")} ${esc(n)}</p>`,
            )
            .join("");
        }
        const load = e.target.closest("[data-load-profile]")?.dataset.loadProfile;
        if (load) {
          NFE.confirm(`Load “${load}”? What is on screen now will be replaced. You can undo.`, {
            ok: "Load",
          }).then((ok) => {
            if (ok && store.loadProfile(load))
              NFE.toast(`Loaded “${load}”.`, { action: "Undo", onAction: () => store.undo() });
          });
        }
        const del = e.target.closest("[data-del-profile]")?.dataset.delProfile;
        if (del) {
          NFE.confirm(`Delete the saved profile “${del}”? This cannot be undone.`, {
            ok: "Delete profile",
            danger: true,
          }).then((ok) => {
            if (ok) {
              store.deleteProfile(del);
              NFE.views.settings.mount(root);
            }
          });
        }
      });
      root.addEventListener("change", (e) => {
        if (e.target.id !== "restore" || !e.target.files[0]) return;
        e.target.files[0].text().then((text) => {
          try {
            const data = JSON.parse(text);
            if (!data || !Array.isArray(data.students) || !Array.isArray(data.evidence))
              throw new Error("not a backup");
            NFE.confirm(
              "Restore this backup? What is on screen now will be replaced. You can undo.",
              { ok: "Restore" },
            ).then((ok) => {
              if (!ok) return;
              store.undoSnapshot = JSON.stringify(store.state);
              store.state = NFE.store.normalizeState(data);
              store.changed();
              NFE.toast("Backup restored.", { action: "Undo", onAction: () => store.undo() });
            });
          } catch (_) {
            NFE.notice(
              "That file is not a Forecast backup",
              "<p>Choose a file you saved with Full backup (JSON) on the Reports tab.</p>",
            );
          }
        });
      });
    },
  };
})();
