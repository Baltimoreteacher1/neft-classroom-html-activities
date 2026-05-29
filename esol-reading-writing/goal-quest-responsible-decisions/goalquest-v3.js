const REQUIRED = 4;
const STORE = 'goal_quest_v3_deep_build';

const DATA = [
  {
    id: 'story', icon: '📖', title: 'Story World', tag: 'Read + explore', short: 'Read 3 tiny stories, answer, sequence, and act it out.',
    readTitle: 'Maya Makes a Change',
    read: 'Maya wants mornings to feel calm. On Monday, her backpack is messy. She cannot find her homework. Maya feels worried, but she does not give up. She takes a breath, looks at the problem, and makes one small goal. At night, she packs her folder, pencil, and book. The next morning, Maya feels ready.',
    comic: [['🎒','Problem','Backpack is messy.'],['🌬️','Pause','Maya breathes.'],['🎯','Goal','Pack at night.'],['🌞','Result','Morning is calmer.']],
    vocab: [['worried','feeling nervous or unsure','preocupado/a'],['ready','prepared to begin','listo/a'],['calm','quiet and in control','tranquilo/a']],
    quiz: [['What was Maya’s problem?','She could not find homework.','She wanted a new backpack.','She lost her lunch.',0],['What did Maya do before choosing?','She stopped and breathed.','She yelled.','She gave up.',0],['What helped Maya feel ready?','Packing at night.','Hiding her folder.','Leaving books at school.',0]],
    extraStories: [
      ['Noah’s Team Goal','Noah wants to be a better teammate. His friend misses the ball. Noah wants to shout, but he remembers his goal. He says, “Nice try. Let’s try again.” His friend smiles and keeps playing.'],
      ['Ava’s Timer','Ava wants to sleep earlier. She wants five more minutes on the tablet. She sets a timer. When it rings, she puts the tablet away and gets ready for bed.']
    ],
    prompt: 'Maya felt ___ at first. At the end, she felt ___ because ___.'
  },
  {
    id: 'goal', icon: '🎯', title: 'Goal Lab', tag: 'Build + test', short: 'Make clear goals and test if they are strong.',
    readTitle: 'A Goal Needs a Shape',
    read: 'A goal is stronger when it is clear. Instead of saying, “I will do better,” say exactly what you will practice. A clear goal tells what you want, when you will try, and how you will know you are growing. Small goals are powerful because you can start today.',
    comic: [['👀','Look','What can I improve?'],['🧩','Choose','Pick one small part.'],['🗓️','Plan','Name when to try.'],['⭐','Show','Know you are growing.']],
    vocab: [['clear','easy to understand','claro/a'],['practice','try again to improve','practicar'],['improve','get better','mejorar']],
    ideas: ['read for 15 minutes','practice math facts','use English sentence frames','be a kind teammate','keep my desk organized','try again when work feels hard','ask for help when I am stuck','finish my work with focus'],
    prompt: 'My goal is to ___. I will try ___. I will know I am growing when ___.'
  },
  {
    id: 'choice', icon: '🌳', title: 'Choice Lab', tag: 'Decide + explain', short: 'Try real kid scenarios and choose responsibly.',
    readTitle: 'The Choice Lens',
    read: 'A responsible decision is a choice that helps you, helps others, and keeps people safe. Before you choose, stop and think. Ask: Does this help my goal? Is it kind? Is it safe? Then choose and reflect.',
    comic: [['🛑','Stop','Pause before acting.'],['🧠','Think','Look at choices.'],['✅','Choose','Pick the helpful action.'],['🪞','Reflect','What worked?']],
    vocab: [['responsible','helpful and safe','responsable'],['safe','not harmful','seguro/a'],['reflect','think about what worked','reflexionar']],
    scenarios: [
      ['A page has many new words.','Skip it.','Use pictures and ask for one word.','Close the book.',1],
      ['A teammate makes a mistake.','Laugh.','Say “nice try” and try again.','Walk away.',1],
      ['You want more tablet time before bed.','Set a timer and stop.','Hide the tablet.','Play all night.',0],
      ['You spill crayons on the floor.','Leave them.','Blame a friend.','Pick them up and ask for help.',2],
      ['A friend is alone at recess.','Invite them to play.','Ignore them.','Tell others not to play.',0],
      ['You feel angry during a game.','Take a breath and use words.','Push someone.','Throw the game piece.',0]
    ],
    prompt: 'I choose ___ because it is helpful, kind, and safe.'
  },
  {
    id: 'plan', icon: '🧭', title: 'Plan Path', tag: 'Order + prepare', short: 'Build a step-by-step path to the goal.',
    readTitle: 'One Step at a Time',
    read: 'A plan is a path. You do not need to finish the whole path in one giant jump. First, choose a clear goal. Next, pick one small action. Then, find a helper or tool. After that, practice and track your progress. Finally, reflect and choose the next step.',
    comic: [['1️⃣','First','Choose a goal.'],['2️⃣','Next','Pick an action.'],['3️⃣','Then','Use support.'],['4️⃣','Finally','Reflect.']],
    vocab: [['step','one small action','paso'],['support','help from a person or tool','apoyo'],['track','watch your progress','seguir']],
    steps: ['Choose one clear goal.','Name one small action.','Pick one helper or tool.','Practice and track progress.','Reflect and choose what is next.'],
    tools: ['picture clue','timer','teacher','partner','family member','checklist','quiet place','sentence frame'],
    prompt: 'First, I will ___. I can use ___ to help me.'
  },
  {
    id: 'words', icon: '🧩', title: 'Word Arcade', tag: 'Vocabulary games', short: 'Play match, sort, sentence, and word hunt games.',
    readTitle: 'Words Are Tools',
    read: 'Words can be tools. If you can say goal, choice, plan, support, effort, and reflect, you can explain what you need and what you will do next. Strong words help strong thinking.',
    comic: [['🎯','Goal','What I want.'],['✅','Choice','What I do.'],['🤝','Support','What helps.'],['💪','Effort','Keep trying.']],
    vocab: [['goal','something you want to do or improve','meta'],['choice','what you decide to do','decisión'],['plan','steps that help you reach a goal','plan'],['support','help from a person or tool','apoyo'],['effort','trying hard even when it is hard','esfuerzo'],['reflect','think about what worked','reflexionar']],
    prompt: 'One important word is ___. It means ___.'
  },
  {
    id: 'team', icon: '🤝', title: 'Team Talk', tag: 'Speak + listen', short: 'Practice partner talk, advice, and kind support.',
    readTitle: 'A Helper Makes the Path Easier',
    read: 'Goals are not only solo work. A helper can be a friend, teacher, family member, picture, timer, checklist, or sentence frame. Good teammates listen, repeat one important idea, and give kind advice.',
    comic: [['👂','Listen','Hear the goal.'],['💬','Ask','What is your step?'],['💡','Advise','Give one idea.'],['👏','Encourage','Use kind words.']],
    vocab: [['helper','someone or something that supports you','ayudante'],['advice','a helpful idea','consejo'],['encourage','help someone feel ready','animar']],
    talks: ['My goal is ___. What is your goal?','One helpful choice is ___ because ___.','Can you help me ___?','I agree because ___.','One kind idea is ___.','I heard you say ___.' ],
    prompt: 'Can you help me ___? One helpful idea is ___.'
  },
  {
    id: 'create', icon: '🎨', title: 'Create Studio', tag: 'Art + design', short: 'Create a poster, comic, badge, and sticker scene.',
    readTitle: 'Pictures Can Remind Us',
    read: 'A picture can remind your brain what to do next. A strong goal poster has a big title, one clear symbol, a short promise, and a few stickers or colors that match the goal. When you see it, you remember your next small step.',
    comic: [['🖍️','Title','Write it big.'],['🎯','Symbol','Choose a picture.'],['💬','Promise','Add words.'],['🏆','Share','Show your goal.']],
    vocab: [['poster','a picture with a message','cartel'],['symbol','a picture that stands for an idea','símbolo'],['promise','something you say you will try','promesa']],
    prompt: 'My poster shows ___ because ___.'
  },
  {
    id: 'quest', icon: '🏆', title: 'Boss Quest', tag: 'Review + passport', short: 'Beat the boss review and unlock your final passport.',
    readTitle: 'The Goal Champion Challenge',
    read: 'A Goal Champion does not need to be perfect. A Goal Champion notices a problem, chooses one small goal, makes a safe and helpful decision, asks for support, and reflects. You can be a Goal Champion by taking one good step today.',
    comic: [['🔍','Notice','See the problem.'],['🎯','Set','Choose a goal.'],['✅','Act','Make a choice.'],['🏆','Grow','Reflect.']],
    vocab: [['champion','someone who keeps trying','campeón/campeona'],['challenge','a hard task you can try','desafío'],['growth','getting better over time','crecimiento']],
    boss: [
      ['A clear goal tells...','what, when, and how I know.','only my favorite color.','nothing.',0],
      ['A responsible choice should be...','helpful, kind, and safe.','hidden and sneaky.','fast but unsafe.',0],
      ['Support can be...','a person or tool that helps.','only a prize.','never needed.',0],
      ['Reflect means...','think about what worked.','forget the goal.','copy a friend.',0]
    ],
    prompt: 'I am a Goal Champion because ___.'
  }
];

