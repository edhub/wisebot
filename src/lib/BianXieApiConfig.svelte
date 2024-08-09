<script lang="ts">
  import { getContext } from "svelte";
  import InplaceEdit from "./InplaceEdit.svelte";
  import bianXieApi from "./query_bian_xie";
  import { LLM_BIAN_XIE, llmSetting } from "./query_chooser";

  const toast: { show: (msg: string) => void } = getContext("toast");

  let apiKey = $state(bianXieApi.getApiKey());
  let chosenModel = llmSetting.currentLLm === LLM_BIAN_XIE ? bianXieApi.getModel() : "";
  const lastModel = chosenModel;

  let availableModels = [
    "gpt-4o-mini",
    "claude-3-haiku-20240307",
    "gemini-1.5-pro-exp-0801",
    "gpt-4o-2024-08-06",
    "gpt-4o-all",
    "claude-3-5-sonnet-20240620",
    // "gemini-pro",
  ];

  $effect(() => {
    return () => {
      bianXieApi.setApiKey(apiKey);
      bianXieApi.setModel(chosenModel);

      if (chosenModel !== lastModel) {
        llmSetting.currentLLm = LLM_BIAN_XIE;
        toast.show("已选 便携API: " + chosenModel);
      }
    };
  });
</script>

<div class="flex flex-row items-baseline">
  <p class="text-lg font-bold">便携API</p>
</div>
<hr class="my-2" />
<div class="flex flex-row items-baseline">
  <p>选择模型</p>
</div>
<div class="mt-1">
  {#each availableModels as model (model)}
    <div class="flex items-center">
      <input type="radio" id={model} name="modelBianXie" value={model} bind:group={chosenModel} />
      <label for={model} class="ml-1 w-full py-1 px-2 hover:bg-gray-300 rounded">{model}</label>
    </div>
  {/each}
</div>

<p class="mt-2 mb-1">API KEY</p>
<div onclick={(e) => e.stopPropagation()} class="rounded bg-gray-200 p-2 overflow-clip">
  <InplaceEdit bind:value={apiKey} />
</div>
