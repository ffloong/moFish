import { globalShortcut } from 'electron';
import type { BrowserWindow } from 'electron';
import { OPACITY_STEP } from '../renderer/shared/constants';
import type { WindowManager } from './window-manager';

export function registerShortcuts(manager: WindowManager, managerWindow: BrowserWindow): void {
  const bind = (accelerator: string, fn: () => void): void => {
    try {
      const ok = globalShortcut.register(accelerator, fn);
      if (!ok) {
        console.warn(`[shortcuts] failed to register: ${accelerator}`);
      }
    } catch (err) {
      console.warn(`[shortcuts] error registering ${accelerator}:`, err);
    }
  };

  bind('CommandOrControl+N', () => {
    if (managerWindow.isMinimized()) managerWindow.restore();
    managerWindow.show();
    managerWindow.focus();
    managerWindow.webContents.send('ui:new-page-dialog');
  });

  bind('CommandOrControl+W', () => {
    const focused = manager.getFocusedPage();
    if (focused) manager.close(focused.id);
  });

  bind('CommandOrControl+H', () => {
    const focused = manager.getFocusedPage();
    if (focused) manager.toggleVisibility(focused.id);
  });

  bind('CommandOrControl+T', () => {
    const focused = manager.getFocusedPage();
    if (focused) manager.setAlwaysOnTop(focused.id, !focused.state.alwaysOnTop);
  });

  bind('CommandOrControl+=', () => {
    const focused = manager.getFocusedPage();
    if (focused) manager.adjustOpacity(focused.id, OPACITY_STEP);
  });

  bind('CommandOrControl+-', () => {
    const focused = manager.getFocusedPage();
    if (focused) manager.adjustOpacity(focused.id, -OPACITY_STEP);
  });

  bind('CommandOrControl+Tab', () => manager.cycleFocus(1));
  bind('CommandOrControl+Shift+Tab', () => manager.cycleFocus(-1));

  for (let i = 1; i <= 9; i++) {
    bind(`CommandOrControl+${i}`, () => manager.focusNth(i - 1));
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
