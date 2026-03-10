import { get, set, del } from "idb-keyval";
import { openConfirm } from "$lib/shared/confirm.svelte";

export interface QandA {
  id: string;
  parentId?: string;
  question: string;
  answer: string;
  botName?: string;
  userName?: string;
  favorite?: boolean;
  folded?: boolean;
  firstResponseTime?: number;
  completionTime?: number;
  isResponseOngoing?: boolean;
  image?: string; // 存储在 IDB 中的图片 ID
  imageUrl?: string; // 运行时使用的 Blob URL 或 Base64 Data URL
  createTime: number;
}

export const KEY_CHAT_LOG_IDB = "wise_bot_chat_log_v3";
const KEY_LEGACY_LOG = "wise_bot_chat_log_v2";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// 预构建 parentId → children 的映射，O(n) 复杂度
function buildChildrenMap(messages: QandA[]): Map<string | undefined, QandA[]> {
  const map = new Map<string | undefined, QandA[]>();
  for (const m of messages) {
    const key = m.parentId;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return map;
}

// 使用 Svelte 5 Runes 管理全局状态
export const chatState = $state({
  messages: [] as QandA[],
  isLoading: true,
});

/**
 * 派生状态：按树状结构排序的消息列表（$derived 缓存，只在 messages 变化时重算）
 * Svelte 5 模块限制：$derived 不可直接 export，用函数包裹暴露。
 */
const _chatLog = $derived.by(() => {
  const msgs = chatState.messages;

  const childrenMap = buildChildrenMap(msgs);

  childrenMap.forEach((children, key) => {
    children.sort((a, b) =>
      key === undefined
        ? b.createTime - a.createTime
        : a.createTime - b.createTime,
    );
  });

  const result: QandA[] = [];
  const walk = (parentId?: string) => {
    const children = childrenMap.get(parentId) ?? [];
    for (const child of children) {
      result.push(child);
      walk(child.id);
    }
  };

  walk();

  if (result.length < msgs.length) {
    const resultIds = new Set(result.map((m) => m.id));
    msgs.forEach((m) => {
      if (!resultIds.has(m.id)) result.push(m);
    });
  }

  return result;
});

/** 派生状态：仅顶层消息，按时间倒序（$derived 缓存） */
const _rootMessages = $derived.by(() =>
  chatState.messages
    .filter((m) => !m.parentId)
    .sort((a, b) => b.createTime - a.createTime),
);

export function getChatLog() {
  return _chatLog;
}

export function getRootMessages() {
  return _rootMessages;
}

/**
 * 初始化数据：从 IndexedDB 加载并处理迁移
 */
export async function initChatStore() {
  if (typeof window === "undefined") return;

  let messages: QandA[] = [];

  // 1. 尝试从新版 IndexedDB 加载
  const stored = await get(KEY_CHAT_LOG_IDB);
  if (stored && Array.isArray(stored)) {
    messages = stored;
  } else {
    // 2. 尝试从旧版 localStorage 迁移
    const legacy = localStorage.getItem(KEY_LEGACY_LOG);
    if (legacy) {
      try {
        messages = JSON.parse(legacy);
        await set(KEY_CHAT_LOG_IDB, messages);
      } catch (e) {
        console.error("Migration from localStorage failed", e);
      }
    }
  }

  // 3. 异步加载图片并生成运行时 URL
  for (const qa of messages) {
    // 重置回复中状态，防止刷新页面后状态残留导致卡死
    if (qa.isResponseOngoing) {
      qa.isResponseOngoing = false;
    }

    if (qa.image && !qa.imageUrl) {
      const imgData = await get(`img_${qa.image}`);
      if (imgData instanceof Blob) {
        qa.imageUrl = URL.createObjectURL(imgData);
      } else if (typeof imgData === "string") {
        qa.imageUrl = imgData; // 兼容旧的 Base64
      }
    }
  }

  chatState.messages = messages;
  chatState.isLoading = false;
}

export async function saveChatLog() {
  if (typeof window === "undefined") return;
  // 存储到 IDB 时不持久化运行时生成的 imageUrl
  const toSave = chatState.messages.map(({ imageUrl, ...rest }) => rest);
  await set(KEY_CHAT_LOG_IDB, toSave);
}

/**
 * 消息操作
 */

export async function saveImage(id: string, data: string | Blob) {
  let toStore: Blob | string = data;
  if (typeof data === "string" && data.startsWith("data:")) {
    const res = await fetch(data);
    toStore = await res.blob();
  }
  await set(`img_${id}`, toStore);
  return id;
}

export function addMessage(qa: QandA) {
  chatState.messages.push(qa);
  saveChatLog();
}

// 内部实现：执行删除逻辑但不保存，用于批量操作
function _removeQA(qa: QandA) {
  if (qa.image) {
    del(`img_${qa.image}`).catch(console.error);
    if (qa.imageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(qa.imageUrl);
    }
  }

  const targetParentId = qa.parentId;
  const parentCreateTime = qa.createTime;
  const children = chatState.messages
    .filter((m) => m.parentId === qa.id)
    .sort((a, b) => a.createTime - b.createTime);

  // 子节点提升：继承被删节点的 parentId
  children.forEach((child, index) => {
    child.parentId = targetParentId;
    if (!targetParentId) {
      child.createTime = parentCreateTime - index;
    } else {
      child.createTime = parentCreateTime + index;
    }
  });

  chatState.messages = chatState.messages.filter((m) => m.id !== qa.id);
}

export function deleteQA(qa: QandA) {
  _removeQA(qa);
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

export function toggleFoldAll(folded: boolean) {
  chatState.messages.forEach((qa) => {
    qa.folded = folded;
  });
  saveChatLog();
}

export function clearAllMessages() {
  openConfirm("清空所有", "确定要清空所有对话吗？", () => {
    chatState.messages.forEach((qa) => {
      if (qa.image) del(`img_${qa.image}`);
      if (qa.imageUrl?.startsWith("blob:")) URL.revokeObjectURL(qa.imageUrl);
    });
    chatState.messages = [];
    saveChatLog();
  });
}

export function deleteGroup(roots: QandA[]) {
  // 收集整个子树的所有节点 ID
  const groupMessageIds = new Set<string>();
  const stack = [...roots.map((r) => r.id)];
  while (stack.length > 0) {
    const id = stack.pop()!;
    groupMessageIds.add(id);
    chatState.messages
      .filter((m) => m.parentId === id)
      .forEach((m) => stack.push(m.id));
  }

  const toDelete = chatState.messages.filter(
    (m) => groupMessageIds.has(m.id) && !m.favorite,
  );

  if (toDelete.length === 0) return;

  // 批量删除：逐个执行但不触发保存，最后统一保存一次
  for (const m of toDelete) {
    const current = chatState.messages.find((item) => item.id === m.id);
    if (current) {
      _removeQA(current); // 不调用 saveChatLog
    }
  }

  saveChatLog(); // 只保存一次
}
