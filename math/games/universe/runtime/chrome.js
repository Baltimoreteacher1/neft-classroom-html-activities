// Shell chrome for the Math Gaming Runtime: the shared strings (EN/ES), the
// stylesheet and the shadow-DOM template. The stage owns the viewport; every
// other surface is an overlay that appears only when it is needed.

import { PAL } from "./art.js";

export const W = 960;
export const H = 540;

export const CHROME = {
  en: {
    start: "Start",
    continue: "Continue",
    newGame: "Start over",
    resume: "Resume",
    restart: "Restart level",
    checkpoint: "Back to checkpoint",
    settings: "Settings",
    controls: "Controls",
    close: "Close",
    back: "Back",
    pause: "Pause",
    paused: "Paused",
    lang: "Español",
    langName: "Cambiar a español",
    sfx: "Effects",
    music: "Music",
    voice: "Spoken directions",
    reduced: "Reduced motion",
    lowfx: "Low graphics",
    contrast: "High contrast",
    guide: "Guide me there",
    guideHelp: "Wren travels to the next machine alone. You make every math decision.",
    remap: "Press a key for {action}",
    aLEFT: "Left",
    aRIGHT: "Right",
    aUP: "Up",
    aDOWN: "Down",
    aJUMP: "Jump",
    aDASH: "Dash",
    aACT: "Use",
    use: "Use",
    usePrompt: "{key} · {what}",
    goTo: "Go to: {what}",
    timeMachine: "Time Machine",
    rewind: "Rewind",
    rewindTo: "Rewind to before “{label}”",
    rewound: "Rewound. The first path is saved. Try a different idea.",
    timelineEmpty: "No decisions yet. Every math decision you make lands here.",
    timelineHelp: "Each mark is a math decision. Pick one to go back to just before it.",
    branch: "Path {n}",
    thisPath: "You are here",
    compare: "Compare paths",
    comparePick: "Pick another path to compare with this one.",
    replay: "Replay this path",
    replaying: "Replaying your path…",
    stopReplay: "Stop replay",
    worked: "worked",
    failed: "did not work",
    pending: "in progress",
    firstFail: "This is the step that changed the result.",
    shift: "Reality Shift",
    shiftOpen: "Open a second reality",
    shiftSwitch: "Switch reality",
    shiftClose: "Return to the first reality",
    realityA: "First reality",
    realityB: "Shifted reality",
    investigate: "Investigate",
    changed: "What changed",
    invariant: "What stayed the same",
    predict: "Make a prediction",
    predictLocked: "Prediction saved. Watch what happens.",
    predictHeld: "Your prediction held.",
    predictOff: "The world did something else. What changed your mind?",
    explain: "Explain",
    explainHelp: "Say it your way. A sentence starter is there if you want one.",
    explainSave: "Save my explanation",
    explainSkip: "Not now",
    levelDone: "Level complete",
    next: "Next level",
    finish: "Finish",
    replayLevel: "Play this level again",
    allDone: "You finished every level.",
    evDecisions: "Math decisions: {n}",
    evRevised: "Ideas you fixed: {n}",
    evPredict: "Predictions: {n}",
    evTransfer: "Ori passed a new task: {n}",
    evDemos: "Things you showed Ori: {n}",
    evExplain: "Explanations you wrote: {n}",
    evIndependent: "On your own: {n}",
    saved: "Progress saves on this device.",
    notSaved: "Progress stays for this visit only.",
    checkpointHit: "Checkpoint",
    levelOf: "Level {n} of {total}",
    skip: "Skip to the game",
    loading: "Loading…",
    oriName: "Ori",
    wrenName: "Wren",
    touchPad: "Touch controls",
    mapTitle: "Levels",
    locked: "Finish the level before this one to open it.",
    howTo: "How to play",
    moveHint: "Move: arrow keys or A / D. Jump: Space. Dash: Shift. Use: E.",
    calm: "There is no clock. Take the time you need.",
  },
  es: {
    start: "Comenzar",
    continue: "Continuar",
    newGame: "Empezar de nuevo",
    resume: "Seguir",
    restart: "Reiniciar nivel",
    checkpoint: "Volver al punto de control",
    settings: "Ajustes",
    controls: "Controles",
    close: "Cerrar",
    back: "Atrás",
    pause: "Pausa",
    paused: "En pausa",
    lang: "English",
    langName: "Switch to English",
    sfx: "Efectos",
    music: "Música",
    voice: "Instrucciones habladas",
    reduced: "Menos movimiento",
    lowfx: "Gráficos simples",
    contrast: "Alto contraste",
    guide: "Llévame allí",
    guideHelp: "Wren viaja sola hasta la próxima máquina. Tú tomas cada decisión matemática.",
    remap: "Presiona una tecla para {action}",
    aLEFT: "Izquierda",
    aRIGHT: "Derecha",
    aUP: "Arriba",
    aDOWN: "Abajo",
    aJUMP: "Saltar",
    aDASH: "Impulso",
    aACT: "Usar",
    use: "Usar",
    usePrompt: "{key} · {what}",
    goTo: "Ir a: {what}",
    timeMachine: "Máquina del Tiempo",
    rewind: "Rebobinar",
    rewindTo: "Rebobinar hasta antes de «{label}»",
    rewound: "Rebobinaste. El primer camino quedó guardado. Prueba otra idea.",
    timelineEmpty: "Aún no hay decisiones. Cada decisión matemática aparece aquí.",
    timelineHelp: "Cada marca es una decisión matemática. Elige una para volver justo antes.",
    branch: "Camino {n}",
    thisPath: "Estás aquí",
    compare: "Comparar caminos",
    comparePick: "Elige otro camino para compararlo con este.",
    replay: "Repetir este camino",
    replaying: "Repitiendo tu camino…",
    stopReplay: "Detener",
    worked: "funcionó",
    failed: "no funcionó",
    pending: "en curso",
    firstFail: "Este es el paso que cambió el resultado.",
    shift: "Cambio de Realidad",
    shiftOpen: "Abrir una segunda realidad",
    shiftSwitch: "Cambiar de realidad",
    shiftClose: "Volver a la primera realidad",
    realityA: "Primera realidad",
    realityB: "Realidad cambiada",
    investigate: "Investigar",
    changed: "Lo que cambió",
    invariant: "Lo que quedó igual",
    predict: "Haz una predicción",
    predictLocked: "Predicción guardada. Mira lo que pasa.",
    predictHeld: "Tu predicción se cumplió.",
    predictOff: "El mundo hizo otra cosa. ¿Qué te hizo cambiar de idea?",
    explain: "Explica",
    explainHelp: "Dilo a tu manera. Hay un inicio de oración si lo quieres.",
    explainSave: "Guardar mi explicación",
    explainSkip: "Ahora no",
    levelDone: "Nivel completado",
    next: "Siguiente nivel",
    finish: "Terminar",
    replayLevel: "Jugar este nivel otra vez",
    allDone: "Terminaste todos los niveles.",
    evDecisions: "Decisiones matemáticas: {n}",
    evRevised: "Ideas que corregiste: {n}",
    evPredict: "Predicciones: {n}",
    evTransfer: "Ori resolvió una tarea nueva: {n}",
    evDemos: "Cosas que le mostraste a Ori: {n}",
    evExplain: "Explicaciones que escribiste: {n}",
    evIndependent: "Por tu cuenta: {n}",
    saved: "El progreso se guarda en este dispositivo.",
    notSaved: "El progreso queda solo durante esta visita.",
    checkpointHit: "Punto de control",
    levelOf: "Nivel {n} de {total}",
    skip: "Ir al juego",
    loading: "Cargando…",
    oriName: "Ori",
    wrenName: "Wren",
    touchPad: "Controles táctiles",
    mapTitle: "Niveles",
    locked: "Termina el nivel anterior para abrir este.",
    howTo: "Cómo jugar",
    moveHint: "Mover: flechas o A / D. Saltar: Espacio. Impulso: Shift. Usar: E.",
    calm: "No hay reloj. Tómate el tiempo que necesites.",
  },
};

