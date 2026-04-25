<script lang="ts">
    import { tick, onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { query } from "$lib/chat/query_api";
    import ChatContainer from "$lib/chat/ChatContainer.svelte";
    import ChatInput from "$lib/chat/ChatInput.svelte";
    import Lightbox from "$lib/chat/Lightbox.svelte";
    import Menu from "$lib/settings/Menu.svelte";
    import Sidebar from "$lib/sidebar/Sidebar.svelte";
    import {
        chatState,
        getChatLog,
        generateId,
        saveChatLog,
        addMessage,
        initChatStore,
        type QandA,
    } from "$lib/chat/ChatStore.svelte";
    import { openConfirm } from "$lib/shared/confirm.svelte";
    import { MODELS } from "$lib/settings/model_config";
    import { setCurrentModel } from "$lib/settings/modelState.svelte";
    import ConfirmDialog from "$lib/shared/ConfirmDialog.svelte";

    let showMenu = $state(false);
    let showSidebar = $state(false);
    let activeId = $state<string | null>(null);
    let chatInput = $state<ChatInput>();

    // 选中文字追问状态
    let selectionInfo = $state<{
        text: string;
        x: number;
        y: number;
        qaId: string;
    } | null>(null);
    let scrollContainer = $state<HTMLDivElement | null>(null);

    // 输入框展开/收起状态（替代原来含义不清晰的 isScrolled）
    let isInputExpanded = $state(false);
    let ignoreScroll = false;

    // 用 onMount 做一次性初始化，语义比 $effect 更清晰
    onMount(() => {
        initChatStore();
    });

    function handleScroll() {
        if (!scrollContainer || ignoreScroll) return;
        if (scrollContainer.scrollTop > 50) {
            isInputExpanded = false; // 滚动时自动收起输入框
        }
        if (selectionInfo) selectionInfo = null;
    }

    async function handleSendMessage(
        model: string,
        message: string,
        lastQA?: QandA,
        image?: string,
        imageUrl?: string,
    ) {
        if (message.trim() === "" && !imageUrl) return;

        isInputExpanded = false; // 发送后收起输入框，让用户看到响应
        const startTime = Date.now();

        const rawQA: QandA = {
            id: generateId(),
            parentId: lastQA?.id,
            question: message,
            answer: "",
            botName: MODELS[model]?.fullName || model,
            isResponseOngoing: true,
            image: image,
            imageUrl: imageUrl,
            createTime: Date.now(),
        };

        addMessage(rawQA);

        const newQA = chatState.messages.find((m) => m.id === rawQA.id);
        if (!newQA) return;

        await tick();

        const el = document.getElementById(`qa-${newQA.id}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        const deltaReader = query(
            model,
            message,
            lastQA,
            MODELS[model]?.defaultTemperature ?? 0.7,
            imageUrl,
        );
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
        } catch (e: unknown) {
            console.error(`[handleSendMessage] Error:`, e);
            const err = e as Error;
            newQA.answer += `\n\n[连接异常: ${err.message || "未知错误"}]`;
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

    function handleResendMessage(qa: QandA) {
        const parentQA = qa.parentId
            ? chatState.messages.find((m) => m.id === qa.parentId)
            : undefined;
        expandInput(qa.question, parentQA, qa.imageUrl || qa.image);
    }

    function handleFollowUp(qa: QandA) {
        expandInput("", qa);
    }

    function expandInput(text?: string, qa?: QandA, image?: string) {
        ignoreScroll = true;
        isInputExpanded = true;

        if (scrollContainer) {
            scrollContainer.style.overflow = "hidden";
            setTimeout(() => {
                if (scrollContainer) scrollContainer.style.overflow = "auto";
                setTimeout(() => {
                    ignoreScroll = false;
                }, 500);
            }, 10);
        } else {
            ignoreScroll = false;
        }

        tick().then(() => {
            if (text !== undefined || qa !== undefined || image !== undefined) {
                chatInput?.setQuestion(text ?? "", qa, image);
            }
            const el = document.getElementById("chat-input");
            if (el) {
                el.focus();
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

        // 读取 _chatLog 以将其纳入当前 $effect 的依赖追踪，
        // 消息列表变化时自动重新注册 IntersectionObserver，返回值无需使用。
        getChatLog();
        tick().then(refresh);

        return () => {
            isDestroyed = true;
            observer.disconnect();
        };
    });

    let mouseUpTimeout: number | undefined;

    function handleMouseUp(e: MouseEvent) {
        if (mouseUpTimeout) clearTimeout(mouseUpTimeout);
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
            // ⌘K：全局展开输入框
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                expandInput();
                return;
            }
            // ⌘1-N：全局切换模型（不发送）
            // 当输入框已展开且 textarea 聚焦时，由 ChatInput 内部的 onkeydown 优先处理
            if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
                const num = parseInt(e.key);
                const models = Object.keys(MODELS);
                if (num >= 1 && num <= models.length) {
                    // 仅当输入框未展开（textarea 未聚焦）时，全局监听器切换模型
                    const focused = document.activeElement;
                    const isTextareaFocused =
                        focused instanceof HTMLTextAreaElement ||
                        focused instanceof HTMLInputElement;
                    if (!isTextareaFocused) {
                        e.preventDefault();
                        setCurrentModel(models[num - 1]);
                    }
                }
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
    class="flex h-screen w-full overflow-hidden bg-base-100 text-base-content relative"
    onmouseup={handleMouseUp}
>
    <!-- 左侧：问答历史列表 -->
    <aside
        class="fixed inset-y-0 left-0 z-[70] w-3/4 max-w-[300px] border-r border-base-200/80 bg-transparent shadow-2xl transition-transform duration-300 md:relative md:w-1/4 md:min-w-[280px] md:max-w-[380px] md:translate-x-0 md:shadow-none"
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
            class="fixed inset-0 bg-[rgba(0,0,0,0.2)] z-[60] md:hidden"
            onclick={() => (showSidebar = false)}
            transition:fade={{ duration: 200 }}
        ></div>
    {/if}

    <!-- 移动端悬浮按钮 -->
    {#if !showSidebar}
        <div
            class="fixed bottom-6 left-4 z-[65] flex items-center gap-2 md:hidden"
            transition:fade={{ duration: 200 }}
        >
            <button
                type="button"
                onclick={() => (showSidebar = true)}
                class="btn btn-ghost btn-square w-10 h-10 min-h-0 border border-base-200/80 bg-base-100/85 text-content-secondary shadow-lg backdrop-blur-md transition-transform duration-200 hover:border-primary/25 hover:shadow-md active:scale-95"
                title="展开历史记录"
            >
                <span class="iconify simple-line-icons--menu"></span>
            </button>
            <button
                type="button"
                onclick={() => (showMenu = true)}
                class="btn btn-ghost btn-square w-10 h-10 min-h-0 border border-base-200/80 bg-base-100/85 text-content-muted shadow-lg backdrop-blur-md transition-transform duration-200 hover:border-primary/20 hover:shadow-md active:scale-95"
                title="系统设置"
            >
                <span class="iconify simple-line-icons--settings"></span>
            </button>
        </div>
    {/if}

    <!-- 右侧：问答详情（极浅竖向渐变，与侧栏/白底输入卡形成层次） -->
    <main
        class="flex-1 flex flex-col relative min-w-0 h-full min-h-0 bg-gradient-to-b from-base-200/25 via-base-100 to-base-100"
    >
        <!-- 展开时的输入框覆盖层 -->
        {#if isInputExpanded}
            <div
                class="fixed inset-0 z-[80] flex items-start justify-center bg-base-content/5 px-4 pt-12 backdrop-blur-[2px] sm:px-6 md:pt-20"
                transition:fade={{ duration: 200 }}
                onclick={() => (isInputExpanded = false)}
            >
                <div
                    class="w-full max-w-4xl"
                    onclick={(e) => e.stopPropagation()}
                >
                    <div
                        class="card overflow-hidden rounded-2xl border border-base-200/90 bg-base-100/95 shadow-2xl shadow-primary/[0.07] ring-1 ring-base-200/50 backdrop-blur-sm"
                    >
                        <ChatInput
                            bind:this={chatInput}
                            onSendMessage={handleSendMessage}
                            onEscape={() => (isInputExpanded = false)}
                        />
                    </div>
                    <div
                        class="mt-3 flex items-start justify-between gap-4 px-4 text-xs text-content-placeholder"
                    >
                        <p class="min-w-0 flex-1 leading-relaxed">
                            开启新问题或点击"追问"建立跟贴分支。
                        </p>
                        <p
                            class="shrink-0 text-right font-medium tabular-nums tracking-tight"
                        >
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
            class="flex-1 min-h-0 scroll-smooth overflow-y-auto pt-4 scrollbar-thin sm:pt-5"
        >
            <div class="mx-auto w-full max-w-4xl px-4 pb-32 sm:px-6">
                <ChatContainer
                    resendMessage={(qa) => handleResendMessage(qa)}
                    onFollowUp={handleFollowUp}
                />
            </div>
        </div>

        <!-- 选中文字追问浮动按钮 -->
        {#if selectionInfo}
            <div
                class="fixed z-[75] -translate-x-1/2 -translate-y-full pb-2 pointer-events-auto selection-btn"
                style="left: {selectionInfo.x}px; top: {selectionInfo.y}px;"
                transition:fade={{ duration: 150 }}
            >
                <button
                    onclick={handleSelectionFollowUp}
                    class="btn btn-primary btn-sm gap-1.5 rounded-full border-0 text-xs min-h-0 h-auto py-1.5 px-3 normal-case font-medium shadow-lg shadow-primary/30 transition-transform duration-200 hover:brightness-110 active:scale-95"
                >
                    <span class="iconify simple-line-icons--bubble text-[10px]"
                    ></span>
                    基于选中文字追问
                </button>
            </div>
        {/if}

        <!-- 收起状态下的新建问题浮动按钮 -->
        {#if !isInputExpanded}
            <div
                class="fixed bottom-6 right-4 z-[65] sm:bottom-8 sm:right-6"
                transition:fade={{ duration: 200 }}
            >
                <button
                    onclick={() => expandInput()}
                    class="btn btn-primary btn-circle w-12 h-12 min-h-0 touch-manipulation border-0 shadow-xl shadow-primary/30 ring-4 ring-base-100 transition-transform duration-200 hover:scale-105 hover:shadow-primary/40 active:scale-95"
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
<Lightbox />
