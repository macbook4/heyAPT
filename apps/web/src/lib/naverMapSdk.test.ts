import { beforeEach, describe, expect, it } from "vitest";
import {
  buildNaverMapScriptUrl,
  hasLoadedNaverMapSdk,
  loadNaverMapSdk,
} from "@/lib/naverMapSdk";

/**
 * Creates a fake naver maps global object.
 */
function setNaverGlobal(): void {
  window.naver = {
    maps: {
      Map: class FakeMap {},
      LatLng: class FakeLatLng {},
    },
  };
}

describe("naverMapSdk", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    delete window.naver;
  });

  it("builds sdk script url with encoded client id", () => {
    const url = buildNaverMapScriptUrl("my key");
    expect(url).toContain("ncpKeyId=my%20key");
  });

  it("detects loaded sdk from global object", () => {
    expect(hasLoadedNaverMapSdk()).toBe(false);
    setNaverGlobal();
    expect(hasLoadedNaverMapSdk()).toBe(true);
  });

  it("loads sdk script and resolves when script load event fires", async () => {
    const pending = loadNaverMapSdk("abc123");
    const script = document.getElementById("naver-map-sdk");
    expect(script).not.toBeNull();

    setNaverGlobal();
    script?.dispatchEvent(new Event("load"));
    await expect(pending).resolves.toBeUndefined();
  });
});
