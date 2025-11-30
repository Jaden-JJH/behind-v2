# 마이페이지 및 부가 기능 구현 로드맵

**프로젝트**: Behind v2.0
**작성일**: 2025-11-04
**최종 업데이트**: 2025-11-04

---

## 📚 시작하기 전에

### 필수 참고 문서
- **[DEVELOPMENT_NOTES.md](./DEVELOPMENT_NOTES.md)** - 네이밍 컨벤션, 선행 검토 프로세스

### 작업 원칙
1. **기존 코드 3개 이상 확인** - 추측 금지, 패턴 학습
2. **실제 DB 스키마 확인** - Supabase SQL Editor 활용
3. **Phase별 인수인계** - 다음 Phase 작업자를 위한 문서화
4. **불확실하면 사용자 검토** - 새로운 결정 사항은 반드시 확인

---

## 🎯 전체 목표

사용자가 자신의 활동을 추적하고 관심 이슈를 팔로우하여 참여도를 높이는 개인화 기능 구현

### 핵심 요구사항
1. ✅ 마이페이지 (계정 정보, 가입일시)
2. 🔥 이슈 팔로우 (핵심 기능!)
3. 📊 활동 모아보기 (투표, 댓글, 궁금해요)
4. 👥 사용자 프로필 조회
5. 🔔 알림 시스템 (선택적)
6. 🎨 UI 개선 (버튼 텍스트 등)

---

## 🚀 Phase 1: 기본 마이페이지 (1주일, ~15시간)

### 목표
빠른 가치 제공 - 사용자 활동 내역 조회 및 UI 개선

### 작업 목록

#### 1.1 마이페이지 레이아웃 (3시간)
- [ ] `/app/my/layout.tsx` - 사이드바 네비게이션 레이아웃
- [ ] `/app/my/page.tsx` - 대시보드 (계정 정보 요약)
- [ ] `/components/my/sidebar-nav.tsx` - 사이드바 컴포넌트

**참고 파일**: `/app/admin/layout.tsx`, `/components/Header.tsx`

**사이드바 메뉴 구조**:
```
- 대시보드 (/my)
- 참여한 투표 (/my/votes)
- 내가 쓴 댓글 (/my/comments)
- 궁금해요 누른 제보 (/my/curious)
[Phase 2] 팔로우한 이슈 (/my/followed-issues)
[Phase 3] 참여한 채팅방 (/my/chat-rooms)
[Phase 3] 설정 (/my/settings)
[Phase 4] 알림 (/my/notifications)
```

#### 1.2 내 계정 정보 API (1시간)
- [ ] `GET /api/my/profile` - 이메일, 닉네임, 가입일, 통계

**참고 파일**: `/app/api/auth/me/route.ts`

**응답 구조**:
```typescript
{
  email, nickname, created_at,
  stats: { vote_count, comment_count, curious_count }
}
```

**확인 필요**: `users` 테이블 스키마, 통계 계산 방법

#### 1.3 내가 투표한 이슈 모아보기 (5시간)
- [ ] `GET /api/my/votes` - 투표 내역 (페이지네이션)
- [ ] `/app/my/votes/page.tsx` - 투표 목록 페이지

**참고 파일**: `/app/api/vote/route.ts`, `/app/issues/page.tsx`, `/components/issue-card.tsx`

**기능**:
- 투표한 이슈 목록 (이슈 정보 + 내가 선택한 옵션)
- 필터: 전체/진행중/종료
- 페이지네이션 또는 무한 스크롤

**확인 필요**: `poll_votes` 테이블에 `user_id` 존재 여부, JOIN 구조

#### 1.4 내가 쓴 댓글 목록 (4시간)
- [ ] `GET /api/my/comments` - 댓글 내역 (페이지네이션)
- [ ] `/app/my/comments/page.tsx` - 댓글 목록 페이지

**참고 파일**: `/app/api/comments/route.ts`, `/app/issues/[id]/page.tsx`

