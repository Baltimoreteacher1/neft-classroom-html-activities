#!/usr/bin/env node
/**
 * Generator (source of truth) for the SOLVE-ALONG worked examples on the 22
 * unit culminating-project wizard pages. Emits one ./solve-along.json next to
 * each page's index.html. Each example uses PARALLEL numbers matched to the
 * project's theme + math strand (never the student's own project answer), and
 * ends in a self-checking "Your Turn" whose `expr` is re-verified against its
 * stored `answer` by tools/validate-solve-along.mjs.
 *
 * Edit the SPECS table below, then: node tools/gen-solve-along.mjs
 * Then validate: node tools/validate-solve-along.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const bi = (en, es) => ({ en, es });
const step = (doEn, doEs, math, whyEn, whyEs) => ({ do: bi(doEn, doEs), math, why: bi(whyEn, whyEs) });

/* One entry per page. mount = step-panel id that holds the core math.
   (Key-Words panel is step-1 on most pages; on the "step-0" pages —
   3a, 6b, 7b, 9b, statistics-b — the first math step is step-1.) */
const SPECS = [
  // ---- UNIT 1 · Greatest Common Factor / Least Common Multiple ----------
  {
    unit: "unit-1", ver: "version-a", mount: "step-2",
    title: bi("Goodie-Bag GCF", "MCD de las bolsas de regalo"),
    prompt: bi("You have 24 granola bars and 36 fruit snacks. What is the greatest number of identical goodie bags you can fill with none left over?",
      "Tienes 24 barras de granola y 36 bocaditos de fruta. ¿Cuál es el mayor número de bolsas idénticas que puedes llenar sin que sobre nada?"),
    steps: [
      step("Break each total into prime factors.", "Descompón cada total en factores primos.", "24 = 2×2×2×3   36 = 2×2×3×3",
        "Prime factors reveal what the two numbers share.", "Los factores primos muestran lo que ambos números comparten."),
      step("Multiply the factors both numbers share.", "Multiplica los factores que ambos comparten.", "GCF = 2×2×3 = 12",
        "The greatest common factor is the biggest number that divides both.", "El máximo común divisor es el mayor número que divide a ambos."),
      step("Split each total across the 12 bags.", "Reparte cada total entre las 12 bolsas.", "24 ÷ 12 = 2   36 ÷ 12 = 3",
        "Every bag gets 2 bars and 3 snacks — all identical.", "Cada bolsa recibe 2 barras y 3 bocaditos — todas iguales."),
    ],
    answer: bi("You can make 12 identical goodie bags.", "Puedes hacer 12 bolsas de regalo idénticas."),
    yt: {
      ask: bi("You have 18 water bottles and 30 juice boxes. Greatest number of identical bags?",
        "Tienes 18 botellas de agua y 30 jugos. ¿El mayor número de bolsas idénticas?"),
      unit: bi("bags", "bolsas"), answer: 6, expr: "6",
      solution: [
        step("Prime-factor both numbers.", "Factoriza ambos números.", "18 = 2×3×3   30 = 2×3×5",
          "Find shared prime factors.", "Halla los factores primos compartidos."),
        step("Multiply the shared factors.", "Multiplica los factores compartidos.", "GCF = 2×3 = 6",
          "6 is the greatest number that divides both.", "6 es el mayor número que divide a ambos."),
      ],
    },
  },
  {
    unit: "unit-1", ver: "version-b", mount: "step-2",
    title: bi("Matching Part Packs (LCM)", "Emparejar paquetes de piezas (mcm)"),
    prompt: bi("Bolts come in packs of 8 and nuts come in packs of 12. What is the fewest of each you can buy to have an equal number of bolts and nuts?",
      "Los tornillos vienen en paquetes de 8 y las tuercas en paquetes de 12. ¿Cuál es la menor cantidad de cada uno que puedes comprar para tener igual número?"),
    steps: [
      step("Prime-factor each pack size.", "Factoriza cada tamaño de paquete.", "8 = 2×2×2   12 = 2×2×3",
        "The LCM uses the most of each prime factor.", "El mcm usa la mayor cantidad de cada factor primo."),
      step("Take the most of each factor.", "Toma la mayor cantidad de cada factor.", "LCM = 2×2×2×3 = 24",
        "24 is the smallest number both 8 and 12 divide into.", "24 es el menor número divisible entre 8 y 12."),
      step("Count the packs of each.", "Cuenta los paquetes de cada uno.", "24 ÷ 8 = 3   24 ÷ 12 = 2",
        "Buy 3 bolt packs and 2 nut packs for 24 of each.", "Compra 3 paquetes de tornillos y 2 de tuercas para tener 24 de cada uno."),
    ],
    answer: bi("You need 24 of each — 3 bolt packs and 2 nut packs.", "Necesitas 24 de cada uno — 3 paquetes de tornillos y 2 de tuercas."),
    yt: {
      ask: bi("Wheels come in packs of 6 and motors in packs of 9. Fewest to have an equal number?",
        "Las ruedas vienen en paquetes de 6 y los motores en paquetes de 9. ¿La menor cantidad para tener igual número?"),
      unit: bi("of each", "de cada uno"), answer: 18, expr: "18",
      solution: [
        step("Prime-factor each pack size.", "Factoriza cada tamaño de paquete.", "6 = 2×3   9 = 3×3",
          "Take the most of each prime factor.", "Toma la mayor cantidad de cada factor primo."),
        step("Multiply for the LCM.", "Multiplica para el mcm.", "LCM = 2×3×3 = 18",
          "18 is the least common multiple.", "18 es el mínimo común múltiplo."),
      ],
    },
  },
  // ---- UNIT 2 · Dividing fractions --------------------------------------
  {
    unit: "unit-2", ver: "version-a", mount: "step-2",
    title: bi("How Many Batches?", "¿Cuántas tandas?"),
    prompt: bi("Each batch of muffins uses 3/4 cup of sugar. How many batches can you make with 6 cups of sugar?",
      "Cada tanda de panecillos usa 3/4 de taza de azúcar. ¿Cuántas tandas puedes hacer con 6 tazas de azúcar?"),
    steps: [
      step("Write it as a division.", "Escríbelo como división.", "6 ÷ 3/4",
        "Total sugar divided by the sugar per batch.", "Azúcar total dividida entre el azúcar por tanda."),
      step("Multiply by the reciprocal.", "Multiplica por el recíproco.", "6 × 4/3",
        "Dividing by a fraction means multiplying by its flip.", "Dividir entre una fracción es multiplicar por su inverso."),
      step("Multiply and simplify.", "Multiplica y simplifica.", "24/3 = 8",
        "Six cups makes exactly 8 batches.", "Seis tazas alcanzan para exactamente 8 tandas."),
    ],
    answer: bi("You can make 8 batches.", "Puedes hacer 8 tandas."),
    yt: {
      ask: bi("Each batch uses 2/3 cup of flour. How many batches from 8 cups of flour?",
        "Cada tanda usa 2/3 de taza de harina. ¿Cuántas tandas con 8 tazas de harina?"),
      unit: bi("batches", "tandas"), answer: 12, expr: "8/(2/3)",
      solution: [
        step("Set up the division.", "Plantea la división.", "8 ÷ 2/3",
          "Total flour ÷ flour per batch.", "Harina total ÷ harina por tanda."),
        step("Multiply by the reciprocal.", "Multiplica por el recíproco.", "8 × 3/2 = 24/2 = 12",
          "Flip the divisor and multiply.", "Invierte el divisor y multiplica."),
      ],
    },
  },
  {
    unit: "unit-2", ver: "version-b", mount: "step-2",
    title: bi("Cut-List Pieces", "Piezas de la lista de corte"),
    prompt: bi("A board is 10 ft long. Each shelf needs 5/4 ft. How many shelves can you cut?",
      "Una tabla mide 10 pies. Cada estante necesita 5/4 de pie. ¿Cuántos estantes puedes cortar?"),
    steps: [
      step("Write it as a division.", "Escríbelo como división.", "10 ÷ 5/4",
        "Board length divided by the length per shelf.", "Largo de la tabla dividido entre el largo por estante."),
      step("Multiply by the reciprocal.", "Multiplica por el recíproco.", "10 × 4/5",
        "Flip the divisor to divide by a fraction.", "Invierte el divisor para dividir entre una fracción."),
      step("Multiply and simplify.", "Multiplica y simplifica.", "40/5 = 8",
        "The board yields 8 shelves.", "La tabla da 8 estantes."),
    ],
    answer: bi("You can cut 8 shelves.", "Puedes cortar 8 estantes."),
    yt: {
      ask: bi("A 9 ft board is cut into 3/4 ft pieces. How many pieces?",
        "Una tabla de 9 pies se corta en piezas de 3/4 de pie. ¿Cuántas piezas?"),
      unit: bi("pieces", "piezas"), answer: 12, expr: "9/(3/4)",
      solution: [
        step("Set up the division.", "Plantea la división.", "9 ÷ 3/4",
          "Length ÷ length per piece.", "Largo ÷ largo por pieza."),
        step("Multiply by the reciprocal.", "Multiplica por el recíproco.", "9 × 4/3 = 36/3 = 12",
          "Flip and multiply.", "Invierte y multiplica."),
      ],
    },
  },
  // ---- UNIT 3 · Ratios & rates (step-0 offset on A) ---------------------
  {
    unit: "unit-3", ver: "version-a", mount: "step-1",
    title: bi("Scale the Blend", "Escala la mezcla"),
    prompt: bi("A smoothie uses 3 cups of mango for every 2 cups of yogurt. How much yogurt do you need for 12 cups of mango?",
      "Un batido usa 3 tazas de mango por cada 2 tazas de yogur. ¿Cuánto yogur necesitas para 12 tazas de mango?"),
    steps: [
      step("Find the scale factor.", "Halla el factor de escala.", "12 ÷ 3 = 4",
        "12 cups of mango is 4 times the recipe amount.", "12 tazas de mango es 4 veces la cantidad de la receta."),
      step("Scale the yogurt part too.", "Escala también la parte del yogur.", "2 × 4 = 8",
        "Multiply both parts of a ratio by the same number.", "Multiplica ambas partes de la razón por el mismo número."),
    ],
    answer: bi("You need 8 cups of yogurt.", "Necesitas 8 tazas de yogur."),
    yt: {
      ask: bi("A blend uses 4 cups of berries to 3 cups of juice. Berries for 12 cups of juice?",
        "Una mezcla usa 4 tazas de bayas por 3 tazas de jugo. ¿Bayas para 12 tazas de jugo?"),
      unit: bi("cups", "tazas"), answer: 16, expr: "(12/3)*4",
      solution: [
        step("Find the scale factor.", "Halla el factor de escala.", "12 ÷ 3 = 4",
          "Juice grew 4 times.", "El jugo creció 4 veces."),
        step("Scale the berries.", "Escala las bayas.", "4 × 4 = 16",
          "Keep the ratio equivalent.", "Mantén la razón equivalente."),
      ],
    },
  },
  {
    unit: "unit-3", ver: "version-b", mount: "step-2",
    title: bi("Points Per Game", "Puntos por partido"),
    prompt: bi("A player scores 48 points in 6 games. What is the unit rate in points per game?",
      "Un jugador anota 48 puntos en 6 partidos. ¿Cuál es la tasa unitaria en puntos por partido?"),
    steps: [
      step("Divide points by games.", "Divide los puntos entre los partidos.", "48 ÷ 6",
        "A unit rate is the amount for exactly 1 game.", "Una tasa unitaria es la cantidad para exactamente 1 partido."),
      step("Compute the rate.", "Calcula la tasa.", "= 8 points per game",
        "8 points happen in each single game.", "8 puntos ocurren en cada partido individual."),
    ],
    answer: bi("The player averages 8 points per game.", "El jugador promedia 8 puntos por partido."),
    yt: {
      ask: bi("A player scores 63 points in 9 games. Points per game?",
        "Un jugador anota 63 puntos en 9 partidos. ¿Puntos por partido?"),
      unit: bi("points/game", "puntos/partido"), answer: 7, expr: "63/9",
      solution: [
        step("Divide to find the unit rate.", "Divide para hallar la tasa unitaria.", "63 ÷ 9 = 7",
          "Points for one game.", "Puntos por un partido."),
      ],
    },
  },
  // ---- UNIT 4 · Percents -------------------------------------------------
  {
    unit: "unit-4", ver: "version-a", mount: "step-4",
    title: bi("Add the Sales Tax", "Suma el impuesto sobre las ventas"),
    prompt: bi("A hoodie costs $20. Sales tax is 6%. What is the total price the customer pays?",
      "Una sudadera cuesta $20. El impuesto es del 6%. ¿Cuál es el precio total que paga el cliente?"),
    steps: [
      step("Find the tax amount.", "Halla el monto del impuesto.", "0.06 × 20 = 1.20",
        "Change 6% to 0.06, then multiply by the price.", "Convierte 6% a 0.06 y multiplica por el precio."),
      step("Add tax to the price.", "Suma el impuesto al precio.", "20 + 1.20 = 21.20",
        "The customer pays the price plus the tax.", "El cliente paga el precio más el impuesto."),
    ],
    answer: bi("The total price is $21.20.", "El precio total es $21.20."),
    yt: {
      ask: bi("A backpack costs $30 with 7% sales tax. What is the total price?",
        "Una mochila cuesta $30 con 7% de impuesto. ¿Cuál es el precio total?"),
      unit: bi("$", "$"), answer: 32.10, expr: "30 + 0.07*30",
      solution: [
        step("Find the tax.", "Halla el impuesto.", "0.07 × 30 = 2.10",
          "7% of $30.", "7% de $30."),
        step("Add it on.", "Súmalo.", "30 + 2.10 = 32.10",
          "Price plus tax.", "Precio más impuesto."),
      ],
    },
  },
  {
    unit: "unit-4", ver: "version-b", mount: "step-2",
    title: bi("Take the Discount", "Aplica el descuento"),
    prompt: bi("A jacket costs $40 and is 25% off. What is the sale price?",
      "Una chaqueta cuesta $40 y tiene 25% de descuento. ¿Cuál es el precio de oferta?"),
    steps: [
      step("Find the discount amount.", "Halla el monto del descuento.", "0.25 × 40 = 10",
        "25% becomes 0.25; multiply by the price.", "25% se vuelve 0.25; multiplica por el precio."),
      step("Subtract from the original.", "Resta del precio original.", "40 − 10 = 30",
        "The sale price is what is left after the discount.", "El precio de oferta es lo que queda tras el descuento."),
    ],
    answer: bi("The sale price is $30.", "El precio de oferta es $30."),
    yt: {
      ask: bi("A $60 game is 20% off. What is the sale price?",
        "Un videojuego de $60 tiene 20% de descuento. ¿Cuál es el precio de oferta?"),
      unit: bi("$", "$"), answer: 48, expr: "60 - 0.20*60",
      solution: [
        step("Find the discount.", "Halla el descuento.", "0.20 × 60 = 12",
          "20% of $60.", "20% de $60."),
        step("Subtract it.", "Réstalo.", "60 − 12 = 48",
          "Original minus discount.", "Precio original menos descuento."),
      ],
    },
  },
  // ---- UNIT 5 · Area & decimal operations -------------------------------
  {
    unit: "unit-5", ver: "version-a", mount: "step-2",
    title: bi("Area of the Rug", "Área de la alfombra"),
    prompt: bi("A rug is 4.5 ft by 6 ft. How many square feet of floor does it cover?",
      "Una alfombra mide 4.5 pies por 6 pies. ¿Cuántos pies cuadrados de piso cubre?"),
    steps: [
      step("Use the area formula.", "Usa la fórmula del área.", "A = length × width = 4.5 × 6",
        "Area of a rectangle is length times width.", "El área de un rectángulo es largo por ancho."),
      step("Multiply the decimals.", "Multiplica los decimales.", "= 27 sq ft",
        "4.5 × 6 gives the total coverage.", "4.5 × 6 da la cobertura total."),
    ],
    answer: bi("The rug covers 27 square feet.", "La alfombra cubre 27 pies cuadrados."),
    yt: {
      ask: bi("A rug is 3.2 ft by 5 ft. What is its area in square feet?",
        "Una alfombra mide 3.2 pies por 5 pies. ¿Cuál es su área en pies cuadrados?"),
      unit: bi("sq ft", "pies²"), answer: 16, expr: "3.2*5",
      solution: [
        step("Apply the formula.", "Aplica la fórmula.", "3.2 × 5 = 16",
          "Length times width.", "Largo por ancho."),
      ],
    },
  },
  {
    unit: "unit-5", ver: "version-b", mount: "step-2",
    title: bi("Cost of the Flooring", "Costo del piso"),
    prompt: bi("Flooring costs $2.50 per square foot. A room needs 12 square feet. What is the cost?",
      "El piso cuesta $2.50 por pie cuadrado. Una habitación necesita 12 pies cuadrados. ¿Cuál es el costo?"),
    steps: [
      step("Multiply area by price per sq ft.", "Multiplica el área por el precio por pie².", "12 × 2.50",
        "Cost is the area times the price of each square foot.", "El costo es el área por el precio de cada pie cuadrado."),
      step("Compute the total.", "Calcula el total.", "= 30.00",
        "Twelve square feet at $2.50 each is $30.", "Doce pies cuadrados a $2.50 cada uno son $30."),
    ],
    answer: bi("The flooring costs $30.00.", "El piso cuesta $30.00."),
    yt: {
      ask: bi("Paint costs $1.50 per square foot. A wall is 20 square feet. What is the cost?",
        "La pintura cuesta $1.50 por pie cuadrado. Una pared tiene 20 pies cuadrados. ¿Cuál es el costo?"),
      unit: bi("$", "$"), answer: 30, expr: "20*1.50",
      solution: [
        step("Multiply area by unit price.", "Multiplica el área por el precio unitario.", "20 × 1.50 = 30",
          "Square feet times price each.", "Pies cuadrados por precio de cada uno."),
      ],
    },
  },
  // ---- UNIT 6 · Evaluating expressions (step-0 offset on B) --------------
  {
    unit: "unit-6", ver: "version-a", mount: "step-2",
    title: bi("Run the Score Formula", "Ejecuta la fórmula de puntaje"),
    prompt: bi("A game's score is 10c + 50, where c is coins collected. What is the score for 7 coins?",
      "El puntaje de un juego es 10c + 50, donde c son las monedas recogidas. ¿Cuál es el puntaje con 7 monedas?"),
    steps: [
      step("Substitute the value.", "Sustituye el valor.", "10c + 50,  c = 7  →  10(7) + 50",
        "Replace the variable c with 7.", "Reemplaza la variable c por 7."),
      step("Follow order of operations.", "Sigue el orden de operaciones.", "70 + 50 = 120",
        "Multiply before you add.", "Multiplica antes de sumar."),
    ],
    answer: bi("The score is 120 points.", "El puntaje es 120 puntos."),
    yt: {
      ask: bi("The score is 8c + 25. What is the score for 5 coins?",
        "El puntaje es 8c + 25. ¿Cuál es el puntaje con 5 monedas?"),
      unit: bi("points", "puntos"), answer: 65, expr: "8*5+25",
      solution: [
        step("Substitute 5 for c.", "Sustituye 5 por c.", "8(5) + 25",
          "Plug in the coins.", "Reemplaza las monedas."),
        step("Multiply, then add.", "Multiplica y luego suma.", "40 + 25 = 65",
          "Order of operations.", "Orden de operaciones."),
      ],
    },
  },
  {
    unit: "unit-6", ver: "version-b", mount: "step-1",
    title: bi("Run the Pricing Formula", "Ejecuta la fórmula de precios"),
    prompt: bi("An app's cost is 3d + 5, where d is downloads in thousands. What is the cost for d = 4?",
      "El costo de una app es 3d + 5, donde d son las descargas en miles. ¿Cuál es el costo para d = 4?"),
    steps: [
      step("Substitute the value.", "Sustituye el valor.", "3d + 5,  d = 4  →  3(4) + 5",
        "Replace d with 4.", "Reemplaza d por 4."),
      step("Multiply, then add.", "Multiplica y luego suma.", "12 + 5 = 17",
        "Multiplication comes first.", "La multiplicación va primero."),
    ],
    answer: bi("The cost is $17.", "El costo es $17."),
    yt: {
      ask: bi("The cost is 6d + 2. What is the cost for d = 3?",
        "El costo es 6d + 2. ¿Cuál es el costo para d = 3?"),
      unit: bi("$", "$"), answer: 20, expr: "6*3+2",
      solution: [
        step("Substitute 3 for d.", "Sustituye 3 por d.", "6(3) + 2",
          "Plug in d.", "Reemplaza d."),
        step("Multiply, then add.", "Multiplica y luego suma.", "18 + 2 = 20",
          "Order of operations.", "Orden de operaciones."),
      ],
    },
  },
  // ---- UNIT 7 · Coordinate plane & integers (step-0 offset on B) --------
  {
    unit: "unit-7", ver: "version-a", mount: "step-2",
    title: bi("Distance on the Map", "Distancia en el mapa"),
    prompt: bi("On the park map, the gate is at (2, 3) and the coaster is at (2, 9). How far apart are they?",
      "En el mapa del parque, la entrada está en (2, 3) y la montaña rusa en (2, 9). ¿Qué tan separadas están?"),
    steps: [
      step("Notice the x-coordinates match.", "Observa que las coordenadas x coinciden.", "both x = 2 → move vertically",
        "Same x means the points line up straight up and down.", "La misma x significa que los puntos están alineados verticalmente."),
      step("Subtract the y-coordinates.", "Resta las coordenadas y.", "|9 − 3| = 6",
        "The absolute value gives the distance in units.", "El valor absoluto da la distancia en unidades."),
    ],
    answer: bi("They are 6 units apart.", "Están a 6 unidades de distancia."),
    yt: {
      ask: bi("Two stands are at (5, 1) and (5, 8). How many units apart?",
        "Dos puestos están en (5, 1) y (5, 8). ¿A cuántas unidades de distancia?"),
      unit: bi("units", "unidades"), answer: 7, expr: "8-1",
      solution: [
        step("Same x — subtract the y's.", "La misma x — resta las y.", "|8 − 1| = 7",
          "Vertical distance.", "Distancia vertical."),
      ],
    },
  },
  {
    unit: "unit-7", ver: "version-b", mount: "step-1",
    title: bi("Rise From the Deep", "Ascenso desde lo profundo"),
    prompt: bi("A submarine sits at −120 ft. It rises 45 ft. What is its new depth?",
      "Un submarino está a −120 pies. Asciende 45 pies. ¿Cuál es su nueva profundidad?"),
    steps: [
      step("Rising adds a positive.", "Ascender suma un positivo.", "−120 + 45",
        "Moving up the number line means adding.", "Subir en la recta numérica significa sumar."),
      step("Combine the integers.", "Combina los enteros.", "= −75",
        "From −120, move 45 toward zero.", "Desde −120, avanza 45 hacia el cero."),
    ],
    answer: bi("The new depth is −75 ft.", "La nueva profundidad es −75 pies."),
    yt: {
      ask: bi("A sub at −200 ft rises 80 ft. What is its new depth?",
        "Un submarino a −200 pies asciende 80 pies. ¿Cuál es su nueva profundidad?"),
      unit: bi("ft", "pies"), answer: -120, expr: "-200 + 80",
      solution: [
        step("Add the rise.", "Suma el ascenso.", "−200 + 80 = −120",
          "Rising is adding a positive.", "Ascender es sumar un positivo."),
      ],
    },
  },
  // ---- UNIT 8 · One-step equations --------------------------------------
  {
    unit: "unit-8", ver: "version-a", mount: "step-3",
    title: bi("Crack the Lock Equation", "Descifra la ecuación del candado"),
    prompt: bi("The clue says x + 7 = 20. Solve for x to reveal the lock code.",
      "La pista dice x + 7 = 20. Resuelve para x y revela el código del candado."),
    steps: [
      step("Write the equation.", "Escribe la ecuación.", "x + 7 = 20",
        "You want x alone on one side.", "Quieres x sola en un lado."),
      step("Undo +7 on both sides.", "Deshaz +7 en ambos lados.", "x + 7 − 7 = 20 − 7",
        "Subtract 7 — the inverse of adding 7 — from both sides.", "Resta 7 — la inversa de sumar 7 — en ambos lados."),
      step("Read the answer.", "Lee la respuesta.", "x = 13",
        "The scale stays balanced, so x = 13.", "La balanza queda equilibrada, así que x = 13."),
    ],
    answer: bi("The lock code is x = 13.", "El código del candado es x = 13."),
    yt: {
      ask: bi("Solve x + 9 = 25. What is x?", "Resuelve x + 9 = 25. ¿Cuánto vale x?"),
      unit: bi("", ""), answer: 16, expr: "25 - 9",
      solution: [
        step("Subtract 9 from both sides.", "Resta 9 en ambos lados.", "x = 25 − 9",
          "Undo the +9.", "Deshaz el +9."),
        step("Simplify.", "Simplifica.", "x = 16",
          "x is 16.", "x es 16."),
      ],
    },
  },
  {
    unit: "unit-8", ver: "version-b", mount: "step-2",
    title: bi("How Much Is Left to Raise?", "¿Cuánto falta por recaudar?"),
    prompt: bi("The goal is $150 and you have raised $90. Solve 90 + x = 150 to find how much is left.",
      "La meta es $150 y has recaudado $90. Resuelve 90 + x = 150 para hallar cuánto falta."),
    steps: [
      step("Write the equation.", "Escribe la ecuación.", "90 + x = 150",
        "x is the amount still needed.", "x es la cantidad que aún falta."),
      step("Subtract 90 from both sides.", "Resta 90 en ambos lados.", "x = 150 − 90",
        "Undo the +90 to isolate x.", "Deshaz el +90 para despejar x."),
      step("Simplify.", "Simplifica.", "x = 60",
        "You still need $60.", "Aún necesitas $60."),
    ],
    answer: bi("You still need $60.", "Aún necesitas $60."),
    yt: {
      ask: bi("Goal $200, raised $130. Solve 130 + x = 200. How much is left?",
        "Meta $200, recaudado $130. Resuelve 130 + x = 200. ¿Cuánto falta?"),
      unit: bi("$", "$"), answer: 70, expr: "200 - 130",
      solution: [
        step("Subtract 130 from both sides.", "Resta 130 en ambos lados.", "x = 200 − 130",
          "Isolate x.", "Despeja x."),
        step("Simplify.", "Simplifica.", "x = 70",
          "$70 is left to raise.", "Faltan $70 por recaudar."),
      ],
    },
  },
  // ---- UNIT 9 · Rates, ratio tables, proportional relationships ---------
  {
    unit: "unit-9", ver: "version-a", mount: "step-2",
    title: bi("Project the Growth", "Proyecta el crecimiento"),
    prompt: bi("A channel gains 250 subscribers every 5 days at a steady rate. How many will it gain in 20 days?",
      "Un canal gana 250 suscriptores cada 5 días a un ritmo constante. ¿Cuántos ganará en 20 días?"),
    steps: [
      step("Find the unit rate first.", "Halla primero la tasa unitaria.", "250 ÷ 5 = 50 per day",
        "Subscribers gained in a single day.", "Suscriptores ganados en un solo día."),
      step("Multiply by the number of days.", "Multiplica por el número de días.", "50 × 20 = 1000",
        "Steady rate means multiply the daily amount.", "Un ritmo constante significa multiplicar la cantidad diaria."),
    ],
    answer: bi("The channel gains 1000 subscribers in 20 days.", "El canal gana 1000 suscriptores en 20 días."),
    yt: {
      ask: bi("A video gets 180 views every 3 hours. How many views in 12 hours?",
        "Un video recibe 180 vistas cada 3 horas. ¿Cuántas vistas en 12 horas?"),
      unit: bi("views", "vistas"), answer: 720, expr: "(180/3)*12",
      solution: [
        step("Find views per hour.", "Halla las vistas por hora.", "180 ÷ 3 = 60",
          "Unit rate per hour.", "Tasa unitaria por hora."),
        step("Multiply by 12 hours.", "Multiplica por 12 horas.", "60 × 12 = 720",
          "Scale up to 12 hours.", "Escala a 12 horas."),
      ],
    },
  },
  {
    unit: "unit-9", ver: "version-b", mount: "step-1",
    title: bi("Cost Per Gigabyte", "Costo por gigabyte"),
    prompt: bi("Plan A charges $45 for 15 GB of data. What is the cost per gigabyte?",
      "El plan A cobra $45 por 15 GB de datos. ¿Cuál es el costo por gigabyte?"),
    steps: [
      step("Divide dollars by gigabytes.", "Divide dólares entre gigabytes.", "45 ÷ 15",
        "A unit rate is the cost for exactly 1 GB.", "Una tasa unitaria es el costo por exactamente 1 GB."),
      step("Compute the rate.", "Calcula la tasa.", "= $3 per GB",
        "Now you can fairly compare plans.", "Ahora puedes comparar planes de forma justa."),
    ],
    answer: bi("Plan A costs $3 per GB.", "El plan A cuesta $3 por GB."),
    yt: {
      ask: bi("Plan B charges $56 for 8 GB. What is the cost per GB?",
        "El plan B cobra $56 por 8 GB. ¿Cuál es el costo por GB?"),
      unit: bi("$/GB", "$/GB"), answer: 7, expr: "56/8",
      solution: [
        step("Divide to find the unit rate.", "Divide para hallar la tasa unitaria.", "56 ÷ 8 = 7",
          "Cost for one GB.", "Costo por un GB."),
      ],
    },
  },
  // ---- UNIT 10 · Volume of rectangular prisms ---------------------------
  {
    unit: "unit-10", ver: "version-a", mount: "step-2",
    title: bi("Volume of the Box", "Volumen de la caja"),
    prompt: bi("A shipping box is 5 in long, 3 in wide, and 4 in tall. What is its volume?",
      "Una caja de envío mide 5 pulg de largo, 3 pulg de ancho y 4 pulg de alto. ¿Cuál es su volumen?"),
    steps: [
      step("Use the volume formula.", "Usa la fórmula del volumen.", "V = l × w × h = 5 × 3 × 4",
        "Volume of a rectangular prism multiplies all three dimensions.", "El volumen de un prisma rectangular multiplica las tres dimensiones."),
      step("Multiply.", "Multiplica.", "= 60 cubic inches",
        "5 × 3 × 4 fills the whole box.", "5 × 3 × 4 llena toda la caja."),
    ],
    answer: bi("The volume is 60 cubic inches.", "El volumen es 60 pulgadas cúbicas."),
    yt: {
      ask: bi("A box is 6 in × 2 in × 5 in. What is its volume?",
        "Una caja mide 6 pulg × 2 pulg × 5 pulg. ¿Cuál es su volumen?"),
      unit: bi("cubic in", "pulg³"), answer: 60, expr: "6*2*5",
      solution: [
        step("Multiply all three dimensions.", "Multiplica las tres dimensiones.", "6 × 2 × 5 = 60",
          "Length × width × height.", "Largo × ancho × alto."),
      ],
    },
  },
  {
    unit: "unit-10", ver: "version-b", mount: "step-2",
    title: bi("Volume of the Tank", "Volumen del tanque"),
    prompt: bi("An aquarium is 8 in long, 4 in wide, and 10 in tall. What is its volume?",
      "Un acuario mide 8 pulg de largo, 4 pulg de ancho y 10 pulg de alto. ¿Cuál es su volumen?"),
    steps: [
      step("Use the volume formula.", "Usa la fórmula del volumen.", "V = l × w × h = 8 × 4 × 10",
        "Multiply the three dimensions of the prism.", "Multiplica las tres dimensiones del prisma."),
      step("Multiply.", "Multiplica.", "= 320 cubic inches",
        "That is how much water the tank holds.", "Esa es la cantidad de agua que contiene el tanque."),
    ],
    answer: bi("The volume is 320 cubic inches.", "El volumen es 320 pulgadas cúbicas."),
    yt: {
      ask: bi("A tank is 5 in × 5 in × 12 in. What is its volume?",
        "Un tanque mide 5 pulg × 5 pulg × 12 pulg. ¿Cuál es su volumen?"),
      unit: bi("cubic in", "pulg³"), answer: 300, expr: "5*5*12",
      solution: [
        step("Multiply all three dimensions.", "Multiplica las tres dimensiones.", "5 × 5 × 12 = 300",
          "Length × width × height.", "Largo × ancho × alto."),
      ],
    },
  },
  // ---- STATISTICS · Center & spread (step-0 offset on B) ----------------
  {
    unit: "statistics", ver: "version-a", mount: "step-2",
    title: bi("Find the Mean", "Halla la media"),
    prompt: bi("A dataset is 4, 8, 6, 2. What is the mean (average)?",
      "Un conjunto de datos es 4, 8, 6, 2. ¿Cuál es la media (promedio)?"),
    steps: [
      step("Add all the values.", "Suma todos los valores.", "4 + 8 + 6 + 2 = 20",
        "The sum is the total of every data point.", "La suma es el total de cada dato."),
      step("Divide by how many there are.", "Divide entre cuántos hay.", "20 ÷ 4 = 5",
        "Four values, so divide the sum by 4.", "Cuatro valores, así que divide la suma entre 4."),
    ],
    answer: bi("The mean is 5.", "La media es 5."),
    yt: {
      ask: bi("Find the mean of 3, 7, 5, 9.", "Halla la media de 3, 7, 5, 9."),
      unit: bi("", ""), answer: 6, expr: "(3+7+5+9)/4",
      solution: [
        step("Add the values.", "Suma los valores.", "3 + 7 + 5 + 9 = 24",
          "Total of the data.", "Total de los datos."),
        step("Divide by 4.", "Divide entre 4.", "24 ÷ 4 = 6",
          "Four values.", "Cuatro valores."),
      ],
    },
  },
  {
    unit: "statistics", ver: "version-b", mount: "step-1",
    title: bi("Find the Median", "Halla la mediana"),
    prompt: bi("A dataset is 5, 9, 2, 7, 6. What is the median (middle value)?",
      "Un conjunto de datos es 5, 9, 2, 7, 6. ¿Cuál es la mediana (valor central)?"),
    steps: [
      step("Order from least to greatest.", "Ordena de menor a mayor.", "2, 5, 6, 7, 9",
        "The median needs the data in order.", "La mediana necesita los datos en orden."),
      step("Find the middle value.", "Halla el valor central.", "middle of 5 values = 6",
        "With 5 values, the 3rd one is the center.", "Con 5 valores, el 3.º es el centro."),
    ],
    answer: bi("The median is 6.", "La mediana es 6."),
    yt: {
      ask: bi("Find the median of 8, 3, 5, 1, 9.", "Halla la mediana de 8, 3, 5, 1, 9."),
      unit: bi("", ""), answer: 5, expr: "5",
      solution: [
        step("Order the values.", "Ordena los valores.", "1, 3, 5, 8, 9",
          "Least to greatest.", "De menor a mayor."),
        step("Pick the middle one.", "Elige el del medio.", "3rd of 5 = 5",
          "The center value is the median.", "El valor central es la mediana."),
      ],
    },
  },
];

