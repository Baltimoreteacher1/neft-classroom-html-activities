/* Atlas Rover — survey builder (chapter 3, distance and polygons on the coordinate plane).
 *   legs   battery charge per leg = the distance between two points on a line
 *          (one leg crosses an axis at tier ≥ 2: add the distances to 0, don't subtract)
 *   relay  a rectangle of relay towers: type the missing corner D, then two side lengths
 * Too little charge stops short, too much rolls past; a wrong corner will not close the ring.
 */
(function () {
  "use strict";
  const X = window.EWLExpedition;
  const M = window.CQ_MATH;
  const UI = window.CQ_MISSIONS;
  if (!X || !M || !UI || !UI.grid) return;
  const { L, num, pair } = M;
  const { PANEL, GOOD, BAD, grid, pointFeedback, tag, drive, clampR } = UI;
  /* ── survey ───────────────────────────────────────────────────────────── */
  function survey(scene, api) {
    const { kit } = api;
    const variant = api.mission.variant || "legs";
    const p = M.genSurvey(api.rng, api.tier, variant);
    const G = grid(scene, api, p.R, 1);
    const relay = variant === "relay";
    api.setBrief(
      relay
        ? L(
            "Relay towers A, B and C stand at three corners of a rectangle. Program tower D's corner, then cut the cable for sides A→B and B→C.",
            "Las torres A, B y C están en tres esquinas de un rectángulo. Programa la esquina de la torre D y corta el cable de los lados A→B y B→C.",
          )
        : L(
            "Charge the battery for each leg of the route. One unit of charge drives one grid unit — too little stops short, too much rolls past.",
            "Carga la batería para cada tramo de la ruta. Una unidad de carga avanza una unidad — poca carga se queda corta, mucha se pasa.",
          ),
    );
    const names = relay ? ["A", "B", "C"] : ["A", "B", "C"];
    const pts = relay ? [p.A, p.B, p.C] : p.pts;
    const art = scene.add.graphics().setDepth(25);
    const temp = [];
    pts.forEach((pt, i) => {
      if (relay) {
        art
          .fillStyle(0xe9e4dc, 1)
          .fillTriangle(
            G.px(pt.x) - 7,
            G.py(pt.y) + 6,
            G.px(pt.x) + 7,
            G.py(pt.y) + 6,
            G.px(pt.x),
            G.py(pt.y) - 12,
          );
        art.fillStyle(0xffb681, 1).fillCircle(G.px(pt.x), G.py(pt.y) - 12, 3);
      } else {
        art.fillStyle(0xffb681, 1).fillCircle(G.px(pt.x), G.py(pt.y), 6);
      }
      tag(kit, G, pt, `${names[i]} ${pair(pt.x, pt.y)}`, "#ffe9a8");
    });
    if (!relay)
      p.legs.forEach((leg) => {
        art.lineStyle(2, 0xffb681, 0.5);
        const a = { x: G.px(leg.from.x), y: G.py(leg.from.y) };
        const b = { x: G.px(leg.to.x), y: G.py(leg.to.y) };
        const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 10));
        for (let s = 0; s < n; s += 2)
          art.lineBetween(
            a.x + ((b.x - a.x) * s) / n,
            a.y + ((b.y - a.y) * s) / n,
            a.x + ((b.x - a.x) * (s + 1)) / n,
            a.y + ((b.y - a.y) * (s + 1)) / n,
          );
      });
    const start = relay ? p.C : p.pts[0];
    const rv = UI.rover(scene, kit, G.px(start.x), G.py(start.y) - 4, 0.75);
    const cable = scene.add.graphics().setDepth(24);
    // Right panel.
    kit.panel(380, 146, 414, 286, { fill: PANEL, alpha: 0.92 });
    kit.text(
      587,
      168,
      api.t(relay ? L("RELAY RING", "ANILLO DE TORRES") : L("BATTERY PLAN", "PLAN DE BATERÍA")),
      14,
      "#ffd76a",
      {
        weight: "800",
      },
    );
    let specs;
    if (relay) {
      kit.text(404, 214, "D", 24, "#ffb681", { weight: "900" });
      kit.text(452, 214, "(", 28, "#f3e6dd");
      kit.text(560, 218, ",", 26, "#f3e6dd");
      kit.text(668, 214, ")", 28, "#f3e6dd");
      kit.text(398, 286, api.t(L("Side A → B", "Lado A → B")), 16, "#f3e6dd", {
        ox: 0,
        weight: "800",
      });
      kit.text(398, 350, api.t(L("Side B → C", "Lado B → C")), 16, "#f3e6dd", {
        ox: 0,
        weight: "800",
      });
      kit.text(752, 286, api.t(L("units", "unid.")), 14, "#d9c9c0", { ox: 0 });
      kit.text(752, 350, api.t(L("units", "unid.")), 14, "#d9c9c0", { ox: 0 });
      specs = [
        { x: 506, y: 214, w: 90 },
        { x: 614, y: 214, w: 90 },
        { x: 690, y: 286, w: 100 },
        { x: 690, y: 350, w: 100 },
      ];
    } else {
      p.legs.forEach((leg, i) => {
        const y = 222 + i * 76;
        kit.text(
          398,
          y - 12,
          api.t(
            L(
              `Leg ${i + 1}: ${names[i]} → ${names[i + 1]}`,
              `Tramo ${i + 1}: ${names[i]} → ${names[i + 1]}`,
            ),
          ),
          16,
          "#f3e6dd",
          {
            ox: 0,
            weight: "800",
          },
        );
        kit.text(
          398,
          y + 12,
          pair(leg.from.x, leg.from.y) + " → " + pair(leg.to.x, leg.to.y),
          13,
          "#bfa89f",
          { ox: 0 },
        );
        kit.text(752, y, api.t(L("units", "unid.")), 14, "#d9c9c0", { ox: 0 });
      });
      specs = p.legs.map((_, i) => ({ x: 690, y: 222 + i * 76, w: 100 }));
      kit.text(
        587,
        400,
        api.t(
          L("Charge = distance. It is never negative.", "Carga = distancia. Nunca es negativa."),
        ),
        13,
        "#bfa89f",
      );
    }
    const f = UI.fields(scene, api, specs);
    /** Drive one leg with `val` units of charge; returns where it stopped. */
    async function runLeg(leg, val, ok, color) {
      const dir = Math.sign(leg.to[leg.axis] - leg.from[leg.axis]);
      const end = { ...leg.from, [leg.axis]: clampR(leg.from[leg.axis] + dir * val, p.R) };
      rv.setPosition(G.px(leg.from.x), G.py(leg.from.y) - 4);
      await UI.move(
        kit,
        rv,
        { x: G.px(end.x), y: G.py(end.y) - 4 },
        160 + 80 * Math.min(14, Math.abs(val)),
      );
      cable
        .lineStyle(4, ok ? GOOD : color, 0.9)
        .lineBetween(G.px(leg.from.x), G.py(leg.from.y), G.px(end.x), G.py(end.y));
      if (!ok) {
        temp.push(
          kit.text(G.px(end.x), G.py(end.y) + 16, "✕", 20, "#ff7a5c", { weight: "900", depth: 30 }),
        );
        kit.shake(0.004, 150);
      } else api.sfx.select();
      await kit.wait(200);
    }
    async function run(vals) {
      cable.clear();
      temp.splice(0).forEach((o) => o.destroy());
      const r = M.judgeSurvey(p, vals);
      let k = 0;
      if (relay) {
        const D = { x: clampR(vals[0], p.R), y: clampR(vals[1], p.R) };
        rv.setPosition(G.px(p.C.x), G.py(p.C.y) - 4);
        await drive(kit, G, rv, D, p.C);
        const okD = !(r.part === "vertex");
        const tw = scene.add.graphics().setDepth(25);
        tw.fillStyle(okD ? 0xe9e4dc : BAD, 1).fillTriangle(
          G.px(D.x) - 7,
          G.py(D.y) + 6,
          G.px(D.x) + 7,
          G.py(D.y) + 6,
          G.px(D.x),
          G.py(D.y) - 12,
        );
        tw.lineStyle(2, okD ? GOOD : BAD, 0.6);
        tw.strokePoints(
          [p.A, p.B, p.C, D].map((q) => ({ x: G.px(q.x), y: G.py(q.y) })),
          true,
        );
        temp.push(tw);
        if (!okD) {
          kit.shake(0.004, 150);
          return r;
        }
        kit.burst(G.px(D.x), G.py(D.y), GOOD, 14);
        await kit.wait(250);
        k = 2;
      }
      for (let i = 0; i < p.legs.length; i++) {
        const legOk = r.ok || !(r.part === "leg" && r.at <= i);
        await runLeg(p.legs[i], vals[k + i], legOk, BAD);
        if (!legOk) return r;
      }
      if (r.ok) kit.burst(rv.x, rv.y, GOOD, 26);
      return r;
    }
    const legLabel = (i) =>
      relay
        ? L(i === 0 ? "Side A → B" : "Side B → C", i === 0 ? "Lado A → B" : "Lado B → C")
        : L(`Leg ${i + 1}`, `Tramo ${i + 1}`);
    const legWhy = (leg) => {
      const { a, b, d, cross } = M.legInfo(leg);
      return cross
        ? `|${num(a)}| + |${num(b)}| = ${Math.abs(a)} + ${Math.abs(b)} = ${d}`
        : `${Math.max(Math.abs(a), Math.abs(b))} − ${Math.min(Math.abs(a), Math.abs(b))} = ${d}`;
    };
    const L0 = M.legInfo(p.legs[0]);
    return {
      checkLabel: relay
        ? L("Raise the relay", "Levantar la torre")
        : L("Start the route", "Iniciar la ruta"),
      actions: f.actions,
      status: () =>
        L(
          `Entered: ${f.vals.map((v) => M.display(v) || "?").join(", ")}`,
          `Escrito: ${f.vals.map((v) => M.display(v) || "?").join(", ")}`,
        ),
      hints: relay
        ? [
            L(
              "In a rectangle, D lines up with A (same x) and with C (same y). A side length is the distance between the coordinates that change.",
              "En un rectángulo, D se alinea con A (misma x) y con C (misma y). El largo de un lado es la distancia entre las coordenadas que cambian.",
            ),
            L(
              `Side A → B goes from x = ${num(p.A.x)} to x = ${num(p.B.x)}. They are on opposite sides of 0: add their distances from 0.`,
              `El lado A → B va de x = ${num(p.A.x)} a x = ${num(p.B.x)}. Están en lados opuestos de 0: suma sus distancias a 0.`,
            ),
          ]
        : [
            L(
              "Two points on one line share a coordinate. Use the other one. Same side of 0: subtract the distances from 0. Opposite sides: add them.",
              "Dos puntos en una línea comparten una coordenada. Usa la otra. Mismo lado de 0: resta las distancias a 0. Lados opuestos: súmalas.",
            ),
            L(
              `Leg 1 goes from ${p.legs[0].axis} = ${num(L0.a)} to ${p.legs[0].axis} = ${num(L0.b)}. How far is each from 0? Are they on the same side of 0?`,
              `El tramo 1 va de ${p.legs[0].axis} = ${num(L0.a)} a ${p.legs[0].axis} = ${num(L0.b)}. ¿Qué tan lejos está cada uno de 0? ¿Están del mismo lado de 0?`,
            ),
          ],
      async check() {
        if (!f.filled())
          return {
            ok: false,
            incomplete: true,
            feedback: L("Fill every box first.", "Primero llena todas las casillas."),
          };
        const vals = f.nums();
        const r = await run(vals);
        if (r.ok) return { ok: true };
        if (r.part === "vertex")
          return {
            ok: false,
            misconception: r.tag,
            feedback: pointFeedback(r, "D", { x: vals[0], y: vals[1] }),
          };
        const who = legLabel(r.at);
        const fb = {
          negativeDistance: L(
            `${who.en}: a charge can't be negative. Distance is always positive.`,
            `${who.es}: la carga no puede ser negativa. La distancia siempre es positiva.`,
          ),
          absDiff: L(
            `${who.en} crosses an axis: the two points are on opposite sides of 0. Subtracting leaves the rover short. Add the two distances to 0.`,
            `${who.es} cruza un eje: los dos puntos están en lados opuestos de 0. Restar deja al róver corto. Suma las dos distancias a 0.`,
          ),
          addAbs: L(
            `${who.en} stays on one side of 0. Adding the distances sent the rover too far. Subtract them.`,
            `${who.es} se queda de un lado de 0. Sumar las distancias mandó al róver demasiado lejos. Réstalas.`,
          ),
          countPoints: L(
            `${who.en}: one unit too far. Count the jumps between grid lines, not the lines themselves.`,
            `${who.es}: una unidad de más. Cuenta los saltos entre las líneas, no las líneas.`,
          ),
          oneCoordinate: L(
            `${who.en}: that is one coordinate, not the distance between the two points.`,
            `${who.es}: esa es una coordenada, no la distancia entre los dos puntos.`,
          ),
          distance: L(
            `${who.en}: the rover ${r.short ? "stopped short" : "rolled past"}. Find how far apart the two coordinates are.`,
            `${who.es}: el róver ${r.short ? "se quedó corto" : "se pasó"}. Halla qué tan separadas están las dos coordenadas.`,
          ),
        }[r.tag];
        return { ok: false, misconception: r.tag, feedback: fb };
      },
      async demo() {
        let k = 0;
        if (relay) {
          kit.floatText(
            G.px(p.D.x),
            G.py(p.D.y) - 18,
            `x ${num(p.A.x)} · y ${num(p.C.y)}`,
            "#ffd76a",
            15,
          );
          await UI.typeOut(kit, f, 0, UI.plain(p.D.x));
          await UI.typeOut(kit, f, 1, UI.plain(p.D.y));
          k = 2;
        }
        for (let i = 0; i < p.legs.length; i++) {
          const leg = p.legs[i];
          const mid = { x: (leg.from.x + leg.to.x) / 2, y: (leg.from.y + leg.to.y) / 2 };
          kit.floatText(G.px(mid.x), G.py(mid.y) - 16, legWhy(leg), "#ffd76a", 15);
          await UI.typeOut(kit, f, k + i, String(M.legInfo(leg).d));
          await kit.wait(500);
        }
        await run(f.nums());
      },
      explain: () =>
        relay
          ? L(
              `D ${pair(p.D.x, p.D.y)}. A → B: ${legWhy(p.legs[0])}. B → C: ${legWhy(p.legs[1])}. Perimeter = 2 × ${p.width} + 2 × ${p.height} = ${2 * (p.width + p.height)} units.`,
              `D ${pair(p.D.x, p.D.y)}. A → B: ${legWhy(p.legs[0])}. B → C: ${legWhy(p.legs[1])}. Perímetro = 2 × ${p.width} + 2 × ${p.height} = ${2 * (p.width + p.height)} unidades.`,
            )
          : L(
              p.legs.map((leg, i) => `Leg ${i + 1}: ${legWhy(leg)}`).join(". ") +
                ". Opposite sides of 0: add. Same side: subtract.",
              p.legs.map((leg, i) => `Tramo ${i + 1}: ${legWhy(leg)}`).join(". ") +
                ". Lados opuestos de 0: suma. Mismo lado: resta.",
            ),
    };
  }


  UI.survey = survey;
})();
