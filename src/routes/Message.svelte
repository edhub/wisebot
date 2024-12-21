<script lang="ts" module>
  export interface QandA {
    id: string;
    userName?: string;
    question: string;
    botName?: string;
    answer: string;
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
    deleteQA,
  }: {
    qandA: QandA;
    isRespOngoing?: boolean;
    onResendMessage?: (message: string) => void;
    deleteQA?: (qa: QandA) => void;
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

  marked.use(markedKatex({
    throwOnError: false,
  }));

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

  function deleteMsg(qa: QandA) {
    if (deleteQA) {
      deleteQA(qa);
      toast.show("已删除");
    }
  }

  let toast: { show: (msg: string) => void } = getContext("toast");
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
    integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn"
    crossorigin="anonymous"
  />
</svelte:head>

<div
  class="rounded-md mx-2 my-2 border-gray-200 border shadow-sm"
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
  <div class="px-4 py-3 border-b border-gray-200">
    <p class="relative font-bold text-blue-500">
      {qandA.userName ? qandA.userName : "User"}
      {#if showActionButtons}
        <span transition:fade={{ duration: 300 }}>
          <button
            class="ml-4 p-0 text-xs text-blue-400"
            onclick={() => {
              copyToClipboard(qandA.question);
            }}
          >
            复制
          </button>
          <button
            class="ml-2 p-0 text-xs text-blue-400"
            onclick={() => {
              onResendMessage(qandA.question);
            }}
          >
            再次发送
          </button>
        </span>
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
          <button
            class="ml-2 p-0 text-xs text-blue-400"
            onclick={() => {
              deleteMsg(qandA);
            }}
          >
            删除
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