/* ------------------------------------------------------------------------
   EXTRAS — additive per-page content layered on top of each SPEC:
     • practice: two more self-checking problems (→ a 3-item Your Turn set
       with a mastery meter). Each `expr` is re-verified vs `answer`.
     • error: a "Spot the Mistake" error-analysis targeting that strand's #1
       grade-6 misconception. flawIndex points at the one wrong step.
     • solve2: an optional second guided worked example for projects whose
       second computational step deserves its own model.
   Keyed by "unit/version". Leaving the existing SPECS untouched keeps the
   already-shipped worked examples byte-stable.
   ------------------------------------------------------------------------ */
const it = (askEn, askEs, uEn, uEs, answer, expr, sol, tol) => ({
  ask: bi(askEn, askEs),
  unit: bi(uEn, uEs),
  answer,
  expr,
  tolerance: tol ?? 0.01,
  solution: sol,
});
const one = (doEn, doEs, math, whyEn, whyEs) => [step(doEn, doEs, math, whyEn, whyEs)];
const wk = (math, nEn, nEs) => (nEn ? { math, note: bi(nEn, nEs) } : { math });
const er = (mount, tEn, tEs, pEn, pEs, work, flawIndex, exEn, exEs, fixMath, fwEn, fwEs) => ({
  step: mount,
  title: bi(tEn, tEs),
  prompt: bi(pEn, pEs),
  work,
  flawIndex,
  explanation: bi(exEn, exEs),
  fix: { math: fixMath, why: bi(fwEn, fwEs) },
});

