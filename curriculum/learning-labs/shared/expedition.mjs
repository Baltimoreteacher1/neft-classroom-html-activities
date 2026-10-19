import { controls, evaluate, puzzle, fmt } from './math.mjs';
import { esc, guidance, mountModel } from './model.mjs';
import { esLabel } from './labels-es.mjs';
import { expeditionWorlds } from './expedition-worlds.mjs';
import { expeditionWorldsEs } from './expedition-worlds-es.mjs';
import * as sound from './sound.mjs';

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
  return `<svg role="img" aria-label="Expedition landscape: ${repaired.length} of 3 locations restored" width="720" height="320" viewBox="0 0 720 320" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="720" height="320" fill="${sky}"/>${stars}${scenery}<path d="M132 241Q240 277 352 200T579 241" fill="none" stroke="#a3bbc4" stroke-width="4" stroke-dasharray="5 10"/>${sites}</svg>`;
}

// The expedition: three destinations, each a different construction the student PLANS, builds and tests.
//
// `choose` switches to a sibling game (the lab shell passes one). `hooks` lets a host page hear the outcome (feedback / complete)
// and say which language to show (`lang()`), so the same expedition runs inside a lesson practice page. Nothing is timed.
//
// English is always shown. With Spanish on, every sentence the game writes carries its Spanish sibling beneath it (the studios' own
// convention), so a student can read either. Model readouts stay as the model writes them.

const STRINGS = {
  kicker: ['expedition', 'expedición'],
  restoredWord: ['RESTORED', 'RESTAURADO'],
  destination: ['DESTINATION', 'DESTINO'],
  planBuildRestore: ['Plan → build → restore', 'Planea → construye → restaura'],
  evidenceSaved: ['Evidence saved in your log', 'Evidencia guardada en tu bitácora'],
  choose: ['Choose your route. Each location needs a different construction.', 'Elige tu ruta. Cada lugar necesita una construcción distinta.'],
  complete: ['Expedition complete. All three locations are working again.', 'Expedición completa. Los tres lugares funcionan de nuevo.'],
  restoredCount: ['restored', 'restaurados'],
  replay: ['New expedition', 'Nueva expedición'],
  other: ['Decode the field guide', 'Descifra la guía de campo'],
  back: ['← Choose another destination', '← Elegir otro destino'],
  soundOn: ['🔊 Sound on', '🔊 Sonido activado'],
  soundOff: ['🔈 Sound off', '🔈 Sonido apagado'],
  plan: ['Plan before you test: decide what the unlocked control must be, build it, then test. Each location rewards a plan, not a search.', 'Planea antes de probar: decide cuál debe ser el control desbloqueado, constrúyelo y luego prueba. Cada lugar premia un plan, no una búsqueda.'],
  test: ['Test my build', 'Probar mi construcción'],
  guide: ['Ask the field guide', 'Preguntar a la guía de campo'],
  returnMap: ['Return to the route map', 'Volver al mapa de rutas'],
  seeWorld: ['See the restored world', 'Ver el mundo restaurado'],
  fixInput: ['Fix the highlighted input before testing this location.', 'Corrige el dato resaltado antes de probar este lugar.'],
  safe: ['Your restored locations are safe.', 'Tus lugares restaurados están a salvo.'],
  currentTarget: ['target', 'meta'],
  current: ['Current', 'Actual'],
  left: ['Left', 'Izquierdo'],
  right: ['right', 'derecho'],
  planMove: ['Use the diagram to plan your next move.', 'Usa el diagrama para planear tu próximo movimiento.'],
  fieldLog: ['Expedition log', 'Bitácora de la expedición'],
  badges: ['field badges', 'insignias de campo'],
  badgeNote: ['A field badge means a location was restored on the first test without a hint. Hints and retries are always free.', 'Una insignia de campo significa que un lugar se restauró en la primera prueba sin pista. Las pistas y los reintentos siempre son gratis.'],
  awaiting: ['awaiting your crew', 'esperando a tu equipo'],
  badgeEarned: ['field badge earned', 'insignia de campo ganada'],
  howFound: ['How did you find it?', '¿Cómo lo encontraste?'],
  summary: ['Your expedition', 'Tu expedición'],
  goalLine: ['Goal', 'Meta'],
  trailTitle: ['My tests', 'Mis pruebas'],
  hintRung: ['Hint', 'Pista'],
  hint1: ['What is the unlocked control counting or measuring? Say how it connects to the readout before you change it.', '¿Qué cuenta o mide el control desbloqueado? Di cómo se conecta con la lectura antes de cambiarlo.'],
};
const STRATEGIES = [
  ['reasoned', 'I reasoned from the relationship', 'Razoné a partir de la relación'],
  ['estimated', 'I estimated, then adjusted', 'Estimé y luego ajusté'],
  ['tried', 'I tried values and checked', 'Probé valores y comprobé'],
  ['guide', 'I used the field guide', 'Usé la guía de campo'],
];

