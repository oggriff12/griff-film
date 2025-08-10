/************************
 * GRIFF IS BACK — animation.js
 * Code-only cinematic visuals, Hulu-style hub, auth,
 * non-blocking audio + sound toggle, overlay show/hide,
 * and navigation to episode pages
 ************************/

/* ===== CONFIG ===== */
const SLIDE_MS = 15000;                // ms per slide (overlay player)
const EP_COUNTS = {1:7,2:7,3:7,4:6,5:6,6:6,7:6,8:6,9:6,10:6};
const HERO_EPISODES = [1,2,3,4,5];     // hero uses EP X Scene 1

// Short captions demo for overlay player
const CAPTIONS = {
  1:["Wilmington — blood on bricks.","More funerals than birthdays.","He walks alone, notebook tight.","Bus to Maryland.","Kevin the mechanic.","If the streets made me…","…maybe I can unmake myself."],
  2:["LA — masks on masks.","Trap vibes, bad friends.","Venice: Tariq returns.","Studio nights, pain fuels.","Open mic calling.","Buzz grows.","The voice gets loud."]
};

/* ===== DOM ===== */
const gridEpisodes = document.getElementById('row-episodes');
const gridFeatured = document.getElementById('row-featured');
const charsWrap    = document.getElementById('row-characters-wrap');
const gridChars    = document.getElementById('row-characters');

const heroImg  = document.getElementById('hero-img');
const heroDots = document.getElementById('hero-dots');
const heroPlay = document.getElementById('hero-play');
const heroEp1  = document.getElementById('hero-ep1');

const player   = document.getElementById('slideshow');   // overlay (hidden by default; we add .show)
const slideImg = document.getElementById('slide');
const captionEl= document.getElementById('caption');
const epLabel  = document.getElementById('ep-label');
const backBtn  = document.getElementById('back-button');
const pauseBtn = document.getElementById('pause-toggle');
const preloader= document.getElementById('preloader');

const audio       = document.getElementById('bg-music');
const soundToggle = document.getElementById('sound-toggle');

/* ===== NAV anchors (optional) ===== */
document.getElementById('menu-episodes')?.addEventListener('click', e=>{
  e.preventDefault(); document.querySelector('.row:nth-of-type(2)')?.scrollIntoView({behavior:'smooth'});
});
document.getElementById('menu-characters')?.addEventListener('click', e=>{
  e.preventDefault(); document.getElementById('row-characters-wrap')?.scrollIntoView({behavior:'smooth'});
});

/* ===== AUTH ===== */
function isAuthed(){ return window.netlifyIdentity && window.netlifyIdentity.currentUser(); }
function requireAuth(fn){ return (...args)=>{ if(!isAuthed()){ window.netlifyIdentity?.open('login'); return; } fn(...args); }; }

/* ============== CODE-ONLY CINEMATIC GENERATOR ============== */
const W = 1600, H = 900; // 16:9
const teal   = [0, 230, 208];
const orange = [255, 106, 0];
const EP_TINTS = {
  1:[18,28,36],  2:[22,18,30],  3:[12,22,28],  4:[26,20,16],  5:[16,16,28],
  6:[18,18,22],  7:[12,22,20],  8:[22,18,28],  9:[14,14,18], 10:[12,12,16]
};

const canvas = document.createElement('canvas');
canvas.width=W; canvas.height=H;
const ctx = canvas.getContext('2d');

function rgba([r,g,b],a){ return `rgba(${r},${g},${b},${a})`; }

