/* The math cabinets power eleven different, persistent expedition puzzles.
 * Only the native game's solved counter can earn supplies; route actions never
 * write native scores or SCORM results. All art and progress stay on this device. */
(function () {
  'use strict';
  const ids = Object.keys(window.CabinetWorlds.worlds);
  const labels = ['A', 'B', 'C'];
  const targets = {factor:[30,84,90], fraction:[9,8,10], ratio:[[2,3,10],[3,2,10],[1,4,15]], percent:[[40,30,30],[50,20,30],[20,40,40]], expression:[20,10,14], volume:[12,24,36], coordinate:[[0,1],[2,2],[3,-1]]};
  const typeOf = id => ({'u1-decimal-dash':'decimal','u1-factor-frenzy':'factor','u2-fraction-frenzy':'fraction','u3-ratio-rush':'ratio','u4-percent-power':'percent','u5-area-attack':'area','u6-expression-express':'expression','u7-equation-quest':'equation','u8-data-dash':'data','u9-coordinate-quest':'coordinate','u10-volume-blast':'volume'})[id];
  function initial(type, chapter) {
    if(type === 'area') return Array(17).fill(0);
    if(type === 'factor') return [1];
    if(type === 'ratio' || type === 'expression') return [0,0];
    if(type === 'percent') return [0,0,0];
    if(type === 'equation') return [[2,6,14],[3,3,18],[4,8,32]][chapter].slice();
    if(type === 'data') return [0,0,0,0,0];
    if(type === 'coordinate') return [-3,-2];
    if(type === 'volume') return [1,1,1];
    return [0];
  }
  function validData(type, data, chapter) {
    if(!Array.isArray(data) || data.length!==initial(type,chapter).length || data.some(n=>!Number.isInteger(n)))return false;
    const limits={decimal:[0,10],factor:[1,90],fraction:[0,12],ratio:[0,15],percent:[0,100],area:[0,1],expression:[0,2],equation:[0,40],data:[0,5],coordinate:[-3,3],volume:[1,6]};
    const [low,high]=limits[type];
    if(data.some(n=>n<low||n>high))return false;
    if(type==='factor')return targets.factor[chapter]%data[0]===0;
    if(type==='percent')return data.every(n=>n%10===0)&&data.reduce((a,b)=>a+b,0)<=100;
    if(type==='data')return data.reduce((a,b)=>a+b,0)<=5;
    if(type==='equation')return data[0]>0;
    return true;
  }
  const areaCells = chapter => chapter === 0 ? Array.from({length:12},(_,i)=>i) : chapter === 1 ? [0,1,4,5,8,9,12,13] : [0,1,2,3,4,7,8,11,12,13,14,15];
  const barriers = chapter => [[[-1,-2],[-1,-1]],[[0,0],[1,0],[2,0]],[[1,-1],[1,0],[1,1]]][chapter];
  function expressionValue(data, chapter) {
    // Route A: bracket the first two cars; route B: multiplication first.
    const [a,b,c] = [[2,3,4],[2,3,4],[8,2,2]][chapter];
    const ops = [(x,y)=>x+y,(x,y)=>x*y,(x,y)=>x-y];
    return ops[data[1]](ops[data[0]](a,b),c);
  }
  function ready(type, data, chapter) {
    switch(type) {
      case 'decimal': return data[0] === [3,7,10][chapter];
      case 'factor': return data[0] === targets.factor[chapter];
      case 'fraction': return data[0] === targets.fraction[chapter];
      case 'ratio': {const [a,b,total]=targets.ratio[chapter];return data[0]+data[1]===total && data[0]*b===data[1]*a;}
      case 'percent': return data.every((n,i)=>n===targets.percent[chapter][i]);
      case 'area': return areaCells(chapter).every(i=>data[i]===1);
      case 'expression': return expressionValue(data,chapter)===targets.expression[chapter];
      case 'equation': return data[0]===1 && data[1]===0;
      case 'data': {const total=data.reduce((a,b)=>a+b,0);return total===5 && data.reduce((s,n,i)=>s+n*(i+1),0)===[15,20,10][chapter];}
      case 'coordinate': return data.every((n,i)=>n===targets.coordinate[chapter][i]);
      case 'volume': return data.reduce((a,b)=>a*b,1)===targets.volume[chapter];
      default:return false;
    }
  }
  function move(type, data, chapter, action) {
    const next=data.slice();let cost=1;
    const refuse=message=>({message});
    const arg=Number(action.split(':')[1]);
    switch(type) {
      case 'decimal':
        next[0]+=arg;
        if(next[0]<0 || next[0]>[3,7,10][chapter])return refuse('The beacon is ahead of the ship. Plan steps that land exactly on it. Undo is free.');
        break;
      case 'factor':
        next[0]*=arg;
        if(targets.factor[chapter]%next[0]!==0)return refuse('That prime will not divide the gate number. Try a prime factor of the remaining number.');
        break;
      case 'fraction':
        next[0]+=arg;
        if(next[0]>12)return refuse('The ballast tank holds 12 parts. Undo a fill before adding more.');
        break;
      case 'ratio': {
        const [,tank,amount]=action.split(':');next[Number(tank)]+=Number(amount);
        if(next[0]+next[1]>targets.ratio[chapter][2])return refuse('The reservoir is full. Undo a pour to change the mixture.');break;
      }
      case 'percent':
        next[arg]+=10;
        if(next.reduce((a,b)=>a+b,0)>100)return refuse('Only 100% energy is available. Undo a charge to reroute it.');break;
      case 'area': {
        if(action==='turn'){next[16]=1-next[16];cost=0;break;}
        const second=arg+(next[16]===0?1:4),allowed=areaCells(chapter);
        if((next[16]===0 && arg%4===3)||!allowed.includes(arg)||!allowed.includes(second)||next[arg]||next[second])return refuse('A 2-square terrace must fit completely on two empty garden squares. Rotate or choose another square.');
        next[arg]=next[second]=1;break;
      }
      case 'expression':next[arg]=(next[arg]+1)%3;break;
      case 'equation':
        if(action==='subtract'){
          if(next[1]===0)return refuse('The extra weight is already gone. Divide both sides by the number of x blocks.');
          next[2]-=next[1];next[1]=0;
        }else{
          if(next[1]!==0)return refuse('Remove the extra weight from BOTH sides before dividing the x blocks.');
          if(next[0]===1)return refuse('One x block is isolated. Open the bridge.');
          next[2]/=next[0];next[0]=1;
        }break;
      case 'data':
        if(next.reduce((a,b)=>a+b,0)>=5)return refuse('Five birds are assigned. Undo a placement to change the mean.');
        next[arg]++;break;
      case 'coordinate': {
        const [dx,dy]=({west:[-1,0],east:[1,0],north:[0,1],south:[0,-1]})[action]||[0,0];next[0]+=dx;next[1]+=dy;
        if(next.some(n=>n< -3 || n>3))return refuse('The rover must stay inside the survey grid.');
        if(barriers(chapter).some(([x,y])=>x===next[0] && y===next[1]))return refuse('A crater blocks that square. Choose another route.');break;
      }
      case 'volume':next[arg]++;if(next[arg]>6)return refuse('Each docking dimension must be 6 units or less. Undo to reshape the module.');break;
      default:return refuse('Choose a mission action.');
    }
    return {data:next,cost};
  }
  function objective(type, chapter) {
    switch(type) {
      case 'decimal':return `Fly to the beacon at ${([3,7,10][chapter]/10).toFixed(1)} km. Choose 0.1 or 0.3 km moves and land exactly.`;
      case 'factor':return `Forge a key with product ${targets.factor[chapter]}. Each crystal multiplies your key by a prime.`;
      case 'fraction':return `Set the submarine ballast to ${targets.fraction[chapter]}/12. Pour 1/12, 1/4, or 1/3 of a tank to match it.`;
      case 'ratio': {const [a,b,total]=targets.ratio[chapter];return `Mix sunlight seeds to water crystals in the ratio ${a}:${b}. The reservoir must hold exactly ${total} units.`;}
      case 'percent':return `Power the clinic, tram, and greenhouse with ${targets.percent[chapter].join('%, ')}% of the grid. Every charge routes 10%.`;
      case 'area':return 'Build the garden with 2-square terraces. Cover every marked square without overlaps or covering the water.';
      case 'expression':return `Set the two rail switches so the cargo expression equals ${targets.expression[chapter]}. The bracketed cars combine first.`;
      case 'equation':return 'Open the bridge by isolating one x block. Each move must keep both sides balanced.';
      case 'data':return `Place 5 birds at feeding sites 1–5 so their mean site number is ${[3,4,2][chapter]}. Several distributions can work.`;
      case 'coordinate':return `Reach relay (${targets.coordinate[chapter].join(', ')}). Move one square at a time and plan around the craters.`;
      case 'volume':return `Build a module of exactly ${targets.volume[chapter]} cubic units. Several length × width × height designs can work.`;
      default:return '';
    }
  }
  const button = (action,text) => `<button type="button" data-mission-action="${action}">${text}</button>`;
  function actions(type, data) {
    switch(type){
      case 'decimal':return button('step:1','Drift +0.1 km')+button('step:3','Glide +0.3 km');
      case 'factor':return [2,3,5,7].map(n=>button('prime:'+n,'Forge ×'+n)).join('');
      case 'fraction':return button('fill:1','Pour 1/12')+button('fill:3','Pour 1/4')+button('fill:4','Pour 1/3');
      case 'ratio':return button('pour:0:1','Seed +1')+button('pour:0:2','Seeds +2')+button('pour:1:1','Water +1')+button('pour:1:2','Water +2');
      case 'percent':return ['Clinic','Tram','Greenhouse'].map((n,i)=>button('charge:'+i,n+' +10%')).join('');
      case 'area':return button('turn',`Rotate terrace · ${data[16]===0?'horizontal':'vertical'}`);
      case 'expression':return button('switch:0','Switch A: '+['+','×','−'][data[0]])+button('switch:1','Switch B: '+['+','×','−'][data[1]]);
      case 'equation':return button('subtract','Subtract extra weight from both')+button('divide','Divide both sides by x count');
      case 'data':return [1,2,3,4,5].map(n=>button('bird:'+(n-1),'Site '+n)).join('');
      case 'coordinate':return button('west','← West')+button('north','↑ North')+button('south','↓ South')+button('east','East →');
      case 'volume':return ['Length','Width','Height'].map((n,i)=>button('dimension:'+i,n+' +1')).join('');
      default:return '';
    }
  }
  const text = (x,y,value,size=25,color='#ecf9ff') => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}" font-family="system-ui,sans-serif" font-weight="700">${value}</text>`;
  function diagram(type,d,c) {
    let svg='';
    switch(type) {
      case 'decimal':
        svg='<path d="M60 130H660" stroke="#95d7e8" stroke-width="3"/>';
        for(let i=0;i<=10;i++)svg+=`<path d="M${60+i*60} 122v20" stroke="#95d7e8"/>`+text(60+i*60,165,(i/10).toFixed(1),18);
        svg+=`<path d="M${60+[3,7,10][c]*60} 125v-68l30 10-30 12" stroke="#ffe29b" fill="#ffe29b"/>`;
        svg+=`<g transform="translate(${60+d[0]*60},85)"><ellipse rx="39" ry="20" fill="#e3bc86"/><path d="M-22 21h44l-10 15h-23z" fill="#77c9e2"/><path d="M-14 16v8m28-8v8" stroke="#e8f7ff" stroke-width="2"/></g>`+text(350,220,`Ship position ${(d[0]/10).toFixed(1)} km`,23);break;
      case 'factor':
        svg=`<path d="M220 230V70Q360-45 500 70v160" fill="#17323f" stroke="#ba9968" stroke-width="7"/><circle cx="360" cy="115" r="64" fill="#0c1d2b" stroke="#ffc779" stroke-width="3"/>`+text(360,125,d[0],42)+text(360,212,`Gate ${targets.factor[c]} · Remaining factor ${targets.factor[c]/d[0]}`,23);break;
      case 'fraction':
        svg='<rect x="150" y="40" width="420" height="130" rx="65" fill="#193f4c" stroke="#8bead8" stroke-width="4"/>';
        for(let i=0;i<12;i++)svg+=`<rect x="${182+i*30}" y="67" width="25" height="77" rx="5" fill="${i<d[0]?'#63eed8':'#071d2b'}"/>`;
        svg+='<circle cx="590" cy="104" r="24" fill="#17313e" stroke="#a9d9da" stroke-width="4"/>'+text(360,218,`Ballast ${d[0]}/12 of a tank`,24);break;
      case 'ratio':
        [0,1].forEach(i=>{svg+=`<rect x="${160+i*240}" y="35" width="160" height="150" rx="15" fill="#122f38" stroke="#8baeb2" stroke-width="3"/><rect x="${170+i*240}" y="${175-d[i]*8}" width="140" height="${d[i]*8}" rx="8" fill="${i?'#7bcfe9':'#ebd783'}"/>`+text(240+i*240,225,(i?'Water ':'Seeds ')+d[i],24);});break;
      case 'percent':
        d.forEach((n,i)=>{const x=130+i*230;svg+=`<rect x="${x-55}" y="45" width="110" height="150" rx="7" fill="#193544" stroke="#b3bd96" stroke-width="2"/>`;for(let j=0;j<10;j++)svg+=`<rect x="${x-43}" y="${177-j*13}" width="86" height="9" fill="${j<n/10?'#f8d877':'#365362'}"/>`;svg+=text(x,28,['CLINIC','TRAM','GARDEN'][i],17)+text(x,230,n+'%',25);});break;
      case 'area': {
        const allowed=areaCells(c);return `<div class="mission-terraces" role="group" aria-label="Garden construction grid">${Array.from({length:16},(_,i)=>`<button type="button" data-mission-action="cell:${i}" ${!allowed.includes(i)||d[i]?'disabled':''} aria-label="Row ${Math.floor(i/4)+1}, column ${i%4+1}: ${!allowed.includes(i)?'water':d[i]?'planted':'empty garden square'}" class="${!allowed.includes(i)?'water':d[i]?'planted':''}">${!allowed.includes(i)?'≈':d[i]?'✦':'+'}</button>`).join('')}</div>`;
      }
      case 'expression': {
        const n=[[2,3,4],[2,3,4],[8,2,2]][c],ops=['+','×','−'];
        svg='<path d="M35 165H685M35 180H685" stroke="#91a6a7" stroke-width="5"/>';
        [130,360,590].forEach((x,i)=>{svg+=`<rect x="${x-65}" y="60" width="130" height="90" rx="12" fill="#253f50" stroke="#ffb795" stroke-width="3"/><circle cx="${x-40}" cy="163" r="12" fill="#95b0b9"/><circle cx="${x+40}" cy="163" r="12" fill="#95b0b9"/>`+text(x,118,n[i],38);});
        svg+=text(245,120,ops[d[0]],35)+text(475,120,ops[d[1]],35)+text(360,225,`(${n[0]} ${ops[d[0]]} ${n[1]}) ${ops[d[1]]} ${n[2]} = ${expressionValue(d,c)}`,26);break;
      }
      case 'equation':
        svg='<path d="M360 65v150M170 65h380M190 65l-65 100h130zM530 65l-65 100h130z" fill="#274154" stroke="#c8b9ff" stroke-width="4"/><path d="M300 225l60-80 60 80z" fill="#617b8c"/>'+text(190,130,`${d[0]===1?'':d[0]}x${d[1]?' + '+d[1]:''}`,30)+text(530,130,d[2],32)+text(360,35,'Balanced on both sides',22);break;
      case 'data':
        for(let i=0;i<5;i++){const x=140+i*110;svg+=`<path d="M${x} 210v-130" stroke="#5a8f87" stroke-width="4"/>`+text(x,239,i+1,22);for(let j=0;j<d[i];j++)svg+=`<path d="M${x-21} ${192-j*31}q12-21 21-5q10-16 22 5q-23 16-43 0" fill="#cfebc5"/>`;}
        svg+=text(360,36,`${d.reduce((a,b)=>a+b,0)} / 5 birds assigned`,24);break;
      case 'coordinate':
        for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++){const px=210+(x+3)*50,py=25+(3-y)*31;const blocked=barriers(c).some(([a,b])=>a===x&&b===y);svg+=`<rect x="${px-22}" y="${py-13}" width="44" height="26" rx="4" fill="${blocked?'#835645':'#203f52'}" stroke="#577682"/>`;if(blocked)svg+=text(px,py+6,'×',20);if(targets.coordinate[c][0]===x&&targets.coordinate[c][1]===y)svg+=text(px,py+7,'⚑',23,'#ffe19b');if(d[0]===x&&d[1]===y)svg+=`<circle cx="${px}" cy="${py}" r="10" fill="#9bf0dc"/>`;}
        svg+=text(360,246,`Rover (${d.join(', ')}) · x → · y ↑`,23);break;
      case 'volume': {
        const [l,w,h]=d,s=26,x=340,y=185;svg=`<path d="M${x} ${y}l${l*s} ${-l*s/2}v${-h*s}l${-l*s} ${l*s/2}z" fill="#476e99" stroke="#b1d8fc" stroke-width="3"/><path d="M${x} ${y}l${-w*s} ${-w*s/2}v${-h*s}l${w*s} ${w*s/2}z" fill="#315477" stroke="#b1d8fc" stroke-width="3"/><path d="M${x} ${y-h*s}l${l*s} ${-l*s/2}l${-w*s} ${-w*s/2}l${-l*s} ${l*s/2}z" fill="#73a2b9" stroke="#b1d8fc" stroke-width="3"/>`+text(360,240,`${l} × ${w} × ${h} = ${l*w*h} cubic units`,25);break;
      }
    }
    const description=svg.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
    return `<svg viewBox="0 0 720 260" role="img" aria-label="${description || type + ' mission diagram'}">${svg}</svg>`;
  }
  function create({id,host,onView,storageId=id,title,chapters,artId=id}) {
    const sourceWorld=window.CabinetWorlds.worlds[artId],type=typeOf(id);
    const world=sourceWorld ? sourceWorld.slice() : null;
    if(world && title)world[1]=title;
    if(world && chapters)world[3]=chapters;
    if(!world || !host)return null;
    const key='ewl-cabinet-expedition-v1:'+storageId;
    let state={version:1,chapter:0,supplies:0,earned:0,data:initial(type,0),completed:0},history=[],message='Solve a math challenge to earn 4 supplies. Then choose how to use them in your expedition.',isOpen=false,saved=true,lastSolved=0;
    try {
      const stored=JSON.parse(localStorage.getItem(key));
      if(stored && stored.version===1 && Number.isInteger(stored.chapter) && stored.chapter>=0 && stored.chapter<=3 && ['supplies','earned','completed'].every(k=>Number.isInteger(stored[k])&&stored[k]>=0&&stored[k]<=99999) && validData(type,stored.data,Math.min(2,stored.chapter))) {
        state={version:1,chapter:stored.chapter,supplies:stored.supplies,earned:stored.earned,data:stored.data,completed:stored.completed};
        if(Array.isArray(stored.history))history=stored.history.slice(-50).filter(entry=>entry && (entry.cost===0||entry.cost===1) && validData(type,entry.data,Math.min(2,state.chapter)));
      }
    }catch(_error){saved=false;}
    const nav=document.createElement('nav');nav.className='mission-nav';nav.setAttribute('aria-label','Adventure views');
    nav.innerHTML=`<span class="mission-world-name">${world[1]}<small>Correct math earns 4 mission supplies</small></span><button type="button" data-view="math" aria-pressed="true">Math challenge</button><button type="button" data-view="mission" aria-pressed="false">Mission chart <span class="mission-nav-count"></span></button>`;
    host.before(nav);
    const root=document.createElement('section');root.className='cabinet-adventure';root.hidden=true;root.setAttribute('aria-label',world[1]+' mission');root.style.setProperty('--mission-accent',world[2]);host.append(root);
    const background=document.createElement('canvas');let imageChapter=-1,backgroundURL='';
    function save(){try{localStorage.setItem(key,JSON.stringify({...state,history:history.slice(-50)}));saved=true;}catch(_error){saved=false;}}
    function render() {
      const active=document.activeElement?.dataset.missionAction;
      const chapter=Math.min(state.chapter,2),done=state.chapter===3;
      if(imageChapter!==chapter){window.CabinetWorlds.paint(background,artId,chapter,true);backgroundURL=background.toDataURL();imageChapter=chapter;}
      nav.querySelector('.mission-nav-count').textContent=state.supplies+' supplies';
      nav.classList.toggle('mission-earned',state.supplies>0);
      root.innerHTML=`<div class="mission-world-art" aria-hidden="true" style="background-image:url(${backgroundURL})"></div><div class="mission-content"><header><div><p class="mission-kicker">${done?'EXPEDITION COMPLETE':'CHAPTER '+(chapter+1)+' / 3'} · ${world[1]}</p><h2>${done?'A world restored':world[3][chapter]}</h2></div><span class="mission-stock">${state.supplies}<small>supplies</small></span></header><ol class="mission-chapters" aria-label="Chapter progress">${world[3].map((n,i)=>`<li ${i===state.chapter?'aria-current="step"':''} class="${i<state.chapter?'complete':''}"><span>${i<state.chapter?'✓':i+1}</span>${n}</li>`).join('')}</ol><p class="mission-objective">${done?'You restored all three landmarks with your own mathematical decisions. Your expedition is saved on this device.':objective(type,chapter)}</p><div class="mission-diagram">${diagram(type,state.data,chapter)}</div><div class="mission-actions">${done?button('replay','Start another expedition'):actions(type,state.data)}</div><div class="mission-footer">${!done?button('undo','Undo · refund supply')+button('check','Activate landmark'):''}<button type="button" data-view="math">${state.supplies?'Return to math':'Earn supplies in math →'}</button></div><p class="mission-message" role="status" aria-live="polite">${message}</p><p class="mission-save">${saved?'Saved on this device':'Device storage unavailable · keep this page open'} · ${state.earned} math challenges solved · Each action costs 1 supply. Rotate and check are free.</p></div>`;
      const undo=root.querySelector('[data-mission-action="undo"]');if(undo)undo.disabled=history.length===0;
      if(active)root.querySelector(`[data-mission-action="${active}"]`)?.focus({preventScroll:true});
    }
    function show(open){
      if(window.GameStudio?.paused)return;
      isOpen=open;root.hidden=!open;host.classList.toggle('mission-open',open);
      const canvas=host.querySelector('canvas');if(canvas){canvas.setAttribute('aria-hidden',String(open));canvas.tabIndex=open?-1:0;}
      nav.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.view==='mission')===open)));
      onView?.(open);
      if(open){render();root.querySelector('button')?.focus({preventScroll:true});}else{canvas?.focus({preventScroll:true});}
    }
    function handle(action){
      if(window.GameStudio?.paused)return;
      if(action==='replay'){state.chapter=0;state.supplies=0;state.data=initial(type,0);state.completed++;history=[];message='A new expedition is ready. Solve math challenges to restock your supplies.';}
      else if(action==='undo'){
        const previous=history.pop();if(!previous)return;state.data=previous.data;state.supplies+=previous.cost;message='Move undone. Its supplies were returned. Try another plan.';
      }else if(action==='check'){
        if(!ready(type,state.data,state.chapter)){message='The landmark is not ready yet. Compare your design with the mission goal. You can undo any move.';render();return;}
        state.chapter++;history=[];message=state.chapter===3?'Expedition complete! All three landmarks are restored. Your mathematical choices made the difference.':'Landmark restored! Your remaining supplies carry into the next chapter.';
        if(state.chapter<3)state.data=initial(type,state.chapter);
        document.dispatchEvent(new CustomEvent('cabinet:landmark',{detail:{id,chapter:state.chapter}}));
      }else if(state.chapter<3){
        const result=move(type,state.data,state.chapter,action);
        if(!result.data){message=result.message;render();return;}
        if(result.cost>state.supplies){message='You need more supplies. Solve a math challenge to earn 4, then return to your saved mission.';render();return;}
        history.push({data:state.data.slice(),cost:result.cost});state.data=result.data;state.supplies-=result.cost;
        message=ready(type,state.data,state.chapter)?'Your design meets the goal. Activate the landmark to finish this chapter.':'Move complete. Plan your next step, or undo to try another route.';
      }
      save();render();
    }
    function click(event){const button=event.target.closest('button');if(!button)return;if(button.dataset.view)show(button.dataset.view==='mission');else if(button.dataset.missionAction)handle(button.dataset.missionAction);}
    nav.addEventListener('click',click);root.addEventListener('click',click);
    root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();show(false);}});
    function reward(){state.supplies=Math.min(99999,state.supplies+4);state.earned=Math.min(99999,state.earned+1);message='Challenge solved! +4 supplies. Your mission is ready when you are.';save();render();nav.classList.remove('mission-reward');void nav.offsetWidth;nav.classList.add('mission-reward');document.dispatchEvent(new CustomEvent('cabinet:supplies',{detail:{id,supplies:state.supplies}}));}
    render();
    return {reward,show,resetCounter(){lastSolved=0;},observeSolved(value){if(Number.isFinite(value)&&value>lastSolved){const count=Math.min(value-lastSolved,1);lastSolved=value;if(count)reward();}},getState(){return structuredClone(state);},get open(){return isOpen;},decorate(scene){
      const textureKey='cabinet-world-'+artId;
      if(!scene.textures.exists(textureKey)){const art=document.createElement('canvas');window.CabinetWorlds.paint(art,artId,0,false);scene.textures.addCanvas(textureKey,art);}
      const w=Number(scene.game.config.width),h=Number(scene.game.config.height);
      const backdrop=scene.children.list.find(o=>o.type==='Rectangle'&&o.width===w&&o.height===h&&o.alpha===1);
      if(backdrop)backdrop.setAlpha(0);
      scene.add.image(w/2,h/2,textureKey).setDisplaySize(w,h).setDepth(-100);
    }};
  }
  window.CabinetAdventure={create,rules:{initial,move,ready,objective,typeOf,validData,ids}};
})();
