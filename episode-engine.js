/* Griff Is Back — Character Rig Engine (v2)
   - Detailed SVG rigs for Griff, Kevin, Syleste
   - Per‑character colors, beanie/hat, hair
   - Moving, entering, exiting, posing, glove glow
   - Lip‑sync while speaking (TTS)
   - Scene background from images (bgImage)
*/

let BG,CITY,CHARS,CAP,WHO,BAR,DPR=1,sceneIdx=0,actions=[],playing=false,lipT=null;

const qs=id=>document.getElementById(id);
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

function fitCanvas(c){const r=c.getBoundingClientRect();c.width=r.width*(window.devicePixelRatio||1);c.height=r.height*(window.devicePixelRatio||1);const ctx=c.getContext('2d');ctx.setTransform(window.devicePixelRatio||1,0,0,window.devicePixelRatio||1,0,0);return ctx;}
function progress(p){BAR.style.width=(p*100).toFixed(2)+'%';}
function setCaption(who,text){WHO.textContent=who||'—';CAP.textContent=text||'';}

function drawBG(ctx,tint=[18,28,36]){const g=ctx.createLinearGradient(0,0,0,ctx.canvas.height);g.addColorStop(0,`rgba(${tint[0]},${tint[1]},${tint[2]+10},1)`);g.addColorStop(1,'#000');ctx.fillStyle=g;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);}
function drawCity(ctx,t){ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.fillStyle='rgba(15,22,28,1)';for(let i=0;i<18;i++){const bw=60+Math.random()*140,bh=120+Math.random()*380,x=((i*140+(t*10))%(ctx.canvas.width+220))-220,y=ctx.canvas.height-220-Math.random()*180;ctx.fillRect(x,y-bh,bw,bh);}
  ctx.fillStyle='rgba(20,28,36,1)';for(let i=0;i<12;i++){const bw=80+Math.random()*180,bh=180+Math.random()*440,x=((i*220+(t*20))%(ctx.canvas.width+260))-260,y=ctx.canvas.height-140-Math.random()*80;ctx.fillRect(x,y-bh,bw,bh);}
  for(let i=0;i<200;i++){const x=Math.random()*ctx.canvas.width,y=140+Math.random()*(ctx.canvas.height-260);if(Math.random()>.35){ctx.fillStyle='rgba(255,164,60,.85)';ctx.fillRect(x,y,2,6);}}
}
function pan(ms=4000){const ctx=CITY.getContext('2d');const t0=performance.now();(function loop(){const t=(performance.now()-t0)/1000;drawCity(ctx,t*8);if(performance.now()-t0<ms)requestAnimationFrame(loop);})();}
function bgImage(ctx,src){const img=new Image();img.onload=()=>{const cw=ctx.canvas.width,ch=ctx.canvas.height;const r=Math.max(cw/img.width,ch/img.height),w=img.width*r,h=img.height*r;ctx.clearRect(0,0,cw,ch);ctx.drawImage(img,(cw-w)/2,(ch-h)/2,w,h);};img.src=src;}

/* ====================== Character rigs ====================== */

