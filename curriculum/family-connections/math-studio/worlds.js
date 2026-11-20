// Family Math Studio worlds: pure data and helpers. No DOM access, so node tests can import it.
// Worlds are listed in curriculum order; the four original worlds (recipe, market, garden, sale) are unchanged.
const minus = v => String(v).replace('-', '\u2212');

export const worlds = {
  game: {
    en: 'Game night', es: 'La noche de juegos', icon: '🎲',
    unit: ['game nights', 'noches de juegos'], min: 1, max: 8, initial: 3, base: 6,
    result: n => 6 * n,
    resultUnit: ['challenges tried', 'retos intentados'],
    story: ['Your family tries 6 challenges each game night. How many challenges in', 'Tu familia intenta 6 retos cada noche de juegos. ¿Cuántos retos en'],
    formula: n => `${n} × 6 = ${6 * n}`,
    reason: ['Each night adds the same group of 6, so small tries add up.', 'Cada noche suma el mismo grupo de 6, así que los intentos pequeños se acumulan.'],
    mistake: ['A learner says 4 game nights is 10 challenges because 6 + 4 = 10.', 'Alguien dice que 4 noches de juegos son 10 retos porque 6 + 4 = 10.'],
    fix: ['Each night adds a group of 6, so 4 nights make 6 + 6 + 6 + 6 = 24 challenges. Every try adds up.', 'Cada noche suma un grupo de 6, así que 4 noches son 6 + 6 + 6 + 6 = 24 retos. Cada intento suma.']
  },
  receipt: {
    en: 'The receipt', es: 'El recibo', icon: '🧾',
    unit: ['bottles', 'botellas'], min: 1, max: 10, initial: 3, base: 2.35,
    // Whole bottles times a price in cents, then back to dollars: no float drift in what is shown.
    result: n => (235 * n) / 100,
    show: v => `$${v.toFixed(2)}`,
    resultUnit: ['on the receipt', 'en el recibo'],
    story: ['One bottle of juice costs $2.35. What is the total for', 'Una botella de jugo cuesta $2.35. ¿Cuánto es el total de'],
    formula: n => `${n} × $2.35 = $${((235 * n) / 100).toFixed(2)}`,
    reason: ['Each bottle adds the same $2.35, so the total grows by $2.35 per bottle.', 'Cada botella suma los mismos $2.35, así que el total crece $2.35 por botella.'],
    mistake: ['A learner says 4 bottles cost $940 because 4 × 235 = 940.', 'Alguien dice que 4 botellas cuestan $940 porque 4 × 235 = 940.'],
    fix: ['$2.35 is 235 cents, and 4 × 235 = 940 cents. 940 cents is $9.40, because 100 cents make $1.', '$2.35 son 235 centavos, y 4 × 235 = 940 centavos. 940 centavos son $9.40, porque 100 centavos hacen $1.']
  },
  recipe: { en:'The recipe', es:'La receta', icon:'🥣', unit:['batches','lotes'], min:1,max:8, initial:2, base:3, result:n=>3*n, resultUnit:['cups of oats','tazas de avena'], story:['Each batch uses 3 cups of oats. How many cups for','Cada lote usa 3 tazas de avena. ¿Cuántas tazas para'], formula:n=>`${n} × 3 = ${3*n}`, reason:['The cups change by the same factor as the batches.','Las tazas cambian por el mismo factor que los lotes.'], mistake:['A learner says 4 batches need 7 cups because 3 + 4 = 7.','Alguien dice que 4 lotes necesitan 7 tazas porque 3 + 4 = 7.'], fix:['Each batch needs 3 cups. Four batches need 3 + 3 + 3 + 3 = 12 cups.','Cada lote necesita 3 tazas. Cuatro lotes necesitan 3 + 3 + 3 + 3 = 12 tazas.'] },
  sale: { en:'The sale',es:'La oferta',icon:'🏷️',unit:['dollars before discount','dólares antes del descuento'],min:5,max:60,step:5,initial:20,base:0.25,result:n=>n*0.25,resultUnit:['dollars saved','dólares ahorrados'],story:['A 25% discount means saving one fourth of the price. How much do you save on','Un descuento del 25% significa ahorrar la cuarta parte del precio. ¿Cuánto ahorras de'],formula:n=>`25% × $${n} = $${n/4}`,reason:['25% is one fourth, so divide the price by 4.','25% es una cuarta parte; divide el precio entre 4.'],mistake:['A learner says 25% off $40 means saving $25.','Alguien dice que un descuento del 25% de $40 significa ahorrar $25.'],fix:['25% of $40 is $10 because $40 ÷ 4 = $10.','El 25% de $40 es $10 porque $40 ÷ 4 = $10.'] },
  garden: { en:'The garden',es:'El jardín',icon:'🌱',unit:['meters long','metros de largo'],min:1,max:12,initial:3,base:4,result:n=>4*n,resultUnit:['square meters','metros cuadrados'],story:['A garden is 4 meters wide. What is its area when it is','Un jardín mide 4 metros de ancho. ¿Cuál es su área cuando mide'],formula:n=>`${n} m × 4 m = ${4*n} m²`,reason:['Area counts square units. Width stays 4 meters.','El área cuenta unidades cuadradas. El ancho sigue siendo 4 metros.'],mistake:['A learner says a 5 m by 4 m garden has area 18 m² because 5 + 4 + 5 + 4 = 18.','Alguien dice que un jardín de 5 m por 4 m tiene 18 m² porque 5 + 4 + 5 + 4 = 18.'],fix:['18 m is the perimeter. Area is 5 × 4 = 20 m².','18 m es el perímetro. El área es 5 × 4 = 20 m².'] },
  trail: {
    en: 'The trail mix', es: 'La mezcla de frutos secos', icon: '🍇',
    unit: ['cups of trail mix', 'tazas de mezcla'], min: 1, max: 9, initial: 3, base: 0.5,
    result: n => 2 * n,
    resultUnit: ['servings', 'porciones'],
    story: ['Each serving of trail mix is 1/2 cup. How many servings are in', 'Cada porción de mezcla de frutos secos es de 1/2 taza. ¿Cuántas porciones hay en'],
    formula: n => `${n} ÷ 1/2 = ${2 * n}`,
    reason: ['Each cup holds 2 half-cup servings, so there are twice as many servings as cups.', 'Cada taza tiene 2 porciones de media taza, así que hay el doble de porciones que de tazas.'],
    mistake: ['A learner says 4 cups give 2 servings because 4 ÷ 2 = 2.', 'Alguien dice que 4 tazas dan 2 porciones porque 4 ÷ 2 = 2.'],
    fix: ['Each cup holds 2 half-cup servings, so 4 cups give 4 × 2 = 8 servings. Dividing 4 by 1/2 gives 8.', 'Cada taza tiene 2 porciones de media taza, así que 4 tazas dan 4 × 2 = 8 porciones. Dividir 4 entre 1/2 da 8.']
  },
  cold: {
    en: 'The cold night', es: 'La noche fría', icon: '🌡️',
    unit: ['degrees', 'grados'], min: -10, max: 10, initial: -3, base: 7, signed: true,
    result: n => n - 7,
    show: v => minus(v),
    showAmount: v => minus(v),
    resultUnit: ['degrees', 'grados'],
    story: ['A cold night drops the temperature by 7 degrees. What is the new temperature if it starts at', 'Una noche fría baja la temperatura 7 grados. ¿Cuál es la temperatura nueva si empieza en'],
    formula: n => `${minus(n)} − 7 = ${minus(n - 7)}`,
    reason: ['A drop of 7 always moves the temperature 7 degrees down the number line, even below zero.', 'Una bajada de 7 siempre mueve la temperatura 7 grados hacia abajo en la recta numérica, incluso por debajo de cero.'],
    mistake: ['A learner says a 7-degree drop from −3 gives 4 because 7 − 3 = 4.', 'Alguien dice que bajar 7 grados desde −3 da 4 porque 7 − 3 = 4.'],
    fix: ['Dropping moves down the number line. From −3, going down 7 reaches −10, so −3 − 7 = −10.', 'Bajar es moverse hacia abajo en la recta numérica. Desde −3, bajar 7 llega a −10, así que −3 − 7 = −10.']
  },
  savings: {
    en: 'The savings jar', es: 'La alcancía', icon: '🪙',
    unit: ['weeks', 'semanas'], min: 1, max: 12, initial: 2, base: 4,
    result: n => 4 * n + 3,
    show: v => `$${v}`,
    resultUnit: ['in savings', 'en ahorros'],
    story: ['You start with $3 and save $4 every week. How much money do you have after', 'Empiezas con $3 y ahorras $4 cada semana. ¿Cuánto dinero tienes después de'],
    formula: n => `$4 × ${n} + $3 = $${4 * n + 3}`,
    reason: ['Equation: total = $4 × weeks + $3. The $4 repeats every week; the $3 is added once.', 'Ecuación: total = $4 × semanas + $3. Los $4 se repiten cada semana; los $3 se suman una sola vez.'],
    mistake: ['A learner says after 5 weeks you have $35 because 4 + 3 = 7 and 7 × 5 = 35.', 'Alguien dice que después de 5 semanas hay $35 porque 4 + 3 = 7 y 7 × 5 = 35.'],
    fix: ['The $3 is not saved every week. It is added once. After 5 weeks you have $4 × 5 + $3 = $23.', 'Los $3 no se ahorran cada semana; se suman una sola vez. Después de 5 semanas hay $4 × 5 + $3 = $23.']
  },
  bike: {
    en: 'The bike ride', es: 'El paseo en bicicleta', icon: '🚲',
    unit: ['hours', 'horas'], min: 1, max: 10, initial: 3, base: 8,
    result: n => 8 * n,
    resultUnit: ['miles', 'millas'],
    story: ['A family bikes 8 miles each hour. How many miles do they ride in', 'Una familia pedalea 8 millas cada hora. ¿Cuántas millas recorre en'],
    formula: n => `${n} h × 8 mi/h = ${8 * n} mi`,
    reason: ['Rule: miles = 8 × hours. The unit rate is 8 miles per hour, so every extra hour adds 8 miles.', 'Regla: millas = 8 × horas. La tasa unitaria es 8 millas por hora; cada hora más suma 8 millas.'],
    mistake: ['A learner reads the ordered pair (3, 24) as 3 miles in 24 hours.', 'Alguien lee el par ordenado (3, 24) como 3 millas en 24 horas.'],
    fix: ['In an ordered pair, the first number is hours and the second is miles. (3, 24) means 24 miles in 3 hours, because 3 × 8 = 24.', 'En un par ordenado, el primer número son las horas y el segundo, las millas. (3, 24) significa 24 millas en 3 horas, porque 3 × 8 = 24.']
  },
  market: { en:'The market', es:'El mercado', icon:'🛒', unit:['bags','bolsas'], min:1,max:10,initial:2,base:4,result:n=>4*n,resultUnit:['dollars','dólares'],story:['One bag of apples costs $4. What is the cost for','Una bolsa de manzanas cuesta $4. ¿Cuánto cuestan'],formula:n=>`${n} × $4 = $${4*n}`,reason:['The unit price stays $4 per bag.','El precio unitario sigue siendo $4 por bolsa.'],mistake:['A learner says 5 bags cost $9 because 5 + 4 = 9.','Alguien dice que 5 bolsas cuestan $9 porque 5 + 4 = 9.'],fix:['Five bags cost 5 × $4 = $20. The price is added once for each bag.','Cinco bolsas cuestan 5 × $4 = $20. Se suma el precio una vez por cada bolsa.'] }
};

// Curriculum unit (1-10) -> world. Unit 3 ratios: recipe; 4 percent: sale; 5 area: garden; 10 math is everywhere: market.
const UNIT_WORLD = { 1: 'game', 2: 'receipt', 3: 'recipe', 4: 'sale', 5: 'garden', 6: 'trail', 7: 'cold', 8: 'savings', 9: 'bike', 10: 'market' };

// Lesson ids look like '8-4', '6-9-part2', '3-2-part3'. Unknown or absent ids fall back to 'recipe'.
export function worldForLesson(lessonId) {
  const unit = /^(10|[1-9])(?:-|$)/.exec(String(lessonId ?? '').trim());
  return (unit && UNIT_WORLD[unit[1]]) || 'recipe';
}

export const showAmount = (world, v) => (world.showAmount ? world.showAmount(v) : String(v));
export const showResult = (world, v) => (world.show ? world.show(v) : String(v));

// 'more' | 'less' | 'same': what really happens to the result when the number moves from -> to.
export function outcome(world, from, to) {
  const a = world.result(from);
  const b = world.result(to);
  return b > a ? 'more' : b < a ? 'less' : 'same';
}
