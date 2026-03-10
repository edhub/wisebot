<script lang="ts">
    import { fade } from "svelte/transition";
    import { lightboxState, closeLightbox } from "./lightboxStore.svelte";

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") closeLightbox();
    }

    // 弹窗打开时锁住 body 滚动，防止底层列表被触摸拖动
    $effect(() => {
        if (lightboxState.imageUrl) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    });

    // 用 pointerdown/pointerup 替代 onclick：
    // 触屏上手指稍微移动就不触发 click，改为自己判断位移来区分点击和误触
    let downX = 0;
    let downY = 0;

    function handleBackdropPointerDown(e: PointerEvent) {
        downX = e.clientX;
        downY = e.clientY;
    }

    function handleBackdropPointerUp(e: PointerEvent) {
        const dx = Math.abs(e.clientX - downX);
        const dy = Math.abs(e.clientY - downY);
        if (dx < 10 && dy < 10) {
            closeLightbox();
        }
    }

    function handleBtnPointerDown(e: PointerEvent) {
        downX = e.clientX;
        downY = e.clientY;
        e.stopPropagation();
    }

    function handleBtnPointerUp(e: PointerEvent) {
        const dx = Math.abs(e.clientX - downX);
        const dy = Math.abs(e.clientY - downY);
        e.stopPropagation();
        if (dx < 10 && dy < 10) {
            closeLightbox();
        }
    }
</script>

{#if lightboxState.imageUrl}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        role="dialog"
        class="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        style="touch-action: none"
        transition:fade={{ duration: 150 }}
        onpointerdown={handleBackdropPointerDown}
        onpointerup={handleBackdropPointerUp}
        onkeydown={handleKeydown}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <img
            src={lightboxState.imageUrl}
            alt="Full size"
            class="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onpointerdown={(e) => e.stopPropagation()}
            onpointerup={(e) => e.stopPropagation()}
        />
        <!-- 44×44px 最小触摸区域，视觉上保持紧凑 -->
        <button
            class="absolute top-2 right-2 flex items-center justify-center w-11 h-11 rounded-full text-white text-xl hover:bg-white/20 active:bg-white/30 transition-colors"
            style="touch-action: manipulation"
            onpointerdown={handleBtnPointerDown}
            onpointerup={handleBtnPointerUp}
            aria-label="关闭"
        >
            ✕
        </button>
    </div>
{/if}
