<script lang="ts">
  import { getContext, tick, untrack } from "svelte";
  import Message from "./Message.svelte";
  import { queryBianXie } from "$lib/query_bian_xie";

  const KEY_CHAT_LOG = "chatLog1";

  interface Message {
    id: string;
    name: string;
    model: string;
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
    sendMessage();
  }

  async function sendMessage() {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const genId = () => Math.random().toString(36).substr(2, 9);

    if (message.trim() !== "") {
      scrollToBottom();

      let tmpMsg = message;
      message = "";

      chatLog.push({ id: genId(), name: "User", model: "", message: tmpMsg });
      chatLog = chatLog;
      isRespOngoing = true;

      //  const url = tmpMsg.match(urlRegex);

      //  if (url) {
      // 	for (let i = 0; i < url.length; i++) {
      // 	  const content =
      // 		 (await grabContentFromUrl(url[i])) || "(无法打开这个网页)";
      // 	  tmpMsg = tmpMsg.replace(url[i], `${url[i]} ${content}`);
      // 	}
      //  }

      const deltaReader = queryBianXie(tmpMsg);

      for await (const delta of deltaReader) {
        respMessage += delta;
      }

      respMessage = respMessage.length > 0 ? respMessage : "好像出错啦";

      chatLog.push({
        id: genId(),
        name: "gpt-4o",
        model: selectedModel,
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

  let selectedModel = $state(
    localStorage.getItem("selectedModel") ?? "codegemma"
  );

  $effect(() => {
    if (selectedModel !== "") {
      let model = selectedModel;
      localStorage.setItem("selectedModel", model);
      untrack(() => toast.show("已选模型: " + model));
    }
  });

  let serverUrl = $state(
    localStorage.getItem("serverUrl") ?? "http://10.1.22.88:11434"
  );

  $effect(() => {
    if (serverUrl === "") {
      serverUrl = "http://localhost:11434";
    }
    serverUrl = serverUrl.replace(/\/$/, ""); // trim last slash
    localStorage.setItem("serverUrl", serverUrl);
  });

  let toast: { show: (msg: string) => void } = getContext("toast");
</script>

<div class="z-0 w-full h-full">
  <div bind:this={chatContainer} class=" flex flex-col overflow-y-auto pb-20">
    {#each chatLog as { id, name, model, message } (id)}
      <Message
        {name}
        model="gpt-4o"
        {message}
        onMessageCopied={() => {
          toast.show("消息已复制到剪贴板");
        }}
        onResendMessage={resendMessage}
      />
    {/each}
    {#if isRespOngoing}
      <Message
        name="gpt-4o"
        model={selectedModel}
        message={respMessage}
        {isRespOngoing}
      />
    {/if}
  </div>

  <form
    class="chat-input fixed bottom-0 w-full bg-white flex items-end"
    onsubmit={(e) => {
      e.preventDefault();
      sendMessage;
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
      <span class="iconify simple-line-icons--paper-plane"></span>
    </button>
  </form>
</div>

<button
  class="fixed top-0 right-0 m-2 p-2 rounded bg-red-400 hover:bg-red-500 text-white"
  onclick={() => {
    chatLog = [];
    localStorage.removeItem(KEY_CHAT_LOG);
  }}
>
  <span class="iconify simple-line-icons--trash"> </span>
</button>
