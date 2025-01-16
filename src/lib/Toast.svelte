<script lang="ts">
  import { fade } from "svelte/transition";

  interface Cursor {
    x: number;
    y: number;
  }

  interface ToastMessage {
    value: string;
    position: string;
  }

  let messageQueue: ToastMessage[] = [];

  let cursor = $state<Cursor>({ x: 0, y: 0 });

  function calculatePosition() {
    const windowWidth = window.innerWidth;
    let toastX = Math.max(30, cursor.x + 20);
    let toastY = Math.max(30, cursor.y);

    const alignRight = windowWidth - cursor.x < 300;
    toastX = alignRight ? windowWidth - cursor.x + 20 : toastX;

    const positionStyle = `${alignRight ? "right" : "left"}: ${toastX}px; top: ${toastY}px`;
    return positionStyle;
  }

  export function showToast(msg: string) {
    messageQueue.push({ value: msg, position: calculatePosition() });
    showToastMessages();
  }

  let currentToast = $state<ToastMessage>();

  $effect(() => {
    const trackMouse = (event: MouseEvent) => {
      cursor = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener("mousemove", trackMouse);

    return () => window.removeEventListener("mousemove", trackMouse);
  });

  let isToasting = false;
  async function showToastMessages() {
    if (isToasting) return;
    let nextToast = messageQueue.shift();

    while (nextToast) {
      isToasting = true;
      currentToast = nextToast;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      currentToast = undefined;
      await new Promise((resolve) => setTimeout(resolve, 150));
      isToasting = false;
      if (messageQueue.length > 0) {
        nextToast = messageQueue.shift();
      } else {
        break;
      }
    }
  }
</script>

{#if currentToast}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed p-2 bg-cyan-400 text-sm rounded shadow-lg z-50"
    style={currentToast?.position}
  >
    {currentToast?.value}
  </div>
{/if}
