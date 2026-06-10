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
      if (raw && ok && typeof PK.playSuccess === "function") {
        PK.playSuccess();
      }
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

  /* ---------------- Sound FX engine (Web Audio API) ---------------- */
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  PK.playSuccess = function () {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gain.gain.setValueAtTime(0.1, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.3);
      });
    } catch (e) {}
  };

  PK.playClick = function () {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  };

  // Auto-wire click sounds on interactive items
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, .pk-tab, .btn, .pk-research-inline-link');
    if (el) {
      PK.playClick();
    }
  });

  /* ---------------- Dynamic Vocabulary Tooltips (ELL/ESOL) ---------------- */
  PK.initVocabTooltips = function () {
    const terms = [];
    document.querySelectorAll(".pk-term").forEach((el) => {
      const b = el.querySelector("b");
      const p = el.querySelector("p");
      if (b && p) {
        terms.push({
          word: b.textContent.trim(),
          definition: p.textContent.trim(),
          icon: el.querySelector(".pk-icon")?.textContent.trim() || "💡"
        });
      }
    });

    if (!terms.length) return;

    const phases = Array.from(document.querySelectorAll(".phase")).slice(1);
    terms.sort((a, b) => b.word.length - a.word.length);

    phases.forEach((phase) => {
      walkTextNodes(phase, (node) => {
        let text = node.nodeValue;
        let replaced = false;
        
        for (const term of terms) {
          const regex = new RegExp(`\\b(${escapeRegExp(term.word)})\\b`, "gi");
          if (regex.test(text)) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = text.replace(regex, (match) => {
              return `<span class="pk-tooltip" data-tooltip="${term.icon} ${term.word}: ${term.definition}">${match}</span>`;
            });
            
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
              fragment.appendChild(tempDiv.firstChild);
            }
            node.parentNode.replaceChild(fragment, node);
            replaced = true;
            break;
          }
        }
      });
    });
  };

  function walkTextNodes(node, callback) {
    if (node.nodeType === Node.TEXT_NODE) {
      callback(node);
      return;
    }
    if (["SCRIPT", "STYLE", "INPUT", "TEXTAREA", "BUTTON", "SELECT", "A"].includes(node.nodeName)) {
      return;
    }
    if (node.classList && node.classList.contains("pk-tooltip")) {
      return;
    }
    const children = Array.from(node.childNodes);
    children.forEach((child) => walkTextNodes(child, callback));
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Scan tooltips when page is loaded
  window.addEventListener('DOMContentLoaded', () => {
    PK.initVocabTooltips();
    if (typeof PK.updateTabVisuals === 'function') {
      PK.updateTabVisuals();
    }
  });

  // Listen for input changes to drive interactive tab visualizers
  document.addEventListener('input', () => {
    if (typeof PK.updateTabVisuals === 'function') {
      PK.updateTabVisuals();
    }
  });

  /* ---------------- Interactive Tab visualizers ---------------- */
  PK.updateTabVisuals = function () {
    const $ = (id) => document.getElementById(id);
    
    // 1. GCF Venn Diagram
    const stickersEl = document.querySelector('input[id$="-stickers"], input[id$="stickers"]');
    const barsEl = document.querySelector('input[id$="-bars"], input[id$="bars"]');
    if (stickersEl && barsEl && $("gcf-svg-center")) {
      const s = parseInt(stickersEl.value) || 0;
      const b = parseInt(barsEl.value) || 0;
      if (s > 0 && b > 0) {
        const gcdVal = (x, y) => y ? gcdVal(y, x % y) : x;
        const g = gcdVal(s, b);
        $("gcf-svg-left").textContent = `${s} (each: ${s/g})`;
        $("gcf-svg-right").textContent = `${b} (each: ${b/g})`;
        $("gcf-svg-center").textContent = `GCF: ${g}`;
      } else {
        $("gcf-svg-left").textContent = "Stickers";
        $("gcf-svg-right").textContent = "Bars";
        $("gcf-svg-center").textContent = "GCF";
      }
    }

    // 2. LCM Timeline
    const djEl = document.querySelector('input[id$="-dj"], input[id$="dj"]');
    const bubbleEl = document.querySelector('input[id$="-bubble"], input[id$="bubble"]');
    if (djEl && bubbleEl && $("lcm-svg-text")) {
      const d = parseInt(djEl.value) || 0;
      const b = parseInt(bubbleEl.value) || 0;
      if (d > 0 && b > 0) {
        const gcdVal = (x, y) => y ? gcdVal(y, x % y) : x;
        const lcmVal = (x, y) => (x * y) / gcdVal(x, y);
        const l = lcmVal(d, b);
        $("lcm-svg-text").textContent = `LCM: syncs every ${l} mins!`;
      } else {
        $("lcm-svg-text").textContent = "Enter DJ & Activity intervals";
      }
    }

    // 3. Fraction Division
    const totalEl = document.querySelector('input[id$="-total"], input[id$="total"]');
    const partEl = document.querySelector('input[id$="-size"], input[id$="size"], input[id$="-servings"]');
    if (totalEl && partEl && $("frac-svg-text") && $("frac-svg-bar-total")) {
      const t = parseFloat(totalEl.value) || 0;
      const p = parseFloat(partEl.value) || 0;
      if (t > 0) {
        const maxWidth = 300;
        const scale = maxWidth / Math.max(t, p || 1, 1);
        $("frac-svg-bar-total").setAttribute("width", Math.min(maxWidth, t * scale));
        if (p > 0) {
          $("frac-svg-bar-part").setAttribute("width", Math.min(maxWidth, p * scale));
          const fits = (t / p).toFixed(1);
          $("frac-svg-text").textContent = `Fits exactly ${fits} times!`;
        }
      }
    }
  };

  window.PK = PK;
})();
