/* Function Forge: Variables Lab — Premium v3.0
   Full game engine with adaptive difficulty, skill trees, boss battles
*/

const CONFIG = {
  APP_NAME: "Function Forge: Variables Lab Premium",
  VERSION: "3.0.0",
  XP_CORRECT: 10,
  XP_BOSS: 40,
  COINS_CORRECT: 3,
  COINS_BOSS: 20,
  STREAK_BONUS_AT: 5,
  XP_STREAK_BONUS: 25,
  LEVEL_UP_AT_XP: 140,
  TARGET_ACC_FOR_HARDER: 0.80,
  SAVE_KEY: "fforge_v3_save",
  RECENT_LOG_MAX: 150,
};

function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
function pct(n){ return Math.round(n*100); }
function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function safeJsonParse(s, fallback){ try{ return JSON.parse(s); } catch(e){ return fallback; } }
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

/* ========== SFX ========== */
class SFX {
  constructor(){ this.enabled = true; this.ctx = null; }
  _ctx(){ if(!this.ctx) this.ctx = new (window.AudioContext||window.webkitAudioContext)(); return this.ctx; }
  beep(freq=440, ms=90, type="sine", gain=0.05){
    if(!this.enabled) return;
    try{
      const ctx=this._ctx(); const o=ctx.createOscillator(); const g=ctx.createGain();
      o.type=type; o.frequency.value=freq; g.gain.value=gain; o.connect(g); g.connect(ctx.destination);
      o.start(); setTimeout(()=>o.stop(), ms);
    } catch(e) {}
  }
  click(){ this.beep(520, 45, "sine", 0.03); }
  ok(){ this.beep(660, 90, "triangle", 0.06); this.beep(880, 80, "triangle", 0.05); }
  bad(){ this.beep(220, 120, "sawtooth", 0.03); }
  boss(){ this.beep(392, 120, "square", 0.05); this.beep(523, 120, "square", 0.05); }
  levelup(){ this.beep(523, 120, "triangle", 0.06); this.beep(659, 120, "triangle", 0.06); this.beep(784, 140, "triangle", 0.06); }
}

/* ========== Questions ========== */
function q(opts){ return { id:"q_"+uid(), ...opts }; }

