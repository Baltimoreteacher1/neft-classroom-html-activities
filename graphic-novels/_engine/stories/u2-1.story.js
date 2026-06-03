/* STORY · Unit 2 · Graphic Novel #1 (Support) · Master Chef Kitchen: The Recipe Rescue
   Comic-engine port. Support tier: hints, sentence frames, Spanish, vocab pop-ups,
   one PIP-voices-the-misconception beat per act. All math, answers, distractors,
   Spanish, hints, frames, and glossary carried verbatim from
   graphic-novels/unit2/graphic-novel-1.html (6.NS.1).
   Protagonist = Chef (Kai / you); Companion = PIP, an over-eager kitchen bot that
   flips which number divides which ("÷ by 1/n = ÷ by n"). */
window.GN_STORY = {
  meta: {
    unit: 2,
    version: 1,
    level: "Support",
    title: "Master Chef Kitchen: The Recipe Rescue",
    standard: "6.NS.1",
    assessment: "Graphic Novel U2 #1: Master Chef Kitchen: The Recipe Rescue",
    artBase: "../_art/unit2/",
    home: "../index.html",
  },

  cast: {
    chef: {
      name: "Chef",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "🧑‍🍳",
      avatar: null,
      blurb: "You",
    },
    pip: {
      name: "PIP",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🤖",
      avatar: null,
      blurb: "Kitchen bot · flips which number divides which",
    },
    chef_log: { name: "Head Chef", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Kai, a young chef, strikes a hero pose in a glowing futuristic kitchen with floating order tickets",
    blurbEn:
      "You are <b>Kai</b>, a young chef. The restaurant is very busy! The pantry is locked. You must <b>divide fractions</b> to portion the food and unlock the kitchen. PIP, the kitchen bot, wants to help… but PIP keeps flipping which number divides which. Catch its mistakes and save dinner!",
    blurbEs:
      "Eres Kai, un chef joven. El restaurante está muy ocupado. Debes <b>dividir fracciones</b> para servir la comida y abrir la despensa.",
    startLabel: "Start Cooking 🛒",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: The Locked Pantry",
      kicker: "Act 1 · Lesson 2-1",
      title: "The Locked Pantry",
      advanceLabel: "Open the pantry 🛒",
      steps: [
        {
          type: "beats",
          art: "kitchen-orders.png",
          alt: "Kai stands at a prep station looking at floating order tickets and a locked pantry door",
          lastLabel: "Stop PIP ▶",
          beats: [
            {
              who: "chef_log",
              caption: true,
              en: "Kai! The dinner rush is here and the pantry is LOCKED. Only correct portions will open it!",
              es: "¡Kai! Llegaron muchos clientes y la despensa está CERRADA. ¡Solo las porciones correctas la abren!",
            },
            {
              who: "chef",
              en: "I can do this. The first ticket says 3 ÷ 1/4. Let me think about what that means.",
              es: "Puedo hacerlo. El primer ticket dice 3 ÷ 1/4. Voy a pensar qué significa.",
              vocab: [
                {
                  term: "ticket",
                  en: "An order from a customer. Each ticket tells the chef what to portion and serve.",
                  es: "Un pedido de un cliente. Cada ticket dice qué porción servir.",
                },
              ],
            },
            {
              who: "pip",
              misconception: true,
              en: "Easy, Chef! 3 ÷ 1/4 is just 3 times 1/4. I'll punch that in!",
              es: "¡Fácil, Chef! 3 ÷ 1/4 es 3 por 1/4. ¡Lo ingreso!",
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "chef",
            en: "Hold on, PIP — that's multiplying, not dividing. What does the ticket <b>3 ÷ 1/4</b> really mean?",
            es: "Espera, PIP: eso es multiplicar, no dividir. ¿Qué significa 3 ÷ 1/4?",
          },
          hint: {
            en: "“Divide by 1/4” means “How many <b>1/4-cup</b> pieces fit inside?” Think: how many quarters are in the whole amount?",
          },
          frame: {
            en: "“3 ÷ 1/4 means: how many ____-cup bowls fit in 3 cups. Each cup makes ____ quarter-cups, so the answer is 3 × ____ = ____ bowls.”",
          },
          choices: [
            {
              en: 'How much is 3 plus 1/4? <span class="note">(that is adding, not dividing)</span>',
              correct: false,
            },
            {
              en: 'How many 1/4-cup bowls can I fill from 3 cups? <span class="note">(divide 3 into 1/4-cup groups)</span>',
              correct: true,
            },
            {
              en: 'How much is 3 times 1/4? <span class="note">(that is multiplying, not dividing)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! 3 ÷ 1/4 asks how many 1/4-cup bowls fit in 3 cups. Now find the number!",
          goodEs:
            "¡Sí! 3 ÷ 1/4 pregunta cuántos tazones de 1/4 caben en 3 tazas.",
          badEn:
            "❌ That is a different operation. Dividing by 1/4 means counting how many 1/4-cup pieces fit. Try again.",
          badEs:
            "Esa es otra operación. Dividir entre 1/4 cuenta cuántos pedazos de 1/4 caben.",
          solveBeat: {
            who: "chef",
            en: "Got it! Now I just need the answer to fill the bowls and open the pantry.",
            es: "¡Entendido! Ahora necesito la respuesta para llenar los tazones y abrir la despensa.",
          },
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "chef",
            en: "Now find the answer. How many <b>1/4-cup</b> bowls can Kai fill from <b>3 cups</b> of soup? Solve <b>3 ÷ 1/4</b>.",
            es: "¿Cuántos tazones de 1/4 de taza salen de 3 tazas?",
          },
          hint: {
            en: "Each whole cup makes <b>4</b> quarter-cups. So 3 cups make 3 × 4. To divide by a fraction, flip it and multiply: 3 × 4/1 = 3 × 4.",
          },
          frame: {
            en: "“3 ÷ 1/4 means: how many ____-cup bowls fit in 3 cups. Each cup makes ____ quarter-cups, so the answer is 3 × ____ = ____ bowls.”",
          },
          choices: [
            {
              en: '3/4 of a bowl <span class="note">(that is 3 × 1/4, not dividing)</span>',
              correct: false,
            },
            {
              en: '12 bowls <span class="note">(3 × 4 = 12 quarter-cups)</span>',
              correct: true,
            },
            {
              en: '7 bowls <span class="note">(that is 3 + 4, not 3 × 4)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Perfect! Each cup makes 4 quarter-cups, so 3 × 4 = 12 bowls. PANTRY OPEN!",
          goodEs:
            "¡Perfecto! Cada taza da 4 cuartos, así 3 × 4 = 12 tazones. ¡Despensa abierta!",
          badEn:
            "❌ Not quite. Dividing by 1/4 means flip to 4 and multiply: 3 × 4. Use the hint.",
          badEs:
            "Casi. Dividir entre 1/4 es invertir a 4 y multiplicar: 3 × 4. Usa la pista.",
          solveArt: "pantry-open.png",
          solveAlt:
            "The pantry door bursts open with golden light as Kai raises a fist",
          solveBeat: {
            who: "chef",
            en: "12 bowls — the pantry is open! Thanks for the help, PIP, even the wrong guess.",
            es: "¡12 tazones, la despensa está abierta! Gracias, PIP.",
          },
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: The Big Order",
      kicker: "Act 2 · Lesson 2-2",
      title: "The Big Order",
      advanceLabel: "Send the order ⚡",
      steps: [
        {
          type: "beats",
          art: "scaling-recipe.png",
          alt: "Kai pours flour into measuring cups while scaling up a recipe",
          lastLabel: "Stop PIP ▶",
          beats: [
            {
              who: "chef_log",
              caption: true,
              en: "Nice work! Now a BIG party ordered. We must portion the stew and scale the sauce. Fast!",
              es: "¡Buen trabajo! Ahora pidió una fiesta GRANDE. Debemos servir el guiso y escalar la salsa. ¡Rápido!",
            },
            {
              who: "chef",
              en: "Six cups of stew, each plate gets 1/3 cup. I need to divide to count the plates.",
              es: "Seis tazas de guiso, cada plato lleva 1/3 de taza. Necesito dividir para contar los platos.",
              vocab: [
                {
                  term: "divide",
                  en: "To split an amount into equal groups, or to count how many equal pieces fit. 12 ÷ 4 = 3.",
                  es: "Repartir en grupos iguales, o contar cuántas piezas iguales caben. 12 ÷ 4 = 3.",
                },
              ],
            },
            {
              who: "pip",
              misconception: true,
              en: "6 ÷ 1/3 is just 6 ÷ 3 = 2 plates! Locking it in!",
              es: "6 ÷ 1/3 es 6 ÷ 3 = 2 platos. ¡Lo ingreso!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "chef",
            en: "Wait, PIP — dividing by 1/3 isn't dividing by 3. A big pot holds <b>6 cups</b> of stew, each plate gets a <b>1/3-cup</b> serving. How many plates? Solve <b>6 ÷ 1/3</b>.",
            es: "¿Cuántos platos de 1/3 de taza salen de 6 tazas?",
          },
          hint: {
            en: "Each cup makes <b>3</b> thirds. Flip 1/3 to get 3, then multiply: 6 × 3.",
          },
          frame: {
            en: "“6 ÷ 1/3 = 6 × ____ = ____ plates. To divide 3/4 ÷ 1/8, I flip 1/8 to get ____, so 3/4 × ____ = ____ dishes.”",
          },
          choices: [
            {
              en: '2 plates <span class="note">(that is 6 × 1/3, not dividing)</span>',
              correct: false,
            },
            {
              en: '18 plates <span class="note">(6 × 3 = 18)</span>',
              correct: true,
            },
            {
              en: '9 plates <span class="note">(that is 6 + 3, not 6 × 3)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Yes! Each cup makes 3 thirds, so 6 × 3 = 18 plates. Stew portioned!",
          goodEs: "¡Sí! Cada taza da 3 tercios, así 6 × 3 = 18 platos.",
          badEn:
            "❌ Dividing by 1/3 means flip to 3 and multiply: 6 × 3. Check the hint.",
          badEs:
            "Dividir entre 1/3 es invertir a 3 y multiplicar: 6 × 3. Revisa la pista.",
          solveBeat: {
            who: "chef",
            en: "Plates ready! Now the sauce: 3/4 cup, split into 1/8-cup dishes. Divide the fractions!",
            es: "¡Platos listos! Ahora la salsa: 3/4 de taza en platos de 1/8. ¡Divido las fracciones!",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "chef",
            en: "Kai has <b>3/4 cup</b> of sauce. Each small dish needs <b>1/8 cup</b>. How many dishes can Kai fill? Solve <b>3/4 ÷ 1/8</b>.",
            es: "¿Cuántos platos de 1/8 de taza salen de 3/4 de taza?",
          },
          hint: {
            en: "To divide fractions, <b>flip</b> the second one and multiply: 3/4 × 8/1 = (3 × 8) / 4 = 24/4.",
          },
          frame: {
            en: "“6 ÷ 1/3 = 6 × ____ = ____ plates. To divide 3/4 ÷ 1/8, I flip 1/8 to get ____, so 3/4 × ____ = ____ dishes.”",
          },
          choices: [
            {
              en: '3/32 of a dish <span class="note">(that is 3/4 × 1/8, not flipping)</span>',
              correct: false,
            },
            {
              en: '6 dishes <span class="note">(3/4 × 8 = 24/4 = 6)</span>',
              correct: true,
            },
            {
              en: '8 dishes <span class="note">(you forgot the 3/4)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ Great! Flip 1/8 to 8 and multiply: 3/4 × 8 = 24/4 = 6 dishes. ORDER READY!",
          goodEs:
            "¡Genial! Invierte 1/8 a 8 y multiplica: 3/4 × 8 = 24/4 = 6 platos.",
          badEn:
            "❌ Flip the SECOND fraction: 3/4 × 8/1 = 24/4 = 6. Try the hint.",
          badEs: "Invierte la SEGUNDA fracción: 3/4 × 8/1 = 24/4 = 6.",
          solveBeat: {
            who: "chef",
            en: "Sauce portioned into 6 dishes. The big order is sent — on to the banquet!",
            es: "Salsa repartida en 6 platos. ¡El pedido grande está listo!",
          },
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Dish",
      kicker: "Final Dish · Boss",
      title: "The Banquet",
      advanceLabel: "Serve the banquet 🌟",
      steps: [
        {
          type: "beats",
          art: "final-banquet.png",
          alt: "Kai rolls up sleeves to face a huge glowing banquet order ticket",
          lastLabel: "Stop PIP ▶",
          beats: [
            {
              who: "chef_log",
              caption: true,
              en: "The banquet table is the BIGGEST order tonight. One more portion problem, Kai. You ready?",
              es: "La mesa del banquete es el pedido MÁS GRANDE de la noche. Un problema más, Kai. ¿Listo?",
            },
            {
              who: "chef",
              en: "Four cups of curry, 2/3 cup per bowl. Flip and multiply. Let's serve the banquet!",
              es: "Cuatro tazas de curry, 2/3 de taza por tazón. Invierto y multiplico. ¡A servir el banquete!",
              vocab: [
                {
                  term: "multiply",
                  en: "Repeated adding of equal groups. 3 × 4 = 12. To divide by a fraction, flip it and multiply.",
                  es: "Sumar grupos iguales varias veces. 3 × 4 = 12. Para dividir entre una fracción, inviértela y multiplica.",
                },
              ],
            },
            {
              who: "pip",
              misconception: true,
              en: "I started it — 4 ÷ 2/3 is just 4 bowls! Sending it!",
              es: "Yo empecé: 4 ÷ 2/3 son 4 tazones. ¡Lo envío!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "chef",
            en: "Careful, PIP — you only flipped part of it. The banquet pot holds <b>4 cups</b> of curry. Each guest bowl takes <b>2/3 cup</b>. How many bowls can Kai serve? Solve <b>4 ÷ 2/3</b>.",
            es: "¿Cuántos tazones de 2/3 de taza salen de 4 tazas?",
          },
          hint: {
            en: "Flip 2/3 to get 3/2, then multiply: 4 × 3/2 = 12/2 = 6.",
          },
          frame: {
            en: "“4 ÷ 2/3: I flip 2/3 to get ____, so 4 × ____ = ____ ÷ 2 = ____ bowls.”",
          },
          choices: [
            {
              en: '4 bowls <span class="note">(you flipped only part of it)</span>',
              correct: false,
            },
            {
              en: '6 bowls <span class="note">(4 × 3/2 = 12/2 = 6)</span>',
              correct: true,
            },
            {
              en: '8/3 of a bowl <span class="note">(that is 4 × 2/3, not dividing)</span>',
              correct: false,
            },
          ],
          goodEn:
            "✅ BANQUET SERVED! 4 ÷ 2/3 = 4 × 3/2 = 12/2 = 6 bowls. Every guest is fed!",
          goodEs: "¡BANQUETE SERVIDO! 4 ÷ 2/3 = 4 × 3/2 = 12/2 = 6 tazones.",
          badEn:
            "❌ Flip 2/3 to 3/2, then 4 × 3/2 = 12/2 = 6. Use the hint and try again.",
          badEs: "Invierte 2/3 a 3/2, luego 4 × 3/2 = 12/2 = 6. Usa la pista.",
          solveBeat: {
            who: "chef",
            en: "Six bowls — the banquet is plated! The kitchen is saved.",
            es: "Seis tazones: ¡el banquete está servido! La cocina está salvada.",
          },
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "➗",
      en: "Divide",
      es: "dividir",
      def: "To split an amount into equal groups, or to count how many equal pieces fit. 12 ÷ 4 = 3.",
    },
    {
      ico: "🍰",
      en: "Fraction",
      es: "fracción",
      def: "A part of a whole. 1/4 means one of four equal pieces. The top is the numerator, the bottom is the denominator.",
    },
    {
      ico: "🥄",
      en: "Unit fraction",
      es: "fracción unitaria",
      def: "A fraction with 1 on top, like 1/3 or 1/4. It means one equal piece of the whole.",
    },
    {
      ico: "🔄",
      en: "Reciprocal (flip)",
      es: "recíproco (invertir)",
      def: "Turn a fraction upside down. The reciprocal of 1/4 is 4/1, and of 2/3 is 3/2.",
    },
    {
      ico: "✖️",
      en: "Multiply",
      es: "multiplicar",
      def: "Repeated adding of equal groups. 3 × 4 = 12. To divide by a fraction, flip it and multiply.",
    },
    {
      ico: "🍽️",
      en: "Serving (portion)",
      es: "porción",
      def: "One share of food, like 1/4 cup. Dividing finds how many servings fit in the whole amount.",
    },
    {
      ico: "⚖️",
      en: "Scale a recipe",
      es: "escalar una receta",
      def: "Make a recipe bigger or smaller by multiplying or dividing every amount by the same number.",
    },
    {
      ico: "🧮",
      en: "Quotient",
      es: "cociente",
      def: "The answer to a division problem. In 6 ÷ 1/3 = 18, the quotient is 18.",
    },
    {
      ico: "➡️",
      en: "Keep-Flip-Multiply",
      es: "Mantener-Invertir-Multiplicar",
      def: "A way to divide fractions: keep the first, flip the second, then multiply. 3/4 ÷ 1/8 = 3/4 × 8/1.",
    },
  ],

  complete: {
    art: "celebration.png",
    alt: "Kai proudly presents a banquet of finished dishes while chef friends cheer",
    badge: "🎉🛒⭐",
    titleEn: "Kitchen Saved!",
    en: "You did it, Chef Kai! You used <b>dividing fractions</b> to portion the soup, scale the recipes, and serve the whole banquet. Every guest is happy. Great cooking!",
    es: "¡Lo lograste, Chef Kai! Usaste la división de fracciones para servir a todos. ¡Excelente trabajo!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Scale the recipe: divide <strong>2/3 cup</strong> of milk into portion bowls of <strong>1/6 cup</strong> each. Solve 2/3 ÷ 1/6.",
      promptEs:
        "Divide 2/3 de taza de leche en tazones de 1/6 de taza cada uno. Resuelve 2/3 ÷ 1/6.",
      choices: [
        {
          en: "A) 1/9 bowl &nbsp;(multiplied denominators incorrectly)",
          correct: false,
        },
        {
          en: "B) 4 bowls &nbsp;(2/3 × 6/1 = 4) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 2 bowls &nbsp;(incorrect reciprocal multiplication)",
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
