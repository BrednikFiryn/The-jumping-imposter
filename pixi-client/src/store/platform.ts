export type MobilePlatform = "ios" | "android" | "other";

interface NavigatorUAData {
  platform?: string;
}

interface NavigatorWithUAData extends Navigator {
  userAgentData?: NavigatorUAData;
}

export function detectPlatform(): MobilePlatform {
  const navigatorWithUA = navigator as NavigatorWithUAData;

  const uaDataPlatform = navigatorWithUA.userAgentData?.platform?.toLowerCase();
  if (uaDataPlatform) {
    if (
      uaDataPlatform.includes("iphone") ||
      uaDataPlatform.includes("ipad") ||
      uaDataPlatform.includes("ios")
    )
      return "ios";
    if (uaDataPlatform.includes("android")) return "android";
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod"))
    return "ios";
  if (ua.includes("android")) return "android";

  return "other";
}
