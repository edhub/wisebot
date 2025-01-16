import { writable } from 'svelte/store';

export interface QandA {
  id: string;
  question: string;
  answer: string;
  botName?: string;
  userName?: string;
  favorite?: boolean;
  folded?: boolean;
  timestamp?: number;
  firstResponseTime?: number;  // 第一个字符返回的时间
  completionTime?: number;    // 请求完成的时间
}

export const KEY_CHAT_LOG = "chatLog2";

// 初始化聊天记录
const storedChatLog = localStorage.getItem(KEY_CHAT_LOG);
const initialChatLog = storedChatLog ? JSON.parse(storedChatLog) : [];

export const chatLog = writable<QandA[]>(initialChatLog);
export const isRespOngoing = writable(false);
export const tempQA = writable<QandA>({ id: "", question: "", answer: "" });

// 自动保存聊天记录
chatLog.subscribe(value => {
  localStorage.setItem(KEY_CHAT_LOG, JSON.stringify(value));
});

// 聊天操作函数
export function deleteQA(qa: QandA) {
  chatLog.update(log => log.filter(q => q.id !== qa.id));
}

export function toggleFavorite(qa: QandA) {
  qa.favorite = !qa.favorite;
  chatLog.update(log => log);
}

export function toggleFold(qa: QandA) {
  qa.folded = !qa.folded;
  chatLog.update(log => log);
}

// 生成唯一ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
} 