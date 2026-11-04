// Which view draws which model.
import { builderView, ratiotableView } from "./builder.js";
import { fracaddView, fracdivView, fractionView } from "./fractions.js";
import { balanceView } from "./balance.js";
import { areaView, graphView } from "./geometry.js";
import { chipsView, numlineView, placeView, tenframeView } from "./number.js";
import { recipeView } from "./recipe.js";

export const VIEWS = {
  fraction: fractionView,
  fracadd: fracaddView,
  fracdiv: fracdivView,
  balance: balanceView,
  area: areaView,
  graph: graphView,
  place: placeView,
  chips: chipsView,
  tenframe: tenframeView,
  numline: numlineView,
  recipe: recipeView,
  builder: builderView,
  ratiotable: ratiotableView,
};
