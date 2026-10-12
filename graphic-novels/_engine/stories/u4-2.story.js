/* Upgraded Publisher-Grade Graphic Novel Story · u4-2.story.js */
window.GN_STORY = {
  "meta": {
    "unit": 4,
    "version": 2,
    "level": "Enrichment",
    "title": "Shopping Mall Mogul &#128717;&#65039;",
    "standard": "6.AT.4",
    "readingStandard": "RL.6.1",
    "assessment": "Graphic Novel U4 #2: Shopping Mall Mogul",
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
      "name": "Julian Cho",
      "role": "protagonist",
      "color": "#be185d",
      "tagIcon": "🏬",
      "blurb": "Flagship Plaza Director · Percent Reasoning Architect",
      "portrait": {
        "skin": "#f2c29b",
        "hair": "#0f172a",
        "hairStyle": 1
      }
    },
    "penny": {
      "name": "LEDGER-8",
      "role": "companion",
      "color": "#0d9488",
      "tagIcon": "🤖",
      "blurb": "Audit drone · treats a percent like a plain number",
      "portrait": {
        "bot": true,
        "accent": "#0d9488"
      },
      "figure": "../_art/characters/u4-penny.png",
      "figureTint": 150
    },
    "helper": {
      "name": "Valeria Rojas",
      "role": "specialist",
      "color": "#1d4ed8",
      "tagIcon": "📈",
      "blurb": "CFO of Metro Galleria · Reverse-Percent Specialist",
      "portrait": {
        "outfit": "suit",
        "skin": "#d89668",
        "hair": "#3b2314",
        "hairStyle": "long",
        "earrings": true
      }
    }
  },
  "cover": {
    "art": "cover.png",
    "alt": "A young entrepreneur smiles in front of a bright futuristic shopping mall with floating percent-off tags",
    "blurbEn": "The Nexus Galleria opens in days, and every shelf, sign, and sale depends on <b>percent reasoning</b>. As flagship director <b>Julian</b>, you will compare percents with fractions and decimals, estimate savings, set markdown prices, and work back to the whole. LEDGER-8, the audit drone, treats a percent like a plain number… Watch for the optional <b>⭐ Valeria&rsquo;s Challenge</b> in each act for extra credit.",
    "blurbEs": "La Galería Nexus abre en unos días y cada estante, letrero y oferta depende del <b>razonamiento con porcentajes</b>. Como director Julian, compararás porcentajes con fracciones y decimales, estimarás ahorros, fijarás precios de rebaja y hallarás el total. LEDGER-8 trata el porcentaje como un número cualquiera. Busca el <b>⭐ Desafío de Valeria</b> opcional en cada acto.",
    "startLabel": "Take the Reins &#128717;&#65039;"
  },
  "acts": [
    {
      "id": "act1",
      "tab": "Act 1: Percent Power",
      "kicker": "Act 1 · Percents, Fractions & Decimals",
      "title": "Percent Power",
      "advanceLabel": "Open the shop &#128722;",
      "steps": [
        {
          "type": "beats",
          "art": "unit-rate.png",
          "alt": "Julian weighs two products tagged with different sale signs, deciding which is the bigger discount",
          "lastLabel": "Check LEDGER-8 ▶",
          "beats": [
            {
              "who": "helper",
              "en": "Welcome to the Nexus Galleria, boss. Suppliers send sale signs in every form: fractions, decimals, and percents.",
              "es": "Bienvenido a la Galería Nexus, jefe. Los proveedores envían letreros en todas las formas: fracciones, decimales y porcentajes.",
              "caption": true
            },
            {
              "who": "helper",
              "en": "To compare signs fairly, write every one in the SAME form. A percent is a part out of 100, so percents make the easiest common form.",
              "es": "Para comparar letreros con justicia, escribe todos en la MISMA forma. Un porcentaje es una parte de 100, así que es la forma común más fácil.",
              "caption": true,
              "vocab": [
                {
                  "term": "percent",
                  "en": "A part out of 100. 35% means 35 out of 100.",
                  "es": "Una parte de 100. 35% significa 35 de 100."
                }
              ]
            },
            {
              "who": "mogul",
              "en": "Then I convert each sign: fraction to decimal by dividing, decimal to percent by moving the dot two places. Equal forms, fair comparison.",
              "es": "Entonces convierto cada letrero: fracción a decimal dividiendo, decimal a porcentaje moviendo el punto dos lugares."
            },
            {
              "who": "penny",
              "en": "Three signs: 3/5, 0.58, and 61%. The biggest number is 61, so 61% wins. I'll rank 3/5 last without converting it.",
              "es": "Tres letreros: 3/5, 0.58 y 61%. El número más grande es 61, así que gana 61%. Pondré 3/5 al final sin convertirlo.",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "1a",
          "ask": {
            "who": "helper",
            "en": "Three suppliers send discount signs: <b>3/5</b>, <b>0.58</b>, and <b>61%</b>. Convert them to the same form. Which list orders them from <b>least to greatest</b>?",
            "es": "Tres proveedores envían letreros de descuento: 3/5, 0.58 y 61%. Conviértelos a la misma forma. ¿Qué lista los ordena de menor a mayor?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> 3/5 = 0.6 = 60%. 0.58 = 58%. 61% stays 61%. Compare 58%, 60%, 61%.",
            "es": "💡 <b>Pista:</b> 3/5 = 0.6 = 60%. 0.58 = 58%. 61% queda 61%. Compara 58%, 60%, 61%."
          },
          "choices": [
            {
              "en": "0.58, 3/5, 61%<span class=\"calc\">58% &lt; 60% &lt; 61%</span>",
              "es": "0.58, 3/5, 61% (58% < 60% < 61%)",
              "correct": true
            },
            {
              "en": "3/5, 0.58, 61%<span class=\"calc\">3/5 treated as the smallest number</span>",
              "es": "3/5, 0.58, 61% (trata 3/5 como el menor)",
              "correct": false,
              "why": {
                "en": "❌ 3/5 is not small: 3 ÷ 5 = 0.6 = 60%, which is MORE than 58%. Convert before you order.",
                "es": "3/5 no es pequeño: 3 ÷ 5 = 0.6 = 60%, que es MÁS que 58%. Convierte antes de ordenar."
              }
            },
            {
              "en": "61%, 3/5, 0.58<span class=\"calc\">that is greatest to least</span>",
              "es": "61%, 3/5, 0.58 (de mayor a menor)",
              "correct": false,
              "why": {
                "en": "❌ That list goes from greatest to least. The question asks least to greatest.",
                "es": "Esa lista va de mayor a menor. La pregunta pide de menor a mayor."
              }
            }
          ],
          "goodEn": "✅ 0.58 = 58%, 3/5 = 60%, 61%. Least to greatest: 0.58, 3/5, 61%. Same form, fair comparison.",
          "goodEs": "¡0.58 = 58%, 3/5 = 60%, 61%! De menor a mayor: 0.58, 3/5, 61%.",
          "badEn": "❌ Convert all three to percents first: 3/5 = 60%, 0.58 = 58%. Then order them.",
          "badEs": "Convierte los tres a porcentajes primero: 3/5 = 60%, 0.58 = 58%. Luego ordénalos.",
          "help": {
            "conceptual": {
              "en": "❌ Convert all three to percents first: 3/5 = 60%, 0.58 = 58%. Then order them.",
              "es": "Convierte los tres a porcentajes primero: 3/5 = 60%, 0.58 = 58%. Luego ordénalos."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> 3/5 = 0.6 = 60%. 0.58 = 58%. 61% stays 61%. Compare 58%, 60%, 61%.",
              "es": "💡 <b>Pista:</b> 3/5 = 0.6 = 60%. 0.58 = 58%. 61% queda 61%. Compara 58%, 60%, 61%."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "mogul",
            "en": "Fair comparison done. Next, the roastery sign: I'll estimate the savings with a benchmark percent.",
            "es": "Comparación justa lista. Ahora el letrero de la tostaduría: estimaré el ahorro con un porcentaje de referencia."
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
            "en": "Julian vows to <b>convert</b> every sign to the same form. In this context, convert most nearly means to —",
            "es": "Julian promete convertir cada letrero a la misma forma. En este contexto, convertir significa más o menos —"
          },
          "choices": [
            {
              "en": "rewrite a value in a different form that means the same amount.",
              "es": "escribir un valor en otra forma que significa la misma cantidad.",
              "correct": true
            },
            {
              "en": "raise the price a supplier is charging.",
              "es": "subir el precio que cobra un proveedor.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "throw away the sign with the smallest number.",
              "es": "tirar el letrero con el número más pequeño.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Exactly. Here convert means to rewrite 3/5 as 0.6 or 60% — same value, different form.",
          "goodEs": "Exacto. Aquí convertir es escribir 3/5 como 0.6 o 60%: el mismo valor en otra forma."
        },
        {
          "type": "challenge",
          "id": "1b",
          "ask": {
            "who": "mogul",
            "en": "The roastery lists a coffee bag at <b>$19.80</b> with a sign: <b>51% off</b>. Use a benchmark percent to <b>estimate</b> the discount. About how much do you save?",
            "es": "La tostaduría ofrece una bolsa de café a $19.80 con 51% de descuento. Usa un porcentaje de referencia para estimar el descuento. ¿Cuánto ahorras aproximadamente?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> 51% is close to 50%, which is half. $19.80 is close to $20. Half of $20 is $10.",
            "es": "💡 <b>Pista:</b> 51% está cerca de 50%, la mitad. $19.80 está cerca de $20. La mitad de $20 es $10."
          },
          "choices": [
            {
              "en": "About $10<span class=\"calc\">51% ≈ 50% = half; half of ≈$20 = $10</span>",
              "es": "Aprox. $10 (51% ≈ la mitad de ≈$20)",
              "correct": true
            },
            {
              "en": "About $5<span class=\"calc\">that is about 25%</span>",
              "es": "Aprox. $5 (eso es ≈25%)",
              "correct": false,
              "why": {
                "en": "❌ $5 is about 25% of $20, a quarter. 51% is about HALF, so the savings should be about half of the price.",
                "es": "$5 es ≈25% de $20, un cuarto. 51% es ≈ la MITAD."
              }
            },
            {
              "en": "About $50<span class=\"calc\">that is more than the whole price</span>",
              "es": "Aprox. $50 (más que el precio total)",
              "correct": false,
              "why": {
                "en": "❌ You cannot save more than the bag costs. A discount under 100% is less than the whole price.",
                "es": "No puedes ahorrar más de lo que cuesta la bolsa. Un descuento menor de 100% es menos que el precio total."
              }
            }
          ],
          "goodEn": "✅ 51% ≈ 50% and $19.80 ≈ $20, so you save about $10. Benchmark estimates make sale signs easy to check.",
          "goodEs": "¡51% ≈ 50% y $19.80 ≈ $20, así que ahorras aprox. $10! Las estimaciones con referencias facilitan revisar letreros.",
          "badEn": "❌ Round to friendly numbers: 51% ≈ 50% and $19.80 ≈ $20. Then take that percent of $20.",
          "badEs": "Redondea a números fáciles: 51% ≈ 50% y $19.80 ≈ $20. Luego toma ese porcentaje de $20.",
          "help": {
            "conceptual": {
              "en": "❌ Round to friendly numbers: 51% ≈ 50% and $19.80 ≈ $20. Then take that percent of $20.",
              "es": "Redondea a números fáciles: 51% ≈ 50% y $19.80 ≈ $20. Luego toma ese porcentaje de $20."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> 51% is close to 50%, which is half. $19.80 is close to $20. Half of $20 is $10.",
              "es": "💡 <b>Pista:</b> 51% está cerca de 50%, la mitad. $19.80 está cerca de $20. La mitad de $20 es $10."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "art": "unit-rate.png",
          "alt": "Julian studies a product box with a half-off style sale tag",
          "solveArt": "unlock.png",
          "solveAlt": "Julian celebrates as a new shop unlocks with golden light and confetti",
          "solveBeat": {
            "who": "helper",
            "en": "Optional: Valeria wants a quick donation count. Try the bonus if you like — it is not required to open.",
            "es": "Opcional: Valeria quiere un conteo rápido de donaciones. Prueba el bono si quieres; no es obligatorio para abrir."
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
            "en": "According to the roastery sign, what percent off is the coffee bag?",
            "es": "Según el letrero de la tostaduría, ¿qué porcentaje de descuento tiene la bolsa de café?"
          },
          "choices": [
            {
              "en": "51% off.",
              "es": "51% de descuento.",
              "correct": true
            },
            {
              "en": "15% off.",
              "es": "15% de descuento.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "$19.80 off.",
              "es": "$19.80 de descuento.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Correct — the sign says 51% off a $19.80 bag, which is how you estimated about $10.",
          "goodEs": "Correcto: el letrero dice 51% de descuento en una bolsa de $19.80."
        },
        {
          "type": "challenge",
          "id": "B1",
          "ask": {
            "who": "helper",
            "en": "Optional: a boutique donates <b>12.5%</b> of its <b>80</b> notebooks to a school. 12.5% is the same as <b>1/8</b>. How many notebooks are donated?",
            "es": "Opcional: una boutique dona el 12.5% de sus 80 cuadernos a una escuela. 12.5% es lo mismo que 1/8. ¿Cuántos cuadernos dona?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> 12.5% = 1/8. One eighth of 80 is 80 ÷ 8 = 10.",
            "es": "💡 <b>Pista:</b> 12.5% = 1/8. Un octavo de 80 es 80 ÷ 8 = 10."
          },
          "choices": [
            {
              "en": "10 notebooks<span class=\"calc\">80 ÷ 8 = 10</span>",
              "es": "10 cuadernos (80 ÷ 8 = 10)",
              "correct": true
            },
            {
              "en": "12.5 notebooks<span class=\"calc\">that uses the percent as the count</span>",
              "es": "12.5 cuadernos (usa el porcentaje como cantidad)",
              "correct": false,
              "why": {
                "en": "❌ The percent is not the number of notebooks. Take 12.5% OF 80, which is 1/8 of 80.",
                "es": "El porcentaje no es la cantidad de cuadernos. Toma el 12.5% DE 80, que es 1/8 de 80."
              }
            },
            {
              "en": "100 notebooks<span class=\"calc\">that is more than all 80</span>",
              "es": "100 cuadernos (más que los 80)",
              "correct": false,
              "why": {
                "en": "❌ A donation of 12.5% must be less than all 80 notebooks.",
                "es": "Una donación del 12.5% debe ser menor que los 80 cuadernos."
              }
            }
          ],
          "goodEn": "⭐ 12.5% = 1/8, and 80 ÷ 8 = 10 notebooks. Bonus claimed!",
          "goodEs": "⭐ 12.5% = 1/8, y 80 ÷ 8 = 10 cuadernos. ¡Bono obtenido!",
          "badEn": "❌ 12.5% = 1/8. Divide the total by 8.",
          "badEs": "12.5% = 1/8. Divide el total entre 8.",
          "help": {
            "conceptual": {
              "en": "❌ 12.5% = 1/8. Divide the total by 8.",
              "es": "12.5% = 1/8. Divide el total entre 8."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> 12.5% = 1/8. One eighth of 80 is 80 ÷ 8 = 10.",
              "es": "💡 <b>Pista:</b> 12.5% = 1/8. Un octavo de 80 es 80 ÷ 8 = 10."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "optional": true,
          "solveBeat": {
            "who": "mogul",
            "en": "A clean 10 notebooks. Fractions and percents really are the same thing in different clothes.",
            "es": "10 cuadernos exactos. Las fracciones y los porcentajes son lo mismo con otra forma."
          }
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
            "en": "Claim: LEDGER-8 compares signs by their raw numbers instead of converting. Tap the line that best proves this claim.",
            "es": "Afirmación: LEDGER-8 compara letreros por sus números en vez de convertirlos. Toca la línea que mejor lo demuestra."
          },
          "choices": [
            {
              "en": "“The biggest number is 61, so 61% wins. I'll rank 3/5 last without converting it.”",
              "es": "“El número más grande es 61, así que gana 61%. Pondré 3/5 al final sin convertirlo.”",
              "correct": true
            },
            {
              "en": "“To compare signs fairly, write every one in the SAME form.”",
              "es": "“Para comparar letreros con justicia, escribe todos en la MISMA forma.”",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "“Fraction to decimal by dividing, decimal to percent by moving the dot.”",
              "es": "“Fracción a decimal dividiendo, decimal a porcentaje moviendo el punto.”",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Strong evidence — LEDGER-8 ranks 3/5 last without converting it, judging by the raw number.",
          "goodEs": "Evidencia sólida: LEDGER-8 pone 3/5 al final sin convertirlo."
        }
      ]
    },
    {
      "id": "act2",
      "tab": "Act 2: Markdowns",
      "kicker": "Act 2 · Percent of a Number",
      "title": "The Markdown War",
      "advanceLabel": "Launch the sale &#127881;",
      "steps": [
        {
          "type": "beats",
          "art": "discount.png",
          "alt": "Julian presents a storefront covered in bright percent-off sale signs",
          "lastLabel": "Set the price ▶",
          "beats": [
            {
              "who": "helper",
              "caption": true,
              "en": "A rival across the atrium just slashed prices. It's a markdown war, and shoppers are watching the percent signs."
            },
            {
              "who": "helper",
              "caption": true,
              "en": "Shoppers compare the percent on each sign, but the real savings is a percent OF the price. A bigger sticker price means a bigger dollar discount for the same percent."
            },
            {
              "who": "mogul",
              "en": "Discounts are just percents of the price. Convert the percent to a decimal, multiply, subtract &mdash; or multiply by what remains. Let's counter.",
              "vocab": [
                {
                  "term": "percents",
                  "en": "A ratio out of 100. 35% = 35/100 = 0.35. Percents can exceed 100% or be less than 1%."
                }
              ]
            },
            {
              "who": "penny",
              "misconception": true,
              "en": "35% off $80? Just knock off $28 and pay $28 — that's the sale price!"
            }
          ]
        },
        {
          "type": "challenge",
          "id": "2a",
          "ask": {
            "who": "mogul",
            "en": "A rival drops sneaker prices, so you counter. Your sneakers list at <b>$80</b> and you mark them <b>35% off</b>. What is the <b>sale price</b> shoppers pay?"
          },
          "choices": [
            {
              "en": "$52.00<span class=\"calc\">80 &times; (1 &minus; 0.35) = 80 &times; 0.65</span>",
              "correct": true
            },
            {
              "en": "$28.00<span class=\"calc\">that is the discount, not the price</span>",
              "correct": false,
              "why": {
                "en": "&#10060; Sale price = original &times; (1 &minus; 0.35) = 80 &times; 0.65. $28 is only the discount itself. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            },
            {
              "en": "$45.00<span class=\"calc\">not 80 &times; 0.65</span>",
              "correct": false,
              "why": {
                "en": "&#10060; Sale price = original &times; (1 &minus; 0.35) = 80 &times; 0.65. $28 is only the discount itself. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            }
          ],
          "goodEn": "&#9989; $80 &times; 0.65 = $52.00 (you keep 65% after taking 35% off). Rival countered.",
          "badEn": "&#10060; Sale price = original &times; (1 &minus; 0.35) = 80 &times; 0.65. $28 is only the discount itself.",
          "solveBeat": {
            "who": "mogul",
            "en": "My dashboard is throwing huge growth numbers and microscopic fees. Percents over 100% and under 1% &mdash; I have to read them precisely."
          },
          "help": {
            "conceptual": {
              "en": "&#10060; Sale price = original &times; (1 &minus; 0.35) = 80 &times; 0.65. $28 is only the discount itself.",
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
          "type": "comprehension",
          "id": "c4",
          "skill": "main_idea",
          "standard": "RI.6.2",
          "dok": 2,
          "interaction": "mc",
          "passageRef": "act2",
          "ask": {
            "who": "helper",
            "en": "What is the Mogul mainly trying to do in this chapter?"
          },
          "choices": [
            {
              "en": "Use percents accurately to set winning sale prices in the markdown war.",
              "correct": true
            },
            {
              "en": "Compare three sale signs by converting them to the same form.",
              "es": "Comparar tres letreros de oferta convirtiéndolos a la misma forma.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Pick the biggest percent on the sign without checking the price.",
              "es": "Elegir el porcentaje más grande del letrero sin revisar el precio.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Right &mdash; the whole chapter is about converting percents correctly to mark prices down and beat the rival.",
          "badEn": "❌ Comparing signs in different forms was Act 1. This chapter is about pricing sales with percents of a price."
        },
        {
          "type": "challenge",
          "id": "2b",
          "art": "discount.png",
          "alt": "Julian presents a storefront covered in bright percent-off sale signs",
          "ask": {
            "who": "mogul",
            "en": "Your dashboard shows growth of <b>250%</b> and a tiny transaction-fee of <b>0.5%</b>. Percents can be greater than 100% or less than 1%. Which row converts <b>both</b> correctly?",
            "vocab": [
              {
                "term": "250%",
                "en": "Values greater than the whole. 250% = 2.5 = 5/2; e.g. 250% of 40 is 100."
              }
            ]
          },
          "choices": [
            {
              "en": "250% = 2.5 = 5/2 &nbsp;and&nbsp; 0.5% = 0.005 = 1/200",
              "correct": true
            },
            {
              "en": "250% = 25 &nbsp;and&nbsp; 0.5% = 0.5",
              "correct": false,
              "why": {
                "en": "&#10060; Divide each percent by 100: 250 &divide; 100 = 2.5; 0.5 &divide; 100 = 0.005. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            },
            {
              "en": "250% = 0.25 &nbsp;and&nbsp; 0.5% = 0.05",
              "correct": false,
              "why": {
                "en": "&#10060; Divide each percent by 100: 250 &divide; 100 = 2.5; 0.5 &divide; 100 = 0.005. Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            }
          ],
          "goodEn": "&#9989; 250% = 2.5 = 5/2 and 0.5% = 0.005 = 1/200. Percents above 100% and below 1% handled cleanly.",
          "badEn": "&#10060; Divide each percent by 100: 250 &divide; 100 = 2.5; 0.5 &divide; 100 = 0.005.",
          "solveBeat": {
            "who": "helper",
            "en": "Optional puzzle: a shopper asks what a coat originally cost before its sale. Reverse the markdown for the bonus &mdash; or skip ahead."
          },
          "help": {
            "conceptual": {
              "en": "&#10060; Divide each percent by 100: 250 &divide; 100 = 2.5; 0.5 &divide; 100 = 0.005.",
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
          "id": "B2",
          "optional": true,
          "bonusTag": "⭐ Captain's Challenge",
          "ask": {
            "who": "helper",
            "en": "A designer coat is on the rack at <b>$60</b> after a <b>25% off</b> sale. Working backward, what was the <b>original price</b>?"
          },
          "choices": [
            {
              "en": "$80<span class=\"calc\">60 &divide; 0.75 = 80 (since 60 = 75% of original)</span>",
              "correct": true
            },
            {
              "en": "$75<span class=\"calc\">added 25% of 60, not the right base</span>",
              "correct": false,
              "why": {
                "en": "&#10060; The $60 equals 75% of the original. Divide: 60 &divide; 0.75. (Optional &mdash; you can still advance.) Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            },
            {
              "en": "$85<span class=\"calc\">60 &divide; 0.75 &ne; 85</span>",
              "correct": false,
              "why": {
                "en": "&#10060; The $60 equals 75% of the original. Divide: 60 &divide; 0.75. (Optional &mdash; you can still advance.) Use the Math Lab to test the quantities before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar las cantidades."
              }
            }
          ],
          "goodEn": "&#11088; $60 is 75% of the original, so original = 60 &divide; 0.75 = $80. Reverse markdown solved!",
          "badEn": "&#10060; The $60 equals 75% of the original. Divide: 60 &divide; 0.75. (Optional &mdash; you can still advance.)",
          "help": {
            "conceptual": {
              "en": "&#10060; The $60 equals 75% of the original. Divide: 60 &divide; 0.75. (Optional &mdash; you can still advance.)",
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
          "type": "comprehension",
          "id": "c5",
          "skill": "sequence",
          "standard": "RI.6.3",
          "dok": 2,
          "interaction": "sequence",
          "passageRef": "act2.2a",
          "ask": {
            "who": "helper",
            "en": "Order the steps the Mogul used to find the $52 sale price on the $80 sneakers at 35% off."
          },
          "items": [
            {
              "en": "Convert 35% off to the decimal you keep: 1 &minus; 0.35 = 0.65.",
              "order": 1
            },
            {
              "en": "Multiply the original price: $80 &times; 0.65.",
              "order": 2
            },
            {
              "en": "Read the result as the sale price shoppers pay: $52.00.",
              "order": 3
            }
          ],
          "goodEn": "✅ Convert the percent, multiply by the original, then read the sale price &mdash; that's the markdown procedure.",
          "badEn": "❌ Not quite. First turn 35% off into 0.65, then multiply $80 by it, and only then read off the $52 sale price."
        }
      ]
    },
    {
      "id": "final",
      "tab": "Grand Opening",
      "kicker": "Grand Opening · Boss",
      "title": "The Headline Deal",
      "advanceLabel": "Open the mall! &#127775;",
      "steps": [
        {
          "type": "beats",
          "art": "final-challenge.png",
          "alt": "Julian stands before a giant mall command console covered in deal charts",
          "lastLabel": "Build the deal ▶",
          "beats": [
            {
              "who": "helper",
              "en": "Grand opening, boss. The headline deal goes on every billboard, so it has to be exact: a percent OF a price, and the WHOLE behind a part.",
              "es": "Gran inauguración, jefe. La oferta principal va en cada cartelera, así que debe ser exacta: un porcentaje DE un precio y el TODO detrás de una parte.",
              "caption": true
            },
            {
              "who": "helper",
              "en": "When you know a part and its percent, divide to get back to the whole. Adding the numbers will never work.",
              "es": "Cuando conoces una parte y su porcentaje, divides para volver al todo. Sumar los números nunca funciona.",
              "caption": true
            },
            {
              "who": "mogul",
              "en": "Part ÷ percent (as a decimal) = whole. Then I can check it by taking the percent of my answer. Let's give this city the deal of the year.",
              "es": "Parte ÷ porcentaje (en decimal) = todo. Luego lo verifico tomando el porcentaje de mi respuesta."
            },
            {
              "who": "penny",
              "en": "$34 off at 40%? The original price is $34 + $40 = $74. Simple.",
              "es": "¿$34 de descuento al 40%? El precio original es $34 + $40 = $74. Simple.",
              "misconception": true
            }
          ]
        },
        {
          "type": "challenge",
          "id": "F",
          "ask": {
            "who": "helper",
            "en": "The grand-opening special takes <b>$34</b> off a speaker system, and that discount is <b>40%</b> of the original price. What was the <b>original price</b>, and what is the <b>sale price</b>?",
            "es": "La oferta de inauguración quita $34 a un sistema de bocinas, y ese descuento es el 40% del precio original. ¿Cuál era el precio original y cuál es el precio de oferta?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> $34 is 40% of the original. Original = 34 ÷ 0.40 = 85. Sale price = 85 − 34.",
            "es": "💡 <b>Pista:</b> $34 es el 40% del original. Original = 34 ÷ 0.40 = 85. Precio de oferta = 85 − 34."
          },
          "choices": [
            {
              "en": "Original $85, sale price $51<span class=\"calc\">34 ÷ 0.40 = 85; 85 − 34 = 51</span>",
              "es": "Original $85, oferta $51 (34 ÷ 0.40 = 85)",
              "correct": true
            },
            {
              "en": "Original $74, sale price $40<span class=\"calc\">added 34 + 40</span>",
              "es": "Original $74, oferta $40 (sumó 34 + 40)",
              "correct": false,
              "why": {
                "en": "❌ A percent is not a dollar amount, so 34 + 40 means nothing. $34 is 40% of the original: divide 34 by 0.40.",
                "es": "Un porcentaje no es dólares, así que 34 + 40 no tiene sentido. $34 es el 40% del original: divide 34 entre 0.40."
              }
            },
            {
              "en": "Original $13.60, sale price −$20.40<span class=\"calc\">took 40% of 34 instead</span>",
              "es": "Original $13.60, oferta −$20.40 (tomó el 40% de 34)",
              "correct": false,
              "why": {
                "en": "❌ 40% OF 34 would find a smaller part. We need the whole: the sale price can never be negative.",
                "es": "El 40% DE 34 hallaría una parte menor. Buscamos el total: el precio no puede ser negativo."
              }
            }
          ],
          "goodEn": "✅ HEADLINE DEAL! $34 ÷ 0.40 = $85 original, then $85 − $34 = $51 sale price. Check: 40% of $85 = $34. ✔",
          "goodEs": "¡OFERTA PRINCIPAL! $34 ÷ 0.40 = $85 original y $85 − $34 = $51. Verifica: 40% de $85 = $34.",
          "badEn": "❌ $34 is the PART and 40% is its percent. Divide the part by the decimal percent to find the whole.",
          "badEs": "$34 es la PARTE y 40% es su porcentaje. Divide la parte entre el porcentaje en decimal para hallar el total.",
          "help": {
            "conceptual": {
              "en": "❌ $34 is the PART and 40% is its percent. Divide the part by the decimal percent to find the whole.",
              "es": "$34 es la PARTE y 40% es su porcentaje. Divide la parte entre el porcentaje en decimal para hallar el total."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> $34 is 40% of the original. Original = 34 ÷ 0.40 = 85. Sale price = 85 − 34.",
              "es": "💡 <b>Pista:</b> $34 es el 40% del original. Original = 34 ÷ 0.40 = 85. Precio de oferta = 85 − 34."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "solveBeat": {
            "who": "helper",
            "en": "Optional extra credit — the mall opens whether or not you solve it. A competitor counters your deal.",
            "es": "Crédito extra opcional: el centro comercial abre aunque no lo resuelvas. Un competidor responde a tu oferta."
          }
        },
        {
          "type": "challenge",
          "id": "BF",
          "ask": {
            "who": "helper",
            "en": "A competitor counters. Deal A: a <b>$60</b> coat at <b>30% off</b>. Deal B: a <b>$50</b> coat at <b>20% off</b>. Which coat costs <b>less</b> after the discount?",
            "es": "Un competidor responde. Oferta A: un abrigo de $60 con 30% de descuento. Oferta B: un abrigo de $50 con 20% de descuento. ¿Cuál abrigo cuesta menos después del descuento?"
          },
          "hint": {
            "en": "💡 <b>Hint:</b> A: $60 × 0.70 = $42. B: $50 × 0.80 = $40.",
            "es": "💡 <b>Pista:</b> A: $60 × 0.70 = $42. B: $50 × 0.80 = $40."
          },
          "choices": [
            {
              "en": "Deal B<span class=\"calc\">$50 × 0.80 = $40, less than A’s $42</span>",
              "es": "Oferta B ($50 × 0.80 = $40, menos que $42)",
              "correct": true
            },
            {
              "en": "Deal A<span class=\"calc\">bigger percent off, so it must cost less</span>",
              "es": "Oferta A (mayor porcentaje, así que cuesta menos)",
              "correct": false,
              "why": {
                "en": "❌ A bigger percent of a bigger price does not decide it. Find each sale price: A is $42, B is $40.",
                "es": "Un porcentaje mayor de un precio mayor no decide. Halla cada precio de oferta: A es $42, B es $40."
              }
            },
            {
              "en": "They cost the same<span class=\"calc\">$42 ≠ $40</span>",
              "es": "Cuestan lo mismo ($42 ≠ $40)",
              "correct": false,
              "why": {
                "en": "❌ Compute both: $60 × 0.70 = $42 and $50 × 0.80 = $40. They are different.",
                "es": "Calcula ambos: $60 × 0.70 = $42 y $50 × 0.80 = $40. Son distintos."
              }
            }
          ],
          "goodEn": "⭐ Deal B: $50 × 0.80 = $40 beats Deal A's $60 × 0.70 = $42. A bigger percent off does not always mean a lower price!",
          "goodEs": "⭐ Oferta B: $50 × 0.80 = $40 gana a $42. ¡Un porcentaje mayor no siempre significa un precio menor!",
          "badEn": "❌ Compare the actual sale prices, not just the percents.",
          "badEs": "Compara los precios de oferta reales, no solo los porcentajes.",
          "help": {
            "conceptual": {
              "en": "❌ Compare the actual sale prices, not just the percents.",
              "es": "Compara los precios de oferta reales, no solo los porcentajes."
            },
            "procedural": {
              "en": "💡 <b>Hint:</b> A: $60 × 0.70 = $42. B: $50 × 0.80 = $40.",
              "es": "💡 <b>Pista:</b> A: $60 × 0.70 = $42. B: $50 × 0.80 = $40."
            },
            "example": {
              "en": "Try the Math Lab with an easy benchmark first (10%, 25%, or 50%), watch the pattern, then test the mission numbers.",
              "es": "Prueba el laboratorio con un valor fácil primero (10%, 25% o 50%), observa el patrón y luego prueba los números de la misión."
            }
          },
          "optional": true,
          "solveBeat": {
            "who": "mogul",
            "en": "Even the rival's deal teaches me something: compare the actual prices. The galleria opens stronger than ever.",
            "es": "Hasta la oferta del rival me enseña algo: comparar los precios reales. La galería abre más fuerte que nunca."
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
            "en": "LEDGER-8 compares raw numbers and adds a percent to dollars. What can you infer about why LEDGER-8's deals keep coming out wrong?",
            "es": "LEDGER-8 compara números sin convertir y suma un porcentaje a dólares. ¿Qué puedes inferir sobre por qué sus ofertas salen mal?"
          },
          "choices": [
            {
              "en": "LEDGER-8 treats a percent like a plain number instead of a part out of 100, so its answers do not match the real amounts.",
              "es": "LEDGER-8 trata el porcentaje como un número cualquiera en vez de una parte de 100, así que sus respuestas no coinciden con las cantidades reales.",
              "correct": true
            },
            {
              "en": "LEDGER-8 is secretly working for the rival mall and wants the Mogul to lose.",
              "es": "LEDGER-8 trabaja en secreto para el centro rival y quiere que el Mogul pierda.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Every price tag in the galleria is printed incorrectly.",
              "es": "Todas las etiquetas de la galería están impresas mal.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Good inference — LEDGER-8 skips the conversion and the division steps, so the numbers never match the real amounts.",
          "goodEs": "Buena inferencia: LEDGER-8 se salta la conversión y la división."
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
            "en": "The Nexus Galleria is open and investors are calling. What will the Mogul most likely need to do next?",
            "es": "La Galería Nexus está abierta y los inversionistas llaman. ¿Qué necesitará hacer el Mogul probablemente después?"
          },
          "choices": [
            {
              "en": "Keep using percents to price sales, compare deals, and grow the empire.",
              "es": "Seguir usando porcentajes para fijar ofertas, comparar y hacer crecer el imperio.",
              "correct": true
            },
            {
              "en": "Shut down the shelves and shops that just opened in Act 1.",
              "es": "Cerrar los estantes y tiendas que recién abrieron en el Acto 1.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            },
            {
              "en": "Stop comparing prices and let suppliers charge whatever they want.",
              "es": "Dejar de comparar precios y permitir que los proveedores cobren lo que quieran.",
              "correct": false,
              "why": {
                "en": "Use the Math Lab to test the numbers before choosing your reply.",
                "es": "Usa el laboratorio de matemáticas para comprobar los números antes de elegir tu respuesta."
              }
            }
          ],
          "goodEn": "✅ Likely — the story ends with the empire just getting started, so the Mogul keeps using these percent skills.",
          "goodEs": "Probable: la historia termina con el imperio apenas comenzando."
        }
      ]
    }
  ],
  "glossary": [
    {
      "ico": "&#37;",
      "en": "Percent",
      "es": "por ciento",
      "def": "A part out of 100. 35% means 35 out of 100, or 35/100."
    },
    {
      "ico": "&#128260;",
      "en": "Equivalent forms",
      "es": "formas equivalentes",
      "def": "A fraction, a decimal, and a percent that name the same value. 3/5 = 0.6 = 60%."
    },
    {
      "ico": "&#127919;",
      "en": "Benchmark percent",
      "es": "porcentaje de referencia",
      "def": "An easy percent (10%, 25%, 50%) you use to estimate harder ones. 51% is about half."
    },
    {
      "ico": "&#128200;",
      "en": "Percent over 100%",
      "es": "porcentaje mayor que 100%",
      "def": "A percent can be more than 100% when a quantity grows past the whole. 250% = 2.5 times the whole."
    },
    {
      "ico": "&#128201;",
      "en": "Percent under 1%",
      "es": "porcentaje menor que 1%",
      "def": "A percent can be less than 1%. 0.5% = 0.005 = 1/200."
    },
    {
      "ico": "&#127991;&#65039;",
      "en": "Markdown / Discount",
      "es": "rebaja / descuento",
      "def": "The amount taken off the price. 35% off $80 means you pay 65% of $80."
    },
    {
      "ico": "&#8634;",
      "en": "Reverse percent",
      "es": "porcentaje inverso",
      "def": "Finding the whole when you know a part and its percent. If $60 is 75% of the price, the price is $60 ÷ 0.75 = $80."
    },
    {
      "ico": "&#9878;&#65039;",
      "en": "Value comparison",
      "es": "comparación de valores",
      "def": "Compare percents of different wholes by finding the actual amounts first."
    }
  ],
  "complete": {
    "art": "finish.png",
    "alt": "Julian celebrates on the balcony of his thriving mall with confetti and a cheering crowd",
    "badge": "&#127881;&#128717;&#65039;&#11088;",
    "titleEn": "Galleria Launched &mdash; Mission Complete!",
    "en": "The Nexus Galleria is open and investors are calling. You converted between fractions, decimals, and percents, estimated with benchmarks, set markdown prices, handled percents over 100% and under 1%, and worked back to the whole. The empire is just getting started!",
    "es": "La Galería Nexus está abierta y los inversionistas llaman. Convertiste entre fracciones, decimales y porcentajes, estimaste con referencias, fijaste precios de rebaja y hallaste el total. ¡El imperio apenas comienza!",
    "master": {
      "headingEn": "Prove your rank to certify your Master Certificate!",
      "promptEn": "Calculate complex savings: A designer coat costs <strong>$80</strong> but is on sale for <strong>25% off</strong>. If the store charges <strong>5% sales tax</strong> on the final sale price, what is the final cost?",
      "promptEs": "",
      "choices": [
        {
          "en": "A) $60.00 &nbsp;(this is the sale price without tax)",
          "correct": false
        },
        {
          "en": "B) $63.00 &nbsp;(sale price $60 + $3.00 tax) &nbsp;✅",
          "correct": true
        },
        {
          "en": "C) $64.00 &nbsp;(calculated 5% tax on original $80 price)",
          "correct": false
        }
      ],
      "goodEn": "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      "badEn": "❌ That is incorrect. Review your calculations and try another option!",
      "certifyTitle": "🏆 Master Certified: Mission Complete!"
    }
  }
};
