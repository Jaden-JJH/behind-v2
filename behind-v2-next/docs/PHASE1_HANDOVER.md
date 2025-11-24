# Phase 1 완료 인수인계 문서

**작성일**: 2025-11-04
**작업자**: Claude Code
**상태**: Phase 1 구현 완료, QA 및 디버깅 필요

---

## 📋 Phase 1에서 구현한 기능

### ✅ 완료된 작업

#### 1. 마이페이지 레이아웃
- **파일**:
  - [app/my/layout.tsx](../app/my/layout.tsx) - 사이드바 네비게이션
  - [app/my/page.tsx](../app/my/page.tsx) - 대시보드 (계정 정보 + 활동 통계)
- **기능**:
  - 사이드바 메뉴: 대시보드, 참여한 투표, 내가 쓴 댓글, 궁금해요 누른 제보
  - 모바일 반응형 지원 (햄버거 메뉴)
  - 활동 통계 카드 (클릭 시 해당 페이지로 이동)

#### 2. 내 계정 정보 API
- **파일**: [app/api/my/profile/route.ts](../app/api/my/profile/route.ts)
- **엔드포인트**: `GET /api/my/profile`
- **기능**:
  - 사용자 기본 정보 조회 (이메일, 닉네임, 가입일)
  - 활동 통계 계산 (투표 수, 댓글 수, 궁금해요 수)
  - 로그인 필수 (401 에러 반환)

#### 3. 참여한 투표 모아보기
- **파일**:
  - [app/api/my/votes/route.ts](../app/api/my/votes/route.ts)
  - [app/my/votes/page.tsx](../app/my/votes/page.tsx)
- **기능**:
  - 투표한 이슈 목록 조회 (투표 시간 기준 최신순)
  - 필터: 전체/진행중/종료
  - 페이지네이션 (20개씩)
  - 이슈 카드 클릭 시 상세 페이지로 이동

#### 4. 내가 쓴 댓글 목록
- **파일**:
  - [app/api/my/comments/route.ts](../app/api/my/comments/route.ts)
  - [app/my/comments/page.tsx](../app/my/comments/page.tsx)
- **기능**:
  - 댓글 목록 조회 (작성 시간 기준 최신순)
  - 이슈 정보 포함 (제목, 썸네일)
  - 추천/비추천 수 표시
  - 댓글 클릭 시 해당 이슈로 이동 (`#comment-{id}`)

#### 5. 궁금해요 누른 제보
- **파일**: [app/my/curious/page.tsx](../app/my/curious/page.tsx)
- **기능**:
  - 기존 제보 페이지로 리다이렉트 (`/reported-issues?my_curious=true`)
  - 필터 자동 적용

#### 6. UI 개선
- **파일**:
  - [components/quick-vote.tsx](../components/quick-vote.tsx:109) - "이슈 자세히 보기"
  - [app/issues/[id]/page.tsx](../app/issues/[id]/page.tsx:573) - "진행 중인 투표 모아보기"
- **변경 사항**:
  - 홈 페이지 투표 버튼: "댓글 토론 참여하기" → "이슈 자세히 보기"
  - 이슈 상세 투표 버튼: "댓글 보러가기" → "진행 중인 투표 모아보기" (+ `/issues`로 이동)

#### 7. 헤더 네비게이션
- **파일**:
  - [components/Header.tsx](../components/Header.tsx:94-96)
  - [components/MobileMenu.tsx](../components/MobileMenu.tsx:114-120)
- **변경 사항**:
  - 마이페이지 링크를 **항상 표시** (로그인 여부 무관)
  - 비로그인 시 클릭하면 자동으로 구글 로그인 시작

---

## 🐛 알려진 문제 및 QA 체크리스트

### 🔴 Critical - 반드시 확인 필요

