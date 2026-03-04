<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { confirmState } from "./confirm.svelte";

    function handleCancel() {
        confirmState.show = false;
    }

    function handleConfirm() {
        confirmState.onConfirm();
    }
</script>

{#if confirmState.show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px]"
        transition:fade={{ duration: 200 }}
        onclick={handleCancel}
    >
        <div
            class="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            transition:scale={{ duration: 200, start: 0.95 }}
            onclick={(e) => e.stopPropagation()}
        >
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                    {confirmState.title}
                </h3>
                <p class="text-sm text-gray-500 leading-relaxed">
                    {confirmState.message}
                </p>
            </div>

            <div class="flex border-t border-gray-50">
                <button
                    class="flex-1 px-4 py-3.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    onclick={handleCancel}
                >
                    取消
                </button>
                <div class="w-[1px] bg-gray-50"></div>
                <button
                    class="flex-1 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    onclick={handleConfirm}
                >
                    确认
                </button>
            </div>
        </div>
    </div>
{/if}
