// Avatar pieces and world scenes earned by finishing academic missions (Duolingo Adventures model). `icon` names a symbol in pictures/ui-icons.svg.
//
// Each finished mission unlocks one avatar piece named after it; finishing 1, 3, 5 and 7 missions opens the
// four Language World scenes as avatar backdrops. Unlocks are cosmetic and stay on this device: every lesson,
// support and world stays open to everyone, nothing is bought, nothing is random, and nobody is compared.
// A mission counts once it is marked done in the studio state (src/lang/studio.js missionState).

const s = (en, es) => ({ en, es });

export const AVATAR_ITEMS = [
  {
    id: "bike-helmet",
    mission: "bike-lane-budget",
    icon: "road",
    name: s("Bike helmet", "Casco de bicicleta"),
  },
  {
    id: "captain-hat",
    mission: "harbor-petition",
    icon: "flag",
    name: s("Harbor captain's hat", "Gorra de capitán del puerto"),
  },
  {
    id: "lantern",
    mission: "lighthouse-letters",
    icon: "bulb",
    name: s("Lighthouse lantern", "Linterna del faro"),
  },
  {
    id: "press-pass",
    mission: "newsroom-debate",
    icon: "evidence",
    name: s("Press pass", "Credencial de prensa"),
  },
  {
    id: "garden-gloves",
    mission: "saving-the-school-garden",
    icon: "growth",
    name: s("Garden gloves", "Guantes de jardín"),
  },
  {
    id: "sun-visor",
    mission: "shade-for-outdoor-learning",
    icon: "sparkle",
    name: s("Sun visor", "Visera para el sol"),
  },
  {
    id: "space-suit",
    mission: "space-colony",
    icon: "worlds",
    name: s("Space suit", "Traje espacial"),
  },
  {
    id: "rain-boots",
    mission: "watershed-mystery",
    icon: "wave",
    name: s("Rain boots", "Botas de lluvia"),
  },
  {
    id: "reading-cape",
    mission: "welcoming-reading-nook",
    icon: "reading",
    name: s("Reading cape", "Capa de lectura"),
  },
];

export const WORLD_SCENES = [
  { id: "signal-station", need: 1, name: s("Signal Station", "Estación de Señales") },
  { id: "evidence-city", need: 3, name: s("Evidence City", "Ciudad de la Evidencia") },
  { id: "conversation-quest", need: 5, name: s("Conversation Quest", "Aventura de Conversación") },
  { id: "storyworks", need: 7, name: s("Storyworks", "Taller de Historias") },
];

export const AVATAR_IDS = AVATAR_ITEMS.map((i) => i.id);
export const SCENE_IDS = WORLD_SCENES.map((w) => w.id);

/** Finished mission ids from the studio state. */
export const finishedMissions = (studio) =>
  Object.entries(studio?.missions || {})
    .filter(([, m]) => m && m.done === true)
    .map(([id]) => id);

/** Every piece and scene with its unlocked state, plus the count that drives the scenes. */
export function unlocks(studio) {
  const done = new Set(finishedMissions(studio));
  const count = AVATAR_ITEMS.filter((i) => done.has(i.mission)).length;
  return {
    count,
    items: AVATAR_ITEMS.map((i) => ({ ...i, unlocked: done.has(i.mission) })),
    scenes: WORLD_SCENES.map((w) => ({ ...w, unlocked: count >= w.need })),
  };
}

/** The saved look, kept only when it is still a known, unlocked choice. */
export function normalizeLook(raw, studio) {
  const u = unlocks(studio);
  const item = u.items.find((i) => i.id === raw?.item && i.unlocked)?.id || "";
  const scene = u.scenes.find((w) => w.id === raw?.scene && w.unlocked)?.id || "";
  return { item, scene };
}

/** Reads the look's shape only (no studio): used where prefs are normalized. */
export const cleanLook = (raw) => ({
  item: AVATAR_IDS.includes(raw?.item) ? raw.item : "",
  scene: SCENE_IDS.includes(raw?.scene) ? raw.scene : "",
});
