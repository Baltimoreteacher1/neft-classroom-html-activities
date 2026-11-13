// Spanish companions for the five current Representation Bridge models.
// Mathematical values come from the same integer/exact-fraction inputs as the English view.
import { fdec, fdiv, fmul, frac, fstr, fsub } from './bridge-math.mjs';

const row = (label, ...cells) => ({ label, cells });
const sup = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵' };
const times = (b, e) => Array(e).fill(b).join(' × ');
const minus = (n) => String(n).replace('-', '−');

export const BRIDGE_STATIC_ES = Object.freeze({
  title: 'Cómo se conectan las partes', lede: 'Todo lo que sigue usa los mismos números del modelo.',
  table: 'Tabla', equation: 'Ecuación', words: 'En palabras', check: 'Comprobación',
  test: 'Pon a prueba una idea', region: 'Tabla de valores equivalentes',
  predict: 'Primero predice.', yourPrediction: 'Tu predicción', yes: 'Sí', no: 'No',
  same: 'La relación se mantuvo igual', changed: 'La relación cambió',
  predicted: 'Predijiste', right: 'acertaste.', useful: 'esta vez no; aun así, es útil saberlo.',
  show: 'Mostrarlo en el modelo', again: 'Probar otra idea',
});

export function describeBridgeEs(bridge, values) {
  const [a, b, c, d] = values;
  if (bridge.key === 'ratio:mixer') {
    const rate = frac(a, b);
    return {
      table: { head: ['Lotes', 'Jugo (tazas)', 'Agua (tazas)'], rows: [1, 2, 3, 4].map((k) => row(`×${k}`, a * k, b * k)) },
      equation: { text: `${a} : ${b} = ${a * 2} : ${b * 2} = ${a * 3} : ${b * 3}`, note: `jugo ÷ agua = ${fstr(rate)}` },
      words: `Por cada ${a} tazas de jugo, hay ${b} tazas de agua. Al preparar más lotes, se mantienen ${fstr(rate)} tazas de jugo por cada taza de agua.`,
      invariant: `Jugo ÷ agua es ${fstr(rate)} en cada fila.`,
      a11y: `${a} tazas de jugo y ${b} tazas de agua. La razón es ${a} a ${b}, o ${fstr(rate)} tazas de jugo por cada taza de agua.`,
    };
  }
  if (bridge.key === 'percent:whole') {
    const whole = frac(b * 100, a), one = frac(b, a);
    return {
      table: { head: ['Porcentaje', 'Cantidad'], rows: [row('1%', fstr(one)), row(`${a}%`, b), row('100%', fstr(whole))] },
      equation: { text: `${b} ÷ ${fdec(frac(a, 100))} = ${fstr(whole)}`, note: `${fstr(whole)} × ${a}% = ${b}` },
      words: `${b} es el ${a}% del total. Cada 1% equivale a ${fstr(one)}, así que el 100% es ${fstr(whole)}.`,
      invariant: `${fstr(whole)} × ${a}% = ${b}`,
      a11y: `${b} es el ${a} por ciento del total. El uno por ciento es ${fstr(one)}. El total es ${fstr(whole)}.`,
    };
  }
  if (bridge.key === 'power:order') {
    const value = a ** b;
    return {
      table: { head: ['Factores', 'Como multiplicación repetida', 'Valor'], rows: [1, 2, 3, 4, 5].map((k) => row(`${a}${sup[k]}`, times(a, k), a ** k)) },
      equation: { text: `${times(a, b)} = ${a}${sup[b]} = ${value}`, note: `${a}${sup[b]} no es ${a} × ${b} = ${a * b}` },
      words: `La base ${a} se usa como factor ${b} ${b === 1 ? 'vez' : 'veces'}. La potencia ${a}${sup[b]} es igual a ${value}.`,
      invariant: `${times(a, b)} = ${value}${c ? `; después suma ${c}: ${value + c}` : ''}`,
      a11y: `${a} elevado a ${b} significa usar ${a} como factor ${b} veces: ${times(a, b)} es igual a ${value}.`,
    };
  }
  if (bridge.key === 'balance:add') {
    const x = b - a;
    return {
      table: { head: ['Paso', 'Lado izquierdo', 'Lado derecho'], rows: [row('Inicio', `x + ${a}`, b), row(`Resta ${a} a ambos lados`, 'x', minus(x)), row('Comprueba', `${minus(x)} + ${a}`, `${x + a} = ${b}`)] },
      equation: { text: `x + ${a} = ${b}  →  x = ${minus(x)}`, note: `${minus(x)} + ${a} = ${b}` },
      words: `x más ${a} es igual a ${b}. Restar ${a} a ambos lados conserva el equilibrio y deja x = ${minus(x)}.`,
      invariant: `${minus(x)} + ${a} = ${b}`,
      a11y: `La ecuación tiene x más ${a} a la izquierda y ${b} a la derecha. Restar ${a} a ambos lados da x igual a ${minus(x)}.`,
    };
  }
  if (bridge.key === 'area:triangle') {
    const whole = a * b, tri = frac(whole, 2);
    return {
      table: { head: ['Figura', 'Base', 'Altura', 'Área (unidades cuadradas)'], rows: [row('Paralelogramo', a, b, whole), row('Triángulo', a, b, fstr(tri))] },
      equation: { text: `A = ½ × ${a} × ${b} = ${fstr(tri)}`, note: `paralelogramo: ${a} × ${b} = ${whole}` },
      words: `Dos copias de este triángulo forman un paralelogramo con área ${whole}, así que un triángulo tiene ${fstr(tri)} unidades cuadradas.`,
      invariant: `2 × ${fstr(tri)} = ${whole}`,
      a11y: `Un triángulo con base ${a} y altura perpendicular ${b} tiene un área de ${fstr(tri)} unidades cuadradas, la mitad del área ${whole} del paralelogramo.`,
    };
  }
  if (bridge.key === 'ratio:compare') {
    const rate = frac(a, b);
    return {
      table: { head: ['Mezcla', 'Color (tazas)', 'Blanco (tazas)', 'Color por taza blanca'], rows: [row('Tu mezcla', a, b, fstr(rate)), row('Referencia', 3, 5, '3/5')] },
      equation: { text: `${a}:${b} = ${fstr(rate)} taza de color por taza blanca; 3:5 = 3/5`, note: `Compara ${fstr(rate)} con 3/5 usando productos cruzados exactos.` },
      words: `${a} tazas de color por ${b} tazas de blanco dan ${fstr(rate)} taza de color por taza blanca. La referencia da 3/5.`,
      invariant: `${a} × 5 ${a * 5 === b * 3 ? '=' : '≠'} ${b} × 3; productos cruzados iguales indican mezclas equivalentes.`,
      a11y: `Tu mezcla tiene ${a} tazas de color y ${b} tazas de blanco; su tasa unitaria exacta es ${fstr(rate)} taza de color por taza blanca.`,
    };
  }
  if (bridge.key === 'percent:grid') {
    const share = frac(a, 100), amount = fmul(share, frac(b));
    return {
      table: { head: ['Nombre', 'Porcentaje', 'Fracción del total', 'Cantidad'], rows: [row('Este diseño', `${a}%`, fstr(share), fstr(amount)), row('Un entero', '100%', '1', b)] },
      equation: { text: `${a}% de ${b} = ${fstr(amount)}`, note: `${fstr(amount)} ÷ ${b} = ${fstr(share)}` },
      words: `${a}% nombra ${fstr(share)} del total. Si el total es ${b}, esa parte equivale a ${fstr(amount)}.`,
      invariant: `${fstr(amount)} ÷ ${b} = ${a}/100 = ${fstr(share)}`,
      a11y: `${a} por ciento es ${fstr(share)} de un total de ${b}; la cantidad correspondiente es ${fstr(amount)}.`,
    };
  }
  if (bridge.key === 'percent:discount') {
    const discount = fmul(frac(a, 100), frac(b)), final = fsub(frac(b), discount);
    return {
      table: { head: ['Etapa', 'Precio o ahorro'], rows: [row('Precio original', b), row('Descuento', fstr(discount)), row('Precio final', fstr(final))] },
      equation: { text: `${a}% de ${b} = ${fstr(discount)}; ${b} − ${fstr(discount)} = ${fstr(final)}`, note: `${fstr(discount)} ÷ ${b} = ${a}/100` },
      words: `Un descuento del ${a}% sobre $${b} ahorra $${fstr(discount)}. El precio final es $${fstr(final)}.`,
      invariant: `${fstr(final)} + ${fstr(discount)} = ${b}; tasa del descuento = ${a}/100`,
      a11y: `Precio original ${b} dólares, descuento ${a} por ciento o ${fstr(discount)} dólares, precio final ${fstr(final)} dólares.`,
    };
  }
  if (bridge.key.startsWith('fraction:')) {
    const supply = frac(Math.round(a * 2), 2), serving = frac(b, c), count = fdiv(supply, serving);
    const nouns = { servings: ['porciones', 'porción'], ribbon: ['unidades de cinta', 'trozo'], field: ['litros', 'grupo'] }[bridge.key.slice('fraction:'.length)];
    const whole = Math.floor(count.n / count.d), remainder = fsub(supply, fmul(frac(whole), serving));
    return {
      table: { head: ['Medida', 'Cantidad exacta'], rows: [row('Cantidad', fstr(supply)), row('Una porción', fstr(serving)), row('Porciones', fstr(count)), row('Porciones completas', whole), row('Resto', fstr(remainder))] },
      equation: { text: `${fstr(supply)} ÷ ${fstr(serving)} = ${fstr(count)}`, note: `${fstr(count)} × ${fstr(serving)} = ${fstr(supply)}` },
      words: `${fstr(supply)} ${nouns[0]} divididos en ${nouns[1]} de ${fstr(serving)} dan ${fstr(count)} porciones; ${whole} son completas.`,
      invariant: `${fstr(count)} × ${fstr(serving)} = ${fstr(supply)} ${nouns[0]}`,
      a11y: `Cantidad ${fstr(supply)} ${nouns[0]}; cada porción es ${fstr(serving)}; cociente exacto ${fstr(count)} porciones.`,
    };
  }
  if (bridge.key === 'line:opposites') {
    const first = frac(Math.round(a * 2), 2), opposite = frac(-Math.round(a * 2), 2), second = frac(Math.round(b * 2), 2), holds = a + b === 0;
    return {
      table: { head: ['Ubicación', 'Valor', 'Distancia al cero'], rows: [row('Primera', fstr(first), fstr(frac(Math.abs(Math.round(a * 2)), 2))), row('Su opuesto', fstr(opposite), fstr(frac(Math.abs(Math.round(a * 2)), 2))), row('Segunda', fstr(second), fstr(frac(Math.abs(Math.round(b * 2)), 2)))] },
      equation: { text: `${fstr(first)} + (${fstr(opposite)}) = 0`, note: 'El opuesto de a es −a; |a| = |−a|.' },
      words: `El opuesto de ${fstr(first)} es ${fstr(opposite)}. El par mostrado ${holds ? 'sí es' : 'no es'} opuesto porque su suma es ${fstr(frac(Math.round((a + b) * 2), 2))}.`,
      invariant: `Los opuestos suman cero y tienen la misma distancia al cero.`,
      a11y: `El opuesto de ${fstr(first)} es ${fstr(opposite)}; ambos están a ${fstr(frac(Math.abs(Math.round(a * 2)), 2))} del cero.`,
    };
  }
  if (bridge.key === 'line:absolute') {
    const p = (x) => fstr(frac(Math.round(x * 2), 2)), distance = Math.abs(a - b), d = p(distance);
    return {
      table: { head: ['Posición', 'Valor'], rows: [row('Primera ubicación', p(a)), row('Segunda ubicación', p(b)), row('Distancia', d)] },
      equation: { text: `|${p(a)} − (${p(b)})| = ${d}`, note: `${p(Math.min(a, b))} < ${p(Math.max(a, b))}; distancia = ${d}.` },
      words: `Las ubicaciones son ${p(a)} y ${p(b)}. La distancia es ${d} unidades, sin importar cuál aparece primero.`,
      invariant: `|${p(a)} − (${p(b)})| = ${d}; invertir el orden da la misma distancia.`,
      a11y: `La distancia entre ${p(a)} y ${p(b)} en la recta numérica es ${d} unidades.`,
    };
  }
  if (bridge.key === 'coordinates:reflect') {
    const xMirror = c === a && d === -b, yMirror = d === b && c === -a;
    return {
      table: { head: ['Punto', 'Coordenada x', 'Coordenada y'], rows: [row('A', a, b), row('B', c, d), row('A reflejado sobre x', a, -b), row('A reflejado sobre y', -a, b)] },
      equation: { text: `Eje x: (${a}, ${b}) → (${a}, ${-b}); eje y: (${a}, ${b}) → (${-a}, ${b})`, note: 'Un reflejo sobre un eje cambia solo la coordenada perpendicular a ese eje.' },
      words: `Sobre x, x se mantiene en ${a} e y cambia de ${b} a ${-b}. Sobre y, y se mantiene en ${b} y x cambia de ${a} a ${-a}.`,
      invariant: `B ${xMirror ? 'es el reflejo sobre el eje x' : yMirror ? 'es el reflejo sobre el eje y' : 'no es un reflejo sobre un solo eje'} de A.`,
      a11y: `A es (${a}, ${b}); su reflejo sobre x es (${a}, ${-b}) y sobre y es (${-a}, ${b}).`,
    };
  }
  if (bridge.key.startsWith('inequality:')) {
    const entry = bridge.key === 'inequality:entry', pass = entry ? b >= a : b <= a, shown = entry ? '≥' : '≤';
    return {
      table: { head: ['Regla', 'Valor de prueba', 'Decisión'], rows: [row('Límite inclusivo', `x ${shown} ${a}`, 'el límite se incluye'), row('Prueba', b, pass ? 'cumple' : 'no cumple')] },
      equation: { text: `x ${shown} ${a}; prueba x = ${b}: ${pass ? 'cumple' : 'no cumple'}`, note: `En el límite x = ${a}, la regla incluye la igualdad.` },
      words: `${entry ? 'Al menos' : 'A lo sumo'} ${a}. El valor probado ${b} ${pass ? 'cumple' : 'no cumple'} la regla.`,
      invariant: `x ${shown} ${a} es ${pass ? 'verdadera' : 'falsa'} cuando x = ${b}.`,
      a11y: `La regla inclusiva es x ${shown} ${a}; el valor de prueba ${b} ${pass ? 'cumple' : 'no cumple'}.`,
    };
  }
  if (bridge.key === 'expression:distribute') {
    const grouped = a * (c + b), first = a * c, second = a * b;
    return {
      table: { head: ['Forma', 'Sustitución', 'Valor'], rows: [row('Agrupada', `${a}(${c} + ${b})`, grouped), row('Desarrollada', `${a}×${c} + ${a}×${b}`, first + second), row('Términos', `${first} + ${second}`, first + second)] },
      equation: { text: `${a}(${c} + ${b}) = ${a}×${c} + ${a}×${b} = ${grouped}`, note: `${grouped} = ${first} + ${second}` },
      words: `Con x = ${c}, la forma agrupada vale ${grouped}; la desarrollada es ${first} + ${second} = ${first + second}.`,
      invariant: `${a}(${c} + ${b}) = ${grouped} = ${first} + ${second}`,
      a11y: `Al sustituir x por ${c}, ${a} por (${c} más ${b}) es ${grouped}; ${a} por ${c} más ${a} por ${b} también es ${grouped}.`,
    };
  }
  if (bridge.key.startsWith('growth:')) {
    const names = { 'ratio-graph': ['Vagones', 'Pasajeros'], weather: ['Horas', 'Agua (mm)'], fees: ['Artículos', 'Costo ($)'], future: ['Caso', 'Cantidad'] }[bridge.key.slice('growth:'.length)];
    const y = (x) => a * x + b, xs = [0, 1, 2, c].filter((x, i, all) => all.indexOf(x) === i);
    const prop = bridge.key === 'growth:ratio-graph';
    return {
      table: { head: ['Entrada', names[0], names[1]], rows: xs.map((x) => row(`x = ${x}`, x, y(x))) },
      equation: { text: prop ? `y = ${a} × ${c} = ${y(c)}` : `y = ${a} × ${c} + ${b} = ${y(c)}`, note: `En entrada 0, la salida es ${b}; cada paso suma ${a}.` },
      words: `${names[1]} es ${a} por ${names[0].toLowerCase()}${b ? ` más la cantidad inicial ${b}` : ''}. Con ${names[0].toLowerCase()} ${c}, la salida es ${y(c)}.`,
      invariant: prop ? `El inicio es 0, así que y/x = ${a} para cada entrada positiva.` : `La cantidad inicial es ${b}; cada paso adicional suma ${a}.`,
      a11y: `La regla es y igual a ${a} por la entrada más ${b}; cuando la entrada es ${c}, la salida es ${y(c)}.`,
    };
  }
  throw new RangeError(`Missing Spanish Bridge description for ${bridge.key}.`);
}