const defaultState = () => ({ name:'', lang:'en', completed:{}, answers:{}, checks:{}, goal:'', decision:'', nextStep:'', talk:'', posterTitle:'My Goal', posterIcon:'🎯', posterPromise:'I will try one small step today.', stickers:[], comic:[['😟','Problem'],['🎯','Goal'],['😊','Success']], scenarioIndex:0, boss:0 });
let state = load();
let active = 'story';
let selectedWord = null;
let stepOrder = [...DATA.find(s=>s.id==='plan').steps].sort(()=>Math.random()-.5);

function load(){ try { return {...defaultState(), ...JSON.parse(localStorage.getItem(STORE)||'{}')}; } catch { return defaultState(); } }
function save(){ localStorage.setItem(STORE, JSON.stringify(state)); renderProgress(); updatePassport(); }
function esc(s){ return String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }
function speak(text){ if(!('speechSynthesis' in window)){toast('Read aloud is not available.');return;} speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.rate=.86; speechSynthesis.speak(u); }
function countDone(){ return DATA.filter(s=>state.completed[s.id]).length; }
function spanish(word){ const v=DATA.flatMap(s=>s.vocab).find(x=>x[0]===word); return state.lang==='es' && v ? ' / '+v[2] : ''; }

function init(){
  document.getElementById('studentName').value = state.name;
  document.getElementById('languageHelp').value = state.lang;
  renderTabs(); renderPanels(); bindTop(); renderProgress(); showPanel(active, false);
}
function bindTop(){
  document.getElementById('saveSetup').onclick=()=>{state.name=document.getElementById('studentName').value.trim();state.lang=document.getElementById('languageHelp').value;save();renderPanels();showPanel(active,false);toast('Saved');};
  document.getElementById('readHero').onclick=()=>speak('Welcome to Goal Quest. Complete at least four stations. Each tab has reading, visuals, games, writing, speaking, and creating.');
  document.getElementById('openTeacher').onclick=()=>document.getElementById('teacherModal').showModal();
  document.getElementById('closeTeacher').onclick=()=>document.getElementById('teacherModal').close();
  document.getElementById('surprise').onclick=()=>showPanel(DATA[Math.floor(Math.random()*DATA.length)].id);
  document.getElementById('resetAll').onclick=()=>{ if(confirm('Reset Goal Quest on this device?')){localStorage.removeItem(STORE);location.reload();} };
  document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.jump).scrollIntoView({behavior:'smooth'}));
}
function renderTabs(){
  document.getElementById('tabs').innerHTML = DATA.map(s=>`<button class='tab' data-tab='${s.id}'><span class='ico'>${s.icon}</span><h3>${s.title}</h3><p>${s.tag}<br>${s.short}</p></button>`).join('');
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>showPanel(b.dataset.tab));
}
function renderPanels(){
  document.getElementById('panels').innerHTML = DATA.map(s=>`<article class='panel' id='panel-${s.id}'>${panelHeader(s)}${readSection(s)}${comicSection(s)}${vocabSection(s)}${activitySection(s)}${writingSection(s)}<div class='row' style='margin-top:16px'><button class='btn teal' data-complete='${s.id}'>✓ Check off this station</button><button class='btn light' data-readfull='${s.id}'>🔊 Read whole station</button></div></article>`).join('');
  bindPanelEvents();
}
function panelHeader(s){ return `<div class='station-head'><div class='station-icon'>${s.icon}</div><div><p class='eyebrow'>${s.tag}</p><h2>${s.title}</h2><p>${s.short}</p></div><span class='badge'>${state.completed[s.id]?'Checked':'Not checked yet'}</span></div>`; }
function readSection(s){ return `<section class='read-card'><div class='visual'>${s.icon}</div><div><h3>${s.readTitle}</h3><p>${s.read}</p><div class='row'><button class='btn light read-text' data-text='${esc(s.readTitle+'. '+s.read)}'>🔊 Read</button><span class='badge'>Short reading</span></div></div></section>`; }
function comicSection(s){ return `<section class='block' style='margin-top:16px'><h3>Visual mini-comic</h3><p>Look at the pictures. Retell the idea with your own words.</p><div class='mini-comic'>${s.comic.map(c=>`<div class='comic'><span class='big'>${c[0]}</span><strong>${c[1]}</strong><span>${c[2]}</span></div>`).join('')}</div></section>`; }
function vocabSection(s){ return `<section class='grid2' style='margin-top:16px'><div class='block white'><h3>Word power flashcards</h3><p>Tap each card to reveal the meaning.</p><div class='card-row'>${s.vocab.map(v=>`<button class='flip'><strong>${v[0]}${spanish(v[0])}</strong><span class='hidden-def'>${v[1]}</span></button>`).join('')}</div></div><div class='block'><h3>Meaning match</h3><p>Tap a word, then tap its meaning box.</p><div class='word-row'>${s.vocab.map(v=>`<button class='word vocab-word' data-word='${v[0]}'>${v[0]}</button>`).join('')}</div><div class='match-board'>${s.vocab.map(v=>`<div class='match' data-meaning='${v[0]}'><h4>${v[1]}</h4><div class='drop'></div></div>`).join('')}</div><div class='feedback' id='fb-${s.id}-vocab'>Match words to meanings.</div></div></section>`; }
function writingSection(s){ if(s.id==='create'||s.id==='quest') return ''; return `<section class='block white' style='margin-top:16px'><h3>Write, draw, or talk response</h3><p>Use a frame. This saves to your final passport.</p><div class='starter-grid'>${['I noticed ___.','My goal is ___.','A responsible choice is ___.','My next step is ___.'].map(t=>`<button class='starter' data-fill='write-${s.id}'>${t}</button>`).join('')}</div><textarea id='write-${s.id}' placeholder='Type your idea here...'>${esc(state.answers['write-'+s.id])}</textarea></section>`; }

