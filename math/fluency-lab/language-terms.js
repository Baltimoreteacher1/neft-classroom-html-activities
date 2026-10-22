// Math words for the Fluency Lab language layer: one bilingual term bank, a map from every skill to the few words
// that skill is about, and per-family "what I did" and "how I can check" phrases. Definitions describe the idea and
// contain no digits, so a word card can never echo a live problem's numbers or answer.
// Rows are pipe-delimited so each entry stays on one line:
//   TERM_ROWS   id|English|Español|English meaning|significado en español|1 if the two words look alike
//   SKILL_ROWS  skill id|family|term ids (the words that skill is about)
//   MOVE_ROWS   family|did or check|English phrase|frase en español
// "did" phrases finish "I ..." in English and stand as a first-person verb phrase in Español.

const TERM_ROWS = [
  "number|number|número|A word or symbol that tells how many or how much.|Una palabra o símbolo que dice cuántos o cuánto hay.|1",
  "count|count|contar|Say numbers in order to find how many.|Decir los números en orden para saber cuántos hay.|0",
  "pattern|pattern|patrón|Something that repeats or changes in a way you can predict.|Algo que se repite o cambia de una manera que se puede predecir.|1",
  "skip-count|skip count|conteo salteado|Count by the same amount each time, like by twos or fives.|Contar sumando la misma cantidad cada vez, como de dos en dos o de cinco en cinco.|0",
  "digit|digit|dígito|One of the ten symbols used to write numbers: zero through nine.|Uno de los diez símbolos que se usan para escribir números: del cero al nueve.|1",
  "place-value|place value|valor posicional|The value a digit has because of where it sits in a number.|El valor que tiene un dígito según el lugar donde está en el número.|0",
  "tens|tens and ones|decenas y unidades|Groups of ten and the single ones left over.|Grupos de diez y las unidades sueltas que sobran.|0",
  "compare|compare|comparar|Look at two numbers or amounts to see how they are alike or different.|Mirar dos números o cantidades para ver en qué se parecen o se diferencian.|1",
  "greater-than|greater than|mayor que|More than. The symbol > points its small end at the smaller number.|Más que. La punta del símbolo > señala al número menor.|0",
  "less-than|less than|menor que|Fewer than. The symbol < points its small end at the smaller number.|Menor que. La punta del símbolo < señala al número menor.|0",
  "equal|equal|igual|Having the same value. The symbol = means equal.|Que tiene el mismo valor. El símbolo = significa igual.|0",
  "round|round|redondear|Change a number to a nearby number that is easier to use.|Cambiar un número por otro cercano que sea más fácil de usar.|0",
  "estimate|estimate|estimar|Find an answer that is close, without finding the exact amount.|Hallar una respuesta cercana sin calcular la cantidad exacta.|1",
  "even-odd|even and odd|par e impar|Even numbers split into two equal groups. Odd numbers have one left over.|Los números pares se dividen en dos grupos iguales. Los impares dejan uno de sobra.|0",
  "add|add|sumar|Put amounts together to find the total.|Juntar cantidades para hallar el total.|0",
  "sum|sum|suma|The total you get when you add.|El total que se obtiene al sumar.|1",
  "addend|addend|sumando|A number that is added to another number.|Un número que se suma a otro número.|0",
  "subtract|subtract|restar|Take an amount away to find what is left or how far apart numbers are.|Quitar una cantidad para hallar lo que queda o la distancia entre dos números.|0",
  "difference|difference|diferencia|What is left after you subtract, or how far apart two numbers are.|Lo que queda al restar, o qué tan separados están dos números.|1",
  "regroup|regroup|reagrupar|Trade one group for ten smaller ones, or ten for one bigger one.|Cambiar un grupo por diez más pequeños, o diez por uno más grande.|0",
  "make-ten|make a ten|formar una decena|Break a number to fill up a group of ten first, then add what is left.|Separar un número para completar una decena y luego sumar lo que queda.|0",
  "missing-number|missing number|número que falta|The unknown number in an equation that you need to find.|El número desconocido de una ecuación que hay que hallar.|0",
  "total|total|total|The amount you have when everything is put together.|La cantidad que hay cuando todo se junta.|1",
  "multiply|multiply|multiplicar|Find the total of equal groups by combining the groups.|Hallar el total de grupos iguales al combinarlos.|1",
  "product|product|producto|The answer when you multiply.|El resultado de multiplicar.|1",
  "factor|factor|factor|A number that you multiply, or a number that divides another number evenly.|Un número que se multiplica, o que divide a otro número exactamente.|1",
  "multiple|multiple|múltiplo|What you get when you multiply a number by one, two, three, and so on.|Lo que resulta al multiplicar un número por uno, dos, tres y así sucesivamente.|1",
  "equal-groups|equal groups|grupos iguales|Groups that all have the same number of items.|Grupos que tienen todos la misma cantidad de objetos.|0",
  "array|array|matriz|Objects arranged in equal rows and columns.|Objetos acomodados en filas y columnas iguales.|0",
  "divide|divide|dividir|Share a total into equal groups, or find how many groups fit.|Repartir un total en grupos iguales, o hallar cuántos grupos caben.|1",
  "quotient|quotient|cociente|The answer when you divide.|El resultado de dividir.|1",
  "remainder|remainder|residuo|What is left over when a number does not divide evenly.|Lo que sobra cuando un número no se divide exactamente.|0",
  "prime|prime number|número primo|A number with exactly two factors: one and itself.|Un número con exactamente dos factores: el uno y el mismo número.|1",
  "composite|composite number|número compuesto|A number with more than two factors.|Un número con más de dos factores.|1",
  "gcf|greatest common factor|máximo común divisor|The biggest number that divides two numbers evenly.|El número más grande que divide exactamente a dos números.|0",
  "lcm|least common multiple|mínimo común múltiplo|The smallest number that is a multiple of two numbers.|El número más pequeño que es múltiplo de dos números.|0",
  "fraction|fraction|fracción|A number that names equal parts of a whole.|Un número que nombra partes iguales de un entero.|1",
  "numerator|numerator|numerador|The top number. It tells how many parts you have.|El número de arriba. Dice cuántas partes tienes.|1",
  "denominator|denominator|denominador|The bottom number. It tells how many equal parts make the whole.|El número de abajo. Dice en cuántas partes iguales se divide el entero.|1",
  "equivalent|equivalent|equivalente|Different names for the same amount.|Distintos nombres para la misma cantidad.|1",
  "common-denominator|common denominator|denominador común|The same bottom number for two fractions so they can be compared or added.|El mismo denominador en dos fracciones para poder compararlas o sumarlas.|0",
  "simplify|simplify|simplificar|Rewrite in an easier form without changing the value.|Escribir de una forma más sencilla sin cambiar el valor.|1",
  "reciprocal|reciprocal|recíproco|A fraction flipped upside down. A number times its reciprocal is one.|Una fracción puesta al revés. Un número multiplicado por su recíproco da uno.|1",
  "decimal|decimal|decimal|A number written with a point to show parts smaller than one.|Un número escrito con un punto para mostrar partes menores que uno.|1",
  "decimal-point|decimal point|punto decimal|The dot that separates the whole part from the parts of one.|El punto que separa la parte entera de las partes de la unidad.|1",
  "tenths|tenths and hundredths|décimas y centésimas|Places to the right of the decimal point: one part of ten, one part of a hundred.|Lugares a la derecha del punto decimal: una parte de diez, una parte de cien.|0",
  "percent|percent|por ciento|A number out of one hundred. Percent means per hundred.|Una parte de cada cien. Por ciento significa «por cada cien».|1",
  "ratio|ratio|razón|A comparison of two amounts by division or by saying how many of each.|Una comparación de dos cantidades, por división o diciendo cuántas hay de cada una.|0",
  "rate|rate|tasa|A ratio that compares two different kinds of units, like miles per hour.|Una razón que compara dos tipos de unidades distintas, como millas por hora.|0",
  "unit-rate|unit rate|tasa unitaria|A rate for exactly one unit, like the cost of one item.|Una tasa para exactamente una unidad, como el costo de un artículo.|0",
  "proportion|proportion|proporción|A statement that two ratios are equal.|Una afirmación de que dos razones son iguales.|1",
  "per|per|por cada|For each one. Miles per hour means miles for each hour.|Por cada uno. Millas por hora significa millas en cada hora.|0",
  "convert|convert|convertir|Change an amount to a different unit with the same size.|Cambiar una cantidad a otra unidad sin cambiar su tamaño.|1",
  "increase|increase and decrease|aumento y disminución|Increase makes an amount bigger. Decrease makes it smaller.|Un aumento hace una cantidad más grande. Una disminución la hace más pequeña.|0",
  "expression|expression|expresión|Numbers, letters, and operations written together, with no equal sign.|Números, letras y operaciones escritos juntos, sin signo de igual.|1",
  "variable|variable|variable|A letter that stands for a number that can change or is not known yet.|Una letra que representa un número que puede cambiar o que aún no se conoce.|1",
  "equation|equation|ecuación|A math sentence that says two amounts are equal.|Un enunciado matemático que dice que dos cantidades son iguales.|1",
  "solve|solve|resolver|Find the value that makes a math sentence true.|Hallar el valor que hace verdadero un enunciado matemático.|1",
  "inverse-operation|inverse operation|operación inversa|An operation that undoes another, like subtraction undoes addition.|Una operación que deshace a otra, como la resta deshace la suma.|1",
  "coefficient|coefficient|coeficiente|The number multiplied by a variable.|El número que multiplica a una variable.|1",
  "evaluate|evaluate|evaluar|Replace each variable with a number, then find the value.|Reemplazar cada variable por un número y hallar el valor.|1",
  "order-of-operations|order of operations|orden de las operaciones|The rules for which operation to do first.|Las reglas para saber qué operación se hace primero.|1",
  "inequality|inequality|desigualdad|A math sentence that compares amounts that are not equal, using <, >, ≤, or ≥.|Un enunciado matemático que compara cantidades que no son iguales, con <, >, ≤ o ≥.|1",
  "solution|solution|solución|A value that makes an equation or inequality true.|Un valor que hace verdadera una ecuación o desigualdad.|1",
  "function|function|función|A rule that gives exactly one output for each input.|Una regla que da exactamente una salida por cada entrada.|1",
  "input-output|input and output|entrada y salida|The number you put in a rule and the number the rule gives back.|El número que se pone en una regla y el número que la regla devuelve.|0",
  "slope|slope|pendiente|How steep a line is: the change up or down for each step across.|Qué tan inclinada es una recta: cuánto sube o baja por cada paso hacia la derecha.|0",
  "system|system of equations|sistema de ecuaciones|Two or more equations that use the same variables.|Dos o más ecuaciones que usan las mismas variables.|1",
  "integer|integer|entero|A whole number, its opposite, or zero.|Un número natural (como uno, dos o tres), su opuesto o el cero.|0",
  "positive|positive|positivo|A number greater than zero.|Un número mayor que cero.|1",
  "negative|negative|negativo|A number less than zero.|Un número menor que cero.|1",
  "absolute-value|absolute value|valor absoluto|The distance from zero on a number line.|La distancia al cero en una recta numérica.|1",
  "zero-pair|zero pair|par cero|One positive and one negative of the same size. Together they make zero.|Un positivo y un negativo del mismo tamaño. Juntos forman cero.|0",
  "coordinate-plane|coordinate plane|plano de coordenadas|A flat grid made by a horizontal and a vertical number line.|Una cuadrícula plana formada por una recta numérica horizontal y una vertical.|1",
  "quadrant|quadrant|cuadrante|One of the four sections of the coordinate plane.|Una de las cuatro secciones del plano de coordenadas.|1",
  "origin|origin|origen|The point where the two axes meet.|El punto donde se cruzan los dos ejes.|1",
  "area|area|área|The amount of flat space inside a shape, in square units.|La cantidad de espacio plano dentro de una figura, en unidades cuadradas.|1",
  "perimeter|perimeter|perímetro|The distance around the outside of a shape.|La distancia alrededor del borde de una figura.|1",
  "volume|volume|volumen|The amount of space inside a solid, in cubic units.|La cantidad de espacio dentro de una figura sólida, en unidades cúbicas.|1",
  "length|length and width|largo y ancho|The sides of a rectangle: how long it is and how wide it is.|Los lados de un rectángulo: qué tan largo y qué tan ancho es.|0",
  "unit|unit|unidad|A fixed amount used to measure, like an inch, a meter, or a gram.|Una cantidad fija que se usa para medir, como una pulgada, un metro o un gramo.|1",
  "radius|radius|radio|The distance from the center of a circle to its edge.|La distancia del centro de un círculo a su borde.|1",
  "circle|circle|círculo|A round shape where every point is the same distance from the center.|Una figura redonda donde todos los puntos están a la misma distancia del centro.|1",
  "hypotenuse|hypotenuse|hipotenusa|The longest side of a right triangle, across from the right angle.|El lado más largo de un triángulo rectángulo, frente al ángulo recto.|1",
  "leg|leg|cateto|One of the two shorter sides of a right triangle.|Uno de los dos lados más cortos de un triángulo rectángulo.|0",
  "reflection|reflection|reflexión|A flip of a figure across a line, like a mirror image.|Voltear una figura sobre una recta, como la imagen en un espejo.|1",
  "transformation|transformation|transformación|A move of a figure: slide, flip, turn, or resize.|Un movimiento de una figura: deslizar, voltear, girar o cambiar de tamaño.|1",
  "exponent|exponent|exponente|A small raised number that tells how many times to multiply the base.|Un número pequeño elevado que dice cuántas veces se multiplica la base.|1",
  "base|base|base|The number that is multiplied by itself in a power.|El número que se multiplica por sí mismo en una potencia.|1",
  "power|power|potencia|A number written with a base and an exponent.|Un número escrito con una base y un exponente.|0",
  "square-root|square root|raíz cuadrada|A number that, multiplied by itself, makes the given number.|Un número que, multiplicado por sí mismo, da el número dado.|0",
  "perfect-square|perfect square|cuadrado perfecto|A number you get by multiplying a whole number by itself.|Un número que resulta de multiplicar un número entero por sí mismo.|1",
  "scientific-notation|scientific notation|notación científica|A short way to write very big or very small numbers using powers of ten.|Una forma corta de escribir números muy grandes o muy pequeños con potencias de diez.|1",
  "hour|hour and minute|hora y minuto|Units of time that measure how long something takes.|Unidades de tiempo que miden cuánto dura algo.|0",
  "elapsed-time|elapsed time|tiempo transcurrido|How much time passes between a start and an end.|Cuánto tiempo pasa entre un comienzo y un final.|0",
  "coin|coin|moneda|Money made of metal: penny, nickel, dime, or quarter.|Dinero de metal: un centavo, cinco centavos, diez centavos o veinticinco centavos.|0",
  "value|value|valor|How much a number or a coin is worth.|Cuánto vale un número o una moneda.|1",
  "cents|cents|centavos|Small units of money. One hundred cents make one dollar.|Unidades pequeñas de dinero. Cien centavos equivalen a un dólar.|1",
  "probability|probability|probabilidad|A number from zero to one that tells how likely an event is.|Un número de cero a uno que dice qué tan probable es un evento.|1",
  "outcome|outcome|resultado|One thing that can happen in an experiment.|Una cosa que puede ocurrir en un experimento.|0",
  "mean|mean|media|The average: add all the values, then divide by how many there are.|El promedio: se suman todos los valores y se divide entre la cantidad de valores.|0",
  "median|median|mediana|The middle value when the data are in order.|El valor del medio cuando los datos están en orden.|1",
  "range|range|rango|The distance from the smallest value to the largest.|La distancia del valor más pequeño al más grande.|1",
  "association|association|asociación|A relationship between two sets of data, like both going up together.|Una relación entre dos conjuntos de datos, como que ambos suban a la vez.|1",
  "scatter-plot|scatter plot|diagrama de dispersión|A graph of dots that shows how two kinds of data are related.|Una gráfica de puntos que muestra cómo se relacionan dos tipos de datos.|0",
  "trend|trend|tendencia|The general direction that the data seem to follow.|La dirección general que parecen seguir los datos.|1",
];

