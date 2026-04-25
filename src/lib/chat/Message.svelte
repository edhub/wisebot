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
    let questionHtml = $derived(parseMarkdown(qandA.question));
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

<div role="article" class="group min-w-0">
    <!-- 操作栏：与下方卡片内文左右对齐（px-4） -->
    <div
        class="mb-0.5 flex h-7 w-full min-w-0 items-center justify-between gap-2 px-4 text-content-muted"
    >
        <!-- 左侧：常用操作（图标按钮） -->
        <div
            class="flex min-w-0 flex-1 items-center gap-0.5 opacity-100 transition-opacity duration-200 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100"
        >
            <button
                class="btn btn-ghost btn-sm p-0 min-h-0 h-7 w-7 text-base text-content-muted transition-colors duration-200 hover:bg-base-200/80 hover:text-base-content/90 active:scale-90 rounded-md"
                title="再次发送"
                onclick={() => onResendMessage?.(qandA)}
            >
                <span class="iconify simple-line-icons--reload"></span>
            </button>
            <button
                class="btn btn-ghost btn-sm p-0 min-h-0 h-7 w-7 text-base text-content-muted transition-colors duration-200 hover:bg-base-200/80 hover:text-base-content/90 active:scale-90 rounded-md"
                title="复制问题"
                onclick={() => copyToClipboard(qandA.question, "问题已复制")}
            >
                <span class="iconify simple-line-icons--docs"></span>
            </button>
            {#if !isRespOngoing && qandA.answer.length > 0}
                <button
                    class="btn btn-ghost btn-sm p-0 min-h-0 h-7 w-7 text-base text-content-muted transition-colors duration-200 hover:bg-base-200/80 hover:text-base-content/90 active:scale-90 rounded-md"
                    title="复制回复"
                    onclick={() => copyToClipboard(qandA.answer, "回复已复制")}
                >
                    <span class="iconify simple-line-icons--doc"></span>
                </button>
                <button
                    class="btn btn-ghost btn-sm p-0 min-h-0 h-7 w-7 text-base text-content-muted transition-colors duration-200 hover:bg-base-200/80 hover:text-primary active:scale-90 rounded-md"
                    title="追问"
                    onclick={() => onFollowUp?.(qandA)}
                >
                    <span class="iconify simple-line-icons--bubble"></span>
                </button>
            {/if}
        </div>
        <!-- 右侧：次要操作 -->
        <div class="flex shrink-0 items-center gap-0.5">
            <div
                class="flex items-center gap-0.5 opacity-100 transition-opacity duration-200 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100"
            >
                <button
                    class="btn btn-ghost btn-sm p-0 min-h-0 h-7 w-7 text-base text-content-muted transition-colors duration-200 hover:bg-error/10 hover:text-error active:scale-90 rounded-md"
                    title="删除"
                    onclick={() => deleteQA(qandA)}
                >
                    <span class="iconify simple-line-icons--trash"></span>
                </button>
                {#if !isRespOngoing}
                    <button
                        class="btn btn-ghost btn-sm p-0 min-h-0 h-7 w-7 text-base text-content-muted transition-colors duration-200 hover:bg-base-200/80 hover:text-base-content/90 active:scale-90 rounded-md"
                        title="下载 Markdown"
                        onclick={() => downloadAsMarkdown(qandA)}
                    >
                        <span class="iconify simple-line-icons--cloud-download"
                        ></span>
                    </button>
                    <button
                        class="btn btn-ghost btn-sm p-0 min-h-0 h-7 w-7 text-base text-content-muted transition-colors duration-200 hover:bg-base-200/80 hover:text-base-content/90 active:scale-90 rounded-md"
                        title="存入 Bear"
                        onclick={() => createBearNote(qandA)}
                    >
                        <span class="iconify simple-line-icons--note"></span>
                    </button>
                {/if}
            </div>
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
                class="btn btn-ghost btn-sm p-0 min-h-0 h-7 w-7 text-base transition-opacity duration-200 rounded-md hover:bg-amber-500/10 {qandA.favorite
                    ? 'opacity-100'
                    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}"
                onclick={() => toggleFavorite(qandA)}
            >
                <span
                    class="{qandA.favorite
                        ? 'text-favorite'
                        : 'text-content-muted'} iconify simple-line-icons--star"
                ></span>
            </button>
        </div>
    </div>

    <!-- 消息卡片 -->
    <div
        class="card overflow-hidden rounded-box border border-base-200/80 bg-base-100 shadow-sm ring-1 ring-base-200/30"
    >
        <div
            class="bg-gradient-to-b from-primary/[0.04] to-base-200/90"
        >
            <div
                class="h-1 w-full bg-gradient-to-r from-primary/45 via-primary/25 to-primary/5"
            ></div>
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
            <article
                class="prose prose-base prose-neutral max-w-none px-4 py-2.5 text-base leading-6 text-content-secondary [&_a]:text-primary [&_a]:no-underline [&_a:hover]:underline"
                onclick={handleUrlNavigation}
            >
                {#if qandA.imageUrl}
                    <div>
                        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
                        <img
                            src={qandA.imageUrl}
                            alt="User uploaded"
                            class="max-h-32 rounded-lg my-4 border border-base-200/80 shadow-sm cursor-zoom-in transition-opacity hover:opacity-90"
                            onclick={() => openLightbox(qandA.imageUrl!)}
                        />
                    </div>
                {/if}
                {@html questionHtml}
            </article>
            <div
                class="flex items-baseline gap-x-2 gap-y-0 px-4 pb-2.5 pt-0 text-xs leading-tight"
            >
                <span class="shrink-0 font-medium text-content-muted/85">
                    {qandA.botName}
                </span>
                {#if isRespOngoing}
                    <span class="tabular-nums text-content-muted">
                        {formatTime(elapsedTime)}s
                    </span>
                {/if}
                {#if !isRespOngoing && qandA.firstResponseTime !== undefined}
                    <span class="tabular-nums text-content-muted">
                        {formatResponseTimes(
                            qandA.firstResponseTime,
                            qandA.completionTime,
                        )}
                    </span>
                {/if}
            </div>
        </div>
        <div
            class="h-px w-full bg-gradient-to-r from-transparent via-base-200 to-transparent"
        ></div>
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <article
            class="prose prose-base prose-neutral mt-0 max-w-none bg-base-100/50 px-4 pb-4 pt-3 text-base leading-7 text-base-content/95 [&_a]:text-primary [&_a]:no-underline [&_a:hover]:underline"
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
        <div class="mt-1.5 flex justify-end px-4">
            <button
                type="button"
                class="btn btn-ghost btn-xs min-h-0 h-auto gap-0.5 border-0 p-0 font-medium normal-case text-content-muted no-underline opacity-80 transition-all duration-200 hover:bg-transparent hover:opacity-100 hover:text-primary"
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
