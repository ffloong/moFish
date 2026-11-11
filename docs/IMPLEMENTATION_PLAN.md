# MoFish Browser — 实施计划文档

## 1. 技术架构

### 1.1 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 运行时 | Electron | ≥ 30 |
| 语言 | TypeScript | ≥ 5.4 |
| 前端框架 | React | ≥ 18 |
| 构建 | Vite + electron-vite | latest |
| 打包 | electron-builder | latest |
| 状态管理 | Zustand | ≥ 4 |
| 样式 | Tailwind CSS | ≥ 3.4 |
| 测试 | Vitest + Playwright | latest |
| Lint | ESLint + Prettier | latest |

### 1.2 项目结构

```text
moFish/
├── docs/
│   ├── REQUIREMENTS.md
│   └── IMPLEMENTATION_PLAN.md
├── src/
│   ├── main/                       # Electron 主进程
│   │   ├── index.ts                # 主入口
│   │   ├── window-manager.ts       # 页面窗口生命周期管理
│   │   ├── page-window.ts          # 单个 Page Window 创建与控制
│   │   ├── manager-window.ts       # 页面管理器主窗口
│   │   ├── ipc-handlers.ts         # IPC 消息处理注册
│   │   ├── shortcuts.ts            # 全局快捷键注册
│   │   ├── persistence.ts          # 状态持久化
│   │   └── config.ts              # 应用配置
│   ├── preload/
│   │   ├── manager.d.ts            # 管理器 preload 类型
│   │   ├── manager.ts              # 管理器 preload 脚本
│   │   ├── page.d.ts               # 页面窗口 preload 类型
│   │   └── page.ts                 # 页面窗口 preload 脚本
│   ├── renderer/                   # React 渲染进程
│   │   ├── manager/                # 页面管理器 UI
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   │   ├── PageList.tsx
│   │   │   │   ├── PageCard.tsx
│   │   │   │   ├── NewPageDialog.tsx
│   │   │   │   ├── SizeControl.tsx
│   │   │   │   ├── OpacitySlider.tsx
│   │   │   │   └── StatusBar.tsx
│   │   │   └── store/
│   │   │       └── pagesStore.ts
│   │   └── shared/
│   │       ├── types.ts            # 共享类型定义
│   │       ├── constants.ts        # 常量
│   │       └── utils/
│   │           ├── url.ts          # URL 解析与补全
│   │           └── bounds.ts       # 位置/尺寸工具
│   └── assets/
│       └── icons/
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── electron-builder.yml
└── vitest.config.ts
```

### 1.3 进程通信架构

```text
┌──────────────────────────────────────────────────────────┐
│ Renderer Process（页面管理器 React App）                    │
│                                                          │
│  Zustand Store ←→ window.moFish API ←→ preload           │
└────────────────────────────┬─────────────────────────────┘
                             │ IPC
┌────────────────────────────▼─────────────────────────────┐
│ Main Process                                              │
│                                                          │
│  ipc-handlers.ts                                         │
│    ├── WindowManager                                     │
│    │     ├── createPageWindow()                          │
│    │     ├── closePageWindow()                           │
│    │     ├── setBounds()                                 │
│    │     ├── setOpacity()                                │
│    │     ├── setAlwaysOnTop()                            │
│    │     ├── show() / hide()                             │
│    │     └── focus()                                     │
│    │                                                     │
│    ├── ShortcutsManager                                  │
│    └── PersistenceManager                                │
└────────────────────────────┬─────────────────────────────┘
                             │ creates / controls
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Page     │  │ Page     │  │ Page     │
        │ Window 1 │  │ Window 2 │  │ Window N │
        └──────────┘  └──────────┘  └──────────┘
```

---

## 2. 核心数据模型

### 2.1 共享类型定义

