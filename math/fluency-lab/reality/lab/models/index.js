// The Mathematical State Engine: every model, by id.
import { builder, balance, graph, ratiotable } from "./algebra.js";
import { fracadd, fracdiv, fraction } from "./fractions.js";
import { area } from "./geometry.js";
import { chips, numline, place, tenframe } from "./number.js";
import { recipe } from "./ratio.js";

export const MODELS = { fraction, fracadd, fracdiv, balance, area, graph, place, chips, tenframe, numline, recipe, builder, ratiotable };
export const modelById = (id) => MODELS[id] || null;
