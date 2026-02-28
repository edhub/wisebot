# Wise Bot 样式规范

> 本文档是项目的 **唯一样式真相来源 (Single Source of Truth)**。新增或修改 UI 时请严格遵循以下规范。

---

## 目录

1. [技术基础](#1-技术基础)
2. [颜色系统](#2-颜色系统)
3. [圆角规范](#3-圆角规范)
4. [层级系统 (z-index)](#4-层级系统-z-index)
5. [排版系统](#5-排版系统)
6. [间距规范](#6-间距规范)
7. [阴影规范](#7-阴影规范)
8. [遮罩层规范](#8-遮罩层规范)
9. [动画与过渡](#9-动画与过渡)
10. [滚动条](#10-滚动条)
11. [响应式与触屏](#11-响应式与触屏)
12. [图标系统](#12-图标系统)
13. [全局样式](#13-全局样式)
14. [组件速查](#14-组件速查)

---

## 1. 技术基础

| 项目 | 选型 |
|------|------|
| CSS 框架 | Tailwind CSS (PostCSS + Autoprefixer) |
| 排版插件 | `@tailwindcss/typography` (`.prose` 类) |
| 图标 | `@iconify/tailwind`，前缀 `simple-line-icons`，scale=1 |
| Markdown 渲染 | Marked + KaTeX (CDN CSS) + Highlight.js (`github-dark-dimmed` 主题) |
| 自定义样式位置 | 全局 → `app.css`；组件级 `<style>` 仅用于无法用 Tailwind 表达的规则 |

### 配置文件

- **`tailwind.config.ts`** — 设计令牌 (颜色、圆角、z-index)
- **`app.css`** — 全局 reset、`.prose` 覆盖、滚动条工具类
- **`postcss.config.js`** — tailwindcss + autoprefixer

---

## 2. 颜色系统

### 2.1 语义化令牌 (`tailwind.config.ts → theme.extend.colors`)

以下令牌已注册到 Tailwind，可通过 `bg-brand`、`text-content-muted` 等方式直接使用。当前代码中仍以原始 Tailwind 色值为主，新代码**推荐优先使用语义化令牌**。

| 令牌 | 值 | 对应 Tailwind | 用途 |
|------|----|--------------|------|
| `brand.DEFAULT` | `#2563eb` | `blue-600` | 主操作色（FAB、发送按钮） |
| `brand.hover` | `#1d4ed8` | `blue-700` | 主操作色 hover 态 |
| `brand.light` | `#eff6ff` | `blue-50` | 品牌浅底（侧边栏选中项） |
| `brand.shadow` | `#bfdbfe` | `blue-200` | FAB 投影色 |
| `surface.DEFAULT` | `#ffffff` | `white` | 主背景 |
| `surface.muted` | `#f9fafb` | `gray-50` | 次背景（问题区、底部栏） |
| `surface.input` | `#e5e7eb` | `gray-200` | 输入框/选中按钮背景 |
| `content.DEFAULT` | `#111827` | `gray-900` | 主文字 |
| `content.secondary` | `#1f2937` | `gray-800` | 次文字（问题文字、模型名） |
| `content.muted` | `#9ca3af` | `gray-400` | 辅助文字（时间、侧边栏） |
| `content.subtle` | `#d1d5db` | `gray-300` | 最弱文字（空状态、占位图标） |
| `content.placeholder` | `#6b7280` | `gray-500` | 占位文字 |
| `border.DEFAULT` | `#e5e7eb` | `gray-200` | 标准边框 |
| `border.light` | `#f3f4f6` | `gray-100` | 弱边框（分割线） |
| `danger.DEFAULT` | `#ef4444` | `red-500` | 危险操作 |
| `danger.hover` | `#dc2626` | `red-600` | 危险操作 hover |
| `favorite` | `#fbbf24` | `amber-400` | **统一收藏色**（⭐ 星标） |
| `overlay.heavy` | `rgba(17,24,39,0.4)` | — | 模态遮罩 |
| `overlay.light` | `rgba(17,24,39,0.05)` | — | 输入框浮层遮罩 |
| `overlay.sidebar` | `rgba(0,0,0,0.2)` | — | 侧边栏遮罩 |

### 2.2 使用规则

| 场景 | ✅ 正确 | ❌ 避免 |
|------|---------|---------|
| 收藏图标（已收藏） | `text-amber-400` | ~~`text-red-500`~~、~~`text-yellow-400`~~ |
| 收藏图标（未收藏） | `text-gray-400` | ~~`text-gray-500`~~、~~`text-gray-300`~~ |
| Toast 背景 | `bg-blue-500 text-white` | ~~`bg-cyan-400`~~、~~`bg-green-500`~~ |
| 遮罩（模态） | `bg-gray-900/40` | ~~`bg-gray-800 bg-opacity-50`~~（旧语法） |

---

## 3. 圆角规范

### 3.1 令牌定义 (`tailwind.config.ts → theme.extend.borderRadius`)

| 令牌 | 值 | Tailwind 类 | 用途 |
|------|----|------------|------|
| `card` | `0.5rem` (8px) | `rounded-lg` | 消息卡片 |
| `button` / `input` | `0.75rem` (12px) | `rounded-xl` | 所有按钮、输入框、标签 |
| `dialog` | `1rem` (16px) | `rounded-2xl` | 对话框、输入框浮层容器 |
| `pill` | `9999px` | `rounded-full` | FAB、药丸标签 |

### 3.2 对照表

| 元素类型 | 使用类 | 示例组件 |
|---------|--------|---------|
| 消息卡片 | `rounded-lg` | `Message.svelte` 外层卡片 |
| 普通按钮 | `rounded-xl` | 模型选择、侧边栏按钮、清除按钮、设置按钮、移动端浮动按钮 |
| 输入框 | `rounded-xl` | `ChatInput.svelte` textarea、`ApiConfig.svelte` key 容器 |
| 对话框 | `rounded-2xl` | `ConfirmDialog.svelte`、输入框覆盖层容器 |
| FAB / 选中追问 | `rounded-full` | `+page.svelte` 右下角 FAB、选中文字追问按钮 |
| 空状态图标容器 | `rounded-3xl` | `ChatContainer.svelte` 空状态 |

### 3.3 规则

- **不要使用** `rounded`（4px）或 `rounded-md`（6px）——前者太小，后者与 `rounded-lg` 差异不够明显。
- 同一层级的元素使用同一圆角值，不要混用。

---

## 4. 层级系统 (z-index)

从低到高排列，已注册为 Tailwind 令牌：

| 层级值 | 令牌名 | Tailwind 类 | 用途 | 组件 |
|--------|--------|------------|------|------|
| `50` | `toast` | `z-50` | Toast 通知 | `Toast.svelte` |
| `60` | `sidebar-overlay` | `z-[60]` | 侧边栏遮罩 | `+page.svelte` |
| `65` | `mobile-fab` | `z-[65]` | 移动端浮动按钮 / FAB | `+page.svelte` |
| `70` | `sidebar` | `z-[70]` | 侧边栏面板 | `+page.svelte` |
| `75` | `selection-popup` | `z-[75]` | 选中文字追问 | `+page.svelte` |
| `80` | `input-overlay` | `z-[80]` | 输入框覆盖层 | `+page.svelte` |
| `100` | `menu-overlay` | `z-[100]` | 设置菜单遮罩 | `Menu.svelte` |
| `101` | `menu-panel` | `z-[101]` | 设置菜单面板 | `Menu.svelte` |
| `200` | `dialog` | `z-[200]` | 确认对话框 | `ConfirmDialog.svelte` |

### 规则

- 新增浮层时，从上表中选取合适的区间，不要随意使用任意值。
- 同一功能的遮罩和面板之间间隔 1（如 100/101）。
- 最高层级保留给阻断性交互（ConfirmDialog）。

---

## 5. 排版系统

### 5.1 字号梯度

| Tailwind 类 | 场景 | 示例 |
|-------------|------|------|
| `text-[10px]` | 最小标签 | 侧边栏分组标题、副标题、小图标 |
| `text-xs` | 辅助信息 | 操作按钮文字、模型标签、时间戳、提示语 |
| `text-sm` | 次要正文 | Toast、输入框 placeholder、对话框描述、就地编辑文字 |
| (默认 `text-base`) | 主正文 | Prose 内容区 |
| `text-lg` | 标题 | API 配置标题、对话框标题、设置图标 |
| `text-xl` | 大图标 | FAB 内图标 |
| `text-2xl` / `text-3xl` | 装饰图标 | 空状态图标 |

### 5.2 字重

| 字重 | 用途 |
|------|------|
| 默认 (400) | 正文、辅助信息 |
| `font-medium` | 侧边栏选中项、提示标签 |
| `font-semibold` | 侧边栏品牌名 |
| `font-bold` | 模型名称、当前选中模型按钮、配置标题、收藏图标 |

### 5.3 Prose 配置

```
/* app.css */
.prose {
    max-width: 100%;
}
```

全局覆盖 `@tailwindcss/typography` 默认的 `max-width: 65ch`，确保在消息卡片中 prose 内容充满容器宽度。

---

## 6. 间距规范

### 6.1 核心规则

- **列表间距统一由父容器的 `gap` 控制**，子元素不要再加 `margin`。
  - `ChatContainer.svelte` 使用 `gap-2`，`Message.svelte` 不应有 `my-*`。
  - `Sidebar.svelte` 树节点使用 `space-y-0.5`。
- **内边距梯度**：`p-2`（紧凑）→ `p-4`（标准）→ `p-6`（宽松/对话框）。

### 6.2 常用间距参考

| 场景 | 间距 |
|------|------|
| 紧凑容器（输入框、标签栏） | `p-2` / `px-2 pb-2` |
| 标准容器（设置面板、侧边栏底部） | `p-4` |
| 宽松容器（对话框内容区） | `p-6` |
| 列表项间距 | `gap-2`（消息列表）/ `space-y-0.5`（树节点）/ `space-y-6`（日期分组） |
| 内容区最大宽度 | `max-w-4xl mx-auto` |
| 消息区底部留白 | `pb-32`（为 FAB 留出空间） |

---

## 7. 阴影规范

| 阴影 | 用途 | 组件 |
|------|------|------|
| `shadow-lg` | 轻量浮层 | Toast、移动端浮动按钮 |
| `shadow-xl` | 中等浮层 | 选中文字追问弹窗 |
| `shadow-2xl` | 重要浮层 | 侧边栏(移动端)、对话框、输入框浮层 |
| `shadow-2xl shadow-gray-400/20` | 带色调阴影 | 输入框浮层容器 |
| `shadow-2xl shadow-blue-200` | 品牌色阴影 | FAB 按钮 |

### 规则

- 非浮层元素不加阴影（消息卡片通过 `border` 而非阴影区分）。
- 品牌色阴影仅用于 FAB 等核心 CTA 按钮。

---

## 8. 遮罩层规范

| 场景 | 类名 | 效果 |
|------|------|------|
| 模态遮罩 | `bg-gray-900/40 backdrop-blur-[2px]` | 深色半透明 + 微模糊 |
| 侧边栏遮罩 | `bg-black/20` | 轻度暗化（不模糊） |
| 输入框浮层 | `bg-gray-900/5 backdrop-blur-[2px]` | 极轻暗化 + 微模糊 |

### 规则

- **禁止使用旧语法** `bg-opacity-*`，统一使用 `/` 透明度语法（如 `bg-gray-900/40`）。
- 遮罩必须占满视口：`fixed inset-0`。
- 遮罩点击应触发关闭，内容区通过 `e.stopPropagation()` 阻止冒泡。

---

## 9. 动画与过渡

### 9.1 Svelte Transition

| 类型 | 时长 | 用途 | 组件 |
|------|------|------|------|
| `fade` | **150ms** | 轻量元素（Toast、选中追问弹窗） | `Toast.svelte`、`+page.svelte` |
| `fade` | **200ms** | 标准元素（遮罩层、FAB、输入框覆盖） | `+page.svelte`、`Menu.svelte`、`ConfirmDialog.svelte` |
| `slide` | **200ms** | 面板滑入（侧边栏分组、设置菜单） | `Sidebar.svelte`、`Menu.svelte` |
| `scale` | **200ms**, start=0.95 | 对话框弹入 | `ConfirmDialog.svelte` |

### 9.2 CSS Transition

| 属性 | 时长 | 用途 |
|------|------|------|
| `transition-colors` | **200ms** (`duration-200`) | 按钮颜色变化 |
| `transition-opacity` | **200ms** (`duration-200`) | hover 显隐（操作按钮） |
| `transition-all` | **200ms** (`duration-200`) | 消息列表项出入 |
| `transition-transform` | **300ms** (`duration-300`) | 侧边栏滑动（保持略长以体现物理感） |

### 9.3 自定义动画

```css
/* Message.svelte — 等待响应闪烁光标 */
@keyframes blink {
    0%   { opacity: 1; }
    50%  { opacity: 0.2; }
    100% { opacity: 1; }
}
.blink { animation: blink 1s infinite; }
```

### 9.4 规则

- **轻量元素 150ms，其余统一 200ms**，不要出现 250ms、300ms 等变体（侧边栏 transform 例外）。
- 按钮交互统一添加 `active:scale-95` 提供点击反馈。
- `touch-manipulation` 必须添加到所有可交互元素，消除移动端 300ms 延迟。

---

## 10. 滚动条

### 10.1 全局工具类 (`app.css → @layer utilities`)

| 类名 | 效果 | 使用场景 |
|------|------|---------|
| `.scrollbar-thin` | 4px 宽/高，`gray-200` thumb，hover `gray-300` | 主滚动区 (`+page.svelte`)、侧边栏 (`Sidebar.svelte`) |
| `.scrollbar-none` | 完全隐藏滚动条 | 模型选择横滑栏 (`ChatInput.svelte`) |

### 10.2 规则

- **不要在组件 `<style>` 中重复定义滚动条样式**，直接使用上述全局工具类。
- 需要滚动但不想显示滚动条的场景用 `.scrollbar-none`。
- 需要细滚动条提示的场景用 `.scrollbar-thin`。

---

## 11. 响应式与触屏

### 11.1 断点策略

项目使用 **移动优先 (Mobile First)** 策略，以 `md:` (768px) 为唯一断点：

| 特性 | 移动端 (< 768px) | 桌面端 (≥ 768px) |
|------|-----------------|-----------------|
| 侧边栏 | fixed 抽屉，`w-3/4 max-w-[300px]` | relative 内嵌，`w-1/4 min-w-[280px] max-w-[380px]` |
| 浮动按钮 (Menu/Sidebar) | 左下角显示 | 隐藏 (`md:hidden` 控制显示区) |
| 设置入口 | 左下角浮动按钮 | 侧边栏底部内嵌 (`hidden md:block`) |
| 设置面板 | `max-w-[calc(100vw-3rem)]` 防溢出 | 固定 `w-80` |
| 消息操作按钮 | 始终可见 (`opacity-100`) | hover 显示 (`md:opacity-0 md:group-hover:opacity-100`) |

### 11.2 触屏适配规则

| 规则 | 实现 |
|------|------|
| 消除点击延迟 | 所有可交互元素添加 `touch-manipulation` |
| 点击反馈 | 按钮添加 `active:scale-95` |
| 操作按钮可达性 | 移动端始终显示，桌面端 hover 显隐 |
| 惯性滚动防护 | 展开输入框时临时锁定 `overflow: hidden`，500ms 延迟恢复 |

### 11.3 hover 显隐模式

```
<!-- 移动端始终可见，桌面端 hover 显示 -->
class="opacity-100 md:opacity-0 md:group-hover:opacity-100
       md:pointer-events-none md:group-hover:pointer-events-auto
       transition-opacity duration-200"
```

此模式用于 `Message.svelte` 的操作按钮栏和收藏按钮。

---

## 12. 图标系统

| 配置项 | 值 |
|--------|-----|
| 前缀 | `simple-line-icons` |
| 缩放 | `scale: 1` |
| 使用方式 | `<span class="iconify simple-line-icons--{name}"></span>` |

### 常用图标

| 图标名 | 用途 |
|--------|------|
| `--plus` | FAB 新增、发送按钮 |
| `--menu` | 移动端展开侧边栏 |
| `--settings` | 系统设置 |
| `--star` | 收藏 |
| `--trash` | 删除分组 |
| `--bubble` | 追问、空状态 |
| `--pencil` | 空状态（主区域） |
| `--energy` | 品牌 logo (侧边栏底部) |

---

## 13. 全局样式

### `app.css` 完整结构

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Global Resets ── */
body {
    overflow: hidden;      /* 防止全页滚动 */
    position: relative;    /* 为浮层定位提供基准 */
}

pre, code {
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
}

.prose {
    max-width: 100%;       /* 覆盖 typography 默认 65ch */
}

/* ── Scrollbar Utilities ── */
@layer utilities {
    .scrollbar-thin { /* 4px 细滚动条 */ }
    .scrollbar-none { /* 完全隐藏滚动条 */ }
}
```

### 规则

- **`:global()` 禁止在组件 `<style>` 中使用**。所有全局样式集中到 `app.css`。
- 组件级 `<style>` 仅用于无法用 Tailwind 类或全局工具类表达的规则（如 `@keyframes`、`content-visibility`）。

### 当前允许的组件级 `<style>`

| 组件 | 内容 | 原因 |
|------|------|------|
| `Message.svelte` | `@keyframes blink` + `.blink` | 自定义动画 |
| `ChatContainer.svelte` | `.qa-item { content-visibility; contain-intrinsic-size }` | 性能优化，Tailwind 无对应类 |

---

## 14. 组件速查

### `+page.svelte` — 主页面布局

```
div.flex.h-screen.w-full.overflow-hidden.bg-white.text-gray-900
├── aside (侧边栏) — fixed/relative 切换，z-[70]
├── div (侧边栏遮罩) — bg-black/20，z-[60]，md:hidden
├── div (移动端浮动按钮) — fixed bottom-6 left-4，z-[65]
│   ├── button (展开历史) — rounded-xl，shadow-lg
│   └── button (系统设置) — rounded-xl，shadow-lg
└── main.flex-1
    ├── div (输入框覆盖层) — fixed inset-0，z-[80]，bg-gray-900/5 backdrop-blur-[2px]
    │   └── div — max-w-4xl，rounded-2xl shadow-2xl
    ├── div (滚动区) — scrollbar-thin
    │   └── div — max-w-4xl mx-auto
    ├── div (选中追问) — fixed，z-[75]，rounded-full
    └── div (FAB) — fixed bottom-8 right-8，z-[65]
        └── button — rounded-full bg-blue-600 shadow-2xl shadow-blue-200
```

### `Message.svelte` — 消息卡片

```
div.group (无 margin，间距由父级 gap-2 控制)
├── div (操作栏) — text-xs text-gray-400，移动端可见/桌面端 hover 显示
│   ├── [再次发送] [追问]
│   ├── [删除] [Markdown] [Bear]
│   └── button (收藏) — amber-400 (已收藏) / gray-400 (未收藏)
├── div.rounded-lg.border.border-gray-200
│   ├── div.bg-gray-50 (问题区)
│   │   ├── div.h-2.bg-gray-300 (顶部色条)
│   │   ├── article.prose (问题内容)
│   │   └── div (模型名 + 响应时间)
│   ├── hr.border-gray-300 (分割线)
│   └── article.prose (答案内容 / .blink 等待光标)
└── div (底部追问按钮) — text-xs text-gray-400
```

### `Sidebar.svelte` — 侧边栏

```
div.flex.flex-col.h-full.bg-white
├── div.scrollbar-thin (树形列表)
│   └── {#each group}
│       ├── h3.text-[10px] (分组标题：今天/昨天/更早)
│       └── {#each root} → MessageNode snippet (递归)
│           ├── button.rounded-xl (节点按钮，选中态 bg-blue-50/50 text-blue-600)
│           ├── button (收藏 ⭐ amber-400)
│           └── div.ml-2.5.pl-2.border-l (子节点缩进连线)
└── div.border-t.bg-gray-50/50 (底部栏)
    ├── div (品牌 logo + 名称)
    └── button.rounded-xl (设置按钮，桌面端可见)
```

### `ChatInput.svelte` — 输入组件

```
form.flex.flex-col
└── div.px-2.pb-2
    ├── div (上下文引用，条件显示)
    ├── div.flex.items-end.gap-2
    │   ├── textarea.rounded-xl.border.border-gray-200
    │   └── button.rounded-xl.bg-blue-600 (发送)
    └── div.scrollbar-none (模型选择栏)
        └── {#each model} button.rounded-xl (选中 bg-gray-200 font-bold)
```

### `ConfirmDialog.svelte` — 确认弹窗

```
div.fixed.inset-0.z-[200].bg-gray-900/40.backdrop-blur-[2px]
└── div.rounded-2xl.shadow-2xl.max-w-sm (iOS 风格)
    ├── div.p-6 (标题 + 描述)
    └── div.flex.border-t (取消 / 确认 按钮)
```

### `Menu.svelte` — 设置菜单

```
div.fixed.bg-gray-900/40.backdrop-blur-[2px].z-[100]
└── div.fixed.right-0.w-80.max-w-[calc(100vw-3rem)].bg-white.z-[101]
    ├── ApiConfig
    └── button.rounded-xl.bg-red-500 (清除历史)
```

### `Toast.svelte` — 消息提示

```
div.fixed.bg-blue-500.text-white.rounded-xl.shadow-lg.z-50
```

### `ApiConfig.svelte` — API 配置

```
div.flex.flex-col.gap-4
└── {#each key}
    ├── p (标签)
    └── div.rounded-xl.bg-gray-200.p-2
        └── InplaceEdit
```

### `InplaceEdit.svelte` — 就地编辑

```
编辑态: input.w-full.bg-transparent.outline-none.text-sm
展示态: p.text-sm.whitespace-nowrap.overflow-hidden.text-ellipsis
```
