/* Persistent, success-driven expeditions for the eleven native flagship games.
 * Each world has a different construction puzzle; progress is reported by the
 * native engine only after its own answer validator accepts a move. */
(() => {
  'use strict';
  const worlds = {
    'unit2-fraction-kitchen': { id: 'kitchen', title: 'The Lantern Orchard', role: 'Expedition chef', story: 'A floating orchard has gone dark. Fill the festival lanterns with carefully measured fruit nectar.', sites: ['Applewood Landing', 'The Glass Conservatory', 'Moonberry Canopy', 'The Lantern Festival'], routes: ['Picnic trail', 'Banquet trail'], reward: 'Lantern', color: '#edb590' },
    'unit2-fraction-foundry': { id: 'foundry', title: 'The Emberworks', role: 'Bridge forger', story: 'Reconnect the mountain villages. Forge the exact pieces each suspended bridge needs.', sites: ['Copper Gate', 'Obsidian Crossing', 'The Sky Foundry', 'Sunrise Bridge'], routes: ['Single-piece forge', 'Bundle forge'], reward: 'Bridge span', color: '#f3bc6c' },
    '6-rp-1game': { id: 'ratio', title: 'The Tideglass Isles', role: 'Reef alchemist', story: 'The island gardens need new water filters. Blend the mineral mixtures that revive each reef.', sites: ['Coral Dock', 'Jade Lagoon', 'The Floating Garden', 'Tideglass Beacon'], routes: ['Coastal blend', 'Deep-water blend'], reward: 'Reef crystal', color: '#8cdac5' },
    'unit3-ratio-rally': { id: 'rally', title: 'The Horizon Expedition', role: 'Trail navigator', story: 'Carry supplies across four remote passes. Plan each journey with the right fuel and water.', sites: ['Juniper Outpost', 'Amber Canyon', 'Cloudline Pass', 'The Horizon Observatory'], routes: ['Valley route', 'Mountain route'], reward: 'Trail marker', color: '#dcc095' },
    'unit4-discount-dash': { id: 'discount', title: 'The Night Market Rescue', role: 'Supply captain', story: 'Power a stranded research team. Build an affordable cargo of solar cells from market offers.', sites: ['Paper Lantern Pier', 'The Rooftop Bazaar', 'Crescent Exchange', 'Research Camp'], routes: ['Supply run', 'Long-range delivery'], reward: 'Supply cache', color: '#dab7ec' },
    'unit5-area-architect': { id: 'area', title: 'The Verdant City', role: 'Restoration architect', story: 'Rebuild a city around its gardens. Fit useful buildings and green space into each district.', sites: ['Riverbank Quarter', 'The Orchard Terrace', 'Canopy Library', 'The Living Skyline'], routes: ['Garden district', 'Library district'], reward: 'Green district', color: '#b8dea3' },
    'unit6-expression-engine': { id: 'expression', title: 'The Clockwork Wilds', role: 'Circuit engineer', story: 'A forgotten machine forest is waking. Rewire its signal engines to restore the ecosystem.', sites: ['Mosslight Station', 'The Gear Grove', 'Cloud Pump', 'The Heart Engine'], routes: ['Growth circuit', 'Energy circuit'], reward: 'Power core', color: '#8ddac8' },
    'unit7-equation-escape': { id: 'equation', title: 'The Atlas Temple', role: 'Balance keeper', story: 'Recover a lost atlas from a temple of counterweights. Every gate opens only when both sides stay balanced.', sites: ['The Echo Vestibule', 'Counterweight Hall', 'The Mirror Archive', 'Atlas Chamber'], routes: ['Stone gate', 'Crystal gate'], reward: 'Atlas fragment', color: '#d6c082' },
    'unit9-variable-velocity': { id: 'variable', title: 'The Aurora Relay', role: 'Starship navigator', story: 'Reconnect the research satellites. Plot safe relay coordinates using each sector’s signal rule.', sites: ['Orbit One', 'The Violet Belt', 'Aurora Crossing', 'Deep-Space Relay'], routes: ['Direct signal', 'Boosted signal'], reward: 'Relay beacon', color: '#bfaef0' },
    'unit10-volume-vault': { id: 'volume', title: 'The Abyssal Archive', role: 'Deep-sea engineer', story: 'Rescue the ocean’s lost records. Build watertight cargo pods that fit the submarine’s compartments.', sites: ['Sunlit Shelf', 'The Kelp Cathedral', 'Midnight Trench', 'The Abyssal Archive'], routes: ['Tall cargo bay', 'Wide cargo bay'], reward: 'Archive capsule', color: '#8edde2' },
    'unit8-stats-slam': { id: 'stats', title: 'The Skycourt League', role: 'Team analyst', story: 'Guide an underdog team through a sky-island league. Use the evidence to investigate unusual performances.', sites: ['Harbor Court', 'The Windmill Arena', 'Cloudbank Stadium', 'The Summit Final'], routes: ['Home scout', 'Away scout'], reward: 'League pennant', color: '#f4c58d' },
  };
  const parts = location.pathname.split('/').filter(Boolean);
  const slug = (parts.at(-1) === 'index.html' ? parts.at(-2) : parts.at(-1)).replace('.html', '');
  const world = worlds[slug];
  const panel = document.querySelector('.flagship-mission');
  if (!world || !panel) return;
  const storageKey = `ewl.flagship.expedition.v1.${world.id}`;
  const bounded = (value, max) => Number.isInteger(value) && value >= 0 && value <= max ? value : 0;
  let stored = {};
  try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); if (value && typeof value === 'object') stored = value; } catch {}
  const state = { site: bounded(stored.site, 4), steps: bounded(stored.steps, 4), route: bounded(stored.route, 1), chapter: bounded(stored.chapter, 999), relics: bounded(stored.relics, 9999), firstTry: bounded(stored.firstTry, 99999) };
  const target = () => state.route ? 4 : 3;
  state.steps = Math.min(state.steps, target());
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {} };
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
  const button = (text, action, className = '') => { const node = el('button', className, text); node.type = 'button'; node.addEventListener('click', action); return node; };
  const section = el('section', 'adventure-world');
  section.setAttribute('aria-label', `${world.title} expedition`);
  section.style.setProperty('--expedition-color', world.color);
  section.style.setProperty('--expedition-art', `url('/math/games/shared/adventure-worlds/${world.id}.svg')`);
  section.dataset.world = world.id;
  const banner = el('div', 'adventure-banner');
  const intro = el('div', 'adventure-intro');
  intro.append(el('span', 'adventure-eyebrow', world.role), el('h2', '', world.title), el('p', '', world.story));
  const medal = el('div', 'adventure-medal');
  banner.append(intro, medal);
  const map = el('ol', 'adventure-map');
  const destination = el('div', 'adventure-destination');
  const missionTitle = el('h3');
  const briefing = el('p');
  const routes = el('div', 'adventure-routes'); routes.setAttribute('role', 'group'); routes.setAttribute('aria-label', 'Choose your expedition route');
  world.routes.forEach((label, index) => routes.append(button(label, () => { if (state.steps || state.site === 4) return; state.route = index; save(); render(); })));
  const progress = el('div', 'adventure-meter');
  progress.setAttribute('role', 'progressbar'); progress.setAttribute('aria-label', 'Fieldwork completed'); progress.setAttribute('aria-valuemin', '0');
  progress.append(el('span'));
  const enter = button('Enter the mission site', openPuzzle, 'adventure-enter');
  const status = el('p', 'adventure-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  destination.append(missionTitle, briefing, routes, progress, enter, status);
  section.append(banner, map, destination);
  panel.before(section);
  panel.querySelector('.fm-eyebrow').textContent = 'FIELDWORK • BUILD YOUR SKILLS';
  const details = el('details', 'adventure-fieldwork');
  details.append(el('summary', '', 'Mission controls and accessible game controls'));
  // Keep the launch controls visible; collapse only the redundant mirror controls.
  for (const item of [...panel.querySelectorAll('.fm-stats,.fm-question,.fm-actions,.fm-feedback,.fm-progress')]) details.append(item);
  panel.append(details);
  details.open = matchMedia('(max-width: 700px)').matches;
  panel.querySelector('#fm-start').addEventListener('click', () => {
    section.classList.add('is-playing');
    document.body.classList.add('adventure-playing');
    const stage = document.querySelector('.flagship-stage');
    if (stage && window.__flagshipGame) stage.style.setProperty('--native-ratio', String(window.__flagshipGame.config.width / window.__flagshipGame.config.height));
    requestAnimationFrame(() => { window.__flagshipGame?.scale.refresh(); panel.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }); 

  const dialog = el('dialog', 'adventure-dialog');
  dialog.setAttribute('aria-labelledby', 'adventure-puzzle-title');
  dialog.style.setProperty('--expedition-color', world.color);
  document.body.append(dialog);
  let wasPaused = false;
  let returnFocus = null;
  let puzzle = null;
  dialog.addEventListener('close', () => { if (!wasPaused && window.GameStudio?.paused) window.GameStudio.resume(); returnFocus?.focus({ preventScroll: true }); });
  // Phaser shortcuts must never process input intended for the construction puzzle.
  ['keydown', 'keyup'].forEach(name => dialog.addEventListener(name, event => event.stopPropagation()));
  function render() {
    medal.replaceChildren(el('strong', '', String(state.relics)), el('span', '', `${world.reward}${state.relics === 1 ? '' : 's'} restored`));
    map.replaceChildren(...world.sites.map((name, index) => { const node = el('li', index < state.site ? 'is-complete' : index === state.site ? 'is-current' : ''); node.append(el('span', 'adventure-node', index < state.site ? '✓' : String(index + 1)), el('span', '', name)); if (index === state.site) node.setAttribute('aria-current', 'step'); return node; }));
    const finished = state.site === 4;
    missionTitle.textContent = finished ? `${world.title} restored` : world.sites[state.site];
    briefing.textContent = finished ? 'Your expedition is complete. Return with a new route and new mission numbers to earn another collection.' : `Solve ${target()} challenges in the game below, then enter this site for a hands-on mission. ${state.route ? 'The longer route earns two relics.' : 'The shorter route earns one relic.'}`;
    routes.querySelectorAll('button').forEach((b, index) => { b.setAttribute('aria-pressed', String(index === state.route)); b.disabled = state.steps > 0 || finished; });
    progress.setAttribute('aria-valuemax', String(target())); progress.setAttribute('aria-valuenow', String(state.steps));
    progress.firstChild.style.width = `${100 * state.steps / target()}%`;
    enter.disabled = !finished && state.steps < target();
    enter.textContent = finished ? 'Begin a new expedition' : state.steps >= target() ? `Enter ${world.sites[state.site]}` : `${state.steps} / ${target()} fieldwork challenges complete`;
    updateWorldBeacons();
  }
  function record(detail = {}) {
    if (state.site === 4 || dialog.open || state.steps >= target()) return;
    state.steps++;
    if (detail.firstTry) state.firstTry++;
    save(); render();
    status.textContent = state.steps === target() ? `${world.sites[state.site]} is ready. Enter the mission site when you are ready.` : `${world.reward} energy collected. ${target() - state.steps} more successful challenges open the site.`;
  }
  // These calls live inside each native success branch, after its locked guard.
  window.FlagshipAdventure = Object.freeze({ record, get route() { return state.route; }, get progress() { return { ...state }; } });

  function openPuzzle() {
    if (state.site === 4) { state.site = 0; state.steps = 0; state.chapter++; state.route = 1 - state.route; save(); render(); status.textContent = 'A new expedition is ready. Choose your route, then launch the game.'; return; }
    if (state.steps < target() || dialog.open) return;
    returnFocus = document.activeElement;
    wasPaused = !!window.GameStudio?.paused;
    if (!wasPaused) window.GameStudio?.pause();
    dialog.replaceChildren();
    const header = el('div', 'adventure-dialog-header');
    const title = el('h2', '', world.sites[state.site]); title.id = 'adventure-puzzle-title';
    header.append(title, button('Back to fieldwork', () => dialog.close(), 'adventure-close'));
    const instruction = el('p', 'adventure-instruction');
    const visual = el('div', 'adventure-puzzle-visual');
    const controls = el('div', 'adventure-puzzle-controls');
    const feedback = el('p', 'adventure-puzzle-feedback'); feedback.setAttribute('role', 'status');
    puzzle = window.FlagshipPuzzles.create(world.id, state.site + state.chapter * 4, state.route);
    instruction.textContent = puzzle.text;
    const values = puzzle.fields.map(field => field.value ?? field.min ?? 0);
    const redraw = () => { visual.innerHTML = puzzle.draw(values); };
    puzzle.fields.forEach((field, index) => {
      const group = el('div', 'adventure-control');
      const label = el('label', '', field.label); label.htmlFor = `expedition-input-${index}`;
      let input;
      if (field.options) {
        input = el('select');
        field.options.forEach((option, i) => input.add(new Option(option, String(i))));
      } else {
        input = el('input'); input.type = 'number'; input.min = String(field.min ?? 0); input.max = String(field.max ?? 50); input.step = '1'; input.inputMode = 'numeric';
      }
      input.id = label.htmlFor; input.value = String(values[index]);
      input.addEventListener('input', () => { values[index] = input.value === '' ? NaN : Number(input.value); feedback.textContent = ''; redraw(); });
      const line = el('div', 'adventure-adjust');
      if (!field.options) line.append(button('−', () => { const current = Number.isFinite(values[index]) ? values[index] : field.min ?? 0; input.value = String(Math.max(field.min ?? 0, current - 1)); input.dispatchEvent(new Event('input')); }));
      line.append(input);
      if (!field.options) line.append(button('+', () => { const current = Number.isFinite(values[index]) ? values[index] : field.min ?? 0; input.value = String(Math.min(field.max ?? 50, current + 1)); input.dispatchEvent(new Event('input')); }));
      group.append(label, line); controls.append(group);
    });
    let resolved = false;
    const check = button(puzzle.action, () => {
      if (resolved) return;
      const valid = values.every((value, index) => Number.isInteger(value) && value >= (puzzle.fields[index].min ?? 0) && value <= (puzzle.fields[index].max ?? (puzzle.fields[index].options?.length - 1 || 50)));
      if (!valid) { feedback.textContent = 'Set every control to a whole number within its range.'; return; }
      if (!puzzle.check(values)) { feedback.textContent = puzzle.hint; feedback.dataset.result = 'retry'; return; }
      resolved = true; state.relics += state.route ? 2 : 1; state.site++; state.steps = 0;
      save(); render();
      feedback.textContent = `${puzzle.explain(values)} ${world.reward} restored! ${state.site === 4 ? 'The whole expedition is complete.' : `Next destination: ${world.sites[state.site]}.`}`;
      feedback.dataset.result = 'correct';
      check.disabled = true; controls.querySelectorAll('input,select,button').forEach(node => node.disabled = true);
      const continueButton = button(state.site === 4 ? 'Return to your expedition' : 'Continue the adventure', () => dialog.close(), 'adventure-enter');
      dialog.append(continueButton); continueButton.focus();
      document.dispatchEvent(new CustomEvent('game:expedition', { detail: { world: world.id, sites: state.site, relics: state.relics } }));
    }, 'adventure-enter');
    dialog.append(header, el('span', 'adventure-eyebrow', `${world.routes[state.route]} · Site ${state.site + 1} of 4`), instruction, visual, controls, check, feedback);
    redraw(); dialog.showModal(); dialog.querySelector('input,select')?.focus();
  }

  // The same world art is part of the actual native playfield, not just its menu.
  const game = window.__flagshipGame;
  const nativeScenes = new WeakSet();
  const beaconLayers = new Set();
  function updateWorldBeacons() {
    for (const layer of beaconLayers) {
      if (!layer.scene) { beaconLayers.delete(layer); continue; }
      layer.list.forEach((node,index) => node.setFillStyle(index < state.site ? 0xc4efb4 : 0x557182, index < state.site ? .85 : .35));
    }
  }
  if (game) {
    const art = new Image();
    art.addEventListener('load', () => {
      if (!game.textures.exists('expedition-world')) game.textures.addImage('expedition-world', art);
      function decorate(scene) {
        if (!scene.children || nativeScenes.has(scene) || !scene.sys.isActive()) return;
        nativeScenes.add(scene);
        const width=game.config.width,height=game.config.height;
        scene.add.image(width/2,height/2,'expedition-world').setDisplaySize(width,height).setAlpha(.48).setDepth(-1000);
        // Preserve panels, diagrams and controls; soften only full-screen backdrop rectangles.
        scene.children.list.forEach(object => { if (object.type==='Rectangle' && object.width >= width*.95 && object.height >= height*.85) object.setAlpha(.3); });
        scene.cameras.main.setBackgroundColor('#142333');
        const beacons = scene.add.container(width-100, height-24).setDepth(4);
        for (let i=0;i<4;i++) beacons.add(scene.add.circle(i*21,0,5,0x557182,.35));
        beaconLayers.add(beacons); updateWorldBeacons();
        scene.events.once('shutdown', () => { nativeScenes.delete(scene); beaconLayers.delete(beacons); });
      }
      game.events.on('step', () => game.scene.getScenes(true).forEach(decorate));
    }, { once:true });
    art.src = `/math/games/shared/adventure-worlds/${world.id}.svg`;
  } else {
    document.body.classList.add('adventure-dom-world');
    document.body.style.setProperty('--expedition-art', `url('/math/games/shared/adventure-worlds/${world.id}.svg')`);
  }
  render();
})();
