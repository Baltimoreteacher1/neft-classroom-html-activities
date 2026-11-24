/* Forecast Engine — background worker.
 * Runs scenario simulations off the main thread using the same model the page
 * uses (stats.js and model.js), so there is one implementation of the math. */
importScripts("./stats.js", "./model.js");

self.onmessage = (event) => {
  const { id, state, jobs, opts } = event.data;
  try {
    self.postMessage({ id, results: jobs.map((job) => self.NFEModel.simulate(state, job, opts)) });
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