const SKILL_ROWS = [
  "count-patterns|number|count,pattern,number",
  "compare-100|number|compare,greater-than,less-than,equal",
  "tens-ones|number|tens,digit,place-value",
  "add-10|addsub|add,sum,total",
  "subtract-10|addsub|subtract,difference,total",
  "make-10|addsub|make-ten,add,sum",
  "add-20|addsub|add,sum,make-ten",
  "subtract-20|addsub|subtract,difference,make-ten",
  "missing-addend|addsub|missing-number,addend,equal",
  "time|timemoney|hour,elapsed-time,unit",
  "facts-20|addsub|add,sum,addend",
  "sub-facts-20|addsub|subtract,difference,missing-number",
  "place-1000|number|place-value,digit,tens",
  "compare-1000|number|compare,greater-than,less-than,place-value",
  "skip-count|number|skip-count,pattern,count",
  "add-100|addsub|add,regroup,sum,tens",
  "subtract-100|addsub|subtract,regroup,difference,tens",
  "add-1000|addsub|add,regroup,sum,place-value",
  "even-odd|number|even-odd,equal-groups,number",
  "coins|timemoney|coin,value,cents,total",
  "mul-0-5|muldiv|multiply,product,equal-groups,factor",
  "mul-6-9|muldiv|multiply,product,factor,array",
  "mul-10-12|muldiv|multiply,product,factor,array",
  "division-facts|muldiv|divide,quotient,equal-groups,factor",
  "add-sub-1000|addsub|add,subtract,regroup,place-value",
  "round|number|round,estimate,place-value",
  "fraction-equivalence|fraction|equivalent,numerator,denominator,fraction",
  "fraction-compare|fraction|compare,numerator,denominator,common-denominator",
  "area|measure|area,length,unit",
  "perimeter|measure|perimeter,length,unit",
  "place-million|number|place-value,digit,compare",
  "round-large|number|round,estimate,place-value",
  "add-large|addsub|add,regroup,sum,place-value",
  "subtract-large|addsub|subtract,regroup,difference,place-value",
  "multiply-1digit|muldiv|multiply,product,factor,place-value",
  "multiply-2digit|muldiv|multiply,product,factor,place-value",
  "division|muldiv|divide,quotient,remainder,factor",
  "factors|muldiv|factor,multiple,prime,composite",
  "fraction-equiv|fraction|equivalent,numerator,denominator,simplify",
  "multiply-whole|muldiv|multiply,product,factor,estimate",
  "divide-whole|muldiv|divide,quotient,remainder,estimate",
  "decimal-place|decimal|decimal,decimal-point,tenths,place-value",
  "decimal-add|decimal|decimal,decimal-point,add,sum",
  "decimal-sub|decimal|decimal,decimal-point,subtract,difference",
  "decimal-mul|decimal|decimal,decimal-point,multiply,product",
  "fraction-add|fraction|common-denominator,numerator,denominator,sum",
  "fraction-mul|fraction|fraction,numerator,denominator,product",
  "fraction-of|fraction|fraction,numerator,denominator,equal-groups",
  "volume|measure|volume,length,unit",
  "gcf|muldiv|gcf,factor,multiple",
  "lcm|muldiv|lcm,multiple,factor",
  "divide-fractions|fraction|reciprocal,numerator,denominator,quotient",
  "decimal-ops|decimal|decimal,decimal-point,product,quotient",
  "ratios|ratio|ratio,equivalent,per",
  "unit-rates|ratio|unit-rate,rate,per,convert",
  "percent|ratio|percent,per,value",
  "evaluate|algebra|expression,variable,evaluate,order-of-operations",
  "one-step|algebra|equation,variable,solve,inverse-operation",
  "integers|integer|absolute-value,coordinate-plane,quadrant,origin",
  "integer-add|integer|integer,positive,negative,zero-pair",
  "integer-mul|integer|integer,positive,negative,product",
  "fraction-ops|fraction|fraction,common-denominator,reciprocal,simplify",
  "proportions|ratio|proportion,ratio,equivalent",
  "unit-rate|ratio|unit-rate,rate,per",
  "percent-change|ratio|percent,increase,value",
  "equations|algebra|equation,variable,coefficient,inverse-operation",
  "inequalities|algebra|inequality,solution,variable",
  "circle-area|measure|circle,radius,area",
  "probability|data|probability,outcome,mean,median,range",
  "exponents|power|exponent,base,power",
  "powers-ten|power|scientific-notation,exponent,power",
  "square-roots|power|square-root,perfect-square,estimate",
  "linear-equations|algebra|equation,variable,coefficient,solve",
  "slope|algebra|slope,coordinate-plane,rate",
  "functions|algebra|function,input-output,variable",
  "systems|algebra|system,equation,solution,variable",
  "transformations|measure|transformation,reflection,coordinate-plane,origin",
  "pythagorean|measure|hypotenuse,leg,square-root",
  "association|data|association,scatter-plot,trend",
];

