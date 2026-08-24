# drkl.my.id

A terminal-style landing page with a built-in AI chatbot.

## Features

- **Terminal** — interactive shell with commands like `ls`, `cd`, `cat`, `tree`, `neofetch`
- **AI Chat** — type `chat` to enter chat mode, powered by Groq
- **Theme toggle** — dark/light Nord theme with animated switch
- **Tab autocomplete** — command and path completion
- **History** — command history persists across sessions

## Terminal Commands

| Command | Description |
|---------|-------------|
| `help` | List available commands |
| `about` | A bit about me |
| `links` | Contact info & GitHub |
| `neofetch` | System info in neofetch style |
| `banner` | Display the drkl logo |
| `date` | Current date & time |
| `echo` | Display text, e.g. `echo hello` |
| `ls` | List directory contents |
| `cd` | Change directory |
| `pwd` | Print working directory |
| `cat` | Show file contents |
| `tree` | Directory tree |
| `history` | Command history (`-c` to clear) |
| `chat` | Start AI chat mode |
| `clear` | Clear the screen |
| `whoami` | Show current user |
| `uname` | System info |
| `sudo` | Run as root (will fail) |
| `theme` | Switch theme (`dark` or `light`) |
| `exit` | Exit the terminal |
| `rm` | Delete files (read-only) |

## Chat Commands

| Command | Description |
|---------|-------------|
| `/exit` | Leave chat mode |
| `/clear` | Clear screen |
| `/new` | Start new conversation (clear history) |
| `/models` | List available models |
| `/model` | Show current model |
| `/model X` | Switch to model X |
| `/history` | Show chat history |
| `/help` | Show chat commands |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Autocomplete command |
| `↑` / `↓` | Navigate command history |
| `Ctrl+L` | Clear screen |
| `Ctrl+U` | Clear input line |
| `Ctrl+W` | Delete word |
| `Ctrl+C` | Cancel current input |
| `Esc` | Close suggestions |

## Stack

- Vanilla HTML/CSS/JS (no frameworks)
- Nord color theme
- Groq API for AI responses
- Hosted on GitHub Pages

## License

MIT
