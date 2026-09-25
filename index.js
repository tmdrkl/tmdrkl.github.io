import { THEMES, getTheme, setTheme, themeRainBurst } from './theme.js';

// ── DOM ──────────────────────────────────────────────
const log       = document.getElementById('log');
const screen    = document.getElementById('screen');
const input     = document.getElementById('cmdInput');
const promptEl  = document.getElementById('prompt');
const titleText = document.getElementById('titleText');
const loadTime  = Date.now();

// ── Helpers ──────────────────────────────────────────
function print(html, cls) {
  const d = document.createElement('div');
  d.className = 'row' + (cls ? ' ' + cls : '');
  d.innerHTML = html;
  log.appendChild(d);
  screen.scrollTop = screen.scrollHeight;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function browserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/'))     return 'Edge';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Chrome/'))  return 'Chrome';
  if (ua.includes('Safari/'))  return 'Safari';
  return 'Mysterious browser';
}

// ── Virtual FS ───────────────────────────────────────
const BASE_FS = {
  'about.txt': 'Tomi — likes everything new and fun.',
  'links.txt': 'GitHub: https://github.com/tmdrkl\nTelegram: https://t.me/tmdrkl\nEmail: to@drkl.net',
  'README.md': '# drkl.net\n\nA terminal with a built-in AI chat.\nType chat to start talking to the AI.',
  'projects': {
    'terminal': 'This is it — the web terminal you are using right now.',
  },
  'notes': {
    'todo.txt': '- push website\n- make a blog\n- have lunch',
    'ide.txt':  'try making another game on drkl.net',
  },
  'blog': {
    'welcome.md': [
      '# Welcome to drkl.net',
      '',
      'This site started from one simple idea: making a personal landing page',
      'that is not boring. Instead of a plain static page, I built an interactive',
      'web terminal you can actually use — complete with a virtual filesystem.',
      '',
      '## Features',
      '',
      '- **Terminal** — `ls`, `cd`, `cat`, `tree`, `fastfetch`, and more',
      '- **AI Chat** — type `chat` to talk with the AI (Groq)',
      '- **Themes** — dark/light, follows system preference or manual',
      '- **History** — command history saved across sessions',
      '',
      'This site runs 100% client-side. The backend is only used for AI chat.',
      '',
      'Happy exploring. Type `help` for a list of commands.'
    ].join('\n'),
    'ai-chat.md': [
      '# Behind the AI chat',
      '',
      'When you type `chat`, your browser talks to a Cloudflare Worker that',
      'forwards your questions to the Groq API. All answers are streamed so it',
      'feels like typing.',
      '',
      '## Keeping costs sane',
      '',
      '- **Rate limit** — 50 conversations per IP per 24 hours',
      '- **Usage tracking** — chat & token counts stored in a Durable Object',
      '- **Owner PIN** — `/login <PIN>` lifts the limit & `/stats` for the owner',
      '',
      '## Try it yourself',
      '',
      'Type `chat`, then `/help` to see the available commands.',
      '`/stats` shows usage statistics (owner only, must be logged in).'
    ].join('\n'),
    'stack.md': [
      '# Stack',
      '',
      'This site is built without frameworks:',
      '',
      '| Part       | Technology                   |',
      '|------------|------------------------------|',
      '| Frontend   | Vanilla HTML/CSS/JS          |',
      '| Colors     | Gruvbox Material             |',
      '| AI chat    | Groq via Cloudflare Worker   |',
      '| Storage    | Durable Objects (Cloudflare) |',
      '| Hosting    | GitHub Pages                 |',
      '',
      '## Roadmap',
      '',
      '- Blog (done: `blog` + `read`)',
      '- Visual stats dashboard (`dashboard`)',
      '- One more small game',
      '',
      'See the code at [github.com/tmdrkl](https://github.com/tmdrkl).'
    ].join('\n'),
    'welcome.id.md': [
      '# Selamat datang di drkl.net',
      '',
      'Situs ini dimulai dari satu ide sederhana: membuat landing page personal',
      'yang tidak membosankan. Alih-alih halaman statis biasa, saya bikin terminal',
      'web interaktif yang bisa dipakai asli — lengkap dengan virtual filesystem.',
      '',
      '## Fitur',
      '',
      '- **Terminal** — `ls`, `cd`, `cat`, `tree`, `fastfetch`, dan lainnya',
      '- **AI Chat** — ketik `chat` untuk ngobrol dengan AI (Groq)',
      '- **Tema** — dark/light, ikut preferensi sistem atau manual',
      '- **History** — riwayat perintah tersimpan antar sesi',
      '',
      'Situs ini berjalan 100% di sisi klien. Backend hanya dipakai untuk AI chat.',
      '',
      'Selamat menjelajah. Ketik `help` untuk daftar perintah.'
    ].join('\n'),
    'ai-chat.id.md': [
      '# Di balik AI chat',
      '',
      'Ketika kamu ketik `chat`, browser berbicara ke Cloudflare Worker yang',
      'meneruskan pertanyaan ke API Groq. Semua jawaban di-streaming agar',
      'terasa seperti mengetik.',
      '',
      '## Menjaga biaya tetap waras',
      '',
      '- **Rate limit** — 50 percakapan per IP per 24 jam',
      '- **Usage tracking** — jumlah chat & token tersimpan di Durable Object',
      '- **PIN owner** — `/login <PIN>` membuka limit & `/stats` untuk pemilik',
      '',
      '## Coba sendiri',
      '',
      'Ketik `chat`, lalu `/help` untuk melihat perintah yang tersedia.',
      '`/stats` menampilkan statistik pemakaian (khusus pemilik yang sudah login).'
    ].join('\n'),
    'stack.id.md': [
      '# Stack',
      '',
      'Situs ini dibangun tanpa framework:',
      '',
      '| Bagian     | Teknologi                    |',
      '|------------|------------------------------|',
      '| Frontend   | Vanilla HTML/CSS/JS          |',
      '| Warna      | Gruvbox Material             |',
      '| AI chat    | Groq via Cloudflare Worker   |',
      '| Penyimpanan| Durable Objects (Cloudflare) |',
      '| Hosting    | GitHub Pages                 |',
      '',
      '## Roadmap',
      '',
      '- Blog (sudah: `blog` + `read`)',
      '- Dashboard statistik visual (`dashboard`)',
      '- Satu lagi game kecil',
      '',
      'Lihat kode di [github.com/tmdrkl](https://github.com/tmdrkl).'
    ].join('\n'),
  },
};

// User-created filesystem (persisted in localStorage)
let userFS = {};
try {
  const saved = localStorage.getItem('drkl_userfs');
  if (saved) userFS = JSON.parse(saved);
} catch {}

function saveUserFS() {
  try {
    localStorage.setItem('drkl_userfs', JSON.stringify(userFS));
  } catch {}
}

// Merge base FS with user FS (user FS takes precedence)
function getMergedFS() {
  const merged = JSON.parse(JSON.stringify(BASE_FS));
  deepMerge(merged, userFS);
  return merged;
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] === null) {
      delete target[key];
    } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

let FS = getMergedFS();

let cwd = ['~'];

function pwdStr()    { return '~' + (cwd.length > 1 ? '/' + cwd.slice(1).join('/') : ''); }
function promptStr() { return `${getUsername()}@drkl:${pwdStr()}$`; }
function refreshPrompt() { promptEl.textContent = promptStr(); }
function refreshTitle()  { titleText.textContent = `${getUsername()}@drkl: ~`; }

// ── Visitor username (per-browser, stored in localStorage) ──
const DEFAULT_USER = 'guest';
const USER_RE = /^[a-z0-9_-]{1,16}$/;

function getUsername() {
  try {
    const u = localStorage.getItem('drkl_username');
    if (u && USER_RE.test(u)) return u;
  } catch {}
  return DEFAULT_USER;
}

function setUsername(name) {
  const clean = String(name || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 16);
  if (!clean) return null;
  try {
    localStorage.setItem('drkl_username', clean);
  } catch {}
  return clean;
}

function resolvePath(p) {
  if (!p || p === '~' || p === '/') return ['~'];
  let base, rest;
  if (p.startsWith('~/'))      { base = ['~']; rest = p.slice(2); }
  else if (p.startsWith('/'))  { base = ['~']; rest = p.slice(1); }
  else                         { base = cwd.slice(); rest = p; }
  for (const t of rest.split('/')) {
    if (!t || t === '.') continue;
    if (t === '..') { if (base.length > 1) base.pop(); }
    else base.push(t);
  }
  return base;
}

function getNode(path) {
  let node = FS;
  for (const seg of path.slice(1)) {
    if (node && typeof node === 'object' && seg in node) node = node[seg];
    else return undefined;
  }
  return node;
}

function setNode(path, value) {
  const merged = getMergedFS();
  let node = merged;
  for (let i = 1; i < path.length - 1; i++) {
    const seg = path[i];
    if (!node[seg] || typeof node[seg] !== 'object') node[seg] = {};
    node = node[seg];
  }
  node[path[path.length - 1]] = value;
  userFS = merged;
  saveUserFS();
  FS = getMergedFS();
}

function deleteNode(path) {
  const merged = getMergedFS();
  let node = merged;
  for (let i = 1; i < path.length - 1; i++) {
    const seg = path[i];
    if (!node[seg] || typeof node[seg] !== 'object') return false;
    node = node[seg];
  }
  const last = path[path.length - 1];
  if (!(last in node)) return false;
  delete node[last];
  userFS = merged;
  saveUserFS();
  FS = getMergedFS();
  return true;
}

function isDir(n) { return !!n && typeof n === 'object'; }