**기능**:
- 댓글 목록 (이슈 제목 + 댓글 내용 미리보기 + 추천수)
- 클릭 시 해당 이슈로 이동 (앵커: `#comment-{id}`)

**확인 필요**: `comments` 테이블에 `user_id` 존재 여부

#### 1.5 내가 궁금해요 누른 제보 (1시간)
- [ ] `/app/my/curious/page.tsx` - 기존 제보 페이지 재사용

**참고 파일**: `/app/reported-issues/page.tsx`

**노트**: 이미 80% 완성됨! `my_curious=true` 필터 적용만 하면 됨

#### 1.6 UI 개선 (1시간)
- [ ] 홈 - 실시간 투표 하단 버튼: "이슈 자세히 보기"로 변경
- [ ] 이슈 상세 - 투표 하단 버튼: "진행 중인 투표 모아보기"로 변경

**수정 파일**: `/app/page.tsx`, `/app/issues/[id]/page.tsx`

### Phase 1 완료 체크리스트
- [ ] 로그인 필수 확인 (401 에러 테스트)
- [ ] 빈 데이터 UI 확인
- [ ] 페이지네이션 동작 확인
- [ ] 모바일 반응형 확인
- [ ] 헤더에 "마이페이지" 링크 추가

### 다음 Phase 인수인계
- `users`, `poll_votes`, `comments` 테이블 구조 문서화
- 마이페이지 레이아웃 컴포넌트 사용법 정리
- 페이지네이션 구현 방식 공유

---

## 🔥 Phase 2: 이슈 팔로우 (1주일, ~13시간)

### 목표
핵심 기능 구현 - 사용자가 관심 이슈를 추적할 수 있게 함

### 작업 목록

#### 2.1 DB 스키마 생성 (1시간)
- [ ] `issue_follows` 테이블 생성
- [ ] 인덱스 생성 (`user_id`, `issue_id`, `created_at`)
- [ ] RLS 정책 설정 (본인만 조회/추가/삭제)
- [ ] `issues.follower_count` 컬럼 추가 (선택적)
- [ ] 트리거: 팔로우 추가/삭제 시 카운트 자동 업데이트 (선택적)

**마이그레이션 파일**: `/supabase/migrations/YYYYMMDDHHMMSS_create_issue_follows.sql`

**스키마 구조**:
```sql
issue_follows (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  issue_id UUID REFERENCES issues(id),
  created_at TIMESTAMP,
  UNIQUE(user_id, issue_id)
)
```

**확인 필요**: `issues` 테이블에 `follower_count` 추가 가능 여부

#### 2.2 팔로우/언팔로우 API (2시간)
- [ ] `POST /api/issues/[id]/follow` - 팔로우 추가
- [ ] `DELETE /api/issues/[id]/follow` - 언팔로우
- [ ] `GET /api/issues/[id]/follow` - 팔로우 상태 확인

**참고 파일**: `/app/api/vote/route.ts`, `/app/api/comments/route.ts`

**기능**:
- 중복 팔로우 방지
- CSRF 보호 (`withCsrfProtection`)
- 로그인 필수

#### 2.3 팔로우 버튼 컴포넌트 (3시간)
- [ ] `/components/issue-follow-button.tsx` - 팔로우 토글 버튼

**기능**:
- Optimistic UI 업데이트
- 로딩 상태 표시
- 팔로워 수 표시 (선택적)

**적용 위치**:
- 이슈 상세 페이지 (`/app/issues/[id]/page.tsx`)
- IssueCard 컴포넌트 (`/components/issue-card.tsx`, 선택적)

**참고**: 기존 Button 컴포넌트, useAuth 훅

#### 2.4 팔로우한 이슈 목록 (4시간)
- [ ] `GET /api/my/followed-issues` - 팔로우한 이슈 목록
- [ ] `/app/my/followed-issues/page.tsx` - 팔로우 이슈 페이지

