// 1. Speech Recognition (Intelligibility Scoring)
function initSpeechScoring() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;
  
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  
  const coach = document.createElement('div');
  coach.innerHTML = `
    <div id="ai-coach" style="position:fixed; bottom:20px; left:20px; background:#15487f; color:white; padding:16px; border-radius:12px; z-index:9999; box-shadow:0 8px 24px rgba(0,0,0,0.2); width: 300px;">
      <h4 style="margin:0 0 8px; color:#38bdf8;">🎙️ AI Speech Coach</h4>
      <button id="coach-mic" style="background:#0284c7; color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; width:100%; font-weight:bold;">Start Speaking</button>
      <p id="coach-transcript" style="font-size:14px; margin-top:12px; font-style:italic; min-height:40px; color:#cbd5e1;">(Your words will appear here...)</p>
      <div style="height:6px; background:#334155; border-radius:4px; overflow:hidden;">
         <div id="coach-score" style="height:100%; width:0%; background:#10b981; transition:width 0.3s;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(coach);
  
  let isRecording = false;
  document.getElementById('coach-mic').onclick = () => {
    if(isRecording) { 
      recognition.stop(); 
      document.getElementById('coach-mic').innerText = "Start Speaking"; 
      document.getElementById('coach-mic').style.background = "#0284c7"; 
    } else { 
      recognition.start(); 
      document.getElementById('coach-mic').innerText = "🛑 Stop"; 
      document.getElementById('coach-mic').style.background = "#dc2626"; 
    }
    isRecording = !isRecording;
  };
  
  recognition.onresult = (e) => {
    const text = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('coach-transcript').innerText = text;
    const score = Math.min(100, text.split(' ').length * 10);
    document.getElementById('coach-score').style.width = score + '%';
    if(score > 60) document.getElementById('coach-score').style.background = "#10b981";
  };
}

// 2. Writing Complexity Engine
function initComplexityEngine() {
  document.addEventListener('input', (e) => {
    if(e.target.tagName.toLowerCase() === 'textarea') {
      const text = e.target.value;
      const transitions = ['because', 'therefore', 'first', 'however', 'next', 'then', 'finally', 'compare', 'contrast', 'notice'];
      let score = 0;
      let found = [];
      transitions.forEach(t => {
        if(text.toLowerCase().includes(t)) { score += 20; found.push(t); }
      });
      
      let engine = document.getElementById('writing-engine');
      if(!engine) {
        engine = document.createElement('div');
        engine.id = 'writing-engine';
        engine.style.cssText = "margin-top:8px; padding:12px; background:#fef3c7; border:2px dashed #d97706; border-radius:8px; font-size:14px; color:#92400e;";
        e.target.parentNode.insertBefore(engine, e.target.nextSibling);
      }
      engine.innerHTML = `<strong>📈 Complexity Score:</strong> Level ${Math.min(4, 1 + Math.floor(score/20))}<br>
        ${found.length > 0 ? `Great transition words: <em>${found.join(', ')}</em>` : 'Try using words like: <em>because, however, first</em>'}`;
    }
  });
}

// 3. Picture Dictionary
function initPictureDictionary() {
  const dict = {
    'microscope': '🔬', 'caterpillar': '🐛', 'water': '💧', 'sun': '☀️', 'plant': '🪴',
    'run': '🏃', 'read': '📖', 'write': '✍️', 'speak': '🗣️', 'listen': '👂',
    'science': '🧬', 'math': '➗', 'fraction': '🍰', 'earth': '🌍'
  };
  document.addEventListener('dblclick', () => {
    const sel = window.getSelection().toString().trim().toLowerCase();
    if(dict[sel]) {
      let popup = document.getElementById('pic-dict');
      if(!popup) {
        popup = document.createElement('div');
        popup.id = 'pic-dict';
        popup.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:40px; border-radius:24px; box-shadow:0 24px 60px rgba(0,0,0,0.3); font-size:80px; z-index:10000; display:none; text-align:center;";
        document.body.appendChild(popup);
      }
      popup.innerHTML = `${dict[sel]}<br><span style="font-size:24px; color:#64748b; font-family:sans-serif; text-transform:uppercase; font-weight:bold;">${sel}</span>`;
      popup.style.display = 'block';
      setTimeout(() => popup.style.display = 'none', 3000);
    }
  });
}

// 4. Line Focus Mode
function initLineFocus() {
  const btn = document.createElement('button');
  btn.innerHTML = '🎯 Focus Mode';
  btn.style.cssText = "position:fixed; top:20px; right:20px; z-index:9999; padding:8px 16px; border-radius:8px; background:#3b82f6; color:white; border:none; font-weight:bold; cursor:pointer;";
  document.body.appendChild(btn);
  
  const overlay = document.createElement('div');
  overlay.style.cssText = "position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); z-index:9998; display:none; pointer-events:none;";
  document.body.appendChild(overlay);
  
  let active = false;
  btn.onclick = () => {
    active = !active;
    overlay.style.display = active ? 'block' : 'none';
    btn.style.background = active ? '#dc2626' : '#3b82f6';
  };
  
  document.addEventListener('mousemove', (e) => {
    if(!active) return;
    overlay.style.background = `radial-gradient(1200px 100px at ${e.clientX}px ${e.clientY}px, transparent 0%, rgba(0,0,0,0.85) 100%)`;
  });
}

// 5. Exam-Day Simulation
function initExamSimulation() {
  const btn = document.createElement('button');
  btn.innerHTML = '⏳ Exam Simulation';
  btn.style.cssText = "position:fixed; top:70px; right:20px; z-index:9999; padding:8px 16px; border-radius:8px; background:#0f172a; color:white; border:none; font-weight:bold; cursor:pointer;";
  document.body.appendChild(btn);
  
  btn.onclick = () => {
    if(confirm("Enter strict exam mode? This will hide all tools and enforce timers.")) {
      document.documentElement.requestFullscreen().catch(()=>{});
      document.querySelectorAll('.lab-tools, #ai-coach, .ts-btn').forEach(el => el.style.display = 'none');
      btn.style.display = 'none';
      
      const timer = document.createElement('div');
      timer.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); font-size:32px; font-weight:bold; color:red; z-index:10000; background:white; padding:8px 16px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.2);";
      document.body.appendChild(timer);
      
      let timeLeft = 45;
      const t = setInterval(() => {
        timer.innerText = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
        timeLeft--;
        if(timeLeft < 0) {
          clearInterval(t);
          alert("Time is up! Submitting answer and moving to next screen.");
          if(document.fullscreenElement) document.exitFullscreen();
          location.reload();
        }
      }, 1000);
    }
  };
}

window.addEventListener('DOMContentLoaded', () => {
  initSpeechScoring();
  initComplexityEngine();
  initPictureDictionary();
  initLineFocus();
  initExamSimulation();
});
