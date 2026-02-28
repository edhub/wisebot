<script lang="ts">
    import Message from "./Message.svelte";
    import {
        chatState,
        deleteQA,
        toggleFavorite,
        type QandA,
    } from "./ChatStore.svelte";

    let { resendMessage, onFollowUp } = $props<{
        resendMessage: (msg: string, image?: string) => void;
        onFollowUp: (qa: QandA) => void;
    }>();

    let chatContainer: HTMLDivElement;
</script>

<svelte:head>
    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
        integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn"
        crossorigin="anonymous"
    />
</svelte:head>

<div bind:this={chatContainer} class="flex flex-col gap-2 pb-32">
    {#each chatState.chatLog as qa (qa.id)}
        <div
            id="qa-{qa.id}"
            class="relative transition-all duration-200 qa-item"
        >
            <Message
                qandA={qa}
                onResendMessage={(msg) => resendMessage(msg, qa.image)}
                {deleteQA}
                {toggleFavorite}
                {onFollowUp}
            />
        </div>
    {:else}
        <div
            class="flex flex-col items-center justify-center py-20 text-gray-300"
        >
            <div
                class="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-4"
            >
                <span
                    class="iconify simple-line-icons--pencil text-2xl opacity-20"
                ></span>
            </div>
            <p class="text-sm font-medium text-gray-400">
                在此开启你的第一个问题
            </p>
            <p class="text-xs text-gray-300 mt-1">直接在下方输入框提问即可</p>
        </div>
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
