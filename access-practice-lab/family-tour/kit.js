// The Family Practice Starter Kit on screen, plus the one-page practice card that prints from the same page.
import { t } from "./i18n.js";
import { qrSvg } from "../../shared/qr/qr-code.mjs";
import { esc, en, icon } from "./util.js";

const li = (items) => `<ol class="steps">${items.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`;

export function qrFor(url, label, px = 168) {
  try {
    return qrSvg(url, { px, label });
  } catch {
    return `<p class="fine">${esc(t("kit.qrTooLong"))}</p>`;
  }
}

export function trackerHTML(k, editable) {
  if (!editable)
    return `<table class="tracker"><thead><tr>${k.trackerCols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead><tbody>${k.tracker
      .map((r) => `<tr><td>${esc(r.date)}</td><td>${esc(r.activity)}</td><td>${esc(r.statusLabel)}</td><td>${esc(r.practiced)}</td><td>${esc(r.next)}</td></tr>`)
      .join("")}</tbody></table>`;
  return `<div class="tracker-edit">${k.tracker
    .map(
      (r, i) => `<fieldset class="trow"><legend>${esc(t("kit.e.session", { n: i + 1 }))}</legend>
      <label>${esc(k.trackerCols[0])}<input type="date" data-tr="${i}" data-f="date" value="${esc(r.date)}"></label>
      <label>${esc(k.trackerCols[1])}<input type="text" maxlength="80" data-tr="${i}" data-f="activity" value="${esc(r.activity)}" lang="en"></label>
      <div class="seg" role="group" aria-label="${esc(k.trackerCols[2])}">
        <button type="button" data-act="tr-status" data-tr="${i}" data-v="completed" aria-pressed="${r.status === "completed"}">${esc(t("kit.e.completed"))}</button>
        <button type="button" data-act="tr-status" data-tr="${i}" data-v="attempted" aria-pressed="${r.status === "attempted"}">${esc(t("kit.e.attempted"))}</button>
      </div>
      <label>${esc(k.trackerCols[3])}<input type="text" maxlength="160" data-tr="${i}" data-f="practiced" value="${esc(r.practiced)}"></label>
      <label>${esc(k.trackerCols[4])}<input type="text" maxlength="160" data-tr="${i}" data-f="next" value="${esc(r.next)}"></label>
    </fieldset>`,
    )
    .join("")}<p class="fine">${esc(t("kit.e.privacy"))}</p></div>`;
}

export function kitHTML(k, { editable = true } = {}) {
  const f = k.first;
  return `<div class="kit" lang="${k.lang}">
    <section class="kit-sec kit-a" aria-labelledby="ka"><span class="kit-letter" aria-hidden="true">A</span>
      <h3 id="ka">${esc(f.heading)}</h3>
      <div class="kit-first">
        <div><p class="big" lang="en">${esc(f.name)}</p>
          <p><strong>${esc(t("kit.a.practice"))}</strong> ${esc(f.practice)}</p>
          <p><strong>${esc(t("kit.a.time"))}</strong> ${esc(t("kit.minutes", { n: f.minutes }))}</p>
          ${li(f.steps)}
          <p><strong>${esc(f.supportsTitle)}</strong></p><ul>${f.supports.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          <p class="linkline"><a class="btn-link" href="${esc(f.url)}" data-launch>${esc(f.url)}</a></p>
        </div>
        <div class="qr">${qrFor(f.url, f.qrLabel)}<p class="fine">${esc(f.qrLabel)}</p></div>
      </div>
    </section>
    <section class="kit-sec" aria-labelledby="kb"><span class="kit-letter" aria-hidden="true">B</span>
      <h3 id="kb">${esc(k.routineHeading)}</h3><p>${esc(k.routineIntro)}</p>
      <ol class="routine">${k.routine.map((r) => `<li><span class="mins">${esc(t("kit.min", { n: r.mins }))}</span><div><strong>${esc(r.title)}</strong><p>${esc(r.text)}</p></div></li>`).join("")}</ol>
    </section>
    <section class="kit-sec" aria-labelledby="kc"><span class="kit-letter" aria-hidden="true">C</span>
      <h3 id="kc">${esc(k.sayHeading)}</h3>
      <ul class="say">${k.say.map((s) => `<li>${esc(s.home)}${s.en && k.lang !== "en" ? ` <span class="en-line">${en(s.en)}</span>` : ""}</li>`).join("")}</ul>
      <p class="fine">${esc(k.sayNote)}</p>
    </section>
    <section class="kit-sec" aria-labelledby="kd"><span class="kit-letter" aria-hidden="true">D</span>
      <h3 id="kd">${esc(k.helpHeading)}</h3>
      <div class="help3">${k.help.map((h) => `<div><strong>${esc(h.title)}</strong><p>${esc(h.text)}</p></div>`).join("")}</div>
    </section>
    <section class="kit-sec" aria-labelledby="ke"><span class="kit-letter" aria-hidden="true">E</span>
      <h3 id="ke">${esc(k.trackerHeading)}</h3><p>${esc(k.trackerIntro)}</p>
      ${trackerHTML(k, editable)}
    </section>
    <section class="kit-sec" aria-labelledby="kf"><span class="kit-letter" aria-hidden="true">F</span>
      <h3 id="kf">${esc(k.returnHeading)}</h3>
      <dl class="returns">${k.returnLines.map((r) => `<dt>${esc(r.label)}</dt><dd>${r.url ? `<a href="${esc(r.url)}" data-launch>${esc(r.value)}</a>` : esc(r.value)}</dd>`).join("")}</dl>
    </section>
  </div>`;
}

/** The one-page card, hidden on screen and the only thing that prints when "Print Our Practice Card" is used. */
export function cardHTML(k) {
  const f = k.first;
  return `<section id="print-card" class="print-card" lang="${k.lang}" aria-hidden="true">
    <h2>${esc(k.cardTitle)}</h2>
    <p class="big" lang="en">${esc(f.name)}</p>
    <p>${esc(t("kit.a.practice"))} ${esc(f.practice)} · ${esc(t("kit.minutes", { n: f.minutes }))}</p>
    ${li(f.steps)}
    <div class="card-qr">${qrFor(f.url, f.qrLabel, 220)}<p class="url">${esc(f.url)}</p></div>
    <p class="fine">${esc(k.footer)}</p>
  </section>`;
}

export { icon };
