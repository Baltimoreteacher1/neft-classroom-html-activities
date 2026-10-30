// The "big idea" and "watch out" lines on a Kindergarten to Grade 3 Learn page, in a young child's words.
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