```ts
// src/renderer/shared/types.ts

export interface PageBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageState {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  bounds: PageBounds;
  opacity: number;
  alwaysOnTop: boolean;
  alwaysOnTopLevel: 'floating' | 'screen-saver';
  visible: boolean;
  frameMode: 'framed' | 'frameless' | 'mini';
  createdAt: number;
  lastActiveAt: number;
}

export interface PageListResponse {
  pages: PageState[];
}

export interface CreatePageRequest {
  url: string;
  options?: Partial<Pick<PageState, 'bounds' | 'opacity' | 'alwaysOnTop' | 'frameMode'>>;
}

export interface UpdatePageRequest {
  id: string;
  updates: Partial<Pick<PageState,
    'bounds' | 'opacity' | 'alwaysOnTop' | 'alwaysOnTopLevel' |
    'visible' | 'frameMode' | 'title'
  >>;
}
```

### 2.2 IPC 消息契约

```ts
// IPC Channel 定义
export const IPC = {
  // Renderer → Main
  PAGE_CREATE: 'page:create',
  PAGE_CLOSE: 'page:close',
  PAGE_UPDATE: 'page:update',
  PAGE_FOCUS: 'page:focus',
  PAGE_SHOW: 'page:show',
  PAGE_HIDE: 'page:hide',
  PAGE_SET_BOUNDS: 'page:set-bounds',
  PAGE_SET_OPACITY: 'page:set-opacity',
  PAGE_SET_ALWAYS_ON_TOP: 'page:set-always-on-top',
  PAGE_GET_ALL: 'page:get-all',

  // Main → Renderer（广播）
  PAGE_LIST_CHANGED: 'page:list-changed',
  PAGE_STATE_CHANGED: 'page:state-changed',
  PAGE_CLOSED: 'page:closed',
} as const;
```

---

## 3. 实施阶段

### Phase 1：项目初始化与基础设施

**目标**：搭建可运行的项目骨架

**任务清单**：

1. 初始化项目
   - `npm create electron-vite@latest moFish -- --template react-ts`
   - 配置 TypeScript strict mode
   - 配置 ESLint + Prettier
   - 配置 Tailwind CSS
   - 配置 Vitest

2. 定义共享类型
   - 创建 `src/renderer/shared/types.ts`
   - 创建 `src/renderer/shared/constants.ts`

3. 搭建主进程骨架
   - 创建 `src/main/index.ts`
   - 创建 `src/main/manager-window.ts`
   - 创建 `src/main/page-window.ts`
   - 创建 `src/main/window-manager.ts`
   - 创建 `src/main/ipc-handlers.ts`

4. 搭建 Preload 骨架
   - 创建 `src/preload/manager.ts` + `manager.d.ts`
   - 创建 `src/preload/page.ts` + `page.d.ts`

5. 搭建渲染进程骨架
   - 创建 `src/renderer/manager/App.tsx`
   - 基础布局：顶部栏 + 空列表 + 底部栏

**完成标准**：
- `npm run dev` 可启动应用
- 管理器窗口正常显示
- TypeScript 编译无错误
- ESLint 通过

---

### Phase 2：页面窗口生命周期管理

**目标**：实现创建、关闭、列出页面窗口

**任务清单**：

1. 实现 `WindowManager`
   - 维护 `Map<string, PageWindowHandle>`
   - 提供 `create()`, `close()`, `getAll()`, `focus()`
   - 窗口关闭事件自动同步列表

2. 实现 `PageWindow` 创建
   - 创建 `BrowserWindow`
   - 加载 URL
   - 监听 `page-title-updated` 获取标题
   - 监听 `page-favicon-updated` 获取 favicon
   - 监听关闭事件清理资源

3. 实现 URL 处理工具
   - URL 自动补全（无协议时添加 `https://`）
   - 协议白名单校验

4. 实现 IPC Handler
   - `page:create`
   - `page:close`
   - `page:get-all`
   - `page:focus`

5. 实现管理器 UI — 页面列表
   - `PageList` 组件
   - `PageCard` 组件
   - 新建页面对话框
   - 显示标题、URL、状态

