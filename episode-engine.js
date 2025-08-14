/* Griff Is Back — tiny animation engine (final)
   - Parallax background (Canvas)
   - Character rigs (SVG) with enter/exit/move/pose
   - TTS voiceover (click once to allow audio)
   - Image support: URL/data URI OR "var:IMG_NAME" to load from global variables
*/

let STAGE, BG, CITY, CHARS, CAP, WHO, BAR;
let DPR = 1;
let sceneIdx = 0, actions = [], playing = false, raf = 0;
let lipT = null;

const qs = id => document.getElementById(id);
const lerp = (a,b,t)=> a+(b-a)*t;
const ease = t => t<.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;

function fitCanvas(c){
  const r = c.getBoundingClientRect();
  c.width = r.width * DPR; c.height = r.height * DPR;
  const ctx = c.getContext('2d'); ctx.setTransform(DPR,0,0,DPR,0,0);
  return ctx;
}

function drawBG(ctx, tint=[18,28,36]){
  const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height);
  g.addColorStop(0, `rgba(${tint[0]},${tint[1]},${tint[2]+10},1)`);
  g.addColorStop(1, '#000');
  ctx.fillStyle=g; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
}
function drawCity(ctx, t){
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.fillStyle='rgba(15,22,28,1)';
  for(let i=0;i<18;i++){
    const bw=60+Math.random()*140, bh=120+Math.random()*380;
    const x=((i*140 + (t*10))%(ctx.canvas.width+200))-200;
    const y=ctx.canvas.height-220-Math.random()*180;
    ctx.fillRect(x, y-bh, bw, bh);
  }
  ctx.fillStyle='rgba(20,28,36,1)';
  for(let i=0;i<12;i++){
    const bw=80+Math.random()*180, bh=180+Math.random()*440;
    const x=((i*220 + (t*20))%(ctx.canvas.width+220))-220;
    const y=ctx.canvas.height-140-Math.random()*80;
    ctx.fillRect(x, y-bh, bw, bh);
  }
  for(let i=0;i<220;i++){
    const x=Math.random()*ctx.canvas.width, y=140+Math.random()*(ctx.canvas.height-260);
    if(Math.random()>.35){ ctx.fillStyle='rgba(255,164,60,.85)'; ctx.fillRect(x,y,2,6); }
  }
}

// Characters
function rig(name){
  const wrap = document.createElement('div');
  wrap.className='char';
  wrap.style.left='50%'; wrap.style.opacity='0'; wrap.dataset.name=name;
  wrap.innerHTML = `
  <svg viewBox="0 0 300 420" width="320" height="420" aria-label="${name}">
    <path d="M30,390 Q10,240 90,180 Q150,140 210,180 Q290,240 270,390 Z" fill="rgba(12,14,16,.95)"/>
    <ellipse cx="150" cy="150" rx="52" ry="64" fill="rgba(12,14,16,.96)"/>
    <ellipse class="mouth" cx="150" cy="182" rx="14" ry="5" fill="#111"/>
    <ellipse cx="230" cy="260" rx="18" ry="24" fill="rgba(0,230,208,.85)"/>
  </svg>`;
  CHARS.appendChild(wrap);
  return wrap;
}
const cast = {}; // name -> node
function setCaption(who,text){ (qs('who').textContent = who || '—'); (CAP.textContent = text || ''); }
function progress(p){ BAR.style.width = (p*100).toFixed(2)+'%'; }

function voiceFor(who){
  const v = speechSynthesis?.getVoices?.() || [];
  if(!v.length) return null;
  if(who==='Kevin')   return v.find(x=>/en-US|US/.test(x.lang)&&/Male|John|Justin|Matthew|Joey/i.test(x.name))||v[0];
  if(who==='Syleste') return v.find(x=>/en-US|en-GB/.test(x.lang)&&/Female|Amy|Joanna|Salli|Olivia/i.test(x.name))||v[0];
  return v.find(x=>/en-US|US/.test(x.lang)&&/Male|Guy|Matthew|Joey/i.test(x.name))||v[0];
}
function say(who, text){
  if(!('speechSynthesis' in window)) return;
  try{
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(who); if(v) u.voice=v;
    u.rate=1.0; u.pitch= who==='Kevin'?0.9 : who==='Syleste'?1.1 : 1.0;
    u.onstart = ()=> lipSyncStart(who);
    u.onend   = ()=> lipSyncStop();
    speechSynthesis.speak(u);
  }catch(e){}
}
function lipSyncStart(who){
  const m = CHARS.querySelector(`[data-name="${who}"] .mouth`);
  if(!m) return;
  clearInterval(lipT);
  lipT = setInterval(()=>{ m.setAttribute('transform', Math.random()>.55?'scale(1,2.2) translate(0 -90)':'scale(1 1)'); },70);
}
function lipSyncStop(){ clearInterval(lipT); lipT=null; }

