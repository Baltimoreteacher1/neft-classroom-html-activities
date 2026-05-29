/* ============================================================
   WIDA ACCESS Listening Practice Studio — App Logic
   Neft Teacher · self-contained, no build step, no deps.
   Audio: window.speechSynthesis (en-US). Level 1 speaks slower
   and allows unlimited replay; Level 2 speaks at normal rate.
   ============================================================ */
(function () {
  "use strict";

  /* ── State ── */
  const state = {
    level: 1, // 1 = support, 2 = enrichment
    type: null, // current activity type id
    index: 0, // index within current type+level list
    points: 0,
    streak: 0,
    speaking: false,
    plays: 0,
    answered: false,
  };

  const REDUCED_MOTION =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Speech engine ── */
  const speech = {
    supported: "speechSynthesis" in window,
    voice: null,
    current: null,
  };

  function pickVoice() {
    if (!speech.supported) return;
    const voices = window.speechSynthesis.getVoices() || [];
    speech.voice =
      voices.find(
        (v) => v.lang === "en-US" && /female|samantha|zira|jenny/i.test(v.name),
      ) ||
      voices.find((v) => v.lang === "en-US") ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0] ||
      null;
  }
  if (speech.supported) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }

  function stopSpeech() {
    if (!speech.supported) return;
    window.speechSynthesis.cancel();
    speech.current = null;
    state.speaking = false;
    updatePlayButtons();
  }

  function speak(text, onEnd) {
    if (!speech.supported) {
      announce(
        'Speech is not available on this device. Use the "Show text" button to read the passage.',
      );
      autoShowText();
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    if (speech.voice) u.voice = speech.voice;
    u.rate = state.level === 1 ? 0.78 : 0.95; // slower for Level 1
    u.pitch = 1;
    u.onstart = function () {
      state.speaking = true;
      updatePlayButtons();
    };
    u.onend = function () {
      state.speaking = false;
      speech.current = null;
      updatePlayButtons();
      if (onEnd) onEnd();
    };
    u.onerror = function () {
      state.speaking = false;
      speech.current = null;
      updatePlayButtons();
    };
    speech.current = u;
    state.plays += 1;
    window.speechSynthesis.speak(u);
  }

  /* ── Small DOM helpers ── */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function")
          node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function $(sel) {
    return document.querySelector(sel);
  }
  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  /* ── Live region for screen readers ── */
  function announce(msg) {
    const lr = $("#live-region");
    if (lr) lr.textContent = msg;
  }

  /* ── Scoreboard ── */
  function award(pts) {
    state.points += pts;
    state.streak += 1;
    renderScore(true);
  }
  function breakStreak() {
    state.streak = 0;
    renderScore(false);
  }
  function renderScore(positive) {
    $("#score-points").textContent = state.points;
    $("#score-streak").textContent = state.streak;
    const badge = $("#score-streak-badge");
    badge.style.display = state.streak >= 2 ? "inline-flex" : "none";
    if (positive && !REDUCED_MOTION) {
      const sp = $("#score-points");
      sp.classList.remove("pulse");
      void sp.offsetWidth;
      sp.classList.add("pulse");
    }
  }

  /* ── Feedback banner ── */
  const PRAISE = [
    "Great listening!",
    "You've got it!",
    "Nice work!",
    "Excellent!",
    "Way to go!",
    "Sharp ears!",
  ];
  const ENCOURAGE = [
    "So close — listen again!",
    "Good try! Replay and listen for the clue.",
    "Almost! Tap Replay and try once more.",
    "Not yet — you can do this. Listen again!",
  ];

  function feedback(ok, customMsg) {
    const fb = $("#feedback");
    fb.className = "feedback " + (ok ? "feedback-ok" : "feedback-no");
    const msg =
      customMsg ||
      (ok
        ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
        : ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)]);
    fb.textContent = (ok ? "✓ " : "↻ ") + msg;
    fb.style.display = "block";
    announce(msg);
  }
  function clearFeedback() {
    const fb = $("#feedback");
    if (!fb) return;
    fb.style.display = "none";
    fb.textContent = "";
  }

  /* ── Level + menu ── */
  function setLevel(lvl) {
    state.level = lvl;
    $("#btn-level-1").classList.toggle("active", lvl === 1);
    $("#btn-level-2").classList.toggle("active", lvl === 2);
    $("#btn-level-1").setAttribute("aria-pressed", lvl === 1);
    $("#btn-level-2").setAttribute("aria-pressed", lvl === 2);
    $("#level-note").textContent =
      lvl === 1
        ? "Level 1 · Support — shorter passages, slower speech, word banks, unlimited replay."
        : "Level 2 · Enrichment — longer passages, normal speech, inference & academic vocabulary.";
    stopSpeech();
    if (state.type) {
      state.index = 0;
      loadActivity();
    } else {
      renderMenu();
    }
  }

  function renderMenu() {
    const grid = $("#menu-grid");
    clear(grid);
    LISTENING_TYPES.forEach(function (t) {
      const count =
        ACTIVITIES[t.id] && ACTIVITIES[t.id][state.level]
          ? ACTIVITIES[t.id][state.level].length
          : 0;
      const card = el(
        "button",
        {
          class: "menu-card",
          "aria-label":
            t.title +
            ". " +
            t.blurb +
            " " +
            count +
            " activities at this level.",
          onclick: function () {
            openType(t.id);
          },
        },
        [
          el("span", {
            class: "menu-ico",
            "aria-hidden": "true",
            text: t.icon,
          }),
          el("span", { class: "menu-title", text: t.title }),
          el("span", { class: "menu-blurb", text: t.blurb }),
          el("span", { class: "menu-count", text: count + " activities" }),
        ],
      );
      grid.appendChild(card);
    });
    $("#menu-view").style.display = "block";
    $("#activity-view").style.display = "none";
    announce(
      "Activity menu. " +
        LISTENING_TYPES.length +
        " activity types at Level " +
        state.level +
        ".",
    );
  }

  function openType(typeId) {
    state.type = typeId;
    state.index = 0;
    $("#menu-view").style.display = "none";
    $("#activity-view").style.display = "block";
    loadActivity();
  }

  function backToMenu() {
    stopSpeech();
    state.type = null;
    renderMenu();
    $("#menu-view").scrollIntoView({
      behavior: REDUCED_MOTION ? "auto" : "smooth",
      block: "start",
    });
  }

  function currentList() {
    return (
      (ACTIVITIES[state.type] && ACTIVITIES[state.type][state.level]) || []
    );
  }

  function nextActivity() {
    const list = currentList();
    if (state.index < list.length - 1) {
      state.index += 1;
      loadActivity();
    } else {
      // finished the set
      announce("You finished all " + list.length + " activities in this set!");
      const stage = $("#stage");
      clear(stage);
      stage.appendChild(
        el("div", { class: "done-card" }, [
          el("div", { class: "done-emoji", "aria-hidden": "true", text: "🎉" }),
          el("h3", { text: "Set complete!" }),
          el("p", {
            text:
              "You finished all " +
              list.length +
              " " +
              LISTENING_TYPES.find(function (t) {
                return t.id === state.type;
              }).title +
              " activities at Level " +
              state.level +
              ".",
          }),
          el("p", {
            class: "done-score",
            text:
              "Points this session: " +
              state.points +
              "  ·  Best streak kept going? Keep practicing!",
          }),
          el("div", { class: "row-center" }, [
            el("button", {
              class: "btn btn-primary",
              text: "Try Level " + (state.level === 1 ? 2 : 1),
              onclick: function () {
                setLevel(state.level === 1 ? 2 : 1);
              },
            }),
            el("button", {
              class: "btn btn-ghost",
              text: "Back to menu",
              onclick: backToMenu,
            }),
          ]),
        ]),
      );
    }
  }

  /* ── Progress + header for an activity ── */
  function renderProgress() {
    const list = currentList();
    const typeMeta = LISTENING_TYPES.find(function (t) {
      return t.id === state.type;
    });
    $("#activity-type-title").textContent =
      typeMeta.icon + " " + typeMeta.title;
    $("#progress-text").textContent =
      "Activity " +
      (state.index + 1) +
      " of " +
      list.length +
      "  ·  Level " +
      state.level;
    const bar = $("#progress-fill");
    bar.style.width = (state.index / list.length) * 100 + "%";
    // dots
    const dots = $("#progress-dots");
    clear(dots);
    for (let i = 0; i < list.length; i++) {
      dots.appendChild(
        el("span", {
          class:
            "pdot" +
            (i < state.index ? " done" : i === state.index ? " current" : ""),
          "aria-hidden": "true",
        }),
      );
    }
  }

  /* ── Audio control bar (shared by every activity) ── */
  function audioBar(scriptText, opts) {
    opts = opts || {};
    const playLabel = opts.playLabel || "Play passage";
    const wrap = el("div", { class: "audio-bar" });

    const playBtn = el(
      "button",
      {
        class: "btn btn-audio",
        id: "btn-play",
        "aria-label": playLabel,
        onclick: function () {
          if (state.speaking) {
            stopSpeech();
            return;
          }
          speak(scriptText);
        },
      },
      [el("span", { id: "btn-play-label", text: "🔊 " + playLabel })],
    );

    const replayBtn = el(
      "button",
      {
        class: "btn btn-audio-ghost",
        id: "btn-replay",
        "aria-label": "Replay passage",
        onclick: function () {
          speak(scriptText);
        },
      },
      [el("span", { text: "↻ Replay" })],
    );

    const showBtn = el(
      "button",
      {
        class: "btn btn-audio-ghost",
        id: "btn-showtext",
        "aria-expanded": "false",
        "aria-controls": "script-text",
        onclick: function () {
          const box = $("#script-text");
          const open = box.style.display === "block";
          box.style.display = open ? "none" : "block";
          this.setAttribute("aria-expanded", String(!open));
          $("#btn-showtext-label").textContent = open
            ? "👁 Show text"
            : "🙈 Hide text";
        },
      },
      [el("span", { id: "btn-showtext-label", text: "👁 Show text" })],
    );

    wrap.appendChild(playBtn);
    wrap.appendChild(replayBtn);
    wrap.appendChild(showBtn);

    if (state.level === 1) {
      wrap.appendChild(
        el("span", {
          class: "audio-tag",
          title: "Level 1 plays slower",
          text: "🐢 slower speech",
        }),
      );
    }
    if (!speech.supported) {
      wrap.appendChild(
        el("span", {
          class: "audio-warn",
          text: "Speech unavailable — text shown",
        }),
      );
    }
    return wrap;
  }

  function updatePlayButtons() {
    const lbl = $("#btn-play-label");
    if (lbl) lbl.textContent = state.speaking ? "⏹ Stop" : "🔊 Play passage";
    const playBtn = $("#btn-play");
    if (playBtn) playBtn.classList.toggle("playing", state.speaking);
  }

  function scriptBox(text) {
    const box = el(
      "div",
      {
        class: "script-text",
        id: "script-text",
        role: "region",
        "aria-label": "Passage text",
      },
      [
        el("p", { class: "script-label", text: "Passage (read-along):" }),
        el("p", { text: text }),
      ],
    );
    box.style.display = "none";
    return box;
  }
  function autoShowText() {
    const box = $("#script-text");
    if (box) {
      box.style.display = "block";
      const b = $("#btn-showtext");
      if (b) b.setAttribute("aria-expanded", "true");
      const lbl = $("#btn-showtext-label");
      if (lbl) lbl.textContent = "🙈 Hide text";
    }
  }

  /* ── Next button (appears after a correct/complete answer) ── */
  function nextButton() {
    const list = currentList();
    const last = state.index === list.length - 1;
    return el("button", {
      class: "btn btn-primary",
      id: "btn-next",
      text: last ? "Finish set ✓" : "Next activity →",
      onclick: nextActivity,
    });
  }
  function showNext() {
    const slot = $("#next-slot");
    if (slot && !slot.firstChild) slot.appendChild(nextButton());
  }

  /* ════════════════ ACTIVITY RENDERERS ════════════════ */

  function loadActivity() {
    state.answered = false;
    state.plays = 0;
    stopSpeech();
    renderProgress();
    clearFeedback();
    const stage = $("#stage");
    clear(stage);
    $("#next-slot") && clear($("#next-slot"));

    const data = currentList()[state.index];
    if (!data) return;

    const head = el("div", { class: "stage-head" }, [
      el("span", {
        class: "topic-pill topic-" + (data.topic || "General").toLowerCase(),
        text: data.topic || "General",
      }),
      data.title ? el("h3", { class: "stage-title", text: data.title }) : null,
      data.word
        ? el("h3", { class: "stage-title", text: "Target word: " + data.word })
        : null,
    ]);
    stage.appendChild(head);

    const renderers = {
      "listen-choose": renderListenChoose,
      "follow-directions": renderFollowDirections,
      sequence: renderSequence,
      "main-detail": renderMainDetail,
      vocab: renderVocab,
      label: renderLabel,
    };
    renderers[state.type](stage, data);

    // common footer: feedback + next slot live inside layout already
    // auto-play passage on load (listen-first), unless speech unavailable
    if (speech.supported) {
      setTimeout(function () {
        speak(data.script);
      }, 350);
    } else {
      autoShowText();
    }
  }

  /* 1. Listen & Choose — MCQ */
  function renderListenChoose(stage, d) {
    stage.appendChild(audioBar(d.script));
    stage.appendChild(scriptBox(d.script));
    stage.appendChild(el("p", { class: "question", text: d.question }));

    const opts = el("div", {
      class: "options",
      role: "group",
      "aria-label": d.question,
    });
    d.choices.forEach(function (c, i) {
      const b = el(
        "button",
        {
          class: "option",
          "aria-label": c,
          onclick: function () {
            if (state.answered) return;
            const ok = i === d.answer;
            markOption(opts, i, d.answer);
            if (ok) {
              state.answered = true;
              award(10);
              feedback(true);
              showNext();
            } else {
              breakStreak();
              feedback(false);
              this.classList.add("wrong");
            }
          },
        },
        [
          el("span", { class: "opt-mark", "aria-hidden": "true" }),
          el("span", { text: c }),
        ],
      );
      opts.appendChild(b);
    });
    stage.appendChild(opts);
    if (state.level === 1 && d.hint) stage.appendChild(hintRow(d.hint));
    stage.appendChild(feedbackSlot());
  }

  function markOption(container, picked, correct) {
    const btns = container.querySelectorAll(".option");
    btns[picked].classList.add(picked === correct ? "correct" : "wrong");
    if (picked === correct) {
      btns.forEach(function (b, i) {
        if (i !== correct) b.disabled = true;
      });
      btns[correct].disabled = true;
    }
  }

  /* 2. Follow Directions — click items in order */
  function renderFollowDirections(stage, d) {
    stage.appendChild(audioBar(d.script, { playLabel: "Play directions" }));
    stage.appendChild(scriptBox(d.script));
    stage.appendChild(el("p", { class: "question", text: d.prompt }));

    let clicked = [];
    const tray = el("div", {
      class: "fd-tray",
      role: "group",
      "aria-label": d.prompt,
    });
    const order = el("div", {
      class: "fd-order",
      "aria-live": "polite",
      "aria-label": "Your order so far",
    });

    function refreshOrder() {
      clear(order);
      order.appendChild(
        el("span", { class: "fd-order-label", text: "Your order: " }),
      );
      if (!clicked.length)
        order.appendChild(
          el("span", {
            class: "fd-order-empty",
            text: "(click items in order)",
          }),
        );
      clicked.forEach(function (id, n) {
        const it = d.items.find(function (x) {
          return x.id === id;
        });
        order.appendChild(
          el("span", { class: "fd-chip", text: n + 1 + ". " + it.label }),
        );
      });
    }

    d.items.forEach(function (it) {
      const b = el(
        "button",
        {
          class: "fd-item",
          "aria-label": it.label,
          onclick: function () {
            if (state.answered || this.classList.contains("picked")) return;
            clicked.push(it.id);
            this.classList.add("picked");
            this.appendChild(
              el("span", {
                class: "fd-num",
                "aria-hidden": "true",
                text: clicked.length,
              }),
            );
            refreshOrder();
            if (clicked.length === d.expectedOrder.length) {
              const ok = clicked.every(function (id, i) {
                return id === d.expectedOrder[i];
              });
              if (ok) {
                state.answered = true;
                award(10);
                feedback(true, "Perfect order!");
                showNext();
              } else {
                breakStreak();
                feedback(
                  false,
                  "Not the right order. Tap Replay, then Reset and try again.",
                );
              }
            }
          },
        },
        [el("span", { text: it.label })],
      );
      tray.appendChild(b);
    });

    const reset = el("button", {
      class: "btn btn-ghost btn-sm",
      text: "↺ Reset",
      onclick: function () {
        if (state.answered) return;
        clicked = [];
        tray.querySelectorAll(".fd-item").forEach(function (b) {
          b.classList.remove("picked");
          const n = b.querySelector(".fd-num");
          if (n) n.remove();
        });
        refreshOrder();
        clearFeedback();
      },
    });

    stage.appendChild(tray);
    refreshOrder();
    stage.appendChild(order);
    stage.appendChild(el("div", { class: "row-left" }, [reset]));
    stage.appendChild(feedbackSlot());
  }

  /* 3. Sequence the Steps — drag to reorder */
  function renderSequence(stage, d) {
    stage.appendChild(audioBar(d.script, { playLabel: "Play story" }));
    stage.appendChild(scriptBox(d.script));
    stage.appendChild(
      el("p", {
        class: "question",
        text: "Put the events in the order you heard them. Drag, or use the ↑ ↓ buttons.",
      }),
    );

    // shuffled copy with original indices
    const items = d.events.map(function (txt, i) {
      return { txt: txt, correct: i };
    });
    shuffle(items);

    const listEl = el("ol", {
      class: "seq-list",
      "aria-label": "Events to order",
    });

    function rowFor(item, pos) {
      const li = el("li", {
        class: "seq-row",
        draggable: "true",
        tabindex: "0",
        "aria-label":
          "Event: " +
          item.txt +
          ". Position " +
          (pos + 1) +
          ". Use up and down arrow keys to move.",
      });
      li._item = item;
      li.appendChild(
        el("span", { class: "seq-handle", "aria-hidden": "true", text: "⠿" }),
      );
      li.appendChild(el("span", { class: "seq-text", text: item.txt }));
      const ctrl = el("span", { class: "seq-ctrl" });
      ctrl.appendChild(
        el("button", {
          class: "seq-move",
          "aria-label": "Move up",
          text: "↑",
          onclick: function () {
            move(li, -1);
          },
        }),
      );
      ctrl.appendChild(
        el("button", {
          class: "seq-move",
          "aria-label": "Move down",
          text: "↓",
          onclick: function () {
            move(li, 1);
          },
        }),
      );
      li.appendChild(ctrl);

      // drag events
      li.addEventListener("dragstart", function (e) {
        li.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      li.addEventListener("dragend", function () {
        li.classList.remove("dragging");
      });
      // keyboard move
      li.addEventListener("keydown", function (e) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          move(li, -1);
          li.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          move(li, 1);
          li.focus();
        }
      });
      return li;
    }

    function move(li, dir) {
      if (state.answered) return;
      const rows = Array.prototype.slice.call(listEl.children);
      const idx = rows.indexOf(li);
      const j = idx + dir;
      if (j < 0 || j >= rows.length) return;
      if (dir < 0) listEl.insertBefore(li, rows[j]);
      else listEl.insertBefore(rows[j], li);
      renumber();
    }
    function renumber() {
      Array.prototype.forEach.call(listEl.children, function (li, i) {
        li.setAttribute(
          "aria-label",
          "Event: " +
            li._item.txt +
            ". Position " +
            (i + 1) +
            ". Use up and down arrow keys to move.",
        );
      });
    }

    listEl.addEventListener("dragover", function (e) {
      e.preventDefault();
      const dragging = listEl.querySelector(".dragging");
      if (!dragging) return;
      const after = getDragAfter(listEl, e.clientY);
      if (after == null) listEl.appendChild(dragging);
      else listEl.insertBefore(dragging, after);
    });

    items.forEach(function (it, i) {
      listEl.appendChild(rowFor(it, i));
    });
    stage.appendChild(listEl);

    const check = el("button", {
      class: "btn btn-primary",
      text: "Check order",
      onclick: function () {
        if (state.answered) return;
        const rows = Array.prototype.slice.call(listEl.children);
        const ok = rows.every(function (li, i) {
          return li._item.correct === i;
        });
        if (ok) {
          state.answered = true;
          award(10);
          feedback(true, "Perfectly sequenced!");
          rows.forEach(function (li) {
            li.classList.add("seq-correct");
            li.setAttribute("draggable", "false");
          });
          showNext();
        } else {
          breakStreak();
          // mark which are in the right spot
          rows.forEach(function (li, i) {
            li.classList.toggle("seq-right", li._item.correct === i);
            li.classList.toggle("seq-wrong", li._item.correct !== i);
          });
          feedback(
            false,
            "Some events are out of order. Green ones are correct — fix the rest and check again.",
          );
        }
      },
    });
    stage.appendChild(el("div", { class: "row-left" }, [check]));
    stage.appendChild(feedbackSlot());
  }

  function getDragAfter(container, y) {
    const els = Array.prototype.slice.call(
      container.querySelectorAll(".seq-row:not(.dragging)"),
    );
    let closest = { offset: -Infinity, element: null };
    els.forEach(function (child) {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset)
        closest = { offset: offset, element: child };
    });
    return closest.element;
  }

  /* 4. Main Idea vs Detail — two MCQs */
  function renderMainDetail(stage, d) {
    stage.appendChild(audioBar(d.script));
    stage.appendChild(scriptBox(d.script));

    let mainDone = false,
      detailDone = false;
    function maybeFinish() {
      if (mainDone && detailDone && !state.answered) {
        state.answered = true;
        award(15);
        feedback(true, "You found both the main idea and a detail!");
        showNext();
      }
    }

    // Main idea block
    stage.appendChild(el("p", { class: "question", text: d.mainQ }));
    const mainOpts = el("div", {
      class: "options",
      role: "group",
      "aria-label": d.mainQ,
    });
    d.mainChoices.forEach(function (c, i) {
      const b = el(
        "button",
        {
          class: "option",
          "aria-label": c,
          onclick: function () {
            if (mainDone) return;
            if (i === d.mainAnswer) {
              mainDone = true;
              markOption(mainOpts, i, d.mainAnswer);
              feedback(true, "Yes — that's the big idea.");
              maybeFinish();
            } else {
              breakStreak();
              this.classList.add("wrong");
              this.disabled = true;
              feedback(
                false,
                "That's a detail, not the main idea. Listen again.",
              );
            }
          },
        },
        [
          el("span", { class: "opt-mark", "aria-hidden": "true" }),
          el("span", { text: c }),
        ],
      );
      mainOpts.appendChild(b);
    });
    stage.appendChild(mainOpts);

    // Detail block
    stage.appendChild(el("p", { class: "question", text: d.detailQ }));
    const detOpts = el("div", {
      class: "options",
      role: "group",
      "aria-label": d.detailQ,
    });
    d.detailChoices.forEach(function (c, i) {
      const b = el(
        "button",
        {
          class: "option",
          "aria-label": c,
          onclick: function () {
            if (detailDone) return;
            if (i === d.detailAnswer) {
              detailDone = true;
              markOption(detOpts, i, d.detailAnswer);
              feedback(true, "Right — that detail supports the main idea.");
              maybeFinish();
            } else {
              breakStreak();
              this.classList.add("wrong");
              this.disabled = true;
              feedback(false, "That detail doesn't fit. Listen again.");
            }
          },
        },
        [
          el("span", { class: "opt-mark", "aria-hidden": "true" }),
          el("span", { text: c }),
        ],
      );
      detOpts.appendChild(b);
    });
    stage.appendChild(detOpts);
    stage.appendChild(feedbackSlot());
  }

  /* 5. Academic Vocabulary — MCQ on meaning */
  function renderVocab(stage, d) {
    stage.appendChild(audioBar(d.script, { playLabel: "Play sentence" }));
    stage.appendChild(scriptBox(d.script));
    stage.appendChild(el("p", { class: "question", text: d.question }));

    const opts = el("div", {
      class: "options",
      role: "group",
      "aria-label": d.question,
    });
    d.choices.forEach(function (c, i) {
      const b = el(
        "button",
        {
          class: "option",
          "aria-label": c,
          onclick: function () {
            if (state.answered) return;
            if (i === d.answer) {
              state.answered = true;
              markOption(opts, i, d.answer);
              award(10);
              feedback(true, "Exactly! You used the context clues.");
              showNext();
            } else {
              breakStreak();
              this.classList.add("wrong");
              feedback(false);
            }
          },
        },
        [
          el("span", { class: "opt-mark", "aria-hidden": "true" }),
          el("span", { text: c }),
        ],
      );
      opts.appendChild(b);
    });
    stage.appendChild(opts);
    if (state.level === 1 && d.hint) stage.appendChild(hintRow(d.hint));
    stage.appendChild(feedbackSlot());
  }

  /* 6. Listen & Label — drag labels onto a diagram */
  function renderLabel(stage, d) {
    stage.appendChild(audioBar(d.script, { playLabel: "Play descriptions" }));
    stage.appendChild(scriptBox(d.script));
    stage.appendChild(
      el("p", {
        class: "question",
        text: "Drag each label to the correct spot on the diagram. (Or click a label, then click a spot.)",
      }),
    );

    const layout = el("div", { class: "label-layout" });
    const diagram = el("div", {
      class: "diagram",
      "aria-label": "Diagram: " + (d.title || d.scene),
    });
    diagram.innerHTML = diagramSVG(d.scene);

    // create drop slots positioned over the diagram
    let selected = null; // for click-to-place
    let placed = 0;
    const slotPositions = SLOT_POS[d.scene] || {};
    const slots = {};
    d.parts.forEach(function (p) {
      const pos = slotPositions[p.slot] || { x: 50, y: 50 };
      const slot = el("button", {
        class: "drop-slot",
        "data-slot": p.slot,
        "aria-label": "Drop zone " + p.slot,
        style: "left:" + pos.x + "%;top:" + pos.y + "%;",
      });
      slot._slot = p.slot;
      slot.addEventListener("dragover", function (e) {
        e.preventDefault();
        slot.classList.add("over");
      });
      slot.addEventListener("dragleave", function () {
        slot.classList.remove("over");
      });
      slot.addEventListener("drop", function (e) {
        e.preventDefault();
        slot.classList.remove("over");
        const id = e.dataTransfer.getData("text/plain");
        tryPlace(id, slot);
      });
      slot.addEventListener("click", function () {
        if (selected) tryPlace(selected, slot);
      });
      slots[p.slot] = slot;
      diagram.appendChild(slot);
    });
    layout.appendChild(diagram);

    // label bank
    const bank = el("div", { class: "label-bank", "aria-label": "Labels" });
    bank.appendChild(el("p", { class: "bank-label", text: "Labels:" }));
    const chipWrap = el("div", { class: "chip-wrap" });
    d.parts
      .slice()
      .sort(function () {
        return Math.random() - 0.5;
      })
      .forEach(function (p) {
        const chip = el("button", {
          class: "label-chip",
          draggable: "true",
          "data-id": p.id,
          "aria-label": "Label: " + p.label,
          text: p.label,
        });
        chip.addEventListener("dragstart", function (e) {
          e.dataTransfer.setData("text/plain", p.id);
          e.dataTransfer.effectAllowed = "move";
          chip.classList.add("dragging");
        });
        chip.addEventListener("dragend", function () {
          chip.classList.remove("dragging");
        });
        chip.addEventListener("click", function () {
          if (chip.classList.contains("used")) return;
          if (selected === p.id) {
            selected = null;
            chip.classList.remove("selected");
            return;
          }
          chipWrap.querySelectorAll(".label-chip").forEach(function (c) {
            c.classList.remove("selected");
          });
          selected = p.id;
          chip.classList.add("selected");
          announce(
            "Selected " + p.label + ". Now click a spot on the diagram.",
          );
        });
        chip._part = p;
        chipWrap.appendChild(chip);
      });
    bank.appendChild(chipWrap);
    layout.appendChild(bank);
    stage.appendChild(layout);
    stage.appendChild(feedbackSlot());

    function tryPlace(id, slot) {
      if (state.answered) return;
      const part = d.parts.find(function (x) {
        return x.id === id;
      });
      const chip = chipWrap.querySelector('[data-id="' + id + '"]');
      if (!part || !chip || chip.classList.contains("used")) return;
      if (slot.classList.contains("filled")) return;

      if (part.slot === slot._slot) {
        slot.classList.add("filled", "ok");
        slot.textContent = part.label;
        chip.classList.add("used");
        chip.classList.remove("selected");
        chip.disabled = true;
        selected = null;
        placed += 1;
        if (placed === d.parts.length) {
          state.answered = true;
          award(15);
          feedback(true, "Diagram fully labeled — great listening!");
          showNext();
        } else {
          feedback(
            true,
            "Correct! " + (d.parts.length - placed) + " label(s) to go.",
          );
        }
      } else {
        breakStreak();
        slot.classList.add("shake");
        setTimeout(function () {
          slot.classList.remove("shake");
        }, 400);
        feedback(false, "Not that spot. Replay and listen for where it goes.");
      }
    }
  }

  /* ── shared little builders ── */
  function hintRow(text) {
    return el("div", { class: "hint-row" }, [
      el("button", {
        class: "btn btn-hint btn-sm",
        "aria-expanded": "false",
        onclick: function () {
          const h = this.nextSibling;
          const open = h.style.display === "inline";
          h.style.display = open ? "none" : "inline";
          this.setAttribute("aria-expanded", String(!open));
        },
        text: "💬 Hint",
      }),
      el("span", {
        class: "hint-text",
        style: "display:none",
        text: " " + text,
      }),
    ]);
  }
  function feedbackSlot() {
    const wrap = el("div", { class: "feedback-wrap" });
    wrap.appendChild(
      el("div", {
        class: "feedback",
        id: "feedback",
        role: "status",
        "aria-live": "polite",
        style: "display:none",
      }),
    );
    wrap.appendChild(el("div", { class: "next-slot", id: "next-slot" }));
    return wrap;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    // guard: never leave it already in perfect order for sequence
    return a;
  }

  /* ── Diagram SVGs + slot positions ── */
  const SLOT_POS = {
    plant: {
      top: { x: 50, y: 8 },
      upper: { x: 72, y: 32 },
      middle: { x: 50, y: 55 },
      bottom: { x: 50, y: 88 },
    },
    triangle: {
      top: { x: 50, y: 10 },
      left: { x: 22, y: 60 },
      bottom: { x: 50, y: 90 },
    },
    watercycle: {
      top: { x: 50, y: 12 },
      left: { x: 16, y: 78 },
      right: { x: 84, y: 50 },
      bottom: { x: 80, y: 86 },
    },
    coordinate: {
      top: { x: 50, y: 8 },
      right: { x: 90, y: 50 },
      center: { x: 50, y: 52 },
      upperright: { x: 74, y: 28 },
    },
  };

  function diagramSVG(scene) {
    switch (scene) {
      case "plant":
        return (
          '<svg viewBox="0 0 200 200" role="img" aria-label="Plant diagram">' +
          '<rect x="0" y="150" width="200" height="50" fill="#e6d3b3"/>' +
          '<line x1="100" y1="60" x2="100" y2="155" stroke="#3f8c4f" stroke-width="6"/>' +
          '<path d="M100 95 q-35 -10 -45 -34 q34 -2 45 22" fill="#5fb56e"/>' +
          '<path d="M100 110 q35 -10 45 -34 q-34 -2 -45 22" fill="#5fb56e"/>' +
          '<circle cx="100" cy="50" r="18" fill="#e9a23b"/>' +
          '<circle cx="100" cy="50" r="8" fill="#c0392b"/>' +
          '<path d="M100 155 q-18 18 -30 30 M100 155 q18 18 30 30 M100 155 v34" stroke="#7a5230" stroke-width="3" fill="none"/>' +
          "</svg>"
        );
      case "triangle":
        return (
          '<svg viewBox="0 0 200 200" role="img" aria-label="Triangle diagram">' +
          '<polygon points="100,25 30,170 170,170" fill="#dff2ee" stroke="#0f766e" stroke-width="4"/>' +
          "</svg>"
        );
      case "watercycle":
        return (
          '<svg viewBox="0 0 200 200" role="img" aria-label="Water cycle diagram">' +
          '<rect x="0" y="150" width="120" height="50" fill="#cfeaf0"/>' +
          '<rect x="120" y="150" width="80" height="50" fill="#bfe3d0"/>' +
          '<ellipse cx="100" cy="45" rx="44" ry="22" fill="#cfd8e0"/>' +
          '<circle cx="40" cy="35" r="16" fill="#f2c15b"/>' +
          '<path d="M150 70 l-3 14 M162 70 l-3 14 M174 70 l-3 14" stroke="#2a6fb0" stroke-width="3"/>' +
          '<path d="M40 140 q4 -16 12 -28" stroke="#2a6fb0" stroke-width="3" fill="none"/>' +
          "</svg>"
        );
      case "coordinate":
        return (
          '<svg viewBox="0 0 200 200" role="img" aria-label="Coordinate plane diagram">' +
          '<line x1="10" y1="100" x2="190" y2="100" stroke="#12355b" stroke-width="3"/>' +
          '<line x1="100" y1="10" x2="100" y2="190" stroke="#12355b" stroke-width="3"/>' +
          '<polygon points="190,100 182,96 182,104" fill="#12355b"/>' +
          '<polygon points="100,10 96,18 104,18" fill="#12355b"/>' +
          '<circle cx="100" cy="100" r="4" fill="#d9795d"/>' +
          '<circle cx="148" cy="52" r="5" fill="#0f766e"/>' +
          "</svg>"
        );
      default:
        return '<svg viewBox="0 0 200 200" role="img" aria-label="Diagram"><rect width="200" height="200" fill="#eef4f3"/></svg>';
    }
  }

  /* ── Boot ── */
  function init() {
    $("#btn-level-1").addEventListener("click", function () {
      setLevel(1);
    });
    $("#btn-level-2").addEventListener("click", function () {
      setLevel(2);
    });
    $("#btn-back").addEventListener("click", backToMenu);
    $("#btn-prev").addEventListener("click", function () {
      if (state.index > 0) {
        state.index -= 1;
        loadActivity();
      }
    });
    $("#btn-skip").addEventListener("click", function () {
      stopSpeech();
      const list = currentList();
      if (state.index < list.length - 1) {
        state.index += 1;
        loadActivity();
      } else backToMenu();
    });
    if (!speech.supported) {
      $("#speech-banner").style.display = "block";
    }
    // stop speech when leaving page
    window.addEventListener("beforeunload", stopSpeech);
    setLevel(1);
    renderScore(false);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
