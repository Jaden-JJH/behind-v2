# Behind v2 - 작업 세션 이력

---

## Session #5 - 2025-11-30

### 작업 내용
**프로덕션 버그 수정 + Phase 1 메인 노출 설정 구현**

### 구현 사항

#### 1. 프로덕션 버그 수정

**버그 1: 승인되지 않은 이슈 노출**
- **증상:** 어드민에서 approval_status='pending'인 이슈가 전체 이슈 페이지에 노출됨
- **원인:** `/app/api/issues/route.ts`에서 approval_status 필터링 누락
- **해결:** Line 41에 `.eq('approval_status', 'approved')` 추가
- **검증:** Supabase SQL 쿼리로 컬럼명(`approval_status`), 값 형식(`'approved'`, `'pending'`) 확인
- **커밋:** "fix: 승인되지 않은 이슈가 노출되는 버그 수정"

**버그 2: 투표 옵션 초기화**
- **증상:** 어드민 이슈 수정 모달 열 때마다 투표 옵션이 빈 배열로 초기화됨
- **원인:** API 응답이 `poll.poll_options` (snake_case)를 반환하는데, 코드는 `poll.options` (camelCase)를 찾음
- **디버깅 과정:**
  1. `openEditModal` 함수에 console.log 추가하여 API 응답 구조 확인
  2. `poll_options` vs `options` 불일치 발견
- **해결:** `/app/admin/issues/page.tsx` Line 208-214 수정
  ```typescript
  const pollOptions = (pollData as any).poll_options || pollData.options || []
  ```
- **커밋:** "fix: 투표 옵션 초기화 버그 수정 (poll_options snake_case 처리)"

---

#### 2. Phase 1: 메인 노출 설정 컴포넌트 구현

**사전 확인 완료**
1. Notion 문서 확인:
   - "메인 노출 기능 백엔드 연동" (2025-10-09 완료)
   - "투표 메인 노출 기능" (2025-10-10 완료)
   - 정책: `show_in_main_hot`, `show_in_main_poll` (Boolean, 기본값 false)
   - 문제점: 중복 노출 방지 필요 (체크박스 방식의 한계)

