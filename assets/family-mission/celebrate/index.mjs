/**
 * Finish celebration for a Family Practice page: stars, level badges, achievements, a trophy case that
 * spans lessons, a printable certificate, a downloadable win card, and the way into the photobooth.
 *
 *   mountCelebration(host, data, hooks) -> { refresh(data), destroy() }
 *
 * `data` is plain numbers the page already measured (see hwCelebrateData in homework-practice-js.mjs).
 * Stars are honest: they reward finishing, persistence and accuracy, never clicking. Everything stays
 * on this device (localStorage keys below). prefers-reduced-motion keeps every state, drops movement.
 */

const CASE_KEY = "hw_trophy_case_v1";
const NAME_KEY = "hw_student_name";

/** One definition of the stars, used by the hero, the win card and the trophy case. */
export function starsFor(d) {
  const goal = Math.max(1, d.goal || 1);
  const done = Math.max(0, d.done || 0);
  const missionDone = done >= goal;
  const accurate = d.firstTry >= Math.ceil(goal * 0.7);
  return [
    { id: "show", earned: done >= Math.min(5, goal), en: "Got going", es: "Empezaron", hintEn: "Solve 5 problems", hintEs: "Resuelvan 5 problemas" },
    { id: "finish", earned: missionDone, en: "Finished the mission", es: "Terminaron la misión", hintEn: `Solve all ${goal}`, hintEs: `Resuelvan los ${goal}` },
    {
      id: "sharp",
      earned: missionDone && (accurate || d.bonus > 0 || d.fixed >= 1),
      en: "Sharp thinking",
      es: "Pensamiento agudo",
      hintEn: "Finish with 7 first tries, fix a mistake, or try the challenge",
      hintEs: "Terminen con 7 aciertos a la primera, corrijan un error o prueben el reto",
    },
  ];
}

export function achievements(d) {
  const lv = (id) => d.levels?.find((l) => l.id === id);
  const full = (l) => l && l.size > 0 && l.done >= l.size;
  return [
    { id: "warmup", icon: "🔥", en: "Warm-up Hero", es: "Héroe del calentamiento", earned: full(lv("warmup")), hintEn: "Finish Level 1", hintEs: "Terminen el nivel 1" },
    { id: "build", icon: "🧱", en: "Builder", es: "Constructor", earned: full(lv("build")), hintEn: "Finish Level 2", hintEs: "Terminen el nivel 2" },
    { id: "apply", icon: "🚀", en: "Applier", es: "Aplicador", earned: full(lv("apply")), hintEn: "Finish Level 3", hintEs: "Terminen el nivel 3" },
    { id: "boss", icon: "👑", en: "Challenge Champion", es: "Campeón del reto", earned: d.bonus >= 1, hintEn: "Solve a challenge problem", hintEs: "Resuelvan un problema de reto" },
    { id: "fix", icon: "🔧", en: "Fix-It Pro", es: "Experto en corregir", earned: d.fixed >= 1, hintEn: "Fix an answer and get it right", hintEs: "Corrijan una respuesta y acierten" },
    { id: "clean", icon: "🎯", en: "Bullseye", es: "Directo al blanco", earned: d.firstTry >= 3, hintEn: "Get 3 right on the first try", hintEs: "Acierten 3 a la primera" },
    { id: "picture", icon: "🎬", en: "Picture Thinker", es: "Piensa con imágenes", earned: d.watched >= 1 || d.modelMoves >= 1, hintEn: "Watch or move the picture", hintEs: "Miren o muevan el dibujo" },
    { id: "words", icon: "📚", en: "Word Wizard", es: "Mago de palabras", earned: !!d.vocabWon, hintEn: "Win the key-words quiz", hintEs: "Ganen el repaso de palabras" },
    { id: "games", icon: "🎮", en: "Game Master", es: "Maestro de juegos", earned: !!d.played, hintEn: "Play a math game", hintEs: "Jueguen un juego" },
  ];
}

