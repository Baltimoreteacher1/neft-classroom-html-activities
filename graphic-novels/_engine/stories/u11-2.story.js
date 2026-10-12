/* Graphic Novel Story · u11-2 — Unit 9: Relationships Between Two Variables (6.AT.11). Sequel to Global Travel Planner. */
window.GN_STORY = {
  "meta": {
    "unit": 9,
    "version": 2,
    "level": "Enrichment",
    "title": "Global Travel Planner: Route Relationships",
    "standard": "6.AT.11",
    "readingStandard": "RL.6.1",
    "assessment": "Graphic Novel U9 #2: Global Travel Planner: Route Relationships",
    "artBase": "../_art/unit3/",
    "home": "../index.html",
    "artFocus": {
      "celebrate.png": [
        52,
        22
      ],
      "cover.png": [
        48,
        22
      ],
      "final-challenge.png": [
        52,
        32
      ],
      "ratio-table.png": [
        45,
        38
      ],
      "ratios-compare.png": [
        70,
        35
      ],
      "unlock.png": [
        70,
        25
      ],
      "world-map.png": [
        50,
        30
      ]
    }
  },
  "cast": {
    "traveler": {
      "name": "Abena Osei",
      "role": "protagonist",
      "color": "#0f766e",
      "tagIcon": "🌍",
      "blurb": "World-Tour Logistics Planner · Table, Graph & Rule Strategist",
      "portrait": {
        "skin": "#8d522c",
        "hair": "#0f172a",
        "hairStyle": 0,
        "gear": "goggles"
      }
    },
    "compass": {
      "name": "VECTOR-X",
      "role": "companion",
      "color": "#0284c7",
      "tagIcon": "🤖",
      "blurb": "Supersonic route AI · swaps which variable is the input",
      "portrait": {
        "bot": true,
        "accent": "#0284c7"
      },
      "figure": "../_art/characters/u3-compass.png",
      "figureTint": 150
    },
    "log": {
      "name": "Capt. Mateus Prado",
      "role": "specialist",
      "color": "#0f766e",
      "tagIcon": "🛫",
      "blurb": "Skyline Flight Analyst · Relationship Strategist",
      "portrait": {
        "outfit": "suit",
        "skin": "#d89668",
        "hair": "#3b2314",
        "hairStyle": "short",
        "beard": "goatee"
      }
    }
  },
  "cover": {
    "art": "cover.png",
    "alt": "Abena stands on a giant glowing globe holding a travel map with airplane trails arcing between landmarks",
    "blurbEn": "The world tour enters its final leg, and <b>Abena</b>, your logistics planner, must model every route with <b>two variables</b>. Decide which variable is the <b>input</b> and which is the <b>output</b>, test tables and graphs for matching points, and write rules like <b>y = kx</b> and <b>y = x + b</b>. VECTOR-X keeps swapping the variables… Watch for the optional <b>⭐ Skyline Challenge</b> in each act for extra credit.",
    "blurbEs": "El viaje entra en su tramo final y Abena debe modelar cada ruta con dos variables. Decide cuál variable es la entrada y cuál la salida, prueba tablas y gráficas con puntos que coincidan y escribe reglas como y = kx y y = x + b. VECTOR-X siempre cambia las variables. Busca el ⭐ Desafío Skyline opcional en cada acto.",
    "startLabel": "Start the Final Leg ✈️"
  },
  "acts": [
    {
      "id": "act1",
      "tab": "Act 1: Paris Variables",
      "kicker": "Act 1 · Variables & Tables",
      "title": "Paris: Input and Output",
      "advanceLabel": "Fly to Tokyo ✈️",
      "steps": [
        {
          "type": "beats",
          "art": "ratios-compare.png",
          "alt": "Abena stands in front of the Eiffel Tower holding passports, with a glowing comparison floating beside her",
          "lastLabel": "Name the variables ▶",
          "beats": [
            {
              "who": "log",
              "en": "Abena, welcome to the Skyline Control Room. Every flight we log links two variables: the independent variable is the input you set, and the output that responds is the dependent one.",
              "es": "Abena, bienvenida a la Sala de Control Skyline. Cada vuelo une dos variables: la variable independiente es la entrada que tú fijas y la salida que responde es la dependiente.",
              "caption": true,
              "vocab": [
                {
                  "term": "independent variable",
                  "en": "The input you choose or control. Its value does not depend on the other variable.",
                  "es": "La entrada que eliges o controlas. Su valor no depende de la otra variable."
                }
              ]
            },
            {
              "who": "traveler",
              "en": "So if I decide how many liters of fuel to load, the distance is the output. The distance is the dependent variable.",
              "es": "Entonces, si decido cuántos litros de combustible cargar, la distancia es la salida. La distancia es la variable dependiente.",
              "vocab": [
                {
                  "term": "dependent variable",
                  "en": "The output that responds to the input. Its value depends on the independent variable.",
                  "es": "La salida que responde a la entrada. Su valor depende de la variable independiente."
                }
              ]
            },
            {
              "who": "compass",
              "en": "Liters of fuel are the smaller number, so distance must be the independent variable. Fuel depends on distance!",
              "es": "Los litros de combustible son el número menor, así que la distancia debe ser la variable independiente. ¡El combustible depende de la distancia!",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "1a",
          "ask": {
            "who": "log",
            "en": "Abena decides how many <b>liters</b> of fuel to load. The dashboard then reports the <b>distance</b> the shuttle can fly. Which pair names the variables correctly?",
            "es": "Abena decide cuántos litros de combustible cargar. El tablero muestra la distancia que puede volar el transbordador. ¿Qué pareja nombra bien las variables?"
          },
          "hint": {
            "en": "Which quantity does Abena set on her own? That is the input, so it is independent.",
            "es": "¿Qué cantidad fija Abena por sí misma? Esa es la entrada, así que es independiente."
          },
          "choices": [
            {
              "en": "Independent: liters loaded · Dependent: distance flown",
              "es": "Independiente: litros cargados · Dependiente: distancia volada",
              "correct": true
            },
            {
              "en": "Independent: distance flown · Dependent: liters loaded (the two are swapped)",
              "es": "Independiente: distancia volada · Dependiente: litros cargados (están cambiadas)",
              "correct": false,
              "why": {
                "en": "❌ The two are swapped. Abena sets the liters, and the distance responds.",
                "es": "Están cambiadas. Abena fija los litros y la distancia responde."
              }
            },
            {
              "en": "Independent: distance flown, because it is the bigger number",
              "es": "Independiente: distancia volada, porque es el número mayor",
              "correct": false,
              "why": {
                "en": "❌ Size does not decide which variable is independent. Ask which one is chosen first.",
                "es": "El tamaño no decide cuál variable es independiente. Pregunta cuál se elige primero."
              }
            }
          ],
          "goodEn": "✅ Liters (the input Abena sets) are independent, and distance (the output) is dependent.",
          "goodEs": "¡Los litros (la entrada que fija Abena) son independientes y la distancia (la salida) es dependiente!",
          "badEn": "❌ The variable you set is independent. The one that responds is dependent.",
          "badEs": "La variable que fijas es independiente. La que responde es dependiente.",
          "help": {
            "conceptual": {
              "en": "❌ The variable you set is independent. The one that responds is dependent.",
              "es": "La variable que fijas es independiente. La que responde es dependiente."
            },
            "procedural": {
              "en": "Which quantity does Abena set on her own? That is the input, so it is independent.",
              "es": "¿Qué cantidad fija Abena por sí misma? Esa es la entrada, así que es independiente."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "traveler",
            "en": "Input and output sorted. Next I test my pack weights in a table.",
            "es": "Entrada y salida ordenadas. Ahora pruebo los pesos de mi mochila en una tabla."
          }
        },
        {
          "type": "comprehension",
          "id": "c1",
          "skill": "vocab_in_context",
          "standard": "RI.6.4",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "act1.1a",
          "ask": {
            "who": "log",
            "en": "Abena treats the distance as the <b>output</b> of her fuel choice. In this context, output most nearly means —",
            "es": "Abena trata la distancia como la <b>salida</b> de su elección de combustible. En este contexto, salida significa más o menos —"
          },
          "choices": [
            {
              "en": "the result that depends on the input value.",
              "es": "el resultado que depende del valor de entrada.",
              "correct": true
            },
            {
              "en": "the price of the fuel she bought.",
              "es": "el precio del combustible que compró.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "the largest number in a table.",
              "es": "el número más grande de una tabla.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Exactly. The output is the dependent variable: it responds to the input.",
          "goodEs": "Exacto. La salida es la variable dependiente: responde a la entrada."
        },
        {
          "type": "beats",
          "art": "ratios-compare.png",
          "alt": "Abena studies a glowing table of item weights and totals beside the Eiffel Tower",
          "lastLabel": "Find the rule ▶",
          "beats": [
            {
              "who": "compass",
              "en": "Pack weights: items 2, 4, 6 kg give totals of 7, 9, 11 kg. The total doubles with the items, so the rule is y = 2x. Then 10 kg of items gives 20 kg!",
              "es": "Pesos de la mochila: artículos de 2, 4, 6 kg dan totales de 7, 9, 11 kg. El total se duplica con los artículos, así que la regla es y = 2x. ¡Entonces 10 kg de artículos dan 20 kg!",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "1b",
          "ask": {
            "who": "traveler",
            "en": "Abena tests her empty travel pack. She loads <b>x kg</b> of items, and the scale shows the total <b>y kg</b>. <br><br>Items x: 2, 4, 6, 10 → Total y: 7, 9, 11, ?<br><br>Find the rule that links y to x, then the missing total.",
            "es": "Abena prueba su mochila vacía. Carga x kg de artículos y la balanza muestra el total y kg. Halla la regla que une y con x y el total que falta."
          },
          "hint": {
            "en": "Compare y with x in each row: 7 − 2 = 5, 9 − 4 = 5, 11 − 6 = 5. So y = x + 5.",
            "es": "Compara y con x en cada fila: 7 − 2 = 5, 9 − 4 = 5, 11 − 6 = 5. Así que y = x + 5."
          },
          "choices": [
            {
              "en": "15 kg: the rule is y = x + 5, so 10 + 5 = 15",
              "es": "15 kg: la regla es y = x + 5, así que 10 + 5 = 15",
              "correct": true
            },
            {
              "en": "20 kg: the rule is y = 2x",
              "es": "20 kg: la regla es y = 2x",
              "correct": false,
              "why": {
                "en": "❌ Test y = 2x on a row: 2 × 2 = 4, but the table says 7. Try again: y is always 5 more than x.",
                "es": "Prueba y = 2x en una fila: 2 × 2 = 4, pero la tabla dice 7. Intenta otra vez: y siempre es 5 más que x."
              }
            },
            {
              "en": "13 kg: the total rises by 2 each row, so 11 + 2",
              "es": "13 kg: el total sube 2 en cada fila, así que 11 + 2",
              "correct": false,
              "why": {
                "en": "❌ The steps in x are not all 2. From x = 6 to x = 10 is a jump of 4, so y jumps by 4: 11 + 4.",
                "es": "Los pasos de x no son siempre 2. De x = 6 a x = 10 hay un salto de 4, así que y salta 4: 11 + 4."
              }
            }
          ],
          "goodEn": "✅ y = x + 5 works in every row (2+5=7, 4+5=9, 6+5=11), so x = 10 gives y = 15 kg.",
          "goodEs": "¡y = x + 5 funciona en cada fila (2+5=7, 4+5=9, 6+5=11), así que x = 10 da y = 15 kg!",
          "badEn": "❌ Test a rule on every row. y − x is always 5.",
          "badEs": "Prueba una regla en cada fila. y − x siempre es 5.",
          "help": {
            "conceptual": {
              "en": "❌ Test a rule on every row. y − x is always 5.",
              "es": "Prueba una regla en cada fila. y − x siempre es 5."
            },
            "procedural": {
              "en": "Compare y with x in each row: 7 − 2 = 5, 9 − 4 = 5, 11 − 6 = 5. So y = x + 5.",
              "es": "Compara y con x en cada fila: 7 − 2 = 5, 9 − 4 = 5, 11 − 6 = 5. Así que y = x + 5."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "solveArt": "unlock.png",
          "solveAlt": "A glowing gateway opens to reveal pyramids as Abena cheers with raised fists",
          "solveBeat": {
            "who": "traveler",
            "en": "The pack rule is y = x + 5, and the gateway opens! On to Tokyo for graphs.",
            "es": "La regla de la mochila es y = x + 5 y la puerta se abre. Sigue Tokio para las gráficas."
          }
        },
        {
          "type": "comprehension",
          "id": "c2",
          "skill": "key_details",
          "standard": "RI.6.1",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "act1.1b",
          "ask": {
            "who": "log",
            "en": "According to the table, what total does the scale show when Abena packs <b>6 kg</b> of items?",
            "es": "Según la tabla, ¿qué total muestra la balanza cuando Abena empaca 6 kg de artículos?"
          },
          "choices": [
            {
              "en": "11 kg.",
              "es": "11 kg.",
              "correct": true
            },
            {
              "en": "6 kg.",
              "es": "6 kg.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "15 kg.",
              "es": "15 kg.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Correct: x = 6 gives y = 11, which is one of the rows used to find the rule.",
          "goodEs": "Correcto: x = 6 da y = 11, una de las filas para hallar la regla."
        },
        {
          "type": "comprehension",
          "id": "c3",
          "skill": "cite_evidence",
          "standard": "RL.6.1",
          "dok": 2,
          "interaction": "evidence",
          "passageRef": "act1.beats",
          "ask": {
            "who": "log",
            "en": "Claim: VECTOR-X mixes up which variable depends on which. Tap the line that best proves this claim.",
            "es": "Afirmación: VECTOR-X confunde cuál variable depende de cuál. Toca la línea que mejor lo demuestra."
          },
          "choices": [
            {
              "en": "“Liters of fuel are the smaller number, so distance must be the independent variable. Fuel depends on distance!”",
              "es": "“Los litros de combustible son el número menor, así que la distancia debe ser la variable independiente. ¡El combustible depende de la distancia!”",
              "correct": true
            },
            {
              "en": "“So if I decide how many liters of fuel to load, the distance is the output.”",
              "es": "“Entonces, si decido cuántos litros de combustible cargar, la distancia es la salida.”",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "“Every flight we log links two variables.”",
              "es": "“Cada vuelo que anotamos une dos variables.”",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Strong evidence: VECTOR-X chooses the independent variable by size, not by what Abena sets.",
          "goodEs": "Evidencia sólida: VECTOR-X elige la independiente por tamaño, no por lo que fija Abena."
        },
        {
          "type": "challenge",
          "id": "B1",
          "ask": {
            "who": "log",
            "en": "Optional: which table shows the rule <b>y = 3x</b>? Skip it any time and still fly on.",
            "es": "Opcional: ¿qué tabla muestra la regla y = 3x? Puedes saltarla y seguir el vuelo."
          },
          "hint": {
            "en": "Test the first row of each table: y must be 3 times x.",
            "es": "Prueba la primera fila de cada tabla: y debe ser 3 veces x."
          },
          "choices": [
            {
              "en": "x: 1, 2, 3 → y: 3, 6, 9",
              "es": "x: 1, 2, 3 → y: 3, 6, 9",
              "correct": true
            },
            {
              "en": "x: 1, 2, 3 → y: 4, 5, 6 (this is y = x + 3)",
              "es": "x: 1, 2, 3 → y: 4, 5, 6 (esto es y = x + 3)",
              "correct": false,
              "why": {
                "en": "❌ That table adds 3 to x. y = 3x multiplies x by 3.",
                "es": "Esa tabla suma 3 a x. y = 3x multiplica x por 3."
              }
            },
            {
              "en": "x: 3, 6, 9 → y: 1, 2, 3 (this is x = 3y, swapped)",
              "es": "x: 3, 6, 9 → y: 1, 2, 3 (esto es x = 3y, cambiada)",
              "correct": false,
              "why": {
                "en": "❌ Here x is 3 times y. The rule y = 3x needs y to be 3 times x.",
                "es": "Aquí x es 3 veces y. La regla y = 3x necesita que y sea 3 veces x."
              }
            }
          ],
          "goodEn": "⭐ y = 3x: 3×1 = 3, 3×2 = 6, 3×3 = 9. Bonus earned!",
          "goodEs": "⭐ y = 3x: 3×1 = 3, 3×2 = 6, 3×3 = 9. ¡Bono obtenido!",
          "badEn": "❌ Multiply x by 3 in every row.",
          "badEs": "Multiplica x por 3 en cada fila.",
          "help": {
            "conceptual": {
              "en": "❌ Multiply x by 3 in every row.",
              "es": "Multiplica x por 3 en cada fila."
            },
            "procedural": {
              "en": "Test the first row of each table: y must be 3 times x.",
              "es": "Prueba la primera fila de cada tabla: y debe ser 3 veces x."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "optional": true,
          "bonusTag": "⭐ Skyline Challenge",
          "solveBeat": {
            "who": "traveler",
            "en": "Multiplying by 3 and adding 3 build different tables. On to Tokyo.",
            "es": "Multiplicar por 3 y sumar 3 forman tablas distintas. Sigue Tokio."
          }
        }
      ]
    },
    {
      "id": "act2",
      "tab": "Act 2: Tokyo Graphs",
      "kicker": "Act 2 · Graphs",
      "title": "Tokyo: Points That Match",
      "advanceLabel": "To the Final Briefing ✈️",
      "steps": [
        {
          "type": "beats",
          "art": "ratio-table.png",
          "alt": "Abena draws a glowing table and a rising line graph in the air on a Tokyo street",
          "lastLabel": "Read the graph ▶",
          "beats": [
            {
              "who": "log",
              "en": "On a graph, the independent variable goes on the x-axis and the dependent variable on the y-axis. Each point is an ordered pair (x, y), and the shape of the points shows the pattern.",
              "es": "En una gráfica, la variable independiente va en el eje x y la dependiente en el eje y. Cada punto es un par ordenado (x, y) y la forma de los puntos muestra el patrón.",
              "caption": true,
              "vocab": [
                {
                  "term": "ordered pair",
                  "en": "Two numbers (x, y) that name one point. Read x first, then y.",
                  "es": "Dos números (x, y) que nombran un punto. Lee x primero y luego y."
                }
              ]
            },
            {
              "who": "traveler",
              "en": "So for the rail pass, days go on the x-axis and cost goes on the y-axis. The point (4, 60) means 4 days cost $60.",
              "es": "Entonces, para el pase de tren, los días van en el eje x y el costo en el eje y. El punto (4, 60) significa que 4 días cuestan $60."
            },
            {
              "who": "compass",
              "en": "The point (4, 60): 4 is how far up and 60 is how far right. So the pass costs $4 for 60 days!",
              "es": "El punto (4, 60): 4 es cuánto subo y 60 cuánto me muevo a la derecha. ¡Así que el pase cuesta $4 por 60 días!",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "2a",
          "ask": {
            "who": "log",
            "en": "Abena graphs her rail pass with <b>days</b> on the x-axis and <b>cost in dollars</b> on the y-axis. The points are (1, 15), (2, 30), (3, 45), and (4, 60). What does the point <b>(3, 45)</b> tell her?",
            "es": "Abena grafica su pase de tren con los días en el eje x y el costo en dólares en el eje y. Los puntos son (1, 15), (2, 30), (3, 45) y (4, 60). ¿Qué le dice el punto (3, 45)?"
          },
          "hint": {
            "en": "Read x first: 3 days. Then y: $45.",
            "es": "Lee x primero: 3 días. Luego y: $45."
          },
          "choices": [
            {
              "en": "3 days of travel cost $45.",
              "es": "3 días de viaje cuestan $45.",
              "correct": true
            },
            {
              "en": "45 days of travel cost $3. (x and y are swapped)",
              "es": "45 días de viaje cuestan $3. (x y y están cambiadas)",
              "correct": false,
              "why": {
                "en": "❌ x is days, so the first number is the days: 3. The cost is the second number: $45.",
                "es": "x son los días, así que el primer número son los días: 3. El costo es el segundo número: $45."
              }
            },
            {
              "en": "Each day costs $3. (3 is the number of days, not a price)",
              "es": "Cada día cuesta $3. (3 son los días, no un precio)",
              "correct": false,
              "why": {
                "en": "❌ The 3 is the x-value (days), not a daily price. The point says 3 days → $45.",
                "es": "El 3 es el valor de x (días), no un precio diario. El punto dice 3 días → $45."
              }
            }
          ],
          "goodEn": "✅ (3, 45) means x = 3 days and y = $45. Read x first, then y.",
          "goodEs": "¡(3, 45) significa x = 3 días y y = $45! Lee x primero y luego y.",
          "badEn": "❌ x is days (first number), y is cost (second number).",
          "badEs": "x son los días (primer número) y y es el costo (segundo número).",
          "help": {
            "conceptual": {
              "en": "❌ x is days (first number), y is cost (second number).",
              "es": "x son los días (primer número) y y es el costo (segundo número)."
            },
            "procedural": {
              "en": "Read x first: 3 days. Then y: $45.",
              "es": "Lee x primero: 3 días. Luego y: $45."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "traveler",
            "en": "3 days, $45. Axes straight.",
            "es": "3 días, $45. Ejes en orden."
          }
        },
        {
          "type": "beats",
          "art": "ratio-table.png",
          "alt": "Abena sets a glowing table beside a rising line of points in Tokyo",
          "lastLabel": "Match the table ▶",
          "beats": [
            {
              "who": "log",
              "en": "Every point on the graph is one row of a table. Match the graph to its table, and keep the axes straight.",
              "es": "Cada punto de la gráfica es una fila de una tabla. Empareja la gráfica con su tabla y mantén los ejes en orden.",
              "caption": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "2b",
          "ask": {
            "who": "traveler",
            "en": "Which table gives the <b>same points</b> as the graph (1, 15), (2, 30), (3, 45), (4, 60)?",
            "es": "¿Qué tabla da los mismos puntos que la gráfica (1, 15), (2, 30), (3, 45), (4, 60)?"
          },
          "hint": {
            "en": "x-values (days) go in the first row. y-values (cost) go in the second.",
            "es": "Los valores de x (días) van en la primera fila y los de y (costo) en la segunda."
          },
          "choices": [
            {
              "en": "Days: 1, 2, 3, 4 → Cost: 15, 30, 45, 60",
              "es": "Días: 1, 2, 3, 4 → Costo: 15, 30, 45, 60",
              "correct": true
            },
            {
              "en": "Days: 15, 30, 45, 60 → Cost: 1, 2, 3, 4 (axes swapped)",
              "es": "Días: 15, 30, 45, 60 → Costo: 1, 2, 3, 4 (ejes cambiados)",
              "correct": false,
              "why": {
                "en": "❌ Here days and cost trade places. Days (x) are 1, 2, 3, 4 and cost (y) is 15, 30, 45, 60.",
                "es": "Aquí los días y el costo se cambian. Los días (x) son 1, 2, 3, 4 y el costo (y) es 15, 30, 45, 60."
              }
            },
            {
              "en": "Days: 1, 2, 3, 4 → Cost: 15, 16, 17, 18 (cost grows by 1)",
              "es": "Días: 1, 2, 3, 4 → Costo: 15, 16, 17, 18 (el costo crece 1)",
              "correct": false,
              "why": {
                "en": "❌ On the graph the cost jumps by 15 each day, not 1: 15, 30, 45, 60.",
                "es": "En la gráfica el costo salta 15 cada día, no 1: 15, 30, 45, 60."
              }
            }
          ],
          "goodEn": "✅ Days 1–4 pair with costs 15, 30, 45, 60, exactly the graph's points.",
          "goodEs": "¡Los días 1–4 van con costos 15, 30, 45, 60, justo los puntos de la gráfica!",
          "badEn": "❌ Read each (x, y) in order and check how fast y grows.",
          "badEs": "Lee cada (x, y) en orden y revisa qué tan rápido crece y.",
          "help": {
            "conceptual": {
              "en": "❌ Read each (x, y) in order and check how fast y grows.",
              "es": "Lee cada (x, y) en orden y revisa qué tan rápido crece y."
            },
            "procedural": {
              "en": "x-values (days) go in the first row. y-values (cost) go in the second.",
              "es": "Los valores de x (días) van en la primera fila y los de y (costo) en la segunda."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "traveler",
            "en": "The table matches every point. The cost climbs $15 a day.",
            "es": "La tabla coincide con cada punto. El costo sube $15 al día."
          }
        },
        {
          "type": "comprehension",
          "id": "c4",
          "skill": "main_idea",
          "standard": "RI.6.2",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "act2",
          "ask": {
            "who": "log",
            "en": "What is Abena mainly doing in this chapter?",
            "es": "¿Qué hace Abena principalmente en este capítulo?"
          },
          "choices": [
            {
              "en": "Reading points on a graph and matching them to a table.",
              "es": "Leer puntos en una gráfica y emparejarlos con una tabla.",
              "correct": true
            },
            {
              "en": "Loading fuel for the flight to Tokyo.",
              "es": "Cargar combustible para el vuelo a Tokio.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Packing items into her travel pack.",
              "es": "Empacar artículos en su mochila de viaje.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ]
        },
        {
          "type": "comprehension",
          "id": "c5",
          "skill": "sequence",
          "standard": "RI.6.3",
          "dok": 2,
          "interaction": "sequence",
          "passageRef": "act2",
          "ask": {
            "who": "log",
            "en": "Order the steps Abena used to turn the rail-pass graph into a table.",
            "es": "Ordena los pasos que Abena usó para convertir la gráfica del pase de tren en una tabla."
          },
          "items": [
            {
              "en": "Read each point (x, y) from the graph.",
              "es": "Lee cada punto (x, y) de la gráfica.",
              "order": 1
            },
            {
              "en": "Write the x-values (days) in one row and the y-values (cost) in the other.",
              "es": "Escribe los valores de x (días) en una fila y los de y (costo) en la otra.",
              "order": 2
            },
            {
              "en": "Check that equal steps in days give equal steps in cost.",
              "es": "Revisa que pasos iguales en días den pasos iguales en costo.",
              "order": 3
            }
          ],
          "goodEn": "✅ Read the points, build the table, then check the pattern.",
          "goodEs": "¡Lee los puntos, arma la tabla y revisa el patrón!",
          "badEn": "❌ Not quite. First read the points, then write them in a table, and only then check the pattern.",
          "badEs": "No exactamente. Primero lee los puntos, luego escríbelos en una tabla y después revisa el patrón."
        },
        {
          "type": "challenge",
          "id": "B2",
          "ask": {
            "who": "log",
            "en": "Optional: a second pass has the points <b>(0, 5), (1, 6), (2, 7), (3, 8)</b> (days, cost). Which statement is true? Skip it any time.",
            "es": "Opcional: otro pase tiene los puntos (0, 5), (1, 6), (2, 7), (3, 8) (días, costo). ¿Qué afirmación es verdadera? Puedes saltarla."
          },
          "hint": {
            "en": "Look at the first point and at how y changes when x goes up by 1.",
            "es": "Mira el primer punto y cómo cambia y cuando x sube 1."
          },
          "choices": [
            {
              "en": "The graph starts at (0, 5) and rises 1 for each added day, so y = x + 5.",
              "es": "La gráfica empieza en (0, 5) y sube 1 por cada día más, así que y = x + 5.",
              "correct": true
            },
            {
              "en": "The graph passes through the origin (0, 0).",
              "es": "La gráfica pasa por el origen (0, 0).",
              "correct": false,
              "why": {
                "en": "❌ The first point is (0, 5), not (0, 0). The cost starts at 5 before any days.",
                "es": "El primer punto es (0, 5), no (0, 0). El costo empieza en 5 antes de cualquier día."
              }
            },
            {
              "en": "The graph rises 5 for each added day.",
              "es": "La gráfica sube 5 por cada día más.",
              "correct": false,
              "why": {
                "en": "❌ y goes 5, 6, 7, 8: it rises 1 each day. The 5 is where it starts.",
                "es": "y va 5, 6, 7, 8: sube 1 cada día. El 5 es donde empieza."
              }
            }
          ],
          "goodEn": "⭐ Starts at 5, adds 1 per day: y = x + 5. Bonus earned!",
          "goodEs": "⭐ Empieza en 5 y suma 1 por día: y = x + 5. ¡Bono obtenido!",
          "badEn": "❌ Check the first point and the change in y for each +1 in x.",
          "badEs": "Revisa el primer punto y el cambio en y por cada +1 en x.",
          "help": {
            "conceptual": {
              "en": "❌ Check the first point and the change in y for each +1 in x.",
              "es": "Revisa el primer punto y el cambio en y por cada +1 en x."
            },
            "procedural": {
              "en": "Look at the first point and at how y changes when x goes up by 1.",
              "es": "Mira el primer punto y cómo cambia y cuando x sube 1."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "optional": true,
          "bonusTag": "⭐ Skyline Challenge",
          "solveBeat": {
            "who": "traveler",
            "en": "A graph can start above zero, and the rule still shows it. On to the final briefing.",
            "es": "Una gráfica puede empezar sobre cero y la regla lo muestra. Sigue la reunión final."
          }
        }
      ]
    },
    {
      "id": "final",
      "tab": "Final: Briefing",
      "kicker": "Final · Rules & Predictions",
      "title": "The Final Briefing",
      "advanceLabel": "Complete the Tour 🎉",
      "steps": [
        {
          "type": "beats",
          "art": "final-challenge.png",
          "alt": "Abena stands before a huge glowing globe gateway with tables and route lines orbiting her",
          "lastLabel": "Write the rule ▶",
          "beats": [
            {
              "who": "log",
              "en": "The final briefing needs a rule. Write the dependent variable alone: y = kx when y is k times x, or y = x + b when b is added. Test one row before you trust it.",
              "es": "La reunión final necesita una regla. Escribe la variable dependiente sola: y = kx cuando y es k veces x, o y = x + b cuando se suma b. Prueba una fila antes de confiar.",
              "caption": true,
              "vocab": [
                {
                  "term": "dependent variable",
                  "en": "The output that responds to the input. It goes alone on the left of the equation.",
                  "es": "La salida que responde a la entrada. Va sola a la izquierda de la ecuación."
                }
              ]
            },
            {
              "who": "traveler",
              "en": "For the rail pass, cost c depends on days d. It is $15 a day, so c = 15d. Test d = 4: 15 × 4 = 60, matching the point (4, 60).",
              "es": "Para el pase de tren, el costo c depende de los días d. Son $15 al día, así que c = 15d. Prueba d = 4: 15 × 4 = 60, igual que el punto (4, 60)."
            },
            {
              "who": "log",
              "en": "An equation lets you predict any value you did not graph. That is its power.",
              "es": "Una ecuación te deja predecir cualquier valor que no graficaste. Ese es su poder.",
              "caption": true
            },
            {
              "who": "compass",
              "en": "Fifteen dollars per day, so I'll write d = 15c: days equal fifteen times the cost!",
              "es": "Quince dólares por día, así que escribo d = 15c: ¡los días son quince veces el costo!",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "F",
          "ask": {
            "who": "traveler",
            "en": "The rail pass costs <b>$15 per day</b>. Let <b>d</b> = days (independent) and <b>c</b> = cost (dependent). Which line gives the correct equation <b>and</b> the cost of <b>7 days</b>?",
            "es": "El pase cuesta $15 por día. Sea d = días (independiente) y c = costo (dependiente). ¿Qué línea da la ecuación correcta y el costo de 7 días?"
          },
          "hint": {
            "en": "Cost depends on days, so c goes alone: c = 15 × d. For d = 7: 15 × 7 = ?",
            "es": "El costo depende de los días, así que c va sola: c = 15 × d. Para d = 7: 15 × 7 = ?"
          },
          "choices": [
            {
              "en": "c = 15d, so 7 days cost $105",
              "es": "c = 15d, así que 7 días cuestan $105",
              "correct": true
            },
            {
              "en": "d = 15c, so 7 days cost $0.47 (the variables are swapped)",
              "es": "d = 15c, así que 7 días cuestan $0.47 (las variables están cambiadas)",
              "correct": false,
              "why": {
                "en": "❌ That says days are 15 times the cost. Cost depends on days, so the cost goes alone: c = 15d.",
                "es": "Eso dice que los días son 15 veces el costo. El costo depende de los días, así que el costo va solo: c = 15d."
              }
            },
            {
              "en": "c = d + 15, so 7 days cost $22",
              "es": "c = d + 15, así que 7 días cuestan $22",
              "correct": false,
              "why": {
                "en": "❌ Test d = 2: 2 + 15 = 17, but the table says $30. The pass adds $15 for EACH day, so multiply.",
                "es": "Prueba d = 2: 2 + 15 = 17, pero la tabla dice $30. El pase suma $15 por CADA día, así que multiplica."
              }
            }
          ],
          "goodEn": "✅ BRIEFING DONE! c = 15d, so d = 7 gives c = 15 × 7 = $105. Check: d = 4 gives $60, matching the graph.",
          "goodEs": "¡LISTO! c = 15d, así que d = 7 da c = 15 × 7 = $105. Verifica: d = 4 da $60, igual que la gráfica.",
          "badEn": "❌ The dependent variable (cost) goes alone. Each day adds $15, so multiply.",
          "badEs": "La variable dependiente (costo) va sola. Cada día suma $15, así que multiplica.",
          "help": {
            "conceptual": {
              "en": "❌ The dependent variable (cost) goes alone. Each day adds $15, so multiply.",
              "es": "La variable dependiente (costo) va sola. Cada día suma $15, así que multiplica."
            },
            "procedural": {
              "en": "Cost depends on days, so c goes alone: c = 15 × d. For d = 7: 15 × 7 = ?",
              "es": "El costo depende de los días, así que c va sola: c = 15 × d. Para d = 7: 15 × 7 = ?"
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "log",
            "en": "Optional extra credit: the tour is already complete whether or not you solve it. Use the pack rule to solve backward.",
            "es": "Crédito extra opcional: el viaje termina aunque no lo resuelvas. Usa la regla de la mochila para resolver hacia atrás."
          }
        },
        {
          "type": "challenge",
          "id": "BF",
          "ask": {
            "who": "log",
            "en": "Optional: the pack rule is <b>w = i + 5</b> (w = total weight, i = items, in kg). The airline weighs the pack at <b>18 kg</b>. How many kg of items are inside?",
            "es": "Opcional: la regla de la mochila es w = i + 5 (w = peso total, i = artículos, en kg). La aerolínea pesa la mochila en 18 kg. ¿Cuántos kg de artículos hay adentro?"
          },
          "hint": {
            "en": "Put 18 in for w: 18 = i + 5. Undo the + 5.",
            "es": "Pon 18 en lugar de w: 18 = i + 5. Deshaz el + 5."
          },
          "choices": [
            {
              "en": "13 kg (18 = i + 5, so i = 18 − 5)",
              "es": "13 kg (18 = i + 5, así que i = 18 − 5)",
              "correct": true
            },
            {
              "en": "23 kg (18 + 5)",
              "es": "23 kg (18 + 5)",
              "correct": false,
              "why": {
                "en": "❌ The 5 kg is the empty pack, already inside the 18. Subtract it: 18 − 5.",
                "es": "Los 5 kg son la mochila vacía, ya incluidos en los 18. Réstalos: 18 − 5."
              }
            },
            {
              "en": "90 kg (5 × 18)",
              "es": "90 kg (5 × 18)",
              "correct": false,
              "why": {
                "en": "❌ This rule adds 5, it does not multiply by 5. Undo the addition.",
                "es": "Esta regla suma 5, no multiplica por 5. Deshaz la suma."
              }
            }
          ],
          "goodEn": "⭐ 18 = i + 5, so i = 13 kg. Check: 13 + 5 = 18. Bonus earned!",
          "goodEs": "⭐ 18 = i + 5, así que i = 13 kg. Verifica: 13 + 5 = 18. ¡Bono obtenido!",
          "badEn": "❌ Put 18 in for w and undo the + 5.",
          "badEs": "Pon 18 en lugar de w y deshaz el + 5.",
          "help": {
            "conceptual": {
              "en": "❌ Put 18 in for w and undo the + 5.",
              "es": "Pon 18 en lugar de w y deshaz el + 5."
            },
            "procedural": {
              "en": "Put 18 in for w: 18 = i + 5. Undo the + 5.",
              "es": "Pon 18 en lugar de w: 18 = i + 5. Deshaz el + 5."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "optional": true,
          "bonusTag": "⭐ Skyline Challenge",
          "solveBeat": {
            "who": "traveler",
            "en": "The tour is planned from Paris to the Final Briefing. Thanks, VECTOR-X, even the swapped variables taught me something.",
            "es": "El viaje está planeado de París a la Reunión Final. Gracias, VECTOR-X, hasta las variables cambiadas me enseñaron algo."
          }
        },
        {
          "type": "comprehension",
          "id": "c6",
          "skill": "inference",
          "standard": "RL.6.1",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "final",
          "ask": {
            "who": "log",
            "en": "Across the tour, VECTOR-X picks the independent variable by size, by order, or by guessing. What can you infer about why its rules keep failing?",
            "es": "Durante el viaje, VECTOR-X elige la variable independiente por tamaño, orden o suposición. ¿Qué puedes inferir sobre por qué sus reglas fallan?"
          },
          "choices": [
            {
              "en": "It never asks which variable is chosen and which responds, so its tables, graphs, and equations swap the roles.",
              "es": "Nunca pregunta cuál variable se elige y cuál responde, así que sus tablas, gráficas y ecuaciones cambian los papeles.",
              "correct": true
            },
            {
              "en": "VECTOR-X is secretly trying to sink the tour.",
              "es": "VECTOR-X intenta secretamente arruinar el viaje.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Every graph on the tour was drawn wrong.",
              "es": "Todas las gráficas del viaje se dibujaron mal.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Good inference: it never decides who depends on whom, so the roles flip.",
          "goodEs": "Buena inferencia: nunca decide quién depende de quién, así que los papeles se invierten."
        },
        {
          "type": "comprehension",
          "id": "c7",
          "skill": "prediction",
          "standard": "RL.6.3",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "final",
          "ask": {
            "who": "log",
            "en": "The tour is complete and rules are working. What will Abena most likely do on her next trip?",
            "es": "El viaje terminó y las reglas funcionan. ¿Qué hará Abena probablemente en su próximo viaje?"
          },
          "choices": [
            {
              "en": "Name the independent variable first, then use tables, graphs, and equations to predict.",
              "es": "Nombrar primero la variable independiente y usar tablas, gráficas y ecuaciones para predecir.",
              "correct": true
            },
            {
              "en": "Let VECTOR-X choose the variables by size.",
              "es": "Dejar que VECTOR-X elija las variables por tamaño.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Stop checking rules against table rows.",
              "es": "Dejar de comprobar las reglas con las filas de la tabla.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Likely: the tour shows that naming the variables first makes every rule work.",
          "goodEs": "Probable: el viaje muestra que nombrar primero las variables hace funcionar cada regla."
        }
      ]
    }
  ],
  "glossary": [
    {
      "ico": "🎛️",
      "en": "Independent variable",
      "es": "variable independiente",
      "def": "The input you choose or control, like liters of fuel loaded."
    },
    {
      "ico": "➡️",
      "en": "Dependent variable",
      "es": "variable dependiente",
      "def": "The output that responds to the input, like distance flown."
    },
    {
      "ico": "📋",
      "en": "Table",
      "es": "tabla",
      "def": "A grid of matching x and y values."
    },
    {
      "ico": "📍",
      "en": "Ordered pair",
      "es": "par ordenado",
      "def": "Two numbers (x, y) that name one point. Read x first, then y."
    },
    {
      "ico": "↔️",
      "en": "Axes",
      "es": "ejes",
      "def": "x-axis (horizontal) for the independent variable, y-axis (vertical) for the dependent variable."
    },
    {
      "ico": "✖️",
      "en": "Rule y = kx",
      "es": "regla y = kx",
      "def": "y is k times x. In y = 15x, every added x adds 15 to y."
    },
    {
      "ico": "➕",
      "en": "Rule y = x + b",
      "es": "regla y = x + b",
      "def": "y is x plus b. In y = x + 5, y is always 5 more than x."
    },
    {
      "ico": "🧪",
      "en": "Test a rule",
      "es": "probar una regla",
      "def": "Put a table row into the rule. If it fails for any row, the rule is wrong."
    },
    {
      "ico": "🔮",
      "en": "Predict",
      "es": "predecir",
      "def": "Use an equation to find a value that is not in the table or graph."
    }
  ],
  "complete": {
    "art": "celebrate.png",
    "alt": "Abena celebrates with arms wide, surrounded by world landmarks, fireworks, and a passport full of stamps",
    "badge": "🎉✈️⭐",
    "titleEn": "Tour Complete!",
    "en": "The tour is complete! You named <b>independent and dependent variables</b>, tested rules like <b>y = x + 5</b> against tables, matched tables to graphs, and wrote <b>c = 15d</b> to predict a price. Every rule held up. Brilliant work, Abena!",
    "es": "¡El viaje está completo! Nombraste variables independientes y dependientes, probaste reglas como y = x + 5 con tablas, emparejaste tablas con gráficas y escribiste c = 15d para predecir un precio. ¡Excelente trabajo, Abena!",
    "master": {
      "headingEn": "Prove your rank to certify your Master Certificate!",
      "promptEn": "A taxi charges <strong>$3 per km</strong>, so the cost is <strong>c = 3k</strong> (k = km). A passenger pays <strong>$27</strong>. Which statement is correct?",
      "promptEs": "Un taxi cobra $3 por km, así que el costo es c = 3k (k = km). Un pasajero paga $27. ¿Qué afirmación es correcta?",
      "choices": [
        {
          "en": "A) k (distance) is independent, and 27 = 3k gives k = 9 km &nbsp;✅",
          "correct": true
        },
        {
          "en": "B) c (cost) is independent, and the ride was 9 km &nbsp;(the roles are swapped)",
          "correct": false
        },
        {
          "en": "C) k (distance) is independent, and the ride was 30 km &nbsp;(added 27 + 3)",
          "correct": false
        }
      ],
      "goodEn": "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      "badEn": "❌ That is incorrect. Review your calculations and try another option!",
      "certifyTitle": "🏆 Master Certified: Mission Complete!"
    }
  }
};
