import { readWeek, setNight, weekStartFor } from "./family-state.js";

const root = document.getElementById("tonight-hub");
const replay = document.getElementById("hub-replay-days");
let storage=null;try{storage=localStorage}catch{}
const language = new URLSearchParams(location.search).get("lang") || storage?.getItem("hw_lang_mode") || "en";
const es = language === "es";
document.documentElement.lang = es ? "es" : "en";
const t = (en, spanish) => es ? spanish : en;
const iso = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const addDays = (start, count) => { const date = new Date(`${start}T12:00:00`); date.setDate(date.getDate()+count); return iso(date); };
const monday = weekStartFor();
const dayLabels = es ? ["Lun","Mar","Mié","Jue","Vie"] : ["Mon","Tue","Wed","Thu","Fri"];
const displayDay = (date) => new Intl.DateTimeFormat(es ? "es-US" : "en-US", { weekday:"long", month:"short", day:"numeric" }).format(new Date(`${date}T12:00:00`));
const safeText = (tag, text) => { const node = document.createElement(tag); node.textContent = text; return node; };
let week;

function paintProgress() {
  const state = readWeek(monday);
  const progress = root.querySelector(".tonight-progress");
  if (!progress) return;
  progress.replaceChildren();
  for (let i=0;i<5;i++) {
    const date=addDays(monday,i), label=document.createElement("label"), input=document.createElement("input");
    input.type="checkbox"; input.checked=Boolean(state.done?.[date]); input.setAttribute("aria-label",`${displayDay(date)} ${t("practice checked","práctica marcada")}`);
    input.addEventListener("change",()=>{ setNight(date,input.checked,storage); paintProgress(); paintReplay(); });
    label.append(input,document.createTextNode(dayLabels[i])); progress.append(label);
  }
}
function paintReplay() {
  const state=readWeek(monday); replay.replaceChildren();
  const done=week.days.filter(day=>state.done?.[day.date]);
  (done.length?done:week.days.filter(day=>day.date<=iso(new Date()))).forEach(day=>replay.append(safeText("li",`${displayDay(day.date)} · ${day.title?.[es?"es":"en"] || (day.status==="no-class"?t("No school","No hay clases"):t("A family math moment","Un momento de matemáticas en familia"))}`)));
  if (!replay.children.length) replay.append(safeText("li",t("No nights checked yet. Start whenever it works for your family.","Aún no hay noches marcadas. Empiecen cuando les funcione.")));
}

let weeks=[];
try { const response=await fetch("./weekly-sheet/weeks.json");if(!response.ok)throw new Error("schedule unavailable");weeks=(await response.json()).weeks||[]; }
catch { root.replaceChildren(safeText("p",t("This week’s practice is temporarily unavailable. Please try again.","La práctica de esta semana no está disponible por ahora. Vuelvan a intentarlo."))); }
week=weeks.find(item=>item.start===monday)||weeks.find(item=>item.start>monday)||weeks.at(-1);
if(!week){root.replaceChildren(safeText("p",t("This week’s practice is not available yet.","La práctica de esta semana todavía no está disponible.")));}
else {
  const today=iso(new Date());
  try {
    const [response, manifestResponse] = await Promise.all([
      fetch("/api/family-connections/published", { cache: "no-store" }),
      fetch("/data/curriculum-manifest.json"),
    ]);
    if (response.ok) {
      const publication = await response.json();
      const manifest = manifestResponse.ok ? await manifestResponse.json() : {};
      const lessons = new Map([...(manifest.lessons || []), ...(manifest.familyHomework || [])].map((lesson) => [lesson.id, lesson]));
      const section = new URLSearchParams(location.search).get("section") || publication.published?.sections?.find((item) => item.visible !== false)?.id;
      const current = (publication.weeks || []).find((record) => record.sectionId === section && record.week?.startDate === monday && record.publishedAt);
      if (current) {
        const map = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };
        for (const entry of current.week.days || []) {
          const index = map[entry.day];
          if (index == null) continue;
          const day = week.days[index];
          if (day.status === "no-class" || entry.status !== "lesson") continue;
          day.status = "lesson";
          day.lessonId = entry.lessonId;
          const lesson = lessons.get(entry.lessonId);
          const override = current.homeworkOverrides?.[entry.lessonId];
          if (lesson?.title) day.title = {
            en: override?.title || lesson.title.en || lesson.title,
            es: override?.titleEs || lesson.title.es || lesson.title.en || lesson.title,
          };
        }
      }
    }
  } catch { /* the pacing week remains available offline */ }
  const idx=Math.max(0,Math.min(4,Math.floor((new Date(`${today}T12:00:00`)-new Date(`${monday}T12:00:00`))/86400000)));
  const tonight=week.days[idx]||week.days.find(day=>day.status==="lesson")||week.days[0];
  const title=tonight.title?.[es?"es":"en"]||t("Family Math Practice","Práctica familiar de matemáticas");
  const card=document.createElement("article");card.className="tonight-practice";
  card.append(safeText("p",`${t("Tonight’s Practice","Práctica de hoy")} · ${displayDay(tonight.date)}`),safeText("h2",title),safeText("p",t("Optional and ungraded. A few minutes together is enough.","Opcional y sin calificación. Unos minutos juntos son suficientes.")));
  const actions=document.createElement("div");actions.className="tonight-actions";
  const start=document.createElement("a");start.href=tonight.lessonId?`/lessons/${encodeURIComponent(tonight.lessonId)}/homework.html${es?"?lang=es":""}`:"/curriculum/units/";start.textContent=t("Start here","Empezar aquí");actions.append(start);
  const studio=document.createElement("a");studio.href=`/curriculum/family-connections/math-studio/?lesson=${encodeURIComponent(tonight.lessonId||"")}${es?"&lang=es":""}`;studio.className="secondary";studio.textContent=t("Explore in Math Studio","Explorar en el estudio matemático");actions.append(studio);
  const print=document.createElement("a");print.href=`./weekly-sheet/downloads/week-${week.start}${es?"-es":""}.pdf`;print.download="";print.className="secondary";print.textContent=t("Print / Save PDF","Imprimir / Guardar PDF");actions.append(print);
  const sheet=document.createElement("a");sheet.href=`./weekly-sheet/${es?"?lang=es":""}`;sheet.className="secondary";sheet.textContent=t("Full weekly sheet","Hoja semanal completa");actions.append(sheet);
  card.append(actions);card.append(safeText("h3",t("This week","Esta semana")));
  const strip=document.createElement("div");strip.className="tonight-progress";card.append(strip);root.replaceChildren(card);
  paintProgress();paintReplay();
}
