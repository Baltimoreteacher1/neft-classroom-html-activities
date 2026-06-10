/* ==========================================================================
   Neft Teacher — Projects Kit (shared)
   Reusable, dependency-free helpers for culminating projects built to the
   "Stats of My Life" standard. Reference as /shared/projects/projects-kit.js
   (load with `defer` or at end of <body>).

   Everything is namespaced under window.PK. Pages call small init/helper
   functions and supply their own unit-specific data and calculators.

   Public API (window.PK):
     toggleEs()                       — toggle EN/ES help (.pk-show-es on body)
     setLevel(level, storageKey?)     — 'level-1' | 'level-2' tier; persists
     initLevel(opts)                  — wire Level buttons + restore saved level
     checkWork(inputId, correct, tol) — green Correct / red Try again
     peerCompare(container, rows)     — render me-vs-partner stat cards
     statDiffCards(container, pairs)  — generic labeled stat cards
     worldMeter(container, sample, my, labels) — render the meter bar
     whatIf(container, before, after, labels)  — before/after readout
     generateReport(boxId, text)      — fill a .pk-report box
     copyReport(boxId)                — copy report text to clipboard
     downloadText(name, boxId)        — download report as .txt
     downloadCsv(name, rows)          — download data rows as .csv
     save(storageKey)                 — save all [data-save] fields
     load(storageKey, opts?)          — restore all [data-save] fields
     mean(arr) / sum(arr)             — small numeric helpers
     initProjectTabs(opts?)           — group .phase sections into step tabs
   ========================================================================== */
