<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import BianXieApiConfig from "./ApiConfig.svelte";
  import { chatState } from "./ChatStore.svelte";
  import type { QandA } from "./ChatStore.svelte";

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
        <BianXieApiConfig />
      </div>
      <div class="p-4 w-80">
        <div class="flex flex-row items-baseline">
          <p class="text-lg font-bold">说明</p>
        </div>
        <hr class="my-2" />
        <ul class="list-disc list-inside mx-2">
          <li>
            <b>DeepSeekV3</b> 国产模型，性能不错，性价比高，优先推荐使用。
          </li>
          <li>
            <b>o1-mini</b> 能力最强，性价比也很高，但稍微慢一点，有时候会超时。
          </li>
          <li>
            <b>Claude3.5</b> 能力够强，需要靠谱点的答案可以选它。代码王者。
          </li>
          <li>
            <b>gpt-4o-all</b> 可以画图，访问网络。
          </li>
        </ul>
      </div>
      <div class="w-80 p-4">
        <button
          class="w-full p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          onclick={() => {
            chatState.chatLog = chatState.chatLog.map((qa) => ({ ...qa, folded: true }));
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
