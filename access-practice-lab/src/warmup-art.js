// Word-card pictures for the Daily Warm-Up: twelve themed scenes drawn in code from a few flat shapes (original
// EduWonderLab art, no image files). A word's picture shows the theme it belongs to, so the learner links the new
// word to a place or a feeling before reading its meaning. Pure strings, no DOM: Node tests import THEMES.
//
// Every scene carries a <title> (and the card names the theme in words), so colour and shape are never the only signal.

const frame = (title, bg, body) =>
  `<svg class="wu-art" viewBox="0 0 240 150" role="img" aria-label="${title}" focusable="false"><title>${title}</title><rect width="240" height="150" rx="14" fill="${bg}"/>${body}</svg>`;
const line = 'stroke="#1d2b58" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';

const DRAW = {
  school: () =>
    frame(
      "Books and a pencil",
      "#dde6f6",
      `<rect x="52" y="78" width="110" height="22" rx="4" fill="#2e4a94" ${line}/><rect x="62" y="56" width="96" height="22" rx="4" fill="#f5d6a8" ${line}/><rect x="72" y="36" width="80" height="20" rx="4" fill="#91e2d6" ${line}/><path d="M176 112 204 54l10 5-28 58-12 2Z" fill="#f2c15b" ${line}/><path d="M174 114l12 3" ${line}/>`,
    ),
  food: () =>
    frame(
      "An apple in a bowl",
      "#fbf0e0",
      `<path d="M60 90h120c0 26-24 40-60 40S60 116 60 90Z" fill="#9a4a26" ${line}/><circle cx="104" cy="66" r="26" fill="#d9503f" ${line}/><circle cx="138" cy="70" r="22" fill="#f2c15b" ${line}/><path d="M104 40c0-8 4-14 10-16" ${line} fill="none"/><path d="M110 34c8-8 18-6 20 0-8 6-16 6-20 0Z" fill="#6aa84f" ${line}/>`,
    ),
  home: () =>
    frame(
      "A house with a door",
      "#e9f2ee",
      `<rect x="62" y="68" width="116" height="62" fill="#f5d6a8" ${line}/><path d="M50 72 120 22l70 50Z" fill="#9a4a26" ${line}/><rect x="104" y="92" width="32" height="38" rx="3" fill="#2e4a94" ${line}/><rect x="72" y="84" width="22" height="20" fill="#cfe9f6" ${line}/><rect x="146" y="84" width="22" height="20" fill="#cfe9f6" ${line}/>`,
    ),
  body: () =>
    frame(
      "An open hand",
      "#f6e3ea",
      `<rect x="92" y="34" width="14" height="52" rx="7" fill="#e0a98a" ${line}/><rect x="110" y="24" width="14" height="60" rx="7" fill="#e0a98a" ${line}/><rect x="128" y="30" width="14" height="56" rx="7" fill="#e0a98a" ${line}/><rect x="146" y="44" width="13" height="44" rx="6" fill="#e0a98a" ${line}/><path d="M92 82h66c4 30-14 50-34 50s-40-16-34-44Z" fill="#e0a98a" ${line}/><path d="M92 90 74 70c-6-6-14 2-9 9l22 30" fill="#e0a98a" ${line}/>`,
    ),
  nature: () =>
    frame(
      "A tree on grass",
      "#dff0e2",
      `<rect x="0" y="112" width="240" height="38" fill="#9cc97a"/><rect x="110" y="70" width="20" height="50" fill="#9a4a26" ${line}/><circle cx="120" cy="52" r="34" fill="#6aa84f" ${line}/><circle cx="92" cy="68" r="22" fill="#7fbf63" ${line}/><circle cx="148" cy="68" r="22" fill="#7fbf63" ${line}/><circle cx="195" cy="38" r="14" fill="#f2c15b" ${line}/>`,
    ),
  weather: () =>
    frame(
      "A sun behind a cloud with rain",
      "#d6e9f6",
      `<circle cx="80" cy="52" r="26" fill="#f2c15b" ${line}/><path d="M70 96a22 22 0 0 1 4-43 30 30 0 0 1 58 6 20 20 0 0 1 2 37Z" fill="#fff" ${line}/><path d="M92 108l-6 16M118 108l-6 16M144 108l-6 16" stroke="#2e4a94" stroke-width="4" stroke-linecap="round"/>`,
    ),
  community: () =>
    frame(
      "Three buildings on a street",
      "#ece6f3",
      `<rect x="30" y="70" width="48" height="60" fill="#2e4a94" ${line}/><rect x="86" y="46" width="52" height="84" fill="#8a3a5c" ${line}/><rect x="146" y="82" width="62" height="48" fill="#9a4a26" ${line}/><g fill="#fbf0e0"><rect x="40" y="82" width="10" height="10"/><rect x="58" y="82" width="10" height="10"/><rect x="96" y="58" width="10" height="10"/><rect x="116" y="58" width="10" height="10"/><rect x="96" y="82" width="10" height="10"/><rect x="116" y="82" width="10" height="10"/><rect x="158" y="94" width="10" height="10"/><rect x="186" y="94" width="10" height="10"/></g><rect x="0" y="130" width="240" height="20" fill="#cfd6e3"/>`,
    ),
  feelings: () =>
    frame(
      "A smiling face",
      "#fbf0e0",
      `<circle cx="120" cy="76" r="48" fill="#f2c15b" ${line}/><circle cx="104" cy="66" r="5" fill="#1d2b58"/><circle cx="136" cy="66" r="5" fill="#1d2b58"/><path d="M98 88c10 16 34 16 44 0" fill="none" ${line}/>`,
    ),
  science: () =>
    frame(
      "A flask with bubbles",
      "#dff4f1",
      `<path d="M104 24h32v34l32 54c4 8-1 16-10 16H82c-9 0-14-8-10-16l32-54Z" fill="#cfe9f6" ${line}/><path d="M86 108h68l10 18H76Z" fill="#91e2d6" ${line}/><circle cx="112" cy="94" r="5" fill="#fff" ${line}/><circle cx="130" cy="82" r="4" fill="#fff" ${line}/><circle cx="124" cy="104" r="3" fill="#fff" ${line}/>`,
    ),
  math: () =>
    frame(
      "A triangle, a square and a circle",
      "#e5eaf7",
      `<path d="M30 118 70 44l40 74Z" fill="#91e2d6" ${line}/><rect x="116" y="58" width="56" height="56" fill="#f5d6a8" ${line}/><circle cx="204" cy="92" r="24" fill="#dba3b9" ${line}/>`,
    ),
  story: () =>
    frame(
      "An open book with a star",
      "#f1e6f0",
      `<path d="M120 46c-18-12-44-14-70-8v78c26-6 52-4 70 8Z" fill="#fff" ${line}/><path d="M120 46c18-12 44-14 70-8v78c-26-6-52-4-70 8Z" fill="#f5d6a8" ${line}/><path d="M120 46v78" ${line}/><path d="m120 14 5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1Z" fill="#f2c15b" ${line}/>`,
    ),
  movement: () =>
    frame(
      "A ball bouncing along a path",
      "#e3f1dd",
      `<path d="M20 120c40-70 80-70 100 0 20-70 60-70 100 0" fill="none" stroke="#2e4a94" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/><circle cx="120" cy="58" r="22" fill="#d9503f" ${line}/><path d="M104 52c10 6 24 6 32 0" fill="none" ${line}/><rect x="0" y="124" width="240" height="26" fill="#9cc97a"/>`,
    ),
};

export const THEMES = Object.keys(DRAW);
export const THEME_NAMES = {
  school: ["School", "Escuela"],
  food: ["Food", "Comida"],
  home: ["Home", "Hogar"],
  body: ["The body", "El cuerpo"],
  nature: ["Nature", "Naturaleza"],
  weather: ["Weather", "El tiempo"],
  community: ["Community", "Comunidad"],
  feelings: ["Feelings", "Sentimientos"],
  science: ["Science", "Ciencias"],
  math: ["Math and shapes", "Matemáticas y formas"],
  story: ["Stories", "Cuentos"],
  movement: ["Moving and playing", "Moverse y jugar"],
};
export const themeSVG = (theme) => (DRAW[theme] || DRAW.story)();
