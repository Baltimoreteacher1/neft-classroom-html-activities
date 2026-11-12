// Power Up! battle cast: the player's hero, Mr. Neft Monster's lines, and the hype a right answer earns.

export const HEROES = [
  { id: "bolt", emoji: "🤖", name: "Bolt Bot" },
  { id: "blaze", emoji: "🐉", name: "Blaze" },
  { id: "ace", emoji: "🥷", name: "Ace" },
  { id: "luna", emoji: "🧙", name: "Luna" },
  { id: "nova", emoji: "🚀", name: "Nova" },
  { id: "pixel", emoji: "🐱", name: "Pixel" },
  { id: "fox", emoji: "🦊", name: "Foxx" },
  { id: "sparkle", emoji: "🦄", name: "Sparkle" },
];

export const heroOf = (id) => HEROES.find((h) => h.id === id) || HEROES[0];

/** Gen Z hype for a right answer. School-safe. */
export const HYPE = [
  "No cap, that's correct! 🧢",
  "Slay! 🔥",
  "It's giving genius. ✨",
  "You understood the assignment! 📝",
  "W move! 🏆",
  "Main character energy! 🎬",
  "Big brain W! 🧠",
  "Ate and left no crumbs! 🍽️",
  "That's bussin'! 💯",
  "Lowkey a math legend. 😎",
  "Living rent free in Mr. Neft's head! 🏠",
  "Sheesh! 🥶",
  "Valid. Very valid. ✅",
  "That was fire! 🔥",
  "Mr. Neft is shook! 😱",
  "GOAT behavior! 🐐",
];

/** Mr. Neft Monster's counterattack lines on a mistake: a jab and a nudge, never the answer. */
export const TAUNTS = [
  "Mr. Neft: Not so fast! 😈",
  "Mr. Neft: Ha! My glitch got you!",
  "Mr. Neft: Nice try, but nope!",
  "Mr. Neft: Is that your final answer? Because it's not mine!",
  "Mr. Neft: Close, but no exponent!",
  "Mr. Neft: The Order Ladder disagrees!",
];

export const pickOf = (list, n) => list[n % list.length];

/** Clean a typed name: letters, digits, spaces and a few marks; 1-14 characters. */
export function cleanName(raw) {
  const s = String(raw || "")
    .replace(/[^\p{L}\p{N} .'_-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 14);
  return s || "Player 1";
}
