/**
 * Module 5: Reclassification Radar & 4-Week Domain Sprints (Teacher Evidence View)
 * Publisher-grade: Grade-band + Bubble filter, color-coded domain cells,
 * Reset Demo Roster, Add Student (K-8, zero-PII alias), CSV & Printable PDF Report.
 */

import { BASE, esc, html } from "../../util.js";
import { DEMO_ROSTER, getLanguageMeta } from "../data/platformData.js";
import { checkFeatureAccess } from "../entitlements/entitlementService.js";
import { analyzeStudentRadar, generateDomainSprint } from "../services/intelligenceAdapter.js";
import { STORAGE_KEYS, readStorage, sanitizeAlias, updateStorage } from "../services/storageService.js";
import { openDrawer, upgradeCardHTML } from "../components/ui.js";

function scoreClass(val) {
  const n = Number(val) || 0;
  if (n < 4.0) return "tlp-score-low";
  if (n >= 4.5) return "tlp-score-high";
  return "tlp-score-mid";
}

function matchesFilter(s, filter) {
  const g = String(s.grade || "");
  if (filter === "Bubble") return s.isBubble;
  if (filter === "K-2") return ["K", "1", "2"].includes(g);
  if (filter === "3-5") return ["3", "4", "5"].includes(g);
  if (filter === "6-8") return ["6", "7", "8"].includes(g);
  return true;
}

function exportCsv(analyzed) {
  const header = ["Alias", "Grade", "L1", "Listening", "Speaking", "Reading", "Writing", "Average", "Status", "Bottleneck"];
  const rows = analyzed.map((s) => [
    s.alias, s.grade, s.l1, s.listening, s.speaking, s.reading, s.writing, s.average, s.status, s.bottleneck.label,
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
  const filter = store.filter || "All";
  const visible = analyzed.filter((s) => matchesFilter(s, filter));
  const bubbleCount = analyzed.filter((s) => s.isBubble).length;
  const readyCount = analyzed.filter((s) => s.isReady).length;

  const exportAccess = checkFeatureAccess("export_report");
  const addAccess = checkFeatureAccess("roster_add", rawStudents.length);
  const sprintAccess = checkFeatureAccess("unlimited_sprints");

  return {
    title: "Reclassification Radar — ELL Lab",
    html: html`
      <section class="tlp-page">
        <header class="tlp-hero">
          <div>
            <p class="tlp-eyebrow">Evidence & Family · Module 5 · K–8 Exit Readiness</p>
            <h1>Reclassification Radar & 4-Week Sprints</h1>
            <p class="tlp-muted tlp-measure">
              Spot Bubble Students within 0.5 points of exit (4.5), isolate each student's single bottleneck domain, and launch targeted 4-week K–8 micro-practice sprints. Stored locally with anonymized aliases only.
            </p>
          </div>
          <div class="tlp-actions-row no-print">
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpRadarResetBtn">Reset Demo Roster</button>
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpRadarCsvBtn" ${exportAccess.allowed ? "" : "disabled"}>Export CSV</button>
            <button type="button" class="tlp-btn tlp-btn-primary" id="tlpRadarPrintBtn" ${exportAccess.allowed ? "" : "disabled"}>Print / PDF Report</button>
          </div>
        </header>

        ${!exportAccess.allowed ? upgradeCardHTML(exportAccess.reason) : ""}

        <div class="tlp-grid-3" style="margin-bottom:1.25rem">
          <div class="tlp-card">
            <span class="tlp-eyebrow">Roster (K–8)</span>
            <p class="tlp-tabular" style="font-size:1.75rem;font-weight:700;margin:0">${analyzed.length} <small class="tlp-muted" style="font-size:0.85rem">(${readyCount} exit ready)</small></p>
          </div>
          <div class="tlp-card">
            <span class="tlp-eyebrow">Bubble Students (≤ 0.5 to Exit)</span>
            <p class="tlp-tabular" style="font-size:1.75rem;font-weight:700;margin:0;color:var(--tlp-accent-ink)">${bubbleCount}</p>
          </div>
          <div class="tlp-card">
            <span class="tlp-eyebrow">Target Exit Threshold</span>
            <p class="tlp-tabular" style="font-size:1.75rem;font-weight:700;margin:0">4.5</p>
          </div>
        </div>

        <div class="tlp-card">
          <div class="tlp-actions-row no-print" style="justify-content:space-between;margin-bottom:0.85rem">
            <div class="tlp-actions-row" role="group" aria-label="Filter roster">
              ${[
                ["All", "All K–8"],
                ["Bubble", "Bubble Only"],
                ["K-2", "Grades K–2"],
                ["3-5", "Grades 3–5"],
                ["6-8", "Grades 6–8"],
              ].map(
                ([id, label]) => html`<button
                  type="button"
                  class="tlp-tab"
                  data-radar-filter="${id}"
                  aria-selected="${filter === id ? "true" : "false"}"
                >
                  ${label}
                </button>`,
              )}
            </div>
            <span class="tlp-muted" style="font-size:0.82rem">Showing ${visible.length} of ${analyzed.length}</span>
          </div>

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
                ${visible.map(
                  (s) => html`
                    <tr>
                      <td><strong>${s.alias}</strong></td>
                      <td class="tlp-tabular">${s.grade}</td>
                      <td>${getLanguageMeta(s.l1).english}</td>
                      <td class="tlp-tabular ${scoreClass(s.listening)}">${s.listening}</td>
                      <td class="tlp-tabular ${scoreClass(s.speaking)}">${s.speaking}</td>
                      <td class="tlp-tabular ${scoreClass(s.reading)}">${s.reading}</td>
                      <td class="tlp-tabular ${scoreClass(s.writing)}">${s.writing}</td>
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
                  <span>Grade (K–8)</span>
                  <select name="grade">
                    <option value="K">Kindergarten</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6" selected>Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                  </select>
                </label>
                <label class="tlp-field">
                  <span>Home Language</span>
                  <select name="l1">
                    <option value="es">Spanish</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Mandarin</option>
                    <option value="fr">French</option>
                    <option value="uk">Ukrainian</option>
                    <option value="ru">Russian</option>
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
          <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to ELL Lab Hub</a>
        </p>
      </section>
    `,
    mount(root) {
      root.querySelectorAll("[data-radar-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          updateStorage(STORAGE_KEYS.RADAR, { filter: btn.dataset.radarFilter });
          ctx.rerender();
        });
      });

      root.querySelector("#tlpRadarResetBtn")?.addEventListener("click", () => {
        updateStorage(STORAGE_KEYS.RADAR, { students: null, filter: "All" });
        ctx.rerender();
      });

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
            title: `4-Week ${sprint.bottleneckDomain} Sprint · ${sprint.studentAlias} (Gr ${student.grade})`,
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
