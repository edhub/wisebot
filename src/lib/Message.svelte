<script lang="ts" module>
  export interface QandA {
    id: string;
    userName?: string;
    question: string;
    botName?: string;
    answer: string;
    folded?: boolean;
    favorite?: boolean;
  }
</script>

<script lang="ts">
  import { marked } from "marked";
  import hljs from "highlight.js";
  import markedKatex from "marked-katex-extension";
  import "highlight.js/styles/github-dark-dimmed.min.css";

  import { fade } from "svelte/transition";
  import { getContext } from "svelte";

  let {
    qandA,
    isRespOngoing = false,
    onResendMessage = () => {},
    toggleFavorite,
    toggleFold,
    deleteQA,
  }: {
    qandA: QandA;
    isRespOngoing?: boolean;
    onResendMessage?: (message: string) => void;
    deleteQA: (qa: QandA) => void;
    toggleFavorite: (qa: QandA) => void;
    toggleFold: (qa: QandA) => void;
  } = $props();

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
  marked.use({ renderer });

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
</script>


<div
  class="rounded-md mx-2 my-2 border-gray-200 border shadow-sm"
  onmouseover={() => {
    showActionButtons = !isRespOngoing;
  }}
  onfocus={() => {
    showActionButtons = !isRespOngoing;
  }}
  onmouseleave={() => {
    showActionButtons = false;
  }}
>
  <div class="px-4 pt-3">
    <p class="relative font-bold text-blue-500">
      {qandA.userName ? qandA.userName : "User"}

      {#if showActionButtons || qandA.favorite}
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          class="p-0 text-lg text-blue-400 float-right"
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
      {#if showActionButtons}
        <button
          class="ml-4 p-0 text-xs text-blue-400"
          transition:fade={{ duration: 300 }}
          onclick={() => {
            copyToClipboard(qandA.question);
          }}
        >
          复制
        </button>
        <button
          class="ml-2 p-0 text-xs text-blue-400"
          transition:fade={{ duration: 300 }}
          onclick={() => {
            onResendMessage(qandA.question);
          }}
        >
          再次发送
        </button>

        <button
          class="p-0 mr-4 text-xs text-blue-400 float-right"
          transition:fade={{ duration: 300 }}
          onclick={() => {
            toggleFold(qandA);
          }}
        >
          折叠
        </button>

        <button
          class="p-0 mr-4 text-xs text-blue-400 float-right"
          transition:fade={{ duration: 300 }}
          onclick={() => {
            const tags = "wise-bot";
            const title = encodeURIComponent(
              qandA.question.length > 30
                ? qandA.question.substring(0, 25) + "..."
                : qandA.question,
            );
            const text = encodeURIComponent(
              `**问题：** ${qandA.question}\n来自 **${qandA.botName}** 的回答：\n---\n${qandA.answer}`,
            );

            window.location.href = `bear://x-callback-url/create?&tags=${tags}&title=${title}&text=${text}`;
          }}
        >
          Bear
        </button>

        <button
          class="mr-8 p-0 text-xs text-blue-400 float-right"
          transition:fade={{ duration: 300 }}
          onclick={() => {
            deleteQA(qandA);
          }}
        >
          删除
        </button>
      {/if}
    </p>
    <article class="prose mt-2 max-w-none" onclick={handleUrlNavigation}>
      {@html marked.parse(qandA.question)}
    </article>
  </div>

  <div class="px-4 py-3">
    <p class="relative font-bold text-blue-500">
      {qandA.botName}
      {#if showActionButtons}
        <span transition:fade={{ duration: 300 }}>
          <button
            class="ml-4 p-0 text-xs text-blue-400"
            onclick={() => {
              copyToClipboard(qandA.answer);
            }}
          >
            复制
          </button>
        </span>
      {/if}
    </p>
    <article class="prose mt-2 max-w-none" onclick={handleUrlNavigation}>
      {#if qandA.answer.length === 0 && isRespOngoing}
        <div class="blink">_</div>
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
