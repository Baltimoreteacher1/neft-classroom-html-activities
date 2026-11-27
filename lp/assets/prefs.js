// Applies saved display settings before first paint (no flash). Loaded synchronously in <head>; keep it tiny.
(function () {
  var d = document.documentElement;
  var p = {};
  try {
    p = JSON.parse(localStorage.getItem("lp:display") || "{}") || {};
  } catch (e) {}
  if (p.size && /^(16|18|21|24)$/.test(p.size)) d.style.setProperty("--fs-base", p.size + "px");
  if (p.theme === "dark" || p.theme === "contrast") d.setAttribute("data-theme", p.theme);
  if (p.font === "readable") d.setAttribute("data-font", "readable");
  if (p.spacing === "roomy") d.setAttribute("data-spacing", "roomy");
  if (p.tapHear === "on") d.setAttribute("data-tap-hear", "on");
  var lang = "";
  try {
    lang = new URLSearchParams(location.search).get("lang") || localStorage.getItem("lp:lang") || "";
  } catch (e) {}
  if (lang === "es") d.setAttribute("data-ui-lang", "es");
})();
