import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { PersistenceManager } from './persistence';
import { registerIpcHandlers } from './ipc-handlers';
import { registerShortcuts, unregisterShortcuts } from './shortcuts';
import { createManagerWindow } from './manager-window';
import { DEFAULT_SETTINGS } from '../renderer/shared/constants';
import type { AppSettings } from '../renderer/shared/types';

let manager: WindowManager | null = null;
let managerWindow: BrowserWindow | null = null;
let persistenceRef: PersistenceManager | null = null;

app.whenReady().then(async () => {
  const persistence = new PersistenceManager();
  persistenceRef = persistence;
  const saved = await persistence.load();
  const settings: AppSettings = { ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) };

  manager = new WindowManager(persistence, settings);
  registerIpcHandlers(manager);

  managerWindow = createManagerWindow();
  manager.setManagerWindow(managerWindow);

  managerWindow.on('closed', () => {
    managerWindow = null;
    app.quit();
  });

  await manager.restoreSaved();

  registerShortcuts(manager, managerWindow);
});

app.on('before-quit', () => {
  // Synchronous write so state survives immediate process exit
  if (manager && persistenceRef) {
    persistenceRef.saveSync(manager.listStates(), manager.getSettings());
  }
});

app.on('will-quit', () => {
  unregisterShortcuts();
});

app.on('window-all-closed', () => {
  app.quit();
});
