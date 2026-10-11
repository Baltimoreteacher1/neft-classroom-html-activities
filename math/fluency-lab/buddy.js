// Buddy: a small character that wears what the learner has earned and cheers after a game. The look is saved
// with the rewards record; nothing is uploaded and a buddy has no name.
import { COLORS, ITEMS, SLOTS } from "./buddy-items.js";
import { t } from "./i18n.js";
import { earnedIds, rankIndex } from "./rewards.js";

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function unlockedIds(summary) {
  const stickers = new Set(earnedIds(summary));
  const rank = rankIndex(summary);
  return ITEMS.filter((item) => ("sticker" in item.unlock ? stickers.has(item.unlock.sticker) : rank >= item.unlock.rank)).map((item) => item.id);
}

const MOUTH = {
  happy: '<path d="M44 66q16 14 32 0" fill="none" stroke="#13233a" stroke-width="4" stroke-linecap="round"/>',
  cheer: '<path d="M42 62q18 24 36 0z" fill="#13233a"/><path d="M50 70q10 8 20 0" fill="#e0679a"/>',
  think: '<path d="M46 70h28" fill="none" stroke="#13233a" stroke-width="4" stroke-linecap="round"/>',
};

const HATS = {
  cap: '<path d="M32 38q28-30 56 0z" fill="#e0453a"/><path d="M80 38h18q-4 8-20 8z" fill="#b6362d"/>',
  party: '<path d="M60 4l-20 38h40z" fill="#f3b61f"/><circle cx="60" cy="4" r="5" fill="#e0679a"/><path d="M48 28l24-8M44 36l32-10" stroke="#fff" stroke-width="3"/>',
  wizard: '<path d="M60 -6l-26 46h52z" fill="#5b3fa8"/><path d="M26 40h68" stroke="#3a2670" stroke-width="6" stroke-linecap="round"/><circle cx="58" cy="20" r="4" fill="#f3b61f"/>',
  crown: '<path d="M34 38l4-22 14 12 8-18 8 18 14-12 4 22z" fill="#f3b61f" stroke="#c98f00" stroke-width="2"/>',
};
const FACES = {
  glasses: '<g fill="none" stroke="#13233a" stroke-width="3"><circle cx="46" cy="52" r="10"/><circle cx="74" cy="52" r="10"/><path d="M56 52h8"/></g>',
  goggles: '<g><rect x="32" y="42" width="56" height="20" rx="10" fill="#9bd1ff" fill-opacity=".6" stroke="#13233a" stroke-width="3"/><path d="M60 42v20" stroke="#13233a" stroke-width="3"/></g>',
  shades: '<g fill="#13233a"><rect x="34" y="44" width="22" height="14" rx="5"/><rect x="64" y="44" width="22" height="14" rx="5"/><rect x="54" y="48" width="12" height="3"/></g>',
};
const BACKS = {
  cape: '<path d="M30 52q-14 40 0 64h60q14-24 0-64q-30 14-60 0z" fill="#d1495b"/>',
  wings: '<path d="M26 60q-22-14-18-38q16 2 26 22z M94 60q22-14 18-38q-16 2-26 22z" fill="#f3b61f" stroke="#c98f00" stroke-width="2"/>',
  rocket: '<rect x="14" y="56" width="14" height="40" rx="7" fill="#c9d3e3"/><rect x="92" y="56" width="14" height="40" rx="7" fill="#c9d3e3"/><path d="M16 100q5 14 10 0M94 100q5 14 10 0" fill="#ff8a3d"/>',
};

export function buddySvg({ color = "blue", hat = "", face = "", back = "", mood = "happy" } = {}) {
  const body = COLORS[color] || COLORS.blue;
  const eyes = face === "goggles" || face === "shades" ? "" : '<circle cx="46" cy="52" r="5" fill="#13233a"/><circle cx="74" cy="52" r="5" fill="#13233a"/><circle cx="48" cy="50" r="1.6" fill="#fff"/><circle cx="76" cy="50" r="1.6" fill="#fff"/>';
  return `<svg class="bd-svg" viewBox="-6 -14 132 140" role="img" aria-hidden="true">${BACKS[back] || ""}<ellipse cx="60" cy="112" rx="34" ry="8" fill="#13233a" fill-opacity=".12"/><rect x="26" y="34" width="68" height="72" rx="34" fill="${body}" stroke="#13233a" stroke-width="3"/><ellipse cx="60" cy="86" rx="22" ry="14" fill="#fff" fill-opacity=".35"/><rect x="38" y="100" width="16" height="12" rx="6" fill="${body}" stroke="#13233a" stroke-width="3"/><rect x="66" y="100" width="16" height="12" rx="6" fill="${body}" stroke="#13233a" stroke-width="3"/>${eyes}${MOUTH[mood] || MOUTH.happy}${FACES[face] || ""}${HATS[hat] || ""}</svg>`;
}

// A short, specific word of encouragement. It praises thinking and checking, never speed.
export function reactionFor(stars) {
  return stars >= 3 ? t("You thought it through. That is how it sticks!") : stars === 2 ? t("Nice effort. Mistakes help your brain grow.") : t("Good try! Let's look at the tricky ones together.");
}

export const moodFor = (stars) => (stars >= 3 ? "cheer" : stars === 2 ? "happy" : "think");

const SWATCH_LABELS = { blue: "Blue", green: "Green", pink: "Pink", orange: "Orange", purple: "Purple", teal: "Teal" };
const SLOT_LABELS = { hat: "Hat", face: "Face", back: "Back" };

export function buddyPanel(rewards, summary) {
  const open = new Set(unlockedIds(summary));
  const look = rewards.buddy;
  const slot = (name) => `<label class="bd-slot">${t(SLOT_LABELS[name])}<select data-buddy-slot="${name}"><option value="">${t("None")}</option>${ITEMS.filter((item) => item.slot === name).map((item) => `<option value="${item.id}"${look[name] === item.id ? " selected" : ""}${open.has(item.id) ? "" : " disabled"}>${open.has(item.id) ? esc(t(item.name)) : `🔒 ${esc(t(item.name))} — ${esc(t(item.hint))}`}</option>`).join("")}</select></label>`;
  return `<section class="bd-panel" aria-labelledby="bd-title"><h3 id="bd-title">${t("My buddy")}</h3>
    <div class="bd-grid"><div class="bd-view" id="bd-view">${buddySvg(look)}</div>
    <div class="bd-controls"><div class="bd-colors" role="group" aria-label="${t("Buddy color")}">${Object.keys(COLORS).map((c) => `<button type="button" class="bd-swatch" data-buddy-color="${c}" style="--sw:${COLORS[c]}" aria-pressed="${look.color === c}" aria-label="${t(SWATCH_LABELS[c])}"></button>`).join("")}</div>
    ${SLOTS.map(slot).join("")}<p class="bd-note">${t("Earn stickers and ranks to unlock more things for your buddy.")}</p></div></div></section>`;
}
