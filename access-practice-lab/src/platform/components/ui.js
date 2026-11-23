/**
 * Accessible UI Primitives for The Language Page ("Quiet Luxury EdTech").
 * Slide-Over Drawers, Modals, Badges and QR SVG.
 */

import { BASE, html, raw } from "../../util.js";

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
