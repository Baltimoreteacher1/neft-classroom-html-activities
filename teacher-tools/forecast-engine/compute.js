/* Forecast Engine — shared calculations for the views.
 * Memoised by data revision and settings so switching tabs or dragging a
 * slider never recomputes what has not changed. Simulations run in a worker
 * and fall back to the main thread if workers are unavailable. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { M, store } = NFE;

  const memo = new Map();
  function cached(name, deps, fn) {
    const key = `${store.rev}|${JSON.stringify(deps)}`;
    const hit = memo.get(name);
    if (hit && hit.key === key) return hit.value;
    const value = fn();
    memo.set(name, { key, value });
    return value;
  }

  /** Forecast options for the current settings. */
  NFE.opts = (over = {}) => {
    const s = store.state.settings;
    return { method: s.method, halfLife: s.halfLife, level: s.level, horizon: s.horizon, borrow: s.borrow, target: s.target, ...over };
  };
  NFE.grid = () => cached("grid", NFE.opts(), () => M.classGrid(store.state, NFE.opts()));
  NFE.backtest = () => cached("bt", NFE.opts(), () => M.backtest(store.state, NFE.opts()));
  NFE.outliers = () => cached("out", 0, () => M.outliers(store.state));
  NFE.coverage = () => cached("cov", 0, () => M.coverage(store.state));
  NFE.summaries = () => cached("sum", NFE.opts(), () => M.standardSummaries(store.state, NFE.opts()));

  /** Forecast for one student and standard with the current settings. */
  NFE.cell = (studentId, code) => {
    const g = NFE.grid();
    const row = g.rows.find((r) => r.student.id === studentId);
    return row ? row.cells.find((c) => c.standard.code === code)?.f : null;
  };
  /** Scores for one student and standard, oldest first. */
  NFE.series = (studentId, code) => NFE.grid().ix.get(studentId, code);

  /** The forecast cone: the range at several steps from now to the horizon. */
  NFE.cone = (series, code) => {
    if (!series.length) return [];
    const steps = 6;
    const base = NFE.opts({ smartMethod: NFE.grid().opt.smartMethod });
    const prior = NFE.grid().priors[code];
    return Array.from({ length: steps + 1 }, (_, i) => {
      const horizon = Math.round((base.horizon * i) / steps);
      const g = M.forecastSeries(series, { ...base, horizon }, prior);
      return { t: series[series.length - 1].t + horizon, proj: g.proj, lo: g.lo, hi: g.hi };
    });
  };

  /* Worker */
  let worker = null;
  let workerBroken = false;
  let nextId = 1;
  const waiting = new Map();
  function boot() {
    if (worker || workerBroken) return worker;
    try {
      worker = new Worker("./forecast.worker.js");
      worker.onmessage = (e) => {
        const w = waiting.get(e.data.id);
        if (!w) return;
        waiting.delete(e.data.id);
        if (e.data.error) w.reject(new Error(e.data.error));
        else w.resolve(e.data.results);
      };
      worker.onerror = () => {
        workerBroken = true;
        worker = null;
        waiting.forEach((w) => w.reject(new Error("worker")));
        waiting.clear();
      };
    } catch (_) {
      workerBroken = true;
    }
    return worker;
  }
  /** Run scenario jobs; resolves to one result per job. */
  NFE.simulate = (jobs) => {
    const state = store.state;
    const opts = NFE.opts();
    const sync = () => jobs.map((job) => M.simulate(state, job, opts));
    const w = boot();
    if (!w) return Promise.resolve(sync());
    return new Promise((resolve, reject) => {
      const id = nextId++;
      waiting.set(id, { resolve, reject });
      w.postMessage({ id, state: JSON.parse(JSON.stringify(state)), jobs, opts });
    }).catch(() => sync());
  };
})();
