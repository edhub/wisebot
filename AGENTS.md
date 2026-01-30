# AGENTS.md - Wise Bot 项目架构文档

## 📋 项目概述

**Wise Bot** 是一个基于 Svelte 5 和 SvelteKit 构建的现代化 AI 聊天应用。它支持多个 AI 模型提供商（DeepSeek、Gemini、GPT 等），提供流式响应、本地存储、快捷键操作等功能。

### 核心特性
- 🤖 多模型支持（DeepSeek、Gemini、GPT、Claude 等）
- 💬 流式响应实时显示
- ⌨️ 快捷键支持（⌘+K 聚焦输入框，⌘+1-6 快速切换模型）
- 💾 本地存储聊天记录
- 📱 响应式设计
- 🎨 基于 Tailwind CSS 的现代化界面
- 📝 Markdown 渲染支持（含代码高亮和 LaTeX 公式）

---

## 🏗️ 架构设计

### 技术栈

```
前端框架:     Svelte 5 (Runes API) + SvelteKit
样式:         Tailwind CSS + Tailwind Typography
构建工具:     Vite
类型系统:     TypeScript
图标:         Iconify (simple-line-icons)
Markdown:     Marked + marked-katex-extension
代码高亮:     Highlight.js
适配器:       @sveltejs/adapter-static (静态站点生成)
```

### 项目结构

```
wise-bot/
├── src/
│   ├── routes/                          # SvelteKit 路由和组件
│   │   ├── +layout.svelte              # 根布局（Toast 上下文）
│   │   ├── +layout.ts                  # 布局配置（CSR only）
│   │   ├── +page.svelte                # 主页面（聊天界面入口）
│   │   ├── ChatStore.svelte.ts         # 全局状态管理（Svelte 5 Runes）
│   │   ├── model_config.ts             # 模型和服务器配置
│   │   ├── query_api.ts                # API 调用核心逻辑
│   │   ├── ChatContainer.svelte        # 聊天消息容器组件
│   │   ├── ChatInput.svelte            # 消息输入组件
│   │   ├── Message.svelte              # 单条消息展示组件
│   │   ├── MessageFolded.svelte        # 折叠消息组件
│   │   ├── Menu.svelte                 # 侧边栏菜单
│   │   ├── ApiConfig.svelte            # API 密钥配置组件
│   │   ├── InplaceEdit.svelte          # 就地编辑组件
│   │   └── Toast.svelte                # 提示消息组件
│   ├── lib/                            # 工具库
│   ├── app.css                         # 全局样式
│   ├── app.html                        # HTML 模板
│   └── service-worker.js               # Service Worker
├── static/                             # 静态资源
├── svelte.config.js                    # Svelte 配置
├── vite.config.ts                      # Vite 配置（包含代理设置）
├── tailwind.config.ts                  # Tailwind 配置
├── tsconfig.json                       # TypeScript 配置
└── package.json                        # 项目依赖
```

---

## 🔧 核心模块详解

### 1. 状态管理 (`ChatStore.svelte.ts`)

使用 Svelte 5 的 `$state` rune 实现响应式状态管理。

```typescript
核心数据结构:
- QandA: 问答对象
  - id: string                    // 唯一标识
  - question: string              // 用户问题
  - answer: string                // AI 回答
  - botName?: string              // AI 模型名称
  - userName?: string             // 用户名
  - favorite?: boolean            // 是否收藏
  - folded?: boolean              // 是否折叠
  - firstResponseTime?: number    // 首字符响应时间（ms）
  - completionTime?: number       // 完成时间（ms）
  - isResponseOngoing?: boolean   // 是否正在响应

全局状态:
- chatState.chatLog: QandA[]      // 聊天记录数组

核心函数:
- saveChatLog(): 保存聊天记录到 localStorage
- deleteQA(qa): 删除指定问答
- toggleFavorite(qa): 切换收藏状态
- toggleFold(qa): 切换折叠状态
- generateId(): 生成唯一 ID
```

**设计模式**: 单一数据源 + 响应式更新

