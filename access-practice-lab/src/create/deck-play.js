// Create · the class-play layer of the slide deck (deck.js): a team scoreboard (T) and a fair student picker (P)
// that calls numbers 1..class size without repeats until everyone has had a turn. No names, no timers, nothing
// stored: points and picks live only in the open page and vanish when it closes. Plain strings for the offline page.

export const PLAY_CSS = `
.play{position:fixed;right:12px;top:14px;display:none;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:min(92vw,560px);font:15px system-ui,sans-serif;z-index:5}
.play.on{display:flex}
.team[hidden]{display:none}
.team{display:flex;align-items:center;gap:6px;padding:6px 8px 6px 12px;border-radius:12px;background:#fff;color:#1b2430;box-shadow:0 4px 14px rgba(0,0,0,.35);border-left:6px solid var(--c)}
.team b{min-width:2ch;text-align:center;font-size:22px;color:var(--c)}
.team button,.pick-box button{min-width:36px;min-height:36px;border-radius:8px;border:1px solid #c9d2de;background:#f6f8fb;color:#1b2430;font:inherit;cursor:pointer}
.team button:focus-visible,.pick-box button:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}
.team.up{animation:pop .45s ease-out}
.pick{position:fixed;inset:0;display:none;place-items:center;background:rgba(10,18,28,.72);z-index:6}
.pick.on{display:grid}
.pick-box{display:grid;gap:14px;justify-items:center;padding:28px 36px;border-radius:18px;background:#fffdf8;color:#1b2430;font:17px system-ui,sans-serif;text-align:center;max-width:92vw}
.pick-n{font-size:clamp(72px,22vmin,200px);font-weight:800;line-height:1;color:#0f6b68}
.pick-n.spin{animation:pop .5s ease-out}
.pick-box label{display:flex;gap:8px;align-items:center}
.pick-box input{width:5em;min-height:36px;font:inherit;padding:0 8px;border:1px solid #c9d2de;border-radius:8px}
.pick-left{color:#475467;font-size:15px}
.ans:not([hidden]){animation:pop .45s ease-out}
@keyframes pop{0%{transform:scale(.92);opacity:.4}60%{transform:scale(1.04);opacity:1}100%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.team.up,.pick-n.spin,.ans:not([hidden]){animation:none}}
@media print{.play,.pick{display:none!important}}
`;

const COLORS = ["#0f6b68", "#b45309", "#1d4ed8", "#2f6b3a"];

/** The scoreboard and picker markup plus the two nav buttons. */
export function playHtml(es) {
  const t = es
    ? {
        team: "Equipo",
        add: "Sumar un punto al",
        sub: "Restar un punto al",
        pick: "¿Quién responde?",
        size: "Estudiantes en la clase",
        next: "Otro número",
        close: "Cerrar",
        left: "quedan",
        reset: "Empezar de nuevo",
      }
    : {
        team: "Team",
        add: "Add a point to",
        sub: "Take a point from",
        pick: "Who answers?",
        size: "Students in class",
        next: "Next number",
        close: "Close",
        left: "left",
        reset: "Start over",
      };
  const teams = COLORS.map(
    (c, i) =>
      `<div class="team" style="--c:${c}" data-team="${i}"${i > 1 ? " hidden" : ""}><span>${t.team} ${i + 1}</span><b aria-live="polite">0</b><button type="button" data-d="-1" aria-label="${t.sub} ${t.team} ${i + 1}">−</button><button type="button" data-d="1" aria-label="${t.add} ${t.team} ${i + 1}">+</button></div>`,
  ).join("");
  return {
    panel: `<div class="play" id="play" aria-label="${es ? "Puntos por equipo" : "Team points"}">${teams}<div class="team" style="--c:#475467"><button type="button" id="teams-n" aria-label="${es ? "Cambiar número de equipos" : "Change number of teams"}">2 ⇄ 4</button></div></div>
<div class="pick" id="pick" role="dialog" aria-modal="true" aria-label="${t.pick}"><div class="pick-box"><h2 style="margin:0">${t.pick}</h2><div class="pick-n" id="pick-n" aria-live="assertive">?</div><p class="pick-left" id="pick-left"></p><label>${t.size} <input id="pick-size" type="number" min="2" max="60" value="25"></label><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button type="button" id="pick-go">${t.next}</button><button type="button" id="pick-reset">${t.reset}</button><button type="button" id="pick-x">${t.close}</button></div></div></div>`,
    nav: `<button type="button" id="play-t" aria-pressed="false">${es ? "Equipos (T)" : "Teams (T)"}</button><button type="button" id="play-p">${es ? "Elegir (P)" : "Pick (P)"}</button>`,
    left: t.left,
  };
}

/** Behaviour for playHtml; `left` is the "N left" word. Runs inside the deck's own script. */
export function playJs(left) {
  return `(function(){
var play=document.getElementById("play"),tb=document.getElementById("play-t"),pk=document.getElementById("pick"),pn=document.getElementById("pick-n"),pl=document.getElementById("pick-left"),ps=document.getElementById("pick-size"),bag=[],last=null,four=false;
function teams(){tb.setAttribute("aria-pressed",play.classList.toggle("on")?"true":"false")}
tb.onclick=teams;
play.addEventListener("click",function(e){var b=e.target.closest("button[data-d]");if(!b)return;var row=b.closest(".team"),o=row.querySelector("b"),v=Math.max(0,(+o.textContent||0)+(+b.dataset.d));o.textContent=v;if(+b.dataset.d>0){row.classList.remove("up");void row.offsetWidth;row.classList.add("up")}});
document.getElementById("teams-n").onclick=function(){four=!four;[].slice.call(play.querySelectorAll("[data-team]")).forEach(function(r){if(+r.dataset.team>1)r.hidden=!four})};
function fill(){var n=Math.max(2,Math.min(60,Math.round(+ps.value)||25));ps.value=n;bag=[];for(var k=1;k<=n;k++)bag.push(k)}
function draw(){if(!bag.length)fill();var k=Math.floor(Math.random()*bag.length);if(bag.length>1&&bag[k]===last)k=(k+1)%bag.length;last=bag.splice(k,1)[0];pn.textContent=last;pn.classList.remove("spin");void pn.offsetWidth;pn.classList.add("spin");pl.textContent=bag.length+" ${left}"}
function openPick(){pk.classList.add("on");draw();document.getElementById("pick-go").focus()}
function closePick(){pk.classList.remove("on");document.getElementById("play-p").focus()}
document.getElementById("play-p").onclick=openPick;document.getElementById("pick-go").onclick=draw;document.getElementById("pick-x").onclick=closePick;
document.getElementById("pick-reset").onclick=function(){fill();last=null;draw()};ps.onchange=function(){fill();last=null};
pk.addEventListener("click",function(e){if(e.target===pk)closePick()});
addEventListener("keydown",function(e){if(e.target&&e.target.tagName==="INPUT")return;if(pk.classList.contains("on")){if(e.key==="Escape")closePick();else if(e.key==="p"||e.key==="P"||e.key==="Enter"){e.preventDefault();draw()}e.stopImmediatePropagation();return}
if(e.key==="t"||e.key==="T")teams();else if(e.key==="p"||e.key==="P")openPick()},true);
})();`;
}
