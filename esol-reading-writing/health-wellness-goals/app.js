/* Goal Adventure: Health & Wellness — What Are Your Goals?
   Grade 3 choose-your-own-adventure. Vanilla JS, self-contained.
   Theme: Responsible Decision Making (Studies Weekly Grade 3, Week 26). */
(function () {
  "use strict";

  /* ---------------- Read-aloud (guarded) ---------------- */
  var synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  function speak(text, lang) {
    if (!synth || !text) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US";
      u.rate = 0.92;
      u.pitch = 1.05;
      // Prefer a matching-language voice if available.
      var voices = synth.getVoices() || [];
      var match = voices.find(function (v) {
        return v.lang && v.lang.toLowerCase().indexOf(lang.slice(0, 2)) === 0;
      });
      if (match) u.voice = match;
      synth.speak(u);
    } catch (e) {
      /* no-op */
    }
  }
  // Warm up voice list (some browsers load async).
  if (synth && typeof synth.getVoices === "function") {
    synth.getVoices();
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", function () {
        synth.getVoices();
      });
    }
  }

  /* Helper: a 🔊 button that says EN then (on second tap) ES, or both. */
  function sayBtn(en, es) {
    var b = document.createElement("button");
    b.className = "say";
    b.type = "button";
    b.textContent = "🔊";
    b.setAttribute("aria-label", "Read aloud / Leer en voz alta");
    b.title = "Read aloud · Leer en voz alta";
    var toggle = 0;
    b.addEventListener("click", function () {
      if (!es) {
        speak(en, "en-US");
        return;
      }
      if (toggle % 2 === 0) speak(en, "en-US");
      else speak(es, "es-ES");
      toggle++;
    });
    return b;
  }

  /* Wire up any static [data-say-en] buttons in the HTML. */
  function wireStaticSay(root) {
    (root || document)
      .querySelectorAll(".say[data-say-en]")
      .forEach(function (b) {
        if (b.__wired) return;
        b.__wired = true;
        var t = 0;
        b.addEventListener("click", function () {
          var en = b.getAttribute("data-say-en");
          var es = b.getAttribute("data-say-es");
          if (!es) {
            speak(en, "en-US");
            return;
          }
          if (t % 2 === 0) speak(en, "en-US");
          else speak(es, "es-ES");
          t++;
        });
      });
  }

  /* ---------------- DOM helpers ---------------- */
  function el(tag, opts) {
    var n = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) n.className = opts.cls;
    if (opts.html != null) n.innerHTML = opts.html;
    if (opts.text != null) n.textContent = opts.text;
    if (opts.attrs)
      Object.keys(opts.attrs).forEach(function (k) {
        n.setAttribute(k, opts.attrs[k]);
      });
    return n;
  }

  /* Bilingual instruction block with read-aloud. */
  function bilingual(en, es) {
    var box = el("div", { cls: "bilingual" });
    var rowEn = el("div", { cls: "en" });
    rowEn.appendChild(el("span", { cls: "flag", text: "🇺🇸" }));
    rowEn.appendChild(el("p", { text: en }));
    rowEn.appendChild(sayBtn(en, null));
    var rowEs = el("div", { cls: "es" });
    rowEs.appendChild(el("span", { cls: "flag", text: "🇪🇸" }));
    rowEs.appendChild(el("p", { text: es }));
    var esBtn = sayBtn(es, null);
    esBtn.title = "Leer en español";
    rowEs.appendChild(esBtn);
    box.appendChild(rowEn);
    box.appendChild(rowEs);
    return box;
  }

  /* ---------------- Progress state ---------------- */
  var STORAGE = "neft_health_goals_adventure_v1";
  var state = load();
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { done: {}, stars: 0 };
  }
  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch (e) {}
  }

  /* ---------------- Confetti (motion-safe) ---------------- */
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function confetti() {
    if (reduceMotion) return;
    var emojis = ["⭐", "🎉", "🌟", "💚", "🥳", "🌈"];
    for (var i = 0; i < 26; i++) {
      var c = el("div", { cls: "confetti", text: emojis[i % emojis.length] });
      c.style.left = Math.random() * 100 + "vw";
      c.style.animationDuration = 2 + Math.random() * 2 + "s";
      c.style.animationDelay = Math.random() * 0.6 + "s";
      document.body.appendChild(c);
      (function (node) {
        setTimeout(function () {
          node.remove();
        }, 4500);
      })(c);
    }
  }

  /* ---------------- STOP DEFINITIONS ---------------- */
  /* Each stop: id, emoji, title (EN), titleEs, type label, build(container, complete) */
  var STOPS = [
    {
      id: "garden",
      emoji: "🌱",
      title: "Goal Garden",
      titleEs: "Jardín de metas",
      typeLabel: "Build a goal",
      build: buildGoalGarden,
    },
    {
      id: "cafe",
      emoji: "🥗",
      title: "Healthy Choices Café",
      titleEs: "Café de opciones sanas",
      typeLabel: "Drag to sort",
      build: buildCafe,
    },
    {
      id: "forest",
      emoji: "🌳",
      title: "Feelings Forest",
      titleEs: "Bosque de sentimientos",
      typeLabel: "Pick the feeling",
      build: buildFeelings,
    },
    {
      id: "crossroads",
      emoji: "🚦",
      title: "Decision Crossroads",
      titleEs: "Cruce de decisiones",
      typeLabel: "Choose & see why",
      build: buildCrossroads,
    },
    {
      id: "match",
      emoji: "🧩",
      title: "Word Match Meadow",
      titleEs: "Pradera de palabras",
      typeLabel: "Tap to match",
      build: buildWordMatch,
    },
    {
      id: "steps",
      emoji: "🪜",
      title: "Step-by-Step Hill",
      titleEs: "Colina paso a paso",
      typeLabel: "Put in order",
      build: buildOrderSteps,
    },
    {
      id: "reading",
      emoji: "📖",
      title: "Story Pond",
      titleEs: "Estanque del cuento",
      typeLabel: "Read & answer",
      build: buildReading,
    },
    {
      id: "falls",
      emoji: "🤝",
      title: "Friendship Falls",
      titleEs: "Cascada de amistad",
      typeLabel: "Choose & see why",
      build: buildFriendship,
    },
  ];

  var hub = document.getElementById("hub");
  var stage = document.getElementById("stage");
  var mapGrid = document.getElementById("mapGrid");

  /* ---------------- Render hub ---------------- */
  function renderHub() {
    mapGrid.innerHTML = "";
    STOPS.forEach(function (stop, i) {
      var card = el("button", {
        cls: "stop" + (state.done[stop.id] ? " done" : ""),
      });
      card.type = "button";
      card.setAttribute("role", "listitem");
      card.setAttribute(
        "aria-label",
        stop.title +
          ". " +
          stop.typeLabel +
          (state.done[stop.id] ? ". Done, star earned." : "."),
      );
      card.innerHTML =
        '<span class="badge-star" aria-hidden="true">⭐</span>' +
        '<span class="emoji" aria-hidden="true">' +
        stop.emoji +
        "</span>" +
        "<h3>" +
        stop.title +
        "</h3>" +
        '<p class="es-name">' +
        stop.titleEs +
        "</p>" +
        '<p class="stop-type">' +
        stop.typeLabel +
        "</p>" +
        '<span class="stop-num" aria-hidden="true">Stop ' +
        (i + 1) +
        "/" +
        STOPS.length +
        "</span>";
      if (state.done[stop.id]) {
        card.appendChild(el("span", { cls: "ribbon", text: "DONE ✓" }));
      }
      card.addEventListener("click", function () {
        openStop(stop);
      });
      mapGrid.appendChild(card);
    });
    updateProgress();

    // Show celebration link if all done.
    if (countDone() >= STOPS.length) {
      var cel = el("button", {
        cls: "btn primary",
        text: "🎉 See my celebration! · ¡Ver mi celebración!",
      });
      cel.style.gridColumn = "1 / -1";
      cel.style.fontSize = "1.2rem";
      cel.addEventListener("click", showCelebration);
      mapGrid.appendChild(cel);
    }
  }

  function countDone() {
    return Object.keys(state.done).filter(function (k) {
      return state.done[k];
    }).length;
  }

  function updateProgress() {
    var done = countDone();
    var pct = Math.round((done / STOPS.length) * 100);
    document.getElementById("starCount").textContent = "⭐ " + state.stars;
    var fill = document.getElementById("barFill");
    fill.style.width = pct + "%";
    var bar = fill.parentElement;
    bar.setAttribute("aria-valuenow", String(pct));
    var pt = document.getElementById("progressText");
    if (done === 0)
      pt.textContent =
        "Pick any stop to begin! · ¡Elige una parada para empezar!";
    else if (done >= STOPS.length)
      pt.textContent =
        "You finished every stop! Amazing! · ¡Terminaste todas! ¡Increíble!";
    else
      pt.textContent =
        done +
        " of " +
        STOPS.length +
        " stops done · " +
        done +
        " de " +
        STOPS.length +
        " paradas";
  }

  function showHub() {
    stage.classList.add("hidden");
    stage.innerHTML = "";
    hub.classList.remove("hidden");
    renderHub();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* Open a stop into the stage. */
  function openStop(stop) {
    hub.classList.add("hidden");
    stage.classList.remove("hidden");
    stage.innerHTML = "";

    var screen = el("div", { cls: "screen" });
    var head = el("div", { cls: "screen-head" });
    head.innerHTML =
      '<span class="emoji" aria-hidden="true">' +
      stop.emoji +
      "</span>" +
      "<div><h2>" +
      stop.title +
      '</h2><p class="es-name">' +
      stop.titleEs +
      "</p></div>";
    head.appendChild(sayBtn(stop.title, stop.titleEs));
    screen.appendChild(head);

    var body = el("div");
    screen.appendChild(body);
    stage.appendChild(screen);

    var completed = false;
    function complete() {
      if (completed) return;
      completed = true;
      if (!state.done[stop.id]) {
        state.done[stop.id] = true;
        state.stars += 1;
        save();
      }
      // Footer buttons appear after completion.
      celebrateStop(stop, screen);
    }

    stop.build(body, complete);

    // Back-to-map button always available.
    var nav = el("div", { cls: "btn-row" });
    var back = el("button", {
      cls: "btn ghost",
      text: "🗺️ Back to map · Volver al mapa",
    });
    back.addEventListener("click", showHub);
    nav.appendChild(back);
    screen.appendChild(nav);

    wireStaticSay(stage);
    // Focus the heading for screen readers.
    head.querySelector("h2").setAttribute("tabindex", "-1");
    head.querySelector("h2").focus();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* When a stop is completed: star burst + next-stop suggestion. */
  function celebrateStop(stop, screen) {
    updateProgress();
    confetti();
    var done = el("div", { cls: "feedback good show" });
    done.innerHTML = '<span class="ic" aria-hidden="true">⭐</span>';
    var msg = el("div");
    msg.appendChild(
      el("p", {
        html: "<strong>Great job! You earned a star!</strong>",
        attrs: { style: "margin:0" },
      }),
    );
    msg.appendChild(
      el("p", {
        text: "¡Muy bien! ¡Ganaste una estrella!",
        attrs: { style: "margin:2px 0 0;font-style:italic" },
      }),
    );
    done.appendChild(msg);
    done.appendChild(
      sayBtn(
        "Great job! You earned a star!",
        "¡Muy bien! Ganaste una estrella.",
      ),
    );
    screen.insertBefore(done, screen.querySelector(".btn-row"));

    // Add a "next stop" button.
    var nav = screen.querySelector(".btn-row");
    var next = findNextUndone(stop.id);
    if (next) {
      var nb = el("button", {
        cls: "btn primary",
        text: "Next stop: " + next.title + " " + next.emoji,
      });
      nb.addEventListener("click", function () {
        openStop(next);
      });
      nav.insertBefore(nb, nav.firstChild);
    } else {
      var cb = el("button", {
        cls: "btn primary",
        text: "🎉 Celebration time!",
      });
      cb.addEventListener("click", showCelebration);
      nav.insertBefore(cb, nav.firstChild);
    }
    done.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
  }

  function findNextUndone(currentId) {
    var idx = STOPS.findIndex(function (s) {
      return s.id === currentId;
    });
    for (var step = 1; step <= STOPS.length; step++) {
      var s = STOPS[(idx + step) % STOPS.length];
      if (!state.done[s.id]) return s;
    }
    return null;
  }

  /* ---------------- Generic feedback helper ---------------- */
  function feedbackBox() {
    var f = el("div", { cls: "feedback", attrs: { "aria-live": "polite" } });
    return f;
  }
  function showFeedback(f, kind, enText, esText) {
    f.className = "feedback show " + (kind === "good" ? "good" : "try");
    f.innerHTML = "";
    f.appendChild(
      el("span", {
        cls: "ic",
        text: kind === "good" ? "✅" : "💡",
        attrs: { "aria-hidden": "true" },
      }),
    );
    var d = el("div");
    d.appendChild(el("p", { text: enText, attrs: { style: "margin:0" } }));
    if (esText)
      d.appendChild(
        el("p", {
          text: esText,
          attrs: { style: "margin:2px 0 0;font-style:italic" },
        }),
      );
    f.appendChild(d);
    f.appendChild(sayBtn(enText, esText || null));
  }

  /* =================================================================
     STOP 1 — GOAL GARDEN (build-a-goal)
     ================================================================= */
  function buildGoalGarden(root, complete) {
    root.appendChild(
      bilingual(
        "Plant a goal! Pick ONE goal. Then pick THREE steps to reach it.",
        "¡Planta una meta! Elige UNA meta. Luego elige TRES pasos para lograrla.",
      ),
    );

    var goals = [
      { ic: "📚", en: "Read every day", es: "Leer cada día" },
      { ic: "💧", en: "Drink more water", es: "Tomar más agua" },
      { ic: "🏃", en: "Move my body", es: "Mover mi cuerpo" },
      { ic: "😴", en: "Get good sleep", es: "Dormir bien" },
    ];
    var steps = [
      { ic: "📅", en: "Pick a time each day", es: "Elige una hora cada día" },
      { ic: "👀", en: "Make it easy to see", es: "Hazla fácil de ver" },
      { ic: "🙌", en: "Ask family to help", es: "Pide ayuda a tu familia" },
      { ic: "✅", en: "Check it off when done", es: "Márcala cuando termines" },
      { ic: "🎯", en: "Start small", es: "Empieza con poco" },
      { ic: "🎉", en: "Celebrate my wins", es: "Celebra tus logros" },
    ];

    var chosenGoal = null;
    var chosenSteps = [];

    root.appendChild(
      el("p", {
        cls: "prompt",
        html: "<strong>1) Pick your goal · Elige tu meta</strong>",
      }),
    );
    var goalRow = el("div", { cls: "pickrow" });
    goals.forEach(function (g) {
      var b = el("button", {
        cls: "opt",
        attrs: { type: "button", "aria-pressed": "false" },
      });
      b.innerHTML = '<span aria-hidden="true">' + g.ic + "</span> " + g.en;
      b.appendChild(sayBtn(g.en, g.es));
      b.addEventListener("click", function () {
        goalRow.querySelectorAll(".opt").forEach(function (o) {
          o.setAttribute("aria-pressed", "false");
        });
        b.setAttribute("aria-pressed", "true");
        chosenGoal = g;
        checkReady();
      });
      goalRow.appendChild(b);
    });
    root.appendChild(goalRow);

    root.appendChild(
      el("p", {
        cls: "prompt",
        html: "<strong>2) Pick 3 steps · Elige 3 pasos</strong>",
      }),
    );
    var stepRow = el("div", { cls: "pickrow" });
    steps.forEach(function (s) {
      var b = el("button", {
        cls: "opt",
        attrs: { type: "button", "aria-pressed": "false" },
      });
      b.innerHTML = '<span aria-hidden="true">' + s.ic + "</span> " + s.en;
      b.appendChild(sayBtn(s.en, s.es));
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") === "true";
        if (on) {
          b.setAttribute("aria-pressed", "false");
          chosenSteps = chosenSteps.filter(function (x) {
            return x !== s;
          });
        } else {
          if (chosenSteps.length >= 3) return; // cap at 3
          b.setAttribute("aria-pressed", "true");
          chosenSteps.push(s);
        }
        checkReady();
      });
      stepRow.appendChild(b);
    });
    root.appendChild(stepRow);

    var goBtn = el("button", {
      cls: "btn primary",
      text: "🌷 Grow my goal! · ¡Hacer crecer mi meta!",
      attrs: { disabled: "true" },
    });
    var goalCard = el("div", { cls: "goal-card" });
    root.appendChild(goBtn);
    root.appendChild(goalCard);

    function checkReady() {
      if (chosenGoal && chosenSteps.length === 3)
        goBtn.removeAttribute("disabled");
      else goBtn.setAttribute("disabled", "true");
    }

    goBtn.addEventListener("click", function () {
      if (!chosenGoal || chosenSteps.length !== 3) return;
      var html =
        "<p style='margin:0 0 6px'><strong>🌻 My goal:</strong> " +
        chosenGoal.ic +
        " " +
        chosenGoal.en +
        "</p>";
      html += "<ol style='margin:6px 0 0;padding-left:22px'>";
      chosenSteps.forEach(function (s) {
        html += "<li>" + s.ic + " " + s.en + "</li>";
      });
      html += "</ol>";
      goalCard.innerHTML = html;
      goalCard.classList.add("show");
      goalCard.appendChild(
        sayBtn(
          "My goal is to " +
            chosenGoal.en +
            ". My three steps are: " +
            chosenSteps
              .map(function (s) {
                return s.en;
              })
              .join(", ") +
            ".",
          "Mi meta es " + chosenGoal.es + ".",
        ),
      );
      goBtn.setAttribute("disabled", "true");
      complete();
    });
  }

  /* =================================================================
     STOP 2 — HEALTHY CHOICES CAFÉ (drag-to-sort, keyboard friendly)
     ================================================================= */
  function buildCafe(root, complete) {
    root.appendChild(
      bilingual(
        "Sort each card. Healthy choices go in the green plate. Less-healthy go in the gray plate.",
        "Clasifica cada tarjeta. Las opciones sanas van en el plato verde. Las menos sanas en el plato gris.",
      ),
    );
    root.appendChild(
      el("p", {
        cls: "hint",
        text: "Tip: drag a card, OR tap a card then tap a plate. · Consejo: arrastra, o toca una tarjeta y luego un plato.",
      }),
    );

    var items = [
      { ic: "🍎", en: "Apple", healthy: true },
      { ic: "💧", en: "Water", healthy: true },
      { ic: "🥕", en: "Carrots", healthy: true },
      { ic: "🛌", en: "Good sleep", healthy: true },
      { ic: "🍭", en: "Lots of candy", healthy: false },
      { ic: "🥤", en: "Soda", healthy: false },
      { ic: "📺", en: "Too much screen", healthy: false },
      { ic: "🍟", en: "Only fries", healthy: false },
    ];

    var tray = el("div", { cls: "tile-grid" });
    var bins = el("div", { cls: "bins" });
    var goodBin = makeBin("Healthy plate", "Plato sano", "🥗", true);
    var badBin = makeBin("Less-healthy plate", "Plato menos sano", "🍩", false);
    bins.appendChild(goodBin.node);
    bins.appendChild(badBin.node);

    var selected = null;
    var placedCount = 0;
    var f = feedbackBox();

    items.forEach(function (it, i) {
      var t = el("div", {
        cls: "tile",
        attrs: {
          tabindex: "0",
          role: "button",
          draggable: "true",
          "aria-label": it.en + ". Tap, then tap a plate.",
        },
      });
      t.dataset.healthy = it.healthy ? "1" : "0";
      t.innerHTML =
        '<span class="ic" aria-hidden="true">' + it.ic + "</span>" + it.en;
      t.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", i);
        e.dataTransfer.effectAllowed = "move";
        selected = t;
      });
      t.addEventListener("click", function () {
        selectTile(t);
      });
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectTile(t);
        }
      });
      tray.appendChild(t);
    });

    root.appendChild(tray);
    root.appendChild(bins);
    root.appendChild(f);

    function selectTile(t) {
      if (t.classList.contains("placed")) return;
      tray.querySelectorAll(".tile").forEach(function (x) {
        x.classList.remove("selected");
      });
      if (selected === t) {
        selected = null;
        return;
      }
      selected = t;
      t.classList.add("selected");
    }

    function makeBin(en, es, ic, isHealthy) {
      var node = el("div", {
        cls: "bin",
        attrs: { role: "group", "aria-label": en },
      });
      node.innerHTML =
        '<h4><span aria-hidden="true">' +
        ic +
        "</span> " +
        en +
        ' <span style="font-size:.8rem;color:#888">/ ' +
        es +
        "</span></h4>";
      var list = el("div", { cls: "drop-list" });
      node.appendChild(list);
      node.addEventListener("dragover", function (e) {
        e.preventDefault();
        node.classList.add("over");
      });
      node.addEventListener("dragleave", function () {
        node.classList.remove("over");
      });
      node.addEventListener("drop", function (e) {
        e.preventDefault();
        node.classList.remove("over");
        if (selected) place(selected, isHealthy, list);
      });
      node.addEventListener("click", function () {
        if (selected) place(selected, isHealthy, list);
      });
      return { node: node, list: list, isHealthy: isHealthy };
    }

    function place(tile, binHealthy, list) {
      var correct = (tile.dataset.healthy === "1") === binHealthy;
      if (!correct) {
        tile.classList.add("wrong");
        setTimeout(function () {
          tile.classList.remove("wrong");
        }, 450);
        showFeedback(
          f,
          "try",
          "Hmm, try the other plate! Think: does it help my body grow strong?",
          "Mmm, prueba el otro plato. Piensa: ¿ayuda a mi cuerpo a crecer fuerte?",
        );
        return;
      }
      tile.classList.remove("selected");
      tile.classList.add("placed");
      var mini = el("span", { cls: "mini", html: tile.innerHTML });
      list.appendChild(mini);
      selected = null;
      placedCount++;
      showFeedback(
        f,
        "good",
        "Yes! Good sorting.",
        "¡Sí! Buena clasificación.",
      );
      if (placedCount === items.length) {
        showFeedback(
          f,
          "good",
          "You sorted them all! Healthy choices help us reach our goals.",
          "¡Las clasificaste todas! Las opciones sanas nos ayudan a lograr nuestras metas.",
        );
        complete();
      }
    }
  }

  /* =================================================================
     STOP 3 — FEELINGS FOREST (pick-the-feeling)
     ================================================================= */
  function buildFeelings(root, complete) {
    root.appendChild(
      bilingual(
        "Read each little story. Tap the feeling that matches. Then see a calm-down idea!",
        "Lee cada cuento corto. Toca el sentimiento que va. ¡Luego mira una idea para calmarte!",
      ),
    );

    var rounds = [
      {
        story: "Maria worked hard and finished her reading goal.",
        storyEs: "María se esforzó y terminó su meta de lectura.",
        answer: "proud",
        tip: "When you feel proud, smile and say: 'I did it!'",
        tipEs: "Cuando te sientes orgulloso, sonríe y di: '¡Lo logré!'",
      },
      {
        story: "Sam lost the game and feels upset inside.",
        storyEs: "Sam perdió el juego y se siente molesto.",
        answer: "frustrated",
        tip: "When you feel frustrated, take 3 slow breaths. Breathe in... and out.",
        tipEs:
          "Cuando te sientes frustrado, respira 3 veces despacio. Inhala... y exhala.",
      },
      {
        story: "It is the first day at a new school. Lin's tummy feels jumpy.",
        storyEs:
          "Es el primer día en una escuela nueva. A Lin le tiembla la pancita.",
        answer: "nervous",
        tip: "When you feel nervous, find one friendly face and say hello.",
        tipEs: "Cuando estás nervioso, busca una cara amable y saluda.",
      },
    ];
    var feelings = [
      { id: "proud", ic: "😄", en: "Proud", es: "Orgulloso" },
      { id: "frustrated", ic: "😣", en: "Frustrated", es: "Frustrado" },
      { id: "nervous", ic: "😟", en: "Nervous", es: "Nervioso" },
    ];

    var idx = 0;
    var area = el("div");
    root.appendChild(area);
    var f = feedbackBox();
    root.appendChild(f);

    renderRound();

    function renderRound() {
      area.innerHTML = "";
      var r = rounds[idx];
      var p = el("div", { cls: "passage" });
      p.appendChild(el("span", { text: r.story }));
      p.appendChild(sayBtn(r.story, r.storyEs));
      p.appendChild(
        el("p", {
          text: r.storyEs,
          attrs: {
            style:
              "margin:6px 0 0;color:#7c5cbf;font-style:italic;font-size:.95rem",
          },
        }),
      );
      area.appendChild(p);
      area.appendChild(
        el("p", {
          cls: "prompt",
          html: "<strong>How does this person feel? · ¿Cómo se siente?</strong>",
        }),
      );

      var grid = el("div", { cls: "tile-grid" });
      feelings.forEach(function (fe) {
        var b = el("button", {
          cls: "tile",
          attrs: { type: "button", "aria-label": fe.en },
        });
        b.innerHTML =
          '<span class="ic" aria-hidden="true">' +
          fe.ic +
          "</span>" +
          fe.en +
          '<br><span style="font-size:.8rem;color:#7c5cbf">' +
          fe.es +
          "</span>";
        b.addEventListener("click", function () {
          pick(fe, b, grid);
        });
        grid.appendChild(b);
      });
      area.appendChild(grid);
      f.className = "feedback";
    }

    function pick(fe, btn, grid) {
      var r = rounds[idx];
      if (fe.id === r.answer) {
        btn.classList.add("matched");
        grid.querySelectorAll(".tile").forEach(function (t) {
          t.disabled = true;
        });
        showFeedback(f, "good", "Yes! " + r.tip, "¡Sí! " + r.tipEs);
        idx++;
        if (idx >= rounds.length) {
          setTimeout(function () {
            showFeedback(
              f,
              "good",
              "You named every feeling! Naming feelings helps us calm down.",
              "¡Nombraste cada sentimiento! Nombrar lo que sentimos nos ayuda a calmarnos.",
            );
            complete();
          }, 1200);
        } else {
          var nb = el("button", {
            cls: "btn primary",
            text: "Next story · Siguiente cuento",
          });
          nb.style.marginTop = "10px";
          nb.addEventListener("click", function () {
            renderRound();
          });
          f.appendChild(nb);
        }
      } else {
        btn.classList.add("wrong");
        setTimeout(function () {
          btn.classList.remove("wrong");
        }, 450);
        showFeedback(
          f,
          "try",
          "Read the story again. How is the body feeling?",
          "Lee el cuento otra vez. ¿Cómo se siente el cuerpo?",
        );
      }
    }
  }

  /* =================================================================
     STOP 4 — DECISION CROSSROADS (branching scenario)
     ================================================================= */
  function buildCrossroads(root, complete) {
    buildBranching(root, complete, {
      en: "You see trash on the playground floor. What is the responsible choice?",
      es: "Ves basura en el patio. ¿Cuál es la decisión responsable?",
      choices: [
        {
          ic: "🗑️",
          en: "Pick it up and put it in the bin.",
          good: true,
          fbEn: "Great choice! Taking care of our space is responsible. It helps everyone.",
          fbEs: "¡Buena decisión! Cuidar nuestro espacio es responsable. Ayuda a todos.",
        },
        {
          ic: "🙈",
          en: "Walk away and ignore it.",
          good: false,
          fbEn: "Hmm. If we all walk away, the mess stays. A responsible friend helps clean up.",
          fbEs: "Mmm. Si todos nos vamos, el desorden queda. Un amigo responsable ayuda a limpiar.",
        },
        {
          ic: "👉",
          en: "Kick it to someone else.",
          good: false,
          fbEn: "That makes a bigger mess. The responsible choice helps, not hurts.",
          fbEs: "Eso hace más desorden. La decisión responsable ayuda, no estorba.",
        },
      ],
    });
  }

  /* =================================================================
     STOP 8 — FRIENDSHIP FALLS (branching scenario)
     ================================================================= */
  function buildFriendship(root, complete) {
    buildBranching(root, complete, {
      en: "A new student is sitting alone at lunch. What is the kind choice?",
      es: "Un estudiante nuevo está solo en el almuerzo. ¿Cuál es la decisión amable?",
      choices: [
        {
          ic: "🤗",
          en: "Invite them to sit with you.",
          good: true,
          fbEn: "Wonderful! Being a good friend means including others. You made their day brighter!",
          fbEs: "¡Maravilloso! Ser buen amigo es incluir a los demás. ¡Les alegraste el día!",
        },
        {
          ic: "😶",
          en: "Say nothing.",
          good: false,
          fbEn: "It is okay to feel shy. But a small 'hi' can help a lot. Try inviting them next time.",
          fbEs: "Está bien ser tímido. Pero un pequeño 'hola' ayuda mucho. Invítalo la próxima vez.",
        },
        {
          ic: "👀",
          en: "Laugh with friends about them.",
          good: false,
          fbEn: "Ouch — that can hurt feelings. A good friend is kind, even to new people.",
          fbEs: "Ay, eso puede lastimar. Un buen amigo es amable, también con los nuevos.",
        },
      ],
    });
  }

  /* Shared branching builder. */
  function buildBranching(root, complete, data) {
    root.appendChild(bilingual(data.en, data.es));
    var prompt = el("div", { cls: "passage" });
    prompt.appendChild(el("span", { text: data.en }));
    prompt.appendChild(sayBtn(data.en, data.es));
    root.appendChild(prompt);

    var choices = el("div", { cls: "choices" });
    var f = feedbackBox();
    var resolved = false;

    data.choices.forEach(function (c) {
      var b = el("button", { cls: "choice", attrs: { type: "button" } });
      b.innerHTML =
        '<span class="ic" aria-hidden="true">' +
        c.ic +
        "</span><span>" +
        c.en +
        "</span>";
      b.appendChild(sayBtn(c.en, null));
      b.addEventListener("click", function () {
        choices.querySelectorAll(".choice").forEach(function (x) {
          x.classList.remove("good", "meh");
        });
        b.classList.add(c.good ? "good" : "meh");
        showFeedback(f, c.good ? "good" : "try", c.fbEn, c.fbEs);
        if (c.good && !resolved) {
          resolved = true;
          choices.querySelectorAll(".choice").forEach(function (x) {
            x.disabled = true;
          });
          complete();
        }
      });
      choices.appendChild(b);
    });
    root.appendChild(choices);
    root.appendChild(f);
  }

  /* =================================================================
     STOP 5 — WORD MATCH MEADOW (tap-to-match word <-> picture)
     ================================================================= */
  function buildWordMatch(root, complete) {
    root.appendChild(
      bilingual(
        "Tap a word. Then tap the picture that matches it.",
        "Toca una palabra. Luego toca el dibujo que va con ella.",
      ),
    );

    var pairs = [
      { id: "goal", en: "Goal", es: "Meta", ic: "🎯" },
      { id: "healthy", en: "Healthy", es: "Saludable", ic: "🥗" },
      { id: "kind", en: "Kind", es: "Amable", ic: "🤝" },
      { id: "rest", en: "Rest", es: "Descanso", ic: "😴" },
      { id: "feeling", en: "Feeling", es: "Sentimiento", ic: "😊" },
    ];

    var words = pairs.slice();
    var pics = shuffle(pairs.slice());
    var selectedWord = null;
    var matched = 0;
    var f = feedbackBox();

    var cols = el("div", {
      attrs: { style: "display:grid;grid-template-columns:1fr 1fr;gap:14px" },
    });
    var wCol = el("div");
    wCol.appendChild(
      el("p", { cls: "prompt", html: "<strong>Words · Palabras</strong>" }),
    );
    var pCol = el("div");
    pCol.appendChild(
      el("p", { cls: "prompt", html: "<strong>Pictures · Dibujos</strong>" }),
    );

    words.forEach(function (w) {
      var b = el("button", {
        cls: "tile",
        attrs: { type: "button", "aria-label": w.en },
      });
      b.dataset.id = w.id;
      b.style.display = "flex";
      b.style.alignItems = "center";
      b.style.gap = "6px";
      b.style.justifyContent = "center";
      b.style.marginBottom = "10px";
      b.innerHTML =
        "<span>" +
        w.en +
        '<br><span style="font-size:.78rem;color:#7c5cbf">' +
        w.es +
        "</span></span>";
      b.appendChild(sayBtn(w.en, w.es));
      b.addEventListener("click", function () {
        wCol.querySelectorAll(".tile").forEach(function (x) {
          x.classList.remove("selected");
        });
        selectedWord = b;
        b.classList.add("selected");
      });
      wCol.appendChild(b);
    });

    pics.forEach(function (p) {
      var b = el("button", {
        cls: "tile",
        attrs: { type: "button", "aria-label": "Picture for " + p.en },
      });
      b.dataset.id = p.id;
      b.style.marginBottom = "10px";
      b.innerHTML = '<span class="ic" aria-hidden="true">' + p.ic + "</span>";
      b.addEventListener("click", function () {
        if (!selectedWord) {
          showFeedback(
            f,
            "try",
            "First tap a word on the left.",
            "Primero toca una palabra a la izquierda.",
          );
          return;
        }
        if (selectedWord.dataset.id === p.id) {
          selectedWord.classList.add("matched");
          selectedWord.disabled = true;
          b.classList.add("matched");
          b.disabled = true;
          selectedWord = null;
          matched++;
          showFeedback(
            f,
            "good",
            "Match! Nice work.",
            "¡Coincide! Buen trabajo.",
          );
          if (matched === pairs.length) {
            showFeedback(
              f,
              "good",
              "You matched every word! You are a vocabulary star.",
              "¡Emparejaste todas las palabras! Eres una estrella del vocabulario.",
            );
            complete();
          }
        } else {
          b.classList.add("wrong");
          setTimeout(function () {
            b.classList.remove("wrong");
          }, 450);
          showFeedback(
            f,
            "try",
            "Not yet — try another picture.",
            "Todavía no, prueba otro dibujo.",
          );
        }
      });
      pCol.appendChild(b);
    });

    cols.appendChild(wCol);
    cols.appendChild(pCol);
    root.appendChild(cols);
    root.appendChild(f);
  }

  /* =================================================================
     STOP 6 — STEP-BY-STEP HILL (put steps in order)
     ================================================================= */
  function buildOrderSteps(root, complete) {
    root.appendChild(
      bilingual(
        "These steps to reach a goal are mixed up. Put them in order: 1, 2, 3, 4. Use the arrows or drag.",
        "Estos pasos para lograr una meta están mezclados. Ponlos en orden: 1, 2, 3, 4. Usa las flechas o arrastra.",
      ),
    );

    var correct = [
      { ic: "💡", en: "Choose a goal", es: "Elige una meta" },
      { ic: "📝", en: "Make a small plan", es: "Haz un plan pequeño" },
      {
        ic: "💪",
        en: "Try a little every day",
        es: "Intenta un poco cada día",
      },
      {
        ic: "🎉",
        en: "Celebrate when you do it",
        es: "Celebra cuando lo logres",
      },
    ];
    var order = shuffle(correct.slice());
    // Make sure it is not already correct.
    if (sameOrder(order, correct)) order.reverse();

    var f = feedbackBox();
    var list = el("ol", {
      cls: "order-list",
      attrs: { "aria-label": "Goal steps to order" },
    });
    root.appendChild(list);
    var checkBtn = el("button", {
      cls: "btn primary",
      text: "Check my order · Revisar mi orden",
    });
    root.appendChild(checkBtn);
    root.appendChild(f);

    function render() {
      list.innerHTML = "";
      order.forEach(function (item, i) {
        var li = el("li", {
          cls: "order-item",
          attrs: { draggable: "true", "aria-label": item.en },
        });
        li.dataset.en = item.en;
        li.innerHTML =
          '<span class="num" aria-hidden="true">' +
          (i + 1) +
          "</span>" +
          '<span aria-hidden="true">' +
          item.ic +
          "</span>" +
          "<span>" +
          item.en +
          ' <span style="font-size:.8rem;color:#7c5cbf">/ ' +
          item.es +
          "</span></span>";
        li.appendChild(sayBtn(item.en, item.es));
        var arrows = el("span", { cls: "arrows" });
        var up = el("button", {
          attrs: { type: "button", "aria-label": "Move up" },
          text: "▲",
        });
        var dn = el("button", {
          attrs: { type: "button", "aria-label": "Move down" },
          text: "▼",
        });
        up.addEventListener("click", function () {
          move(i, -1);
        });
        dn.addEventListener("click", function () {
          move(i, 1);
        });
        arrows.appendChild(up);
        arrows.appendChild(dn);
        li.appendChild(arrows);

        li.addEventListener("dragstart", function (e) {
          e.dataTransfer.setData("text/plain", i);
          dragIndex = i;
        });
        li.addEventListener("dragover", function (e) {
          e.preventDefault();
          li.classList.add("over");
        });
        li.addEventListener("dragleave", function () {
          li.classList.remove("over");
        });
        li.addEventListener("drop", function (e) {
          e.preventDefault();
          li.classList.remove("over");
          dropOn(i);
        });
        list.appendChild(li);
      });
    }
    var dragIndex = null;
    function dropOn(target) {
      if (dragIndex == null || dragIndex === target) return;
      var moved = order.splice(dragIndex, 1)[0];
      order.splice(target, 0, moved);
      dragIndex = null;
      render();
    }
    function move(i, dir) {
      var j = i + dir;
      if (j < 0 || j >= order.length) return;
      var tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
      render();
    }
    render();

    checkBtn.addEventListener("click", function () {
      if (sameOrder(order, correct)) {
        list.querySelectorAll(".order-item").forEach(function (li) {
          li.classList.add("correct");
        });
        showFeedback(
          f,
          "good",
          "Perfect order! That is how we reach a goal: choose, plan, try, celebrate.",
          "¡Orden perfecto! Así se logra una meta: elegir, planear, intentar, celebrar.",
        );
        checkBtn.disabled = true;
        complete();
      } else {
        showFeedback(
          f,
          "try",
          "Almost! Think about what comes FIRST. You choose the goal before you plan.",
          "¡Casi! Piensa qué va PRIMERO. Eliges la meta antes de planear.",
        );
      }
    });

    function sameOrder(a, b) {
      return a.every(function (x, i) {
        return x.en === b[i].en;
      });
    }
  }

  /* =================================================================
     STOP 7 — STORY POND (read-aloud passage + comprehension)
     ================================================================= */
  function buildReading(root, complete) {
    root.appendChild(
      bilingual(
        "Read the short story. Press 🔊 to hear it. Then answer the questions.",
        "Lee el cuento corto. Presiona 🔊 para escucharlo. Luego responde las preguntas.",
      ),
    );

    var storyEn =
      'Diego wanted to ride his bike all by himself. It felt hard at first. He made a plan. Every day after school, he practiced for ten minutes. Some days he wobbled and fell. He took a deep breath and tried again. After two weeks, Diego rode all the way to the park! He felt so proud. "A goal takes time and trying," he said.';
    var storyEs =
      "Diego quería andar en bici solito. Al principio fue difícil. Hizo un plan. Cada día después de la escuela, practicaba diez minutos. Algunos días se tambaleaba y se caía. Respiraba hondo e intentaba otra vez. ¡Después de dos semanas, Diego llegó hasta el parque! Se sintió muy orgulloso.";

    var p = el("div", { cls: "passage" });
    p.appendChild(el("span", { text: storyEn }));
    var sayRow = el("div", {
      attrs: {
        style: "margin-top:8px;display:flex;gap:8px;align-items:center",
      },
    });
    var sEn = sayBtn(storyEn, null);
    sEn.title = "Read in English";
    var sEs = sayBtn(storyEs, null);
    sEs.title = "Leer en español";
    sayRow.appendChild(
      el("span", { text: "🔊 ", attrs: { "aria-hidden": "true" } }),
    );
    sayRow.appendChild(sEn);
    sayRow.appendChild(el("span", { text: "English" }));
    sayRow.appendChild(sEs);
    sayRow.appendChild(el("span", { text: "Español" }));
    p.appendChild(sayRow);
    root.appendChild(p);

    var qs = [
      {
        q: "What goal did Diego have?",
        qEs: "¿Qué meta tenía Diego?",
        opts: [
          { en: "To ride his bike by himself", ok: true },
          { en: "To win a race", ok: false },
          { en: "To buy a new bike", ok: false },
        ],
        bankEn: "ride · bike · by himself",
      },
      {
        q: "What did Diego do when he fell?",
        qEs: "¿Qué hizo Diego cuando se cayó?",
        opts: [
          { en: "He gave up", ok: false },
          { en: "He took a deep breath and tried again", ok: true },
          { en: "He went home for the day", ok: false },
        ],
        bankEn: "deep breath · tried again",
      },
      {
        q: "How did Diego feel at the end?",
        qEs: "¿Cómo se sintió Diego al final?",
        opts: [
          { en: "Proud", ok: true },
          { en: "Angry", ok: false },
          { en: "Bored", ok: false },
        ],
        bankEn: "proud · happy with himself",
      },
    ];

    var qi = 0;
    var area = el("div");
    var f = feedbackBox();
    root.appendChild(area);
    root.appendChild(f);
    renderQ();

    function renderQ() {
      area.innerHTML = "";
      var item = qs[qi];
      var prompt = el("p", { cls: "prompt" });
      prompt.appendChild(el("strong", { text: qi + 1 + ") " + item.q }));
      prompt.appendChild(sayBtn(item.q, item.qEs));
      area.appendChild(prompt);
      area.appendChild(
        el("p", {
          text: item.qEs,
          attrs: { style: "margin:-6px 0 6px;color:#7c5cbf;font-style:italic" },
        }),
      );

      var choices = el("div", { cls: "choices" });
      item.opts.forEach(function (o) {
        var b = el("button", { cls: "choice", attrs: { type: "button" } });
        b.innerHTML =
          '<span class="ic" aria-hidden="true">🔘</span><span>' +
          o.en +
          "</span>";
        b.appendChild(sayBtn(o.en, null));
        b.addEventListener("click", function () {
          if (o.ok) {
            b.classList.add("good");
            choices.querySelectorAll(".choice").forEach(function (x) {
              x.disabled = true;
            });
            qi++;
            if (qi >= qs.length) {
              showFeedback(
                f,
                "good",
                "You answered them all! Great reading. Goals take time and trying — just like Diego.",
                "¡Respondiste todas! Buena lectura. Las metas toman tiempo e intentos, como Diego.",
              );
              complete();
            } else {
              showFeedback(
                f,
                "good",
                "Correct! Keep going.",
                "¡Correcto! Sigue así.",
              );
              var nb = el("button", {
                cls: "btn primary",
                text: "Next question · Siguiente pregunta",
              });
              nb.style.marginTop = "10px";
              nb.addEventListener("click", renderQ);
              f.appendChild(nb);
            }
          } else {
            b.classList.add("meh");
            showFeedback(
              f,
              "try",
              "Look back at the story. The answer is in there!",
              "Mira el cuento otra vez. ¡La respuesta está ahí!",
            );
          }
        });
        choices.appendChild(b);
      });
      area.appendChild(choices);

      var bank = el("div", {
        cls: "wordbank",
        attrs: { "aria-label": "Word bank" },
      });
      bank.appendChild(
        el("span", {
          text: "Word bank: ",
          attrs: { style: "font-weight:700" },
        }),
      );
      item.bankEn.split(" · ").forEach(function (w) {
        bank.appendChild(el("span", { cls: "chip", text: w }));
      });
      area.appendChild(bank);
      f.className = "feedback";
    }
  }

  /* =================================================================
     CELEBRATION
     ================================================================= */
  function showCelebration() {
    hub.classList.add("hidden");
    stage.classList.remove("hidden");
    stage.innerHTML = "";
    var c = el("div", { cls: "screen celebrate" });
    c.innerHTML =
      '<div class="big" aria-hidden="true">🎉🌟🥳</div>' +
      "<h2>You did it, Goal Champion!</h2>" +
      '<p style="font-size:1.2rem;margin:4px 0">¡Lo lograste, Campeón de Metas!</p>' +
      '<p style="font-size:1.3rem;font-weight:800;color:var(--green-deep)">⭐ ' +
      state.stars +
      " stars earned!</p>" +
      '<p style="max-width:560px;margin:10px auto;font-size:1.1rem">You set goals, made healthy choices, named feelings, and made kind, responsible decisions. That is what champions do!</p>' +
      '<p style="max-width:560px;margin:0 auto 16px;font-style:italic;color:#7c5cbf">Pusiste metas, elegiste opciones sanas, nombraste sentimientos y tomaste decisiones amables y responsables. ¡Eso hacen los campeones!</p>';
    var sb = sayBtn(
      "You did it, Goal Champion! You set goals, made healthy choices, named feelings, and made kind, responsible decisions.",
      "Lo lograste, Campeón de Metas. Pusiste metas y tomaste buenas decisiones.",
    );
    c.appendChild(sb);
    var row = el("div", {
      cls: "btn-row",
      attrs: { style: "justify-content:center" },
    });
    var map = el("button", {
      cls: "btn ghost",
      text: "🗺️ Back to map · Volver al mapa",
    });
    map.addEventListener("click", showHub);
    row.appendChild(map);
    c.appendChild(row);
    stage.appendChild(c);
    confetti();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------------- Utils ---------------- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /* ---------------- Reset ---------------- */
  document.getElementById("resetBtn").addEventListener("click", function () {
    state = { done: {}, stars: 0 };
    save();
    showHub();
  });

  /* ---------------- Init ---------------- */
  wireStaticSay(document);
  renderHub();
})();
