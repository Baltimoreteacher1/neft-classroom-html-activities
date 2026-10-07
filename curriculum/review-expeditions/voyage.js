/* Expedition traversal. Math stays in each game's existing checked content engine.
   Every voyage is deterministic and serializable; no timers, remote state, or dependencies. */
(() => {
  'use strict';
  const WORLDS = {
    1: { name: 'Starfall Rescue', biome: 'space', color: '#a8a3ff', ground: '#263556', mode: 'relay', vehicle: 'rover', item: 'star fragments', signal: 'navigation array', switchName: 'Satellite uplink', rule: 'Restore the satellite uplink to open the shortcut.', story: 'A scattered research fleet needs a route home. Chart a safe corridor through the floating islands.' },
    2: { name: 'Tidewater Survey', biome: 'sea', color: '#60ddce', ground: '#285a66', mode: 'tide', vehicle: 'boat', item: 'coral samples', signal: 'survey buoy', switchName: 'Tide control', rule: 'Lower the tide at the control to cross the causeway. The southern channel is always open.', story: 'The coast has gone quiet. Recover the missing survey buoys and bring the reef stations back online.' },
    3: { name: 'Expedition Meridian', biome: 'mountain', color: '#c9e298', ground: '#536050', mode: 'supply', vehicle: 'rover', item: 'trail markers', signal: 'observatory', switchName: 'Supply camp', rule: 'Collect a supply at camp. Crossing the mountain pass uses one supply; the valley route is free.', story: 'The observatory signal has failed. Carry survey instruments through the Alder Range and reconnect the summit.' },
    4: { name: 'The Hundred Lanterns', biome: 'lantern', color: '#ffc774', ground: '#6b4563', mode: 'light', vehicle: 'walker', item: 'lantern shards', signal: 'lantern tower', switchName: 'Spark shrine', rule: 'Collect a spark at the shrine. The shadow gate uses one spark; the garden path is always open.', story: 'A city of lanterns is losing its light. Follow the canal paths and reignite the towers before the festival.' },
    5: { name: "The Architect’s Vault", biome: 'ruins', color: '#e9c781', ground: '#685b46', mode: 'bridge', vehicle: 'walker', item: 'blueprint pieces', signal: 'vault seal', switchName: 'Bridge crank', rule: 'Turn the crank to align the bridge. Choose the upper bridge or explore the lower ruins.', story: 'An ancient city has folded into a maze. Recover its blueprints and reconnect the paths to the Architect’s Vault.' },
    6: { name: 'The Clockwork Foundry', biome: 'factory', color: '#f5b283', ground: '#5e5651', mode: 'gear', vehicle: 'rover', item: 'machine parts', signal: 'power core', switchName: 'Gear lever', rule: 'Shift the lever to power the eastbound belt. The service tunnel bypasses the belt.', story: 'The foundry’s machines have fallen out of sync. Salvage the missing parts and restart each power core.' },
    7: { name: 'Polar Station Zero', biome: 'ice', color: '#9bdcf5', ground: '#4e6f80', mode: 'ice', vehicle: 'rover', item: 'research capsules', signal: 'rescue beacon', switchName: 'Grip station', rule: 'Ice carries you one extra tile. Visit the grip station to stop exactly where you choose.', story: 'A polar storm scattered the research team. Traverse the ice shelf, find their capsules, and restore the rescue beacons.' },
    8: { name: 'The Balance Keepers', biome: 'sky', color: '#c6b8ff', ground: '#665b87', mode: 'balance', vehicle: 'walker', item: 'balance crystals', signal: 'balance engine', switchName: 'Counterweight dock', rule: 'Pick up a counterweight to open the balance bridge. Drop it at the dock to close the bridge again.', story: 'The floating sanctuaries are drifting apart. Carry counterweights through the sky gardens to stabilize the engines.' },
    9: { name: 'Skyline Relay', biome: 'city', color: '#91e7dc', ground: '#355b67', mode: 'relay', vehicle: 'rover', item: 'signal chips', signal: 'relay mast', switchName: 'Relay switch', rule: 'Activate the local relay to power the express link. The street route stays open.', story: 'The city’s transit network has lost its signal. Reconnect rooftop relays and send the final message across the skyline.' },
    10: { name: 'Atlas Frontier', biome: 'forest', color: '#b5df94', ground: '#526c4c', mode: 'bridge', vehicle: 'walker', item: 'atlas pages', signal: 'frontier beacon', switchName: 'Trail bridge', rule: 'Align the trail bridge for a shortcut, or explore the lower forest for lost atlas pages.', story: 'The last pages of the Atlas are scattered beyond the frontier. Rebuild the trail and bring the map home.' },
    placement: { name: 'The Lost Compass', biome: 'space', color: '#f4d58d', ground: '#435474', mode: 'relay', vehicle: 'airship', item: 'compass fragments', signal: 'compass station', switchName: 'Wind relay', rule: 'Switch on the wind relay to open an air lane. Explore either route; every station reveals one math topic.', story: 'Eleven compass stations have drifted off course. Pilot the survey ship, chart your strengths, and discover your next destination.' },
  };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const ICONS = {
    gem: '<path d="m12 2 8 7-8 13L4 9Z"/><path d="m4 9 8 3 8-3M12 2v20"/>',
    beacon: '<path d="M8 22h8M10 22V9h4v13M6 7a8 8 0 0 1 12 0M3 4a12 12 0 0 1 18 0"/><circle cx="12" cy="7" r="2"/>',
    switch: '<path d="M4 17h16v5H4ZM12 17V8l6-5"/><circle cx="18" cy="3" r="2"/>',
    gate: '<path d="M3 20V5h4v15M17 20V5h4v15M7 9h10M7 15h10"/>',
    rescue: '<path d="M5 9h14v12H5ZM3 9l9-7 9 7M10 21v-7h4v7"/>',
    boat: '<path d="m2 15 3 6h14l3-6H2ZM12 15V2L4 12h8M14 5l5 7h-5"/>',
    rover: '<path d="M4 9h16v10H4ZM7 9l2-5h6l2 5M8 13h8"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/>',
    walker: '<circle cx="12" cy="5" r="3"/><path d="m5 14 5-5h4l5 5M12 9v7m-5 6 5-6 5 6"/>',
    airship: '<ellipse cx="12" cy="9" rx="10" ry="6"/><path d="m7 14 2 5h6l2-5M8 22h8M12 3v12"/>',
    flag: '<path d="M5 22V2l14 4-14 5"/>',
  };
  function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.gem}</svg>`; }
  function createState(seed) { return { version: 1, seed: Number(seed) >>> 0, stage: -1, x: 0, y: 2, moves: 0, totalMoves: 0, on: false, supply: 0, collected: [], rescued: [], opened: [], visited: [], entered: -1, awards: [], seals: [], completed: 0 }; }
  function prepare(state, stage) {
    if (state.stage === stage) return;
    state.stage = stage; state.x = 0; state.y = 2; state.moves = 0; state.on = false;
    state.supply = 0; state.collected = []; state.visited = ['0,2']; state.entered = -1;
  }
  function terrain(state, world) {
    // All boards have a safe alternate route. Upper routes require the world's mechanic.
    const path = new Set(['0,2', '1,2', '2,2', '3,2', '4,2', '5,2', '6,2', '7,2', '8,2', '1,1', '2,1', '3,1', '4,1', '5,1', '6,1', '7,1', '1,3', '2,3', '3,3', '4,3', '5,3', '6,3', '7,3', '3,0', '6,4']);
    const variation = (state.seed + state.stage) % 3;
    if (variation === 1) path.delete('5,1');
    if (variation === 2) path.delete('2,2');
    return { path, switchAt: '3,1', gateAt: '4,2', gems: ['3,0', '6,4'], rescueAt: '7,1', signalAt: '8,2', ice: world.mode === 'ice' ? ['2,2', '5,2', '4,3'] : [] };
  }
  function gateOpen(state, world) { return world.mode === 'ice' || (['supply','light'].includes(world.mode) ? state.supply > 0 || state.on : state.on); }
  function sceneArt(world, stage) {
    const skyline = world.biome === 'city';
    const sea = world.biome === 'sea';
    const stars = Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 139 + 43) % 900}" cy="${(i * 71 + 13) % 180}" r="${i % 3 === 0 ? 2 : 1}" fill="${world.color}" opacity=".38"/>`).join('');
    let features = skyline ? Array.from({length:12}, (_, i) => `<rect x="${i*85-25}" y="${110+(i*37)%100}" width="65" height="210" fill="${i%2?'#182d41':'#1c3447'}"/><path d="M${i*85-3} ${135+(i*37)%100}v90m20-90v90" stroke="${world.color}" stroke-width="5" stroke-dasharray="5 13" opacity=".3"/>`).join('') : `<path d="M0 260 150 95 245 207 360 45 525 245 635 107 820 260 940 120V450H0Z" fill="#1c3447"/><path d="m292 127 68-82 63 80-58-18Z" fill="${world.biome==='ice'?'#bce9ee':'#355168'}" opacity=".5"/><path d="M0 310Q140 220 290 300T600 280T900 310V450H0Z" fill="${sea?'#165768':'#273c4a'}"/>`;
    const silhouettes = {
      sea: `<path d="M0 150Q140 110 300 150T600 150T950 150V450H0Z" fill="#124755"/><path d="M0 185Q90 158 180 185T360 185T540 185T720 185T950 185M0 255Q100 230 200 255T400 255T600 255T950 255" fill="none" stroke="#76c6c9" stroke-width="3" opacity=".3"/><path d="m670 90 20 36h80l20-36ZM730 90V20l-50 58h50" fill="#20424b"/><path d="M70 430v-90m0 25-25-25m25 0 30-25M820 430v-70m0 30 35-25" stroke="#578977" stroke-width="10" fill="none"/>`,
      lantern: `<path d="M0 295 60 258l70 37 70-48 70 48 100-52 100 52 100-42 100 42 100-50 100 50V440H0" fill="#372943"/><path d="M0 50Q250 100 500 50T900 50" stroke="#b8875b" fill="none"/>${[100,280,470,690,830].map((x,i)=>`<path d="M${x} 65v${20+i%2*15}" stroke="#deb97b"/><rect x="${x-11}" y="${85+i%2*15}" width="22" height="35" rx="9" fill="#ffc26c" opacity=".6"/><path d="M${x} ${120+i%2*15}v9" stroke="#ffc26c"/>`).join('')}`,
      ruins: `<path d="M0 400V210h170v190M230 400V180h130v220M615 400V180h170v220" fill="#3d393b"/>${[120,220,660,780].map(x=>`<path d="M${x} 330V110h32v220M${x-9} 100h50v20M${x-9} 330h50" fill="#756653" stroke="#93836c" stroke-width="4"/>`).join('')}<path d="M90 98 205 35 319 98ZM628 98 730 38 830 98Z" fill="#51463f"/>`,
      factory: `<path d="M0 430V170h110V80h35v100h70v-45h65v295M600 430V120h90v40h45V75h38v100h140v255" fill="#333f46"/><path d="M0 205H900M0 300H900" stroke="#826253" stroke-width="9"/>${[95,755].map((x,i)=>`<circle cx="${x}" cy="${130+i*10}" r="57" fill="#1f323c" stroke="#756654" stroke-width="20" stroke-dasharray="13 7"/><circle cx="${x}" cy="${130+i*10}" r="23" fill="none" stroke="#e5ba7c" stroke-width="4" opacity=".6"/>`).join('')}`,
      sky: `<path d="M0 140Q150 90 280 140T560 140T900 140M0 330Q180 270 340 330T680 330T1000 330" fill="none" stroke="#92a1c2" stroke-width="30" opacity=".12"/>${[100,720].map((x,i)=>`<path d="m${x-55} ${140+i*20} 110 0-50 75Z" fill="#455166"/><ellipse cx="${x}" cy="${140+i*20}" rx="55" ry="12" fill="#77938b"/><path d="M${x-12} ${140+i*20}v-65l12-20 12 20v65" fill="#a39ac4"/>`).join('')}`,
      forest: `${[55,155,295,630,780,880].map((x,i)=>`<path d="M${x} 350V110" stroke="#405447" stroke-width="19"/><path d="m${x-70} 200 70-${140+i%2*25} 70 ${140+i%2*25}Z" fill="${i%2?'#365846':'#2a483d'}"/>`).join('')}<path d="M0 370Q200 300 400 370T900 360V450H0Z" fill="#3b5945"/>`,
      space: `<circle cx="725" cy="105" r="65" fill="#534f7b"/><ellipse cx="725" cy="105" rx="100" ry="19" fill="none" stroke="#a699b9" stroke-width="8" transform="rotate(-18 725 105)" opacity=".45"/>${[50,260,670,820].map((x,i)=>`<path d="m${x} ${220+i%2*80} 46-28 44 24-12 38-49 8Z" fill="#344358"/>`).join('')}`,
    };
    if (silhouettes[world.biome]) features = silhouettes[world.biome];
    return `<svg class="voyage-landscape" viewBox="0 0 900 430" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${stars}<circle cx="760" cy="88" r="42" fill="${world.color}" opacity=".16"/>${features}<path d="M0 360Q180 310 330 370T670 345T940 360" fill="none" stroke="${world.color}" opacity=".13" stroke-width="25"/></svg>`;
  }
  function mount({ host, unit, stage, total, title, state, onSave, onEnter, focus = true }) {
    const placementStops = [1, 10, 6, 3, 4, 5, 6, 8, 2, 7, 5];
    const destination = WORLDS[placementStops[stage % placementStops.length]];
    const world = unit === 'placement'
      ? { ...destination, name: 'The Lost Compass · ' + destination.name, vehicle: 'airship', item: 'compass fragments' }
      : WORLDS[unit] || WORLDS[1];
    prepare(state, stage);
    const map = terrain(state, world);
    let message = `Reach the ${world.signal}. Explore for ${world.item} and rescue the scout.`;
    let destroyed = false;
    host.innerHTML = `<section class="voyage" style="--voyage-accent:${world.color};--voyage-ground:${world.ground}" aria-label="${esc(world.name)} expedition"><header class="voyage-header"><div><p class="voyage-kicker">FIELD EXPEDITION / SECTOR ${stage+1} OF ${total}</p><h2>${esc(world.name)}</h2><p>${esc(title || world.story)}</p></div><div class="voyage-inventory" aria-label="Expedition inventory"></div></header><div class="voyage-playfield">${sceneArt(world, stage)}<div class="voyage-grid" role="group" aria-label="Travel map. Choose a tile to travel along a safe path. Use arrow keys for one step." tabindex="0"></div><div class="voyage-sector" aria-hidden="true">${String(stage+1).padStart(2,'0')}<small>${esc(world.biome.toUpperCase())}</small></div></div><div class="voyage-lower"><div class="voyage-mission"><span class="voyage-kicker">YOUR NEXT MOVE</span><p class="voyage-message" role="status" aria-live="polite"></p><p class="voyage-rule">${esc(world.rule)}</p></div><div class="voyage-controls"><button type="button" data-move="0,-1" aria-label="Move north">↑</button><button type="button" data-move="-1,0" aria-label="Move west">←</button><button type="button" data-move="0,1" aria-label="Move south">↓</button><button type="button" data-move="1,0" aria-label="Move east">→</button></div></div><div class="voyage-footer"><span class="voyage-help">Click a tile to travel · arrow keys to step · progress saves locally</span><button type="button" class="voyage-enter" disabled>Reach the ${esc(world.signal)}</button><button type="button" class="voyage-focus">Focus on math</button></div></section>`;
    const root = host.querySelector('.voyage');
    const grid = root.querySelector('.voyage-grid');
    const tileButtons = new Map();
    for (let y=0;y<5;y++) for (let x=0;x<9;x++) {
      const key = `${x},${y}`;
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.tile = key; button.className = 'voyage-tile';
      button.style.gridColumn = String(x+1); button.style.gridRow = String(y+1);
      if (!map.path.has(key)) { button.classList.add('voyage-void'); button.disabled = true; button.setAttribute('aria-hidden', 'true'); }
      else { button.addEventListener('click', () => travel(x,y)); tileButtons.set(key,button); }
      grid.append(button);
    }
    function save() { onSave?.(state); }
    function draw() {
      if (destroyed) return;
      const player = `${state.x},${state.y}`;
      for (const [key, button] of tileButtons) {
        let type = '', label = 'Trail', text = '';
        if (key === '0,2') { type='flag'; label='Landing'; }
        if (key===map.switchAt) {type='switch';label=world.switchName+(state.on?' · active':'');}
        if (key===map.gateAt) {type='gate';label=gateOpen(state,world)?'Shortcut open':'Shortcut closed';}
        if (map.gems.includes(key) && !state.collected.includes(key)) {type='gem';label=world.item;}
        if (key===map.rescueAt && !state.rescued.includes(stage)) {type='rescue';label='Scout shelter';}
        if (key===map.signalAt) {type='beacon';label=world.signal;text='GOAL';}
        if (map.ice.includes(key)) label='Ice · slides one extra step';
        button.className = `voyage-tile${state.visited.includes(key)?' is-visited':''}${type?' is-'+type:''}${key===map.gateAt&&!gateOpen(state,world)?' is-closed':''}${key===player?' is-player':''}${map.ice.includes(key)?' is-ice':''}`;
        button.innerHTML = `${type?icon(type):'<span class="voyage-track"></span>'}${text?`<small>${text}</small>`:''}${key===player?`<span class="voyage-player">${icon(world.vehicle)}</span>`:''}`;
        button.setAttribute('aria-label', `${label}, column ${Number(key[0])+1}, row ${Number(key[2])+1}${key===player?', your location':''}`);
        button.setAttribute('aria-current', key===player?'location':'false');
      }
      root.querySelector('.voyage-inventory').innerHTML = `<span>${icon('gem')} <b>${state.awards.length+state.collected.length}</b> finds</span><span>${icon('rescue')} <b>${state.rescued.length}</b> rescues</span><span><b>${state.moves}</b> moves</span>`;
      root.querySelector('.voyage-message').textContent = message;
      const enter = root.querySelector('.voyage-enter');
      enter.disabled = player!==map.signalAt;
      enter.textContent = player===map.signalAt ? `Activate ${world.signal} →` : `Reach the ${world.signal}`;
    }
    function canStep(x,y) { const key=`${x},${y}`; return map.path.has(key) && (key!==map.gateAt || gateOpen(state,world)); }
    function arrive(x,y,dx,dy,slide=true) {
      if (window.GameStudio?.paused) return false;
      if (!canStep(x,y)) { message=`The shortcut is closed. Visit the ${world.switchName.toLowerCase()} or take the lower trail.`; draw(); return false; }
      state.x=x; state.y=y; state.moves++; state.totalMoves++;
      const key=`${x},${y}`;
      if (!state.visited.includes(key)) state.visited.push(key);
      message=`Charting the route to the ${world.signal}.`;
      if (key===map.switchAt) {
        if (['supply','light'].includes(world.mode)) { state.supply=1; state.on=true; message=`${world.mode==='light'?'Spark':'Supply'} collected. The shortcut is ready.`; }
        else { state.on=true; message=`${world.switchName}: ${state.on?'active':'reset'}. ${world.mode==='ice'?(state.on?'Grip enabled. You now stop on ice.':'Grip disabled. Ice slides one extra tile.'):(state.on?'The shortcut is open.':'Use the lower route, or visit again to reopen it.')}`; }
      }
      if (key===map.gateAt && ['supply','light'].includes(world.mode) && state.supply>0) { state.supply--; message='Supply used. You secured the crossing for this sector.'; }
      if (map.gems.includes(key) && !state.collected.includes(key)) { state.collected.push(key); message=`Found ${world.item}! Both optional finds earn an Explorer seal.`; }
      if (key===map.rescueAt && !state.rescued.includes(stage)) { state.rescued.push(stage); message='Scout rescued. The rescue is recorded in your expedition journal.'; }
      if (key===map.signalAt) message=`Signal reached. Activate the ${world.signal} with your next math challenge.`;
      if (slide && map.ice.includes(key) && !state.on && canStep(x+dx,y+dy)) { arrive(x+dx,y+dy,dx,dy,false); message='The ice carried you one extra tile. The grip station gives you precise control.'; }
      save(); draw(); return true;
    }
    function travel(x,y) {
      if (destroyed || window.GameStudio?.paused) return;
      if (x===state.x&&y===state.y) {
        if (`${x},${y}`===map.signalAt) enter();
        else if (`${x},${y}`===map.switchAt && !['supply','light'].includes(world.mode)) {
          state.on=!state.on; message=world.switchName+': '+(state.on?'active.':'reset. Choose the lower trail or switch on again.'); save();draw();
        }
        return;
      }
      const queue=[[state.x,state.y,[]]], seen=new Set([`${state.x},${state.y}`]); let route=null;
      while(queue.length) { const [px,py,steps]=queue.shift(); if(px===x&&py===y) {route=steps;break;}
        for(const [dx,dy] of [[1,0],[0,-1],[0,1],[-1,0]]) {const nx=px+dx,ny=py+dy,key=`${nx},${ny}`;if(!seen.has(key)&&canStep(nx,ny)){seen.add(key);queue.push([nx,ny,steps.concat([[nx,ny,dx,dy]])]);}}
      }
      if(!route) {message=`No open path yet. Use the ${world.switchName.toLowerCase()} or choose the lower trail.`;draw();return;}
      // Route navigation follows the selected trail exactly. Ice physics apply to manual steps.
      for(const [nx,ny,dx,dy] of route) {if(!arrive(nx,ny,dx,dy,false))break;}
    }
    function enter() { if(destroyed || window.GameStudio?.paused)return; state.entered=stage; save(); destroy(); onEnter(); }
    function keydown(event) {
      if (event.target.closest('input,textarea,select,dialog,[contenteditable="true"]') || event.altKey || event.ctrlKey || event.metaKey) return;
      const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
      if(dirs[event.key]) {event.preventDefault();event.stopPropagation();const [dx,dy]=dirs[event.key];arrive(state.x+dx,state.y+dy,dx,dy);}
    }
    root.addEventListener('keydown',keydown);
    root.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>{const [dx,dy]=b.dataset.move.split(',').map(Number);arrive(state.x+dx,state.y+dy,dx,dy);}));
    root.querySelector('.voyage-enter').addEventListener('click',enter);
    root.querySelector('.voyage-focus').addEventListener('click',enter);
    function destroy(){destroyed=true;root.removeEventListener('keydown',keydown);host.replaceChildren();}
    draw();save();if(focus)grid.focus({preventScroll:true});
    return {destroy,travel,state};
  }
  function completeStage(state, stage) {
    if (!state || state.completed>stage) return;
    state.seals = state.seals || [];
    if (state.collected.length === 2 && !state.seals.includes(stage)) state.seals.push(stage);
    state.collected.forEach(key=>{const id=`${stage}:${key}`;if(!state.awards.includes(id))state.awards.push(id);});
    state.collected=[]; state.completed=stage+1;
  }
  function summary(state) {
    if(!state)return '';
    const finds=state.awards.length+state.collected.length;
    const seals=(state.seals || []).length;
    return `${finds} finds recovered · ${state.rescued.length} scouts rescued · ${seals} Explorer seals · ${state.totalMoves} trail moves`;
  }
  function archive(state) {
    const totals = { finds: 0, rescues: 0, seals: 0 };
    Object.values(state.zones || {}).forEach(zone => Object.values(zone.missions || {}).forEach(mission => {
      const v = mission.voyage;
      if (v) { totals.finds += v.finds || 0; totals.rescues += v.rescues || 0; totals.seals += v.seals || 0; }
    }));
    const rank = totals.seals >= 20 ? 'Expedition Captain' : totals.seals >= 10 ? 'Pathfinder' : totals.seals >= 5 ? 'Navigator' : totals.seals >= 1 ? 'Scout' : 'Pathmaker';
    return `<div class="voyage-journal"><b>Field journal · ${rank}</b><br>${totals.finds} finds · ${totals.rescues} rescues · ${totals.seals} Explorer seals<span class="voyage-rank-track">Collect both finds in a sector to earn a seal. Ranks unlock at 1, 5, 10, and 20 seals. Replay missions to improve your journal.</span></div>`;
  }
  window.ExpeditionVoyage={WORLDS,createState,mount,completeStage,summary,archive};
})();
