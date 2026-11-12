// Power Up! saved progress on this device only: player name and hero, best scores, badges, XP rank.
// Nothing is sent anywhere. Storage can be blocked; every read and write is guarded.

const STORE = "neft-powerup-v1";

export const save = { best: {}, badges: [], muted: false, xp: 0, name: "", hero: "bolt" };
try {
  Object.assign(save, JSON.parse(localStorage.getItem(STORE) || "{}"));
} catch {
  // Blocked or corrupt storage: start fresh, the game still plays.
}
if (!Array.isArray(save.badges)) save.badges = [];

export function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(save));
  } catch {
    // ignore
  }
}

export const BADGES = [
  { id: "first", icon: "⚡", name: "First Win" },
  { id: "combo8", icon: "🔥", name: "Combo ×8" },
  { id: "bossperfect", icon: "👑", name: "Perfect Boss" },
  { id: "fullsend", icon: "🎯", name: "Full Send" },
  { id: "crystal", icon: "💎", name: "Crystal Keeper" },
  { id: "glitch", icon: "🕵️", name: "Glitch Hunter" },
  { id: "challenger", icon: "🚀", name: "Challenger" },
  { id: "flawless", icon: "🌟", name: "Flawless Run" },
];

/** Award a badge once; returns true the first time. */
export function grant(id) {
  if (save.badges.includes(id)) return false;
  save.badges.push(id);
  return true;
}

const RANKS = [
  [0, "Rookie"],
  [5000, "Spark"],
  [15000, "Charger"],
  [35000, "Power Pro"],
  [70000, "Exponent Legend"],
];

export function rankOf(xp) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
  const [floor, name] = RANKS[i];
  const next = RANKS[i + 1]?.[0] ?? null;
  const pct = next ? Math.round(((xp - floor) / (next - floor)) * 100) : 100;
  return { name, next, pct };
}

export function shelf(box, freshIds = []) {
  box.replaceChildren(
    ...BADGES.map((b) => {
      const on = save.badges.includes(b.id);
      const s = document.createElement("span");
      s.className = `badge${on ? " on" : ""}${freshIds.includes(b.id) ? " fresh" : ""}`;
      s.textContent = `${b.icon} ${b.name}`;
      s.title = on ? "Earned" : "Not earned yet";
      return s;
    }),
  );
}
