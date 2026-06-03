/* STORY · Unit 10 · Graphic Novel #1 (Support) · Aquarium Architect
   Phase-2 build: full novel — Act 1 (Fill the Tank), Act 2 (Build the Glass),
   Final (The Grand Centerpiece), Glossary, Mission Complete + Master-Rank.
   All math, answers, distractors, Spanish, sentence frames, and glossary are
   carried verbatim from graphic-novels/unit10/graphic-novel-1.html (6.G.2).
   New: panels, speech, CORAL-voices-the-misconception, vocab/hint/coach pop-ups. */
window.GN_STORY = {
  meta: {
    unit: 10,
    version: 1,
    level: "Support",
    title: "Aquarium Architect 🐠🌊",
    standard: "6.G.2",
    readingStandard: "RL.6.1",
    assessment: "Graphic Novel U10 #1: Aquarium Architect",
    artBase: "../_art/unit10/",
    home: "../index.html",
  },

  cast: {
    architect: {
      name: "The Architect",
      role: "protagonist",
      color: "#ff8a3d",
      tagIcon: "👷",
      avatar: null,
      blurb: "You",
    },
    coral: {
      name: "CORAL",
      role: "companion",
      color: "#3da5ff",
      tagIcon: "🐟",
      avatar: null,
      blurb: "Design AI · adds faces instead of multiplying for volume",
    },
    log: { name: "Site Boss", role: "narrator", color: "#3da5ff" },
  },

  cover: {
    art: "cover.png",
    alt: "Maya, a young aquarium architect, stands in a grand aquarium with glowing fish tanks and floating blueprints",
    blurbEn:
      "You are Maya, a young architect. You will design a big aquarium! Each tank opens when you find the right <b>volume</b> (how much water fits) or the right <b>surface area</b> (how much glass you need). CORAL, your design AI, wants to help… but CORAL keeps adding when it should multiply, and mixes up area and volume. Catch its mistakes and open the aquarium!",
    blurbEs:
      "Eres Maya, una joven arquitecta. Vas a diseñar un gran acuario. Usa el <b>volumen</b> y el <b>área de superficie</b> para abrir cada tanque.",
    startLabel: "Start Mission 🚀",
  },

  acts: [
    /* ============================ ACT 1 ============================ */
    {
      id: "act1",
      tab: "Act 1: Fill the Tank",
      kicker: "Act 1 · Volume",
      title: "Fill the Tank",
      advanceLabel: "Fill the tank 🐠",
      steps: [
        {
          type: "beats",
          art: "volume.png",
          alt: "Maya points at a glowing wireframe rectangular fish tank with dimension arrows",
          lastLabel: "Stop CORAL ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Welcome, Maya! Our new aquarium needs tanks. First, fill the clownfish tank with the RIGHT amount of water.",
              es: "¡Bienvenida, Maya! El acuario necesita tanques. Primero, llena el tanque con la cantidad correcta de agua.",
            },
            {
              who: "log",
              caption: true,
              en: "If a tank has too little water, the fish get sick. If it has too much, the glass can crack. The amount must be exact.",
              es: "Si un tanque tiene muy poca agua, los peces se enferman. Si tiene demasiada, el vidrio se puede romper. La cantidad debe ser exacta.",
            },
            {
              who: "architect",
              en: "Got it! To know how much water fits, I find the VOLUME. Volume = length × width × height.",
              es: "¡Entendido! Para saber cuánta agua cabe, busco el VOLUMEN. Volumen = largo × ancho × alto.",
              vocab: [
                {
                  term: "VOLUME",
                  en: "How much space is inside. Volume = length × width × height. We measure it in cubic units (ft³).",
                  es: "Cuánto espacio hay dentro. Volumen = largo × ancho × alto. Se mide en unidades cúbicas (ft³).",
                },
              ],
            },
            {
              who: "coral",
              misconception: true,
              en: "Easy! The tank is 5, 4, and 3 — so the volume is 5 + 4 + 3 = 12 ft³. I'll fill it!",
              es: "¡Fácil! El tanque es 5, 4 y 3, así que el volumen es 5 + 4 + 3 = 12 ft³.",
            },
          ],
        },
        {
          type: "comprehension",
          id: "c1",
          skill: "key_details",
          standard: "RI.6.1",
          dok: 1,
          interaction: "mc",
          passageRef: "act1.beat2",
          ask: {
            who: "log",
            en: "According to the Site Boss, what happens if a tank has TOO MUCH water?",
            es: "Según el Jefe de Obra, ¿qué pasa si un tanque tiene DEMASIADA agua?",
          },
          choices: [
            {
              en: "The glass can crack.",
              es: "El vidrio se puede romper.",
              correct: true,
            },
            {
              en: "The fish get a bigger tank.",
              es: "Los peces reciben un tanque más grande.",
              correct: false,
            },
            {
              en: "Nothing happens at all.",
              es: "No pasa nada.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "1a",
          ask: {
            who: "coral",
            en: "Wait — read the tank size and stop me. The clownfish tank is a box. To find <b>volume</b>, multiply <b>length × width × height</b>. The tank is <b>5 ft long, 4 ft wide, 3 ft tall</b>. How much water fits?",
            es: "Volumen = largo × ancho × alto. ¿Cuánta agua cabe en un tanque de 5 × 4 × 3?",
          },
          hint: {
            en: "First multiply 5 × 4 = 20. Then 20 × 3 = ?",
            es: "Primero multiplica 5 × 4 = 20. Luego 20 × 3 = ?",
          },
          frame: {
            en: "“The volume of the tank is ____ × ____ × ____ = ____ cubic feet (ft³).”",
            es: "“El volumen del tanque es ____ × ____ × ____ = ____ pies cúbicos (ft³).”",
          },
          choices: [
            {
              en: "12 ft³ &nbsp;(that is 5 + 4 + 3, not multiply)",
              correct: false,
            },
            {
              en: "60 ft³ &nbsp;(5 × 4 × 3)",
              correct: true,
            },
            {
              en: "20 ft³ &nbsp;(that is only 5 × 4)",
              correct: false,
            },
          ],
          goodEn: "✅ Correct! 5 × 4 × 3 = 60 ft³. The clownfish tank is full!",
          goodEs: "¡Correcto! 5 × 4 × 3 = 60 ft³.",
          badEn:
            "❌ Not yet. For volume you MULTIPLY all three sides. Try the hint and try again.",
          badEs:
            "Aún no. Para el volumen se MULTIPLICAN los tres lados. Usa la pista.",
          solveBeat: {
            who: "architect",
            en: "Tank one is full! The next tank is shallow — only half a foot tall. I can still use length × width × height.",
            es: "¡El primer tanque está lleno! El siguiente es bajo: solo ½ pie de alto. Uso la misma fórmula.",
          },
        },
        {
          type: "comprehension",
          id: "c2",
          skill: "vocab_in_context",
          standard: "RI.6.4",
          dok: 2,
          interaction: "mc",
          passageRef: "act1.1a",
          ask: {
            who: "log",
            en: "In this story, what does <b>volume</b> mean?",
            es: "En esta historia, ¿qué significa <b>volumen</b>?",
          },
          hint: {
            en: "Think about why Maya MULTIPLIED the three sides, not added them.",
            es: "Piensa por qué Maya MULTIPLICÓ los tres lados, no los sumó.",
          },
          choices: [
            {
              en: "How much space (water) fits inside, found by length × width × height.",
              es: "Cuánto espacio (agua) cabe adentro, hallado con largo × ancho × alto.",
              correct: true,
            },
            {
              en: "How much glass covers the outside of the tank.",
              es: "Cuánto vidrio cubre el exterior del tanque.",
              correct: false,
            },
            {
              en: "The longest side of the tank.",
              es: "El lado más largo del tanque.",
              correct: false,
            },
          ],
        },
        {
          type: "challenge",
          id: "1b",
          ask: {
            who: "architect",
            en: "The seahorse tank is long but shallow. It is <b>6 ft long, 4 ft wide,</b> and only <b>½ ft tall</b>. Find the volume.",
            es: "El tanque mide 6 × 4 × ½. Encuentra el volumen.",
            vocab: [
              {
                term: "shallow",
                en: "An edge length that is a fraction, like ½ ft. Multiply just like a whole number: 24 × ½ = 12.",
                es: "Un borde que es una fracción, como ½ ft. Multiplica como un número entero: 24 × ½ = 12.",
              },
            ],
          },
          hint: {
            en: "6 × 4 = 24. Then 24 × ½ is the same as <b>half of 24</b>.",
            es: "6 × 4 = 24. Luego 24 × ½ es lo mismo que la mitad de 24.",
          },
          choices: [
            {
              en: "24 ft³ &nbsp;(you forgot to use the ½)",
              correct: false,
            },
            {
              en: "48 ft³ &nbsp;(that is doubling, not halving)",
              correct: false,
            },
            {
              en: "12 ft³ &nbsp;(24 × ½ = half of 24)",
              correct: true,
            },
          ],
          goodEn:
            "✅ Yes! 6 × 4 = 24, and 24 × ½ = 12 ft³. The shallow reef is ready!",
          goodEs: "¡Sí! 6 × 4 × ½ = 12 ft³.",
          badEn:
            "❌ Remember the ½. Multiplying by ½ means taking HALF. Half of 24 is 12.",
          badEs:
            "Recuerda el ½. Multiplicar por ½ es tomar la MITAD. La mitad de 24 es 12.",
          solveArt: "unlock.png",
          solveAlt:
            "The tank fills with sparkling water and colorful fish as Maya cheers",
          solveBeat: {
            who: "architect",
            en: "Both tanks are full! Now I have to BUILD the glass — that means surface area.",
            es: "¡Los dos tanques están llenos! Ahora construyo el vidrio: eso es área de superficie.",
          },
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
            who: "log",
            en: "Tap the line that shows the water amount must be <b>exact</b>.",
            es: "Toca la línea que muestra que la cantidad de agua debe ser <b>exacta</b>.",
          },
          choices: [
            {
              en: "“If it has too much, the glass can crack. The amount must be exact.”",
              es: "“Si tiene demasiada, el vidrio se puede romper. La cantidad debe ser exacta.”",
              correct: true,
            },
            {
              en: "“Now I have to BUILD the glass — that means surface area.”",
              es: "“Ahora construyo el vidrio: eso es área de superficie.”",
              correct: false,
            },
            {
              en: "“Volume = length × width × height.”",
              es: "“Volumen = largo × ancho × alto.”",
              correct: false,
            },
          ],
        },
      ],
    },

    /* ============================ ACT 2 ============================ */
    {
      id: "act2",
      tab: "Act 2: Build the Glass",
      kicker: "Act 2 · Surface Area & Nets",
      title: "Build the Glass",
      advanceLabel: "Build the glass 🧊",
      steps: [
        {
          type: "beats",
          art: "net.png",
          alt: "Maya unfolds a glass tank into a flat net of six rectangle panels",
          lastLabel: "Count the faces ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Great fills, Maya! Now we BUILD the glass. To know how much glass we need, find the SURFACE AREA.",
              es: "¡Buen trabajo! Ahora construimos el vidrio. Para saber cuánto vidrio, busca el ÁREA DE SUPERFICIE.",
            },
            {
              who: "log",
              caption: true,
              en: "Glass costs money, so we must order the EXACT amount. Too little and the tank leaks; too much and we waste the budget.",
              es: "El vidrio cuesta dinero, así que debemos pedir la cantidad EXACTA. Si es poco, el tanque gotea; si es mucho, gastamos de más.",
            },
            {
              who: "architect",
              en: "I'll unfold the tank into a flat NET. Then I add up the area of every face. Let's start by counting the faces.",
              es: "Desdoblo el tanque en una RED plana. Luego sumo el área de cada cara. Primero cuento las caras.",
              vocab: [
                {
                  term: "NET",
                  en: "A flat pattern you get when you unfold a box. It shows all 6 faces laid out flat.",
                  es: "Un patrón plano que obtienes al desdoblar una caja. Muestra las 6 caras planas.",
                },
              ],
            },
            {
              who: "coral",
              misconception: true,
              en: "A box has 4 sides, like a square — so 4 faces, right? I'll order 4 panels of glass!",
              es: "Una caja tiene 4 lados, como un cuadrado, ¿así que 4 caras? ¡Pediré 4 vidrios!",
            },
          ],
        },
        {
          type: "challenge",
          id: "2a",
          ask: {
            who: "coral",
            en: "Check me before I order the glass. To find <b>surface area</b>, we unfold the tank into a flat <b>net</b>. A box tank has how many flat glass faces to add up?",
            es: "Un prisma rectangular tiene ¿cuántas caras planas?",
            vocab: [
              {
                term: "surface area",
                en: "The total of all the face areas added together. We measure it in square units (ft²).",
                es: "El total de todas las áreas de las caras sumadas. Se mide en unidades cuadradas (ft²).",
              },
            ],
          },
          hint: {
            en: "Count the rectangles in the net: top, bottom, front, back, left, right.",
            es: "Cuenta los rectángulos de la red: arriba, abajo, frente, atrás, izquierda, derecha.",
          },
          choices: [
            {
              en: "4 faces &nbsp;(that misses the top and bottom)",
              correct: false,
            },
            {
              en: "6 faces &nbsp;(top, bottom, front, back, left, right)",
              correct: true,
            },
            {
              en: "8 faces &nbsp;(a box has only 6)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Right! A box (rectangular prism) has 6 faces: top, bottom, front, back, left, right.",
          goodEs: "¡Correcto! Un prisma rectangular tiene 6 caras.",
          badEn:
            "❌ Look at the net again and count every rectangle. A box has 6 faces.",
          badEs: "Mira la red otra vez y cuenta cada rectángulo. Son 6 caras.",
          solveBeat: {
            who: "architect",
            en: "Six faces, just like the net shows! Now I find the area of each one and add them all together.",
            es: "¡Seis caras, como muestra la red! Ahora hallo el área de cada una y las sumo.",
          },
        },
        {
          type: "challenge",
          id: "2b",
          ask: {
            who: "architect",
            en: "This tank is <b>4 ft long, 3 ft wide, 2 ft tall</b>. Each pair of faces matches. Add all six faces to get the <b>surface area</b> (how much glass).",
            es: "Suma las 6 caras del tanque de 4 × 3 × 2 para hallar el área de superficie.",
          },
          hint: {
            en: "front & back = 4×3 = 12 each. left & right = 3×2 = 6 each. top & bottom = 4×2 = 8 each. Add: 12+12+6+6+8+8.",
            es: "frente y atrás = 4×3 = 12 cada uno. izquierda y derecha = 3×2 = 6 cada uno. arriba y abajo = 4×2 = 8 cada uno. Suma: 12+12+6+6+8+8.",
          },
          frame: {
            en: "“A box has ____ faces. The surface area is the sum of all the faces: ____ ft².”",
            es: "“Una caja tiene ____ caras. El área de superficie es la suma de todas las caras: ____ ft².”",
          },
          choices: [
            {
              en: "26 ft² &nbsp;(that is only one of each face)",
              correct: false,
            },
            {
              en: "52 ft² &nbsp;(12+12+6+6+8+8)",
              correct: true,
            },
            {
              en: "24 ft² &nbsp;(that is the volume, not the glass)",
              correct: false,
            },
          ],
          goodEn:
            "✅ Perfect! 12+12+6+6+8+8 = 52 ft² of glass. The tank walls are built!",
          goodEs: "¡Perfecto! 12+12+6+6+8+8 = 52 ft² de vidrio.",
          badEn:
            "❌ Add ALL six faces. Each pair matches: 12+12, 6+6, 8+8. Use the hint.",
          badEs: "Suma las SEIS caras. Cada par es igual: 12+12, 6+6, 8+8.",
          solveBeat: {
            who: "architect",
            en: "The glass walls are up! One tank left — the grand centerpiece needs BOTH the water and the glass.",
            es: "¡Las paredes de vidrio están listas! Falta un tanque: el gran centro necesita el agua Y el vidrio.",
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
            who: "log",
            en: "What is Maya mainly doing in this chapter?",
            es: "¿Qué hace Maya principalmente en este capítulo?",
          },
          choices: [
            {
              en: "Finding the surface area so she can order the right amount of glass.",
              es: "Hallar el área de superficie para pedir la cantidad correcta de vidrio.",
              correct: true,
            },
            {
              en: "Filling each tank with the exact amount of water.",
              es: "Llenar cada tanque con la cantidad exacta de agua.",
              correct: false,
            },
            {
              en: "Teaching CORAL how to count to six.",
              es: "Enseñar a CORAL a contar hasta seis.",
              correct: false,
            },
          ],
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
            who: "log",
            en: "Put the steps Maya uses to build the glass in order.",
            es: "Ordena los pasos que usa Maya para construir el vidrio.",
          },
          items: [
            {
              en: "Unfold the tank into a flat net.",
              es: "Desdoblar el tanque en una red plana.",
              order: 1,
            },
            {
              en: "Count the 6 faces of the box.",
              es: "Contar las 6 caras de la caja.",
              order: 2,
            },
            {
              en: "Find the area of each face and add them all together.",
              es: "Hallar el área de cada cara y sumarlas todas.",
              order: 3,
            },
          ],
        },
      ],
    },

    /* ============================ FINAL ============================ */
    {
      id: "final",
      tab: "Final Tank",
      kicker: "Final Tank · Boss Build",
      title: "The Grand Centerpiece",
      advanceLabel: "Open the aquarium 🎉",
      steps: [
        {
          type: "beats",
          art: "final.png",
          alt: "Maya stands before a huge aquarium tank under construction with scaffolding and blueprints",
          lastLabel: "Build the grand tank ▶",
          beats: [
            {
              who: "log",
              caption: true,
              en: "Last build, Maya — the grand centerpiece tank! It needs BOTH the water amount AND the glass amount.",
              es: "¡Última construcción: el gran tanque central! Necesita el agua Y el vidrio.",
            },
            {
              who: "architect",
              en: "Volume for the water, surface area for the glass. I'm ready. Let's open this aquarium!",
              es: "Volumen para el agua, área de superficie para el vidrio. ¡Estoy lista! ¡Vamos a abrir el acuario!",
            },
            {
              who: "coral",
              misconception: true,
              en: "I'll start: volume and glass are the same kind of number, so 148 ft³ of water and 120 ft² of glass!",
              es: "Yo empiezo: el volumen y el vidrio son el mismo tipo de número, ¡así que 148 ft³ de agua y 120 ft² de vidrio!",
            },
          ],
        },
        {
          type: "challenge",
          id: "F",
          ask: {
            who: "architect",
            en: "Careful, CORAL — volume and glass are different! The big centerpiece tank is <b>6 ft long, 5 ft wide, 4 ft tall</b>. The build needs BOTH the <b>volume</b> (water) and the <b>surface area</b> (glass). Pick the line that is fully correct.",
            es: "Elige la línea correcta: el volumen y el área de superficie de un tanque de 6 × 5 × 4.",
          },
          hint: {
            en: "Volume = 6×5×4. Surface area: front/back 6×5=30 each, left/right 5×4=20 each, top/bottom 6×4=24 each. Add the six faces.",
            es: "Volumen = 6×5×4. Área de superficie: frente/atrás 6×5=30 cada uno, izquierda/derecha 5×4=20 cada uno, arriba/abajo 6×4=24 cada uno. Suma las seis caras.",
          },
          frame: {
            en: "“The volume is ____ ft³ and the surface area is ____ ft².”",
            es: "“El volumen es ____ ft³ y el área de superficie es ____ ft².”",
          },
          choices: [
            {
              en: "Volume = 120 ft³, &nbsp; Surface area = 74 ft²",
              correct: false,
            },
            {
              en: "Volume = 120 ft³, &nbsp; Surface area = 148 ft²",
              correct: true,
            },
            {
              en: "Volume = 148 ft³, &nbsp; Surface area = 120 ft²",
              correct: false,
            },
          ],
          goodEn:
            "✅ PERFECT BUILD! Volume = 6×5×4 = 120 ft³. Surface area = 30+30+20+20+24+24 = 148 ft². The grand tank is done!",
          goodEs: "¡CONSTRUCCIÓN PERFECTA! Volumen = 120 ft³ y área = 148 ft².",
          badEn:
            "❌ One part is off. Volume MULTIPLIES the 3 sides (120). Surface area ADDS the 6 faces (148, not 74).",
          badEs:
            "Una parte está mal. El volumen multiplica (120). El área suma las 6 caras (148).",
          solveBeat: {
            who: "architect",
            en: "The grand tank is full and the glass is set. The aquarium is ready to open!",
            es: "¡El gran tanque está lleno y el vidrio listo! ¡El acuario está listo para abrir!",
          },
        },
        {
          type: "comprehension",
          id: "c6",
          skill: "inference",
          standard: "RL.6.1",
          dok: 3,
          interaction: "mc",
          passageRef: "final",
          ask: {
            who: "log",
            en: "CORAL keeps mixing up volume and surface area. Why does CORAL keep getting it wrong?",
            es: "CORAL sigue confundiendo el volumen con el área de superficie. ¿Por qué se equivoca CORAL?",
          },
          hint: {
            en: "Look back: CORAL treats the water number and the glass number as the same kind of measurement.",
            es: "Mira atrás: CORAL trata el número del agua y el del vidrio como la misma medida.",
          },
          choices: [
            {
              en: "CORAL treats water (volume) and glass (surface area) as the same thing, but they are measured differently.",
              es: "CORAL trata el agua (volumen) y el vidrio (área) como lo mismo, pero se miden de forma distinta.",
              correct: true,
            },
            {
              en: "CORAL does not want the aquarium to open.",
              es: "CORAL no quiere que el acuario abra.",
              correct: false,
            },
            {
              en: "The tanks are the wrong size on the blueprints.",
              es: "Los tanques tienen el tamaño equivocado en los planos.",
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
            who: "log",
            en: "The grand tank is finished. What will Maya most likely do next?",
            es: "El gran tanque está terminado. ¿Qué hará Maya probablemente después?",
          },
          choices: [
            {
              en: "Open the aquarium so visitors and fish can come in.",
              es: "Abrir el acuario para que entren visitantes y peces.",
              correct: true,
            },
            {
              en: "Drain all the tanks she just filled.",
              es: "Vaciar todos los tanques que acaba de llenar.",
              correct: false,
            },
            {
              en: "Add the three sides together to find the volume again.",
              es: "Sumar los tres lados otra vez para hallar el volumen.",
              correct: false,
            },
          ],
        },
      ],
    },
  ],

  glossary: [
    {
      ico: "📦",
      en: "Rectangular prism",
      es: "prisma rectangular",
      def: "A box shape with 6 flat rectangle faces, like a fish tank.",
    },
    {
      ico: "💧",
      en: "Volume",
      es: "volumen",
      def: "How much space is inside. Volume = length × width × height. We measure it in cubic units (ft³).",
    },
    {
      ico: "📐",
      en: "Length, width, height",
      es: "largo, ancho, alto",
      def: "The three edge sizes of a box. We multiply all three to get the volume.",
    },
    {
      ico: "½",
      en: "Fractional edge",
      es: "borde fraccionario",
      def: "An edge length that is a fraction, like ½ ft. Multiply just like a whole number: 24 × ½ = 12.",
    },
    {
      ico: "🧊",
      en: "Net",
      es: "red (plantilla)",
      def: "A flat pattern you get when you unfold a box. It shows all 6 faces laid out flat.",
    },
    {
      ico: "⬜",
      en: "Face",
      es: "cara",
      def: "One flat side of a box. A rectangular prism has 6 faces.",
    },
    {
      ico: "📝",
      en: "Area",
      es: "área",
      def: "How much flat space a face covers. Area of a rectangle = length × width.",
    },
    {
      ico: "🧊",
      en: "Surface area",
      es: "área de superficie",
      def: "The total of all the face areas added together. We measure it in square units (ft²).",
    },
    {
      ico: "➕",
      en: "Cubic vs. square units",
      es: "unidades cúbicas y cuadradas",
      def: "Volume uses cubic units (ft³). Surface area uses square units (ft²).",
    },
  ],

  complete: {
    art: "complete.png",
    alt: "Maya cuts a ribbon at the grand opening of her finished aquarium full of fish and visitors",
    badge: "🎉🐠⭐",
    titleEn: "Mission Complete!",
    en: "You opened the aquarium, Maya! You used <b>volume</b> (length × width × height) to fill the tanks, and <b>surface area</b> from a <b>net</b> to build the glass. Amazing work, Architect!",
    es: "¡Misión cumplida! Usaste el volumen y el área de superficie. ¡Excelente trabajo!",
    master: {
      headingEn: "Prove your rank to certify your Master Certificate!",
      promptEn:
        "Marine volume: A rectangular seahorse tank is <strong>5 feet long, 3 feet wide, and 4 feet tall</strong>. What is its <strong>volume</strong>?",
      promptEs:
        "Un tanque mide 5 pies de largo, 3 de ancho y 4 de alto. ¿Cuál es su volumen?",
      choices: [
        {
          en: "A) 12 cubic feet &nbsp;(added dimensions together)",
          correct: false,
        },
        {
          en: "B) 60 cubic feet &nbsp;(5 × 3 × 4 = 60) &nbsp;✅",
          correct: true,
        },
        {
          en: "C) 20 cubic feet &nbsp;(only multiplied length by height)",
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
