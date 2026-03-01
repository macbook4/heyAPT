# Repository Guidelines

## Project: heyAPT

## Overview
감도있게 인테리어된 매물만 모아보자

## Tech Stack
- Language: TypeScript
- Framework: Next.js (Web), Capacitor (iOS/Android WebView Shell)
- Database: Supabase (PostgreSQL + Auth)
- Map: Naver Maps API (Web SDK)

## Project Structure
```text
apps/
├── web/                  # Next.js 앱 (라우팅/세션/UI)
└── mobile/               # Capacitor 네이티브 셸 (ios/android)
packages/
└── bridge-contracts/     # JS ↔ Native 브리지 타입/이벤트 계약
```

## Code Style Rules
- [ ] 커밋 메시지는 한글로 작성
- [ ] 모든 함수에 JSDoc 주석 추가
- [ ] `console.log` 대신 logger 사용
- [ ] 테스트 코드 필수 작성
- [ ] 브리지 API는 `packages/bridge-contracts`를 통해서만 추가

## Commands
- `pnpm dev:web` - 웹 개발 서버 실행
- `pnpm build:web` - 웹 프로덕션 빌드
- `pnpm test:web` - 웹 테스트 실행
- `pnpm cap:sync` - 웹 빌드 결과를 네이티브 프로젝트로 동기화
- `pnpm cap:ios` - iOS 앱 실행
- `pnpm cap:android` - Android 앱 실행

## Bridge Interface Rules
- `getPushToken(): Promise<string>`
- `getLocation(): Promise<{ lat: number; lng: number }>`
- `openCamera(): Promise<{ uri: string }>`
- `pickFile(): Promise<{ name: string; uri: string; size: number }>`
- 실패 응답은 `{ code: string; message: string }` 형식으로 통일
- 브리지 미탑재(브라우저) 환경에서는 fallback UX를 반드시 제공

## Map & POI Requirements
- 지도 렌더링은 웹(`apps/web`)에서 Naver Maps API로 처리
- 지도 마커/클러스터는 DB의 `pois` 테이블 기준으로 표시
- POI 상세 패널에는 아래 정보를 함께 노출
  - 회원 정보(등록자 프로필/연락 가능 여부)
  - 주소 정보(도로명/지번/좌표)
  - 매물 사진(대표 이미지 + 갤러리)
- POI 조회 API는 기본적으로 지도 bounds(남서/북동 좌표) 기반으로 필터링
- 이미지 URL은 저장 전 검증하고, 썸네일/원본 경로를 분리 관리

## POI Data Contract (Baseline)
- `pois.id`: string (UUID)
- `pois.owner_user_id`: string (회원 FK)
- `pois.title`: string
- `pois.address_road`: string
- `pois.address_jibun`: string
- `pois.lat`, `pois.lng`: number
- `pois.photos`: string[] (스토리지 URL 배열)
- `pois.created_at`, `pois.updated_at`: timestamp

## API Contract (POI)
- `GET /api/pois?swLat={v}&swLng={v}&neLat={v}&neLng={v}&zoom={v}`
  - 목적: 현재 지도 bounds 내 POI 목록 조회
  - 응답: `{ items: PoiSummary[], nextCursor?: string }`
- `GET /api/pois/{poiId}`
  - 목적: POI 상세(회원/주소/사진) 조회
  - 응답: `{ id, title, owner, address, photos, lat, lng, updatedAt }`
- `POST /api/pois`
  - 목적: POI 생성 (인증 필수)
  - 본문: `{ title, addressRoad, addressJibun, lat, lng, photos }`
- `PATCH /api/pois/{poiId}`
  - 목적: POI 수정 (소유자만)
- `DELETE /api/pois/{poiId}`
  - 목적: POI 삭제 (소유자 또는 관리자)

### API Error Format
- 모든 실패 응답은 아래 형식 고정
- `{ code: string; message: string; requestId?: string }`

## Auth & Session Rules
- 인증은 Supabase JWT 단일 표준 사용
- 보호 API(`POST/PATCH/DELETE`)는 `Authorization: Bearer <supabase_access_token>` 필수
- 무토큰/만료토큰 요청은 `401` 반환
- 권한 부족 요청은 `403` 반환
- 앱(WebView)과 웹 모두 동일한 세션 만료/재발급 정책 적용

## Role Matrix
- `guest` (비로그인)
  - POI 목록/상세 조회: 허용
  - 생성/수정/삭제: 금지
- `owner` (POI 작성자)
  - 본인 POI 생성/수정/삭제: 허용
  - 타인 POI 수정/삭제: 금지
- `admin` (관리자)
  - 모든 POI 수정/삭제: 허용
  - 감사 로그 조회: 허용

## Supabase RLS Policy (Baseline)
- `pois`: `SELECT` 공개 허용
- `pois`: `INSERT`는 `auth.uid() = owner_user_id`인 경우만 허용
- `pois`: `UPDATE/DELETE`는 소유자 또는 관리자만 허용
- `profiles`: 최소 공개 컬럼만 조회 허용(민감정보 비공개)
- `audit_logs`: 일반 사용자 조회 금지, 서버/관리자만 조회 허용

## Testing Checklist
- 브라우저(브리지 없음)에서도 핵심 웹 기능 동작
- iOS/Android에서 브리지 성공/실패 처리 일관성
- 로그인 세션 유지(앱 재실행/백그라운드 복귀)
- 딥링크 URL이 웹 라우트로 정확히 매핑
- 릴리즈 전 `pnpm cap:sync` 수행 여부 검증
- 지도 이동/줌 시 bounds 기반 POI 재조회 성능 확인
- POI 상세에서 회원/주소/사진 데이터 누락 케이스 검증
- 무토큰/만료토큰 요청에서 보호 API가 `401` 처리되는지 검증
- owner가 타인 POI 수정/삭제 시 `403` 처리되는지 검증
- admin 권한으로 타인 POI 수정/삭제 가능한지 검증
- RLS 정책으로 비인가 DB 변경이 차단되는지 검증
- public/private 이미지 접근 제어가 의도대로 동작하는지 검증
- POI 수정/삭제 시 감사 로그가 생성되는지 검증

## Important Notes
- 이미지 저작권/초상권 확인 필수 (매물 사진 수집·노출 전 출처 및 사용 권한 검증)
- 위치·가격 정보는 배포 전 최신화 검증 필수 (캐시 데이터와 실데이터 불일치 방지)
- 네이티브 권한(위치/카메라/파일/푸시)은 요청 사유와 거부 시 UX를 함께 구현
- 웹 배포 URL과 앱 allowlist 도메인은 항상 동기화
- Naver Maps API 키는 공개 저장소에 커밋 금지 (`.env` 및 배포 시크릿으로만 관리)

## Storage Access Policy
- 버킷 분리 운영
  - `poi-images-public`: 대표 이미지/썸네일 (읽기 공개)
  - `poi-images-private`: 원본 이미지 (서명 URL로만 접근)
- 업로드 제한
  - MIME: `image/jpeg`, `image/png`, `image/webp`
  - 용량: 파일당 최대 10MB
  - 개수: POI당 최대 20장
- 파일 경로 규칙: `poi/{poiId}/{uuid}.{ext}`

## Audit Logging Rules
- POI 생성/수정/삭제 시 서버에서 감사 로그 기록 필수
- 로그 스키마 baseline
  - `{ id, request_id, actor_user_id, action, target_type, target_id, before, after, created_at }`
- `request_id`는 API 진입 시 생성/전달하여 추적 가능하게 유지
- 감사 로그는 클라이언트가 아닌 서버 레이어에서만 기록
