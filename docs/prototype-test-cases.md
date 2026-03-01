# Web Map Test Cases

## Functional
1. `/` loads `NaverMapView` and renders loading state first.
2. SDK load success creates `naver.maps.Map` with expected center/zoom.

## Responsive
1. Desktop: map container fills viewport area under top header.
2. Mobile: map container remains visible and non-clipped.

## Map Mode
1. Without `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`, fallback message is shown.
2. With `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`, SDK script URL includes `ncpKeyId`.
3. SDK script load error path shows fallback UI and logs error.
