export const lightboxState = $state({
    imageUrl: null as string | null,
});

export function openLightbox(url: string) {
    lightboxState.imageUrl = url;
}

export function closeLightbox() {
    lightboxState.imageUrl = null;
}
