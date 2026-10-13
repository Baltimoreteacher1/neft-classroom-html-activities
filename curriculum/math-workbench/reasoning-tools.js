/* Reasoning Studio helpers: read aloud, dictation, home-language translation,
 * ink replay and the printable portfolio. Each is feature-detected and
 * optional; the Studio works without any of them. */
(function (root) {
  "use strict";

  const I = root.MWRI18n;
  const A = root.MWRAnalyzer;
  const TX_KEY = "neft.mathWorkbench.reasoning.tx.v1";

  /* ---------------- read aloud ---------------- */
  const canSpeak =
    typeof root.speechSynthesis !== "undefined" && "SpeechSynthesisUtterance" in root;
  let rate = 0.95;

  function voiceFor(lang) {
    if (!canSpeak) return null;
    const prefix = String(lang).slice(0, 2).toLowerCase();
    const voices = root.speechSynthesis.getVoices() || [];
    return (
      voices.find((v) => v.lang && v.lang.toLowerCase() === String(lang).toLowerCase()) ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix)) ||
      null
    );
  }

  function speak(text, lang, onEnd) {
    if (!canSpeak || !text) {
      if (onEnd) onEnd();
      return false;
    }
    try {
      root.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = lang || "en-US";
      u.rate = rate;
      const voice = voiceFor(u.lang);
      if (voice) u.voice = voice;
      if (onEnd) {
        u.onend = onEnd;
        u.onerror = onEnd;
      }
      root.speechSynthesis.speak(u);
      return true;
    } catch (_) {
      if (onEnd) onEnd();
      return false;
    }
  }
  function stopSpeaking() {
    if (canSpeak) root.speechSynthesis.cancel();
  }
  function setRate(value) {
    const n = Number(value);
    if (n >= 0.5 && n <= 1.4) rate = n;
  }

  /* ---------------- dictation ---------------- */
  const Recognition = root.SpeechRecognition || root.webkitSpeechRecognition || null;

  /* Returns a controller, or null when the browser has no speech recognition. */
  function createDictation(lang) {
    if (!Recognition) return null;
    let rec = null;
    let active = false;
    return {
      get listening() {
        return active;
      },
      start(onText, onEnd, onError) {
        if (active) return;
        try {
          rec = new Recognition();
          rec.lang = lang || "en-US";
          rec.continuous = true;
          rec.interimResults = false;
          rec.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal)
                onText(String(event.results[i][0].transcript || "").trim());
            }
          };
          rec.onerror = (event) => {
            active = false;
            if (onError) onError(event && event.error);
          };
          rec.onend = () => {
            active = false;
            if (onEnd) onEnd();
          };
          active = true;
          rec.start();
        } catch (e) {
          active = false;
          if (onError) onError(e && e.message);
        }
      },
      stop() {
        try {
          if (rec) rec.stop();
        } catch (_) {}
        active = false;
      },
    };
  }

  /* ---------------- home-language translation (cached, optional) ---------------- */
  function txCache() {
    try {
      return JSON.parse(localStorage.getItem(TX_KEY)) || {};
    } catch (_) {
      return {};
    }
  }
  function txSave(cache) {
    try {
      const keys = Object.keys(cache);
      if (keys.length > 120) for (const k of keys.slice(0, 60)) delete cache[k];
      localStorage.setItem(TX_KEY, JSON.stringify(cache));
    } catch (_) {}
  }

  /* Resolves "" when offline or when the language has no translation path. */
  function translate(text, code) {
    const lang = I.HOME_LANGS[code];
    const source = String(text || "").slice(0, 600);
    if (!lang || !source) return Promise.resolve("");
    const cache = txCache();
    const key = `${code}|${source}`;
    if (cache[key]) return Promise.resolve(cache[key]);
    if (typeof fetch !== "function") return Promise.resolve("");
    return fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "translate", lang: lang.name, itemText: source }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const out = d && d.reply ? String(d.reply).trim() : "";
        if (out) {
          cache[key] = out;
          txSave(cache);
        }
        return out;
      })
      .catch(() => "");
  }

  /* ---------------- ink replay ---------------- */
  /* data = {strokes:[{tool,color,size,pts:[{x,y,t}]}], objects:[{type,x,y,w,h}]}
   * Strokes carry a per-stroke clock (t, ms from stroke start); between strokes
   * the replay uses a short fixed pause, so it shows ORDER and shape of work. */
  function mountReplay(canvas, data) {
    const strokes = (data && data.strokes) || [];
    const ctx = canvas.getContext("2d");
    const pts = strokes.flatMap((s) => s.pts || []);
    const objects = (data && data.objects) || [];
    const all = [
      ...pts,
      ...objects.flatMap((o) => [
        { x: o.x, y: o.y },
        { x: o.x + (o.w || 0), y: o.y + (o.h || 0) },
      ]),
    ];
    if (!all.length) return null;
    const minX = Math.min(...all.map((p) => p.x));
    const minY = Math.min(...all.map((p) => p.y));
    const bw = Math.max(40, Math.max(...all.map((p) => p.x)) - minX);
    const bh = Math.max(40, Math.max(...all.map((p) => p.y)) - minY);
    const W = canvas.width;
    const H = canvas.height;
    const k = Math.min((W - 24) / bw, (H - 24) / bh, 1.5);
    const px = (p) => 12 + (p.x - minX) * k;
    const py = (p) => 12 + (p.y - minY) * k;

    const segs = [];
    let clock = 0;
    strokes.forEach((s, si) => {
      const list = s.pts || [];
      list.forEach((p, i) => {
        const t = typeof p.t === "number" ? p.t : i * 8;
        segs.push({ si, i, time: clock + t });
      });
      const last = list.length
        ? typeof list[list.length - 1].t === "number"
          ? list[list.length - 1].t
          : (list.length - 1) * 8
        : 0;
      clock += last + 260;
    });
    const total = clock;
    let cursor = 0;
    let now = 0;
    let speed = 1;
    let playing = false;
    let raf = 0;
    let last = 0;
    let onState = null;

    function clear() {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#cbd5e1";
      ctx.setLineDash([4, 4]);
      for (const o of objects)
        ctx.strokeRect(px(o), py(o), Math.max(8, (o.w || 40) * k), Math.max(8, (o.h || 30) * k));
      ctx.setLineDash([]);
    }
    function drawSeg(seg) {
      const s = strokes[seg.si];
      const p = s.pts[seg.i];
      const prev = s.pts[seg.i - 1] || p;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = s.color || "#14223a";
      ctx.globalAlpha = s.tool === "highlighter" ? 0.35 : 1;
      ctx.lineWidth = Math.max(1.2, (s.size || 3) * k);
      ctx.beginPath();
      ctx.moveTo(px(prev), py(prev));
      ctx.lineTo(px(p), py(p));
      ctx.stroke();
      ctx.restore();
    }
    function advance(to) {
      while (cursor < segs.length && segs[cursor].time <= to) drawSeg(segs[cursor++]);
    }
    function frame(ts) {
      if (!playing) return;
      now += (ts - last) * speed;
      last = ts;
      advance(now);
      if (now >= total) {
        playing = false;
        if (onState) onState(false, true);
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    const api = {
      duration: total,
      play() {
        if (now >= total) api.reset();
        playing = true;
        last = performance.now();
        if (onState) onState(true, false);
        raf = requestAnimationFrame(frame);
      },
      pause() {
        playing = false;
        cancelAnimationFrame(raf);
        if (onState) onState(false, false);
      },
      reset() {
        cancelAnimationFrame(raf);
        playing = false;
        cursor = 0;
        now = 0;
        clear();
      },
      showAll() {
        api.reset();
        advance(total + 1);
      },
      setSpeed(v) {
        speed = Number(v) || 1;
      },
      onState(fn) {
        onState = fn;
      },
      get playing() {
        return playing;
      },
    };
    api.reset();
    return api;
  }

  /* ---------------- printable portfolio ---------------- */
  function printPortfolio(sessions, lang) {
    const t = (key, vars) => I.t(lang, key, vars);
    const esc = A.escapeHtml;
    document.getElementById("mwrPortfolio")?.remove();
    const view = document.createElement("div");
    view.id = "mwrPortfolio";
    view.setAttribute("aria-hidden", "true");
    const D = root.MWReasoningData;
    const statusName = (id) => I.statusLabel(lang, id);
    view.innerHTML =
      `<h1>${esc(t("pf.title"))}</h1><p class="mwr-pf-note">${esc(t("pf.note"))}</p>` +
      sessions
        .map((s) => {
          const skill = D.SKILLS[s.skill];
          const rounds =
            Array.isArray(s.rounds) && s.rounds.length
              ? s.rounds
              : [{ text: s.revised || s.firstDraft }];
          const finalText =
            s.revised || (rounds[rounds.length - 1] && rounds[rounds.length - 1].text) || "";
          return (
            '<section class="mwr-pf-cycle">' +
            `<h2>${esc(skill ? skill.label[lang] || skill.label.en : s.skill)} · ${esc(String(s.at || "").slice(0, 10))}</h2>` +
            `<p class="mwr-pf-meta">${esc(t("pf.standard"))}: ${esc(s.standard || "")}</p>` +
            `<p><b>${esc(t("pf.problem"))}:</b> ${esc(s.prompt || "")}</p>` +
            `<p><b>${esc(t("pf.first"))}:</b> ${esc(s.firstDraft || "")}</p>` +
            `<p><b>${esc(t("pf.final"))}:</b> ${A.diffHtml(s.firstDraft || "", finalText)}</p>` +
            (s.compare && (s.compare.second || s.compare.which)
              ? `<p><b>${esc(t("pf.secondWay"))}:</b> ${esc(s.compare.second || "")}</p><p><b>${esc(t("pf.which"))}:</b> ${esc(s.compare.which || "")}</p>`
              : "") +
            `<p><b>${esc(t("pf.growth"))}:</b> ${esc(statusName(s.firstAnalysis ? s.firstAnalysis.status : ""))} → ${esc(statusName(s.analysis ? s.analysis.status : ""))}</p>` +
            `<p><b>${esc(t("pf.confidence"))}:</b> ${esc(s.beforeConfidence || "")} → ${esc(s.afterConfidence || "")}</p>` +
            (s.thumb
              ? `<figure><img src="${esc(s.thumb)}" alt="${esc(t("pf.board"))}"><figcaption>${esc(t("pf.board"))}</figcaption></figure>`
              : "") +
            "</section>"
          );
        })
        .join("");
    document.body.appendChild(view);
    document.body.classList.add("mwr-printing");
    const done = () => {
      document.body.classList.remove("mwr-printing");
      view.remove();
      root.removeEventListener("afterprint", done);
    };
    root.addEventListener("afterprint", done);
    setTimeout(() => root.print(), 80);
  }

  /* ---------------- file download ---------------- */
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  root.MWRTools = Object.freeze({
    download,
    canSpeak,
    speak,
    stopSpeaking,
    setRate,
    createDictation,
    dictationSupported: Boolean(Recognition),
    translate,
    mountReplay,
    printPortfolio,
  });
})(window);