**기능**:
- 이슈 카드 목록 (기존 `IssueCard` 재사용)
- 팔로우한 날짜 표시
- 필터: 전체/진행중/종료
- 정렬: 최신 팔로우순/이슈 생성일순

#### 2.5 새 댓글/업데이트 배지 (3시간, 선택적)
- [ ] 팔로우한 이슈에 새 활동 발생 시 배지 표시

**구현 방법**:
- `issue_follows`에 `last_checked_at` 컬럼 추가
- 이슈의 `updated_at`과 비교

### Phase 2 완료 체크리스트
- [ ] 팔로우/언팔로우 동작 확인
- [ ] `follower_count` 정확성 확인 (트리거 사용 시)
- [ ] RLS 정책 테스트 (다른 사용자 데이터 접근 차단)
- [ ] Optimistic UI 업데이트 확인
- [ ] 사이드바에 "팔로우한 이슈" 메뉴 추가

### 다음 Phase 인수인계
- `issue_follows` 테이블 구조 및 RLS 정책 문서화
- 팔로우 버튼 컴포넌트 Props 인터페이스 공유
- 알림 시스템을 위한 이벤트 후킹 포인트 정리

---

## 💎 Phase 3: 추가 마이페이지 기능 (1.5주일, ~18시간)

### 목표
사용자 경험 개선 - 채팅방, 사용자 프로필, 계정 관리

### 작업 목록

#### 3.1 참여한 채팅방 목록 (5시간)
- [ ] `GET /api/my/chat-rooms` - 채팅방 목록
- [ ] `/app/my/chat-rooms/page.tsx` - 채팅방 페이지

**참고 파일**: `/app/chat/[id]/page.tsx`, `/app/api/chat/rooms/[issueId]/route.ts`

**기능**:
- 참여 중인 채팅방 목록
- 마지막 활동 시간 표시
- 활성 멤버 수 (선택적)

**확인 필요**: `chat_members` 테이블에 `user_id` 존재 여부, 세션 만료 처리

#### 3.2 다른 사용자 프로필 (7시간) ✅ 완료
- [x] `GET /api/users/[nickname]` - 사용자 프로필 조회
- [x] `/app/users/[nickname]/page.tsx` - 프로필 페이지
- [x] 댓글/채팅에서 닉네임 클릭 → 프로필 모달
- [x] 반응형 모달 (Desktop: Dialog, Mobile: Drawer)
- [x] useMediaQuery 훅 구현

**프로필 공개 정보**:
- 닉네임, 가입일 (YYYY년 MM월)
- 활동 통계 (댓글 수, 투표 수)
- 최근 댓글 3개 미리보기

**비공개 정보**: 이메일 주소

**구현 완료**: 2025-11-28

#### 3.3 대시보드 계정 관리 (수정안) (4시간)
- [ ] 닉네임 변경 모달 구현
- [ ] 회원 탈퇴 모달 구현
- [ ] `PUT /api/auth/update-nickname` - 닉네임 변경 (기존 재사용)
- [ ] `DELETE /api/auth/delete-account` - 회원 탈퇴 (신규)

**변경사항**: 
- ~~별도 설정 페이지~~ → 대시보드 (`/app/my/page.tsx`) 내 통합
- ~~프로필 사진 업로드~~ → Phase 4 이후로 연기

**기능**:
- 대시보드 "계정 정보" 섹션에 통합
- 닉네임 옆 [수정] 버튼 → 모달
- 하단 [회원 탈퇴] 버튼 (빨간색, 작게)
- 회원 탈퇴 확인 모달 (2단계 확인)

**닉네임 변경 제약**:
- 30일에 1회만 가능
- 2-20자
- 한글/영문/숫자만 가능
- 중복 불가

**회원 탈퇴**:
- 확인 모달 (2단계)
- 모든 데이터 삭제 또는 익명화
- Supabase Auth 계정 삭제

