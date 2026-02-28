<script lang="ts">
    import { parseMarkdown } from "./markdown";
    import "highlight.js/styles/github-dark-dimmed.min.css";
    import type { QandA } from "./ChatStore.svelte";

    import { fade } from "svelte/transition";
    import { getContext } from "svelte";

    let {
        qandA,
        onResendMessage = () => {},
        deleteQA,
        toggleFavorite,
        onFollowUp,
    }: {
        qandA: QandA;
        onResendMessage?: (message: string, image?: string) => void;
        deleteQA: (qa: QandA) => void;
        toggleFavorite: (qa: QandA) => void;
        onFollowUp?: (qa: QandA) => void;
    } = $props();

    let isRespOngoing = $derived(qandA.isResponseOngoing ?? false);
    let questionHtml = $derived(qandA.question);
    let answerHtml = $derived(parseMarkdown(qandA.answer));

    // showActionButtons state removed in favor of CSS group-hover

    function handleUrlNavigation(e: Event) {
        if (e.target instanceof HTMLAnchorElement) {
            e.preventDefault();
            const url = (e.target as HTMLAnchorElement).href;

            copyToClipboard(url, "已复制链接");
        }
    }

    function copyToClipboard(text: string, toastMsg: string = "已复制") {
        // Fallback method for iOS Safari and other browsers that do not support navigator.clipboard
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // Make the textarea out of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand("copy");
            const msg = successful ? toastMsg : "复制失败";
            toast.show(msg);
        } catch (err) {
            console.error("Fallback: Oops, unable to copy", err);
            toast.show("复制失败");
        }

        document.body.removeChild(textArea);
    }

    let toast: { show: (msg: string) => void } = getContext("toast");

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
    <div class="flex text-xs text-gray-400">
        <div
            class="h-6 flex-1 flex items-center space-x-3 pl-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto transition-opacity duration-200"
        >
            <button
                onclick={() => {
                    onResendMessage?.(qandA.question, qandA.image);
                }}
            >
                再次发送
            </button>

            {#if !isRespOngoing}
                <button
                    onclick={() => {
                        onFollowUp?.(qandA);
                    }}
                >
                    追问
                </button>
            {/if}
        </div>
        <div class="h-6 flex-1 flex items-center justify-end space-x-3 pr-1">
            <div
                class="flex items-center space-x-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto transition-opacity duration-200"
            >
                <button
                    class="mr-2"
                    onclick={() => {
                        deleteQA(qandA);
                    }}
                >
                    删除
                </button>

                {#if !isRespOngoing}
                    <button
                        onclick={() => {
                            downloadAsMarkdown(qandA);
                        }}
                    >
                        Markdown
                    </button>

                    <button onclick={() => createBearNote(qandA)}>
                        Bear
                    </button>
                {/if}
            </div>
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
                class="p-0 text-lg transition-opacity duration-200 {qandA.favorite
                    ? 'opacity-100'
                    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}"
                onclick={() => {
                    toggleFavorite(qandA);
                }}
            >
                <span
                    class="{qandA.favorite
                        ? 'text-amber-400'
                        : 'text-gray-400'} font-bold iconify simple-line-icons--star full"
                >
                </span>
            </button>
        </div>
    </div>
    <div class="rounded-lg border-gray-200 border overflow-hidden">
        <div class="bg-gray-50">
            <div class="h-2 bg-gray-300"></div>
            <article
                class="prose py-2 px-4 max-w-none text-gray-800"
                onclick={handleUrlNavigation}
            >
                {#if qandA.image}
                    <div class="mb-3">
                        <img
                            src={qandA.image}
                            alt="User uploaded"
                            class="max-h-64 rounded-lg border border-gray-200 shadow-sm"
                        />
                    </div>
                {/if}
                {@html questionHtml}
            </article>
            <div class="flex text-xs px-4 items-center">
                <span class="text-gray-800 font-bold">
                    {qandA.botName}
                </span>

                {#if isRespOngoing}
                    <span class="ml-2 text-gray-400">
                        <span class="text-xs text-gray-400"
                            >{formatTime(elapsedTime)}s</span
                        >
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
