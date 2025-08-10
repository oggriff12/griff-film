/***************
  CONFIG
***************/
const SLIDE_MS = 15000; // 15 seconds per slide
const KENBURNS_ZOOM_START = 1.08;
const KENBURNS_ZOOM_END   = 1.02;

// Number of slides per episode (adjust to match your files)
const EP_COUNTS = {
  1: 7, 2: 7, 3: 7, 4: 6, 5: 6,
  6: 6, 7: 6, 8: 6, 9: 6, 10: 6
};

// Image extension ("png" or "jpg")
const EXT = "png";

// Captions for each episode
const CAPTIONS = {
  1: [
    "Wilmington, Delaware — blood on bricks, pain in the pavement.",
    "By 17, Griff had more funerals than birthdays.",
    "Friends fade: one shot… another disappears.",
    "He walks alone, notebook tight in his hand.",
    "Bus to Maryland — $40 and a heartbeat.",
    "Kevin: the redneck mechanic with a big laugh and bigger heart.",
    "If the streets made me… maybe I can unmake myself."
  ],
  2: [
    "Los Angeles — the masks got masks.",
    "Trap houses, fake friends, good weed, bad vibes.",
    "He freestyles but the smoke steals his bars.",
    "Venice night: Tariq appears like a ghost from Wilmington.",
    "Studio nights: pain turns to fuel.",
    "Dreams crack — but the voice gets louder.",
    "Open mic is calling."
  ],
  3: [
    "Every mic is a confession.",
    "“Delaware days, blood on pavement…”",
    "Flashback: DeShawn in the crossfire.",
    "Venice waves. Griff calls Kevin for truth.",
    "‘Voices in the Smoke’ — raw, real, viral.",
    "Labels DM. Griff doesn’t trust the glitter.",
    "Choice: chase a deal, or chase the truth."
  ],
  4: [
    "Back to the Bricks.",
    "Some clap, some call him a runner.",
    "A rival steps close — the past wants a rematch.",
    "Griff performs for the youth center.",
    "Kevin shows up — ‘You’re home, son.’",
    "Healing starts in the same streets that hurt him."
  ],
  5: [
    "Tampa — new couch, old problems.",
    "She yells while he grinds.",
    "July 7, 2023: the call — his brother is gone.",
    "Grief floods the room.",
    "Vegas is the only road left.",
    "He packs. He prays. He moves."
  ],
  6: [
    "Las Vegas — survival city.",
    "Grandpa’s broke and robbed after trying to pay rent.",
    "Motel nights and desert days.",
    "The struggle gets louder.",
    "Griff carries the weight.",
    "But he keeps walking."
  ],
  7: [
    "Conflict. A shelter bed. Then a tent.",
    "He meets Syleste — loyal through the dark.",
    "They take turns staying awake.",
    "Danger circles. Love holds.",
    "He hustles to feed them both.",
    "A small fire, a bigger hope."
  ],
  8: [
    "Casinos and sports books — the high hits quick.",
    "Wins stack — so do enemies.",
    "Security watches. So do snakes.",
    "He hires help — they flip on him.",
    "Police look. Syleste stays silent.",
    "The walls start moving in."
  ],
  9: [
    "Parlay fails — the city turns on him.",
    "Paranoia: searching for a gun.",
    "Hiding in hot rooms, cold thoughts.",
    "Shadows whisper betrayal.",
    "Every step feels followed.",
    "Time’s almost up."
  ],
  10: [
    "One last chance.",
    "Griff faces the mirror and the streets.",
    "Syleste by his side — ride or die.",
    "Fire becomes light.",
    "A new road opens.",
    "GRIFF IS BACK."
  ]
};

/***************
  DOM ELEMENTS
***************/
const menu        = document.getElementById('menu');
const buttonsWrap = document.getElementById('episode-buttons');
const playAllBtn  = document.getElementById('play-all');

