<script lang="ts">
    import { tick } from "svelte";
    import { MODELS } from "./model_config";
    import type { QandA } from "./ChatStore.svelte";
    const KEY_LAST_MODEL = "last_used_model";

    let { onSendMessage, onEscape } = $props<{
        onSendMessage: (
            model: string,
            message: string,
            lastQA?: QandA,
            image?: string,
        ) => void;
        onEscape?: () => void;
    }>();

    let question = $state("");
    let imageBase64 = $state<string | undefined>(undefined);
    let textarea: HTMLTextAreaElement;
    let fileInput: HTMLInputElement;
    let lastQA = $state<QandA | undefined>(undefined);

    const availableModels = Object.keys(MODELS);
    let lastModel = $state(
        localStorage.getItem(KEY_LAST_MODEL) || availableModels[0],
    );

    function saveLastModel(model: string) {
        lastModel = model;
        localStorage.setItem(KEY_LAST_MODEL, model);
    }

    async function resizeTextarea() {
        await tick();
        textarea.style.height = "auto";
        let maxHeight = window.innerHeight * 0.5;
        let desiredHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = desiredHeight + "px";
    }

    function handleSendMessage(model: string) {
        saveLastModel(model);
        if (question.trim() || imageBase64) {
            onSendMessage(model, question, lastQA, imageBase64);
            question = "";
            imageBase64 = undefined;
            lastQA = undefined;
            resizeTextarea();
            textarea.blur();
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        // 处理 Esc 收起输入框
        if (e.key === "Escape") {
            e.preventDefault();
            onEscape?.();
            return;
        }

        // 处理 Enter 发送消息
        if (e.key === "Enter" && e.keyCode === 13 && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(lastModel);
            return;
        }

        // 处理 CMD+数字 选择模型
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
                if (file) {
                    processFile(file);
                }
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

    $effect(() => {
        // 添加全局快捷键监听
        const globalShortcutListener = (e: KeyboardEvent) => {
            if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= availableModels.length) {
                    e.preventDefault();
                    saveLastModel(availableModels[num - 1]);
                }
            }
        };

        window.addEventListener("keydown", globalShortcutListener);
        return () =>
            window.removeEventListener("keydown", globalShortcutListener);
    });

    export function setQuestion(text: string, qa?: QandA, image?: string) {
        question = text;
        imageBase64 = image;
        textarea.focus();
        resizeTextarea();
        lastQA = qa;
    }

    function formatLastQA(qa?: QandA) {
        if (!qa) return "";
        if (qa.answer.length > 100) {
            return qa.answer.substring(0, 100) + "...";
        }
        return qa.answer;
    }

    function clearLastQA() {
        lastQA = undefined;
    }
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<form class="flex flex-col">
    <div class="px-2 pb-2">
        {#if imageBase64}
            <div class="relative inline-block mb-2 group">
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
                class="flex items-center justify-between px-2 text-sm text-gray-600"
            >
                <div class="max-h-16 overflow-y-hidden flex-1">
                    {formatLastQA(lastQA)}
                </div>
                <button
                    type="button"
                    class="ml-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 touch-manipulation"
                    onclick={() => clearLastQA()}
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
                    class="p-2 pr-10 resize-none w-full rounded-xl border border-gray-200 focus:outline-none transition-all touch-manipulation"
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
                    onclick={() => {
                        handleSendMessage(model);
                    }}
                >
                    ⌘{i + 1}
                    {MODELS[model].displayName}
                </button>
            {/each}
        </div>
    </div>
</form>