export const STYLE = `
:host{--navy:${PAL.navy};--navy2:${PAL.navy2};--navy3:${PAL.navy3};--teal:${PAL.teal};--glow:${PAL.tealGlow};--gold:${PAL.gold};--terra:${PAL.terra};--sage:${PAL.sage};--cream:${PAL.cream};--ink:${PAL.ink};--muted:${PAL.muted};--ok:${PAL.ok};--focus:#ffd166;
  display:block;color:var(--ink);font:16px/1.45 "Atkinson Hyperlegible",system-ui,sans-serif}
*{box-sizing:border-box}
[hidden]{display:none!important}
.frame{position:relative;width:min(100vw,calc(100dvh*16/9));margin:0 auto;aspect-ratio:16/9;background:#050a14;overflow:hidden;container-type:inline-size}
canvas{display:block;width:100%;height:100%;outline:none}
canvas:focus-visible{box-shadow:inset 0 0 0 3px var(--focus)}
button{font:inherit;font-weight:700;color:var(--ink);background:rgba(22,41,74,.92);border:2px solid var(--navy3);border-radius:12px;min-height:44px;min-width:44px;padding:8px 16px;cursor:pointer}
button.primary{background:var(--teal);border-color:var(--teal);color:#04201d}
button.gold{background:var(--gold);border-color:var(--gold);color:#2a1a02}
button.ghost{background:transparent}
button[aria-pressed=true]{border-color:var(--glow);box-shadow:0 0 0 1px var(--glow) inset}
button:disabled{opacity:.45;cursor:not-allowed}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
/* HUD: minimal, at the edges */
.hud{position:absolute;inset:0;pointer-events:none;display:grid;grid-template:auto 1fr auto/1fr auto;padding:1.2cqw;gap:1cqw}
.hud>*{pointer-events:auto}
.objective{grid-area:1/1;justify-self:start;max-width:62cqw;background:rgba(9,18,34,.82);border:1px solid var(--navy3);border-left:4px solid var(--gold);border-radius:10px;padding:.6cqw 1.2cqw;font-size:clamp(13px,1.7cqw,17px);font-weight:700}
.objective small{display:block;color:var(--muted);font-weight:400;font-size:.8em}
.tools{grid-area:1/2;display:flex;gap:.8cqw;align-items:flex-start}
.tools button{padding:6px 12px;font-size:clamp(13px,1.5cqw,15px)}
.reality{grid-area:2/1;align-self:start;justify-self:start;background:rgba(9,18,34,.82);border:1px solid var(--terra);border-radius:999px;padding:.3cqw 1.2cqw;font-size:clamp(13px,1.4cqw,15px);font-weight:700;color:var(--gold)}
.caption{grid-area:3/1/4/3;justify-self:center;max-width:78cqw;display:flex;gap:1cqw;align-items:flex-start;background:rgba(9,18,34,.9);border:1px solid var(--navy3);border-radius:14px;padding:.8cqw 1.4cqw;font-size:clamp(14px,1.8cqw,18px)}
.caption b{color:var(--gold);white-space:nowrap}
.caption.ori b{color:var(--glow)}
.prompt{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);background:rgba(9,18,34,.9);border:2px solid var(--gold);border-radius:999px;padding:6px 16px;font-weight:700;font-size:clamp(13px,1.6cqw,16px);pointer-events:auto;cursor:pointer;color:var(--ink)}
.toast{position:absolute;left:50%;top:16%;transform:translateX(-50%);background:rgba(9,18,34,.92);border:1px solid var(--gold);border-radius:12px;padding:8px 18px;font-weight:700;color:var(--gold)}
/* Touch controls */
.touch{position:absolute;inset:auto 0 0 0;display:flex;justify-content:space-between;padding:2cqw;pointer-events:none}
.touch div{display:flex;gap:1.4cqw;pointer-events:auto}
.touch button{width:clamp(52px,9cqw,76px);height:clamp(52px,9cqw,76px);border-radius:50%;background:rgba(22,41,74,.6);font-size:1.3em;touch-action:none;user-select:none;-webkit-user-select:none}
/* Overlays: title, pause, panels */
.veil{position:absolute;inset:0;display:grid;place-items:center;background:rgba(5,10,20,.72);padding:2cqw;overflow:auto}
.veil.title{background:radial-gradient(ellipse at 50% 42%,rgba(5,10,20,.78),rgba(5,10,20,.34) 62%,rgba(5,10,20,.12))}
.card{width:min(92cqw,560px);max-height:100%;overflow:auto;background:linear-gradient(180deg,var(--navy2),var(--navy));border:2px solid var(--navy3);border-radius:18px;padding:clamp(14px,2.4cqw,26px);box-shadow:0 18px 60px rgba(0,0,0,.5)}
.card.wide{width:min(94cqw,760px)}
.card h2{margin:0 0 .5em;font-size:clamp(18px,2.6cqw,26px);letter-spacing:.01em}
.card h3{margin:1em 0 .4em;font-size:1rem;color:var(--gold)}
.card p{margin:.4em 0}
.titleblock{text-align:center}
.titleblock h1{margin:0;font-size:clamp(28px,6.4cqw,60px);line-height:1.05;letter-spacing:.02em;text-shadow:0 4px 24px rgba(0,0,0,.6)}
.titleblock h1 span{color:var(--gold)}
.titleblock p{color:var(--cream);font-size:clamp(14px,2cqw,19px);margin:.6em auto 1.2em;max-width:46ch}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.row.center{justify-content:center}
.stack{display:grid;gap:10px}
.muted{color:var(--muted);font-size:.9em}
.field{display:grid;grid-template-columns:1fr auto;gap:6px 12px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(169,182,211,.15)}
.field input[type=range]{width:min(42cqw,220px);min-height:44px;accent-color:var(--teal)}
.field input[type=checkbox]{width:24px;height:24px;accent-color:var(--teal)}
.keys{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
/* Instrument panel: the mathematics, docked to the side of the stage */
.panel{position:absolute;top:0;right:0;bottom:0;width:min(46cqw,430px);min-width:min(100%,300px);background:linear-gradient(180deg,rgba(22,41,74,.97),rgba(13,27,46,.97));border-left:3px solid var(--teal);padding:clamp(12px,1.8cqw,20px);overflow:auto;display:flex;flex-direction:column;gap:12px}
.panel h2{margin:0;font-size:clamp(17px,2.2cqw,22px)}
.panel .math{font-size:clamp(20px,3.2cqw,32px);font-weight:700;font-variant-numeric:tabular-nums;text-align:center;background:var(--navy);border:1px solid var(--navy3);border-radius:12px;padding:10px;min-height:2.2em}
.panel .math sup{font-size:.62em;color:var(--gold)}
.panel .note{color:var(--cream);font-size:.95em}
.stepper{display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center}
.stepper output{min-width:2.4em;text-align:center;font-size:1.3em;font-weight:700;font-variant-numeric:tabular-nums;color:var(--glow)}
.slotrow{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center}
.panel select{min-height:44px;padding:6px 10px;font:inherit;font-weight:700;color:var(--cream);background:var(--navy);border:1px solid var(--navy3);border-radius:10px}
.panel select:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chips button{padding:6px 12px}
.model{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;min-height:48px;background:var(--navy);border:1px dashed var(--navy3);border-radius:12px;padding:8px}
.model i{display:grid;place-items:center;min-width:34px;height:34px;border-radius:8px;background:var(--teal);color:#04201d;font-style:normal;font-weight:700}
.model i.op{background:transparent;color:var(--muted);min-width:14px}
textarea{width:100%;min-height:84px;font:inherit;color:var(--ink);background:var(--navy);border:2px solid var(--navy3);border-radius:10px;padding:8px}
/* Time Machine */
.track{display:flex;gap:6px;overflow-x:auto;padding:10px 4px;align-items:stretch}
.node{flex:0 0 auto;display:grid;gap:2px;justify-items:start;text-align:left;max-width:190px;border-left:4px solid var(--muted)}
.node.ok{border-left-color:var(--ok)}
.node.bad{border-left-color:var(--terra)}
.node.fail1{box-shadow:0 0 0 2px var(--terra)}
.node small{color:var(--muted);font-weight:400}
.paths{display:grid;gap:8px}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cmp>div{background:var(--navy);border:1px solid var(--navy3);border-radius:12px;padding:10px}
table{border-collapse:collapse;width:100%}
th,td{padding:6px 8px;border-bottom:1px solid rgba(169,182,211,.2);text-align:left;font-variant-numeric:tabular-nums}
th{color:var(--muted);font-weight:700;font-size:.9em}
/* Reality tint + rewind sweep */
.frame[data-reality="1"] canvas{filter:hue-rotate(-28deg) saturate(1.15)}
.sweep{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(111,227,216,.35),transparent);animation:sweep .5s ease-out}
@keyframes sweep{from{transform:translateX(100%)}to{transform:translateX(-100%)}}
.pop{animation:pop .3s ease-out}
@keyframes pop{from{transform:translateX(-50%) scale(.9);opacity:.4}to{transform:translateX(-50%) scale(1);opacity:1}}
:host([data-contrast]) .objective,:host([data-contrast]) .caption,:host([data-contrast]) .card,:host([data-contrast]) .panel{background:#000;border-color:#fff;color:#fff}
:host([data-contrast]) .muted,:host([data-contrast]) .node small,:host([data-contrast]) th{color:#fff}
:host([data-contrast]) button{background:#000;border-color:#fff;color:#fff}
:host([data-contrast]) button.primary,:host([data-contrast]) button.gold{background:#ffd166;border-color:#ffd166;color:#000}
:host([data-reduced]) .sweep,:host([data-reduced]) .pop{animation:none}
@media(prefers-reduced-motion:reduce){.sweep,.pop{animation:none}}
@media(forced-colors:active){button,.card,.panel,.objective,.caption{border:1px solid CanvasText}}
@container (max-width:620px){.panel{top:auto;left:0;width:100%;max-height:72%;border-left:0;border-top:3px solid var(--teal)}.caption{max-width:96cqw}.tools button span{display:none}}
`;

