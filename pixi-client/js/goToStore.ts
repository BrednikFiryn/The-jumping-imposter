import build from "../../build.json";
import { tryMolocoOpenStore } from "./moloco";

type BuildJson = {
  googlePlayUrl?: string;
  appStoreUrl?: string;
};

function detectPlatform(): "android" | "ios" | "other" {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod"))
    return "ios";
  return "other";
}

function getStoreUrl(): string {
  const cfg = build as BuildJson;
  const platform = detectPlatform();

  const gp = cfg.googlePlayUrl ?? "";
  const ios = cfg.appStoreUrl ?? "";

  if (platform === "android" && gp) return gp;
  if (platform === "ios" && ios) return ios;

  return gp || ios || "https://www.google.com";
}

export function goToStore() {
  const url = getStoreUrl();

  const opened = tryMolocoOpenStore(url);
  if (opened) return;

  try {
    const win = window.open(url, "_blank");
    if (!win) {
      window.location.href = url;
    }
  } catch (e) {
    console.warn("Fallback window.open failed:", e);
    window.location.href = url;
  }
}
