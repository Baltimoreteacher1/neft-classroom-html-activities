// Group 2 investigation cards — the Challenge pathway's reasoning tasks, one per habit
// of mind: judge a conjecture (always / sometimes / never), find the error in someone
// else's work, and compare two strategies. Content is authored per lesson
// (data/small-group-investigations, docs/specs/small-group-investigations-v1.md) and
// reaches the studio as `launch.practice.investigate`.
//
// Each card follows Think → Discuss → Compare → Explain: the student commits first,
// writes a reason with sentence frames, then compares with the authored answer.
// Cards use the same `is-right` / `is-shown` classes as practice cards so the task
// stepper, the rail and the evidence summary treat them uniformly.

import { label, line } from "./small-group-build-section.js";
import { el, esc } from "./small-group-ui.js";

const VERDICT = {
  always: ["Always true", "Siempre es verdadero"],
  sometimes: ["Sometimes true", "A veces es verdadero"],
  never: ["Never true", "Nunca es verdadero"],
};

const tx = (en, es) => line(en, es);

function frameChips(frames, framesEs, area, onChange) {
  const row = el("div", "sgp-fix-frames");
  frames.forEach((f, i) => {
    const chip = el("button", "btn ghost sgp-fix-frame", tx(f, framesEs?.[i]));
    chip.type = "button";
    chip.addEventListener("click", () => {
      area.value = area.value ? `${area.value} ${f}` : f;
      onChange?.(area.value);
      area.focus();
    });
    row.appendChild(chip);
  });
  return row;
}

function reasonBox(id, prompt, store, key, frames, framesEs) {
  const wrap = el("div", "sgb-explain");
  wrap.innerHTML = `<label class="sgb-input-label" for="${id}">✍️ ${prompt}</label>`;
  const area = /** @type {HTMLTextAreaElement} */ (el("textarea", "sgb-why-box"));
  area.id = id;
  area.rows = 3;
  area.value = store?.get(key) || "";
  area.addEventListener("input", () => store?.set(key, area.value));
  wrap.append(
    area,
    frameChips(frames, framesEs, area, (v) => store?.set(key, v)),
  );
  return { wrap, area };
}

function card(title, kind) {
  const c = el("article", "sgb-ex sgp-card sgi-card");
  c.dataset.mode = "investigate";
  c.dataset.kind = kind;
  c.appendChild(el("h3", "sgb-title", esc(title)));
  return c;
}

const mark = (c, ok) => c.classList.add(ok ? "is-right" : "is-shown");

/** Always / Sometimes / Never, with a written reason, then the authored evidence. */
function conjectureCard(d, { store, key }) {
  const c = card("Always, sometimes or never?", "conjecture");
  c.appendChild(el("p", "sgi-claim", `${label("The claim")}${tx(d.claim, d.claimEs)}`));
  const group = el("div", "sgp-choices");
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Is the claim always, sometimes or never true?");
  const result = el("p", "sgb-feedback");
  result.setAttribute("aria-live", "polite");
  const evidence = el("div", "sgp-solution");
  evidence.hidden = true;
  evidence.innerHTML = `${label("Evidence")}<p>${tx(d.evidence, d.evidenceEs)}</p>`;
  const reason = reasonBox(
    `${key}-why`,
    "Why? Give a counterexample or a reason.",
    store,
    `${key}-why`,
    d.frames,
    d.framesEs,
  );
  let picked = store?.get(`${key}-pick`) || null;
  const buttons = Object.entries(VERDICT).map(([id, [en, es]]) => {
    const b = /** @type {HTMLButtonElement} */ (el("button", "sgp-choice", tx(en, es)));
    b.type = "button";
    b.setAttribute("aria-pressed", String(picked === id));
    b.addEventListener("click", () => {
      if (c.classList.contains("is-right") || c.classList.contains("is-shown")) return;
      picked = id;
      store?.set(`${key}-pick`, id);
      for (const o of buttons) o.setAttribute("aria-pressed", String(o === b));
      compare.disabled = false;
    });
    group.appendChild(b);
    return b;
  });
  const compare = /** @type {HTMLButtonElement} */ (
    el("button", "btn", "Compare with the evidence")
  );
  compare.type = "button";
  compare.disabled = !picked;
  let tried = Boolean(store?.get(`${key}-tried`));
  const settle = (restoring) => {
    const ok = picked === d.verdict;
    evidence.hidden = false;
    result.className = `sgb-feedback ${ok ? "is-right" : "is-wrong"}`;
    const [en, es] = VERDICT[d.verdict];
    result.innerHTML = ok
      ? `Your verdict matches: ${tx(en, es)}.`
      : `Not yet. Read the evidence, then change your verdict or your reason and compare again.`;
    if (ok) {
      mark(c, true);
      store?.set(`${key}-done`, "right");
      if (!restoring) store?.set(`${key}-sup`, tried ? "coached" : "independent");
      for (const o of buttons) o.disabled = true;
      compare.disabled = true;
    } else if (!restoring) {
      tried = true;
      store?.set(`${key}-tried`, true);
      store?.set(`${key}-dx`, "verdict");
    }
  };
  compare.addEventListener("click", () => settle(false));
  c.append(group, reason.wrap, compare, result, evidence);
  if (store?.get(`${key}-done`) === "right") queueMicrotask(() => settle(true));
  return c;
}

