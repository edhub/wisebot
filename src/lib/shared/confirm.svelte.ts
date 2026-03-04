export const confirmState = $state({
  show: false,
  title: "",
  message: "",
  onConfirm: () => {},
});

export function openConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
) {
  confirmState.title = title;
  confirmState.message = message;
  confirmState.onConfirm = () => {
    onConfirm();
    confirmState.show = false;
  };
  confirmState.show = true;
}
