# Behind v2 - 출시 로드맵

**작성일**: 2025-11-30  
**상태**: 진행 중  
**목표**: 정식 서비스 출시

---

## 📊 현재 상태

**완료된 기능:**
- ✅ 핵심 기능 100% (이슈, 투표, 댓글, 채팅, 마이페이지, 어드민, 실시간 인기)
- ✅ 기본 배포 완료 (Vercel)
- ✅ 실시간 인기 이슈 관리 구현

**현재 URL:**
- https://behind-beta.vercel.app

**기술 스택:**
- Frontend: Next.js 15.5.4 (서버리스)
- Database: Supabase (PostgreSQL)
- Cache: Upstash Redis
- Deploy: Vercel

---

## 🤔 서버리스란? (개념 설명)

### 전통적인 서버 vs 서버리스

**전통 서버 = 식당을 24시간 운영**
- 손님 없어도 임대료, 전기세, 직원 급여 지불
- 월 고정 비용: 50,000원
- 서버 관리 필요 (업데이트, 보안, 장애 대응)

**서버리스 = 배달 전문점**
- 주문 들어올 때만 주방 가동
- 주문 없으면 비용 0원
- 사용한 만큼만 비용 지불
- 관리 불필요 (Vercel이 알아서)

### Behind의 서버리스 구조

```
사용자 방문
    ↓
Vercel이 자동으로 서버 실행 (0.1초)
    ↓
DB 조회 (Supabase)
    ↓
페이지 전송
    ↓
서버 자동 종료
```

**비용 예시:**
- 하루 방문자 100명 → 무료
- 하루 방문자 1,000명 → 무료
- 하루 방문자 10,000명 → 월 5,000원

**장점:**
- 초기 비용 0원
- 자동 확장 (트래픽 급증 대응)
- 관리 불필요

**단점:**
- Cold Start (첫 요청 3-5초 지연)
- 복잡한 작업 제한 (10초 제한)

**Behind에 적합한가?**
✅ 매우 적합 (초기 트래픽 적음, 단순 CRUD)

---

## 🚀 출시 로드맵

### Week 1: 출시 준비

#### Day 1-2: 인프라 & 최적화

**도메인 설정**
- [ ] 도메인 구입 (behind.kr 또는 behind.site)
  - 가격: 연 10,000~15,000원
  - 구입처: 가비아, 호스팅케이알
