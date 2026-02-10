export type MolocoFbPlayableAd = {
  onCTAClick?: () => void;
};

export function isMoloco(): boolean {
  return /moloco/i.test(navigator.userAgent);
}

export type Mraid = {
  open?: (url: string) => void;
};

declare global {
  interface Window {
    FbPlayableAd?: MolocoFbPlayableAd;
    mraid?: Mraid;
    Moloco?: { open?: (url: string) => void; click?: () => void };
  }
}

export function installMolocoDevStub() {
  if (import.meta.env.DEV) {
    if (!window.FbPlayableAd) {
      window.FbPlayableAd = {
        onCTAClick: () => console.log("[DEV] FbPlayableAd.onCTAClick()"),
      };
    }
    if (!window.mraid) {
      window.mraid = {
        open: (url: string) => console.log("[DEV] mraid.open:", url),
      };
    }
  }
}

export function tryMolocoOpenStore(url: string): boolean {
  try {
    if (window.FbPlayableAd?.onCTAClick) {
      window.FbPlayableAd.onCTAClick();
      return true;
    }
    if (window.mraid?.open) {
      console.log("[Moloco] mraid.open called");
      window.mraid.open(url);
      return true;
    }
    if (window.Moloco?.click) {
      console.log("[Moloco] Moloco.click called");
      window.Moloco.click();
      return true;
    }
    if (window.Moloco?.open) {
      window.Moloco.open(url);
      return true;
    }
  } catch (e) {
    console.warn("tryMolocoOpenStore error:", e);
  }
  return false;
}