const cast={};
function rigMarkup(name){
  // palettes
  const colors={
    Griff:{skin:'#7a4d2b', hood:'#0f1419', trim:'#ff6a00', beanie:'#ff6a00', glow:'rgba(0,230,208,.95)'},
    Kevin:{skin:'#e8c8b0', hood:'#1f2429', trim:'#b84b1f', beanie:'#6b2d12', glow:'rgba(255,138,64,.9)'},
    Syleste:{skin:'#4b2d1c', hood:'#101419', trim:'#00e6d0', beanie:'#0f0f0f', glow:'rgba(0,230,208,.95)'}
  }[name]||{skin:'#6d4b31', hood:'#12161b', trim:'#ff6a00', beanie:'#333', glow:'rgba(0,230,208,.9)'};

  // simple tattoo lines for Syleste
  const tattoos = name==='Syleste'
    ? `<path d="M110 260 q18 -12 38 0" stroke="#2ad8c0" stroke-width="3" fill="none" opacity=".6"/>
       <path d="M120 278 q22 -10 36 6" stroke="#2ad8c0" stroke-width="3" fill="none" opacity=".6"/>` : '';

  // hair
  const hair = name==='Griff'
    ? `<path d="M98 122 q52 -36 104 0 q-14 28 -92 28 q-10 -14 -12 -28z" fill="#0b0e10"/>`
    : name==='Syleste'
      ? `<path d="M90 120 q60 -40 120 0 q-6 36 -24 48 q-12 8 -72 6 q-14 -22 -24 -54z" fill="#0b0e10"/>`
      : `<path d="M96 124 q52 -28 104 0 q-8 20 -20 26 q-48 10 -88 -6 z" fill="#1b120c"/>`;

  // hat
  const hat = name==='Griff'
    ? `<path d="M88 132 q62 -38 124 0 q-4 18 -8 18 q-104 0 -108 -18z" fill="${colors.beanie}" />`
    : name==='Kevin'
      ? `<rect x="84" y="124" width="132" height="24" rx="6" fill="#3a3a3a"/><rect x="88" y="116" width="96" height="18" rx="4" fill="#a83b0f"/>`
      : '';

  // left/right arms separated so we can pose
  return `
  <svg viewBox="0 0 300 420" width="360" height="420" aria-label="${name}">
    <!-- body -->
    <path d="M30,390 Q10,240 90,180 Q150,140 210,180 Q290,240 270,390 Z" fill="${colors.hood}" />
    <!-- chest trim -->
    <path d="M90 200 h120 v12 h-120z" fill="${colors.trim}" opacity=".25"/>
    <!-- head -->
    <ellipse cx="150" cy="150" rx="52" ry="64" fill="${colors.skin}"/>
    ${hair}${hat}
    <!-- eyes -->
    <ellipse class="eyeL" cx="136" cy="160" rx="8" ry="6" fill="#ececec"/><ellipse class="eyeR" cx="164" cy="160" rx="8" ry="6" fill="#ececec"/>
    <!-- mouth -->
    <ellipse class="mouth" cx="150" cy="182" rx="14" ry="5" fill="#1b1b1b"/>
    <!-- tattoos (Syleste only) -->
    ${tattoos}
    <!-- arms -->
    <g class="armL" transform="rotate(0 110 260)">
      <path d="M96 240 q-16 26 12 44 q10 8 26 6 q-6 -30 -8 -50 z" fill="${colors.hood}"/>
    </g>
    <g class="armR" transform="rotate(0 206 260)">
      <path d="M204 240 q22 26 -6 48 q-10 6 -22 2 q6 -30 8 -50 z" fill="${colors.hood}"/>
      <!-- glowing glove -->
      <ellipse class="glove" cx="230" cy="260" rx="18" ry="24" fill="${colors.glow}" opacity="0"/>
    </g>
  </svg>`;
}

function rig(name){
  const el=document.createElement('div');
  el.className='char';
  el.style.cssText='position:absolute;bottom:2%;left:50%;transform:translateX(-50%) scale(1);opacity:0;filter:drop-shadow(0 12px 34px rgba(0,0,0,.6));will-change:transform,opacity;';
  el.dataset.name=name;
  el.innerHTML=rigMarkup(name);
  CHARS.appendChild(el);
  return el;
}
function ensure(name){ if(!cast[name]) cast[name]=rig(name); return cast[name]; }
function tween(node,to,ms=900){
  const from={x:parseFloat(node.style.left)||50, s:parseFloat((node.style.transform.match(/scale\(([^)]+)\)/)||[])[1]||1), o:parseFloat(node.style.opacity)||0};
  const t0=performance.now();
  (function step(){
    const t=Math.min(1,(performance.now()-t0)/ms); const e=ease(t);
    node.style.left=lerp(from.x,to.x??from.x,e)+'%';
    node.style.transform=`translateX(-50%) scale(${lerp(from.s,to.scale??from.s,e)})`;
    node.style.opacity=lerp(from.o,to.opacity??from.o,e);
    if(t<1) requestAnimationFrame(step);
  })();
}

function enter(name,x=50,scale=1){const n=ensure(name);n.style.opacity=0;n.style.left=x+'%';n.style.transform=`translateX(-50%) scale(${scale})`;tween(n,{opacity:1,x,scale},700);}
function exit(name,x=120){const n=ensure(name);tween(n,{opacity:0,x},600);}
function move(name,x=50,scale=1){const n=ensure(name);tween(n,{x,scale,opacity:1},800);}
function pose(name,arm='R',deg=0){const n=ensure(name);const g=n.querySelector(arm==='L'?'.armL':'.armR');g.setAttribute('transform',`rotate(${deg} ${arm==='L'?110:206} 260)`);}
function glove(name,on=true){const n=ensure(name);const g=n.querySelector('.glove');g.style.transition='opacity .18s ease, filter .18s ease';g.style.opacity=on?1:0;g.style.filter=on?'drop-shadow(0 0 22px rgba(0,230,208,.95))':'';}
function look(name,dx=0){const n=ensure(name);n.querySelector('.eyeL').setAttribute('cx',136+dx);n.querySelector('.eyeR').setAttribute('cx',164+dx);}

