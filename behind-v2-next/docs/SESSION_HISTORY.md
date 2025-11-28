# Behind v2 - 작업 세션 이력

## Session #1 - 2025-11-27

### 작업 내용
**마이페이지 데이터 로딩 문제 해결 및 사용자 추적 기능 구현**

### 발견된 문제들

#### 1. Upstash Redis 삭제로 인한 댓글/투표 기능 장애
**증상:**
- 댓글 작성 시 3초 지연 후 500 에러
- 투표 참여 불가능
- Rate Limiter 연결 실패: `ENOTFOUND outgoing-longhorn-22656.upstash.io`

**원인:**
- Upstash Redis DB가 삭제되어 있었음
- Rate Limiting 로직에서 Redis 연결 실패로 API 전체가 블로킹됨

**해결:**
- Upstash 새 DB 생성 및 `.env.local` 업데이트
- 개발 서버 재시작

**교훈:**
- 외부 서비스 의존성은 fallback 로직 필요
- Rate Limiter 연결 실패 시에도 API가 작동하도록 개선 필요

---

#### 2. useFetchWithRetry 무한 루프
**증상:**
- 마이페이지 접속 시 무한 로딩
- 브라우저 콘솔에 fetch 로그 무한 출력
- 새 탭 열어도 계속 로딩만 발생

**원인:**
```typescript
// hooks/useFetchWithRetry.ts
const fetch = useCallback(async (...) => {
  ...
  const response = await fetch(url, {  // ← 자기 자신 호출!
```
- 커스텀 함수명을 `fetch`로 지정
- 내부에서 네이티브 `fetch`를 호출하려 했으나 자기 자신을 재귀 호출

**해결:**
```typescript
const response = await window.fetch(url, {  // ← window.fetch 명시
```

**교훈:**
- 네이티브 API 이름과 동일한 함수명 사용 금지
- 또는 명시적으로 `window.fetch` 사용

---

#### 3. RLS 정책으로 인한 데이터 조회 실패
**증상:**
- 마이페이지에서 투표/댓글 목록이 빈 배열로 표시
- 닉네임이 "Guest"로 표시 (실제 DB에는 "운영자"로 저장됨)
- 대시보드 통계 카운트가 0 또는 부정확

**원인:**
```typescript
// 익명 클라이언트 사용
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// RLS 정책으로 조회 차단
const { data } = await supabase
  .from('poll_votes')
  .eq('user_id', user.id)  // ← auth.uid() = null이므로 조회 실패
```

**해결:**
```typescript
// 인증된 서버 클라이언트 사용
const supabaseServer = await createServerClient()
const { data } = await supabaseServer
  .from('poll_votes')
  .eq('user_id', user.id)  // ← 정상 조회
```

**수정 파일:**
- `app/api/my/votes/route.ts`
- `app/api/my/profile/route.ts`

**교훈:**
- API에서 사용자별 데이터 조회 시 반드시 `supabaseServer` 사용
- 익명 클라이언트는 public 데이터 조회용

---

#### 4. RLS SELECT 정책 누락
**증상:**
- `poll_votes` 테이블 조회 시 빈 배열 반환
- API는 정상, SQL 직접 실행은 성공

**원인:**
- `poll_votes` 테이블에 INSERT 정책만 있고 SELECT 정책 없음
- RLS가 활성화되어 있어 SELECT 차단

**해결:**
```sql
CREATE POLICY "select_own_votes" ON poll_votes
FOR SELECT
USING (
  auth.uid() = user_id 
  OR user_id IS NULL
);
```

**교훈:**
- RLS 정책은 INSERT/SELECT/UPDATE/DELETE 모두 설정 필요
- 정책 누락 시 조회 불가

---

#### 5. 궁금해요 기능에 user_id 추적 누락
**증상:**
- 궁금해요 카운트가 항상 0
- 로그인 후 눌러도 마이페이지에 반영 안됨

