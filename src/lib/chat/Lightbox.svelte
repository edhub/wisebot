<script lang="ts">
    import { fade } from "svelte/transition";
    import { lightboxState, closeLightbox } from "./lightboxStore.svelte";

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") closeLightbox();
    }
</script>

{#if lightboxState.imageUrl}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        role="dialog"
        class="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        transition:fade={{ duration: 150 }}
        onclick={closeLightbox}
        onkeydown={handleKeydown}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <img
            src={lightboxState.imageUrl}
            alt="Full size"
            class="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain cursor-zoom-out"
            onclick={(e) => e.stopPropagation()}
        />
        <button
            class="absolute top-4 right-5 text-white text-3xl leading-none hover:text-gray-300 transition-colors"
            onclick={closeLightbox}
            aria-label="关闭"
        >
            ✕
        </button>
    </div>
{/if}
