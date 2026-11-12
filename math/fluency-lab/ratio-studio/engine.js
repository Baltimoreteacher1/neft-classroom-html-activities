// Ratio quantities are nonnegative exact rationals. A pair always has an explicit order.
const gcd = (a, b) => b === 0n ? a : gcd(b, a % b);
const boundedLabel = (value, fallback, max) => {
  const text = String(value ?? "").trim().slice(0, max);
  return text || fallback;
};
const compare = (a, b) => {
  const left = BigInt(a.n) * BigInt(b.d);
  const right = BigInt(b.n) * BigInt(a.d);
  return left < right ? -1 : left > right ? 1 : 0;
};
const DEFAULT_POINT_FACTORS = Object.freeze([1, 2, 3, 4].map((value) => rational(value)));
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
  const rawPointFactors = input.pointFactors ?? DEFAULT_POINT_FACTORS;
  if (!Array.isArray(rawPointFactors)) throw new RangeError('Paired points must be a list');
  const pointFactors = rawPointFactors.map((value) => rational(value));
  for (const pointFactor of pointFactors) {
    if (pointFactor.n === '0' || !Number.isFinite(valueOf(pointFactor)) || valueOf(pointFactor) > 1000)
      throw new RangeError('A paired-point factor must be positive and at most 1000');
  }
  const uniquePointFactors = new Map(pointFactors.map((value) => [`${value.n}/${value.d}`, value]));
  if (uniquePointFactors.size > 12) throw new RangeError('Use up to 12 paired points');
  const sortedPointFactors = [...uniquePointFactors.values()].sort(compare);
  if (!sortedPointFactors.some((value) => value.n === '1' && value.d === '1'))
    throw new RangeError('Keep the original relationship as a paired point');
  const comparison=input.comparison || 'part-to-part';
  if(!COMPARISON_TYPES.includes(comparison))throw new RangeError('Choose a supported ratio comparison');
  return {version:1, a,b, labelA:boundedLabel(input.labelA,'Red',24),labelB:boundedLabel(input.labelB,'Blue',24),unitA:boundedLabel(input.unitA,'counters',16),unitB:boundedLabel(input.unitB,'counters',16), factor, pointFactors:sortedPointFactors, comparison};
}
// Every representation is derived here from one state, so they cannot disagree. The current scale factor is
// always a row of the table, a tick pair on both number lines and a graph point, even when it was typed into the
// factor field rather than added as a saved paired point (it is then marked transient and is not saved).
export function niceStep(max) {
  const m=valueOf(max);
  if(!(m>0))return rational(1);
  const candidates=[];
  for(let k=-3;k<=7;k+=1)for(const base of ['1','2','5/2','3','5'])candidates.push(multiply(rational(base),k>=0?rational(String(10**k)):rational(`1/${10**-k}`)));
  const fits=candidates.filter(step=>m/valueOf(step)<=5+1e-9);
  // Prefer a step that lands exactly on the largest value (12 → 0, 3, 6, 9, 12), else the smallest that fits.
  return fits.find(step=>{const q=m/valueOf(step);return q>=2-1e-9&&Math.abs(q-Math.round(q))<1e-9})||fits[0]||rational(String(10**8));
}
export function derive(s) {
  const a=multiply(s.a,s.factor), b=multiply(s.b,s.factor), total=add(a,b);
  const saved=new Set(s.pointFactors.map(k=>`${k.n}/${k.d}`));
  const factors=saved.has(`${s.factor.n}/${s.factor.d}`)?s.pointFactors:[...s.pointFactors,s.factor].sort(compare);
  const rows=factors.map(k=>({factor:k,a:multiply(s.a,k),b:multiply(s.b,k),current:compare(k,s.factor)===0,transient:!saved.has(`${k.n}/${k.d}`)}));
  const last=rows.at(-1);
  // Axes share one scale with round tick steps (1, 2, 2.5, 3 or 5 times a power of ten, at most five steps),
  // so a tick never reads as an awkward fraction such as 63/4; the axis ends on the first tick at or above
  // the largest plotted value.
  const largest=compare(last.a,last.b)>=0?last.a:last.b;
  const tickStep=niceStep(largest);
  const steps=Math.max(1,Math.ceil(valueOf(largest)/valueOf(tickStep)-1e-9));
  const graphAxisMax=multiply(tickStep,rational(steps));
  const graphTicks=Array.from({length:steps+1},(_,i)=>multiply(tickStep,rational(i)));
  // A part-to-whole ratio adds the two quantities, which only makes sense when they are measured in the same unit
  // (red counters and blue counters make a total of counters; notebooks and dollars do not make a total).
  const sameUnit=s.unitA.trim().toLocaleLowerCase()===s.unitB.trim().toLocaleLowerCase();
  const comparisons=[
    {id:'part-to-part',name:'First to second',first:s.labelA,second:s.labelB,left:a,right:b,kind:'part-to-part'},
    {id:'reverse-part-to-part',name:'Reverse the order',first:s.labelB,second:s.labelA,left:b,right:a,kind:'part-to-part'},
    ...(sameUnit?[
      {id:'first-to-whole',name:'First part to total',first:s.labelA,second:'total',left:a,right:total,kind:'part-to-whole'},
      {id:'second-to-whole',name:'Second part to total',first:s.labelB,second:'total',left:b,right:total,kind:'part-to-whole'},
    ]:[]),
  ];
  const axisMaxValue=valueOf(graphAxisMax);
  const maxFactor=valueOf(last.factor);
  return {a,b,total,sameUnit,reverse:[b,a],partWhole:sameUnit?[a,total]:null,comparisons,activeComparison:comparisons.find(c=>c.id===s.comparison)||comparisons[0],rows,graph:{axisMax:graphAxisMax,ticks:graphTicks,isFunction:s.a.n!=='0'},points:rows.map(r=>({factor:r.factor,current:r.current,x:r.a,y:r.b,position:valueOf(r.factor)/maxFactor,positionX:valueOf(r.a)/axisMaxValue,positionY:valueOf(r.b)/axisMaxValue})),unitRate:a.n==='0'?null:divide(b,a),equivalent:equivalent(s.a,s.b,a,b)};
}
export function transition(s, action) {
  switch(action.type) {
    case 'set': return createState({...s,[action.field]:action.value});
    case 'scale': return createState({...s,factor:action.factor});
    case 'add-point': {
      const pointFactor = rational(action.factor);
      if (pointFactor.n === '0') throw new RangeError('A paired-point factor must be positive');
      if (s.pointFactors.some((value) => compare(value, pointFactor) === 0))
        throw new RangeError('That factor already has a paired point');
      return createState({...s,factor:pointFactor,pointFactors:[...s.pointFactors,pointFactor]});
    }
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