const QUESTION_BANK = [
  q({ type:"mcq", question:"A plant grows 2 cm each week. What is the independent variable?", choices:["height of plant","number of weeks","watering","sunlight"], correctIndex:1, explain:"Independent = input (time in weeks). Plant height depends on time.", skill:"context", tag:"confuse_var", difficulty:1 }),
  q({ type:"mcq", question:"A taxi charges $3 + $2 per mile. Which is dependent?", choices:["miles","cost","driver","time"], correctIndex:1, explain:"Cost depends on miles driven.", skill:"context", tag:"confuse_var", difficulty:1 }),
  q({ type:"mcq", question:"More people at party → more pizza needed. Input variable?", choices:["pizza","people","money","hunger"], correctIndex:1, explain:"People is input; pizza depends on that.", skill:"context", tag:"confuse_var", difficulty:1 }),
  q({ type:"mcq", question:"Temperature changes throughout the day. Time is:", choices:["dependent","independent","both","neither"], correctIndex:1, explain:"Time is the input (independent). Temperature depends on time.", skill:"context", tag:"confuse_var", difficulty:1 }),
  q({ type:"mcq", question:"Phone plan: $20 base + $5/GB. GB used is:", choices:["dependent","independent","constant","neither"], correctIndex:1, explain:"GB is the input (independent). Total cost depends on GB.", skill:"context", tag:"confuse_var", difficulty:2 }),
  q({ type:"mcq", question:"Test scores improve with study hours. Study hours is:", choices:["dependent","independent","outcome","effect"], correctIndex:1, explain:"Study hours = input. Scores = output/dependent.", skill:"context", tag:"confuse_var", difficulty:2 }),
  q({ type:"mcq", question:"Speed = distance/time. Distance depends on:", choices:["speed","time","direction","velocity"], correctIndex:1, explain:"In 'distance depends on time', time is independent.", skill:"context", tag:"confuse_var", difficulty:2 }),
  q({ type:"mcq", question:"Candy bars purchased vs total spent. Independent?", choices:["total spent","candy bars","candy price","time"], correctIndex:1, explain:"Bars purchased = input. Total spent = output.", skill:"context", tag:"confuse_var", difficulty:2 }),

  q({ type:"mcq_table", title:"Minutes Studying vs Pages Read", tableRows:[["Minutes","Pages"],["10","15"],["20","30"],["30","45"]], question:"Independent variable?", choices:["Minutes","Pages","Both","Time"], correctIndex:0, explain:"Minutes = input (x). Pages = output (y).", skill:"table", tag:"table_axis", difficulty:2 }),
  q({ type:"mcq_table", title:"Cups Sold vs Revenue", tableRows:[["Cups","$"],["5","7.50"],["10","15"],["20","30"]], question:"Which is dependent?", choices:["Cups","Revenue","Both","Store"], correctIndex:1, explain:"Revenue depends on cups sold.", skill:"table", tag:"table_axis", difficulty:2 }),
  q({ type:"mcq_table", title:"Games vs Points Earned", tableRows:[["Games","Points"],["1","100"],["2","250"],["3","450"]], question:"What depends on games?", choices:["Games","Points","Neither","Both"], correctIndex:1, explain:"Points depend on games played.", skill:"table", tag:"table_axis", difficulty:2 }),
  q({ type:"mcq_table", title:"Books Read vs Pages", tableRows:[["Books","Pages"],["1","320"],["2","640"],["3","960"]], question:"Independent?", choices:["Books","Pages","Neither","Unknown"], correctIndex:0, explain:"Books = input. Pages = output.", skill:"table", tag:"table_axis", difficulty:2 }),
  q({ type:"mcq_table", title:"Hours Worked vs Earnings", tableRows:[["Hours","Earnings"],["2","30"],["4","60"],["6","90"]], question:"Which changes because of the other?", choices:["Hours","Earnings","Both","Neither"], correctIndex:1, explain:"Earnings change based on hours worked.", skill:"table", tag:"table_axis", difficulty:2 }),
  q({ type:"mcq_table", title:"Temperature vs Time", tableRows:[["Hour","°C"],["8am","12"],["12pm","18"],["4pm","16"]], question:"Which is independent?", choices:["Temperature","Time","Both","Neither"], correctIndex:1, explain:"Time (hour) is input. Temperature depends on time.", skill:"table", tag:"table_axis", difficulty:2 }),
  q({ type:"mcq_table", title:"Discount (%) vs Sale Price", tableRows:[["Discount %","Price"],["10%","90"],["20%","80"],["30%","70"]], question:"Input variable?", choices:["Price","Discount","Store","Cost"], correctIndex:1, explain:"Discount % is input. Sale price is dependent.", skill:"table", tag:"table_axis", difficulty:2 }),

  q({ type:"mcq_equation", question:"In y = 3x + 5, which is independent?", equation:"y = 3x + 5", choices:["y","x","3","5"], correctIndex:1, explain:"x is the input (independent). y depends on x.", skill:"equation", tag:"eq_var", difficulty:2 }),
  q({ type:"mcq_equation", question:"In C = 2.5h (cost vs hours), dependent?", equation:"C = 2.5h", choices:["h","C","2.5","both"], correctIndex:1, explain:"C (cost) depends on h (hours).", skill:"equation", tag:"eq_var", difficulty:2 }),
  q({ type:"mcq_equation", question:"Rule: d = 60t. Which is independent?", equation:"d = 60t", choices:["d","t","60","neither"], correctIndex:1, explain:"t (time) is input. d (distance) is output.", skill:"equation", tag:"eq_var", difficulty:2 }),
  q({ type:"mcq_equation", question:"In p = 5n + 10, what does n represent?", equation:"p = 5n + 10", choices:["dependent output","independent input","constant","coefficient"], correctIndex:1, explain:"n is the variable input. p is dependent output.", skill:"equation", tag:"eq_var", difficulty:2 }),
  q({ type:"mcq_equation", question:"Formula: profit = 8x - 200. Profit is:", equation:"profit = 8x - 200", choices:["independent","dependent","constant","variable input"], correctIndex:1, explain:"Profit (output) depends on x (items sold, input).", skill:"equation", tag:"eq_var", difficulty:2 }),

  q({ type:"mcq_graph", title:"Distance vs Time", graphText:"y: Distance\n|\n|        *\n|     *\n|  *\n|*\n+---- x: Time", question:"Independent variable?", choices:["Distance","Time","Both","Neither"], correctIndex:1, explain:"x-axis = Time (independent). y-axis = Distance (dependent).", skill:"graph", tag:"graph_axis", difficulty:2 }),
  q({ type:"mcq_graph", title:"Cost vs Items", graphText:"y: Cost\n|    *\n|   *\n|  *\n| *\n|*\n+--- x: Items", question:"Which depends on the other?", choices:["Items depends on cost","Cost depends on items","Neither","Both"], correctIndex:1, explain:"Cost changes as items purchased changes.", skill:"graph", tag:"graph_axis", difficulty:2 }),
  q({ type:"mcq_graph", title:"Temperature vs Hours", graphText:"y: Temp\n|   * *\n|  *   *\n| *     *\n|*\n+---- x: Hours", question:"Independent variable?", choices:["Temperature","Hours","Celsius","Thermometer"], correctIndex:1, explain:"Hours is input (x-axis, independent).", skill:"graph", tag:"graph_axis", difficulty:2 }),

  q({ type:"drag_match", title:"Match: Independent vs Dependent", zoneLabels:["Independent (Input)","Dependent (Output)"], tokens:[
    {token:"What you choose/control", target:0}, {token:"What changes because input changes", target:1}, {token:"Number of people at party", target:0},
    {token:"Amount of pizza needed", target:1}, {token:"Your birthday", target:null}
  ], explain:"Independent = what you control. Dependent = what changes as result.", skill:"drag", tag:"confuse_var", difficulty:2 }),
  q({ type:"drag_match", title:"Sort: Cost depends on hours worked", zoneLabels:["Independent","Dependent"], tokens:[
    {token:"Hours worked", target:0}, {token:"Total cost", target:1}, {token:"Hourly wage", target:null}, {token:"Day of week", target:null}
  ], explain:"Hours = input. Cost = output.", skill:"drag", tag:"confuse_var", difficulty:2 }),
  q({ type:"drag_match", title:"Sort: Pages based on minutes", zoneLabels:["Independent","Dependent"], tokens:[
    {token:"Minutes", target:0}, {token:"Pages read", target:1}, {token:"Book title", target:null}, {token:"Font size", target:null}
  ], explain:"Minutes = input. Pages = output.", skill:"drag", tag:"confuse_var", difficulty:2 }),
  q({ type:"drag_match", title:"Sort: Revenue vs items sold", zoneLabels:["Independent","Dependent"], tokens:[
    {token:"Items sold", target:0}, {token:"Total revenue", target:1}, {token:"Store location", target:null}, {token:"Customer names", target:null}
  ], explain:"Items = input. Revenue = output.", skill:"drag", tag:"confuse_var", difficulty:2 }),
];

const MICRO_LESSONS = {
  confuse_var: { title:"Input vs Output", text:"Independent = INPUT (what you choose/change).\nDependent = OUTPUT (what changes as a result).\nTest: If you change X and Y changes, X is independent." },
  table_axis: { title:"Reading Tables", text:"First column = usually independent (input).\nOther columns = usually dependent (output).\nPay attention to column headers." },
  eq_var: { title:"Reading Equations", text:"Left side = dependent variable (y, C, p, etc).\nRight side = formula with independent variable (x, t, h, etc).\nDependent is left; independent is right." },
  graph_axis: { title:"Reading Graphs", text:"x-axis (horizontal) = usually independent.\ny-axis (vertical) = usually dependent.\nRemember: up/down depends on left/right." }
};

