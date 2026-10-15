/**
 * Practice Studio v2 — the finder page's passport: reads the stamps every studio wrote to this device and paints them
 * beside each lesson. Stamps live in localStorage only; nothing leaves the device.
 */
(() => {
  const W = /** @type {any} */ (window);
  if (!W.StudioStore) return;
  const lessons = W.StudioStore.passport.read().lessons;
  const done = (/** @type {number[]|undefined} */ r) => !!r && r[1] > 0 && r[0] >= r[1];
  for (const slot of /** @type {HTMLElement[]} */ ([
    ...document.querySelectorAll("[data-stamps]"),
  ])) {
    const rec = lessons[slot.dataset.stamps || ""];
    if (!rec) continue;
    const parts = [];
    if (done(rec.p))
      parts.push('<span class="stamp stamp-p" title="Practice finished">✓ Practice</span>');
    else if (rec.p?.[0])
      parts.push(`<span class="stamp" title="Practice in progress">${rec.p[0]}/${rec.p[1]}</span>`);
    if (rec.g)
      parts.push('<span class="stamp stamp-g" title="Challenge boss cleared">★ Gold</span>');
    else if (done(rec.c))
      parts.push('<span class="stamp stamp-c" title="Challenge finished">✓ Challenge</span>');
    else if (rec.c?.[0])
      parts.push(
        `<span class="stamp" title="Challenge in progress">${rec.c[0]}/${rec.c[1]}</span>`,
      );
    slot.innerHTML = parts.join(" ");
  }
  const s = W.StudioStore.passport.stamps();
  const sum = document.getElementById("passport-summary");
  if (sum && (s.practice || s.challenge || s.gold))
    sum.textContent = `${s.practice} Practice stamp${s.practice === 1 ? "" : "s"} · ${s.challenge} Challenge stamp${s.challenge === 1 ? "" : "s"} · ${s.gold} gold. Keep going.`;
})();
