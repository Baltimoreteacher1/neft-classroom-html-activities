/**
 * ArcadeFXEngine - Professional Gaming & Educational Company Level SFX & FX
 * Zero-dependency Web Audio API Multi-Pitch Synthesizer, Floating Score Text,
 * Particle Physics Engine, Procedural Generative Ambient Synth, Socratic Math-Talk,
 * Misconception Diagnostic Engine, and Universal Arcade Control Bar.
 */
window.ArcadeFX = (function() {
  let audioCtx = null;
  let muted = false;
  let currentStreak = 0;
  let ambientNodes = null;
  let ambientActive = false;

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

  // Generative Procedural Ambient Music (Calm, low-cognitive-load pentatonic chords)
  function startAmbient() {
    if (ambientActive || muted) return;
    initAudio();
    if (!audioCtx) return;

    try {
      ambientActive = true;
      const baseFreqs = [220, 277.18, 329.63, 440]; // A major 7th / pentatonic pad
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.045, audioCtx.currentTime + 3);

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, audioCtx.currentTime);

      const oscs = baseFreqs.map((f, i) => {
        const osc = audioCtx.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, audioCtx.currentTime);
        // Gentle subtle detuning for warmth
        osc.detune.setValueAtTime((i - 1.5) * 4, audioCtx.currentTime);
        osc.connect(filter);
        osc.start();
        return osc;
      });

      filter.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      ambientNodes = { oscs, masterGain, filter };
    } catch(e) {
      ambientActive = false;
    }
  }

  function stopAmbient() {
    if (!ambientNodes) return;
    try {
      ambientNodes.masterGain.gain.setValueAtTime(ambientNodes.masterGain.gain.value, audioCtx.currentTime);
      ambientNodes.masterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      setTimeout(() => {
        if (ambientNodes) {
          ambientNodes.oscs.forEach(o => { try { o.stop(); o.disconnect(); } catch(e) {} });
          ambientNodes = null;
        }
      }, 1300);
    } catch(e) {}
    ambientActive = false;
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

  // Tactile Micro-Interactions
  function tactileSnap(el) {
    playTone(720, 'sine', 0.03, 0.06);
    if (el && el.animate) {
      el.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.04)' },
        { transform: 'scale(1)' }
      ], { duration: 140, easing: 'ease-out' });
    }
  }

  function tactileSuccess(x, y, text = '⭐ LOCKED IN!', color = '#38bdf8') {
    SFX.correct(currentStreak + 1);
    showFloatScore(x, y, text, color);
    const canvas = document.querySelector('canvas');
    if (canvas) spawnParticles(canvas, canvas.width / 2, canvas.height / 2, color, 35);
  }

  // Misconception Diagnostic Engine
  function detectMisconception(kind, data) {
    if (kind === 'ratio') {
      const { baseA, baseB, chosenA, chosenB } = data;
      // Check for Additive Error: chosenA - baseA === chosenB - baseB
      const diffA = chosenA - baseA;
      const diffB = chosenB - baseB;
      if (diffA !== 0 && diffA === diffB && (chosenA * baseB !== chosenB * baseA)) {
        return {
          id: 'additive_ratio',
          titleEn: 'Additive Trap Detected!',
          titleEs: '¡Trampa Aditiva Detectada!',
          detailEn: `You added ${diffA} to both quantities. Ratios change by multiplying or dividing by a scale factor, not by adding!`,
          detailEs: `Sumaste ${diffA} a ambas cantidades. ¡Las razones cambian multiplicando o dividiendo por un factor, no sumando!`
        };
      }
    }
    if (kind === 'fraction') {
      const { a, b, answer } = data;
      // Common error: a/b multiplied instead of divided
      if (answer && Math.abs(answer - (a * b)) < 0.001) {
        return {
          id: 'multiplied_fractions',
          titleEn: 'Multiplication Trap!',
          titleEs: '¡Trampa de Multiplicación!',
          detailEn: 'Dividing asks "how many groups fit inside?" Dividing by a fraction gives a larger quotient than multiplying.',
          detailEs: 'Dividir pregunta "¿cuántos grupos caben dentro?" Dividir por una fracción da un cociente mayor que multiplicar.'
        };
      }
    }
    if (kind === 'equation') {
      const { leftOp, rightOp } = data;
      if (leftOp !== rightOp) {
        return {
          id: 'unbalanced_scale',
          titleEn: 'Scale Unbalanced!',
          titleEs: '¡Balanza Desequilibrada!',
          detailEn: 'The golden rule of equations: Whatever you do to one side, you must do to the other side to keep it equal.',
          detailEs: 'La regla de oro de las ecuaciones: Lo que haces a un lado, debes hacerlo al otro para mantener la igualdad.'
        };
      }
    }
    return null;
  }

  function showMisconceptionNotice(diagnostic) {
    if (!diagnostic) return;
    const existing = document.getElementById('ewl-misconception-pill');
    if (existing) existing.remove();

    const pill = document.createElement('div');
    pill.id = 'ewl-misconception-pill';
    pill.setAttribute('role', 'alert');
    pill.setAttribute('aria-live', 'assertive');
    pill.style.position = 'fixed';
    pill.style.top = '18px';
    pill.style.left = '50%';
    pill.style.transform = 'translateX(-50%) translateY(-20px)';
    pill.style.opacity = '0';
    pill.style.zIndex = '99999';
    pill.style.maxWidth = 'min(92vw, 560px)';
    pill.style.padding = '14px 20px';
    pill.style.borderRadius = '16px';
    pill.style.background = 'linear-gradient(135deg, #1e1b4b, #311042)';
    pill.style.border = '2px solid #f43f5e';
    pill.style.boxShadow = '0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(244,63,94,0.3)';
    pill.style.color = '#fff';
    pill.style.fontFamily = '"Atkinson Hyperlegible", system-ui, sans-serif';
    pill.style.transition = 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';

    pill.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:12px;">
        <span style="font-size:1.6rem; line-height:1;">💡</span>
        <div style="flex:1;">
          <h4 style="margin:0 0 4px; font-size:1.05rem; font-weight:800; color:#fda4af;">${diagnostic.titleEn} · <span style="font-size:0.9rem; font-weight:600; color:#fbcfe8;">${diagnostic.titleEs}</span></h4>
          <p style="margin:0; font-size:0.92rem; line-height:1.4; color:#f1f5f9;">${diagnostic.detailEn}</p>
          <p style="margin:4px 0 0; font-size:0.86rem; line-height:1.4; color:#cbd5e1; font-style:italic;">${diagnostic.detailEs}</p>
        </div>
        <button type="button" aria-label="Dismiss notice" style="background:transparent; border:none; color:#fda4af; font-size:1.2rem; cursor:pointer; padding:2px 6px;" onclick="this.closest('#ewl-misconception-pill').remove();">✕</button>
      </div>
    `;

    document.body.appendChild(pill);
    requestAnimationFrame(() => {
      pill.style.transform = 'translateX(-50%) translateY(0)';
      pill.style.opacity = '1';
    });

    playTone(330, 'triangle', 0.2, 0.12);
    setTimeout(() => {
      if (pill.parentNode) {
        pill.style.opacity = '0';
        pill.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => pill.remove(), 300);
      }
    }, 7000);
  }

  // Socratic Math Talk Celebration Modal (Aligned with BCPS Level 4 Discourse)
  function showMathTalkPrompt(talkData) {
    const existing = document.getElementById('ewl-mathtalk-modal');
    if (existing) existing.remove();

    talkData = talkData || {
      titleEn: "Partner Talk: Reasoning with Models",
      titleEs: "Charla con tu Pareja: Razonar con Modelos",
      questionEn: "Ask your partner: How does your model prove that this solution works every single time?",
      questionEs: "Pregunta a tu compañero: ¿Cómo demuestra tu modelo que esta solución funciona siempre?",
      stemEn: "Sentence Stem: 'I know this works because when we look at the model, we see that...'",
      stemEs: "Estructura: 'Sé que esto funciona porque al mirar el modelo, vemos que...'"
    };

    const modal = document.createElement('div');
    modal.id = 'ewl-mathtalk-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', talkData.titleEn);
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(15, 23, 42, 0.75)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '20px';
    modal.style.zIndex = '100000';
    modal.style.animation = 'fadeIn 0.25s ease-out';

    modal.innerHTML = `
      <div style="background:#0f172a; border:2px solid #38bdf8; border-radius:20px; max-width:540px; width:100%; padding:28px; box-shadow:0 20px 50px rgba(0,0,0,0.8); color:#f8fafc; font-family:'Atkinson Hyperlegible', system-ui, sans-serif;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.8rem;">🗣️</span>
            <div>
              <p style="margin:0; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:#38bdf8; font-weight:800;">BCPS Level 4 Discourse</p>
              <h3 style="margin:0; font-size:1.25rem; font-weight:800; color:#fff;">Turn & Talk · Charla</h3>
            </div>
          </div>
          <button type="button" aria-label="Close" style="background:rgba(255,255,255,0.1); border:none; border-radius:8px; width:36px; height:36px; color:#fff; font-size:1.1rem; cursor:pointer;" onclick="document.getElementById('ewl-mathtalk-modal').remove();">✕</button>
        </div>
        <div style="background:rgba(56,189,248,0.08); border-left:4px solid #38bdf8; padding:14px 16px; border-radius:8px; margin-bottom:16px;">
          <p style="margin:0; font-weight:700; font-size:1.05rem; color:#e0f2fe; line-height:1.4;">${talkData.questionEn}</p>
          <p style="margin:6px 0 0; font-style:italic; font-size:0.95rem; color:#bae6fd; line-height:1.4;">${talkData.questionEs}</p>
        </div>
        <div style="background:rgba(255,255,255,0.04); border:1px dashed rgba(255,255,255,0.2); padding:12px 14px; border-radius:8px; margin-bottom:20px;">
          <p style="margin:0; font-size:0.9rem; color:#94a3b8; font-weight:600;">Sentence Support / Ayuda de Frase:</p>
          <p style="margin:4px 0 0; font-size:0.95rem; color:#f8fafc;">${talkData.stemEn}</p>
          <p style="margin:4px 0 0; font-size:0.88rem; color:#cbd5e1; font-style:italic;">${talkData.stemEs}</p>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" style="padding:10px 22px; border-radius:10px; font-weight:800; font-size:1rem; border:none; background:#38bdf8; color:#0f172a; cursor:pointer;" onclick="document.getElementById('ewl-mathtalk-modal').remove();">Ready to Continue →</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    SFX.powerup();
  }

  return {
    init: initAudio,
    playSFX: (name, param) => { if (SFX[name]) SFX[name](param); },
    spawnParticles: spawnParticles,
    showFloatScore: showFloatScore,
    screenShake: triggerScreenShake,
    renderControlBar: renderControlBar,
    updateStreakBadge: updateStreakBadge,
    toggleMute: () => {
      muted = !muted;
      if (muted) stopAmbient();
      return muted;
    },
    isMuted: () => muted,
    startAmbient: startAmbient,
    stopAmbient: stopAmbient,
    isAmbientActive: () => ambientActive,
    tactileSnap: tactileSnap,
    tactileSuccess: tactileSuccess,
    detectMisconception: detectMisconception,
    showMisconceptionNotice: showMisconceptionNotice,
    showMathTalkPrompt: showMathTalkPrompt
  };
})();
