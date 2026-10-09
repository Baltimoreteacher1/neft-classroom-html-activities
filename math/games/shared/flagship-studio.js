/* Native mission controls for the existing Phaser and DOM flagship engines. */
(() => {
  'use strict';
  try { sessionStorage.setItem('gfx-brief:'+location.pathname,'1'); } catch (_) {}
  document.querySelector('#gfx-mission-brief')?.remove();
  const game = window.__flagshipGame;
  const slug = location.pathname.split('/').filter(Boolean).pop().replace('.html', '');
  const isFactor = slug.includes('factor-frenzy');
  const isVolume = slug.includes('volume-vault');
  const config = {
    'unit2-fraction-foundry': {levels:['Whole ÷ unit fraction','Whole ÷ unit fraction in context','Whole ÷ fraction','Fraction ÷ fraction','Mixed number ÷ fraction'],data:n=>({level:n-1,score:0,lives:3})},
    'unit9-variable-velocity': {levels:['Proportional rules','Tables and equations','Predict the next point','Rules with a starting value','Master rover'],data:n=>({level:n-1,score:0,lives:3})},
    'unit6-expression-engine': {levels:['Guided: exponents','Standard: mixed expressions','Challenge: mixed expressions'],data:n=>({difficulty:n-1})},
    'unit5-area-architect': {levels:['Guided construction','Composite city'],data:n=>({level:n})},
    'unit3-ratio-rally': {levels:['Support','Standard','Challenge'],data:n=>({difficulty:['easy','medium','hard'][n-1]})},
    'unit9-coordinate-quest': {levels:['Support: fundamentals','Standard: full mission','Challenge: advanced navigation'],data:n=>({studioTier:n})},
    'unit7-equation-escape': {levels:['Support: one-step rooms','Standard: full dungeon','Challenge: advanced rooms'],data:n=>({studioTier:n})},
    'unit8-stats-slam': {levels:['Support: mean, median, mode, range','Standard: full season','Challenge: advanced statistics'],data:n=>({studioTier:n})},
    'unit4-discount-dash': {levels:['Support: friendly prices','Challenge: mixed discounts'],data:n=>({studioTier:n})},
    'unit2-fraction-kitchen': {levels:['Support: basic fractions','Challenge: equivalent fractions'],data:n=>({studioTier:n})},
  }[slug] || {levels:isFactor?['Apprentice smith','Journeyman smith','Master smith']:isVolume?['Bronze vault','Silver vault','Gold vault']:['Guided recipes','Challenge recipes'],data:n=>({tier:n})};
  const panel = document.createElement('section');
  panel.className = 'flagship-mission';
  panel.setAttribute('aria-label', 'Mission controls');
  panel.innerHTML = '<div class="fm-top"><div><span class="fm-eyebrow">MISSION CONTROL</span><h2>Build your next achievement</h2></div><div class="fm-launch"><label for="fm-level">Mission level</label><select id="fm-level"></select><button id="fm-start" type="button">Launch mission</button></div></div><div class="fm-stats" aria-label="Session progress"></div><p class="fm-question"></p><div class="fm-actions"></div><p class="fm-feedback" role="status" aria-live="polite"></p><div class="fm-progress" aria-hidden="true"><span></span></div>';
  const header = document.querySelector('.ewl-arcade-header-bar');
  if (header) header.after(panel); else document.body.prepend(panel);
  panel.querySelector('h2').textContent=document.title.split('—')[0].trim();
  let stage=null;
  function mountStage(){
    if(!game?.canvas || stage)return;
    stage=document.createElement('div');stage.className='flagship-stage';stage.style.aspectRatio=game.config.width+'/'+game.config.height;
    panel.after(stage);stage.append(game.canvas);
    game.scale.parent=stage;game.scale.parentIsWindow=false;game.scale.refresh();
  }
  mountStage();
  const level = panel.querySelector('select');
  config.levels.forEach((label,i)=>level.add(new Option(label,String(i+1))));
  const actions = panel.querySelector('.fm-actions');
  const question = panel.querySelector('.fm-question');
  const feedback = panel.querySelector('.fm-feedback');
  let session = {correct:0,total:0,streak:0,bestStreak:0};
  let best = 0;
  try {best=Number(localStorage.getItem('ewl.studio.best.'+slug)||0);} catch (_) {}
  let lastSignature = '';
  let sessionDone=false,lastScore=0;
  let pausedScenes = [];
  let pauseStarted=0;
  let scene = null;
  const emit = (name,detail)=>document.dispatchEvent(new CustomEvent('game:'+name,{detail}));
  function track(correct,message) {
    session.total++;
    session.correct+=correct?1:0;
    session.streak=correct?session.streak+1:0;
    session.bestStreak=Math.max(session.streak,session.bestStreak);
    feedback.textContent=message || (correct?'Mission step complete. Keep building!':'Try another approach. Use the model to check your thinking.');
    feedback.dataset.result=correct?'correct':'retry';
    emit('feedback',{correct,message:feedback.textContent});
  }
  function complete(score) {
    if(sessionDone)return;sessionDone=true;
    const accuracy=session.total?Math.round(100*session.correct/session.total):0;
    if (score>best) {best=score;try{localStorage.setItem('ewl.studio.best.'+slug,String(best));}catch(_) {}}
    feedback.textContent=`Mission complete · ${accuracy}% accuracy · best streak ${session.bestStreak}. Choose a level and launch again.`;
    emit('complete',{score,correct:session.correct,total:session.total,message:feedback.textContent});
  }
  function currentQuestion(s) {return s.current || s.questions?.[s.qIndex ?? s.currentQ] || s.round;}
  function wrap(s,name,before) {
    const original=s[name];
    if(typeof original!=='function')return;
    s[name]=function(...args){before.call(this,...args);return original.apply(this,args);};
  }
  function install(s) {
    if(s.__studioInstalled)return;
    s.__studioInstalled=true;
    wrap(s,'submitAnswer',function(i){
      if(this.answered || this.answerBtns?.[i]?.eliminated || this.removedChoices?.includes(i))return;
      const q=currentQuestion(this);
      const choice=this.answerBoxes?.[i]?.optText ?? this.answerBtns?.[i]?.optText ?? q?.options?.[i];
      if(q && choice!=null)track(choice===q.correct,choice===q.correct?'Correct. '+(q.explain||''): 'Not yet — check your work and try another choice.');
    });
    wrap(s,'pick',function(i){if(!this.locked && this.current?.choices?.[i])track(!!this.current.choices[i].correct,this.current.choices[i].correct?this.current.explain:'Not yet — check your work and try another choice.');});
    wrap(s,'forge',function(){if(!this.locked && this.current){const r=this.judge();track(r.correct,r.correct?this.current.explain:r.why);}});
    wrap(s,'grabCell',function(row,i){if(!row.scored)track(row.data.bestIdxs.includes(i),'Compare each original price × (1 − discount ÷ 100).');});
    wrap(s,'resolveCorrect',()=>track(true,'Construction complete. Building added to your city.'));
    wrap(s,'resolveWrong',message=>track(false,message));
    wrap(s,'serve',function(){if(!this.round || this.roundLocked)return;const r=this.round,[a,b]=this.counts;track(a>0&&b>0&&a*r.b===b*r.a&&(!r.capacity||a+b===r.capacity),'Compare both ingredient amounts using the same scale factor.');});
    wrap(s,'release',function(){if(!this.locked && this.order)track(Math.round(this.fill*this.order.jugDen)===this.order.targetNum,'Check the fraction against the jug divisions.');});
    wrap(s,'completeLevel',function(){this.__studioLevelDone=true;});
    ['endGame','gameOver'].forEach(name=>wrap(s,name,function(){complete(Number(this.score)||0);}));
    s.events.on('create',()=>{lastSignature='';s.__studioLevelDone=false;if(['Game','GameScene'].includes(s.scene.key) && !s.score){sessionDone=false;session={correct:0,total:0,streak:0,bestStreak:0};}});
  }
  function setMuted(muted) {
    if(game)game.sound.mute=muted;
    window.__flagshipMuted=muted;
    if(window.GameFX?.AudioSynth)window.GameFX.AudioSynth.muted=muted;
  }
  function pause() {
    if(!game)return;
    pauseStarted=Date.now();
    pausedScenes=game.scene.getScenes(true).map(s=>s.scene.key);
    pausedScenes.forEach(key=>game.scene.pause(key));
    if(scene?.pouring)scene.pouring=false;
    refresh();
  }
  function resume() {const delta=Date.now()-pauseStarted;pausedScenes.forEach(key=>{const s=game.scene.getScene(key);['startTime','questionStartTime'].forEach(field=>{if(typeof s[field]==='number')s[field]+=delta;});game.scene.resume(key);});pausedScenes=[];refresh();}
  function start(n) {
    n=Math.max(1,Math.min(config.levels.length,Number(n)||1));
    level.value=String(n);
    sessionDone=false;lastScore=0;session={correct:0,total:0,streak:0,bestStreak:0};feedback.textContent='Take your time. Every mission is self-paced.';lastSignature='';
    if(isFactor||isVolume){window.__flagshipStart?.(n);return;}
    if(!game)return;
    if(window.GameStudio?.paused)window.GameStudio.resume();
    game.scene.getScenes(true).forEach(s=>game.scene.stop(s.scene.key));
    const key=game.scene.scenes.find(s=>s.scene.key==='GameScene')?'GameScene':'Game';
    game.scene.start(key,config.data(n));
    refresh();
  }
  panel.querySelector('#fm-start').addEventListener('click',()=>start(level.value));
  // Replace the old cosmetic level buttons with the engine's actual mission selector.
  window.ewlSetLevel=n=>start(n);
  document.querySelectorAll('.ewl-arcade-controls').forEach(el=>el.remove());
  document.querySelector('#ewl-level-badge')?.remove();
  function button(label,fn,disabled=false) {
    const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled||!!window.GameStudio?.paused;
    b.addEventListener('click',()=>{if(!window.GameStudio?.paused){fn();refresh();}});actions.append(b);return b;
  }
  function nativeActions(s,q) {
    if(s.__studioLevelDone){const next=s.children.list.find(o=>o.input?.enabled && o.type==='Rectangle' && o.depth===21);button('Continue mission',()=>next?.emit('pointerdown'),!next);return;}
    if(s.submitAnswer && q?.options)q.options.forEach((o,i)=>button(`${i+1}. ${o}`,()=>s.submitAnswer(i),s.answered||s.answerBtns?.[i]?.eliminated));
    else if(s.pick && q?.choices)q.choices.forEach((o,i)=>button(`${i+1}. ${o.label}`,()=>s.pick(i),s.locked));
    else if(s.forge && q){
      button(`− Slice divisions (${s.cuts} per whole)`,()=>s.nudgeCuts(-1),s.locked);button(`+ Slice divisions (${s.cuts} per whole)`,()=>s.nudgeCuts(1),s.locked);
      button(`− ${q.mode==='partition'?'Pieces':'Groups'} (${q.mode==='partition'?s.sel:s.groups})`,()=>s.nudgeCount(-1),s.locked);button(`+ ${q.mode==='partition'?'Pieces':'Groups'} (${q.mode==='partition'?s.sel:s.groups})`,()=>s.nudgeCount(1),s.locked);button('Forge answer',()=>s.forge(),s.locked);
    }else if(s.addScoop && q){
      [0,1].forEach(i=>{button('+ '+(q[i===0?'ia':'ib']?.name||'Ingredient '+(i+1)),()=>s.addScoop(i),s.roundLocked);button('− Ingredient '+(i+1),()=>s.removeScoop(i),s.roundLocked);});button('Clear mix',()=>s.clearTubes(),s.roundLocked);button('Serve recipe',()=>s.serve(),s.roundLocked);button('Recipe hint',()=>s.showHint(),s.roundLocked);
    }else if(s.confirmGrab){
      s.row?.data.cells.forEach((cell,i)=>button(`Lane ${i+1}: $${cell.base.toFixed(2)} · ${cell.pct}% off`,()=>{s.setLane(i);s.confirmGrab();},s.row.scored||s.row.wrong.includes(i)));
      if(s.row?.scored)button(s.round>=12?'See results':'Next deal',()=>s.nextDeal());
    }else if(s.adjustDim && q){
      if(q.type==='composite'){button(q.phase==='slice'?'Change slice':'− Total area',()=>q.phase==='slice'?s.toggleSlice():s.adjustTotal(-1),s.lockBusy);if(q.phase==='total')button('+ Total area',()=>s.adjustTotal(1),s.lockBusy);}
      else (s.rowKeys||[]).forEach(key=>{button(`− ${key}: ${q.dims[key]}`,()=>s.adjustDim(key,-1),s.lockBusy);button(`+ ${key}: ${q.dims[key]}`,()=>s.adjustDim(key,1),s.lockBusy);});
      button('Lock construction',()=>s.onLock(),s.lockBusy);
    }else if(s.release && s.order){
      const pour=button('Hold to pour · release to check',()=>{} ,s.locked);
      const hold=e=>{if(s.locked||window.GameStudio?.paused)return;e.preventDefault();s.pouring=true;if(e.pointerId!=null)pour.setPointerCapture?.(e.pointerId);};
      const release=()=>{if(s.pouring && !s.locked)s.release();};
      pour.addEventListener('pointerdown',hold);pour.addEventListener('pointerup',release);pour.addEventListener('pointercancel',()=>{s.pouring=false;});
      pour.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat)hold(e);});pour.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')release();});
      button('Add one jug division',()=>{if(!s.locked){s.fill=Math.min(1,s.fill+1/s.order.jugDen);s.drawLiquid();}},s.locked);
      button('Check fill',()=>s.release(),s.locked);
    }else if(s.currentQ!=null && s.paused && q?.choices){
      const rects=s.children.list.filter(o=>o.input?.enabled && o.type==='Rectangle' && o.width===105 && o.height===55);
      q.choices.forEach((o,i)=>button(`${i+1}. ${o}`,()=>rects[i]?.emit('pointerdown'),!rects[i]?.input?.enabled));
    }
  }
  function refresh() {
    mountStage();
    if(game){game.scene.scenes.forEach(install);scene=game.scene.getScenes(true).find(s=>s.scene.key==='Game'||s.scene.key==='GameScene');}
    panel.querySelector('#fm-start').disabled=!!game && (!game.isRunning || !game.scene.getScenes(true).length) && !window.GameStudio?.paused;
    if(scene)lastScore=Number(scene.score)||0;
    if(game?.scene.getScenes(true).some(s=>['Result','Results'].includes(s.scene.key)))complete(lastScore);
    const score=Number(scene?.score ?? window.__flagshipState?.score ?? lastScore)||0;
    const percent=session.total?Math.round(session.correct/session.total*100):0;
    const studioStars = window.GameStudio?.session?.stars;
    panel.querySelector('.fm-stats').textContent=`Score ${score}  ·  Accuracy ${percent}%  ·  Streak ${session.streak}  ·  Personal best ${best}` + (Number.isFinite(studioStars) ? `  ·  Stars ${studioStars}` : '');
    const q=scene?currentQuestion(scene):null;
    let text=q?.prompt||q?.text||scene?.promptText?.text||'';
    if(q?.data)text+=' Data: '+q.data;
    if(scene?.qText?.text && !text)text=scene.qText.text;
    if(scene?.order)text=`Order ${scene.orderIndex??''}: fill ${scene.order.shownNum}/${scene.order.shownDen} of the jug. Divisions: ${scene.order.jugDen}.`;
    if(scene?.orderRatio?.text)text=scene.orderRatio.text+' · '+(scene.orderTask?.text||'')+' · Current mix '+scene.counts.join(' : ');
    if(scene?.row?.data)text='Which lane offers the lowest sale price? Compare all three discounts.';
    if(!scene && (isFactor||isVolume))text='Use the model below to build and check your answer. Choose any mission level above.';
    if(!scene&&!isFactor&&!isVolume)text='Choose your level and launch a mission. Controls are available here and in the game.';
    question.textContent=text;
    const signature=JSON.stringify([scene?.scene.key,scene?.qIndex,scene?.currentQ,q?.prompt,q?.text,q?.dims,q?.phase,q?.total,scene?.cuts,scene?.sel,scene?.groups,scene?.counts,scene?.row?.scored,scene?.row?.wrong,typeof scene?.round === "number" ? scene.round : null,scene?.locked,scene?.answered,scene?.roundLocked,scene?.lockBusy,scene?.__studioLevelDone,scene?.answerBtns?.map(b=>b.eliminated),window.GameStudio?.paused]);
    if(signature!==lastSignature){const focusIndex=[...actions.children].indexOf(document.activeElement);lastSignature=signature;actions.replaceChildren();if(scene)nativeActions(scene,q);if(focusIndex>=0)actions.children[focusIndex]?.focus({preventScroll:true});}
    const completed=scene?.qIndex??scene?.shapesPlaced??scene?.served??window.__flagshipState?.completed??window.__flagshipState?.sealed??0;
    const total=scene?.totalQ??scene?.maxRounds??scene?.queue?.length??10;
    panel.querySelector('.fm-progress span').style.width=Math.min(100,completed/total*100)+'%';
  }
  if(window.GameStudio)window.GameStudio.register({title:document.title,instructions:['Choose a mission level, then launch.','Use the readable mission controls or the game canvas. Keyboard and touch both work.','Check each model carefully. Mistakes give you another chance to learn.'],...(game?{pause,resume}:{}),setMuted,setMotion:reduced=>{window.__flagshipReduced=reduced;game?.scene.scenes.forEach(s=>{s.reduceMotion=reduced;s.reducedMotion=reduced;});}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && !document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();window.GameStudio?.[window.GameStudio.paused?'resume':'pause']();}},true);
  document.addEventListener('flagship:answer',e=>track(e.detail.correct,e.detail.message));
  if(window.__flagshipOnFeedback)window.__flagshipOnFeedback(track,complete);
  refresh();
  setInterval(refresh,180);
})();
