// The WIDA domains each Adventure World practices: the union of its missions' `domains`, in mission order.
// lab/meta.js reads this instead of the worlds themselves, because meta.js is on the app's entry chain and the seven
// world files (~110 KB compressed) would otherwise download on every page, the home page included. Derived data:
// tools/access-world-domains.test.mjs recomputes it from worlds/index.js and fails, printing the right table, on drift.
export const WORLD_DOMAINS = Object.freeze({
  "mystery-museum": ["Reading", "Writing", "Listening", "Speaking"],
  "science-island": ["Reading", "Writing", "Listening", "Speaking"],
  "city-of-conversations": ["Listening", "Reading", "Speaking", "Writing"],
  "newsroom-studio": ["Listening", "Reading", "Writing"],
  "community-design-lab": ["Reading", "Writing", "Listening", "Speaking"],
  storyverse: ["Listening", "Reading", "Writing", "Speaking"],
  "lost-city": ["Listening", "Reading", "Writing", "Speaking"],
});