export function bridgeWhyEs(bridge, values, id, param, result) {
  const [a, b, c] = values;
  if (bridge.key === 'ratio:mixer') {
    if (id === 'scale') return `Se multiplicaron ambas cantidades por ${param}, así que cada taza de jugo todavía corresponde a ${fstr(frac(b, a))} tazas de agua.`;
    if (id === 'add') return `Sumar ${param} a ambas cantidades cambió la razón de ${a}:${b} a ${result.after[0]}:${result.after[1]}. ${fstr(frac(a, b))} no es ${fstr(frac(result.after[0], result.after[1]))}. Las razones equivalentes se forman al multiplicar, no al sumar.`;
    return `Solo cambió el jugo, así que hay más jugo por cada taza de agua: ${fstr(frac(a, b))} cambió a ${fstr(frac(result.after[0], result.after[1]))}.`;
  }
  if (bridge.key === 'percent:whole') {
    const pct = a, part = b, tenths = Math.round(Number(param) * 10), guess = frac(tenths, 10);
    if (result.preserved) return `El ${pct}% de ${fdec(guess)} es ${part}, así que ${fdec(guess)} es el total.`;
    if (result.misconception === 'percent-of-part') return `${fdec(guess)} es el ${pct}% de ${part}. Pero ${part} ya es el ${pct}% del total; vuelve al 100% en vez de calcular el porcentaje de ${part}.`;
    if (result.misconception === 'whole-too-small') return `${fdec(guess)} es menor que la parte, ${part}. Una parte menor que el 100% debe ser menor que el total.`;
    return `El ${pct}% de ${fdec(guess)} es ${fdec(frac(tenths * pct, 1000))}, no ${part}.`;
  }
  if (bridge.key === 'power:order') {
    if (id === 'add-factor') return result.fits ? `Un factor más de ${a} multiplica el valor por ${a}: ${a ** b} × ${a} = ${a ** (b + 1)}.` : `Esta máquina ya tiene el máximo de factores que puede guardar (5).`;
    const value = a ** b, product = a * b;
    return `${a}${sup[b]} es ${times(a, b)} = ${value}. ${a} × ${b} suma ${a} ${b} veces y da ${product}. ${value === product ? 'Solo coinciden con estos números particulares.' : 'Son dos cálculos distintos.'}`;
  }
  if (bridge.key === 'balance:add') {
    const x = b - a;
    if (id === 'both') return `Restar ${a} a ambos lados da x = ${minus(x)}. Comprueba: ${minus(x)} + ${a} = ${b}.`;
    if (id === 'add-both') return `x + ${2 * a} = ${b + a} todavía está equilibrada y x sigue siendo ${minus(x)}. Conserva el equilibrio, pero no deja x sola.`;
    return `Restar ${a} solo del lado izquierdo da x = ${b}. Pero ${b} + ${a} = ${b + a}, no ${b}. La solución cambió porque los lados no recibieron el mismo cambio.`;
  }
  if (bridge.key === 'area:triangle') {
    const tri = frac(a * b, 2);
    if (id === 'slide') return `Deslizar el punto superior ${param} unidades conserva la base ${a} y la altura ${b}, así que el área sigue siendo ${fstr(tri)}. Cambian los lados inclinados, pero no la altura.`;
    if (param < b) return `Un lado inclinado de ${param} no puede ser más corto que la altura ${b}: la perpendicular es el camino más corto del punto superior a la base.`;
    const wrong = frac(a * param, 2);
    return result.preserved ? `Si un lado inclinado mide lo mismo que la altura, el punto superior queda justo sobre la base y ambos métodos dan ${fstr(tri)}.` : `Usar ${param} como altura da ${fstr(wrong)}, pero la altura perpendicular es ${b} y da ${fstr(tri)}. La altura debe ser perpendicular a la base.`;
  }
  if (bridge.key === 'ratio:compare') {
    if (id === 'scale') return `Multiplicar ambas cantidades por ${param} conserva la razón ${fstr(frac(a, b))}; comparar las mismas tazas blancas sigue siendo justo.`;
    if (id === 'add-both') return `Sumar ${param} da ${result.after[0]}:${result.after[1]}; los productos cruzados ${result.after[0] * b} y ${result.after[1] * a} ${result.preserved ? 'son iguales' : 'no son iguales'}.`;
    return `Cambiar solo el color da ${result.after[0]}:${result.after[1]}; la tasa unitaria pasa de ${fstr(frac(a, b))} a ${fstr(frac(result.after[0], result.after[1]))}.`;
  }
  if (bridge.key === 'percent:grid') {
    const [pct, whole] = values;
    if (id === 'scale-whole') return `El total cambia de ${whole} a ${result.after[1]}, pero la parte sigue siendo ${pct}/100.`;
    if (id === 'change-whole') return `El total cambia de ${whole} a ${result.after[1]}; el porcentaje sigue en ${pct}%, mientras la cantidad cambia de ${fstr(fmul(frac(pct, 100), frac(whole)))} a ${fstr(fmul(frac(pct, 100), frac(result.after[1])))}.`;
    return `La parte cambia de ${pct}/100 a ${result.after[0]}/100; con total ${whole}, las cantidades son ${fstr(fmul(frac(pct, 100), frac(whole)))} y ${fstr(fmul(frac(result.after[0], 100), frac(whole)))}.`;
  }
  if (bridge.key === 'percent:discount') {
    const [pct, price] = values;
    if (id === 'scale-price') return `El precio aumenta a $${result.after[1]} y el ahorro a $${fstr(fmul(frac(pct, 100), frac(result.after[1])))}; la tasa sigue en ${pct}%.`;
    if (id === 'change-price') return `El precio cambia de $${price} a $${result.after[1]}, pero la tasa sigue en ${pct}%.`;
    return `La tasa cambia de ${pct}% a ${result.after[0]}%; el ahorro cambia de $${fstr(fmul(frac(pct, 100), frac(price)))} a $${fstr(fmul(frac(result.after[0], 100), frac(price)))}.`;
  }
  if (bridge.key.startsWith('fraction:')) {
    const supply = frac(Math.round(a * 2), 2), serving = frac(b, c), before = fdiv(supply, serving);
    const nextSupply = frac(Math.round(result.after[0] * 2), 2), nextServing = frac(result.after[1], result.after[2]), next = fdiv(nextSupply, nextServing);
    if (id === 'scale-both') return `La cantidad y la porción se multiplican por ${param}; el cociente permanece ${fstr(next)}.`;
    if (id === 'equivalent-serving') return `${b}/${c} y ${result.after[1]}/${result.after[2]} son fracciones equivalentes; ${fstr(supply)} ÷ ${fstr(nextServing)} sigue siendo ${fstr(before)}.`;
    return `La porción cambia de ${fstr(serving)} a ${fstr(nextServing)}; el cociente exacto cambia de ${fstr(before)} a ${fstr(next)}.`;
  }
  if (bridge.key === 'line:opposites') {
    if (id === 'make-opposite') return `${a} + (${-a}) = 0; ambas ubicaciones están a ${Math.abs(a)} del cero.`;
    if (id === 'same-sign') return `Ambas ubicaciones son ${a}; su suma es ${2 * a}, así que ${result.preserved ? 'son' : 'no son'} opuestas.`;
    return `Al cambiar ambos signos quedan ${-a} y ${-b}; su suma es ${-a - b}.`;
  }
  if (bridge.key === 'line:absolute') {
    const p = (x) => fstr(frac(Math.round(x * 2), 2)), before = p(Math.abs(a - b)), after = p(Math.abs(result.after[0] - result.after[1]));
    if (id === 'swap') return `|${p(b)} − (${p(a)})| = ${after}; invertir los extremos conserva la distancia.`;
    if (id === 'translate') return `Ambas posiciones avanzan ${param}; |${p(result.after[0])} − (${p(result.after[1])})| = ${after}.`;
    return `Solo cambia la segunda posición: la distancia pasa de ${before} a ${after}.`;
  }
  if (bridge.key === 'coordinates:reflect') {
    if (id === 'reflect-x') return `Sobre x, x se mantiene en ${a}; y cambia de signo, de ${b} a ${-b}.`;
    if (id === 'reflect-y') return `Sobre y, y se mantiene en ${b}; x cambia de signo, de ${a} a ${-a}.`;
    return `B se convierte en (${-a}, ${-b}); cambian ambos signos. Eso es un giro de media vuelta, no generalmente un reflejo sobre un solo eje.`;
  }
  if (bridge.key.startsWith('inequality:')) {
    const entry = bridge.key === 'inequality:entry', pass = (v) => entry ? v >= a : v <= a;
    const symbol = entry ? '≥' : '≤';
    if (id === 'test-boundary') return `En el límite, ${a} ${symbol} ${a} es verdadero porque se incluye la igualdad.`;
    if (id === 'move-test') return `El valor cambia de ${b} (${pass(b) ? 'cumple' : 'no cumple'}) a ${result.after[1]} (${pass(result.after[1]) ? 'cumple' : 'no cumple'}) bajo x ${symbol} ${a}.`;
    const reverse = entry ? b <= a : b >= a;
    return `La regla correcta dice ${pass(b) ? 'cumple' : 'no cumple'}; la regla invertida dice ${reverse ? 'cumple' : 'no cumple'}.`;
  }
  if (bridge.key === 'expression:distribute') {
    const [factor, constant, x] = values;
    if (id === 'substitute') { const n = param, lhs = factor * (n + constant), rhs = factor * n + factor * constant; return `Con x = ${n}, ${factor}(${n} + ${constant}) = ${lhs} y ${factor}×${n} + ${factor}×${constant} = ${rhs}.`; }
    if (id === 'distribute') return `${factor}(${x} + ${constant}) = ${factor * (x + constant)}; ${factor}×${x} + ${factor}×${constant} = ${factor * x} + ${factor * constant} = ${factor * (x + constant)}.`;
    return `${factor}(${x} + ${constant}) = ${factor * (x + constant)}, mientras ${factor}×${x} + ${constant} = ${factor * x + constant}; el segundo término también necesita el factor ${factor}.`;
  }
  if (bridge.key.startsWith('growth:')) {
    const [rate, start, input] = values;
    if (id === 'next-input') return `La entrada aumenta ${param}; la salida cambia de ${rate * input + start} a ${rate * result.after[2] + start}, un cambio de ${rate * param}.`;
    if (id === 'change-start') return `El inicio y la salida aumentan ${param}; la cantidad agregada por paso sigue siendo ${rate}.`;
    return `La tasa cambia de ${rate} a ${rate + param}; la entrada cambia de ${input} a ${input + param}. La pendiente es distinta.`;
  }
  throw new RangeError(`Missing Spanish Bridge explanation for ${bridge.key}:${id}.`);
}