function say(who,text){
  setCaption(who,text);
  if(!('speechSynthesis'in window)) return;
  try{
    const u=new SpeechSynthesisUtterance(text);
    const vs=speechSynthesis.getVoices?.()||[];
    if(who==='Kevin'){u.pitch=.9;u.voice=vs.find(v=>/en-US/.test(v.lang)&&/Male|Matthew|Justin|Joey/i.test(v.name))||vs[0];}
    else if(who==='Syleste'){u.pitch=1.1;u.voice=vs.find(v=>/en|US|GB/.test(v.lang)&&/Female|Amy|Salli|Olivia|Joanna/i.test(v.name))||vs[0];}
    else {u.pitch=1.0;u.voice=vs.find(v=>/en-US/.test(v.lang)&&/Male|Guy|Matthew|Joey/i.test(v.name))||vs[0];}
    const m=ensure(who).querySelector('.mouth');
    clearInterval(lipT);
    u.onstart=()=>{lipT=setInterval(()=>{m.setAttribute('transform', Math.random()>.55?'scale(1,2.2) translate(0 -90)':'scale(1 1)');},70);};
    u.onend=()=>{clearInterval(lipT);m.removeAttribute('transform');};
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ====================== Runner ====================== */

function resolveSrc(s){ if(!s) return ''; if(s.startsWith('var:')){ const k=s.slice(4); return (globalThis||window)[k]||''; } return s; }

export async function startEpisode(url){
  BG=qs('bg'); CITY=qs('city'); CHARS=qs('chars'); CAP=qs('caption'); WHO=qs('who'); BAR=qs('bar');
  DPR=window.devicePixelRatio||1; fitCanvas(BG); fitCanvas(CITY);
  window.addEventListener('resize',()=>{ fitCanvas(BG); fitCanvas(CITY); drawBG(BG.getContext('2d')); });

  const data=await fetch(url,{cache:'no-store'}).then(r=>r.json());
  actions=data.timeline||[]; sceneIdx=0; playing=false; progress(0);
  drawBG(BG.getContext('2d')); drawCity(CITY.getContext('2d'),0);
  CAP.textContent=data.title||'';

  qs('play').onclick=()=>{playing=true; run();};
  qs('pause').onclick=()=>{playing=false; try{speechSynthesis.cancel();}catch{}};
  qs('next').onclick=()=>jump(1);
  qs('prev').onclick=()=>jump(-1);
  window.addEventListener('pointerdown',function once(){window.removeEventListener('pointerdown',once); playing=true; run();},{once:true});
}

function jump(d){ sceneIdx=Math.max(0,Math.min(actions.length-1,sceneIdx+d)); playing=true; run(true); }

function run(skip=false){
  if(sceneIdx>=actions.length){ playing=false; return; }
  const a=actions[sceneIdx];
  progress(sceneIdx/actions.length);

  switch(a.type){
    case 'bg': drawBG(BG.getContext('2d'), a.tint||[18,28,36]); break;
    case 'city': pan(a.ms||4200); break;
    case 'bgImage': bgImage(BG.getContext('2d'), resolveSrc(a.src)); break;

    case 'enter': enter(a.name,a.x??50,a.scale??1); break;
    case 'exit' : exit(a.name,a.x??120); break;
    case 'move' : move(a.name,a.x??50,a.scale??1); break;
    case 'pose' : pose(a.name,a.arm||'R', a.deg||0); break;
    case 'look' : look(a.name, a.dx||0); break;
    case 'glove': glove(a.name, a.on!==false); break;

    case 'say'  : say(a.name, a.text||''); break;

    case 'image': {
      const src=resolveSrc(a.src); if(!src){ setCaption(a.name||'', a.text||''); break; }
      const img=new Image(); img.onload=()=>{ const ctx=BG.getContext('2d'); const cw=ctx.canvas.width,ch=ctx.canvas.height; const r=Math.max(cw/img.width,ch/img.height),w=img.width*r,h=img.height*r; ctx.clearRect(0,0,cw,ch); ctx.drawImage(img,(cw-w)/2,(ch-h)/2,w,h); }; img.src=src;
      setCaption(a.name||'', a.text||'');
      break;
    }
  }

  const wait = skip ? 120 : (a.wait ?? 1600);
  setTimeout(()=>{ if(playing){ sceneIdx++; run(); } }, wait);
}

window.startEpisode=startEpisode;