/** The puzzle level for a student: their tier plus how the last restores went, held inside 0-2 (it rises, it never wraps to the easiest). */
export const missionLevel = (tier, adapt) => Math.max(0, Math.min(2, tier + (adapt || 0)));

export function mountExpedition(stage, lab, progress, save, level, choose, hooks = {}) {
  const base = expeditionWorlds[lab.id];
  if (!base) throw new Error(`Missing expedition world: ${lab.id}`);
  const baseEs = expeditionWorldsEs[lab.id];
  const tier = ['support','core','stretch'].indexOf(level);
  // The host may pass a bare object (a lesson practice page does); the lab shell has always pre-filled these.
  progress.checks ||= 0; progress.hints ||= 0; progress.rounds ||= 0; progress.solutions ||= [];
  if (!progress.expedition || typeof progress.expedition !== 'object' || Array.isArray(progress.expedition)) progress.expedition = { repaired: Array.from({length:Math.min(3,progress.rounds||0)},(_,i)=>i), medals:[], cycle:0 };
  const expedition = progress.expedition;
  expedition.repaired = [...new Set((Array.isArray(expedition.repaired) ? expedition.repaired : []).filter(n=>Number.isInteger(n)&&n>=0&&n<3))];
  expedition.medals = Array.isArray(expedition.medals) ? expedition.medals.filter(n => Number.isInteger(n) && n >= 0 && n < 3) : [];
  expedition.cycle = Math.max(0, Math.min(1000, Math.floor(Number(expedition.cycle) || 0)));
  expedition.tests ||= {}; expedition.strategy ||= {};
  let selected = Number.isInteger(expedition.active) && !expedition.repaired.includes(expedition.active) ? expedition.active : -1;
  const emit = (name, detail) => { window.GameStudio?.emit(name, detail); hooks[name]?.(detail); };

  // ── language: English always, Spanish beneath it when the host asks for it ──
  const spanish = () => (hooks.lang ? hooks.lang() : document.documentElement.lang) === 'es';
  const pair = (key) => STRINGS[key];
  /** Escaped HTML for a sentence in both languages (Spanish only when it is on). */
  const bi = (en, es) => `${esc(en)}${spanish() && es ? `<span class="es-line" lang="es">${esc(es)}</span>` : ''}`;
  const T = (key) => bi(...pair(key));
  const world = { ...base };
  const worldEs = () => (spanish() && baseEs ? baseEs : null);

  function heading() {
    const es = worldEs();
    return `<div class="lab-expedition-banner"><p class="lab-expedition-kicker">${esc(lab.finale)} · ${T('kicker')} ${expedition.cycle+1}</p><h3>${bi(world.goal, es?.goal)}</h3><p>${bi(world.brief, es?.brief)}</p></div><div class="lab-expedition-world">${worldArt(world.theme,expedition.repaired,selected)}</div>`;
  }
  const placeName = (i) => bi(world.locations[i], worldEs()?.locations[i]);

  /** What the student built, in the model's own words: one line per restored location. */
  function logHtml() {
    const done = progress.solutions.filter((s) => expedition.repaired.includes(s.round));
    const rows = world.locations.map((name, i) => {
      const built = done.find((s) => s.round === i);
      if (!built) return `<li>${placeName(i)} — ${T('awaiting')}</li>`;
      let equation = '';
      try { equation = evaluate(lab.model, built.values).equation; } catch { /* a stale save: show the place only */ }
      const how = STRATEGIES.find(([k]) => k === expedition.strategy[i]);
      const n = expedition.tests[i] || 1;
      return `<li>${placeName(i)} — ${esc(equation)} · test ${n}${expedition.medals.includes(i) ? ` · ${T('badgeEarned')}` : ''}${how ? ` · ${bi(how[1], how[2])}` : ''}</li>`;
    });
    return `<details><summary>${T('fieldLog')} · ${expedition.medals.length} ${T('badges')}</summary><p>${T('badgeNote')}</p><ol>${rows.join('')}</ol></details>`;
  }

  function map() {
    selected=-1; delete expedition.active; save();
    const won = expedition.repaired.length===3;
    const attempts = Object.values(expedition.tests).reduce((a, n) => a + n, 0);
    const summary = won ? `<p class="lab-summary"><strong>${T('summary')}:</strong> ${expedition.medals.length}/3 ${T('badges')} · ${attempts} test${attempts === 1 ? '' : 's'}</p>` : '';
    stage.innerHTML = `<section class="lab-expedition">${heading()}<div class="lab-expedition-deck"><p class="lab-expedition-status" role="status">${won ? T('complete') : T('choose')} ${expedition.repaired.length}/3 ${T('restoredCount')}.</p>${summary}<div class="lab-expedition-sites">${world.locations.map((name,i)=>`<button type="button" data-site="${i}" ${expedition.repaired.includes(i)?'disabled':''}><span>${expedition.repaired.includes(i)?T('restoredWord'):`${T('destination')} ${i+1}`}</span><strong>${placeName(i)}</strong><small>${expedition.repaired.includes(i)?T('evidenceSaved'):T('planBuildRestore')}</small></button>`).join('')}</div>${won?`<div class="actions"><button type="button" data-replay>${T('replay')}</button>${choose?`<button type="button" class="quiet" data-other>${T('other')}</button>`:''}</div>`:''}${logHtml()}</div></section>`;
    stage.querySelectorAll('[data-site]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.site); expedition.active=selected;save();mission();stage.querySelector('[data-return]')?.focus({preventScroll:true});});
    stage.querySelector('[data-other]')?.addEventListener('click',()=>choose?.('match'));
    stage.querySelector('[data-replay]')?.addEventListener('click',()=>{expedition.repaired=[];expedition.medals=[];expedition.hints={};expedition.tests={};expedition.strategy={};expedition.cycle++;progress.rounds=0;progress.checks=0;progress.hints=0;progress.solutions=[];delete progress.puzzleValues;map();});
  }

  function mission() {
    const round = selected;
    // Difficulty follows the student: a clean restore (no hint, first test) raises the next puzzle, a struggle lowers it.
    // It rises with the student and stops at the top (it used to wrap round to the easiest). A replay changes the targets, not the level.
    const puzzleLevel = missionLevel(tier, expedition.adapt);
    const puzzleRound = (round + 3 * expedition.cycle) % 9;
    const challenge = puzzle(lab.model, puzzleRound, puzzleLevel);
    const isBalance=lab.model.kind==='balance',isMirror=lab.model.kind==='coordinates'&&['reflect','symmetry'].includes(lab.model.mode),isInequality=lab.model.kind==='inequality';
    const field = controls(lab.model)[challenge.free];
    const freeLabel = lab.labels?.controls?.[challenge.free]?.en || field.label;
    const freeLabelEs = lab.labels?.controls?.[challenge.free]?.es || esLabel(field.label);
    const metricEn = lab.labels?.readout?.en || challenge.metric;
    const metricEs = lab.labels?.readout?.es || esLabel(challenge.metric);
    const approximate=Math.abs(challenge.target-Number(challenge.target.toFixed(4)))>1e-8;
    const sideWord = round % 2 ? 'x' : 'y';
    const goal = isMirror ? bi(`Move A to the reflection of B across the ${sideWord}-axis.`, `Mueve A a la reflexión de B sobre el eje ${sideWord}.`)
      : isInequality ? bi(`Find a test value that ${round%2?'does not satisfy':'satisfies'} the rule.`, `Halla un valor de prueba que ${round%2?'no cumpla':'cumpla'} la regla.`)
      : isBalance ? bi('Make both sides equal. Only the candidate value of x can change.', 'Haz que ambos lados sean iguales. Solo puede cambiar el valor candidato de x.')
      : bi(`Make ${metricEn.toLowerCase()} ${approximate?'approximately':'equal'} ${fmt(challenge.target)}. Only one control is unlocked.`, `Haz que ${metricEs.toLowerCase()} sea ${approximate?'aproximadamente':'igual a'} ${fmt(challenge.target)}. Solo un control está desbloqueado.`);
    const soundOn = sound.enabled();
    stage.innerHTML=`<section class="lab-expedition">${heading()}<div class="lab-expedition-deck" data-level="${puzzleLevel}" data-round="${puzzleRound}"><div class="lab-expedition-bar"><button type="button" class="quiet" data-return>${T('back')}</button><button type="button" class="quiet" data-sound aria-pressed="${soundOn}">${soundOn?T('soundOn'):T('soundOff')}</button></div><div class="round-heading"><h3>${placeName(round)}</h3><p>${expedition.repaired.length}/3 ${T('restoredCount')}</p></div><p class="target">${goal}</p><p class="lab-plan">${T('plan')}</p><p class="goal-gap"></p><div class="puzzle-model"></div><div class="lab-trail" hidden></div><div class="actions"><button type="button" data-check>${T('test')}</button><button type="button" class="quiet" data-hint>${T('guide')}</button></div><p class="game-feedback" role="status"></p><div class="lab-strategy" hidden></div></div></section>`;
    const saved=progress.puzzleValues, status=stage.querySelector('.game-feedback'),gap=stage.querySelector('.goal-gap');
    const say = (en, es) => { status.innerHTML = bi(en, es); };
    let hintsThisMission=expedition.hints?.[round]||0,completed=false;
    // Before a test the student sees the GOAL, never how close the build is: closeness is only reported by a test.
    const inl = (en, es) => `${esc(en)}${spanish() && es ? ` / ${esc(es)}` : ''}`;
    const canChange = `${inl('You can change:', 'Puedes cambiar:')} ${inl(freeLabel, freeLabelEs)}`;
    gap.innerHTML = isBalance ? `${inl('Goal: both sides equal', 'Meta: ambos lados iguales')} · ${canChange}`
      : isMirror || isInequality ? T('planMove')
      : `${inl('Goal', 'Meta')}: ${inl(metricEn, metricEs)} = ${fmt(challenge.target)} · ${canChange}`;
    const model=mountModel(stage.querySelector('.puzzle-model'),lab.model,{initial:saved?.round===round?saved.values:challenge.start,free:challenge.free,prefix:'game',level,labels:lab.labels,lang:()=>spanish()?'es':'en',onChange:(values,result)=>{progress.puzzleValues={round,values};save();}});
    const toggle=stage.querySelector('[data-sound]');
    toggle.onclick=()=>{const next=!sound.enabled();sound.set(next);toggle.setAttribute('aria-pressed',String(next));toggle.innerHTML=next?T('soundOn'):T('soundOff');};
    const backToMap=()=>{map();stage.querySelector('[data-site]:not([disabled]),[data-replay]')?.focus({preventScroll:true});};
    stage.querySelector('[data-return]').onclick=backToMap;

    // Every test leaves a line the student can read back: the build, its equation, and which way it missed. Never the gap.
    expedition.trail ||= {};
    const trail = (expedition.trail[round] ||= []);
    const DIRS = { high: ['too high', 'demasiado alto'], low: ['too low', 'demasiado bajo'], miss: ['not yet', 'todavía no'], ok: ['✓ restored', '✓ restaurado'] };
    function drawTrail() {
      const box = stage.querySelector('.lab-trail');
      box.hidden = !trail.length;
      if (!trail.length) return;
      box.innerHTML = `<p><strong>${T('trailTitle')}</strong></p><ol>${trail.map((t) => `<li>${esc(t.equation)} — ${inl(...DIRS[t.dir])}</li>`).join('')}</ol>`;
    }
    drawTrail();

    // A ladder: a question, then the relationship, then a worked build with DIFFERENT numbers to map across. Only the third rung is heavy help.
    function neighbour() {
      if (isMirror || isInequality) return null;
      for (let d = 1; d < 9; d++) {
        const p2 = puzzle(lab.model, (puzzleRound + d) % 9, puzzleLevel);
        if (Math.abs(p2.goal[challenge.free] - challenge.goal[challenge.free]) > 1e-9) {
          try { return { value: p2.goal[challenge.free], equation: evaluate(lab.model, p2.goal).equation }; } catch { return null; }
        }
      }
      return null;
    }
    function rungs() {
      const relation = isMirror ? ['A reflection changes the sign of the coordinate perpendicular to the mirror. Keep the other coordinate.','Una reflexión cambia el signo de la coordenada perpendicular al espejo. Conserva la otra coordenada.']
        : isInequality ? ['Read the direction. Test the boundary and check whether equality is allowed.','Lee la dirección. Prueba el límite y revisa si se permite la igualdad.']
        : isBalance ? ['Use the inverse operation, then substitute your candidate back into the equation.','Usa la operación inversa y luego sustituye tu candidato en la ecuación.']
        : ['Read the model’s relationship. Predict whether the unlocked value should increase or decrease, then test one change.','Lee la relación del modelo. Predice si el valor desbloqueado debe aumentar o disminuir y luego prueba un cambio.'];
      const out = [pair('hint1'), relation];
      const n = neighbour();
      if (n) out.push([`A different build, different numbers: setting “${freeLabel}” to ${fmt(n.value)} makes the model show ${n.equation}. What relationship makes that true for your target?`, `Otra construcción, otros números: al poner “${freeLabelEs || freeLabel}” en ${fmt(n.value)} el modelo muestra ${n.equation}. ¿Qué relación hace que eso sea cierto para tu meta?`]);
      return out;
    }
    stage.querySelector('[data-hint]').onclick=()=>{
      hintsThisMission++;expedition.hints||={};expedition.hints[round]=hintsThisMission;progress.hints++;save();
      const shown=rungs().slice(0,Math.min(hintsThisMission,rungs().length));
      status.innerHTML=`<ol class="lab-hints">${shown.map(([en,es])=>`<li>${bi(en,es)}</li>`).join('')}</ol>`;
    };
    // What a failed test says: which way the build missed and what to rethink. Never the answer, never how far.
    function diagnose(result, n) {
      if(isBalance){const left=result.value>0;return [`Test ${n}: the left side is ${left?'greater':'less'} than the right side. Undo what was done to x, then test your value again.`, `Prueba ${n}: el lado izquierdo es ${left?'mayor':'menor'} que el derecho. Deshaz lo que se le hizo a x y vuelve a probar tu valor.`];}
      if(isMirror)return [`Test ${n}: A is not on the reflection yet. Which coordinate changes sign across this axis, and which stays the same?`, `Prueba ${n}: A todavía no está en la reflexión. ¿Qué coordenada cambia de signo en este eje y cuál se queda igual?`];
      if(isInequality){const wantPass=round%2===0;return [`Test ${n}: ${fmt(result.value)} ${result.pass?'satisfies':'does not satisfy'} the rule, but this location needs a value that ${wantPass?'satisfies':'does not satisfy'} it. Check the boundary and whether equality is allowed.`, `Prueba ${n}: ${fmt(result.value)} ${result.pass?'cumple':'no cumple'} la regla, pero este lugar necesita un valor que ${wantPass?'cumpla':'no cumpla'}. Revisa el límite y si se permite la igualdad.`];}
      const high=result.value>challenge.target;
      return [`Test ${n}: the build is ${high?'too high':'too low'}. Plan which way the unlocked control must move before you test again.`, `Prueba ${n}: la construcción está ${high?'demasiado alta':'demasiado baja'}. Planea hacia dónde debe moverse el control desbloqueado antes de probar de nuevo.`];
    }
    // Asked after EVERY restore (a hint is not a reason to skip it); the order turns with the destination so no answer is always first.
    function askStrategy() {
      const box=stage.querySelector('.lab-strategy');
      box.hidden=false;
      const k=(round+expedition.cycle)%STRATEGIES.length;
      const order=[...STRATEGIES.slice(k),...STRATEGIES.slice(0,k)];
      box.innerHTML=`<p>${T('howFound')}</p><div class="actions">${order.map(([key,en,es])=>`<button type="button" class="quiet" data-strategy="${key}" aria-pressed="${expedition.strategy[round]===key}">${bi(en,es)}</button>`).join('')}</div>`;
      box.querySelectorAll('[data-strategy]').forEach(b=>b.onclick=()=>{expedition.strategy[round]=b.dataset.strategy;save();box.querySelectorAll('[data-strategy]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));});
    }
    stage.querySelector('[data-check]').onclick=()=>{
      if(completed){backToMap();return;}
      if(!model.valid){status.innerHTML=T('fixInput');return;}
      progress.checks++;
      const attempts=(expedition.tests[round]||0)+1;
      expedition.tests[round]=attempts;
      let correct=Math.abs(model.result().value-challenge.target)<=challenge.tolerance;
      if(isMirror)correct=model.values.every((n,i)=>Math.abs(n-challenge.goal[i])<1e-8);
      if(isInequality)correct=model.result().pass===(round%2===0);
      emit('feedback',{correct});
      const tried=model.result();
      const dir=correct?'ok':isBalance||isMirror||isInequality?'miss':tried.value>challenge.target?'high':'low';
      trail.push({equation:tried.equation,dir});if(trail.length>12)trail.shift();drawTrail();
      if(!correct){save();emit('miss',{round,dir,attempts,control:freeLabel});const [en,es]=diagnose(tried,attempts);say(`${en} ${pair('safe')[0]}`,`${es} ${pair('safe')[1]}`);return;}
      completed=true;expedition.repaired.push(round);
      const clean=!hintsThisMission&&attempts===1;
      if(clean&&!expedition.medals.includes(round))expedition.medals.push(round);
      expedition.adapt=Math.max(-1,Math.min(2,(expedition.adapt||0)+(clean?1:attempts>=4||hintsThisMission>=3?-1:0)));
      if(hintsThisMission)expedition.strategy[round]||='guide';
      progress.solutions.push({round,values:[...model.values]});progress.rounds=expedition.repaired.length;delete progress.puzzleValues;delete expedition.active;save();
      stage.querySelector('.lab-expedition-world').innerHTML=worldArt(world.theme,expedition.repaired,round);
      sound.play(progress.rounds===3?'stamp':'hit');
      const name=world.locations[round], nameEs=worldEs()?.locations[round]||name;
      const when=attempts>1?` on test ${attempts}`:' on the first test', whenEs=attempts>1?` en la prueba ${attempts}`:' en la primera prueba';
      const how=clean?['Field badge earned.','Insignia de campo ganada.']:hintsThisMission?['You used your field guide and solved it.','Usaste tu guía de campo y lo resolviste.']:['Your plan worked after revising it.','Tu plan funcionó después de revisarlo.'];
      say(`${name} restored${when}. ${how[0]} Your construction is saved.`,`${nameEs} restaurado${whenEs}. ${how[1]} Tu construcción está guardada.`);
      const next=stage.querySelector('[data-check]');
      next.innerHTML=progress.rounds===3?T('seeWorld'):T('returnMap');
      next.focus({preventScroll:true});
      stage.querySelector('[data-hint]').disabled=true;
      askStrategy();
      if(progress.rounds===3)emit('complete',{correct:3,total:3,message:`${lab.finale}: all three locations restored.`});
    };
  }
  if(selected>=0)mission();else map();
}
