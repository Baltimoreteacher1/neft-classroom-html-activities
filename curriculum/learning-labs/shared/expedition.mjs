import { puzzle, fmt } from './math.mjs';
import { esc, mountModel } from './model.mjs';
import { expeditionWorlds } from './expedition-worlds.mjs';

export function worldArt(theme, repaired, selected = -1) {
  const sky = { ocean:'#113e55', mountain:'#223c4a', factory:'#33344c', citadel:'#293350', observatory:'#192640', city:'#264249' }[theme];
  let scenery = '';
  if (theme === 'mountain') scenery = '<path d="M0 230 120 56 225 183 342 20 465 193 581 75 720 236Z" fill="#42596a"/><path d="m285 98 57-78 54 76-49-23Z" fill="#d0e5df"/><path d="M0 260 160 165 340 233 507 142 720 261V320H0Z" fill="#2d6264"/>';
  if (theme === 'ocean') scenery = '<path d="M0 151Q70 124 150 151T300 151T450 151T600 151T750 151V320H0Z" fill="#19657a"/><path d="M0 239Q100 205 220 239T460 239T720 239" fill="none" stroke="#52b4b5" stroke-width="3"/><path d="M55 320q-22-100 10-151m-9 78-29-21m29 0 31-31M650 320q40-100 0-137m12 55 34-22" fill="none" stroke="#559d85" stroke-width="10"/>';
  if (theme === 'city') scenery = Array.from({length:12},(_,i)=>`<rect x="${i*64-12}" y="${95+(i*37)%100}" width="49" height="210" rx="3" fill="${i%2?'#3f686d':'#345b65'}"/><path d="M${i*64+1} 205v-17m17 17v-17" stroke="#d4a875" stroke-width="8"/>`).join('');
  if (theme === 'factory') scenery = '<path d="M0 267V152l90 40v-63l95 50v-73l90 65v-31l112 44V99l110 70v-45l112 55v-44l111 57v100H0Z" fill="#5b5060"/><path d="M46 230h125v-85h143v91h210V126h147" fill="none" stroke="#95816d" stroke-width="13"/>';
  if (theme === 'citadel') scenery = '<path d="M30 300V131h18V110h20v21h24v-21h20v21h18v169m100 0V90h20V69h25v21h26V69h25v21h21v210m141 0V131h18V110h20v21h24v-21h20v21h18v169" fill="#4b5d7b"/><path d="M0 270h720M0 287h720" stroke="#758394" stroke-width="8"/>';
  if (theme === 'observatory') scenery = '<circle cx="555" cy="65" r="36" fill="#c6d9bc"/><ellipse cx="555" cy="65" rx="65" ry="10" fill="none" stroke="#83aab9" stroke-width="3" transform="rotate(-23 555 65)"/><path d="M0 280Q120 170 210 247T430 245T720 264V320H0" fill="#354660"/>';
  const stars = Array.from({length:18},(_,i)=>`<circle cx="${(i*137+39)%710}" cy="${(i*47+11)%133}" r="${i%3===0?2:1}" fill="#d4e7e4" opacity=".6"/>`).join('');
  const points = [[132,215],[352,175],[579,215]];
  const sites = points.map(([x,y],i)=>`<g transform="translate(${x} ${y})" class="${repaired.includes(i)?'lab-site-lit':''}"><ellipse cy="28" rx="59" ry="15" fill="#0b1e2c" opacity=".5"/><path d="M-37 21v-52L0-54l37 23v52Z" fill="${repaired.includes(i)?'#659c85':'#526577'}" stroke="${selected===i?'#ffffff':'#a4b7bc'}" stroke-width="${selected===i?4:2}"/><path d="M-37-31 0-54 37-31 0-10Z" fill="${repaired.includes(i)?'#b9e5b0':'#91a7ac'}"/><path d="M0-10v31m-20-40v19m40-19v19" stroke="${repaired.includes(i)?'#fff5b0':'#27394a'}" stroke-width="7"/><circle cy="-76" r="18" fill="${repaired.includes(i)?'#d4f5ac':'#182d40'}" stroke="#b7d5d6"/><text y="-70" text-anchor="middle" fill="${repaired.includes(i)?'#18342b':'#fff'}" font-size="18" font-family="system-ui" font-weight="700">${repaired.includes(i)?'✓':i+1}</text></g>`).join('');
  return `<svg viewBox="0 0 720 320" role="img" aria-label="Expedition landscape: ${repaired.length} of 3 locations restored"><rect width="720" height="320" fill="${sky}"/>${stars}${scenery}<path d="M132 241Q240 277 352 200T579 241" fill="none" stroke="#a3bbc4" stroke-width="4" stroke-dasharray="5 10"/>${sites}</svg>`;
}

