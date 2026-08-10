type PageOverlaySnapshot = {
  isSupportedPage: boolean;
  pageUrl: string;
  siteOverlayVisible: boolean;
};

export function selectShouldRenderOverlayControl(pageOverlay: PageOverlaySnapshot): boolean {
  return pageOverlay.isSupportedPage || pageOverlay.siteOverlayVisible;
}
