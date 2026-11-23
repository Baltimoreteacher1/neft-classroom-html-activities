/**
 * Dedicated Pricing, Entitlements & Printable School Quote / PO Request View.
 */

import { BASE, html } from "../../util.js";
import { openQuoteModal } from "../components/ui.js";
import { getEntitlementState, setEntitlementTier } from "../entitlements/entitlementService.js";

export async function render(ctx) {
  const { tier } = getEntitlementState();
  return {
    title: "Plans & School Quote — The Language Page",
    html: html`
      <section class="tlp-page">
        <header class="tlp-hero">
          <div>
            <p class="tlp-eyebrow">Subscription & District Licensing</p>
            <h1>Calm, predictable plans for multilingual teams</h1>
            <p class="tlp-muted tlp-measure">
              Core student practice remains free and accessible. Teacher Pro and School/District licensing unlock unlimited lesson scanning, full-class Reclassification Radar exports, and multi-teacher onboarding.
            </p>
          </div>
          <button type="button" class="tlp-btn tlp-btn-primary" id="tlpOpenQuoteBtn">
            Generate Admin Quote / Request PO
          </button>
        </header>

        <div class="tlp-grid-3">
          <article class="tlp-card">
            <span class="tlp-badge ${tier === "free" ? "tlp-badge-accent" : ""}">Free Starter</span>
            <h2 style="margin:0.6rem 0 0.25rem">$0 <small class="tlp-muted">/ forever</small></h2>
            <p class="tlp-muted">Explore every studio with sample data and core student rooms.</p>
            <ul class="tlp-muted" style="padding-left:1.1rem">
              <li>All legacy ACCESS Practice Lab rooms</li>
              <li>Sample Content-to-Language Bridge texts</li>
              <li>Sentence Architect & Speaking Simulator</li>
              <li>Up to 3 Reclassification Radar students</li>
            </ul>
            <button type="button" class="tlp-btn tlp-btn-ghost" data-set-tier="free" ${tier === "free" ? "disabled" : ""}>
              ${tier === "free" ? "Current Mode" : "Preview Free Starter"}
            </button>
          </article>

          <article class="tlp-card" style="border-color: var(--tlp-accent)">
            <span class="tlp-badge tlp-badge-accent">Teacher Pro · Recommended</span>
            <h2 style="margin:0.6rem 0 0.25rem">$12 <small class="tlp-muted">/ month</small></h2>
            <p class="tlp-muted">For ESL/ELD teachers preparing daily lessons and tracking exit readiness.</p>
            <ul class="tlp-muted" style="padding-left:1.1rem">
              <li>Unlimited custom lesson scanning in Bridge</li>
              <li>Up to 45 students in Reclassification Radar</li>
              <li>4-Week Domain Sprints & CSV/PDF Reports</li>
              <li>Unlimited Pride Clips & Family Bridge Cards</li>
            </ul>
            <button type="button" class="tlp-btn tlp-btn-primary" data-set-tier="pro" ${tier === "pro" ? "disabled" : ""}>
              ${tier === "pro" ? "Active (Preview Mode)" : "Activate Teacher Pro Preview"}
            </button>
          </article>

          <article class="tlp-card">
            <span class="tlp-badge ${tier === "district" ? "tlp-badge-accent" : ""}">School & District</span>
            <h2 style="margin:0.6rem 0 0.25rem">Custom <small class="tlp-muted">/ year</small></h2>
            <p class="tlp-muted">PO-ready licensing for departments, schools, and district ESOL teams.</p>
            <ul class="tlp-muted" style="padding-left:1.1rem">
              <li>Everything in Teacher Pro for all staff</li>
              <li>Up to 500 students per teacher workspace</li>
              <li>Formal School Quote & Purchase Order PDF</li>
              <li>FERPA/COPPA zero-PII architecture</li>
            </ul>
            <button type="button" class="tlp-btn tlp-btn-ghost" id="tlpQuoteCardBtn">
              Request School Quote / PO
            </button>
          </article>
        </div>

        <p style="margin-top:1.5rem">
          <a class="tlp-btn tlp-btn-ghost" href="${BASE}/">← Back to Language Hub</a>
        </p>
      </section>
    `,
    mount(root) {
      root.querySelector("#tlpOpenQuoteBtn")?.addEventListener("click", openQuoteModal);
      root.querySelector("#tlpQuoteCardBtn")?.addEventListener("click", openQuoteModal);
      root.querySelectorAll("[data-set-tier]").forEach((btn) => {
        btn.addEventListener("click", () => {
          setEntitlementTier(btn.dataset.setTier);
          ctx.rerender();
        });
      });
    },
  };
}
