<script lang="ts">
  import { tick } from "svelte";
  import Message, { type QandA } from "./Message.svelte";
  import Menu from "./Menu.svelte";
  import BianXieApi from "$lib/query_bian_xie";
  import MessageFolded from "./MessageFolded.svelte";

  let availableModels = [
    "gpt-4o-mini",
    "claude-3-5-sonnet-20241022",
    "o1-mini",
    // "o1-all",
    // "o1-pro-all",
  ];

  let showModelButtons = $state(false);
  let lastModel = $state(availableModels[0]);

  const KEY_CHAT_LOG = "chatLog2";

  let chatLog = $state<QandA[]>([]);
  let localChatLog = localStorage.getItem(KEY_CHAT_LOG);
  chatLog = localChatLog ? JSON.parse(localChatLog) : [];

  let showMenu = $state(false);

  let textarea: HTMLTextAreaElement;

  async function resizeTextarea() {
    await tick();
    textarea.style.height = "auto";
    let maxHeight = window.innerHeight * 0.5; // 50% of the window height
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

  async function sendMessage(model: string) {
    const genId = () => Math.random().toString(36).substr(2, 9);

    lastModel = model || lastModel;

    if (question.trim() !== "") {
      scrollToBottom();

      let tmpMsg = question;
      question = "";
      tempQA = {
        id: genId(),
        question: tmpMsg,
        botName: lastModel,
        answer: "",
      };

      isRespOngoing = true;

      const deltaReader = BianXieApi.query(lastModel, tmpMsg);

      let deltaCount = 0;
      for await (const delta of deltaReader) {
        deltaCount++;
        tempQA.answer += delta;
      }

      if (tempQA.answer.length === 0) {
        tempQA.answer = "好像出错啦";
      }

      chatLog.push(tempQA);

      isRespOngoing = false;

      if (deltaCount > 1 && nearBottom()) {
        scrollToBottom();
      } else {
        await tick();
        chatContainer.lastElementChild?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }

  $effect(() => {
    localStorage.setItem(KEY_CHAT_LOG, JSON.stringify(chatLog));
  });

  let chatContainer: HTMLDivElement;
  $effect(() => {
    setTimeout(() => scrollToBottom(), 500);

    const updateScrollTime = () => (scrollTime = Date.now());
    window.addEventListener("scroll", updateScrollTime);
    return () => window.removeEventListener("scroll", updateScrollTime);
  });

  $effect(() => {
    const quickInputListener = (e: KeyboardEvent) => {
      if (e.key === "k" && e.metaKey) {
        e.preventDefault();
        textarea.focus();
      }
    };
    window.addEventListener("keydown", quickInputListener);
    return () => window.removeEventListener("keydown", quickInputListener);
  });

  let scrollTime = 0;
  function nearBottom() {
    const threshold = 350; // distance from bottom in pixels
    const distanceFromBottom =
      document.documentElement.scrollHeight -
      window.scrollY -
      window.innerHeight;
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
  }

  function toggleFavorite(qa: QandA) {
    qa.favorite = !qa.favorite;
  }

  let foldAll = true;
  function toggleFold(qa: QandA) {
    qa.folded = !qa.folded;
  }

  async function scrollToBottom() {
    await tick();
    chatContainer.scrollIntoView({ behavior: "smooth", block: "end" });
  }
</script>

<div class="z-0 w-full h-full">
  <div bind:this={chatContainer} class=" flex flex-col overflow-y-auto pb-24">
    {#each chatLog as qa (qa.id)}
      {#if qa.folded}
        <MessageFolded
          qandA={qa}
          deleteMsg={deleteQA}
          {toggleFavorite}
          {toggleFold}
        />
      {:else}
        <Message
          qandA={qa}
          onResendMessage={resendMessage}
          {deleteQA}
          {toggleFavorite}
          {toggleFold}
        />
      {/if}
    {/each}
    {#if isRespOngoing}
      <Message
        qandA={tempQA}
        isRespOngoing={true}
        onResendMessage={resendMessage}
        {deleteQA}
        {toggleFavorite}
        {toggleFold}
      />
    {/if}
  </div>

  <form
    class="chat-input fixed bottom-0 right-0 left-0 flex flex-col"
    onfocusin={() => {
      showModelButtons = true;
    }}
    onfocusout={() => {
      setTimeout(() => {
        showModelButtons = false;
      }, 200);
    }}
  >
    {#if showModelButtons}
      <div
        class="self-end mr-2 bg-white rounded overflow-hidden border border-gray-200 w-40"
      >
        <ul>
          {#each availableModels as model, i (model)}
            <li>
              <button
                type="button"
                class="w-full text-nowrap overflow-hidden text-ellipsis text-left h-10 px-2 py-1
                  {lastModel === model ? 'bg-blue-100 font-bold' : ''}
                  hover:bg-blue-200 active:bg-blue-200
                  border-b border-blue-200 last:border-b-0
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset"
                onclick={() => {
                  sendMessage(model);
                  showModelButtons = false;
                }}
              >
                {model}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="bg-white p-2">
      <textarea
        bind:this={textarea}
        id="chat-input"
        placeholder="输入消息..."
        bind:value={question}
        class="p-2 resize-none w-full rounded border flex-grow outline-none"
        rows="2"
        maxlength="4000"
        onkeydown={async (e) => {
          if (
            !isRespOngoing &&
            e.key === "Enter" &&
            e.keyCode === 13 &&
            !e.altKey &&
            !e.shiftKey
          ) {
            e.preventDefault();
            sendMessage(lastModel);
            resizeTextarea();
            textarea.blur();
          }
        }}
        oninput={resizeTextarea}
      ></textarea>
    </div>
  </form>
</div>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button
  class="fixed bottom-80 right-0 mr-2 p-2 rounded bg-gray-200 hover:bg-blue-300 text-white"
  onclick={() => (showMenu = true)}
>
  <span class="iconify simple-line-icons--menu text-xl"> </span>
</button>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button
  class="fixed bottom-64 right-0 mr-2 p-2 rounded bg-gray-200 hover:bg-blue-300 text-white"
  onclick={() => {
    if (foldAll) {
      chatLog.forEach((q) => (q.folded = false));
    } else {
      chatLog.forEach((q) => (q.folded = true));
    }
    foldAll = !foldAll;
  }}
>
  <span class="iconify simple-line-icons--layers text-xl"> </span>
</button>

<Menu
  bind:showMenu
  clearChat={() => {
    chatLog = chatLog.filter((q) => q.favorite);
  }}
/>
