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
  createTime: number;
}

export const KEY_CHAT_LOG = "wise_bot_chat_log_v2";
const KEY_LEGACY_LOG = "chatLog2";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// 初始数据加载与迁移逻辑
function loadInitialMessages(): QandA[] {
  if (typeof localStorage === "undefined") return [];

  const stored = localStorage.getItem(KEY_CHAT_LOG);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse chat log", e);
    }
  }

  // 尝试从旧版数据迁移
  const legacy = localStorage.getItem(KEY_LEGACY_LOG);
  if (legacy) {
    try {
      const messages = JSON.parse(legacy);
      if (Array.isArray(messages)) {
        return messages.map((m, i) => ({
          ...m,
          createTime: m.createTime || Date.now() - (messages.length - i) * 1000,
        }));
      }
    } catch (e) {
      console.error("Migration failed", e);
    }
  }

  return [];
}

const initialMessages = loadInitialMessages();

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

// 使用 Svelte 5 Runes 管理全局状态
export const chatState = $state({
  messages: initialMessages as QandA[],

  // 派生状态：按树状结构排序的消息列表（用于右侧详情展示）
  get chatLog() {
    const msgs = this.messages;
    const result: QandA[] = [];

    const walk = (parentId?: string) => {
      // 找出所有父级为 parentId 的消息
      // 顶级问题按时间倒序排列（最新的在最前），追问按时间正序排列
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

    // 兜底：处理可能的孤立节点
    if (result.length < msgs.length) {
      const resultIds = new Set(result.map((m) => m.id));
      msgs.forEach((m) => {
        if (!resultIds.has(m.id)) result.push(m);
      });
    }

    return result;
  },

  // 获取所有顶层问题（根节点）
  get rootMessages() {
    return this.messages
      .filter((m) => !m.parentId)
      .sort((a, b) => b.createTime - a.createTime);
  },
});

export function saveChatLog() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY_CHAT_LOG, JSON.stringify(chatState.messages));
}

/**
 * 消息操作
 */

export function addMessage(qa: QandA) {
  chatState.messages.push(qa);
  saveChatLog();
}

export function deleteQA(qa: QandA) {
  const targetParentId = qa.parentId;
  const parentCreateTime = qa.createTime;

  // 找出所有直接子节点并按原有的 createTime 排序
  const children = chatState.messages
    .filter((m) => m.parentId === qa.id)
    .sort((a, b) => a.createTime - b.createTime);

  // 将子节点升级，并微调时间以保持它们在父节点原有的位置顺序
  children.forEach((child, index) => {
    child.parentId = targetParentId;
    // 使用父节点的 createTime 作为基准。
    // 如果升级为顶级问题(root)，由于 root 是按 createTime 倒序排列，
    // 我们减去偏移量 index 以确保这批子节点内部依然保持原有的先后顺序（即 index 越大的时间越早，排在后面）。
    // 如果依然是子节点，由于子节点是按 createTime 正序排列，
    // 我们加上偏移量 index 以确保原有的先后顺序。
    if (!targetParentId) {
      child.createTime = parentCreateTime - index;
    } else {
      child.createTime = parentCreateTime + index;
    }
  });

  // 仅删除当前节点
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
    chatState.messages = [];
    saveChatLog();
  });
}

export function deleteGroup(roots: QandA[]) {
  const rootIds = new Set(roots.map((r) => r.id));

  // 找出属于这些根节点的所有消息 ID
  const groupMessageIds = new Set<string>();
  const stack = [...roots.map((r) => r.id)];
  while (stack.length > 0) {
    const id = stack.pop()!;
    groupMessageIds.add(id);
    chatState.messages
      .filter((m) => m.parentId === id)
      .forEach((m) => stack.push(m.id));
  }

  // 找出该分组内所有未收藏的消息
  // 调用 deleteQA 处理，它会自动处理子节点的提升逻辑
  const toDelete = chatState.messages.filter(
    (m) => groupMessageIds.has(m.id) && !m.favorite,
  );

  // 如果没有可删除的，直接返回
  if (toDelete.length === 0) return;

  toDelete.forEach((m) => {
    const current = chatState.messages.find((item) => item.id === m.id);
    if (current) {
      deleteQA(current);
    }
  });
}
