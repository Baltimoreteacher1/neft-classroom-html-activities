// The "big idea" and "watch out" lines on a Learn page, in plain words (Kindergarten to Grade 8).
// Grades 4 to 8 rows are keyed "grade:id" because ids repeat across grades; K-3 rows may use a bare id.
// One row per skill: id|idea|watch out, each "English~Español". They replace the skill's own wording at load, and
// the Spanish is merged into the page dictionary (i18n-es-kid.js), so the table is the single source for both.
const ROWS = `
count-forward|Numbers go in order. Each next number is one more.~Los números van en orden. Cada número siguiente es uno más.|Keep going from the number you see. Do not start over at 1.~Sigue desde el número que ves. No empieces otra vez en 1.
count-cardinality|Count each thing one time. The last number tells how many.~Cuenta cada cosa una vez. El último número dice cuántas hay.|Do not count a thing twice. Do not skip one.~No cuentes una cosa dos veces. No te saltes ninguna.
subitize|You can see small groups at a glance.~Puedes ver grupos pequeños de un vistazo.|It is okay to count to check.~Está bien contar para comprobar.
compare-20|Match things one to one to see which group has more.~Empareja las cosas una por una para ver qué grupo tiene más.|Look at how many there are, not how big the numbers look.~Mira cuántos hay, no qué tan grandes se ven los números.
compose-10|A number can be made from two parts.~Un número se puede formar con dos partes.|The two parts must make the whole number.~Las dos partes deben formar el número completo.
add-sub-5|Adding puts groups together. Subtracting takes some away.~Sumar junta grupos. Restar quita algunos.|Start with the group you have first.~Empieza con el grupo que tienes primero.
story-add-sub-10|Act out a story with objects, a drawing, or a number sentence.~Representa un cuento con objetos, un dibujo o una oración numérica.|Listen: do things get more, get less, or get split up?~Escucha: ¿hay más, hay menos o se separan?
patterns|A pattern is a group that repeats again and again.~Un patrón es un grupo que se repite una y otra vez.|Find the whole group that repeats, not just the last one.~Busca todo el grupo que se repite, no solo el último.
count-patterns|In a counting pattern, the numbers change by the same amount each time.~En un patrón de conteo, los números cambian la misma cantidad cada vez.|Keep going from the last number. Do not start over.~Sigue desde el último número. No empieces de nuevo.
compare-100|Look at the tens first. Look at the ones only if the tens match.~Mira primero las decenas. Mira las unidades solo si las decenas son iguales.|The tens count most, so look at them first.~Las decenas cuentan más, así que míralas primero.
tens-ones|A number like 63 is made of tens and ones.~Un número como 63 tiene decenas y unidades.|In 63, the 6 means 60, not 6.~En 63, el 6 significa 60, no 6.
add-10|Add two numbers. The sum is 10 or less.~Suma dos números. La suma es 10 o menos.|Count on from the bigger number. Do not count it again.~Cuenta hacia adelante desde el número mayor. No lo vuelvas a contar.
subtract-10|Subtracting finds how many are left, or how many more.~Restar halla cuántos quedan, o cuántos más hay.|Keep track of how many you take away.~Lleva la cuenta de cuántos quitas.
make-10|Pairs that make 10 help with many other facts.~Las parejas que forman 10 ayudan con muchas otras operaciones.|The two numbers must make exactly 10.~Los dos números deben formar exactamente 10.
add-20|Make a ten first. Then add what is left.~Forma una decena primero. Luego suma lo que queda.|Do not forget the part that is left over.~No olvides la parte que sobra.
subtract-20|Subtract by taking away, or by asking what to add.~Resta quitando, o preguntando cuánto hay que sumar.|The answer is how many are left, not the number you counted up to.~La respuesta es cuántos quedan, no el número al que llegaste contando.
missing-addend|Find the missing part of the number sentence.~Halla la parte que falta en la oración numérica.|Do not add the total and the part you already know.~No sumes el total y la parte que ya sabes.
time|An hour has 60 minutes.~Una hora tiene 60 minutos.|At 60 minutes, go to the next hour.~Al llegar a 60 minutos, pasa a la hora siguiente.
measure-length|Length is how many same-size units fit along something.~La longitud es cuántas unidades del mismo tamaño caben a lo largo de algo.|Count the spaces, not the marks on the ruler.~Cuenta los espacios, no las marcas de la regla.
facts-20|Use doubles and make-a-ten to add fast.~Usa dobles y forma una decena para sumar rápido.|Use a smart way. Do not count every one.~Usa una forma inteligente. No cuentes uno por uno.
sub-facts-20|Add facts and subtract facts are a family.~Las operaciones de suma y de resta son una familia.|Start with the biggest number.~Empieza con el número más grande.
place-1000|A number like 392 has hundreds, tens, and ones.~Un número como 392 tiene centenas, decenas y unidades.|In 392, the 3 is worth 300.~En 392, el 3 vale 300.
compare-1000|Look at the hundreds first, then the tens, then the ones.~Mira primero las centenas, luego las decenas y luego las unidades.|Do not look at the ones only.~No mires solo las unidades.
skip-count|Skip counting adds the same amount again and again.~Contar saltando suma la misma cantidad una y otra vez.|Add the same amount every time.~Suma la misma cantidad cada vez.
add-100|Add the tens. Then add the ones.~Suma las decenas. Luego suma las unidades.|10 ones make 1 ten.~10 unidades forman 1 decena.
subtract-100|Take away the tens. Then take away the ones.~Quita las decenas. Luego quita las unidades.|You can trade 1 ten for 10 ones.~Puedes cambiar 1 decena por 10 unidades.
add-1000|Line up the hundreds, tens, and ones before you add.~Alinea las centenas, decenas y unidades antes de sumar.|Keep each number in its own place.~Mantén cada número en su lugar.
even-odd|An even number makes pairs with none left over.~Un número par forma parejas y no sobra ninguno.|The last number tells you if it is even or odd.~El último número te dice si es par o impar.
coins|Count coins by what each one is worth.~Cuenta las monedas por lo que vale cada una.|Four coins are not always four cents.~Cuatro monedas no siempre son cuatro centavos.
interpret-data|A graph shows how many are in each group.~Una gráfica muestra cuántos hay en cada grupo.|Compare the numbers, not the words.~Compara los números, no las palabras.
mul-0-5|Multiplying means equal groups.~Multiplicar es formar grupos iguales.|You can swap the order: 3 × 4 = 4 × 3.~Puedes cambiar el orden: 3 × 4 = 4 × 3.
mul-6-9|Break a hard fact into easier facts.~Separa una operación difícil en operaciones más fáciles.|Keep each group the same size.~Mantén cada grupo del mismo tamaño.
mul-10-12|Multiplying by 10, 20, 30 and so on is a basic fact with tens.~Multiplicar por 10, 20, 30 y así sucesivamente es una operación básica con decenas.|The zero shows the answer is in tens.~El cero muestra que la respuesta está en decenas.
division-facts|Dividing finds how many groups, or how many in each group.~Dividir halla cuántos grupos hay, o cuántos hay en cada grupo.|Think of the multiplication fact that matches.~Piensa en la multiplicación que corresponde.
add-sub-1000|Add or subtract each place. Trade when you need to.~Suma o resta cada lugar. Cambia cuando lo necesites.|Put a traded ten in the next place to the left.~Pon la decena cambiada en el siguiente lugar a la izquierda.
round|Rounding finds the closest ten or hundred.~Redondear halla la decena o centena más cercana.|5 or more rounds up.~5 o más se redondea hacia arriba.
fraction-equivalence|Equal fractions show the same amount with different-size pieces.~Las fracciones equivalentes muestran la misma cantidad con piezas de distinto tamaño.|Change the top and the bottom the same way.~Cambia el número de arriba y el de abajo de la misma manera.
fraction-compare|Compare fractions with the same bottom, the same top, or a picture.~Compara fracciones con el mismo número abajo, el mismo arriba o con un dibujo.|When the tops match, more pieces means smaller pieces.~Cuando los números de arriba son iguales, más piezas significan piezas más pequeñas.
area|Area is how many squares cover a shape.~El área es cuántos cuadrados cubren una figura.|Area multiplies. Perimeter adds.~El área se multiplica. El perímetro se suma.
perimeter|Perimeter is the distance around a shape.~El perímetro es la distancia alrededor de una figura.|Add the sides. Do not multiply them.~Suma los lados. No los multipliques.
elapsed-time|Elapsed time is how much time passes from the start to the end.~El tiempo transcurrido es cuánto tiempo pasa desde el inicio hasta el final.|Count forward in jumps you know.~Cuenta hacia adelante con saltos que conoces.
4:place-million|Each place is worth ten times the place to its right.~Cada lugar vale diez veces el lugar que está a su derecha.|A zero holds a place. Keep it, even though it adds nothing.~Un cero ocupa un lugar. Consérvalo, aunque no sume nada.
4:round-large|Look at the next digit to the right. 5 or more rounds up.~Mira el siguiente dígito a la derecha. Con 5 o más, se redondea hacia arriba.|Look at one digit only. Digits farther right do not matter.~Mira solo un dígito. Los dígitos más a la derecha no importan.
4:add-large|Add place by place, starting with the ones. Carry when a place reaches ten.~Suma lugar por lugar, empezando por las unidades. Lleva cuando un lugar llega a diez.|Line up places in columns. Do not line up by the commas.~Alinea los lugares en columnas. No alinees por las comas.
4:subtract-large|Subtract place by place. If the top digit is too small, trade from the next place.~Resta lugar por lugar. Si el dígito de arriba es muy pequeño, reagrupa del siguiente lugar.|After you trade, the place you traded from is now one less.~Después de reagrupar, el lugar del que tomaste ahora tiene uno menos.
4:multiply-1digit|To multiply a three-digit number by a one-digit number, multiply each place.~Para multiplicar un número de tres dígitos por uno de un dígito, multiplica cada lugar.|Add the number you carried to the next place's product.~Suma el número que llevaste al producto del siguiente lugar.
4:multiply-2digit|Split one number into tens and ones. Multiply each part, then add.~Separa un número en decenas y unidades. Multiplica cada parte y luego suma.|The tens part is worth ten times more. Do not forget the zero.~La parte de las decenas vale diez veces más. No olvides el cero.
4:division|Dividing is the opposite of multiplying. Ask: what times this number gives the total?~Dividir es lo contrario de multiplicar. Pregunta: ¿qué número por este da el total?|Write each answer digit above the right place.~Escribe cada dígito de la respuesta sobre el lugar correcto.
4:factors|Factors divide a number evenly. Multiples are that number times 1, 2, 3.~Los factores dividen un número de forma exacta. Los múltiplos son ese número por 1, 2, 3.|A factor is never bigger than the number. A multiple is never smaller.~Un factor nunca es mayor que el número. Un múltiplo nunca es menor.
4:fraction-equiv|Multiply the numerator (top) and denominator (bottom) by the same number. The fraction stays equal.~Multiplica el numerador (arriba) y el denominador (abajo) por el mismo número. La fracción sigue igual.|Adding the same number to top and bottom changes the fraction.~Sumar el mismo número arriba y abajo cambia la fracción.
4:fraction-compare|To compare fractions, make the pieces the same size first.~Para comparar fracciones, primero haz que las partes sean del mismo tamaño.|Do not look at the bottom numbers alone. Compare the amounts.~No mires solo los números de abajo. Compara las cantidades.
4:unit-conversion|One amount can have two names, like 1 foot and 12 inches.~Una cantidad puede tener dos nombres, como 1 pie y 12 pulgadas.|A smaller unit needs a bigger number for the same length.~Una unidad más pequeña necesita un número mayor para la misma longitud.
5:multiply-whole|Multiply by one place at a time. Add the parts to get the product.~Multiplica por un lugar a la vez. Suma las partes para obtener el producto.|Each part starts in its own place. Use zeros to hold places.~Cada parte empieza en su propio lugar. Usa ceros para guardar lugares.
5:divide-whole|Division splits a number into equal groups. Ask how many are in each group.~Dividir reparte un número en grupos iguales. Pregunta cuántos hay en cada grupo.|Check: multiply the answer by the number you divided by.~Comprueba: multiplica la respuesta por el número entre el que dividiste.
5:decimal-place|Places to the right of the decimal point are parts of one: tenths, hundredths.~Los lugares a la derecha del punto decimal son partes de uno: décimas, centésimas.|Zeros inside a decimal still hold a place. 0.05 is not 0.5.~Los ceros dentro de un decimal ocupan un lugar. 0.05 no es 0.5.
5:decimal-add|Line up the decimal points. Then add each place.~Alinea los puntos decimales. Luego suma cada lugar.|Line up the points, not the last digits.~Alinea los puntos, no los últimos dígitos.
5:decimal-sub|Line up the decimal points. Subtract place by place, like whole numbers.~Alinea los puntos decimales. Resta lugar por lugar, como en una resta normal.|Add zeros so both numbers have the same decimal places.~Agrega ceros para que los dos números tengan los mismos lugares decimales.
5:decimal-mul|Multiply as if there were no decimal points. Then place the point.~Multiplica como si no hubiera puntos decimales. Luego coloca el punto.|Estimate first so you know about how big the answer should be.~Estima primero para saber más o menos qué tan grande debe ser la respuesta.
5:fraction-add|Make the bottoms (denominators) the same first. Then add or subtract the tops.~Primero haz que los denominadores (los de abajo) sean iguales. Luego suma o resta los numeradores.|Never add the bottoms. The size of the pieces stays the same.~Nunca sumes los denominadores. El tamaño de las partes no cambia.
5:fraction-mul|Multiply top times top and bottom times bottom. You find a part of a part.~Multiplica arriba por arriba y abajo por abajo. Encuentras una parte de una parte.|You do not need the same bottoms to multiply.~No necesitas denominadores iguales para multiplicar.
5:fraction-of|Split the whole into equal parts. Then take the parts you need.~Divide el todo en partes iguales. Luego toma las partes que necesitas.|The bottom number is how many equal parts. The top is how many you take.~El número de abajo es cuántas partes iguales hay. El de arriba es cuántas tomas.
5:volume|Volume is how many unit cubes fill a solid.~El volumen es cuántos cubos de una unidad llenan un sólido.|Volume needs three measurements. Write the answer in cubic units.~El volumen necesita tres medidas. Escribe la respuesta en unidades cúbicas.
5:unit-fraction-division|Dividing can ask how many groups fit, or how much is in each group.~Dividir puede preguntar cuántos grupos caben, o cuánto hay en cada grupo.|Changing the order changes the question. Read each one carefully.~Cambiar el orden cambia la pregunta. Lee cada una con cuidado.
6:gcf|The GCF (greatest common factor) is the biggest number that divides both numbers.~El MCD (máximo común divisor) es el número más grande que divide a los dos números.|The factor must work for both numbers, not just one.~El factor debe servir para los dos números, no solo para uno.
6:lcm|The LCM (least common multiple) is the smallest number both numbers divide into.~El mcm (mínimo común múltiplo) es el número más pequeño que ambos números dividen exactamente.|Use a shared prime the most times it shows up in either number.~Usa un primo compartido la mayor cantidad de veces que aparece en cualquiera de los números.
6:divide-fractions|To divide by a fraction, multiply by its reciprocal (the flipped fraction).~Para dividir entre una fracción, multiplica por su recíproco (la fracción al revés).|Flip only the fraction you divide by, not both.~Voltea solo la fracción entre la que divides, no las dos.
6:decimal-ops|Estimate first. Multiply or divide as whole numbers, then place the decimal point.~Estima primero. Multiplica o divide como si no hubiera punto decimal y luego coloca el punto.|Multiplying by less than 1 can give a smaller answer.~Multiplicar por un número menor que 1 puede dar una respuesta más pequeña.
6:ratios|A ratio compares two amounts. Equivalent ratios multiply both by the same number.~Una razón compara dos cantidades. Las razones equivalentes multiplican ambas por el mismo número.|Adding the same number to both parts does not keep the ratio.~Sumar el mismo número a las dos partes no mantiene la razón.
6:unit-rates|A unit rate tells how much for exactly one unit, like miles per hour.~Una tasa unitaria dice cuánto hay por exactamente una unidad, como millas por hora.|Keep the units in your answer so you do not flip the rate.~Escribe las unidades en la respuesta para no invertir la tasa.
6:percent|Percent means out of 100. 25 percent is 25 out of 100.~Porcentaje significa de cada 100. 25 por ciento es 25 de cada 100.|Find the percent of the original whole, not of another number.~Halla el porcentaje del total original, no de otro número.
6:evaluate|Replace each variable (a letter) with its number. Then do the math.~Reemplaza cada variable (una letra) por su número. Luego haz los cálculos.|Only the letter changes. Keep the same operation signs.~Solo cambia la letra. Deja los mismos signos de operación.
6:one-step|Keep the equation balanced: do the same thing to both sides.~Mantén la ecuación en equilibrio: haz lo mismo en los dos lados.|Get the variable alone. Use the opposite operation.~Deja la variable sola. Usa la operación opuesta.
6:integers|Absolute value is the distance from zero. Distance is never negative.~El valor absoluto es la distancia a cero. Una distancia nunca es negativa.|Work inside the bars first. Do not just drop negative signs.~Resuelve primero lo que está entre las barras. No quites los signos negativos sin más.
6:triangle-area|A triangle is half of a rectangle with the same base and height.~Un triángulo es la mitad de un rectángulo con la misma base y altura.|The height must make a right angle with the base.~La altura debe formar un ángulo recto con la base.
7:integer-add|Think of a number line: the sign shows direction, the number shows distance.~Piensa en una recta numérica: el signo da la dirección y el número da la distancia.|With different signs, find the difference. Do not just add.~Con signos distintos, halla la diferencia. No sumes sin pensar.
7:integer-mul|Multiply the numbers first. Then decide if the answer is positive or negative.~Primero multiplica los números. Luego decide si la respuesta es positiva o negativa.|Same signs give positive. Different signs give negative.~Signos iguales dan positivo. Signos distintos dan negativo.
7:fraction-ops|Rational numbers can be positive or negative fractions. Use fraction rules and sign rules.~Los números racionales pueden ser fracciones positivas o negativas. Usa las reglas de fracciones y de signos.|Subtracting a negative is the same as adding a positive.~Restar un negativo es lo mismo que sumar un positivo.
7:proportions|A proportion says two ratios are equal. Use that to find the missing value.~Una proporción dice que dos razones son iguales. Úsalo para hallar el valor que falta.|Put matching things in matching spots, like miles over hours both times.~Pon las cosas que se corresponden en el mismo lugar, como millas sobre horas en ambas.
7:unit-rate|A unit rate is an amount per one, even with fractions or decimals.~Una tasa unitaria es una cantidad por uno, incluso con fracciones o decimales.|Decide which quantity is per one, then divide by it.~Decide qué cantidad va por uno y divide entre ella.
7:percent-change|A percent change is a part of the original amount, added or taken away.~Un cambio porcentual es una parte de la cantidad original, que se suma o se resta.|The change is not the final amount. Add or subtract it from the original.~El cambio no es la cantidad final. Súmalo o réstalo a la cantidad original.
7:equations|Undo the operations in reverse order. Keep both sides balanced.~Deshaz las operaciones en orden inverso. Mantén los dos lados en equilibrio.|Do each opposite operation to both sides.~Haz cada operación opuesta en los dos lados.
7:inequalities|A solution is a number that makes the inequality true.~Una solución es un número que hace verdadera la desigualdad.|The open side of the symbol faces the bigger number.~El lado abierto del símbolo mira hacia el número mayor.
7:circle-area|Area is π times radius times radius. The radius goes from the center to the edge.~El área es π por radio por radio. El radio va del centro al borde.|Square only the radius, not π times the radius.~Eleva al cuadrado solo el radio, no π por el radio.
7:probability|Probability is the ways you want out of all possible ways.~La probabilidad son los casos que quieres entre todos los casos posibles.|The bottom counts all outcomes, and all must be equally likely.~El de abajo cuenta todos los resultados, y todos deben ser igual de probables.
7:scale-drawing|A scale compares a length on the drawing to the real length.~Una escala compara una longitud del dibujo con la longitud real.|Keep drawing lengths and real lengths in separate columns.~Mantén las longitudes del dibujo y las reales en columnas separadas.
8:exponents|An exponent tells how many times to multiply the base by itself.~Un exponente dice cuántas veces se multiplica la base por sí misma.|3⁴ means 3 × 3 × 3 × 3, not 3 × 4.~3⁴ significa 3 × 3 × 3 × 3, no 3 × 4.
8:powers-ten|Each power of ten shifts the digits that many places.~Cada potencia de diez desplaza los dígitos esa cantidad de lugares.|A negative exponent makes a small number, not a negative one.~Un exponente negativo da un número pequeño, no un número negativo.
8:square-roots|A square root undoes squaring. The square root of 49 is 7.~Una raíz cuadrada deshace el cuadrado. La raíz cuadrada de 49 es 7.|The square root symbol never gives a negative answer.~El símbolo de raíz cuadrada nunca da una respuesta negativa.
8:linear-equations|Do the same step to both sides until the variable is alone.~Haz el mismo paso en los dos lados hasta dejar sola la variable.|Keep both sides balanced after every step.~Mantén los dos lados en equilibrio después de cada paso.
8:slope|Slope is the change up or down divided by the change left or right.~La pendiente es el cambio hacia arriba o abajo dividido entre el cambio hacia la derecha o izquierda.|Subtract the y values and the x values in the same order.~Resta los valores de y y los de x en el mismo orden.
8:functions|A function gives exactly one output for each input you put in.~Una función da exactamente una salida por cada entrada que pones.|Replace x with the input everywhere x appears.~Reemplaza x por la entrada en todos los lugares donde aparece.
8:systems|A solution of a system makes both equations true at once.~La solución de un sistema hace verdaderas las dos ecuaciones a la vez.|The solution is one pair (x, y), not two separate answers.~La solución es un par (x, y), no dos respuestas separadas.
8:angle-relations|Complementary angles add to 90°. Supplementary add to 180°. Vertical angles are equal.~Los ángulos complementarios suman 90°. Los suplementarios suman 180°. Los opuestos por el vértice son iguales.|Angles next to each other are not always complementary or supplementary.~Los ángulos adyacentes no siempre son complementarios o suplementarios.
8:transformations|A reflection flips a point across a line. It stays the same distance away.~Una reflexión voltea un punto sobre una línea. Queda a la misma distancia.|This is extra practice. It is not in the Grade 8 standards.~Esta es práctica extra. No está en los estándares de octavo grado.
8:pythagorean|In a right triangle, the legs a and b follow a² + b² = c².~En un triángulo rectángulo, los catetos a y b cumplen a² + b² = c².|The hypotenuse c is across from the right angle. It is the longest side.~La hipotenusa c está frente al ángulo recto. Es el lado más largo.
8:association|Two kinds of data can go up or down together. That is an association.~Dos tipos de datos pueden subir o bajar juntos. Eso es una asociación.|A pattern does not prove that one thing caused the other.~Un patrón no prueba que una cosa causó la otra.
`;

const pair = (text) => {
  const [en, es] = text.split("~");
  return { en: en.trim(), es: es.trim() };
};

export const KID_LEARN = Object.fromEntries(
  ROWS.trim()
    .split("\n")
    .map((row) => {
      const [id, idea, watch] = row.split("|");
      return [id, { idea: pair(idea), watch: pair(watch) }];
    }),
);

// A row keyed "grade:id" belongs to that grade only (ids repeat across grades). A bare id is a Kindergarten to Grade 3 skill.
export const kidLearnFor = (skill, grade) => KID_LEARN[`${grade}:${skill.id}`] || (grade <= 3 ? KID_LEARN[skill.id] : null) || null;

// Replace a skill's idea and watch-out lines with the plain-word ones.
export function applyKidLearn(skill, grade) {
  const kid = kidLearnFor(skill, grade);
  if (kid) skill.learn = { ...skill.learn, rule: kid.idea.en, watch: kid.watch.en };
}

// English to Español for every replaced line.
export const ES_KID = Object.fromEntries(
  Object.values(KID_LEARN).flatMap((row) => [
    [row.idea.en, row.idea.es],
    [row.watch.en, row.watch.es],
  ]),
);