const today = () => new Date().toISOString().slice(0, 10);
function readCase() {
  try {
    const c = JSON.parse(localStorage.getItem(CASE_KEY) || "{}");
    return { lessons: c.lessons || {}, days: Array.isArray(c.days) ? c.days : [] };
  } catch (_) {
    return { lessons: {}, days: [] };
  }
}
function writeCase(c) {
  try {
    localStorage.setItem(CASE_KEY, JSON.stringify(c));
  } catch (_) {}
}
/** Consecutive calendar days ending today (or yesterday) with at least one finished practice. */
export function streakOf(days, now = today()) {
  const set = new Set(days);
  let n = 0;
  const d = new Date(`${now}T12:00:00`);
  if (!set.has(now)) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
export function recordTrophy(lessonId, stars, goalMet) {
  const c = readCase();
  const prev = c.lessons[lessonId]?.stars || 0;
  if (stars > prev) c.lessons[lessonId] = { stars, at: today() };
  if (goalMet && !c.days.includes(today())) c.days.push(today());
  c.days = c.days.slice(-120);
  writeCase(c);
  const total = Object.values(c.lessons).reduce((s, l) => s + (l.stars || 0), 0);
  return { total, lessons: Object.keys(c.lessons).length, streak: streakOf(c.days), improved: stars > prev };
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const bi = (en, es) => `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es ?? en)}</span>`;
const reduced = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {
    return false;
  }
};

const TROPHY = `<svg class="fm-ce-trophy-svg" viewBox="0 0 160 170" role="img" aria-label="Gold trophy" focusable="false">
  <defs><linearGradient id="fmCeGold" x1="0" y1="0" x2="1" y2="1"><stop class="fm-ce-g0" offset="0"/><stop class="fm-ce-g1" offset="1"/></linearGradient></defs>
  <ellipse class="fm-ce-shadow" cx="80" cy="160" rx="46" ry="7"/>
  <rect class="fm-ce-base" x="52" y="138" width="56" height="14" rx="4"/>
  <rect class="fm-ce-gold" x="68" y="116" width="24" height="26"/>
  <path class="fm-ce-gold" d="M40 22h80v38c0 30-18 52-40 52S40 90 40 60z"/>
  <path class="fm-ce-handle" d="M40 34H18c0 28 12 44 30 48M120 34h22c0 28-12 44-30 48"/>
  <path class="fm-ce-shine" d="M56 32c-4 18-2 40 12 54"/>
  <path class="fm-ce-starmark" d="M80 44l5.6 11.4 12.6 1.8-9.1 8.9 2.1 12.5L80 72.6l-11.2 5.9 2.1-12.5-9.1-8.9 12.6-1.8z"/>
</svg>`;

export function mountCelebration(host, data, hooks = {}) {
  if (!host) return null;
  const motion = !reduced();
  let d = data;
  let name = "";
  try {
    name = localStorage.getItem(NAME_KEY) || "";
  } catch (_) {}

  function render() {
    const stars = starsFor(d);
    const earned = stars.filter((s) => s.earned).length;
    const badges = achievements(d);
    const missionDone = d.done >= d.goal;
    const trophy = recordTrophy(d.lessonId, earned, missionDone);
    const newBest = trophy.improved && earned > 0;
    const headline =
      earned >= 3
        ? ["Mission complete. Three stars!", "Misión cumplida. ¡Tres estrellas!"]
        : earned === 2
          ? ["Mission complete!", "¡Misión cumplida!"]
          : earned === 1
            ? ["Great start!", "¡Buen comienzo!"]
            : ["Your celebration is waiting", "Su celebración los espera"];
    const sub =
      earned >= 2
        ? [`You solved ${d.done} of ${d.goal} problems${d.bonus ? ` and ${d.bonus} bonus` : ""}.`, `Resolvieron ${d.done} de ${d.goal} problemas${d.bonus ? ` y ${d.bonus} extra` : ""}.`]
        : earned === 1
          ? [`${d.done} of ${d.goal} done. Finish the mission to earn more stars.`, `${d.done} de ${d.goal} listos. Terminen la misión para ganar más estrellas.`]
          : ["Solve a few problems in Your Turn and the stars light up.", "Resuelvan algunos problemas en Tu turno y las estrellas se encienden."];
    host.hidden = false;
    host.classList.toggle("is-motion", motion);
    host.innerHTML = `
      <section class="fm-ce" aria-labelledby="fm_ce_title">
        <div class="fm-ce-hero${earned >= 2 ? " is-won" : ""}">
          <div class="fm-ce-burst" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>
          <div class="fm-ce-trophy${earned >= 1 ? " is-lit" : ""}">${TROPHY}</div>
          <h3 id="fm_ce_title" class="fm-ce-title">${bi(...headline)}</h3>
          <p class="fm-ce-sub">${bi(...sub)}</p>
          <ol class="fm-ce-stars" aria-label="${esc(`${earned} of 3 stars`)}">
            ${stars
              .map(
                (s, i) => `<li class="fm-ce-star${s.earned ? " is-on" : ""}" style="--d:${i * 260}ms">
              <span class="fm-ce-star-ico" aria-hidden="true">${s.earned ? "★" : "☆"}</span>
              <span class="fm-ce-star-cap">${bi(s.earned ? s.en : s.hintEn, s.earned ? s.es : s.hintEs)}</span>
              <span class="fm-sr">${s.earned ? "earned" : "not yet"}</span></li>`,
              )
              .join("")}
          </ol>
          ${newBest ? `<p class="fm-ce-best" role="status">${bi("New personal best on this lesson!", "¡Nuevo récord personal en esta lección!")}</p>` : ""}
        </div>

        <ul class="fm-ce-stats" aria-label="${esc("Tonight in numbers")}">
          <li><strong>${d.done}/${d.goal}</strong><span>${bi("solved", "resueltos")}</span></li>
          <li><strong>${d.firstTry}</strong><span>${bi("first try", "a la primera")}</span></li>
          <li><strong>${d.fixed}</strong><span>${bi("mistakes fixed", "errores corregidos")}</span></li>
          <li><strong>${d.bonus}</strong><span>${bi("bonus solved", "extra resueltos")}</span></li>
        </ul>

        <div class="fm-ce-actions">
          <button type="button" class="fm-btn fm-btn--primary fm-btn--lg" data-ce="photo"><span aria-hidden="true">📸</span> ${bi("Take your victory photo", "Tomen su foto de victoria")}</button>
          <button type="button" class="fm-btn fm-btn--lg" data-ce="five"><span aria-hidden="true">✋</span> ${bi("High five!", "¡Choca esos cinco!")}</button>
          <button type="button" class="fm-btn fm-btn--lg" data-ce="cert-toggle" aria-expanded="false" aria-controls="fm_ce_cert"><span aria-hidden="true">🏅</span> ${bi("Certificate", "Certificado")}</button>
          <button type="button" class="fm-btn fm-btn--lg" data-ce="card"><span aria-hidden="true">🖼️</span> ${bi("Download win card", "Descargar tarjeta de victoria")}</button>
        </div>
        <p class="fm-ce-status fm-sr" role="status" aria-live="polite" data-ce-status></p>

        <div class="fm-ce-cert-wrap" id="fm_ce_cert" hidden>
          <label class="fm-ce-name"><span>${bi("Name on the certificate", "Nombre en el certificado")}</span>
            <input type="text" maxlength="40" value="${esc(name)}" data-ce-name autocomplete="off" placeholder="${esc("e.g. Alex")}"></label>
          <article class="fm-cert" data-ce-cert>
            <p class="fm-cert-kicker">${bi("Family Practice Certificate", "Certificado de práctica familiar")}</p>
            <p class="fm-cert-name" data-ce-cert-name>${esc(name || "Math Star")}</p>
            <p class="fm-cert-line">${bi("completed", "completó")}</p>
            <p class="fm-cert-lesson">${bi(d.title, d.titleEs || d.title)}</p>
            <p class="fm-cert-stars" aria-hidden="true">${"★".repeat(earned)}${"☆".repeat(3 - earned)}</p>
            <p class="fm-cert-foot">${esc(d.displayId ? `Lesson ${d.displayId}` : "")} · ${esc(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }))} · eduwonderlab.com</p>
          </article>
          <button type="button" class="fm-btn" data-ce="print"><span aria-hidden="true">🖨️</span> ${bi("Print certificate", "Imprimir certificado")}</button>
        </div>

        <h4 class="fm-ce-h">${bi("Badges", "Insignias")}</h4>
        <ul class="fm-ce-badges">
          ${badges
            .map(
              (b, i) => `<li class="fm-ce-badge${b.earned ? " is-on" : ""}" style="--d:${i * 90}ms">
            <span class="fm-ce-badge-ico" aria-hidden="true">${b.earned ? b.icon : "🔒"}</span>
            <span class="fm-ce-badge-name">${bi(b.en, b.es)}</span>
            <span class="fm-ce-badge-hint">${b.earned ? bi("Earned", "Ganada") : bi(b.hintEn, b.hintEs)}</span></li>`,
            )
            .join("")}
        </ul>

        <div class="fm-ce-case">
          <h4 class="fm-ce-h">${bi("Your trophy case", "Su vitrina de trofeos")}</h4>
          <ul class="fm-ce-case-row">
            <li><strong>${trophy.total}</strong><span>${bi("stars in all", "estrellas en total")}</span></li>
            <li><strong>${trophy.lessons}</strong><span>${bi("lessons with stars", "lecciones con estrellas")}</span></li>
            <li><strong>${trophy.streak}</strong><span>${bi(trophy.streak === 1 ? "day in a row" : "days in a row", trophy.streak === 1 ? "día seguido" : "días seguidos")}</span></li>
          </ul>
          <p class="fm-ce-note">${bi("Saved only on this device.", "Se guarda solo en este dispositivo.")}</p>
        </div>
      </section>`;
    wire();
    return { earned, trophy };
  }

  function say(en, es) {
    const s = host.querySelector("[data-ce-status]");
    if (s) s.textContent = document.body.classList.contains("lang-mode-es") ? es : en;
  }

  function wire() {
    host.querySelector(".fm-ce-actions")?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ce]");
      if (!b) return;
      const a = b.dataset.ce;
      if (a === "five") {
        hooks.confetti?.(90);
        hooks.fanfare?.();
        b.classList.add("is-popped");
        setTimeout(() => b.classList.remove("is-popped"), 900);
      } else if (a === "photo") {
        const stars = starsFor(d).filter((s) => s.earned).length;
        hooks.photo?.(`${"⭐".repeat(Math.max(1, stars))} Lesson ${d.displayId || ""} complete!`.replace("  ", " "));
      } else if (a === "cert-toggle") {
        const wrap = host.querySelector("#fm_ce_cert");
        wrap.hidden = !wrap.hidden;
        b.setAttribute("aria-expanded", String(!wrap.hidden));
        if (!wrap.hidden) wrap.querySelector("input")?.focus();
      } else if (a === "card") {
        drawWinCard(d, name).then((ok) => say(ok ? "Win card saved to your downloads." : "Could not make the card on this device.", ok ? "Tarjeta guardada en sus descargas." : "No se pudo crear la tarjeta en este dispositivo."));
      }
    });
    host.querySelector("[data-ce-name]")?.addEventListener("input", (e) => {
      name = e.target.value.slice(0, 40);
      try {
        localStorage.setItem(NAME_KEY, name);
      } catch (_) {}
      hooks.saveName?.(name);
      const out = host.querySelector("[data-ce-cert-name]");
      if (out) out.textContent = name || "Math Star";
    });
    host.querySelector('[data-ce="print"]')?.addEventListener("click", () => {
      document.body.classList.add("fm-print-cert");
      const done = () => document.body.classList.remove("fm-print-cert");
      window.addEventListener("afterprint", done, { once: true });
      window.print();
      setTimeout(done, 4000);
    });
  }

  const out = render();
  return {
    refresh(next) {
      d = next;
      return render();
    },
    result: out,
    destroy() {
      host.innerHTML = "";
      host.hidden = true;
    },
  };
}

