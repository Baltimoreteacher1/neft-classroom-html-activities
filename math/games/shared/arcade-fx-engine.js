/**
 * ArcadeFXEngine - Zero-dependency Web Audio API Synthesizer & Canvas2D Particle Engine
 * Gaming-Company Level SFX & FX for EduWonderLab Arcade Games
 */
window.ArcadeFX = (function() {
  let audioCtx = null;
  let muted = false;

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

  // Web Audio Synthesizer Tones
  function playTone(freq, type, duration, vol = 0.15) {
    if (muted) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  // Pre-configured Arcade Sound FX
  const SFX = {
    click: () => playTone(600, 'sine', 0.05, 0.08),
    correct: () => {
      playTone(523.25, 'triangle', 0.1, 0.15); // C5
      setTimeout(() => playTone(659.25, 'triangle', 0.1, 0.15), 80); // E5
      setTimeout(() => playTone(783.99, 'triangle', 0.2, 0.18), 160); // G5
    },
    error: () => {
      playTone(200, 'sawtooth', 0.15, 0.15);
      setTimeout(() => playTone(150, 'sawtooth', 0.25, 0.18), 100);
    },
    combo: () => {
      playTone(523.25, 'square', 0.08, 0.12);
      setTimeout(() => playTone(659.25, 'square', 0.08, 0.12), 60);
      setTimeout(() => playTone(783.99, 'square', 0.08, 0.12), 120);
      setTimeout(() => playTone(1046.50, 'square', 0.25, 0.2), 180);
    },
    powerup: () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => playTone(400 + (i * 150), 'sine', 0.08, 0.12), i * 50);
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
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch(e) {}
    },
    victory: () => {
      const notes = [523.25, 659.25, 783.99, 1046.50, 880, 1046.50];
      notes.forEach((n, i) => {
        setTimeout(() => playTone(n, 'triangle', 0.2, 0.2), i * 110);
      });
    }
  };

  // Canvas2D Particle FX System
  function spawnParticles(canvas, x, y, color = '#38bdf8', count = 25) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        alpha: 1,
        color: color
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
          p.vy += 0.15; // gravity
          p.alpha -= 0.025;
          p.size *= 0.96;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      if (active && frame < 60) {
        frame++;
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    render();
  }

  // Screen Shake FX
  function triggerScreenShake(containerEl) {
    if (!containerEl) return;
    containerEl.style.transform = 'translate(4px, -4px)';
    setTimeout(() => containerEl.style.transform = 'translate(-4px, 4px)', 40);
    setTimeout(() => containerEl.style.transform = 'translate(3px, -2px)', 80);
    setTimeout(() => containerEl.style.transform = 'translate(0, 0)', 120);
  }

  return {
    init: initAudio,
    playSFX: (name) => { if (SFX[name]) SFX[name](); },
    spawnParticles: spawnParticles,
    screenShake: triggerScreenShake,
    toggleMute: () => { muted = !muted; return muted; },
    isMuted: () => muted
  };
})();
