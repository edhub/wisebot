<script lang="ts">
    let {
        value = $bindable(""),
        onchange,
    }: {
        value: string;
        onchange?: (v: string) => void;
    } = $props();

    let editing = $state(false);
    let tempValue = $state(value);

    function commit() {
        value = tempValue;
        editing = false;
        onchange?.(tempValue);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            commit();
        } else if (event.key === "Escape") {
            // 取消编辑，不触发 onchange
            editing = false;
        }
    }

    function handleBlur() {
        commit();
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
        class="input input-ghost input-sm w-full min-h-0 h-7 px-0 text-sm"
    />
{:else}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        role="button"
        tabindex="0"
        class="whitespace-nowrap overflow-hidden text-ellipsis text-sm text-content-secondary transition-colors cursor-pointer hover:text-primary"
        onclick={() => {
            editing = true;
            tempValue = value;
        }}
        onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                editing = true;
                tempValue = value;
            }
        }}
    >
        {value.length > 0 ? value : "点击编辑"}
    </div>
{/if}
