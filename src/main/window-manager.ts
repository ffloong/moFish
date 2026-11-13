import { BrowserWindow, screen } from 'electron';
import type {
  PageState,
  CreatePageRequest,
  AppSettings,
  DisplayInfo,
} from '../renderer/shared/types';
import type { LayoutPreset } from '../renderer/shared/utils/bounds';
import { computeLayoutBounds, resolveTargetDisplay } from '../renderer/shared/utils/bounds';
import { MIN_OPACITY, MAX_OPACITY } from '../renderer/shared/constants';
import { normalizeBorderColor } from '../renderer/shared/utils/appearance';
import { applyPageBorder } from './window-appearance';
import { createPageWindow, type PageWindowDeps } from './page-window';
import type { PersistenceManager } from './persistence';

interface PageHandle {
  id: string;
  win: BrowserWindow;
  state: PageState;
}

export class WindowManager {
  private pages = new Map<string, PageHandle>();
  private persistence: PersistenceManager;
  private settings: AppSettings;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private managerWindow: BrowserWindow | null = null;

  constructor(persistence: PersistenceManager, settings: AppSettings) {
    this.persistence = persistence;
    this.settings = settings;
  }

  setManagerWindow(win: BrowserWindow | null): void {
    this.managerWindow = win;
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  async updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    this.settings = { ...this.settings, ...partial };
    await this.scheduleSave(0);
    return this.getSettings();
  }

  private deps(): PageWindowDeps {
    return {
      getPageState: (pid) => this.pages.get(pid)?.state,
      setAlwaysOnTop: (pid, v) => this.setAlwaysOnTop(pid, v),
      setOpacity: (pid, v) => this.setOpacity(pid, v),
      hide: (pid) => this.hide(pid),
      close: (pid) => this.close(pid),
      createPage: (url) => this.create({ url }),
    };
  }

  create(request: CreatePageRequest): PageState {
    const id = crypto.randomUUID();
    const opts = request.options ?? {};
    const { win, state } = createPageWindow(
      id,
      {
        url: request.url,
        options: {
          bounds: opts.bounds ?? {
            width: this.settings.defaultWidth,
            height: this.settings.defaultHeight,
          },
          opacity: opts.opacity ?? this.settings.defaultOpacity,
          alwaysOnTop: opts.alwaysOnTop ?? this.settings.defaultAlwaysOnTop,
          frameMode: 'framed',
          title: opts.title ?? null,
          borderColor: normalizeBorderColor(opts.borderColor),
        },
      },
      this.deps(),
    );

    const handle: PageHandle = { id, win, state };
    this.pages.set(id, handle);
    this.wireEvents(id, win, state);

    this.broadcast(IPC_LIST_CHANGED, this.listStates());
    void this.scheduleSave();
    return state;
  }

  private wireEvents(id: string, win: BrowserWindow, state: PageState): void {
    win.on('closed', () => {
      this.pages.delete(id);
      this.broadcast(IPC_LIST_CHANGED, this.listStates());
      void this.scheduleSave();
    });

    win.on('focus', () => {
      state.lastActiveAt = Date.now();
      this.broadcast(IPC_STATE_CHANGED, { id, state });
      void this.scheduleSave();
    });

    const syncBounds = () => {
      state.bounds = win.getBounds();
      this.broadcast(IPC_STATE_CHANGED, { id, state });
      this.scheduleSave();
    };
    win.on('moved', syncBounds);
    win.on('resized', syncBounds);
    win.on('close', () => {
      state.bounds = win.getBounds();
      state.visible = win.isVisible();
    });

    win.webContents.on('page-title-updated', (event, title) => {
      state.webTitle = title;
      state.title = state.customTitle || title;
      if (state.customTitle) event.preventDefault();
      win.setTitle(state.title);
      this.broadcast(IPC_STATE_CHANGED, { id, state });
      void this.scheduleSave();
    });

    win.webContents.on('page-favicon-updated', (_e, favicons) => {
      state.favicon = favicons?.[0] ?? null;
      this.broadcast(IPC_STATE_CHANGED, { id, state });
      void this.scheduleSave();
    });

    win.webContents.on('did-navigate', (_e, url) => {
      state.url = url;
      this.broadcast(IPC_STATE_CHANGED, { id, state });
      void this.scheduleSave();
    });
    win.webContents.on('did-navigate-in-page', (_e, url) => {
      state.url = url;
      this.broadcast(IPC_STATE_CHANGED, { id, state });
      void this.scheduleSave();
    });
  }

