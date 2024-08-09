<script lang="ts">
  import { tick } from "svelte";
  import Message, { type QandA } from "./Message.svelte";
  // import bianXieApi from "$lib/query_bian_xie";
  import Menu from "./Menu.svelte";
  import { llmApi } from "$lib/query_chooser";
  import { scale, slide } from "svelte/transition";
  // import { query } from "$lib/query_chooser";

  const KEY_CHAT_LOG = "chatLog2";

  let chatLog = $state<QandA[]>([]);
  let localChatLog = localStorage.getItem(KEY_CHAT_LOG);
  chatLog = localChatLog ? JSON.parse(localChatLog) : [];

  let showMenu = $state(false);

  let textarea: HTMLTextAreaElement;

  async function resizeTextarea() {
    await tick();
    textarea.style.height = "auto";
    let maxHeight = window.innerHeight * 0.8; // 80% of the window height
    let desiredHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = desiredHeight + "px";
  }

  let question = $state("");
  let isRespOngoing = $state(false);
  let tempQA: QandA = $state({ id: "", question: "", answer: "" });

  function resendMessage(msg: string) {
    question = msg;
    textarea.focus();
  }

  async function sendMessage() {
    const genId = () => Math.random().toString(36).substr(2, 9);

    if (question.trim() !== "") {
      scrollToBottom();

      let tmpMsg = question;
      question = "";
      tempQA = {
        id: genId(),
        question: tmpMsg,
        botName: llmApi.model,
        answer: "",
      };

      isRespOngoing = true;

      const deltaReader = llmApi.query(tmpMsg);

      for await (const delta of deltaReader) {
        tempQA.answer += delta;
      }

      if (tempQA.answer.length === 0) {
        tempQA.answer = "好像出错啦";
      }

      chatLog.push(tempQA);

      isRespOngoing = false;

      if (nearBottom()) {
        scrollToBottom();
      }

      localStorage.setItem(KEY_CHAT_LOG, JSON.stringify(chatLog));
    }
  }

  let chatContainer: HTMLDivElement;
  $effect(() => {
    setTimeout(() => scrollToBottom(), 500);

    const updateScrollTime = () => (scrollTime = Date.now());
    window.addEventListener("scroll", updateScrollTime);
    return () => window.removeEventListener("scroll", updateScrollTime);
  });

  let scrollTime = 0;
  function nearBottom() {
    const threshold = 350; // distance from bottom in pixels
    const distanceFromBottom =
      document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
    return distanceFromBottom < threshold;
  }
  function shouldAutoScroll() {
    const isScrolling = Date.now() - scrollTime < 70;
    return isRespOngoing && nearBottom() && !isScrolling;
  }

  $effect(() => {
    if (tempQA.answer && shouldAutoScroll()) {
      scrollToBottom();
    }
  });

  function deleteQA(qa: QandA) {
    chatLog = chatLog.filter((q) => q.id !== qa.id);
    localStorage.setItem(KEY_CHAT_LOG, JSON.stringify(chatLog));
  }

  async function scrollToBottom() {
    await tick();
    chatContainer.scrollIntoView({ behavior: "smooth", block: "end" });
  }
</script>

<div class="z-0 w-full h-full">
  <div bind:this={chatContainer} class=" flex flex-col overflow-y-auto pb-24">
    {#each chatLog as qa (qa.id)}
      <Message qandA={qa} onResendMessage={resendMessage} {deleteQA} />
    {/each}
    {#if isRespOngoing}
      <Message qandA={tempQA} isRespOngoing={true} onResendMessage={resendMessage} />
    {/if}
  </div>

  <form
    class="chat-input fixed bottom-0 w-full bg-white flex items-start pb-3"
    onsubmit={(e) => {
      e.preventDefault();
      if (!isRespOngoing) sendMessage();
    }}
  >
    <textarea
      bind:this={textarea}
      id="chat-input"
      placeholder="输入消息..."
      bind:value={question}
      class="m-2 p-2 resize-none rounded border flex-grow outline-none"
      rows="2"
      maxlength="4000"
      onkeydown={async (e) => {
        if (!isRespOngoing && e.key === "Enter" && e.keyCode === 13 && !e.altKey && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
          resizeTextarea();
        }
      }}
      oninput={resizeTextarea}
    ></textarea>

    <button type="submit" class="m-2 ml-0 p-2 rounded bg-blue-400 hover:bg-blue-500 text-white">
      <span class="iconify simple-line-icons--paper-plane text-2xl"></span>
    </button>
  </form>
</div>

<button
  class="fixed top-0 right-0 m-2 p-2 rounded bg-blue-400 hover:bg-blue-500 text-white"
  onclick={() => (showMenu = true)}
>
  <span class="iconify simple-line-icons--menu text-2xl"> </span>
</button>

<Menu
  bind:showMenu
  clearChat={() => {
    chatLog = [];
    localStorage.removeItem(KEY_CHAT_LOG);
  }}
/>
