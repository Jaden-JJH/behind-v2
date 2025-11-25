# Behind v2 Phase 2 - 인수인계 프롬프트

> 이 파일을 Claude Code에게 복사/붙여넣기로 전달하세요.

---

## 📋 현재 상황

**Behind v2 마이페이지 (Phase 1)가 완료되었습니다.**

- ✅ 마이페이지 전체 기능 구현 완료
- ✅ 모든 API 엔드포인트 작동 중
- ✅ 문서 정리 완료

**이제 Phase 2를 시작하려고 합니다.**

---

## 📖 먼저 읽어야 할 문서들

### 1단계: 현황 파악 (필수)
```
경로: docs/README.md
내용: 프로젝트 개요 및 문서 네비게이션
소요시간: 2분
```

### 2단계: Phase 1 완료 현황 (필수)
```
경로: docs/HANDOVER.md
내용: 완료된 기능, 기술 스택, 주의사항
소요시간: 5분
```

### 3단계: 개발 규칙 확인 (필수)
```
경로: docs/DEVELOPMENT_NOTES.md
내용: 네이밍 컨벤션, DB 스키마, 체크리스트
소요시간: 3분
```

### 4단계: Phase 2 계획 확인 (필수)
```
경로: docs/MYPAGE_IMPLEMENTATION_PLAN.md (Phase 2 섹션)
내용: Phase 2 기능 상세, API 명세, DB 스키마
소요시간: 10분
```

---

## 🚀 Phase 2 작업 내용

### 주제: 이슈 팔로우 기능

### 할 일 (우선순위 순)

1. **DB 마이그레이션** (1시간)
   - `issue_follows` 테이블 생성
   - 참고: `MYPAGE_IMPLEMENTATION_PLAN.md` Phase 2 DB 스키마

2. **API 구현** (4시간)
   - `POST /api/my/follows` - 팔로우
   - `DELETE /api/my/follows/:issueId` - 언팔로우
   - `GET /api/my/follows` - 팔로우 목록 조회
   - 참고: `MYPAGE_IMPLEMENTATION_PLAN.md` API 명세

3. **프론트엔드 구현** (6시간)
   - 팔로우 버튼 컴포넌트
   - 팔로우한 이슈 목록 페이지 (`/my/follows`)
   - 사이드바 메뉴 추가

4. **테스트 및 최적화** (2시간)
   - 모든 기능 테스트
   - 모바일 반응형 확인
   - 성능 최적화

---

## ⚠️ 주의사항

### 필수 확인 사항

1. **로그인 필수**
   - 모든 API는 로그인 상태 확인 필수
   - 참고: `app/api/my/profile/route.ts`의 구현 방식을 따르세요

2. **Null 체크**
   - API 응답은 항상 null 가능성 체크
   - 참고: `app/my/votes/page.tsx` 182번 라인

3. **useCallback 메모이제이션**
   - useEffect에서 비동기 함수 사용 시 useCallback 필수
   - 참고: `app/my/votes/page.tsx` 67-82번 라인

4. **에러 처리**
   - 401 에러: 로그인 필요
   - 네트워크 에러: useFetchWithRetry 훅 사용
   - 참고: `hooks/useFetchWithRetry.ts`

### 네이밍 컨벤션

```
테이블: snake_case (issue_follows)
API 엔드포인트: /api/my/[기능]
컴포넌트: PascalCase (FollowButton)
함수/변수: camelCase (handleFollow)
```

### DB 스키마 주의

```
- report_curious 테이블에 user_id 없음
  → Phase 2에서 추가 필요 (마지막에 처리)
- poll_votes.user_id는 nullable (비로그인 투표)
  → issue_follows는 로그인 필수이므로 NOT NULL
```

---

## 🛠️ 개발 환경 세팅

### 1. 코드 확인
```bash
npm run build          # 빌드 성공 확인
npx tsc --noEmit      # 타입 체크
```

### 2. 개발 서버 실행
```bash
npm run dev
# http://localhost:3001/my
```

### 3. 테스트
```javascript
// 브라우저 콘솔에서
const res = await fetch('/api/my/follows')
console.log(await res.json())
```

---

## 📂 참고할 파일들

### Phase 1 구현 참고
- `app/my/layout.tsx` - 레이아웃 구조
- `app/my/votes/page.tsx` - 페이지 구현 예시
- `app/api/my/votes/route.ts` - API 구현 예시
- `hooks/useFetchWithRetry.ts` - 재시도 로직

### 스타일 참고
- `app/my/votes/page.tsx` - UI 구조
- `components/ui/card.tsx` - 카드 컴포넌트
- `components/ui/button.tsx` - 버튼 컴포넌트

---

## ✅ 작업 체크리스트

### DB 마이그레이션
- [ ] `supabase/migrations/` 폴더에 마이그레이션 파일 생성
- [ ] `issue_follows` 테이블 생성
- [ ] RLS 정책 설정 (로그인 필수)

### API 구현
- [ ] `app/api/my/follows/route.ts` - GET/POST
- [ ] `app/api/my/follows/[issueId]/route.ts` - DELETE
- [ ] 401/에러 처리
- [ ] null 체크

### 프론트엔드
- [ ] `components/FollowButton.tsx` - 팔로우 버튼
- [ ] `app/my/follows/page.tsx` - 팔로우 목록 페이지
- [ ] `app/my/layout.tsx` - 사이드바 메뉴 추가

### 테스트
- [ ] 로그인 후 팔로우 가능
- [ ] 팔로우 취소 가능
- [ ] 팔로우 목록 표시
- [ ] 페이지네이션 동작
- [ ] 모바일 반응형
- [ ] 빌드 성공

---

## 📞 문제 발생 시

### 로그인 관련
- 확인: `hooks/useAuth.ts`
- 참고: `app/my/votes/page.tsx` 49-64번 라인

### API 호출 관련
- 확인: `hooks/useFetchWithRetry.ts`
- 재시도: 3회, 타임아웃: 10초

### UI/스타일 관련
- 참고: `app/my/votes/page.tsx` 전체 구조
- 사용: Tailwind CSS + `components/ui/*`

### DB 관련
- Supabase 대시보드에서 테이블 확인
- RLS 정책 활성화 확인

---

## 🎯 완료 기준

### Phase 2 완료 조건
- [ ] 모든 API 엔드포인트 구현
- [ ] 프론트엔드 UI 완료
- [ ] 로그인 필수 체크 구현
- [ ] 모든 기능 테스트 완료
- [ ] 빌드 성공
- [ ] 타입 체크 성공
- [ ] 문서 업데이트 (선택)

---

## 📝 마지막 체크

시작 전 확인사항:
- [ ] `docs/README.md` 읽음
- [ ] `docs/HANDOVER.md` 읽음
- [ ] `docs/DEVELOPMENT_NOTES.md` 읽음
- [ ] `docs/MYPAGE_IMPLEMENTATION_PLAN.md` Phase 2 섹션 읽음
- [ ] `npm run build` 성공
- [ ] `npm run dev` 실행 가능

---

**준비 완료! Phase 2를 시작하세요!** 🚀

예상 소요 시간: 1주일 (13시간)
