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
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-neutral/40 backdrop-blur-[2px]"
        transition:fade={{ duration: 200 }}
        onclick={handleCancel}
    >
        <div
            class="modal-box w-full max-w-sm overflow-hidden rounded-2xl border border-base-200/90 bg-base-100 p-0 shadow-2xl ring-1 ring-base-200/40"
            transition:scale={{ duration: 200, start: 0.95 }}
            onclick={(e) => e.stopPropagation()}
        >
            <div class="p-6">
                <h3 class="mb-1.5 text-lg font-semibold tracking-tight text-base-content">
                    {confirmState.title}
                </h3>
                <p class="text-sm leading-relaxed text-content-placeholder/95">
                    {confirmState.message}
                </p>
            </div>

            <div class="flex border-t border-base-200">
                <button
                    class="btn btn-ghost flex-1 rounded-none h-auto min-h-14 text-sm font-medium text-content-placeholder hover:bg-base-200 border-0"
                    onclick={handleCancel}
                >
                    取消
                </button>
                <div class="w-px bg-base-200 self-stretch"></div>
                <button
                    class="btn btn-ghost flex-1 rounded-none h-auto min-h-14 text-sm font-medium text-error hover:bg-error/10 border-0"
                    onclick={handleConfirm}
                >
                    确认
                </button>
            </div>
        </div>
    </div>
{/if}
