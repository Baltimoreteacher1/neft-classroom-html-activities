export const ACCENTS = {
  group1: {
    name: "Foundations",
    hue: "#1457b8",
    deep: "#0b2f6b",
    soft: "#e8f1ff",
    pop: "#f5b942",
    emoji: "🤝",
  },
  group2: {
    name: "Challenge Lab",
    hue: "#a34b08",
    deep: "#5f2900",
    soft: "#fff0dc",
    pop: "#1f8a70",
    emoji: "🚀",
  },
  catchup: {
    name: "Catch-Up",
    hue: "#0f766e",
    deep: "#134e4a",
    soft: "#def7f2",
    pop: "#e09f24",
    emoji: "🧭",
  },
};

// Language lanes for vocabulary surfaces (cards + inline pop-ups). English is
// always shown; Spanish is the only additional lane (Joel directive
// 2026-07-16: English and Spanish only — do not add other languages).
export const VOCAB_LANGS = [
  { id: "es", suffix: "Es", label: "Español", speech: "es-ES", dir: "ltr" },
];

// Objectives are authored in facilitation voice ("With my small group, I
// can…"). Students drive the studio themselves, so strip the group preamble
// at render time — configs are generated and stay untouched.
export function studentVoice(text) {
  const cleaned = String(text || "").replace(/^with (?:my|your|the) small group,?\s*/i, "");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Device-wide Spanish lane: chosen from the vocabulary language bar, read at
// render time anywhere student text is drawn.
export const esLane = () => {
  try {
    return window.localStorage.getItem("nt-sg-lang") === "es";
  } catch {
    return false;
  }
};

// Bilingual line: English always, Spanish beneath it when the lane is on.
export const bi = (en, es) =>
  es && esLane() ? `${esc(en)}<span class="sg-es" lang="es">${esc(es)}</span>` : esc(en);

export const esc = (value) =>
  String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

// Shared numbered section heading used by every studio section.
export function sectionHeading(number, eyebrow, title) {
  return el(
    "div",
    "sg-h",
    `<span class="n">${number}</span><div><div class="sg-eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2></div>`,
  );
}

// Shared read-aloud helper. Degrades the trigger button gracefully when the
// device has no speech engine; `lang` lets vocabulary speak Spanish correctly.
export function speak(text, button, lang = "en-US") {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    button.disabled = true;
    button.textContent = "Read aloud unavailable";
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.92;
  button.setAttribute("aria-pressed", "true");
  utterance.onend = () => button.setAttribute("aria-pressed", "false");
  window.speechSynthesis.speak(utterance);
}

export function celebrate(symbol = "✨") {
  const burst = el("div", "sg-burst", esc(symbol));
  burst.setAttribute("aria-hidden", "true");
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 900);
}

