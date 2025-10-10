<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import ApiConfig from "./ApiConfig.svelte";
  import { chatState, saveChatLog } from "./ChatStore.svelte";

  let {
    showMenu = $bindable(false),
    clearChat,
  }: {
    showMenu: boolean;
    clearChat: () => void;
  } = $props();
</script>

{#if showMenu}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onclick={async () => {
      showMenu = false;
    }}
    transition:fade={{ duration: 250 }}
    class="fixed left-0 top-0 w-full h-full bg-gray-800 bg-opacity-50 z-50"
  >
    <div
      onclick={(e) => {
        e.stopPropagation();
      }}
      transition:slide={{ duration: 250, axis: "x" }}
      class="fixed top-0 right-0 h-full w-80 overflow-auto bg-white border-l border-gray-200"
    >
      <div class="w-80 p-4">
        <ApiConfig />
      </div>
      <div class="w-80 p-4">
        <button
          class="w-full p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          onclick={() => {
            chatState.chatLog.forEach((qa) => {
              qa.folded = qa.isResponseOngoing ? false : true;
            });
            saveChatLog();
            showMenu = false;
          }}>折叠全部消息</button
        >
        <button
          class="w-full mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-600"
          onclick={() => {
            clearChat();
            showMenu = false;
          }}>清除聊天历史</button
        >
      </div>
    </div>
  </div>
{/if}
