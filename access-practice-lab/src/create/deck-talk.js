// Create · two more class layers for the slide deck (deck.js), both answer-safe and offline:
//   Votes (V)  a hands-up tally for choice questions: the teacher counts raised hands per letter (click or press the
//              number key), the bars show the spread, and the correct bar is marked only once the answer is shown.
//              Counts live in the open page per slide; nothing is stored, nothing has a timer.
//   Talk (F)   partner-talk sentence frames that fit the slide on screen: a question, a word (the word itself is
//              put in the frame), a reading, or anything else. Generic language frames: they never hint an answer.

export const TALK_CSS = `
nav{flex-wrap:wrap}
main{padding-bottom:calc(72px + var(--rb,0px))}
.slide{width:min(100%,calc((100vh - 104px - var(--rb,0px))*16/9))}
@media (min-width:1000px){body.voting main{padding-left:372px}}
.vote{position:fixed;left:12px;top:14px;display:none;width:min(340px,86vw);padding:12px 14px;border-radius:14px;background:#fffdf8;color:#1b2430;box-shadow:0 6px 20px rgba(0,0,0,.4);font:15px system-ui,sans-serif;z-index:5}
.vote.on{display:grid;gap:8px}
.vote h2{margin:0;font-size:16px;display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.vote h2 small{font-weight:500;color:#475467;font-size:13px}
.vrow{display:grid;grid-template-columns:44px 1fr 6ch;gap:8px;align-items:center}
.vrow button{min-width:44px;min-height:44px;border-radius:50%;border:0;background:#1e3a5f;color:#fff;font:700 18px system-ui,sans-serif;cursor:pointer}
.vrow button:focus-visible,.vote-tools button:focus-visible,.talk button:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}
.vbar{height:22px;border-radius:6px;background:#e8edf3;overflow:hidden}
.vbar i{display:block;height:100%;width:0;background:#64748b;border-radius:6px;transition:width .25s}
.vrow.ok button{background:#2f6b3a}.vrow.ok .vbar i{background:#2f6b3a}
.vrow.ok .vn::after{content:" ✓";color:#2f6b3a;font-weight:800}
.vn{font-variant-numeric:tabular-nums;text-align:right;font-size:14px}
.vote-tools{display:flex;gap:6px;justify-content:flex-end}
.vote-tools button{min-height:36px;padding:0 10px;border-radius:8px;border:1px solid #c9d2de;background:#f6f8fb;color:#1b2430;font:inherit;cursor:pointer}
.vote-none{margin:0;color:#475467;font-size:14px}
.talk{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);display:none;width:min(760px,92vw);padding:12px 18px 14px;border-radius:14px;background:#fff7e6;color:#1b2430;border:2px solid #b45309;box-shadow:0 6px 20px rgba(0,0,0,.35);font-family:system-ui,sans-serif;z-index:4}
.talk.on{display:block}
.talk h2{margin:0 0 6px;font-size:clamp(14px,2vmin,18px);letter-spacing:.06em;text-transform:uppercase;color:#9a3412}
.talk ul{margin:0;padding:0;list-style:none;display:grid;gap:4px}
.talk li{font-size:clamp(18px,3vmin,30px);line-height:1.35}
.talk li::before{content:"💬 ";font-size:.8em}
@media (prefers-reduced-motion:reduce){.vbar i{transition:none}}
@media print{.vote,.talk{display:none!important}}
`;

const FRAMES = {
  en: {
    head: "Talk with a partner",
    question: [
      "I think the answer is ___ because ___.",
      "I agree with ___ because ___.",
      "I see it differently because ___.",
    ],
    vocab: ["{w} means ___.", "An example of {w} is ___.", "I could use {w} when ___."],
    passage: ["This part is mostly about ___.", "One detail that shows this is ___."],
    other: ["I notice ___.", "I wonder ___."],
  },
  es: {
    head: "Hablen en parejas",
    question: [
      "Creo que la respuesta es ___ porque ___.",
      "Estoy de acuerdo con ___ porque ___.",
      "Lo veo de otra manera porque ___.",
    ],
    vocab: ["{w} significa ___.", "Un ejemplo de {w} es ___.", "Podría usar {w} cuando ___."],
    passage: ["Esta parte trata principalmente de ___.", "Un detalle que lo muestra es ___."],
    other: ["Noto que ___.", "Me pregunto ___."],
  },
};

/** The frames for one slide kind; `word` fills {w} on a word slide. Exported for tests. */
export function framesFor(kind, { lang = "en", word = "" } = {}) {
  const f = FRAMES[lang === "es" ? "es" : "en"];
  const list = f[kind] || (kind === "question" ? f.question : f.other);
  return list.map((s) => s.replace(/\{w\}/g, word || "___"));
}