const MOVE_ROWS = [
  "number|did|looked at the digits and their places|miré los dígitos y sus lugares",
  "number|did|counted on a number line|conté en una recta numérica",
  "number|did|compared the numbers place by place|comparé los números lugar por lugar",
  "number|did|used a pattern I noticed|usé un patrón que noté",
  "number|did|rounded to a friendly number|redondeé a un número fácil de usar",
  "number|check|I can check with a number line.|Puedo comprobarlo con una recta numérica.",
  "number|check|I can estimate to see if it makes sense.|Puedo estimar para ver si tiene sentido.",
  "number|check|I can say the number a different way.|Puedo decir el número de otra manera.",
  "addsub|did|added the tens and then the ones|sumé las decenas y luego las unidades",
  "addsub|did|made a ten first|formé una decena primero",
  "addsub|did|counted on from the bigger number|seguí contando desde el número mayor",
  "addsub|did|regrouped when I needed to|reagrupé cuando lo necesité",
  "addsub|did|used a fact I already know|usé una operación básica que ya sé",
  "addsub|check|I can check with the opposite operation.|Puedo comprobarlo con la operación inversa.",
  "addsub|check|I can estimate first.|Puedo estimar primero.",
  "addsub|check|I can draw a model to check.|Puedo hacer un dibujo para comprobarlo.",
  "muldiv|did|broke the numbers into easier parts|separé los números en partes más fáciles",
  "muldiv|did|made equal groups|formé grupos iguales",
  "muldiv|did|used a multiplication fact I know|usé una multiplicación básica que ya sé",
  "muldiv|did|drew an array|dibujé una matriz",
  "muldiv|did|listed factors or multiples|hice una lista de factores o múltiplos",
  "muldiv|check|I can check with the opposite operation.|Puedo comprobarlo con la operación inversa.",
  "muldiv|check|I can estimate with friendly numbers.|Puedo estimar con números compatibles.",
  "muldiv|check|I can check with an array or groups.|Puedo comprobarlo con una matriz o con grupos.",
  "fraction|did|found a common denominator|hallé un denominador común",
  "fraction|did|multiplied the top and bottom by the same number|multipliqué el numerador y el denominador por el mismo número",
  "fraction|did|drew a fraction model|dibujé un modelo de fracciones",
  "fraction|did|compared the parts of the same whole|comparé las partes de un mismo entero",
  "fraction|did|simplified at the end|simplifiqué al final",
  "fraction|check|I can check with a drawing of the whole.|Puedo comprobarlo con un dibujo del entero.",
  "fraction|check|I can check if the answer is more or less than one half.|Puedo ver si la respuesta es mayor o menor que un medio.",
  "fraction|check|I can check by simplifying both fractions.|Puedo comprobarlo simplificando las dos fracciones.",
  "decimal|did|lined up the decimal points|alineé los puntos decimales",
  "decimal|did|ignored the point and then placed it|ignoré el punto y luego lo coloqué",
  "decimal|did|thought of tenths and hundredths|pensé en décimas y centésimas",
  "decimal|did|wrote the numbers as money|escribí los números como dinero",
  "decimal|did|estimated first|estimé primero",
  "decimal|check|I can estimate with whole numbers.|Puedo estimar con números enteros.",
  "decimal|check|I can check where the decimal point belongs.|Puedo revisar dónde va el punto decimal.",
  "decimal|check|I can use a place-value chart.|Puedo usar una tabla de valor posicional.",
  "ratio|did|made a ratio table|hice una tabla de razones",
  "ratio|did|found the amount for one|hallé la cantidad por uno",
  "ratio|did|multiplied both numbers by the same amount|multipliqué los dos números por la misma cantidad",
  "ratio|did|used a double number line|usé una recta numérica doble",
  "ratio|did|wrote the percent as out of one hundred|escribí el porcentaje como una parte de cien",
  "ratio|check|I can check that both ratios simplify to the same one.|Puedo comprobar que las dos razones se simplifican a la misma razón.",
  "ratio|check|I can check that the units match.|Puedo comprobar que las unidades coinciden.",
  "ratio|check|I can estimate with a friendly percent.|Puedo estimar con un porcentaje fácil.",
  "algebra|did|used an inverse operation|usé una operación inversa",
  "algebra|did|did the same thing to both sides|hice lo mismo en los dos lados de la ecuación",
  "algebra|did|replaced the variable with a number|reemplacé la variable por un número",
  "algebra|did|followed the order of operations|seguí el orden de las operaciones",
  "algebra|did|made a table or a graph|hice una tabla o una gráfica",
  "algebra|check|I can put my answer back into the equation.|Puedo sustituir mi respuesta en la ecuación.",
  "algebra|check|I can check with a different method.|Puedo comprobarlo con otro método.",
  "algebra|check|I can check with a graph or a table.|Puedo comprobarlo con una gráfica o una tabla.",
  "integer|did|used a number line|usé una recta numérica",
  "integer|did|used zero pairs|usé pares cero",
  "integer|did|thought about the sign first|pensé primero en el signo",
  "integer|did|found the distance from zero|hallé la distancia al cero",
  "integer|did|plotted the point|ubiqué el punto",
  "integer|check|I can check on a number line.|Puedo comprobarlo en una recta numérica.",
  "integer|check|I can check if the sign makes sense.|Puedo revisar si el signo tiene sentido.",
  "integer|check|I can use opposites to check.|Puedo usar opuestos para comprobarlo.",
  "measure|did|drew and labeled the shape|dibujé y rotulé la figura",
  "measure|did|used the formula|usé la fórmula",
  "measure|did|checked the units|revisé las unidades",
  "measure|did|split the shape into parts|dividí la figura en partes",
  "measure|did|used a square or cube model|usé un modelo de cuadrados o cubos",
  "measure|check|I can check that the units make sense.|Puedo revisar que las unidades tengan sentido.",
  "measure|check|I can estimate with a simpler shape.|Puedo estimar con una figura más sencilla.",
  "measure|check|I can check with a drawing.|Puedo comprobarlo con un dibujo.",
  "timemoney|did|counted on from the start time|conté desde la hora de inicio",
  "timemoney|did|counted the coins from greatest to least|conté las monedas de mayor a menor valor",
  "timemoney|did|used a clock or a number line|usé un reloj o una recta numérica",
  "timemoney|did|skip counted|conté salteado",
  "timemoney|did|added the values|sumé los valores",
  "timemoney|check|I can check with a clock or number line.|Puedo comprobarlo con un reloj o una recta numérica.",
  "timemoney|check|I can count again a different way.|Puedo contar otra vez de otra manera.",
  "timemoney|check|I can check that the units match.|Puedo comprobar que las unidades coinciden.",
  "data|did|listed all the possible outcomes|hice una lista de todos los resultados posibles",
  "data|did|compared favorable outcomes to all outcomes|comparé los resultados favorables con todos los resultados",
  "data|did|looked at the pattern in the points|miré el patrón de los puntos",
  "data|did|put the data in order|ordené los datos",
  "data|did|drew a graph|dibujé una gráfica",
  "data|check|I can check that my probability is between zero and one.|Puedo comprobar que mi probabilidad está entre cero y uno.",
  "data|check|I can check with a table or a graph.|Puedo comprobarlo con una tabla o una gráfica.",
  "data|check|I can check that the pattern fits most points.|Puedo comprobar que el patrón sirve para la mayoría de los puntos.",
  "power|did|wrote the power as repeated multiplication|escribí la potencia como multiplicación repetida",
  "power|did|used a pattern of powers of ten|usé un patrón de potencias de diez",
  "power|did|found two perfect squares it sits between|hallé entre qué dos cuadrados perfectos está",
  "power|did|moved the decimal point|moví el punto decimal",
  "power|did|used a rule for exponents|usé una regla de exponentes",
  "power|check|I can multiply it out to check.|Puedo multiplicar para comprobarlo.",
  "power|check|I can estimate with perfect squares.|Puedo estimar con cuadrados perfectos.",
  "power|check|I can check the number of zeros or places.|Puedo revisar el número de ceros o de lugares.",
];