function makeScaffold(tag){
  if (tag === "confuse_var") {
    return q({ type:"mcq", question:"You pick 5 apples. Does the number change? What is input?", choices:["apples (output)","picking (input)","5 (constant)","tree"], correctIndex:1, explain:"The action (input) determines result (apples).", skill:"scaffold", tag, difficulty:1 });
  }
  if (tag === "table_axis") {
    return q({ type:"mcq_table", title:"Input/Output", tableRows:[["Input","Output"],["1","3"],["2","6"],["3","9"]], question:"First column is input?", choices:["Yes","No"], correctIndex:0, explain:"Input (left) leads to output (right).", skill:"scaffold", tag, difficulty:1 });
  }
  if (tag === "eq_var") {
    return q({ type:"mcq_equation", question:"In y = 2x, which is on left?", equation:"y = 2x", choices:["x","y"], correctIndex:1, explain:"Dependent (y) left. Independent (x) right.", skill:"scaffold", tag, difficulty:1 });
  }
  if (tag === "graph_axis") {
    return q({ type:"mcq_graph", title:"Axis Check", graphText:"y: vertical\n|\n| *\n|*\n+---- x: horizontal", question:"x is horizontal?", choices:["Yes","No"], correctIndex:0, explain:"x-axis left-to-right (horizontal, independent).", skill:"scaffold", tag, difficulty:1 });
  }
  return null;
}

const DEFAULT_SAVE = {
  version: CONFIG.VERSION,
  xp: 0, level: 1, coins: 0, streak: 0, attempts: 0, correct: 0,
  seen: {}, badges: [], skillWins: {}, errorProfile: {},
  recent: [], settings: { sfx:true, contrast:"auto" },
  lastPlayedAt: null, sessionCount: 0
};

function loadSave(){
  const raw = localStorage.getItem(CONFIG.SAVE_KEY);
  const data = safeJsonParse(raw, null);
  if (!data || typeof data !== "object") return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  const s = JSON.parse(JSON.stringify(DEFAULT_SAVE));
  for (const k of Object.keys(s)) if (k in data) s[k] = data[k];
  s.settings = { ...DEFAULT_SAVE.settings, ...(data.settings || {}) };
  s.skillWins = { ...(data.skillWins || {}) };
  s.errorProfile = { ...(data.errorProfile || {}) };
  s.badges = Array.isArray(data.badges) ? data.badges : [];
  s.seen = { ...(data.seen || {}) };
  s.recent = Array.isArray(data.recent) ? data.recent.slice(-CONFIG.RECENT_LOG_MAX) : [];
  return s;
}

function persistSave(save){
  save.lastPlayedAt = new Date().toISOString();
  localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(save));
}

function resetSave(){ localStorage.removeItem(CONFIG.SAVE_KEY); }
function computeAccuracy(save){ return save.attempts ? (save.correct / save.attempts) : 0; }
function levelFromXP(xp){ return Math.max(1, Math.floor(xp / CONFIG.LEVEL_UP_AT_XP) + 1); }

const MISSION_STAGES = [
  { key:"warmup", label:"Warm-Up" },
  { key:"sort", label:"Sort" },
  { key:"read", label:"Read" },
  { key:"boss", label:"Boss" },
  { key:"rewards", label:"Rewards" }
];

function pickLeastSeen(save, arr){
  let best = [];
  let bestCount = Infinity;
  for (const q of arr){
    const c = save.seen?.[q.id] ?? 0;
    if (c < bestCount){ bestCount = c; best = [q]; }
    else if (c === bestCount) best.push(q);
  }
  return best[Math.floor(Math.random() * best.length)];
}

function chooseQuestionForStage(save, stageKey){
  const acc = computeAccuracy(save);
  const level = levelFromXP(save.xp);
  const targetDifficulty = acc >= CONFIG.TARGET_ACC_FOR_HARDER ? clamp(level, 1, 3) : clamp(level - 1, 1, 2);

  let candidates = [];
  if (stageKey === "warmup") candidates = QUESTION_BANK.filter(q => q.type === "mcq" && (q.difficulty || 1) <= 1);
  else if (stageKey === "sort") candidates = QUESTION_BANK.filter(q => q.type === "drag_match");
  else if (stageKey === "read") candidates = QUESTION_BANK.filter(q => ["mcq_table","mcq_equation","mcq_graph"].includes(q.type));
  else candidates = QUESTION_BANK;

  const best = candidates.filter(q => Math.abs((q.difficulty || 1) - targetDifficulty) <= 1);
  return pickLeastSeen(save, best.length ? best : candidates);
}

/* ========== APP ========== */
class App {
  constructor(root){
    this.root = root;
    this.sfx = new SFX();
    this.save = loadSave();
    this.applySettings();
    this.state = this.freshState();
    this.render();
  }

  applySettings(){
    this.sfx.enabled = !!this.save.settings.sfx;
    const html = document.documentElement;
    if (this.save.settings.contrast === "high") html.setAttribute("data-contrast","high");
    else html.removeAttribute("data-contrast");
  }

  freshState(){
    return {
      scene: "menu", missionStageIndex: 0, currentQ: null, selection: null, feedback: null,
      floaters: [], drag: { heldTokenId: null, placements: {}, overZone: null },
      playerHP: 100, enemyHP: 100, enemyPhase: 1, battleFlash: false,
      microLesson: null, modal: null
    };
  }

  setScene(scene){
    this.state.scene = scene;
    this.state.selection = null;
    this.state.feedback = null;
    this.state.drag = { heldTokenId: null, placements: {}, overZone: null };
    this.state.microLesson = null;
    this.state.modal = null;
    if (scene !== "play") this.state.currentQ = null;
    this.render();
  }

