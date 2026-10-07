const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const context=vm.createContext({window:{}});
for(const file of ['cabinet-worlds.js','cabinet-adventure.js'])vm.runInContext(fs.readFileSync('math/games/shared/'+file,'utf8'),context);
const {initial,move,ready,typeOf,validData,ids}=context.window.CabinetAdventure.rules;
const repeat=(value,n)=>Array(n).fill(value);
const plans={
 decimal:[['step:3'],['step:3','step:3','step:1'],['step:3','step:3','step:3','step:1']],
 factor:[['prime:2','prime:3','prime:5'],['prime:2','prime:2','prime:3','prime:7'],['prime:2','prime:3','prime:3','prime:5']],
 fraction:[['fill:4','fill:4','fill:1'],['fill:4','fill:4'],['fill:3','fill:3','fill:4']],
 ratio:[['pour:0:2','pour:0:2',...repeat('pour:1:2',3)],[...repeat('pour:0:2',3),...repeat('pour:1:2',2)],['pour:0:1','pour:0:2',...repeat('pour:1:2',6)]],
 percent:[[...repeat('charge:0',4),...repeat('charge:1',3),...repeat('charge:2',3)],[...repeat('charge:0',5),...repeat('charge:1',2),...repeat('charge:2',3)],[...repeat('charge:0',2),...repeat('charge:1',4),...repeat('charge:2',4)]],
 area:[['cell:0','cell:2','cell:4','cell:6','cell:8','cell:10'],['cell:0','cell:4','cell:8','cell:12'],['cell:0','cell:2','cell:12','cell:14','turn','cell:4','cell:7']],
 expression:[['switch:1'],['switch:0'],['switch:0','switch:1','switch:1']],
 equation:[['subtract','divide'],['subtract','divide'],['subtract','divide']],
 data:[repeat('bird:2',5),repeat('bird:3',5),repeat('bird:1',5)],
 coordinate:[['east','north','north','east','east','north'],['north','north','north',...repeat('east',5),'north'],[...repeat('east',6),'north']],
 volume:[['dimension:0','dimension:0','dimension:1','dimension:2'],['dimension:0','dimension:0','dimension:1',...repeat('dimension:2',3)],['dimension:0','dimension:0','dimension:1','dimension:1',...repeat('dimension:2',3)]]
};
for(const id of ids){const type=typeOf(id);for(let chapter=0;chapter<3;chapter++){
 let data=initial(type,chapter),cost=0;assert.equal(ready(type,data,chapter),false,`${id} chapter ${chapter}: starts unsolved`);
 for(const action of plans[type][chapter]){const before=Array.from(data);const result=move(type,data,chapter,action);assert.ok(result.data,`${id} ${action}: ${result.message}`);assert.deepEqual(Array.from(data),before,'moves never mutate the current state');data=result.data;cost+=result.cost;assert.ok(validData(type,data,chapter),`${id}: saved intermediate data valid`);}
 assert.ok(ready(type,data,chapter),`${id} chapter ${chapter}: solvable`);assert.ok(cost>0,'no free completion');
 assert.equal(validData(type,[NaN],chapter),false);assert.equal(validData(type,Array(data.length).fill(100000),chapter),false);
}}
assert.ok(!move('coordinate',[-2,-2],0,'east').data,'crater blocks movement');
assert.ok(!move('factor',[2],0,'prime:7').data,'nonfactor rejected');
assert.ok(!move('area',initial('area',0),0,'cell:3').data,'domino cannot wrap row');
assert.ok(!move('equation',initial('equation',0),0,'divide').data,'balance keeps equivalent operations');
assert.equal(ready('ratio',[2,3],0),false,'ratio alone does not satisfy reservoir capacity');
assert.equal(ready('data',[0,0,1,0,0],0),false,'mean alone does not satisfy bird population');
console.log('PASS: 33 mission chapters are solvable; native-input plans, invariant bounds, alternate strategies, and rejected moves validated.');
module.exports={plans};
