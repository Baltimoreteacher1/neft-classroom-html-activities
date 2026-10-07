/* Original procedural environments: no network assets or animation loop required. */
(function () {
  'use strict';
  const worlds = {
    'u1-decimal-dash': ['sky', 'Cloudline Courier', '#75e0ff', ['Windward Post', 'Thunder Gap', 'Aurora Harbor']],
    'u1-factor-frenzy': ['forge', 'The Primekeeper', '#ffc779', ['Copper Gate', 'Crystal Gate', 'Heart of the Mountain']],
    'u2-fraction-frenzy': ['reef', 'Reef Rescue', '#63eed8', ['Kelp Nursery', 'Coral Cathedral', 'The Deep Garden']],
    'u3-ratio-rush': ['oasis', 'Oasis Engineers', '#a8ef93', ['Seedling Basin', 'Canopy Reservoir', 'The Living Oasis']],
    'u4-percent-power': ['city', 'Neon Grid', '#f8d877', ['Lantern Quarter', 'Skyline Transit', 'The Night Festival']],
    'u5-area-attack': ['garden', 'Terrace Architects', '#ccf589', ['River Terrace', 'Sunken Courtyard', 'The Hanging Garden']],
    'u6-expression-express': ['rail', 'Switchyard Odyssey', '#ffb795', ['Copper Junction', 'Canyon Crossing', 'Starlight Terminal']],
    'u7-equation-quest': ['bridge', 'Bridgekeepers', '#c8b9ff', ['Mosslight Crossing', 'The Floating Span', 'Citadel Bridge']],
    'u8-data-dash': ['wild', 'Wildlife Signal', '#a4dfb0', ['Heron Marsh', 'Foxwood Station', 'The Migration Observatory']],
    'u9-coordinate-quest': ['rover', 'Atlas Rover', '#ffb681', ['Dustfall Relay', 'Crater Beacon', 'The Lost Observatory']],
    'u10-volume-blast': ['orbit', 'Orbital Builders', '#a1c3ff', ['Supply Dock', 'Greenhouse Module', 'The New Station']]
  };
  function paint(canvas, id, chapter = 0, bright = false) {
    const world = worlds[id];
    if (!world) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 1000; canvas.height = 650;
    const [, , accent] = world;
    const gradient = ctx.createLinearGradient(0, 0, 0, 650);
    gradient.addColorStop(0, '#081727'); gradient.addColorStop(1, '#102f3f');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1000, 650);
    const poly = (points, color, line) => {
      ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); if (line) {ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.stroke();}
    };
    const rect = (x,y,w,h,c) => {ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    const circle = (x,y,r,c) => {ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();};
    const line = (points, color, width = 2) => {ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
    const pine = (x,y,s,c) => {rect(x-4*s,y,8*s,50*s,'#354449');poly([[x,y-100*s],[x-40*s,y+20*s],[x+40*s,y+20*s]],c);poly([[x,y-140*s],[x-30*s,y-25*s],[x+30*s,y-25*s]],c);};
    for(let i=0;i<55;i++)circle((i*173+31)%1000,(i*79+17)%350,(i%3+1)/2,'#a8d4e655');
    circle(800,115,60,accent+'16');circle(800,115,42,accent+'24');
    switch(world[0]) {
      case 'sky':
        for(let i=0;i<6;i++){const x=i*210-90,y=200+(i%3)*100;poly([[x,y],[x+130,y-18],[x+170,y+12],[x+86,y+115]],'#153e53','#3f8091');poly([[x,y],[x+80,y-35],[x+130,y-18],[x+170,y+12],[x+80,y+22]],'#327569');rect(x+70,y-65,18,48,'#6c8793');poly([[x+55,y-65],[x+96,y-65],[x+77,y-94]],accent);}
        for(let i=0;i<10;i++){circle(i*118,500+(i%3)*27,90,'#bddbe511');}
        line([[0,480],[270,380],[500,450],[780,365],[1000,390]],'#96b2be55',3);break;
      case 'forge':
        for(let i=0;i<8;i++){const x=i*150-20;poly([[x,0],[x+110,0],[x+65,170+(i%3)*55]],'#122d40','#2e4156');poly([[x,650],[x+135,650],[x+65,430-(i%2)*50]],'#102a38','#325063');}
        for(let i=0;i<6;i++){const x=i*185+25;poly([[x,500],[x+28,430],[x+48,470],[x+43,535]],i%2?'#446b82':'#447e87',accent+'66');}
        rect(385,260,230,310,'#193747');poly([[365,280],[500,175],[635,280]],'#285366','#7d977e');rect(435,335,130,235,'#091824');circle(500,405,32,accent+'66');break;
      case 'reef':
        for(let i=0;i<7;i++)poly([[80+i*140,0],[150+i*140,0],[40+i*140,650],[-80+i*140,650]],'#94f5f508');
        for(let i=0;i<16;i++){const x=i*73-30;line([[x,650],[x+20,565],[x-12,500],[x+14,430]],i%2?'#267679':'#25566f',12);line([[x+3,568],[x+45,520]],'#4d8685',7);circle(x+45,515,8,'#78b7af');}
        for(let i=0;i<12;i++){const x=(i*117)%1000,y=240+(i%5)*52;poly([[x,y],[x+25,y-10],[x+45,y],[x+25,y+10]],accent+'88');poly([[x+40,y],[x+55,y-11],[x+55,y+11]],accent+'88');}break;
      case 'oasis':
        poly([[0,350],[180,230],[450,380],[630,220],[1000,340],[1000,650],[0,650]],'#715744');poly([[0,475],[220,365],[500,445],[720,360],[1000,480],[1000,650],[0,650]],'#4a6051');
        ctx.fillStyle='#257a8b';ctx.beginPath();ctx.ellipse(490,520,320,95,0,0,Math.PI*2);ctx.fill();
        for(const x of [95,175,810,915]){line([[x,570],[x-10,310]],'#756c4f',15);for(let i=-2;i<=2;i++)line([[x-10,310],[x+i*36,285],[x+i*50,335]],'#438b64',14);}break;
      case 'city':
        for(let i=0;i<17;i++){const x=i*65,y=180+(i*97)%160;rect(x,y,52,650-y,'#18384c');rect(x+20,y-35,10,35,'#22465d');for(let j=0;j<8;j++)for(let k=0;k<3;k++)rect(x+7+k*15,y+18+j*35,7,13,(i+j+k+chapter)%3===0?accent+'aa':'#326278');}
        line([[0,565],[1000,565]],'#5f92b1',7);line([[0,600],[1000,600]],accent+'44',3);break;
      case 'garden':
        for(let i=0;i<4;i++){const x=100+i*170,y=530-i*65;poly([[x-100,y],[x+90,y-50],[x+240,y+10],[x+50,y+80]],'#244e4b','#6b9381');poly([[x-100,y],[x+50,y+80],[x+50,y+122],[x-100,y+42]],'#243941');poly([[x+50,y+80],[x+240,y+10],[x+240,y+52],[x+50,y+122]],'#30505a');for(let j=0;j<4;j++){circle(x+j*35,y-12,15,'#5a965f');circle(x+j*35,y-23,4,accent);}}
        line([[810,210],[800,470],[740,650]],'#6fc6d866',22);break;
      case 'rail':
        poly([[0,500],[130,245],[320,460],[510,200],[730,415],[930,250],[1000,500],[1000,650],[0,650]],'#3c3945');
        for(let i=0;i<8;i++){rect(i*150+40,430,20,220,'#416174');line([[i*150+20,435],[i*150+85,565]],'#395368',9);}
        line([[0,420],[1000,420]],accent+'aa',10);line([[0,450],[1000,450]],'#4b7187',8);for(let i=0;i<26;i++)rect(i*40,417,6,38,'#658490');
        rect(720,348,110,58,'#ae715d');rect(840,365,110,40,'#597a82');circle(750,410,12,'#09202d');circle(810,410,12,'#09202d');break;
      case 'bridge':
        for(const x of [30,880]){rect(x,280,85,370,'#304955');poly([[x-15,280],[x+42,175],[x+100,280]],'#556b78');rect(x+26,340,33,68,'#a7aa8466');}
        line([[70,290],[270,400],[500,450],[735,400],[930,290]],'#82a2a2',6);line([[70,530],[930,530]],'#536c76',18);for(let i=0;i<13;i++){const x=80+i*70;line([[x,310+130*Math.sin(i/12*Math.PI)],[x,530]],'#527181',4);}
        for(let i=0;i<9;i++)circle(i*150,680,150,'#193342');break;
      case 'wild':
        for(let i=0;i<15;i++)pine(i*80,460+(i%3)*45,.7+(i%3)*.2,i%2?'#1e5a51':'#2c6b60');
        poly([[200,500],[480,430],[620,480],[390,650],[80,650]],'#3b7c8666');rect(770,410,110,80,'#566254');poly([[755,410],[825,345],[895,410]],'#8a9775');for(let i=0;i<5;i++)line([[170+i*140,180],[183+i*140,170],[195+i*140,180]],'#bfdfcf',3);break;
      case 'rover':
        poly([[0,420],[120,235],[340,385],[600,235],[800,355],[1000,280],[1000,650],[0,650]],'#764b45');poly([[0,500],[280,410],[550,490],[800,425],[1000,510],[1000,650],[0,650]],'#8a5d50');
        for(let i=0;i<7;i++){ctx.fillStyle='#382d35';ctx.beginPath();ctx.ellipse(i*166+40,530+(i%2)*45,52,13,0,0,Math.PI*2);ctx.fill();}
        rect(750,360,90,44,'#aaa89a');circle(765,410,15,'#192d3a');circle(826,410,15,'#192d3a');line([[795,360],[795,300],[825,295]],'#b3c5bf',5);break;
      case 'orbit':
        circle(170,470,245,'#315986');circle(130,435,210,'#35728f');poly([[0,435],[160,410],[210,500],[330,495],[335,640],[0,650]],'#75a4a355');
        for(let i=0;i<3;i++){const x=530+i*135,y=295+(i%2)*45;rect(x,y,115,100,'#486579');rect(x+15,y+16,80,55,'#152d44');rect(x-10,y+30,10,35,'#88bdd2');}
        for(const x of [400,935]){rect(x,210,55,240,'#1a4b77');for(let j=0;j<8;j++)line([[x,210+j*30],[x+55,210+j*30]],'#71a7c7',2);}line([[400,335],[990,335]],'#809bab',6);break;
    }
    if(!bright){const shade=ctx.createLinearGradient(0,0,0,650);shade.addColorStop(0,'#06131dda');shade.addColorStop(.2,'#071522bf');shade.addColorStop(.55,'#07152255');shade.addColorStop(.9,'#071522b0');ctx.fillStyle=shade;ctx.fillRect(0,0,1000,650);}
  }
  window.CabinetWorlds = {worlds, paint};
})();
