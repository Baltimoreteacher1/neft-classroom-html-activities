/**
 * Boss Battle 3D — DOM layer: the build panel (inputs + steppers + Fire),
 * tiered help, the shield gauge for pulse rounds, HP bar, banner and styles.
 * Holds no game rules; game.js drives it.
 */
import { parseAnswer } from "./mechanics.js";

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const stop = (el) => el.addEventListener("pointerdown", (e) => e.stopPropagation());

/** Build panel. handlers: { onFire, onHint, onSwap, onToggleEs, onRestart } */
export function createPanel(mountEl, handlers) {
  const panel = document.createElement("div");
  panel.className = "bb-panel bb-hidden";
  panel.innerHTML = `
    <div class="bb-q-meta" data-bb="meta"></div>
    <p class="bb-q" data-bb="q"></p>
    <p class="bb-q-es" data-bb="qes" lang="es"></p>
    <div class="bb-gauge" data-bb="gauge" hidden aria-hidden="true"><div class="bb-gauge-fill" data-bb="gaugefill"></div></div>
    <div class="bb-build" data-bb="fields" role="group" aria-label="Build your attack"></div>
    <div class="bb-actions">
      <button type="button" class="bb-fire" data-bb="fire">⚡ Fire · Disparar</button>
      <button type="button" class="bb-help" data-bb="hint" disabled>💡 Hint · Pista</button>
      <button type="button" class="bb-help" data-bb="swap" hidden>🔄 New challenge · Nuevo reto</button>
    </div>
    <div class="bb-why" data-bb="feedback" role="status" aria-live="polite" hidden></div>
    <div class="bb-hints" data-bb="hints"></div>
    <div class="bb-foot">
      <button type="button" class="bb-link" data-bb="es" aria-pressed="false">Español</button>
      <button type="button" class="bb-link" data-bb="restart">Start over · Empezar de nuevo</button>
    </div>`;
  mountEl.appendChild(panel);
  const $ = (k) => panel.querySelector(`[data-bb="${k}"]`);
  const els = {
    meta: $("meta"),
    q: $("q"),
    qes: $("qes"),
    gauge: $("gauge"),
    gaugeFill: $("gaugefill"),
    fields: $("fields"),
    fire: $("fire"),
    hint: $("hint"),
    swap: $("swap"),
    feedback: $("feedback"),
    hints: $("hints"),
    es: $("es"),
    restart: $("restart"),
  };
  for (const b of panel.querySelectorAll("button")) stop(b);
  els.fire.addEventListener("click", () => handlers.onFire());
  els.hint.addEventListener("click", () => handlers.onHint());
  els.swap.addEventListener("click", () => handlers.onSwap());
  els.es.addEventListener("click", () => handlers.onToggleEs());
  let restartArmed = false;
  els.restart.addEventListener("click", () => {
    if (!restartArmed) {
      restartArmed = true;
      els.restart.textContent = "Tap again to erase this battle · Toca otra vez para borrar";
      return;
    }
    handlers.onRestart();
  });

  let inputs = [];
  let showEs = false;
  let current = null;

  function renderFields(round) {
    els.fields.innerHTML = "";
    inputs = round.fields.map((f, i) => {
      const wrap = document.createElement("label");
      wrap.className = "bb-field";
      const id = `bb-in-${i}`;
      wrap.innerHTML = `<span class="bb-flabel">${escapeHtml(f.labelEn)}${f.labelEs !== f.labelEn ? ` <span class="bb-es-inline" lang="es">· ${escapeHtml(f.labelEs)}</span>` : ""}</span>
        <span class="bb-stepper">
          <button type="button" class="bb-step" data-d="-1" aria-label="Decrease ${escapeHtml(f.labelEn)}">−</button>
          <input id="${id}" class="bb-input" data-nsr-ignore type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="?" aria-label="${escapeHtml(f.labelEn)}">
          <button type="button" class="bb-step" data-d="1" aria-label="Increase ${escapeHtml(f.labelEn)}">+</button>
        </span>`;
      const input = wrap.querySelector("input");
      for (const b of wrap.querySelectorAll(".bb-step")) {
        stop(b);
        b.addEventListener("click", (e) => {
          e.preventDefault();
          const v = parseAnswer(input.value);
          const base = Number.isFinite(v) ? v : 0;
          input.value = String(Math.round((base + Number(b.dataset.d)) * 1000) / 1000);
          input.focus();
        });
      }
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handlers.onFire();
        }
        e.stopPropagation();
      });
      stop(input);
      els.fields.appendChild(wrap);
      return input;
    });
  }

  function applyEs() {
    panel.classList.toggle("bb-show-es", showEs);
    els.es.setAttribute("aria-pressed", String(showEs));
  }

  return {
    el: panel,
    els,
    show() {
      panel.classList.remove("bb-hidden");
    },
    hide() {
      panel.classList.add("bb-hidden");
    },
    setEs(on) {
      showEs = !!on;
      applyEs();
    },
    get showEs() {
      return showEs;
    },
    render(round, metaText) {
      current = round;
      els.meta.textContent = metaText;
      els.q.textContent = round.en;
      els.qes.textContent = round.es;
      els.feedback.hidden = true;
      els.feedback.className = "bb-why";
      els.hints.innerHTML = "";
      els.hint.disabled = true;
      els.swap.hidden = true;
      els.fire.disabled = false;
      if (round.mechanic === "pulses") {
        els.gauge.hidden = false;
        this.setGauge(1);
      } else els.gauge.hidden = true;
      renderFields(round);
      if (inputs[0]) inputs[0].focus();
    },
    values() {
      return inputs.map((i) => parseAnswer(i.value));
    },
    lock(on) {
      els.fire.disabled = on;
      for (const i of inputs) i.disabled = on;
      for (const b of els.fields.querySelectorAll(".bb-step")) b.disabled = on;
    },
    feedback(msg, kind) {
      els.feedback.hidden = false;
      els.feedback.className = `bb-why bb-${kind}`;
      els.feedback.innerHTML = `${escapeHtml(msg.en)}<span class="bb-es-line" lang="es">${escapeHtml(msg.es)}</span>`;
    },
    allowHint(on) {
      els.hint.disabled = !on;
    },
    allowSwap(on) {
      els.swap.hidden = !on;
    },
    addHint(tier, h) {
      if (els.hints.querySelector(`[data-tier="${tier}"]`)) return;
      const d = document.createElement("div");
      d.className = "bb-hint";
      d.dataset.tier = String(tier);
      d.innerHTML = `<strong>Hint ${tier} · Pista ${tier}:</strong> ${escapeHtml(h.en)}<span class="bb-es-line" lang="es">${escapeHtml(h.es)}</span>`;
      els.hints.appendChild(d);
    },
    /** frac 0..1 of the shield still glowing (pulse rounds). */
    setGauge(frac) {
      els.gaugeFill.style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
    },
    get round() {
      return current;
    },
    dispose() {
      panel.remove();
    },
  };
}

