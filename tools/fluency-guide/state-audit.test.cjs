'use strict';
// Isolated state/export checks: no browser, file mutation, network or real storage.
// Browser integration tests separately cover rendering and native dialogs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const teacherHTML = read('../../curriculum/fluency/teacher/index.html');
const DATA = JSON.parse(teacherHTML.split('<script>window.FluencyData = ')[1].split(';</script>')[0]);
const studioSource = read('src/studio.js');
const eventStart = studioSource.search(/\n[ \t]+document\.addEventListener\(["']click["']/);
assert.ok(eventStart > 0, 'Studio event boundary must exist');
const beforeEvents = studioSource.slice(0, eventStart);

function harness({url='file:///tmp/guide/index.html', raw='', data=DATA, blocked=false}={}) {
  let stored=raw, download=null, copied='';
  class TestURL extends URL {
    static createObjectURL(blob) { download=blob; return 'blob:test-download'; }
    static revokeObjectURL() {}
  }
  const context=vm.createContext({
    window:{FluencyData:JSON.parse(JSON.stringify(data))},URL:TestURL,URLSearchParams,Blob,
        location:new URL(url),
    document:{documentElement:{dataset:{}},body:{classList:{contains:()=>false},appendChild(){}},
      getElementById:()=>null,querySelector:()=>null,createElement:()=>({click(){},remove(){}})},
    navigator:{clipboard:{async writeText(text){copied=text;}}},
    sessionStorage:{getItem(){if(blocked)throw new Error('Storage blocked');return stored;},setItem(_,value){if(blocked)throw new Error('Storage blocked');stored=value;}},
    clearTimeout(){},setTimeout(){return 0;}
  });
  vm.runInContext(beforeEvents+`
  // Controlled lab export interface; model behavior has a separate audit.
  labsSnapshot = () => ({active:'selected-investigation'});
  return {
    restore,save,route,downloadWork,copyLink,status:saveStatusText,
    state:()=>({lessonId,level,mode,sets:session.size}),
    first:()=>currentSet().answers[0],
    putFirst:changes=>Object.assign(currentSet().answers[0],changes),
    seedLarge:()=>{session.clear();for(const l of lessons)for(const tier of Object.keys(levels)){
      level=tier;session.set(l.id+'-'+tier,{active:0,answers:Array.from({length:problems(l).length},()=>({...blankAnswer(),text:'a'.repeat(1500),reasoning:'b'.repeat(1500),reflection:'c'.repeat(1500)}))});
    }lessonId='2-1';level='foundation';}
  };})();`,context);
  return {api:context.window.FluencyStudio,stored:()=>stored,download:()=>download,copied:()=>copied};
}
for(const value of ['__proto__','constructor','toString']) {
  test(`prototype fragment ${value} is not a valid lesson, tier or mode`,()=>{
    const h=harness({url:`file:///tmp/guide/index.html#lesson=${value}&level=${value}&mode=${value}`});
    h.api.route();assert.equal(h.api.state().lessonId,'2-1');assert.equal(h.api.state().level,'foundation');assert.equal(h.api.state().mode,'practice');assert.equal(h.api.first().scratchOpen,false);
  });
  test(`prototype metadata ${value} does not corrupt restored route`,()=>{
    const h=harness({raw:JSON.stringify({version:4,lesson:value,level:value,mode:value,sets:{}})});
    h.api.restore();assert.equal(h.api.state().lessonId,'2-1');assert.equal(h.api.state().level,'foundation');assert.equal(h.api.state().mode,'practice');
  });
}
test('oversized new session preserves prior stored work and reports unsaved changes',()=>{
  const h=harness();h.api.putFirst({text:'retain previous answer'});h.api.save();const prior=h.stored();h.api.seedLarge();h.api.save();
  assert.equal(h.stored(),prior);assert.match(h.api.status(),/Recent changes are not saved/);
});
test('oversized existing session is held byte-for-byte through restore and save',()=>{
  const raw=JSON.stringify({version:4,sets:{},padding:'a'.repeat(3500000)});const h=harness({raw});h.api.restore();h.api.save();
  assert.equal(h.stored(),raw);assert.match(h.api.status(),/kept unchanged/);
});
test('one malformed saved record does not discard a later valid lesson set',()=>{
  const h=harness({url:'file:///tmp/guide/index.html#lesson=2-2',raw:JSON.stringify({version:4,sets:{'2-1-foundation':null,'2-2-foundation':{active:0,answers:[{text:'preserve me'},{},{},{}]}}})});
  h.api.restore();assert.equal(h.api.state().sets,1);h.api.route();assert.equal(h.api.first().text,'preserve me');h.api.save();assert.match(h.stored(),/preserve me/);
});
test('valid practice text and normalized strokes survive a storage round trip',()=>{
  const h=harness();h.api.putFirst({text:'7, 7, 12, 18, 25',reflection:'I checked every neighboring pair.',strokes:[{tool:'pen',points:[[.25,.5]]}]});h.api.save();
  const next=harness({raw:h.stored()});next.api.restore();assert.equal(next.api.first().text,'7, 7, 12, 18, 25');assert.equal(next.api.first().strokes[0].points[0][0],.25);
});
test('blocked storage reports failure without preventing in-memory work',()=>{
  const h=harness({blocked:true});assert.doesNotThrow(()=>h.api.restore());h.api.putFirst({text:'an attempt'});assert.doesNotThrow(()=>h.api.save());assert.equal(h.api.first().text,'an attempt');assert.match(h.api.status(),/Saving is unavailable/);
});
test('malformed JSON does not throw into the application',()=>{
  const h=harness({raw:'{invalid'});assert.doesNotThrow(()=>h.api.restore());assert.equal(h.api.first().text,'');
});
test('download retains pen taps, line strokes, and eraser taps in order',async()=>{
  const h=harness();h.api.putFirst({strokes:[{tool:'pen',points:[[.5,.5]]},{tool:'pen',points:[[.1,.2],[.3,.4]]},{tool:'eraser',points:[[.5,.5]]}]});h.api.downloadWork();const html=await h.download().text();
  assert.match(html,/<circle cx="350\.0" cy="120\.0" r="1\.5" fill="#075e60"\/>/);
  assert.match(html,/<polyline points="70\.0,48\.0 210\.0,96\.0"/);
  assert.match(html,/<circle cx="350\.0" cy="120\.0" r="11" fill="white"\/>/);
  assert.ok(html.indexOf('r="1.5"')<html.indexOf('<polyline'));assert.ok(html.indexOf('<polyline')<html.indexOf('r="11"'));
});
test('download escapes response and reflection markup',async()=>{
  const h=harness();h.api.putFirst({text:'<img src=x onerror=alert(1)>',reflection:'<script>danger()</script>'});h.api.downloadWork();const html=await h.download().text();
  assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('<script>danger'));assert.ok(html.includes('&lt;script&gt;danger()&lt;/script&gt;'));
});
for(const [label,url,studentPath,expected]of[
  ['Desktop','file:///tmp/guide/index.html','student.html','file:///tmp/guide/student.html'],
  ['hosted teacher directory','https://eduwonderlab.com/curriculum/fluency/teacher/','../','https://eduwonderlab.com/curriculum/fluency/'],
  ['hosted teacher index','https://eduwonderlab.com/curriculum/fluency/teacher/index.html','../','https://eduwonderlab.com/curriculum/fluency/']
])test(`${label} student link resolves configured path and preserves lesson selection`,async()=>{
  const h=harness({url:url+'?unused=1#lesson=3-2&level=core&mode=labs',data:{...DATA,studentPath}});h.api.route();await h.api.copyLink(true);const copied=new URL(h.copied());
  assert.equal(copied.href.split('#')[0],expected);const hash=new URLSearchParams(copied.hash.slice(1));assert.equal(hash.get('lesson'),'3-2');assert.equal(hash.get('level'),'core');assert.equal(hash.get('activity'),'labs');assert.equal(hash.get('lab'),'selected-investigation');
});
