// Saved recipes: a teacher's own list of activity structures, kept ON THIS DEVICE only (nothing is sent anywhere).
//   key     accessPracticeLab:v1:studio-recipes   value { v: 1, recipes: [lp-recipe/1, ...] }
// Every recipe enters through normalizeRecipe (sizes capped, unknown fields dropped), so a hand-edited or corrupt
// value can never put anything but a recipe structure into the studio. A recipe holds no topic word, question,
// answer or passage (see x/recipes.js), so a saved list never carries one lesson's content into another.

import { storage } from "../../util.js";
import { normalizeRecipe, recipeFromActivity } from "../x/recipes.js";

export const RECIPES_KEY = "accessPracticeLab:v1:studio-recipes";
export const RECIPES_VERSION = 1;
export const MAX_RECIPES = 20;

const parse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** The saved recipes, newest first. Anything unreadable is ignored, never thrown. */
export function listRecipes(store = storage) {
  const data = parse(store.get(RECIPES_KEY));
  if (!data || data.v !== RECIPES_VERSION || !Array.isArray(data.recipes)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of data.recipes) {
    const r = normalizeRecipe(raw);
    if (!r || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
    if (out.length >= MAX_RECIPES) break;
  }
  return out;
}

function write(store, recipes) {
  const ok = store.set(RECIPES_KEY, JSON.stringify({ v: RECIPES_VERSION, recipes }));
  return ok !== false;
}

/**
 * Save a recipe (a recipe object, or any input normalizeRecipe accepts). A recipe with the same id is replaced.
 * When 20 are saved the new one is refused, never an old one silently dropped.
 * @returns {{ ok: boolean, recipe?: object, recipes: object[], reason?: "invalid" | "full" | "storage" }}
 */
export function saveRecipe(input, store = storage) {
  const recipe = normalizeRecipe(input);
  const current = listRecipes(store);
  if (!recipe) return { ok: false, reason: "invalid", recipes: current };
  const without = current.filter((r) => r.id !== recipe.id);
  if (without.length >= MAX_RECIPES) return { ok: false, reason: "full", recipes: current };
  const recipes = [recipe, ...without];
  if (!write(store, recipes)) return { ok: false, reason: "storage", recipes: current };
  return { ok: true, recipe, recipes };
}

/** Save the structure of an activity under `name`. */
export function saveRecipeFromActivity(activity, name, store = storage) {
  return saveRecipe(recipeFromActivity(activity, name), store);
}

/** Remove one saved recipe. @returns the remaining recipes */
export function deleteRecipe(id, store = storage) {
  const next = listRecipes(store).filter((r) => r.id !== id);
  write(store, next);
  return next;
}
