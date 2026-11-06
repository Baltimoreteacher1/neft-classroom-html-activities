// High-Performance Zero-Dependency Particle FX System
// Spawns celebratory sparkles, star bursts, and confetti physics on math milestone achievements.

export function spawnParticleBurst(originElement, options = {}) {
  if (typeof document === "undefined" || !originElement) return;

  const {
    count = 35,
    colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
    durationMs = 900,
  } = options;

  const rect = originElement.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  const container = document.createElement("div");
  container.className = "ewl-particle-fx-stage";
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 99999;
    overflow: hidden;
  `;
  document.body.appendChild(container);

  const particles = [];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = Math.random() * 8 + 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `
      position: absolute;
      left: ${originX}px;
      top: ${originY}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      transform: translate(-50%, -50%);
      will-change: transform, opacity;
    `;
    container.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3;
    particles.push({
      el: p,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // Slight upward bias
      gravity: 0.35,
      rot: 0,
      rotSpeed: (Math.random() - 0.5) * 20,
      alpha: 1,
      x: originX,
      y: originY,
    });
  }

  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = elapsed / durationMs;

    if (progress >= 1) {
      container.remove();
      return;
    }

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rot += p.rotSpeed;
      p.alpha = Math.max(0, 1 - progress);

      p.el.style.transform = `translate(${p.x - originX}px, ${p.y - originY}px) rotate(${p.rot}deg)`;
      p.el.style.opacity = p.alpha;
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