// Terminal text editor state
let editorMode = false;
let editorFile = '';
let editorContent = '';
let editorCursor = 0;
let editorLines = [];

function openEditor(filename, content) {
  editorMode = true;
  editorFile = filename;
  editorContent = content;
  editorLines = content.split('\n');
  editorCursor = editorContent.length;
  
  print('');
  print('<span class="ok">─'.repeat(50) + '</span>');
  print(`<span class="ok">EDITOR</span> — <span class="blue">${esc(filename)}</span> <span class="muted">(${editorLines.length} lines)</span>`);
  print('<span class="muted">Type your content. Press <span class="ok">Ctrl+S</span> to save, <span class="ok">Ctrl+X</span> to exit.</span>');
  print('<span class="ok">─'.repeat(50) + '</span>');
  print('');
  
  // Show content with line numbers
  editorLines.forEach((line, i) => {
    const num = String(i + 1).padStart(3);
    print(`<span class="muted">${num}</span> <span class="editor-line">${esc(line)}</span>`);
  });
  
  // Show cursor position
  print(`<span class="muted">${String(editorLines.length + 1).padStart(3)}</span> <span class="editor-cursor">▋</span>`);
  
  // Change input handler
  input.placeholder = 'Editing mode — Ctrl+S save, Ctrl+X exit';
  input.setAttribute('aria-label', `Editing ${filename} — Ctrl+S to save, Ctrl+X to exit`);
  input.style.background = 'var(--code-bg)';
}

function closeEditor(saved) {
  editorMode = false;
  editorFile = '';
  editorContent = '';
  editorLines = [];
  editorCursor = 0;
  input.placeholder = '';
  input.setAttribute('aria-label', 'Terminal command');
  input.style.background = 'transparent';
  print('<span class="ok">─'.repeat(50) + '</span>');
  if (saved) {
    print('<span class="ok">File saved.</span>');
  } else {
    print('<span class="muted">Editor closed (no changes saved).</span>');
  }
  print('');
}

function saveEditor() {
  setNode(resolvePath(editorFile), editorContent);
  closeEditor(true);
}

function handleEditorInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const before = editorContent.slice(0, editorCursor);
    const after = editorContent.slice(editorCursor);
    editorContent = before + '\n' + after;
    editorCursor = before.length + 1;
    renderEditor();
    return;
  }
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (editorCursor > 0) {
      const before = editorContent.slice(0, editorCursor - 1);
      const after = editorContent.slice(editorCursor);
      editorContent = before + after;
      editorCursor--;
      renderEditor();
    }
    return;
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (editorCursor > 0) editorCursor--;
    renderEditor();
    return;
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (editorCursor < editorContent.length) editorCursor++;
    renderEditor();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    // Move up one line
    const lines = editorContent.split('\n');
    let pos = 0;
    let lineIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (pos + lines[i].length >= editorCursor) {
        lineIdx = i;
        break;
      }
      pos += lines[i].length + 1; // +1 for newline
    }
    if (lineIdx > 0) {
      const prevLineLen = lines[lineIdx - 1].length;
      const col = editorCursor - pos;
      editorCursor = pos - lines[lineIdx].length - 1 + Math.min(col, prevLineLen);
    } else {
      editorCursor = 0;
    }
    renderEditor();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const lines = editorContent.split('\n');
    let pos = 0;
    let lineIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (pos + lines[i].length >= editorCursor) {
        lineIdx = i;
        break;
      }
      pos += lines[i].length + 1;
    }
    if (lineIdx < lines.length - 1) {
      const nextLineLen = lines[lineIdx + 1].length;
      const col = editorCursor - pos;
      editorCursor = pos + lines[lineIdx].length + 1 + Math.min(col, nextLineLen);
    } else {
      editorCursor = editorContent.length;
    }
    renderEditor();
    return;
  }
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveEditor();
    return;
  }
  if (e.ctrlKey && e.key === 'x') {
    e.preventDefault();
    closeEditor(false);
    return;
  }
  // Regular character input
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    const before = editorContent.slice(0, editorCursor);
    const after = editorContent.slice(editorCursor);
    editorContent = before + e.key + after;
    editorCursor++;
    renderEditor();
    return;
  }
}

function renderEditor() {
  editorLines = editorContent.split('\n');
  // Clear the screen and re-render
  log.innerHTML = '';
  print('');
  print('<span class="ok">─'.repeat(50) + '</span>');
  print(`<span class="ok">EDITOR</span> — <span class="blue">${esc(editorFile)}</span> <span class="muted">(${editorLines.length} lines)</span>`);
  print('<span class="muted">Type your content. Press <span class="ok">Ctrl+S</span> to save, <span class="ok">Ctrl+X</span> to exit.</span>');
  print('<span class="ok">─'.repeat(50) + '</span>');
  print('');
  
  editorLines.forEach((line, i) => {
    const num = String(i + 1).padStart(3);
    print(`<span class="muted">${num}</span> <span class="editor-line">${esc(line)}</span>`);
  });
  
  // Show cursor position
  const lines = editorContent.split('\n');
  let pos = 0;
  let cursorLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (pos + lines[i].length >= editorCursor) {
      cursorLine = i;
      break;
    }
    pos += lines[i].length + 1;
  }
  const cursorCol = editorCursor - pos;
  const cursorLineNum = String(cursorLine + 1).padStart(3);
  print(`<span class="muted">${cursorLineNum}</span> <span class="editor-line">${esc(lines[cursorLine].slice(0, cursorCol))}<span class="editor-cursor">▋</span>${esc(lines[cursorLine].slice(cursorCol))}</span>`);
  
  // Show remaining lines if cursor is not on last line
  for (let i = cursorLine + 1; i < lines.length; i++) {
    const num = String(i + 1).padStart(3);
    print(`<span class="muted">${num}</span> <span class="editor-line">${esc(lines[i])}</span>`);
  }
  
  screen.scrollTop = screen.scrollHeight;
}

function renderFastfetch(ascii, info) {
  // On narrow screens side-by-side ASCII + info overflows — stack vertically.
  try {
    if (window.innerWidth && window.innerWidth < 480) {
      const art = ascii.map((l, i) => `<span class="ascii-line-${i}">${l}</span>`).join('\n');
      return art + '\n' + info.join('\n');
    }
  } catch {}
  const maxAsciiWidth = Math.max(...ascii.map(l => l.length));
  const paddedAscii = ascii.map((l, i) => `<span class="ascii-line-${i}">${l}</span>` + ' '.repeat(maxAsciiWidth - l.length));
  const maxLines = Math.max(paddedAscii.length, info.length);
  const lines = [];
  for (let i = 0; i < maxLines; i++) {
    const left = paddedAscii[i] || ' '.repeat(maxAsciiWidth);
    const right = info[i] || '';
    lines.push(`${left}  ${right}`);
  }
  return lines.join('\n');
}

function treeWalk(node, prefix, lines, depth) {
  const keys = Object.keys(node);
  keys.forEach((k, i) => {
    const last = i === keys.length - 1;
    const child = node[k];
    const d = isDir(child);
    lines.push(prefix + (last ? '└── ' : '├── ') + (d
      ? `<span class="dir">${esc(k)}/</span>`
      : `<span class="muted">${esc(k)}</span>`));
    if (d && depth < 4) treeWalk(child, prefix + (last ? '    ' : '│   '), lines, depth + 1);
  });
}

// ── Figlet ───────────────────────────────────────────
const FONT = {
  D: ['████','█  █','█  █','█  █','█  █','█  █','████'],
  R: ['████','█  █','█  █','████','█ █ ','█  █','█  █'],
  K: ['█  █','█ █ ','██  ','█ █ ','█  █','█  █','█  █'],
  L: ['█   ','█   ','█   ','█   ','█   ','█   ','████'],
};

function figlet(word) {
  const letters = word.toUpperCase().split('').map(ch => FONT[ch] || null);
  const rows = [];
  for (let i = 0; i < 7; i++) {
    rows.push(letters.map(l => (l ? l[i] : '    ')).join(' '));
  }
  return rows.join('\n');
}

// ══════════════════════════════════════════════════════
//  CHAT MODE
// ══════════════════════════════════════════════════════
const WORKER_URL = 'https://groq-chat.tomx13.workers.dev';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
// Models have a token limit and every message is billed, so long conversations
// only send their most recent turns as context.
const MAX_CONTEXT_MESSAGES = 24;

let chatMode = false;
let chatHistory = [];
let chatBusy = false;
let chatAbort = null;
let chatModel = DEFAULT_MODEL;
let chatModels = [];
let lastPrompt = '';
let trimNoticeShown = false;

function enterChatMode() {
  chatMode = true;
  chatHistory = [];
  lastPrompt = '';
  trimNoticeShown = false;
  promptEl.textContent = 'you>';
  titleText.textContent = 'chat mode — /exit to leave';
  print('');
  const cmds = [
    ['/exit', 'leave chat mode'],
    ['/clear', 'reset'],
    ['/help', 'chat commands'],
    ['/stop', 'interrupt the answer (Esc)'],
    ['/retry', 'ask the last question again'],
    ['/login <PIN>', 'owner: lift rate limit'],
    ['/model', 'change model'],
  ];
  let cmdsHtml = '<span class="chat-welcome-cmds">';
  cmds.forEach(([n, d]) => {
    cmdsHtml += `<span class="cmd-name">${n}</span><span class="cmd-desc">${d}</span>`;
  });
  cmdsHtml += '</span>';
  print(`<div class="chat-welcome"><span class="chat-welcome-title">AI Chat Mode</span>${cmdsHtml}</div>`);
  print('');
}

