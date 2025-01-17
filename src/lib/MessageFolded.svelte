<script lang="ts">
  import { fade } from "svelte/transition";

  let { qandA, deleteMsg, toggleFavorite, toggleFold } = $props<{
    qandA: {
      id: string;
      question: string;
      answer: string;
      botName?: string;
      favorite?: boolean;
    };
    deleteMsg: (qa: any) => void;
    toggleFavorite: (qa: any) => void;
    toggleFold: (qa: any) => void;
  }>();

  let showActionButtons = $state(false);
</script>

<div
  class="rounded-md mx-1 my-1 border-gray-200 border"
  onmouseover={() => {
    showActionButtons = true;
  }}
  onfocus={() => {
    showActionButtons = true;
  }}
  onmouseleave={() => {
    showActionButtons = false;
  }}
>
  <div class="px-4 pt-2 pb-1">
    <p class="text-sm">
      <span class="text-nowrap inline-block w-2/3 overflow-hidden text-ellipsis whitespace-nowrap text-gray-800">
        {qandA.question}
      </span>

      <span >
        {#if showActionButtons || qandA.favorite}
          <button
            class="p-0 text-lg text-blue-400 float-right"
            transition:fade={{ duration: 300 }}
            onclick={() => toggleFavorite(qandA)}
          >
            <span
              class="{qandA.favorite
                ? 'text-red-500'
                : 'text-gray-500'} font-bold iconify simple-line-icons--star"
            />
          </button>
        {/if}

        {#if showActionButtons}
          <button
            class="p-0 mr-4 text-xs text-gray-400 float-right"
            transition:fade={{ duration: 300 }}
            onclick={() => toggleFold(qandA)}
          >
            展开
          </button>

          <button
            class="mr-8 p-0 text-xs text-gray-500 float-right"
            transition:fade={{ duration: 300 }}
            onclick={() => deleteMsg(qandA)}
          >
            删除
          </button>
        {/if}
      </span>
    </p>
  </div>
</div>
