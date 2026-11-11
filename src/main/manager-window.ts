import { BrowserWindow, Menu } from 'electron';
import { join } from 'path';
import { IPC } from '../renderer/shared/constants';

export function createManagerWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 860,
    height: 640,
    minWidth: 640,
    minHeight: 480,
    title: 'MoFish Browser',
    webPreferences: {
      preload: join(__dirname, '../preload/manager.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: '新建页面',
          accelerator: 'CmdOrCtrl+N',
          click: () => win.webContents.send(IPC.UI_NEW_PAGE_DIALOG),
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
  ]);
  Menu.setApplicationMenu(menu);

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}
