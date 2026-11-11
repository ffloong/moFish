# MoFish Browser

**Electron multi-window web page manager for desktop floating workspaces.**  
MoFish turns websites into independent, controllable desktop windows, so you can monitor dashboards, chat tools, documents, and reference pages side by side without losing them in browser tabs.

**关键词**：Electron multi-window browser · floating browser · always-on-top browser · transparent web window · web page manager · 多窗口浏览器 · 网页悬浮窗 · 网页置顶 · 网页透明 · 多屏布局

## Why MoFish

- **Independent page windows** — open every website as its own desktop window.
- **Always on top** — keep dashboards, chats, or references visible above other apps.
- **Adjustable transparency** — set each page from 10% to 100% opacity.
- **Quick layouts** — send a page to the left, right, top, bottom, center, or full screen.
- **Multi-display aware** — target the current screen or choose a specific display.
- **Hide without stopping** — temporarily hide pages and restore them later.
- **Persistent browser profile** — cookies, localStorage, IndexedDB, service workers, and login state survive restarts.
- **Search and batch controls** — find pages by title or URL; show, hide, or close them together.

## Install and run

Requires Git and [Node.js](https://nodejs.org/) 20+.

```bash
git clone https://github.com/ffloong/moFish.git
cd moFish
npm install
npm run dev
```

## Build

```bash
# Current platform
npm run dist

# Platform-specific installers
npm run dist:mac
npm run dist:win
npm run dist:linux
```

Installers are written to the `release/` directory.

## Keyboard shortcuts

| Shortcut                                          | Action                         |
| ------------------------------------------------- | ------------------------------ |
| <kbd>Cmd/Ctrl</kbd> + <kbd>N</kbd>                | New page                       |
| <kbd>Cmd/Ctrl</kbd> + <kbd>W</kbd>                | Close focused page             |
| <kbd>Cmd/Ctrl</kbd> + <kbd>H</kbd>                | Hide/show focused page         |
| <kbd>Cmd/Ctrl</kbd> + <kbd>T</kbd>                | Toggle always-on-top           |
| <kbd>Cmd/Ctrl</kbd> + <kbd>+</kbd> / <kbd>-</kbd> | Increase/decrease transparency |
| <kbd>Cmd/Ctrl</kbd> + <kbd>1…9</kbd>              | Focus page 1–9                 |
| <kbd>Cmd/Ctrl</kbd> + <kbd>Tab</kbd>              | Cycle pages                    |

## Development

```bash
npm test              # Run unit tests
npm run typecheck     # TypeScript check
npm run build         # Production build
npm run dev           # Start development app
```

## Use cases

- Keep a live dashboard visible while working in another app.
- Compare documentation, dashboards, or reference pages side by side.
- Keep web chat or ticketing tools available without dedicating a browser window.
- Dim secondary information with transparency instead of moving it off-screen.
- Organize monitoring pages across multiple displays.

## Project structure

```text
src/main/       Electron main process, IPC, window manager, persistence
src/preload/    Secure renderer API bridge
src/renderer/   React manager UI and shared types/utilities
tests/          Unit tests
docs/           Requirements and implementation plan
```

## License

[MIT](LICENSE)