/** Draw the shareable win card on a canvas and download it. All local; returns true on success. */
export async function drawWinCard(d, name) {
  try {
    const W = 1080;
    const H = 1350;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#1c3a5e");
    grad.addColorStop(1, "#0f2740");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,.06)";
    for (let i = 0; i < 24; i++) {
      g.beginPath();
      g.arc((i * 211) % W, (i * 347) % H, 30 + ((i * 17) % 70), 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#fffaf0";
    const r = 40;
    const x = 70;
    const y = 90;
    const w = W - 140;
    const h = H - 180;
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
    g.fill();
    g.textAlign = "center";
    g.fillStyle = "#1c3a5e";
    g.font = "700 40px system-ui, sans-serif";
    g.fillText("FAMILY PRACTICE", W / 2, 190);
    g.font = "120px system-ui, sans-serif";
    g.fillText("🏆", W / 2, 360);
    const stars = starsFor(d).filter((s) => s.earned).length;
    g.font = "110px system-ui, sans-serif";
    g.fillStyle = "#f2a900";
    g.fillText("★".repeat(stars) + "☆".repeat(3 - stars), W / 2, 520);
    g.fillStyle = "#1c3a5e";
    g.font = "700 72px system-ui, sans-serif";
    g.fillText(name || "Math Star", W / 2, 650, W - 200);
    g.font = "42px system-ui, sans-serif";
    g.fillStyle = "#4a5a6c";
    g.fillText("completed", W / 2, 720);
    g.fillStyle = "#1c3a5e";
    g.font = "700 54px system-ui, sans-serif";
    const words = String(d.title || "Today's lesson").split(" ");
    const lines = [];
    let line = "";
    for (const wd of words) {
      const t = line ? `${line} ${wd}` : wd;
      if (g.measureText(t).width > W - 260 && line) {
        lines.push(line);
        line = wd;
      } else line = t;
    }
    lines.push(line);
    lines.slice(0, 3).forEach((ln, i) => g.fillText(ln, W / 2, 810 + i * 66, W - 200));
    g.font = "600 40px system-ui, sans-serif";
    g.fillStyle = "#2f6b4f";
    g.fillText(`${d.done} of ${d.goal} solved · ${d.firstTry} on the first try`, W / 2, 1100);
    g.fillStyle = "#4a5a6c";
    g.font = "34px system-ui, sans-serif";
    g.fillText(`${d.displayId ? `Lesson ${d.displayId} · ` : ""}${new Date().toLocaleDateString()}`, W / 2, 1170);
    g.fillText("eduwonderlab.com", W / 2, 1240);
    const blob = await new Promise((res) => c.toBlob(res, "image/png"));
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `win-card-${d.lessonId || "lesson"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (_) {
    return false;
  }
}