const FALLBACK = { family: "number", terms: ["number", "compare", "estimate"] };
const norm = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const TERMS = new Map();
for (const row of TERM_ROWS) {
  const [id, en, es, defEn, defEs, cognate] = row.split("|");
  TERMS.set(id, { id, en, es, defEn, defEs, cognate: cognate === "1" });
}
const SKILLS = new Map();
for (const row of SKILL_ROWS) {
  const [id, family, terms] = row.split("|");
  SKILLS.set(id, { family, terms: terms.split(",") });
}
const MOVES = {};
for (const row of MOVE_ROWS) {
  const [family, kind, en, es] = row.split("|");
  ((MOVES[family] ||= { did: [], check: [] })[kind] ||= []).push({ en, es });
}

export const FAMILIES = Object.keys(MOVES);
export const skillIds = () => [...SKILLS.keys()];
export const allTerms = () => [...TERMS.values()];
export const termById = (id) => TERMS.get(id) || null;
export const doneMoves = (family) => (MOVES[family] || MOVES.number).did;
export const checkMoves = (family) => (MOVES[family] || MOVES.number).check;

// A skill, or a trail/game focus such as { grade, name }, resolves to its family and focus words.
export function languageProfile(skill) {
  const known = SKILLS.get(skill?.id);
  if (known) return { family: known.family, terms: known.terms.map(termById) };
  const name = norm(`${skill?.name || ""} ${skill?.title || ""} ${skill?.strand || ""}`);
  const byName = [
    [/fraction/, "fraction"],
    [/decimal/, "decimal"],
    [/ratio|rate|percent|proportion/, "ratio"],
    [/equation|expression|function|slope|system|inequal/, "algebra"],
    [/integer|rational|absolute/, "integer"],
    [/area|perimeter|volume|geometr|measure/, "measure"],
    [/multipl|divi|factor|product/, "muldiv"],
    [/add|subtract|sum|difference|operation/, "addsub"],
    [/exponent|root|power|scientific/, "power"],
    [/probab|data|statistic|association/, "data"],
    [/time|money|coin/, "timemoney"],
  ].find(([pattern]) => pattern.test(name));
  const family = byName ? byName[1] : FALLBACK.family;
  const ids = family === "addsub" ? ["add", "subtract", "sum", "difference"] : family === "muldiv" ? ["multiply", "divide", "product", "factor"] : FALLBACK.terms;
  return { family, terms: ids.map(termById) };
}

