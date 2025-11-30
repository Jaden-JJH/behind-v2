# Behind v2 - 최종 인수인계 문서

**작성일**: 2025-11-27  
**최종 업데이트**: 2025-11-30
**상태**: ✅ Phase 3.3 + 메인 노출 관리 완료

---

## 🎯 현재 상황

**Phase 3.3 완료 + 메인 노출 관리 구현 완료**

### ✅ 완료된 작업

**Phase 1 (기본 마이페이지):**
- 마이페이지 레이아웃 (대시보드 + 사이드바)
- 투표/댓글/궁금해요 페이지
- API 엔드포인트 구현
- 사용자 인증 및 권한 관리

**Phase 2 (이슈 팔로우):**
- issue_follows 테이블 생성 및 RLS 정책
- 팔로우/언팔로우 API (POST, DELETE, GET)
- 팔로우 버튼 컴포넌트
- 이슈 상세 페이지에 팔로우 버튼 추가
- 팔로우한 이슈 목록 페이지
- 마이페이지 사이드바 메뉴 추가

**Phase 3.1 (참여한 채팅방):**
- 채팅방 목록 조회 API
- 참여 중인 채팅방 페이지
- 마지막 활동 시간 표시

**Phase 3.2 (사용자 프로필 조회):**
- 사용자 프로필 조회 API (GET /api/users/[nickname])
- 사용자 프로필 페이지 (/users/[nickname])
- 반응형 프로필 모달 (Desktop: Dialog, Mobile: Drawer)
- useMediaQuery 훅 구현
- 댓글/채팅에서 닉네임 클릭 → 프로필 모달
- 익명 사용자 처리 ("익명" 표시, 클릭 불가)

**Phase 3.3 (대시보드 계정 관리):**
- 닉네임 변경 모달 구현
- 회원 탈퇴 모달 구현 (2단계 확인)
- PUT /api/auth/update-nickname - 닉네임 변경
- DELETE /api/auth/delete-account - 회원 탈퇴
- deleted_at 컬럼 추가 (Soft Delete)
- 클라이언트 로그아웃 상태 즉시 반영

**메인 노출 관리 (Phase 1):**
- 어드민 이슈 페이지에 메인 노출 설정 카드 추가
- HOT 이슈 2개 + 투표 2개 슬롯 드롭다운 관리
- PUT /api/admin/issues/main-display API 구현
- 수정 모달에서 메인 노출 체크박스 제거 (중복 방지)
- 어드민 이슈 API에 poll 객체 추가 (투표 필터링용)

**프로덕션 버그 수정:**
- 승인되지 않은 이슈 노출 버그 수정 (approval_status 필터링)
- 투표 옵션 초기화 버그 수정 (snake_case vs camelCase 처리)

**Session #1 버그 수정:**
- useFetchWithRetry 무한 루프 해결
- RLS 정책 문제 해결
- 닉네임 표시 오류 수정
- 대시보드 카운트 정확성 개선
- 궁금해요 user_id 추적 구현

---

## 완료된 기능

### 마이페이지 대시보드 (`/my`)
- ✅ 계정 정보 (닉네임, 이메일, 가입일)
- ✅ 활동 통계 (투표, 댓글, 궁금해요)
- ✅ 닉네임 변경 모달 (30일 제한)
- ✅ 회원 탈퇴 모달 (2단계 확인)

### 참여한 투표 (`/my/votes`)
- ✅ 투표 목록 조회
- ✅ 필터: 전체/진행중/종료
- ✅ 페이지네이션

### 내가 쓴 댓글 (`/my/comments`)
- ✅ 댓글 목록 + 이슈 정보
- ✅ 추천/비추천 수 표시
- ✅ 페이지네이션

### 궁금해요 (`/my/curious`)
- ✅ user_id 추적 기능 추가
- ✅ 마이페이지 카운트 반영

### 팔로우한 이슈 (`/my/follows`)
- ✅ 팔로우한 이슈 목록 조회
- ✅ 필터: 전체/진행중/종료
- ✅ 페이지네이션
- ✅ 팔로우/언팔로우 버튼 (이슈 상세 페이지)

### 참여한 채팅방 (`/my/chat-rooms`)
- ✅ 채팅방 목록 조회
- ✅ 마지막 활동 시간 표시

### 사용자 프로필
- ✅ 프로필 조회 API
- ✅ 프로필 페이지 (/users/[nickname])
- ✅ 반응형 프로필 모달 (데스크탑: Dialog, 모바일: Drawer)
- ✅ 댓글/채팅 닉네임 클릭 → 모달
- ✅ 익명 사용자 처리

