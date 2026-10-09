/* Accessible controls and deliberate round pacing for the curriculum cabinets. */
(function () {
  'use strict';
  const keyNames = {Enter: 'ENTER', Space: 'SPACE', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', ArrowUp: 'UP', ArrowDown: 'DOWN', '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', Backspace: 'BACKSPACE'};
  const gamepad = {
    'u1-decimal-dash': [['ArrowLeft','← Move'],['ArrowRight','Move →'],['1','Marker 1'],['2','Marker 2'],['3','Marker 3'],['Enter','Lock in']],
    'u2-fraction-frenzy': [['ArrowLeft','Fewer parts'],['ArrowRight','More parts'],['ArrowDown','Shade less'],['ArrowUp','Shade more'],['Enter','Lock in']],
    'u3-ratio-rush': [['ArrowUp','Top line'],['ArrowDown','Bottom line'],['ArrowLeft','← Move'],['ArrowRight','Move →'],['Enter','Lock in']],
    'u4-percent-power': [['ArrowLeft','−5% / previous'],['ArrowRight','+5% / next'],['Enter','Lock in']],
    'u5-area-attack': [['ArrowLeft','←'],['ArrowRight','→'],['ArrowUp','↑'],['ArrowDown','↓'],['F','Set corner'],['U','Undo'],['C','Clear'],['Enter','Lock in']],
    'u6-expression-express': [['ArrowLeft','Previous slot'],['ArrowRight','Next slot'],['ArrowUp','Previous tile'],['ArrowDown','Next tile'],['Backspace','Remove tile'],['Enter','Lock in']],
    'u7-equation-quest': [['ArrowUp','Previous operation'],['ArrowDown','Next operation'],['ArrowLeft','Amount −1 / previous'],['ArrowRight','Amount +1 / next'],['Space','Apply to both sides'],['Enter','Check solution']],
    'u8-data-dash': [['ArrowLeft','← Column'],['ArrowRight','Column →'],['ArrowUp','Add dot'],['ArrowDown','Remove dot'],['Enter','Lock in']],
    'u9-coordinate-quest': [['ArrowLeft','←'],['ArrowRight','→'],['ArrowUp','↑'],['ArrowDown','↓'],['1','Answer 1'],['2','Answer 2'],['3','Answer 3'],['4','Answer 4'],['Enter','Lock in']],
    'u10-volume-blast': [['ArrowLeft','Previous dimension'],['ArrowRight','Next dimension'],['ArrowDown','−1 unit'],['ArrowUp','+1 unit'],['Enter','Lock in']]
  };
  function announce(type, detail) {
    document.dispatchEvent(new CustomEvent('game:' + type, {detail}));
  }
  function mount(options) {
    const game = options.game;
    let root, prompt, feedback, progress, controls, nextButton, pending = null;
    let pausedScenes = [];
    let adventure, missionPaused = [];
    function scene() { return game.scene.getScenes(true)[0]; }
    function muted(value) {
      window.NT_MUTED = value;
      if (game.sound) game.sound.mute = value;
      if (options.audio && options.audio.ctx) {
        if (value) options.audio.ctx.suspend().catch(function () {});
        else options.audio.ctx.resume().catch(function () {});
      }
      if (window.GameJuice) window.GameJuice.audio.setMuted(value);
    }
    function send(key) {
      if (adventure?.open) adventure.show(false);
      const current = scene();
      if (!current || (window.GameStudio && window.GameStudio.paused)) return;
      if (pending && (key === 'Enter' || key === 'Space')) { advance(); return; }
      const event = {key, code: key, repeat: false, preventDefault() {}, stopPropagation() {}};
      current.input.keyboard.emit('keydown-' + (keyNames[key] || key), event);
      update();
    }
    function advance() {
      if (!pending || !pending.ready || (window.GameStudio && window.GameStudio.paused)) return;
      const transition = pending;
      pending = null;
      nextButton.hidden = true;
      transition.callback();
      update();
      // Canvas keeps the native arrow and number-key controls focused.
      game.canvas.focus({preventScroll: true});
    }
    function refreshControls(current) {
      const name = current.sys.settings.key;
      if (controls.dataset.scene === name) return;
      controls.dataset.scene = name;
      controls.replaceChildren();
      let actions = name === 'Game' ? gamepad[options.id] : name === 'Vocab' ? [['ArrowLeft','Back'],['Enter','Next word']] : name === 'Level' || name === 'Mode' ? [['1','Support'],['2','Challenge'],['A','Adaptive level']] : [['Enter',name === 'Result' ? 'Choose a new run' : 'Start expedition']];
      if ((name === 'Level' || name === 'Mode') && options.id === 'u10-volume-blast') actions = [['1','Build'],['2','Find volume'],['3','Missing dimension'],['A','Adaptive level']];
      actions.forEach(([key, label]) => {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = label; button.setAttribute('aria-label', label + ' (' + key + ')');
        button.addEventListener('click', () => send(key)); controls.append(button);
      });
    }
    function update() {
      const current = scene();
      if (!root || !current) return;
      if (adventure && !current.cabinetWorldReady && current.children.list.length) {
        adventure.decorate(current); current.cabinetWorldReady = true;
      }
      if (adventure && current.sys.settings.key === 'Game') adventure.observeSolved(current.solved);
      refreshControls(current);
      const field = current.bannerText || current.promptText || current.targetText;
      const problem = current.problem;
      const text = current.sys.settings.key === 'Vocab' ? [current.termText && current.termText.text, current.defText && current.defText.text].filter(Boolean).join(': ') : (field && field.text) || (problem && (problem.prompt || problem.instruction)) || '';
      const hint = current.hintText && current.hintText.text;
      prompt.textContent = [text, hint].filter(Boolean).join(' · ') || options.instructions[0];
      const value = current.feedback && current.feedback.text;
      feedback.textContent = value || '';
      const readout = current.readout && current.readout.text;
      const solved = current.solved || 0;
      const streak = window.GameStudio?.session?.streak || 0;
      progress.textContent = current.sys.settings.key === 'Game' ? 'Solved ' + solved + (Number.isFinite(current.target) ? ' / ' + current.target : '') + ' · Score ' + (current.score || 0) + (streak > 1 ? ' · Streak ' + streak : '') + (readout ? ' · ' + readout : '') : 'Take your time. Your expedition is self paced.';
      const texts = current.children.list.filter(obj => obj.type === 'Text' && obj.visible && obj.alpha > 0).map(obj => obj.text);
      root.querySelector('.cabinet-screen-text').textContent = [...new Set(texts)].join('\n');
    }
    if (window.GameJuice) {
      ['burst','confetti','shake','floatText','popIn','tilePop'].forEach(name => {
        const original = window.GameJuice[name];
        if (typeof original === 'function') window.GameJuice[name] = function () {
          if (window.GameStudio && window.GameStudio.settings.reducedMotion) return;
          return original.apply(this, arguments);
        };
      });
    }
    const proto = options.GameScene.prototype;
    // Retain explanations until the learner chooses to continue.
    proto.studioNextRound = function (callback) {
      pending = {callback, ready: false};
      update();
      if (nextButton) { nextButton.hidden = false; nextButton.disabled = true; }
      this.time.delayedCall(600, () => {
        if (!pending) return;
        pending.ready = true;
        if (nextButton) {
          nextButton.disabled = false;
          // On a 768px Chromebook the console sits below the canvas; keep the way forward visible.
          const r = nextButton.getBoundingClientRect();
          if (r.bottom > innerHeight || r.top < 0) nextButton.scrollIntoView({block: 'nearest'});
        }
      });
    };
    const originalInit = proto.init;
    proto.init = function () { pending = null; this.studioEnded = false; this.cabinetWorldReady = false; if (adventure) adventure.resetCounter(); const result = originalInit.apply(this, arguments); if (window.GameStudio) this.reduceMotion = window.GameStudio.settings.reducedMotion; return result; };
    const originalHUD = proto.updateHUD;
    if (originalHUD) proto.updateHUD = function () {
      if (adventure) adventure.observeSolved(this.solved);
      return originalHUD.apply(this, arguments);
    };
    const originalEnd = proto.endGame;
    proto.endGame = function () {
      if (this.studioEnded) return;
      this.studioEnded = true; pending = null; if (adventure) adventure.observeSolved(this.solved);
      if (nextButton) nextButton.hidden = true;
      return originalEnd.apply(this, arguments);
    };
    const originalProblem = proto.newProblem;
    proto.newProblem = function () { const result = originalProblem.apply(this, arguments); update(); return result; };
    const originalLock = proto.lockIn;
    proto.lockIn = function () {
      if (window.GameStudio && window.GameStudio.paused) return;
      const solved = this.solved, score = this.score;
      const result = originalLock.apply(this, arguments);
      update();
      const message = this.feedback && this.feedback.text;
      if (message && (this.solved !== solved || this.score !== score || /not|try|hint|still|first|gap|wrong|need/i.test(message))) announce('feedback', {correct: this.solved > solved || this.score > score, message});
      return result;
    };
    const resultInit = options.ResultScene.prototype.init;
    options.ResultScene.prototype.init = function (data) {
      resultInit.apply(this, arguments);
      const accuracy = Number.isFinite(data.accuracy) ? data.accuracy : data.attempted ? data.firstTry / data.attempted : 0;
      announce('complete', {score: data.score, correct: data.solved, total: data.target, accuracy: Math.round(accuracy * 100), message: 'Expedition complete. ' + data.solved + ' solved. Score ' + data.score + '.'});
    };
    window.ewlSetLevel = function (level) {
      if (window.GameStudio?.paused) window.GameStudio.resume();
      if (adventure?.open) adventure.show(false);
      options.setLevel(level);
    };
    window.addEventListener('keydown', event => {
      if (!event.target.closest || !(keyNames[event.key] || /^[1-4FWASDUC]$/i.test(event.key))) return;
      if (event.target !== game.canvas || adventure?.open) event.stopPropagation();
    }, true);
    function ready() {
      const canvas = game.canvas;
      if (!canvas) return;
      const host = document.createElement('div'); host.className = 'cabinet-viewport';
      const toolbar = document.querySelector('.studio-toolbar');
      if (toolbar) toolbar.after(host); else document.body.prepend(host);
      host.append(canvas);
      adventure = window.CabinetAdventure?.create({id: options.id, host, onView(open) {
        if (open) {
          missionPaused = game.scene.getScenes(true).map(s => s.sys.settings.key);
          missionPaused.forEach(key => game.scene.pause(key));
        } else {
          if (!(window.GameStudio && window.GameStudio.paused)) missionPaused.forEach(key => game.scene.resume(key));
          missionPaused = [];
        }
      }});
      window.__cabinetAdventure = adventure;
      canvas.addEventListener('pointerdown', () => canvas.focus({preventScroll:true}));
      game.scale.parent = host;
      game.scale.parentIsWindow = false;
      function resize() {
        host.style.height = Math.round(host.clientWidth * game.config.height / game.config.width) + 'px';
        game.scale.refresh();
      }
      new ResizeObserver(resize).observe(host); resize();
      canvas.setAttribute('tabindex', '0'); canvas.setAttribute('aria-label', document.title + '. Use arrow keys and Enter, or the control buttons below.');
      root = document.createElement('section'); root.className = 'cabinet-console'; root.setAttribute('aria-label','Expedition controls');
      root.innerHTML = '<p class="cabinet-prompt"></p><p class="cabinet-progress"></p><p class="cabinet-feedback" role="status" aria-live="polite"></p><div class="cabinet-controls"></div><button type="button" class="cabinet-next" hidden>Continue expedition →</button><details><summary>Read the game screen</summary><pre class="cabinet-screen-text"></pre></details>';
      host.after(root);
      prompt = root.querySelector('.cabinet-prompt'); feedback = root.querySelector('.cabinet-feedback'); progress = root.querySelector('.cabinet-progress'); controls = root.querySelector('.cabinet-controls'); nextButton = root.querySelector('.cabinet-next');
      nextButton.addEventListener('click', advance);
      canvas.addEventListener('keydown', (event) => {
        if (pending && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.stopImmediatePropagation(); advance(); }
      }, true);
      const header = document.createElement('div'); header.className = 'cabinet-levels';
      header.innerHTML = '<span>Changing level starts a new run.</span><button type="button" data-level="1">Support</button><button type="button" data-level="2">Challenge</button>';
      root.append(header);
      header.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { window.ewlSetLevel(Number(button.dataset.level)); update(); }));
      window.GameStudio && window.GameStudio.register({title: document.title.split('—')[0].trim(), instructions: options.instructions, setMuted: muted,
        pause() { pausedScenes = game.scene.getScenes(true).map(s => s.sys.settings.key); pausedScenes.forEach(key => game.scene.pause(key)); },
        resume() { pausedScenes.forEach(key => game.scene.resume(key)); pausedScenes = []; },
        setMotion(value) { game.scene.getScenes(false).forEach(s => { s.reduceMotion = value; }); }
      });
      game.events.on('step', () => { if (game.loop.frame % 20 === 0) update(); });
      update();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true}); else ready();
    return {update,send};
  }
  window.PhaserStudio = {mount};
})();
