# Behind v2 - 작업 세션 이력

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