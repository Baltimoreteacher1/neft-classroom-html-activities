//
// These are the SITE brand values, not a private small-group palette. Until
// 2026-07-31 the studio shipped its own cold slate (#33568f) and a separate
// stylesheet then re-declared every token with !important to drag it back onto
// brand — two sources of truth for one colour. The brand values now live here,
// at the top of the only file that writes them, and the design-system sheet is
// component refinement only.
const SG_PALETTE = { hue: "#12355b", deep: "#0b2540", soft: "#eaf0f7" };
export const ACCENTS = {
  group1: { name: "Foundations", ...SG_PALETTE, pop: "#1fa6a2", emoji: "🤝" },
  group2: { name: "Challenge", ...SG_PALETTE, pop: "#e5a63f", emoji: "🚀" },
  catchup: { name: "Catch-Up", ...SG_PALETTE, pop: "#dd8560", emoji: "🧭" },
};

// Language lanes for vocabulary surfaces (cards + inline pop-ups). English is
// always shown; Spanish is the only additional lane (Joel directive
// 2026-07-16: English and Spanish only — do not add other languages).
export const VOCAB_LANGS = [
  {
    id: "es",
    suffix: "Es",
    label: "Español",
    toggleLabel: "English + Spanish",
    speech: "es-ES",
    dir: "ltr",
  },
];

// Objectives are authored in facilitation voice ("With my small group, I
// can…"). Students drive the studio themselves, so strip the group preamble
// at render time — configs are generated and stay untouched.
export function studentVoice(text) {
  const cleaned = String(text || "").replace(/^with (?:my|your|the) small group,?\s*/i, "");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Short kid-facing objective for the hero: student voice, then trimmed to the
// core "I can ___" clause by dropping facilitation tails ("— one step at a
// time", "so that…", ", with support"). The full objective still shows in the
// hero's collapsible "Objectives" detail and the teacher packet.
export function coreObjective(text) {
  let core = studentVoice(text);
  // Drop the enrichment framing prefix so the hero leads with the actual skill:
  // "I can go beyond today's lesson: solve…" → "I can solve…". Full framing is
  // preserved in the hero's "Full objectives" detail.
  core = core.replace(
    /^i can (?:go beyond today'?s lesson|go further|push (?:it )?further|extend today'?s (?:idea|thinking|lesson)|level up)\s*[:,]?\s*/i,
    "I can ",
  );
  const cut = core.search(
    /\s(?:—|–|-{1,2})\s|\s+so that\b|,\s+(?:one step|with support|step by step)\b/i,
  );
  if (cut > 24) core = core.slice(0, cut);
  return core.replace(/[\s.,;:]+$/, "");
}

// Leveled student voice — same math, different coaching register per group.
// Foundations hears a warm build-it-together coach, Challenge hears a
// mathematician's press for a topic-specific check, Catch-Up hears a fresh-start guide. Only
// the studio chrome speaks in these registers; authored content is untouched.
export const LEVEL_VOICE = {
  group1: {
    tagline:
      "We build this one step at a time — hints are power tools, and yours are always one tap away.",
    taglineEs:
      "Lo construimos paso a paso: las pistas son herramientas y siempre están a un toque.",
    buildCta: "Build it together →",
    buildDone: "Built it together ✓",
    guidedDir:
      "Work one problem at a time. Strong mathematicians use the step guide and hints — that is working smart, not giving up.",
    guidedDirEs:
      "Trabaja un problema a la vez. Los buenos matemáticos usan la guía de pasos y las pistas: eso es trabajar con inteligencia.",
    soloDir: "Your turn to shine. Solve it, check it, and revise like a pro when you need to.",
    soloDirEs:
      "Te toca brillar. Resuelve, comprueba y corrige como un profesional cuando haga falta.",
    moreDir:
      "Keep going until the steps feel easy — then explain one answer out loud like the expert you are becoming.",
    moreDirEs:
      "Sigue hasta que los pasos se sientan fáciles y explica una respuesta en voz alta como el experto que estás llegando a ser.",
    completeBody:
      "You built it step by step and named your growth. That is exactly what mathematicians do.",
    welcome: "👋 Welcome back — your work is saved right where you left it. Jump back in.",
    meterStart: "Every tap counts — let’s get started",
  },
  group2: {
    tagline:
      "Think like a mathematician: solve it, check it with today's strategy, and explain what it means.",
    taglineEs:
      "Piensa como matemático: resuelve, comprueba con la estrategia de hoy y explica qué significa.",
    buildCta: "I can use this idea →",
    buildDone: "Idea connected ✓",
    guidedDir: "Move efficiently, then check each answer with today's mathematical strategy.",
    guidedDirEs:
      "Avanza con eficiencia y comprueba cada respuesta con la estrategia matemática de hoy.",
    soloDir: "Solve it independently, then use the lesson's math check before you move on.",
    soloDirEs:
      "Resuelve de forma independiente y usa la comprobación matemática de la lección antes de continuar.",
    moreDir: "Push for elegance — can you solve one a second way, faster or cleaner?",
    moreDirEs: "Busca la elegancia: ¿puedes resolver uno de otra manera, más rápida o más clara?",
    completeBody:
      "You solved it, checked it, and explained what the result means. That is strong mathematical thinking.",
    welcome: "👋 Welcome back, mathematician — your work is saved. Continue with your math check.",
    meterStart: "Ready when you are",
  },
  catchup: {
    tagline:
      "Fresh start, zero pressure — pick up right where you are and watch this skill come back.",
    taglineEs:
      "Un nuevo comienzo, sin presión: retoma donde estás y verás cómo vuelve esta destreza.",
    buildCta: "I’ve got this idea again →",
    buildDone: "Got it again ✓",
    guidedDir:
      "No rush — one small win at a time. Use every hint you want; that is exactly what they are for.",
    guidedDirEs:
      "Sin prisa: una pequeña victoria a la vez. Usa todas las pistas que quieras; para eso están.",
    soloDir: "You are warmed up. Try these on your own — you can always peek back at the guide.",
    soloDirEs:
      "Ya estás en marcha. Intenta estos por tu cuenta; siempre puedes volver a mirar la guía.",
    moreDir: "Look how far you have come. A few more and this skill is yours again.",
    moreDirEs: "Mira cuánto has avanzado. Unos pocos más y esta destreza vuelve a ser tuya.",
    completeBody: "You caught up AND leveled up. Be proud — this skill is back in your hands.",
    welcome: "👋 Welcome back — everything you finished is still finished. Just keep going.",
    meterStart: "Start anywhere — your progress saves",
  },
};
export const voiceFor = (variant) => LEVEL_VOICE[variant] || LEVEL_VOICE.catchup;

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

// Rich bilingual line for feedback that carries markup (<b> emphasis): the
// caller supplies pre-escaped HTML per lane; Spanish stacks beneath English
// exactly like bi(). Never pass raw student/config text without esc().
export const biHtml = (en, es) =>
  es && esLane() ? `${en}<span class="sg-es" lang="es">${es}</span>` : en;

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

// Device-local "record our best explanation" voice memo. Captures audio with
// MediaRecorder, plays it back from an in-memory blob URL, and NEVER uploads or
// persists anything — the clip lives only in this tab and is revoked on
// re-record. Degrades cleanly: if the device has no recorder / mic permission
// is denied, it shows a short note instead of a broken control. Privacy is the
// whole point (the studio promises "private · saved on this device").
export function createVoiceMemo(prompt = "Record your best explanation") {
  const wrap = el("div", "sg-voice");
  const supported =
    typeof window.MediaRecorder !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";
  if (!supported) {
    wrap.appendChild(
      el(
        "p",
        "sg-voice-note",
        "🎙 Voice recording isn’t available on this device — say it out loud instead.",
      ),
    );
    return wrap;
  }
  wrap.appendChild(el("span", "block-lab", esc(prompt)));
  const row = el("div", "row");
  const recordBtn = el("button", "btn ghost", "🎙 Record");
  recordBtn.type = "button";
  const status = el("span", "sg-voice-status", "Private — stays on this device.");
  status.setAttribute("aria-live", "polite");
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.hidden = true;
  audio.className = "sg-voice-audio";
  let recorder = null;
  let stream = null;
  let url = "";
  let chunks = [];
  const stopStream = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
  };
  const startRecording = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      status.textContent = "Microphone permission was declined — say it out loud instead.";
      recordBtn.disabled = true;
      return;
    }
    chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stopStream();
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      audio.src = url;
      audio.hidden = false;
      status.textContent = "Recorded — play it back, then re-record if you want a cleaner take.";
      recordBtn.textContent = "🎙 Re-record";
    };
    recorder.start();
    recordBtn.textContent = "⏹ Stop";
    status.textContent = "Recording… tap Stop when you finish your explanation.";
  };
  recordBtn.onclick = () => {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      return;
    }
    startRecording();
  };
  row.append(recordBtn);
  wrap.append(row, status, audio);
  return wrap;
}

// Shared "what does this mean?" popup. One <dialog> is reused for every caller
// (plan moves today), so a student can tap any ⓘ and read a plain-language
// explanation plus a worked example without leaving the step.
let infoDialogEl = null;

