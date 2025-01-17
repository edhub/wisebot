<script lang="ts">
  import { tick } from "svelte";
  import { MODELS } from "./model_config";

  const KEY_LAST_MODEL = "last_used_model";

  let { onSendMessage, isRespOngoing } = $props<{
    onSendMessage: (model: string, message: string) => void;
    isRespOngoing: boolean;
  }>();

  let question = $state("");
  let textarea: HTMLTextAreaElement;

  const availableModels = Object.keys(MODELS);
  let lastModel = $state(
    localStorage.getItem(KEY_LAST_MODEL) || availableModels[0],
  );

  function saveLastModel(model: string) {
    lastModel = model;
    localStorage.setItem(KEY_LAST_MODEL, model);
  }

  async function resizeTextarea() {
    await tick();
    textarea.style.height = "auto";
    let maxHeight = window.innerHeight * 0.5;
    let desiredHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = desiredHeight + "px";
  }

  function handleModelSelect(model: string) {
    saveLastModel(model);
    onSendMessage(model, question);
    question = "";
    resizeTextarea();
    textarea.blur();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (isRespOngoing) {
      return;
    }

    // 处理 Enter 发送消息
    if (e.key === "Enter" && e.keyCode === 13 && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      handleModelSelect(lastModel);
      return;
    }

    // 处理 CMD+数字 选择模型
    if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
      const num = parseInt(e.key);
      if (num >= 1 && num <= availableModels.length) {
        e.preventDefault();
        const selectedModel = availableModels[num - 1];
        if (question.trim()) {
          handleModelSelect(selectedModel);
        } else {
          saveLastModel(selectedModel);
        }
      }
    }
  }

  $effect(() => {
    // 添加全局快捷键监听
    const globalShortcutListener = (e: KeyboardEvent) => {
      if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= availableModels.length) {
          e.preventDefault();
          saveLastModel(availableModels[num - 1]);
        }
      }
    };

    window.addEventListener("keydown", globalShortcutListener);
    return () => window.removeEventListener("keydown", globalShortcutListener);
  });

  export function setQuestion(text: string) {
    question = text;
    textarea.focus();
    resizeTextarea();
  }
</script>

<form class="flex flex-col">
  <div class="p-2">
    <textarea
      bind:this={textarea}
      id="chat-input"
      placeholder="⌘+k 输入消息..."
      bind:value={question}
      class="p-2 resize-none w-full rounded border flex-grow"
      rows="1"
      maxlength="6000"
      onkeydown={handleKeyDown}
      oninput={resizeTextarea}
    ></textarea>
    <div
      class="flex items-center gap-2 text-xs text-gray-500 w-4/5 overflow-scroll"
    >
      {#each availableModels as model, i}
        <button
          type="button"
          class="px-2 py-2 rounded transition-colors duration-150 whitespace-nowrap {lastModel ===
          model
            ? 'bg-gray-200 font-bold'
            : 'bg-gray-100 hover:bg-gray-200'}"
          onclick={() => {
            if (question.trim()) {
              handleModelSelect(model);
            } else {
              saveLastModel(model);
            }
          }}
        >
          ⌘{i + 1}
          {MODELS[model].displayName}
        </button>
      {/each}
    </div>
  </div>
</form>
