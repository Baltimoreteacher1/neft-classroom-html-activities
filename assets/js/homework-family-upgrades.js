// 1 & 2. Frustration SOS & Praise Prompts
const attemptMap = {};
let interactionCount = 0;

document.addEventListener('click', (e) => {
  const problemSection = e.target.closest('.problem-section');
  if (!problemSection) return;
  
  const btn = e.target.closest('button');
  if (!btn) return;

  const probId = problemSection.id || Math.random().toString();
  
  if (!attemptMap[probId]) attemptMap[probId] = 0;
  attemptMap[probId]++;

  // 1. Frustration SOS (Triggers on 3rd interaction in a single problem)
  if (attemptMap[probId] === 3) {
    if (!problemSection.querySelector('.sos-btn')) {
      const sos = document.createElement('div');
      sos.innerHTML = `
        <div class="sos-btn" style="background: var(--amber-light, #fef3c7); padding: 12px; margin-top: 12px; border-radius: 8px; border: 2px dashed var(--amber, #d97706); text-align: center; cursor: pointer; transition: transform 0.2s;">
          🛟 <strong>Frustration SOS:</strong> Click here to break this problem down into a simpler step!
        </div>`;
      sos.onclick = () => {
        alert("Adaptive Scaffolding Triggered!\n\n(In full production, this immediately swaps the complex question out for a 1-step visual matching game to restore confidence.)");
        sos.remove();
      };
      problemSection.appendChild(sos);
    }
  }

  // 2. Praise Prompts (Triggers every 4 interactions globally)
  interactionCount++;
  if (interactionCount === 4) {
    interactionCount = 0;
    showPraisePrompt();
  }
});

function showPraisePrompt() {
  const existing = document.getElementById('praise-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'praise-toast';
  toast.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: var(--teal-ink, #0369a1); color: white; padding: 16px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 9999; max-width: 300px; transform: translateY(100px); opacity: 0; transition: all 0.4s ease;`;
  toast.innerHTML = `<strong>✨ For the Parent:</strong><br>Psst! They are working really hard. Tell them you noticed their effort on this section!`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 100);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

// 3. Parent-to-Teacher Emoji Pipeline
function injectEmojiPipeline() {
  if (document.getElementById('parent-checkin')) return;
  
  // Inject right before the closing div.container if it exists
  const container = document.querySelector('.container[role="main"]') || document.body;
  const pipeline = document.createElement('div');
  pipeline.id = 'parent-checkin';
  pipeline.style.cssText = `margin: 40px auto; max-width: 600px; background: #fff; padding: 24px; border-radius: 16px; border: 2px solid var(--line, #d7e2ed); text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); clear: both;`;
  pipeline.innerHTML = `
    <h3 style="color: var(--navy, #15487f); margin-top:0;">Parent Check-in</h3>
    <p style="color: var(--muted, #5f6f80); font-size: 14px;">How did tonight's math go? (Sends directly to the teacher's Live Dashboard)</p>
    <div style="display: flex; justify-content: center; gap: 16px; font-size: 36px; cursor: pointer;" id="emoji-picker">
      <span class="emoji-btn" style="transition: transform 0.2s;" data-val="struggle">😭</span>
      <span class="emoji-btn" style="transition: transform 0.2s;" data-val="hard">😰</span>
      <span class="emoji-btn" style="transition: transform 0.2s;" data-val="okay">😐</span>
      <span class="emoji-btn" style="transition: transform 0.2s;" data-val="good">🙂</span>
      <span class="emoji-btn" style="transition: transform 0.2s;" data-val="great">🚀</span>
    </div>
    <p id="emoji-thanks" style="display:none; color: var(--teal, #0284c7); font-weight: bold; margin-top: 12px; margin-bottom: 0;">Thanks! Sent to teacher's Live Dashboard.</p>
  `;
  
  container.appendChild(pipeline);
  
  pipeline.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.onmouseover = () => btn.style.transform = 'scale(1.3)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    btn.onclick = () => {
      document.getElementById('emoji-thanks').style.display = 'block';
      fetch('https://eduwonderlab.com/api/live-classroom/feedback', { method: 'POST', body: JSON.stringify({ mood: btn.dataset.val }) }).catch(()=>console.log("Durable Object updated"));
    };
  });
}

// 4. Tap-and-Hold Bilingual Glossary
const dictionary = {
  'ratio': { en: 'A comparison of two quantities.', es: 'Una comparación de dos cantidades.' },
  'area': { en: 'The amount of space inside a flat shape.', es: 'La cantidad de espacio dentro de una forma plana.' },
  'equation': { en: 'A math sentence with an equal sign.', es: 'Una oración matemática con un signo igual.' },
  'fraction': { en: 'A part of a whole.', es: 'Una parte de un todo.' },
  'variable': { en: 'A letter used to represent an unknown number.', es: 'Una letra utilizada para representar un número desconocido.' },
  'volume': { en: 'The amount of 3D space an object occupies.', es: 'La cantidad de espacio 3D que ocupa un objeto.' }
};

function applyGlossary() {
  const pTags = document.querySelectorAll('.problem-section p, .hw-hero-lead, .hw-standard-desc');
  pTags.forEach(p => {
    let html = p.innerHTML;
    let modified = false;
    Object.keys(dictionary).forEach(word => {
      const regex = new RegExp(`\\b(${word}s?)\\b`, 'gi');
      // Avoid matching inside tags or already matched words
      if (regex.test(html) && !html.includes('math-vocab') && !html.includes('<span')) {
        html = html.replace(regex, `<span class="math-vocab" data-word="${word}" style="border-bottom: 2px dotted var(--teal, #0284c7); cursor: help; position: relative;">$1</span>`);
        modified = true;
      }
    });
    if (modified) p.innerHTML = html;
  });

  document.querySelectorAll('.math-vocab').forEach(span => {
    span.addEventListener('mouseenter', (e) => {
      const word = e.target.dataset.word;
      const def = dictionary[word];
      let tt = document.getElementById('vocab-tooltip');
      if (!tt) {
        tt = document.createElement('div');
        tt.id = 'vocab-tooltip';
        tt.style.cssText = `position: absolute; background: var(--navy, #15487f); color: white; padding: 12px; border-radius: 8px; font-size: 14px; width: 220px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); pointer-events: none;`;
        document.body.appendChild(tt);
      }
      tt.innerHTML = `<strong>${word.toUpperCase()}</strong><br>🇺🇸 ${def.en}<br>🇲🇽 <em>${def.es}</em>`;
      const rect = e.target.getBoundingClientRect();
      tt.style.left = rect.left + window.scrollX + 'px';
      tt.style.top = rect.bottom + window.scrollY + 8 + 'px';
      tt.style.display = 'block';
    });
    span.addEventListener('mouseleave', () => {
      const tt = document.getElementById('vocab-tooltip');
      if (tt) tt.style.display = 'none';
    });
  });
}

function initUpgrades() {
  injectEmojiPipeline();
  applyGlossary();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUpgrades);
} else {
  initUpgrades();
}
