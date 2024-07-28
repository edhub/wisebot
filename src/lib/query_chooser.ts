import bianXieApi from "./query_bian_xie";
import ollamaApi from "./query_ollama";

export const LLM_BIAN_XIE = "bian_xie";
export const LLM_OLLAMA = "ollama";

const KEY_CURRENT_LLM = "key_current_llm";

let currentLLmName = localStorage.getItem(KEY_CURRENT_LLM) || LLM_BIAN_XIE;

export function chooseLLm(llmName: string) {
  if (currentLLmName !== llmName) {
    currentLLmName = llmName;
    localStorage.setItem(KEY_CURRENT_LLM, llmName);
  }
}

interface LlmService {
  model: string;
  query: (prompt: string, temprature?: number) => AsyncGenerator<string>;
}

const llmBianXie: LlmService = {
  model: bianXieApi.getModel(),
  query: bianXieApi.query,
};

const llmOllama: LlmService = {
  get model() {
    return ollamaApi.model;
  },
  query: ollamaApi.query,
};

const llmMap = new Map<string, LlmService>([
  [LLM_BIAN_XIE, llmBianXie],
  [LLM_OLLAMA, llmOllama],
]);

function getLLm(): LlmService {
  return llmMap.get(currentLLmName) || llmBianXie;
}

export const llmSetting = {
  get currentLLm() {
    return currentLLmName;
  },
  set currentLLm(llmName: string) {
    chooseLLm(llmName);
  },
};

export const llmApi = {
  get model() {
    return getLLm().model;
  },
  get query() {
    return getLLm().query;
  },
};