function activitySection(s){
  if(s.id==='story') return storyActivity(s);
  if(s.id==='goal') return goalActivity(s);
  if(s.id==='choice') return choiceActivity(s);
  if(s.id==='plan') return planActivity(s);
  if(s.id==='words') return wordActivity(s);
  if(s.id==='team') return teamActivity(s);
  if(s.id==='create') return createActivity(s);
  return questActivity(s);
}
function storyActivity(s){
  return `<section class='grid2' style='margin-top:16px'><div class='block'><h3>Comprehension Quest</h3><div class='choice-grid'>${s.quiz.map((q,i)=>`<div><p><strong>${i+1}. ${q[0]}</strong></p>${q.slice(1,4).map((a,j)=>`<button class='choice quiz' data-good='${j===q[4]}'><span class='small'>${['A','B','C'][j]}</span><span>${a}</span></button>`).join('')}</div>`).join('')}</div><div class='feedback'>Use story details.</div></div><div class='block white'><h3>Story Carousel</h3><p>Read another tiny story. Say the goal and responsible choice.</p><div id='extraStory' class='feedback good'></div><button class='btn light' id='newStory'>New tiny story</button><h3>Feeling Thermometer</h3><div class='grid3'><button class='choice feel'><span class='small'>😟</span>worried</button><button class='choice feel'><span class='small'>😐</span>calm</button><button class='choice feel'><span class='small'>😊</span>proud</button></div><textarea id='storyAnswer' placeholder='Maya felt ___ because...'>${esc(state.answers.storyAnswer)}</textarea></div></section><section class='block' style='margin-top:16px'><h3>Sequence Builder</h3><p>Tap the events in the order they happened.</p><div class='grid4'>${s.comic.map((c,i)=>`<button class='choice seq' data-order='${i}'><span class='small'>${c[0]}</span>${c[2]}</button>`).join('')}</div><div id='seqFb' class='feedback'>Choose 1, 2, 3, 4.</div></section>`;
}
function goalActivity(s){
  return `<section class='grid2' style='margin-top:16px'><div class='block'><h3>Goal Machine</h3><p>Choose parts. Then build a goal sentence.</p><div class='field'><label>What will you practice?</label><select id='goalWhat'>${s.ideas.map(x=>`<option>${x}</option>`).join('')}</select></div><div class='field'><label>When will you try?</label><select id='goalWhen'><option>each morning</option><option>after lunch</option><option>during reading time</option><option>before bedtime</option><option>when work feels hard</option></select></div><div class='field'><label>How will you know?</label><select id='goalHow'><option>I can tell one thing I improved.</option><option>I can show my teacher.</option><option>I can check my work.</option><option>I can explain my choice.</option></select></div><button class='btn light' id='buildGoal'>Build goal sentence</button></div><div class='block white'><h3>Goal Strength Test</h3><p>Check the goal. Strong goals are clear and small enough to start.</p><textarea id='goalText'>${esc(state.goal)}</textarea><div class='checklist' id='goalChecks'></div></div></section><section class='block' style='margin-top:16px'><h3>Goal Sort Game</h3><p>Which goals are clear? Tap the strong goals.</p><div class='grid3'>${['I will do better.','I will read for 15 minutes after dinner.','I will be good.','I will ask one question when I am stuck.','I will practice math facts for 5 minutes.','I will try hard.'].map((g,i)=>`<button class='choice goalSort' data-good='${[1,3,4].includes(i)}'><span class='small'>🎯</span>${g}</button>`).join('')}</div><div class='feedback'>Strong goals are specific.</div></section>`;
}
function choiceActivity(s){
  const sc=s.scenarios[state.scenarioIndex%s.scenarios.length];
  return `<section class='grid2' style='margin-top:16px'><div class='block'><h3>Scenario Spinner</h3><p><strong>${sc[0]}</strong></p><div class='choice-grid'>${sc.slice(1,4).map((a,i)=>`<button class='choice scenario' data-good='${i===sc[4]}'><span class='small'>${['A','B','C'][i]}</span><span>${a}</span></button>`).join('')}</div><div class='row'><button class='btn light' id='nextScenario'>Next scenario</button></div><div class='feedback' id='scenarioFb'>Choose the responsible decision.</div></div><div class='block white'><h3>Decision Shield</h3><p>Before you choose, check all three.</p><div class='checklist' id='shieldChecks'></div><textarea id='decisionText' placeholder='I choose this because...'>${esc(state.decision)}</textarea></div></section><section class='block' style='margin-top:16px'><h3>Consequence Sort</h3><p>Tap each consequence: helpful or not helpful?</p><div class='grid3'>${[['👏','friend keeps trying',true],['😢','friend feels hurt',false],['🧠','I learn from a mistake',true],['🤫','I hide the problem',false],['✅','the goal gets closer',true],['⚠️','someone may get hurt',false]].map(x=>`<button class='choice consequence' data-good='${x[2]}'><span class='small'>${x[0]}</span>${x[1]}</button>`).join('')}</div><div class='feedback'>Responsible choices usually lead to helpful consequences.</div></section>`;
}
function planActivity(s){
  return `<section class='grid2' style='margin-top:16px'><div class='block'><h3>Step Order Challenge</h3><p>Move the plan path into order.</p><div class='step-list' id='stepList'></div><div class='row'><button class='btn light' id='checkSteps'>Check order</button><button class='btn light' id='shuffleSteps'>Shuffle again</button></div><div class='feedback' id='stepFb'>Start with the goal. End with reflection.</div></div><div class='block white'><h3>Helper Backpack</h3><p>Pack tools that could help your goal.</p><div class='checklist' id='helperChecks'></div><textarea id='nextStep' placeholder='First, I will...'>${esc(state.nextStep)}</textarea></div></section><section class='block' style='margin-top:16px'><h3>Plan Map</h3><p>Fill each stop on the path.</p><div class='grid4'>${['My goal','My first step','My helper','How I will reflect'].map((x,i)=>`<div class='block white'><h3>${i+1}. ${x}</h3><textarea id='map-${i}' placeholder='Type here...'>${esc(state.answers['map-'+i])}</textarea></div>`).join('')}</div></section>`;
}
function wordActivity(s){
  return `<section class='grid2' style='margin-top:16px'><div class='block'><h3>Word Sort Arcade</h3><p>Tap a word, then tap a box.</p><div class='word-row'>${s.vocab.map(v=>`<button class='word sortword' data-type='${['goal','choice','plan'].includes(v[0])?'goal':['support'].includes(v[0])?'help':'action'}'>${v[0]}</button>`).join('')}</div><div class='match-board'><div class='match sortbox' data-type='goal'><h4>Goal / Plan Words</h4></div><div class='match sortbox' data-type='action'><h4>Action Words</h4></div><div class='match sortbox' data-type='help'><h4>Help Words</h4></div></div><div class='feedback' id='sortFb'>Sort the words.</div></div><div class='block white'><h3>Sentence Builder</h3><p>Tap sentence frames and add a vocabulary word.</p><div class='starter-grid'>${['My ___ is important because ___.','I can use ___ when ___.','A good ___ helps me ___.','I will ___ by ___.'].map(t=>`<button class='starter' data-fill='wordSentence'>${t}</button>`).join('')}</div><textarea id='wordSentence'>${esc(state.answers.wordSentence)}</textarea></div></section><section class='block' style='margin-top:16px'><h3>Word Hunt</h3><p>Find and tap the goal words. Avoid the distractors.</p><div class='grid4'>${['goal','pizza','choice','dragon','support','pencil','effort','reflect','cloud','plan','game','helper'].map(w=>`<button class='choice hunt' data-good='${s.vocab.some(v=>v[0]===w)||w==='helper'}'><span class='small'>🔎</span>${w}</button>`).join('')}</div><div class='feedback'>Find words that connect to goals and choices.</div></section>`;
}
function teamActivity(s){
  return `<section class='grid2' style='margin-top:16px'><div class='block'><h3>Partner Role-Play Cards</h3><div id='talkPrompt' class='feedback good'></div><button class='btn light' id='newTalk'>New talk card</button><h3>Listening Badges</h3><div class='checklist' id='listenChecks'></div></div><div class='block white'><h3>Speaking Studio</h3><p>Use a frame. Then read it aloud.</p><div class='starter-grid'>${s.talks.map(t=>`<button class='starter' data-fill='talkText'>${t}</button>`).join('')}</div><textarea id='talkText'>${esc(state.talk)}</textarea><button class='btn light' id='readTalk'>🔊 Read my answer</button></div></section><section class='block' style='margin-top:16px'><h3>Advice Builder</h3><p>Choose a feeling and give advice.</p><div class='grid3'>${[['😟','nervous'],['😤','frustrated'],['🙂','ready'],['😴','tired'],['😕','confused'],['🤩','excited']].map(x=>`<button class='choice mood'><span class='small'>${x[0]}</span>${x[1]}</button>`).join('')}</div><textarea id='adviceText' placeholder='If my partner feels ___, I can say...'>${esc(state.answers.adviceText)}</textarea></section>`;
}
function createActivity(s){
  return `<section class='grid2' style='margin-top:16px'><div class='block'><h3>Goal Poster Maker</h3><div class='field'><label>Poster title</label><input id='posterTitle' value='${esc(state.posterTitle)}'></div><div class='field'><label>Main picture</label><select id='posterIcon'><option>🎯</option><option>📚</option><option>🧮</option><option>🤝</option><option>🎒</option><option>💪</option><option>🌈</option><option>⭐</option></select></div><div class='field'><label>Goal promise</label><input id='posterPromise' value='${esc(state.posterPromise)}'></div><p><strong>Add stickers:</strong></p><div class='word-row'>${['⭐','❤️','✅','🌈','👏','🔥','📖','🧠','🤝','🏆','🌞','💡'].map(x=>`<button class='word sticker'>${x}</button>`).join('')}</div><div class='canvas' id='artCanvas'></div></div><div class='block white'><h3>Poster Preview</h3><div class='poster'><h3 id='posterTitleOut'></h3><div class='poster-main' id='posterIconOut'></div><p id='posterPromiseOut' style='font-size:1.2rem;font-weight:950;color:var(--navy);margin:0'></p><div class='stickers' id='stickerOut'></div></div></div></section><section class='grid2' style='margin-top:16px'><div class='block'><h3>3-Panel Goal Comic</h3><p>Choose a face for each panel.</p><div class='comic-maker' id='comicMaker'></div></div><div class='block white'><h3>Badge Designer</h3><p>Choose a badge name and power.</p><input id='badgeName' placeholder='Goal Champion' value='${esc(state.answers.badgeName||'Goal Champion')}'> <textarea id='badgePower' placeholder='My badge power is...'>${esc(state.answers.badgePower)}</textarea></div></section>`;
}
function questActivity(s){
  return `<section class='grid2' style='margin-top:16px'><div class='block'><h3>Boss Review Battle</h3><p id='bossQ'></p><div class='choice-grid' id='bossChoices'></div><div class='row'><button class='btn light' id='nextBoss'>Next boss question</button></div><div class='feedback' id='bossFb'>Answer to power up.</div></div><div class='block white'><h3>Final Goal Passport</h3><div class='feedback' id='passportLock'>Complete 4 stations to unlock the passport.</div><div class='portfolio' id='passport'></div><div class='row'><button class='btn light' id='copyPassport'>Copy passport</button><button class='btn light' onclick='window.print()'>Print / Save PDF</button></div></div></section><section class='block' style='margin-top:16px'><h3>Reflection Choice Board</h3><p>Pick at least one reflection move.</p><div class='grid4'>${['I learned...','I will try...','A helper I can use is...','One responsible choice is...'].map(t=>`<button class='choice reflect' data-fill='finalReflect'><span class='small'>✍️</span>${t}</button>`).join('')}</div><textarea id='finalReflect'>${esc(state.answers.finalReflect)}</textarea></section>`;
}