#### 1. 비로그인 상태 로그인 유도 무한 루프 가능성
**문제 위치**:
- [app/my/page.tsx:30-31](../app/my/page.tsx#L30-L31)
- [app/my/votes/page.tsx:49-50](../app/my/votes/page.tsx#L49-L50)
- [app/my/comments/page.tsx:49-50](../app/my/comments/page.tsx#L49-L50)
- [app/my/curious/page.tsx:15-16](../app/my/curious/page.tsx#L15-L16)

**증상**:
- 비로그인 상태에서 마이페이지 클릭 시 `signInWithGoogle()` 호출
- 사용자가 로그인 팝업을 닫거나 취소하면 다시 `useEffect` 실행 → 무한 루프

**재현 방법**:
```
1. 로그아웃 상태에서 "마이페이지" 클릭
2. 구글 로그인 팝업에서 "취소" 또는 팝업 닫기
3. 페이지가 다시 로그인 팝업을 띄우는지 확인
```

**해결 방법 (후임자 작업)**:
```typescript
// 로그인 시도 상태 추가
const [loginAttempted, setLoginAttempted] = useState(false)

useEffect(() => {
  if (loading) return

  if (!user && !loginAttempted) {
    setLoginAttempted(true)
    signInWithGoogle()
    return
  }

  if (!user && loginAttempted) {
    // 로그인 실패 또는 취소 시 홈으로 리다이렉트
    router.push('/')
    return
  }

  fetchProfile()
}, [user, loading, loginAttempted])
```

#### 2. `useEffect` 의존성 배열 경고
**문제 위치**: 모든 마이페이지 관련 컴포넌트

**증상**:
- `signInWithGoogle`, `router` 등이 의존성 배열에 포함되어 불필요한 리렌더링 발생 가능
- React Hook 경고 발생 가능

**재현 방법**:
```
1. 브라우저 콘솔 확인
2. React DevTools로 리렌더링 횟수 확인
```

**해결 방법**:
```typescript
// useCallback으로 함수 메모이제이션
const handleLogin = useCallback(() => {
  signInWithGoogle()
}, [signInWithGoogle])

// 또는 의존성 배열 최소화
useEffect(() => {
  if (loading || user) return
  signInWithGoogle()
}, [user, loading]) // signInWithGoogle 제거
```

#### 3. API 응답 에러 처리 미흡
**문제 위치**:
- [app/api/my/votes/route.ts](../app/api/my/votes/route.ts)
- [app/api/my/comments/route.ts](../app/api/my/comments/route.ts)

**증상**:
- `poll_votes`에 데이터가 많을 경우 JOIN 쿼리 성능 저하
- `polls` 또는 `issues`가 삭제된 경우 null 반환 → 필터링 누락

**재현 방법**:
```
1. 100개 이상 투표한 계정으로 로그인
2. /my/votes 페이지 로딩 시간 측정
3. 삭제된 이슈를 투표한 경우 에러 발생 확인
```

**해결 방법**:
- RPC 함수로 성능 최적화
- null 체크 강화
- 에러 바운더리 추가

---

### 🟡 Medium - 개선 권장

#### 4. 페이지네이션 UX
**문제**:
- 페이지 변경 시 스크롤 위치 유지 안됨
- 페이지 번호만 표시 (이전/다음 버튼만)

**개선 방안**:
- 무한 스크롤 구현
- 페이지 변경 시 상단으로 자동 스크롤

#### 5. 빈 데이터 UI
**문제**:
- 투표/댓글이 없을 때 단순 메시지만 표시

**개선 방안**:
- 일러스트레이션 추가
- CTA 버튼 (예: "이슈 둘러보기", "댓글 작성하러 가기")

#### 6. 로딩 상태 UX
**문제**:
- 로딩 중 스켈레톤 UI가 실제 콘텐츠와 다름

**개선 방안**:
- 실제 레이아웃과 동일한 스켈레톤 UI
- 로딩 스피너 추가

---

### 🟢 Low - 선택적 개선

#### 7. 모바일 반응형
**확인 필요**:
- 사이드바 메뉴 오버플로우
- 카드 레이아웃 깨짐

#### 8. 접근성 (a11y)
**확인 필요**:
- 키보드 네비게이션
- 스크린 리더 지원
- ARIA 속성

---

## 🧪 테스트 시나리오

### 1. 로그인/로그아웃 플로우
```
[ ] 비로그인 상태에서 헤더 "마이페이지" 클릭 → 구글 로그인 팝업
[ ] 로그인 성공 → 마이페이지 대시보드 표시
[ ] 로그인 취소 → 무한 루프 없이 홈으로 리다이렉트
[ ] 로그인 상태에서 "마이페이지" 클릭 → 바로 대시보드 표시
```

### 2. 마이페이지 대시보드
```
[ ] 계정 정보 정확히 표시 (이메일, 닉네임, 가입일)
[ ] 활동 통계 정확히 표시 (투표, 댓글, 궁금해요 수)
[ ] 통계 카드 클릭 시 해당 페이지로 이동
[ ] 로딩 중 스켈레톤 UI 표시
```

### 3. 참여한 투표 페이지
```
[ ] 투표 목록 표시 (최신순)
[ ] 필터 동작 (전체/진행중/종료)
[ ] 페이지네이션 동작
[ ] 이슈 카드 클릭 시 상세 페이지 이동
[ ] 빈 데이터 UI 표시
```

### 4. 내가 쓴 댓글 페이지
```
[ ] 댓글 목록 표시 (최신순)
[ ] 이슈 정보 포함 (제목, 썸네일)
[ ] 추천/비추천 수 표시
[ ] 댓글 클릭 시 이슈 페이지로 이동 + 앵커
[ ] 페이지네이션 동작
```

### 5. 궁금해요 누른 제보
```
[ ] /reported-issues 페이지로 리다이렉트
[ ] my_curious=true 필터 자동 적용
[ ] 내가 누른 제보만 표시
```

### 6. UI 개선 확인
```
[ ] 홈 페이지 투표 버튼: "이슈 자세히 보기"
[ ] 이슈 상세 투표 버튼: "진행 중인 투표 모아보기"
[ ] 버튼 클릭 시 올바른 페이지로 이동
```

### 7. 모바일 반응형
```
[ ] 사이드바 햄버거 메뉴 동작
[ ] 카드 레이아웃 깨지지 않음
[ ] 터치 인터랙션 정상 동작
```

---

## 🔧 디버깅 가이드

### 로그 확인 방법

#### 1. 브라우저 콘솔
```javascript
// 네트워크 탭에서 API 요청 확인
// Filter: /api/my/
// Status: 401 → 로그인 필요
// Status: 500 → 서버 에러
```

#### 2. Supabase 로그 확인
```bash
# Supabase SQL Editor에서 직접 쿼리 테스트
SELECT * FROM poll_votes WHERE user_id = 'USER_ID';
SELECT * FROM comments WHERE user_id = 'USER_ID';
```

#### 3. Next.js 개발 서버 로그
```bash
# 터미널에서 확인
# API 호출 로그, 에러 스택 트레이스 확인
```

### 자주 발생하는 에러

#### 1. `401 Unauthorized`
**원인**: 로그인 세션 만료 또는 CSRF 토큰 없음
**해결**:
- 브라우저 쿠키 확인
- `createServerClient()` 정상 동작 확인

#### 2. `Cannot read properties of null`
**원인**: JOIN 결과에서 null 반환
**해결**:
- API 응답에 `.filter(v => v !== null)` 추가
- Supabase 쿼리에 `INNER JOIN` 사용

#### 3. 무한 로딩
**원인**: `useEffect` 의존성 배열 문제
**해결**:
- React DevTools로 리렌더링 확인
- 의존성 배열 최소화

---

## 📊 DB 스키마 정보

### 사용된 테이블

#### 1. `users`
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- nickname (TEXT, UNIQUE)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 2. `poll_votes`
```sql
- id (UUID, PK)
- poll_id (UUID, FK → polls.id)
- user_id (UUID, FK → users.id) -- nullable
- device_hash (TEXT) -- nullable
- created_at (TIMESTAMPTZ)

-- CHECK: (user_id IS NOT NULL AND device_hash IS NULL) OR (user_id IS NULL AND device_hash IS NOT NULL)
```

#### 3. `comments`
```sql
- id (UUID, PK)
- issue_id (UUID, FK → issues.id)
- user_id (UUID, FK → users.id) -- nullable
- user_nick (TEXT)
- body (TEXT)
- up (INTEGER, DEFAULT 0)
- down (INTEGER, DEFAULT 0)
- created_at (TIMESTAMPTZ)
```

#### 4. `report_curious`
```sql
- id (UUID, PK)
- report_id (UUID, FK → reports.id)
- device_hash (TEXT) -- user_id 없음!
- created_at (TIMESTAMPTZ)
```

### ⚠️ 알려진 스키마 이슈

1. **`report_curious`에 `user_id` 없음**
   - 현재: `device_hash`만 사용
   - 문제: 로그인 사용자의 궁금해요 수 카운트 불가능
   - 해결: Phase 2에서 `user_id` 컬럼 추가 필요

2. **`poll_votes`의 `user_id` nullable**
   - 이유: 비로그인 사용자 투표 지원
   - 주의: WHERE 절에서 `IS NOT NULL` 체크 필수

---

## 🚀 다음 작업자를 위한 시작 프롬프트

```
Behind v2 프로젝트의 Phase 1 QA 및 디버깅을 시작하겠습니다.

현재 상황:
- Phase 1 구현 완료 (마이페이지 기본 기능)
- 개발 서버 실행 중: http://localhost:3001
- QA 및 디버깅 필요

인수인계 문서:
- docs/PHASE1_HANDOVER.md 읽기 (이 파일)
- docs/DEVELOPMENT_NOTES.md 참고
- docs/MYPAGE_IMPLEMENTATION_PLAN.md 참고

우선 처리 사항:
1. [Critical] 비로그인 상태 무한 루프 문제 수정
2. [Critical] useEffect 의존성 배열 최적화
3. [Critical] API 에러 처리 강화
4. 전체 테스트 시나리오 실행 및 버그 리포트 작성

첫 작업: 비로그인 상태 무한 루프 문제부터 수정해주세요.
참고 파일: app/my/page.tsx:30-31

작업 전 반드시:
- 개발 서버 실행 (npm run dev)
- 브라우저에서 로그아웃 후 테스트
- 브라우저 콘솔 및 네트워크 탭 확인
```

---

## 📝 Phase 2 준비 사항

Phase 1이 안정화되면 다음 작업을 진행하세요:

### Phase 2: 이슈 팔로우 기능
- **참고 문서**: [docs/MYPAGE_IMPLEMENTATION_PLAN.md](./MYPAGE_IMPLEMENTATION_PLAN.md#phase-2)
- **예상 소요 시간**: 1주일 (13시간)
- **핵심 작업**:
  1. `issue_follows` 테이블 생성
  2. 팔로우/언팔로우 API 구현
  3. 팔로우 버튼 컴포넌트
  4. 팔로우한 이슈 목록 페이지

### Phase 1에서 Phase 2로 넘어가기 전 체크리스트
- [ ] Phase 1의 모든 Critical 버그 수정 완료
- [ ] 전체 테스트 시나리오 통과
- [ ] 사용자 피드백 반영
- [ ] 코드 리뷰 완료
- [ ] 프로덕션 배포 가능 상태

---

## 🤝 도움이 필요한 경우

### 1. DB 스키마 확인
```sql
-- Supabase SQL Editor에서 실행
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'poll_votes'
ORDER BY ordinal_position;
```

### 2. API 테스트
```bash
# 로그인 필요 API 테스트
curl -X GET http://localhost:3001/api/my/profile \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

### 3. Supabase MCP 활용
```typescript
// MCP를 통해 실시간 DB 조회 가능
// Claude에게 "Supabase MCP로 poll_votes 테이블 확인해줘" 요청
```

---

**최종 업데이트**: 2025-11-04
**작성자**: Claude Code
**다음 작업자**: Phase 1 QA 및 디버깅 담당자
