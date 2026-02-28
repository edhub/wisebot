<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import ApiConfig from "./ApiConfig.svelte";

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
        transition:fade={{ duration: 200 }}
        class="fixed left-0 top-0 w-full h-full bg-gray-900/40 backdrop-blur-[2px] z-[100]"
    >
        <div
            onclick={(e) => {
                e.stopPropagation();
            }}
            transition:slide={{ duration: 200, axis: "x" }}
            class="fixed top-0 left-0 h-full w-80 max-w-[calc(100vw-3rem)] overflow-auto bg-white border-r border-gray-200 z-[101]"
        >
            <div class="w-full p-4">
                <ApiConfig />
            </div>
            <div class="w-full p-4">
                <button
                    class="w-full p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    onclick={() => {
                        clearChat();
                        showMenu = false;
                    }}>清除聊天历史</button
                >
            </div>
        </div>
    </div>
{/if}