  startRun(){
    this.sfx.click();
    this.state = this.freshState();
    this.state.scene = "play";
    this.state.missionStageIndex = 0;
    this.resetBattle();
    this.save.sessionCount = (this.save.sessionCount || 0) + 1;
    this.loadStageQuestion(true);
    persistSave(this.save);
    this.render();
  }

  resetBattle(){
    this.state.playerHP = 100;
    this.state.enemyHP = 100;
    this.state.enemyPhase = 1;
    this.state.battleFlash = false;
  }

  loadStageQuestion(fromStart=false){
    const stage = MISSION_STAGES[this.state.missionStageIndex]?.key;
    if (stage === "boss" || stage === "rewards"){
      if (stage === "rewards") this.state.currentQ = null;
      return;
    }
    const q = chooseQuestionForStage(this.save, stage);
    this.setCurrentQ(q, fromStart);
  }

  setCurrentQ(q, fromStart=false){
    this.state.currentQ = JSON.parse(JSON.stringify(q));
    if (this.state.currentQ?.type === "drag_match"){
      this.state.currentQ.tokens = this.state.currentQ.tokens.map(t => ({...t, _id: ("t_" + uid())}));
    }
    this.state.selection = null;
    this.state.feedback = null;
    this.state.drag = { heldTokenId: null, placements: {}, overZone: null };
    this.state.microLesson = null;
    this.state.modal = null;
    this.save.seen[q.id] = (this.save.seen[q.id] ?? 0) + 1;
    persistSave(this.save);
    if (!fromStart) this.render();
  }

  toggleSfx(){
    this.save.settings.sfx = !this.save.settings.sfx;
    persistSave(this.save);
    this.applySettings();
    this.render();
  }

  toggleHighContrast(){
    this.save.settings.contrast = (this.save.settings.contrast === "high") ? "auto" : "high";
    persistSave(this.save);
    this.applySettings();
    this.render();
  }

  nukeProgress(){
    resetSave();
    this.save = loadSave();
    this.applySettings();
    this.setScene("menu");
  }

  addFloater(text){
    this.state.floaters.push({ id: uid(), text });
    if (this.state.floaters.length > 5) this.state.floaters.shift();
  }

  logRecent(q, ok){
    const stage = MISSION_STAGES[this.state.missionStageIndex]?.key ?? "unknown";
    this.save.recent.push({ t: new Date().toISOString(), id: q.id, ok: !!ok, skill: q.skill || "misc", tag: q.tag || "none", stage });
    this.save.recent = this.save.recent.slice(-CONFIG.RECENT_LOG_MAX);
    persistSave(this.save);
  }

  awardCorrect(isBoss=false){
    const oldLevel = levelFromXP(this.save.xp);
    const xp = isBoss ? CONFIG.XP_BOSS : CONFIG.XP_CORRECT;
    const coins = isBoss ? CONFIG.COINS_BOSS : CONFIG.COINS_CORRECT;

    this.save.xp += xp;
    this.save.coins += coins;
    this.addFloater("+"+xp+" XP  •  +"+coins+" 🪙");

    this.save.streak += 1;
    if (this.save.streak > 0 && this.save.streak % CONFIG.STREAK_BONUS_AT === 0){
      this.save.xp += CONFIG.XP_STREAK_BONUS;
      this.save.coins += 15;
      this.addFloater("🔥 STREAK! +"+ CONFIG.XP_STREAK_BONUS +" XP");
      this.sfx.ok();
    }

    const newLevel = levelFromXP(this.save.xp);
    this.save.level = newLevel;
    if (newLevel > oldLevel) this.sfx.levelup();
    persistSave(this.save);
  }

  markAttempt(ok){
    this.save.attempts += 1;
    if (ok) this.save.correct += 1;
    if (!ok) this.save.streak = 0;
    persistSave(this.save);
  }

  recordSkillWin(q){
    const skill = q.skill || "misc";
    this.save.skillWins[skill] = (this.save.skillWins[skill] ?? 0) + 1;
    persistSave(this.save);
  }

  recordError(q){
    const tag = q.tag || "unknown";
    this.save.errorProfile[tag] = (this.save.errorProfile[tag] ?? 0) + 1;
    persistSave(this.save);
  }

  maybeInjectScaffold(q){
    const tag = q.tag;
    if (!tag) return null;
    const wrongs = this.save.errorProfile[tag] ?? 0;
    if (wrongs >= 2){
      return { microLesson: MICRO_LESSONS[tag] || null, scaffold: makeScaffold(tag) || null };
    }
    return null;
  }

  updateEnemyPhase(){
    const hp = this.state.enemyHP;
    this.state.enemyPhase = hp > 66 ? 1 : hp > 33 ? 2 : 3;
  }

  hitEnemy(){
    const dmg = this.state.enemyPhase === 1 ? 20 : this.state.enemyPhase === 2 ? 18 : 16;
    this.state.enemyHP = clamp(this.state.enemyHP - dmg, 0, 100);
    this.updateEnemyPhase();
  }

  enemyHitsYou(){
    const dmg = this.state.enemyPhase === 1 ? 10 : this.state.enemyPhase === 2 ? 13 : 16;
    this.state.playerHP = clamp(this.state.playerHP - dmg, 0, 100);
    if (this.state.playerHP <= 0){
      this.state.playerHP = 65;
      this.state.enemyHP = Math.max(25, this.state.enemyHP);
      this.addFloater("RECOVERY! +65 HP");
      this.sfx.boss();
    }
  }

  chooseMCQ(idx){
    if (this.state.feedback || this.state.modal) return;
    this.state.selection = idx;
    this.sfx.click();
    this.render();
  }

