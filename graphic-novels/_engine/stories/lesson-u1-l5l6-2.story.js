/* STORY · u1-l5l6 · Graphic Novel #2 (Enrichment) · Decimal Docking Bay: Deep Space
   GENERATED from graphic-novels/lessons/manifest.json by
   scripts/generate-lesson-novels.mjs. Do not hand-edit — edit the manifest
   and re-run the generator. Rendered by the shared gn-engine via build.py. */
window.GN_STORY = {
  "meta": {
    "unit": 1,
    "version": 2,
    "level": "Enrichment",
    "title": "Decimal Docking Bay: Deep Space",
    "standard": "6.NOS.3",
    "readingStandard": "RL.6.1",
    "assessment": "Graphic Novel u1-l5l6 #2: Decimal Docking Bay: Deep Space",
    "artBase": "../_art/lessons/u1-l5l6/",
    "home": "../index.html"
  },
  "cast": {
    "stationai": {
      "name": "Station AI",
      "role": "narrator",
      "color": "#3da5ff"
    },
    "cadet": {
      "name": "Cadet",
      "role": "protagonist",
      "color": "#ff8a3d",
      "avatar": null,
      "blurb": "You"
    }
  },
  "cover": {
    "art": "cover.png",
    "alt": "A confident cadet commands a deep-space station with multi-step decimal mission boards",
    "blurbEn": "Command rank, Cadet. These missions chain several decimal operations and ask you to reason about place value, not just compute. Think it through and launch the fleet.",
    "blurbEs": "Rango de mando, Cadete. Estas misiones encadenan operaciones con decimales y piden razonar sobre el valor posicional. Piensa bien y lanza la flota.",
    "startLabel": "Begin Command 🚀"
  },
  "acts": [
    {
      "id": "act1",
      "tab": "Act 1: Supply Manifest",
      "kicker": "Act 1 · Lesson 1-5",
      "title": "The Supply Manifest",
      "advanceLabel": "Confirm the manifest",
      "steps": [
        {
          "type": "beats",
          "art": "act1.png",
          "alt": "A holographic manifest listing several decimal supply masses",
          "beats": [
            {
              "who": "stationai",
              "en": "Commander, three crates: 2.45 kg, 1.8 kg, and 0.75 kg. I need the exact combined mass.",
              "es": "Comandante, tres cajas: 2.45 kg, 1.8 kg y 0.75 kg. Necesito la masa combinada exacta.",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "I'll annex zeros so every value has two decimal places, then add carefully.",
              "es": "Agregaré ceros para que todos tengan dos decimales y luego sumaré con cuidado."
            }
          ]
        },
        {
          "type": "challenge",
          "id": "act1a",
          "ask": {
            "who": "cadet",
            "en": "Add all three crates: 2.45 + 1.8 + 0.75. What is the total mass?",
            "es": "Suma las tres cajas: 2.45 + 1.8 + 0.75. ¿Cuál es la masa total?"
          },
          "choices": [
            {
              "en": "5.00 kg  (2.45 + 1.80 + 0.75)",
              "correct": true
            },
            {
              "en": "4.98 kg",
              "correct": false
            },
            {
              "en": "5.28 kg",
              "correct": false
            }
          ],
          "goodEn": "✅ Exactly! 2.45 + 1.80 + 0.75 = 5.00 kg. Annexing 1.8 → 1.80 kept the places aligned.",
          "goodEs": "¡Exacto! 2.45 + 1.80 + 0.75 = 5.00 kg.",
          "badEn": "❌ Annex a zero (1.80) and add the hundredths column first: 5 + 0 + 5 = 10, carry the tenth.",
          "badEs": "❌ Agrega un cero (1.80) y suma primero las centésimas.",
          "hint": {
            "en": "Annex a zero so 1.8 = 1.80. Then 2.45 + 1.80 + 0.75. Add the hundredths first.",
            "es": ""
          },
          "frame": {
            "en": "Lining up all three, 2.45 + 1.80 + 0.75 = ____ kg.",
            "es": ""
          },
          "solveBeat": {
            "who": "cadet",
            "en": "Manifest confirmed. Now find the difference from our 6 kg limit.",
            "es": "Manifiesto confirmado. Ahora halla la diferencia con el límite de 6 kg."
          }
        },
        {
          "type": "challenge",
          "id": "act1b",
          "ask": {
            "who": "cadet",
            "en": "The cargo limit is 6 kg. With 5.00 kg loaded, how much more mass can you add?",
            "es": "El límite es 6 kg. Con 5.00 kg cargados, ¿cuánta masa más cabe?"
          },
          "choices": [
            {
              "en": "1.00 kg",
              "correct": true
            },
            {
              "en": "0.10 kg",
              "correct": false
            },
            {
              "en": "11 kg",
              "correct": false
            }
          ],
          "goodEn": "✅ Right! 6.00 - 5.00 = 1.00 kg of room remains.",
          "goodEs": "¡Correcto! 6.00 - 5.00 = 1.00 kg de espacio.",
          "badEn": "❌ Subtract 5.00 from 6.00: that leaves 1.00 kg.",
          "badEs": "❌ Resta 5.00 de 6.00: queda 1.00 kg.",
          "hint": {
            "en": "Subtract: 6.00 - 5.00. Annex zeros so both have two decimal places.",
            "es": ""
          },
          "frame": {
            "en": "6.00 - 5.00 = ____ kg of room left.",
            "es": ""
          }
        }
      ]
    },
    {
      "id": "act2",
      "tab": "Act 2: Thruster Calibration",
      "kicker": "Act 2 · Lesson 1-6",
      "title": "Thruster Calibration",
      "advanceLabel": "Calibrate thrusters",
      "steps": [
        {
          "type": "beats",
          "art": "act2.png",
          "alt": "A cadet calibrating thrusters with decimal multiplier dials",
          "beats": [
            {
              "who": "stationai",
              "en": "Each thruster uses 0.25 units of plasma. We are firing 1.2 thruster-seconds. How much plasma?",
              "es": "Cada propulsor usa 0.25 de plasma. Encenderemos 1.2 segundos. ¿Cuánto plasma?",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "Multiply like whole numbers, then count three decimal places total.",
              "es": "Multiplico como enteros y cuento tres lugares decimales en total."
            }
          ]
        },
        {
          "type": "challenge",
          "id": "act2a",
          "ask": {
            "who": "cadet",
            "en": "Compute 1.2 × 0.25 to find the plasma used. What is the product?",
            "es": "Calcula 1.2 × 0.25 para el plasma usado. ¿Cuál es el producto?"
          },
          "choices": [
            {
              "en": "0.3 units  (0.300)",
              "correct": true
            },
            {
              "en": "3.0 units",
              "correct": false
            },
            {
              "en": "0.03 units",
              "correct": false
            }
          ],
          "goodEn": "✅ Yes! 12×25=300; 3 decimal places gives 0.300 = 0.3 units of plasma.",
          "goodEs": "¡Sí! 12×25=300; 3 lugares dan 0.300 = 0.3.",
          "badEn": "❌ 12×25=300. Count places: 1+2=3, so 0.300 = 0.3.",
          "badEs": "❌ 12×25=300. Cuenta lugares: 1+2=3, así que 0.3.",
          "hint": {
            "en": "12 × 25 = 300. Decimal places: 1 (in 1.2) + 2 (in 0.25) = 3, so 0.300 = 0.3.",
            "es": ""
          },
          "frame": {
            "en": "12 × 25 = 300, and with 3 decimal places that is 0.3 units.",
            "es": ""
          },
          "solveBeat": {
            "who": "cadet",
            "en": "Calibrated! Now scale it up for the whole array.",
            "es": "¡Calibrado! Ahora escálalo para todo el arreglo."
          }
        },
        {
          "type": "challenge",
          "id": "act2b",
          "ask": {
            "who": "cadet",
            "en": "The array has 4 thrusters. If one uses 0.3 units, the array uses 4 × 0.3. How much plasma total?",
            "es": "El arreglo tiene 4 propulsores. Si uno usa 0.3, el arreglo usa 4 × 0.3. ¿Cuánto total?"
          },
          "choices": [
            {
              "en": "1.2 units",
              "correct": true
            },
            {
              "en": "0.12 units",
              "correct": false
            },
            {
              "en": "12 units",
              "correct": false
            }
          ],
          "goodEn": "✅ Correct! 4 × 0.3 = 1.2 units. Array calibrated!",
          "goodEs": "¡Correcto! 4 × 0.3 = 1.2 unidades.",
          "badEn": "❌ 4 × 3 = 12, with 1 decimal place that is 1.2.",
          "badEs": "❌ 4 × 3 = 12, con 1 lugar decimal es 1.2.",
          "hint": {
            "en": "4 × 3 = 12, and 0.3 has 1 decimal place, so the product has 1 decimal place: 1.2.",
            "es": ""
          },
          "frame": {
            "en": "4 × 0.3 = ____ units of plasma for the whole array.",
            "es": ""
          }
        }
      ]
    },
    {
      "id": "final",
      "tab": "Final: Fleet Launch",
      "kicker": "Final · Lessons 1-5 & 1-6",
      "title": "The Fleet Launch Code",
      "advanceLabel": "Launch the fleet! 🌟",
      "steps": [
        {
          "type": "beats",
          "art": "final.png",
          "alt": "A commander entering a multi-step decimal launch code for a fleet",
          "beats": [
            {
              "who": "stationai",
              "en": "Final code, Commander: it chains a sum and a product. Reason carefully.",
              "es": "Código final, Comandante: encadena una suma y un producto. Razona con cuidado.",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "Add 3.25 + 0.75 first, then multiply that sum by 0.5.",
              "es": "Sumo 3.25 + 0.75 primero, luego multiplico por 0.5."
            }
          ]
        },
        {
          "type": "challenge",
          "id": "F",
          "ask": {
            "who": "cadet",
            "en": "Compute (3.25 + 0.75) × 0.5. Which line is fully correct?",
            "es": "Calcula (3.25 + 0.75) × 0.5. ¿Cuál línea es correcta?"
          },
          "choices": [
            {
              "en": "3.25 + 0.75 = 4.00, then 4.00 × 0.5 = 2.0",
              "correct": true
            },
            {
              "en": "3.25 + 0.75 = 4.00, then 4.00 × 0.5 = 20",
              "correct": false
            },
            {
              "en": "3.25 + 0.75 = 3.90, then 3.90 × 0.5 = 1.95",
              "correct": false
            }
          ],
          "goodEn": "✅ FLEET CODE ACCEPTED! 4.00 × 0.5 = 2.0 — exactly half of 4. The fleet launches!",
          "goodEs": "¡CÓDIGO ACEPTADO! 4.00 × 0.5 = 2.0. ¡La flota despega!",
          "badEn": "❌ Add first: 3.25 + 0.75 = 4.00. Then × 0.5 is HALF of 4, which is 2.0 — not 20.",
          "badEs": "❌ Suma primero: 3.25 + 0.75 = 4.00. Luego × 0.5 es la MITAD de 4, o sea 2.0.",
          "hint": {
            "en": "3.25 + 0.75 = 4.00. Then 4.00 × 0.5 = 2.0 (half of 4).",
            "es": ""
          },
          "frame": {
            "en": "3.25 + 0.75 = ____, and that sum × 0.5 = ____.",
            "es": ""
          }
        }
      ]
    }
  ],
  "glossary": [
    {
      "ico": "📘",
      "en": "Decimal",
      "es": "Decimal",
      "def": "A number with a dot that shows a part between whole numbers."
    },
    {
      "ico": "📘",
      "en": "Place value",
      "es": "Valor posicional",
      "def": "What a digit is worth based on where it sits in a number."
    },
    {
      "ico": "📘",
      "en": "Tenths",
      "es": "Décimas",
      "def": "The first spot after the decimal point. It shows parts out of 10."
    },
    {
      "ico": "📘",
      "en": "Hundredths",
      "es": "Centésimas",
      "def": "The second spot after the decimal point. It shows parts out of 100."
    },
    {
      "ico": "📘",
      "en": "Annex zeros",
      "es": "Agregar ceros",
      "def": "Adding zeros at the end of a decimal so numbers line up evenly."
    },
    {
      "ico": "📘",
      "en": "Product",
      "es": "Producto",
      "def": "The answer when you multiply."
    },
    {
      "ico": "📘",
      "en": "Decimal point",
      "es": "Punto decimal",
      "def": "The dot that splits the whole number from the part after it."
    },
    {
      "ico": "📘",
      "en": "Estimate",
      "es": "Estimar",
      "def": "A close answer you get by rounding first."
    },
    {
      "ico": "📘",
      "en": "Decimal places",
      "es": "Cifras decimales",
      "def": "How many digits come after the decimal point."
    }
  ],
  "complete": {
    "art": "complete.png",
    "alt": "A proud commander salutes as a fleet of ships launches into deep space",
    "badge": "🎉⭐",
    "titleEn": "Fleet Launched!",
    "en": "You chained decimal addition, subtraction, and multiplication across the whole mission. Command rank earned, Commander!",
    "es": "¡Encadenaste sumas, restas y multiplicaciones con decimales en toda la misión! Rango de mando ganado.",
    "master": {
      "headingEn": "Master Rank Challenge — for mastery, not required.",
      "promptEn": "Command challenge: (1.5 + 2.5) × 0.25. What is the result?",
      "promptEs": "Reto de mando: (1.5 + 2.5) × 0.25. ¿Cuál es el resultado?",
      "choices": [
        {
          "en": "1  (4 × 0.25 = 1.00)",
          "correct": true
        },
        {
          "en": "10",
          "correct": false
        },
        {
          "en": "0.4",
          "correct": false
        }
      ],
      "goodEn": "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      "badEn": "❌ Not quite. Review your work and try another option.",
      "certifyTitle": "🏆 Master Certified!"
    }
  }
};
