<script lang="ts">
    import {
        chatState,
        getRootMessages,
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

    const groupedRoots = $derived(groupRootMessages(getRootMessages()));

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
            const container = el.closest(".overflow-y-auto") ?? document.documentElement;
            const offset = 24; // 顶部留白 px
            const top = el.getBoundingClientRect().top
                - container.getBoundingClientRect().top
                + (container as HTMLElement).scrollTop
                - offset;
            (container as HTMLElement).scrollTo({ top, behavior: "smooth" });
        }
        onSelect?.();
    }
</script>

{#snippet MessageNode(qa: QandA, level = 0)}
    {@const children = childrenMap.get(qa.id) ?? []}
    <div class="flex flex-col min-w-0">
        <div
            class="group relative flex min-w-0 items-center gap-0 pl-0 pr-0"
        >
            <button
                class="group/msg flex min-w-0 flex-1 items-center gap-1 rounded-lg px-1.5 py-0.5 text-left text-sm leading-snug transition-all duration-200 touch-manipulation {qa.id ===
                activeId
                    ? 'bg-primary/[0.08] font-medium text-primary ring-1 ring-inset ring-primary/15'
                    : 'hover:bg-base-200/70 ' +
                      (qa.isResponseOngoing
                          ? 'text-primary/85'
                          : 'font-normal text-content-muted hover:text-content-secondary')}"
                onclick={() => scrollToMessage(qa.id)}
            >
                <span
                    class="inline-block w-2.5 shrink-0 text-center font-mono text-[9px] leading-none {qa.id ===
                    activeId
                        ? 'text-primary/60'
                        : 'text-content-muted/50'}"
                >
                    {level === 0 ? "" : "└"}
                </span>
                <span class="truncate flex-1">
                    {qa.question.trim() || "未提问"}
                </span>
            </button>

            <button
                class="btn btn-ghost btn-xs h-6 min-h-0 w-6 shrink-0 rounded-md p-0 transition-all touch-manipulation hover:bg-favorite/10 {qa.favorite
                    ? 'text-favorite opacity-100'
                    : 'text-content-subtle opacity-40 hover:text-favorite md:opacity-0 md:group-hover:opacity-100'}"
                onclick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(qa);
                }}
                title={qa.favorite ? "取消收藏" : "收藏"}
            >
                <span class="iconify simple-line-icons--star text-xs"></span>
            </button>
        </div>

        {#if children.length > 0}
            <div
                class="ml-1 space-y-0 border-l border-base-200/40 pl-1.5"
            >
                {#each children as child (child.id)}
                    {@render MessageNode(child, level + 1)}
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

<div
    class="flex h-full min-h-0 w-full select-none flex-col overflow-hidden bg-gradient-to-b from-base-200/30 via-base-100/90 to-base-100"
>
    <div
        class="scrollbar-thin flex-1 min-h-0 space-y-3 overflow-y-auto px-2.5 py-2 sm:space-y-4"
    >
        {#each groupedRoots as group}
            <div transition:slide={{ duration: 200 }} class="group/section">
                <div class="mb-0.5 flex items-center justify-between pl-0 pr-0">
                    <h3
                        class="pl-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-content-muted/90"
                    >
                        {group.label}
                    </h3>
                    <button
                        class="btn btn-ghost btn-xs h-6 w-6 min-h-0 rounded-md p-0 text-content-subtle opacity-40 transition-colors hover:bg-error/10 hover:text-error touch-manipulation md:opacity-0 md:group-hover/section:opacity-100"
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
                            class="iconify simple-line-icons--trash text-xs"
                        ></span>
                    </button>
                </div>
                <div class="space-y-0">
                    {#each group.items as root (root.id)}
                        {@render MessageNode(root)}
                    {/each}
                </div>
            </div>
        {:else}
            <div
                class="flex flex-col items-center justify-center py-20 text-content-subtle opacity-40"
            >
                <span
                    class="iconify simple-line-icons--bubble text-3xl mb-2"
                ></span>
                <p class="text-sm text-content-muted">暂无提问记录</p>
            </div>
        {/each}
    </div>

    <!-- 底部：用户信息 & 设置按钮 -->
    <div
        class="shrink-0 border-t border-base-200/60 bg-base-200/20 p-2.5 px-2.5 backdrop-blur-[2px] sm:px-3"
    >
        <div class="flex min-w-0 items-center justify-between gap-1.5 px-0">
            <div class="flex min-w-0 items-center gap-2">
                <div
                    class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-base-200/80 text-content-subtle ring-1 ring-base-200/50"
                >
                    <span
                        class="iconify simple-line-icons--energy text-[10px]"
                    ></span>
                </div>
                <div class="flex-1 min-w-0">
                    <p
                        class="text-xs font-semibold text-content-muted truncate tracking-tight"
                    >
                        Wise Bot
                    </p>
                    <p class="text-[11px] text-content-muted/50 truncate">
                        结构化对话树
                    </p>
                </div>
            </div>

            <button
                class="btn btn-ghost ml-0.5 hidden h-8 w-8 min-h-0 shrink-0 touch-manipulation rounded-lg p-0 text-content-muted transition-colors duration-200 hover:bg-base-200/80 hover:text-primary md:inline-flex"
                onclick={() => (showMenu = true)}
                title="配置与设置"
            >
                <span
                    class="iconify simple-line-icons--settings text-base"
                ></span>
            </button>
        </div>
    </div>
</div>