  submitMCQ(){
    const q = this.state.currentQ;
    if (!q || this.state.feedback || this.state.modal) return;
    if (this.state.selection === null) return;

    const ok = this.state.selection === q.correctIndex;
    this.markAttempt(ok);
    this.logRecent(q, ok);

    const stage = MISSION_STAGES[this.state.missionStageIndex]?.key;
    const isBoss = stage === "boss";

    if (ok){
      this.sfx.ok();
      this.awardCorrect(isBoss);
      this.recordSkillWin(q);
      if (isBoss) this.hitEnemy();
      this.state.feedback = { ok:true, title:"✓ Correct!", text:q.explain };
    } else {
      this.sfx.bad();
      this.recordError(q);
      if (isBoss) this.enemyHitsYou();
      const inject = this.maybeInjectScaffold(q);
      if (inject?.microLesson) this.state.microLesson = inject.microLesson;
      const correct = q.choices[q.correctIndex];
      this.state.feedback = { ok:false, title:"Try again", text:"Hint: "+q.explain+(inject?.scaffold ? "\n\nNext: Mini-challenge." : "") };
    }
    this.render();
  }

  continueAfterFeedback(){
    const q = this.state.currentQ;
    if (!q || !this.state.feedback) return;

    const stage = MISSION_STAGES[this.state.missionStageIndex]?.key;

    if (this.state.feedback.ok){
      this.advanceStage();
      return;
    }

    const inject = this.maybeInjectScaffold(q);
    if (inject?.scaffold){
      this.save.errorProfile[q.tag] = Math.max(0, (this.save.errorProfile[q.tag] ?? 0) - 1);
      persistSave(this.save);
      this.setCurrentQ(inject.scaffold);
      this.state.feedback = null;
    } else {
      this.state.selection = null;
      this.state.feedback = null;
    }
    this.render();
  }

  holdToken(tokenId){
    if (this.state.feedback || this.state.modal) return;
    this.state.drag.heldTokenId = tokenId;
    this.sfx.click();
    this.render();
  }

  placeToken(zoneIndex){
    const q = this.state.currentQ;
    if (!q || q.type !== "drag_match" || this.state.feedback) return;
    const held = this.state.drag.heldTokenId;
    if (!held) return;
    this.state.drag.placements[held] = zoneIndex;
    this.state.drag.heldTokenId = null;
    this.sfx.click();
    this.render();
  }

  submitDrag(){
    const q = this.state.currentQ;
    if (!q || q.type !== "drag_match" || this.state.feedback) return;

    let ok = true;
    for (const tok of q.tokens){
      const placed = this.state.drag.placements[tok._id];
      if (tok.target === null || tok.target === undefined){
        if (placed !== undefined) ok = false;
      } else {
        if (placed === undefined || placed !== tok.target) ok = false;
      }
    }

    this.markAttempt(ok);
    this.logRecent(q, ok);

    if (ok){
      this.sfx.ok();
      this.awardCorrect(false);
      this.recordSkillWin(q);
      this.state.feedback = { ok:true, title:"✓ Perfect!", text:q.explain };
    } else {
      this.sfx.bad();
      this.recordError(q);
      const inject = this.maybeInjectScaffold(q);
      if (inject?.microLesson) this.state.microLesson = inject.microLesson;
      this.state.feedback = { ok:false, title:"Try again", text:"Hint: "+q.explain+(inject?.scaffold ? "\n\nNext: Mini-challenge." : "") };
    }
    this.render();
  }

  clearPlacements(){
    this.state.drag = { heldTokenId: null, placements: {}, overZone: null };
    this.render();
  }

  advanceStage(){
    this.state.selection = null;
    this.state.feedback = null;
    this.state.microLesson = null;
    this.state.missionStageIndex = clamp(this.state.missionStageIndex + 1, 0, MISSION_STAGES.length - 1);

    const stage = MISSION_STAGES[this.state.missionStageIndex]?.key;
    if (stage === "boss"){
      this.resetBattle();
      this.sfx.boss();
      this.loadStageQuestion();
    } else if (stage === "rewards"){
      this.state.currentQ = null;
    } else {
      this.loadStageQuestion();
    }
    this.render();
  }

  startNextRun(){
    this.sfx.click();
    this.startRun();
  }

  buildReportText(){
    const acc = computeAccuracy(this.save);
    const lines = [];
    lines.push(CONFIG.APP_NAME + " — v" + CONFIG.VERSION);
    lines.push("Date: " + new Date().toLocaleString());
    lines.push("");
    lines.push("Attempts: " + this.save.attempts + " | Correct: " + this.save.correct + " | Accuracy: " + pct(acc) + "%");
    lines.push("XP: " + this.save.xp + " | Level: " + levelFromXP(this.save.xp) + " | Coins: " + this.save.coins + " | Streak: " + this.save.streak);
    lines.push("Sessions: " + this.save.sessionCount);
    lines.push("");
    lines.push("Skill Performance:");
    const skills = Object.entries(this.save.skillWins).sort((a,b)=>b[1]-a[1]);
    if (!skills.length) lines.push("—");
    else skills.forEach(([k,v])=>lines.push("- " + k + ": " + v + " wins"));
    lines.push("");
    lines.push("Common Errors:");
    const errs = Object.entries(this.save.errorProfile).sort((a,b)=>b[1]-a[1]).slice(0,6);
    if (!errs.length) lines.push("—");
    else errs.forEach(([k,v])=>lines.push("- " + k + ": " + v));
    lines.push("");
    lines.push("Recent Attempts:");
    const recent = this.save.recent.slice().reverse().slice(0,15);
    if (!recent.length) lines.push("—");
    else recent.forEach(r=>{
      const t = new Date(r.t).toLocaleString();
      lines.push("- " + t + " | " + (r.ok ? "✓" : "✗") + " | " + r.skill);
    });
    return lines.join("\n");
  }

  openSettings(){
    const sfx = this.save.settings.sfx ? "On" : "Off";
    const contrast = this.save.settings.contrast === "high" ? "High Contrast" : "Auto";
    const body = "SFX: " + sfx + "\nContrast: " + contrast + "\n\nClick any button below.";

    this.state.modal = {
      title: "Settings & Support",
      body,
      actions: [
        { key:"toggleSfx", label:"Toggle SFX", primary:false },
        { key:"toggleContrast", label:"Toggle Contrast", primary:false },
        { key:"copyReport", label:"Copy Teacher Report", primary:true },
        { key:"closeModal", label:"Close", primary:false }
      ]
    };
    this.render();
  }

