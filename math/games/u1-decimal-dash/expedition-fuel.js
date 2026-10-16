/* Cloudline Courier — the fuel route.
 *   fuel  fuel = burn rate × distance with decimal factors. Too little and the engine
 *         stalls on the route; too much and the tank spills and the heavy ship sinks
 *         below the dock. The tank fills on a fixed scale, so a misplaced decimal point
 *         is visible (4.8 L vs 48 L) without showing the target.
 */
(function () {
  "use strict";
  const M = window.DD_MISSIONS;
  if (!window.EWLExpedition || !M) return;
  const { L, airship, pad, entry, typeDigits, eraseAction, editNumber, SHIP, PANEL, INK, GOLD } = M;
  const { D, fmt, mul, cmp, decPlaces, num, genFuel, judgeFuel } = M.math;
  const W = 820;

  /* ── fuel: rate × distance; the route shows what the fuel can do ──────── */
  function fuel(scene, api) {
    const { kit, rng } = api;
    const p = genFuel(rng, api.tier);
    const t = D(p.truth);
    const dr = decPlaces(p.rate);
    const dd = decPlaces(p.dist);
    let ans = "";
    api.setBrief(
      L(
        `The engine burns ${p.rate} liters of fuel per kilometer. The route to the next post is ${p.dist} km. Load exactly the fuel the trip needs.`,
        `El motor gasta ${p.rate} litros de combustible por kilómetro. La ruta al siguiente puesto mide ${p.dist} km. Carga exactamente el combustible del viaje.`,
      ),
    );
    // Route strip across the top.
    const RX0 = 90;
    const RX1 = 730;
    const RY = 192;
    const route = scene.add.graphics().setDepth(20);
    route.fillStyle(PANEL, 0.75).fillRoundedRect(24, 140, W - 48, 104, 14);
    for (let x = RX0; x < RX1; x += 22)
      route.lineStyle(3, 0x9fd6ff, 0.5).lineBetween(x, RY + 24, x + 11, RY + 24);
    [RX0, RX1].forEach((x, i) => {
      route.fillStyle(0x4a5a64, 1).fillTriangle(x - 34, RY + 30, x + 34, RY + 30, x, RY + 56);
      route.fillStyle(i ? 0x6fd3a0 : 0x8fb7cc, 1).fillRect(x - 30, RY + 24, 60, 8);
      route.fillStyle(0xeaf6ff, 1).fillRect(x - 2, RY - 6, 4, 30);
      route
        .fillStyle(i ? 0x75e0ff : 0xffd76a, 1)
        .fillTriangle(x + 2, RY - 6, x + 22, RY, x + 2, RY + 6);
    });
    kit.text((RX0 + RX1) / 2, 156, `${p.dist} km`, 16, GOLD, { weight: "800", depth: 21 });
    const ship = airship(scene, RX0, RY - 6, 0.42, SHIP, 23);
    // Flight-plan card.
    kit.panel(24, 254, 476, 220, { fill: PANEL, alpha: 0.9 });
    kit.text(40, 272, api.t(L("FLIGHT PLAN", "PLAN DE VUELO")), 14, GOLD, { ox: 0, weight: "800" });
    kit.text(
      40,
      300,
      api.t(L(`Burn rate: ${p.rate} L per km`, `Gasto: ${p.rate} L por km`)),
      17,
      INK,
      { ox: 0 },
    );
    kit.text(40, 326, api.t(L(`Distance: ${p.dist} km`, `Distancia: ${p.dist} km`)), 17, INK, {
      ox: 0,
    });
    kit.text(
      40,
      352,
      api.t(L("Fuel = rate × distance", "Combustible = gasto × distancia")),
      15,
      "#9fd6ff",
      { ox: 0 },
    );
    const box = entry(scene, kit, 300, 290, 186, "L");
    const steps = kit.text(40, 380, "", 15, "#ffe9a8", {
      ox: 0,
      oy: 0,
      align: "left",
      wrap: 440,
      depth: 24,
    });
    kit.panel(504, 254, 292, 130, { fill: PANEL, alpha: 0.6 });
    // Tank: fills with the student's fuel on a fixed scale (no target mark).
    const cap = Math.max(5, Math.ceil((num(t) * 2.2) / 5) * 5);
    const TX = 560;
    const TT = 262;
    const TB = 372;
    const tank = scene.add.graphics().setDepth(22);
    kit.text(TX + 90, TT + 8, api.t(L("Fuel tank", "Tanque")), 14, "#9fd6ff", {
      weight: "800",
      ox: 0,
    });
    kit.text(TX + 90, TT + 30, `0 – ${cap} L`, 13, "#8fb7cc", { ox: 0 });
    function drawTank(spill) {
      tank.clear();
      const v = D(ans) ? num(D(ans)) : 0;
      const f = Math.min(1, v / cap);
      tank.fillStyle(0x0c2232, 1).fillRoundedRect(TX, TT, 70, TB - TT, 10);
      tank
        .fillStyle(0xffb547, 0.9)
        .fillRect(TX + 6, TB - 6 - f * (TB - TT - 12), 58, f * (TB - TT - 12));
      tank
        .lineStyle(3, v > cap ? 0xff8a5c : 0x5e92b3, 1)
        .strokeRoundedRect(TX, TT, 70, TB - TT, 10);
      if (spill || v > cap)
        tank.fillStyle(0xffb547, 0.8).fillTriangle(TX + 60, TT, TX + 82, TT - 6, TX + 76, TT + 26);
    }
    function render(state) {
      box.set(ans, state);
      drawTank();
    }
    function type(key) {
      const next = editNumber(ans, key, 3, 4);
      if (next == null) return;
      ans = next;
      api.sfx.tap();
      kit.tween({ targets: ship, x: RX0, y: RY - 6, angle: 0, duration: 200 });
      render();
      api.refresh();
    }
    typeDigits(kit, type);
    pad(scene, kit, type, true, 524, 410);
    render();
    async function fly(frac, sink) {
      api.sfx.hum();
      await new Promise(
        (res) =>
          kit.tween({
            targets: ship,
            x: RX0 + (RX1 - RX0) * frac,
            duration: 300 + 1100 * frac,
            ease: "Sine.easeInOut",
            onComplete: res,
          }) || res(),
      );
      if (sink) {
        kit.tween({ targets: ship, y: RY + 26, angle: 12, duration: 500, ease: "Quad.easeIn" });
        await kit.wait(500);
      }
    }
    const a = D(p.rate);
    const b = D(p.dist);
    return {
      checkLabel: L("Fill & fly", "Cargar y volar"),
      actions: [eraseAction(() => type("Backspace"))],
      status: () => L(`Fuel loaded: ${ans || "—"} L`, `Combustible cargado: ${ans || "—"} L`),
      hints: [
        L(
          "Multiply as if there were no decimal points. Then count the decimal places in both factors. The answer gets that many.",
          "Multiplica como si no hubiera puntos decimales. Luego cuenta los decimales de los dos factores. La respuesta tiene esa cantidad.",
        ),
        L(
          `Find ${a.n} × ${b.n} first. Then ${p.rate} has ${dr} decimal place${dr === 1 ? "" : "s"} and ${p.dist} has ${dd}, so the product needs ${dr + dd}.`,
          `Primero halla ${a.n} × ${b.n}. ${p.rate} tiene ${dr} decimal${dr === 1 ? "" : "es"} y ${p.dist} tiene ${dd}, así que el producto necesita ${dr + dd}.`,
        ),
      ],
      async check() {
        if (!D(ans)) {
          return {
            ok: false,
            incomplete: true,
            feedback: L("Type how many liters to load.", "Escribe cuántos litros cargar."),
          };
        }
        const res = judgeFuel(p, ans);
        const s = D(ans);
        if (res.ok) {
          render("good");
          await fly(1, false);
          kit.burst(RX1, RY, 0x75e0ff, 26);
          return { ok: true };
        }
        render("bad");
        const high = cmp(s, t) > 0;
        if (high) {
          drawTank(true);
          await fly(1, true);
        } else await fly(Math.max(0.06, Math.min(0.92, num(s) / num(t))), true);
        const world = high
          ? L(
              "Too much fuel: the tank spills and the heavy ship sinks below the dock. ",
              "Demasiado combustible: el tanque se derrama y la nave pesada se hunde bajo el muelle. ",
            )
          : L(
              "Not enough fuel: the engine stalls before the post. ",
              "Falta combustible: el motor se apaga antes del puesto. ",
            );
        const why = {
          pointPlace: L(
            "The digits are right, but the decimal point is in the wrong place. Count the decimal places in both factors.",
            "Los dígitos están bien, pero el punto decimal está en otro lugar. Cuenta los decimales de los dos factores.",
          ),
          added: L(
            "You added the rate and the distance. Fuel is rate TIMES distance.",
            "Sumaste el gasto y la distancia. El combustible es el gasto POR la distancia.",
          ),
          biggerProduct: L(
            "One factor is less than 1, so the product must be less than the other factor.",
            "Un factor es menor que 1, así que el producto debe ser menor que el otro factor.",
          ),
          multDec: L(
            "Multiply the digits again, then place the decimal point.",
            "Multiplica los dígitos otra vez y luego coloca el punto decimal.",
          ),
        }[res.tag];
        return {
          ok: false,
          misconception: res.tag,
          feedback: L(world.en + why.en, world.es + why.es),
        };
      },
      async demo() {
        ans = "";
        render();
        const whole = mul({ n: a.n, s: 0 }, { n: b.n, s: 0 });
        const lines = [
          L(`1) ${a.n} × ${b.n} = ${fmt(whole)}`, `1) ${a.n} × ${b.n} = ${fmt(whole)}`),
          L(
            `2) ${dr} + ${dd} = ${dr + dd} decimal places`,
            `2) ${dr} + ${dd} = ${dr + dd} decimales`,
          ),
          L(`3) ${p.rate} × ${p.dist} = ${p.truth}`, `3) ${p.rate} × ${p.dist} = ${p.truth}`),
        ];
        for (let i = 0; i < lines.length; i++) {
          steps.setText(
            lines
              .slice(0, i + 1)
              .map((x) => api.t(x))
              .join("\n"),
          );
          api.sfx.tick(i * 3);
          await kit.wait(900);
        }
        for (const ch of p.truth) {
          ans += ch;
          render();
          await kit.wait(160);
        }
        render("good");
        await fly(1, false);
      },
      explain: () =>
        L(
          `${p.rate} × ${p.dist} = ${p.truth} liters. Multiply the digits, then give the product ${dr + dd} decimal place${dr + dd === 1 ? "" : "s"}.`,
          `${p.rate} × ${p.dist} = ${p.truth} litros. Multiplica los dígitos y dale al producto ${dr + dd} decimal${dr + dd === 1 ? "" : "es"}.`,
        ),
    };
  }

  M.fuel = fuel;
})();
