import { ipcMain, screen } from 'electron';
import { IPC, MIN_OPACITY, MAX_OPACITY } from '../renderer/shared/constants';
import type { CreatePageRequest, UpdatePageRequest, AppSettings } from '../renderer/shared/types';
import { normalizeUrl } from '../renderer/shared/utils/url';
import type { WindowManager } from './window-manager';

export function registerIpcHandlers(manager: WindowManager): void {
  ipcMain.handle(IPC.PAGE_GET_ALL, () => manager.listStates());

  ipcMain.handle(IPC.PAGE_CREATE, (_e, raw: CreatePageRequest) => {
    const url = normalizeUrl(raw?.url ?? '');
    if (!url) throw new Error('Invalid URL');
    const options = raw.options ?? {};
    return manager.create({ url, options });
  });

  ipcMain.handle(IPC.PAGE_CLOSE, (_e, id: string) => {
    manager.close(String(id));
    return true;
  });

  ipcMain.handle(IPC.PAGE_FOCUS, (_e, id: string) => {
    manager.focus(String(id));
    return true;
  });

  ipcMain.handle(IPC.PAGE_SHOW, (_e, id: string) => {
    manager.show(String(id));
    return true;
  });

  ipcMain.handle(IPC.PAGE_HIDE, (_e, id: string) => {
    manager.hide(String(id));
    return true;
  });

  ipcMain.handle(IPC.PAGE_SET_BOUNDS, (_e, id: string, bounds) => {
    manager.setBounds(String(id), bounds ?? {});
    return true;
  });

  ipcMain.handle(IPC.PAGE_SET_OPACITY, (_e, id: string, opacity: number) => {
    const v = Number(opacity);
    if (!Number.isFinite(v) || v < MIN_OPACITY || v > MAX_OPACITY) {
      throw new Error('Opacity out of range');
    }
    manager.setOpacity(String(id), v);
    return true;
  });

  ipcMain.handle(IPC.PAGE_SET_ALWAYS_ON_TOP, (_e, id: string, value: boolean) => {
    manager.setAlwaysOnTop(String(id), Boolean(value));
    return true;
  });

  ipcMain.handle(IPC.PAGE_UPDATE, (_e, raw: UpdatePageRequest) => {
    const { id, updates } = raw ?? {};
    if (!id) throw new Error('Missing id');
    if (updates.bounds) manager.setBounds(id, updates.bounds);
    if (typeof updates.opacity === 'number') manager.setOpacity(id, updates.opacity);
    if (typeof updates.alwaysOnTop === 'boolean') manager.setAlwaysOnTop(id, updates.alwaysOnTop);
    if (updates.visible === true) manager.show(id);
    if (updates.visible === false) manager.hide(id);
    return manager.getHandle(id)?.state ?? null;
  });

  ipcMain.handle(IPC.PAGE_APPLY_LAYOUT, (_e, id: string, preset: string, displayId?: number) => {
    manager.applyLayout(String(id), preset as never, typeof displayId === 'number' ? displayId : undefined);
    return true;
  });

  ipcMain.handle(IPC.DISPLAY_GET_ALL, () => {
    const primaryId = screen.getPrimaryDisplay().id;
    return screen.getAllDisplays().map((d, i) => ({
      id: d.id,
      isPrimary: d.id === primaryId,
      label: d.id === primaryId ? `屏幕 ${i + 1}（主屏）` : `屏幕 ${i + 1}`,
      workArea: d.workArea,
    }));
  });

  ipcMain.handle('page:show-all', () => {
    manager.showAll();
    return true;
  });
  ipcMain.handle('page:hide-all', () => {
    manager.hideAll();
    return true;
  });
  ipcMain.handle('page:close-all', () => {
    manager.closeAll();
    return true;
  });
  ipcMain.handle('page:close-others', (_e, id: string) => {
    manager.closeOthers(String(id));
    return true;
  });

  ipcMain.handle(IPC.SETTINGS_GET, () => manager.getSettings());

  ipcMain.handle(IPC.SETTINGS_UPDATE, (_e, partial: Partial<AppSettings>) => {
    return manager.updateSettings(partial ?? {});
  });
}
