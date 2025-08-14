/* Griff Is Back — tiny animation engine
   - Parallax background (Canvas)
   - Character rigs (SVG) with enter/exit/move/pose
   - TTS voiceover (MP3 fallback if provided in JSON)
   - Basic lip-sync ticks while speaking
   - Timeline from JSON (actions with time / duration)
*/

let STAGE, BG, CITY, CHARS, CAP, WHO, BAR;
let DPR = 1, W = 1920, H = 1080;
let sceneIdx = 0, actions = [], playing = false, t0 = 0, raf = 0;
let speechTimer = null, currentUtter = null;

function qs(id){ return document.getElementById(id); }
function fitCanvas(c){
  const r = c.getBoundingClientRect();
  c.width = r.width * DPR; c.height = r.height * DPR;
  const ctx = c.getContext('2d'); ctx.setTransform(DPR,0,0,DPR,0,0);
  return ctx;
}
function lerp(a,b,t){ return a+(b-a)*t; }
function ease(t){ return t<.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2; }

function drawBG(ctx, tint=[18,28,36]){
  const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height);
  g.addColorStop(0, `rgba(${tint[0]},${tint[1]},${tint[2]+10},1)`);
  g.addColorStop(1, '#000');
  ctx.fillStyle=g; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
}
function drawCity(ctx, t){
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  // far
  ctx.fillStyle='rgba(15,22,28,1)';
  for(let i=0;i<18;i++){
    const bw=60+Math.random()*140, bh=120+Math.random()*380;
    const x=((i*140 + (t*10))%(ctx.canvas.width+200))-200;
    const y=ctx.canvas.height-220-Math.random()*180;
    ctx.fillRect(x, y-bh, bw, bh);
  }
  // near
  ctx.fillStyle='rgba(20,28,36,1)';
  for(let i=0;i<12;i++){
    const bw=80+Math.random()*180, bh=180+Math.random()*440;
    const x=((i*220 + (t*20))%(ctx.canvas.width+220))-220;
    const y=ctx.canvas.height-140-Math.random()*80;
    ctx.fillRect(x, y-bh, bw, bh);
  }
  // windows
  for(let i=0;i<220;i++){
    const x=Math.random()*ctx.canvas.width, y=140+Math.random()*(ctx.canvas.height-260);
    if(Math.random()>.35){ ctx.fillStyle='rgba(255,164,60,.85)'; ctx.fillRect(x,y,2,6); }
  }
}

// Character rigs (very light SVG)
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
const cast = {}; // name -> DOM node

function setCaption(who,text){ WHO.textContent = who || '—'; CAP.textContent = text || ''; }
function progress(p){ BAR.style.width = (p*100).toFixed(2)+'%'; }

function say(who, text, mp3){
  setCaption(who,text);
  if (mp3){
    const a = new Audio(mp3);
    a.onended = ()=> lipSyncStop();
    a.play().catch(()=>{});
    lipSyncStart(who);
    return;
  }
  if (!window.speechSynthesis) return;
  try{
    const u = new SpeechSynthesisUtterance(text);
    const v = speechSynthesis.getVoices?.() || [];
    if (who==='Kevin')   u.voice = v.find(x=>/US|en-US/.test(x.lang)&&/Male|John|Justin|Matthew|Joey/i.test(x.name)) || v[0];
    else if (who==='Syleste') u.voice = v.find(x=>/US|en-US|en-GB/.test(x.lang)&&/Female|Amy|Joanna|Salli|Olivia/i.test(x.name)) || v[0];
    else u.voice = v.find(x=>/US|en-US/.test(x.lang)&&/Male|Guy|Matthew|Joey/i.test(x.name)) || v[0];
    u.rate=1.0; u.pitch = who==='Kevin'?0.9 : who==='Syleste'?1.1 : 1.0;
    u.onstart = ()=> lipSyncStart(who);
    u.onend   = ()=> lipSyncStop();
    currentUtter = u; speechSynthesis.speak(u);
  }catch(e){}
}
let lipT=null;
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
    const x = lerp(fromX, o.x, e);
    const s = lerp(fromS, o.scale??1, e);
    const a = lerp(fromO, o.opacity??1, e);
    n.style.left = x+'%';
    n.style.transform = `translateX(-50%) scale(${s})`;
    n.style.opacity = a;
    if (t<1) requestAnimationFrame(step);
  })();
}

function clearCast(){ CHARS.innerHTML=''; for(const k in cast) delete cast[k]; }

function cameraPan(ms=4000){
  // subtle parallax by redrawing city canvas with time base
  const cityCtx = CITY.getContext('2d');
  const tStart = performance.now();
  (function loop(){
    const t = (performance.now()-tStart)/1000;
    drawCity(cityCtx, t*8);
    if (performance.now()-tStart < ms) requestAnimationFrame(loop);
  })();
}

/* ====== Timeline runner ====== */
async function startEpisode(url){
  // DOM refs
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

  // first paint background
  drawBG(BG.getContext('2d'));
  drawCity(CITY.getContext('2d'), 0);
  CAP.textContent = data.title || '';

  // controls
  qs('play').onclick  = ()=> { playing=true; run(); };
  qs('pause').onclick = ()=> { playing=false; cancelAnimationFrame(raf); if(window.speechSynthesis){ try{speechSynthesis.cancel();}catch{} } };
  qs('next').onclick  = ()=> { jump(+1); };
  qs('prev').onclick  = ()=> { jump(-1); };

  // also auto-start on first pointer (mobile)
  window.addEventListener('pointerdown', function once(){ window.removeEventListener('pointerdown', once); playing=true; run(); }, {once:true});
}

function jump(dir){
  sceneIdx = Math.max(0, Math.min(actions.length-1, sceneIdx+dir));
  playing = true;
  run(true);
}

function run(skipDelay=false){
  cancelAnimationFrame(raf);
  if (sceneIdx >= actions.length){ playing=false; return; }
  const a = actions[sceneIdx];
  progress(sceneIdx/(actions.length));

  // perform action
  switch(a.type){
    case 'bg':   drawBG(BG.getContext('2d'), a.tint||[18,28,36]); break;
    case 'city': cameraPan(a.ms||4000); break;
    case 'enter': placeChar(a.name, a.x, a.scale||1, 0); tween({...a, opacity:1}); break;
    case 'move':  tween(a); break;
    case 'exit':  tween({...a, opacity:0}); break;
    case 'say':   setCaption(a.name,a.text); say(a.name, a.text, a.audio); break;
    case 'image': // full-screen still (e.g., poster or collage)
      const img = new Image(); img.onload=()=>{ const ctx=BG.getContext('2d'); ctx.drawImage(img,0,0,ctx.canvas.width,ctx.canvas.height); };
      img.src = a.src; setCaption(a.name||'', a.text||''); break;
  }

  // schedule next action
  const wait = skipDelay ? 100 : (a.wait||1600);
  setTimeout(()=>{ if(playing){ sceneIdx++; run(); } }, wait);
}
