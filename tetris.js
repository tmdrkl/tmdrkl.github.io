import { getTheme, setTheme, themeRainBurst, THEMES } from './theme.js';

const COLS = 10, ROWS = 20;
const boardEl = document.getElementById('board');
const nextEl = document.getElementById('next');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const overlaySub = document.getElementById('overlaySub');
const overlayBtn = document.getElementById('overlayBtn');
const startBtn = document.getElementById('startBtn');
const musicBtn = document.getElementById('musicBtn');
const store = {
  get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
};
const holdEl = document.getElementById('hold');
const linesEl = document.getElementById('lines');
const pauseBtn = document.getElementById('pauseBtn');
musicBtn.textContent = store.get('tetris_music_tmdrkl') !== '0' ? '🔊' : '🔇';

const HIGHSCORE_KEY = 'tetris_highscore_tmdrkl';
const BASE_INTERVAL = 600;
const MIN_INTERVAL = 100;
const LEVEL_LINES = 10;

let COLORS = {};
const FALLBACK_COLORS = {
  I: '#88c0d0', O: '#ebcb8b', T: '#b48ead',
  S: '#a3be8c', Z: '#bf616a', J: '#81a1c1', L: '#d08770'
};
const colorOf = t => COLORS[t] || FALLBACK_COLORS[t];
function refreshColors(){
  const cs = getComputedStyle(document.documentElement);
  const get = k => cs.getPropertyValue(k).trim() || FALLBACK_COLORS[k.slice(4)];
  COLORS = {
    I: get('--T-I'),
    O: get('--T-O'),
    T: get('--T-T'),
    S: get('--T-S'),
    Z: get('--T-Z'),
    J: get('--T-J'),
    L: get('--T-L'),
  };
}

// Ensure colors are ready after CSS loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', refreshColors);
} else {
  refreshColors();
}

// --- Theme toggle ---
document.getElementById('themeToggle').addEventListener('click', () => {
  const cur = getTheme();
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  setTheme(next);
  themeRainBurst(next);
  refreshColors();
  draw();
  drawNext();
  drawHold();
});

const SHAPES = {
  I: [[1,1,1,1]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]]
};

let grid, current, next, score, level, totalLines, dropInterval, gameOver, paused, running;
let hold = null, canHold = true;
let cellEls = [];
let highScore = parseInt(store.get(HIGHSCORE_KEY) || '0', 10) || 0;
highScoreEl.textContent = highScore;

// --- Sound (WebAudio) ---
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (musicOn && running && !musicTimer && audioCtx) startMusic();
}
function blip(freq, dur = 0.06, type = 'square', vol = 0.04) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  osc.stop(audioCtx.currentTime + dur);
}
function sfxMove() { blip(180, 0.03, 'square', 0.02); }
function sfxRotate() { blip(320, 0.04, 'square', 0.03); }
function sfxLock() { vibrate(15); blip(140, 0.05, 'triangle', 0.04); }
function sfxClear(n) {
  vibrate(n * 15);
  const base = 500;
  for (let i = 0; i < n; i++) {
    setTimeout(() => blip(base + i * 120, 0.08, 'sawtooth', 0.04), i * 70);
  }
}
function sfxGameOver() { vibrate([50, 30, 50]); blip(220, 0.15, 'sawtooth', 0.05); setTimeout(() => blip(160, 0.2, 'sawtooth', 0.05), 150); }
function sfxLevelUp() { vibrate([10, 20, 10]); blip(600, 0.08, 'sine', 0.05); setTimeout(() => blip(800, 0.1, 'sine', 0.05), 80); }

// --- Background music (chiptune loop) ---
let musicOn = store.get('tetris_music_tmdrkl') !== '0';
let musicTimer = null;
let musicNext = 0;
let musicStep = 0;
let musicGain = null;
const midi2freq = m => 440 * Math.pow(2, (m - 69) / 12);
const BASS = [
  45,45,-1,45, 45,45,43,45,  41,41,-1,41, 41,41,43,41,
  48,48,-1,48, 48,48,47,48,  43,43,-1,43, 43,43,45,43
];
const LEAD = [
  69,-1,72,-1, 74,-1,72,-1,  69,-1,72,-1, 76,-1,74,-1,
  69,-1,72,-1, 74,-1,72,-1,  76,-1,74,-1, 72,-1,71,-1,
  72,-1,76,-1, 79,-1,76,-1,  77,-1,76,-1, 74,-1,72,-1,
  69,-1,72,-1, 74,-1,72,-1,  71,-1,72,-1, 71,-1,69,-1
];
const STEP = 60 / 150 / 2;

