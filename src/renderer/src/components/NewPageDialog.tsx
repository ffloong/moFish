import { useState } from 'react';
import { normalizeUrl } from '../../shared/utils/url';

interface Props {
  onClose: () => void;
  onCreate: (url: string, size?: { width?: number; height?: number }) => void;
}

export default function NewPageDialog({ onClose, onCreate }: Props) {
  const [url, setUrl] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError('请输入有效 URL（http/https）');
      return;
    }
    const size: { width?: number; height?: number } = {};
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    if (Number.isFinite(w) && w > 0) size.width = w;
    if (Number.isFinite(h) && h > 0) size.height = h;
    onCreate(normalized, size);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-96 rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">新建页面</h2>
        <input
          autoFocus
          className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="输入网址，例如 example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') onClose();
          }}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

        <div className="mt-3 flex gap-2 text-sm">
          <input
            className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="宽度（可选）"
            inputMode="numeric"
            value={width}
            onChange={(e) => setWidth(e.target.value.replace(/\D/g, ''))}
          />
          <input
            className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="高度（可选）"
            inputMode="numeric"
            value={height}
            onChange={(e) => setHeight(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            onClick={submit}
          >
            打开
          </button>
        </div>
      </div>
    </div>
  );
}