2. DB 스키마 확인:
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'issues' AND column_name LIKE '%main%';
   ```
   결과: `show_in_main_hot`, `show_in_main_poll` (boolean, default false) 확인

3. 현재 메인 노출 이슈 확인:
   - 6개 이슈가 모두 `show_in_main_hot: true` AND `show_in_main_poll: true`
   - 원래 의도: HOT 2개 슬롯, 투표 2개 슬롯 (총 4개)
   - 문제: 체크박스 방식으로 인한 중복/과다 노출

**설계**
```
┌─────────────────────────────────────────────┐
│ 📌 메인 페이지 노출 설정                      │
├─────────────────────────────────────────────┤
│ HOT 이슈 #1  [드롭다운: 투표 테스트 2]       │
│ HOT 이슈 #2  [드롭다운: 선택 안함]          │
│                                             │
│ 투표 #1      [드롭다운: 선택 안함]          │
│ 투표 #2      [드롭다운: 선택 안함]          │
│                                             │
│              [저장] 버튼                     │
└─────────────────────────────────────────────┘
```

**Step 1: UI 컴포넌트 추가** (`/app/admin/issues/page.tsx`)
- State 추가 (Line 106-111):
  ```typescript
  const [mainHotSlot1, setMainHotSlot1] = useState<string>('')
  const [mainHotSlot2, setMainHotSlot2] = useState<string>('')
  const [mainPollSlot1, setMainPollSlot1] = useState<string>('')
  const [mainPollSlot2, setMainPollSlot2] = useState<string>('')
  const [savingMainDisplay, setSavingMainDisplay] = useState(false)
  ```

- 초기 데이터 로드 함수 (Line 165-183):
  ```typescript
  async function loadMainDisplayIssues() {
    const { data: mainIssues } = await (await fetch('/api/admin/issues?approval=approved&limit=100')).json()
    const hotIssues = mainIssues.filter((issue: any) => issue.show_in_main_hot)
    const pollIssues = mainIssues.filter((issue: any) => issue.show_in_main_poll)
    setMainHotSlot1(hotIssues[0]?.id || '')
    setMainHotSlot2(hotIssues[1]?.id || '')
    setMainPollSlot1(pollIssues[0]?.id || '')
    setMainPollSlot2(pollIssues[1]?.id || '')
  }
  ```

- 저장 함수 (Line 186-216):
  ```typescript
  async function handleSaveMainDisplay() {
    setSavingMainDisplay(true)
    const response = await csrfFetch('/api/admin/issues/main-display', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotSlot1: mainHotSlot1 || null,
        hotSlot2: mainHotSlot2 || null,
        pollSlot1: mainPollSlot1 || null,
        pollSlot2: mainPollSlot2 || null
      })
    })
    if (response.ok) {
      showSuccess('메인 노출 설정이 저장되었습니다')
      loadIssues()
    }
    setSavingMainDisplay(false)
  }
  ```

- UI 컴포넌트 (Line 634-736):
  - 필터 Card 아래에 메인 노출 설정 Card 추가
  - HOT 이슈 2개 드롭다운 (승인된 이슈만)
  - 투표 2개 드롭다운 (승인된 이슈 + `issue.poll` 존재)
  - 저장 버튼

**Step 2: API 생성** (`/app/api/admin/issues/main-display/route.ts` 신규)
- 경로: `/app/api/admin/issues/main-display/route.ts`
- 메서드: PUT
- 인증: CSRF 보호 + 어드민 쿠키 검증
- 로직:
  1. 모든 이슈의 메인 노출 해제 (`show_in_main_hot: false`, `show_in_main_poll: false`)
  2. HOT 슬롯 업데이트 (`show_in_main_hot: true` for hotSlot1, hotSlot2)
  3. 투표 슬롯 업데이트 (`show_in_main_poll: true` for pollSlot1, pollSlot2)

**Step 3: 수정 모달 정리** (`/app/admin/issues/page.tsx`)
- State 제거: `editShowInMainHot`, `editShowInMainPoll` (2줄)
- `initializeForm` 함수: 메인 노출 초기화 코드 제거 (2줄)
- 수정 API 요청: `show_in_main_hot`, `show_in_main_poll` 필드 제거 (2줄)
- UI: 메인 화면 표시 체크박스 제거 (20줄)

---

#### 3. 로컬 테스트 중 버그 수정

**버그 3: SelectItem 빈 문자열 에러**
- **에러:** "A <Select.Item /> must have a value prop that is not an empty string"
- **원인:** `<SelectItem value="">선택 안함</SelectItem>` 사용
- **해결:** 4곳 모두 `<SelectItem value="">` 라인 삭제
  - HOT 이슈 #1, #2 (Line 654, 673)
  - 투표 #1, #2 (Line 695, 714)
- **동작:** state가 빈 문자열('')이면 자동으로 placeholder 표시
- **커밋:** "fix: SelectItem 빈 문자열 에러 수정"

**버그 4: 투표 드롭다운 빈 리스트**
- **증상:** 투표 #1, #2 드롭다운에 아무 이슈도 표시되지 않음
- **원인:** API 응답에 `poll` 객체가 없고, `poll_votes_count`만 있음
- **해결:** `/app/api/admin/issues/route.ts` Line 52-56 수정
  ```typescript
  // 변경 전
  .select(
    'id, display_id, title, category, approval_status, visibility, view_count, comment_count, show_in_main_hot, show_in_main_poll, created_at',
    { count: 'exact' }
  )

  // 변경 후
  .select(
    `id, display_id, title, category, approval_status, visibility, view_count, comment_count, show_in_main_hot, show_in_main_poll, created_at,
    poll:polls(
      id,
      question
    )`,
    { count: 'exact' }
  )
  ```
- **주의사항:**
  - 백틱(`) 사용 필수
  - `poll:polls(...)` 관계형 쿼리 문법
  - `{ count: 'exact' }` 옵션과 함께 사용 가능
- **서버 재시동:** 변경 후 `npm run dev` 재시작 필요

---

### 주요 패턴 및 규칙

#### 1. Supabase SELECT 쿼리 (JOIN)
```typescript
// ✅ 일반 select (백틱 + 여러 줄)
.select(`
  *,
  poll:polls(
    id,
    question,
    options:poll_options(
      id,
      label
    )
  )
`)

// ✅ count 옵션과 함께 사용
.select(
  `id, title, poll:polls(id, question)`,
  { count: 'exact' }
)

// ❌ 작은따옴표 사용 시 JOIN 불가
.select('id, title, poll:polls(id, question)')  // 작동 안함
```