**원인:**
- `report_curious` 테이블에 `user_id` 컬럼 자체가 없음
- `device_hash`만으로 추적 (비로그인 사용자용)

**해결:**
1. 테이블 수정
```sql
ALTER TABLE report_curious ADD COLUMN user_id UUID REFERENCES users(id);
CREATE INDEX idx_report_curious_user_id ON report_curious(user_id);
```

2. RLS 정책 추가
```sql
CREATE POLICY "select_own_curious" ON report_curious
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "insert_curious" ON report_curious
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

3. RPC 함수 수정
```sql
CREATE OR REPLACE FUNCTION curious_report(
  p_report_id uuid, 
  p_device_hash text,
  p_user_id uuid DEFAULT NULL  -- 추가
)
...
INSERT INTO report_curious (report_id, device_hash, user_id)
VALUES (p_report_id, p_device_hash, p_user_id);
```

4. API 수정
```typescript
const { data, error } = await supabase.rpc('curious_report', {
  p_report_id: reportId,
  p_device_hash: deviceHash,
  p_user_id: user?.id || null  // 추가
})
```

**교훈:**
- 사용자 행동 추적 기능은 처음부터 user_id 설계 필요
- 기존 데이터(user_id=null)는 카운트 안됨

---

### 최종 수정 파일 목록

**Backend:**
- `hooks/useFetchWithRetry.ts` - window.fetch 사용
- `app/api/my/votes/route.ts` - supabaseServer 사용
- `app/api/my/profile/route.ts` - supabaseServer 사용, curious 카운트 추가
- `app/api/reports/[id]/curious/route.ts` - user_id 파라미터 추가

**Database:**
- `report_curious` 테이블: user_id 컬럼 추가
- `poll_votes` 테이블: SELECT RLS 정책 추가
- `report_curious` 테이블: SELECT/INSERT RLS 정책 추가
- `curious_report` RPC 함수: user_id 파라미터 추가

---

### 후임자 주의사항

#### 1. Supabase 클라이언트 선택
```typescript
// ❌ 사용자별 데이터 조회 시
const supabase = createClient(ANON_KEY)

// ✅ 사용자별 데이터 조회 시
const supabaseServer = await createServerClient()
```

#### 2. RLS 정책 체크리스트
새 테이블 생성 시:
- [ ] SELECT 정책
- [ ] INSERT 정책  
- [ ] UPDATE 정책 (필요시)
- [ ] DELETE 정책 (필요시)

#### 3. 네이티브 API 이름 충돌 방지
```typescript
// ❌ 금지
const fetch = () => {}

