<script lang="ts">
    import { tick } from "svelte";
    import { fade } from "svelte/transition";
    import { query } from "./query_api";
    import ChatContainer from "./ChatContainer.svelte";
    import ChatInput from "./ChatInput.svelte";
    import Menu from "./Menu.svelte";
    import Sidebar from "./Sidebar.svelte";
    import {
        chatState,
        generateId,
        saveChatLog,
        addMessage,
        openConfirm,
        type QandA,
    } from "./ChatStore.svelte";
    import { MODELS } from "./model_config";
    import ConfirmDialog from "./ConfirmDialog.svelte";

    let showMenu = $state(false);
    let showSidebar = $state(false);
    let activeId = $state<string | null>(null);
    let chatInput: ChatInput;

    // Selection follow-up state
    let selectionInfo = $state<{
        text: string;
        x: number;
        y: number;
        qaId: string;
    } | null>(null);
    let scrollContainer = $state<HTMLDivElement | null>(null);
    let isScrolled = $state(true);
    let ignoreScroll = false;

    function handleScroll() {
        if (!scrollContainer || ignoreScroll) return;
        if (scrollContainer.scrollTop > 50) {
            isScrolled = true;
        }
        if (selectionInfo) selectionInfo = null;
    }

    async function handleSendMessage(
        model: string,
        message: string,
        lastQA?: QandA,
    ) {
        if (message.trim() === "") return;

        isScrolled = true;
        const startTime = Date.now();

        const rawQA: QandA = {
            id: generateId(),
            parentId: lastQA?.id,
            question: message,
            answer: "",
            botName: MODELS[model]?.fullName || model,
            isResponseOngoing: true,
            createTime: Date.now(),
        };

        addMessage(rawQA);

        const newQA = chatState.messages.find((m) => m.id === rawQA.id);
        if (!newQA) return;

        await tick();

        // Scroll to the new message
        const el = document.getElementById(`qa-${newQA.id}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        const deltaReader = query(model, message, lastQA);
        let isFirstResponse = true;
        let buffer = "";
        let lastUpdateTime = Date.now();

        try {
            for await (const delta of deltaReader) {
                if (isFirstResponse) {
                    newQA.firstResponseTime = Date.now() - startTime;
                    isFirstResponse = false;
                }
                buffer += delta;
                const now = Date.now();
                if (now - lastUpdateTime >= 1000) {
                    newQA.answer += buffer;
                    buffer = "";
                    lastUpdateTime = now;
                }
            }
            if (buffer.length > 0) {
                newQA.answer += buffer;
            }
        } catch (e: any) {
            console.error(`[handleSendMessage] Error:`, e);
            newQA.answer += `\n\n[连接异常: ${e.message || "未知错误"}]`;
        } finally {
            if (newQA.answer.length === 0) {
                newQA.firstResponseTime = Date.now() - startTime;
                newQA.answer = "模型没有返回任何内容。";
            }
            newQA.completionTime = Date.now() - startTime;
            newQA.isResponseOngoing = false;
            saveChatLog();
        }
    }

    function clearNonFavoriteChats() {
        openConfirm("清除非收藏", "确定要清除非收藏的所有对话吗？", () => {
            chatState.messages = chatState.messages.filter((qa) => qa.favorite);
            saveChatLog();
        });
    }

    function handleResendMessage(message: string) {
        expandInput(message);
    }

    function handleFollowUp(qa: QandA) {
        expandInput("", qa);
    }

    function expandInput(text?: string, qa?: QandA) {
        ignoreScroll = true;
        isScrolled = false;

        if (scrollContainer) {
            // 立即锁定滚动以切断移动端的惯性
            scrollContainer.style.overflow = "hidden";
            setTimeout(() => {
                if (scrollContainer) scrollContainer.style.overflow = "auto";
                // 500ms 内屏蔽滚动回调，防止剩余惯性将输入框再次"压"回去
                setTimeout(() => {
                    ignoreScroll = false;
                }, 500);
            }, 10);
        } else {
            ignoreScroll = false;
        }
        // 使用 tick 确保在 DOM 状态切换后执行聚焦
        tick().then(() => {
            if (text !== undefined || qa !== undefined) {
                chatInput?.setQuestion(text ?? "", qa);
            }
            const el = document.getElementById("chat-input");
            if (el) {
                el.focus();
                // 某些移动浏览器需要手动 click 或再次 focus 来唤起键盘
                (el as HTMLTextAreaElement).click();
            }
        });
    }

    $effect(() => {
        if (!scrollContainer) return;

        let isDestroyed = false;
        const observer = new IntersectionObserver(
            (entries) => {
                if (isDestroyed) return;
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top,
                    );

                if (visible.length > 0) {
                    activeId = visible[0].target.id.replace("qa-", "");
                }
            },
            {
                root: scrollContainer,
                threshold: 0,
                rootMargin: "-10% 0px -80% 0px",
            },
        );

        const refresh = () => {
            if (isDestroyed || !scrollContainer) return;
            observer.disconnect();
            scrollContainer.querySelectorAll(".qa-item").forEach((el) => {
                observer.observe(el);
            });
        };

        // 当消息列表结构变化时重新同步观察目标。
        // Svelte 5 会自动追踪 chatState.chatLog 的依赖。
        chatState.chatLog;
        tick().then(refresh);

        return () => {
            isDestroyed = true;
            observer.disconnect();
        };
    });

    let mouseUpTimeout: number | undefined;

    function handleMouseUp(e: MouseEvent) {
        if (mouseUpTimeout) clearTimeout(mouseUpTimeout);
        // Small delay to ensure selection state is updated
        mouseUpTimeout = window.setTimeout(() => {
            const selection = window.getSelection();
            if (
                !selection ||
                selection.isCollapsed ||
                !selection.toString().trim()
            ) {
                if (!(e.target as HTMLElement).closest(".selection-btn")) {
                    selectionInfo = null;
                }
                return;
            }

            const selectedText = selection.toString().trim();
            let node: Node | null = selection.anchorNode;
            let qaId = "";

            while (node) {
                if (node instanceof HTMLElement && node.id?.startsWith("qa-")) {
                    qaId = node.id.replace("qa-", "");
                    break;
                }
                node = node.parentNode;
            }

            if (qaId) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                selectionInfo = {
                    text: selectedText,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                    qaId,
                };
            } else {
                selectionInfo = null;
            }
        }, 0);
    }

    function handleSelectionFollowUp() {
        if (!selectionInfo) return;
        const qa = chatState.messages.find((m) => m.id === selectionInfo?.qaId);
        if (qa) {
            const text = selectionInfo.text;
            handleFollowUp(qa);
            tick().then(() => {
                chatInput?.setQuestion(`关于"${text}"：\n`, qa);
            });
        }
        selectionInfo = null;
        window.getSelection()?.removeAllRanges();
    }

    $effect(() => {
        const quickInputListener = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                expandInput();
            }
        };
        window.addEventListener("keydown", quickInputListener);
        return () => {
            window.removeEventListener("keydown", quickInputListener);
            if (mouseUpTimeout) clearTimeout(mouseUpTimeout);
        };
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="flex h-screen w-full overflow-hidden bg-white text-gray-900 relative"
    onmouseup={handleMouseUp}
>
    <!-- 左侧：问答历史列表 -->
    <aside
        class="fixed inset-y-0 left-0 z-[70] w-3/4 max-w-[300px] bg-white shadow-2xl border-r border-gray-100/50 transition-transform duration-300 md:relative md:shadow-none md:translate-x-0 md:w-1/4 md:min-w-[280px] md:max-w-[380px]"
        class:-translate-x-full={!showSidebar}
    >
        <Sidebar
            bind:showMenu
            {activeId}
            onSelect={() => (showSidebar = false)}
        />
    </aside>

    <!-- Mobile Overlay -->
    {#if showSidebar}
        <div
            class="fixed inset-0 bg-black/20 z-[60] md:hidden"
            onclick={() => (showSidebar = false)}
            transition:fade={{ duration: 200 }}
        ></div>
    {/if}

    <!-- Mobile Header Toggle (Fixed to avoid stacking context issues) -->
    {#if !showSidebar}
        <div
            class="md:hidden fixed bottom-6 left-4 z-[65] flex gap-2"
            transition:fade={{ duration: 200 }}
        >
            <button
                type="button"
                onclick={() => (showSidebar = true)}
                class="w-10 h-10 bg-white/90 backdrop-blur border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-lg active:scale-95 transition-all touch-manipulation"
                title="展开历史记录"
            >
                <span class="iconify simple-line-icons--menu"></span>
            </button>
            <button
                type="button"
                onclick={() => (showMenu = true)}
                class="w-10 h-10 bg-white/90 backdrop-blur border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 shadow-lg active:scale-95 transition-all touch-manipulation"
                title="系统设置"
            >
                <span class="iconify simple-line-icons--settings"></span>
            </button>
        </div>
    {/if}

    <!-- 右侧：问答详情 -->
    <main class="flex-1 flex flex-col relative min-w-0 h-full bg-white">
        <!-- 展开时的输入框覆盖层 -->
        {#if !isScrolled}
            <div
                class="fixed inset-0 z-[80] flex items-start justify-center pt-12 md:pt-20 px-4 md:px-6 bg-gray-900/5 backdrop-blur-[2px]"
                transition:fade={{ duration: 200 }}
                onclick={() => (isScrolled = true)}
            >
                <div
                    class="w-full max-w-4xl"
                    onclick={(e) => e.stopPropagation()}
                >
                    <div
                        class="bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-gray-400/20 overflow-hidden"
                    >
                        <ChatInput
                            bind:this={chatInput}
                            onSendMessage={handleSendMessage}
                            onEscape={() => (isScrolled = true)}
                        />
                    </div>
                    <div class="flex justify-between items-center px-2 mt-3">
                        <p class="text-xs text-gray-500/80">
                            开启新问题或点击"追问"建立跟贴分支。
                        </p>
                        <p class="text-xs text-gray-500/80 font-medium">
                            ESC 收起
                        </p>
                    </div>
                </div>
            </div>
        {/if}

        <!-- 消息详情滚动区 -->
        <div
            bind:this={scrollContainer}
            onscroll={handleScroll}
            class="flex-1 overflow-y-auto scroll-smooth scrollbar-thin pt-6"
        >
            <div class="max-w-4xl mx-auto w-full px-4 md:px-2 pb-8">
                <ChatContainer
                    resendMessage={handleResendMessage}
                    onFollowUp={handleFollowUp}
                />
            </div>
        </div>

        <!-- Floating Selection Follow-up Button -->
        {#if selectionInfo}
            <div
                class="fixed z-[75] -translate-x-1/2 -translate-y-full pb-2 pointer-events-auto selection-btn"
                style="left: {selectionInfo.x}px; top: {selectionInfo.y}px;"
                transition:fade={{ duration: 150 }}
            >
                <button
                    onclick={handleSelectionFollowUp}
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-full shadow-xl hover:bg-blue-600 transition-colors whitespace-nowrap active:scale-95"
                >
                    <span class="iconify simple-line-icons--bubble text-[10px]"
                    ></span>
                    基于选中文字追问
                </button>
            </div>
        {/if}

        <!-- 缩小后的浮动按钮 (移动到右下角) -->
        {#if isScrolled}
            <div
                class="fixed bottom-8 right-8 z-[65]"
                transition:fade={{ duration: 200 }}
            >
                <button
                    onclick={expandInput}
                    class="group flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl shadow-blue-200 transition-all active:scale-95 touch-manipulation"
                    title="提出新问题"
                >
                    <span class="iconify simple-line-icons--plus text-xl"
                    ></span>
                </button>
            </div>
        {/if}
    </main>
</div>

<Menu bind:showMenu clearChat={clearNonFavoriteChats} />
<ConfirmDialog />
