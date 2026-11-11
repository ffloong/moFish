import { useState } from 'react';
import type { AppSettings } from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/constants';
import { usePagesStore, usePageActions } from '../store/pagesStore';

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const settings = usePagesStore((s) => s.settings) ?? DEFAULT_SETTINGS;
  const setSettings = usePagesStore((s) => s.setSettings);
  const { updateSettings } = usePageActions();
  const [draft, setDraft] = useState<AppSettings>(settings);

  const save = () => {
    void updateSettings(draft).then((s) => setSettings(s as AppSettings));
    onClose();
  };

  const num = (v: string, min: number, max: number, fallback: number): number => {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-96 rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold">设置</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>默认宽度</span>
            <input
              className="w-24 rounded border border-neutral-300 px-2 py-1"
              value={draft.defaultWidth}
              onChange={(e) =>
                setDraft({ ...draft, defaultWidth: num(e.target.value, 200, 8000, settings.defaultWidth) })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span>默认高度</span>
            <input
              className="w-24 rounded border border-neutral-300 px-2 py-1"
              value={draft.defaultHeight}
              onChange={(e) =>
                setDraft({ ...draft, defaultHeight: num(e.target.value, 150, 4000, settings.defaultHeight) })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span>默认透明度</span>
            <input
              type="range"
              min={30}
              max={100}
              step={5}
              value={Math.round(draft.defaultOpacity * 100)}
              onChange={(e) => setDraft({ ...draft, defaultOpacity: Number(e.target.value) / 100 })}
              className="w-40 accent-blue-600"
            />
            <span className="w-10 text-right tabular-nums">{Math.round(draft.defaultOpacity * 100)}%</span>
          </div>
          <label className="flex items-center justify-between">
            <span>默认置顶</span>
            <input
              type="checkbox"
              checked={draft.defaultAlwaysOnTop}
              onChange={(e) => setDraft({ ...draft, defaultAlwaysOnTop: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between">
            <span>启动时恢复页面</span>
            <input
              type="checkbox"
              checked={draft.startupBehavior === 'restore'}
              onChange={(e) =>
                setDraft({ ...draft, startupBehavior: e.target.checked ? 'restore' : 'blank' })
              }
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100" onClick={onClose}>
            取消
          </button>
          <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700" onClick={save}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