- [ ] Vercel 도메인 연결
  - Vercel Dashboard → Settings → Domains
  - DNS 레코드 자동 설정
  - SSL 인증서 자동 발급 (Let's Encrypt, 무료)

**환경 변수 점검**
- [ ] Vercel Dashboard → Settings → Environment Variables 확인
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - UPSTASH_REDIS_REST_URL
  - UPSTASH_REDIS_REST_TOKEN
  - NEXT_PUBLIC_BASE_URL (도메인으로 변경)
  - ADMIN_PASSWORD (강화된 비밀번호)

**DB 인덱스 추가 (성능 최적화)**
- [ ] Supabase SQL Editor에서 다음 SQL 실행 (10분)

```sql
-- 이슈 조회 최적화
CREATE INDEX IF NOT EXISTS idx_issues_status_approval 
ON issues(status, approval_status);

CREATE INDEX IF NOT EXISTS idx_issues_created_at 
ON issues(created_at DESC);

-- 댓글 조회 최적화
CREATE INDEX IF NOT EXISTS idx_comments_issue_id_created 
ON comments(issue_id, created_at DESC);

-- 투표 조회 최적화
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_user 
ON poll_votes(poll_id, user_id);

-- 마이페이지 최적화
CREATE INDEX IF NOT EXISTS idx_comments_user_id 
ON comments(user_id, created_at DESC);

-- 팔로우 조회 최적화
CREATE INDEX IF NOT EXISTS idx_issue_follows_user 
ON issue_follows(user_id, created_at DESC);

-- 제보 조회 최적화
CREATE INDEX IF NOT EXISTS idx_reports_visibility 
ON reports(visibility, created_at DESC);
```

**Supabase 사용량 확인**
- [ ] Supabase Dashboard → Settings → Usage
  - DB 크기: 500MB 제한 확인
  - 월간 대역폭: 5GB 제한 확인
  - 동시 연결: 60개 제한 확인

**Cold Start 해결 (Keep-Alive 크론잡)**
- [ ] 프로젝트 루트에 `vercel.json` 파일 생성 (1시간)

```json
{
  "crons": [{
    "path": "/api/health",
    "schedule": "*/5 * * * *"
  }]
}
```

- [ ] `app/api/health/route.ts` 파일 생성

```typescript
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  })
}
```

- [ ] Git 커밋 및 배포

```bash
git add vercel.json app/api/health
git commit -m "feat: Cold Start 해결을 위한 Health Check API 추가"
git push origin develop
git checkout main
git merge develop
git push origin main
git checkout develop
```

---

#### Day 3-4: 데이터 정리

**테스트 데이터 삭제**
- [ ] Supabase SQL Editor에서 다음 SQL 실행 (30분)

```sql
-- 1. 테스트 이슈 삭제
DELETE FROM issues WHERE approval_status = 'pending';
DELETE FROM issues WHERE title LIKE '%테스트%';

-- 2. 테스트 댓글 삭제
DELETE FROM comments WHERE issue_id IN (
  SELECT id FROM issues WHERE title LIKE '%테스트%'
);

-- 3. 테스트 투표 삭제
DELETE FROM poll_votes WHERE poll_id IN (
  SELECT id FROM polls WHERE issue_id IN (
    SELECT id FROM issues WHERE title LIKE '%테스트%'
  )
);

-- 4. 테스트 제보 삭제
DELETE FROM reports WHERE title LIKE '%테스트%';

-- 5. 실시간 인기 이슈 초기화
UPDATE admin_settings 
SET value = '{
  "slot_1": null,
  "slot_2": null,
  "slot_3": null,
  "slot_4": null,
  "slot_5": null
}'::jsonb
WHERE key = 'realtime_trending';

-- 6. 확인
SELECT COUNT(*) as issue_count FROM issues;
SELECT COUNT(*) as comment_count FROM comments;
SELECT COUNT(*) as report_count FROM reports;
```

**실제 이슈 등록**
- [ ] 실제 사회 이슈 5-10개 선정
- [ ] 어드민에서 이슈 등록
  - 제목, 미리보기, 요약 작성
  - 카테고리 선택
  - 썸네일 이미지 추가 (선택)
  - 투표 질문 및 옵션 추가 (선택)
  - 승인 상태: approved
  - 노출 상태: active

**실시간 인기 이슈 설정**
- [ ] 어드민 → 실시간 인기 이슈 관리
- [ ] 5개 슬롯 설정 (변동 수치 포함)
- [ ] 저장 후 홈페이지 확인

**쿼리 성능 측정**
- [ ] Supabase Dashboard → Database → Query Performance
- [ ] 느린 쿼리 확인 (30분)

```sql
-- 예시: 이슈 조회 성능 측정
EXPLAIN ANALYZE 
SELECT * FROM issues 
WHERE status = 'active' 
AND approval_status = 'approved'
ORDER BY created_at DESC
LIMIT 20;
```

---

#### Day 5-7: UI 개선 (Priority 1)

**홈페이지 히어로 섹션 추가**
- [ ] 서비스 소개 문구
- [ ] CTA 버튼 (이슈 둘러보기, 제보하기)
- [ ] 디자인: 그라데이션 배경, 큰 타이포그래피

**로딩 스켈레톤 UI**
- [ ] 이슈 카드 스켈레톤
- [ ] 댓글 목록 스켈레톤
- [ ] 투표 카드 스켈레톤

**반응형 개선**
- [ ] 모바일 네비게이션 개선
- [ ] 터치 제스처 최적화
- [ ] 태블릿 레이아웃 조정

**이미지 최적화**
- [ ] `<img>` 태그 → Next.js `<Image>` 컴포넌트로 변경 (1시간)

```typescript
// Before
<img src="/thumbnail.jpg" alt="썸네일" />

// After
import Image from 'next/image'

<Image 
  src="/thumbnail.jpg" 
  width={400} 
  height={300} 
  alt="썸네일"
  priority={false}
  loading="lazy"
/>
```

**예상 소요 시간:** 2-3일

---

### Week 2: 소프트 런칭

#### Day 1-2: 필수 페이지

**약관 페이지 생성**
- [ ] `app/terms/page.tsx` - 이용약관 (1시간)
- [ ] `app/privacy/page.tsx` - 개인정보처리방침 (1시간)
- [ ] 푸터에 링크 추가

**에러 페이지**
- [ ] `app/not-found.tsx` - 404 페이지 (30분)
- [ ] `app/error.tsx` - 에러 페이지 (30분)

**푸터 개선**
- [ ] 회사/서비스 정보
- [ ] 문의하기 이메일
- [ ] 약관/개인정보처리방침 링크
- [ ] SNS 링크 (선택)

**SEO 최적화**
- [ ] `app/layout.tsx` 메타데이터 개선 (30분)

```typescript
export const metadata = {
  title: 'Behind - 사회 이슈 토론 플랫폼',
  description: '숨겨진 이야기를 공유하고 토론하세요',
  keywords: '사회이슈, 토론, 투표, 뉴스, 커뮤니티',
  authors: [{ name: 'Behind Team' }],
  openGraph: {
    title: 'Behind - 사회 이슈 토론 플랫폼',
    description: '숨겨진 이야기를 공유하고 토론하세요',
    url: 'https://behind.kr',
    siteName: 'Behind',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      }
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Behind',
    description: '사회 이슈 토론 플랫폼',
    images: ['/og-image.png'],
  },
}
```

- [ ] OG 이미지 제작 (1200x630px)

**Rate Limiting 설정 재확인**
- [ ] `lib/rate-limiter.ts` 검토 (30분)
- [ ] 현재: 분당 10회, 시간당 100회
- [ ] 적절한지 검토 후 조정

---

#### Day 3-4: 모니터링 & 보안

**Google Analytics 4 설정**
- [ ] GA4 계정 생성 (무료)
- [ ] 추적 ID 발급
- [ ] `app/layout.tsx`에 스크립트 추가 (30분)

```typescript
import Script from 'next/script'

export default function RootLayout() {
  return (
    <html>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Sentry 설정 (에러 추적)**
- [ ] Sentry 계정 생성 (무료: 월 5,000 에러)
- [ ] Next.js 프로젝트 연동 (30분)

```bash
npx @sentry/wizard@latest -i nextjs
```

- [ ] `.env.local`에 Sentry DSN 추가
- [ ] Vercel 환경 변수에도 추가

**Vercel Analytics 활성화**
- [ ] Vercel Dashboard → Analytics → Enable (무료)

**Admin 비밀번호 강화**
- [ ] 최소 12자, 특수문자 포함 비밀번호 생성 (30분)
- [ ] Vercel 환경 변수 업데이트

```
# 예시 (실제로는 더 복잡하게)
ADMIN_PASSWORD=Behind2025!@#$SecurePass
```

**보안 점검 (OWASP Top 10)**
- [ ] SQL Injection 방지 확인 (Supabase 자동 방어)
- [ ] XSS 방지 확인 (React 자동 이스케이프)
- [ ] CSRF 방지 확인 (완료)
- [ ] Rate Limiting 확인 (완료)
- [ ] 환경 변수 노출 확인
  - `.env.local` 파일이 `.gitignore`에 포함되었는지
  - 클라이언트 코드에 민감 정보 노출 없는지
- [ ] 민감 정보 로그 확인
  - `console.log`에 비밀번호, 토큰 출력 없는지

---

#### Day 5-7: 베타 테스트 & 성능 측정

**베타 테스트 진행**
- [ ] 지인 10-20명 초대
- [ ] 피드백 양식 준비 (Google Forms)
  - 사용성 평가
  - 버그 제보
  - 개선 제안
- [ ] 피드백 수집 및 분류

**Lighthouse 점수 측정**
- [ ] Chrome DevTools → Lighthouse 실행 (30분)
- [ ] 목표 점수:
  - Performance: 90+
  - Accessibility: 90+
  - Best Practices: 90+
  - SEO: 90+

**Core Web Vitals 개선**
- [ ] LCP (Largest Contentful Paint): < 2.5초
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1
- [ ] 개선 방법:
  - 이미지 최적화 (Next.js Image)
  - 폰트 최적화 (next/font)
  - 코드 스플리팅 (자동)

**버그 수정**
- [ ] 베타 테스트 피드백 반영
- [ ] 치명적 버그 우선 수정
- [ ] UI/UX 개선사항 반영

---

### Week 3-4: 정식 출시

#### 출시 전 최종 점검

**프로덕션 DB 백업 설정**
- [ ] Supabase Dashboard → Database → Backups (30분)
- [ ] 자동 백업 활성화 (무료 플랜: 7일 보관)
- [ ] 수동 백업 1회 실행

**모니터링 알림 설정**
- [ ] Sentry: 에러 발생 시 이메일 알림 (30분)
- [ ] Vercel: 배포 실패 시 알림
- [ ] UptimeRobot 설정 (무료)
  - 사이트 다운 시 알림
  - 5분마다 체크
  - 이메일/SMS 알림

**장애 대응 매뉴얼 작성**
- [ ] 문서 작성: `docs/INCIDENT_RESPONSE.md`

```markdown
# 장애 대응 매뉴얼

## 사이트 접속 불가
1. Vercel 상태 확인: https://www.vercel-status.com
2. Vercel Dashboard → Deployments 확인
3. 최근 배포 롤백: Vercel Dashboard → Rollback

## DB 오류
1. Supabase 상태 확인: https://status.supabase.com
2. Supabase Dashboard → Database → Logs 확인
3. 연결 수 확인: 60개 제한 초과 여부

## 느린 응답
1. Supabase Dashboard → Database → Query Performance
2. 느린 쿼리 확인 및 최적화
3. 인덱스 추가 검토

## Rate Limit 초과
1. Upstash Dashboard 확인
2. 제한 완화 또는 유료 플랜 검토

## 연락처
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.com
```

**최종 체크리스트**
- [ ] 모든 페이지 접속 확인
- [ ] 회원가입/로그인 테스트
- [ ] 이슈 생성/수정/삭제 테스트
- [ ] 댓글 작성/삭제 테스트
- [ ] 투표 참여 테스트
- [ ] 채팅 참여 테스트
- [ ] 마이페이지 확인
- [ ] 어드민 기능 확인
- [ ] 실시간 인기 이슈 확인
- [ ] 모바일 반응형 확인

---

#### 마케팅 & 홍보

**SNS 홍보**
- [ ] 트위터 계정 생성
- [ ] 인스타그램 계정 생성
- [ ] 페이스북 페이지 생성
- [ ] 출시 공지 게시

**커뮤니티 공유**
- [ ] 관련 커뮤니티 소개 (예: 오픈채팅, 디스코드)
- [ ] Product Hunt 등록 (선택)
- [ ] GeekNews 공유 (선택)

**언론사 보도자료**
- [ ] 보도자료 작성
- [ ] 주요 IT 매체 발송
  - 테크크런치
  - 벤처스퀘어
  - 플래텀

---

## 💰 예상 비용

### 초기 비용 (출시 시점)

| 항목 | 비용 | 주기 |
|------|------|------|
| 도메인 (behind.kr) | 15,000원 | 연간 |
| Vercel (Hobby) | 무료 | 월간 |
| Supabase (Free) | 무료 | 월간 |
| Upstash Redis | 무료 | 월간 |
| Google Analytics | 무료 | - |
| Sentry | 무료 | 월간 |
| UptimeRobot | 무료 | 월간 |
| **합계** | **15,000원** | **연간** |

### 트래픽 증가 시 (월 방문자 기준)

| 방문자 수 | 예상 비용 | 필요 조치 |
|-----------|-----------|-----------|
| ~10,000명 | 무료 | 조치 불필요 |
| ~50,000명 | 월 5,000원 | Vercel 사용량 증가 |
| ~100,000명 | 월 20,000원 | Vercel Pro 고려 ($20) |
| ~500,000명 | 월 50,000원 | Supabase Pro ($25) |
| 1,000,000명+ | 월 100,000원+ | 전체 플랫폼 업그레이드 |

### 서비스 제한 (무료 플랜)

**Vercel (Hobby):**
- 대역폭: 월 100GB
- 실행 시간: 100시간
- 빌드: 월 100분

**Supabase (Free):**
- DB 크기: 500MB
- 대역폭: 월 5GB
- 동시 연결: 60개
- 백업: 7일 보관

**Upstash Redis:**
- 명령: 일 10,000개
- 데이터: 256MB
- 대역폭: 월 200MB

---

## 🛠️ 유지보수 계획

### 일일 체크 (매일 5분)

- [ ] 사이트 접속 확인
- [ ] Sentry 에러 확인
- [ ] 신규 제보 이슈 검토

### 주간 체크 (매주 30분)

- [ ] Google Analytics 트래픽 확인
- [ ] Supabase 사용량 확인 (DB, 대역폭)
- [ ] Vercel 사용량 확인
- [ ] 느린 쿼리 확인
- [ ] 백업 상태 확인

### 월간 체크 (매월 1시간)

- [ ] 전체 기능 테스트
- [ ] 보안 업데이트 확인
- [ ] 종속성 업데이트 (`npm audit`)
- [ ] DB 정리 (오래된 데이터)
- [ ] 성능 측정 (Lighthouse)

---

## 📚 참고 문서

- **HANDOVER.md** - 인수인계 문서
- **DEVELOPMENT_NOTES.md** - 개발 규칙
- **README.md** - 프로젝트 개요
- **ADMIN_GUIDE.md** - 관리자 가이드

---

## ✅ 진행 상황 추적

### Week 1 진행률: 0%
- [ ] Day 1-2: 인프라 & 최적화 (0/6)
- [ ] Day 3-4: 데이터 정리 (0/4)
- [ ] Day 5-7: UI 개선 (0/4)

### Week 2 진행률: 0%
- [ ] Day 1-2: 필수 페이지 (0/5)
- [ ] Day 3-4: 모니터링 & 보안 (0/6)
- [ ] Day 5-7: 베타 테스트 (0/4)

### Week 3-4 진행률: 0%
- [ ] 출시 전 최종 점검 (0/4)
- [ ] 마케팅 & 홍보 (0/3)

---

## 🎯 다음 작업

**즉시 시작 가능:**
1. DB 인덱스 추가 (10분)
2. 환경 변수 확인 (5분)
3. Supabase 사용량 확인 (5분)

**우선순위 높음:**
1. Cold Start 해결 (1시간)
2. 데이터 정리 (30분)
3. 도메인 구입 (10분)

---

**마지막 업데이트**: 2025-11-30  
**작성자**: Jaden + Claude  
**다음 리뷰**: Week 1 완료 후