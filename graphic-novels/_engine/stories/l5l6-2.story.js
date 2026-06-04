/* STORY · Unit 1 · Lessons 1-5 & 1-6 · Graphic Novel #2 (Enrichment) · Decimal Docking Bay: Deep Space
   Comic-engine port of graphic-novels/lessons/u1-l5l6/graphic-novel-2.html.
   Act 1 (Supply Manifest · add three decimals & remaining capacity),
   Act 2 (Thruster Calibration · multiply decimals & scale the array),
   Final (Fleet Launch · multi-step add then multiply), Glossary,
   Mission Complete + Master-Rank challenge.
   All math, answers, distractors, Spanish, hints, sentence frames, and glossary
   are carried verbatim from the source HTML. New: panels, speech, AXIS voices the
   decimal-misplacement misconception, vocab pop-ups.
   NOTE: source HTML carried no `standard:` and no NTResults.finish(...) assessment
   string; meta.standard uses the unit decimal-operations standard and
   meta.assessment follows the reference naming pattern (see report FLAGS). */
window.GN_STORY = {
  meta: {
    unit: 1,
    version: 2,
    level: "Enrichment",
    title: "Decimal Docking Bay: Deep Space",
    standard: "6.NS.3",
    readingStandard: "RL.6.1",
    assessment: "Graphic Novel U1 #2: Decimal Docking Bay: Deep Space",
    artBase: "../../_art/unit1/",
    home: "../../index.html",
  },

  cast: {
    cadet: {
      name: "Cadet",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🧑‍🚀",
      avatar: null,
      blurb: "You",
    },
    axis: {
      name: "AXIS",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🤖",
      avatar: null,
      blurb: "Station AI · misplaces the decimal point",
    },
    log: { name: "Station AI", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A confident cadet commands a deep-space station with multi-step decimal mission boards",
    blurbEn:
      "Command rank, Cadet. These missions chain several decimal operations and ask you to reason about place value, not just compute. AXIS keeps misplacing the decimal point — think it through, catch its mistakes, and launch the fleet.",
    blurbEs:
      "Rango de mando, Cadete. Estas misiones encadenan operaciones con decimales y piden razonar sobre el valor posicional. Piensa bien y lanza la flota.",
    startLabel: "Begin Command 🚀 ▶",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Supply Manifest",
      kicker: "Act 1 · Lesson 1-5",
      title: "The Supply Manifest",
      advanceLabel: "Confirm the manifest ▶",
      steps: [
        {
          type: "beats",
          art: "twin-engines.png",
          alt: "A holographic manifest listing several decimal supply masses",
          lastLabel: "Add the crates ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Commander, three crates: 2.45 kg, 1.8 kg, and 0.75 kg. I need the exact combined mass.",
              es: "Comandante, tres cajas: 2.45 kg, 1.8 kg y 0.75 kg. Necesito la masa combinada exacta.",
            },
            {
              who: "cadet",
              en: "I'll annex zeros so every value has two decimal places, then add carefully.",
              es: "Agregaré ceros para que todos tengan dos decimales y luego sumaré con cuidado.",
              vocab: [
                {
                  term: "decimal places",
                  en: "How many digits come after the decimal point.",
                  es: "Cuántos dígitos vienen después del punto decimal.",
                },
                {
                  term: "annex zeros",
                  en: "Adding zeros at the end of a decimal so numbers line up evenly.",
                  es: "Agregar ceros al final de un decimal para que se alineen.",
                },
              ],
            },
            {
              who: "log",
              caption: true,
              en: "Be exact, Commander. The cargo hold is rated for only 6 kg — an overcount could leave a crate behind on the dock.",
              es: "Sé exacta, Comandante. La bodega solo soporta 6 kg; un cálculo de más podría dejar una caja en el muelle.",
            },
            {
              who: "axis",
              misconception: true,
              en: "I'll line up the digits without padding: 2.45 + 1.8 + 0.75 → I get 5.28 kg!",
              es: "Alineo los dígitos sin rellenar: 2.45 + 1.8 + 0.75 → ¡me da 5.28 kg!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "axis",
            en: "📦 Manifest Lock #1 — add all three crates: 2.45 + 1.8 + 0.75. What is the total mass?",
            es: "Suma las tres cajas: 2.45 + 1.8 + 0.75. ¿Cuál es la masa total?",
          },
          hint: {
            en: "Annex a zero so 1.8 = 1.80. Then 2.45 + 1.80 + 0.75. Add the hundredths first.",
            es: "Agrega un cero para que 1.8 = 1.80. Luego 2.45 + 1.80 + 0.75. Suma primero las centésimas.",
          },
          frame: {
            en: "“Lining up all three, 2.45 + 1.80 + 0.75 = ____ kg.”",
            es: "“Alineando las tres, 2.45 + 1.80 + 0.75 = ____ kg.”",
          },
          choices: [
            {
              en: "5.00 kg  (2.45 + 1.80 + 0.75)",
              es: "5.00 kg (2.45 + 1.80 + 0.75)",
              correct: true,
            },
            {
              en: "4.98 kg",
              es: "4.98 kg",
              correct: false,
            },
            {
              en: "5.28 kg",
              es: "5.28 kg",
              correct: false,
            },
          ],
          goodEn:
            "✅ Exactly! 2.45 + 1.80 + 0.75 = 5.00 kg. Annexing 1.8 → 1.80 kept the places aligned.",
          goodEs: "¡Exacto! 2.45 + 1.80 + 0.75 = 5.00 kg.",
          badEn:
            "❌ Annex a zero (1.80) and add the hundredths column first: 5 + 0 + 5 = 10, carry the tenth.",
          badEs: "❌ Agrega un cero (1.80) y suma primero las centésimas.",
          solveBeat: {
            who: "cadet",
            en: "Manifest confirmed. Now find the difference from our 6 kg limit.",
            es: "Manifiesto confirmado. Ahora halla la diferencia con el límite de 6 kg.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "cadet",
            en: "📦 Manifest Lock #2 — the cargo limit is 6 kg. With 5.00 kg loaded, how much more mass can you add?",
            es: "El límite es 6 kg. Con 5.00 kg cargados, ¿cuánta masa más cabe?",
          },
          hint: {
            en: "Subtract: 6.00 - 5.00. Annex zeros so both have two decimal places.",
            es: "Resta: 6.00 - 5.00. Agrega ceros para que ambos tengan dos decimales.",
          },
          frame: {
            en: "“6.00 - 5.00 = ____ kg of room left.”",
            es: "“6.00 - 5.00 = ____ kg de espacio libre.”",
          },
          choices: [
            {
              en: "1.00 kg",
              es: "1.00 kg",
              correct: true,
            },
            {
              en: "0.10 kg",
              es: "0.10 kg",
              correct: false,
            },
            {
              en: "11 kg",
              es: "11 kg",
              correct: false,
            },
          ],
          goodEn: "✅ Right! 6.00 - 5.00 = 1.00 kg of room remains.",
          goodEs: "¡Correcto! 6.00 - 5.00 = 1.00 kg de espacio.",
          badEn: "❌ Subtract 5.00 from 6.00: that leaves 1.00 kg.",
          badEs: "❌ Resta 5.00 de 6.00: queda 1.00 kg.",
          solveBeat: {
            who: "cadet",
            en: "Manifest signed off with capacity to spare. On to the thrusters.",
            es: "Manifiesto firmado con capacidad de sobra. Sigamos con los propulsores.",
          },
        },
        {
          type: "comprehension",
          id: "c1",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.beat2",
          ask: {
            who: "log",
            en: "The Cadet says she will <b>annex zeros</b> so every value has two decimal places. In this story, to <b>annex zeros</b> means to —",
            es: "La cadete dice que va a <b>agregar ceros</b> para que cada valor tenga dos decimales. En la historia, <b>agregar ceros</b> significa —",
          },
          choices: [
            {
              en: "add zeros at the end of a decimal so the place values line up evenly.",
              es: "agregar ceros al final de un decimal para que los valores posicionales se alineen.",
              correct: true,
            },
            {
              en: "remove the decimal point and treat the numbers as whole numbers.",
              es: "quitar el punto decimal y tratar los números como enteros.",
              correct: false,
            },
            {
              en: "multiply each value by ten to make it larger.",
              es: "multiplicar cada valor por diez para hacerlo más grande.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Exactly — annexing zeros adds them at the end so every value lines up to the same place value, without changing its size.",
          goodEs:
            "✅ Exacto: agregar ceros los pone al final para alinear los lugares sin cambiar el valor.",
          badEn:
            "❌ Annexing a zero does not change a number's value — it just adds a place so the decimals line up.",
          badEs:
            "❌ Agregar un cero no cambia el valor; solo añade un lugar para alinear los decimales.",
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "cite_evidence",
          standard: "RL.6.1",
          dok: 3,
          interaction: "evidence",
          passageRef: "act1.beat1",
          ask: {
            who: "log",
            en: "Claim: <b>an exact total matters because the hold has a strict limit.</b> Tap the line that best proves this claim.",
            es: "Afirmación: <b>el total exacto importa porque la bodega tiene un límite estricto.</b> Toca la línea que mejor lo prueba.",
          },
          choices: [
            {
              en: "“The cargo hold is rated for only 6 kg — an overcount could leave a crate behind on the dock.”",
              es: "“La bodega solo soporta 6 kg; un cálculo de más podría dejar una caja en el muelle.”",
              correct: true,
            },
            {
              en: "“I'll annex zeros so every value has two decimal places.”",
              es: "“Agregaré ceros para que todos tengan dos decimales.”",
              correct: false,
            },
            {
              en: "“Manifest confirmed. Now find the difference from our 6 kg limit.”",
              es: "“Manifiesto confirmado. Ahora halla la diferencia con el límite de 6 kg.”",
              correct: false,
            },
          ],
          goodEn:
            "✅ Strong evidence — that line names the strict 6 kg limit and the cost of an overcount.",
          goodEs:
            "✅ Buena prueba: esa línea nombra el límite de 6 kg y el costo de pasarse.",
          badEn:
            "❌ That line describes a method or a next step, not why the exact total matters. Find the line about the strict limit.",
          badEs:
            "❌ Esa línea describe un método o un paso, no por qué importa el total exacto.",
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Thruster Calibration",
      kicker: "Act 2 · Lesson 1-6",
      title: "Thruster Calibration",
      advanceLabel: "Calibrate thrusters ▶",
      steps: [
        {
          type: "beats",
          art: "factor-tree.png",
          alt: "A cadet calibrating thrusters with decimal multiplier dials",
          lastLabel: "Calibrate ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Each thruster uses 0.25 units of plasma. We are firing 1.2 thruster-seconds. How much plasma?",
              es: "Cada propulsor usa 0.25 de plasma. Encenderemos 1.2 segundos. ¿Cuánto plasma?",
            },
            {
              who: "cadet",
              en: "Multiply like whole numbers, then count three decimal places total.",
              es: "Multiplico como enteros y cuento tres lugares decimales en total.",
              vocab: [
                {
                  term: "decimal places",
                  en: "How many digits come after the decimal point.",
                  es: "Cuántos dígitos vienen después del punto decimal.",
                },
              ],
            },
            {
              who: "log",
              caption: true,
              en: "Calibrate precisely. Too much plasma and the thrusters overheat; too little and the ship cannot break orbit.",
              es: "Calibra con precisión. Con demasiado plasma los propulsores se sobrecalientan; con muy poco, la nave no sale de órbita.",
            },
            {
              who: "axis",
              misconception: true,
              en: "12 × 25 = 300, so 1.2 × 0.25 = 3.0 units! Calibrating to 3.0.",
              es: "12 × 25 = 300, ¡así que 1.2 × 0.25 = 3.0 unidades! Calibro a 3.0.",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "axis",
            en: "🔥 Thruster Lock #1 — compute 1.2 × 0.25 to find the plasma used. What is the product?",
            es: "Calcula 1.2 × 0.25 para el plasma usado. ¿Cuál es el producto?",
          },
          hint: {
            en: "12 × 25 = 300. Decimal places: 1 (in 1.2) + 2 (in 0.25) = 3, so 0.300 = 0.3.",
            es: "12 × 25 = 300. Lugares decimales: 1 (en 1.2) + 2 (en 0.25) = 3, así que 0.300 = 0.3.",
          },
          frame: {
            en: "“12 × 25 = 300, and with 3 decimal places that is 0.3 units.”",
            es: "“12 × 25 = 300, y con 3 lugares decimales eso es 0.3 unidades.”",
          },
          choices: [
            {
              en: "0.3 units  (0.300)",
              es: "0.3 unidades (0.300)",
              correct: true,
            },
            {
              en: "3.0 units",
              es: "3.0 unidades",
              correct: false,
            },
            {
              en: "0.03 units",
              es: "0.03 unidades",
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! 12×25=300; 3 decimal places gives 0.300 = 0.3 units of plasma.",
          goodEs: "¡Sí! 12×25=300; 3 lugares dan 0.300 = 0.3.",
          badEn: "❌ 12×25=300. Count places: 1+2=3, so 0.300 = 0.3.",
          badEs: "❌ 12×25=300. Cuenta lugares: 1+2=3, así que 0.3.",
          solveBeat: {
            who: "cadet",
            en: "Calibrated! Now scale it up for the whole array.",
            es: "¡Calibrado! Ahora escálalo para todo el arreglo.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "cadet",
            en: "🔥 Thruster Lock #2 — the array has 4 thrusters. If one uses 0.3 units, the array uses 4 × 0.3. How much plasma total?",
            es: "El arreglo tiene 4 propulsores. Si uno usa 0.3, el arreglo usa 4 × 0.3. ¿Cuánto total?",
          },
          hint: {
            en: "4 × 3 = 12, and 0.3 has 1 decimal place, so the product has 1 decimal place: 1.2.",
            es: "4 × 3 = 12, y 0.3 tiene 1 lugar decimal, así que el producto tiene 1 lugar decimal: 1.2.",
          },
          frame: {
            en: "“4 × 0.3 = ____ units of plasma for the whole array.”",
            es: "“4 × 0.3 = ____ unidades de plasma para todo el arreglo.”",
          },
          choices: [
            {
              en: "1.2 units",
              es: "1.2 unidades",
              correct: true,
            },
            {
              en: "0.12 units",
              es: "0.12 unidades",
              correct: false,
            },
            {
              en: "12 units",
              es: "12 unidades",
              correct: false,
            },
          ],
          goodEn: "✅ Correct! 4 × 0.3 = 1.2 units. Array calibrated!",
          goodEs: "¡Correcto! 4 × 0.3 = 1.2 unidades.",
          badEn: "❌ 4 × 3 = 12, with 1 decimal place that is 1.2.",
          badEs: "❌ 4 × 3 = 12, con 1 lugar decimal es 1.2.",
          solveBeat: {
            who: "cadet",
            en: "Whole array calibrated and balanced. Time for the fleet launch code.",
            es: "Todo el arreglo calibrado y equilibrado. Hora del código de lanzamiento de la flota.",
          },
        },
        {
          type: "comprehension",
          id: "c3",
          skill: "main_idea",
          standard: "RI.6.2",
          dok: 2,
          interaction: "mc",
          passageRef: "act2",
          ask: {
            who: "log",
            en: "What is this chapter mainly about?",
            es: "¿De qué trata principalmente este capítulo?",
          },
          choices: [
            {
              en: "Multiplying decimals to calibrate one thruster, then scaling that result up to the whole array.",
              es: "Multiplicar decimales para calibrar un propulsor y luego escalar ese resultado a todo el arreglo.",
              correct: true,
            },
            {
              en: "Adding three crate masses to confirm the cargo manifest.",
              es: "Sumar la masa de tres cajas para confirmar el manifiesto.",
              correct: false,
            },
            {
              en: "Subtracting to find how much room is left under the cargo limit.",
              es: "Restar para hallar cuánto espacio queda bajo el límite.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Right — the chapter calibrates one thruster with decimal multiplication, then scales it to the array.",
          goodEs:
            "✅ Correcto: el capítulo calibra un propulsor y luego escala al arreglo.",
          badEn:
            "❌ That belongs to the manifest chapter. This one is about multiplying decimals to calibrate the thrusters.",
          badEs:
            "❌ Eso es del capítulo del manifiesto. Este trata de calibrar los propulsores.",
        },
        {
          type: "comprehension",
          id: "c4",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 1,
          interaction: "mc",
          passageRef: "act2.beat1",
          ask: {
            who: "log",
            en: "How much plasma does each single thruster use?",
            es: "¿Cuánto plasma usa cada propulsor por sí solo?",
          },
          choices: [
            {
              en: "0.25 units of plasma.",
              es: "0.25 unidades de plasma.",
              correct: true,
            },
            {
              en: "1.2 units of plasma.",
              es: "1.2 unidades de plasma.",
              correct: false,
            },
            {
              en: "4 units of plasma.",
              es: "4 unidades de plasma.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Correct — the log states each thruster uses 0.25 units of plasma.",
          goodEs:
            "✅ Correcto: el registro dice que cada propulsor usa 0.25 unidades.",
          badEn:
            "❌ Reread the opening: each thruster uses 0.25 units. The other numbers are firing time or thruster count.",
          badEs: "❌ Relee el inicio: cada propulsor usa 0.25 unidades.",
        },
        {
          type: "comprehension",
          id: "c5",
          skill: "sequence",
          standard: "RI.6.3",
          dok: 2,
          interaction: "sequence",
          passageRef: "act2",
          ask: {
            who: "log",
            en: "Order the steps the Cadet followed to calibrate the whole thruster array.",
            es: "Ordena los pasos que siguió la cadete para calibrar todo el arreglo de propulsores.",
          },
          items: [
            {
              en: "Multiply 1.2 × 0.25 to find the plasma one thruster uses.",
              es: "Multiplica 1.2 × 0.25 para el plasma de un propulsor.",
              order: 1,
            },
            {
              en: "Place the decimal point by counting the total decimal places.",
              es: "Coloca el punto contando el total de lugares decimales.",
              order: 2,
            },
            {
              en: "Multiply that result by 4 thrusters to scale up the array.",
              es: "Multiplica ese resultado por 4 propulsores para escalar el arreglo.",
              order: 3,
            },
          ],
          goodEn:
            "✅ Find one thruster's plasma, place the point, then scale by 4 — that's how the array was calibrated.",
          goodEs:
            "✅ Halla el plasma de uno, coloca el punto y escala por 4: así se calibró el arreglo.",
          badEn:
            "❌ Not quite. Calibrate one thruster first (including placing the point), and only then scale up to all four.",
          badEs:
            "❌ Casi. Calibra un propulsor primero y luego escala a los cuatro.",
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final: Fleet Launch",
      kicker: "Final · Lessons 1-5 & 1-6",
      title: "The Fleet Launch Code",
      advanceLabel: "Launch the fleet! 🌟 ▶",
      steps: [
        {
          type: "beats",
          art: "boss-door.png",
          alt: "A commander entering a multi-step decimal launch code for a fleet",
          lastLabel: "Enter the code ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Final code, Commander: it chains a sum and a product. Reason carefully.",
              es: "Código final, Comandante: encadena una suma y un producto. Razona con cuidado.",
            },
            {
              who: "cadet",
              en: "Add 3.25 + 0.75 first, then multiply that sum by 0.5.",
              es: "Sumo 3.25 + 0.75 primero, luego multiplico por 0.5.",
            },
            {
              who: "log",
              caption: true,
              en: "The whole fleet waits on this single code, Commander. Every ship launches together — or not at all.",
              es: "Toda la flota espera este único código, Comandante. Cada nave despega junta, o ninguna lo hace.",
            },
            {
              who: "axis",
              misconception: true,
              en: "I'll start: 3.25 + 0.75 = 4.00, then 4.00 × 0.5 = 20! Entering 20.",
              es: "Yo empiezo: 3.25 + 0.75 = 4.00, luego 4.00 × 0.5 = 20. ¡Ingreso 20!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "cadet",
            en: "🔒 Fleet Code — add first, then multiply. What is (3.25 + 0.75) × 0.5?",
            es: "Suma primero, luego multiplica. ¿Cuánto es (3.25 + 0.75) × 0.5?",
          },
          hint: {
            en: "3.25 + 0.75 = 4.00. Then 4.00 × 0.5 = 2.0 (half of 4).",
            es: "3.25 + 0.75 = 4.00. Luego 4.00 × 0.5 = 2.0 (la mitad de 4).",
          },
          frame: {
            en: "“3.25 + 0.75 = ____, and that sum × 0.5 = ____.”",
            es: "“3.25 + 0.75 = ____, y esa suma × 0.5 = ____.”",
          },
          choices: [
            {
              en: "3.25 + 0.75 = 4.00, then 4.00 × 0.5 = 2.0",
              es: "3.25 + 0.75 = 4.00, luego 4.00 × 0.5 = 2.0",
              correct: true,
            },
            {
              en: "3.25 + 0.75 = 4.00, then 4.00 × 0.5 = 20",
              es: "3.25 + 0.75 = 4.00, luego 4.00 × 0.5 = 20",
              correct: false,
            },
            {
              en: "3.25 + 0.75 = 3.90, then 3.90 × 0.5 = 1.95",
              es: "3.25 + 0.75 = 3.90, luego 3.90 × 0.5 = 1.95",
              correct: false,
            },
          ],
          goodEn:
            "✅ FLEET CODE ACCEPTED! 4.00 × 0.5 = 2.0 — exactly half of 4. The fleet launches!",
          goodEs: "¡CÓDIGO ACEPTADO! 4.00 × 0.5 = 2.0. ¡La flota despega!",
          badEn:
            "❌ Add first: 3.25 + 0.75 = 4.00. Then × 0.5 is HALF of 4, which is 2.0 — not 20.",
          badEs:
            "❌ Suma primero: 3.25 + 0.75 = 4.00. Luego × 0.5 es la MITAD de 4, o sea 2.0.",
          solveBeat: {
            who: "cadet",
            en: "Fleet launch code accepted — every ship is away! Command rank earned.",
            es: "¡Código de la flota aceptado, todas las naves despegan! Rango de mando ganado.",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 3,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "Across the mission AXIS lands on 5.28, 3.0, and 20 instead of the right answers. What can you infer about AXIS's mistakes?",
            es: "Durante la misión AXIS llega a 5.28, 3.0 y 20 en vez de las respuestas correctas. ¿Qué puedes inferir sobre sus errores?",
          },
          hint: {
            en: "Look at where each wrong answer's decimal point sits compared to the correct one.",
            es: "Mira dónde queda el punto decimal de cada respuesta equivocada frente a la correcta.",
          },
          choices: [
            {
              en: "AXIS handles the digits but keeps misplacing the decimal point or skipping place-value alignment.",
              es: "AXIS maneja los dígitos pero coloca mal el punto decimal u omite alinear el valor posicional.",
              correct: true,
            },
            {
              en: "AXIS cannot do arithmetic with whole numbers at all.",
              es: "AXIS no puede hacer aritmética con números enteros para nada.",
              correct: false,
            },
            {
              en: "AXIS is reporting numbers from a different mission by accident.",
              es: "AXIS reporta números de otra misión por accidente.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Sound inference — AXIS's digits are right, but the decimal point keeps landing in the wrong place.",
          goodEs:
            "✅ Buena inferencia: los dígitos de AXIS están bien, pero el punto queda mal colocado.",
          badEn:
            "❌ Look again — AXIS computes the digits correctly. The pattern is a misplaced decimal point.",
          badEs:
            "❌ Mira otra vez: AXIS calcula bien los dígitos. El patrón es un punto decimal mal colocado.",
        },
        {
          type: "comprehension",
          id: "c7",
          skill: "prediction",
          standard: "RL.6.3",
          dok: 2,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "The fleet has launched successfully. On the next mission, what will the Cadet most likely keep doing?",
            es: "La flota despegó con éxito. En la próxima misión, ¿qué seguirá haciendo la cadete probablemente?",
          },
          choices: [
            {
              en: "Carefully line up and place the decimal point before trusting any total.",
              es: "Alinear y colocar el punto decimal con cuidado antes de confiar en un total.",
              correct: true,
            },
            {
              en: "Let AXIS enter the codes alone without checking them.",
              es: "Dejar que AXIS ingrese los códigos solo sin revisarlos.",
              correct: false,
            },
            {
              en: "Stop using decimals and only work with whole numbers.",
              es: "Dejar de usar decimales y trabajar solo con enteros.",
              correct: false,
            },
          ],
          goodEn:
            "✅ Most likely — the Cadet's success came from careful decimal-point placement, so she'll keep doing it.",
          goodEs:
            "✅ Lo más probable: su éxito vino de colocar bien el punto, así que lo seguirá haciendo.",
          badEn:
            "❌ The Cadet succeeded by checking the decimal point, not by skipping it. She'll keep that habit.",
          badEs:
            "❌ La cadete tuvo éxito revisando el punto, no omitiéndolo. Mantendrá ese hábito.",
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "📖",
      en: "Decimal",
      es: "Decimal",
      def: "A number with a dot that shows a part between whole numbers.",
    },
    {
      ico: "📖",
      en: "Place value",
      es: "Valor posicional",
      def: "What a digit is worth based on where it sits in a number.",
    },
    {
      ico: "📖",
      en: "Tenths",
      es: "Décimas",
      def: "The first spot after the decimal point. It shows parts out of 10.",
    },
    {
      ico: "📖",
      en: "Hundredths",
      es: "Centésimas",
      def: "The second spot after the decimal point. It shows parts out of 100.",
    },
    {
      ico: "📖",
      en: "Annex zeros",
      es: "Agregar ceros",
      def: "Adding zeros at the end of a decimal so numbers line up evenly.",
    },
    {
      ico: "📖",
      en: "Product",
      es: "Producto",
      def: "The answer when you multiply.",
    },
    {
      ico: "📖",
      en: "Decimal point",
      es: "Punto decimal",
      def: "The dot that splits the whole number from the part after it.",
    },
    {
      ico: "📖",
      en: "Estimate",
      es: "Estimar",
      def: "A close answer you get by rounding first.",
    },
    {
      ico: "📖",
      en: "Decimal places",
      es: "Cifras decimales",
      def: "How many digits come after the decimal point.",
    },
  ],

  complete: {
    art: "mission-complete.png",
    alt: "A proud commander salutes as a fleet of ships launches into deep space",
    badge: "🎉⭐",
    titleEn: "Fleet Launched!",
    en: "You chained decimal addition, subtraction, and multiplication across the whole mission. Command rank earned, Commander!",
    es: "¡Encadenaste sumas, restas y multiplicaciones con decimales en toda la misión! Rango de mando ganado.",
    master: {
      headingEn: "Bonus challenge — for mastery, not required.",
      promptEn: "Command challenge: (1.5 + 2.5) × 0.25. What is the result?",
      promptEs: "Reto de mando: (1.5 + 2.5) × 0.25. ¿Cuál es el resultado?",
      choices: [
        {
          en: "1  (4 × 0.25 = 1.00)",
          correct: true,
        },
        { en: "10", correct: false },
        { en: "0.4", correct: false },
      ],
      goodEn:
        "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      badEn: "❌ Not quite. Review your work and try another option.",
      certifyTitle: "🏆 Master Certified: Fleet Launched!",
    },
  },
};
