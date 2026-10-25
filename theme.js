export const THEMES = ['dark', 'light'];
export const THEME_META = { dark: '#081512', light: '#f3faf2' };

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
    const next = t === 'light' ? 'dark' : 'light';
    btn.setAttribute('aria-label', `Switch to ${next} theme`);
    btn.title = `Switch to ${next} theme`;
    btn.classList.add('switching');
    setTimeout(() => btn.classList.remove('switching'), 420);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_META[t] || '#081512';
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
  const bg = theme === 'light' ? 'rgba(243,250,242,0.12)' : 'rgba(8,21,18,0.12)';
  const fg = theme === 'light' ? 'rgba(28,122,75,0.85)' : 'rgba(163,240,90,0.85)';
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
