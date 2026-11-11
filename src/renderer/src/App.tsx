import { useEffect, useState } from 'react';
import { IPC } from '../shared/constants';
import type { PageState, AppSettings } from '../shared/types';
import { usePagesStore, usePageActions } from './store/pagesStore';
import PageList from './components/PageList';
import NewPageDialog from './components/NewPageDialog';
import SettingsDialog from './components/SettingsDialog';
import StatusBar from './components/StatusBar';

export default function App() {
  const pages = usePagesStore((s) => s.pages);
  const setPages = usePagesStore((s) => s.setPages);
  const applyState = usePagesStore((s) => s.applyState);
  const removePage = usePagesStore((s) => s.removePage);
  const setSettings = usePagesStore((s) => s.setSettings);

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const actions = usePageActions();

  useEffect(() => {
    void window.moFish.pages.getAll().then((list) => setPages(list as PageState[]));
    void window.moFish.settings.get().then((s) => setSettings(s as AppSettings));

    const unsubs = [
      window.moFish.subscribe(IPC.PAGE_LIST_CHANGED, (data) => {
        setPages(data as PageState[]);
      }),
      window.moFish.subscribe(IPC.PAGE_STATE_CHANGED, (data) => {
        const { id, state } = data as { id: string; state: PageState };
        applyState(id, state);
      }),
      window.moFish.subscribe(IPC.PAGE_CLOSED, (data) => {
        removePage(String(data));
      }),
      window.moFish.subscribe(IPC.UI_NEW_PAGE_DIALOG, () => {
        setDialogOpen(true);
      }),
    ];
    return () => {
      unsubs.forEach((u) => u?.());
    };
  }, [setPages, applyState, removePage, setSettings]);

  const filtered = pages.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.url.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative flex h-full flex-col bg-neutral-50 text-neutral-900">
      <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐟</span>
          <h1 className="text-base font-semibold">MoFish Browser</h1>
        </div>
        <input
          className="ml-auto w-56 rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          placeholder="搜索标题或 URL…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => setDialogOpen(true)}
        >
          + 新建页面
        </button>
        <button
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
          onClick={() => setSettingsOpen(true)}
          title="设置"
        >
          ⚙
        </button>
      </header>

      <div className="flex gap-2 border-b border-neutral-200 bg-white px-4 py-2 text-xs">
        <button className="rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100" onClick={() => void actions.showAll()}>
          全部显示
        </button>
        <button className="rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100" onClick={() => void actions.hideAll()}>
          全部隐藏
        </button>
        <button
          className="rounded border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50"
          onClick={() => {
            if (pages.length > 0 && confirm('确定关闭全部页面？')) void actions.closeAll();
          }}
        >
          全部关闭
        </button>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-3">
        <PageList pages={filtered} />
      </main>

      <StatusBar count={pages.length} />

      {dialogOpen && (
        <NewPageDialog
          onClose={() => setDialogOpen(false)}
          onCreate={(url, size) => {
            void actions.createPage(url, size);
            setDialogOpen(false);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsDialog onClose={() => setSettingsOpen(false)} />
      )}

      {pages.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto rounded-xl bg-white p-6 text-center shadow-lg">
            <p className="text-lg font-medium">还没有任何页面</p>
            <p className="mt-1 text-sm text-neutral-500">点击「新建页面」开始</p>
            <button
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              onClick={() => setDialogOpen(true)}
            >
              新建第一个页面
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
