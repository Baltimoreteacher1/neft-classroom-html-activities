// Ratio quantities are nonnegative exact rationals. A pair always has an explicit order.
const gcd = (a, b) => b === 0n ? a : gcd(b, a % b);
export const COMPARISON_TYPES = Object.freeze(['part-to-part','reverse-part-to-part','first-to-whole','second-to-whole']);
export function rational(value) {
  if (typeof value === 'object' && value && 'n' in value && 'd' in value) {
    const n = BigInt(value.n), d = BigInt(value.d);
    if (d <= 0n || n < 0n) throw new RangeError('Quantity must be nonnegative');
    const g = gcd(n, d); return { n: String(n / g), d: String(d / g) };
  }
  const s = String(value).trim();
  if (!/^(?:\d+(?:\.\d+)?|\d+\/\d+)$/.test(s)) throw new RangeError('Enter a nonnegative number or fraction');
  if (s.includes('/')) { const [a,b] = s.split('/'); return rational({n:a,d:b}); }
  const [whole, decimal = ''] = s.split('.');
  return rational({ n: BigInt(whole + decimal), d: 10n ** BigInt(decimal.length) });
}
export const valueOf = q => Number(q.n) / Number(q.d);
export const format = q => q.d === '1' ? q.n : `${q.n}/${q.d}`;
export function multiply(a,b) { return rational({n: BigInt(a.n)*BigInt(b.n),d:BigInt(a.d)*BigInt(b.d)}); }
export function add(a,b) { return rational({n:BigInt(a.n)*BigInt(b.d)+BigInt(b.n)*BigInt(a.d),d:BigInt(a.d)*BigInt(b.d)}); }
export function divide(a,b) { if (b.n === '0') throw new RangeError('Cannot divide by zero'); return rational({n:BigInt(a.n)*BigInt(b.d),d:BigInt(a.d)*BigInt(b.n)}); }
export function equivalent(a,b,c,d) {
  const az=a.n==='0', bz=b.n==='0', cz=c.n==='0', dz=d.n==='0';
  if ((az&&bz)||(cz&&dz)) return az&&bz&&cz&&dz;
  if (az!==cz || bz!==dz) return false;
  return BigInt(a.n)*BigInt(d.n)*BigInt(b.d)*BigInt(c.d) === BigInt(c.n)*BigInt(b.n)*BigInt(d.d)*BigInt(a.d);
}
export function createState(input = {}) {
  const a = rational(input.a ?? 2), b = rational(input.b ?? 3);
  if (a.n === '0' && b.n === '0') throw new RangeError('At least one quantity must be positive');
  const factor = rational(input.factor ?? 1);
  if (factor.n === '0') throw new RangeError('Scale factor must be positive');
  const comparison=input.comparison || 'part-to-part';
  if(!COMPARISON_TYPES.includes(comparison))throw new RangeError('Choose a supported ratio comparison');
  return {version:1, a,b, labelA:input.labelA || 'Red',labelB:input.labelB || 'Blue',unitA:input.unitA || 'counters',unitB:input.unitB || 'counters', factor, comparison};
}
export function derive(s) {
  const a=multiply(s.a,s.factor), b=multiply(s.b,s.factor), total=add(a,b);
  const rows=[1,2,3,4].map(k=>({factor:k,a:multiply(s.a,rational(k)),b:multiply(s.b,rational(k))}));
  const comparisons=[
    {id:'part-to-part',name:'First to second',first:s.labelA,second:s.labelB,left:a,right:b,kind:'part-to-part'},
    {id:'reverse-part-to-part',name:'Reverse the order',first:s.labelB,second:s.labelA,left:b,right:a,kind:'part-to-part'},
    {id:'first-to-whole',name:'First part to total',first:s.labelA,second:'total',left:a,right:total,kind:'part-to-whole'},
    {id:'second-to-whole',name:'Second part to total',first:s.labelB,second:'total',left:b,right:total,kind:'part-to-whole'},
  ];
  return {a,b,total,reverse:[b,a],partWhole:[a,total],comparisons,activeComparison:comparisons.find(c=>c.id===s.comparison),rows,points:rows.map(r=>({x:r.a,y:r.b,position:valueOf(r.a)/Math.max(1,valueOf(rows[3].a))})),unitRate:a.n==='0'?null:divide(b,a),equivalent:equivalent(s.a,s.b,a,b)};
}
export function transition(s, action) {
  switch(action.type) {
    case 'set': return createState({...s,[action.field]:action.value});
    case 'scale': return createState({...s,factor:action.factor});
    case 'comparison': return createState({...s,comparison:action.value});
    case 'reset': return createState();
    default: throw new RangeError('Unknown action');
  }
}
export function history(initial=createState()) {
  let states=[initial], index=0;
  return {get state(){return states[index]},get canUndo(){return index>0},get canRedo(){return index<states.length-1},dispatch(action){states=states.slice(0,index+1);states.push(transition(states[index],action));index++;return states[index]},undo(){index=Math.max(0,index-1);return states[index]},redo(){index=Math.min(states.length-1,index+1);return states[index]},serialize(){return JSON.stringify({version:1,states,index})}};
}
export function restore(json) {
  const data=JSON.parse(json); if(data.version!==1 || !Array.isArray(data.states) || !data.states.length || data.states.length>200) throw new RangeError('Invalid saved studio');
  const validated=data.states.map(s=>createState(s));
  // Return a snapshot controller with exact replay of saved states.
  let index=Math.max(0,Math.min(validated.length-1,Number(data.index)||0));
  return {get state(){return validated[index]},get canUndo(){return index>0},get canRedo(){return index<validated.length-1},dispatch(action){validated.splice(index+1);validated.push(transition(validated[index],action));index++;return validated[index]},undo(){index=Math.max(0,index-1);return validated[index]},redo(){index=Math.min(validated.length-1,index+1);return validated[index]},serialize(){return JSON.stringify({version:1,states:validated,index})}};
}

export function mismatchChallenge(state) {
  const zeroA = state.a.n === '0', zeroB = state.b.n === '0';
  const candidateA = multiply(state.a, rational(zeroA ? 1 : 2));
  const candidateB = multiply(state.b, rational(zeroB ? 1 : 3));
  const safeA = zeroA ? rational(1) : candidateA;
  const safeB = zeroB ? rational(1) : candidateB;
  return { baseA: state.a, baseB: state.b, candidateA: safeA, candidateB: safeB, equivalent: equivalent(state.a, state.b, safeA, safeB), factorA: zeroA ? null : 2, factorB: zeroB ? null : 3 };
}
export function analyzeExplanation(text) {
  const normalized = String(text || '').toLocaleLowerCase();
  const terms = [
    ['ratio', /\b(ratio|raz[oó]n)\b/],
    ['quantity', /\b(quantit(y|ies)|amounts?|cantidades?)\b/],
    ['scale factor', /\b(scale factor|factor de escala)\b/],
    ['multiplication', /\b(multiply|multiplied|multiplicar|multipliqu[eé])\b/],
    ['equivalence', /\b(equivalent|equivalente|same relationship|misma relaci[oó]n)\b/],
  ].filter(([, pattern]) => pattern.test(normalized)).map(([name]) => name);
  const connector = /\b(because|so|since|porque|as[ií] que|por eso)\b/.test(normalized);
  return { terms, connector, hasText: normalized.trim().length > 0, note: 'These are visible features of this response, not a language proficiency score.' };
}
