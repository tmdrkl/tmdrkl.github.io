# drkl.net

A terminal-style landing page with a built-in AI chatbot.

## Features

- **Terminal** — interactive shell with `ls`, `cd`, `cat`, `tree`, `fastfetch`, `fetch`, and more
- **Virtual filesystem** — `mkdir`, `touch`, `rm`, `echo >`/`>>`, and an in-terminal `edit` editor (changes persist in `localStorage`)
- **AI Chat** — type `chat` to enter chat mode, powered by Groq via Cloudflare Worker
  - streaming answers you can interrupt with `Esc` / `/stop`
  - markdown + syntax-highlighted code blocks with a copy button
  - long chats keep the last 24 messages as context
  - 50 conversations per IP per 24h; owner PIN lifts the limit
- **Blog** — bilingual posts (EN + ID), `blog` to list, `read <n|name>` to read
- **Tic-tac-toe** — `tictactoe` / `ttt` vs AI, clickable board, persistent score
- **Dashboard** — `dashboard` opens the visual stats dashboard (`stats.html`)
- **Theme** — dark/light Adwaita theme, follows system preference, animated switch + `theme` command
- **Tab autocomplete** — command and path completion with suggestion popup
- **History** — command history persists across sessions (`localStorage`, last 200)
- **Username** — per-visitor name (`username <name>`, saved in this browser)
- **Mobile** — toolbar with tab/arrows keys, pinned above the keyboard

## Terminal Commands

| Command | Description |
|---------|-------------|
| `help` | List available commands (`help <cmd>` for one) |
| `about` | A bit about me |
| `links` | Contact info & GitHub |
| `fastfetch` | System info in fastfetch style |
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
| `blog` | List blog posts (English + Bahasa Indonesia) |
| `read` | Read a blog post: `read 1` or `read name.md` |
| `dashboard` | Open the visual stats dashboard (needs `sudo -v` first for full access) |
| `clear` | Clear the screen |
| `whoami` | Show current user |
| `username` | Show or set your username (saved in this browser) |
| `uname` | System info |
| `sudo` | Run as root (Linux-like) — `[sudo] password for you:` replaces the shell prompt, masked input, 3 tries, cached 15 min. `sudo <cmd>`, `sudo -i`/`-s` shell, `sudo -v` validate, `sudo -l` list, `sudo -u user`, `sudo -n`, `sudo -k` drops credentials + locks dashboard |
| `su` | Switch user — `su [-] [root]` (password required, `Password:` prompt) |
| `logout` | Leave root + lock dashboard, or exit the terminal |
| `theme` | Switch theme (`dark` or `light`) |
| `tictactoe` | Play tic-tac-toe vs AI (`tictactoe 1-9`, `new`, `score`, `quit`) |
| `ttt` | Alias of `tictactoe` |
| `exit` | Leave root + lock dashboard, or exit the terminal |
| `rm` | Delete files or directories (`-r` for recursive) |
| `mkdir` | Create a directory |
| `touch` | Create an empty file |
| `edit` | Edit a file in the terminal text editor (`Ctrl+S` save, `Ctrl+X` exit) |

## Chat Commands

| Command | Description |
|---------|-------------|
| `/exit` (`/quit`) | Leave chat mode |
| `/clear` | Clear screen |
| `/new` | Start new conversation (clear history) |
| `/stop` | Interrupt the answer (`Esc` or `Ctrl+C` also work) |
| `/retry` | Send the last question again |
| `/models` | List available models |
| `/model` | Show current model |
| `/model X` | Switch to model X |
| `/login <PIN>` | Owner: lift rate limit for 24h |
| `/stats` | Show chat usage stats (owner only, requires `/login`) |
| `/history` | Show chat history (`/history -f` for full text) |
| `/export` | Download chat log as text file |
| `/help` | Show chat commands |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Autocomplete command / path |
| `↑` / `↓` | Navigate command history |
| `←` / `→` | Move cursor (also on mobile toolbar) |
| `Ctrl+L` | Clear screen |
| `Ctrl+U` | Clear input line |
| `Ctrl+W` | Delete word |
| `Ctrl+S` / `Ctrl+X` | Save / exit (in `edit` mode) |
| `Esc` | Close suggestions / stop the AI mid-answer |
| `Ctrl+C` | Cancel input / stop the AI mid-answer |

## Files

| File | Purpose |
|------|---------|
| `index.html` | Terminal page markup |
| `index.js` | Virtual filesystem, commands, chat mode, editor, games |
| `style.css` | Terminal styles |
| `theme-tokens.css` | Shared Adwaita tokens (terminal + dashboard) |
| `theme.js` | Theme read/write, toggle button, rain-burst effect |
| `stats.html` | Usage dashboard (owner) |
| `404.html` | Custom not-found page |
| `CNAME` | Custom domain for GitHub Pages |
| `robots.txt` / `sitemap.xml` | SEO / crawling |
| `og.png` | Social preview image |

## Stack

- Vanilla HTML/CSS/JS (no frameworks)
- Adwaita color theme (dark/light)
- Groq API for AI responses via Cloudflare Worker
- Cloudflare Durable Objects for chat usage tracking
- Hosted on GitHub Pages

## License

MIT
