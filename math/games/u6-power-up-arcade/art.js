// Mr. Neft Monster — the opponent in every stage, drawn as inline SVG (no image files).
// One body, a new colour and form per stage; bosses wear the crown. Eyes carry .eye so CSS can blink them.

const HUES = [
  "#37e6ff",
  "#7dff6b",
  "#ff9a3c",
  "#ff5fa2",
  "#ffe066",
  "#59a8ff",
  "#7dffd9",
  "#ff7a59",
  "#c8ff4f",
  "#ff4f6e",
];

/** Mr. Neft Monster's form in each of the 15 battles (world × 5 + battle). */
export const FORMS = [
  "Rookie Form",
  "Chalk Dust Form",
  "Homework Form",
  "Pop Quiz Form",
  "WORLD BOSS · Warm-Up Champion",
  "Lava Lamp Form",
  "Pencil Sharpener Form",
  "Calculator Form",
  "Red Pen Form",
  "WORLD BOSS · Volcano King",
  "Pointer Stick Form",
  "Detention Form",
  "Report Card Form",
  "Fire Drill Form",
  "FINAL BOSS · MEGA Mr. Neft",
]

function neft(c, boss) {
  const crown = boss
    ? `<path d="M32 18 L38 2 L49 14 L60 0 L71 14 L82 2 L88 18Z" fill="#ffe066" stroke="#14102b" stroke-width="4" stroke-linejoin="round"/>`
    : `<path d="M30 30 L22 10 L42 22Z M90 30 L98 10 L78 22Z" fill="${c}" stroke="#14102b" stroke-width="4" stroke-linejoin="round"/>`;
  return `<ellipse cx="60" cy="114" rx="36" ry="6" fill="#000" opacity=".35"/>
    ${crown}
    <path d="M18 70 C14 34 34 18 60 18 C86 18 106 34 102 70 C100 96 84 108 60 108 C36 108 20 96 18 70Z" fill="${c}" stroke="#14102b" stroke-width="4"/>
    <ellipse cx="40" cy="36" rx="9" ry="5" fill="#fff" opacity=".35"/>
    <path d="M30 40 L50 46 M90 40 L70 46" stroke="#14102b" stroke-width="5" stroke-linecap="round"/>
    <g class="eye"><circle cx="44" cy="58" r="8" fill="#fff"/><circle cx="46" cy="59" r="4" fill="#14102b"/></g>
    <g class="eye"><circle cx="76" cy="58" r="8" fill="#fff"/><circle cx="78" cy="59" r="4" fill="#14102b"/></g>
    <circle cx="44" cy="58" r="13" fill="none" stroke="#14102b" stroke-width="4"/>
    <circle cx="76" cy="58" r="13" fill="none" stroke="#14102b" stroke-width="4"/>
    <path d="M57 58 H63 M31 56 L20 52 M89 56 L100 52" stroke="#14102b" stroke-width="4" stroke-linecap="round"/>
    <path d="M42 80 Q60 96 78 80 Z" fill="#14102b"/>
    <path d="M48 82 v5 M56 84 v6 M64 84 v6 M72 82 v5" stroke="#fff" stroke-width="3"/>
    <path d="M54 98 L60 104 L66 98 L64 118 L60 122 L56 118Z" fill="${boss ? "#ffe066" : "#ff4f6e"}" stroke="#14102b" stroke-width="3" stroke-linejoin="round"/>
    ${boss ? `<circle cx="24" cy="80" r="4" fill="#14102b"/><circle cx="96" cy="80" r="4" fill="#14102b"/>` : ""}`;
}

/** Mr. Neft Monster for a stage (0-based). */
export function monster(stage, boss) {
  const color = boss ? "#ff4f6e" : HUES[stage % HUES.length];
  return `<svg viewBox="0 0 120 124" role="img" aria-label="Mr. Neft Monster, ${FORMS[stage]}">${neft(color, boss)}</svg>`;
}
