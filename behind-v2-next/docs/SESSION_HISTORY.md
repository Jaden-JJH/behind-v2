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