**참고 파일**: `/app/api/auth/update-nickname/route.ts`

#### 3.4 헤더 네비게이션 업데이트 (스킵)
- ~~헤더에 프로필 드롭다운 메뉴 추가~~
- ~~"내 대화방" 버튼 활성화~~

**변경사항**: 
- GNB에 마이페이지 직접 접근 가능
- 추가 드롭다운 불필요
- **작업 스킵**

### Phase 3 완료 체크리스트
- [ ] 채팅방 목록 정확성 확인
- [x] 다른 사용자 프로필 조회 확인
- [x] 프로필 모달 (Desktop/Mobile) 확인
- [ ] 닉네임 변경 동작 확인
- [ ] 회원 탈퇴 동작 확인
- [ ] 30일 제한 정책 확인

### 다음 Phase 인수인계
- 사용자 프로필 API 명세 공유 ✅
- 닉네임 변경 API 재사용 가이드
- 회원 탈퇴 정책 및 데이터 처리 방안

---

## 🔔 Phase 4: 알림 시스템 (2주일, ~15-23시간, 선택적)

### 목표
사용자 재방문 유도 - 인앱 알림 (+ 선택적 이메일)

### ⚠️ 시작 전 사용자 검토 필요

다음 사항을 확정해야 합니다:
1. **알림 타입**: 팔로우 이슈 새 댓글, 새 투표, 새 후속 기사, 내 댓글 답글 등
2. **이메일 알림 구현 여부**: Resend, SendGrid 등 서비스 선택 및 비용 확인
3. **알림 발송 주기**: 실시간 vs 배치 (하루 1회 요약)

### 작업 목록

#### 4.1 DB 스키마 생성 (2시간)
- [ ] `notifications` 테이블 생성
- [ ] `notification_type` ENUM 생성
- [ ] RLS 정책 설정
- [ ] 인덱스 생성

**스키마 구조**:
```sql
notifications (
  id UUID,
  user_id UUID,
  type notification_type,  -- ENUM
  title VARCHAR,
  message TEXT,
  link VARCHAR,
  is_read BOOLEAN,
  created_at TIMESTAMP,
  metadata JSONB
)
```

#### 4.2 알림 생성 트리거 (3시간)
- [ ] 팔로우한 이슈 새 댓글 시 알림 생성
- [ ] 팔로우한 이슈 새 후속 기사 시 알림 생성

**구현 방법**: PostgreSQL 트리거 함수

**확인 필요**: `issue_follows` 테이블 활용, 본인 제외 처리

#### 4.3 알림 API (3시간)
- [ ] `GET /api/my/notifications` - 알림 목록 (읽음/안읽음 필터)
- [ ] `PATCH /api/my/notifications/[id]` - 알림 읽음 처리
- [ ] `POST /api/my/notifications/mark-all-read` - 모두 읽음

#### 4.4 헤더 알림 아이콘 (4시간)
- [ ] `/components/notification-bell.tsx` - 종모양 아이콘 + 배지

**기능**:
- 읽지 않은 알림 수 표시 (빨간 점)
- 드롭다운: 최근 알림 5개 미리보기
- "모두 읽음" 버튼
- "전체 보기" 링크

**폴링**: 30초마다 알림 조회 (또는 Supabase Realtime 활용)

#### 4.5 알림 페이지 (3시간)
- [ ] `/app/my/notifications/page.tsx` - 알림 전체 목록

**기능**:
- 필터: 전체/읽지 않음
- 알림 클릭 시 해당 링크로 이동 + 읽음 처리
- 페이지네이션

#### 4.6 이메일 알림 (선택적, +8시간)
- [ ] Resend 계정 생성 및 API Key 설정
- [ ] `/lib/email.ts` - 이메일 발송 함수
- [ ] `/lib/email-templates.ts` - 이메일 템플릿
- [ ] Edge Function 또는 API Route로 트리거 연동
- [ ] `users.email_notifications_enabled` 컬럼 추가
- [ ] 설정 페이지에 이메일 알림 ON/OFF 추가