/** Tap the line where the first mistake happens; then the flaw and the fix. */
function errorCard(d, { store, key }) {
  const c = card("Find the mistake", "error");
  c.appendChild(el("p", "sgi-claim", tx(d.scenario, d.scenarioEs)));
  c.appendChild(
    el("div", "sgb-problem sgp-problem", `${label("Problem")}<p>${tx(d.problem, d.problemEs)}</p>`),
  );
  const list = el("ol", "sgi-work");
  list.setAttribute("aria-label", "Her work. Press the line with the mistake.");
  const result = el("p", "sgb-feedback");
  result.setAttribute("aria-live", "polite");
  const fix = el("div", "sgp-solution");
  fix.hidden = true;
  fix.innerHTML = `${label("The mistake")}<p>${tx(d.flaw, d.flawEs)}</p>${label("The fix")}<p>${tx(d.fix, d.fixEs)}</p>`;
  let misses = Number(store?.get(`${key}-miss`)) || 0;
  const settle = (restoring) => {
    fix.hidden = false;
    for (const b of list.querySelectorAll("button")) b.disabled = true;
    list.children[d.flawed]?.querySelector("button")?.classList.add("is-flaw");
    result.className = "sgb-feedback is-right";
    result.textContent = "You found it.";
    mark(c, true);
    store?.set(`${key}-done`, "right");
    if (!restoring) store?.set(`${key}-sup`, misses ? "coached" : "independent");
  };
  d.work.forEach((w, i) => {
    const li = el("li", "sgi-line");
    const b = /** @type {HTMLButtonElement} */ (el("button", "sgi-line-btn", tx(w.line, w.lineEs)));
    b.type = "button";
    b.addEventListener("click", () => {
      if (i === d.flawed) return settle(false);
      misses++;
      store?.set(`${key}-miss`, misses);
      store?.set(`${key}-dx`, "misread");
      result.className = "sgb-feedback is-wrong";
      result.textContent =
        misses >= 2
          ? "That line is correct. Check each line against the problem, one at a time."
          : "That line is correct. Look for the first line that does not follow.";
    });
    li.appendChild(b);
    list.appendChild(li);
  });
  c.append(list, result, fix);
  if (store?.get(`${key}-done`) === "right") queueMicrotask(() => settle(true));
  return c;
}

