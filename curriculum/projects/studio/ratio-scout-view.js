/**
 * Sports Stats Scout comparator (unit-3-b), mounted by ratio-lab-view.js. The student adjusts two fictional
 * players' records (the design's d/e and f/g), adds attempts, picks a comparison basis and judges whether
 * it is fair. A per-game comparison is made fair by scaling both records to the same number of games;
 * the graph and the prediction table read the same exact state.
 */
import { frac } from "./exact.mjs";
import { esc, MUTED, ORANGE, TEAL } from "./models-kit.mjs";
import {
  MAX_BATCH,
  commonGames,
  graphPoints,
  perAttempt,
  projection,
  show,
  totalsFair,
} from "./ratio-lab.mjs";

const num = (x) => Number(x.n) / Number(x.d);

export function scoutStation(ctx) {
  const { tr, lab, values, mask, commit, applyDesign, clampField, field } = ctx;

  function playersMarkup(r) {
    const l = lab();
    const card = (P, pts, games, ptsKey, gamesKey, attKey) =>
      `<div class="rl-player"><h5>${tr("Player", "Jugador")} ${P}</h5><p>${tr("Points", "Puntos")}</p>${ctx.stepper(`data-rl-design="${ptsKey}"`, show(pts), tr(`Player ${P} points`, `Puntos del jugador ${P}`), { min: field(ptsKey).min, max: field(ptsKey).max })}<p>${tr("Games", "Partidos")}</p>${ctx.stepper(`data-rl-design="${gamesKey}"`, show(games), tr(`Player ${P} games`, `Partidos del jugador ${P}`), { min: field(gamesKey).min, max: field(gamesKey).max })}<label for="rl-${attKey}">${tr("Shot attempts (your scouting note)", "Tiros intentados (tu nota)")}</label><input id="rl-${attKey}" data-rl-att="${attKey}" type="text" inputmode="numeric" maxlength="6" autocomplete="off" value="${esc(l[attKey])}"></div>`;
    return `<h4>${tr("1. Player records", "1. Registros de los jugadores")}</h4><div class="rl-grid2">${card("A", r.d, r.e, "d", "e", "attA")}${card("B", r.f, r.g, "f", "g", "attB")}</div>`;
  }

  function basisMarkup(r) {
    const l = lab();
    const opt = (v, label) =>
      `<label class="wb-radio"><input type="radio" name="rl-basis" data-rl-basis value="${v}"${l.basis === v ? " checked" : ""}> ${label}</label>`;
    let result = "";
    if (l.basis === "total") {
      const fair = totalsFair(r);
      const lead =
        r.d.n * r.f.d === r.f.n * r.d.d
          ? tr("They have the same total.", "Tienen el mismo total.")
          : tr(
              `Player ${num(r.d) > num(r.f) ? "A" : "B"} has more total points.`,
              `El jugador ${num(r.d) > num(r.f) ? "A" : "B"} tiene más puntos en total.`,
            );
      result = `<p>${tr("Totals", "Totales")}: A <strong>${show(r.d)}</strong> · B <strong>${show(r.f)}</strong>. ${lead}</p><p class="ps-verdict ${fair ? "ok" : "no"}"><span aria-hidden="true">${fair ? "✓" : "✗"}</span> ${fair ? tr("Fair: both players had the same number of games.", "Justo: los dos jugaron el mismo número de partidos.") : tr(`Not fair: A played ${show(r.e)} games and B played ${show(r.g)}. More games means more chances to score, so compare per game instead.`, `No es justo: A jugó ${show(r.e)} partidos y B jugó ${show(r.g)}. Más partidos dan más oportunidades, así que compara por partido.`)}</p>`;
    } else if (l.basis === "game") {
      const options = commonGames(r);
      const sel = options.length
        ? `<label for="rl-common">${tr("Scale both records to the same number of games", "Escala los dos registros al mismo número de partidos")}</label><select id="rl-common" data-rl-common><option value="0">${tr("Choose…", "Elige…")}</option>${options.map((g) => `<option value="${g}"${l.common === g ? " selected" : ""}>${g} ${tr("games", "partidos")}</option>`).join("")}</select>`
        : `<p class="muted">${tr("Use whole numbers of games to scale both players to a common number of games.", "Usa números enteros de partidos para escalar a los dos jugadores al mismo número.")}</p>`;
      let proj = "";
      if (l.common && options.includes(l.common)) {
        const p = projection(r, l.common);
        const gapText = mask(p.gap, p.guardGap);
        proj = `<div class="table-scroll"><table class="wb-table"><caption>${tr(`Both players scaled to ${l.common} games`, `Los dos jugadores escalados a ${l.common} partidos`)}</caption><thead><tr><th scope="col">${tr("Player", "Jugador")}</th><th scope="col">${tr("Record", "Registro")}</th><th scope="col">${tr("Multiply both by", "Multiplica ambos por")}</th><th scope="col">${tr(`Points in ${l.common} games`, `Puntos en ${l.common} partidos`)}</th></tr></thead><tbody><tr><th scope="row">A</th><td>${show(r.d)} : ${show(r.e)}</td><td>× ${show(frac(BigInt(l.common) * r.e.d, r.e.n))}</td><td>${mask(p.pA, p.guardA)}</td></tr><tr><th scope="row">B</th><td>${show(r.f)} : ${show(r.g)}</td><td>× ${show(frac(BigInt(l.common) * r.g.d, r.g.n))}</td><td>${mask(p.pB, p.guardB)}</td></tr></tbody></table></div><p class="ps-verdict ok">${p.leader === "tie" ? tr("Same scoring rate: a tie per game.", "La misma tasa: empate por partido.") : tr(`Player ${p.leader} scores more per game: ${gapText} more points over ${l.common} games.`, `El jugador ${p.leader} anota más por partido: ${gapText} puntos más en ${l.common} partidos.`)}</p><p class="muted">${tr("This is a prediction at a constant rate. Real games vary, so it is not a guarantee.", "Es una predicción con una tasa constante. Los partidos reales varían, así que no es una garantía.")}</p>`;
      }
      const rateA = mask(frac(r.d.n * r.e.d, r.d.d * r.e.n), ["rate-a"]);
      const rateB = mask(frac(r.f.n * r.g.d, r.f.d * r.g.n), ["rate-b"]);
      result = `<p>${tr("Points per game", "Puntos por partido")}: A <strong>${rateA}</strong> · B <strong>${rateB}</strong></p>${sel}${proj}`;
    } else {
      const aA = perAttempt(r.d, l.attA),
        aB = perAttempt(r.f, l.attB);
      result =
        aA && aB
          ? `<p>${tr("Points per attempt", "Puntos por tiro")}: A <strong>${show(aA)}</strong> (${show(r.d)} ÷ ${esc(l.attA)}) · B <strong>${show(aB)}</strong> (${show(r.f)} ÷ ${esc(l.attB)})</p><p class="ps-verdict ok">${num(aA) === num(aB) ? tr("Equally efficient per attempt.", "Igual de eficientes por tiro.") : tr(`Player ${num(aA) > num(aB) ? "A" : "B"} scores more per attempt. Does that change your pick?`, `El jugador ${num(aA) > num(aB) ? "A" : "B"} anota más por tiro. ¿Cambia eso tu elección?`)}</p>`
          : `<p class="ps-warn">${tr("Enter a whole number of shot attempts for both players.", "Escribe un número entero de tiros para los dos jugadores.")}</p>`;
    }
    return `<h4>${tr("2. Choose a fair comparison", "2. Elige una comparación justa")}</h4><fieldset class="wb-mover"><legend>${tr("Compare by", "Comparar por")}</legend>${opt("total", tr("Total points", "Puntos totales"))}${opt("game", tr("Points per game", "Puntos por partido"))}${opt("attempt", tr("Points per attempt", "Puntos por tiro"))}</fieldset><div aria-live="polite">${result}</div>`;
  }

  function graphMarkup(r) {
    const l = lab();
    const pts = graphPoints(r);
    const G = l.basis === "game" && l.common && commonGames(r).includes(l.common) ? l.common : 0;
    const maxX = Math.max(...pts.A.map((p) => num(p[0])), ...pts.B.map((p) => num(p[0])), G) * 1.08;
    const maxY =
      Math.max(
        ...pts.A.map((p) => num(p[1])),
        ...pts.B.map((p) => num(p[1])),
        G ? Math.max((num(r.d) / num(r.e)) * G, (num(r.f) / num(r.g)) * G) : 0,
      ) * 1.08;
    const X = (v) => 60 + (v / maxX) * 520,
      Y = (v) => 220 - (v / maxY) * 190;
    let body = `<line x1="60" y1="220" x2="590" y2="220" stroke="#142c3b" stroke-width="2"/><line x1="60" y1="220" x2="60" y2="22" stroke="#142c3b" stroke-width="2"/><text x="325" y="252" font-size="12" text-anchor="middle" fill="${MUTED}">${esc(tr("games", "partidos"))}</text><text x="16" y="120" font-size="12" fill="${MUTED}" transform="rotate(-90 16 120)" text-anchor="middle">${esc(tr("points", "puntos"))}</text>`;
    const series = (list, color, shape, label, ly) => {
      const last = list[list.length - 1];
      let s = `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(num(last[0]) * 1.04)}" y2="${Y(num(last[1]) * 1.04)}" stroke="${color}" stroke-width="2" stroke-dasharray="${shape === "sq" ? "7 4" : "none"}"/>`;
      for (const [gx, py] of list) {
        const x = X(num(gx)),
          y = Y(num(py));
        s +=
          shape === "sq"
            ? `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="${color}"/>`
            : `<circle cx="${x}" cy="${y}" r="6" fill="${color}"/>`;
        s += `<text x="${x + 8}" y="${y - 8}" font-size="11" fill="#142c3b">(${show(gx)}, ${show(py)})</text>`;
      }
      return (
        s +
        `<text x="72" y="${ly}" font-size="13" font-weight="700" fill="${color}">${esc(label)}</text>`
      );
    };
    body +=
      series(pts.A, TEAL, "dot", tr("● Player A (solid line)", "● Jugador A (línea continua)"), 28) +
      series(pts.B, ORANGE, "sq", tr("■ Player B (dashed line)", "■ Jugador B (línea punteada)"), 46);
    if (G)
      body += `<line x1="${X(G)}" y1="220" x2="${X(G)}" y2="22" stroke="#142c3b" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${X(G)}" y="236" font-size="12" text-anchor="middle" font-weight="700">${G}</text>`;
    const aria = tr(
      `Graph of points against games. Player A's records ${pts.A.map((p) => `(${show(p[0])}, ${show(p[1])})`).join(", ")} lie on one line through zero; Player B's ${pts.B.map((p) => `(${show(p[0])}, ${show(p[1])})`).join(", ")} on another. The steeper line scores more per game.`,
      `Gráfica de puntos contra partidos. Los registros del jugador A ${pts.A.map((p) => `(${show(p[0])}, ${show(p[1])})`).join(", ")} están en una recta que pasa por cero; los del jugador B ${pts.B.map((p) => `(${show(p[0])}, ${show(p[1])})`).join(", ")}, en otra. La recta más inclinada anota más por partido.`,
    );
    return `<h4>${tr("3. Graph: equivalent records lie on one line", "3. Gráfica: los registros equivalentes están en una recta")}</h4><svg class="rl-graph" viewBox="0 0 600 260" role="img" aria-label="${esc(aria)}"><rect width="600" height="260" fill="#fff"/>${body}</svg><p class="muted">${tr("Each player's dots are the record × 1, × 2 and × 3. The steeper line is the higher points-per-game rate.", "Los puntos de cada jugador son el registro × 1, × 2 y × 3. La recta más inclinada es la tasa más alta por partido.")}</p>`;
  }

  function predictionMarkup(r) {
    const l = lab();
    return `<h4>${tr("4. Prediction table for the base record", "4. Tabla de predicción del registro base")}</h4><p>${tr(`Base record: ${show(r.a)} points in ${show(r.b)} games.`, `Registro base: ${show(r.a)} puntos en ${show(r.b)} partidos.`)}</p><div class="ps-row"><span>${tr("Game blocks", "Bloques de partidos")}:</span>${ctx.stepper("data-rl-k", l.k, tr("Number of game blocks", "Número de bloques"), { min: 1, max: MAX_BATCH })}${ctx.twistMarkup(tr("Twist: the number of games doubles", "Giro: el número de partidos se duplica"))}</div>${ctx.tableMarkup(r, l.k, { n: tr("Blocks", "Bloques"), A: tr("Points", "Puntos"), B: tr("Games", "Partidos"), current: tr("your blocks", "tus bloques") })}${ctx.dnlMarkup(r, l.k, { A: tr("Points", "Puntos"), B: tr("Games", "Partidos") })}`;
  }

  return {
    intro: () =>
      tr(
        "Adjust two fictional players' records, then build a comparison that is fair when they had different chances to score.",
        "Ajusta los registros de dos jugadores ficticios y arma una comparación justa cuando tuvieron distintas oportunidades de anotar.",
      ),
    markup: (r) => playersMarkup(r) + basisMarkup(r) + graphMarkup(r) + predictionMarkup(r),
    onClick(el) {
      const l = lab();
      const dir = Number(el.dataset.dir);
      if (el.dataset.rlDesign) {
        const k = el.dataset.rlDesign;
        const v = clampField(k, Number(values()[k]) + dir);
        if (v === Number(values()[k])) return;
        const who = k === "d" || k === "e" ? "A" : "B";
        const what = k === "d" || k === "f" ? tr("points", "puntos") : tr("games", "partidos");
        return applyDesign(
          { [k]: String(v) },
          `rl-${k}`,
          tr(`Player ${who}: ${v} ${what}.`, `Jugador ${who}: ${v} ${what}.`),
        );
      }
      if (el.hasAttribute("data-rl-k")) {
        const k = Math.max(1, Math.min(MAX_BATCH, l.k + dir));
        return commit({ ...l, k }, null, tr(`${k} game blocks.`, `${k} bloques.`));
      }
    },
    onInput(el) {
      if (el.dataset.rlAtt)
        commit({ ...lab(), [el.dataset.rlAtt]: el.value.slice(0, 6) }, el.dataset.rlAtt);
    },
    onChange(el) {
      const l = lab();
      if (el.hasAttribute("data-rl-basis"))
        commit(
          { ...l, basis: el.value },
          null,
          tr("Comparison basis changed.", "Cambió la base de comparación."),
        );
      else if (el.hasAttribute("data-rl-common")) {
        const g = Number(el.value) || 0;
        commit(
          { ...l, common: g },
          null,
          g
            ? tr(
                `Both players scaled to ${g} games.`,
                `Los dos jugadores escalados a ${g} partidos.`,
              )
            : "",
        );
      }
    },
  };
}
