/* Persistent, success-driven expeditions for the native flagship games.
 * Each world has a different construction puzzle; progress is reported by the
 * native engine only after its own answer validator accepts a move.
 * Language follows localStorage['nt-lang'] and the site-wide `ewl:lang` event. */
(() => {
  "use strict";
  const lang = () => {
    try {
      return localStorage.getItem("nt-lang") === "es" ? "es" : "en";
    } catch {
      return "en";
    }
  };
  const worlds = {
    "unit2-fraction-kitchen": {
      id: "kitchen",
      color: "#edb590",
      en: {
        title: "The Lantern Orchard",
        role: "Expedition chef",
        story:
          "A floating orchard has gone dark. Fill the festival lanterns with carefully measured fruit nectar.",
        sites: [
          "Applewood Landing",
          "The Glass Conservatory",
          "Moonberry Canopy",
          "The Lantern Festival",
        ],
        routes: ["Picnic trail", "Banquet trail"],
        reward: ["Lantern", "Lanterns"],
      },
      es: {
        title: "El Huerto de los Faroles",
        role: "Chef de expedición",
        story:
          "Un huerto flotante se quedó a oscuras. Llena los faroles del festival con néctar de fruta bien medido.",
        sites: [
          "Muelle de los Manzanos",
          "El Invernadero de Cristal",
          "Copa de las Moras Lunares",
          "El Festival de Faroles",
        ],
        routes: ["Sendero del picnic", "Sendero del banquete"],
        reward: ["farol", "faroles"],
      },
    },
    "unit2-fraction-foundry": {
      id: "foundry",
      color: "#f3bc6c",
      en: {
        title: "The Emberworks",
        role: "Bridge forger",
        story:
          "Reconnect the mountain villages. Forge the exact pieces each suspended bridge needs.",
        sites: ["Copper Gate", "Obsidian Crossing", "The Sky Foundry", "Sunrise Bridge"],
        routes: ["Single-piece forge", "Bundle forge"],
        reward: ["Bridge span", "Bridge spans"],
      },
      es: {
        title: "La Fragua de Brasas",
        role: "Forjador de puentes",
        story:
          "Vuelve a conectar los pueblos de la montaña. Forja las piezas exactas que necesita cada puente colgante.",
        sites: [
          "Puerta de Cobre",
          "Paso de Obsidiana",
          "La Fragua del Cielo",
          "Puente del Amanecer",
        ],
        routes: ["Forja de una pieza", "Forja por paquetes"],
        reward: ["tramo de puente", "tramos de puente"],
      },
    },
    "6-rp-1game": {
      id: "ratio",
      color: "#8cdac5",
      en: {
        title: "The Tideglass Isles",
        role: "Reef alchemist",
        story:
          "The island gardens need new water filters. Blend the mineral mixtures that revive each reef.",
        sites: ["Coral Dock", "Jade Lagoon", "The Floating Garden", "Tideglass Beacon"],
        routes: ["Coastal blend", "Deep-water blend"],
        reward: ["Reef crystal", "Reef crystals"],
      },
      es: {
        title: "Las Islas Vidriomarea",
        role: "Alquimista del arrecife",
        story:
          "Los jardines de las islas necesitan filtros de agua nuevos. Mezcla los minerales que reviven cada arrecife.",
        sites: ["Muelle de Coral", "Laguna de Jade", "El Jardín Flotante", "Faro Vidriomarea"],
        routes: ["Mezcla costera", "Mezcla de aguas profundas"],
        reward: ["cristal de arrecife", "cristales de arrecife"],
      },
    },
    "unit4-discount-dash": {
      id: "discount",
      color: "#dab7ec",
      en: {
        title: "The Night Market Rescue",
        role: "Supply captain",
        story:
          "Power a stranded research team. Build an affordable cargo of solar cells from market offers.",
        sites: ["Paper Lantern Pier", "The Rooftop Bazaar", "Crescent Exchange", "Research Camp"],
        routes: ["Supply run", "Long-range delivery"],
        reward: ["Supply cache", "Supply caches"],
      },
      es: {
        title: "Rescate en el Mercado Nocturno",
        role: "Capitán de suministros",
        story:
          "Lleva energía a un equipo de investigación varado. Arma una carga económica de celdas solares con las ofertas del mercado.",
        sites: [
          "Muelle de los Faroles de Papel",
          "El Bazar de la Azotea",
          "Mercado Media Luna",
          "Campamento de Investigación",
        ],
        routes: ["Viaje de suministros", "Entrega de largo alcance"],
        reward: ["caja de suministros", "cajas de suministros"],
      },
    },
    "unit5-area-architect": {
      id: "area",
      color: "#b8dea3",
      en: {
        title: "The Verdant City",
        role: "Restoration architect",
        story:
          "Rebuild a city around its gardens. Fit useful buildings and green space into each district.",
        sites: ["Riverbank Quarter", "The Orchard Terrace", "Canopy Library", "The Living Skyline"],
        routes: ["Garden district", "Library district"],
        reward: ["Green district", "Green districts"],
      },
      es: {
        title: "La Ciudad Verde",
        role: "Arquitecto de restauración",
        story:
          "Reconstruye una ciudad alrededor de sus jardines. Acomoda edificios útiles y áreas verdes en cada distrito.",
        sites: [
          "Barrio de la Ribera",
          "La Terraza del Huerto",
          "Biblioteca del Dosel",
          "El Horizonte Vivo",
        ],
        routes: ["Distrito de jardines", "Distrito de la biblioteca"],
        reward: ["distrito verde", "distritos verdes"],
      },
    },
    "unit6-expression-engine": {
      id: "expression",
      color: "#8ddac8",
      en: {
        title: "The Clockwork Wilds",
        role: "Circuit engineer",
        story:
          "A forgotten machine forest is waking. Rewire its signal engines to restore the ecosystem.",
        sites: ["Mosslight Station", "The Gear Grove", "Cloud Pump", "The Heart Engine"],
        routes: ["Growth circuit", "Energy circuit"],
        reward: ["Power core", "Power cores"],
      },
      es: {
        title: "Los Bosques de Engranajes",
        role: "Ingeniero de circuitos",
        story:
          "Un bosque de máquinas olvidado está despertando. Reconecta sus motores de señal para restaurar el ecosistema.",
        sites: [
          "Estación Musgoluz",
          "El Bosque de Engranajes",
          "Bomba de Nubes",
          "El Motor Corazón",
        ],
        routes: ["Circuito de crecimiento", "Circuito de energía"],
        reward: ["núcleo de energía", "núcleos de energía"],
      },
    },
    "unit7-equation-escape": {
      id: "equation",
      color: "#d6c082",
      en: {
        title: "The Atlas Temple",
        role: "Balance keeper",
        story:
          "Recover a lost atlas from a temple of counterweights. Every gate opens only when both sides stay balanced.",
        sites: ["The Echo Vestibule", "Counterweight Hall", "The Mirror Archive", "Atlas Chamber"],
        routes: ["Stone gate", "Crystal gate"],
        reward: ["Atlas fragment", "Atlas fragments"],
      },
      es: {
        title: "El Templo del Atlas",
        role: "Guardián del equilibrio",
        story:
          "Recupera un atlas perdido en un templo de contrapesos. Cada puerta se abre solo cuando los dos lados siguen en equilibrio.",
        sites: [
          "El Vestíbulo del Eco",
          "Salón de los Contrapesos",
          "El Archivo de Espejos",
          "Cámara del Atlas",
        ],
        routes: ["Puerta de piedra", "Puerta de cristal"],
        reward: ["fragmento del atlas", "fragmentos del atlas"],
      },
    },
    "unit9-variable-velocity": {
      id: "variable",
      color: "#bfaef0",
      en: {
        title: "The Aurora Relay",
        role: "Starship navigator",
        story:
          "Reconnect the research satellites. Plot safe relay coordinates using each sector’s signal rule.",
        sites: ["Orbit One", "The Violet Belt", "Aurora Crossing", "Deep-Space Relay"],
        routes: ["Direct signal", "Boosted signal"],
        reward: ["Relay beacon", "Relay beacons"],
      },
      es: {
        title: "El Relevo de la Aurora",
        role: "Navegante espacial",
        story:
          "Vuelve a conectar los satélites de investigación. Ubica coordenadas seguras para los relés con la regla de señal de cada sector.",
        sites: [
          "Órbita Uno",
          "El Cinturón Violeta",
          "Cruce de la Aurora",
          "Relé del Espacio Profundo",
        ],
        routes: ["Señal directa", "Señal reforzada"],
        reward: ["faro de relevo", "faros de relevo"],
      },
    },
    "unit10-volume-vault": {
      id: "volume",
      color: "#8edde2",
      en: {
        title: "The Abyssal Archive",
        role: "Deep-sea engineer",
        story:
          "Rescue the ocean’s lost records. Build watertight cargo pods that fit the submarine’s compartments.",
        sites: ["Sunlit Shelf", "The Kelp Cathedral", "Midnight Trench", "The Abyssal Archive"],
        routes: ["Tall cargo bay", "Wide cargo bay"],
        reward: ["Archive capsule", "Archive capsules"],
      },
      es: {
        title: "El Archivo Abisal",
        role: "Ingeniero de las profundidades",
        story:
          "Rescata los registros perdidos del océano. Construye cápsulas herméticas que quepan en las bodegas del submarino.",
        sites: [
          "Plataforma Soleada",
          "La Catedral de Algas",
          "Fosa de Medianoche",
          "El Archivo Abisal",
        ],
        routes: ["Bodega alta", "Bodega ancha"],
        reward: ["cápsula del archivo", "cápsulas del archivo"],
      },
    },
    "unit8-stats-slam": {
      id: "stats",
      color: "#f4c58d",
      en: {
        title: "The Skycourt League",
        role: "Team analyst",
        story:
          "Guide an underdog team through a sky-island league. Use the evidence to investigate unusual performances.",
        sites: ["Harbor Court", "The Windmill Arena", "Cloudbank Stadium", "The Summit Final"],
        routes: ["Home scout", "Away scout"],
        reward: ["League pennant", "League pennants"],
      },
      es: {
        title: "La Liga Cielocancha",
        role: "Analista del equipo",
        story:
          "Guía a un equipo novato por una liga de islas en el cielo. Usa la evidencia para investigar resultados inusuales.",
        sites: [
          "Cancha del Puerto",
          "La Arena del Molino",
          "Estadio Banco de Nubes",
          "La Gran Final",
        ],
        routes: ["Exploración local", "Exploración visitante"],
        reward: ["banderín de la liga", "banderines de la liga"],
      },
    },
  };
  const UI = {
    expeditionLabel: { en: (t) => `${t} expedition`, es: (t) => `Expedición: ${t}` },
    routesLabel: { en: "Choose your expedition route", es: "Elige la ruta de tu expedición" },
    meterLabel: { en: "Fieldwork completed", es: "Trabajo de campo completado" },
    meterText: {
      en: (n, t) => `${n} of ${t} challenges complete`,
      es: (n, t) => `${n} de ${t} retos completados`,
    },
    medal: { en: (word) => `${word} restored`, es: (word) => `${word} en tu colección` },
    finishedTitle: { en: (t) => `${t} restored`, es: (t) => `Expedición completa: ${t}` },
    finishedBrief: {
      en: "Your expedition is complete. Return with a new route and new mission numbers to earn another collection.",
      es: "Tu expedición está completa. Vuelve con una ruta nueva y números nuevos para ganar otra colección.",
    },
    brief: {
      en: (t, long) =>
        `Solve ${t} challenges in the game, then enter this site for a hands-on mission. ${long ? "The longer route earns two rewards." : "The shorter route earns one reward."} Solving the mission on your first try earns a bonus.`,
      es: (t, long) =>
        `Resuelve ${t} retos en el juego y luego entra a este lugar para una misión práctica. ${long ? "La ruta larga da dos premios." : "La ruta corta da un premio."} Resolver la misión al primer intento da un premio extra.`,
    },
    beginNew: { en: "Begin a new expedition", es: "Comenzar una nueva expedición" },
    enterSite: { en: (s) => `Enter ${s}`, es: (s) => `Entrar a ${s}` },
    progressButton: {
      en: (n, t) => `${n} / ${t} fieldwork challenges complete`,
      es: (n, t) => `${n} / ${t} retos de campo completados`,
    },
    ready: {
      en: (s) => `${s} is ready. Enter the mission site when you are ready.`,
      es: (s) => `Ya puedes entrar a ${s} cuando quieras.`,
    },
    energy: {
      en: (k) =>
        `Energy collected. ${k} more successful challenge${k === 1 ? " opens" : "s open"} the site.`,
      es: (k) =>
        `Energía reunida. ${k === 1 ? "Falta 1 reto resuelto" : `Faltan ${k} retos resueltos`} para abrir el lugar.`,
    },
    newExpedition: {
      en: "A new expedition is ready. Choose your route, then launch the game.",
      es: "Una nueva expedición está lista. Elige tu ruta y lanza el juego.",
    },
    fieldwork: { en: "FIELDWORK", es: "TRABAJO DE CAMPO" },
    summary: {
      en: "Mission controls and accessible game controls",
      es: "Controles de la misión y controles accesibles del juego",
    },
    back: { en: "Back to fieldwork", es: "Volver al trabajo de campo" },
    siteOf: { en: (r, i) => `${r} · Site ${i} of 4`, es: (r, i) => `${r} · Lugar ${i} de 4` },
    invalid: {
      en: "Set every control to a whole number within its range.",
      es: "Pon cada control en un número entero dentro de su rango.",
    },
    notYet: { en: "Not yet.", es: "Todavía no." },
    hintLocked: {
      en: "Hints open after your first try.",
      es: "Las pistas se abren después de tu primer intento.",
    },
    hintButton: { en: (k) => `Get a hint (${k} of 3)`, es: (k) => `Pedir una pista (${k} de 3)` },
    showMe: { en: "Show me how (hint 3 of 3)", es: "Muéstrame cómo (pista 3 de 3)" },
    hintWait: {
      en: "Try again to unlock the next hint.",
      es: "Intenta otra vez para abrir la siguiente pista.",
    },
    hintNames: {
      en: ["Method", "Step", "Worked example"],
      es: ["Método", "Paso", "Ejemplo resuelto"],
    },
    helpHeading: { en: "Your hints", es: "Tus pistas" },
    restored: { en: (r) => `${r} restored!`, es: (r) => `¡Ganaste: ${r}!` },
    bonus: { en: "First-try bonus: +1.", es: "Premio por primer intento: +1." },
    helped: {
      en: "Solved with help. Try the next site on your own for the bonus.",
      es: "Resuelto con ayuda. Intenta el próximo lugar por tu cuenta para ganar el premio extra.",
    },
    complete: { en: "The whole expedition is complete.", es: "¡Terminaste toda la expedición!" },
    next: { en: (s) => `Next destination: ${s}.`, es: (s) => `Próximo destino: ${s}.` },
    continue: { en: "Continue the adventure", es: "Continuar la aventura" },
    returnTo: { en: "Return to your expedition", es: "Volver a tu expedición" },
    mapDone: { en: "completed", es: "completado" },
    mapNow: { en: "current site", es: "lugar actual" },
    mapLater: { en: "not open yet", es: "todavía cerrado" },
    mapLabel: { en: "Expedition map", es: "Mapa de la expedición" },
  };
  const T = (key, ...args) => {
    const value = UI[key][lang()];
    return typeof value === "function" ? value(...args) : value;
  };
  const parts = location.pathname.split("/").filter(Boolean);
  const slug = (parts.at(-1) === "index.html" ? parts.at(-2) : parts.at(-1)).replace(".html", "");
  const world = worlds[slug];
  const panel = document.querySelector(".flagship-mission");
  if (!world || !panel) return;
  const W = () => world[lang()];
  const storageKey = `ewl.flagship.expedition.v1.${world.id}`;
  const bounded = (value, max) =>
    Number.isInteger(value) && value >= 0 && value <= max ? value : 0;
  let stored = {};
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (value && typeof value === "object") stored = value;
  } catch {}
  const state = {
    site: bounded(stored.site, 4),
    steps: bounded(stored.steps, 4),
    route: bounded(stored.route, 1),
    chapter: bounded(stored.chapter, 999),
    relics: bounded(stored.relics, 9999),
    firstTry: bounded(stored.firstTry, 99999),
    missionFirstTry: bounded(stored.missionFirstTry, 9999),
  };
  const target = () => (state.route ? 4 : 3);
  state.steps = Math.min(state.steps, target());
  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  };
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const button = (text, action, className = "") => {
    const node = el("button", className, text);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  };
  const rewardWord = (count) => W().reward[count === 1 ? 0 : 1];

  const section = el("section", "adventure-world");
  section.style.setProperty("--expedition-color", world.color);
  section.style.setProperty(
    "--expedition-art",
    `url('/math/games/shared/adventure-worlds/${world.id}.svg')`,
  );
  section.dataset.world = world.id;
  const banner = el("div", "adventure-banner");
  const intro = el("div", "adventure-intro");
  const roleEl = el("span", "adventure-eyebrow");
  const titleEl = el("h2");
  const storyEl = el("p");
  intro.append(roleEl, titleEl, storyEl);
  const medal = el("div", "adventure-medal");
  banner.append(intro, medal);
  const map = el("ol", "adventure-map");
  const destination = el("div", "adventure-destination");
  const missionTitle = el("h3");
  const briefing = el("p");
  const routes = el("div", "adventure-routes");
  routes.setAttribute("role", "group");
  [0, 1].forEach((index) =>
    routes.append(
      button("", () => {
        if (state.steps || state.site === 4) return;
        state.route = index;
        save();
        render();
      }),
    ),
  );
  const progress = el("div", "adventure-meter");
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-valuemin", "0");
  progress.append(el("span"));
  const enter = button("", openPuzzle, "adventure-enter");
  const status = el("p", "adventure-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  destination.append(missionTitle, briefing, routes, progress, enter, status);
  section.append(banner, map, destination);
  const stageOrApp =
    document.querySelector(".flagship-stage") ||
    document.getElementById("app") ||
    document.querySelector("main") ||
    panel;
  stageOrApp.after(section);
  const stageEl = document.querySelector(".flagship-stage");
  if (stageEl && window.__flagshipGame) {
    stageEl.style.setProperty(
      "--native-ratio",
      String(window.__flagshipGame.config.width / window.__flagshipGame.config.height),
    );
    requestAnimationFrame(() => {
      try {
        window.__flagshipGame.scale.refresh();
        window.__flagshipGame.scale.updateBounds?.();
      } catch (_) {}
    });
  }
  const eyebrow = panel.querySelector(".fm-eyebrow");
  const relabelEyebrow = () => {
    if (!eyebrow) return;
    const base = eyebrow.dataset.base || eyebrow.textContent || "";
    eyebrow.dataset.base = base;
    eyebrow.textContent = `${T("fieldwork")} • ${base}`;
  };
  const details = el("details", "adventure-fieldwork");
  const summary = el("summary");
  details.append(summary);
  // Keep the launch controls visible; collapse only the redundant mirror controls.
  for (const item of [
    ...panel.querySelectorAll(".fm-stats,.fm-question,.fm-actions,.fm-feedback,.fm-progress"),
  ])
    details.append(item);
  panel.append(details);
  details.open = matchMedia("(max-width: 700px)").matches;
  panel.querySelector("#fm-start").addEventListener("click", () => {
    section.classList.add("is-playing");
    document.body.classList.add("adventure-playing");
    const stage = document.querySelector(".flagship-stage");
    if (stage && window.__flagshipGame)
      stage.style.setProperty(
        "--native-ratio",
        String(window.__flagshipGame.config.width / window.__flagshipGame.config.height),
      );
    requestAnimationFrame(() => {
      window.__flagshipGame?.scale.refresh();
      window.__flagshipGame?.scale.updateBounds?.();
      panel.scrollIntoView({ block: "start", behavior: "instant" });
    });
  });

  const dialog = el("dialog", "adventure-dialog");
  dialog.setAttribute("aria-labelledby", "adventure-puzzle-title");
  dialog.setAttribute("aria-describedby", "adventure-puzzle-instruction");
  dialog.style.setProperty("--expedition-color", world.color);
  document.body.append(dialog);
  let wasPaused = false;
  let returnFocus = null;
  let mission = null;
  dialog.addEventListener("close", () => {
    if (!wasPaused && window.GameStudio?.paused) window.GameStudio.resume();
    mission = null;
    (returnFocus?.isConnected ? returnFocus : enter).focus({ preventScroll: true });
  });
  // Phaser shortcuts must never process input intended for the construction puzzle.
  ["keydown", "keyup"].forEach((name) =>
    dialog.addEventListener(name, (event) => event.stopPropagation()),
  );

  function render() {
    const w = W();
    section.setAttribute("aria-label", T("expeditionLabel", w.title));
    roleEl.textContent = w.role;
    titleEl.textContent = w.title;
    storyEl.textContent = w.story;
    const count = el("strong", "", String(state.relics));
    medal.replaceChildren(count, el("span", "", T("medal", rewardWord(state.relics))));
    map.setAttribute("aria-label", T("mapLabel"));
    map.replaceChildren(
      ...w.sites.map((name, index) => {
        const done = index < state.site,
          now = index === state.site;
        const node = el("li", done ? "is-complete" : now ? "is-current" : "");
        const dot = el("span", "adventure-node", done ? "✓" : String(index + 1));
        dot.setAttribute("aria-hidden", "true");
        node.append(
          dot,
          el("span", "", name),
          el("span", "adventure-sr", ` (${T(done ? "mapDone" : now ? "mapNow" : "mapLater")})`),
        );
        if (now) node.setAttribute("aria-current", "step");
        return node;
      }),
    );
    const finished = state.site === 4;
    missionTitle.textContent = finished ? T("finishedTitle", w.title) : w.sites[state.site];
    briefing.textContent = finished ? T("finishedBrief") : T("brief", target(), state.route === 1);
    routes.setAttribute("aria-label", T("routesLabel"));
    routes.querySelectorAll("button").forEach((b, index) => {
      b.textContent = w.routes[index];
      b.setAttribute("aria-pressed", String(index === state.route));
      b.disabled = state.steps > 0 || finished;
    });
    progress.setAttribute("aria-label", T("meterLabel"));
    progress.setAttribute("aria-valuemax", String(target()));
    progress.setAttribute("aria-valuenow", String(state.steps));
    progress.setAttribute("aria-valuetext", T("meterText", state.steps, target()));
    progress.firstChild.style.width = `${(100 * state.steps) / target()}%`;
    enter.disabled = !finished && state.steps < target();
    enter.textContent = finished
      ? T("beginNew")
      : state.steps >= target()
        ? T("enterSite", w.sites[state.site])
        : T("progressButton", state.steps, target());
    summary.textContent = T("summary");
    updateWorldBeacons();
  }
  function record(detail = {}) {
    if (state.site === 4 || dialog.open || state.steps >= target()) return;
    state.steps++;
    if (detail.firstTry) state.firstTry++;
    save();
    render();
    status.textContent =
      state.steps === target()
        ? T("ready", W().sites[state.site])
        : T("energy", target() - state.steps);
  }
  // These calls live inside each native success branch, after its locked guard.
  window.FlagshipAdventure = Object.freeze({
    record,
    get route() {
      return state.route;
    },
    get progress() {
      return { ...state };
    },
    get lang() {
      return lang();
    },
  });

  function openPuzzle() {
    if (state.site === 4) {
      state.site = 0;
      state.steps = 0;
      state.chapter++;
      state.route = 1 - state.route;
      save();
      render();
      status.textContent = T("newExpedition");
      return;
    }
    if (state.steps < target() || dialog.open) return;
    returnFocus = document.activeElement;
    wasPaused = !!window.GameStudio?.paused;
    if (!wasPaused) window.GameStudio?.pause();
    mission = { values: null, misses: 0, help: 0, resolved: false, feedback: "", result: "" };
    buildDialog();
    dialog.showModal();
    dialog.querySelector("input,select")?.focus();
  }

  // (Re)builds the mission dialog from `mission`, so a language switch keeps every answer and hint.
  function buildDialog() {
    const puzzle = window.FlagshipPuzzles.create(
      world.id,
      state.site + state.chapter * 4,
      state.route,
      lang(),
    );
    if (!mission.values)
      mission.values = puzzle.fields.map((field) => field.value ?? field.min ?? 0);
    const values = mission.values;
    const w = W();
    dialog.replaceChildren();
    const header = el("div", "adventure-dialog-header");
    const title = el(
      "h2",
      "",
      mission.resolved ? w.sites[Math.max(0, state.site - 1)] : w.sites[state.site],
    );
    title.id = "adventure-puzzle-title";
    header.append(
      title,
      button(T("back"), () => dialog.close(), "adventure-close"),
    );
    const instruction = el("p", "adventure-instruction", puzzle.text);
    instruction.id = "adventure-puzzle-instruction";
    const visual = el("div", "adventure-puzzle-visual");
    const controls = el("div", "adventure-puzzle-controls");
    const feedback = el("p", "adventure-puzzle-feedback");
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    const help = el("div", "adventure-help");
    const helpList = el("ol", "adventure-help-list");
    helpList.setAttribute("aria-label", T("helpHeading"));
    const helpButton = button("", requestHint, "adventure-hint");
    const helpNote = el("p", "adventure-help-note");
    help.append(helpButton, helpNote, helpList);
    const redraw = () => {
      visual.innerHTML = puzzle.draw(values);
    };
    const maxOf = (field) => field.max ?? (field.options ? field.options.length - 1 : 50);
    puzzle.fields.forEach((field, index) => {
      const group = el("div", "adventure-control");
      const labelEl = el("label", "", field.label);
      labelEl.htmlFor = `expedition-input-${index}`;
      let input;
      if (field.options) {
        input = el("select");
        field.options.forEach((option, i) => input.add(new Option(option, String(i))));
      } else {
        input = el("input");
        input.type = "number";
        input.min = String(field.min ?? 0);
        input.max = String(maxOf(field));
        input.step = "1";
        input.inputMode = "numeric";
      }
      input.id = labelEl.htmlFor;
      input.value = Number.isFinite(values[index]) ? String(values[index]) : "";
      input.addEventListener("input", () => {
        values[index] = input.value === "" ? NaN : Number(input.value);
        if (!mission.resolved) {
          feedback.textContent = "";
          delete feedback.dataset.result;
        }
        redraw();
      });
      const line = el("div", "adventure-adjust");
      const nudge = (delta, symbol, name) => {
        const b = button(symbol, () => {
          const current = Number.isFinite(values[index]) ? values[index] : (field.min ?? 0);
          input.value = String(Math.min(maxOf(field), Math.max(field.min ?? 0, current + delta)));
          input.dispatchEvent(new Event("input"));
        });
        b.setAttribute("aria-label", `${name} · ${field.label}`);
        return b;
      };
      if (!field.options) line.append(nudge(-1, "−", lang() === "es" ? "Menos 1" : "Minus 1"));
      line.append(input);
      if (!field.options) line.append(nudge(1, "+", lang() === "es" ? "Más 1" : "Plus 1"));
      group.append(labelEl, line);
      controls.append(group);
    });
    const names = T("hintNames");
    const renderHelp = () => {
      helpList.replaceChildren(
        ...puzzle.hints.slice(0, mission.help).map((text, i) => {
          const item = el("li");
          item.append(el("strong", "", `${names[i]}: `), document.createTextNode(text));
          return item;
        }),
      );
      // Tier 1 opens after the first miss; the step and the worked example after the second.
      const allowed = mission.misses >= 2 ? 3 : mission.misses;
      const next = mission.help + 1;
      helpButton.hidden = mission.resolved || next > 3;
      helpButton.textContent = next === 3 ? T("showMe") : T("hintButton", next);
      helpButton.disabled = next > allowed;
      helpNote.textContent =
        mission.resolved || next > 3
          ? ""
          : mission.misses === 0
            ? T("hintLocked")
            : next > allowed
              ? T("hintWait")
              : "";
    };
    function requestHint() {
      const allowed = mission.misses >= 2 ? 3 : mission.misses;
      if (mission.resolved || mission.help >= allowed) return;
      mission.help++;
      renderHelp();
      helpList.lastElementChild?.setAttribute("tabindex", "-1");
      helpList.lastElementChild?.focus({ preventScroll: false });
    }
    const check = button(
      puzzle.action,
      () => {
        if (mission.resolved) return;
        const valid = values.every(
          (value, index) =>
            Number.isInteger(value) &&
            value >= (puzzle.fields[index].min ?? 0) &&
            value <= maxOf(puzzle.fields[index]),
        );
        if (!valid) {
          feedback.textContent = T("invalid");
          feedback.dataset.result = "retry";
          return;
        }
        if (!puzzle.check(values)) {
          mission.misses++;
          mission.feedback = `${T("notYet")} ${puzzle.diagnose(values)}`;
          mission.result = "retry";
          feedback.textContent = mission.feedback;
          feedback.dataset.result = "retry";
          renderHelp();
          return;
        }
        const unaided = mission.misses === 0 && mission.help === 0;
        mission.resolved = true;
        const earned = (state.route ? 2 : 1) + (unaided ? 1 : 0);
        state.relics += earned;
        if (unaided) state.missionFirstTry++;
        state.site++;
        state.steps = 0;
        save();
        render();
        mission.feedback = `${puzzle.explain(values)} ${T("restored", rewardWord(earned))} ${unaided ? T("bonus") : T("helped")} ${
          state.site === 4 ? T("complete") : T("next", W().sites[state.site])
        }`;
        mission.result = "correct";
        showResolved();
        dialog.querySelector(".adventure-continue")?.focus();
        document.dispatchEvent(
          new CustomEvent("game:expedition", {
            detail: { world: world.id, sites: state.site, relics: state.relics, firstTry: unaided },
          }),
        );
      },
      "adventure-enter",
    );
    function showResolved() {
      feedback.textContent = mission.feedback;
      feedback.dataset.result = "correct";
      check.disabled = true;
      controls.querySelectorAll("input,select,button").forEach((node) => {
        node.disabled = true;
      });
      renderHelp();
      const continueButton = button(
        state.site === 4 ? T("returnTo") : T("continue"),
        () => dialog.close(),
        "adventure-enter adventure-continue",
      );
      dialog.append(continueButton);
    }
    const routeName = w.routes[state.route];
    const siteNumber = mission.resolved ? state.site : state.site + 1;
    dialog.append(
      header,
      el("span", "adventure-eyebrow", T("siteOf", routeName, siteNumber)),
      instruction,
      visual,
      controls,
      check,
      feedback,
      help,
    );
    redraw();
    renderHelp();
    if (mission.resolved) showResolved();
    else if (mission.feedback) {
      feedback.textContent = mission.feedback;
      feedback.dataset.result = mission.result;
    }
  }

  function relabelAll() {
    relabelEyebrow();
    render();
    if (dialog.open && mission) {
      const focusedId = document.activeElement?.id;
      buildDialog();
      if (focusedId) document.getElementById(focusedId)?.focus({ preventScroll: true });
    }
  }
  document.addEventListener("ewl:lang", relabelAll);
  window.addEventListener("storage", (event) => {
    if (event.key === "nt-lang") relabelAll();
  });

  // The same world art is part of the actual native playfield, not just its menu.
  const game = window.__flagshipGame;
  const nativeScenes = new WeakSet();
  const beaconLayers = new Set();
  function updateWorldBeacons() {
    for (const layer of beaconLayers) {
      if (!layer.scene) {
        beaconLayers.delete(layer);
        continue;
      }
      layer.list.forEach((node, index) =>
        node.setFillStyle(
          index < state.site ? 0xc4efb4 : 0x557182,
          index < state.site ? 0.85 : 0.35,
        ),
      );
    }
  }
  if (game) {
    const art = new Image();
    art.addEventListener(
      "load",
      () => {
        if (!game.textures.exists("expedition-world"))
          game.textures.addImage("expedition-world", art);
        function decorate(scene) {
          if (!scene.children || nativeScenes.has(scene) || !scene.sys.isActive()) return;
          nativeScenes.add(scene);
          const width = game.config.width,
            height = game.config.height;
          scene.add
            .image(width / 2, height / 2, "expedition-world")
            .setDisplaySize(width, height)
            .setAlpha(0.48)
            .setDepth(-1000);
          // Preserve panels, diagrams and controls; soften only full-screen backdrop rectangles.
          scene.children.list.forEach((object) => {
            if (
              object.type === "Rectangle" &&
              object.width >= width * 0.95 &&
              object.height >= height * 0.85
            )
              object.setAlpha(0.3);
          });
          scene.cameras.main.setBackgroundColor("#142333");
          const beacons = scene.add.container(width - 100, height - 24).setDepth(4);
          for (let i = 0; i < 4; i++) beacons.add(scene.add.circle(i * 21, 0, 5, 0x557182, 0.35));
          beaconLayers.add(beacons);
          updateWorldBeacons();
          scene.events.once("shutdown", () => {
            nativeScenes.delete(scene);
            beaconLayers.delete(beacons);
          });
        }
        game.events.on("step", () => game.scene.getScenes(true).forEach(decorate));
      },
      { once: true },
    );
    art.src = `/math/games/shared/adventure-worlds/${world.id}.svg`;
  } else {
    document.body.classList.add("adventure-dom-world");
    document.body.style.setProperty(
      "--expedition-art",
      `url('/math/games/shared/adventure-worlds/${world.id}.svg')`,
    );
  }
  relabelEyebrow();
  render();
})();
