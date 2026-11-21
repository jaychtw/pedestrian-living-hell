'use strict';
const $ = id => document.getElementById(id);
const canvas = $('scene'), ctx = canvas.getContext('2d');
const keys = new Set(), art = {};
const finish = 21, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const player = {x:0,z:0};
let mode='ready', time=0, look=0, stride=0, traffic=[], history=[], sampleAt=0, replayAt=0, culprit, previous=0, warning='', ready=false;
let zh=navigator.language.toLowerCase().startsWith('zh');
try {zh=(localStorage.getItem('plh2-lang') || (zh?'zh':'en'))==='zh'} catch {}
const t=(en,cn)=>zh?cn:en;
const profile = [
  // Lane depth, direction, starting position, speed, behavior.
  [3,1,-9,5,'taxi','obey'],[6,-1,17,6,'taxi','red'],
  [10,1,-8,4,'bus','obey'],[12,1,-18,7,'rider','pass'],
  [16,-1,10,5,'taxi','obey'],[19,-1,19,5,'rider','curb']
];
function reset(){
  Object.assign(player,{x:0,z:0});time=look=stride=sampleAt=0;history=[];keys.clear();
  traffic=profile.map(([z,dir,x,speed,kind,rule])=>({z,dir,x,speed,kind,rule,v:speed}));
  warning='';mode='play';ui();
}
function walkSignal(){return time%15<9}
function advice(rule){
  if(rule==='red')return t('A taxi kept moving through the red light. Check the second lane beyond the stopped traffic.','計程車闖紅燈。第一排車停下後，還要確認下一條車道。');
  if(rule==='pass')return t('A rider passed on the far side of the bus. Look beyond its front edge before stepping out.','機車從公車遠側鑽出。跨出前先觀察車頭另一側。');
  if(rule==='curb')return t('A scooter rode along the far sidewalk. Check the curb ramp before your final step.','機車騎上對面的人行道。走最後幾步前，先查看斜坡兩側。');
  return t('Moving traffic crossed your path. Check the pedestrian signal and allow the lane to clear.','車輛通過時擋住了去路。留意行人號誌，等車道淨空再走。');
}
function step(dt){
  time+=dt;
  const axis=(a,b)=>Number(keys.has(a))-Number(keys.has(b));
  const dx=axis('right','left'),dz=axis('forward','back'),len=Math.hypot(dx,dz)||1;
  player.x=clamp(player.x+dx/len*2.2*dt,-2,2);
  player.z=clamp(player.z+dz/len*2.4*dt,0,finish);
  stride+=(Math.abs(dx)+Math.abs(dz))*dt*7;
  look+=(axis('lookR','lookL')-look)*Math.min(1,dt*8);
  for(const car of traffic){
    const nose=car.x*car.dir+(car.kind==='bus'?2.7:1.5);
    const gap=-2.9-nose;
    const stopping=car.rule==='obey'&&walkSignal()&&gap>=-.05;
    const goal=stopping?Math.min(car.speed,Math.sqrt(6*Math.max(0,gap))):car.speed;
    car.v+=clamp(goal-car.v,-5*dt,3*dt);
    car.x+=car.dir*(stopping?Math.min(Math.max(0,gap),car.v*dt):car.v*dt);
    if(car.x*car.dir>24)car.x=-25*car.dir;
    if(car.rule==='curb')car.z=18.4+clamp((9-car.x)/6,0,1)*1.35;
  }
  if(time>=sampleAt){history.push({p:{...player},cars:traffic.map(c=>({x:c.x,z:c.z,kind:c.kind}))});if(history.length>26)history.shift();sampleAt=time+.08}
  culprit=traffic.find(c=>Math.abs(c.z-player.z)<(c.kind==='rider'?.48:.85)&&Math.abs(c.x-player.x)<(c.kind==='rider'?.78:c.kind==='bus'?2.7:1.55));
  if(culprit){mode='replay';replayAt=0;keys.clear();ui();return}
  if(player.z>=finish){mode='won';keys.clear();ui();return}
  const near=traffic.find(c=>c.v>.5&&Math.abs(c.z-player.z)<4.2&&Math.abs(c.x-player.x)<12&&(player.x-c.x)*c.dir>0);
  warning=near?(near.dir===1?t('Traffic approaching from the left','左側有來車'):t('Traffic approaching from the right','右側有來車')):'';
}
function labels(){
  return {forward:t('Forward','前進'),back:t('Back','後退'),left:t('Left','向左'),right:t('Right','向右'),lookL:t('Look left','往左看'),lookR:t('Look right','往右看')};
}
function ui(){
  document.documentElement.lang=zh?'zh-Hant':'en';
  $('back').textContent=t('← Modules','← 模組選單');$('lang').textContent=zh?'English':'繁體中文';
  $('pause').textContent=t('Pause','暫停');$('pause').hidden=mode!=='play';
  $('panel').hidden=mode==='play'||mode==='replay';
  $('kicker').textContent=t('MODULE 2  /  TAIPEI','模組 2  /  台北');
  $('title').textContent=({paused:t('Paused','已暫停'),won:t('Safely across','平安抵達'),lost:t('Crossing interrupted','過街中斷')})[mode]||t('Zhongxiao Crossing','忠孝路口');
  $('message').textContent=mode==='lost'?advice(culprit.rule):mode==='won'?t('Both feet are on the far sidewalk.','你已平安踏上對面的人行道。'):mode==='paused'?t('Continue from where you stopped.','從停下的位置繼續。'):t('Reach the far sidewalk unharmed. Watch the gaps beside stopped vehicles, even when the walk signal is green.','平安走到對面人行道。即使行人號誌是綠燈，也要留意停車旁的空隙。');
  $('action').textContent=mode==='paused'?t('Resume','繼續'):mode==='ready'?t('Step outside','開始過街'):t('Try another crossing','再走一次');
  $('hint').textContent=t('WASD or arrows to walk · Q / E to look · Release to stop · P to pause','WASD 或方向鍵移動 · Q / E 查看兩側 · 放開即停 · P 暫停');
  for(const b of $('pad').children){b.textContent=labels()[b.dataset.key];b.disabled=mode!=='play'}
  hud();
}
function hud(){
  $('signal').textContent=mode==='replay'?t('OVERHEAD REPLAY','俯視回放'):walkSignal()?t('● WALK','● 行人綠燈'):t('◆ WAIT','◆ 行人紅燈');
  $('signal').style.color=walkSignal()?'#a5ebc5':'#ffd397';
  $('distance').textContent=Math.ceil(finish-player.z)+t(' m to far sidewalk',' 公尺抵達對街');
  const cue=mode==='play'?warning:mode==='replay'?advice(culprit.rule):'';
  if($('cue').textContent!==cue)$('cue').textContent=cue;
}
function pause(){if(mode==='play'){mode='paused';keys.clear();ui();$('action').focus()}}
$('action').onclick=()=>{if(mode==='paused'){mode='play';ui()}else reset()};
$('pause').onclick=pause;
$('lang').onclick=()=>{zh=!zh;try{localStorage.setItem('plh2-lang',zh?'zh':'en')}catch{}ui()};
const bindings={w:'forward',arrowup:'forward',s:'back',arrowdown:'back',a:'left',arrowleft:'left',d:'right',arrowright:'right',q:'lookL',e:'lookR'};
onkeydown=e=>{const k=e.key.toLowerCase();if(k==='escape'||k==='p'){if(e.repeat)return;if(mode==='paused')$('action').click();else pause();return}if(mode==='play'&&bindings[k]){e.preventDefault();keys.add(bindings[k])}};
onkeyup=e=>keys.delete(bindings[e.key.toLowerCase()]);
onblur=pause;document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
for(const key of ['left','forward','back','right','lookL','lookR']){
  const b=document.createElement('button');b.dataset.key=key;$('pad').append(b);
  b.onpointerdown=e=>{if(mode==='play'){b.setPointerCapture(e.pointerId);keys.add(key)}};
  b.onlostpointercapture=b.onpointercancel=b.onpointerup=()=>keys.delete(key);
  b.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();keys.add(key)}};
  b.onkeyup=b.onblur=()=>keys.delete(key);
}
function drawScene(w,h){
  if(mode==='ready'){
    const pic=art.cover, scale=Math.max(w/pic.width,h/pic.height);
    ctx.drawImage(pic,(w-pic.width*scale)/2,(h-pic.height*scale)/2,pic.width*scale,pic.height*scale);return;
  }
  if(mode==='replay'||mode==='lost'){drawReplay(w,h);return}
  const horizon=h*.36, focal=Math.min(w*.9,h*1.4),camZ=player.z-3.2,camX=player.x*.75+.7;
  const van=w*.5-look*w*.27;
  function point(x,z){
    const depth=Math.max(.5,z-camZ);
    return {x:van+(x-camX)*focal/depth,y:horizon+h*2.15/depth,unit:focal/depth};
  }
  const skyW=Math.max(w*1.75,horizon*3.1);
  ctx.drawImage(art.avenue,(w-skyW)*.5-look*w*.12-player.x*3,0,skyW,horizon+4);
  const surface=ctx.createLinearGradient(0,horizon,0,h);surface.addColorStop(0,'#7e7980');surface.addColorStop(.38,'#605d60');surface.addColorStop(1,'#262c32');ctx.fillStyle=surface;ctx.fillRect(0,horizon,w,h);
  function band(z1,z2,x1,x2,color){
    if(z2<camZ+.6)return;
    const p=[point(x1,z1),point(x2,z1),point(x2,z2),point(x1,z2)];
    ctx.fillStyle=color;ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();
  }
  band(18,52,-100,100,'#918b83');band(17.85,18.1,-100,100,'#ded6c6');
  for(let z=18.5;z<45;z+=1.1)band(z,z+.02,-90,90,'#645e60');
  for(let z=1;z<18;z+=1.4)band(z,z+.63,-2.6,2.6,'#ded9cc');
  for(let z of [4.5,8,14])for(let x=-32;x<32;x+=5)band(z,z+.08,x,x+2.5,'#d6c6a3');
  ctx.save();ctx.globalAlpha=.15;ctx.fillStyle=ctx.createPattern(art.asphalt,'repeat');ctx.fillRect(0,horizon,w,h-horizon);ctx.restore();
  const actors=[...traffic,{...player,kind:'walker'}].sort((a,b)=>b.z-a.z);
  for(const a of actors){
    if(a.z<camZ+.65)continue;
    const p=point(a.x,a.z),pic=art[a.kind];
    if(a.kind==='walker'){
      const sh=h*.55,sw=sh*pic.width/pic.height;
      ctx.drawImage(pic,p.x-sw*.5,h-sh+Math.sin(stride)*2+4,sw,sh);continue;
    }
    const height=p.unit*({taxi:1.52,rider:1.68,bus:2.9})[a.kind],width=p.unit*({taxi:3.4,rider:1.5,bus:5.7})[a.kind];
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(a.dir,1);
    ctx.fillStyle='#171e2580';ctx.beginPath();ctx.ellipse(0,0,width*.5,Math.max(1,height*.07),0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.scale(1,-.32);ctx.globalAlpha=.16;ctx.drawImage(pic,-width/2,-height,width,height);ctx.restore();
    ctx.drawImage(pic,-width/2,-height,width,height);ctx.restore();
  }
}
function drawReplay(w,h){
  const frame=history[Math.min(history.length-1,Math.floor(replayAt/.12))];if(!frame)return;
  ctx.fillStyle='#25313a';ctx.fillRect(0,0,w,h);
  const sx=x=>w/2+x*w/32,sy=z=>h*.91-z*h*.04;
  ctx.fillStyle='#475254';ctx.fillRect(sx(-2.6),0,w*5.2/32,h);
  for(let z=1;z<18;z+=1.4){ctx.fillStyle='#9aa19d';ctx.fillRect(sx(-2.6),sy(z),w*5.2/32,3)}
  frame.cars.forEach((c,i)=>{ctx.fillStyle=traffic[i]===culprit?'#ffad70':'#a9b2b8';const width=w*(c.kind==='bus'?5.4:c.kind==='taxi'?3.1:1.55)/32;ctx.fillRect(sx(c.x)-width/2,sy(c.z)-5,width,10)});
  ctx.fillStyle='#bbffdc';ctx.beginPath();ctx.arc(sx(frame.p.x),sy(frame.p.z),7,0,Math.PI*2);ctx.fill();
}
function frame(now){
  const dt=Math.min((now-previous)/1000||0,.04);previous=now;
  if(mode==='play')step(dt);
  else if(mode==='replay'){replayAt+=dt;if(replayAt>history.length*.12+.5){mode='lost';ui();$('action').focus()}}
  const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
  ctx.setTransform(dpr,0,0,dpr,0,0);if(ready)drawScene(w,h);if(mode==='play'||mode==='replay')hud();
  requestAnimationFrame(frame);
}
ui();
Promise.all(['avenue','cover','asphalt','walker','bus','taxi','rider'].map(name=>new Promise((resolve,reject)=>{
  const im=new Image();im.onload=()=>{art[name]=im;resolve()};im.onerror=reject;im.src=name+'.webp';
}))).then(()=>{ready=true;$('action').disabled=false;requestAnimationFrame(frame)}).catch(()=>{$('message').textContent=t('Street artwork could not load. Reload this page to retry.','街景載入失敗，請重新整理頁面。')});
