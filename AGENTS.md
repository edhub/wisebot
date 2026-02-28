# Wise Bot 项目架构文档

## 📋 项目概述
基于 Svelte 5 和 SvelteKit 构建的现代化 AI 聊天应用，支持多模型流式响应、树状对话管理及本地持久化。

### 技术栈
- **框架**: Svelte 5 (Runes API) + SvelteKit
- **AI SDK**: Vercel AI SDK 6.0 (`ai` + `@ai-sdk/deepseek` + `@ai-sdk/openai-compatible`)
- **样式**: Tailwind CSS + Typography
- **Markdown**: Marked + KaTeX + Highlight.js
- **适配器**: `@sveltejs/adapter-static` (SSG)

---

## 🏗️ 核心架构

### 1. 状态管理 (`ChatStore.svelte.ts`)
使用 Svelte 5 的 `$state` 实现响应式数据流。

**数据模型 (QandA):**
- `id`: 唯一标识
- `parentId`: 父节点 ID（支持追问/分支）
- `question`/`answer`: 对话内容
- `createTime`: 时间戳（用于排序）
- `firstResponseTime`/`completionTime`: 性能指标

**核心逻辑:**
- **树状排序**: `chatLog` 派生属性通过递归将消息组织为树状结构。
- **消息迁移**: 包含从旧版 `chatLog2` 到 `wise_bot_chat_log_v2` 的数据迁移逻辑。
- **节点操作**: `deleteQA` 实现子节点自动提升，保持对话流连贯。
- **全局对话框**: `confirmState` 管理全局确认弹窗，解耦组件与逻辑。

### 2. 模型与 API 调用 (`query_api.ts` & `model_config.ts`)
- **AI SDK 集成**: 使用 Vercel AI SDK 6.0 的 `streamText` + `fullStream` 进行流式调用，替代了手写的 SSE 解析。
- **Provider 体系**: 
  - DeepSeek 端点使用 `@ai-sdk/deepseek`（`createDeepSeek`），原生支持 `reasoning_content` 解析。
  - 便携(bianxie)和阿里云端点使用 `@ai-sdk/openai-compatible`（`createOpenAICompatible`），通用 OpenAI 兼容方案。
- **模型工厂**: `createLanguageModel()` 根据 `serverType` 自动选择 provider 并创建 `LanguageModel` 实例，API key 从 `localStorage` 读取。
- **流式事件处理**: 通过 `fullStream` 的 `reasoning-delta`（思考过程）和 `text-delta`（正文）事件类型区分输出，reasoning 渲染为 blockquote 格式。
- **配置管理**: `SERVERS` 定义端点 base URL 和 provider 名称，`MODELS` 定义模型参数。
- **代理支持**: 开发环境下通过 Vite Proxy 绕过 CORS（proxy target 为不含 `/chat/completions` 的 base URL，由 AI SDK 自动拼接路径）。
- **纯客户端架构**: 本项目使用 `adapter-static`，无服务端路由。AI SDK 的 provider 直接在浏览器中运行，不走 SvelteKit 的 `+server.ts`。

### 3. 组件系统
- **`+page.svelte`**: 主协调器，负责滚动管理、选中文字追问逻辑。
- **`ChatInput.svelte`**: 支持 `⌘+1-6` 快捷切换模型，自动调节高度。
- **`Message.svelte`**: Markdown 渲染核心，集成 KaTeX、Highlight.js 及多项交互（复制、导出）。
- **`Sidebar.svelte`**: 树形导航菜单，通过 `IntersectionObserver` 实现滚动同步高亮。

---

## 🔄 关键流程

### 消息发送逻辑 (`handleSendMessage`)
1. 创建 `QandA` 对象并记录 `startTime`。
2. 将消息推入 `chatState.messages`。
3. 调用 `query` 异步生成器。
4. **节流更新**: 每隔 1s 更新一次 UI，避免高频流式响应导致页面卡顿。
5. 完成后记录 `completionTime` 并持久化到 `localStorage`。

### 树状对话逻辑
- **顶级问题**: 按 `createTime` 倒序排列（最新在前）。
- **追问分支**: 按 `createTime` 正序排列，跟随在父节点之后。
- **删除逻辑**: 删除中间节点时，其子节点会继承其 `parentId` 并微调时间戳以保持视觉顺序。

---

## ✨ UI 交互特性

### 1. 选中文字追问
- 在消息区域选中文字后，浮现“基于选中文字追问”按钮。
- 点击后自动在输入框填入“关于‘xxx’：”前缀，并绑定当前消息为上下文。

### 2. 响应式布局
- **移动端**: 浮动按钮（Menu/Settings）位于左下角，使用 `fade` 动画切换；对话列表作为抽屉式侧边栏。
- **输入框覆盖层**: 当用户点击“提问”时，输入框以 Modal 形式覆盖，背景应用 `backdrop-blur`。

### 3. 性能优化
- **滚动锁定**: 展开输入框时短时间锁定 `overflow`，防止移动端惯性滚动干扰。
- **节流渲染**: `handleSendMessage` 中对流式数据进行 1000ms 缓冲处理，显著提升弱网或高频输出时的帧率。

---

## 🛠️ 常用开发命令
- `npm run dev`: 启动开发服务器（含 API 代理）
- `npm run build`: 生成静态站点 (`build/`)
- `npm run check`: TypeScript & Svelte 类型检查

## 💡 扩展指南
- **新增模型**: 在 `model_config.ts` 的 `MODELS` 中添加配置（指定 `serverType` 关联到已有的 `SERVERS` 端点）。
- **新增 API 端点**: 在 `SERVERS` 中添加条目（含 `baseUrl`、`apiKeyStorageKey`、`providerName`），并在 `createLanguageModel()` 中按需选择 `createDeepSeek` 或 `createOpenAICompatible`。
- **自定义渲染**: 修改 `Message.svelte` 中的 `marked` 配置或渲染逻辑。
- **持久化方案**: 目前使用 `localStorage`，若数据量过大可考虑迁移至 `IndexedDB`。