function exitChatMode() {
  chatMode = false;
  chatHistory = [];
  refreshPrompt();
  refreshTitle();
  print('<span class="muted">── exited chat mode ──</span>');
  print('');
}

async function loadChatModels() {
  try {
    const res = await fetch(`${WORKER_URL}/models`);
    if (!res.ok) return;
    const data = await res.json();
    chatModels = Array.isArray(data.models) ? data.models : [];
    if (chatModels.length) {
      chatModel = chatModels.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : chatModels[0];
    }
  } catch {}
}

async function showModels() {
  if (!chatModels.length) {
    print('<span class="muted">Loading models...</span>');
    await loadChatModels();
  }
  if (!chatModels.length) {
    print('<span class="err">No models available.</span>');
    return;
  }
  print('<span class="ok">Available models:</span>');
  print('');
  chatModels.forEach(m => {
    const active = m === chatModel ? ' <span class="ok">← active</span>' : '';
    print(`  <span class="muted">•</span> ${esc(m)}${active}`);
  });
  print('');
  print(`<span class="muted">Use /model &lt;name&gt; to switch.</span>`);
}

async function chatLogin(pin) {
  if (!pin) {
    print('usage: <span class="ok">/login &lt;PIN&gt;</span>');
    return;
  }
  print('<span class="muted">Verifying PIN...</span>');
  try {
    const res = await fetch(`${WORKER_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `HTTP ${res.status}`);
    }
    const d = await res.json();
    sessionStorage.setItem('drkl_chat_token', d.token);
    print('<span class="ok">PIN verified — rate limit lifted for 24h.</span>');
  } catch (e) {
    print(`<span class="err">Login failed: ${esc(e.message)}</span>`);
  }
}

async function showChatStats() {
  print('<span class="muted">Fetching stats...</span>');
  const chatToken = sessionStorage.getItem('drkl_chat_token') || '';
  try {
    const res = await fetch(`${WORKER_URL}/stats`, {
      headers: chatToken ? { Authorization: 'Bearer ' + chatToken } : {},
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('login needed — run /login <PIN> first');
      throw new Error(`HTTP ${res.status}`);
    }
    const s = await res.json();
    if (s.error) throw new Error(s.error);

    const lines = [
      `<span class="ok">Chat usage stats</span>`,
      `<span class="muted">---------------------------</span>`,
      `<span class="blue">Total chats</span>: ${s.totalChats}`,
      `<span class="blue">Total tokens</span>: ${s.totalTokens}`,
      `<span class="blue">Prompt tokens</span>: ${s.promptTokens}`,
      `<span class="blue">Completion tokens</span>: ${s.completionTokens}`,
      `<span class="blue">Avg tokens/chat</span>: ${s.avgTokensPerChat}`,
    ];

    if (s.byDay && s.byDay.length) {
      const recent = s.byDay.slice(0, 5)
        .map(d => `  ${esc(d.date)} — ${d.chats} chats · ${d.tokens} tokens`)
        .join('\n');
      lines.push(`<span class="blue">Recent days</span>\n${recent}`);
    }
    if (s.models && s.models.length) {
      lines.push(`<span class="blue">Top models</span>`);
      s.models.slice(0, 3).forEach(m => {
        lines.push(`  ${esc(m.model)} — ${m.count} chats · ${m.ptok + m.ctok} tokens`);
      });
    }
    if (s.logins && s.logins.length) {
      lines.push(`<span class="blue">Login history</span>`);
      s.logins.slice(0, 5).forEach(l => {
        const where = l.country && l.country !== '??' ? esc(l.country) : '??';
        lines.push(`  ${esc(l.ip)} (${where}) — ${esc(l.time)}`);
      });
    }
    print(`<pre>${lines.join('\n')}</pre>`);
  } catch (e) {
    print(`<span class="err">Fetch failed: ${esc(e.message)}</span>`);
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function showChatHistory(full) {
  if (!chatHistory.length) {
    print('<span class="muted">No messages yet.</span>');
    return;
  }
  print('<span class="ok">Chat history:</span>');
  print('');
  chatHistory.forEach((msg) => {
    const t = msg.time ? `<span class="muted">[${formatTime(msg.time)}]</span> ` : '';
    if (msg.role === 'user') {
      print(`${t}<span class="chat-you">you></span> ${esc(msg.content)}`);
    } else {
      if (full) {
        print(`${t}<span class="chat-ai">ai></span> ${esc(msg.content)}`);
      } else {
        const preview = msg.content.length > 120 ? msg.content.slice(0, 120) + '...' : msg.content;
        print(`${t}<span class="chat-ai">ai></span> ${esc(preview)}`);
      }
    }
  });
  print('');
  print(`<span class="muted">${chatHistory.length} messages total. /history -f for full.</span>`);
}

function exportChatLog() {
  if (!chatHistory.length) {
    print('<span class="muted">No messages to export.</span>');
    return;
  }
  let log = `drkl.net chat log\nModel: ${chatModel}\nDate: ${new Date().toLocaleString()}\n${'='.repeat(40)}\n\n`;
  chatHistory.forEach((msg) => {
    const t = msg.time ? `[${formatTime(msg.time)}] ` : '';
    const role = msg.role === 'user' ? 'you' : 'ai';
    log += `${t}${role}> ${msg.content}\n\n`;
  });
  const blob = new Blob([log], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  print('<span class="muted">Chat log downloaded.</span>');
}

function cliFormat(text) {
  // Format markdown-like text for CLI: bold, code, lists, tables, headings

  // Pull fenced code blocks out of the RAW text first, so later rules can't
  // touch them and their contents get escaped exactly once (inside
  // highlightCode). Escaping here as well would display—and copy—"&amp;&amp;"
  // instead of "&&".
  const blocks = [];
  // The optional \n? before the closing fence keeps the last line newline out of
  // the block, so the rendered block has no blank tail and copy is exact.
  const noBlocks = String(text).replace(/```(\w+)?[\s\n]*([\s\S]*?)\n?```/g, (_m, lang, code) => {
    blocks.push({ lang: lang || '', code });
    return '\u0000CODE' + (blocks.length - 1) + '\u0000';
  });

  const safe = esc(noBlocks);

  // Process tables FIRST (before lists) to prevent table rows being caught as list items
  // More robust table regex: handles optional leading/trailing pipes, multiple rows
  let body = safe.replace(/\n?\|([^\n]+)\|\n\|([-:| ]+)\|\n((?:\|[^\n]*\|\n?)+)/g, (match, header, separator, rows) => {
    const cols = header.split('|').map(c => c.trim()).filter(Boolean);
    const aligns = separator.split('|').map(a => {
      const t = a.trim();
      if (t.startsWith(':') && t.endsWith(':')) return 'center';
      if (t.endsWith(':')) return 'right';
      return 'left';
    }).filter(Boolean);
    const thead = '<thead><tr>' + cols.map((c, i) => `<th style="text-align:${aligns[i] || 'left'}">${c}</th>`).join('') + '</tr></thead>';
    const tbody = '<tbody>' + rows.trim().split('\n').map(r => {
      const cells = r.split('|').map(c => c.trim()).filter(Boolean);
      return '<tr>' + cells.map((c, i) => `<td style="text-align:${aligns[i] || 'left'}">${c}</td>`).join('') + '</tr>';
    }).join('') + '</tbody>';
    return '\n<table class="chat-table">' + thead + tbody + '</table>\n';
  });

  // Also handle tables without leading newline (at start of text)
  body = body.replace(/^\|([^\n]+)\|\n\|([-:| ]+)\|\n((?:\|[^\n]*\|\n?)+)/g, (match, header, separator, rows) => {
    const cols = header.split('|').map(c => c.trim()).filter(Boolean);
    const aligns = separator.split('|').map(a => {
      const t = a.trim();
      if (t.startsWith(':') && t.endsWith(':')) return 'center';
      if (t.endsWith(':')) return 'right';
      return 'left';
    }).filter(Boolean);
    const thead = '<thead><tr>' + cols.map((c, i) => `<th style="text-align:${aligns[i] || 'left'}">${c}</th>`).join('') + '</tr></thead>';
    const tbody = '<tbody>' + rows.trim().split('\n').map(r => {
      const cells = r.split('|').map(c => c.trim()).filter(Boolean);
      return '<tr>' + cells.map((c, i) => `<td style="text-align:${aligns[i] || 'left'}">${c}</td>`).join('') + '</tr>';
    }).join('') + '</tbody>';
    return '<table class="chat-table">' + thead + tbody + '</table>\n';
  });

  body = body
    .replace(/`([^`]+)`/g, '<span class="chat-inline">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<span class="chat-bold">$1</span>')
    .replace(/\*([^*\n]+)\*/g, '<span class="chat-italic">$1</span>')
    .replace(/^---+$/gm, '<span class="muted">────────────────────────────────</span>')
    .replace(/^>\s*(.*)$/gm, '<span class="chat-quote">$1</span>')
    .replace(/^(#{1,6})\s+(.+)$/gm, (_m, hashes, content) => {
      const cls = hashes.length === 1 ? 'chat-h1' : hashes.length === 2 ? 'chat-h2' : 'chat-h3';
      return `<span class="${cls}">${content}</span>`;
    })
    // Task lists: - [ ] or - [x]
    .replace(/^([-*+])\s+\[([ xX])\]\s+(.+)$/gm, (_m, marker, checked, content) => {
      const done = /x/i.test(checked);
      return `<span class="chat-task${done ? ' done' : ''}">${done ? '☑' : '☐'} ${content}</span>`;
    })
    // Bullet lists (but NOT table rows - exclude lines starting with |)
    .replace(/^([-*+])\s+(?!\|)(.+)$/gm, '<span class="chat-bullet">$1</span> $2')
    // Numbered lists
    .replace(/^(\d+)\.\s+(.+)$/gm, '<span class="chat-num">$1</span> $2');

  // Restore code blocks
  return body.replace(/\u0000CODE(\d+)\u0000/g, (_m, i) => {
    const b = blocks[Number(i)];
    const highlighted = highlightCode(b.code, b.lang);
    const lang = b.lang ? `<span class="chat-code-lang">${esc(b.lang)}</span>` : '';
    return `<pre class="chat-code">${lang}<code>${highlighted}</code></pre>`;
  });
}

// Languages where "#" starts a line comment. Elsewhere (CSS "#fff", HTML ids)
// it is just a character.
const HL_HASH_COMMENT = new Set([
  'py', 'python', 'sh', 'bash', 'zsh', 'shell', 'yaml', 'yml', 'rb', 'ruby',
  'perl', 'pl', 'make', 'makefile', 'dockerfile', 'toml', 'ini', 'conf', 'r',
  'jl', 'julia', 'ps1', 'awk', 'cr', 'nim',
]);
// Languages with no line comments at all (so "//" stays a plain character).
const HL_NO_LINE_COMMENT = new Set(['html', 'xml', 'svg', 'css', 'scss', 'less', 'json', 'md', 'markdown']);

function highlightCode(code, lang) {
  if (!lang) return esc(code);
  
  const keywords = {
    js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'class', 'extends', 'import', 'export', 'from', 'async', 'await', 'yield', 'typeof', 'instanceof', 'delete', 'void', 'debugger'],
    ts: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'class', 'extends', 'import', 'export', 'from', 'async', 'await', 'yield', 'typeof', 'instanceof', 'delete', 'void', 'debugger', 'interface', 'type', 'enum', 'namespace', 'declare', 'abstract', 'implements', 'public', 'private', 'protected', 'readonly', 'static'],
    py: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'return', 'try', 'except', 'finally', 'raise', 'import', 'from', 'as', 'with', 'as', 'lambda', 'yield', 'global', 'nonlocal', 'assert', 'del', 'pass', 'in', 'is', 'not', 'and', 'or', 'None', 'True', 'False', 'async', 'await'],
    sh: ['if', 'then', 'else', 'elif', 'fi', 'for', 'in', 'do', 'done', 'while', 'until', 'case', 'esac', 'function', 'return', 'break', 'continue', 'local', 'export', 'readonly', 'declare', 'source', '.', 'exit', 'set', 'unset', 'alias', 'unalias'],
    html: ['div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'form', 'input', 'button', 'select', 'option', 'textarea', 'script', 'style', 'link', 'meta', 'head', 'body', 'html', '!DOCTYPE'],
    css: ['color', 'background', 'font', 'margin', 'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom', 'flex', 'grid', 'align', 'justify', 'content', 'gap', 'overflow', 'z-index', 'transform', 'transition', 'animation', '@media', '@keyframes'],
  };
  
  const lc = String(lang).toLowerCase();
  const kwSet = new Set(keywords[lc] || []);
  const hashComment  = HL_HASH_COMMENT.has(lc);
  const slashComment = !hashComment && !HL_NO_LINE_COMMENT.has(lc);
  const blockComment = !hashComment;

  const src = String(code);
  const tag = (cls, text) => `<span class="${cls}">${esc(text)}</span>`;
  const at = (re, i) => { re.lastIndex = i; const m = re.exec(src); return (m && m.index === i) ? m[0] : null; };

  // Sticky regexes, scanned left to right in one pass. Because nothing is ever
  // re-scanned, markup emitted for one token can't be matched as the next one —
  // that is what used to turn `<span class="hl-num">` into
  // `<<span class="hl-kw">span</span> class="hl-num">`.
  const RE_LINE_SLASH = /\/\/[^\n]*/y;
  const RE_LINE_HASH  = /#[^\n]*/y;
  const RE_BLOCK      = /\/\*[\s\S]*?\*\//y;
  const RE_DQ         = /"(?:[^"\\]|\\.)*"/y;
  const RE_SQ         = /'(?:[^'\\]|\\.)*'/y;
  const RE_BT         = /`(?:[^`\\]|\\.)*`/y;
  const RE_DECORATOR  = /@[A-Za-z_$][\w$]*/y;
  const RE_NUMBER     = /\d+\.?\d*/y;
  const RE_WORD       = /[A-Za-z_$][\w$]*/y;

  let out = '';
  let i = 0;
  while (i < src.length) {
    let m = (slashComment && at(RE_LINE_SLASH, i)) || (hashComment && at(RE_LINE_HASH, i)) || (blockComment && at(RE_BLOCK, i));
    if (m) { out += tag('hl-comment', m); i += m.length; continue; }

    m = at(RE_DQ, i) || at(RE_SQ, i) || at(RE_BT, i);
    if (m) { out += tag('hl-str', m); i += m.length; continue; }

    m = at(RE_DECORATOR, i);
    if (m) { out += tag('hl-decorator', m); i += m.length; continue; }

    m = at(RE_NUMBER, i);
    if (m) { out += tag('hl-num', m); i += m.length; continue; }

    m = at(RE_WORD, i);
    if (m) {
      const isCall = /^\s*\(/.test(src.slice(i + m.length));
      const cls = kwSet.has(m) ? 'hl-kw' : (isCall ? 'hl-func' : (/^[A-Z]/.test(m) ? 'hl-type' : null));
      out += cls ? tag(cls, m) : esc(m);
      i += m.length;
      continue;
    }

    // Anything else (whitespace, punctuation) — escape one code point at a time
    // so surrogate pairs are not split.
    const ch = String.fromCodePoint(src.codePointAt(i));
    out += esc(ch);
    i += ch.length;
  }
  return out;
}

// Copy buttons are attached only once an answer has finished streaming, so they
// never show up on a half-rendered markdown block.
function addCopyButtons(root) {
  root.querySelectorAll('pre.chat-code').forEach((block) => {
    if (block.querySelector('.copy-btn')) return;
    const codeEl = block.querySelector('code');
    if (!codeEl) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'copy';
    btn.setAttribute('aria-label', 'Copy this code block');
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const label = (text, ok) => {
        btn.textContent = text;
        btn.classList.toggle('done', !!ok);
        setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('done'); }, 1400);
      };
      if (!navigator.clipboard) { label('unavailable'); return; }
      navigator.clipboard.writeText(codeEl.textContent)
        .then(() => label('copied', true))
        .catch(() => label('failed'));
    });
    block.appendChild(btn);
  });
}

function isNearBottom() {
  return screen.scrollHeight - screen.scrollTop - screen.clientHeight < 50;
}

function contextMessages() {
  let msgs = chatHistory.map(({ role, content }) => ({ role, content }));
  if (msgs.length > MAX_CONTEXT_MESSAGES) msgs = msgs.slice(-MAX_CONTEXT_MESSAGES);
  // Never start the context on an assistant turn.
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  return msgs;
}

function stopChat() {
  if (chatBusy && chatAbort) chatAbort.abort();
}

async function sendChatMessage(text, isRetry = false) {
  if (chatBusy) return;

  const AI_PREFIX = '<span class="chat-ai">ai></span> ';
  let pushedUser = false;

  if (isRetry) {
    // After a failure the user turn was dropped from history, so put it back —
    // but if it is still there, don't send it twice.
    const last = chatHistory[chatHistory.length - 1];
    if (!last || last.role !== 'user' || last.content !== text) {
      chatHistory.push({ role: 'user', content: text, time: Date.now() });
      pushedUser = true;
    }
    print(`<span class="muted">↻ retrying:</span> ${esc(text)}`);
  } else {
    chatHistory.push({ role: 'user', content: text, time: Date.now() });
    pushedUser = true;
    lastPrompt = text;
    print(`<span class="chat-you">you></span> ${esc(text)}`);
  }

  const context = contextMessages();
  if (context.length < chatHistory.length && !trimNoticeShown) {
    trimNoticeShown = true;
    print(`<span class="muted">(long chat — only the last ${MAX_CONTEXT_MESSAGES} messages are sent as context)</span>`);
  }

  // Status line: the "generating" indicator and the stop hint in one.
  const sepEl = document.createElement('div');
  sepEl.className = 'row muted';
  sepEl.textContent = '· · ·  (Esc to stop)';
  log.appendChild(sepEl);

  // AI reply container
  const replyEl = document.createElement('div');
  replyEl.className = 'row chat-reply';
  log.appendChild(replyEl);
  if (isNearBottom()) screen.scrollTop = screen.scrollHeight;

  chatBusy = true;
  const ctrl = new AbortController();
  chatAbort = ctrl;
  // Defer screen reader announcements until the answer is complete, otherwise
  // the typewriter re-announces the whole reply every 25ms.
  screen.setAttribute('aria-busy', 'true');

  let full = '', revealed = 0, streamDone = false, timer = null;

  const plainText = () => full.replace(/<br\s*\/?>/gi, '\n');
  const paint = () => {
    replyEl.innerHTML = AI_PREFIX + cliFormat(plainText().slice(0, revealed));
  };

  // Typewriter effect — accelerates through bursts so a long answer doesn't
  // keep typing for ages after the network already finished.
  timer = setInterval(() => {
    const plain = plainText();
    const backlog = plain.length - revealed;
    if (backlog > 0) {
      revealed = Math.min(plain.length, revealed + Math.max(3, Math.ceil(backlog / 10)));
      paint();
      if (isNearBottom()) screen.scrollTop = screen.scrollHeight;
    }
    if (streamDone && revealed >= plain.length) {
      clearInterval(timer);
      timer = null;
      replyEl.innerHTML = AI_PREFIX + cliFormat(plain);
      addCopyButtons(replyEl);
      screen.removeAttribute('aria-busy');
      if (isNearBottom()) screen.scrollTop = screen.scrollHeight;
    }
  }, 25);

  try {
    const chatToken = sessionStorage.getItem('drkl_chat_token') || '';
    const res = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(chatToken ? { Authorization: 'Bearer ' + chatToken } : {}) },
      body: JSON.stringify({ model: chatModel, messages: context }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const retryAfter = res.headers.get('Retry-After');
      const hint = res.status === 429 && retryAfter ? ` — try again in ${retryAfter}s` : '';
      throw new Error((data.error || `HTTP ${res.status}`) + hint);
    }
    if (!res.body) throw new Error('empty response stream');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        let json;
        try {
          json = JSON.parse(payload);
        } catch {
          continue;
        }
        // The worker can also report a failure mid-stream; surface it instead of
        // silently ending up with an empty bubble.
        if (json.error) throw new Error(typeof json.error === 'string' ? json.error : (json.error.message || 'stream error'));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) full += delta;
      }
    }
    streamDone = true;

    if (!full) {
      if (timer) { clearInterval(timer); timer = null; }
      replyEl.innerHTML = AI_PREFIX + '<span class="muted">(no response)</span>';
      screen.removeAttribute('aria-busy');
      if (pushedUser) chatHistory.pop();
    } else {
      chatHistory.push({ role: 'assistant', content: full, time: Date.now() });
    }
  } catch (e) {
    if (timer) { clearInterval(timer); timer = null; }
    screen.removeAttribute('aria-busy');
    if (e.name === 'AbortError') {
      const partial = plainText();
      revealed = partial.length;
      if (partial) {
        chatHistory.push({ role: 'assistant', content: partial, time: Date.now() });
        paint();
        addCopyButtons(replyEl);
        print('<span class="muted">generation stopped — partial answer kept.</span>');
      } else {
        if (pushedUser) chatHistory.pop();
        replyEl.remove();
        print('<span class="muted">generation stopped.</span>');
      }
    } else {
      // Drop the unanswered turn so the next request still alternates
      // user/assistant; the text stays in lastPrompt for /retry.
      if (pushedUser) chatHistory.pop();
      replyEl.innerHTML = `${AI_PREFIX}<span class="err">Error: ${esc(e.message)}</span>` +
        (lastPrompt ? ' <span class="muted">— /retry to try again</span>' : '');
    }
  } finally {
    chatBusy = false;
    chatAbort = null;
    sepEl.remove();
    // Only take focus back when it wasn't deliberately moved somewhere else.
    const active = document.activeElement;
    if (!active || active === document.body || active === input) input.focus({ preventScroll: true });
  }
}

// ══════════════════════════════════════════════════════
//  TERMINAL COMMANDS
// ══════════════════════════════════════════════════════
const HELP = {
  help:     'list available commands',
  about:    'a bit about me',
  links:    'contacts & github',
  neofetch: 'system info in fastfetch style (alias of fastfetch)',
  fastfetch:'system info in fastfetch style',
  fetch:    'system info with geo/IP (via Cloudflare edge)',
  banner:   'display the drkl logo',
  date:     'current date & time',
  echo:     'display text, e.g. echo hello (supports > and >> redirection)',
  ls:       'list directory contents',
  cd:       'change directory',
  pwd:      'print working directory',
  cat:      'show file contents',
  tree:     'directory tree',
  history:  'command history (-c to clear)',
  chat:     'start AI chat mode',
  blog:     'list blog posts',
  read:     'read a blog post (read 1 | read name.md)',
  dashboard:'open the visual stats dashboard',
  clear:    'clear the screen',
  whoami:   'show current user',
  username: 'show or set your username (saved in this browser)',
  uname:    'system info',
  sudo:     'run as root (will fail)',
  theme:    'switch theme (dark|light)',
  tictactoe:'play tic-tac-toe vs AI (tictactoe 1-9)',
  ttt:      'alias of tictactoe',
  exit:     'exit the terminal',
  rm:       'delete files or directories (-r for recursive)',
  mkdir:    'create a directory',
  touch:    'create an empty file',
  edit:     'edit a file in the terminal text editor',
};

// ── Tic-tac-toe (you = X, AI = O) ────────────────────
const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

let tttBoard = null; // null = no active game, else Array(9) of '' | 'X' | 'O'
let tttScore = { w: 0, l: 0, d: 0 };
try {
  const s = JSON.parse(localStorage.getItem('drkl_ttt'));
  if (s && typeof s === 'object') {
    tttScore = { w: s.w | 0, l: s.l | 0, d: s.d | 0 };
  }
} catch {}

function tttSaveScore() {
  try { localStorage.setItem('drkl_ttt', JSON.stringify(tttScore)); } catch {}
}

function tttWinner(b) {
  for (const [a, c, d] of TTT_LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return b.every((c) => c) ? 'draw' : null;
}

function tttBestMove(b) {
  // 1. Win if possible, 2. block player win, 3. center, 4. random corner, 5. random side.
  const empty = [];
  for (let i = 0; i < 9; i++) if (!b[i]) empty.push(i);
  for (const me of ['O', 'X']) {
    for (const i of empty) {
      b[i] = me;
      const w = tttWinner(b);
      b[i] = '';
      if (w === me) return i;
    }
  }
  if (!b[4]) return 4;
  const corners = [0, 2, 6, 8].filter((i) => !b[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

function tttWinLine() {
  if (!tttBoard) return null;
  for (const line of TTT_LINES) {
    const [a, c, d] = line;
    if (tttBoard[a] && tttBoard[a] === tttBoard[c] && tttBoard[a] === tttBoard[d]) return line;
  }
  return null;
}

function tttPrintBoard() {
  const d = document.createElement('div');
  d.className = 'row';
  const grid = document.createElement('div');
  grid.className = 'ttt-board';
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', 'Tic-tac-toe board');
  const win = tttWinLine();
  const over = !!tttWinner(tttBoard);
  tttBoard.forEach((v, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ttt-cell' + (v === 'X' ? ' x' : v === 'O' ? ' o' : '') + (win && win.includes(i) ? ' win' : '');
    b.textContent = v || String(i + 1);
    if (v || over) {
      b.disabled = true;
      if (v) b.setAttribute('aria-label', `${v} at cell ${i + 1}`);
    } else {
      b.setAttribute('aria-label', `Play cell ${i + 1}`);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); tttClick(i + 1); });
    }
    grid.appendChild(b);
  });
  d.appendChild(grid);
  log.appendChild(d);
  screen.scrollTop = screen.scrollHeight;
}

function tttClick(pos) {
  if (!tttBoard) return;
  print(`<span class="prompt">${esc(promptStr())}</span> <span class="cmd">${esc('tictactoe ' + pos)}</span>`);
  tttPlay(pos);
  if (!coarsePointer) input.focus({ preventScroll: true });
}

function tttPrintScore() {
  print(`<span class="muted">score — you ${tttScore.w} : ${tttScore.l} AI · ${tttScore.d} draws</span>`);
}

function tttNewGame() {
  tttBoard = Array(9).fill('');
  print('<span class="ok">Tic-tac-toe</span> <span class="muted">— you are X, AI is O. Click a cell or type</span> <span class="ok">tictactoe &lt;1-9&gt;</span>');
  print('');
  tttPrintBoard();
  print('');
}

function tttFinish(result) {
  if (result === 'X') {
    tttScore.w++;
    print('<span class="ok">You win! 🎉</span>');
  } else if (result === 'O') {
    tttScore.l++;
    print('<span class="err">AI wins. Better luck next time.</span>');
  } else {
    tttScore.d++;
    print('<span class="muted">Draw.</span>');
  }
  tttSaveScore();
  tttBoard = null;
  tttPrintScore();
  print('<span class="muted">Type <span class="ok">tictactoe</span> for a rematch.</span>');
}

function tttPlay(pos) {
  if (!tttBoard) {
    tttBoard = Array(9).fill('');
    print('<span class="ok">Tic-tac-toe</span> <span class="muted">— you are X, AI is O.</span>');
    print('');
  }
  const i = pos - 1;
  if (tttBoard[i]) { print(`tictactoe: cell ${pos} is already taken`, 'err'); tttPrintBoard(); return; }
  tttBoard[i] = 'X';
  let r = tttWinner(tttBoard);
  if (r) { tttPrintBoard(); tttFinish(r); return; }
  tttBoard[tttBestMove(tttBoard)] = 'O';
  r = tttWinner(tttBoard);
  tttPrintBoard();
  if (r) tttFinish(r);
  else print('<span class="muted">Your move — click a cell or type tictactoe &lt;1-9&gt;.</span>');
}

const commands = {
  help(args) {
    if (args.length) {
      const h = HELP[args[0].toLowerCase()];
      if (h) print(`<span class="ok">${esc(args[0])}</span> — ${h}`);
      else   print(`help: no such command "${esc(args[0])}"`, 'err');
      return;
    }
    const items = Object.keys(HELP)
      .map(k => `<li><span class="ok">${esc(k)}</span> — ${esc(HELP[k])}</li>`)
      .join('\n');
    print(`Available commands:\n<ul class="helplist">\n${items}\n</ul>\nTab to autocomplete, ↑/↓ history, Ctrl+L clear.`);
  },

  about()  { print('Tomi — likes everything new and fun.'); },

  links() {
    print(`GitHub: <a href="https://github.com/tmdrkl" target="_blank">github.com/tmdrkl</a>
