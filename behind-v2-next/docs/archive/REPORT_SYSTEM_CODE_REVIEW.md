# 신고 시스템 코드 리뷰 및 수정 사항

## 🔍 코드베이스 분석 결과

### 1. ErrorCode 검토

**기존 코드 (`lib/api-error.ts`)**:
- ✅ 사용 가능한 ErrorCode: `MISSING_FIELDS`, `LOGIN_REQUIRED`, `UNAUTHORIZED`, `INTERNAL_ERROR`, `INVALID_REQUEST`
- ❌ **문제 발견**: `INVALID_INPUT`이라는 ErrorCode는 존재하지 않음

**현재 작성한 코드에서 사용한 ErrorCode**:
- `app/api/content-reports/route.ts`: `INVALID_INPUT` 5회 사용 ❌
- `app/api/admin/reports/route.ts`: `INVALID_INPUT` 3회 사용 ❌

**수정 필요 사항**:
1. `INVALID_INPUT` → `INVALID_REQUEST`로 변경
2. 또는 신고 시스템 전용 ErrorCode 추가:
   - `REPORT_INVALID_TYPE`: 유효하지 않은 콘텐츠 타입
   - `REPORT_INVALID_REASON`: 유효하지 않은 신고 사유
   - `REPORT_DUPLICATE`: 이미 신고함
   - `REPORT_CREATE_FAILED`: 신고 생성 실패
   - `REPORT_NOT_FOUND`: 신고 내역 없음
   - `REPORT_ALREADY_PROCESSED`: 이미 처리된 신고

**권장 사항**: 신고 시스템 전용 ErrorCode 추가 (더 명확한 에러 메시지 제공)

---

### 2. 네이밍 컨벤션 검토

**DB 컬럼 네이밍**:
- ✅ 기존 테이블: snake_case 사용 (`user_id`, `issue_id`, `created_at`, `is_blinded`)
- ✅ 작성한 migration: snake_case 일관성 유지

**TypeScript 변수 네이밍**:
- ✅ camelCase 사용 (`contentType`, `contentId`, `reporterId`)
- ✅ React State: camelCase (`reportModalOpen`, `reportTarget`)

**API 엔드포인트 네이밍**:
- ✅ 기존: `/api/comments`, `/api/vote`, `/api/issues`
- ✅ 작성: `/api/content-reports`, `/api/admin/reports`
- ✅ kebab-case 일관성 유지

---

### 3. API 응답 형식 검토

**기존 패턴 (`lib/api-error.ts`)**:
```typescript
// 성공
{
  success: true,
  data: T,
  count?: number
}

// 실패
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**작성한 코드**:
- ✅ `createSuccessResponse()`, `createErrorResponse()` 함수 사용
- ✅ 응답 형식 일관성 유지

---

### 4. Supabase 테이블 구조 검토

**기존 테이블**:
```sql
-- issues 테이블
id, slug, title, description, preview, thumbnail, view_count,
capacity, category, status, comment_count, created_at, updated_at

-- comments 테이블
id, issue_id, user_id, user_nick, body, vote_count, created_at, updated_at

-- polls 테이블
id, issue_id, question, type, created_at

-- poll_votes 테이블
id, poll_id, option_id, user_id, device_hash, created_at
```

**작성한 migration**:
- ✅ FK 참조: `auth.users(id)` 사용 (기존 패턴과 동일)
- ✅ timestamp 타입: `TIMESTAMP` 사용 (기존과 동일)
- ✅ UUID: `gen_random_uuid()` 사용 (기존과 동일)
- ✅ Check constraint 사용 (status, content_type, reason)
- ✅ Unique constraint 사용 (중복 신고 방지)

**추가된 컬럼**:
- ✅ `is_blinded BOOLEAN DEFAULT false`
- ✅ `blinded_at TIMESTAMP`
- ✅ `blinded_by VARCHAR(100)`
- ✅ `report_count INTEGER DEFAULT 0`

---

### 5. CSRF 보호 검토

**기존 패턴**:
```typescript
// app/api/comments/route.ts
export async function POST(request: Request) {
  return withCsrfProtection(request, async (req) => {
    // 로직
  })
}
```

**작성한 코드**:
- ✅ `withCsrfProtection()` 사용 (POST, PATCH 요청)
- ✅ 기존 패턴과 일치

---

### 6. Rate Limiting 검토

**기존 패턴 (`lib/rate-limiter.ts`)**:
```typescript
export const commentLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
})