function getInfoDialog() {
  if (infoDialogEl?.isConnected) return infoDialogEl;
  const dialog = document.createElement("dialog");
  dialog.className = "sg-info-dialog";
  dialog.innerHTML = `
    <div class="sg-info-body" style="position:relative">
      <button type="button" class="sg-info-close" aria-label="Close">&times;</button>
      <h2></h2>
      <p class="sg-info-what"></p>
      <div class="sg-info-example-wrap">
        <div class="sg-info-label">Looks like</div>
        <p class="sg-info-example"></p>
      </div>
    </div>
  `;
  dialog.querySelector(".sg-info-close").addEventListener("click", () => dialog.close());
  // Tapping the backdrop closes it — the same gesture as the vocabulary popup.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.body.appendChild(dialog);
  infoDialogEl = dialog;
  return dialog;
}

export function openInfoDialog({ title, what, example }, trigger) {
  const dialog = getInfoDialog();
  dialog.querySelector("h2").textContent = title || "";
  dialog.querySelector(".sg-info-what").textContent = what || "";
  const wrap = dialog.querySelector(".sg-info-example-wrap");
  wrap.hidden = !example;
  dialog.querySelector(".sg-info-example").textContent = example || "";
  if (trigger) dialog.addEventListener("close", () => trigger.focus(), { once: true });
  dialog.showModal();
  dialog.querySelector(".sg-info-close").focus();
}

export function celebrate(symbol = "✨") {
  const burst = el("div", "sg-burst");
  burst.setAttribute("aria-hidden", "true");
  burst.appendChild(el("span", "sg-burst-core", esc(symbol)));
  // Deterministic confetti fan (no Math.random — angles/dist derive from the
  // particle index) so celebration feels alive without ever being flashy.
  // Reduced-motion users keep the quiet single-symbol pop via CSS.
  const colors = ["var(--sg)", "var(--sg-pop)", "#e5a63f", "#1fa6a2", "#dd8560"];
  for (let index = 0; index < 14; index++) {
    const particle = el("span", "sg-confetti");
    const angle = ((index / 14) * 360 + (index % 3) * 9) * (Math.PI / 180);
    particle.style.setProperty(
      "--cx",
      `${Math.round(Math.cos(angle) * (90 + (index % 4) * 30))}px`,
    );
    particle.style.setProperty(
      "--cy",
      `${Math.round(Math.sin(angle) * (70 + (index % 5) * 26))}px`,
    );
    particle.style.setProperty("--cr", `${(index % 2 ? 1 : -1) * (180 + index * 20)}deg`);
    particle.style.background = colors[index % colors.length];
    particle.style.animationDelay = `${(index % 4) * 40}ms`;
    burst.appendChild(particle);
  }
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1100);
}