---

### 2. 模型配置 (`model_config.ts`)

管理所有 AI 模型和服务器端点的配置。

```typescript
服务器配置 (SERVERS):
- deepseek:
  - baseUrl: /api/deepseek (通过 Vite 代理)
  - apiKeyStorageKey: key_deepseek_api_key
  
- bianxie:
  - baseUrl: https://api.bianxie.ai/v1/chat/completions
  - apiKeyStorageKey: key_bian_xie_api_key
  
- aliyun:
  - baseUrl: /api/aliyun (通过 Vite 代理)
  - apiKeyStorageKey: key_aliyun_api_key

模型配置 (MODELS):
- deepseek-chat: DeepSeek 聊天模型
- gemini-3-pro-preview: Gemini 3.0 Pro
- gemini-3-flash-preview: Gemini 3.0 Flash
- gpt-5.1: GPT 5.1
- deepseek-reasoner: DeepSeek 推理模型
- claude-opus-4-5-20251101: Claude Opus 4.5

API Key 管理:
- getApiKey(serverType): 从 localStorage 获取密钥
- setApiKey(serverType, key): 保存密钥到 localStorage
- getCurrentModel(): 获取当前选择的模型
- setCurrentModel(modelName): 设置当前模型
```

**设计特点**: 
- 配置与逻辑分离
- 支持热切换模型
- 本地存储用户配置

---

### 3. API 调用层 (`query_api.ts`)

处理与 AI 模型的通信，支持流式和非流式响应。

```typescript
核心流程:
1. prepareMessages(): 准备消息上下文（支持追问）
2. makeApiRequest(): 发起 HTTP 请求
3. handleStreamResponse(): 处理流式响应
   - 支持 reasoning_content（思考过程）
   - 实时解析 SSE 数据流
4. handleNonStreamResponse(): 处理非流式响应
5. validateApiKey(): 验证 API 密钥

流式响应解析:
- 逐行读取 Server-Sent Events (SSE)
- 解析 JSON delta 对象
- 支持 DeepSeek R1 的推理内容显示
- 使用 yield* 生成器实现增量更新

错误处理:
- API 密钥验证
- 网络错误捕获
- JSON 解析异常处理
```

**设计亮点**:
- 使用异步生成器（async generator）实现流式响应
- 统一的错误处理机制
- 支持多种响应格式

---

### 4. 主页面 (`+page.svelte`)

应用的核心入口，协调各个组件。

```typescript
核心功能:
- handleSendMessage(): 处理消息发送
  - 记录开始时间
  - 创建新的 QandA 对象
  - 流式读取 AI 响应
  - 记录响应时间指标
  - 自动保存到本地存储

- clearNonFavoriteChats(): 清除非收藏消息

- handleResendMessage(): 重新发送消息

- handleFollowUp(): 追问功能（携带上下文）

快捷键支持:
- ⌘+K: 聚焦输入框
```

**交互流程**:
```
用户输入 → ChatInput → handleSendMessage → query_api 
→ 流式响应 → 实时更新 QandA.answer → 显示在 ChatContainer
```

---

### 5. 聊天输入 (`ChatInput.svelte`)

负责用户输入和模型选择。

```typescript
核心功能:
- 自动调整 textarea 高度（最大 50vh）
- 模型快速切换（⌘+1-6）
- 快捷键发送（Enter，Shift+Enter 换行）
- 记住上次使用的模型
- 支持追问上下文显示

状态管理:
- question: 当前输入
- lastQA: 上下文问答（用于追问）
- lastModel: 上次使用的模型

导出方法:
- setQuestion(text, qa?): 设置输入内容和上下文
```

**用户体验优化**:
- 输入框自适应高度
- 全局快捷键支持
- 视觉化模型选择

---

### 6. 消息展示 (`Message.svelte`)

渲染单条问答消息，功能最丰富的组件。

