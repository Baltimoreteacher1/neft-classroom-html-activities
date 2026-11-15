/** Lab-specific enhancements included when their pages are regenerated. */
export function labAssets(id) {
  if (id === "expression-remix") {
    return {
      head: '<link rel="stylesheet" href="/curriculum/learning-labs/expression-remix/expression-factory.css">',
      body: "",
    };
  }
  if (id === "hundred-square-studio") {
    return {
      head: '<link rel="stylesheet" href="/curriculum/learning-labs/hundred-square-studio/power-grid.css">',
      body: "",
    };
  }
  if (id === "packaging-workshop") {
    return {
      head: '<link rel="stylesheet" href="/curriculum/learning-labs/packaging-workshop/district-design.css">',
      body: "",
    };
  }
  if (id === "mixture-matchup") {
    return {
      head: '<link rel="stylesheet" href="/curriculum/learning-labs/mixture-matchup/delivery-network.css">',
      body: "",
    };
  }
  if (id !== "power-plant") return { head: "", body: "" };
  const path = "/curriculum/learning-labs/power-plant/";
  return {
    head: `<link rel="stylesheet" href="${path}machine.css">`,
    body: `<script type="module" src="${path}machine.mjs"></script>`,
  };
}
