# Content Moderation Dashboard 구현 계획

**작성일**: 2026-01-12
**목적**: 신고 시스템 관리자 대시보드 UI 구현
**파일 경로**: `app/admin/content-reports/page.tsx`

---

## 1. 파일 경로 결정

### 문제점
- 기존 `/admin/reports`는 "제보 관리" (reported_issues 테이블) 용도로 사용 중
- content_reports 관리 대시보드는 별도 경로 필요

### 선택한 경로
```
app/admin/content-reports/page.tsx
```

**사유**:
1. 기존 패턴과 일관성 유지 (`/admin/issues`, `/admin/reports`)
2. content_reports 테이블명과 명확한 대응
3. "콘텐츠 신고 관리"와 "제보 관리"의 명확한 구분

---

## 2. 데이터베이스 스키마 분석

### content_reports 테이블 구조
```sql
CREATE TABLE content_reports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Information
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('issue', 'poll', 'comment')),
  content_id UUID NOT NULL,

  -- Reporter Information
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_nick VARCHAR(50) NOT NULL,
  reporter_ip VARCHAR(45),

  -- Report Details
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    '욕설/비방/혐오 표현',
    '허위사실 유포',
    '명예훼손/모욕',
    '개인정보 노출',
    '음란물/불건전 콘텐츠',
    '광고/스팸',
    '기타'
  )),
  reason_detail TEXT,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100),
  review_note TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraint
  CONSTRAINT unique_user_content_report UNIQUE (reporter_id, content_type, content_id)
);
```

### 관련 테이블 컬럼
- **issues**: is_blinded, blinded_at, blinded_by, report_count
- **polls**: is_blinded, blinded_at, blinded_by, report_count
- **comments**: is_blinded, blinded_at, blinded_by, report_count

---

## 3. 기존 API 분석

### GET /api/admin/reports
**Query Parameters**:
- `status`: 'pending' | 'approved' | 'rejected' (옵션)
- `contentType`: 'issue' | 'poll' | 'comment' (옵션)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response**:
```typescript
{
  data: Array<{
    id: string
    content_type: 'issue' | 'poll' | 'comment'
    content_id: string
    reporter_id: string | null
    reporter_nick: string
    reporter_ip: string | null
    reason: string
    reason_detail: string | null
    status: 'pending' | 'approved' | 'rejected'
    reviewed_at: string | null
    reviewed_by: string | null
    review_note: string | null
    created_at: string
    // JOIN 결과
    content_title?: string // issue/poll title
    content_body?: string // comment body
    content_preview?: string // issue preview
  }>
  meta: {
    total: number
    page: number
    limit: number
  }
}
```

### PATCH /api/admin/reports
**Body**:
```typescript
{
  reportId: string
  action: 'approve' | 'reject'
  reviewNote?: string
}
```

**기능**:
- `approve`: 신고 승인 + 콘텐츠 블라인드 처리
- `reject`: 신고 거부

---

## 4. 기존 Admin 페이지 패턴

### 공통 패턴 (app/admin/issues/page.tsx 기준)
1. **인증 체크**
   ```typescript
   useEffect(() => {
     fetch('/api/admin/check')
       .then(res => {
         if (!res.ok) router.push('/admin/login')
       })
   }, [router])
   ```

2. **필터링**
   - Select 컴포넌트 사용
   - useEffect로 필터 변경 시 자동 재조회
   - "전체" 옵션 제공

3. **테이블**
   - shadcn/ui Table 컴포넌트
   - 뱃지로 상태 표시
   - 액션 버튼 (수정, 삭제 등)

4. **모달**
   - Dialog 컴포넌트
   - 수정/삭제 등 액션용
   - csrfFetch 사용

5. **토스트**
   - showSuccess, showError 사용

6. **로딩 상태**
   - loading state
   - 조건부 렌더링

---

## 5. UI 컴포넌트 설계

### 5.1 페이지 레이아웃
```
┌─────────────────────────────────────────────┐
│ 제목: 콘텐츠 신고 관리                        │
├─────────────────────────────────────────────┤
│ [필터 영역]                                  │
│  상태: [pending/approved/rejected/전체]      │
│  콘텐츠 유형: [issue/poll/comment/전체]      │
│  [초기화]                                    │
├─────────────────────────────────────────────┤
│ [신고 목록 테이블]                           │
│  ID | 콘텐츠 | 신고자 | 사유 | 상태 | 액션   │
├─────────────────────────────────────────────┤
│ [페이지네이션]                               │
└─────────────────────────────────────────────┘
```

### 5.2 테이블 컬럼
| 컬럼명 | 데이터 | 설명 |
|--------|--------|------|
| 신고 ID | `id.slice(0, 8)` | 축약 UUID |
| 콘텐츠 유형 | content_type 뱃지 | issue/poll/comment |
| 콘텐츠 제목/내용 | content_title or content_body | 최대 50자 |
| 신고자 | reporter_nick | 닉네임 |
| 신고 사유 | reason | 전체 사유 텍스트 |
| 상태 | status 뱃지 | pending/approved/rejected |
| 신고일 | created_at | 날짜 포맷팅 |
| 액션 | 버튼 | 상세보기 |

