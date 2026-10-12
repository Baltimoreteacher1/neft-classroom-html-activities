/* Graphic Novel Story · u11-1 — Unit 9: Relationships Between Two Variables (6.AT.11). Sequel to Global Travel Planner. */
window.GN_STORY = {
  "meta": {
    "unit": 9,
    "version": 1,
    "level": "Support",
    "title": "Global Travel Planner: Route Relationships",
    "standard": "6.AT.11",
    "readingStandard": "RL.6.1",
    "assessment": "Graphic Novel U9 #1: Global Travel Planner: Route Relationships",
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
      "name": "Lina Haddad",
      "role": "protagonist",
      "color": "#0d9488",
      "tagIcon": "🧭",
      "blurb": "Junior Expedition Navigator · Table & Graph Lead",
      "portrait": {
        "skin": "#eab68c",
        "hair": "#3b2314",
        "hairStyle": 3,
        "gear": "goggles"
      }
    },
    "compass": {
      "name": "ATLAS-1",
      "role": "companion",
      "color": "#d97706",
      "tagIcon": "🤖",
      "blurb": "Pocket travel drone · mixes up which variable depends on which",
      "portrait": {
        "bot": true,
        "accent": "#d97706"
      },
      "figure": "../_art/characters/u3-compass.png"
    },
    "log": {
      "name": "Prof. Imani Boateng",
      "role": "specialist",
      "color": "#7c3aed",
      "tagIcon": "📈",
      "blurb": "Chief Data Cartographer · Graph Reading Lead",
      "portrait": {
        "outfit": "blazer",
        "skin": "#8d522c",
        "hair": "#0f172a",
        "hairStyle": "curly",
        "glasses": true,
        "earrings": true
      }
    }
  },
  "cover": {
    "art": "cover.png",
    "alt": "Lina stands on a giant glowing globe holding a travel map with airplane trails arcing between landmarks",
    "blurbEn": "Welcome back, <b>Lina</b>! The world tour keeps going, and now every stop records <b>two things that change together</b>. Name the <b>independent</b> and <b>dependent variables</b>, read tables and graphs, and write a rule for each route. ATLAS-1 wants to help… but it keeps mixing up which variable depends on which. Catch the mix-ups!",
    "blurbEs": "¡Bienvenida de nuevo, Lina! El viaje continúa y ahora cada parada anota dos cantidades que cambian juntas. Nombra las variables independiente y dependiente, lee tablas y gráficas y escribe una regla para cada ruta. ATLAS-1 confunde cuál variable depende de cuál. ¡Atrapa sus errores!",
    "startLabel": "Start the Tour ✈️"
  },
  "acts": [
    {
      "id": "act1",
      "tab": "Act 1: Paris Variables",
      "kicker": "Act 1 · Variables & Tables",
      "title": "Paris: Two Things That Change",
      "advanceLabel": "Fly to Tokyo ✈️",
      "steps": [
        {
          "type": "beats",
          "art": "ratios-compare.png",
          "alt": "Lina stands in front of the Eiffel Tower holding passports, with a glowing comparison floating beside her",
          "lastLabel": "Name the variables ▶",
          "beats": [
            {
              "who": "log",
              "en": "Welcome back, Lina! This tour log tracks two quantities that change together. Name them correctly to open the gate.",
              "es": "¡Bienvenida de nuevo, Lina! Esta bitácora anota dos cantidades que cambian juntas. Nómbralas bien para abrir la puerta.",
              "caption": true
            },
            {
              "who": "traveler",
              "en": "A variable is a quantity that can change. The hours we ride change, and so do the miles we travel.",
              "es": "Una variable es una cantidad que puede cambiar. Las horas de viaje cambian y las millas recorridas también.",
              "vocab": [
                {
                  "term": "variable",
                  "en": "A letter or quantity that can change, like hours or miles.",
                  "es": "Una letra o cantidad que puede cambiar, como las horas o las millas."
                }
              ]
            },
            {
              "who": "log",
              "en": "The one you CHOOSE is the independent variable. The one that RESULTS from your choice is called the dependent one.",
              "es": "La que tú ELIGES es la variable independiente. La que RESULTA de tu elección es la dependiente.",
              "caption": true,
              "vocab": [
                {
                  "term": "independent variable",
                  "en": "The quantity you choose or control. Its value does not depend on the other one.",
                  "es": "La cantidad que tú eliges o controlas. Su valor no depende de la otra."
                }
              ]
            },
            {
              "who": "traveler",
              "en": "I choose how many hours to ride, and the miles depend on that. So miles is the dependent variable.",
              "es": "Yo elijo cuántas horas viajar y las millas dependen de eso. Así que las millas son la variable dependiente.",
              "vocab": [
                {
                  "term": "dependent variable",
                  "en": "The quantity that changes because of the other one. Its value depends on the independent variable.",
                  "es": "La cantidad que cambia por causa de la otra. Su valor depende de la variable independiente."
                }
              ]
            },
            {
              "who": "compass",
              "en": "Easy! Miles come first in the log, so miles is the independent variable and hours depend on miles!",
              "es": "¡Fácil! Las millas van primero en la bitácora, así que las millas son la variable independiente y las horas dependen de las millas.",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "1a",
          "ask": {
            "who": "log",
            "en": "The bus rides at a steady speed. Lina chooses how many <b>hours</b> to ride, and the odometer then shows the <b>miles</b> traveled. Which pair is correct?",
            "es": "El autobús va a velocidad constante. Lina elige cuántas horas viajar y el odómetro muestra las millas recorridas. ¿Qué pareja es correcta?"
          },
          "hint": {
            "en": "Ask: which one does Lina choose? That one is independent. The other one depends on it.",
            "es": "Pregunta: ¿cuál elige Lina? Esa es la independiente. La otra depende de ella."
          },
          "choices": [
            {
              "en": "Independent: hours Lina chooses · Dependent: miles traveled",
              "es": "Independiente: horas que elige Lina · Dependiente: millas recorridas",
              "correct": true
            },
            {
              "en": "Independent: miles traveled · Dependent: hours (the two are swapped)",
              "es": "Independiente: millas · Dependiente: horas (están cambiadas)",
              "correct": false,
              "why": {
                "en": "❌ The two are swapped. Lina chooses the hours, so miles depend on hours. Try again.",
                "es": "Están cambiadas. Lina elige las horas, así que las millas dependen de las horas."
              }
            },
            {
              "en": "Both are independent because both numbers change",
              "es": "Las dos son independientes porque las dos cambian",
              "correct": false,
              "why": {
                "en": "❌ Both numbers change, but only one is chosen. The other one depends on it.",
                "es": "Las dos cambian, pero solo una se elige. La otra depende de ella."
              }
            }
          ],
          "goodEn": "✅ Hours are independent (Lina chooses them) and miles are dependent (they result). Gate one is open!",
          "goodEs": "¡Las horas son independientes (Lina las elige) y las millas son dependientes! La primera puerta se abrió.",
          "badEn": "❌ Ask which quantity Lina chooses. That one is the independent variable.",
          "badEs": "Pregunta qué cantidad elige Lina. Esa es la variable independiente.",
          "help": {
            "conceptual": {
              "en": "❌ Ask which quantity Lina chooses. That one is the independent variable.",
              "es": "Pregunta qué cantidad elige Lina. Esa es la variable independiente."
            },
            "procedural": {
              "en": "Ask: which one does Lina choose? That one is independent. The other one depends on it.",
              "es": "Pregunta: ¿cuál elige Lina? Esa es la independiente. La otra depende de ella."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "frame": {
            "en": "“The ____ is independent because Lina chooses it, and the ____ is dependent.”",
            "es": "“Las ____ son independientes porque Lina las elige, y las ____ son dependientes.”"
          },
          "solveBeat": {
            "who": "traveler",
            "en": "Gate one is open! Now the bus table: I need the next number in the pattern.",
            "es": "¡La primera puerta se abrió! Ahora la tabla del autobús: necesito el siguiente número del patrón."
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
            "en": "In the story, what is a <b>dependent variable</b>?",
            "es": "En la historia, ¿qué es una <b>variable dependiente</b>?"
          },
          "hint": {
            "en": "Think about the miles on the odometer. What do they depend on?",
            "es": "Piensa en las millas del odómetro. ¿De qué dependen?"
          },
          "choices": [
            {
              "en": "The quantity that changes because of the other one, like miles depending on hours.",
              "es": "La cantidad que cambia por causa de la otra, como las millas que dependen de las horas.",
              "correct": true
            },
            {
              "en": "The quantity you choose first.",
              "es": "La cantidad que eliges primero.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Any number written in the tour log.",
              "es": "Cualquier número escrito en la bitácora.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ]
        },
        {
          "type": "beats",
          "art": "ratios-compare.png",
          "alt": "Lina studies a glowing table of hours and miles beside the Eiffel Tower",
          "lastLabel": "Fill the table ▶",
          "beats": [
            {
              "who": "compass",
              "en": "Table time! Hours: 1, 2, 3, 4. Miles: 45, 90, 135 … Hours go up by 1, so miles go up by 1 too. That makes 136!",
              "es": "¡Hora de la tabla! Horas: 1, 2, 3, 4. Millas: 45, 90, 135 … Las horas suben de 1 en 1, así que las millas también. ¡Son 136!",
              "misconception": true,
              "vocab": [
                {
                  "term": "Table",
                  "en": "A grid that lists matching values, like hours and miles, side by side.",
                  "es": "Una cuadrícula que muestra valores que van juntos, como horas y millas."
                }
              ]
            }
          ]
        },
        {
          "type": "challenge",
          "id": "1b",
          "ask": {
            "who": "traveler",
            "en": "Each extra hour adds the <b>same number of miles</b>. Finish the table. <br><br>Hours: 1, 2, 3, 4 → Miles: 45, 90, 135, ?<br><br>How many miles after <b>4 hours</b>?",
            "es": "Cada hora extra suma las mismas millas. Completa la tabla. ¿Cuántas millas después de 4 horas?"
          },
          "hint": {
            "en": "Look at how the miles change from one row to the next: 90 − 45 = 45 and 135 − 90 = 45. Add 45 again.",
            "es": "Mira cómo cambian las millas de una fila a la siguiente: 90 − 45 = 45 y 135 − 90 = 45. Suma 45 otra vez."
          },
          "choices": [
            {
              "en": "180 miles (each hour adds 45: 135 + 45)",
              "es": "180 millas (cada hora suma 45: 135 + 45)",
              "correct": true
            },
            {
              "en": "136 miles (hours went up by 1, so miles went up by 1)",
              "es": "136 millas (las horas subieron 1, así que las millas subieron 1)",
              "correct": false,
              "why": {
                "en": "❌ The miles do not go up by the same amount as the hours. Check the table: miles go up by 45 each row.",
                "es": "Las millas no suben igual que las horas. Mira la tabla: las millas suben 45 en cada fila."
              }
            },
            {
              "en": "225 miles (that is hour 5: 135 + 90)",
              "es": "225 millas (eso es la hora 5: 135 + 90)",
              "correct": false,
              "why": {
                "en": "❌ 225 miles is for hour 5. Hour 4 is just one more step of 45 after 135.",
                "es": "225 millas es para la hora 5. La hora 4 es solo un paso más de 45 después de 135."
              }
            }
          ],
          "goodEn": "✅ Each hour adds 45 miles, so after 4 hours: 135 + 45 = 180 miles. PARIS UNLOCKED!",
          "goodEs": "¡Cada hora suma 45 millas, así que después de 4 horas: 135 + 45 = 180! ¡París desbloqueado!",
          "badEn": "❌ Find how much the miles change in one row (45), then add that to 135.",
          "badEs": "Halla cuánto cambian las millas en una fila (45) y súmalo a 135.",
          "help": {
            "conceptual": {
              "en": "❌ Find how much the miles change in one row (45), then add that to 135.",
              "es": "Halla cuánto cambian las millas en una fila (45) y súmalo a 135."
            },
            "procedural": {
              "en": "Look at how the miles change from one row to the next: 90 − 45 = 45 and 135 − 90 = 45. Add 45 again.",
              "es": "Mira cómo cambian las millas de una fila a la siguiente: 90 − 45 = 45 y 135 − 90 = 45. Suma 45 otra vez."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "frame": {
            "en": "“Each hour adds ____ miles, so after 4 hours the miles are ____.”",
            "es": "“Cada hora suma ____ millas, así que después de 4 horas son ____ millas.”"
          },
          "solveArt": "unlock.png",
          "solveAlt": "A glowing gateway opens to reveal pyramids as Lina cheers with raised fists",
          "solveBeat": {
            "who": "traveler",
            "en": "The gateway opens to the pyramids! On to Tokyo to read a graph.",
            "es": "¡La puerta se abre hacia las pirámides! Sigue Tokio para leer una gráfica."
          }
        },
        {
          "type": "comprehension",
          "id": "c2",
          "skill": "cite_evidence",
          "standard": "RL.6.1",
          "dok": 2,
          "interaction": "evidence",
          "passageRef": "act1.beats",
          "ask": {
            "who": "log",
            "en": "Tap the line that shows ATLAS-1 <b>mixed up</b> the independent and dependent variables.",
            "es": "Toca la línea que muestra que ATLAS-1 <b>confundió</b> las variables independiente y dependiente."
          },
          "choices": [
            {
              "en": "“Miles come first in the log, so miles is the independent variable and hours depend on miles!”",
              "es": "“Las millas van primero en la bitácora, así que las millas son la variable independiente y las horas dependen de las millas.”",
              "correct": true
            },
            {
              "en": "“I choose how many hours to ride, and the miles depend on that.”",
              "es": "“Yo elijo cuántas horas viajar y las millas dependen de eso.”",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "“A variable is a quantity that can change.”",
              "es": "“Una variable es una cantidad que puede cambiar.”",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ]
        }
      ]
    },
    {
      "id": "act2",
      "tab": "Act 2: Tokyo Graphs",
      "kicker": "Act 2 · Graphs",
      "title": "Tokyo: Read the Graph",
      "advanceLabel": "To the Master Map ✈️",
      "steps": [
        {
          "type": "beats",
          "art": "ratio-table.png",
          "alt": "Lina draws a glowing table and a rising line graph in the air on a Tokyo street",
          "lastLabel": "Read the graph ▶",
          "beats": [
            {
              "who": "log",
              "en": "Tokyo! A graph draws a relationship as points. The independent variable goes on the horizontal x-axis and the dependent variable on the vertical y-axis.",
              "es": "¡Tokio! Una gráfica dibuja una relación con puntos. La variable independiente va en el eje x horizontal y la dependiente en el eje y vertical.",
              "caption": true
            },
            {
              "who": "traveler",
              "en": "Each point is an ordered pair (x, y): first the independent value, then the dependent value.",
              "es": "Cada punto es un par ordenado (x, y): primero el valor independiente y luego el dependiente.",
              "vocab": [
                {
                  "term": "ordered pair",
                  "en": "Two numbers (x, y) that name one point. x is the independent value and y is the dependent value.",
                  "es": "Dos números (x, y) que nombran un punto. x es el valor independiente y y es el dependiente."
                }
              ]
            },
            {
              "who": "compass",
              "en": "The Tokyo train graph has a point at (3, 150). I read the y-number first, so that's 150 hours and 3 km!",
              "es": "La gráfica del tren de Tokio tiene un punto en (3, 150). Leo primero el número de y, ¡así que son 150 horas y 3 km!",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "2a",
          "ask": {
            "who": "log",
            "en": "The Tokyo train graph has <b>hours</b> on the x-axis and <b>km</b> on the y-axis. Its points are (1, 50), (2, 100), and (3, 150). What does the point <b>(3, 150)</b> tell you?",
            "es": "La gráfica del tren de Tokio tiene las horas en el eje x y los km en el eje y. Sus puntos son (1, 50), (2, 100) y (3, 150). ¿Qué te dice el punto (3, 150)?"
          },
          "hint": {
            "en": "The first number is x (hours). The second number is y (km). Read x first.",
            "es": "El primer número es x (horas). El segundo es y (km). Lee x primero."
          },
          "choices": [
            {
              "en": "After 3 hours the train has gone 150 km.",
              "es": "Después de 3 horas el tren ha recorrido 150 km.",
              "correct": true
            },
            {
              "en": "After 150 hours the train has gone 3 km. (x and y are swapped)",
              "es": "Después de 150 horas el tren ha recorrido 3 km. (x y y están cambiadas)",
              "correct": false,
              "why": {
                "en": "❌ x is hours, so read the first number as hours: 3. Then y, the km, is 150.",
                "es": "x son las horas, así que lee el primer número como horas: 3. Luego y, los km, es 150."
              }
            },
            {
              "en": "The train goes 3 km every hour. (3 is the number of hours, not a speed)",
              "es": "El tren va 3 km cada hora. (3 son las horas, no una velocidad)",
              "correct": false,
              "why": {
                "en": "❌ The 3 is the x-value: hours. It is not a speed. The point says 3 hours → 150 km.",
                "es": "El 3 es el valor de x: horas. No es una velocidad. El punto dice 3 horas → 150 km."
              }
            }
          ],
          "goodEn": "✅ (3, 150) means x = 3 hours and y = 150 km. Always read x first, then y!",
          "goodEs": "¡(3, 150) significa x = 3 horas y y = 150 km! Lee siempre x primero y luego y.",
          "badEn": "❌ Read the ordered pair in order: x first (hours), then y (km).",
          "badEs": "Lee el par ordenado en orden: primero x (horas) y luego y (km).",
          "help": {
            "conceptual": {
              "en": "❌ Read the ordered pair in order: x first (hours), then y (km).",
              "es": "Lee el par ordenado en orden: primero x (horas) y luego y (km)."
            },
            "procedural": {
              "en": "The first number is x (hours). The second number is y (km). Read x first.",
              "es": "El primer número es x (horas). El segundo es y (km). Lee x primero."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "frame": {
            "en": "“At x = ____ hours, the train has gone y = ____ km.”",
            "es": "“En x = ____ horas, el tren ha recorrido y = ____ km.”"
          },
          "solveBeat": {
            "who": "traveler",
            "en": "3 hours, 150 km. Reading x first keeps the axes straight!",
            "es": "3 horas, 150 km. ¡Leer x primero mantiene los ejes en orden!"
          }
        },
        {
          "type": "comprehension",
          "id": "c3",
          "skill": "key_details",
          "standard": "RI.6.1",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "act2.2a",
          "ask": {
            "who": "log",
            "en": "Which two quantities does the Tokyo train graph compare?",
            "es": "¿Qué dos cantidades compara la gráfica del tren de Tokio?"
          },
          "choices": [
            {
              "en": "Hours (x-axis) and km (y-axis).",
              "es": "Horas (eje x) y km (eje y).",
              "correct": true
            },
            {
              "en": "Km and liters of fuel.",
              "es": "Km y litros de combustible.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Hours and the number of passports.",
              "es": "Horas y número de pasaportes.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ]
        },
        {
          "type": "beats",
          "art": "ratio-table.png",
          "alt": "Lina compares a glowing table with the points on a rising graph in Tokyo",
          "lastLabel": "Match the table ▶",
          "beats": [
            {
              "who": "log",
              "en": "Now match a table to the graph. Every point on the graph is one row in the table.",
              "es": "Ahora empareja una tabla con la gráfica. Cada punto de la gráfica es una fila de la tabla.",
              "caption": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "2b",
          "ask": {
            "who": "traveler",
            "en": "Which table gives the <b>same points</b> as the graph (1, 50), (2, 100), (3, 150)?",
            "es": "¿Qué tabla da los mismos puntos que la gráfica (1, 50), (2, 100), (3, 150)?"
          },
          "hint": {
            "en": "Put the x-values in the first row and the y-values in the second row.",
            "es": "Pon los valores de x en la primera fila y los de y en la segunda."
          },
          "choices": [
            {
              "en": "Hours: 1, 2, 3 → Km: 50, 100, 150",
              "es": "Horas: 1, 2, 3 → Km: 50, 100, 150",
              "correct": true
            },
            {
              "en": "Hours: 50, 100, 150 → Km: 1, 2, 3 (x and y swapped)",
              "es": "Horas: 50, 100, 150 → Km: 1, 2, 3 (x y y cambiadas)",
              "correct": false,
              "why": {
                "en": "❌ Here x and y trade places. The x-values are 1, 2, 3 and the y-values are 50, 100, 150.",
                "es": "Aquí x y y se cambian. Los valores de x son 1, 2, 3 y los de y son 50, 100, 150."
              }
            },
            {
              "en": "Hours: 1, 2, 3 → Km: 50, 50, 50 (the km never change)",
              "es": "Horas: 1, 2, 3 → Km: 50, 50, 50 (los km nunca cambian)",
              "correct": false,
              "why": {
                "en": "❌ On the graph the points go up. The km change each hour: 50, 100, 150.",
                "es": "En la gráfica los puntos suben. Los km cambian cada hora: 50, 100, 150."
              }
            }
          ],
          "goodEn": "✅ x-values (hours) go in one row and y-values (km) in the other: 1, 2, 3 and 50, 100, 150.",
          "goodEs": "¡Los valores de x (horas) van en una fila y los de y (km) en la otra: 1, 2, 3 y 50, 100, 150!",
          "badEn": "❌ Read each point (x, y) and put x in the hours row and y in the km row.",
          "badEs": "Lee cada punto (x, y) y pon x en la fila de horas y y en la de km.",
          "help": {
            "conceptual": {
              "en": "❌ Read each point (x, y) and put x in the hours row and y in the km row.",
              "es": "Lee cada punto (x, y) y pon x en la fila de horas y y en la de km."
            },
            "procedural": {
              "en": "Put the x-values in the first row and the y-values in the second row.",
              "es": "Pon los valores de x en la primera fila y los de y en la segunda."
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "traveler",
            "en": "The table matches every point. One more stop: the Master Map.",
            "es": "La tabla coincide con cada punto. Una parada más: el Mapa Maestro."
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
            "en": "What is Lina mainly learning in this chapter?",
            "es": "¿Qué aprende Lina principalmente en este capítulo?"
          },
          "choices": [
            {
              "en": "How to read points on a graph and match them to a table.",
              "es": "Cómo leer puntos en una gráfica y emparejarlos con una tabla.",
              "correct": true
            },
            {
              "en": "How to pack the bags for the flight home.",
              "es": "Cómo empacar las maletas para el vuelo de regreso.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "How to find the biggest number in a table.",
              "es": "Cómo hallar el número más grande de una tabla.",
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
            "en": "Put the steps for plotting the point (3, 150) in order.",
            "es": "Ordena los pasos para marcar el punto (3, 150)."
          },
          "items": [
            {
              "en": "Start at the origin (0, 0).",
              "es": "Empieza en el origen (0, 0).",
              "order": 1
            },
            {
              "en": "Move right 3 along the x-axis (hours).",
              "es": "Muévete 3 a la derecha en el eje x (horas).",
              "order": 2
            },
            {
              "en": "Move up 150 along the y-axis (km) and mark the point.",
              "es": "Sube 150 en el eje y (km) y marca el punto.",
              "order": 3
            }
          ]
        }
      ]
    },
    {
      "id": "final",
      "tab": "Final: Master Map",
      "kicker": "Final · Rules & Predictions",
      "title": "The Master Map",
      "advanceLabel": "Complete the Tour 🎉",
      "steps": [
        {
          "type": "beats",
          "art": "final-challenge.png",
          "alt": "Lina stands before a huge glowing globe gateway with tables and route lines orbiting her",
          "lastLabel": "Write the rule ▶",
          "beats": [
            {
              "who": "log",
              "en": "The Master Map needs a rule. An equation shows how the dependent variable depends on the independent one, like y = 50x.",
              "es": "El Mapa Maestro necesita una regla. Una ecuación muestra cómo la variable dependiente depende de la independiente, como y = 50x.",
              "caption": true,
              "vocab": [
                {
                  "term": "equation",
                  "en": "A math sentence with an equal sign, like y = 50x.",
                  "es": "Una oración matemática con signo igual, como y = 50x."
                }
              ]
            },
            {
              "who": "traveler",
              "en": "In y = 50x, x is the hours I choose and y is the km. Test x = 3: y = 50 × 3 = 150. That matches the point (3, 150).",
              "es": "En y = 50x, x son las horas que elijo y y son los km. Prueba x = 3: y = 50 × 3 = 150. Coincide con el punto (3, 150)."
            },
            {
              "who": "log",
              "en": "Write the dependent variable alone on the left: y = … Then use the equation to predict any trip.",
              "es": "Escribe la variable dependiente sola a la izquierda: y = … Luego usa la ecuación para predecir cualquier viaje.",
              "caption": true
            },
            {
              "who": "compass",
              "en": "Easy! The train goes 50 km an hour, so I'll write x = 50y. Km is x because 50 is the big number!",
              "es": "¡Fácil! El tren va 50 km por hora, así que escribo x = 50y. ¡Los km son x porque 50 es el número grande!",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "F",
          "ask": {
            "who": "traveler",
            "en": "The train goes <b>50 km every hour</b>. Let <b>x = hours</b> (independent) and <b>y = km</b> (dependent). Which equation matches, and how far does the train go in <b>6 hours</b>?",
            "es": "El tren va 50 km cada hora. Sea x = horas (independiente) y y = km (dependiente). ¿Qué ecuación coincide y cuántos km recorre en 6 horas?"
          },
          "hint": {
            "en": "Km depend on hours, so y goes alone on the left. y = 50 × x. For x = 6: 50 × 6 = ?",
            "es": "Los km dependen de las horas, así que y va sola a la izquierda. y = 50 × x. Para x = 6: 50 × 6 = ?"
          },
          "choices": [
            {
              "en": "y = 50x, so after 6 hours y = 300 km",
              "es": "y = 50x, así que después de 6 horas y = 300 km",
              "correct": true
            },
            {
              "en": "y = 50 + x, so after 6 hours y = 56 km",
              "es": "y = 50 + x, así que después de 6 horas y = 56 km",
              "correct": false,
              "why": {
                "en": "❌ The train adds 50 km for EACH hour, so multiply: 50 × 6. Adding 50 + 6 does not repeat the 50.",
                "es": "El tren suma 50 km por CADA hora, así que multiplica: 50 × 6. Sumar 50 + 6 no repite el 50."
              }
            },
            {
              "en": "x = 50y (the variables are swapped)",
              "es": "x = 50y (las variables están cambiadas)",
              "correct": false,
              "why": {
                "en": "❌ Here hours are written as 50 times km. Km depend on hours, so km (y) go alone: y = 50x.",
                "es": "Aquí las horas son 50 veces los km. Los km dependen de las horas, así que los km (y) van solos: y = 50x."
              }
            }
          ],
          "goodEn": "✅ GATEWAY OPEN! y = 50x, so x = 6 gives y = 50 × 6 = 300 km. The rule predicts the trip!",
          "goodEs": "¡PUERTA ABIERTA! y = 50x, así que x = 6 da y = 50 × 6 = 300 km. ¡La regla predice el viaje!",
          "badEn": "❌ y (km) depends on x (hours). Write y = 50x, then replace x with 6.",
          "badEs": "y (km) depende de x (horas). Escribe y = 50x y reemplaza x por 6.",
          "help": {
            "conceptual": {
              "en": "❌ y (km) depends on x (hours). Write y = 50x, then replace x with 6.",
              "es": "y (km) depende de x (horas). Escribe y = 50x y reemplaza x por 6."
            },
            "procedural": {
              "en": "Km depend on hours, so y goes alone on the left. y = 50 × x. For x = 6: 50 × 6 = ?",
              "es": "Los km dependen de las horas, así que y va sola a la izquierda. y = 50 × x. Para x = 6: 50 × 6 = ?"
            },
            "example": {
              "en": "Try the Math Lab with small numbers first, watch how the second number changes, then test the mission numbers.",
              "es": "Prueba el laboratorio con números pequeños primero, observa cómo cambia el segundo número y luego prueba los números de la misión."
            }
          },
          "frame": {
            "en": "“The equation is y = ____x, so after 6 hours y = ____ km.”",
            "es": "“La ecuación es y = ____x, así que después de 6 horas y = ____ km.”"
          },
          "solveBeat": {
            "who": "traveler",
            "en": "The Master Map is open! The whole tour is planned. Thanks, ATLAS-1, even the wrong guesses helped.",
            "es": "¡El Mapa Maestro está abierto! Todo el viaje está planeado. Gracias, ATLAS-1, hasta los errores ayudaron."
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
            "en": "ATLAS-1 keeps swapping the two variables. Why do its answers keep coming out wrong?",
            "es": "ATLAS-1 sigue cambiando las dos variables. ¿Por qué sus respuestas salen mal?"
          },
          "hint": {
            "en": "Look back: ATLAS-1 picked the variable by which number came first or looked bigger.",
            "es": "Mira atrás: ATLAS-1 eligió la variable por cuál número iba primero o parecía mayor."
          },
          "choices": [
            {
              "en": "It picks the variable by order or size instead of asking which one depends on the other.",
              "es": "Elige la variable por el orden o el tamaño en vez de preguntar cuál depende de la otra.",
              "correct": true
            },
            {
              "en": "It does not want Lina to finish the tour.",
              "es": "No quiere que Lina termine el viaje.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "The graph shows the wrong points.",
              "es": "La gráfica muestra puntos equivocados.",
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
          "id": "c7",
          "skill": "prediction",
          "standard": "RL.6.3",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "final",
          "ask": {
            "who": "log",
            "en": "The Master Map is open. What will Lina most likely do next?",
            "es": "El Mapa Maestro está abierto. ¿Qué hará Lina probablemente después?"
          },
          "choices": [
            {
              "en": "Use equations like y = 50x to predict distances on the rest of the tour.",
              "es": "Usar ecuaciones como y = 50x para predecir distancias en el resto del viaje.",
              "correct": true
            },
            {
              "en": "Erase the Tokyo graph and start over.",
              "es": "Borrar la gráfica de Tokio y empezar de nuevo.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Stop naming variables for good.",
              "es": "Dejar de nombrar variables para siempre.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ]
        }
      ]
    }
  ],
  "glossary": [
    {
      "ico": "🔁",
      "en": "Variable",
      "es": "variable",
      "def": "A letter or quantity that can change, like hours or miles."
    },
    {
      "ico": "🎛️",
      "en": "Independent variable",
      "es": "variable independiente",
      "def": "The quantity you choose or control. Hours of travel is independent."
    },
    {
      "ico": "➡️",
      "en": "Dependent variable",
      "es": "variable dependiente",
      "def": "The quantity that changes because of the other. Miles depend on hours."
    },
    {
      "ico": "📋",
      "en": "Table",
      "es": "tabla",
      "def": "A grid that lists matching values, like hours and miles."
    },
    {
      "ico": "📈",
      "en": "Graph",
      "es": "gráfica",
      "def": "A picture of a relationship made of points."
    },
    {
      "ico": "📍",
      "en": "Ordered pair",
      "es": "par ordenado",
      "def": "Two numbers (x, y) that name one point. Read x first, then y."
    },
    {
      "ico": "↔️",
      "en": "x-axis",
      "es": "eje x",
      "def": "The horizontal number line. The independent variable goes here."
    },
    {
      "ico": "↕️",
      "en": "y-axis",
      "es": "eje y",
      "def": "The vertical number line. The dependent variable goes here."
    },
    {
      "ico": "🟰",
      "en": "Equation",
      "es": "ecuación",
      "def": "A math sentence with an equal sign, like y = 50x."
    }
  ],
  "complete": {
    "art": "celebrate.png",
    "alt": "Lina celebrates with arms wide, surrounded by world landmarks, fireworks, and a passport full of stamps",
    "badge": "🎉✈️⭐",
    "titleEn": "Tour Complete!",
    "en": "You finished the tour! You named <b>independent and dependent variables</b>, filled tables, read points on graphs, and wrote the rule <b>y = 50x</b> to predict a trip. Your passport is full of stamps. Amazing work, Lina!",
    "es": "¡Terminaste el viaje! Nombraste variables independientes y dependientes, completaste tablas, leíste puntos en gráficas y escribiste la regla y = 50x para predecir un viaje. ¡Excelente trabajo, Lina!",
    "master": {
      "headingEn": "Prove your rank to certify your Master Certificate!",
      "promptEn": "A bike rental costs <strong>$4 for each hour</strong>. Let <strong>h</strong> = hours (independent) and <strong>c</strong> = cost (dependent). Which equation matches, and what is the cost for <strong>5 hours</strong>?",
      "promptEs": "Una bicicleta de alquiler cuesta $4 por cada hora. Sea h = horas (independiente) y c = costo (dependiente). ¿Qué ecuación coincide y cuánto cuestan 5 horas?",
      "choices": [
        {
          "en": "A) c = 4h, so 5 hours cost $20 &nbsp;✅",
          "correct": true
        },
        {
          "en": "B) c = 4 + h, so 5 hours cost $9 &nbsp;(added instead of multiplying)",
          "correct": false
        },
        {
          "en": "C) h = 4c, so 5 hours cost $1.25 &nbsp;(the variables are swapped)",
          "correct": false
        }
      ],
      "goodEn": "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      "badEn": "❌ That is incorrect. Review your calculations and try another option!",
      "certifyTitle": "🏆 Master Certified: Mission Complete!"
    }
  }
};
