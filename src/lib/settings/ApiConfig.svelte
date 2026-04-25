<script lang="ts">
    import InplaceEdit from "$lib/shared/InplaceEdit.svelte";
    import { getApiKey, setApiKey } from "./model_config";

    // 仅用于展示，持久化由 onchange 驱动（不再用 $effect 做初始化冗余写入）
    let deepseekApiKey = $state(getApiKey("deepseek"));
    let bianxieApiKey = $state(getApiKey("bianxie"));
    let aliyunApiKey = $state(getApiKey("aliyun"));
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex min-w-0 flex-col gap-5">
    <div class="min-w-0">
        <p class="text-lg font-bold text-base-content">API 配置</p>
        <div class="divider my-2"></div>
    </div>

    <div class="min-w-0">
        <p class="mb-1.5 text-sm font-medium text-base-content">便携 API Key</p>
        <div
            onclick={(e) => e.stopPropagation()}
            class="overflow-clip rounded-xl bg-base-300 p-2.5"
        >
            <InplaceEdit
                bind:value={bianxieApiKey}
                onchange={(v) => setApiKey("bianxie", v)}
            />
        </div>
    </div>

    <div class="min-w-0">
        <p class="mb-1.5 text-sm font-medium text-base-content">阿里云 API Key</p>
        <div
            onclick={(e) => e.stopPropagation()}
            class="overflow-clip rounded-xl bg-base-300 p-2.5"
        >
            <InplaceEdit
                bind:value={aliyunApiKey}
                onchange={(v) => setApiKey("aliyun", v)}
            />
        </div>
    </div>

    <div class="min-w-0">
        <p class="mb-1.5 text-sm font-medium text-base-content">DeepSeek API Key</p>
        <div
            onclick={(e) => e.stopPropagation()}
            class="overflow-clip rounded-xl bg-base-300 p-2.5"
        >
            <InplaceEdit
                bind:value={deepseekApiKey}
                onchange={(v) => setApiKey("deepseek", v)}
            />
        </div>
    </div>
</div>
