# Behind v2 마이페이지 - 최종 인수인계 문서

**작성일**: 2025-11-27  
**상태**: ✅ Phase 1 완료 + 버그 수정 완료  
**최종 업데이트**: Session #1 작업 반영

---

## 🎯 현재 상황

## 🎯 현재 상황

**Phase 2 완료 - 이슈 팔로우 기능**

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

### API 엔드포인트
- ✅ `GET /api/my/profile` - 프로필 + 통계
- ✅ `GET /api/my/votes` - 투표 목록
- ✅ `GET /api/my/comments` - 댓글 목록
- ✅ `GET /api/my/follows` - 팔로우한 이슈 목록
- ✅ `POST /api/issues/[id]/follow` - 이슈 팔로우
- ✅ `DELETE /api/issues/[id]/follow` - 이슈 언팔로우
- ✅ `GET /api/issues/[id]/follow` - 팔로우 상태 확인
- ✅ `POST /api/reports/[id]/curious` - 궁금해요 (user_id 추가)

---

## 🛠️ 주요 기술 및 패턴

### Supabase 클라이언트 사용 원칙
```typescript
// ❌ 사용자별 데이터 조회 시 절대 사용 금지
const supabase = createClient(ANON_KEY)

// ✅ 사용자별 데이터 조회 시 필수
const supabaseServer = await createServerClient()
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
├── page.tsx             # 대시보드
├── votes/page.tsx       # 투표
├── comments/page.tsx    # 댓글
├── curious/page.tsx     # 궁금해요
└── follows/page.tsx     # 팔로우한 이슈 (신규)

app/api/my/
├── profile/route.ts     # 프로필 + 통계
├── votes/route.ts       # 투표 목록
├── comments/route.ts    # 댓글 목록
└── follows/route.ts     # 팔로우한 이슈 목록 (신규)

app/api/issues/[id]/
└── follow/route.ts      # 팔로우/언팔로우/상태확인 (신규)

components/
├── issue-follow-button.tsx  # 팔로우 버튼 (신규)
└── useFetchWithRetry.ts     # 재시도 로직
```

---

## ⚠️ 알려진 제약사항 및 주의사항

### 1. 기존 궁금해요 데이터
- user_id=null인 기존 데이터는 마이페이지에 카운트 안됨
- 새로 클릭한 것만 추적됨

### 2. Rate Limiter 의존성
- Upstash Redis 상태 확인 필요
- 연결 실패 시 API 전체 블로킹 가능성
- **권장**: Fallback 로직 추가

### 3. 디버깅 로그
배포 전 제거 필요:
- `app/my/votes/page.tsx` - [DEBUG] 로그
- `hooks/useFetchWithRetry.ts` - [FETCH] 로그

---

## 🚀 다음 단계 (Phase 3)

### 추가 마이페이지 기능
**예상 소요**: 1.5주일 (18시간)

**작업 내용**:
1. 참여한 채팅방 목록 페이지
2. 다른 사용자 프로필 조회
3. 프로필 설정 페이지
4. 헤더 네비게이션 업데이트

**참고 문서**: `MYPAGE_IMPLEMENTATION_PLAN.md` Phase 3 섹션

---

## 📚 참고 문서

| 문서 | 내용 |
|------|------|
| **SESSION_HISTORY.md** | 작업 세션 이력 및 버그 수정 상세 |
| **MYPAGE_IMPLEMENTATION_PLAN.md** | Phase 2~5 구현 계획 |
| **DEVELOPMENT_NOTES.md** | 개발 규칙 및 컨벤션 |
| **ADMIN_GUIDE.md** | 관리자 가이드 |

---

## 🧪 테스트 체크리스트

### 마이페이지 기능
- [ ] 대시보드 통계 정확성 (투표/댓글/궁금해요)
- [ ] 닉네임 정상 표시
- [ ] 투표 목록 조회 및 필터
- [ ] 댓글 목록 조회
- [ ] 페이지네이션 동작

### 참여 기능
- [ ] 댓글 작성 후 마이페이지 반영
- [ ] 투표 참여 후 마이페이지 반영
- [ ] 궁금해요 클릭 후 마이페이지 반영
- [ ] Rate Limiter 정상 작동

### RLS 정책
- [ ] 다른 사용자 데이터 접근 차단
- [ ] 본인 데이터만 조회 가능

---

## ✅ Phase 1 완료 확인

- [x] 모든 API 엔드포인트 구현
- [x] RLS 정책 설정
- [x] 무한 루프 버그 수정
- [x] 닉네임 표시 오류 수정
- [x] 카운트 정확성 개선
- [x] 궁금해요 user_id 추적
- [x] 빌드 성공
- [x] 타입 체크 성공

---

**최종 업데이트**: 2025-11-27  
**담당자**: Claude + Jaden  
**상태**: Phase 2 완료, Phase 3 대기 중
