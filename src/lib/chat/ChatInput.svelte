<script lang="ts">
    import { tick, onMount } from "svelte";
    import {
        MODELS,
        getCurrentModel,
        setCurrentModel,
    } from "$lib/settings/model_config";
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

    // 统一使用 model_config 中的 getCurrentModel/setCurrentModel，
    // 不再维护独立的 KEY_LAST_MODEL，避免两套 localStorage key 不同步
    let lastModel = $state(getCurrentModel());

    function saveLastModel(model: string) {
        lastModel = model;
        setCurrentModel(model);
    }

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
        saveLastModel(model);
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
            handleSendMessage(lastModel);
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
                    saveLastModel(selectedModel);
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
<form class="flex flex-col">
    <div class="px-2 pb-2">
        {#if imageBase64}
            <div class="relative inline-block mt-4 group">
                <img
                    src={imageBase64}
                    alt="Preview"
                    class="max-h-32 rounded-lg border border-gray-200"
                />
                <button
                    type="button"
                    class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onclick={() => (imageBase64 = undefined)}
                >
                    ✕
                </button>
            </div>
        {/if}
        {#if lastQA}
            <div
                class="flex items-center justify-between px-2 mt-2 text-sm text-gray-600"
            >
                <div class="max-h-16 overflow-y-hidden flex-1">
                    {formatLastQA(lastQA)}
                </div>
                <button
                    type="button"
                    class="ml-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 touch-manipulation"
                    onclick={() => (lastQA = undefined)}
                >
                    ✕
                </button>
            </div>
        {/if}
        <div class="relative flex items-end gap-2 mt-2">
            <div class="relative flex-grow">
                <textarea
                    bind:this={textarea}
                    id="chat-input"
                    placeholder="输入消息或粘贴图片..."
                    bind:value={question}
                    class="p-2 pr-10 resize-none overflow-hidden w-full rounded-xl border border-gray-200 focus:outline-none transition-all touch-manipulation"
                    rows="1"
                    maxlength="10000"
                    onkeydown={handleKeyDown}
                    oninput={resizeTextarea}
                    onpaste={handlePaste}
                ></textarea>
                <button
                    type="button"
                    class="absolute right-2 bottom-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                class="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:active:scale-100 touch-manipulation"
                onclick={() => handleSendMessage(lastModel)}
                disabled={!question.trim() && !imageBase64}
            >
                <span class="iconify simple-line-icons--plus text-lg"></span>
            </button>
        </div>
        <div
            class="flex items-center gap-2 mt-3 text-xs text-gray-500 overflow-x-auto scrollbar-none pb-1"
        >
            {#each availableModels as model, i}
                <button
                    type="button"
                    class="px-2 py-2 rounded-xl transition-colors duration-200 whitespace-nowrap touch-manipulation {lastModel ===
                    model
                        ? 'bg-gray-200 font-bold'
                        : 'bg-gray-100 hover:bg-gray-200'}"
                    onclick={() => handleSendMessage(model)}
                >
                    ⌘{i + 1}
                    {MODELS[model].displayName}
                </button>
            {/each}
        </div>
    </div>
</form>
