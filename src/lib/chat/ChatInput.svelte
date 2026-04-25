<script lang="ts">
    import { tick, onMount } from "svelte";
    import { MODELS } from "$lib/settings/model_config";
    import { modelState, setCurrentModel } from "$lib/settings/modelState.svelte";
    import type { QandA } from "./ChatStore.svelte";
    import { saveImage, generateId } from "./ChatStore.svelte";

    let { onSendMessage, onEscape } = $props<{
        onSendMessage: (
            model: string,
            message: string,
            lastQA?: QandA,
            image?: string,
            imageUrl?: string,
        ) => void;
        onEscape?: () => void;
    }>();

    let question = $state("");
    let imageBase64 = $state<string | undefined>(undefined);
    let textarea: HTMLTextAreaElement;
    let fileInput: HTMLInputElement;
    let lastQA = $state<QandA | undefined>(undefined);

    const availableModels = Object.keys(MODELS);

    async function resizeTextarea() {
        await tick();
        // 先隐藏滚动条再重置高度，避免 "auto" 瞬间触发浏览器默认滚动条
        textarea.style.overflowY = "hidden";
        textarea.style.height = "auto";
        const maxHeight = window.innerHeight * 0.5;
        const desiredHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = desiredHeight + "px";
        // 只有内容被截断（达到最大高度）时才允许滚动
        textarea.style.overflowY =
            desiredHeight >= maxHeight ? "auto" : "hidden";
    }

    async function handleSendMessage(model: string) {
        setCurrentModel(model);
        if (question.trim() || imageBase64) {
            let imageId: string | undefined = undefined;
            let imageUrl: string | undefined = undefined;

            if (imageBase64) {
                imageId = generateId();
                await saveImage(imageId, imageBase64);
                imageUrl = imageBase64;
            }

            onSendMessage(model, question, lastQA, imageId, imageUrl);
            question = "";
            imageBase64 = undefined;
            lastQA = undefined;
            resizeTextarea();
            textarea.blur();
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            e.preventDefault();
            onEscape?.();
            return;
        }

        if (e.key === "Enter" && e.keyCode === 13 && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(modelState.currentModel);
            return;
        }

        // CMD+数字 快捷选模型并发送（仅在 textarea 聚焦时处理）
        // 全局的 CMD+数字（不发送，只切换）由 +page.svelte 统一监听
        if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
            const num = parseInt(e.key);
            if (num >= 1 && num <= availableModels.length) {
                e.preventDefault();
                const selectedModel = availableModels[num - 1];
                if (question.trim()) {
                    handleSendMessage(selectedModel);
                } else {
                    setCurrentModel(selectedModel);
                }
            }
        }
    }

    function handlePaste(e: ClipboardEvent) {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.indexOf("image") !== -1) {
                const file = item.getAsFile();
                if (file) processFile(file);
            }
        }
    }

    function handleFileChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            processFile(target.files[0]);
        }
    }

    function processFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageBase64 = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    export function setQuestion(text: string, qa?: QandA, image?: string) {
        question = text;
        imageBase64 = image;
        textarea.focus();
        resizeTextarea();
        lastQA = qa;
    }

    onMount(() => {
        resizeTextarea();
    });

    function formatLastQA(qa?: QandA) {
        if (!qa) return "";
        return qa.answer.length > 100
            ? qa.answer.substring(0, 100) + "..."
            : qa.answer;
    }
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<form class="flex min-w-0 flex-col">
    <div class="flex min-w-0 flex-col gap-3 p-4">
        {#if imageBase64}
            <div class="group relative inline-block max-w-full">
                <img
                    src={imageBase64}
                    alt="Preview"
                    class="max-h-32 rounded-box border border-base-300"
                />
                <button
                    type="button"
                    class="btn btn-error btn-circle btn-xs absolute -top-2 -right-2 w-6 h-6 min-h-0 p-0 shadow-md opacity-0 transition-opacity group-hover:opacity-100"
                    onclick={() => (imageBase64 = undefined)}
                >
                    ✕
                </button>
            </div>
        {/if}
        {#if lastQA}
            <div
                class="flex min-h-0 items-start justify-between gap-2 text-sm text-content-secondary"
            >
                <div class="max-h-16 min-w-0 flex-1 leading-snug text-left">
                    {formatLastQA(lastQA)}
                </div>
                <button
                    type="button"
                    class="btn btn-ghost btn-xs h-7 min-h-0 shrink-0 px-2 text-content-muted hover:text-content-secondary"
                    onclick={() => (lastQA = undefined)}
                >
                    ✕
                </button>
            </div>
        {/if}
        <div class="flex min-w-0 items-end gap-2">
            <div class="relative min-w-0 flex-1">
                <textarea
                    bind:this={textarea}
                    id="chat-input"
                    placeholder="输入消息或粘贴图片..."
                    bind:value={question}
                    class="textarea textarea-bordered m-0 block min-h-10 w-full resize-none border-base-200/80 bg-base-100 px-3 py-2.5 pr-10 text-base leading-5 text-base-content placeholder:text-content-placeholder/70 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/50 touch-manipulation"
                    rows="1"
                    maxlength="10000"
                    onkeydown={handleKeyDown}
                    oninput={resizeTextarea}
                    onpaste={handlePaste}
                ></textarea>
                <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-square absolute right-1.5 bottom-1.5 min-h-0 w-8 h-8 rounded-lg text-content-muted transition-colors hover:bg-base-200/80 hover:text-primary p-0"
                    onclick={() => fileInput.click()}
                    title="上传图片"
                >
                    <span class="iconify simple-line-icons--picture text-lg"
                    ></span>
                </button>
                <input
                    type="file"
                    bind:this={fileInput}
                    accept="image/*"
                    class="hidden"
                    onchange={handleFileChange}
                />
            </div>
            <button
                type="button"
                class="btn btn-primary btn-square h-10 min-h-10 w-10 shrink-0 border-0 p-0 touch-manipulation shadow-sm shadow-primary/20 transition-transform duration-200 hover:brightness-105 active:scale-95 disabled:pointer-events-none disabled:opacity-35 disabled:grayscale"
                onclick={() => handleSendMessage(modelState.currentModel)}
                disabled={!question.trim() && !imageBase64}
            >
                <span class="iconify simple-line-icons--plus text-lg"></span>
            </button>
        </div>
        <div
            class="text-content-placeholder -mx-0.5 flex min-w-0 items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5 text-xs scrollbar-none"
        >
            {#each availableModels as model, i}
                <button
                    type="button"
                    class="btn btn-ghost btn-sm h-auto min-h-0 shrink-0 normal-case font-normal {modelState.currentModel ===
                    model
                        ? 'rounded-xl bg-primary/[0.1] py-1.5 pl-2 pr-2.5 ring-1 ring-inset ring-primary/15'
                        : 'rounded-xl py-1.5 px-2.5 text-content-placeholder hover:bg-base-200/80 hover:text-content-muted'}"
                    onclick={() => handleSendMessage(model)}
                >
                    <span class="mr-0.5 font-mono text-[0.7rem] tabular-nums opacity-50"
                        >⌘{i + 1}</span
                    >
                    <span
                        class={modelState.currentModel === model
                            ? "text-content-secondary/90"
                            : ""}
                    >
                        {MODELS[model].displayName}
                    </span>
                </button>
            {/each}
        </div>
    </div>
</form>
