import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveVocabImage, vocabImageAlt } from "../engine/core/vocab-images.js";
import { deriveWorkedSteps } from "../engine/core/worked-steps.js";
import { EDITORIAL_FONT_IMPORT, EDITORIAL_OVERRIDES } from "./lib/editorial-print.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slug = (term) =>
  String(term ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const blankLines = (n) =>
  `<textarea class="writeline-area" rows="${n}" data-nt-field aria-label="Write your response here"></textarea>`;

const clozeText = (text) => {
  return esc(text)
    .replace(/\b\d+(\.\d+)?\b/g, "_____")
    .replace(
      /\b(ratio|fraction|percent|rate|unit rate|variable|equation|coordinate|coordinates|probability|median|mean|mode|range|integer|integers|negative|positive)\b/gi,
      "_____",
    );
};

const choiceLetter = (i) => String.fromCharCode(65 + i);

// Reusable per-device auto-save for typeable [data-nt-field] inputs and
// checkboxes, keyed by `storeKey` in localStorage. Shared by the guided-notes
// packet (nt-notes:<id>) and the Learn It page (nt-learn:<id>) so a student's
// typing persists on their device. Expects a #nt-save-status indicator and an
// optional #nt-clear-btn in the page.
function autoSaveScript(storeKey) {
  return `<script>
  (function () {
    var KEY = '${storeKey}';
    var statusEl, clearBtn, fields = [], saveTimer = null;
    function collectFields() {
      var list = [];
      var typed = document.querySelectorAll('[data-nt-field]');
      for (var i = 0; i < typed.length; i++) list.push(typed[i]);
      var boxes = document.querySelectorAll('main input[type=checkbox]');
      for (var j = 0; j < boxes.length; j++) list.push(boxes[j]);
      return list;
    }
    function fieldKey(el, i) { return (el.type === 'checkbox' ? 'c' : 'f') + i; }
    function setStatus(text) { if (statusEl) statusEl.textContent = text; }
    function readStore() {
      try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
      catch (e) { return {}; }
    }
    function save() {
      var data = {};
      for (var i = 0; i < fields.length; i++) {
        var el = fields[i], k = fieldKey(el, i);
        if (el.type === 'checkbox') { if (el.checked) data[k] = 1; }
        else if (el.value && el.value.trim() !== '') { data[k] = el.value; }
      }
      try { localStorage.setItem(KEY, JSON.stringify(data)); setStatus('Saved ✓'); }
      catch (e) { setStatus('Could not save (storage off)'); }
    }
    function queueSave() {
      setStatus('Saving…');
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 400);
    }
    function restore() {
      var data = readStore();
      for (var i = 0; i < fields.length; i++) {
        var el = fields[i], k = fieldKey(el, i);
        if (!(k in data)) continue;
        if (el.type === 'checkbox') el.checked = !!data[k];
        else el.value = data[k];
      }
    }
    document.addEventListener('DOMContentLoaded', function () {
      statusEl = document.getElementById('nt-save-status');
      clearBtn = document.getElementById('nt-clear-btn');
      fields = collectFields();
      if (!fields.length) {
        if (statusEl) statusEl.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
        return;
      }
      restore();
      for (var i = 0; i < fields.length; i++) {
        fields[i].addEventListener('input', queueSave);
        fields[i].addEventListener('change', queueSave);
      }
      if (clearBtn) clearBtn.addEventListener('click', function () {
        if (!confirm('Clear all of your typing on this lesson? This cannot be undone.')) return;
        try { localStorage.removeItem(KEY); } catch (e) {}
        for (var j = 0; j < fields.length; j++) {
          if (fields[j].type === 'checkbox') fields[j].checked = false;
          else fields[j].value = '';
        }
        setStatus('Cleared');
      });
    });
  })();
</script>`;
}

// Tap-to-define popover IIFE: any [data-popover] button shows a small card with
// the word, its plain-language meaning, and a picture. Self-contained; reused by
// the Learn It page so dense step text becomes English-learner friendly.
// Read-aloud for the Learn It page: speaks the intro, key idea, and each worked
// step in order (Web Speech API), highlighting the current line. A toggle stops
// it. Hidden when the browser has no speech synthesis. Big ESOL support.
function readAloudScript() {
  return `<script>
  (function(){
    var btn=null, speaking=false, hi=null;
    function collect(){
      var sel='.li-hook-text, .li-intro, .li-keyidea p, .li-block .li-eyebrow, .li-steps li, .li-lead, .li-list li, .li-problem-q, .li-stems li';
      return Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function(el){
        return el.offsetParent!==null && el.textContent.trim();
      });
    }
    function clearHi(){ if(hi){ hi.classList.remove('li-reading'); hi=null; } }
    function stop(){ speaking=false; try{window.speechSynthesis.cancel();}catch(e){} clearHi(); if(btn) btn.textContent='🔊 Listen to this page'; }
    function speakAll(){
      var els=collect(), i=0; speaking=true; if(btn) btn.textContent='⏹ Stop';
      function next(){
        clearHi();
        if(!speaking || i>=els.length){ stop(); return; }
        var el=els[i++]; hi=el; el.classList.add('li-reading');
        try{ el.scrollIntoView({block:'center', behavior:'smooth'}); }catch(e){}
        var u=new SpeechSynthesisUtterance(el.textContent.replace(/\\s+/g,' ').trim());
        u.rate=0.9; u.lang='en-US'; u.onend=next; u.onerror=next;
        window.speechSynthesis.speak(u);
      }
      next();
    }
    document.addEventListener('DOMContentLoaded', function(){
      btn=document.getElementById('li-listen');
      if(!btn) return;
      if(!('speechSynthesis' in window)){ btn.style.display='none'; return; }
      btn.addEventListener('click', function(){ if(speaking) stop(); else speakAll(); });
    });
  })();
</script>`;
}

function popoverScript() {
  return `<script>
  (function () {
    var pop = null;
    var overlay = null;
    function ensure(){ 
      if(pop) return pop; 
      pop=document.createElement('div'); 
      pop.className='nt-popover';
      pop.innerHTML='<button type="button" class="nt-pop-close" aria-label="Close">×</button><img alt="" /><h4></h4><p></p>';
      overlay=document.createElement('div');
      overlay.className='nt-popover-overlay';
      document.body.appendChild(overlay);
      document.body.appendChild(pop); 
      pop.querySelector('.nt-pop-close').addEventListener('click', hide); 
      overlay.addEventListener('click', hide);
      return pop; 
    }
    function hide(){ 
      if(pop) pop.classList.remove('open'); 
      if(overlay) overlay.classList.remove('active');
    }
    function show(btn){ 
      var p=ensure(), img=p.querySelector('img'), src=btn.getAttribute('data-img')||'';
      if(src){ img.src=src; img.style.display=''; img.onerror=function(){img.style.display='none';}; } else { img.style.display='none'; }
      var term = btn.getAttribute('data-term') || '';
      var termEs = btn.getAttribute('data-term-es') || '';
      var def = btn.getAttribute('data-def') || '';
      var defEs = btn.getAttribute('data-def-es') || '';
      p.querySelector('h4').innerHTML = term + (termEs ? ' <span class="es-term">/ ' + termEs + '</span>' : '');
      p.querySelector('p').innerHTML = '<span class="def-en">' + def + '</span>' + (defEs ? '<span class="def-es">' + defEs + '</span>' : '');
      p.classList.add('open');
      if (window.innerWidth <= 640) {
        if(overlay) overlay.classList.add('active');
      } else {
        if(overlay) overlay.classList.remove('active');
        var r=btn.getBoundingClientRect(), pw=p.offsetWidth, ph=p.offsetHeight, top=r.bottom+8, left=r.left;
        if(left+pw>window.innerWidth-8) left=window.innerWidth-pw-8; if(left<8) left=8;
        if(top+ph>window.innerHeight-8) top=r.top-ph-8; if(top<8) top=8;
        p.style.left=left+'px'; p.style.top=top+'px'; 
      }
    }
    document.addEventListener('click', function(e){
      var btn=e.target.closest?e.target.closest('[data-popover]'):null;
      if(btn){ e.preventDefault(); show(btn); return; }
      if(pop && !e.target.closest('.nt-popover')) hide();
    });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') hide(); });
    window.addEventListener('resize', hide);
    window.addEventListener('scroll', hide, { passive: true });
  })();
</script>`;
}

// Short-form aliases so step text using the everyday form of a term ("prime",
// "composite", "exponents") still gets a tap-to-define pop-up. We add the
// adjective form (dropping a trailing "number(s)") and allow a trailing plural.
function aliasesFor(term) {
  const t = String(term).trim();
  const out = [t];
  const m = t.match(/^(.+?)\s+numbers?$/i);
  if (m && m[1] && m[1].length >= 4 && !/\s/.test(m[1])) out.push(m[1]);
  return out;
}

// Wrap the first occurrence of each vocabulary term (or one of its short-form
// aliases) in `text` with a tap-to-define popover trigger. A token pass keeps a
// term from matching inside another term's attributes; each term pops at most
// once per text, and longer aliases win so phrases beat their adjective forms.
function popoverize(text, vocab) {
  const items = (Array.isArray(vocab) ? vocab : []).filter((v) => v && v.term && v.definition);
  const pairs = [];
  items.forEach((v) => {
    aliasesFor(v.term).forEach((alias) => pairs.push({ alias, item: v }));
  });
  pairs.sort((a, b) => b.alias.length - a.alias.length);
  let out = esc(text);
  const tokens = [];
  const used = new Set();
  // Private-use-area markers so a placeholder never collides with a math number.
  const MARK_A = String.fromCharCode(57344);
  const MARK_B = String.fromCharCode(57345);
  pairs.forEach(({ alias, item }) => {
    if (used.has(item.term)) return;
    const e = esc(alias).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("\\b(" + e + "s?)\\b", "i");
    if (!re.test(out)) return;
    out = out.replace(re, (m, g1) => {
      const img = resolveVocabImage(item.term, item.image).replace(/^\//, "../../");
      const termEsAttr = item.termEs ? ` data-term-es="${esc(item.termEs)}"` : "";
      const defEsAttr = item.definitionEs ? ` data-def-es="${esc(item.definitionEs)}"` : "";
      tokens.push(
        `<button type="button" class="li-pop" data-popover data-term="${esc(item.term)}"${termEsAttr} data-def="${esc(item.definition)}"${defEsAttr} data-img="${esc(img)}" aria-label="${g1} — what does ${esc(item.term)} mean?">${g1}<span class="li-pop-i" aria-hidden="true">ⓘ</span></button>`,
      );
      used.add(item.term);
      return MARK_A + (tokens.length - 1) + MARK_B;
    });
  });
  tokens.forEach((html, i) => {
    out = out.replace(MARK_A + i + MARK_B, html);
  });
  return out;
}

// Interactive "put the steps in order" manipulative built from a worked
// example's solution steps. Students drag the cards (or use the ▲▼ buttons /
// keyboard) to sequence them, then press Check for instant feedback. Touch- and
// keyboard-accessible; the ▲▼ buttons are the reliable path on tablets, drag is
// a progressive enhancement. State is ephemeral (a learn-by-doing check).
function stepSorter(steps) {
  const usable = (Array.isArray(steps) ? steps : []).filter(Boolean).slice(0, 5);
  if (usable.length < 2) return "";
  const items = usable
    .map(
      (s, i) =>
        `<li class="ss-item" draggable="true" data-correct="${i}" tabindex="0">
          <span class="ss-grip" aria-hidden="true">⠿</span>
          <span class="ss-text">${esc(s)}</span>
          <span class="ss-move no-print">
            <button type="button" class="ss-up" aria-label="Move step up">▲</button>
            <button type="button" class="ss-down" aria-label="Move step down">▼</button>
          </span>
        </li>`,
    )
    .join("");
  return `<div class="notes-gr-step ss-step">
    <span class="notes-gr-tag">🧩 Try — put the steps in order</span>
    <p class="notes-gr-cue">Drag the cards (or use the ▲▼ buttons) to put the solution steps in the right order, then press <strong>Check</strong>.</p>
    <div class="step-sorter" data-step-sorter>
      <ol class="ss-list">${items}</ol>
      <div class="ss-actions no-print">
        <button type="button" class="ss-check">✓ Check my order</button>
        <button type="button" class="ss-shuffle">↺ Shuffle</button>
        <span class="ss-feedback" role="status" aria-live="polite"></span>
      </div>
    </div>
  </div>`;
}

// Matches core lessons ("3-2") and flagship lessons ("3-2-flagship").
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

function lessonConfigs() {
  return readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => existsSync(join(lessonsDir, d, "config.json")))
    .map((id) => {
      const cfg = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
      // A lesson is "flagship" if the dir is suffixed OR the config carries a
      // flagship block (mission/scenes/finale). Both are handled gracefully.
      const isFlagship = id.endsWith("-flagship") || cfg.flagship != null;
      return { id, cfg, isFlagship };
    })
    .sort((a, b) => {
      const ma = a.id.match(LESSON_DIR_RE);
      const mb = b.id.match(LESSON_DIR_RE);
      const au = Number(ma[1]);
      const al = Number(ma[2]);
      const bu = Number(mb[1]);
      const bl = Number(mb[2]);
      // Order by unit, then lesson, then core before flagship.
      return (
        au - bu ||
        al - bl ||
        (a.id.endsWith("-flagship") ? 1 : 0) - (b.id.endsWith("-flagship") ? 1 : 0)
      );
    });
}

/* ---------- section builders ---------- */

function vocabSection(vocab = []) {
  if (!vocab.length) return "";
  const cards = vocab
    .map((v) => {
      const imgSrc = resolveVocabImage(v.term, v.image).replace(/^\//, "../../");
      const imgAlt = vocabImageAlt(v.term, v.definition);
      return `<div class="vocab-card">
  <div class="vocab-figure">
    <img src="${imgSrc}" alt="${esc(imgAlt)}" onerror="this.style.display='none'" />
    <p class="vocab-caption">${esc(v.visual)}</p>
  </div>
  <h3 class="vocab-term">${esc(v.term)}</h3>
  <div class="vocab-def-l1">
    <p class="vocab-def">${esc(v.definition)}</p>
  </div>
  <div class="vocab-def-l2">
    <p class="vocab-def-prompt">Write the definition:</p>
    ${blankLines(2)}
  </div>
  <div class="vocab-def-l3">
    <p class="vocab-def-prompt">Explain this mathematical concept in your own words:</p>
    ${blankLines(2)}
  </div>
</div>`;
    })
    .join("\n");

  return `<section class="section vocab">
  <h2>Key Vocabulary 
    <span class="level-tag level-1 l1-only">Level 1 Support</span>
    <span class="level-tag level-2 l2-only">Level 2 Standard</span>
    <span class="level-tag level-3 l3-only">Level 3 Enrichment</span>
  </h2>
  <p class="level-note">Picture first, then the word, then a plain-language meaning. Say each word out loud.</p>
  <div class="vocab-grid">
${cards}
  </div>
</section>`;
}

function choiceOl(choices) {
  if (!Array.isArray(choices) || !choices.length) return "";
  return `<ol class="try-choices" type="A">${choices
    .map((c) => `<li>${esc(c)}</li>`)
    .join("")}</ol>`;
}

// Render the gradual-release worked frame (I Do → We Do → You Do) using real
// practice problems. The I-Do is fully solved in numbered steps; We-Do/You-Do
// give the same scaffold with blank work space. Answers live in the Answer Key.
function workedFrame(worked) {
  if (!worked || !worked.iDo) {
    // No usable practice items — fall back to a generic guided frame.
    return `<div class="notes-gradual">
      <!-- Fallback Level 1 Support -->
      <div class="l1-only">
        <div class="notes-gr-step notes-gr-watch">
          <span class="notes-gr-tag">👀 Watch</span>
          <p class="notes-gr-cue">Watch your teacher. Circle key words in the problem.</p>
          <div class="wk-checkboxes">
            <label class="wk-checkbox-label" style="margin-right: 12px;"><input type="checkbox" /> I listened and understood</label>
            <label class="wk-checkbox-label"><input type="checkbox" /> I wrote down the key numbers</label>
          </div>
          ${blankLines(1)}
        </div>
        <div class="notes-gr-step notes-gr-we">
          <span class="notes-gr-tag">🤝 We try</span>
          <p class="notes-gr-cue">Fill in the missing words with your class.</p>
          <p class="wk-step wk-step-blank">Step 1: First, we identify the ______ elements. Step 2: Then, we calculate the ______.</p>
          ${blankLines(1)}
        </div>
        <div class="notes-gr-step notes-gr-you">
          <span class="notes-gr-tag">✏️ You try</span>
          <p class="notes-gr-cue">Choose the correct operation: <label class="wk-checkbox-label" style="margin-left: 8px;"><input type="checkbox" /> Add</label> &nbsp; <label class="wk-checkbox-label"><input type="checkbox" /> Subtract</label> &nbsp; <label class="wk-checkbox-label"><input type="checkbox" /> Multiply</label> &nbsp; <label class="wk-checkbox-label"><input type="checkbox" /> Divide</label></p>
          ${blankLines(1)}
        </div>
      </div>

      <!-- Fallback Level 2 Standard -->
      <div class="l2-only">
        <div class="notes-gr-step notes-gr-watch">
          <span class="notes-gr-tag">👀 Watch</span>
          <p class="notes-gr-cue">Watch your teacher model one example. Jot what you see.</p>
          ${blankLines(1)}
        </div>
        <div class="notes-gr-step notes-gr-we">
          <span class="notes-gr-tag">🤝 We try</span>
          <p class="notes-gr-cue">Solve the next one together as a class.</p>
          ${blankLines(2)}
        </div>
        <div class="notes-gr-step notes-gr-you">
          <span class="notes-gr-tag">✏️ You try</span>
          <p class="notes-gr-cue">Now try one on your own.</p>
          ${blankLines(2)}
        </div>
      </div>

      <!-- Fallback Level 3 Enrichment -->
      <div class="l3-only">
        <div class="notes-gr-step notes-gr-you" style="border-left-color: var(--navy);">
          <span class="notes-gr-tag">🧠 Enrichment Scratchpad</span>
          <p class="notes-gr-cue">Create your own visual model and write a word problem that fits today's learning objective.</p>
          <div class="scratchpad"><span class="scratchpad-label">Doodle / Model Space</span></div>
          <div class="work-space"><span class="ws-label">Write your word problem and explanation:</span>${blankLines(4)}</div>
        </div>
      </div>
    </div>`;
  }

  const { iDo, weDo, youDo } = worked;

  // Level 1 Support
  const iStepsL1 = iDo.steps
    .map(
      (s, i) =>
        `<li class="wk-step"><span class="wk-steplabel">Step ${i + 1}</span> ${esc(s)}</li>`,
    )
    .join("");
  const iDoHtmlL1 = `<div class="notes-gr-step notes-gr-watch">
      <span class="notes-gr-tag">👀 I do — watch</span>
      <p class="notes-gr-cue">Follow each step as your teacher solves it.</p>
      <p class="wk-problem"><span class="wk-plabel">Problem:</span> ${esc(iDo.problem)}</p>
      ${choiceOl(iDo.choices)}
      <ol class="wk-steps">${iStepsL1}</ol>
      ${iDo.answer ? `<p class="wk-answer"><span class="wk-anslabel">✅ Answer:</span> ${esc(iDo.answer)}</p>` : ""}
    </div>`;

  let weDoHtmlL1 = "";
  if (weDo) {
    const clozeSteps = iDo.steps
      .map(
        (s, i) =>
          `<li class="wk-step"><span class="wk-steplabel">Step ${i + 1}</span> ${clozeText(s)}</li>`,
      )
      .join("");
    const checkboxHtml = weDo.choices
      ? `<div class="wk-checkboxes" style="margin-top: 8px;">
          <span class="wk-anslabel">Check the correct choice:</span>
          ${weDo.choices.map((c) => `<label class="wk-checkbox-label" style="margin-right: 12px;"><input type="checkbox" /> ${esc(c)}</label>`).join("")}
        </div>`
      : `<p class="wk-answer-blank"><span class="wk-anslabel">Answer:</span> <input class="writeline" style="flex: 1;" type="text" data-nt-field /></p>`;

    weDoHtmlL1 = `<div class="notes-gr-step notes-gr-we">
      <span class="notes-gr-tag">🤝 We do — together (Scaffolded)</span>
      <p class="notes-gr-cue">Solve this with your class by filling in the missing words or values.</p>
      <p class="wk-problem"><span class="wk-plabel">Problem:</span> ${esc(weDo.problem)}</p>
      ${choiceOl(weDo.choices)}
      <ol class="wk-steps">${clozeSteps}</ol>
      ${checkboxHtml}
    </div>`;
  }

  let youDoHtmlL1 = "";
  if (youDo) {
    const checkboxHtml = youDo.choices
      ? `<div class="wk-checkboxes" style="margin-top: 8px; margin-bottom: 8px;">
          <span class="wk-anslabel">Check the correct choice:</span>
          ${youDo.choices.map((c) => `<label class="wk-checkbox-label" style="margin-right: 12px;"><input type="checkbox" /> ${esc(c)}</label>`).join("")}
        </div>`
      : "";
    youDoHtmlL1 = `<div class="notes-gr-step notes-gr-you">
      <span class="notes-gr-tag">✏️ You do — your turn (Scaffolded)</span>
      <p class="notes-gr-cue">Try it on your own. Fill in the steps.</p>
      <p class="wk-problem"><span class="wk-plabel">Problem:</span> ${esc(youDo.problem)}</p>
      ${choiceOl(youDo.choices)}
      ${checkboxHtml}
      <div class="work-space">
        <span class="ws-label">Fill in your solution path:</span>
        <div class="wk-step-blank" style="margin: 4px 0;"><span class="wk-steplabel" style="font-size: 11px; padding: 1px 4px;">Step 1</span> <input class="writeline" style="flex:1; height:20px;" type="text" data-nt-field /></div>
        <div class="wk-step-blank" style="margin: 4px 0;"><span class="wk-steplabel" style="font-size: 11px; padding: 1px 4px;">Step 2</span> <input class="writeline" style="flex:1; height:20px;" type="text" data-nt-field /></div>
      </div>
    </div>`;
  }

  const l1Html = `<div class="l1-only">
    <p class="notes-gr-intro">Watch the teacher model, fill in We Do together, and check your choice on You Do.</p>
    ${iDoHtmlL1}
    ${stepSorter(iDo.steps)}
    ${weDoHtmlL1}
    ${youDoHtmlL1}
  </div>`;

  // Level 2 Standard
  const iStepsL2 = iDo.steps
    .map(
      (s, i) =>
        `<li class="wk-step"><span class="wk-steplabel">Step ${i + 1}</span> ${esc(s)}</li>`,
    )
    .join("");
  const iDoHtmlL2 = `<div class="notes-gr-step notes-gr-watch">
      <span class="notes-gr-tag">👀 I do — watch</span>
      <p class="notes-gr-cue">Follow each step as your teacher solves it.</p>
      <p class="wk-problem"><span class="wk-plabel">Problem:</span> ${esc(iDo.problem)}</p>
      ${choiceOl(iDo.choices)}
      <ol class="wk-steps">${iStepsL2}</ol>
      ${iDo.answer ? `<p class="wk-answer"><span class="wk-anslabel">✅ Answer:</span> ${esc(iDo.answer)}</p>` : ""}
    </div>`;

  let weDoHtmlL2 = "";
  if (weDo) {
    const stepCount = Math.min(Math.max(iDo.steps.length, 2), 3);
    const blankSteps = Array.from(
      { length: stepCount },
      (_, i) =>
        `<li class="wk-step wk-step-blank"><span class="wk-steplabel">Step ${i + 1}</span><input class="writeline" type="text" data-nt-field /></li>`,
    ).join("");
    weDoHtmlL2 = `<div class="notes-gr-step notes-gr-we">
      <span class="notes-gr-tag">🤝 We do — together</span>
      <p class="notes-gr-cue">Solve this one with your class using the same steps.</p>
      <p class="wk-problem"><span class="wk-plabel">Problem:</span> ${esc(weDo.problem)}</p>
      ${choiceOl(weDo.choices)}
      <ol class="wk-steps wk-steps-blank">${blankSteps}</ol>
      <p class="wk-answer-blank"><span class="wk-anslabel">Answer:</span> <input class="writeline" type="text" data-nt-field /></p>
    </div>`;
  }

  let youDoHtmlL2 = "";
  if (youDo) {
    youDoHtmlL2 = `<div class="notes-gr-step notes-gr-you">
      <span class="notes-gr-tag">✏️ You do — your turn</span>
      <p class="notes-gr-cue">Now try one on your own. Show every step.</p>
      <p class="wk-problem"><span class="wk-plabel">Problem:</span> ${esc(youDo.problem)}</p>
      ${choiceOl(youDo.choices)}
      <div class="work-space"><span class="ws-label">Show your work:</span>${blankLines(3)}</div>
    </div>`;
  }

  const l2Html = `<div class="l2-only">
    <p class="notes-gr-intro">See the notes in action: watch one worked all the way through, then try the next with the same steps.</p>
    ${iDoHtmlL2}
    ${stepSorter(iDo.steps)}
    ${weDoHtmlL2}
    ${youDoHtmlL2}
  </div>`;

  // Level 3 Enrichment
  let iDoHtmlL3 = "";
  if (iDo) {
    iDoHtmlL3 = `<div class="notes-gr-step notes-gr-you" style="border-left-color: var(--teal);">
      <span class="notes-gr-tag">🧠 Challenge 1 — Mathematical Modeling</span>
      <p class="wk-problem"><span class="wk-plabel">Problem:</span> ${esc(iDo.problem)}</p>
      ${choiceOl(iDo.choices)}
      <p class="sentence-frame"><span class="ws-label">Writing Prompt:</span> Formulate a mathematical representation or model for this situation. Explain why your model is appropriate.</p>
      <div class="scratchpad"><span class="scratchpad-label">Workspace / Visual Model</span></div>
      <div class="work-space">${blankLines(3)}</div>
    </div>`;
  }

  let weDoHtmlL3 = "";
  if (weDo) {
    weDoHtmlL3 = `<div class="notes-gr-step notes-gr-you" style="border-left-color: var(--amber);">
      <span class="notes-gr-tag">🧠 Challenge 2 — Error Analysis & Generalization</span>
      <p class="wk-problem"><span class="wk-plabel">Problem:</span> ${esc(weDo.problem)}</p>
      ${choiceOl(weDo.choices)}
      <p class="sentence-frame"><span class="ws-label">Writing Prompt:</span> Solve the problem. Then, write a rule or generalization that someone could use to solve any problem like this.</p>
      <div class="scratchpad"><span class="scratchpad-label">Workspace / Visual Model</span></div>
      <div class="work-space">${blankLines(3)}</div>
    </div>`;
  }

  let youDoHtmlL3 = "";
  if (youDo) {
    youDoHtmlL3 = `<div class="notes-gr-step notes-gr-you" style="border-left-color: var(--navy);">
      <span class="notes-gr-tag">🧠 Challenge 3 — Synthesis & Extension</span>
      <p class="wk-problem"><span class="wk-plabel">Problem:</span> ${esc(youDo.problem)}</p>
      ${choiceOl(youDo.choices)}
      <p class="sentence-frame"><span class="ws-label">Writing Prompt:</span> Solve the problem. Create a real-world scenario that matches the operations or logic you used to solve this.</p>
      <div class="scratchpad"><span class="scratchpad-label">Workspace / Visual Model</span></div>
      <div class="work-space">${blankLines(3)}</div>
    </div>`;
  }

  const l3Html = `<div class="l3-only">
    <p class="notes-gr-intro">No worked examples. Solve the problems independently, draw visual models, and write justifications.</p>
    ${iDoHtmlL3}
    ${weDoHtmlL3}
    ${youDoHtmlL3}
  </div>`;

  return `<div class="notes-gradual">
    ${l1Html}
    ${l2Html}
    ${l3Html}
  </div>`;
}

// Build the heart of the guided notes: fill-in-the-blank concept sentences.
// Each vocabulary item already ships a `cloze` sentence (the blank is the term);
// we render those as numbered fill-in lines with a Word Bank, exactly like a
// TPT-style guided-notes page. Returns { html, keyRows } so the teacher answer
// key can list every blank's answer.
// (The tap-to-pair "match the word to its meaning" now lives in the interactive
// Vocab Explorer — vocabExplorer() — so the guided-notes packet no longer
// duplicates it.)

function guidedNotesFill(cfg = {}) {
  const vocab = Array.isArray(cfg.vocabulary) ? cfg.vocabulary : [];
  const items = vocab.filter((v) => v && v.term);
  if (!items.length) return { html: "", keyRows: [] };

  const bank = items
    .map((v) => {
      const imgSrc = resolveVocabImage(v.term, v.image).replace(/^\//, "../../");
      const def = esc(v.definition || "Tap to learn this word.");
      const termEsAttr = v.termEs ? ` data-term-es="${esc(v.termEs)}"` : "";
      const defEsAttr = v.definitionEs ? ` data-def-es="${esc(v.definitionEs)}"` : "";
      return `<button type="button" class="gn-bank-word" data-popover data-term="${esc(v.term)}"${termEsAttr} data-def="${def}"${defEsAttr} data-img="${esc(imgSrc)}" aria-label="Show the meaning and picture for ${esc(v.term)}">${esc(v.term)}<span class="gn-info" aria-hidden="true">ⓘ</span></button>`;
    })
    .join("");

  const keyRows = [];
  const lines = items.map((v, i) => {
    const num = i + 1;
    let sentence;
    if (v.cloze && /_{2,}/.test(v.cloze)) {
      // Drop a styled write-on blank where the term goes.
      sentence = esc(v.cloze).replace(
        /_{2,}/g,
        `<input class="gn-blank" type="text" data-nt-field aria-label="Fill in the blank" />`,
      );
    } else {
      // No prepared cloze — fall back to "____ : plain-language meaning".
      sentence = `<input class="gn-blank" type="text" data-nt-field aria-label="Fill in the blank" /> &mdash; ${esc(v.definition || "Write what this word means.")}`;
    }
    keyRows.push({ label: `Notes ${num}`, answer: v.term });
    return `<li class="gn-line"><span class="gn-num">${num}</span><span class="gn-sentence">${sentence}</span></li>`;
  });

  return {
    keyRows,
    html: `<div class="gn-fill">
    <div class="gn-bank">
      <span class="gn-bank-label">📚 Word Bank — fill each blank with the best word</span>
      <div class="gn-bank-words">${bank}</div>
      <p class="gn-bank-hint">👆 Tap any word to see what it means and a picture.</p>
      <p class="gn-bank-hint l3-only">Level 3: try the blanks from memory first, then check the bank.</p>
    </div>
    <ol class="gn-lines">${lines.join("")}</ol>
  </div>`,
  };
}

// Textbook-style "Learn It" teaching block for the guided notes. Built from the
// lesson's authored `launch.conceptIntro` (heading, plain-language intro, key
// idea, and a fully-narrated I-Do / We-Do / You-Do walkthrough). This is the
// piece that actually EXPLAINS the math and how to solve it, in big readable
// type with clear numbered steps, BEFORE students fill in notes or practice. It
// is designed for Level 1 and Level 2 students: short sentences, one idea per
// line, a worked example shown all the way through.
// Pull the clean list of lines from a conceptIntro stage (iDo/weDo/youDo).
function introLines(data) {
  if (!data) return [];
  const raw = Array.isArray(data.lines) ? data.lines : data.lines ? [data.lines] : [];
  return raw.filter(Boolean);
}

// A small, draggable-free "model space" so students can sketch the math
// (factor tree, number line, picture). Universal visual affordance — every
// example gets one, even when the lesson ships no authored chart.
// Authored, per-lesson visual from launch.visual. data-chips render as a clean
// chip strip (shared shape with the Launch phase, tying the two together);
// other chart kinds show a labeled caption (the SVG builders are DOM-coupled
// and not importable here). Returns "" when the lesson has no authored visual.
function learnVisual(cfg) {
  const v = (cfg.launch && cfg.launch.visual) || cfg.visual;
  if (!v || typeof v !== "object") return "";
  const title = v.title ? `<div class="li-visual-title">${esc(v.title)}</div>` : "";
  const unit = v.unit ? `<div class="li-visual-unit">${esc(v.unit)}</div>` : "";
  if (v.kind === "data-chips" && Array.isArray(v.values)) {
    const chips = v.values.map((x) => `<span class="li-chip">${esc(x)}</span>`).join("");
    return `${title}<div class="li-chips">${chips}</div>${unit}`;
  }
  // Non-chip chart: surface the authored title/unit so the data is still seen.
  if (title || unit) {
    return `${title}${unit || `<div class="li-visual-unit">See this picture in the Launch.</div>`}`;
  }
  return "";
}

// Textbook-style "Learn It" teaching block. Built from the lesson's authored
// `launch.conceptIntro`. Two variants:
//   • compact (default) — used inside the guided-notes packet: concept +
//     worked frame headings, no duplicate typing boxes.
//   • expanded (opts.expanded) — used on the standalone Learn It page/tab:
//     a full gradual-release lesson with TYPEABLE boxes, a worked Example 1
//     (Watch me), a "Notes to remember" recap, a guided "Work with me"
//     Example 2 (fill-in each step), a "Your turn", visuals and sketch spaces.
function conceptLearnBlock(cfg = {}, opts = {}) {
  const intro = (cfg.launch && cfg.launch.conceptIntro) || cfg.conceptIntro;
  if (!intro || typeof intro !== "object") return "";

  const heading = esc(intro.heading || "How the math works");
  const introP = intro.intro ? `<p class="learnit-intro">${esc(intro.intro)}</p>` : "";
  const keyIdea = intro.keyIdea
    ? `<div class="learnit-key"><span class="learnit-key-label">💡 Key idea</span><span class="learnit-key-text">${esc(intro.keyIdea)}</span></div>`
    : "";

  const iLines = introLines(intro.iDo);
  const weLines = introLines(intro.weDo);
  const youLines = introLines(intro.youDo);

  // ── Compact variant (guided-notes packet) ──
  if (!opts.expanded) {
    const stage = (lines, tag, klass, numbered, title) => {
      if (!lines.length) return "";
      const items = lines
        .map((l, i) =>
          numbered
            ? `<li class="learnit-step"><span class="learnit-steplabel">Step ${i + 1}</span><span class="learnit-step-text">${esc(l)}</span></li>`
            : `<li class="learnit-point">${esc(l)}</li>`,
        )
        .join("");
      const t = title ? `<span class="learnit-stage-title">${esc(title)}</span>` : "";
      return `<div class="learnit-stage ${klass}">
        <p class="learnit-stage-head"><span class="learnit-tag">${tag}</span>${t}</p>
        <${numbered ? "ol" : "ul"} class="learnit-lines">${items}</${numbered ? "ol" : "ul"}>
      </div>`;
    };
    const watch = stage(
      iLines,
      "👀 Watch — see it solved",
      "learnit-watch",
      true,
      intro.iDo && intro.iDo.title,
    );
    const we = stage(
      weLines,
      "🤝 We try it together",
      "learnit-we",
      false,
      intro.weDo && intro.weDo.title,
    );
    const you = stage(
      youLines,
      "✏️ Now you try",
      "learnit-you",
      false,
      intro.youDo && intro.youDo.title,
    );
    if (!watch && !we && !you && !introP && !keyIdea) return "";
    return `<div class="learnit" role="group" aria-label="Learn It — how the math works">
      <p class="learnit-eyebrow">📖 Learn It — read this first</p>
      <h3 class="learnit-head">${heading}</h3>
      ${introP}
      ${keyIdea}
      ${watch}
      ${we}
      ${you}
      <p class="learnit-bridge">✅ Got it? You're ready to practice — use these same steps on the problems.</p>
    </div>`;
  }

  // ── Expanded variant (Learn It page) — clean, publisher-style ──
  // One concept statement, one Key Idea, one fully worked example, then one
  // guided "Try it with me" the student completes. Calm single-accent layout
  // with generous whitespace — no stacked colored panels, no redundant vocab
  // (that lives in its own Vocab tab) and minimal, purposeful typing.
  const keyIdeaClean = intro.keyIdea
    ? `<aside class="li-keyidea"><span class="li-keyidea-label">Key idea</span><p>${esc(intro.keyIdea)}</p></aside>`
    : "";

  const vocab = Array.isArray(cfg.vocabulary) ? cfg.vocabulary : [];

  // Each rung of the gradual-release ladder is captured as a stage object so the
  // "learning journey" map at the top and the numbered stage cards below are
  // built from ONE source of truth — they can never drift apart, and a lesson
  // that is missing a rung simply drops that pill and renumbers cleanly.
  const stages = [];

  // ① "Picture it" — concrete graphics so English learners can SEE the math:
  // the authored launch visual (chips / number line) plus the lesson's
  // vocabulary pictures (concept diagrams — factor trees, models, etc.).
  const authored = learnVisual(cfg);
  const vocabPics = vocab
    .filter((v) => v && v.term)
    .slice(0, 3)
    .map((v) => {
      const src = resolveVocabImage(v.term, v.image).replace(/^\//, "../../");
      return `<figure class="li-graphic"><img src="${esc(src)}" alt="${esc(vocabImageAlt(v.term, v.definition))}" loading="lazy" onerror="this.closest('.li-graphic').style.display='none'" /><figcaption>${esc(v.term)}</figcaption></figure>`;
    })
    .join("");
  if (authored || vocabPics) {
    stages.push({
      id: "see",
      accent: "see",
      icon: "👁️",
      label: "Picture it",
      sub: "See what the math looks like",
      body: `${authored ? `<div class="li-figure">${authored}</div>` : ""}
          ${vocabPics ? `<div class="li-graphics">${vocabPics}</div>` : ""}`,
    });
  }

  // ② Worked example (I do) — read-only model, clean numbered steps. Key math
  // words become tap-to-define pop-ups (English-learner friendly).
  if (iLines.length) {
    stages.push({
      id: "watch",
      accent: "watch",
      icon: "👀",
      label: "Watch me solve it",
      sub: "I do — read every step",
      body: `<p class="li-lead">Read each step. Tap a <span class="li-pop-demo">blue word</span> to see what it means.</p>
        <ol class="li-steps">${iLines.map((l) => `<li>${popoverize(l, vocab)}</li>`).join("")}</ol>`,
    });
  }

  // ③ Guided practice (We do) — student fills in each step, then the answer.
  if (weLines.length) {
    stages.push({
      id: "together",
      accent: "together",
      icon: "🤝",
      label: "Try it with me",
      sub: "We do — fill in each step",
      practice: true,
      body: `<p class="li-lead">Work through the same steps on this one. Fill in each blank as we go.</p>
        <ol class="li-steps li-steps-fill">${weLines
          .map(
            (l) =>
              `<li>${popoverize(l, vocab)}<input class="li-input" type="text" data-nt-field placeholder="your work…" /></li>`,
          )
          .join("")}</ol>
        <div class="li-work"><span class="li-work-label">Show your work</span></div>
        <p class="li-answer"><span class="li-answer-label">Answer</span><input class="li-input li-input-answer" type="text" data-nt-field placeholder="Type the answer" /></p>`,
    });
  }

  // ④ On your own (You do) — a REAL problem to solve independently, drawn from
  // the lesson's own practice items, so the gradual-release ladder has a final
  // rung (not just a "next you will…" preview). Work box + answer + a no-JS
  // reveal that is earned, not given (scaffold, not giveaway).
  const p = cfg.practice || {};
  const ownProblem = []
    .concat(p.onLevel || [], p.approaching || [], p.extending || [])
    .find(
      (it) =>
        it &&
        it.stem &&
        (Array.isArray(it.choices) || it.sampleAnswer || it.answer) &&
        (it.type === "multiple-choice" || it.type === "open-response" || !it.type),
    );
  const ownGuidance = youLines.length
    ? `<ul class="li-list">${youLines.map((l) => `<li>${popoverize(l, vocab)}</li>`).join("")}</ul>`
    : "";
  if (ownProblem) {
    const ownAns =
      Array.isArray(ownProblem.choices) && typeof ownProblem.correctIndex === "number"
        ? ownProblem.choices[ownProblem.correctIndex]
        : ownProblem.sampleAnswer || ownProblem.answer || "";
    stages.push({
      id: "own",
      accent: "own",
      icon: "🚀",
      label: "On your own",
      sub: "You do — solve it solo",
      body: `${ownGuidance}
        <p class="li-problem-q"><strong>Solve:</strong> ${popoverize(ownProblem.stem, vocab)}</p>
        <div class="li-work"><span class="li-work-label">Show your work</span></div>
        <p class="li-answer"><span class="li-answer-label">My answer</span><input class="li-input li-input-answer" type="text" data-nt-field placeholder="Type your answer" /></p>
        ${ownAns ? `<details class="li-check"><summary>Check my answer</summary><div class="li-check-body"><strong>✅ Answer:</strong> ${esc(ownAns)}${ownProblem.explanation ? `<br><span class="li-check-why">${esc(ownProblem.explanation)}</span>` : ""}</div></details>` : ""}`,
    });
  } else if (youLines.length) {
    stages.push({
      id: "own",
      accent: "own",
      icon: "🚀",
      label: "On your own",
      sub: "You do — solve it solo",
      body: `${ownGuidance}
        <p class="li-answer"><span class="li-answer-label">My answer</span><input class="li-input li-input-answer" type="text" data-nt-field placeholder="Type your answer" /></p>`,
    });
  }

  // ⑤ Apply it — a real-world application problem (cfg.revealWordProblem) with
  // an earned sample-answer reveal, so the skill lands in a concrete situation
  // right after the gradual-release ladder.
  const apply = cfg.revealWordProblem;
  if (apply && apply.text) {
    const applyTitle = (apply.title || "").replace(/^apply:\s*/i, "").trim();
    stages.push({
      id: "apply",
      accent: "apply",
      icon: "🌍",
      label: "Apply it",
      sub: "Use the math in a real situation",
      body: `${applyTitle ? `<p class="li-lead"><strong>${esc(applyTitle)}</strong></p>` : ""}
        <p class="li-problem-q">${popoverize(apply.text, vocab)}</p>
        <div class="li-work"><span class="li-work-label">Show your work</span></div>
        <p class="li-answer"><span class="li-answer-label">My answer</span><input class="li-input li-input-answer" type="text" data-nt-field placeholder="Type your answer" /></p>
        ${apply.sampleAnswer ? `<details class="li-check"><summary>Check my answer</summary><div class="li-check-body"><strong>✅ Sample answer:</strong> ${esc(apply.sampleAnswer)}</div></details>` : ""}`,
    });
  }

  // ⑥ Turn & Talk — a discussion prompt with sentence starters (EN + ES) and a
  // word bank so every learner, including ESOL, can talk the math through with a
  // partner. Uses the lesson's first authored turn-and-talk item.
  const tt = Array.isArray(cfg.turnAndTalk)
    ? cfg.turnAndTalk.find((t) => t && t.question)
    : null;
  if (tt) {
    const stems = Array.isArray(tt.stems)
      ? tt.stems
          .map(
            (s) =>
              `<li>${esc(s.en || s)}${s && s.es ? `<span class="li-stem-es" lang="es">${esc(s.es)}</span>` : ""}</li>`,
          )
          .join("")
      : "";
    const words =
      Array.isArray(tt.wordBank) && tt.wordBank.length
        ? `<div class="li-wordbank"><span class="li-wordbank-label">Word bank</span>${tt.wordBank.map((w) => `<span class="li-word">${esc(w)}</span>`).join("")}</div>`
        : "";
    stages.push({
      id: "talk",
      accent: "talk",
      icon: "💬",
      label: "Turn & Talk",
      sub: "Say it out loud with a partner",
      body: `<p class="li-problem-q">${popoverize(tt.question, vocab)}</p>
        ${stems ? `<p class="li-stems-label">Try starting with:</p><ul class="li-stems">${stems}</ul>` : ""}
        ${words}`,
    });
  }

  if (!stages.length && !introP) return "";

  // Learning-journey map — a visual "you are here" roadmap of the gradual
  // release, each pill an anchor to its stage. Purely presentational; the
  // pill count always equals the number of stage cards that follow.
  const journey = stages.length
    ? `<nav class="li-journey no-print" aria-label="Your learning path">
        ${stages
          .map(
            (s, i) =>
              `<a class="li-jstep li-jstep-${s.accent}" href="#li-${s.id}"><span class="li-jnum">${i + 1}</span><span class="li-jico" aria-hidden="true">${s.icon}</span><span class="li-jlabel">${esc(s.label)}</span></a>`,
          )
          .join('<span class="li-jarrow" aria-hidden="true">→</span>')}
      </nav>`
    : "";

  const stageCards = stages
    .map(
      (s) =>
        `<section class="li-block li-stage li-stage-${s.accent}${s.practice ? " li-block-practice" : ""}" id="li-${s.id}">
        <p class="li-eyebrow"><span class="li-stage-ico" aria-hidden="true">${s.icon}</span><span class="li-stage-label">${esc(s.label)}</span><span class="li-stage-sub">${esc(s.sub)}</span></p>
        ${s.body}
      </section>`,
    )
    .join("");

  // Confidence self-check — a saved checkbox (auto-persisted by the page's
  // save/resume script) that turns the "you're ready" line into a small act of
  // metacognition, plus a warm send-off into the lesson.
  const ready = `<section class="li-ready-card" id="li-ready">
      <p class="li-ready-head">🎉 Ready to launch?</p>
      <label class="li-ready-check"><input type="checkbox" /> <span>I can solve one of these on my own.</span></label>
      <p class="li-ready-note">When you can finish <strong>Try it with me</strong> without help, head to the lesson activities and show what you know!</p>
    </section>`;

  return `<article class="li" aria-label="Learn It — how the math works">
    <p class="li-kicker">Learn It</p>
    <h2 class="li-title">${heading}</h2>
    ${introP ? `<p class="li-intro">${esc(intro.intro)}</p>` : ""}
    ${keyIdeaClean}
    ${journey}
    ${stageCards}
    ${ready}
  </article>`;
}

function notesSection(cfg = {}, worked = null, fillHtml = "") {
  const launch = cfg.launch || {};
  const explore = cfg.explore || {};

  // Today's objectives — each shown WITH its label (Content / Language) so the
  // objective type is always clear, not merged into one anonymous line.
  const hasObjectives = cfg.contentObjective || cfg.languageObjective;
  const learningHtml = hasObjectives
    ? `<div class="notes-learning">
      <span class="notes-learning-icon" aria-hidden="true">🎯</span>
      <div>
        <p class="notes-learning-label">Today's objectives</p>
        ${cfg.contentObjective ? `<p class="notes-learning-text"><strong>Content Objective:</strong> ${esc(cfg.contentObjective)}</p>` : ""}
        ${cfg.languageObjective ? `<p class="notes-learning-text"><strong>Language Objective:</strong> ${esc(cfg.languageObjective)}</p>` : ""}
      </div>
    </div>`
    : cfg.title
      ? `<div class="notes-learning">
      <span class="notes-learning-icon" aria-hidden="true">🎯</span>
      <div>
        <p class="notes-learning-label">What we're learning today</p>
        <p class="notes-learning-text">We are learning about ${esc(cfg.title)}.</p>
      </div>
    </div>`
      : "";

  // This packet is JUST note-taking now. The explanation + worked examples live
  // in Learn It; vocabulary lives in the Vocab tab; problems live in Practice.
  const fillBlock = fillHtml
    ? `<p class="gn-directions">✏️ Fill in each blank as we go. Use the Word Bank to help you.</p>${fillHtml}`
    : "";

  return `<section class="section notes">
  <h2>My Notes
    <span class="level-tag level-1 l1-only">Level 1 Support</span>
    <span class="level-tag level-2 l2-only">Level 2 Standard</span>
    <span class="level-tag level-3 l3-only">Level 3 Enrichment</span>
  </h2>
  ${learningHtml}
  <p class="gn-pointer">📖 See <strong>Learn It</strong> for the explanation and worked examples, and the <strong>Vocab</strong> tab for the words. These are your notes to fill in and keep.</p>
  ${fillBlock}
</section>`;
}

function gatherPractice(practice = {}) {
  return [].concat(
    practice.approaching || [],
    practice.onLevel || [],
    practice.extending || [],
    practice.optional || [],
  );
}

function tryItProblem(it, i) {
  let choiceHtml = "";
  if (Array.isArray(it.choices)) {
    choiceHtml = `<ol class="try-choices" type="A">${it.choices
      .map((c) => `<li>${esc(c)}</li>`)
      .join("")}</ol>`;
  }
  return `<div class="tryit">
  <p class="tryit-num">${i + 1}. ${esc(it.stem)}</p>
  ${choiceHtml}
  <div class="work-space"><span class="ws-label">Show your work:</span>${blankLines(3)}</div>
</div>`;
}

function tryItSection(practice = {}, usedStems = new Set()) {
  const items = gatherPractice(practice).filter((it) => it.stem && !usedStems.has(it.stem));
  // Pick a couple that were not used in the guided notes frame.
  const picks = items.slice(-2).length ? items.slice(-2) : items.slice(0, 2);
  if (!picks.length) return "";
  const probs = picks.map((it, i) => tryItProblem(it, i)).join("\n");

  return `<section class="section tryit-section">
  <h2>Try It</h2>
  <p class="muted">Solve on your own. Check the answer key when you are done.</p>
  ${probs}
  ${enrichSection(practice, new Set(picks.map((p) => p.stem)))}
</section>`;
}

// Level 2 enrichment: pull a harder challenge from the "extending" practice
// items. Prefers an open-response prompt (with a sentence frame), then an
// item with a stem, then an error-analysis to investigate. Always renders
// something when extending content exists so every sheet shows Level 2.
function enrichSection(practice = {}, usedStems = new Set()) {
  const ext = practice.extending || [];
  if (!ext.length) return "";

  let promptHtml = "";
  let frameHtml = "";
  let choiceHtml = "";

  const open = ext.find((it) => it.type === "open-response" && it.prompt);
  const stemItem = ext.find((it) => it.stem && !usedStems.has(it.stem));
  const errItem = ext.find((it) => it.type === "error-analysis");

  if (open) {
    promptHtml = `<p class="tryit-num">${esc(open.prompt)}</p>`;
    if (open.sentenceFrame) {
      frameHtml = `<p class="sentence-frame"><span class="ws-label">Sentence starter:</span> ${esc(open.sentenceFrame)}</p>`;
    }
  } else if (stemItem) {
    promptHtml = `<p class="tryit-num">${esc(stemItem.stem)}</p>`;
    if (Array.isArray(stemItem.choices)) {
      choiceHtml = `<ol class="try-choices" type="A">${stemItem.choices
        .map((c) => `<li>${esc(c)}</li>`)
        .join("")}</ol>`;
    }
  } else if (errItem) {
    promptHtml = `<p class="tryit-num">${esc(errItem.title || "Find and fix the mistake")} — find the error, then write the correct reasoning.</p>`;
  } else {
    return "";
  }

  return `<div class="enrich-block">
    <h3>Stretch Your Thinking <span class="level-tag level-2">Level 2 enrichment</span></h3>
    <p class="muted">Challenge task — explain your reasoning in full sentences.</p>
    ${promptHtml}
    ${choiceHtml}
    ${frameHtml}
    <div class="work-space"><span class="ws-label">Show your work:</span>${blankLines(4)}</div>
  </div>`;
}

// Per-distractor "why this is wrong" guidance for an MCQ, rendered only for the
// incorrect choices (keyed off correctIndex) and only when the config supplies
// an explicit `choiceExplanations` array. Additive/forward-compatible: nothing
// renders until a lesson opts in, with zero generator changes required.
function distractorWhyHtml(it) {
  const why = it && it.choiceExplanations;
  if (!Array.isArray(why) || !Array.isArray(it.choices)) return "";
  const lines = it.choices
    .map((c, j) =>
      j === it.correctIndex || !why[j]
        ? ""
        : `<li><strong>${choiceLetter(j)}) why this is wrong:</strong> <span class="ak-why">${esc(
            why[j],
          )}</span></li>`,
    )
    .filter(Boolean);
  return lines.length ? `<ul class="ak-distractors">${lines.join("")}</ul>` : "";
}

function answerKeySection(
  practice = {},
  reflect = {},
  config = null,
  worked = null,
  usedStems = new Set(),
  gnKeyRows = [],
) {
  const rows = [];
  let n = 1;
  // Fill-in-the-blank answers first, so a teacher can check the guided notes
  // line by line.
  if (Array.isArray(gnKeyRows)) {
    gnKeyRows.forEach((r) => {
      rows.push(`<li><strong>${esc(r.label)}:</strong> ${esc(r.answer)}</li>`);
    });
  }
  // Guided-notes "We Do / You Do" answers come next so teachers can check the
  // worked frame before the independent practice.
  if (worked && Array.isArray(worked.keyRows)) {
    worked.keyRows.forEach((r) => {
      rows.push(
        `<li><strong>${esc(r.label)}:</strong> ${esc(r.answer)}${
          r.why ? ` <span class="ak-why">— ${esc(r.why)}</span>` : ""
        }</li>`,
      );
    });
  }
  // Try It picks mirrored from tryItSection logic (same exclusion). Fall back to
  // the config's practice when the caller passes an empty object so the teacher
  // copy actually shows the independent-practice answers + misconception notes.
  const effectivePractice =
    gatherPractice(practice).length || !config ? practice : config.practice || {};
  const items = gatherPractice(effectivePractice).filter(
    (it) => it.stem && !usedStems.has(it.stem),
  );
  const tryPicks = items.slice(-2).length ? items.slice(-2) : items.slice(0, 2);
  // Misconception-targeted teacher note from the previously unused commonMistake
  // field — surfaced once at the head of the independent-practice answers.
  if (tryPicks.length && effectivePractice.commonMistake) {
    rows.push(
      `<li><strong>Watch for this mistake:</strong> <span class="ak-why">${esc(
        effectivePractice.commonMistake,
      )}</span></li>`,
    );
  }
  tryPicks.forEach((it) => {
    let ans = "";
    if (Array.isArray(it.choices) && typeof it.correctIndex === "number") {
      ans = `${choiceLetter(it.correctIndex)}. ${it.choices[it.correctIndex]}`;
    } else if (it.sampleAnswer) {
      ans = it.sampleAnswer;
    }
    rows.push(
      `<li><strong>Try It ${n++}:</strong> ${esc(ans)}${
        it.explanation ? ` <span class="ak-why">— ${esc(it.explanation)}</span>` : ""
      }${distractorWhyHtml(it)}</li>`,
    );
  });

  if (!rows.length) return "";
  return `<section class="answer-key">
  <h2>Answer Key &amp; Teacher Guide</h2>
  <ol class="ak-list">${rows.join("")}</ol>
</section>`;
}

/* ---------- page assembly ---------- */

// Embed-mode layout for Vocab / Learn It iframes inside the lesson overlay.
// Full-bleed white stage (no cream letterbox), but content is constrained to a
// comfortable classroom reading width so Chromebook (~1366×768) and laptop
// screens don't feel oversized after the full-viewport widen.
const EMBED_CSS = `html.nt-embed .topbar{display:none!important;}
html.nt-embed body{background:var(--card,#fff)!important;}
html.nt-embed .sheet{
  max-width:min(92vw,1160px)!important;
  width:100%!important;
  margin:0 auto!important;
  padding:clamp(12px,1.5vw,20px) clamp(12px,2vw,28px)!important;
  box-sizing:border-box;
  min-height:100vh;
}
html.nt-embed .vocab-grid{
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr))!important;
  gap:clamp(12px,1.5vw,18px)!important;
}
html.nt-embed .vocab-figure img{max-height:140px!important;}
/* Reading measure — white stage stays full-bleed via body */
html.nt-embed .li-intro{max-width:65ch!important;}
html.nt-embed .vx-wall{
  grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))!important;
  gap:clamp(12px,1.6vw,18px)!important;
}
html.nt-embed .vx-section,
html.nt-embed .vx-match,
html.nt-embed .vx-bank,
html.nt-embed .vx-clozelist,
html.nt-embed footer.packet{
  max-width:none!important;
}
html.nt-embed .vx-card{
  padding:clamp(12px,1.4vw,16px)!important;
  min-height:100%;
}
html.nt-embed .vx-figure{padding:12px!important;margin-bottom:10px!important;}
html.nt-embed .vx-figure img{max-height:140px!important;}
html.nt-embed .vx-term{font-size:clamp(16px,1.25vw,19px)!important;}
html.nt-embed .vx-def{font-size:clamp(14px,1.05vw,16px)!important;line-height:1.5!important;}
html.nt-embed .vx-mcols{
  grid-template-columns:minmax(0,1fr) minmax(0,1.35fr)!important;
  gap:clamp(12px,1.6vw,18px)!important;
}
html.nt-embed .vx-mterm,
html.nt-embed .vx-mdef{
  font-size:clamp(14px,1.1vw,16.5px)!important;
  padding:clamp(10px,1.2vw,14px)!important;
  min-height:44px;
}
html.nt-embed header.packet h1{font-size:clamp(22px,2vw,28px)!important;}
html.nt-embed .li-title{font-size:clamp(20px,1.9vw,26px)!important;}
html.nt-embed .li-steps>li{font-size:clamp(15px,1.15vw,17.5px)!important;}
html.nt-embed .li-stage{padding:clamp(12px,1.4vw,18px)!important;}
@media (max-width:1100px){
  html.nt-embed .vx-wall{
    grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))!important;
  }
  html.nt-embed .vx-mcols{grid-template-columns:1fr!important;}
}`;

function styles(printTitle = "") {
  const safeTitle = String(printTitle).replace(/["\\]/g, "");
  return `<style>
${EDITORIAL_FONT_IMPORT}
:root{
  --navy:#12355b;--teal:#1fa6a2;--teal-ink:#0c6f6b;--teal-light:#dff2ee;--amber:#f2c15b;
  --cream:#f7f4ec;--ink:#21313f;--muted:#5f6f80;--line:#d7e2ed;--card:#fff;
}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
  font-family:Calibri,"Segoe UI",system-ui,sans-serif;line-height:1.5;}
.sheet{max-width:8.5in;margin:0 auto;background:var(--card);padding:0.6in;}
.topbar{position:sticky;top:0;background:var(--navy);color:#fff;display:flex;
  justify-content:space-between;align-items:center;padding:12px 18px;}
.topbar .brand{font-weight:700;font-family:Outfit,system-ui,sans-serif;}
.print-btn{background:var(--amber);color:var(--navy);border:0;border-radius:8px;
  padding:9px 16px;font-weight:700;cursor:pointer;font-size:15px;}
header.packet{border-bottom:3px solid var(--teal);padding-bottom:14px;margin-bottom:18px;}
header.packet .eyebrow{color:var(--teal-ink);font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;font-size:13px;margin:0;}
header.packet h1{font-family:Outfit,system-ui,sans-serif;color:var(--navy);
  margin:6px 0 4px;font-size:26px;}
header.packet .meta{color:var(--muted);font-size:14px;margin:0;}
.name-line{display:flex;gap:24px;flex-wrap:wrap;margin-top:12px;font-size:14px;}
.nl-field{display:flex;align-items:center;gap:8px;flex:1;min-width:180px;}
.nl-label{font-weight:700;color:var(--navy);white-space:nowrap;}
.nl-input{flex:1;min-width:80px;border:none;border-bottom:1.5px solid var(--ink);background:transparent;
  font:inherit;font-size:15px;color:var(--navy);padding:4px 4px;border-radius:4px 4px 0 0;}
.nl-input:focus{outline:none;background:#fff7e6;}
@media print{.nl-input{border-bottom:1px solid #000;color:#000;}}
.section{margin:0 0 22px;page-break-inside:avoid;}
.section>h2{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:19px;
  border-left:5px solid var(--teal);padding-left:10px;margin:0 0 12px;}
.vocab-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
.vocab-card{border:1px solid var(--line);border-radius:10px;padding:12px;background:#fff;
  page-break-inside:avoid;}
.vocab-term{margin:0 0 4px;color:var(--navy);font-size:16px;}
.vocab-def{margin:0 0 8px;font-size:14px;}
.vocab-figure{text-align:center;background:var(--teal-light);border-radius:8px;padding:8px;}
.vocab-figure img{max-width:100%;max-height:120px;}
.vocab-caption{margin:6px 0 0;font-size:12.5px;color:var(--muted);font-style:italic;}
.notes-bullets,.prompt-list{margin:0 0 10px;padding-left:20px;}
.notes-bullets li,.prompt-list li{margin:5px 0;}
.think-block{background:var(--amber-light,#fef7e0);border-radius:8px;padding:10px 14px;margin:10px 0;}
.think-block h3{margin:0 0 6px;font-size:15px;color:var(--navy);}
/* Guided notes — learning line, visual steps, gradual-release frame */
.notes-learning{display:flex;gap:12px;align-items:flex-start;background:var(--teal-light);
  border:1px solid var(--teal);border-radius:10px;padding:12px 14px;margin:0 0 14px;page-break-inside:avoid;}
.notes-learning-icon{font-size:22px;line-height:1;flex:0 0 auto;}
.notes-learning-label{margin:0 0 2px;font-size:11.5px;font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;color:var(--teal-ink);}
.notes-learning-text{margin:0;font-size:15px;font-weight:600;color:var(--navy);}
/* Learn It — textbook-style concept teaching block (explains the math first) */
.learnit{border:1.5px solid var(--teal);border-radius:14px;background:#fff;
  padding:18px 20px;margin:0 0 18px;page-break-inside:avoid;
  box-shadow:0 1px 0 var(--teal-light);}
.learnit-eyebrow{margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.05em;
  text-transform:uppercase;color:var(--teal-ink);}
.learnit-head{font-family:Outfit,system-ui,sans-serif;color:var(--navy);
  font-size:21px;margin:0 0 10px;line-height:1.25;}
.learnit-intro{font-size:17px;line-height:1.7;color:var(--ink);margin:0 0 12px;font-weight:500;}
.learnit-key{display:flex;gap:10px;align-items:baseline;background:#fff7e6;
  border:1px solid var(--amber);border-radius:10px;padding:12px 14px;margin:0 0 14px;}
.learnit-key-label{flex:0 0 auto;font-weight:800;color:var(--navy);font-size:13px;
  white-space:nowrap;}
.learnit-key-text{font-size:16px;line-height:1.6;color:var(--navy);font-weight:600;}
.learnit-stage{border-radius:10px;padding:12px 14px;margin:0 0 12px;border:1px solid var(--line);}
.learnit-watch{background:var(--teal-light);border-color:var(--teal);}
.learnit-we{background:#fff7e6;border-color:var(--amber);}
.learnit-you{background:#eef3fb;border-color:var(--navy);}
.learnit-stage-head{margin:0 0 8px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.learnit-tag{display:inline-block;background:var(--navy);color:#fff;font-weight:800;
  font-size:13px;border-radius:999px;padding:4px 12px;}
.learnit-watch .learnit-tag{background:var(--teal);}
.learnit-we .learnit-tag{background:var(--amber);color:var(--navy);}
.learnit-you .learnit-tag{background:var(--navy);}
.learnit-stage-title{font-weight:700;color:var(--navy);font-size:14.5px;}
.learnit-lines{margin:0;padding:0;list-style:none;}
.learnit-step{display:flex;gap:10px;align-items:flex-start;margin:0 0 9px;
  font-size:16px;line-height:1.6;}
.learnit-steplabel{flex:0 0 auto;background:var(--navy);color:#fff;font-weight:800;
  font-size:12px;border-radius:6px;padding:3px 9px;margin-top:1px;white-space:nowrap;}
.learnit-watch .learnit-steplabel{background:var(--teal);}
.learnit-step-text{flex:1;}
.learnit-point{position:relative;padding-left:22px;margin:0 0 8px;font-size:16px;line-height:1.6;}
.learnit-point::before{content:"→";position:absolute;left:0;color:var(--teal);font-weight:800;}
.learnit-bridge{margin:8px 0 0;font-size:14.5px;font-weight:700;color:var(--navy);background:var(--teal-light);border-radius:10px;padding:10px 14px;}
.gn-subhead-note{margin:-4px 0 12px;font-size:14px;color:var(--muted);}
/* Learn It — clean, publisher-style teaching page (single accent, lots of air) */
.li{max-width:none;}
.li-kicker{margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--teal-ink);}
.li-title{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:26px;line-height:1.2;margin:0 0 14px;}
.li-intro{font-size:17px;line-height:1.7;color:var(--ink);margin:0 0 20px;max-width:60ch;}
.li-keyidea{border-left:4px solid var(--teal);background:var(--teal-light);border-radius:0 10px 10px 0;
  padding:14px 18px;margin:0 0 24px;}
.li-keyidea-label{display:block;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  color:var(--teal-ink);margin-bottom:4px;}
.li-keyidea p{margin:0;font-size:17px;line-height:1.6;color:var(--navy);font-weight:600;}
.li-seeit{background:#fbfdfc;border:1px solid var(--line);border-radius:14px;padding:18px 20px;}
.li-figure{margin:0 0 16px;padding:16px 18px;border:1px solid var(--line);border-radius:12px;background:#fff;}
.li-seeit .li-figure{margin:0 0 16px;}
.li-graphics{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px;}
.li-graphic{margin:0;text-align:center;border:1px solid var(--line);border-radius:12px;background:#fff;padding:12px;}
.li-graphic img{display:block;width:100%;max-height:150px;object-fit:contain;}
.li-graphic figcaption{margin-top:8px;font-weight:700;color:var(--navy);font-size:14.5px;}
.li-visual-title{font-weight:700;color:var(--navy);margin:0 0 10px;font-size:14px;}
.li-chips{display:flex;flex-wrap:wrap;gap:10px;}
.li-chip{display:inline-flex;align-items:center;justify-content:center;min-width:42px;padding:8px 14px;
  background:#fff;border:1.5px solid var(--teal);border-radius:10px;font-weight:800;color:var(--navy);font-size:18px;}
.li-visual-unit{font-size:14px;color:var(--muted);margin-top:10px;font-weight:600;}
.li-block{margin:0 0 28px;}
.li-eyebrow{margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  color:var(--navy);padding-bottom:6px;border-bottom:2px solid var(--line);}
.li-lead{margin:0 0 14px;font-size:15px;color:var(--muted);}
.li-steps{margin:0;padding:0;list-style:none;counter-reset:li-step;}
.li-steps>li{position:relative;counter-increment:li-step;padding:2px 0 22px 50px;font-size:19px;line-height:1.75;color:var(--ink);}
.li-steps>li::before{content:counter(li-step);position:absolute;left:0;top:0;width:34px;height:34px;border-radius:50%;
  background:var(--navy);color:#fff;font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center;}
.li-steps>li:not(:last-child)::after{content:"";position:absolute;left:16px;top:36px;bottom:2px;width:2px;background:var(--line);}
.li-block-practice{background:#fbfdfc;border:1px solid var(--line);border-radius:14px;padding:22px 24px;}
/* Tap-to-define pop-up triggers inside Learn It steps */
.li-pop{display:inline;border:0;background:transparent;padding:0;font:inherit;font-size:inherit;color:var(--teal-ink);
  font-weight:700;cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;}
.li-pop:hover{color:var(--navy);}
.li-pop-i{font-size:.7em;vertical-align:super;margin-left:1px;opacity:.8;}
.li-pop-demo{color:var(--teal-ink);font-weight:700;text-decoration:underline;text-decoration-style:dotted;}
.nt-popover-overlay{position:fixed;inset:0;z-index:9998;background:rgba(18,53,91,0.4);opacity:0;transition:opacity 0.2s ease;pointer-events:none;}
.nt-popover-overlay.active{opacity:1;pointer-events:auto;}
.nt-popover{position:fixed;z-index:9999;max-width:290px;background:rgba(255,255,255,0.96);border:1.5px solid rgba(31,166,162,0.45);
  border-radius:14px;box-shadow:0 12px 32px rgba(18,53,91,.18), 0 1px 3px rgba(0,0,0,0.05);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  padding:16px;opacity:0;transform:scale(0.95) translateY(5px);transition:opacity 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);pointer-events:none;}
.nt-popover.open{opacity:1;transform:scale(1) translateY(0);pointer-events:auto;}
.nt-popover img{display:block;width:100%;max-height:150px;object-fit:contain;border-radius:8px;background:#f0faf8;margin-bottom:10px;}
.nt-popover h4{margin:0 0 6px;color:var(--navy);font-size:18px;font-family:Outfit,system-ui,sans-serif;}
.nt-popover h4 .es-term{font-weight:400;color:var(--muted);font-size:0.95em;}
.nt-popover p{margin:0;font-size:15px;line-height:1.5;color:var(--ink);}
.nt-popover p .def-en{display:block;}
.nt-popover p .def-es{display:block;margin-top:6px;padding-top:6px;border-top:1px dashed var(--line);font-style:italic;color:var(--muted);font-size:14px;}
.nt-popover .nt-pop-close{position:absolute;top:6px;right:8px;border:none;background:transparent;font-size:20px;line-height:1;color:var(--muted);cursor:pointer;}
@media (max-width: 640px) {
  .nt-popover {
    position: fixed; bottom: 0; left: 0 !important; right: 0 !important; top: auto !important;
    max-width: 100% !important; width: 100% !important; border-radius: 20px 20px 0 0 !important;
    border: none !important; border-top: 1.5px solid rgba(31, 166, 162, 0.3) !important;
    box-shadow: 0 -8px 30px rgba(18, 53, 91, 0.15) !important;
    transform: translateY(100%); transition: transform 0.25s cubic-bezier(0.32, 0.94, 0.6, 1);
    background: #ffffff; padding: 24px 20px 30px;
  }
  .nt-popover.open { transform: translateY(0); }
}
@media print{.li-pop{color:#000;}.li-pop-i,.nt-popover,.nt-popover-overlay{display:none!important;}}
.li-steps-fill>li{padding-bottom:20px;}
.li-input{display:block;width:100%;margin-top:10px;border:0;border-bottom:2px solid var(--teal);
  padding:7px 4px;font:inherit;font-size:16px;color:var(--navy);background:transparent;}
.li-input::placeholder{color:#9bb0bd;font-style:italic;}
.li-input:focus{outline:none;border-bottom-color:var(--amber);background:#fffdf5;}
.li-work{margin:6px 0 16px;min-height:90px;border:1.5px dashed var(--line);border-radius:10px;
  position:relative;background:#fff;}
.li-work-label{position:absolute;top:8px;left:12px;font-size:12px;font-weight:700;color:var(--muted);}
.li-answer{display:flex;align-items:center;gap:12px;margin:4px 0 0;flex-wrap:wrap;}
.li-answer-label{flex:0 0 auto;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--teal-ink);}
.li-input-answer{flex:1;min-width:160px;margin-top:0;}
.li-list{margin:0 0 14px;padding-left:22px;}
.li-list>li{font-size:17px;line-height:1.65;margin:0 0 6px;color:var(--ink);}
.li-problem-q{font-size:18px;line-height:1.6;font-weight:600;color:var(--navy);margin:6px 0 12px;
  padding:12px 16px;background:#fff;border:1px solid var(--line);border-left:4px solid var(--navy);border-radius:0 10px 10px 0;}
.li-check{margin-top:12px;}
.li-check>summary{cursor:pointer;display:inline-block;font-weight:800;color:var(--teal-ink);font-size:15px;
  list-style:none;padding:6px 0;}
.li-check>summary::-webkit-details-marker{display:none;}
.li-check>summary::before{content:"👁️ ";}
.li-check-body{margin-top:8px;padding:12px 14px;background:var(--teal-light);border:1px solid var(--teal);
  border-radius:10px;font-size:16px;line-height:1.6;color:var(--navy);}
.li-check-why{color:var(--muted);font-size:14.5px;}
@media print{.li-check>summary{color:#000;}.li-check-body{background:#fff;border-color:#000;}}
.li-ready{margin:8px 0 0;padding:14px 18px;background:var(--teal-light);border-radius:10px;
  font-size:15px;font-weight:600;color:var(--navy);}
@media print{
  .li-keyidea,.li-figure,.li-block-practice,.li-ready{background:#fff;border-color:#000;}
  .li-steps>li::before{background:#000;}
  .li-input{border-bottom-color:#000;}
  .li-work{min-height:120px;border-color:#000;}
  .li-chip{border-color:#000;}
}
/* Vocab Explorer — interactive vocab home (Word Wall, Match, Fill-in, Use it) */
.vx-section{margin:0 0 30px;}
.vx-eyebrow{margin:0 0 6px;font-size:14px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  color:var(--navy);padding-bottom:6px;border-bottom:2px solid var(--line);}
.vx-lead{margin:0 0 14px;font-size:15px;color:var(--muted);}
.vx-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;}
.vx-card{border:1px solid var(--line);border-radius:14px;background:#fff;padding:14px;page-break-inside:avoid;}
.vx-figure{background:var(--teal-light);border-radius:10px;text-align:center;padding:10px;margin-bottom:10px;}
.vx-figure img{max-width:100%;max-height:120px;}
.vx-termline{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.vx-term{font-family:Outfit,system-ui,sans-serif;font-weight:800;color:var(--navy);font-size:18px;}
.vx-say{border:1.5px solid var(--teal);background:#fff;border-radius:999px;width:32px;height:32px;cursor:pointer;
  font-size:15px;line-height:1;flex:0 0 auto;}
.vx-say:hover{background:var(--teal-light);}
.vx-def{margin:0;font-size:15px;line-height:1.55;color:var(--ink);}
.vx-langs{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline;margin:0 0 8px;font-size:13px;color:var(--muted);}
.vx-lang b{color:var(--teal-ink);font-size:10px;font-weight:800;letter-spacing:.04em;margin-right:3px;}
.vx-langsep{color:var(--line);}
.vx-def-es{margin:6px 0 0;padding-left:10px;border-left:2px solid var(--teal-light);
  font-size:13.5px;line-height:1.5;color:var(--muted);font-style:italic;}
.vx-match{margin-top:6px;}
.vx-mcols{display:grid;grid-template-columns:1fr 1.5fr;gap:12px;}
.vx-mcol{display:flex;flex-direction:column;gap:10px;}
.vx-mterm,.vx-mdef{text-align:left;border:2px solid var(--line);background:#fff;border-radius:10px;
  padding:11px 14px;font:inherit;font-size:15px;color:var(--ink);cursor:pointer;transition:border-color .12s,background .12s;}
.vx-mterm{font-weight:800;color:var(--navy);}
.vx-mterm:hover,.vx-mdef:hover{border-color:var(--teal);}
.vx-sel{border-color:var(--teal)!important;background:var(--teal-light)!important;}
.vx-done{border-color:#2e9e5b!important;background:#f1faf2!important;color:#2e7d46!important;cursor:default;}
.vx-wrong{border-color:#d9534f!important;background:#fdf2f1!important;}
.vx-mfeedback{margin:12px 0 0;font-size:15px;font-weight:700;}
.vx-mfeedback.vx-ok{color:#2e9e5b;}
.vx-bank{border:2px dashed var(--teal);border-radius:12px;background:#f0faf8;padding:12px 14px;margin-bottom:16px;}
.vx-bank-label{display:block;font-weight:800;color:var(--teal-ink);font-size:12px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;}
.vx-bankwords{display:flex;flex-wrap:wrap;gap:8px;}
.vx-bankword{background:#fff;border:1.5px solid var(--teal);color:var(--navy);border-radius:999px;padding:5px 14px;font-weight:700;font-size:14px;}
.vx-clozelist{list-style:none;margin:0;padding:0;}
.vx-clozeline{display:flex;gap:12px;align-items:flex-start;padding:11px 12px;border:1px solid var(--line);
  border-radius:10px;margin-bottom:10px;background:#fff;page-break-inside:avoid;}
.vx-num{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:var(--navy);color:#fff;font-weight:800;
  font-size:13px;display:flex;align-items:center;justify-content:center;}
.vx-clozetext{flex:1;font-size:16px;line-height:1.9;color:var(--ink);}
.vx-blank{border:0;border-bottom:2px solid var(--teal);min-width:90px;font:inherit;font-size:15px;
  color:var(--navy);background:transparent;padding:2px 4px;margin:0 2px;}
.vx-blank:focus{outline:none;border-bottom-color:var(--amber);background:#fffdf5;}
.vx-stem{font-size:17px;line-height:2;color:var(--ink);margin:0 0 12px;}
.vx-blank-word{min-width:120px;}
.vx-blank-wide{min-width:220px;}
.vx-area{display:block;width:100%;border:1.5px solid var(--teal);border-radius:10px;padding:10px;
  font:inherit;font-size:15px;color:var(--navy);background:#fff;resize:vertical;}
.vx-area:focus{outline:none;border-color:var(--amber);background:#fffdf5;}
@media print{
  .vx-say,.vx-mfeedback{display:none;}
  .vx-card,.vx-figure,.vx-bank,.vx-clozeline,.vx-mterm,.vx-mdef,.vx-area{background:#fff;border-color:#000;}
  .vx-num{background:#000;}
  .vx-blank{border-bottom-color:#000;}
}
@media print{
  .learnit{border-color:#000;box-shadow:none;}
  .learnit-watch,.learnit-we,.learnit-you,.learnit-key{background:#fff;}
}
.notes-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 14px;}
.notes-step{border:1px solid var(--line);border-radius:10px;padding:12px;background:#fff;
  border-top:5px solid var(--teal);page-break-inside:avoid;}
.notes-step-2{border-top-color:var(--amber);}
.notes-step-3{border-top-color:var(--navy);}
.notes-step-head{display:flex;align-items:center;gap:8px;margin:0 0 6px;}
.notes-step-num{font-size:18px;line-height:1;}
.notes-step-title{margin:0;font-size:14.5px;color:var(--navy);}
.notes-step-text{margin:0;font-size:13.5px;line-height:1.4;}
.notes-word-chips{display:flex;flex-wrap:wrap;gap:6px;}
.notes-word-chip{display:inline-block;font-size:12.5px;font-weight:600;color:var(--navy);
  background:var(--teal-light);border:1px solid var(--teal);border-radius:999px;padding:2px 10px;}
.notes-gradual{display:grid;grid-template-columns:1fr;gap:10px;margin:6px 0 0;}
.notes-gr-step{border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:8px;
  padding:10px 12px;background:#fff;page-break-inside:avoid;}
.notes-gr-we{border-left-color:var(--amber);}
.notes-gr-you{border-left-color:var(--navy);}
.notes-gr-tag{display:inline-block;font-size:12.5px;font-weight:700;color:var(--navy);
  background:var(--cream);border:1px solid var(--line);border-radius:999px;padding:2px 10px;margin:0 0 6px;}
.notes-gr-cue{margin:0 0 6px;font-size:13px;color:var(--muted);}
/* Worked-along frame — real problems with simple labeled steps */
.notes-gr-intro{margin:0 0 10px;font-size:13px;color:var(--muted);font-style:italic;}
.wk-problem{margin:6px 0;font-size:13.5px;line-height:1.45;}
.wk-plabel{font-weight:700;color:var(--navy);}
.wk-steps{margin:6px 0 8px;padding-left:0;list-style:none;}
.wk-step{margin:5px 0;font-size:13.5px;line-height:1.45;}
.wk-steplabel{display:inline-block;font-weight:700;color:var(--teal-ink);background:var(--teal-light);
  border-radius:6px;padding:1px 8px;margin-right:8px;font-size:12px;}
.wk-step-blank{display:flex;align-items:center;gap:8px;}
.wk-step-blank .writeline{flex:1;height:0;border-bottom:1px solid #b9c6d3;}
.wk-answer{margin:6px 0 0;font-size:13.5px;}
.wk-anslabel{font-weight:700;color:var(--navy);}
.wk-answer-blank{display:flex;align-items:center;gap:8px;margin:6px 0 0;font-size:13.5px;}
.wk-answer-blank .writeline{flex:1;height:0;border-bottom:1px solid #b9c6d3;}
/* Turn & Talk — optional hint + optional starters label */
.tt-hint-toggle{margin:6px 0;border:1px solid var(--teal);background:#fff;border-radius:8px;
  padding:6px 10px;}
.tt-hint-toggle>summary{cursor:pointer;font-weight:700;font-size:13.5px;color:var(--teal);list-style:none;}
.tt-hint-toggle>summary::-webkit-details-marker{display:none;}
.tt-hint-text{margin:6px 0 0;font-size:13.5px;color:var(--ink);}
.tt-stems-label{display:block;margin:0 0 4px;font-size:12px;font-weight:700;color:var(--navy);
  text-transform:none;letter-spacing:0;}
.my-notes h3,.work-space .ws-label{font-size:14px;color:var(--muted);}
.writeline{border-bottom:1px solid #b9c6d3;height:26px;}
/* Typeable, auto-saved guided-notes fields (replace the print-only blank lines) */
textarea.writeline-area{display:block;width:100%;box-sizing:border-box;border:none;resize:vertical;
  font:inherit;color:var(--navy);line-height:26px;padding:0 2px;background-color:transparent;
  background-image:repeating-linear-gradient(transparent,transparent 25px,#b9c6d3 25px,#b9c6d3 26px);
  min-height:26px;border-radius:4px;}
textarea.writeline-area:focus{outline:none;background-color:#fff7e6;}
input.writeline{border:none;border-bottom:1px solid #b9c6d3;background:transparent;font:inherit;
  color:var(--navy);padding:1px 4px;min-width:60px;border-radius:3px 3px 0 0;}
.wk-step-blank input.writeline,.wk-answer-blank input.writeline{height:24px;}
input.gn-blank{background:transparent;font:inherit;font-weight:700;color:var(--navy);text-align:center;
  padding:1px 6px;border-radius:4px;}
input.writeline:focus,input.gn-blank:focus{outline:none;background-color:#fff7e6;}
.nt-save{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--teal-ink);
  background:var(--teal-light);border:1px solid var(--teal);border-radius:999px;padding:5px 12px;white-space:nowrap;}
.nt-clear{border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 10px;
  font-size:12px;font-weight:700;color:var(--muted);cursor:pointer;}
.nt-clear:hover{border-color:var(--navy);color:var(--navy);}
.example{border:1px solid var(--line);border-left:4px solid var(--amber);border-radius:8px;
  padding:12px 14px;margin:0 0 12px;page-break-inside:avoid;}
.example-head{margin:0 0 6px;color:var(--navy);font-size:16px;}
.ex-problem{margin:0 0 8px;font-weight:600;}
.ex-steps{margin:0 0 8px;padding-left:20px;}
.step-label{color:var(--teal);font-weight:700;}
.ex-solution,.ex-answer{margin:6px 0 0;font-size:14.5px;}
.tryit{margin:0 0 14px;page-break-inside:avoid;}
.tryit-num,.reflect-stem{font-weight:600;margin:0 0 6px;}
.try-choices{margin:0 0 8px;padding-left:24px;}
.try-choices li{margin:3px 0;}
.work-space{margin-top:6px;}
.muted{color:var(--muted);font-size:14px;}
.teacher-banner{background:#fff3cd;border:1.5px solid #e0a800;color:#7a5b00;border-radius:10px;
  padding:10px 14px;margin:0 0 14px;font-weight:800;font-size:14px;text-align:center;}
.answer-key{page-break-before:always;border-top:3px solid var(--navy);margin-top:24px;padding-top:14px;}
.answer-key h2{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:19px;}
.ak-list{padding-left:22px;}
.ak-list li{margin:8px 0;}
.ak-twr-head{font-family:Outfit,system-ui,sans-serif;color:var(--navy);font-size:16px;margin:14px 0 6px;}
.ak-why{color:var(--muted);font-style:italic;}
.ak-distractors{margin:4px 0 0;padding-left:18px;list-style:none;}
.ak-distractors li{margin:3px 0;font-size:13.5px;color:var(--muted);}
footer.packet{margin-top:18px;border-top:1px solid var(--line);padding-top:8px;
  color:var(--muted);font-size:12px;text-align:center;}
.level-tag{display:inline-block;font-family:Calibri,system-ui,sans-serif;font-size:11.5px;
  font-weight:700;letter-spacing:.02em;padding:2px 9px;border-radius:999px;vertical-align:middle;
  margin-left:8px;text-transform:none;}
.level-1{background:var(--teal-light);color:var(--teal-ink);border:1px solid var(--teal);}
.level-2{background:#fef0d8;color:#7a540e;border:1px solid var(--amber);}
.level-note{margin:-4px 0 12px;font-size:13.5px;color:var(--muted);}
.flagship-badge{display:inline-block;font-size:13px;font-weight:700;background:var(--amber);
  color:var(--navy);border-radius:999px;padding:3px 12px;vertical-align:middle;font-family:Calibri,system-ui,sans-serif;}
.mission{background:linear-gradient(135deg,var(--navy),#1b4a7a);color:#fff;border-radius:12px;
  padding:16px 20px;margin:0 0 22px;}
.mission-eyebrow{margin:0 0 4px;color:var(--amber);font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;font-size:12px;}
.mission-title{font-family:Outfit,system-ui,sans-serif;margin:0 0 8px;font-size:20px;border:0;padding:0;color:#fff;}
.mission-story{margin:0;font-size:14px;line-height:1.55;}
.enrich-block{border:1px dashed var(--amber);background:#fffaf0;border-radius:10px;
  padding:12px 14px;margin:14px 0 0;page-break-inside:avoid;}
.enrich-block h3{margin:0 0 4px;font-size:15px;color:var(--navy);}
.sentence-frame{font-size:13.5px;color:var(--muted);font-style:italic;margin:4px 0 8px;}
/* The Writing Revolution (TWR) */
.section.twr>h2{border-left-color:var(--amber);}
.twr-method{display:inline-block;font-size:11.5px;font-weight:700;background:var(--amber);
  color:var(--navy);border-radius:999px;padding:2px 10px;vertical-align:middle;margin-left:8px;}
.twr-block{border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:8px;
  padding:12px 14px;margin:0 0 12px;page-break-inside:avoid;background:#fff;}
.twr-block h3{margin:0 0 8px;color:var(--navy);font-size:15.5px;}
.twr-tag{display:inline-block;font-size:11px;font-weight:600;color:var(--teal);
  background:var(--teal-light);border-radius:999px;padding:1px 9px;margin-left:6px;vertical-align:middle;}
.twr-model{background:var(--teal-light);border-radius:6px;padding:8px 10px;margin:0 0 8px;font-size:14px;}
.twr-label{font-weight:700;color:var(--teal-ink);margin-right:4px;}
.twr-frame{margin:4px 0 4px;font-size:14px;}
.twr-en{font-weight:600;}
.twr-es{display:block;color:var(--muted);font-style:italic;font-size:13px;}
.twr-exp-row,.twr-type-row{display:grid;grid-template-columns:96px 1fr;gap:10px;
  align-items:start;margin:8px 0;}
.twr-conj,.twr-type-name{font-weight:700;color:var(--navy);background:#fef0d8;
  border-radius:6px;padding:4px 8px;font-size:13.5px;text-align:center;}
.twr-conj-es{display:block;font-weight:600;color:var(--muted);font-style:italic;font-size:11.5px;}
.twr-exp-lines{min-width:0;}
.twr-hint{margin:0 0 4px;font-size:13px;color:var(--muted);}
.twr-stems{margin:0 0 8px;}
/* Turn & Talk — Discussion Points */
.section.turn-and-talk>h2{border-left-color:var(--teal);}
.tt-card{border:1px solid var(--line);border-left:4px solid var(--navy);border-radius:8px;
  padding:12px 14px;margin:0 0 12px;page-break-inside:avoid;background:#fff;}
.tt-phase{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;color:#fff;background:var(--navy);border-radius:999px;
  padding:2px 10px;margin:0 0 8px;}
.tt-question{font-weight:600;color:var(--navy);font-size:15px;margin:6px 0 10px;}
.tt-support{background:var(--teal-light);border:1px solid var(--teal);border-radius:8px;
  padding:10px 12px;margin:0 0 10px;}
.tt-extend{background:#fffaf0;border:1px dashed var(--amber);border-radius:8px;
  padding:10px 12px;margin:0;}
.tt-support .level-tag,.tt-extend .level-tag{margin:0 0 6px;}
.tt-kernel{margin:6px 0;font-size:14px;}
.tt-kernel-label{font-weight:700;color:var(--teal-ink);margin-right:4px;}
.tt-stems{margin:6px 0;}
.tt-mini-label{font-weight:700;color:var(--navy);margin-right:4px;}
.tt-wordbank{margin:6px 0;font-size:13.5px;}
.tt-word{display:inline-block;font-weight:600;color:var(--teal);background:#fff;
  border:1px solid var(--teal);border-radius:999px;padding:1px 9px;margin:2px 4px 2px 0;font-size:12.5px;}
.tt-listen{margin:6px 0 0;font-size:13px;color:var(--muted);font-style:italic;}
.tt-extend-q{font-weight:600;color:#9a6b12;margin:4px 0 6px;font-size:14px;}
.tt-extend-stems{margin:4px 0 0;padding-left:20px;font-size:13.5px;}
.tt-extend-stems li{margin:3px 0;}
/* Projects Section */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 12px;
}
.project-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
  background: var(--card);
  box-shadow: 0 4px 12px rgba(18, 53, 91, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;
  page-break-inside: avoid;
}
.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(18, 53, 91, 0.08);
}
.project-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.project-emoji {
  font-size: 24px;
}
.project-title {
  margin: 0;
  color: var(--navy);
  font-size: 16.5px;
  font-family: Outfit, system-ui, sans-serif;
}
.project-desc {
  margin: 0 0 14px 0;
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.45;
  flex-grow: 1;
}
.project-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.project-link-btn {
  display: block;
  text-align: center;
  background: var(--cream);
  color: var(--navy);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
}
.project-link-btn:hover {
  background: var(--teal-light);
  color: var(--teal);
  border-color: var(--teal);
}
.project-link-btn.project-link-main {
  background: var(--teal);
  color: #fff;
  border-color: var(--teal);
}
.project-link-btn.project-link-main:hover {
  background: #198e8a;
  border-color: #198e8a;
}
/* Download menu */
.dl-wrap{position:relative;display:inline-block;margin-left:10px;}
.dl-menu{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid var(--line);
  border-radius:8px;box-shadow:0 8px 24px rgba(18,53,91,.18);padding:6px;min-width:210px;z-index:20;}
.dl-menu[hidden]{display:none;}
.dl-menu a{display:block;padding:9px 12px;color:var(--ink);text-decoration:none;border-radius:6px;
  font-size:14px;font-weight:600;}
.dl-menu a:hover,.dl-menu a:focus{background:var(--teal-light);}
.dl-menu .dl-sub{display:block;font-weight:400;color:var(--muted);font-size:12px;}

/* Leveled display settings */
.l1-only, .l2-only, .l3-only { display: none !important; }
.l2-only-block { display: block !important; }

html.level-l1 .l1-only { display: block !important; }
html.level-l1 span.l1-only { display: inline !important; }
html.level-l1 div.l1-only-flex { display: flex !important; }
html.level-l1 .l2-only, html.level-l1 .l3-only, html.level-l1 .l2-only-block { display: none !important; }

html.level-l2 .l2-only { display: block !important; }
html.level-l2 .l2-only-block { display: block !important; }
html.level-l2 span.l2-only { display: inline !important; }
html.level-l2 div.l2-only-flex { display: flex !important; }
html.level-l2 .l1-only, html.level-l2 .l3-only { display: none !important; }

html.level-l3 .l3-only { display: block !important; }
html.level-l3 span.l3-only { display: inline !important; }
html.level-l3 div.l3-only-flex { display: flex !important; }
html.level-l3 .l1-only, html.level-l3 .l2-only, html.level-l3 .l2-only-block { display: none !important; }

/* Level Selector Styling */
.level-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.selector-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.pill-group {
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  padding: 2px;
  gap: 2px;
}
.pill-btn {
  position: relative;
  cursor: pointer;
}
.pill-btn input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.pill-btn span {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 18px;
  font-size: 11.5px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.2s ease;
  user-select: none;
}
.pill-btn input[type="radio"]:checked + span {
  background: var(--amber);
  color: var(--navy);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.pill-btn:hover span {
  color: #fff;
}
.pill-btn input[type="radio"]:checked:hover span {
  color: var(--navy);
}

/* Leveled component details */
.vocab-def-prompt, .notes-step-prompt {
  font-size: 13.5px;
  color: var(--muted);
  font-weight: 600;
  margin: 4px 0 6px;
}
.scratchpad {
  border: 1px solid var(--line);
  border-radius: 8px;
  background-color: #fafbfc;
  background-image: radial-gradient(var(--line) 1px, transparent 0);
  background-size: 16px 16px;
  height: 110px;
  margin: 10px 0;
  position: relative;
}
.scratchpad-label {
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  background: rgba(255,255,255,0.85);
  border: 1px solid var(--line);
  padding: 2px 6px;
  border-radius: 4px;
}
.wk-checkboxes {
  background: rgba(31, 166, 162, 0.05);
  border: 1px dashed var(--teal);
  border-radius: 6px;
  padding: 8px 10px;
  margin: 8px 0;
}
.wk-checkbox-label {
  font-size: 13.5px;
  color: var(--ink);
  cursor: pointer;
}
.wk-checkbox-label input {
  margin-right: 4px;
  vertical-align: middle;
}

/* Turn & Talk Leveling */
html.level-l1 .tt-support { display: block !important; }
html.level-l1 .tt-extend { display: none !important; }
html.level-l2 .tt-support { display: block !important; }
html.level-l2 .tt-extend { display: block !important; }
html.level-l3 .tt-support { display: none !important; }
html.level-l3 .tt-extend { display: block !important; }

/* Vocab def leveling styling */
html.level-l1 .vocab-def-l1 { display: block !important; }
html.level-l1 .vocab-def-l2, html.level-l1 .vocab-def-l3 { display: none !important; }
html.level-l2 .vocab-def-l2 { display: block !important; }
html.level-l2 .vocab-def-l1, html.level-l2 .vocab-def-l3 { display: none !important; }
html.level-l3 .vocab-def-l3 { display: block !important; }
html.level-l3 .vocab-def-l1, html.level-l3 .vocab-def-l2 { display: none !important; }

/* Notes step body leveling */
html.level-l1 .notes-step-body-l1 { display: block !important; }
html.level-l1 .notes-step-body-l2, html.level-l1 .notes-step-body-l3 { display: none !important; }
html.level-l2 .notes-step-body-l2 { display: block !important; }
html.level-l2 .notes-step-body-l1, html.level-l2 .notes-step-body-l3 { display: none !important; }
html.level-l3 .notes-step-body-l3 { display: block !important; }
html.level-l3 .notes-step-body-l1, html.level-l3 .notes-step-body-l2 { display: none !important; }

@media print{
  @page{
    size:letter;margin:0.7in 0.7in 0.85in;
    @bottom-left{content:"Neft Teacher";font-family:Georgia,serif;font-size:9pt;color:#444;}
    @bottom-center{content:"${safeTitle}";font-family:Georgia,serif;font-size:9pt;color:#444;}
    @bottom-right{content:"Page " counter(page) " of " counter(pages);font-family:Georgia,serif;font-size:9pt;color:#444;}
  }
  @page:first{
    @top-center{content:"";}
  }
  body{background:#fff;color:#000;font-family:Georgia,"Times New Roman",serif;font-size:11.5pt;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .topbar,.print-btn,.no-print,.dl-wrap,.level-selector{display:none !important;}
  .sheet{max-width:none;margin:0;padding:0;box-shadow:none;}
  .section{margin-bottom:16px;}
  .section>h2,header.packet h1,header.packet .eyebrow,.example-head,
  .answer-key h2,.vocab-term,.twr-block h3{color:#000;}
  .vocab-figure{background:#fff;border:1px solid #000;}
  .think-block{background:#fff;border:1px solid #000;}
  .notes-learning{background:#fff;border:1px solid #000;}
  .notes-learning-label,.notes-learning-text,.notes-step-title{color:#000;}
  .notes-step{background:#fff;border:1px solid #000;border-top:2px solid #000;}
  .notes-step-2,.notes-step-3{border-top:2px solid #000;}
  .notes-word-chip{background:#fff;color:#000;border:1px solid #000;}
  .notes-gr-step{background:#fff;border:1px solid #000;border-left:2px solid #000;}
  .notes-gr-we,.notes-gr-you{border-left:2px solid #000;}
  .notes-gr-tag{background:#fff;color:#000;border:1px solid #000;}
  .notes-gr-cue{color:#222;}
  .notes-gr-intro{color:#222;}
  .wk-steplabel{background:#fff;color:#000;border:1px solid #000;}
  .wk-plabel,.wk-anslabel{color:#000;}
  .wk-step-blank .writeline,.wk-answer-blank .writeline{border-bottom:1px solid #000;}
  .tt-hint-toggle{background:#fff;border:1px solid #000;}
  .tt-hint-toggle>summary{color:#000;}
  .tt-hint-toggle[open]>summary{margin-bottom:2px;}
  .tt-hint-toggle>summary{list-style:none;}
  .tt-hint-toggle>.tt-hint-text{display:block !important;}
  .tt-hint-text{color:#000;}
  .tt-stems-label{color:#000;}
  header.packet{border-bottom:2px solid #000;}
  .section>h2{border-left:4px solid #000;}
  .example{border-left:3px solid #000;}
  .answer-key{border-top:2px solid #000;}
  .vocab-card{border:1px solid #000;}
  .writeline{border-bottom:1px solid #000;}
  textarea.writeline-area{color:#000;background-image:repeating-linear-gradient(transparent,transparent 25px,#000 25px,#000 26px);}
  input.writeline{border-bottom:1px solid #000;color:#000;}
  input.gn-blank{color:#000;}
  textarea.writeline-area:focus,input.writeline:focus,input.gn-blank:focus{background-color:transparent;}
  .nt-save,.nt-clear{display:none !important;}
  .mission{background:#fff;color:#000;border:1px solid #000;}
  .mission-title,.mission-eyebrow{color:#000;}
  .level-tag,.flagship-badge,.twr-method,.twr-tag{background:#fff;color:#000;border:1px solid #000;}
  .enrich-block{background:#fff;border:1px dashed #000;}
  .twr-block{border:1px solid #000;border-left:3px solid #000;}
  .twr-model{background:#fff;border:1px solid #000;}
  .twr-conj,.twr-type-name{background:#fff;border:1px solid #000;color:#000;}
  .twr-es,.twr-conj-es{color:#222;}
  .tt-card{border:1px solid #000;border-left:3px solid #000;}
  .tt-question,.section.turn-and-talk>h2{color:#000;}
  .tt-phase{background:#fff;color:#000;border:1px solid #000;}
  .tt-support{background:#fff;border:1px solid #000;}
  .tt-extend{background:#fff;border:1px dashed #000;}
  .tt-kernel-label,.tt-mini-label,.tt-extend-q{color:#000;}
  .tt-word{background:#fff;color:#000;border:1px solid #000;}
  .tt-listen{color:#222;}
  footer.packet{display:none;}
  .scratchpad {
    border: 1px solid #000 !important;
    background-color: #fff !important;
    background-image: radial-gradient(#000 1px, transparent 0) !important;
  }
  .scratchpad-label {
    background: #fff !important;
    color: #000 !important;
    border: 1px solid #000 !important;
  }
  .wk-checkboxes {
    background: #fff !important;
    border: 1px dashed #000 !important;
  }
}
${EDITORIAL_OVERRIDES}
</style>
</style>`;
}

function missionBanner(cfg) {
  const m = cfg.flagship && cfg.flagship.mission;
  if (!m) return "";
  return `<section class="section mission">
  <p class="mission-eyebrow">${esc(m.eyebrow || "Flagship Mission")}</p>
  <h2 class="mission-title">${esc(m.title || "")}</h2>
  ${m.story ? `<p class="mission-story">${esc(m.story)}</p>` : ""}
</section>`;
}

function buildPacket(id, cfg, isFlagship, teacher = false) {
  const worked = deriveWorkedSteps(cfg);
  const usedStems = new Set(worked.usedStems || []);
  const gn = guidedNotesFill(cfg);
  const standard = cfg.standard ? `Standard ${esc(cfg.standard)}` : "";
  const standardPlain = cfg.standard ? `Standard ${cfg.standard}` : "";
  const unit = cfg.unit != null ? `Unit ${esc(cfg.unit)}` : "";
  const flagBadge = isFlagship ? `<span class="flagship-badge">Flagship</span>` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(cfg.title)} — Notes Packet${teacher ? " (Teacher Copy — Answer Key)" : ""}</title>
${styles(`${cfg.title}${standardPlain ? " · " + standardPlain : ""}`)}
<style>html.nt-embed .topbar{display:none!important;}html.nt-embed .sheet{margin-top:12px!important;}</style>
<style>
  /* Fill-in-the-blank guided notes */
  .gn-directions{margin:14px 0 6px;font-weight:700;color:var(--navy);font-size:15px;}
  .gn-pointer{margin:10px 0 14px;padding:10px 14px;background:var(--teal-light);border-radius:10px;font-size:14px;color:var(--navy);}
  .gn-fill{margin:6px 0 4px;}
  .gn-bank{border:2px dashed var(--teal);border-radius:12px;background:#f0faf8;padding:12px 14px;margin-bottom:14px;}
  .gn-bank-label{display:block;font-weight:800;color:var(--teal-ink);font-size:13px;text-transform:uppercase;letter-spacing:.02em;margin-bottom:8px;}
  .gn-bank-words{display:flex;flex-wrap:wrap;gap:8px;}
  .gn-bank-word{background:#fff;border:1.5px solid var(--teal);color:var(--navy);border-radius:999px;padding:5px 14px;font-weight:700;font-size:14px;}
  .gn-bank-hint{margin:8px 0 0;font-size:12px;color:#5a6b78;font-style:italic;}
  .gn-lines{list-style:none;margin:0;padding:0;counter-reset:none;}
  .gn-line{display:flex;align-items:flex-start;gap:12px;padding:11px 12px;border:1px solid #e3e8ec;border-radius:10px;margin-bottom:10px;background:#fff;break-inside:avoid;page-break-inside:avoid;}
  .gn-num{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:var(--navy);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;margin-top:1px;}
  .gn-sentence{flex:1;font-size:16px;line-height:1.9;color:#1c2b36;}
  .gn-blank{display:inline-block;min-width:120px;border-bottom:2px solid var(--navy);height:1.25em;margin:0 4px;vertical-align:bottom;}
  .gn-subhead{margin:20px 0 8px;color:var(--navy);font-size:16px;font-weight:800;}
  /* Tap-to-define word-bank pop-ups (with picture) */
  .gn-bank-word{cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
  .gn-info{font-size:12px;color:var(--teal);font-weight:700;}
  .nt-popover-overlay{position:fixed;inset:0;z-index:9998;background:rgba(18,53,91,0.4);opacity:0;transition:opacity 0.2s ease;pointer-events:none;}
  .nt-popover-overlay.active{opacity:1;pointer-events:auto;}
  .nt-popover{position:fixed;z-index:9999;max-width:290px;background:rgba(255,255,255,0.96);border:1.5px solid rgba(31,166,162,0.45);
    border-radius:14px;box-shadow:0 12px 32px rgba(18,53,91,.18), 0 1px 3px rgba(0,0,0,0.05);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    padding:16px;opacity:0;transform:scale(0.95) translateY(5px);transition:opacity 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);pointer-events:none;}
  .nt-popover.open{opacity:1;transform:scale(1) translateY(0);pointer-events:auto;}
  .nt-popover img{display:block;width:100%;max-height:150px;object-fit:contain;border-radius:8px;
    background:#f0faf8;margin-bottom:10px;}
  .nt-popover h4{margin:0 0 6px;color:var(--navy);font-size:17px;font-family:Outfit,system-ui,sans-serif;}
  .nt-popover h4 .es-term{font-weight:400;color:var(--muted);font-size:0.95em;}
  .nt-popover p{margin:0;font-size:14.5px;line-height:1.5;color:var(--ink);}
  .nt-popover p .def-en{display:block;}
  .nt-popover p .def-es{display:block;margin-top:6px;padding-top:6px;border-top:1px dashed var(--line);font-style:italic;color:var(--muted);font-size:14px;}
  .nt-popover .nt-pop-close{position:absolute;top:6px;right:8px;border:none;background:transparent;
    font-size:20px;line-height:1;color:var(--muted);cursor:pointer;}
  @media (max-width: 640px) {
    .nt-popover {
      position: fixed; bottom: 0; left: 0 !important; right: 0 !important; top: auto !important;
      max-width: 100% !important; width: 100% !important; border-radius: 20px 20px 0 0 !important;
      border: none !important; border-top: 1.5px solid rgba(31, 166, 162, 0.3) !important;
      box-shadow: 0 -8px 30px rgba(18, 53, 91, 0.15) !important;
      transform: translateY(100%); transition: transform 0.25s cubic-bezier(0.32, 0.94, 0.6, 1);
      background: #ffffff; padding: 24px 20px 30px;
    }
    .nt-popover.open { transform: translateY(0); }
  }
  /* Larger, clearer Watch & Try worked visuals */
  .notes-gr-step .wk-problem{font-size:15.5px;line-height:1.6;background:#f7fafc;border-radius:8px;padding:8px 12px;}
  .notes-gr-step .wk-steps .wk-step{font-size:15px;line-height:1.7;margin:7px 0;}
  .notes-gr-step .wk-steplabel{font-size:13px;padding:2px 10px;}
  /* Drag-and-drop "put the steps in order" */
  .ss-step{border-left-color:var(--teal)!important;}
  .step-sorter{margin-top:8px;}
  .ss-list{list-style:none;margin:0;padding:0;counter-reset:ss;}
  .ss-item{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid var(--line);
    border-left:5px solid var(--teal);border-radius:10px;padding:10px 12px;margin:8px 0;font-size:15px;
    line-height:1.5;cursor:grab;transition:box-shadow .12s,border-color .12s;}
  .ss-item:focus-visible{outline:3px solid var(--amber);outline-offset:2px;}
  .ss-item.ss-dragging{opacity:.5;cursor:grabbing;}
  .ss-item.ss-over{border-color:var(--teal);box-shadow:0 4px 14px rgba(31,166,162,.25);}
  .ss-item.ss-right{border-left-color:#2e9e5b;background:#f1faf2;}
  .ss-item.ss-wrong{border-left-color:#d9534f;background:#fdf2f1;}
  .ss-grip{color:var(--muted);font-size:18px;cursor:grab;flex:0 0 auto;}
  .ss-text{flex:1;}
  .ss-move{display:inline-flex;flex-direction:column;gap:2px;flex:0 0 auto;}
  .ss-move button{border:1px solid var(--line);background:#f7fafc;border-radius:6px;width:30px;height:22px;
    font-size:11px;line-height:1;color:var(--navy);cursor:pointer;padding:0;}
  .ss-move button:hover{border-color:var(--teal);}
  .ss-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px;}
  .ss-check,.ss-shuffle{border:none;border-radius:999px;padding:8px 16px;font-size:14px;font-weight:700;cursor:pointer;}
  .ss-check{background:var(--teal);color:#fff;}
  .ss-shuffle{background:#fff;color:var(--navy);border:1.5px solid var(--line);}
  .ss-feedback{font-size:14px;font-weight:700;}
  .ss-feedback.ok{color:#2e9e5b;}
  .ss-feedback.no{color:#d9534f;}
  /* Tap-to-pair vocabulary match-up */
  .match-up{margin:12px 0 6px;background:#f0faf8;border:1.5px dashed var(--teal);border-radius:12px;padding:12px 14px;}
  .mu-head{margin:0 0 10px;font-size:14px;color:var(--navy);}
  .mu-cols{display:grid;grid-template-columns:1fr 1.4fr;gap:10px;}
  .mu-col{display:flex;flex-direction:column;gap:8px;}
  .mu-term,.mu-def{text-align:left;border:2px solid var(--line);background:#fff;border-radius:10px;
    padding:9px 12px;font:inherit;font-size:14.5px;color:var(--ink);cursor:pointer;transition:border-color .12s,background .12s;}
  .mu-term{font-weight:700;color:var(--navy);}
  .mu-term:hover,.mu-def:hover{border-color:var(--teal);}
  .mu-term.sel,.mu-def.sel{border-color:var(--teal);background:#e6f7f4;}
  .mu-term.done,.mu-def.done{border-color:#2e9e5b;background:#f1faf2;color:#2e7d46;cursor:default;}
  .mu-term.miss,.mu-def.miss{border-color:#d9534f;background:#fdf2f1;}
  .mu-feedback{margin:10px 0 0;font-size:14px;font-weight:700;}
  .mu-feedback.ok{color:#2e9e5b;}
  @media (prefers-reduced-motion:reduce){.ss-item,.mu-term,.mu-def{transition:none;}}
  @media print{
    .gn-bank{border:1.5px dashed #000;background:#fff;}
    .gn-bank-label{color:#000;}
    .gn-bank-word{border-color:#000;color:#000;}
    .gn-info{display:none;}
    .gn-line{border-color:#000;}
    .gn-num{background:#000;}
    .gn-blank{border-bottom-color:#000;}
    .gn-subhead,.gn-directions{color:#000;}
    .nt-popover,.nt-popover-overlay{display:none!important;}
    .ss-item{border-color:#000;border-left-color:#000;break-inside:avoid;}
    .ss-grip,.ss-move{display:none;}
  }
</style>
<script>
  if(/[?&]embed=1(?:&|$)/.test(location.search)){document.documentElement.classList.add("nt-embed");}
  (function() {
    const savedLevel = localStorage.getItem('notes-level') || 'l2';
    document.documentElement.classList.add('level-' + savedLevel);
  })();
</script>
</head>
<body>
<div class="topbar no-print">
  <span class="brand">Neft Teacher · Notes Packet${teacher ? " · Teacher Copy" : ""}</span>
  <div class="level-selector no-print">
    <span class="selector-label">Leveled Mode:</span>
    <div class="pill-group">
      <label class="pill-btn">
        <input type="radio" name="notes-level" value="l1" onclick="setLevel('l1')" />
        <span>L1 Support</span>
      </label>
      <label class="pill-btn">
        <input type="radio" name="notes-level" value="l2" onclick="setLevel('l2')" />
        <span>L2 Standard</span>
      </label>
      <label class="pill-btn">
        <input type="radio" name="notes-level" value="l3" onclick="setLevel('l3')" />
        <span>L3 Enrichment</span>
      </label>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <button class="nt-clear no-print" type="button" id="nt-clear-btn">Clear my work</button>
    <button class="print-btn" type="button" onclick="window.print()">Print / Save as PDF</button>
    <div class="dl-wrap">
      <button class="print-btn" type="button" aria-haspopup="true" aria-expanded="false"
        onclick="(function(b){var m=b.parentNode.querySelector('.dl-menu');var o=m.hasAttribute('hidden');if(o){m.removeAttribute('hidden');}else{m.setAttribute('hidden','');}b.setAttribute('aria-expanded',String(o));})(this)">Download ▾</button>
      <div class="dl-menu" hidden role="menu">
        <a href="./${teacher ? "notes-teacher" : "notes"}.html" download="${esc(id)}-notes${teacher ? "-teacher" : ""}.html" role="menuitem">Self-contained HTML<span class="dl-sub">Open or save the full packet</span></a>
        <a href="./downloads/${esc(id)}-notes${teacher ? "-teacher" : ""}.pdf" role="menuitem">PDF<span class="dl-sub">Print-ready, branded</span></a>
        <a href="./downloads/${esc(id)}-notes${teacher ? "-teacher" : ""}.docx" role="menuitem">Word (DOCX)<span class="dl-sub">Editable document</span></a>
      </div>
    </div>
  </div>
</div>
<script>
  function setLevel(lvl) {
    document.documentElement.classList.remove('level-l1', 'level-l2', 'level-l3');
    document.documentElement.classList.add('level-' + lvl);
    localStorage.setItem('notes-level', lvl);
    const radios = document.querySelectorAll('input[name="notes-level"]');
    radios.forEach(r => {
      r.checked = (r.value === lvl);
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    const savedLevel = localStorage.getItem('notes-level') || 'l2';
    setLevel(savedLevel);
  });
</script>
${autoSaveScript(`nt-notes:${esc(id)}`)}
<script>
  // Tap-to-define word-bank pop-ups (term + plain meaning + picture).
  (function () {
    var pop = null;
    var overlay = null;
    function ensurePop() {
      if (pop) return pop;
      pop = document.createElement('div');
      pop.className = 'nt-popover';
      pop.innerHTML = '<button type="button" class="nt-pop-close" aria-label="Close">×</button>' +
        '<img alt="" /><h4></h4><p></p>';
      overlay = document.createElement('div');
      overlay.className = 'nt-popover-overlay';
      document.body.appendChild(overlay);
      document.body.appendChild(pop);
      pop.querySelector('.nt-pop-close').addEventListener('click', hidePop);
      overlay.addEventListener('click', hidePop);
      return pop;
    }
    function hidePop() { 
      if (pop) pop.classList.remove('open'); 
      if (overlay) overlay.classList.remove('active');
    }
    function showPop(btn) {
      var p = ensurePop();
      var img = p.querySelector('img');
      var src = btn.getAttribute('data-img') || '';
      if (src) { img.src = src; img.style.display = ''; img.onerror = function () { img.style.display = 'none'; }; }
      else { img.style.display = 'none'; }
      var term = btn.getAttribute('data-term') || '';
      var termEs = btn.getAttribute('data-term-es') || '';
      var def = btn.getAttribute('data-def') || '';
      var defEs = btn.getAttribute('data-def-es') || '';
      p.querySelector('h4').innerHTML = term + (termEs ? ' <span class="es-term">/ ' + termEs + '</span>' : '');
      p.querySelector('p').innerHTML = '<span class="def-en">' + def + '</span>' + (defEs ? '<span class="def-es">' + defEs + '</span>' : '');
      p.classList.add('open');
      if (window.innerWidth <= 640) {
        if (overlay) overlay.classList.add('active');
      } else {
        if (overlay) overlay.classList.remove('active');
        var r = btn.getBoundingClientRect();
        var top = r.bottom + 8, left = r.left;
        var pw = p.offsetWidth, ph = p.offsetHeight;
        if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
        if (left < 8) left = 8;
        if (top + ph > window.innerHeight - 8) top = r.top - ph - 8;
        if (top < 8) top = 8;
        p.style.left = left + 'px';
        p.style.top = top + 'px';
      }
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-popover]') : null;
      if (btn) { e.preventDefault(); showPop(btn); return; }
      if (pop && !e.target.closest('.nt-popover')) hidePop();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hidePop(); });
    window.addEventListener('resize', hidePop);
    window.addEventListener('scroll', hidePop, { passive: true });
  })();

  // Interactive "put the steps in order" — drag, ▲▼ buttons, or keyboard.
  (function () {
    function shuffle(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    }
    function items(list) { return Array.prototype.slice.call(list.children); }
    function clearMarks(list) {
      items(list).forEach(function (li) { li.classList.remove('ss-right', 'ss-wrong'); });
    }
    function init(sorter) {
      var list = sorter.querySelector('.ss-list');
      var order = shuffle(items(list));
      // Avoid starting already-solved.
      var solved = order.every(function (li, i) { return +li.getAttribute('data-correct') === i; });
      if (solved && order.length > 1) { order.push(order.shift()); }
      order.forEach(function (li) { list.appendChild(li); });

      var dragEl = null;
      list.addEventListener('dragstart', function (e) {
        dragEl = e.target.closest('.ss-item');
        if (dragEl) dragEl.classList.add('ss-dragging');
      });
      list.addEventListener('dragend', function () {
        if (dragEl) dragEl.classList.remove('ss-dragging');
        items(list).forEach(function (li) { li.classList.remove('ss-over'); });
        dragEl = null;
      });
      list.addEventListener('dragover', function (e) {
        e.preventDefault();
        var over = e.target.closest('.ss-item');
        if (!over || over === dragEl) return;
        items(list).forEach(function (li) { li.classList.remove('ss-over'); });
        over.classList.add('ss-over');
        var r = over.getBoundingClientRect();
        var after = (e.clientY - r.top) > r.height / 2;
        list.insertBefore(dragEl, after ? over.nextSibling : over);
      });
      list.addEventListener('click', function (e) {
        var li = e.target.closest('.ss-item'); if (!li) return;
        if (e.target.classList.contains('ss-up') && li.previousElementSibling) {
          list.insertBefore(li, li.previousElementSibling); clearMarks(list); li.focus();
        } else if (e.target.classList.contains('ss-down') && li.nextElementSibling) {
          list.insertBefore(li.nextElementSibling, li); clearMarks(list); li.focus();
        }
      });

      var fb = sorter.querySelector('.ss-feedback');
      sorter.querySelector('.ss-check').addEventListener('click', function () {
        var ok = true;
        items(list).forEach(function (li, i) {
          var right = +li.getAttribute('data-correct') === i;
          li.classList.toggle('ss-right', right);
          li.classList.toggle('ss-wrong', !right);
          if (!right) ok = false;
        });
        fb.textContent = ok ? '✅ Perfect — that is the right order!' : '❌ Not yet — move the red cards and check again.';
        fb.className = 'ss-feedback ' + (ok ? 'ok' : 'no');
      });
      sorter.querySelector('.ss-shuffle').addEventListener('click', function () {
        clearMarks(list);
        shuffle(items(list)).forEach(function (li) { list.appendChild(li); });
        fb.textContent = ''; fb.className = 'ss-feedback';
      });
    }
    document.addEventListener('DOMContentLoaded', function () {
      var sorters = document.querySelectorAll('[data-step-sorter]');
      for (var i = 0; i < sorters.length; i++) init(sorters[i]);
    });
  })();

  // Tap-to-pair vocabulary match-up.
  (function () {
    function shuffleChildren(col) {
      var nodes = Array.prototype.slice.call(col.children);
      for (var i = nodes.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        col.insertBefore(nodes[j], nodes[i]);
        var t = nodes[i]; nodes[i] = nodes[j]; nodes[j] = t;
      }
    }
    function init(mu) {
      var cols = mu.querySelectorAll('.mu-col');
      if (cols.length === 2) shuffleChildren(cols[1]);
      var fb = mu.querySelector('.mu-feedback');
      var total = mu.querySelectorAll('.mu-term').length;
      var done = 0, selTerm = null;
      function clearSel() {
        var s = mu.querySelectorAll('.sel');
        for (var i = 0; i < s.length; i++) s[i].classList.remove('sel', 'miss');
      }
      mu.addEventListener('click', function (e) {
        var term = e.target.closest('.mu-term');
        var def = e.target.closest('.mu-def');
        if (term && !term.classList.contains('done')) {
          clearSel(); selTerm = term; term.classList.add('sel'); return;
        }
        if (def && !def.classList.contains('done') && selTerm) {
          if (def.getAttribute('data-mu') === selTerm.getAttribute('data-mu')) {
            def.classList.add('done'); selTerm.classList.add('done');
            selTerm.classList.remove('sel'); selTerm = null; done++;
            if (done === total) { fb.textContent = '✅ All matched — great job!'; fb.className = 'mu-feedback ok'; }
          } else {
            def.classList.add('miss');
            var bad = selTerm;
            setTimeout(function () {
              def.classList.remove('miss'); if (bad) bad.classList.remove('sel', 'miss');
            }, 600);
            selTerm = null;
          }
        }
      });
    }
    document.addEventListener('DOMContentLoaded', function () {
      var mus = document.querySelectorAll('[data-match-up]');
      for (var i = 0; i < mus.length; i++) init(mus[i]);
    });
  })();
</script>
<main class="sheet">
  ${teacher ? `<div class="teacher-banner">👩‍🏫 Teacher Copy — includes the Answer Key &amp; Teacher Guide. Do not distribute to students.</div>` : ""}
  <header class="packet">
    <p class="eyebrow">${[unit, standard].filter(Boolean).join(" · ")}</p>
    <h1>${esc(cfg.title)} ${flagBadge}</h1>
    <p class="meta">Lesson ${esc(id)}${teacher ? " · Teacher Copy" : ""}</p>
    <div class="name-line">
      <label class="nl-field"><span class="nl-label">Name:</span><input class="nl-input" type="text" data-nt-field placeholder="Type your name" aria-label="Your name" /></label>
      <label class="nl-field"><span class="nl-label">Date:</span><input class="nl-input" type="text" data-nt-field placeholder="Today's date" aria-label="Date" /></label>
      <label class="nl-field"><span class="nl-label">Class:</span><input class="nl-input" type="text" data-nt-field placeholder="Class period" aria-label="Class" /></label>
    </div>
  </header>
  ${missionBanner(cfg)}
  ${notesSection(cfg, worked, gn.html)}
  ${teacher ? answerKeySection({}, cfg.reflect, cfg, null, new Set(), gn.keyRows) : ""}
  <footer class="packet">Neft Teacher · Grade 6 Math · Lesson ${esc(id)}${standard ? " · " + standard : ""}${teacher ? " · Teacher Copy" : ""}</footer>
</main>
</body>
</html>`;
}

// Standalone "Learn It" teaching page — a focused, publisher-style explanation
// of the lesson's concept (definition → key idea → worked "Watch" example →
// We-do → You-do), built from the lesson's authored `launch.conceptIntro`.
// Surfaced as the "📖 Learn It" sidebar tab in the interactive lesson so
// students get a real, step-by-step explanation BEFORE practice. Non-graded,
// no save/resume coupling — it is pure instruction.
function buildLearnPage(id, cfg, isFlagship) {
  const standard = cfg.standard ? `Standard ${esc(cfg.standard)}` : "";
  const standardPlain = cfg.standard ? `Standard ${cfg.standard}` : "";
  const unit = cfg.unit != null ? `Unit ${esc(cfg.unit)}` : "";
  const flagBadge = isFlagship ? `<span class="flagship-badge">Flagship</span>` : "";

  const learnBlock = conceptLearnBlock(cfg, { expanded: true });
  // Themed real-world hook — reuse the Launch narrative so the Learn It page
  // opens with WHY this math matters, in the lesson's own story world.
  const narrative = (cfg.launch && cfg.launch.narrative) || cfg.narrative || "";
  const hookCard = narrative
    ? `<div class="li-hook">
    <span class="li-hook-emoji" aria-hidden="true">${esc(cfg.themeEmoji || "🧠")}</span>
    <div>
      <p class="li-hook-label">Why we're learning this</p>
      <p class="li-hook-text">${esc(narrative)}</p>
    </div>
  </div>`
    : "";
  const objectivesIntro = [
    cfg.contentObjective
      ? `<p class="learnit-intro"><strong>Content Objective:</strong> ${esc(cfg.contentObjective)}</p>`
      : "",
    cfg.languageObjective
      ? `<p class="learnit-intro"><strong>Language Objective:</strong> ${esc(cfg.languageObjective)}</p>`
      : "",
  ].join("");
  const body =
    learnBlock ||
    `<div class="learnit"><p class="learnit-eyebrow">📖 Learn It</p>
      <h3 class="learnit-head">${esc(cfg.title || "Today's math")}</h3>
      ${objectivesIntro}
      <p class="learnit-bridge">Your teacher will walk through how to solve this together.</p>
    </div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(cfg.title)} — Learn It</title>
${styles(`${cfg.title}${standardPlain ? " · " + standardPlain : ""}`)}
<style>
${EMBED_CSS}
  .learn-intro-note{display:flex;gap:12px;align-items:flex-start;background:var(--teal-light);
    border:1px solid var(--teal);border-radius:10px;padding:12px 14px;margin:0 0 16px;}
  .learn-intro-note .lin-icon{font-size:22px;line-height:1;flex:0 0 auto;}
  .learn-intro-note p{margin:0;font-size:14.5px;color:var(--navy);font-weight:600;}
  .learn-listen{margin:0 0 18px;}
  .li-listen-btn{background:var(--teal-ink);color:#fff;border:0;border-radius:999px;padding:11px 20px;font-weight:800;font-size:15px;cursor:pointer;}
  .li-listen-btn:hover{background:var(--navy);}
  .learn-actions{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px;}
  .li-workbench-btn{display:inline-flex;align-items:center;gap:8px;text-decoration:none;
    background:linear-gradient(135deg,#4f46e5,#0e8a7d);color:#fff;border:0;border-radius:999px;
    padding:11px 20px;font-weight:800;font-size:15px;cursor:pointer;}
  .li-workbench-btn:hover{filter:brightness(1.08);}
  .li-reading{background:#fff3cd;box-shadow:0 0 0 3px #fff3cd, 0 0 0 5px var(--amber);border-radius:6px;}
  /* Real-world hook — a themed "why we're learning this" story card that ties
     the Learn It page to the lesson's Launch narrative. */
  .li-hook{display:flex;gap:14px;align-items:flex-start;background:linear-gradient(135deg,var(--navy),#1b4a7a);
    color:#fff;border-radius:14px;padding:16px 20px;margin:0 0 18px;box-shadow:0 6px 18px rgba(18,53,91,.14);}
  .li-hook-emoji{font-size:34px;line-height:1;flex:0 0 auto;}
  .li-hook-label{margin:0 0 4px;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--amber);}
  .li-hook-text{margin:0;font-size:15.5px;line-height:1.55;}
  /* Learning-journey map — a "you are here" roadmap of the gradual release. */
  .li-journey{display:flex;flex-wrap:wrap;align-items:stretch;gap:6px;margin:0 0 22px;}
  .li-jstep{display:flex;align-items:center;gap:8px;text-decoration:none;background:#fff;border:1.5px solid var(--line);
    border-radius:999px;padding:7px 14px 7px 8px;color:var(--navy);font-weight:700;font-size:13.5px;transition:transform .12s,border-color .12s,box-shadow .12s;}
  .li-jstep:hover{transform:translateY(-1px);border-color:var(--teal);box-shadow:0 4px 12px rgba(18,53,91,.10);}
  .li-jnum{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;
    background:var(--navy);color:#fff;font-size:13px;font-weight:800;flex:0 0 auto;}
  .li-jstep-see .li-jnum{background:var(--teal);}
  .li-jstep-watch .li-jnum{background:var(--teal-ink);}
  .li-jstep-together .li-jnum{background:#c98a10;}
  .li-jstep-own .li-jnum{background:var(--navy);}
  .li-jico{font-size:15px;}
  .li-jarrow{align-self:center;color:var(--muted);font-weight:800;font-size:15px;}
  @media (max-width:560px){.li-jlabel{display:none;}.li-jarrow{display:none;}.li-jstep{padding:7px;}}
  /* Numbered gradual-release stage cards — each rung gets a colored left rail,
     an auto-numbered badge, an icon and a plain-language subtitle. */
  .li{counter-reset:li-stage;}
  .li-stage{position:relative;border:1px solid var(--line);border-left-width:5px;border-radius:14px;
    padding:18px 20px 18px 22px;margin:0 0 18px;counter-increment:li-stage;background:#fff;}
  .li-stage>.li-eyebrow{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;border-bottom:0;padding:2px 0 4px 46px;position:relative;
    color:var(--navy);font-size:16px;letter-spacing:.01em;text-transform:none;min-height:34px;}
  .li-stage>.li-eyebrow::before{content:counter(li-stage);position:absolute;left:0;top:0;width:34px;height:34px;border-radius:50%;
    background:var(--navy);color:#fff;font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center;}
  .li-stage-ico{font-size:19px;flex:0 0 auto;}
  .li-stage-label{font-weight:800;white-space:nowrap;}
  .li-stage-sub{flex-basis:100%;padding-left:0;margin:1px 0 0;font-size:12.5px;font-weight:600;color:var(--muted);text-transform:none;letter-spacing:0;}
  .li-stage-see{border-left-color:var(--teal);}
  .li-stage-see>.li-eyebrow::before{background:var(--teal);}
  .li-stage-watch{border-left-color:var(--teal-ink);}
  .li-stage-watch>.li-eyebrow::before{background:var(--teal-ink);}
  .li-stage-together{border-left-color:var(--amber);background:#fffdf7;}
  .li-stage-together>.li-eyebrow::before{background:#c98a10;}
  .li-stage-own{border-left-color:var(--navy);}
  .li-stage-own>.li-eyebrow::before{background:var(--navy);}
  .li-stage-apply{border-left-color:#6b4fd6;}
  .li-stage-apply>.li-eyebrow::before{background:#6b4fd6;}
  .li-jstep-apply .li-jnum{background:#6b4fd6;}
  .li-stage-talk{border-left-color:var(--teal);background:#fbfdfc;}
  .li-stage-talk>.li-eyebrow::before{background:var(--teal);}
  .li-jstep-talk .li-jnum{background:var(--teal);}
  /* Turn & Talk sentence starters + word bank */
  .li-stems-label{margin:2px 0 6px;font-size:13px;font-weight:700;color:var(--navy);}
  .li-stems{margin:0 0 14px;padding-left:22px;}
  .li-stems>li{font-size:16px;line-height:1.6;margin:0 0 8px;color:var(--ink);}
  .li-stem-es{display:block;font-size:13.5px;color:var(--muted);font-style:italic;}
  .li-wordbank{display:flex;flex-wrap:wrap;align-items:center;gap:8px;background:#f0faf8;
    border:1px dashed var(--teal);border-radius:10px;padding:10px 12px;}
  .li-wordbank-label{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--teal-ink);}
  .li-word{background:#fff;border:1.5px solid var(--teal);color:var(--navy);border-radius:999px;padding:4px 12px;font-weight:700;font-size:14px;}
  /* Confidence check + send-off */
  .li-ready-card{background:var(--teal-light);border:1.5px solid var(--teal);border-radius:14px;padding:18px 20px;margin:6px 0 0;}
  .li-ready-head{margin:0 0 10px;font-size:18px;font-weight:800;color:var(--navy);}
  .li-ready-check{display:flex;align-items:center;gap:10px;font-size:15.5px;font-weight:700;color:var(--navy);cursor:pointer;margin:0 0 8px;}
  .li-ready-check input{width:20px;height:20px;accent-color:var(--teal-ink);flex:0 0 auto;cursor:pointer;}
  .li-ready-note{margin:0;font-size:14.5px;line-height:1.55;color:var(--ink);}
  @media print{
    .li-hook{background:#fff;color:#000;border:1px solid #000;box-shadow:none;}
    .li-hook-label{color:#000;}
    .li-journey{display:none;}
    .li-stage{border-color:#000;border-left-color:#000;background:#fff;page-break-inside:avoid;}
    .li-stage-together,.li-stage-talk{background:#fff;}
    .li-wordbank{background:#fff;border:1px dashed #000;}
    .li-word{background:#fff;color:#000;border:1px solid #000;}
    .li-stems-label{color:#000;}
    .li-stage>.li-eyebrow::before,.li-jnum{background:#000;}
    .li-ready-card{background:#fff;border-color:#000;}
    .li-ready-head,.li-ready-check{color:#000;}
  }
</style>
<script>
  if(/[?&]embed=1(?:&|$)/.test(location.search)){document.documentElement.classList.add("nt-embed");}
</script>
${autoSaveScript(`nt-learn:${esc(id)}`)}
${popoverScript()}
${readAloudScript()}
</head>
<body>
<div class="topbar no-print">
  <span class="brand">Neft Teacher · Learn It</span>
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <button class="nt-clear no-print" type="button" id="nt-clear-btn">Clear my work</button>
    <button class="print-btn" type="button" onclick="window.print()">Print / Save as PDF</button>
  </div>
</div>
<main class="sheet">
  <header class="packet">
    <p class="eyebrow">${[unit, standard].filter(Boolean).join(" · ")}</p>
    <h1>${esc(cfg.title)} ${flagBadge}</h1>
    <p class="meta">Lesson ${esc(id)} · Learn It — how the math works</p>
  </header>
  <div class="learn-intro-note">
    <span class="lin-icon" aria-hidden="true">🧭</span>
    <p>Read this first. It explains what we are learning and shows you exactly how to solve it — step by step. Then head to the lesson activities and practice.</p>
  </div>
  ${hookCard}
  <div class="learn-actions no-print">
    <button type="button" id="li-listen" class="li-listen-btn">🔊 Listen to this page</button>
    <a class="li-workbench-btn" href="/curriculum/math-workbench/" target="_blank" rel="noopener" title="Open the Math Workbench scratch space in a new tab">✱ Math Workbench</a>
  </div>
  ${body}
  <footer class="packet">Neft Teacher · Grade 6 Math · Lesson ${esc(id)}${standard ? " · " + standard : ""}</footer>
</main>
</body>
</html>`;
}

// Standalone "Vocab" page — word + plain-language (ESOL) meaning + picture for
// every key term, shown BEFORE activities. Surfaced as the Vocab sidebar tab.
// Locked to the Level 1 view so the definition is always visible (a reference,
// not a fill-in); the leveled write-your-own practice lives in the Notes packet.
// The interactive "Vocab Explorer" body: the single home for vocabulary. Moves
// from receptive to productive (WIDA-aligned): Word Wall (picture + word +
// say-it audio + plain meaning) → Match (word ↔ meaning) → Fill-in (cloze in a
// real sentence) → Use it (productive sentence). All authored from the lesson's
// single source of truth, config.vocabulary [{term, definition, image, cloze}].
function vocabExplorer(cfg = {}) {
  const items = (Array.isArray(cfg.vocabulary) ? cfg.vocabulary : []).filter((v) => v && v.term);
  if (!items.length)
    return `<p class="level-note">No vocabulary is listed for this lesson yet.</p>`;

  // ① Word Wall — receptive (picture + word + say-it + plain meaning), with the
  // lesson's authored translations (Spanish / Vietnamese / Arabic) so multilingual
  // learners get a first-language anchor for every term.
  const wall = items
    .map((v) => {
      const imgSrc = resolveVocabImage(v.term, v.image).replace(/^\//, "../../");
      const say = esc(`${v.term}. ${v.definition || ""}`);
      const langs = [];
      if (v.termEs) langs.push(`<span class="vx-lang" lang="es"><b>ES</b> ${esc(v.termEs)}</span>`);
      if (v.termVi) langs.push(`<span class="vx-lang" lang="vi"><b>VI</b> ${esc(v.termVi)}</span>`);
      if (v.termAr)
        langs.push(`<span class="vx-lang" lang="ar" dir="rtl"><b>AR</b> ${esc(v.termAr)}</span>`);
      const transLine = langs.length
        ? `<p class="vx-langs">${langs.join('<span class="vx-langsep">·</span>')}</p>`
        : "";
      const defEs = v.definitionEs
        ? `<p class="vx-def-es" lang="es">${esc(v.definitionEs)}</p>`
        : "";
      return `<div class="vx-card">
        <div class="vx-figure"><img src="${esc(imgSrc)}" alt="${esc(vocabImageAlt(v.term, v.definition))}" onerror="this.style.display='none'" /></div>
        <div class="vx-termline"><span class="vx-term">${esc(v.term)}</span>
          <button type="button" class="vx-say" data-say="${say}" aria-label="Hear ${esc(v.term)} read aloud">🔊</button></div>
        ${transLine}
        <p class="vx-def">${esc(v.definition || "")}</p>
        ${defEs}
      </div>`;
    })
    .join("");

  // ② Match — word ↔ meaning (tap a word, then tap its meaning).
  const matchItems = items.filter((v) => v.definition).slice(0, 6);
  const match =
    matchItems.length >= 2
      ? `<div class="vx-match" data-vx-match>
        <div class="vx-mcols">
          <div class="vx-mcol">${matchItems.map((v, i) => `<button type="button" class="vx-mterm" data-vx="${i}">${esc(v.term)}</button>`).join("")}</div>
          <div class="vx-mcol">${matchItems.map((v, i) => `<button type="button" class="vx-mdef" data-vx="${i}">${esc(v.definition)}</button>`).join("")}</div>
        </div>
        <p class="vx-mfeedback" role="status" aria-live="polite"></p>
      </div>`
      : "";

  // ③ Fill-in — cloze in a real sentence (controlled production).
  const clozeItems = items.filter((v) => v.cloze && /_{2,}/.test(v.cloze));
  const cloze = clozeItems.length
    ? `<div class="vx-bank"><span class="vx-bank-label">Word bank</span><div class="vx-bankwords">${items
        .map((v) => `<span class="vx-bankword">${esc(v.term)}</span>`)
        .join("")}</div></div>
      <ol class="vx-clozelist">${clozeItems
        .map(
          (v, i) =>
            `<li class="vx-clozeline"><span class="vx-num">${i + 1}</span><span class="vx-clozetext">${esc(
              v.cloze,
            ).replace(
              /_{2,}/g,
              `<input class="vx-blank" type="text" data-nt-field aria-label="fill in the blank" />`,
            )}</span></li>`,
        )
        .join("")}</ol>`
    : "";

  // ④ Use it — productive sentence with a frame.
  const use = `<p class="vx-lead">Pick one word and finish the sentence in your own words.</p>
      <p class="vx-stem">A <input class="vx-blank vx-blank-word" type="text" data-nt-field placeholder="word" /> is <input class="vx-blank vx-blank-wide" type="text" data-nt-field placeholder="what it means or an example" />.</p>
      <textarea class="vx-area" rows="2" data-nt-field placeholder="Now write your own sentence using one of the words…"></textarea>`;

  return `<div class="vx">
    <section class="vx-section">
      <p class="vx-eyebrow">① Word Wall</p>
      <p class="vx-lead">Look at the picture, read the meaning, and tap 🔊 to hear each word.</p>
      <div class="vx-wall">${wall}</div>
    </section>
    ${match ? `<section class="vx-section"><p class="vx-eyebrow">② Match it</p><p class="vx-lead">Tap a word, then tap its meaning.</p>${match}</section>` : ""}
    ${cloze ? `<section class="vx-section"><p class="vx-eyebrow">③ Fill in the blank</p><p class="vx-lead">Use the word bank to finish each sentence.</p>${cloze}</section>` : ""}
    <section class="vx-section"><p class="vx-eyebrow">④ Use it in a sentence</p>${use}</section>
  </div>`;
}

// Self-contained JS for the Vocab Explorer: say-it audio (Web Speech) and the
// tap-to-match game. Auto-save of the typed answers is added separately.
function vocabExplorerScripts() {
  return `<script>
  (function(){
    // Say-it audio.
    document.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('.vx-say') : null; if(!b) return;
      var t = b.getAttribute('data-say') || ''; if(!t || !window.speechSynthesis) return;
      try { window.speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.rate = 0.85; u.lang = 'en-US'; window.speechSynthesis.speak(u); } catch(_){}
    });
    // Tap-to-match game.
    function shuffleCol(col){ if(!col) return; var n = [].slice.call(col.children); for(var i=n.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); col.insertBefore(n[j], n[i]); } }
    function initMatch(root){
      var fb = root.querySelector('.vx-mfeedback');
      var total = root.querySelectorAll('.vx-mterm').length, done = 0, sel = null;
      shuffleCol(root.querySelectorAll('.vx-mcol')[1]);
      root.addEventListener('click', function(e){
        var term = e.target.closest('.vx-mterm'), def = e.target.closest('.vx-mdef');
        if(term && !term.classList.contains('vx-done')){
          var s = root.querySelectorAll('.vx-sel'); for(var i=0;i<s.length;i++) s[i].classList.remove('vx-sel');
          sel = term; term.classList.add('vx-sel'); return;
        }
        if(def && sel && !def.classList.contains('vx-done')){
          if(def.getAttribute('data-vx') === sel.getAttribute('data-vx')){
            def.classList.add('vx-done'); sel.classList.add('vx-done'); sel.classList.remove('vx-sel'); sel = null; done++;
            if(done === total && fb){ fb.textContent = '✅ All matched — great job!'; fb.className = 'vx-mfeedback vx-ok'; }
          } else {
            def.classList.add('vx-wrong'); var bad = def, badSel = sel;
            setTimeout(function(){ bad.classList.remove('vx-wrong'); if(badSel) badSel.classList.remove('vx-sel'); }, 600); sel = null;
          }
        }
      });
    }
    document.addEventListener('DOMContentLoaded', function(){
      var m = document.querySelectorAll('[data-vx-match]'); for(var i=0;i<m.length;i++) initMatch(m[i]);
    });
  })();
</script>`;
}

function buildVocabPage(id, cfg, isFlagship) {
  const standard = cfg.standard ? `Standard ${esc(cfg.standard)}` : "";
  const standardPlain = cfg.standard ? `Standard ${cfg.standard}` : "";
  const unit = cfg.unit != null ? `Unit ${esc(cfg.unit)}` : "";
  const flagBadge = isFlagship ? `<span class="flagship-badge">Flagship</span>` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(cfg.title)} — Vocab Explorer</title>
${styles(`${cfg.title}${standardPlain ? " · " + standardPlain : ""}`)}
<style>
${EMBED_CSS}
</style>
<script>
  if(/[?&]embed=1(?:&|$)/.test(location.search)){document.documentElement.classList.add("nt-embed");}
</script>
${autoSaveScript(`nt-vocab:${esc(id)}`)}
${vocabExplorerScripts()}
</head>
<body>
<div class="topbar no-print">
  <span class="brand">Neft Teacher · Vocab Explorer</span>
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <button class="nt-clear no-print" type="button" id="nt-clear-btn">Clear my work</button>
    <button class="print-btn" type="button" onclick="window.print()">Print / Save as PDF</button>
  </div>
</div>
<main class="sheet">
  <header class="packet">
    <p class="eyebrow">${[unit, standard].filter(Boolean).join(" · ")}</p>
    <h1>🔑 ${esc(cfg.title)} — Vocab Explorer ${flagBadge}</h1>
    <p class="meta">Lesson ${esc(id)} · Learn the words, then practice them</p>
  </header>
  ${vocabExplorer(cfg)}
  <footer class="packet">Neft Teacher · Grade 6 Math · Lesson ${esc(id)}${standard ? " · " + standard : ""}</footer>
</main>
</body>
</html>`;
}

function buildIndex(lessons) {
  const flagshipTotal = lessons.filter((l) => l.isFlagship).length;
  const coreTotal = lessons.length - flagshipTotal;
  const byUnit = new Map();
  for (const { id, cfg, isFlagship } of lessons) {
    const u = cfg.unit ?? id.split("-")[0];
    if (!byUnit.has(u)) byUnit.set(u, []);
    byUnit.get(u).push({ id, cfg, isFlagship });
  }
  const units = [...byUnit.keys()].sort((a, b) => Number(a) - Number(b));
  const groups = units
    .map((u) => {
      const items = byUnit
        .get(u)
        .map(
          ({ id, cfg, isFlagship }) =>
            `<li><a href="/lessons/${id}/notes.html">${esc(id)} — ${esc(cfg.title)}</a>${
              isFlagship
                ? ` <span class="tag tag-flagship">Flagship</span>`
                : ` <span class="tag tag-core">Core</span>`
            }${
              cfg.standard ? ` <span class="std">${esc(cfg.standard)}</span>` : ""
            } <a class="teacher-link" href="/lessons/${id}/notes-teacher.html">Teacher copy (Answer Key)</a></li>`,
        )
        .join("");
      return `<section class="unit-group">
  <h2>Unit ${esc(u)}</h2>
  <ul>${items}</ul>
</section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Notes Packets — Index</title>
<style>
body{margin:0;background:#f7f4ec;color:#21313f;font-family:Calibri,"Segoe UI",system-ui,sans-serif;}
.wrap{max-width:820px;margin:0 auto;padding:32px 20px;}
h1{font-family:Outfit,system-ui,sans-serif;color:#12355b;}
.unit-group{background:#fff;border:1px solid #d7e2ed;border-radius:12px;padding:16px 20px;margin:0 0 16px;}
.unit-group h2{color:#1fa6a2;margin:0 0 10px;font-family:Outfit,system-ui,sans-serif;}
.unit-group ul{list-style:none;margin:0;padding:0;}
.unit-group li{padding:6px 0;border-bottom:1px solid #eef3f8;}
.teacher-link{margin-left:8px;font-size:12px;font-weight:700;color:#7a5b00;background:#fff3cd;border:1px solid #e0a800;border-radius:999px;padding:2px 10px;text-decoration:none;}
.unit-group li:last-child{border-bottom:0;}
a{color:#12355b;text-decoration:none;font-weight:600;}
a:hover{text-decoration:underline;}
.std{color:#5f6f80;font-weight:400;font-size:13px;margin-left:6px;}
.tag{display:inline-block;font-size:11px;font-weight:700;border-radius:999px;padding:1px 8px;margin-left:6px;vertical-align:middle;}
.tag-core{background:#dff2ee;color:#1fa6a2;border:1px solid #1fa6a2;}
.tag-flagship{background:#fef0d8;color:#9a6b12;border:1px solid #f2c15b;}
.legend{color:#5f6f80;font-size:14px;margin:0 0 20px;}
.legend .tag{margin-left:0;margin-right:4px;}
</style>
</head>
<body>
<div class="wrap">
  <h1>Notes Packets</h1>
  <p>Printable, leveled guided-notes sheets for all ${lessons.length} Grade 6 math lessons (${coreTotal} core + ${flagshipTotal} flagship). Each sheet includes a <strong>Key Vocabulary — Level 1 support</strong> section (visual-first), a <strong>Write About the Math</strong> writing block built on <em>The Writing Revolution</em> (kernel sentences, sentence expansion, sentence types, and reasoning stems), and a <strong>Level 2 enrichment</strong> stretch challenge. Every packet downloads as <strong>HTML, PDF, or Word (DOCX)</strong> and prints with a branded header, footer, page numbers, and answer key.</p>
  <p class="legend"><span class="tag tag-core">Core</span> standard lesson &nbsp; <span class="tag tag-flagship">Flagship</span> mission-based lesson</p>
  ${groups}
</div>
</body>
</html>`;
}

/* ---------- run ---------- */

function main() {
  const lessons = lessonConfigs();
  let count = 0;
  let flagshipCount = 0;
  for (const { id, cfg, isFlagship } of lessons) {
    // Student copy — no answer key.
    writeFileSync(join(lessonsDir, id, "notes.html"), buildPacket(id, cfg, isFlagship, false));
    // Teacher copy — same packet + Answer Key & Teacher Guide.
    writeFileSync(
      join(lessonsDir, id, "notes-teacher.html"),
      buildPacket(id, cfg, isFlagship, true),
    );
    // Standalone "Learn It" teaching page (surfaced as the 📖 Learn It tab).
    writeFileSync(join(lessonsDir, id, "learn.html"), buildLearnPage(id, cfg, isFlagship));
    // Standalone "Vocab" page (surfaced as the 🔑 Vocab tab).
    writeFileSync(join(lessonsDir, id, "vocab.html"), buildVocabPage(id, cfg, isFlagship));
    count++;
    if (isFlagship) flagshipCount++;
  }
  writeFileSync(join(lessonsDir, "notes-index.html"), buildIndex(lessons));
  console.log(
    `Generated ${count} notes packets (${count - flagshipCount} core + ${flagshipCount} flagship) + notes-index.html`,
  );
}

main();