export function mountExpedition(stage, lab, progress, save, level, choose) {
  const world = expeditionWorlds[lab.id];
  if (!world) throw new Error(`Missing expedition world: ${lab.id}`);
  const tier = ['support','core','stretch'].indexOf(level);
  if (!progress.expedition || typeof progress.expedition !== 'object' || Array.isArray(progress.expedition)) progress.expedition = { repaired: Array.from({length:Math.min(3,progress.rounds||0)},(_,i)=>i), medals:[], cycle:0 };
  const expedition = progress.expedition;
  expedition.repaired = [...new Set((Array.isArray(expedition.repaired) ? expedition.repaired : []).filter(n=>Number.isInteger(n)&&n>=0&&n<3))];
  expedition.medals = Array.isArray(expedition.medals) ? expedition.medals.filter(n => Number.isInteger(n) && n >= 0 && n < 3) : [];
  expedition.cycle = Math.max(0, Math.min(1000, Math.floor(Number(expedition.cycle) || 0)));
  let selected = Number.isInteger(expedition.active) && !expedition.repaired.includes(expedition.active) ? expedition.active : -1;
  const emit = (name, detail) => window.GameStudio?.emit(name, detail);
  function heading() {
    return `<div class="lab-expedition-banner"><p class="lab-expedition-kicker">${esc(lab.finale)} · expedition ${expedition.cycle+1}</p><h3>${esc(world.goal)}</h3><p>${esc(world.brief)}</p></div><div class="lab-expedition-world">${worldArt(world.theme,expedition.repaired,selected)}</div>`;
  }
  function map() {
    selected=-1; delete expedition.active; save();
    const won = expedition.repaired.length===3;
    stage.innerHTML = `<section class="lab-expedition">${heading()}<div class="lab-expedition-deck"><p class="lab-expedition-status" role="status">${won?'Expedition complete. All three locations are working again.':'Choose your route. Each location needs a different construction.'} ${expedition.repaired.length}/3 restored.</p><div class="lab-expedition-sites">${world.locations.map((name,i)=>`<button type="button" data-site="${i}" ${expedition.repaired.includes(i)?'disabled':''}><span>${expedition.repaired.includes(i)?'RESTORED':`DESTINATION ${i+1}`}</span><strong>${esc(name)}</strong><small>${expedition.repaired.includes(i)?'Evidence saved in your log':'Plan → build → restore'}</small></button>`).join('')}</div>${won?'<div class="actions"><button type="button" data-replay>New expedition</button><button type="button" class="quiet" data-other>Decode the field guide</button></div>':''}<details><summary>Expedition log · ${expedition.medals.length} field badges</summary><p>A field badge means a location was restored without a hint on that attempt. Hints and retries are always available.</p><ol>${world.locations.map((name,i)=>`<li>${esc(name)} — ${expedition.repaired.includes(i)?'restored':'awaiting your crew'}${expedition.medals.includes(i)?' · field badge earned':''}</li>`).join('')}</ol></details></div></section>`;
    stage.querySelectorAll('[data-site]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.site); expedition.active=selected;save();mission();stage.querySelector('[data-return]')?.focus({preventScroll:true});});
    stage.querySelector('[data-other]')?.addEventListener('click',()=>choose('match'));
    stage.querySelector('[data-replay]')?.addEventListener('click',()=>{expedition.repaired=[];expedition.medals=[];expedition.hints={};expedition.cycle++;progress.rounds=0;progress.checks=0;progress.hints=0;progress.solutions=[];delete progress.puzzleValues;map();});
  }
  function mission() {
    const round = selected;
    const challenge = puzzle(lab.model, round, (tier+expedition.cycle)%3);
    const isBalance=lab.model.kind==='balance',isMirror=lab.model.kind==='coordinates'&&['reflect','symmetry'].includes(lab.model.mode),isInequality=lab.model.kind==='inequality';
    const approximate=Math.abs(challenge.target-Number(challenge.target.toFixed(4)))>1e-8;
    const goal=isMirror?`Move A to the reflection of B across the ${round%2?'x':'y'}-axis.`:isInequality?`Find a test value that ${round%2?'does not satisfy':'satisfies'} the rule.`:isBalance?'Make both sides equal. Only the candidate value of x can change.':`Make ${challenge.metric.toLowerCase()} ${approximate?'approximately':'equal'} ${fmt(challenge.target)}. Only one control is unlocked.`;
    stage.innerHTML=`<section class="lab-expedition">${heading()}<div class="lab-expedition-deck"><button type="button" class="quiet" data-return>← Choose another destination</button><div class="round-heading"><h3>${esc(world.locations[round])}</h3><p>${expedition.repaired.length}/3 restored</p></div><p class="target">${esc(goal)}</p><p class="goal-gap" aria-live="polite"></p><div class="puzzle-model"></div><div class="actions"><button type="button" data-check>Restore this location</button><button type="button" class="quiet" data-hint>Ask the field guide</button></div><p class="game-feedback" role="status"></p></div></section>`;
    const saved=progress.puzzleValues, status=stage.querySelector('.game-feedback'),gap=stage.querySelector('.goal-gap');
    let hintsThisMission=expedition.hints?.[round]||0,completed=false;
    function describe(result) {
      if(isBalance){gap.textContent=`Left ${fmt(result.lhs)} · right ${fmt(result.rhs)} · ${Math.abs(result.value)<1e-9?'balanced':'adjust the candidate'}`;return;}
      if(isMirror||isInequality){gap.textContent='Use the diagram to test your next move.';return;}
      const diff=result.value-challenge.target;
      gap.textContent=`Current ${challenge.metric.toLowerCase()}: ${fmt(result.value)} · target ${fmt(challenge.target)} · ${Math.abs(diff)<=challenge.tolerance?'ready to restore':diff>0?'too high':'too low'}`;
    }
    const model=mountModel(stage.querySelector('.puzzle-model'),lab.model,{initial:saved?.round===round?saved.values:challenge.start,free:challenge.free,prefix:'game',level,onChange:(values,result)=>{progress.puzzleValues={round,values};describe(result);save();}});
    describe(model.result());
    stage.querySelector('[data-return]').onclick=map;
    stage.querySelector('[data-hint]').onclick=()=>{hintsThisMission++;expedition.hints||={};expedition.hints[round]=hintsThisMission;progress.hints++;save();status.textContent=isMirror?'A reflection changes the sign of the coordinate perpendicular to the mirror. Keep the other coordinate.':isInequality?'Read the direction. Test the boundary and check whether equality is allowed.':isBalance?'Use the inverse operation, then substitute your candidate back into the equation.':'Read the model’s relationship. Predict whether the unlocked value should increase or decrease, then test one change.';};
    stage.querySelector('[data-check]').onclick=()=>{
      if(completed){map();return;}
      if(!model.valid){status.textContent='Fix the highlighted input before restoring this location.';return;}
      progress.checks++;
      let correct=Math.abs(model.result().value-challenge.target)<=challenge.tolerance;
      if(isMirror)correct=model.values.every((n,i)=>Math.abs(n-challenge.goal[i])<1e-8);
      if(isInequality)correct=model.result().pass===(round%2===0);
      emit('feedback',{correct});
      if(!correct){save();status.textContent='The station is not aligned yet. Compare the model with the target, change one value, and try again. Your restored locations are safe.';return;}
      completed=true;expedition.repaired.push(round);if(!hintsThisMission&&!expedition.medals.includes(round))expedition.medals.push(round);
      progress.solutions.push({round,values:[...model.values]});progress.rounds=expedition.repaired.length;delete progress.puzzleValues;delete expedition.active;save();
      stage.querySelector('.lab-expedition-world').innerHTML=worldArt(world.theme,expedition.repaired,round);
      status.textContent=`${world.locations[round]} restored. ${hintsThisMission?'You used your field guide and solved it.':'Field badge earned.'} Your construction is saved.`;
      stage.querySelector('[data-check]').textContent=progress.rounds===3?'See the restored world':'Return to the route map';
      stage.querySelector('[data-hint]').disabled=true;
      if(progress.rounds===3)emit('complete',{correct:3,total:3,message:`${lab.finale}: all three locations restored.`});
    };
  }
  if(selected>=0)mission();else map();
}
