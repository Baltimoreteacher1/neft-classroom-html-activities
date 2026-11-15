/** Lab-specific enhancements included when their pages are regenerated. */
export function labAssets(id) {
  if (id !== "power-plant") return { head: "", body: "" };
  const path = "/curriculum/learning-labs/power-plant/";
  return {
    head: `<link rel="stylesheet" href="${path}machine.css">`,
    body: `<script type="module" src="${path}machine.mjs"></script>`,
  };
}