**확인 필요**: 이메일 발송 비용, 발신자 도메인 인증

### Phase 4 완료 체크리스트
- [ ] 알림 생성 트리거 동작 확인
- [ ] 읽음 처리 동작 확인
- [ ] 헤더 알림 아이콘 배지 업데이트 확인
- [ ] 실시간 폴링 확인
- [ ] 이메일 발송 테스트 (선택적)
- [ ] RLS 정책 테스트

### 다음 Phase 인수인계
- 알림 타입 ENUM 목록 및 추가 방법
- 트리거 함수 수정 가이드
- 이메일 템플릿 작성 가이드

---

## 👥 Phase 5: 소셜 기능 (2주일, ~20시간, 선택적)

### 목표
커뮤니티 강화 - 사용자 팔로우, 활동 피드

### ⚠️ 구현 전 검토 필요

**플랫폼 성격 고려**:
- Behind는 **이슈 중심** 플랫폼
- 사용자 팔로우가 실제로 필요한가?
- 이슈 팔로우만으로 충분하지 않은가?

### 작업 목록

#### 5.1 사용자 팔로우 DB 스키마 (2시간)
- [ ] `user_follows` 테이블 생성
- [ ] `users.follower_count`, `users.following_count` 컬럼 추가
- [ ] 트리거 함수

**스키마 구조**:
```sql
user_follows (
  id UUID,
  follower_id UUID,    -- 팔로우하는 사람
  following_id UUID,   -- 팔로우 당하는 사람
  created_at TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)  -- 자기 자신 팔로우 방지
)
```

#### 5.2 사용자 팔로우 API (3시간)
- [ ] `POST /api/users/[nickname]/follow`
- [ ] `DELETE /api/users/[nickname]/follow`
- [ ] `GET /api/users/[nickname]/followers` - 팔로워 목록
- [ ] `GET /api/users/[nickname]/following` - 팔로잉 목록

#### 5.3 활동 피드 (8시간)
- [ ] `GET /api/my/feed` - 팔로우한 사용자들의 최근 활동
- [ ] `/app/my/feed/page.tsx` - 피드 페이지

**피드 콘텐츠**: 댓글, 투표, 제보 등

#### 5.4 사용자 검색 (4시간)
- [ ] `GET /api/users/search?q={nickname}` - 닉네임 검색
- [ ] `/app/users/page.tsx` - 사용자 검색 페이지

#### 5.5 프로필 페이지 팔로우 버튼 (3시간)
- [ ] 사용자 프로필 페이지에 팔로우 버튼 추가

### Phase 5 완료 체크리스트
- [ ] 사용자 팔로우/언팔로우 동작 확인
- [ ] 팔로워/팔로잉 카운트 정확성 확인
- [ ] 활동 피드 표시 확인
- [ ] 사용자 검색 동작 확인

---

## 📊 전체 일정 요약

| Phase | 내용 | 예상 소요 | 우선순위 |
|-------|------|-----------|---------|
| Phase 1 | 기본 마이페이지 | 1주일 (15시간) | 🔴 필수 |
| Phase 2 | 이슈 팔로우 | 1주일 (13시간) | 🔴 필수 |
| Phase 3 | 추가 기능 | 1.5주일 (18시간) | 🟡 권장 |
| Phase 4 | 알림 시스템 | 2주일 (15-23시간) | 🟢 선택 |
| Phase 5 | 소셜 기능 | 2주일 (20시간) | 🟢 선택 |

**최소 구현** (Phase 1-2): 약 2주일
**권장 구현** (Phase 1-3): 약 3.5주일
**전체 구현** (Phase 1-5): 약 7.5주일

---

## 🔗 Phase 간 연결 & 의존성

### Phase 1 → Phase 2
- **전달 사항**: 마이페이지 레이아웃 구조, 사이드바 메뉴 추가 방법
- **의존성**: 없음 (독립적 진행 가능)

