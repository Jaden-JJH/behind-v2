# 신고 시스템 구현 계획서

## 📋 프로젝트 개요

정보통신망법 및 개인정보보호법 준수를 위한 불법/유해 콘텐츠 신고 시스템 구축

## 🎯 구현 목표

- 신고 대상: 이슈 게시물, Poll 투표, 댓글
- 신고 사유: 7가지 정해진 옵션 (욕설/비방/혐오, 허위사실, 명예훼손, 개인정보노출, 음란물, 광고/스팸, 기타)
- 중복 신고 방지 (1인 1회)
- 3회 신고 누적 시 관리자에게 이메일 발송
- 관리자 검토 후 블라인드 처리

---

## ✅ 완료된 작업

### 1. 데이터베이스 스키마 설계 (완료)
**파일**: `supabase/migrations/20260111000000_create_content_reports.sql`

**생성된 테이블**:
- `content_reports`: 신고 내역 저장
  - Primary Key: id (UUID)
  - 콘텐츠 정보: content_type (issue/poll/comment), content_id
  - 신고자 정보: reporter_id, reporter_nick, reporter_ip
  - 신고 사유: reason, reason_detail
  - 처리 상태: status (pending/approved/rejected)
  - 검토 정보: reviewed_at, reviewed_by, review_note
  - Unique Constraint: (reporter_id, content_type, content_id)

**기존 테이블에 추가된 컬럼**:
- issues, polls, comments 테이블에 각각:
  - is_blinded: 블라인드 처리 여부
  - blinded_at: 블라인드 처리 시간
  - blinded_by: 블라인드 처리자
  - report_count: 신고 누적 횟수

**RLS 정책**:
- 사용자는 자신의 신고 내역만 조회 가능
- 로그인한 사용자는 신고 생성 가능
- 서비스 롤은 모든 신고 관리 가능

**Trigger**:
- `increment_content_report_count()`: 신고 생성 시 자동으로 해당 콘텐츠의 report_count 증가

---

### 2. 이메일 서비스 설정 (완료)
**패키지**: `resend` 설치 완료

**파일**: `lib/email.ts`

**함수**:
- `sendReportNotificationToAdmin()`: 3회 누적 신고 시 관리자에게 이메일 발송
  - HTML 이메일 템플릿 포함
  - 신고 내역, 콘텐츠 정보, 신고 횟수 등 포함
  - 관리자 대시보드 링크 제공

**환경변수**:
- `RESEND_API_KEY`: Resend API 키 (필요)
- `ADMIN_EMAIL`: 관리자 이메일 주소 (kr.behind@gmail.com)

---

### 3. 신고 API Routes (완료)
**파일**: `app/api/content-reports/route.ts`

**엔드포인트**:

#### POST /api/content-reports
- 콘텐츠 신고 생성
- 로그인 필수
- CSRF 보호
- 중복 신고 체크
- 입력 검증 (contentType, contentId, reason, reasonDetail)
- XSS 방어 (reasonDetail sanitization)
- 3회 누적 시 관리자 이메일 발송

**요청 본문**:
```json
{
  "contentType": "issue" | "poll" | "comment",
  "contentId": "uuid",
  "reason": "욕설/비방/혐오 표현" | ...,
  "reasonDetail": "상세 사유 (기타 선택 시 필수, 최대 200자)"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "report": {...},
    "totalReports": 3,
    "emailSent": true
  }
}
```

#### GET /api/content-reports?contentType=issue&contentId=xxx
- 현재 사용자가 특정 콘텐츠를 이미 신고했는지 확인
- 로그인 필수

**응답**:
```json
{
  "success": true,
  "data": {
    "hasReported": true,
    "report": {...}
  }
}
```

---

### 4. 관리자 신고 관리 API Routes (완료)
**파일**: `app/api/admin/reports/route.ts`

**엔드포인트**:

#### GET /api/admin/reports?status=pending&limit=50&offset=0
- 신고 내역 조회 (관리자 전용)
- 관리자 쿠키 인증 (`admin-auth`)
- 상태별 필터링 (pending/approved/rejected/all)
- 콘텐츠 타입별 필터링
- 페이지네이션 지원
- 콘텐츠 정보 포함 (title, body, is_blinded 등)

