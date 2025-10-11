# Wise Bot

一个基于 Svelte 5 的现代化 AI 聊天应用，支持多个 AI 模型提供商。

## ✨ 特性

- 🤖 **多模型支持**: 集成 DeepSeek、Gemini、GPT 等多个 AI 模型
- 💬 **流式响应**: 实时显示 AI 回答过程
- ⌨️ **快捷键支持**: 快速切换模型和发送消息
- 💾 **本地存储**: 自动保存聊天记录
- 📱 **响应式设计**: 适配桌面和移动设备
- 🎨 **优雅界面**: 基于 Tailwind CSS 的现代化设计

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 开始使用。

## 🔧 配置

### API Key 设置

在应用设置中配置以下 API Key：

1. **DeepSeek API Key**: 在 [DeepSeek Platform](https://platform.deepseek.com/)
   获取
2. **便携 API Key**: 在 [便携平台](https://api.bianxie.ai/) 获取
3. **阿里云 API Key**: 在 [阿里云控制台](https://dashscope.aliyuncs.com/) 获取

### 快捷键

- `⌘ + K`: 快速聚焦输入框
- `⌘ + 1-6`: 快速切换 AI 模型
- `Enter`: 发送消息
- `Shift + Enter`: 换行

## 📦 可用模型

- **Grok 4** - 快速推理
- **Gemini Flash/Pro** - Google 最新模型
- **DeepSeek Chat/R1** - 高性价比中文模型
- **GPT5 Codex** - 代码生成专用

## 🛠️ 开发

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 类型检查

```bash
npm run check
```

### 代码质量检查

```bash
npm run check:watch
```

## 📁 项目结构

```
src/
├── routes/                 # 页面和组件
│   ├── ChatStore.svelte.ts # 聊天状态管理
│   ├── query_api.ts        # API 调用逻辑
│   ├── model_config.ts     # 模型配置
│   └── *.svelte           # UI 组件
├── lib/                   # 工具库
└── app.html              # HTML 模板
```

## 🏗️ 技术栈

- **前端框架**: Svelte 5 + SvelteKit
- **样式**: Tailwind CSS + Tailwind Typography
- **构建工具**: Vite
- **类型检查**: TypeScript
- **图标**: Iconify
- **Markdown**: Marked + KaTeX

## 🔒 安全说明

- API Keys 仅存储在浏览器本地
- 不会上传任何数据到第三方服务器
- 支持代理配置以绕过 CORS 限制

## 📄 许可证

MIT License