export function injectSmallGroupStyles(accent) {
  document.documentElement.style.setProperty("--sg", accent.hue);
  document.documentElement.style.setProperty("--sg-deep", accent.deep);
  document.documentElement.style.setProperty("--sg-soft", accent.soft);
  document.documentElement.style.setProperty("--sg-pop", accent.pop);
  if (!document.getElementById("sg-innovation-styles")) {
    const innovation = document.createElement("link");
    innovation.id = "sg-innovation-styles";
    innovation.rel = "stylesheet";
    innovation.href = "/assets/small-group-innovation.css?v=20260716-gold2";
    document.head.appendChild(innovation);
  }
  if (!document.getElementById("sg-annotation-styles")) {
    const annotation = document.createElement("link");
    annotation.id = "sg-annotation-styles";
    annotation.rel = "stylesheet";
    annotation.href = "/assets/small-group-annotation.css?v=20260716-gold2";
    document.head.appendChild(annotation);
  }
  if (document.getElementById("sg-styles")) return;

  if (!document.getElementById("sg-fonts")) {
    const fonts = document.createElement("link");
    fonts.id = "sg-fonts";
    fonts.rel = "stylesheet";
    fonts.href =
      "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Nunito:wght@700;800;900&display=swap";
    document.head.appendChild(fonts);
  }

  const styles = document.createElement("style");
  styles.id = "sg-styles";
  styles.textContent = `
    :root{--sg-line:#d9e0e8;--sg-paper:#f4f1e9;--sg-card:#fff;--sg-text:#172033;--sg-muted:#536174;--sg-good:#16734b;--sg-warn:#9a4b05}
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;color:var(--sg-text);font-family:"Atkinson Hyperlegible",system-ui,sans-serif;font-size:17px;line-height:1.55;background-color:var(--sg-paper);background-image:radial-gradient(circle at 1px 1px,rgba(23,32,51,.08) 1px,transparent 0);background-size:24px 24px;-webkit-font-smoothing:antialiased}
    button,input,textarea{font:inherit}
    button,a,input,textarea,summary{outline-offset:4px}
    button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--sg-deep);box-shadow:0 0 0 6px color-mix(in srgb,var(--sg-pop) 45%,transparent)}
    #app{max-width:1040px;margin:0 auto;padding:0 22px 100px}
    h1,h2,h3{font-family:"Nunito","Atkinson Hyperlegible",sans-serif;line-height:1.14;margin:0}
    p{margin:0 0 12px}
    .sg-hero{position:relative;overflow:hidden;margin:0 -22px 24px;padding:30px 28px 28px;color:#fff;background:linear-gradient(118deg,var(--sg-deep),var(--sg) 70%,color-mix(in srgb,var(--sg) 72%,white));border-bottom:8px solid var(--sg-pop)}
    .sg-hero::after{content:"";position:absolute;right:-55px;top:-90px;width:250px;height:250px;border:42px solid rgba(255,255,255,.11);border-radius:50%;transform:rotate(-12deg)}
    .sg-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:22px;align-items:end}
    .sg-kicker{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border:1px solid rgba(255,255,255,.44);border-radius:999px;background:rgba(255,255,255,.16);font-family:"Nunito",sans-serif;font-size:13px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
    .sg-hero h1{max-width:720px;margin:12px 0 8px;font-size:clamp(30px,5vw,48px);font-weight:900;letter-spacing:-.025em}
    .sg-obj{max-width:780px;font-size:18px;font-weight:700}
    .sg-langobj{max-width:780px;font-size:15px;color:rgba(255,255,255,.9)}
    .sg-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .sg-chip{padding:5px 11px;border:1px solid rgba(255,255,255,.42);border-radius:8px;background:rgba(8,25,54,.22);font-size:13px;font-weight:700}
    .sg-hero-mark{display:grid;width:112px;height:112px;place-items:center;border:2px solid rgba(255,255,255,.48);border-radius:28px 10px 28px 10px;background:rgba(255,255,255,.16);font-size:58px;transform:rotate(3deg);box-shadow:0 16px 30px rgba(0,0,0,.15)}
    .sg-teacher{margin:0 0 22px}
    .sg-teacher details{border:2px dashed var(--sg);border-radius:14px;background:#fff}
    .sg-teacher summary{cursor:pointer;padding:13px 16px;font-family:"Nunito",sans-serif;font-weight:900;color:var(--sg-deep)}
    .sg-tbody{padding:0 18px 18px}.sg-tbody li{margin:5px 0}.sg-frames,.sg-wordbank{display:flex;flex-wrap:wrap;gap:8px}
    .sg-frame,.sg-word{padding:7px 11px;border-radius:9px;background:var(--sg-soft);color:var(--sg-deep);font-weight:700}
    .sg-mode{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 -22px;padding:9px 22px;color:#fff;background:#172033;font-family:"Nunito",sans-serif;font-size:14px;font-weight:900}
    .sg-mode-action{min-height:44px;padding:9px 12px;border:1px solid rgba(255,255,255,.5);border-radius:9px;color:#fff;text-decoration:none}
    .sg-mode--teacher{background:#58320a}.sg-mode-notice{margin:12px 0;padding:11px 14px;border:1px solid #d97706;border-radius:11px;color:#743706;background:#fff5e7}
    .sg-rail{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:5px;margin:0 -10px 28px;padding:10px;border:1px solid rgba(23,32,51,.09);border-radius:0 0 16px 16px;background:rgba(244,241,233,.94);backdrop-filter:blur(12px);box-shadow:0 5px 18px rgba(23,32,51,.08)}
    .sg-tabs{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin:0 -10px 28px;padding:10px;border:1px solid rgba(23,32,51,.09);border-radius:0 0 16px 16px;background:rgba(244,241,233,.96);backdrop-filter:blur(12px);box-shadow:0 5px 18px rgba(23,32,51,.08)}
    .sg-step{display:flex;min-height:45px;align-items:center;justify-content:center;gap:7px;border:0;border-radius:10px;background:transparent;color:var(--sg-muted);font-size:13px;font-weight:800;cursor:pointer}
    .sg-step .dot{display:grid;width:25px;height:25px;flex:none;place-items:center;border-radius:8px;background:#e3e7ed}
    .sg-step.done{color:var(--sg-deep);background:#fff}.sg-step.done .dot{color:#fff;background:var(--sg)}
    .sg-step[aria-selected="true"]{color:#fff;background:var(--sg)}.sg-step[aria-selected="true"] .dot{color:var(--sg-deep);background:var(--sg-pop)}
    .sg-tabpanel[hidden]{display:none!important}.sg-panel{min-height:360px}.sg-next{display:flex;justify-content:flex-end;margin:24px 0 8px;padding-top:20px;border-top:1px solid var(--sg-line)}
    section.sg-sec{margin:0 0 32px;scroll-margin-top:84px}
    .sg-h{display:flex;align-items:center;gap:12px;margin-bottom:14px}
    .sg-h .n{display:grid;width:36px;height:36px;flex:none;place-items:center;border-radius:12px 5px 12px 5px;color:#fff;background:var(--sg);font-family:"Nunito",sans-serif;font-weight:900;box-shadow:4px 4px 0 var(--sg-pop)}
    .sg-h h2{font-size:clamp(23px,4vw,31px);font-weight:900;letter-spacing:-.02em}
    .sg-eyebrow{margin-bottom:3px;color:var(--sg);font-family:"Nunito",sans-serif;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .card,.sg-mission,.sg-talk,.prob{border:1px solid var(--sg-line);border-radius:18px;background:var(--sg-card);box-shadow:0 8px 24px rgba(23,32,51,.07)}
    .card{padding:20px;margin-bottom:14px}
    .sg-mission{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);overflow:hidden}
    .sg-mission-copy{padding:22px}.sg-mission-visual{min-height:230px;background:var(--sg-soft)}
    .sg-mission-visual.no-image{display:grid;place-items:center;padding:22px;color:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:70px}
    .sg-context{font-size:18px;font-weight:700}
    .sg-toolrow,.row,.sg-pulse,.sg-rolebar{display:flex;flex-wrap:wrap;gap:9px;align-items:center}
    .sg-toolrow{margin:14px 0}.sg-pulse{margin-top:14px}
    .btn,.sg-pulse-btn,.sg-role-btn,.sg-match-btn,.choice,.wchip{min-height:44px;border-radius:11px;cursor:pointer;transition:transform .12s,border-color .12s,background .12s}
    .btn{padding:9px 16px;border:2px solid var(--sg);color:#fff;background:var(--sg);font-family:"Nunito",sans-serif;font-size:15px;font-weight:900;text-decoration:none}
    .btn:hover:not(:disabled){transform:translateY(-1px)}.btn.ghost{color:var(--sg-deep);background:#fff}.btn:disabled{opacity:.55;cursor:default}
    .sg-pulse-btn,.sg-role-btn,.sg-match-btn{padding:9px 13px;border:2px solid var(--sg-line);color:var(--sg-text);background:#fff;font-weight:700;text-align:left}
    .sg-pulse-btn:hover,.sg-role-btn:hover,.sg-match-btn:hover{border-color:var(--sg)}
    .sg-pulse-btn[aria-pressed="true"],.sg-role-btn.active{border-color:var(--sg);color:var(--sg-deep);background:var(--sg-soft)}
    .sg-ta{width:100%;min-height:82px;padding:11px 12px;border:2px solid var(--sg-line);border-radius:10px;color:var(--sg-text);background:#fff;resize:vertical}
    .keyidea{margin-bottom:16px;padding:15px 17px;border-left:6px solid var(--sg);border-radius:12px;background:var(--sg-soft);color:var(--sg-deep);font-size:17px;font-weight:700}
    .keyidea .lab,.block-lab{display:block;margin-bottom:5px;font-family:"Nunito",sans-serif;font-size:13px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}
    .we-steps,.steplist{margin:10px 0;border:1px solid var(--sg-line);border-radius:13px;padding:7px 16px}.steps{margin:0;padding:0;list-style:none;counter-reset:step}
    .steps li{position:relative;padding:8px 0 8px 35px;border-bottom:1px dashed var(--sg-line)}.steps li:last-child{border:0}.steps li::before{counter-increment:step;content:counter(step);position:absolute;left:0;top:8px;display:grid;width:23px;height:23px;place-items:center;border-radius:8px;background:var(--sg-soft);color:var(--sg-deep);font-weight:900}
    .sg-vgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
    .sg-vcard{position:relative;padding:17px;border:1px solid var(--sg-line);border-radius:16px;background:#fff;box-shadow:0 5px 16px rgba(23,32,51,.05)}.sg-vcard-picture{display:grid;min-height:150px;margin:-5px -5px 14px;place-items:center;overflow:hidden;border-radius:13px;background:var(--sg-soft)}.sg-vcard-picture img{display:block;width:100%;max-height:190px;object-fit:contain;transition:opacity .18s ease}.sg-vcard-picture img[data-image-state="loading"]{opacity:.35}
    .sg-vterm{padding-right:42px;color:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:21px;font-weight:900}.sg-vtranslations{margin:5px 0;color:var(--sg-muted);font-size:14px}.sg-vdef{margin-top:12px;padding-top:12px;border-top:1px dashed var(--sg-line)}.sg-vdef-line{margin:0 0 9px}.sg-vdef-line:last-child{margin-bottom:0}.sg-vdef-language{display:block;color:var(--sg);font-family:"Nunito",sans-serif;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
    .sg-speak{position:absolute;right:10px;top:10px;display:grid;width:44px;height:44px;place-items:center;border:1px solid var(--sg-line);border-radius:50%;background:#fff;cursor:pointer}
    .sg-match{margin-top:16px;padding:18px;border:2px solid var(--sg);border-radius:16px;background:var(--sg-soft)}.sg-match-options{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:12px}.sg-match-status{min-height:26px;margin-top:10px;font-weight:700}
    .sg-talk{padding:22px}.sg-talk-q{font-size:20px;font-weight:700}.sg-rolebar{margin:16px 0;padding:13px;border-radius:13px;background:var(--sg-soft)}.sg-role{font-family:"Nunito",sans-serif;font-weight:900;color:var(--sg-deep)}
    .sg-timer{display:flex;align-items:center;gap:12px;margin-top:15px}.sg-clock{min-width:92px;color:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:31px;font-weight:900;font-variant-numeric:tabular-nums}.sg-timer-track{height:12px;flex:1;overflow:hidden;border-radius:999px;background:#e2e7ed}.sg-timer-fill{height:100%;width:100%;background:var(--sg);transform-origin:left;transition:width .25s linear}
    .sg-directions{margin:-3px 0 14px;padding:11px 14px;border-left:5px solid var(--sg);border-radius:10px;background:var(--sg-soft);color:var(--sg-deep);font-weight:700}.prob{padding:18px;margin-bottom:14px;scroll-margin-top:96px}.q{display:flex;gap:10px;margin:0 0 14px;font-size:17px;font-weight:700}.pn{display:grid;width:29px;height:29px;flex:none;place-items:center;border-radius:9px;color:#fff;background:var(--sg);font-weight:900}
    .sg-problem-nav{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:14px 0 24px}.sg-problem-nav .btn:last-child{justify-self:end}.sg-problem-count{color:var(--sg-deep);font-family:"Nunito",sans-serif;font-weight:900;text-align:center}.mistake summary{cursor:pointer;font-weight:900}.mistake p{margin:9px 0 0}
    .sg-problem-support-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0 8px}.sg-visual-title{color:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:20px;font-weight:900}.sg-read-problem{min-height:44px;padding:8px 12px}.sg-problem-visual{overflow:hidden;margin:0 0 12px;border:3px solid var(--sg);border-radius:20px;background:#fffdf8;box-shadow:0 10px 25px rgba(23,32,51,.09)}.sg-problem-visual svg{display:block;width:100%;min-height:250px;height:auto}.sg-problem-visual svg text{fill:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:22px;font-weight:900}.sg-problem-visual .sg-layer-2,.sg-problem-visual .sg-layer-3{opacity:.12;transition:opacity .2s}.prob.sg-show-layer-2 .sg-layer-2,.prob.sg-show-layer-3 .sg-layer-2,.prob.sg-show-layer-3 .sg-layer-3{opacity:1}
    /* Workspace reveal: answer pieces stay hidden until the student earns them step by step */
    .sg-problem-visual .sg-ans{opacity:0;transition:opacity .35s}
    .prob.sg-done-1 .sg-ans-1,.prob.sg-done-2 .sg-ans-2,.prob.sg-done-3 .sg-ans-3,.prob.sg-done-4 .sg-ans-4,.prob.sg-done-all .sg-problem-visual .sg-ans{opacity:1}
    .prob.sg-done-1 .sg-q-1,.prob.sg-done-2 .sg-q-2,.prob.sg-done-all .sg-q-1,.prob.sg-done-all .sg-q-2{opacity:0}
    .sg-problem-visual .sg-hl-1,.sg-problem-visual .sg-hl-3{transition:fill .35s}
    .prob.sg-done-1 .sg-hl-1,.prob.sg-done-3 .sg-hl-3,.prob.sg-done-all .sg-hl-1,.prob.sg-done-all .sg-hl-3{fill:var(--sg-pop)}
    /* Typed models: students put the numbers into the model themselves */
    .sg-problem-model{margin:0 0 12px;padding:18px;border:3px solid var(--sg);border-radius:20px;background:#fffdf8;box-shadow:0 10px 25px rgba(23,32,51,.09)}
    .sg-problem-model svg{display:block;width:100%;min-height:220px;height:auto}
    .sg-problem-model svg text{fill:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:22px;font-weight:900}
    .sg-model-title{margin-bottom:4px;color:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:19px;font-weight:900}
    .sg-model-hint{margin:0 0 12px;color:var(--sg-muted);font-weight:700;font-size:15px}
    .sg-model-status{min-height:24px;margin:10px 0 0;color:var(--sg-good);font-weight:800}
    .sg-model-row{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:10px 0}
    .sg-model-rowlab{color:var(--sg-deep);font-family:"Nunito",sans-serif;font-weight:900}
    .sg-model-boxes{display:flex;flex-wrap:wrap;gap:7px}
    .sg-model-cell{width:64px;min-height:48px;padding:6px;border:2px dashed var(--sg);border-radius:11px;background:#fff;color:var(--sg-deep);font-size:20px;font-weight:900;text-align:center}
    .sg-model-cell:focus{border-style:solid}
    .sg-model-cell.ok{border:2px solid var(--sg-good);background:#e9f8f0;color:#0e5033}
    .sg-model-cell.bad{border:2px solid #bd3c31;background:#fff0ee;color:#7c2d24}
    .sg-model-cell.gold{border:3px solid #9b5c00;background:var(--sg-pop);color:#332000}
    .sg-tree{display:grid;justify-items:center;gap:6px;padding:8px 0}
    .sg-tree-root{display:grid;width:76px;height:76px;place-items:center;border-radius:50%;background:var(--sg);color:#fff;font-family:"Nunito",sans-serif;font-size:26px;font-weight:900}
    .sg-tree-branches{color:var(--sg-deep);font-size:24px;font-weight:900;letter-spacing:8px}
    .sg-tree-row{justify-content:center;gap:56px}
    .sg-tree-row .sg-model-cell{width:84px;border-radius:50%;min-height:64px}
    .sg-div-top{display:flex;justify-content:center;margin-left:56px}
    .sg-div-bracket{text-align:center;color:var(--sg-deep);font-family:"Nunito",ui-monospace,monospace;font-size:38px;font-weight:900;border-top:4px solid var(--sg-deep);width:max-content;margin:2px auto 8px;padding:2px 14px}
    .sg-model-table{display:grid;grid-template-columns:repeat(2,minmax(120px,220px));gap:8px;justify-content:center;margin:8px 0}
    .sg-model-tcell{display:grid;place-items:center;min-height:54px;padding:8px;border:2px solid var(--sg);border-radius:11px;background:#fff;color:var(--sg-deep);font-size:19px;font-weight:900}
    .sg-model-tcell.head{background:var(--sg);color:#fff;font-family:"Nunito",sans-serif}
    .sg-model-tcell .sg-model-cell{width:100%;border-width:2px}
    .sg-model-sym{min-width:56px;min-height:48px;border:2px solid var(--sg-line);border-radius:11px;background:#fff;color:var(--sg-deep);font-size:24px;font-weight:900;cursor:pointer}
    .sg-model-sym.ok{border-color:var(--sg-good);background:#e9f8f0}
    .sg-model-sym.bad{border-color:#bd3c31;background:#fff0ee;opacity:.6}
    .sg-frac-stack{display:inline-grid;justify-items:center;gap:4px}
    .sg-frac-bar{display:block;width:64px;height:4px;border-radius:2px;background:var(--sg-deep)}
    .sg-plot-grid{cursor:crosshair;touch-action:manipulation}
    .sg-tile-tray{min-height:56px;padding:9px;border:2px dashed var(--sg-line);border-radius:12px}
    .sg-tile{min-width:44px;min-height:52px;border-radius:10px;font-family:"Nunito",sans-serif;font-size:20px;font-weight:900;cursor:pointer;border:2px solid var(--sg-deep)}
    .sg-tile.is-x{background:var(--sg);color:#fff;min-width:64px}
    .sg-tile.is-one{background:var(--sg-pop);color:#332000}
    .sg-es{display:block;margin-top:3px;color:var(--sg-muted);font-weight:600;font-size:.93em}
    /* Place-value giant workspace: the stacked column math IS the visual */
    .sg-big-work .colmath{min-width:320px;padding:24px 38px;border:3px solid var(--sg);border-radius:20px;background:#fffdf8;box-shadow:0 10px 25px rgba(23,32,51,.09);font-size:44px}
    .sg-big-work .colmath .fillin{width:220px;font-size:40px}
    .sg-big-work .eqcap{font-size:22px}
    .sg-math-tool,.sg-guided-steps{margin:12px 0;border:2px solid var(--sg);border-radius:16px;background:#fff}.sg-math-tool summary,.sg-guided-steps>summary{cursor:pointer;padding:12px 15px;color:var(--sg-deep);font-family:"Nunito",sans-serif;font-weight:900}.sg-tool-body,.sg-step-sequence{padding:0 15px 15px}.sg-tool-directions,.sg-step-intro{color:var(--sg-muted);font-weight:700}.sg-model-slider{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;margin:12px 0;padding:12px;border-radius:12px;background:var(--sg-soft);font-weight:900}.sg-model-slider input{width:100%;accent-color:var(--sg)}.sg-value-tray,.sg-operator-tray,.sg-value-work,.sg-model-expression{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}.sg-operator-tray{padding-top:10px;border-top:1px dashed var(--sg-line)}.sg-value-chip{min-width:52px;min-height:46px;padding:7px 12px;border:2px solid var(--sg);border-radius:11px;color:var(--sg-deep);background:#fff;font-size:20px;font-weight:900;cursor:pointer}.sg-operator-chip{min-width:46px;color:#fff;background:var(--sg-deep)}.sg-value-work{min-height:76px;padding:10px;border:2px dashed var(--sg-line);border-radius:12px}.sg-model-label{font-weight:900}.sg-model-expression{min-width:150px;flex:1;margin:0}.sg-work-chip{min-width:44px;min-height:44px;padding:6px 11px;border:2px solid color-mix(in srgb,var(--sg-pop) 45%,black);border-radius:9px;color:color-mix(in srgb,var(--sg-pop) 20%,black);background:var(--sg-pop);font-weight:900;cursor:pointer}.sg-clear-model{margin-left:auto}
    .sg-guided-steps{padding:15px;background:linear-gradient(135deg,#fff,var(--sg-soft))}.sg-guided-steps>summary{margin:-15px}.sg-guided-steps[open]>summary{margin:-15px -15px 12px}.sg-fill-step{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;margin:10px 0;padding:14px;border:2px solid var(--sg-line);border-radius:14px;background:#fff}.sg-fill-step[hidden]{display:none}.sg-fill-step.complete{border-color:var(--sg-good);background:#e9f8f0}.sg-fill-step.needs-revision{border-color:#d97706;background:#fff5e7}.sg-fill-number{display:grid;width:36px;height:36px;place-items:center;border-radius:11px;color:#fff;background:var(--sg);font-family:"Nunito",sans-serif;font-weight:900}.sg-fill-prompt{font-size:19px;font-weight:800}.sg-step-input{width:min(180px,100%);margin:0 5px;padding:5px 8px;border:0;border-bottom:3px solid var(--sg);color:var(--sg-deep);background:#fff;font-size:20px;font-weight:900;text-align:center}.sg-step-check{min-height:44px;padding:8px 12px}.sg-step-status{grid-column:2/-1;color:var(--sg-muted);font-weight:700}
    .choices{display:grid;gap:9px}.choice{display:flex;width:100%;align-items:center;gap:10px;padding:11px 14px;border:2px solid var(--sg-line);color:var(--sg-text);background:#fff;text-align:left}.choice:hover:not(:disabled){border-color:var(--sg);background:var(--sg-soft)}.choice .k{display:grid;width:27px;height:27px;flex:none;place-items:center;border-radius:8px;background:#edf0f4;font-weight:900}.choice.correct{border-color:var(--sg-good);background:#e9f8f0}.choice.wrong{border-color:#bd3c31;background:#fff0ee}.choice:disabled{cursor:default;opacity:.75}
    .fb{display:none;margin-top:12px;padding:12px 14px;border-radius:11px}.fb.show{display:block}.fb.ok{border:1px solid var(--sg-good);color:#0e5033;background:#e9f8f0}.fb.no{border:1px solid #d97706;color:#743706;background:#fff5e7}.fb.info{border:1px solid var(--sg);color:var(--sg-deep);background:var(--sg-soft)}
    .hintbox p{margin:7px 0;padding:9px 12px;border-radius:9px;background:var(--sg-soft);color:var(--sg-deep)}
    .eqcap{margin-bottom:7px;color:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:19px;font-weight:900}.colmath{display:inline-grid;min-width:160px;justify-items:end;gap:2px;padding:11px 18px;border-radius:13px;background:var(--sg-soft);font-family:"Nunito",ui-monospace,monospace;font-size:27px;font-weight:900}.col-op{margin-right:15px;color:var(--sg)}.col-rule{width:100%;height:3px;margin:3px 0;background:var(--sg-deep)}
    .fillline,.stepline,.gs-row{display:flex;align-items:center;flex-wrap:wrap;gap:7px}.fillline{margin:5px 0}.fillin,.stepfill{border:0;border-bottom:3px solid var(--sg);color:var(--sg-deep);background:transparent;font-weight:900;text-align:center}.fillin{width:150px;padding:3px 7px;font-size:24px}.stepfill{width:90px;padding:2px 4px}.fillin.ok,.stepfill.ok{color:var(--sg-good);border-color:var(--sg-good)}.fillin.bad,.stepfill.bad{color:#bd3c31;border-color:#bd3c31}.filllab{font-weight:900}.fillunit{color:var(--sg-muted);font-weight:700}
    .wbank{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}.wbank-lab{font-size:13px;font-weight:900;text-transform:uppercase}.wchip{padding:7px 12px;border:2px solid var(--sg);color:var(--sg-deep);background:var(--sg-soft);font-weight:700}.stepline,.gs-row{padding:9px 0;border-bottom:1px dashed var(--sg-line)}.stepline:last-child,.gs-row:last-child{border:0}.sn{display:grid;width:25px;height:25px;flex:none;place-items:center;border-radius:8px;color:var(--sg-deep);background:var(--sg-soft);font-weight:900}.gs-row.locked{opacity:.35;pointer-events:none}.gs-check{min-height:44px;padding:8px 12px}.gs-intro,.mistake{padding:11px 14px;border-radius:12px}.gs-intro{color:var(--sg-deep);background:var(--sg-soft)}.mistake{margin-bottom:13px;border:1px solid #d97706;color:#743706;background:#fff5e7}.sg-tick{color:var(--sg-good);font-size:20px;font-weight:900}
    .sg-reflect{padding:24px;border:2px solid var(--sg);border-radius:18px;background:linear-gradient(135deg,#fff,var(--sg-soft))}.sg-growth{display:grid;grid-template-columns:auto 1fr;gap:13px;align-items:center;margin-bottom:16px}.sg-growth-icon{font-size:48px}.sg-done{margin-top:20px;padding:20px;border:2px dashed var(--sg);border-radius:17px;color:var(--sg-deep);background:var(--sg-soft);text-align:center}.sg-foot{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:28px}
    /* ── Interactive labs (Explore / Model / Apply) ── */
    .sg-lab{--sp-1:4px;--sp-2:8px;--sp-3:12px;--sp-4:16px;--sp-5:20px;--sp-6:24px;--radius-sm:8px;--radius:12px;--teal:var(--sg);--teal-light:var(--sg-soft);--teal-dark:var(--sg-deep);--navy:var(--sg-deep);--coral:#d9795d;--cream:#fdf9f0;--muted:var(--sg-muted);--ink:var(--sg-text)}
    .sg-lab-note{padding:11px 14px;border-radius:12px;background:var(--sg-soft);color:var(--sg-deep);font-weight:700}
    .sg-lab-loading{padding:14px;color:var(--sg-muted);font-weight:700}
    .sg-lab-mount{margin:12px 0}
    .sg-lab-mount .card{border:1px solid var(--sg-line);border-radius:16px;background:#fff;padding:16px;box-shadow:0 8px 24px rgba(23,32,51,.07)}
    .sg-figure{margin:12px 0;padding:14px;border:1px solid var(--sg-line);border-radius:16px;background:#fff;box-shadow:0 8px 24px rgba(23,32,51,.07)}
    .sg-donechip{display:inline-flex;align-items:center;gap:7px;margin-bottom:12px;padding:7px 12px;border-radius:999px;background:#e9f8f0;border:1px solid var(--sg-good);color:#0e5033;font-weight:800;font-size:14px}
    .sg-discourse{margin-top:14px;padding:16px;border:2px solid var(--sg);border-radius:14px;background:var(--sg-soft)}
    .sg-datachips{padding:14px;text-align:center}
    .sg-datachips-title{margin-bottom:9px;font-family:"Nunito",sans-serif;font-weight:900;color:var(--sg-deep)}
    .sg-datachips-row{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
    .sg-datachip{display:grid;min-width:44px;padding:9px 12px;place-items:center;border-radius:12px;background:var(--sg);color:#fff;font-family:"Nunito",sans-serif;font-size:20px;font-weight:900;box-shadow:3px 3px 0 var(--sg-pop)}
    .sg-datachips-unit{margin-top:9px;color:var(--sg-muted);font-weight:700}
    .sg-apply-step{transition:opacity .25s}
    .sg-apply-step.locked{opacity:.35;pointer-events:none}
    .sg-step-lab{margin-bottom:9px;font-family:"Nunito",sans-serif;font-size:13px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:var(--sg)}
    .sg-apply-text{font-size:18px;font-weight:600;line-height:1.7}
    .sg-num{margin:0 2px;padding:2px 9px;border:2px dashed var(--sg);border-radius:9px;background:#fff;color:var(--sg-deep);font-weight:900;font-size:17px;cursor:pointer}
    .sg-num.on{background:var(--sg-pop);border-style:solid;color:#332000;box-shadow:0 2px 0 rgba(0,0,0,.15)}
    .sg-planrow{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px}
    .sg-plan{min-height:46px;padding:9px 12px;border:2px solid var(--sg-line);border-radius:11px;background:#fff;font-weight:700;text-align:left;cursor:pointer}
    .sg-plan.on{border-color:var(--sg);background:var(--sg-soft);color:var(--sg-deep)}
    .sg-sample{margin:10px 0;border:1px solid var(--sg-line);border-radius:12px;background:var(--sg-soft)}
    .sg-sample summary{cursor:pointer;padding:11px 14px;color:var(--sg-deep)}
    .sg-sample p{padding:0 14px 12px;margin:0;font-weight:600}
    .sg-mission-visual.has-figure{display:grid;place-items:center;padding:14px;background:#fff}
    .sg-mission-visual.has-figure .sg-figure{margin:0;padding:0;border:0;box-shadow:none;width:100%}
    .sg-speak-inline{margin-left:7px;border:1px solid var(--sg-line);border-radius:50%;width:44px;height:44px;background:#fff;cursor:pointer;font-size:15px}
    /* ── Vocabulary languages + cloze ── */
    .sg-langbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}
    .sg-langbtn{min-height:44px;padding:8px 14px;border:2px solid var(--sg-line);border-radius:999px;background:#fff;font-weight:800;cursor:pointer}
    .sg-langbtn[aria-pressed="true"]{border-color:var(--sg);background:var(--sg-soft);color:var(--sg-deep)}
    .sg-vexamples{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
    .sg-vexample{padding:5px 10px;border-radius:8px;background:#e9f8f0;color:#0e5033;font-size:14px;font-weight:600}
    .sg-vexample.not{background:#fff0ee;color:#7c2d24}
    .sg-cloze{margin-top:14px;padding:18px;border:2px dashed var(--sg);border-radius:16px;background:#fff}
    .sg-cloze-sentence{font-size:18px;font-weight:600;line-height:1.7}
    .sg-cloze-blank{display:inline-grid;min-width:120px;min-height:30px;place-items:center;padding:2px 10px;border-bottom:3px solid var(--sg);color:var(--sg-deep);font-weight:900}
    .sg-cloze-blank.ok{color:var(--sg-good);border-color:var(--sg-good)}
    /* ── Learning map + progress meter ── */
    .sg-map{margin:0 0 24px;padding:20px 22px;border:1px solid var(--sg-line);border-left:6px solid var(--sg);border-radius:18px;background:var(--sg-card);box-shadow:0 8px 24px rgba(23,32,51,.07)}
    .sg-map-goal{margin:0 0 6px;font-size:18px;font-weight:800;color:var(--sg-deep)}
    .sg-map-lang{color:var(--sg-muted);font-weight:600}
    .sg-map-key{margin:12px 0;padding:11px 14px;border-radius:12px;background:var(--sg-soft);color:var(--sg-deep);font-weight:700}
    .sg-path{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:2px}
    .sg-path li{display:grid;grid-template-columns:27px auto 1fr auto;gap:10px;align-items:baseline;padding:7px 0;border-bottom:1px dashed var(--sg-line)}
    .sg-path li:last-child{border:0}
    .sg-path .pn{display:grid;width:24px;height:24px;place-items:center;border-radius:8px;background:var(--sg-soft);color:var(--sg-deep);font-weight:900;font-size:13px;align-self:center}
    .sg-path b{font-family:"Nunito",sans-serif;color:var(--sg-deep)}
    .sg-path .why{color:var(--sg-muted);font-size:15px}
    .sg-path .min{color:var(--sg);font-size:13px;font-weight:900;white-space:nowrap}
    .sg-meter{grid-column:1/-1;display:flex;align-items:center;gap:10px;padding:2px 6px 4px}
    .sg-meter-track{height:8px;flex:1;overflow:hidden;border-radius:999px;background:#e3e7ed}
    .sg-meter-fill{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--sg),var(--sg-pop));transition:width .35s ease}
    .sg-meter-lab{font-size:12px;font-weight:900;color:var(--sg-muted);font-family:"Nunito",sans-serif;white-space:nowrap}
    /* ── Interactive build stepper ── */
    .sg-stage{transition:opacity .25s}
    .sg-stage.locked{opacity:.38;pointer-events:none}
    .sg-stage.done{border-color:var(--sg-good)}
    .sg-stage-steps{margin:4px 0 12px}
    .sg-buildstep{display:flex;gap:10px;padding:9px 0;border-bottom:1px dashed var(--sg-line);animation:sg-stepin .3s ease}
    .sg-buildstep:last-child{border:0}
    .sg-buildstep.now{margin:0 -10px;padding-inline:10px;border-radius:10px;background:var(--sg-soft);border-bottom:0}
    .sg-buildstep-body{font-weight:600}
    @keyframes sg-stepin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    .sg-reveal{margin-left:8px;min-height:44px;padding:8px 13px;border:2px dashed var(--sg);border-radius:999px;background:#fff;color:var(--sg-deep);font-size:13px;font-weight:800;cursor:pointer}
    .sg-reveal-answer{display:inline-block;margin-left:8px;padding:3px 10px;border-radius:8px;background:var(--sg-soft);color:var(--sg-deep);font-weight:800;animation:sg-stepin .3s ease}
    .sg-checkstep{display:flex;width:100%;align-items:center;gap:10px;margin:0 0 7px;padding:11px 13px;border:2px solid var(--sg-line);border-radius:11px;background:#fff;font-weight:600;text-align:left;cursor:pointer}
    .sg-checkstep:hover{border-color:var(--sg)}
    .sg-checkstep.on{border-color:var(--sg-good);background:#e9f8f0}
    .sg-checkstep .tick{display:grid;width:26px;height:26px;flex:none;place-items:center;border-radius:8px;background:var(--sg-soft);color:var(--sg-deep);font-weight:900}
    .sg-checkstep.on .tick{background:var(--sg-good);color:#fff}
    /* ── Success criteria checklist ── */
    .sg-criteria{margin:0 0 16px;display:grid;gap:7px}
    .sg-criteria .block-lab{margin-bottom:2px}
    .sg-solo-note{margin:0 0 12px;padding:10px 13px;border-radius:11px;background:var(--sg-soft);color:var(--sg-deep);font-weight:600;font-size:15px}
    /* ── Welcome-back strip ── */
    .sg-welcome{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 18px;padding:12px 16px;border:1px solid var(--sg-line);border-left:6px solid var(--sg);border-radius:12px;background:#fff;font-weight:700}
    .sg-welcome .btn{min-height:44px;padding:8px 13px;font-size:13px}
    .sg-burst{position:fixed;inset:0;z-index:99;display:grid;place-items:center;pointer-events:none;font-size:86px;animation:sg-pop .85s ease-out forwards}
    @keyframes sg-pop{0%{opacity:0;transform:scale(.25) rotate(-8deg)}35%{opacity:1;transform:scale(1.12) rotate(4deg)}100%{opacity:0;transform:scale(1.35)}}
    @media(max-width:760px){#app{padding-inline:14px}.sg-mode{margin-inline:-14px;padding-inline:14px}.sg-hero{margin-inline:-14px;padding:24px 18px}.sg-hero-grid{grid-template-columns:1fr}.sg-hero-mark{display:none}.sg-mission{grid-template-columns:1fr}.sg-mission-visual{order:-1;min-height:190px}.sg-rail{margin-inline:-5px}.sg-tabs{grid-template-columns:repeat(3,1fr);margin-inline:-5px}.sg-step{min-height:44px}.sg-tabs .sg-step .lbl{display:inline}.sg-match-options{grid-template-columns:1fr}}
    @media(max-width:420px){body{font-size:16px}.sg-hero h1{font-size:29px}.sg-context,.sg-talk-q{font-size:17px}.sg-tabs{position:static;grid-template-columns:repeat(2,1fr)}.sg-problem-nav{grid-template-columns:1fr 1fr}.sg-problem-count{grid-column:1/-1;grid-row:1}.sg-problem-support-head{align-items:flex-start;flex-direction:column}.sg-problem-visual svg{min-height:210px}.sg-fill-step{grid-template-columns:auto minmax(0,1fr)}.sg-step-check{grid-column:2}.sg-step-status{grid-column:1/-1}.btn,.sg-pulse-btn,.sg-role-btn,.sg-match-btn,.choice{width:100%;justify-content:flex-start}.sg-timer{align-items:flex-start;flex-direction:column}.sg-timer-track{width:100%;flex:none}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.sg-burst{display:none}.btn,.choice{transition:none}}
    @media print{body{background:#fff}.sg-mode,.sg-tabs,.sg-rail,.sg-meter,.sg-reveal,.sg-toolrow,.sg-pulse,.sg-timer,.sg-foot,.sg-teacher,.btn,.sg-speak,#mwb-launcher,.sg-problem-nav,.sg-annotation-tools{display:none!important}.sg-tabpanel[hidden]{display:block!important}.prob[hidden]{display:block!important}.sg-fill-step[hidden]{display:grid!important}.sg-fill-step.locked,.gs-row.locked,.sg-stage.locked,.sg-apply-step.locked{opacity:1!important;pointer-events:auto}.sg-reveal-answer[hidden]{display:inline-block!important}#app{max-width:none;padding:0}.sg-hero{margin:0 0 16px;padding:0 0 12px;color:#111;background:#fff;border-bottom:3px solid #111}.sg-hero h1,.sg-obj,.sg-langobj{color:#111}.sg-kicker,.sg-chip{color:#111;background:#eee;border-color:#bbb}.card,.sg-mission,.sg-talk,.prob,.sg-vcard{box-shadow:none;break-inside:avoid}.sg-mission{display:block}.sg-mission-visual{display:none}.sg-sec{margin-bottom:18px}}
  `;
  document.head.appendChild(styles);
}