### 5.3 상세 모달
```
┌─────────────────────────────────────────────┐
│ 신고 상세                                    │
├─────────────────────────────────────────────┤
│ 신고 ID: xxx-xxx-xxx                         │
│ 신고일시: 2026-01-12 14:30:00                │
│ 상태: [pending 뱃지]                         │
│                                             │
│ === 신고된 콘텐츠 ===                         │
│ 유형: 이슈                                   │
│ 제목/내용: [전체 텍스트]                      │
│                                             │
│ === 신고자 정보 ===                          │
│ 닉네임: user123                              │
│ IP: 192.168.1.1                             │
│                                             │
│ === 신고 사유 ===                            │
│ 사유: 욕설/비방/혐오 표현                     │
│ 상세: [reason_detail]                        │
│                                             │
│ === 관리자 검토 (pending일 때만) ===         │
│ 검토 메모: [Textarea]                        │
│                                             │
│ [승인 (블라인드 처리)] [거부] [취소]          │
│                                             │
│ === 검토 완료 정보 (approved/rejected) ===   │
│ 검토일시: 2026-01-12 15:00:00                │
│ 검토자: admin                                │
│ 검토 메모: [내용]                            │
└─────────────────────────────────────────────┘
```

---

## 6. 상태 관리 (useState)

```typescript
// 목록 상태
const [reports, setReports] = useState<Report[]>([])
const [loading, setLoading] = useState(true)

// 페이지네이션
const [currentPage, setCurrentPage] = useState(1)
const [totalPages, setTotalPages] = useState(1)
const [totalCount, setTotalCount] = useState(0)
const ITEMS_PER_PAGE = 20

// 필터
const [filterStatus, setFilterStatus] = useState<string>('') // '' | 'pending' | 'approved' | 'rejected'
const [filterContentType, setFilterContentType] = useState<string>('') // '' | 'issue' | 'poll' | 'comment'

// 모달
const [detailModalOpen, setDetailModalOpen] = useState(false)
const [selectedReport, setSelectedReport] = useState<Report | null>(null)

// 리뷰 폼
const [reviewNote, setReviewNote] = useState('')
const [submitting, setSubmitting] = useState(false)
```

---

## 7. 타입 정의

```typescript
interface Report {
  id: string
  content_type: 'issue' | 'poll' | 'comment'
  content_id: string
  reporter_id: string | null
  reporter_nick: string
  reporter_ip: string | null
  reason: string
  reason_detail: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  review_note: string | null
  created_at: string
  // JOIN 결과
  content_title?: string
  content_body?: string
  content_preview?: string
}

const STATUS_LABELS = {
  pending: '대기',
  approved: '승인',
  rejected: '거부'
} as const

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-800'
} as const

const CONTENT_TYPE_LABELS = {
  issue: '이슈',
  poll: '투표',
  comment: '댓글'
} as const

const CONTENT_TYPE_COLORS = {
  issue: 'bg-blue-100 text-blue-800',
  poll: 'bg-purple-100 text-purple-800',
  comment: 'bg-indigo-100 text-indigo-800'
} as const
```

---

## 8. 주요 함수

### 8.1 loadReports()
```typescript
async function loadReports() {
  try {
    setLoading(true)

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(ITEMS_PER_PAGE)
    })

    if (filterStatus) params.append('status', filterStatus)
    if (filterContentType) params.append('contentType', filterContentType)

    const response = await fetch(`/api/admin/reports?${params.toString()}`)
    const data = await response.json()

    if (!response.ok) {
      showError(data)
      return
    }

    setReports(data.data || [])
    setTotalCount(data.meta.total)
    setTotalPages(Math.ceil(data.meta.total / ITEMS_PER_PAGE))
  } catch (error) {
    showError(error)
  } finally {
    setLoading(false)
  }
}
```

### 8.2 openDetailModal()
```typescript
function openDetailModal(report: Report) {
  setSelectedReport(report)
  setReviewNote(report.review_note || '')
  setDetailModalOpen(true)
}
```

### 8.3 handleReview()
```typescript
async function handleReview(action: 'approve' | 'reject') {
  if (!selectedReport) return

  // pending 상태만 처리 가능
  if (selectedReport.status !== 'pending') {
    showError('이미 처리된 신고입니다')
    return
  }

  try {
    setSubmitting(true)

    const response = await csrfFetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId: selectedReport.id,
        action,
        reviewNote: reviewNote.trim() || undefined
      })
    })

    const data = await response.json()

    if (!response.ok) {
      showError(data)
      return
    }

    showSuccess(action === 'approve'
      ? '신고가 승인되었습니다 (콘텐츠 블라인드 처리됨)'
      : '신고가 거부되었습니다'
    )

    setDetailModalOpen(false)
    loadReports()
  } catch (error) {
    showError(error)
  } finally {
    setSubmitting(false)
  }
}
```