export const TEMPLATE = `
<div class="frame" id="frame" data-reality="0">
  <canvas id="stage" width="${W}" height="${H}" role="img" tabindex="0"></canvas>
  <div class="hud" id="hud" hidden>
    <div class="objective" id="objective"></div>
    <div class="tools" id="tools">
      <button id="btnShift" type="button" hidden></button>
      <button id="btnTime" type="button" hidden></button>
      <button id="btnPause" type="button"></button>
    </div>
    <div class="reality" id="reality" hidden></div>
    <div class="caption" id="caption" hidden><b id="who"></b><span id="line"></span></div>
  </div>
  <button class="prompt" id="prompt" type="button" hidden></button>
  <div class="toast" id="toast" role="status" hidden></div>
  <div class="touch" id="touch" hidden>
    <div><button type="button" data-bit="1" aria-label="left">◀</button><button type="button" data-bit="2" aria-label="right">▶</button></div>
    <div><button type="button" data-bit="64" aria-label="use">●</button><button type="button" data-bit="32" aria-label="dash">»</button><button type="button" data-bit="16" aria-label="jump">▲</button></div>
  </div>
  <aside class="panel" id="panel" hidden aria-labelledby="panelTitle"></aside>
  <div class="veil" id="veil" hidden></div>
  <div class="sr" aria-live="polite" id="polite"></div>
  <div class="sr" aria-live="assertive" id="assertive"></div>
</div>`;

/** @param {string} s @param {Record<string, any>} [vars] */
export function fill(s, vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? `{${k}}` : String(vars[k])));
}

/** Tiny DOM builder: el("button.primary", {type: "button"}, "Start"). */
export function el(spec, attrs, ...kids) {
  const [tag, ...classes] = spec.split(".");
  const node = document.createElement(tag || "div");
  if (classes.length) node.className = classes.join(" ");
  if (attrs)
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "on") for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
      else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, String(v));
    }
  for (const kid of kids.flat()) if (kid != null) node.append(kid);
  return node;
}
