<script lang="ts">
  import InplaceEdit from "./InplaceEdit.svelte";
  import { getApiKey, setApiKey } from "./model_config";

  let bianxieApiKey = $state(getApiKey("bianxie"));
  let aliyunApiKey = $state(getApiKey("aliyun"));

  $effect(() => {
    setApiKey("bianxie", bianxieApiKey);
  });

  $effect(() => {
    setApiKey("aliyun", aliyunApiKey);
  });
</script>

<div class="flex flex-col gap-4">
  <div>
    <p class="text-lg font-bold">API 配置</p>
    <hr class="my-2" />
  </div>

  <div>
    <p class="mt-2 mb-1">便携 API Key</p>
    <div
      onclick={(e) => e.stopPropagation()}
      class="rounded bg-gray-200 p-2 overflow-clip"
    >
      <InplaceEdit bind:value={bianxieApiKey} />
    </div>
  </div>

  <div>
    <p class="mt-2 mb-1">阿里云 API Key</p>
    <div
      onclick={(e) => e.stopPropagation()}
      class="rounded bg-gray-200 p-2 overflow-clip"
    >
      <InplaceEdit bind:value={aliyunApiKey} />
    </div>
  </div>

</div>
