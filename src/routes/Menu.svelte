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
      class="fixed top-0 right-0 h-full w-80 overflow-auto bg-white border-l border-gray-200"
    >
      <div class="w-80 p-4">
        <BianXieApiConfig />

        <button
          class="w-full mt-12 p-2 bg-red-500 text-white rounded"
          onclick={clearChat}>清除聊天历史</button
        >
      </div>
      <div class="p-4">
      <div class="flex flex-row items-baseline">
        <p class="text-lg font-bold">说明</p>
      </div>
      <hr class="my-2" />
        <ul class="list-disc list-inside mx-2">
          <li>
            <b>gpt-4o-mini</b> 便宜好用，简单的问题可以应付。
          </li>
          <li>
            <b>claude-3-5-sonnet-20241022</b> 能力够强，需要靠谱点的答案可以选它。
          </li>
          <li>
            <b>o1-mini</b> 能力最强，性价比也很高，但稍微慢一点，有时候会超时。
          </li>
        </ul>
      </div>
    </div>
  </div>
{/if}
