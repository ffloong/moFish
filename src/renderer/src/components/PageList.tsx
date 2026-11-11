import { useEffect, useState } from 'react';
import type { PageState, DisplayInfo } from '../../shared/types';
import { resolveTargetDisplay, type LayoutPreset } from '../../shared/utils/bounds';
import { displayUrl } from '../../shared/utils/url';
import { usePageActions } from '../store/pagesStore';

const LAYOUTS: { key: LayoutPreset; label: string }[] = [
  { key: 'left', label: '左半' },
  { key: 'right', label: '右半' },
  { key: 'top', label: '上半' },
  { key: 'bottom', label: '下半' },
  { key: 'full', label: '全屏' },
  { key: 'center', label: '居中' },
];

function PageCard({ page }: { page: PageState }) {
  const actions = usePageActions();
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [targetDisplayId, setTargetDisplayId] = useState<number | undefined>(undefined);
  const currentDisplay = resolveTargetDisplay(displays, undefined, page.bounds);

  useEffect(() => {
    void window.moFish.displays.getAll().then(setDisplays);
  }, []);

  const applyLayout = (preset: LayoutPreset) => {
    void actions.applyLayout(page.id, preset, targetDisplayId);
  };

  return (
    <div
      className={`rounded-lg border bg-white p-3 shadow-sm transition ${
        page.alwaysOnTop ? 'border-blue-400 ring-1 ring-blue-200' : 'border-neutral-200'
      } ${!page.visible ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
        {page.favicon ? (
          <img src={page.favicon} alt="" className="h-5 w-5 rounded" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded bg-neutral-200 text-xs">
            🌐
          </div>
        )}
        <button
          className="min-w-0 flex-1 truncate text-left font-medium hover:text-blue-600"
          onClick={() => void actions.focusPage(page.id)}
          title={page.url}
        >
          {page.title || displayUrl(page.url)}
        </button>
        <div className="flex gap-1">
          {page.alwaysOnTop && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
              置顶
            </span>
          )}
          {!page.visible && (
            <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
              隐藏
            </span>
          )}
          {page.opacity < 1 && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              {Math.round(page.opacity * 100)}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 truncate text-xs text-neutral-500">{displayUrl(page.url)}</div>

      {displays.length > 1 && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <span className="text-neutral-500">目标屏</span>
          <button
            className={`rounded border px-2 py-0.5 ${
              targetDisplayId === undefined
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-neutral-300 hover:bg-neutral-100'
            }`}
            onClick={() => setTargetDisplayId(undefined)}
            title="按窗口当前所在屏幕计算布局"
          >
            当前{currentDisplay ? `（${currentDisplay.label}）` : ''}
          </button>
          {displays.map((d) => (
            <button
              key={d.id}
              className={`rounded border px-2 py-0.5 ${
                targetDisplayId === d.id
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-neutral-300 hover:bg-neutral-100'
              }`}
              onClick={() => setTargetDisplayId(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button
          className="rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
          onClick={() => void actions.focusPage(page.id)}
        >
          聚焦
        </button>
        <button
          className="rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
          onClick={() => void actions.toggleVisibility(page.id, page.visible)}
        >
          {page.visible ? '隐藏' : '显示'}
        </button>
        <button
          className={`rounded border px-2 py-1 ${
            page.alwaysOnTop
              ? 'border-blue-400 bg-blue-50 text-blue-700'
              : 'border-neutral-300 hover:bg-neutral-100'
          }`}
          onClick={() => void actions.setAlwaysOnTop(page.id, !page.alwaysOnTop)}
        >
          {page.alwaysOnTop ? '取消置顶' : '置顶'}
        </button>

        <label className="flex items-center gap-2">
          <span className="text-neutral-500">透明</span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={Math.round(page.opacity * 100)}
            onChange={(e) => void actions.setOpacity(page.id, Number(e.target.value) / 100)}
            className="w-28 accent-blue-600"
          />
          <span className="w-8 tabular-nums text-neutral-500">
            {Math.round(page.opacity * 100)}%
          </span>
        </label>

        {LAYOUTS.map((l) => (
          <button
            key={l.key}
            className="rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
            onClick={applyLayout.bind(null, l.key)}
            title={
              targetDisplayId !== undefined
                ? `布局到${displays.find((d) => d.id === targetDisplayId)?.label}`
                : '按窗口当前屏幕布局'
            }
          >
            {l.label}
          </button>
        ))}

        <span className="ml-auto flex gap-1">
          <button
            className="rounded border border-neutral-300 px-2 py-1 text-neutral-600 hover:bg-neutral-100"
            onClick={() => void actions.closeOthers(page.id)}
            title="关闭其他页面"
          >
            关闭其他
          </button>
          <button
            className="rounded border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50"
            onClick={() => void actions.closePage(page.id)}
          >
            关闭
          </button>
        </span>
      </div>
    </div>
  );
}

export default function PageList({ pages }: { pages: PageState[] }) {
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3">
      {pages.map((p) => (
        <PageCard key={p.id} page={p} />
      ))}
    </div>
  );
}