const player      = document.getElementById('slideshow');
const slideImg    = document.getElementById('slide');
const captionEl   = document.getElementById('caption');
const epLabel     = document.getElementById('ep-label');
const backButton  = document.getElementById('back-button');
const pauseBtn    = document.getElementById('pause-toggle');
const preloader   = document.getElementById('preloader');

const audio       = document.getElementById('bg-music');
const tapOverlay  = document.getElementById('tap-to-play');
const enableAudio = document.getElementById('enable-audio');

let currentEp = 1;
let currentSlide = 0;
let slideTimer = null;
let paused = false;
let playAllMode = false;

// Try autoplay music (iPhone fix)
let audioReady = false;
const tryAutoplay = async () => {
  try {
    await audio.play();
    audioReady = true;
  } catch {
    tapOverlay.classList.remove('hidden');
  }
};
enableAudio.addEventListener('click', async () => {
  try { await audio.play(); audioReady = true; } catch {}
  tapOverlay.classList.add('hidden');
});
document.addEventListener('DOMContentLoaded', tryAutoplay);

// Build episode buttons
Object.keys({1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,10:1}).forEach(n => {
  const b = document.createElement('button');
  b.textContent = `Episode ${n}`;
  b.addEventListener('click', () => startEpisode(Number(n), false));
  buttonsWrap.appendChild(b);
});
playAllBtn.addEventListener('click', () => startEpisode(1, true));

backButton.addEventListener('click', () => {
  stopPlayback();
  player.classList.add('hidden');
  menu.classList.remove('hidden');
});

pauseBtn.addEventListener('click', () => {
  if (!paused) {
    clearInterval(slideTimer);
    paused = true;
    pauseBtn.textContent = '▶';
  } else {
    paused = false;
    scheduleNext();
    pauseBtn.textContent = '⏸';
  }
});

/***************
  FUNCTIONS
***************/
function startEpisode(ep, playAll){
  playAllMode = playAll;
  currentEp = ep;
  currentSlide = 0;
  menu.classList.add('hidden');
  player.classList.remove('hidden');
  pauseBtn.textContent = '⏸';
  paused = false;
  loadSlide(true);
}

function nextEpisode(){
  if (currentEp < 10) {
    startEpisode(currentEp + 1, true);
  } else {
    stopPlayback();
    player.classList.add('hidden');
    menu.classList.remove('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
  }
}

function stopPlayback(){
  clearInterval(slideTimer);
  slideTimer = null;
}

function scheduleNext(){
  stopPlayback();
  slideTimer = setInterval(() => loadSlide(false), SLIDE_MS);
}

function slidePath(ep, idx){
  return `assets/ep${ep}-${idx+1}.${EXT}`;
}

function loadSlide(initial){
  const total = EP_COUNTS[currentEp] || 0;
  if (currentSlide >= total) {
    captionEl.textContent = 'Episode complete.';
    if (playAllMode) {
      setTimeout(nextEpisode, 1200);
    }
    return;
  }

  const src = slidePath(currentEp, currentSlide);
  preloader.style.opacity = 1;
  epLabel.textContent = `Episode ${currentEp} • Slide ${currentSlide+1}/${total}`;

  // Reset zoom
  slideImg.classList.remove('active');
  slideImg.style.transform = `scale(1.08) translateZ(0)`;

  const img = new Image();
  img.onload = () => {
    slideImg.src = src;
    slideImg.offsetHeight;
    slideImg.classList.add('active');
    slideImg.style.transform = `scale(1.02) translateZ(0)`;
    preloader.style.opacity = 0;

    const caps = CAPTIONS[currentEp] || [];
    captionEl.textContent = caps[currentSlide] || caps[caps.length-1] || '';

    if (initial) scheduleNext();
    currentSlide++;
  };
  img.onerror = () => {
    currentSlide++;           // skip missing file
    loadSlide(initial);
  };
  img.src = src;
}
