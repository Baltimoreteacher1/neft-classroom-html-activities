// Create · a teacher's own saved recipes: a named set of Create choices (format + adjustments) reusable on any page.
// A recipe keeps no content (no words, questions or answers), so nothing from one page leaks into another.
// Local to this device, versioned, never sent anywhere. Pure given `io` ({ get(key), set(key, value) }).

import { cleanAdjust, formatById } from "./build.js";
import { cleanSupports } from "./supports.js";

export const RECIPES_KEY = "accessPracticeLab:v1:create-recipes";
export const RECIPES_SCHEMA = "lp-create-recipes/1";
export const MAX_RECIPES = 20;
const ID = /^r[a-z0-9]{6,16}$/;

const name = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

function clean(r) {
  if (!r || !ID.test(r.id || "") || !formatById(r.format) || !name(r.name)) return null;
  return {
    id: r.id,
    name: name(r.name),
    format: r.format,
    adjust: cleanAdjust(r.adjust),
    supports: cleanSupports(r.supports),
  };
}

/** Saved recipes, newest first. Unreadable or foreign data reads as none (never throws). */
export function listRecipes(io) {
  let raw = null;
  try {
    raw = JSON.parse(io.get(RECIPES_KEY) || "null");
  } catch {
    raw = null;
  }
  if (!raw || raw.schema !== RECIPES_SCHEMA || !Array.isArray(raw.recipes)) return [];
  return raw.recipes.map(clean).filter(Boolean).slice(0, MAX_RECIPES);
}

function write(io, recipes) {
  try {
    io.set(RECIPES_KEY, JSON.stringify({ schema: RECIPES_SCHEMA, recipes }));
    return true;
  } catch {
    return false;
  }
}

const newId = () => `r${Math.random().toString(36).slice(2, 10).padEnd(6, "0")}`;

/**
 * Save (or replace, by the same name) a recipe. @returns {{ok: boolean, recipe?, reason?: "name"|"format"|"storage"}}
 */
export function saveRecipe(io, { name: n, format, adjust, supports }, makeId = newId) {
  const nm = name(n);
  if (!nm) return { ok: false, reason: "name" };
  if (!formatById(format)) return { ok: false, reason: "format" };
  const list = listRecipes(io).filter((r) => r.name.toLowerCase() !== nm.toLowerCase());
  const recipe = clean({ id: makeId(), name: nm, format, adjust, supports });
  if (!recipe) return { ok: false, reason: "format" };
  const next = [recipe, ...list].slice(0, MAX_RECIPES);
  return write(io, next) ? { ok: true, recipe } : { ok: false, reason: "storage" };
}

export function deleteRecipe(io, id) {
  return write(
    io,
    listRecipes(io).filter((r) => r.id !== id),
  );
}
