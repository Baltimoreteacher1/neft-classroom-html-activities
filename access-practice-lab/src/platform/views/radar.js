/**
 * Module 5: Reclassification Radar & 4-Week Domain Sprints (Teacher Evidence View)
 * Seeds with anonymized demo roster (first name + initial only).
 * Flags Bubble Students within 0.5 of exit threshold (4.5) & highlights bottleneck domain.
 */

import { BASE, esc, html } from "../../util.js";
import { DEMO_ROSTER, getLanguageMeta } from "../data/platformData.js";
import { checkFeatureAccess } from "../entitlements/entitlementService.js";
import { analyzeStudentRadar, generateDomainSprint } from "../services/intelligenceAdapter.js";
import { STORAGE_KEYS, readStorage, sanitizeAlias, updateStorage } from "../services/storageService.js";
import { openDrawer, upgradeCardHTML } from "../components/ui.js";

function exportCsv(analyzed) {
  const header = ["Alias", "Grade", "L1", "Listening", "Speaking", "Reading", "Writing", "Average", "Status", "Bottleneck"];
  const rows = analyzed.map((s) => [
    s.alias,
    s.grade,
    s.l1,
    s.listening,
    s.speaking,
    s.reading,
    s.writing,
    s.average,
    s.status,
    s.bottleneck.label,
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reclassification-radar-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export async function render(ctx) {
  const store = readStorage(STORAGE_KEYS.RADAR);
  const rawStudents = Array.isArray(store.students) && store.students.length ? store.students : DEMO_ROSTER;
  const analyzed = rawStudents.map(analyzeStudentRadar);
  const bubbleCount = analyzed.filter((s) => s.isBubble).length;

  const exportAccess = checkFeatureAccess("export_report");
  const addAccess = checkFeatureAccess("roster_add", rawStudents.length);
  const sprintAccess = checkFeatureAccess("unlimited_sprints");

  return {
    title: "Reclassification Radar — The Language Page",
    body: html`
      <section class="tlp-page">
        <header class="tlp-hero">
          <div>
            <p class="tlp-eyebrow">Evidence & Family · Module 5</p>
            <h1>Reclassification Radar & 4-Week Sprints</h1>
            <p class="tlp-muted tlp-measure">
              Spot Bubble Students within 0.5 points of exit (4.5), isolate the single bottleneck domain, and generate targeted 4-week micro-practice sprints. Stored locally with anonymized aliases only.
            </p>
          </div>
          <div class="tlp-actions-row no-print">
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpRadarCsvBtn" ${exportAccess.allowed ? "" : "disabled"}>
              Export CSV
            </button>
            <button type="button" class="tlp-btn tlp-btn-primary" id="tlpRadarPrintBtn" ${exportAccess.allowed ? "" : "disabled"}>
              Print / PDF Report
            </button>
          </div>
        </header>

        ${!exportAccess.allowed ? upgradeCardHTML(exportAccess.reason) : ""}

        <div class="tlp-grid-3" style="margin-bottom:1.25rem">
          <div class="tlp-card">
            <span class="tlp-eyebrow">Roster Size</span>
            <p class="tlp-tabular" style="font-size:1.75rem;font-weight:700;margin:0">${analyzed.length}</p>
          </div>
          <div class="tlp-card">
            <span class="tlp-eyebrow">Bubble Students (≤ 0.5 to Exit)</span>
            <p class="tlp-tabular" style="font-size:1.75rem;font-weight:700;margin:0;color:var(--tlp-accent-ink)">${bubbleCount}</p>
          </div>
          <div class="tlp-card">
            <span class="tlp-eyebrow">Target Threshold</span>
            <p class="tlp-tabular" style="font-size:1.75rem;font-weight:700;margin:0">4.5</p>
          </div>
        </div>

        <div class="tlp-card">
          <div class="tlp-table-wrap">
            <table class="tlp-table">
              <thead>
                <tr>
                  <th>Alias</th>
                  <th>Gr</th>
                  <th>L1</th>
                  <th>L</th>
                  <th>S</th>
                  <th>R</th>
                  <th>W</th>
                  <th>Avg</th>
                  <th>Status</th>
                  <th>Bottleneck</th>
                  <th class="no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                ${analyzed.map(
                  (s) => html`
                    <tr>
                      <td><strong>${s.alias}</strong></td>
                      <td class="tlp-tabular">${s.grade}</td>
                      <td>${getLanguageMeta(s.l1).english}</td>
                      <td class="tlp-tabular">${s.listening}</td>
                      <td class="tlp-tabular">${s.speaking}</td>
                      <td class="tlp-tabular">${s.reading}</td>
                      <td class="tlp-tabular">${s.writing}</td>
                      <td class="tlp-tabular"><strong>${s.average}</strong></td>
                      <td>
                        <span class="tlp-badge ${s.isBubble ? "tlp-badge-accent" : s.isReady ? "tlp-badge-level-6" : "tlp-badge-level-2"}">
                          ${s.status}
                        </span>
                      </td>
                      <td><strong>${s.bottleneck.label}</strong> (${s.bottleneck.score})</td>
                      <td class="no-print">
                        <button type="button" class="tlp-btn tlp-btn-ghost" style="min-height:32px;padding:0.3rem 0.75rem;font-size:0.8rem" data-sprint-id="${s.id}">
                          4-Wk Sprint
                        </button>
                      </td>
                    </tr>
                  `,
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div class="tlp-card no-print">
          <h2 style="margin:0 0 0.75rem;font-size:1.15rem">Add Student (Anonymized Alias Only)</h2>
          ${!addAccess.allowed
            ? upgradeCardHTML(addAccess.reason)
            : html`<form id="tlpAddStudentForm" class="tlp-grid-3">
                <label class="tlp-field">
                  <span>First Name + Initial</span>
                  <input type="text" name="alias" required placeholder="e.g., Elena V." />
                </label>
                <label class="tlp-field">
                  <span>Grade</span>
                  <input type="text" name="grade" required value="6" />
                </label>
                <label class="tlp-field">
                  <span>Home Language</span>
                  <select name="l1">
                    <option value="es">Spanish</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Mandarin</option>
                    <option value="fr">French</option>
                    <option value="uk">Ukrainian</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </label>
                <label class="tlp-field"><span>Listening (1–6)</span><input type="number" step="0.1" min="1" max="6" name="listening" value="4.2" /></label>
                <label class="tlp-field"><span>Speaking (1–6)</span><input type="number" step="0.1" min="1" max="6" name="speaking" value="3.8" /></label>
                <label class="tlp-field"><span>Reading (1–6)</span><input type="number" step="0.1" min="1" max="6" name="reading" value="4.4" /></label>
                <label class="tlp-field"><span>Writing (1–6)</span><input type="number" step="0.1" min="1" max="6" name="writing" value="4.0" /></label>
                <div style="display:flex;align-items:flex-end;margin-bottom:0.85rem">
                  <button type="submit" class="tlp-btn tlp-btn-primary">Add to Local Radar</button>
                </div>
              </form>`}
        </div>

        <p class="no-print" style="margin-top:1.25rem">
          <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to Language Hub</a>
        </p>
      </section>
    `,
    mount(root) {
      root.querySelector("#tlpRadarCsvBtn")?.addEventListener("click", () => {
        if (exportAccess.allowed) exportCsv(analyzed);
      });
      root.querySelector("#tlpRadarPrintBtn")?.addEventListener("click", () => {
        if (exportAccess.allowed) window.print();
      });

      root.querySelectorAll("[data-sprint-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!sprintAccess.allowed) {
            openDrawer({
              title: "4-Week Domain Sprints",
              bodyHtml: `<p>${esc(sprintAccess.reason)}</p><a class="tlp-btn tlp-btn-primary" href="${BASE}/pricing">View Plans</a>`,
            });
            return;
          }
          const student = analyzed.find((s) => s.id === btn.dataset.sprintId);
          if (!student) return;
          const sprint = generateDomainSprint(student);
          openDrawer({
            title: `4-Week ${sprint.bottleneckDomain} Sprint · ${sprint.studentAlias}`,
            subtitle: `Current ${sprint.bottleneckDomain}: ${sprint.currentScore} → Target ${sprint.targetThreshold}`,
            bodyHtml: sprint.weeks
              .map(
                (w) => `<div class="tlp-pride-element">
                  <strong>Week ${w.week}: ${esc(w.focus)}</strong>
                  <div style="margin-top:0.5rem">
                    <a class="tlp-btn tlp-btn-ghost" style="min-height:34px;padding:0.3rem 0.85rem;font-size:0.82rem" href="${BASE}/${w.route}">${esc(w.cta)} →</a>
                  </div>
                </div>`,
              )
              .join(""),
          });
        });
      });

      root.querySelector("#tlpAddStudentForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const nextStudent = {
          id: `stu-${Date.now().toString(36)}`,
          alias: sanitizeAlias(fd.get("alias"), "Student N."),
          grade: String(fd.get("grade") || "6").slice(0, 4),
          l1: String(fd.get("l1") || "es"),
          listening: Number(fd.get("listening")) || 4.0,
          speaking: Number(fd.get("speaking")) || 4.0,
          reading: Number(fd.get("reading")) || 4.0,
          writing: Number(fd.get("writing")) || 4.0,
          threshold: 4.5,
        };
        updateStorage(STORAGE_KEYS.RADAR, (prev) => {
          const base = Array.isArray(prev.students) && prev.students.length ? prev.students : [...DEMO_ROSTER];
          return { ...prev, students: [...base, nextStudent] };
        });
        ctx.rerender();
      });
    },
  };
}