const EXTRAS = {
  "unit-1/version-a": {
    practice: [
      it("20 stickers and 30 pencils — greatest number of identical bags?", "20 calcomanías y 30 lápices — ¿el mayor número de bolsas idénticas?", "bags", "bolsas", 10, "10",
        one("Prime-factor and multiply the shared factors.", "Factoriza y multiplica los factores compartidos.", "20 = 2×2×5, 30 = 2×3×5 → GCF = 2×5 = 10", "10 is the greatest number that divides both.", "10 es el mayor número que divide a ambos.")),
      it("16 erasers and 24 markers — greatest number of identical bags?", "16 borradores y 24 marcadores — ¿el mayor número de bolsas idénticas?", "bags", "bolsas", 8, "8",
        one("Find the GCF.", "Halla el MCD.", "16 = 2×2×2×2, 24 = 2×2×2×3 → GCF = 2×2×2 = 8", "Multiply the factors both share.", "Multiplica los factores que ambos comparten.")),
    ],
    error: er("step-2", "Is this the GREATEST factor?", "¿Es este el MÁXIMO factor?",
      "Someone found how many identical bags fit 24 bars and 36 snacks:", "Alguien calculó cuántas bolsas idénticas caben con 24 barras y 36 bocaditos:",
      [wk("24 = 2×2×2×3,  36 = 2×2×3×3"), wk("Shared prime factors: 2 × 2 × 3"), wk("GCF = 2 × 3 = 6"), wk("So 6 identical bags")], 2,
      "Step 3 dropped one shared 2. The shared factors 2×2×3 multiply to 12, so the GCF is 12 — 6 divides both but isn't the greatest.", "El paso 3 omitió un 2 compartido. Los factores 2×2×3 dan 12, así que el MCD es 12 — 6 divide a ambos pero no es el mayor.",
      "GCF = 2 × 2 × 3 = 12", "Use every shared factor.", "Usa todos los factores compartidos."),
  },
  "unit-1/version-b": {
    practice: [
      it("Screws come in packs of 4, plates in packs of 6 — fewest for an equal number?", "Los tornillos vienen en paquetes de 4, las placas en paquetes de 6 — ¿el mínimo para igual número?", "of each", "de cada uno", 12, "12",
        one("Find the LCM.", "Halla el mcm.", "4 = 2×2, 6 = 2×3 → LCM = 2×2×3 = 12", "Least common multiple of 4 and 6.", "Mínimo común múltiplo de 4 y 6.")),
      it("Gears come in packs of 10, belts in packs of 15 — fewest for an equal number?", "Los engranajes vienen en paquetes de 10, las correas en paquetes de 15 — ¿el mínimo para igual número?", "of each", "de cada uno", 30, "30",
        one("Find the LCM.", "Halla el mcm.", "10 = 2×5, 15 = 3×5 → LCM = 2×3×5 = 30", "Take the greatest power of each prime.", "Toma la mayor potencia de cada primo.")),
    ],
    error: er("step-2", "Is this the LEAST multiple?", "¿Es este el MÍNIMO múltiplo?",
      "Someone matched packs of 8 bolts and packs of 12 nuts:", "Alguien emparejó paquetes de 8 tornillos y de 12 tuercas:",
      [wk("8 = 2×2×2,  12 = 2×2×3"), wk("Multiply the pack sizes: 8 × 12 = 96"), wk("So buy 96 of each")], 1,
      "Multiplying the two sizes gives A common multiple, but not the LEAST one. Take the greatest power of each prime: 2×2×2×3 = 24.", "Multiplicar los dos tamaños da UN múltiplo común, no el MENOR. Toma la mayor potencia de cada primo: 2×2×2×3 = 24.",
      "LCM = 2 × 2 × 2 × 3 = 24", "The LCM is usually smaller than the product.", "El mcm suele ser menor que el producto."),
  },
  "unit-2/version-a": {
    practice: [
      it("1/2 cup butter per batch, 5 cups of butter — how many batches?", "1/2 taza de mantequilla por tanda, 5 tazas — ¿cuántas tandas?", "batches", "tandas", 10, "5/(1/2)",
        one("Divide by the fraction.", "Divide entre la fracción.", "5 ÷ 1/2 = 5 × 2 = 10", "Multiply by the reciprocal.", "Multiplica por el recíproco.")),
      it("3/4 cup oats per batch, 9 cups of oats — how many batches?", "3/4 taza de avena por tanda, 9 tazas — ¿cuántas tandas?", "batches", "tandas", 12, "9/(3/4)",
        one("Divide by the fraction.", "Divide entre la fracción.", "9 ÷ 3/4 = 9 × 4/3 = 12", "Flip and multiply.", "Invierte y multiplica.")),
    ],
    error: er("step-2", "Did they flip the fraction?", "¿Invirtieron la fracción?",
      "Someone found how many 3/4-cup batches fit in 6 cups of sugar:", "Alguien calculó cuántas tandas de 3/4 de taza caben en 6 tazas de azúcar:",
      [wk("6 ÷ 3/4"), wk("= 6 × 3/4"), wk("= 18/4 = 4.5 batches")], 1,
      "To divide by a fraction, multiply by its RECIPROCAL. It should be 6 × 4/3, not 6 × 3/4.", "Para dividir entre una fracción, multiplica por su RECÍPROCO. Debe ser 6 × 4/3, no 6 × 3/4.",
      "6 × 4/3 = 24/3 = 8 batches", "Flip the divisor before multiplying.", "Invierte el divisor antes de multiplicar."),
  },
  "unit-2/version-b": {
    practice: [
      it("A 12 ft board, each piece 3/2 ft — how many pieces?", "Tabla de 12 pies, cada pieza 3/2 pies — ¿cuántas piezas?", "pieces", "piezas", 8, "12/(3/2)",
        one("Divide by the fraction.", "Divide entre la fracción.", "12 ÷ 3/2 = 12 × 2/3 = 8", "Multiply by the reciprocal.", "Multiplica por el recíproco.")),
      it("A 6 ft board, each piece 2/3 ft — how many pieces?", "Tabla de 6 pies, cada pieza 2/3 pies — ¿cuántas piezas?", "pieces", "piezas", 9, "6/(2/3)",
        one("Divide by the fraction.", "Divide entre la fracción.", "6 ÷ 2/3 = 6 × 3/2 = 9", "Flip and multiply.", "Invierte y multiplica.")),
    ],
    error: er("step-2", "Did they flip the fraction?", "¿Invirtieron la fracción?",
      "Someone found how many 5/4-ft shelves fit in a 10 ft board:", "Alguien calculó cuántos estantes de 5/4 pies caben en una tabla de 10 pies:",
      [wk("10 ÷ 5/4"), wk("= 10 × 5/4"), wk("= 50/4 = 12.5 shelves")], 1,
      "Dividing by a fraction means multiplying by its RECIPROCAL: 10 × 4/5, not 10 × 5/4.", "Dividir entre una fracción es multiplicar por su RECÍPROCO: 10 × 4/5, no 10 × 5/4.",
      "10 × 4/5 = 40/5 = 8 shelves", "Flip the divisor.", "Invierte el divisor."),
  },
  "unit-3/version-a": {
    practice: [
      it("Ratio 2 cups mango : 5 cups yogurt — yogurt for 8 cups mango?", "Razón 2 tazas mango : 5 tazas yogur — ¿yogur para 8 tazas de mango?", "cups", "tazas", 20, "(8/2)*5",
        one("Scale both parts equally.", "Escala ambas partes por igual.", "8 ÷ 2 = 4, then 5 × 4 = 20", "Multiply each part by the scale factor.", "Multiplica cada parte por el factor de escala.")),
      it("Ratio 5 fruit : 3 liquid — liquid for 20 cups of fruit?", "Razón 5 fruta : 3 líquido — ¿líquido para 20 tazas de fruta?", "cups", "tazas", 12, "(20/5)*3",
        one("Scale both parts equally.", "Escala ambas partes por igual.", "20 ÷ 5 = 4, then 3 × 4 = 12", "Keep the ratio equivalent.", "Mantén la razón equivalente.")),
    ],
    error: er("step-1", "Scale — multiply or add?", "Escalar — ¿multiplicar o sumar?",
      "Someone scaled a 3 mango : 2 yogurt blend up to 12 cups of mango:", "Alguien escaló una mezcla de 3 mango : 2 yogur hasta 12 tazas de mango:",
      [wk("3 cups mango : 2 cups yogurt"), wk("12 ÷ 3 = 4  (scale factor)"), wk("Yogurt = 2 + 4 = 6")], 2,
      "To keep a ratio equivalent you MULTIPLY each part by the scale factor — you don't add it. Yogurt = 2 × 4 = 8.", "Para mantener la razón equivalente, MULTIPLICA cada parte por el factor de escala — no lo sumes. Yogur = 2 × 4 = 8.",
      "Yogurt = 2 × 4 = 8 cups", "Multiply, don't add, the scale factor.", "Multiplica, no sumes, el factor de escala."),
    solve2: {
      mount: "step-3",
      title: bi("Better Buy — price per pound", "Mejor compra — precio por libra"),
      prompt: bi("Store A sells 3 lb of berries for $9.00. Store B sells 5 lb for $12.50. Which is the better buy?",
        "La tienda A vende 3 lb de bayas por $9.00. La tienda B vende 5 lb por $12.50. ¿Cuál es la mejor compra?"),
      steps: [
        step("Find Store A's price per pound.", "Halla el precio por libra de la tienda A.", "9.00 ÷ 3 = $3.00 per lb", "Unit price = total ÷ pounds.", "Precio unitario = total ÷ libras."),
        step("Find Store B's price per pound.", "Halla el precio por libra de la tienda B.", "12.50 ÷ 5 = $2.50 per lb", "Do the same for Store B.", "Haz lo mismo para la tienda B."),
        step("Compare the unit prices.", "Compara los precios unitarios.", "$2.50 < $3.00", "The lower price per pound is the better buy.", "El menor precio por libra es la mejor compra."),
      ],
      answer: bi("Store B is the better buy at $2.50 per pound.", "La tienda B es la mejor compra a $2.50 por libra."),
      yt: it("A store sells 8 lb for $20.00. What is the price per pound?", "Una tienda vende 8 lb por $20.00. ¿Cuál es el precio por libra?", "$/lb", "$/lb", 2.5, "20/8",
        one("Divide dollars by pounds.", "Divide dólares entre libras.", "20 ÷ 8 = $2.50 per lb", "Unit price.", "Precio unitario.")),
    },
  },
  "unit-3/version-b": {
    practice: [
      it("54 points in 6 games — points per game?", "54 puntos en 6 partidos — ¿puntos por partido?", "points/game", "puntos/partido", 9, "54/6",
        one("Divide points by games.", "Divide puntos entre partidos.", "54 ÷ 6 = 9", "Unit rate per game.", "Tasa unitaria por partido.")),
      it("40 points in 8 games — points per game?", "40 puntos en 8 partidos — ¿puntos por partido?", "points/game", "puntos/partido", 5, "40/8",
        one("Divide points by games.", "Divide puntos entre partidos.", "40 ÷ 8 = 5", "Points for one game.", "Puntos por un partido.")),
    ],
    error: er("step-2", "Which way does the rate go?", "¿En qué orden va la tasa?",
      "Someone found a player's points per game from 48 points in 6 games:", "Alguien calculó los puntos por partido de un jugador con 48 puntos en 6 partidos:",
      [wk("48 points in 6 games"), wk("6 ÷ 48 = 0.125"), wk("So 0.125 points per game")], 1,
      "Points per game means points ÷ games, not games ÷ points. It should be 48 ÷ 6 = 8.", "Puntos por partido significa puntos ÷ partidos, no partidos ÷ puntos. Debe ser 48 ÷ 6 = 8.",
      "48 ÷ 6 = 8 points per game", "Divide the top word by the bottom word.", "Divide la palabra de arriba entre la de abajo."),
  },
  "unit-4/version-a": {
    practice: [
      it("A $50 shirt with 8% sales tax — total price?", "Una camisa de $50 con 8% de impuesto — ¿precio total?", "$", "$", 54, "50 + 0.08*50",
        one("Add the tax to the price.", "Suma el impuesto al precio.", "50 + 0.08×50 = 50 + 4 = 54", "Price plus tax.", "Precio más impuesto.")),
      it("A $25 hat with 4% sales tax — total price?", "Un gorro de $25 con 4% de impuesto — ¿precio total?", "$", "$", 26, "25 + 0.04*25",
        one("Add the tax to the price.", "Suma el impuesto al precio.", "25 + 0.04×25 = 25 + 1 = 26", "Price plus tax.", "Precio más impuesto.")),
    ],
    error: er("step-4", "Is the total just the tax?", "¿El total es solo el impuesto?",
      "Someone found the total price of a $20 hoodie with 6% tax:", "Alguien calculó el precio total de una sudadera de $20 con 6% de impuesto:",
      [wk("Tax = 0.06 × 20 = 1.20"), wk("Total price = $1.20")], 1,
      "$1.20 is only the TAX. The customer pays the price PLUS the tax: 20 + 1.20 = 21.20.", "$1.20 es solo el IMPUESTO. El cliente paga el precio MÁS el impuesto: 20 + 1.20 = 21.20.",
      "20 + 1.20 = $21.20", "Add the tax back onto the price.", "Suma el impuesto de vuelta al precio."),
    solve2: {
      mount: "step-3",
      title: bi("Unit Rate Deal — price per item", "Oferta por unidad — precio por artículo"),
      prompt: bi("A 6-pack of drinks costs $9.00. What is the price per drink?", "Un paquete de 6 bebidas cuesta $9.00. ¿Cuál es el precio por bebida?"),
      steps: [
        step("Divide the price by the number of items.", "Divide el precio entre el número de artículos.", "9.00 ÷ 6 = $1.50 each", "Unit rate = total ÷ count.", "Tasa unitaria = total ÷ cantidad."),
        step("Compare to a single drink at $2.00.", "Compara con una bebida suelta a $2.00.", "$1.50 < $2.00", "The multipack has the lower unit price.", "El paquete tiene el menor precio unitario."),
      ],
      answer: bi("The 6-pack is $1.50 per drink — the better deal.", "El paquete de 6 sale a $1.50 por bebida — la mejor oferta."),
      yt: it("A 4-pack costs $10.00. What is the price per item?", "Un paquete de 4 cuesta $10.00. ¿Cuál es el precio por artículo?", "$/item", "$/artículo", 2.5, "10/4",
        one("Divide price by count.", "Divide precio entre cantidad.", "10 ÷ 4 = $2.50 each", "Unit price.", "Precio unitario.")),
    },
  },
  "unit-4/version-b": {
    practice: [
      it("$50 shoes, 30% off — sale price?", "Zapatos de $50, 30% de descuento — ¿precio de oferta?", "$", "$", 35, "50 - 0.30*50",
        one("Subtract the discount amount.", "Resta el monto del descuento.", "50 − 0.30×50 = 50 − 15 = 35", "Original minus discount.", "Precio original menos descuento.")),
      it("$80 coat, 15% off — sale price?", "Abrigo de $80, 15% de descuento — ¿precio de oferta?", "$", "$", 68, "80 - 0.15*80",
        one("Subtract the discount amount.", "Resta el monto del descuento.", "80 − 0.15×80 = 80 − 12 = 68", "Original minus discount.", "Precio original menos descuento.")),
    ],
    error: er("step-2", "Is 25% off the same as $25 off?", "¿25% de descuento es lo mismo que $25?",
      "Someone found the sale price of a $40 jacket that is 25% off:", "Alguien calculó el precio de oferta de una chaqueta de $40 con 25% de descuento:",
      [wk("25% off means take away 25"), wk("40 − 25 = 15")], 1,
      "25% OFF is not $25 off. First find 25% of $40 = $10, then subtract: 40 − 10 = 30.", "25% de descuento no es $25. Primero halla el 25% de $40 = $10, luego resta: 40 − 10 = 30.",
      "40 − (0.25 × 40) = 40 − 10 = $30", "Turn the percent into an amount first.", "Convierte el porcentaje en un monto primero."),
  },
  "unit-5/version-a": {
    practice: [
      it("A rug is 5 ft by 4 ft — area?", "Una alfombra mide 5 pies por 4 pies — ¿área?", "sq ft", "pies²", 20, "5*4",
        one("Multiply length by width.", "Multiplica largo por ancho.", "5 × 4 = 20", "Area of a rectangle.", "Área de un rectángulo.")),
      it("A rug is 2.5 ft by 6 ft — area?", "Una alfombra mide 2.5 pies por 6 pies — ¿área?", "sq ft", "pies²", 15, "2.5*6",
        one("Multiply length by width.", "Multiplica largo por ancho.", "2.5 × 6 = 15", "Multiply the decimal.", "Multiplica el decimal.")),
    ],
    error: er("step-2", "Area — add or multiply?", "Área — ¿sumar o multiplicar?",
      "Someone found the area of a 4.5 ft by 6 ft rug:", "Alguien calculó el área de una alfombra de 4.5 pies por 6 pies:",
      [wk("Area = length × width"), wk("= 4.5 + 6"), wk("= 10.5 sq ft")], 1,
      "Area MULTIPLIES the sides (adding them relates to perimeter). Area = 4.5 × 6 = 27.", "El área MULTIPLICA los lados (sumarlos se relaciona con el perímetro). Área = 4.5 × 6 = 27.",
      "4.5 × 6 = 27 sq ft", "Multiply length by width.", "Multiplica largo por ancho."),
  },
  "unit-5/version-b": {
    practice: [
      it("$3.00 per sq ft, 15 sq ft — total cost?", "$3.00 por pie², 15 pies² — ¿costo total?", "$", "$", 45, "3*15",
        one("Multiply area by price.", "Multiplica área por precio.", "15 × 3.00 = 45", "Square feet times price each.", "Pies cuadrados por precio de cada uno.")),
      it("$2.25 per sq ft, 8 sq ft — total cost?", "$2.25 por pie², 8 pies² — ¿costo total?", "$", "$", 18, "2.25*8",
        one("Multiply area by price.", "Multiplica área por precio.", "8 × 2.25 = 18", "Area times unit price.", "Área por precio unitario.")),
    ],
    error: er("step-2", "Check the decimal place", "Revisa el lugar decimal",
      "Someone found the cost of 12 sq ft of flooring at $2.50 per sq ft:", "Alguien calculó el costo de 12 pies² de piso a $2.50 por pie²:",
      [wk("Cost = 12 × 2.50"), wk("= 3.00")], 1,
      "12 × 2.50 = 30.00, not 3.00 — estimate to check: 12 × 2.5 is about 30.", "12 × 2.50 = 30.00, no 3.00 — estima para revisar: 12 × 2.5 es cerca de 30.",
      "12 × 2.50 = $30.00", "Estimate to catch a misplaced decimal.", "Estima para detectar un decimal mal colocado."),
  },
  "unit-6/version-a": {
    practice: [
      it("Score = 5c + 20. Find the score for 8 coins.", "Puntaje = 5c + 20. Halla el puntaje con 8 monedas.", "points", "puntos", 60, "5*8+20",
        one("Substitute, then multiply before adding.", "Sustituye, luego multiplica antes de sumar.", "5(8) + 20 = 40 + 20 = 60", "Order of operations.", "Orden de operaciones.")),
      it("Score = 12c + 10. Find the score for 4 coins.", "Puntaje = 12c + 10. Halla el puntaje con 4 monedas.", "points", "puntos", 58, "12*4+10",
        one("Substitute, then multiply before adding.", "Sustituye, luego multiplica antes de sumar.", "12(4) + 10 = 48 + 10 = 58", "Multiply first.", "Multiplica primero.")),
    ],
    error: er("step-2", "Which operation comes first?", "¿Qué operación va primero?",
      "Someone evaluated the score 10c + 50 for c = 7:", "Alguien evaluó el puntaje 10c + 50 para c = 7:",
      [wk("10(7) + 50"), wk("10 × 57 = 570")], 1,
      "Multiply before you add (order of operations): 10 × 7 = 70, then + 50 = 120. Don't add 7 + 50 first.", "Multiplica antes de sumar (orden de operaciones): 10 × 7 = 70, luego + 50 = 120. No sumes 7 + 50 primero.",
      "10 × 7 + 50 = 70 + 50 = 120", "Multiplication before addition.", "Multiplicación antes que suma."),
  },
  "unit-6/version-b": {
    practice: [
      it("Cost = 4d + 6. Find the cost for d = 5.", "Costo = 4d + 6. Halla el costo para d = 5.", "$", "$", 26, "4*5+6",
        one("Substitute, multiply, then add.", "Sustituye, multiplica y luego suma.", "4(5) + 6 = 20 + 6 = 26", "Order of operations.", "Orden de operaciones.")),
      it("Cost = 7d + 3. Find the cost for d = 2.", "Costo = 7d + 3. Halla el costo para d = 2.", "$", "$", 17, "7*2+3",
        one("Substitute, multiply, then add.", "Sustituye, multiplica y luego suma.", "7(2) + 3 = 14 + 3 = 17", "Multiply first.", "Multiplica primero.")),
    ],
    error: er("step-1", "Which operation comes first?", "¿Qué operación va primero?",
      "Someone evaluated the cost 3d + 5 for d = 4:", "Alguien evaluó el costo 3d + 5 para d = 4:",
      [wk("3(4) + 5"), wk("3 × 9 = 27")], 1,
      "Multiply before adding: 3 × 4 = 12, then + 5 = 17. Don't add 4 + 5 first.", "Multiplica antes de sumar: 3 × 4 = 12, luego + 5 = 17. No sumes 4 + 5 primero.",
      "3 × 4 + 5 = 12 + 5 = 17", "Multiplication before addition.", "Multiplicación antes que suma."),
    solve2: {
      mount: "step-3",
      title: bi("Net Profit — revenue minus cost", "Ganancia neta — ingresos menos costo"),
      prompt: bi("An app earns $500 in revenue and has $180 in costs. What is the net profit?",
        "Una app genera $500 en ingresos y tiene $180 en costos. ¿Cuál es la ganancia neta?"),
      steps: [
        step("Subtract cost from revenue.", "Resta el costo de los ingresos.", "Profit = revenue − cost = 500 − 180", "Net profit is what's left after costs.", "La ganancia neta es lo que queda después de los costos."),
        step("Compute.", "Calcula.", "= $320", "That is the money kept.", "Ese es el dinero que se conserva."),
      ],
      answer: bi("The net profit is $320.", "La ganancia neta es $320."),
      yt: it("Revenue is $750 and costs are $400. What is the net profit?", "Los ingresos son $750 y los costos $400. ¿Cuál es la ganancia neta?", "$", "$", 350, "750 - 400",
        one("Revenue minus cost.", "Ingresos menos costo.", "750 − 400 = 350", "Net profit.", "Ganancia neta.")),
    },
  },
  "unit-7/version-a": {
    practice: [
      it("From (3, 2) to (3, 10), same x — distance?", "De (3, 2) a (3, 10), misma x — ¿distancia?", "units", "unidades", 8, "10-2",
        one("Subtract the y-coordinates.", "Resta las coordenadas y.", "|10 − 2| = 8", "Vertical distance.", "Distancia vertical.")),
      it("From (1, 4) to (1, 9), same x — distance?", "De (1, 4) a (1, 9), misma x — ¿distancia?", "units", "unidades", 5, "9-4",
        one("Subtract the y-coordinates.", "Resta las coordenadas y.", "|9 − 4| = 5", "Vertical distance.", "Distancia vertical.")),
    ],
    error: er("step-2", "Distance — add or subtract?", "Distancia — ¿sumar o restar?",
      "Someone found the distance from (2, 3) to (2, 9):", "Alguien calculó la distancia de (2, 3) a (2, 9):",
      [wk("Same x, so use the y-values"), wk("3 + 9 = 12"), wk("So 12 units apart")], 1,
      "Distance on a vertical line SUBTRACTS the y-coordinates: |9 − 3| = 6, not 3 + 9.", "La distancia en una línea vertical RESTA las coordenadas y: |9 − 3| = 6, no 3 + 9.",
      "|9 − 3| = 6 units", "Subtract the coordinates that differ.", "Resta las coordenadas que difieren."),
  },
  "unit-7/version-b": {
    practice: [
      it("A sub at −80 ft rises 30 ft — new depth?", "Un submarino a −80 pies sube 30 pies — ¿nueva profundidad?", "ft", "pies", -50, "-80 + 30",
        one("Add the rise.", "Suma el ascenso.", "−80 + 30 = −50", "Rising moves toward zero.", "Ascender se acerca a cero.")),
      it("A sub at −150 ft rises 60 ft — new depth?", "Un submarino a −150 pies sube 60 pies — ¿nueva profundidad?", "ft", "pies", -90, "-150 + 60",
        one("Add the rise.", "Suma el ascenso.", "−150 + 60 = −90", "Move up the number line.", "Sube en la recta numérica.")),
    ],
    error: er("step-1", "Did the sign go the right way?", "¿El signo fue en la dirección correcta?",
      "Someone found the new depth of a sub at −120 ft that rises 45 ft:", "Alguien calculó la nueva profundidad de un submarino a −120 pies que sube 45 pies:",
      [wk("−120 + 45"), wk("= −165")], 1,
      "Rising moves UP toward zero, so the result is closer to 0: −120 + 45 = −75, not −165.", "Ascender mueve HACIA ARRIBA, hacia el cero, así que el resultado está más cerca de 0: −120 + 45 = −75, no −165.",
      "−120 + 45 = −75", "Adding a positive moves toward zero.", "Sumar un positivo se acerca a cero."),
  },
  "unit-8/version-a": {
    practice: [
      it("Solve x + 5 = 12. What is x?", "Resuelve x + 5 = 12. ¿Cuánto vale x?", "", "", 7, "12 - 5",
        one("Subtract 5 from both sides.", "Resta 5 en ambos lados.", "x = 12 − 5 = 7", "Undo the + 5.", "Deshaz el + 5.")),
      it("Solve x + 11 = 20. What is x?", "Resuelve x + 11 = 20. ¿Cuánto vale x?", "", "", 9, "20 - 11",
        one("Subtract 11 from both sides.", "Resta 11 en ambos lados.", "x = 20 − 11 = 9", "Undo the + 11.", "Deshaz el + 11.")),
    ],
    error: er("step-3", "Which inverse undoes + 7?", "¿Qué inversa deshace + 7?",
      "Someone solved x + 7 = 20 for the lock code:", "Alguien resolvió x + 7 = 20 para el código del candado:",
      [wk("x + 7 = 20"), wk("x + 7 + 7 = 20 + 7"), wk("x = 27")], 1,
      "To undo + 7, SUBTRACT 7 from both sides (the inverse operation): x = 20 − 7 = 13.", "Para deshacer + 7, RESTA 7 en ambos lados (la operación inversa): x = 20 − 7 = 13.",
      "x = 20 − 7 = 13", "Use the opposite operation.", "Usa la operación opuesta."),
  },
  "unit-8/version-b": {
    practice: [
      it("Solve 90 + x = 140. What is x?", "Resuelve 90 + x = 140. ¿Cuánto vale x?", "$", "$", 50, "140 - 90",
        one("Subtract 90 from both sides.", "Resta 90 en ambos lados.", "x = 140 − 90 = 50", "Undo the + 90.", "Deshaz el + 90.")),
      it("Solve 125 + x = 300. What is x?", "Resuelve 125 + x = 300. ¿Cuánto vale x?", "$", "$", 175, "300 - 125",
        one("Subtract 125 from both sides.", "Resta 125 en ambos lados.", "x = 300 − 125 = 175", "Undo the + 125.", "Deshaz el + 125.")),
    ],
    error: er("step-2", "Which number gets subtracted?", "¿Qué número se resta?",
      "Someone solved 90 + x = 150 for how much is left to raise:", "Alguien resolvió 90 + x = 150 para cuánto falta recaudar:",
      [wk("90 + x = 150"), wk("x = 90 − 150"), wk("x = −60")], 1,
      "Subtract 90 from the GOAL: x = 150 − 90 = 60. A fundraiser can't need −$60.", "Resta 90 de la META: x = 150 − 90 = 60. Una recaudación no puede necesitar −$60.",
      "x = 150 − 90 = 60", "Subtract the known part from the total.", "Resta la parte conocida del total."),
  },
  "unit-9/version-a": {
    practice: [
      it("300 subscribers in 6 days at a steady rate — how many in 18 days?", "300 suscriptores en 6 días a ritmo constante — ¿cuántos en 18 días?", "subscribers", "suscriptores", 900, "(300/6)*18",
        one("Find the daily rate, then scale.", "Halla la tasa diaria y escala.", "300 ÷ 6 = 50/day, then 50 × 18 = 900", "Unit rate times days.", "Tasa unitaria por días.")),
      it("120 views in 4 minutes at a steady rate — how many in 20 minutes?", "120 vistas en 4 minutos a ritmo constante — ¿cuántas en 20 minutos?", "views", "vistas", 600, "(120/4)*20",
        one("Find the rate per minute, then scale.", "Halla la tasa por minuto y escala.", "120 ÷ 4 = 30/min, then 30 × 20 = 600", "Unit rate times minutes.", "Tasa unitaria por minutos.")),
    ],
    error: er("step-2", "Did they use the unit rate?", "¿Usaron la tasa unitaria?",
      "Someone projected subscribers for 20 days, gaining 250 every 5 days:", "Alguien proyectó suscriptores para 20 días, ganando 250 cada 5 días:",
      [wk("250 subs every 5 days"), wk("250 × 20 = 5000")], 1,
      "Find the DAILY rate first: 250 ÷ 5 = 50 per day. Then × 20 days = 1000, not 5000.", "Halla primero la tasa DIARIA: 250 ÷ 5 = 50 por día. Luego × 20 días = 1000, no 5000.",
      "(250 ÷ 5) × 20 = 50 × 20 = 1000", "Scale from the unit rate, not the group total.", "Escala desde la tasa unitaria, no desde el total del grupo."),
  },
  "unit-9/version-b": {
    practice: [
      it("Plan: $60 for 12 GB — cost per GB?", "Plan: $60 por 12 GB — ¿costo por GB?", "$/GB", "$/GB", 5, "60/12",
        one("Divide dollars by gigabytes.", "Divide dólares entre gigabytes.", "60 ÷ 12 = $5 per GB", "Unit rate.", "Tasa unitaria.")),
      it("Plan: $36 for 6 GB — cost per GB?", "Plan: $36 por 6 GB — ¿costo por GB?", "$/GB", "$/GB", 6, "36/6",
        one("Divide dollars by gigabytes.", "Divide dólares entre gigabytes.", "36 ÷ 6 = $6 per GB", "Cost for one GB.", "Costo por un GB.")),
    ],
    error: er("step-1", "Which way does $/GB go?", "¿En qué orden va $/GB?",
      "Someone found the cost per GB of a $45 plan with 15 GB:", "Alguien calculó el costo por GB de un plan de $45 con 15 GB:",
      [wk("$45 for 15 GB"), wk("15 ÷ 45 = 0.33")], 1,
      "Cost per GB is dollars ÷ gigabytes: 45 ÷ 15 = $3 per GB. Dividing GB by dollars gives the wrong unit.", "El costo por GB es dólares ÷ gigabytes: 45 ÷ 15 = $3 por GB. Dividir GB entre dólares da la unidad equivocada.",
      "45 ÷ 15 = $3 per GB", "Dollars go on top for $ per GB.", "Los dólares van arriba para $ por GB."),
  },
  "unit-10/version-a": {
    practice: [
      it("A box is 4 in × 3 in × 2 in — volume?", "Una caja mide 4 pulg × 3 pulg × 2 pulg — ¿volumen?", "cubic in", "pulg³", 24, "4*3*2",
        one("Multiply all three dimensions.", "Multiplica las tres dimensiones.", "4 × 3 × 2 = 24", "Length × width × height.", "Largo × ancho × alto.")),
      it("A box is 5 in × 5 in × 4 in — volume?", "Una caja mide 5 pulg × 5 pulg × 4 pulg — ¿volumen?", "cubic in", "pulg³", 100, "5*5*4",
        one("Multiply all three dimensions.", "Multiplica las tres dimensiones.", "5 × 5 × 4 = 100", "Length × width × height.", "Largo × ancho × alto.")),
    ],
    error: er("step-2", "Volume — add or multiply?", "Volumen — ¿sumar o multiplicar?",
      "Someone found the volume of a 5 × 3 × 4 inch box:", "Alguien calculó el volumen de una caja de 5 × 3 × 4 pulgadas:",
      [wk("V = length × width × height"), wk("= 5 + 3 + 4"), wk("= 12 cubic inches")], 1,
      "Volume MULTIPLIES the three dimensions: 5 × 3 × 4 = 60. Adding them gives 12, which isn't a volume.", "El volumen MULTIPLICA las tres dimensiones: 5 × 3 × 4 = 60. Sumarlas da 12, que no es un volumen.",
      "5 × 3 × 4 = 60 cubic inches", "Multiply, don't add, the dimensions.", "Multiplica, no sumes, las dimensiones."),
    solve2: {
      mount: "step-3",
      title: bi("Surface Area from the Net", "Área de superficie desde la plantilla"),
      prompt: bi("A box is 5 in long, 3 in wide, and 4 in tall. What is its surface area?", "Una caja mide 5 pulg de largo, 3 pulg de ancho y 4 pulg de alto. ¿Cuál es su área de superficie?"),
      steps: [
        step("A box has 3 pairs of matching faces.", "Una caja tiene 3 pares de caras iguales.", "2(5×3) + 2(5×4) + 2(3×4)", "Each pair appears twice.", "Cada par aparece dos veces."),
        step("Find each pair's area.", "Halla el área de cada par.", "2(15) + 2(20) + 2(12) = 30 + 40 + 24", "Double each face area.", "Duplica el área de cada cara."),
        step("Add all the faces.", "Suma todas las caras.", "= 94 sq in", "Total surface area.", "Área de superficie total."),
      ],
      answer: bi("The surface area is 94 square inches.", "El área de superficie es 94 pulgadas cuadradas."),
      yt: it("A cube has edges of 2 in. What is its surface area? (6 equal faces)", "Un cubo tiene aristas de 2 pulg. ¿Cuál es su área de superficie? (6 caras iguales)", "sq in", "pulg²", 24, "6*(2*2)",
        one("Area of one face × 6.", "Área de una cara × 6.", "6 × (2 × 2) = 6 × 4 = 24", "All six faces are equal.", "Las seis caras son iguales.")),
    },
  },
  "unit-10/version-b": {
    practice: [
      it("A tank is 10 in × 4 in × 3 in — volume?", "Un tanque mide 10 pulg × 4 pulg × 3 pulg — ¿volumen?", "cubic in", "pulg³", 120, "10*4*3",
        one("Multiply all three dimensions.", "Multiplica las tres dimensiones.", "10 × 4 × 3 = 120", "Length × width × height.", "Largo × ancho × alto.")),
      it("A tank is 6 in × 6 in × 5 in — volume?", "Un tanque mide 6 pulg × 6 pulg × 5 pulg — ¿volumen?", "cubic in", "pulg³", 180, "6*6*5",
        one("Multiply all three dimensions.", "Multiplica las tres dimensiones.", "6 × 6 × 5 = 180", "Length × width × height.", "Largo × ancho × alto.")),
    ],
    error: er("step-2", "Is that a face or the volume?", "¿Es una cara o el volumen?",
      "Someone found the volume of an 8 × 4 × 10 inch tank:", "Alguien calculó el volumen de un tanque de 8 × 4 × 10 pulgadas:",
      [wk("Find the base: 8 × 4 = 32"), wk("So the volume is 32 cubic inches")], 1,
      "8 × 4 = 32 is only the BASE area. Volume also multiplies by the height: 32 × 10 = 320.", "8 × 4 = 32 es solo el área de la BASE. El volumen también multiplica por la altura: 32 × 10 = 320.",
      "8 × 4 × 10 = 320 cubic inches", "Multiply the base by the height.", "Multiplica la base por la altura."),
    solve2: {
      mount: "step-3",
      title: bi("Glass Area of an Open Tank", "Área de vidrio de un tanque abierto"),
      prompt: bi("An open-top tank is 8 in long, 4 in wide, and 10 in tall. How much glass covers the bottom and 4 sides (no top)?",
        "Un tanque sin tapa mide 8 pulg de largo, 4 pulg de ancho y 10 pulg de alto. ¿Cuánto vidrio cubre el fondo y los 4 lados (sin tapa)?"),
      steps: [
        step("An open tank has a bottom and 4 sides.", "Un tanque abierto tiene un fondo y 4 lados.", "bottom + 2 long sides + 2 short sides", "No top face on an open tank.", "Un tanque abierto no tiene cara superior."),
        step("Write each face area.", "Escribe el área de cada cara.", "(8×4) + 2(8×10) + 2(4×10)", "Bottom, then the matching side pairs.", "El fondo y luego los pares de lados iguales."),
        step("Add them up.", "Súmalas.", "32 + 160 + 80 = 272 sq in", "Total glass needed.", "Vidrio total necesario."),
      ],
      answer: bi("You need 272 square inches of glass.", "Necesitas 272 pulgadas cuadradas de vidrio."),
      yt: it("An open box is 5 in × 5 in × 6 in (no top). Glass for the bottom and 4 sides?", "Una caja abierta mide 5 pulg × 5 pulg × 6 pulg (sin tapa). ¿Vidrio para el fondo y 4 lados?", "sq in", "pulg²", 145, "5*5 + 4*(5*6)",
        one("Bottom plus four sides.", "Fondo más cuatro lados.", "(5×5) + 4(5×6) = 25 + 120 = 145", "No top face.", "Sin cara superior.")),
    },
  },
  "statistics/version-a": {
    practice: [
      it("Find the mean of 2, 4, 6, 8.", "Halla la media de 2, 4, 6, 8.", "", "", 5, "(2+4+6+8)/4",
        one("Add, then divide by how many.", "Suma y divide entre cuántos hay.", "(2+4+6+8) ÷ 4 = 20 ÷ 4 = 5", "Mean = sum ÷ count.", "Media = suma ÷ cantidad.")),
      it("Find the mean of 10, 20, 30.", "Halla la media de 10, 20, 30.", "", "", 20, "(10+20+30)/3",
        one("Add, then divide by how many.", "Suma y divide entre cuántos hay.", "(10+20+30) ÷ 3 = 60 ÷ 3 = 20", "Divide by 3 values.", "Divide entre 3 valores.")),
    ],
    error: er("step-2", "Did they finish the mean?", "¿Terminaron la media?",
      "Someone found the mean of 4, 8, 6, 2:", "Alguien calculó la media de 4, 8, 6, 2:",
      [wk("Add: 4 + 8 + 6 + 2 = 20"), wk("The mean is 20")], 1,
      "The mean divides the sum by the NUMBER of values: 20 ÷ 4 = 5, not 20.", "La media divide la suma entre el NÚMERO de valores: 20 ÷ 4 = 5, no 20.",
      "20 ÷ 4 = 5", "Don't forget to divide by the count.", "No olvides dividir entre la cantidad."),
    solve2: {
      mount: "step-3",
      title: bi("Spread — find the range", "Dispersión — halla el rango"),
      prompt: bi("A data set is 3, 9, 4, 12, 6. What is the range?", "Un conjunto de datos es 3, 9, 4, 12, 6. ¿Cuál es el rango?"),
      steps: [
        step("Find the greatest and least values.", "Halla el valor mayor y el menor.", "max = 12,  min = 3", "Range measures spread from low to high.", "El rango mide la dispersión de menor a mayor."),
        step("Subtract.", "Resta.", "12 − 3 = 9", "Range = max − min.", "Rango = máximo − mínimo."),
      ],
      answer: bi("The range is 9.", "El rango es 9."),
      yt: it("A data set is 5, 20, 8, 14. What is the range?", "Un conjunto de datos es 5, 20, 8, 14. ¿Cuál es el rango?", "", "", 15, "20 - 5",
        one("Max minus min.", "Máximo menos mínimo.", "20 − 5 = 15", "Range.", "Rango.")),
    },
  },
  "statistics/version-b": {
    practice: [
      it("Find the median of 4, 1, 3, 9, 7.", "Halla la mediana de 4, 1, 3, 9, 7.", "", "", 4, "4",
        one("Order first, then take the middle.", "Ordena primero y toma el central.", "1, 3, 4, 7, 9 → middle = 4", "Median of an ordered list.", "Mediana de una lista ordenada.")),
      it("Find the median of 6, 2, 8.", "Halla la mediana de 6, 2, 8.", "", "", 6, "6",
        one("Order first, then take the middle.", "Ordena primero y toma el central.", "2, 6, 8 → middle = 6", "Median of an ordered list.", "Mediana de una lista ordenada.")),
    ],
    error: er("step-1", "Did they order the data first?", "¿Ordenaron los datos primero?",
      "Someone found the median of 5, 9, 2, 7, 6:", "Alguien calculó la mediana de 5, 9, 2, 7, 6:",
      [wk("The middle of 5, 9, 2, 7, 6 is 2"), wk("So the median is 2")], 0,
      "You must ORDER the data first: 2, 5, 6, 7, 9. The middle value is 6, not 2.", "Debes ORDENAR los datos primero: 2, 5, 6, 7, 9. El valor central es 6, no 2.",
      "Ordered: 2, 5, 6, 7, 9 → median = 6", "Always sort before finding the middle.", "Siempre ordena antes de hallar el central."),
  },
};

