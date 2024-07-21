<script lang="ts">
  import InplaceEdit from "./InplaceEdit.svelte";
  import bianXieApi from "./query_bian_xie";

  let apiKey = bianXieApi.getApiKey();
  let chosenModel = bianXieApi.getModel();

  let availableModels = ["gpt-4o-mini", "gpt-4o-all", "gpt-4o", "gpt-3.5-turbo"];

  $effect(() => {
    return () => {
      bianXieApi.setApiKey(apiKey);
      bianXieApi.setModel(chosenModel);
    };
  });
</script>

<div class="flex flex-row items-baseline">
  <p class="text-lg font-bold mb-2">选择模型</p>
</div>
<div>
  {#each availableModels as model (model)}
    <div class="flex items-center">
      <input type="radio" id={model} name="model" value={model} bind:group={chosenModel} />
      <label for={model} class="ml-1 w-full py-1 px-2 hover:bg-gray-300 rounded">{model}</label>
    </div>
  {/each}
</div>

<p class="text-lg font-bold mt-8 mb-2">API KEY</p>
<div onclick={(e) => e.stopPropagation()} class="rounded bg-gray-200 p-2 overflow-clip">
  <InplaceEdit bind:value={apiKey} />
</div>
