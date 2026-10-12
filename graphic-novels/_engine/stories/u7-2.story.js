/* Upgraded Publisher-Grade Graphic Novel Story · u7-2.story.js */
window.GN_STORY = {
  "meta": {
    "unit": 7,
    "version": 2,
    "level": "Enrichment",
    "title": "Detective Case Files: The Equation Mysteries",
    "standard": "6.AT.8",
    "readingStandard": "RL.6.1",
    "assessment": "Graphic Novel U7 #2: Detective Case Files: The Equation Mysteries",
    "artBase": "../_art/unit7/",
    "home": "../index.html",
    "artFocus": {
      "aha.png": [
        52,
        42
      ],
      "cover.png": [
        45,
        25
      ],
      "evidence-room.png": [
        35,
        25
      ],
      "final-case.png": [
        55,
        25
      ],
      "solved.png": [
        65,
        48
      ],
      "unlock-box.png": [
        55,
        35
      ],
      "write-equation.png": [
        48,
        30
      ]
    }
  },
  "cast": {
    "detective": {
      "name": "Det. Jonah Sterling",
      "role": "protagonist",
      "color": "#1e293b",
      "tagIcon": "🕵️‍♂️",
      "blurb": "Special Taskforce Lead · Inequality & Boundary Specialist",
      "portrait": {
        "skin": "#b87244",
        "hair": "#0f172a",
        "hairStyle": 1,
        "gear": "fedora"
      }
    },
    "gumshoe": {
      "name": "CIPHER-9",
      "role": "companion",
      "color": "#0284c7",
      "tagIcon": "🤖",
      "blurb": "Case analyzer · changes only one side and mixes up open (<, >) and closed (≤, ≥) circles",
      "portrait": {
        "bot": true,
        "accent": "#0284c7"
      },
      "figure": "../_art/characters/u1-axis.png",
      "figureTint": 150
    },
    "log": {
      "name": "Judge Camille Devereaux",
      "role": "specialist",
      "color": "#047857",
      "tagIcon": "🏛️",
      "blurb": "District Warrant Arbiter · Constraints & Proof Expert",
      "portrait": {
        "outfit": "judge",
        "skin": "#d89668",
        "hair": "#9ca3af",
        "hairStyle": "bun",
        "gray": true,
        "glasses": true,
        "earrings": true
      }
    }
  },
  "cover": {
    "art": "cover.png",
    "alt": "A young detective stands in a cozy office at night with a board of clues and a locked evidence box",
    "blurbEn": "<b>Det. Jonah</b> has inherited the precinct&rsquo;s coldest cases. Every locked box guards an unknown quantity, and every door has a limit. Your job: <b>write equations and inequalities</b> from clues, <b>solve</b> one-step equations, <b>graph</b> inequalities on a number line, and <b>check</b> every answer. CIPHER-9, your keen rookie partner, keeps balancing only ONE side and mixing up open and closed circles &mdash; catch it. &#11088; Each act hides an <b>optional</b> Captain&rsquo;s Challenge: bonus glory only.",
    "blurbEs": "Det. Jonah heredó los casos más fríos. Cada caja guarda una cantidad desconocida y cada puerta tiene un límite. Tu trabajo: escribir ecuaciones y desigualdades, resolver ecuaciones de un paso, graficar desigualdades y comprobar cada respuesta. CIPHER-9 cambia solo UN lado y confunde los círculos abiertos y cerrados: ¡atrápalo!",
    "startLabel": "Open the Case &#128373;&#65039;"
  },
  "acts": [
    {
      "id": "act1",
      "tab": "Act 1: The First Clue",
      "kicker": "Act 1 · Write Equations & Inequalities",
      "title": "The First Clue",
      "advanceLabel": "File the clues &#128373;&#65039;",
      "steps": [
        {
          "type": "beats",
          "art": "evidence-room.png",
          "alt": "The detective examines a wall of clues with a magnifying glass",
          "lastLabel": "Read the clue ▶",
          "beats": [
            {
              "who": "log",
              "en": "Midnight at the precinct. The coldest files land on the desk — each one an unknown, or a limit, waiting to be named.",
              "es": "Medianoche en la comisaría. Los casos más fríos llegan al escritorio: cada uno es un valor desconocido o un límite por nombrar.",
              "caption": true
            },
            {
              "who": "detective",
              "en": "Words are math in disguise. I name the unknown with a variable, then write what the clue says: an equation if it says \"equals\", an inequality if it gives a limit.",
              "es": "Las palabras son matemáticas disfrazadas. Nombro lo desconocido con una variable y escribo lo que dice la pista."
            },
            {
              "who": "log",
              "en": "The exact words decide the symbol: \"more than\" is >, \"at least\" is ≥, \"fewer than\" is <, \"at most\" is ≤.",
              "es": "Las palabras exactas deciden el símbolo: \"más que\" es >, \"al menos\" es ≥, \"menos que\" es <, \"como máximo\" es ≤.",
              "caption": true
            },
            {
              "who": "gumshoe",
              "en": "The alarm sounds at least 30 bills? \"At least\" sounds small, so that's b < 30.",
              "es": "¿La alarma suena con al menos 30 billetes? \"Al menos\" suena pequeño, así que es b < 30.",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "1a",
          "ask": {
            "who": "log",
            "en": "Wait — the case file says: &ldquo;The vault alarm sounds when it holds <b>at least 30</b> bills.&rdquo; Let b = the number of bills. Which <b>inequality</b> models the clue?",
            "es": "Espera: el caso dice que la alarma suena cuando la bóveda tiene al menos 30 billetes. Sea b el número de billetes. ¿Qué desigualdad modela la pista?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> \"At least 30\" means 30 or MORE. That is greater than or equal to: b ≥ 30.",
            "es": "💡 <b>Pista:</b> \"Al menos 30\" significa 30 o MÁS: b ≥ 30."
          },
          "choices": [
            {
              "en": "b ≥ 30<span class=\"calc\">30 or more bills</span>",
              "es": "b ≥ 30 (30 o más billetes)",
              "correct": true
            },
            {
              "en": "b &lt; 30<span class=\"calc\">fewer than 30 bills</span>",
              "es": "b < 30 (menos de 30 billetes)",
              "correct": false,
              "why": {
                "en": "❌ b < 30 means FEWER than 30. \"At least 30\" means 30 or more.",
                "es": "b < 30 significa MENOS de 30. \"Al menos 30\" es 30 o más."
              }
            },
            {
              "en": "b ≤ 30<span class=\"calc\">30 or fewer bills</span>",
              "es": "b ≤ 30 (30 o menos billetes)",
              "correct": false,
              "why": {
                "en": "❌ b ≤ 30 means 30 or FEWER. The alarm sounds at 30 or MORE.",
                "es": "b ≤ 30 es 30 o MENOS. La alarma suena con 30 o MÁS."
              }
            }
          ],
          "goodEn": "✅ \"At least 30\" means 30 or more, so b ≥ 30. Clue modeled.",
          "goodEs": "✅ \"Al menos 30\" es 30 o más, así que b ≥ 30. Pista modelada.",
          "badEn": "❌ Decide the direction first: \"at least\" means 30 or more.",
          "badEs": "Decide primero la dirección: \"al menos\" es 30 o más.",
          "help": {
            "conceptual": {
              "en": "❌ Decide the direction first: \"at least\" means 30 or more.",
              "es": "Decide primero la dirección: \"al menos\" es 30 o más."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> \"At least 30\" means 30 or MORE. That is greater than or equal to: b ≥ 30.",
              "es": "💡 <b>Pista:</b> \"Al menos 30\" significa 30 o MÁS: b ≥ 30."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "detective",
            "en": "First clue modeled. Now a lab note about fingerprints, an equation this time.",
            "es": "Primera pista modelada. Ahora una nota del laboratorio sobre huellas: esta vez una ecuación."
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
            "en": "In this case file, what does the word <b>inequality</b> mean?",
            "es": "En este caso, ¿qué significa la palabra <b>desigualdad</b>?"
          },
          "hint": {
            "en": "Think about the vault alarm: it sounds for MANY possible numbers of bills.",
            "es": "Piensa en la alarma: suena para MUCHOS números posibles de billetes."
          },
          "choices": [
            {
              "en": "A statement that compares amounts using <, >, ≤, or ≥.",
              "es": "Un enunciado que compara cantidades con <, >, ≤ o ≥.",
              "correct": true
            },
            {
              "en": "The final code that opens a locked evidence box.",
              "es": "El código final que abre una caja de evidencia.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "A clue that tells you to multiply.",
              "es": "Una pista que dice que multipliques.",
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
          "id": "c2",
          "skill": "key_details",
          "standard": "RI.6.1",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "act1.1a",
          "ask": {
            "who": "log",
            "en": "In the vault clue, when does the alarm sound?",
            "es": "En la pista de la bóveda, ¿cuándo suena la alarma?"
          },
          "choices": [
            {
              "en": "When the vault holds 30 or more bills.",
              "es": "Cuando la bóveda tiene 30 o más billetes.",
              "correct": true
            },
            {
              "en": "Only when the vault holds exactly 30 bills.",
              "es": "Solo cuando tiene exactamente 30 billetes.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "When the vault holds fewer than 30 bills.",
              "es": "Cuando tiene menos de 30 billetes.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ]
        },
        {
          "type": "challenge",
          "id": "1b",
          "ask": {
            "who": "log",
            "en": "Lab note: &ldquo;After <b>8</b> fingerprints were removed from the stack, <b>15</b> were left.&rdquo; Let f = how many fingerprints were in the stack at first. Write the <b>equation</b>.",
            "es": "Nota del laboratorio: después de quitar 8 huellas de la pila, quedaron 15. Sea f el número de huellas al principio. Escribe la ecuación."
          },
          "hint": {
            "en": "💡 <b>Hint:</b> Start with f, take away 8, leaves 15: f − 8 = 15.",
            "es": "💡 <b>Pista:</b> Empiezas con f, quitas 8 y quedan 15: f − 8 = 15."
          },
          "choices": [
            {
              "en": "f − 8 = 15<span class=\"calc\">start, take away 8, 15 left</span>",
              "es": "f − 8 = 15 (empiezas, quitas 8, quedan 15)",
              "correct": true
            },
            {
              "en": "f + 8 = 15<span class=\"calc\">this adds 8</span>",
              "es": "f + 8 = 15 (suma 8)",
              "correct": false,
              "why": {
                "en": "❌ Fingerprints were REMOVED, so subtract: f − 8.",
                "es": "Las huellas se QUITARON: resta f − 8."
              }
            },
            {
              "en": "8 − f = 15<span class=\"calc\">this starts with only 8</span>",
              "es": "8 − f = 15 (empieza solo con 8)",
              "correct": false,
              "why": {
                "en": "❌ The stack started with f, not 8. Write f first, then take away 8.",
                "es": "La pila empezó con f, no con 8. Escribe f y luego quita 8."
              }
            }
          ],
          "goodEn": "✅ \"Removed 8\" means subtract: f − 8 = 15. Equation written.",
          "goodEs": "✅ \"Quitar 8\" es restar: f − 8 = 15. Ecuación escrita.",
          "badEn": "❌ Removed means subtract from the starting amount f.",
          "badEs": "Quitar significa restar de la cantidad inicial f.",
          "help": {
            "conceptual": {
              "en": "❌ Removed means subtract from the starting amount f.",
              "es": "Quitar significa restar de la cantidad inicial f."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> Start with f, take away 8, leaves 15: f − 8 = 15.",
              "es": "💡 <b>Pista:</b> Empiezas con f, quitas 8 y quedan 15: f − 8 = 15."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "solveArt": "write-equation.png",
          "solveAlt": "Detective Jonah writes equations at his desk under a warm lamp",
          "solveBeat": {
            "who": "log",
            "en": "Optional: a coded memo gives a limit on the evidence boxes. Worth a look, Detective?",
            "es": "Opcional: una nota codificada da un límite para las cajas de evidencia. ¿Le echas un vistazo, Detective?"
          }
        },
        {
          "type": "comprehension",
          "id": "c3",
          "skill": "cite_evidence",
          "standard": "RL.6.1",
          "dok": 2,
          "interaction": "evidence",
          "passageRef": "act1.1a",
          "ask": {
            "who": "log",
            "en": "Tap the line that shows the symbol for \"at least\" is ≥ (30 or more).",
            "es": "Toca la línea que muestra que el símbolo de \"al menos\" es ≥ (30 o más)."
          },
          "choices": [
            {
              "en": "“The vault alarm sounds when it holds at least 30 bills.”",
              "es": "“La alarma suena cuando la bóveda tiene al menos 30 billetes.”",
              "correct": true
            },
            {
              "en": "“Words are math in disguise.”",
              "es": "“Las palabras son matemáticas disfrazadas.”",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "“Midnight at the precinct.”",
              "es": "“Medianoche en la comisaría.”",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ]
        },
        {
          "type": "challenge",
          "id": "B1",
          "ask": {
            "who": "log",
            "en": "Optional: a coded memo says, &ldquo;Each evidence box may hold <b>no more than 12</b> files.&rdquo; Let f = the number of files in a box. Which <b>inequality</b> models it?",
            "es": "Opcional: una nota dice que cada caja puede tener como máximo 12 archivos. Sea f el número de archivos. ¿Qué desigualdad la modela?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> \"No more than 12\" means 12 or fewer: f ≤ 12.",
            "es": "💡 <b>Pista:</b> \"No más de 12\" es 12 o menos: f ≤ 12."
          },
          "choices": [
            {
              "en": "f ≤ 12<span class=\"calc\">12 or fewer files</span>",
              "es": "f ≤ 12 (12 o menos archivos)",
              "correct": true
            },
            {
              "en": "f &lt; 12<span class=\"calc\">12 itself is not allowed</span>",
              "es": "f < 12 (12 no se permite)",
              "correct": false,
              "why": {
                "en": "❌ A box may hold exactly 12, so 12 must be allowed: use ≤, not <.",
                "es": "Una caja puede tener exactamente 12, así que 12 debe permitirse: usa ≤."
              }
            },
            {
              "en": "f ≥ 12<span class=\"calc\">12 or more files</span>",
              "es": "f ≥ 12 (12 o más archivos)",
              "correct": false,
              "why": {
                "en": "❌ \"No more than\" is a ceiling, so 12 or FEWER.",
                "es": "\"No más de\" es un techo: 12 o MENOS."
              }
            }
          ],
          "goodEn": "⭐ \"No more than 12\" is 12 or fewer: f ≤ 12. Bonus claimed!",
          "goodEs": "⭐ \"No más de 12\" es 12 o menos: f ≤ 12. ¡Bono obtenido!",
          "badEn": "❌ \"No more than\" means the limit itself is allowed, and nothing above it.",
          "badEs": "\"No más de\" permite el límite y nada por encima.",
          "help": {
            "conceptual": {
              "en": "❌ \"No more than\" means the limit itself is allowed, and nothing above it.",
              "es": "\"No más de\" permite el límite y nada por encima."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> \"No more than 12\" means 12 or fewer: f ≤ 12.",
              "es": "💡 <b>Pista:</b> \"No más de 12\" es 12 o menos: f ≤ 12."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "optional": true,
          "solveBeat": {
            "who": "detective",
            "en": "Memo decoded. Both clues filed — to the evidence room.",
            "es": "Nota decodificada. Ambas pistas archivadas: a la sala de evidencia."
          }
        }
      ]
    },
    {
      "id": "act2",
      "tab": "Act 2: The Locked Boxes",
      "kicker": "Act 2 · Solve & Graph",
      "title": "The Locked Boxes",
      "advanceLabel": "Open the next case &#128273;",
      "steps": [
        {
          "type": "beats",
          "art": "unlock-box.png",
          "alt": "Detective Jonah opens a locked evidence box with golden light pouring out",
          "lastLabel": "Solve box one ▶",
          "beats": [
            {
              "who": "log",
              "en": "The evidence room. Each box's code is the solution of an equation. Each door has a rule that many numbers can satisfy.",
              "es": "La sala de evidencia. El código de cada caja es la solución de una ecuación. Cada puerta tiene una regla que cumplen muchos números.",
              "caption": true
            },
            {
              "who": "detective",
              "en": "For an equation I undo with the inverse operation, on both sides. For an inequality I test a number to see if it makes the rule true.",
              "es": "En una ecuación deshago con la operación inversa, en ambos lados. En una desigualdad pruebo un número para ver si cumple la regla."
            },
            {
              "who": "log",
              "en": "On a number line graph, an open circle means the number is NOT a solution (< or >). A closed circle means it IS (≤ or ≥). The arrow points to all the solutions.",
              "es": "En la recta numérica, un círculo abierto significa que el número NO es solución (< o >). Uno cerrado significa que SÍ lo es (≤ o ≥). La flecha apunta a todas las soluciones.",
              "caption": true
            },
            {
              "who": "gumshoe",
              "en": "x ÷ 6 = 9? I'll just add 6 to the x side: x = 15. Lock's open, surely!",
              "es": "¿x ÷ 6 = 9? Solo sumo 6 al lado de x: x = 15. ¡Seguro que abre!",
              "misconception": true
            }
          ]
        },
        {
          "type": "comprehension",
          "id": "c4",
          "skill": "main_idea",
          "standard": "RI.6.2",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "act2.beat1",
          "ask": {
            "who": "log",
            "en": "What is the Detective's main goal in the evidence room?"
          },
          "choices": [
            {
              "en": "Use inverse operations to isolate each variable and verify the code that opens a locked box.",
              "correct": true
            },
            {
              "en": "Translate the very first paper clue into an equation.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            },
            {
              "en": "Count how many evidence boxes are stacked in the room.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            }
          ]
        },
        {
          "type": "challenge",
          "id": "2a",
          "ask": {
            "who": "gumshoe",
            "en": "Hold on &mdash; the first lock opens to the value of <b>x</b>. Isolate the variable and find the code: <b>x / 6 = 9</b>. Don't lock it at x = 15!"
          },
          "choices": [
            {
              "en": "x = 54 (multiply both sides by 6: 9 &times; 6).",
              "correct": true
            },
            {
              "en": "x = 15 (this added 6).",
              "correct": false,
              "why": {
                "en": "&#10060; Division by 6 is undone by MULTIPLYING both sides by 6: x = 9 &times; 6. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            },
            {
              "en": "x = 1.5 (this divided 9 by 6).",
              "correct": false,
              "why": {
                "en": "&#10060; Division by 6 is undone by MULTIPLYING both sides by 6: x = 9 &times; 6. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            }
          ],
          "goodEn": "&#9989; x &divide; 6 = 9, so multiply both sides by 6: x = 54. Check: 54 &divide; 6 = 9. Lock released.",
          "badEn": "&#10060; Division by 6 is undone by MULTIPLYING both sides by 6: x = 9 &times; 6.",
          "solveBeat": {
            "who": "detective",
            "en": "One-step lock cleared. This next box takes two moves &mdash; peel off the constant, then undo the coefficient."
          },
          "help": {
            "conceptual": {
              "en": "&#10060; Division by 6 is undone by MULTIPLYING both sides by 6: x = 9 &times; 6.",
              "es": "Haz una pausa y verifica qué cantidad es el total o la base."
            },
            "procedural": {
              "en": "Step 1: Model the numbers in the Interactive Math Lab. Step 2: Check the readout equation.",
              "es": "Paso 1: Modela los números en el laboratorio interactivo."
            },
            "example": {
              "en": "Try sliding the Interactive Math Lab controls to a simpler benchmark number first, observe the pattern, and then set it to the mission numbers!",
              "es": "Prueba deslizar los controles del laboratorio a un número de referencia más simple primero."
            }
          }
        },
        {
          "type": "challenge",
          "id": "2b",
          "ask": {
            "who": "log",
            "en": "The second door opens only for a <b>solution</b> of <b>x + 4 &gt; 9</b>. Which number is a solution?",
            "es": "La segunda puerta solo abre con una solución de x + 4 > 9. ¿Qué número es una solución?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> Test each number: is x + 4 greater than 9? Be careful with 5: 5 + 4 = 9, and 9 is not greater than 9.",
            "es": "💡 <b>Pista:</b> Prueba cada número: ¿x + 4 es mayor que 9? Cuidado con 5: 5 + 4 = 9 y 9 no es mayor que 9."
          },
          "choices": [
            {
              "en": "x = 7<span class=\"calc\">7 + 4 = 11, and 11 &gt; 9 ✓</span>",
              "es": "x = 7 (7 + 4 = 11 y 11 > 9)",
              "correct": true
            },
            {
              "en": "x = 5<span class=\"calc\">5 + 4 = 9, but 9 is not &gt; 9</span>",
              "es": "x = 5 (5 + 4 = 9, pero 9 no es > 9)",
              "correct": false,
              "why": {
                "en": "❌ 5 + 4 = 9 and 9 is NOT greater than 9. 5 is the boundary: it gets an OPEN circle.",
                "es": "5 + 4 = 9 y 9 NO es mayor que 9. 5 es el límite: lleva círculo ABIERTO."
              }
            },
            {
              "en": "x = 4<span class=\"calc\">4 + 4 = 8, and 8 &lt; 9</span>",
              "es": "x = 4 (4 + 4 = 8 y 8 < 9)",
              "correct": false,
              "why": {
                "en": "❌ 4 + 4 = 8, which is less than 9. A solution must make the statement true.",
                "es": "4 + 4 = 8, que es menor que 9. Una solución debe hacer verdadero el enunciado."
              }
            }
          ],
          "goodEn": "✅ 7 + 4 = 11 > 9, so 7 is a solution. 5 is only the boundary (9 is not > 9). Door open.",
          "goodEs": "✅ 7 + 4 = 11 > 9, así que 7 es solución. 5 es solo el límite. Puerta abierta.",
          "badEn": "❌ Substitute the number into x + 4 and check whether the result is greater than 9.",
          "badEs": "Sustituye el número en x + 4 y comprueba si el resultado es mayor que 9.",
          "help": {
            "conceptual": {
              "en": "❌ Substitute the number into x + 4 and check whether the result is greater than 9.",
              "es": "Sustituye el número en x + 4 y comprueba si el resultado es mayor que 9."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> Test each number: is x + 4 greater than 9? Be careful with 5: 5 + 4 = 9, and 9 is not greater than 9.",
              "es": "💡 <b>Pista:</b> Prueba cada número: ¿x + 4 es mayor que 9? Cuidado con 5: 5 + 4 = 9 y 9 no es mayor que 9."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "log",
            "en": "Optional: a tampered file shows a graph. Care to read it before signing off?",
            "es": "Opcional: un archivo alterado muestra una gráfica. ¿Quieres leerla antes de firmar?"
          }
        },
        {
          "type": "challenge",
          "id": "B2",
          "ask": {
            "who": "log",
            "en": "A file shows the inequality <b>x ≥ 3</b>. Which description matches its <b>number line graph</b>?",
            "es": "Un archivo muestra la desigualdad x ≥ 3. ¿Qué descripción coincide con su gráfica en la recta numérica?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> ≥ includes 3, so the circle is closed. \"Greater than\" points right.",
            "es": "💡 <b>Pista:</b> ≥ incluye 3, así que el círculo es cerrado. \"Mayor que\" apunta a la derecha."
          },
          "choices": [
            {
              "en": "A closed circle at 3 with an arrow to the right<span class=\"calc\">3 is included; bigger numbers shaded</span>",
              "es": "Círculo cerrado en 3 con flecha a la derecha",
              "correct": true
            },
            {
              "en": "An open circle at 3 with an arrow to the right<span class=\"calc\">this is x &gt; 3</span>",
              "es": "Círculo abierto en 3 con flecha a la derecha",
              "correct": false,
              "why": {
                "en": "❌ An open circle leaves 3 out. x ≥ 3 includes 3, so the circle must be closed.",
                "es": "Un círculo abierto deja fuera el 3. x ≥ 3 incluye el 3: el círculo es cerrado."
              }
            },
            {
              "en": "A closed circle at 3 with an arrow to the left<span class=\"calc\">this is x ≤ 3</span>",
              "es": "Círculo cerrado en 3 con flecha a la izquierda",
              "correct": false,
              "why": {
                "en": "❌ The arrow shows the direction of the solutions: x ≥ 3 means 3 and numbers GREATER, so right.",
                "es": "La flecha muestra la dirección: x ≥ 3 es 3 y números MAYORES, a la derecha."
              }
            }
          ],
          "goodEn": "⭐ x ≥ 3: closed circle at 3 (included), arrow right (greater numbers). Bonus claimed!",
          "goodEs": "⭐ x ≥ 3: círculo cerrado en 3 (incluido), flecha a la derecha. ¡Bono obtenido!",
          "badEn": "❌ Closed circle = included (≤, ≥). Arrow right = greater, arrow left = less.",
          "badEs": "Círculo cerrado = incluido (≤, ≥). Flecha a la derecha = mayor.",
          "help": {
            "conceptual": {
              "en": "❌ Closed circle = included (≤, ≥). Arrow right = greater, arrow left = less.",
              "es": "Círculo cerrado = incluido (≤, ≥). Flecha a la derecha = mayor."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> ≥ includes 3, so the circle is closed. \"Greater than\" points right.",
              "es": "💡 <b>Pista:</b> ≥ incluye 3, así que el círculo es cerrado. \"Mayor que\" apunta a la derecha."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "optional": true,
          "solveBeat": {
            "who": "detective",
            "en": "Graph verified. Both boxes open — the Vault Mystery is next.",
            "es": "Gráfica verificada. Ambas cajas abiertas: sigue el Misterio de la Bóveda."
          }
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
            "en": "Put the Detective's steps for solving the lock <b>x ÷ 6 = 9</b> in the correct order.",
            "es": "Ordena los pasos del Detective para resolver la cerradura x ÷ 6 = 9."
          },
          "items": [
            {
              "en": "Notice that x is being divided by 6.",
              "es": "Observa que x se divide entre 6.",
              "order": 1
            },
            {
              "en": "Multiply both sides by 6 to get x = 54.",
              "es": "Multiplica ambos lados por 6 y obtén x = 54.",
              "order": 2
            },
            {
              "en": "Substitute 54 back in to check: 54 ÷ 6 = 9.",
              "es": "Sustituye 54 para comprobar: 54 ÷ 6 = 9.",
              "order": 3
            }
          ]
        }
      ]
    },
    {
      "id": "final",
      "tab": "Final Case",
      "kicker": "Final Case · Boss",
      "title": "The Vault Mystery",
      "advanceLabel": "Crack the Vault &#127775;",
      "steps": [
        {
          "type": "beats",
          "art": "final-case.png",
          "alt": "Detective Jonah faces a giant vault door covered in locks and dials",
          "lastLabel": "Enter the vault ▶",
          "beats": [
            {
              "who": "log",
              "en": "The grand vault — the case behind every case. Its lock demands the full method: write it, solve it, check it.",
              "es": "La bóveda principal, el caso detrás de todos los casos. Su cerradura exige el método completo: escribir, resolver y comprobar.",
              "caption": true
            },
            {
              "who": "detective",
              "en": "I write the equation or inequality from the story, solve it with the inverse operation, and test a number to be sure. One airtight line opens this door.",
              "es": "Escribo la ecuación o desigualdad de la historia, la resuelvo con la operación inversa y pruebo un número para estar seguro."
            },
            {
              "who": "log",
              "en": "The vault accepts a code only when it is written, solved, AND checked — all three, in order.",
              "es": "La bóveda acepta un código solo cuando está escrito, resuelto Y comprobado: los tres, en orden.",
              "caption": true
            },
            {
              "who": "gumshoe",
              "en": "5 + c ≥ 18? I'll add 5 to 18 and say c ≥ 23. Done!",
              "es": "¿5 + c ≥ 18? Sumo 5 a 18 y digo c ≥ 23. ¡Listo!",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "F",
          "ask": {
            "who": "log",
            "en": "Careful, CIPHER-9. The vault code must be <b>at least 18</b>. The guard already entered <b>5</b> and adds <b>c</b> more, so <b>5 + c ≥ 18</b>. Which line shows the <b>correct solution</b>?",
            "es": "Cuidado, CIPHER-9. El código de la bóveda debe ser al menos 18. El guardia ya ingresó 5 y suma c más, así que 5 + c ≥ 18. ¿Qué línea muestra la solución correcta?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> To undo + 5, subtract 5 from both sides: c ≥ 18 − 5 = 13.",
            "es": "💡 <b>Pista:</b> Para deshacer + 5, resta 5 en ambos lados: c ≥ 18 − 5 = 13."
          },
          "choices": [
            {
              "en": "c ≥ 13<span class=\"calc\">subtract 5 from both sides: 18 − 5 = 13</span>",
              "es": "c ≥ 13 (resta 5 de ambos lados)",
              "correct": true
            },
            {
              "en": "c ≥ 23<span class=\"calc\">this added 5 instead of subtracting</span>",
              "es": "c ≥ 23 (sumó 5 en vez de restar)",
              "correct": false,
              "why": {
                "en": "❌ To undo + 5, use the inverse: subtract 5. Check: 23 + 5 = 28, far more than 18.",
                "es": "Para deshacer + 5 usa la inversa: resta 5."
              }
            },
            {
              "en": "c ≤ 13<span class=\"calc\">the inequality sign was flipped</span>",
              "es": "c ≤ 13 (cambió el signo)",
              "correct": false,
              "why": {
                "en": "❌ The code must be AT LEAST 18, so the sign stays ≥. Test c = 20: 5 + 20 = 25 ≥ 18 ✓, but c ≤ 13 would reject it.",
                "es": "El código debe ser AL MENOS 18, así que el signo sigue siendo ≥."
              }
            }
          ],
          "goodEn": "✅ VAULT OPEN! 5 + c ≥ 18 → subtract 5 → c ≥ 13. Check c = 13: 5 + 13 = 18 ✓.",
          "goodEs": "✅ ¡BÓVEDA ABIERTA! 5 + c ≥ 18 → restar 5 → c ≥ 13. Comprobación c = 13: 5 + 13 = 18 ✓.",
          "badEn": "❌ Undo + 5 with subtraction on both sides, and keep the ≥ sign.",
          "badEs": "Deshaz + 5 restando en ambos lados y conserva el signo ≥.",
          "help": {
            "conceptual": {
              "en": "❌ Undo + 5 with subtraction on both sides, and keep the ≥ sign.",
              "es": "Deshaz + 5 restando en ambos lados y conserva el signo ≥."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> To undo + 5, subtract 5 from both sides: c ≥ 18 − 5 = 13.",
              "es": "💡 <b>Pista:</b> Para deshacer + 5, resta 5 en ambos lados: c ≥ 18 − 5 = 13."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "log",
            "en": "Optional: behind the vault sits a smaller safe with a limit of its own.",
            "es": "Opcional: detrás de la bóveda hay una caja más pequeña con su propio límite."
          }
        },
        {
          "type": "challenge",
          "id": "BF",
          "ask": {
            "who": "log",
            "en": "Optional: the inner safe holds <b>at most 40</b> coins and already has <b>15</b>. Let c = how many MORE coins fit. Which inequality models and solves it?",
            "es": "Opcional: la caja interior guarda como máximo 40 monedas y ya tiene 15. Sea c las monedas que caben todavía. ¿Qué desigualdad lo modela y resuelve?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> c + 15 ≤ 40. Subtract 15 from both sides: c ≤ 25.",
            "es": "💡 <b>Pista:</b> c + 15 ≤ 40. Resta 15 de ambos lados: c ≤ 25."
          },
          "choices": [
            {
              "en": "c + 15 ≤ 40, so c ≤ 25<span class=\"calc\">40 − 15 = 25</span>",
              "es": "c + 15 ≤ 40, así c ≤ 25",
              "correct": true
            },
            {
              "en": "c + 15 ≤ 40, so c ≤ 55<span class=\"calc\">added 15 instead of subtracting</span>",
              "es": "c + 15 ≤ 40, así c ≤ 55",
              "correct": false,
              "why": {
                "en": "❌ To undo + 15, subtract 15: 40 − 15 = 25.",
                "es": "Para deshacer + 15, resta 15: 40 − 15 = 25."
              }
            },
            {
              "en": "c + 15 ≥ 40, so c ≥ 25<span class=\"calc\">\"at most\" was read as \"at least\"</span>",
              "es": "c + 15 ≥ 40, así c ≥ 25",
              "correct": false,
              "why": {
                "en": "❌ \"At most 40\" is a ceiling: ≤, not ≥.",
                "es": "\"Como máximo 40\" es un techo: ≤, no ≥."
              }
            }
          ],
          "goodEn": "⭐ c + 15 ≤ 40 → c ≤ 25. Check c = 25: 25 + 15 = 40 ✓. Inner safe cracked.",
          "goodEs": "⭐ c + 15 ≤ 40 → c ≤ 25. Comprobación c = 25: 25 + 15 = 40 ✓.",
          "badEn": "❌ \"At most\" means ≤. Undo + 15 by subtracting 15 from both sides.",
          "badEs": "\"Como máximo\" es ≤. Deshaz + 15 restando 15 de ambos lados.",
          "help": {
            "conceptual": {
              "en": "❌ \"At most\" means ≤. Undo + 15 by subtracting 15 from both sides.",
              "es": "\"Como máximo\" es ≤. Deshaz + 15 restando 15 de ambos lados."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> c + 15 ≤ 40. Subtract 15 from both sides: c ≤ 25.",
              "es": "💡 <b>Pista:</b> c + 15 ≤ 40. Resta 15 de ambos lados: c ≤ 25."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "optional": true,
          "solveBeat": {
            "who": "detective",
            "en": "Inner safe cracked. The precinct's coldest case is officially closed.",
            "es": "Caja interior abierta. El caso más frío de la comisaría está oficialmente cerrado."
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
            "en": "Across every case, CIPHER-9 balances only ONE side and mixes up the inequality symbols. What can you infer about why CIPHER-9 keeps failing?",
            "es": "En cada caso, CIPHER-9 cambia solo UN lado y confunde los símbolos de desigualdad. ¿Qué puedes inferir sobre por qué falla?"
          },
          "hint": {
            "en": "Recall the rule the Case File repeats about both sides, and what each symbol means.",
            "es": "Recuerda la regla sobre ambos lados y lo que significa cada símbolo."
          },
          "choices": [
            {
              "en": "It changes only one side and guesses what the symbols mean, so the statement is no longer true and the code is wrong.",
              "es": "Cambia solo un lado y adivina qué significan los símbolos, así que el enunciado deja de ser verdadero y el código es incorrecto.",
              "correct": true
            },
            {
              "en": "CIPHER-9 secretly wants the vault to stay locked.",
              "es": "CIPHER-9 quiere en secreto que la bóveda siga cerrada.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "The clues are written in a code no one can translate.",
              "es": "Las pistas están en un código que nadie puede traducir.",
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
            "en": "The vault is open and the cold case is closed. What will the Detective most likely do with the next file on the desk?",
            "es": "La bóveda está abierta y el caso frío cerrado. ¿Qué hará probablemente el Detective con el siguiente archivo?"
          },
          "choices": [
            {
              "en": "Write its clues as an equation or inequality, solve it, and check the answer — the same airtight method.",
              "es": "Escribir sus pistas como ecuación o desigualdad, resolver y comprobar: el mismo método.",
              "correct": true
            },
            {
              "en": "Re-lock the inner safe and walk away from the precinct.",
              "es": "Volver a cerrar la caja interior y salir de la comisaría.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Let CIPHER-9 change only one side from now on.",
              "es": "Dejar que CIPHER-9 cambie solo un lado de ahora en adelante.",
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
      "ico": "&#119909;",
      "en": "Variable",
      "es": "variable",
      "def": "A letter that stands for an unknown number. In f − 8 = 15, f is the variable."
    },
    {
      "ico": "&#61;",
      "en": "Equation",
      "es": "ecuación",
      "def": "A statement that two expressions are equal. A solution is a value that makes it true."
    },
    {
      "ico": "&#8800;",
      "en": "Inequality",
      "es": "desigualdad",
      "def": "A statement that compares two amounts using <, >, ≤, or ≥. Example: b ≥ 30."
    },
    {
      "ico": "&#8596;",
      "en": "Inverse operation",
      "es": "operación inversa",
      "def": "The operation that undoes another. Addition and subtraction are inverses; multiplication and division are inverses."
    },
    {
      "ico": "&#9878;&#65039;",
      "en": "Balance / both sides",
      "es": "equilibrio / ambos lados",
      "def": "Whatever you do to one side of an equation, do to the other so it stays equal."
    },
    {
      "ico": "&#9989;",
      "en": "Solution of an inequality",
      "es": "solución de una desigualdad",
      "def": "Any number that makes the inequality true. For x + 4 > 9, the number 7 is a solution but 5 is not."
    },
    {
      "ico": "&#9898;",
      "en": "Open / closed circle",
      "es": "círculo abierto / cerrado",
      "def": "On a number line graph, an open circle means the number is NOT a solution (< or >). A closed circle means it IS (≤ or ≥)."
    },
    {
      "ico": "&#128269;",
      "en": "Verify / check",
      "es": "verificar / comprobar",
      "def": "Substitute your solution back into the original statement to confirm it is true."
    }
  ],
  "complete": {
    "art": "solved.png",
    "alt": "Detective Jonah celebrates with confetti as all the evidence boxes stand open",
    "badge": "&#127881;&#128373;&#65039;&#11088;",
    "titleEn": "Case Closed &mdash; Brilliantly Solved!",
    "en": "Masterful work, Detective. You wrote <b>equations</b> and <b>inequalities</b> from tangled clues, <b>solved</b> one-step locks, <b>graphed</b> solutions on the number line, and <b>checked</b> every answer. The precinct&rsquo;s coldest case is officially closed.",
    "es": "Trabajo magistral, Detective. Escribiste ecuaciones y desigualdades, resolviste cerraduras de un paso, graficaste soluciones en la recta numérica y comprobaste cada respuesta. El caso más frío está cerrado.",
    "master": {
      "headingEn": "Prove your rank to certify your Master Certificate!",
      "promptEn": "Case file equation: Solve for x: <strong>x − 9 = 14</strong>.",
      "promptEs": "Ecuación del caso: resuelve para x: <strong>x − 9 = 14</strong>.",
      "choices": [
        {
          "en": "A) x = 5 &nbsp;(subtracted 9 instead of adding it)",
          "correct": false
        },
        {
          "en": "B) x = 23 &nbsp;(x = 14 + 9) &nbsp;✅",
          "correct": true
        },
        {
          "en": "C) x = −5 &nbsp;(9 − 14)",
          "correct": false
        }
      ],
      "goodEn": "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      "badEn": "❌ That is incorrect. Review your calculations and try another option!",
      "certifyTitle": "🏆 Master Certified: Mission Complete!"
    }
  }
};