/* Human-readable math strand per unit — used to label the device-local teacher
   "Signal Board" so misconception counts group by topic. */
const STRAND = {
  "unit-1": "GCF & LCM",
  "unit-2": "Dividing Fractions",
  "unit-3": "Ratios & Rates",
  "unit-4": "Percents",
  "unit-5": "Area & Decimals",
  "unit-6": "Expressions",
  "unit-7": "Coordinate Plane & Integers",
  "unit-8": "One-Step Equations",
  "unit-9": "Rates & Proportional Relationships",
  "unit-10": "Volume & Surface Area",
  statistics: "Statistics: Center & Spread",
};

let written = 0;
for (const s of SPECS) {
  const outDir = path.join(ROOT, "math", s.unit, "projects", s.ver);
  if (!fs.existsSync(outDir)) {
    console.warn(`  ! missing dir: ${outDir}`);
    continue;
  }
  const strand = STRAND[s.unit] || "Math";
  const extra = EXTRAS[`${s.unit}/${s.ver}`] || {};
  const primaryItem = {
    ask: s.yt.ask,
    unit: s.yt.unit,
    answer: s.yt.answer,
    expr: s.yt.expr,
    tolerance: s.yt.tolerance ?? 0.01,
    solution: s.yt.solution,
  };
  const items = [primaryItem, ...(Array.isArray(extra.practice) ? extra.practice : [])];

  const solves = [
    {
      step: s.mount,
      strand,
      title: s.title,
      prompt: s.prompt,
      steps: s.steps,
      answer: s.answer,
      yourTurn: { items },
    },
  ];
  if (extra.solve2) {
    const s2 = extra.solve2;
    solves.push({
      step: s2.mount,
      strand,
      title: s2.title,
      prompt: s2.prompt,
      steps: s2.steps,
      answer: s2.answer,
      yourTurn: { items: [s2.yt] },
    });
  }

  const cfg = { version: 1, solves };
  if (extra.error) cfg.errorChecks = [{ ...extra.error, strand }];

  fs.writeFileSync(path.join(outDir, "solve-along.json"), JSON.stringify(cfg, null, 2) + "\n");
  written++;
}
console.log(`Wrote ${written} solve-along.json file(s).`);