Telegram: <a href="https://t.me/tmdrkl" target="_blank">@tmdrkl</a>
Email: <a href="mailto:to@drkl.net">to@drkl.net</a>`);
  },

  async fastfetch(args) {
    const up = Math.floor((Date.now() - loadTime) / 1000);
    const upStr = up < 60 ? `${up} secs`
      : up < 3600 ? `${Math.floor(up/60)} mins ${up%60} secs`
      : `${Math.floor(up/3600)} hours ${Math.floor((up%3600)/60)} mins`;

    const asciiArt = [
      '        ████████',
      '      ████████████',
      '    ████    ████████',
      '  ████        ██████',
      ' ████          ██████',
      '████            ██████',
      '████            ██████',
      ' ████          ██████',
      '  ████        ██████',
      '    ████    ████████',
      '      ████████████',
      '        ████████',
    ];

    const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'unknown';
    const mem = navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : null;

    const infoLines = [
      `<span class="ok">${esc(getUsername())}@drkl</span>`,
      `<span class="muted">------------------</span>`,
      `<span class="blue">OS</span>: drklOS 1.0.0`,
      `<span class="blue">Host</span>: drkl.net (web terminal)`,
      `<span class="blue">Kernel</span>: drkl-sh 6.6.0`,
      `<span class="blue">Uptime</span>: ${upStr}`,
      `<span class="blue">Shell</span>: drkl-sh`,
      `<span class="blue">Resolution</span>: ${window.screen.width}×${window.screen.height}`,
      `<span class="blue">Browser</span>: ${browserName()}`,
      `<span class="blue">CPU</span>: ${cores}`,
      ...(mem ? [`<span class="blue">Memory</span>: ${mem}`] : []),
      `<span class="blue">Theme</span>: ${getTheme()}`,
    ];
    print(`<pre class="fastfetch">${renderFastfetch(asciiArt, infoLines)}</pre>`);
  },

  // Backwards-compat alias: `neofetch` still works.
  async neofetch(args) { return commands.fastfetch(args); },

  async fetch() {
    const up = Math.floor((Date.now() - loadTime) / 1000);
    const upStr = up < 60 ? `${up}s`
      : up < 3600 ? `${Math.floor(up/60)}m ${up%60}s`
      : `${Math.floor(up/3600)}h ${Math.floor((up%3600)/60)}m`;
    
    const asciiArt = [
      '        ████████',
      '      ████████████',
      '    ████    ████████',
      '  ████        ██████',
      ' ████          ██████',
      '████            ██████',
      '████            ██████',
      ' ████          ██████',
      '  ████        ██████',
      '    ████    ████████',
      '      ████████████',
      '        ████████',
    ];
    
    try {
      const res = await fetch(`${WORKER_URL}/geo`);
      if (res.ok) {
        const data = await res.json();

        const ua = navigator.userAgent;
        let osName = 'Unknown';
        if (ua.includes('Windows')) osName = 'Windows';
        else if (ua.includes('Mac')) osName = 'macOS';
        else if (ua.includes('Linux')) osName = 'Linux';
        else if (ua.includes('Android')) osName = 'Android';
        else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';

        const infoLines = [
          `<span class="ok">${esc(getUsername())}@drkl</span>`,
          `<span class="muted">------------------</span>`,
          `<span class="blue">OS</span>: ${osName}`,
          `<span class="blue">Host</span>: drkl.net (via Cloudflare edge)`,
          `<span class="blue">IP</span>: ${esc(data.ip || 'Unknown')}`,
          `<span class="blue">Country</span>: ${esc(data.country || 'Unknown')}`,
          `<span class="blue">Uptime</span>: ${upStr}`,
          `<span class="blue">Shell</span>: drkl-sh`,
          `<span class="blue">Resolution</span>: ${window.screen.width}×${window.screen.height}`,
          `<span class="blue">Browser</span>: ${browserName()}`,
          `<span class="blue">Theme</span>: ${getTheme()}`,
        ];
        print(`<pre class="fastfetch">${renderFastfetch(asciiArt, infoLines)}</pre>`);
        return;
      }
    } catch (e) {
      print(`<span class="err">Fetch failed: ${esc(e.message)}</span>`);
    }
  },

  banner() {
    print(`<pre class="ok">${figlet('drkl')}</pre>`);
    print('Welcome to <span class="ok">drkl.net</span>. Type <span class="ok">help</span> to get started.');
  },

  date() {
    print(new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' }));
  },

  echo(args) { 
    // Handle redirection: echo "text" > file or echo "text" >> file
    const redirectIdx = args.findIndex(a => a === '>' || a === '>>');
    if (redirectIdx > 0) {
      const append = args[redirectIdx] === '>>';
      const fileArg = args[redirectIdx + 1];
      if (!fileArg) { print('echo: missing file for redirection', 'err'); return; }
      const text = args.slice(0, redirectIdx).join(' ');
      const path = resolvePath(fileArg);
      const parent = path.slice(0, -1);
      const name = path[path.length - 1];
      const parentNode = getNode(parent);
      if (!parentNode || !isDir(parentNode)) { 
        print(`echo: cannot write to '${esc(fileArg)}': No such file or directory`, 'err'); 
        return; 
      }
      const existing = getNode(path);
      const newContent = append && existing && !isDir(existing) ? existing + '\n' + text : text;
      setNode(path, newContent);
      print(`<span class="muted">Written to ${esc(fileArg)}</span>`);
    } else {
      print(esc(args.join(' ')));
    }
  },

  ls(args) {
    const p = args[0] ? resolvePath(args[0]) : cwd;
    const node = getNode(p);
    if (node === undefined) { print(`ls: cannot access '${esc(args[0] || '')}': No such file or directory`, 'err'); return; }
    if (!isDir(node))       { print(`ls: '${esc(args[0])}' is not a directory`, 'err'); return; }
    const entries = Object.keys(node).map(k => ({ name: k, dir: isDir(node[k]) }));
    if (!entries.length) { print('(empty)', 'muted'); return; }
    print(entries.map(e => e.dir
      ? `<span class="dir">${esc(e.name)}/</span>`
      : `<span class="muted">${esc(e.name)}</span>`).join('  '));
  },

  cd(args) {
    const target = resolvePath(args[0]);
    const node = getNode(target);
    if (node === undefined) { print(`cd: no such file or directory: ${esc(args[0] || '')}`, 'err'); return; }
    if (!isDir(node))       { print(`cd: not a directory: ${esc(args[0])}`, 'err'); return; }
    cwd = target;
    refreshPrompt();
  },

  pwd() { print(pwdStr()); },

  cat(args) {
    if (!args.length) { print('cat: usage: cat <file>', 'err'); return; }
    const node = getNode(resolvePath(args[0]));
    if (node === undefined) { print(`cat: ${esc(args[0])}: No such file or directory`, 'err'); return; }
    if (isDir(node))        { print(`cat: ${esc(args[0])}: Is a directory`, 'err'); return; }
    print(esc(node));
  },

  tree(args) {
    const p = args[0] ? resolvePath(args[0]) : cwd;
    const node = getNode(p);
    if (node === undefined) { print(`tree: no such file or directory: ${esc(args[0] || '')}`, 'err'); return; }
    if (!isDir(node))       { print(`tree: '${esc(args[0])}' is not a directory`, 'err'); return; }
    const lines = [];
    treeWalk(node, '', lines, 0);
    print(lines.join('\n'));
  },

  history(args) {
    if (args[0] === '-c') { hist = []; histIdx = -1; sessionStorage.removeItem('drkl_hist'); print('history cleared', 'muted'); return; }
    if (!hist.length)     { print('history is empty', 'muted'); return; }
    print(hist.map((h, i) => `${String(i + 1).padStart(3)}  ${esc(h)}`).join('\n'));
  },

  blog() {
    const names = Object.keys(FS.blog);
    if (!names.length) { print('(empty)', 'muted'); return; }
    print('<span class="ok">Blog posts</span> — use <span class="ok">read &lt;n&gt;</span> or <span class="ok">read &lt;name.md&gt;</span>');
    print('<span class="muted">English + Bahasa Indonesia available (*.id.md = Indonesian).</span>');
    print('');
    const isID = (n) => n.endsWith('.id.md');
    const listGroup = (label, filter) => {
      const group = names.filter(filter);
      if (!group.length) return;
      print(`<span class="blue">${label}</span>`);
      group.forEach((name) => {
        const idx = names.indexOf(name) + 1;
        const title = (String(FS.blog[name]).match(/^#\s+(.+)$/m) || [])[1] || name;
        print(`  <span class="ok">${idx}.</span> ${esc(title)} <span class="muted">(${esc(name)})</span>`);
      });
    };
    listGroup('English', (n) => !isID(n));
    listGroup('Bahasa Indonesia', isID);
  },

  read(args) {
    if (chatMode) { print('read: exit chat mode first (/exit)', 'err'); return; }
    if (!args.length) { print('read: usage: read <n> | read <name>', 'err'); return; }
    const names = Object.keys(FS.blog);
    let name = null;
    const n = args[0];
    if (/^\d+$/.test(n)) {
      const idx = parseInt(n, 10);
      if (idx < 1 || idx > names.length) { print(`read: no post #${n}`, 'err'); return; }
      name = names[idx - 1];
    } else {
      const guess = n.endsWith('.md') ? n : n + '.md';
      if (names.includes(guess)) name = guess;
    }
    if (!name) { print(`read: no such post "${esc(args[0])}"`, 'err'); return; }
    print(cliFormat(String(FS.blog[name])));
  },

  dashboard() {
    print('<span class="muted">Opening dashboard...</span>');
    setTimeout(() => { location.href = 'stats.html'; }, 400);
  },

  chat() { enterChatMode(); },

  clear() { log.innerHTML = ''; hideList(); renderSuggestion(); },

  whoami() { print(esc(getUsername())); },

  username(args) {
    if (!args.length) {
      print(`username: <span class="ok">${esc(getUsername())}</span> <span class="muted">(default: ${DEFAULT_USER})</span>`);
      print('<span class="muted">usage: username &lt;name&gt; — 1-16 chars: a-z, 0-9, _ or -</span>');
      return;
    }
    const clean = setUsername(args[0]);
    if (!clean) { print('username: use 1-16 chars: a-z, 0-9, _ or -', 'err'); return; }
    refreshPrompt();
    refreshTitle();
    print(`username set to <span class="ok">${esc(clean)}</span>.`);
  },

  uname() { print(`drklOS 1.0.0 — kernel drkl-sh 6.6.0 (${getTheme()})`); },

  sudo() { print(`${esc(getUsername())} is not in the sudoers file. This incident will be reported.`, 'err'); },

  exit()  { print('logout — but you are still here. 😏 Type <span class="ok">clear</span> to start over.'); },

  rm(args) {
    const recursive = args.includes('-r') || args.includes('-R');
    const targets = args.filter(a => !a.startsWith('-'));
    if (!targets.length) { print('rm: usage: rm [-r] <file|dir>...', 'err'); return; }
    for (const target of targets) {
      const path = resolvePath(target);
      const node = getNode(path);
      if (node === undefined) { print(`rm: cannot remove '${esc(target)}': No such file or directory`, 'err'); continue; }
      if (isDir(node) && !recursive) { print(`rm: cannot remove '${esc(target)}': Is a directory (use -r)`, 'err'); continue; }
      if (deleteNode(path)) {
        print(`removed '${esc(target)}'`);
      } else {
        print(`rm: failed to remove '${esc(target)}'`, 'err');
      }
    }
  },

  mkdir(args) {
    if (!args.length) { print('mkdir: usage: mkdir <dir>...', 'err'); return; }
    for (const dir of args) {
      const path = resolvePath(dir);
      const parent = path.slice(0, -1);
      const name = path[path.length - 1];
      const parentNode = getNode(parent);
      if (!parentNode || !isDir(parentNode)) { print(`mkdir: cannot create directory '${esc(dir)}': No such file or directory`, 'err'); continue; }
      if (name in parentNode) { print(`mkdir: cannot create directory '${esc(dir)}': File exists`, 'err'); continue; }
      setNode(path, {});
      print(`created directory '${esc(dir)}'`);
    }
  },

  touch(args) {
    if (!args.length) { print('touch: usage: touch <file>...', 'err'); return; }
    for (const file of args) {
      const path = resolvePath(file);
      const parent = path.slice(0, -1);
      const name = path[path.length - 1];
      const parentNode = getNode(parent);
      if (!parentNode || !isDir(parentNode)) { print(`touch: cannot touch '${esc(file)}': No such file or directory`, 'err'); continue; }
      if (!(name in parentNode)) {
        setNode(path, '');
        print(`created file '${esc(file)}'`);
      } else {
        print(`touch: '${esc(file)}' already exists (use echo > to overwrite)`);
      }
    }
  },

  edit(args) {
    if (!args.length) { print('edit: usage: edit <file>', 'err'); return; }
    const path = resolvePath(args[0]);
    const parent = path.slice(0, -1);
    const name = path[path.length - 1];
    const parentNode = getNode(parent);
    if (!parentNode || !isDir(parentNode)) { print(`edit: cannot edit '${esc(args[0])}': No such file or directory`, 'err'); return; }
    const content = getNode(path);
    if (content === undefined) {
      setNode(path, '');
      openEditor(args[0], '');
    } else if (isDir(content)) {
      print(`edit: '${esc(args[0])}' is a directory`, 'err');
    } else {
      openEditor(args[0], content);
    }
  },

  theme(args) {
    const t = args[0];
    if (!t || !THEMES.includes(t)) { print(`usage: theme <${THEMES.join('|')}>`, 'err'); return; }
    setTheme(t);
    themeRainBurst(t);
    print(`Theme set to <span class="ok">${t}</span>.`);
  },

  tictactoe(args) {
    const sub = (args[0] || '').toLowerCase();
    if (!args.length) {
      if (!tttBoard) tttNewGame();
      else { tttPrintBoard(); print('<span class="muted">Your move — click a cell or type tictactoe &lt;1-9&gt;.</span>'); }
      return;
    }
    if (sub === 'new') { tttNewGame(); return; }
    if (sub === 'quit' || sub === 'exit' || sub === 'stop') {
      if (!tttBoard) { print('tictactoe: no active game', 'muted'); return; }
      tttBoard = null;
      print('<span class="muted">Game abandoned. Type <span class="ok">tictactoe</span> to start a new one.</span>');
      return;
    }
    if (sub === 'score') { tttPrintScore(); return; }
    if (sub === 'help') {
      print('usage: <span class="ok">tictactoe</span> | <span class="ok">tictactoe &lt;1-9&gt;</span> | <span class="ok">tictactoe new|score|quit</span>');
      return;
    }
    const pos = parseInt(sub, 10);
    if (!/^[1-9]$/.test(sub) || !(pos >= 1 && pos <= 9)) {
      print(`tictactoe: invalid move "${esc(args[0])}" — pick 1-9`, 'err');
      if (tttBoard) tttPrintBoard();
      else print('usage: <span class="ok">tictactoe &lt;1-9&gt;</span> — type <span class="ok">tictactoe</span> to start');
      return;
    }
    tttPlay(pos);
  },

  ttt(args) { return commands.tictactoe(args); },
};

