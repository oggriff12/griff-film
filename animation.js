/************************
 * GRIFF IS BACK — animation.js
 * Hulu-style hub + auth + non-blocking audio + sound toggle
 ************************/

/* ===== CONFIG ===== */
const SLIDE_MS = 15000;              // ms per slide
const EXT = "png";                   // change to "jpg" if your files are jpg
const EP_COUNTS = {1:7,2:7,3:7,4:6,5:6,6:6,7:6,8:6,9:6,10:6};
const HERO_EPISODES = [1,2,3,4,5];   // hero uses epX-1 as background

// Short demo captions (add more later if you want)
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

const player   = document.getElementById('slideshow');
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

/* ===== UTILS ===== */
function slidePath(ep, i){ return `assets/ep${ep}-${i}.${EXT}`; }
function imgExists(src){ return new Promise(res=>{ const im=new Image(); im.onload=()=>res(true); im.onerror=()=>res(false); im.src=src; }); }

/* ===== HERO CAROUSEL ===== */
let heroIdx = 0, heroTimer=null;
async function buildHero(){
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

  heroPlay.onclick = requireAuth(()=> startEpisode(1,true));
  heroEp1.onclick  = requireAuth(()=> startEpisode(1,false));
}
async function showHero(idx, stopAuto=false){
  heroIdx = idx;
  const ep = HERO_EPISODES[idx];
  const src = slidePath(ep,1);
  heroImg.src = (await imgExists(src)) ? src : '';
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
  const img = el.querySelector('img');
  img.src = slidePath(ep,1);
  img.onerror = ()=> el.remove(); // hide card if thumbnail missing
  el.querySelector('.watch').onclick  = requireAuth(()=> startEpisode(ep,false));
  el.querySelector('.playall').onclick= requireAuth(()=> startEpisode(ep,true));
  return el;
}
async function buildRows(){
  // Featured: 1–5
  for(let ep of [1,2,3,4,5]) gridFeatured.appendChild(card(ep));
  // Episodes: 1–10
  for(let ep=1; ep<=10; ep++) gridEpisodes.appendChild(card(ep));

  // Characters (only if exists)
  const chars = [
    {name:'Griff',   src:'assets/char-griff.png'},
    {name:'Syleste', src:'assets/char-syleste.png'},
    {name:'Kevin',   src:'assets/char-kevin.png'},
    {name:'Nova',    src:'assets/char-nova.png'},
    {name:'Tariq',   src:'assets/char-tariq.png'},
    {name:'Zeke',    src:'assets/char-zeke.png'},
  ];
  let shown=0;
  for (const c of chars){
    if (await imgExists(c.src)){
      const el=document.createElement('div');
      el.className='card';
      el.innerHTML=`
        <div class="thumb"><img src="${c.src}" alt="${c.name}"/></div>
        <div class="body">
          <div class="title">${c.name}</div>
          <div class="meta">Main Cast</div>
          <div class="actions"><button class="secondary">View</button></div>
        </div>`;
      gridChars.appendChild(el); shown++;
    }
  }
  if (shown>0) charsWrap.style.display='';
}

/* ===== PLAYER ===== */
let currentEp=1, currentSlide=0, timer=null, paused=false, playAllChain=false;

function startEpisode(ep, chain){
  currentEp=ep; currentSlide=1; playAllChain=chain;
  paused=false; pauseBtn.textContent='⏸';
  player.classList.remove('hidden');
  loadSlide(true);
}
function nextEpisode(){
  if (!playAllChain) return backToHub();
  if (currentEp < 10) startEpisode(currentEp+1, true);
  else backToHub();
}
function backToHub(){ stop(); player.classList.add('hidden'); }
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
  const src = slidePath(currentEp,currentSlide);
  preloader.style.opacity=1;
  epLabel.textContent=`Episode ${currentEp} • Scene ${currentSlide}/${total}`;
  slideImg.classList.remove('active');
  slideImg.style.transform='scale(1.08) translateZ(0)';

  const im=new Image();
  im.onload=()=>{
    slideImg.src=src; slideImg.offsetHeight;
    slideImg.classList.add('active');
    slideImg.style.transform='scale(1.02) translateZ(0)';
    preloader.style.opacity=0;

    const caps = CAPTIONS[currentEp]||[];
    captionEl.textContent = caps[currentSlide-1] || caps[caps.length-1] || '';
    if (initial) scheduleNext();
    currentSlide++;
  };
  im.onerror=()=>{ currentSlide++; loadSlide(initial); }; // skip missing
  im.src=src;
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
document.addEventListener('DOMContentLoaded', async ()=>{
  await buildHero();
  await buildRows();
});
