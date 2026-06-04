/* STORY · Unit 4 · Graphic Novel #1 (Support) · Shopping Mall Mogul
   Full novel on the comic engine — Act 1 (The Best Buy), Act 2 (The Big Sale),
   Grand Opening (The Best Deal of All), Glossary, Mission Complete + Master-Rank.
   All math, answers, distractors, Spanish, sentence frames, hints, and glossary
   carried verbatim from graphic-novels/unit4/graphic-novel-1.html (6.RP.2).
   New: panels, speech, PENNY-voices-the-misconception, vocab/hint/coach pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 4,
    version: 1,
    level: "Support",
    title: "Shopping Mall Mogul &#128717;&#65039;",
    standard: "6.RP.2",
    readingStandard: "RL.6.1",
    assessment: "Graphic Novel U4 #1: Shopping Mall Mogul",
    artBase: "../_art/unit4/",
    home: "../index.html",
  },

  cast: {
    mogul: {
      name: "The Mogul",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "&#128717;&#65039;",
      avatar: null,
      blurb: "You",
    },
    penny: {
      name: "PENNY",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "&#129297;",
      avatar: null,
      blurb: "Bargain-hunter sidekick · grabs the bigger package as 'cheaper'",
    },
    helper: { name: "Mall Helper", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "A young entrepreneur smiles in front of a bright futuristic shopping mall with floating price tags",
    blurbEn:
      "You run a new shopping mall! To win customers and open shops, you must find the <b>best deals</b>. Use <b>unit rates</b> and <b>percent discounts</b> to be the best mall mogul in the city! PENNY wants to help… but PENNY keeps grabbing the bigger package, sure it must be cheaper. Catch the mistakes and pack the mall!",
    blurbEs:
      "Diriges un centro comercial. Usa las matem&aacute;ticas para encontrar las mejores ofertas.",
    startLabel: "Open the Mall &#128717;&#65039;",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Best Buy",
      kicker: "Act 1 · Unit Rates",
      title: "The Best Buy",
      advanceLabel: "Stock the shop &#128722;",
      steps: [
        {
          type: "beats",
          art: "unit-rate.png",
          alt: "Mateo holds two product boxes and compares their prices",
          lastLabel: "Stop PENNY ▶",
          beats: [
            {
              who: "helper",
              caption: true,
              en: "Welcome, boss! Customers love a BEST BUY. To find it, compare the price of ONE item &mdash; the unit rate.",
              es: "&iexcl;Bienvenido, jefe! Para la mejor compra, compara el precio de UN art&iacute;culo: la tasa unitaria.",
              vocab: [
                {
                  term: "unit rate",
                  en: "The price or amount for just ONE. Find it with price ÷ quantity. $6 ÷ 3 = $2 per app.",
                  es: "El precio o la cantidad por solo UNO. Se halla con precio ÷ cantidad. $6 ÷ 3 = $2 por app.",
                },
              ],
            },
            {
              who: "helper",
              caption: true,
              en: "Two shops are waiting to open: the Game Shop and the Smoothie Bar. The bigger box is NOT always the better deal &mdash; only the price for ONE item tells the truth.",
              es: "Dos tiendas esperan abrir: la de juegos y la barra de batidos. La caja m&aacute;s grande NO siempre es la mejor oferta; solo el precio de UN art&iacute;culo dice la verdad.",
            },
            {
              who: "mogul",
              en: "Got it. Price divided by how many. The smaller price per item is the better deal. Let me check the Game Shop.",
              es: "Entendido. Precio dividido por la cantidad. El menor precio por art&iacute;culo es mejor. Voy a revisar.",
            },
            {
              who: "penny",
              misconception: true,
              en: "Easy — the 5-app pack is way bigger, so that's the cheaper one. Grab it!",
              es: "Fácil: el paquete de 5 apps es más grande, así que ese es el más barato. ¡Tómalo!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "helper",
            en: "First, pick the pack that costs less for each app. The Game Shop sells apps two ways. To find the best buy, find the <b>unit rate</b> (price for ONE app): price &divide; number of apps. Which pack is cheaper per app?",
            es: "Encuentra el precio por UNA app (precio &divide; cantidad). &iquest;Cu&aacute;l es m&aacute;s barato?",
          },
          hint: {
            en: "💡 <b>Hint:</b> 3 apps for $6 &rarr; $6 &divide; 3. 5 apps for $8 &rarr; $8 &divide; 5. The smaller answer per app is the better buy.",
          },
          frame: {
            en: "&ldquo;The unit rate is ____ per ____. The best buy is ____ because it costs ____ for one item.&rdquo;",
          },
          choices: [
            {
              en: '3 apps for $6<span class="calc">$6 &divide; 3 = $2.00 each</span>',
              correct: false,
            },
            {
              en: '5 apps for $8<span class="calc">$8 &divide; 5 = $1.60 each</span>',
              correct: true,
            },
          ],
          goodEn:
            "&#9989; Best buy! $8 &divide; 5 = $1.60 per app, which beats $2.00 per app. Smart shopping!",
          goodEs: "&iexcl;Mejor compra! $1.60 por app es menor que $2.00.",
          badEn:
            "&#10060; That one costs MORE per app. Divide each price by the number of apps and pick the smaller unit rate.",
          badEs:
            "Ese cuesta m&aacute;s por app. Divide y elige la tasa unitaria menor.",
          solveBeat: {
            who: "mogul",
            en: "Nice! Now the Smoothie Bar wants a price PER OUNCE. Same idea: price divided by ounces.",
            es: "&iexcl;Bien! Ahora la barra de batidos quiere el precio POR ONZA. Misma idea.",
          },
        },
        {
          type: "comprehension",
          id: "c1",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.1a",
          ask: {
            who: "helper",
            en: "In the story, what does <b>unit rate</b> mean?",
            es: "En la historia, &iquest;qu&eacute; significa <b>tasa unitaria</b>?",
          },
          hint: {
            en: "Think about why the Mogul divides the price by how many items.",
            es: "Piensa por qu&eacute; el Mogul divide el precio entre la cantidad.",
          },
          choices: [
            {
              en: "The price for just ONE item, found by price &divide; quantity.",
              es: "El precio de solo UN art&iacute;culo, hallado con precio &divide; cantidad.",
              correct: true,
            },
            {
              en: "The biggest package on the shelf.",
              es: "El paquete m&aacute;s grande del estante.",
              correct: false,
            },
            {
              en: "The total price you pay for the whole pack.",
              es: "El precio total que pagas por todo el paquete.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "mogul",
            en: "The Smoothie Bar sells a <b>12 oz</b> cup for <b>$3</b>. What is the <b>unit rate</b> (price for ONE ounce)?",
            es: "&iquest;Cu&aacute;l es el precio por UNA onza? ($3 &divide; 12 oz)",
          },
          hint: {
            en: "💡 <b>Hint:</b> Unit rate = price &divide; quantity = $3 &divide; 12 oz.",
          },
          choices: [
            {
              en: '$0.25 per ounce<span class="calc">$3 &divide; 12 = $0.25</span>',
              correct: true,
            },
            {
              en: '$4.00 per ounce<span class="calc">12 &divide; 3 (flipped!)</span>',
              correct: false,
            },
            {
              en: '$0.36 per ounce<span class="calc">not 3 &divide; 12</span>',
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Correct! $3 &divide; 12 = $0.25 per ounce. That is the unit rate. The shop is stocked!",
          goodEs: "&iexcl;Correcto! $3 &divide; 12 = $0.25 por onza.",
          badEn:
            "&#10060; Remember: unit rate = price &divide; quantity = $3 &divide; 12. Try again.",
          badEs: "Recuerda: tasa unitaria = precio &divide; cantidad.",
          solveArt: "unlock.png",
          solveAlt:
            "Mateo pumps his fist as a new shop unlocks with golden light and confetti",
          solveBeat: {
            who: "mogul",
            en: "The shop unlocks! Best buys locked in. Now for the big sale.",
            es: "&iexcl;La tienda se abre! Las mejores compras están listas. Ahora la gran venta.",
          },
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 1,
          interaction: "mc",
          passageRef: "act1.1b",
          ask: {
            who: "helper",
            en: "How much does the Smoothie Bar charge for a 12 oz cup?",
            es: "&iquest;Cu&aacute;nto cobra la barra de batidos por un vaso de 12 oz?",
          },
          choices: [
            {
              en: "$3 for a 12 oz cup.",
              es: "$3 por un vaso de 12 oz.",
              correct: true,
            },
            {
              en: "$8 for a 12 oz cup.",
              es: "$8 por un vaso de 12 oz.",
              correct: false,
            },
            {
              en: "$0.25 for a 12 oz cup.",
              es: "$0.25 por un vaso de 12 oz.",
              correct: false,
            },
          ],
        },
        {
          type: "comprehension",
          id: "c3",
          skill: "cite_evidence",
          standard: "RL.6.1",
          dok: 2,
          interaction: "evidence",
          passageRef: "act1.beat1",
          ask: {
            who: "helper",
            en: "Tap the line that shows PENNY made a <b>mistake</b> about the best buy.",
            es: "Toca la l&iacute;nea que muestra que PENNY se <b>equivoc&oacute;</b> sobre la mejor compra.",
          },
          choices: [
            {
              en: "&ldquo;The 5-app pack is way bigger, so that's the cheaper one.&rdquo;",
              es: "&ldquo;El paquete de 5 apps es m&aacute;s grande, as&iacute; que ese es el m&aacute;s barato.&rdquo;",
              correct: true,
            },
            {
              en: "&ldquo;Compare the price of ONE item &mdash; the unit rate.&rdquo;",
              es: "&ldquo;Compara el precio de UN art&iacute;culo: la tasa unitaria.&rdquo;",
              correct: false,
            },
            {
              en: "&ldquo;Now the Smoothie Bar wants a price PER OUNCE.&rdquo;",
              es: "&ldquo;Ahora la barra de batidos quiere el precio POR ONZA.&rdquo;",
              correct: false,
            },
          ],
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Big Sale",
      kicker: "Act 2 · Percents",
      title: "The Big Sale",
      advanceLabel: "Launch the sale &#127881;",
      steps: [
        {
          type: "beats",
          art: "discount.png",
          alt: "Mateo points at a shop covered in bright percent-off sale signs",
          lastLabel: "Stop PENNY ▶",
          beats: [
            {
              who: "helper",
              caption: true,
              en: "Big sale day! Shoppers love PERCENT OFF. A discount means you take part of the price away.",
              es: "&iexcl;D&iacute;a de gran venta! A los clientes les encanta el PORCENTAJE DE DESCUENTO.",
              vocab: [
                {
                  term: "discount",
                  en: "Money taken off the price during a sale. 25% off $40 = $10 off.",
                  es: "Dinero que se quita del precio en una oferta. 25% de descuento de $40 = $10 menos.",
                },
              ],
            },
            {
              who: "helper",
              caption: true,
              en: "A bigger percent means a bigger discount. Your job today is to figure out the REAL savings so shoppers trust your signs.",
              es: "Un porcentaje m&aacute;s grande significa un descuento m&aacute;s grande. Tu trabajo hoy es calcular el ahorro REAL para que los clientes conf&iacute;en en tus carteles.",
            },
            {
              who: "mogul",
              en: "To find the discount, change the percent to a decimal and multiply. 25% off means 25% of the price comes off.",
              es: "Para el descuento, cambio el porcentaje a decimal y multiplico. 25% de descuento.",
            },
            {
              who: "penny",
              misconception: true,
              en: "25% off $40? That's only $4 off — small numbers, small savings, right?",
              es: "¿25% de descuento de $40? Eso es solo $4 menos — números pequeños, ahorro pequeño, ¿no?",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "penny",
            en: "A jacket costs <b>$40</b>. Today it is <b>25% off</b>. How much money do you <b>save</b> (the discount)?",
            es: "&iquest;Cu&aacute;nto dinero ahorras con 25% de descuento de $40?",
          },
          hint: {
            en: "💡 <b>Hint:</b> 25% = 0.25. Discount = $40 &times; 0.25. (Or: 25% is &frac14; of $40.)",
          },
          choices: [
            {
              en: '$4 off<span class="calc">that is only 10%</span>',
              correct: false,
            },
            {
              en: '$10 off<span class="calc">$40 &times; 0.25 = $10</span>',
              correct: true,
            },
            {
              en: '$25 off<span class="calc">25% is not $25</span>',
              correct: false,
            },
          ],
          goodEn:
            "&#9989; Yes! $40 &times; 0.25 = $10 off. The sale price would be $40 &minus; $10 = $30. Shoppers love it!",
          goodEs:
            "&iexcl;S&iacute;! $40 &times; 0.25 = $10 de descuento. Precio: $30.",
          badEn:
            "&#10060; Change 25% to 0.25 and multiply: $40 &times; 0.25. Use the hint and try again.",
          badEs: "Cambia 25% a 0.25 y multiplica: $40 &times; 0.25.",
          solveBeat: {
            who: "mogul",
            en: "The crowd is growing! Now the signs use fractions, decimals, AND percents. They can all show the same value.",
            es: "&iexcl;Hay m&aacute;s gente! Las fracciones, decimales y porcentajes pueden mostrar el mismo valor.",
          },
        },
        {
          type: "comprehension",
          id: "c4",
          skill: "main_idea",
          standard: "RI.6.2",
          dok: 2,
          interaction: "mc",
          passageRef: "act2",
          ask: {
            who: "helper",
            en: "What is the Mogul mainly trying to do in this chapter?",
            es: "&iquest;Qu&eacute; intenta hacer el Mogul principalmente en este cap&iacute;tulo?",
          },
          choices: [
            {
              en: "Find the real savings from a percent discount so the sale is a great deal.",
              es: "Hallar el ahorro real de un descuento en porcentaje para que la venta sea una gran oferta.",
              correct: true,
            },
            {
              en: "Find the price for one ounce of smoothie.",
              es: "Hallar el precio de una onza de batido.",
              correct: false,
            },
            {
              en: "Buy the biggest package just because it looks bigger.",
              es: "Comprar el paquete m&aacute;s grande solo porque se ve m&aacute;s grande.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "mogul",
            en: "The sale sign shows <b>0.75</b> of the price stays. A <b>fraction</b>, <b>decimal</b>, and <b>percent</b> can all show the SAME value. Which group all equals <b>0.75</b>?",
            es: "&iquest;Cu&aacute;l grupo es igual a 0.75 (fracci&oacute;n, decimal y porcentaje)?",
            vocab: [
              {
                term: "decimal",
                en: "A number with a dot to show parts of one. 0.75 means 75 hundredths.",
                es: "Un número con punto que muestra partes de uno. 0.75 significa 75 centésimos.",
              },
            ],
          },
          hint: {
            en: "💡 <b>Hint:</b> To make a decimal a percent, move the dot 2 places: 0.75 = 75%. And 75% = 75/100 = 3/4.",
          },
          frame: {
            en: "&ldquo;25% of $40 is ____. The decimal 0.75 is the same as ____% and the fraction ____.&rdquo;",
          },
          choices: [
            { en: "3/4 = 0.75 = 75%", correct: true },
            { en: "3/4 = 0.34 = 34%", correct: false },
            { en: "7/5 = 0.75 = 7.5%", correct: false },
          ],
          goodEn:
            "&#9989; Perfect! 3/4 = 0.75 = 75%. The fraction, decimal, and percent all match. SALE IS LIVE!",
          goodEs: "&iexcl;Perfecto! 3/4 = 0.75 = 75%. &iexcl;Venta activa!",
          badEn:
            "&#10060; Move the dot two places: 0.75 = 75%, and 75% = 75/100 = 3/4. Try again.",
          badEs: "Mueve el punto dos lugares: 0.75 = 75% = 3/4.",
          solveBeat: {
            who: "mogul",
            en: "Sale is live and the mall is buzzing! Time for the Grand Opening headline deal.",
            es: "¡La venta está activa y el centro comercial está lleno! Hora de la gran apertura.",
          },
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
            who: "helper",
            en: "Put the steps to find a 25% discount on a $40 jacket in order.",
            es: "Ordena los pasos para hallar un descuento del 25% en una chaqueta de $40.",
          },
          items: [
            {
              en: "Change 25% to the decimal 0.25.",
              es: "Cambia 25% al decimal 0.25.",
              order: 1,
            },
            {
              en: "Multiply $40 &times; 0.25 to get $10 off.",
              es: "Multiplica $40 &times; 0.25 para obtener $10 de descuento.",
              order: 2,
            },
            {
              en: "Subtract: $40 &minus; $10 = $30 sale price.",
              es: "Resta: $40 &minus; $10 = $30 de precio de oferta.",
              order: 3,
            },
          ],
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Grand Opening",
      kicker: "Grand Opening · Boss",
      title: "The Best Deal of All",
      advanceLabel: "Open the mall! &#127775;",
      steps: [
        {
          type: "beats",
          art: "final-challenge.png",
          alt: "Mateo stands before a giant mall command console with deal charts",
          lastLabel: "Make the deal ▶",
          beats: [
            {
              who: "helper",
              caption: true,
              en: "It's the GRAND OPENING! The headline deal needs BOTH skills: a unit rate AND a percent discount.",
              es: "&iexcl;Es la GRAN APERTURA! La oferta necesita AMBAS destrezas: tasa unitaria Y descuento.",
            },
            {
              who: "helper",
              caption: true,
              en: "This is the deal on every billboard in the city. If the math is right, the mall opens to a huge crowd &mdash; so do it carefully, in the right order.",
              es: "Esta es la oferta en cada cartel de la ciudad. Si las cuentas est&aacute;n bien, el centro comercial abre con mucha gente; as&iacute; que hazlo con cuidado y en el orden correcto.",
            },
            {
              who: "mogul",
              en: "First the price for one. Then take the percent off. Let's make the best deal in the whole mall!",
              es: "Primero el precio de uno. Luego el descuento. &iexcl;La mejor oferta del centro comercial!",
            },
            {
              who: "penny",
              misconception: true,
              en: "Easy — just take 20% off the whole $20 pack. That's $16 for one charger!",
              es: "Fácil: solo quita 20% al paquete entero de $20. ¡Eso es $16 por un cargador!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "mogul",
            en: "Hold on, PENNY — find ONE charger first. A 4-pack of phone chargers costs <b>$20</b>. First find the <b>unit rate</b> (one charger). Then take <b>20% off</b> that price. What is the final price for ONE charger?",
            es: "Encuentra el precio de UN cargador, luego 20% de descuento.",
          },
          hint: {
            en: "💡 <b>Hint:</b> Step 1: $20 &divide; 4 = $5 each. Step 2: 20% off $5 &rarr; $5 &times; 0.20 = $1 off &rarr; $5 &minus; $1.",
          },
          frame: {
            en: "&ldquo;One charger is $20 &divide; 4 = ____. 20% off is ____ saved, so the final price is ____.&rdquo;",
          },
          choices: [
            {
              en: '$5.00<span class="calc">unit rate, but no discount yet</span>',
              correct: false,
            },
            {
              en: '$4.00<span class="calc">$5 &minus; (20% of $5) = $5 &minus; $1</span>',
              correct: true,
            },
            {
              en: '$16.00<span class="calc">that is 20% off the whole pack</span>',
              correct: false,
            },
          ],
          goodEn:
            "&#9989; HEADLINE DEAL! $20 &divide; 4 = $5 each, then 20% off ($1) = $4 per charger. Both skills, perfect! THE MALL IS OPEN!",
          goodEs:
            "&iexcl;OFERTA ESTRELLA! $20 &divide; 4 = $5, menos 20% ($1) = $4. &iexcl;Mall abierto!",
          badEn:
            "&#10060; Do it in two steps: first $20 &divide; 4 = $5 for one, THEN take 20% of $5 ($1) off. The final price is $4.",
          badEs:
            "Dos pasos: $20 &divide; 4 = $5, luego 20% de $5 ($1). Precio final: $4.",
          solveBeat: {
            who: "mogul",
            en: "Best deal in the mall! The doors are open and the crowd pours in. We did it, PENNY!",
            es: "¡La mejor oferta del centro comercial! Las puertas están abiertas. ¡Lo logramos, PENNY!",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 2,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "helper",
            en: "PENNY keeps grabbing the bigger package and skipping steps. Why does PENNY keep getting the deals wrong?",
            es: "PENNY sigue tomando el paquete m&aacute;s grande y se salta pasos. &iquest;Por qu&eacute; PENNY se equivoca con las ofertas?",
          },
          hint: {
            en: "Look back: PENNY guesses by size instead of finding the price for ONE.",
            es: "Mira atr&aacute;s: PENNY adivina por el tama&ntilde;o en vez de hallar el precio de UNO.",
          },
          choices: [
            {
              en: "PENNY guesses by package size and skips the unit-rate math, so it misses the real best deal.",
              es: "PENNY adivina por el tama&ntilde;o del paquete y se salta la tasa unitaria, as&iacute; que no halla la mejor oferta real.",
              correct: true,
            },
            {
              en: "PENNY does not want the mall to open.",
              es: "PENNY no quiere que el centro comercial abra.",
              correct: false,
            },
            {
              en: "The price tags in the mall are all wrong.",
              es: "Las etiquetas de precio del centro comercial est&aacute;n todas mal.",
              correct: false,
            },
          ],
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
            who: "helper",
            en: "The mall is open and packed. What will the Mogul most likely need to do next?",
            es: "El centro comercial est&aacute; abierto y lleno. &iquest;Qu&eacute; necesitar&aacute; hacer el Mogul probablemente despu&eacute;s?",
          },
          choices: [
            {
              en: "Keep using unit rates and discounts to find more best deals for shoppers.",
              es: "Seguir usando tasas unitarias y descuentos para hallar m&aacute;s ofertas para los clientes.",
              correct: true,
            },
            {
              en: "Close the shops that just opened in Act 1.",
              es: "Cerrar las tiendas que reci&eacute;n abrieron en el Acto 1.",
              correct: false,
            },
            {
              en: "Stop comparing prices for good.",
              es: "Dejar de comparar precios para siempre.",
              correct: false,
            },
          ],
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "&#128181;",
      en: "Rate",
      es: "tasa",
      def: "A comparison of two amounts with different units. Example: $6 for 3 apps.",
    },
    {
      ico: "&#49;&#65039;&#8419;",
      en: "Unit rate",
      es: "tasa unitaria",
      def: "The price or amount for just ONE. Find it with price &divide; quantity. $6 &divide; 3 = $2 per app.",
    },
    {
      ico: "&#128722;",
      en: "Best buy",
      es: "mejor compra",
      def: "The choice with the lowest unit rate (cheapest for each item).",
    },
    {
      ico: "&#37;",
      en: "Percent",
      es: "por ciento",
      def: "A part out of 100. 25% means 25 out of 100, or 25/100.",
    },
    {
      ico: "&#127991;&#65039;",
      en: "Discount",
      es: "descuento",
      def: "Money taken off the price during a sale. 25% off $40 = $10 off.",
    },
    {
      ico: "&#128176;",
      en: "Sale price",
      es: "precio de oferta",
      def: "The price after the discount. $40 with $10 off = $30.",
    },
    {
      ico: "&#188;",
      en: "Fraction",
      es: "fracci&oacute;n",
      def: "A part of a whole written as a/b. 3/4 means 3 out of 4.",
    },
    {
      ico: "&#128290;",
      en: "Decimal",
      es: "decimal",
      def: "A number with a dot to show parts of one. 0.75 means 75 hundredths.",
    },
    {
      ico: "&#128260;",
      en: "Convert",
      es: "convertir",
      def: "Change a value to another form. 3/4 = 0.75 = 75% all mean the same.",
    },
  ],

  complete: {
    art: "finish.png",
    alt: "Mateo celebrates on the balcony of his thriving mall with confetti and a happy crowd",
    badge: "&#127881;&#128717;&#65039;&#11088;",
    titleEn: "Mission Complete!",
    en: "You are a Shopping Mall Mogul! You used <b>unit rates</b> to find the best buys and <b>percent discounts</b> to run amazing sales. The mall is packed and the customers are happy. Great work!",
    es: "&iexcl;Eres un magnate del centro comercial! Usaste tasas unitarias y descuentos. &iexcl;Excelente trabajo!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Calculate the discount: A jacket costs <strong>$60</strong>. The store is offering a <strong>20% discount</strong>. How much money do you save?",
      promptEs:
        "Una chaqueta cuesta $60. La tienda ofrece un 20% de descuento. ¿Cuánto dinero ahorras?",
      choices: [
        { en: "A) $20 &nbsp;(confused 20% with $20)", correct: false },
        { en: "B) $12 &nbsp;(0.20 × 60 = 12) &nbsp;✅", correct: true },
        {
          en: "C) $48 &nbsp;(this is the final sale price, not the discount savings)",
          correct: false,
        },
      ],
      goodEn:
        "🏆 <b>Master Rank Certified!</b> Perfect work! You have fully mastered this unit. 🌟",
      badEn:
        "❌ That is incorrect. Review your calculations and try another option!",
      certifyTitle: "🏆 Master Certified: Mission Complete!",
    },
  },
};
