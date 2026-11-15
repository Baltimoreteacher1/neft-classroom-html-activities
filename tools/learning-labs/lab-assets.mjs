/** Lab-specific enhancements included when their pages are regenerated. */
export function labAssets(id) {
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
