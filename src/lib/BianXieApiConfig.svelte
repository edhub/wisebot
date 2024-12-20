<script lang="ts">
  import { getContext } from "svelte";
  import InplaceEdit from "./InplaceEdit.svelte";
  import bianXieApi from "./query_bian_xie";

  let apiKey = $state(bianXieApi.getApiKey());

  $effect(() => {
    return () => {
      bianXieApi.setApiKey(apiKey);
    };
  });
</script>

<div class="flex flex-row items-baseline">
  <p class="text-lg font-bold">便携API</p>
</div>
<hr class="my-2" />

<p class="mt-2 mb-1">API KEY</p>
<div
  onclick={(e) => e.stopPropagation()}
  class="rounded bg-gray-200 p-2 overflow-clip"
>
  <InplaceEdit bind:value={apiKey} />
</div>