// ✅ 권장
const fetchData = () => {}
// 또는 명시적으로
window.fetch()
```

#### 4. Rate Limiter 장애 대응
- Upstash Redis 상태 주기적 확인
- 연결 실패 시 fallback 로직 고려

#### 5. 디버깅 로그 정리
현재 남아있는 디버깅 로그:
- `app/my/votes/page.tsx` - [DEBUG] 로그
- `hooks/useFetchWithRetry.ts` - [FETCH] 로그

배포 전 제거 필요

---

### 테스트 체크리스트

#### 마이페이지
- [ ] 대시보드 통계 정확성 (투표/댓글/궁금해요)
- [ ] 닉네임 정상 표시
- [ ] 투표 목록 조회
- [ ] 댓글 목록 조회
- [ ] 필터 동작 (전체/진행중/종료)
- [ ] 페이지네이션

#### 참여 기능
- [ ] 댓글 작성 후 마이페이지 반영
- [ ] 투표 참여 후 마이페이지 반영
- [ ] 궁금해요 클릭 후 마이페이지 반영
- [ ] Rate Limiter 정상 작동

---

### 다음 작업 권장사항

1. **디버깅 로그 제거**
   - 프로덕션 배포 전 모든 console.log 정리

2. **Rate Limiter Fallback**
   - Redis 연결 실패 시에도 API 작동하도록 개선

3. **기존 궁금해요 데이터 마이그레이션**
   - user_id=null인 기존 데이터 처리 방안 결정

4. **Phase 2 기능 구현**
   - 이슈 팔로우 기능 (HANDOFF_PROMPT.md 참조)

---

**작성일**: 2025-11-27  
**작성자**: Claude + Jaden  
**소요 시간**: 약 3시간

---

## Session #2 - 2025-11-27

### 작업 내용
**Phase 2 - 이슈 팔로우 기능 구현**

### 구현 사항

#### 1. DB 스키마 생성
**테이블:** `issue_follows`
```sql
CREATE TABLE issue_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, issue_id)
);
```

**인덱스:** 5개 생성
- `idx_issue_follows_user_id`
- `idx_issue_follows_issue_id`
- `idx_issue_follows_created_at`
- Primary Key, UNIQUE constraint 인덱스

**RLS 정책:** 4개 생성
- SELECT: 본인 데이터만 조회
- INSERT: 본인만 추가
- DELETE: 본인만 삭제
- UPDATE: 차단 (No one can update)

---

#### 2. 팔로우/언팔로우 API
**파일:** `app/api/issues/[id]/follow/route.ts`

**엔드포인트:**
- `GET /api/issues/[id]/follow` - 팔로우 상태 확인
- `POST /api/issues/[id]/follow` - 팔로우 추가
- `DELETE /api/issues/[id]/follow` - 언팔로우

**특징:**
- Next.js 15 비동기 params 패턴 사용
- CSRF 보호 (POST, DELETE)
- 중복 팔로우 체크 (멱등성)
- supabaseServer 사용 (인증된 요청)

---

#### 3. 팔로우 버튼 컴포넌트
**파일:** `components/issue-follow-button.tsx`

**수정 사항:**
- size prop 타입 수정: `'md'` → `'default'`
- Optimistic UI 로직 개선: `previousState` 저장 후 복원
- CSRF 토큰 처리
- 로딩/에러 상태 관리

**적용 위치:**
- `app/issues/[id]/page.tsx` - 헤더 영역에 추가

---

#### 4. 팔로우한 이슈 목록
**API:** `app/api/my/follows/route.ts`
- 2단계 조회: issue_follows → issues (JOIN)
- 메모리 필터링 및 페이지네이션
- 필터: all, active, ended

**페이지:** `app/my/follows/page.tsx`
- 기존 votes 페이지 패턴 재사용
- useFetchWithRetry 훅 사용
- 필터 및 페이지네이션 UI

**사이드바:** `app/my/layout.tsx`
- Desktop/Mobile 메뉴에 "팔로우한 이슈" 추가
- 아이콘: ⭐

---

### 검수 및 검증

#### 네이밍 컨벤션 검증
- ✅ 테이블명: `issue_follows` (snake_case, 복수형)
- ✅ 컬럼명: `user_id`, `issue_id`, `created_at` (snake_case)
- ✅ API URL: `/api/issues/[id]/follow`, `/api/my/follows` (kebab-case)
- ✅ 컴포넌트: `issue-follow-button.tsx` (kebab-case)
- ✅ 함수: `IssueFollowButton` (PascalCase)
- ✅ 변수: `isLoading`, `issueId` (camelCase)

#### 호출 구조 검증
```
이슈 상세 페이지
  ↓
IssueFollowButton
  ↓ useEffect
GET /api/issues/[id]/follow (상태 확인)
  ↓ onClick
POST/DELETE /api/issues/[id]/follow
  ↓
Supabase issue_follows 테이블
  ↓
마이페이지 /my/follows
  ↓
GET /api/my/follows
  ↓