#### 2. snake_case vs camelCase 처리
```typescript
// API 응답: snake_case
{
  "poll_options": [...],
  "poll_votes_count": 0
}

// 코드: 양쪽 다 체크
const pollOptions = (pollData as any).poll_options || pollData.options || []
```

#### 3. 메인 노출 설정 저장
```typescript
// 요청
{
  "hotSlot1": "issue-id-1",
  "hotSlot2": "issue-id-2",
  "pollSlot1": "poll-issue-id-1",
  "pollSlot2": "poll-issue-id-2"
}

// API 로직
1. 모든 이슈 메인 노출 해제
2. 지정된 슬롯만 show_in_main_hot/show_in_main_poll = true
```

---

### 최종 파일 목록

**Backend:**
- `app/api/issues/route.ts` - approval_status 필터 추가
- `app/api/admin/issues/route.ts` - poll 객체 추가
- `app/api/admin/issues/main-display/route.ts` - 메인 노출 설정 API (신규)

**Frontend:**
- `app/admin/issues/page.tsx` - 메인 노출 설정 UI, 수정 모달 정리

---

### Git Commits
1. "fix: 승인되지 않은 이슈가 노출되는 버그 수정"
2. "fix: 투표 옵션 초기화 버그 수정 (poll_options snake_case 처리)"
3. "feat: 메인 노출 설정 컴포넌트 추가 (HOT 2개, 투표 2개 슬롯)"
4. "feat: 메인 노출 설정 API 구현 (PUT /api/admin/issues/main-display)"
5. "refactor: 수정 모달에서 메인 노출 체크박스 제거"
6. "fix: SelectItem 빈 문자열 에러 수정"
7. "feat: 어드민 이슈 API에 poll 객체 추가"

---

### 테스트 체크리스트

#### 버그 수정
- [x] 승인되지 않은 이슈 필터링 확인
- [x] 투표 옵션 정상 로드 확인

#### 메인 노출 설정
- [x] HOT 이슈 드롭다운 (승인된 이슈만 표시)
- [x] 투표 드롭다운 (투표 있는 이슈만 표시)
- [x] 빈 문자열 선택 시 placeholder 표시
- [x] 저장 버튼 동작 확인
- [x] 중복 노출 방지 확인
- [x] 프로덕션 배포 성공

#### API 테스트
- [x] GET /api/admin/issues - poll 객체 포함 확인
- [x] PUT /api/admin/issues/main-display - 저장 동작 확인

---

### 배포

**환경:** Vercel Production (behind-beta.vercel.app)

**배포 절차:**
```bash
# develop 푸시
git push origin develop

# main 병합
git checkout main
git pull origin main
git merge develop
git push origin main

# develop 복귀
git checkout develop
```

**배포 완료:** 2025-11-30

---

### 다음 작업 권장사항

1. **실시간 인기 이슈 (선택적)**
   - 홈페이지 하드코딩 제거
   - API 연동
   - 예상 소요: 3-4시간

2. **디버깅 로그 제거**
   - `app/my/votes/page.tsx` - [DEBUG] 로그
   - `hooks/useFetchWithRetry.ts` - [FETCH] 로그

3. **최종 문서 정리**
   - HANDOVER.md 업데이트
   - SESSION_HISTORY.md 추가
   - README.md 수정
   - archive 폴더 생성

---

**작성일**: 2025-11-30  
**작성자**: Claude + Jaden  
**소요 시간**: 약 3시간  
**상태**: Phase 1 메인 노출 설정 완료, 프로덕션 배포 완료

---

## Session #4 - 2025-11-30

### 작업 내용
**Phase 3.3 - 대시보드 계정 관리 기능 구현**

### 구현 사항

#### 1. 닉네임 변경 모달
**파일:** `app/my/page.tsx`

**기능:**
- Dialog 컴포넌트 사용
- 30일 제한 안내 (빨간색 하이라이트)
- 클라이언트 유효성 검증:
  - 2~20자
  - 한글/영문/숫자만
  - 중복 체크
- 성공 시 프로필 즉시 새로고침
- 기존 API 재사용: `PUT /api/auth/update-nickname`

#### 2. 회원 탈퇴 모달 (2단계)
**파일:** `app/my/page.tsx`

**1단계 모달 (경고):**
- AlertDialog 컴포넌트 사용
- 반응형 안내문:
  - 데스크탑: 상세 안내 3줄
  - 모바일: 간결한 안내 2줄
