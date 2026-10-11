// Buddy colors and accessories. Each accessory unlocks with a sticker or a rank, so a buddy's look is always
// something the learner earned. Kept as plain data so the rewards record can validate saved choices.
export const COLORS = {
  blue: "#4a90d9",
  green: "#3fa36b",
  pink: "#e0679a",
  orange: "#f08a3c",
  purple: "#8a5cc8",
  teal: "#2aa7a0",
};

// unlock: { sticker } needs that sticker, { rank } needs that rank index (0 = Trail Starter).
export const ITEMS = [
  { id: "cap", slot: "hat", name: "Explorer cap", hint: "Reach the rank Path Finder", unlock: { rank: 1 } },
  { id: "party", slot: "hat", name: "Party hat", hint: "Finish any game", unlock: { sticker: "first-game" } },
  { id: "wizard", slot: "hat", name: "Wizard hat", hint: "Tell how you solved something 5 times", unlock: { sticker: "thinker" } },
  { id: "crown", slot: "hat", name: "Crown", hint: "Reach the rank Math Legend", unlock: { rank: 4 } },
  { id: "glasses", slot: "face", name: "Round glasses", hint: "Earn 3 stars on a trail round", unlock: { sticker: "three-stars" } },
  { id: "goggles", slot: "face", name: "Goggles", hint: "Win Target Hunt with 3 stars", unlock: { sticker: "hunt-3" } },
  { id: "shades", slot: "face", name: "Sunglasses", hint: "Practice 3 days in a row", unlock: { sticker: "days-3" } },
  { id: "cape", slot: "back", name: "Hero cape", hint: "Beat a trail's boss round", unlock: { sticker: "boss" } },
  { id: "wings", slot: "back", name: "Star wings", hint: "Collect 25 trail stars", unlock: { sticker: "stars-25" } },
  { id: "rocket", slot: "back", name: "Rocket pack", hint: "Practice 7 days in a row", unlock: { sticker: "days-7" } },
];

export const SLOTS = ["hat", "face", "back"];
export const ITEM_IDS = ITEMS.map((item) => item.id);
