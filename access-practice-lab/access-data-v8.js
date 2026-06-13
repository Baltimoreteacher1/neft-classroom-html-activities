/* access-data-v8.js — Picture scenes.
   Patches existing picture-dependent activities with a `scene` field (a clear
   emoji visual) so "describe/look at the picture" tasks actually show a picture.
   Applied by mergeV8() in app.js, which sets activity.scene by id. */
window.ACCESS_LAB_V8 = {
  scenes: {
    "speak-describe-picture": "🙋‍♀️ 🧑‍🏫 🏫",
    "sv5-describe-classroom-emoji": "🏫 📚 🖊️ 🪑",
    "sv5-compare-two-pets": "🐕 🐈",
    "sv5-describe-lunch-tray": "🍎 🥪 🥛 🥕",
    "v7-spk-a-describe-classroom-picture": "🧑‍🏫 📋 🧑‍🎓 🪑 🕐",
    "sv5-explain-water-cycle": "☀️ 💧 ☁️ 🌧️",
    "sv5-compare-graphs": "📊 📊",
    "sv5-describe-science-experiment": "🧪 🔬 🥽 📏",
    "v3-s-a-1": "🌳 🏞️ 🦆 ⛲",
    "v3-w-a-1": "🏫 🪑 📚 🖍️",
  },
};
