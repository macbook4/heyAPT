export {};

declare global {
  interface NaverMapInstance {
    panTo(latlng: unknown): void;
  }

  interface NaverMapMarkerInstance {
    setMap(map: NaverMapInstance | null): void;
  }

  interface Window {
    naver?: {
      maps?: {
        Map: new (
          element: string | HTMLElement,
          options: { center: unknown; zoom: number },
        ) => NaverMapInstance;
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (options: {
          map: NaverMapInstance;
          position: unknown;
          title?: string;
        }) => NaverMapMarkerInstance;
        Event: {
          addListener(
            target: NaverMapMarkerInstance,
            type: string,
            listener: () => void,
          ): unknown;
        };
      };
    };
  }
}
