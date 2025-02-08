<script lang="ts">
  import { tick } from "svelte";
  import { query } from "./query_api";
  import ChatContainer from "./ChatContainer.svelte";
  import ChatInput from "./ChatInput.svelte";
  import Menu from "./Menu.svelte";
  import {
    addQA,
    chatState,
    generateId,
    type QandA,
  } from "./ChatStore.svelte";
  import { MODELS } from "./model_config";

  let showMenu = $state(false);
  let chatInput: ChatInput;

  async function handleSendMessage(
    model: string,
    message: string,
    lastQA?: QandA,
  ) {
    if (message.trim() === "") return;

    chatState.tempQA = {
      id: generateId(),
      question: message,
      answer: "",
      botName: MODELS[model].displayName,
    } as QandA;

    const startTime = Date.now();
    chatState.isRespOngoing = true;

    await tick();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const deltaReader = query(model, message, lastQA);
    let deltaCount = 0;
    let isFirstResponse = true;

    for await (const delta of deltaReader) {
      if (isFirstResponse) {
        chatState.tempQA.firstResponseTime = Date.now() - startTime;
        isFirstResponse = false;
      }
      deltaCount++;
      chatState.tempQA.answer += delta;
    }

    if (chatState.tempQA.answer.length === 0) {
      chatState.tempQA.firstResponseTime = Date.now() - startTime;
      chatState.tempQA.answer = "好像出错啦";
    }

    chatState.tempQA.completionTime = Date.now() - startTime;

    addQA(chatState.tempQA);
    chatState.isRespOngoing = false;
  }

  function clearNonFavoriteChats() {
    chatState.chatLog = chatState.chatLog.filter((qa) => qa.favorite);
  }

  function handleResendMessage(message: string) {
    chatInput?.setQuestion(message);
  }

  function handleFollowUp(qa: QandA) {
    chatInput?.setQuestion("", qa);
  }

  $effect(() => {
    const quickInputListener = (e: KeyboardEvent) => {
      if (e.key === "k" && e.metaKey) {
        e.preventDefault();
        document.getElementById("chat-input")?.focus();
      }
    };
    window.addEventListener("keydown", quickInputListener);
    return () => window.removeEventListener("keydown", quickInputListener);
  });
</script>

<div class="z-0 w-full h-full">
  <div class="fixed top-0 right-0 left-0 bg-gray-50 z-40 border-b pt-4">
    <ChatInput
      bind:this={chatInput}
      onSendMessage={handleSendMessage}
      isRespOngoing={chatState.isRespOngoing}
    />
    <!-- 菜单按钮 -->
    <button
      class="absolute right-0 bottom-0 m-2 p-2 rounded bg-gray-200 hover:bg-blue-300 text-gray-600"
      on:click={() => (showMenu = true)}
    >
      <span class="iconify simple-line-icons--menu text-sm"> </span>
    </button>
  </div>
  <div class="mt-28">
    <ChatContainer
      resendMessage={handleResendMessage}
      onFollowUp={handleFollowUp}
    />
  </div>
</div>

<Menu bind:showMenu clearChat={clearNonFavoriteChats} />
