/**
 * The "Mark this mission complete" panel on the Studio's Publish step.
 *
 * Mounted by studio.js after every render and every publish-step update. It only ever writes the
 * `nt-project-complete:v1:<id>` record (completion.mjs) and only when the student presses the
 * button while the Studio's own readiness test passes. Teacher view and the Completed Exemplar
 * can never produce a record. Markup uses the Studio's existing card / notice / button classes.
 */
import {
  buildCompletionRecord,
  isExemplarWork,
  readCompletion,
  writeCompletion,
} from "./completion.mjs";

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const when = (iso) => {
  const d = new Date(iso);
  try {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d.toDateString();
  }
};

/** What the panel should say and offer; pure so the gate can reason about it. */
export function completionView({ project, state, progress, record }) {
  if (isExemplarWork(project, state))
    return {
      kind: "exemplar",
      note: "This is the completed exemplar, a demonstration. Reset to a blank student workspace to complete a mission of your own.",
    };
  if (state.role === "teacher")
    return { kind: "teacher", note: "Switch back to student view to mark your own mission complete." };
  if (progress.ready)
    return { kind: "ready", button: record ? "Update my completion record" : "Mark this mission complete" };
  return {
    kind: "draft",
    note: "Finish every item in the checklist above to mark this mission complete. Your progress is saved either way.",
  };
}

export function mountCompletion({ host, project, state, progress, storage }) {
  if (!host) return;
  let panel = host.querySelector("#completion-panel");
  if (state.stage !== 4) {
    panel?.remove();
    return;
  }
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "completion-panel";
    panel.setAttribute("aria-labelledby", "completion-heading");
    const readiness = host.querySelector("#readiness");
    const footer = host.querySelector(".stage-footer");
    if (readiness) readiness.after(panel);
    else if (footer) footer.before(panel);
    else host.append(panel);
  }
  const record = readCompletion(project.id, storage);
  const view = completionView({ project, state, progress, record });
  const signature = `${view.kind}|${view.button || ""}|${record?.completedAt || ""}`;
  if (panel.dataset.signature === signature) return;
  panel.dataset.signature = signature;
  const done = record
    ? `<p class="notice good" role="status">Completed ${esc(when(record.completedAt))}. This mission is in <a href="/math/projects/portfolio/">your portfolio</a> on this device.</p>`
    : "";
  panel.innerHTML = `<h3 id="completion-heading">Finish this mission</h3>${done}${view.note ? `<p class="hint">${esc(view.note)}</p>` : ""}${view.button ? `<p class="actions compact"><button type="button" data-complete>${esc(view.button)}</button></p><p id="completion-status" role="status" class="hint"></p>` : ""}`;
  panel.querySelector("[data-complete]")?.addEventListener("click", () => {
    const status = panel.querySelector("#completion-status");
    try {
      const next = buildCompletionRecord(project, state, {
        passed: progress.passed,
        total: progress.total,
        ready: progress.ready,
        prior: record,
      });
      if (writeCompletion(next, storage)) {
        mountCompletion({ host, project, state, progress, storage });
        const fresh = host.querySelector("#completion-panel");
        fresh.querySelector("#completion-status").textContent =
          "Saved. This mission is now in your portfolio on this device.";
        fresh.querySelector("[data-complete]")?.focus();
      } else {
        status.textContent =
          "This device would not save the record, so the mission is not marked complete. Download a backup to keep your work.";
      }
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "The mission could not be completed.";
    }
  });
}
