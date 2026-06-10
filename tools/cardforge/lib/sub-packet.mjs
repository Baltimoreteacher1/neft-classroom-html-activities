// Emergency Substitute Packet generator.
// Produces a self-contained, black-and-white, print-friendly 3-day packet from
// a lesson job: cover page + simple sub directions, then 3 days of independent
// work (each: warm-up + modeled example + practice), plus a full answer key.
// Large readable fonts, no color-dependent instructions, no filler.
import { htmlPage, esc, nameBar, problemList } from "./print-style.mjs";

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function renderModeled(ex) {
  if (!ex) return "";
  const steps = (ex.steps || []).map((s) => `<li>${esc(s)}</li>`).join("");
  return `<div class="box"><h3>Worked Example</h3><p><strong>${esc(ex.prompt)}</strong></p><ul class="steps">${steps}</ul><p><strong>Answer:</strong> ${esc(ex.answer)}</p></div>`;
}

export function renderSubPacket(job) {
  const c = job.card || {};
  const L = job.lesson || {};
  const title = c.title || "Math Lesson";
  const std = c.standard || "";
  const practice = L.practice || [];
  // Split practice across 3 days (3–4 each); reuse modeled examples per day.
  const perDay = Math.max(3, Math.ceil(practice.length / 3));
  const days = chunk(practice, perDay).slice(0, 3);
  while (days.length < 3) days.push([]);
  const modeled = L.modeledExamples || [];

  const cover = `<section class="page">
    <h1>${esc(title)}</h1>
    <p class="meta">Grade 6 Math${std ? ` &middot; ${esc(std)}` : ""} &middot; 3-Day Substitute Packet</p>
    <hr class="rule" />
    <div class="box">
      <h3>For the Substitute</h3>
      <p>Thanks for being here today. This packet runs itself — students can work
      independently. Here's the plan:</p>
      <ul class="steps">
        <li>Hand each student the packet (or this printout).</li>
        <li>Read the day's <strong>Worked Example</strong> aloud, then have students try the practice.</li>
        <li>Students show their work in the space under each problem.</li>
        <li>The <strong>Answer Key</strong> is at the back (last page) for you — keep it separate from students.</li>
        <li>If students finish early, they move to the next day's page or the Challenge.</li>
      </ul>
      <p class="small">Objective: ${esc(L.objective || "")}</p>
    </div>
    ${nameBar()}
  </section>`;

  const dayPages = days
    .map((dp, i) => {
      const ex = modeled[i % Math.max(modeled.length, 1)];
      const warm = i === 0 ? (L.warmUp || "") : "Look back at yesterday's example before you start.";
      return `<section class="page">
        <h2>Day ${i + 1}</h2>
        <p class="meta">${esc(title)}${std ? ` &middot; ${esc(std)}` : ""}</p>
        ${warm ? `<div class="box"><h3>Warm-Up</h3><p>${esc(warm)}</p></div>` : ""}
        ${renderModeled(ex)}
        <h3>Practice — show your work</h3>
        ${dp.length ? problemList(dp) : "<p>Use the Challenge on Day 3.</p>"}
      </section>`;
    })
    .join("");

  // Challenge on day 3 area + answer key page.
  const challenge = L.extension
    ? `<section class="page"><h2>Challenge (Early Finishers)</h2><div class="box"><p>${esc(L.extension)}</p></div></section>`
    : "";

  const keyItems = [];
  const allKey = L.answerKey && L.answerKey.length ? L.answerKey : practice;
  allKey.forEach((k) => {
    keyItems.push(`<li><strong>${k.n != null ? k.n + "." : ""}</strong> ${esc(k.answer)}${k.work ? ` <span class="small">(${esc(k.work)})</span>` : ""}</li>`);
  });
  const keyPage = `<section class="page">
    <h2>Answer Key — Teacher Only</h2>
    <p class="small">Keep this page separate from students.</p>
    <ol class="key">${keyItems.join("")}</ol>
  </section>`;

  return htmlPage(`${title} — Sub Packet`, cover + dayPages + challenge + keyPage);
}
