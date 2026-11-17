// Small view pieces shared by every Teacher Tour 2.0 screen: segmented choices, the contained activity frame, the
// student-link box with its QR code. All text goes through the lab's escaping `html` tag.
import { MAX_BYTES, qrSvg } from "../../../../shared/qr/qr-code.mjs";
import { BASE, html, icon, raw } from "../../util.js";
import { resourceRoute, studentUrl } from "./model.js";

export const qrFits = (url) => new TextEncoder().encode(url).length <= MAX_BYTES;

/**
 * A group of toggle buttons for one choice. `attr` is the data attribute the controller reads (data-t2-<attr>);
 * the pressed state is aria-pressed, never colour alone.
 */
export function seg({ label, attr, options, value, hint = "", cls = "" }) {
  const id = `t2seg-${attr}`;
  return html`<div class="t2-seg ${cls}" role="group" aria-labelledby="${id}">
    <span class="t2-seg-label" id="${id}">${label}</span>
    <div class="t2-seg-row">
      ${options.map(
        (o) =>
          html`<button
            type="button"
            class="t2-opt"
            data-t2="set"
            data-t2-field="${attr}"
            data-t2-value="${o.id}"
            aria-pressed="${String(o.id === value)}"
          >
            <strong>${o.name}</strong>${o.detail ? html`<span>${o.detail}</span>` : ""}
          </button>`,
      )}
    </div>
    ${hint ? html`<p class="t2-hint">${hint}</p>` : ""}
  </div>`;
}

/**
 * The activity inside the tour. It is the real activity page in a sandboxed frame: scripts, forms and the
 * microphone work, but the sandbox has no top-navigation and no pop-ups, so nothing inside it can move the tour.
 * Preview mode (window.name) keeps its answers out of this device's saved progress (util.js).
 */
export function frameHTML(res, { title = "" } = {}) {
  const src = `${BASE}${resourceRoute(res, { frame: "1" })}`;
  return html`<div class="t2-frame" data-t2-frame-box>
    <iframe
      class="t2-iframe"
      name="lp-tour-preview"
      title="${title || `Live activity: ${res.title}`}"
      src="${src}"
      loading="lazy"
      allow="microphone; autoplay"
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox"
    ></iframe>
  </div>`;
}

/** The student link with a copy button and, when the link fits the site's QR encoder, its QR code. */
export function linkBox(res, { qr = true } = {}) {
  const url = studentUrl(res);
  return html`<div class="t2-link">
    <label class="t2-link-label" for="t2Link">Student link</label>
    <div class="t2-link-row">
      <input id="t2Link" class="t2-link-input" type="url" readonly value="${url}" />
      <button type="button" class="btn btn-primary" data-t2="copy-link">
        ${icon("copy")}Copy link
      </button>
    </div>
    ${
      qr && qrFits(url)
        ? html`<div class="t2-qr">
            ${raw(qrSvg(url, { px: 132, label: `QR code for the student link to ${res.title}` }))}
            <p>
              Students scan this with a tablet or phone camera. The link opens ${res.title}
              directly. No account is needed.
            </p>
          </div>`
        : ""
    }
  </div>`;
}

export const chips = (items) =>
  html`<ul class="t2-chips">
    ${items.filter(Boolean).map((c) => html`<li>${c}</li>`)}
  </ul>`;