**完成标准**：
- 可通过管理器创建页面窗口
- 页面列表实时更新
- 可关闭单个页面
- 可点击列表聚焦某个页面

---

### Phase 3：窗口控制能力

**目标**：实现大小、位置、透明度、置顶、显示/隐藏控制

**任务清单**：

1. 实现窗口大小/位置控制
   - `BrowserWindow.setBounds()`
   - 管理器 UI：宽度/高度/X/Y 输入框
   - 预设尺寸快捷选择
   - 快捷布局（左半屏/右半屏/居中）

2. 实现透明度控制
   - `BrowserWindow.setOpacity()`
   - 管理器 UI：透明度滑块组件
   - 快捷键 `Cmd/Ctrl + +/-` 调节
   - 低于 0.3 时显示警告

3. 实现置顶控制
   - `BrowserWindow.setAlwaysOnTop(true, level)`
   - 管理器 UI：置顶开关
   - 快捷键 `Cmd/Ctrl + T` 切换
   - 置顶状态视觉指示

4. 实现显示/隐藏控制
   - `BrowserWindow.hide()` / `show()`
   - 管理器 UI：显示/隐藏按钮
   - 隐藏状态在列表中有视觉区分
   - 快捷键 `Cmd/Ctrl + H`

5. 实现状态广播
   - 页面窗口状态变化时通知管理器
   - 管理器 UI 实时同步

**完成标准**：
- 每个页面窗口可独立调整大小和位置
- 每个页面窗口可独立调节透明度
- 每个页面窗口可独立设置置顶
- 每个页面窗口可独立显示/隐藏
- 管理器 UI 实时反映所有页面状态

---

### Phase 4：全局快捷键

**目标**：实现核心快捷键系统

**任务清单**：

1. 实现 `ShortcutsManager`
   - 使用 Electron `globalShortcut` API
   - 注册/注销全局快捷键
   - 快捷键到动作的映射表

2. 注册核心快捷键
   - `Cmd/Ctrl + N` → 新建页面
   - `Cmd/Ctrl + W` → 关闭当前页面
   - `Cmd/Ctrl + H` → 隐藏/显示
   - `Cmd/Ctrl + 1~9` → 切换页面
   - `Cmd/Ctrl + Tab` → 循环切换
   - `Cmd/Ctrl + +/-` → 透明度
   - `Cmd/Ctrl + T` → 置顶

3. 快捷键冲突处理
   - 注册前检测冲突
   - 冲突时尝试备选绑定
   - 失败时提示用户

**完成标准**：
- 所有核心快捷键可用
- 快捷键在不同操作系统上正常工作
- 应用退出时释放所有快捷键

---

### Phase 5：状态持久化与恢复

**目标**：实现页面状态保存与启动恢复

**任务清单**：

1. 实现 `PersistenceManager`
   - 定义存储路径：`app.getPath('userData')/pages.json`
   - 实现原子写入（先写临时文件再 rename）
   - 实现数据校验和兼容性处理

2. 实现自动保存
   - 页面状态变化时 debounce 保存（500ms）
   - 应用退出前强制保存

3. 实现启动恢复
   - 读取上次保存的状态
   - 逐个恢复页面窗口
   - 恢复所有页面属性
   - 隐藏页面恢复为隐藏状态

4. 管理器设置界面
   - 默认窗口大小
   - 默认透明度
   - 默认置顶状态
   - 启动行为选择

**完成标准**：
- 应用退出后重新启动，恢复所有页面及状态
- 异常退出后重启可恢复
- 保存操作不影响 UI 响应

---

### Phase 6：页面窗口增强功能

**目标**：优化页面窗口体验

**任务清单**：

1. 实现窗口模式切换
   - 有边框 / 无边框 / 迷你
   - 无边框模式自绘控制条
   - 迷你模式极窄控制条

2. 实现页面右键菜单
   - 刷新 / 前进 / 后退
   - 复制 URL
   - 透明度快捷调节
   - 置顶切换
   - 隐藏 / 关闭

