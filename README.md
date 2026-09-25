# drkl.net

A terminal-style landing page with a built-in AI chatbot.

## Features

- **Terminal** — interactive shell with commands like `ls`, `cd`, `cat`, `tree`, `fastfetch`
- **AI Chat** — type `chat` to enter chat mode, powered by Groq
  - streaming answers you can interrupt with `Esc` / `/stop`
  - markdown + syntax-highlighted code blocks with a copy button
  - long chats keep the last 24 messages as context
- **Theme toggle** — dark/light Gruvbox theme with animated switch
- **Tab autocomplete** — command and path completion
- **History** — command history persists across sessions
- **Username** — each visitor gets their own name (`username <name>` to change, saved in this browser)

## Terminal Commands

| Command | Description |
|---------|-------------|
| `help` | List available commands |
| `about` | A bit about me |
| `links` | Contact info & GitHub |
| `fastfetch` | System info in fastfetch style (`neofetch` still works as an alias) |
| `fetch` | System info with geo/IP (via Cloudflare edge) |
| `banner` | Display the drkl logo |
| `date` | Current date & time |
| `echo` | Display text, e.g. `echo hello` (supports `>` / `>>`) |
| `ls` | List directory contents |
| `cd` | Change directory |
| `pwd` | Print working directory |
| `cat` | Show file contents |
| `tree` | Directory tree |
| `history` | Command history (`-c` to clear) |
| `chat` | Start AI chat mode |
| `blog` | List blog posts |
| `read` | Read a blog post: `read 1` or `read name.md` |
| `dashboard` | Open the visual stats dashboard |
| `clear` | Clear the screen |
| `whoami` | Show current user |
| `username` | Show or set your username (saved in this browser) |
| `uname` | System info |
| `sudo` | Run as root (will fail) |
| `theme` | Switch theme (`dark` or `light`) |
| `exit` | Exit the terminal |
| `rm` | Delete files or directories (`-r` for recursive) |
| `mkdir` | Create a directory |
| `touch` | Create an empty file |
| `edit` | Edit a file in the terminal text editor |

## Chat Commands

| Command | Description |
|---------|-------------|
| `/exit` | Leave chat mode |
| `/clear` | Clear screen |
| `/new` | Start new conversation (clear history) |
| `/stop` | Interrupt the answer (`Esc` or `Ctrl+C` also work) |
| `/retry` | Send the last question again |
| `/models` | List available models |
| `/model` | Show current model |
| `/model X` | Switch to model X |
| `/login <PIN>` | Owner: lift rate limit for 24h |
| `/stats` | Show chat usage stats (chats & tokens) |
| `/history` | Show full chat history with timestamps |
| `/export` | Download chat log as text file |
| `/help` | Show chat commands |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Autocomplete command |
| `↑` / `↓` | Navigate command history |
| `Ctrl+L` | Clear screen |
| `Ctrl+U` | Clear input line |
| `Ctrl+W` | Delete word |
| `Esc` | Close suggestions / stop the AI mid-answer |
| `Ctrl+C` | Cancel input / stop the AI mid-answer |

## Files

| File | Purpose |
|------|---------|
| `index.html` | Terminal page markup |
| `style.css` | Terminal styles |
| `theme-tokens.css` | Shared Gruvbox Material tokens (terminal + dashboard) |
| `theme.js` | Theme read/write, toggle button, rain-burst effect |
| `index.js` | Virtual filesystem, commands, chat mode |
| `stats.html` | Owner-only usage dashboard |

## Stack

- Vanilla HTML/CSS/JS (no frameworks)
- Gruvbox Material color theme (dark/light)
- Groq API for AI responses
- Hosted on GitHub Pages

## License

MIT
