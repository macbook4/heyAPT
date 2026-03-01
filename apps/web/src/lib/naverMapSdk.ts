import * as logger from "@/lib/logger";

const NAVER_MAP_SCRIPT_ID = "naver-map-sdk";

/**
 * Returns the official Naver Maps JS SDK URL for a given key.
 */
export function buildNaverMapScriptUrl(clientId: string): string {
  const encodedClientId = encodeURIComponent(clientId);
  return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodedClientId}`;
}

/**
 * Resolves true when Naver Maps SDK is already available on window.
 */
export function hasLoadedNaverMapSdk(): boolean {
  return Boolean(window.naver?.maps?.Map && window.naver?.maps?.LatLng);
}

/**
 * Loads the Naver Maps SDK once and reuses the same script element.
 */
export async function loadNaverMapSdk(clientId: string): Promise<void> {
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is required.");
  }

  if (hasLoadedNaverMapSdk()) {
    return;
  }

  const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    await waitForExistingScript(existingScript);
    return;
  }

  const script = document.createElement("script");
  script.id = NAVER_MAP_SCRIPT_ID;
  script.src = buildNaverMapScriptUrl(clientId);
  script.async = true;

  const loadPromise = new Promise<void>((resolve, reject) => {
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load Naver Maps SDK script.")),
      { once: true },
    );
  });

  document.head.appendChild(script);
  await loadPromise;

  if (!hasLoadedNaverMapSdk()) {
    logger.error("Naver Maps SDK script loaded but global object is missing.");
    throw new Error("Naver Maps SDK global object not found.");
  }
}

/**
 * Waits for an already existing SDK script to settle.
 */
async function waitForExistingScript(script: HTMLScriptElement): Promise<void> {
  if (hasLoadedNaverMapSdk()) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Existing Naver Maps SDK script failed to load.")),
      { once: true },
    );
  });
}
