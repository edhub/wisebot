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
        class="fixed left-0 top-0 w-full h-full bg-neutral/40 backdrop-blur-[2px] z-[100]"
    >
        <div
            onclick={(e) => e.stopPropagation()}
            transition:slide={{ duration: 200, axis: "x" }}
            class="fixed top-0 left-0 z-[101] flex h-full max-h-full w-80 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-r-2xl border-r border-base-200/90 bg-base-100 shadow-2xl ring-1 ring-base-200/30"
        >
            <div
                class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 scrollbar-thin"
            >
                <ApiConfig />
            </div>
            <div
                class="shrink-0 border-t border-base-200/60 p-4 pt-3"
            >
                <button
                    class="btn btn-error w-full rounded-xl border-0 font-medium shadow-sm transition-all duration-200 hover:brightness-95 active:scale-[0.99]"
                    onclick={() => {
                        clearChat();
                        showMenu = false;
                    }}>清除聊天历史</button
                >
            </div>
        </div>
    </div>
{/if}