function playNote(midi, t, dur, type, vol, dest) {
  if (midi < 0) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = midi2freq(midi);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function scheduleMusic() {
  if (!audioCtx || !musicGain) return;
  while (musicNext < audioCtx.currentTime + 0.12) {
    playNote(BASS[musicStep], musicNext, STEP * 0.9, 'square', 0.18, musicGain);
    if (musicStep % 2 === 0) playNote(LEAD[musicStep], musicNext, STEP * 0.8, 'triangle', 0.12, musicGain);
    musicNext += STEP;
    musicStep = (musicStep + 1) % 32;
  }
}

function startMusic() {
  if (!musicOn || !audioCtx || musicTimer) return;
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.5;
  musicGain.connect(audioCtx.destination);
  musicStep = 0;
  musicNext = audioCtx.currentTime + 0.05;
  scheduleMusic();
  musicTimer = setInterval(scheduleMusic, 60);
}

function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
  if (musicGain && audioCtx) {
    musicGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    const g = musicGain;
    setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 400);
    musicGain = null;
  }
}

function toggleMusic() {
  ensureAudio();
  if (!audioCtx) return;
  musicOn = !musicOn;
  store.set('tetris_music_tmdrkl', musicOn ? '1' : '0');
  musicBtn.textContent = musicOn ? '🔊' : '🔇';
  musicBtn.setAttribute('aria-label', musicOn ? 'Turn off music' : 'Turn on music');
  if (musicOn) startMusic();
  else stopMusic();
}

function buildBoard() {
  boardEl.innerHTML = '';
  cellEls = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const div = document.createElement('div');
      div.className = 'cell';
      boardEl.appendChild(div);
      row.push(div);
    }
    cellEls.push(row);
  }
}

function randomPiece() {
  const keys = Object.keys(SHAPES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  return {
    type,
    shape: SHAPES[type].map(r => r.slice()),
    row: 0,
    col: Math.floor((COLS - SHAPES[type][0].length) / 2)
  };
}

function rotate(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = [];
  for (let c = 0; c < cols; c++) {
    const newRow = [];
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(shape[r][c]);
    }
    result.push(newRow);
  }
  return result;
}

function collides(shape, row, col) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = row + r, nc = col + c;
      if (nc < 0 || nc >= COLS || nr >= ROWS) return true;
      if (nr >= 0 && grid[nr][nc]) return true;
    }
  }
  return false;
}

function ghostRow() {
  let row = current.row;
  while (!collides(current.shape, row + 1, current.col)) row++;
  return row;
}

function lockPiece() {
  const { shape, row, col, type } = current;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const nr = row + r, nc = col + c;
        if (nr < 0) { endGame(); return; }
        grid[nr][nc] = type;
      }
    }
  }
  sfxLock();
  clearLines();
  current = next;
  next = randomPiece();
  drawNext();
  canHold = true;
  if (collides(current.shape, current.row, current.col)) {
    endGame();
  }
}

function clearLines() {
  const clearedRows = [];
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid[r].every(cell => cell)) clearedRows.push(r);
  }
  const cleared = clearedRows.length;
  if (cleared) {
    clearedRows.forEach(r => {
      for (let c = 0; c < COLS; c++) {
        const el = cellEls[r][c];
        el.classList.remove('clearflash');
        void el.offsetWidth;
        el.classList.add('clearflash');
      }
    });
    clearedRows.forEach(r => grid.splice(r, 1));
    for (let i = 0; i < cleared; i++) grid.unshift(new Array(COLS).fill(null));
    const points = [0, 100, 300, 500, 800];
    score += points[cleared] || cleared * 200;
    scoreEl.textContent = score;
    sfxClear(cleared);

    totalLines += cleared;
    linesEl.textContent = totalLines;
    const prevLevel = level;
    level = Math.floor(totalLines / LEVEL_LINES) + 1;
    if (level > prevLevel) {
      levelEl.textContent = level;
      sfxLevelUp();
      restartTimer();
    }
  }
}

function draw() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const el = cellEls[r][c];
      el.style.background = grid[r][c] ? colorOf(grid[r][c]) : 'var(--bg)';
      el.style.boxShadow = '';
    }
  }
  if (running && current && !gameOver && !paused) {
    const { shape, row, col, type } = current;
    const color = colorOf(type);
    const gRow = ghostRow();
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nr = gRow + r, nc = col + c;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc]) {
          cellEls[nr][nc].style.background = 'transparent';
          cellEls[nr][nc].style.boxShadow = `inset 0 0 0 2px ${color}55`;
        }
      }
    }
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nr = row + r, nc = col + c;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const el = cellEls[nr][nc];
          el.style.background = color;
          el.style.boxShadow = '';
        }
      }
    }
  }
}