function bindPanelEvents(){
  document.querySelectorAll('[data-complete]').forEach(b=>b.onclick=()=>completeStation(b.dataset.complete));
  document.querySelectorAll('.read-text').forEach(b=>b.onclick=()=>speak(b.dataset.text));
  document.querySelectorAll('[data-readfull]').forEach(b=>b.onclick=()=>{const s=DATA.find(x=>x.id===b.dataset.readfull);speak(s.title+'. '+s.readTitle+'. '+s.read)});
  document.querySelectorAll('.flip').forEach(b=>b.onclick=()=>b.classList.toggle('flipped'));
  document.querySelectorAll('.quiz,.goalSort,.consequence,.hunt').forEach(b=>b.onclick=()=>{const good=b.dataset.good==='true'; b.classList.add(good?'correct':'incorrect'); const fb=b.closest('.block').querySelector('.feedback'); if(fb){fb.className='feedback '+(good?'good':'try'); fb.textContent=good?'Correct. Nice thinking.':'Try again. Look back at the reading.';}});
  let seq=[]; document.querySelectorAll('.seq').forEach(b=>b.onclick=()=>{b.classList.add('selected');seq.push(+b.dataset.order);const fb=document.getElementById('seqFb');if(seq.length===4){const good=seq.every((x,i)=>x===i);fb.className='feedback '+(good?'good':'try');fb.textContent=good?'Correct sequence.':'Try again. Start with the problem.';seq=[];setTimeout(()=>document.querySelectorAll('.seq').forEach(x=>x.classList.remove('selected')),700)}});
  document.querySelectorAll('.feel,.mood').forEach(b=>b.onclick=()=>b.classList.toggle('selected'));
  bindVocab(); bindInputs(); bindSpecial();
}
function bindVocab(){
  document.querySelectorAll('.vocab-word').forEach(w=>w.onclick=()=>{document.querySelectorAll('.vocab-word').forEach(x=>x.classList.remove('active')); selectedWord=w; w.classList.add('active');});
  document.querySelectorAll('.match').forEach(m=>m.onclick=()=>{ if(!selectedWord || !m.dataset.meaning) return; const tag=document.createElement('span'); tag.className='tag'; tag.textContent=selectedWord.dataset.word; m.querySelector('.drop')?.appendChild(tag); const fb=m.closest('.grid2').querySelector('.feedback'); const good=m.dataset.meaning===selectedWord.dataset.word; fb.className='feedback '+(good?'good':'try'); fb.textContent=good?'Good match.':'Check the meaning and try again.'; selectedWord.classList.remove('active'); selectedWord=null; });
  let sortWord=null; document.querySelectorAll('.sortword').forEach(w=>w.onclick=()=>{document.querySelectorAll('.sortword').forEach(x=>x.classList.remove('active')); sortWord=w; w.classList.add('active');});
  document.querySelectorAll('.sortbox').forEach(box=>box.onclick=()=>{ if(!sortWord)return; const tag=document.createElement('span'); tag.className='tag'; tag.textContent=sortWord.textContent; box.appendChild(tag); const good=box.dataset.type===sortWord.dataset.type; const fb=document.getElementById('sortFb'); fb.className='feedback '+(good?'good':'try'); fb.textContent=good?'Good sort.':'Try another category.'; sortWord.remove(); sortWord=null; });
}
function bindInputs(){
  document.querySelectorAll('textarea,input,select').forEach(el=>el.addEventListener('input',persistInputs));
  document.querySelectorAll('.starter,.reflect').forEach(b=>b.onclick=()=>{const t=document.getElementById(b.dataset.fill); if(t){t.value=(t.value?t.value+' ':'')+b.textContent; t.dispatchEvent(new Event('input')); t.focus();}});
}
function persistInputs(){
  state.name=document.getElementById('studentName')?.value.trim()||state.name;
  state.lang=document.getElementById('languageHelp')?.value||state.lang;
  state.goal=document.getElementById('goalText')?.value||state.goal;
  state.decision=document.getElementById('decisionText')?.value||state.decision;
  state.nextStep=document.getElementById('nextStep')?.value||state.nextStep;
  state.talk=document.getElementById('talkText')?.value||state.talk;
  state.posterTitle=document.getElementById('posterTitle')?.value||state.posterTitle;
  state.posterIcon=document.getElementById('posterIcon')?.value||state.posterIcon;
  state.posterPromise=document.getElementById('posterPromise')?.value||state.posterPromise;
  document.querySelectorAll('textarea[id],input[id]').forEach(t=>{ if(!['studentName','posterTitle'].includes(t.id)) state.answers[t.id]=t.value; });
  localStorage.setItem(STORE,JSON.stringify(state)); updatePassport(); posterUpdate();
}
function bindSpecial(){
  const extra=document.getElementById('extraStory'); if(extra){const arr=DATA.find(s=>s.id==='story').extraStories; const show=()=>{const x=arr[Math.floor(Math.random()*arr.length)]; extra.innerHTML='<strong>'+x[0]+'</strong><br>'+x[1];}; document.getElementById('newStory').onclick=show; show();}
  const bg=document.getElementById('buildGoal'); if(bg) bg.onclick=()=>{const what=document.getElementById('goalWhat').value, when=document.getElementById('goalWhen').value, how=document.getElementById('goalHow').value; state.goal=`My goal is to ${what} ${when}. I will know I am growing when ${how}`; document.getElementById('goalText').value=state.goal; save(); };
  const gc=document.getElementById('goalChecks'); if(gc) gc.innerHTML=['Is it clear?','Can I start today?','Did I say when?','Did I say how I will know?'].map((x,i)=>`<button class='checkitem'><span class='box'></span><span>${x}</span></button>`).join('');
  const sh=document.getElementById('shieldChecks'); if(sh) sh.innerHTML=['Does it help my goal?','Is it kind?','Is it safe?'].map(x=>`<button class='checkitem'><span class='box'></span><span>${x}</span></button>`).join('');
  const helpers=document.getElementById('helperChecks'); if(helpers) helpers.innerHTML=DATA.find(s=>s.id==='plan').tools.map(x=>`<button class='checkitem'><span class='box'></span><span>${x}</span></button>`).join('');
  const listen=document.getElementById('listenChecks'); if(listen) listen.innerHTML=['I looked at my partner.','I repeated one idea.','I gave kind advice.','I used a sentence frame.'].map(x=>`<button class='checkitem'><span class='box'></span><span>${x}</span></button>`).join('');
  document.querySelectorAll('.checkitem').forEach(c=>c.onclick=()=>{c.classList.toggle('on'); c.querySelector('.box').textContent=c.classList.contains('on')?'✓':'';});
  const ns=document.getElementById('nextScenario'); if(ns) ns.onclick=()=>{state.scenarioIndex=(state.scenarioIndex+1)%DATA.find(s=>s.id==='choice').scenarios.length; save(); renderPanels(); showPanel('choice',false);};
  document.querySelectorAll('.scenario').forEach(b=>b.onclick=()=>{document.querySelectorAll('.scenario').forEach(x=>x.classList.remove('correct','incorrect')); const good=b.dataset.good==='true'; b.classList.add(good?'correct':'incorrect'); const fb=document.getElementById('scenarioFb'); fb.className='feedback '+(good?'good':'try'); fb.textContent=good?'Yes. This choice helps the goal and keeps people safe.':'Try another choice. Ask: helpful, kind, and safe?'; if(good){state.decision='I choose this because it helps my goal, helps others, and keeps people safe.'; document.getElementById('decisionText').value=state.decision; save();}});
  renderStepList(); const cs=document.getElementById('checkSteps'); if(cs) cs.onclick=checkSteps; const ss=document.getElementById('shuffleSteps'); if(ss) ss.onclick=()=>{stepOrder=[...DATA.find(s=>s.id==='plan').steps].sort(()=>Math.random()-.5); renderStepList();};
  renderTalk(); const nt=document.getElementById('newTalk'); if(nt) nt.onclick=renderTalk; const rt=document.getElementById('readTalk'); if(rt) rt.onclick=()=>speak(document.getElementById('talkText').value||'Type your answer first.');
  renderBoss(); const nb=document.getElementById('nextBoss'); if(nb) nb.onclick=()=>{state.boss=(state.boss+1)%DATA.find(s=>s.id==='quest').boss.length; save(); renderBoss();};
  const pi=document.getElementById('posterIcon'); if(pi) pi.value=state.posterIcon; document.querySelectorAll('.sticker').forEach(b=>b.onclick=()=>{state.stickers.push(b.textContent); save(); posterUpdate();}); renderComicMaker(); posterUpdate(); updatePassport(); const cp=document.getElementById('copyPassport'); if(cp) cp.onclick=copyPassport;
}
function renderStepList(){const list=document.getElementById('stepList'); if(!list)return; list.innerHTML=stepOrder.map((txt,i)=>`<div class='step'><div class='num'>${i+1}</div><strong>${txt}</strong><div><button class='mini' data-up='${i}'>↑</button><button class='mini' data-down='${i}'>↓</button></div></div>`).join(''); document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>moveStep(+b.dataset.up,-1)); document.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>moveStep(+b.dataset.down,1));}
function moveStep(i,d){const t=i+d; if(t<0||t>=stepOrder.length)return; [stepOrder[i],stepOrder[t]]=[stepOrder[t],stepOrder[i]]; renderStepList();}
function checkSteps(){const correct=DATA.find(s=>s.id==='plan').steps.every((x,i)=>x===stepOrder[i]); const fb=document.getElementById('stepFb'); fb.className='feedback '+(correct?'good':'try'); fb.textContent=correct?'Great order. Your plan has a clear path.':'Almost. Start with choosing a goal and end with reflecting.';}
function renderTalk(){const box=document.getElementById('talkPrompt'); if(!box)return; const arr=DATA.find(s=>s.id==='team').talks; box.textContent='Partner card: '+arr[Math.floor(Math.random()*arr.length)]+' Listener says: I heard you say ___.';}
function renderComicMaker(){const maker=document.getElementById('comicMaker'); if(!maker)return; maker.innerHTML=state.comic.map((p,i)=>`<div class='comic-box'><div class='face'>${p[0]}</div><input data-comic-face='${i}' value='${esc(p[0])}'><input data-comic-text='${i}' value='${esc(p[1])}'></div>`).join(''); maker.querySelectorAll('input').forEach(inp=>inp.oninput=()=>{const i=+(inp.dataset.comicFace??inp.dataset.comicText); if(inp.dataset.comicFace!==undefined) state.comic[i][0]=inp.value; else state.comic[i][1]=inp.value; save();});}
function posterUpdate(){const title=document.getElementById('posterTitleOut'),icon=document.getElementById('posterIconOut'),promise=document.getElementById('posterPromiseOut'),stick=document.getElementById('stickerOut'),canvas=document.getElementById('artCanvas'); if(!title)return; title.textContent=state.posterTitle; icon.textContent=state.posterIcon; promise.textContent=state.posterPromise; stick.textContent=state.stickers.join(' '); canvas.innerHTML=state.stickers.map((x,i)=>`<span data-remove='${i}'>${x}</span>`).join(''); canvas.querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{state.stickers.splice(+el.dataset.remove,1); save(); posterUpdate();});}
function renderBoss(){const qbox=document.getElementById('bossQ'), cbox=document.getElementById('bossChoices'); if(!qbox)return; const q=DATA.find(s=>s.id==='quest').boss[state.boss]; qbox.innerHTML='<strong>'+q[0]+'</strong>'; cbox.innerHTML=q.slice(1,4).map((a,i)=>`<button class='choice bossChoice' data-good='${i===q[4]}'><span class='small'>${['A','B','C'][i]}</span>${a}</button>`).join(''); document.querySelectorAll('.bossChoice').forEach(b=>b.onclick=()=>{const good=b.dataset.good==='true'; b.classList.add(good?'correct':'incorrect'); const fb=document.getElementById('bossFb'); fb.className='feedback '+(good?'good':'try'); fb.textContent=good?'Power up! Correct review answer.':'Try again. Look back at the stations.';});}
function showPanel(id, scroll=true){active=id; document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active')); document.getElementById('panel-'+id)?.classList.add('active'); document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===id)); if(scroll) document.getElementById('panel-'+id)?.scrollIntoView({behavior:'smooth',block:'start'}); updatePassport();}
function completeStation(id){state.completed[id]=true; save(); renderPanels(); renderTabs(); showPanel(id,false); toast('Station checked at the top.'); if(countDone()>=REQUIRED) toast('Goal Passport unlocked.');}
function renderProgress(){const done=countDone(), pct=Math.min(done,REQUIRED)/REQUIRED*100; document.getElementById('ring').style.setProperty('--pct',pct+'%'); document.getElementById('ringText').textContent=Math.min(done,REQUIRED)+'/4'; document.getElementById('unlockText').textContent=done>=REQUIRED?'Unlocked: final Goal Passport is ready.':'Complete '+(REQUIRED-done)+' more station(s) to unlock final passport.'; document.getElementById('checkStrip').innerHTML=DATA.map(s=>`<div class='check ${state.completed[s.id]?'done':''}'><b>${state.completed[s.id]?'✓':''}</b><span>${s.icon} ${s.title}</span></div>`).join('');}
function updatePassport(){const p=document.getElementById('passport'), lock=document.getElementById('passportLock'); if(!p)return; const unlocked=countDone()>=REQUIRED; if(lock){lock.className='feedback '+(unlocked?'good':'try'); lock.textContent=unlocked?'Unlocked. Copy or print your Goal Passport.':'Complete at least 4 stations to unlock the final passport.';} p.classList.toggle('lock',!unlocked); p.textContent=`GOAL PASSPORT\nName: ${state.name||'Student'}\nStations complete: ${countDone()} / 4 required\n\nMy goal:\n${state.goal||'My goal is to...'}\n\nMy responsible decision:\n${state.decision||'I choose this because...'}\n\nMy next step:\n${state.nextStep||'First, I will...'}\n\nMy team talk sentence:\n${state.talk||'Can you help me...?'}\n\nMy goal art:\n${state.posterTitle} ${state.posterIcon}\n${state.posterPromise}\n${state.stickers.join(' ')}\n\nMy final reflection:\n${state.answers.finalReflect||''}`;}
async function copyPassport(){ if(countDone()<REQUIRED){toast('Complete 4 stations first.');return;} try{await navigator.clipboard.writeText(document.getElementById('passport').textContent); toast('Goal Passport copied.');}catch{toast('Select the passport text and copy it.');}}

init();
