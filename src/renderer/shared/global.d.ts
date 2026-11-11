import type { CreatePageRequest, UpdatePageRequest, PageBounds, PageState, AppSettings, DisplayInfo } from './types';

export interface MoFishApi {
  pages: {
    getAll: () => Promise<PageState[]>;
    create: (request: CreatePageRequest) => Promise<PageState>;
    close: (id: string) => Promise<boolean>;
    focus: (id: string) => Promise<boolean>;
    show: (id: string) => Promise<boolean>;
    hide: (id: string) => Promise<boolean>;
    setBounds: (id: string, bounds: PageBounds) => Promise<boolean>;
    setOpacity: (id: string, opacity: number) => Promise<boolean>;
    setAlwaysOnTop: (id: string, value: boolean) => Promise<boolean>;
    update: (request: UpdatePageRequest) => Promise<PageState | null>;
    showAll: () => Promise<boolean>;
    hideAll: () => Promise<boolean>;
    closeAll: () => Promise<boolean>;
    closeOthers: (id: string) => Promise<boolean>;
    applyLayout: (id: string, preset: string, displayId?: number) => Promise<boolean>;
  };
  displays: {
    getAll: () => Promise<DisplayInfo[]>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    update: (partial: Partial<AppSettings>) => Promise<AppSettings>;
  };
  subscribe: (
    channel: string,
    callback: (data: unknown) => void
  ) => (() => void) | undefined;
}

declare global {
  interface Window {
    moFish: MoFishApi;
  }
}

export {};
