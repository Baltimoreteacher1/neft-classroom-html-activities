// Adventure Worlds registry (ADVENTURE-SCHEMA.md). Final order is
// [museum, island, city, newsroom, design, storyverse]; the other four worlds
// (city-of-conversations, newsroom-studio, community-design-lab, storyverse) are added in integration.
import museum from "./mystery-museum.js";
import island from "./science-island.js";

export const WORLDS = [museum, island];
export const worldById = (id) => WORLDS.find((w) => w.id === id) || null;
