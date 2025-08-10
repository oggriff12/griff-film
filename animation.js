/***************
  BASIC CONFIG
***************/
const SLIDE_MS = 15000;
const EXT = "png"; // change to "jpg" if needed

// Episodes: how many slides each has (make sure files exist)
const EP_COUNTS = {1:7,2:7,3:7,4:6,5:6,6:6,7:6,8:6,9:6,10:6};

// Captions (short for hub demo; fill in later)
const CAPTIONS = {
  1:["Wilmington — blood on bricks.","More funerals than birthdays.","He walks alone, notebook tight.","Bus to Maryland.","Kevin the mechanic.","If the streets made me…","…maybe I can unmake myself."],
  2:["LA — masks on masks.","Trap vibes, bad friends.","Venice: Tariq returns.","Studio nights, pain fuels.","Open mic calling.","Buzz grows.","The voice gets loud."],
};

/***************
  DOM
***************/
const grid = document.getElementById('episodes-grid');
const player = document.getElementById('slideshow');
const slideImg = document.getElementById('slide');
const captionEl = document.getElementById('caption');
const epLabel = document.getElementById('ep-label');
const backBtn = document.getElementById('back-button');
const pauseBtn = document.getElementById('pause-toggle');
const preloader = document.getElementById('preloader');

const audio = document.getElementById('bg-music');
const tapOverlay = document.getElementById('tap-to-play');
const enableAudio = document.getElementById('enable-audio');

let currentEp=1, currentSlide=0, timer=null, paused=false;

/***************
  AUTH GUARD
***************/
function isAuthed(){
  return window.netlifyIdentity && window.netlifyIdentity.currentUser();
}

function requireAuth(fn){
  return (...args)=>{
    if(!isAuthed()){
      // open login modal
      window.netlifyIdentity && window.netlifyIdentity.open('login');
      return;
    }
    fn(...args);
  };
}

/***************
  HUB (episode cards)
***************/
function slidePath(ep, idx){ return `assets/ep${ep}-${idx}.${EXT}`; }

function makeCard(ep){
  const div=document.createElement('div'); div.className='card';
  div.innerHTML = `
    <div class="thumb">
      <img src="${slidePath(ep,1)}" alt="Episode ${ep} thumbnail" onerror="this.src='';this.parentElement.style.background='#111'">
    </div>
    <div class="body">
      <div class="title">Episode ${ep}</div>
      <div class="meta">~${(EP_COUNTS[ep]||5)*SLIDE_MS/1000|0}s • ${EP_COUNTS[ep]||0} scenes</div>
      <div class="actions">
        <button data-ep="${ep}" class="watch">▶ Watch</button>
        <button data-ep="${ep}" class="playall secondary">▶▶ Play All from ${ep}</button>
      </div>
    </div>`;
  return div;
}

function buildHub(){
  for (let ep=1; ep<=10; ep++){
    grid.appendChild(makeCard(ep));
  }
  grid.addEventListener('click', e=>{
    const b=e.target.closest('button'); if(!b) return;
    const ep = Number(b.dataset.ep);
    if (b.classList.contains('watch')) startEpisodeGuarded(ep,false)();
    if (b.classList.contains('playall')) startEpisodeGuarded(ep,true)();
  });
}
const startEpisodeGuarded = (ep, playAll)=>requireAuth(()=>startEpisode(ep, playAll));

/***************
  PLAYER
***************/
function startEpisode(ep, playAllChain){
  currentEp = ep; currentSlide = 1; paused=false; pauseBtn.textContent='⏸';
  document.body.scrollTo?.({top:0,behavior:'smooth'});
  player.classList.remove('hidden');
  loadSlide(true, playAllChain);
}

function nextEpisode(playAllChain){
  if (!playAllChain) return backToHub();
  if (currentEp < 10) startEpisode(currentEp+1, true);
  else backToHub();
}

function backToHub(){
  stop(); player.classList.add('hidden');
}

function stop(){ clearInterval(timer); timer=null; }

function scheduleNext(playAllChain){
  stop();
  timer = setInterval(()=>loadSlide(false, playAllChain), SLIDE_MS);
}

function loadSlide(initial, playAllChain){
  const total = EP_COUNTS[currentEp]||0;
  if (currentSlide > total){
    captionEl.textContent = 'Episode complete.';
    return nextEpisode(playAllChain);
  }

  const src = slidePath(currentEp, currentSlide);
  preloader.style.opacity=1;
  epLabel.textContent = `Episode ${currentEp} • Scene ${currentSlide}/${total}`;
  slideImg.classList.remove('active');
  slideImg.style.transform = 'scale(1.08) translateZ(0)';

  const img = new Image();
  img.onload = ()=>{
    slideImg.src = src;
    slideImg.offsetHeight;
    slideImg.classList.add('active');
    slideImg.style.transform = 'scale(1.02) translateZ(0)';
    preloader.style.opacity=0;

    const caps = CAPTIONS[currentEp]||[];
    captionEl.textContent = caps[currentSlide-1] || caps[caps.length-1] || '';

    if (initial) scheduleNext(playAllChain);
    currentSlide++;
  };
  img.onerror = ()=>{
    // skip missing
    currentSlide++;
    loadSlide(initial, playAllChain);
  };
  img.src = src;
}

backBtn.onclick = backToHub;
pauseBtn.onclick = ()=>{
  if(!paused){ clearInterval(timer); paused=true; pauseBtn.textContent='▶'; }
  else{ paused=false; scheduleNext(); pauseBtn.textContent='⏸'; }
};

/***************
  AUDIO (iPhone unlock)
***************/
let audioReady=false;
async function tryAutoplay(){
  try{ await audio.play(); audioReady=true; }
  catch{ tapOverlay.classList.remove('hidden'); }
}
enableAudio?.addEventListener('click', async ()=>{
  try{ await audio.play(); audioReady=true; }catch{}
  tapOverlay.classList.add('hidden');
});
document.addEventListener('DOMContentLoaded', tryAutoplay);

/***************
  INIT
***************/
document.addEventListener('DOMContentLoaded', buildHub);