// ── Autocomplete ─────────────────────────────────────
const suggestEl   = document.getElementById('suggest');
const suggestList = document.getElementById('suggestList');
const commandList = Object.keys(commands);
const PATH_CMDS   = { cd: true, ls: true, cat: true, tree: true, read: true, rm: true, mkdir: true, touch: true, edit: true };
let hist = [];
try { const h = JSON.parse(sessionStorage.getItem('drkl_hist')); if (Array.isArray(h)) hist = h; } catch {}
let histIdx = -1;
let pendingHist = '';
let tabIdx = -1;

let _measureEl = null;
function textWidth(s) {
  if (!_measureEl) {
    _measureEl = document.createElement('span');
    _measureEl.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;pointer-events:none;';
    _measureEl.style.font = getComputedStyle(input).font;
  }
  _measureEl.textContent = s;
  document.body.appendChild(_measureEl);
  const w = _measureEl.offsetWidth;
  _measureEl.remove();
  return w;
}

function completePath(partial) {
  const lastSlash = partial.lastIndexOf('/');
  const dirPart  = lastSlash >= 0 ? partial.slice(0, lastSlash + 1) : '';
  const namePart = lastSlash >= 0 ? partial.slice(lastSlash + 1) : partial;
  const dir  = resolvePath(dirPart || '~');
  const node = getNode(dir);
  if (!isDir(node)) return [];
  return Object.keys(node).filter(k => k.startsWith(namePart)).map(k => dirPart + k);
}