  closeModal(){
    this.state.modal = null;
    this.render();
  }

  async copyReport(){
    const txt = this.buildReportText();
    try{
      await navigator.clipboard.writeText(txt);
      this.addFloater("Report copied!");
    } catch(e) {
      this.state.modal = {
        title: "Teacher Report (Copy Manually)",
        body: txt,
        actions: [{ key:"closeModal", label:"Close", primary:true }]
      };
    }
    persistSave(this.save);
    this.render();
  }

  render(){
    const s = this.save;
    const acc = computeAccuracy(s);
    const level = levelFromXP(s.xp);

    this.root.innerHTML = '<div class="shell">' +
      this.renderTopbar(level, acc) +
      '<main class="main">' +
      this.renderMenuScene() +
      this.renderPlayScene() +
      '</main>' +
      this.renderFooter() +
      this.renderModal() +
      '</div>';

    this.bindGlobal();
    if (this.state.scene === "play") this.bindDnD();
  }

  renderTopbar(level, acc){
    return '<header class="topbar">' +
      '<div class="brand">' +
      '<div class="logo">ƒ</div>' +
      '<div class="titleblock">' +
      '<div class="title">'+ CONFIG.APP_NAME +'</div>' +
      '<div class="sub">Premium v'+ CONFIG.VERSION +' • Grade 6</div>' +
      '</div></div>' +
      '<div class="hud">' +
      '<div class="pill"><span>Lvl</span> <b>'+ level +'</b></div>' +
      '<div class="pill"><span>XP</span> <b>'+ this.save.xp +'</b></div>' +
      '<div class="pill"><span>Coins</span> <b>'+ this.save.coins +'</b></div>' +
      '<div class="pill"><span>Acc</span> <b>'+ pct(acc) +'%</b></div>' +
      '<div class="pill"><span>🔥</span> <b>'+ this.save.streak +'</b></div>' +
      '<button class="btn secondary small" data-action="openSettings">Settings</button>' +
      '</div></header>';
  }

  renderMenuScene(){
    const played = this.save.lastPlayedAt ? new Date(this.save.lastPlayedAt).toLocaleString() : "Never";
    const badgesList = this.save.badges.length ? this.save.badges.map(b=>"🏅 "+escapeHtml(b)).join(" ") : "—";

    return '<section class="scene ' + (this.state.scene === "menu" ? "active" : "") + '" data-scene="menu">' +
      '<div class="grid cols2">' +
      '<div class="card">' +
      '<h2>Variables Lab: Premium Edition</h2>' +
      '<p>Master independent vs. dependent variables through context, tables, equations, graphs, and drag-match activities.</p>' +
      '<div style="height:12px"></div>' +
      '<div class="row">' +
      '<button class="btn teal" data-action="startRun">Start Mission</button>' +
      '<button class="btn secondary" data-action="howTo">How to Play</button>' +
      '<button class="btn ghost" data-action="reset">Reset All</button>' +
      '</div>' +
      '<div class="feedback" style="margin-top:12px;">' +
      '<div class="hdr">Quick Tip</div>' +
      '<div class="txt"><b>Independent</b> = input (what you choose). <b>Dependent</b> = output (what changes).</div>' +
      '</div></div>' +
      '<div class="card">' +
      '<h2>Your Progress</h2>' +
      '<p><b>Last played:</b> ' + played + '</p>' +
      '<p><b>Sessions:</b> ' + this.save.sessionCount + ' • <b>Attempts:</b> ' + this.save.attempts + '</p>' +
      '<div style="height:10px"></div>' +
      '<div class="feedback">' +
      '<div class="hdr">Badges (' + this.save.badges.length + ')</div>' +
      '<div class="txt">' + badgesList + '</div>' +
      '</div></div></div>' +
      '</section>';
  }

  renderPlayScene(){
    const stage = MISSION_STAGES[this.state.missionStageIndex]?.key;

    if (this.state.scene === "play" && !this.state.currentQ && stage !== "rewards" && !this.state.microLesson){
      this.loadStageQuestion(true);
    }

    return '<section class="scene ' + (this.state.scene === "play" ? "active" : "") + '" data-scene="play">' +
      this.renderMissionMap() +
      '<div style="height:10px"></div>' +
      (stage === "boss" ? this.renderBattlePanel() : "") +
      (stage === "rewards" ? this.renderRewards() : this.renderQuestion()) +
      '</section>';
  }

  renderMissionMap(){
    const idx = this.state.missionStageIndex;
    const nodes = MISSION_STAGES.map((s, i)=>{
      const cls = i < idx ? "node done" : i === idx ? "node active" : "node";
      return '<div class="' + cls + '"><span class="pip"></span>' + escapeHtml(s.label) + '</div>';
    }).join("");
    return '<div class="map">' + nodes + '</div>';
  }

  renderBattlePanel(){
    const p = this.state.playerHP;
    const e = this.state.enemyHP;
    return '<div class="card battle">' +
      '<div class="row" style="justify-content:space-between;">' +
      '<div><div style="font-weight:950;">🎯 Boss Battle: Defeat Neft Bot</div>' +
      '<div style="font-size:12px; color:var(--muted);">Phase ' + this.state.enemyPhase + ' • Correct answers deal damage</div></div>' +
      '<button class="btn secondary small" data-action="backToMenu">Menu</button>' +
      '</div>' +
      '<div><div style="font-size:12px; color:var(--muted); margin-bottom:4px;"><b>Your HP</b></div>' +
      '<div class="hpbar"><div class="hpfill" style="width:' + p + '%"></div></div></div>' +
      '<div><div style="font-size:12px; color:var(--muted); margin-bottom:4px;"><b>Enemy HP</b></div>' +
      '<div class="hpbar"><div class="hpfill enemy" style="width:' + e + '%"></div></div></div>' +
      '<div class="floaters">' +
      this.state.floaters.map((f, i)=>'<div class="floater" style="left:' + (i*8) + 'px">' + escapeHtml(f.text) + '</div>').join("") +
      '</div></div>';
  }