```typescript
核心功能:
1. Markdown 渲染
   - 使用 marked 库
   - 自定义 renderer（代码高亮、链接处理）
   - KaTeX 数学公式支持
   - GFM（GitHub Flavored Markdown）

2. 代码高亮
   - highlight.js 集成
   - github-dark-dimmed 主题

3. 交互功能
   - 复制问题/回复
   - 重新发送
   - 追问（携带上下文）
   - 收藏/折叠
   - 删除消息
   - 导出 Markdown
   - 创建 Bear 笔记

4. 性能指标显示
   - 首字符响应时间
   - 完成时间
   - 实时计时（响应中）

5. 链接点击处理
   - 拦截 <a> 标签点击
   - 复制链接到剪贴板（iOS 兼容）
```

**渲染管线**:
```
Markdown 文本 → marked.parse() → 自定义 renderer → 
highlight.js → KaTeX → HTML → Tailwind Typography 样式
```

---

### 7. 菜单和配置 (`Menu.svelte` & `ApiConfig.svelte`)

```typescript
Menu.svelte:
- 侧边栏滑出菜单
- fade + slide 过渡动画
- 折叠全部消息
- 清除聊天历史（保留收藏）

ApiConfig.svelte:
- 管理三个平台的 API 密钥
- 使用 InplaceEdit 组件
- 响应式保存到 localStorage
```

---

### 8. Toast 通知系统 (`Toast.svelte`)

```typescript
特性:
- 跟随鼠标位置显示
- 自适应屏幕边缘（左对齐/右对齐）
- 消息队列管理
- 自动淡入淡出
- 非阻塞式提示

实现细节:
- 使用 $effect 追踪鼠标位置
- 消息队列顺序显示
- 1 秒显示时长 + 150ms 过渡
```

---

## 🔄 数据流图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户界面层                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  +page.svelte (主协调器)                                      │
│       │                                                       │
│       ├──> ChatInput.svelte                                  │
│       │    └──> 收集用户输入 + 模型选择                       │
│       │                                                       │
│       ├──> ChatContainer.svelte                              │
│       │    ├──> Message.svelte (展开)                        │
│       │    └──> MessageFolded.svelte (折叠)                  │
│       │                                                       │
│       └──> Menu.svelte                                        │
│            └──> ApiConfig.svelte                             │
│                                                               │
└───────────────────┬───────────────────────────────────────────┘
                    │
┌───────────────────▼───────────────────────────────────────────┐
│                      业务逻辑层                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ChatStore.svelte.ts (状态管理)                               │
│    ├─ chatState.chatLog: QandA[]                             │
│    ├─ saveChatLog() → localStorage                           │
│    └─ 增删改查操作                                            │
│                                                               │
│  model_config.ts (配置管理)                                   │
│    ├─ SERVERS: API 端点配置                                   │
│    ├─ MODELS: 模型元数据                                      │
│    └─ API Key 管理                                            │
│                                                               │
└───────────────────┬───────────────────────────────────────────┘
                    │
┌───────────────────▼───────────────────────────────────────────┐
│                      网络通信层                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  query_api.ts (API 调用)                                      │
│    ├─ 准备请求 (消息格式化)                                    │
│    ├─ 发起 HTTP 请求                                          │
│    ├─ 流式响应解析 (SSE)                                      │
│    └─ 错误处理                                                │
│                                                               │
└───────────────────┬───────────────────────────────────────────┘
                    │
┌───────────────────▼───────────────────────────────────────────┐
│                    外部服务层                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │  Vite Dev Server Proxy (开发环境)           │            │
│  │  ├─ /api/deepseek → DeepSeek API            │            │
│  │  └─ /api/aliyun → Aliyun DashScope          │            │
│  └─────────────────────────────────────────────┘            │
│                                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │  直接调用 (生产环境)                         │            │
│  │  └─ https://api.bianxie.ai                  │            │
│  └─────────────────────────────────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 安全机制

### API 密钥管理
- **本地存储**: 所有 API 密钥存储在浏览器 localStorage
- **不上传**: 密钥不会发送到任何第三方服务器
- **前端加密**: 密钥仅在请求头中使用

