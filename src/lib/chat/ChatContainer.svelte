<script lang="ts">
    import Message from "./Message.svelte";
    import {
        chatState,
        getChatLog,
        deleteQA,
        toggleFavorite,
        type QandA,
    } from "./ChatStore.svelte";
    // KaTeX CSS 从 npm 包引入，支持离线 PWA，不依赖外部 CDN
    import "katex/dist/katex.min.css";

    let { resendMessage, onFollowUp } = $props<{
        resendMessage: (qa: QandA) => void;
        onFollowUp: (qa: QandA) => void;
    }>();

    let chatContainer: HTMLDivElement;
</script>

<div bind:this={chatContainer} class="flex min-w-0 flex-col gap-2">
    {#each getChatLog() as qa (qa.id)}
        <div
            id="qa-{qa.id}"
            class="relative transition-all duration-200 qa-item"
        >
            <Message
                qandA={qa}
                onResendMessage={(qa) => resendMessage(qa)}
                {deleteQA}
                {toggleFavorite}
                {onFollowUp}
            />
        </div>
    {:else}
        {#if chatState.isLoading}
            <div
                class="flex flex-col items-center justify-center px-4 py-20 text-center text-content-subtle"
            >
                <span
                    class="loading loading-spinner loading-md text-primary mb-4"
                ></span>
                <p class="text-sm text-content-muted">加载中…</p>
            </div>
        {:else}
            <div
                class="flex flex-col items-center justify-center px-4 py-20 text-center text-content-subtle"
            >
                <div
                    class="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-dashed border-base-300/60 bg-gradient-to-b from-base-200/50 to-base-100/80 shadow-inner"
                >
                    <span
                        class="iconify simple-line-icons--pencil text-2xl text-primary/20"
                    ></span>
                </div>
                <p class="text-sm font-medium text-content-secondary">
                    在此开启你的第一个问题
                </p>
                <p class="mt-1 text-xs text-content-muted/90">
                    直接在下方输入框提问即可
                </p>
            </div>
        {/if}
    {/each}
</div>

<style>
    .qa-item {
        /* 使用 content-visibility 优化长列表渲染性能，跳过视口外的渲染工作 */
        content-visibility: auto;
        /* 为浏览器提供预估高度，减少滚动条在快速滚动时的跳动 */
        contain-intrinsic-size: 1px 200px;
    }
</style>