function drawNext() {
  nextEl.innerHTML = '';
  const size = 4;
  const grid4 = Array.from({length: size}, () => new Array(size).fill(null));
  const shape = next.shape;
  const offR = Math.floor((size - shape.length) / 2);
  const offC = Math.floor((size - shape[0].length) / 2);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) grid4[r + offR][c + offC] = colorOf(next.type);
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const div = document.createElement('div');
      div.className = 'cell';
      div.style.background = grid4[r][c] || 'var(--bg)';
      nextEl.appendChild(div);
    }
  }
}

function drawHold() {
  holdEl.innerHTML = '';
  const size = 4;
  const grid4 = Array.from({length: size}, () => new Array(size).fill(null));
  if (hold) {
    const shape = hold.shape;
    const offR = Math.floor((size - shape.length) / 2);
    const offC = Math.floor((size - shape[0].length) / 2);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) grid4[r + offR][c + offC] = colorOf(hold.type);
      }
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const div = document.createElement('div');
      div.className = 'cell';
      div.style.background = grid4[r][c] || 'var(--bg)';
      holdEl.appendChild(div);
    }
  }
}

function doHold() {
  if (!running || gameOver || paused || !canHold) return;
  if (hold) {
    const tmp = current;
    current = hold;
    hold = tmp;
  } else {
    hold = current;
    current = next;
    next = randomPiece();
    drawNext();
  }
  current.row = 0;
  current.col = Math.floor((COLS - current.shape[0].length) / 2);
  canHold = false;
  drawHold();
  draw();
  if (collides(current.shape, current.row, current.col)) endGame();
}

function restartTimer() {
  clearInterval(dropInterval);
  const interval = Math.max(MIN_INTERVAL, BASE_INTERVAL - (level - 1) * 50);
  dropInterval = setInterval(() => move(1, 0), interval);
}

function move(dr, dc) {
  if (!running || gameOver || paused) return;
  const { shape, row, col } = current;
  const nr = row + dr, nc = col + dc;
  if (!collides(shape, nr, nc)) {
    current.row = nr;
    current.col = nc;
    if (dc !== 0) sfxMove();
    draw();
  } else if (dr === 1) {
    lockPiece();
    draw();
  }
}

function hardDrop() {
  if (!running || gameOver || paused) return;
  let dropped = 0;
  while (!collides(current.shape, current.row + 1, current.col)) {
    current.row++;
    dropped++;
  }
  score += dropped * 2;
  scoreEl.textContent = score;
  lockPiece();
  draw();
}

function doRotate() {
  if (!running || gameOver || paused) return;
  const rotated = rotate(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const k of kicks) {
    if (!collides(rotated, current.row, current.col + k)) {
      current.shape = rotated;
      current.col += k;
      sfxRotate();
      draw();
      return;
    }
  }
}

function endGame() {
  if (gameOver) return;
  gameOver = true;
  running = false;
  clearInterval(dropInterval);
  let isNewRecord = false;
  if (score > highScore) {
    highScore = score;
    store.set(HIGHSCORE_KEY, String(highScore));
    highScoreEl.textContent = highScore;
    isNewRecord = true;
  }
  overlayText.textContent = 'GAME OVER';
  overlaySub.className = 'sub';
  overlaySub.textContent = isNewRecord ? '🎉 New record!' : `Score: ${score}`;
  overlayBtn.textContent = 'Play Again';
  overlayBtn.style.display = 'block';
  overlay.style.display = 'flex';
  stopMusic();
  sfxGameOver();
}

function togglePause() {
  if (!running || gameOver) return;
  paused = !paused;
  pauseBtn.textContent = paused ? '▶' : '⏸';
  pauseBtn.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
  overlay.style.display = paused ? 'flex' : 'none';
  if (paused) {
    overlayText.textContent = 'PAUSE';
    overlaySub.className = 'sub blue';
    overlaySub.textContent = 'Press P to resume';
    overlayBtn.textContent = 'Resume';
    overlayBtn.style.display = 'block';
    stopMusic();
  } else {
    draw();
    startMusic();
  }
}

function startGame() {
  ensureAudio();
  clearInterval(dropInterval);
  grid = Array.from({length: ROWS}, () => new Array(COLS).fill(null));
  score = 0;
  level = 1;
  totalLines = 0;
  hold = null;
  canHold = true;
  scoreEl.textContent = 0;
  levelEl.textContent = 1;
  linesEl.textContent = 0;
  highScoreEl.textContent = highScore;
  gameOver = false;
  paused = false;
  running = true;
  pauseBtn.textContent = '⏸';
  pauseBtn.setAttribute('aria-label', 'Pause');
  overlay.style.display = 'none';
  overlayText.textContent = '';
  overlaySub.textContent = '';
  current = randomPiece();
  next = randomPiece();
  drawNext();
  drawHold();
  draw();
  restartTimer();
  startMusic();
}

