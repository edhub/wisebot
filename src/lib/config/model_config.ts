import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createDeepSeek } from "@ai-sdk/deepseek";
import type { LanguageModel } from "ai";

export interface ServerConfig {
  baseUrl: string;
  apiKeyStorageKey: string;
  /** Provider name used by AI SDK's createOpenAICompatible */
  providerName: string;
  /** API key 注册/购买页面，显示在未设置 key 的提示中 */
  signupUrl: string;
}

export const SERVERS: Record<string, ServerConfig> = {
  deepseek: {
    baseUrl: "/api/deepseek",
    apiKeyStorageKey: "key_deepseek_api_key",
    providerName: "deepseek",
    signupUrl: "https://platform.deepseek.com/",
  },
  bianxie: {
    baseUrl: "https://api.bianxie.ai/v1",
    apiKeyStorageKey: "key_bian_xie_api_key",
    providerName: "bianxie",
    signupUrl: "https://api.bianxie.ai",
  },
  aliyun: {
    baseUrl: "/api/aliyun",
    apiKeyStorageKey: "key_aliyun_api_key",
    providerName: "aliyun",
    signupUrl: "https://dashscope.aliyuncs.com",
  },
};

export interface ModelConfig {
  displayName: string;
  fullName: string;
  serverType: keyof typeof SERVERS;
  requiresStream: boolean;
  defaultTemperature: number;
}

export const MODELS: Record<string, ModelConfig> = {
  "deepseek-chat": {
    // $0.28 - $0.42
    displayName: "DS",
    fullName: "Deepseek Chat",
    serverType: "deepseek",
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  // ⚠️ 以下模型名称需要在 bianxie 控制台确认是否正确
  // 已验证可用：gemini-3-flash-preview（outputTokens>0, finishReason=stop）
  // 未知/可能无效：gemini-3-flash-preview-thinking（outputTokens=0, rawFinishReason=undefined）
  "gemini-3.1-pro-preview": {
    // $1.25 - $10
    displayName: "Ge3.1 Pro",
    fullName: "Gemini 3.1 Pro",
    serverType: "bianxie",
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  "gemini-3-flash-preview": {
    // $0.3 - $2.5
    displayName: "Ge3 Flash",
    fullName: "Gemini 3.0 Flash",
    serverType: "bianxie",
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  "gemini-3-flash-preview-thinking": {
    // $0.3 - $2.5
    displayName: "Ge3 Flash T",
    fullName: "Gemini 3.0 Flash Thinking",
    serverType: "bianxie",
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  "gpt-5.3-codex": {
    // $1.25 - $10
    displayName: "GPT5.3-C",
    fullName: "GPT5.3-codex",
    serverType: "bianxie",
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  "deepseek-reasoner": {
    // $0.28 - $0.42
    displayName: "DS-R",
    fullName: "Deepseek Reasoner",
    serverType: "deepseek",
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  "claude-opus-4-6": {
    // $1.0 - $1.0
    displayName: "Opus 4.6",
    fullName: "Claude Opus 4.6",
    serverType: "bianxie",
    requiresStream: true,
    defaultTemperature: 0.7,
  },
};

// Fix: MODELS[0] on a Record<string,> is always undefined; use Object.values fallback
export function getModelConfig(modelName: string): ModelConfig {
  return MODELS[modelName] ?? Object.values(MODELS)[0];
}

export function getServerConfig(
  serverType: keyof typeof SERVERS,
): ServerConfig {
  return SERVERS[serverType];
}

/**
 * 根据 serverType 和 model name 创建 AI SDK 的 LanguageModel 实例。
 * 在客户端运行，使用 localStorage 中存储的 API key。
 */
export function createLanguageModel(
  modelName: string,
  modelConfig: ModelConfig,
): LanguageModel {
  const serverConfig = getServerConfig(modelConfig.serverType);
  const apiKey = getApiKey(modelConfig.serverType);

  if (modelConfig.serverType === "deepseek") {
    const deepseek = createDeepSeek({
      baseURL: serverConfig.baseUrl,
      apiKey: apiKey || "sk-placeholder",
    });
    return deepseek(modelName);
  }

  const provider = createOpenAICompatible({
    name: serverConfig.providerName,
    baseURL: serverConfig.baseUrl,
    apiKey: apiKey || "sk-placeholder",
  });
  return provider(modelName);
}

// 统一的当前模型 localStorage key（ChatInput 不再维护自己的副本）
export const KEY_CURRENT_MODEL = "key_current_model";
// 旧版 ChatInput 使用的 key，升级时自动迁移一次
const KEY_LEGACY_MODEL = "last_used_model";

export function getCurrentModel(): string {
  // 迁移旧版存储的模型选择（只执行一次）
  const legacy = localStorage.getItem(KEY_LEGACY_MODEL);
  if (legacy && MODELS[legacy]) {
    localStorage.setItem(KEY_CURRENT_MODEL, legacy);
    localStorage.removeItem(KEY_LEGACY_MODEL);
    return legacy;
  }
  return localStorage.getItem(KEY_CURRENT_MODEL) || Object.keys(MODELS)[0];
}

export function setCurrentModel(modelName: string) {
  if (MODELS[modelName]) {
    localStorage.setItem(KEY_CURRENT_MODEL, modelName);
  }
}

export function getApiKey(serverType: keyof typeof SERVERS): string {
  const config = SERVERS[serverType];
  return localStorage.getItem(config.apiKeyStorageKey) || "";
}

export function setApiKey(serverType: keyof typeof SERVERS, key: string) {
  const config = SERVERS[serverType];
  localStorage.setItem(config.apiKeyStorageKey, key);
}