Supabase issue_follows + issues JOIN
```

---

### 주요 패턴 및 규칙

#### 1. Next.js 15 비동기 params
```typescript
// ✅ 올바른 패턴
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}
```

#### 2. Optimistic UI
```typescript
// ✅ 올바른 패턴
const previousState = following
setFollowing(!following)  // UI 먼저 업데이트
try {
  await fetch(...)
} catch (error) {
  setFollowing(previousState)  // 실패 시 복원
}
```

#### 3. CSRF 토큰
```typescript
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf-token='))
  ?.split('=')[1]

headers: {
  'x-csrf-token': csrfToken || ''
}
```

---

### 테스트 체크리스트

#### 팔로우 기능
- [ ] 이슈 상세 페이지에서 팔로우 버튼 표시
- [ ] 로그인 필요 상태 확인
- [ ] 팔로우/언팔로우 토글 동작
- [ ] Optimistic UI 업데이트
- [ ] 중복 팔로우 방지

#### 마이페이지
- [ ] 팔로우한 이슈 목록 표시
- [ ] 필터 동작 (전체/진행중/종료)
- [ ] 페이지네이션
- [ ] 빈 목록 UI
- [ ] 이슈 클릭 시 이동

#### RLS 정책
- [ ] 본인 팔로우만 조회 가능
- [ ] 다른 사용자 팔로우 접근 차단

---

### Git Commits
```bash
feat: issue_follows 테이블 생성 및 RLS 정책 설정
feat: 이슈 팔로우/언팔로우 API 구현
fix: 팔로우 버튼 size prop 타입 수정 및 Optimistic UI 로직 개선
feat: 이슈 상세 페이지에 팔로우 버튼 추가
feat: 마이페이지 사이드바에 팔로우한 이슈 메뉴 추가
```

---

**작성일**: 2025-11-27  
**작성자**: Claude + Jaden  
**소요 시간**: 약 2시간  
**상태**: Phase 2 완료


---

## Session #3 - 2025-11-27

### 작업 내용
**Phase 3-1: 참여한 채팅방 목록 기능 구현 + 레이아웃 통일**

### 구현 사항

#### 1. 참여한 채팅방 목록
**API:** `app/api/my/chat-rooms/route.ts`
- room_members 테이블 조회 (left_at IS NULL)
- rooms → issues JOIN
- 활성 멤버 수 계산
- 기존 votes API 패턴 준수

**페이지:** `app/my/chat-rooms/page.tsx`
- 채팅방 카드 목록
- 활성 멤버 수, 마지막 활동 시간 표시
- 페이지네이션 (20개씩)

#### 2. GNB 메뉴 구조 변경
**변경 사항:**
- "내 대화방" → "채팅방" (네이밍 개선)
- GNB에서 바로 접근 (1클릭)
- 마이페이지 사이드바에서 제거

**이유:**
- 빠른 접근성 (실시간성 강조)
- 간결한 네이밍
- UX 개선

#### 3. 버그 수정
**문제:** 채팅방 카드 클릭 시 무한 루프
- 원인: `display_id` → `issue_id` (UUID) 변환 누락
- 해결: `router.push(/chat/${chatRoom.issue_id})`

**문제:** 404 에러 + Rate Limiter 429
- 원인: 잘못된 issue_id 전달로 인한 무한 재시도
- 해결: 올바른 UUID 사용

#### 4. 레이아웃 통일
**문제:** 헤더-본문 정렬 불일치
- 전체 이슈, 이슈 상세, 채팅방: 본문이 헤더보다 좁음
- 마이페이지: 헤더와 사이드바 정렬 불일치

**해결:**
- 본문 영역 확대 (max-w-6xl → max-w-7xl)
- 마이페이지 진입 시 헤더 full width 적용
- 조건부 렌더링: `usePathname().startsWith('/my')`

---

### 교훈 및 주의사항

#### 1. URL 파라미터 구조 확인 필수
- `display_id` vs `issue_id` (UUID)
- 기존 라우팅 패턴 먼저 확인
- API 응답에 필요한 필드 포함 여부 검증

#### 2. 레이아웃 일관성
- 헤더-본문 정렬 기준점 통일
- 사이드바 레이아웃은 full width 유지 (UX 표준)
- 조건부 렌더링으로 페이지별 최적화

#### 3. UX 의사결정
- 메뉴 배치: 사용 빈도와 실시간성 고려
- 네이밍: 간결하고 직관적으로
- 정보 구조: 1-2클릭 내 접근 가능하게

---

### 최종 파일 목록

**Backend:**
- `app/api/my/chat-rooms/route.ts` - 채팅방 목록 API

**Frontend:**
- `app/my/chat-rooms/page.tsx` - 채팅방 목록 페이지
- `components/Header.tsx` - 조건부 레이아웃

**Layout:**
- `app/issues/page.tsx` - max-w-7xl 적용
- `app/issues/[id]/page.tsx` - max-w-7xl 적용
- `app/chat/[id]/page.tsx` - max-w-7xl 적용

---

**작성일**: 2025-11-27
**작성자**: Claude + Jaden
**소요 시간**: 약 2시간
**상태**: Phase 3-1 완료

다음 단계: Phase 3-2
남은 Phase 3 작업 (예상 13시간)
3-2. 다른 사용자 프로필 조회 (7시간)

GET /api/users/[nickname] - 사용자 프로필 API
/app/users/[nickname]/page.tsx - 프로필 페이지
댓글/채팅에서 닉네임 클릭 시 프로필 이동

3-3. 프로필 설정 페이지 (4시간)

/app/my/settings/page.tsx - 설정 페이지
닉네임 변경, 계정 정보 표시

3-4. 헤더 네비게이션 업데이트 (2시간)

프로필 드롭다운 메뉴 추가


## Session #3 - 2025-11-28

### 작업 내용
**Phase 3.2 - 사용자 프로필 조회 및 반응형 모달 구현**

### 구현 사항

#### 1. 미사용 API 정리
**파일:** `app/api/auth/me/route.ts`

**문제:**
- 계정 정책 기획 시 생성된 API
- 실제로는 `/api/my/profile`가 동일 역할 수행
- 사용되지 않는 중복 API
- camelCase 응답 (다른 API들은 snake_case)

**해결:**
- 파일 삭제
- 일관성 유지

---

#### 2. 사용자 프로필 조회 API
**파일:** `app/api/users/[nickname]/route.ts`

**기능:**
- 닉네임으로 사용자 프로필 조회
- 공개 정보만 반환 (닉네임, 가입일, 활동 통계)
- 이메일 비공개
- 최근 댓글 3개 미리보기

**응답 구조:**
```typescript
{
  nickname: string
  joined_at: string  // "YYYY년 M월"
  stats: {
    comment_count: number
    vote_count: number
  }
  recent_comments: Array<{
    id: string
    body: string
    created_at: string
    issue_id: string
    issues: {
      id: string
      display_id: number
      title: string
    }
  }>
}
```

**특징:**
- Next.js 15 비동기 params 패턴
- encodeURIComponent로 닉네임 인코딩
- 삭제된 이슈 필터링 (issues가 null인 댓글 제외)
- 404 처리: NextResponse.json 직접 사용
- Rate Limit 없음 (공개 조회)

---

#### 3. 사용자 프로필 페이지
**파일:** `app/users/[nickname]/page.tsx`

**기능:**
- 사용자 프로필 전체 정보 표시
- 닉네임, 가입일
- 활동 통계 (댓글/투표)
- 최근 댓글 목록
- 404 에러 처리

**패턴:**
- 'use client' 컴포넌트
- useParams() 동적 라우팅
- useState/useEffect 상태 관리
- Card 컴포넌트 UI
- formatTime 날짜 포맷팅

---

#### 4. useMediaQuery 훅 구현
**파일:** `hooks/use-media-query.ts`

**목적:**
- 반응형 UI 처리
- 화면 크기 감지

**구현:**
```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}
```

**특징:**
- matchMedia API 사용
- 이벤트 리스너 등록/해제
- 의존성 배열 [matches, query]
- 클린업 함수

---

#### 5. 반응형 프로필 모달
**파일:** `components/user-profile-drawer.tsx`

**목적:**
- 데스크탑: Dialog (중앙 모달)
- 모바일: Drawer (바텀시트)

**구현:**
```typescript
const isDesktop = useMediaQuery('(min-width: 768px)')

