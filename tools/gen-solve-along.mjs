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

let written = 0;
for (const s of SPECS) {
  const outDir = path.join(ROOT, "math", s.unit, "projects", s.ver);
  if (!fs.existsSync(outDir)) {
    console.warn(`  ! missing dir: ${outDir}`);
    continue;
  }
  const cfg = {
    version: 1,
    solves: [
      {
        step: s.mount,
        title: s.title,
        prompt: s.prompt,
        steps: s.steps,
        answer: s.answer,
        yourTurn: {
          ask: s.yt.ask,
          unit: s.yt.unit,
          answer: s.yt.answer,
          expr: s.yt.expr,
          tolerance: s.yt.tolerance ?? 0.01,
          solution: s.yt.solution,
        },
      },
    ],
  };
  fs.writeFileSync(path.join(outDir, "solve-along.json"), JSON.stringify(cfg, null, 2) + "\n");
  written++;
}
console.log(`Wrote ${written} solve-along.json file(s).`);
