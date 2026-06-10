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
  // level: 'level-1' or 'level-2'. Sets body class pk-level-1 / pk-level-2.
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
    // Optional per-page callback so a page can pre-fill friendlier numbers.
    if (typeof window.onLevelChange === "function") {
      window.onLevelChange(level);
    }
  };

  // opts: { storageKey, default: 'level-1' }
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
  // inputId: element to read; correctValue: number or string; tolerance: number
  // Renders into #<inputId>Fb if present, else returns boolean only.
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
  // pairs: [[label, value], ...]
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

  // rows: [{ label, me, partner, fmt? }] — renders me / partner / difference
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
  // sampleArray: numbers; myValue: number; labels: { mean?, me? } optional
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
  // before/after: objects of { label: value }; labels: optional title
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

  // rows: array of arrays (cells). Header optional as first row.
  PK.downloadCsv = function (name, rows) {
    const esc = (c) => {
      const s = String(c == null ? "" : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    PK.dl(name, "text/csv", csv);
  };

  /* ---------------- Save / load (localStorage) ---------------- */
  // Saves every element carrying [data-save]; keyed by storageKey.
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
      /Rubric|Answer Key/i.test(h2)
    );
  }

  function partBannerLabel(section) {
    const raw = (section.querySelector(".arc-banner")?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    const n = raw.match(/part\s*(\d)/i);
    if (!n) return null;
    if (n[1] === "1") return "Your Turn";
    if (n[1] === "2") return "Compare";
    if (n[1] === "3") return "Real World";
    return "Part " + n[1];
  }

  function hasArcBanner(section) {
    return !!section.querySelector(".arc-banner");
  }

  function shortLabel(text, max) {
    max = max || 26;
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max - 1).trim() + "…";
  }

  function phaseLabel(section) {
    const part = partBannerLabel(section);
    if (part) return part;
    const h2 = phaseH2(section);
    if (/Visual Math Notes/i.test(h2)) return "Get Ready";
    if (/Quick-Check Answer Key/i.test(h2)) return "Check Answers";
    if (/Rubric/i.test(h2)) return "Rubric";
    if (h2) return shortLabel(h2, 28);
    const num = section.querySelector(".phase-num");
    if (num && num.textContent.trim()) {
      const n = num.textContent.trim();
      if (n === "★" || n === "✓") return n === "★" ? "Your Project" : "Rubric";
      return "Step " + n;
    }
    return "Step";
  }

  function pairLabel(a, b) {
    const la = phaseLabel(a);
    const lb = phaseLabel(b);
    const na = a.querySelector(".phase-num");
    const nb = b.querySelector(".phase-num");
    const aNum = na && /^\d+$/.test(na.textContent.trim()) ? na.textContent.trim() : null;
    const bNum = nb && /^\d+$/.test(nb.textContent.trim()) ? nb.textContent.trim() : null;
    if (aNum && bNum) return "Steps " + aNum + "–" + bNum;
    if (la === lb) return la;
    return shortLabel(la + " & " + lb, 30);
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
      if (hasArcBanner(section)) {
        groups.push({ label: phaseLabel(section), sections: [section] });
        i += 1;
        continue;
      }
      const next = middle[i + 1];
      if (next && !hasArcBanner(next)) {
        groups.push({ label: pairLabel(section, next), sections: [section, next] });
        i += 2;
      } else {
        groups.push({ label: phaseLabel(section), sections: [section] });
        i += 1;
      }
    }
    if (finish.length === 1) {
      groups.push({ label: phaseLabel(finish[0]), sections: finish });
    } else if (finish.length === 2) {
      groups.push({ label: "Finish Up", sections: finish });
    } else if (finish.length > 2) {
      groups.push({ label: phaseLabel(finish[0]), sections: [finish[0]] });
      groups.push({ label: "Rubric & Check", sections: finish.slice(1) });
    }
    return groups;
  }

  function tabStorageKey() {
    return "pk-tabs:" + (location.pathname || "project");
  }

  // opts: { wrap?: selector, sticky?: bool, storageKey?: string }
  PK.initProjectTabs = function (opts) {
    opts = opts || {};
    if (document.body.hasAttribute("data-pk-no-tabs")) return;
    const wrap =
      (opts.wrap && document.querySelector(opts.wrap)) ||
      document.querySelector(".wrap");
    if (!wrap) return;
    const allPhases = Array.from(wrap.querySelectorAll(":scope > section.phase"));
    if (allPhases.length < 3) return;
    if (wrap.querySelector(".pk-tabs-wrap")) return;

    const teacher = allPhases.filter((s) => s.classList.contains("teacher-key"));
    const phases = allPhases.filter((s) => !s.classList.contains("teacher-key"));
    const groups = buildTabGroups(phases);
    if (groups.length < 2) return;

    const storageKey = opts.storageKey || tabStorageKey();
    let active = 0;
    try {
      const saved = parseInt(sessionStorage.getItem(storageKey), 10);
      if (!Number.isNaN(saved) && saved >= 0 && saved < groups.length) active = saved;
    } catch (e) {
      /* ignore */
    }

    const tabsWrap = document.createElement("div");
    tabsWrap.className =
      "pk-tabs-wrap pk-no-print" + (opts.sticky !== false ? " pk-tabs-sticky" : "");

    const hint = document.createElement("p");
    hint.className = "pk-tab-hint";
    hint.textContent =
      "Work one tab at a time — use the steps across the top to move through the project.";
    tabsWrap.appendChild(hint);

    const tablist = document.createElement("div");
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "Project steps");
    tablist.className = "pk-tablist";

    const panelsWrap = document.createElement("div");
    panelsWrap.className = "pk-tab-panels";

    const anchor =
      wrap.querySelector(":scope > .intro-card") ||
      wrap.querySelector(":scope > .progress-wrap") ||
      phases[0];
    const tabs = [];
    const panels = [];

    function selectTab(index, focusTab) {
      active = index;
      tabs.forEach((tab, idx) => {
        const on = idx === index;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach((entry, idx) => {
        entry.el.dataset.active = idx === index ? "true" : "false";
        entry.el.hidden = idx !== index;
      });
      try {
        sessionStorage.setItem(storageKey, String(index));
      } catch (e) {
        /* ignore */
      }
      if (focusTab && tabs[index]) tabs[index].focus();
    }

    groups.forEach((group, idx) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "pk-tab";
      tab.setAttribute("role", "tab");
      tab.id = "pk-tab-" + idx;
      tab.setAttribute("aria-controls", "pk-panel-" + idx);
      tab.textContent = group.label;
      tab.addEventListener("click", () => selectTab(idx, false));
      tab.addEventListener("keydown", (ev) => {
        let next = null;
        if (ev.key === "ArrowRight" || ev.key === "ArrowDown") next = (idx + 1) % groups.length;
        else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp")
          next = (idx - 1 + groups.length) % groups.length;
        else if (ev.key === "Home") next = 0;
        else if (ev.key === "End") next = groups.length - 1;
        if (next !== null) {
          ev.preventDefault();
          selectTab(next, true);
        }
      });
      tablist.appendChild(tab);
      tabs.push(tab);

      const panel = document.createElement("div");
      panel.className = "pk-tab-panel";
      panel.id = "pk-panel-" + idx;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panelsWrap.appendChild(panel);
      panels.push({ el: panel, sections: group.sections });
    });

    tabsWrap.appendChild(tablist);

    anchor.insertAdjacentElement("afterend", tabsWrap);
    tabsWrap.insertAdjacentElement("afterend", panelsWrap);
    panels.forEach((entry) => {
      entry.sections.forEach((section) => entry.el.appendChild(section));
    });
    teacher.forEach((section) => wrap.appendChild(section));

    selectTab(active, false);
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (document.body.classList.contains("pk")) {
      PK.initProjectTabs();
    }
  });

  window.PK = PK;
})();
