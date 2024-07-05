<script lang="ts">
  import { getContext, tick, untrack } from "svelte";
  import Message from "./Message.svelte";
  import bianXieApi from "$lib/query_bian_xie";
  import Menu from "./Menu.svelte";

  const KEY_CHAT_LOG = "chatLog1";

  interface Message {
    id: string;
    name: string;
    message: string;
  }

  let chatLog = $state<Message[]>([]);
  let localChatLog = localStorage.getItem(KEY_CHAT_LOG);
  chatLog = localChatLog ? JSON.parse(localChatLog) : [];

  let showMenu = $state(false);

  let message = $state("");

  let chatContainer: HTMLDivElement;
  let textarea: HTMLTextAreaElement;

  function resizeTextarea() {
    textarea.style.height = "auto";
    let maxHeight = window.innerHeight * 0.8; // 80% of the window height
    let desiredHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = desiredHeight + "px";
  }

  let respMessage = $state("");
  let isRespOngoing = $state(false);

  function resendMessage(msg: string) {
    message = msg;
    textarea.focus();
  }

  async function sendMessage() {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const genId = () => Math.random().toString(36).substr(2, 9);

    if (message.trim() !== "") {
      scrollToBottom();

      let tmpMsg = message;
      message = "";

      chatLog.push({ id: genId(), name: "User", message: tmpMsg });
      chatLog = chatLog;
      isRespOngoing = true;

      const deltaReader = bianXieApi.query(tmpMsg);

      for await (const delta of deltaReader) {
        respMessage += delta;
      }

      respMessage = respMessage.length > 0 ? respMessage : "好像出错啦";

      chatLog.push({
        id: genId(),
        name: bianXieApi.getModel(),
        message: respMessage,
      });
      chatLog = chatLog;

      isRespOngoing = false;
      respMessage = "";

      localStorage.setItem(KEY_CHAT_LOG, JSON.stringify(chatLog));
    }
  }

  $effect(() => {
    setTimeout(() => scrollToBottom(), 500);

    const updateScrollTime = () => (scrollTime = Date.now());
    window.addEventListener("scroll", updateScrollTime);
    return () => window.removeEventListener("scroll", updateScrollTime);
  });

  let scrollTime = 0;
  function shouldAutoScroll() {
    const threshold = 200; // distance from bottom in pixels
    const distanceFromBottom =
      document.documentElement.scrollHeight -
      window.scrollY -
      window.innerHeight;
    const isScrolling = Date.now() - scrollTime < 100;
    const nearBottom = distanceFromBottom < threshold;
    return isRespOngoing && nearBottom && !isScrolling;
  }

  $effect(() => {
    if (respMessage && shouldAutoScroll()) {
      scrollToBottom();
    }
  });

  async function scrollToBottom() {
    await tick();
    chatContainer.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  let toast: { show: (msg: string) => void } = getContext("toast");
</script>

<div class="z-0 w-full h-full">
  <div bind:this={chatContainer} class=" flex flex-col overflow-y-auto pb-20">
    {#each chatLog as { id, name, message } (id)}
      <Message
        {name}
        {message}
        onMessageCopied={() => {
          toast.show("消息已复制到剪贴板");
        }}
        onResendMessage={resendMessage}
      />
    {/each}
    {#if isRespOngoing}
      <Message
        name={bianXieApi.getModel()}
        message={respMessage}
        {isRespOngoing}
      />
    {/if}
  </div>

  <form
    class="chat-input fixed bottom-0 w-full bg-white flex items-start pb-3"
    onsubmit={(e) => {
      e.preventDefault();
      sendMessage();
    }}
  >
    <textarea
      bind:this={textarea}
      id="chat-input"
      placeholder="输入消息..."
      bind:value={message}
      class="m-2 p-2 resize-none rounded border flex-grow outline-none"
      rows="2"
      maxlength="4000"
      onkeydown={async (e) => {
        if (e.key === "Enter" && e.keyCode === 13 && !e.altKey && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
          await tick();
          resizeTextarea();
        }
      }}
      oninput={resizeTextarea}
    ></textarea>

    <button
      type="submit"
      class="m-2 ml-0 p-2 rounded bg-blue-400 hover:bg-blue-500 text-white"
    >
      <span class="iconify simple-line-icons--paper-plane text-2xl"></span>
    </button>
  </form>
</div>

<button
  class="fixed top-0 right-0 m-2 p-2 rounded bg-blue-400 hover:bg-blue-500 text-white"
  onclick={() => (showMenu = true)}
>
  <span class="iconify simple-line-icons--menu"> </span>
</button>

<Menu
  bind:showMenu
  clearChat={() => {
    chatLog = [];
    localStorage.removeItem(KEY_CHAT_LOG);
  }}
/>