3. 实现页面标题自定义
   - 用户可重命名页面标题
   - 显示 favicon

4. 实现批量操作
   - 全部显示 / 全部隐藏
   - 全部关闭 / 关闭其他

**完成标准**：
- 三种窗口模式可切换
- 右键菜单功能完整
- 批量操作可用

---

### Phase 7：测试与打包

**目标**：保证质量并产出可分发安装包

**任务清单**：

1. 单元测试
   - `WindowManager` 生命周期
   - URL 解析工具
   - 持久化读写
   - 状态合并逻辑

2. 集成测试
   - 创建 → 控制 → 关闭流程
   - 状态同步流程
   - 持久化恢复流程

3. E2E 测试
   - Playwright 启动 Electron App
   - 模拟用户创建页面、调节透明度、置顶、隐藏

4. 打包配置
   - `electron-builder.yml` 配置 macOS DMG
   - 配置 Windows NSIS
   - 配置 Linux AppImage
   - 应用图标

5. CI/CD
   - GitHub Actions 自动测试
   - 自动构建产物

**完成标准**：
- 所有测试通过
- 三平台可构建安装包
- CI/CD 流水线正常

---

## 4. 关键实现细节

### 4.1 安全的 BrowserWindow 配置

```ts
// src/main/page-window.ts

import { BrowserWindow } from 'electron';

const DEFAULT_PAGE_WINDOW_OPTIONS = {
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
  },
};

export function createPageWindow(options: CreatePageRequest): BrowserWindow {
  const win = new BrowserWindow({
    width: options.options?.bounds?.width ?? 960,
    height: options.options?.bounds?.height ?? 640,
    x: options.options?.bounds?.x,
    y: options.options?.bounds?.y,
    opacity: options.options?.opacity ?? 1.0,
    alwaysOnTop: options.options?.alwaysOnTop ?? false,
    frame: true,
    ...DEFAULT_PAGE_WINDOW_OPTIONS,
  });

  win.loadURL(options.url);
  return win;
}
```

### 4.2 Preload 安全暴露 API

```ts
// src/preload/manager.ts

import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../renderer/shared/constants';

contextBridge.exposeInMainWorld('moFish', {
  pages: {
    create: (request: CreatePageRequest) =>
      ipcRenderer.invoke(IPC.PAGE_CREATE, request),
    close: (id: string) =>
      ipcRenderer.invoke(IPC.PAGE_CLOSE, id),
    getAll: () =>
      ipcRenderer.invoke(IPC.PAGE_GET_ALL),
    focus: (id: string) =>
      ipcRenderer.invoke(IPC.PAGE_FOCUS, id),
    update: (request: UpdatePageRequest) =>
      ipcRenderer.invoke(IPC.PAGE_UPDATE, request),
  },
  subscribe: (channel: string, callback: (data: unknown) => void) => {
    const validChannels = [
      IPC.PAGE_LIST_CHANGED,
      IPC.PAGE_STATE_CHANGED,
      IPC.PAGE_CLOSED,
    ];
    if (validChannels.includes(channel as any)) {
      const listener = (_event: unknown, data: unknown) => callback(data);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
    return undefined;
  },
});
```

### 4.3 窗口状态同步

