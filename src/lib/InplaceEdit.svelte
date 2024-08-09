<script lang="ts">
  let { value = $bindable("") }: { value: string } = $props();

  let editing = $state(false);
  let tempValue = $state(value);

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && event.keyCode === 13) {
      value = tempValue;
      editing = false;
    } else if (event.key === "Escape") {
      editing = false;
    }
  }
  function handleBlur() {
    value = tempValue;
    editing = false;
  }
</script>

{#if editing}
  <!-- svelte-ignore a11y_autofocus -->
  <input
    type="text"
    bind:value={tempValue}
    onkeydown={handleKeydown}
    onblur={handleBlur}
    autofocus
  />
{:else}
  <p
    class="whitespace-nowrap overflow-hidden text-ellipsis"
    onclick={(e) => {
      editing = true;
      tempValue = value;
    }}
  >
    {value.length > 0 ? value : "Click to edit"}
  </p>
{/if}
