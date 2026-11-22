// Whole-Class Utility Dock (access-teacher/utility-dock.js)
// Strictly inside Teacher Hub: Partner & Name Wheel, Teacher Projection Timer, Local Noise-Level Meter.

import { readRoster } from "./roster-store.js";

let timerSec = 180;
let timerMax = 180;
let timerId = null;
let audioCtx = null;
let audioStream = null;
let meterRaf = null;
let wheelAngle = 0;

function getAliases() {
  const textarea = document.getElementById("udAliases");
  if (textarea && textarea.value.trim()) {
    return textarea.value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).slice(0, 32);
  }
  try {
    const roster = readRoster();
    const list = (roster?.students || []).map((s) => s.alias).filter(Boolean);
    if (list.length) return list.slice(0, 32);
  } catch {}
  return ["Blue Jay", "River Otter", "Cedar Fox", "Solar Finch", "Harbor Lynx", "Maple Wren"];
}

function drawWheelSVG(names) {
  const n = Math.max(2, names.length);
  const colors = ["#17324d", "#1fa6a2", "#075568", "#9a4a26", "#2e4a94", "#8a3a5c"];
  const cx = 110;
  const cy = 110;
  const r = 98;
  const slices = names.map((name, i) => {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const mid = (a0 + a1) / 2;
    const tx = cx + (r * 0.62) * Math.cos(mid);
    const ty = cy + (r * 0.62) * Math.sin(mid);
    const deg = (mid * 180) / Math.PI;
    return `<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large},1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="1.5"/>
      <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="#fff" font-size="10" font-weight="700" text-anchor="middle" dominant-baseline="middle" transform="rotate(${deg.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${name.slice(0, 10)}</text>`;
  }).join("");
  return `<svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label="Partner and name wheel">
    <g id="udWheelGroup" style="transform-origin:110px 110px;transition:transform 1.2s cubic-bezier(.2,.8,.2,1);transform:rotate(${wheelAngle}deg);">${slices}</g>
    <polygon points="110,4 103,18 117,18" fill="#f2c15b" stroke="#17324d" stroke-width="1.5"/>
  </svg>`;
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function mountUtilityDock(container) {
  if (!container) return;
  const aliases = getAliases();
  container.innerHTML = `<details class="panel no-print" style="margin:1rem 0;border:1.5px solid #17324d;">
    <summary style="font-weight:700;font-size:1.1rem;cursor:pointer;">Classroom Utility Dock (Name Wheel · Projection Timer · Local Noise Meter)</summary>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-top:1rem;">
      <section class="card" aria-labelledby="udWheelH">
        <h3 id="udWheelH" style="margin-top:0;">Partner &amp; Name Wheel</h3>
        <div id="udWheelSvg" style="text-align:center;">${drawWheelSVG(aliases)}</div>
        <p id="udWheelResult" role="status" style="font-weight:700;text-align:center;min-height:1.4em;"></p>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;">
          <button type="button" class="btn btn-primary small" id="udSpin">Spin Wheel</button>
          <button type="button" class="btn small" id="udPair">Pair Up for Partner Talk</button>
        </div>
        <label class="acc-field" for="udAliases" style="margin-top:.75rem;">
          <span>Aliases (comma or line separated)</span>
          <textarea id="udAliases" class="acc-input" rows="2">${aliases.join(", ")}</textarea>
        </label>
      </section>

      <section class="card" aria-labelledby="udTimerH">
        <h3 id="udTimerH" style="margin-top:0;">Teacher Projection Timer</h3>
        <div style="text-align:center;margin:.5rem 0;">
          <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Projection timer ring">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" stroke-width="10"/>
            <circle id="udTimerRing" cx="60" cy="60" r="50" fill="none" stroke="#1fa6a2" stroke-width="10" stroke-dasharray="314.16" stroke-dashoffset="0" transform="rotate(-90 60 60)"/>
            <text id="udTimerText" x="60" y="65" text-anchor="middle" font-size="22" font-weight="700" fill="#17324d">${fmtTime(timerSec)}</text>
          </svg>
        </div>
        <div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:center;margin-bottom:.5rem;">
          <button type="button" class="btn small" data-ud-min="1">1m</button>
          <button type="button" class="btn small" data-ud-min="3">3m</button>
          <button type="button" class="btn small" data-ud-min="5">5m</button>
          <button type="button" class="btn small" data-ud-min="10">10m</button>
        </div>
        <div style="display:flex;gap:.5rem;justify-content:center;">
          <button type="button" class="btn btn-primary small" id="udTimerToggle">Start</button>
          <button type="button" class="btn small" id="udTimerReset">Reset</button>
        </div>
      </section>

      <section class="card" aria-labelledby="udNoiseH">
        <h3 id="udNoiseH" style="margin-top:0;">Local Noise-Level Meter</h3>
        <p class="is-std-pill" style="margin-bottom:.5rem;">Privacy: Audio stays in-browser — never recorded or sent</p>
        <div style="height:22px;background:#e2e8f0;border-radius:999px;overflow:hidden;border:1px solid #17324d;">
          <div id="udNoiseBar" style="height:100%;width:8%;background:#1fa6a2;transition:width 120ms linear;"></div>
        </div>
        <p id="udNoiseZone" role="status" style="font-weight:700;margin:.5rem 0;">Zone: Ready (Quiet)</p>
        <div style="display:flex;gap:.5rem;">
          <button type="button" class="btn btn-primary small" id="udNoiseStart">Enable Mic Meter</button>
          <button type="button" class="btn small" id="udNoiseStop" disabled>Stop</button>
        </div>
      </section>
    </div>
  </details>`;

  const updateTimerUI = () => {
    const txt = document.getElementById("udTimerText");
    const ring = document.getElementById("udTimerRing");
    if (txt) txt.textContent = fmtTime(timerSec);
    if (ring) {
      const pct = timerMax > 0 ? timerSec / timerMax : 0;
      ring.setAttribute("stroke-dashoffset", String((314.16 * (1 - pct)).toFixed(1)));
    }
  };

  document.getElementById("udSpin")?.addEventListener("click", () => {
    const list = getAliases();
    document.getElementById("udWheelSvg").innerHTML = drawWheelSVG(list);
    const idx = Math.floor(Math.random() * list.length);
    wheelAngle += 720 + Math.round((360 / list.length) * idx);
    const grp = document.getElementById("udWheelGroup");
    if (grp) grp.style.transform = `rotate(${wheelAngle}deg)`;
    document.getElementById("udWheelResult").textContent = `Selected: ${list[idx]}`;
  });

  document.getElementById("udPair")?.addEventListener("click", () => {
    const list = [...getAliases()].sort(() => Math.random() - 0.5);
    const pairs = [];
    for (let i = 0; i < list.length; i += 2) {
      pairs.push(list[i + 1] ? `${list[i]} & ${list[i + 1]}` : `${list[i]} (trio)`);
    }
    document.getElementById("udWheelResult").textContent = `Partner Talk: ${pairs.join(" · ")}`;
  });

  container.querySelectorAll("[data-ud-min]").forEach((b) => {
    b.addEventListener("click", () => {
      clearInterval(timerId);
      timerId = null;
      timerMax = Number(b.dataset.udMin) * 60;
      timerSec = timerMax;
      document.getElementById("udTimerToggle").textContent = "Start";
      updateTimerUI();
    });
  });

  document.getElementById("udTimerToggle")?.addEventListener("click", (e) => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      e.target.textContent = "Start";
    } else {
      e.target.textContent = "Pause";
      timerId = setInterval(() => {
        if (timerSec > 0) { timerSec -= 1; updateTimerUI(); }
        else { clearInterval(timerId); timerId = null; e.target.textContent = "Done"; }
      }, 1000);
    }
  });

  document.getElementById("udTimerReset")?.addEventListener("click", () => {
    clearInterval(timerId);
    timerId = null;
    timerSec = timerMax;
    document.getElementById("udTimerToggle").textContent = "Start";
    updateTimerUI();
  });

  document.getElementById("udNoiseStart")?.addEventListener("click", async () => {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaStreamSource(audioStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      document.getElementById("udNoiseStart").disabled = true;
      document.getElementById("udNoiseStop").disabled = false;
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const pct = Math.min(100, Math.max(5, Math.round((avg / 128) * 100)));
        const bar = document.getElementById("udNoiseBar");
        const zone = document.getElementById("udNoiseZone");
        if (bar) {
          bar.style.width = `${pct}%`;
          bar.style.background = pct < 35 ? "#1fa6a2" : pct < 70 ? "#f2c15b" : "#f2765a";
        }
        if (zone) zone.textContent = pct < 35 ? "Zone: Quiet Focus" : pct < 70 ? "Zone: Partner Talk" : "Zone: Group Work / Loud";
        meterRaf = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      document.getElementById("udNoiseZone").textContent = "Microphone permission not granted.";
    }
  });

  document.getElementById("udNoiseStop")?.addEventListener("click", () => {
    cancelAnimationFrame(meterRaf);
    audioStream?.getTracks().forEach((t) => t.stop());
    audioCtx?.close();
    document.getElementById("udNoiseStart").disabled = false;
    document.getElementById("udNoiseStop").disabled = true;
    document.getElementById("udNoiseZone").textContent = "Zone: Stopped";
  });
}
