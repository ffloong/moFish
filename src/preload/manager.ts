import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../renderer/shared/constants';
import type { MoFishApi } from '../renderer/shared/global';

const api: MoFishApi = {
  pages: {
    getAll: () => ipcRenderer.invoke(IPC.PAGE_GET_ALL),
    create: (request) => ipcRenderer.invoke(IPC.PAGE_CREATE, request),
    close: (id) => ipcRenderer.invoke(IPC.PAGE_CLOSE, id),
    focus: (id) => ipcRenderer.invoke(IPC.PAGE_FOCUS, id),
    show: (id) => ipcRenderer.invoke(IPC.PAGE_SHOW, id),
    hide: (id) => ipcRenderer.invoke(IPC.PAGE_HIDE, id),
    setBounds: (id, bounds) => ipcRenderer.invoke(IPC.PAGE_SET_BOUNDS, id, bounds),
    setOpacity: (id, opacity) => ipcRenderer.invoke(IPC.PAGE_SET_OPACITY, id, opacity),
    setAlwaysOnTop: (id, value) => ipcRenderer.invoke(IPC.PAGE_SET_ALWAYS_ON_TOP, id, value),
    update: (request) => ipcRenderer.invoke(IPC.PAGE_UPDATE, request),
    showAll: () => ipcRenderer.invoke('page:show-all'),
    hideAll: () => ipcRenderer.invoke('page:hide-all'),
    closeAll: () => ipcRenderer.invoke('page:close-all'),
    closeOthers: (id) => ipcRenderer.invoke('page:close-others', id),
    applyLayout: (id, preset, displayId) =>
      ipcRenderer.invoke(IPC.PAGE_APPLY_LAYOUT, id, preset, displayId),
  },
  displays: {
    getAll: () => ipcRenderer.invoke(IPC.DISPLAY_GET_ALL),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
    update: (partial) => ipcRenderer.invoke(IPC.SETTINGS_UPDATE, partial),
  },
  subscribe: (channel, callback) => {
    const VALID_PUSH_CHANNELS: readonly string[] = [
      IPC.PAGE_LIST_CHANGED,
      IPC.PAGE_STATE_CHANGED,
      IPC.PAGE_CLOSED,
      IPC.UI_NEW_PAGE_DIALOG,
    ];
    if (!VALID_PUSH_CHANNELS.includes(channel)) return undefined;
    const listener = (_event: unknown, data: unknown): void => callback(data);
    ipcRenderer.on(channel, listener);
    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },
};

contextBridge.exposeInMainWorld('moFish', api);