**응답**:
```json
{
  "success": true,
  "data": {
    "reports": [...],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

#### PATCH /api/admin/reports
- 신고 처리 (승인 or 기각)
- 관리자 전용
- CSRF 보호

**요청 본문**:
```json
{
  "reportId": "uuid",
  "action": "approve" | "reject",
  "reviewNote": "검토 메모 (선택)"
}
```

**처리 로직**:
- `action: "approve"` → status를 'approved'로 변경 + 콘텐츠 블라인드 처리
- `action: "reject"` → status를 'rejected'로 변경

---

### 5. 신고 모달 컴포넌트 (완료)
**파일**: `components/ReportModal.tsx`

**기능**:
- Radix UI Dialog 사용
- Radio Group으로 신고 사유 선택 (단일 선택)
- "기타" 선택 시 Textarea 표시 (최대 200자)
- 허위 신고 경고 문구 표시
- CSRF 토큰 자동 포함
- Toast 알림 (성공/실패)
- 상태 초기화

**Props**:
```typescript
interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: 'issue' | 'poll' | 'comment';
  contentId: string;
  onReportSuccess?: () => void;
}
```

---

### 6. Issues 페이지에 신고 버튼 추가 (완료)
**파일**: `app/issues/[id]/page.tsx`

**추가된 기능**:
- Import: ReportModal, DropdownMenu, MoreVertical 아이콘
- State: reportModalOpen, reportTarget
- Handler: handleOpenReport(type, id)

**신고 버튼 위치**:
1. **이슈 제목 우측**: MoreVertical (⋮) 메뉴 → "신고하기"
2. **댓글 우측**: Flag 아이콘 버튼

**UI 변경사항**:
- 이슈 제목 영역에 Dropdown Menu 추가
- 댓글 Flag 버튼에 onClick 핸들러 추가
- ReportModal 컴포넌트 렌더링

---

## 🚧 진행 중인 작업

### 7. Poll 컴포넌트에 신고 버튼 추가
**파일**: `components/quick-vote.tsx` (확인 필요)

**작업 내용**:
- QuickVote 컴포넌트 확인
- Poll 질문 영역에 신고 버튼 추가
- 신고 모달 통합

---

## 📝 남은 작업

### 8. 관리자 신고 관리 페이지 구현
**파일**: `app/admin/reports/page.tsx` (생성 필요)

**요구사항**:
- 관리자 대시보드에서 신고 내역 조회
- 상태별 필터링 (전체/대기/승인/기각)
- 콘텐츠 타입별 필터링
- 신고 상세 정보 표시
- 승인/기각 버튼
- 페이지네이션

**컴포넌트 구조**:
```
[관리자 신고 관리 페이지]
├─ 필터 영역 (상태, 콘텐츠 타입)
├─ 신고 목록 테이블
│  ├─ 신고 ID
│  ├─ 콘텐츠 타입
│  ├─ 콘텐츠 미리보기
│  ├─ 신고 사유
│  ├─ 신고자
│  ├─ 신고 시간
│  ├─ 상태
│  └─ 액션 (승인/기각)
└─ 페이지네이션
```

---

### 9. 블라인드 처리된 콘텐츠 UI 표시
**파일**:
- `app/issues/[id]/page.tsx` (이슈 상세)
- `app/issues/page.tsx` (이슈 목록)
- `components/quick-vote.tsx` (Poll)

**요구사항**:
- is_blinded가 true인 콘텐츠 감지
- 블라인드 처리된 콘텐츠는 "이 콘텐츠는 관리자에 의해 블라인드 처리되었습니다" 표시
- 원본 내용은 숨김 처리
- 관리자는 블라인드된 콘텐츠도 볼 수 있도록 (옵션)

**UI 디자인**:
```
┌─────────────────────────────────────┐
│ ⚠️ 이 콘텐츠는 신고 누적으로       │
│    블라인드 처리되었습니다         │
│                                     │
│    사유: [신고 사유]                │
│    처리 시간: [blinded_at]          │
└─────────────────────────────────────┘
```

---

### 10. Supabase Migration 적용
**작업 내용**:
- Supabase MCP를 사용하여 migration 적용
- `supabase/migrations/20260111000000_create_content_reports.sql` 실행

**명령어** (Supabase MCP 사용):
```typescript
// mcp__supabase__apply_migration 사용
```

**검증**:
- 테이블 생성 확인
- RLS 정책 확인
- Trigger 동작 확인
- Index 생성 확인

---

### 11. 환경변수 설정
**파일**: `.env.local`

**추가 필요**:
```env
# Resend Email Service
RESEND_API_KEY=re_xxxxx (Resend 가입 후 발급 필요)

# Admin Email
ADMIN_EMAIL=kr.behind@gmail.com

# 기존 환경변수 (확인용)
NEXT_PUBLIC_SUPABASE_URL=https://gknekrinduypcrzholam.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 12. 테스트
**테스트 시나리오**:

1. **신고 생성 테스트**
   - [ ] 이슈 신고
   - [ ] Poll 신고
   - [ ] 댓글 신고
   - [ ] 중복 신고 방지 확인
   - [ ] 기타 선택 시 상세 사유 필수 확인
   - [ ] 최대 200자 제한 확인