/** Markup for both layers plus their nav buttons. */
export function talkHtml(es) {
  const t = es
    ? {
        votes: "Votos de la clase",
        tip: "Cuente las manos",
        reset: "Borrar",
        undo: "Deshacer",
        none: "Los votos funcionan en preguntas de opción múltiple.",
      }
    : {
        votes: "Class votes",
        tip: "Count raised hands",
        reset: "Clear",
        undo: "Undo",
        none: "Votes work on multiple-choice questions.",
      };
  return {
    panel: `<section class="vote" id="vote" aria-label="${t.votes}"><h2>${t.votes} <small>${t.tip}</small></h2><div id="vote-rows" aria-live="polite"></div><p class="vote-none" id="vote-none" hidden>${t.none}</p><div class="vote-tools"><button type="button" id="vote-undo">${t.undo}</button><button type="button" id="vote-reset">${t.reset}</button></div></section>
<section class="talk" id="talk" aria-live="polite"><h2>${FRAMES[es ? "es" : "en"].head}</h2><ul id="talk-list"></ul></section>`,
    nav: `<button type="button" id="vote-v" aria-pressed="false">${es ? "Votos (V)" : "Votes (V)"}</button><button type="button" id="talk-f" aria-pressed="false">${es ? "Hablar (F)" : "Talk (F)"}</button>`,
  };
}

const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

/** Behaviour for talkHtml. Runs inside the deck's own script (after deck.js's JS). */
export function talkJs(es) {
  const f = FRAMES[es ? "es" : "en"];
  const voteLabel = es ? "Sumar un voto a" : "Add a vote for";
  return `(function(){
var F=${json(f)},VL=${json(voteLabel)},L="ABCDEFGHIJ",vote=document.getElementById("vote"),rows=document.getElementById("vote-rows"),none=document.getElementById("vote-none"),vb=document.getElementById("vote-v"),talk=document.getElementById("talk"),list=document.getElementById("talk-list"),tb=document.getElementById("talk-f"),tallies=new Map(),history=[];
function cur(){return document.querySelector(".slide.on")}
function shown(s){var a=s&&s.querySelector(".ans");return !!a&&!a.hidden}
function counts(s){var n=+s.dataset.choices||0;if(!tallies.has(s))tallies.set(s,new Array(n).fill(0));return tallies.get(s)}
function drawVotes(){if(!vote.classList.contains("on"))return;var s=cur(),ok=s&&s.dataset.choices;rows.replaceChildren();none.hidden=!!ok;if(!ok)return;
var c=counts(s),total=c.reduce(function(a,b){return a+b},0),right=(s.dataset.correct||"").split(",").map(Number),rev=shown(s);
c.forEach(function(v,i){var r=document.createElement("div");r.className="vrow"+(rev&&right.indexOf(i)>=0?" ok":"");var b=document.createElement("button");b.type="button";b.textContent=L[i];b.setAttribute("aria-label",VL+" "+L[i]);b.onclick=function(){add(i)};
var bar=document.createElement("div");bar.className="vbar";var fill=document.createElement("i");fill.style.width=(total?Math.round(v/total*100):0)+"%";bar.append(fill);
var n=document.createElement("span");n.className="vn";n.textContent=v+(total?" · "+Math.round(v/total*100)+"%":"");r.append(b,bar,n);rows.append(r)})}
function add(i){var s=cur();if(!s||!s.dataset.choices)return;var c=counts(s);if(i>=c.length)return;c[i]++;history.push([s,i]);drawVotes()}
document.getElementById("vote-undo").onclick=function(){var s=cur();for(var k=history.length-1;k>=0;k--)if(history[k][0]===s){counts(s)[history[k][1]]--;history.splice(k,1);break}drawVotes()};
document.getElementById("vote-reset").onclick=function(){var s=cur();if(s&&s.dataset.choices){tallies.delete(s);history=history.filter(function(h){return h[0]!==s})}drawVotes()};
function toggleVotes(){var on=vote.classList.toggle("on");vb.setAttribute("aria-pressed",on?"true":"false");document.body.classList.toggle("voting",on);drawVotes()}
function layout(){var nav=document.querySelector("nav");talk.style.bottom=(nav.offsetHeight+8)+"px";document.body.style.setProperty("--rb",(talk.classList.contains("on")?talk.offsetHeight+12:0)+"px")}
function drawTalk(){if(!talk.classList.contains("on"))return;var s=cur(),k=!s?"other":s.classList.contains("question")?"question":s.classList.contains("vocab")?"vocab":s.classList.contains("passage")?"passage":"other",w=k==="vocab"?(s.querySelector(".term")||{}).textContent||"":"";
list.replaceChildren();(F[k]||F.other).forEach(function(t){var li=document.createElement("li");li.textContent=t.replace(/\\{w\\}/g,w||"___");list.append(li)});layout()}
function toggleTalk(){tb.setAttribute("aria-pressed",talk.classList.toggle("on")?"true":"false");drawTalk();layout()}
addEventListener("resize",layout);
vb.onclick=toggleVotes;tb.onclick=toggleTalk;
new MutationObserver(function(){drawVotes();drawTalk()}).observe(document.querySelector("main"),{subtree:true,attributes:true,attributeFilter:["class","hidden"]});
addEventListener("keydown",function(e){if(e.target&&e.target.tagName==="INPUT")return;if(document.querySelector(".pick.on"))return;
if(e.key==="v"||e.key==="V")toggleVotes();else if(e.key==="f"||e.key==="F")toggleTalk();else if(vote.classList.contains("on")&&/^[1-9]$/.test(e.key))add(+e.key-1)});
})();`;
}
