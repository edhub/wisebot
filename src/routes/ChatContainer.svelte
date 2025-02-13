<script lang="ts">
  import { tick } from "svelte";
  import Message from "./Message.svelte";
  import MessageFolded from "./MessageFolded.svelte";
  import {
    chatState,
    deleteQA,
    toggleFavorite,
    toggleFold,
    type QandA,
  } from "./ChatStore.svelte";

  let { resendMessage, onFollowUp} = $props<{
    resendMessage: (msg: string) => void;
    onFollowUp: (qa: QandA) => void;
  }>();

  let chatContainer: HTMLDivElement;
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
    integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn"
    crossorigin="anonymous"
  />
</svelte:head>

<div bind:this={chatContainer} class="flex flex-col overflow-y-auto pb-32">
  {#each chatState.chatLog as qa (qa.id)}
    {#if qa.folded}
      <MessageFolded
        qandA={qa}
        deleteMsg={deleteQA}
        {toggleFavorite}
        {toggleFold}
      />
    {:else}
      <Message
        qandA={qa}
        onResendMessage={resendMessage}
        {deleteQA}
        {toggleFavorite}
        {toggleFold}
        {onFollowUp}
      />
    {/if}
  {/each}
</div>
