// Launch & Notice — the first thing a small group does: read one real context,
// say what you notice, say what you wonder, and read today's goal. It reads fields
// every lesson already carries (`noticeAndWonder`); it adds no
// authored content, and no picture: the studio shows no images outside vocabulary cards.

import { el, esc } from "./small-group-ui.js";

function noteBox(id, prompt, starters, store, key) {
  const wrap = el("div", "sgl-note");
  wrap.innerHTML = `<label class="sgb-input-label" for="${id}">${esc(prompt)}</label>`;
  const area = /** @type {HTMLTextAreaElement} */ (el("textarea", "sgb-why-box"));
  area.id = id;
  area.rows = 2;
  area.value = store?.get(key) || "";
  area.addEventListener("input", () => store?.set(key, area.value));
  wrap.appendChild(area);
  if (starters?.length) {
    const row = el("div", "sgp-fix-frames");
    for (const s of starters.slice(0, 3)) {
      const chip = el("button", "btn ghost sgp-fix-frame", esc(s));
      chip.type = "button";
      chip.addEventListener("click", () => {
        area.value = area.value ? `${area.value} ${s}` : s;
        store?.set(key, area.value);
        area.focus();
      });
      row.appendChild(chip);
    }
    wrap.appendChild(row);
  }
  return wrap;
}

/** @returns {HTMLElement | null} null when the lesson has nothing to notice. */
export function createLaunchCard(config, { store } = {}) {
  const nw = config.noticeAndWonder;
  // The hero already states today's goal; repeating it here is noise.
  if (!nw) return null;
  const card = el("section", "sg-sec sgl");
  card.id = "sg-notice";
  if (nw?.context) card.appendChild(el("p", "sgl-context", esc(nw.context)));
  if (nw) {
    const grid = el("div", "sgl-grid");
    grid.append(
      noteBox("sgl-notice", "I notice…", nw.noticeStarters, store, "notice"),
      noteBox("sgl-wonder", "I wonder…", nw.wonderStarters, store, "wonder"),
    );
    card.appendChild(grid);
  }
  return card;
}

export const LAUNCH_CSS = `
.sgl{display:grid;gap:14px;margin:0 0 22px}
.sgl-context{margin:0;font-size:18px}
.sgl-grid{display:grid;gap:14px}
@media (min-width:760px){.sgl-grid{grid-template-columns:1fr 1fr}}
`;
