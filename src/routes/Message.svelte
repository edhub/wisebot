<script lang="ts">
  import { marked } from "marked";
  import hljs from "highlight.js";
  import markedKatex from "marked-katex-extension";
  import "highlight.js/styles/github-dark-dimmed.min.css";
  import type { QandA } from "./ChatStore.svelte";

  import { fade } from "svelte/transition";
  import { getContext } from "svelte";

  let {
    qandA,
    onResendMessage = () => {},
    toggleFavorite,
    toggleFold,
    deleteQA,
    onFollowUp,
  }: {
    qandA: QandA;
    onResendMessage?: (message: string) => void;
    deleteQA: (qa: QandA) => void;
    toggleFavorite: (qa: QandA) => void;
    toggleFold: (qa: QandA) => void;
    onFollowUp?: (qa: QandA) => void;
  } = $props();

  let isRespOngoing = $derived(qandA.isResponseOngoing ?? false);

  function highlight(code: string, lang: string) {
    if (hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    } else {
      return hljs.highlightAuto(code).value;
    }
  }

  const renderer = {
    code(_code: string, infostring: any, escaped: any): string {
      const lang = (infostring || "").match(/\S*/)[0];

      var out = highlight(_code, lang);
      _code = out;
      _code = _code.replace(/\n$/, "") + "\n";

      // @ts-ignore
      const langPrefix = this.options.langPrefix;

      if (!lang || !langPrefix) {
        return "<pre><code>" + _code + "</code></pre>\n";
      }
      return (
        '<pre><code class="' +
        langPrefix +
        lang +
        '">' +
        _code +
        "</code></pre>\n"
      );
    },
    link(href: string, title: string | null | undefined, text: string): string {
      return `<a href="${href}">${text}</a>`;
    },
  };

  // @ts-ignore
  marked.use({ renderer, gfm: true, breaks: true });

  marked.use(
    markedKatex({
      throwOnError: false,
    }),
  );

  let showActionButtons = $state(false);

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

<div
  role="article"
  class="mx-1 my-2"
  onmouseover={() => {
    showActionButtons = true;
  }}
  onfocus={() => {
    showActionButtons = true;
  }}
  onmouseleave={() => {
    showActionButtons = false;
  }}
>
  <div class="flex text-xs text-gray-400">
    <div class="h-6 flex-1 flex items-center space-x-3 pl-1">
      {#if showActionButtons}
        <button
          transition:fade={{ duration: 300 }}
          onclick={() => {
            onResendMessage(qandA.question);
          }}
        >
          再次发送
        </button>

        <button
          transition:fade={{ duration: 300 }}
          onclick={() => {
            copyToClipboard(qandA.question);
          }}
        >
          复制问题
        </button>
      {/if}

      {#if showActionButtons && !isRespOngoing}
        <button
          transition:fade={{ duration: 300 }}
          onclick={() => {
            copyToClipboard(qandA.answer);
          }}
        >
          复制回复
        </button>

        <button
          transition:fade={{ duration: 300 }}
          onclick={() => {
            onFollowUp?.(qandA);
          }}
        >
          追问
        </button>
      {/if}
    </div>
    <div class="h-6 flex-1 flex items-center justify-end space-x-3 pr-1">
      {#if showActionButtons}
        <button
          class="mr-2"
          transition:fade={{ duration: 300 }}
          onclick={() => {
            deleteQA(qandA);
          }}
        >
          删除
        </button>
      {/if}

      {#if showActionButtons && !isRespOngoing}
        <button
          transition:fade={{ duration: 300 }}
          onclick={() => {
            downloadAsMarkdown(qandA);
          }}
        >
          Markdown
        </button>

        <button
          transition:fade={{ duration: 300 }}
          onclick={() => createBearNote(qandA)}
        >
          Bear
        </button>

        <button
          transition:fade={{ duration: 300 }}
          onclick={() => {
            toggleFold(qandA);
          }}
        >
          折叠
        </button>
      {/if}
      {#if showActionButtons || qandA.favorite}
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          class="p-0 text-lg"
          transition:fade={{ duration: 300 }}
          onclick={() => {
            toggleFavorite(qandA);
          }}
        >
          <span
            class="{qandA.favorite
              ? 'text-red-500'
              : 'text-gray-500'} font-bold iconify simple-line-icons--star full"
          >
          </span>
        </button>
      {/if}
    </div>
  </div>
  <div class="rounded-md border-gray-200 border overflow-hidden">
    <div class="bg-gray-50">
      <div class="h-2 bg-gray-300"></div>
      <article
        class="prose py-2 px-4 max-w-none text-gray-800"
        onclick={handleUrlNavigation}
      >
        {@html marked.parse(qandA.question)}
      </article>
      <div class="flex text-xs px-4 items-center">
        <span class="text-gray-800 font-bold">
          {qandA.botName}
        </span>

        {#if isRespOngoing}
          <span class="ml-2 text-gray-400">
            <span class="text-xs text-gray-400">{formatTime(elapsedTime)}s</span
            >
          </span>
        {/if}
        {#if !isRespOngoing && qandA.firstResponseTime !== undefined}
          <span class="ml-2 text-gray-400">
            {formatResponseTimes(qandA.firstResponseTime, qandA.completionTime)}
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
        {@html marked.parse(qandA.answer)}
      {/if}
    </article>
  </div>
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