function placeChar(name, xPct, scale=1, opacity=1){
  if(!cast[name]) cast[name] = rig(name);
  const n = cast[name];
  n.style.left = xPct+'%';
  n.style.transform = `translateX(-50%) scale(${scale})`;
  n.style.opacity = opacity;
}
function tween(o){
  const n = cast[o.name] || rig(o.name);
  const tStart = performance.now();
  const fromX = parseFloat(n.style.left) || 50;
  const fromS = parseFloat((n.style.transform.match(/scale\(([^)]+)\)/)||[])[1] || 1);
  const fromO = parseFloat(n.style.opacity || 0);
  (function step(){
    const t = Math.min(1, (performance.now()-tStart)/(o.dur||1000));
    const e = ease(t);
    n.style.left = lerp(fromX, o.x, e)+'%';
    n.style.transform = `translateX(-50%) scale(${lerp(fromS, o.scale??1, e)})`;
    n.style.opacity = lerp(fromO, o.opacity??1, e);
    if (t<1) requestAnimationFrame(step);
  })();
}
function clearCast(){ CHARS.innerHTML=''; for(const k in cast) delete cast[k]; }

function cameraPan(ms=4000){
  const ctx = CITY.getContext('2d');
  const tStart = performance.now();
  (function loop(){
    const t = (performance.now()-tStart)/1000;
    drawCity(ctx, t*8);
    if (performance.now()-tStart < ms) requestAnimationFrame(loop);
  })();
}

export async function startEpisode(url){
  // DOM
  STAGE = qs('stage'); BG = qs('bg'); CITY = qs('city'); CHARS = qs('chars');
  CAP = qs('caption'); WHO = qs('who'); BAR = qs('bar');
  DPR = window.devicePixelRatio || 1;
  fitCanvas(BG); fitCanvas(CITY);
  window.addEventListener('resize', ()=>{ fitCanvas(BG); fitCanvas(CITY); drawBG(BG.getContext('2d')); });

  // load timeline
  const res = await fetch(url, {cache:'no-store'});
  const data = await res.json();
  actions = data.timeline || [];
  sceneIdx = 0; playing = false; progress(0);

  drawBG(BG.getContext('2d'));
  drawCity(CITY.getContext('2d'), 0);
  CAP.textContent = data.title || '';

  qs('play').onclick  = ()=> { playing=true; run(); };
  qs('pause').onclick = ()=> { playing=false; cancelAnimationFrame(raf); if(window.speechSynthesis){ try{speechSynthesis.cancel();}catch{} } };
  qs('next').onclick  = ()=> jump(+1);
  qs('prev').onclick  = ()=> jump(-1);
  window.addEventListener('pointerdown', function once(){ window.removeEventListener('pointerdown', once); playing=true; run(); }, {once:true});
}

function jump(dir){
  sceneIdx = Math.max(0, Math.min(actions.length-1, sceneIdx+dir));
  playing = true;
  run(true);
}

function run(skipDelay=false){
  if (sceneIdx >= actions.length){ playing=false; return; }
  const a = actions[sceneIdx];
  progress(sceneIdx/(actions.length));

  switch(a.type){
    case 'bg':    drawBG(BG.getContext('2d'), a.tint||[18,28,36]); break;
    case 'city':  cameraPan(a.ms||4000); break;
    case 'enter': placeChar(a.name, a.x, a.scale||1, 0); tween({...a, opacity:1}); break;
    case 'move':  tween(a); break;
    case 'exit':  tween({...a, opacity:0}); break;
    case 'say':   setCaption(a.name,a.text); say(a.name, a.text); break;
    case 'image': {
      let src = a.src || '';
      if (src.startsWith('var:')) {
        const key = src.slice(4);
        src = (globalThis || window)[key] || '';
      }
      if (!src) { setCaption(a.name||'', a.text||''); break; }
      const img = new Image();
      img.onload=()=>{
        const ctx=BG.getContext('2d');
        const cw=ctx.canvas.width, ch=ctx.canvas.height;
        const r=Math.max(cw/img.width, ch/img.height);
        const w=img.width*r, h=img.height*r;
        ctx.clearRect(0,0,cw,ch);
        ctx.drawImage(img, (cw-w)/2, (ch-h)/2, w, h);
      };
      img.src = src;
      setCaption(a.name||'', a.text||'');
      break;
    }
  }

  const wait = skipDelay ? 120 : (a.wait||1600);
  setTimeout(()=>{ if(playing){ sceneIdx++; run(); } }, wait);
}
window.startEpisode = startEpisode;
