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
    'unit1-factor-frenzy': {unit:'Unit 6 · Lesson 6-2 (6.NOS.4)',topic:'Prime Factorization, GCF & LCM',coach:'Split each composite number into a factor pair until every branch is prime (2, 3, 5, 7, 11). GCF shares common primes; LCM combines highest prime powers.',levels:['Apprentice smith','Journeyman smith','Master smith'],data:n=>({tier:n})},
    'unit2-fraction-foundry': {unit:'Unit 6 · Lessons 6-7 to 6-10 (6.NOS.1)',topic:'Dividing Fractions & Mixed Numbers',coach:'To divide by a fraction, partition each whole into equal parts matching the divisor denominator, or multiply by the reciprocal (a/b ÷ c/d = a/b × d/c).',levels:['Whole ÷ unit fraction','Whole ÷ unit fraction in context','Whole ÷ fraction','Fraction ÷ fraction','Mixed number ÷ fraction'],data:n=>({level:n-1,score:0,lives:3})},
    'unit9-variable-velocity': {unit:'Unit 9 · Lessons 9-1 to 9-4 (6.AT.10)',topic:'Independent & Dependent Variables, Tables & Equations',coach:'Check how y changes for each 1-unit increase in x. Proportional rules multiply (y = kx); additive rules add a starting offset (y = x + b).',levels:['Proportional rules','Tables and equations','Predict the next point','Rules with a starting value','Master rover'],data:n=>({level:n-1,score:0,lives:3})},
    'unit6-expression-engine': {unit:'Unit 6 · Lessons 6-1, 6-3, 6-4 (6.AT.4–6)',topic:'Exponents, Order of Operations & Algebraic Expressions',coach:'Follow GEMDAS: evaluate grouping symbols first, then exponents, then multiply/divide left to right, then add/subtract left to right.',levels:['Guided: exponents','Standard: mixed expressions','Challenge: mixed expressions'],data:n=>({difficulty:n-1})},
    'unit5-area-architect': {unit:'Unit 5 · Lessons 5-1 to 5-4 (6.GR.1)',topic:'Area of Parallelograms, Triangles & Composite Polygons',coach:'Parallelogram area is A = b · h and triangle area is A = ½ · b · h (always use the perpendicular height). Split composite shapes into rectangles and triangles.',levels:['Guided construction','Composite city'],data:n=>({level:n})},
    'unit3-ratio-rally': {unit:'Unit 3 · Lessons 3-1 to 3-7 (6.AT.1–3)',topic:'Ratios, Tables, Tape Diagrams & Unit Rates',coach:'Scale both parts of a ratio by the same multiplier. To find a unit rate, divide to find the amount per 1 unit.',levels:['Support','Standard','Challenge'],data:n=>({difficulty:['easy','medium','hard'][n-1]})},
    '6-rp-1game': {unit:'Unit 3 · Lessons 3-1 to 3-7 (6.AT.1–3)',topic:'Equivalent Ratios & Proportional Mixtures',coach:'Multiply or divide both ingredient amounts by the same scale factor to keep the mixture in the exact target ratio.',levels:['Guided recipes','Challenge recipes'],data:n=>({tier:n})},
    'unit9-coordinate-quest': {unit:'Unit 7 · Lessons 7-5 to 7-7 (6.NOS.6–8)',topic:'Four-Quadrant Coordinate Plane, Reflections & Distance',coach:'Plot (x, y) from (0, 0): move horizontally first (x), then vertically (y). Reflecting across the x-axis flips y; reflecting across the y-axis flips x.',levels:['Support: fundamentals','Standard: full mission','Challenge: advanced navigation'],data:n=>({studioTier:n})},
    'unit7-equation-escape': {unit:'Unit 8 · Lessons 8-1 to 8-6 (6.AT.7–9)',topic:'One-Step Equations & Inequalities',coach:'Use inverse operations on BOTH sides to isolate the variable: undo addition with subtraction, and undo multiplication with division.',levels:['Support: one-step rooms','Standard: full dungeon','Challenge: advanced rooms'],data:n=>({studioTier:n})},
    'unit8-stats-slam': {unit:'Unit 2 · Lessons 2-1 to 2-9 (6.DS.1–5)',topic:'Mean, Median, Mode, Range, IQR & MAD',coach:'Order the data from least to greatest first! Mean = sum ÷ count; Median = middle value; Range = max − min; IQR = Q3 − Q1.',levels:['Support: mean, median, mode, range','Standard: full season','Challenge: advanced statistics'],data:n=>({studioTier:n})},
    'unit4-discount-dash': {unit:'Unit 4 · Lessons 4-1 to 4-6 (6.AT.3c)',topic:'Percents, Discounts & Sale Price Comparisons',coach:'Find the discount by multiplying original price × (percent ÷ 100), then subtract from the original price (or multiply by 100% − discount%).',levels:['Support: friendly prices','Challenge: mixed discounts'],data:n=>({studioTier:n})},
    'unit2-fraction-kitchen': {unit:'Unit 6 · Lessons 6-7 to 6-10 (6.NOS.1)',topic:'Equivalent Fractions & Visual Fraction Models',coach:'Multiply or divide the numerator and denominator by the same nonzero number to match the jug divisions.',levels:['Support: basic fractions','Challenge: equivalent fractions'],data:n=>({studioTier:n})},
    'unit10-volume-vault': {unit:'Unit 5 · Lessons 5-5 to 5-7 (6.GR.2, 6.GR.4)',topic:'Volume of Rectangular Prisms & Surface Area Nets',coach:'Volume is length × width × height (V = l · w · h = B · h). Surface area is the sum of all 6 rectangular faces: 2(lw + lh + wh).',levels:['Bronze vault','Silver vault','Gold vault'],data:n=>({tier:n})},
  }[slug] || {unit:'Grade 6 Math Curriculum',topic:'Interactive Concept Practice',coach:'Use the visual model to check your mathematical reasoning step by step.',levels:isFactor?['Apprentice smith','Journeyman smith','Master smith']:isVolume?['Bronze vault','Silver vault','Gold vault']:['Guided recipes','Challenge recipes'],data:n=>({tier:n})};
  const panel = document.createElement('section');
  panel.className = 'flagship-mission';
  panel.setAttribute('aria-label', 'Mission controls');
  panel.innerHTML = `<div class="fm-top"><div><span class="fm-eyebrow">${config.unit} • ${config.topic}</span><h2>Build your next achievement</h2></div><div class="fm-launch"><label for="fm-level">Mission level</label><select id="fm-level"></select><button id="fm-start" type="button">Launch mission</button></div></div><div class="fm-stats" aria-label="Session progress"></div><p class="fm-question"></p><div class="fm-actions"></div><p class="fm-feedback" role="status" aria-live="polite"></p><div class="fm-progress" aria-hidden="true"><span></span></div>`;
  const header = document.querySelector('.ewl-arcade-header-bar');
  if (header) header.after(panel); else document.body.prepend(panel);
  panel.querySelector('h2').textContent=document.title.split('—')[0].trim();
  const coachTitle = document.getElementById('ewl-coach-title');
  const coachText = document.getElementById('ewl-coach-text');
  if (coachTitle) coachTitle.textContent = `Strategy Coach · ${config.unit} (${config.topic})`;
  if (coachText) {
    coachText.textContent = config.coach;
    coachText.setAttribute('data-en', config.coach);
  }
  let stage=null;
  function syncBounds(){
    try{game?.scale?.updateBounds?.();}catch(_){}
  }
  function mountStage(){
    if(!game?.canvas || stage)return;
    stage=document.createElement('div');stage.className='flagship-stage';stage.style.aspectRatio=game.config.width+'/'+game.config.height;
    stage.style.setProperty('--native-ratio', String(game.config.width / game.config.height));
    panel.after(stage);stage.append(game.canvas);
    game.scale.parent=stage;game.scale.parentIsWindow=false;game.scale.refresh();syncBounds();
    game.canvas.addEventListener('pointerdown',syncBounds,true);
    game.canvas.addEventListener('pointermove',syncBounds,{passive:true,capture:true});
    window.addEventListener('scroll',syncBounds,{passive:true});
    window.addEventListener('resize',()=>{game.scale.refresh();syncBounds();},{passive:true});
    new ResizeObserver(()=>{game.scale.refresh();syncBounds();}).observe(stage);
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
    let modelEl=panel.querySelector('.fm-live-model');
    if(!modelEl){
      modelEl=document.createElement('div');
      modelEl.className='fm-live-model';
      modelEl.style.cssText='margin:6px 0 8px;padding:8px 12px;border-radius:10px;background:rgba(56,189,248,0.12);border-left:3px solid #38bdf8;color:#e0f2fe;font-size:0.86rem;font-weight:700;';
      question.after(modelEl);
    }
    if(scene?.round && Array.isArray(scene.counts)){
      const rA=scene.round.a||1, rB=scene.round.b||1, [cA,cB]=scene.counts;
      const eq=cA>0&&cB>0&&cA*rB===cB*rA;
      modelEl.textContent=`⚖️ Live Ratio Lab: Target Ratio ${rA}:${rB}`+(scene.round.capacity?` (Total Capacity ${scene.round.capacity})`:'')+` · Your Mix: ${cA}:${cB} (${cA+cB} scoops) · ${eq?'🎯 Proportional Match!':'Scale both ingredients by the same multiplier'}`;
    }else if(scene?.forge && q){
      modelEl.textContent=`🍕 Live Fraction Foundry: ${sCutsInfo(scene,q)}`;
    }else if(scene?.order){
      modelEl.textContent=`🧪 Live Equivalent Fraction Jug: ${Math.round((scene.fill||0)*scene.order.jugDen)} / ${scene.order.jugDen} divisions filled (Target: ${scene.order.shownNum}/${scene.order.shownDen})`;
    }else{
      modelEl.textContent=`🔬 ${config.topic}: ${config.coach}`;
    }
    const signature=JSON.stringify([scene?.scene.key,scene?.qIndex,scene?.currentQ,q?.prompt,q?.text,q?.dims,q?.phase,q?.total,scene?.cuts,scene?.sel,scene?.groups,scene?.counts,scene?.row?.scored,scene?.row?.wrong,typeof scene?.round === "number" ? scene.round : null,scene?.locked,scene?.answered,scene?.roundLocked,scene?.lockBusy,scene?.__studioLevelDone,scene?.answerBtns?.map(b=>b.eliminated),window.GameStudio?.paused]);
    if(signature!==lastSignature){const focusIndex=[...actions.children].indexOf(document.activeElement);lastSignature=signature;actions.replaceChildren();if(scene)nativeActions(scene,q);if(focusIndex>=0)actions.children[focusIndex]?.focus({preventScroll:true});}
    const completed=scene?.qIndex??scene?.shapesPlaced??scene?.served??window.__flagshipState?.completed??window.__flagshipState?.sealed??0;
    const total=scene?.totalQ??scene?.maxRounds??scene?.queue?.length??10;
    panel.querySelector('.fm-progress span').style.width=Math.min(100,completed/total*100)+'%';
  }
  function sCutsInfo(s,q){
    return `Divisions per whole: ${s.cuts||1} · Selected ${q.mode==='partition'?'pieces':'groups'}: ${q.mode==='partition'?(s.sel||0):(s.groups||0)}`;
  }
  if(window.GameStudio)window.GameStudio.register({title:document.title,instructions:['Choose a mission level, then launch.','Use the readable mission controls or the game canvas. Keyboard and touch both work.','Check each model carefully. Mistakes give you another chance to learn.'],...(game?{pause,resume}:{}),setMuted,setMotion:reduced=>{window.__flagshipReduced=reduced;game?.scene.scenes.forEach(s=>{s.reduceMotion=reduced;s.reducedMotion=reduced;});}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && !document.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation();window.GameStudio?.[window.GameStudio.paused?'resume':'pause']();}},true);
  document.addEventListener('flagship:answer',e=>track(e.detail.correct,e.detail.message));
  if(window.__flagshipOnFeedback)window.__flagshipOnFeedback(track,complete);
  refresh();
  setInterval(refresh,180);
})();
