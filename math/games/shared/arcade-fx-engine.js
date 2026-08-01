/**
 * ArcadeFXEngine - Professional Gaming & Educational Company Level SFX & FX
 * Zero-dependency Web Audio API Multi-Pitch Synthesizer, Floating Score Text,
 * Particle Physics Engine, and Universal Arcade Control Bar.
 */
window.ArcadeFX = (function() {
  let audioCtx = null;
  let muted = false;
  let currentStreak = 0;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Dynamic Multi-Pitch Synthesizer
  function playTone(freq, type, duration, vol = 0.15, pitchShift = 1.0) {
    if (muted) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq * pitchShift, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  const SFX = {
    click: () => playTone(600, 'sine', 0.05, 0.08),
    correct: (streak = 1) => {
      const pitch = 1 + Math.min(streak * 0.05, 0.5);
      playTone(523.25, 'triangle', 0.1, 0.15, pitch); // C5
      setTimeout(() => playTone(659.25, 'triangle', 0.1, 0.15, pitch), 70); // E5
      setTimeout(() => playTone(783.99, 'triangle', 0.2, 0.18, pitch), 140); // G5
    },
    error: () => {
      currentStreak = 0;
      playTone(220, 'sawtooth', 0.12, 0.15);
      setTimeout(() => playTone(165, 'sawtooth', 0.22, 0.18), 90);
    },
    combo: (streak = 2) => {
      currentStreak = streak;
      const basePitch = 1 + (streak * 0.08);
      playTone(523.25, 'square', 0.08, 0.12, basePitch);
      setTimeout(() => playTone(659.25, 'square', 0.08, 0.12, basePitch), 50);
      setTimeout(() => playTone(783.99, 'square', 0.08, 0.12, basePitch), 100);
      setTimeout(() => playTone(1046.50, 'square', 0.25, 0.2, basePitch), 150);
    },
    powerup: () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => playTone(400 + (i * 150), 'sine', 0.08, 0.12), i * 45);
      }
    },
    laser: () => {
      if (muted) return;
      initAudio();
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch(e) {}
    },
    victory: () => {
      const notes = [523.25, 659.25, 783.99, 1046.50, 880, 1046.50, 1318.51];
      notes.forEach((n, i) => {
        setTimeout(() => playTone(n, 'triangle', 0.22, 0.22), i * 100);
      });
    }
  };

  // Canvas Particle System with Physics & Sparkles
  function spawnParticles(canvas, x, y, color = '#38bdf8', count = 30) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        alpha: 1,
        color: color,
        sparkle: Math.random() > 0.5
      });
    }

    let frame = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach(p => {
        if (p.alpha > 0) {
          active = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.18; // gravity
          p.alpha -= 0.022;
          p.size *= 0.95;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.sparkle && frame % 2 === 0 ? '#ffffff' : p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      if (active && frame < 70) {
        frame++;
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    render();
  }

  // Floating Score Popup Text Engine
  function showFloatScore(x, y, text = '+100', color = '#ffd98a') {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.transform = 'translate(-50%, -50%) scale(0.8)';
    el.style.font = '900 1.6rem "Segoe UI", sans-serif';
    el.style.color = color;
    el.style.textShadow = '0 0 10px rgba(0,0,0,0.8), 0 0 20px ' + color;
    el.style.pointerEvents = 'none';
    el.style.zIndex = '10000';
    el.style.transition = 'all 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.top = (y - 60) + 'px';
      el.style.transform = 'translate(-50%, -50%) scale(1.2)';
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), 650);
  }

  // Screen Shake & Flash FX
  function triggerScreenShake(containerEl) {
    if (!containerEl) containerEl = document.body;
    containerEl.style.transition = 'transform 0.04s ease';
    containerEl.style.transform = 'translate(6px, -6px)';
    setTimeout(() => containerEl.style.transform = 'translate(-6px, 6px)', 40);
    setTimeout(() => containerEl.style.transform = 'translate(4px, -3px)', 80);
    setTimeout(() => containerEl.style.transform = 'translate(0, 0)', 120);
  }

  // Universal Arcade Control Bar Builder
  function renderControlBar(containerId = 'arcade-controls-host') {
    const host = document.getElementById(containerId);
    if (!host) return;

    const html = `
      <div class="arcade-control-bar" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 16px; background:rgba(12,37,50,0.85); border:1px solid #1f4a5b; border-radius:14px; margin-bottom:14px; backdrop-filter:blur(10px);">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-weight:800; font-size:0.95rem; color:#ffd98a;">🕹️ ARCADE MODE</span>
          <button type="button" class="btn ghost" id="btn-sfx-toggle" style="padding:6px 12px; font-size:0.85rem;" onclick="ArcadeFX.toggleMute(); this.innerText = ArcadeFX.isMuted() ? '🔇 Muted' : '🔊 SFX ON';">🔊 SFX ON</button>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span id="arcade-streak-badge" style="font-weight:900; font-size:0.9rem; color:#38bdf8; background:rgba(56,189,248,0.12); padding:4px 10px; border-radius:999px;">🔥 STREAK: 0</span>
        </div>
      </div>
    `;
    host.innerHTML = html;
  }

  function updateStreakBadge(streak = 0) {
    currentStreak = streak;
    const badge = document.getElementById('arcade-streak-badge');
    if (badge) {
      badge.textContent = `🔥 STREAK: ${streak}`;
      badge.style.color = streak >= 3 ? '#ffd98a' : '#38bdf8';
    }
  }

  return {
    init: initAudio,
    playSFX: (name, param) => { if (SFX[name]) SFX[name](param); },
    spawnParticles: spawnParticles,
    showFloatScore: showFloatScore,
    screenShake: triggerScreenShake,
    renderControlBar: renderControlBar,
    updateStreakBadge: updateStreakBadge,
    toggleMute: () => { muted = !muted; return muted; },
    isMuted: () => muted
  };
})();
