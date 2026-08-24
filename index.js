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
const FS = {
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
};

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

function isDir(n) { return !!n && typeof n === 'object'; }

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
  print('<span class="muted">╔══════════════════════════════════════════╗</span>');
  print('<span class="muted">║</span>  <span class="ok">AI Chat Mode</span>                           <span class="muted">║</span>');
  print('<span class="muted">║</span>  /exit   leave    /model  change model  <span class="muted">║</span>');
  print('<span class="muted">║</span>  /clear  reset    /help   chat commands <span class="muted">║</span>');
  print('<span class="muted">╚══════════════════════════════════════════╝</span>');
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

function showChatHistory() {
  if (!chatHistory.length) {
    print('<span class="muted">No messages yet.</span>');
    return;
  }
  print('<span class="ok">Chat history:</span>');
  print('');
  chatHistory.forEach((msg, i) => {
    if (msg.role === 'user') {
      print(`<span class="chat-you">you></span> ${esc(msg.content)}`);
    } else {
      // Show first 120 chars of AI response
      const preview = msg.content.length > 120 ? msg.content.slice(0, 120) + '...' : msg.content;
      print(`<span class="chat-ai">ai></span> ${esc(preview)}`);
    }
  });
  print('');
  print(`<span class="muted">${chatHistory.length} messages total.</span>`);
}

function cliFormat(text) {
  // Format markdown-like text for CLI: bold `text`, code `code`, separators
  return text
    .replace(/```([\s\S]*?)```/g, '<span class="chat-code">$1</span>')
    .replace(/`([^`]+)`/g, '<span class="chat-inline">`$1`</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<span class="chat-bold">$1</span>')
    .replace(/^---+$/gm, '<span class="muted">────────────────────────────────</span>')
    .replace(/^# (.+)$/gm, '<span class="ok">$1</span>')
    .replace(/^## (.+)$/gm, '<span class="blue">$1</span>');
}

async function sendChatMessage(text) {
  if (chatBusy) return;

  chatHistory.push({ role: 'user', content: text });
  print(`<span class="chat-you">you></span> ${esc(text)}`);

  // Separator
  const sepEl = document.createElement('div');
  sepEl.className = 'row muted';
  sepEl.textContent = '· · ·';
  log.appendChild(sepEl);
  screen.scrollTop = screen.scrollHeight;

  // AI reply container
  const replyEl = document.createElement('div');
  replyEl.className = 'row chat-reply';
  log.appendChild(replyEl);
  screen.scrollTop = screen.scrollHeight;

  chatBusy = true;
  input.disabled = true;

  try {
    const res = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: chatModel, messages: chatHistory }),
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
        screen.scrollTop = screen.scrollHeight;
      }
      if (streamDone && (replyEl._shown || 0) >= plain.length) {
        clearInterval(timer);
        replyEl.innerHTML = '<span class="chat-ai">ai></span> ' + cliFormat(plain);
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
    chatHistory.push({ role: 'assistant', content: full });
  } catch (e) {
    replyEl.innerHTML = `<span class="chat-ai">ai></span> <span class="err">Error: ${esc(e.message)}</span>`;
    chatHistory.pop();
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
  neofetch: 'system info in neofetch style',
  banner:   'display the drkl logo',
  date:     'current date & time',
  echo:     'display text, e.g. echo hello',
  ls:       'list directory contents',
  cd:       'change directory',
  pwd:      'print working directory',
  cat:      'show file contents',
  tree:     'directory tree',
  history:  'command history (-c to clear)',
  chat:     'start AI chat mode',
  clear:    'clear the screen',
  whoami:   'show current user',
  uname:    'system info',
  sudo:     'run as root (will fail)',
  theme:    'switch theme (dark|light)',
  exit:     'exit the terminal',
  rm:       'delete files (read-only)',
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

  neofetch() {
    const up = Math.floor((Date.now() - loadTime) / 1000);
    const upStr = up < 60 ? `${up}s`
      : up < 3600 ? `${Math.floor(up/60)}m ${up%60}s`
      : `${Math.floor(up/3600)}h ${Math.floor((up%3600)/60)}m`;
    print(`<pre>      @ @          <span class="ok">tomi@drkl</span>
     (v v)          <span class="muted">----------</span>
   ooO--(_)--Ooo    <span class="blue">OS</span>: drkl.my.id 1.0
                    <span class="blue">Host</span>: Terminal web
                    <span class="blue">Uptime</span>: ${upStr}
                    <span class="blue">Shell</span>: drkl-sh
                    <span class="blue">Res</span>: ${screen.width}×${screen.height}
                    <span class="blue">Browser</span>: ${browserName()}
                    <span class="blue">Theme</span>: ${getTheme()}</pre>`);
  },

  banner() {
    print(`<pre class="ok">${figlet('drkl')}</pre>`);
    print('Welcome to <span class="ok">drkl.my.id</span>. Type <span class="ok">help</span> to get started.');
  },

  date() {
    print(new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' }));
  },

  echo(args) { print(esc(args.join(' '))); },

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

  chat() { enterChatMode(); },

  clear() { log.innerHTML = ''; hideList(); renderSuggestion(); },

  whoami() { print('tomi'); },

  uname() { print(`drklOS 1.0.0 — kernel drkl-sh 6.6.0 (${getTheme()})`); },

  sudo() { print('tomi is not in the sudoers file. This incident will be reported.', 'err'); },

  exit()  { print('logout — but you are still here. 😏 Type <span class="ok">clear</span> to start over.'); },
  rm()    { print('rm: read-only filesystem.', 'err'); },

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
const PATH_CMDS   = { cd: true, ls: true, cat: true, tree: true };
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
    if (raw === '/exit' || raw === '/quit') { exitChatMode(); return; }
    if (raw === '/clear') { log.innerHTML = ''; return; }
    if (raw === '/new') { chatHistory = []; print('<span class="muted">New conversation started.</span>'); return; }
    if (raw === '/help') {
      print('<span class="muted">/exit      leave chat mode</span>');
      print('<span class="muted">/clear     clear screen</span>');
      print('<span class="muted">/new       new conversation</span>');
      print('<span class="muted">/models    list available models</span>');
      print('<span class="muted">/model     show current model</span>');
      print('<span class="muted">/model X   switch to model X</span>');
      print('<span class="muted">/history   show chat history</span>');
      return;
    }
    if (raw === '/models') {
      showModels();
      return;
    }
    if (raw === '/history') {
      showChatHistory();
      return;
    }

    if (raw === '/model') {
      print(`<span class="muted">current: ${esc(chatModel || 'none')}</span>`);
      return;
    }
    if (raw.startsWith('/model ')) {
      chatModel = raw.slice(7).trim();
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
