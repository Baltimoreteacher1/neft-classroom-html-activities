/* The Language Page game runtime. One classic script, no imports, no network: the Game Maker preview, the
   share-link player and every downloaded .html game run this same code (the export inlines it).
   window.LPGame.mount(element, game) where game = { v, title, template, theme, items: [[...cells]], opts, icons }.
   Every interaction is a button (tap, click, Enter or Space); nothing depends on dragging. */
(function () {
  "use strict";
  var TEMPLATES = {};
  var RM = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs)
      for (var k in attrs) {
        if (attrs[k] == null || attrs[k] === false) continue;
        if (k === "text") n.textContent = attrs[k];
        else if (k === "on") for (var ev in attrs.on) n.addEventListener(ev, attrs.on[ev]);
        else n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
      }
    (kids || []).forEach(function (c) {
      if (c != null) n.append(c);
    });
    return n;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function differentOrder(a) {
    if (a.length < 2) return a.slice();
    for (var tries = 0; tries < 12; tries++) {
      var s = shuffle(a);
      if (s.join("\u0001") !== a.join("\u0001")) return s;
    }
    return a.slice(1).concat(a[0]);
  }
  function norm(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[.!?,;:"'’]/g, "")
      .replace(/\s+/g, " ");
  }
  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function iconFor(game, word) {
    if (!game.opts.icons || !game.icons) return null;
    var key = norm(word);
    var body = game.icons[key];
    if (!body) return null;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "lpg-icon");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML = body;
    return svg;
  }

  function mount(root, game) {
    game.opts = game.opts || {};
    root.innerHTML = "";
    var shell = el("div", { class: "lpg", "data-theme": game.theme || "harbor" });
    var live = el("p", { class: "lpg-live", "aria-live": "polite" });
    var head = el("div", { class: "lpg-head" }, [el("h2", { class: "lpg-title", text: game.title || "Game" }), el("p", { class: "lpg-status" })]);
    var stage = el("div", { class: "lpg-stage" });
    shell.append(head, stage, live);
    root.append(shell);
    var api = {
      game: game,
      stage: stage,
      say: function (msg) {
        live.textContent = "";
        setTimeout(function () {
          live.textContent = msg;
        }, 30);
      },
      status: function (msg) {
        head.querySelector(".lpg-status").textContent = msg;
      },
      speakBtn: function (text) {
        if (!game.opts.tts || !("speechSynthesis" in window)) return null;
        return el("button", { type: "button", class: "lpg-btn lpg-ghost lpg-say", "aria-label": "Hear: " + text, text: "Hear it", on: { click: function (e) { e.stopPropagation(); speak(text); } } });
      },
      gloss: function (text) {
        return game.opts.gloss && text ? el("span", { class: "lpg-gloss", lang: "es", text: text }) : null;
      },
      icon: function (word) {
        return iconFor(game, word);
      },
      again: function (label, fn) {
        return el("button", { type: "button", class: "lpg-btn", text: label || "Play again", on: { click: fn } });
      },
      el: el,
      shuffle: shuffle,
      differentOrder: differentOrder,
      norm: norm,
      RM: RM,
    };
    var items = (game.items || []).filter(function (r) {
      return r && r.length && String(r[0]).trim();
    });
    if (!items.length) {
      stage.append(el("p", { class: "lpg-empty", text: "Add some words or questions to start." }));
      return;
    }
    var t = TEMPLATES[game.template] || TEMPLATES.match;
    t(api, items);
  }

  /* ---------- Matching / Memory ---------- */
  TEMPLATES.match = function (g, items) {
    var pairs = items.filter(function (r) {
      return r[1];
    }).slice(0, 8);
    if (pairs.length < 2) {
      g.stage.append(g.el("p", { class: "lpg-empty", text: "Matching needs at least two lines like: word, meaning." }));
      return;
    }
    var mode = "memory";
    var toggle = g.el("div", { class: "lpg-seg", role: "group", "aria-label": "Game mode" });
    function start() {
      g.stage.innerHTML = "";
      toggle.innerHTML = "";
      [["memory", "Memory (cards face down)"], ["match", "Match (cards face up)"]].forEach(function (m) {
        toggle.append(g.el("button", { type: "button", class: "lpg-btn lpg-small" + (mode === m[0] ? "" : " lpg-ghost"), "aria-pressed": String(mode === m[0]), text: m[1], on: { click: function () { mode = m[0]; start(); } } }));
      });
      g.stage.append(toggle);
      var cards = [];
      pairs.forEach(function (p, i) {
        cards.push({ pair: i, side: 0, text: p[0], gloss: p[2] }, { pair: i, side: 1, text: p[1] });
      });
      cards = g.shuffle(cards);
      var grid = g.el("div", { class: "lpg-grid" });
      var open = [];
      var moves = 0;
      var found = 0;
      var busy = false;
      function label(c, shown) {
        return shown ? (c.side ? "Meaning: " : "Word: ") + c.text : "Card, face down";
      }
      cards.forEach(function (c, i) {
        var face = g.el("span", { class: "lpg-face" }, [g.icon(c.text), g.el("span", { text: c.text }), c.side ? null : g.gloss(c.gloss)]);
        var b = g.el("button", { type: "button", class: "lpg-card" + (mode === "match" ? " is-up" : ""), "aria-label": label(c, mode === "match"), "data-i": i }, [face]);
        c.btn = b;
        b.addEventListener("click", function () {
          if (busy || c.done || open.indexOf(c) >= 0) return;
          c.up = true;
          b.classList.add("is-up", "is-open");
          b.setAttribute("aria-label", label(c, true));
          open.push(c);
          if (g.game.opts.tts && mode === "memory") speakSoft(c.text);
          if (open.length < 2) {
            g.say(label(c, true) + ". Choose its partner.");
            return;
          }
          moves++;
          var a = open[0];
          var bb = open[1];
          if (a.pair === bb.pair && a.side !== bb.side) {
            a.done = bb.done = true;
            [a, bb].forEach(function (x) {
              x.btn.classList.add("is-done");
              x.btn.classList.remove("is-open");
              x.btn.setAttribute("aria-label", "Matched: " + x.text);
              x.btn.setAttribute("aria-disabled", "true");
            });
            found++;
            open = [];
            g.say("A match: " + pairs[a.pair][0] + " means " + pairs[a.pair][1] + ".");
            status();
            if (found === pairs.length) finish();
          } else {
            busy = true;
            g.say("Not a match. Try again.");
            setTimeout(function () {
              open.forEach(function (x) {
                x.btn.classList.remove("is-open");
                if (mode === "memory") {
                  x.btn.classList.remove("is-up");
                  x.btn.setAttribute("aria-label", label(x, false));
                }
              });
              open = [];
              busy = false;
            }, g.RM ? 600 : 1200);
            status();
          }
        });
        grid.append(b);
      });
      function status() {
        g.status(found + " of " + pairs.length + " matched · " + moves + " tries");
      }
      function finish() {
        var done = g.el("div", { class: "lpg-done" }, [g.el("p", { class: "lpg-big", text: "All matched in " + moves + " tries." }), g.again("Play again", start)]);
        g.stage.append(done);
        g.say("All matched in " + moves + " tries.");
      }
      g.stage.append(grid);
      status();
    }
    function speakSoft(text) {
      try {
        var u = new SpeechSynthesisUtterance(text);
        u.rate = 0.9;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch (e) {}
    }
    start();
  };

  /* ---------- Quiz Show (team mode for projection) ---------- */
  TEMPLATES.quiz = function (g, items) {
    var cats = [];
    var byCat = {};
    items.forEach(function (r) {
      var c = (r[2] || "Questions").trim();
      if (!byCat[c]) {
        byCat[c] = [];
        cats.push(c);
      }
      if (byCat[c].length < 5) byCat[c].push(r);
    });
    cats = cats.slice(0, 5);
    var teams = [
      { name: "Team A", score: 0 },
      { name: "Team B", score: 0 },
    ];
    var used = {};
    function board() {
      g.stage.innerHTML = "";
      var scores = g.el("div", { class: "lpg-teams" });
      teams.forEach(function (t, i) {
        var input = g.el("input", { type: "text", value: t.name, "aria-label": "Team " + (i + 1) + " name", class: "lpg-team-name" });
        input.addEventListener("input", function () {
          t.name = input.value || "Team " + (i + 1);
        });
        scores.append(g.el("div", { class: "lpg-team" }, [input, g.el("span", { class: "lpg-score", text: String(t.score) }), g.el("button", { type: "button", class: "lpg-btn lpg-ghost lpg-small", "aria-label": "Subtract 100 from " + t.name, text: "−100", on: { click: function () { t.score -= 100; board(); } } })]));
      });
      if (teams.length < 4)
        scores.append(g.el("button", { type: "button", class: "lpg-btn lpg-ghost lpg-small", text: "+ Team", on: { click: function () { teams.push({ name: "Team " + String.fromCharCode(65 + teams.length), score: 0 }); board(); } } }));
      var table = g.el("div", { class: "lpg-board", style: null });
      table.style.setProperty("--cols", cats.length);
      cats.forEach(function (c) {
        table.append(g.el("div", { class: "lpg-cat", text: c }));
      });
      for (var row = 0; row < 5; row++) {
        cats.forEach(function (c) {
          var q = byCat[c][row];
          if (!q) {
            table.append(g.el("div", { class: "lpg-tile is-empty" }));
            return;
          }
          var id = c + "|" + row;
          var pts = (row + 1) * 100;
          table.append(g.el("button", { type: "button", class: "lpg-tile" + (used[id] ? " is-used" : ""), disabled: used[id] ? true : null, "aria-label": c + " for " + pts + (used[id] ? ", done" : ""), text: used[id] ? "✓" : String(pts), on: { click: function () { ask(q, pts, id); } } }));
        });
      }
      g.stage.append(scores, table);
      var left = Object.keys(byCat).reduce(function (n, c) {
        return n + byCat[c].filter(function (_, r) {
          return !used[c + "|" + r];
        }).length;
      }, 0);
      g.status(left ? left + " questions left" : "Board complete");
      if (!left) {
        var best = teams.slice().sort(function (a, b) {
          return b.score - a.score;
        });
        g.stage.append(g.el("div", { class: "lpg-done" }, [g.el("p", { class: "lpg-big", text: best[0].score === (best[1] || {}).score ? "A tie! Great teamwork." : best[0].name + " wins with " + best[0].score + "!" }), g.again("New game", function () { used = {}; teams.forEach(function (t) { t.score = 0; }); board(); })]));
      }
    }
    function ask(q, pts, id) {
      g.stage.innerHTML = "";
      var answer = g.el("p", { class: "lpg-answer", hidden: true, text: q[1] || "" });
      var award = g.el("div", { class: "lpg-row", hidden: true });
      teams.forEach(function (t) {
        award.append(g.el("button", { type: "button", class: "lpg-btn", text: t.name + " +" + pts, on: { click: function () { t.score += pts; used[id] = true; board(); } } }));
      });
      award.append(g.el("button", { type: "button", class: "lpg-btn lpg-ghost", text: "No points", on: { click: function () { used[id] = true; board(); } } }));
      var reveal = g.el("button", { type: "button", class: "lpg-btn", text: "Show the answer", on: { click: function () { answer.hidden = false; award.hidden = false; reveal.hidden = true; award.querySelector("button").focus(); g.say("Answer: " + (q[1] || "")); } } });
      var card = g.el("div", { class: "lpg-question" }, [g.el("p", { class: "lpg-pts", text: pts + " points" }), g.el("p", { class: "lpg-big", text: q[0] }), g.speakBtn(q[0]), answer, g.el("div", { class: "lpg-row" }, [reveal, g.el("button", { type: "button", class: "lpg-btn lpg-ghost", text: "Back to the board", on: { click: board } })]), award]);
      g.stage.append(card);
      reveal.focus();
      g.say(q[0]);
    }
    board();
  };

  /* ---------- Sentence Builder ---------- */
  TEMPLATES.builder = function (g, items) {
    var sentences = items.map(function (r) {
      return r.join(", ").trim();
    }).filter(function (s) {
      return s.split(/\s+/).length >= 2;
    });
    var i = 0;
    var score = 0;
    function show() {
      g.stage.innerHTML = "";
      if (i >= sentences.length) {
        g.stage.append(g.el("div", { class: "lpg-done" }, [g.el("p", { class: "lpg-big", text: "You built " + score + " of " + sentences.length + " sentences on the first try." }), g.again("Play again", function () { i = 0; score = 0; show(); })]));
        g.status("Done");
        return;
      }
      var target = sentences[i].split(/\s+/);
      var bank = g.differentOrder(target.map(function (w, k) { return { w: w, k: k }; }));
      var line = [];
      var tries = 0;
      var lineEl = g.el("div", { class: "lpg-line", "aria-label": "Your sentence" });
      var bankEl = g.el("div", { class: "lpg-bank", "aria-label": "Word bank" });
      var fb = g.el("p", { class: "lpg-fb", "aria-live": "polite" });
      function draw() {
        lineEl.innerHTML = "";
        bankEl.innerHTML = "";
        if (!line.length) lineEl.append(g.el("span", { class: "lpg-hint", text: "Tap words to build the sentence." }));
        line.forEach(function (t, pos) {
          lineEl.append(g.el("button", { type: "button", class: "lpg-chip is-placed", "aria-label": "Remove " + t.w, text: t.w, on: { click: function () { line.splice(pos, 1); bank.push(t); draw(); } } }));
        });
        bank.forEach(function (t, pos) {
          bankEl.append(g.el("button", { type: "button", class: "lpg-chip", "aria-label": "Add " + t.w, text: t.w, on: { click: function () { bank.splice(pos, 1); line.push(t); draw(); var next = bankEl.querySelector("button") || checkBtn; next.focus(); } } }));
        });
      }
      var checkBtn = g.el("button", { type: "button", class: "lpg-btn", text: "Check", on: { click: function () {
        tries++;
        var built = line.map(function (t) { return t.w; }).join(" ");
        if (built === target.join(" ")) {
          if (tries === 1) score++;
          fb.textContent = "Yes! " + built;
          g.say("Correct. " + built);
          i++;
          setTimeout(show, g.RM ? 300 : 900);
        } else if (line.length < target.length) {
          fb.textContent = "Use every word. " + bank.length + " left.";
        } else {
          fb.textContent = "Not yet. The sentence starts with “" + target[0] + "”.";
        }
      } } });
      g.stage.append(g.el("p", { class: "lpg-progress", text: "Sentence " + (i + 1) + " of " + sentences.length }), lineEl, bankEl, g.el("div", { class: "lpg-row" }, [checkBtn, g.speakBtn(sentences[i]), g.el("button", { type: "button", class: "lpg-btn lpg-ghost", text: "Clear", on: { click: function () { bank = bank.concat(line); line = []; draw(); } } })]), fb);
      draw();
      g.status("Score " + score);
    }
    show();
  };

  /* ---------- Word Sort ---------- */
  TEMPLATES.sort = function (g, items) {
    var rows = items.filter(function (r) { return r[1]; });
    var groups = [];
    rows.forEach(function (r) {
      var c = r[1].trim();
      if (groups.indexOf(c) < 0) groups.push(c);
    });
    groups = groups.slice(0, 4);
    rows = rows.filter(function (r) { return groups.indexOf(r[1].trim()) >= 0; }).slice(0, 16);
    function start() {
      g.stage.innerHTML = "";
      var words = g.shuffle(rows.map(function (r, k) { return { w: r[0], g: r[1].trim(), k: k, at: null }; }));
      var picked = null;
      var bank = g.el("div", { class: "lpg-bank", "aria-label": "Words to sort" });
      var bins = g.el("div", { class: "lpg-bins" });
      var fb = g.el("p", { class: "lpg-fb", "aria-live": "polite" });
      function draw() {
        bank.innerHTML = "";
        bins.innerHTML = "";
        words.filter(function (w) { return w.at == null; }).forEach(function (w) {
          bank.append(g.el("button", { type: "button", class: "lpg-chip" + (picked === w ? " is-picked" : ""), "aria-pressed": String(picked === w), text: w.w, on: { click: function () { picked = picked === w ? null : w; draw(); g.say(picked ? w.w + " picked. Now choose a group." : ""); } } }, [g.icon(w.w)].filter(Boolean)));
        });
        groups.forEach(function (name) {
          var inBin = words.filter(function (w) { return w.at === name; });
          var bin = g.el("div", { class: "lpg-bin" }, [g.el("button", { type: "button", class: "lpg-btn lpg-bin-btn", text: "Put in: " + name, disabled: picked ? null : true, on: { click: function () { if (!picked) return; picked.at = name; picked.wrong = false; g.say(picked.w + " is in " + name + "."); picked = null; draw(); } } })]);
          inBin.forEach(function (w) {
            bin.append(g.el("button", { type: "button", class: "lpg-chip is-placed" + (w.wrong ? " is-wrong" : ""), "aria-label": w.w + " in " + name + ". Tap to take it back.", text: w.w, on: { click: function () { w.at = null; draw(); } } }));
          });
          bins.append(bin);
        });
        g.status(words.filter(function (w) { return w.at != null; }).length + " of " + words.length + " sorted");
      }
      var check = g.el("button", { type: "button", class: "lpg-btn", text: "Check my sort", on: { click: function () {
        var wrong = 0;
        words.forEach(function (w) {
          if (w.at != null && w.at !== w.g) {
            w.wrong = true;
            wrong++;
          }
        });
        var left = words.filter(function (w) { return w.at == null; }).length;
        if (!wrong && !left) {
          fb.textContent = "Every word is in the right group!";
          g.stage.append(g.el("div", { class: "lpg-done" }, [g.again("Play again", start)]));
        } else fb.textContent = (wrong ? wrong + " word" + (wrong > 1 ? "s are" : " is") + " in the wrong group (marked). " : "") + (left ? left + " still to sort." : "");
        g.say(fb.textContent);
        draw();
      } } });
      g.stage.append(bank, bins, g.el("div", { class: "lpg-row" }, [check]), fb);
      draw();
    }
    if (groups.length < 2) {
      g.stage.append(g.el("p", { class: "lpg-empty", text: "Word Sort needs at least two groups: word, group." }));
      return;
    }
    start();
  };

  /* ---------- Fill the Frame (cloze) ---------- */
  TEMPLATES.frame = function (g, items) {
    var qs = items.map(function (r) {
      var s = r.join(", ");
      var m = /\[([^\]]+)\]/.exec(s);
      return m ? { text: s, answer: m[1].trim() } : null;
    }).filter(Boolean);
    if (!qs.length) {
      g.stage.append(g.el("p", { class: "lpg-empty", text: "Mark the missing word in each sentence with [square brackets]." }));
      return;
    }
    var bank = qs.map(function (q) { return q.answer; }).filter(function (w, k, a) { return a.indexOf(w) === k; });
    var i = 0;
    var score = 0;
    function show() {
      g.stage.innerHTML = "";
      if (i >= qs.length) {
        g.stage.append(g.el("div", { class: "lpg-done" }, [g.el("p", { class: "lpg-big", text: score + " of " + qs.length + " on the first try." }), g.again("Play again", function () { i = 0; score = 0; show(); })]));
        g.status("Done");
        return;
      }
      var q = qs[i];
      var parts = q.text.split(/\[[^\]]+\]/);
      var tries = 0;
      var fb = g.el("p", { class: "lpg-fb", "aria-live": "polite" });
      var sentence = g.el("p", { class: "lpg-big lpg-sentence" }, [parts[0], g.el("span", { class: "lpg-blank", text: "_____" }), parts.slice(1).join("")]);
      function check(value) {
        tries++;
        if (g.norm(value) === g.norm(q.answer)) {
          if (tries === 1) score++;
          sentence.querySelector(".lpg-blank").textContent = q.answer;
          fb.textContent = "Yes! " + q.text.replace(/\[|\]/g, "");
          g.say(fb.textContent);
          i++;
          setTimeout(show, g.RM ? 300 : 1000);
        } else {
          fb.textContent = "Not quite. Read the whole sentence again and try another word.";
          g.say(fb.textContent);
        }
      }
      var answerUi;
      if (g.game.opts.bank !== false) {
        answerUi = g.el("div", { class: "lpg-bank", "aria-label": "Word bank" });
        g.shuffle(bank).forEach(function (w) {
          answerUi.append(g.el("button", { type: "button", class: "lpg-chip", text: w, on: { click: function () { check(w); } } }));
        });
      } else {
        var input = g.el("input", { type: "text", class: "lpg-input", "aria-label": "Missing word" });
        answerUi = g.el("form", { class: "lpg-row", on: { submit: function (e) { e.preventDefault(); check(input.value); } } }, [input, g.el("button", { type: "submit", class: "lpg-btn", text: "Check" })]);
      }
      g.stage.append(g.el("p", { class: "lpg-progress", text: "Sentence " + (i + 1) + " of " + qs.length }), sentence, g.speakBtn(q.text.replace(/\[[^\]]+\]/, "blank")), answerUi, fb);
      g.status("Score " + score);
    }
    show();
  };

  /* ---------- Speed Review (timer off unless turned on) ---------- */
  TEMPLATES.speed = function (g, items) {
    var qs = items.filter(function (r) { return r[1]; });
    if (qs.length < 2) {
      g.stage.append(g.el("p", { class: "lpg-empty", text: "Speed Review needs at least two lines: question, answer." }));
      return;
    }
    var timerOn = !!g.game.opts.timer;
    var order, i, score, left, tick;
    function start() {
      order = g.shuffle(qs);
      i = 0;
      score = 0;
      left = 60;
      clearInterval(tick);
      if (timerOn)
        tick = setInterval(function () {
          left--;
          if (left <= 0) {
            clearInterval(tick);
            end();
          } else g.status("Score " + score + " · " + left + "s");
        }, 1000);
      show();
    }
    function end() {
      clearInterval(tick);
      g.stage.innerHTML = "";
      g.stage.append(g.el("div", { class: "lpg-done" }, [g.el("p", { class: "lpg-big", text: "Score: " + score + " of " + Math.min(i, order.length) }), g.again("Play again", start)]));
      g.status("Done");
      g.say("Score " + score);
    }
    function show() {
      if (i >= order.length) return end();
      g.stage.innerHTML = "";
      var q = order[i];
      var others = g.shuffle(qs.filter(function (r) { return r !== q && g.norm(r[1]) !== g.norm(q[1]); }).map(function (r) { return r[1]; })).filter(function (a, k, arr) { return arr.indexOf(a) === k; }).slice(0, 3);
      var choices = g.shuffle([q[1]].concat(others));
      var fb = g.el("p", { class: "lpg-fb", "aria-live": "polite" });
      var list = g.el("div", { class: "lpg-choices" });
      var tries = 0;
      choices.forEach(function (c) {
        var b = g.el("button", { type: "button", class: "lpg-choice", text: c, on: { click: function () {
          tries++;
          if (c === q[1]) {
            if (tries === 1) score++;
            b.classList.add("is-right");
            fb.textContent = "Yes!";
            i++;
            setTimeout(show, g.RM ? 250 : 700);
          } else {
            b.classList.add("is-wrong");
            b.disabled = true;
            fb.textContent = "Not that one. Try again.";
          }
          g.say(fb.textContent);
          g.status("Score " + score + (timerOn ? " · " + left + "s" : ""));
        } } });
        list.append(b);
      });
      g.stage.append(g.el("p", { class: "lpg-progress", text: "Question " + (i + 1) + " of " + order.length }), g.el("p", { class: "lpg-big" }, [g.icon(q[0]), q[0]]), g.speakBtn(q[0]), list, fb);
      list.querySelector("button").focus({ preventScroll: true });
      g.status("Score " + score + (timerOn ? " · " + left + "s" : ""));
    }
    start();
  };

  window.LPGame = { mount: mount, templates: Object.keys(TEMPLATES) };
})();
