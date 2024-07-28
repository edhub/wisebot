<script lang="ts">
  import { getContext } from "svelte";
  import InplaceEdit from "./InplaceEdit.svelte";
  import { LLM_OLLAMA, llmSetting } from "./query_chooser";
  import ollamaApi, { LOCAL_SERVER_URL } from "./query_ollama";

  const toast: { show: (msg: string) => void } = getContext("toast");

  let chosenModel = llmSetting.currentLLm === LLM_OLLAMA ? ollamaApi.model : "";
  const lastModel = chosenModel;

  let serverUrl = $state(ollamaApi.serverUrl);
  let availableModels = $state(ollamaApi.availableModels);

  $effect(() => {
    if (serverUrl.endsWith("/")) {
      serverUrl = serverUrl.slice(0, -1);
    } else if (serverUrl.length === 0) {
      serverUrl = LOCAL_SERVER_URL;
    }
  });

  $effect(() => {
    return () => {
      ollamaApi.serverUrl = serverUrl;
      ollamaApi.model = chosenModel;
      if (chosenModel !== lastModel) {
        llmSetting.currentLLm = LLM_OLLAMA;
        toast.show("已选 Ollama: " + chosenModel);
      }
    };
  });

  async function fetchMoedls(e: Event) {
    e.stopPropagation();
    const apiListModels = serverUrl + "/api/tags";
    try {
      const resp = await (await fetch(apiListModels)).json();
      availableModels = resp.models.map((m: any) => m.model.replace(":latest", ""));

      ollamaApi.availableModels = availableModels;
      toast.show("已刷新模型列表");
    } catch (e: any) {
      toast.show("刷新失败：" + e.message);
    }
  }
</script>

<div class="flex flex-row items-baseline mt-8">
  <p class="text-lg font-bold">Ollama</p>
</div>
<hr class="my-2" />
<div class="flex flex-row items-baseline">
  <p>
    选择模型
    <button class="ml-2 p-0 text-sm text-blue-400" onclick={fetchMoedls}>刷新</button>
  </p>
</div>
<div>
  {#each availableModels as model (model)}
    <div class="flex items-baseline">
      <input type="radio" id={model} name="modelOllama" value={model} bind:group={chosenModel} />
      <label for={model} class="ml-1 w-full py-1 px-2 hover:bg-gray-300 rounded">{model}</label>
    </div>
  {/each}
</div>

<p class="mt-2 mb-1">服务器地址</p>
<div onclick={(e) => e.stopPropagation()} class="rounded bg-gray-200 p-2 overflow-clip">
  <InplaceEdit bind:value={serverUrl} />
</div>