- "30일 이내 복구 가능" 빨간색 하이라이트

**2단계 모달 (최종 확인):**
- "최종 확인" 제목 빨간색
- "되돌릴 수 없습니다" 경고
- "탈퇴" 버튼 빨간색

#### 3. 회원 탈퇴 API
**파일:** `app/api/auth/delete-account/route.ts`

**기능:**
- Soft Delete 방식
- `deleted_at` 타임스탬프 기록
- 닉네임 익명화: `탈퇴한사용자_{uuid_8자리}`
- 서버 세션 종료: `supabase.auth.signOut()`

**에러 처리:**
- 이미 탈퇴한 계정 체크
- ErrorCode 추가: `ACCOUNT_ALREADY_DELETED`, `ACCOUNT_DELETE_FAILED`

#### 4. DB 스키마 변경
**마이그레이션:** `supabase/migrations/20241130000000_add_deleted_at_to_users.sql`

**변경 사항:**
- `public.users` 테이블에 `deleted_at` 컬럼 추가
- 타입: `TIMESTAMP WITH TIME ZONE`
- 기본값: `NULL`
- 인덱스 생성: `idx_users_deleted_at`

---

### 발견된 문제들

#### 1. HTML 구조 오류 (Hydration Error)
**증상:**
- AlertDialog 사용 시 콘솔 에러 6개
- `<p>` 안에 `<p>`, `<div>`, `<ul>` 중첩 불가

**원인:**
- `AlertDialogDescription`이 내부적으로 `<p>` 태그 생성
- HTML 규칙: `<p>` 안에는 인라인 요소만 가능

**해결:**
```typescript
// ❌ 잘못된 구조
<AlertDialogDescription>
  <p>텍스트</p>
  <div>...</div>
</AlertDialogDescription>

// ✅ 올바른 구조
<AlertDialogHeader>
  <AlertDialogTitle>제목</AlertDialogTitle>
</AlertDialogHeader>
<div className="text-sm text-muted-foreground">
  <p>텍스트</p>
  <div>...</div>
</div>
```

**교훈:**
- AlertDialogDescription 사용 시 블록 요소 포함 금지
- 복잡한 구조는 일반 `<div>` 사용

---

#### 2. 클라이언트 로그아웃 상태 미반영
**증상:**
- 회원 탈퇴 후 홈으로 리다이렉트
- 헤더에 여전히 로그인 상태 (프로필 아이콘)
- 새로고침해야 로그아웃 버튼 표시

**원인:**
```typescript
// 서버에서만 signOut
await supabase.auth.signOut()

// Next.js 클라이언트 라우팅 (Soft Navigation)
router.push('/')  // ← Auth 상태 유지됨
```

**해결:**
```typescript
// 전체 페이지 새로고침 (Hard Reload)
window.location.href = '/'  // ← Auth 상태 완전 초기화
```

**동작 원리:**
1. `window.location.href`: 브라우저가 서버에 새로 요청
2. Supabase Auth 세션 체크 → 세션 없음
3. `useAuth` 훅이 `user = null`로 초기화
4. 헤더에 "로그인" 버튼 표시

**교훈:**
- 인증 상태 변경 후 `router.push` 사용 금지
- `window.location.href`로 완전한 상태 초기화 필요

---

#### 3. deleted_at 컬럼 누락
**증상:**
- 회원 탈퇴 API 실행 시 에러 예상
- `public.users` 테이블에 `deleted_at` 컬럼 없음

**원인:**
- 처음 users 테이블 생성 시 Soft Delete 고려 안함
- 회원 탈퇴 기능이 Phase 3.3에서 추가됨

**해결:**
```sql
ALTER TABLE public.users 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX idx_users_deleted_at ON public.users(deleted_at);
```

**교훈:**
- 사용자 테이블 설계 시 `deleted_at` 컬럼 기본 포함 권장
- Soft Delete는 업계 표준 패턴

---

### 주요 패턴 및 규칙

#### 1. Soft Delete 구현
```typescript
// API
const userId8Chars = user.id.replace(/-/g, '').substring(0, 8)
const anonymizedNickname = `탈퇴한사용자_${userId8Chars}`

await supabase
  .from('users')
  .update({
    deleted_at: new Date().toISOString(),
    nickname: anonymizedNickname,
    updated_at: new Date().toISOString()
  })
  .eq('id', user.id)

// 복구 (수동)
UPDATE public.users
SET deleted_at = NULL, nickname = '원래닉네임'
WHERE email = 'user@example.com';
```

