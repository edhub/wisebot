# 架构详解

## 数据模型（QandA）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 随机 7 位 base36 |
| `parentId` | string? | 父节点 ID，顶层消息无此字段 |
| `question` / `answer` | string | 对话内容，answer 为 markdown |
| `image` | string? | IDB 图片 key（`img_${id}`） |
| `imageUrl` | string? | 运行时 Blob URL 或 Base64，不持久化 |
| `createTime` | number | 毫秒时间戳，用于排序 |
| `firstResponseTime` / `completionTime` | number? | 首字节/完成耗时（ms） |
| `favorite` / `folded` / `isResponseOngoing` | boolean? | UI 状态 |

## 状态管理（ChatStore.svelte.ts）

`chatState` 是顶层 `$state` 对象，包含：

- **`messages`**：所有 QandA 的扁平数组，持久化到 IDB key `wise_bot_chat_log_v3`。
- **`chatLog`**（getter）：O(n) 树状排序结果。用 `buildChildrenMap` 一次遍历建映射，顶层按 `createTime` 倒序，子节点按正序，游离节点兜底追加。
- **`rootMessages`**（getter）：仅顶层节点，供 Sidebar 分组。

**数据迁移**：`initChatStore` 启动时检查旧 key `wise_bot_chat_log_v2`（localStorage），
存在则迁移写入 IDB 后删除。

**图片存储**：`saveImage(id, data)` 将 Base64 转 Blob 后存入 IDB（key `img_${id}`）。
`initChatStore` 加载时为每条含 `image` 的消息调用 `URL.createObjectURL` 生成 `imageUrl`。

**删除逻辑**：`_removeQA` 执行删除不保存；`deleteQA` = `_removeQA` + `saveChatLog`；
`deleteGroup` 批量调用 `_removeQA`，最后统一调用一次 `saveChatLog`。

## 模型与 API（lib/config/）

### model_config.ts

```
SERVERS: Record<string, ServerConfig>   // 端点：baseUrl / apiKeyStorageKey / providerName / signupUrl
MODELS:  Record<string, ModelConfig>    // 模型：displayName / serverType / defaultTemperature
```

- **DeepSeek 端点**：用 `createDeepSeek`，原生解析 `reasoning_content`（思考过程）。
- **其他端点**：用 `createOpenAICompatible`。
- **模型选择持久化**：统一读写 localStorage key `key_current_model`；含从旧 key `last_used_model` 的一次性迁移。

### query_api.ts

流式调用 `streamText` + `fullStream`：
- `reasoning-delta` → 拼接为 `> 思考中...\n> ` blockquote 格式
- `text-delta` → 正文
- `finish` → 空响应兜底（区分 content-filter / length / 模型名有误等情况）
- 超时：AbortController 120s

历史上下文只传一轮（`lastQA`），图片经 `resolveImageToDataUrl` 转 Base64 再传入。

## 组件说明

| 组件 | 职责 |
|------|------|
| `+page.svelte` | 协调器：`isInputExpanded` 状态、`⌘K` 展开输入框、`⌘1-N` 切换模型（非 textarea 焦点时）、选中文字追问浮动按钮 |
| `ChatInput` | textarea + 模型按钮；`⌘数字` 在 textarea 焦点时切换模型并发送 |
| `Message` | `$derived(parseMarkdown(answer))` 响应式渲染；复制优先 Clipboard API，降级 execCommand |
| `Sidebar` | `$derived.by` 预构建 `childrenMap`（O(n)）；按今天/本周/更早分组；支持分组批量清除 |
| `ChatContainer` | KaTeX CSS 从 npm 引入（离线可用），不依赖 CDN |
| `InplaceEdit` | 行内编辑控件；Enter/blur 提交，触发 `onchange` 回调 |
| `ApiConfig` | API key 配置；`onchange` 触发 `setApiKey`，不用 `$effect` 监听 |

## 消息发送流程

1. 创建 `QandA`，`chatState.messages.push(newQA)`，收起输入框
2. 滚动到新消息
3. `for await (delta of query(...))` 循环，**节流 1s** 批量写入 `newQA.answer`
4. 完成后写 `completionTime`，调用 `saveChatLog()`

## Service Worker

缓存 key 为 `cache-${version}`（构建哈希），同版本复用，跨版本 activate 时自动清理旧缓存。
API 路径（`/api/`）始终走网络，静态资源走 stale-while-revalidate。
