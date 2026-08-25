/* STORY · u1-l7 · Graphic Novel #2 (Enrichment) · Decimal Division Drive: Deep Space
   GENERATED from graphic-novels/lessons/manifest.json by
   scripts/generate-lesson-novels.mjs. Do not hand-edit — edit the manifest
   and re-run the generator. Rendered by the shared gn-engine via build.py. */
window.GN_STORY = {
  "meta": {
    "unit": 1,
    "version": 2,
    "level": "Enrichment",
    "title": "Decimal Division Drive: Deep Space",
    "standard": "6.NOS.3",
    "readingStandard": "RL.6.1",
    "assessment": "Graphic Novel u1-l7 #2: Decimal Division Drive: Deep Space",
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
    "alt": "A commander planning multi-jump routes that divide decimal distances and check the math",
    "blurbEn": "Command rank, Cadet. Plan multi-jump routes and reason about why moving the decimal keeps the quotient the same. Then check your own answer with multiplication.",
    "blurbEs": "Rango de mando, Cadete. Planea rutas de varios saltos y razona por qué mover el punto no cambia el cociente. Luego comprueba con multiplicación.",
    "startLabel": "Begin Command 🚀"
  },
  "acts": [
    {
      "id": "act1",
      "tab": "Act 1: Route Planning",
      "kicker": "Act 1 · Lesson 1-7",
      "title": "Route Planning",
      "advanceLabel": "Confirm the route",
      "steps": [
        {
          "type": "beats",
          "art": "act1.png",
          "alt": "A holographic route map dividing a long decimal distance into equal legs",
          "beats": [
            {
              "who": "stationai",
              "en": "Commander, plan a route of 12.6 light-units in legs of 0.6 each. How many legs?",
              "es": "Comandante, planea una ruta de 12.6 unidades en tramos de 0.6. ¿Cuántos tramos?",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "Multiply both by 10 to get 126 ÷ 6. Moving the decimal the same way in both keeps the quotient identical.",
              "es": "Multiplico ambos por 10: 126 ÷ 6. Mover el punto igual en ambos no cambia el cociente."
            }
          ]
        },
        {
          "type": "challenge",
          "id": "act1a",
          "ask": {
            "who": "cadet",
            "en": "Compute 12.6 ÷ 0.6 to count the legs. Make the divisor whole first.",
            "es": "Calcula 12.6 ÷ 0.6 para contar los tramos. Haz el divisor entero primero."
          },
          "choices": [
            {
              "en": "21 legs  (126 ÷ 6)",
              "correct": true
            },
            {
              "en": "2.1 legs",
              "correct": false
            },
            {
              "en": "12 legs",
              "correct": false
            }
          ],
          "goodEn": "✅ Exactly! 126 ÷ 6 = 21 legs. Same decimal shift in both keeps the quotient equal.",
          "goodEs": "¡Exacto! 126 ÷ 6 = 21 tramos.",
          "badEn": "❌ Multiply both by 10: 12.6 ÷ 0.6 = 126 ÷ 6 = 21.",
          "badEs": "❌ ×10 en ambos: 12.6 ÷ 0.6 = 126 ÷ 6 = 21.",
          "hint": {
            "en": "Multiply both by 10: 12.6 ÷ 0.6 = 126 ÷ 6 = 21.",
            "es": ""
          },
          "frame": {
            "en": "12.6 ÷ 0.6 = 126 ÷ 6 = ____ legs.",
            "es": ""
          },
          "solveBeat": {
            "who": "cadet",
            "en": "Route set. Now I'll check it with multiplication.",
            "es": "Ruta lista. Ahora la compruebo con multiplicación."
          }
        },
        {
          "type": "challenge",
          "id": "act1b",
          "ask": {
            "who": "cadet",
            "en": "Check your answer: if 12.6 ÷ 0.6 = 21, then 21 × 0.6 should equal 12.6. What is 21 × 0.6?",
            "es": "Comprueba: si 12.6 ÷ 0.6 = 21, entonces 21 × 0.6 debe ser 12.6. ¿Cuánto es 21 × 0.6?"
          },
          "choices": [
            {
              "en": "12.6  (so the quotient is correct)",
              "correct": true
            },
            {
              "en": "1.26",
              "correct": false
            },
            {
              "en": "126",
              "correct": false
            }
          ],
          "goodEn": "✅ Yes! 21 × 0.6 = 12.6 matches the original distance — your division is confirmed.",
          "goodEs": "¡Sí! 21 × 0.6 = 12.6 coincide con la distancia original.",
          "badEn": "❌ 21 × 6 = 126; with 1 decimal place that is 12.6, which matches the start.",
          "badEs": "❌ 21 × 6 = 126; con 1 lugar decimal es 12.6.",
          "hint": {
            "en": "21 × 6 = 126, and 0.6 has 1 decimal place, so 21 × 0.6 = 12.6.",
            "es": ""
          },
          "frame": {
            "en": "21 × 0.6 = ____, which matches the original distance, so the division checks out.",
            "es": ""
          }
        }
      ]
    },
    {
      "id": "final",
      "tab": "Final: Precision Jump",
      "kicker": "Final · Lesson 1-7",
      "title": "The Precision Jump",
      "advanceLabel": "Execute the jump! 🌟",
      "steps": [
        {
          "type": "beats",
          "art": "final.png",
          "alt": "A precise final jump computed by dividing a hundredths decimal distance",
          "beats": [
            {
              "who": "stationai",
              "en": "Precision leg, Commander: 1.25 light-units in jumps of 0.25. How many?",
              "es": "Tramo de precisión, Comandante: 1.25 unidades en saltos de 0.25. ¿Cuántos?",
              "caption": true
            },
            {
              "who": "cadet",
              "en": "These have hundredths, so I multiply both by 100 to make the divisor whole.",
              "es": "Tienen centésimas, así que multiplico ambos por 100 para hacer el divisor entero."
            }
          ]
        },
        {
          "type": "challenge",
          "id": "F",
          "ask": {
            "who": "cadet",
            "en": "Compute 1.25 ÷ 0.25. The divisor has hundredths. Which line is correct?",
            "es": "Calcula 1.25 ÷ 0.25. El divisor tiene centésimas. ¿Cuál línea es correcta?"
          },
          "choices": [
            {
              "en": "1.25 ÷ 0.25 = 125 ÷ 25 = 5 jumps",
              "correct": true
            },
            {
              "en": "1.25 ÷ 0.25 = 125 ÷ 25 = 50 jumps",
              "correct": false
            },
            {
              "en": "1.25 ÷ 0.25 = 12.5 ÷ 25 = 0.5 jumps",
              "correct": false
            }
          ],
          "goodEn": "✅ PRECISION JUMP LOCKED! Multiply both by 100: 125 ÷ 25 = 5 jumps. Flawless navigation, Commander!",
          "goodEs": "¡SALTO DE PRECISIÓN! ×100 en ambos: 125 ÷ 25 = 5 saltos.",
          "badEn": "❌ Both numbers have hundredths — multiply both by 100: 125 ÷ 25 = 5, not 50.",
          "badEs": "❌ Ambos tienen centésimas — ×100 en ambos: 125 ÷ 25 = 5.",
          "hint": {
            "en": "Multiply both by 100: 1.25 ÷ 0.25 = 125 ÷ 25 = 5.",
            "es": ""
          },
          "frame": {
            "en": "1.25 ÷ 0.25 = 125 ÷ 25 = ____ jumps.",
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
    "alt": "A commander confirms the fleet's safe arrival after precise decimal jumps",
    "badge": "🎉⭐",
    "titleEn": "Precision Achieved!",
    "en": "You divided decimals by shifting the point in both numbers, checked your work by multiplying, and even handled hundredths. Command rank earned, Commander!",
    "es": "¡Dividiste decimales moviendo el punto en ambos, comprobaste multiplicando y manejaste centésimas! Rango de mando ganado.",
    "master": {
      "headingEn": "Master Rank Challenge — for mastery, not required.",
      "promptEn": "Command challenge: 3.6 ÷ 0.12. Make the divisor whole (×100). What is the quotient?",
      "promptEs": "Reto de mando: 3.6 ÷ 0.12. Haz el divisor entero (×100). ¿Cuál es el cociente?",
      "choices": [
        {
          "en": "30  (360 ÷ 12)",
          "correct": true
        },
        {
          "en": "3",
          "correct": false
        },
        {
          "en": "300",
          "correct": false
        }
      ],
      "goodEn": "🏆 <b>Master Rank!</b> Excellent work — you have mastered this skill. ⭐",
      "badEn": "❌ Not quite. Review your work and try another option.",
      "certifyTitle": "🏆 Master Certified!"
    }
  }
};
