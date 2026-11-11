export default function StatusBar({ count }: { count: number }) {
  return (
    <footer className="border-t border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500">
      {count} 个页面 · 快捷键：⌘N 新建 · ⌘W 关闭 · ⌘H 隐藏 · ⌘T 置顶 · ⌘+/- 透明度 · ⌘1-9 切换
    </footer>
  );
}
