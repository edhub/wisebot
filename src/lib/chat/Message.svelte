<script lang="ts">
    import { parseMarkdown } from "./markdown";
    import "highlight.js/styles/github-dark-dimmed.min.css";
    import type { QandA } from "./ChatStore.svelte";

    import { getContext } from "svelte";
    import { openLightbox } from "./lightboxStore.svelte";

    let {
        qandA,
        onResendMessage = () => {},
        deleteQA,
        toggleFavorite,
        onFollowUp,
    }: {
        qandA: QandA;
        onResendMessage?: (qa: QandA) => void;
        deleteQA: (qa: QandA) => void;
        toggleFavorite: (qa: QandA) => void;
        onFollowUp?: (qa: QandA) => void;
    } = $props();

    let isRespOngoing = $derived(qandA.isResponseOngoing ?? false);
    let answerHtml = $derived(parseMarkdown(qandA.answer));

    let toast: { show: (msg: string) => void } = getContext("toast");

    function handleUrlNavigation(e: Event) {
        if (e.target instanceof HTMLAnchorElement) {
            e.preventDefault();
            const url = (e.target as HTMLAnchorElement).href;
            copyToClipboard(url, "已复制链接");
        }
    }

    /**
     * 优先使用现代 Clipboard API，iOS Safari 等不支持时降级到 execCommand。
     */
    async function copyToClipboard(text: string, toastMsg: string = "已复制") {
        try {
            await navigator.clipboard.writeText(text);
            toast.show(toastMsg);
        } catch {
            // 降级方案：兼容不支持 navigator.clipboard 的环境
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand("copy");
                toast.show(toastMsg);
            } catch (err) {
                console.error("Fallback copy failed:", err);
                toast.show("复制失败");
            }
            document.body.removeChild(textArea);
        }
    }

    function downloadAsMarkdown(qa: QandA) {
        const content = `**问题：** ${qa.question}\n来自 **${qa.botName}** 的回答：\n\n---\n${qa.answer}`;
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fileName =
            qa.question.length > 30
                ? qa.question.substring(0, 25) + "..."
                : qa.question;
        a.download = `${fileName}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.show("Markdown 文件已下载");
    }

    function createBearNote(qandA: QandA) {
        const tags = "wise-bot";
        const title = encodeURIComponent(
            qandA.question.length > 30
                ? qandA.question.substring(0, 25) + "..."
                : qandA.question,
        );
        const text = encodeURIComponent(
            `**问题：** ${qandA.question}\n来自 **${qandA.botName}** 的回答：\n\n---\n${qandA.answer}`,
        );
        window.open(
            `bear://x-callback-url/create?&tags=${tags}&title=${title}&text=${text}`,
        );
    }

    function formatTime(ms: number): string {
        return (ms / 1000).toFixed(1);
    }

    function formatResponseTimes(
        firstResponseTime?: number,
        completionTime?: number,
    ): string {
        if (!firstResponseTime) return "";
        const firstResponse = formatTime(firstResponseTime);
        if (!completionTime) return firstResponse + "s";
        const completion = formatTime(completionTime);
        if (Math.abs(completionTime - firstResponseTime) < 1000)
            return completion + "s";
        else return `${firstResponse} - ${completion}s`;
    }

    let elapsedTime = $state(0);
    let timer: number | undefined;

    $effect(() => {
        if (isRespOngoing) {
            const startTime = Date.now();
            timer = setInterval(() => {
                elapsedTime = Date.now() - startTime;
            }, 100);
        } else if (timer) {
            clearInterval(timer);
            timer = undefined;
            elapsedTime = 0;
        }

        return () => {
            if (timer) {
                clearInterval(timer);
                timer = undefined;
            }
        };
    });
</script>