function getMatches(val) {
  const parts = val.split(/\s+/);
  if (parts.length === 1) {
    const v = parts[0].toLowerCase();
    if (!v) return [];
    return commandList.filter(c => c.startsWith(v)).map(c => ({ value: c, label: c }));
  }
  const cmd = parts[0].toLowerCase();
  if (!PATH_CMDS[cmd]) return [];
  const partial = val.slice(parts[0].length).replace(/^\s+/, '');
  return completePath(partial).map(p => ({ value: cmd + ' ' + p, label: p }));
}

function commonPrefix(arr) {
  if (!arr.length) return '';
  let p = arr[0];
  for (const s of arr) {
    let i = 0;
    while (i < p.length && i < s.length && p[i] === s[i]) i++;
    p = p.slice(0, i);
  }
  return p;
}

function setInput(v) {
  input.value = v;
  input.setSelectionRange(v.length, v.length);
}

function renderSuggestion() {
  if (chatMode) { suggestEl.textContent = ''; suggestEl.style.visibility = 'hidden'; return; }
  const val = input.value;
  const m = getMatches(val);
  let suffix = '';
  if (m.length) {
    const common = commonPrefix(m.map(x => x.value));
    if (common.length > val.length) suffix = common.slice(val.length);
  }
  if (suffix) {
    suggestEl.textContent = suffix;
    suggestEl.style.left = textWidth(val) + 'px';
    suggestEl.style.visibility = 'visible';
  } else {
    suggestEl.textContent = '';
    suggestEl.style.visibility = 'hidden';
  }
}

