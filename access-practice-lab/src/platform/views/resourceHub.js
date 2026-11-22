/**
 * Role-Scoped Hub & Filterable Resource Library Strip.
 * Organizes Teacher Mode into 3 pillars: Prepare, Practice, Evidence & Family.
 * Student Mode shows distraction-free focus cards; Family Mode shows Family Bridge.
 */

import { BASE, html } from "../../util.js";
import { RESOURCE_LIBRARY } from "../data/platformData.js";
import { readStorage, STORAGE_KEYS } from "../services/storageService.js";

export function resourceHubStripHTML(band = "6-8", activePillar = "All") {
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  const role = prefs.role || "teacher";
  const q = band ? `?grades=${band}` : "";

  const visible = RESOURCE_LIBRARY.filter((item) => {
    if (role === "student") return item.pillar === "Practice";
    if (role === "family") return item.domain === "Family" || item.id === "legacy-passport";
    if (activePillar !== "All" && item.pillar !== activePillar) return false;
    return true;
  });

  const pillars = ["All", "Prepare", "Practice", "Evidence & Family"];

  return html`
    <section class="tlp-card" id="tlpResourceHub" aria-labelledby="tlpHubTitle">
      <div class="tlp-hero" style="margin-bottom:1rem;padding-bottom:0.85rem">
        <div>
          <p class="tlp-eyebrow">
            ${role === "teacher" ? "Teacher Command Hub" : role === "student" ? "Student Focus Shell" : "Family View"}
          </p>
          <h2 id="tlpHubTitle" style="margin:0;font-family:var(--tlp-font-serif);font-size:1.45rem">
            ${role === "teacher"
              ? "Prepare, Practice & Gather Evidence"
              : role === "student"
                ? "Your Practice Studios"
                : "Celebrate Growth at Home"}
          </h2>
        </div>
        ${role === "teacher"
          ? html`<div class="tlp-actions-row" role="group" aria-label="Filter resources by pillar">
              ${pillars.map(
                (p) => html`<button
                  type="button"
                  class="tlp-tab"
                  data-tlp-pillar="${p}"
                  aria-selected="${p === activePillar ? "true" : "false"}"
                >
                  ${p}
                </button>`,
              )}
            </div>`
          : ""}
      </div>

      <div class="tlp-resource-grid">
        ${visible.map(
          (item) => html`
            <article class="tlp-resource-card">
              <div>
                <div class="tlp-actions-row" style="justify-content:space-between;margin-bottom:0.45rem">
                  <span class="tlp-badge ${item.isNew ? "tlp-badge-accent" : ""}">${item.domain}</span>
                  <span class="tlp-muted" style="font-size:0.78rem">${item.grade}</span>
                </div>
                <h3 style="margin:0 0 0.3rem;font-size:1.02rem">${item.title}</h3>
                <p class="tlp-muted" style="margin:0;font-size:0.86rem">${item.outcome}</p>
              </div>
              <div>
                <a class="tlp-btn tlp-btn-ghost" style="min-height:36px;padding:0.4rem 0.9rem;font-size:0.84rem" href="${BASE}/${item.route}${q}">
                  Launch →
                </a>
              </div>
            </article>
          `,
        )}
      </div>
    </section>
  `;
}

export function bindResourceHubStrip(root, band, onFilterChange) {
  root.querySelectorAll("[data-tlp-pillar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      onFilterChange(btn.dataset.tlpPillar);
    });
  });
}
