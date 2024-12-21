<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { type QandA } from "./Message.svelte";

    let {
        qandA,
        toggleFavorite,
        toggleFold,
        deleteMsg,
    }: {
        qandA: QandA;
        toggleFavorite: (qa: QandA) => void;
        toggleFold: (qa: QandA) => void;
        deleteMsg: (qa: QandA) => void;
    } = $props();

    let showActionButtons = $state(false);
</script>

<div
    class="rounded-md mx-2 my-1 border-gray-200 border shadow-sm"
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
    <div class="px-4 py-3">
        <p class="text-sm">
            <span
                class="text-nowrap inline-block w-2/3 overflow-hidden text-ellipsis whitespace-nowrap text-gray-800"
            >
                {qandA.question}
            </span>

            <span class="font-bold">
                {#if showActionButtons || qandA.favorite}
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button
                        class="p-0 text-lg text-blue-400 float-right"
                        transition:fade={{ duration: 300 }}
                        onclick={() => {
                            toggleFavorite(qandA);
                        }}
                    >
                        <span
                            class="{qandA.favorite
                                ? 'text-red-500'
                                : 'text-gray-500'} font-bold iconify simple-line-icons--star full"
                        >
                        </span>
                    </button>
                {/if}

                {#if showActionButtons}
                    <button
                        class="p-0 mr-4 text-xs text-blue-400 float-right"
                        transition:fade={{ duration: 300 }}
                        onclick={() => {
                            toggleFold(qandA);
                        }}
                    >
                        展开
                    </button>

                    <button
                        class="mr-8 p-0 text-xs text-blue-400 float-right"
                        transition:fade={{ duration: 300 }}
                        onclick={() => {
                            deleteMsg(qandA);
                        }}
                    >
                        删除
                    </button>
                {/if}
            </span>
        </p>
    </div>
</div>
