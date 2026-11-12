'use strict';
const $=id=>document.getElementById(id);
let zh=false,muted=true;
try{zh=localStorage.getItem('plh2-lang')==='zh';muted=localStorage.getItem('plh2-sound')!=='on'}catch{}
const T=(en,tw)=>zh?tw:en;
const scenes=[
 {name:['The blocked arcade','被占用的騎樓'],mission:['Follow the amber marker right. Parked scooters block the tiles. Find a gap along the curb, then step back up.','往右走向橘色標記。機車擋住了騎樓，得等車流出現空檔，繞過後再走回人行道。'],start:[55,267],goal:[1030,268],blocks:[[335,235,525,302,'park'],[670,232,747,276,'box']]},
 {name:['The blind alley','巷口的死角'],mission:['Reach the far arcade. A delivery van hides the mouth of the alley. Watch for the headlight and listen for its engine.','走到右側騎樓。貨車擋住了巷口視線，留意車燈和引擎聲。'],start:[55,267],goal:[1030,268],blocks:[[430,277,558,324,'van'],[822,232,886,270,'box']]},
 {name:['One last turn','最後一個轉彎'],mission:['Reach the breakfast shop across the street. Follow the stripes. Even on green, check for the turning taxi.','沿斑馬線過馬路，到對面的早餐店。綠燈時也要留意轉彎的計程車。'],start:[236,419],goal:[724,258],blocks:[[0,389,501,398,'rail'],[642,389,1100,398,'rail'],[0,286,501,295,'rail'],[642,286,1100,295,'rail']]}
];
const keys=new Set(),touches=new Map(),near=new Set();
let mode='title',level=0,p={x:55,y:267},clock=0,walk=0,moving=false,facing=1,misses=0,retries=0,reason='',audioCtx,heard='',lastHint='';
const wrap=(a,n)=>(a%n+n)%n;
function vehicles(l,t){
 const out=[];
 const lane=(id,y,speed,period,offset,type)=>{const phase=t*speed+offset,span=period*Math.abs(speed);for(let k=-1;k<=Math.ceil(1100/span)+1;k++){let x=wrap(phase,span)+k*span;if(x>-100&&x<1200)out.push({id:id+'-'+(k-Math.floor(phase/span)),x,y,dir:Math.sign(speed),type})}};
 if(l<2){lane('curb',317,157,4.9,60,'scooter');lane('inner',355,-180,5.4,580,'car');lane('far',388,205,5.2,220,'taxi')}
 if(l===1){let u=wrap(t+1,6.6);if(u<2.8)out.push({id:'alley'+Math.floor((t+1)/6.6),x:547+Math.max(0,u-.55)*57,y:215+u*61,dir:1,type:'exit'})}
 if(l===2){const u=wrap(t,12);if(u<9){for(let i=0;i<3;i++){out.push({id:'cross'+i,x:1220-u*230+i*290,y:322,dir:-1,type:i===1?'scooter':'car'},{id:'back'+i,x:-130+u*225-i*260,y:369,dir:1,type:i===1?'car':'scooter'})}}
 const v=wrap(t+1,6);if(v<4.2)out.push({id:'turn'+Math.floor((t+1)/6),x:546+Math.max(0,v-1.2)**2*54,y:238+Math.min(1,v/2.25)*98,dir:1,type:'taxi'})}
 return out;
}
function radius(v){return ['scooter','exit'].includes(v.type)?[19,9]:[38,13]}
function blocked(x,y){return scenes[level].blocks.some(([a,b,c,d])=>x>a-6&&x<c+6&&y>b-3&&y<d+3)}
function sound(freq,duration=.14){if(muted||!audioCtx)return;const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(freq,audioCtx.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.65,audioCtx.currentTime+duration);gain.gain.setValueAtTime(.055,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);osc.connect(gain).connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+duration)}
function clearInput(){keys.clear();touches.clear();moving=false}
function begin(n,reset=false){if(!muted){try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume()}catch{muted=true}}if(reset){misses=0;retries=0}level=n;p={x:scenes[n].start[0],y:scenes[n].start[1]};clock=0;walk=0;near.clear();heard='';clearInput();mode='play';ui();$('pause').focus({preventScroll:true})}
function change(m){clearInput();mode=m;ui();if(['pause','hit','next','done'].includes(m))$('action').focus({preventScroll:true});if(m==='title')$('start').focus({preventScroll:true})}
function step(dt){if(mode!=='play')return;clock+=dt;let active=new Set([...keys,...touches.values()]),dx=Number(active.has('right'))-Number(active.has('left')),dy=Number(active.has('down'))-Number(active.has('up')),norm=Math.hypot(dx,dy)||1;
 let nx=Math.max(12,Math.min(1088,p.x+dx*106*dt/norm)),ny=Math.max(247,Math.min(424,p.y+dy*106*dt/norm)),ox=p.x,oy=p.y;
 if(!blocked(nx,p.y))p.x=nx;if(!blocked(p.x,ny))p.y=ny;moving=p.x!==ox||p.y!==oy;if(moving)walk+=dt*11;if(dx)facing=dx;
 for(const v of vehicles(level,clock)){const [rx,ry]=radius(v),ax=Math.abs(v.x-p.x),ay=Math.abs(v.y-p.y);if(ax<rx+4&&ay<ry+2){reason=v.type;retries++;sound(100,.32);change('hit');return}if(ax<rx+17&&ay<ry+11&&!near.has(v.id)){near.add(v.id);misses++;sound(320)}}
 const g=scenes[level].goal;if(Math.abs(g[0]-p.x)<23&&Math.abs(g[1]-p.y)<18){sound(630);change(level===2?'done':'next');return}
 if(level===1&&p.x>365&&p.x<660&&wrap(clock+1,6.6)<1.1){const id=String(Math.floor((clock+1)/6.6));if(heard!==id){heard=id;sound(190,.55)}}
 const percent=level===2?(Math.min(1,Math.max(0,(p.x-236)/310))*.4+Math.min(1,Math.max(0,(419-p.y)/161))*.6):(p.x-55)/975;
 $('progress').style.width=(100*(level+Math.min(1,Math.max(0,percent)))/3)+'%';
}
const arrows={ArrowRight:'right',ArrowLeft:'left',ArrowUp:'up',ArrowDown:'down',d:'right',a:'left',w:'up',s:'down'};
onkeydown=e=>{let k=e.key.length===1?e.key.toLowerCase():e.key;if(arrows[k]&&mode==='play'){e.preventDefault();keys.add(arrows[k])}if((k==='Escape'||k==='p')&&!e.repeat){if(mode==='pause')change('play');else if(mode==='play')change('pause')}};
onkeyup=e=>keys.delete(arrows[e.key.length===1?e.key.toLowerCase():e.key]);
onblur=()=>{if(mode==='play')change('pause')};document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')change('pause')});
for(const [dir,symbol] of Object.entries({left:'←',up:'↑',down:'↓',right:'→'})){let b=document.createElement('button');b.dataset.dir=dir;b.textContent=symbol;b.onpointerdown=e=>{if(mode!=='play')return;b.setPointerCapture(e.pointerId);touches.set(e.pointerId,dir)};b.onlostpointercapture=b.onpointerup=b.onpointercancel=e=>touches.delete(e.pointerId);$('pad').append(b)}
$('start').onclick=()=>begin(0,true);$('home').onclick=()=>{level=0;change('title')};$('action').onclick=()=>{if(mode==='pause')change('play');else if(mode==='next')begin(level+1);else if(mode==='hit')begin(level);else begin(0,true)};$('pause').onclick=()=>change('pause');
$('lang').onclick=()=>{zh=!zh;try{localStorage.setItem('plh2-lang',zh?'zh':'en')}catch{}ui()};
$('sound').onclick=()=>{muted=!muted;if(!muted){try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();sound(420)}catch{muted=true}}try{localStorage.setItem('plh2-sound',muted?'off':'on')}catch{}ui()};
function ui(){document.documentElement.lang=zh?'zh-Hant':'en';$('sound').textContent=muted?T('Sound off','音效關'):T('Sound on','音效開');$('lang').textContent=zh?'English':'繁中';$('pause').textContent=T('Pause','暫停');$('pause').hidden=mode!=='play';$('cover').hidden=mode!=='title';$('panel').hidden=['play','title'].includes(mode);$('pad').hidden=mode!=='play';$('title').innerHTML=T('Pedestrian<br>Living Hell','行人地獄');$('stamp').textContent=T('05:48  /  TAIWAN','05:48  /  臺灣');$('intro').textContent=T('The breakfast shop is three blocks away. The sidewalk ends long before that.','早餐店就在三個街口外。才走沒幾步，人行道就斷了。');$('start').textContent=T('Start the walk →','出門買早餐 →');$('chapter').textContent=mode==='title'?T('MORNING ROUTE','清晨路線'):('0'+(level+1)+' / 03');$('location').textContent=mode==='title'?T('The breakfast run','早餐路上'):T(...scenes[level].name);$('progress').style.width=(mode==='done'?100:mode==='next'?(level+1)*100/3:level*100/3)+'%';$('hint').textContent=mode==='title'?T('Move with arrow keys, WASD, or the on-screen arrows. Release to stand still.','使用方向鍵、WASD 或畫面箭頭移動。放開即停。'):T(...scenes[level].mission);$('edition').textContent=T('PEDESTRIAN LIVING HELL  /  2.0','行人地獄  /  2.0');$('source').textContent=T('Reporting behind the walk ↗','報導來源 ↗');$('world').setAttribute('aria-label',T('Street playfield','街道遊戲畫面'));[...$('pad').children].forEach((b,i)=>b.setAttribute('aria-label',zh?['往左','往上','往下','往右'][i]:'Move '+b.dataset.dir));
 const recap=T('You made it to the shop. Close calls: '+misses+' · Restarts: '+retries,'抵達早餐店。驚險擦身 '+misses+' 次・重新起步 '+retries+' 次');
 const data={pause:[T('Walk paused','步行暫停'),T(...scenes[level].mission),T('Resume','繼續')],hit:[T('A little too close','差了一步'),reason==='exit'?T('The scooter emerged from behind the van. Hold back from the alley mouth until it clears.','機車從貨車後方竄出。先在巷口前停一下，等車通過。'):reason==='taxi'&&level===2?T('The taxi turned through the crossing. Watch its front wheels before stepping out.','計程車轉進斑馬線。先看清楚車頭的動向，再往前走。'):T('Traffic reached your path. You can stop anywhere. Wait for the next opening.','車流經過了你的行進路線。隨時都可以停下，等下一個空檔。'),T('Retry this block','重走這個街口')],next:[T('Block cleared','走過一個街口'),T(...scenes[Math.min(2,level+1)].mission),T('Next block →','下一個街口 →')],done:[T('Breakfast is still warm.','早餐還熱著。'),recap,T('Walk again','再走一次')]};
 if(data[mode]){const [h,b,a]=data[mode];$('heading').textContent=h;$('body').textContent=b;$('action').textContent=a;$('tag').textContent=T(...scenes[level].name);$('home').textContent=T('Title screen','回標題畫面')}}
ui();
