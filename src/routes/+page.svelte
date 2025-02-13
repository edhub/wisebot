<script lang="ts">
  import { tick } from "svelte";
  import { query } from "./query_api";
  import ChatContainer from "./ChatContainer.svelte";
  import ChatInput from "./ChatInput.svelte";
  import Menu from "./Menu.svelte";
  import { chatState, generateId, saveChatLog, type QandA} from "./ChatStore.svelte";
  import { MODELS } from "./model_config";

  let showMenu = $state(false);
  let chatInput: ChatInput;

  async function handleSendMessage(
    model: string,
    message: string,
    lastQA?: QandA,
  ) {
    if (message.trim() === "") return;

    const startTime = Date.now();

    chatState.tempQA.unshift({
      id: generateId(),
      question: message,
      answer: "",
      botName: MODELS[model].displayName,
    });

    const qa = chatState.tempQA[0];

    await tick();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const deltaReader = query(model, message, lastQA);
    let isFirstResponse = true;

    for await (const delta of deltaReader) {
      if (isFirstResponse) {
        qa.firstResponseTime = Date.now() - startTime;
        isFirstResponse = false;
      }
      qa.answer += delta;
    }

    if (qa.answer.length === 0) {
      qa.firstResponseTime = Date.now() - startTime;
      qa.answer = "好像出错啦";
    }

    qa.completionTime = Date.now() - startTime;

    chatState.tempQA.pop();

    chatState.chatLog.unshift(qa);
    saveChatLog();
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