const { success, limit, remaining, reset } = await commentLimiter.limit(ip)
```

**문제 발견**: 신고 API에 Rate Limiting이 누락됨 ❌

**수정 필요 사항**:
- `lib/rate-limiter.ts`에 `reportLimiter` 추가 (예: 10 requests per 1 minute)
- `app/api/content-reports/route.ts`에 Rate Limiting 적용

---

### 7. Sanitization 검토

**기존 패턴**:
```typescript
import { sanitizeHtml } from '@/lib/sanitize'
const sanitizedBody = sanitizeHtml(commentBody)
```

**작성한 코드**:
- ✅ `reasonDetail`에 `sanitizeHtml()` 적용
- ✅ XSS 방어 패턴 일치

---

### 8. 컴포넌트 패턴 검토

**기존 Dialog 컴포넌트 사용 사례**:
- `components/nickname-modal.tsx`
- `components/login-prompt.tsx`
- `components/user-profile-drawer.tsx`

**작성한 컴포넌트 (`components/ReportModal.tsx`)**:
- ✅ Radix UI Dialog 사용 (기존과 동일)
- ✅ `'use client'` directive 사용
- ✅ Props 타입 정의 (interface)
- ✅ showSuccess, showError 사용 (기존 패턴)

---

### 9. Migration 파일 네이밍 검토

**기존 migration 파일**:
- `20251103000000_create_issue_articles.sql`
- `20251104000000_allow_null_device_hash_in_poll_votes.sql`
- `20251124000000_create_issue_follows.sql`

**작성한 migration**:
- `20260111000000_create_content_reports.sql`
- ✅ 네이밍 패턴 일치: `YYYYMMDDHHMMSS_description.sql`

---

### 10. Admin 인증 패턴 검토

**기존 패턴 (`app/api/admin/auth/route.ts`)**:
```typescript
const cookieStore = await cookies()
cookieStore.set('admin-auth', 'true', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 // 24시간
})
```

**작성한 코드 (`app/api/admin/reports/route.ts`)**:
```typescript
async function isAdmin() {
  const cookieStore = await cookies()
  return cookieStore.get('admin-auth')?.value === 'true'
}
```

- ✅ 기존 패턴과 일치

---

## 🐛 발견된 문제 및 수정 사항

### 문제 1: 존재하지 않는 ErrorCode 사용
**파일**:
- `app/api/content-reports/route.ts`
- `app/api/admin/reports/route.ts`

**문제**: `ErrorCode.INVALID_INPUT` 사용 (존재하지 않음)

**해결 방법**:
1. `lib/api-error.ts`에 신고 관련 ErrorCode 추가
2. API 파일에서 적절한 ErrorCode로 변경

---

### 문제 2: Rate Limiting 누락
**파일**: `app/api/content-reports/route.ts`

**문제**: POST 요청에 Rate Limiting이 적용되지 않음

**해결 방법**:
1. `lib/rate-limiter.ts`에 `reportLimiter` 추가
2. `app/api/content-reports/route.ts`의 POST 핸들러에 Rate Limiting 적용

---

### 문제 3: Poll 컴포넌트 확인 필요
**파일**: `components/quick-vote.tsx`

**상태**: 아직 확인하지 않음

**작업**: Poll 컴포넌트에 신고 버튼 추가 필요

---

### 문제 4: 블라인드 처리 UI 미구현
**파일**:
- `app/issues/[id]/page.tsx`
- `app/issues/page.tsx`
- `components/quick-vote.tsx`

**문제**: `is_blinded`가 true인 콘텐츠에 대한 UI 처리 없음

**해결 방법**: 블라인드된 콘텐츠는 내용을 가리고 경고 메시지 표시

---

## ✅ 수정 체크리스트

- [ ] `lib/api-error.ts`에 신고 관련 ErrorCode 추가
- [ ] `app/api/content-reports/route.ts`에서 ErrorCode 수정
- [ ] `app/api/admin/reports/route.ts`에서 ErrorCode 수정
- [ ] `lib/rate-limiter.ts`에 `reportLimiter` 추가
- [ ] `app/api/content-reports/route.ts`에 Rate Limiting 적용
- [ ] `components/quick-vote.tsx` 확인 및 신고 버튼 추가
- [ ] 블라인드 처리 UI 구현
- [ ] Supabase Migration 적용
- [ ] 환경변수 설정 가이드 작성
- [ ] 통합 테스트

---

## 📊 코드 품질 평가

| 항목 | 상태 | 비고 |
|------|------|------|
| 네이밍 컨벤션 | ✅ 양호 | snake_case (DB), camelCase (TS) 일관성 유지 |
| API 응답 형식 | ✅ 양호 | 기존 패턴 준수 |
| CSRF 보호 | ✅ 양호 | withCsrfProtection 사용 |
| XSS 방어 | ✅ 양호 | sanitizeHtml 사용 |
| Rate Limiting | ❌ 미흡 | 신고 API에 Rate Limiting 누락 |
| ErrorCode | ❌ 오류 | INVALID_INPUT 존재하지 않음 |
| Migration | ✅ 양호 | 기존 패턴 준수, RLS/Trigger 포함 |
| 컴포넌트 | ✅ 양호 | 기존 패턴 준수 |

**전체 평가**: 7/8 항목 양호, 2개 수정 필요

---

**작성일**: 2026-01-11
**검토자**: Claude (Sonnet 4.5)