/** Two valid strategies side by side; the student argues for one, then reads the insight. */
function compareCard(d, { store, key }) {
  const c = card("Compare two strategies", "compare");
  c.appendChild(
    el("div", "sgb-problem sgp-problem", `${label("Problem")}<p>${tx(d.problem, d.problemEs)}</p>`),
  );
  const pair = el("div", "sgi-pair");
  for (const m of d.methods) {
    const col = el("section", "sgi-method");
    col.innerHTML =
      `<h4>${tx(m.name, m.nameEs)}</h4><ul>` +
      m.lines.map((l, i) => `<li>${tx(l, m.linesEs?.[i])}</li>`).join("") +
      "</ul>";
    pair.appendChild(col);
  }
  c.appendChild(pair);
  c.appendChild(el("p", "sgi-claim", tx(d.ask, d.askEs)));
  const reason = reasonBox(
    `${key}-why`,
    "Explain your choice.",
    store,
    `${key}-why`,
    ["I would use ___ because ___.", "___ is faster here because ___."],
    ["Yo usaría ___ porque ___.", "___ es más rápido aquí porque ___."],
  );
  const insight = el("div", "sgp-solution");
  insight.hidden = true;
  insight.innerHTML = `${label("Compare")}<p>${tx(d.insight, d.insightEs)}</p>`;
  const reveal = /** @type {HTMLButtonElement} */ (el("button", "btn", "Compare with the insight"));
  reveal.type = "button";
  const settle = (restoring) => {
    insight.hidden = false;
    reveal.disabled = true;
    mark(c, true);
    store?.set(`${key}-done`, "right");
    if (!restoring) store?.set(`${key}-sup`, "independent");
  };
  reveal.addEventListener("click", () => {
    if (reason.area.value.trim().length < 8) {
      reason.area.focus();
      reason.area.setAttribute("aria-invalid", "true");
      return;
    }
    settle(false);
  });
  c.append(reason.wrap, reveal, insight);
  if (store?.get(`${key}-done`) === "right") queueMicrotask(() => settle(true));
  return c;
}

/**
 * The three investigation cards for a Group 2 studio, or null when the lesson has no
 * authored investigation (Units 1 and 10 are not taught).
 * @returns {{conjecture: HTMLElement, error: HTMLElement, compare: HTMLElement, keys: string[]} | null}
 */
export function createInvestigation(config, { store }) {
  const d = config.launch?.practice?.investigate;
  if (!d?.conjecture || !d.errorAnalysis || !d.compare) return null;
  return {
    conjecture: conjectureCard(d.conjecture, { store, key: "ci-0" }),
    error: errorCard(d.errorAnalysis, { store, key: "ci-1" }),
    compare: compareCard(d.compare, { store, key: "ci-2" }),
    keys: ["ci-0", "ci-1", "ci-2"],
  };
}

export const INVESTIGATE_CSS = `
.sgi-claim{margin:0 0 12px;padding:12px 14px;border-left:5px solid var(--sg-accent,#e5a63f);background:var(--sg-soft);border-radius:0 var(--sg-radius-sm) var(--sg-radius-sm) 0;font-size:18px}
.sgi-work{list-style:none;margin:10px 0;padding:0;display:grid;gap:8px}
.sgi-line-btn{display:block;width:100%;min-height:48px;padding:10px 14px;text-align:left;font:600 18px var(--sg-mono,inherit);background:#fff;color:var(--sg-ink);border:2px solid var(--sg-line);border-radius:var(--sg-radius-sm);cursor:pointer}
.sgi-line-btn:hover:not(:disabled){border-color:var(--sg)}
.sgi-line-btn.is-flaw{border-color:var(--sg-bad-ink);background:var(--sg-warn-bg)}
.sgi-pair{display:grid;gap:12px;margin:10px 0}
@media (min-width:760px){.sgi-pair{grid-template-columns:1fr 1fr}}
.sgi-method{padding:12px 14px;border:2px solid var(--sg-line);border-radius:var(--sg-radius-sm);background:#fff}
.sgi-method h4{margin:0 0 6px;font-size:18px;color:var(--sg-deep)}
.sgi-method ul{margin:0;padding-left:20px;display:grid;gap:4px}
.sgi-card .sgp-choice[aria-pressed="true"]{border-color:var(--sg-deep);background:var(--sg-soft)}
.sgp-revise{margin:10px 0 0}
.sgp-fix-frames{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.sgp-fix-frame{min-height:44px;font-size:15px}
`;
