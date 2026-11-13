import { create } from 'zustand';
import type { PageState, PageBounds, AppSettings } from '../../shared/types';

interface PagesStoreState {
  pages: PageState[];
  settings: AppSettings | null;
  setPages: (pages: PageState[]) => void;
  applyState: (id: string, state: PageState) => void;
  removePage: (id: string) => void;
  setSettings: (s: AppSettings) => void;
}

export const usePagesStore = create<PagesStoreState>((set) => ({
  pages: [],
  settings: null,
  setPages: (pages) => set({ pages }),
  applyState: (id, state) =>
    set((s) => ({
      pages: s.pages.map((p) => (p.id === id ? state : p)),
    })),
  removePage: (id) => set((s) => ({ pages: s.pages.filter((p) => p.id !== id) })),
  setSettings: (settings) => set({ settings }),
}));

export function usePageActions() {
  return {
    createPage: (url: string, bounds?: Partial<PageBounds>) =>
      window.moFish.pages.create({
        url,
        options: { bounds: bounds ? { width: 960, height: 640, ...bounds } : undefined },
      }),
    closePage: (id: string) => window.moFish.pages.close(id),
    focusPage: (id: string) => window.moFish.pages.focus(id),
    toggleVisibility: (id: string, visible: boolean) =>
      visible ? window.moFish.pages.hide(id) : window.moFish.pages.show(id),
    setBounds: (id: string, bounds: PageBounds) => window.moFish.pages.setBounds(id, bounds),
    setOpacity: (id: string, opacity: number) => window.moFish.pages.setOpacity(id, opacity),
    setAlwaysOnTop: (id: string, value: boolean) => window.moFish.pages.setAlwaysOnTop(id, value),
    applyLayout: (id: string, preset: string, displayId?: number) =>
      window.moFish.pages.applyLayout(id, preset, displayId),
    showAll: () => window.moFish.pages.showAll(),
    hideAll: () => window.moFish.pages.hideAll(),
    closeAll: () => window.moFish.pages.closeAll(),
    closeOthers: (id: string) => window.moFish.pages.closeOthers(id),
    updatePage: (
      id: string,
      updates: Partial<Pick<PageState, 'borderColor'> & { title?: string | null }>,
    ) => window.moFish.pages.update({ id, updates }),
    updateSettings: (partial: Partial<AppSettings>) => window.moFish.settings.update(partial),
  };
}
