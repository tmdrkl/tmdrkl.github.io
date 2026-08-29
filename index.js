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
  'links.txt': 'GitHub: https://github.com/tmdrkl\nTelegram: https://t.me/tmdrkl\nEmail: to@drkl.my.id',
  'README.md': '# drkl.my.id\n\nA terminal with a built-in AI chat.\nType chat to start talking to the AI.',
  'projects': {
    'terminal': 'This is it — the web terminal you are using right now.',
  },
  'notes': {
    'todo.txt': '- push website\n- make a blog\n- have lunch',
    'ide.txt':  'try making another game on drkl.my.id',
  },
  'blog': {
    'mulai.md': [
      '# Selamat datang di drkl.my.id',
      '',
      'Situs ini dimulai dari satu ide sederhana: membuat landing page personal',
      'yang tidak membosankan. Alih-alih halaman statis biasa, saya bikin terminal',
      'web interaktif yang bisa dipakai asli — lengkap dengan virtual filesystem.',
      '',
      '## Fitur',
      '',
      '- **Terminal** — `ls`, `cd`, `cat`, `tree`, `neofetch`, dan lainnya',
      '- **AI Chat** — ketik `chat` untuk ngobrol dengan AI (Groq)',
      '- **Tema** — dark/light, ikut preferensi sistem atau manual',
      '- **History** — riwayat perintah tersimpan antar sesi',
      '',
      'Situs ini berjalan 100% di sisi klien. Backend hanya dipakai untuk AI chat.',
      '',
      'Selamat menjelajah. Ketik `help` untuk daftar perintah.'
    ].join('\n'),
    'ai-chat.md': [
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
    'stack.md': [
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
function promptStr() { return `tomi@drkl:${pwdStr()}$`; }
function refreshPrompt() { promptEl.textContent = promptStr(); }

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
  input.style.background = 'var(--code-bg)';
}

function closeEditor(saved) {
  editorMode = false;
  editorFile = '';
  editorContent = '';
  editorLines = [];
  editorCursor = 0;
  input.placeholder = '';
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

function renderNeofetch(ascii, info) {
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
let chatMode = false;
let chatHistory = [];
let chatBusy = false;
let chatModel = '';
let chatModels = [];

function enterChatMode() {
  chatMode = true;
  chatHistory = [];
  promptEl.textContent = 'you>';
  titleText.textContent = 'chat mode — /exit to leave';
  print('');
  const cmds = [
    ['/exit', 'leave chat mode'],
    ['/clear', 'reset'],
    ['/help', 'chat commands'],
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
  titleText.textContent = 'tomi@drkl: ~';
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
      const preferred = 'openai/gpt-oss-120b';
      chatModel = chatModels.includes(preferred) ? preferred : chatModels[0];
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
  let log = `drkl.my.id chat log\nModel: ${chatModel}\nDate: ${new Date().toLocaleString()}\n${'='.repeat(40)}\n\n`;
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
  const safe = esc(text);

  // Pull fenced code blocks out first so later rules can't touch them
  const blocks = [];
  const noBlocks = safe.replace(/```(\w+)?[\s\n]*([\s\S]*?)```/g, (_m, lang, code) => {
    blocks.push({ lang: lang || '', code });
    return '\u0000CODE' + (blocks.length - 1) + '\u0000';
  });

  const body = noBlocks
    .replace(/`([^`]+)`/g, '<span class="chat-inline">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<span class="chat-bold">$1</span>')
    .replace(/\*([^*\n]+)\*/g, '<span class="chat-italic">$1</span>')
    .replace(/^---+$/gm, '<span class="muted">────────────────────────────────</span>')
    .replace(/^&gt;\s*(.*)$/gm, '<span class="chat-quote">$1</span>')
    .replace(/^(#{1,6})\s+(.+)$/gm, (_m, hashes, content) => {
      const cls = hashes.length === 1 ? 'chat-h1' : hashes.length === 2 ? 'chat-h2' : 'chat-h3';
      return `<span class="${cls}">${content}</span>`;
    })
    .replace(/^([-*+])\s+(?:\[(?:[ xX])\]\s+)?(.+)$/gm, (_m, marker, content) => {
      const task = _m.match(/\[([ xX])\]/);
      if (task) {
        const done = /x/i.test(task[1]);
        return `<span class="chat-task${done ? ' done' : ''}">${done ? '☑' : '☐'} ${content}</span>`;
      }
      return `<span class="chat-bullet">${marker}</span> ${content}`;
    })
    .replace(/^(\d+)\.\s+(.+)$/gm, '<span class="chat-num">$1</span> $2')
    .replace(/\n\|([^\n]+)\|\n\|([-:| ]+)\|\n((?:\|[^\n]*\|\n?)+)/g, (match, header, separator, rows) => {
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

  return body.replace(/\u0000CODE(\d+)\u0000/g, (_m, i) => {
    const b = blocks[Number(i)];
    const highlighted = highlightCode(b.code, b.lang);
    const lang = b.lang ? `<span class="chat-code-lang">${b.lang}</span>` : '';
    return `<span class="chat-code">${lang}${highlighted}</span>`;
  });
}

// Syntax highlighting for code blocks
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
  
  const kw = keywords[lang.toLowerCase()] || [];
  const kwPattern = kw.length ? new RegExp(`\\b(${kw.join('|')})\\b`, 'g') : null;
  
  let highlighted = esc(code);
  
  // Strings (double and single quoted)
  highlighted = highlighted.replace(/"(?:[^"\\]|\\.)*"/g, '<span class="hl-str">$&</span>');
  highlighted = highlighted.replace(/'(?:[^'\\]|\\.)*'/g, '<span class="hl-str">$&</span>');
  
  // Template literals (JS/TS)
  highlighted = highlighted.replace(/`(?:[^`\\]|\\.)*`/g, '<span class="hl-str">$&</span>');
  
  // Comments
  highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="hl-comment">$&</span>');
  highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, '<span class="hl-comment">$&</span>');
  highlighted = highlighted.replace(/#.*$/gm, '<span class="hl-comment">$&</span>');
  
  // Numbers
  highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="hl-num">$&</span>');
  
  // Keywords
  if (kwPattern) {
    highlighted = highlighted.replace(kwPattern, '<span class="hl-kw">$&</span>');
  }
  
  // Functions (identifier followed by ()
  highlighted = highlighted.replace(/\b([a-zA-Z_$][\w$]*)\s*\(/g, '<span class="hl-func">$1</span>(');
  
  // Class/Type names (PascalCase)
  highlighted = highlighted.replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, '<span class="hl-type">$1</span>');
  
  // Decorators / annotations
  highlighted = highlighted.replace(/@\w+/g, '<span class="hl-decorator">$&</span>');
  
  return highlighted;
}

function isNearBottom() {
  return screen.scrollHeight - screen.scrollTop - screen.clientHeight < 50;
}

async function sendChatMessage(text) {
  if (chatBusy) return;

  chatHistory.push({ role: 'user', content: text, time: Date.now() });
  print(`<span class="chat-you">you></span> ${esc(text)}`);

  // Separator
  const sepEl = document.createElement('div');
  sepEl.className = 'row muted';
  sepEl.textContent = '· · ·';
  log.appendChild(sepEl);
  if (isNearBottom()) screen.scrollTop = screen.scrollHeight;

  // AI reply container
  const replyEl = document.createElement('div');
  replyEl.className = 'row chat-reply';
  log.appendChild(replyEl);
  if (isNearBottom()) screen.scrollTop = screen.scrollHeight;

  chatBusy = true;
  input.disabled = true;

  try {
    const chatToken = sessionStorage.getItem('drkl_chat_token') || '';
    const res = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(chatToken ? { Authorization: 'Bearer ' + chatToken } : {}) },
      body: JSON.stringify({ model: chatModel, messages: chatHistory.map(({ role, content }) => ({ role, content })), }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '', full = '', streamDone = false;

    // Typewriter effect
    const timer = setInterval(() => {
      const plain = full.replace(/<br\s*\/?>/gi, '\n');
      if (replyEl._shown < plain.length) {
        replyEl._shown = Math.min(plain.length, (replyEl._shown || 0) + 3);
        replyEl.innerHTML = '<span class="chat-ai">ai></span> ' + cliFormat(plain.slice(0, replyEl._shown));
        if (isNearBottom()) screen.scrollTop = screen.scrollHeight;
      }
      if (streamDone && (replyEl._shown || 0) >= plain.length) {
        clearInterval(timer);
        replyEl.innerHTML = '<span class="chat-ai">ai></span> ' + cliFormat(plain);
        if (isNearBottom()) screen.scrollTop = screen.scrollHeight;
      }
    }, 25);
    replyEl._shown = 0;

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
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) full += delta;
        } catch {}
      }
    }
    streamDone = true;

    if (!full) {
      replyEl.innerHTML = '<span class="chat-ai">ai></span> <span class="muted">(no response)</span>';
    }
    chatHistory.push({ role: 'assistant', content: full, time: Date.now() });
  } catch (e) {
    replyEl.innerHTML = `<span class="chat-ai">ai></span> <span class="err">Error: ${esc(e.message)}</span>`;
  } finally {
    chatBusy = false;
    input.disabled = false;
    input.focus();
  }
}

// ══════════════════════════════════════════════════════
//  TERMINAL COMMANDS
// ══════════════════════════════════════════════════════
const HELP = {
  help:     'list available commands',
  about:    'a bit about me',
  links:    'contacts & github',
  neofetch: 'system info in neofetch style (-f to fetch geo/IP)',
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
  uname:    'system info',
  sudo:     'run as root (will fail)',
  theme:    'switch theme (dark|light)',
  exit:     'exit the terminal',
  rm:       'delete files or directories (-r for recursive)',
  mkdir:    'create a directory',
  touch:    'create an empty file',
  edit:     'edit a file in the terminal text editor',
};

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
Email: <a href="mailto:to@drkl.my.id">to@drkl.my.id</a>`);
  },

async neofetch(args) {
    const showFetch = args.includes('--fetch') || args.includes('-f');
    const up = Math.floor((Date.now() - loadTime) / 1000);
    const upStr = up < 60 ? `${up}s`
      : up < 3600 ? `${Math.floor(up/60)}m ${up%60}s`
      : `${Math.floor(up/3600)}h ${Math.floor((up%3600)/60)m}`;
    
    // ASCII art for neofetch (side-by-side)
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
    
    if (showFetch) {
      print('<span class="muted">Fetching system info...</span>');
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
            `<span class="ok">tomi@drkl</span>`,
            `<span class="muted">------------------</span>`,
            `<span class="blue">OS</span>: ${osName}`,
            `<span class="blue">Host</span>: drkl.my.id (via Cloudflare edge)`,
            `<span class="blue">IP</span>: ${esc(data.ip || 'Unknown')}`,
            `<span class="blue">Country</span>: ${esc(data.country || 'Unknown')}`,
            `<span class="blue">Uptime</span>: ${upStr}`,
            `<span class="blue">Shell</span>: drkl-sh`,
            `<span class="blue">Resolution</span>: ${window.screen.width}×${window.screen.height}`,
            `<span class="blue">Browser</span>: ${browserName()}`,
            `<span class="blue">Theme</span>: ${getTheme()}`,
            `<span class="muted">Geo data berasal dari Worker sendiri (tanpa pihak ketiga)</span>`,
          ];
          print(`<pre class="neofetch">${renderNeofetch(asciiArt, infoLines)}</pre>`);
          return;
        }
      } catch (e) {
        print(`<span class="err">Fetch failed: ${esc(e.message)}</span>`);
      }
    }
    
    // Local fallback
    const infoLines = [
      `<span class="ok">tomi@drkl</span>`,
      `<span class="muted">------------------</span>`,
      `<span class="blue">OS</span>: drkl.my.id 1.0`,
      `<span class="blue">Host</span>: Terminal web`,
      `<span class="blue">Uptime</span>: ${upStr}`,
      `<span class="blue">Shell</span>: drkl-sh`,
      `<span class="blue">Resolution</span>: ${window.screen.width}×${window.screen.height}`,
      `<span class="blue">Browser</span>: ${browserName()}`,
      `<span class="blue">Theme</span>: ${getTheme()}`,
      `<span class="muted">Tip: use <span class="ok">neofetch -f</span> for geo info</span>`,
    ];
    print(`<pre class="neofetch">${renderNeofetch(asciiArt, infoLines)}</pre>`);
  },

  banner() {
    print(`<pre class="ok">${figlet('drkl')}</pre>`);
    print('Welcome to <span class="ok">drkl.my.id</span>. Type <span class="ok">help</span> to get started.');
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
    print('');
    names.forEach((name, i) => {
      const title = (String(FS.blog[name]).match(/^#\s+(.+)$/m) || [])[1] || name;
      print(`  <span class="ok">${i + 1}.</span> ${esc(title)} <span class="muted">(${esc(name)})</span>`);
    });
  },

  read(args) {
    if (chatMode) { print('read: keluar dari chat mode dulu (/exit)', 'err'); return; }
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

  whoami() { print('tomi'); },

  uname() { print(`drklOS 1.0.0 — kernel drkl-sh 6.6.0 (${getTheme()})`); },

  sudo() { print('tomi is not in the sudoers file. This incident will be reported.', 'err'); },

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
  if (e.key === 'Escape') { e.preventDefault(); hideList(); renderSuggestion(); return; }
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
    if (cmd === '/exit' || cmd === '/quit') { exitChatMode(); return; }
    if (cmd === '/clear') { log.innerHTML = ''; return; }
    if (cmd === '/new') { chatHistory = []; print('<span class="muted">New conversation started.</span>'); return; }
    if (cmd === '/help') {
      const cmds = [
        ['/exit', 'leave chat mode'],
        ['/clear', 'clear screen'],
        ['/new', 'new conversation'],
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
      chatLogin(cmd.slice(7).trim());
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
      print(`<span class="muted">current: ${esc(chatModel || 'none')}</span>`);
      return;
    }
    if (cmd.startsWith('/model ')) {
      chatModel = cmd.slice(7).trim();
      print(`<span class="muted">model → ${esc(chatModel)}</span>`);
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

// Click terminal to focus
document.getElementById('term').addEventListener('click', () => input.focus());

// Mobile focus
if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  input.addEventListener('focus', () => {
    setTimeout(() => input.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
  });
}

// ── Boot ─────────────────────────────────────────────
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SEEN_INTRO = 'drkl_seen_intro';
let hasSeenIntro = false;
try { hasSeenIntro = localStorage.getItem(SEEN_INTRO) === '1'; } catch {}

const BOOT_LINES = [
  'Welcome to <span class="ok">drkl.my.id</span>.',
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
loadChatModels();

// ── Theme toggle ─────────────────────────────────────
document.getElementById('themeToggle').addEventListener('click', () => {
  const cur  = getTheme();
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  setTheme(next);
  themeRainBurst(next);
});
