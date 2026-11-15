// Optional exploration layer. The four language stations remain the main mission.
const sparks = [220, 610, 830, 1240, 1460, 1870, 2090, 2470];
const sparkKey = 'signal-quest-v1:sparks';
let foundSparks = [];
try {
  const saved = JSON.parse(localStorage.getItem(sparkKey) || '[]');
  if (Array.isArray(saved)) foundSparks = saved.filter(n => Number.isInteger(n) && n >= 0 && n < sparks.length);
} catch {}
let burst = [];
const patrols = [330, 940, 1580, 2180];
let bumpAt = 0;
let eventUntil = 0;
function showTrailEvent(message) {
  document.querySelector('#hint').textContent = message;
  eventUntil = performance.now() + 1800;
}

function sparkCount() {
  const hud = document.querySelector('#spark-count');
  if (hud) hud.textContent = `${foundSparks.length} / ${sparks.length} signal sparks`;
}

function collectSparks() {
  if (modal) return;
  sparks.forEach((position, index) => {
    if (foundSparks.includes(index) || Math.abs(state.x - position) > 26 || state.y > -25) return;
    foundSparks.push(index);
    try { localStorage.setItem(sparkKey, JSON.stringify(foundSparks)); } catch {}
    burst = Array.from({length: 18}, (_, n) => ({x: position, y: 258, vx: Math.cos(n * .35) * (45 + n * 4), vy: Math.sin(n * .35) * (45 + n * 4), life: 1}));
    sparkCount();
    showTrailEvent(foundSparks.length === sparks.length ? 'All signal sparks found! Keep restoring the stations.' : 'Signal spark found! Jump to catch the next one.');
  });
}

function updateExploration(t) {
  if (modal || t - bumpAt < 900) return;
  for (const base of patrols) {
    const patrolX = base + Math.sin(t / 700 + base) * 26;
    if (Math.abs(state.x - patrolX) < 20 && state.y > -35) {
      bumpAt = t;
      state.x = Math.max(0, state.x - 38);
      state.vy = -330;
      showTrailEvent('A trail drone bumped you! Jump over it to pass.');
      return;
    }
  }
}

function drawExploration(t, dt) {
  // Called while the world canvas is scaled to its 1,000px virtual viewport.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pulse = reduced ? 0 : Math.sin(t / 240);
  sparks.forEach((position, index) => {
    if (foundSparks.includes(index)) return;
    const x = position - camera;
    if (x < -30 || x > 1030) return;
    const y = 255 + pulse * 4;
    ctx.fillStyle = '#fff3a6';
    ctx.globalAlpha = .3;
    ctx.beginPath(); ctx.arc(x, y, 18 + pulse * 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 11); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.fill();
  });
  patrols.forEach((base, index) => {
    const x = base + Math.sin(t / 700 + base) * 26 - camera;
    if (x < -30 || x > 1030) return;
    const bob = reduced ? 0 : Math.sin(t / 150 + index) * 2;
    ctx.fillStyle = '#273e5e';
    ctx.beginPath(); ctx.arc(x, 315 + bob, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c15b';
    ctx.fillRect(x - 6, 312 + bob, 4, 4); ctx.fillRect(x + 2, 312 + bob, 4, 4);
    ctx.strokeStyle = '#f2c15b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 302 + bob); ctx.lineTo(x, 296 + bob); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Atkinson, system-ui'; ctx.textAlign = 'center';
    if (index === 0) ctx.fillText('JUMP!', x, 287 + bob);
  });
  burst = burst.filter(p => p.life > 0);
  for (const p of burst) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.4;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = '#fff3a6'; ctx.fillRect(p.x - camera, p.y, 4, 4);
  }
  ctx.globalAlpha = 1;
  // The distant beacon responds to the recovered language cores.
  const x = 2580 - camera;
  if (x > -80 && x < 1080) {
    const power = state.done.filter(Boolean).length;
    ctx.fillStyle = '#1d2b58'; ctx.fillRect(x - 11, 195, 22, 140);
    ctx.fillStyle = power ? '#f2c15b' : '#9eb2bb';
    ctx.beginPath(); ctx.arc(x, 190, 12 + power * 2, 0, Math.PI * 2); ctx.fill();
    if (power) {
      ctx.globalAlpha = .12 + power * .05;
      ctx.beginPath(); ctx.arc(x, 190, 25 + power * 10 + pulse * 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Atkinson, system-ui'; ctx.textAlign = 'center';
    ctx.fillText(power === 4 ? 'BEACON RESTORED' : `BEACON ${power}/4`, x, 173);
  }
}

function resetSparks() {
  foundSparks = [];
  burst = [];
  try { localStorage.removeItem(sparkKey); } catch {}
  sparkCount();
}

sparkCount();