/** Boss HP bar (top-centre). */
export function createHpBar(mountEl) {
  const wrap = document.createElement("div");
  wrap.className = "bb-hpwrap";
  wrap.innerHTML = `
    <div class="bb-hp-head"><span class="bb-hp-name"></span><span class="bb-hp-num"></span></div>
    <div class="bb-hp-track" role="progressbar" aria-label="Boss health" aria-valuemin="0" aria-valuemax="100">
      <div class="bb-hp-fill"></div>
    </div>`;
  mountEl.appendChild(wrap);
  const name = wrap.querySelector(".bb-hp-name");
  const num = wrap.querySelector(".bb-hp-num");
  const fill = wrap.querySelector(".bb-hp-fill");
  const track = wrap.querySelector(".bb-hp-track");
  return {
    el: wrap,
    render(title, hp, max) {
      const frac = max > 0 ? hp / max : 1;
      name.textContent = title;
      num.textContent = `${hp}/${max} HP`;
      fill.style.width = `${Math.round(frac * 100)}%`;
      const hue = 8 + frac * 152;
      fill.style.background = `linear-gradient(90deg,hsl(${hue},70%,52%),hsl(${hue + 18},75%,62%))`;
      track.setAttribute("aria-valuenow", String(Math.round(frac * 100)));
    },
  };
}

