// Single loader for data/arcade-games.json, the canonical arcade registry.
import { readFileSync } from "node:fs";

const registry = JSON.parse(
  readFileSync(new URL("../../data/arcade-games.json", import.meta.url), "utf8"),
);

export const ARCADE_GAMES = registry.games;
export const ARCADE_SURFACES = registry.surfaces;
export const ARCADE_MODEL_KINDS = [...new Set(registry.games.map((g) => g.model))];
