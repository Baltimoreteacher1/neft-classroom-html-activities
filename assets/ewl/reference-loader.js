/* Loads the Pocket Reference drawer (Ctrl/Cmd+K, plus a button) on pages that do not already carry it.
 * One tag on a page is all it takes: this adds the stylesheet and the scripts in dependency order, once.
 * It does nothing on the curriculum hub (where the cockpit loads the same files itself) or in print. */
(() => {
  if (
    window.__ewlReferenceLoader ||
    document.getElementById("ewl-cockpit") ||
    window.EWL?.Reference
  )
    return;
  window.__ewlReferenceLoader = true;
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/assets/ewl/reference.css";
  document.head.appendChild(css);
  const ewlcss = document.createElement("link");
  ewlcss.rel = "stylesheet";
  ewlcss.href = "/assets/ewl/ewl.css";
  document.head.appendChild(ewlcss);
  const load = (name) =>
    new Promise((ok) => {
      const s = document.createElement("script");
      s.src = `/assets/ewl/${name}.js`;
      s.onload = () => ok(true);
      s.onerror = () => ok(false);
      document.head.appendChild(s);
    });
  (async () => {
    for (const n of ["state-store", "ui", "reference-core", "reference-icons", "reference"])
      if (!(await load(n))) return;
  })();
})();
