<script lang="ts">
  import "../app.css";
  import Toast from "./Toast.svelte";
  import { setContext } from "svelte";

  let { children } = $props();

  let toast: Toast;
  setContext("toast", {
    show: (message: string) => {
      toast.showToast(message);
    },
  });
</script>

<Toast bind:this={toast} />

{@render children()}