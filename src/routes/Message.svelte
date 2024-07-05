<script lang="ts">
  import { marked } from "marked";
  import hljs from "highlight.js";
  import "highlight.js/styles/github-dark-dimmed.min.css";

  import { fade } from "svelte/transition";

  let {
    name = "",
    message = "",
    isRespOngoing = false,
    onMessageCopied = () => {},
    onResendMessage = () => {},
  }: {
    name: string;
    message: string;
    isRespOngoing?: boolean;
    onMessageCopied?: () => void;
    onResendMessage?: (message: string) => void;
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

  marked.use({ renderer });

  let showActionButtons = $state(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(message);
    onMessageCopied();
  }

  function handleUrlNavigation(e: Event) {
    if (e.target instanceof HTMLAnchorElement) {
      e.preventDefault();
      const url = (e.target as HTMLAnchorElement).href;
      open(url);
    }
  }
</script>

<div
  class="p-4 border-b border-gray-200"
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
  <p class="relative font-bold text-blue-500">
    {name}
    {#if showActionButtons}
      <span transition:fade={{ duration: 300 }}>
        <button class="ml-4 p-0 text-xs text-blue-400" onclick={copyToClipboard}
          >复制</button
        >
        {#if name === "User"}
          <button
            class="ml-2 p-0 text-xs text-blue-400"
            onclick={() => {
              onResendMessage(message);
            }}>再次发送</button
          >
        {/if}
      </span>
    {/if}
  </p>
  <article class="prose mt-2 max-w-none" onclick={handleUrlNavigation}>
    {#if message.length === 0 && isRespOngoing}
      <div class="blink">_</div>
    {:else}
      {@html marked.parse(message)}
    {/if}
  </article>
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
