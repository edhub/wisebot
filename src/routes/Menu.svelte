<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import BianXieApiConfig from "$lib/BianXieApiConfig.svelte";

  let {
    showMenu = $bindable(false),
    clearChat,
  }: {
    showMenu: boolean;
    clearChat: () => void;
  } = $props();
</script>

{#if showMenu}
  <div
    onclick={async () => {
      showMenu = false;
    }}
    transition:fade={{ duration: 250 }}
    class="fixed left-0 top-0 w-full h-full bg-gray-800 bg-opacity-50"
  >
    <div
      transition:slide={{ duration: 250, axis: "x" }}
      class="fixed top-0 right-0 h-full w-64 overflow-auto bg-white border-l border-gray-200"
    >
      <div class="w-64 p-4">
        <BianXieApiConfig />

        <button
          class="w-full mt-12 p-2 bg-red-500 text-white rounded"
          onclick={clearChat}>清除聊天历史</button
        >
      </div>
    </div>
  </div>
{/if}