<div role="article" class="group">
    <!-- 操作栏 -->
    <div class="flex text-gray-400 items-center pl-1 pr-1 h-7">
        <!-- 左侧：常用操作（图标按钮） -->
        <div
            class="flex items-center gap-3 flex-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto transition-opacity duration-200"
        >
            <button
                class="p-1 text-base hover:text-gray-600 active:scale-90 transition-all touch-manipulation"
                title="再次发送"
                onclick={() => onResendMessage?.(qandA)}
            >
                <span class="iconify simple-line-icons--reload"></span>
            </button>
            <button
                class="p-1 text-base hover:text-gray-600 active:scale-90 transition-all touch-manipulation"
                title="复制问题"
                onclick={() => copyToClipboard(qandA.question, "问题已复制")}
            >
                <span class="iconify simple-line-icons--docs"></span>
            </button>
            {#if !isRespOngoing && qandA.answer.length > 0}
                <button
                    class="p-1 text-base hover:text-gray-600 active:scale-90 transition-all touch-manipulation"
                    title="复制回复"
                    onclick={() => copyToClipboard(qandA.answer, "回复已复制")}
                >
                    <span class="iconify simple-line-icons--doc"></span>
                </button>
                <button
                    class="p-1 text-base hover:text-gray-600 active:scale-90 transition-all touch-manipulation"
                    title="追问"
                    onclick={() => onFollowUp?.(qandA)}
                >
                    <span class="iconify simple-line-icons--bubble"></span>
                </button>
            {/if}
        </div>
        <!-- 右侧：次要操作 -->
        <div class="flex items-center gap-3">
            <div
                class="flex items-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto transition-opacity duration-200"
            >
                <button
                    class="p-1 text-base hover:text-red-400 active:scale-90 transition-all touch-manipulation"
                    title="删除"
                    onclick={() => deleteQA(qandA)}
                >
                    <span class="iconify simple-line-icons--trash"></span>
                </button>
                {#if !isRespOngoing}
                    <button
                        class="p-1 text-base hover:text-gray-600 active:scale-90 transition-all touch-manipulation"
                        title="下载 Markdown"
                        onclick={() => downloadAsMarkdown(qandA)}
                    >
                        <span class="iconify simple-line-icons--cloud-download"
                        ></span>
                    </button>
                    <button
                        class="p-1 text-base hover:text-gray-600 active:scale-90 transition-all touch-manipulation"
                        title="存入 Bear"
                        onclick={() => createBearNote(qandA)}
                    >
                        <span class="iconify simple-line-icons--note"></span>
                    </button>
                {/if}
            </div>
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
                class="p-1 text-base transition-opacity duration-200 {qandA.favorite
                    ? 'opacity-100'
                    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}"
                onclick={() => toggleFavorite(qandA)}
            >
                <span
                    class="{qandA.favorite
                        ? 'text-amber-400'
                        : 'text-gray-400'} iconify simple-line-icons--star"
                ></span>
            </button>
        </div>
    </div>

    <!-- 消息卡片 -->
    <div class="rounded-lg border-gray-200 border overflow-hidden">
        <div class="bg-gray-50">
            <div class="h-2 bg-gray-300"></div>
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
            <article
                class="prose py-2 px-4 max-w-none text-gray-800"
                onclick={handleUrlNavigation}
            >
                {#if qandA.imageUrl}
                    <div>
                        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
                        <img
                            src={qandA.imageUrl}
                            alt="User uploaded"
                            class="max-h-32 rounded-lg my-4 border border-gray-200 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                            onclick={() => openLightbox(qandA.imageUrl!)}
                        />
                    </div>
                {/if}
                {@html qandA.question}
            </article>
            <div class="flex text-xs px-4 items-center">
                <span class="text-gray-800 font-bold">
                    {qandA.botName}
                </span>
                {#if isRespOngoing}
                    <span class="ml-2 text-gray-400 text-xs">
                        {formatTime(elapsedTime)}s
                    </span>
                {/if}
                {#if !isRespOngoing && qandA.firstResponseTime !== undefined}
                    <span class="ml-2 text-gray-400">
                        {formatResponseTimes(
                            qandA.firstResponseTime,
                            qandA.completionTime,
                        )}
                    </span>
                {/if}
            </div>
        </div>
        <hr class="ml-4 w-1/3 border-gray-300" />
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <article
            class="prose mt-5 pb-2 px-4 max-w-none"
            onclick={handleUrlNavigation}
        >
            {#if qandA.answer.length === 0 && isRespOngoing}
                <div class="flex items-center gap-2">
                    <div class="blink">_</div>
                </div>
            {:else}
                {@html answerHtml}
            {/if}
        </article>
    </div>

    <!-- 底部追问按钮（唯一入口，位置更贴近内容） -->
    {#if !isRespOngoing && qandA.answer.length > 0}
        <div class="flex justify-end mt-1 pr-1">
            <button
                type="button"
                class="text-xs text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                onclick={() => onFollowUp?.(qandA)}
            >
                追问
            </button>
        </div>
    {/if}
</div>

<style>
    @keyframes blink {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 0.2;
        }
        100% {
            opacity: 1;
        }
    }

    .blink {
        animation: blink 1s infinite;
    }
</style>
