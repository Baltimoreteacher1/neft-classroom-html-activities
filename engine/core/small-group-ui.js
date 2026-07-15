export const ACCENTS = {
  group1: {
    name: "Extra Support",
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
    button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--sg-pop)}
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
    .sg-rail{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin:0 -10px 28px;padding:10px;border:1px solid rgba(23,32,51,.09);border-radius:0 0 16px 16px;background:rgba(244,241,233,.94);backdrop-filter:blur(12px);box-shadow:0 5px 18px rgba(23,32,51,.08)}
    .sg-step{display:flex;min-height:45px;align-items:center;justify-content:center;gap:7px;border:0;border-radius:10px;background:transparent;color:var(--sg-muted);font-size:13px;font-weight:800;cursor:pointer}
    .sg-step .dot{display:grid;width:25px;height:25px;flex:none;place-items:center;border-radius:8px;background:#e3e7ed}
    .sg-step.done{color:var(--sg-deep);background:#fff}.sg-step.done .dot{color:#fff;background:var(--sg)}
    section.sg-sec{margin:0 0 32px;scroll-margin-top:84px}
    .sg-h{display:flex;align-items:center;gap:12px;margin-bottom:14px}
    .sg-h .n{display:grid;width:36px;height:36px;flex:none;place-items:center;border-radius:12px 5px 12px 5px;color:#fff;background:var(--sg);font-family:"Nunito",sans-serif;font-weight:900;box-shadow:4px 4px 0 var(--sg-pop)}
    .sg-h h2{font-size:clamp(23px,4vw,31px);font-weight:900;letter-spacing:-.02em}
    .sg-eyebrow{margin-bottom:3px;color:var(--sg);font-family:"Nunito",sans-serif;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .card,.sg-mission,.sg-talk,.prob{border:1px solid var(--sg-line);border-radius:18px;background:var(--sg-card);box-shadow:0 8px 24px rgba(23,32,51,.07)}
    .card{padding:20px;margin-bottom:14px}
    .sg-mission{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);overflow:hidden}
    .sg-mission-copy{padding:22px}.sg-mission-visual{min-height:230px;background:var(--sg-soft)}
    .sg-mission-visual img{display:block;width:100%;height:100%;object-fit:cover}
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
    .sg-write-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
    .sg-write{padding:14px;border:1px solid var(--sg-line);border-radius:14px;background:#fbfcfe}
    .sg-write label{display:block;margin-bottom:6px;font-family:"Nunito",sans-serif;font-weight:900;color:var(--sg-deep)}
    .sg-ta{width:100%;min-height:82px;padding:11px 12px;border:2px solid var(--sg-line);border-radius:10px;color:var(--sg-text);background:#fff;resize:vertical}
    .keyidea{margin-bottom:16px;padding:15px 17px;border-left:6px solid var(--sg);border-radius:12px;background:var(--sg-soft);color:var(--sg-deep);font-size:17px;font-weight:700}
    .keyidea .lab,.block-lab{display:block;margin-bottom:5px;font-family:"Nunito",sans-serif;font-size:13px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}
    .we-steps,.steplist{margin:10px 0;border:1px solid var(--sg-line);border-radius:13px;padding:7px 16px}.steps{margin:0;padding:0;list-style:none;counter-reset:step}
    .steps li{position:relative;padding:8px 0 8px 35px;border-bottom:1px dashed var(--sg-line)}.steps li:last-child{border:0}.steps li::before{counter-increment:step;content:counter(step);position:absolute;left:0;top:8px;display:grid;width:23px;height:23px;place-items:center;border-radius:8px;background:var(--sg-soft);color:var(--sg-deep);font-weight:900}
    .sg-vgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
    .sg-vcard{position:relative;min-height:180px;padding:17px;border:1px solid var(--sg-line);border-radius:16px;background:#fff;box-shadow:0 5px 16px rgba(23,32,51,.05)}
    .sg-vterm{padding-right:42px;color:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:21px;font-weight:900}.sg-vtranslations{margin:5px 0;color:var(--sg-muted);font-size:14px}.sg-vdef{margin-top:12px;padding-top:12px;border-top:1px dashed var(--sg-line)}
    .sg-speak{position:absolute;right:12px;top:12px;display:grid;width:38px;height:38px;place-items:center;border:1px solid var(--sg-line);border-radius:50%;background:#fff;cursor:pointer}
    .sg-match{margin-top:16px;padding:18px;border:2px solid var(--sg);border-radius:16px;background:var(--sg-soft)}.sg-match-options{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:12px}.sg-match-status{min-height:26px;margin-top:10px;font-weight:700}
    .sg-talk{padding:22px}.sg-talk-q{font-size:20px;font-weight:700}.sg-rolebar{margin:16px 0;padding:13px;border-radius:13px;background:var(--sg-soft)}.sg-role{font-family:"Nunito",sans-serif;font-weight:900;color:var(--sg-deep)}
    .sg-timer{display:flex;align-items:center;gap:12px;margin-top:15px}.sg-clock{min-width:92px;color:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:31px;font-weight:900;font-variant-numeric:tabular-nums}.sg-timer-track{height:12px;flex:1;overflow:hidden;border-radius:999px;background:#e2e7ed}.sg-timer-fill{height:100%;width:100%;background:var(--sg);transform-origin:left;transition:width .25s linear}
    .prob{padding:18px;margin-bottom:14px}.q{display:flex;gap:10px;margin:0 0 14px;font-size:17px;font-weight:700}.pn{display:grid;width:29px;height:29px;flex:none;place-items:center;border-radius:9px;color:#fff;background:var(--sg);font-weight:900}
    .choices{display:grid;gap:9px}.choice{display:flex;width:100%;align-items:center;gap:10px;padding:11px 14px;border:2px solid var(--sg-line);color:var(--sg-text);background:#fff;text-align:left}.choice:hover:not(:disabled){border-color:var(--sg);background:var(--sg-soft)}.choice .k{display:grid;width:27px;height:27px;flex:none;place-items:center;border-radius:8px;background:#edf0f4;font-weight:900}.choice.correct{border-color:var(--sg-good);background:#e9f8f0}.choice.wrong{border-color:#bd3c31;background:#fff0ee}.choice:disabled{cursor:default;opacity:.75}
    .fb{display:none;margin-top:12px;padding:12px 14px;border-radius:11px}.fb.show{display:block}.fb.ok{border:1px solid var(--sg-good);color:#0e5033;background:#e9f8f0}.fb.no{border:1px solid #d97706;color:#743706;background:#fff5e7}.fb.info{border:1px solid var(--sg);color:var(--sg-deep);background:var(--sg-soft)}
    .hintbox p{margin:7px 0;padding:9px 12px;border-radius:9px;background:var(--sg-soft);color:var(--sg-deep)}
    .eqcap{margin-bottom:7px;color:var(--sg-deep);font-family:"Nunito",sans-serif;font-size:19px;font-weight:900}.colmath{display:inline-grid;min-width:160px;justify-items:end;gap:2px;padding:11px 18px;border-radius:13px;background:var(--sg-soft);font-family:"Nunito",ui-monospace,monospace;font-size:27px;font-weight:900}.col-op{margin-right:15px;color:var(--sg)}.col-rule{width:100%;height:3px;margin:3px 0;background:var(--sg-deep)}
    .fillline,.stepline,.gs-row{display:flex;align-items:center;flex-wrap:wrap;gap:7px}.fillline{margin:5px 0}.fillin,.stepfill{border:0;border-bottom:3px solid var(--sg);color:var(--sg-deep);background:transparent;font-weight:900;text-align:center}.fillin{width:150px;padding:3px 7px;font-size:24px}.stepfill{width:90px;padding:2px 4px}.fillin.ok,.stepfill.ok{color:var(--sg-good);border-color:var(--sg-good)}.fillin.bad,.stepfill.bad{color:#bd3c31;border-color:#bd3c31}.filllab{font-weight:900}.fillunit{color:var(--sg-muted);font-weight:700}
    .wbank{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}.wbank-lab{font-size:13px;font-weight:900;text-transform:uppercase}.wchip{padding:7px 12px;border:2px solid var(--sg);color:var(--sg-deep);background:var(--sg-soft);font-weight:700}.stepline,.gs-row{padding:9px 0;border-bottom:1px dashed var(--sg-line)}.stepline:last-child,.gs-row:last-child{border:0}.sn{display:grid;width:25px;height:25px;flex:none;place-items:center;border-radius:8px;color:var(--sg-deep);background:var(--sg-soft);font-weight:900}.gs-row.locked{opacity:.35;pointer-events:none}.gs-check{min-height:36px;padding:5px 11px}.gs-intro,.mistake{padding:11px 14px;border-radius:12px}.gs-intro{color:var(--sg-deep);background:var(--sg-soft)}.mistake{margin-bottom:13px;border:1px solid #d97706;color:#743706;background:#fff5e7}.sg-tick{color:var(--sg-good);font-size:20px;font-weight:900}
    .sg-reflect{padding:24px;border:2px solid var(--sg);border-radius:18px;background:linear-gradient(135deg,#fff,var(--sg-soft))}.sg-growth{display:grid;grid-template-columns:auto 1fr;gap:13px;align-items:center;margin-bottom:16px}.sg-growth-icon{font-size:48px}.sg-done{margin-top:20px;padding:20px;border:2px dashed var(--sg);border-radius:17px;color:var(--sg-deep);background:var(--sg-soft);text-align:center}.sg-foot{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:28px}
    .sg-burst{position:fixed;inset:0;z-index:99;display:grid;place-items:center;pointer-events:none;font-size:86px;animation:sg-pop .85s ease-out forwards}
    @keyframes sg-pop{0%{opacity:0;transform:scale(.25) rotate(-8deg)}35%{opacity:1;transform:scale(1.12) rotate(4deg)}100%{opacity:0;transform:scale(1.35)}}
    @media(max-width:760px){#app{padding-inline:14px}.sg-hero{margin-inline:-14px;padding:24px 18px}.sg-hero-grid{grid-template-columns:1fr}.sg-hero-mark{display:none}.sg-mission{grid-template-columns:1fr}.sg-mission-visual{order:-1;min-height:190px}.sg-write-grid{grid-template-columns:1fr}.sg-rail{grid-template-columns:repeat(7,1fr);margin-inline:-5px}.sg-step{min-height:42px}.sg-step .lbl{display:none}.sg-match-options{grid-template-columns:1fr}}
    @media(max-width:420px){body{font-size:16px}.sg-hero h1{font-size:29px}.sg-context,.sg-talk-q{font-size:17px}.btn,.sg-pulse-btn,.sg-role-btn,.sg-match-btn,.choice{width:100%;justify-content:flex-start}.sg-timer{align-items:flex-start;flex-direction:column}.sg-timer-track{width:100%;flex:none}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.sg-burst{display:none}.btn,.choice{transition:none}}
    @media print{body{background:#fff}.sg-rail,.sg-toolrow,.sg-pulse,.sg-timer,.sg-foot,.sg-teacher,.btn,.sg-speak,#mwb-launcher{display:none!important}#app{max-width:none;padding:0}.sg-hero{margin:0 0 16px;padding:0 0 12px;color:#111;background:#fff;border-bottom:3px solid #111}.sg-hero h1,.sg-obj,.sg-langobj{color:#111}.sg-kicker,.sg-chip{color:#111;background:#eee;border-color:#bbb}.card,.sg-mission,.sg-talk,.prob,.sg-vcard{box-shadow:none;break-inside:avoid}.sg-mission{display:block}.sg-mission-visual{display:none}.sg-sec{margin-bottom:18px}}
  `;
  document.head.appendChild(styles);
}