2. **3회 누적 테스트**
   - [ ] 3명의 다른 사용자가 동일 콘텐츠 신고
   - [ ] 3회 누적 시 이메일 발송 확인
   - [ ] 이메일 내용 확인 (콘텐츠 정보, 신고 횟수 등)

3. **관리자 검토 테스트**
   - [ ] 관리자 대시보드에서 신고 목록 조회
   - [ ] 신고 승인 → 콘텐츠 블라인드 처리 확인
   - [ ] 신고 기각 → 콘텐츠 유지 확인
   - [ ] 이미 처리된 신고 재처리 방지 확인

4. **블라인드 처리 UI 테스트**
   - [ ] 블라인드된 이슈 표시 확인
   - [ ] 블라인드된 Poll 표시 확인
   - [ ] 블라인드된 댓글 표시 확인

5. **에러 처리 테스트**
   - [ ] 로그인 없이 신고 시도
   - [ ] 잘못된 contentType
   - [ ] 존재하지 않는 contentId
   - [ ] CSRF 토큰 누락
   - [ ] Rate Limiting (필요시 추가)

---

## 🔧 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **Form**: React Hook Form (기존)
- **Validation**: Custom validation + DOMPurify (XSS 방어)
- **Authentication**: Supabase Auth

---

## 📚 코딩 규칙 및 컨벤션

### 1. 파일 네이밍
- API Routes: `route.ts` (Next.js App Router)
- 컴포넌트: PascalCase (예: `ReportModal.tsx`)
- 유틸리티: camelCase (예: `email.ts`)
- Migration: `YYYYMMDDhhmmss_description.sql`

### 2. 변수 네이밍
- **DB 컬럼**: snake_case (예: `content_type`, `reporter_id`, `is_blinded`)
- **TypeScript**: camelCase (예: `contentType`, `reporterId`, `isBlinded`)
- **React State**: camelCase (예: `reportModalOpen`, `reportTarget`)

### 3. API 응답 형식
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

### 4. 보안 규칙
- 모든 POST/PUT/PATCH/DELETE 요청에 CSRF 토큰 필수
- 모든 사용자 입력에 XSS 방어 (DOMPurify)
- Rate Limiting (Upstash Redis)
- RLS (Row Level Security) 정책 적용
- IP 주소 기록 (법적 대응용)

### 5. 에러 처리
- API 에러는 `createErrorResponse()` 사용
- Toast 알림은 `showSuccess()`, `showError()` 사용
- Console.error로 서버 로그 기록

---

## 🗂️ 파일 구조

```
behind-v2-next/
├── supabase/
│   └── migrations/
│       └── 20260111000000_create_content_reports.sql  ✅
├── lib/
│   ├── email.ts                                       ✅
│   ├── api-error.ts                                   (기존)
│   ├── sanitize.ts                                    (기존)
│   ├── csrf-client.ts                                 (기존)
│   └── toast-utils.ts                                 (기존)
├── app/
│   ├── api/
│   │   ├── content-reports/
│   │   │   └── route.ts                               ✅
│   │   └── admin/
│   │       └── reports/
│   │           └── route.ts                           ✅
│   ├── issues/
│   │   └── [id]/
│   │       └── page.tsx                               ✅ (수정됨)
│   └── admin/
│       └── reports/
│           └── page.tsx                               ⏳ (생성 필요)
└── components/
    ├── ReportModal.tsx                                ✅
    ├── quick-vote.tsx                                 ⏳ (수정 필요)
    └── ui/
        ├── dialog.tsx                                 (기존)
        ├── radio-group.tsx                            (기존)
        ├── dropdown-menu.tsx                          (기존)
        └── textarea.tsx                               (기존)
```

---

## 📊 진행 상황

- ✅ 완료: 6/12 작업
- ⏳ 진행 중: 1/12 작업
- 📝 대기: 5/12 작업

**전체 진행률**: 50%

---

## 🔜 다음 단계

1. ✅ **Poll 컴포넌트 신고 버튼 추가** (진행 중)
2. 📝 **Supabase Migration 적용** (DB 테이블 생성)
3. 📝 **관리자 신고 관리 페이지 구현**
4. 📝 **블라인드 처리 UI 구현**
5. 📝 **환경변수 설정 가이드 작성**
6. 📝 **통합 테스트**

---

## 📞 문의 및 지원

- 관리자 이메일: kr.behind@gmail.com
- Resend 가입: https://resend.com
- Supabase 대시보드: https://gknekrinduypcrzholam.supabase.co

---

**최종 업데이트**: 2026-01-11
**작성자**: Claude (Sonnet 4.5)
**버전**: 1.0
