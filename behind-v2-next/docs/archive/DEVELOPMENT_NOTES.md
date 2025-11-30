# 개발 노트 (Development Notes)

개발 중 주의해야 할 사항을 기록합니다. 간결하고 명확하게 작성합니다.

---

## 📝 작성 템플릿

```markdown
### [YYYY-MM-DD] 주제

**주의사항**:
- 핵심 내용만 간단히

**관련**: `파일경로` 또는 테이블명

---
```

---

## [2025-11-04] Supabase RPC 함수 작성 시

**주의사항**:
- RPC 함수 작성 전 **반드시 실제 테이블 스키마 확인** (존재하지 않는 컬럼 참조 금지)
- PostgreSQL `RETURNS TABLE` 사용 시 **RETURN QUERY에서 테이블 풀네임 사용**
  ```sql
  -- ❌ ambiguous 에러 발생
  SELECT po.id, po.label, po.vote_count FROM poll_options po

  -- ✅ 명시적 표기
  SELECT poll_options.id, poll_options.label, poll_options.vote_count FROM poll_options
  ```
- DB 스키마 변경 시 **관련 RPC 함수 영향도 확인**

**관련**: `vote_poll_authenticated`, `poll_votes`, `poll_options`

---

## [2025-11-04] 마이페이지 및 신규 기능 구현 시

**⚠️ 작업 전 필수 선행 검토 프로세스**

모든 Phase, 모든 작업을 시작하기 전에 **반드시** 다음 절차를 따르세요!

### 1. 기존 코드 패턴 조사 (필수!)
- 유사한 기능이 이미 구현되어 있는지 **최소 3개 이상** 찾아볼 것
- 기존 API 엔드포인트, 컴포넌트, RPC 함수 구조 확인
- **절대 추측으로 작성 금지!**

### 2. 네이밍 컨벤션 확인 (필수!)
- **테이블명**: `snake_case`, 복수형 (예: `issue_follows`, `notifications`)
- **컬럼명**: `snake_case` (예: `created_at`, `user_id`, `is_read`)
- **FK**: `{테이블명 단수}_id` (예: `issue_id`, `user_id`)
- **API URL**: `kebab-case` (예: `/api/my-votes`, `/api/followed-issues`)
- **RPC 함수**: `snake_case` + 파라미터 `p_` prefix (예: `vote_poll_authenticated(p_poll_id, p_user_id)`)
- **컴포넌트 파일**: `kebab-case` (예: `issue-card.tsx`, `notification-bell.tsx`)
- **컴포넌트 함수**: `PascalCase` (예: `IssueCard`, `NotificationBell`)

### 3. DB 스키마 실제 확인 (필수!)
```sql
-- Supabase SQL Editor에서 실행
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = '{테이블명}'
ORDER BY ordinal_position;
```

### 4. 사용자 검토 필요 시점
다음 경우에는 **반드시 사용자에게 검토 요청**:
- ✋ 완전히 새로운 테이블/컬럼 추가 시 (기존 패턴 없음)
- ✋ 기존 규칙과 다른 네이밍이 필요한 경우
- ✋ 비즈니스 로직 결정 필요 (예: 알림 정책, 공개 범위)
- ✋ 외부 서비스 연동 필요 (예: 이메일 발송)

### 5. 상세 구현 계획 문서
전체 마이페이지 구현 계획은 **[MYPAGE_IMPLEMENTATION_PLAN.md](./MYPAGE_IMPLEMENTATION_PLAN.md)** 참고
- Phase별 상세 작업 목록
- DB 스키마 정의
- API 엔드포인트 명세
- 체크리스트 포함

**관련**: `issue_follows`, `notifications`, `/app/my/*`, [MYPAGE_IMPLEMENTATION_PLAN.md](./MYPAGE_IMPLEMENTATION_PLAN.md)

---

**최종 업데이트**: 2025-11-04
