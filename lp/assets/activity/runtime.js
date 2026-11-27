/* The Language Page activity runtime. Classic script, no imports, no network. Used by the Activity Builder preview
   and inlined into every exported activity. window.LPActivity.mount(element, { title, accent, blocks: [...] }). */
(function () {
  "use strict";
  var uid = 0;
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs)
      for (var k in attrs) {
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "text") n.textContent = v;
        else if (k === "on") for (var ev in v) n.addEventListener(ev, v[ev]);
        else n.setAttribute(k, v === true ? "" : v);
      }
    (kids || []).forEach(function (c) {
      if (c != null) n.append(c);
    });
    return n;
  }
  function speak(text) {
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.lang = "en-US";
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  var canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  function norm(s) {
    return String(s || "").trim().toLowerCase().replace(/[.!?,;:"']/g, "");
  }
  function shuffled(a) {
    var s = a.slice();
    for (var i = s.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = s[i];
      s[i] = s[j];
      s[j] = t;
    }
    if (s.length > 1 && s.join("|") === a.join("|")) s.push(s.shift());
    return s;
  }
  function listenBtn(text) {
    return canSpeak ? el("button", { type: "button", class: "lpa-btn lpa-ghost", text: "Listen", on: { click: function () { speak(text); } } }) : null;
  }

  var R = {};
  R.passage = function (b) {
    return [b.title ? el("h2", { text: b.title }) : null, listenBtn((b.title ? b.title + ". " : "") + (b.text || ""))].concat(
      String(b.text || "").split(/\n\s*\n/).map(function (p) {
        return el("p", { class: "lpa-read", text: p });
      }),
    );
  };
  R.audio = function (b) {
    var tr = el("details", { class: "lpa-transcript" }, [el("summary", { text: "Show the words" }), el("p", { text: b.text || "" })]);
    return [el("p", { class: "lpa-label", text: b.prompt || "Listen." }), canSpeak ? el("button", { type: "button", class: "lpa-btn", text: "▶ Play", on: { click: function () { speak(b.text || ""); } } }) : el("p", { text: "This device cannot read aloud. Open the words below." }), tr];
  };
  R.mc = function (b) {
    var fb = el("p", { class: "lpa-fb", "aria-live": "polite" });
    var list = el("div", { class: "lpa-choices", role: "group", "aria-label": b.question || "Choices" });
    (b.choices || []).forEach(function (c, i) {
      if (!String(c).trim()) return;
      var btn = el("button", { type: "button", class: "lpa-choice", text: c, on: { click: function () {
        list.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); x.classList.remove("is-right", "is-wrong"); });
        btn.setAttribute("aria-pressed", "true");
        var ok = i === Number(b.correct);
        btn.classList.add(ok ? "is-right" : "is-wrong");
        fb.textContent = ok ? "Yes! " + (b.feedback || "") : "Not quite. Try again.";
      } } });
      list.append(btn);
    });
    return [el("p", { class: "lpa-q", text: b.question || "" }), listenBtn(b.question || ""), list, fb];
  };
  R.order = function (b) {
    var correct = (b.items || []).filter(function (x) { return String(x).trim(); });
    var cur = shuffled(correct);
    var list = el("ol", { class: "lpa-order" });
    var fb = el("p", { class: "lpa-fb", "aria-live": "polite" });
    function draw(focusIdx, dir) {
      list.innerHTML = "";
      cur.forEach(function (item, i) {
        list.append(el("li", {}, [el("span", { text: item }), el("span", { class: "lpa-row" }, [
          el("button", { type: "button", class: "lpa-btn lpa-ghost lpa-small", "aria-label": "Move up: " + item, disabled: i === 0 ? true : null, text: "↑", on: { click: function () { var t = cur[i - 1]; cur[i - 1] = cur[i]; cur[i] = t; draw(i - 1, "up"); } } }),
          el("button", { type: "button", class: "lpa-btn lpa-ghost lpa-small", "aria-label": "Move down: " + item, disabled: i === cur.length - 1 ? true : null, text: "↓", on: { click: function () { var t = cur[i + 1]; cur[i + 1] = cur[i]; cur[i] = t; draw(i + 1, "down"); } } }),
        ])]));
      });
      if (focusIdx != null) {
        var btns = list.children[focusIdx].querySelectorAll("button");
        var target = dir === "up" ? btns[0] : btns[1];
        if (target && !target.disabled) target.focus();
        else btns[dir === "up" ? 1 : 0].focus();
      }
    }
    draw();
    return [el("p", { class: "lpa-q", text: b.prompt || "Put these in order." }), list, el("button", { type: "button", class: "lpa-btn", text: "Check the order", on: { click: function () {
      var right = cur.filter(function (x, i) { return x === correct[i]; }).length;
      fb.textContent = right === correct.length ? "Yes! Everything is in order." : right + " of " + correct.length + " are in the right place. Keep going.";
    } } }), fb];
  };
  R.cloze = function (b) {
    var parts = String(b.text || "").split(/(\[[^\]]+\])/);
    var answers = [];
    var p = el("p", { class: "lpa-read" });
    parts.forEach(function (part) {
      var m = /^\[([^\]]+)\]$/.exec(part);
      if (m) {
        var n = answers.length + 1;
        var input = el("input", { type: "text", class: "lpa-blank", "aria-label": "Blank " + n, autocomplete: "off", size: Math.max(6, m[1].length + 2) });
        answers.push({ input: input, answer: m[1] });
        p.append(input);
      } else p.append(part);
    });
    var fb = el("p", { class: "lpa-fb", "aria-live": "polite" });
    var bank = b.bank === false ? null : el("p", { class: "lpa-bank", text: "Word bank: " + shuffled(answers.map(function (a) { return a.answer; })).join(" · ") });
    return [el("p", { class: "lpa-q", text: b.prompt || "Fill in the blanks." }), bank, p, el("button", { type: "button", class: "lpa-btn", text: "Check", on: { click: function () {
      var right = 0;
      answers.forEach(function (a) {
        var ok = norm(a.input.value) === norm(a.answer);
        a.input.classList.toggle("is-right", ok);
        a.input.classList.toggle("is-wrong", !ok && a.input.value.trim() !== "");
        if (ok) right++;
      });
      fb.textContent = right === answers.length ? "All correct!" : right + " of " + answers.length + " correct.";
    } } }), fb];
  };
  R.short = function (b) {
    var id = "lpa-s" + ++uid;
    return [el("label", { class: "lpa-q", for: id, text: b.prompt || "Write your answer." }), el("textarea", { id: id, rows: String(b.lines || 4), class: "lpa-text" })];
  };
  R.frames = function (b) {
    var id = "lpa-f" + ++uid;
    var area = el("textarea", { id: id, rows: "5", class: "lpa-text" });
    var chips = el("div", { class: "lpa-row", role: "group", "aria-label": "Sentence starters" });
    (b.frames || []).forEach(function (f) {
      if (!String(f).trim()) return;
      chips.append(el("button", { type: "button", class: "lpa-chip", text: f, on: { click: function () { area.value += (area.value && !/\s$/.test(area.value) ? " " : "") + f + " "; area.focus(); } } }));
    });
    return [el("label", { class: "lpa-q", for: id, text: b.prompt || "Use a sentence starter." }), chips, area];
  };
  R.image = function (b) {
    if (!b.src) return [el("p", { class: "lpa-empty", text: "Add an image." })];
    var wrap = el("div", { class: "lpa-figure" });
    wrap.append(el("img", { src: b.src, alt: b.alt || "" }));
    var legend = el("ol", { class: "lpa-legend" });
    (b.labels || []).forEach(function (l, i) {
      var dot = el("span", { class: "lpa-dot", text: String(i + 1), "aria-hidden": "true" });
      dot.style.left = l.x + "%";
      dot.style.top = l.y + "%";
      wrap.append(dot);
      legend.append(el("li", { text: l.text || "" }));
    });
    return [b.prompt ? el("p", { class: "lpa-q", text: b.prompt }) : null, wrap, legend];
  };
  R.rubric = function (b) {
    var fs = el("fieldset", { class: "lpa-rubric" }, [el("legend", { text: b.title || "Check yourself" })]);
    (b.criteria || []).forEach(function (c) {
      if (!String(c).trim()) return;
      var id = "lpa-r" + ++uid;
      fs.append(el("div", { class: "lpa-check" }, [el("input", { type: "checkbox", id: id }), el("label", { for: id, text: c })]));
    });
    return [fs];
  };

  function mount(root, act) {
    root.innerHTML = "";
    var shell = el("div", { class: "lpa" });
    if (act.accent) shell.style.setProperty("--a-accent", act.accent);
    shell.append(el("h1", { class: "lpa-title", text: act.title || "Activity" }));
    (act.blocks || []).forEach(function (b, i) {
      var render = R[b.type];
      if (!render) return;
      shell.append(el("section", { class: "lpa-block lpa-" + b.type, "aria-label": "Part " + (i + 1) }, render(b)));
    });
    root.append(shell);
  }
  window.LPActivity = { mount: mount, types: Object.keys(R) };
})();
