# Wise Bot 项目架构文档

## 技术栈
Svelte 5 (Runes) + SvelteKit + Vercel AI SDK 6.0 + Tailwind CSS  
持久化：IndexedDB（`idb-keyval`）；适配器：`adapter-static`（纯客户端，无服务端路由）

## 目录结构

```
src/
├── routes/
│   └── +page.svelte         # 主页面协调器（输入框状态、快捷键、选中追问）
├── lib/
│   ├── components/          # UI 组件（ChatInput / Message / Sidebar / ...）
│   ├── config/
│   │   ├── model_config.ts  # SERVERS & MODELS 配置、createLanguageModel()
│   │   └── query_api.ts     # streamText 流式调用封装
│   ├── stores/
│   │   └── ChatStore.svelte.ts  # $state 全局状态 + IDB 持久化
│   └── utils/
│       └── markdown.ts      # Marked 单例（含 hljs + KaTeX）
└── service-worker.js
```

详细架构说明见 [`docs/architecture.md`](docs/architecture.md)。

## ⚠️ 关键 Gotcha

**`markdown.ts` — 必须保留 `useNewRenderer: true`**  
marked v13 不设置此项时，兼容层会将 token 转成旧式位置参数再调用 renderer，导致
`{ text, lang }` 解构出 `undefined`，hljs 抛异常，`parseMarkdown` 的 catch 返回原始 markdown 文本。

**`ChatStore` — `$state` 对象直接存 IDB**  
`saveChatLog` 把 `chatState.messages`（Svelte Proxy）传给 `idb-keyval`，
结构化克隆可以正确处理，无需手动 `toRaw`。

**`query_api.ts` — 历史图片用 `imageUrl` 而非 `image`**  
`image` 是 IDB 存储 key（字符串），`imageUrl` 才是实际的 Blob URL / Base64，传给 AI SDK 要用后者。

## 扩展指南

**新增模型**：在 `model_config.ts` 的 `MODELS` 中添加条目，`serverType` 指向已有 `SERVERS` key。

**新增 API 端点**：在 `SERVERS` 中添加 `{ baseUrl, apiKeyStorageKey, providerName, signupUrl }`，
然后在 `createLanguageModel()` 中按需选择 `createDeepSeek` 或 `createOpenAICompatible`。

**自定义 Markdown**：改 `lib/utils/markdown.ts`，保留 `useNewRenderer: true`（见上方 Gotcha）。

## 开发命令
```bash
npm run dev    # 开发服务器（含 Vite API 代理）
npm run build  # 生成静态站点 build/
npm run check  # TypeScript & Svelte 类型检查
```