### Phase 2 → Phase 3
- **전달 사항**: `issue_follows` 테이블 구조, 팔로우 버튼 컴포넌트 재사용 가이드
- **의존성**: 없음 (독립적 진행 가능)

### Phase 2 → Phase 4
- **전달 사항**: 팔로우한 이슈 조회 방법, 이벤트 발생 시점 정리
- **의존성**: Phase 4의 알림 트리거가 `issue_follows` 테이블 참조

### Phase 3 → Phase 5
- **전달 사항**: 사용자 프로필 API 구조, 팔로우 버튼 컴포넌트 패턴
- **의존성**: Phase 5의 사용자 팔로우가 Phase 3의 프로필 페이지 활용

### Phase 4 → Phase 5
- **전달 사항**: 알림 생성 트리거 패턴, 알림 타입 추가 방법
- **의존성**: Phase 5에서 "사용자 팔로우" 알림 타입 추가 가능

---

## 🛠️ 공통 기술 스택 & 참고 사항

### 네이밍 컨벤션
| 항목 | 규칙 | 예시 |
|------|------|------|
| API URL | kebab-case | `/api/my-votes`, `/api/followed-issues` |
| 테이블 | snake_case, 복수형 | `issue_follows`, `notifications` |
| 컬럼 | snake_case | `created_at`, `user_id`, `is_read` |
| FK | `{테이블}_id` | `issue_id`, `user_id` |
| RPC 함수 | snake_case, `p_` prefix | `create_notification(p_user_id, p_type)` |
| 컴포넌트 파일 | kebab-case | `issue-follow-button.tsx` |
| 컴포넌트 함수 | PascalCase | `IssueFollowButton` |

### 공통 참고 파일
- **인증**: `/hooks/useAuth.ts`, `/lib/supabase/server.ts`
- **API 패턴**: `/app/api/auth/me/route.ts`, `/app/api/vote/route.ts`
- **에러 처리**: `/lib/api-error.ts`
- **보안**: `/lib/csrf.ts`, `/lib/sanitize.ts`
- **컴포넌트**: `/components/issue-card.tsx`, `/components/Header.tsx`

### DB 스키마 확인 쿼리
```sql
-- Supabase SQL Editor에서 실행
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = '{테이블명}'
ORDER BY ordinal_position;
```

### 마이그레이션 파일 명명 규칙
```
/supabase/migrations/YYYYMMDDHHMMSS_{설명}.sql

예시:
20251105000000_create_issue_follows.sql
20251106000000_create_notifications.sql
```

---

## ✅ 각 Phase 시작 전 체크리스트

- [ ] [DEVELOPMENT_NOTES.md](./DEVELOPMENT_NOTES.md) 읽음
- [ ] 이전 Phase 인수인계 사항 확인
- [ ] 관련 테이블 실제 스키마 확인 (Supabase SQL Editor)
- [ ] 유사한 기존 코드 3개 이상 찾아봄
- [ ] 네이밍 컨벤션 확인
- [ ] 불확실한 결정 사항은 사용자 검토 요청

---

## 📞 문의 및 인수인계

### Phase 완료 시 문서화 항목
1. **테이블 구조**: 생성한 테이블의 실제 스키마 (DDL)
2. **API 명세**: 엔드포인트 URL, 요청/응답 구조
3. **컴포넌트 Props**: 재사용 가능한 컴포넌트의 인터페이스
4. **주의사항**: 구현 중 발견한 이슈나 제약사항
5. **미완료 사항**: 다음 작업자가 이어서 해야 할 작업

### 인수인계 문서 위치
- 이 파일의 각 Phase 섹션에 추가
- 또는 별도 파일 생성: `docs/phase{N}-handover.md`

---

**문서 버전**: 2.0 (간소화)
**작성자**: Claude Code
**최종 업데이트**: 2025-11-04