### 메인 노출 관리
- ✅ 어드민 이슈 페이지 메인 노출 설정 UI
- ✅ HOT 이슈 2개 슬롯 (드롭다운)
- ✅ 투표 2개 슬롯 (드롭다운, 투표 있는 이슈만)
- ✅ 중복 노출 방지
- ✅ 메인 노출 저장 API

### API 엔드포인트
- ✅ `GET /api/my/profile` - 프로필 + 통계
- ✅ `GET /api/my/votes` - 투표 목록
- ✅ `GET /api/my/comments` - 댓글 목록
- ✅ `GET /api/my/follows` - 팔로우한 이슈 목록
- ✅ `GET /api/my/chat-rooms` - 참여한 채팅방 목록
- ✅ `POST /api/issues/[id]/follow` - 이슈 팔로우
- ✅ `DELETE /api/issues/[id]/follow` - 이슈 언팔로우
- ✅ `GET /api/issues/[id]/follow` - 팔로우 상태 확인
- ✅ `POST /api/reports/[id]/curious` - 궁금해요 (user_id 추가)
- ✅ `GET /api/users/[nickname]` - 사용자 프로필 조회
- ✅ `PUT /api/auth/update-nickname` - 닉네임 변경
- ✅ `DELETE /api/auth/delete-account` - 회원 탈퇴
- ✅ `PUT /api/admin/issues/main-display` - 메인 노출 설정
- ✅ `GET /api/admin/issues` - 어드민 이슈 목록 (poll 객체 포함)

---

## 🛠️ 주요 기술 및 패턴

### Supabase 클라이언트 사용 원칙
```typescript
// ❌ 사용자별 데이터 조회 시 절대 사용 금지
const supabase = createClient(ANON_KEY)

// ✅ 사용자별 데이터 조회 시 필수
const supabaseServer = await createServerClient()
```

### Supabase SELECT 쿼리 (JOIN)
```typescript
// ✅ 백틱 + 여러 줄 사용
.select(`
  id, title, category,
  poll:polls(
    id,
    question
  )
`)

// ✅ count 옵션과 함께 사용 가능
.select(
  `id, title, poll:polls(id, question)`,
  { count: 'exact' }
)
```

### useFetchWithRetry 훅
```typescript
// ✅ 네이티브 API 명시
const response = await window.fetch(url, {
  signal: controller.signal,
})

// 설정
재시도: 3회
타임아웃: 10초
재시도 간격: 1초
401 에러: 재시도 안함
```

### useMediaQuery 훅
```typescript
// 반응형 UI 처리
const isDesktop = useMediaQuery('(min-width: 768px)')

// Desktop: Dialog, Mobile: Drawer
if (isDesktop) {
  return <Dialog>...</Dialog>
}
return <Drawer>...</Drawer>
```

### RLS 정책 체크리스트
새 테이블 생성 시 반드시 확인:
- [ ] SELECT 정책
- [ ] INSERT 정책
- [ ] UPDATE 정책 (필요시)
- [ ] DELETE 정책 (필요시)

---

## 📂 파일 구조
```
app/my/
├── layout.tsx           # 사이드바 (팔로우 메뉴 추가됨)
├── page.tsx             # 대시보드 (닉네임 변경/회원 탈퇴)
├── votes/page.tsx       # 투표
├── comments/page.tsx    # 댓글
├── curious/page.tsx     # 궁금해요
├── follows/page.tsx     # 팔로우한 이슈
└── chat-rooms/page.tsx  # 참여한 채팅방

app/users/
└── [nickname]/page.tsx  # 사용자 프로필 페이지

app/admin/issues/
└── page.tsx             # 어드민 이슈 관리 (메인 노출 설정 추가)

app/api/my/
├── profile/route.ts     # 프로필 + 통계
├── votes/route.ts       # 투표 목록
├── comments/route.ts    # 댓글 목록
├── follows/route.ts     # 팔로우한 이슈 목록
└── chat-rooms/route.ts  # 참여한 채팅방 목록

app/api/users/
└── [nickname]/route.ts  # 사용자 프로필 조회

app/api/auth/
├── update-nickname/route.ts  # 닉네임 변경
└── delete-account/route.ts   # 회원 탈퇴

app/api/issues/
└── [id]/follow/route.ts      # 팔로우/언팔로우/상태확인

app/api/admin/issues/
├── route.ts                  # 어드민 이슈 목록 (poll 객체 추가)
└── main-display/route.ts     # 메인 노출 설정

components/
├── issue-follow-button.tsx      # 팔로우 버튼
├── user-profile-drawer.tsx      # 사용자 프로필 모달
└── useFetchWithRetry.ts         # 재시도 로직

hooks/
├── useAuth.ts
├── useFetchWithRetry.ts
└── use-media-query.ts           # 반응형 훅
```

