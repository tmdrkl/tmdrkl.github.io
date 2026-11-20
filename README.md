# drkl.net

A terminal-style landing page with a built-in AI chatbot and a private contact form.

## Features

- **Landing screen** — ASCII wordmark, one-line pitch, one primary action (`chat`), and quiet shortcuts (`help`, `about`, `blog`, `links`) so nothing has to be typed to get started; returning visitors get the short version
- **AI chat button** — the `ai chat` pill in the header jumps straight into chat mode
- **Terminal** — interactive shell with `ls`, `cd`, `cat`, `tree`, `fastfetch`, `fetch`, and more
- **Animated output** — command results fade in with a small motion; the effect respects reduced-motion preferences
- **Virtual filesystem** — `mkdir`, `touch`, `rm`, `echo >`/`>>`, and an in-terminal `edit` editor (changes persist in `localStorage`)
- **AI Chat** — type `chat` to enter chat mode, powered by Groq via Cloudflare Worker
  - streaming answers you can interrupt with `Esc` / `/stop`
  - markdown + syntax-highlighted code blocks with a copy button
  - long chats keep the last 24 messages as context
  - 50 conversations per IP per 24h; owner PIN lifts the limit
- **Direct message** — type `contact` (or use the header button) to send me a private message from the page; it arrives in Telegram and needs no account. 5 messages per IP per 24h.
- **Blog** — bilingual posts (EN + ID), `blog` to list, `read <n|name>` to read
- **Tic-tac-toe** — `tictactoe` / `ttt` vs AI, clickable board, persistent score
- **Dashboard** — `dashboard` opens the visual stats dashboard (`stats.html`)
- **Themes** — Everforest Dark/Light, Gruvbox Dark/Light, and Catppuccin Mocha/Latte; the selection is saved in this browser and can be changed with the header picker or `theme <name>`
- **Tab autocomplete** — command and path completion with suggestion popup
- **History** — command history persists across sessions (`localStorage`, last 200)
- **Username** — per-visitor name (`username <name>`, saved in this browser)
- **Mobile** — minimal tab/arrows key strip, pinned above the keyboard

## Terminal Commands

| Command | Description |
|---------|-------------|
| `help` | List available commands (`help <cmd>` for one) |
| `about` | A bit about me |
| `contact` | Send me a private message (`contact <message>` to skip the first prompt) |
| `links` | Contact info (GitHub, Telegram, Discord, email) |
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
| `theme` | Switch theme: `dark`, `light`, `gruvbox`, `gruvbox-light`, `catppuccin`, or `catppuccin-latte` |
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
| `←` / `→` | Move cursor (also on mobile key strip) |
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
| `theme-tokens.css` | Shared Everforest theme tokens (terminal + dashboard) |
| `theme.js` | Theme read/write, toggle button, rain-burst effect |
| `stats.html` | Usage dashboard (owner) |
| `404.html` | Custom not-found page |
| `CNAME` | Custom domain for GitHub Pages |
| `robots.txt` / `sitemap.xml` | SEO / crawling |
| `og.png` | Social preview image |

## Contact setup

The `contact` command posts to `POST /contact` on the same Cloudflare Worker as the chat ([tmdrkl/groq-chat](https://github.com/tmdrkl/groq-chat)). The Worker forwards the message to Telegram, so the bot token never reaches the browser.

1. Create a bot with [@BotFather](https://t.me/BotFather), then send it any message.
2. Find your chat ID at `https://api.telegram.org/bot<TOKEN>/getUpdates`.
3. In the Worker project, set the secrets:
   ```
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put TELEGRAM_CHAT_ID
   ```
4. Deploy from `web/`: `npx wrangler deploy`.

`MAX_CONTACTS_PER_DAY` (default `5`) sets the per-IP limit. Deploy from the Cloudflare account that owns the `tomx13` workers.dev subdomain — logging in with a different account creates a separate Worker with a different URL.

## Deployment

- **Site** — push to `main`; GitHub Pages serves it at [drkl.net](https://www.drkl.net).
- **Worker** — `cd ../groq-chat/web && npx wrangler deploy`.

## Stack

- Vanilla HTML/CSS/JS (no frameworks)
- Everforest color theme (dark/light)
- Groq API for AI responses via Cloudflare Worker
- Telegram Bot API for contact delivery (bot token stays server-side)
- Cloudflare Durable Objects for chat and contact rate limiting
- Hosted on GitHub Pages

## License

MIT