function acceptSuggestion() {
  const m = getMatches(input.value);
  if (!m.length) return;
  const common = commonPrefix(m.map(x => x.value));
  if (common.length > input.value.length) setInput(common);
  renderSuggestion();
}

function hideList() { suggestList.innerHTML = ''; tabIdx = -1; }

function showList(m, active) {
  suggestList.innerHTML = '';
  m.forEach((x, i) => {
    const s = document.createElement('span');
    if (i === active) s.className = 'active';
    s.textContent = x.label;
    s.addEventListener('click', () => { setInput(x.value); hideList(); renderSuggestion(); input.focus(); });
    suggestList.appendChild(s);
  });
}

function doTab() {
  const m = getMatches(input.value);
  if (!m.length) { hideList(); return; }
  const common = commonPrefix(m.map(x => x.value));
  if (m.length === 1) {
    setInput(m[0].value);
    hideList();
  } else if (common.length > input.value.length) {
    setInput(common);
    hideList();
  } else {
    tabIdx = (tabIdx + 1) % m.length;
    setInput(m[tabIdx].value);
    showList(m, tabIdx);
  }
  renderSuggestion();
}

function goHistory(dir) {
  if (!hist.length) return;
  if (histIdx === -1) pendingHist = input.value;
  if (dir < 0) {
    histIdx = histIdx === -1 ? hist.length - 1 : Math.max(0, histIdx - 1);
  } else {
    if (histIdx === -1) return;
    histIdx++;
    if (histIdx >= hist.length) {
      histIdx = -1;
      setInput(pendingHist);
      renderSuggestion();
      hideList();
      return;
    }
  }
  setInput(hist[histIdx]);
  renderSuggestion();
  hideList();
}

