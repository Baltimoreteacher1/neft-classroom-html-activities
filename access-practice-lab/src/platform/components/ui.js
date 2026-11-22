/**
 * Accessible UI Primitives for The Language Page ("Quiet Luxury EdTech").
 * Slide-Over Drawers, Modals, Badges, Inline Upgrade Card, Admin Quote/PO Modal, and QR SVG.
 */

import { BASE, html, raw } from "../../util.js";

/**
 * Calm, respectful inline upgrade card shown when a Free Starter limit is hit.
 */
export function upgradeCardHTML(reason, ctaHref = `${BASE}/pricing`) {
  return html`<aside class="tlp-upgrade-card" role="region" aria-label="Teacher Pro option">
    <div class="tlp-upgrade-body">
      <span class="tlp-badge tlp-badge-accent">Teacher Pro</span>
      <p class="tlp-upgrade-reason">${reason}</p>
    </div>
    <div class="tlp-upgrade-actions">
      <a class="tlp-btn tlp-btn-primary" href="${ctaHref}">Compare Plans & School Quote</a>
    </div>
  </aside>`;
}

/**
 * Deterministic crisp SVG QR-style matrix for shareable Family Pride Cards (zero external calls).
 */
export function qrSvg(payloadString, size = 112) {
  const n = 21;
  let hash = 2166136261;
  for (let i = 0; i < payloadString.length; i++) {
    hash ^= payloadString.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const isFinder = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const finderOn = (r, c) => {
    const lr = r >= n - 7 ? r - (n - 7) : r;
    const lc = c >= n - 7 ? c - (n - 7) : c;
    return lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
  };
  let rects = "";
  let seed = hash >>> 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let on = false;
      if (isFinder(r, c)) {
        on = finderOn(r, c);
      } else {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        on = (seed & 1) === 1;
      }
      if (on) rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="currentColor"/>`;
    }
  }
  return raw(
    `<svg class="tlp-qr" viewBox="0 0 ${n} ${n}" width="${size}" height="${size}" role="img" aria-label="Scannable Family Pride Card QR code">${rects}</svg>`,
  );
}

/**
 * Slide-Over Drawer for progressive disclosure (rubrics, L1 transfer, WIDA alignment).
 */
export function openDrawer({ title, subtitle = "", bodyHtml }) {
  closeDrawer();
  const prevFocus = document.activeElement;
  const root = document.createElement("div");
  root.id = "tlpDrawer";
  root.className = "tlp-drawer-backdrop no-print";
  root.innerHTML = `
    <div class="tlp-drawer" role="dialog" aria-modal="true" aria-labelledby="tlpDrawerTitle" tabindex="-1">
      <div class="tlp-drawer-head">
        <div>
          <h2 id="tlpDrawerTitle">${title}</h2>
          ${subtitle ? `<p class="tlp-muted">${subtitle}</p>` : ""}
        </div>
        <button type="button" class="tlp-icon-btn" data-drawer-close aria-label="Close drawer">✕</button>
      </div>
      <div class="tlp-drawer-body">${typeof bodyHtml === "string" ? bodyHtml : ""}</div>
    </div>
  `;
  document.body.appendChild(root);
  const dialog = root.querySelector(".tlp-drawer");
  dialog.focus();

  const onKey = (e) => {
    if (e.key === "Escape") closeDrawer();
  };
  document.addEventListener("keydown", onKey);
  root.addEventListener("click", (e) => {
    if (e.target === root || e.target.closest("[data-drawer-close]")) closeDrawer();
  });
  root._cleanup = () => {
    document.removeEventListener("keydown", onKey);
    if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
  };
  return root;
}

export function closeDrawer() {
  const existing = document.getElementById("tlpDrawer");
  if (existing) {
    existing._cleanup?.();
    existing.remove();
  }
}

/**
 * Printable Formal School Quote / Purchase Order Request Modal.
 */
export function openQuoteModal() {
  const existing = document.getElementById("tlpQuoteModal");
  if (existing) existing.remove();
  const prevFocus = document.activeElement;
  const modal = document.createElement("div");
  modal.id = "tlpQuoteModal";
  modal.className = "tlp-modal-backdrop";
  modal.innerHTML = `
    <div class="tlp-modal" role="dialog" aria-modal="true" aria-labelledby="tlpQuoteTitle" tabindex="-1">
      <div class="tlp-modal-head no-print">
        <h2 id="tlpQuoteTitle">Generate School Quote / Purchase Order Request</h2>
        <button type="button" class="tlp-icon-btn" data-quote-close aria-label="Close modal">✕</button>
      </div>
      <form id="tlpQuoteForm" class="tlp-form no-print">
        <label class="tlp-field">
          <span>School or District Name</span>
          <input type="text" name="school" required placeholder="e.g., Oakridge Middle School" value="Oakridge Middle School" />
        </label>
        <div class="tlp-grid-2">
          <label class="tlp-field">
            <span>Teacher / Educator Seats</span>
            <input type="number" name="seats" min="1" max="500" required value="12" />
          </label>
          <label class="tlp-field">
            <span>Contact Email</span>
            <input type="email" name="email" required placeholder="educator@school.org" value="esol-lead@oakridge.edu" />
          </label>
        </div>
        <div class="tlp-actions-row">
          <button type="submit" class="tlp-btn tlp-btn-primary">Preview Printable Quote</button>
          <button type="button" class="tlp-btn tlp-btn-ghost" data-quote-print hidden>Print / Save PDF</button>
        </div>
      </form>
      <div id="tlpQuotePreview" class="tlp-quote-sheet" hidden></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".tlp-modal").focus();

  const close = () => {
    document.removeEventListener("keydown", onKey);
    modal.remove();
    if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-quote-close]")) close();
  });

  const form = modal.querySelector("#tlpQuoteForm");
  const preview = modal.querySelector("#tlpQuotePreview");
  const printBtn = modal.querySelector("[data-quote-print]");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const school = String(data.get("school") || "School Partner").trim();
    const seats = Math.max(1, Number(data.get("seats")) || 1);
    const email = String(data.get("email") || "").trim();
    const unitPrice = seats >= 20 ? 96 : 120;
    const total = seats * unitPrice;
    const quoteId = `TLP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const issued = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    preview.hidden = false;
    printBtn.hidden = false;
    preview.innerHTML = `
      <div class="tlp-quote-header">
        <div>
          <p class="tlp-eyebrow">Formal School Quote / PO Request</p>
          <h3>The Language Page · EduWonderLab</h3>
          <p class="tlp-muted">Quote #${quoteId} · Issued ${issued}</p>
        </div>
        <div class="tlp-quote-total">
          <span>Annual Total</span>
          <strong>$${total.toLocaleString()}</strong>
        </div>
      </div>
      <dl class="tlp-quote-meta">
        <div><dt>Prepared For</dt><dd>${school.replace(/[<>&]/g, "")}</dd></div>
        <div><dt>Contact</dt><dd>${email.replace(/[<>&]/g, "")}</dd></div>
        <div><dt>Plan</dt><dd>School & District Multilingual Suite (${seats} seats)</dd></div>
        <div><dt>Rate</dt><dd>$${unitPrice}/seat/year ${seats >= 20 ? "(Volume Tier)" : ""}</dd></div>
      </dl>
      <p class="tlp-muted tlp-quote-note">
        Includes unlimited Content-to-Language Bridge scanning, Sentence Architect Studio, Adaptive Speaking Simulator,
        Reclassification Radar, and Zero-Login Bilingual Family Bridge. FERPA/COPPA privacy-by-design (zero student PII stored on external servers).
      </p>
    `;
  });

  printBtn.addEventListener("click", () => window.print());
}
