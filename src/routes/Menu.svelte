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
      <div class="p-4 w-80">
        <div class="flex flex-row items-baseline">
          <p class="text-lg font-bold">说明</p>
        </div>
        <hr class="my-2" />
        <ul class="list-disc list-inside mx-2">
          <li>
            <b>Gemini 2.0</b>  Google 最新的普通模型，速度很快，一般问答足够。
          </li>
          <li>
            <b>o3 Mini Medium</b> O3 推理模型，速度很快，需要高质量的答案可以优先使用。
          </li>
          <li>
            <b>DeepSeek R1</b> 国产模型，官方服务不够稳定，所以用的是阿里的服务，但速度比较慢。好处是可以看到思考过程。
          </li>
          <li>
            <b>其他</b> 其他模型就不详细介绍了，可以自己尝试，我一般是按照自己的使用习惯来给模型排序，用的多的放前面。
          </li>
        </ul>
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