  listStates(): PageState[] {
    return Array.from(this.pages.values())
      .map((h) => h.state)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  getHandle(id: string): PageHandle | undefined {
    return this.pages.get(id);
  }

  getFocusedPage(): PageHandle | undefined {
    const all = this.listStates();
    if (all.length === 0) return undefined;
    return this.pages.get(
      all.reduce((acc, cur) => (cur.lastActiveAt > acc.lastActiveAt ? cur : acc)).id,
    );
  }

  close(id: string): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    handle.win.close();
    // 'closed' event handles cleanup; also handle if already destroyed
    if (handle.win.isDestroyed()) {
      this.pages.delete(id);
      this.broadcast(IPC_LIST_CHANGED, this.listStates());
    }
  }

  focus(id: string): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    if (!handle.win.isVisible()) handle.win.show();
    handle.win.focus();
    handle.state.lastActiveAt = Date.now();
    this.broadcast(IPC_STATE_CHANGED, { id, state: handle.state });
  }

  show(id: string): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    handle.win.show();
    handle.state.visible = true;
    this.broadcast(IPC_STATE_CHANGED, { id, state: handle.state });
    void this.scheduleSave();
  }

  hide(id: string): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    handle.win.hide();
    handle.state.visible = false;
    this.broadcast(IPC_STATE_CHANGED, { id, state: handle.state });
    void this.scheduleSave();
  }

  toggleVisibility(id: string): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    if (handle.win.isVisible()) this.hide(id);
    else this.show(id);
  }

  setBounds(id: string, bounds: Partial<PageState['bounds']>): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    const current = handle.win.getBounds();
    handle.win.setBounds({
      x: bounds.x ?? current.x,
      y: bounds.y ?? current.y,
      width: Math.max(200, bounds.width ?? current.width),
      height: Math.max(150, bounds.height ?? current.height),
    });
    handle.state.bounds = handle.win.getBounds();
    this.broadcast(IPC_STATE_CHANGED, { id, state: handle.state });
    void this.scheduleSave();
  }

  setTitle(id: string, title: string | null): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    const customTitle = title?.trim() || null;
    handle.state.customTitle = customTitle;
    handle.state.title = customTitle || handle.state.webTitle || '';
    handle.win.setTitle(handle.state.title);
    this.broadcast(IPC_STATE_CHANGED, { id, state: handle.state });
    void this.scheduleSave();
  }

  setBorderColor(id: string, color: string): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    handle.state.borderColor = normalizeBorderColor(color, handle.state.borderColor);
    applyPageBorder(handle.win, handle.state.borderColor);
    this.broadcast(IPC_STATE_CHANGED, { id, state: handle.state });
    void this.scheduleSave();
  }

  setOpacity(id: string, opacity: number): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    const clamped = Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, opacity));
    handle.win.setOpacity(clamped);
    handle.state.opacity = clamped;
    this.broadcast(IPC_STATE_CHANGED, { id, state: handle.state });
    void this.scheduleSave();
  }

  adjustOpacity(id: string, delta: number): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    this.setOpacity(id, handle.state.opacity + delta);
  }

  setAlwaysOnTop(id: string, value: boolean, level?: PageState['alwaysOnTopLevel']): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    const lvl = level ?? handle.state.alwaysOnTopLevel;
    handle.win.setAlwaysOnTop(value, lvl);
    handle.state.alwaysOnTop = handle.win.isAlwaysOnTop();
    handle.state.alwaysOnTopLevel = lvl;
    this.broadcast(IPC_STATE_CHANGED, { id, state: handle.state });
    void this.scheduleSave();
  }

  getDisplays(): DisplayInfo[] {
    const primaryId = screen.getPrimaryDisplay().id;
    return screen.getAllDisplays().map((d, i) => ({
      id: d.id,
      isPrimary: d.id === primaryId,
      label: d.id === primaryId ? `屏幕 ${i + 1}（主屏）` : `屏幕 ${i + 1}`,
      workArea: d.workArea,
    }));
  }

  applyLayout(id: string, preset: LayoutPreset, displayId?: number): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    const currentBounds = handle.win.getBounds();
    const display =
      resolveTargetDisplay(screen.getAllDisplays(), displayId, currentBounds) ??
      screen.getPrimaryDisplay();
    const bounds = computeLayoutBounds(preset, display.workArea, currentBounds);
    // Clamp to the target display workArea
    const wa = display.workArea;
    bounds.x = Math.max(wa.x, Math.min(bounds.x, wa.x + wa.width - bounds.width));
    bounds.y = Math.max(wa.y, Math.min(bounds.y, wa.y + wa.height - bounds.height));
    this.setBounds(id, bounds);
  }

  focusNth(index: number): void {
    const list = this.listStates();
    const target = list[index];
    if (target) this.focus(target.id);
  }

  cycleFocus(direction: 1 | -1 = 1): void {
    const list = this.listStates();
    if (list.length === 0) return;
    const focused = this.getFocusedPage();
    const currentIdx = focused ? list.findIndex((p) => p.id === focused.id) : -1;
    const next = (currentIdx + direction + list.length) % list.length;
    this.focus(list[next].id);
  }

  showAll(): void {
    for (const h of this.pages.values()) this.show(h.id);
  }

  hideAll(): void {
    for (const h of this.pages.values()) this.hide(h.id);
  }

  closeAll(): void {
    for (const h of Array.from(this.pages.values())) this.close(h.id);
  }

  closeOthers(keepId: string): void {
    for (const h of Array.from(this.pages.values())) {
      if (h.id !== keepId) this.close(h.id);
    }
  }

  async restoreSaved(): Promise<void> {
    const data = await this.persistence.load();
    if (!data) return;
    this.settings = { ...this.settings, ...data.settings };
    if (this.settings.startupBehavior === 'blank') return;

    for (const p of data.pages) {
      this.create({
        url: p.url,
        options: {
          bounds: p.bounds,
          opacity: p.opacity,
          alwaysOnTop: p.alwaysOnTop,
          title: p.customTitle ?? null,
          borderColor: p.borderColor,
        },
      });
    }
    // restore hidden states after creation
    for (const p of data.pages) {
      if (!p.visible) this.hide(p.id);
      if (p.alwaysOnTopLevel && p.alwaysOnTopLevel !== 'floating') {
        this.setAlwaysOnTop(p.id, p.alwaysOnTop, p.alwaysOnTopLevel);
      }
    }
  }

  private scheduleSave(delayMs = 500): Promise<void> {
    return new Promise((resolve) => {
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(async () => {
        this.saveTimer = null;
        await this.persistNow();
        resolve();
      }, delayMs);
    });
  }

  async persistNow(): Promise<void> {
    const states = this.listStates();
    await this.persistence.save(states, this.settings);
  }

  private broadcast(channel: string, payload: unknown): void {
    if (this.managerWindow && !this.managerWindow.isDestroyed()) {
      this.managerWindow.webContents.send(channel, payload);
    }
  }
}

const IPC_LIST_CHANGED = 'page:list-changed';
const IPC_STATE_CHANGED = 'page:state-changed';