  renderRewards(){
    const acc = computeAccuracy(this.save);
    return '<div class="card">' +
      '<div class="prompt">' +
      '<div class="kicker">Mission Complete</div>' +
      '<div class="q">🏆 Rewards Claimed</div></div>' +
      '<div class="feedback ok">' +
      '<div class="hdr">Session Summary</div>' +
      '<div class="txt">💰 Coins: <b>' + this.save.coins + '</b> • ⚡ XP: <b>' + this.save.xp + '</b> • 📊 Accuracy: <b>' + pct(acc) + '%</b> • 🏅 Badges: <b>' + this.save.badges.length + '</b></div>' +
      '</div>' +
      '<div class="row" style="margin-top:12px;">' +
      '<button class="btn teal" data-action="nextRun">Next Mission</button>' +
      '<button class="btn secondary" data-action="backToMenu">Menu</button>' +
      '</div></div>';
  }

  renderQuestion(){
    const q = this.state.currentQ;

    if (this.state.microLesson){
      const ml = this.state.microLesson;
      return '<div class="card">' +
        '<div class="prompt"><div class="kicker">Support</div><div class="q">' + escapeHtml(ml.title) + '</div></div>' +
        '<div class="feedback"><div class="hdr">Mini-Lesson</div>' +
        '<div class="txt" style="white-space:pre-line;">' + escapeHtml(ml.text) + '</div></div>' +
        '<div class="row" style="margin-top:12px;">' +
        '<button class="btn teal" data-action="closeMicro">Continue</button></div></div>';
    }

    if (!q) return '<div class="card"><h2>Loading...</h2></div>';
    if (q.type === "drag_match") return this.renderDrag(q);
    return this.renderMCQFamily(q);
  }

  renderMCQFamily(q){
    const kicker = q.kicker || "Mission";
    const promptBody = escapeHtml(q.question || "Question");

    const extra = q.type === "mcq_table" ? this.renderTable(q)
      : q.type === "mcq_equation" ? this.renderEquation(q)
      : q.type === "mcq_graph" ? this.renderGraph(q)
      : "";

    return '<div class="card">' +
      '<div class="prompt"><div class="kicker">' + escapeHtml(kicker) + '</div><div class="q">' + promptBody + '</div></div>' +
      extra +
      '<div class="answers">' +
      q.choices.map((c,i)=>'<div class="choice ' + this.choiceClass(i,q) + '" data-action="chooseMCQ" data-idx="' + i + '">' + escapeHtml(c) + '</div>').join("") +
      '</div>' +
      this.renderActionRow() +
      this.renderFeedback() +
      '</div>';
  }

  renderTable(q){
    return '<div class="feedback"><div class="hdr">' + escapeHtml(q.title) + '</div><div class="txt" style="overflow:auto;">' +
      '<table style="width:100%; border-collapse:collapse; font-weight:900; font-size:13px;">' +
      q.tableRows.map((r,ri)=>'<tr>' +
        r.map(cell=>'<td style="border:2px solid rgba(0,0,0,.10); padding:8px; background:' + (ri===0 ? "rgba(0,150,136,.10)" : "transparent") + ';">' + escapeHtml(cell) + '</td>').join("") +
        '</tr>').join("") +
      '</table></div></div>';
  }

  renderEquation(q){
    return '<div class="feedback"><div class="hdr">Formula</div>' +
      '<div class="txt" style="font-weight:950; font-size:18px; color:var(--ink);">' + escapeHtml(q.equation) + '</div></div>';
  }

  renderGraph(q){
    return '<div class="feedback"><div class="hdr">' + escapeHtml(q.title) + '</div>' +
      '<div class="txt" style="font-family: var(--mono); white-space:pre; font-weight:900; font-size:12px;">' + escapeHtml(q.graphText) + '</div></div>';
  }

  renderDrag(q){
    const held = this.state.drag.heldTokenId;
    const zones = q.zoneLabels.map((label, zi)=>{
      const placedTokens = q.tokens
        .filter(t => this.state.drag.placements[t._id] === zi)
        .map(t => '<span class="placed">' + escapeHtml(t.token) + '</span>')
        .join("");
      const overCls = this.state.drag.overZone === zi ? "zone over" : "zone";
      return '<div class="' + overCls + '" data-action="placeZone" data-zone="' + zi + '">' +
        '<strong>' + escapeHtml(label) + '</strong>' +
        '<div class="slot">' + (placedTokens || '<span style="font-size:12px; color:var(--muted);">Drop</span>') + '</div></div>';
    }).join("");

    const bankTokens = q.tokens.map(t=>{
      const isPlaced = this.state.drag.placements[t._id] !== undefined;
      const selected = held === t._id;
      const cls = selected ? "token selected" : "token";
      return '<div class="' + cls + '" draggable="true" data-token="' + t._id + '" data-action="holdToken" ' +
        'style="' + (isPlaced ? "opacity:.35" : "") + '">' + escapeHtml(t.token) + '</div>';
    }).join("");

    return '<div class="card">' +
      '<div class="prompt"><div class="kicker">' + escapeHtml(q.kicker) + '</div><div class="q">' + escapeHtml(q.title) + '</div></div>' +
      '<div style="font-size:12px; color:var(--muted); margin-bottom:8px;"><b>Token Bank</b> — Drag or click token → click zone</div>' +
      '<div class="tokens">' + bankTokens + '</div>' +
      '<div style="font-size:12px; color:var(--muted); margin:12px 0 8px 0;"><b>Drop Zones</b> — Correct items only</div>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">' + zones + '</div>' +
      '<div class="row" style="margin-top:12px;">' +
      '<button class="btn coral" data-action="submitDrag">Check</button>' +
      '<button class="btn secondary" data-action="clearPlacements">Clear</button>' +
      '<button class="btn secondary" data-action="backToMenu">Menu</button></div>' +
      this.renderFeedback() + '</div>';
  }