export function injectSmallGroupStyles(accent) {
  // Only --sg-pop is per-variant, so it stays an inline custom property. The
  // shared --sg / --sg-deep / --sg-soft are defined in the stylesheet :root
  // (light mode only — no dark-theme overrides).
  document.documentElement.style.setProperty("--sg-pop", accent.pop);
  if (!document.getElementById("sg-innovation-styles")) {
    const innovation = document.createElement("link");
    innovation.id = "sg-innovation-styles";
    innovation.rel = "stylesheet";
    innovation.href = "/assets/small-group-innovation.css?v=20260731-pub1";
    document.head.appendChild(innovation);
  }
  if (!document.getElementById("sg-annotation-styles")) {
    const annotation = document.createElement("link");
    annotation.id = "sg-annotation-styles";
    annotation.rel = "stylesheet";
    annotation.href = "/assets/small-group-annotation.css?v=20260731-pub1";
    document.head.appendChild(annotation);
  }
  if (!document.getElementById("sg-storyboard-styles")) {
    const storyboard = document.createElement("link");
    storyboard.id = "sg-storyboard-styles";
    storyboard.rel = "stylesheet";
    storyboard.href = "/assets/small-group-storyboard.css?v=20260731-pub1";
    document.head.appendChild(storyboard);
  }
  // assets/small-group-designsystem.css is the studio's art direction: the base
  // sheet below owns structure and the tokens, this sheet owns how the studio
  // LOOKS — hero, section rhythm, card material, control affordance.
  //
  // Until 2026-07-31 that job was split across two sheets (a "publisher polish"
  // pass and a "design system" pass) layered on top of the base, each partly
  // undoing the other: polish painted the hero white-on-navy, designsystem
  // repainted it navy-on-cream, and roughly a third of polish's rules never
  // applied to anything. They are now one file, and the base sheet ships the
  // brand palette directly so no token needs !important to survive.
  //
  // It is loaded HERE rather than from a <link> in the lesson shell, for two reasons:
  //   1. Cascade. Its component rules sit at the same specificity as the
  //      #sg-styles rules they refine, so it has to come after that injected
  //      <style>. A <link> in <head> is always earlier and would silently lose.
  //   2. Vite. build.cssCodeSplit is false, so any <link rel=stylesheet> in a lesson
  //      index.html entry gets stripped and folded into the single shared style-[hash]
  //      bundle that EVERY lesson loads — which would leak these studio-only
  //      overrides onto all 220 canonical lessons. Runtime-loading keeps it scoped,
  //      the same reason the three sheets above are loaded this way.
  const ensureDesignSystem = () => {
    let ds = document.getElementById("sg-designsystem-styles");
    if (!ds) {
      ds = document.createElement("link");
      ds.id = "sg-designsystem-styles";
      /** @type {HTMLLinkElement} */ (ds).rel = "stylesheet";
      /** @type {HTMLLinkElement} */ (ds).href =
        "/assets/small-group-designsystem.css?v=20260731-pub1";
      document.head.appendChild(ds);
    } else if (ds.parentNode === document.head) {
      document.head.appendChild(ds);
    }
  };
  if (document.getElementById("sg-styles")) {
    ensureDesignSystem();
    return;
  }

  // Atkinson Hyperlegible only. Outfit — the display half of the pairing — is
  // already requested by every lesson index.html, so asking for it again here
  // would be a second round-trip for a face the page has; Nunito was dropped
  // with the third font-family (see the --sg-display comment above).
  if (!document.getElementById("sg-fonts")) {
    const fonts = document.createElement("link");
    fonts.id = "sg-fonts";
    fonts.rel = "stylesheet";
    fonts.href =
      "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap";
    document.head.appendChild(fonts);
  }

  const styles = document.createElement("style");
  styles.id = "sg-styles";
  styles.textContent = `
    /* Light mode only — small-group lessons stay light regardless of the site
       theme toggle (data-theme) or OS preference (per Joel 2026-07-23).

       PALETTE. --sg / --sg-deep / --sg-soft / --sg-pop come from ACCENTS at the
       top of this file and are already brand values; everything else is
       declared here. Three surfaces do the structural work and they must stay
       three distinct steps apart, because that separation IS the layout:

         --sg-paper  warm sand   the page behind everything
         --sg-card   white       the sheet a student reads and writes on
         --sg-soft   pale navy   informational fills inside a card

       Before 2026-07-31 soft was #fbf9f4 — a hair off both white and the paper
       — so a callout inside a card inside the page read as one flat surface and
       the studio looked unfinished no matter how good the type was. Keep the
       steps visible. */
    :root{color-scheme:light;--sg:${accent.hue};--sg-deep:${accent.deep};--sg-soft:${accent.soft};--sg-ink:${accent.deep};--sg-rule:${accent.deep};--sg-line:#d5dee8;--sg-paper:#f2eee3;--sg-card:#fff;--sg-text:#1b2733;--sg-muted:#4a5a6b;--sg-good:#0c6f6b;--sg-warn:#7a5205;--sg-good-bg:#e0f2ef;--sg-good-ink:#0a4f4c;--sg-bad:#c25334;--sg-bad-bg:#fdece5;--sg-bad-ink:#8a3a20;--sg-warn-bg:#fdf4e3;--sg-warn-ink:#7a5205;--sg-warn-line:#e0ab3f;--sg-figure:#fffdf9;--sg-fill:#e6edf5;
      /* Type pairing. Outfit (the site display face, already loaded by the
         lesson shell) for anything that acts as a heading or a label; Atkinson
         Hyperlegible — chosen for these pathways because it is the most legible
         face available to a struggling reader — for every line of running text.
         Nunito was dropped 2026-07-31: the shell requested it, a second sheet
         then overrode it to Hanken Grotesk on .sg-* elements only, and plain
         <p> text inside a card kept rendering in a third face. One pairing. */
      --sg-display:"Outfit","Atkinson Hyperlegible",system-ui,sans-serif;
      --sg-body:"Atkinson Hyperlegible",system-ui,-apple-system,sans-serif;
      --sg-mono:"Outfit",ui-monospace,SFMono-Regular,Menlo,monospace;
      --sg-shadow-sm:0 1px 2px rgba(17,34,56,.05),0 2px 6px -2px rgba(17,34,56,.08);
      --sg-shadow:0 1px 2px rgba(17,34,56,.05),0 12px 28px -14px rgba(17,34,56,.24);
      --sg-shadow-lg:0 2px 4px rgba(17,34,56,.05),0 22px 46px -22px rgba(17,34,56,.3);
      --sg-radius:16px;--sg-radius-lg:22px;--sg-radius-sm:12px}
    /* Neutralize any global dark theme applied to the shell so the sg tokens
       above always win — light mode only. */
    :root[data-theme="dark"]{color-scheme:light}
    *{box-sizing:border-box}
    html{scroll-behavior:smooth;background:var(--sg-paper)}
    /* The ground. A flat fill read as "unstyled" at any tone light enough to
       keep white cards legible, so the page carries three layers instead: a
       fine 32px graph rule tiled the whole way down (this is a math studio —
       the grid is the subject), plus two very low-alpha washes anchored to the
       top and bottom of the DOCUMENT, so the page opens cool in the pathway
       accent and closes warm.
       Not background-attachment:fixed. A fixed layer repaints on every scroll
       frame — measurable jank on a classroom Chromebook — and at these
       document lengths it also left whole screens unpainted mid-scroll.
       Anchoring to the document costs nothing and paints reliably. */
    body{margin:0;color:var(--sg-text);font-family:var(--sg-body);font-size:17px;line-height:1.6;background-color:var(--sg-paper);background-image:
      radial-gradient(120% 100% at 82% 0%,color-mix(in srgb,var(--sg-pop) 16%,transparent),transparent 68%),
      radial-gradient(100% 100% at 6% 100%,rgba(18,53,91,.08),transparent 66%),
      linear-gradient(rgba(18,53,91,.05) 1px,transparent 1px),
      linear-gradient(90deg,rgba(18,53,91,.05) 1px,transparent 1px);
      background-position:top right,bottom left,0 0,0 0;
      background-repeat:no-repeat,no-repeat,repeat,repeat;
      background-size:100% 820px,100% 640px,32px 32px,32px 32px;
      -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-optical-sizing:auto}
    button,input,textarea{font:inherit}
    button,a,input,textarea,summary{outline-offset:4px}
    button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--sg-ink);box-shadow:0 0 0 6px color-mix(in srgb,var(--sg-pop) 45%,transparent)}
    #app{max-width:1100px;margin:0 auto;padding:0 24px 120px}
    h1,h2,h3{font-family:var(--sg-display);line-height:1.16;letter-spacing:-.015em;margin:0;color:var(--sg-ink)}
    p{margin:0 0 12px}
    /* ── Hero ──────────────────────────────────────────────────────────────
       A masthead card, not a full-bleed colour band. It reads as the first
       sheet in the stack rather than as chrome bolted above it, and — the
       reason it is light — every student here is either rebuilding a skill or
       being pushed past one, so the page opens calm instead of loud. Pathway
       identity is carried by the accent rule along the top edge, the tinted
       corner wash and the kicker; the palette underneath is identical for all
       three, exactly as the 2026-07-17 uniform-palette directive requires.
       The whole hero used to be white-on-navy here and navy-on-cream two
       sheets later; it is defined once now. */
    .sg-hero{position:relative;overflow:hidden;margin:0 0 26px;padding:30px 30px 28px;border:1px solid var(--sg-line);border-radius:var(--sg-radius-lg);background:var(--sg-card);box-shadow:var(--sg-shadow)}
    /* Corner wash in the pathway accent + the same graph rule as the page, so
       the masthead belongs to the ground it sits on. */
    .sg-hero::before{content:"";position:absolute;inset:0;pointer-events:none;background:
      radial-gradient(120% 96% at 100% 0%,color-mix(in srgb,var(--sg-pop) 22%,transparent),transparent 58%),
      radial-gradient(80% 70% at 0% 100%,color-mix(in srgb,var(--sg) 7%,transparent),transparent 62%),
      linear-gradient(rgba(18,53,91,.035) 1px,transparent 1px),
      linear-gradient(90deg,rgba(18,53,91,.035) 1px,transparent 1px);
      background-size:100% 100%,100% 100%,32px 32px,32px 32px}
    /* Pathway rule. 5px along the top edge, inset to follow the card radius. */
    .sg-hero::after{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,var(--sg-pop),color-mix(in srgb,var(--sg-pop) 45%,var(--sg)))}
    .sg-tagline{max-width:760px;margin-top:10px;color:var(--sg-muted);font-size:16px;font-weight:400;line-height:1.5}
    .sg-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:26px;align-items:start}
    .sg-kicker{display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border:1px solid color-mix(in srgb,var(--sg-pop) 42%,transparent);border-radius:999px;background:color-mix(in srgb,var(--sg-pop) 14%,#fff);color:var(--sg-ink);font-family:var(--sg-display);font-size:12.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
    .sg-hero h1{max-width:740px;margin:14px 0 10px;font-size:clamp(29px,4.2vw,42px);font-weight:800;letter-spacing:-.028em;text-wrap:balance}
    .sg-obj{max-width:760px;margin-bottom:10px;color:var(--sg-ink);font-size:18.5px;font-weight:700;line-height:1.45;text-wrap:pretty}
    .sg-obj-more{max-width:760px;margin-top:2px}
    .sg-obj-more>summary{display:inline-flex;align-items:center;min-height:34px;cursor:pointer;padding:4px 13px;border:1px solid var(--sg-line);border-radius:999px;background:var(--sg-card);font-family:var(--sg-display);font-size:12.5px;font-weight:700;letter-spacing:.02em;color:var(--sg-muted);list-style:none}
    .sg-obj-more>summary:hover{border-color:var(--sg);color:var(--sg-ink)}
    .sg-obj-more>summary::-webkit-details-marker{display:none}
    .sg-obj-more[open]>summary{margin-bottom:10px}
    .sg-obj-full{max-width:760px;font-size:16px;font-weight:400;color:var(--sg-text)}
    .sg-langobj{max-width:760px;font-size:15px;color:var(--sg-muted)}
    .sg-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
    .sg-chip{display:inline-flex;align-items:center;padding:5px 12px;border:1px solid var(--sg-line);border-radius:999px;background:var(--sg-card);color:var(--sg-muted);font-size:13px;font-weight:700}
    .sg-hero-scene-chip{display:inline-flex;align-items:center;margin-top:10px;padding:4px 11px;border:1px solid var(--sg-line);border-radius:999px;background:var(--sg-soft);color:var(--sg-muted);font-family:var(--sg-display);font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase}
    .sg-hero-mark{display:grid;width:116px;height:116px;place-items:center;overflow:hidden;border:1px solid var(--sg-line);border-radius:20px;background:var(--sg-card);font-size:56px;box-shadow:var(--sg-shadow-sm)}
    .sg-hero-mark.has-theme svg,.sg-hero-mark.has-art img{display:block;width:100%;height:100%;object-fit:cover}
    .sg-teacher{margin:0 0 22px}
    .sg-teacher details{border:1px solid var(--sg-line);border-left:4px solid var(--sg-warn-line);border-radius:var(--sg-radius);background:var(--sg-card);box-shadow:var(--sg-shadow-sm)}
    .sg-teacher summary{cursor:pointer;padding:14px 17px;font-family:var(--sg-display);font-weight:700;color:var(--sg-ink)}
    .sg-tbody{padding:0 18px 18px}.sg-tbody li{margin:5px 0}.sg-frames,.sg-wordbank{display:flex;flex-wrap:wrap;gap:8px}
    .sg-frame,.sg-word{padding:7px 12px;border:1px dashed color-mix(in srgb,var(--sg) 28%,transparent);border-radius:10px;background:var(--sg-soft);color:var(--sg-ink);font-weight:700}
    .sg-mode{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 -24px;padding:10px 24px;color:#fff;background:var(--sg-deep);font-family:var(--sg-display);font-size:14px;font-weight:700;letter-spacing:.01em}
    .sg-mode-action{display:inline-flex;align-items:center;min-height:44px;padding:9px 14px;border:1px solid rgba(255,255,255,.34);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;text-decoration:none}
    .sg-mode-action:hover{background:rgba(255,255,255,.2)}
    .sg-mode--teacher{background:#5c3c05}.sg-mode-notice{margin:12px 0;padding:11px 14px;border:1px solid var(--sg-warn-line);border-radius:11px;color:var(--sg-warn-ink);background:var(--sg-warn-bg)}
    /* ── Step rail ─────────────────────────────────────────────────────────
       Sticky, so it is the one piece of chrome a student sees the whole way
       through: opaque enough to stay readable over a scrolling worksheet,
       and the ONLY place the pathway accent appears as a solid fill (the
       active step), which is what makes "where am I" answerable at a glance. */
    .sg-rail,.sg-tabs{position:sticky;top:0;z-index:30;display:grid;gap:6px;margin:0 -6px 30px;padding:9px;border:1px solid var(--sg-line);border-top:0;border-radius:0 0 var(--sg-radius) var(--sg-radius);background:color-mix(in srgb,var(--sg-card) 88%,var(--sg-paper));backdrop-filter:blur(14px) saturate(1.4);box-shadow:0 6px 20px -8px rgba(17,34,56,.22)}
    .sg-rail{grid-template-columns:repeat(auto-fit,minmax(0,1fr))}
    .sg-tabs{grid-template-columns:repeat(6,minmax(0,1fr))}
    .sg-step{position:relative;display:flex;min-height:48px;align-items:center;justify-content:center;gap:8px;padding:6px 8px;border:0;border-radius:var(--sg-radius-sm);background:transparent;color:var(--sg-muted);font-family:var(--sg-display);font-size:13.5px;font-weight:700;cursor:pointer}
    .sg-step .dot{display:grid;width:26px;height:26px;flex:none;place-items:center;border-radius:8px;background:var(--sg-fill);color:var(--sg-ink);font-size:13px;font-weight:800}
    .sg-step:hover:not([aria-selected="true"]){color:var(--sg-ink);background:var(--sg-soft)}
    .sg-step.done{color:var(--sg-ink)}.sg-step.done .dot{color:#fff;background:var(--sg-good)}
    .sg-step[aria-selected="true"]{color:#fff;background:var(--sg);box-shadow:0 5px 14px -6px color-mix(in srgb,var(--sg) 70%,transparent)}
    .sg-step[aria-selected="true"] .dot{color:var(--sg-deep);background:var(--sg-pop)}
    /* Accent tick under the active step — the pathway signature, repeated. */
    .sg-step[aria-selected="true"]::after{content:"";position:absolute;left:50%;bottom:-9px;width:22px;height:3px;border-radius:3px;background:var(--sg-pop);transform:translateX(-50%)}
    .sg-tabpanel[hidden]{display:none!important}.sg-panel{min-height:360px}
    .sg-tabpanel:not([hidden]){animation:sg-panelin .32s ease}
    /* Transform-only entrance: fading opacity here makes axe's color-contrast
       scan read blended mid-fade colors and fail the whole panel. */
    @keyframes sg-panelin{from{transform:translateY(8px)}to{transform:none}}
    .sg-next{display:flex;justify-content:center;margin:26px 0 8px;padding-top:20px;border-top:1px solid var(--sg-line)}
    .sg-next-btn{min-width:min(320px,100%);justify-content:center;padding:13px 24px;font-size:17px;box-shadow:0 6px 16px color-mix(in srgb,var(--sg) 34%,transparent)}
    .sg-next-btn:hover:not(:disabled){transform:translateY(-2px)}
    /* ── Section rhythm ────────────────────────────────────────────────────
       A studio section is: number badge · eyebrow · title · hairline rule.
       The rule is what gives a long single-scroll page structure — without it
       every section is just another card and the page reads as one list. */
    section.sg-sec{margin:0 0 38px;scroll-margin-top:88px}
    .sg-h{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid color-mix(in srgb,var(--sg) 16%,transparent)}
    /* min-width, not width: section numbers renumber at composition time and
       run to "2.1"/"3.2", which a fixed 40px square clips. */
    .sg-h .n{display:grid;min-width:40px;height:40px;flex:none;padding:0 9px;place-items:center;border-radius:var(--sg-radius-sm);color:#fff;background:var(--sg);font-family:var(--sg-display);font-size:15.5px;font-weight:800;letter-spacing:-.01em;box-shadow:0 0 0 3px color-mix(in srgb,var(--sg-pop) 30%,transparent)}
    .sg-h h2{font-size:clamp(22px,3.2vw,29px);font-weight:800;letter-spacing:-.022em;text-wrap:balance}
    .sg-eyebrow{margin-bottom:3px;color:var(--sg-good);font-family:var(--sg-display);font-size:12.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
    .card,.sg-mission,.sg-talk,.prob{border:1px solid var(--sg-line);border-radius:var(--sg-radius);background:var(--sg-card);box-shadow:var(--sg-shadow)}
    .card{padding:22px;margin-bottom:16px}
    .sg-mission{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(250px,.75fr);overflow:hidden}
    .sg-mission-copy{padding:22px}.sg-mission-visual{min-height:230px;background:var(--sg-soft)}
    .sg-mission-visual.no-image{display:grid;place-items:center;padding:22px;color:var(--sg-ink);font-family:var(--sg-display);font-size:70px}
    .sg-context{font-size:18px;font-weight:700}
    .sg-toolrow,.row,.sg-pulse,.sg-rolebar{display:flex;flex-wrap:wrap;gap:9px;align-items:center}
    .sg-toolrow{margin:14px 0}.sg-pulse{margin-top:14px}
    /* ── Controls ──────────────────────────────────────────────────────────
       One button system: solid navy = do the thing, ghost = a way out or a
       tool, and the accent colour is never a button fill (it is identity, and
       a student should not have to work out whether amber means "primary"). */
    .btn,.sg-pulse-btn,.sg-role-btn,.sg-match-btn,.choice,.wchip{min-height:46px;border-radius:var(--sg-radius-sm);cursor:pointer;transition:transform .12s ease,border-color .14s ease,background .14s ease,box-shadow .14s ease}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border:2px solid var(--sg);color:#fff;background:var(--sg);font-family:var(--sg-display);font-size:15.5px;font-weight:700;text-decoration:none;box-shadow:0 4px 12px -5px color-mix(in srgb,var(--sg) 75%,transparent)}
    .btn:hover:not(:disabled){transform:translateY(-1px);background:var(--sg-deep);border-color:var(--sg-deep);box-shadow:0 8px 18px -7px color-mix(in srgb,var(--sg) 80%,transparent)}
    .btn:active:not(:disabled){transform:translateY(1px);box-shadow:none}
    .btn.ghost{color:var(--sg-ink);background:var(--sg-card);box-shadow:none}
    .btn.ghost:hover:not(:disabled){background:var(--sg-soft);color:var(--sg-ink);border-color:var(--sg)}
    .btn:disabled{cursor:default;color:var(--sg-muted);border-color:var(--sg-line);background:var(--sg-fill);box-shadow:none}
    .sg-pulse-btn,.sg-role-btn,.sg-match-btn{padding:10px 14px;border:2px solid var(--sg-line);color:var(--sg-text);background:var(--sg-card);font-weight:700;text-align:left}
    .sg-pulse-btn:hover,.sg-role-btn:hover,.sg-match-btn:hover{border-color:var(--sg);box-shadow:0 6px 16px -9px color-mix(in srgb,var(--sg) 80%,transparent)}
    .sg-match-btn.correct{border-color:var(--sg-good);background:var(--sg-good-bg);color:var(--sg-good-ink);animation:sg-okpulse .5s ease}
    .sg-match-btn.wrong{border-color:var(--sg-bad);background:var(--sg-bad-bg);color:var(--sg-bad-ink);animation:sg-nudge .3s ease}
    .sg-match-btn:disabled{cursor:default;opacity:.7}
    .sg-pulse-btn[aria-pressed="true"],.sg-role-btn.active{border-color:var(--sg);color:var(--sg-ink);background:var(--sg-soft)}
    .sg-ta{width:100%;min-height:82px;padding:11px 12px;border:2px solid var(--sg-line);border-radius:10px;color:var(--sg-text);background:var(--sg-card);resize:vertical}
    .keyidea{position:relative;margin:20px 0 12px;padding:18px 20px 18px 22px;border:1px solid color-mix(in srgb,var(--sg) 16%,var(--sg-line));border-left:6px solid var(--sg);border-radius:var(--sg-radius-sm);background:var(--sg-soft);color:var(--sg-ink);font-size:19.5px;line-height:1.5;font-weight:700}
    .keyidea .lab,.block-lab{display:block;margin-bottom:6px;color:var(--sg-good);font-family:var(--sg-display);font-size:12.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
    .sg-build-intro{font-size:19px;line-height:1.55;font-weight:600}
    .we-steps,.steplist{margin:10px 0;border:1px solid var(--sg-line);border-radius:13px;padding:7px 16px}.steps{margin:0;padding:0;list-style:none;counter-reset:step}
    .steps li{position:relative;padding:8px 0 8px 35px;border-bottom:1px dashed var(--sg-line)}.steps li:last-child{border:0}.steps li::before{counter-increment:step;content:counter(step);position:absolute;left:0;top:8px;display:grid;width:23px;height:23px;place-items:center;border-radius:8px;background:var(--sg-soft);color:var(--sg-ink);font-weight:900}
    .sg-vgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
    .sg-vcard{position:relative;padding:17px;border:1px solid var(--sg-line);border-radius:16px;background:var(--sg-card);box-shadow:0 5px 16px rgba(23,32,51,.05)}.sg-vcard-picture{display:grid;min-height:150px;margin:-5px -5px 14px;place-items:center;overflow:hidden;border-radius:13px;background:var(--sg-soft)}.sg-vcard-picture img{display:block;width:100%;max-height:190px;object-fit:contain;transition:opacity .18s ease}.sg-vcard-picture img[data-image-state="loading"]{opacity:.35}
    .sg-vterm{padding-right:42px;color:var(--sg-ink);font-family:var(--sg-display);font-size:21px;font-weight:900}.sg-vtranslations{margin:5px 0;color:var(--sg-muted);font-size:14px}.sg-vdef{margin-top:12px;padding-top:12px;border-top:1px dashed var(--sg-line)}.sg-vdef-line{margin:0 0 9px}.sg-vdef-line:last-child{margin-bottom:0}.sg-vdef-language{display:block;color:var(--sg);font-family:var(--sg-display);font-size:12px;letter-spacing:.06em;text-transform:uppercase}
    .sg-speak{position:absolute;right:10px;top:10px;display:grid;width:44px;height:44px;place-items:center;border:1px solid var(--sg-line);border-radius:50%;background:var(--sg-card);cursor:pointer}
    /* Practice panels (word match, cloze). Both are "now you try" surfaces, so
       they share one treatment — a tinted panel inside the white sheet. They
       used to differ only in that one had a solid border and the other a dashed
       one, which read as two unrelated widgets doing the same job. */
    .sg-match,.sg-cloze{margin-top:18px;padding:20px;border:1px solid color-mix(in srgb,var(--sg) 22%,var(--sg-line));border-left:5px solid var(--sg);border-radius:var(--sg-radius);background:var(--sg-soft)}
    .sg-match-options{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:14px}.sg-match-status{min-height:26px;margin-top:12px;font-weight:700}
    .sg-talk{padding:22px}.sg-talk-q{font-size:20px;font-weight:700}.sg-rolebar{margin:16px 0;padding:13px;border-radius:13px;background:var(--sg-soft)}.sg-role{font-family:var(--sg-display);font-weight:900;color:var(--sg-ink)}
    .sg-timer{display:flex;align-items:center;gap:12px;margin-top:15px}.sg-clock{min-width:92px;color:var(--sg-ink);font-family:var(--sg-display);font-size:31px;font-weight:900;font-variant-numeric:tabular-nums}.sg-timer-track{height:12px;flex:1;overflow:hidden;border-radius:999px;background:var(--sg-fill)}.sg-timer-fill{height:100%;width:100%;background:var(--sg);transform-origin:left;transition:width .25s linear}
    .sg-directions{margin:-3px 0 14px;padding:11px 14px;border-left:5px solid var(--sg);border-radius:10px;background:var(--sg-soft);color:var(--sg-ink);font-weight:700}.prob{padding:18px;margin-bottom:14px;scroll-margin-top:96px}.q{display:flex;gap:10px;margin:0 0 14px;font-size:17px;font-weight:700}.pn{display:grid;width:29px;height:29px;flex:none;place-items:center;border-radius:9px;color:#fff;background:var(--sg);font-weight:900}
    .sg-problem-nav{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:14px 0 24px}.sg-problem-nav .btn:last-child{justify-self:end}.sg-problem-count{color:var(--sg-ink);font-family:var(--sg-display);font-weight:900;text-align:center}.mistake summary{cursor:pointer;font-weight:900}.mistake p{margin:9px 0 0}
    .sg-problem-support-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0 8px}.sg-visual-title{color:var(--sg-ink);font-family:var(--sg-display);font-size:20px;font-weight:900}.sg-read-problem{min-height:44px;padding:8px 12px}.sg-problem-visual{overflow:hidden;margin:0 0 12px;border:3px solid var(--sg);border-radius:20px;background:var(--sg-figure);box-shadow:0 10px 25px rgba(23,32,51,.09)}.sg-problem-visual svg{display:block;width:100%;min-height:250px;height:auto}.sg-problem-visual svg text{fill:var(--sg-ink);font-family:var(--sg-display);font-size:22px;font-weight:900}.sg-problem-visual .sg-layer-2,.sg-problem-visual .sg-layer-3{opacity:.12;transition:opacity .2s}.prob.sg-show-layer-2 .sg-layer-2,.prob.sg-show-layer-3 .sg-layer-2,.prob.sg-show-layer-3 .sg-layer-3{opacity:1}
    /* Workspace reveal: answer pieces stay hidden until the student earns them step by step */
    .sg-problem-visual .sg-ans{opacity:0;transition:opacity .35s}
    .prob.sg-done-1 .sg-ans-1,.prob.sg-done-2 .sg-ans-2,.prob.sg-done-3 .sg-ans-3,.prob.sg-done-4 .sg-ans-4,.prob.sg-done-all .sg-problem-visual .sg-ans{opacity:1}
    .prob.sg-done-1 .sg-q-1,.prob.sg-done-2 .sg-q-2,.prob.sg-done-all .sg-q-1,.prob.sg-done-all .sg-q-2{opacity:0}
    .sg-problem-visual .sg-hl-1,.sg-problem-visual .sg-hl-3{transition:fill .35s}
    .prob.sg-done-1 .sg-hl-1,.prob.sg-done-3 .sg-hl-3,.prob.sg-done-all .sg-hl-1,.prob.sg-done-all .sg-hl-3{fill:var(--sg-pop)}
    /* Typed models: students put the numbers into the model themselves */
    .sg-problem-model{margin:0 0 12px;padding:18px;border:3px solid var(--sg);border-radius:20px;background:var(--sg-figure);box-shadow:0 10px 25px rgba(23,32,51,.09)}
    .sg-problem-model svg{display:block;width:100%;min-height:220px;height:auto}
    .sg-problem-model svg text{fill:var(--sg-ink);font-family:var(--sg-display);font-size:22px;font-weight:900}
    .sg-model-title{margin-bottom:4px;color:var(--sg-ink);font-family:var(--sg-display);font-size:19px;font-weight:900}
    .sg-model-hint{margin:0 0 12px;color:var(--sg-muted);font-weight:700;font-size:15px}
    .sg-model-status{min-height:24px;margin:10px 0 0;color:var(--sg-good);font-weight:800}
    .sg-model-row{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:10px 0}
    .sg-model-rowlab{color:var(--sg-ink);font-family:var(--sg-display);font-weight:900}
    .sg-model-boxes{display:flex;flex-wrap:wrap;gap:7px}
    .sg-model-cell{width:64px;min-height:48px;padding:6px;border:2px dashed var(--sg);border-radius:11px;background:var(--sg-card);color:var(--sg-ink);font-size:20px;font-weight:900;text-align:center}
    .sg-model-cell:focus{border-style:solid}
    .sg-model-cell.ok{border:2px solid var(--sg-good);background:var(--sg-good-bg);color:var(--sg-good-ink)}
    .sg-model-cell.bad{border:2px solid var(--sg-bad);background:var(--sg-bad-bg);color:var(--sg-bad-ink)}
    .sg-model-cell.gold{border:3px solid #9b5c00;background:var(--sg-pop);color:#332000}
    .sg-tree{display:grid;justify-items:center;gap:6px;padding:8px 0}
    .sg-tree-root{display:grid;width:76px;height:76px;place-items:center;border-radius:50%;background:var(--sg);color:#fff;font-family:var(--sg-display);font-size:26px;font-weight:900}
    .sg-tree-branches{color:var(--sg-ink);font-size:24px;font-weight:900;letter-spacing:8px}
    .sg-tree-row{justify-content:center;gap:56px}
    .sg-tree-row .sg-model-cell{width:84px;border-radius:50%;min-height:64px}
    .sg-tree-level{display:grid;justify-items:center;gap:6px;position:relative}
    /* Room for the caption below. At margin-top:10px it printed straight
       through the branch lines of the level above it. */
    .sg-tree-level+.sg-tree-level{margin-top:26px;padding-top:16px}
    .sg-tree-level+.sg-tree-level::before{content:"↳ split the composite factor";position:absolute;top:-6px;left:50%;transform:translateX(-50%);padding:3px 10px;border-radius:999px;background:var(--sg-soft);font:800 11.5px/1.2 var(--sg-display);color:var(--sg-muted);white-space:nowrap}
    .sg-tree-level.locked{opacity:.45;filter:grayscale(.3)}
    .sg-tree-node{display:grid;min-width:64px;height:56px;padding:0 10px;place-items:center;border-radius:16px;background:var(--sg-soft);color:var(--sg-ink);font-family:var(--sg-display);font-size:22px;font-weight:900}
    .sg-tree-final{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:9px;margin-top:14px;padding-top:12px;border-top:2px dashed var(--sg-line)}
    .sg-tree-final .sg-model-cell{width:auto;min-width:150px;border-radius:12px;text-align:center}
    .sg-div-top{display:flex;justify-content:center;margin-left:56px}
    .sg-div-bracket{text-align:center;color:var(--sg-ink);font-family:var(--sg-mono);font-size:38px;font-weight:900;border-top:4px solid var(--sg-rule);width:max-content;margin:2px auto 8px;padding:2px 14px}
    .sg-model-table{display:grid;grid-template-columns:repeat(2,minmax(120px,220px));gap:8px;justify-content:center;margin:8px 0}
    .sg-model-tcell{display:grid;place-items:center;min-height:54px;padding:8px;border:2px solid var(--sg);border-radius:11px;background:var(--sg-card);color:var(--sg-ink);font-size:19px;font-weight:900}
    .sg-model-tcell.head{background:var(--sg);color:#fff;font-family:var(--sg-display)}
    .sg-model-tcell .sg-model-cell{width:100%;border-width:2px}
    .sg-model-sym{min-width:56px;min-height:48px;border:2px solid var(--sg-line);border-radius:11px;background:var(--sg-card);color:var(--sg-ink);font-size:24px;font-weight:900;cursor:pointer}
    .sg-model-sym.ok{border-color:var(--sg-good);background:var(--sg-good-bg)}
    .sg-model-sym.bad{border-color:var(--sg-bad);background:var(--sg-bad-bg);opacity:.6}
    .sg-frac-stack{display:inline-grid;justify-items:center;gap:4px}
    .sg-frac-bar{display:block;width:64px;height:4px;border-radius:2px;background:var(--sg-rule)}
    .sg-plot-grid{cursor:crosshair;touch-action:manipulation}
    .sg-tile-tray{min-height:56px;padding:9px;border:2px dashed var(--sg-line);border-radius:12px}
    .sg-tile{min-width:44px;min-height:52px;border-radius:10px;font-family:var(--sg-display);font-size:20px;font-weight:900;cursor:pointer;border:2px solid var(--sg-rule)}
    .sg-tile.is-x{background:var(--sg);color:#fff;min-width:64px}
    .sg-tile.is-one{background:var(--sg-pop);color:#332000}
    .sg-es{display:block;margin-top:3px;color:var(--sg-muted);font-weight:600;font-size:.93em}
    /* Place-value giant workspace: the stacked column math IS the visual */
    .sg-big-work .colmath{min-width:320px;padding:24px 38px;border:3px solid var(--sg);border-radius:20px;background:var(--sg-figure);box-shadow:0 10px 25px rgba(23,32,51,.09);font-size:44px}
    .sg-big-work .colmath .fillin{width:220px;font-size:40px}
    .sg-big-work .eqcap{font-size:22px}
    .sg-math-tool,.sg-guided-steps{margin:12px 0;border:2px solid var(--sg);border-radius:16px;background:var(--sg-card)}.sg-math-tool summary,.sg-guided-steps>summary{cursor:pointer;padding:12px 15px;color:var(--sg-ink);font-family:var(--sg-display);font-weight:900}.sg-tool-body,.sg-step-sequence{padding:0 15px 15px}.sg-tool-directions,.sg-step-intro{color:var(--sg-muted);font-weight:700}.sg-model-slider{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;margin:12px 0;padding:12px;border-radius:12px;background:var(--sg-soft);font-weight:900}.sg-model-slider input{width:100%;accent-color:var(--sg)}.sg-value-tray,.sg-operator-tray,.sg-value-work,.sg-model-expression{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}.sg-operator-tray{padding-top:10px;border-top:1px dashed var(--sg-line)}.sg-value-chip{min-width:52px;min-height:46px;padding:7px 12px;border:2px solid var(--sg);border-radius:11px;color:var(--sg-ink);background:var(--sg-card);font-size:20px;font-weight:900;cursor:pointer}.sg-operator-chip{min-width:46px;color:#fff;background:var(--sg-deep)}.sg-value-work{min-height:76px;padding:10px;border:2px dashed var(--sg-line);border-radius:12px}.sg-model-label{font-weight:900}.sg-model-expression{min-width:150px;flex:1;margin:0}.sg-work-chip{min-width:44px;min-height:44px;padding:6px 11px;border:2px solid color-mix(in srgb,var(--sg-pop) 45%,black);border-radius:9px;color:color-mix(in srgb,var(--sg-pop) 20%,black);background:var(--sg-pop);font-weight:900;cursor:pointer}.sg-clear-model{margin-left:auto}
    .sg-guided-steps{padding:15px;background:linear-gradient(135deg,var(--sg-card),var(--sg-soft))}.sg-guided-steps>summary{margin:-15px}.sg-guided-steps[open]>summary{margin:-15px -15px 12px}.sg-fill-step{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;margin:10px 0;padding:14px;border:2px solid var(--sg-line);border-radius:14px;background:var(--sg-card)}.sg-fill-step[hidden]{display:none}.sg-fill-step.complete{border-color:var(--sg-good);background:var(--sg-good-bg)}.sg-fill-step.needs-revision{border-color:var(--sg-warn-line);background:var(--sg-warn-bg)}.sg-fill-number{display:grid;width:36px;height:36px;place-items:center;border-radius:11px;color:#fff;background:var(--sg);font-family:var(--sg-display);font-weight:900}.sg-fill-prompt{font-size:19px;font-weight:800}.sg-step-input{width:min(180px,100%);margin:0 5px;padding:5px 8px;border:0;border-bottom:3px solid var(--sg);color:var(--sg-ink);background:var(--sg-card);font-size:20px;font-weight:900;text-align:center}.sg-step-check{min-height:44px;padding:8px 12px}.sg-step-status{grid-column:2/-1;color:var(--sg-muted);font-weight:700}
    .choices{display:grid;gap:9px}.choice{display:flex;width:100%;align-items:center;gap:10px;padding:11px 14px;border:2px solid var(--sg-line);color:var(--sg-text);background:var(--sg-card);text-align:left}.choice:hover:not(:disabled){border-color:var(--sg);background:var(--sg-soft)}.choice .k{display:grid;width:27px;height:27px;flex:none;place-items:center;border-radius:8px;background:var(--sg-fill);font-weight:900}.choice.correct{border-color:var(--sg-good);background:var(--sg-good-bg);animation:sg-okpulse .5s ease}.choice.wrong{border-color:var(--sg-bad);background:var(--sg-bad-bg);animation:sg-nudge .3s ease}.choice:disabled{cursor:default;opacity:.75}
    @keyframes sg-okpulse{0%{box-shadow:0 0 0 0 rgba(22,115,75,.45)}100%{box-shadow:0 0 0 14px rgba(22,115,75,0)}}
    @keyframes sg-nudge{0%,100%{transform:none}30%{transform:translateX(-4px)}60%{transform:translateX(4px)}}
    .fb{display:none;margin-top:12px;padding:12px 14px;border-radius:11px}.fb.show{display:block}.fb.ok{border:1px solid var(--sg-good);color:var(--sg-good-ink);background:var(--sg-good-bg)}.fb.no{border:1px solid var(--sg-warn-line);color:var(--sg-warn-ink);background:var(--sg-warn-bg)}.fb.info{border:1px solid var(--sg);color:var(--sg-ink);background:var(--sg-soft)}
    .hintbox p{margin:7px 0;padding:9px 12px;border-radius:9px;background:var(--sg-soft);color:var(--sg-ink)}
    .eqcap{margin-bottom:7px;color:var(--sg-ink);font-family:var(--sg-display);font-size:19px;font-weight:900}.colmath{display:inline-grid;min-width:160px;justify-items:end;gap:2px;padding:11px 18px;border-radius:13px;background:var(--sg-soft);font-family:var(--sg-mono);font-size:27px;font-weight:900}.col-op{margin-right:15px;color:var(--sg)}.col-rule{width:100%;height:3px;margin:3px 0;background:var(--sg-rule)}
    .fillline,.stepline,.gs-row{display:flex;align-items:center;flex-wrap:wrap;gap:7px}.fillline{margin:5px 0}.fillin,.stepfill{border:0;border-bottom:3px solid var(--sg);color:var(--sg-ink);background:transparent;font-weight:900;text-align:center}.fillin{width:150px;padding:3px 7px;font-size:24px}.stepfill{width:90px;padding:2px 4px}.fillin.ok,.stepfill.ok{color:var(--sg-good);border-color:var(--sg-good);animation:sg-okpulse .5s ease}.fillin.bad,.stepfill.bad{color:var(--sg-bad);border-color:var(--sg-bad);animation:sg-nudge .3s ease}.filllab{font-weight:900}.fillunit{color:var(--sg-muted);font-weight:700}
    .wbank{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}.wbank-lab{font-size:13px;font-weight:900;text-transform:uppercase}.wchip{padding:7px 12px;border:2px solid var(--sg);color:var(--sg-ink);background:var(--sg-soft);font-weight:700}.stepline,.gs-row{padding:9px 0;border-bottom:1px dashed var(--sg-line)}.stepline:last-child,.gs-row:last-child{border:0}.sn{display:grid;width:25px;height:25px;flex:none;place-items:center;border-radius:8px;color:var(--sg-ink);background:var(--sg-soft);font-weight:900}.gs-row.locked{opacity:.35;pointer-events:none}.gs-check{min-height:44px;padding:8px 12px}.gs-intro,.mistake{padding:11px 14px;border-radius:12px}.gs-intro{color:var(--sg-ink);background:var(--sg-soft)}.mistake{margin-bottom:13px;border:1px solid var(--sg-warn-line);color:var(--sg-warn-ink);background:var(--sg-warn-bg)}.sg-tick{color:var(--sg-good);font-size:20px;font-weight:900}
    .sg-reflect{padding:24px;border:2px solid var(--sg);border-radius:18px;background:linear-gradient(135deg,var(--sg-card),var(--sg-soft))}.sg-growth{display:grid;grid-template-columns:auto 1fr;gap:13px;align-items:center;margin-bottom:16px}.sg-growth-icon{font-size:48px}.sg-done{margin-top:20px;padding:20px;border:2px dashed var(--sg);border-radius:17px;color:var(--sg-ink);background:var(--sg-soft);text-align:center}.sg-foot{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:28px}
    /* ── Interactive labs (Explore / Model / Apply) ── */
    .sg-lab{--sp-1:4px;--sp-2:8px;--sp-3:12px;--sp-4:16px;--sp-5:20px;--sp-6:24px;--radius-sm:8px;--radius:12px;--teal:var(--sg);--teal-light:var(--sg-soft);--teal-dark:var(--sg-deep);--navy:var(--sg-deep);--coral:#d9795d;--cream:#fdf9f0;--muted:var(--sg-muted);--ink:var(--sg-text)}
    .sg-lab-note{padding:11px 14px;border-radius:12px;background:var(--sg-soft);color:var(--sg-ink);font-weight:700}
    .sg-lab-loading{padding:14px;color:var(--sg-muted);font-weight:700}
    .sg-lab-mount{margin:12px 0}
    .sg-lab-mount .card{border:1px solid var(--sg-line);border-radius:16px;background:var(--sg-card);padding:16px;box-shadow:0 8px 24px rgba(23,32,51,.07)}
    .sg-figure{margin:12px 0;padding:14px;border:1px solid var(--sg-line);border-radius:16px;background:var(--sg-card);box-shadow:0 8px 24px rgba(23,32,51,.07)}
    .sg-tool-caption{display:flex;flex-direction:column;gap:3px;margin:0 0 12px}
    .sg-tool-name{color:var(--sg-ink);font-family:var(--sg-display);font-size:17px;font-weight:900}
    .sg-tool-purpose{color:var(--sg-muted);font-size:14px;font-weight:600;line-height:1.45}
    .sg-tool-instance{color:var(--sg-ink);font-size:13px;font-weight:700}
    .sg-donechip{display:inline-flex;align-items:center;gap:7px;margin-bottom:12px;padding:7px 12px;border-radius:999px;background:var(--sg-good-bg);border:1px solid var(--sg-good);color:var(--sg-good-ink);font-weight:800;font-size:14px}
    .sg-discourse{margin-top:14px;padding:16px;border:2px solid var(--sg);border-radius:14px;background:var(--sg-soft)}
    .sg-datachips{padding:14px;text-align:center}
    .sg-datachips-title{margin-bottom:9px;font-family:var(--sg-display);font-weight:900;color:var(--sg-ink)}
    .sg-datachips-row{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
    .sg-datachip{display:grid;min-width:44px;padding:9px 12px;place-items:center;border-radius:12px;background:var(--sg);color:#fff;font-family:var(--sg-display);font-size:20px;font-weight:900;box-shadow:3px 3px 0 var(--sg-pop)}
    .sg-datachips-unit{margin-top:9px;color:var(--sg-muted);font-weight:700}
    .sg-apply-step{transition:opacity .25s}
    .sg-apply-step.locked{opacity:.35;pointer-events:none}
    .sg-step-lab{margin-bottom:9px;font-family:var(--sg-display);font-size:13px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:var(--sg)}
    .sg-apply-text{font-size:18px;font-weight:600;line-height:1.7}
    .sg-num{margin:0 2px;padding:2px 9px;border:2px dashed var(--sg);border-radius:9px;background:var(--sg-card);color:var(--sg-ink);font-weight:900;font-size:17px;cursor:pointer}
    .sg-num.on{background:var(--sg-pop);border-style:solid;color:#332000;box-shadow:0 2px 0 rgba(0,0,0,.15)}
    .sg-planrow{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px}
    .sg-planopt{display:flex;align-items:stretch;gap:6px}
    .sg-plan{flex:1;min-height:46px;padding:9px 12px;border:2px solid var(--sg-line);border-radius:11px;background:var(--sg-card);font-weight:700;text-align:left;cursor:pointer}
    .sg-plan.on{border-color:var(--sg);background:var(--sg-soft);color:var(--sg-ink)}
    .sg-plan-why{flex:0 0 auto;width:46px;min-height:46px;border:2px solid var(--sg-line);border-radius:11px;background:var(--sg-card);color:var(--sg);font-weight:900;font-size:17px;cursor:pointer}
    .sg-plan-why:hover{background:var(--sg-soft)}
    .sg-info-dialog{width:min(440px,92vw);padding:0;border:0;border-radius:16px;box-shadow:0 24px 60px rgba(23,32,51,.28)}
    .sg-info-dialog::backdrop{background:rgba(23,32,51,.45)}
    .sg-info-body{padding:20px 22px 22px;background:var(--sg-card);color:var(--sg-ink)}
    .sg-info-body h2{margin:0 34px 10px 0;font-size:21px;line-height:1.3}
    .sg-info-what{margin:0 0 12px;font-size:17px;font-weight:600;line-height:1.6}
    .sg-info-label{font-family:var(--sg-display);font-size:12px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:var(--sg)}
    .sg-info-example{margin:4px 0 0;padding:10px 12px;border-radius:11px;background:var(--sg-soft);font-weight:600;line-height:1.6}
    .sg-info-close{position:absolute;top:10px;right:12px;width:38px;height:38px;border:0;border-radius:50%;background:transparent;font-size:24px;line-height:1;color:var(--sg-ink);cursor:pointer}
    .sg-sample{margin:10px 0;border:1px solid var(--sg-line);border-radius:12px;background:var(--sg-soft)}
    .sg-sample summary{cursor:pointer;padding:11px 14px;color:var(--sg-ink)}
    .sg-sample p{padding:0 14px 12px;margin:0;font-weight:600}
    .sg-mission-visual.has-figure{display:grid;place-items:center;padding:14px;background:var(--sg-card)}
    .sg-mission-visual.has-figure .sg-figure{margin:0;padding:0;border:0;box-shadow:none;width:100%}
    /* A math model in a narrow side column reads too small to help. When the
       mission carries a figure, stack it full width below the copy and let it
       grow (centered, capped) so students can actually read the model. */
    .sg-mission:has(.sg-mission-visual.has-figure){grid-template-columns:1fr}
    .sg-mission-visual.has-figure{min-height:auto;padding:16px 20px 22px}
    .sg-mission-visual.has-figure .sg-figure{max-width:640px;margin:0 auto}
    .sg-mission-visual.has-figure .sg-figure svg{width:100%;height:auto}
    .sg-speak-inline{margin-left:7px;border:1px solid var(--sg-line);border-radius:50%;width:44px;height:44px;background:var(--sg-card);cursor:pointer;font-size:15px}
    /* ── Vocabulary languages + cloze ── */
    .sg-langbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}
    .sg-langbtn{min-height:44px;padding:8px 14px;border:2px solid var(--sg-line);border-radius:999px;background:var(--sg-card);font-weight:800;cursor:pointer}
    .sg-langbtn[aria-pressed="true"]{border-color:var(--sg);background:var(--sg-soft);color:var(--sg-ink)}
    .sg-vexamples{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
    .sg-vexample{padding:5px 10px;border-radius:8px;background:var(--sg-good-bg);color:var(--sg-good-ink);font-size:14px;font-weight:600}
    .sg-vexample.not{background:var(--sg-bad-bg);color:var(--sg-bad-ink)}
    .sg-cloze-sentence{font-size:18px;font-weight:400;line-height:1.75}
    .sg-cloze-blank{display:inline-grid;min-width:120px;min-height:30px;place-items:center;padding:2px 10px;border-bottom:3px solid var(--sg);color:var(--sg-ink);font-weight:900}
    .sg-cloze-blank.ok{color:var(--sg-good);border-color:var(--sg-good)}
    /* ── Learning map + progress meter ── */
    .sg-map{margin:0 0 24px;padding:20px 22px;border:1px solid var(--sg-line);border-left:6px solid var(--sg);border-radius:18px;background:var(--sg-card);box-shadow:0 8px 24px rgba(23,32,51,.07)}
    .sg-map-goal{margin:0 0 6px;font-size:18px;font-weight:800;color:var(--sg-ink)}
    .sg-map-lang{color:var(--sg-muted);font-weight:600}
    .sg-map-key{margin:12px 0;padding:11px 14px;border-radius:12px;background:var(--sg-soft);color:var(--sg-ink);font-weight:700}
    .sg-path{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:2px}
    .sg-path li{display:grid;grid-template-columns:27px auto 1fr auto;gap:10px;align-items:baseline;padding:7px 0;border-bottom:1px dashed var(--sg-line)}
    .sg-path li:last-child{border:0}
    .sg-path .pn{display:grid;width:24px;height:24px;place-items:center;border-radius:8px;background:var(--sg-soft);color:var(--sg-ink);font-weight:900;font-size:13px;align-self:center}
    .sg-path b{font-family:var(--sg-display);color:var(--sg-ink)}
    .sg-path .why{color:var(--sg-muted);font-size:15px}
    .sg-path .min{color:var(--sg);font-size:13px;font-weight:900;white-space:nowrap}
    .sg-meter{grid-column:1/-1;display:flex;align-items:center;gap:10px;padding:2px 6px 4px}
    .sg-meter-track{height:8px;flex:1;overflow:hidden;border-radius:999px;background:var(--sg-fill)}
    .sg-meter-fill{position:relative;overflow:hidden;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,var(--sg),var(--sg-pop));transition:width .35s ease}
    .sg-meter-fill::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);animation:sg-shine 2.6s linear infinite}
    @keyframes sg-shine{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
    .sg-meter-lab{font-size:13px;font-weight:900;color:var(--sg-muted);font-family:var(--sg-display);white-space:nowrap}
    .sg-streak{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border:1px solid var(--sg-warn-line);border-radius:999px;background:var(--sg-warn-bg);color:var(--sg-warn-ink);font-family:var(--sg-display);font-size:12px;font-weight:900;white-space:nowrap;animation:sg-stepin .3s ease}
    .sg-streak[hidden]{display:none}
    .sg-vlang-tag{color:var(--sg);font-family:var(--sg-display);font-size:12px;font-weight:900;letter-spacing:.05em}
    /* ── Interactive build stepper ── */
    .sg-stage{transition:opacity .25s}
    .sg-stage.locked{opacity:.38;pointer-events:none}
    .sg-stage.done{border-color:var(--sg-good)}
    .sg-stage-steps{margin:4px 0 12px}
    .sg-buildstep{display:flex;gap:10px;padding:9px 0;border-bottom:1px dashed var(--sg-line);animation:sg-stepin .3s ease}
    .sg-buildstep:last-child{border:0}
    .sg-buildstep.now{margin:0 -10px;padding-inline:10px;border-radius:10px;background:var(--sg-soft);border-bottom:0}
    .sg-buildstep-body{font-size:18px;line-height:1.5;font-weight:600}
    @keyframes sg-stepin{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
    /* ── Per-step visual models (Level 1 Build the idea) ── */
    .sg-step-visual{margin:9px 0 2px;padding:8px 10px;border:1px solid var(--sg-line);border-radius:12px;background:var(--sg-card);box-shadow:0 4px 14px rgba(23,32,51,.05);animation:sg-stepin .3s ease}
    .sg-step-visual svg{display:block;width:100%;max-width:360px;height:auto}
    .sg-checkstep-wrap{margin:0 0 9px}
    .sg-checkstep-wrap .sg-checkstep{margin:0}
    .sg-checkstep-wrap .sg-step-visual{margin:6px 0 0}
    @media (prefers-reduced-motion:reduce){.sg-step-visual{animation:none}}
    .sg-visual-gate{margin:9px 0 2px}
    .sg-visual-gate .sg-reveal{margin-left:0}
    .sg-visual-gate .sg-step-visual{margin:8px 0 0}
    .sg-check-transfer{margin-top:14px;padding-top:12px;border-top:2px dashed var(--sg-line)}
    .sg-check-transfer .block-lab{margin:0 0 8px}
    .sg-reveal{margin-left:8px;min-height:44px;padding:8px 13px;border:2px dashed var(--sg);border-radius:999px;background:var(--sg-card);color:var(--sg-ink);font-size:13px;font-weight:800;cursor:pointer}
    .sg-reveal-answer{display:inline-block;margin-left:8px;padding:3px 10px;border-radius:8px;background:var(--sg-soft);color:var(--sg-ink);font-weight:800;animation:sg-stepin .3s ease}
    .sg-checkstep{display:flex;width:100%;align-items:center;gap:10px;margin:0 0 7px;padding:11px 13px;border:2px solid var(--sg-line);border-radius:11px;background:var(--sg-card);font-weight:600;text-align:left;cursor:pointer}
    .sg-checkstep:hover{border-color:var(--sg)}
    .sg-checkstep.on{border-color:var(--sg-good);background:var(--sg-good-bg)}
    .sg-checkstep .tick{display:grid;width:26px;height:26px;flex:none;place-items:center;border-radius:8px;background:var(--sg-soft);color:var(--sg-ink);font-weight:900}
    .sg-checkstep.on .tick{background:var(--sg-good);color:#fff}
    /* ── Success criteria checklist ── */
    .sg-criteria{margin:0 0 16px;display:grid;gap:7px}
    .sg-criteria .block-lab{margin-bottom:2px}
    .sg-solo-note{margin:0 0 12px;padding:10px 13px;border-radius:11px;background:var(--sg-soft);color:var(--sg-ink);font-weight:600;font-size:15px}
    /* ── Welcome-back strip ── */
    .sg-welcome{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 18px;padding:12px 16px;border:1px solid var(--sg-line);border-left:6px solid var(--sg);border-radius:12px;background:var(--sg-card);font-weight:700}
    .sg-welcome .btn{min-height:44px;padding:8px 13px;font-size:13px}
    .sg-burst{position:fixed;inset:0;z-index:99;display:grid;place-items:center;pointer-events:none}
    .sg-burst-core{font-size:86px;animation:sg-pop .85s ease-out forwards}
    @keyframes sg-pop{0%{opacity:0;transform:scale(.25) rotate(-8deg)}35%{opacity:1;transform:scale(1.12) rotate(4deg)}100%{opacity:0;transform:scale(1.35)}}
    .sg-confetti{position:absolute;left:50%;top:50%;width:10px;height:14px;border-radius:3px;opacity:0;animation:sg-confetti .9s cubic-bezier(.16,1,.3,1) forwards}
    @keyframes sg-confetti{0%{opacity:1;transform:translate(-50%,-50%) rotate(0)}100%{opacity:0;transform:translate(calc(-50% + var(--cx)),calc(-50% + var(--cy))) rotate(var(--cr))}}
    @media(max-width:760px){#app{padding-inline:14px}.sg-mode{margin-inline:-14px;padding-inline:14px}
    .sg-hero{margin-inline:0;padding:22px 18px 20px;border-radius:var(--sg-radius)}
    .sg-hero-grid{grid-template-columns:1fr}
    /* The mark is decoration, and on a phone it costs a third of the first
       screen — the objective has to be what a student lands on. */
    .sg-hero-mark{display:none}
    .sg-hero h1{font-size:clamp(26px,7vw,33px)}.sg-obj{font-size:17px}.sg-tagline{font-size:15.5px}.sg-chips{gap:7px;margin-top:14px}
    .sg-mission{grid-template-columns:1fr}.sg-mission-visual{order:-1;min-height:190px}
    .sg-rail,.sg-tabs{margin-inline:-4px;padding:8px;gap:5px}.sg-tabs{grid-template-columns:repeat(3,1fr)}
    .sg-step{min-height:46px;font-size:12.5px;padding:5px 4px}.sg-step[aria-selected="true"]::after{bottom:-7px;width:18px}
    .sg-tabs .sg-step .lbl{display:inline}.sg-match-options{grid-template-columns:1fr}
    .sg-h{gap:11px;margin-bottom:15px;padding-bottom:12px}.sg-h .n{width:34px;height:34px;font-size:14px}
    .card,.prob,.sg-stage{padding:17px}.sg-pulse{display:grid;grid-template-columns:1fr;gap:8px}.sg-pulse-btn{width:100%}
    /* Site-wide passport pill mounts fixed top-left, where it collides with the
       studio's mode bar on phones. Dropping it "just below the bar" (top:70px)
       does not survive: the bar wraps to two rows under 420px, so the same
       offset lands on the bar at one width and across the hero's accent rule at
       another. Move it out of the top band entirely — every other floating
       control (supports dock, annotation rail, Save/Resume, Math Workbench) is
       pinned right, so bottom-left is the one corner with nothing in it.
       !important because the passport stylesheet lazy-loads after this one. */
    .ntp-pill{top:auto!important;bottom:12px!important;left:12px!important}}
    @media(max-width:420px){body{font-size:16px}.sg-hero h1{font-size:29px}.sg-context,.sg-talk-q{font-size:17px}.sg-tabs{position:static;grid-template-columns:repeat(2,1fr)}.sg-problem-nav{grid-template-columns:1fr 1fr}.sg-problem-count{grid-column:1/-1;grid-row:1}.sg-problem-support-head{align-items:flex-start;flex-direction:column}.sg-problem-visual svg{min-height:210px}.sg-fill-step{grid-template-columns:auto minmax(0,1fr)}.sg-step-check{grid-column:2}.sg-step-status{grid-column:1/-1}.btn,.sg-pulse-btn,.sg-role-btn,.sg-match-btn,.choice{width:100%;justify-content:flex-start}.sg-timer{align-items:flex-start;flex-direction:column}.sg-timer-track{width:100%;flex:none}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.sg-burst{display:none!important}.sg-hero-mark{animation:none}.sg-tabpanel:not([hidden]){animation:none}.sg-meter-fill::after{animation:none}.choice.correct,.choice.wrong,.sg-match-btn.correct,.sg-match-btn.wrong,.fillin.ok,.fillin.bad,.stepfill.ok,.stepfill.bad,.sg-fill-step.complete{animation:none}.btn,.choice{transition:none}}
    @media print{:root{--sg-paper:#fff;--sg-card:#fff;--sg-figure:#fff;--sg-text:#111;--sg-ink:#12355b;--sg-muted:#3f5166;--sg-soft:#f2f4f8;--sg-line:#cfd7e2;--sg-rule:#12355b;--sg-fill:#e9edf2;--sg-good-bg:#eef8f1;--sg-good-ink:#0e5033;--sg-bad-bg:#fdeeec;--sg-bad-ink:#7c2d24;--sg-warn-bg:#fdf3e3;--sg-warn-ink:#743706}
    /* Kill the page ground: the graph rule and colour washes cost toner and
       print as grey haze behind the work a student is handing in. */
    body{background:#fff;background-image:none}
    .sg-hero::before,.sg-hero::after{display:none}.sg-h{border-bottom-color:#111}.sg-mode,.sg-tabs,.sg-rail,.sg-meter,.sg-reveal,.sg-toolrow,.sg-pulse,.sg-timer,.sg-foot,.sg-teacher,.btn,.sg-speak,#mwb-launcher,.sg-problem-nav,.sg-annotation-tools{display:none!important}.sg-tabpanel[hidden]{display:block!important}.prob[hidden]{display:block!important}.sg-fill-step[hidden]{display:grid!important}.sg-fill-step.locked,.gs-row.locked,.sg-stage.locked,.sg-apply-step.locked{opacity:1!important;pointer-events:auto}.sg-reveal-answer[hidden]{display:inline-block!important}.sg-visual-gate .sg-step-visual[hidden]{display:block!important}#app{max-width:none;padding:0}.sg-hero{margin:0 0 16px;padding:0 0 12px;color:#111;background:var(--sg-card);border-bottom:3px solid #111}.sg-hero h1,.sg-obj,.sg-langobj{color:#111}.sg-kicker,.sg-chip{color:#111;background:#eee;border-color:#bbb}.card,.sg-mission,.sg-talk,.prob,.sg-vcard{box-shadow:none;break-inside:avoid}.sg-mission{display:block}.sg-mission-visual{display:none}.sg-sec{margin-bottom:18px}}
    /* prefers-contrast: darker lines + text and a heavier focus ring. */
    @media (prefers-contrast:more){:root{--sg-line:#5a6b82;--sg-muted:#26313f;--sg-rule:var(--sg-deep)}
      button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline-width:4px}
      .card,.prob,.sg-mission,.sg-talk,.choice,.sg-checkstep{border-width:2px}}
    /* forced-colors (Windows High Contrast): background/border colors flatten to
       the system palette, so selection/correctness conveyed by fill or border-
       color alone becomes invisible. Re-assert each state with a system Highlight
       outline, and keep interactive chrome from being coerced flat. */
    @media (forced-colors:active){
      .sg-step[aria-selected="true"],.sg-pulse-btn[aria-pressed="true"],.sg-role-btn.active,.sg-langbtn[aria-pressed="true"],.sg-vote-button[aria-pressed="true"],.choice.correct,.sg-match-btn.correct,.sg-checkstep.on,.sg-model-cell.ok,.sg-model-sym.ok,.fillin.ok,.sg-num.on,.sg-plan.on,.sg-fill-step.complete{outline:3px solid Highlight;outline-offset:-3px}
      .choice.wrong,.sg-match-btn.wrong,.sg-model-cell.bad,.fillin.bad{outline:2px dashed GrayText;outline-offset:-2px}
      .sg-step.done .dot::after{content:"✓";margin-left:2px}
      .btn,.choice,.wchip,.sg-num,.sg-plan,.sg-model-cell,.sg-pulse-btn,.sg-tile{forced-color-adjust:auto}
    }
  `;
  document.head.appendChild(styles);
  ensureDesignSystem();
}