```ts
// src/main/window-manager.ts（核心逻辑）

class WindowManager {
  private pages = new Map<string, PageHandle>();

  create(request: CreatePageRequest): PageState {
    const id = crypto.randomUUID();
    const win = createPageWindow(request);
    const state: PageState = {
      id,
      url: request.url,
      title: '',
      favicon: null,
      bounds: win.getBounds(),
      opacity: win.opacity,
      alwaysOnTop: false,
      alwaysOnTopLevel: 'floating',
      visible: true,
      frameMode: 'framed',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    const handle: PageHandle = { id, win, state };
    this.pages.set(id, handle);

    // 同步事件
    win.on('closed', () => {
      this.pages.delete(id);
      this.broadcastListChanged();
    });

    win.on('focus', () => {
      state.lastActiveAt = Date.now();
      this.broadcastStateChanged(id, state);
    });

    win.on('moved', () => {
      state.bounds = win.getBounds();
      this.broadcastStateChanged(id, state);
    });

    win.on('resized', () => {
      state.bounds = win.getBounds();
      this.broadcastStateChanged(id, state);
    });

    win.webContents.on('page-title-updated', (_e, title) => {
      state.title = title;
      this.broadcastStateChanged(id, state);
    });

    win.webContents.on('page-favicon-updated', (_e, favicons) => {
      state.favicon = favicons[0] ?? null;
      this.broadcastStateChanged(id, state);
    });

    return state;
  }

  setOpacity(id: string, opacity: number): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    handle.win.setOpacity(opacity);
    handle.state.opacity = opacity;
    this.broadcastStateChanged(id, handle.state);
  }

  setAlwaysOnTop(id: string, value: boolean): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    handle.win.setAlwaysOnTop(value, handle.state.alwaysOnTopLevel);
    handle.state.alwaysOnTop = value;
    this.broadcastStateChanged(id, handle.state);
  }

  hide(id: string): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    handle.win.hide();
    handle.state.visible = false;
    this.broadcastStateChanged(id, handle.state);
  }

  show(id: string): void {
    const handle = this.pages.get(id);
    if (!handle) return;
    handle.win.show();
    handle.state.visible = true;
    this.broadcastStateChanged(id, handle.state);
  }
}
```

### 4.4 持久化原子写入

```ts
// src/main/persistence.ts

import { app } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';

export class PersistenceManager {
  private get filePath(): string {
    return path.join(app.getPath('userData'), 'pages.json');
  }

  async save(pages: PageState[]): Promise<void> {
    const tmpPath = `${this.filePath}.tmp`;
    const data = JSON.stringify({ pages, savedAt: Date.now() }, null, 2);
    await fs.writeFile(tmpPath, data, 'utf-8');
    await fs.rename(tmpPath, this.filePath);
  }

  async load(): Promise<{ pages: PageState[]; savedAt: number } | null> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
```

---

## 5. 里程碑与预估

| 里程碑 | 内容 | 预估工期 |
|--------|------|----------|
| M1 | 项目初始化 + 基础骨架 | 2 天 |
| M2 | 页面窗口生命周期管理 | 3 天 |
| M3 | 窗口控制能力 | 3 天 |
| M4 | 全局快捷键 | 2 天 |
| M5 | 状态持久化与恢复 | 3 天 |
| M6 | 页面窗口增强功能 | 4 天 |
| M7 | 测试与打包 | 3 天 |
| **总计** | | **约 20 个工作日** |

---

## 6. 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| macOS 透明窗口限制 | 某些 macOS 版本透明效果受限 | 使用 `setOpacity()` 而非 `transparent`，兼容性更好 |
| 大量窗口内存占用 | 20+ 页面可能内存过高 | 设置上限提示、支持后台页面释放 |
| 全局快捷键冲突 | 与其他应用冲突 | 冲突检测 + 备选方案 |
| 跨平台行为差异 | Windows/Linux 表现不一致 | 抽象平台层、编写平台适配测试 |
| Electron 安全漏洞 | 应用被攻击 | strict CSP、contextIsolation、定期升级 Electron |

---

## 7. 质量标准

### 代码质量

- TypeScript strict mode 零错误
- ESLint 零 error
- 核心逻辑单元测试覆盖率 ≥ 80%
- 所有 IPC 消息有类型定义

### 测试要求

- 每个 Phase 完成后运行全量测试
- Phase 7 完成三平台构建
- E2E 覆盖核心用户流程

### 性能要求

- 新建页面 ≤ 500ms
- 透明度调节 ≤ 16ms 响应
- 状态保存 ≤ 100ms
- 支持 ≥ 20 个并发页面窗口