// Words too ordinary to count as evidence of math language ("what does it mean", "the base of the cake").
const ORDINARY = new Set(["number", "count", "total", "per", "value", "equal", "add", "round", "unit", "mean", "base", "power", "range", "circle", "tens", "hour", "coin", "pattern"]);
// Spanish forms that are everyday words in another sense ("la razón" = the reason, "resultado" = result).
const ORDINARY_ES = new Set(["ratio", "outcome", "likely", "system", "function", "solution"]);

// Math words found in writing, in either language, with or without accents. A word counts when it appears whole,
// or as a plain plural. Ordinary words are skipped so everyday sentences do not read as math language.
export function termsInText(text) {
  const plain = ` ${norm(text).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ")} `;
  const hit = (form) => plain.includes(` ${form} `) || plain.includes(` ${form}s `) || plain.includes(` ${form}es `) || plain.includes(` ${form}d `) || plain.includes(` ${form}ed `);
  const found = [];
  for (const { id, en, es } of TERMS.values()) {
    if (ORDINARY.has(id)) continue;
    const english = [en, id.replaceAll("-", " ")].map(norm);
    const spanish = ORDINARY_ES.has(id) ? [] : [norm(es)];
    if ([...english, ...spanish].some(hit)) found.push(id);
  }
  return found;
}

// Every move phrase a chip can insert, in both languages, for stripping scaffold text from writing.
export const allMovePhrases = () => Object.values(MOVES).flatMap((family) => [...family.did, ...family.check]).flatMap((move) => [move.en, move.es]);
