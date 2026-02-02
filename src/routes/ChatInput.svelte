<script lang="ts">
    import { tick } from "svelte";
    import { MODELS } from "./model_config";
    import type { QandA } from "./ChatStore.svelte";
    const KEY_LAST_MODEL = "last_used_model";

    let { onSendMessage, onEscape } = $props<{
        onSendMessage: (model: string, message: string, lastQA?: QandA) => void;
        onEscape?: () => void;
    }>();

    let question = $state("");
    let textarea: HTMLTextAreaElement;
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
        if (question.trim()) {
            onSendMessage(model, question, lastQA);
            question = "";
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

    export function setQuestion(text: string, qa?: QandA) {
        question = text;
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
            <textarea
                bind:this={textarea}
                id="chat-input"
                placeholder="⌘+k 输入消息..."
                bind:value={question}
                class="p-2 resize-none w-full rounded-xl border border-gray-200 flex-grow focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all touch-manipulation"
                rows="1"
                maxlength="10000"
                onkeydown={handleKeyDown}
                oninput={resizeTextarea}
            ></textarea>
            <button
                type="button"
                class="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:active:scale-100 touch-manipulation"
                onclick={() => handleSendMessage(lastModel)}
                disabled={!question.trim()}
            >
                <span class="iconify simple-line-icons--plus text-lg"></span>
            </button>
        </div>
        <div
            class="flex items-center gap-2 mt-3 text-xs text-gray-500 overflow-x-auto hide-scrollbar pb-1"
        >
            {#each availableModels as model, i}
                <button
                    type="button"
                    class="px-2 py-2 rounded transition-colors duration-150 whitespace-nowrap touch-manipulation {lastModel ===
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

<style>
    .hide-scrollbar {
        overflow: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
</style>
