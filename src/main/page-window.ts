import { BrowserWindow, Menu, shell, clipboard } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { MIN_OPACITY, MAX_OPACITY, OPACITY_STEP } from '../renderer/shared/constants';
import type { PageState, CreatePageRequest } from '../renderer/shared/types';

export interface PageWindowDeps {
  getPageState(id: string): PageState | undefined;
  setAlwaysOnTop(id: string, value: boolean): void;
  setOpacity(id: string, value: number): void;
  hide(id: string): void;
  close(id: string): void;
  createPage(url: string): void;
}

const WEB_PREFERENCES = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
};

export function buildPageContextMenu(
  id: string,
  state: PageState,
  deps: PageWindowDeps,
  win: BrowserWindow
): Menu {
  const stepOpacity = (delta: number) => {
    const next = Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, state.opacity + delta));
    deps.setOpacity(id, Math.round(next * 100) / 100);
  };

  const template: MenuItemConstructorOptions[] = [
    {
      label: '刷新',
      accelerator: 'CmdOrCtrl+R',
      click: () => win.webContents.reload(),
    },
    { type: 'separator' },
    {
      label: '复制页面 URL',
      click: () => clipboard.writeText(state.url),
    },
    { type: 'separator' },
    {
      label: '透明度',
      submenu: [
        { label: '100%', click: () => deps.setOpacity(id, 1.0) },
        { label: '75%', click: () => deps.setOpacity(id, 0.75) },
        { label: '50%', click: () => deps.setOpacity(id, 0.5) },
        { label: '25%', click: () => deps.setOpacity(id, 0.25) },
        { type: 'separator' },
        { label: '增加 5%', click: () => stepOpacity(OPACITY_STEP) },
        { label: '减少 5%', click: () => stepOpacity(-OPACITY_STEP) },
      ],
    },
    {
      label: state.alwaysOnTop ? '取消置顶' : '置顶',
      click: () => deps.setAlwaysOnTop(id, !state.alwaysOnTop),
    },
    { type: 'separator' },
    { label: '隐藏此窗口', click: () => deps.hide(id) },
    {
      label: '关闭此窗口',
      click: () => deps.close(id),
    },
  ];

  return Menu.buildFromTemplate(template);
}

export function createPageWindow(
  id: string,
  request: CreatePageRequest,
  deps: PageWindowDeps
): { win: BrowserWindow; state: PageState } {
  const now = Date.now();

  const win = new BrowserWindow({
    width: request.options?.bounds?.width ?? 960,
    height: request.options?.bounds?.height ?? 640,
    x: request.options?.bounds?.x,
    y: request.options?.bounds?.y,
    opacity: Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, request.options?.opacity ?? 1.0)),
    alwaysOnTop: request.options?.alwaysOnTop ?? false,
    frame: true,
    title: 'New Page',
    webPreferences: WEB_PREFERENCES,
  });

  const state: PageState = {
    id,
    url: request.url,
    title: '',
    favicon: null,
    bounds: win.getBounds(),
    opacity: win.getOpacity(),
    alwaysOnTop: win.isAlwaysOnTop(),
    alwaysOnTopLevel: 'floating',
    visible: win.isVisible(),
    frameMode: 'framed',
    createdAt: now,
    lastActiveAt: now,
  };


  win.loadURL(request.url).catch(() => {
    // fall back to an error page inline
    win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          `<h2 style="font-family:sans-serif">无法加载页面</h2><p style="font-family:sans-serif">${request.url}</p>`
        )
    );
  });

  // Open external links / target=_blank as new managed page
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) {
      deps.createPage(url);
    } else {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('context-menu', () => {
    const current = deps.getPageState(id);
    if (!current) return;
    const menu = buildPageContextMenu(id, current, deps, win);
    menu.popup({ window: win });
  });

  return { win, state };
}
