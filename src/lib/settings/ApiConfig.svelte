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
<div class="flex flex-col gap-4">
    <div>
        <p class="text-lg font-bold">API 配置</p>
        <hr class="my-2" />
    </div>

    <div>
        <p class="mt-2 mb-1">便携 API Key</p>
        <div
            onclick={(e) => e.stopPropagation()}
            class="rounded-xl bg-gray-200 p-2 overflow-clip"
        >
            <InplaceEdit
                bind:value={bianxieApiKey}
                onchange={(v) => setApiKey("bianxie", v)}
            />
        </div>
    </div>

    <div>
        <p class="mt-2 mb-1">阿里云 API Key</p>
        <div
            onclick={(e) => e.stopPropagation()}
            class="rounded-xl bg-gray-200 p-2 overflow-clip"
        >
            <InplaceEdit
                bind:value={aliyunApiKey}
                onchange={(v) => setApiKey("aliyun", v)}
            />
        </div>
    </div>

    <div>
        <p class="mt-2 mb-1">DeepSeek API Key</p>
        <div
            onclick={(e) => e.stopPropagation()}
            class="rounded-xl bg-gray-200 p-2 overflow-clip"
        >
            <InplaceEdit
                bind:value={deepseekApiKey}
                onchange={(v) => setApiKey("deepseek", v)}
            />
        </div>
    </div>
</div>