function showRestartHint() {
  startBtn.blur();
  overlayBtn.blur();
}

document.addEventListener('keydown', (e) => {
  ensureAudio();
  if (e.key === 'ArrowLeft') { e.preventDefault(); move(0, -1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); move(0, 1); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); move(1, 0); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); doRotate(); }
  else if (e.key === ' ') { e.preventDefault(); hardDrop(); }
  else if (e.key.toLowerCase() === 'c') { doHold(); }
  else if (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'r') {
    if (gameOver) { startGame(); } else { togglePause(); }
  }
});

startBtn.addEventListener('click', () => {
  startGame();
  startBtn.blur();
});
overlayBtn.addEventListener('click', () => {
  if (paused) togglePause();
  else startGame();
  overlayBtn.blur();
});
musicBtn.addEventListener('click', () => {
  toggleMusic();
  musicBtn.blur();
});
pauseBtn.addEventListener('click', () => {
  togglePause();
  pauseBtn.blur();
});

function vibrate(ms){ try { navigator.vibrate(ms); } catch(e) {} }
document.getElementById('btnLeft').addEventListener('touchstart', (e) => { e.preventDefault(); ensureAudio(); vibrate(8); move(0, -1); }, { passive: false });
document.getElementById('btnRight').addEventListener('touchstart', (e) => { e.preventDefault(); ensureAudio(); vibrate(8); move(0, 1); }, { passive: false });
document.getElementById('btnDown').addEventListener('touchstart', (e) => { e.preventDefault(); ensureAudio(); vibrate(8); move(1, 0); }, { passive: false });
document.getElementById('btnRotate').addEventListener('touchstart', (e) => { e.preventDefault(); ensureAudio(); vibrate(12); doRotate(); }, { passive: false });
document.getElementById('btnHold').addEventListener('touchstart', (e) => { e.preventDefault(); ensureAudio(); vibrate(15); doHold(); }, { passive: false });
document.getElementById('btnLeft').addEventListener('mousedown', (e) => { ensureAudio(); move(0, -1); });
document.getElementById('btnRight').addEventListener('mousedown', (e) => { ensureAudio(); move(0, 1); });
document.getElementById('btnDown').addEventListener('mousedown', (e) => { ensureAudio(); move(1, 0); });
document.getElementById('btnRotate').addEventListener('mousedown', (e) => { ensureAudio(); doRotate(); });
document.getElementById('btnHold').addEventListener('mousedown', (e) => { ensureAudio(); doHold(); });

// --- Swipe gesture langsung di papan (untuk touchscreen) ---
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
const SWIPE_THRESHOLD = 20;

boardEl.addEventListener('touchstart', (e) => {
  ensureAudio();
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
  touchStartTime = Date.now();
}, { passive: true });

boardEl.addEventListener('touchend', (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const dt = Date.now() - touchStartTime;
  const absX = Math.abs(dx), absY = Math.abs(dy);

  if (absX < 10 && absY < 10 && dt < 250) {
    vibrate(12); doRotate();
    return;
  }
  if (absX > absY) {
    if (absX > SWIPE_THRESHOLD) { vibrate(8); move(0, dx > 0 ? 1 : -1); }
  } else {
    if (dy > SWIPE_THRESHOLD * 3) { vibrate(20); hardDrop(); }
    else if (dy > SWIPE_THRESHOLD) { vibrate(8); move(1, 0); }
  }
}, { passive: true });

function fitLayout(){
  const isMobile = window.innerWidth <= 640;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth;
  const panel = document.querySelector('.panel');
  const board = document.getElementById('board');
  const pad = isMobile ? 4 : 32;
  const gap = isMobile ? 4 : 16;
  const minCell = isMobile ? 12 : 14;
  const panelW = panel.offsetWidth || (isMobile ? 140 : 190);
  const availW = vw - pad * 2 - gap - panelW;
  const availH = vh - pad * 2;
  let cell = Math.min(Math.floor((availW - 9) / 10), Math.floor((availH - 19) / 20));
  cell = Math.max(minCell, Math.min(cell, 40));
  board.style.width = (cell * 10 + 9) + 'px';
  board.style.height = (cell * 20 + 19) + 'px';
}

try {
  buildBoard();
  fitLayout();
  startGame();
} catch (err) {
  const warn = document.createElement('div');
  warn.style.cssText = 'color:var(--red);font-size:11px;margin-top:8px;word-break:break-all;';
  warn.textContent = '⚠ ' + (err && err.message ? err.message : err);
  document.querySelector('.panel').appendChild(warn);
}
window.addEventListener('resize', fitLayout);