#### 2. 반응형 텍스트
```typescript
// 데스크탑: 상세
<p className="hidden sm:block">탈퇴 시 다음 사항을 확인해주세요:</p>
<li className="hidden sm:list-item">• 계정 정보는 즉시 삭제됩니다</li>

// 모바일: 간결
<p className="sm:hidden font-semibold">탈퇴 시 확인사항:</p>
<li className="sm:hidden">• 계정 정보 즉시 삭제</li>

// 공통 (중요)
<li className="text-red-600 font-semibold">
  • 탈퇴 후 30일 이내 고객센터 문의 시 복구 가능
</li>
```

#### 3. 2단계 확인 모달
```typescript
// 1단계: 경고 및 안내
const [showDeleteStep1, setShowDeleteStep1] = useState(false)

<AlertDialog open={showDeleteStep1}>
  <AlertDialogAction onClick={() => {
    setShowDeleteStep1(false)
    setShowDeleteStep2(true)  // 2단계로 진행
  }}>
    계속
  </AlertDialogAction>
</AlertDialog>

// 2단계: 최종 확인
const [showDeleteStep2, setShowDeleteStep2] = useState(false)

<AlertDialog open={showDeleteStep2}>
  <AlertDialogAction onClick={handleDeleteAccount}>
    탈퇴
  </AlertDialogAction>
</AlertDialog>
```

---

### 최종 파일 목록

**Backend:**
- `app/api/auth/delete-account/route.ts` - 회원 탈퇴 API
- `lib/api-error.ts` - 에러 코드 추가

**Frontend:**
- `app/my/page.tsx` - 닉네임 변경/회원 탈퇴 모달

**Database:**
- `supabase/migrations/20241130000000_add_deleted_at_to_users.sql`
- `public.users.deleted_at` 컬럼 추가
- `idx_users_deleted_at` 인덱스 추가

---

### 테스트 체크리스트

#### 닉네임 변경
- [x] 모달 오픈 및 닫기
- [x] 30일 제한 안내 빨간색 표시
- [x] 2자 미만 에러
- [x] 20자 초과 에러
- [x] 특수문자 에러
- [x] 중복 닉네임 에러
- [x] 성공 시 즉시 반영
- [x] 모바일 반응형

#### 회원 탈퇴
- [x] 1단계 모달: 경고 표시
- [x] 데스크탑: 상세 안내
- [x] 모바일: 간결한 안내
- [x] "30일 복구" 빨간색 하이라이트
- [x] 2단계 모달: 최종 확인
- [x] 탈퇴 후 홈 리다이렉트
- [x] 로그아웃 상태 즉시 반영
- [x] DB: deleted_at 기록
- [x] DB: 닉네임 익명화

#### DB 확인
- [x] deleted_at 컬럼 존재
- [x] 인덱스 생성
- [x] 복구 가능 (수동)

---

### 다음 작업 권장사항

1. **deleted_at RLS 정책 추가 (선택적)**
   - 탈퇴한 사용자는 로그인 차단
```sql
   CREATE POLICY "prevent_deleted_user_access" ON public.users
   FOR SELECT USING (deleted_at IS NULL);
```

2. **탈퇴 사유 수집 (선택적)**
   - 회원 탈퇴 시 선택적 사유 입력
   - 서비스 개선 데이터로 활용

3. **이메일 알림 (선택적)**
   - 탈퇴 완료 이메일 발송
   - 복구 방법 안내

4. **Phase 4 기능 구현**
   - 알림 시스템 (MYPAGE_IMPLEMENTATION_PLAN.md 참조)

### 버그 수정

#### 마이페이지 무한 API 호출
**증상:** `/api/my/profile`이 초당 3번씩 무한 호출
**원인:** useEffect 의존성 배열에 `signInWithGoogle`, `router`, `fetchProfile` 함수 포함
**해결:** 의존성 배열에서 함수 참조 제거, 상태 값(`user`, `loading`, `loginAttempted`)만 유지
**파일:** `app/my/page.tsx`
---

**작성일**: 2025-11-30  
**작성자**: Claude + Jaden  
**소요 시간**: 약 2시간  
**상태**: Phase 3.3 완료, Phase 4 대기 중