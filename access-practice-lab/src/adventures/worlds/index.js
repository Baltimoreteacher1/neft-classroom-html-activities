// Adventure Worlds registry (ADVENTURE-SCHEMA.md), in hub order.
import city from "./city-of-conversations.js";
import design from "./community-design-lab.js";
import lostCity from "./lost-city.js";
import museum from "./mystery-museum.js";
import newsroom from "./newsroom-studio.js";
import island from "./science-island.js";
import storyverse from "./storyverse.js";

export const WORLDS = [museum, island, city, newsroom, design, storyverse, lostCity];
export const worldById = (id) => WORLDS.find((w) => w.id === id) || null;
