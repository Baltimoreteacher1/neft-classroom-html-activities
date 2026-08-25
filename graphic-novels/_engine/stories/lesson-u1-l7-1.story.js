/* STORY · u1-l7 · Graphic Novel #1 (Support) · Decimal Division Drive
   GENERATED from graphic-novels/lessons/manifest.json by
   scripts/generate-lesson-novels.mjs. Do not hand-edit — edit the manifest
   and re-run the generator. Rendered by the shared gn-engine via build.py. */
window.GN_STORY = {
  "meta": {
    "unit": 1,
    "version": 1,
    "level": "Support",
    "title": "Decimal Division Drive",
    "standard": "6.NOS.3",
    "readingStandard": "RL.6.1",
    "assessment": "Graphic Novel u1-l7 #1: Decimal Division Drive",
    "artBase": "../_art/lessons/u1-l7/",
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
    "alt": "A space cadet at a navigation drive that divides decimal distances into equal jumps",
    "blurbEn": "The hyperdrive splits long decimal distances into equal jumps. To divide with decimals, make the divisor a whole number first. Pilot us home, Cadet!",
    "blurbEs": "El hiperimpulsor divide distancias decimales en saltos iguales. Para dividir, primero haz que el divisor sea entero. ¡Llévanos a casa, Cadete!",
    "startLabel": "Start Mission 🚀"
  },
  "acts": [
    {
      "id": "act1",
      "tab": "Act 1: Equal Jumps",
      "kicker": "Act 1 · Lesson 1-7",
      "title": "Equal Jumps",
      "advanceLabel": "Plot the jumps",
      "steps": [
        {
          "type": "beats",
          "art": "act1.png",
          "alt": "A navigation screen splitting a decimal distance into equal jump markers",
          "beats": [
            {
              "who": "stationai",
              "en": "Cadet, we must cross 4.5 light-units in jumps of 0.5 each. How MANY jumps?",
              "es": "Cadete, cruzamos 4.5 unidades en saltos de 0.5. ¿CUÁNTOS saltos?",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "To divide by a decimal, I make the divisor whole. Multiply BOTH numbers by 10: 4.5 ÷ 0.5 becomes 45 ÷ 5.",
              "es": "Para dividir entre un decimal, hago el divisor entero. Multiplico AMBOS por 10: 4.5 ÷ 0.5 es 45 ÷ 5."
            }
          ]
        },
        {
          "type": "challenge",
          "id": "act1a",
          "ask": {
            "who": "cadet",
            "en": "Compute 4.5 ÷ 0.5. Make the divisor a whole number first. How many jumps?",
            "es": "Calcula 4.5 ÷ 0.5. Haz el divisor entero primero. ¿Cuántos saltos?"
          },
          "choices": [
            {
              "en": "9 jumps  (45 ÷ 5)",
              "correct": true
            },
            {
              "en": "0.9 jumps",
              "correct": false
            },
            {
              "en": "90 jumps",
              "correct": false
            }
          ],
          "goodEn": "✅ Correct! Multiply both by 10: 45 ÷ 5 = 9 jumps. Same answer, easier division.",
          "goodEs": "¡Correcto! ×10 en ambos: 45 ÷ 5 = 9 saltos.",
          "badEn": "❌ Make the divisor whole: multiply both by 10 to get 45 ÷ 5 = 9.",
          "badEs": "❌ Haz el divisor entero: ×10 en ambos para 45 ÷ 5 = 9.",
          "hint": {
            "en": "Multiply both by 10: 4.5 ÷ 0.5 = 45 ÷ 5 = 9.",
            "es": ""
          },
          "frame": {
            "en": "I multiplied both numbers by 10, so 4.5 ÷ 0.5 = 45 ÷ 5 = ____.",
            "es": ""
          },
          "solveBeat": {
            "who": "cadet",
            "en": "Course plotted! Now a longer leg with a tighter jump.",
            "es": "¡Rumbo trazado! Ahora un tramo más largo con saltos más cortos."
          }
        },
        {
          "type": "challenge",
          "id": "act1b",
          "ask": {
            "who": "cadet",
            "en": "Now cross 9.6 light-units in jumps of 0.8. Compute 9.6 ÷ 0.8.",
            "es": "Ahora cruza 9.6 unidades en saltos de 0.8. Calcula 9.6 ÷ 0.8."
          },
          "choices": [
            {
              "en": "12 jumps  (96 ÷ 8)",
              "correct": true
            },
            {
              "en": "1.2 jumps",
              "correct": false
            },
            {
              "en": "8 jumps",
              "correct": false
            }
          ],
          "goodEn": "✅ Yes! 96 ÷ 8 = 12 jumps. The decimal point moved the same way in both numbers.",
          "goodEs": "¡Sí! 96 ÷ 8 = 12 saltos.",
          "badEn": "❌ Multiply both by 10: 9.6 ÷ 0.8 = 96 ÷ 8 = 12.",
          "badEs": "❌ ×10 en ambos: 9.6 ÷ 0.8 = 96 ÷ 8 = 12.",
          "hint": {
            "en": "Multiply both by 10: 9.6 ÷ 0.8 = 96 ÷ 8 = 12.",
            "es": ""
          },
          "frame": {
            "en": "Multiplying both by 10, 9.6 ÷ 0.8 = 96 ÷ 8 = ____.",
            "es": ""
          }
        }
      ]
    },
    {
      "id": "final",
      "tab": "Final: Home Jump",
      "kicker": "Final · Lesson 1-7",
      "title": "The Home Jump",
      "advanceLabel": "Jump home! 🌟",
      "steps": [
        {
          "type": "beats",
          "art": "final.png",
          "alt": "The final hyperspace jump home shown as a decimal division on the console",
          "beats": [
            {
              "who": "stationai",
              "en": "Final leg, Cadet: 7.2 light-units in jumps of 0.9. Get us home!",
              "es": "Tramo final, Cadete: 7.2 unidades en saltos de 0.9. ¡Llévanos a casa!",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "Multiply both by 10 and divide. Here we go!",
              "es": "Multiplico ambos por 10 y divido. ¡Vamos!"
            }
          ]
        },
        {
          "type": "challenge",
          "id": "F",
          "ask": {
            "who": "cadet",
            "en": "Compute 7.2 ÷ 0.9. Make the divisor whole first. Which line is correct?",
            "es": "Calcula 7.2 ÷ 0.9. Haz el divisor entero. ¿Cuál línea es correcta?"
          },
          "choices": [
            {
              "en": "7.2 ÷ 0.9 = 72 ÷ 9 = 8 jumps",
              "correct": true
            },
            {
              "en": "7.2 ÷ 0.9 = 72 ÷ 9 = 0.8 jumps",
              "correct": false
            },
            {
              "en": "7.2 ÷ 0.9 = 7.2 ÷ 9 = 0.8 jumps",
              "correct": false
            }
          ],
          "goodEn": "✅ HOME JUMP LOCKED! 72 ÷ 9 = 8 jumps. You moved the decimal in BOTH numbers. We're home!",
          "goodEs": "¡SALTO LISTO! 72 ÷ 9 = 8 saltos. ¡Llegamos a casa!",
          "badEn": "❌ Move the decimal in BOTH numbers (×10): 7.2 ÷ 0.9 = 72 ÷ 9 = 8, not 0.8.",
          "badEs": "❌ Mueve el punto en AMBOS números (×10): 72 ÷ 9 = 8, no 0.8.",
          "hint": {
            "en": "Multiply both by 10: 7.2 ÷ 0.9 = 72 ÷ 9 = 8.",
            "es": ""
          },
          "frame": {
            "en": "7.2 ÷ 0.9 = 72 ÷ 9 = ____ jumps.",
            "es": ""
          }
        }
      ]
    }
  ],
  "glossary": [
    {
      "ico": "📘",
      "en": "Dividend",
      "es": "Dividendo",
      "def": "The total number being divided into equal groups (the number inside the division bracket)."
    },
    {
      "ico": "📘",
      "en": "Divisor",
      "es": "Divisor",
      "def": "The number of equal groups you are dividing into (the number outside the division bracket)."
    },
    {
      "ico": "📘",
      "en": "Quotient",
      "es": "Cociente",
      "def": "The answer when you divide."
    },
    {
      "ico": "📘",
      "en": "Decimal division",
      "es": "División decimal",
      "def": "Dividing with decimals. First make the number you divide by a whole number."
    },
    {
      "ico": "📘",
      "en": "Equivalent division",
      "es": "División equivalente",
      "def": "Multiplying both numbers by 10 or 100 gives the same answer."
    }
  ],
  "complete": {
    "art": "complete.png",
    "alt": "The cadet arrives home as the station glows safely in orbit",
    "badge": "🎉⭐",
    "titleEn": "Mission Complete!",
    "en": "You divided decimals by making each divisor a whole number, then dividing. Every jump landed perfectly and you piloted the crew home. Great work, Cadet!",
    "es": "¡Dividiste decimales haciendo el divisor entero y luego dividiendo! Llevaste a la tripulación a casa.",
    "master": {
      "headingEn": "Master Rank Challenge — for mastery, not required.",
      "promptEn": "Master check: 6.4 ÷ 0.4. Make the divisor whole first. What is the quotient?",
      "promptEs": "Reto maestro: 6.4 ÷ 0.4. Haz el divisor entero. ¿Cuál es el cociente?",
      "choices": [
        {
          "en": "16  (64 ÷ 4)",
          "correct": true
        },
        {
          "en": "1.6",
          "correct": false
        },
        {
          "en": "160",
          "correct": false
        }
      ],
      "goodEn": "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      "badEn": "❌ Not quite. Review your work and try another option.",
      "certifyTitle": "🏆 Master Certified!"
    }
  }
};
