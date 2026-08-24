# drkl.my.id

A terminal-style landing page with a built-in AI chatbot.

## Features

- **Terminal** — interactive shell with commands like `ls`, `cd`, `cat`, `tree`, `neofetch`
- **AI Chat** — type `chat` to enter chat mode, powered by Groq
- **Theme toggle** — dark/light Nord theme with animated switch
- **Tab autocomplete** — command and path completion
- **History** — command history persists across sessions

## Commands

| Command | Description |
|---------|-------------|
| `help` | List available commands |
| `chat` | Enter AI chat mode |
| `about` | About me |
| `links` | Contact info |
| `neofetch` | System info |
| `ls` / `cd` / `cat` / `tree` | Virtual filesystem |
| `theme dark\|light` | Switch theme |
| `clear` | Clear screen |

## Chat Commands

| Command | Description |
|---------|-------------|
| `/exit` | Leave chat mode |
| `/models` | List available models |
| `/model` | Show current model |
| `/model X` | Switch model |
| `/history` | Show chat history |
| `/clear-history` | Reset chat memory |
| `/clear` | Clear screen |

## Stack

- Vanilla HTML/CSS/JS (no frameworks)
- Nord color theme
- Groq API for AI responses
- Hosted on GitHub Pages

## License

MIT
