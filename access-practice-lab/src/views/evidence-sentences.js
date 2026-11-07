// "Because / but / so" evidence sentences inside a Writing Studio task. Rubrics: content/studio/
// evidence-sentences.json; judging: src/lang/evidence-feedback.js (on the device, no network). The learner
// revises as many rounds as the content allows; each round gets a next move, never the answer.
import { getEvidenceSentences } from "../content.js";
import { addRound, EVIDENCE_KEY, judge, normalizeRounds } from "../lang/evidence-feedback.js";
import { html, icon, safeJson, storage } from "../util.js";

let DATA = null;

const loadRounds = () => normalizeRounds(safeJson(storage.get(EVIDENCE_KEY), {}), DATA?.maxRounds);
const sourceText = (task) =>
  (task.sources || [])
    .flatMap((s) => [...(Array.isArray(s.text) ? s.text : []), ...(s.table?.rows || []).flat()])
    .join(" ");

const TONE = {
  strong: "is-right",
  revise: "is-hint",
  short: "is-hint",
  copied: "is-hint",
  empty: "is-hint",
};

export async function evidenceSentencesHTML(I, task, { independent = false } = {}) {
  DATA ||= await getEvidenceSentences().catch(() => null);
  const prompts = DATA?.tasks?.[task.id];
  if (!prompts?.length || independent) return "";
  const rounds = loadRounds()[task.id] || {};
  const max = DATA.maxRounds;
  return html`<section
    class="panel evidence-sentences"
    id="wrt-evidence"
    aria-labelledby="evsTitle"
  >
    <h3 id="evsTitle">
      ${icon("evidence")} ${I.T("Warm-up: because, but, so", "Calentamiento: because, but, so")}
    </h3>
    <p class="fine">
      ${I.T(
        "Finish each sentence with evidence from the sources. Each check gives you one next move. Revise as many times as you need.",
        "Termina cada oración con evidencia de las fuentes. Cada revisión te da un siguiente paso. Revisa las veces que necesites.",
      )}
    </p>
    ${prompts.map((p) => {
      const entry = rounds[p.id] || { rounds: [], done: false };
      const last = entry.rounds.at(-1);
      const result = last ? judge(p, last.text, { sources: sourceText(task) }) : null;
      const used = entry.rounds.length >= max;
      return html`<div class="evs-prompt" data-evs-prompt="${p.id}">
        <label class="field"
          ><span lang="en"><strong>${p.stem}</strong> …</span
          ><textarea
            rows="2"
            lang="en"
            data-evs-text="${p.id}"
            ${entry.done || used ? "readonly" : ""}
          >
${last?.text || ""}</textarea>
        </label>
        ${result ? html`<p class="feedback ${TONE[result.status] || "is-hint"}" role="status">${icon(result.status === "strong" ? "check" : "bulb")} ${I.TO(result.feedback)}${result.grammar?.length ? html` ${I.T("Polish:", "Pulir:")} ${result.grammar[0].text.length > 2 ? html`<q lang="en">${result.grammar[0].text}</q> · ` : ""}<span lang="en">${result.grammar[0].name}</span>` : ""}</p>` : ""}
        <p class="fine">
          ${I.T(`Round ${entry.rounds.length} of up to ${max}`, `Ronda ${entry.rounds.length} de hasta ${max}`)}
        </p>
        ${
          entry.done
            ? ""
            : used
              ? html`<p class="fine">
                  ${I.T("You used every round. Talk about this sentence with your teacher or a partner.", "Usaste todas las rondas. Habla de esta oración con tu docente o con un compañero.")}
                </p>`
              : html`<button type="button" class="btn small" data-evs-check="${p.id}">
                  ${I.T("Check my sentence", "Revisar mi oración")}
                </button>`
        }
      </div>`;
    })}
  </section>`;
}

/** Click handler for the warm-up. Returns true when it handled the click. */
export function onEvidenceClick(event, task) {
  const button = event.target.closest?.("[data-evs-check]");
  if (!button || !DATA) return false;
  const id = button.dataset.evsCheck;
  const prompt = DATA.tasks?.[task.id]?.find((p) => p.id === id);
  const box = document.querySelector(`[data-evs-text="${id}"]`);
  if (!prompt || !box) return true;
  const result = judge(prompt, box.value, { sources: sourceText(task) });
  const all = loadRounds();
  const forTask = { ...(all[task.id] || {}) };
  forTask[id] = addRound(forTask[id], box.value, result.status, DATA.maxRounds);
  storage.set(EVIDENCE_KEY, JSON.stringify({ ...all, [task.id]: forTask }));
  return true;
}
