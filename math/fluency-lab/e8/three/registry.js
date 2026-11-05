export const THREE_MODEL_IDS = Object.freeze(["fractionBar", "prismVolume", "balanceScale"]);

const MODULES = Object.freeze({
  fractionBar: () => import("./fraction.js"),
  prismVolume: () => import("./volume.js"),
  balanceScale: () => import("./balance.js"),
});

export async function mountThreeModel(modelId, slot, options) {
  const load = MODULES[modelId];
  if (!load) return null;
  const module = await load();
  return module.mount(slot, options);
}