function drawGradientSky(tint){
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, rgba([tint[0], tint[1], tint[2]+10], 1));
  g.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
}
function drawCityline(){
  ctx.fillStyle = 'rgba(15,22,28,1)';
  for(let i=0;i<18;i++){
    const bw = 60 + Math.random()*140, bh = 120 + Math.random()*380;
    const x  = Math.random()*(W+bw)-bw, y  = H-220 - Math.random()*180;
    ctx.fillRect(x, y-bh, bw, bh);
  }
  ctx.fillStyle = 'rgba(20,28,36,1)';
  for(let i=0;i<12;i++){
    const bw = 80 + Math.random()*180, bh = 180 + Math.random()*440;
    const x  = Math.random()*(W+bw)-bw, y  = H-140 - Math.random()*80;
    ctx.fillRect(x, y-bh, bw, bh);
  }
  for(let i=0;i<280;i++){
    const x = Math.random()*W, y = 140 + Math.random()*(H-260);
    if(Math.random()>.35){ ctx.fillStyle='rgba(255,164,60,.9)'; ctx.fillRect(x,y,3,7); }
  }
}
function drawHoodedSilhouette(){
  ctx.save(); ctx.translate(W*0.52, H*0.62);
  ctx.fillStyle='rgba(10,12,14,.95)';
  ctx.beginPath();
  ctx.moveTo(-180,180); ctx.quadraticCurveTo(-200,40,-80,-40);
  ctx.quadraticCurveTo(0,-80,80,-40);
  ctx.quadraticCurveTo(200,40,180,180);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-90,70,80,0,0,Math.PI*2); ctx.fill();
  ctx.shadowColor=rgba(teal,0.9); ctx.shadowBlur=40;
  ctx.fillStyle=rgba(teal,0.85);
  ctx.beginPath(); ctx.ellipse(140,40,28,36,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function drawNeonTitle(ep, scene, subtitle){
  // GRIFF
  ctx.save();
  ctx.shadowColor=rgba(orange,0.9); ctx.shadowBlur=28;
  ctx.fillStyle=rgba(orange,0.95);
  ctx.font='900 160px system-ui,Segoe UI,Inter,Arial';
  ctx.textAlign='left'; ctx.textBaseline='top';
  ctx.fillText('GRIFF', 70, 40);
  ctx.restore();
  // IS BACK
  ctx.save();
  ctx.shadowColor=rgba(teal,0.9); ctx.shadowBlur=26;
  ctx.fillStyle=rgba(teal,0.95);
  ctx.font='900 96px system-ui,Segoe UI,Inter,Arial';
  ctx.fillText('IS BACK', 75, 170);
  ctx.restore();
  // plaque
  ctx.fillStyle='rgba(14,22,28,.9)';
  ctx.fillRect(W-360, 110, 300, 64);
  ctx.fillStyle='rgba(220,230,235,.95)';
  ctx.font='700 30px system-ui,Segoe UI,Inter,Arial';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  const tag = (ep===1? 'WILMINGTON  DELAWARE' : `EP ${ep}  •  SCENE ${scene}`);
  ctx.fillText(tag, W-360+150, 110+32);
  // subtitle
  if (subtitle){
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.font='600 42px system-ui,Segoe UI,Inter,Arial';
    ctx.fillStyle='rgba(240,240,240,.95)';
    ctx.shadowColor='rgba(0,0,0,.65)'; ctx.shadowBlur=16;
    ctx.fillText(subtitle, W/2, H-28);
    ctx.shadowBlur=0;
  }
}
function addSpeckles(){
  for(let i=0;i<260;i++){
    const x = Math.random()*W, y = Math.random()*H*0.65;
    const c = Math.random()<.5 ? teal : orange;
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.random()*.8})`;
    ctx.fillRect(x, y, 2, 2+Math.random()*3);
  }
}
function addVignette(){
  const g = ctx.createRadialGradient(W/2,H/2, H*0.2, W/2,H/2, H*0.8);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(1,'rgba(0,0,0,.55)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
}
function generateSlide(ep, scene, subtitle=''){
  const tint = EP_TINTS[ep] || [18,28,36];
  drawGradientSky(tint);
  drawCityline();
  drawHoodedSilhouette();
  addSpeckles();
  drawNeonTitle(ep, scene, subtitle);
  addVignette();
  return canvas.toDataURL('image/png');
}
function genThumb(ep){ return generateSlide(ep, 1, '— Thumbnail —'); }

/* ===== HERO CAROUSEL ===== */
let heroIdx = 0, heroTimer=null;
function buildHero(){
  heroDots.innerHTML = '';
  HERO_EPISODES.forEach((_,i)=>{
    const dot=document.createElement('div');
    dot.className='dot'+(i===0?' active':'');
    dot.addEventListener('click',()=>showHero(i,true));
    heroDots.appendChild(dot);
  });
  showHero(0);
  if(heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(()=> showHero((heroIdx+1)%HERO_EPISODES.length), 6000);

  // UPDATED: navigate to episode page
  heroPlay.onclick = requireAuth(() => { window.location.href = 'episode1.html'; });
  heroEp1.onclick  = requireAuth(() => { window.location.href = 'episode1.html'; });
}
function showHero(idx, stopAuto=false){
  heroIdx = idx;
  const ep = HERO_EPISODES[idx];
  heroImg.src = genThumb(ep);
  [...heroDots.children].forEach((d,i)=>d.classList.toggle('active', i===idx));
  if (stopAuto && heroTimer){ clearInterval(heroTimer); heroTimer=null; }
}

/* ===== ROWS ===== */
function card(ep){
  const el=document.createElement('div');
  el.className='card';
  el.innerHTML = `
    <div class="thumb"><img alt="Episode ${ep} thumbnail"></div>
    <div class="body">
      <div class="title">Episode ${ep}</div>
      <div class="meta">${EP_COUNTS[ep]||0} scenes • ~${((EP_COUNTS[ep]||0)*SLIDE_MS/1000)|0}s</div>
      <div class="actions">
        <button class="watch">▶ Watch</button>
        <button class="playall secondary">▶▶ Play All from ${ep}</button>
      </div>
    </div>
  `;
  el.querySelector('img').src = genThumb(ep);

  // UPDATED: "Watch" navigates to a page (episode{ep}.html)
  el.querySelector('.watch').onclick  = requireAuth(() => {
    window.location.href = `episode${ep}.html`;
  });

  // Keep "Play All" using the in-page overlay
  el.querySelector('.playall').onclick= requireAuth(() => startEpisode(ep, true));
  return el;
}
function buildRows(){
  for(let ep of [1,2,3,4,5]) gridFeatured.appendChild(card(ep));
  for(let ep=1; ep<=10; ep++) gridEpisodes.appendChild(card(ep));

  // Characters row (code portraits)
  const CHAR_CARDS = [
    {name:'Griff',   ep:1},
    {name:'Syleste', ep:7},
    {name:'Kevin',   ep:4},
    {name:'Nova',    ep:3},
    {name:'Tariq',   ep:2},
    {name:'Zeke',    ep:8},
  ];
  let shown=0;
  for (const c of CHAR_CARDS){
    const el=document.createElement('div');
    el.className='card';
    el.innerHTML=`
      <div class="thumb"><img alt="${c.name}"/></div>
      <div class="body">
        <div class="title">${c.name}</div>
        <div class="meta">Main Cast</div>
        <div class="actions"><button class="secondary">View</button></div>
      </div>`;
    el.querySelector('img').src = generateSlide(c.ep, 1, c.name);
    gridChars.appendChild(el); shown++;
  }
  if (shown>0) charsWrap.style.display='';
}

/* ===== OVERLAY PLAYER (used by Play All) ===== */
let currentEp=1, currentSlide=0, timer=null, paused=false, playAllChain=false;

function startEpisode(ep, chain){
  currentEp=ep; currentSlide=1; playAllChain=chain;
  paused=false; pauseBtn.textContent='⏸';
  player.classList.add('show');            // SHOW overlay
  loadSlide(true);
}
function nextEpisode(){
  if (!playAllChain) return backToHub();
  if (currentEp < 10) startEpisode(currentEp+1, true);
  else backToHub();
}
function backToHub(){ stop(); player.classList.remove('show'); } // HIDE overlay
backBtn.onclick = backToHub;

pauseBtn.onclick = ()=>{
  if(!paused){ clearInterval(timer); paused=true; pauseBtn.textContent='▶'; }
  else{ paused=false; scheduleNext(); pauseBtn.textContent='⏸'; }
};
function stop(){ clearInterval(timer); timer=null; }
function scheduleNext(){ stop(); timer=setInterval(()=>loadSlide(false), SLIDE_MS); }

function loadSlide(initial){
  const total=EP_COUNTS[currentEp]||0;
  if (currentSlide>total){
    captionEl.textContent='Episode complete.'; return nextEpisode();
  }
  preloader.style.opacity=1;
  epLabel.textContent=`Episode ${currentEp} • Scene ${currentSlide}/${total}`;
  slideImg.classList.remove('active');
  slideImg.style.transform='scale(1.08) translateZ(0)';

  const subtitle = (CAPTIONS[currentEp]||[])[currentSlide-1] || '';
  const dataUrl = generateSlide(currentEp, currentSlide, subtitle);

  slideImg.src = dataUrl;
  // force reflow for transition
  slideImg.offsetHeight;
  slideImg.classList.add('active');
  slideImg.style.transform='scale(1.02) translateZ(0)';
  preloader.style.opacity=0;

  captionEl.textContent = subtitle;
  if (initial) scheduleNext();
  currentSlide++;
}

/* ===== SIMPLE NON-BLOCKING AUDIO + TOGGLE ===== */
document.addEventListener('DOMContentLoaded', async () => {
  try { await audio.play(); } catch {}
  audio.muted = true; // start muted
});
soundToggle?.addEventListener('click', async () => {
  audio.muted = !audio.muted;
  soundToggle.textContent = audio.muted ? 'Sound: Off' : 'Sound: On';
  if (!audio.muted) { try { await audio.play(); } catch {} }
});

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  buildHero();
  buildRows();
});