(function () {
  "use strict";

  const PK = {};

  const $ = (id) => document.getElementById(id);

  /* ---------------- EN/ES toggle ---------------- */
  PK.toggleEs = function () {
    document.body.classList.toggle("pk-show-es");
  };

  /* ---------------- Level 1 / Level 2 tiers ---------------- */
  PK.setLevel = function (level, storageKey) {
    document.body.classList.remove("pk-level-1", "pk-level-2");
    if (level === "level-1") document.body.classList.add("pk-level-1");
    if (level === "level-2") document.body.classList.add("pk-level-2");
    document.querySelectorAll("[data-level-btn]").forEach((b) => {
      b.setAttribute(
        "aria-pressed",
        b.getAttribute("data-level-btn") === level ? "true" : "false",
      );
    });
    if (storageKey) {
      try {
        localStorage.setItem(storageKey + ":level", level);
      } catch (e) {
        /* ignore storage errors */
      }
    }
    if (typeof window.onLevelChange === "function") {
      window.onLevelChange(level);
    }
  };

  PK.initLevel = function (opts) {
    opts = opts || {};
    document.querySelectorAll("[data-level-btn]").forEach((b) => {
      b.addEventListener("click", () =>
        PK.setLevel(b.getAttribute("data-level-btn"), opts.storageKey),
      );
    });
    let saved = null;
    if (opts.storageKey) {
      try {
        saved = localStorage.getItem(opts.storageKey + ":level");
      } catch (e) {
        saved = null;
      }
    }
    PK.setLevel(saved || opts.default || "level-1", opts.storageKey);
  };

  /* ---------------- Self-check ---------------- */
  PK.checkWork = function (inputId, correctValue, tolerance) {
    const el = $(inputId);
    if (!el) return false;
    const raw = (el.value || "").trim();
    let ok = false;
    if (typeof correctValue === "number") {
      const v = parseFloat(raw);
      ok = !Number.isNaN(v) && Math.abs(v - correctValue) <= (tolerance || 0);
    } else {
      const norm = (s) =>
        String(s).toLowerCase().replace(/\s+/g, "").replace(/,/g, ",");
      ok = norm(raw) === norm(correctValue);
    }
    const fb = $(inputId + "Fb");
    if (fb) {
      fb.innerHTML = raw
        ? ok
          ? '<span class="pk-ok">✅ Correct</span>'
          : '<span class="pk-bad">❌ Try again</span>'
        : '<span class="pk-bad">Enter an answer to check.</span>';
    }
    return ok;
  };

  /* ---------------- Stat / compare cards ---------------- */
  PK.statDiffCards = function (container, pairs) {
    const box = typeof container === "string" ? $(container) : container;
    if (!box) return;
    box.innerHTML = pairs
      .map(
        (p) =>
          `<div class="pk-stat"><small>${p[0]}</small><b>${p[1]}</b></div>`,
      )
      .join("");
  };

  PK.peerCompare = function (container, rows) {
    const box = typeof container === "string" ? $(container) : container;
    if (!box) return;
    const cards = [];
    rows.forEach((r) => {
      const fmt = r.fmt || ((x) => x);
      const diff = Math.abs(Number(r.me) - Number(r.partner));
      cards.push([r.label + " — me", fmt(r.me)]);
      cards.push([r.label + " — partner", fmt(r.partner)]);
      cards.push([r.label + " — difference", fmt(diff)]);
    });
    PK.statDiffCards(box, cards);
  };

  /* ---------------- World meter ---------------- */
  PK.worldMeter = function (container, sampleArray, myValue, labels) {
    const box = typeof container === "string" ? $(container) : container;
    if (!box) return;
    labels = labels || {};
    const clean = sampleArray
      .filter((v) => !Number.isNaN(Number(v)))
      .map(Number);
    if (!clean.length || Number.isNaN(Number(myValue))) {
      box.innerHTML =
        '<p class="pk-fb">Type your number to compare to the world sample.</p>';
      return;
    }
    const my = Number(myValue);
    const avg = PK.mean(clean);
    const min = Math.min(Math.min.apply(null, clean), my);
    const max = Math.max(Math.max.apply(null, clean), my);
    const range = max - min || 1;
    const meanPos = ((avg - min) / range) * 100;
    const myPos = ((my - min) / range) * 100;
    const meanLbl = labels.mean || "Sample avg";
    const meLbl = labels.me || "Me";
    const rel = my > avg ? "above" : my < avg ? "below" : "equal to";
    box.innerHTML =
      `<div class="pk-meter"><div class="pk-meter-fill" style="width:${Math.max(
        meanPos,
        myPos,
      )}%"></div>` +
      `<div class="pk-mark" style="left:${meanPos}%"><span>${meanLbl} ${avg.toFixed(
        2,
      )}</span></div>` +
      `<div class="pk-mark pk-me" style="left:${myPos}%"><span>${meLbl} ${my}</span></div></div>` +
      `<p><b>Your number is ${rel} the sample average of ${avg.toFixed(2)}.</b></p>`;
  };

  /* ---------------- What-If lab ---------------- */
  PK.whatIf = function (container, before, after, title) {
    const box = typeof container === "string" ? $(container) : container;
    if (!box) return;
    const fmtRow = (obj) =>
      Object.keys(obj)
        .map((k) => `${k}: <b>${obj[k]}</b>`)
        .join(" · ");
    box.innerHTML =
      (title ? `<p>${title}</p>` : "") +
      `<p><b>Before:</b> ${fmtRow(before)}</p>` +
      `<p><b>After:</b> ${fmtRow(after)}</p>`;
  };

  /* ---------------- Report + export ---------------- */
  PK.generateReport = function (boxId, text) {
    const box = $(boxId);
    if (box) box.textContent = text;
    return text;
  };

  PK.copyReport = function (boxId) {
    const box = $(boxId);
    if (!box) return;
    const txt = box.textContent || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(
        () => alert("Report copied to the clipboard."),
        () => alert("Could not copy automatically — select the text instead."),
      );
    } else {
      alert("Copy is not available in this browser — select the text instead.");
    }
  };

  PK.dl = function (name, type, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  PK.downloadText = function (name, boxId) {
    const box = $(boxId);
    PK.dl(name, "text/plain", box ? box.textContent : "");
  };

  PK.downloadCsv = function (name, rows) {
    const esc = (c) => {
      const s = String(c == null ? "" : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    PK.dl(name, "text/csv", csv);
  };

  /* ---------------- Save / load (localStorage) ---------------- */
  PK.save = function (storageKey, opts) {
    opts = opts || {};
    const data = {};
    document.querySelectorAll("[data-save]").forEach((el) => {
      const key = el.id || el.getAttribute("data-save");
      if (!key) return;
      if (el.type === "checkbox") data[key] = el.checked;
      else data[key] = el.value;
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      if (opts.silent !== true) alert("Saved on this device.");
    } catch (e) {
      alert("Could not save on this device.");
    }
  };

  PK.load = function (storageKey, opts) {
    opts = opts || {};
    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (e) {
      data = {};
    }
    Object.keys(data).forEach((k) => {
      const el = $(k) || document.querySelector(`[data-save="${k}"]`);
      if (!el) return;
      if (el.type === "checkbox") el.checked = !!data[k];
      else el.value = data[k];
    });
    if (typeof opts.after === "function") opts.after();
    if (opts.show === true) alert("Loaded your saved work.");
  };

  /* ---------------- numeric helpers ---------------- */
  PK.sum = function (arr) {
    return arr.reduce((a, b) => a + Number(b), 0);
  };
  PK.mean = function (arr) {
    return arr.length ? PK.sum(arr) / arr.length : 0;
  };

  /* ---------------- Project step tabs ---------------- */
  function phaseH2(section) {
    const h2 = section.querySelector(".phase-head h2, h2");
    return h2 ? h2.textContent.trim() : "";
  }

  function arcBannerText(section) {
    return (section.querySelector(".arc-banner")?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isVocabPhase(section) {
    return /Visual Math Notes/i.test(phaseH2(section));
  }

  function isFinishPhase(section) {
    const num = section.querySelector(".phase-num");
    const t = num ? num.textContent.trim() : "";
    const h2 = phaseH2(section);
    return (
      t === "★" ||
      t === "✓" ||
      /Rubric|Answer Key|How You Are Scored/i.test(h2)
    );
  }

  function isSetupPhase(section) {
    return /project setup/i.test(arcBannerText(section));
  }

  function partSubLetter(section) {
    const m = arcBannerText(section).match(/part\s*1\s*([a-e])/i);
    return m ? m[1].toLowerCase() : null;
  }

  function partNumber(section) {
    const raw = arcBannerText(section);
    if (/part\s*2/i.test(raw)) return 2;
    if (/part\s*3/i.test(raw)) return 3;
    if (/part\s*1/i.test(raw)) return 1;
    return 0;
  }

  function hasArcBanner(section) {
    return !!section.querySelector(".arc-banner");
  }

  function shortLabel(text, max) {
    max = max || 24;
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max - 1).replace(/\s+\S*$/, "").trim() + "…";
  }

  function part1PairLabel(a, b) {
    const subs = [partSubLetter(a), partSubLetter(b)].filter(Boolean);
    const letters = subs.join("");
    if (/a|b/.test(letters)) return "Part 1: Your Idea";
    if (/c|d/.test(letters)) return "Part 1: Run the Numbers";
    if (/e/.test(letters)) return "Part 1: Go Deeper";
    const h2 = phaseH2(a);
    if (/plan|setup|start|choose|pick/i.test(h2)) return "Part 1: Your Plan";
    if (/calc|compute|solve|budget|cost|number/i.test(h2))
      return "Part 1: Run the Numbers";
    if (h2) return "Part 1: " + shortLabel(h2, 18);
    return "Part 1: Your Idea";
  }

  function part1SingleLabel(section) {
    const sub = partSubLetter(section);
    if (sub === "a" || sub === "b") return "Part 1: Your Idea";
    if (sub === "c" || sub === "d") return "Part 1: Run the Numbers";
    if (sub === "e") return "Part 1: Go Deeper";
    const h2 = phaseH2(section);
    if (h2) return "Part 1: " + shortLabel(h2, 18);
    return "Part 1: Your Idea";
  }

  function statsPairLabel(a, b) {
    const text = (phaseH2(a) + " " + phaseH2(b)).toLowerCase();
    if (/collect|statistical question|your data/.test(text))
      return "Part 1: Gather Data";
    if (/mean|median|mode|range|mad|deviation/.test(text))
      return "Part 1: Analyze It";
    if (/display|describe|distribution/.test(text)) return "Part 1: Show It";
    return pairLabelGeneric(a, b);
  }

  function pairLabelGeneric(a, b) {
    const la = phaseLabel(a);
    const lb = phaseLabel(b);
    if (la === lb) return la;
    return shortLabel(la + " · " + lb, 28);
  }

  function phaseLabel(section) {
    if (isVocabPhase(section)) return "Get Ready";
    if (isSetupPhase(section)) return "Get Started";
    if (section.classList.contains("pk-research-phase")) return "Do Research";
    const pn = partNumber(section);
    if (pn === 2) return "Part 2: Compare";
    if (pn === 3) return "Part 3: Real World";
    if (pn === 1) return part1SingleLabel(section);
    const h2 = phaseH2(section);
    if (/Visual Math Notes/i.test(h2)) return "Get Ready";
    if (/Quick-Check Answer Key/i.test(h2)) return "Check Answers";
    if (/Rubric|How You Are Scored/i.test(h2)) return "Finish Strong";
    const num = section.querySelector(".phase-num");
    const t = num ? num.textContent.trim() : "";
    if (t === "★") return "Show Your Work";
    if (t === "✓") return "Finish Strong";
    if (/research/i.test(h2)) return "Do Research";
    if (h2) return shortLabel(h2, 24);
    return "Keep Going";
  }

  function pairLabel(a, b) {
    if (partNumber(a) === 1 || partNumber(b) === 1) return part1PairLabel(a, b);
    if (!hasArcBanner(a) && !hasArcBanner(b)) return statsPairLabel(a, b);
    return pairLabelGeneric(a, b);
  }

  function shouldPair(a, b) {
    if (!b) return false;
    if (hasArcBanner(a) && hasArcBanner(b)) {
      if (isSetupPhase(a) || isSetupPhase(b)) return false;
      if (partNumber(a) === 2 || partNumber(a) === 3) return false;
      if (partNumber(b) === 2 || partNumber(b) === 3) return false;
      const sa = partSubLetter(a);
      const sb = partSubLetter(b);
      if (sa && sb) {
        const pair = sa + sb;
        return /ab|cd|de|bc/.test(pair) || (sa === sb && sa === "a");
      }
      return false;
    }
    if (!hasArcBanner(a) && !hasArcBanner(b)) return true;
    return false;
  }

  function buildTabGroups(phases) {
    const groups = [];
    let start = 0;
    if (start < phases.length && isVocabPhase(phases[start])) {
      groups.push({ label: "Get Ready", sections: [phases[start]] });
      start += 1;
    }
    let end = phases.length;
    const finish = [];
    while (end > start && isFinishPhase(phases[end - 1])) {
      finish.unshift(phases[end - 1]);
      end -= 1;
    }
    const middle = phases.slice(start, end);
    let i = 0;
    while (i < middle.length) {
      const section = middle[i];
      const next = middle[i + 1];
      if (shouldPair(section, next)) {
        groups.push({
          label: pairLabel(section, next),
          sections: [section, next],
        });
        i += 2;
        continue;
      }
      groups.push({ label: phaseLabel(section), sections: [section] });
      i += 1;
    }
    if (finish.length === 1) {
      groups.push({ label: phaseLabel(finish[0]), sections: finish });
    } else if (finish.length === 2) {
      finish.forEach((section) => {
        groups.push({ label: phaseLabel(section), sections: [section] });
      });
    } else if (finish.length > 2) {
      const star = finish.filter((s) => {
        const t = s.querySelector(".phase-num")?.textContent.trim();
        return t === "★";
      });
      const rest = finish.filter((s) => {
        const t = s.querySelector(".phase-num")?.textContent.trim();
        return t !== "★";
      });
      star.forEach((section) => {
        groups.push({ label: "Show Your Work", sections: [section] });
      });
      if (rest.length === 1) {
        groups.push({ label: phaseLabel(rest[0]), sections: rest });
      } else if (rest.length > 1) {
        groups.push({ label: "Finish Strong", sections: rest });
      }
    }
    return groups;
  }

  function tabStorageKey() {
    return "pk-tabs:" + (location.pathname || "project");
  }

  /** Direct-child phases under .wrap; reclaim orphans when markup closed .wrap early. */
  function collectWrapPhases(wrap) {
    const phases = Array.from(wrap.querySelectorAll(":scope > section.phase"));
    let node = wrap.nextElementSibling;
    while (node) {
      if (node.matches("section.phase")) {
        wrap.appendChild(node);
        phases.push(node);
        node = wrap.nextElementSibling;
        continue;
      }
      if (node.matches("section.pk-visualizer-card, section.pk-dashboard")) {
        const anchor = phases[phases.length - 1];
        if (anchor) anchor.appendChild(node);
        else wrap.appendChild(node);
        node = wrap.nextElementSibling;
        continue;
      }
      if (node.matches("p.footer, footer")) break;
      break;
    }
    return phases;
  }

  PK.collectWrapPhases = collectWrapPhases;

  /* ---------------- Step flow within tab panels ---------------- */
  const STEP_STARTERS =
    ".task, .q-group, .pk-mt-card, .pk-fn-row, .pk-inv-checklist, .pk-mission-brief, .pk-field-notes, .pk-math-tasks, .pk-vocab, ul.checklist, ol.checklist, .checklist";

  function isStepStarter(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches(STEP_STARTERS)) return true;
    if (el.tagName === "H3") return true;
    if (el.classList.contains("grid2")) return true;
    if (el.classList.contains("pk-callout")) return true;
    if (
      el.classList.contains("pk-math-scaffold-card") ||
      el.classList.contains("pk-visualizer-card") ||
      el.classList.contains("pk-dashboard")
    )
      return true;
    return false;
  }

  function isIntroNode(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches("p, .arc-banner, .pk-phase-intro")) return true;
    return false;
  }

  function stepTitleFromNodes(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (!el || el.nodeType !== 1) continue;
      if (el.classList.contains("task")) {
        const strong = el.querySelector("strong");
        const raw = strong ? strong.textContent : el.textContent;
        return shortLabel(raw.replace(/:$/, "").trim(), 52);
      }
      if (el.classList.contains("q-group")) {
        const p = el.querySelector("p");
        if (p) return shortLabel(p.textContent.trim(), 52);
      }
      if (el.classList.contains("pk-mt-card")) {
        const h = el.querySelector("h4");
        if (h) return shortLabel(h.textContent.trim(), 52);
      }
      if (el.classList.contains("pk-fn-row")) {
        const lbl = el.querySelector(".fld");
        if (lbl) return shortLabel(lbl.textContent.trim(), 52);
      }
      if (el.tagName === "H3") return shortLabel(el.textContent.trim(), 52);
      if (el.classList.contains("pk-vocab"))
        return "Learn the vocabulary";
      if (el.classList.contains("pk-callout")) {
        const h = el.querySelector("h3");
        if (h) return shortLabel(h.textContent.trim(), 52);
      }
      if (el.classList.contains("grid2")) {
        const h = el.querySelector("h2, h3");
        if (h) return shortLabel(h.textContent.trim(), 52);
      }
      if (el.matches("label.fld")) return shortLabel(el.textContent.trim(), 52);
    }
    return "Complete this part";
  }

  function wrapScaffolds(stepBody) {
    stepBody
      .querySelectorAll(
        ".pk-math-scaffold-card, .pk-visualizer-card, .pk-dashboard, .pk-mission-brief",
      )
      .forEach((node) => {
        if (node.closest(".pk-scaffold-zone")) return;
        const zone = document.createElement("div");
        zone.className = "pk-scaffold-zone";
        const lbl = document.createElement("div");
        lbl.className = "pk-zone-label";
        lbl.textContent = "Reference · look here first";
        node.parentNode.insertBefore(zone, node);
        zone.appendChild(lbl);
        zone.appendChild(node);
      });
  }

  function wrapWorkspaces(stepBody) {
    const hints = Array.from(stepBody.querySelectorAll("details.hintbox"));
    hints.forEach((hint) => {
      if (hint.closest(".pk-problem-workspace")) return;
      let prev = hint.previousElementSibling;
      const block = [];
      while (
        prev &&
        (prev.matches(
          "label.fld, input, textarea, select, button, .readout, .feedback, .pk-fb, .btn, .pk-whatif, .pk-stats, .pk-meter, .pk-level-toggle, .pk-lvl1, .pk-lvl2",
        ) ||
          prev.classList.contains("grid2"))
      ) {
        block.unshift(prev);
        prev = prev.previousElementSibling;
      }
      if (!block.length) return;
      const ws = document.createElement("div");
      ws.className = "pk-problem-workspace";
      const wsLbl = document.createElement("div");
      wsLbl.className = "pk-zone-label";
      wsLbl.textContent = "Your work";
      block[0].parentNode.insertBefore(ws, block[0]);
      ws.appendChild(wsLbl);
      block.forEach((n) => ws.appendChild(n));
      const hintWrap = document.createElement("div");
      hintWrap.className = "pk-problem-hint";
      ws.appendChild(hintWrap);
      hintWrap.appendChild(hint);
    });
  }

  function wrapProblemCards(stepBody) {
    stepBody.querySelectorAll(".q-group").forEach((qg) => {
      if (qg.classList.contains("pk-problem-card")) return;
      qg.classList.add("pk-problem-card");
      const p = qg.querySelector("p");
      if (p && !p.querySelector(".pk-problem-num")) {
        const num = document.createElement("span");
        num.className = "pk-problem-num";
        num.textContent = "Problem";
        p.insertBefore(num, p.firstChild);
      }
    });
  }

  function structurePhase(phase) {
    if (phase.dataset.pkFlow === "1") return 0;
    const head = phase.querySelector(":scope > .phase-head");
    const nodes = Array.from(phase.children).filter((n) => n !== head);
    if (!nodes.length) return 0;

    const intro = [];
    const stepGroups = [];
    let current = [];

    function flush() {
      if (current.length) {
        stepGroups.push(current);
        current = [];
      }
    }

    nodes.forEach((node) => {
      if (!stepGroups.length && !current.length && isIntroNode(node)) {
        intro.push(node);
        return;
      }
      if (isStepStarter(node)) {
        flush();
        current.push(node);
        return;
      }
      if (!current.length) intro.push(node);
      else current.push(node);
    });
    flush();

    if (!stepGroups.length) stepGroups.push(nodes);

    const flow = document.createElement("div");
    flow.className = "pk-flow-steps";

    if (intro.length) {
      const introWrap = document.createElement("div");
      introWrap.className = "pk-phase-intro";
      intro.forEach((n) => introWrap.appendChild(n));
      flow.appendChild(introWrap);
    }

    stepGroups.forEach((group) => {
      const step = document.createElement("article");
      step.className = "pk-flow-step";

      const stepHead = document.createElement("header");
      stepHead.className = "pk-step-head";

      const badge = document.createElement("span");
      badge.className = "pk-step-badge";
      badge.setAttribute("aria-hidden", "true");

      const meta = document.createElement("div");
      meta.className = "pk-step-meta";

      const goal = document.createElement("div");
      goal.className = "pk-step-goal";
      goal.textContent = "What you'll do";

      const title = document.createElement("h3");
      title.className = "pk-step-title";
      title.textContent = stepTitleFromNodes(group);

      meta.appendChild(goal);
      meta.appendChild(title);
      stepHead.appendChild(badge);
      stepHead.appendChild(meta);
      step.appendChild(stepHead);

      const body = document.createElement("div");
      body.className = "pk-step-body";
      group.forEach((n) => body.appendChild(n));
      wrapScaffolds(body);
      wrapWorkspaces(body);
      wrapProblemCards(body);
      step.appendChild(body);
      flow.appendChild(step);
    });

    nodes.forEach((n) => {
      if (n.parentNode === phase) phase.removeChild(n);
    });
    phase.appendChild(flow);
    phase.classList.add("pk-flow-phase");
    phase.dataset.pkFlow = "1";
    return stepGroups.length;
  }

  function enhancePanelFlow(panel, label) {
    if (!panel || panel.dataset.pkFlowPanel === "1") return 0;
    const phases = panel.querySelectorAll(":scope > .phase");
    let stepTotal = 0;

    const header = document.createElement("div");
    header.className = "pk-panel-header";

    const objective = document.createElement("div");
    objective.className = "pk-panel-objective";
    const objLbl = document.createElement("span");
    objLbl.className = "pk-panel-obj-label";
    objLbl.textContent = "In this step";
    const objText = document.createElement("p");
    objText.className = "pk-panel-obj-text";
    objText.textContent = label || "Work through each part below.";
    objective.appendChild(objLbl);
    objective.appendChild(objText);

    const progress = document.createElement("div");
    progress.className = "pk-panel-progress";
    progress.setAttribute("aria-live", "polite");

    header.appendChild(objective);
    header.appendChild(progress);
    panel.insertBefore(header, panel.firstChild);

    phases.forEach((phase) => {
      stepTotal += structurePhase(phase);
    });

    const badges = panel.querySelectorAll(".pk-step-badge");
    badges.forEach((badge, idx) => {
      badge.textContent = String(idx + 1);
      const step = badge.closest(".pk-flow-step");
      if (step) step.dataset.stepIndex = String(idx + 1);
    });

    progress.textContent =
      stepTotal > 1
        ? stepTotal + " steps in this part — work top to bottom"
        : "1 step in this part";

    panel.dataset.pkFlowPanel = "1";
    panel.dataset.pkStepTotal = String(stepTotal);
    return stepTotal;
  }

  PK.enhancePanelFlow = enhancePanelFlow;

  PK.initProjectTabs = function (opts) {
    opts = opts || {};
    if (document.body.hasAttribute("data-pk-no-tabs")) return;
    const wrap =
      (opts.wrap && document.querySelector(opts.wrap)) ||
      document.querySelector(".wrap");
    if (!wrap) return;
    const allPhases = collectWrapPhases(wrap);
    if (allPhases.length < 3) return;
    if (wrap.querySelector(".pk-tabs-wrap")) return;

    const teacher = allPhases.filter((s) => s.classList.contains("teacher-key"));
    const phases = allPhases.filter((s) => !s.classList.contains("teacher-key"));
    const groups = buildTabGroups(phases);
    if (groups.length < 2) return;

    const storageKey = opts.storageKey || tabStorageKey();
    const total = groups.length;
    let active = 0;
    let furthest = 0;
    try {
      const saved = parseInt(sessionStorage.getItem(storageKey), 10);
      if (!Number.isNaN(saved) && saved >= 0 && saved < total) active = saved;
      furthest = active;
    } catch (e) {
      /* ignore */
    }

    const tabsWrap = document.createElement("div");
    tabsWrap.className =
      "pk-tabs-wrap pk-no-print" + (opts.sticky !== false ? " pk-tabs-sticky" : "");

    const topRow = document.createElement("div");
    topRow.className = "pk-tabbar-top";
    const stepCount = document.createElement("div");
    stepCount.className = "pk-step-count";
    const stepBar = document.createElement("div");
    stepBar.className = "pk-step-bar";
    const stepFill = document.createElement("i");
    stepBar.appendChild(stepFill);
    topRow.appendChild(stepCount);
    topRow.appendChild(stepBar);

    const hint = document.createElement("p");
    hint.className = "pk-tab-hint";
    hint.textContent =
      "Work one step at a time — tap a tab across the top when you're ready to move on.";

    const tablist = document.createElement("div");
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "Project steps");
    tablist.className = "pk-tablist";

    const panelsWrap = document.createElement("div");
    panelsWrap.className = "pk-tab-panels";

    const nav = document.createElement("div");
    nav.className = "pk-tabnav pk-no-print";
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "pk-prev";
    prevBtn.innerHTML = "← <span>Back</span>";
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "pk-next";
    nextBtn.innerHTML = "<span>Next step</span> →";
    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);

    const anchor =
      wrap.querySelector(":scope > .intro-card") ||
      wrap.querySelector(":scope > .progress-wrap") ||
      phases[0];
    const tabs = [];
    const panels = [];

    function markDone() {
      tabs.forEach((tab, idx) => {
        const done = idx < furthest;
        tab.classList.toggle("pk-done", done);
        const dot = tab.querySelector(".pk-tab-dot");
        if (dot) dot.textContent = done ? "✓" : String(idx + 1);
      });
    }

    function updateChrome(index) {
      stepCount.innerHTML =
        'Step <b>' +
        (index + 1) +
        "</b> of " +
        total +
        " · " +
        groups[index].label;
      stepFill.style.width = ((index + 1) / total) * 100 + "%";
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === total - 1;
      markDone();
    }

    function selectTab(index, focusTarget) {
      active = index;
      if (index > furthest) furthest = index;
      tabs.forEach((tab, idx) => {
        const on = idx === index;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach((entry, idx) => {
        const on = idx === index;
        entry.el.dataset.active = on ? "true" : "false";
        entry.el.hidden = !on;
        entry.el.classList.toggle("pk-tab-panel-active", on);
      });
      updateChrome(index);
      try {
        sessionStorage.setItem(storageKey, String(index));
      } catch (e) {
        /* ignore */
      }
      if (tabs[index] && tabs[index].scrollIntoView) {
        tabs[index].scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: "smooth",
        });
      }
      if (focusTarget === "tab" && tabs[index]) tabs[index].focus();
      if (focusTarget === "panel") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const panel = panels[index]?.el;
        if (panel) panel.focus({ preventScroll: true });
      }
    }

    groups.forEach((group, idx) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "pk-tab";
      tab.setAttribute("role", "tab");
      tab.id = "pk-tab-" + idx;
      tab.setAttribute("aria-controls", "pk-panel-" + idx);
      tab.setAttribute("aria-selected", "false");
      tab.tabIndex = -1;

      const dot = document.createElement("span");
      dot.className = "pk-tab-dot";
      dot.textContent = String(idx + 1);
      const lbl = document.createElement("span");
      lbl.className = "pk-tab-label";
      lbl.textContent = group.label;
      tab.appendChild(dot);
      tab.appendChild(lbl);

      tab.addEventListener("click", () => selectTab(idx, null));
      tab.addEventListener("keydown", (ev) => {
        let next = null;
        if (ev.key === "ArrowRight" || ev.key === "ArrowDown")
          next = (idx + 1) % total;
        else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp")
          next = (idx - 1 + total) % total;
        else if (ev.key === "Home") next = 0;
        else if (ev.key === "End") next = total - 1;
        if (next !== null) {
          ev.preventDefault();
          selectTab(next, "tab");
        }
      });
      tablist.appendChild(tab);
      tabs.push(tab);

      const panel = document.createElement("div");
      panel.className = "pk-tab-panel";
      panel.id = "pk-panel-" + idx;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.setAttribute("tabindex", "-1");
      panelsWrap.appendChild(panel);
      panels.push({ el: panel, sections: group.sections });
    });

    prevBtn.addEventListener("click", () => {
      if (active > 0) selectTab(active - 1, "panel");
    });
    nextBtn.addEventListener("click", () => {
      if (active < total - 1) selectTab(active + 1, "panel");
    });

    tabsWrap.appendChild(topRow);
    tabsWrap.appendChild(hint);
    tabsWrap.appendChild(tablist);

    anchor.insertAdjacentElement("afterend", tabsWrap);
    tabsWrap.insertAdjacentElement("afterend", panelsWrap);
    panelsWrap.insertAdjacentElement("afterend", nav);

    panels.forEach((entry, idx) => {
      entry.sections.forEach((section) => entry.el.appendChild(section));
      enhancePanelFlow(entry.el, groups[idx].label);
    });
    teacher.forEach((section) => wrap.appendChild(section));

    document.body.classList.add("pk-tabs-on");
    selectTab(active, null);

    window.PKTabs = {
      go: function (n) {
        selectTab(Math.max(0, Math.min(total - 1, n - 1)), "panel");
      },
      count: total,
      current: function () {
        return active + 1;
      },
    };
  };

  window.PK = PK;
})();