### CORS 处理
```javascript
// vite.config.ts 代理配置
server: {
  proxy: {
    '/api/aliyun': {
      target: 'https://dashscope.aliyuncs.com/...',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/api\/aliyun/, '')
    },
    '/api/deepseek': {
      target: 'https://api.deepseek.com/...',
      changeOrigin: true,
      rewrite: path => path.replace(/^\/api\/deepseek/, '')
    }
  }
}
```

**原理**: 开发环境通过 Vite 代理绕过 CORS 限制

---

## 📦 构建和部署

### 开发模式
```bash
npm run dev    # 启动开发服务器（带代理）
```

### 生产构建
```bash
npm run build  # 构建静态站点
npm run preview # 预览生产构建
```

### 适配器配置
```javascript
// svelte.config.js
adapter: adapter() // @sveltejs/adapter-static

// +layout.ts
export const ssr = false; // 纯客户端渲染
export const prerender = true;
```

**输出**: `build/` 目录包含可直接部署的静态文件

### 部署选项
- **静态托管**: Vercel, Netlify, GitHub Pages
- **Deno Deploy**: 使用 sveltekit-adapter-deno
- **传统服务器**: Nginx, Apache

---

## 🎨 样式系统

### Tailwind CSS 配置
```typescript
// tailwind.config.ts
plugins: [
  require("@tailwindcss/typography") // prose 类支持
]
```

### 关键样式类
- `.prose`: Markdown 内容样式
- `.hide-scrollbar`: 隐藏滚动条（自定义）
- `.blink`: 光标闪烁动画

### 响应式设计
- 移动端优先
- 弹性布局（Flexbox）
- 自适应高度（textarea）

---

## ⚡ 性能优化

### 1. 虚拟滚动
- 使用 `{#each}` 遍历时指定 `key` 避免不必要的重渲染
- 折叠消息减少 DOM 节点

### 2. 懒加载
- KaTeX CSS 按需加载（`<svelte:head>`）
- Highlight.js 动态语言检测

### 3. 本地存储优化
- 仅在必要时调用 `saveChatLog()`
- 避免频繁序列化大对象

### 4. 流式响应
- 使用异步生成器实现真正的流式处理
- 避免阻塞主线程

---

## 🧪 开发调试

### 类型检查
```bash
npm run check        # 一次性检查
npm run check:watch  # 监听模式
```

### 常见问题

**1. 代理不工作**
- 检查 `vite.config.ts` 代理配置
- 确保在开发模式下运行（`npm run dev`）

**2. API 密钥无效**
- 在菜单中重新配置密钥
- 检查 localStorage 中的密钥存储

**3. Markdown 渲染异常**
- 检查 `marked` 配置
- 确保 KaTeX CSS 已加载

---

## 🚀 扩展指南

### 添加新的 AI 模型

1. **在 `model_config.ts` 中添加配置**:
```typescript
export const MODELS: Record<string, ModelConfig> = {
  // ...existing models
  "new-model-name": {
    displayName: "新模型",
    fullName: "新模型完整名称",
    serverType: "bianxie", // 或创建新的 server
    requiresStream: true,
    defaultTemperature: 0.7,
  }
};
```

2. **如需新的服务器端点**:
```typescript
export const SERVERS: Record<string, ServerConfig> = {
  // ...existing servers
  newServer: {
    baseUrl: "https://api.example.com/v1/chat/completions",
    apiKeyStorageKey: "key_new_server_api_key",
  }
};
```

3. **更新 `ApiConfig.svelte`** 添加新的密钥输入框

4. **如需代理，更新 `vite.config.ts`**

### 自定义消息渲染

修改 `Message.svelte` 中的 `renderer` 对象:
```typescript
const renderer = {
  code(code, lang, escaped) {
    // 自定义代码块渲染
  },
  link(href, title, text) {
    // 自定义链接渲染
  },
  // 添加更多自定义渲染器
};
```

### 添加新功能组件

1. 在 `src/routes/` 创建新组件
2. 导入到 `+page.svelte`
3. 使用 Svelte 5 Runes (`$state`, `$derived`, `$effect`)

