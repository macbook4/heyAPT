"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import * as logger from "@/lib/logger";
import { loadNaverMapSdk } from "@/lib/naverMapSdk";

const DEFAULT_CENTER = { lat: 37.5518, lng: 126.9132 };
const INITIAL_POIS = [
  { id: "poi-001", title: "연남 감성 하우스", lat: 37.5619, lng: 126.9227 },
  { id: "poi-002", title: "합정 모던 스튜디오", lat: 37.5494, lng: 126.9148 },
  { id: "poi-003", title: "망원 우드 인테리어", lat: 37.5562, lng: 126.9013 },
];

export type PoiSummary = {
  id: string;
  title: string;
  lat: number;
  lng: number;
};

type NaverMapViewProps = {
  onPoiSelect?: (poi: PoiSummary) => void;
};

/**
 * Renders Naver map and handles fallback when SDK is unavailable.
 */
export function NaverMapView({ onPoiSelect }: NaverMapViewProps): ReactElement {
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markersRef = useRef<NaverMapMarkerInstance[]>([]);

  const clientId = useMemo(
    /**
     * Reads map key from env once on client.
     */
    function readClientId(): string {
      return process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";
    },
    [],
  );

  useEffect(
    /**
     * Loads SDK and builds map instance on initial render.
     */
    function initializeMapEffect() {
      let cancelled = false;

      async function initializeMap(): Promise<void> {
        if (!clientId) {
          setStatus("error");
          setErrorMessage("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is empty.");
          return;
        }

        try {
          await loadNaverMapSdk(clientId);
          if (cancelled) {
            return;
          }
          const mapElement = document.getElementById("naver-map");
          if (!mapElement || !window.naver?.maps) {
            throw new Error("Map container or SDK not available.");
          }

          const mapInstance = new window.naver.maps.Map(mapElement, {
            center: new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
            zoom: 11,
          });
          mapRef.current = mapInstance;
          mountPoiMarkers(mapInstance, INITIAL_POIS);
          setStatus("ready");
          logger.info("Naver map rendered.");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown map error.";
          setStatus("error");
          setErrorMessage(message);
          logger.error("Failed to render Naver map.", { message });
        }
      }

      initializeMap();

      return function cleanup(): void {
        cancelled = true;
        clearMarkers();
      };
    },
    [clientId],
  );

  /**
   * Removes all mounted marker instances from the map.
   */
  function clearMarkers(): void {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }

  /**
   * Mounts markers for POIs and wires click event handlers.
   */
  function mountPoiMarkers(mapInstance: NaverMapInstance, pois: PoiSummary[]): void {
    const maps = window.naver?.maps;
    if (!maps) {
      return;
    }
    clearMarkers();
    markersRef.current = pois.map((poi) => {
      const marker = new maps.Marker({
        map: mapInstance,
        position: new maps.LatLng(poi.lat, poi.lng),
        title: poi.title,
      });
      maps.Event.addListener(marker, "click", () => {
        onPoiMarkerClick(poi);
      });
      return marker;
    });
  }

  /**
   * Handles POI marker click with detail fetch and analytics event.
   */
  async function onPoiMarkerClick(poi: PoiSummary): Promise<void> {
    onPoiSelect?.(poi);
    if (mapRef.current && window.naver?.maps) {
      mapRef.current.panTo(new window.naver.maps.LatLng(poi.lat, poi.lng));
    }

    const eventPayload = {
      version: "0.1.0",
      platform: "desktop",
      type: "client_event",
      data: {
        category: "map",
        action: "btnClickMarker",
        label: "poi",
        attributes: {
          poi_id: poi.id,
        },
      },
      options: {},
    };

    try {
      await Promise.allSettled([
        fetch(`/api/pois/${poi.id}`, { method: "GET" }),
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
          keepalive: true,
        }),
      ]);
      logger.info("POI marker click handled.", { poiId: poi.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("POI marker click side-effects failed.", { message, poiId: poi.id });
    }
  }

  if (status === "error") {
    return (
      <section
        className="grid h-screen w-full place-content-center gap-2 border border-dashed border-slate-300 bg-white p-5"
        aria-live="polite"
      >
        <h2 className="m-0 text-base font-semibold">Map unavailable</h2>
        <p className="m-0 text-sm text-slate-600">{errorMessage || "Naver map could not be loaded."}</p>
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-emerald-50" aria-busy={status !== "ready"}>
      {status !== "ready" ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-gradient-to-b from-slate-50 to-emerald-50 text-sm text-slate-600">
          Loading map...
        </div>
      ) : null}
      <div id="naver-map" className="h-full w-full" aria-label="Naver map canvas" />
    </section>
  );
}
