<script lang="ts">
    import {
        chatState,
        toggleFavorite,
        deleteGroup,
        type QandA,
    } from "$lib/chat/ChatStore.svelte";
    import { openConfirm } from "$lib/shared/confirm.svelte";
    import { slide } from "svelte/transition";
    import { getContext } from "svelte";

    let {
        showMenu = $bindable(false),
        onSelect,
        activeId = null,
    } = $props<{
        showMenu?: boolean;
        onSelect?: () => void;
        activeId?: string | null;
    }>();

    // 按时间段分组顶层消息
    function groupRootMessages(roots: QandA[]) {
        const groups: { label: string; items: QandA[] }[] = [
            { label: "今天", items: [] },
            { label: "昨天", items: [] },
            { label: "更早", items: [] },
        ];

        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        ).getTime();
        const yesterday = today - 24 * 60 * 60 * 1000;

        roots.forEach((m) => {
            if (m.createTime >= today) {
                groups[0].items.push(m);
            } else if (m.createTime >= yesterday) {
                groups[1].items.push(m);
            } else {
                groups[2].items.push(m);
            }
        });

        return groups.filter((g) => g.items.length > 0);
    }

    const groupedRoots = $derived(groupRootMessages(chatState.rootMessages));

    // 预构建子节点映射（O(n) 一次遍历），避免模板中每个节点 O(n) filter
    const childrenMap = $derived.by(() => {
        const map = new Map<string, QandA[]>();
        for (const m of chatState.messages) {
            if (!m.parentId) continue;
            if (!map.has(m.parentId)) map.set(m.parentId, []);
            map.get(m.parentId)!.push(m);
        }
        // 每组按时间正序排列
        map.forEach((children) => {
            children.sort((a, b) => a.createTime - b.createTime);
        });
        return map;
    });

    function scrollToMessage(id: string) {
        const el = document.getElementById(`qa-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        onSelect?.();
    }
</script>

{#snippet MessageNode(qa: QandA, level = 0)}
    {@const children = childrenMap.get(qa.id) ?? []}
    <div class="flex flex-col min-w-0">
        <div class="group relative flex items-center min-w-0">
            <button
                class="flex-1 min-w-0 group/msg text-left px-1 py-1 rounded-xl transition-colors flex items-center gap-2 touch-manipulation {qa.id ===
                activeId
                    ? 'bg-blue-50/50 text-blue-600 font-medium'
                    : 'hover:bg-gray-200/40 ' +
                      (qa.isResponseOngoing
                          ? 'text-blue-500/80'
                          : 'text-gray-500 font-light hover:text-gray-700')}"
                onclick={() => scrollToMessage(qa.id)}
            >
                <span
                    class="{qa.id === activeId
                        ? 'text-blue-400 opacity-60'
                        : 'text-gray-500 opacity-50'} font-mono flex-shrink-0 text-center"
                >
                    {level === 0 ? "" : "└"}
                </span>
                <span class="truncate flex-1">
                    {qa.question.trim() || "未提问"}
                </span>
            </button>

            <button
                class="{qa.favorite
                    ? 'opacity-100 text-amber-400'
                    : 'opacity-40 md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-amber-400'} p-1 rounded-xl hover:bg-amber-50 transition-all ml-1 touch-manipulation"
                onclick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(qa);
                }}
                title={qa.favorite ? "取消收藏" : "收藏"}
            >
                <span class="iconify simple-line-icons--star text-sm"></span>
            </button>
        </div>

        {#if children.length > 0}
            <div class="ml-1.5 pl-1 border-l border-gray-100/30 space-y-0.5">
                {#each children as child (child.id)}
                    {@render MessageNode(child, level + 1)}
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

<div
    class="flex flex-col h-full pt-4 bg-gray-100/30 w-full overflow-hidden select-none"
>
    <div class="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {#each groupedRoots as group}
            <div transition:slide={{ duration: 200 }} class="group/section">
                <div class="flex items-center justify-between px-1 mb-1.5">
                    <h3
                        class="font-light text-gray-500 uppercase tracking-[0.1em]"
                    >
                        {group.label}
                    </h3>
                    <button
                        class="p-1 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors opacity-40 md:opacity-0 md:group-hover/section:opacity-100 touch-manipulation"
                        onclick={() => {
                            openConfirm(
                                "清除非收藏",
                                `确定要清空"${group.label}"中所有未收藏的对话吗？`,
                                () => deleteGroup(group.items),
                            );
                        }}
                        title="清除非收藏对话"
                    >
                        <span
                            class="iconify simple-line-icons--trash text-sm"
                        ></span>
                    </button>
                </div>
                <div class="space-y-0.5">
                    {#each group.items as root (root.id)}
                        {@render MessageNode(root)}
                    {/each}
                </div>
            </div>
        {:else}
            <div
                class="flex flex-col items-center justify-center py-20 text-gray-300 opacity-40"
            >
                <span
                    class="iconify simple-line-icons--bubble text-3xl mb-2"
                ></span>
                <p class="text-sm">暂无提问记录</p>
            </div>
        {/each}
    </div>

    <!-- 底部：用户信息 & 设置按钮 -->
    <div
        class="p-4 border-t border-gray-100/20 bg-gray-100/30 backdrop-blur-[2px]"
    >
        <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-3 min-w-0">
                <div
                    class="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 flex-shrink-0"
                >
                    <span
                        class="iconify simple-line-icons--energy text-xs"
                    ></span>
                </div>
                <div class="flex-1 min-w-0">
                    <p
                        class="text-xs font-semibold text-gray-400 truncate tracking-tight"
                    >
                        Wise Bot
                    </p>
                    <p class="text-[11px] text-gray-400/50 truncate">
                        结构化对话树
                    </p>
                </div>
            </div>

            <button
                class="hidden md:block p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-all ml-2 touch-manipulation"
                onclick={() => (showMenu = true)}
                title="配置与设置"
            >
                <span class="iconify simple-line-icons--settings text-lg"
                ></span>
            </button>
        </div>
    </div>
</div>
