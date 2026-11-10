// "See an Example": a small, accurate preview shown on a curated activity card. Pure markup from the activity's own
// `preview` record in data.js, so every page (start, explore, Site Guide, lesson) shows the same words.
import { html } from "../util.js";

/** A closed, single-level disclosure: the task, a sample response, and what students do next. */
export function previewHTML(a, { label = "See an Example" } = {}) {
  const p = a.preview;
  if (!p) return "";
  const source = p.sampleSource === "site" ? "Model student from the site" : "Sample work written for this guide";
  return html`<details class="in-preview">
    <summary>${label}<span class="visually-hidden">: ${a.name}</span></summary>
    <dl>
      <dt>The task</dt><dd>${p.task}</dd>
      <dt>${source}</dt><dd class="in-sample">${p.sample}</dd>
      <dt>What students do next</dt><dd>${p.next}</dd>
    </dl>
  </details>`;
}
