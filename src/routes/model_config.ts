export interface ServerConfig {
  baseUrl: string;
  apiKeyStorageKey: string;
}

export const SERVERS: Record<string, ServerConfig> = {
  'bianxie': {
    baseUrl: 'https://api.bianxie.ai/v1/chat/completions',
    apiKeyStorageKey: 'key_bian_xie_api_key',
  },
  'aliyun': {
    baseUrl: '/api/aliyun',
    apiKeyStorageKey: 'key_aliyun_api_key',
  },
};

export interface ModelConfig {
  displayName: string;
  serverType: keyof typeof SERVERS;
  requiresStream: boolean;
  defaultTemperature: number;
}

export const MODELS: Record<string, ModelConfig> = {
  'deepseek-v3': {
    displayName: 'DeepSeek V3',
    serverType: 'aliyun',
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  'deepseek-r1': {
    displayName: 'DeepSeek R1',
    serverType: 'aliyun',
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  'o3-mini': {
    displayName: 'O3 Mini',
    serverType: 'bianxie',
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  'claude-3-5-sonnet-20241022': {
    displayName: 'Claude 3.5',
    serverType: 'bianxie',
    requiresStream: true,
    defaultTemperature: 0.7,
  },
  'gpt-4o-all': {
    displayName: 'GPT-4o-all',
    serverType: 'bianxie',
    requiresStream: true,
    defaultTemperature: 0.7,
  },
}

export const DEFAULT_MODEL = 'deepseek-v3';

export function getModelConfig(modelName: string): ModelConfig {
  return MODELS[modelName] || MODELS[DEFAULT_MODEL];
}

export function getServerConfig(serverType: keyof typeof SERVERS): ServerConfig {
  return SERVERS[serverType];
}

// 存储当前选择的模型
export const KEY_CURRENT_MODEL = 'key_current_model';

export function getCurrentModel(): string {
  return localStorage.getItem(KEY_CURRENT_MODEL) || DEFAULT_MODEL;
}

export function setCurrentModel(modelName: string) {
  if (MODELS[modelName]) {
    localStorage.setItem(KEY_CURRENT_MODEL, modelName);
  }
}

export function getApiKey(serverType: keyof typeof SERVERS): string {
  const config = SERVERS[serverType];
  return localStorage.getItem(config.apiKeyStorageKey) || '';
}

export function setApiKey(serverType: keyof typeof SERVERS, key: string) {
  const config = SERVERS[serverType];
  localStorage.setItem(config.apiKeyStorageKey, key);
} 