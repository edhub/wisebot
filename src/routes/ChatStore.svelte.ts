export interface QandA {
  id: string;
  question: string;
  answer: string;
  botName?: string;
  userName?: string;
  favorite?: boolean;
  folded?: boolean;
  firstResponseTime?: number;  // 第一个字符返回的时间
  completionTime?: number;    // 请求完成的时间
}

export const KEY_CHAT_LOG = "chatLog2";

// 初始化聊天记录
const storedChatLog = localStorage.getItem(KEY_CHAT_LOG);
const initialChatLog = storedChatLog ? JSON.parse(storedChatLog) : [];

export const chatState = $state({
  chatLog: initialChatLog as QandA[],
  isRespOngoing: false,
  tempQA: { id: "", question: "", answer: "" } as QandA
});

function saveChatLog() {    
  localStorage.setItem(KEY_CHAT_LOG, JSON.stringify(chatState.chatLog));
}

export function addQA(qa: QandA) {
  chatState.chatLog = [qa, ...chatState.chatLog];
  saveChatLog();
}

// 聊天操作函数
export function deleteQA(qa: QandA) {
  chatState.chatLog = chatState.chatLog.filter((q: QandA) => q.id !== qa.id);
  saveChatLog();
}

export function toggleFavorite(qa: QandA) {
  qa.favorite = !qa.favorite;
  saveChatLog();
}

export function toggleFold(qa: QandA) {
  qa.folded = !qa.folded;
  saveChatLog();
}

// 生成唯一ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
} 