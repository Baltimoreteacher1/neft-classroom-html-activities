/* Interactive 4-5 tape check: students test a proposed whole against a known part. */
(() => {
  const panel = document.getElementById("panel-4");
  if (!panel) return;
  const css = document.createElement("style");
  css.textContent = `.whole-check{min-width:0;margin:1rem 0;padding:1rem;border:2px solid var(--border);border-radius:14px;background:var(--surface);color:var(--ink)}.whole-check h2{font-size:1.25rem}.whole-check .wc-row{display:flex;flex-wrap:wrap;gap:.75rem;align-items:end}.whole-check label{display:grid;gap:.3rem;font-weight:700}.whole-check input{width:8rem;min-height:44px;padding:.45rem;border:2px solid var(--border-strong);border-radius:8px;background:var(--surface);color:var(--ink);font:inherit}.wc-tape{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:3px;margin:.8rem 0}.wc-cell{min-width:0;min-height:54px;display:grid;place-content:center;border:2px solid var(--brand);border-radius:5px;text-align:center;font-size:.88rem;overflow-wrap:anywhere}.wc-cell.part{background:color-mix(in srgb,var(--brand) 28%,var(--surface));font-weight:800}.wc-feedback{min-height:2em}.whole-check button{min-height:44px}#u4-lab-bench .lab-twin-table{width:100%;max-width:100%;table-layout:fixed}#u4-lab-bench .lab-twin-table th,#u4-lab-bench .lab-twin-table td{overflow-wrap:anywhere}@media(forced-colors:active){.whole-check,.wc-cell,.whole-check input{border:2px solid CanvasText}.wc-cell.part{background:Highlight;color:HighlightText}.whole-check button{border:2px solid ButtonText}}`;
  document.head.appendChild(css);
  const section = document.createElement("section");
  section.className = "whole-check";
  section.setAttribute("aria-labelledby", "whole-check-title");
  section.innerHTML = `<h2 id="whole-check-title">Test your whole<span class="es-text" lang="es">Comprueba el total</span></h2><p>18 students fill 4 of the 10 equal cells. Enter the value of one cell and the whole you think fits the tape. Then test your model.<span class="es-text" lang="es">18 estudiantes ocupan 4 de las 10 celdas iguales. Escribe el valor de una celda y el total que crees que corresponde a la cinta. Luego prueba tu modelo.</span></p><div class="wc-tape" role="img" aria-label="Ten equal cells; four are shaded"><span class="wc-cell part">Part<span class="es-text" lang="es">Parte</span></span><span class="wc-cell part" aria-hidden="true"></span><span class="wc-cell part" aria-hidden="true"></span><span class="wc-cell part" aria-hidden="true"></span>${Array.from({ length: 6 }, () => '<span class="wc-cell" aria-hidden="true"></span>').join("")}</div><p class="wc-given"></p><div class="wc-row"><label>One cell<span class="es-text" lang="es">Una celda</span><input id="wc-cell" inputmode="decimal" type="number" step="any"></label><label>Whole<span class="es-text" lang="es">Total</span><input id="wc-whole" inputmode="decimal" type="number" step="any"></label><button type="button" id="wc-test">Test my tape<span class="es-text" lang="es">Prueba mi cinta</span></button><button type="button" id="wc-new">New numbers<span class="es-text" lang="es">Números nuevos</span></button></div><p class="wc-feedback" id="wc-feedback" role="status" aria-live="polite"></p>`;
  panel.appendChild(section);
  let seed = Number(localStorage.getItem("u4-whole-check-seed") || 2);
  let part = 18;
  const given = section.querySelector(".wc-given");
  const tape = section.querySelector(".wc-tape");
  const msg = section.querySelector("#wc-feedback");
  const cellInput = section.querySelector("#wc-cell");
  const wholeInput = section.querySelector("#wc-whole");
  const makeProblem = () => {
    part = [12, 16, 18, 20, 24, 28][((seed % 6) + 6) % 6];
    seed += 1;
    localStorage.setItem("u4-whole-check-seed", String(seed));
    given.innerHTML = `${part} students fill 4 cells (40%).<span class="es-text" lang="es">${part} estudiantes ocupan 4 celdas (40%).</span>`;
    cellInput.value = "";
    wholeInput.value = "";
    msg.textContent = "";
    tape.dataset.whole = "";
    tape.querySelectorAll(".wc-cell").forEach((el) => {
      el.textContent = "";
    });
    tape.querySelectorAll(".wc-cell").forEach((el, i) => {
      el.classList.toggle("part", i < 4);
    });
    tape.querySelector(".wc-cell").innerHTML = `Part<span class="es-text" lang="es">Parte</span>`;
  };
  const render = (whole) => {
    tape.dataset.whole = String(whole);
    const each = whole / 10;
    tape.querySelectorAll(".wc-cell").forEach((el, i) => {
      el.innerHTML = `${Number(each.toFixed(4))}${i === 0 ? '<span class="es-text" lang="es">por celda</span>' : ""}`;
      el.setAttribute("aria-label", `Cell ${i + 1}: ${Number(each.toFixed(4))}`);
    });
  };
  section.querySelector("#wc-test").addEventListener("click", () => {
    const c = Number(cellInput.value),
      w = Number(wholeInput.value);
    if (!(c > 0) || !(w > 0)) {
      msg.textContent =
        "Enter a positive value in both boxes. / Escribe un valor positivo en las dos casillas.";
      return;
    }
    render(w);
    const shaded = Number((c * 4).toFixed(6));
    if (Math.abs(shaded - part) < 1e-6 && Math.abs(c - w / 10) < 1e-6) {
      msg.textContent = `The four shaded cells match ${part} students, and all ten cells make the whole. Your tape is consistent. / Las cuatro celdas sombreadas corresponden a ${part} estudiantes y las diez celdas forman el total. Tu cinta es coherente.`;
    } else {
      msg.textContent = `With this whole, 40% of the tape is ${Number(shaded.toFixed(4))}, while the known part is ${part}. Recheck the cell value and whole. / Con este total, el 40% de la cinta es ${Number(shaded.toFixed(4))}, pero la parte conocida es ${part}. Revisa el valor de la celda y el total.`;
    }
  });
  section.querySelector("#wc-new").addEventListener("click", makeProblem);
  makeProblem();
})();
