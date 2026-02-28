import { get, set, del } from "idb-keyval";

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
  imageUrl?: string; // 运行时使用的 Blob URL
  createTime: number;
}

export const KEY_CHAT_LOG_IDB = "wise_bot_chat_log_v3";
const KEY_LEGACY_LOG = "wise_bot_chat_log_v2";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// 使用 Svelte 5 Runes 管理全局状态
export const chatState = $state({
  messages: [] as QandA[],

  // 派生状态：按树状结构排序的消息列表
  get chatLog() {
    const msgs = this.messages;
    const result: QandA[] = [];

    const walk = (parentId?: string) => {
      const children = msgs
        .filter((m) => {
          if (!parentId) return !m.parentId;
          return m.parentId === parentId;
        })
        .sort((a, b) => {
          if (!parentId) return b.createTime - a.createTime;
          return a.createTime - b.createTime;
        });

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
  },

  get rootMessages() {
    return this.messages
      .filter((m) => !m.parentId)
      .sort((a, b) => b.createTime - a.createTime);
  },
});

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
        // 迁移成功后可以考虑清理旧数据，但保守起见先保留
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
}

export async function saveChatLog() {
  if (typeof window === "undefined") return;
  // 存储到 IDB 时不持久化运行时生成的 imageUrl
  const toSave = chatState.messages.map(({ imageUrl, ...rest }) => rest);
  await set(KEY_CHAT_LOG_IDB, toSave);
}

export const confirmState = $state({
  show: false,
  title: "",
  message: "",
  onConfirm: () => {},
});

export function openConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
) {
  confirmState.title = title;
  confirmState.message = message;
  confirmState.onConfirm = () => {
    onConfirm();
    confirmState.show = false;
  };
  confirmState.show = true;
}

/**
 * 消息操作
 */

export async function saveImage(id: string, data: string | Blob) {
  let toStore: any = data;
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

export function deleteQA(qa: QandA) {
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

  children.forEach((child, index) => {
    child.parentId = targetParentId;
    if (!targetParentId) {
      child.createTime = parentCreateTime - index;
    } else {
      child.createTime = parentCreateTime + index;
    }
  });

  chatState.messages = chatState.messages.filter((m) => m.id !== qa.id);
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
    // 同时清理所有关联图片
    chatState.messages.forEach((qa) => {
      if (qa.image) del(`img_${qa.image}`);
      if (qa.imageUrl?.startsWith("blob:")) URL.revokeObjectURL(qa.imageUrl);
    });
    chatState.messages = [];
    saveChatLog();
  });
}

export function deleteGroup(roots: QandA[]) {
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

  toDelete.forEach((m) => {
    const current = chatState.messages.find((item) => item.id === m.id);
    if (current) {
      deleteQA(current);
    }
  });
}