  renderActionRow(){
    return '<div class="row" style="margin-top:12px;">' +
      (this.state.feedback ?
        '<button class="btn teal" data-action="continueAfterFeedback">' + (this.state.feedback.ok ? "Continue" : "Retry") + '</button>'
        : '<button class="btn coral" data-action="submitMCQ">Lock Answer</button><button class="btn secondary" data-action="backToMenu">Menu</button>') +
      '</div>';
  }

  renderFeedback(){
    const fb = this.state.feedback;
    if (!fb) return "";
    return '<div class="feedback ' + (fb.ok ? "ok" : "bad") + '">' +
      '<div class="hdr">' + escapeHtml(fb.title) + '</div>' +
      '<div class="txt" style="white-space:pre-line;">' + escapeHtml(fb.text) + '</div></div>';
  }

  renderFooter(){
    return '<div class="footer">' +
      '<div><b>Tip:</b> Independent = input. Dependent = output. On graphs: x = independent, y = dependent.</div>' +
      '<div><span>Keyboard:</span> <kbd>Tab</kbd> focus • <kbd>Enter</kbd> select</div></div>';
  }

  renderModal(){
    const m = this.state.modal;
    if (!m) return "";
    const actions = (m.actions || []).map(a=>{
      const cls = a.primary ? "btn teal" : "btn secondary";
      return '<button class="' + cls + '" data-action="modalAction" data-key="' + escapeHtml(a.key) + '">' + escapeHtml(a.label) + '</button>';
    }).join("");
    return '<div class="backdrop"><div class="modal">' +
      '<h3>' + escapeHtml(m.title) + '</h3>' +
      '<div class="feedback"><div class="txt" style="font-family:var(--mono); white-space:pre-wrap;">' + escapeHtml(m.body) + '</div></div>' +
      '<div class="row" style="margin-top:10px;">' + actions + '</div></div></div>';
  }

  choiceClass(i,q){
    const fb = this.state.feedback;
    if (!fb) return "";
    if (fb.ok) return i === q.correctIndex ? "correct" : "";
    if (i === q.correctIndex) return "correct";
    if (this.state.selection === i && i !== q.correctIndex) return "wrong";
    return "";
  }

  bindGlobal(){
    this.root.querySelectorAll("[data-action]").forEach(el=>{
      el.addEventListener("click", (e)=>{
        const act = el.getAttribute("data-action");
        const idx = el.getAttribute("data-idx");
        const token = el.getAttribute("data-token");
        const zone = el.getAttribute("data-zone");
        const key = el.getAttribute("data-key");
        this.dispatch(act, { idx, token, zone, key });
      });
    });
  }

  bindDnD(){
    const tokenEls = this.root.querySelectorAll(".token");
    const zoneEls = this.root.querySelectorAll(".zone");

    tokenEls.forEach(t=>{
      t.addEventListener("dragstart",(e)=>{
        const id = t.getAttribute("data-token");
        if (e.dataTransfer) e.dataTransfer.setData("text/plain", id);
        this.state.drag.heldTokenId = id;
      });
    });

    zoneEls.forEach(z=>{
      z.addEventListener("dragover",(e)=>{
        e.preventDefault();
        this.state.drag.overZone = Number(z.getAttribute("data-zone"));
      });
      z.addEventListener("dragleave",()=>{ this.state.drag.overZone = null; });
      z.addEventListener("drop",(e)=>{
        e.preventDefault();
        const id = e.dataTransfer?.getData("text/plain");
        const zi = Number(z.getAttribute("data-zone"));
        if (!id || Number.isNaN(zi)) return;
        this.state.drag.heldTokenId = id;
        this.placeToken(zi);
      });
    });
  }

  dispatch(action, payload){
    switch(action){
      case "startRun": return this.startRun();
      case "howTo":
        this.sfx.click();
        alert("PREMIUM MISSION RUN:\n\n1. Warm-Up (simple questions)\n2. Sort (drag-and-match)\n3. Read (tables, equations, graphs)\n4. Boss Battle (defeat enemy)\n5. Rewards\n\nTip: Independent = input\nDependent = output\n\nWrong answers → hints + support!");
        return;
      case "openSettings": this.sfx.click(); return this.openSettings();
      case "toggleSfx": return this.toggleSfx();
      case "toggleContrast": this.sfx.click(); return this.toggleHighContrast();
      case "reset": this.sfx.click(); if (confirm("Reset ALL progress?")) this.nukeProgress(); return;
      case "backToMenu": this.sfx.click(); return this.setScene("menu");
      case "nextRun": return this.startNextRun();
      case "chooseMCQ": return this.chooseMCQ(Number(payload.idx));
      case "submitMCQ": return this.submitMCQ();
      case "continueAfterFeedback": return this.continueAfterFeedback();
      case "holdToken": return this.holdToken(payload.token);
      case "placeZone": return this.placeToken(Number(payload.zone));
      case "submitDrag": return this.submitDrag();
      case "clearPlacements": return this.clearPlacements();
      case "closeMicro": this.sfx.click(); this.state.microLesson = null; this.render(); return;
      case "modalAction":
        if (payload.key === "copyReport") return this.copyReport();
        if (payload.key === "toggleSfx") return this.toggleSfx();
        if (payload.key === "toggleContrast") return this.toggleHighContrast();
        if (payload.key === "closeModal") return this.closeModal();
        return;
      default: return;
    }
  }
}

(function boot(){
  const root = document.getElementById("app");
  if (!root) { console.error("Root #app missing"); return; }
  root.innerHTML = "";
  new App(root);
})();