---

## 📊 性能指标

应用记录以下性能指标：

- **firstResponseTime**: 从发送请求到收到第一个字符的时间
- **completionTime**: 完整响应的总时间

这些指标在 `Message.svelte` 中显示，帮助用户了解模型响应速度。

---

## 🔄 状态管理最佳实践

### Svelte 5 Runes 使用

```typescript
// ✅ 正确：使用 $state
let count = $state(0);

// ✅ 正确：使用 $derived
let doubled = $derived(count * 2);

// ✅ 正确：使用 $effect
$effect(() => {
  console.log('Count changed:', count);
  return () => {
    // cleanup
  };
});

// ✅ 正确：使用 $props
let { value = $bindable(0) } = $props();
```

### 响应式更新
- 直接修改对象属性会触发更新
- 数组操作需要重新赋值（`arr = [...]`）
- 使用 `tick()` 等待 DOM 更新

---

## 📝 代码风格

### 命名规范
- **组件**: PascalCase (e.g., `ChatContainer.svelte`)
- **函数**: camelCase (e.g., `handleSendMessage`)
- **常量**: UPPER_SNAKE_CASE (e.g., `KEY_CHAT_LOG`)
- **类型**: PascalCase (e.g., `QandA`, `ModelConfig`)

### 文件组织
```
组件内部结构:
1. <script lang="ts">
   - imports
   - props
   - state
   - derived state
   - functions
   - effects
2. <svelte:head> (if needed)
3. <template>
4. <style>
```

---

## 🐛 错误处理

### 网络错误
```typescript
try {
  resp = await makeApiRequest(...);
} catch (e: any) {
  yield `出错啦: ${e.message}`;
  return;
}
```

### 流解析错误
```typescript
try {
  const jsonDelta = JSON.parse(s).choices[0]?.delta ?? {};
  // ...
} catch (e) {
  console.error("Error parsing stream response:", e);
  console.log("Raw response:", textDelta);
}
```

### 用户反馈
- 使用 Toast 组件显示操作结果
- 在消息中显示错误提示
- console.error 记录详细信息

---

## 🔮 未来优化方向

### 功能增强
- [ ] 会话管理（多会话切换）
- [ ] 消息搜索和过滤
- [ ] 导出完整对话记录
- [ ] 自定义系统提示词
- [ ] 图片输入支持（多模态）
- [ ] 语音输入/输出

### 技术改进
- [ ] 使用 IndexedDB 替代 localStorage（支持更大数据）
- [ ] 实现虚拟滚动（优化大量消息性能）
- [ ] PWA 支持（离线使用）
- [ ] 更细粒度的错误处理
- [ ] 单元测试和 E2E 测试

### 用户体验
- [ ] 主题切换（深色模式）
- [ ] 自定义快捷键
- [ ] 消息编辑功能
- [ ] 更丰富的导出格式（PDF、HTML）
- [ ] 消息标签系统

---

## 📚 参考资源

### 官方文档
- [Svelte 5 文档](https://svelte.dev/docs/svelte/overview)
- [SvelteKit 文档](https://kit.svelte.dev/docs)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

### 关键依赖
- [Marked](https://marked.js.org/) - Markdown 解析
- [Highlight.js](https://highlightjs.org/) - 代码高亮
- [KaTeX](https://katex.org/) - 数学公式渲染
- [Iconify](https://iconify.design/) - 图标库

### API 文档
- [DeepSeek API](https://platform.deepseek.com/api-docs/)
- [便携 API](https://api.bianxie.ai/)
- [阿里云 DashScope](https://help.aliyun.com/zh/dashscope/)

---

## 📄 许可证

MIT License

---

## 👥 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码审查清单
- [ ] 代码符合项目风格
- [ ] 添加了必要的注释
- [ ] 类型检查通过
- [ ] 功能在主流浏览器测试通过
- [ ] 没有引入新的警告或错误

---

**最后更新**: 2024

**维护者**: 项目团队

**反馈**: 欢迎提交 Issue 或 PR！