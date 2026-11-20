/* The Language Page app (Capacitor shell). Loaded on every page, does NOTHING in a browser: the modules below are
   fetched only when the page runs inside the iPhone / Android app. See native-app/boot.js. */
(function () {
  var cap = window.Capacitor;
  if (!(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform())) return;
  import("/access-practice-lab/native-app/boot.js").catch(function () {});
})();
