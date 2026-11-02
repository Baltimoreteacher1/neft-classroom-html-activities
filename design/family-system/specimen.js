// Behaviour for the family design-system specimen. Classic script, no network, no build.
// It shows how each component behaves; it is not the production runtime.
(() => {
  const boot = window.__fmSpecimen;
  const { state } = boot;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = () =>
    document.documentElement.dataset.motion === "reduce" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Generated swatches and bead cells (data-swatch-list, data-beads) ── */
  for (const box of $$("[data-swatch-list]")) {
    for (const token of box.dataset.swatchList.split(",")) {
      const sw = document.createElement("div");
      sw.className = "sp-swatch";
      sw.dataset.token = token;
      sw.innerHTML = '<div class="sp-swatch__chip"></div><span class="sp-token"></span><span class="sp-swatch__hex"></span>';
      $(".sp-token", sw).textContent = token;
      box.append(sw);
    }
  }
  const BEAD = { f: "filled", e: "empty", s: "selected", u: "unknown" };
  const BEAD_ES = { f: "llena", e: "vacía", s: "elegida", u: "desconocida" };
  for (const cells of $$("[data-beads]")) {
    const tap = cells.hasAttribute("data-tap");
    for (const [i, ch] of [...cells.dataset.beads].entries()) {
      const bead = document.createElement(tap ? "button" : "span");
      bead.className = "fm-bead";
      bead.dataset.state = BEAD[ch];
      if (tap) {
        bead.type = "button";
        bead.setAttribute("aria-label", `Bead ${i + 1}, ${BEAD[ch]}`);
        bead.dataset.esLabel = `Cuenta ${i + 1}, ${BEAD_ES[ch]}`;
      } else bead.setAttribute("aria-hidden", "true");
      cells.append(bead);
    }
  }

  /* ── Language: strings carry their Spanish in data-es (and data-es-label for aria-label) ── */
  function applyLanguage() {
    const es = state.lang === "es";
    for (const el of $$("[data-es]")) {
      if (el.dataset.en === undefined) el.dataset.en = el.textContent;
      el.textContent = es ? el.dataset.es : el.dataset.en;
    }
    for (const el of $$("[data-es-label]")) {
      if (el.dataset.enLabel === undefined)
        el.dataset.enLabel = el.getAttribute("aria-label") || "";
      el.setAttribute("aria-label", es ? el.dataset.esLabel : el.dataset.enLabel);
    }
    for (const el of $$("[data-es-title]")) {
      if (el.dataset.enTitle === undefined) el.dataset.enTitle = el.getAttribute("title") || "";
      el.setAttribute("title", es ? el.dataset.esTitle : el.dataset.enTitle);
    }
    document.title = es ? "Sistema de diseño familiar" : "Family design system";
  }

  /* ── Options → attributes (boot.apply), saved, and mirrored into the frame ── */
  function refreshFrame() {
    const holder = $(".sp-frame");
    if (!holder) return;
    const n = state.frame;
    let frame = $("iframe", holder);
    if (n === "full") {
      frame?.remove();
      return;
    }
    if (!frame) {
      frame = document.createElement("iframe");
      frame.title = state.lang === "es" ? "Vista previa de ancho fijo" : "Fixed-width preview";
      holder.append(frame);
    }
    const q = new URLSearchParams({ embed: "1" });
    for (const [k, v] of Object.entries(state)) if (k !== "frame") q.set(k, v);
    frame.setAttribute("width", n);
    frame.src = `${location.pathname}?${q}`;
  }
  function setOption(name, value) {
    state[name] = value;
    boot.apply();
    boot.save();
    applyLanguage();
    refreshFrame();
    syncControls();
    measure();
  }
  function syncControls() {
    for (const r of $$("input[data-opt]")) r.checked = state[r.dataset.opt] === r.value;
    for (const b of $$("button[data-opt-switch]")) {
      const on = state[b.dataset.optSwitch] === b.dataset.on;
      b.setAttribute("aria-checked", String(on));
      const word = $(".fm-switch__state", b);
      if (word) word.textContent = on ? (state.lang === "es" ? "Sí" : "On") : "Off";
    }
  }
  for (const r of $$("input[data-opt]"))
    r.addEventListener("change", () => setOption(r.dataset.opt, r.value));
  for (const b of $$("button[data-opt-switch]"))
    b.addEventListener("click", () => {
      const name = b.dataset.optSwitch;
      const on = state[name] === b.dataset.on;
      setOption(name, on ? boot.OPTIONS[name][0] : b.dataset.on);
    });

  /* ── Swatches: color comes from a data-driven custom property ── */
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.className = "fm-sr";
  document.body.append(probe);
  const resolved = (cssValue, prop = "color") => {
    probe.style.setProperty(prop, cssValue);
    return getComputedStyle(probe)[prop];
  };
  function paintSwatches() {
    for (const s of $$(".sp-swatch[data-token]")) {
      s.style.setProperty("--sw", `var(${s.dataset.token})`);
      const hexEl = $(".sp-swatch__hex", s);
      if (hexEl) hexEl.textContent = toHex(resolved(`var(${s.dataset.token})`));
    }
  }
  function parseRgb(str) {
    const m = str.match(/rgba?\(([^)]+)\)/) || str.match(/color\(srgb ([^)]+)\)/);
    if (!m) return null;
    const p = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    const scale = str.startsWith("color(") ? 255 : 1;
    return { r: p[0] * scale, g: p[1] * scale, b: p[2] * scale, a: p[3] ?? 1 };
  }
  const toHex = (str) => {
    const c = parseRgb(str);
    if (!c) return str;
    const h = [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
    return `#${h}${c.a < 1 ? ` · ${Math.round(c.a * 100)}%` : ""}`;
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  /* ── Live contrast table: the browser recomputes each pair for the theme that is on screen ── */
  function liveContrast() {
    const rows = $$("table.sp-live tbody tr[data-fg]");
    const out = [];
    for (const tr of rows) {
      const fg = parseRgb(resolved(`var(${tr.dataset.fg})`));
      const bg = parseRgb(resolved(`var(${tr.dataset.bg})`, "color"));
      const min = Number(tr.dataset.min);
      const r = fg && bg ? ratio(fg, bg) : 0;
      const ok = r >= min;
      tr.dataset.ok = String(ok);
      const cell = $(".sp-ratio-cell", tr);
      const mark = ok ? "✓" : "✗";
      cell.textContent = `${r.toFixed(2)} ${mark}`;
      cell.dataset.ok = String(ok);
      out.push({ fg: tr.dataset.fg, bg: tr.dataset.bg, min, ratio: r, ok });
    }
    window.__fmContrast = out;
  }

  /* ── Type readouts ── */
  function measure() {
    for (const el of $$("[data-readout]")) {
      const target = $(el.dataset.readout);
      if (target)
        el.textContent = `${Number.parseFloat(getComputedStyle(target).fontSize).toFixed(1)} px`;
    }
    paintSwatches();
    liveContrast();
  }

  /* ── Tabs ── */
  for (const tabs of $$(".fm-tabs")) {
    const list = $$("[role=tab]", tabs);
    const select = (tab) => {
      for (const t of list) {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $(`#${t.getAttribute("aria-controls")}`).hidden = !on;
      }
    };
    for (const [i, t] of list.entries()) {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!dir) return;
        const next = list[(i + dir + list.length) % list.length];
        select(next);
        next.focus();
      });
    }
  }

  /* ── Tooltips: tap toggles, Escape or an outside tap closes ── */
  const closeTips = (except) => {
    for (const t of $$(".fm-tooltip[data-open=true]")) if (t !== except) t.dataset.open = "false";
  };
  for (const tip of $$(".fm-tooltip")) {
    $("button", tip).addEventListener("click", () => {
      closeTips(tip);
      tip.dataset.open = tip.dataset.open === "true" ? "false" : "true";
    });
  }
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".fm-tooltip")) closeTips();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeTips();
  });

  /* ── Sheets (native dialog) ── */
  for (const b of $$("[data-open-sheet]")) {
    b.addEventListener("click", () => $(`#${b.dataset.openSheet}`).showModal());
  }
  for (const d of $$("dialog.fm-sheet")) {
    for (const c of $$("[data-close]", d)) c.addEventListener("click", () => d.close());
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close();
    });
  }

  /* ── Toasts ── */
  for (const b of $$("[data-toast]")) {
    b.addEventListener("click", () => {
      const region = $(".fm-toasts");
      const toast = document.createElement("div");
      toast.className = "fm-toast";
      toast.textContent = state.lang === "es" ? b.dataset.toastEs : b.dataset.toast;
      region.append(toast);
      setTimeout(() => toast.remove(), 4000);
    });
  }

  /* ── Destructive confirm: two taps, the first only arms ── */
  for (const b of $$("[data-confirm-button]")) {
    const label = $("span", b);
    let timer;
    b.addEventListener("click", () => {
      if (b.dataset.confirm === "armed") {
        clearTimeout(timer);
        delete b.dataset.confirm;
        label.textContent = state.lang === "es" ? label.dataset.es : label.dataset.en;
        $(".fm-toasts").append(
          Object.assign(document.createElement("div"), {
            className: "fm-toast",
            textContent:
              state.lang === "es"
                ? "Se borró el progreso de práctica."
                : "Practice progress cleared.",
          }),
        );
        setTimeout(() => $(".fm-toasts .fm-toast")?.remove(), 3000);
        return;
      }
      b.dataset.confirm = "armed";
      label.textContent = state.lang === "es" ? "Toca otra vez para borrar" : "Tap again to clear";
      timer = setTimeout(() => {
        delete b.dataset.confirm;
        label.textContent = state.lang === "es" ? label.dataset.es : label.dataset.en;
      }, 4000);
    });
  }

  /* ── Try item: multiple choice and numeric ── */
  for (const item of $$("[data-try]")) {
    const right = $("[data-fb=right]", item);
    const look = $("[data-fb=look]", item);
    $("[data-check]", item).addEventListener("click", () => {
      right.hidden = true;
      look.hidden = true;
      const numeric = $("input.fm-input", item);
      let correct;
      if (numeric) {
        correct = numeric.value.trim().replace(",", ".") === item.dataset.try;
        numeric.dataset.state = correct ? "right" : "look";
      } else {
        const checked = $("input:checked", item);
        for (const c of $$(".fm-choice", item)) delete c.dataset.state;
        if (!checked) return;
        correct = checked.value === item.dataset.try;
        checked.closest(".fm-choice").dataset.state = correct ? "right" : "look";
        if (!correct) $$("input", item).forEach((i) => (i.checked = i === checked));
      }
      (correct ? right : look).hidden = false;
    });
  }

  /* ── Hint ladder ── */
  for (const ladder of $$("[data-ladder]")) {
    const rungs = $$(".fm-rung", ladder);
    const btn = $("[data-next-hint]", ladder.parentElement);
    btn.addEventListener("click", () => {
      const next = rungs.find((r) => r.dataset.state === "locked");
      if (!next) return;
      next.dataset.state = "open";
      for (const part of $$("[data-locked-text]", next)) part.hidden = true;
      for (const part of $$("[data-open-text]", next)) part.hidden = false;
      if (!rungs.some((r) => r.dataset.state === "locked")) btn.disabled = true;
    });
  }

  /* ── Flip card ── */
  for (const f of $$(".fm-flip")) {
    f.addEventListener("click", () =>
      f.setAttribute("aria-pressed", String(f.getAttribute("aria-pressed") !== "true")),
    );
  }

  /* ── Match tiles ── */
  for (const set of $$("[data-match]")) {
    let first = null;
    const status = $("[data-match-status]", set.parentElement);
    set.addEventListener("click", (e) => {
      const tile = e.target.closest(".fm-tile");
      if (!tile || tile.dataset.state === "matched") return;
      if (!first) {
        first = tile;
        tile.dataset.state = "selected";
        return;
      }
      if (first === tile) {
        delete tile.dataset.state;
        first = null;
        return;
      }
      if (first.dataset.pair === tile.dataset.pair) {
        first.dataset.state = tile.dataset.state = "matched";
        if (status)
          status.textContent = state.lang === "es" ? "¡Pareja encontrada!" : "Pair found!";
      } else {
        const a = first;
        a.dataset.state = tile.dataset.state = "look";
        if (status)
          status.textContent =
            state.lang === "es"
              ? "Mira otra vez. Prueba otra pareja."
              : "Take another look. Try another pair.";
        setTimeout(() => {
          delete a.dataset.state;
          delete tile.dataset.state;
        }, 900);
      }
      first = null;
    });
  }

  /* ── Sort with a tap alternative ── */
  for (const list of $$(".fm-sort")) {
    list.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-move]");
      if (!b) return;
      const item = b.closest(".fm-sort__item");
      const sib = b.dataset.move === "up" ? item.previousElementSibling : item.nextElementSibling;
      if (!sib) return;
      if (b.dataset.move === "up") sib.before(item);
      else sib.after(item);
      item.dataset.state = "moved";
      setTimeout(() => delete item.dataset.state, 400);
      b.focus();
    });
  }

  /* ── Switches inside the demos ── */
  for (const s of $$("button.fm-switch[data-demo-switch]")) {
    s.addEventListener("click", () => {
      const on = s.getAttribute("aria-checked") !== "true";
      s.setAttribute("aria-checked", String(on));
      $(".fm-switch__state", s).textContent = on ? (state.lang === "es" ? "Sí" : "On") : "Off";
    });
  }

  /* ── Bead grid ── */
  for (const bead of $$(".fm-beads--tap .fm-bead")) {
    bead.addEventListener("click", () => {
      const s = bead.dataset.state;
      if (s === "unknown") return;
      bead.dataset.state = s === "selected" ? "empty" : "selected";
    });
  }

  /* ── Motion demos ── */
  for (const b of $$("[data-play]")) {
    b.addEventListener("click", () => {
      const target = $(b.dataset.target);
      target.removeAttribute("data-anim");
      void target.offsetWidth;
      target.dataset.anim = b.dataset.play;
    });
  }
  for (const b of $$("[data-replay]")) {
    b.addEventListener("click", () => {
      const host = $(b.dataset.replay);
      const old = $(".fm-confetti", host);
      const fresh = old.cloneNode(true);
      old.replaceWith(fresh);
    });
  }

  applyLanguage();
  syncControls();
  paintSwatches();
  refreshFrame();
  if (document.fonts?.ready) document.fonts.ready.then(measure);
  addEventListener("resize", measure);
  addEventListener("load", measure);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", measure);
  measure();
  window.__fmReady = true;
  void reducedMotion;
})();
