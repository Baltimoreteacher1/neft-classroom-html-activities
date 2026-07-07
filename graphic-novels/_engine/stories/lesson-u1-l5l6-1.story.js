/* STORY · u1-l5l6 · Graphic Novel #1 (Support) · Decimal Docking Bay
   GENERATED from graphic-novels/lessons/manifest.json by
   scripts/generate-lesson-novels.mjs. Do not hand-edit — edit the manifest
   and re-run the generator. Rendered by the shared gn-engine via build.py. */
window.GN_STORY = {
  "meta": {
    "unit": 1,
    "version": 1,
    "level": "Support",
    "title": "Decimal Docking Bay",
    "standard": "6.NOS.3",
    "readingStandard": "RL.6.1",
    "assessment": "Graphic Novel u1-l5l6 #1: Decimal Docking Bay",
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
    "alt": "A space cadet stands at a glowing docking-bay console covered in decimal fuel readouts",
    "blurbEn": "The station's fuel computer is glitching! Only correct decimal math can dock the supply ship. Line up those decimal points and save the crew, Cadet.",
    "blurbEs": "¡La computadora de combustible falla! Solo las matematicas con decimales pueden acoplar la nave. Alinea los puntos decimales y salva a la tripulacion.",
    "startLabel": "Start Mission 🚀"
  },
  "acts": [
    {
      "id": "act1",
      "tab": "Act 1: Fuel Totals",
      "kicker": "Act 1 · Lesson 1-5",
      "title": "Fuel Totals",
      "advanceLabel": "Lock in the total",
      "steps": [
        {
          "type": "beats",
          "art": "act1.png",
          "alt": "Two fuel tanks with decimal gauges glowing on the bridge",
          "beats": [
            {
              "who": "stationai",
              "en": "Cadet! Tank A holds 3.4 liters, Tank B holds 2.75 liters. I need the TOTAL fuel to dock.",
              "es": "¡Cadete! El tanque A tiene 3.4 litros y el B tiene 2.75. Necesito el TOTAL para acoplar.",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "To add decimals I line up the decimal points first. I can annex a zero so 3.4 becomes 3.40.",
              "es": "Para sumar decimales alineo los puntos primero. Puedo agregar un cero: 3.4 es 3.40."
            }
          ]
        },
        {
          "type": "challenge",
          "id": "act1a",
          "ask": {
            "who": "cadet",
            "en": "Add the two tanks: 3.4 + 2.75. Line up the decimal points. What is the total?",
            "es": "Suma los dos tanques: 3.4 + 2.75. Alinea los puntos. ¿Cuál es el total?"
          },
          "choices": [
            {
              "en": "6.15 liters  (3.40 + 2.75)",
              "correct": true
            },
            {
              "en": "5.79 liters",
              "correct": false
            },
            {
              "en": "6.9 liters  (added without lining up)",
              "correct": false
            }
          ],
          "goodEn": "✅ Correct! 3.40 + 2.75 = 6.15 liters. Lining up the points keeps each place value matched.",
          "goodEs": "¡Correcto! 3.40 + 2.75 = 6.15 litros.",
          "badEn": "❌ Check your places. Annex a zero (3.40) and line up the decimal points, then add.",
          "badEs": "❌ Revisa los valores posicionales. Agrega un cero (3.40) y alinea los puntos.",
          "hint": {
            "en": "Annex a zero so both have 2 places: 3.40 + 2.75. Add hundredths, tenths, then ones.",
            "es": ""
          },
          "frame": {
            "en": "I lined up the decimal points and added to get ____ liters.",
            "es": ""
          },
          "solveBeat": {
            "who": "cadet",
            "en": "Total locked in! Now a leak — I must subtract what we lost.",
            "es": "¡Total listo! Ahora hay una fuga: debo restar lo que perdimos."
          }
        },
        {
          "type": "challenge",
          "id": "act1b",
          "ask": {
            "who": "cadet",
            "en": "A leak drains fuel. Start with 8.5 liters and subtract 3.27 liters. How much is left?",
            "es": "Una fuga drena combustible. De 8.5 litros resta 3.27. ¿Cuánto queda?"
          },
          "choices": [
            {
              "en": "5.23 liters  (8.50 - 3.27)",
              "correct": true
            },
            {
              "en": "5.27 liters",
              "correct": false
            },
            {
              "en": "4.23 liters",
              "correct": false
            }
          ],
          "goodEn": "✅ Yes! 8.50 - 3.27 = 5.23 liters. The decimal points stay lined up in the answer too.",
          "goodEs": "¡Sí! 8.50 - 3.27 = 5.23 litros.",
          "badEn": "❌ Annex a zero (8.50) and subtract place by place, keeping the decimal points aligned.",
          "badEs": "❌ Agrega un cero (8.50) y resta posición por posición.",
          "hint": {
            "en": "Annex a zero: 8.50 - 3.27. Line up the points and subtract place by place.",
            "es": ""
          },
          "frame": {
            "en": "After lining up the points, 8.50 - 3.27 = ____ liters.",
            "es": ""
          }
        }
      ]
    },
    {
      "id": "act2",
      "tab": "Act 2: Power Boost",
      "kicker": "Act 2 · Lesson 1-6",
      "title": "Power Boost",
      "advanceLabel": "Charge the core",
      "steps": [
        {
          "type": "beats",
          "art": "act2.png",
          "alt": "A glowing reactor core multiplying decimal energy values",
          "beats": [
            {
              "who": "stationai",
              "en": "Docking complete. Now multiply decimals to set the reactor power. No lining up needed — count the decimal places!",
              "es": "Acople listo. Ahora multiplica decimales para la potencia. No alineas: ¡cuenta los lugares decimales!",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "Right — I multiply like whole numbers, then place the decimal point using the total number of decimal places.",
              "es": "Claro: multiplico como enteros y luego coloco el punto usando el total de lugares decimales."
            }
          ]
        },
        {
          "type": "challenge",
          "id": "act2a",
          "ask": {
            "who": "cadet",
            "en": "Set the reactor: 0.6 × 0.4. Multiply, then place the decimal point. What is the product?",
            "es": "Ajusta el reactor: 0.6 × 0.4. Multiplica y coloca el punto. ¿Cuál es el producto?"
          },
          "choices": [
            {
              "en": "0.24  (2 decimal places)",
              "correct": true
            },
            {
              "en": "2.4",
              "correct": false
            },
            {
              "en": "0.024",
              "correct": false
            }
          ],
          "goodEn": "✅ Correct! 6×4=24, and 1+1=2 decimal places gives 0.24.",
          "goodEs": "¡Correcto! 6×4=24, y 1+1=2 lugares: 0.24.",
          "badEn": "❌ Multiply 6×4=24, then count decimal places: 1+1=2, so the answer is 0.24.",
          "badEs": "❌ Multiplica 6×4=24 y cuenta los lugares: 1+1=2, así que es 0.24.",
          "hint": {
            "en": "6 × 4 = 24. There is 1 decimal place in 0.6 and 1 in 0.4 — that's 2 places total, so the product has 2 places.",
            "es": ""
          },
          "frame": {
            "en": "0.6 has 1 place and 0.4 has 1 place, so the product 0.24 has ____ decimal places.",
            "es": ""
          },
          "solveBeat": {
            "who": "cadet",
            "en": "Core stable! One more: a smaller setting with extra decimal places.",
            "es": "¡Núcleo estable! Una más: un ajuste pequeño con más decimales."
          }
        },
        {
          "type": "challenge",
          "id": "act2b",
          "ask": {
            "who": "cadet",
            "en": "Fine-tune the power: 1.2 × 0.05. Multiply, then place the decimal point correctly.",
            "es": "Ajuste fino: 1.2 × 0.05. Multiplica y coloca bien el punto."
          },
          "choices": [
            {
              "en": "0.06  (3 decimal places, annex a zero)",
              "correct": true
            },
            {
              "en": "0.6",
              "correct": false
            },
            {
              "en": "0.006",
              "correct": false
            }
          ],
          "goodEn": "✅ Yes! 12×5=60; with 3 decimal places that is 0.060 = 0.06. Reactor tuned!",
          "goodEs": "¡Sí! 12×5=60; con 3 lugares es 0.060 = 0.06.",
          "badEn": "❌ 12×5=60. Count places: 1+2=3, so write 0.060 = 0.06.",
          "badEs": "❌ 12×5=60. Cuenta lugares: 1+2=3, así que 0.060 = 0.06.",
          "hint": {
            "en": "12 × 5 = 60. Places: 1 (in 1.2) + 2 (in 0.05) = 3. You may need to annex a zero in front.",
            "es": ""
          },
          "frame": {
            "en": "1.2 (1 place) × 0.05 (2 places) needs ____ decimal places, so the product is 0.06.",
            "es": ""
          }
        }
      ]
    },
    {
      "id": "final",
      "tab": "Final: Launch Code",
      "kicker": "Final · Lessons 1-5 & 1-6",
      "title": "The Launch Code",
      "advanceLabel": "Launch! 🌟",
      "steps": [
        {
          "type": "beats",
          "art": "final.png",
          "alt": "A glowing launch console asking for one combined decimal code",
          "beats": [
            {
              "who": "stationai",
              "en": "Final launch code, Cadet! It uses BOTH skills — add, then multiply.",
              "es": "¡Código final, Cadete! Usa AMBAS destrezas: suma y luego multiplica.",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "First I add 4.5 + 1.5, then multiply the sum by 0.5. Order matters!",
              "es": "Primero sumo 4.5 + 1.5, luego multiplico por 0.5. ¡El orden importa!"
            }
          ]
        },
        {
          "type": "challenge",
          "id": "F",
          "ask": {
            "who": "cadet",
            "en": "Compute (4.5 + 1.5) × 0.5. Add first, then multiply. Which line is fully correct?",
            "es": "Calcula (4.5 + 1.5) × 0.5. Suma primero, luego multiplica. ¿Cuál línea es correcta?"
          },
          "choices": [
            {
              "en": "4.5 + 1.5 = 6.0, then 6.0 × 0.5 = 3.0",
              "correct": true
            },
            {
              "en": "4.5 + 1.5 = 6.0, then 6.0 × 0.5 = 30",
              "correct": false
            },
            {
              "en": "4.5 + 1.5 = 5.0, then 5.0 × 0.5 = 2.5",
              "correct": false
            }
          ],
          "goodEn": "✅ CODE ACCEPTED! 6.0 × 0.5 = 3.0 — exactly half of 6. Launch sequence go!",
          "goodEs": "¡CÓDIGO ACEPTADO! 6.0 × 0.5 = 3.0. ¡Lanzamiento listo!",
          "badEn": "❌ Add first: 4.5 + 1.5 = 6.0. Then 6.0 × 0.5 is HALF of 6, which is 3.0 — not 30.",
          "badEs": "❌ Suma primero: 4.5 + 1.5 = 6.0. Luego × 0.5 es la MITAD de 6, o sea 3.0.",
          "hint": {
            "en": "4.5 + 1.5 = 6.0. Then 6.0 × 0.5 = 3.0 (half of 6).",
            "es": ""
          },
          "frame": {
            "en": "4.5 + 1.5 = ____, and that sum × 0.5 = ____.",
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
    "alt": "The cadet watches the supply ship launch safely into a star field",
    "badge": "🎉⭐",
    "titleEn": "Mission Complete!",
    "en": "You added and subtracted decimals to dock the ship and multiplied decimals to power the launch. The station is fueled and flying. Great work, Cadet!",
    "es": "¡Sumaste, restaste y multiplicaste decimales para salvar la estación! Excelente trabajo.",
    "master": {
      "headingEn": "Master Rank Challenge — for mastery, not required.",
      "promptEn": "Master check: 2.5 × 0.4. Multiply, then place the decimal point. What is the product?",
      "promptEs": "Reto maestro: 2.5 × 0.4. Multiplica y coloca el punto. ¿Cuál es el producto?",
      "choices": [
        {
          "en": "1  (25 × 4 = 100, 2 decimal places → 1.00)",
          "correct": true
        },
        {
          "en": "10",
          "correct": false
        },
        {
          "en": "0.1",
          "correct": false
        }
      ],
      "goodEn": "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      "badEn": "❌ Not quite. Review your work and try another option.",
      "certifyTitle": "🏆 Master Certified!"
    }
  }
};
