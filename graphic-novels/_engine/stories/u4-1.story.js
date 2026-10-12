/* Upgraded Publisher-Grade Graphic Novel Story · u4-1.story.js */
window.GN_STORY = {
  "meta": {
    "unit": 4,
    "version": 1,
    "level": "Support",
    "title": "Shopping Mall Mogul &#128717;&#65039;",
    "standard": "6.AT.4",
    "readingStandard": "RL.6.1",
    "assessment": "Graphic Novel U4 #1: Shopping Mall Mogul",
    "artBase": "../_art/unit4/",
    "home": "../index.html",
    "artFocus": {
      "cover.png": [
        80,
        22
      ],
      "discount.png": [
        32,
        38
      ],
      "final-challenge.png": [
        50,
        38
      ],
      "finish.png": [
        50,
        20
      ],
      "mall-bustle.png": [
        50,
        30
      ],
      "unit-rate.png": [
        48,
        30
      ],
      "unlock.png": [
        52,
        35
      ]
    }
  },
  "cast": {
    "mogul": {
      "name": "Mateo Sterling",
      "role": "protagonist",
      "color": "#db2777",
      "tagIcon": "🛍️",
      "blurb": "Pop-Up Store Founder · Benchmark Percent Strategist",
      "portrait": {
        "skin": "#8d522c",
        "hair": "#1e293b",
        "hairStyle": 0,
        "glasses": true
      }
    },
    "penny": {
      "name": "TALLY-5",
      "role": "companion",
      "color": "#0284c7",
      "tagIcon": "🤖",
      "blurb": "Register bot · treats a percent like a plain dollar amount",
      "portrait": {
        "bot": true,
        "accent": "#0284c7"
      },
      "figure": "../_art/characters/u4-penny.png"
    },
    "helper": {
      "name": "Marcus Vance",
      "role": "specialist",
      "color": "#047857",
      "tagIcon": "🏷️",
      "blurb": "Atrium Retail Advisor · 10% & 25% Benchmark Coach",
      "portrait": {
        "outfit": "blazer",
        "skin": "#8d522c",
        "hair": "#0f172a",
        "hairStyle": "short",
        "beard": "goatee"
      }
    }
  },
  "cover": {
    "art": "cover.png",
    "alt": "A young entrepreneur smiles in front of a bright futuristic shopping mall with floating percent-off tags",
    "blurbEn": "You run a new shopping mall! Every shop opens when you read its sale sign correctly. Use <b>percents</b> to find the real savings and the real size of every crowd. TALLY-5 wants to help… but TALLY-5 keeps treating a percent like a plain dollar amount. Catch the mistakes and pack the mall!",
    "blurbEs": "¡Diriges un centro comercial nuevo! Cada tienda abre cuando lees bien su letrero de oferta. Usa los <b>porcentajes</b> para hallar el ahorro real. TALLY-5 trata el porcentaje como si fueran dólares: ¡atrapa sus errores!",
    "startLabel": "Open the Mall &#128717;&#65039;"
  },
  "acts": [
    {
      "id": "act1",
      "tab": "Act 1: Percent Power",
      "kicker": "Act 1 · Understand Percent",
      "title": "Percent Power",
      "advanceLabel": "Stock the shop &#128722;",
      "steps": [
        {
          "type": "beats",
          "art": "unit-rate.png",
          "alt": "Mateo holds two product boxes, each with a different percent sale tag",
          "lastLabel": "Stop TALLY-5 ▶",
          "beats": [
            {
              "who": "helper",
              "en": "Welcome, boss! Every sale sign in this mall is a PERCENT. A percent is a part out of 100.",
              "es": "¡Bienvenido, jefe! Cada letrero de oferta es un PORCENTAJE. Un porcentaje es una parte de 100.",
              "caption": true,
              "vocab": [
                {
                  "term": "percent",
                  "en": "A part out of 100. 30% means 30 out of every 100, or 30/100.",
                  "es": "Una parte de 100. 30% significa 30 de cada 100, o 30/100."
                }
              ]
            },
            {
              "who": "helper",
              "en": "30% means 30 out of every 100. A percent, a fraction, and a decimal are three ways to write the same amount.",
              "es": "30% significa 30 de cada 100. Un porcentaje, una fracción y un decimal son tres formas de escribir la misma cantidad.",
              "caption": true
            },
            {
              "who": "mogul",
              "en": "Got it. 30% is 30/100. To read any sign I just think \"out of 100\". Let me check the Game Shop floor.",
              "es": "Entendido. 30% es 30/100. Para leer un letrero pienso \"de cada 100\". Voy a revisar el piso de la tienda de juegos."
            },
            {
              "who": "penny",
              "en": "A 30% sale? That's $30 off every item!",
              "es": "¿Una oferta del 30%? ¡Son $30 de descuento en cada artículo!",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "1a",
          "ask": {
            "who": "helper",
            "en": "The Game Shop floor has <b>100</b> square tiles, and <b>40</b> of them are painted gold for the sale. What <b>percent</b> of the floor is gold?",
            "es": "El piso de la tienda tiene 100 baldosas y 40 están pintadas de dorado. ¿Qué porcentaje del piso es dorado?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> A percent is a part out of 100. 40 out of 100 = 40/100 = 40%.",
            "es": "💡 <b>Pista:</b> Un porcentaje es una parte de 100. 40 de 100 = 40/100 = 40%."
          },
          "choices": [
            {
              "en": "40%<span class=\"calc\">40 out of 100 = 40/100</span>",
              "es": "40% (40 de 100)",
              "correct": true
            },
            {
              "en": "4%<span class=\"calc\">that is only 4 out of 100</span>",
              "es": "4% (solo 4 de 100)",
              "correct": false,
              "why": {
                "en": "❌ 4% would be 4 tiles out of 100. Count the gold tiles: 40 out of 100. Try again.",
                "es": "4% serían 4 baldosas de 100. Hay 40 de 100."
              }
            },
            {
              "en": "60%<span class=\"calc\">those are the tiles that are NOT gold</span>",
              "es": "60% (las que NO son doradas)",
              "correct": false,
              "why": {
                "en": "❌ 60 tiles are NOT gold. The question asks about the gold ones: 40 out of 100.",
                "es": "60 baldosas NO son doradas. Pregunta por las doradas: 40 de 100."
              }
            }
          ],
          "goodEn": "✅ 40 out of 100 = 40/100 = 40%. A percent is always a part out of 100!",
          "goodEs": "¡40 de 100 = 40/100 = 40%! Un porcentaje siempre es una parte de 100.",
          "badEn": "❌ Count the gold tiles and write them out of 100. That number is the percent.",
          "badEs": "Cuenta las baldosas doradas y escríbelas de 100. Ese número es el porcentaje.",
          "help": {
            "conceptual": {
              "en": "❌ Count the gold tiles and write them out of 100. That number is the percent.",
              "es": "Cuenta las baldosas doradas y escríbelas de 100. Ese número es el porcentaje."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> A percent is a part out of 100. 40 out of 100 = 40/100 = 40%.",
              "es": "💡 <b>Pista:</b> Un porcentaje es una parte de 100. 40 de 100 = 40/100 = 40%."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "frame": {
            "en": "&ldquo;____ out of 100 tiles are gold, so ____% of the floor is gold.&rdquo;",
            "es": "“____ de 100 baldosas son doradas, así que el ____% del piso es dorado.”"
          },
          "solveBeat": {
            "who": "mogul",
            "en": "Yes! Percent means \"out of 100\". Now the Smoothie Bar wants its sign written as a percent.",
            "es": "¡Sí! Porcentaje significa \"de cada 100\". Ahora la barra de batidos quiere su letrero en porcentaje."
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
            "who": "helper",
            "en": "In the story, what does <b>percent</b> mean?",
            "es": "En la historia, ¿qué significa <b>por ciento</b>?"
          },
          "hint": {
            "en": "Think about the 100 gold-and-plain tiles on the Game Shop floor.",
            "es": "Piensa en las 100 baldosas del piso de la tienda de juegos."
          },
          "choices": [
            {
              "en": "A part out of 100, like 30% = 30 out of 100.",
              "es": "Una parte de 100, como 30% = 30 de 100.",
              "correct": true
            },
            {
              "en": "A number of dollars taken off the price.",
              "es": "Una cantidad de dólares que se resta al precio.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "The number of items in a package.",
              "es": "El número de artículos en un paquete.",
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
            "who": "mogul",
            "en": "The Smoothie Bar sign says <b>3/4</b> of today&rsquo;s cups are sold. Which <b>percent</b> is the same as 3/4?",
            "es": "El letrero de la barra de batidos dice que se vendieron 3/4 de los vasos. ¿Qué porcentaje es igual a 3/4?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> 3 ÷ 4 = 0.75, and 0.75 = 75/100 = 75%. (Or: 3/4 = 75/100.)",
            "es": "💡 <b>Pista:</b> 3 ÷ 4 = 0.75, y 0.75 = 75/100 = 75%."
          },
          "choices": [
            {
              "en": "75%<span class=\"calc\">3 ÷ 4 = 0.75 = 75%</span>",
              "es": "75% (3 ÷ 4 = 0.75)",
              "correct": true
            },
            {
              "en": "34%<span class=\"calc\">that just puts the 3 and the 4 together</span>",
              "es": "34% (junta el 3 y el 4)",
              "correct": false,
              "why": {
                "en": "❌ Don't glue the digits together. Divide: 3 ÷ 4 = 0.75, then 0.75 = 75%.",
                "es": "No juntes los dígitos. Divide: 3 ÷ 4 = 0.75, y 0.75 = 75%."
              }
            },
            {
              "en": "25%<span class=\"calc\">that is 1/4</span>",
              "es": "25% (eso es 1/4)",
              "correct": false,
              "why": {
                "en": "❌ 25% is 1/4. Three fourths is three times as much: 75%.",
                "es": "25% es 1/4. Tres cuartos es tres veces más: 75%."
              }
            }
          ],
          "goodEn": "✅ 3/4 = 0.75 = 75%. Fraction, decimal, and percent all name the same amount!",
          "goodEs": "¡3/4 = 0.75 = 75%! Fracción, decimal y porcentaje nombran la misma cantidad.",
          "badEn": "❌ Change the fraction to a decimal (top ÷ bottom), then move the dot two places to get a percent.",
          "badEs": "Cambia la fracción a decimal (arriba ÷ abajo) y mueve el punto dos lugares para obtener el porcentaje.",
          "help": {
            "conceptual": {
              "en": "❌ Change the fraction to a decimal (top ÷ bottom), then move the dot two places to get a percent.",
              "es": "Cambia la fracción a decimal (arriba ÷ abajo) y mueve el punto dos lugares para obtener el porcentaje."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> 3 ÷ 4 = 0.75, and 0.75 = 75/100 = 75%. (Or: 3/4 = 75/100.)",
              "es": "💡 <b>Pista:</b> 3 ÷ 4 = 0.75, y 0.75 = 75/100 = 75%."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "frame": {
            "en": "&ldquo;3/4 is the same as ____ out of 100, which is ____%.&rdquo;",
            "es": "“3/4 es lo mismo que ____ de 100, o sea ____%.”"
          },
          "solveArt": "unlock.png",
          "solveAlt": "Mateo pumps his fist as a new shop unlocks with golden light and confetti",
          "solveBeat": {
            "who": "mogul",
            "en": "75% — the Smoothie Bar sign is ready, and the shop is open! On to the big sale.",
            "es": "¡75%! El letrero está listo y la tienda abre. ¡Ahora la gran oferta!"
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
            "who": "helper",
            "en": "Which fraction is on the Smoothie Bar sign?",
            "es": "¿Qué fracción aparece en el letrero de la barra de batidos?"
          },
          "choices": [
            {
              "en": "3/4 of today's cups are sold.",
              "es": "Se vendieron 3/4 de los vasos de hoy.",
              "correct": true
            },
            {
              "en": "30% of today's cups are sold.",
              "es": "Se vendió el 30% de los vasos de hoy.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "1/4 of today's cups are sold.",
              "es": "Se vendió 1/4 de los vasos de hoy.",
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
          "id": "c3",
          "skill": "cite_evidence",
          "standard": "RL.6.1",
          "dok": 2,
          "interaction": "evidence",
          "passageRef": "act1.beats",
          "ask": {
            "who": "helper",
            "en": "Tap the line that shows TALLY-5 made a mistake about percent.",
            "es": "Toca la línea que muestra que TALLY-5 se equivocó con el porcentaje."
          },
          "choices": [
            {
              "en": "“A 30% sale? That's $30 off every item!”",
              "es": "“¿Una oferta del 30%? ¡Son $30 de descuento en cada artículo!”",
              "correct": true
            },
            {
              "en": "“30% means 30 out of every 100.”",
              "es": "“30% significa 30 de cada 100.”",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "“To read any sign I just think ‘out of 100’.”",
              "es": "“Para leer un letrero pienso ‘de cada 100’.”",
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
      "tab": "Act 2: Big Sale",
      "kicker": "Act 2 · Percents",
      "title": "The Big Sale",
      "advanceLabel": "Launch the sale &#127881;",
      "steps": [
        {
          "type": "beats",
          "art": "discount.png",
          "alt": "Mateo points at a shop covered in bright percent-off sale signs",
          "lastLabel": "Stop TALLY-5 ▶",
          "beats": [
            {
              "who": "helper",
              "caption": true,
              "en": "Big sale day! Shoppers love PERCENT OFF. A discount means you take part of the price away.",
              "es": "&iexcl;D&iacute;a de gran venta! A los clientes les encanta el PORCENTAJE DE DESCUENTO.",
              "vocab": [
                {
                  "term": "discount",
                  "en": "Money taken off the price during a sale. 25% off $40 = $10 off.",
                  "es": "Dinero que se quita del precio en una oferta. 25% de descuento de $40 = $10 menos."
                }
              ]
            },
            {
              "who": "helper",
              "caption": true,
              "en": "A bigger percent means a bigger discount. Your job today is to figure out the REAL savings so shoppers trust your signs.",
              "es": "Un porcentaje m&aacute;s grande significa un descuento m&aacute;s grande. Tu trabajo hoy es calcular el ahorro REAL para que los clientes conf&iacute;en en tus carteles."
            },
            {
              "who": "mogul",
              "en": "To find the discount, change the percent to a decimal and multiply. 25% off means 25% of the price comes off.",
              "es": "Para el descuento, cambio el porcentaje a decimal y multiplico. 25% de descuento."
            },
            {
              "who": "penny",
              "misconception": true,
              "en": "25% off $40? That's only $4 off — small numbers, small savings, right?",
              "es": "¿25% de descuento de $40? Eso es solo $4 menos — números pequeños, ahorro pequeño, ¿no?"
            }
          ]
        },
        {
          "type": "challenge",
          "id": "2a",
          "ask": {
            "who": "penny",
            "en": "A jacket costs <b>$40</b>. Today it is <b>25% off</b>. How much money do you <b>save</b> (the discount)?",
            "es": "&iquest;Cu&aacute;nto dinero ahorras con 25% de descuento de $40?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> 25% = 0.25. Discount = $40 &times; 0.25. (Or: 25% is &frac14; of $40.)"
          },
          "choices": [
            {
              "en": "$4 off<span class=\"calc\">that is only 10%</span>",
              "correct": false,
              "why": {
                "en": "&#10060; Change 25% to 0.25 and multiply: $40 &times; 0.25. Use the hint and try again. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Cambia 25% a 0.25 y multiplica: $40 &times; 0.25."
              }
            },
            {
              "en": "$10 off<span class=\"calc\">$40 &times; 0.25 = $10</span>",
              "correct": true
            },
            {
              "en": "$25 off<span class=\"calc\">25% is not $25</span>",
              "correct": false,
              "why": {
                "en": "&#10060; Change 25% to 0.25 and multiply: $40 &times; 0.25. Use the hint and try again. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Cambia 25% a 0.25 y multiplica: $40 &times; 0.25."
              }
            }
          ],
          "goodEn": "&#9989; Yes! $40 &times; 0.25 = $10 off. The sale price would be $40 &minus; $10 = $30. Shoppers love it!",
          "goodEs": "&iexcl;S&iacute;! $40 &times; 0.25 = $10 de descuento. Precio: $30.",
          "badEn": "&#10060; Change 25% to 0.25 and multiply: $40 &times; 0.25. Use the hint and try again.",
          "badEs": "Cambia 25% a 0.25 y multiplica: $40 &times; 0.25.",
          "solveBeat": {
            "who": "mogul",
            "en": "The crowd is growing! Now the signs use fractions, decimals, AND percents. They can all show the same value.",
            "es": "&iexcl;Hay m&aacute;s gente! Las fracciones, decimales y porcentajes pueden mostrar el mismo valor."
          },
          "help": {
            "conceptual": {
              "en": "&#10060; Change 25% to 0.25 and multiply: $40 &times; 0.25. Use the hint and try again.",
              "es": "Cambia 25% a 0.25 y multiplica: $40 &times; 0.25."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> 25% = 0.25. Discount = $40 &times; 0.25. (Or: 25% is &frac14; of $40.)",
              "es": "Paso 1: Modela los números en el laboratorio interactivo."
            },
            "example": {
              "en": "Try sliding the Interactive Math Lab controls to a simpler benchmark number first, observe the pattern, and then set it to the mission numbers!",
              "es": "Prueba deslizar los controles del laboratorio a un número de referencia más simple primero."
            }
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
            "who": "helper",
            "en": "What is the Mogul mainly trying to do in this chapter?",
            "es": "&iquest;Qu&eacute; intenta hacer el Mogul principalmente en este cap&iacute;tulo?"
          },
          "choices": [
            {
              "en": "Find the real savings from a percent discount so the sale is a great deal.",
              "es": "Hallar el ahorro real de un descuento en porcentaje para que la venta sea una gran oferta.",
              "correct": true
            },
            {
              "en": "Count how many tiles are painted gold.",
              "es": "Contar cuántas baldosas están pintadas de dorado.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Pick the sign with the biggest number on it.",
              "es": "Elegir el letrero con el número más grande.",
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
          "id": "2b",
          "ask": {
            "who": "mogul",
            "en": "The sale sign shows <b>0.75</b> of the price stays. A <b>fraction</b>, <b>decimal</b>, and <b>percent</b> can all show the SAME value. Which group all equals <b>0.75</b>?",
            "es": "&iquest;Cu&aacute;l grupo es igual a 0.75 (fracci&oacute;n, decimal y porcentaje)?",
            "vocab": [
              {
                "term": "decimal",
                "en": "A number with a dot to show parts of one. 0.75 means 75 hundredths.",
                "es": "Un número con punto que muestra partes de uno. 0.75 significa 75 centésimos."
              }
            ]
          },
          "hint": {
            "en": "💡 <b>Hint:</b> To make a decimal a percent, move the dot 2 places: 0.75 = 75%. And 75% = 75/100 = 3/4."
          },
          "frame": {
            "en": "&ldquo;25% of $40 is ____. The decimal 0.75 is the same as ____% and the fraction ____.&rdquo;"
          },
          "choices": [
            {
              "en": "3/4 = 0.75 = 75%",
              "correct": true
            },
            {
              "en": "3/4 = 0.34 = 34%",
              "correct": false,
              "why": {
                "en": "&#10060; Move the dot two places: 0.75 = 75%, and 75% = 75/100 = 3/4. Try again. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Mueve el punto dos lugares: 0.75 = 75% = 3/4."
              }
            },
            {
              "en": "7/5 = 0.75 = 7.5%",
              "correct": false,
              "why": {
                "en": "&#10060; Move the dot two places: 0.75 = 75%, and 75% = 75/100 = 3/4. Try again. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Mueve el punto dos lugares: 0.75 = 75% = 3/4."
              }
            }
          ],
          "goodEn": "&#9989; Perfect! 3/4 = 0.75 = 75%. The fraction, decimal, and percent all match. SALE IS LIVE!",
          "goodEs": "&iexcl;Perfecto! 3/4 = 0.75 = 75%. &iexcl;Venta activa!",
          "badEn": "&#10060; Move the dot two places: 0.75 = 75%, and 75% = 75/100 = 3/4. Try again.",
          "badEs": "Mueve el punto dos lugares: 0.75 = 75% = 3/4.",
          "solveBeat": {
            "who": "mogul",
            "en": "Sale is live and the mall is buzzing! Time for the Grand Opening headline deal.",
            "es": "¡La venta está activa y el centro comercial está lleno! Hora de la gran apertura."
          },
          "help": {
            "conceptual": {
              "en": "&#10060; Move the dot two places: 0.75 = 75%, and 75% = 75/100 = 3/4. Try again.",
              "es": "Mueve el punto dos lugares: 0.75 = 75% = 3/4."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> To make a decimal a percent, move the dot 2 places: 0.75 = 75%. And 75% = 75/100 = 3/4.",
              "es": "Paso 1: Modela los números en el laboratorio interactivo."
            },
            "example": {
              "en": "Try sliding the Interactive Math Lab controls to a simpler benchmark number first, observe the pattern, and then set it to the mission numbers!",
              "es": "Prueba deslizar los controles del laboratorio a un número de referencia más simple primero."
            }
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
            "who": "helper",
            "en": "Put the steps to find a 25% discount on a $40 jacket in order.",
            "es": "Ordena los pasos para hallar un descuento del 25% en una chaqueta de $40."
          },
          "items": [
            {
              "en": "Change 25% to the decimal 0.25.",
              "es": "Cambia 25% al decimal 0.25.",
              "order": 1
            },
            {
              "en": "Multiply $40 &times; 0.25 to get $10 off.",
              "es": "Multiplica $40 &times; 0.25 para obtener $10 de descuento.",
              "order": 2
            },
            {
              "en": "Subtract: $40 &minus; $10 = $30 sale price.",
              "es": "Resta: $40 &minus; $10 = $30 de precio de oferta.",
              "order": 3
            }
          ]
        }
      ]
    },
    {
      "id": "final",
      "tab": "Grand Opening",
      "kicker": "Grand Opening · Boss",
      "title": "The Best Deal of All",
      "advanceLabel": "Open the mall! &#127775;",
      "steps": [
        {
          "type": "beats",
          "art": "final-challenge.png",
          "alt": "Mateo stands before a giant mall command console with deal charts",
          "lastLabel": "Make the deal ▶",
          "beats": [
            {
              "who": "helper",
              "en": "It's the GRAND OPENING! The headline deal needs your percent skills: find a percent OF an amount, and work back to the WHOLE.",
              "es": "¡Es la GRAN INAUGURACIÓN! La oferta principal necesita tus destrezas de porcentaje: hallar un porcentaje de una cantidad y volver al TODO.",
              "caption": true
            },
            {
              "who": "helper",
              "en": "This is the number on every billboard in the city. If the math is right, the mall opens to a huge crowd, so work carefully.",
              "es": "Este es el número en cada cartelera de la ciudad. Si las matemáticas son correctas, el centro comercial abre con una gran multitud.",
              "caption": true
            },
            {
              "who": "mogul",
              "en": "Part, percent, whole. If I know two of them, I can find the third. Let's open this mall.",
              "es": "Parte, porcentaje, todo. Si sé dos, puedo hallar el tercero. ¡Vamos a abrir este centro comercial!"
            },
            {
              "who": "penny",
              "en": "30 shoppers got tote bags and that's 20% of the crowd, so the crowd is 30 + 20 = 50!",
              "es": "30 clientes recibieron bolsas y eso es el 20% de la multitud, ¡así que la multitud es 30 + 20 = 50!",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "F",
          "ask": {
            "who": "helper",
            "en": "Hold on, TALLY-5 — 20% is not 20 people. At the grand opening, <b>30</b> shoppers got free tote bags, and that was <b>20%</b> of the crowd. How many shoppers are in the <b>whole crowd</b>?",
            "es": "Espera, TALLY-5: 20% no son 20 personas. En la inauguración, 30 clientes recibieron bolsas gratis, y eso fue el 20% de la multitud. ¿Cuántos clientes hay en toda la multitud?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> 30 is 20% of the whole. 20% = 1/5, so the whole is 5 × 30. (Or: 30 ÷ 0.20.)",
            "es": "💡 <b>Pista:</b> 30 es el 20% del total. 20% = 1/5, así que el total es 5 × 30. (O: 30 ÷ 0.20.)"
          },
          "choices": [
            {
              "en": "150 shoppers<span class=\"calc\">30 ÷ 0.20 = 150</span>",
              "es": "150 clientes (30 ÷ 0.20 = 150)",
              "correct": true
            },
            {
              "en": "6 shoppers<span class=\"calc\">that is 20% of 30, not the whole</span>",
              "es": "6 clientes (el 20% de 30, no el total)",
              "correct": false,
              "why": {
                "en": "❌ 6 is 20% OF 30. But 30 is the part, and we want the whole. The whole must be bigger than 30.",
                "es": "6 es el 20% DE 30. Pero 30 es la parte y buscamos el total, que debe ser mayor que 30."
              }
            },
            {
              "en": "50 shoppers<span class=\"calc\">that is 30 + 20</span>",
              "es": "50 clientes (30 + 20)",
              "correct": false,
              "why": {
                "en": "❌ Percent is not added like dollars. 20% = 1/5, so 30 is one fifth of the crowd.",
                "es": "Un porcentaje no se suma como dólares. 20% = 1/5, así que 30 es un quinto de la multitud."
              }
            }
          ],
          "goodEn": "✅ HEADLINE DEAL! 20% = 1/5, so the whole crowd is 5 × 30 = 150. THE MALL IS OPEN!",
          "goodEs": "¡OFERTA PRINCIPAL! 20% = 1/5, así que toda la multitud es 5 × 30 = 150. ¡EL CENTRO COMERCIAL ESTÁ ABIERTO!",
          "badEn": "❌ 30 is the PART. Find the whole: if 20% = 1/5, then the whole is 5 times the part.",
          "badEs": "30 es la PARTE. Halla el total: si 20% = 1/5, el total es 5 veces la parte.",
          "help": {
            "conceptual": {
              "en": "❌ 30 is the PART. Find the whole: if 20% = 1/5, then the whole is 5 times the part.",
              "es": "30 es la PARTE. Halla el total: si 20% = 1/5, el total es 5 veces la parte."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> 30 is 20% of the whole. 20% = 1/5, so the whole is 5 × 30. (Or: 30 ÷ 0.20.)",
              "es": "💡 <b>Pista:</b> 30 es el 20% del total. 20% = 1/5, así que el total es 5 × 30. (O: 30 ÷ 0.20.)"
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "frame": {
            "en": "&ldquo;30 is 20% of the crowd, so the whole crowd is ____.&rdquo;",
            "es": "“30 es el 20% de la multitud, así que toda la multitud es ____.”"
          },
          "solveBeat": {
            "who": "mogul",
            "en": "Best deal in the mall! The doors are open and the crowd pours in. We did it, TALLY-5!",
            "es": "¡La mejor oferta del centro comercial! Las puertas están abiertas. ¡Lo logramos, TALLY-5!"
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
            "who": "helper",
            "en": "TALLY-5 keeps treating percents like dollars and skipping steps. Why does TALLY-5 keep getting the deals wrong?",
            "es": "TALLY-5 trata los porcentajes como dólares y se salta pasos. ¿Por qué TALLY-5 se equivoca con las ofertas?"
          },
          "hint": {
            "en": "Look back: TALLY-5 said 30% means $30, and that 20% means adding 20.",
            "es": "Mira atrás: TALLY-5 dijo que 30% son $30 y que 20% significa sumar 20."
          },
          "choices": [
            {
              "en": "TALLY-5 treats a percent like a plain number instead of a part out of 100, so its answers do not match the whole.",
              "es": "TALLY-5 trata el porcentaje como un número cualquiera en vez de una parte de 100, así que sus respuestas no coinciden con el total.",
              "correct": true
            },
            {
              "en": "TALLY-5 does not want the mall to open.",
              "es": "TALLY-5 no quiere que el centro comercial abra.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "The price tags in the mall are all wrong.",
              "es": "Las etiquetas de precio del centro comercial están todas mal.",
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
            "who": "helper",
            "en": "The mall is open and packed. What will the Mogul most likely need to do next?",
            "es": "El centro comercial está abierto y lleno. ¿Qué necesitará hacer el Mogul probablemente después?"
          },
          "choices": [
            {
              "en": "Keep using percents to find sale prices and new deals for shoppers.",
              "es": "Seguir usando porcentajes para hallar precios de oferta y nuevas ofertas para los clientes.",
              "correct": true
            },
            {
              "en": "Close the shops that just opened in Act 1.",
              "es": "Cerrar las tiendas que recién abrieron en el Acto 1.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Stop reading the sale signs for good.",
              "es": "Dejar de leer los letreros de oferta para siempre.",
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
      "ico": "&#37;",
      "en": "Percent",
      "es": "por ciento",
      "def": "A part out of 100. 25% means 25 out of 100, or 25/100."
    },
    {
      "ico": "&#127919;",
      "en": "Benchmark percent",
      "es": "porcentaje de referencia",
      "def": "An easy percent you know well: 10%, 25%, 50%, 75%. Use them to estimate other percents."
    },
    {
      "ico": "&#188;",
      "en": "Fraction",
      "es": "fracción",
      "def": "A part of a whole written as a/b. 3/4 means 3 out of 4."
    },
    {
      "ico": "&#128290;",
      "en": "Decimal",
      "es": "decimal",
      "def": "A number with a dot to show parts of one. 0.75 means 75 hundredths."
    },
    {
      "ico": "&#128260;",
      "en": "Equivalent forms",
      "es": "formas equivalentes",
      "def": "A fraction, a decimal, and a percent that name the same amount. 3/4 = 0.75 = 75%."
    },
    {
      "ico": "&#127991;&#65039;",
      "en": "Discount",
      "es": "descuento",
      "def": "Money taken off the price during a sale. 25% off $40 = $10 off."
    },
    {
      "ico": "&#128176;",
      "en": "Sale price",
      "es": "precio de oferta",
      "def": "The price after the discount. $40 with $10 off = $30."
    },
    {
      "ico": "&#127970;",
      "en": "Whole",
      "es": "todo",
      "def": "The full amount, which is 100%. If 30 is 20% of the whole, the whole is 150."
    },
    {
      "ico": "&#129513;",
      "en": "Part",
      "es": "parte",
      "def": "The piece of the whole you are talking about. 30 shoppers out of 150 is the part."
    }
  ],
  "complete": {
    "art": "finish.png",
    "alt": "Mateo celebrates on the balcony of his thriving mall with confetti and a happy crowd",
    "badge": "&#127881;&#128717;&#65039;&#11088;",
    "titleEn": "Mission Complete!",
    "en": "You are a Shopping Mall Mogul! You used <b>percents</b> to read every sign, find real discounts, and work back to the whole crowd. The mall is packed and the customers are happy. Great work!",
    "es": "¡Eres un magnate del centro comercial! Usaste porcentajes para leer cada letrero, hallar descuentos reales y encontrar el total. ¡Excelente trabajo!",
    "master": {
      "headingEn": "Prove your rank to certify your Master Certificate!",
      "promptEn": "Calculate the discount: A jacket costs <strong>$60</strong>. The store is offering a <strong>20% discount</strong>. How much money do you save?",
      "promptEs": "Una chaqueta cuesta $60. La tienda ofrece un 20% de descuento. ¿Cuánto dinero ahorras?",
      "choices": [
        {
          "en": "A) $20 &nbsp;(confused 20% with $20)",
          "correct": false
        },
        {
          "en": "B) $12 &nbsp;(0.20 × 60 = 12) &nbsp;✅",
          "correct": true
        },
        {
          "en": "C) $48 &nbsp;(this is the final sale price, not the discount savings)",
          "correct": false
        }
      ],
      "goodEn": "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      "badEn": "❌ That is incorrect. Review your calculations and try another option!",
      "certifyTitle": "🏆 Master Certified: Mission Complete!"
    }
  }
};