export function injectStyles() {
  if (document.getElementById("bb3d-styles")) return;
  const s = document.createElement("style");
  s.id = "bb3d-styles";
  s.textContent = `
  .bb-panel{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);
    width:min(720px,calc(100% - 24px));max-height:46vh;overflow:auto;z-index:30;
    background:rgba(11,22,40,.92);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
    border:1px solid rgba(255,255,255,.16);border-top:4px solid var(--amber,#f2c15b);
    border-radius:var(--radius-md,14px);padding:10px 14px 10px;box-shadow:0 10px 34px rgba(0,0,0,.45);
    color:#fff;font-family:var(--font-body,system-ui,sans-serif);}
  .bb-hidden{display:none !important;}
  .bb-q-meta{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--amber,#f2c15b);margin-bottom:4px;}
  .bb-q{margin:0 0 4px;font-size:clamp(15px,2.1vw,18px);font-weight:600;line-height:1.32;}
  .bb-q-es,.bb-es-line,.bb-es-inline{display:none;color:#bfe3ff;font-style:italic;}
  .bb-show-es .bb-q-es{display:block;margin:0 0 6px;font-size:14px;line-height:1.3;}
  .bb-show-es .bb-es-line{display:block;margin-top:3px;font-size:13px;}
  .bb-show-es .bb-es-inline{display:inline;font-size:12px;}
  .bb-gauge{height:14px;margin:6px 0;border-radius:7px;background:rgba(255,255,255,.08);border:1px solid rgba(124,92,255,.6);overflow:hidden;}
  .bb-gauge-fill{height:100%;width:100%;background:linear-gradient(90deg,#7c5cff,#c77dff);transition:width .18s linear;}
  .bb-build{display:flex;flex-wrap:wrap;gap:10px 18px;margin:6px 0 8px;}
  .bb-field{display:flex;flex-direction:column;gap:3px;font-size:13px;font-weight:700;}
  .bb-stepper{display:flex;align-items:center;gap:4px;}
  .bb-step{width:40px;height:40px;border-radius:10px;border:2px solid rgba(255,255,255,.25);background:rgba(31,166,162,.2);color:#fff;font-size:20px;font-weight:800;cursor:pointer;}
  .bb-input{width:92px;height:40px;border-radius:10px;border:2px solid var(--teal,#1fa6a2);background:#0b1628;color:#fff;font-size:20px;font-weight:800;text-align:center;}
  .bb-input:focus-visible,.bb-step:focus-visible,.bb-fire:focus-visible,.bb-help:focus-visible,.bb-link:focus-visible{outline:3px solid var(--amber,#f2c15b);outline-offset:2px;}
  .bb-actions{display:flex;flex-wrap:wrap;gap:8px;}
  .bb-fire{min-height:44px;padding:8px 18px;border-radius:12px;border:none;background:var(--amber,#f2c15b);color:#12233d;font-size:16px;font-weight:800;cursor:pointer;}
  .bb-fire:disabled{opacity:.55;cursor:default;}
  .bb-help{min-height:44px;padding:8px 14px;border-radius:12px;border:2px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:14px;font-weight:700;cursor:pointer;}
  .bb-help:disabled{opacity:.4;cursor:default;}
  .bb-why{margin-top:8px;font-size:14px;line-height:1.4;color:#dfe9f4;background:rgba(255,255,255,.07);border-radius:10px;padding:8px 10px;}
  .bb-why.bb-ok{border-left:4px solid #36d98a;}.bb-why.bb-miss{border-left:4px solid #ff9f55;}
  .bb-hint{margin-top:6px;font-size:13.5px;line-height:1.4;background:rgba(242,193,91,.12);border-left:4px solid var(--amber,#f2c15b);border-radius:8px;padding:6px 10px;}
  .bb-foot{display:flex;justify-content:space-between;gap:8px;margin-top:8px;}
  .bb-link{background:none;border:none;color:#9fc3e6;font-size:12.5px;text-decoration:underline;cursor:pointer;padding:6px 2px;min-height:32px;}
  .bb-hpwrap{position:absolute;top:50px;left:50%;transform:translateX(-50%);width:min(440px,calc(100% - 220px));z-index:18;pointer-events:none;
    font-family:var(--font-body,system-ui,sans-serif);color:#fff;}
  .bb-hp-head{display:flex;align-items:baseline;gap:8px;margin-bottom:4px;text-shadow:0 1px 3px rgba(0,0,0,.7);}
  .bb-hp-name{font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1 1 auto;}
  .bb-hp-num{font-size:11.5px;font-weight:700;color:rgba(255,255,255,.85);white-space:nowrap;}
  .bb-hp-track{height:13px;border-radius:999px;background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.25);overflow:hidden;}
  .bb-hp-fill{height:100%;width:100%;border-radius:999px;transition:width .35s ease,background .35s ease;}
  .bb-vignette{position:absolute;inset:0;z-index:25;pointer-events:none;opacity:0;}
  .bb-vignette.bb-flash{animation:bbflash .48s ease;}
  @keyframes bbflash{0%{opacity:0;box-shadow:inset 0 0 0 0 rgba(255,159,85,0);}
    25%{opacity:1;box-shadow:inset 0 0 140px 40px rgba(255,159,85,.45);}100%{opacity:0;}}
  .bb-banner{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);z-index:40;text-align:center;color:#fff;
    background:rgba(11,22,40,.92);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:20px 28px;
    box-shadow:0 18px 50px rgba(0,0,0,.5);font-family:var(--font-display,system-ui,sans-serif);max-width:90%;}
  .bb-banner.bb-pop{animation:bbpop .4s ease;}
  @keyframes bbpop{0%{transform:translate(-50%,-50%) scale(.7);opacity:0;}100%{transform:translate(-50%,-50%) scale(1);opacity:1;}}
  .bb-big{font-size:clamp(24px,5vw,38px);font-weight:800;margin:4px 0;color:var(--amber,#f2c15b);}
  .bb-small{font-size:15px;opacity:.92;margin:3px 0;font-family:var(--font-body,system-ui,sans-serif);}
  .bb-tip{font-size:13px;opacity:.8;margin-top:8px;font-family:var(--font-body,system-ui,sans-serif);}
  @media (prefers-reduced-motion: reduce){.bb-hp-fill,.bb-gauge-fill{transition:none;}.bb-banner.bb-pop,.bb-vignette.bb-flash{animation:none;}}
  @media (max-width:560px){.bb-panel{bottom:6px;width:calc(100% - 12px);padding:8px;max-height:52vh;}.bb-hpwrap{top:44px;width:calc(100% - 24px);}}
  `;
  document.head.appendChild(s);
}