// ── Input events ─────────────────────────────────────
input.addEventListener('input', () => { hideList(); renderSuggestion(); });

input.addEventListener('keydown', (e) => {
  // Editor mode handling
  if (editorMode) {
    handleEditorInput(e);
    return;
  }

  // Ctrl combos
  if (e.ctrlKey && e.key === 'l') { e.preventDefault(); log.innerHTML = ''; hideList(); renderSuggestion(); return; }
  if (e.ctrlKey && e.key === 'u') { e.preventDefault(); input.value = ''; hideList(); renderSuggestion(); return; }
  if (e.ctrlKey && e.key === 'c') {
    e.preventDefault();
    if (chatBusy) stopChat();
    if (input.value) print('^C', 'muted');
    input.value = '';
    hideList(); renderSuggestion();
    return;
  }
  if (e.ctrlKey && e.key === 'w') {
    e.preventDefault();
    const pos = input.selectionStart;
    const after = input.value.slice(pos);
    input.value = input.value.slice(0, pos).replace(/\S*\s*$/, '') + after;
    input.setSelectionRange(input.value.length - after.length, input.value.length - after.length);
    hideList(); renderSuggestion();
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    if (chatBusy) stopChat();
    hideList(); renderSuggestion();
    return;
  }
  if (e.key === 'Tab')    { e.preventDefault(); doTab(); return; }
  if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) { acceptSuggestion(); return; }
  if (e.key === 'ArrowUp')   { e.preventDefault(); goHistory(-1); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); goHistory(1);  return; }
  if (e.key !== 'Enter') return;

  const raw = input.value.trim();
  input.value = '';
  hideList(); renderSuggestion();
  if (!raw) return;

  // ── Chat mode ──
  if (chatMode) {
    const cmd = raw.toLowerCase().trim();
    // Args are taken from `raw`, never from the lowercased copy — model names and
    // the owner PIN are case sensitive.
    const arg = raw.slice(raw.indexOf(' ') + 1).trim();

    // Slash commands stay available while an answer is streaming.
    if (!cmd.startsWith('/') && chatBusy) {
      // Don't throw away what was typed — put it back and let them send it later.
      setInput(raw);
      renderSuggestion();
      print('<span class="muted">still generating — press Esc to stop, or /stop.</span>');
      return;
    }
    if (cmd === '/exit' || cmd === '/quit') { exitChatMode(); return; }
    if (cmd === '/clear') { log.innerHTML = ''; return; }
    if (cmd === '/new') {
      chatHistory = [];
      lastPrompt = '';
      trimNoticeShown = false;
      print('<span class="muted">New conversation started.</span>');
      return;
    }
    if (cmd === '/stop') {
      if (chatBusy) stopChat();
      else print('<span class="muted">nothing is generating.</span>');
      return;
    }
    if (cmd === '/retry') {
      const prompt = lastPrompt || (chatHistory.filter(m => m.role === 'user').pop() || {}).content;
      if (!prompt) { print('<span class="muted">nothing to retry yet.</span>'); return; }
      sendChatMessage(prompt, true);
      return;
    }
    if (cmd === '/help') {
      const cmds = [
        ['/exit', 'leave chat mode'],
        ['/clear', 'clear screen'],
        ['/new', 'new conversation'],
        ['/stop', 'interrupt the answer (Esc)'],
        ['/retry', 'ask the last question again'],
        ['/models', 'list available models'],
        ['/model', 'show current model'],
        ['/model X', 'switch to model X'],
        ['/login <PIN>', 'owner: lift rate limit'],
        ['/stats', 'chat usage stats'],
        ['/history', 'show chat history (-f full)'],
        ['/export', 'download chat log'],
      ];
      let html = '<span class="chat-help">';
      cmds.forEach(([name, desc]) => {
        html += `<span class="cmd-name">${esc(name)}</span><span class="cmd-desc">${esc(desc)}</span>`;
      });
      html += '</span>';
      print(html);
      return;
    }
    if (raw.toLowerCase().trim() === '/models') {
      showModels();
      return;
    }
    if (cmd === '/stats') {
      showChatStats();
      return;
    }
    if (cmd.startsWith('/login ')) {
      chatLogin(arg);
      return;
    }
    if (cmd === '/history' || cmd === '/history -f') {
      showChatHistory(cmd === '/history -f');
      return;
    }
    if (cmd === '/export') {
      exportChatLog();
      return;
    }

    if (cmd === '/model') {
      print(`<span class="muted">current: ${esc(chatModel)}${chatModels.length ? '' : ' (default)'}</span>`);
      return;
    }
    if (cmd.startsWith('/model ')) {
      if (!arg) { print('usage: <span class="ok">/model &lt;name&gt;</span> — see /models'); return; }
      chatModel = arg;
      const known = !chatModels.length || chatModels.includes(arg);
      print(`<span class="muted">model → ${esc(chatModel)}</span>${known ? '' : ' <span class="err">(not in /models — the request may fail)</span>'}`);
      return;
    }
    sendChatMessage(raw);
    return;
  }

  // ── Terminal mode ──
  print(`<span class="prompt">${esc(promptStr())}</span> <span class="cmd">${esc(raw)}</span>`);
  if (raw !== hist[hist.length - 1]) {
    hist.push(raw);
    try { sessionStorage.setItem('drkl_hist', JSON.stringify(hist.slice(-200))); } catch {}
  }
  histIdx = -1;
  const parts = raw.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  if (commands[cmd]) commands[cmd](args);
  else print(`command not found: ${esc(raw)}. Type <span class="ok">help</span>.`, 'err');
});

// Click terminal to focus — but never steal focus while text is being selected,
// and on touch devices leave the scrollback alone so tapping it to copy text
// does not pop the on-screen keyboard open.
const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
document.getElementById('term').addEventListener('click', (e) => {
  // Leave buttons and links alone — stealing focus from a copy button (or a
  // keyboard user) would undo the click.
  if (e.target.closest && e.target.closest('button, a')) return;
  const sel = window.getSelection && window.getSelection();
  if (sel && String(sel).length) return;
  if (coarsePointer && log.contains(e.target)) return;
  input.focus({ preventScroll: true });
});

// ── Mobile keyboard / viewport handling ──
// visualViewport shrinks when the on-screen keyboard opens — keep the latest
// output visible without relying on fragile 100dvh - Npx hacks.
if (window.visualViewport) {
  let vvT = null;
  window.visualViewport.addEventListener('resize', () => {
    clearTimeout(vvT);
    vvT = setTimeout(() => {
      if (isNearBottom()) screen.scrollTop = screen.scrollHeight;
    }, 50);
  });
}
input.addEventListener('focus', () => {
  setTimeout(() => {
    if (isNearBottom()) screen.scrollTop = screen.scrollHeight;
  }, 150);
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SEEN_INTRO = 'drkl_seen_intro';
let hasSeenIntro = false;
try { hasSeenIntro = localStorage.getItem(SEEN_INTRO) === '1'; } catch {}

const BOOT_LINES = [
  'Welcome to <span class="ok">drkl.net</span>.',
  `<span class="muted">drklOS 1.0.0 — drkl-sh shell · ${getTheme()} theme</span>`,
  'Type <span class="ok">help</span> for commands. Type <span class="ok">chat</span> to talk to AI.',
];

let bootDone = false;
let bootTimers = [];
let bootIdx = 0;

function finishBoot() {
  if (bootDone) return;
  bootDone = true;
  bootTimers.forEach(clearTimeout);
  bootTimers = [];
  for (let i = bootIdx; i < BOOT_LINES.length; i++) print(BOOT_LINES[i]);
  try { localStorage.setItem(SEEN_INTRO, '1'); } catch {}
}

if (reducedMotion || hasSeenIntro) {
  bootDone = true;
  BOOT_LINES.forEach(print);
  try { localStorage.setItem(SEEN_INTRO, '1'); } catch {}
} else {
  BOOT_LINES.forEach((html, i) => {
    bootTimers.push(setTimeout(() => {
      bootIdx = i + 1;
      print(html);
      if (i === BOOT_LINES.length - 1) {
        bootDone = true;
        bootTimers = [];
        try { localStorage.setItem(SEEN_INTRO, '1'); } catch {}
      }
    }, 120 + i * 240));
  });
  ['keydown', 'click', 'touchstart'].forEach(ev =>
    document.addEventListener(ev, finishBoot, { once: true, passive: true }));
}

refreshPrompt();
refreshTitle();
loadChatModels();

// ── Theme toggle ─────────────────────────────────────
document.getElementById('themeToggle').addEventListener('click', () => {
  const cur  = getTheme();
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  setTheme(next);
  themeRainBurst(next);
});