---

## ⚠️ 알려진 제약사항 및 주의사항

### 1. 기존 궁금해요 데이터
- user_id=null인 기존 데이터는 마이페이지에 카운트 안됨
- 새로 클릭한 것만 추적됨

### 2. 익명 댓글 처리
- user_id=null인 댓글은 "익명" 표시
- 프로필 모달 클릭 불가

### 3. Rate Limiter 의존성
- Upstash Redis 상태 확인 필요
- 연결 실패 시 API 전체 블로킹 가능성
- **권장**: Fallback 로직 추가

### 4. 메인 노출 관리
- 기존 체크박스 방식에서 드롭다운 방식으로 변경
- 중복 노출 방지 (HOT 2개 + 투표 2개 슬롯)
- 투표 슬롯은 투표가 있는 이슈만 선택 가능

### 5. 디버깅 로그
배포 전 제거 필요:
- `app/my/votes/page.tsx` - [DEBUG] 로그
- `hooks/useFetchWithRetry.ts` - [FETCH] 로그

---

## 📚 참고 문서

| 문서 | 내용 |
|------|------|
| **README.md** | 시작 가이드 및 문서 구조 |
| **DEVELOPMENT_NOTES.md** | 개발 규칙 및 컨벤션 |
| **ADMIN_GUIDE.md** | 관리자 가이드 (후속 기사 타임라인) |
| **archive/SESSION_HISTORY.md** | 작업 세션 이력 (참고용) |
| **archive/MYPAGE_IMPLEMENTATION_PLAN.md** | Phase 구현 계획 (완료됨) |

---

## 🧪 테스트 체크리스트

### 마이페이지 기능
- [x] 대시보드 통계 정확성 (투표/댓글/궁금해요)
- [x] 닉네임 정상 표시
- [x] 투표 목록 조회 및 필터
- [x] 댓글 목록 조회
- [x] 페이지네이션 동작
- [x] 닉네임 변경 모달 (30일 제한)
- [x] 회원 탈퇴 모달 (2단계 확인)

### 프로필 기능
- [x] 댓글 닉네임 클릭 → 모달 오픈
- [x] 채팅 닉네임 클릭 → 모달 오픈
- [x] 데스크탑: Dialog 표시
- [x] 모바일: Drawer 표시
- [x] 프로필 자세히 보기 → 페이지 이동
- [x] 익명 사용자 "익명" 표시

### 팔로우 기능
- [x] 이슈 팔로우/언팔로우 동작
- [x] 팔로우한 이슈 목록 조회
- [x] 필터 동작 (전체/진행중/종료)

### 채팅방 기능
- [x] 참여한 채팅방 목록 조회
- [x] 마지막 활동 시간 표시

### 메인 노출 관리
- [x] HOT 이슈 드롭다운 (승인된 이슈만)
- [x] 투표 드롭다운 (투표 있는 이슈만)
- [x] 저장 버튼 동작
- [x] 중복 노출 방지 확인
- [x] 홈페이지 메인 노출 정상 작동

### 참여 기능
- [x] 댓글 작성 후 마이페이지 반영
- [x] 투표 참여 후 마이페이지 반영
- [x] 궁금해요 클릭 후 마이페이지 반영
- [x] Rate Limiter 정상 작동

### RLS 정책
- [x] 다른 사용자 데이터 접근 차단
- [x] 본인 데이터만 조회 가능

---

## 🎯 남은 작업

### 실시간 인기 이슈 (선택적)
**현재 상태:** 홈페이지 하드코딩
**구현 방안:**
- 초기 3-4개월: 하드코딩으로 수동 관리
- 트래픽 증가 시: 조회수/댓글/투표 기반 알고리즘 구현

**예상 소요:** 3-4시간 (API 연동)

---

## 🚀 배포 체크리스트

### 환경 변수
- [x] Vercel 환경 변수 설정
- [x] Supabase Redirect URLs
- [x] Upstash Redis 설정

### 보안
- [x] CSRF 보호 작동
- [x] Rate Limiter 작동
- [x] 어드민 비밀번호 설정

### 성능
- [x] 주요 페이지 로딩 속도
- [x] API 응답 속도
- [ ] 디버깅 로그 제거 (배포 전)

### 기능
- [x] 마이페이지 모든 기능
- [x] 이슈 팔로우
- [x] 사용자 프로필
- [x] 메인 노출 관리
- [ ] 실시간 인기 이슈 (선택적)

---

**최종 업데이트**: 2025-11-30  
**작성자**: Jaden + Claude  
**상태**: 프로덕션 배포 완료, 실시간 인기 이슈만 선택적 구현 대기