if (isDesktop) {
  return <Dialog>...</Dialog>
}
return <Drawer>...</Drawer>
```

**컨텐츠:**
- 닉네임, 가입일
- 활동 통계 (댓글/투표)
- 최근 댓글 2개 미리보기
- "프로필 자세히 보기" 버튼
- "닫기" 버튼

**상태 관리:**
- selectedNickname: string | null
- null = 닫힘, string = 열림
- 단일 상태로 관리

**최적화:**
- open === true일 때만 API 호출
- 컨텐츠 중복 제거 (content 변수)

---

#### 6. 댓글/채팅 닉네임 클릭 연동
**파일:**
- `app/issues/[id]/page.tsx` (댓글)
- `app/chat/[id]/page.tsx` (채팅)

**변경사항:**
1. UserProfileDrawer import 추가
2. selectedNickname 상태 추가
3. 닉네임을 button으로 변경
4. 익명 사용자 처리

**댓글 구조:**
```typescript
{c.user_nick ? (
  <button
    onClick={() => setSelectedNickname(c.user_nick)}
    className="text-sm hover:underline cursor-pointer text-left bg-transparent border-none p-0"
  >
    {c.user_nick}
  </button>
) : (
  <p className="text-sm text-muted-foreground">익명</p>
)}
```

**채팅 구조:**
```typescript
{m.authorNick ? (
  <button
    onClick={() => setSelectedNickname(m.authorNick)}
    className="text-sm text-muted-foreground px-1 hover:underline cursor-pointer bg-transparent border-none p-0"
  >
    {m.authorNick}
  </button>
) : (
  <span className="text-sm text-muted-foreground px-1">익명</span>
)}
```

**스타일:**
- hover만 underline (subtle)
- bg-transparent border-none p-0 (button 기본 스타일 제거)
- 기존 텍스트 스타일 유지

---

### 주요 결정 사항

#### 1. Dialog vs Drawer
**결정:** 반응형 조합 (Desktop: Dialog, Mobile: Drawer)

**이유:**
- 각 디바이스에 최적화된 UX
- 유튜브, 인스타그램 등 주요 서비스 패턴
- 업계 표준

**대안 (기각):**
- CSS만으로 해결 (max-width) → UX 개선 한계
- Drawer만 사용 → 데스크탑에서 부자연스러움

#### 2. 닉네임 클릭 interaction
**결정:** Simple button

**이유:**
- button 태그가 기본 접근성 지원
- 코드 간결성
- 기존 프로젝트 패턴 일관성

**대안 (기각):**
- span + role="button" → 불필요한 복잡성

#### 3. 익명 사용자 처리
**결정:** Null 체크 + "익명" 표시

**이유:**
- SESSION_HISTORY.md 확인: user_id=null 댓글 존재
- 클릭 방지 필요 (프로필 없음)

#### 4. 닉네임 스타일
**결정:** Subtle (hover only)

**이유:**
- 현재 디자인 일관성
- 댓글 가독성 우선
- 유튜브/네이버 등 주요 커뮤니티 패턴

---

### 네이밍 규칙 준수

#### 파일명
- ✅ `use-media-query.ts` (kebab-case)
- ✅ `user-profile-drawer.tsx` (kebab-case)
- ✅ `[nickname]/route.ts` (동적 라우팅)

#### 함수명
- ✅ `useMediaQuery` (camelCase)
- ✅ `UserProfileDrawer` (PascalCase)
- ✅ `fetchProfile` (camelCase)
- ✅ `handleViewFullProfile` (camelCase)

#### 변수명
- ✅ `isDesktop` (camelCase)
- ✅ `selectedNickname` (camelCase)
- ✅ `decodedNickname` (camelCase)

#### API 응답
- ✅ `joined_at` (snake_case)
- ✅ `comment_count` (snake_case)
- ✅ `recent_comments` (snake_case)

---

### 패턴 준수

#### 1. API 패턴
- ✅ Next.js 15: `await params`
- ✅ createSuccessResponse/createErrorResponse 사용
- ✅ supabaseServer 사용 (인증 필요 시)
- ✅ 404: NextResponse.json 직접 사용

#### 2. JOIN 패턴
```typescript
.select(`
  id,
  body,
  created_at,
  issue_id,
  issues:issue_id (
    id,
    display_id,
    title
  )
`)
```

#### 3. 날짜 포맷
```typescript
const joinDate = new Date(created_at)
const joined_at = `${joinDate.getFullYear()}년 ${joinDate.getMonth() + 1}월`
```

#### 4. 에러 처리
- 404: 명확한 메시지
- 500: createErrorResponse
- 로딩/에러 상태 분리

---

### Git Commits
```bash
chore: 미사용 API 삭제 (/api/auth/me)
feat: 사용자 프로필 조회 API 구현 (GET /api/users/[nickname])
feat: 사용자 프로필 페이지 구현
feat: 사용자 프로필 Drawer 컴포넌트 구현
feat: 댓글/채팅에서 사용자 프로필 Drawer 연동
feat: 반응형 사용자 프로필 모달 구현 (데스크탑 Dialog, 모바일 Drawer)
```

---

### 테스트 체크리스트

#### 프로필 기능
- [x] 댓글 닉네임 hover → underline 표시
- [x] 댓글 닉네임 클릭 → 모달 오픈
- [x] 채팅 닉네임 클릭 → 모달 오픈
- [x] 익명 댓글 "익명" 표시
- [x] 익명 클릭 불가
- [x] 프로필 정보 표시 (닉네임, 가입일, 통계)
- [x] 최근 댓글 2개 표시
- [x] "프로필 자세히 보기" → 페이지 이동
- [x] "닫기" 버튼 동작

#### 반응형
- [x] 데스크탑 (768px+): Dialog 중앙 모달
- [x] 모바일 (768px-): Drawer 바텀시트
- [x] 화면 크기 조절 시 전환

#### API
- [x] 존재하는 사용자 조회
- [x] 존재하지 않는 사용자 404
- [x] 최근 댓글 3개 반환
- [x] 삭제된 이슈 필터링

---

### 후임자 주의사항

#### 1. 반응형 모달 패턴
```typescript
const isDesktop = useMediaQuery('(min-width: 768px)')

if (isDesktop) {
  return <Dialog>...</Dialog>
}
return <Drawer>...</Drawer>
```
- 768px breakpoint (Tailwind md:)
- 컨텐츠 중복 제거 필수

#### 2. 익명 사용자 처리
```typescript
{user_nick ? (
  <button>...</button>
) : (
  <p>익명</p>
)}
```
- user_id=null 또는 nickname=null 모두 처리
- 클릭 불가 처리

#### 3. useMediaQuery 재사용
- 다른 반응형 컴포넌트에서 활용 가능
- 표준 media query 문자열 사용

#### 4. 프로필 사진 추가 시
- users 테이블에 avatar_url 컬럼 추가
- Supabase Storage 설정
- API 응답에 avatar_url 포함
- 모달/페이지에 이미지 표시

---

**작성일**: 2025-11-28  
**작성자**: Claude + Jaden  
**소요 시간**: 약 2.5시간  
**상태**: Phase 3.2 완료