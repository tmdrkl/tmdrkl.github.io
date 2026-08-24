import { getTheme, setTheme, themeRainBurst, THEMES } from './theme.js';

const WORKER_URL = "https://groq-chat.tomx13.workers.dev";

const modelSelect = document.getElementById("model-select");
const messagesEl = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const statusEl = document.getElementById("status");

let history = [];
let markedLib = null;
let dompurifyLib = null;
let libsLoading = null;

async function loadMarkdownLibs() {
  if (markedLib && dompurifyLib) return;
  if (libsLoading) return libsLoading;
  libsLoading = (async () => {
    try {
      const [markedMod, dompurifyMod] = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/marked@12/+esm'),
        import('https://cdn.jsdelivr.net/npm/dompurify@3/+esm')
      ]);
      markedLib = markedMod.marked;
      dompurifyLib = dompurifyMod.default;
    } catch (e) {
      console.warn('Failed to load markdown libs:', e);
    }
  })();
  return libsLoading;
}

function addMessage(role, content, error = false) {
  const div = document.createElement("div");
  div.className = `msg ${role}` + (error ? " error" : "");
  div.textContent = content;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function setStatus(text) {
  statusEl.textContent = text;
}

async function renderMarkdown(el, text) {
  await loadMarkdownLibs();
  if (markedLib && dompurifyLib) {
    el.classList.add("md");
    const html = markedLib.parse(text, { breaks: true });
    el.innerHTML = dompurifyLib.sanitize(html);
  } else {
    el.textContent = text;
  }
}

let typingTimer = null;
function startTyping(el, getTarget, isDone) {
  stopTyping();
  el._shown = 0;
  el.classList.add("typing");
  typingTimer = setInterval(() => {
    const target = getTarget().replace(/<br\s*\/?>/gi, "\n");
    if (el._shown < target.length) {
      const step = 3;
      el._shown = Math.min(target.length, el._shown + step);
      el.textContent = target.slice(0, el._shown);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    if (isDone() && el._shown >= target.length) {
      stopTyping();
      el.classList.remove("typing");
      renderMarkdown(el, target);
    }
  }, 25);
}

function stopTyping() {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
}

async function loadModels() {
  setStatus("Memuat daftar model...");
  try {
    const res = await fetch(`${WORKER_URL}/models`);
    if (!res.ok) throw new Error((await res.text()).slice(0, 200));
    const data = await res.json();
    const models = Array.isArray(data.models) ? data.models : [];
    models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      modelSelect.appendChild(opt);
    });
    if (models.length) {
      const preferred = "openai/gpt-oss-120b";
      if (models.includes(preferred)) modelSelect.value = preferred;
      setStatus("");
    } else {
      setStatus("Tidak ada model ditemukan.");
    }
  } catch (e) {
    setStatus(`Gagal memuat model: ${e.message}`);
  }
}

async function sendMessage(text) {
  const model = modelSelect.value;
  if (!model) {
    addMessage("bot", "Pilih model terlebih dahulu.", true);
    return;
  }

  history.push({ role: "user", content: text });
  addMessage("user", text);

  const reply = addMessage("bot", "");
  reply.classList.add("typing");
  sendBtn.disabled = true;
  input.value = "";
  input.focus();

  try {
    const res = await fetch(`${WORKER_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: history }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let streamDone = false;

    startTyping(reply, () => full, () => streamDone);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) full += delta;
        } catch { /* abaikan fragmen */ }
      }
    }
    streamDone = true;

    if (!full) {
      stopTyping();
      reply.classList.remove("typing");
      renderMarkdown(reply, "(tidak ada respons)");
    }
    history.push({ role: "assistant", content: full });
  } catch (e) {
    stopTyping();
    reply.classList.remove("typing");
    reply.textContent = `Error: ${e.message}`;
    reply.className = "msg bot error";
    history.pop();
  } finally {
    sendBtn.disabled = false;
    setStatus("");
  }
}

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', () => {
  const cur = getTheme();
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  setTheme(next);
  themeRainBurst(next);
});

sendBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (text) sendMessage(text);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = input.value.trim();
    if (text) sendMessage(text);
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
});

// --- Mobile keyboard handling ---
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
if (isMobile && window.visualViewport) {
  const composer = document.getElementById("composer");
  let pendingScroll = false;

  function onKeyboardChange() {
    if (pendingScroll) return;
    pendingScroll = true;
    requestAnimationFrame(() => {
      pendingScroll = false;
      const vk = window.visualViewport;
      const keyboardOpen = vk.height < window.innerHeight * 0.75;
      if (keyboardOpen) {
        // Push composer to bottom of visible area
        const offset = window.innerHeight - vk.height - vk.offsetTop;
        composer.style.position = "fixed";
        composer.style.bottom = offset + "px";
        composer.style.left = "0";
        composer.style.right = "0";
        composer.style.zIndex = "10";
        // Scroll input into view
        input.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        composer.style.position = "";
        composer.style.bottom = "";
        composer.style.left = "";
        composer.style.right = "";
        composer.style.zIndex = "";
      }
    });
  }

  window.visualViewport.addEventListener("resize", onKeyboardChange);
  window.visualViewport.addEventListener("scroll", onKeyboardChange);
  input.addEventListener("focus", () => {
    setTimeout(() => {
      input.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 300);
  });
}

loadModels();
if (isMobile) input.focus();