---

## 9. 렌더링 헬퍼

### 9.1 renderStatusBadge()
```typescript
function renderStatusBadge(status: Report['status']) {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
```

### 9.2 renderContentTypeBadge()
```typescript
function renderContentTypeBadge(contentType: Report['content_type']) {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${CONTENT_TYPE_COLORS[contentType]}`}>
      {CONTENT_TYPE_LABELS[contentType]}
    </span>
  )
}
```

### 9.3 getContentText()
```typescript
function getContentText(report: Report): string {
  if (report.content_type === 'comment') {
    return report.content_body || '(내용 없음)'
  }
  return report.content_title || report.content_preview || '(제목 없음)'
}
```

### 9.4 formatDate()
```typescript
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

---

## 10. Navigation 메뉴 추가

### app/admin/layout.tsx 수정
```tsx
{/* 기존: 제보 관리 */}
<Link
  href="/admin/reports"
  className={...}
>
  <span className="mr-3">📢</span>
  <span>제보 관리</span>
  {pendingCount > 0 && (
    <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full">
      {pendingCount}
    </span>
  )}
</Link>

{/* 새로 추가: 콘텐츠 신고 관리 */}
<Link
  href="/admin/content-reports"
  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
    isActive('/admin/content-reports')
      ? 'bg-indigo-600 text-white'
      : contentReportsPendingCount > 0
        ? 'bg-red-600 text-white'
        : 'text-gray-300 hover:bg-gray-700'
  }`}
>
  <div className="flex items-center">
    <span className="mr-3">🚨</span>
    <span>콘텐츠 신고</span>
  </div>
  {contentReportsPendingCount > 0 && (
    <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full">
      {contentReportsPendingCount}
    </span>
  )}
</Link>
```

### pending 카운트 API 추가 필요
```typescript
// app/api/admin/content-reports/pending-count/route.ts
export async function GET() {
  const { count } = await supabaseAdmin
    .from('content_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return NextResponse.json({ count: count || 0 })
}
```

---

## 11. 구현 단계

### Step 1: API 준비
- [x] GET /api/admin/reports (이미 구현됨)
- [x] PATCH /api/admin/reports (이미 구현됨)
- [ ] GET /api/admin/content-reports/pending-count

### Step 2: 페이지 파일 생성
- [ ] app/admin/content-reports/page.tsx 생성
- [ ] 인증 체크 구현
- [ ] 기본 레이아웃 구현

### Step 3: 목록 기능 구현
- [ ] loadReports() 함수
- [ ] 테이블 렌더링
- [ ] 필터링 UI
- [ ] 페이지네이션

### Step 4: 상세 모달 구현
- [ ] 모달 UI
- [ ] 신고 정보 표시
- [ ] 검토 폼 (pending일 때)
- [ ] handleReview() 함수

### Step 5: Navigation 통합
- [ ] layout.tsx 메뉴 추가
- [ ] pending count fetching
- [ ] 모바일 메뉴에도 추가

### Step 6: 테스트
- [ ] 필터링 동작 확인
- [ ] 신고 승인/거부 확인
- [ ] 블라인드 처리 확인
- [ ] 페이지네이션 확인
- [ ] 반응형 확인

---

## 12. 주의사항

### 보안
- ✅ admin 인증 체크 필수
- ✅ csrfFetch 사용
- ✅ API는 service role로 RLS 우회

### UX
- ✅ pending만 승인/거부 가능
- ✅ 승인 시 "블라인드 처리됨" 명시
- ✅ 검토 완료된 신고는 readonly 표시
- ✅ IP 주소는 관리자만 볼 수 있음 (법적 대응용)

### 성능
- ✅ 페이지네이션 (20개씩)
- ✅ 인덱스 활용 (status, content_type, created_at)
- ✅ JOIN은 필요한 정보만

### 기존 패턴 준수
- ✅ shadcn/ui 컴포넌트 사용
- ✅ toast-utils 사용
- ✅ csrfFetch 사용
- ✅ 동일한 디자인 시스템
- ✅ 동일한 코딩 스타일

---

## 13. 예상 코드 크기
- **Lines**: ~800 줄 (app/admin/issues/page.tsx와 유사)
- **Components**: 1 (main page)
- **Modals**: 1 (detail modal)
- **API**: 1 추가 (pending-count)
- **Layout 수정**: 약 40줄 추가

---

## 14. 완료 기준
- [ ] 신고 목록 조회 가능
- [ ] 필터링 (상태, 콘텐츠 유형) 동작
- [ ] 페이지네이션 동작
- [ ] 상세 모달에서 모든 정보 확인 가능
- [ ] pending 신고 승인/거부 가능
- [ ] 승인 시 콘텐츠 블라인드 처리 확인
- [ ] Navigation 메뉴에서 pending count 표시
- [ ] 반응형 레이아웃 정상 작동
- [ ] 에러 처리 적절

---

**계획 수립 완료**
**다음 단계**: 단계별 구현 시작
