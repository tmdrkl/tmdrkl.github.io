export const THEMES = ['dark', 'light', 'gruvbox', 'gruvbox-light', 'catppuccin', 'catppuccin-latte'];
export const THEME_META = {
  dark: '#232a2e', light: '#f4f0d9', gruvbox: '#282828', 'gruvbox-light': '#fbf1c7',
  catppuccin: '#1e1e2e', 'catppuccin-latte': '#eff1f5'
};
const THEME_LABELS = {
  dark: 'Everforest', light: 'Everforest Light', gruvbox: 'Gruvbox',
  'gruvbox-light': 'Gruvbox Light', catppuccin: 'Mocha', 'catppuccin-latte': 'Latte'
};

export function getTheme() {
  const v = localStorage.getItem('drkl_theme');
  if (THEMES.includes(v)) return v;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('drkl_theme', t);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = t === 'light' ? '🌙' : '☀️';
    // The icon alone is not an accessible name — say what the click will do.
    const next = THEMES[(THEMES.indexOf(t) + 1) % THEMES.length];
    btn.setAttribute('aria-label', `Switch to ${next} theme`);
    btn.title = `Switch to ${next} theme`;
    btn.classList.add('switching');
    setTimeout(() => btn.classList.remove('switching'), 420);
  }
  const pickerLabel = document.getElementById('themePickerLabel');
  if (pickerLabel) pickerLabel.textContent = THEME_LABELS[t] || t;
  document.querySelectorAll('[data-theme-choice]').forEach(choice => {
    choice.setAttribute('aria-pressed', String(choice.dataset.themeChoice === t));
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_META[t] || '#232a2e';
}

export function cycleTheme() {
  const cur = getTheme();
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  setTheme(next);
  themeRainBurst(next);
  return next;
}

export function themeRainBurst(theme) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;z-index:9999;width:100%;height:100%;pointer-events:none;transition:opacity .35s ease';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  c.width = innerWidth;
  c.height = innerHeight;
  const ch = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789$#@%&';
  const fs = 14;
  const cols = Math.floor(c.width / fs);
  const drops = Array.from({ length: cols }, () => Math.random() * -30);
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  const fgColor = getComputedStyle(document.documentElement).getPropertyValue('--green').trim();
  const toRgba = (hex, alpha) => {
    const value = hex.replace('#', '');
    const n = parseInt(value, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  };
  const bg = toRgba(bgColor || THEME_META.dark, 0.12);
  const fg = toRgba(fgColor || '#a7c080', 0.85);
  const t0 = performance.now();
  (function frame() {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.font = fs + 'px monospace';
    ctx.fillStyle = fg;
    for (let j = 0; j < cols; j++) {
      ctx.fillText(ch[Math.random() * ch.length | 0], j * fs, drops[j] * fs);
      if (drops[j] * fs > c.height && Math.random() > 0.975) drops[j] = 0;
      drops[j]++;
    }
    if (performance.now() - t0 < 700) requestAnimationFrame(frame);
    else {
      c.style.opacity = '0';
      setTimeout(() => c.remove(), 350);
    }
  })();
}

// Init theme immediately, and wire up the toggle on every page that has one.
setTheme(getTheme());

const toggle = document.getElementById('themeToggle');
if (toggle) toggle.addEventListener('click', cycleTheme);

const picker = document.querySelector('.theme-picker');
const pickerToggle = document.getElementById('themePickerToggle');
const pickerMenu = document.getElementById('themePickerMenu');
if (picker && pickerToggle && pickerMenu) {
  pickerToggle.addEventListener('click', () => {
    const open = pickerToggle.getAttribute('aria-expanded') !== 'true';
    pickerToggle.setAttribute('aria-expanded', String(open));
    pickerMenu.hidden = !open;
  });
  pickerMenu.addEventListener('click', event => {
    const choice = event.target.closest('[data-theme-choice]');
    if (!choice || !THEMES.includes(choice.dataset.themeChoice)) return;
    const selectedTheme = choice.dataset.themeChoice;
    setTheme(selectedTheme);
    themeRainBurst(selectedTheme);
    pickerMenu.hidden = true;
    pickerToggle.setAttribute('aria-expanded', 'false');
    pickerToggle.focus();
  });
  document.addEventListener('click', event => {
    if (!picker.contains(event.target)) {
      pickerMenu.hidden = true;
      pickerToggle.setAttribute('aria-expanded', 'false');
    }
  });
  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !pickerMenu.hidden) {
      pickerMenu.hidden = true;
      pickerToggle.setAttribute('aria-expanded', 'false');
      pickerToggle.focus();
    }
  });
}
