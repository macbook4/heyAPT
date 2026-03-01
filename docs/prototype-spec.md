# heyAPT Web Map Spec

## Scope
- App type: Next.js web app (App Router)
- Screens:
  - Home map page (`/`)
- Device targets: PC + mobile(WebView style)

## Map Integration
- If `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` exists:
  - load Naver Maps SDK (`ncpKeyId`) and render map
- If not:
  - render fallback UI with setup guidance message

## Files
- `apps/web/app/page.tsx`
- `apps/web/src/components/NaverMapView.tsx`
- `apps/web/src/lib/naverMapSdk.ts`
