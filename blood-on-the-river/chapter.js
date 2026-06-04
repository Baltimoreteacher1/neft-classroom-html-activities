// Blood on the River - Dynamic Chapter Rendering & Interactions Controller

function esc(s) {
  return String(s).replace(/[&<>"]/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[m]));
}

// Procedural SVG artwork mapping for chapters and scenes
function chapterArt(k, label) {
  let body = '<rect width="800" height="460" fill="#1b2c45"/>';
  if (['ship', 'sea', 'storm', 'island', 'virginia', 'river'].includes(k)) {
    body += '<path d="M0 305 C140 260 250 342 390 300 S650 270 800 318 V460 H0Z" fill="#1d6f73" opacity=".72"/><path d="M160 252h480l-80 78H230Z" fill="#111827"/><path d="M400 252V84" stroke="#111827" stroke-width="9"/><path d="M400 92L540 235H400Z" fill="#fff8dd" stroke="#111827" stroke-width="6"/><path d="M400 102L292 224H400Z" fill="#fff8dd" stroke="#111827" stroke-width="6"/>';
  } else if (['camp', 'work', 'fort', 'settlement', 'forest'].includes(k)) {
    body += '<rect x="80" y="300" width="640" height="90" fill="#5c4234" stroke="#111827" stroke-width="8"/><path d="M120 302L190 190L260 302Z" fill="#fff8dd" stroke="#111827" stroke-width="7"/><path d="M330 305L390 210L450 305Z" fill="#fff8dd" stroke="#111827" stroke-width="7"/><path d="M570 120v220M625 145v195" stroke="#111827" stroke-width="10"/><circle cx="570" cy="105" r="42" fill="#1d6f73"/><circle cx="625" cy="130" r="42" fill="#1d6f73"/>';
  } else if (['conflict', 'leaders', 'council', 'trial', 'power'].includes(k)) {
    body += '<path d="M0 336 L800 300 V460 H0Z" fill="#5C4234"/><circle cx="290" cy="205" r="44" fill="#C48C62" stroke="#111827" stroke-width="8"/><path d="M220 275h130l46 112H174Z" fill="#8E5E45" stroke="#111827" stroke-width="8"/><circle cx="515" cy="205" r="44" fill="#d6a84f" stroke="#111827" stroke-width="8"/><path d="M445 275h140l52 112H394Z" fill="#26364d" stroke="#111827" stroke-width="8"/><path d="M365 235H435" stroke="#fff8ea" stroke-width="10" stroke-linecap="round"/>';
  } else if (['trade', 'native', 'powhatan', 'attack', 'arrows'].includes(k)) {
    body += '<rect x="70" y="300" width="660" height="90" fill="#5c4234"/><path d="M0 340 C160 300 260 350 400 320 S640 300 800 342 V460 H0Z" fill="#1d6f73" opacity=".55"/><path d="M140 260 C250 190 350 198 450 270" fill="none" stroke="#d6a84f" stroke-width="12" stroke-linecap="round"/><path d="M520 215l125-55M640 160l-22-16M640 160l-5 26" stroke="#111827" stroke-width="8" stroke-linecap="round"/><circle cx="250" cy="220" r="34" fill="#C48C62" stroke="#111827" stroke-width="7"/><circle cx="500" cy="220" r="34" fill="#D6A84F" stroke="#111827" stroke-width="7"/>';
  } else {
    body += '<rect x="110" y="82" width="580" height="282" rx="28" fill="#fff8ea" stroke="#111827" stroke-width="8"/><path d="M176 166h448M176 226h360M176 286h410" stroke="#d6a84f" stroke-width="12" stroke-linecap="round"/>';
  }
  return `<svg viewBox="0 0 800 460" class="scene-svg" role="img" aria-label="${esc(label)}">${body}<text x="400" y="405" text-anchor="middle" font-family="Calibri,Arial" font-size="28" font-weight="900" fill="#fffaf0">${esc(label)}</text></svg>`;
}

// Speaks target text slowly and clearly in English or Spanish
window.speakText = function(text, lang = "en") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === "es" ? "es-ES" : "en-US";
  utter.rate = 0.76; // Slow speed for vocabulary and reading review
  utter.pitch = 1.05;
  window.speechSynthesis.speak(utter);
};

// Generates dynamic components inside the chapter container templates
function renderChapter(data) {
  document.title = `Blood on the River — Chapter ${data.chapter}`;
  document.querySelector('[data-chapter-title]').textContent = `Chapter ${data.chapter}`;
  document.querySelector('[data-hero-kicker]').textContent = `Chapter ${data.chapter} · Interactive Graphic Novel Review`;
  document.querySelector('[data-hero-copy]').textContent = data.heroCopy;
  document.querySelector('[data-open-chapter]').textContent = `Open Chapter ${data.chapter} ▸`;
  document.querySelector('[data-brand]').textContent = `Chapter ${data.chapter}`;
  document.querySelector('[data-notice]').innerHTML = data.notice;
  document.querySelector('[data-hero-art]').innerHTML = chapterArt(data.heroArt, data.heroArtLabel);

  // Injects dynamic Speak buttons beside all vocabulary words
  document.getElementById('vocabGrid').innerHTML = data.vocab.map(v => `
    <div class="card vocab-card">
      <div class="vocab-img">${v[2]}</div>
      <div>
        <h3 style="display:flex; align-items:center; gap:8px;">
          ${esc(v[0])}
          <button class="speak-vocab-btn" data-text="${esc(v[0])}: ${esc(v[1])}" style="background:none; border:none; cursor:pointer; font-size:1.15rem; padding:0;" title="Read Aloud">🔊</button>
        </h3>
        <p>${esc(v[1])}</p>
      </div>
    </div>
  `).join('');

  document.getElementById('snapshotGrid').innerHTML = data.snapshot.map(s => `
    <div class="card">
      <strong>${esc(s[0])}</strong>
      <span>${esc(s[1])}</span>
    </div>
  `).join('');

  // Injects dynamic Speak buttons inside all walkthrough scenes
  document.getElementById('sceneStack').innerHTML = data.scenes.map(s => `
    <article class="scene-card">
      <div class="art-panel">
        <div class="scene-tag">Scene ${s.n} · ${esc(s.page)}</div>
        ${chapterArt(s.kind, s.label)}
      </div>
      <div class="scene-content">
        <div class="kicker">Detailed chapter scene</div>
        <h3>${esc(s.title)}</h3>
        <div class="passage">
          <div class="passage-top">
            <span>Short quote</span>
            <strong>${esc(s.page)}</strong>
          </div>
          <p class="quote">${esc(s.quote)}</p>
          <div style="display:flex; gap:8px;">
            <button class="btn small dark quote-popup-btn" type="button" data-popup="popup-${s.n}">Explain this quote</button>
            <button class="btn small light speak-scene-btn" type="button" data-quote="${esc(s.quote)}" data-summary="${esc(s.summary)}" style="border-color:#ec4899; color:#ec4899; font-weight:800;">🔊 Read Scene</button>
          </div>
        </div>
        <p>${esc(s.summary)}</p>
        <div class="details card">
          <strong>Important details from this scene</strong>
          <ul>
            ${s.details.map(d => `<li>${esc(d)}</li>`).join('')}
          </ul>
        </div>
        <div class="actions">
          <button class="btn small light toggle" type="button" data-target="note-${s.n}">Why it matters</button>
        </div>
        <div class="drawer" id="note-${s.n}">
          <strong>Why it matters</strong>
          <span>${esc(s.explain)}</span>
        </div>
        <details class="student-check">
          <summary>Student check</summary>
          <div>
            <strong>Quick questions</strong>
            <ol>
              ${s.check.map(q => `<li>${esc(q)}</li>`).join('')}
            </ol>
          </div>
        </details>
      </div>
    </article>

    <div class="quote-modal" id="popup-${s.n}" aria-hidden="true">
      <div class="quote-modal-card" role="dialog" aria-modal="true">
        <button class="close-modal" type="button" data-close="popup-${s.n}">×</button>
        <div class="modal-kicker">Quote explanation · ${esc(s.page)}</div>
        <h3>${esc(s.title)}</h3>
        <p class="modal-quote">${esc(s.quote)}</p>
        <div class="modal-section">
          <strong>What it means</strong>
          <span>${esc(s.explain)}</span>
        </div>
        <div class="modal-section">
          <strong>What students should notice</strong>
          <span>${esc(s.summary)}</span>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('structureList').innerHTML = data.structure.map(x => `<li>${esc(x)}</li>`).join('');
  
  document.getElementById('quoteList').innerHTML = data.scenes.map(s => `
    <div class="quote-row">
      <strong>${esc(s.page)} · Scene ${s.n}</strong>
      <span>${esc(s.quote)} — ${esc(s.title)}.</span>
    </div>
  `).join('');

  document.getElementById('quickQuestion').textContent = data.quick.question;
  document.getElementById('choices').innerHTML = data.quick.choices.map((c, i) => `
    <label class="choice">
      <input type="radio" name="q1" data-correct="${i === data.quick.correct}"> ${esc(c)}
    </label>
  `).join('');
  
  document.getElementById('icanList').innerHTML = data.ican.map(x => `<li>${esc(x)}</li>`).join('');
  
  bindInteractions(data.quick.feedback, data.chapter);
}

// Binds core interaction handlers
function bindInteractions(feedbackText, chapterNumber) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const status = $('#status');

  function show(msg) {
    if (!status) return;
    status.textContent = msg;
    status.classList.add('show');
    clearTimeout(show.t);
    show.t = setTimeout(() => status.classList.remove('show'), 1400);
  }

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('active');
    m.setAttribute('aria-hidden', 'false');
    const c = $('.close-modal', m);
    if (c) c.focus({ preventScroll: true });
  }

  function closeModal(m) {
    if (!m) return;
    m.classList.remove('active');
    m.setAttribute('aria-hidden', 'true');
  }

  function toggleDrawer(btn) {
    const d = document.getElementById(btn.dataset.target);
    if (!d) return;
    const o = d.classList.toggle('active');
    btn.setAttribute('aria-expanded', o ? 'true' : 'false');
  }

  // Event dispatchers for modal and drawer toggling
  document.addEventListener('click', e => {
    const t = e.target.closest('.toggle');
    if (t) {
      e.preventDefault();
      toggleDrawer(t);
      return;
    }
    const q = e.target.closest('.quote-popup-btn');
    if (q) {
      e.preventDefault();
      openModal(q.dataset.popup);
      return;
    }
    const c = e.target.closest('.close-modal');
    if (c) {
      e.preventDefault();
      closeModal(document.getElementById(c.dataset.close));
      return;
    }
    if (e.target.classList && e.target.classList.contains('quote-modal')) {
      closeModal(e.target);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $$('.quote-modal.active').forEach(closeModal);
    }
  });

  // Comprehension question choice hooks
  $$('.choice input').forEach(input => {
    input.addEventListener('change', () => {
      const card = input.closest('.card');
      $$('.choice', card).forEach(ch => ch.classList.remove('correct', 'incorrect'));
      input.closest('.choice').classList.add(input.dataset.correct === 'true' ? 'correct' : 'incorrect');
      $('.feedback', card).textContent = input.dataset.correct === 'true' ? feedbackText : 'Try again — look back at the chapter snapshot and scene cards.';
      
      // Save completed chapter state upon correct answer
      if (input.dataset.correct === 'true') {
        saveChapterCompleted(chapterNumber);
      }
    });
  });

  // Float reader controls injection
  const tools = $('.tools');
  if (tools && !$('#speakToggleBtn')) {
    const btn = document.createElement('button');
    btn.id = 'speakToggleBtn';
    btn.type = 'button';
    btn.textContent = '🌐 Voice: EN';
    btn.style.background = 'rgba(236, 72, 153, 0.15)';
    btn.style.color = '#ec4899';
    btn.style.border = '1px solid rgba(236, 72, 153, 0.3)';
    btn.style.fontWeight = '900';
    btn.addEventListener('click', () => {
      const isEn = btn.textContent.includes('EN');
      btn.textContent = isEn ? '🌐 Voice: ES' : '🌐 Voice: EN';
      show(isEn ? 'Spanish voice selected' : 'English voice selected');
    });
    tools.insertBefore(btn, tools.firstChild);
  }

  // Bind speech read-aloud buttons
  document.addEventListener('click', e => {
    // Vocab speak click
    const vBtn = e.target.closest('.speak-vocab-btn');
    if (vBtn) {
      e.preventDefault();
      const isEs = $('#speakToggleBtn') && $('#speakToggleBtn').textContent.includes('ES');
      window.speakText(vBtn.dataset.text, isEs ? 'es' : 'en');
      return;
    }

    // Scene speak click
    const sBtn = e.target.closest('.speak-scene-btn');
    if (sBtn) {
      e.preventDefault();
      const isEs = $('#speakToggleBtn') && $('#speakToggleBtn').textContent.includes('ES');
      const textToSpeak = isEs 
        ? `Resumen de la escena: ${sBtn.dataset.summary}` 
        : `Scene quote: ${sBtn.dataset.quote}. Scene summary: ${sBtn.dataset.summary}`;
      window.speakText(textToSpeak, isEs ? 'es' : 'en');
    }
  });

  // Completed chapter persistent state helper
  function saveChapterCompleted(chNum) {
    try {
      let chapters = JSON.parse(localStorage.getItem('neft_chapters_completed') || '[]');
      if (!chapters.includes(chNum)) {
        chapters.push(chNum);
        localStorage.setItem('neft_chapters_completed', JSON.stringify(chapters));
        show(`Chapter ${chNum} marked complete!`);
      }
    } catch(e) {
      console.error(e);
    }
  }

  $('#printBtn').addEventListener('click', () => window.print());
  $('#topBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  
  $('#largeTextBtn').addEventListener('click', () => {
    document.body.classList.toggle('large-text');
    show(document.body.classList.contains('large-text') ? 'Large text on' : 'Large text off');
  });
  
  $('#contrastBtn').addEventListener('click', () => {
    document.body.classList.toggle('high-contrast');
    show(document.body.classList.contains('high-contrast') ? 'High contrast on' : 'High contrast off');
  });
}